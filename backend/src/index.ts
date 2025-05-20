require("dotenv").config();

import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getAnalysisSystemPrompt, ANALYSIS_UI_MESSAGES, RENDER_UI_MESSAGES } from "./templates/analysis-template";
import { validateAnalysis } from "./utils/ajvValidator";
import fs from "fs";
import path from "path";

import cors from "cors";
import { TextBlock } from "@anthropic-ai/sdk/resources/messages";
import { getTemplateSystemPrompt, SYSTEM_TEMPLATE_PROMPT } from "./templates/manim-template";

const anthropic = new Anthropic();
const app = express();
app.use(cors())
app.use(express.json())


app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;
    if (!prompt) {
         res.status(400).json({ error: "Prompt is required" });
    }

      // 1. Acknowledge immediately
    res.write(JSON.stringify({
        type: 'acknowledgment',
        message: ANALYSIS_UI_MESSAGES.acknowledgment(prompt),
    }) + '\n');

    // 2. Tell client you’re processing the analysis
    res.write(JSON.stringify({
        type: 'status',
        message: ANALYSIS_UI_MESSAGES.processing(),
    }) + '\n');

    try {
        // 1. ANALYSIS PHASE
        const analysisAi = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 2048,
            system: getAnalysisSystemPrompt(false),
            messages: [
                { role: 'user', content: prompt },
            ],
        });
        const analysisText = (analysisAi.content[0] as TextBlock).text
        let analysisJson;
        try {
            analysisJson = JSON.parse(analysisText);
        } catch {
             res.status(422).json({ error: 'Invalid JSON from analysis phase' });
        }
        if (!validateAnalysis(analysisJson)) {
             res.status(422).json({ error: 'Analysis schema error', details: validateAnalysis.errors });
        }

        // 2. TEMPLATE PHASE
        const templateAi = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 2048,
            system: getTemplateSystemPrompt(false),
            messages: [
                { role: 'user', content: JSON.stringify(analysisJson) },
            ],
        });
        const templateText = (templateAi.content[0] as TextBlock).text
        let templateJson;
        try {
            templateJson = JSON.parse(templateText);
        } catch {
             res.status(422).json({ error: 'Invalid JSON from template phase' });
        }
        if (!validateTemplate(templateJson)) {
             res.status(422).json({ error: 'Template schema error', details: validateTemplate.errors });
        }

        // 3. CODEGEN PHASE
        const codeAi = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 2048,
            system: CODEGEN_SYSTEM_PROMPT,
            messages: [
                { role: 'user', content: JSON.stringify(templateJson) },
            ],
        });
        const codeText = (codeAi.content[0] as TextBlock).text

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
        res.end();
        // pass the gen_codeResponse to docker 
        // console.log(analysis)
        // res.json({ analysis: analysis.choices?.[0]?.message?.content });
    }
    catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.write(JSON.stringify({ 
        type: 'error',
        message: errorMessage 
    }) + '\n');
        res.end();
    }
})
