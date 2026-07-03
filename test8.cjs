const { GoogleGenAI } = require("@google/genai");

const token = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ 
    apiKey: "dummy",
    httpOptions: {
        headers: {
            "Authorization": `Bearer ${token}`,
            "x-goog-api-key": ""
        }
    }
});
ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "hello"
}).then(console.log).catch(console.error);
