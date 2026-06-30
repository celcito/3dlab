import * as THREE from "three";
import { STLLoader, OBJLoader, GLTFLoader, FBXLoader, ThreeMFLoader, BufferGeometryUtils } from "./threeShims";

export type MeshSource =
  | { kind: "url"; url: string; label: string }
  | { kind: "file"; file: File; label: string }
  | { kind: "demo"; label: string };

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const SUPPORTED_EXTS = [".stl", ".obj", ".gltf", ".glb", ".3mf", ".fbx"] as const;

export function isSupportedFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPPORTED_EXTS.some((ext) => lower.endsWith(ext));
}

export function sanitizeGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const position = geometry.attributes.position;
  if (!position) {
    throw new Error("Geometria inválida: sem atributo de posição");
  }

  let cleaned: THREE.BufferGeometry = geometry.clone();

  const pos = cleaned.attributes.position;
  let hasInvalid = false;
  for (let i = 0; i < pos.count; i++) {
    if (
      !Number.isFinite(pos.getX(i)) ||
      !Number.isFinite(pos.getY(i)) ||
      !Number.isFinite(pos.getZ(i))
    ) {
      hasInvalid = true;
      break;
    }
  }
  if (hasInvalid) {
    console.warn("MeshEditor: geometria continha NaN/Infinity, sanitizando");
    const valid: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      if (
        Number.isFinite(pos.getX(i)) &&
        Number.isFinite(pos.getY(i)) &&
        Number.isFinite(pos.getZ(i))
      ) {
        valid.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }
    cleaned = new THREE.BufferGeometry();
    cleaned.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(valid, 3)
    );
  }

  if (!cleaned.index) {
    cleaned = cleaned.toNonIndexed();
  }

  cleaned = BufferGeometryUtils.mergeVertices(cleaned, 1e-5);

  const removed = removeDegenerateFaces(cleaned);
  if (removed > 0) {
    console.warn(`MeshEditor: ${removed} faces degeneradas removidas (área < 1e-12)`);
  }

  const nonManifold = countNonManifoldEdges(cleaned);
  if (nonManifold > 0) {
    console.warn(`MeshEditor: ${nonManifold} arestas não-manifold detectadas (CSG pode falhar)`);
  }

  ensureUvAttribute(cleaned);
  cleaned.computeVertexNormals();
  cleaned.computeBoundingBox();
  cleaned.computeBoundingSphere();

  return cleaned;
}

function removeDegenerateFaces(geometry: THREE.BufferGeometry): number {
  const index = geometry.index;
  const position = geometry.attributes.position;
  if (!index || !position) return 0;

  const numFaces = index.count / 3;
  const validFaces: number[] = [];
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const AREA_EPSILON = 1e-12;

  for (let f = 0; f < numFaces; f++) {
    const ia = index.getX(f * 3);
    const ib = index.getX(f * 3 + 1);
    const ic = index.getX(f * 3 + 2);
    if (ia === ib || ia === ic || ib === ic) continue;
    va.fromBufferAttribute(position, ia);
    vb.fromBufferAttribute(position, ib);
    vc.fromBufferAttribute(position, ic);
    cb.subVectors(vc, vb);
    ab.subVectors(va, vb);
    cross.crossVectors(cb, ab);
    const area = cross.length() * 0.5;
    if (area < AREA_EPSILON) continue;
    validFaces.push(ia, ib, ic);
  }

  if (validFaces.length === index.count) return 0;

  const removed = numFaces - validFaces.length / 3;
  geometry.setIndex(validFaces);
  return removed;
}

function countNonManifoldEdges(geometry: THREE.BufferGeometry): number {
  const index = geometry.index;
  if (!index) {
    return geometry.attributes.position.count > 3 ? 1 : 0;
  }

  const numFaces = index.count / 3;
  const edgeMap = new Map<string, number>();
  for (let f = 0; f < numFaces; f++) {
    const a = index.getX(f * 3);
    const b = index.getX(f * 3 + 1);
    const c = index.getX(f * 3 + 2);
    for (const [u, v] of [[a, b], [b, c], [c, a]] as Array<[number, number]>) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
    }
  }

  let nonManifold = 0;
  for (const count of edgeMap.values()) {
    if (count > 2) nonManifold++;
  }
  return nonManifold;
}

