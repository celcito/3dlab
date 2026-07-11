const fs = require('fs');
const path = 'src/pages/VaseGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `<div className="space-y-4">
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
            </div>`;

code = code.replace(
  /<div className="grid grid-cols-3 gap-2">[\s\S]*?<\/div>\n            <\/div>/,
  replacement + '\n          </div>'
);

fs.writeFileSync(path, code);
