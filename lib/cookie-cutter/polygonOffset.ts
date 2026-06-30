import * as THREE from "three";

type Vec2 = { x: number; y: number };

function signedArea(pts: Vec2[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return a / 2;
}

function normalize(v: Vec2, length: number): Vec2 {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: (v.x / mag) * length, y: (v.y / mag) * length };
}

function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

export function offsetPolygon(
  points: Vec2[],
  distance: number,
  miterLimit = 8
): Vec2[] {
  if (points.length < 3) return points;
  const area = signedArea(points);
  if (area < 0) points = [...points].reverse();

  const n = points.length;
  const edges: Vec2[] = [];
  const normals: Vec2[] = [];

  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const edge = { x: b.x - a.x, y: b.y - a.y };
    edges.push(edge);
    const len = Math.sqrt(edge.x * edge.x + edge.y * edge.y);
    if (len > 0) {
      normals.push({ x: -edge.y / len, y: edge.x / len });
    } else {
      normals.push({ x: 0, y: 0 });
    }
  }

  const result: Vec2[] = [];

  for (let i = 0; i < n; i++) {
    const prevN = normals[(i - 1 + n) % n];
    const currN = normals[i];
    const bisecDir = {
      x: (prevN.x + currN.x) / 2,
      y: (prevN.y + currN.y) / 2,
    };

    const bisecMag = Math.sqrt(bisecDir.x * bisecDir.x + bisecDir.y * bisecDir.y);
    if (bisecMag < 1e-6) {
      result.push({ x: points[i].x + currN.x * distance, y: points[i].y + currN.y * distance });
      continue;
    }

    bisecDir.x /= bisecMag;
    bisecDir.y /= bisecMag;

    const dot = currN.x * bisecDir.x + currN.y * bisecDir.y;
    const offsetDist = dot > 1e-6 ? distance / dot : distance;

    const clamped = Math.abs(offsetDist) > miterLimit * Math.abs(distance)
      ? (miterLimit * Math.abs(distance)) * Math.sign(offsetDist)
      : offsetDist;

    result.push({
      x: points[i].x + bisecDir.x * clamped,
      y: points[i].y + bisecDir.y * clamped,
    });
  }

  return result;
}

export function offsetShape(
  shape: THREE.Shape,
  distance: number
): THREE.Shape {
  const pts = shape.getPoints();
  const vec2: Vec2[] = pts.map((p) => ({ x: p.x, y: p.y }));
  const offset = offsetPolygon(vec2, distance);
  const newShape = new THREE.Shape();
  if (offset.length > 0) {
    newShape.moveTo(offset[0].x, offset[0].y);
    for (let i = 1; i < offset.length; i++) {
      newShape.lineTo(offset[i].x, offset[i].y);
    }
  }
  return newShape;
}

export function scaleShape(
  shape: THREE.Shape,
  scale: number
): THREE.Shape {
  const pts = shape.getPoints();
  if (pts.length < 3) return new THREE.Shape();
  let cx = 0,
    cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts.length;
  cy /= pts.length;

  const newShape = new THREE.Shape();
  const scaled = pts.map((p) => ({ x: cx + (p.x - cx) * scale, y: cy + (p.y - cy) * scale }));
  newShape.moveTo(scaled[0].x, scaled[0].y);
  for (let i = 1; i < scaled.length; i++) {
    newShape.lineTo(scaled[i].x, scaled[i].y);
  }
  return newShape;
}
