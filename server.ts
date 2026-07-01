import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // AI Figures Generation API
  app.post("/api/ai-figures/generate", async (req, res) => {
    try {
      const { prompt, physicalFormat = "statue" } = req.body;
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

      let formatGuideline = "";
      if (physicalFormat === "articulated") {
        formatGuideline = "Specify that it is a 3D print-in-place articulated sensory flexi model with flexible interlocking joint segments, movable/wiggly body parts, flat bottom, smooth safe edges, perfect as a fidget sensory toy.";
      } else if (physicalFormat === "articulated_keychain") {
        formatGuideline = "Specify that it is a mini pocket-sized print-in-place articulated sensory keychain edition, combining flexible interlocking joint segments with a solid sturdy eyelet ring loop connector integrated on the top of its head, perfect as a movable fidget toy keychain.";
      } else if (physicalFormat === "keychain") {
        formatGuideline = "Specify that it is a mini pocket-sized keychain edition, with a solid sturdy eyelet ring loop connector integrated on the very top of its head, simplified clean geometries optimized for small-scale 3D prints.";
      } else {
        formatGuideline = "Specify that it is a premium static collector statue standing on a detailed solid circular base/pedestal with highly detailed textures.";
      }

      const systemInstruction = `You are an expert prompt engineer for 3D generation AI models (like Meshy, Luma, etc.).
Your task is to take the user's idea for a 3D figure and convert it into a highly detailed, optimized prompt.
The output prompt should focus on style, pose, details, textures, and specify appropriate physical features.
Format requirement: ${formatGuideline}
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

  // AI Figures Image Generation API
  app.post("/api/ai-figures/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio = "1:1", model = "gemini-3.1-flash-lite-image", physicalFormat = "statue" } = req.body;
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

      // We append description details to get a high-quality 3D printing/resin model style preview
      let enhancedPrompt = "";
      if (physicalFormat === "articulated") {
        enhancedPrompt = `3D print-in-place articulated sensory flexi fidget toy of: ${prompt}. Showcasing flexible segmented interlocking joints, flat bottom, resting on a plain dark studio table surface, realistic plastic material, high quality render.`;
      } else if (physicalFormat === "articulated_keychain") {
        enhancedPrompt = `3D print-in-place articulated sensory fidget keychain toy of: ${prompt}. Combining flexible wiggling joint segments with a sturdy connector loop ring integrated on top of its head, pocket-sized, flat bottom, resting on a plain dark studio tabletop, realistic plastic material, high quality render.`;
      } else if (physicalFormat === "keychain") {
        enhancedPrompt = `3D mini figure keychain edition of: ${prompt}. Pocket-sized, featuring a sturdy attachment loop connector ring integrated on top of its head, plain neutral dark studio background, displayed as a small keychain accessory, realistic plastic material, high quality render.`;
      } else {
        enhancedPrompt = `3D digital sculpture of: ${prompt}. Centered composition, plain neutral dark studio background, displayed on a pedestal or base, realistic materials, intricate fine details, optimized for 3D printing, high quality render.`;
      }

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              text: enhancedPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio,
          }
        },
      });

      let imageUrl = "";
      const candidates = response.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            imageUrl = `data:image/png;base64,${base64EncodeString}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error("Não foi possível gerar a imagem a partir do modelo Gemini.");
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Gemini Image API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // AI Figures Photo-to-Figurine Multimodal Analyzer API
  app.post("/api/ai-figures/analyze-image", async (req, res) => {
    try {
      const { image, style = "rpg", physicalFormat = "statue" } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Imagem é obrigatória" });
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

      // extract actual base64 data and mimeType
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const stylePrompts = {
        rpg: "fantasy tabletop RPG style miniature, epic battle pose, medieval warrior/mage armor and gear, incredibly high detail",
        chibi: "cute chibi style miniature, big expressive adorable eyes, oversized magic staff/sword accessory, stylized cute costume, smooth friendly look",
        cyberpunk: "futuristic cyberpunk character style, neon accents, cyberware enhancements, high-tech blaster, industrial grating base",
        classic: "classic museum marble statue style, elegant classical artistic pose, greek/roman drapery, realistic stone sculpture texture"
      };

      const selectedStyleText = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.rpg;

      let formatPromptText = "";
      let formatTranslationText = "";
      if (physicalFormat === "articulated") {
        formatPromptText = "3D print-in-place articulated sensory flexi toy with flexible interlocking joint segments, movable body divisions, sitting flat, realistic plastic materials, smooth safe edges, optimized for fidget movement";
        formatTranslationText = "como um brinquedo sensorial articulado (fidget toy/flexi) com juntas móveis fáceis de manusear e corpo segmentado";
      } else if (physicalFormat === "articulated_keychain") {
        formatPromptText = "3D print-in-place articulated sensory fidget keychain toy combining flexible interlocking joint segments with a sturdy attachment eyelet ring loop integrated on top of the head, pocket-sized, flat bottom, optimized for flexible movement and keychain attachment";
        formatTranslationText = "como um chaveiro sensorial articulado (flexi fidget toy) com juntas móveis flexíveis e um anel de chaveiro integrado na cabeça";
      } else if (physicalFormat === "keychain") {
        formatPromptText = "a small compact mini keychain edition figure with a sturdy attachment eyelet ring loop integrated on top of the head/helmet, pocket-sized, simplified high-detail solid geometry optimized for small SLA/FDM prints";
        formatTranslationText = "como uma mini-estátua compacta na versão Chaveiro, com um anel de fixação integrado na cabeça do boneco";
      } else {
        formatPromptText = "standing on a circular base/pedestal, realistic plastic/resin materials, extremely intricate details, cinematic studio lighting, dark neutral studio background, optimized for 3D printing, high quality render";
        formatTranslationText = "como uma estátua clássica estática montada em pedestal detalhado de exposição";
      }

      const systemInstruction = `You are a creative 3D design and figurine expert. 
Your goal is to analyze the face, hair style, clothing details, accessories, color palette, and general appearance of the person in the uploaded photo, and translate their likeness into a highly detailed description for a collectible 3D printing character figure (like a tabletop miniature).
You must output a JSON object with two fields:
- "analysis": A friendly, detailed description in Portuguese of how the person was stylized into a figure (e.g., "Identificamos seu cabelo cacheado preto, jaqueta azul e óculos de grau, e o estilizamos como um herói de RPG ${formatTranslationText}...").
- "optimizedPrompt": A highly detailed character prompt in English specifically optimized for generating a 3D digital sculpture image. It should describe a stylized version of the person in the photo with the style: ${selectedStyleText}. It should specify '3D digital sculpture of [stylized description of the person in the photo], ${selectedStyleText}, ${formatPromptText}'. Ensure there are no markdown backticks inside the JSON fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analyze this image and transform this person into a 3D printable figurine of style: ${style}. Return the response in JSON format according to systemInstructions.`,
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());

      res.json({
        analysis: parsed.analysis || "Análise da imagem concluída com sucesso.",
        optimizedPrompt: parsed.optimizedPrompt || "3D digital sculpture of a personalized character figurine, highly detailed"
      });
    } catch (error: any) {
      console.error("Gemini Image Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
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
