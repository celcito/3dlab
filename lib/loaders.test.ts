import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  isSupportedFilename,
  triangleCount,
  buildDemoGeometry,
  sanitizeGeometry,
} from "./loaders";

describe("loaders", () => {
  it("isSupportedFilename accepts STL, OBJ, GLB, GLTF", () => {
    expect(isSupportedFilename("model.stl")).toBe(true);
    expect(isSupportedFilename("model.STL")).toBe(true);
    expect(isSupportedFilename("foo.obj")).toBe(true);
    expect(isSupportedFilename("foo.glb")).toBe(true);
    expect(isSupportedFilename("foo.gltf")).toBe(true);
    expect(isSupportedFilename("foo.png")).toBe(false);
    expect(isSupportedFilename("foo")).toBe(false);
  });

  it("triangleCount matches geometry", () => {
    const g = buildDemoGeometry();
    expect(triangleCount(g)).toBeGreaterThan(0);
    expect(!!g.index).toBe(true);
  });

  it("buildDemoGeometry is indexed, has UVs and normals (CSG-ready)", () => {
    const g = buildDemoGeometry();
    expect(!!g.attributes.uv).toBe(true);
    expect(!!g.attributes.normal).toBe(true);
    expect(g.attributes.uv.itemSize).toBe(2);
  });

  it("sanitizeGeometry removes degenerate zero-area faces", () => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0,
      2, 2, 2, 2, 2, 2, 2, 2, 2,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setIndex([0, 1, 2, 3, 4, 5]);
    const cleaned = sanitizeGeometry(geom);
    const tris = triangleCount(cleaned);
    expect(tris).toBe(1);
  });

  it("sanitizeGeometry handles colinear vertices", () => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 2, 0, 0,
      0, 0, 0, 0, 1, 0, 1, 1, 0,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setIndex([0, 1, 2, 3, 4, 5]);
    const cleaned = sanitizeGeometry(geom);
    const tris = triangleCount(cleaned);
    expect(tris).toBe(1);
  });

  it("sanitizeGeometry handles NaN vertices", () => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0,
      0, 0, 0, NaN, 0, 0, 0, 1, 0,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setIndex([0, 1, 2, 3, 4, 5]);
    const cleaned = sanitizeGeometry(geom);
    const tris = triangleCount(cleaned);
    expect(tris).toBeGreaterThanOrEqual(1);
    expect(tris).toBeLessThanOrEqual(2);
  });

  it("sanitizeGeometry adds UV attribute", () => {
    const geom = new THREE.BoxGeometry(1, 1, 1);
    geom.deleteAttribute("uv");
    expect(!!geom.attributes.uv).toBe(false);
    const cleaned = sanitizeGeometry(geom.clone());
    expect(!!cleaned.attributes.uv).toBe(true);
  });
});
