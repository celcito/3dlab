# Mesh Editor Specification

Substitui `src/pages/Viewer3D.tsx` (atualmente um casca UI com geometria fake e botões sem onClick) por um editor de malha 3D real, completo: upload, decimação, seleção, corte booleano, pino de alinhamento, download.

## Problem Statement

O `Viewer3D` atual exibe um cubo de demonstração (BoxMesh) ou um GLB do TripoSR, e oferece botões de "corte" e "download" que não fazem nada. Usuários que baixam modelos 3D de outras fontes (Thingiverse, Sketchfab, scan pessoal) não têm como carregá-los, ver a contagem de triângulos, reduzir a complexidade, selecionar áreas para cortar, ou baixar as peças resultantes — funcionalidades básicas de qualquer ferramenta de preparação para impressão 3D.

## Goals

- [ ] Aceitar upload de STL/OBJ/GLB do usuário; exibir contagem de triângulos em tempo real.
- [ ] Oferecer decimação com 4 níveis (Original / Alto / Médio / Baixo) sem round-trip ao servidor.
- [ ] Permitir seleção de faces via 3 modos (manual / inteligente / apagar) + botão "preencher".
- [ ] Executar corte booleano real (3D) gerando duas peças a partir da seleção.
- [ ] Permitir adicionar pino de alinhamento (cilindro fundido em uma peça, furo na outra) com diâmetro/profundidade ajustáveis.
- [ ] Listar peças geradas com download individual (STL) e download em lote (ZIP).
- [ ] Manter o pipeline atual (TripoSR via `?model=jobId` + demo cube) sem regressão.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Múltiplos cortes encadeados (fatiamento em N partes) | CSG de 3+ peças é O(n²) e raramente necessário na v1; vai para M2 (F2.4) |
| Edição por vertex/edge (esculpir, mover) | Escopo de modelador 3D, não de preparador |
| Texturas, UV, materiais | Decisão de design: viewer foca em geometria pura |
| Undo/Redo | Vai para M2 (F2.3) |
| Formatos 3MF, FBX, PLY | STL/OBJ/GLB cobrem 99% dos casos reais |
| Fatiador real (G-code) | Domínio de outro app; integração out of scope |
| Auth / multi-usuário / cloud | App local/self-hosted |

---

## User Stories

### P1: Real Mesh Loading ⭐ MVP

**User Story:** Como maker, eu quero subir um arquivo STL/OBJ/GLB do meu computador para que eu possa manipulá-lo no 3dlab.

**Why P1:** Sem upload real, nenhuma outra feature é útil.

**Acceptance Criteria:**

1. WHEN usuário clica em "Carregar modelo" THEN o sistema SHALL abrir um seletor de arquivo aceitando `.stl`, `.obj`, `.gltf`, `.glb`.
2. WHEN usuário seleciona um arquivo válido THEN o sistema SHALL renderizar a malha 3D no canvas em ≤ 2 segundos.
3. WHEN malha é renderizada THEN o painel "01. Model Info" SHALL exibir `Triangles: <N>` calculado de `geometry.attributes.position.count / 3`.
4. WHEN malha é renderizada THEN o sistema SHALL auto-centralizar e auto-enquadrar a câmera.
5. WHEN URL contém `?model=jobId` THEN o sistema SHALL carregar o GLB do TripoSR (regressão).
6. WHEN usuário clica em "Load Demo Model" THEN o sistema SHALL renderizar o cubo de demo atual (regressão).
7. WHEN arquivo é inválido (binário corrompido, formato não suportado) THEN o sistema SHALL exibir mensagem de erro clara e não crashar.

**Independent Test:** Subir um `.stl` real (~100k triângulos) e ver renderizado + contagem exibida.

---

### P1: Polygon Decimation ⭐ MVP

**User Story:** Como maker, eu quero reduzir a contagem de triângulos da minha malha para que ela caiba na área de impressão sem perder qualidade visual crítica.

**Why P1:** Meshes de fotos (TripoSR) saem com 200k-500k triângulos; frequentemente acima do que o navegador/fatiador lida bem.

**Acceptance Criteria:**

