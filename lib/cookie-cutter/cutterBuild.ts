import * as THREE from "three";
import type { VectorPiece } from "./svgTypes";
import type { CutterParams, PrintEstimate } from "./cutterParams";
import { shape2DToThreeShape } from "./shape2D";
import { offsetShape, scaleShape } from "./polygonOffset";
import { generateHandles } from "./handles";
import { generateRibs } from "./reinforcements";
import { applyEmbosseToBlade } from "./embosse";
import { calculateEstimate } from "./printEstimate";

export interface CutterResult {
  wall: THREE.Mesh;
  blade: THREE.Mesh;
  base: THREE.Mesh;
  ribs: THREE.Mesh[];
  handles: THREE.Mesh[];
  embosseMeshes: THREE.Mesh[];
  stamps: THREE.Mesh[];
  combined: THREE.Mesh;
  stats: CutterStats;
  estimate: PrintEstimate;
}

export interface CutterStats {
  outerArea: number;
  innerArea: number;
  triangleCount: number;
  bbox: { w: number; h: number; d: number };
  perimeter: number;
}

const WALL_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x00e5ff,
  roughness: 0.4,
  metalness: 0.1,
});
const BLADE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.6,
  metalness: 0.05,
});
const BASE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x444444,
  roughness: 0.8,
  metalness: 0.05,
});
const HANDLE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xc0c0c0,
  roughness: 0.3,
  metalness: 0.5,
});
const RIB_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x006666,
  roughness: 0.5,
  metalness: 0.1,
});

function extrudeShape(shape: THREE.Shape, depth: number): THREE.Mesh {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geom, WALL_MATERIAL.clone());
  return mesh;
}

function computeBbox(mesh: THREE.Mesh): { w: number; h: number; d: number } {
  const bbox = new THREE.Box3().setFromObject(mesh);
  return {
    w: bbox.max.x - bbox.min.x,
    h: bbox.max.y - bbox.min.y,
    d: bbox.max.z - bbox.min.z,
  };
}

function countTriangles(mesh: THREE.Mesh): number {
  let count = 0;
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const g = child.geometry;
      if (g.index) {
        count += g.index.count / 3;
      } else if (g.attributes.position) {
        count += g.attributes.position.count / 3;
      }
    }
  });
  return Math.floor(count);
}

function rebuildMaterial(mesh: THREE.Mesh, material: THREE.Material): THREE.Mesh {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = material;
    }
  });
  return mesh;
}

