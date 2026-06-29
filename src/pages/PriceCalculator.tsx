import { useState } from "react";
import { Printer, Droplet, ExternalLink, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Source {
  name: string;
  printerType: "fdm" | "resin" | "both";
  type: "free" | "subscription";
  cost: string;
  desc: string;
  tags: string[];
  url: string;
  recommended: boolean;
}

const SOURCES: Source[] = [
  {
    name: "Cults3D.com", printerType: "both", type: "free",
    cost: "Gratuito + Pago",
    desc: "Grande marketplace com tag 'Commercial use' por modelo. Funciona bem para FDM e resina.",
    tags: ["Personagens", "Acessórios", "FDM", "Resina"],
    url: "https://cults3d.com", recommended: false,
  },
  {
    name: "CGTrader.com", printerType: "both", type: "subscription",
    cost: "Por arquivo",
    desc: "Seção dedicada a impressão 3D com licença comercial explícita. Personagens originais e mascotes para FDM e resina.",
    tags: ["Personagens originais", "Mascotes", "FDM", "Resina"],
    url: "https://www.cgtrader.com", recommended: false,
  },
  {
    name: "Patreon (criadores 3D)", printerType: "both", type: "subscription",
    cost: "~US$ 5–20/mês",
    desc: "Artistas vendem licença comercial nos tiers mais altos. Tem criadores focados em FDM e outros em resina.",
    tags: ["Articulados FDM", "Miniaturas resina", "Originais"],
    url: "https://www.patreon.com", recommended: false,
  },
  {
    name: "Printables.com", printerType: "fdm", type: "free",
    cost: "Gratuito",
    desc: "Da Prusa. Filtre por 'Commercial use allowed'. Ótimo para articulados, decoração e RPG em FDM.",
    tags: ["Articulados", "Decoração", "RPG"],
    url: "https://www.printables.com", recommended: false,
  },
  {
    name: "MyMiniFactory.com", printerType: "fdm", type: "free",
    cost: "Gratuito + Pago",
    desc: "Boa seleção de modelos maiores para FDM. Licenças documentadas por modelo.",
    tags: ["Miniaturas grandes", "Sci-fi", "Fantasy"],
    url: "https://www.myminifactory.com", recommended: false,
  },
  {
    name: "Tribes (MyMiniFactory)", printerType: "fdm", type: "subscription",
    cost: "~US$ 8–15/mês por criador",
    desc: "Assine criadores independentes. Dezenas de modelos novos/mês com licença comercial. Melhor custo-benefício para FDM.",
    tags: ["Alto volume", "Alta qualidade"],
    url: "https://www.myminifactory.com/tribes", recommended: true,
  },
  {
    name: "DriveThruRPG / 3D Studio", printerType: "fdm", type: "subscription",
    cost: "~US$ 5–15/arquivo",
    desc: "Focado em miniaturas para D&D e jogos de tabuleiro. Licença comercial disponível em muitos kits.",
    tags: ["D&D", "Tabuleiro"],
    url: "https://www.drivethrurpg.com", recommended: false,
  },
  {
    name: "Loot Studios", printerType: "resin", type: "subscription",
    cost: "~US$ 14/mês",
    desc: "Assinatura mensal com pacotes completos de miniaturas para resina, licença comercial inclusa.",
    tags: ["RPG", "Colecionáveis", "Alta qualidade"],
    url: "https://lootstudios.com", recommended: true,
  },
  {
    name: "Titan Forge Miniatures", printerType: "resin", type: "subscription",
    cost: "~US$ 9–15/mês",
    desc: "Miniaturas detalhadas para resina com licença de impressão comercial.",
    tags: ["Miniaturas", "Fantasy", "Sci-fi"],
    url: "https://www.patreon.com/titanforgeminiatures", recommended: false,
  },
  {
    name: "EC3D Designs", printerType: "resin", type: "subscription",
    cost: "~US$ 10/mês",
    desc: "Cenários, terrenos e miniaturas para resina. Ótimo para montar kits de RPG para venda.",
    tags: ["Cenários", "Terrenos", "RPG"],
    url: "https://www.patreon.com/ec3d", recommended: false,
  },
  {
    name: "Epics 'N' Quests", printerType: "resin", type: "subscription",
    cost: "~US$ 12/mês",
    desc: "Personagens e miniaturas de alta resolução para resina SLA/MSLA com licença comercial.",
    tags: ["Personagens", "Alta resolução", "SLA/MSLA"],
    url: "https://www.patreon.com/epicsnquests", recommended: false,
  },
];

const fmt = (v: number): string => "R$ " + Math.max(0, v).toFixed(2).replace(".", ",");

function SliderRow({
  label, min, max, value, step = 1, onChange, suffix = "", hint,
}: {
  label: string; min: number; max: number; value: number;
  step?: number; onChange: (v: number) => void; suffix?: string; hint?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <Label className="text-[11px] text-zinc-500">{label}</Label>
        <span className="text-[11px] font-semibold text-zinc-300 font-mono">
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#00E5FF] h-1"
      />
      <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
        <span>{min}{suffix}</span>
        {hint && <span className="text-zinc-500">{hint}</span>}
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

function NumInput({
  label, value, onChange, step = 1, prefix = "", half,
}: {
  label: string; value: number; onChange: (v: number) => void;
  step?: number; prefix?: string; half?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${half ? "" : ""}`}>
      <Label className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</Label>
      <div className="flex items-center bg-[#111] border border-[#222] rounded-md overflow-hidden focus-within:border-[#00E5FF]/50 transition-colors">
        {prefix && (
          <span className="pl-2.5 pr-1 text-zinc-500 text-xs font-mono">{prefix}</span>
        )}
        <Input
          type="number"
          value={value}
          step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="border-0 bg-transparent h-8 font-mono text-sm text-white [appearance:textfield] [&::-webkit-outer-spin-button]:opacity-30 [&::-webkit-inner-spin-button]:opacity-30"
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`bg-[#111] border rounded-lg p-3 text-center ${accent ? "border-[#00E5FF]/40" : "border-[#222]"}`}>
      <div className="text-[9px] uppercase tracking-[0.1em] text-zinc-500 mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${accent ? "text-[#00E5FF]" : "text-white"}`}>{value}</div>
    </div>
  );
}

function BreakdownBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 2;
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-[11px] text-zinc-500 min-w-[150px]">{label}</span>
      <div className="flex-1 bg-[#222] rounded h-1">
        <div className="rounded h-1 transition-[width] duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] text-zinc-300 min-w-[64px] text-right font-mono">{fmt(value)}</span>
    </div>
  );
}

function SourceCard({ source, accentColor }: { source: Source; accentColor: string }) {
  return (
    <div className={`bg-[#111] rounded-lg p-4 relative ${source.recommended ? "border" : "border border-[#222]"}`}
      style={source.recommended ? { borderColor: accentColor } : undefined}>
      {source.recommended && (
        <div className="absolute -top-2.5 left-4 text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider"
          style={{ backgroundColor: accentColor, color: "#080808" }}>
          RECOMENDADO
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm text-white">{source.name}</span>
        <span className={`text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap ml-2 font-mono ${
          source.type === "free" ? "bg-emerald-950/50 text-emerald-400" : "bg-amber-950/50 text-amber-400"
        }`}>
          {source.cost}
        </span>
      </div>
      <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{source.desc}</p>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {source.tags.map(t => (
          <span key={t} className="bg-[#1a1a1a] text-zinc-500 text-[9px] px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
      <a href={source.url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] font-medium hover:opacity-75 transition-opacity"
        style={{ color: accentColor }}>
        Acessar site <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

function FdmCalc({ meta, setMeta }: { meta: number; setMeta: (v: number) => void }) {
  const [gramas, setGramas] = useState(80);
  const [precoRolo, setPrecoRolo] = useState(110);
  const [horas, setHoras] = useState(4);
  const [energia, setEnergia] = useState(0.8);
  const [acabamento, setAcabamento] = useState(8);
  const [embalagem, setEmbalagem] = useState(6);
  const [dep, setDep] = useState(1.2);
  const [taxa, setTaxa] = useState(12);
  const [margem, setMargem] = useState(200);

  const cFilamento = (gramas / 1000) * precoRolo;
  const cEnergia = horas * energia;
  const cDep = horas * dep;
  const cTotal = cFilamento + cEnergia + acabamento + embalagem + cDep;
  const precoBase = cTotal * (1 + margem / 100);
  const taxaVal = precoBase * (taxa / 100);
  const precoFinal = precoBase + taxaVal;
  const lucro = precoFinal - cTotal - taxaVal;
  const margemReal = cTotal > 0 ? Math.round((lucro / cTotal) * 100) : 0;
  const qtd = lucro > 0 ? Math.ceil(meta / lucro) : null;

  const breakdown: [string, number][] = [
    ["Filamento", cFilamento],
    ["Energia", cEnergia],
    ["Acabamento/pintura", acabamento],
    ["Embalagem + frete", embalagem],
    ["Depreciação impressora", cDep],
    ["Taxa marketplace", taxaVal],
  ];
  const totalBreakdown = breakdown.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <NumInput label="Filamento usado (g)" value={gramas} onChange={setGramas} />
        <NumInput label="Custo do rolo (R$/kg)" value={precoRolo} onChange={setPrecoRolo} prefix="R$" />
        <NumInput label="Tempo de impressão (h)" value={horas} onChange={setHoras} step={0.5} />
        <NumInput label="Custo energia (R$/h)" value={energia} onChange={setEnergia} step={0.1} prefix="R$" />
        <NumInput label="Acabamento / pintura (R$)" value={acabamento} onChange={setAcabamento} prefix="R$" />
        <NumInput label="Embalagem + frete (R$)" value={embalagem} onChange={setEmbalagem} prefix="R$" />
        <NumInput label="Depreciação impressora (R$/h)" value={dep} onChange={setDep} step={0.1} prefix="R$" />
        <NumInput label="Taxa marketplace (%)" value={taxa} onChange={setTaxa} prefix="%" />
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-5 mb-6">
        <SliderRow label="Margem de lucro desejada" min={50} max={500} value={margem} step={10} onChange={setMargem} suffix="%" hint="Recomendado: 150–250%" />
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <MetricCard label="Custo total" value={fmt(cTotal)} />
        <MetricCard label="Preço sugerido" value={fmt(precoFinal)} accent />
        <MetricCard label="Lucro líquido" value={fmt(lucro)} />
        <MetricCard label="Margem real" value={`${margemReal}%`} />
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-5 mb-6">
        <div className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 mb-4 font-bold">Divisão dos Custos</div>
        {breakdown.map(([label, value]) => (
          <BreakdownBar key={label} label={label} value={value} total={totalBreakdown} color="#00E5FF" />
        ))}
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-5">
        <div className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 mb-3 font-bold">Meta Mensal</div>
        <NumInput label="Renda desejada por mês (R$)" value={meta} onChange={setMeta} prefix="R$" />
        {qtd !== null ? (
          <div className="mt-3.5 text-sm">
            Você precisa vender <span className="text-2xl font-bold text-[#00E5FF] font-mono">{qtd}</span> peças/mês.
          </div>
        ) : (
          <div className="mt-3.5 text-xs text-zinc-500">Ajuste a margem para calcular.</div>
        )}
      </div>
    </div>
  );
}

function ResinCalc({ meta, setMeta }: { meta: number; setMeta: (v: number) => void }) {
  const resinAccent = "#A855F7";
  const [ml, setMl] = useState(50);
  const [precoResina, setPrecoResina] = useState(180);
  const [horas, setHoras] = useState(3);
  const [energia, setEnergia] = useState(0.5);
  const [lavagem, setLavagem] = useState(4);
  const [fep, setFep] = useState(3);
  const [acabamento, setAcabamento] = useState(12);
  const [embalagem, setEmbalagem] = useState(6);
  const [dep, setDep] = useState(1.5);
  const [taxa, setTaxa] = useState(12);
  const [margem, setMargem] = useState(250);

  const cResina = (ml / 1000) * precoResina;
  const cEnergia = horas * energia;
  const cDep = horas * dep;
  const cTotal = cResina + cEnergia + lavagem + fep + acabamento + embalagem + cDep;
  const precoBase = cTotal * (1 + margem / 100);
  const taxaVal = precoBase * (taxa / 100);
  const precoFinal = precoBase + taxaVal;
  const lucro = precoFinal - cTotal - taxaVal;
  const margemReal = cTotal > 0 ? Math.round((lucro / cTotal) * 100) : 0;
  const qtd = lucro > 0 ? Math.ceil(meta / lucro) : null;

  const breakdown: [string, number][] = [
    ["Resina", cResina],
    ["Energia (UV + curador)", cEnergia],
    ["Lavagem (IPA/álcool)", lavagem],
    ["Depreciação FEP", fep],
    ["Acabamento/pintura", acabamento],
    ["Embalagem + frete", embalagem],
    ["Depreciação impressora", cDep],
    ["Taxa marketplace", taxaVal],
  ];
  const totalBreakdown = breakdown.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <div className="border rounded-md p-3 mb-5 text-xs leading-relaxed"
        style={{ backgroundColor: `${resinAccent}0D`, borderColor: `${resinAccent}33`, color: resinAccent }}>
        Resina tem custo de material maior que FDM, mas permite detalhamento muito superior — miniaturas de RPG, colecionáveis e figuras com partes finas vendem por preços maiores. Use margem de 200–350%.
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <NumInput label="Resina usada (ml)" value={ml} onChange={setMl} />
        <NumInput label="Custo da resina (R$/litro)" value={precoResina} onChange={setPrecoResina} prefix="R$" />
        <NumInput label="Tempo de impressão (h)" value={horas} onChange={setHoras} step={0.5} />
        <NumInput label="Energia UV + curador (R$/h)" value={energia} onChange={setEnergia} step={0.1} prefix="R$" />
        <NumInput label="Lavagem IPA/álcool (R$)" value={lavagem} onChange={setLavagem} step={0.5} prefix="R$" />
        <NumInput label="Depreciação FEP (R$/peça)" value={fep} onChange={setFep} step={0.5} prefix="R$" />
        <NumInput label="Acabamento / pintura (R$)" value={acabamento} onChange={setAcabamento} prefix="R$" />
        <NumInput label="Embalagem + frete (R$)" value={embalagem} onChange={setEmbalagem} prefix="R$" />
        <NumInput label="Depreciação impressora (R$/h)" value={dep} onChange={setDep} step={0.1} prefix="R$" />
        <NumInput label="Taxa marketplace (%)" value={taxa} onChange={setTaxa} prefix="%" />
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-5 mb-6">
        <SliderRow label="Margem de lucro desejada" min={50} max={500} value={margem} step={10} onChange={setMargem} suffix="%" hint="Recomendado: 200–350%" />
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <MetricCard label="Custo total" value={fmt(cTotal)} />
        <MetricCard label="Preço sugerido" value={fmt(precoFinal)} accent />
        <MetricCard label="Lucro líquido" value={fmt(lucro)} />
        <MetricCard label="Margem real" value={`${margemReal}%`} />
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-5 mb-6">
        <div className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 mb-4 font-bold">Divisão dos Custos</div>
        {breakdown.map(([label, value]) => (
          <BreakdownBar key={label} label={label} value={value} total={totalBreakdown} color={resinAccent} />
        ))}
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-5">
        <div className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 mb-3 font-bold">Meta Mensal</div>
        <NumInput label="Renda desejada por mês (R$)" value={meta} onChange={setMeta} prefix="R$" />
        {qtd !== null ? (
          <div className="mt-3.5 text-sm">
            Você precisa vender <span className="text-2xl font-bold font-mono" style={{ color: resinAccent }}>{qtd}</span> peças/mês.
          </div>
        ) : (
          <div className="mt-3.5 text-xs text-zinc-500">Ajuste a margem para calcular.</div>
        )}
      </div>
    </div>
  );
}

function SourcesTab() {
  const [printerFilter, setPrinterFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = SOURCES.filter(s => {
    const matchPrinter = printerFilter === "all" || s.printerType === printerFilter || s.printerType === "both";
    const matchType = typeFilter === "all" || s.type === typeFilter;
    return matchPrinter && matchType;
  });

  const pillClass = (active: boolean, color: string) =>
    `px-4 py-1.5 rounded-full border text-[11px] font-semibold cursor-pointer transition-all ${
      active
        ? `border-transparent text-black`
        : "border-[#222] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
    }`;

  return (
    <div>
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">Tipo de Impressora</div>
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            ["all", "Todas", "#00E5FF"],
            ["fdm", "FDM", "#00E5FF"],
            ["resin", "Resina", "#A855F7"],
            ["both", "Ambas", "#00E5FF"],
          ].map(([val, label, color]) => (
            <button
              key={val}
              onClick={() => setPrinterFilter(val)}
              className={pillClass(printerFilter === val, color)}
              style={printerFilter === val ? { backgroundColor: color } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">Custo</div>
        <div className="flex gap-2 flex-wrap">
          {[
            ["all", "Todos"],
            ["free", "Gratuito"],
            ["subscription", "Assinatura/Pago"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              className={pillClass(typeFilter === val, "#00E5FF")}
              style={typeFilter === val ? { backgroundColor: "#00E5FF" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {filtered.length === 0 ? (
          <div className="text-zinc-500 text-xs py-8 text-center">Nenhuma fonte encontrada com esses filtros.</div>
        ) : (
          filtered.map((s, i) => (
            <SourceCard
              key={`${s.name}-${s.printerType}-${i}`}
              source={s}
              accentColor={s.printerType === "resin" ? "#A855F7" : "#00E5FF"}
            />
          ))
        )}
      </div>

      <div className="border border-amber-900/30 bg-amber-950/10 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-400 mb-1">Sempre confirme antes de vender</div>
            <div className="text-[11px] text-zinc-400 leading-relaxed">
              Mesmo em plataformas seguras, verifique a licença de cada arquivo individualmente.
              Procure os termos <em>"commercial use"</em>, <em>"for sale"</em> ou <em>"selling prints allowed"</em>.
              Em dúvida, contate o criador diretamente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PriceCalculator() {
  const [tab, setTab] = useState("fdm");
  const [meta, setMeta] = useState(2000);

  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      <header className="p-8 flex justify-between items-end border-b border-[#222] shrink-0 bg-[#080808]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-bold mb-2">VÉRTICE STUDIO TOOLS / v0.4.2</p>
          <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">Price Calculator</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Meta</div>
          <div className="font-mono text-sm">{fmt(meta)} / mês</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#050505] p-8">
        <div className="max-w-[760px] mx-auto">
          <Tabs value={tab} onValueChange={setTab} className="gap-6">
            <TabsList>
              <TabsTrigger value="fdm">
                <Printer className="w-3.5 h-3.5" />
                FDM
              </TabsTrigger>
              <TabsTrigger value="resin">
                <Droplet className="w-3.5 h-3.5" />
                Resina
              </TabsTrigger>
              <TabsTrigger value="sources">Fontes de Modelos</TabsTrigger>
            </TabsList>

            <TabsContent value="fdm">
              <FdmCalc meta={meta} setMeta={setMeta} />
            </TabsContent>
            <TabsContent value="resin">
              <ResinCalc meta={meta} setMeta={setMeta} />
            </TabsContent>
            <TabsContent value="sources">
              <SourcesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="h-12 border-t border-[#222] px-8 flex items-center justify-between bg-[#0A0A0A] shrink-0">
        <div className="flex gap-6 items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span>Engine: <span className="text-[#00E5FF]">Cost-Based Pricing</span></span>
          <span>Sources: {SOURCES.length} Marketplaces</span>
        </div>
      </footer>
    </div>
  );
}
