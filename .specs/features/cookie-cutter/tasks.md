# Cookie Cutter Maker — Atomic Tasks

Each task is independently verifiable. Tasks are ordered by dependency; `[P]` tasks can run in parallel.

## Task Index

| ID | Task | Phase | Deps | Status | Spec IDs |
|---|---|---|---|---|---|
| T1 | Add deps (opentype.js, polygon-clipping) | Setup | - | Pending | CC-01 |
| T2 | Create `lib/cookie-cutter/svgImport.ts` | F1 | T1 | Pending | CC-01 |
| T3 | Create `lib/cookie-cutter/svgExport.ts` | F1 | - | Pending | CC-01 |
| T4 | Create `lib/cookie-cutter/polygonOps.ts` | F1 | T1 | Pending | CC-01 |
| T5 | Create `lib/cookie-cutter/shape2D.ts` | F1 | - | Pending | CC-01 |
| T6 | Create `lib/cookie-cutter/svgValidator.ts` | F1 | T5 | Pending | CC-01 |
| T7 | Create `lib/cookie-cutter/svgAutoFix.ts` | F1 | T4, T6 | Pending | CC-01 |
| T8 | Create `hooks/useUndoRedo.ts` | F1 | - | Pending | CC-01 |
| T9 | Create `hooks/useSnap.ts` | F1 | - | Pending | CC-01 |
| T10 | Create `hooks/useVectorEditor.ts` | F1 | T2-T9 | Pending | CC-01, CC-02 |
| T11 | Create `icons/iconLoader.ts` | F1 | - | Pending | CC-01 |
| T12 | Create `editor/ShapeRenderer.tsx` | F1 | T10 | Pending | CC-01 |
| T13 | Create `editor/SelectionLayer.tsx` | F1 | T10 | Pending | CC-01 |
| T14 | Create `editor/VectorCanvas.tsx` | F1 | T12, T13 | Pending | CC-01 |
| T15 | Create `editor/Toolbar2D.tsx` | F1 | T10 | Pending | CC-01, CC-02 |
| T16 | Create `editor/ShapeLibrary.tsx` | F1 | T15 | Pending | CC-01 |
| T17 | Create `editor/LayerPanel.tsx` | F1 | T10 | Pending | CC-01 |
| T18 | Create `editor/HistoryPanel.tsx` | F1 | T8, T10 | Pending | CC-01 |
| T19 | Create `editor/TextInputDialog.tsx` | F1 | T1, T10 | Pending | CC-01 |
| T20 | Create `editor/PieceTabs.tsx` | F1 | T10 | Pending | CC-02 |
| T21 | Create `editor/FixReportDialog.tsx` | F1 | T7, T10 | Pending | CC-01 |
| T22 | Create `pages/CookieCutter.tsx` (F1 layout) | F1 | T14-T21 | Pending | CC-01, CC-02 |
| T23 | Add route `/cookie-cutter` in `App.tsx` | F1 | T22 | Pending | CC-01 |
| T24 | Tests F1: svgImport, svgAutoFix, useUndoRedo, useSnap | F1 | T2-T10 | Pending | CC-01 |
| T25 | Create `lib/cookie-cutter/polygonOffset.ts` | F2 | - | Pending | CC-03 |
| T26 | Create `lib/cookie-cutter/cutterParams.ts` | F2 | - | Pending | CC-05 |
| T27 | Create `lib/cookie-cutter/printProfiles.ts` | F2 | - | Pending | CC-05, CC-07 |
| T28 | Create `lib/cookie-cutter/handles.ts` | F2 | T25 | Pending | CC-03 |
| T29 | Create `lib/cookie-cutter/reinforcements.ts` | F2 | T25 | Pending | CC-03 |
| T30 | Create `lib/cookie-cutter/embosse.ts` | F2 | - | Pending | CC-03 |
| T31 | Create `lib/cookie-cutter/cutterBuild.ts` | F2 | T25-T30 | Pending | CC-03 |
| T32 | Create `lib/cookie-cutter/printEstimate.ts` | F2 | - | Pending | CC-07 |
| T33 | Create `lib/cookie-cutter/thumbnail.ts` | F2 | - | Pending | CC-08 |
| T34 | Create `lib/cookie-cutter/cutterExport.ts` | F2 | - | Pending | CC-06 |
| T35 | Create `hooks/useCookieCutter.ts` | F2 | T31-T34 | Pending | CC-03..07 |
| T36 | Create `cutter/ParameterPanel.tsx` | F2 | T26, T35 | Pending | CC-05 |
| T37 | Create `cutter/PrintProfileSelector.tsx` | F2 | T27, T35 | Pending | CC-05 |
| T38 | Create `cutter/HandlesControls.tsx` | F2 | T28, T35 | Pending | CC-03 |
| T39 | Create `cutter/EmbossePanel.tsx` | F2 | T30, T35 | Pending | CC-03 |
| T40 | Create `cutter/EstimatePanel.tsx` | F2 | T32, T35 | Pending | CC-07 |
| T41 | Create `cutter/Preview3D.tsx` | F2 | T35 | Pending | CC-04 |
| T42 | Create `cutter/DimensionOverlay.tsx` | F2 | T41 | Pending | CC-04 |
| T43 | Create `cutter/ExportPanel.tsx` | F2 | T34, T35 | Pending | CC-06 |
| T44 | Complete `pages/CookieCutter.tsx` (F1 + F2) | F2 | T36-T43 | Pending | CC-01..07 |
| T45 | Tests F2: polygonOffset, handles, emboss, estimate, cutterBuild | F2 | T25-T34 | Pending | CC-03..07 |
| T46 | Create `lib/projectStorage.ts` (types) | F3 | - | Pending | CC-08 |
| T47 | Create `lib/projects.ts` (API client) | F3 | T46 | Pending | CC-08 |
| T48 | Add API routes in `server.ts` | F3 | T46 | Pending | CC-08 |
| T49 | Create `hooks/useProjects.ts` | F3 | T47, T48 | Pending | CC-08 |
| T50 | Create `projects/ProjectList.tsx` | F3 | T49 | Pending | CC-08 |
| T51 | Create `projects/ProjectCard.tsx` | F3 | T49 | Pending | CC-08 |
| T52 | Create `projects/ProjectHeader.tsx` | F3 | T49 | Pending | CC-08 |
| T53 | Create `projects/VersionHistory.tsx` | F3 | T49 | Pending | CC-08 |
| T54 | Create `projects/PrintProfileManager.tsx` | F3 | T27 | Pending | CC-05 |
| T55 | Complete `pages/CookieCutter.tsx` (F1 + F2 + F3) | F3 | T49-T54 | Pending | CC-08 |
| T56 | Tests F3: API routes, useProjects, load/save roundtrip | F3 | T48-T55 | Pending | CC-08 |
| T57 | Update STATE.md and ROADMAP.md | Docs | T55 | Pending | - |
| T58 | Create `lib/cookie-cutter/bambuProfile.ts` | F2 | T26 | Pending | CC-10 |
| T59 | Create `lib/cookie-cutter/threemfWriter.ts` | F2 | - | Pending | CC-10 |
| T60 | Update `lib/cookie-cutter/cutterExport.ts` (Bambu 3MF) | F2 | T34, T58, T59 | Pending | CC-06, CC-10 |
| T61 | Create `hooks/useUnits.ts` (mm/cm toggle) | F2 | - | Pending | CC-09 |
| T62 | Create `lib/cookie-cutter/printerConfig.ts` | F3 | - | Pending | CC-11 |
| T63 | Create `cutter/PrinterSetup.tsx` | F3 | T62 | Pending | CC-11 |
| T64 | Create `common/UnitToggle.tsx` | F2 | T61 | Pending | CC-09 |
| T65 | Update `cutter/ParameterPanel.tsx` (unit labels) | F2 | T61 | Pending | CC-09 |
| T66 | Update `cutter/DimensionOverlay.tsx` (unit labels) | F2 | T61 | Pending | CC-09 |

## Task Details

### T1: Add deps (opentype.js, polygon-clipping)

