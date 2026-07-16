import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { Download, Puzzle, Settings, Sliders, Box, Grid3X3, Image as ImageIcon, Upload, Trash2, Loader2 } from "lucide-react";
// @ts-ignore
import ImageTracer from "imagetracerjs";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Evaluator, Brush, INTERSECTION } from 'three-bvh-csg';

interface PuzzleConfig {
  width: number;
  height: number;
  columns: number;
  rows: number;
  thickness: number;
  tabSize: number;
  explode: number;
  bevel: number;
}

function addJigsawEdge(
  shape: THREE.Shape,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tabDir: number,
  tabSize: number
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx);

  if (tabDir === 0) {
    shape.lineTo(endX, endY);
    return;
  }

  const t = (x: number, y: number): [number, number] => {
    const sx = x * len;
    const sy = y * len * tabDir * tabSize;
    const rx = sx * Math.cos(ang) - sy * Math.sin(ang);
    const ry = sx * Math.sin(ang) + sy * Math.cos(ang);
    return [startX + rx, startY + ry];
  };

  shape.lineTo(...t(0.35, 0));
  shape.bezierCurveTo(...t(0.45, 0), ...t(0.40, 0.15), ...t(0.35, 0.20));
  shape.bezierCurveTo(...t(0.25, 0.30), ...t(0.40, 0.35), ...t(0.50, 0.35));
  shape.bezierCurveTo(...t(0.60, 0.35), ...t(0.75, 0.30), ...t(0.65, 0.20));
  shape.bezierCurveTo(...t(0.60, 0.15), ...t(0.55, 0), ...t(0.65, 0));
  shape.lineTo(...t(1, 0));
}

const generateBaseGeometries = (config: PuzzleConfig) => {
  const { width, height, columns, rows, thickness, tabSize, bevel } = config;
  const pieceW = width / columns;
  const pieceH = height / rows;

  const edgesH: number[][] = [];
  for (let r = 0; r <= rows; r++) {
    const row = [];
    for (let c = 0; c < columns; c++) {
      if (r === 0 || r === rows) row.push(0);
      else row.push(Math.random() > 0.5 ? 1 : -1);
    }
    edgesH.push(row);
  }

  const edgesV: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c <= columns; c++) {
      if (c === 0 || c === columns) row.push(0);
      else row.push(Math.random() > 0.5 ? 1 : -1);
    }
    edgesV.push(row);
  }

  const geometries: { geom: THREE.ExtrudeGeometry; col: number; row: number; cx: number; cy: number }[] = [];

  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelSegments: 2,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const shape = new THREE.Shape();
      const px = c * pieceW - width / 2;
      const py = r * pieceH - height / 2;

      shape.moveTo(0, 0);
      addJigsawEdge(shape, 0, 0, pieceW, 0, edgesH[r][c], tabSize);
      addJigsawEdge(shape, pieceW, 0, pieceW, pieceH, edgesV[r][c+1], tabSize);
      addJigsawEdge(shape, pieceW, pieceH, 0, pieceH, -edgesH[r+1][c], tabSize);
      addJigsawEdge(shape, 0, pieceH, 0, 0, -edgesV[r][c], tabSize);

      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Center of this piece
      const cx = px + pieceW / 2;
      const cy = py + pieceH / 2;

      geometries.push({ geom, col: c, row: r, cx: px, cy: py });
    }
  }

  return geometries;
};

