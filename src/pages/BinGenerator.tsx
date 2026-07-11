import { useState, useRef, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Center, PerspectiveCamera, ContactShadows, Edges, DragControls } from "@react-three/drei";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { 
  Box, Download, Settings, Sliders, 
  Trash2, Layers, Move, MousePointer2, 
  Check, Info, Sparkles, 
  Maximize, Minimize, Activity, Cpu,
  Grid3X3, ArrowUpDown, ArrowLeftRight
} from "lucide-react";

interface BinConfig {
  width: number;
  depth: number;
  height: number;
  thickness: number;
  radius: number;
  dividersX: number;
  dividersY: number;
  divPositionsX?: number[];
  divPositionsY?: number[];
  innerFillet: number;
  stackable: boolean;
  baseColor: string;
}

const PRESETS = [
  {
    name: "Gaveta Escritório",
    config: { width: 120, depth: 180, height: 40, thickness: 1.2, radius: 4, dividersX: 2, dividersY: 2, stackable: false }
  },
  {
    name: "Porta-Ferramentas",
    config: { width: 200, depth: 100, height: 60, thickness: 2.0, radius: 8, dividersX: 4, dividersY: 1, stackable: true }
  },
  {
    name: "Organizador de Mesa",
    config: { width: 80, depth: 80, height: 80, thickness: 1.6, radius: 6, dividersX: 1, dividersY: 1, stackable: false }
  },
  {
    name: "Estojo Slim",
    config: { width: 180, depth: 60, height: 20, thickness: 1.0, radius: 2, dividersX: 1, dividersY: 3, stackable: true }
  }
];

