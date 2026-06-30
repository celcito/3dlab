# Cookie Cutter Maker — Architecture & Design

## High-Level Component Tree

```
App.tsx (Layout com NavRail)
└── CookieCutter.tsx                      (página principal, layout 3 painéis)
    ├── <header>                          (nome do projeto, salvar/duplicar/favoritar)
    ├── [LEFT] <EditorPanel>              (canvas SVG 2D + toolbar)
    │   ├── <Toolbar2D>                   (mover/escalar/rotacionar/espelhar/texto/undo/redo)
    │   ├── <PieceTabs>                   (abas de peças múltiplas)
    │   ├── <VectorCanvas>                (<svg> interativo com zoom/pan/grid/snap)
    │   │   ├── <ShapeRenderer>×N         (cada shape com <g transform>)
    │   │   ├── <SelectionLayer>          (bounding box + 8 handles + rotate gizmo)
    │   │   └── <GridOverlay>             (grid configurável com snap)
    │   ├── <ShapeLibrary>                (sidebar colapsável: círculo, estrela, ícones)
    │   ├── <LayerPanel>                  (lista z-order: visibilidade, rename, delete)
    │   ├── <HistoryPanel>                (visualizador do undo stack)
    │   ├── <TextInputDialog>             (modal: texto + font + size → curvas)
    │   └── <FixReportDialog>             (modal: preview side-by-side antes/depois)
    └── [RIGHT] <Sidebar>
        ├── <ParameterPanel>              (01. Parâmetros: sliders altura, espessuras, offset, tolerância)
        │   ├── <PrintProfileSelector>    (dropdown de perfil: Ender3, Prusa, custom...)
        │   ├── <HandlesControls>         (toggle alças, threshold, tipo loop/tab, count)
        │   ├── <EmbossePanel>            (toggle emboss/deboss, depth, seletor de sub-shape)
        │   └── <EstimatePanel>           (readouts: tempo, peso, filamento, custo)
        ├── <ExportPanel>                 (STL/OBJ/3MF/GLB/ZIP/SVG individuais e ZIP)
        └── <ProjectList>                 (F3: galeria de projetos salvos)
    └── [CENTER] <Preview3D>              (Canvas R3F com cortador 3D)
        ├── <OrbitControls>
        ├── <Grid>
        ├── <Piece3D>×N                   (grid de peças no plano XY)
        │   ├── <WallMesh>                (parede extrudada)
        │   ├── <BladeMesh>               (lâmina inferior)
        │   ├── <BaseMesh>                (base)
        │   ├── <HandleMesh>×N            (alças)
        │   └── <RibMesh>×N               (reforços)
        ├── <EmbosseIndicator>            (destaque dos carimbos na lâmina)
        └── <DimensionOverlay>            (readouts: largura × altura × profundidade, área)
```

## State Management

Estado centralizado em hooks dedicados. Sem Zustand/Redux (mantém simplicidade do projeto).

### `useVectorEditor()` — Editor 2D

```ts
interface VectorEditorState {
  // Cena multi-peça
  pieces: VectorPiece[];
  activePieceId: string;

  // Viewport
  view: { panX: number; panY: number; zoom: number };
  grid: { enabled: boolean; size: number; snap: boolean; snapTolerance: number };

  // Seleção
  selection: Set<string>;
  mode: "select" | "draw" | "text" | "pan" | "zoom" | "pen";

  // Fix report (populado ao importar SVG com problemas)
  fixReport: FixReport | null;
  originalScene: VectorScene | null;  // backup pré-fix

  // UI
  showFixDialog: boolean;
  showTextDialog: boolean;
  showShapeLibrary: boolean;
}

interface VectorPiece {
  id: string;
  name: string;
  shapes: Shape2D[];
  embosseShapes: Shape2D[];
  embosseMode: "emboss" | "deboss";
  embosseDepth: number;
}

interface Shape2D {
  id: string;
  kind: "path" | "text" | "icon";
  d: string;                    // SVG path data
  transform: {
    tx: number; ty: number;
    sx: number; sy: number;
    rotation: number;
    mirrorX: boolean; mirrorY: boolean;
  };
  fill: "evenodd" | "nonzero";
  metadata: {
    name?: string;
    fontFamily?: string;
    iconSource?: string;
    text?: string;
  };
}

interface FixReport {
  openPaths: number;
  selfIntersections: number;
  duplicatePoints: number;
  windingFixed: number;
  totalFixes: number;
  fixedScene: VectorScene;
}
```

