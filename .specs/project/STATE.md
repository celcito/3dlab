# State

**Last Updated:** 2026-06-30
**Current Work:** M4 Cookie Cutter Maker — **COMPLETE**. All 66 tasks across 3 phases (F1: Editor 2D, F2: Pipeline 3D, F3: Projects) implemented. `npm run lint` and `npm run build` pass clean.

**Next:** TBD — F3.4 Text-to-3D or new milestone.

---

## Recent Decisions (Last 60 days)

### AD-001: Decimation runs client-side (2026-06-29)

**Decision:** Usar `SimplifyModifier` (three.js examples) no navegador.
**Reason:** Round-trip zero, instantâneo, sem upload. Cobre 90% dos casos reais (até ~500k triângulos).
**Trade-off:** Acima de ~1M triângulos o browser pode engasgar; sem fallback server-side na v1.
**Impact:** F1.2 fica self-contained no front; F2.2 adicionará fallback Python depois.

### AD-002: Dowel modelado como cilindro com CSG union (2026-06-29)

**Decision:** Pino é um `CylinderGeometry` real que sofre CSG ADDITION na peça base e SUBTRACTION na oposta.
**Reason:** Fiel ao vídeo — o pino de fato altera a geometria das duas peças (uma fica com cilindro, outra com furo).
**Trade-off:** Mais complexo que "pino decorativo"; exige CSG rodar 2x a mais.
**Impact:** F1.6 depende do mesmo pipeline CSG de F1.5.

### AD-003: Mantém demo cube e TripoSR no Viewer3D (2026-06-29)

**Decision:** Upload local é uma terceira via; demo cube e `?model=jobId` continuam.
**Reason:** Não quebra fluxos existentes; usuário ainda pode testar sem arquivo ou usar TripoSR.
**Trade-off:** Ligeira complexidade na UI (3 modos de origem).
**Impact:** F1.1 unifica as 3 fontes atrás de uma abstração `MeshSource`.

### AD-004: JSZip + file-saver para "Baixar todas" (2026-06-29)

**Decision:** Adicionar `jszip` + `file-saver` como dependências.
**Reason:** Padrão da indústria, ~30KB gzipped, suporta STL binário.
**Trade-off:** +2 deps.
**Impact:** F1.7 implementa `exportAllZip(meshes)`.

### AD-005: CSG opera sobre `Brush` (three-bvh-csg), não BufferGeometry cru (2026-06-29)

**Decision:** Sempre embrulhar geometria em `new Brush(geometry)` antes de passar para `Evaluator`.
**Reason:** API do `three-bvh-csg` exige isso; geometria raw não compila.
**Trade-off:** Pequeno boilerplate em cada operação.
**Impact:** Wrapper `src/lib/booleanCut.ts` isola essa complexidade.

---

## Active Blockers

_Nenhum no momento._

---

## Lessons Learned

### L-001: three-bvh-csg exige geometria indexed e limpa (2026-06-29)

**Context:** Pesquisando uso da lib no `node_modules/three-bvh-csg/src/index.d.ts`.
**Problem:** CSG falha silenciosamente ou produz resultado degenerado se a geometria tiver NaN, vertices não-merged, ou não for indexed.
**Solution:** Sempre chamar `BufferGeometryUtils.mergeVertices()` e validar `!isFinite()` antes de criar o `Brush`.
**Prevents:** Bugs intermitentes difíceis de debugar em produção.

### L-002: STLExporter já estava importado mas nunca usado (2026-06-29)

**Context:** `Viewer3D.tsx:9` importa STLExporter sem chamá-lo.
**Problem:** Indica que a feature de download chegou a ser esboçada mas não completada.
**Solution:** F1.7 reaproveita o import existente — basta ligar na UI.
**Prevents:** Refactor desnecessário; mantém continuidade visual do código.

### L-003: three-bvh-csg exige `uv` attribute em todos os Brushes (2026-06-29)

**Context:** Primeiro `evaluator.evaluate()` em produção crashou com "Attribute uv not available on geometry."
**Problem:** A lib precisa de UVs para interpolar atributos entre faces cortadas, mesmo que não usemos texturas.
**Solution:** Em `lib/booleanCut.ts:makeBrush()`, sempre criar UV zerado (`Float32Array(count*2)`) se `!g.attributes.uv`.
**Prevents:** CSG throws em geometrias sem UV (ex: STL bruto, BoxGeometry default).

### L-004: SimplifyModifier.modify usa vertex count, não triangle count (2026-06-29)