**What:** Install opentype.js + polygon-clipping + @types/opentype.js
**Where:** `package.json`
**Depends on:** -
**Reuses:** npm
**Done when:**
- `npm install opentype.js polygon-clipping`
- `npm install -D @types/opentype.js`
- `npm run lint` and `npm run build` pass

**Tests:** `npm run lint && npm run build`

---

### T2: Create `lib/cookie-cutter/svgImport.ts`

**What:** Parse SVG file/string into `VectorScene` data structure
**Where:** `src/lib/cookie-cutter/svgImport.ts` (new)
**Depends on:** T1
**Reuses:** `polygon-clipping` (parse helper only)
**Done when:**
- Exports `parseSvgFile(file: File): Promise<VectorScene>` and `parseSvgString(svg: string): VectorScene`
- Handles `<path>`, `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<polyline>`, `<line>` elements
- Handles `<g>` groups with nested transforms
- Handles `fill-rule="evenodd"` / "nonzero"
- Each path becomes a `Shape2D` with extracted `d` attribute and default transform
- Groups with `id` become `name` in metadata
- Returns `VectorScene` with all shapes in one piece

**Tests:** Manual: upload test SVGs (simple paths, groups, shapes)

---

### T3: Create `lib/cookie-cutter/svgExport.ts`

**What:** Serialize `VectorScene` back to SVG string
**Where:** `src/lib/cookie-cutter/svgExport.ts` (new)
**Depends on:** -
**Done when:**
- Exports `sceneToSvgString(scene: VectorScene): string`
- Generates valid SVG XML with proper namespace
- Each `Shape2D` rendered as `<path d="..." transform="..."/>`
- Groups shapes by piece with `<g id="Piece_NN_Name">`
- Includes viewBox matching the workspace dimensions

**Tests:** Roundtrip: import SVG → export → import again, compare shapes

---

### T4: Create `lib/cookie-cutter/polygonOps.ts`

**What:** Wrapper around polygon-clipping for boolean 2D operations
**Where:** `src/lib/cookie-cutter/polygonOps.ts` (new)
**Depends on:** T1
**Reuses:** `polygon-clipping` (union, intersection, difference, xor)
**Done when:**
- Exports: `unionPolygons(a, b)`, `differencePolygons(a, b)`, `intersectPolygons(a, b)`
- Handles multi-polygon inputs
- Exports `polygonsEqual(a, b, tol)` for comparison
- Handles empty results gracefully

**Tests:** Unit: union of two overlapping squares, diff of circle minus smaller circle

---

### T5: Create `lib/cookie-cutter/shape2D.ts`

**What:** Fix open paths and convert to THREE.Shape for extrusion
**Where:** `src/lib/cookie-cutter/shape2D.ts` (new)
**Depends on:** -
**Done when:**
- Exports `isClosed(points, tolerance): boolean`
- Exports `closePath(points): Point[]` (append first point if gap < tolerance)
- Exports `shape2DToTREEShape(shape: Shape2D): THREE.Shape`
- Exports `pathDFromPoints(points): string`
- Exports `pointsFromPathD(d: string): Vector2[]`
- Handles cubic/quadratic bezier curves by sampling N points
- Handles arc commands (A/a)

**Tests:** Unit: closePath on circle (already closed), on C-shape (should close)

---

### T6: Create `lib/cookie-cutter/svgValidator.ts`

**What:** Detect problems in VectorScene before auto-fix
**Where:** `src/lib/cookie-cutter/svgValidator.ts` (new)
**Depends on:** T5
**Done when:**
- Exports `validate(scene: VectorScene): FixReport | null`
- Detects: open paths (gap > 0.01mm), self-intersections (via polygon-clipping), duplicate points, winding issues
- Returns null if no problems found
- `FixReport` has counts per type + categorized list

**Tests:** Unit: validate known-bad SVGs, verify correct counts

---

### T7: Create `lib/cookie-cutter/svgAutoFix.ts`

**What:** Apply corrections to generate a clean version of the scene
**Where:** `src/lib/cookie-cutter/svgAutoFix.ts` (new)
**Depends on:** T4, T6
**Reuses:** `polygon-clipping`, `shape2D`.ts
**Done when:**
- Exports `autoFix(scene: VectorScene): { fixed: VectorScene; report: FixReport }`
- Dedup points (tolerance 0.01mm)
- Close open paths
- Fix self-intersections via `polygon-clipping.union`
- Normalize winding (CCW = positive area)
- Original scene is NOT mutated; returns new `VectorScene`

**Tests:** Unit: auto-fix known-bad SVG, verify all problems resolved

---

### T8: Create `hooks/useUndoRedo.ts`

**What:** Generic undo/redo history stack
**Where:** `src/hooks/useUndoRedo.ts` (new)
**Depends on:** -
**Done when:**
- Exports `useUndoRedo<T>(state: T, maxSize?: number): { push, undo, redo, canUndo, canRedo, current, stack }`
- Snapshot-based (not command pattern)
- Supports `extract` function to limit what's snapshotted
- Cap at 50 entries default
- Undo pops current, redo restores from redoStack
- New push clears redoStack

**Tests:** Unit: push 3 states, undo 2, redo 1, verify correct state

---

### T9: Create `hooks/useSnap.ts`

**What:** Snap-to-grid and snap-to-vertex logic
**Where:** `src/hooks/useSnap.ts` (new)
**Depends on:** -
**Done when:**
- Exports `useSnap(gridSize, enabled, tolerance): { snap(p: Point): Point; snapX(x): number; snapY(y): number }`
- Exports `vertexSnapPoints: Point[]` for current vertices
- Grid snap: round to nearest gridSize multiple within tolerance
- Vertex snap: snap to nearest vertex position within tolerance
- Updates vertexSnapPoints when shapes change

**Tests:** Unit: snap 47 → 50 (grid 10), snap 3 → 3 (grid 10, tolerance 2, outside)

---

### T10: Create `hooks/useVectorEditor.ts`

**What:** Central state hook for 2D editor
**Where:** `src/hooks/useVectorEditor.ts` (new)
**Depends on:** T2, T3, T4, T5, T6, T7, T8, T9
**Reuses:** svgImport, svgExport, svgValidator, svgAutoFix, useUndoRedo, useSnap
**Done when:**
- Exports `useVectorEditor()` returning `{ state, actions, save, load }`
- State: pieces, activePieceId, view (pan, zoom), grid, selection, mode, fixReport, showFixDialog, showTextDialog
- Actions: addPiece, removePiece, renamePiece, setActivePiece, addShape, removeShape, updateShape, moveShape, scaleShape, rotateShape, mirrorShape, selectAll, clearSelection, setMode, zoomIn, zoomOut, toggleGrid, toggleSnap, pushHistory, importSvgFile, applyFix, rejectFix
- Multi-piece: `addPiece` creates new empty piece; `removePiece` removes if >1
- Auto-fix flow: import → validate → show dialog → apply or reject
- Integrates useUndoRedo for undo/redo on shape changes

**Tests:** Manual: full flow load → edit → undo → redo

---

### T11: Create `icons/iconLoader.ts`

**What:** Load SVG icons (lucide-react or custom) as Shape2D
**Where:** `src/components/cookie-cutter/editor/iconLoader.ts` (new)
**Depends on:** -
**Done when:**
- Exports `loadIcon(name: string): Shape2D[]`
- Maps icon names → SVG path data (hardcoded small set: star, heart, arrow, etc.)
- Supports lucide-react icons via string extraction from JSX
- Returns array (some icons have multiple paths like inner + outer)

**Tests:** Manual: render loaded icon shape in VectorCanvas

---

### T12: Create `editor/ShapeRenderer.tsx`

**What:** Render a single Shape2D as `<path>` in SVG
**Where:** `src/components/cookie-cutter/editor/ShapeRenderer.tsx` (new)
**Depends on:** T10
**Done when:**
- Props: `shape: Shape2D, selected: boolean, mode: EditorMode, onClick, onMouseDown`
- Renders `<path d={shape.d}>` inside `<g transform={composeTransform(shape.transform)}>`
- Selected shapes have dashed outline + handles (rendered by SelectionLayer)
- Cursor: crosshair in draw mode, move in select mode, text in insert mode
- Non-selected shapes dim slightly on hover

