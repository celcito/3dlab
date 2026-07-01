import { useCallback, useMemo } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVectorEditor } from "@/hooks/useVectorEditor";

interface LayerPanelProps {
  editor: ReturnType<typeof useVectorEditor>;
}

export function LayerPanel({ editor }: LayerPanelProps) {
  const { scene, activePiece, selection, selectShape, removeShape, updateShape } = editor;

  const shapes = activePiece?.shapes ?? [];
  const shapeCount = shapes.length;

  const allVisible = useMemo(() => shapes.every((s) => s.visible !== false), [shapes]);
  const anyVisible = useMemo(() => shapes.some((s) => s.visible !== false), [shapes]);

  const handleToggleVisibility = useCallback(
    (shapeId: string, currentVisible: boolean) => {
      if (!activePiece) return;
      updateShape(activePiece.id, shapeId, { visible: !currentVisible });
    },
    [activePiece, updateShape]
  );

  const handleDelete = useCallback(
    (shapeId: string) => {
      if (!activePiece) return;
      removeShape(activePiece.id, shapeId);
    },
    [activePiece, removeShape]
  );

  const handleShowAll = useCallback(() => {
    if (!activePiece) return;
    for (const s of shapes) {
      if (s.visible === false) updateShape(activePiece.id, s.id, { visible: true });
    }
  }, [activePiece, shapes, updateShape]);

  const handleHideAll = useCallback(() => {
    if (!activePiece) return;
    for (const s of shapes) {
      if (s.visible !== false) updateShape(activePiece.id, s.id, { visible: false });
    }
  }, [activePiece, shapes, updateShape]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-white">
          Camadas
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShowAll}
            className="text-white/30 hover:text-white p-0.5 transition-colors"
            title="Mostrar todas"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleHideAll}
            className="text-white/30 hover:text-white p-0.5 transition-colors"
            title="Ocultar todas"
          >
            <EyeOff className="w-3 h-3" />
          </button>
          <span className="font-mono text-[10px] text-[#00E5FF]">{shapeCount}</span>
        </div>
      </div>

      {shapes.length === 0 ? (
        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest py-2">
          Nenhum shape
        </p>
      ) : (
        <div className="overflow-y-auto max-h-[200px] space-y-0.5 border border-[#222]">
          {shapes.map((shape, index) => {
            const isSelected = selection.has(shape.id);
            const shapeName =
              shape.metadata.name || `Shape ${index + 1}`;

            return (
              <div
                key={shape.id}
                onClick={() => selectShape(shape.id)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/[0.03]",
                  isSelected
                    ? "border-l-2 border-l-[#00E5FF] bg-[#00E5FF]/5"
                    : "border-l-2 border-l-transparent"
                )}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: "#00E5FF" }}
                />

                <span
                  className={cn(
                    "flex-1 font-mono text-[10px] uppercase tracking-widest truncate",
                    shape.visible ? "text-white/80" : "text-white/30 line-through",
                    isSelected && "text-[#00E5FF]"
                  )}
                >
                  {shapeName}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(shape.id, shape.visible);
                  }}
                  className="text-white/40 hover:text-white p-0.5 shrink-0 transition-colors"
                  title={shape.visible ? "Ocultar" : "Mostrar"}
                >
                  {shape.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(shape.id);
                  }}
                  className="text-white/40 hover:text-red-400 p-0.5 shrink-0 transition-colors"
                  title="Deletar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
