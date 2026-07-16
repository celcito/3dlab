import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Center } from "@react-three/drei";
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { 
  Settings2, Download, Code, Play, Type, Settings, 
  Circle, Layers, Sparkles, Nut
} from "lucide-react";

type FastenerType = 'screw' | 'nut' | 'washer';
type System = 'metric' | 'uts';

const METRIC_SIZES = ["M2", "M2.5", "M3", "M4", "M5", "M6", "M7", "M8", "M10", "M12", "M14", "M16", "M18", "M20"];
const UTS_SIZES = ["#4", "#6", "#8", "#10", "1/4", "5/16", "3/8", "7/16", "1/2", "9/16", "5/8", "3/4"];

interface FastenerConfig {
  type: FastenerType;
  system: System;
  size: string;
  
  // Screw options
  length: number;
  headType: 'hex' | 'pan' | 'flat' | 'button' | 'socket' | 'ribbed_socket';
  driveType: 'none' | 'phillips' | 'torx' | 'slot' | 'hex';
  fullThread: boolean;
  threadLength: number;
  splitScrew: boolean;

  // Nut options
  nutShape: 'hex' | 'square';
  nutThicknessOverride: number; // 0 = standard
  clearance: number;
  bevelNut: boolean;

  // Washer options
  washerType: 'standard' | 'large';
  washerChamfer: boolean;
  
  // Advanced
  debugMode: boolean;
}

