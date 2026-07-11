const { GoogleGenAI } = require("@google/genai");
const http = require("http");

const server = http.createServer((req, res) => {
  console.log("HEADERS:", req.headers);
  res.writeHead(200);
  res.end("{}");
});
server.listen(3001, async () => {
  const ai = new GoogleGenAI({
    apiKey: "AQ.Ab...",
    httpOptions: { 
      baseUrl: "http://localhost:3001",
      headers: { 'Authorization': 'Bearer AQ.Ab...' }
    }
  });
  try {
    await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" });
  } catch (e) {
  }
  server.close();
});