**Tests:** Manual: load shapes, click to select, see highlight

---

### T13: Create `editor/SelectionLayer.tsx`

**What:** Bounding box + transform handles for selected shapes
**Where:** `src/components/cookie-cutter/editor/SelectionLayer.tsx` (new)
**Depends on:** T10
**Done when:**
- Renders 8 handles (4 corners + 4 midpoints) + rotate handle (offset from top-mid)
- Renders bounding box (dashed rectangle)
- Drag corner handles → scale (center-relative if alt, proportional if shift)
- Drag mid handles → scale along one axis
- Drag rotate handle → rotation around center (snap 15° with shift)
- Drag inside bounding box → translate (move)
- All operations call `updateShape(shapeId, transform)` via useVectorEditor

**Tests:** Manual: select shape, drag corner, see scale; drag rotate handle, see rotation

---

### T14: Create `editor/VectorCanvas.tsx`

**What:** SVG canvas with zoom, pan, grid overlay, click handling
**Where:** `src/components/cookie-cutter/editor/VectorCanvas.tsx` (new)
**Depends on:** T12, T13
**Done when:**
- SVG viewBox tracks pan + zoom from useVectorEditor state
- Wheel → zoom in/out (step 0.1x, min 0.1x, max 10x)
- Middle button drag → pan
- Grid overlay: `<pattern>` with configurable size
- Dropzone for .svg files → calls importSvgFile
- Click on empty area → deselects all
- Click on shape → selectShape(shapeId)
- Shows grid when `grid.enabled = true`
- Snap lines (dashed) when dragging and `grid.snap = true`

**Tests:** Manual: zoom, pan, drop SVG, click shapes

---

### T15: Create `editor/Toolbar2D.tsx`

**What:** Toolbar with mode buttons, undo/redo, piece controls
**Where:** `src/components/cookie-cutter/editor/Toolbar2D.tsx` (new)
**Depends on:** T10
**Done when:**
- Buttons: Select (V), Draw (D), Text (T), Pan (H), Zoom (Z)
- Transform group: Move, Scale, Rotate, Mirror H, Mirror V — active when shape selected
- Undo/Redo buttons (disabled states from canUndo/canRedo)
- Grid toggle (G) + grid size selector (5/10/25/50mm)
- Snap toggle (S)
- "Nova peça" button → calls addPiece
- Shows keyboard shortcuts on hover (tooltip)
- Active mode highlighted with cyan border

**Tests:** Manual: click buttons, see mode change, shortcuts work

---

### T16: Create `editor/ShapeLibrary.tsx`

**What:** Collapsible sidebar with pre-made shapes
**Where:** `src/components/cookie-cutter/editor/ShapeLibrary.tsx` (new)
**Depends on:** T15
**Done when:**
- Grid of shape icons: Circle, Square, Triangle, Star (5-point), Star (6-point), Heart, Hexagon, Cloud, Moon, Arrow
- Sizes: 20mm, 40mm, 60mm, 80mm (selectable)
- Click shape → calls addShapeToActivePiece(shape2D)
- With multi-piece: prompt "Adicionar à peça '{name}' ou Criar nova peça?"
- Shapes generated as Shape2D with path data
- Icon tab: lucide-react icons as shapes

**Tests:** Manual: click Star → appears in canvas; change size → larger star

---

### T17: Create `editor/LayerPanel.tsx`

**What:** List of shapes in active piece with z-order
**Where:** `src/components/cookie-cutter/editor/LayerPanel.tsx` (new)
**Depends on:** T10
**Done when:**
- Lists shapes in z-order (top = last = rendered on top)
- Each row: icon (path/ellipse/rect), name, visibility toggle, up/down arrows, delete
- Drag to reorder (optional v1, button arrows fine)
- Click row → selects shape in canvas
- Delete shape → removes from piece
- Visibility toggle → show/hide shape (opacity 0.2)

**Tests:** Manual: add 3 shapes, reorder, hide one, delete another

---

### T18: Create `editor/HistoryPanel.tsx`

**What:** Visual undo history stack
**Where:** `src/components/cookie-cutter/editor/HistoryPanel.tsx` (new)
**Depends on:** T8, T10
**Done when:**
- Shows list of actions: "Add shape Star", "Move by (10, 20)", "Scale 1.5x"
- Current position highlighted
- Click any past state → undo/redo to that point
- Max 50 entries visible (older trimmed with "...")
- Actions labeled from useVectorEditor action diffs

**Tests:** Manual: do 5 actions, open HistoryPanel, click state 2, see canvas revert

---

### T19: Create `editor/TextInputDialog.tsx`

**What:** Modal for adding text converted to curves
**Where:** `src/components/cookie-cutter/editor/TextInputDialog.tsx` (new)
**Depends on:** T1, T10
**Reuses:** `opentype.js`
**Done when:**
- Fields: text content, font family (dropdown: Arial, Times, system, + upload custom TTF/OTF), font size (mm)
- Preview: live rendering of text-as-path
- "Converter em curvas" button → opentype.js `font.getPath(text, 0, 0, fontSize)` → SVG path d-string
- Result: Shape2D with kind="text" and metadata.fontFamily
- Close button → cancel
- Uploaded font stored in memory (not persisted pre-F3)

**Tests:** Manual: type "COOKIE", select Arial, convert → path appears in canvas

---

### T20: Create `editor/PieceTabs.tsx`

**What:** Tab bar for managing multiple cutter pieces
**Where:** `src/components/cookie-cutter/editor/PieceTabs.tsx` (new)
**Depends on:** T10
**Done when:**
- Horizontal tab bar showing all piece names
- Active tab highlighted with cyan underline
- Right-click tab → context menu: Renomear, Excluir (disabled if only 1 piece)
- Renomear → inline edit or modal
- "Nova peça" button at end of tabs
- When hidden (1 piece): minimal state showing piece name only

**Tests:** Manual: create 3 pieces, rename, switch tabs, delete one

---

### T21: Create `editor/FixReportDialog.tsx`

**What:** Preview side-by-side (before/after) for SVG auto-fix
**Where:** `src/components/cookie-cutter/editor/FixReportDialog.tsx` (new)
**Depends on:** T7, T10
**Done when:**
- Modal with title "Correções detectadas" + subtitle "Seu SVG tem X problemas que podem ser corrigidos automaticamente"
- Left pane: "Original" — original SVG in mini-canvas
- Right pane: "Corrigido" — fixed SVG in mini-canvas
- Table below: type | count | description
  - Paths abertos: N → "Fechados automaticamente"
  - Auto-interseções: N → "Resolvidas com boolean union"
  - Pontos duplicados: N → "Removidos"
  - Winding invertido: N → "Normalizado"
- Buttons: "Aplicar correções" (accept), "Manter original" (reject)
- "Aplicar todas" checkbox for batch confirm
- Each fix row can be toggled on/off individually

**Tests:** Manual: import bad SVG, see dialog, toggle fixes, accept, see clean shapes

---

### T22: Create `pages/CookieCutter.tsx` (F1 layout)

**What:** Page layout with header + canvas + sidebar (no 3D yet)
**Where:** `src/pages/CookieCutter.tsx` (new)
**Depends on:** T14, T15, T16, T17, T18, T19, T20, T21
**Reuses:** Layout pattern from `Viewer3D.tsx` and `ImageTo3D.tsx`
**Done when:**
- Header: "Cookie Cutter Maker" + piece count + mode indicator
- Left pane (60%): VectorCanvas with Toolbar2D floating on top
- Right sidebar (40%): PieceTabs + LayerPanel + HistoryPanel + ShapeLibrary (collapsible)
- Footer: status bar (mode, selection count, zoom level)
- All 8 editor sub-components integrated and working
- Dark/cyan theme consistent with rest of app
- Responsive: collapses sidebar on small screens

**Tests:** UAT walkthrough: upload SVG → fix → draw star → add text → undo → redo

---

### T23: Add route `/cookie-cutter` in `App.tsx`

