const fs = require('fs');
const path = 'src/pages/PulleyGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

// Update PulleyConfig
code = code.replace(
  'set_screw_count: number;\n}',
  `set_screw_count: number;
  set_screw_angle: number;
  set_screw_offset: number;
  keyway_w_override: number;
  keyway_h_override: number;
}`
);

// Update initial state
code = code.replace(
  'set_screw_count: 1,\n  });',
  `set_screw_count: 1,
    set_screw_angle: 0,
    set_screw_offset: 0,
    keyway_w_override: 0,
    keyway_h_override: 0,
  });`
);

// Update generateScad
code = code.replace(
  'hole_d = ${config.hole_d};',
  `hole_d = \${config.hole_d};
keyway_w = \${config.keyway_w_override > 0 ? config.keyway_w_override : config.hole_d * 0.25};
keyway_h = \${config.keyway_h_override > 0 ? config.keyway_h_override : config.hole_d * 0.25};`
);

code = code.replace(
  'set_screw_count = ${config.set_screw_count};',
  `set_screw_count = \${config.set_screw_count};
set_screw_angle = \${config.set_screw_angle};
set_screw_offset = \${config.set_screw_offset};`
);

code = code.replace(
  'translate([0, d/2, 0]) cube([d*0.25, d*0.25, thickness*3], center=true);',
  'translate([0, d/2, 0]) cube([keyway_w, keyway_h, thickness*3], center=true);'
);

code = code.replace(
  'translate([0, 0, base_thickness + hub_l/2])',
  'translate([0, 0, base_thickness + (hub_l/2) + set_screw_offset]) rotate([0, 0, set_screw_angle])'
);

// Update createPulleyGeometry
code = code.replace(
  'const kw = d * 0.25;\n      const kh = d * 0.25;',
  `const kw = config.keyway_w_override > 0 ? config.keyway_w_override : d * 0.25;
      const kh = config.keyway_h_override > 0 ? config.keyway_h_override : d * 0.25;`
);

// Add UI elements
const keywayUI = `
              {config.bore_type === 'keyway' && (
                <div className="space-y-3 pt-2 pl-4 border-l-2 border-zinc-800">
                  <div className="flex justify-between">
                    <label className="text-[9px] uppercase font-bold text-zinc-600">Largura Chaveta (0 = Auto)</label>
                    <span className="text-[10px] font-mono text-[#00E5FF]">{config.keyway_w_override}mm</span>
                  </div>
                  <input type="range" min="0" max="10" step="0.5" value={config.keyway_w_override} onChange={(e) => setConfig({...config, keyway_w_override: parseFloat(e.target.value)})} className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  
                  <div className="flex justify-between mt-3">
                    <label className="text-[9px] uppercase font-bold text-zinc-600">Alt. Chaveta (0 = Auto)</label>
                    <span className="text-[10px] font-mono text-[#00E5FF]">{config.keyway_h_override}mm</span>
                  </div>
                  <input type="range" min="0" max="10" step="0.5" value={config.keyway_h_override} onChange={(e) => setConfig({...config, keyway_h_override: parseFloat(e.target.value)})} className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                </div>
              )}
`;

code = code.replace(
  '</select>\n              </div>\n            )}',
  `</select>\n              </div>\n            )}\n${keywayUI}`
);

const screwUI = `
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-[9px] uppercase font-bold text-zinc-600">Ângulo Parafusos</label>
                      <span className="text-[10px] font-mono text-[#00E5FF]">{config.set_screw_angle}°</span>
                    </div>
                    <input type="range" min="0" max="360" step="15" value={config.set_screw_angle} onChange={(e) => setConfig({...config, set_screw_angle: parseInt(e.target.value)})} className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-[9px] uppercase font-bold text-zinc-600">Offset (Z)</label>
                      <span className="text-[10px] font-mono text-[#00E5FF]">{config.set_screw_offset}mm</span>
                    </div>
                    <input type="range" min="-20" max="20" step="1" value={config.set_screw_offset} onChange={(e) => setConfig({...config, set_screw_offset: parseInt(e.target.value)})} className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
`;

code = code.replace(
  '<input type="range" min="1" max="10" step="0.5" value={config.set_screw_d} onChange={(e) => setConfig({...config, set_screw_d: parseFloat(e.target.value)})} className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />\n                  </div>\n                </div>',
  `<input type="range" min="1" max="10" step="0.5" value={config.set_screw_d} onChange={(e) => setConfig({...config, set_screw_d: parseFloat(e.target.value)})} className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />\n                  </div>\n${screwUI}\n                </div>`
);

fs.writeFileSync(path, code);