1. WHEN malha está carregada THEN o sistema SHALL exibir um seletor de qualidade com 4 níveis: Original, Alto (75%), Médio (50%), Baixo (25%).
2. WHEN usuário muda o nível THEN a geometria SHALL ser re-decimada em ≤ 3 segundos para meshes até 500k triângulos.
3. WHEN decimação completa THEN a contagem de triângulos SHALL atualizar imediatamente no painel.
4. WHEN usuário volta para "Original" THEN a geometria SHALL voltar à contagem original sem perda.
5. WHEN malha tem < 1000 triângulos THEN a decimação SHALL ser no-op (avisar: "Já está simples o suficiente").

**Independent Test:** Carregar mesh de 100k triângulos, mover slider para Médio, ver contagem ≈50k.

---

### P1: Face Selection (Manual / Smart / Erase) ⭐ MVP

**User Story:** Como maker, eu quero pintar manualmente a parte da peça que quero remover, OU usar seleção inteligente que pega áreas contíguas, para que eu possa indicar com precisão o que cortar.

**Why P1:** É o input do corte booleano; sem seleção não há corte.

**Acceptance Criteria:**

1. WHEN usuário ativa modo "Manual" e clica em uma face THEN aquela face SHALL ficar destacada (cor de seleção).
2. WHEN usuário ativa modo "Smart" e clica em uma face THEN o sistema SHALL expandir a seleção via flood-fill, aceitando faces vizinhas com ângulo diedro ≤ threshold atual do slider.
3. WHEN usuário move o slider "Área inteligente" entre 5° e 60° THEN o próximo smart-click SHALL usar o novo threshold.
4. WHEN usuário shift+clica em face selecionada (modo Erase) THEN aquela face SHALL sair da seleção.
5. WHEN usuário troca de modo (Manual → Smart) sem confirmar corte THEN a seleção anterior SHALL ser preservada.
6. WHEN geometria é decimada THEN a seleção anterior SHALL ser invalidada e o sistema SHALL limpar a seleção (avisar o usuário).

**Independent Test:** Smart-click com threshold 30° em uma perna → só a perna fica destacada; subir para 60° → pega também a calça.

---

### P1: Fill Holes ⭐ MVP

**User Story:** Como maker, eu quero preencher as imperfeições da minha seleção (faces que o flood-fill perdeu) com um clique, para que o corte fique limpo.

**Why P1:** Semelhante ao vídeo: o usuário aceita imperfeições parciais e usa "preencher tudo por dentro" para limpar.

**Acceptance Criteria:**

1. WHEN usuário clica em "Preencher" com seleção existente THEN o sistema SHALL detectar buracos (raycast externo: faces atingidas = fora; resto = dentro) e adicioná-las à seleção.
2. WHEN o "Preencher" completa THEN a seleção SHALL ser visualmente contínua (sem buracos internos).
3. WHEN não há seleção THEN o botão "Preencher" SHALL estar desabilitado.

**Independent Test:** Smart-click com 30° deixa buracos; clicar Preencher → buracos somem.

---

### P1: Boolean Cut ⭐ MVP

**User Story:** Como maker, eu quero confirmar o corte da minha seleção e receber duas peças prontas para download, para que eu possa mandar a peça menor para a impressora.

**Why P1:** É a funcionalidade central do vídeo.

**Acceptance Criteria:**

1. WHEN usuário clica "Confirmar corte" com seleção não-vazia THEN o sistema SHALL:
   a. Construir um `Brush` fechado da seleção (extrusão ao longo da normal média)
   b. Computar peça A via `SUBTRACTION` (peça original com cavidade)
   c. Computar peça B via `REVERSE_SUBTRACTION` (parte removida)
2. WHEN corte completa THEN o canvas SHALL mostrar ambas as peças (toggleable) e o painel SHALL listar `Part_01_Top` e `Part_02_Bottom` com triangle counts reais.
3. WHEN corte falha (geometria não-manifold) THEN o sistema SHALL exibir mensagem de erro clara e manter o estado anterior.
4. WHEN corte completa THEN o botão "Adicionar pino" SHALL aparecer.

**Independent Test:** Smart-selecionar metade de uma esfera → confirmar corte → ver 2 peças na cena, baixar ambas, abrir em outro viewer e verificar que se encaixam.

---

### P2: Dowel (Pino de Alinhamento)

