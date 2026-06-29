import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Figures Generation API
  app.post("/api/ai-figures/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are an expert prompt engineer for 3D generation AI models (like Meshy, Luma, etc.).
Your task is to take the user's idea for a 3D figure and convert it into a highly detailed, optimized prompt.
The output prompt should focus on style, pose, details, textures, and specify if it has a base or no base.
Return only the optimized prompt.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
        }
      });

      res.json({ optimizedPrompt: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate prompt" });
    }
  });

  // Image-to-3D API (proxy to Python FastAPI service)
  const IMG2_3D_PY_URL = process.env.IMG2_3D_PY_URL || "http://127.0.0.1:8001";
  const JOBS_DIR = path.join(process.cwd(), "tmp", "jobs");
  fs.mkdirSync(JOBS_DIR, { recursive: true });

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/api/img2-3d/generate", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("image", blob, req.file.originalname || "input.png");

      const response = await fetch(`${IMG2_3D_PY_URL}/generate`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Image-to-3D proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to start generation" });
    }
  });

  app.get("/api/img2-3d/:id/sse", async (req, res) => {
    try {
      const jobId = req.params.id;
      const url = `${IMG2_3D_PY_URL}/jobs/${jobId}/stream`;

      const response = await fetch(url, {
        headers: { Accept: "text/event-stream" },
      });

      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).json({ error: text });
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const reader = response.body?.getReader();
      if (!reader) {
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      req.on("close", () => reader.cancel());

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch (e) {
        // client disconnected
      } finally {
        reader.cancel();
        res.end();
      }
    } catch (error: any) {
      console.error("SSE proxy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/img2-3d/:id/status", async (req, res) => {
    try {
      const jobId = req.params.id;
      const url = `${IMG2_3D_PY_URL}/jobs/${jobId}/status`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Status proxy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/img2-3d/:id/result/:format", (req, res) => {
    const { id, format } = req.params;
    if (!["glb", "obj", "stl"].includes(format)) {
      return res.status(400).json({ error: "Format must be glb, obj, or stl" });
    }
    const filePath = path.join(JOBS_DIR, id, `model.${format}`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: model.${format}` });
    }
    const contentTypes: Record<string, string> = {
      glb: "model/gltf-binary",
      obj: "text/plain",
      stl: "application/sla",
    };
    res.setHeader("Content-Type", contentTypes[format] || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="model.${format}"`);
    fs.createReadStream(filePath).pipe(res);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
