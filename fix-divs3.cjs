const fs = require('fs');
const path = 'src/pages/VaseGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<section className="space-y-6">[\s\S]*?<div className="space-y-4 pt-4 border-t border-zinc-900">/;

const newContent = `<section className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Maximize className="w-3.5 h-3.5 text-[#00E5FF]" />
              01. Proporções (mm)
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Altura Total</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.height}mm</span>
              </div>
              <input 
                type="range" min="20" max="250" step="1" 
                value={config.height} 
                onChange={(e) => setConfig({...config, height: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Base R</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.baseRadius}mm</span>
              </div>
              <input 
                type="range" min="5" max="150" step="1" 
                value={config.baseRadius}
                onChange={(e) => setConfig({...config, baseRadius: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Meio R</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.midRadius}mm</span>
              </div>
              <input 
                type="range" min="5" max="150" step="1" 
                value={config.midRadius}
                onChange={(e) => setConfig({...config, midRadius: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Topo R</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.topRadius}mm</span>
              </div>
              <input 
                type="range" min="5" max="150" step="1" 
                value={config.topRadius}
                onChange={(e) => setConfig({...config, topRadius: parseInt(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900">`;

code = code.replace(regex, newContent);
fs.writeFileSync(path, code);
