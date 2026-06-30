# Cookie Cutter Maker — Context Decisions

Captura das decisões de design tiradas com o usuário durante as fases de discussão e planejamento.

## Decisions Log

### DC-01: Editor 2D custom em React + SVG nativo (2026-06-29)

**Question:** Qual abordagem para o editor vetorial 2D integrado?

**Options considered:**
- Canvas customizado em React + SVG (chosen)
- Integrar tldraw
- Integrar fabric.js ou konva
- Apenas upload de SVG (sem editor de desenho)

**Decision:** Canvas customizado em React + SVG nativo (`<svg>`, `<path>`, `<g transform>`).

**Rationale:** Aproveita `SVGLoader` do `three-stdlib` (já instalado) para parse downstream — o que o editor gera é exatamente o que o pipeline 3D consome. Zero dependências extras. Visual idêntico ao do gerador 3D. Consistente com a stack React do projeto.

**Trade-off:** ~2-3 dias a mais de esforço vs. lib pronta. Mitigação: componentes focados e reutilizáveis.

**Impact:** `src/components/cookie-cutter/editor/` com 10+ componentes. `useVectorEditor` como hook central.

---

### DC-02: Backend Node filesystem para persistência (2026-06-29)

**Question:** Onde armazenar projetos (versões, miniatura, parâmetros, SVG, histórico)?

**Options considered:**
- Backend Node (filesystem em /projects) (chosen)
- LocalStorage do browser
- IndexedDB
- Sem persistência

**Decision:** Backend Node, filesystem em `projects/{id}/`.

**Rationale:** Consistente com o padrão atual (`tmp/jobs/`). Persiste entre browsers/devices. Permite projetos >5MB. Suporta versionamento real (cada versão é um arquivo imutável). Reusa infraestrutura Express + multer já existente.

**Trade-off:** Adiciona ~8 endpoints REST. Mitigação: endpoints seguem padrão CRUD simples.

**Impact:** `server.ts` ganha rotas `/api/projects/*`. `lib/projects.ts` é o cliente.

---

### DC-03: Pipeline 3D SVG → Shape → Extrude + CSG (2026-06-29)

**Question:** Como gerar a geometria 3D a partir do SVG 2D?

**Options considered:**
- SVG → Shape → Extrude + three-bvh-csg (chosen)
- Python com shapely + trimesh + servidor
- paper.js client-side
- polygon-clipping / polybooljs

**Decision:** SVG → Shape → Extrude + three-bvh-csg. Tudo no browser.

**Rationale:** Reusa `three-bvh-csg` (instalado e bem testado), `booleanCut.ts` existente, `SVGLoader` do `three-stdlib`. Zero round-trip. Sem dependências Python novas. Performance adequada para shapes de cookie cutter (<1000 segmentos típicos).

**Trade-off:** Offset 2D (inset/outset) precisa ser implementado custom. Mitigação: algoritmo "miter offset" próprio; suficiente para formatos de cortador (majoritariamente convexos ou levemente côncavos).

**Impact:** `lib/cookie-cutter/cutterBuild.ts` orquestra o pipeline. `lib/cookie-cutter/polygonOffset.ts` implementa o offset.

---

### DC-04: Polygon offset 2D com "miter algorithm" próprio (2026-06-29)

**Question:** Como fazer offset uniforme de polígonos para criar parede de espessura constante?

**Options considered:**
- Miter offset in-house (chosen)
- polygon-clipping (não tem offset nativo)
- paper.js PathItem.offset()
- Scale uniforme (aproximado)

**Decision:** Miter offset próprio. Para cada aresta, calcular normal externa; no vértice, mover ao longo do bissetor; aplicar miterLimit para cantos agudos.

**Rationale:** Evita dep de ~250KB (paper.js). Suficiente para formatos de cookie cutter. Aproximação por scale uniforme atua como fallback para casos patológicos.

**Trade-off:** Pode falhar em polígonos muito côncavos com ângulos internos < 10°. Mitigação: detectar e aplicar fallback "shrink uniforme" com aviso.

**Impact:** `lib/cookie-cutter/polygonOffset.ts` exporta `offsetPolygon(pts, distance)` e `offsetShape(shape, distance)`.

---

### DC-05: `opentype.js` para texto → curvas e `polygon-clipping` para boolean 2D (2026-06-29)

**Question:** Quais dependências npm novas?

**Options considered:**
- opentype.js + polygon-clipping (chosen)
- Usar FontLoader do three-stdlib (requer TTF file)
- Implementar boolean 2D do zero