### `useCookieCutter()` — Pipeline 3D

```ts
interface CookieCutterState {
  // Parâmetros por peça
  pieceParams: Map<string, CutterParams>;

  // Resultados 3D por peça
  pieceResults: Map<string, CutterResult>;

  // Agregado
  combinedParams: CutterParams;    // params da peça ativa (para painel)
  combinedEstimate: PrintEstimate; // soma de todas as peças

  // UI
  generating: boolean;
  wireframe: boolean;
  showDimensions: boolean;
  activePrintProfile: string;
  customProfiles: PrintProfile[];  // localStorage
}

interface CutterParams {
  height: number;
  wallThickness: number;
  bladeThickness: number;
  baseThickness: number;
  supportEdgeThickness: number;
  cornerRadius: number;
  innerOffset: number;
  outerOffset: number;
  minRadius: number;
  minPrintThickness: number;
  tolerance: number;
  handles: {
    enabled: boolean;
    autoThreshold: number;
    type: "loop" | "tab";
    width: number;
    thickness: number;
    count: 1 | 2;
  };
  reinforcements: {
    auto: boolean;
    spacing: number;
    thickness: number;
  };
  printProfile: string;
  filament: {
    material: "PLA" | "PETG" | "ABS" | "TPU";
    density: number;
    costPerKg: number;
  };
}

interface PrintProfile {
  id: string;
  name: string;
  brand: string;
  buildVolume: { x: number; y: number; z: number };
  nozzleDiameter: number;
  minWallThickness: number;
  minBladeThickness: number;
  minBaseThickness: number;
  minRadius: number;
  maxLayerHeight: number;
  isCustom: boolean;
}

interface CutterResult {
  wall: THREE.Mesh;
  blade: THREE.Mesh;
  base: THREE.Mesh;
  ribs: THREE.Mesh[];
  handles: THREE.Mesh[];
  embosseMeshes: THREE.Mesh[];
  combined: THREE.Mesh;
  stats: {
    outerArea: number;
    innerArea: number;
    triangleCount: number;
    bbox: { w: number; h: number; d: number };
    perimeter: number;
  };
  estimate: PrintEstimate;
}

interface PrintEstimate {
  volumeCm3: number;
  weightG: number;
  filamentLengthM: number;
  printTimeH: number;
  costBRL: number;
}
```

### `useProjects()` — Persistência

```ts
interface ProjectsState {
  list: ProjectMeta[];
  current: Project | null;
  loading: boolean;
  saving: boolean;
}

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
  currentVersion: number;
  versionCount: number;
  thumbnail64: string;  // base64 PNG 64×64
  pieceCount: number;
  totalTriangles: number;
  estimate: PrintEstimate;
}

interface Project {
  id: string;
  name: string;
  favorite: boolean;
  currentVersion: number;
  scene: VectorScene;
  params: Map<string, CutterParams>;
  printProfile: string;
  versions: ProjectVersionMeta[];
}

interface ProjectVersionMeta {
  version: number;
  createdAt: number;
  thumbnail64: string;
}
```

## Data Flow

### Load SVG (File Upload)

```
1. User drops .svg on VectorCanvas dropzone
2. useVectorEditor.loadSvgFromFile(file)
3. svgImport.parseFile(file) → VectorScene
4. svgValidator.validate(scene) → FixReport | null
5. IF FixReport.totalFixes > 0:
   a. setState({ fixReport, originalScene: scene, showFixDialog: true })
   b. User reviews in FixReportDialog (side-by-side preview)
   c. User confirms → apply fixed scene
   d. User cancels → apply original scene (no fixes)
6. setState({ pieces: scene.pieces, activePieceId: scene.pieces[0].id })
7. CookieCutter re-renders VectorCanvas with new shapes
```

### Draw Shape (Library / Manual)

```
1. User clicks "Star" in ShapeLibrary
2. ShapeLibrary generates star Path2D → Shape2D
3. useVectorEditor.addShapeToPiece(activePieceId, shape)
4. Shape appended to pieces[activeIdx].shapes[]
5. VectorCanvas re-renders via <ShapeRenderer>
6. User drags/resizes/rotates via SelectionLayer handles
7. onTransform updates shape.transform (tx, ty, sx, sy, rotation)
```