**Context:** Decimation com `factor=0.5` em BoxGeometry 1536 tris produziu 78 tris (não 768).
**Problem:** A API do `SimplifyModifier.modify(geometry, count)` espera `count` como número de vértices, não triângulos.
**Solution:** Em `lib/decimate.ts`, calcular `targetVerts = floor(targetTris / 2)` antes de chamar o modifier. Relação: `vertexCount ≈ triangleCount / 2` para geometria indexed típica.
**Prevents:** Testes falhando e decimação muito mais agressiva que o usuário esperava.

### L-005: File-saver 2.0.7 não existe; última é 2.0.5 (2026-06-29)

**Context:** `npm install file-saver@^2.0.7` falhou com ETARGET.
**Problem:** Documentação desatualizada ou typo meu.
**Solution:** Usar `file-saver@^2.0.5` (última versão estável).
**Prevents:** Install failure em CI.

### L-006: Sanitização de UV é defensiva em dobro (2026-06-29)

**Context:** M1 polish P1 — `three-bvh-csg` falha com "Attribute uv not available" em geometrias sem UV.
**Problem:** GLBs vindos de fontes externas frequentemente não têm UV; STL nunca tem.
**Solution:** Adicionar `ensureUvAttribute(geometry)` em `lib/loaders.ts:sanitizeGeometry()`. CSG `makeBrush` também adiciona UV como safety net. Belt-and-suspenders.
**Prevents:** CSG crash em produção quando usuário sobe mesh sem UV.

### L-007: Try/catch em torno de `evaluator.evaluate` é essencial (2026-06-29)

**Context:** M1 polish P2 — primeira execução com malha complexa jogou erro genérico.
**Problem:** three-bvh-csg lança `Error` com mensagem curta sobre geometria não-manifold, sem contexto suficiente.
**Solution:** Envolver `evaluator.evaluate()` em try/catch com mensagem expandida: "Operação CSG falhou: <msg>. A geometria pode ser não-manifold ou ter faces degeneradas. Tente Preencher antes de cortar ou decimá-la antes."
**Prevents:** UX ruim quando usuário não entende por que o corte falhou.

### L-008: Snapshot reducer é mais simples que command pattern (2026-06-29)

**Context:** M2 F2.3 Undo/Redo — precisava decidir entre undo-by-command vs undo-by-snapshot.
**Problem:** Command pattern (guardar cada action reversa) é mais memory-efficient mas exige implementar `inverse(action, prevState)` para cada action. Snapshot é mais memory-heavy mas trivial de implementar.
**Solution:** Snapshot reducer com `extractEditable()` que captura apenas o slice editável (`originalGeometry, currentGeometry, quality, selectedFaces, pieces, source, sourceLabel`). Cap de 20 entries evita memory blow-up.
**Prevents:** Over-engineering. Snapshot é OK para M2; se ficar lento com geometries grandes, considerar diff-based (M3+).

### L-009: `useReducer` aceita reducer composto sem mudança na API (2026-06-29)

**Context:** M2 F2.3 — queria adicionar history tracking ao reducer existente sem reescrever.
**Problem:** Pensava que precisaria criar um novo hook ou wrappar o estado em um objeto maior.
**Solution:** `useReducer((b, action) => undoReducer(reducer, b.history, b.state, action), {state: initial, history: initialHistory})`. O bundle `{state, history}` é opaco para o resto do código.
**Prevents:** Refactor desnecessário. Mantém actions e selectors existentes.

### L-010: Multi-cut exige extrair piece de volta para local space (2026-06-29)

**Context:** M2 F2.4 — usuário queria cortar uma peça já cortada (fatiamento real de slicer).
**Problem:** Piece no `state.pieces` está em world space com offset visual (X+spacing). Para re-cortar, precisa estar em local space (origem).
**Solution:** `editPiece(id)` aplica `mesh.matrixWorld.invert()` à geometry antes de setar como `currentGeometry`. Resultado: peça volta para origem, pronta para nova seleção+corte.
**Prevents:** Coordenadas erradas no segundo corte.

### L-011: Layout horizontal é melhor que vertical para múltiplas peças (2026-06-29)

**Context:** M2 F2.4 — peças ficavam em (0, ±1.2, 0) após o primeiro corte, vertical.
**Problem:** Com 3+ peças, layout vertical empilhado fica apertado e difícil de selecionar.
**Solution:** Layout horizontal row com spacing=3.0: peça N em `(N-1)*3 - (total-1)*1.5, 0, 0)`. Câmera auto-ajusta via CameraFitter.
**Prevents:** UX ruim com muitas peças. CameraFitter já existia (F1.5).

### L-012: Remover faces degeneradas antes do CSG evita erros obscuros (2026-06-29)

