const { GoogleGenAI } = require("@google/genai");

// Try without apiKey but with httpOptions.headers.Authorization
const ai = new GoogleGenAI({ 
    httpOptions: {
        headers: {
            "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
        }
    }
});
ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "hello"
}).then(console.log).catch(console.error);
