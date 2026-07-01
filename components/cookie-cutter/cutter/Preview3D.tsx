import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { CutterResult } from "@/lib/cookie-cutter/cutterBuild";
import { piecesToGrid } from "@/hooks/useCookieCutter";
import { DimensionOverlay } from "./DimensionOverlay";

interface Preview3DProps {
  results: Map<string, CutterResult>;
  pieceIds: string[];
  wireframe: boolean;
  showDimensions: boolean;
  activePieceId: string | null;
  showWall?: boolean;
  showBlade?: boolean;
  showBase?: boolean;
  showStamp?: boolean;
}

function setMeshWireframe(mesh: THREE.Mesh, wireframe: boolean) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const mat of materials) {
    if (mat && typeof mat === "object" && "wireframe" in mat) {
      (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
    }
  }
}

function ResultMesh({
  result,
  wireframe,
  showWall = true,
  showBlade = true,
  showBase = true,
  showStamp = true,
}: {
  result: CutterResult;
  wireframe: boolean;
  showWall?: boolean;
  showBlade?: boolean;
  showBase?: boolean;
  showStamp?: boolean;
}) {
  const allMeshes: THREE.Mesh[] = [
    ...result.handles,
    ...result.ribs,
    ...result.embosseMeshes,
    ...result.stamps,
  ];
  if (showWall) allMeshes.unshift(result.wall);
  if (showBlade) allMeshes.unshift(result.blade);
  if (showBase && result.base.geometry.attributes.position.count > 0) {
    allMeshes.unshift(result.base);
  }
  if (showStamp && result.stamp.geometry.attributes.position.count > 0) {
    allMeshes.unshift(result.stamp);
  }

  for (const m of allMeshes) {
    if (m && m.geometry.attributes.position) {
      setMeshWireframe(m, wireframe);
    }
  }

  return (
    <group>
      {allMeshes.map((m, i) =>
        m && m.geometry.attributes.position ? (
          <primitive key={i} object={m} />
        ) : null
      )}
    </group>
  );
}

function Scene3D({
  results,
  pieceIds,
  wireframe,
  showWall,
  showBlade,
  showBase,
  showStamp,
}: {
  results: Map<string, CutterResult>;
  pieceIds: string[];
  wireframe: boolean;
  showWall?: boolean;
  showBlade?: boolean;
  showBase?: boolean;
  showStamp?: boolean;
}) {
  const grid = piecesToGrid(results, pieceIds, 5);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <Grid
        infiniteGrid
        cellSize={10}
        cellThickness={0.5}
        cellColor="#1a1a1a"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#222222"
        fadeDistance={200}
      />
      {grid.map(({ pieceId, pos }) => {
        const result = results.get(pieceId);
        if (!result) return null;
        return (
          <group key={pieceId} position={pos}>
            <ResultMesh
              result={result}
              wireframe={wireframe}
              showWall={showWall}
              showBlade={showBlade}
              showBase={showBase}
              showStamp={showStamp}
            />
          </group>
        );
      })}
    </>
  );
}

export function Preview3D({
  results,
  pieceIds,
  wireframe,
  showDimensions,
  activePieceId,
  showWall,
  showBlade,
  showBase,
  showStamp,
}: Preview3DProps) {
  const hasResults = pieceIds.some((id) => results.has(id));

  return (
    <div className="relative w-full h-full bg-[#050505]">
      {!hasResults ? (
        <div className="flex items-center justify-center h-full">
          <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
            Sem preview 3D
          </p>
        </div>
      ) : (
        <Canvas camera={{ position: [50, 40, 60], fov: 45 }}>
          <Suspense fallback={null}>
            <Scene3D
              results={results}
              pieceIds={pieceIds}
              wireframe={wireframe}
              showWall={showWall}
              showBlade={showBlade}
              showBase={showBase}
              showStamp={showStamp}
            />
            <OrbitControls makeDefault />
          </Suspense>
        </Canvas>
      )}

      {showDimensions && activePieceId && results.has(activePieceId) && (
        <DimensionOverlay stats={results.get(activePieceId)!.stats} />
      )}
    </div>
  );
}
