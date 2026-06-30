import { VectorScene, Shape2D } from "./svgTypes";

function composeTransformStr(shape: Shape2D): string {
  const t = shape.transform;
  const parts: string[] = [];
  if (t.tx !== 0 || t.ty !== 0) parts.push(`translate(${t.tx},${t.ty})`);
  if (t.rotation !== 0) parts.push(`rotate(${t.rotation})`);
  if (t.sx !== 1 || t.sy !== 1) {
    const sx = t.mirrorX ? -t.sx : t.sx;
    const sy = t.mirrorY ? -t.sy : t.sy;
    if (sx !== 1 || sy !== 1) parts.push(`scale(${sx},${sy})`);
  } else {
    if (t.mirrorX) parts.push("scale(-1,1)");
    if (t.mirrorY) parts.push("scale(1,-1)");
  }
  return parts.join(" ");
}

export function sceneToSvgString(scene: VectorScene): string {
  const pieces = scene.pieces;
  const shapes: string[] = [];

  for (const piece of pieces) {
    shapes.push(`  <g id="${escapeXml(piece.name)}">`);
    for (const shape of piece.shapes) {
      if (shape.visible === false) continue;
      const transform = composeTransformStr(shape);
      const fillRule = shape.fill === "evenodd" ? ' fill-rule="evenodd"' : "";
      if (transform) {
        shapes.push(`    <g transform="${escapeXml(transform)}">`);
        shapes.push(`      <path d="${escapeXml(shape.d)}"${fillRule} />`);
        shapes.push(`    </g>`);
      } else {
        shapes.push(`    <path d="${escapeXml(shape.d)}"${fillRule} />`);
      }
    }
    shapes.push(`  </g>`);
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">`,
    ...shapes,
    `</svg>`,
  ].join("\n");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function downloadSvg(scene: VectorScene, filename: string): void {
  const svg = sceneToSvgString(scene);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
