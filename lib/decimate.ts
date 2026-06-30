import * as THREE from "three";
import { SimplifyModifier } from "./threeShims";

export type Quality = "original" | "high" | "medium" | "low";

export const QUALITY_FACTORS: Record<Quality, number> = {
  original: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

export const MIN_TRIANGLES = 100;

export function targetTriangleCount(
  originalCount: number,
  quality: Quality
): number {
  const factor = QUALITY_FACTORS[quality];
  const target = Math.floor(originalCount * factor);
  return Math.max(target, Math.min(MIN_TRIANGLES, originalCount));
}

export function decimate(
  geometry: THREE.BufferGeometry,
  quality: Quality
): THREE.BufferGeometry {
  if (quality === "original") {
    return geometry.clone();
  }

  const index = geometry.index;
  const originalCount = index ? index.count / 3 : geometry.attributes.position.count / 3;

  if (originalCount <= MIN_TRIANGLES) {
    return geometry.clone();
  }

  const targetTris = targetTriangleCount(originalCount, quality);
  if (targetTris >= originalCount) {
    return geometry.clone();
  }

  const targetVerts = Math.max(
    Math.floor(targetTris / 2),
    Math.min(MIN_TRIANGLES, originalCount)
  );

  const modifier = new SimplifyModifier();
  const simplified = modifier.modify(geometry, targetVerts);
  if (!simplified) {
    console.warn("MeshEditor: SimplifyModifier retornou null, mantendo original");
    return geometry.clone();
  }
  simplified.computeVertexNormals();
  simplified.computeBoundingBox();
  simplified.computeBoundingSphere();
  return simplified;
}
