import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { VectorPiece } from "./svgTypes";
import type { CutterParams, PrintEstimate } from "./cutterParams";
import { shape2DToThreeShape, unionShapes } from "./shape2D";
import { offsetShape, scaleShape } from "./polygonOffset";
import { generateHandles } from "./handles";
import { generateRibs } from "./reinforcements";
import { applyEmbosseToBlade } from "./embosse";
import { calculateEstimate } from "./printEstimate";

export interface CutterResult {
  wall: THREE.Mesh;
  blade: THREE.Mesh;
  base: THREE.Mesh;
  stamp: THREE.Mesh;
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
const STAMP_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xff9933,
  roughness: 0.5,
  metalness: 0.05,
});

function shapeToExtrudeGeom(
  shape: THREE.Shape,
  depth: number,
  bevel = false
): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel,
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 1,
  });
}

function extrudeShape(
  shape: THREE.Shape,
  depth: number,
  material: THREE.Material
): THREE.Mesh {
  const geom = shapeToExtrudeGeom(shape, depth);
  return new THREE.Mesh(geom, material.clone());
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

function buildHollowShape(outer: THREE.Shape, inner: THREE.Shape): THREE.Shape {
  const wall = new THREE.Shape();
  const outerPts = outer.getPoints();
  if (outerPts.length < 3) return wall;
  wall.moveTo(outerPts[0].x, outerPts[0].y);
  for (let i = 1; i < outerPts.length; i++) {
    wall.lineTo(outerPts[i].x, outerPts[i].y);
  }
  wall.closePath();

  const innerPts = inner.getPoints();
  if (innerPts.length >= 3) {
    const hole = new THREE.Path();
    hole.moveTo(innerPts[0].x, innerPts[0].y);
    for (let i = 1; i < innerPts.length; i++) {
      hole.lineTo(innerPts[i].x, innerPts[i].y);
    }
    hole.closePath();
    wall.holes.push(hole);
  }

  return wall;
}

function mergeMeshes(
  meshes: THREE.Mesh[],
  fallbackMaterial: THREE.Material
): THREE.Mesh {
  const geoms: THREE.BufferGeometry[] = [];
  for (const m of meshes) {
    const g = m.geometry;
    if (!g || !g.attributes.position || g.attributes.position.count === 0) continue;

    let cloned = g.clone();
    if (cloned.index) cloned = cloned.toNonIndexed();
    m.updateMatrix();
    cloned.applyMatrix4(m.matrix);
    cloned.deleteAttribute("uv");
    cloned.deleteAttribute("uv1");
    cloned.deleteAttribute("uv2");
    cloned.deleteAttribute("color");
    cloned.computeVertexNormals();
    geoms.push(cloned);
  }

  const combined = new THREE.Mesh(new THREE.BufferGeometry(), fallbackMaterial.clone());
  if (geoms.length === 0) return combined;

  const merged = mergeGeometries(geoms, false);
  if (merged && merged.attributes.position.count > 0) {
    merged.computeVertexNormals();
    combined.geometry = merged;
  }
  return combined;
}

export function buildCutter(
  piece: VectorPiece,
  params: CutterParams
): CutterResult | null {
  try {
    const unioned = unionShapes(piece.shapes);
    if (!unioned) return null;

    let mainShape = shape2DToThreeShape(unioned.d);
    if (mainShape.getPoints().length < 3) return null;

    if (params.scale !== 1 && params.scale > 0) {
      mainShape = scaleShape(mainShape, params.scale);
    }

    const outerShape =
      params.outerOffset + params.tolerance !== 0
        ? offsetShape(mainShape, params.outerOffset + params.tolerance)
        : mainShape;

    const innerOffset = -(params.wallThickness + params.innerOffset);
    const innerShape = offsetShape(outerShape, innerOffset);

    if (innerShape.getPoints().length < 3) return null;

    const wallShape = buildHollowShape(outerShape, innerShape);
    const wallMesh = extrudeShape(wallShape, params.height, WALL_MATERIAL);
    wallMesh.position.z = 0;

    const bladeShape = buildHollowShape(outerShape, innerShape);
    const bladeMesh = extrudeShape(bladeShape, params.bladeThickness, BLADE_MATERIAL);
    bladeMesh.position.z = -params.bladeThickness;

    const emptyBase = new THREE.BufferGeometry();
    emptyBase.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
    let baseMesh = new THREE.Mesh(emptyBase, BASE_MATERIAL.clone());
    if (params.baseThickness > 0) {
      const baseGeom = shapeToExtrudeGeom(outerShape, params.baseThickness, true);
      baseMesh = new THREE.Mesh(baseGeom, BASE_MATERIAL.clone());
      baseMesh.position.z = -(params.bladeThickness + params.baseThickness);
    }

    const stampGap = params.stampGap ?? 0;
    const stampDepth = params.stampHeight > 0 ? params.stampHeight : 0;
    const stampMesh = extrudeShape(outerShape, stampDepth, STAMP_MATERIAL);
    stampMesh.position.z = -(params.bladeThickness + stampGap + stampDepth);

    let handles: THREE.Mesh[] = [];
    const handleShapes = generateHandles(outerShape, params);
    for (const s of handleShapes) {
      const m = extrudeShape(s, params.height, HANDLE_MATERIAL);
      handles.push(m);
    }

    let ribs: THREE.Mesh[] = [];
    const ribShapes = generateRibs(outerShape, innerShape, params.height, params);
    for (const s of ribShapes) {
      const m = extrudeShape(s, params.height, RIB_MATERIAL);
      ribs.push(m);
    }

    let stamps: THREE.Mesh[] = [];
    if (piece.embosseShapes.length > 0 && stampDepth > 0) {
      const embosseResult = applyEmbosseToBlade(stampMesh, piece, stampDepth);
      stampMesh.geometry = embosseResult.bladeMesh.geometry;
      stampMesh.material = embosseResult.bladeMesh.material;
      stamps = embosseResult.stamps;
    }

    const allForCombined: THREE.Mesh[] = [
      wallMesh,
      bladeMesh,
      baseMesh,
      stampMesh,
      ...ribs,
      ...handles,
      ...stamps,
    ];
    const combined = mergeMeshes(allForCombined, WALL_MATERIAL);

    const pts = outerShape.getPoints();
    let perimeter = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const dx = pts[j].x - pts[i].x;
      const dy = pts[j].y - pts[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    const result: CutterResult = {
      wall: wallMesh,
      blade: bladeMesh,
      base: baseMesh,
      stamp: stampMesh,
      ribs,
      handles,
      embosseMeshes: [],
      stamps,
      combined,
      stats: {
        outerArea: Math.abs(THREE.ShapeUtils.area(outerShape.getPoints())),
        innerArea: Math.abs(THREE.ShapeUtils.area(innerShape.getPoints())),
        triangleCount: countTriangles(combined),
        bbox: computeBbox(combined),
        perimeter,
      },
      estimate: calculateEstimate(combined, params),
    };

    return result;
  } catch (e) {
    console.error("buildCutter error:", e);
    return null;
  }
}

export function buildStampOnly(
  piece: VectorPiece,
  params: CutterParams
): THREE.Mesh | null {
  try {
    const unioned = unionShapes(piece.shapes);
    if (!unioned) return null;

    let mainShape = shape2DToThreeShape(unioned.d);
    if (mainShape.getPoints().length < 3) return null;

    if (params.scale !== 1 && params.scale > 0) {
      mainShape = scaleShape(mainShape, params.scale);
    }

    const outerShape =
      params.outerOffset + params.tolerance !== 0
        ? offsetShape(mainShape, params.outerOffset + params.tolerance)
        : mainShape;

    const stampDepth = params.stampHeight > 0 ? params.stampHeight : 0;
    const stampMesh = extrudeShape(outerShape, stampDepth, STAMP_MATERIAL);
    stampMesh.position.z = 0;

    if (piece.embosseShapes.length > 0 && stampDepth > 0) {
      const embosseResult = applyEmbosseToBlade(stampMesh, piece, stampDepth);
      stampMesh.geometry = embosseResult.bladeMesh.geometry;
      stampMesh.material = embosseResult.bladeMesh.material;
    }

    return stampMesh;
  } catch (e) {
    console.error("buildStampOnly error:", e);
    return null;
  }
}
