# Concerns

Surfaçados via análise estática (leitura de código) em 2026-06-29. Foco em áreas que a feature mesh-editor tocará.

## 🔴 High Risk

### C-001: Viewer3D.tsx é um casca UI com lógica morta

**Evidence:** `src/pages/Viewer3D.tsx:73-82` (cutting plane decorativo), `:135-138` (botão "Execute Boolean Cut" sem `onClick`), `:170-179` (lista de peças hardcoded).

**Impact:** Usuário vê UI que promete funcionalidade (corte, download) mas nada executa. Quebra confiança no produto.

**Fix:** Reescrever conforme feature `mesh-editor` em `.specs/features/mesh-editor/`.

---

### C-002: three-bvh-csg instalado mas nunca importado

**Evidence:** `package.json:40` declara dependência; `grep -r "three-bvh-csg" src/` retorna 0 matches.

**Impact:** Tempo desperdiçado em install (~5MB); indica que feature foi tentada e abandonada. Risco de versão incompatível com three 0.185.

**Fix:** Verificar compatibilidade no primeiro uso; F1.5/F1.6 vão finalmente consumi-la.

**Verification:** `cat node_modules/three-bvh-csg/src/index.d.ts` confirma API moderna (`Brush`, `Evaluator`, `SUBTRACTION`, `REVERSE_SUBTRACTION`).

---

### C-003: STLExporter importado mas nunca chamado

**Evidence:** `src/pages/Viewer3D.tsx:9` importa; nenhum `STLExporter.parse()` no código.

**Impact:** Mais "stub" de feature inacabada.

**Fix:** F1.7 vai finalmente chamar `STLExporter.parse(mesh, { binary: true })`.

---

## 🟡 Medium Risk

### C-004: Sem testes em nenhum lugar do projeto

**Evidence:** `package.json` sem `test` script; nenhum `*.test.*` ou `*.spec.*`; nenhuma pasta `tests/`.

**Impact:** Refactor ou nova feature quebra silenciosamente; mesh editor tem algoritmos não-triviais (CSG, flood-fill, decimação) que merecem testes unitários.

**Fix:** Adicionar Vitest + `@testing-library/react` ao `package.json`. Criar `src/lib/__tests__/` com testes para `decimate.ts`, `meshSelection.ts`, `booleanCut.ts`, `dowel.ts`.

**Effort:** ~2-3h para setup + 8-12 testes iniciais.

---

### C-005: Viewer3D mistura model URL via search params e file local sem abstração

**Evidence:** `src/pages/Viewer3D.tsx:31-33` lê `?model=jobId`; nenhum estado para File do usuário.

**Impact:** Adicionar upload local requer reescrever boa parte do componente (estado, loader, cleanup de URL.createObjectURL).

**Fix:** Introduzir `MeshSource` union type em F1.1: `{ kind: 'url', url } | { kind: 'file', file } | { kind: 'demo' }`.

---

### C-006: SimplifyModifier não está no package.json mas existe em node_modules

**Evidence:** `node_modules/three/examples/jsm/modifiers/SimplifyModifier.js` existe (vem como exemplo de three).

**Impact:** Não é um risco direto (não precisa estar em deps), mas import via `three/examples/jsm/...` é frágil (path pode mudar em versões futuras). Vite geralmente resolve ok.

**Fix:** Considerar shim local em `src/lib/threeShims.ts` para isolar o import.

---

### C-007: TripoSR em CPU pode levar 3+ minutos; UI não tem cancelamento

**Evidence:** `python/triposr_runner.py:40-41` loga warning quando CPU; `ImageTo3D.tsx` não tem botão Cancel.

**Impact:** UX ruim em ambientes sem GPU; usuário fica olhando progress bar sem saída.

**Fix:** Out of scope da feature mesh-editor. Documentar para F2.x.

---

## 🟢 Low Risk

### C-008: Tema dark/cyan não tem tokens centralizados

**Evidence:** Cores hardcoded em todo lugar (`#00E5FF`, `#0A0A0A`, `#222`); `src/index.css:62-95` define vars `--background`, `--primary` etc mas código usa hex direto.

**Impact:** Mudar tema = refactor tedioso.

**Fix:** Não bloqueia mesh-editor. Considerar para M2.

---

### C-009: Tipos `@types/three` pode estar atrasado vs `three@0.185`

**Evidence:** `package.json:49` tem `@types/three: ^0.185.0`.

**Impact:** Risco mínimo (versões idênticas), mas se three atualizar, tipos podem quebrar.

**Fix:** Pinned via `^`; monitorar.

---

### C-010: docker-compose tem GPU reservation mas pode falhar em hosts sem GPU

**Evidence:** `docker-compose.yml:13-18` reserva NVIDIA; sem `runtime: nvidia` declarado.

**Impact:** Build ok; run pode falhar se NVIDIA Container Toolkit não estiver instalado.

**Fix:** Documentar no README. Não bloqueia mesh-editor.

---

### C-011: UploadDropzone restringe a image/* mas projeto precisa aceitar STL/OBJ/GLB

**Evidence:** `components/UploadDropzone.tsx:18` filtra `f.type.startsWith("image/")`; `:47` `accept="image/png,image/jpeg,image/webp"`.

**Impact:** Não dá pra usar o mesmo componente para upload de mesh. Vai precisar de novo componente (`UploadMeshDropzone.tsx`) ou generalizar.

**Fix:** F1.1 cria componente dedicado em `components/UploadMeshDropzone.tsx`.

---

## Resumo por área da feature mesh-editor

| Tarefa | Concerns tocados | Mitigação |
|---|---|---|
| F1.1 Real Mesh Loading | C-005, C-011 | `MeshSource` union + novo dropzone |
| F1.2 Decimation | C-006 | Shim local se necessário |
| F1.3-F1.5 Selection + Cut | C-001, C-002, C-004 | Reescrita + testes unitários |
| F1.6 Dowel | C-002 | CSG ADDITION/SUBTRACTION |
| F1.7 Download | C-003 | STLExporter + JSZip |
