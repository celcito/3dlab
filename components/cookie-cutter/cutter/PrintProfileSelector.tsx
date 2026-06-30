import { useMemo } from "react";
import { getAllProfiles } from "@/lib/cookie-cutter/printProfiles";
import type { PrintProfile } from "@/lib/cookie-cutter/cutterParams";

interface PrintProfileSelectorProps {
  selectedId: string;
  onSelect: (profile: PrintProfile) => void;
}

export function PrintProfileSelector({
  selectedId,
  onSelect,
}: PrintProfileSelectorProps) {
  const profiles = useMemo(() => getAllProfiles(), []);

  return (
    <div className="flex flex-col gap-1">
      <select
        value={selectedId}
        onChange={(e) => {
          const profile = profiles.find((p) => p.id === e.target.value);
          if (profile) onSelect(profile);
        }}
        className="w-full bg-[#080808] border border-[#333] px-2 py-1 text-white font-mono text-[10px] uppercase tracking-widest focus:border-[#00E5FF] focus:outline-none appearance-none"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.brand} {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
