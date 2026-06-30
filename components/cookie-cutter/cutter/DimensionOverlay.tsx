import type { CutterStats } from "@/lib/cookie-cutter/cutterBuild";

interface DimensionOverlayProps {
  stats: CutterStats;
}

export function DimensionOverlay({ stats }: DimensionOverlayProps) {
  const { w, h, d } = stats.bbox;
  const { triangleCount, perimeter } = stats;

  return (
    <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
      <div className="bg-[#0A0A0A]/80 border border-[#222] px-3 py-2 backdrop-blur-sm">
        <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest">
          <div className="flex flex-col">
            <span className="text-white/40">Largura</span>
            <span className="text-[#00E5FF]">{w.toFixed(1)} mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/40">Altura</span>
            <span className="text-[#00E5FF]">{h.toFixed(1)} mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/40">Profundidade</span>
            <span className="text-[#00E5FF]">{d.toFixed(1)} mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/40">Perímetro</span>
            <span className="text-[#00E5FF]">{perimeter.toFixed(1)} mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/40">Triângulos</span>
            <span className="text-[#00E5FF]">{triangleCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
