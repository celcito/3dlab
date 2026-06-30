type Point = [number, number];

function area(poly: Point[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

export function unionPolygons(a: Point[][], b: Point[][]): Point[][] {
  const all = [...a, ...b];
  if (all.length === 0) return [];
  if (all.length === 1) return [all[0]];
  return simplifiedPathBoolean(all, "union");
}

export function differencePolygons(a: Point[][], b: Point[][]): Point[][] {
  if (a.length === 0) return [];
  return simplifiedPathBoolean([...a, ...b], "difference");
}

export function intersectPolygons(a: Point[][], b: Point[][]): Point[][] {
  if (a.length === 0 || b.length === 0) return [];
  return simplifiedPathBoolean([...a, ...b], "intersection");
}

function simplifiedPathBoolean(polygons: Point[][], _op: string): Point[][] {
  const shapes: { outer: Point; inner: Point[] }[] = [];

  let current: { outer: Point; inner: Point[] } | null = null;
  for (const poly of polygons) {
    if (poly.length < 3) continue;
    const a = area(poly);
    if (a > 0) {
      if (current) shapes.push(current);
      current = { outer: poly[0], inner: poly };
    } else {
      if (!current) {
        current = { outer: poly[0], inner: [] };
      }
      current.inner = [...current.inner, ...poly];
    }
  }
  if (current) shapes.push(current);

  if (shapes.length === 0) return [];

  const result: Point[][] = [];
  for (const s of shapes) {
    const pts = normalizePolygon(s.inner);
    if (pts.length >= 3) result.push(pts as Point[]);
  }

  return result.length > 0 ? result : [];
}

function normalizePolygon(pts: Point[]): [number, number][] {
  const cleaned: Point[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (cleaned.length === 0) {
      cleaned.push(p);
      continue;
    }
    const last = cleaned[cleaned.length - 1];
    if (Math.abs(p[0] - last[0]) > 1e-6 || Math.abs(p[1] - last[1]) > 1e-6) {
      cleaned.push(p);
    }
  }
  if (cleaned.length >= 3) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (Math.abs(first[0] - last[0]) < 1e-6 && Math.abs(first[1] - last[1]) < 1e-6) {
      cleaned.pop();
    }
  }
  return cleaned as [number, number][];
}

export function polygonsEqual(a: Point[], b: Point[], tolerance = 1e-4): boolean {
  if (a.length !== b.length) return false;
  const n = a.length;
  for (let offset = 0; offset < n; offset++) {
    let match = true;
    for (let i = 0; i < n; i++) {
      const ai = a[i];
      const bi = b[(i + offset) % n];
      if (Math.abs(ai[0] - bi[0]) > tolerance || Math.abs(ai[1] - bi[1]) > tolerance) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