### Add Text

```
1. User clicks "T" in Toolbar2D
2. TextInputDialog opens (input + font picker + size)
3. User types "COOKIE", selects "Arial", clicks "Convert to curves"
4. opentype.js: font.getPath("COOKIE", 0, 0, 48)
5. Path commands → SVG path d-string
6. Shape2D created with kind="text"
7. Added to active piece
```

### Build 3D Cutter (debounced pipeline)

```
1. useCookieCutter watches [pieces, params, activePieceId] with debounce 300ms
2. For each VectorPiece:
   a. svgImport.scene.toShapes(piece.shapes) → THREE.Shape[]
   b. svgAutoFix.fixShapes(shapes) → corrige self-intersections, fecha paths
   c. polygonOffset.outer(shape, params.outerOffset + params.tolerance) → outerShape
   d. polygonOffset.inner(outerShape, -(params.wallThickness + params.innerOffset)) → innerShape
   e. cutterBuild.buildWall(outerShape, innerShape, params) → wallMesh
   f. cutterBuild.buildBlade(outerShape, params) → bladeMesh
   g. cutterBuild.buildBase(bbox, params) → baseMesh
   h. IF params.handles.enabled: handles.generate(fixedShape, params) → handleMeshes
   i. IF params.reinforcements.auto: reinforcements.generate(outerShape, innerShape, params) → ribMeshes
   j. IF piece.embosseShapes.length > 0: embosse.apply(bladeMesh, piece, params) → bladeMesh (modified)
   k. booleanCut.union([wall, blade, base, ...ribs, ...handles]) → combined
   l. printEstimate.calculate(combined, params) → estimate
3. For ALL pieces combined:
   a. piecesToGrid(pieceResults, spacing) → positions
   b. aggregateEstimates(all results) → combinedEstimate
4. Preview3D re-renders with grid layout
```

### Save Project

```
1. User clicks "Salvar" in ProjectHeader
2. thumbnail.renderThumbnail(combined, 256) → base64 PNG
3. thumbnail.renderThumbnail(combined, 64) → base64 PNG
4. POST /api/projects/:id/versions with body:
   { params, scene, thumbnail256, thumbnail64 }
5. Server writes projects/{id}/versions/{n}.json + projects/{id}/thumbnail.png
6. PUT /api/projects/:id with updated metadata (name, updatedAt)
7. Toast: "Projeto salvo (versão {n})"
```

### Export STL/OBJ/3MF/GLB

```
1. User clicks "Baixar STL (todas)" in ExportPanel
2. For each piece result:
   a. STLExporter.parse(combined, { binary: true })
3. JSZip: create zip with "Piece_NN_Name.stl" entries
4. file-saver: trigger browser download "cookie-cutters.zip"
5. For individual export: STLExporter.parse(pieceResult.combined) → download single .stl
```

## Key Algorithms

### Polygon Offset (Miter) — `polygonOffset.ts`

```ts
function offsetPolygon(points: Vec2[], distance: number, miterLimit = 8): Vec2[] {
  // 1. Determinar orientação (CW/CCW) via signed area
  // 2. Para cada aresta (p_i, p_{i+1}):
  //    a. edge = p_{i+1} - p_i; normal = perpendicular(edge).normalize()
  //    b. Inverter normal se orientação for CCW e distance > 0
  // 3. Para cada vértice p_i com arestas adjacentes a, b:
  //    a. bisector = (normal_a + normal_b).normalize()
  //    b. angle = angle_between(edge_a, edge_b) / 2
  //    c. offset_dist = distance / cos(angle)
  //    d. IF |offset_dist| > miterLimit * |distance|: clamp (bevel)
  //    e. new_p_i = p_i + bisector * offset_dist
  // 4. Retornar new_points
}
```

### Smart Handle Generation — `handles.ts`

