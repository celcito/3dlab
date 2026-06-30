# AI 3D Providers — Alternativas ao TripoSR self-hosted

**Created:** 2026-06-29
**Status:** Análise / decisão pendente
**Contexto:** L-018 — host sem GPU NVIDIA; container `triposr` pesado (~5GB) roda em CPU. F3.4 planeja adicionar SDXL-Turbo (mais +5GB). Self-host escala mal.

---

## Por que considerar alternativas

- Container `triposr` é single-image, mas CPU-only leva **3–5 min/geração**
- Manter 2+ modelos pesados (TripoSR + SDXL-Turbo) exige RAM generosa
- Sem GPU no host, qualquer modelo PyTorch fica inviável para uso interativo
- APIs externas melhoram a cada mês; self-host fica defasado

---

## Opções de API externa

| Serviço | Input | Custo aprox. | Observação |
|---|---|---|---|
| **Tripo3D API** (mesmo time do TripoSR) | texto / imagem | ~$0.10–0.30/geração | Drop-in natural, melhor qualidade que self-host |
| **Meshy.ai** | texto / imagem / multi-view | ~$0.10–0.50 | Tem tier free limitado |
| **Stability AI** (Stable Fast 3D) | imagem única | ~$0.20/imagem | 1 imagem → mesh em ~1s; **mais barato** |
| **Rodin (Hyper3D)** | texto / imagem | free tier generoso | Boa topologia |
| **Luma Genie** | texto | free tier | Mais limitado |
| **Replicate / fal.ai** | vários modelos sob demanda | pay-per-second | Flexível, escolhe o modelo |

## Opções de modelo local mais leve (mantém self-hosted)

- **TripoSR com OpenVINO** — quantizado, CPU decente (~2–3 min)
- **CRM (Concurrent Readout Mesh)** — mais rápido que TripoSR, single-image
- **LGM (Large Multi-View Gaussian)** — multi-view, melhor qualidade
- **OpenLRM** — menor (~1GB), qualidade inferior

---

## Recomendação

### Curto prazo
Manter TripoSR self-hosted, mas adicionar **Stability AI Stable Fast 3D como provider opcional** atrás de uma flag:
- Quando `STABILITY_API_KEY` estiver setado, usa a API.
- Caso contrário, cai para o container local.
- Self-hosted continua sendo o default (atende `Constraint: "self-hosted"`).

### Longo prazo
Tornar TripoSR um **provider plugável**:
- `/api/generate` aceita `provider: "triposr" | "stable-fast-3d" | "tripo3d"`.
- Mesma interface, swap transparente.
- Casa com a spec self-hosted e dá fallback.
- Permite combinar: texto externo (Tripo3D) + decimation local (rápida e free).

---

## Próximos passos (quando aprovado)

1. Adicionar `STABILITY_API_KEY` ao `.env.example`.
2. Criar `lib/providers/stableFast3d.ts` com adapter thin.
3. Modificar `python/app.py` `/generate` para aceitar `provider` opcional.
4. Adicionar dropdown "Provider" no `ImageTo3D.tsx`.
5. Adicionar métricas de custo/latência no `STATE.md` (nova seção "AI Provider Stats").
