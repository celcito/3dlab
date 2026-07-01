import { useState } from "react";
import { Sparkles, History, Loader2, Copy, Bookmark, Save, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  isDefault?: boolean;
}

export default function AiFigures() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const defaultTemplates: PromptTemplate[] = [
    {
      id: "preset-orc",
      name: "Guerreiro Orc / Orc Warrior",
      prompt: "Detailed Miniature of a brutal Orc Barbarian, holding a giant battleaxe, battle-scarred leather armor, standing on a rocky base, fantasy tabletop RPG style, extreme high detail, ready for 3D printing.",
      isDefault: true
    },
    {
      id: "preset-chibi",
      name: "Mago Chibi / Chibi Wizard",
      prompt: "Cute chibi wizard character, wearing an oversized wizard hat and holding a glowing magical staff, friendly face with big eyes, clean smooth surfaces optimized for SLA printing, tabletop miniature.",
      isDefault: true
    },
    {
      id: "preset-cyber",
      name: "Mercenária Cyberpunk / Cyberpunk Merc",
      prompt: "Futuristic cyberpunk mercenary female, high-tech tactical gear, holding dual laser pistols, dynamic action pose, standing on a grated industrial deck base, detailed sci-fi model.",
      isDefault: true
    },
    {
      id: "preset-gothic",
      name: "Vampiro Gótico / Gothic Vampire",
      prompt: "Elegant Gothic Vampire Count in a flowing high-collar cape, ornate Victorian suit, holding an antique chalice, standing on a gothic stone floor base, spooky classic horror style.",
      isDefault: true
    }
  ];

  const [savedTemplates, setSavedTemplates] = useState<PromptTemplate[]>(() => {
    try {
      const stored = localStorage.getItem("vertice_prompt_templates");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newTemplateName, setNewTemplateName] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !newTemplateName.trim()) return;

    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      name: newTemplateName.trim(),
      prompt: prompt.trim()
    };

    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    localStorage.setItem("vertice_prompt_templates", JSON.stringify(updated));
    setNewTemplateName("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem("vertice_prompt_templates", JSON.stringify(updated));
  };

  const handleLoadTemplate = (text: string) => {
    setPrompt(text);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setError("");
    setResult("");
    
    try {
      const response = await fetch("/api/ai-figures/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }
      
      setResult(data.optimizedPrompt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      {/* HEADER AREA */}
      <header className="p-8 flex justify-between items-end border-b border-[#222] shrink-0 bg-[#080808]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-bold mb-2">VÉRTICE STUDIO TOOLS / v0.4.2</p>
          <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">AI Figures</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Status</div>
          <div className="font-mono text-sm text-[#00FF41]">ONLINE</div>
        </div>
      </header>

      {/* EDITOR CORE */}
      <div className="flex-1 bg-[#050505] p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <section>
                <div className="flex gap-8 mb-8 border-b border-[#222] pb-4">
                    <button className="text-[11px] uppercase tracking-widest text-white font-bold border-b-2 border-[#00E5FF] pb-1">Generate Prompt</button>
                    <button className="text-[11px] uppercase tracking-widest text-zinc-600 font-bold hover:text-zinc-400">History</button>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#151515] p-4 border border-zinc-800">
                        <label className="text-[9px] uppercase text-[#00E5FF] block mb-2 font-bold tracking-widest">Target Concept</label>
                        <div className="flex gap-4">
                            <input 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. orc warrior, chibi style"
                                className="flex-1 bg-transparent border-b border-zinc-700 outline-none text-xl font-mono text-white py-2 focus:border-[#00E5FF] transition-colors"
                                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                            />
                            <button 
                                onClick={handleGenerate} 
                                disabled={isGenerating || !prompt}
                                className="bg-white text-black font-black uppercase text-xs px-8 tracking-widest hover:bg-[#00E5FF] transition-colors disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isGenerating ? "Processing..." : "Optimize"}
                            </button>
                        </div>
                    </div>

                    {/* PROMPT TEMPLATES MANAGER */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Preset templates */}
                        <div className="bg-[#111] border border-zinc-900 rounded p-5 space-y-4 font-sans">
                            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                                <Bookmark className="w-4 h-4 text-[#00E5FF]" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Modelos Recomendados / Presets</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {defaultTemplates.map((tpl) => (
                                    <button
                                        key={tpl.id}
                                        onClick={() => handleLoadTemplate(tpl.prompt)}
                                        className="text-left bg-[#151515] hover:bg-[#1C1C1C] border border-zinc-800 hover:border-[#00E5FF] p-3 rounded transition-all group flex flex-col justify-between h-24"
                                    >
                                        <span className="text-[10px] font-bold text-white group-hover:text-[#00E5FF] transition-colors line-clamp-1">
                                            {tpl.name}
                                        </span>
                                        <span className="text-[8px] text-zinc-500 line-clamp-3 mt-1.5 leading-relaxed font-mono">
                                            {tpl.prompt}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom saved templates */}
                        <div className="bg-[#111] border border-zinc-900 rounded p-5 space-y-4 font-sans flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Save className="w-4 h-4 text-[#00E5FF]" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Meus Modelos / Saved Templates</h3>
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-500">{savedTemplates.length} salvos</span>
                                </div>

                                {/* Form to save current */}
                                <form onSubmit={handleSaveTemplate} className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newTemplateName}
                                            onChange={(e) => setNewTemplateName(e.target.value)}
                                            placeholder="Nome do seu modelo / Template name..."
                                            disabled={!prompt.trim()}
                                            className="flex-1 bg-[#151515] border border-zinc-850 focus:border-[#00E5FF] text-xs text-white rounded px-3 py-2 outline-none transition-all disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!prompt.trim() || !newTemplateName.trim()}
                                            className="px-4 py-2 bg-[#00E5FF] text-black text-[10px] font-black uppercase tracking-wider rounded hover:bg-[#00B4CC] disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                                        >
                                            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                            {saveSuccess ? "Salvo" : "Salvar"}
                                        </button>
                                    </div>
                                    {!prompt.trim() && (
                                        <p className="text-[8px] text-zinc-500">Escreva um prompt acima antes de salvá-lo como modelo.</p>
                                    )}
                                </form>

                                {/* List of saved templates */}
                                <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                    {savedTemplates.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-600 text-[10px] uppercase font-bold tracking-widest border border-dashed border-zinc-900 rounded">
                                            Nenhum modelo personalizado salvo
                                        </div>
                                    ) : (
                                        savedTemplates.map((tpl) => (
                                            <div
                                                key={tpl.id}
                                                className="bg-[#151515] border border-zinc-900 rounded p-2.5 flex items-center justify-between gap-3 group hover:border-zinc-850 transition-all"
                                            >
                                                <button
                                                    onClick={() => handleLoadTemplate(tpl.prompt)}
                                                    className="flex-1 text-left"
                                                >
                                                    <div className="text-[10px] font-bold text-zinc-300 group-hover:text-[#00E5FF] transition-colors truncate">
                                                        {tpl.name}
                                                    </div>
                                                    <div className="text-[8px] text-zinc-500 truncate font-mono mt-0.5">
                                                        {tpl.prompt}
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTemplate(tpl.id)}
                                                    className="p-1 text-zinc-600 hover:text-[#FF1744] hover:bg-[#FF1744]/10 rounded transition-all shrink-0"
                                                    title="Excluir modelo / Delete template"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-900 p-4 text-red-500 text-sm font-mono uppercase">
                            ERROR: {error}
                        </div>
                    )}

                    {result && (
                        <div className="bg-[#0A0A0A] border border-[#00E5FF] p-6 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-[10px] font-bold text-[#00E5FF] uppercase tracking-widest">Optimized 3D Generation Prompt</h3>
                                <button onClick={() => navigator.clipboard.writeText(result)} className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-700 px-3 py-1">
                                    <Copy className="w-3 h-3" /> Copy Output
                                </button>
                            </div>
                            <div className="font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                                {result}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
      </div>
      
      {/* FOOTER BAR */}
      <footer className="h-12 border-t border-[#222] px-8 flex items-center justify-between bg-[#0A0A0A] shrink-0">
        <div className="flex gap-6 items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span>Engine: <span className="text-[#00E5FF]">Gemini Flash</span></span>
          <span>Tokens: Optimized</span>
        </div>
      </footer>
    </div>
  );
}
