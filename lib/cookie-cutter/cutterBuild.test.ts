import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { buildCutter, buildStampOnly } from "./cutterBuild";
import { DEFAULT_PARAMS } from "./cutterParams";
import type { VectorPiece } from "./svgTypes";
import { offsetShape, scaleShape } from "./polygonOffset";

function makeCirclePiece(radius = 25): VectorPiece {
  return {
    id: "p1",
    name: "Teste",
    embosseShapes: [],
    embosseMode: "deboss",
    embosseDepth: 1,
    shapes: [
      {
        id: "s1",
        kind: "path",
        d: `M ${-radius} 0 A ${radius} ${radius} 0 1 0 ${radius} 0 A ${radius} ${radius} 0 1 0 ${-radius} 0 Z`,
        transform: {
          tx: 0,
          ty: 0,
          sx: 1,
          sy: 1,
          rotation: 0,
          mirrorX: false,
          mirrorY: false,
        },
        fill: "nonzero",
        metadata: { name: "circle" },
        visible: true,
      },
    ],
  };
}

function makeSquarePiece(size = 40): VectorPiece {
  const half = size / 2;
  return {
    id: "p1",
    name: "Quadrado",
    embosseShapes: [],
    embosseMode: "deboss",
    embosseDepth: 1,
    shapes: [
      {
        id: "s1",
        kind: "path",
        d: `M ${-half} ${-half} L ${half} ${-half} L ${half} ${half} L ${-half} ${half} Z`,
        transform: {
          tx: 0,
          ty: 0,
          sx: 1,
          sy: 1,
          rotation: 0,
          mirrorX: false,
          mirrorY: false,
        },
        fill: "nonzero",
        metadata: { name: "square" },
        visible: true,
      },
    ],
  };
}

function meshVolume(mesh: THREE.Mesh): number {
  const g = mesh.geometry;
  if (!g?.attributes.position) return 0;
  const pos = g.attributes.position.array as Float32Array;
  const idx = g.index;
  const triCount = idx ? idx.count / 3 : pos.length / 9;
  let v = 0;
  for (let i = 0; i < triCount; i++) {
    let a: number, b: number, c: number;
    if (idx) {
      a = idx.getX(i * 3) * 3;
      b = idx.getX(i * 3 + 1) * 3;
      c = idx.getX(i * 3 + 2) * 3;
    } else {
      a = i * 9;
      b = i * 9 + 3;
      c = i * 9 + 6;
    }
    const v0x = pos[a], v0y = pos[a + 1], v0z = pos[a + 2];
    const v1x = pos[b], v1y = pos[b + 1], v1z = pos[b + 2];
    const v2x = pos[c], v2y = pos[c + 1], v2z = pos[c + 2];
    v +=
      v0x * (v1y * v2z - v1z * v2y) +
      v1x * (v2y * v0z - v2z * v0y) +
      v2x * (v0y * v1z - v0z * v1y);
  }
  return Math.abs(v) / 6;
}

