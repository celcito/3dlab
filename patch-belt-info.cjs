const fs = require('fs');
const path = 'src/pages/BeltGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const [activeTab, setActiveTab] = useState<'settings' | 'materials'>('settings');",
  "const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'materials'>('info');"
);

const newButtons = `<div className="flex bg-[#111] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('info')}
              className={\`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
                activeTab === 'info' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }\`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={\`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
                activeTab === 'settings' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }\`}
            >
              Config
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={\`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all \${
                activeTab === 'materials' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
              }\`}
            >
              Print
            </button>
          </div>`;

const buttonsStart = code.indexOf('<div className="flex bg-[#111] p-1 rounded-lg">');
const buttonsEnd = code.indexOf('</div>', code.indexOf('</button>', code.indexOf('Print Settings'))) + '</div>'.length;

if (buttonsStart !== -1 && buttonsEnd !== -1) {
    code = code.substring(0, buttonsStart) + newButtons + code.substring(buttonsEnd);
}

const infoContent = `{activeTab === 'info' ? (
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
          ) : activeTab === 'settings' ? (`;

const sectionsStart = code.indexOf("{activeTab === 'settings' ? (");
if (sectionsStart !== -1) {
    code = code.substring(0, sectionsStart) + infoContent + code.substring(sectionsStart + "{activeTab === 'settings' ? (".length);
}

fs.writeFileSync(path, code);
