# Mesh Editor — Atomic Tasks

Each task is independently verifiable. Tasks are roughly ordered by dependency, but `[P]` tasks can run in parallel.

## Task Index

| ID | Task | Phase | Deps | Status | Spec IDs |
| --- | --- | --- | --- | --- | --- |
| T1 | Add dependencies (jszip, file-saver) | Setup | - | Pending | ME-07 |
| T2 | Create `src/lib/loaders.ts` | Lib | - | Pending | ME-01 |
| T3 | Create `src/lib/threeShims.ts` | Lib | - | Pending | ME-01, ME-02 |
| T4 | Create `src/lib/decimate.ts` | Lib | T3 | Pending | ME-02 |
| T5 | Create `src/lib/meshSelection.ts` | Lib | - | Pending | ME-03, ME-04 |
| T6 | Create `src/lib/booleanCut.ts` | Lib | - | Pending | ME-05 |
| T7 | Create `src/lib/dowel.ts` | Lib | T6 | Pending | ME-06 |
| T8 | Create `src/lib/exportPieces.ts` | Lib | T1 | Pending | ME-07 |
| T9 | Create `src/hooks/useMeshEditor.ts` | Hook | T4-T8 | Pending | ME-01..07 |
| T10 | Create `src/components/UploadMeshDropzone.tsx` | UI | - | Pending | ME-01 |
| T11 | Create `src/components/three/LoadedMesh.tsx` | UI | T5, T9 | Pending | ME-01, ME-03 |
| T12 | Create `src/components/three/Toolbar.tsx` | UI | T9 | Pending | ME-03, ME-04, ME-05 |
| T13 | Create `src/components/three/DowelMesh.tsx` | UI | T7, T9 | Pending | ME-06 |
| T14 | Create `src/components/three/PieceRenderer.tsx` | UI | T9 | Pending | ME-05, ME-07 |
| T15 | Rewrite `src/pages/Viewer3D.tsx` | Page | T1-T14 | Pending | ME-01..07 |
| T16 | Add Vitest + tests for lib/ modules | Test | T4-T8 | Pending | ME-01..07 |
| T17 | Update `.specs/project/STATE.md` and ROADMAP | Docs | T15 | Pending | - |

## Task Details

### T1: Add dependencies (jszip, file-saver)

**What:** Install jszip + file-saver + @types/file-saver
**Where:** `package.json`
**Depends on:** -
**Reuses:** -
**Done when:**
- `npm install` completes without errors
- `node_modules/jszip` and `node_modules/file-saver` exist
- `npm run build` still passes

**Tests:** `npm run build` (gate check)

---

### T2: Create `src/lib/loaders.ts`

**What:** Unified loader for STL/OBJ/GLB
**Where:** `src/lib/loaders.ts` (new)
**Depends on:** -
**Reuses:** `STLLoader`, `OBJLoader`, `GLTFLoader` from `three/examples/jsm/loaders/`
**Done when:**
- Exports `loadMeshFromFile(file: File): Promise<BufferGeometry>` and `loadMeshFromUrl(url: string): Promise<BufferGeometry>`
- Detects format by extension
- Returns sanitized BufferGeometry (merged vertices, no NaN, indexed, normals computed)
- Throws clear error on invalid file

**Tests:** Manual test with sample .stl/.obj/.glb

---

### T3: Create `src/lib/threeShims.ts`

**What:** Centralize imports of three/examples paths
**Where:** `src/lib/threeShims.ts` (new)
**Depends on:** -
**Done when:**
- Re-exports `SimplifyModifier`, `BufferGeometryUtils`, `TransformControls` from `three/examples/jsm/`
- Other modules import from `@/lib/threeShims` instead of deep paths

**Tests:** TypeScript compiles

---

### T4: Create `src/lib/decimate.ts`

**What:** Wrapper around SimplifyModifier
**Where:** `src/lib/decimate.ts` (new)
**Depends on:** T3
**Reuses:** `SimplifyModifier` from threeShims
**Done when:**
- Exports `decimate(geometry: BufferGeometry, factor: number): BufferGeometry`
- `factor=0.75` → 75% of original triangle count
- Caps minimum at 100 triangles
- Throws if SimplifyModifier is unavailable
- Returns NEW geometry (does not mutate input)

**Tests:** Unit test: decimate(1000-tri geo, 0.5) returns ~500-tri geo

---

### T5: Create `src/lib/meshSelection.ts`

