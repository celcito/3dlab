import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def convert_glb_to_all(glb_path: str, output_dir: str) -> dict:
    import trimesh

    mesh = trimesh.load(glb_path, force="mesh")

    if isinstance(mesh, trimesh.Scene):
        meshes = []
        for name, geom in mesh.geometry.items():
            if isinstance(geom, trimesh.Trimesh):
                meshes.append(geom)
        if not meshes:
            raise RuntimeError("No meshes found in GLB scene")
        mesh = trimesh.util.concatenate(meshes)

    os.makedirs(output_dir, exist_ok=True)

    result = {"glb": glb_path}

    obj_path = os.path.join(output_dir, "model.obj")
    mesh.export(obj_path)
    result["obj"] = obj_path
    logger.info(f"Exported OBJ: {obj_path}")

    stl_path = os.path.join(output_dir, "model.stl")
    mesh.export(stl_path)
    result["stl"] = stl_path
    logger.info(f"Exported STL: {stl_path}")

    return result
