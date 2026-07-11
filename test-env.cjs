const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});
ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" }).then(res => console.log("SUCCESS", res.text.slice(0, 20))).catch(e => console.error("ERROR", e.message));
