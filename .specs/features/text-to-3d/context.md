# Text-to-3D — Context Decisions

User decisions captured during the planning phase. These are the inputs that drove the design in `design.md`.

## Decisions Log

### DC-01: GPU is temporary — code must work on CPU now and CUDA later (2026-06-29)

**Question:** Você está rodando CPU-only agora (sem GPU nvidia). Como prosseguir?

**Options considered:**
- CPU-only permanente
- GPU em breve (chosen)
- Pular feature

**Decision:** GPU is coming, so `text_to_image.py` and the inference flow MUST auto-detect `torch.cuda.is_available()` and use CUDA when present, CPU otherwise. The user's container is currently CPU-only because the host has no NVIDIA driver, but the same code will accelerate 5-10× once a GPU arrives.

**Trade-off:** None significant. The auto-detect pattern is what `triposr_runner.py` already uses.

**Impact:** `text_to_image.py` mirrors the existing `pipeline.to(device)` pattern from `triposr_runner.py`. The `text_to_image` module adds `pipe.to(device)` next to `unload_pipe()`. No conditional code paths.

---

### DC-02: SDXL-Turbo is acceptable at ~3 min/image on CPU (2026-06-29)

**Question:** SDXL-Turbo em CPU leva ~2-5 min por imagem. Aceitável?

**Options considered:**
- Sim, ~3 min é aceitável (chosen)
- Usar SD 1.5 (mais rápido)
- Só quando houver GPU

**Decision:** Acceptable. SD 1.5 would be faster but worse quality; hiding the feature until GPU exists blocks the workflow entirely.

**Trade-off:** Slow first-request (cold load of SDXL-Turbo from HuggingFace). After that, sequential requests are still slow but cached.

**Impact:** Document expected latency in the API docs and client tooltip ("~3-5 min on CPU, ~30s on GPU"). No code change.

---

### DC-03: Single container, no separate microservice (2026-06-29)

**Question:** Único container com os dois modelos, ou dois serviços separados?

**Options considered:**
- Único container (chosen, from previous session)
- Dois microsserviços

**Decision:** Single container. Simpler orchestration, lower overhead, fits the existing `docker-compose.yml` pattern.

**Trade-off:** Both models can't be in VRAM simultaneously. The `unload_pipe()` step before TripoSR ensures this.

**Impact:** All code in `python/`. No new service in `docker-compose.yml`. Dockerfile gets diffusers/accelerate/safetensors added.

---

### DC-04: SDXL-Turbo is the chosen model (2026-06-29)

**Question:** Qual modelo text-to-image?

**Options considered:**
- SDXL-Turbo (chosen)
- FLUX.1-schnell
- Stable Diffusion 1.5

**Decision:** SDXL-Turbo — best quality/size balance for 8GB VRAM. 4 inference steps, `guidance_scale=0.0` per the official Turbo recommendation. AutoPipelineForText2Image loads it directly from `stabilityai/sdxl-turbo`.

**Trade-off:** Requires accepting the diffusers API surface (`AutoPipelineForText2Image`). Mitigated by lazy import inside `load_pipe()`.

**Impact:** The `text_to_image.py` module imports `from diffusers import AutoPipelineForText2Image`.

---

## Open Questions

_Nenhuma no momento. Todas as decisões críticas foram tomadas._
