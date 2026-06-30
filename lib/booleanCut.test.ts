import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { cutBySelection } from "./booleanCut";
import { smartSelect } from "./meshSelection";
import { triangleCount } from "./loaders";

describe("booleanCut", () => {
  it("rejects empty selection", () => {
    const g = new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
    expect(() => cutBySelection(g, new Set())).toThrow();
  });

  it("rejects selection that covers entire mesh", () => {
    const g = new THREE.BoxGeometry(2, 2, 2, 1, 1, 1);
    const all = new Set<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(() => cutBySelection(g, all)).toThrow();
  });

  it("cuts a box selecting the top face and returns 2 meshes", () => {
    const g = new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
    const top = smartSelect(g, 0, 5);
    const result = cutBySelection(g, top);
    expect(result.pieceA).toBeInstanceOf(THREE.Mesh);
    expect(result.pieceB).toBeInstanceOf(THREE.Mesh);
    expect(result.pieceATris).toBeGreaterThan(0);
    expect(result.pieceBTris).toBeGreaterThan(0);
    const totalBefore = triangleCount(g);
    const totalAfter = result.pieceATris + result.pieceBTris;
    expect(totalAfter).toBeGreaterThan(totalBefore * 0.5);
  });
});
