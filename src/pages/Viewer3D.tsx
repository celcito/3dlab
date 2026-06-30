import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Center } from "@react-three/drei";
import * as THREE from "three";
import {
  Download,
  Box,
  ExternalLink,
  Layers,
  PinIcon,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMeshEditor, EditorMode } from "@/hooks/useMeshEditor";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Quality, QUALITY_FACTORS } from "@/lib/decimate";
import { UploadMeshDropzone } from "@/components/UploadMeshDropzone";
import { LoadedMesh } from "@/components/three/LoadedMesh";
import { Toolbar } from "@/components/three/Toolbar";
import { DowelMesh } from "@/components/three/DowelMesh";
import { PieceRenderer } from "@/components/three/PieceRenderer";
import { isSupportedFilename } from "@/lib/loaders";

function SceneContent({
  editor,
  orbitRef,
}: {
  editor: ReturnType<typeof useMeshEditor>;
  orbitRef: React.MutableRefObject<any>;
}) {
  const { state, selectFace, smartSelectFace, eraseFace, updateDowel, hideDowel } = editor;
  const dowelDiameter = state.dowel?.spec.diameter ?? 5;
  const dowelDepth = state.dowel?.spec.depth ?? 10;
  const onDowelUpdate = (s: any) => updateDowel(s);
  return (
    <>
      <color attach="background" args={["#050505"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Grid infiniteGrid fadeDistance={20} sectionColor="#333" cellColor="#111" />
      <OrbitControls ref={orbitRef} makeDefault />

      {state.currentGeometry && (
        <Center>
          <LoadedMesh
            geometry={state.currentGeometry}
            selected={state.selectedFaces}
            mode={state.mode}
            onFaceClick={(faceIndex, additive, mode) => {
              if (mode === "manual") selectFace(faceIndex, additive);
              else if (mode === "smart") smartSelectFace(faceIndex, additive);
              else if (mode === "erase") eraseFace(faceIndex);
            }}
          />
        </Center>
      )}

      {state.pieces.map((p) => (
        <PieceRenderer key={p.id} piece={p} />
      ))}

      {state.dowel?.visible && (
        <DowelMesh
          spec={state.dowel.spec}
          onChange={onDowelUpdate}
          orbitControlsRef={orbitRef}
        />
      )}

      {state.dowel?.visible && (
        <group position={[0, -3, 0]}>
          <mesh>
            <ringGeometry args={[0.3, 0.32, 32]} />
            <meshBasicMaterial color="#FFF066" />
          </mesh>
        </group>
      )}
    </>
  );
}

function CameraFitter({ trigger }: { trigger: number }) {
  const { camera, scene } = useThree();
  useEffect(() => {
    const box = new THREE.Box3();
    let has = false;
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh && m.geometry) {
        m.geometry.computeBoundingBox();
        if (!m.geometry.boundingBox) return;
        m.updateMatrixWorld(true);
        const meshBox = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
        if (!has) {
          box.copy(meshBox);
          has = true;
        } else {
          box.union(meshBox);
        }
      }
    });
    if (has) {
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const dist = maxDim * 2.5;
      const center = new THREE.Vector3();
      box.getCenter(center);
      camera.position.set(
        center.x + dist,
        center.y + dist * 0.6,
        center.z + dist
      );
      camera.lookAt(center);
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [trigger, camera, scene]);
  return null;
}

const QUALITY_LABELS: Record<Quality, string> = {
  original: "Original",
  high: "Alto (75%)",
  medium: "Médio (50%)",
  low: "Baixo (25%)",
};

const QUALITY_OPTIONS: Quality[] = ["original", "high", "medium", "low"];

function formatTri(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

export default function Viewer3D() {
  const [searchParams] = useSearchParams();
  const modelJobId = searchParams.get("model");
  const modelUrl = modelJobId ? `/api/img2-3d/${modelJobId}/result/glb` : null;

  const editor = useMeshEditor();
  const { state, loadDemo, loadFromFile, loadFromUrl, setQuality } = editor;
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const orbitRef = useRef<any>(null);
  const fitTrigger = useRef(0);

  useKeyboardShortcuts({
    setMode: editor.setMode,
    fillSelection: editor.fillSelection,
    clearSelection: editor.clearSelection,
    performCut: editor.performCut,
    undo: editor.undo,
    redo: editor.redo,
  });

  useEffect(() => {
    if (modelUrl) {
      const label = `model.glb (${modelJobId})`;
      loadFromUrl(modelUrl, label);
    }
  }, [modelUrl, modelJobId, loadFromUrl]);

  useEffect(() => {
    fitTrigger.current++;
  }, [
    state.currentGeometry,
    state.pieces.length,
    state.dowel?.visible,
  ]);

  const handleFile = (file: File) => {
    if (!isSupportedFilename(file.name)) {
      editor.reset();
      setTimeout(() => {
        const evt = new CustomEvent("mesheditor-error", {
          detail: `Formato não suportado: ${file.name}`,
        });
        window.dispatchEvent(evt);
      }, 0);
      return;
    }
    setDroppedFile(file);
    loadFromFile(file);
  };

  const onFaceClick = (
    faceIndex: number,
    additive: boolean,
    mode: EditorMode
  ) => {
    if (mode === "manual") editor.selectFace(faceIndex, additive);
    else if (mode === "smart") editor.smartSelectFace(faceIndex, additive);
    else if (mode === "erase") editor.eraseFace(faceIndex);
  };

  const hasGeometry = !!state.currentGeometry || state.pieces.length > 0;
  const decimationPercent = state.originalGeometry
    ? Math.round((state.triangleCount / state.originalTriCount) * 100)
    : 100;

  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      <header className="p-6 flex justify-between items-end border-b border-[#222] shrink-0 bg-[#080808]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-bold mb-2">
            VÉRTICE STUDIO TOOLS / v0.5.0
          </p>
          <h1 className="text-5xl font-black tracking-tighter leading-none uppercase">
            Mesh Editor
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            {hasGeometry && state.pieces.length === 0 && state.triangleCount > 0
              ? "Editando"
              : "Active File"}
          </div>
          <div className="font-mono text-xs text-[#00E5FF] truncate max-w-[260px]">
            {hasGeometry && state.pieces.length === 0 && state.triangleCount > 0
              ? "Peça (recorte ativo)"
              : state.sourceLabel}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] overflow-hidden">
        <div className="relative bg-[#050505] p-4 h-full">
          <div className="w-full h-full border border-zinc-800 rounded-lg bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] flex items-center justify-center relative overflow-hidden">
            <Toolbar
              mode={state.mode}
              setMode={editor.setMode}
              threshold={state.smartThreshold}
              setThreshold={editor.setThreshold}
              hasGeometry={!!state.currentGeometry}
              hasSelection={state.selectedFaces.size > 0}
              isFilling={state.isFilling}
              isCutting={state.isCutting}
              onFill={editor.fillSelection}
              onClear={editor.clearSelection}
              onCut={editor.performCut}
              onReset={editor.reset}
              onFrame={() => {
                fitTrigger.current++;
              }}
              onUndo={editor.undo}
              onRedo={editor.redo}
              canUndo={editor.history.canUndo}
              canRedo={editor.history.canRedo}
              onOrient={editor.autoOrientMesh}
            />

            {state.currentGeometry && (
              <div className="absolute bottom-3 left-4 z-10 pointer-events-none">
                <div className="bg-[#0A0A0A]/70 border border-[#222] px-3 py-1.5 backdrop-blur-sm text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  V view · M manual · S smart · E erase · F fill · C cut · Esc clear · Ctrl+Z undo
                </div>
              </div>
            )}

            <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
              <SceneContent editor={editor} orbitRef={orbitRef} />
              <CameraFitter trigger={fitTrigger.current} />
            </Canvas>

            {state.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/70 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#222] px-6 py-3">
                  <CircleDashed className="w-5 h-5 text-[#00E5FF] animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Carregando...
                  </span>
                </div>
              </div>
            )}

            {state.error && !state.loading && (
              <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
                <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/60 p-3 backdrop-blur-sm pointer-events-auto max-w-md mx-auto">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-red-200">{state.error}</span>
                </div>
              </div>
            )}

            {state.showDowelPrompt && state.pieces.length >= 2 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                <div className="bg-[#0A0A0A] border border-[#00E5FF]/40 p-5 shadow-2xl min-w-[320px]">
                  <p className="text-sm font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                    <PinIcon className="w-4 h-4 text-[#00E5FF]" />
                    Adicionar pino?
                  </p>
                  <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
                    Adicione um pino de alinhamento para as peças encaixarem
                    corretamente.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={editor.showDowel}
                      className="flex-1 bg-[#00E5FF] text-black font-black uppercase text-xs py-3"
                    >
                      Adicionar
                    </Button>
                    <Button
                      onClick={editor.dismissDowelPrompt}
                      variant="outline"
                      className="font-black uppercase text-xs"
                    >
                      Pular
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="bg-[#0A0A0A] border-l border-[#222] p-5 flex flex-col gap-6 overflow-y-auto">
          {!hasGeometry ? (
            <section>
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">
                01. Carregar modelo
              </h3>
              <div className="space-y-3">
                <UploadMeshDropzone
                  file={droppedFile}
                  onFile={handleFile}
                  disabled={state.loading}
                  error={state.error}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={loadDemo}
                    variant="outline"
                    className="flex-1 font-black uppercase text-[10px] tracking-widest"
                    disabled={state.loading}
                  >
                    <Box className="w-3.5 h-3.5 mr-2" /> Demo cube
                  </Button>
                  {modelUrl && (
                    <Button
                      onClick={() => loadFromUrl(modelUrl)}
                      variant="outline"
                      className="flex-1 font-black uppercase text-[10px] tracking-widest"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-2" /> TripoSR
                    </Button>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <>
              <section>
                <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">
                  01. Modelo
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#151515] p-2.5 border border-zinc-800">
                    <label className="text-[9px] uppercase text-zinc-500 block mb-0.5">
                      Triângulos
                    </label>
                    <span className="font-mono text-sm text-[#00E5FF]">
                      {formatTri(state.triangleCount)}
                    </span>
                  </div>
                  <div className="bg-[#151515] p-2.5 border border-zinc-800">
                    <label className="text-[9px] uppercase text-zinc-500 block mb-0.5">
                      Original
                    </label>
                    <span className="font-mono text-sm text-zinc-400">
                      {formatTri(state.originalTriCount)}
                    </span>
                  </div>
                </div>

                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-2">
                  Qualidade ({decimationPercent}%)
                </label>
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`px-1 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${
                        state.quality === q
                          ? "bg-[#00E5FF] text-black"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {q === "original" ? "100%" : `${Math.round(QUALITY_FACTORS[q] * 100)}%`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {QUALITY_LABELS[state.quality]}
                </p>

                {state.originalTriCount > 300_000 && !state.isDecimating && (
                  <div className="mt-3 p-3 bg-amber-950/20 border border-amber-900/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                        Malha pesada
                      </span>
                      <span className="font-mono text-[9px] text-amber-300">
                        ({formatTri(state.originalTriCount)} tri)
                      </span>
                    </div>
                    <p className="text-[9px] text-amber-400/70 leading-relaxed">
                      A decimação client-side pode travar. Use o servidor para reduzir com precisão.
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {([0.75, 0.50, 0.25] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => editor.decimateServerSide(r)}
                          className="flex-1 bg-amber-800/40 hover:bg-amber-700/60 text-amber-200 font-black uppercase text-[9px] px-1 py-1.5 transition-colors"
                        >
                          {Math.round(r * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {state.pieces.length === 0 && (
                <section>
                  <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">
                    02. Seleção
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-[#151515] p-2.5 border border-zinc-800 flex justify-between">
                      <span className="text-[10px] uppercase text-zinc-500">
                        Faces
                      </span>
                      <span className="font-mono text-sm text-[#00E5FF]">
                        {state.selectedFaces.size}
                      </span>
                    </div>
                    <div className="bg-[#151515] p-2.5 border border-zinc-800 flex justify-between">
                      <span className="text-[10px] uppercase text-zinc-500">
                        Modo
                      </span>
                      <span className="font-mono text-sm text-zinc-300 uppercase">
                        {state.mode}
                      </span>
                    </div>
                    {state.mode === "smart" && (
                      <div>
                        <label className="text-[9px] uppercase text-zinc-500 font-bold block mb-1">
                          Área inteligente: {state.smartThreshold}°
                        </label>
                        <Slider
                          value={[state.smartThreshold]}
                          min={5}
                          max={60}
                          step={1}
                          onValueChange={(v) =>
                            editor.setThreshold(v[0])
                          }
                        />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {state.dowel?.visible && (
                <section>
                  <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">
                    03. Pino
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] uppercase text-zinc-500 font-bold block mb-1">
                        Diâmetro: {state.dowel.spec.diameter.toFixed(1)}mm
                      </label>
                      <Slider
                        value={[state.dowel.spec.diameter]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={(v) =>
                          editor.updateDowel({ diameter: v[0] })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-zinc-500 font-bold block mb-1">
                        Profundidade: {state.dowel.spec.depth.toFixed(1)}mm
                      </label>
                      <Slider
                        value={[state.dowel.spec.depth]}
                        min={1}
                        max={30}
                        step={0.5}
                        onValueChange={(v) =>
                          editor.updateDowel({ depth: v[0] })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={editor.applyDowel}
                        disabled={state.isApplyingDowel}
                        className="flex-1 bg-[#00E5FF] text-black font-black uppercase text-[10px] tracking-widest"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {state.isApplyingDowel ? "Aplicando..." : "Aplicar"}
                      </Button>
                      <Button
                        onClick={editor.hideDowel}
                        variant="outline"
                        className="font-black uppercase text-[10px] tracking-widest"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </section>
              )}

              <section className="flex-1">
                <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">
                  04. Peças
                </h3>
                {state.pieces.length === 0 ? (
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                    Selecione faces e confirme o corte.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {state.pieces.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-[#151515] border-l-2 transition-colors"
                        style={{
                          borderLeftColor: p.color,
                          opacity: p.visible ? 1 : 0.4,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-[11px] font-mono uppercase text-zinc-200">
                              {p.name}
                            </div>
                            <div className="text-[9px] text-zinc-500 font-mono">
                              {formatTri(p.triangleCount)} tri
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editor.togglePiece(p.id)}
                              className="text-[9px] uppercase text-zinc-500 hover:text-white px-1.5"
                            >
                              {p.visible ? "On" : "Off"}
                            </button>
                            <button
                              onClick={() => editor.exportPiece(p.id)}
                              className="flex items-center gap-1 text-[9px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 uppercase"
                            >
                              <Download className="w-3 h-3" /> STL
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => editor.editPiece(p.id)}
                          className="w-full flex items-center justify-center gap-1.5 text-[9px] bg-[#0A0A0A] border border-[#222] hover:border-[#00E5FF] text-zinc-300 hover:text-[#00E5FF] px-2 py-1.5 uppercase font-black tracking-widest transition-colors"
                        >
                          <Scissors className="w-3 h-3" />
                          Recortar esta peça
                        </button>
                      </div>
                    ))}
                    <Button
                      onClick={editor.exportAll}
                      className="w-full mt-3 bg-white text-black font-black uppercase text-[10px] tracking-widest"
                    >
                      <Layers className="w-3.5 h-3.5 mr-2" />
                      Baixar todas (.zip)
                    </Button>
                  </div>
                )}
              </section>
            </>
          )}
        </aside>
      </div>

      <footer className="h-12 border-t border-[#222] px-6 flex items-center justify-between bg-[#0A0A0A] shrink-0">
        <div className="flex gap-6 items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span>
            Status:{" "}
            <span
              className={
                state.error
                  ? "text-red-400"
                  : hasGeometry
                    ? "text-[#00FF41]"
                    : "text-zinc-500"
              }
            >
              {state.error
                ? "Erro"
                : hasGeometry
                  ? "Pronto"
                  : "Idle"}
            </span>
          </span>
          <span>
            Engine:{" "}
            <span className="text-[#00E5FF]">three.js + three-bvh-csg</span>
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
          {state.currentGeometry ? formatTri(state.triangleCount) : "—"} tris
        </div>
      </footer>
    </div>
  );
}
