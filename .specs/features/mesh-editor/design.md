# Mesh Editor — Architecture & Design

## High-Level Component Tree

```
Viewer3D.tsx
├── <UploadMeshDropzone>     (file picker, aceita .stl/.obj/.gltf/.glb)
├── <Canvas>                 (R3F)
│   ├── <OrbitControls>      (existente)
│   ├── <Grid>               (existente)
│   ├── <LoadedMesh>         (renders geometry + selection highlight)
│   ├── <CutPlaneGizmo>      (só visual; sem interatividade na v1)
│   ├── <DowelMesh>          (cilindro 3D com TransformControls)
│   └── <Piece>×N            (peças geradas após corte)
├── <Toolbar>                (botões de modo: Manual/Smart/Erase/Fill/Cut/Pin)
├── <Sidebar>
│   ├── <MeshInfoPanel>      (triângulos, source, formato, quality slider)
│   ├── <SelectionPanel>     (count de faces selecionadas, smart threshold slider)
│   ├── <DowelPanel>         (diâmetro/profundidade, "Aplicar na malha")
│   └── <PartsListPanel>     (peças com download individual + ZIP)
└── (state) useMeshEditor()  (hook central)
```

## State Management

Estado centralizado em `useMeshEditor()` hook. Não usa Zustand/Redux (mantém simplicidade do projeto).

```ts
interface MeshEditorState {
  // Fonte
  source: { kind: 'url'; url: string } | { kind: 'file'; file: File } | { kind: 'demo' };

  // Geometria
  originalGeometry: BufferGeometry | null;   // nunca mutada
  currentGeometry: BufferGeometry | null;    // decimada/selecionada
  triangleCount: number;

  // Decimação
  quality: 'original' | 'high' | 'medium' | 'low';
  isDecimating: boolean;

  // Seleção
  mode: 'view' | 'manual' | 'smart' | 'erase';
  selectedFaces: Set<number>;                // índices de face
  smartThreshold: number;                    // 5..60 graus
  isFilling: boolean;

  // Corte
  pieces: Piece[];                           // peças geradas
  isCutting: boolean;

  // Pino
  dowel: { diameter: number; depth: number; position: Vector3; direction: Vector3 } | null;
  isApplyingDowel: boolean;

  // UI
  showDowelPrompt: boolean;
  error: string | null;
}

interface Piece {
  id: string;                                // "Part_01_Top"
  mesh: THREE.Mesh;
  visible: boolean;
  triangleCount: number;
}
```

## Data Flow

### Load File

```
1. User drops .stl on UploadMeshDropzone
2. Dropzone calls onFile(file) → useMeshEditor.setSource({kind:'file', file})
3. Hook reads file as ArrayBuffer (FileReader)
4. Detects format by extension → STLLoader/OBJLoader/GLTFLoader
5. Returns BufferGeometry
6. Hook sanitizes: mergeVertices, remove NaN, computeVertexNormals
7. setOriginalGeometry, setCurrentGeometry
8. Viewer3D re-renders <LoadedMesh> with new geometry
9. <MeshInfoPanel> shows triangle count
```

### Decimate

```
1. User moves quality slider → 'medium'
2. useMeshEditor.setQuality('medium')
3. Hook computes target = originalTriangleCount * 0.5
4. Imports SimplifyModifier from 'three/examples/jsm/modifiers/SimplifyModifier.js'
5. const decimated = modifier.modify(originalGeometry, target)
6. setCurrentGeometry(decimated)
7. triangleCount updates
```

### Smart Select

```
1. User clicks face (mode='smart')
2. R3F onClick on mesh → intersection.faceIndex
3. useMeshEditor.smartSelect(faceIndex, smartThreshold)
4. Algorithm (see algorithm doc):
   a. Compute face normals of currentGeometry
   b. BFS from faceIndex, adding neighbors where dot(n_i, n_seed) > cos(threshold)
   c. Add to selectedFaces
5. Hook updates <LoadedMesh> to highlight new selection
6. Triangle count of selection displayed
```

### Cut

