import uuid
import threading
import time
import logging
from dataclasses import dataclass, field
from typing import Any, Optional

logger = logging.getLogger(__name__)


@dataclass
class Job:
    id: str
    status: str = "queued"
    progress: int = 0
    step: str = ""
    error: Optional[str] = None
    files: dict = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    listeners: list = field(default_factory=list)

    def emit(self, event: str, data: dict):
        payload = f"event: {event}\ndata: {_safe_json(data)}\n\n"
        stale = []
        for q in self.listeners:
            try:
                q.put_nowait(payload)
            except Exception:
                stale.append(q)
        for q in stale:
            self.listeners.remove(q)


_jobs: dict[str, Job] = {}
_lock = threading.Lock()


def create_job() -> str:
    job_id = uuid.uuid4().hex[:12]
    with _lock:
        _jobs[job_id] = Job(id=job_id)
    logger.info(f"Job {job_id} created (queued)")
    return job_id


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)


def update_job(job_id: str, status: str, progress: int = 0, step: str = "", error: str = "", files: dict = None):
    job = _jobs.get(job_id)
    if not job:
        return None
    job.status = status
    job.progress = progress
    job.step = step
    if error:
        job.error = error
    if files:
        job.files.update(files)
    job.emit("progress", {
        "status": job.status,
        "progress": job.progress,
        "step": job.step,
        "error": job.error,
        "files": job.files,
    })
    return job


def remove_old_jobs(max_age_hours: int = 24):
    cutoff = time.time() - max_age_hours * 3600
    with _lock:
        stale = [jid for jid, job in _jobs.items() if job.created_at < cutoff]
        for jid in stale:
            del _jobs[jid]
    if stale:
        logger.info(f"Cleaned up {len(stale)} old jobs")


import json


def _safe_json(data: dict) -> str:
    return json.dumps(data, default=str)
