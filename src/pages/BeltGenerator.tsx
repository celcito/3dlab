import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Center } from "@react-three/drei";
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { 
  Settings2, Download, Sparkles, Code, Play, Type, Settings, 
  Circle, Layers, AlignJustify
} from "lucide-react";

type BeltProfile = 'GT2' | 'HTD3M' | 'HTD5M' | 'MXL' | 'XL' | 'L' | 'T5' | 'T10';
type BeltShape = 'loop' | 'straight';
type ToothPlacement = 'inside' | 'outside' | 'both';

interface BeltConfig {
  profile: BeltProfile;
  shape: BeltShape;
  teeth: number;
  width: number;
  tooth_placement: ToothPlacement;
  pitch_override: number;
  backing_thickness_override: number;
}

const BELT_PROFILES: Record<BeltProfile, { pitch: number; depth: number, backing: number }> = {
  'GT2': { pitch: 2.0, depth: 0.75, backing: 0.75 },
  'HTD3M': { pitch: 3.0, depth: 1.14, backing: 1.2 },
  'HTD5M': { pitch: 5.0, depth: 2.06, backing: 1.9 },
  'MXL': { pitch: 2.032, depth: 0.51, backing: 0.6 },
  'XL': { pitch: 5.08, depth: 1.27, backing: 1.0 },
  'L': { pitch: 9.525, depth: 1.91, backing: 1.7 },
  'T5': { pitch: 5.0, depth: 1.2, backing: 1.0 },
  'T10': { pitch: 10.0, depth: 2.5, backing: 2.0 },
};