**Decision:** Adicionar `opentype.js` (~80KB) e `polygon-clipping` (~50KB).

**Rationale:** `opentype.js` é padrão da indústria para parse de TTF/OTF no browser, permite carregar fontes do sistema do usuário ou pré-instaladas. `polygon-clipping` resolve auto-interseções de SVG, fecha paths abertos, normaliza winding — operações essenciais para SVGs vindos de fontes externas (Illustrator, Inkscape, FreeCAD). Ambas são ESM puras compatíveis com Vite.

**Trade-off:** +2 deps (~130KB total). Aceitável dado o valor.

**Impact:** `lib/cookie-cutter/svgAutoFix.ts`, `lib/cookie-cutter/polygonOps.ts`, `components/cookie-cutter/editor/TextInputDialog.tsx`.

---

### DC-06: Sistema de projetos com versionamento append-only (2026-06-29)

**Question:** Como versionar projetos?

**Options considered:**
- Append-only: cada save = novo arquivo imutável (chosen)
- Diff-based: só guarda deltas
- Snapshot único: overwrite

**Decision:** Append-only. `projects/{id}/versions/{n}.json`. Cada save cria `version-N.json` imutável. `project.json` mantém metadados + currentVersion pointer.

**Rationale:** Mais simples que diffs. Histórico completo auditável. "Duplicar" = copiar diretório. "Excluir" = remover diretório. Snapshots são pequenos (~50KB por versão para shapes + params típicos).

**Trade-off:** Consome mais espaço que diffs (~50KB × versões). Mitigação: cap de 50 versões; auto-promoção das últimas 10 + 40 random.

**Impact:** `server.ts` endpoints, `lib/projectStorage.ts` types.

---

### DC-07: Fases de entrega: F1 editor → F2 pipeline 3D → F3 projetos (2026-06-29)

**Question:** Escopo e fases de entrega?

**Options considered:**
- Completo com fases (chosen)
- MVP focado (só upload + extrude simples)
- Tudo de uma vez

**Decision:** 3 fases entregáveis. F1 = editor 2D básico. F2 = pipeline 3D + visualização + export + features avançadas. F3 = biblioteca expandida + projetos + perfis custom.

**Rationale:** Cada fase é funcional isoladamente. Usuário já usa o editor após F1. Após F2, o pipeline completo funciona (mesmo sem persistência). F3 adiciona a camada de projeto/versão/biblioteca.

**Trade-off:** F1 e F2 não persistem entre sessões. Mitigação: F3 adiciona persistência completa.

**Impact:** Tasks organizadas em 3 grupos com dependências claras.

---

### DC-08: Multi-peça com grid automático no preview 3D (2026-06-29)

**Question:** Layout de múltiplas peças no preview 3D?

**Options considered:**
- Grid automático (chosen)
- Carrossel com paginação
- Layout circular/anel

**Decision:** Grid 2D automático no plano XY. Peças posicionadas com spacing uniforme. Câmera auto-enquadra o conjunto via `CameraFitter` (reuso do Viewer3D).

**Rationale:** Funciona para qualquer quantidade de peças. Fácil de comparar cortadores lado a lado. Reusa infraestrutura existente de auto-enquadramento.

**Trade-off:** Com 6+ peças, o grid fica apertado. Mitigação: layout adaptativo (2-4 cols dependendo da contagem).

**Impact:** `hooks/useCookieCutter.ts` gera `piecesToGrid`; `Preview3D.tsx` renderiza com spacing.

---

### DC-09: Auto-fix de SVG com preview side-by-side + confirmação (2026-06-29)

**Question:** Auto-fix deve modificar automaticamente ou pedir confirmação?

**Options considered:**
- Preview + confirmar antes de aplicar (chosen)
- Aplicar automaticamente + relatório
- Tentar correção; se falhar, rejeitar import

**Decision:** Preview side-by-side (antes/depois) em modal `FixReportDialog`. Usuário revisa cada correção e confirma ou recusa individualmente.

**Rationale:** Mais seguro. Usuário mantém controle sobre a geometria do seu desenho. Evita "correções" que alteram a intenção do design.

**Trade-off:** Mais cliques para confirmar. Mitigação: checkbox "Aplicar tudo" para confirmação em lote.

**Impact:** `FixReportDialog.tsx` com preview visual. `svgValidator.ts` detecta; `svgAutoFix.ts` gera versão corrigida.