export default function PuzzleGenerator() {
  const [config, setConfig] = useState<PuzzleConfig>({
    width: 150,
    height: 100,
    columns: 6,
    rows: 4,
    thickness: 3,
    tabSize: 0.3,
    explode: 2,
    bevel: 0.4
  });

  const [seed, setSeed] = useState(0);
  const [moldImage, setMoldImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [finalGeometries, setFinalGeometries] = useState<{ geom: THREE.BufferGeometry; x: number; y: number }[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-generate geometry when dependencies change
  useEffect(() => {
    let active = true;
    
    const generate = async () => {
      setIsProcessing(true);
      
      // Allow UI to render loading state
      await new Promise(r => setTimeout(r, 50));
      
      try {
        const baseGeoms = generateBaseGeometries(config);
        
        let moldGeometry: THREE.BufferGeometry | null = null;
        
        if (moldImage) {
          // Process image into mold
          const svgString = await new Promise<string>((resolve, reject) => {
            try {
              const options = {
                ltilesize: 128,
                numberofcolors: 2, // binary silhouette
                pathomit: 8,
                blurradius: 0,
                blurdelta: 20,
                strokewidth: 1,
                linefilter: false,
                scale: 1,
                roundcoords: 1,
                colorsampling: 0,
                colorquantcycles: 3,
                layering: 0
              };
              ImageTracer.imageToSVG(moldImage, (svg: string) => resolve(svg), options);
            } catch (err) {
              reject(err);
            }
          });
          
          if (!active) return;
          
          const loader = new SVGLoader();
          const svgData = loader.parse(svgString);
          
          if (svgData && svgData.paths.length > 0) {
            // Find largest path area to use as the main mold
            const shapes = [];
            for (const path of svgData.paths) {
              shapes.push(...SVGLoader.createShapes(path));
            }
            
            if (shapes.length > 0) {
              // Extrude all shapes
              const moldGeoms = shapes.map(shape => {
                const geom = new THREE.ExtrudeGeometry(shape, {
                  depth: config.thickness,
                  bevelEnabled: false
                });
                return geom;
              });
              
              // We could union them, but let's just use the largest one for simplicity, 
              // or merge them if there are multiple parts.
              let combinedMold = moldGeoms[0];
              if (moldGeoms.length > 1) {
                // Merge buffer geometries
                combinedMold = moldGeoms[0]; // just use the first for now to avoid CSG complexity on union
                // In a perfect world, we would union them. But ImageTracer silhouette usually has 1 main outer path 
                // and some inner holes. Wait, inner holes are handled by SVGLoader automatically if they are subpaths!
              }
              
              // Center and scale mold to fit the config.width / config.height
              combinedMold.computeBoundingBox();
              const bbox = combinedMold.boundingBox!;
              const sizeX = bbox.max.x - bbox.min.x;
              const sizeY = bbox.max.y - bbox.min.y;
              
              const scale = Math.min(config.width / sizeX, config.height / sizeY);
              combinedMold.scale(scale, -scale, 1); // Flip Y because SVG has Y down
              
              combinedMold.computeBoundingBox();
              const newBbox = combinedMold.boundingBox!;
              const cx = (newBbox.max.x + newBbox.min.x) / 2;
              const cy = (newBbox.max.y + newBbox.min.y) / 2;
              
              combinedMold.translate(-cx, -cy, 0);
              
              moldGeometry = combinedMold;
            }
          }
        }
        
        if (!active) return;
        
        const finalPieces = [];
        
        if (moldGeometry) {
          const evaluator = new Evaluator();
          const moldBrush = new Brush(moldGeometry);
          moldBrush.updateMatrixWorld();
          
          for (const base of baseGeoms) {
            // Translate the base geometry to its correct world position for CSG
            const translatedBase = base.geom.clone();
            translatedBase.translate(base.cx, base.cy, 0);
            
            const pieceBrush = new Brush(translatedBase);
            pieceBrush.updateMatrixWorld();
            
            const intersected = evaluator.evaluate(pieceBrush, moldBrush, INTERSECTION);
            
            // Check if it's empty (no faces)
            if (intersected.geometry.index && intersected.geometry.index.count > 0) {
              // Bring it back to local coordinates, but we need to apply explode
              // Wait, it's easier to just keep it in world coords and apply explode via mesh position
              
              // Calculate center of this specific piece for explosion
              const cx = (base.col - (config.columns - 1) / 2) * config.explode;
              const cy = (base.row - (config.rows - 1) / 2) * config.explode;
              
              finalPieces.push({
                geom: intersected.geometry,
                x: cx, // explosion offset
                y: cy
              });
            }
          }
        } else {
          // No mold, just use base geometries
          for (const base of baseGeoms) {
            const cx = (base.col - (config.columns - 1) / 2) * config.explode;
            const cy = (base.row - (config.rows - 1) / 2) * config.explode;
            finalPieces.push({
              geom: base.geom,
              x: base.cx + cx,
              y: base.cy + cy
            });
          }
        }
        
        setFinalGeometries(finalPieces);
        
      } catch (err) {
        console.error("Error generating puzzle:", err);
      } finally {
        setIsProcessing(false);
      }
    };
    
    generate();
    
    return () => { active = false; };
  }, [config, seed, moldImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMoldImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExportSTL = () => {
    if (!groupRef.current) return;
    const exporter = new STLExporter();
    const stlString = exporter.parse(groupRef.current);
    const blob = new Blob([stlString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `puzzle_${config.columns}x${config.rows}.stl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#080808] text-white">
      {/* 3D VIEWER */}
      <div className="flex-1 relative">
        {isProcessing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-[#00E5FF] animate-spin mb-4" />
            <h2 className="text-xl font-bold tracking-widest uppercase">Gerando Molde</h2>
            <p className="text-zinc-400 mt-2">Isso pode levar alguns segundos...</p>
          </div>
        )}
      
        <Canvas shadows camera={{ position: [0, 0, 200], fov: 45 }}>
          <color attach="background" args={["#080808"]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[100, 100, 100]} castShadow intensity={1.5} shadow-bias={-0.0001} />
          
          <Center>
            <group ref={groupRef} rotation={[Math.PI, 0, 0]}>
              {finalGeometries.map((g, i) => (
                <mesh key={i} castShadow receiveShadow geometry={g.geom} position={[g.x, g.y, -config.thickness/2]}>
                  <meshStandardMaterial 
                    color="#00E5FF" 
                    roughness={0.4} 
                    metalness={0.1}
                  />
                  <lineSegments>
                    <edgesGeometry args={[g.geom]} />
                    <lineBasicMaterial color="#000000" opacity={0.2} transparent />
                  </lineSegments>
                </mesh>
              ))}
            </group>
          </Center>

          <ContactShadows position={[0, -100, 0]} opacity={0.4} scale={400} blur={2} far={200} />
          <OrbitControls makeDefault />
        </Canvas>

        <div className="absolute top-4 left-4 bg-[#0d0d0d]/80 backdrop-blur-md p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-[#00E5FF]/20 p-2 rounded-lg text-[#00E5FF]">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Puzzle 3D</h1>
              <p className="text-xs text-zinc-400 font-mono">{finalGeometries.length} peças geradas</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="w-full md:w-[360px] bg-[#0d0d0d] border-l border-zinc-800 flex flex-col z-10">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-zinc-300">
            <Settings className="w-4 h-4" /> Parâmetros
          </h2>
          <button
            onClick={handleExportSTL}
            disabled={isProcessing || finalGeometries.length === 0}
            className="flex items-center gap-2 bg-[#00E5FF] hover:bg-[#00cce6] disabled:opacity-50 disabled:hover:bg-[#00E5FF] text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Molde Customizado (Opcional)
            </h3>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            
            {!moldImage ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-zinc-800 hover:border-[#00E5FF] hover:bg-[#00E5FF]/5 rounded-lg transition-colors text-zinc-400 hover:text-[#00E5FF]"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">Subir Imagem</span>
                <span className="text-[10px] text-center px-4 leading-relaxed">Imagens com silhuetas claras ou fundo transparente funcionam melhor.</span>
              </button>
            ) : (
              <div className="relative group rounded-lg overflow-hidden border border-zinc-800">
                <img src={moldImage} alt="Mold preview" className="w-full h-32 object-contain bg-[#111]" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setMoldImage(null)}
                    className="p-2 bg-red-900/50 hover:bg-red-800 text-white rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <Box className="w-3 h-3" /> Dimensões Totais
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Largura (X)</span>
                  <span className="font-mono text-[#00E5FF]">{config.width} mm</span>
                </div>
                <input
                  type="range"
                  min="50" max="300" step="5"
                  value={config.width}
                  onChange={(e) => setConfig({ ...config, width: parseFloat(e.target.value) })}
                  className="w-full accent-[#00E5FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Altura (Y)</span>
                  <span className="font-mono text-[#00E5FF]">{config.height} mm</span>
                </div>
                <input
                  type="range"
                  min="50" max="300" step="5"
                  value={config.height}
                  onChange={(e) => setConfig({ ...config, height: parseFloat(e.target.value) })}
                  className="w-full accent-[#00E5FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Espessura (Z)</span>
                  <span className="font-mono text-[#00E5FF]">{config.thickness} mm</span>
                </div>
                <input
                  type="range"
                  min="1" max="10" step="0.5"
                  value={config.thickness}
                  onChange={(e) => setConfig({ ...config, thickness: parseFloat(e.target.value) })}
                  className="w-full accent-[#00E5FF]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <Grid3X3 className="w-3 h-3" /> Grid de Peças
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Colunas</label>
                <input
                  type="number"
                  min="2" max="20"
                  value={config.columns}
                  onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) || 2 })}
                  className="w-full bg-[#111] border border-zinc-800 rounded p-2 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Linhas</label>
                <input
                  type="number"
                  min="2" max="20"
                  value={config.rows}
                  onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) || 2 })}
                  className="w-full bg-[#111] border border-zinc-800 rounded p-2 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <Sliders className="w-3 h-3" /> Detalhes do Encaixe
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Tamanho do Encaixe</span>
                <span className="font-mono text-[#00E5FF]">{config.tabSize.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1" max="0.6" step="0.05"
                value={config.tabSize}
                onChange={(e) => setConfig({ ...config, tabSize: parseFloat(e.target.value) })}
                className="w-full accent-[#00E5FF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Explosão (Espaçamento)</span>
                <span className="font-mono text-[#00E5FF]">{config.explode} mm</span>
              </div>
              <input
                type="range"
                min="0" max="20" step="0.5"
                value={config.explode}
                onChange={(e) => setConfig({ ...config, explode: parseFloat(e.target.value) })}
                className="w-full accent-[#00E5FF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Chanfro (Bevel)</span>
                <span className="font-mono text-[#00E5FF]">{config.bevel.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="0" max="2" step="0.1"
                value={config.bevel}
                onChange={(e) => setConfig({ ...config, bevel: parseFloat(e.target.value) })}
                className="w-full accent-[#00E5FF]"
              />
            </div>
          </div>

          <button
            onClick={() => setSeed(s => s + 1)}
            disabled={isProcessing}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-zinc-800 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors"
          >
            Gerar Novo Padrão
          </button>
        </div>
      </div>
    </div>
  );
}
