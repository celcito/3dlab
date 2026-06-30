import { useState, useMemo } from "react";
import { X, Type } from "lucide-react";
import { Shape2D } from "@/lib/cookie-cutter/svgTypes";

interface TextInputDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (shape: Shape2D) => void;
}

const GLYPH_WIDTH = 36;
const GLYPH_HEIGHT = 50;
const CHAR_SPACING = 38;

interface GlyphEntry {
  path: string;
  width: number;
}

const LETTER_GLYPHS: Record<string, GlyphEntry> = {
  "A": { path: "M 0 50 L 18 2 L 36 50 Z M 10 30 L 26 30 Z", width: GLYPH_WIDTH },
  "B": { path: "M 0 2 L 0 50 L 24 50 Q 36 50 36 40 Q 36 32 28 30 Q 36 28 36 18 Q 36 2 24 2 Z M 8 26 L 22 26 Q 30 26 30 34 Q 30 42 22 42 L 8 42 Z", width: GLYPH_WIDTH },
  "C": { path: "M 32 12 Q 34 2 18 2 Q 2 2 2 26 Q 2 50 18 50 Q 34 50 32 40 L 26 40 Q 26 46 18 46 Q 8 46 8 26 Q 8 6 18 6 Q 26 6 26 12 Z", width: GLYPH_WIDTH },
  "D": { path: "M 0 2 L 0 50 L 18 50 Q 38 50 38 26 Q 38 2 18 2 Z M 6 6 L 18 6 Q 32 6 32 26 Q 32 46 18 46 L 6 46 Z", width: GLYPH_WIDTH },
  "E": { path: "M 0 2 L 36 2 L 36 8 L 6 8 L 6 22 L 28 22 L 28 28 L 6 28 L 6 44 L 36 44 L 36 50 L 0 50 Z", width: GLYPH_WIDTH },
  "F": { path: "M 0 2 L 36 2 L 36 8 L 6 8 L 6 22 L 28 22 L 28 28 L 6 28 L 6 50 L 0 50 Z", width: GLYPH_WIDTH },
  "G": { path: "M 32 12 Q 34 2 18 2 Q 2 2 2 26 Q 2 50 18 50 Q 34 50 34 38 L 34 26 L 20 26 L 20 32 L 28 32 L 28 38 Q 28 44 18 44 Q 8 44 8 26 Q 8 8 18 8 Q 26 8 26 12 Z", width: GLYPH_WIDTH },
  "H": { path: "M 0 2 L 0 50 L 6 50 L 6 28 L 30 28 L 30 50 L 36 50 L 36 2 L 30 2 L 30 22 L 6 22 L 6 2 Z", width: GLYPH_WIDTH },
  "I": { path: "M 8 2 L 28 2 L 28 8 L 22 8 L 22 44 L 28 44 L 28 50 L 8 50 L 8 44 L 14 44 L 14 8 L 8 8 Z", width: GLYPH_WIDTH },
  "J": { path: "M 28 2 L 28 38 Q 28 48 16 48 Q 4 48 4 38 L 10 38 Q 10 44 16 44 Q 22 44 22 38 L 22 2 Z", width: GLYPH_WIDTH },
  "K": { path: "M 0 2 L 0 50 L 6 50 L 6 28 L 28 2 L 36 2 L 16 26 L 36 50 L 28 50 L 12 30 L 6 36 L 6 2 Z", width: GLYPH_WIDTH },
  "L": { path: "M 0 2 L 0 50 L 6 50 L 6 8 L 36 8 L 36 2 Z", width: GLYPH_WIDTH },
  "M": { path: "M 0 50 L 0 2 L 6 2 L 18 34 L 30 2 L 36 2 L 36 50 L 30 50 L 30 12 L 18 42 L 6 12 L 6 50 Z", width: GLYPH_WIDTH },
  "N": { path: "M 0 50 L 0 2 L 6 2 L 30 40 L 30 2 L 36 2 L 36 50 L 30 50 L 6 12 L 6 50 Z", width: GLYPH_WIDTH },
  "O": { path: "M 18 2 Q 36 2 36 26 Q 36 50 18 50 Q 0 50 0 26 Q 0 2 18 2 Z M 18 8 Q 6 8 6 26 Q 6 44 18 44 Q 30 44 30 26 Q 30 8 18 8 Z", width: GLYPH_WIDTH },
  "P": { path: "M 0 2 L 0 50 L 6 50 L 6 28 L 26 28 Q 36 28 36 16 Q 36 2 24 2 L 6 2 Z M 6 8 L 24 8 Q 30 8 30 16 Q 30 22 24 22 L 6 22 Z", width: GLYPH_WIDTH },
  "Q": { path: "M 18 2 Q 36 2 36 26 Q 36 48 22 48 L 36 56 L 30 56 L 16 48 Q 0 48 0 26 Q 0 2 18 2 Z M 18 8 Q 6 8 6 26 Q 6 42 18 42 Q 30 42 30 26 Q 30 8 18 8 Z", width: GLYPH_WIDTH },
  "R": { path: "M 0 2 L 0 50 L 6 50 L 6 28 L 24 28 Q 34 28 34 18 Q 34 6 26 2 L 6 2 Z M 6 8 L 26 8 Q 28 8 28 18 Q 28 22 24 22 L 6 22 Z M 20 28 L 36 50 L 28 50 L 14 28 Z", width: GLYPH_WIDTH },
  "S": { path: "M 34 8 Q 34 2 18 2 Q 4 2 4 14 Q 4 24 20 24 Q 34 28 34 38 Q 34 48 18 48 Q 2 48 2 40 L 8 40 Q 8 44 18 44 Q 28 44 28 38 Q 28 32 18 30 Q 4 26 4 14 Q 4 8 18 8 Q 28 8 28 8 Z", width: GLYPH_WIDTH },
  "T": { path: "M 0 2 L 36 2 L 36 8 L 22 8 L 22 50 L 16 50 L 16 8 L 0 8 Z", width: GLYPH_WIDTH },
  "U": { path: "M 0 2 L 0 38 Q 0 50 18 50 Q 36 50 36 38 L 36 2 L 30 2 L 30 38 Q 30 44 18 44 Q 6 44 6 38 L 6 2 Z", width: GLYPH_WIDTH },
  "V": { path: "M 0 2 L 18 50 L 24 50 L 42 2 L 36 2 L 20 42 L 4 2 Z", width: GLYPH_WIDTH + 6 },
  "W": { path: "M 0 2 L 8 50 L 14 50 L 22 20 L 30 50 L 36 50 L 44 2 L 38 2 L 32 40 L 24 8 L 16 40 L 10 2 Z", width: GLYPH_WIDTH + 8 },
  "X": { path: "M 0 2 L 16 26 L 0 50 L 8 50 L 18 34 L 28 50 L 36 50 L 20 26 L 36 2 L 28 2 L 18 18 L 8 2 Z", width: GLYPH_WIDTH },
  "Y": { path: "M 0 2 L 18 24 L 18 50 L 24 50 L 24 24 L 42 2 L 34 2 L 20 18 L 6 2 Z", width: GLYPH_WIDTH + 6 },
  "Z": { path: "M 0 2 L 36 2 L 36 8 L 8 44 L 36 44 L 36 50 L 0 50 L 0 44 L 28 8 L 0 8 Z", width: GLYPH_WIDTH },
  "0": { path: "M 18 2 Q 36 2 36 26 Q 36 50 18 50 Q 0 50 0 26 Q 0 2 18 2 Z M 18 8 Q 6 8 6 26 Q 6 44 18 44 Q 30 44 30 26 Q 30 8 18 8 Z", width: GLYPH_WIDTH },
  "1": { path: "M 8 12 L 18 2 L 24 2 L 24 50 L 8 50 L 8 44 L 18 44 L 18 12 Z", width: GLYPH_WIDTH },
  "2": { path: "M 4 6 Q 4 2 18 2 Q 34 2 34 16 L 4 50 L 36 50 L 36 44 L 12 44 L 28 18 Q 28 8 18 8 Q 10 8 10 6 Z", width: GLYPH_WIDTH },
  "3": { path: "M 4 6 Q 4 2 18 2 Q 30 2 30 12 Q 30 20 18 24 Q 30 28 30 38 Q 30 48 18 50 Q 4 52 4 40 L 10 40 Q 10 44 18 44 Q 24 44 24 38 Q 24 32 18 30 Q 24 28 24 22 Q 24 14 18 14 Q 10 14 10 8 Z", width: GLYPH_WIDTH },
  "4": { path: "M 24 2 L 24 50 L 30 50 L 30 2 Z M 4 28 L 30 28 L 30 34 L 18 34 L 18 44 L 12 44 L 12 34 L 4 34 Z", width: GLYPH_WIDTH },
  "5": { path: "M 36 2 L 4 2 L 4 26 Q 10 20 18 20 Q 34 20 34 36 Q 34 48 18 50 Q 4 50 4 40 L 10 40 Q 10 46 18 46 Q 28 46 28 36 Q 28 26 18 26 Q 10 26 4 8 Z", width: GLYPH_WIDTH },
  "6": { path: "M 30 4 Q 34 2 18 2 Q 4 2 4 26 Q 4 50 18 50 Q 32 48 30 34 L 24 34 Q 26 42 18 44 Q 10 44 10 26 Q 10 8 18 8 Q 26 8 24 16 L 30 14 Z", width: GLYPH_WIDTH },
  "7": { path: "M 0 2 L 36 2 L 36 8 L 12 50 L 6 50 L 28 8 L 0 8 Z", width: GLYPH_WIDTH },
  "8": { path: "M 18 2 Q 36 2 36 16 Q 36 26 22 26 Q 36 26 36 36 Q 36 50 18 50 Q 0 50 0 36 Q 0 26 14 26 Q 0 26 0 14 Q 0 2 18 2 Z M 18 8 Q 6 8 6 16 Q 6 22 18 22 Q 30 22 30 16 Q 30 8 18 8 Z M 18 30 Q 6 30 6 36 Q 6 44 18 44 Q 30 44 30 36 Q 30 30 18 30 Z", width: GLYPH_WIDTH },
  "9": { path: "M 6 16 Q 4 2 18 2 Q 32 2 32 24 L 18 26 Q 10 24 10 14 Q 10 8 18 8 Q 26 8 26 16 L 8 36 Q 2 50 18 50 Q 32 48 34 36 L 28 36 Q 28 44 18 44 Q 8 44 12 34 Z", width: GLYPH_WIDTH },
  " ": { path: "", width: GLYPH_WIDTH },
};

