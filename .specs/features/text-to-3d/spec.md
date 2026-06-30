# Text-to-3D Pipeline Specification

Chaining a text-to-image model (Stable Diffusion XL Turbo) with TripoSR, exposed via the existing job/SSE infrastructure, so the user can go from `prompt` → `model.glb` in one request.

## Problem Statement

Today the `ImageTo3D` page only accepts an image upload. Users who want to generate a 3D model from a text description (e.g. "a red toy car") must first generate an image in a separate tool, save it, and re-upload. Adding a `POST /api/text-to-3d` endpoint that internally does `text → image → mesh` removes that friction and keeps the whole flow inside 3dlab.

## Goals

- [ ] User submits a text prompt + optional resolution and receives a `jobId`
- [ ] Backend loads SDXL-Turbo, generates a 512×512 image, then loads TripoSR and reconstructs the mesh
- [ ] Same job/SSE/result format as existing `/api/img2-3d/*` (no new client infra)
- [ ] Works on CPU today (slow, but functional) and on CUDA when GPU is available (no code change needed)
- [ ] Memory safe: SDXL-Turbo is unloaded before TripoSR loads (avoids OOM on 8GB GPUs)

## Out of Scope

| Feature | Reason |
| --- | --- |
| Multiple text-to-image model choices (FLUX, SD 1.5, etc.) | SDXL-Turbo chosen for size/quality balance. Can add env var override later. |
| Batch text-to-3D from prompt list | The existing multi-image path is image-based; a prompt list can be added on top of this later. |
| Inpainting / img2img | Pure txt2img only for v1. |
| Caching generated images per prompt | Adds complexity; not needed at low traffic. |

---

## User Stories

### P1: Text → 3D MVP ⭐

**User Story:** As a maker, I want to type a description (e.g. "a wooden toy boat") and get a 3D mesh, so I can iterate on ideas without leaving the app.

**Why P1:** This is the whole feature. Without it nothing ships.

**Acceptance Criteria:**

1. WHEN user submits a non-empty `prompt` via `POST /api/text-to-3d` THEN the system SHALL return `{ jobId }` within 1 second
2. WHEN the job runs THEN the system SHALL emit SSE progress events covering: `loading_text_model`, `generating_image`, `text_model_unloaded`, `loading_model`, `model_loaded`, `preprocessing_done`, `inference_done`, `converting_formats`, `complete`
3. WHEN the job succeeds THEN the system SHALL produce `model.glb`, `model.obj`, `model.stl` in `tmp/jobs/{jobId}/`
4. WHEN the system detects `torch.cuda.is_available() === false` THEN it SHALL use CPU for both models and log a warning (no crash)
5. WHEN the job fails (OOM, network, model error) THEN the SSE stream SHALL emit a final `progress` event with `status="error"` and a human-readable message
6. WHEN the user does not supply `mc_resolution` THEN the system SHALL default to `256`

**Independent Test:** `curl -X POST /api/text-to-3d -F "prompt=a red apple"` returns a jobId; SSE stream eventually reaches `status="done"` with files in the job dir.

---

### P2: Prompt enhancement

**User Story:** As a maker, I want the system to automatically phrase my prompt for clean object isolation, so the generated mesh has a clean background.

**Why P2:** Default-on; can be disabled. TripoSR works much better on white-background single objects.

**Acceptance Criteria:**

1. WHEN `clean_prompt` is not provided THEN the system SHALL append `, product photo, white background, studio lighting, single object, no shadows, centered` to the prompt
2. WHEN `clean_prompt=false` THEN the system SHALL pass the prompt verbatim
3. WHEN the system appends THEN the final prompt SHALL still be ≤ 200 tokens (well within SDXL-Turbo's 77-token limit by truncating the user portion)

**Independent Test:** Submit same prompt with and without `clean_prompt=false`; verify different image outputs (or different internal prompt strings in logs).

---

### P2: Resolution passthrough

**User Story:** As a maker, I want to choose between Standard (256) and High (512) mesh resolution for the generated object, so I can trade off detail vs speed.

**Why P2:** Same UX as the existing image path; consistency.

**Acceptance Criteria:**

1. WHEN the request includes `mc_resolution=512` THEN the system SHALL pass 512 to TripoSR's `infer()`
2. WHEN the request omits `mc_resolution` THEN the system SHALL use 256
3. WHEN the value is not in `{128, 256, 384, 512}` THEN the system SHALL return HTTP 400

**Independent Test:** Submit with `mc_resolution=512`; verify X-Target-Faces header reflects a denser mesh.

---

## Edge Cases

- WHEN prompt is empty string THEN return HTTP 400 ("prompt must not be empty")
- WHEN SDXL-Turbo model download fails (no network) THEN job SHALL fail with `error="Failed to download SDXL-Turbo"`
- WHEN TripoSR fails on the generated image THEN job SHALL still succeed at the text step but emit `error="TripoSR inference failed: <msg>"` at the mesh step
- WHEN the generated image is < 64×64 (model degenerate output) THEN TripoSR SHALL still attempt and likely fail gracefully with a clear message
- WHEN user requests 8 simultaneous text-to-3D jobs THEN each SHALL run in its own thread; memory may OOM — caller responsibility, but documented in the API

## Requirement Traceability

| ID | Story | Status |
| --- | --- | --- |
| TXT-01 | P1: text-to-3d MVP | Pending |
| TXT-02 | P2: prompt enhancement | Pending |
| TXT-03 | P2: resolution passthrough | Pending |

## Success Criteria

- [ ] End-to-end text → 3D works on CPU in < 5 min
- [ ] Same SSE format as existing image-to-3d, so the client UI can be minimal
- [ ] GPU path (when available) uses < 8GB peak VRAM thanks to unload before TripoSR
- [ ] Zero regressions on existing `/api/img2-3d/*` endpoints
