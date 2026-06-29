import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, useHelper } from "@react-three/drei";
import * as THREE from "three";
import { Upload, Download, Scissors, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// @ts-ignore
import { Evaluator, Brush } from "three-bvh-csg";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

function BoxMesh({ color }: { color: string }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
}

export default function Viewer3D() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cutting, setCutting] = useState(false);

  // Note: CSG operations with imported STLs are complex. 
  // For the MVP frontend, we show a basic CSG concept using primitives.
  
  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      {/* HEADER AREA */}
      <header className="p-8 flex justify-between items-end border-b border-[#222] shrink-0 bg-[#080808]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-bold mb-2">VÉRTICE STUDIO TOOLS / v0.4.2</p>
          <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">3D Mesh Slicer</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Active File</div>
          <div className="font-mono text-sm">{modelLoaded ? 'DEMO_CUBE.STL' : 'NONE'}</div>
        </div>
      </header>

      {/* EDITOR CORE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden">
        
        {/* 3D VIEWPORT */}
        <div className="relative bg-[#050505] p-6 h-full">
            <div className="w-full h-full border border-zinc-800 rounded-lg bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] flex items-center justify-center relative overflow-hidden">
                <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
                  <color attach="background" args={['#050505']} />
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                  <Grid infiniteGrid fadeDistance={20} sectionColor="#333" cellColor="#111" />
                  
                  <OrbitControls makeDefault />
                  
                  {/* Mock loaded model */}
                  {modelLoaded && (
                    <group position={[0, 1, 0]}>
                      <BoxMesh color="#00E5FF" />
                      
                      {/* Cutting plane visualization */}
                      {cutting && (
                        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                          <planeGeometry args={[10, 10]} />
                          <meshBasicMaterial color="#FF3D00" opacity={0.3} transparent side={THREE.DoubleSide} />
                          <lineSegments>
                            <edgesGeometry args={[new THREE.PlaneGeometry(10, 10)]} />
                            <lineBasicMaterial color="#FF3D00" />
                          </lineSegments>
                        </mesh>
                      )}
                    </group>
                  )}
                </Canvas>

                {!modelLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-zinc-500 pointer-events-auto bg-[#0A0A0A]/80 p-8 border border-zinc-800 backdrop-blur-sm">
                      <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-bold tracking-widest uppercase text-[10px] mb-4 text-[#00E5FF]">Drag & Drop STL/OBJ files</p>
                      <button onClick={() => setModelLoaded(true)} className="bg-white text-black font-black uppercase text-xs px-6 py-3 tracking-widest hover:bg-[#00E5FF] transition-colors">
                        Load Demo Model
                      </button>
                    </div>
                  </div>
                )}
            </div>
        </div>

        {/* INSPECTOR / SIDEBAR */}
        <aside className="bg-[#0A0A0A] border-l border-[#222] p-6 flex flex-col gap-8 overflow-y-auto">
            <section>
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">01. Model Info</h3>
              {modelLoaded ? (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-[#151515] p-3 border border-zinc-800">
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">Status</label>
                    <span className="font-mono text-sm text-[#00FF41]">Watertight</span>
                  </div>
                  <div className="bg-[#151515] p-3 border border-zinc-800">
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">Faces</label>
                    <span className="font-mono text-sm">12</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#151515] p-3 border border-zinc-800 text-xs text-zinc-500 mb-4">No model loaded</div>
              )}
            </section>
            
            <section>
                <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">02. Slice Parameters</h3>
                <div className="space-y-4">
                    {modelLoaded && (
                        <>
                            <button 
                                className={`w-full font-black uppercase text-xs py-4 tracking-widest transition-colors ${cutting ? "bg-[#00E5FF] text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}
                                onClick={() => setCutting(!cutting)}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Scissors className="w-4 h-4" />
                                    {cutting ? "Cancel Cut" : "Add Cutting Plane"}
                                </div>
                            </button>
                            {cutting && (
                                <button className="w-full bg-white text-black font-black uppercase text-xs py-4 tracking-widest hover:bg-[#00FF41] transition-colors">
                                    Execute Boolean Cut
                                </button>
                            )}
                        </>
                    )}
                </div>
            </section>

            <section className="flex-1">
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">03. Generated Pieces</h3>
              {modelLoaded && cutting ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-zinc-900 border-l-2 border-[#00E5FF]">
                      <span className="text-xs font-mono uppercase">Part_01_Top</span>
                      <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 cursor-pointer hover:text-white flex items-center gap-1"><Download className="w-3 h-3"/> STL</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-900 border-l-2 border-zinc-700">
                      <span className="text-xs font-mono uppercase">Part_02_Bottom</span>
                      <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 cursor-pointer hover:text-white flex items-center gap-1"><Download className="w-3 h-3"/> STL</span>
                    </div>
                  </div>
              ) : (
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">Cut the model to generate parts.</div>
              )}
            </section>
        </aside>
      </div>

      {/* FOOTER BAR */}
      <footer className="h-12 border-t border-[#222] px-8 flex items-center justify-between bg-[#0A0A0A] shrink-0">
        <div className="flex gap-6 items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span>Status: <span className="text-[#00FF41]">{modelLoaded ? 'Watertight' : 'Idle'}</span></span>
          <span>Polygons: {modelLoaded ? '12' : '0'}</span>
          <span>CSG: READY</span>
        </div>
      </footer>
    </div>
  );
}
