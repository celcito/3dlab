import * as THREE from "three";

export async function renderThumbnail(
  mesh: THREE.Mesh | null,
  size: 256 | 64 = 256
): Promise<string> {
  if (!mesh) return grayPlaceholder();

  try {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    renderer.setSize(size, size);
    renderer.setClearColor(0x080808, 1);

    const scene = new THREE.Scene();

    const bbox = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const maxDim = Math.max(
      bbox.max.x - bbox.min.x,
      bbox.max.y - bbox.min.y,
      bbox.max.z - bbox.min.z
    );
    const dist = Math.max(maxDim * 1.5, 0.1);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, dist * 4);
    camera.position.set(
      center.x + dist * 0.7,
      center.y + dist * 0.5,
      center.z + dist * 0.8
    );
    camera.lookAt(center);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);

    const cloned = mesh.clone();
    cloned.position.set(0, 0, 0);
    scene.add(cloned);

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL("image/png");
    renderer.dispose();

    return dataUrl;
  } catch {
    return grayPlaceholder();
  }
}

function grayPlaceholder(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#222222";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#444444";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("3D", 32, 36);
  }
  return canvas.toDataURL("image/png");
}
