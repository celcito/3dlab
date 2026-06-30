import {
  MousePointer,
  Brush,
  Sparkles,
  Eraser,
  PaintBucket,
  Scissors,
  RotateCcw,
  X,
  Crosshair,
  Undo2,
  Redo2,
  Tally5,
} from "lucide-react";
import { EditorMode } from "@/hooks/useMeshEditor";
import { Slider } from "@/components/ui/slider";

interface ToolbarProps {
  mode: EditorMode;
  setMode: (m: EditorMode) => void;
  threshold: number;
  setThreshold: (deg: number) => void;
  hasGeometry: boolean;
  hasSelection: boolean;
  isFilling: boolean;
  isCutting: boolean;
  onFill: () => void;
  onClear: () => void;
  onCut: () => void;
  onReset: () => void;
  onFrame?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOrient?: () => void;
}

const MODES: Array<{
  id: EditorMode;
  label: string;
  icon: typeof MousePointer;
  hint: string;
}> = [
  { id: "view", label: "View", icon: MousePointer, hint: "Apenas orbitar" },
  { id: "manual", label: "Manual", icon: Brush, hint: "Pintar faces" },
  {
    id: "smart",
    label: "Smart",
    icon: Sparkles,
    hint: "Selecionar área contígua",
  },
  { id: "erase", label: "Erase", icon: Eraser, hint: "Remover da seleção" },
];

export function Toolbar({
  mode,
  setMode,
  threshold,
  setThreshold,
  hasGeometry,
  hasSelection,
  isFilling,
  isCutting,
  onFill,
  onClear,
  onCut,
  onReset,
  onFrame,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOrient,
}: ToolbarProps) {
  if (!hasGeometry) return null;
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-wrap gap-2 items-center pointer-events-auto">
        <div className="flex gap-1 bg-[#0A0A0A]/90 border border-[#222] p-1 backdrop-blur-sm">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                title={m.hint}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  active
                    ? "bg-[#00E5FF] text-black"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {mode === "smart" && (
          <div className="flex items-center gap-3 bg-[#0A0A0A]/90 border border-[#222] px-3 py-2 min-w-[260px] backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold shrink-0">
              Área
            </span>
            <Slider
              value={[threshold]}
              min={5}
              max={60}
              step={1}
              onValueChange={(v) => setThreshold(v[0])}
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-[#00E5FF] w-10 text-right">
              {threshold}°
            </span>
          </div>
        )}

        <div className="flex gap-1 ml-auto pointer-events-auto">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm text-zinc-300 hover:text-white hover:border-[#00E5FF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}
          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer (Ctrl+Shift+Z)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm text-zinc-300 hover:text-white hover:border-[#00E5FF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </button>
          )}
          <button
            onClick={onFill}
            disabled={!hasSelection || isFilling}
            title="Preencher imperfeições da seleção"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm text-zinc-300 hover:text-white hover:border-[#00E5FF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <PaintBucket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preencher</span>
          </button>
          <button
            onClick={onClear}
            disabled={!hasSelection}
            title="Limpar seleção"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm text-zinc-300 hover:text-white hover:border-[#00E5FF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
          <button
            onClick={onCut}
            disabled={!hasSelection || isCutting}
            title="Confirmar corte"
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-[#00FF41] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Scissors className="w-3.5 h-3.5" />
            {isCutting ? "Cortando..." : "Confirmar corte"}
          </button>
          <button
            onClick={onReset}
            title="Carregar outro modelo"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm text-zinc-300 hover:text-white hover:border-[#00E5FF] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          {onOrient && (
            <button
              onClick={onOrient}
              title="Auto-orientar (base para baixo)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm text-zinc-300 hover:text-white hover:border-[#00E5FF] transition-colors"
            >
              <Tally5 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orient</span>
            </button>
          )}
          {onFrame && (
            <button
              onClick={onFrame}
              title="Reenquadrar câmera"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm text-zinc-300 hover:text-white hover:border-[#00E5FF] transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Frame</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
