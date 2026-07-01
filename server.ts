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

      const mcResolution = req.body.mcResolution || 256;

      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("image", blob, req.file.originalname || "input.png");

      const response = await fetch(`${IMG2_3D_PY_URL}/generate?mc_resolution=${mcResolution}`, {
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

  // Server-side decimation proxy
  app.post("/api/decimate", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Mesh file is required" });
      }
      const ratio = parseFloat(req.body.ratio) || 0.5;
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "application/octet-stream" });
      formData.append("file", blob, req.file.originalname || "mesh.stl");
      formData.append("ratio", String(ratio));

      const response = await fetch(`${IMG2_3D_PY_URL}/decimate?ratio=${ratio}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const outputName = "decimated.stl";
      res.setHeader("Content-Type", "application/sla");
      res.setHeader("Content-Disposition", `attachment; filename="${outputName}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error("Decimate proxy error:", error);
      res.status(500).json({ error: error.message || "Decimate failed" });
    }
  });

  // Text-to-3D API (proxy to Python FastAPI service)
  app.post("/api/text-to-3d", async (req, res) => {
    try {
      const { prompt, mcResolution = 256, cleanPrompt } = req.body;
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: "prompt must not be empty" });
      }

      const response = await fetch(`${IMG2_3D_PY_URL}/text-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mc_resolution: mcResolution,
          clean_prompt: cleanPrompt !== false,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Text-to-3D proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to start text-to-3d generation" });
    }
  });

  // Project persistence API
  const PROJECTS_DIR = path.join(process.cwd(), "projects");
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });

  function getProjectDir(id: string): string {
    return path.join(PROJECTS_DIR, id);
  }

  function getProjectJsonPath(id: string): string {
    return path.join(getProjectDir(id), "project.json");
  }

  function getVersionsDir(id: string): string {
    const dir = path.join(getProjectDir(id), "versions");
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function getVersionPath(id: string, n: number): string {
    return path.join(getVersionsDir(id), `${n}.json`);
  }

  function getThumbnailPath(id: string): string {
    return path.join(getProjectDir(id), "thumbnail.png");
  }

  function readProjectMeta(id: string): ProjectMeta | null {
    const p = getProjectJsonPath(id);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  }

  function writeProjectMeta(meta: ProjectMeta): void {
    const dir = getProjectDir(meta.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getProjectJsonPath(meta.id), JSON.stringify(meta, null, 2));
  }

  interface ProjectMeta {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    favorite: boolean;
    currentVersion: number;
    versionCount: number;
    thumbnail64: string;
    pieceCount: number;
    totalTriangles: number;
    estimate: unknown;
  }

  app.get("/api/projects", (_req, res) => {
    try {
      const ids = fs.readdirSync(PROJECTS_DIR);
      const metas: ProjectMeta[] = [];
      for (const id of ids) {
        const meta = readProjectMeta(id);
        if (meta) metas.push(meta);
      }
      metas.sort((a, b) => b.updatedAt - a.updatedAt);
      res.json(metas);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects", (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const id = crypto.randomUUID();
      const now = Date.now();
      const meta: ProjectMeta = {
        id,
        name,
        createdAt: now,
        updatedAt: now,
        favorite: false,
        currentVersion: 0,
        versionCount: 0,
        thumbnail64: "",
        pieceCount: 0,
        totalTriangles: 0,
        estimate: {},
      };
      writeProjectMeta(meta);
      res.json(meta);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/projects/:id", (req, res) => {
    try {
      const meta = readProjectMeta(req.params.id);
      if (!meta) return res.status(404).json({ error: "Project not found" });
      const versions: unknown[] = [];
      const vDir = getVersionsDir(req.params.id);
      if (fs.existsSync(vDir)) {
        const files = fs.readdirSync(vDir);
        for (const f of files) {
          const vPath = path.join(vDir, f);
          const v = JSON.parse(fs.readFileSync(vPath, "utf-8"));
          versions.push({ version: v.version, createdAt: v.createdAt, thumbnail64: v.thumbnail64 || "" });
        }
      }
      res.json({ ...meta, versions });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/projects/:id", (req, res) => {
    try {
      const meta = readProjectMeta(req.params.id);
      if (!meta) return res.status(404).json({ error: "Project not found" });
      const { name, favorite } = req.body;
      if (name !== undefined) meta.name = name;
      if (favorite !== undefined) meta.favorite = favorite;
      meta.updatedAt = Date.now();
      writeProjectMeta(meta);
      res.json(meta);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/projects/:id", (req, res) => {
    try {
      const dir = getProjectDir(req.params.id);
      if (!fs.existsSync(dir)) return res.status(404).json({ error: "Project not found" });
      fs.rmSync(dir, { recursive: true });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects/:id/duplicate", (req, res) => {
    try {
      const meta = readProjectMeta(req.params.id);
      if (!meta) return res.status(404).json({ error: "Project not found" });
      const newId = crypto.randomUUID();
      const newDir = getProjectDir(newId);
      const srcDir = getProjectDir(req.params.id);
      fs.cpSync(srcDir, newDir, { recursive: true });
      const newMeta = readProjectMeta(newId);
      if (newMeta) {
        newMeta.id = newId;
        newMeta.name = `${meta.name} (cópia)`;
        newMeta.createdAt = Date.now();
        newMeta.updatedAt = Date.now();
        writeProjectMeta(newMeta);
        res.json(newMeta);
      } else {
        res.status(500).json({ error: "Copy failed" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/projects/:id/versions", (req, res) => {
    try {
      const meta = readProjectMeta(req.params.id);
      if (!meta) return res.status(404).json({ error: "Project not found" });
      const { params, scene, thumbnail64 } = req.body;
      const v = meta.currentVersion + 1;
      const createdAt = Date.now();
      const versionData = { version: v, createdAt, params, scene, thumbnail64: thumbnail64 || "" };
      const vPath = getVersionPath(req.params.id, v);
      fs.writeFileSync(vPath, JSON.stringify(versionData, null, 2));
      console.log(`[projects] Saved version ${v} for project ${req.params.id}`);
      meta.currentVersion = v;
      meta.versionCount = v;
      meta.updatedAt = createdAt;
      if (thumbnail64) meta.thumbnail64 = thumbnail64;
      if (scene?.pieces) meta.pieceCount = scene.pieces.length;
      writeProjectMeta(meta);
      res.json({ version: v, createdAt, thumbnail64: thumbnail64 || "" });
    } catch (e: any) {
      console.error("[projects] Save version error:", e?.message || e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/projects/:id/versions", (req, res) => {
    try {
      const vDir = getVersionsDir(req.params.id);
      if (!fs.existsSync(vDir)) return res.json([]);
      const files = fs.readdirSync(vDir);
      const versions = files
        .map((f) => {
          const data = JSON.parse(fs.readFileSync(path.join(vDir, f), "utf-8"));
          return { version: data.version, createdAt: data.createdAt, thumbnail64: data.thumbnail64 || "" };
        })
        .sort((a, b) => b.version - a.version);
      res.json(versions);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/projects/:id/versions/:n", (req, res) => {
    try {
      const vPath = getVersionPath(req.params.id, parseInt(req.params.n));
      if (!fs.existsSync(vPath)) return res.status(404).json({ error: "Version not found" });
      res.json(JSON.parse(fs.readFileSync(vPath, "utf-8")));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/projects/:id/thumbnail", (req, res) => {
    try {
      const tPath = getThumbnailPath(req.params.id);
      if (!fs.existsSync(tPath)) {
        return res.status(404).send("");
      }
      res.setHeader("Content-Type", "image/png");
      fs.createReadStream(tPath).pipe(res);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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
