import * as THREE from "three";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { STLExporter } from "./threeShims";
import { triangleCount } from "./loaders";

export interface ExportablePiece {
  id: string;
  name: string;
  mesh: THREE.Mesh;
}

function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

function stlToUint8Array(mesh: THREE.Mesh): Uint8Array {
  const exporter = new STLExporter();
  const geom = mesh.geometry.clone();
  if (mesh.matrixWorld) {
    mesh.updateMatrixWorld(true);
    geom.applyMatrix4(mesh.matrixWorld);
  }
  const flatMesh = new THREE.Mesh(geom);
  const result = exporter.parse(flatMesh, { binary: true });
  if (result instanceof DataView) {
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
  }
  return new Uint8Array(result as ArrayBuffer);
}

export function exportPieceStl(
  mesh: THREE.Mesh,
  filename: string
): { filename: string; tris: number } {
  const tris = triangleCount(mesh.geometry);
  const bytes = stlToUint8Array(mesh);
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const finalName = filename.toLowerCase().endsWith(".stl")
    ? filename
    : `${filename}.stl`;
  downloadBlob(blob, finalName);
  return { filename: finalName, tris };
}

export async function exportAllZip(
  pieces: ExportablePiece[],
  zipFilename = "parts.zip"
): Promise<{ files: number; bytes: number }> {
  const zip = new JSZip();
  for (const piece of pieces) {
    const bytes = stlToUint8Array(piece.mesh);
    const name = piece.name.toLowerCase().endsWith(".stl")
      ? piece.name
      : `${piece.name}.stl`;
    zip.file(name, bytes);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, zipFilename);
  return { files: pieces.length, bytes: blob.size };
}
