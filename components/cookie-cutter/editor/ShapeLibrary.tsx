import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVectorEditor } from "@/hooks/useVectorEditor";
import { Shape2D } from "@/lib/cookie-cutter/svgTypes";

interface ShapeLibraryProps {
  editor: ReturnType<typeof useVectorEditor>;
}

const VIEWBOX = 36;

interface ShapeDef {
  id: string;
  label: string;
  d: string;
}

const SHAPES: ShapeDef[] = [
  {
    id: "circle",
    label: "Círculo",
    d: "M 18 2 A 16 16 0 1 0 18 34 A 16 16 0 1 0 18 2 Z",
  },
  {
    id: "square",
    label: "Quadrado",
    d: "M 4 4 L 32 4 L 32 32 L 4 32 Z",
  },
  {
    id: "triangle",
    label: "Triângulo",
    d: "M 18 2 L 36 34 L 0 34 Z",
  },
  {
    id: "star5",
    label: "Estrela 5",
    d: "M 18 2 L 22 14 L 34 14 L 24 22 L 28 34 L 18 26 L 8 34 L 12 22 L 2 14 L 14 14 Z",
  },
  {
    id: "star6",
    label: "Estrela 6",
    d: "M 18 2 L 22 12 L 32 10 L 26 18 L 34 24 L 24 24 L 22 34 L 14 26 L 4 28 L 10 18 L 2 12 L 12 14 Z",
  },
  {
    id: "heart",
    label: "Coração",
    d: "M 18 34 L 4 18 Q 0 12 6 8 Q 12 6 18 12 Q 24 6 30 8 Q 36 12 32 18 Z",
  },
  {
    id: "hexagon",
    label: "Hexágono",
    d: "M 18 2 L 32 10 L 32 24 L 18 32 L 4 24 L 4 10 Z",
  },
  {
    id: "cloud",
    label: "Nuvem",
    d: "M 22 28 Q 32 26 30 18 Q 36 16 28 12 Q 28 4 18 6 Q 8 2 4 8 Q 0 14 4 18 Q 0 22 6 26 Q 8 30 22 28 Z",
  },
  {
    id: "moon",
    label: "Lua",
    d: "M 28 2 Q 18 10 18 18 Q 18 26 28 34 Q 20 30 20 18 Q 20 6 28 2 Z",
  },
  {
    id: "arrow",
    label: "Seta",
    d: "M 2 10 L 24 10 L 24 2 L 36 18 L 24 34 L 24 26 L 2 26 Z",
  },
  {
    id: "diamond",
    label: "Losango",
    d: "M 18 2 L 36 18 L 18 34 L 0 18 Z",
  },
  {
    id: "cross",
    label: "Cruz",
    d: "M 14 2 L 22 2 L 22 14 L 34 14 L 34 22 L 22 22 L 22 34 L 14 34 L 14 22 L 2 22 L 2 14 L 14 14 Z",
  },
];

const SIZES_MM = [20, 40, 60, 80];
const BASE_SCALE = 1;

function getTargetPieceName(
  pieces: { id: string; name: string }[],
  activePieceId: string
): string {
  const piece = pieces.find((p) => p.id === activePieceId);
  return piece?.name ?? "Peça 1";
}

