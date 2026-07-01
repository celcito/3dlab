import * as THREE from "three";
import * as pc from "polygon-clipping";
import type { Shape2D } from "./svgTypes";

const pathCommands = /([MmLlHhVvCcSsQqTtAaZz])\s*([^MmLlHhVvCcSsQqTtAaZz]*)/g;

export interface PathPoint {
  x: number;
  y: number;
}

export function pointsFromPathD(d: string): PathPoint[] {
  const points: PathPoint[] = [];
  let cx = 0, cy = 0;
  let subStartX = 0, subStartY = 0;
  let lastCtrlX = 0, lastCtrlY = 0;
  let lastCmd = "";
  const segments: number[][] = [];

  let match;
  while ((match = pathCommands.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

    const isRel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();

    switch (upper) {
      case "M": {
        for (let i = 0; i < args.length; i += 2) {
          const x = isRel ? cx + args[i] : args[i];
          const y = isRel ? cy + args[i + 1] : args[i + 1];
          cx = x; cy = y;
          if (i === 0) {
            subStartX = cx;
            subStartY = cy;
            segments.push([cx, cy]);
          } else {
            segments.push([cx, cy]);
          }
        }
        lastCtrlX = cx; lastCtrlY = cy;
        break;
      }
      case "L": {
        for (let i = 0; i < args.length; i += 2) {
          cx = isRel ? cx + args[i] : args[i];
          cy = isRel ? cy + args[i + 1] : args[i + 1];
          segments.push([cx, cy]);
        }
        lastCtrlX = cx; lastCtrlY = cy;
        break;
      }
      case "H": {
        for (const v of args) {
          cx = isRel ? cx + v : v;
          segments.push([cx, cy]);
        }
        lastCtrlX = cx; lastCtrlY = cy;
        break;
      }
      case "V": {
        for (const v of args) {
          cy = isRel ? cy + v : v;
          segments.push([cx, cy]);
        }
        lastCtrlX = cx; lastCtrlY = cy;
        break;
      }
      case "C": {
        for (let i = 0; i < args.length; i += 6) {
          const c1x = isRel ? cx + args[i] : args[i];
          const c1y = isRel ? cy + args[i + 1] : args[i + 1];
          const c2x = isRel ? cx + args[i + 2] : args[i + 2];
          const c2y = isRel ? cy + args[i + 3] : args[i + 3];
          const ex = isRel ? cx + args[i + 4] : args[i + 4];
          const ey = isRel ? cy + args[i + 5] : args[i + 5];
          sampleBezier(cx, cy, c1x, c1y, c2x, c2y, ex, ey, segments);
          lastCtrlX = c2x; lastCtrlY = c2y;
          cx = ex; cy = ey;
        }
        break;
      }
      case "S": {
        for (let i = 0; i < args.length; i += 4) {
          const rx2 = lastCmd.toUpperCase() === "C" || lastCmd.toUpperCase() === "S"
            ? 2 * cx - lastCtrlX
            : cx;
          const ry2 = lastCmd.toUpperCase() === "C" || lastCmd.toUpperCase() === "S"
            ? 2 * cy - lastCtrlY
            : cy;
          const c2x = isRel ? cx + args[i] : args[i];
          const c2y = isRel ? cy + args[i + 1] : args[i + 1];
          const ex = isRel ? cx + args[i + 2] : args[i + 2];
          const ey = isRel ? cy + args[i + 3] : args[i + 3];
          sampleBezier(cx, cy, rx2, ry2, c2x, c2y, ex, ey, segments);
          lastCtrlX = c2x; lastCtrlY = c2y;
          cx = ex; cy = ey;
        }
        break;
      }
      case "Q": {
        for (let i = 0; i < args.length; i += 4) {
          const c1x = isRel ? cx + args[i] : args[i];
          const c1y = isRel ? cy + args[i + 1] : args[i + 1];
          const ex = isRel ? cx + args[i + 2] : args[i + 2];
          const ey = isRel ? cy + args[i + 3] : args[i + 3];
          sampleQuadratic(cx, cy, c1x, c1y, ex, ey, segments);
          lastCtrlX = c1x; lastCtrlY = c1y;
          cx = ex; cy = ey;
        }
        break;
      }
      case "T": {
        for (let i = 0; i < args.length; i += 2) {
          const c1x = lastCmd.toUpperCase() === "Q" || lastCmd.toUpperCase() === "T"
            ? 2 * cx - lastCtrlX
            : cx;
          const c1y = lastCmd.toUpperCase() === "Q" || lastCmd.toUpperCase() === "T"
            ? 2 * cy - lastCtrlY
            : cy;
          const ex = isRel ? cx + args[i] : args[i];
          const ey = isRel ? cy + args[i + 1] : args[i + 1];
          sampleQuadratic(cx, cy, c1x, c1y, ex, ey, segments);
          lastCtrlX = c1x; lastCtrlY = c1y;
          cx = ex; cy = ey;
        }
        break;
      }
      case "A": {
        for (let i = 0; i < args.length; i += 7) {
          const rx = args[i];
          const ry = args[i + 1];
          const rot = args[i + 2];
          const large = args[i + 3];
          const sweep = args[i + 4];
          const ex = isRel ? cx + args[i + 5] : args[i + 5];
          const ey = isRel ? cy + args[i + 6] : args[i + 6];
          if (rx === 0 || ry === 0) {
            cx = ex; cy = ey;
            segments.push([cx, cy]);
          } else {
            const arc = endpointToCenterArc(cx, cy, ex, ey, rx, ry, rot, large, sweep);
            sampleArc(arc, segments);
            cx = ex; cy = ey;
          }
          lastCtrlX = cx; lastCtrlY = cy;
        }
        break;
      }
      case "Z": {
        cx = subStartX;
        cy = subStartY;
        segments.push([cx, cy]);
        break;
      }
    }
    lastCmd = cmd;
  }

  for (const [x, y] of segments) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }

  return points;
}