function offsetGlyphPath(path: string, offsetX: number): string {
  if (!path) return "";
  return path.replace(/([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)/g, (_, x, y) => {
    const nx = parseFloat(x);
    if (String(x).trim() === "" || String(y).trim() === "") return `${x} ${y}`;
    return `${Number((nx + offsetX).toFixed(3))} ${y}`;
  });
}

function buildTextPath(
  text: string,
  _fontFamily: string,
  _fontSize: number,
  glyphWidth: number,
  spacing: number
): string {
  const chars = text.toUpperCase().split("");
  const parts: string[] = [];
  let offset = 0;

  for (const char of chars) {
    const glyph = LETTER_GLYPHS[char];
    if (!glyph || !glyph.path) {
      offset += glyphWidth;
      continue;
    }
    const offsetPath = offsetGlyphPath(glyph.path, offset);
    parts.push(offsetPath);
    offset += spacing;
  }

  return parts.join(" ");
}

export function TextInputDialog({ open, onClose, onAdd }: TextInputDialogProps) {
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState<"sans-serif" | "serif" | "monospace">("sans-serif");
  const [fontSize, setFontSize] = useState(48);
  const [error, setError] = useState("");

  if (!open) return null;

  const scale = fontSize / GLYPH_HEIGHT;
  const scaledSpacing = CHAR_SPACING * scale;
  const previewPath = useMemo(() => {
    if (!text.trim()) return "";
    return buildTextPath(text, fontFamily, fontSize, GLYPH_WIDTH, scaledSpacing);
  }, [text, fontFamily, fontSize, scaledSpacing]);

  const textBboxWidth = text.length * scaledSpacing;
  const previewW = Math.max(100, textBboxWidth + 20);
  const previewH = GLYPH_HEIGHT * scale + 20;

  const handleConvert = () => {
    if (!text.trim()) {
      setError("Digite um texto");
      return;
    }

    const combinedPath = buildTextPath(text, fontFamily, fontSize, GLYPH_WIDTH, scaledSpacing);
    if (!combinedPath) {
      setError("Texto não pode ser convertido");
      return;
    }

    const shape: Shape2D = {
      id: crypto.randomUUID(),
      kind: "text",
      d: combinedPath,
      transform: { tx: 0, ty: 0, sx: 1, sy: 1, rotation: 0, mirrorX: false, mirrorY: false },
      fill: "nonzero",
      metadata: {
        text,
        fontFamily,
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
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
              }}
              placeholder="Digite o texto"
              className="w-full bg-[#080808] border border-[#333] px-3 py-2 text-white font-mono text-sm uppercase tracking-widest placeholder:text-white/20 focus:border-[#00E5FF] focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConvert();
              }}
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Fonte
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as typeof fontFamily)}
              className="w-full bg-[#080808] border border-[#333] px-3 py-2 text-white font-mono text-sm uppercase tracking-widest focus:border-[#00E5FF] focus:outline-none appearance-none"
            >
              <option value="sans-serif">Sans-serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Tamanho: {fontSize}px
            </label>
            <input
              type="range"
              min={20}
              max={200}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 bg-[#222] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00E5FF]"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Preview
            </label>
            <div className="bg-[#080808] border border-[#333] p-3 flex items-center justify-center min-h-[100px]">
              {previewPath ? (
                <svg
                  viewBox={`-10 -10 ${previewW} ${previewH}`}
                  width={previewW}
                  height={previewH}
                  className="max-w-full"
                >
                  <path
                    d={previewPath}
                    fillRule="nonzero"
                    fill="none"
                    stroke="#00E5FF"
                    strokeWidth={1.5}
                  />
                </svg>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                  Sem preview
                </span>
              )}
            </div>
          </div>

          {error && (
            <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest">{error}</p>
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
            className="flex-1 px-4 py-2 bg-[#00E5FF] text-black font-black text-xs uppercase tracking-widest hover:bg-[#00E5FF]/80 transition-colors"
          >
            Converter
          </button>
        </div>
      </div>
    </div>
  );
}
