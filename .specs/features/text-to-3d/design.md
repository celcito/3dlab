# Text-to-3D — Architecture & Design

## High-Level Flow

```
Browser                          Node (server.ts)                    Python (app.py)
  |                                    |                                  |
  |---POST /api/text-to-3d--->         |---POST /text-to-3d-------->      |
  |   (prompt + mcResolution)          |   (multipart, fwd)                |
  |                                    |                                  |
  |                                    |   1. create_job()                 |
  |<--{jobId}--------------------------|<--{jobId}-------------------|    |
  |                                    |                                  |
  |---GET /api/img2-3d/:id/sse------>  |---SSE proxy----------------->   |
  |                                    |                                  |  [thread A]
  |                                    |                                  |  load_pipe()  → progress 5%
  |                                    |                                  |  generate_image()  → progress 15-30%
  |                                    |                                  |  unload_pipe()  → progress 35%
  |                                    |                                  |  infer() TripoSR  → progress 40-75%
  |                                    |                                  |  convert_glb_to_all  → progress 80%
  |                                    |                                  |  emit done  → progress 100%
  |                                    |                                  |
  |<--SSE events---------------------<--<------------------------------|    |
  |---GET /api/img2-3d/:id/result/glb->|                                  |
  |<--GLB bytes-----------------------<--<------------------------------|    |
```

## Component Map

```
+--------------------+        +-------------------------+       +-------------------+
| ImageTo3D.tsx      |        | server.ts               |       | python/app.py     |
|--------------------|        |-------------------------|       |-------------------|
| New tab: Texto→3D  |        | POST /api/text-to-3d    |  -->  | POST /text-to-3d  |
| - prompt input     |  HTTP  |  multer upload? NO      |       |  Form: prompt,    |
| - resolution toggle|        |  raw JSON? YES          |       |  mc_resolution,   |
| - poll SSE         |  <->   |  Body: { prompt, ... }  |       |  clean_prompt     |
| - existing UI      |        |  -->  fetch python      |  <->  |  spawn thread     |
+--------------------+        +-------------------------+       |    _run_text2_3d  |
                                                                   |       load_pipe() |
                                                                   |       generate()  |
                                                                   |       unload()   |
                                                                   |       infer()    |
                                                                   +-------------------+
                                                                                |
                                                                                v
                                                                   +-------------------+
                                                                   | text_to_image.py  |
                                                                   |-------------------|
                                                                   | load_pipe()       |
                                                                   | generate_image()  |
                                                                   | unload_pipe()     |
                                                                   +-------------------+
                                                                                |
                                                                                v
                                                                   +-------------------+
                                                                   | triposr_runner.py |
                                                                   |-------------------|
                                                                   | infer() (existing) |
                                                                   +-------------------+
```

## Data Flow

### Request (Node → Python)

The Node proxy needs to forward a JSON body to the Python backend. We use `application/json` for simplicity (no file upload needed since the prompt is the only input).

```ts
// server.ts
app.post("/api/text-to-3d", async (req, res) => {
  const { prompt, mcResolution = 256, cleanPrompt } = req.body;
  const r = await fetch(`${IMG2_3D_PY_URL}/text-to-3d`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, mc_resolution: mcResolution, clean_prompt: cleanPrompt }),
  });
  const data = await r.json();
  res.json(data);
});
```

### Request (Python)

```python
# python/app.py
@app.post("/text-to-3d")
async def text_to_3d_endpoint(body: TextTo3DRequest):
    job_id = create_job()
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    threading.Thread(
        target=_run_text_to_3d,
        args=(job_id, body.prompt, str(job_dir), body.mc_resolution, body.clean_prompt),
        daemon=True,
    ).start()
    return {"jobId": job_id}
```

### Pipeline (chained)

The new `_run_text_to_3d()` function does the same setup as `_run_inference()` but starts from a prompt instead of an image file:

```python
def _run_text_to_3d(job_id, prompt, output_dir, mc_resolution, clean_prompt):
    try:
        update_job(job_id, "processing", progress=0, step="loading_text_model")
        from text_to_image import generate_image
        
        # 1. Generate image from prompt
        image_path = Path(output_dir) / "input.png"
        generate_image(
            prompt, str(image_path),
            clean_prompt=clean_prompt,
            progress_callback=lambda pct, step: update_job(job_id, "processing", progress=pct, step=step),
        )
        update_job(job_id, "processing", progress=40, step="text_model_unloaded")

        # 2. Run TripoSR on the generated image (reuse _run_inference from progress 75%)
        def progress(pct, step):
            update_job(job_id, "processing", progress=40 + int(pct * 0.55), step=step)
        
        result = infer(
            image_path=str(image_path),
            output_dir=output_dir,
            mc_resolution=mc_resolution,
            progress_callback=progress,
        )
        
        # 3. Convert + finalize (identical to _run_inference)
        convert_result = convert_glb_to_all(result["glb_path"], output_dir)
        # ... move files, update_job("done", ...)
    except Exception as e:
        update_job(job_id, "error", progress=0, step="error", error=str(e))
```

## text_to_image.py Module

```python
import torch
from diffusers import AutoPipelineForText2Image
import gc

_pipe = None
_pipe_device = None

CLEAN_PROMPT_SUFFIX = (
    ", product photo, white background, studio lighting, "
    "single object, no shadows, centered"
)
MAX_PROMPT_TOKENS = 60  # SDXL-Turbo has 77-token limit; leave room for suffix


def _has_cuda() -> bool:
    try:
        return torch.cuda.is_available()
    except Exception:
        return False


def load_pipe(model_id: str = "stabilityai/sdxl-turbo"):
    global _pipe
    if _pipe is None:
        _pipe = AutoPipelineForText2Image.from_pretrained(
            model_id,
            torch_dtype=torch.float16,
            variant="fp16",
        )
        _pipe.enable_attention_slicing()
        _pipe.enable_vae_slicing()
    return _pipe


def unload_pipe():
    global _pipe
    if _pipe is not None:
        try:
            _pipe.to("cpu")
        except Exception:
            pass
        del _pipe
        _pipe = None
        gc.collect()
        if _has_cuda():
            torch.cuda.empty_cache()


def _truncate_to_tokens(prompt: str, max_tokens: int) -> str:
    """Approximate token truncation by word count (1 token ≈ 0.75 words)."""
    max_words = int(max_tokens * 0.75)
    words = prompt.split()
    if len(words) <= max_words:
        return prompt
    return " ".join(words[:max_words])


def generate_image(
    prompt: str,
    output_path: str,
    clean_prompt: bool = True,
    progress_callback=None,
) -> str:
    pipe = load_pipe()
    device = "cuda" if _has_cuda() else "cpu"
    pipe.to(device)

    full_prompt = prompt
    if clean_prompt:
        user_part = _truncate_to_tokens(prompt, MAX_PROMPT_TOKENS)
        full_prompt = user_part + CLEAN_PROMPT_SUFFIX

    if progress_callback:
        progress_callback(15, "generating_image")

    image = pipe(
        prompt=full_prompt,
        num_inference_steps=4,
        guidance_scale=0.0,
    ).images[0]

    image.save(output_path)
    unload_pipe()

    if progress_callback:
        progress_callback(35, "text_model_unloaded")

    return output_path
```

## Files Changed

| File | Change | Why |
| --- | --- | --- |
| `python/text_to_image.py` (new) | SDXL-Turbo wrapper | New module |
| `python/app.py` | `POST /text-to-3d` + `_run_text_to_3d` | Reuse job system |
| `python/Dockerfile` | Add `diffusers`, `accelerate`, `safetensors` | New deps |
| `server.ts` | `POST /api/text-to-3d` proxy | Wire to Python |
| `src/pages/ImageTo3D.tsx` | New tab "Texto → 3D" with prompt input | UI |
| `.specs/project/STATE.md` | Update with new feature | Doc |

## Memory & Performance

- **CPU mode:** SDXL-Turbo fp16 ≈ 7GB RAM. TripoSR ≈ 4GB RAM. Sequential, max ~11GB peak. Slow (~3-5 min for SD, ~3 min for TripoSR).
- **CUDA mode (8GB GPU):** SDXL-Turbo ≈ 4-5GB VRAM. TripoSR ≈ 2GB VRAM. Unload SD first to free VRAM. ~30s SD + ~10s TripoSR.

## Risks

- **OOM on CPU with 4GB RAM host:** possible. User can mitigate by killing other processes or upgrading RAM.
- **SDXL-Turbo cold start:** First request downloads the model (~7GB). Subsequent requests use cache. No code change.
- **Long generation time:** 3-5 min on CPU may feel slow. Documented in UI tooltip.