export function ShapeLibrary({ editor }: ShapeLibraryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedSize, setSelectedSize] = useState(40);
  const [pendingShape, setPendingShape] = useState<ShapeDef | null>(null);

  const {
    scene,
    addShapeToActive,
    addPiece,
  } = editor;

  const pieces = scene.pieces;

  const handleShapeClick = useCallback((shape: ShapeDef) => {
    if (pieces.length > 1) {
      setPendingShape(shape);
    } else {
      addShapeFromDef(shape, scene.activePieceId);
    }
  }, [pieces.length, scene.activePieceId, addShapeToActive]);

  const addShapeFromDef = useCallback(
    (shape: ShapeDef, pieceId: string) => {
      const sizeScale = selectedSize / VIEWBOX;
      const scale = BASE_SCALE * sizeScale;

      const centerX = 100 - (VIEWBOX * scale) / 2;
      const centerY = 100 - (VIEWBOX * scale) / 2;

      const newShape: Shape2D = {
        id: crypto.randomUUID(),
        kind: "icon",
        d: shape.d,
        transform: {
          tx: centerX,
          ty: centerY,
          sx: scale,
          sy: scale,
          rotation: 0,
          mirrorX: false,
          mirrorY: false,
        },
        fill: "nonzero",
        metadata: {
          name: `${shape.label} (${selectedSize}mm)`,
          iconSource: shape.id,
        },
        visible: true,
      };

      if (pieceId === scene.activePieceId) {
        addShapeToActive(newShape);
      } else {
        editor.addShape(pieceId, newShape);
      }
      setPendingShape(null);
    },
    [selectedSize, scene.activePieceId, addShapeToActive, editor]
  );

  const handleAddToExisting = useCallback(() => {
    if (!pendingShape) return;
    addShapeFromDef(pendingShape, scene.activePieceId);
  }, [pendingShape, scene.activePieceId, addShapeFromDef]);

  const handleAddToNew = useCallback(() => {
    if (!pendingShape) return;
    const prevPieceCount = scene.pieces.length;
    addPiece();
    setTimeout(() => {
      const newPiece = editor.scene.pieces.find((_, i) => i >= prevPieceCount);
      if (newPiece && pendingShape) {
        editor.setActivePiece(newPiece.id);
        addShapeFromDef(pendingShape, newPiece.id);
      }
    }, 50);
  }, [pendingShape, scene.pieces.length, addPiece, editor, addShapeFromDef]);

  return (
    <div
      className={cn(
        "bg-[#0A0A0A] border-l border-[#222] flex flex-col transition-all duration-200 overflow-hidden",
        collapsed ? "w-8" : "w-48"
      )}
    >
      <div className="flex items-center justify-between p-2 border-b border-[#222] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <Library className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="font-black text-[10px] uppercase tracking-widest text-white">
              Biblioteca
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "text-white/50 hover:text-white p-0.5",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="p-2 border-b border-[#222] shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Tamanho
            </span>
            <div className="flex gap-0.5 mt-1">
              {SIZES_MM.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "flex-1 py-1 font-mono text-[9px] tracking-wider uppercase transition-colors",
                    selectedSize === size
                      ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]"
                      : "text-white/50 border border-[#333] hover:text-white/80 hover:border-white/30"
                  )}
                >
                  {size}mm
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-4 gap-1.5">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => handleShapeClick(shape)}
                  className="flex flex-col items-center gap-0.5 p-1 hover:bg-white/5 border border-transparent hover:border-[#333] transition-colors"
                  title={shape.label}
                >
                  <svg
                    viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
                    className="w-7 h-7"
                  >
                    <path
                      d={shape.d}
                      fill="none"
                      stroke="white"
                      strokeWidth={1}
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-white/50 leading-tight text-center">
                    {shape.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {pendingShape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#333] p-4 w-72">
            <p className="font-black text-[10px] uppercase tracking-widest text-white mb-3 text-center">
              Adicionar {pendingShape.label} à:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAddToExisting}
                className="w-full px-3 py-2 bg-[#00E5FF] text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#00E5FF]/80 transition-colors"
              >
                Peça &ldquo;{getTargetPieceName(pieces, scene.activePieceId)}&rdquo;
              </button>
              <button
                type="button"
                onClick={handleAddToNew}
                className="w-full px-3 py-2 border border-[#333] text-white font-black text-[10px] uppercase tracking-widest hover:border-white/40 transition-colors"
              >
                Criar nova peça
              </button>
              <button
                type="button"
                onClick={() => setPendingShape(null)}
                className="w-full px-3 py-2 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white/70 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
