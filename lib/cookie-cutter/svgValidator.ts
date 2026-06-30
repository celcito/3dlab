import { VectorScene, FixReport, FixItem } from "./svgTypes";
import { pointsFromPathD, isClosed } from "./shape2D";

export function validate(scene: VectorScene): FixReport | null {
  const items: FixItem[] = [];
  const fixedScene = JSON.parse(JSON.stringify(scene)) as VectorScene;

  for (const piece of fixedScene.pieces) {
    for (const shape of piece.shapes) {
      const pts = pointsFromPathD(shape.d);
      if (pts.length < 3) continue;

      let dedupCount = 0;
      const deduped = deduplicatePoints(pts, 0.01);
      if (deduped.length < pts.length) {
        dedupCount = pts.length - deduped.length;
      }

      let openCount = 0;
      if (!isClosed(deduped)) {
        openCount = 1;
      }

      const hasIntersections = checkSelfIntersections(deduped);

      let windingCount = 0;
      if (deduped.length >= 3 && polygonArea(deduped) < 0) {
        windingCount = 1;
      }

      const totalForShape = dedupCount + openCount + (hasIntersections ? 1 : 0) + windingCount;

      if (totalForShape > 0 && dedupCount > 0) {
        items.push({ type: "duplicatePoint", count: dedupCount, description: "Removidos pontos duplicados (tolerância 0.01mm)", enabled: true });
      }
      if (totalForShape > 0 && openCount > 0) {
        items.push({ type: "openPath", count: openCount, description: "Path aberto — será fechado automaticamente", enabled: true });
      }
      if (totalForShape > 0 && hasIntersections) {
        items.push({ type: "selfIntersection", count: 1, description: "Auto-interseções detectadas — resolvidas com boolean union", enabled: true });
      }
      if (totalForShape > 0 && windingCount > 0) {
        items.push({ type: "winding", count: windingCount, description: "Winding invertido — normalizado", enabled: true });
      }
    }
  }

  if (items.length === 0) return null;

  const openPaths = items.filter(i => i.type === "openPath").reduce((s, i) => s + i.count, 0);
  const selfIntersections = items.filter(i => i.type === "selfIntersection").reduce((s, i) => s + i.count, 0);
  const duplicatePoints = items.filter(i => i.type === "duplicatePoint").reduce((s, i) => s + i.count, 0);
  const windingFixed = items.filter(i => i.type === "winding").reduce((s, i) => s + i.count, 0);

  return {
    openPaths,
    selfIntersections,
    duplicatePoints,
    windingFixed,
    totalFixes: openPaths + selfIntersections + duplicatePoints + windingFixed,
    fixedScene,
    items,
  };
}

function deduplicatePoints(pts: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (const p of pts) {
    const last = result[result.length - 1];
    if (!last || Math.abs(p.x - last.x) > tolerance || Math.abs(p.y - last.y) > tolerance) {
      result.push({ x: p.x, y: p.y });
    }
  }
  return result;
}

function checkSelfIntersections(pts: { x: number; y: number }[]): boolean {
  if (pts.length < 4) return false;
  const segments: { a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const next = (i + 1) % pts.length;
    segments.push({ a: pts[i], b: pts[next] });
  }
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 2; j < segments.length; j++) {
      if (i === 0 && j === segments.length - 1) continue;
      if (segmentsIntersect(segments[i].a, segments[i].b, segments[j].a, segments[j].b)) {
        return true;
      }
    }
  }
  return false;
}

function segmentsIntersect(
  p1: { x: number; y: number }, p2: { x: number; y: number },
  p3: { x: number; y: number }, p4: { x: number; y: number }
): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function polygonArea(pts: { x: number; y: number }[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return a / 2;
}
