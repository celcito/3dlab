import type { CutterParams } from "@/lib/cookie-cutter/cutterParams";

interface HandlesControlsProps {
  handles: CutterParams["handles"];
  onChange: (handles: Partial<CutterParams["handles"]>) => void;
}

export function HandlesControls({ handles, onChange }: HandlesControlsProps) {
  return (
    <div className="flex flex-col gap-2 text-white">
      <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
        05. Alças
      </h3>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={handles.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="accent-[#00E5FF] w-3 h-3"
        />
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
          Gerar alças automaticamente
        </span>
      </label>

      <div className={handles.enabled ? "" : "opacity-30 pointer-events-none"}>
        <div className="flex items-center justify-between py-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            Threshold (mm)
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={handles.autoThreshold}
              min={30}
              max={150}
              step={5}
              onChange={(e) => onChange({ autoThreshold: Number(e.target.value) || 70 })}
              className="w-14 bg-[#080808] border border-[#333] px-1.5 py-0.5 text-white font-mono text-[10px] text-right focus:border-[#00E5FF] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            Tipo
          </span>
          <select
            value={handles.type}
            onChange={(e) =>
              onChange({ type: e.target.value as "loop" | "tab" })
            }
            className="bg-[#080808] border border-[#333] px-1.5 py-0.5 text-white font-mono text-[10px] focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="loop">Loop (oco)</option>
            <option value="tab">Tab (sólido)</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            Largura
          </span>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min={10}
              max={40}
              step={2}
              value={handles.width}
              onChange={(e) => onChange({ width: Number(e.target.value) })}
              className="w-16 h-1 bg-[#222] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-[#00E5FF] [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="font-mono text-[10px] text-[#00E5FF] w-8 text-right">
              {handles.width}mm
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            Quantidade
          </span>
          <select
            value={handles.count}
            onChange={(e) =>
              onChange({ count: Number(e.target.value) as 1 | 2 })
            }
            className="bg-[#080808] border border-[#333] px-1.5 py-0.5 text-white font-mono text-[10px] focus:border-[#00E5FF] focus:outline-none"
          >
            <option value={1}>1 (topo)</option>
            <option value={2}>2 (topo + base)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
