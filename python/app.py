import os
import sys
import logging
import threading
import time
import shutil
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("triposr_api")

sys.path.insert(0, str(Path(__file__).parent))

from jobs import create_job, get_job, update_job, remove_old_jobs
from triposr_runner import infer
from convert import convert_glb_to_all

JOBS_DIR = Path(__file__).parent.parent / "tmp" / "jobs"
JOBS_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    def cleanup_loop():
        while True:
            time.sleep(3600)
            remove_old_jobs(max_age_hours=24)
    t = threading.Thread(target=cleanup_loop, daemon=True)
    t.start()
    logger.info(f"TripoSR API started. Jobs dir: {JOBS_DIR}")
    yield


app = FastAPI(title="TripoSR Image-to-3D API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run_inference(job_id: str, image_path: str, output_dir: str):
    try:
        def progress(percent: int, step: str):
            update_job(job_id, "processing", progress=percent, step=step)

        update_job(job_id, "processing", progress=0, step="starting")

        result = infer(
            image_path=image_path,
            output_dir=output_dir,
            foreground_ratio=0.85,
            mc_resolution=256,
            progress_callback=progress,
        )

        update_job(job_id, "processing", progress=75, step="converting_formats")

        convert_result = convert_glb_to_all(result["glb_path"], output_dir)

        job_dir = Path(output_dir)
        files = {}
        for fmt in ["glb", "obj", "stl"]:
            src = convert_result.get(fmt)
            if src and Path(src).exists():
                dest = job_dir / f"model.{fmt}"
                if Path(src) != dest:
                    shutil.move(src, dest)
                files[fmt] = str(dest)

        update_job(job_id, "done", progress=100, step="complete", files=files)
        logger.info(f"Job {job_id} completed: {files}")

    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        update_job(job_id, "error", progress=0, step="error", error=str(e))


@app.post("/generate")
async def generate(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (PNG, JPEG, WebP)")

    job_id = create_job()
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    image_path = job_dir / "input.png"
    contents = await image.read()
    image_path.write_bytes(contents)

    output_dir = job_dir
    threading.Thread(target=_run_inference, args=(job_id, str(image_path), str(output_dir)), daemon=True).start()

    return {"jobId": job_id}


@app.get("/jobs/{job_id}/stream")
async def job_stream(job_id: str):
    import queue

    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    q: queue.Queue = queue.Queue()
    job.listeners.append(q)

    job.emit("progress", {
        "status": job.status,
        "progress": job.progress,
        "step": job.step,
        "error": job.error,
        "files": job.files,
    })

    async def event_stream():
        try:
            while True:
                try:
                    data = await asyncio.to_thread(q.get, timeout=30)
                    yield data
                except queue.Empty:
                    yield "event: ping\ndata: {}\n\n"
                except Exception:
                    break
        except asyncio.CancelledError:
            pass
        finally:
            try:
                job.listeners.remove(q)
            except (ValueError, AttributeError):
                pass

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/jobs/{job_id}/status")
async def job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return {
        "status": job.status,
        "progress": job.progress,
        "step": job.step,
        "error": job.error,
        "files": job.files,
    }


@app.get("/jobs/{job_id}/file/{fmt}")
async def job_file(job_id: str, fmt: str):
    if fmt not in ("glb", "obj", "stl"):
        raise HTTPException(400, "Format must be glb, obj, or stl")

    path = JOBS_DIR / job_id / f"model.{fmt}"
    if not path.exists():
        raise HTTPException(404, f"File not found: model.{fmt}")

    from fastapi.responses import FileResponse
    return FileResponse(str(path))


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")
