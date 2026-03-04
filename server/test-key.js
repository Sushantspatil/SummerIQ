const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

// Use the API key provided as an argument
const apiKey = process.argv[2];

if (!apiKey) {
    console.error("Please provide an API key as an argument.");
    process.exit(1);
}

async function list() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // The listModels method might be on the genAI instance or require a specific client
        // In @google/generative-ai, listing models isn't directly exposed in the same way as generation.
        // We'll try a simple generateContent call with a very short prompt to test the key instead.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success with gemini-1.5-flash:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e.message);
        if (e.response) console.error("Details:", JSON.stringify(e.response, null, 2));
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success with gemini-2.0-flash:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-2.0-flash:", e.message);
    }
}

list();