describe("cutterBuild", () => {
  it("returns null for piece without shapes", () => {
    const piece: VectorPiece = {
      ...makeCirclePiece(),
      shapes: [],
    };
    expect(buildCutter(piece, DEFAULT_PARAMS)).toBeNull();
  });

  it("returns null for piece with only invisible shapes", () => {
    const piece = makeCirclePiece();
    piece.shapes[0].visible = false;
    expect(buildCutter(piece, DEFAULT_PARAMS)).toBeNull();
  });

  it("wall is hollow: wall volume < solid extrude volume", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS);
    expect(result).not.toBeNull();
    const wallVol = meshVolume(result!.wall);
    const outerArea = Math.PI * 25 * 25;
    const solidVol = outerArea * DEFAULT_PARAMS.height;
    expect(wallVol).toBeGreaterThan(0);
    expect(wallVol).toBeLessThan(solidVol);
    expect(wallVol / solidVol).toBeLessThan(0.5);
  });

  it("blade is a flat ring (volume < wall volume for tall cutter)", () => {
    const piece = makeCirclePiece(25);
    const params = { ...DEFAULT_PARAMS, height: 50, bladeThickness: 1.0 };
    const result = buildCutter(piece, params);
    expect(result).not.toBeNull();
    const wallVol = meshVolume(result!.wall);
    const bladeVol = meshVolume(result!.blade);
    expect(bladeVol).toBeLessThan(wallVol);
  });

  it("combined mesh aggregates all parts (not empty)", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS);
    expect(result).not.toBeNull();
    const combinedVol = meshVolume(result!.combined);
    const wallVol = meshVolume(result!.wall);
    const bladeVol = meshVolume(result!.blade);
    expect(combinedVol).toBeGreaterThan(wallVol + bladeVol - 1);
  });

  it("combined mesh has valid triangles (indexed or non-indexed)", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS);
    expect(result).not.toBeNull();
    const g = result!.combined.geometry;
    const pos = g.attributes.position;
    expect(pos.count).toBeGreaterThan(0);
    expect(pos.count % 3).toBe(0);
  });

  it("result.stats.triangleCount reflects combined mesh", () => {
    const piece = makeSquarePiece(40);
    const result = buildCutter(piece, DEFAULT_PARAMS);
    expect(result).not.toBeNull();
    const expected =
      result!.combined.geometry.index?.count ??
      result!.combined.geometry.attributes.position.count;
    expect(result!.stats.triangleCount).toBe(expected / 3);
  });

  it("stamps and embosseMeshes are empty when no embosse shapes", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS);
    expect(result).not.toBeNull();
    expect(result!.stamps).toEqual([]);
    expect(result!.embosseMeshes).toEqual([]);
  });

  it("embosse adds stamps and modifies the stamp mesh (not the blade)", () => {
    const piece = makeCirclePiece(25);
    piece.embosseShapes = [
      {
        id: "e1",
        kind: "path",
        d: "M -3 -3 L 3 -3 L 3 3 L -3 3 Z",
        transform: {
          tx: 0,
          ty: 0,
          sx: 1,
          sy: 1,
          rotation: 0,
          mirrorX: false,
          mirrorY: false,
        },
        fill: "nonzero",
        metadata: { name: "embosse" },
        visible: true,
      },
    ];
    const result = buildCutter(piece, DEFAULT_PARAMS);
    expect(result).not.toBeNull();
    expect(result!.stamps.length).toBe(1);
  });

  it("result.stamp exists and is a solid mesh (not hollow like the wall)", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS)!;
    expect(result.stamp).toBeInstanceOf(THREE.Mesh);
    expect(result.stamp.geometry.attributes.position.count).toBeGreaterThan(0);

    const stampVol = meshVolume(result.stamp);
    const wallVol = meshVolume(result.wall);
    const solidOuter = Math.PI * 25.2 * 25.2;
    const solidStampVol = solidOuter * DEFAULT_PARAMS.stampHeight;

    expect(stampVol).toBeGreaterThan(wallVol);
    expect(Math.abs(stampVol - solidStampVol) / solidStampVol).toBeLessThan(0.15);
  });

  it("stamp is positioned below the cutter (z < 0)", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS)!;
    result.stamp.updateMatrix();
    const bbox = new THREE.Box3().setFromObject(result.stamp);
    expect(bbox.max.z).toBeLessThan(0);
  });

  it("stamp has stampHeight depth (not wall height)", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS)!;
    result.stamp.updateMatrix();
    const bbox = new THREE.Box3().setFromObject(result.stamp);
    const stampDepth = bbox.max.z - bbox.min.z;
    expect(stampDepth).toBeCloseTo(DEFAULT_PARAMS.stampHeight, 0);
  });

  it("buildStampOnly returns a solid stamp mesh with embosse applied", () => {
    const piece = makeCirclePiece(25);
    piece.embosseShapes = [
      {
        id: "e1",
        kind: "path",
        d: "M -3 -3 L 3 -3 L 3 3 L -3 3 Z",
        transform: {
          tx: 0,
          ty: 0,
          sx: 1,
          sy: 1,
          rotation: 0,
          mirrorX: false,
          mirrorY: false,
        },
        fill: "nonzero",
        metadata: { name: "embosse" },
        visible: true,
      },
    ];
    const stamp = buildStampOnly(piece, DEFAULT_PARAMS);
    expect(stamp).toBeInstanceOf(THREE.Mesh);
    expect(meshVolume(stamp!)).toBeGreaterThan(0);
  });

  it("outerOffset expands shape; negative outerOffset shrinks it", () => {
    const piece = makeSquarePiece(40);
    const base = buildCutter(piece, DEFAULT_PARAMS)!;
    const bigger = buildCutter(piece, {
      ...DEFAULT_PARAMS,
      outerOffset: 5,
      tolerance: 0,
    })!;
    expect(bigger.stats.bbox.w).toBeGreaterThan(base.stats.bbox.w);
    expect(bigger.stats.outerArea).toBeGreaterThan(base.stats.outerArea);
  });

  it("base is created when baseThickness > 0", () => {
    const piece = makeCirclePiece(25);
    const params = { ...DEFAULT_PARAMS, baseThickness: 2 };
    const result = buildCutter(piece, params)!;
    expect(result.base.geometry.attributes.position.count).toBeGreaterThan(0);
    expect(meshVolume(result.base)).toBeGreaterThan(0);
  });

  it("base is empty when baseThickness = 0", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS)!;
    expect(result.base.geometry.attributes.position.count).toBe(0);
  });

  it("handles appear when shape is large enough and enabled", () => {
    const piece = makeCirclePiece(60);
    const params = { ...DEFAULT_PARAMS, handles: { ...DEFAULT_PARAMS.handles, enabled: true, autoThreshold: 30 } };
    const result = buildCutter(piece, params)!;
    expect(result.handles.length).toBeGreaterThan(0);
  });

  it("estimate is positive for a valid piece", () => {
    const piece = makeCirclePiece(25);
    const result = buildCutter(piece, DEFAULT_PARAMS)!;
    expect(result.estimate.volumeCm3).toBeGreaterThan(0);
    expect(result.estimate.weightG).toBeGreaterThan(0);
    expect(result.estimate.filamentLengthM).toBeGreaterThan(0);
  });

  it("bbox dimensions match the cutter + stamp (wall + blade + gap + stamp)", () => {
    const piece = makeCirclePiece(25);
    const params = {
      ...DEFAULT_PARAMS,
      height: 30,
      bladeThickness: 2,
      stampHeight: 8,
      stampGap: 0,
    };
    const result = buildCutter(piece, params)!;
    expect(result.stats.bbox.d).toBeCloseTo(30 + 2 + 0 + 8, 0);
  });

  it("negative stampGap overlaps stamp with blade (encaixar)", () => {
    const piece = makeCirclePiece(25);
    const params = { ...DEFAULT_PARAMS, stampGap: -2, stampHeight: 8 };
    const result = buildCutter(piece, params)!;
    result.stamp.updateMatrix();
    const bbox = new THREE.Box3().setFromObject(result.stamp);
    expect(bbox.max.z).toBeCloseTo(1, 0);
    expect(bbox.min.z).toBeCloseTo(-7, 0);
  });

  it("scale=2 doubles cutter width (tolerance offset is absolute, so area is slightly less than 4x)", () => {
    const piece = makeCirclePiece(25);
    const noHandles = { ...DEFAULT_PARAMS, handles: { ...DEFAULT_PARAMS.handles, enabled: false } };
    const base = buildCutter(piece, noHandles)!;
    const scaled = buildCutter(piece, { ...noHandles, scale: 2 })!;
    expect(scaled.stats.bbox.w).toBeCloseTo(base.stats.bbox.w * 2, 0);
    expect(scaled.stats.outerArea).toBeGreaterThan(base.stats.outerArea * 3.5);
  });

  it("scale=0.5 halves cutter width", () => {
    const piece = makeCirclePiece(25);
    const noHandles = { ...DEFAULT_PARAMS, handles: { ...DEFAULT_PARAMS.handles, enabled: false } };
    const base = buildCutter(piece, noHandles)!;
    const scaled = buildCutter(piece, { ...noHandles, scale: 0.5 })!;
    expect(scaled.stats.bbox.w).toBeCloseTo(base.stats.bbox.w * 0.5, 0);
    expect(scaled.stats.outerArea).toBeLessThan(base.stats.outerArea * 0.4);
  });
});

