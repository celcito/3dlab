# Cookie Cutter Maker — Specification

Transformar qualquer desenho 2D (SVG) em um cortador de biscoitos imprimível em impressoras 3D, com editor vetorial integrado, parâmetros configuráveis, visualização 3D, multi-peça e sistema de projetos.

## Problem Statement

Usuários que desejam criar cortadores de biscoito personalizados hoje precisam de 3 ferramentas separadas: um editor vetorial (Illustrator/Inkscape) para o desenho, um software 3D (Blender/Fusion) para modelar o cortador, e um fatiador (Cura/PrusaSlicer) para preparar a impressão. Não existe uma ferramenta web integrada que faça o caminho completo: desenho 2D → cortador 3D → STL pronto para imprimir. O 3dlab já tem infraestrutura de edição 3D (mesh-editor), visualização (R3F), CSG (three-bvh-csg) e exportação (STLExporter + JSZip) — a feature cookie-cutter preenche a lacuna do desenho 2D + pipeline de geração automatizada.

## Goals

- [ ] Editor vetorial 2D integrado (desenho, upload SVG, formas, texto→curvas, transformações)
- [ ] Suporte a múltiplas peças (vários cortadores no mesmo projeto)
- [ ] Auto-correção de SVGs inválidos (preview + confirmação)
- [ ] Pipeline 3D completo: offset → extrude → CSG → união
- [ ] Visualização 3D interativa (R3F, rotação, zoom, wireframe/sólido, dimensões)
- [ ] Parâmetros configuráveis (altura, espessuras, offset, tolerância, cantos)
- [ ] Alças automáticas e reforços estruturais para cortadores grandes
- [ ] Emboss/Deboss (carimbo) para detalhes na massa
- [ ] Estimativa de tempo de impressão e consumo de filamento
- [ ] Perfis de impressora (6 prontos + custom)
- [ ] Thumbnails renderizados dos modelos
- [ ] Exportação multi-formato (STL, OBJ, 3MF, GLB, SVG)
- [ ] Sistema de projetos (salvar, versões, duplicar, favoritar, excluir)

## Out of Scope

| Feature | Reason |
|---|---|
| Fatiador real (G-code) | Domínio de outro app; integração out of scope |
| Edição 3D pós-geração (vertex/edge) | Já coberto pelo mesh-editor; usuário exporta STL e edita no Viewer3D |
| Compartilhamento online / URL pública | Self-hosted; out of scope v1 |
| Impressão direta (envio à impressora) | Requer WebUSB/OctoPrint API; complexo |
| Multi-usuário / auth / cloud | App local/self-hosted |
| Animações / física do cortador | Visual apenas; sem simulação |
| Importação de fontes do sistema (não TTF/OTF) | Apenas TTF/OTF via opentype.js + fontes web |
| G-code preview / layer-by-layer | Escopo de fatiador |
| Cortadores articulados / multi-part | v1 foca em cortador simples de 1 peça |

---

## User Stories

### P1: Editor 2D — Upload e desenho ⭐ MVP

**Why P1:** Sem editor 2D, não há input para o pipeline 3D.

**Acceptance Criteria:**

1. WHEN usuário faz upload de um arquivo `.svg` THEN o sistema SHALL parsear os paths e renderizá-los no canvas 2D em ≤ 1s
2. WHEN o SVG importado contém auto-interseções, paths abertos, pontos duplicados ou winding invertido THEN o sistema SHALL exibir o `FixReportDialog` com preview side-by-side (antes/depois) listando cada tipo de correção e contagem
3. WHEN usuário confirma as correções no FixReportDialog THEN o sistema SHALL aplicar as correções e remover o diálogo
4. WHEN usuário recusa as correções THEN o sistema SHALL manter o SVG original (sem correções)
5. WHEN usuário clica em uma forma da ShapeLibrary (círculo, estrela, coração, hexágono, retângulo) THEN a forma SHALL ser adicionada ao centro da tela na peça ativa
6. WHEN usuário clica no botão "T" (texto) THEN um modal SHALL abrir com campo de texto + seletor de fonte (web-safe + upload) + input de tamanho
7. WHEN usuário confirma o texto no modal THEN o texto SHALL ser convertido em curvas (path SVG) e adicionado à peça ativa
8. WHEN usuário clica em "Mover" THEN arrastar um shape SHALL transladar em X/Y com snap à grade quando ativado
9. WHEN usuário clica em "Escalar" THEN arrastar os handles de canto SHALL redimensionar o shape mantendo proporção (shift desativa proporção)
10. WHEN usuário clica em "Rotacionar" THEN arrastar o handle de rotação SHALL girar o shape ao redor do seu centro em incrementos de 15° com shift
11. WHEN usuário clica em "Espelhar H" ou "Espelhar V" THEN o shape selecionado SHALL ser espelhado horizontal ou verticalmente
12. WHEN usuário pressiona Ctrl+Z THEN o sistema SHALL desfazer a última ação
13. WHEN usuário pressiona Ctrl+Shift+Z THEN o sistema SHALL refazer a última ação desfeita
14. WHEN usuário rola a roda do mouse THEN o canvas SHALL aplicar zoom in/out centrado no cursor
15. WHEN usuário arrasta com o botão do meio do mouse THEN o canvas SHALL aplicar pan

