# Roadmap

**Current Milestone:** M4 — Cookie Cutter Maker
**Status:** Complete — all 66 tasks across 3 phases shipped.

---

## M1: Mesh Editor (Viewer3D)

**Goal:** Substituir o placeholder atual do `Viewer3D.tsx` por um editor de malha 3D real com upload, decimação, seleção, corte booleano e pinos. Resultado: o usuário consegue preparar uma peça para impressão diretamente no browser, baixando as partes cortadas em STL.
**Target:** v0.5.0

### Features

**[F1.1] Real Mesh Loading** - ✅ COMPLETE
- Aceitar upload de STL/OBJ/GLB do usuário (lê via `FileReader` no client)
- Suportar também o fluxo atual `?model=jobId` (TripoSR GLB)
- Manter o demo cube como quick-start (não remove)
- Triângulos contados em tempo real (`position.count / 3`)

**[F1.2] Polygon Decimation** - ✅ COMPLETE
- Slider de qualidade: Original / Alto (~75%) / Médio (~50%) / Baixo (~25%)
- Implementação client-side com `SimplifyModifier` (three.js examples)
- Recalcular contagem de triângulos após cada decimação

**[F1.3] Face Selection** - ✅ COMPLETE
- 3 modos: manual paint, smart (flood-fill por ângulo diedro), erase
- Slider "Área inteligente" (5°–60°) controla threshold do flood
- Realce visual via `vertexColors` na geometria
- Shift+click para apagar da seleção

**[F1.4] Fill Holes** - ✅ COMPLETE
- Algoritmo raycast externo: faces atingidas = "fora", resto = "dentro"
- Marca todas as faces "dentro" como selecionadas (limpa imperfeições)
- Acionado por botão "Preencher tudo por dentro" (igual ao vídeo)

**[F1.5] Boolean Cut** - ✅ COMPLETE
- Constrói `Brush` fechado da seleção (extrusão ao longo da normal média)
- `three-bvh-csg` SUBTRACTION → peça A (com cavidade)
- REVERSE_SUBTRACTION → peça B (parte removida)
- Substitui o mock `Part_01_Top`/`Part_02_Bottom`

**[F1.6] Dowel (Pino de alinhamento)** - ✅ COMPLETE
- Trigger pós-corte: "Adicionar pino?"
- Cilindro 3D com `TransformControls` (arrastar para posicionar)
- Sliders: diâmetro (1–20mm), profundidade (1–30mm)
- "Aplicar na malha" → CSG ADDITION (fundi) na peça base + SUBTRACTION (furo) na oposta

**[F1.7] Parts Download** - ✅ COMPLETE
- Lista real de peças com nome, triangle count, botão STL individual
- STL gerado client-side via `STLExporter`
- Botão "Baixar todas" → `JSZip` → `parts.zip`

---

## M2: Polish & Performance

**Status:** Complete — all 6 features shipped.

### Features

- **[F2.1] Sanitização automática de malhas** - ✅ COMPLETE — removeDegenerateFaces (área < 1e-12), countNonManifoldEdges (warning), sanitizeGeometry exportado
- **[F2.2] Decimação server-side** - ✅ COMPLETE — Python /decimate endpoint + trimesh.simplify_quadric_decimation + Node proxy + UI fallback quando >300k tris
- **[F2.3] Undo/Redo** - ✅ COMPLETE — snapshot reducer com cap de 20, botões no toolbar, Ctrl+Z / Ctrl+Shift+Z
- **[F2.4] Múltiplos cortes** - ✅ COMPLETE — EDIT_PIECE action + editPiece() traz piece de volta para local space; layout horizontal row com spacing 3.0
- **[F2.5] Atalhos de teclado** - ✅ COMPLETE — V/M/S/E/Esc/F/C/Enter implementados (P3)
- **[F2.6] Suporte a 3MF / FBX** - ✅ COMPLETE — FBXLoader + 3MFLoader adicionados; UploadMeshDropzone aceita .3mf/.fbx

---

## M3: AI Improvements

**Status:** 3 of 4 complete (F3.4 Text-to-3D is planned).

### Features

- **[F3.1] TripoSR high-res** - ✅ COMPLETE — toggle 256/512 no UI, query param mc_resolution no Python, proxy forward no Node
- **[F3.2] Multi-image → 3D** - ✅ COMPLETE — tab "Multi" no ImageTo3D: upload 2-4 imagens, batch TripoSR parallel, gallery de resultados, download por view
- **[F3.3] Auto-orientação** - ✅ COMPLETE — botão "Orient" no Toolbar: bin de normais por directional bins (8×8), face mais plana como base, rotaciona para Y
- **[F3.4] Text-to-3D** - PLANNED — spec salvo em `.specs/features/text-to-3d/`. SDXL-Turbo + TripoSR chained, mesmo job/SSE infra.

---

## M4: Cookie Cutter Maker

**Status:** Complete — all 66 tasks across 3 phases shipped.

**Goal:** Transformar qualquer desenho 2D (SVG) em um cortador de biscoitos 3D imprimível.

### Phase F1: Editor 2D — ✅ COMPLETE
- SVG upload com auto-fix (open paths, self-intersections, winding)
- Multi-peça (abas, renomear, excluir)
- Shape library (12 formas pré-definidas)
- Texto → curvas (built-in glyphs)
- Undo/redo, zoom/pan, grid snap
- 10 React components + 7 lib modules + 3 hooks

### Phase F2: Pipeline 3D — ✅ COMPLETE
- Polygon offset (miter algorithm) para espessura uniforme
- Extrude + CSG para wall, blade, base, handles, ribs
- Handles automáticos (threshold 70mm, loop/tab)
- Reforços estruturais (auto-ribs por perimeter)
- Emboss/Deboss (carimbo texto/ícone na lâmina)
- Preview 3D via R3F com wireframe toggle
- DimensionOverlay (W×H×D, perimeter, triangles)
- Print estimate (volume, peso, filamento, tempo, custo)
- 6 print profiles built-in (Ender3, Prusa MK4, Bambu X1/A1, Voron 2.4, Anycubic Kobra 2)
- Export multi-formato (STL, OBJ, GLB, 3MF, SVG, ZIP)
- Bambu Lab A1 3MF export com perfil
- Unit toggle mm ↔ cm (localStorage)
- 10 lib modules + 1 hook + 8 components

### Phase F3: Projects — ✅ COMPLETE
- Project CRUD (filesystem: projects/{id}/)
- Append-only versioning (up to 50 versions)
- Project gallery with thumbnails, favorites, duplicate, delete
- Version history timeline (load historical snapshots)
- Custom print profiles in localStorage
- Printer config infrastructure (localStorage)
- 8 API routes + 2 lib modules + 1 hook + 5 components

---

## Future Considerations

- Exportar G-code direto (integrar fatiador leve como PrusaSlicer headless?)
- Marketplace de presets de pinos (1mm, 2mm, 3mm) por tipo de impressora
- Compartilhamento de malha via URL curta (mesmo backend de jobs, com TTL)
- Versionamento de modelos (galeria do usuário)
- 3MF export (além de load)
- Webhook notification quando job TripoSR termina
- Batch cortes automáticos (dividir malha em N peças iguais)
