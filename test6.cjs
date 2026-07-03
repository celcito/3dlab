const { GoogleGenAI } = require("@google/genai");

// Try removing GEMINI_API_KEY from env, and pass it as Authorization
const token = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = "";
process.env.GOOGLE_API_KEY = "";

const ai = new GoogleGenAI({ 
    httpOptions: {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }
});
ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "hello"
}).then(console.log).catch(console.error);