function sampleBezier(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  out: number[][],
  steps = 20
) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    out.push([x, y]);
  }
}

function sampleQuadratic(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  out: number[][],
  steps = 20
) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * x1 + t * t * x2;
    const y = u * u * y0 + 2 * u * t * y1 + t * t * y2;
    out.push([x, y]);
  }
}

interface ArcParams {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  phi: number;
  theta1: number;
  deltaTheta: number;
}

function endpointToCenterArc(
  sx: number, sy: number,
  ex: number, ey: number,
  rx: number, ry: number,
  phiDeg: number,
  largeArc: number,
  sweep: number
): ArcParams {
  const phi = (phiDeg * Math.PI) / 180;
  const cosphi = Math.cos(phi);
  const sinphi = Math.sin(phi);

  const dx2 = (sx - ex) / 2;
  const dy2 = (sy - ey) / 2;
  const x1p = cosphi * dx2 + sinphi * dy2;
  const y1p = -sinphi * dx2 + cosphi * dy2;

  let rxA = Math.abs(rx);
  let ryA = Math.abs(ry);
  const lambda = (x1p * x1p) / (rxA * rxA) + (y1p * y1p) / (ryA * ryA);
  if (lambda > 1) {
    const sqrt = Math.sqrt(lambda);
    rxA *= sqrt;
    ryA *= sqrt;
  }

  const sign = largeArc === sweep ? -1 : 1;
  const num = rxA * rxA * ryA * ryA - rxA * rxA * y1p * y1p - ryA * ryA * x1p * x1p;
  const den = rxA * rxA * y1p * y1p + ryA * ryA * x1p * x1p;
  const sq = Math.max(0, num / den);
  const coef = sign * Math.sqrt(sq);
  const cxp = coef * ((rxA * y1p) / ryA);
  const cyp = coef * -((ryA * x1p) / rxA);

  const cx = cosphi * cxp - sinphi * cyp + (sx + ex) / 2;
  const cy = sinphi * cxp + cosphi * cyp + (sy + ey) / 2;

  const ux = (x1p - cxp) / rxA;
  const uy = (y1p - cyp) / ryA;
  const vx = (-x1p - cxp) / rxA;
  const vy = (-y1p - cyp) / ryA;

  const theta1 = vectorAngle(1, 0, ux, uy);
  let deltaTheta = vectorAngle(ux, uy, vx, vy);
  if (sweep === 0 && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
  if (sweep === 1 && deltaTheta < 0) deltaTheta += 2 * Math.PI;

  return { cx, cy, rx: rxA, ry: ryA, phi, theta1, deltaTheta };
}

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
  let angle = Math.acos(Math.min(1, Math.max(-1, dot / len)));
  if (ux * vy - uy * vx < 0) angle = -angle;
  return angle;
}

