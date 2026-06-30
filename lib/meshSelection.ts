import * as THREE from "three";

export function ensureIndexed(
  geometry: THREE.BufferGeometry
): THREE.BufferGeometry {
  if (geometry.index) return geometry;
  return geometry.toNonIndexed();
}

export function faceCount(geometry: THREE.BufferGeometry): number {
  const index = geometry.index;
  const posCount = geometry.attributes.position?.count ?? 0;
  if (index) return index.count / 3;
  return posCount / 3;
}

export function computeFaceNormals(
  geometry: THREE.BufferGeometry
): THREE.Vector3[] {
  const geom = ensureIndexed(geometry);
  const index = geom.index!;
  const position = geom.attributes.position;
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const numFaces = index.count / 3;
  const normals: THREE.Vector3[] = new Array(numFaces);
  for (let f = 0; f < numFaces; f++) {
    va.fromBufferAttribute(position, index.getX(f * 3));
    vb.fromBufferAttribute(position, index.getX(f * 3 + 1));
    vc.fromBufferAttribute(position, index.getX(f * 3 + 2));
    cb.subVectors(vc, vb);
    ab.subVectors(va, vb);
    cb.cross(ab);
    if (cb.lengthSq() > 1e-20) {
      cb.normalize();
    }
    normals[f] = cb.clone();
  }
  return normals;
}

function buildFaceAdjacency(geometry: THREE.BufferGeometry): number[][] {
  const geom = ensureIndexed(geometry);
  const index = geom.index!;
  const numFaces = index.count / 3;
  const edgeMap = new Map<string, number[]>();
  for (let f = 0; f < numFaces; f++) {
    const a = index.getX(f * 3);
    const b = index.getX(f * 3 + 1);
    const c = index.getX(f * 3 + 2);
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ] as Array<[number, number]>) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      const arr = edgeMap.get(key);
      if (arr) {
        arr.push(f);
      } else {
        edgeMap.set(key, [f]);
      }
    }
  }
  const adj: number[][] = new Array(numFaces);
  for (let f = 0; f < numFaces; f++) adj[f] = [];
  for (const faces of edgeMap.values()) {
    if (faces.length >= 2) {
      for (let i = 0; i < faces.length; i++) {
        for (let j = i + 1; j < faces.length; j++) {
          const a = faces[i];
          const b = faces[j];
          if (!adj[a].includes(b)) adj[a].push(b);
          if (!adj[b].includes(a)) adj[b].push(a);
        }
      }
    }
  }
  return adj;
}

export function smartSelect(
  geometry: THREE.BufferGeometry,
  seedFace: number,
  thresholdDeg: number
): Set<number> {
  const numFaces = faceCount(geometry);
  if (seedFace < 0 || seedFace >= numFaces) {
    throw new Error(`faceIndex fora do range: ${seedFace}/${numFaces}`);
  }
  const normals = computeFaceNormals(geometry);
  const adjacency = buildFaceAdjacency(geometry);
  const seedNormal = normals[seedFace];
  if (seedNormal.lengthSq() < 1e-20) {
    return new Set([seedFace]);
  }
  const thresholdCos = Math.cos((thresholdDeg * Math.PI) / 180);
  const selected = new Set<number>([seedFace]);
  const queue: number[] = [seedFace];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency[current]) {
      if (selected.has(neighbor)) continue;
      const dot = seedNormal.dot(normals[neighbor]);
      if (dot >= thresholdCos) {
        selected.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return selected;
}

export function averageFaceNormal(
  geometry: THREE.BufferGeometry,
  faces: Iterable<number>
): THREE.Vector3 {
  const normals = computeFaceNormals(geometry);
  const acc = new THREE.Vector3();
  let n = 0;
  for (const f of faces) {
    if (f < 0 || f >= normals.length) continue;
    acc.add(normals[f]);
    n++;
  }
  if (n > 0) acc.divideScalar(n);
  if (acc.lengthSq() < 1e-20) acc.set(0, 1, 0);
  return acc.normalize();
}

export function fillHoles(
  geometry: THREE.BufferGeometry,
  selected: Set<number>,
  thresholdDeg = 30
): Set<number> {
  const numFaces = faceCount(geometry);
  if (selected.size === 0) return new Set(selected);
  const normals = computeFaceNormals(geometry);
  const selNormal = averageFaceNormal(geometry, selected);
  const thresholdCos = Math.cos((thresholdDeg * Math.PI) / 180);

  const merged = new Set(selected);
  let changed = true;
  let safety = numFaces;
  while (changed && safety-- > 0) {
    changed = false;
    for (let f = 0; f < numFaces; f++) {
      if (merged.has(f)) continue;
      const n = normals[f];
      if (n.lengthSq() < 1e-20) continue;
      if (selNormal.dot(n) < thresholdCos) continue;
      const adjacent = neighborsOf(geometry, f);
      const adjacentSelected = adjacent.some((nb) => merged.has(nb));
      if (adjacentSelected) {
        merged.add(f);
        changed = true;
      }
    }
  }
  return merged;
}

function neighborsOf(
  geometry: THREE.BufferGeometry,
  face: number
): number[] {
  const geom = ensureIndexed(geometry);
  const index = geom.index!;
  const numFaces = index.count / 3;
  const a = index.getX(face * 3);
  const b = index.getX(face * 3 + 1);
  const c = index.getX(face * 3 + 2);
  const faces = new Set<number>();
  for (const [u, v] of [
    [a, b],
    [b, c],
    [c, a],
  ] as Array<[number, number]>) {
    for (let f = 0; f < numFaces; f++) {
      if (f === face) continue;
      const fa = index.getX(f * 3);
      const fb = index.getX(f * 3 + 1);
      const fc = index.getX(f * 3 + 2);
      if (
        (fa === u && fb === v) ||
        (fa === v && fb === u) ||
        (fb === u && fc === v) ||
        (fb === v && fc === u) ||
        (fa === u && fc === v) ||
        (fa === v && fc === u)
      ) {
        faces.add(f);
      }
    }
  }
  return Array.from(faces);
}

export function buildSelectionColorAttribute(
  geometry: THREE.BufferGeometry,
  selected: Set<number>
): THREE.BufferAttribute {
  const numFaces = faceCount(geometry);
  const numVerts = numFaces * 3;
  const colors = new Float32Array(numVerts * 3);
  const baseR = 0.62;
  const baseG = 0.78;
  const baseB = 0.85;
  const selR = 0.0;
  const selG = 0.9;
  const selB = 1.0;
  for (let f = 0; f < numFaces; f++) {
    const isSel = selected.has(f);
    const r = isSel ? selR : baseR;
    const g = isSel ? selG : baseG;
    const b = isSel ? selB : baseB;
    for (let k = 0; k < 3; k++) {
      const i = (f * 3 + k) * 3;
      colors[i] = r;
      colors[i + 1] = g;
      colors[i + 2] = b;
    }
  }
  return new THREE.BufferAttribute(colors, 3);
}
