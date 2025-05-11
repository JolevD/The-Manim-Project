const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()

const PORT = 3000

app.use(express.json())

// 1. Generate a dynamic “template” blueprint
app.post('/template', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const template = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2048,
        system: TEMPLATE_SYSTEM_PROMPT,      // system-level instructions
        messages: [
            { role: 'user', content: prompt }, // raw user prompt
        ],
    });

    console.log(template)
    res.json({ template: template.choices?.[0]?.message?.content });
});

app.listen(PORT, () => {
    console.log('app is running on port 3000');
})