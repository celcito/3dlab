import { cn } from "@/lib/utils";
import { useVectorEditor } from "@/hooks/useVectorEditor";

interface HistoryPanelProps {
  editor: ReturnType<typeof useVectorEditor>;
}

export function HistoryPanel({ editor }: HistoryPanelProps) {
  const { undoRedo } = editor;

  const totalEntries = undoRedo.stackSize + undoRedo.redoStackSize;
  const currentIndex = undoRedo.stackSize;

  const entries: { index: number; isCurrent: boolean; isFuture: boolean }[] = [];
  for (let i = 0; i <= totalEntries; i++) {
    entries.push({
      index: i,
      isCurrent: i === currentIndex,
      isFuture: i > currentIndex,
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-white">
          Histórico
        </h3>
        <span className="font-mono text-[10px] text-[#00E5FF]">
          {totalEntries}
        </span>
      </div>

      {totalEntries === 0 ? (
        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest py-2">
          Sem histórico
        </p>
      ) : (
        <div className="overflow-y-auto max-h-[200px] space-y-0.5 border border-[#222]">
          {entries.map((entry) => (
            <div
              key={entry.index}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest",
                entry.isCurrent && "bg-[#00E5FF]/10",
                entry.isFuture && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 flex items-center justify-center shrink-0 border text-[9px]",
                  entry.isCurrent
                    ? "border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/10"
                    : "border-[#222] text-zinc-600"
                )}
              >
                {entry.index}
              </span>
              <span
                className={cn(
                  entry.isCurrent ? "text-[#00E5FF]" : "text-white/60"
                )}
              >
                {entry.isFuture ? "Snapshot" : "Snapshot"}{" "}
                <span className="text-zinc-600">#{entry.index}</span>
              </span>
              {entry.isCurrent && (
                <span className="ml-auto text-[9px] text-[#00E5FF]">
                  ATUAL
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