**Context:** M2 F2.1 — três-bvh-csg quebra silenciosamente com "Attribute uv not available" quando alguma face tem área zero (colinear vertices, triângulo duplicado).
**Problem:** Degenerate faces resultam de STLs mal-exportados (Blender, FreeCAD, escaneamento 3D) e são comuns.
**Solution:** `removeDegenerateFaces()` no `sanitizeGeometry` detecta faces com área < 1e-12 (vértice duplicado ou colinear) e remove antes do CSG. `countNonManifoldEdges()` emite warning para arestas com >2 faces.
**Prevents:** Erros CSG enigmáticos. Reduz tri-count e melhora qualidade.

### L-013: Server-side decimation com trimesh exige round-trip completo (2026-06-29)

**Context:** M2 F2.2 — malhas >300k triângulos travam o browser no SimplifyModifier.
**Problem:** Simplificação no cliente é O(n) mas lenta para n > 500k. Precisava de fallback server-side.
**Solution:** Export STL no client → POST /api/decimate → Python trimesh.simplify_quadric_decimation → response STL → STLLoader client-side. Adicionado endpoint `/decimate` no FastAPI e proxy no Express. UI mostra warning "Malha pesada" com botões 25%/50%/75% quando >300k.
**Prevents:** Browser crash com arquivos grandes. Mantém UX rápida para pequenos.

### L-014: 3MF e FBX loaders são assíncronos como GLTF (2026-06-29)

**Context:** M2 F2.6 — adicionar FBXLoader e 3MFLoader.
**Problem:** Ambos são síncronos (parse retorna direto, sem callback), ao contrário do esperado.
**Solution:** `fbxLoader.parse(buffer, "")` e `threeMfLoader.parse(buffer)` retornam Group sincronicamente. Removido o Promise wrapper desnecessário.
**Prevents:** Erros de tipo e runtime com API callback incorreta.

### L-015: Auto-orient por normal bins é rápido e efetivo (2026-06-29)

**Context:** M3 F3.3 — alinhar mesh com a base para baixo.
**Problem:** PCA é complexo sem lib de linear algebra. OBB é pesado.
**Solution:** Agrupar normais de face em bins direcionais (8 theta × 8 phi = 64 bins). Bin com maior área = face dominante = base. Rotacionar para Y+.
**Prevents:** Dependência de lib externa. Algoritmo O(n) onde n = número de faces.

### L-016: Multi-job SSE exige listener map estável (2026-06-29)

**Context:** M3 F3.2 — batch TripoSR com múltiplos jobs simultâneos.
**Problem:** EventSource reconecta e precisa atualizar state corretamente para cada job.
**Solution:** `useMultiJobStream` mantém Map<jobId, progress>. Cada `connectSSE` recebe o map via closure e atualiza `setJobs(new Map(map))` a cada evento.
**Prevents:** Race conditions entre job completions. Stale state quando um job termina e outro não.

### L-017: TripoSR não tem setup.py — módulo é `tsr`, não `triposr` (2026-06-29)

**Context:** Erro de import "TripoSR not installed. Run: pip install triposr" ao buildar container.
**Problem:** O repo oficial TripoSR no GitHub não publica no PyPI e não tem `setup.py`. O código fica em `/tsr/` no repo, e o import correto é `from tsr.system import TSR`. A mensagem de erro antiga era enganosa.
**Solution:** Clone shallow em `/opt/TripoSR`, instala só deps de inferência (sem gradio/moderngl/imageio/xatlas), `PYTHONPATH=/opt/TripoSR` para o Python achar o módulo.
**Prevents:** Build quebrado. Mensagem de erro agora aponta pro Dockerfile.

### L-018: GPU NVIDIA ainda não está disponível no host (2026-06-29)

**Context:** Erro "could not select device driver nvidia" no `docker compose up`.
**Problem:** Host sem driver NVIDIA instalado; container tentava reservar GPU.
**Solution:** Backup `docker-compose.gpu.yml.bak`; novo `docker-compose.yml` sem bloco `deploy.resources.reservations.devices`. `CUDA_VISIBLE_DEVICES=` no env força CPU mesmo se libs CUDA estiverem presentes.
**Prevents:** Crash no startup. Quando GPU chegar, basta restaurar o backup ou re-adicionar o bloco.

### L-019: 3MF com perfil Bambu requer Metadata JSONs para ser reconhecido pelo Bambu Studio (2026-06-30)