**User Story:** Como maker, eu quero adicionar pinos (cilindros) na junção das peças cortadas, para que elas se encaixem com precisão ao re-montar.

**Why P2:** Melhora a UX do corte mas não é bloqueante.

**Acceptance Criteria:**

1. WHEN corte completa THEN o sistema SHALL perguntar "Adicionar pino?" com opções Sim/Não.
2. WHEN usuário clica "Sim" THEN um cilindro SHALL aparecer no centro da peça atual, com sliders de diâmetro (1–20mm) e profundidade (1–30mm).
3. WHEN usuário arrasta o pino (TransformControls) THEN o sistema SHALL atualizar a posição em tempo real.
4. WHEN usuário clica "Aplicar na malha" THEN:
   - Peça base: `ADDITION` (cilindro fundido)
   - Peça oposta: `SUBTRACTION` (furo cilíndrico)
5. WHEN aplicação completa THEN a lista de peças SHALL atualizar com a nova geometria (triangle counts).
6. WHEN peça base ou oposta é menor que o pino THEN o sistema SHALL avisar e impedir aplicação.

**Independent Test:** Cortar esfera, adicionar pino, aplicar, baixar, abrir no fatiador → peça base tem cilindro extra, oposta tem furo.

---

### P2: Parts Download

**User Story:** Como maker, eu quero baixar cada peça individualmente ou todas de uma vez em ZIP, para que eu possa enviar direto para o fatiador.

**Why P2:** Sem isso o editor é inútil. Mas baixa prioridade porque é trivial (STLExporter já está pronto).

**Acceptance Criteria:**

1. WHEN há peças geradas THEN o painel SHALL listar cada peça com nome (`Part_NN_Name`), triangle count, e botão "STL".
2. WHEN usuário clica "STL" de uma peça THEN o sistema SHALL baixar `Part_NN_Name.stl` (binário).
3. WHEN usuário clica "Baixar todas" THEN o sistema SHALL baixar `parts.zip` contendo todas as STLs.
4. WHEN não há peças THEN o painel SHALL mostrar "Corte a malha para gerar partes" (atual comportamento).

**Independent Test:** Cortar peça, baixar 2 STLs individuais, baixar ZIP, abrir todos em outro viewer.

---

## Edge Cases

- WHEN geometria importada tem NaN, vertices não-merged, ou é não-manifold THEN o sistema SHALL sanitizar (merge vertices, remove NaN) e avisar se não foi possível.
- WHEN mesh tem > 1M triângulos THEN o sistema SHALL exibir warning sugerindo decimação ou server-side processing.
- WHEN arquivo > 50MB THEN o sistema SHALL rejeitar e sugerir decimação prévia em outra ferramenta.
- WHEN decima para 0 triângulos (slider bug) THEN o sistema SHALL capar no mínimo 100 triângulos.
- WHEN corte resulta em peça vazia THEN o sistema SHALL descartar e avisar.
- WHEN peça tem normal invertida (winding errado) THEN CSG pode falhar; sistema SHALL tentar `geometry.computeVertexNormals()` + flip via `material.side = DoubleSide` no Brush.

## Requirement Traceability

| ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ME-01 | P1: Real Mesh Loading | Design | Pending |
| ME-02 | P1: Polygon Decimation | Design | Pending |
| ME-03 | P1: Face Selection | Design | Pending |
| ME-04 | P1: Fill Holes | Design | Pending |
| ME-05 | P1: Boolean Cut | Design | Pending |
| ME-06 | P2: Dowel | Design | Pending |
| ME-07 | P2: Parts Download | Design | Pending |

**Coverage:** 7 total, 0 mapped to tasks ⚠️ (próximo passo)

## Success Criteria

- [ ] Usuário sobe STL real e vê triangle count correto (± 0 do real).
- [ ] Decimação client-side completa em ≤ 3s para 500k triângulos.
- [ ] Smart selection com slider 30° pega só a face-alvo; 60° pega grupo maior.
- [ ] Corte booleano gera 2 peças que se encaixam perfeitamente.
- [ ] Pino aplicado cria cilindro em uma peça e furo na outra, alinhados.
- [ ] Download individual baixa STL válido; ZIP descompacta com N STLs.
