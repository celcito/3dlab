import * as THREE from "three";
import { faceCount, ensureIndexed } from "./meshSelection";

export interface OrientResult {
  geometry: THREE.BufferGeometry;
  angle: string;
  axis: string;
}

export function autoOrient(geometry: THREE.BufferGeometry): OrientResult {
  const geom = ensureIndexed(geometry);
  const position = geom.attributes.position;
  const index = geom.index!;
  const numFaces = faceCount(geom);

  const directions: THREE.Vector3[] = [];
  const areas: number[] = [];
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let f = 0; f < numFaces; f++) {
    va.fromBufferAttribute(position, index.getX(f * 3));
    vb.fromBufferAttribute(position, index.getX(f * 3 + 1));
    vc.fromBufferAttribute(position, index.getX(f * 3 + 2));
    cb.subVectors(vc, vb);
    ab.subVectors(va, vb);
    cb.cross(ab);
    const area = cb.length() * 0.5;
    if (area < 1e-12) continue;
    normal.copy(cb).normalize();
    directions.push(normal.clone());
    areas.push(area);
  }

  if (directions.length === 0) {
    return { geometry: geom.clone(), angle: "0°", axis: "none" };
  }

  const bins = new Map<number, { dir: THREE.Vector3; area: number }>();
  const BIN_COUNT = 8;

  for (let i = 0; i < directions.length; i++) {
    const d = directions[i];
    const theta = Math.acos(Math.max(-1, Math.min(1, d.y))) / Math.PI;
    const phi = (Math.atan2(d.z, d.x) + Math.PI) / (2 * Math.PI);
    const ti = Math.min(BIN_COUNT - 1, Math.floor(theta * BIN_COUNT));
    const pi = Math.min(BIN_COUNT - 1, Math.floor(phi * BIN_COUNT));
    const bin = ti * BIN_COUNT + pi;
    const existing = bins.get(bin);
    if (existing) {
      existing.dir.add(d.clone().multiplyScalar(areas[i]));
      existing.area += areas[i];
    } else {
      bins.set(bin, { dir: d.clone().multiplyScalar(areas[i]), area: areas[i] });
    }
  }

  let bestBin = 0;
  let bestArea = 0;
  for (const [k, v] of bins) {
    if (v.area > bestArea) {
      bestArea = v.area;
      bestBin = k;
    }
  }

  const dominantNormal = bins.get(bestBin)!.dir.normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const rotAxis = new THREE.Vector3().crossVectors(dominantNormal, up);
  const angle = Math.acos(Math.max(-1, Math.min(1, dominantNormal.dot(up))));

  const outGeom = geom.clone();
  if (rotAxis.length() > 1e-6 && Math.abs(angle) > 1e-4) {
    const center = new THREE.Vector3();
    outGeom.computeBoundingBox();
    outGeom.boundingBox!.getCenter(center);
    const pos = outGeom.attributes.position;
    const quat = new THREE.Quaternion().setFromAxisAngle(
      rotAxis.normalize(),
      angle
    );
    const mat = new THREE.Matrix4().makeRotationFromQuaternion(quat);
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      v.sub(center).applyMatrix4(mat).add(center);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
  }

  outGeom.computeVertexNormals();
  outGeom.computeBoundingBox();
  outGeom.computeBoundingSphere();
  outGeom.deleteAttribute("color");

  const angleDeg = Math.round((angle * 180) / Math.PI);
  return {
    geometry: outGeom,
    angle: `${angleDeg}°`,
    axis: `${dominantNormal.x.toFixed(2)}, ${dominantNormal.y.toFixed(2)}, ${dominantNormal.z.toFixed(2)}`,
  };
}
