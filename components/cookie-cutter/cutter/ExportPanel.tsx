import { useCallback, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import type { CutterResult } from "@/lib/cookie-cutter/cutterBuild";
import type { VectorPiece } from "@/lib/cookie-cutter/svgTypes";
import { exportSTL, exportOBJ, exportGLB, export3MF, exportSVG, exportAllZip, exportBambu3MF } from "@/lib/cookie-cutter/cutterExport";
import JSZip from "jszip";
import type { CutterParams } from "@/lib/cookie-cutter/cutterParams";

interface ExportPanelProps {
  activeResult: CutterResult | null;
  activePiece: VectorPiece | null;
  allResults: CutterResult[];
  allPieceNames: string[];
  cutterParams: CutterParams | null;
}

export function ExportPanel({
  activeResult,
  activePiece,
  allResults,
  allPieceNames,
  cutterParams,
}: ExportPanelProps) {
  const hasResult = activeResult !== null;
  const hasStamps = (activeResult?.stamps?.length ?? 0) > 0;

  const handleExport = useCallback(
    (
      fn: (mesh: THREE.Mesh, filename: string) => void | Promise<void>,
      format: string
    ) => {
      if (!activeResult) return;
      const name = activePiece?.name || "cookie-cutter";
      fn(activeResult.combined, `${name}.${format}`);
    },
    [activeResult, activePiece]
  );

  const handleExportStamps = useCallback(async () => {
    if (!activeResult || !activeResult.stamps.length) return;
    const name = activePiece?.name || "cookie-cutter";
    const zip = new JSZip();
    for (let i = 0; i < activeResult.stamps.length; i++) {
      const stamp = activeResult.stamps[i];
      const exporter = await import("three/examples/jsm/exporters/STLExporter.js");
      const stlExport = new exporter.STLExporter();
      const stl = stlExport.parse(stamp, { binary: true });
      const data = stl instanceof ArrayBuffer ? stl : new TextEncoder().encode(String(stl));
      zip.file(`stamp_${(i + 1).toString().padStart(2, "0")}.stl`, data);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}_stamps.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeResult, activePiece]);

  const handleBambu3MF = useCallback(async () => {
    if (!activeResult || !cutterParams) return;
    const name = activePiece?.name || "cookie-cutter";
    await exportBambu3MF(activeResult.combined, cutterParams, `${name}_bambu.3mf`);
  }, [activeResult, activePiece, cutterParams]);

  const handleExportZip = useCallback(async () => {
    if (allResults.length === 0) return;
    const name = activePiece?.name || "cookie-cutter";
    await exportAllZip(allResults, allPieceNames, `${name}.zip`, JSZip);
  }, [allResults, allPieceNames, activePiece]);

  return (
    <div className="flex flex-col gap-2 text-white">
      <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
        08. Exportar
      </h3>

      <div className="flex flex-wrap gap-1">
        <ExportButton
          label="STL"
          disabled={!hasResult}
          onClick={() => handleExport(exportSTL, "stl")}
        />
        <ExportButton
          label="OBJ"
          disabled={!hasResult}
          onClick={() => handleExport(exportOBJ, "obj")}
        />
        <ExportButton
          label="GLB"
          disabled={!hasResult}
          onClick={() => handleExport(exportGLB, "glb")}
        />
        <ExportButton
          label="3MF"
          disabled={!hasResult}
          onClick={() => handleExport(export3MF, "3mf")}
        />
        <ExportButton
          label="3MF A1"
          disabled={!hasResult || !cutterParams}
          onClick={handleBambu3MF}
          variant="primary"
        />
        <ExportButton
          label="SVG"
          disabled={!activePiece}
          onClick={() => {
            if (activePiece) exportSVG(activePiece, `${activePiece.name}.svg`);
          }}
        />
      </div>

      {hasStamps && (
        <div className="border-t border-[#222] pt-2">
          <p className="font-mono text-[9px] text-[#ffd700] uppercase tracking-widest mb-1">
            Carimbos ({activeResult?.stamps?.length || 0})
          </p>
          <ExportButton
            label="Baixar carimbos STL (.zip)"
            disabled={false}
            onClick={handleExportStamps}
            variant="primary"
          />
        </div>
      )}

      <div className="border-t border-[#222] pt-2">
        <ExportButton
          label={`Baixar todas STL (.zip)`}
          disabled={allResults.length === 0}
          onClick={handleExportZip}
          variant="primary"
        />
      </div>
    </div>
  );
}

function ExportButton({
  label,
  disabled,
  onClick,
  variant = "default",
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "px-2 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors",
        variant === "primary"
          ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 hover:bg-[#00E5FF]/30"
          : "text-white/50 border border-[#333] hover:text-white hover:border-white/40",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}