```ts
function generateHandles(shape: Shape, params: CutterParams): Shape[] {
  const bbox = shape.getBoundingBox();
  const maxDim = Math.max(bbox.w, bbox.h);
  if (!params.handles.enabled || maxDim < params.handles.autoThreshold) return [];

  // 1. Encontrar o lado mais reto da bounding box (maior segmento reto)
  // 2. Criar retângulo (loop) ou barra (tab) centrado nesse lado, externo à parede
  // 3. Posicionar alça: lado_top = (bbox.cx, bbox.ty); lado_bottom = (bbox.cx, bbox.by)
  // 4. Se count=2, espelhar para o lado oposto
  // 5. Retornar Shape[] para ExtrudeGeometry
}
```

### Auto-Reinforcements — `reinforcements.ts`

```ts
function generateRibs(outer: Shape, inner: Shape, height: number, params: CutterParams): Shape[] {
  if (!params.reinforcements.auto) return [];
  const perimeter = estimateShapePerimeter(outer);
  const count = Math.max(0, Math.floor(perimeter / params.reinforcements.spacing));
  if (count === 0) return [];

  // 1. Samplear N pontos uniformemente no perímetro do shape externo
  // 2. Para cada ponto, encontrar o ponto correspondente no shape interno (raycast radial)
  // 3. Criar retângulo ligando os dois pontos com thickness × wallThickness
  // 4. Retornar Shape[] para ExtrudeGeometry
  return ribsAsShapes;
}
```

### Emboss/Deboss — `embosse.ts`

```ts
function applyEmbosser(piece: VectorPiece, bladeGeometry: BufferGeometry, params: CutterParams): Mesh {
  if (piece.embosseShapes.length === 0) return bladeMesh;

  // 1. Para cada sub-shape:
  //    a. Converter Shape2D → THREE.Shape
  //    b. Posicionar na face inferior da lâmina (Z=0 plan)
  //    c. ExtrudeGeometry(shape, { depth: piece.embosseDepth, bevelEnabled: false })
  // 2. Criar Brush da blade e do embosse
  // 3. CSG: piece.embosseMode === "deboss" ? SUBTRACTION : ADDITION
  // 4. Retornar mesh resultante
}
```

### SVG Auto-Fix — `svgAutoFix.ts`

```ts
function autoFix(scene: VectorScene): { fixedScene: VectorScene; report: FixReport } {
  const report: FixReport = { openPaths: 0, selfIntersections: 0, duplicatePoints: 0, windingFixed: 0, totalFixes: 0, fixedScene: null as any };
  const fixedPieces = [];

  for (const piece of scene.pieces) {
    const fixedShapes = [];
    for (const shape of piece.shapes) {
      const pts = parsePathD(shape.d);

      // 1. Dedup points (tolerance 0.01mm)
      const deduped = deduplicatePoints(pts, 0.01);
      if (deduped.length < pts.length) {
        report.duplicatePoints += pts.length - deduped.length;
      }

      // 2. Close open paths
      if (!isClosed(deduped)) {
        deduped.push(deduped[0].clone());
        report.openPaths++;
      }

      // 3. Fix self-intersections via polygon-clipping.union
      const polygon = deduped.map(p => [p.x, p.y] as [number, number]);
      const fixed = union([polygon], [polygon]);
      if (fixed.length !== 1 || !polygonsEqual(fixed[0], polygon)) {
        report.selfIntersections++;
      }

      // 4. Normalize winding
      if (signedArea(fixed[0]) < 0) {
        fixed[0].reverse();
        report.windingFixed++;
      }

      shape.d = pathDFromPoints(fixed[0]);
      fixedShapes.push(shape);
    }
    fixedPieces.push({ ...piece, shapes: fixedShapes });
  }

  report.totalFixes = report.openPaths + report.selfIntersections + report.duplicatePoints + report.windingFixed;
  report.fixedScene = { pieces: fixedPieces };

  return { fixedScene: report.fixedScene, report };
}
```

### Print Estimate — `printEstimate.ts`

