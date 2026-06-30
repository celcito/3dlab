import { useState, useCallback } from "react";
import { Plus, Trash2, Wifi } from "lucide-react";
import type { SavedPrinter } from "@/lib/cookie-cutter/printerConfig";
import { savePrinter, deletePrinter, loadPrinters, defaultPrinterTypes } from "@/lib/cookie-cutter/printerConfig";

interface PrinterSetupProps {
  open: boolean;
  onClose: () => void;
}

export function PrinterSetup({ open, onClose }: PrinterSetupProps) {
  const [printers, setPrinters] = useState<SavedPrinter[]>([]);
  const [showForm, setShowForm] = useState(false);

  useState(() => {
    if (open) setPrinters(loadPrinters());
  });

  const refresh = useCallback(() => {
    setPrinters(loadPrinters());
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deletePrinter(id);
      refresh();
    },
    [refresh]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#333] w-[440px] max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="font-black text-xs uppercase tracking-widest text-white">
            Configurar impressoras
          </h2>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white p-1">
            &#10005;
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-white/40">
              {printers.length} impressora{printers.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 px-2 py-0.5 border border-[#333] text-white/50 font-mono text-[9px] uppercase tracking-widest hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Adicionar
            </button>
          </div>

          {printers.length === 0 ? (
            <p className="font-mono text-[10px] text-zinc-600 text-center py-4">
              Nenhuma impressora configurada
            </p>
          ) : (
            <div className="space-y-1.5 mb-3">
              {printers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 border border-[#222]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-[10px] uppercase tracking-widest text-white truncate">
                      {p.name}
                    </div>
                    <div className="font-mono text-[9px] text-white/30">
                      {defaultPrinterTypes.find((t) => t.id === p.type)?.label || p.type}
                      {p.ip && ` — ${p.ip}`}
                    </div>
                  </div>
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

          <div className="border-t border-[#222] pt-3">
            <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Envio direto via WiFi: em breve (v2)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
