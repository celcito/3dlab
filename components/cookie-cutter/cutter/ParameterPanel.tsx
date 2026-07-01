import { useCallback } from "react";
import { cn } from "@/lib/utils";
import type { CutterParams } from "@/lib/cookie-cutter/cutterParams";
import { DEFAULT_PARAMS, PRESETS } from "@/lib/cookie-cutter/cutterParams";
import type { PrintProfile } from "@/lib/cookie-cutter/cutterParams";
import { PrintProfileSelector } from "./PrintProfileSelector";
import { HandlesControls } from "./HandlesControls";
import { EmbossePanel } from "./EmbossePanel";
import { EstimatePanel } from "./EstimatePanel";
import type { VectorPiece } from "@/lib/cookie-cutter/svgTypes";

interface ParameterPanelProps {
  params: CutterParams;
  onParamsChange: (params: Partial<CutterParams>) => void;
  profile: PrintProfile | null;
  estimate: {
    volumeCm3: number;
    weightG: number;
    filamentLengthM: number;
    printTimeH: number;
    costBRL: number;
  };
  piece?: VectorPiece | null;
  showWall?: boolean;
  showBlade?: boolean;
  showBase?: boolean;
  showStamp?: boolean;
  onShowWallChange?: (show: boolean) => void;
  onShowBladeChange?: (show: boolean) => void;
  onShowBaseChange?: (show: boolean) => void;
  onShowStampChange?: (show: boolean) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "mm",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/60 shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 bg-[#222] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#00E5FF] [&::-webkit-slider-thumb]:rounded-full"
        />
        <span className="font-mono text-[10px] text-[#00E5FF] w-14 text-right tabular-nums">
          {value.toFixed(step < 0.5 ? 1 : 0)} {unit}
        </span>
      </div>
    </div>
  );
}

export function ParameterPanel({
  params,
  onParamsChange,
  profile,
  estimate,
  piece,
  showWall = true,
  showBlade = true,
  showBase = true,
  showStamp = true,
  onShowWallChange,
  onShowBladeChange,
  onShowBaseChange,
  onShowStampChange,
}: ParameterPanelProps) {
  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[0]) => {
      onParamsChange(preset.params);
    },
    [onParamsChange]
  );

  return (
    <div className="flex flex-col gap-3 text-white">
      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
          01. Parâmetros
        </h3>
        <div className="space-y-0.5">
          <SliderRow label="Escala" value={params.scale} min={0.5} max={5} step={0.1} onChange={(v) => onParamsChange({ scale: v })} />
          <SliderRow label="Altura" value={params.height} min={5} max={80} step={0.5} onChange={(v) => onParamsChange({ height: v })} />
          <SliderRow label="Carimbo" value={params.stampHeight} min={0} max={30} step={0.5} onChange={(v) => onParamsChange({ stampHeight: v })} />
          <SliderRow label="Gap" value={params.stampGap} min={-2} max={5} step={0.5} onChange={(v) => onParamsChange({ stampGap: v })} />
          <SliderRow label="Parede" value={params.wallThickness} min={0.8} max={4} step={0.1} onChange={(v) => onParamsChange({ wallThickness: v })} />
          <SliderRow label="Lâmina" value={params.bladeThickness} min={0.4} max={3} step={0.1} onChange={(v) => onParamsChange({ bladeThickness: v })} />
          <SliderRow label="Base" value={params.baseThickness} min={0} max={5} step={0.5} onChange={(v) => onParamsChange({ baseThickness: v })} />
          <SliderRow label="Borda" value={params.supportEdgeThickness} min={0} max={3} step={0.5} onChange={(v) => onParamsChange({ supportEdgeThickness: v })} />
          <SliderRow label="Cantos" value={params.cornerRadius} min={0} max={10} step={0.5} onChange={(v) => onParamsChange({ cornerRadius: v })} />
        </div>
      </section>

      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
          02. Offset e Tolerância
        </h3>
        <div className="space-y-0.5">
          <SliderRow label="Off. Interno" value={params.innerOffset} min={0} max={5} step={0.1} onChange={(v) => onParamsChange({ innerOffset: v })} />
          <SliderRow label="Off. Externo" value={params.outerOffset} min={0} max={5} step={0.1} onChange={(v) => onParamsChange({ outerOffset: v })} />
          <SliderRow label="Raio Min." value={params.minRadius} min={0.4} max={5} step={0.1} onChange={(v) => onParamsChange({ minRadius: v })} />
          <SliderRow label="Esp. Mín." value={params.minPrintThickness} min={0.4} max={3} step={0.1} onChange={(v) => onParamsChange({ minPrintThickness: v })} />
          <SliderRow label="Tolerância" value={params.tolerance} min={0} max={2} step={0.05} onChange={(v) => onParamsChange({ tolerance: v })} />
        </div>
      </section>

      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
          03. Filamento
        </h3>
        <div className="space-y-2">
          <select
            value={params.filament.material}
            onChange={(e) =>
              onParamsChange({
                filament: {
                  ...params.filament,
                  material: e.target.value as CutterParams["filament"]["material"],
                },
              })
            }
            className="w-full bg-[#080808] border border-[#333] px-2 py-1 text-white font-mono text-[10px] uppercase tracking-widest focus:border-[#00E5FF] focus:outline-none appearance-none"
          >
            <option value="PLA">PLA</option>
            <option value="PETG">PETG</option>
            <option value="ABS">ABS</option>
            <option value="TPU">TPU</option>
          </select>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
              Custo/kg
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] text-white/40">R$</span>
              <input
                type="number"
                value={params.filament.costPerKg}
                min={10}
                max={500}
                step={1}
                onChange={(e) =>
                  onParamsChange({
                    filament: { ...params.filament, costPerKg: Number(e.target.value) || 80 },
                  })
                }
                className="w-16 bg-[#080808] border border-[#333] px-1.5 py-0.5 text-white font-mono text-[10px] text-right focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
          04. Perfil
        </h3>
        <PrintProfileSelector
          selectedId={params.printProfile}
          onSelect={(p) => {
            onParamsChange({ printProfile: p.id });
          }}
        />
      </section>

      <div className="flex gap-1 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handlePreset(preset)}
            className="px-2 py-1 border border-[#333] font-mono text-[9px] uppercase tracking-wider text-white/50 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
          04.1 Visibilidade
        </h3>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showWall}
              onChange={(e) => onShowWallChange?.(e.target.checked)}
              className="accent-[#00E5FF] w-3 h-3"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
              Parede
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBlade}
              onChange={(e) => onShowBladeChange?.(e.target.checked)}
              className="accent-[#00E5FF] w-3 h-3"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
              Lâmina
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBase}
              onChange={(e) => onShowBaseChange?.(e.target.checked)}
              className="accent-[#00E5FF] w-3 h-3"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
              Base
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showStamp}
              onChange={(e) => onShowStampChange?.(e.target.checked)}
              className="accent-[#00E5FF] w-3 h-3"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
              Carimbo
            </span>
          </label>
        </div>
      </section>

      <HandlesControls
        handles={params.handles}
        onChange={(h) =>
          onParamsChange({ handles: { ...params.handles, ...h } })
        }
      />

      <EmbossePanel piece={piece} />

      <EstimatePanel estimate={estimate} />
    </div>
  );
}