**What:** Add navigation item and React Router route
**Where:** `src/App.tsx` (modify)
**Depends on:** T22
**Reuses:** existing NavItem pattern
**Done when:**
- NavItem `<Cookie>` added to nav rail
- Route `<Route path="/cookie-cutter" element={<CookieCutter />} />` added
- Icon from lucide-react
- No regression on existing routes

**Tests:** `npm run build` passes; navigate between tabs works

---

### T24: Tests F1

**What:** Unit tests for F1 modules
**Where:** `src/lib/cookie-cutter/__tests__/`, `src/hooks/__tests__/`
**Depends on:** T2, T3, T4, T5, T6, T7, T8, T9, T10
**Reuses:** Vitest (already configured)
**Done when:**
- Test: `svgImport` parses `<path d="M0,0 L10,10"/>` → 1 Shape2D
- Test: `svgExport` roundtrip preserves paths
- Test: `polygonOps.union` of two squares → correct merged polygon
- Test: `closePath` on C-shape → adds closing point
- Test: `svgValidator` detects 3 open paths + 1 self-intersection
- Test: `svgAutoFix` resolves all detected problems
- Test: `useUndoRedo` push/undo/redo sequence correct
- Test: `useSnap` snaps 47 → 50 at grid 10
- Test: `useVectorEditor` addShape, removeShape, selectShape

**Tests:** `npm test` (Vitest) — ≥ 10 tests passing

---

### T25: Create `lib/cookie-cutter/polygonOffset.ts`

**What:** Uniform polygon offset via miter algorithm
**Where:** `src/lib/cookie-cutter/polygonOffset.ts` (new)
**Depends on:** -
**Done when:**
- Exports `offsetPolygon(points: Vec2[], distance: number, miterLimit?: number): Vec2[]`
- Positive distance = outward offset; negative = inward
- Miter algorithm with bevel fallback for sharp angles
- Handles CW and CCW polygons (auto-detect via signed area)
- Exports `offsetShape(shape: THREE.Shape, distance: number): THREE.Shape` (convenience)
- Returns new polygon, never mutates input

**Tests:** Unit: offset square by +5 → larger square, offset by -3 → smaller centered square; offset star by +2 → all vertices move outward uniformly

---

### T26: Create `lib/cookie-cutter/cutterParams.ts`

**What:** Default parameters, validation, profile application
**Where:** `src/lib/cookie-cutter/cutterParams.ts` (new)
**Depends on:** -
**Done when:**
- Exports `DEFAULT_PARAMS: CutterParams` with sensible defaults:
  - height: 25mm, wallThickness: 1.5mm, bladeThickness: 1.0mm
  - baseThickness: 0mm, cornerRadius: 2mm
  - innerOffset: 0mm, outerOffset: 0mm
  - tolerance: 0.2mm, minRadius: 1mm, minPrintThickness: 0.8mm
  - handles disabled, autoThreshold 70mm, type "loop", width 20mm, thickness 3mm
  - reinforcements auto, spacing 40mm, thickness 2mm
  - filament: PLA, density 1.24, costPerKg 80
  - printProfile: "ender3-v2"
- Exports `validateParams(p): ValidationResult` (warnings + errors)
- Exports `applyProfile(params, profile): CutterParams` — locks mins
- Exports `PRESETS: CutterParams[]` — "Fino 0.8mm", "Robusto 1.6mm", "Hobby", "Pro"

**Tests:** Unit: validate detects bladeThickness < minPrintThickness; applyProfile locks wall min

---

### T27: Create `lib/cookie-cutter/printProfiles.ts`

**What:** Hardcoded print profiles + local storage custom profiles
**Where:** `src/lib/cookie-cutter/printProfiles.ts` (new)
**Depends on:** -
**Done when:**
- Exports `BUILTIN_PROFILES: PrintProfile[]` with 6 entries:
  - Ender 3 V2: 220×220×250, 0.4mm, min wall 0.8, min blade 0.4
  - Prusa MK4: 250×210×220, 0.4mm, min wall 0.8, min blade 0.4
  - Bambu Lab X1: 256×256×256, 0.4mm, min wall 0.8, min blade 0.4
  - Bambu Lab A1: 256×256×256, 0.4mm, min wall 0.8, min blade 0.4
  - Voron 2.4: 350×350×350, 0.6mm, min wall 1.2, min blade 0.6
  - Anycubic Kobra 2: 250×220×220, 0.4mm, min wall 0.8, min blade 0.4
- Exports `loadCustomProfiles(): PrintProfile[]` from localStorage
- Exports `saveCustomProfile(profile): void`
- Exports `deleteCustomProfile(id): void`
- Each profile has: id, name, brand, buildVolume, nozzleDiameter, minWallThickness, minBladeThickness, minBaseThickness, minRadius, maxLayerHeight, isCustom

**Tests:** Unit: profile lookup by id works; custom save → load roundtrip

---

### T28: Create `lib/cookie-cutter/handles.ts`

**What:** Auto-generate handle shapes based on cutter size
**Where:** `src/lib/cookie-cutter/handles.ts` (new)
**Depends on:** T25
**Done when:**
- Exports `generateHandles(outerShape: Shape, params: CutterParams): Shape[]`
- Returns empty `[]` if disabled or cutter < autoThreshold
- Finds longest straight edge of bbox
- Type "loop": creates rectangle with inner hole (2 shapes; outer + inner = hollow)
- Type "tab": creates solid rectangle (1 shape)
- Position: centered on longest bbox edge, outside the cutter wall
- Count 2: mirrors to opposite edge
- Handle width and thickness from params
- All returned as THREE.Shape (ready for ExtrudeGeometry)

**Tests:** Unit: cutter 100mm → returns 1 handle; cutter 30mm → returns []; verify position on correct bbox edge

---

### T29: Create `lib/cookie-cutter/reinforcements.ts`

**What:** Auto-generate structural ribs for large cutters
**Where:** `src/lib/cookie-cutter/reinforcements.ts` (new)
**Depends on:** T25
**Done when:**
- Exports `generateRibs(outer: Shape, inner: Shape, height: number, params: CutterParams): Shape[]`
- Returns empty `[]` if `reinforcements.auto=false` or perimeter < minimum
- Calculates perimeter approximation (sampling N points, summing edge lengths)
- Rib count = floor(perimeter / spacing); cap 50
- Samples N points uniformly on outer perimeter
- For each point, finds nearest point on inner perimeter (min distance)
- Creates rectangle connecting outer→inner with thickness × wallThickness
- All oriented radially (along normal direction at sample point)

**Tests:** Unit: large circle → ribs generated at expected spacing; small shape → no ribs

---

### T30: Create `lib/cookie-cutter/embosse.ts`

**What:** Apply emboss/deboss (stamp) to cutter blade
**Where:** `src/lib/cookie-cutter/embosse.ts` (new)
**Depends on:** -
**Reuses:** `three-bvh-csg` (Brush, Evaluator, SUBTRACTION, ADDITION)
**Done when:**
- Exports `applyEmbosser(piece: VectorPiece, bladeMesh: Mesh): Mesh`
- Converts each `embosseShape` to `THREE.Shape`
- Extrudes shape with depth = piece.embosseDepth, direction = -Z
- Creates CSG Brush
- If `embosseMode === "deboss"`: SUBTRACTION
- If `embosseMode === "emboss"`: ADDITION
- Returns new mesh (combined result)
- Handles empty embosseShapes → returns bladeMesh unchanged

**Tests:** Unit: apply deboss to simple plane → verify geometry has recessed area

---

### T31: Create `lib/cookie-cutter/cutterBuild.ts`

**What:** Full pipeline SVG → 3D cookie cutter
**Where:** `src/lib/cookie-cutter/cutterBuild.ts` (new)
**Depends on:** T25, T26, T28, T29, T30
**Reuses:** `three-bvh-csg`, `booleanCut.makeBrush()` pattern, `ExtrudeGeometry`
**Done when:**
- Exports `buildCutter(piece: VectorPiece, params: CutterParams): CutterResult`
- Pipeline steps (see design.md data flow):
  1. shapes → THREE.Shape[] (via shape2D)
  2. offset outer (+outerOffset + tolerance)
  3. offset inner (-(wallThickness + innerOffset))
  4. ExtrudeGeometry outer with inner hole → wall
  5. ExtrudeGeometry original shape thin → blade
  6. Build base plate if baseThickness > 0
  7. Generate handles (T28)
  8. Generate ribs (T29)
  9. Apply embosse (T30)
  10. CSG union of all meshes → combined
