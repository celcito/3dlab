import * as THREE from "three";
import type { CutterParams, PrintEstimate } from "./cutterParams";
import { getFilamentDensity } from "./cutterParams";

const FILAMENT_DIAMETER_MM = 1.75;
const DEFAULT_FLOW_RATE_CM3H = 4;

function computeVolume(mesh: THREE.Mesh): number {
  let volume = 0;
  mesh.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) return;
    const g = child.geometry;
    const pos = g.attributes.position;
    if (!pos || pos.count < 3) return;

    const idx = g.index;
    const positions = pos.array as Float32Array;
    const triCount = idx ? idx.count / 3 : pos.count / 3;

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

      const v0 = new THREE.Vector3(positions[a], positions[a + 1], positions[a + 2]);
      const v1 = new THREE.Vector3(positions[b], positions[b + 1], positions[b + 2]);
      const v2 = new THREE.Vector3(positions[c], positions[c + 1], positions[c + 2]);
      volume += (v0.x * (v1.y * v2.z - v1.z * v2.y)
        + v1.x * (v2.y * v0.z - v2.z * v0.y)
        + v2.x * (v0.y * v1.z - v0.z * v1.y)) / 6;
    }
  });
  return Math.abs(volume);
}

export function calculateEstimate(
  mesh: THREE.Mesh,
  params: CutterParams,
  flowRateCm3h = DEFAULT_FLOW_RATE_CM3H
): PrintEstimate {
  const volumeMm3 = computeVolume(mesh);
  const volumeCm3 = volumeMm3 / 1000;

  if (volumeCm3 < 0.001) {
    return {
      volumeCm3: 0,
      weightG: 0,
      filamentLengthM: 0,
      printTimeH: 0,
      costBRL: 0,
    };
  }

  const density = getFilamentDensity(params.filament.material);
  const weightG = volumeCm3 * density;

  const filamentRadiusCm = (FILAMENT_DIAMETER_MM / 2) / 10;
  const filamentAreaCm2 = Math.PI * filamentRadiusCm * filamentRadiusCm;
  const filamentLengthCm = volumeCm3 / filamentAreaCm2;
  const filamentLengthM = filamentLengthCm / 100;

  const timeH = volumeCm3 / flowRateCm3h;
  const costBRL = (weightG / 1000) * params.filament.costPerKg;

  const margin = 1.2;

  return {
    volumeCm3: +volumeCm3.toFixed(2),
    weightG: +(weightG * margin).toFixed(1),
    filamentLengthM: +(filamentLengthM * margin).toFixed(2),
    printTimeH: +(timeH * margin).toFixed(2),
    costBRL: +(costBRL * margin).toFixed(2),
  };
}
