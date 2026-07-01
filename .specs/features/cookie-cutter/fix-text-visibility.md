# Fix: Texto de SVG visível no canvas 2D

**Data:** 2026-07-01  
**Status:** complete  
**Prioridade:** P0

## Problema

SVG com `<text>` importado era ignorado — `<text>` não estava no seletor do `elementToPathD`.

## Solução (3 mudanças, ~25 linhas)

### `lib/cookie-cutter/svgImport.ts`

1. Importa `loadFont`, `getCachedFont`, `textToPath` de `fontLoader.ts`
2. `extractPathsFromSvg` vira async: pré-carrega fonte com `Promise.race(loadFont, 3s)` se há `<text>`
3. Seletor inclui `:scope > text`
4. `elementToPathD`: novo case `"text"` usando `getCachedFont()` + `textToPath()`
5. `parseSvgString` vira async (aguarda `extractPathsFromSvg`)

### `lib/cookie-cutter/fontLoader.ts` (já existente)
- `loadFailed` flag impede retry após falha
- Timeout 3s (reduzido de 10s)

## Comportamento

- SVG com `<text>` + fonte carrega → texto convertido a path → visível no canvas
- SVG com `<text>` + fonte falha → texto ignorado, demais shapes ok
- Import nunca trava > 3s

---

## Problema

`embosseShapes` (texto e carimbos) nunca é renderizado no canvas 2D. O editor 2D (`VectorCanvas`) só renderiza `activePiece.shapes`. O texto importado de SVG ou adicionado via botão "T" vai para `embosseShapes` e fica invisível.

## Causa Raiz

| Arquivo | Linha | Problema |
|---|---|---|
| `svgImport.ts` | 101-105 | `<text>` → array `embosse` (vira `embosseShapes`) |
| `CookieCutter.tsx` | 422 | Botão T → `addEmbosseShapeToActive()` |
| `VectorCanvas.tsx` | 204 | Só renderiza `activePiece.shapes` |

## Decisão de Design

**DC-19:** Texto e carimbos permanecem em `embosseShapes` (não migram para `shapes`). O canvas renderiza AMBOS os arrays com estilos visuais diferentes:
- `shapes` (contorno de corte): stroke cyan `#00E5FF`
- `embosseShapes` (carimbo/emboss): stroke âmbar `#FF9933`, stroke dash `3 2`

**Rationale:** Texto deve ser carimbo na lâmina (emboss/deboss), não parte do contorno de corte. O usuário precisa ver e posicionar o carimbo relativo ao contorno.

---

## Mudanças

### 1. `hooks/useVectorEditor.ts` — +4 funções para embosse

```typescript
updateEmbosseShapeTransform(pieceId, shapeId, transform)
updateEmbosseShape(pieceId, shapeId, updates)
removeEmbosseShape(pieceId, shapeId)
selectAll() → incluir embosseShapes visíveis
```

### 2. `components/cookie-cutter/editor/VectorCanvas.tsx` — renderizar embosse

- 2 loops de renderização: shapes (cutter) + embosseShapes (carimbo)
- `selectedShapes`: combinado de shapes + embosseShapes selecionados
- `onTransform`: routing para `updateShapeTransform` ou `updateEmbosseShapeTransform`
- Delete key: remove de ambas as listas

### 3. `components/cookie-cutter/editor/ShapeRenderer.tsx` — prop `variant`

- Prop `variant?: "cutter" | "embosse"`
- Embosse: stroke `#FF9933`, width 1.5, dashArray `"3 2"`
- Cutter: stroke `#00E5FF` (selected) ou `#ffffff` (normal)

### 4. `components/cookie-cutter/editor/LayerPanel.tsx` — 2 seções

- Seção "Contorno": shapes com indicador cyan
- Seção "Carimbos": embosseShapes com indicador âmbar
- Botão para alternar visibilidade, deletar

### 5. `lib/cookie-cutter/svgExport.ts` — exportar embosse

- Incluir `embosseShapes` no SVG exportado em `<g id="embosse">`

---

## Não altera

| Arquivo | Razão |
|---|---|
| `svgImport.ts` | `<text>` já vai para `embosseShapes` — correto |
| `CookieCutter.tsx` | Já usa `addEmbosseShapeToActive` — correto |
| `cutterBuild.ts` | Já processa `embosseShapes` via CSG — correto |
| `embosse.ts` | Já funciona — correto |

---

## Estimativa

~115 linhas alteradas, zero dependências novas.