```ts
function calculateEstimate(mesh: THREE.Mesh, params: CutterParams, flowRateCm3h = 4): PrintEstimate {
  // Signed tetrahedra volume
  const volumeMm3 = computeVolume(mesh);  // soma signed volume de cada triângulo relativo à origem
  const volumeCm3 = volumeMm3 / 1000;

  const density = params.filament.density; // g/cm³ (PLA = 1.24)
  const weightG = volumeCm3 * density;

  // Filamento 1.75mm diâmetro
  const filamentRadiusCm = 0.175 / 2;
  const filamentAreaCm2 = Math.PI * filamentRadiusCm * filamentRadiusCm;
  const filamentLengthCm = volumeCm3 / filamentAreaCm2;
  const filamentLengthM = filamentLengthCm / 100;

  const timeH = volumeCm3 / flowRateCm3h;

  const costBRL = (weightG / 1000) * params.filament.costPerKg;

  // Add 20% waste/support margin
  return {
    volumeCm3: +volumeCm3.toFixed(2),
    weightG: +(weightG * 1.2).toFixed(1),
    filamentLengthM: +(filamentLengthM * 1.2).toFixed(2),
    printTimeH: +(timeH * 1.2).toFixed(2),
    costBRL: +(costBRL * 1.2).toFixed(2),
  };
}
```

### Thumbnail Render — `thumbnail.ts`

```ts
async function renderThumbnail(mesh: THREE.Mesh, size = 256): Promise<string> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setSize(size, size);
  renderer.setClearColor(0x080808, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

  // Isometric view
  const bbox = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const maxDim = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z);
  const dist = maxDim * 1.5;
  camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.8);
  camera.lookAt(center);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);

  // Mesh (clone to avoid mutation)
  const cloned = mesh.clone();
  cloned.position.set(0, 0, 0);
  scene.add(cloned);

  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL("image/png");
  renderer.dispose();
  return dataUrl;
}
```

## File Structure (all new/modified)

### New Files

```
src/
  pages/
    CookieCutter.tsx                                          [page, ~600 linhas]

  components/cookie-cutter/
    editor/
      VectorCanvas.tsx                                        [SVG interativo, zoom/pan/grid]
      ShapeRenderer.tsx                                       [renderiza path com <g transform>]
      SelectionLayer.tsx                                      [bounding box + 8 handles + rotate]
      Toolbar2D.tsx                                           [mover/escalar/rotacionar/espelhar/texto]
      ShapeLibrary.tsx                                        [galeria de formas + ícones]
      LayerPanel.tsx                                          [lista z-order]
      HistoryPanel.tsx                                        [undo stack visual]
      TextInputDialog.tsx                                     [modal texto + font picker]
      iconLoader.ts                                           [importa ícones SVG]
      PieceTabs.tsx                                           [abas de peças múltiplas]
      FixReportDialog.tsx                                     [preview side-by-side + confirmar]

    cutter/
      ParameterPanel.tsx                                      [sliders: altura, espessuras, offset]
      Preview3D.tsx                                           [R3F canvas com cortador + grid peças]
      DimensionOverlay.tsx                                    [readouts: dims + área + estimate]
      ExportPanel.tsx                                         [STL/OBJ/3MF/GLB/SVG/ZIP]
      PrintProfileSelector.tsx                                [dropdown perfis 6 + custom]
      EstimatePanel.tsx                                       [tempo, peso, filamento, custo]
      HandlesControls.tsx                                     [toggle + threshold + tipo]
      EmbossePanel.tsx                                        [toggle emboss/deboss + depth]

    projects/
      ProjectList.tsx                                         [galeria de cards]
      ProjectCard.tsx                                         [miniatura + nome + data + ações]
      ProjectHeader.tsx                                       [salvar/duplicar/excluir/favoritar]
      VersionHistory.tsx                                      [modal timeline de versões]
      PrintProfileManager.tsx                                 [criar/editar/deletar perfil custom]

  hooks/
    useVectorEditor.ts                                        [estado editor 2D + multi-peça + undo]
    useCookieCutter.ts                                        [pipeline 3D + params + estimate]
    useUndoRedo.ts                                            [genérico, reutilizável]
    useProjects.ts                                            [fetch/save/delete/list]
    useSnap.ts                                                [snap-to-grid + snap-to-vertex]

  lib/cookie-cutter/
    svgImport.ts                                              [File/URL → VectorScene]
    svgExport.ts                                              [VectorScene → SVG string]
    svgValidator.ts                                           [detecta problemas]
    svgAutoFix.ts                                             [corrige open paths, self-intersections, winding]
    polygonOps.ts                                             [wrapper polygon-clipping: union/diff/intersect]
    polygonOffset.ts                                          [miter offset 2D: inner/outer]
    shape2D.ts                                                [Scene ↔ THREE.Shape; fix open paths]
    handles.ts                                                [gerador de alças automáticas]
    reinforcements.ts                                         [gerador de ribs estruturais]
    embosse.ts                                                [extrusão + CSG para emboss/deboss]
    cutterBuild.ts                                            [orquestra: wall+blade+base+ribs+handles+embosse+union]
    cutterParams.ts                                           [defaults, validação, applyProfile]
    printProfiles.ts                                          [tipos + 6 perfis padrão]
    printEstimate.ts                                          [fórmulas: volume, peso, filamento, tempo, custo]
    thumbnail.ts                                              [render → PNG base64]
    cutterExport.ts                                           [STL/OBJ/3MF/GLB/ZIP via STLExporter+JSZip]

  lib/
    projects.ts                                               [cliente REST /api/projects/*]
    projectStorage.ts                                         [types: Project, ProjectVersion, ProjectMeta]

  server.ts                                                   [modificado: +/api/projects/*]
  package.json                                                [modificado: +opentype.js, +polygon-clipping]
```

