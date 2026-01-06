require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow frontend to call backend
app.use(express.json());

// Hugging Face API Configuration
const HF_API_URL = "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base";
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

// Health Check Route
app.get('/', (req, res) => {
    res.send('Nirvyatha Backend is Analysis Service is Running. POST to /chat to analyze emotions.');
});

// API Route
app.post('/chat', async (req, res) => {
    console.log(`[API] Received request: ${JSON.stringify(req.body)}`); // Debug Log
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text input required" });
        }

        if (!HF_TOKEN) {
            console.warn("Missing HUGGING_FACE_TOKEN in .env");
            return res.status(500).json({ error: "Server misconfiguration: Missing Token" });
        }

        const response = await fetch(HF_API_URL, {
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: text }),
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // The model returns an array of objects: [[{label: 'joy', score: 0.9}, ...]]
        // We want the top emotion
        const emotions = result[0];
        // Sort by score descending
        emotions.sort((a, b) => b.score - a.score);
        const topEmotion = emotions[0].label;

        // Map model outputs to Nirvyatha persona keys
        // Model labels: anger, disgust, fear, joy, neutral, sadness, surprise
        let mappedEmotion = 'neutral';
        switch (topEmotion) {
            case 'anger':
            case 'disgust':
                mappedEmotion = 'angry';
                break;
            case 'fear':
                mappedEmotion = 'anxious';
                break;
            case 'sadness':
                mappedEmotion = 'sad';
                break;
            case 'joy':
                mappedEmotion = 'happy';
                break;
            case 'surprise':
            case 'neutral':
            default:
                mappedEmotion = 'neutral';
        }

        console.log(`[API] Success! Mapped: ${mappedEmotion} (Raw: ${topEmotion})`);
        res.json({ emotion: mappedEmotion, raw: topEmotion });

    } catch (error) {
        console.error("HF API Error:", error.message);
        res.status(500).json({ error: "Failed to analyze emotion" });
    }
});

app.listen(PORT, () => {
    console.log(`Nirvyatha Backend running on http://localhost:${PORT}`);
    console.log(`[Config] Using AI Model: ${HF_API_URL}`);
    console.log("Ensure you have a .env file with HUGGING_FACE_TOKEN");
});
