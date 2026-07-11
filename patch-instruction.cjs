const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '              02. Grid de Gavetas\n            </h3>\n            \n            <div className="space-y-3">',
  `              02. Grid de Gavetas
            </h3>
            
            <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded p-2 flex items-start gap-2">
              <MousePointer2 className="w-3 h-3 text-[#00E5FF] mt-0.5" />
              <p className="text-[9px] text-[#00E5FF] uppercase font-bold leading-tight">Dica: Você pode arrastar as divisórias diretamente no preview 3D para reposicioná-las.</p>
            </div>
            
            <div className="space-y-3">`
);

fs.writeFileSync(path, code);