### Modified Files

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Adicionar NavItem `CookieCutter` (ícone `Cookie`) + rota `/cookie-cutter` |
| `server.ts` | Adicionar `GET/POST/PUT/DELETE /api/projects/*` + `/api/projects/:id/versions/*` + thumb endpoint |
| `package.json` | `+opentype.js@^1.3.4`, `+polygon-clipping@^1.0.0`, `+@types/opentype.js@^1.3.2` |

## Performance Budget

| Operation | Target | Notes |
|---|---|---|
| SVG import + auto-fix (200 paths) | < 500ms | polygon-clipping union é O(n log n) |
| Polygon offset (500 vertices) | < 100ms | Miter O(n) |
| Build 3D cutter (1 piece, 200 segmentos) | < 2s | ExtrudeGeometry + CSG union |
| Build 3D cutter (4 pieces, 200 segmentos) | < 5s | 4× operations + grid layout |
| Print estimate | < 10ms | Volume tetrahedra O(n) |
| Thumbnail render (256px) | < 200ms | Offscreen WebGL |
| Export STL (1 piece, 50k tris) | < 200ms | STLExporter binário |
| Export ZIP (4 pieces) | < 1s | JSZip + file-saver |

## Error Handling

| Scenario | Handling |
|---|---|
| SVG inválido (XML malformed) | Toast "SVG inválido: erro de parse" |
| SVG com >500 paths | Warning "SVG complexo; preview 3D pode levar alguns segundos" |
| Fonte TTF >5MB | Aviso + abort; usar fonte system default |
| Offset 2D falha em polígono extremamente côncavo | Fallback: scale uniforme com aviso "Offset aproximado aplicado" |
| CSG throws em geometria não-manifold | Mostrar erro + sugestão: "Tente ajustar a espessura da parede ou simplificar o desenho" |
| API de projetos retorna 500 | Toast + auto-retry 1×; on fail: "Não foi possível salvar; tente novamente" |
| localStorage cheio (perfis custom) | Aviso: "Limite de perfis custom atingido; remova um perfil existente" |
| WebGL indisponível (thumbnail) | Placeholder cinza com ícone |
| Multi-peça com 8+ peças | Warning; grid 3 colunas; scroll adicional |

## Dependency Additions

```json
{
  "dependencies": {
    "opentype.js": "^1.3.4",
    "polygon-clipping": "^1.0.0"
  },
  "devDependencies": {
    "@types/opentype.js": "^1.3.2"
  }
}
```

Nenhuma outra dependência nova. Todo o resto reusa infraestrutura existente (three, three-bvh-csg, three-stdlib, jszip, file-saver, STLExporter, React 19, Tailwind v4, lucide-react).

---

## Unit Toggle (mm ↔ cm)

### `useUnits()` Hook

```ts
interface UnitsState {
  unit: "mm" | "cm";
  toggle: () => void;
  format: (valueMm: number) => string;   // "15.0 mm" ou "1,5 cm"
  parse: (input: string) => number;       // sempre retorna mm
  convert: (valueMm: number) => number;   // mm → current unit
}

function useUnits(): UnitsState {
  // Reads localStorage("cookie-cutter-units"), default "mm"
  // Toggle persists to localStorage
  // format(15) → unit=mm: "15.0 mm" / unit=cm: "1,5 cm"
  // parse("1.5") → unit=mm: 1.5 / unit=cm: 15
}
```

