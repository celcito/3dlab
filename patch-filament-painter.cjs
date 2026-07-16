const fs = require('fs');
const path = 'src/pages/FilamentPainter.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add activeTab state
code = code.replace(
  'const [layers, setLayers] = useState<ColorLayer[]>([',
  'const [activeTab, setActiveTab] = useState<"settings" | "materials">("settings");\n  const [layers, setLayers] = useState<ColorLayer[]>([ '
);

// Add Beaker icon to import
code = code.replace(
  'Image as ImageIcon, Check, Layers, AlertCircle } from "lucide-react";',
  'Image as ImageIcon, Check, Layers, AlertCircle, Beaker } from "lucide-react";'
);

// Add the tabs UI
const tabsUI = `        <div className="flex bg-[#111] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('settings')}
            className={\`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
              activeTab === 'settings' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
            }\`}
          >
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={\`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
              activeTab === 'materials' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
            }\`}
          >
            Materiais
          </button>
        </div>

        {activeTab === 'settings' ? (
        <section className="space-y-6">`;

code = code.replace(
  '<section className="space-y-6">',
  tabsUI
);

// Add the materials tab content after the settings section
const materialsContent = `        </section>
        ) : (
        <section className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Beaker className="w-3.5 h-3.5 text-[#00E5FF]" />
              Configurações por Material
            </h3>
            
            <div className="space-y-3">
              <div className="bg-[#111] p-3 rounded-lg border border-zinc-800">
                <h4 className="text-[11px] font-black text-white mb-2">PLA (Recomendado)</h4>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-400 font-mono">
                  <div>Nozzle: <span className="text-[#00E5FF]">210°C - 220°C</span></div>
                  <div>Bed: <span className="text-[#00E5FF]">55°C - 60°C</span></div>
                  <div>Layer Height: <span className="text-[#00E5FF]">0.08mm</span></div>
                  <div>First Layer: <span className="text-[#00E5FF]">0.16mm</span></div>
                  <div>Infill: <span className="text-[#00E5FF]">100% (Solid)</span></div>
                  <div>Cooling: <span className="text-[#00E5FF]">100%</span></div>
                </div>
                <p className="text-[9px] text-zinc-500 mt-2 leading-relaxed">
                  PLA yields the best detail for hueforge/lithophane prints because it is rigid and has minimal shrinkage. High transmission is good for light-colored layers.
                </p>
              </div>

              <div className="bg-[#111] p-3 rounded-lg border border-zinc-800">
                <h4 className="text-[11px] font-black text-white mb-2">PETG</h4>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-400 font-mono">
                  <div>Nozzle: <span className="text-[#00E5FF]">235°C - 245°C</span></div>
                  <div>Bed: <span className="text-[#00E5FF]">70°C - 80°C</span></div>
                  <div>Layer Height: <span className="text-[#00E5FF]">0.08mm</span></div>
                  <div>First Layer: <span className="text-[#00E5FF]">0.16mm</span></div>
                  <div>Infill: <span className="text-[#00E5FF]">100% (Solid)</span></div>
                  <div>Cooling: <span className="text-[#00E5FF]">30% - 50%</span></div>
                </div>
                <p className="text-[9px] text-zinc-500 mt-2 leading-relaxed">
                  PETG is more durable but prone to stringing. Ensure your filament is very dry. Great for prints that will be exposed to sunlight or heat.
                </p>
              </div>

              <div className="bg-[#111] p-3 rounded-lg border border-zinc-800">
                <h4 className="text-[11px] font-black text-white mb-2">TPU</h4>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-400 font-mono">
                  <div>Nozzle: <span className="text-[#00E5FF]">220°C - 230°C</span></div>
                  <div>Bed: <span className="text-[#00E5FF]">40°C - 50°C</span></div>
                  <div>Layer Height: <span className="text-[#00E5FF]">0.12mm</span></div>
                  <div>First Layer: <span className="text-[#00E5FF]">0.20mm</span></div>
                  <div>Infill: <span className="text-[#00E5FF]">100% (Solid)</span></div>
                  <div>Speed: <span className="text-[#00E5FF]">Max 30mm/s</span></div>
                </div>
                <p className="text-[9px] text-zinc-500 mt-2 leading-relaxed">
                  TPU creates flexible hueforges/patches. It requires thicker layers (0.12mm) to prevent clogging. Print very slowly and avoid retractions.
                </p>
              </div>
            </div>
          </div>
        </section>
        )}`;

code = code.replace(
  '          </div>\n\n        </section>\n      </div>\n\n      {/* MAIN VIEWPORT */}',
  '          </div>\n\n' + materialsContent + '\n      </div>\n\n      {/* MAIN VIEWPORT */}'
);

fs.writeFileSync(path, code);
