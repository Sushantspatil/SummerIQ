const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_FALLBACK_KEY_HERE");

app.post('/api/summary', async (req, res) => {
    const { transcript, apiKey } = req.body;

    if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
    }

    try {
        // Optionally use the client-provided key if available, otherwise fallback to server env
        const activeGenAI = apiKey ? new GoogleGenerativeAI(apiKey) : genAI;
        const model = activeGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = [
            "You are a professional event summarizer. Analyze the following Q&A session transcript and provide a single, dense, professional paragraph that captures all key insights, technical details, and strategic takeaways. Avoid bullet points or multiple paragraphs. Write in a formal, expert tone.\n\nTRANSCRIPT:\n",
            transcript
        ].join("");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summaryText = response.text();

        res.json({ summary: summaryText });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
