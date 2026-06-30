import logging
import tempfile
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def decimate_mesh_file(input_path: str, output_dir: str, ratio: float) -> dict:
    import trimesh

    mesh = trimesh.load(input_path, force="mesh")
    if isinstance(mesh, trimesh.Scene):
        meshes = []
        for _, geom in mesh.geometry.items():
            if isinstance(geom, trimesh.Trimesh):
                meshes.append(geom)
        if not meshes:
            raise RuntimeError("No meshes found in input")
        mesh = trimesh.util.concatenate(meshes)

    original_faces = len(mesh.faces)
    target = max(int(original_faces * ratio), 100)
    if target >= original_faces:
        logger.info(f"Decimation not needed: {original_faces} → {target}")
        return {"path": input_path, "original": original_faces, "target": original_faces}

    simplified = mesh.simplify_quadric_decimation(target)
    if simplified is None or isinstance(simplified, trimesh.Scene):
        raise RuntimeError("Decimation returned unexpected type")

    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "decimated.stl")
    simplified.export(out_path)

    logger.info(f"Decimated: {original_faces} → {len(simplified.faces)} faces")
    return {
        "path": out_path,
        "original": original_faces,
        "target": len(simplified.faces),
    }