---

### DC-10: Estimativa de impressão por heurística volumétrica (2026-06-29)

**Question:** Preferência por precisão ou velocidade de cálculo?

**Options considered:**
- Heurística volumétrica (chosen)
- Volumétrica + perimétrica com paredes finas
- Backend com estimativa real de slicer

**Decision:** Heurística volumétrica. `volume_cm³ / 4` para tempo; `volume_cm³ × density` para peso; comprimento de filamento via seção transversal.

**Rationale:** Rápido (<10ms), sem dependências, ordem de grandeza suficiente para decisões de usuário. Precisão ±30% (bom para "isso vai levar ~2h ou ~20h?").

**Trade-off:** Impreciso para peças ocas complexas. Mitigação: disclaimer "Estimativa aproximada (±30%); validar no PrusaSlicer/Cura".

**Impact:** `lib/cookie-cutter/printEstimate.ts` com fórmulas. `EstimatePanel.tsx` mostra resultado com disclaimer.

---

### DC-11: Thumbnails client-side via WebGL rendering (2026-06-29)

**Question:** Como gerar miniaturas dos modelos?

**Options considered:**
- Client-side `gl.domElement.toDataURL()` (chosen)
- Server-side com Python trimesh
- R3F `useFrame` snapshot

**Decision:** Client-side WebGL rendering. 256×256 para preview, 64×64 para galeria. `preserveDrawingBuffer: true` no renderer de thumbnail.

**Rationale:** Zero round-trip, sem dependência Python. Aproveita o mesmo WebGL context do preview 3D. Rápido (~50ms para mesh típica de cookie cutter).

**Trade-off:** Não funciona se o WebGL não estiver disponível (raro). Mitigação: fallback para placeholder cinza se `toDataURL` falhar.

**Impact:** `lib/cookie-cutter/thumbnail.ts` com render offscreen.

---

### DC-12: Perfis de impressão como JSON estático + custom em localStorage (2026-06-29)

**Question:** Como gerenciar perfis de impressora?

**Options considered:**
- JSON estático + localStorage (chosen)
- Backend (servidor)
- Apenas hardcoded

**Decision:** 6 perfis prontos em `printProfiles.ts` (Ender 3, Prusa MK4, Bambu X1, Bambu A1, Voron 2.4, Anycobra Kobra 2). Perfis custom do usuário salvos em `localStorage` com interface CRUD em `PrintProfileManager.tsx`.

**Rationale:** Perfis padrão são imutáveis (versionados no código). Custom são pessoais (persistem no browser sem poluir o backend). Futuro: se usuários pedirem, mover para backend com share.

**Trade-off:** Perfis custom não sincronizam entre browsers. Mitigação: botão "Exportar perfil" como JSON e "Importar" para transferir.

**Impact:** `lib/cookie-cutter/printProfiles.ts` (types + defaults). `components/cookie-cutter/projects/PrintProfileManager.tsx`.

---

### DC-13: Alças e reforços estruturais automáticos com threshold (2026-06-29)

**Question:** Como gerar alças/reforços?

**Options considered:**
- Automático com threshold por dimensão (chosen)
- Manual (usuário posiciona)
- Sempre ativo

**Decision:** Alças automáticas quando `maxDimension > threshold` (padrão 70mm). Reforços (ribs) automáticos quando `perimeter > threshold` (padrão 200mm). Usuário pode desativar ou ajustar thresholds/spacing.

**Rationale:** Alças só são úteis para cortadores grandes (difíceis de segurar). Ribs só são necessários para paredes altas/grandes. Automatizar reduz decisões do usuário.

**Trade-off:** Posicionamento automático pode não agradar. Mitigação: threshold e spacing configuráveis.

**Impact:** `lib/cookie-cutter/handles.ts`, `lib/cookie-cutter/reinforcements.ts`. `HandlesControls.tsx`.

---

### DC-14: Emboss/Deboss como sub-formas no editor 2D (2026-06-29)

**Question:** Como implementar carimbo (emboss/deboss)?

**Options considered:**
- Sub-formas no editor 2D + CSG na lâmina (chosen)
- Apenas texto (não formas arbitrárias)
- Só deboss (não emboss)

**Decision:** Sub-formas (texto ou ícone) associadas a cada peça. Editor 2D permite posicionar. Pipeline extruda sub-forma para baixo e aplica CSG SUBTRACTION (deboss) ou ADDITION (emboss) na lâmina.

