const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
ai.interactions.create({ model: "gemini-3.5-flash", input: "hi" }).then(res => console.log("SUCCESS", res.output_text)).catch(e => console.error("ERROR", e.message));
