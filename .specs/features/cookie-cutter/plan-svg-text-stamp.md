# Plano: SVG com texto + relief + editor de texto para carimbos/placas 3D

**Data:** 2026-07-01  
**Status:** in_progress  
**Decisões do usuário:** ver abaixo

## Decisões do usuário

1. **Roteamento de texto:** Texto (SVG `<text>` e T-tool) → `shapes` (contorno de corte) — como está hoje.
2. **Placa de carimbo:** Tornar opcional via parâmetro `stampHeight` exposto no ParameterPanel.
3. **Editor de texto:** Restaurar opentype.js via fontLoader.ts (T19 completo — fonte selector + upload TTF).
4. **Transforms:** Bake on import dos SVG rawTransform; keep shape.transform para editor.
5. **Multi-shape:** Union de todos os shapes visíveis do contorno (não só shapes[0]).
6. **Persistência:** Diagnosticar e corrigir salvamento no disco.
7. **Regressões DC-18:** Reaplicar FIX-3, FIX-4, FIX-5.
8. **Testes vermelhos:** Relaxar ao comportamento atual (excepto baking — A1/A2 farão 3+ testes passarem).

---

## Fases

### Fase A — Integridade do SVG import

- **A1** `lib/cookie-cutter/svgImport.ts`: chamar `applyMatrixToPathD(d, parseTransform(rawTransform))` para cozer rawTransform no `d`.
- **A2** Capturar `fill-rule="evenodd"` de `<path>`/`<g>` e gravar em `shape.fill`.
- **A3** Manter preload async `loadFont()` quando há `<text>`.

### Fase B — TextInputDialog opentype.js (T19)

- **B1** Reescrever TextInputDialog.tsx usando fontLoader.ts (textToPath).
- **B2** Dropdown de família de fonte listando `/fonts/*.ttf`.
- **B3** Upload TTF/OTF local (ArrayBuffer → opentype.parse).
- **B4** Preview SVG ao vivo, suporte minúsculas/acentos/multiline.
- **B5** Manter kind="text", metadata.text/fontSize/fontFamily.

### Fase C — Transforms 2D→3D

- **C1** `cutterBuild.ts`: aplicar shape.transform (tx,ty,sx,sy,rotation,mirror) na geometria antes de extrudir.
- **C2** Garantir mover/scale/rotate no editor reflete no preview 3D.

### Fase D — Multi-shape union

- **D1** `shape2D.ts`: `unionShapes(shapes)` usando polygon-clipping.
- **D2** `cutterBuild.ts`: substituir `shapes[0]` por union de todos os shapes visíveis.
- **D3** Letras com holes (O, A, B) preservados via evenodd.

### Fase E — Placa de carimbo opcional

- **E1** Expor `params.stampHeight` no ParameterPanel (slider + checkbox).
- **E2** Validar gate `stampHeight > 0` em cutterBuild.ts.

### Fase F — Reaplicar DC-18

- **F1** `ShapeRenderer.tsx`: `fill="transparent"` + `pointerEvents="visible"` (FIX-3).
- **F2** `ShapeLibrary.tsx`: campo `fillRule` em ShapeDef; star5/star6/moon → evenodd (FIX-5).
- **F3** `LayerPanel.tsx`: botões Eye/EyeOff globais no header (FIX-4).

### Fase G — SVG export

- **G1** `svgExport.ts`: viewBox calculado do bbox da cena.
- **G2** Exportar shape.fill='evenodd' como fill-rule no `<path>`.

### Fase H — Persistência

- **H1** Auditar POST /api/projects/:id/versions no server.ts.
- **H2** Auditar useProjects.save para chamada correta e tratamento de erros.
- **H3** Levantar servidor, exercitar save via UI, verificar disco.
- **H4** Corrigir endpoint ou cliente; surfar erros.

### Fase I — Limpeza

- **I1** Manter iconLoader.ts (usuário vai implementar galeria de ícones depois).
- **I2** Decidir applyProfile: implementar lock/clamp de perfil OU remover e documentar.
- **I3** Atualizar testes (cutterBuild.test.ts, shape2D.test.ts).

---

## Fora do escopo (futuro)

- EmbselPanel ativo ligado a embosseShapes (texto → shapes, não embosse).
- Upload TTF persistido no backend.
- Auto-fix improvements.