- Returns CutterResult with all individual meshes + combined + stats
- Handles empty results gracefully
- Try/catch around CSG with clear error messages

**Tests:** Unit: build star cutter 80mm, verify wall thickness ≈ 1.5mm, blade exists, triangles > 100

---

### T32: Create `lib/cookie-cutter/printEstimate.ts`

**What:** Print time, weight, filament, cost estimation
**Where:** `src/lib/cookie-cutter/printEstimate.ts` (new)
**Depends on:** -
**Done when:**
- Exports `calculateEstimate(mesh: Mesh, params: CutterParams): PrintEstimate`
- Computes mesh volume via signed tetrahedra sum
- weightG = volume_cm³ × filament.density
- filamentLength = volume_cm³ / filament_cross_section
- printTimeH = volume_cm³ / DEFAULT_FLOW_RATE (4 cm³/h)
- cost = (weight_kg) × filament.costPerKg
- Adds 20% waste/support margin
- DEFAULT_FLOW_RATE overridable via param
- Handles zero-volume edge case

**Tests:** Unit: unit cube 1cm³ → volume=1cm³, weight=1.24g (PLA), time=0.25h; verify 20% margin

---

### T33: Create `lib/cookie-cutter/thumbnail.ts`

**What:** Client-side thumbnail render of 3D model
**Where:** `src/lib/cookie-cutter/thumbnail.ts` (new)
**Depends on:** -
**Reuses:** `THREE.WebGLRenderer`, `THREE.Scene`, `THREE.PerspectiveCamera`
**Done when:**
- Exports `renderThumbnail(mesh: Mesh, size?: 256 | 64): Promise<string>`
- Creates offscreen WebGLRenderer
- Isometric camera auto-framing
- Ambient + directional light
- Returns base64 PNG data URL
- Cleans up renderer after render
- Error fallback: returns gray placeholder data URL
- Default size = 256

**Tests:** Manual: generate thumbnail of star cutter, open base64 in new tab

---

### T34: Create `lib/cookie-cutter/cutterExport.ts`

**What:** Export cutters to STL/OBJ/3MF/GLB/ZIP
**Where:** `src/lib/cookie-cutter/cutterExport.ts` (new)
**Depends on:** -
**Reuses:** `STLExporter`, `OBJExporter` (from three-stdlib), `GLTFExporter`, `JSZip`, `file-saver`
**Done when:**
- Exports `exportSTL(mesh, filename)` — triggers download
- Exports `exportOBJ(mesh, filename)`
- Exports `exportGLB(mesh, filename)` — GLTF binary
- Exports `export3MF(mesh, filename)` — STL with .3mf extension for now (3MF authoring complex; future)
- Exports `exportAllZip(results: CutterResult[], zipFilename)` — ZIP with per-piece STL + combined.stl
- Exports `exportSVG(piece: VectorPiece, filename)` — SVG string download
- Binary STL format
- Uses file-saver for download triggers

**Tests:** Manual: export all formats, open in PrusaSlicer to verify

---

### T35: Create `hooks/useCookieCutter.ts`

**What:** Orchestrate cutter generation with debounce and multi-piece
**Where:** `src/hooks/useCookieCutter.ts` (new)
**Depends on:** T31, T32, T33, T34
**Reuses:** buildCutter, calculateEstimate, renderThumbnail, cutterExport
**Done when:**
- Exports `useCookieCutter(scene: VectorScene, initialParams: CutterParams)`
- Returns `{ state: CookieCutterState, setParams, setParam, setPieceParam, regenerate, exportPiece, exportAll, getThumbnail }`
- Watches `[scene, params, activePieceId]` with 300ms debounce
- Generates CutterResult per piece
- Grid layout: piecesToGrid(results, spacing=3.0)
- Aggregate estimate: sum all estimates
- Generate thumbnail for active piece on request
- Wireframe toggle
- Loading/generating state with abort (cancel in-flight via AbortController)

**Tests:** Manual: change wall thickness slider, see preview update after 300ms

---

### T36: Create `cutter/ParameterPanel.tsx`

**What:** Sliders for all cutter parameters
**Where:** `src/components/cookie-cutter/cutter/ParameterPanel.tsx` (new)
**Depends on:** T26, T35
**Reuses:** `Slider` from `@/components/ui/slider`
**Done when:**
- Section "01. Parâmetros" with sliders:
  - Altura do cortador (5–80mm, step 0.5)
  - Espessura da parede (0.8–4mm, step 0.1)
  - Espessura da lâmina (0.4–3mm, step 0.1)
  - Espessura da base (0–5mm, step 0.5)
  - Espessura da borda de apoio (0–3mm, step 0.5)
  - Arredondamento dos cantos (0–10mm, step 0.5)
- Section "02. Offset" with:
  - Offset interno (0–5mm, step 0.1)
  - Offset externo (0–5mm, step 0.1)
  - Raio mínimo (0.4–5mm, step 0.1)
  - Espessura mínima (0.4–3mm, step 0.1)
  - Tolerância (0–2mm, step 0.05)
- Section "03. Filamento" with:
  - Material (PLA/PETG/ABS/TPU)
  - Densidade (auto, read-only)
  - Custo por kg (R$)
- Section "04. Perfil" with PrintProfileSelector
- Each slider shows value + unit + warn icon if constraint violated
- Presets row: "Fino 0.8mm", "Robusto 1.6mm", "Hobby", "Pro"
- Dark/cyan theme

**Tests:** Manual: drag each slider, verify value updates and preview regenerates

---

### T37: Create `cutter/PrintProfileSelector.tsx`

**What:** Dropdown to select print profile
**Where:** `src/components/cookie-cutter/cutter/PrintProfileSelector.tsx` (new)
**Depends on:** T27, T35
**Done when:**
- Dropdown with 6 built-in profiles + custom profiles from localStorage
- Profile name + brand displayed
- On select: calls `applyProfile(params, profile)` → locks mins
- Warning if cutter exceeds build volume (red background)
- "Gerenciar perfis" link → opens PrintProfileManager modal

**Tests:** Manual: select Ender 3, verify wall min locked at 0.8mm; select Prusa, verify constraints change

---

### T38: Create `cutter/HandlesControls.tsx`

**What:** Toggle and configure cutter handles
**Where:** `src/components/cookie-cutter/cutter/HandlesControls.tsx` (new)
**Depends on:** T28, T35
**Done when:**
- Section "05. Alças" with:
  - Toggle "Gerar alças automaticamente"
  - Threshold auto-ativação (30–150mm)
  - Tipo: "Loop (oco)" ou "Tab (sólido)"
  - Largura (10–40mm)
  - Espessura (1–6mm)
  - Quantidade: 1 (topo) ou 2 (topo + base)
- When disabled, all sub-controls grayed out

**Tests:** Manual: enable handles on star 80mm → alça appears in preview

---

### T39: Create `cutter/EmbossePanel.tsx`

**What:** Configure emboss/deboss stamps
**Where:** `src/components/cookie-cutter/cutter/EmbossePanel.tsx` (new)
**Depends on:** T30, T35
**Done when:**
- Section "06. Carimbo" with:
  - Toggle "Ativar carimbo"
  - Mode: Emboss (relevo) ou Deboss (recesso)
  - Profundidade (0.2–2.0mm, step 0.1)
  - "Adicionar texto como carimbo" button → opens TextInputDialog in embosse mode
  - "Adicionar forma como carimbo" button → opens ShapeLibrary in embosse mode
  - List of embosse shapes with delete
- When disabled, carimbos not applied in pipeline

**Tests:** Manual: add text "BAKER" as deboss on star → see recessed text on blade

---

### T40: Create `cutter/EstimatePanel.tsx`