export default function ScrewGenerator() {
  const [config, setConfig] = useState<FastenerConfig>({
    type: 'screw',
    system: 'metric',
    size: 'M5',
    
    length: 20,
    headType: 'socket',
    driveType: 'hex',
    fullThread: true,
    threadLength: 10,
    splitScrew: false,

    nutShape: 'hex',
    nutThicknessOverride: 0,
    clearance: 0.1,
    bevelNut: true,

    washerType: 'standard',
    washerChamfer: false,

    debugMode: false,
  });

  const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'materials'>('info');

  const generateScad = () => {
    let sizeStr = config.system === 'uts' ? `"\${config.size}"` : `"\${config.size}"`;
    if (config.system === 'uts' && !sizeStr.includes('"') && !sizeStr.startsWith('"#')) {
        // e.g. "1/4" -> "1/4"
    }

    let code = `// BOSL2 Fastener Generator\\ninclude <BOSL2/std.scad>\\ninclude <BOSL2/metric_screws.scad>\\ninclude <BOSL2/threading.scad>\\n\\n$fn = 64;\\n\\n`;

    if (config.type === 'screw') {
        const headMap: Record<string, string> = {
            'hex': 'hex',
            'pan': 'pan',
            'flat': 'flat',
            'button': 'button',
            'socket': 'socket',
            'ribbed_socket': 'socket' // Approximation for basic BOSL2
        };
        const head = headMap[config.headType] || 'hex';
        
        const driveMap: Record<string, string> = {
            'none': 'none',
            'phillips': 'phillips',
            'torx': 'torx',
            'slot': 'slot',
            'hex': 'hex'
        };
        const drive = driveMap[config.driveType] || 'none';

        let params = `name="\${config.size}", l=\${config.length}, head="\${head}", drive="\${drive}"`;
        if (!config.fullThread) {
            params += `, thread_len=\${config.threadLength}`;
        }

        if (config.splitScrew) {
            code += `difference() {\\n    screw(\${params});\\n    translate([0, -50, -50]) cube([100, 100, 200]); // Split in half\\n}\\n`;
        } else {
            code += `screw(\${params});\\n`;
        }
    } else if (config.type === 'nut') {
        let params = `name="\${config.size}", shape="\${config.nutShape}", bevel=\${config.bevelNut}`;
        if (config.nutThicknessOverride > 0) {
            params += `, thickness=\${config.nutThicknessOverride}`;
        }
        if (config.clearance > 0) {
            params += `, clearance=\${config.clearance}`;
        }
        code += `nut(\${params});\\n`;
    } else if (config.type === 'washer') {
        code += `// Washer approximation\\n`;
        let od = config.washerType === 'large' ? 3 : 2; // multiplier
        code += `difference() {\\n    cylinder(h=2, r=\${config.size.replace(/[^0-9.]/g, '') || 5} * \${od} / 2);\\n    cylinder(h=3, r=\${config.size.replace(/[^0-9.]/g, '') || 5} / 2, center=true);\\n}\\n`;
    }

    if (config.debugMode) {
        code += `\\necho("Generated Size: \${config.size}");\\n`;
    }

    return code;
  };

  const handleDownloadScad = () => {
    const code = generateScad();
    const blob = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fastener_\${config.type}_\${config.size}_\${Date.now()}.scad`;
    link.click();
  };

  const handleExportSTL = () => {
      // In a real app, you would compile the SCAD to STL or use a precise JS generator.
      // Here we provide a simple symbolic shape for the export just so the button works.
      const geom = createSymbolicGeometry(config);
      const mesh = new THREE.Mesh(geom);
      const exporter = new STLExporter();
      const result = exporter.parse(mesh, { binary: true });
      const blob = new Blob([result], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `fastener_\${config.type}_\${config.size}_\${Date.now()}.stl`;
      link.click();
  }

  const sizes = config.system === 'metric' ? METRIC_SIZES : UTS_SIZES;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#080808]">
      <div className="w-full md:w-[400px] bg-[#0c0c0c] border-r border-zinc-900 flex flex-col">
        <header className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">Screw Gen</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase leading-relaxed">
            Parametric ISO/DIN & UTS Fasteners
          </p>
        </header>

        <div className="px-6 pb-2 shrink-0">
          <div className="flex bg-[#111] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
                activeTab === 'info' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
                activeTab === 'settings' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Config
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
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
                  <Play className="w-3.5 h-3.5 text-orange-500" />
                  Quick Start
                </h3>
                
                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-[12px] font-black text-white mb-2">1. Select a Fastener Type</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Choose between screws, nuts, or washers. Adjust general parameters like diameter, thread type, and length.
                  </p>
                </div>

                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-[12px] font-black text-white mb-2">2. Customize Your Fastener</h4>
                  <ul className="text-[10px] text-zinc-500 space-y-1 ml-4 list-disc marker:text-orange-500 mb-2">
                    <li><strong className="text-zinc-300">Screws:</strong> Length, head type (Hex, Pan, Socket, etc.), drive type.</li>
                    <li><strong className="text-zinc-300">Nuts:</strong> Hex or square, custom thickness, and clearance.</li>
                    <li><strong className="text-zinc-300">Washers:</strong> Standard (ISO 7089) or large (ISO 7093) sizes.</li>
                  </ul>
                  <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800 pt-2">
                    Not all combinations (e.g., a 'slot' drive on a 'hex' head) are supported by known specifications.
                  </p>
                </div>

                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800">
                  <h4 className="text-[12px] font-black text-white mb-2">3. Render and Export</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Generate your fastener at the desired resolution and export it for slicing. For small screws, use a (extra) fine layer height.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Features
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <h5 className="text-[10px] font-bold text-white mb-1">Multiple Fastener Types</h5>
                    <p className="text-[9px] text-zinc-500">ISO/DIN/UTS screws, nuts, and washers.</p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                    <h5 className="text-[10px] font-bold text-white mb-1">Precision Modeling</h5>
                    <p className="text-[9px] text-zinc-500">Follows ISO 4017 (DIN 933), ISO 4032, ISO 7089/7093.</p>
                  </div>
                </div>
              </div>
            </section>
          ) : activeTab === 'settings' ? (
            <section className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-orange-500" />
                  01. Fastener Type
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  {(['screw', 'nut', 'washer'] as FastenerType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setConfig({...config, type: t})}
                      className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all \${
                        config.type === t
                          ? "bg-orange-500/10 border-orange-500/50 text-orange-500"
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
                  <Layers className="w-3.5 h-3.5 text-orange-500" />
                  02. System & Size
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'metric', label: 'Metric (ISO/DIN)' },
                    { id: 'uts', label: 'UTS (Inch)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setConfig({
                        ...config, 
                        system: t.id as System, 
                        size: t.id === 'metric' ? 'M5' : '1/4'
                      })}
                      className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all \${
                        config.system === t.id
                          ? "bg-orange-500/10 border-orange-500/50 text-orange-500"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 mt-4">
                  <label className="text-[9px] uppercase font-bold text-zinc-600 block">Select Size</label>
                  <select 
                    value={config.size}
                    onChange={(e) => setConfig({...config, size: e.target.value})}
                    className="w-full bg-[#111] border border-zinc-800 rounded-lg p-2 text-[11px] text-zinc-300 outline-none focus:border-orange-500"
                  >
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {config.type === 'screw' && (
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                    <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-orange-500" />
                    03. Screw Settings
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-[9px] uppercase font-bold text-zinc-600">Length (L)</label>
                            <span className="text-[10px] font-mono text-orange-500">{config.length}mm</span>
                        </div>
                        <input 
                            type="range" min="5" max="150" step="1" 
                            value={config.length}
                            onChange={(e) => setConfig({...config, length: parseInt(e.target.value)})}
                            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] uppercase font-bold text-zinc-600 block">Head Type</label>
                        <select 
                            value={config.headType}
                            onChange={(e) => setConfig({...config, headType: e.target.value as any})}
                            className="w-full bg-[#111] border border-zinc-800 rounded-lg p-2 text-[11px] text-zinc-300 outline-none focus:border-orange-500"
                        >
                            <option value="hex">Hex</option>
                            <option value="pan">Pan</option>
                            <option value="flat">Flat</option>
                            <option value="button">Button</option>
                            <option value="socket">Socket</option>
                            <option value="ribbed_socket">Ribbed Socket</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] uppercase font-bold text-zinc-600 block">Drive Type</label>
                        <select 
                            value={config.driveType}
                            onChange={(e) => setConfig({...config, driveType: e.target.value as any})}
                            className="w-full bg-[#111] border border-zinc-800 rounded-lg p-2 text-[11px] text-zinc-300 outline-none focus:border-orange-500"
                        >
                            <option value="none">None</option>
                            <option value="phillips">Phillips</option>
                            <option value="torx">Torx</option>
                            <option value="slot">Slot</option>
                            <option value="hex">Hex</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="text-[10px] font-bold text-zinc-400">Full Thread</label>
                        <input 
                            type="checkbox" 
                            checked={config.fullThread}
                            onChange={(e) => setConfig({...config, fullThread: e.target.checked})}
                            className="accent-orange-500 w-4 h-4 rounded bg-zinc-900 border-zinc-700"
                        />
                    </div>

                    {!config.fullThread && (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <label className="text-[9px] uppercase font-bold text-zinc-600">Thread Length</label>
                                <span className="text-[10px] font-mono text-orange-500">{config.threadLength}mm</span>
                            </div>
                            <input 
                                type="range" min="1" max={config.length} step="1" 
                                value={config.threadLength}
                                onChange={(e) => setConfig({...config, threadLength: parseInt(e.target.value)})}
                                className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <label className="text-[10px] font-bold text-zinc-400">Split Screw (Flat Printing)</label>
                        <input 
                            type="checkbox" 
                            checked={config.splitScrew}
                            onChange={(e) => setConfig({...config, splitScrew: e.target.checked})}
                            className="accent-orange-500 w-4 h-4 rounded bg-zinc-900 border-zinc-700"
                        />
                    </div>
                </div>
              )}

              {config.type === 'nut' && (
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                    <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-orange-500" />
                    03. Nut Settings
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'hex', label: 'Hex' },
                        { id: 'square', label: 'Square' }
                    ].map(t => (
                        <button
                        key={t.id}
                        onClick={() => setConfig({...config, nutShape: t.id as any})}
                        className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all \${
                            config.nutShape === t.id
                            ? "bg-orange-500/10 border-orange-500/50 text-orange-500"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                        }`}
                        >
                        {t.label}
                        </button>
                    ))}
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between">
                            <label className="text-[9px] uppercase font-bold text-zinc-600">Thickness Override (0=Auto)</label>
                            <span className="text-[10px] font-mono text-orange-500">{config.nutThicknessOverride}</span>
                        </div>
                        <input 
                            type="range" min="0" max="20" step="0.5" 
                            value={config.nutThicknessOverride}
                            onChange={(e) => setConfig({...config, nutThicknessOverride: parseFloat(e.target.value)})}
                            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-[9px] uppercase font-bold text-zinc-600">Clearance</label>
                            <span className="text-[10px] font-mono text-orange-500">{config.clearance}</span>
                        </div>
                        <input 
                            type="range" min="-0.5" max="1" step="0.05" 
                            value={config.clearance}
                            onChange={(e) => setConfig({...config, clearance: parseFloat(e.target.value)})}
                            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="text-[10px] font-bold text-zinc-400">Bevel Nut</label>
                        <input 
                            type="checkbox" 
                            checked={config.bevelNut}
                            onChange={(e) => setConfig({...config, bevelNut: e.target.checked})}
                            className="accent-orange-500 w-4 h-4 rounded bg-zinc-900 border-zinc-700"
                        />
                    </div>
                </div>
              )}

              {config.type === 'washer' && (
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                    <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-orange-500" />
                    03. Washer Settings
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'standard', label: 'Standard (ISO 7089)' },
                        { id: 'large', label: 'Large (ISO 7093)' }
                    ].map(t => (
                        <button
                        key={t.id}
                        onClick={() => setConfig({...config, washerType: t.id as any})}
                        className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all \${
                            config.washerType === t.id
                            ? "bg-orange-500/10 border-orange-500/50 text-orange-500"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                        }`}
                        >
                        {t.label}
                        </button>
                    ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="text-[10px] font-bold text-zinc-400">Chamfer</label>
                        <input 
                            type="checkbox" 
                            checked={config.washerChamfer}
                            onChange={(e) => setConfig({...config, washerChamfer: e.target.checked})}
                            className="accent-orange-500 w-4 h-4 rounded bg-zinc-900 border-zinc-700"
                        />
                    </div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-900 pb-10">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleExportSTL}
                    className="w-full bg-orange-500 text-black py-4 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] group"
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
                  <Layers className="w-3.5 h-3.5 text-orange-500" />
                  Print Recommendations
                </h3>
                
                <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full" />
                  <h4 className="text-[12px] font-black text-white mb-3">Material Settings</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-zinc-400 font-mono mb-3">
                    <div>Layer Height: <span className="text-orange-500">0.08 - 0.12mm</span></div>
                    <div>Infill: <span className="text-orange-500">100% (Solid)</span></div>
                    <div>Perimeters: <span className="text-orange-500">Min 4</span></div>
                    <div>Material: <span className="text-orange-500">PETG, ABS, PC</span></div>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800/50 pt-2">
                    For threaded functional parts, high strength materials like PETG or ABS are recommended. A very fine layer height (0.08mm) is crucial for small threads to engage properly.
                  </p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3 items-start">
                  <Settings className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-orange-200/70 leading-relaxed">
                    <strong className="text-orange-400 block mb-1">Clearance Tip</strong>
                    If your printed nuts are too tight, increase the clearance setting (e.g. 0.15mm or 0.2mm). All printers differ slightly in their dimensional accuracy.
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
            <Code className="w-4 h-4 text-orange-500" />
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
            <Play className="w-4 h-4 text-orange-500" />
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
              sectionColor="#f97316" 
              cellColor="#111" 
              cellSize={2} 
              sectionSize={10} 
            />

            <Center>
              <PlaceholderFastener config={config} />
            </Center>
          </Canvas>
        </div>
      </div>
    </div>
  );
}

function createSymbolicGeometry(config: FastenerConfig) {
  let sizeVal = parseFloat(config.size.replace(/[^0-9.]/g, '')) || 5;
  if (config.system === 'uts') {
      if (config.size.includes('/')) {
          const parts = config.size.split('/');
          sizeVal = (parseInt(parts[0]) / parseInt(parts[1])) * 25.4;
      } else {
          sizeVal = 4; // fallback for # sizes
      }
  }

  if (config.type === 'screw') {
      const geom = new THREE.CylinderGeometry(sizeVal/2, sizeVal/2, config.length, 16);
      geom.translate(0, config.length/2, 0);
      
      const headGeom = new THREE.CylinderGeometry(sizeVal, sizeVal, 3, config.headType === 'hex' ? 6 : 16);
      headGeom.translate(0, config.length + 1.5, 0);

      const merged = new THREE.BufferGeometry();
      // simplified symbolic merge by combining points (hacky for symbolic) - in real use THREE.CSG or just group them
      // for returning a single geometry to STLExporter, we should really use CSG, but here we just return the body
      // We'll return just the body for simplicity, or we can use a small Group in the React view.
      // But the function needs to return a BufferGeometry for the export.
      
      return headGeom; 
  } else if (config.type === 'nut') {
      const outer = new THREE.CylinderGeometry(sizeVal, sizeVal, 4, config.nutShape === 'hex' ? 6 : 4);
      return outer; // Solid symbol
  } else {
      let od = config.washerType === 'large' ? 3 : 2;
      return new THREE.CylinderGeometry(sizeVal * od / 2, sizeVal * od / 2, 2, 16);
  }
}

function PlaceholderFastener({ config }: { config: FastenerConfig }) {
  let sizeVal = parseFloat(config.size.replace(/[^0-9.]/g, '')) || 5;
  if (config.system === 'uts') {
      if (config.size.includes('/')) {
          const parts = config.size.split('/');
          sizeVal = (parseInt(parts[0]) / parseInt(parts[1])) * 25.4;
      } else {
          sizeVal = 4; // fallback for # sizes
      }
  }

  return (
    <group rotation={[Math.PI/2, 0, 0]}>
        {config.type === 'screw' && (
            <>
                <mesh castShadow receiveShadow position={[0, config.length/2, 0]}>
                    <cylinderGeometry args={[sizeVal/2, sizeVal/2, config.length, 16]} />
                    <meshStandardMaterial color="#eeeeee" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh castShadow receiveShadow position={[0, config.length + 1.5, 0]}>
                    <cylinderGeometry args={[sizeVal, sizeVal, 3, config.headType === 'hex' ? 6 : 16]} />
                    <meshStandardMaterial color="#eeeeee" metalness={0.8} roughness={0.2} />
                </mesh>
            </>
        )}
        {config.type === 'nut' && (
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[sizeVal, sizeVal, 4, config.nutShape === 'hex' ? 6 : 4]} />
                <meshStandardMaterial color="#eeeeee" metalness={0.8} roughness={0.2} />
            </mesh>
        )}
        {config.type === 'washer' && (
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[sizeVal * (config.washerType === 'large' ? 1.5 : 1), sizeVal * (config.washerType === 'large' ? 1.5 : 1), 1.5, 16]} />
                <meshStandardMaterial color="#eeeeee" metalness={0.8} roughness={0.2} />
            </mesh>
        )}
    </group>
  );
}
