import { VectorScene, Shape2D } from "./svgTypes";
import { shapeBoundingBox } from "./shape2D";

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

function computeSceneBBox(scene: VectorScene): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const piece of scene.pieces) {
    for (const shape of piece.shapes) {
      if (shape.visible === false) continue;
      const bbox = shapeBoundingBox(shape.d);
      const tx = shape.transform.tx;
      const ty = shape.transform.ty;
      const sx = shape.transform.mirrorX ? -shape.transform.sx : shape.transform.sx;
      const sy = shape.transform.mirrorY ? -shape.transform.sy : shape.transform.sy;
      const r = (shape.transform.rotation * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);

      const corners = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.w, y: bbox.y },
        { x: bbox.x, y: bbox.y + bbox.h },
        { x: bbox.x + bbox.w, y: bbox.y + bbox.h },
      ];

      for (const c of corners) {
        const rx = c.x * sx;
        const ry = c.y * sy;
        const cx = rx * cos - ry * sin + tx;
        const cy = rx * sin + ry * cos + ty;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);
      }
    }
  }

  if (!isFinite(minX)) return { x: 0, y: 0, w: 200, h: 200 };
  const pad = 10;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
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

  const bbox = computeSceneBBox(scene);

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}" width="${bbox.w}" height="${bbox.h}">`,
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
