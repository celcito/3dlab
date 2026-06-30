import os
import logging
from pathlib import Path
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)


def _ensure_checkpoint() -> Path:
    cache_dir = Path.home() / ".cache" / "triposr"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def infer(
    image_path: str,
    output_dir: str,
    foreground_ratio: float = 0.85,
    mc_resolution: int = 256,
    remove_bg: bool = True,
    progress_callback: Optional[callable] = None,
) -> dict:
    try:
        from tsr.system import TSR

        model = TSR.from_pretrained(
            "stabilityai/TripoSR",
        )
    except ImportError:
        raise RuntimeError(
            "TripoSR not installed. The 'tsr' module is missing — see python/Dockerfile for the install step (clone from GitHub)."
        )

    if progress_callback:
        progress_callback(5, "loading_model")

    pipeline = TripoSRPipeline.from_pretrained(
        "stabilityai/TripoSR",
        cache_dir=str(_ensure_checkpoint()),
    )

    device = "cuda" if _has_cuda() else "cpu"
    if device == "cpu":
        logger.warning("CUDA not available — inference will be slow on CPU")

    pipeline.to(device)

    if progress_callback:
        progress_callback(15, "model_loaded")

    image = Image.open(image_path).convert("RGB")

    if remove_bg:
        try:
            from torchvision.transforms import functional as F
            import torch
            img_tensor = F.to_tensor(image)
            r, g, b = img_tensor[0], img_tensor[1], img_tensor[2]
            luminance = 0.299 * r + 0.587 * g + 0.114 * b
            mask = luminance > 0.05
            img_tensor = img_tensor * mask.float()
            image = F.to_pil_image(img_tensor)
        except Exception:
            logger.warning("Background removal failed, continuing with original image")

    if progress_callback:
        progress_callback(30, "preprocessing_done")

    out = pipeline(
        image,
        foreground_ratio=foreground_ratio,
        mc_resolution=mc_resolution,
    )

    if progress_callback:
        progress_callback(70, "inference_done")

    os.makedirs(output_dir, exist_ok=True)

    glb_path = os.path.join(output_dir, "model.glb")

    if hasattr(out, "export_glb"):
        out.export_glb(glb_path)
    elif hasattr(out, "save"):
        out.save(glb_path)
    elif isinstance(out, dict) and "mesh" in out:
        mesh = out["mesh"]
        if hasattr(mesh, "export"):
            mesh.export(glb_path)
        else:
            import trimesh
            trimesh.Trimesh(vertices=mesh.verts, faces=mesh.faces).export(glb_path)
    else:
        raise RuntimeError(f"Unknown TripoSR output type: {type(out)}")

    if progress_callback:
        progress_callback(100, "done")

    return {
        "glb_path": glb_path,
        "device": device,
        "foreground_ratio": foreground_ratio,
        "mc_resolution": mc_resolution,
    }


def _has_cuda() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False
