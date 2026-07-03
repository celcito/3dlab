const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
});
ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "hello"
}).then(console.log).catch(console.error);
