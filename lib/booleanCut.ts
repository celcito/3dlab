import * as THREE from "three";
import {
  Brush,
  Evaluator,
  SUBTRACTION,
  REVERSE_SUBTRACTION,
} from "three-bvh-csg";
import { averageFaceNormal, ensureIndexed, faceCount } from "./meshSelection";

export interface CutResult {
  pieceA: THREE.Mesh;
  pieceB: THREE.Mesh;
  pieceATris: number;
  pieceBTris: number;
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

function buildWallFromSelection(
  geometry: THREE.BufferGeometry,
  selected: Set<number>,
  depth = 5000
): THREE.BufferGeometry {
  const geom = ensureIndexed(geometry);
  const position = geom.attributes.position;
  const index = geom.index!;
  const normal = averageFaceNormal(geometry, selected);
  const numFaces = index.count / 3;

  const positions: number[] = [];
  const wallIndices: number[] = [];

  const pushTri = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3
  ) => {
    const base = positions.length / 3;
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    wallIndices.push(base, base + 1, base + 2);
  };

  for (let f = 0; f < numFaces; f++) {
    if (!selected.has(f)) continue;
    const ia = index.getX(f * 3);
    const ib = index.getX(f * 3 + 1);
    const ic = index.getX(f * 3 + 2);
    const a = new THREE.Vector3().fromBufferAttribute(position, ia);
    const b = new THREE.Vector3().fromBufferAttribute(position, ib);
    const c = new THREE.Vector3().fromBufferAttribute(position, ic);

    const aTop = a.clone().add(normal.clone().multiplyScalar(depth));
    const bTop = b.clone().add(normal.clone().multiplyScalar(depth));
    const cTop = c.clone().add(normal.clone().multiplyScalar(depth));

    pushTri(a, b, c);
    pushTri(aTop, cTop, bTop);

    pushTri(a, aTop, b);
    pushTri(b, aTop, bTop);

    pushTri(b, bTop, c);
    pushTri(c, bTop, cTop);

    pushTri(c, cTop, a);
    pushTri(a, cTop, aTop);
  }

  if (positions.length === 0) {
    throw new Error("Seleção vazia — não é possível construir parede para CSG");
  }

  const wall = new THREE.BufferGeometry();
  wall.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  wall.setIndex(wallIndices);
  wall.computeVertexNormals();
  return wall;
}

export function cutBySelection(
  geometry: THREE.BufferGeometry,
  selected: Set<number>
): CutResult {
  if (selected.size === 0) {
    throw new Error("Nenhuma face selecionada para cortar");
  }
  if (selected.size === faceCount(geometry)) {
    throw new Error("Seleção cobre a malha inteira — nada para manter");
  }

  const originalBrush = makeBrush(geometry);
  const wallGeom = buildWallFromSelection(geometry, selected);
  const wallBrush = makeBrush(wallGeom);

  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  evaluator.consolidateMaterials = false;

  let pieceAGeom: any;
  let pieceBGeom: any;
  try {
    pieceAGeom = evaluator.evaluate(originalBrush, wallBrush, SUBTRACTION);
    pieceBGeom = evaluator.evaluate(originalBrush, wallBrush, REVERSE_SUBTRACTION);
  } catch (e: any) {
    const msg = e?.message || String(e);
    throw new Error(
      `Operação CSG falhou: ${msg}. A geometria pode ser não-manifold ou ter faces degeneradas. Tente "Preencher" antes de cortar ou decimá-la antes.`
    );
  }

  if (!pieceAGeom || !pieceBGeom) {
    throw new Error(
      "CSG retornou geometria nula — possível seleção degenerada ou geometria inválida para corte."
    );
  }

  const pieceAGeomBuf = (pieceAGeom as unknown as THREE.Mesh).geometry ?? (pieceAGeom as unknown as THREE.BufferGeometry);
  const pieceBGeomBuf = (pieceBGeom as unknown as THREE.Mesh).geometry ?? (pieceBGeom as unknown as THREE.BufferGeometry);

  if (!pieceAGeomBuf.attributes.position || !pieceBGeomBuf.attributes.position) {
    throw new Error(
      "CSG produziu geometria sem posição — verifique se a malha tem pelo menos 4 faces."
    );
  }

  for (const g of [pieceAGeomBuf, pieceBGeomBuf]) {
    g.deleteAttribute("uv");
    g.deleteAttribute("uv1");
    g.deleteAttribute("uv2");
    g.deleteAttribute("color");
    g.computeVertexNormals();
  }

  const pieceATris = pieceAGeomBuf.index
    ? pieceAGeomBuf.index.count / 3
    : pieceAGeomBuf.attributes.position.count / 3;
  const pieceBTris = pieceBGeomBuf.index
    ? pieceBGeomBuf.index.count / 3
    : pieceBGeomBuf.attributes.position.count / 3;

  if (pieceATris < 4 || pieceBTris < 4) {
    throw new Error(
      `Corte produziu peças inválidas (${pieceATris} / ${pieceBTris} triângulos). Tente selecionar uma área maior ou diferente.`
    );
  }

  const pieceAMesh = new THREE.Mesh(
    pieceAGeomBuf,
    new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.5 })
  );
  const pieceBMesh = new THREE.Mesh(
    pieceBGeomBuf,
    new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.5 })
  );

  return { pieceA: pieceAMesh, pieceB: pieceBMesh, pieceATris, pieceBTris };
}