**Independent Test:** Subir SVG de estrela, adicionar texto "STAR", espelhar, ver shapes no canvas.

---

### P1: Multi-peça ⭐ MVP

**Why P1:** O modelo de dados precisa suportar múltiplos cortadores desde o início.

**Acceptance Criteria:**

1. WHEN usuário clica em "Nova peça" no Toolbar2D THEN uma nova peça vazia SHALL ser criada com nome "Peça N"
2. WHEN há múltiplas peças THEN o sistema SHALL exibir abas (`<PieceTabs>`) para alternar entre peças
3. WHEN usuário alterna de peça THEN o canvas 2D SHALL exibir apenas os shapes da peça ativa
4. WHEN usuário clica com botão direito na aba THEN um menu contextual SHALL oferecer "Renomear" e "Excluir"
5. WHEN usuário exclui uma peça (se houver >1) THEN a peça SHALL ser removida e a aba anterior SHALL ser ativada
6. WHEN há apenas 1 peça THEN o botão "Excluir" e as abas SHALL estar ocultos/minimizados
7. WHEN usuário insere uma forma da ShapeLibrary com múltiplas peças existentes THEN um prompt SHALL perguntar "Adicionar à peça ativa ou Criar nova peça?"

**Independent Test:** Criar 3 peças, adicionar estrela à peça 1, coração à peça 2, alternar abas, ver shapes corretos.

---

### P2: Pipeline 3D — Geração do cortador

**Why P2:** É o core da feature; sem geração 3D, o editor 2D não tem propósito.

**Acceptance Criteria:**

1. WHEN parâmetros do cortador são alterados (altura, espessura, offset, etc.) THEN o pipeline 3D SHALL ser re-executado (debounce 300ms) e o preview 3D SHALL ser atualizado em ≤ 2s para shapes ≤ 500 segmentos
2. WHEN o pipeline executa THEN a parede, lâmina, base e reforços SHALL ser gerados como meshes 3D separados e unidos via CSG ADDITION
3. WHEN a espessura da parede é configurada para 1.5mm THEN o offset interno SHALL criar uma parede de aproximadamente 1.5mm de espessura uniforme (variação < 10%)
4. WHEN o cortador tem dimensão máxima < 50mm THEN alças NÃO devem ser geradas (mesmo com `handles.enabled=true`)
5. WHEN o cortador tem dimensão máxima ≥ 50mm e `handles.enabled=true` THEN 1 ou 2 alças SHALL ser geradas (dependendo de `count`)
6. WHEN `reinforcements.auto=true` e o perímetro > 200mm THEN ribs estruturais SHALL ser gerados uniformemente ao longo da parede
7. WHEN o resultado CSG union tem < 100 triângulos THEN o sistema SHALL exibir aviso "Cortador pode ser muito fino — verifique as espessuras"
8. WHEN a peça ativa tem `embosseShapes.length > 0` THEN o sistema SHALL aplicar carimbos na lâmina conforme `embosseMode`
9. WHEN `embosseMode` é "deboss" THEN os carimbos SHALL aparecer como recessos na face inferior (subtraídos da lâmina)
10. WHEN `embosseMode` é "emboss" THEN os carimbos SHALL aparecer como relevos (adicionados à lâmina)

**Independent Test:** Criar estrela 80mm, altura 25mm, wall 1.5mm, blade 1.0mm → ver wall oco + blade inferior + alça gerada.

---

