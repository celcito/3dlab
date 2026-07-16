const fs = require('fs');
const path = 'src/pages/FilamentPainter.tsx';
let code = fs.readFileSync(path, 'utf8');

const materialsContent = `        </section>
        ) : (
        <section className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Beaker className="w-3.5 h-3.5 text-[#00E5FF]" />
              Configurações por Material
            </h3>
            
            <div className="space-y-3">
              <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full" />
                <h4 className="text-[12px] font-black text-white mb-3">PLA (Recomendado)</h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-zinc-400 font-mono mb-3">
                  <div>Nozzle: <span className="text-[#00E5FF]">210-220°C</span></div>
                  <div>Bed: <span className="text-[#00E5FF]">55-60°C</span></div>
                  <div>Layer: <span className="text-[#00E5FF]">0.08mm</span></div>
                  <div>1st Layer: <span className="text-[#00E5FF]">0.16mm</span></div>
                  <div>Infill: <span className="text-[#00E5FF]">100%</span></div>
                  <div>Cooling: <span className="text-[#00E5FF]">100%</span></div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800/50 pt-2">
                  Ideal para detalhes finos e rigidez. O filamento com melhor transmissão para camadas claras em Hueforge.
                </p>
              </div>

              <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 blur-2xl rounded-full" />
                <h4 className="text-[12px] font-black text-white mb-3">PETG</h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-zinc-400 font-mono mb-3">
                  <div>Nozzle: <span className="text-[#00E5FF]">235-245°C</span></div>
                  <div>Bed: <span className="text-[#00E5FF]">70-80°C</span></div>
                  <div>Layer: <span className="text-[#00E5FF]">0.08mm</span></div>
                  <div>1st Layer: <span className="text-[#00E5FF]">0.16mm</span></div>
                  <div>Infill: <span className="text-[#00E5FF]">100%</span></div>
                  <div>Cooling: <span className="text-[#00E5FF]">30-50%</span></div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800/50 pt-2">
                  Mais durável e resistente ao calor. Garanta que o filamento esteja seco para evitar stringing.
                </p>
              </div>

              <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-2xl rounded-full" />
                <h4 className="text-[12px] font-black text-white mb-3">TPU</h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-zinc-400 font-mono mb-3">
                  <div>Nozzle: <span className="text-[#00E5FF]">220-230°C</span></div>
                  <div>Bed: <span className="text-[#00E5FF]">40-50°C</span></div>
                  <div>Layer: <span className="text-[#00E5FF]">0.12mm</span></div>
                  <div>1st Layer: <span className="text-[#00E5FF]">0.20mm</span></div>
                  <div>Infill: <span className="text-[#00E5FF]">100%</span></div>
                  <div>Speed: <span className="text-[#00E5FF]">Max 30mm/s</span></div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-800/50 pt-2">
                  Perfeito para patches flexíveis. Requer camadas mais grossas (0.12) e velocidade reduzida.
                </p>
              </div>
            </div>
          </div>
        </section>
        )}`;

// replace the FIRST `        </section>\n      </div>\n      {/* MAIN VIEWPORT */}` but flexibly.
const marker = 'Download OBJ\n            </button>\n          </div>\n        </section>\n      </div>';
const index = code.indexOf('Download OBJ');
if (index !== -1) {
    const sectionEndIndex = code.indexOf('</section>', index);
    if (sectionEndIndex !== -1) {
        code = code.substring(0, sectionEndIndex) + materialsContent + code.substring(sectionEndIndex + '</section>'.length);
    }
}

fs.writeFileSync(path, code);
