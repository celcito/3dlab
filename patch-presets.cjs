const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

const PRESETS_CODE = `const PRESETS = [
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
`;

if (!code.includes('PRESETS')) {
  code = code.replace(
    'export default function BinGenerator() {',
    PRESETS_CODE + '\nexport default function BinGenerator() {'
  );
}

const UI_CODE = `          <div className="space-y-3 pb-4 border-b border-zinc-900">
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
          
          <div className="space-y-4">`;

code = code.replace(
  '        <section className="space-y-6">\n          <div className="space-y-4">',
  '        <section className="space-y-6">\n' + UI_CODE
);

fs.writeFileSync(path, code);