### P2: Visualização 3D

**Why P2:** Essencial para o usuário visualizar o resultado antes de exportar.

**Acceptance Criteria:**

1. WHEN o canvas R3F renderiza THEN o usuário SHALL poder rotacionar livremente com botão esquerdo, fazer pan com botão direito, e zoom com scroll
2. WHEN há múltiplas peças THEN elas SHALL ser dispostas em grid automático no plano XY com spacing uniforme
3. WHEN o toggle "Wireframe" é ativado THEN todos os meshes SHALL mudar para wireframe (material `wireframe: true`)
4. WHEN o toggle "Dimensões" é ativado THEN readouts SHALL mostrar largura, altura e profundidade do cortador ativo
5. WHEN o preview 3D carrega THEN grade, luz ambiente + direcional, e sombras SHALL estar ativas por padrão

**Independent Test:** Criar 2 peças, ver grid no preview, rotacionar, alternar wireframe, ver dimensões.

---

### P2: Parâmetros do cortador

**Why P2:** O usuário precisa controlar as dimensões do cortador para cada impressora/material.

**Acceptance Criteria:**

1. WHEN usuário move o slider "Altura do cortador" (5–80mm) THEN o preview 3D SHALL atualizar a altura da parede em ≤ 500ms
2. WHEN usuário move o slider "Espessura da parede" (0.8–4mm) THEN o offset interno SHALL recalcular
3. WHEN usuário move o slider "Espessura da lâmina" (0.4–3mm) THEN a altura da lâmina inferior SHALL atualizar
4. WHEN usuário move o slider "Espessura da base" (0–5mm) THEN a placa base SHALL aparecer/desaparecer/engrossar
5. WHEN usuário seleciona um perfil de impressora (ex: "Prusa MK4") THEN os sliders SHALL ter seus valores mínimos travados nos mínimos do perfil
6. WHEN o cortador excede a área útil do perfil selecionado THEN um warning SHALL aparecer "Cortador excede a área de impressão (250×210mm)"
7. WHEN usuário altera o material do filamento (PLA/PETG/ABS/TPU) THEN a estimativa de peso e custo SHALL recalcular automaticamente

**Independent Test:** Ajustar todos os sliders, ver cortador atualizar; selecionar Ender3, ver warning se cortador > 180mm.

---

### P2: Exportação

**Why P2:** Sem exportação, o cortador não chega à impressora.

**Acceptance Criteria:**

1. WHEN usuário clica "Baixar STL" THEN um arquivo `.stl` binário SHALL ser baixado com a geometria combinada (union) da peça ativa
2. WHEN usuário clica "Baixar todas (ZIP)" THEN um arquivo `.zip` SHALL conter STLs individuais por peça (`Piece_01_Estrela.stl`, `Piece_02_Coracao.stl` etc.) + `combined.stl`
3. WHEN usuário clica "Baixar OBJ" / "Baixar 3MF" / "Baixar GLB" THEN o formato correspondente SHALL ser exportado
4. WHEN usuário clica "Baixar SVG" THEN o SVG editado da peça ativa SHALL ser baixado (sem parâmetros 3D)
5. WHEN o arquivo exportado é aberto no PrusaSlicer/Cura THEN a geometria SHALL ser válida (não-manifold, orientação correta)

**Independent Test:** Exportar STL de estrela 80mm, abrir no PrusaSlicer, verificar dimensões e paredes.

---

### P2: Estimativa de impressão

**Why P2:** Ajuda o usuário a decidir se vale a pena imprimir (tempo/custo).

**Acceptance Criteria:**

1. WHEN o pipeline 3D completa THEN o painel de estimativa SHALL mostrar: volume (cm³), peso (g), comprimento de filamento (m), tempo estimado (h), custo (R$)
2. WHEN usuário altera o custo do filamento (R$/kg) THEN o custo estimado SHALL recalcular em ≤ 50ms
3. WHEN usuário altera o material (densidade diferente) THEN peso e custo SHALL recalcular
4. WHEN há disclaimer de precisão (±30%) THEN o texto SHALL ser visível abaixo da estimativa

**Independent Test:** Cortador padrão 80mm, PLA R$80/kg → ver ~15-20g, R$1.20-1.60.

---

### P2: Unit Toggle (mm ↔ cm)

**Why P2:** Usuários de diferentes regiões preferem unidades diferentes; toggle simples melhora acessibilidade sem quebrar compatibilidade.

