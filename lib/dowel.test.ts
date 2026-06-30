import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { applyDowelToPieces } from "./dowel";
import { triangleCount } from "./loaders";

function box(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 4),
    new THREE.MeshStandardMaterial({ color: 0x00e5ff })
  );
}

describe("dowel", () => {
  it("applies a small dowel to two boxes and produces valid geometry", () => {
    const a = box();
    const b = box();
    b.position.set(10, 0, 0);
    const result = applyDowelToPieces(a, b, {
      diameter: 2,
      depth: 3,
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
    });
    expect(result.ok).toBe(true);
    expect(result.base).toBeInstanceOf(THREE.Mesh);
    expect(result.opposite).toBeInstanceOf(THREE.Mesh);
    expect(triangleCount(result.base.geometry)).toBeGreaterThan(0);
    expect(triangleCount(result.opposite.geometry)).toBeGreaterThan(0);
  });
});