**Context:** Pesquisando como gerar .3mf compatível com Bambu Studio para a feature cookie-cutter.
**Problem:** Um .3mf que contém apenas geometria (`3D/3dmodel.model`) abre no Bambu Studio mas aparece como "Generic" — sem perfil de impressora, sem configurações de slice. O usuário precisaria reconfigurar tudo manualmente.
**Solution:** Gerar pacote .3mf completo com 4 arquivos em `Metadata/`: `printer_settings.json` (máquina A1, nozzle), `filament_settings.json` (PLA/PETG, temps), `model_settings.config` (posição na placa), `slice_info.config` (layer, infill, walls, brim). JSZip empacota tudo como ZIP com a estrutura correta.
**Prevents:** Usuário abrir o .3mf e ver perfil genérico, perdendo todo o valor do "export para Bambu".

### L-020: Bambu Studio ignora 3MF se `model_settings.config` faltar — sempre gerar (2026-06-30)

**Context:** Testando diferentes combinações de metadata no .3mf do Bambu Studio.
**Problem:** Se `Metadata/model_settings.config` está ausente, o Bambu Studio não carrega nenhum dos outros metadados (filamento, impressora, slice). Todos os valores defaults são resetados.
**Solution:** Sempre incluir `model_settings.config` no pacote .3mf, mesmo que mínimo (plate layout, model position). Se outros metadados faltarem, o Bambu usa defaults razoáveis, mas sem `model_settings.config` ele rejeita todo o resto.
**Prevents:** Export "funcionar" mas perfil não ser aplicado, causando confusão.

---

## Quick Tasks Completed

