import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  smartSelect,
  fillHoles,
  computeFaceNormals,
  faceCount,
  buildSelectionColorAttribute,
} from "./meshSelection";

function subdividedCube(subdiv = 4): THREE.BufferGeometry {
  return new THREE.BoxGeometry(2, 2, 2, subdiv, subdiv, subdiv);
}

describe("meshSelection", () => {
  it("faceCount matches geometry", () => {
    const g = subdividedCube(3);
    const n = faceCount(g);
    expect(n).toBe(g.index!.count / 3);
  });

  it("computeFaceNormals returns one normal per face with magnitude ~1", () => {
    const g = subdividedCube(2);
    const normals = computeFaceNormals(g);
    expect(normals.length).toBe(faceCount(g));
    for (const n of normals) {
      expect(Math.abs(n.length() - 1)).toBeLessThan(1e-3);
    }
  });

  it("smartSelect with threshold 0 selects only faces coplanar with seed", () => {
    const g = subdividedCube(2);
    const normals = computeFaceNormals(g);
    const seedFace = 0;
    const seedNormal = normals[seedFace];
    const selected = smartSelect(g, seedFace, 0);
    for (const f of selected) {
      const dot = seedNormal.dot(normals[f]);
      expect(dot).toBeGreaterThan(0.999);
    }
    expect(selected.size).toBeGreaterThan(0);
  });

  it("smartSelect with threshold 90 spreads to all faces sharing edges with similar normals", () => {
    const g = subdividedCube(1);
    const seedSelected = smartSelect(g, 0, 0);
    const wideSelected = smartSelect(g, 0, 90);
    expect(wideSelected.size).toBeGreaterThanOrEqual(seedSelected.size);
  });

  it("fillHoles expands selection to a continuous region", () => {
    const g = subdividedCube(3);
    const seed = smartSelect(g, 0, 15);
    const filled = fillHoles(g, seed, 30);
    expect(filled.size).toBeGreaterThanOrEqual(seed.size);
  });

  it("buildSelectionColorAttribute produces a color attribute with 3 components", () => {
    const g = subdividedCube(2);
    const sel = new Set<number>([0, 1, 2]);
    const attr = buildSelectionColorAttribute(g, sel);
    expect(attr.itemSize).toBe(3);
    expect(attr.count).toBe(faceCount(g) * 3);
  });
});
