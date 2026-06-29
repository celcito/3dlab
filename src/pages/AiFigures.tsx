import { useState } from "react";
import { Sparkles, History, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function AiFigures() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

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
