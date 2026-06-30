import type { VectorPiece } from "@/lib/cookie-cutter/svgTypes";

interface EmbossePanelProps {
  piece: VectorPiece | null | undefined;
}

export function EmbossePanel({ piece }: EmbossePanelProps) {
  const shapes = piece?.embosseShapes || [];
  const mode = piece?.embosseMode || "deboss";
  const depth = piece?.embosseDepth ?? 0.8;

  return (
    <div className="flex flex-col gap-2 text-white">
      <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
        06. Carimbo
      </h3>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
          Modo:{" "}
          <span className="text-[#00E5FF]">
            {mode === "emboss" ? "EMBOSS" : "DEBOSS"}
          </span>
        </span>
        <span className="font-mono text-[10px] text-white/40">
          Prof: {depth}mm
        </span>
      </div>

      {shapes.length > 0 ? (
        <div className="text-[10px] font-mono text-white/40">
          {shapes.length} carimbo{shapes.length !== 1 ? "s" : ""}
        </div>
      ) : (
        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
          Nenhum carimbo
        </p>
      )}
    </div>
  );
}
