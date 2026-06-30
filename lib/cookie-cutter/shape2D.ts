import * as THREE from "three";

const pathCommands = /([MmLlHhVvCcSsQqTtAaZz])\s*([^MmLlHhVvCcSsQqTtAaZz]*)/g;

export interface PathPoint {
  x: number;
  y: number;
}

export function pointsFromPathD(d: string): PathPoint[] {
  const points: PathPoint[] = [];
  let cx = 0, cy = 0;
  let subStartX = 0, subStartY = 0;
  const segments: number[][] = [];

  let match;
  while ((match = pathCommands.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

    switch (cmd) {
      case "M": {
        cx = args[0];
        cy = args[1];
        subStartX = cx;
        subStartY = cy;
        segments.push([cx, cy]);
        for (let i = 2; i < args.length; i += 2)
          segments.push([args[i], args[i + 1]]);
        break;
      }
      case "m": {
        cx += args[0];
        cy += args[1];
        subStartX = cx;
        subStartY = cy;
        segments.push([cx, cy]);
        for (let i = 2; i < args.length; i += 2)
          segments.push([cx + args[i], cy + args[i + 1]]);
        break;
      }
      case "L": {
        for (let i = 0; i < args.length; i += 2) {
          cx = args[i];
          cy = args[i + 1];
          segments.push([cx, cy]);
        }
        break;
      }
      case "l": {
        for (let i = 0; i < args.length; i += 2) {
          cx += args[i];
          cy += args[i + 1];
          segments.push([cx, cy]);
        }
        break;
      }
      case "H": {
        for (const x of args) {
          cx = x;
          segments.push([cx, cy]);
        }
        break;
      }
      case "h": {
        for (const dx of args) {
          cx += dx;
          segments.push([cx, cy]);
        }
        break;
      }
      case "V": {
        for (const y of args) {
          cy = y;
          segments.push([cx, cy]);
        }
        break;
      }
      case "v": {
        for (const dy of args) {
          cy += dy;
          segments.push([cx, cy]);
        }
        break;
      }
      case "Z":
      case "z": {
        cx = subStartX;
        cy = subStartY;
        segments.push([cx, cy]);
        break;
      }
      case "C": {
        for (let i = 0; i < args.length; i += 6)
          sampleBezier(cx, cy, args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], args[i + 5], segments);
        cx = args[args.length - 2];
        cy = args[args.length - 1];
        break;
      }
      case "c": {
        for (let i = 0; i < args.length; i += 6)
          sampleBezier(cx, cy, cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3], cx + args[i + 4], cy + args[i + 5], segments);
        cx += args[args.length - 2];
        cy += args[args.length - 1];
        break;
      }
      case "Q": {
        for (let i = 0; i < args.length; i += 4)
          sampleQuadratic(cx, cy, args[i], args[i + 1], args[i + 2], args[i + 3], segments);
        cx = args[args.length - 2];
        cy = args[args.length - 1];
        break;
      }
      case "q": {
        for (let i = 0; i < args.length; i += 4)
          sampleQuadratic(cx, cy, cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3], segments);
        cx += args[args.length - 2];
        cy += args[args.length - 1];
        break;
      }
      case "S": {
        for (let i = 0; i < args.length; i += 4) {
          const rx = 2 * cx - (segments[segments.length - 1]?.[0] ?? cx);
          const ry = 2 * cy - (segments[segments.length - 1]?.[1] ?? cy);
          sampleBezier(cx, cy, rx, ry, args[i], args[i + 1], args[i + 2], args[i + 3], segments);
          cx = args[i + 2];
          cy = args[i + 3];
        }
        break;
      }
      case "s": {
        for (let i = 0; i < args.length; i += 4) {
          const rx = 2 * cx - (segments[segments.length - 1]?.[0] ?? cx);
          const ry = 2 * cy - (segments[segments.length - 1]?.[1] ?? cy);
          sampleBezier(cx, cy, rx, ry, cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3], segments);
          cx += args[i + 2];
          cy += args[i + 3];
        }
        break;
      }
      case "A": {
        for (let i = 0; i < args.length; i += 7)
          sampleArc(cx, cy, args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], args[i + 5], segments);
        cx = args[args.length - 2];
        cy = args[args.length - 1];
        break;
      }
      case "a": {
        for (let i = 0; i < args.length; i += 7)
          sampleArc(cx, cy, args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], cx + args[i + 5], segments);
        cx += args[args.length - 2];
        cy += args[args.length - 1];
        break;
      }
    }
  }

  for (const [x, y] of segments) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }

  return points;
}

function sampleBezier(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, out: number[][], steps = 20) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    out.push([x, y]);
  }
}

function sampleQuadratic(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, out: number[][], steps = 20) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * x1 + t * t * x2;
    const y = u * u * y0 + 2 * u * t * y1 + t * t * y2;
    out.push([x, y]);
  }
}

function sampleArc(cx: number, cy: number, rx: number, ry: number, _rot: number, _large: number, _sweep: number, ex: number, out: number[][], steps = 32) {
  const dx = ex - cx;
  const dy = cy - (out.length > 0 ? out[out.length - 1][1] - cy : 0);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    out.push([x, y]);
  }
  out.push([ex, cy]);
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
  if (points.length < 3) {
    const shape = new THREE.Shape();
    return shape;
  }
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }
  return shape;
}
