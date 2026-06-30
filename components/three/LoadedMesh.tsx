import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EditorMode } from "@/hooks/useMeshEditor";
import { buildSelectionColorAttribute } from "@/lib/meshSelection";

interface LoadedMeshProps {
  geometry: THREE.BufferGeometry;
  selected: Set<number>;
  mode: EditorMode;
  onFaceClick: (faceIndex: number, additive: boolean, mode: EditorMode) => void;
}

export function LoadedMesh({
  geometry,
  selected,
  mode,
  onFaceClick,
}: LoadedMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const displayGeometry = useMemo(() => {
    const g = geometry.clone();
    const pos = g.attributes.position;
    const numVerts = pos.count;
    if (numVerts === 0) return g;

    if (!g.index) {
      const indexArray: number[] = [];
      for (let i = 0; i < numVerts; i++) indexArray.push(i);
      g.setIndex(indexArray);
    }

    const colorAttr = buildSelectionColorAttribute(g, selected);
    g.setAttribute("color", colorAttr);
    g.computeVertexNormals();
    return g;
  }, [geometry, selected]);

  useEffect(() => {
    return () => {
      displayGeometry.dispose();
    };
  }, [displayGeometry]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (mode === "view") return;
    const faceIndex = e.faceIndex;
    if (typeof faceIndex !== "number") return;
    const additive = e.shiftKey || e.nativeEvent?.shiftKey === true;
    if (mode === "erase") {
      onFaceClick(faceIndex, false, "erase");
    } else {
      onFaceClick(faceIndex, additive, mode);
    }
  };

  return (
    <group
      onPointerOver={() => {
        if (mode !== "view") (document.body.style.cursor = "crosshair");
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <mesh
        ref={meshRef}
        geometry={displayGeometry}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          metalness={0.1}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