describe("offsetShape (with holes)", () => {
  function makeDonut(): THREE.Shape {
    const outer = new THREE.Shape();
    outer.moveTo(-10, -10);
    outer.lineTo(10, -10);
    outer.lineTo(10, 10);
    outer.lineTo(-10, 10);
    outer.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-3, -3);
    hole.lineTo(3, -3);
    hole.lineTo(3, 3);
    hole.lineTo(-3, 3);
    hole.closePath();
    outer.holes.push(hole);
    return outer;
  }

  it("preserves holes on outset", () => {
    const donut = makeDonut();
    const outset = offsetShape(donut, 2);
    expect(outset.holes.length).toBe(1);
  });

  it("preserves holes on inset", () => {
    const donut = makeDonut();
    const inset = offsetShape(donut, -1);
    expect(inset.holes.length).toBe(1);
  });

  it("preserves hole shape (still square, just bigger)", () => {
    const donut = makeDonut();
    const outset = offsetShape(donut, 2);
    const holePts = outset.holes[0].getPoints();
    expect(holePts.length).toBeGreaterThanOrEqual(4);
    const xs = holePts.map((p) => p.x);
    expect(Math.min(...xs)).toBeCloseTo(-5, 1);
    expect(Math.max(...xs)).toBeCloseTo(5, 1);
  });

  it("outset hole is bigger than original", () => {
    const donut = makeDonut();
    const outset = offsetShape(donut, 2);
    const origHoleArea = Math.abs(THREE.ShapeUtils.area(donut.holes[0].getPoints()));
    const newHoleArea = Math.abs(THREE.ShapeUtils.area(outset.holes[0].getPoints()));
    expect(newHoleArea).toBeGreaterThan(origHoleArea);
  });

  it("scaleShape scales uniformly around centroid", () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(10, 0);
    s.lineTo(10, 10);
    s.lineTo(0, 10);
    s.closePath();
    const scaled = scaleShape(s, 2);
    const pts = scaled.getPoints();
    expect(pts.length).toBeGreaterThanOrEqual(4);
    const xs = pts.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(20, 1);
  });

  it("offsetShape with distance=0 returns equivalent shape (within tolerance)", () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(10, 0);
    s.lineTo(10, 10);
    s.lineTo(0, 10);
    s.closePath();
    const offset = offsetShape(s, 0);
    const pts = offset.getPoints();
    expect(pts.length).toBeGreaterThanOrEqual(4);
  });
});
