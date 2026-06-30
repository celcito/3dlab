import { VectorScene, FixReport } from "./svgTypes";
import { validate } from "./svgValidator";
import { pointsFromPathD, isClosed, closePath, pathDFromPoints } from "./shape2D";
import { unionPolygons } from "./polygonOps";

export function autoFix(scene: VectorScene): { fixed: VectorScene; report: FixReport } {
  const report = validate(scene);
  if (!report) {
    return { fixed: scene, report: { openPaths: 0, selfIntersections: 0, duplicatePoints: 0, windingFixed: 0, totalFixes: 0, fixedScene: scene, items: [] } };
  }

  const fixed = JSON.parse(JSON.stringify(scene)) as VectorScene;
  let openPaths = 0;
  let selfIntersections = 0;
  let duplicatePoints = 0;
  let windingFixed = 0;

  for (const piece of fixed.pieces) {
    for (const shape of piece.shapes) {
      const pts = pointsFromPathD(shape.d);
      if (pts.length < 3) continue;

      const deduped = deduplicatePoints(pts, 0.01);
      duplicatePoints += pts.length - deduped.length;

      let cleaned = deduped;
      if (!isClosed(cleaned)) {
        cleaned = closePath(cleaned);
        openPaths++;
      }

      const polygon = cleaned.map(p => [p.x, p.y] as [number, number]);

      if (hasSelfIntersections(polygon)) {
        const fixedPolygons = unionPolygons([polygon], []);
        selfIntersections++;
        if (fixedPolygons.length > 0) {
          const largest = fixedPolygons.reduce((a, b) => a.length > b.length ? a : b);
          if (largest.length >= 3) {
            cleaned = largest.map(([x, y]) => ({ x, y }));
          }
        }
      }

      if (cleaned.length >= 3 && polygonArea(cleaned) < 0) {
        cleaned.reverse();
        windingFixed++;
      }

      shape.d = pathDFromPoints(cleaned);
    }
  }

  const totalFixes = openPaths + selfIntersections + duplicatePoints + windingFixed;

  return {
    fixed,
    report: {
      openPaths,
      selfIntersections,
      duplicatePoints,
      windingFixed,
      totalFixes,
      fixedScene: fixed,
      items: report.items,
    },
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

function hasSelfIntersections(polygon: [number, number][]): boolean {
  if (polygon.length < 4) return false;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    for (let j = i + 2; j < polygon.length; j++) {
      if (i === 0 && j === polygon.length - 1) continue;
      const c = polygon[j];
      const d = polygon[(j + 1) % polygon.length];
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
}

function segmentsIntersect(
  [x1, y1]: [number, number], [x2, y2]: [number, number],
  [x3, y3]: [number, number], [x4, y4]: [number, number]
): boolean {
  const d1 = cross2(x3, y3, x4, y4, x1, y1);
  const d2 = cross2(x3, y3, x4, y4, x2, y2);
  const d3 = cross2(x1, y1, x2, y2, x3, y3);
  const d4 = cross2(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross2(ox: number, oy: number, ax: number, ay: number, bx: number, by: number): number {
  return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
}

function polygonArea(pts: { x: number; y: number }[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return a / 2;
}
