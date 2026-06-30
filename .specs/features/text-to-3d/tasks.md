# Text-to-3D — Atomic Tasks

## Task Index

| ID | Task | Phase | Deps | Status | Spec IDs |
| --- | --- | --- | --- | --- | --- |
| T1 | Create `python/text_to_image.py` with load/unload/generate | Backend | — | Pending | TXT-01 |
| T2 | Add `POST /text-to-3d` endpoint + `_run_text_to_3d` to `app.py` | Backend | T1 | Pending | TXT-01, TXT-02, TXT-03 |
| T3 | Add `diffusers`, `accelerate`, `safetensors` to `python/Dockerfile` | Backend | — | Pending | TXT-01 |
| T4 | Add `POST /api/text-to-3d` proxy to `server.ts` | Node | T2 | Pending | TXT-01 |
| T5 | Add "Texto → 3D" tab + prompt input to `ImageTo3D.tsx` | UI | T4 | Pending | TXT-01, TXT-03 |
| T6 | Rebuild triposr image and verify chain | Verify | T1-T5 | Pending | TXT-01 |
| T7 | Update STATE.md and ROADMAP.md | Docs | T6 | Pending | — |

## Task Details

### T1: Create `python/text_to_image.py`

**What:** New module wrapping SDXL-Turbo via diffusers. Exposes `load_pipe`, `unload_pipe`, `generate_image`. Auto-detects CUDA.

**Where:** `python/text_to_image.py` (new file)

**Depends on:** —

**Reuses:** Auto-detect pattern from `triposr_runner.py`

**Done when:**
- File exists with the three functions
- `from text_to_image import generate_image` works in `app.py`
- `load_pipe()` is a singleton (only loads once)
- `unload_pipe()` releases both the pipe and CUDA cache
- `generate_image` accepts `(prompt, output_path, clean_prompt=True, progress_callback=None)` signature
- SDXL-Turbo prompt is concatenated with `CLEAN_PROMPT_SUFFIX` when `clean_prompt=True`
- Token truncation limits user prompt to ~60 tokens (leaves room for suffix in 77-token limit)
- Returns the output_path on success
- Raises RuntimeError on diffusers/transformers missing

**Tests:** Manual smoke test after rebuild

---

### T2: Add `POST /text-to-3d` endpoint + `_run_text_to_3d` to `app.py`

**What:** New endpoint that takes `{prompt, mc_resolution, clean_prompt}` JSON body, creates a job, spawns a thread that runs the text→image→mesh chain.

**Where:** `python/app.py` (add at the end, before `if __name__ == "__main__":`)

**Depends on:** T1

**Reuses:** `jobs.py` create_job/update_job, `triposr_runner.infer`, `convert.convert_glb_to_all`

**Done when:**
- `POST /text-to-3d` accepts JSON body
- Returns `{"jobId": "..."}` immediately
- Spawns daemon thread that calls `_run_text_to_3d`
- Progress events emit: `loading_text_model`, `generating_image`, `text_model_unloaded`, then the existing TripoSR steps
- On error, sets `status="error"` with message
- Final state emits `status="done"` with files
- Files `{glb,obj,stl}` saved to `tmp/jobs/{jobId}/model.{ext}`

**Tests:** Manual via `curl` after rebuild

---

### T3: Add diffusers deps to `python/Dockerfile`

**What:** Add `diffusers==0.30.0`, `accelerate==0.33.0`, `safetensors` to the build. They are needed by `text_to_image.py`.

**Where:** `python/Dockerfile` (add a new `RUN pip install` block after the existing one)

**Depends on:** —

**Reuses:** existing pip install pattern

**Done when:**
- Dockerfile has a second `RUN pip install --no-cache-dir` line with the three packages
- Image builds successfully (verify with `docker compose build triposr`)

**Tests:** `docker compose build triposr` succeeds without errors

---

### T4: Add `POST /api/text-to-3d` proxy to `server.ts`

**What:** Add a route that forwards the JSON body to the Python endpoint and returns the jobId.

**Where:** `server.ts` (add after the existing `/api/img2-3d/*` routes, before the Vite middleware section)

**Depends on:** T2 (Python endpoint must exist)

**Reuses:** existing fetch pattern from `/api/img2-3d/generate`

**Done when:**
- `POST /api/text-to-3d` with JSON body returns the jobId from Python
- Returns 500 with error message on Python failure
- Does not need multer (JSON only)

**Tests:** Manual via `curl` after rebuild

---

### T5: Add "Texto → 3D" tab to `ImageTo3D.tsx`

**What:** Add a third tab/segment in the existing Single/Multi toggle. When selected, shows a prompt textarea + resolution selector + Generate button.

**Where:** `src/pages/ImageTo3D.tsx`

**Depends on:** T4 (proxy must work)

**Reuses:** existing `useJobStream`, `useMultiJobStream` patterns; same SSE polling for results

**Done when:**
- New tab in the mode toggle: "Texto → 3D"
- When active: shows prompt textarea, resolution 256/512 toggle, Generate button
- Submitting calls `POST /api/text-to-3d` with the prompt
- Shows progress and results in the right pane (same as single image flow)
- "Open in 3D Viewer" works the same way

**Tests:** Manual E2E after rebuild

---

### T6: Rebuild triposr image and verify chain

**What:** Run `docker compose build --no-cache triposr` then `docker compose up -d`. Verify the new endpoint responds.

**Where:** terminal

**Depends on:** T1-T5

**Done when:**
- Build succeeds
- Container starts
- `curl -X POST http://localhost:8001/text-to-3d -H "Content-Type: application/json" -d '{"prompt":"a red apple"}'` returns `{"jobId":"..."}`
- SSE stream reaches `status="done"` with files
- `GET /api/img2-3d/{jobId}/result/glb` returns the mesh

**Tests:** Curl chain above

---

### T7: Update STATE.md and ROADMAP.md

**What:** Document the new feature in the persistent state.

**Where:** `.specs/project/STATE.md` and `.specs/project/ROADMAP.md`

**Depends on:** T6

**Done when:**
- STATE.md has new ADs (DC-01..04 from context.md)
- ROADMAP.md marks F3.4 as ✅ COMPLETE
- Quick tasks table has T1..T7

**Tests:** Manual review

## Dependency Graph

```
T3 ──┐
T1 ──┼── T2 ──┐
     │        ├── T6 ──┐
     T4 ──────┘        ├── T7
     T5 ──────────────┘
```

## Execution Plan

**Phase 1 (parallel: T1, T3):** Backend module + Dockerfile
**Phase 2 (T2 → T4):** Wire Python endpoint, then Node proxy
**Phase 3 (T5, parallel to T6 setup):** UI changes
**Phase 4 (T6):** Rebuild and verify
**Phase 5 (T7):** Docs
