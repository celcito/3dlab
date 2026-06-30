# Mesh Editor — Context Decisions

Captura das decisões de design tiradas com o usuário durante a fase de discussão.

## Decisions Log

### DC-01: Decimation roda 100% no client (2026-06-29)

**Question:** Onde rodar a decimação de polígonos?

**Options considered:**
- Client-side com SimplifyModifier
- Server-side com trimesh.simplify_quadric_decimation (Python)
- Híbrido

**Decision:** Client-side com `SimplifyModifier`.

**Rationale:** Round-trip zero, sem upload, resposta instantânea, sem custo de servidor. Cobre 90% dos casos reais (até ~500k triângulos). Bibliotecas já disponíveis em `node_modules/three/examples/jsm/modifiers/`.

**Trade-off:** Acima de ~1M triângulos o browser pode engasgar. Mitigação: warning de "malha muito pesada, considere decimação prévia" + future server-side fallback (F2.2).

---

### DC-02: Pino é cilindro 3D real com CSG union (2026-06-29)

**Question:** Como modelar o pino (dowel)?

**Options considered:**
- Cilindro + boolean union (3D real que altera geometria)
- Apenas visual (decorativo, sem CSG)

**Decision:** Cilindro 3D + CSG union.

**Rationale:** Fiel ao vídeo de referência. O pino de fato altera a geometria das duas peças: uma fica com um cilindro extra (ADDITION), a outra com um furo cilíndrico (SUBTRACTION). Isso garante alinhamento mecânico real.

**Trade-off:** Mais complexo (2 operações CSG extras). Mitigação: reusa mesmo pipeline CSG do F1.5.

---

### DC-03: Manter demo cube e TripoSR, adicionar upload local (2026-06-29)

**Question:** Manter o demo cube e o fluxo TripoSR no Viewer3D?

**Options considered:**
- Manter ambos + adicionar upload (3 vias)
- Substituir demo por upload, manter TripoSR
- Substituir tudo por upload local only

**Decision:** Manter ambos, adicionar upload como terceira via.

**Rationale:** Não quebra fluxos existentes. Usuário pode: (a) testar com demo cube sem ter arquivo, (b) vir do TripoSR via `?model=jobId`, (c) subir arquivo local.

**Trade-off:** Ligeira complexidade na UI (3 modos de origem). Mitigação: `MeshSource` union type isola a complexidade.

---

### DC-04: JSZip + file-saver para "Baixar todas" (2026-06-29)

**Question:** Quais bibliotecas adicionais instalar?

**Options considered:**
- jszip + file-saver
- Nada (apenas download individual)

**Decision:** jszip + file-saver.

**Rationale:** Padrão da indústria, ~30KB gzipped, suporta STL binário. Oferece o "baixar todas" do vídeo.

**Trade-off:** +2 deps. Aceitável.

---

### DC-05: Sempre embrulhar geometria em `Brush` antes de CSG (2026-06-29)

**Question:** Como chamar three-bvh-csg corretamente?

**Decision:** Sempre `new Brush(geometry)` antes de passar para `Evaluator`.

**Rationale:** API da lib exige isso (`Brush extends Mesh`). Geometria raw não compila.

**Trade-off:** Boilerplate em cada operação. Mitigação: wrapper `src/lib/booleanCut.ts` isola.

---

## Open Questions

_Nenhuma no momento. Todas as decisões críticas foram tomadas._