**What:** Selection algorithms (manual, smart, fill)
**Where:** `src/lib/meshSelection.ts` (new)
**Depends on:** -
**Reuses:** three.js `BufferGeometry`, `Vector3`, `Raycaster`
**Done when:**
- Exports:
  - `smartSelect(geometry, seedFace, thresholdDeg): Set<number>`
  - `fillHoles(geometry, selected, raycaster): Set<number>` (or alternative)
  - `sanitizeForSelection(geometry): BufferGeometry` (helper)
- `smartSelect` uses BFS with face adjacency + dihedral angle threshold
- `fillHoles` uses multi-axis raycast to find interior faces

**Tests:** Unit tests for smartSelect on a known geometry (e.g., a cube with subdivisions — 6 faces with different normals)

---

### T6: Create `src/lib/booleanCut.ts`

**What:** Boolean cut using three-bvh-csg
**Where:** `src/lib/booleanCut.ts` (new)
**Depends on:** -
**Reuses:** `three-bvh-csg` (Brush, Evaluator, SUBTRACTION, REVERSE_SUBTRACTION)
**Done when:**
- Exports:
  - `cutBySelection(originalMesh, selectedFaces): { pieceA: Mesh, pieceB: Mesh }`
  - `sanitizeForCSG(geometry): BufferGeometry` (merge vertices, no NaN, valid winding)
- Uses `Evaluator` with `SUBTRACTION` and `REVERSE_SUBTRACTION`
- Handles empty/invalid results gracefully
- Both pieces are real `THREE.Mesh` instances

**Tests:** Unit test: cut a cube by selecting top half → 2 rectangular pieces

---

### T7: Create `src/lib/dowel.ts`

**What:** Dowel (pin) creation and application
**Where:** `src/lib/dowel.ts` (new)
**Depends on:** T6
**Reuses:** `three-bvh-csg`, `CylinderGeometry`
**Done when:**
- Exports:
  - `createDowel(diameter, depth, position, direction): Mesh`
  - `applyDowel(pieceBase, pieceOpposite, dowel, evaluator): { pieceA, pieceB }`
- Cylinder oriented along given direction
- `applyDowel` does ADDITION on base, SUBTRACTION on opposite

**Tests:** Unit test: apply small dowel to two box meshes → opposite has cylindrical hole

---

### T8: Create `src/lib/exportPieces.ts`

**What:** STL and ZIP export
**Where:** `src/lib/exportPieces.ts` (new)
**Depends on:** T1
**Reuses:** `STLExporter`, `JSZip`, `file-saver`
**Done when:**
- Exports:
  - `exportStl(mesh: Mesh, filename: string): void` — triggers browser download
  - `exportAllZip(pieces: Piece[], zipFilename: string): Promise<void>` — creates and downloads ZIP
- Binary STL format
- ZIP contains all pieces with descriptive names

**Tests:** Manual: export a piece, open STL in viewer, verify geometry

---

### T9: Create `src/hooks/useMeshEditor.ts`

**What:** Central state hook
**Where:** `src/hooks/useMeshEditor.ts` (new)
**Depends on:** T4, T5, T6, T7, T8
**Reuses:** all lib/ modules
**Done when:**
- Exports `useMeshEditor()` returning `{ state, actions }`
- State: source, geometry, triangleCount, quality, mode, selectedFaces, smartThreshold, pieces, dowel, errors
- Actions: setSource, setQuality, selectFace, smartSelectFace, eraseFace, fillSelection, clearSelection, cut, addDowel, applyDowel, exportPiece, exportAll
- Decimation triggers on quality change
- Sanitizes geometry on load

**Tests:** Manual: full flow load → decimate → select → cut → export

---

### T10: Create `src/components/UploadMeshDropzone.tsx`

**What:** File picker for mesh files
**Where:** `src/components/UploadMeshDropzone.tsx` (new)
**Depends on:** -
**Reuses:** styles from existing `UploadDropzone.tsx`
**Done when:**
- Accepts `.stl`, `.obj`, `.gltf`, `.glb`
- Drag-and-drop + click to upload
- Shows selected filename
- Matches existing dark/cyan theme

**Tests:** Manual test in browser

---

### T11: Create `src/components/three/LoadedMesh.tsx`

