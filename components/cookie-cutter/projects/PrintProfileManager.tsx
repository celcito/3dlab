import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrintProfile } from "@/lib/cookie-cutter/cutterParams";
import { BUILTIN_PROFILES, saveCustomProfile, deleteCustomProfile, loadCustomProfiles } from "@/lib/cookie-cutter/printProfiles";

interface PrintProfileManagerProps {
  open: boolean;
  onClose: () => void;
}

export function PrintProfileManager({ open, onClose }: PrintProfileManagerProps) {
  const [customProfiles, setCustomProfiles] = useState<PrintProfile[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (open) setCustomProfiles(loadCustomProfiles());
  }, [open]);

  const refresh = useCallback(() => {
    setCustomProfiles(loadCustomProfiles());
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteCustomProfile(id);
      refresh();
    },
    [refresh]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#333] w-[480px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="font-black text-xs uppercase tracking-widest text-white">
            Gerenciar perfis
          </h2>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white p-1">
            &#10005;
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-2">
              Perfis padrão
            </h3>
            <div className="space-y-1">
              {BUILTIN_PROFILES.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-[#111]/50 border border-[#222]"
                >
                  <span className="font-mono text-[10px] text-white/60">
                    {p.brand} {p.name}
                  </span>
                  <span className="font-mono text-[9px] text-white/30 ml-auto">
                    {p.buildVolume.x}&times;{p.buildVolume.y}&times;{p.buildVolume.z}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Perfis custom ({customProfiles.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1 px-2 py-0.5 border border-[#333] text-white/50 font-mono text-[9px] uppercase tracking-widest hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Novo
              </button>
            </div>

            {customProfiles.length === 0 ? (
              <p className="font-mono text-[10px] text-zinc-600 uppercase py-2">
                Nenhum perfil custom
              </p>
            ) : (
              <div className="space-y-1">
                {customProfiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-2 py-1.5 border border-[#222]"
                  >
                    <span className="font-mono text-[10px] text-[#00E5FF]">
                      {p.name}
                    </span>
                    <span className="font-mono text-[9px] text-white/30 ml-auto">
                      {p.buildVolume.x}&times;{p.buildVolume.y}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
