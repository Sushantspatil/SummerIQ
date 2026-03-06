const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SummarizerManager } = require('node-summarizer');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Local TextRank Summarizer (No API needed) ──────────────────────────────
async function localSummary(transcript) {
    // 12 sentences gives a much richer, fuller summary
    const summarizer = new SummarizerManager(transcript, 12);
    const result = await summarizer.getSummaryByRank();
    if (!result || !result.summary) throw new Error("Local summarizer returned empty");
    return result.summary;
}

// ─── Main Route ─────────────────────────────────────────────────────────────
app.post('/api/summary', async (req, res) => {
    const { transcript, apiKey } = req.body;

    if (!transcript || transcript.trim().length < 20) {
        return res.status(400).json({ error: 'Transcript is too short to summarize.' });
    }

    let finalSummary = "";
    let methodUsed = "";

    try {
        // 1. Try OpenAI if a valid key is provided
        if (apiKey && apiKey.trim().startsWith('sk-')) {
            try {
                console.log("Trying OpenAI...");
                const openai = new OpenAI({ apiKey: apiKey.trim() });
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a professional event insights analyst. The transcript may be in mixed languages (English, Hindi, and Marathi). First, internally translate any non-English parts to English, then synthesize the entire context into one dense, flawless paragraph of professional insights in English. No bullet points." },
                        { role: "user", content: `TRANSCRIPT (potentially mixed English/Hindi/Marathi):\n\n${transcript}` }
                    ],
                    temperature: 0.7,
                });
                finalSummary = response.choices[0].message.content;
                methodUsed = "OpenAI GPT-4o-mini";
            } catch (err) {
                console.warn("OpenAI failed:", err.message, "→ falling back to local...");
            }
        }

        // 2. Try Gemini if a valid key is provided and OpenAI didn't work
        if (!finalSummary && apiKey && apiKey.trim().startsWith('AIza')) {
            const genAI = new GoogleGenerativeAI(apiKey.trim());
            const modelsToTry = ["gemini-2.0-flash", "gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro"];
            for (const modelName of modelsToTry) {
                try {
                    console.log(`Trying Gemini model: ${modelName}...`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(`The following transcript is from an Indian event and contains a mix of English, Hindi, and Marathi. 
                    1. Translate all non-English parts to English.
                    2. Synthesize the total translated transcript into one dense, professional insights paragraph in English.
                    
                    TRANSCRIPT:\n\n${transcript}`);
                    const text = result.response.text();
                    if (text) {
                        finalSummary = text;
                        methodUsed = `Gemini (${modelName})`;
                        break;
                    }
                } catch (err) {
                    console.warn(`Gemini (${modelName}) failed: ${err.message}`);
                }
            }
        }

        // 3. ALWAYS use local fallback if APIs failed or no key given
        if (!finalSummary) {
            console.log("Using Local TextRank summarizer...");
            finalSummary = await localSummary(transcript);
            methodUsed = "Local (TextRank)";
        }

        console.log(`Summary generated via: ${methodUsed}`);
        return res.json({ summary: finalSummary, method: methodUsed });

    } catch (err) {
        console.error("All methods failed:", err.message);
        return res.status(500).json({ error: "Summarization failed", details: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
