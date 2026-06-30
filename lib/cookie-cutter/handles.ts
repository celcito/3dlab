import * as THREE from "three";
import type { CutterParams } from "./cutterParams";

export function generateHandles(
  outerShape: THREE.Shape,
  params: CutterParams
): THREE.Shape[] {
  if (!params.handles.enabled) return [];

  const pts = outerShape.getPoints();
  if (pts.length < 3) return [];

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX;
  const h = maxY - minY;
  const maxDim = Math.max(w, h);

  if (maxDim < params.handles.autoThreshold) return [];

  const top = { x: (minX + maxX) / 2, y: maxY };
  const bot = { x: (minX + maxX) / 2, y: minY };

  const { width, thickness, type, count } = params.handles;

  const result: THREE.Shape[] = [];
  const hw = width / 2;

  function makeHandle(cx: number, cy: number, flip: boolean): THREE.Shape {
    const shape = new THREE.Shape();
    const offsetY = flip ? -thickness : thickness;

    if (type === "loop") {
      const outer = {
        x1: cx - hw, x2: cx + hw,
        y1: cy, y2: cy + offsetY + 15,
      };
      const inner = {
        x1: cx - hw + 2, x2: cx + hw - 2,
        y1: cy + offsetY + 2, y2: outer.y2 - 2,
      };

      shape.moveTo(outer.x1, outer.y1);
      shape.lineTo(outer.x2, outer.y1);
      shape.lineTo(outer.x2, outer.y2);
      shape.lineTo(outer.x1, outer.y2);
      shape.lineTo(outer.x1, outer.y1);

      const hole = new THREE.Path();
      hole.moveTo(inner.x1, inner.y1);
      hole.lineTo(inner.x2, inner.y1);
      hole.lineTo(inner.x2, inner.y2);
      hole.lineTo(inner.x1, inner.y2);
      hole.lineTo(inner.x1, inner.y1);
      shape.holes.push(hole);
    } else {
      shape.moveTo(cx - hw, cy);
      shape.lineTo(cx + hw, cy);
      shape.lineTo(cx + hw, cy + offsetY + 15);
      shape.lineTo(cx - hw, cy + offsetY + 15);
      shape.lineTo(cx - hw, cy);
    }

    return shape;
  }

  result.push(makeHandle(top.x, top.y, false));

  if (count === 2) {
    result.push(makeHandle(bot.x, bot.y, true));
  }

  return result;
}