function ensureUvAttribute(geometry: THREE.BufferGeometry): void {
  if (geometry.attributes.uv) return;
  const posCount = geometry.attributes.position?.count ?? 0;
  if (posCount === 0) return;
  const uvs = new Float32Array(posCount * 2);
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
}

function geometryFromObject(root: THREE.Object3D): THREE.BufferGeometry | null {
  const meshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes.push(obj as THREE.Mesh);
    }
  });
  if (meshes.length === 0) return null;

  const geoms = meshes
    .map((m) => {
      const g = m.geometry as THREE.BufferGeometry;
      if (!g || !g.attributes.position) return null;
      m.updateWorldMatrix(true, false);
      return g.clone().applyMatrix4(m.matrixWorld);
    })
    .filter((g): g is THREE.BufferGeometry => g !== null);

  if (geoms.length === 0) return null;
  if (geoms.length === 1) return geoms[0];

  return BufferGeometryUtils.mergeGeometries(geoms, false);
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error(`Falha ao ler arquivo: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

function detectFormat(filename: string): "stl" | "obj" | "gltf" | "fbx" | "3mf" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".stl")) return "stl";
  if (lower.endsWith(".obj")) return "obj";
  if (lower.endsWith(".gltf") || lower.endsWith(".glb")) return "gltf";
  if (lower.endsWith(".fbx")) return "fbx";
  if (lower.endsWith(".3mf")) return "3mf";
  return null;
}

export async function loadMeshFromFile(file: File): Promise<THREE.BufferGeometry> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Limite: 50MB.`
    );
  }
  const format = detectFormat(file.name);
  if (!format) {
    throw new Error(
      `Formato não suportado: ${file.name}. Use STL, OBJ, GLB ou GLTF.`
    );
  }

  const buffer = await readFileAsArrayBuffer(file);
  return loadMeshFromBuffer(buffer, format, file.name);
}

export async function loadMeshFromUrl(url: string): Promise<THREE.BufferGeometry> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar modelo (${res.status})`);
  }
  const buffer = await res.arrayBuffer();
  const format = detectFormat(url);
  if (!format) {
    throw new Error(`URL não aponta para formato suportado: ${url}`);
  }
  return loadMeshFromBuffer(buffer, format, url);
}

async function loadMeshFromBuffer(
  buffer: ArrayBuffer,
  format: "stl" | "obj" | "gltf" | "fbx" | "3mf",
  label: string
): Promise<THREE.BufferGeometry> {
  if (format === "stl") {
    const loader = new STLLoader();
    const geom = loader.parse(buffer);
    return sanitizeGeometry(geom);
  }
  if (format === "obj") {
    const loader = new OBJLoader();
    const text = new TextDecoder().decode(buffer);
    const group = loader.parse(text);
    const geom = geometryFromObject(group);
    if (!geom) throw new Error(`OBJ vazio ou inválido: ${label}`);
    return sanitizeGeometry(geom);
  }
  if (format === "fbx") {
    const loader = new FBXLoader();
    const group = loader.parse(buffer, "");
    const geom = geometryFromObject(group);
    if (!geom) throw new Error(`FBX sem meshes: ${label}`);
    return sanitizeGeometry(geom);
  }
  if (format === "3mf") {
    const loader = new ThreeMFLoader();
    const group = loader.parse(buffer);
    const geom = geometryFromObject(group);
    if (!geom) throw new Error(`3MF sem meshes: ${label}`);
    return sanitizeGeometry(geom);
  }
  const loader = new GLTFLoader();
  return new Promise<THREE.BufferGeometry>((resolve, reject) => {
    loader.parse(
      buffer,
      "",
      (gltf) => {
        const geom = geometryFromObject(gltf.scene);
        if (!geom) {
          reject(new Error(`GLTF sem meshes: ${label}`));
          return;
        }
        resolve(sanitizeGeometry(geom));
      },
      (err) => reject(new Error(`GLTF inválido: ${err.message || label}`))
    );
  });
}

export function triangleCount(geometry: THREE.BufferGeometry): number {
  const index = geometry.index;
  const posCount = geometry.attributes.position?.count ?? 0;
  if (index) return index.count / 3;
  return posCount / 3;
}

export function buildDemoGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(2, 2, 2, 2, 2, 2);
  return sanitizeGeometry(geom);
}
