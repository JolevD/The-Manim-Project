const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()

const PORT = 3000

app.use(express.json())

app.post('/generate', (req, res) => {
    const { prompt } = req.body

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const sceneContent = `prompt: ${prompt}\n`;

    const scenePath = path.join(__dirname, "scene.py")

    fs.writeFile(scenePath, sceneContent, (err) => {
        if (err) {
            console.log('error while writing the scene.py')
            return res.status(500).json({ error: 'Failed to write scene.py' });
        }

        res.json({ message: 'scene.py generated successfully' });
    })

})

app.listen(PORT, () => {
    console.log('app is running on port 3000');
})