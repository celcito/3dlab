import * as THREE from "three";
import { Brush, Evaluator, SUBTRACTION, ADDITION } from "three-bvh-csg";
import type { VectorPiece } from "./svgTypes";
import { shape2DToThreeShape } from "./shape2D";

export interface EmbosseResult {
  bladeMesh: THREE.Mesh;
  stamps: THREE.Mesh[];
}

function ensureIndexed(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  if (geometry.index) return geometry;
  const count = geometry.attributes.position.count;
  const indices: number[] = [];
  for (let i = 0; i < count; i += 3) {
    indices.push(i, i + 1, i + 2);
  }
  geometry.setIndex(indices);
  return geometry;
}

function makeBrush(geometry: THREE.BufferGeometry): Brush {
  const g = ensureIndexed(geometry).clone();
  g.computeVertexNormals();
  if (!g.attributes.uv) {
    const count = g.attributes.position.count;
    const uvs = new Float32Array(count * 2);
    g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  }
  const brush = new Brush(g);
  brush.updateMatrixWorld();
  return brush;
}

function trimZeroArea(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geom.attributes.position;
  const idx = geom.index;
  if (!idx) return geom;
  const triCount = idx.count / 3;
  const kept: number[] = [];
  for (let i = 0; i < triCount; i++) {
    const a = idx.getX(i * 3);
    const b = idx.getX(i * 3 + 1);
    const c = idx.getX(i * 3 + 2);
    const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
    const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
    const cx = pos.getX(c), cy = pos.getY(c), cz = pos.getZ(c);
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    const area = Math.sqrt(
      (aby * acz - abz * acy) ** 2 +
      (abz * acx - abx * acz) ** 2 +
      (abx * acy - aby * acx) ** 2
    ) / 2;
    if (area > 1e-9) {
      kept.push(a, b, c);
    }
  }
  if (kept.length === 0) return geom;
  const newIdx = new THREE.BufferAttribute(new Uint32Array(kept), 1);
  geom.setIndex(new THREE.BufferAttribute(new Uint32Array(kept), 1));
  return geom;
}

export function applyEmbosseToBlade(
  bladeMesh: THREE.Mesh,
  piece: VectorPiece,
  topZ = 0
): EmbosseResult {
  if (piece.embosseShapes.length === 0) {
    return { bladeMesh, stamps: [] };
  }

  const stamps: THREE.Mesh[] = [];
  let modifiedBlade = bladeMesh.clone();

  const isDeboss = piece.embosseMode === "deboss";
  const depth = piece.embosseDepth;

  for (const shape of piece.embosseShapes) {
    if (!shape.visible) continue;

    const threeShape = shape2DToThreeShape(shape.d);
    if (threeShape.getPoints().length < 3) continue;

    const extSettings: THREE.ExtrudeGeometryOptions = {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2,
    };

    const stampGeom = new THREE.ExtrudeGeometry(threeShape, extSettings);

    stampGeom.translate(
      shape.transform.tx,
      shape.transform.ty,
      isDeboss ? topZ - depth : topZ
    );
    stampGeom.rotateZ((shape.transform.rotation * Math.PI) / 180);
    stampGeom.scale(shape.transform.sx, shape.transform.sy, 1);

    const stampMesh = new THREE.Mesh(
      stampGeom.clone(),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.4,
      })
    );
    stamps.push(stampMesh);

    try {
      const brushA = makeBrush(modifiedBlade.geometry.clone());
      const brushB = makeBrush(stampGeom);
      const evaluator = new Evaluator();
      evaluator.useGroups = false;
      evaluator.consolidateMaterials = false;

      const operation = isDeboss ? SUBTRACTION : ADDITION;
      const result = evaluator.evaluate(brushA, brushB, operation);

      const resultGeom = (result as unknown as THREE.BufferGeometry);
      if (!resultGeom?.attributes?.position) {
        console.warn("CSG returned empty geometry for embosse shape");
        continue;
      }

      resultGeom.deleteAttribute("uv");
      resultGeom.deleteAttribute("uv1");
      resultGeom.deleteAttribute("uv2");
      resultGeom.deleteAttribute("color");
      trimZeroArea(resultGeom);
      resultGeom.computeVertexNormals();

      modifiedBlade = new THREE.Mesh(
        resultGeom,
        Array.isArray(bladeMesh.material)
          ? bladeMesh.material.map((m) => m.clone())
          : bladeMesh.material.clone()
      );
    } catch (e: any) {
      console.warn(`CSG failed for embosse shape: ${e?.message || e}`);
    }
  }

  return { bladeMesh: modifiedBlade, stamps };
}