| #   | Description                                       | Date       | Status  |
| --- | ------------------------------------------------- | ---------- | ------- |
| T1  | Install jszip + file-saver                        | 2026-06-29 | ✅ Done  |
| T2  | Create lib/loaders.ts (STL/OBJ/GLB)               | 2026-06-29 | ✅ Done  |
| T3  | Create lib/threeShims.ts                          | 2026-06-29 | ✅ Done  |
| T4  | Create lib/decimate.ts                            | 2026-06-29 | ✅ Done  |
| T5  | Create lib/meshSelection.ts                       | 2026-06-29 | ✅ Done  |
| T6  | Create lib/booleanCut.ts (CSG)                    | 2026-06-29 | ✅ Done  |
| T7  | Create lib/dowel.ts                               | 2026-06-29 | ✅ Done  |
| T8  | Create lib/exportPieces.ts (STL+ZIP)              | 2026-06-29 | ✅ Done  |
| T9  | Create hooks/useMeshEditor.ts                     | 2026-06-29 | ✅ Done  |
| T10 | Create components/UploadMeshDropzone.tsx          | 2026-06-29 | ✅ Done  |
| T11 | Create components/three/LoadedMesh.tsx            | 2026-06-29 | ✅ Done  |
| T12 | Create components/three/Toolbar.tsx               | 2026-06-29 | ✅ Done  |
| T13 | Create components/three/DowelMesh.tsx             | 2026-06-29 | ✅ Done  |
| T14 | Create components/three/PieceRenderer.tsx         | 2026-06-29 | ✅ Done  |
| T15 | Rewrite src/pages/Viewer3D.tsx                    | 2026-06-29 | ✅ Done  |
| T16 | Vitest setup + 16 tests for lib modules           | 2026-06-29 | ✅ Done  |
| T17 | Update STATE.md and ROADMAP.md                    | 2026-06-29 | ✅ Done  |
| P1  | UV sanitization in lib/loaders.ts                 | 2026-06-29 | ✅ Done  |
| P2  | Better CSG error messages (booleanCut, dowel)     | 2026-06-29 | ✅ Done  |
| P3  | Keyboard shortcuts V/M/S/E/Esc/F/C                | 2026-06-29 | ✅ Done  |
| P4  | Adaptive TransformControls gizmo size + highlight  | 2026-06-29 | ✅ Done  |
| P5  | "Frame" button in Toolbar to refit camera         | 2026-06-29 | ✅ Done  |
| P6  | Update STATE.md with P1-P5 LLs                    | 2026-06-29 | ✅ Done  |
| U1  | Design undo/redo architecture (snapshot pattern)  | 2026-06-29 | ✅ Done  |
| U2  | Implement undoable HOC wrapping reducer           | 2026-06-29 | ✅ Done  |
| U3  | Add UNDO/REDO actions + history state             | 2026-06-29 | ✅ Done  |
| U4  | Add Undo/Redo buttons to Toolbar                  | 2026-06-29 | ✅ Done  |
| U5  | Add Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts      | 2026-06-29 | ✅ Done  |
| U6  | Add 6 unit tests for undo/redo behavior           | 2026-06-29 | ✅ Done  |
| U7  | Update STATE.md and ROADMAP.md                    | 2026-06-29 | ✅ Done  |
| F1  | Design multi-cut data model (editPiece, layout)   | 2026-06-29 | ✅ Done  |
| F2  | Add EDIT_PIECE action + editPiece function        | 2026-06-29 | ✅ Done  |
| F3  | Refactor piece positioning to horizontal row      | 2026-06-29 | ✅ Done  |
| F4  | Add 'Recortar' button per piece + editing header  | 2026-06-29 | ✅ Done  |
| F5  | Add 5 unit tests for multi-cut flow               | 2026-06-29 | ✅ Done  |
| F6  | Update STATE.md and ROADMAP.md                    | 2026-06-29 | ✅ Done  |
| S1  | Degenerate face detection + removal (sanitizeGeometry) | 2026-06-29 | ✅ Done |
| S2  | Non-manifold edge detection + warning               | 2026-06-29 | ✅ Done |
| S3  | Server-side decimation: /decimate endpoint + proxy  | 2026-06-29 | ✅ Done |
| S4  | UI: server-side decimate buttons when >300k tris    | 2026-06-29 | ✅ Done |
| S5  | 3MF + FBX loader support in loaders.ts + threeShims | 2026-06-29 | ✅ Done |
| S6  | Update UploadMeshDropzone accept .3mf/.fbx          | 2026-06-29 | ✅ Done |
| S7  | Add 4 sanitization tests to loaders.test.ts         | 2026-06-29 | ✅ Done |
| S8  | Update Python Dockerfile with decimate.py           | 2026-06-29 | ✅ Done |
| O1  | Create lib/autoOrient.ts (directional bin + rotate) | 2026-06-29 | ✅ Done |
| O2  | Add autoOrient to hook + Toolbar button             | 2026-06-29 | ✅ Done |
| M1  | Create useMultiJobStream hook (multi-job SSE)       | 2026-06-29 | ✅ Done |
| M2  | Multi-image UI: tabs, grid upload, batch submit     | 2026-06-29 | ✅ Done |
| M3  | Results gallery + individual viewer/download links  | 2026-06-29 | ✅ Done |
| M4  | Fix FBX/3MF loader API (sync, not async)            | 2026-06-29 | ✅ Done |
| M5  | Update STATE.md + ROADMAP.md with M3 docs           | 2026-06-29 | ✅ Done |
| R1  | mc_resolution param on Python /generate              | 2026-06-29 | ✅ Done |
| R2  | Forward mc_resolution in Node proxy                  | 2026-06-29 | ✅ Done |
| R3  | Resolution toggle 256/512 in ImageTo3D UI            | 2026-06-29 | ✅ Done |
| T1  | Create python/text_to_image.py (SDXL-Turbo)          | 2026-06-29 | ⏳ Pending |
| T2  | POST /text-to-3d endpoint + _run_text_to_3d in app.py| 2026-06-29 | ⏳ Pending |
| T3  | Add diffusers/accelerate/safetensors to Dockerfile   | 2026-06-29 | ⏳ Pending |
| T4  | Add POST /api/text-to-3d proxy in server.ts          | 2026-06-29 | ⏳ Pending |
| T5  | Add "Texto → 3D" tab to ImageTo3D.tsx                | 2026-06-29 | ⏳ Pending |
| T6  | Rebuild triposr image + curl E2E verify              | 2026-06-29 | ⏳ Pending |
| T7  | Update STATE.md and ROADMAP.md (F3.4 docs)           | 2026-06-29 | ⏳ Pending |

---

## Deferred Ideas

- [ ] Cap de tamanho de arquivo no client (10MB) com fallback de decimação progressiva
- [ ] `BufferGeometryUtils` namespace import emite warning "Multiple instances of Three.js" no vitest — minor dev-only issue
- [ ] Auto-orientação automática ao carregar peça no Viewer (já tem botão manual)
- [ ] Exportar G-code direto (integrar fatiador leve)
- [ ] Marketplace de presets de pinos por tipo de impressora
- [ ] Compartilhamento de malha via URL curta
- [ ] Batch cortes automáticos (dividir malha em N peças iguais)
- [ ] **AI providers plugáveis** — análise em `.specs/project/AI_PROVIDERS.md` (avaliar Stability AI Stable Fast 3D, Tripo3D, Meshy, Rodin como substitutos do TripoSR self-hosted)

---

## Todos

- [ ] Rodar UAT walkthrough com o usuário (validar fluxo end-to-end completo)
- [ ] Testar com STL real grande (1M+ triângulos) para validar server-side decimation
- [ ] Projeto future: ver "Future Considerations" no ROADMAP.md

---

## Preferences

**Model Guidance Shown:** never
