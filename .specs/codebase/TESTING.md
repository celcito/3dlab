# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** ⚠️ **None configured** — Não há `jest`, `vitest`, `mocha` ou similar em `package.json`. Nenhum arquivo `*.test.*`, `*.spec.*` ou pasta `tests/` no projeto.

**E2E:** ⚠️ **None configured** — Sem Cypress, Playwright ou equivalente.

**Coverage:** Nenhuma ferramenta configurada.

**Lint:** `npm run lint` → `tsc --noEmit` (apenas verificação de tipos TypeScript, não testes).

## Test Organization

**Location:** N/A — não há testes no projeto atualmente.

**Naming:** N/A.

**Structure:** N/A.

## Testing Patterns

### Unit Tests

**Approach:** Inexistente. Toda validação é feita manualmente ou via type-checking.

### Integration Tests

**Approach:** Inexistente.

### E2E Tests

**Approach:** Inexistente. Não há Playwright, Cypress ou similar.

## Test Execution

**Commands:** Nenhum comando de teste no `package.json`.

**Configuration:** N/A.

## Coverage Targets

**Current:** 0% (sem testes).
**Goals:** Não documentado.
**Enforcement:** N/A.

## Test Coverage Matrix

| Code Layer                  | Required Test Type | Location Pattern | Run Command |
| --------------------------- | ------------------ | ---------------- | ----------- |
| React components (`src/pages`, `components`) | none | — | — |
| Custom hooks (`hooks/`)     | none              | —                | —           |
| 3D lib (proposta: `src/lib/meshSelection.ts`, `booleanCut.ts`, `decimate.ts`) | unit (recomendado) | `src/lib/__tests__/*.test.ts` | `npm test` (a configurar) |
| Python (`python/`)          | none              | —                | —           |
| Express server (`server.ts`) | none            | —                | —           |

**Nota:** Para a feature mesh-editor, recomendo fortemente adicionar **pelo menos testes unitários** para os módulos puros de geometria (decimação, seleção, cut, dowel) já que são algoritmos não-triviais. Custo baixo, alto valor.

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| N/A       | N/A            | N/A             | Não há testes para avaliar |

## Gate Check Commands

| Gate Level | When to Use                            | Command                                       |
| ---------- | -------------------------------------- | --------------------------------------------- |
| Quick      | Após tasks com unit tests only         | (a definir quando testes forem adicionados)   |
| Full       | Após tasks com e2e/integration tests   | (a definir)                                   |
| Build      | Após phase completion                  | `npm run lint && npm run build`               |

**Estado atual:** O único gate confiável é `npm run lint` (type-check TS) e `npm run build` (vite + esbuild). Recomendado adicionar suite de testes em paralelo à feature mesh-editor.