function sampleArc(arc: ArcParams, out: number[][], steps = 32) {
  const { cx, cy, rx, ry, phi, theta1, deltaTheta } = arc;
  const cosphi = Math.cos(phi);
  const sinphi = Math.sin(phi);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = theta1 + t * deltaTheta;
    const lx = rx * Math.cos(angle);
    const ly = ry * Math.sin(angle);
    const x = cosphi * lx - sinphi * ly + cx;
    const y = sinphi * lx + cosphi * ly + cy;
    out.push([x, y]);
  }
}

export function isClosed(points: PathPoint[], tolerance = 0.01): boolean {
  if (points.length < 2) return false;
  const first = points[0];
  const last = points[points.length - 1];
  const dx = first.x - last.x;
  const dy = first.y - last.y;
  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

export function closePath(points: PathPoint[]): PathPoint[] {
  if (points.length < 2) return points;
  if (isClosed(points)) return points;
  return [...points, { x: points[0].x, y: points[0].y }];
}

export function pathDFromPoints(points: PathPoint[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(3)} ${points[i].y.toFixed(3)}`;
  }
  d += " Z";
  return d;
}

export function shape2DToThreeShape(d: string): THREE.Shape {
  const points = pointsFromPathD(d);
  const shape = new THREE.Shape();
  if (points.length < 3) return shape;
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.closePath();
  return shape;
}

export interface Matrix2D {
  a: number; b: number; c: number; d: number; e: number; f: number;
}

export function identityMatrix(): Matrix2D {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

export function multiplyMatrices(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

export function parseTransform(transform: string): Matrix2D {
  const result = identityMatrix();
  if (!transform || !transform.trim()) return result;

  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let match;
  while ((match = re.exec(transform)) !== null) {
    const fn = match[1];
    const raw = match[2].trim();
    const args = raw.split(/[\s,]+/).filter(Boolean).map(parseFloat);
    let m: Matrix2D = identityMatrix();

    switch (fn) {
      case "matrix": {
        if (args.length >= 6) m = { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] };
        break;
      }
      case "translate": {
        const tx = args[0] || 0;
        const ty = args[1] || 0;
        m = { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
        break;
      }
      case "scale": {
        const sx = args[0] || 0;
        const sy = args.length > 1 ? args[1] : sx;
        m = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
        break;
      }
      case "rotate": {
        const angle = ((args[0] || 0) * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        if (args.length >= 3) {
          const cx = args[1] || 0;
          const cy = args[2] || 0;
          const t1 = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy };
          const r = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
          const t2 = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy };
          m = multiplyMatrices(t1, multiplyMatrices(r, t2));
        } else {
          m = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
        }
        break;
      }
      case "skewX": {
        const angle = ((args[0] || 0) * Math.PI) / 180;
        m = { a: 1, b: 0, c: Math.tan(angle), d: 1, e: 0, f: 0 };
        break;
      }
      case "skewY": {
        const angle = ((args[0] || 0) * Math.PI) / 180;
        m = { a: 1, b: Math.tan(angle), c: 0, d: 1, e: 0, f: 0 };
        break;
      }
    }
    Object.assign(result, multiplyMatrices(result, m));
  }
  return result;
}

export function applyMatrixToPathD(d: string, m: Matrix2D): string {
  return d.replace(/([MLmlHhVvCcSsQqTtAaZz])([^MLmlHhVvCcSsQqTtAaZz]*)/g, (_match, cmd, argsStr) => {
    const args = argsStr.trim().split(/[\s,]+/).filter(Boolean).map(parseFloat);
    const isRel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();
    const mapPoint = (x: number, y: number) => ({
      x: m.a * x + m.c * y + m.e,
      y: m.b * x + m.d * y + m.f,
    });
    const fmt = (v: number) => v.toFixed(3).replace(/\.?0+$/, "") || "0";

    if (isRel) {
      return cmd + " " + args.map((a) => fmt(a)).join(" ");
    }

    let out = cmd;
    switch (upper) {
      case "M":
      case "L": {
        for (let i = 0; i < args.length; i += 2) {
          const p = mapPoint(args[i], args[i + 1]);
          out += ` ${fmt(p.x)} ${fmt(p.y)}`;
        }
        break;
      }
      case "H": {
        for (const v of args) {
          const p = mapPoint(v, 0);
          out += ` ${fmt(p.x)}`;
        }
        break;
      }
      case "V": {
        for (const v of args) {
          const p = mapPoint(0, v);
          out += ` ${fmt(p.y)}`;
        }
        break;
      }
      case "C": {
        for (let i = 0; i < args.length; i += 6) {
          const c1 = mapPoint(args[i], args[i + 1]);
          const c2 = mapPoint(args[i + 2], args[i + 3]);
          const e = mapPoint(args[i + 4], args[i + 5]);
          out += ` ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(e.x)} ${fmt(e.y)}`;
        }
        break;
      }
      case "S":
      case "Q": {
        for (let i = 0; i < args.length; i += 4) {
          const c = mapPoint(args[i], args[i + 1]);
          const e = mapPoint(args[i + 2], args[i + 3]);
          out += ` ${fmt(c.x)} ${fmt(c.y)} ${fmt(e.x)} ${fmt(e.y)}`;
        }
        break;
      }
      case "T": {
        for (let i = 0; i < args.length; i += 2) {
          const e = mapPoint(args[i], args[i + 1]);
          out += ` ${fmt(e.x)} ${fmt(e.y)}`;
        }
        break;
      }
      case "A": {
        for (let i = 0; i < args.length; i += 7) {
          const e = mapPoint(args[i + 5], args[i + 6]);
          out += ` ${fmt(args[i])} ${fmt(args[i + 1])} ${fmt(args[i + 2])} ${args[i + 3]} ${args[i + 4]} ${fmt(e.x)} ${fmt(e.y)}`;
        }
        break;
      }
      case "Z":
        break;
    }
    return out;
  });
}

export function parseViewBox(viewBox: string): { x: number; y: number; w: number; h: number } | null {
  if (!viewBox) return null;
  const parts = viewBox.trim().split(/[\s,]+/).map(parseFloat);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
}

export function shapeBoundingBox(d: string): { x: number; y: number; w: number; h: number } {
  const pts = pointsFromPathD(d);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function unionShapes(shapes: Shape2D[]): Shape2D | null {
  const visible = shapes.filter((s) => s.visible !== false);
  if (visible.length === 0) return null;
  if (visible.length === 1) return visible[0];

  const polygons: pc.Polygon[] = [];

  for (const shape of visible) {
    const rings = extractRings(shape.d);
    if (rings.length === 0) continue;

    const tx = shape.transform.tx;
    const ty = shape.transform.ty;
    const sx = shape.transform.mirrorX ? -shape.transform.sx : shape.transform.sx;
    const sy = shape.transform.mirrorY ? -shape.transform.sy : shape.transform.sy;
    const rot = (shape.transform.rotation * Math.PI) / 180;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    const transformedRings: pc.Ring[] = rings.map((ring) =>
      ring.map(([x, y]) => {
        const rx = x * sx;
        const ry = y * sy;
        const rnx = rx * cos - ry * sin;
        const rny = rx * sin + ry * cos;
        return [rnx + tx, rny + ty] as [number, number];
      })
    );

    polygons.push(transformedRings);
  }

  if (polygons.length === 0) return null;

  let result: pc.MultiPolygon;
  try {
    result = pc.union(polygons[0], ...polygons.slice(1));
  } catch {
    return visible[0];
  }

  if (!result || result.length === 0) return null;

  const dParts: string[] = [];
  for (const poly of result) {
    for (const ring of poly) {
      if (ring.length < 3) continue;
      let d = `M ${num(ring[0][0])} ${num(ring[0][1])}`;
      for (let i = 1; i < ring.length; i++) {
        d += ` L ${num(ring[i][0])} ${num(ring[i][1])}`;
      }
      d += " Z";
      dParts.push(d);
    }
  }

  if (dParts.length === 0) return null;

  return {
    id: crypto.randomUUID(),
    kind: "path",
    d: dParts.join(" "),
    transform: { tx: 0, ty: 0, sx: 1, sy: 1, rotation: 0, mirrorX: false, mirrorY: false },
    fill: "nonzero",
    metadata: { name: `${visible.length} shapes` },
    visible: true,
  };
}

function extractRings(d: string): pc.Ring[] {
  const rings: pc.Ring[] = [];
  const subpaths = d.split(/(?=\s*M\s)/i);
  for (const sub of subpaths) {
    const trimmed = sub.trim();
    if (!trimmed || !/^M/i.test(trimmed)) continue;
    const pts = pointsFromPathD(trimmed);
    if (pts.length < 3) continue;
    const ring: pc.Ring = pts.map((p) => [p.x, p.y] as [number, number]);
    rings.push(ring);
  }
  return rings;
}

function num(v: number): string {
  return v.toFixed(3).replace(/\.?0+$/, "") || "0";
}