**What:** Render geometry with selection highlight
**Where:** `src/components/three/LoadedMesh.tsx` (new)
**Depends on:** T5, T9
**Done when:**
- Renders currentGeometry as `<mesh>` with material
- Per-face selection highlight via `geometry.attributes.color` + `vertexColors: true`
- Click handler: calls `onFaceClick(faceIndex, mode)` from hook
- Cursor changes to crosshair when in selection mode

**Tests:** Manual: load mesh, click faces, see highlight

---

### T12: Create `src/components/three/Toolbar.tsx`

**What:** Floating toolbar with mode buttons
**Where:** `src/components/three/Toolbar.tsx` (new)
**Depends on:** T9
**Done when:**
- Buttons: View / Manual / Smart / Erase / Fill / Cut (Confirmar corte)
- Smart threshold slider (5°–60°)
- Disabled state when no geometry loaded
- Visual feedback for active mode
- Position: top-left of canvas

**Tests:** Manual: click buttons, see mode change reflected in cursor + behavior

---

### T13: Create `src/components/three/DowelMesh.tsx`

**What:** Interactive dowel with TransformControls
**Where:** `src/components/three/DowelMesh.tsx` (new)
**Depends on:** T7, T9
**Done when:**
- Renders cylinder with current diameter/depth
- TransformControls in translate mode
- Direction toggle (along selected face normal or Y axis)
- Updates hook state on drag
- Disables OrbitControls during drag

**Tests:** Manual: drag dowel, see position update in real-time

---

### T14: Create `src/components/three/PieceRenderer.tsx`

**What:** Renders a generated piece
**Where:** `src/components/three/PieceRenderer.tsx` (new)
**Depends on:** T9
**Done when:**
- Renders piece mesh
- Toggleable visibility
- Distinct color per piece (cyan for A, orange for B)
- Click to select (for future features)

**Tests:** Manual: cut produces 2 pieces, both visible

---

### T15: Rewrite `src/pages/Viewer3D.tsx`

**What:** Integrate all new components
**Where:** `src/pages/Viewer3D.tsx` (overwrite)
**Depends on:** T1, T2, T4-T14
**Reuses:** existing layout structure, theme, OrbitControls, Grid
**Done when:**
- Header shows model name + triangle count
- Left pane: Canvas with loaded mesh + toolbar + (optional) gizmos
- Right sidebar: MeshInfoPanel (triangles, format, quality slider), SelectionPanel (count, smart slider), DowelPanel (when active), PartsListPanel (real list with download buttons)
- All 7 spec acceptance criteria pass

**Tests:** Full UAT walkthrough

---

### T16: Add Vitest + tests for lib/ modules

**What:** Unit tests for pure logic
**Where:** `src/lib/__tests__/`, `vitest.config.ts`, `package.json` (scripts)
**Depends on:** T4, T5, T6, T7, T8
**Done when:**
- `npm test` runs Vitest
- Tests cover: decimate, smartSelect, fillHoles, cutBySelection, applyDowel, exportStl
- Tests use known geometries (cube, sphere, subdivided plane)

**Tests:** `npm test` passes

---

### T17: Update STATE.md and ROADMAP

**What:** Mark feature complete
**Where:** `.specs/project/STATE.md`, `.specs/project/ROADMAP.md`
**Depends on:** T15
**Done when:**
- STATE.md has new ADs and LLs from this work
- ROADMAP.md marks F1.1..F1.7 as COMPLETE
- Quick tasks table has T1..T15 rows

**Tests:** Manual review

## Dependency Graph

```
T1 ──┬── T8
     │
T2 ──┐
T3 ──┼── T4 ──┐
     │        ├── T9 ──┬── T11
     │        │        ├── T12
     │        │        ├── T13
     │        │        ├── T14
     │        │        └── T15
T5 ──┼────────┤
T6 ──┼── T7 ──┤
     │        │
     │        └── T16
T10 ─────────────── T15
```

## Execution Plan

**Phase 1 — Foundation (sequential, T1-T4):**
- T1 (deps), T2 (loaders), T3 (shims), T4 (decimate)

**Phase 2 — Core algorithms (parallel where possible, T5-T8):**
- T5 (selection), T6 (boolean cut), T8 (export) can be parallel
- T7 (dowel) depends on T6

**Phase 3 — State + UI (sequential, T9-T15):**
- T9 (hook) consolidates T4-T8
- T10 (dropzone) can be parallel to T9
- T11-T14 (3D components) depend on T9
- T15 (page rewrite) ties it all together

**Phase 4 — Quality (T16-T17):**
- T16 (tests) can be parallel to T15
- T17 (docs) after T15