```
1. User clicks "Confirmar corte"
2. useMeshEditor.cut()
3. Build Brush: extrude selectedFaces along average normal (creates "wall")
4. import { Evaluator, SUBTRACTION, REVERSE_SUBTRACTION } from 'three-bvh-csg'
5. const pieceA = evaluator.evaluate(originalBrush, selectionBrush, SUBTRACTION)
6. const pieceB = evaluator.evaluate(originalBrush, selectionBrush, REVERSE_SUBTRACTION)
7. Hook creates Piece objects, adds to pieces[]
8. <PartsListPanel> renders with real triangle counts
9. <CutPlaneGizmo> hides; pieces show as separate meshes
10. showDowelPrompt = true
```

### Apply Dowel

```
1. User has dowel positioned via TransformControls
2. User clicks "Aplicar na malha"
3. useMeshEditor.applyDowel()
4. const pinGeom = new CylinderGeometry(d/2, d/2, depth, 32)
5. Translate pinGeom to dowel.position; rotate to dowel.direction
6. const pinBrush = new Brush(pinGeom)
7. pieceA = evaluator.evaluate(pieceA.mesh, pinBrush, ADDITION)
8. pieceB = evaluator.evaluate(pieceB.mesh, pinBrush, SUBTRACTION)
9. pieces[] updated with new meshes
10. Dowel gizmo hides
```

## Key Algorithms

### Smart Select (flood-fill by dihedral angle)

```ts
function smartSelect(
  geometry: BufferGeometry,
  seedFace: number,
  thresholdDeg: number
): Set<number> {
  const position = geometry.attributes.position;
  const index = geometry.index;
  if (!index) throw new Error('Geometry must be indexed');

  // Build face adjacency via edge-to-face map
  const edgeMap = new Map<string, number[]>(); // "v1-v2" → [faceIdx, ...]
  const numFaces = index.count / 3;
  for (let f = 0; f < numFaces; f++) {
    const a = index.getX(f * 3), b = index.getX(f * 3 + 1), c = index.getX(f * 3 + 2);
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      const arr = edgeMap.get(key) || [];
      arr.push(f);
      edgeMap.set(key, arr);
    }
  }

  // Compute face normals
  const normals: Vector3[] = [];
  const va = new Vector3(), vb = new Vector3(), vc = new Vector3();
  const cb = new Vector3(), ab = new Vector3();
  for (let f = 0; f < numFaces; f++) {
    va.fromBufferAttribute(position, index.getX(f * 3));
    vb.fromBufferAttribute(position, index.getX(f * 3 + 1));
    vc.fromBufferAttribute(position, index.getX(f * 3 + 2));
    cb.subVectors(vc, vb);
    ab.subVectors(va, vb);
    cb.cross(ab).normalize();
    normals.push(cb.clone());
  }

  // BFS
  const threshold = Math.cos(thresholdDeg * Math.PI / 180);
  const selected = new Set<number>([seedFace]);
  const seedNormal = normals[seedFace];
  const queue: number[] = [seedFace];
  while (queue.length) {
    const current = queue.shift()!;
    const a = index.getX(current * 3), b = index.getX(current * 3 + 1), c = index.getX(current * 3 + 2);
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      const neighbors = edgeMap.get(key) || [];
      for (const n of neighbors) {
        if (selected.has(n)) continue;
        if (seedNormal.dot(normals[n]) >= threshold) {
          selected.add(n);
          queue.push(n);
        }
      }
    }
  }
  return selected;
}
```

### Fill Holes (raycast exterior)

```ts
function fillHoles(
  geometry: BufferGeometry,
  selected: Set<number>,
  raycaster: Raycaster
): Set<number> {
  // For each unselected face, cast a ray from a point "above" the centroid
  // If ray hits the mesh on an unselected face first, it's "outside" (not a hole)
  // If ray doesn't hit anything, it's inside the selection boundary → add to selection
  // Use 3 axes (X+, X-, Y+, Y-, Z+, Z-) for robustness
  // ...
}
```

Simpler alternative: use 3D flood fill from outside via voxel grid (slower but bulletproof). For v1, use the raycast method with multiple directions.

### Boolean Cut

