import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { DowelSpec } from "@/lib/dowel";
import { TransformControls } from "@/lib/threeShims";

interface DowelMeshProps {
  spec: DowelSpec;
  onChange: (spec: Partial<DowelSpec>) => void;
  orbitControlsRef?: React.MutableRefObject<any>;
  sceneBbox?: THREE.Box3 | null;
}

function computeGizmoSize(diameter: number, bbox?: THREE.Box3 | null): number {
  const baseScale = Math.max(diameter * 1.5, 0.5);
  if (!bbox) return 0.7;
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim <= 0) return 0.7;
  const ratio = baseScale / maxDim;
  return Math.max(0.3, Math.min(1.2, ratio * 4));
}

export function DowelMesh({
  spec,
  onChange,
  orbitControlsRef,
  sceneBbox,
}: DowelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const transformRef = useRef<TransformControls | null>(null);
  const { camera, gl } = useThree();
  const radius = Math.max(spec.diameter, 0.1) / 2;
  const length = Math.max(spec.depth, 0.1);
  const gizmoSize = computeGizmoSize(spec.diameter, sceneBbox);

  useEffect(() => {
    if (!meshRef.current) return;
    const dir = spec.direction.clone();
    if (dir.lengthSq() < 1e-10) dir.set(0, 1, 0);
    dir.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    meshRef.current.position.copy(spec.position);
    meshRef.current.quaternion.copy(quat);
    meshRef.current.updateMatrixWorld(true);
  }, [spec.position, spec.direction]);

  useEffect(() => {
    if (transformRef.current) {
      transformRef.current.setSize(gizmoSize);
    }
  }, [gizmoSize]);

  useEffect(() => {
    if (!meshRef.current) return;
    const controls = new TransformControls(camera, gl.domElement);
    controls.setMode("translate");
    controls.setSize(gizmoSize);
    controls.attach(meshRef.current);
    transformRef.current = controls;

    const onChangeEvt = () => {
      if (!meshRef.current) return;
      const m = meshRef.current;
      onChange({
        position: m.position.clone(),
        direction: new THREE.Vector3(0, 1, 0)
          .applyQuaternion(m.quaternion)
          .normalize(),
      });
    };
    const onDragging = (e: any) => {
      if (orbitControlsRef?.current) {
        orbitControlsRef.current.enabled = !e.value;
      }
    };
    controls.addEventListener("change", onChangeEvt);
    controls.addEventListener("dragging-changed", onDragging);

    const group = new THREE.Group();
    group.add(controls as unknown as THREE.Object3D);
    (meshRef.current.parent as any)?.add(group);
    (controls as any)._group = group;

    return () => {
      controls.removeEventListener("change", onChangeEvt);
      controls.removeEventListener("dragging-changed", onDragging);
      controls.detach();
      controls.dispose();
      group.parent?.remove(group);
      transformRef.current = null;
    };
  }, [camera, gl, onChange, orbitControlsRef, gizmoSize]);

  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[radius, radius, length, 24]} />
        <meshStandardMaterial
          color="#FFF066"
          emissive="#554400"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      <mesh position={spec.position}>
        <sphereGeometry args={[radius * 1.4, 12, 8]} />
        <meshBasicMaterial color="#FF3D00" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
