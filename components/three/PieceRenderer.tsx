import { useEffect } from "react";
import * as THREE from "three";
import { PieceData } from "@/hooks/useMeshEditor";

interface PieceRendererProps {
  piece: PieceData;
}

export function PieceRenderer({ piece }: PieceRendererProps) {
  useEffect(() => {
    return () => {
      piece.mesh.geometry.dispose();
      if (Array.isArray(piece.mesh.material)) {
        piece.mesh.material.forEach((m) => m.dispose());
      } else {
        (piece.mesh.material as THREE.Material).dispose();
      }
    };
  }, [piece]);

  if (!piece.visible) return null;

  return (
    <primitive
      object={piece.mesh}
      position={piece.mesh.position}
      rotation={piece.mesh.rotation}
      scale={piece.mesh.scale}
    />
  );
}
