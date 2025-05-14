require('dotenv').config()
 import express from 'express'
 import path from 'path'
 import fs from 'fs'
const analysis = require('../templates/analysis-template.ts')
import Anthropic from '@anthropic-ai/sdk';
import { validateAnalysis } from './utils/ajvValidator'


const app = express()

const PORT = 3000

app.use(express.json())

const anthropic = new Anthropic();

// 1. Generate a dynamic “template” blueprint
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // 1. Acknowledge immediately
    res.write(JSON.stringify({
        type: 'acknowledgment',
        message: analysis.ANALYSIS_UI_MESSAGES.acknowledgment(prompt),
    }) + '\n');

    // 2. Tell client you’re processing the analysis
    res.write(JSON.stringify({
        type: 'status',
        message: analysis.ANALYSIS_UI_MESSAGES.processing(),
    }) + '\n');

    try {
        // 1. ANALYSIS PHASE
        const analysisAi = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 2048,
            messages: [
                { role: 'system', content: analysis.getAnalysisSystemPrompt(false) },
                { role: 'user', content: prompt },
            ],
        });
        const analysisText = analysisAi.choices[0].message.content;
        let analysisJson;
        try {
            analysisJson = JSON.parse(analysisText);
        } catch {
            return res.status(422).json({ error: 'Invalid JSON from analysis phase' });
        }
        if (!validateAnalysis(analysisJson)) {
            return res.status(422).json({ error: 'Analysis schema error', details: validateAnalysis.errors });
        }

        // 2. TEMPLATE PHASE
        const templateAi = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 2048,
            messages: [
                { role: 'system', content: TEMPLATE_SYSTEM_PROMPT },
                { role: 'user', content: JSON.stringify(analysisJson) },
            ],
        });
        const templateText = templateAi.choices[0].message.content;
        let templateJson;
        try {
            templateJson = JSON.parse(templateText);
        } catch {
            return res.status(422).json({ error: 'Invalid JSON from template phase' });
        }
        if (!validateTemplate(templateJson)) {
            return res.status(422).json({ error: 'Template schema error', details: validateTemplate.errors });
        }

        // 3. CODEGEN PHASE
        const codeAi = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 2048,
            messages: [
                { role: 'system', content: CODEGEN_SYSTEM_PROMPT },
                { role: 'user', content: JSON.stringify(templateJson) },
            ],
        });
        const codeText = codeAi.choices[0].message.content;

        res.write(JSON.stringify({
            type: 'code',
            payload: codeText,
        }) + '\n');

        // 2) Persist to disk for Docker worker
        const sceneFile = path.join(__dirname, '../../render-worker/scene.py');
        fs.writeFileSync(sceneFile, codeText, 'utf8');


        res.write(JSON.stringify({
            type: 'status',
            message: RENDER_UI_MESSAGES.rendering(),
        }) + '\n');
        // pass the gen_codeResponse to docker 
        // console.log(analysis)
        // res.json({ analysis: analysis.choices?.[0]?.message?.content });
    }
    catch (error) {
        console.log(error)
    }
});

app.listen(PORT, () => {
    console.log('app is running on port 3000');
})