export default function BeltGenerator() {
  const [config, setConfig] = useState<BeltConfig>({
    profile: 'GT2',
    shape: 'loop',
    teeth: 50,
    width: 6,
    tooth_placement: 'inside',
    pitch_override: 0,
    backing_thickness_override: 0,
  });

  const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'materials'>('info');

  const profileData = BELT_PROFILES[config.profile];
  const pitch = config.pitch_override > 0 ? config.pitch_override : profileData.pitch;
  const backing = config.backing_thickness_override > 0 ? config.backing_thickness_override : profileData.backing;

  const generateScad = () => {
    return `// BOSL2 Timing Belt Generator
include <BOSL2/std.scad>

// --- Configuration ---
$fn = 64;
profile = "${config.profile}";
shape = "${config.shape}"; // "loop" or "straight"
tooth_placement = "${config.tooth_placement}"; // "inside", "outside", or "both"

pitch = ${pitch};
tooth_depth = ${profileData.depth};
backing_thickness = ${backing};
teeth = ${config.teeth};
width = ${config.width};

// --- Computed Values ---
belt_length = pitch * teeth;
pitch_r = belt_length / (2 * PI);
inner_r = pitch_r - (tooth_depth/2);
outer_r = pitch_r + backing_thickness - (tooth_depth/2);

module tooth_profile(tooth_depth) {
    // simplified tooth profile
    translate([0, tooth_depth/2, 0])
    scale([1, 1.2, 1])
    circle(r=tooth_depth);
}

module straight_belt() {
    linear_extrude(height=width) {
        union() {
            // Backing
            translate([0, backing_thickness/2, 0])
            square([belt_length, backing_thickness], center=true);
            
            // Teeth Inside (facing negative Y)
            if (tooth_placement == "inside" || tooth_placement == "both") {
                for(i=[0:teeth-1]) {
                    translate([i*pitch - belt_length/2, 0, 0])
                    rotate([0, 0, 180])
                    tooth_profile(tooth_depth);
                }
            }
            
            // Teeth Outside (facing positive Y)
            if (tooth_placement == "outside" || tooth_placement == "both") {
                for(i=[0:teeth-1]) {
                    translate([i*pitch - belt_length/2, backing_thickness, 0])
                    tooth_profile(tooth_depth);
                }
            }
        }
    }
}

module loop_belt() {
    linear_extrude(height=width) {
        difference() {
            circle(r=outer_r);
            circle(r=inner_r);
        }
        
        // Inside Teeth
        if (tooth_placement == "inside" || tooth_placement == "both") {
            for(i=[0:teeth-1]) {
                rotate([0, 0, i * (360/teeth)])
                translate([inner_r, 0, 0])
                rotate([0, 0, 180])
                tooth_profile(tooth_depth);
            }
        }
        
        // Outside Teeth
        if (tooth_placement == "outside" || tooth_placement == "both") {
            for(i=[0:teeth-1]) {
                rotate([0, 0, i * (360/teeth)])
                translate([outer_r, 0, 0])
                tooth_profile(tooth_depth);
            }
        }
    }
}

// --- Render ---
if (shape == "straight") {
    straight_belt();
} else {
    loop_belt();
}
`;
  };

  const handleExportSTL = () => {
    try {
      const exporter = new STLExporter();
      const geom = createBeltGeometry(config, profileData);
      const mesh = new THREE.Mesh(geom);
      
      mesh.rotation.x = -Math.PI / 2;
      mesh.updateMatrixWorld();

      const result = exporter.parse(mesh, { binary: true });
      const blob = new Blob([result], { type: "application/octet-stream" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `belt_${config.profile}_${config.shape}_${config.teeth}T_${Date.now()}.stl`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar STL.");
    }
  };

  const handleDownloadScad = () => {
    const code = generateScad();
    const blob = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `belt_${config.profile}_${config.shape}_${config.teeth}T_${Date.now()}.scad`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#080808]">
      <div className="w-full md:w-[400px] bg-[#0c0c0c] border-r border-zinc-900 flex flex-col">
        <header className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">Belt Gen</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase leading-relaxed">
            Parametric timing belts. GT2, HTD, MXL, and more.
          </p>
        </header>

        <div className="px-6 pb-2 shrink-0">
          <div className="flex bg-[#111] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'info' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'settings' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Config
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'materials' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Print
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 pt-2">
          {activeTab === 'info' ? (
            <section className="space-y-6 pb-10">
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-[#00E5FF]" />
                  Quick Start
                </h3>
                
                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-[12px] font-black text-white mb-2">1. Select a Belt Type</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Choose from a variety of timing belt profiles, including MXL, XL, GT2, HTD, and T-series. Adjust key parameters like number of teeth, width, and tooth placement.
                  </p>
                </div>

                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-[12px] font-black text-white mb-2">2. Customize Your Belt</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
                    Each belt type comes with flexible options:
                  </p>
                  <ul className="text-[10px] text-zinc-500 space-y-1 ml-4 list-disc marker:text-[#00E5FF]">
                    <li><strong className="text-zinc-300">Belt Shape:</strong> Choose between loop (closed) or straight (open).</li>
                    <li><strong className="text-zinc-300">Pitch & Backing:</strong> Override standard values to customize tooth spacing and backing thickness.</li>
                    <li><strong className="text-zinc-300">Teeth Config:</strong> Select if teeth should be on the inside, outside, or both sides.</li>
                  </ul>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mt-2 border-t border-zinc-800 pt-2">
                    Standard values follow industry specs, but custom overrides allow for unique designs or make them easier to print.
                  </p>
                </div>

                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-[12px] font-black text-white mb-2">3. Render and Export</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Generate the belt and export it for slicing. It is recommended to print with TPU for flexibility and durability. Use the recommended print profile settings.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                  Features
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <h5 className="text-[10px] font-bold text-white mb-1">Multiple Belt Types</h5>
                    <p className="text-[9px] text-zinc-500">Supports a wide range of profiles: GT2, HTD, T-series, XL, etc.</p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <h5 className="text-[10px] font-bold text-white mb-1">Customizable Geometry</h5>
                    <p className="text-[9px] text-zinc-500">Fine-tune width, pitch, backing thickness, and teeth placement.</p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <h5 className="text-[10px] font-bold text-white mb-1">Precision Modeling</h5>
                    <p className="text-[9px] text-zinc-500">Built to match real-world profiles while maintaining clean geometry.</p>
                  </div>
                </div>
              </div>
            </section>
          ) : activeTab === 'settings' ? (
            <section className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                  01. Perfil da Correia
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(BELT_PROFILES) as BeltProfile[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setConfig({...config, profile: t})}
                      className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                        config.profile === t
                          ? "bg-[#00E5FF]/10 border-[#00E5FF]/50 text-[#00E5FF]"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
                  02. Formato e Dentes
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'loop', label: 'Loop (Fechada)' },
                    { id: 'straight', label: 'Reta (Aberta)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setConfig({...config, shape: t.id as BeltShape})}
                      className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                        config.shape === t.id
                          ? "bg-[#00E5FF]/10 border-[#00E5FF]/50 text-[#00E5FF]"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 mt-4">
                  <label className="text-[9px] uppercase font-bold text-zinc-600 block">Posição dos Dentes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'inside', label: 'Interno' },
                      { id: 'outside', label: 'Externo' },
                      { id: 'both', label: 'Ambos' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setConfig({...config, tooth_placement: t.id as ToothPlacement})}
                        className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                          config.tooth_placement === t.id
                            ? "bg-[#00E5FF]/10 border-[#00E5FF]/50 text-[#00E5FF]"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between">
                    <label className="text-[9px] uppercase font-bold text-zinc-600">Qtd Dentes (Teeth)</label>
                    <span className="text-[10px] font-mono text-[#00E5FF]">{config.teeth}</span>
                  </div>
                  <input 
                    type="range" min="10" max="250" step="1" 
                    value={config.teeth}
                    onChange={(e) => setConfig({...config, teeth: parseInt(e.target.value)})}
                    className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-[9px] uppercase font-bold text-zinc-600">Largura (Width)</label>
                    <span className="text-[10px] font-mono text-[#00E5FF]">{config.width}mm</span>
                  </div>
                  <input 
                    type="range" min="2" max="50" step="0.5" 
                    value={config.width}
                    onChange={(e) => setConfig({...config, width: parseFloat(e.target.value)})}
                    className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-[#00E5FF]" />
                  03. Custom Overrides
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-[9px] uppercase font-bold text-zinc-600">Pitch Override (0=Auto)</label>
                    <span className="text-[10px] font-mono text-[#00E5FF]">{config.pitch_override}</span>
                  </div>
                  <input 
                    type="range" min="0" max="20" step="0.1" 
                    value={config.pitch_override}
                    onChange={(e) => setConfig({...config, pitch_override: parseFloat(e.target.value)})}
                    className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-[9px] uppercase font-bold text-zinc-600">Backing Override (0=Auto)</label>
                    <span className="text-[10px] font-mono text-[#00E5FF]">{config.backing_thickness_override}</span>
                  </div>
                  <input 
                    type="range" min="0" max="5" step="0.1" 
                    value={config.backing_thickness_override}
                    onChange={(e) => setConfig({...config, backing_thickness_override: parseFloat(e.target.value)})}
                    className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 pb-10">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleExportSTL}
                    className="w-full bg-[#00E5FF] text-black py-4 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)] group"
                  >
                    <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                    Download Preview STL
                  </button>
                  <button
                    onClick={handleDownloadScad}
                    className="w-full bg-zinc-800 text-zinc-300 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all group"
                  >
                    <Code className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                    Download OpenSCAD (.scad)
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-6 pb-10">
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
                  Recomendações de Impressão
                </h3>
                
                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-2xl rounded-full" />
                  <h4 className="text-[12px] font-black text-white mb-3">TPU (Altamente Recomendado)</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-zinc-400 font-mono mb-3">
                    <div>Nozzle: <span className="text-[#00E5FF]">220-230°C</span></div>
                    <div>Bed: <span className="text-[#00E5FF]">40-50°C</span></div>
                    <div>Layer: <span className="text-[#00E5FF]">0.12 - 0.16mm</span></div>
                    <div>Infill: <span className="text-[#00E5FF]">100% (Solid)</span></div>
                    <div>Speed: <span className="text-[#00E5FF]">Max 30mm/s</span></div>
                    <div>Walls: <span className="text-[#00E5FF]">All walls (100%)</span></div>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800/50 pt-2">
                    TPU is required for functional belts to provide necessary flexibility and grip. Print very slowly and avoid retractions. Ensure your TPU is dry for the best dimensional accuracy.
                  </p>
                </div>

                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full" />
                  <h4 className="text-[12px] font-black text-white mb-3">PLA / PETG (Apenas Prototipagem)</h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    While rigid materials can be used for fit-testing pulleys, they will quickly break or slip if used in an actual drive system. Use exclusively for static test-fits.
                  </p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3 items-start">
                  <Settings className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-orange-200/70 leading-relaxed">
                    <strong className="text-orange-400 block mb-1">Small Belts Warning</strong>
                    Very small timing belts may not print well even in TPU due to printer resolution limits and filament oozing. Consider scaling up or using thicker profiles (HTD5M instead of GT2) for tiny belts.
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#050505] relative">
        <div className="h-2/5 md:h-1/3 border-b border-zinc-900 bg-[#0a0a0a] relative flex flex-col">
          <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
            <Code className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">OpenSCAD Code</span>
          </div>
          <div className="flex-1 overflow-auto p-6 pt-12 custom-scrollbar">
            <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed">
              {generateScad()}
            </pre>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Visualização Simbólica</span>
          </div>
          <Canvas shadows camera={{ position: [0, 40, 60], fov: 45 }}>
            <color attach="background" args={["#050505"]} />
            <ambientLight intensity={0.5} />
            <spotLight position={[50, 50, 50]} angle={0.2} penumbra={1} castShadow />
            <pointLight position={[-50, -50, -50]} intensity={0.5} />
            <OrbitControls makeDefault />
            
            <Grid 
              infiniteGrid 
              fadeDistance={100} 
              sectionColor="#00E5FF" 
              cellColor="#111" 
              cellSize={2} 
              sectionSize={10} 
            />

            <Center>
              <PlaceholderBelt config={config} profileData={profileData} />
            </Center>
          </Canvas>
        </div>
      </div>
    </div>
  );
}

function createBeltGeometry(config: BeltConfig, profileData: { pitch: number; depth: number, backing: number }) {
  const shape = new THREE.Shape();
  
  const pitch = config.pitch_override > 0 ? config.pitch_override : profileData.pitch;
  const backing = config.backing_thickness_override > 0 ? config.backing_thickness_override : profileData.backing;
  const tooth_depth = profileData.depth;
  const belt_length = pitch * config.teeth;
  
  if (config.shape === 'straight') {
    // Generate straight belt shape on XY plane
    const hl = belt_length / 2;
    
    // Top surface (backing or outside teeth)
    if (config.tooth_placement === 'outside' || config.tooth_placement === 'both') {
      for (let i = config.teeth - 1; i >= 0; i--) {
        const xCenter = (i * pitch) - hl + (pitch/2);
        shape.lineTo(xCenter + tooth_depth*0.8, backing);
        shape.lineTo(xCenter + tooth_depth*0.5, backing + tooth_depth);
        shape.lineTo(xCenter - tooth_depth*0.5, backing + tooth_depth);
        shape.lineTo(xCenter - tooth_depth*0.8, backing);
      }
    } else {
      shape.moveTo(hl, backing);
      shape.lineTo(-hl, backing);
    }
    
    // Bottom surface (inside teeth or flat)
    if (config.tooth_placement === 'inside' || config.tooth_placement === 'both') {
      if (shape.getPoints().length === 0) shape.moveTo(-hl, 0);
      for (let i = 0; i < config.teeth; i++) {
        const xCenter = (i * pitch) - hl + (pitch/2);
        shape.lineTo(xCenter - tooth_depth*0.8, 0);
        shape.lineTo(xCenter - tooth_depth*0.5, -tooth_depth);
        shape.lineTo(xCenter + tooth_depth*0.5, -tooth_depth);
        shape.lineTo(xCenter + tooth_depth*0.8, 0);
      }
      shape.lineTo(hl, 0);
    } else {
      if (shape.getPoints().length === 0) shape.moveTo(-hl, 0);
      shape.lineTo(hl, 0);
    }
    
    const p = new THREE.Shape();
    // start bottom right
    p.moveTo(hl, 0);
    // bottom edge (moving left)
    if (config.tooth_placement === 'inside' || config.tooth_placement === 'both') {
        for (let i = config.teeth - 1; i >= 0; i--) {
            const x = (i * pitch) - hl + pitch/2;
            p.lineTo(x + tooth_depth*0.6, 0);
            p.lineTo(x + tooth_depth*0.3, -tooth_depth);
            p.lineTo(x - tooth_depth*0.3, -tooth_depth);
            p.lineTo(x - tooth_depth*0.6, 0);
        }
    }
    p.lineTo(-hl, 0);
    // left edge
    p.lineTo(-hl, backing);
    // top edge (moving right)
    if (config.tooth_placement === 'outside' || config.tooth_placement === 'both') {
        for (let i = 0; i < config.teeth; i++) {
            const x = (i * pitch) - hl + pitch/2;
            p.lineTo(x - tooth_depth*0.6, backing);
            p.lineTo(x - tooth_depth*0.3, backing + tooth_depth);
            p.lineTo(x + tooth_depth*0.3, backing + tooth_depth);
            p.lineTo(x + tooth_depth*0.6, backing);
        }
    }
    p.lineTo(hl, backing);
    // right edge
    p.lineTo(hl, 0);
    
    const geom = new THREE.ExtrudeGeometry(p, {
      depth: config.width,
      bevelEnabled: false,
      curveSegments: 16
    });
    geom.center();
    return geom;
    
  } else {
    // Loop
    const pitch_r = belt_length / (2 * Math.PI);
    const inner_r = pitch_r - (tooth_depth/2);
    const outer_r = pitch_r + backing - (tooth_depth/2);
    
    const p = new THREE.Shape();
    const numPts = config.teeth * 10;
    
    // Outside
    for (let i = 0; i <= numPts; i++) {
      const a = (i / numPts) * Math.PI * 2;
      const teethAngle = (Math.PI * 2) / config.teeth;
      const la = a % teethAngle;
      const t = la / teethAngle;
      
      let r = outer_r;
      if (config.tooth_placement === 'outside' || config.tooth_placement === 'both') {
          if (t > 0.3 && t < 0.7) {
              // bump out
              r = outer_r + tooth_depth * Math.sin(((t - 0.3) / 0.4) * Math.PI);
          }
      }
      
      if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    
    // Inside hole
    const hole = new THREE.Path();
    for (let i = 0; i <= numPts; i++) {
      // Go backwards for hole
      const a = ((numPts - i) / numPts) * Math.PI * 2;
      const teethAngle = (Math.PI * 2) / config.teeth;
      const la = a % teethAngle;
      const t = la / teethAngle;
      
      let r = inner_r;
      if (config.tooth_placement === 'inside' || config.tooth_placement === 'both') {
          if (t > 0.3 && t < 0.7) {
              // bump in (towards center) -> smaller radius
              r = inner_r - tooth_depth * Math.sin(((t - 0.3) / 0.4) * Math.PI);
          }
      }
      
      if (i === 0) hole.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else hole.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.holes.push(hole);
    
    const geom = new THREE.ExtrudeGeometry(p, {
      depth: config.width,
      bevelEnabled: false,
      curveSegments: 16
    });
    geom.center();
    return geom;
  }
}

function PlaceholderBelt({ config, profileData }: { config: BeltConfig, profileData: any }) {
  const geom = useMemo(() => createBeltGeometry(config, profileData), [config, profileData]);

  return (
    <mesh castShadow receiveShadow geometry={geom} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial 
        color="#eeeeee" 
        metalness={0.2}
        roughness={0.9}
      />
    </mesh>
  );
}