export function buildCutter(
  piece: VectorPiece,
  params: CutterParams
): CutterResult | null {
  try {
    const shapes = piece.shapes
      .filter((s) => s.visible !== false)
      .map((s) => shape2DToThreeShape(s.d))
      .filter((s) => {
        const pts = s.getPoints();
        return pts.length >= 3;
      });

    if (shapes.length === 0) return null;

    const mainShape = shapes[0];

    const outerShape =
      params.outerOffset + params.tolerance !== 0
        ? offsetShape(mainShape, params.outerOffset + params.tolerance)
        : mainShape;

    const innerOffset = -(params.wallThickness + params.innerOffset);
    const innerShape = offsetShape(outerShape, innerOffset);

    const wallMesh = extrudeShape(outerShape, params.height);
    const innerHole = extrudeShape(innerShape, params.height);
    innerHole.position.z -= 0.1;

    const wallGeom = wallMesh.geometry;
    const holeGeom = innerHole.geometry;

    const wallPositions = wallGeom.getAttribute("position");
    const holePositions = holeGeom.getAttribute("position");

    const adjustedHole = new THREE.ExtrudeGeometry(innerShape, {
      depth: params.height + 0.2,
      bevelEnabled: false,
    });
    adjustedHole.translate(0, 0, -0.1);

    const wallWithHole = new THREE.BufferGeometry();
    wallWithHole.setAttribute("position", wallPositions);
    if (wallGeom.index) wallWithHole.setIndex(wallGeom.index);
    wallWithHole.computeVertexNormals();

    const wallResult = new THREE.Mesh(wallWithHole);
    rebuildMaterial(wallResult, WALL_MATERIAL.clone());

    const bladeMesh = extrudeShape(outerShape, params.bladeThickness);
    bladeMesh.position.z = -(params.bladeThickness + 0.1);
    rebuildMaterial(bladeMesh, BLADE_MATERIAL.clone());

    const results: CutterResult = {
      wall: wallResult,
      blade: bladeMesh,
      base: new THREE.Mesh(new THREE.BufferGeometry()),
      ribs: [],
      handles: [],
      embosseMeshes: [],
      stamps: [],
      combined: new THREE.Mesh(new THREE.BufferGeometry()),
      stats: {
        outerArea: 0,
        innerArea: 0,
        triangleCount: 0,
        bbox: { w: 0, h: 0, d: 0 },
        perimeter: 0,
      },
      estimate: {
        volumeCm3: 0,
        weightG: 0,
        filamentLengthM: 0,
        printTimeH: 0,
        costBRL: 0,
      },
    };

    if (params.baseThickness > 0) {
      const baseBevel = Math.min(params.baseThickness / 2, 2);
      const baseGeom = new THREE.ExtrudeGeometry(outerShape, {
        depth: params.baseThickness,
        bevelEnabled: baseBevel > 0,
        bevelThickness: baseBevel,
        bevelSize: baseBevel,
        bevelSegments: 2,
      });
      results.base = new THREE.Mesh(baseGeom, BASE_MATERIAL.clone());
      results.base.position.z = -(params.bladeThickness + params.baseThickness + 0.1);
    }

    const handleShapes = generateHandles(outerShape, params);
    results.handles = handleShapes.map((s) => {
      const m = extrudeShape(s, params.height);
      rebuildMaterial(m, HANDLE_MATERIAL.clone());
      return m;
    });

    const ribShapes = generateRibs(outerShape, innerShape, params.height, params);
    results.ribs = ribShapes.map((s) => {
      const m = extrudeShape(s, params.height);
      rebuildMaterial(m, RIB_MATERIAL.clone());
      return m;
    });

    if (piece.embosseShapes.length > 0) {
      const embosseResult = applyEmbosseToBlade(results.blade, piece);
      results.blade = embosseResult.bladeMesh;
      results.stamps = embosseResult.stamps;
    }

    const combinedGeom = new THREE.BufferGeometry();
    const allMeshes = [results.wall, results.blade, results.base, ...results.ribs, ...results.handles];
    const mergedGeometries: THREE.BufferGeometry[] = [];

    for (const m of allMeshes) {
      if (m.geometry.attributes.position && m.geometry.attributes.position.count > 0) {
        mergedGeometries.push(m.geometry.clone().applyMatrix4(m.matrixWorld));
      }
    }

    results.combined = new THREE.Mesh(new THREE.BufferGeometry());
    if (mergedGeometries.length > 0) {
      let totalVertices = 0;
      for (const g of mergedGeometries) totalVertices += g.attributes.position.count;
      const combinedPos = new Float32Array(totalVertices * 3);
      let offset = 0;
      for (const g of mergedGeometries) {
        const pos = g.attributes.position.array as Float32Array;
        combinedPos.set(pos, offset * 3);
        offset += g.attributes.position.count;
      }
      results.combined.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(combinedPos, 3)
      );
      results.combined.geometry.computeVertexNormals();
    }

    const pts = outerShape.getPoints();
    let perimeter = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const dx = pts[j].x - pts[i].x;
      const dy = pts[j].y - pts[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    results.stats = {
      outerArea: Math.abs(THREE.ShapeUtils.area(outerShape.getPoints())),
      innerArea: Math.abs(THREE.ShapeUtils.area(innerShape.getPoints())),
      triangleCount: countTriangles(results.combined),
      bbox: computeBbox(results.combined),
      perimeter,
    };

    results.estimate = calculateEstimate(results.combined, params);

    return results;
  } catch (e) {
    console.error("buildCutter error:", e);
    return null;
  }
}
