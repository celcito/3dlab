interface UnitToggleProps {
  unit: "mm" | "cm";
  onToggle: () => void;
}

export function UnitToggle({ unit, onToggle }: UnitToggleProps) {
  return (
    <div className="flex items-center border border-[#333] overflow-hidden">
      <button
        type="button"
        onClick={() => unit !== "mm" && onToggle()}
        className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors ${
          unit === "mm"
            ? "bg-[#00E5FF]/20 text-[#00E5FF]"
            : "text-white/40 hover:text-white/60"
        }`}
      >
        mm
      </button>
      <button
        type="button"
        onClick={() => unit !== "cm" && onToggle()}
        className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors ${
          unit === "cm"
            ? "bg-[#00E5FF]/20 text-[#00E5FF]"
            : "text-white/40 hover:text-white/60"
        }`}
      >
        cm
      </button>
    </div>
  );
}