export default function BinGenerator() {
  const [config, setConfig] = useState<BinConfig>({
    width: 80,
    depth: 80,
    height: 40,
    thickness: 1.6,
    radius: 6,
    dividersX: 1,
    dividersY: 1,
    innerFillet: 2,
    stackable: false,
    baseColor: "#e0e0e0"
  });

  const [successMsg, setSuccessMsg] = useState("");

  const handleExportSTL = () => {
    try {
      const exporter = new STLExporter();
      const geometries: THREE.BufferGeometry[] = [];
      
      const { width, depth, height, thickness, radius, dividersX, dividersY, innerFillet, stackable } = config;
      const w = width / 10;
      const d = depth / 10;
      const h = height / 10;
      const t = thickness / 10;
      const r = Math.min(radius / 10, w / 2, d / 2);
      const f = innerFillet / 10;
      const innerW = w - t * 2;
      const innerD = d - t * 2;
      const cellW = innerW / (dividersX + 1);
      const cellD = innerD / (dividersY + 1);

      // 1. Base
      const baseShape = createRoundedRectShape(w, d, r);
      const baseGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false, curveSegments: 24 });
      geometries.push(baseGeom);

      // 2. Walls
      const wallShape = createRoundedRectShape(w, d, r);
      const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
      wallShape.holes.push(innerPath);
      const wallGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false, curveSegments: 24 });
      wallGeom.translate(0, 0, t);
      geometries.push(wallGeom);

            // 3. Dividers
      if (stackable) {
        const lipH = Math.min(t, 0.4);
        const lipW = innerW - 0.04;
        const lipD = innerD - 0.04;
        const lipR = Math.max(0, r - t - 0.02);
        const lipShape = createRoundedRectShape(lipW, lipD, lipR);
        const lipInnerW = lipW - t * 2;
        const lipInnerD = lipD - t * 2;
        if (lipInnerW > 0 && lipInnerD > 0) {
          const lipInnerR = Math.max(0, lipR - t);
          const lipInnerPath = createRoundedRectPath(lipInnerW, lipInnerD, lipInnerR);
          lipShape.holes.push(lipInnerPath);
        }
        const lipGeom = new THREE.ExtrudeGeometry(lipShape, { depth: lipH, bevelEnabled: false, curveSegments: 24 });
        lipGeom.translate(0, 0, -lipH);
        geometries.push(lipGeom);
      }


      // Dividers X (Vertical separators)
      for (let i = 0; i < dividersX; i++) {
        let posX = (i + 1) / (dividersX + 1);
        if (config.divPositionsX && config.divPositionsX.length === dividersX) {
          posX = config.divPositionsX[i];
        }
        const xPos = -innerW / 2 + innerW * posX;
        const divXGeom = new THREE.BoxGeometry(t, innerD, h - t);
        divXGeom.translate(xPos, 0, h / 2 + t / 2);
        geometries.push(divXGeom.toNonIndexed());
      }

      // Dividers Y (Horizontal separators)
      for (let i = 0; i < dividersY; i++) {
        let posY = (i + 1) / (dividersY + 1);
        if (config.divPositionsY && config.divPositionsY.length === dividersY) {
          posY = config.divPositionsY[i];
        }
        const yPos = -innerD / 2 + innerD * posY;
        const divYGeom = new THREE.BoxGeometry(innerW, t, h - t);
        divYGeom.translate(0, yPos, h / 2 + t / 2);
        geometries.push(divYGeom.toNonIndexed());
      }

      // 4. Inner Fillets (Optional visual sugar for easier picking)
      // This is complex for a merge, so we'll skip for base STL or use small boxes
      
      const merged = BufferGeometryUtils.mergeGeometries(geometries);
      const mesh = new THREE.Mesh(merged);
      mesh.rotation.x = -Math.PI / 2;
      mesh.updateMatrixWorld();

      const result = exporter.parse(mesh, { binary: true });
      const blob = new Blob([result], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `organizer-${width}x${depth}-${dividersX+1}x${dividersY+1}.stl`;
      link.click();
      
      showNotification("Organizador exportado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar.");
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#080808]">
      {/* SIDEBAR */}
      <div className="w-full md:w-80 bg-[#0c0c0c] border-r border-zinc-900 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
              <Box className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">Custom Bin & Sorting Tray Generator</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Design custom storage bins, sorting trays, and drawer organizers with adjustable dimensions, grid layout, and rounded corners. Live 3D preview and instant STL download.</p>
        </header>

        <section className="space-y-6">
          <div className="space-y-3 pb-4 border-b border-zinc-900">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
              00. Predefinições
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setConfig({ ...config, ...preset.config, divPositionsX: undefined, divPositionsY: undefined })}
                  className="text-[9px] font-bold uppercase tracking-wider bg-zinc-900 hover:bg-[#00E5FF]/20 text-zinc-400 hover:text-[#00E5FF] transition-colors py-2 rounded border border-zinc-800 hover:border-[#00E5FF]/50"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Maximize className="w-3.5 h-3.5 text-[#00E5FF]" />
              01. Corpo Externo
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Largura (X)</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.width}mm</span>
              </div>
              <input 
                type="range" min="10" max="400" step="1" 
                value={config.width}
                onChange={(e) => setConfig({...config, width: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Profundidade (Y)</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.depth}mm</span>
              </div>
              <input 
                type="range" min="10" max="400" step="1" 
                value={config.depth}
                onChange={(e) => setConfig({...config, depth: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Altura (Z)</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.height}mm</span>
              </div>
              <input 
                type="range" min="10" max="200" step="1" 
                value={config.height} 
                onChange={(e) => setConfig({...config, height: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Grid3X3 className="w-3.5 h-3.5 text-[#00E5FF]" />
              02. Grid de Gavetas
            </h3>
            
            <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded p-2 flex items-start gap-2">
              <MousePointer2 className="w-3 h-3 text-[#00E5FF] mt-0.5" />
              <p className="text-[9px] text-[#00E5FF] uppercase font-bold leading-tight">Dica: Você pode arrastar as divisórias diretamente no preview 3D para reposicioná-las.</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Colunas</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.dividersX + 1}</span>
              </div>
              <input 
                type="range" min="1" max="9" step="1" 
                value={config.dividersX + 1} 
                onChange={(e) => setConfig({...config, dividersX: parseInt(e.target.value) - 1})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Linhas</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.dividersY + 1}</span>
              </div>
              <input 
                type="range" min="1" max="9" step="1" 
                value={config.dividersY + 1} 
                onChange={(e) => setConfig({...config, dividersY: parseInt(e.target.value) - 1})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-black text-white uppercase">Total de Células</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Gaveteiro Final</div>
              </div>
              <div className="text-xl font-black text-[#00E5FF]">{(config.dividersX + 1) * (config.dividersY + 1)}</div>
            </div>

            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 flex flex-col justify-center items-center gap-1">
              <div className="text-[10px] font-black text-white uppercase">Dimensões Totais</div>
              <div className="text-[14px] font-black text-[#00E5FF] tracking-tighter">
                {config.width} <span className="text-zinc-600 text-[10px]">×</span> {config.depth} <span className="text-zinc-600 text-[10px]">×</span> {config.height} <span className="text-zinc-600 text-[10px]">mm</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#00E5FF]" />
              03. Ajustes Técnicos
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Espessura da Parede</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.thickness}mm</span>
              </div>
              <input 
                type="range" min="0.8" max="5.0" step="0.2" 
                value={config.thickness} 
                onChange={(e) => setConfig({...config, thickness: parseFloat(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-bold text-zinc-600">
                <span>0.8mm</span>
                <span>5.0mm</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Arredondamento (Raio)</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.radius}mm</span>
              </div>
              <input 
                type="range" min="0" max="15" step="1" 
                value={config.radius} 
                onChange={(e) => setConfig({...config, radius: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-bold text-zinc-600">
                <span>0mm</span>
                <span>15mm</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-1">
              <label className="text-[9px] uppercase font-bold text-zinc-400">Empilhável (Stacking)</label>
              <button 
                onClick={() => setConfig({...config, stackable: !config.stackable})}
                className={`w-10 h-5 rounded-full transition-all relative ${config.stackable ? 'bg-[#00E5FF]' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.stackable ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleExportSTL}
              className="w-full bg-[#00E5FF] text-black py-4 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)] group"
            >
              <Download className="w-4 h-4 group-hover:bounce" />
              Download Organizador STL
            </button>
          </div>
        </section>
      </div>

      {/* VIEWPORT */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <Canvas shadows camera={{ position: [60, 60, 60], fov: 45 }}>
            <color attach="background" args={["#080808"]} />
            <ambientLight intensity={0.5} />
            <spotLight position={[50, 100, 50]} angle={0.15} penumbra={1} castShadow />
            <pointLight position={[-50, -50, -50]} intensity={0.5} />
            <OrbitControls makeDefault />
            <Grid 
              infiniteGrid 
              fadeDistance={200} 
              cellColor="#222" 
              sectionColor="#444" 
              cellSize={10} 
              sectionSize={50} 
              position={[0, -0.1, 0]}
            />
            <Center bottom>
              <BinMesh config={config} setConfig={setConfig} />
            </Center>
            <ContactShadows position={[0, -0.1, 0]} opacity={0.4} scale={20} blur={1} far={10} />
          </Canvas>
        </div>

        {/* HUD */}
        <div className="absolute top-6 left-6 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-zinc-900 p-4 rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Organizer Preview</span>
            </div>
            <div className="text-[16px] font-black text-white uppercase tracking-tighter">
              {(config.dividersX + 1) * (config.dividersY + 1)} Células Internas
            </div>
            <div className="text-[11px] font-bold text-zinc-400 mt-2 uppercase tracking-wide flex items-center gap-2">
              <span><span className="text-zinc-600">L:</span> {config.width}mm</span>
              <span className="text-zinc-700">×</span>
              <span><span className="text-zinc-600">C:</span> {config.depth}mm</span>
              <span className="text-zinc-700">×</span>
              <span><span className="text-zinc-600">A:</span> {config.height}mm</span>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-500 text-black px-6 py-3 rounded-full flex items-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-2xl">
              <Check className="w-4 h-4" />
              {successMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function DividerX({ config, setConfig, index, innerW, innerD, h, t }: any) {
  const { controls } = useThree<any>();
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  let posX = (index + 1) / (config.dividersX + 1);
  if (config.divPositionsX && config.divPositionsX.length === config.dividersX) {
    posX = config.divPositionsX[index];
  }
  const x = -innerW / 2 + innerW * posX;

  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.setPosition(x, 0, 0);
    return m;
  }, [x]);

  const handleDragEnd = () => {
    if (controls) controls.enabled = true;
    if (ref.current) {
      const newX = ref.current.matrix.elements[12];
      let newPosX = (newX + innerW / 2) / innerW;
      newPosX = Math.max(0.01, Math.min(0.99, newPosX));
      
      const oldArray = (config.divPositionsX && config.divPositionsX.length === config.dividersX) ? config.divPositionsX : Array.from({length: config.dividersX}).map((_, i) => (i + 1) / (config.dividersX + 1));
      const newPositions = [...oldArray];
      newPositions[index] = newPosX;
      setConfig({ ...config, divPositionsX: newPositions });
    }
  };

  return (
    <DragControls 
      ref={ref}
      matrix={matrix}
      dragLimits={[[-innerW/2 + t/2, innerW/2 - t/2], [0, 0], [0, 0]]}
      onDragStart={() => { if(controls) controls.enabled = false; }} 
      onDragEnd={handleDragEnd}
    >
      <mesh 
        position={[0, 0, h / 2 + t / 2]} 
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'ew-resize'; }}
        onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[t, innerD, h - t]} />
        <meshStandardMaterial color={hovered ? "#00E5FF" : config.baseColor} roughness={0.5} />
        <Edges scale={1} threshold={15} color={hovered ? "#00E5FF" : "rgba(0,0,0,0.2)"} />
      </mesh>
    </DragControls>
  );
}

function DividerY({ config, setConfig, index, innerW, innerD, h, t }: any) {
  const { controls } = useThree<any>();
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  let posY = (index + 1) / (config.dividersY + 1);
  if (config.divPositionsY && config.divPositionsY.length === config.dividersY) {
    posY = config.divPositionsY[index];
  }
  const y = -innerD / 2 + innerD * posY;

  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.setPosition(0, y, 0);
    return m;
  }, [y]);

  const handleDragEnd = () => {
    if (controls) controls.enabled = true;
    if (ref.current) {
      const newY = ref.current.matrix.elements[13];
      let newPosY = (newY + innerD / 2) / innerD;
      newPosY = Math.max(0.01, Math.min(0.99, newPosY));
      
      const oldArray = (config.divPositionsY && config.divPositionsY.length === config.dividersY) ? config.divPositionsY : Array.from({length: config.dividersY}).map((_, i) => (i + 1) / (config.dividersY + 1));
      const newPositions = [...oldArray];
      newPositions[index] = newPosY;
      setConfig({ ...config, divPositionsY: newPositions });
    }
  };

  return (
    <DragControls 
      ref={ref}
      matrix={matrix}
      dragLimits={[[0, 0], [-innerD/2 + t/2, innerD/2 - t/2], [0, 0]]}
      onDragStart={() => { if(controls) controls.enabled = false; }} 
      onDragEnd={handleDragEnd}
    >
      <mesh 
        position={[0, 0, h / 2 + t / 2]} 
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'ns-resize'; }}
        onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[innerW, t, h - t]} />
        <meshStandardMaterial color={hovered ? "#00E5FF" : config.baseColor} roughness={0.5} />
        <Edges scale={1} threshold={15} color={hovered ? "#00E5FF" : "rgba(0,0,0,0.2)"} />
      </mesh>
    </DragControls>
  );
}


function BinMesh({ config, setConfig }: { config: BinConfig; setConfig: React.Dispatch<React.SetStateAction<BinConfig>> }) {
  const { width, depth, height, thickness, radius, dividersX, dividersY, stackable } = config;
  
  const w = width / 10;
  const d = depth / 10;
  const h = height / 10;
  const t = thickness / 10;
  const r = Math.min(radius / 10, w / 2, d / 2);

  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const cellW = innerW / (dividersX + 1);
  const cellD = innerD / (dividersY + 1);

    const { baseGeom, wallGeom, lipGeom } = useMemo(() => {
    const baseShape = createRoundedRectShape(w, d, r);
    const bGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false, curveSegments: 24 });
    
    const wallShape = createRoundedRectShape(w, d, r);
    const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
    wallShape.holes.push(innerPath);
    const wGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false, curveSegments: 24 });

    let lGeom = null;
    if (stackable) {
      const lipH = Math.min(t, 0.4);
      const lipW = innerW - 0.04;
      const lipD = innerD - 0.04;
      const lipR = Math.max(0, r - t - 0.02);
      const lipShape = createRoundedRectShape(lipW, lipD, lipR);
      const lipInnerW = lipW - t * 2;
      const lipInnerD = lipD - t * 2;
      if (lipInnerW > 0 && lipInnerD > 0) {
        const lipInnerR = Math.max(0, lipR - t);
        const lipInnerPath = createRoundedRectPath(lipInnerW, lipInnerD, lipInnerR);
        lipShape.holes.push(lipInnerPath);
      }
      lGeom = new THREE.ExtrudeGeometry(lipShape, { depth: lipH, bevelEnabled: false, curveSegments: 24 });
    }

    return { baseGeom: bGeom, wallGeom: wGeom, lipGeom: lGeom };
  }, [w, d, h, t, r, innerW, innerD, stackable]);

    const lipH = Math.min(t, 0.4);
  const zOffset = stackable ? lipH : 0;
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, zOffset, 0]}>
      {stackable && lipGeom && (
        <mesh castShadow receiveShadow position={[0, 0, -lipH]} geometry={lipGeom}>
          <meshStandardMaterial color={config.baseColor} roughness={0.4} />
          <Edges scale={1} threshold={15} color="rgba(0,0,0,0.2)" />
        </mesh>
      )}
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} geometry={baseGeom}>
        <meshStandardMaterial color={config.baseColor} roughness={0.4} />
        <Edges scale={1} threshold={15} color="rgba(0,0,0,0.2)" />
      </mesh>
      
      {/* Walls */}
      <mesh castShadow receiveShadow position={[0, 0, t]} geometry={wallGeom}>
        <meshStandardMaterial color={config.baseColor} roughness={0.4} />
        <Edges scale={1} threshold={15} color="rgba(0,0,0,0.2)" />
      </mesh>

      {/* Dividers X */}
      {Array.from({ length: dividersX }).map((_, i) => (
        <DividerX key={`divx-${i}`} index={i} config={config} setConfig={setConfig} innerW={innerW} innerD={innerD} h={h} t={t} />
      ))}
      {/* Dividers Y */}
      {Array.from({ length: dividersY }).map((_, i) => (
        <DividerY key={`divy-${i}`} index={i} config={config} setConfig={setConfig} innerW={innerW} innerD={innerD} h={h} t={t} />
      ))}
    </group>
  );
}

// Utility Helpers



function createRoundedRectShape(w: number, d: number, r: number) {
  const shape = new THREE.Shape();
  if (r <= 0) {
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.lineTo(-w / 2, -d / 2);
    return shape;
  }
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.absarc(w / 2 - r, -d / 2 + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w / 2, d / 2 - r);
  shape.absarc(w / 2 - r, d / 2 - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.absarc(-w / 2 + r, d / 2 - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.absarc(-w / 2 + r, -d / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  shape.closePath();
  return shape;
}

function createRoundedRectPath(w: number, d: number, r: number) {
  const path = new THREE.Path();
  if (r <= 0) {
    path.moveTo(-w / 2, -d / 2);
    path.lineTo(-w / 2, d / 2);
    path.lineTo(w / 2, d / 2);
    path.lineTo(w / 2, -d / 2);
    path.lineTo(-w / 2, -d / 2);
    return path;
  }
  path.moveTo(-w / 2, -d / 2 + r);
  path.lineTo(-w / 2, d / 2 - r);
  path.absarc(-w / 2 + r, d / 2 - r, r, Math.PI, Math.PI / 2, true);
  path.lineTo(w / 2 - r, d / 2);
  path.absarc(w / 2 - r, d / 2 - r, r, Math.PI / 2, 0, true);
  path.lineTo(w / 2, -d / 2 + r);
  path.absarc(w / 2 - r, -d / 2 + r, r, 0, -Math.PI / 2, true);
  path.lineTo(-w / 2 + r, -d / 2);
  path.absarc(-w / 2 + r, -d / 2 + r, r, -Math.PI / 2, -Math.PI, true);
  return path;
}