**Acceptance Criteria:**

1. WHEN o sistema inicia pela primeira vez THEN a unidade padrão SHALL ser "mm" (armazenada em localStorage)
2. WHEN usuário clica no toggle "cm" no header THEN todos os sliders e labels SHALL exibir valores em cm (ex: "1,5 cm" em vez de "15.0 mm")
3. WHEN usuário recarrega a página THEN a unidade selecionada SHALL persistir (localStorage)
4. WHEN a unidade é "cm" THEN os valores exportados (STL, 3MF, etc.) e armazenados (CutterParams) SHALL permanecer em mm (conversão de display apenas)
5. WHEN a unidade é "cm" THEN o DimensionOverlay no 3D SHALL mostrar labels em cm com sufixo "cm"
6. WHEN a unidade é "cm" THEN o EstimatePanel SHALL manter g, m, h, R$ (não são dimensões)

**Independent Test:** Alternar entre mm e cm, ver slider "Altura 25.0 mm" → "Altura 2,5 cm", recarregar página, toggle persistido.

---

### P2: Bambu Lab A1 Export (3MF com perfil)

**Why P2:** Bambu Lab é uma das impressoras 3D mais populares; exportar com perfil correto remove fricção do fluxo de impressão.

**Acceptance Criteria:**

1. WHEN usuário clica "Baixar 3MF (Bambu A1)" THEN um arquivo .3mf válido SHALL ser baixado contendo geometria + perfil da A1
2. WHEN o arquivo é aberto no Bambu Studio THEN o perfil da impressora SHALL ser automaticamente reconhecido como "Bambu Lab A1" (sem reconfiguração manual)
3. WHEN o arquivo é aberto THEN as configurações de slice SHALL estar preenchidas: layer height 0.2mm, infill 15% gyroid, 3 walls, brim 5mm, PLA 1.75mm 220°C/60°C
4. WHEN o arquivo é aberto THEN a geometria SHALL estar centralizada na placa de impressão (plate 1, posição 0,0)
5. WHEN o arquivo é aberto THEN o Bambu Studio NÃO SHALL exibir warnings de metadata ausente ou corrompida
6. WHEN usuário clica "Baixar 3MF" (legado, sem perfil) THEN um .3mf genérico SHALL ser baixado (compatível com qualquer slicer)
7. WHEN usuário seleciona filamento PETG no ParameterPanel THEN o perfil Bambu SHALL usar 240°C/80°C (PETG auto-adaptado)

**Independent Test:** Baixar 3MF (Bambu A1), abrir no Bambu Studio, verificar que perfil A1 está aplicado, clicar "Slice" → sem erros.

---

### P3: Printer Config (infra v1)

**Why P3:** Prepara infraestrutura para v2 (envio direto WiFi/MQTT); já permite ao usuário organizar suas impressoras.

**Acceptance Criteria:**

1. WHEN usuário clica "Configurar impressoras" no ParameterPanel THEN um modal SHALL abrir com lista de impressoras salvas
2. WHEN usuário adiciona uma impressora (nome + tipo + IP + access code) THEN ela SHALL ser salva em localStorage
3. WHEN usuário edita ou deleta uma impressora THEN a mudança SHALL persistir em localStorage
4. WHEN modal fecha e reabre THEN as impressoras salvas SHALL estar presentes
5. WHEN botão "Testar conexão" é clicado THEN um placeholder SHALL mostrar "Envio direto via WiFi: em breve (v2)"

**Independent Test:** Adicionar 2 impressoras, fechar modal, reabrir, ver ambas listadas, deletar uma.

---

### P3: Sistema de projetos

**Why P3:** Permite ao usuário salvar, versionar e gerenciar seus designs.

**Acceptance Criteria:**

