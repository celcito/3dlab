import * as THREE from "three";
import type { CutterParams } from "./cutterParams";

export function generateRibs(
  outer: THREE.Shape,
  inner: THREE.Shape,
  height: number,
  params: CutterParams
): THREE.Shape[] {
  if (!params.reinforcements.auto) return [];

  const outerPts = outer.getPoints();
  if (outerPts.length < 4) return [];

  const innerPts = inner.getPoints();
  if (innerPts.length < 4) return [];

  let perimeter = 0;
  for (let i = 0; i < outerPts.length; i++) {
    const j = (i + 1) % outerPts.length;
    const dx = outerPts[j].x - outerPts[i].x;
    const dy = outerPts[j].y - outerPts[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }

  const count = Math.min(50, Math.floor(perimeter / params.reinforcements.spacing));
  if (count === 0) return [];

  const ribs: THREE.Shape[] = [];
  const { thickness } = params.reinforcements;

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;

    let cumulative = 0;
    let outerPt: THREE.Vector2 | null = null;
    const total = perimeter;

    for (let j = 0; j < outerPts.length; j++) {
      const k = (j + 1) % outerPts.length;
      const dx = outerPts[k].x - outerPts[j].x;
      const dy = outerPts[k].y - outerPts[j].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const segEnd = cumulative + segLen;

      if (cumulative / total <= t && segEnd / total >= t) {
        const localT = (t * total - cumulative) / segLen;
        outerPt = new THREE.Vector2(
          outerPts[j].x + dx * localT,
          outerPts[j].y + dy * localT
        );
        break;
      }
      cumulative = segEnd;
    }

    if (!outerPt) continue;

    const cx = (outer.getPoints()[0].x);
    const cy = (outer.getPoints()[0].y);
    const dirX = outerPt.x - cx;
    const dirY = outerPt.y - cy;
    const mag = Math.sqrt(dirX * dirX + dirY * dirY);
    if (mag < 1e-6) continue;

    const nx = dirX / mag;
    const ny = dirY / mag;

    let innerPt: THREE.Vector2 | null = null;
    for (const ip of innerPts) {
      const dxI = ip.x - cx;
      const dyI = ip.y - cy;
      const cross = Math.abs(nx * dyI - ny * dxI);
      if (cross < 5) {
        const dot = nx * dxI + ny * dyI;
        if (dot > 0 && dot < mag) {
          innerPt = new THREE.Vector2(ip.x, ip.y);
          break;
        }
      }
    }

    if (!innerPt) continue;

    const rib = new THREE.Shape();
    const hw = thickness / 2;
    const px = -ny * hw;
    const py = nx * hw;

    rib.moveTo(outerPt.x + px, outerPt.y + py);
    rib.lineTo(outerPt.x - px, outerPt.y - py);
    rib.lineTo(innerPt.x - px, innerPt.y - py);
    rib.lineTo(innerPt.x + px, innerPt.y + py);
    rib.lineTo(outerPt.x + px, outerPt.y + py);

    ribs.push(rib);
  }

  return ribs;
}
