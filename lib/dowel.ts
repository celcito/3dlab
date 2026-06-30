import * as THREE from "three";
import {
  Brush,
  Evaluator,
  ADDITION,
  SUBTRACTION,
} from "three-bvh-csg";

export interface DowelSpec {
  diameter: number;
  depth: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
}

export function createDowel(spec: DowelSpec): THREE.Mesh {
  const radius = Math.max(spec.diameter, 0.1) / 2;
  const length = Math.max(spec.depth, 0.1);
  const geom = new THREE.CylinderGeometry(radius, radius, length, 24);
  const mesh = new THREE.Mesh(
    geom,
    new THREE.MeshStandardMaterial({
      color: 0xfff066,
      emissive: 0x554400,
      roughness: 0.3,
    })
  );
  const dir = spec.direction.clone();
  if (dir.lengthSq() < 1e-10) dir.set(0, 1, 0);
  dir.normalize();
  mesh.position.copy(spec.position);
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
  mesh.quaternion.copy(quat);
  mesh.updateMatrixWorld(true);
  return mesh;
}

export function applyDowelToPieces(
  baseMesh: THREE.Mesh,
  oppositeMesh: THREE.Mesh,
  spec: DowelSpec
): { base: THREE.Mesh; opposite: THREE.Mesh; ok: boolean; reason?: string } {
  const dowelMesh = createDowel(spec);
  dowelMesh.updateMatrixWorld(true);

  const baseBrush = new Brush(baseMesh.geometry);
  baseBrush.position.copy(baseMesh.position);
  baseBrush.quaternion.copy(baseMesh.quaternion);
  baseBrush.scale.copy(baseMesh.scale);
  baseBrush.updateMatrixWorld();

  const oppositeBrush = new Brush(oppositeMesh.geometry);
  oppositeBrush.position.copy(oppositeMesh.position);
  oppositeBrush.quaternion.copy(oppositeMesh.quaternion);
  oppositeBrush.scale.copy(oppositeMesh.scale);
  oppositeBrush.updateMatrixWorld();

  const dowelBrush = new Brush(dowelMesh.geometry);
  dowelBrush.position.copy(dowelMesh.position);
  dowelBrush.quaternion.copy(dowelMesh.quaternion);
  dowelBrush.scale.copy(dowelMesh.scale);
  dowelBrush.updateMatrixWorld();

  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  evaluator.consolidateMaterials = false;

  let baseResult: Brush | null = null;
  let oppositeResult: Brush | null = null;
  try {
    baseResult = evaluator.evaluate(baseBrush, dowelBrush, ADDITION);
    oppositeResult = evaluator.evaluate(oppositeBrush, dowelBrush, SUBTRACTION);
  } catch (e: any) {
    return {
      base: baseMesh,
      opposite: oppositeMesh,
      ok: false,
      reason: `CSG falhou ao aplicar pino: ${e?.message || e}. Tente diâmetro menor ou reposicione.`,
    };
  }

  if (!baseResult || !oppositeResult) {
    return {
      base: baseMesh,
      opposite: oppositeMesh,
      ok: false,
      reason:
        "Pino produziu geometria nula — verifique se a peça é grande o suficiente para o diâmetro escolhido.",
    };
  }

  for (const g of [baseResult.geometry, oppositeResult.geometry]) {
    g.deleteAttribute("uv");
    g.deleteAttribute("uv1");
    g.deleteAttribute("color");
    g.computeVertexNormals();
  }

  const newBase = new THREE.Mesh(
    baseResult.geometry,
    (baseMesh.material as THREE.Material).clone()
  );
  newBase.position.copy(baseMesh.position);
  newBase.quaternion.copy(baseMesh.quaternion);
  newBase.scale.copy(baseMesh.scale);
  newBase.updateMatrixWorld(true);

  const newOpposite = new THREE.Mesh(
    oppositeResult.geometry,
    (oppositeMesh.material as THREE.Material).clone()
  );
  newOpposite.position.copy(oppositeMesh.position);
  newOpposite.quaternion.copy(oppositeMesh.quaternion);
  newOpposite.scale.copy(oppositeMesh.scale);
  newOpposite.updateMatrixWorld(true);

  return { base: newBase, opposite: newOpposite, ok: true };
}
