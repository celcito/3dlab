import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProjectVersionMeta, ProjectVersion } from "@/lib/projectStorage";
import * as api from "@/lib/projects";

interface VersionHistoryProps {
  open: boolean;
  projectId: string;
  currentVersion: number;
  onClose: () => void;
  onLoadVersion: (version: ProjectVersion) => void;
}

export function VersionHistory({
  open,
  projectId,
  currentVersion,
  onClose,
  onLoadVersion,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<ProjectVersionMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    api
      .listVersions(projectId)
      .then(setVersions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, projectId]);

  if (!open) return null;

  const handleLoad = async (v: number) => {
    const data = await api.getVersion(projectId, v);
    if (data) {
      onLoadVersion(data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#333] w-[400px] max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="font-black text-xs uppercase tracking-widest text-white">
            Histórico de versões
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1"
          >
            &#10005;
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="font-mono text-[10px] text-white/40 text-center">
              Carregando...
            </p>
          ) : versions.length === 0 ? (
            <p className="font-mono text-[10px] text-zinc-500 text-center">
              Nenhuma versão salva
            </p>
          ) : (
            <div className="space-y-1">
              {versions.map((v) => {
                const isCurrent = v.version === currentVersion;
                const date = new Date(v.createdAt).toLocaleString("pt-BR");

                return (
                  <div
                    key={v.version}
                    className={cn(
                      "flex items-center gap-3 p-2 border transition-colors",
                      isCurrent
                        ? "border-[#00E5FF] bg-[#00E5FF]/5"
                        : "border-[#222] hover:border-[#333]"
                    )}
                  >
                    <div className="w-8 text-center shrink-0">
                      <span
                        className={cn(
                          "font-mono text-[10px]",
                          isCurrent ? "text-[#00E5FF]" : "text-white/40"
                        )}
                      >
                        v{v.version}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[9px] text-white/50 block">
                        {date}
                      </span>
                    </div>
                    {isCurrent ? (
                      <span className="font-mono text-[9px] text-[#00E5FF] uppercase">
                        ATUAL
                      </span>
                    ) : confirmVersion === v.version ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleLoad(v.version)}
                          className="px-2 py-0.5 bg-[#00E5FF] text-black font-mono text-[8px] uppercase"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmVersion(null)}
                          className="px-2 py-0.5 border border-[#333] text-white/50 font-mono text-[8px] uppercase"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmVersion(v.version)}
                        className="px-2 py-0.5 border border-[#333] text-white/60 font-mono text-[8px] uppercase hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
                      >
                        Carregar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
