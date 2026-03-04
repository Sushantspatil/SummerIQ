const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

// Get the key from .env or argument
const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API key found. Pass it as an argument: node diagnose-gemini.js YOUR_KEY");
    process.exit(1);
}

async function diagnose() {
    console.log("--- Diagnosing Gemini API ---");
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("\n1. Testing 'gemini-1.5-flash'...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success! Response:", result.response.text());
    } catch (e) {
        console.error("Failed with 'gemini-1.5-flash':", e.message);
    }

    try {
        console.log("\n2. Testing 'gemini-pro'...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success! Response:", result.response.text());
    } catch (e) {
        console.error("Failed with 'gemini-pro':", e.message);
    }

    try {
        console.log("\n3. Testing 'gemini-1.0-pro'...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success! Response:", result.response.text());
    } catch (e) {
        console.error("Failed with 'gemini-1.0-pro':", e.message);
    }

    console.log("\n--- Diagnosis Complete ---");
}

diagnose();