### Integration Points

- `ParameterPanel.tsx` — cada slider label: `useUnits().format(value)`
- `DimensionOverlay.tsx` — labels flutuantes no 3D
- `CookieCutter.tsx` header — `<UnitToggle />` (switch mm/cm)
- `EstimatePanel.tsx` — não afetado (g/m/h/custo são invariantes)
- Storage interno (`CutterParams`) sempre em mm

### `<UnitToggle />`

Switch com duas labels: "mm" e "cm". Posicionado no header da página, ao lado do nome do projeto. Estilo: alternador estilo toggle button (como Single/Multi no ImageTo3D).

---

## 3MF Export com Perfil Bambu Lab A1

### 3MF Package Structure (ZIP)

```
{name}.3mf (ZIP container)
├── [Content_Types].xml
├── Metadata/
│   ├── model_settings.config      ← perfil do Bambu Studio
│   ├── slice_info.config          ← layer, infill, walls, brim
│   ├── filament_settings.json     ← PLA 1.75mm, temps
│   └── printer_settings.json      ← A1 não-AMS, nozzle 0.4mm
├── 3D/
│   └── 3dmodel.model              ← geometria (XML 3MF)
└── _rels/
    └── .rels
```

### `bambuProfile.ts`

```ts
function generateBambuProfile(params: CutterParams): {
  printerSettings: object;    // A1: 220x220x256, nozzle 0.4mm, bed temp 60°C
  filamentSettings: object;   // PLA: 1.75mm, 220°C, flow 0.95, density 1.24
  modelSettings: object;      // plate layout: center, no scaling
  sliceSettings: object;      // layer 0.2mm, infill 15% gyroid, walls 3, brim 5mm
}
```

### `threemfWriter.ts`

```ts
function write3MF(mesh: THREE.Mesh, filename: string, bambuProfile: object): Promise<Blob> {
  // 1. Convert mesh → 3MF XML geometry (triangles, vertices)
  // 2. Generate [Content_Types].xml
  // 3. Generate Metadata/*.config and *.json from bambuProfile
  // 4. Generate _rels/.rels
  // 5. Package as ZIP via JSZip
  // 6. Return Blob for file-saver download
}
```

### Data Flow: Export 3MF Bambu A1

```
1. User clicks "Baixar 3MF (Bambu A1)" in ExportPanel
2. exportBambu3MF(cutterResult.combined, params, "cortador.3mf")
3. bambuProfile.generateBambuProfile(params) → { printer, filament, model, slice }
4. threemfWriter.write3MF(mesh, filename, bambuProfile)
5. JSZip packages all XML/JSON → Blob
6. file-saver triggers download
7. User opens in Bambu Studio → perfil A1 + PLA já aplicados
```

---

## Printer Config (infra para v2)

### `printerConfig.ts`

```ts
interface SavedPrinter {
  id: string;
  name: string;
  type: "bambu-a1" | "bambu-x1" | "prusa-mk4" | "ender3-v2" | "custom";
  ip: string;          // para WiFi (v2)
  accessCode: string;  // para MQTT (v2)
}

function loadPrinters(): SavedPrinter[]    // localStorage
function savePrinter(p: SavedPrinter): void
function deletePrinter(id: string): void
```

### `<PrinterSetup />`

Modal acessível via botão "Configurar impressoras" no `ParameterPanel` (linha do PrintProfileSelector). Lista impressoras salvas com editar/deletar. Formulário: nome, tipo (dropdown), IP, access code. Botão "Testar conexão" desabilitado no v1 (placeholder: "em breve").

---

## File Structure Update

```
src/lib/cookie-cutter/
├── threemfWriter.ts                 [NEW — gera pacote 3MF+ZIP]
├── bambuProfile.ts                  [NEW — JSONs de perfil para A1]
├── printerConfig.ts                 [NEW — localStorage printer configs]

src/components/cookie-cutter/
├── common/
│   └── UnitToggle.tsx               [NEW — switch mm/cm]
├── cutter/
│   └── PrinterSetup.tsx             [NEW — modal gerenciar impressoras]

src/hooks/
└── useUnits.ts                      [NEW — mm/cm toggle + format/parse]
