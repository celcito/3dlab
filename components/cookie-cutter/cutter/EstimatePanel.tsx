import type { PrintEstimate } from "@/lib/cookie-cutter/cutterParams";

interface EstimatePanelProps {
  estimate: PrintEstimate;
}

export function EstimatePanel({ estimate }: EstimatePanelProps) {
  const timeColor =
    estimate.printTimeH < 2
      ? "text-[#00FF41]"
      : estimate.printTimeH < 6
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="flex flex-col gap-2 text-white">
      <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
        07. Estimativa
      </h3>

      <div className="space-y-1">
        <Row label="Volume" value={`${estimate.volumeCm3.toFixed(1)} cm³`} />
        <Row label="Peso" value={`${estimate.weightG.toFixed(0)} g`} />
        <Row label="Filamento" value={`${estimate.filamentLengthM.toFixed(1)} m`} />
        <Row
          label="Tempo"
          value={`${estimate.printTimeH.toFixed(1)} h`}
          valueColor={timeColor}
        />
        <Row
          label="Custo"
          value={`R$ ${estimate.costBRL.toFixed(2)}`}
          valueColor="text-[#00E5FF]"
        />
      </div>

      <p className="font-mono text-[9px] text-white/30 uppercase leading-tight">
        Estimativa aproximada (±30%). Valide no seu fatiador.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  valueColor = "text-white/80",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
        {label}
      </span>
      <span className={`font-mono text-[10px] tabular-nums ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}
