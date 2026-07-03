const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY
});
ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: "hello"
}).then(console.log).catch(console.error);