**What:** Show print time, weight, filament, cost estimates
**Where:** `src/components/cookie-cutter/cutter/EstimatePanel.tsx` (new)
**Depends on:** T32, T35
**Done when:**
- Section "07. Estimativa" with readouts:
  - Volume: X.X cm³
  - Peso: XX g
  - Filamento: X.XX m
  - Tempo: X.XX h
  - Custo: R$ X.XX
- Disclaimer: "Estimativa aproximada (±30%). Valide no seu fatiador."
- Updates live when params change (debounce 500ms)
- Color coding: green < 2h, yellow 2-6h, red > 6h for time
- Aggregate across all pieces

**Tests:** Manual: verify estimate changes when adjusting height/thickness

---

### T41: Create `cutter/Preview3D.tsx`

**What:** R3F canvas for 3D cookie cutter visualization
**Where:** `src/components/cookie-cutter/cutter/Preview3D.tsx` (new)
**Depends on:** T35
**Reuses:** `Canvas`, `OrbitControls`, `Grid` from drei; dark theme from Viewer3D
**Done when:**
- Canvas with dark background (#050505)
- OrbitControls: rotate, pan, zoom
- Grid with fade distance
- Ambient + directional light + shadows
- Wall mesh (cyan, roughness 0.4)
- Blade mesh (white, roughness 0.6)
- Base mesh (dark gray, roughness 0.8)
- Handle meshes (silver, roughness 0.3)
- Rib meshes (dark cyan, roughness 0.5)
- Emboss/Deboss indicator (gold wireframe)
- Wireframe toggle: all materials → wireframe + opacity
- DimensionOverlay integrated (if showDimensions)
- Multi-piece: grid layout in XY plane
- Loading state while generating

**Tests:** Manual: build star cutter, rotate model, toggle wireframe, verify all components visible

---

### T42: Create `cutter/DimensionOverlay.tsx`

**What:** Overlay showing dimensions on 3D model
**Where:** `src/components/cookie-cutter/cutter/DimensionOverlay.tsx` (new)
**Depends on:** T41
**Reuses:** `THREE.Sprite`, `THREE.CanvasTexture`, `THREE.Line`
**Done when:**
- Shows bounding box dimensions (W × H × D) as floating labels
- Shows wall thickness as annotated line
- Shows height as vertical annotation
- Toggle via `showDimensions` state
- Labels always face camera (sprite-based)
- Non-intrusive: 8px white text, semi-transparent

**Tests:** Manual: toggle dimensions on/off, verify labels at correct positions

---

### T43: Create `cutter/ExportPanel.tsx`

**What:** Download buttons for all formats
**Where:** `src/components/cookie-cutter/cutter/ExportPanel.tsx` (new)
**Depends on:** T34, T35
**Done when:**
- Section "08. Exportar" with buttons:
  - "Baixar STL" (peça ativa)
  - "Baixar OBJ" (peça ativa)
  - "Baixar GLB" (peça ativa)
  - "Baixar 3MF" (peça ativa)
  - "Baixar SVG" (peça ativa, desenho 2D)
- Divider
- "Baixar todas STL (.zip)" — ZIP with all pieces
- "Baixar combinado STL" — single STL of all pieces union
- Loading state per button during export
- Success toast after download

**Tests:** Manual: click each button, verify file downloads and opens correctly

---

### T44: Complete `pages/CookieCutter.tsx` (F1 + F2)

**What:** Full page integration: editor 2D + 3D preview + parameters
**Where:** `src/pages/CookieCutter.tsx` (modify from T22)
**Depends on:** T36, T37, T38, T39, T40, T41, T42, T43
**Reuses:** T22 layout, Viewer3D patterns
**Done when:**
- Layout: header + left (editor 2D) + center (preview 3D) + right (parameters + export)
- Left panel: F1 editor (VectorCanvas + Toolbar + PieceTabs + ShapeLibrary)
- Center panel: Preview3D + DimensionOverlay
- Right panel: ParameterPanel + HandlesControls + EmbossePanel + EstimatePanel + ExportPanel
- Vertical scroll on right panel
- Resizable panels (optional, min-width constraint fine)
- All interactivity works bidirectionally: edit shape → preview updates; change param → preview updates
- Loading state while 3D generates
- Error handling: toast on failures

**Tests:** Full UAT walkthrough

---

### T45: Tests F2

**What:** Unit tests for F2 modules
**Where:** `src/lib/cookie-cutter/__tests__/`
**Depends on:** T25, T26, T27, T28, T29, T30, T31, T32, T33, T34
**Done when:**
- Test: polygonOffset circle +3 → radius increased by 3
- Test: polygonOffset square -2 → centered square with reduced side
- Test: handles generated for shape 100mm, not for 30mm
- Test: ribs spacing correct for given perimeter
- Test: emboss subtraction creates recess in mesh
- Test: cutterBuild star → valid mesh with wall, blade, triangles > 100
- Test: estimate unit cube → 1 cm³, 1.24g PLA, ~0.25h
- Test: printProfiles custom save/load roundtrip

**Tests:** `npm test` — ≥ 8 tests passing

---

### T46: Create `lib/projectStorage.ts` (types)

**What:** TypeScript types for project persistence
**Where:** `src/lib/projectStorage.ts` (new)
**Depends on:** -
**Done when:**
- `ProjectMeta` type: id, name, createdAt, updatedAt, favorite, currentVersion, versionCount, thumbnail64, pieceCount, totalTriangles, estimate
- `Project` type: extends ProjectMeta + scene, params map, printProfile, versions list
- `ProjectVersionMeta` type: version, createdAt, thumbnail64
- `ProjectVersion` type: version, createdAt, params, scene, thumbnail256

**Tests:** TypeScript compiles

---

### T47: Create `lib/projects.ts` (API client)

**What:** REST client for project CRUD endpoints
**Where:** `src/lib/projects.ts` (new)
**Depends on:** T46
**Done when:**
- Exports functions matching API:
  - `listProjects(): Promise<ProjectMeta[]>`
  - `getProject(id): Promise<Project>`
  - `createProject(name): Promise<ProjectMeta>`
  - `updateProject(id, data): Promise<ProjectMeta>`
  - `deleteProject(id): Promise<void>`
  - `duplicateProject(id): Promise<ProjectMeta>`
  - `saveVersion(id, version): Promise<ProjectVersionMeta>`
  - `getVersion(id, n): Promise<ProjectVersion>`
  - `getThumbnailUrl(id): string`
- Handles HTTP error codes (404, 500)
- Generic `request<T>` helper with fetch

**Tests:** Unit: mock fetch, verify correct endpoint calls

---

### T48: Add API routes in `server.ts`

**What:** Express REST API for project persistence
**Where:** `server.ts` (modify)
**Depends on:** T46
**Reuses:** Express, multer, fs (existing patterns from server.ts)
**Done when:**
- `GET /api/projects` — reads projects directory, returns ProjectMeta[] sorted by updatedAt
- `POST /api/projects` — creates `projects/{uuid}/` with `project.json`
- `GET /api/projects/:id` — reads project.json + latest version
- `PUT /api/projects/:id` — updates project.json (name, favorite)
- `DELETE /api/projects/:id` — removes project directory
- `POST /api/projects/:id/versions` — creates new version-N.json with body (params, scene, thumbnail)
- `GET /api/projects/:id/versions` — lists version metadata
- `GET /api/projects/:id/versions/:n` — loads specific version
- `GET /api/projects/:id/thumbnail` — serves thumbnail.png
- `POST /api/projects/:id/duplicate` — copies directory to new UUID
- Auto-cleanup: removes oldest versions when >50 per project
- Directory structure: `projects/{id}/project.json`, `projects/{id}/versions/{n}.json`, `projects/{id}/thumbnail.png`
- No auth required (self-hosted)

**Tests:** `curl` manual: create → list → save version → load version → delete

---

### T49: Create `hooks/useProjects.ts`

**What:** React hook for project state management
**Where:** `src/hooks/useProjects.ts` (new)
**Depends on:** T47, T48
**Reuses:** projects API client
**Done when:**
- Exports `useProjects()` returning `{ state: ProjectsState, create, save, load, remove, duplicate, goToVersion, refresh }`
- `refresh()` fetches project list
- `create(name)` creates new project → navigates to editor
- `save(project)` saves current version with thumbnail
- `load(id)` loads project → populates VectorEditor state + CookieCutter params
- `remove(id)` deletes with confirmation
- `duplicate(id)` copies project
- `goToVersion(id, n)` loads historical version
- Auto-save disabled by default (explicit save button)
- Debounce on metadata updates (favorite toggle)

**Tests:** Manual: create → save → refresh → load → verify scene + params

---

### T50: Create `projects/ProjectList.tsx`

**What:** Gallery grid of saved projects
**Where:** `src/components/cookie-cutter/projects/ProjectList.tsx` (new)
**Depends on:** T49
**Done when:**
- Grid layout: 3-4 columns
- Sorted: favorites first, then updatedAt desc
- Empty state: "Nenhum projeto salvo ainda" + "Criar primeiro projeto" button
- Loading state: skeleton cards
- Error state: "Falha ao carregar projetos" + retry button
- Search/filter by name
- Click card → load project
- "Novo projeto" button at top

**Tests:** Manual: save 2 projects, refresh page, see gallery

---

### T51: Create `projects/ProjectCard.tsx`

**What:** Card component for each saved project
**Where:** `src/components/cookie-cutter/projects/ProjectCard.tsx` (new)
**Depends on:** T49
**Done when:**
- Thumbnail 64×64 (base64) → rendered as `<img>`
- Project name (bold, truncate at 30 chars)
- Date: "Salvo em 30/06/2026"
- Piece count + total triangles
- Estimate summary: "~3.2h · 18g · R$1.44"
- Favorite star (filled if favorite, outline if not) → toggle on click
- Menu (3 dots): Abrir, Duplicar, Excluir
- Hover: subtle border highlight
- Click card body → load project

**Tests:** Manual: verify card renders project info correctly

---

### T52: Create `projects/ProjectHeader.tsx`

**What:** Top bar with project name + actions
**Where:** `src/components/cookie-cutter/projects/ProjectHeader.tsx` (new)
**Depends on:** T49
**Done when:**
- Project name (editable inline)
- Buttons: Salvar (with last saved date), Duplicar, Favoritar (star toggle), Excluir, Versões (with count)
- Version indicator: "v23 — salvo há 2 min"
- Autosave disabled (explicit save)
- "Meus projetos" back button → ProjectList
- "Novo projeto" → creates fresh project

**Tests:** Manual: rename project, save, favorite, see version count

---

### T53: Create `projects/VersionHistory.tsx`

**What:** Modal showing project version timeline
**Where:** `src/components/cookie-cutter/projects/VersionHistory.tsx` (new)
**Depends on:** T49
**Done when:**
- Modal triggered by "Versões" button
- Timeline list: version number, date, time, thumbnail (64px)
- Current version highlighted
- Click version → "Carregar esta versão?" confirmation
- Load replaces current state with that version's scene + params
- Current unsaved changes warning before loading old version
- Shows version count + storage size estimate

**Tests:** Manual: save 3 versions, open modal, load v1, verify scene is old version

---

### T54: Create `projects/PrintProfileManager.tsx`

**What:** CRUD manager for custom print profiles
**Where:** `src/components/cookie-cutter/projects/PrintProfileManager.tsx` (new)
**Depends on:** T27
**Done when:**
- Modal listing built-in profiles (read-only) + custom profiles (editable)
- Built-in: gray background, not deletable
- Custom: white background, edit/delete buttons
- "Novo perfil custom" form: name, brand, build volume (x/y/z), nozzle diameter, min wall/blade/base, max layer height
- Save → localStorage
- Delete → confirmation → localStorage
- "Exportar perfil" → download JSON
- "Importar perfil" → upload JSON
- Max 20 custom profiles (warning at 15)

**Tests:** Manual: create custom profile, save, verify appears in selector, delete, verify gone

---

### T55: Complete `pages/CookieCutter.tsx` (F1 + F2 + F3)

**What:** Full feature: editor + 3D + projects
**Where:** `src/pages/CookieCutter.tsx` (modify from T44)
**Depends on:** T49, T50, T51, T52, T53, T54
**Done when:**
- Two modes: "Editor" (default with project loaded or new) and "Galeria" (project list)
- Toggle between modes via ProjectHeader buttons
- When project loaded: ProjectHeader + F1 layout + F2 layout
- When no project: ProjectList
- Auto-save on navigate away (beforeunload)
- Unsaved changes warning dialog
- All features integrated and working together

**Tests:** Full UAT walkthrough: create → draw → 3D → params → export → save → reload → edit → version

---

### T56: Tests F3

**What:** Integration tests for project persistence
**Where:** `src/lib/__tests__/`, `src/hooks/__tests__/`
**Depends on:** T48, T49, T55
**Done when:**
- Test: API create project → POST returns ProjectMeta
- Test: API save version → version count increments
- Test: API load version → returns correct scene + params
- Test: API delete → 404 on subsequent GET
- Test: API duplicate → new UUID, same scene
- Test: useProjects load → populates state
- Test: custom profile save/load roundtrip

**Tests:** `npm test`

---

### T57: Update STATE.md and ROADMAP.md

**What:** Mark feature complete, document decisions and lessons
**Where:** `.specs/project/STATE.md`, `.specs/project/ROADMAP.md`
**Depends on:** T55
**Done when:**
- ROADMAP.md: add "M4: Cookie Cutter Maker" milestone with F1/F2/F3 features
- STATE.md: add ADs and LLs from cookie-cutter development
- Quick tasks table has T1..T57 rows with status
- Deferred ideas updated with any new items

**Tests:** Manual review

---

### T58: Create `lib/cookie-cutter/bambuProfile.ts`

**What:** Generate Bambu Studio metadata JSONs for A1 export
**Where:** `src/lib/cookie-cutter/bambuProfile.ts` (new)
**Depends on:** T26
**Done when:**
- Exports `generateBambuProfile(params: CutterParams, filamentMaterial?: string): BambuProfile`
- `printerSettings`: machine="Bambu Lab A1", nozzle 0.4mm, bed_shape "0x0,220x0,220x220,0x220", gcode_flavor="marlin2"
- `filamentSettings`: filament_diameter 1.75, nozzle_temp (PLA 220, PETG 240, ABS 250, TPU 220), bed_temp (PLA 60, PETG 80, ABS 100, TPU 60), filament_density from params.filament.density
- `modelSettings`: plate_layout centered, model_count 1
- `sliceSettings`: layer_height 0.2, infill_density "15%", infill_pattern "gyroid", wall_loops 3, brim_width 5, support "auto", bottom_shell_layers 3, top_shell_layers 4
- Returns typed objects matching Bambu Studio's expected JSON schema
- Material auto-adaptado de params.filament.material

**Tests:** Manual: verify JSON structure, open generated 3MF in Bambu Studio

---

### T59: Create `lib/cookie-cutter/threemfWriter.ts`

**What:** Generate .3mf ZIP package with geometry + metadata
**Where:** `src/lib/cookie-cutter/threemfWriter.ts` (new)
**Depends on:** -
**Reuses:** JSZip, three.js BufferGeometry
**Done when:**
- Exports `write3MF(mesh: THREE.Mesh, bambuProfile: BambuProfile): Promise<Blob>`
- Generates `[Content_Types].xml` with correct content types for 3D model + configs
- Generates `_rels/.rels` with package relationship
- Generates `3D/3dmodel.model` as 3MF XML (vertices, triangles, materials, object, build)
- Generates `Metadata/model_settings.config` from bambuProfile.modelSettings
- Generates `Metadata/slice_info.config` from bambuProfile.sliceSettings
- Generates `Metadata/filament_settings.json` from bambuProfile.filamentSettings
- Generates `Metadata/printer_settings.json` from bambuProfile.printerSettings
- Packages all into ZIP via JSZip
- Returns Blob with correct MIME type `application/vnd.ms-package.3dmanufacturing-3dmodel`

**Tests:** Manual: generate 3MF, verify ZIP structure, open in Bambu Studio

---

### T60: Update `lib/cookie-cutter/cutterExport.ts` (Bambu 3MF)

**What:** Add Bambu-specific 3MF export + update ExportPanel
**Where:** `src/lib/cookie-cutter/cutterExport.ts` (modify), `src/components/cookie-cutter/cutter/ExportPanel.tsx` (modify)
**Depends on:** T34, T43, T58, T59
**Done when:**
- `cutterExport.ts` exports `exportBambu3MF(mesh, params, filename): void`
- Calls `bambuProfile.generateBambuProfile(params, filamentMaterial)` then `threemfWriter.write3MF(mesh, profile)` then `file-saver.saveAs(blob, filename)`
- `ExportPanel.tsx` gains two 3MF buttons:
  - "Baixar 3MF (Bambu A1)" → cyan accent, calls exportBambu3MF
  - "Baixar 3MF" → gray outline, calls export3MF (legacy generic)

**Tests:** Manual: click "Baixar 3MF (Bambu A1)", open .3mf in Bambu Studio

---

### T61: Create `hooks/useUnits.ts`

**What:** Unit toggle hook for mm ↔ cm display
**Where:** `src/hooks/useUnits.ts` (new)
**Depends on:** -
**Done when:**
- Exports `useUnits()` returning `{ unit, toggle, format, parse, convert }`
- `unit: "mm" | "cm"` initialized from localStorage("cookie-cutter-units") || "mm"
- `toggle()` swaps unit and persists to localStorage
- `format(valueMm: number): string` — "15.0 mm" or "1,5 cm" (1 decimal em cm, sem decimal em mm)
- `parse(value: string): number` — always returns mm (handles both "15" in mm mode and "1.5" in cm mode)
- `convert(valueMm: number): number` — returns value in current unit (15 → 15 or 1.5)
- Uses Intl.NumberFormat for locale-aware decimal separators
- Unit label: "mm" or "cm"

**Tests:** Unit: toggle switches format output, localStorage persists, parse handles both modes

---

### T62: Create `lib/cookie-cutter/printerConfig.ts`

**What:** localStorage-based printer configuration CRUD
**Where:** `src/lib/cookie-cutter/printerConfig.ts` (new)
**Depends on:** -
**Done when:**
- Exports `SavedPrinter` interface: id, name, type, ip, accessCode
- Exports `loadPrinters(): SavedPrinter[]` from localStorage("cookie-cutter-printers")
- Exports `savePrinter(p: SavedPrinter): void` — upserts by id
- Exports `deletePrinter(id: string): void`
- Exports `defaultPrinterTypes: { id: string; label: string; buildVolume: string }[]`:
  - bambu-a1 (Bambu Lab A1), bambu-x1 (Bambu Lab X1/X1C), prusa-mk4 (Prusa MK4), ender3-v2 (Ender 3 V2), voron24 (Voron 2.4), custom
- Max 10 printers stored; warning if full
- Generates UUID for new printers

**Tests:** Unit: save 2 printers, reload, verify persistent; delete 1, verify gone

---

### T63: Create `cutter/PrinterSetup.tsx`

**What:** Modal to manage saved printer configurations
**Where:** `src/components/cookie-cutter/cutter/PrinterSetup.tsx` (new)
**Depends on:** T62
**Done when:**
- Modal accessible via "Configurar impressoras" button in ParameterPanel (below PrintProfileSelector)
- Lists saved printers: name, type icon, IP (truncated), edit/delete buttons
- "Adicionar impressora" button → form: nome (text), tipo (dropdown: A1/X1/Prusa/Ender/Voron/Custom), IP (text), access code (text)
- Edit → same form pre-filled
- Delete → confirmation dialog
- "Testar conexão" button → disabled, shows tooltip "Envio direto via WiFi: em breve (v2)"
- Empty state: "Nenhuma impressora configurada ainda"
- Close button
- Max 10 printers; show count (ex: "3/10")

**Tests:** Manual: open modal, add printer, edit name, delete, verify list updated

---

### T64: Create `common/UnitToggle.tsx`

**What:** Toggle switch between mm and cm
**Where:** `src/components/cookie-cutter/common/UnitToggle.tsx` (new)
**Depends on:** T61
**Done when:**
- Horizontal toggle button: "mm" and "cm" labels side by side
- Active unit highlighted with cyan background
- Click toggles → calls `useUnits().toggle()`
- Styled like the Single/Multi toggle in ImageTo3D.tsx
- Keyboard accessible (Tab + Enter)
- Positioned in page header, right side

**Tests:** Manual: click toggle, see sliders update labels

---

### T65: Update `cutter/ParameterPanel.tsx` (unit labels)**

**What:** Slider labels show values in current unit
**Where:** `src/components/cookie-cutter/cutter/ParameterPanel.tsx` (modify)
**Depends on:** T61
**Done when:**
- Each slider label uses `useUnits().format(valueMm)`
- Examples: "Altura: 25 mm" → "Altura: 2,5 cm" when cm
- Slider range stays in mm (e.g., 5-80 for height), but display label converts
- Millimeter labels (offset, minRadius, minPrintThickness) also convert
- No conversion for filament/cost (not dimensions)

**Tests:** Manual: toggle cm, verify all slider labels show correct cm values

---

### T66: Update `cutter/DimensionOverlay.tsx` (unit labels)**

**What:** 3D dimension labels show in current unit
**Where:** `src/components/cookie-cutter/cutter/DimensionOverlay.tsx` (modify)
**Depends on:** T61
**Done when:**
- Labels formatted via `useUnits().format(dimensionMm)`
- Examples: "80 mm" → "8,0 cm" when cm
- Bounding box labels (W, H, D) all convert
- Wall thickness annotation label converts
- Suffix always shown ("mm" or "cm" after value)

**Tests:** Manual: toggle cm, see dimension labels update in 3D view

## Dependency Graph (simplified)

```
T1 ── T2,T4 ── T7 ── T21
│
T5,T6 ── T7
│
T8,T9 ── T10 ── T12,T13 ── T14 ── T22 ── T23 ── T24
│           ├── T15 ── T16
│           ├── T17
│           ├── T18
│           ├── T19 (T1)
│           ├── T20
│           └── T21

T11 ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──

T25 ── T28,T29 ── T31 ── T35 ── T36,T37,T38,T39,T40,T41 ── T44 ── T45
T26,T27 ── T31           T42,T43
T30 ── T31
T32,T33,T34 ── T35
T26 ── T58 ── T60
T59 ── T60
T61 ── T64,T65,T66

T46 ── T47 ── T49 ── T50,T51,T52,T53 ── T55 ── T56
    └── T48 ── T49            T54 ── T55
T62 ── T63 ── T55

T55 ── T57
```

## Execution Plan

**Phase F1 — Editor 2D (T1-T24, ~2 semanas):**
- T1 (deps) first
- T2-T7 (lib modules) in parallel where possible
- T8-T10 (hooks) after T2-T7
- T11-T21 (components) after T10
- T22-T23 (page + route) after all components
- T24 (tests) throughout

**Phase F2 — 3D Pipeline (T25-T45 + T58-T61 + T64-T66, ~2.5 semanas):**
- T25-T30 (lib: offset, params, profiles, handles, ribs, embosse)
- T31 (cutterBuild orchestrator) after T25-T30
- T32-T34 (estimate, thumbnail, export)
- T35 (hook) after T31-T34
- T36-T43 (UI components) after T35
- T58 (bambuProfile) after T26
- T59 (threemfWriter) independent
- T60 (export update) after T34, T58, T59, T43
- T61 (useUnits) independent
- T64-T66 (unit UI) after T61
- T44 (page integration) after all
- T45 (tests) throughout

**Phase F3 — Projects (T46-T57 + T62-T63, ~1 semana):**
- T46-T48 (types + client + API)
- T49 (hook) after T47-T48
- T50-T54 (UI components) after T49
- T62 (printerConfig) independent
- T63 (PrinterSetup) after T62
- T55 (final integration) after all
- T56 (tests) throughout
- T57 (docs) after T55