**Rationale:** Reusa o editor 2D (consistência). Suporte a texto + ícones (flexibilidade). Emboss e deboss cobrem 100% dos casos de carimbo.

**Trade-off:** Adiciona complexidade ao modelo de dados (`VectorPiece.embosseShapes`). Mitigação: opcional; toggle para ativar/desativar por peça.

**Impact:** `lib/cookie-cutter/embosse.ts`. `EmbossePanel.tsx`. Cada `VectorPiece` tem `embosseShapes: Shape2D[]`.

---

### DC-15: Scope de F1-F3 com features avançadas integradas (2026-06-29)

**Question:** Como distribuir as features avançadas (alças, reforços, emboss, perfis, estimativa, thumbnails, multi-peça, auto-fix) nas fases?

**Decision:** Integradas nas fases existentes:
- **F1** (Editor 2D): multi-peça (modelo), auto-fix (UI preview)
- **F2** (Pipeline 3D): alças, reforços, emboss/deboss, estimativa, thumbnails, multi-peça (visual), perfis de impressora (padrão)
- **F3** (Projetos): perfis custom, thumbnails salvas, biblioteca expandida

**Rationale:** Features que afetam o modelo de dados (multi-peça) precisam estar na base (F1). Features de geração 3D (alças/ribs/emboss) pertencem ao pipeline (F2). Features de persistência/config (perfis custom) pertencem aos projetos (F3).

**Impact:** 66 tasks totais (vs. ~30 originais). F1 tem +9 tasks (auto-fix + multi-peça). F2 tem +21 tasks (features 3D avançadas + unit toggle + 3MF Bambu). F3 tem +8 tasks (perfis custom + thumbnails salvas + printer config infra).

---

### DC-16: Perfil Bambu A1 read-only no 3dlab; ajustes finos no Bambu Studio (2026-06-30)

**Question:** O usuário pode configurar layer height, infill, supports etc. dentro do 3dlab ao exportar para Bambu?

**Options considered:**
- Perfil read-only com defaults razoáveis (chosen)
- UI completa de slicer settings (layer, infill, temp, brim, etc.)
- Apenas 3MF genérico sem perfil

**Decision:** Perfil read-only. O 3MF exportado contém `Metadata/printer_settings.json` (A1, nozzle 0.4mm, build 220×220×256) e `Metadata/filament_settings.json` (PLA 1.75mm, 220°C/60°C) e defaults de slice (0.2mm layer, 15% infill, 3 walls). O usuário abre no Bambu Studio e ajusta o que precisar antes de fatiar.

**Rationale:** Complexidade de UI de slicer settings está fora de escopo do cookie-cutter. O valor está em gerar .3mf que o Bambu Studio reconhece com perfil correto (sem reconfigurar o básico). Ajustes finos são domínio do slicer.

**Trade-off:** Usuário precisa de 1 clique extra (abrir no Bambu Studio → ajustar → fatiar). Mitigação: defaults razoáveis para cortadores de biscoito (PLA, 0.2mm, 3 walls — bom balanço qualidade/resistência).

**Impact:** `lib/cookie-cutter/bambuProfile.ts` e `lib/cookie-cutter/threemfWriter.ts`. `cutterExport.ts` ganha `exportBambu3MF()`.

---

### DC-17: `useUnits` hook com persistência localStorage; mm default; display alterna, storage em mm (2026-06-30)

**Question:** O usuário quer ver medidas em cm. Como implementar?

**Options considered:**
- Toggle mm ↔ cm com localStorage (chosen)
- Sempre cm
- Auto-scale por tamanho

**Decision:** Toggle entre mm (default) e cm. `useUnits` hook gerencia o estado com persistência em localStorage. Todos os sliders do `ParameterPanel` e labels do `DimensionOverlay` mostram na unidade ativa. Storage interno (CutterParams, export STL) **permanece em mm** — display apenas converte.

**Rationale:** mm é o padrão universal em impressão 3D (filamento 1.75mm, layer 0.2mm, slicers). Toggle dá flexibilidade ao usuário sem quebrar compatibilidade com ferramentas externas.

**Trade-off:** Nenhum significativo. Conversão é trivial (1cm = 10mm).

**Impact:** `hooks/useUnits.ts`. `ParameterPanel.tsx`, `DimensionOverlay.tsx`, `CookieCutter.tsx`.

---

## Open Questions

_Nenhuma no momento. Todas as decisões críticas foram tomadas nas 4 rodadas de discussão com o usuário._

