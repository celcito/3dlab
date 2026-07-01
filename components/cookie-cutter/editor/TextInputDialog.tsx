import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { X, Type, Upload } from "lucide-react";
import { Shape2D } from "@/lib/cookie-cutter/svgTypes";
import { loadFont, textToPath, textBounds, getCachedFont } from "@/lib/cookie-cutter/fontLoader";
import * as opentype from "opentype.js";

interface TextInputDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (shape: Shape2D) => void;
}

interface FontEntry {
  name: string;
  url: string;
}

const BUILTIN_FONTS: FontEntry[] = [
  { name: "Liberation Sans", url: "/fonts/LiberationSans-Regular.ttf" },
];

const CUSTOM_UPLOAD_IDX = -1;

export function TextInputDialog({ open, onClose, onAdd }: TextInputDialogProps) {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [fontIndex, setFontIndex] = useState(0);
  const [uploadedFont, setUploadedFont] = useState<opentype.Font | null>(null);
  const [uploadedFontName, setUploadedFontName] = useState("");
  const [fontReady, setFontReady] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUsingUpload = fontIndex === CUSTOM_UPLOAD_IDX;

  useEffect(() => {
    if (!open) return;
    if (isUsingUpload) {
      if (uploadedFont) {
        setFontReady(true);
      } else {
        setFontReady(false);
      }
      return;
    }

    const entry = BUILTIN_FONTS[fontIndex];
    if (!entry) return;
    setFontReady(false);
    loadFont(entry.url)
      .then(() => setFontReady(true))
      .catch(() => {
        setFontReady(false);
        setError("Fonte indisponível. Tente fazer upload de uma TTF.");
      });
  }, [open, fontIndex, isUsingUpload, uploadedFont]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const buf = await file.arrayBuffer();
      const font = opentype.parse(buf);
      setUploadedFont(font);
      setUploadedFontName(file.name.replace(/\.(ttf|otf|woff2?)$/i, ""));
      setFontIndex(CUSTOM_UPLOAD_IDX);
      setFontReady(true);
    } catch {
      setError("Arquivo de fonte inválido. Use TTF ou OTF.");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const activeFont = useCallback((): opentype.Font | null => {
    if (isUsingUpload && uploadedFont) return uploadedFont;
    return getCachedFont();
  }, [isUsingUpload, uploadedFont]);

  const lineHeightFactor = 1.2;

  const previewPaths = useMemo(() => {
    const font = activeFont();
    if (!font || !text.trim()) return null;

    const lines = text.split("\n");
    const paths: { d: string; y: number }[] = [];
    let currentY = 0;

    for (const line of lines) {
      if (!line) {
        currentY += fontSize * lineHeightFactor;
        continue;
      }
      try {
        const d = textToPath(line, fontSize, 0, currentY, font);
        paths.push({ d, y: currentY });
      } catch {
        // skip lines that can't render
      }
      currentY += fontSize * lineHeightFactor;
    }

    return paths;
  }, [text, fontSize, activeFont]);

  const previewViewBox = useMemo(() => {
    if (!previewPaths || previewPaths.length === 0) return "0 0 200 60";

    const font = activeFont();
    if (!font) return "0 0 200 60";

    const lines = text.split("\n");
    let totalW = 0;
    let totalH = 0;

    for (const line of lines) {
      if (!line) {
        totalH += fontSize * lineHeightFactor;
        continue;
      }
      try {
        const bounds = textBounds(line, fontSize, font);
        totalW = Math.max(totalW, bounds.width);
        totalH += fontSize * lineHeightFactor;
      } catch {
        totalH += fontSize;
      }
    }

    const pad = 20;
    return `0 ${-pad} ${Math.max(totalW + pad * 2, 100)} ${Math.max(totalH + pad * 2, 60)}`;
  }, [text, fontSize, activeFont, previewPaths]);

  const handleConvert = () => {
    if (!text.trim()) {
      setError("Digite um texto");
      return;
    }

    const font = activeFont();
    if (!font) {
      setError("Fonte não carregada. Aguarde ou selecione outra.");
      return;
    }

    const lines = text.split("\n");
    const pathParts: string[] = [];
    let currentY = 0;

    for (const line of lines) {
      if (!line) {
        currentY += fontSize * lineHeightFactor;
        continue;
      }
      try {
        const d = textToPath(line, fontSize, 0, currentY, font);
        pathParts.push(d);
      } catch (e) {
        console.warn("Failed to convert line to path:", e);
      }
      currentY += fontSize * lineHeightFactor;
    }

    const combinedPath = pathParts.join(" ");
    if (!combinedPath) {
      setError("Texto não pode ser convertido com esta fonte");
      return;
    }

    const usedFontName = isUsingUpload ? uploadedFontName : BUILTIN_FONTS[fontIndex]?.name ?? "sans-serif";

    const shape: Shape2D = {
      id: crypto.randomUUID(),
      kind: "text",
      d: combinedPath,
      transform: { tx: 0, ty: 0, sx: 1, sy: 1, rotation: 0, mirrorX: false, mirrorY: false },
      fill: "evenodd",
      metadata: {
        text,
        fontFamily: usedFontName,
        fontSize,
        name: `Texto: ${text.slice(0, 20)}${text.length > 20 ? "..." : ""}`,
      },
      visible: true,
    };

    onAdd(shape);
    setText("");
    setError("");
    onClose();
  };

  const handleCancel = () => {
    setText("");
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#333] w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-[#00E5FF]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-white">Adicionar Texto</h2>
          </div>
          <button type="button" onClick={handleCancel} className="text-white/50 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Texto
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
              }}
              placeholder="Digite o texto"
              rows={3}
              className="w-full bg-[#080808] border border-[#333] px-3 py-2 text-white font-mono text-sm placeholder:text-white/20 focus:border-[#00E5FF] focus:outline-none resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleConvert();
              }}
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Fonte
            </label>
            <div className="flex gap-2">
              <select
                value={fontIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setFontIndex(idx);
                  setError("");
                }}
                className="flex-1 bg-[#080808] border border-[#333] px-3 py-2 text-white font-mono text-[10px] uppercase tracking-widest focus:border-[#00E5FF] focus:outline-none appearance-none"
              >
                {BUILTIN_FONTS.map((f, i) => (
                  <option key={f.url} value={i}>{f.name}</option>
                ))}
                {uploadedFont && (
                  <option value={CUSTOM_UPLOAD_IDX}>{uploadedFontName} (upload)</option>
                )}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 flex items-center justify-center gap-1 px-2 py-1.5 border border-[#333] text-white/40 font-mono text-[9px] uppercase tracking-widest hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
                title="Upload de fonte TTF ou OTF"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Tamanho: {fontSize}px
            </label>
            <input
              type="range"
              min={10}
              max={300}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 bg-[#222] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00E5FF]"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Preview
            </label>
            <div className="bg-[#080808] border border-[#333] p-3 flex items-center justify-center min-h-[100px] overflow-hidden">
              {!fontReady && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/20 animate-pulse">
                  Carregando fonte...
                </span>
              )}
              {fontReady && previewPaths && previewPaths.length > 0 ? (
                <svg
                  viewBox={previewViewBox}
                  className="max-w-full max-h-[140px]"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {previewPaths.map((p, i) => (
                    <path
                      key={i}
                      d={p.d}
                      fillRule="evenodd"
                      fill="none"
                      stroke="#00E5FF"
                      strokeWidth={1.5}
                    />
                  ))}
                </svg>
              ) : fontReady && !text.trim() ? (
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                  Sem preview
                </span>
              ) : null}
            </div>
          </div>

          {error && (
            <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest">{error}</p>
          )}

          {!fontReady && !error && (
            <p className="font-mono text-[10px] text-[#FF9933] uppercase tracking-widest">
              Carregando fonte... aguarde.
            </p>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-[#222]">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-[#333] text-white/60 font-black text-xs uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConvert}
            disabled={!fontReady}
            className="flex-1 px-4 py-2 bg-[#00E5FF] text-black font-black text-xs uppercase tracking-widest hover:bg-[#00E5FF]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Converter
          </button>
        </div>
      </div>
    </div>
  );
}