```ts
import { Brush, Evaluator, SUBTRACTION, REVERSE_SUBTRACTION } from 'three-bvh-csg';

function cutBySelection(
  originalMesh: Mesh,
  selectedFaces: Set<number>
): { pieceA: Mesh; pieceB: Mesh } {
  // 1. Build wall mesh from selected faces (extrude)
  const wallMesh = extrudeSelectedFaces(originalMesh.geometry, selectedFaces);

  // 2. Wrap in Brushes
  const originalBrush = new Brush(originalMesh.geometry);
  originalBrush.updateMatrixWorld();
  const wallBrush = new Brush(wallMesh);
  wallBrush.updateMatrixWorld();

  // 3. CSG
  const evaluator = new Evaluator();
  const pieceA = evaluator.evaluate(originalBrush, wallBrush, SUBTRACTION);
  const pieceB = evaluator.evaluate(originalBrush, wallBrush, REVERSE_SUBTRACTION);

  return { pieceA, pieceB };
}

function extrudeSelectedFaces(
  geometry: BufferGeometry,
  selected: Set<number>
): BufferGeometry {
  // For each selected face, create a "prism" that extends along the normal
  // by some large distance (e.g., 1000 units) and seal the ends
  // Simplest: create a "thick" wall by extruding each triangle along its normal
  // and stitching into a single closed mesh
  // For v1: use ExtrudeGeometry with depth = large value, then close ends
  // ...
}
```

**Caveat:** Building a clean closed brush from an arbitrary selection is non-trivial. Two strategies:
1. **Simple wall** (v1): Create a mesh that's the selected faces duplicated and extruded by 1000 units along the normal, with end caps. Won't be watertight if selection has boundary holes → use fillHoles first.
2. **Voxel-based** (more robust): Voxelize the selected region, build marching cubes mesh. Slower but always closed.

**Decision:** Use strategy 1 with `fillHoles` as prerequisite step. Document the limitation in UI.

## File Structure (new files)

```
src/
  pages/
    Viewer3D.tsx              (reescrito)
  components/
    three/
      LoadedMesh.tsx          (renders geometry + selection highlight)
      CutPlaneGizmo.tsx       (visual plane, deprecated in v1?)
      DowelMesh.tsx           (cylinder + TransformControls)
      PieceRenderer.tsx       (renders a piece mesh)
      Toolbar.tsx             (floating toolbar over canvas)
    UploadMeshDropzone.tsx    (new — accepts .stl/.obj/.gltf/.glb)
  hooks/
    useMeshEditor.ts          (central state hook)
  lib/
    loaders.ts                (STL/OBJ/GLB loaders unified)
    decimate.ts               (SimplifyModifier wrapper)
    meshSelection.ts          (smartSelect, fillHoles, manualSelect, erase)
    booleanCut.ts             (cutBySelection, sanitizeForCSG)
    dowel.ts                  (createDowel, applyDowel)
    exportPieces.ts           (exportStl, exportAllZip)
    threeShims.ts             (re-export three/examples paths)
```

## Dependency Additions

```json
{
  "dependencies": {
    "jszip": "^3.10.1",
    "file-saver": "^2.0.7"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

## Performance Budget

| Operation | Target | Rationale |
| --- | --- | --- |
| Load STL (100k tri) | < 1s | Native browser FileReader + parser |
| Load GLB (100k tri) | < 2s | GLB includes textures/animations; parsing is heavier |
| Decimate 500k → 250k | < 3s | SimplifyModifier is O(n) for moderate n |
| Smart select 100k faces | < 500ms | BFS over 100k faces with face adjacency is fast |
| Fill holes 100k faces | < 2s | 6 raycasts × 100k faces = 600k operations |
| Boolean cut 100k faces | < 5s | three-bvh-csg is highly optimized |
| Export STL 1 piece | < 200ms | STLExporter is fast |
| Export ZIP 10 pieces | < 1s | JSZip is fast for small payloads |

If any operation exceeds budget, surface a loading indicator with progress.

## Error Handling

| Scenario | Handling |
| --- | --- |
| File too large (>50MB) | Reject with toast: "Arquivo muito grande, decimação prévia recomendada" |
| Invalid file format | Toast: "Formato não suportado. Use STL, OBJ ou GLB" |
| NaN in geometry | Sanitize silently; if sanitize fails, abort with error |
| Non-manifold geometry | Try CSG anyway; if it throws, show "Geometria não-válida para corte" |
| Decimation to <100 tris | Cap at 100 with warning |
| CSG produces empty piece | Discard empty piece, show "Corte gerou apenas uma peça válida" |
| Browser too slow (5s+ for op) | Show progress, allow cancel |