1. WHEN usuário clica "Salvar" THEN o sistema SHALL criar uma nova versão do projeto com thumbnail, parâmetros e cena 2D serializados
2. WHEN o projeto é salvo THEN um toast "Projeto salvo (versão 5)" SHALL aparecer
3. WHEN usuário clica "Meus projetos" THEN uma galeria em grid SHALL mostrar todos os projetos com thumbnail 64×64, nome, data e estimativa
4. WHEN usuário clica em um card de projeto THEN o projeto SHALL ser carregado (cena 2D + parâmetros + preview 3D regenerado)
5. WHEN usuário clica "Duplicar" THEN uma cópia independente do projeto SHALL ser criada com nome "Nome (cópia)"
6. WHEN usuário clica "Favoritar" THEN o projeto SHALL ser marcado como favorito e posicionado no topo da galeria
7. WHEN usuário clica "Excluir" THEN uma confirmação SHALL aparecer; ao confirmar, o projeto e todas as versões SHALL ser removidos
8. WHEN usuário clica "Versões" THEN um modal SHALL mostrar timeline de versões com data de cada uma; clicar em uma versão carrega aquele snapshot
9. WHEN há >50 versões THEN as 10 mais recentes + 40 random SHALL ser mantidas; as demais SHALL ser automaticamente removidas

**Independent Test:** Criar projeto "Natal", salvar 2 versões, recarregar página, listar projetos, abrir, ver versão correta.

---

## Edge Cases

- WHEN SVG importado tem 0 paths visíveis THEN o sistema SHALL exibir "SVG vazio — nenhum path encontrado"
- WHEN usuário tenta exportar sem geometria gerada THEN export SHALL estar desabilitado
- WHEN geometria 3D excede 500k triângulos THEN o sistema SHALL exibir warning e sugerir decimação
- WHEN offset 2D falha (polígono extremamente côncavo) THEN o sistema SHALL aplicar scale uniforme como fallback com aviso "Offset aproximado"
- WHEN peça é deletada e era a única THEN o sistema SHALL criar automaticamente uma nova peça vazia
- WHEN todos os shapes de uma peça são deletados THEN a peça SHALL permanecer (vazia) com warning "Peça sem geometria"
- WHEN CSG produz mesh vazio (spessura muito fina) THEN warning "Cortador degenerado — ajuste a espessura"
- WHEN fonte TTF não pode ser carregada THEN fallback para fonte system sans-serif
- WHEN localStorage está cheio (perfis custom) THEN aviso e sugestão de remover perfis antigos
- WHEN API de projetos falha com 500 THEN retry automático 1×; on permanent fail: aviso com opção de tentar novamente

## Requirement Traceability

| ID | Story | Phase | Status |
|---|---|---|---|
| CC-01 | P1: Editor 2D — Upload e desenho | F1 | Pending |
| CC-02 | P1: Multi-peça | F1 | Pending |
| CC-03 | P2: Pipeline 3D — Geração do cortador | F2 | Pending |
| CC-04 | P2: Visualização 3D | F2 | Pending |
| CC-05 | P2: Parâmetros do cortador | F2 | Pending |
| CC-06 | P2: Exportação | F2 | Pending |
| CC-07 | P2: Estimativa de impressão | F2 | Pending |
| CC-09 | P2: Unit Toggle (mm ↔ cm) | F2 | Pending |
| CC-10 | P2: Bambu Lab A1 Export (3MF) | F2 | Pending |
| CC-08 | P3: Sistema de projetos | F3 | Pending |
| CC-11 | P3: Printer Config (infra) | F3 | Pending |

**Coverage:** 11 total, 0 mapped to tasks (próximo passo: `tasks.md`)

## Success Criteria

- [ ] Usuário faz upload de SVG com auto-interseções, vê preview side-by-side, confirma correções, shapes renderizam corretos
- [ ] Usuário cria 3 peças, adiciona formas e texto a cada uma, alterna abas, shapes são independentes
- [ ] Cortador 3D com parede + lâmina + base + alças + ribs é gerado em < 2s para shape < 500 segmentos
- [ ] Offset interno produz parede de espessura uniforme (±10% do valor configurado)
- [ ] Preview 3D tem rotação livre, wireframe toggle, grid de peças, dimensões visíveis
- [ ] Perfil Ender3 trava sliders e emite warning se cortador > 180mm
- [ ] STL exportado abre no PrusaSlicer com dimensões e geometria corretas
- [ ] Toggle mm/cm persiste em localStorage; sliders e labels atualizam corretamente
- [ ] 3MF Bambu A1 exportado abre no Bambu Studio com perfil correto, sem warnings
- [ ] Estimativa mostra ~15-20g, ~2-3h para cortador 80mm PLA padrão
- [ ] Projeto salvo sobrevive a refresh; thumbnail aparece na galeria; versão anterior é carregável
- [ ] Duplicar cria cópia independente; excluir remove diretório; favoritar move para topo
