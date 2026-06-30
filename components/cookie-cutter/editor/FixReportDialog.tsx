import { useState, useCallback, useMemo } from "react";
import { AlertTriangle, Check, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVectorEditor } from "@/hooks/useVectorEditor";
import { FixItem } from "@/lib/cookie-cutter/svgTypes";

interface FixReportDialogProps {
  editor: ReturnType<typeof useVectorEditor>;
}

const PREVIEW_SIZE = 100;

function renderSceneShapes(shapes: { d: string; visible: boolean }[]): string[] {
  return shapes
    .filter((s) => s.visible !== false)
    .map(
      (s) =>
        `<path d="${s.d}" fill="none" stroke="white" stroke-width="0.5" stroke-linejoin="round" />`
    );
}

function computeSceneBbox(
  shapes: { d: string }[]
): { x: number; y: number; w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const shape of shapes) {
    const nums = shape.d
      .replace(/[^\d.e\-\s]/g, " ")
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(parseFloat);
    for (let i = 0; i < nums.length - 1; i += 2) {
      const x = nums[i];
      const y = nums[i + 1];
      if (isNaN(x) || isNaN(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (minX === Infinity) return { x: 0, y: 0, w: PREVIEW_SIZE, h: PREVIEW_SIZE };

  const pad = Math.max((maxX - minX) * 0.05, (maxY - minY) * 0.05, 1);
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
}

function FixItemRow({
  item,
  onToggle,
}: {
  item: FixItem & { enabled: boolean };
  onToggle: () => void;
}) {
  const labels: Record<FixItem["type"], { type: string; desc: string }> = {
    openPath: {
      type: "Paths abertos",
      desc: `Paths abertos: ${item.count} — Fechados automaticamente`,
    },
    selfIntersection: {
      type: "Auto-interseções",
      desc: `Auto-interseções: ${item.count} — Resolvidas`,
    },
    duplicatePoint: {
      type: "Pontos duplicados",
      desc: `Pontos duplicados: ${item.count} — Removidos`,
    },
    winding: {
      type: "Winding invertido",
      desc: `Winding invertido: ${item.count} — Normalizado`,
    },
  };

  const info = labels[item.type];

  return (
    <tr className="border-b border-[#222]">
      <td className="py-2 pr-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
          {info.type}
        </span>
      </td>
      <td className="py-2 pr-3">
        <span className="font-mono text-[10px] text-[#00E5FF]">{item.count}</span>
      </td>
      <td className="py-2 pr-3">
        <span className="font-mono text-[10px] text-white/60">{info.desc}</span>
      </td>
      <td className="py-2 text-center">
        <button
          type="button"
          onClick={onToggle}
          className="text-white/40 hover:text-[#00E5FF] transition-colors"
        >
          {item.enabled ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
        </button>
      </td>
    </tr>
  );
}

export function FixReportDialog({ editor }: FixReportDialogProps) {
  const {
    fixReport,
    showFixDialog,
    originalScene,
    applyFix,
    rejectFix,
  } = editor;

  const [items, setItems] = useState<(FixItem & { enabled: boolean })[]>([]);

  useMemo(() => {
    if (fixReport) {
      setItems(fixReport.items.map((item) => ({ ...item, enabled: item.enabled })));
    }
  }, [fixReport]);

  if (!showFixDialog || !fixReport) return null;

  const allEnabled = items.length > 0 && items.every((i) => i.enabled);
  const someEnabled = items.some((i) => i.enabled);

  const originalShapes = originalScene?.pieces.flatMap((p) => p.shapes) ?? [];
  const fixedShapes = fixReport.fixedScene.pieces.flatMap((p) => p.shapes);

  const originalBbox = useMemo(() => computeSceneBbox(originalShapes), [originalShapes]);
  const fixedBbox = useMemo(() => computeSceneBbox(fixedShapes), [fixedShapes]);

  const toggleItem = useCallback((index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item))
    );
  }, []);

  const toggleAll = useCallback(() => {
    const newState = !allEnabled;
    setItems((prev) => prev.map((item) => ({ ...item, enabled: newState })));
  }, [allEnabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#333] w-[720px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 p-4 border-b border-[#222]">
          <AlertTriangle className="w-4 h-4 text-[#00E5FF]" />
          <div>
            <h2 className="font-black text-xs uppercase tracking-widest text-white">
              Correções detectadas
            </h2>
            <p className="font-mono text-[10px] text-white/50 mt-0.5">
              Seu SVG tem {fixReport.totalFixes} problema{fixReport.totalFixes !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="p-4 border-b border-[#222]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-2 text-center">
                Original
              </h3>
              <div className="bg-[#080808] border border-[#333] flex items-center justify-center">
                <svg
                  viewBox={`${originalBbox.x} ${originalBbox.y} ${originalBbox.w} ${originalBbox.h}`}
                  width={PREVIEW_SIZE}
                  height={PREVIEW_SIZE}
                  className="max-w-full"
                >
                  <rect
                    x={originalBbox.x}
                    y={originalBbox.y}
                    width={originalBbox.w}
                    height={originalBbox.h}
                    fill="#080808"
                  />
                  <g
                    dangerouslySetInnerHTML={{
                      __html: renderSceneShapes(originalShapes).join(""),
                    }}
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]/80 mb-2 text-center">
                Corrigido
              </h3>
              <div className="bg-[#080808] border border-[#00E5FF]/30 flex items-center justify-center">
                <svg
                  viewBox={`${fixedBbox.x} ${fixedBbox.y} ${fixedBbox.w} ${fixedBbox.h}`}
                  width={PREVIEW_SIZE}
                  height={PREVIEW_SIZE}
                  className="max-w-full"
                >
                  <rect
                    x={fixedBbox.x}
                    y={fixedBbox.y}
                    width={fixedBbox.w}
                    height={fixedBbox.h}
                    fill="#080808"
                  />
                  <g
                    dangerouslySetInnerHTML={{
                      __html: renderSceneShapes(fixedShapes).join(""),
                    }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[#222]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="py-2 pr-3 text-left font-black text-[10px] uppercase tracking-widest text-white/50">
                  Tipo
                </th>
                <th className="py-2 pr-3 text-left font-black text-[10px] uppercase tracking-widest text-white/50">
                  Qtd
                </th>
                <th className="py-2 pr-3 text-left font-black text-[10px] uppercase tracking-widest text-white/50">
                  Descrição
                </th>
                <th className="py-2 w-8 text-center font-black text-[10px] uppercase tracking-widest text-white/50">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={cn(
                      "transition-colors",
                      someEnabled ? "text-[#00E5FF] hover:text-[#00E5FF]/80" : "text-white/30 hover:text-white/50"
                    )}
                    title={allEnabled ? "Desmarcar todas" : "Marcar todas"}
                  >
                    {allEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <FixItemRow
                  key={item.type}
                  item={item}
                  onToggle={() => toggleItem(i)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 p-4">
          <button
            type="button"
            onClick={rejectFix}
            className="flex-1 px-4 py-2 border border-[#333] text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors"
          >
            Manter original
          </button>
          <button
            type="button"
            onClick={() => applyFix()}
            disabled={!items.some((i) => i.enabled)}
            className={cn(
              "flex-1 px-4 py-2 font-black text-[10px] uppercase tracking-widest transition-colors",
              items.some((i) => i.enabled)
                ? "bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80"
                : "bg-[#00E5FF]/20 text-[#00E5FF]/50 cursor-not-allowed"
            )}
          >
            Aplicar correções
          </button>
        </div>
      </div>
    </div>
  );
}
