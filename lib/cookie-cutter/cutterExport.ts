import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { CutterResult } from "./cutterBuild";
import type { VectorPiece } from "./svgTypes";
import { sceneToSvgString } from "./svgExport";
import { generateBambuProfile } from "./bambuProfile";
import { write3MF } from "./threemfWriter";
import type { CutterParams } from "./cutterParams";
import type JSZip from "jszip";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSTL(mesh: THREE.Mesh, filename: string): void {
  const exporter = new STLExporter();
  const stl = exporter.parse(mesh, { binary: true });
  const data = stl instanceof ArrayBuffer ? stl : new TextEncoder().encode(String(stl));
  const blob = new Blob([data], {
    type: "application/octet-stream",
  });
  downloadBlob(blob, filename.endsWith(".stl") ? filename : `${filename}.stl`);
}

export function exportOBJ(mesh: THREE.Mesh, filename: string): void {
  const exporter = new OBJExporter();
  const obj = exporter.parse(mesh);
  const blob = new Blob([obj], { type: "text/plain" });
  downloadBlob(blob, filename.endsWith(".obj") ? filename : `${filename}.obj`);
}

export async function exportGLB(mesh: THREE.Mesh, filename: string): Promise<void> {
  const exporter = new GLTFExporter();
  const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      mesh,
      (result) => resolve(result as ArrayBuffer),
      (err) => reject(err),
      { binary: true }
    );
  });
  const blob = new Blob([glb], { type: "model/gltf-binary" });
  downloadBlob(blob, filename.endsWith(".glb") ? filename : `${filename}.glb`);
}

export function export3MF(mesh: THREE.Mesh, filename: string): void {
  const exporter = new STLExporter();
  const stl = exporter.parse(mesh, { binary: true });
  const data = stl instanceof ArrayBuffer ? stl : new TextEncoder().encode(String(stl));
  const blob = new Blob([data], {
    type: "application/vnd.ms-package.3dmanufacturing-3dmodel",
  });
  downloadBlob(blob, filename.endsWith(".3mf") ? filename : `${filename}.3mf`);
}

export function exportSVG(piece: VectorPiece, filename: string): void {
  const scene = {
    pieces: [piece],
    activePieceId: piece.id,
    view: { panX: 0, panY: 0, zoom: 1 },
    grid: { enabled: false, size: 10, snap: false, snapTolerance: 5 },
  };
  const svg = sceneToSvgString(scene);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  downloadBlob(blob, filename.endsWith(".svg") ? filename : `${filename}.svg`);
}

export async function exportAllZip(
  results: CutterResult[],
  pieceNames: string[],
  zipFilename: string,
  JSZipModule: typeof JSZip
): Promise<void> {
  const zip = new (JSZipModule as any)();

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const name = pieceNames[i] || `Piece_${(i + 1).toString().padStart(2, "0")}`;
    const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "_");

    const exporter = new STLExporter();
    const stl = exporter.parse(result.combined, { binary: true });
    const data = stl instanceof ArrayBuffer ? stl : new TextEncoder().encode(String(stl));
    zip.file(sanitized + ".stl", data);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(
    zipBlob,
    zipFilename.endsWith(".zip") ? zipFilename : `${zipFilename}.zip`
  );
}

export async function exportBambu3MF(
  mesh: THREE.Mesh,
  params: CutterParams,
  filename: string
): Promise<void> {
  const profile = generateBambuProfile(params);
  const blob = await write3MF(mesh, profile);
  downloadBlob(blob, filename.endsWith(".3mf") ? filename : `${filename}.3mf`);
}
