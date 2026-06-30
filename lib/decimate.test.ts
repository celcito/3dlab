import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { decimate, targetTriangleCount, Quality } from "./decimate";
import { triangleCount, buildDemoGeometry } from "./loaders";

function bigBox(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(2, 2, 2, 8, 8, 8);
}

describe("decimate", () => {
  it("original returns a clone unchanged in face count", () => {
    const g = bigBox();
    const out = decimate(g, "original");
    expect(triangleCount(out)).toBe(triangleCount(g));
  });

  it("medium reduces triangle count", () => {
    const g = bigBox();
    const out = decimate(g, "medium");
    expect(triangleCount(out)).toBeLessThan(triangleCount(g));
  });

  it("low produces fewer triangles than original", () => {
    const g = bigBox();
    const out = decimate(g, "low");
    expect(triangleCount(out)).toBeLessThan(triangleCount(g));
  });

  it("does not mutate the input geometry", () => {
    const g = bigBox();
    const before = triangleCount(g);
    decimate(g, "medium");
    expect(triangleCount(g)).toBe(before);
  });

  it("targetTriangleCount respects MIN_TRIANGLES floor", () => {
    const target = targetTriangleCount(10, "low");
    expect(target).toBeGreaterThanOrEqual(10);
  });

  it("demo geometry is non-empty and indexed", () => {
    const g = buildDemoGeometry();
    expect(triangleCount(g)).toBeGreaterThan(0);
    expect(!!g.index).toBe(true);
  });
});
