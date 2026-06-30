import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Image, Loader2, CheckCircle, XCircle, Download, Box, ExternalLink,
  LayoutGrid, LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useJobStream } from "@/hooks/useJobStream";
import { useMultiJobStream } from "@/hooks/useMultiJobStream";

const MAX_MULTI = 4;
const MULTI_OPTIONS = [2, 3, 4] as const;

function stepLabel(step: string) {
  const labels: Record<string, string> = {
    starting: "Initializing...",
    loading_model: "Loading model...",
    model_loaded: "Processing...",
    preprocessing_done: "Preprocessing...",
    inference_done: "Generating mesh...",
    converting_formats: "Converting...",
    complete: "Done",
  };
  return labels[step] || step;
}

export default function ImageTo3D() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { progress, connected } = useJobStream(jobId);

  const [multiMode, setMultiMode] = useState(false);
  const [multiCount, setMultiCount] = useState<number>(4);
  const [multiFiles, setMultiFiles] = useState<(File | null)[]>(new Array(4).fill(null));
  const [multiUploading, setMultiUploading] = useState(false);
  const [resolution, setResolution] = useState<256 | 512>(256);
  const { jobs: multiJobs, addJobs, allDone: multiAllDone } = useMultiJobStream();

  const handleGenerate = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mcResolution", String(resolution));
      const res = await fetch("/api/img2-3d/generate", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setJobId(data.jobId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateMulti = async () => {
    const files = multiFiles.filter((f): f is File => f !== null);
    if (files.length < 2) return;
    setError(null);
    setMultiUploading(true);
    const jobIds: string[] = [];
    try {
      for (const f of files.slice(0, multiCount)) {
        if (!f) continue;
        const formData = new FormData();
        formData.append("image", f);
        formData.append("mcResolution", String(resolution));
        const res = await fetch("/api/img2-3d/generate", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        jobIds.push(data.jobId);
      }
      addJobs(jobIds);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMultiUploading(false);
    }
  };

  const handleReset = () => { setFile(null); setJobId(null); setError(null); };
  const handleMultiReset = () => {
    setMultiFiles(new Array(4).fill(null));
    setMultiUploading(false);
    setError(null);
  };

  const setMultiFileAt = (i: number) => (f: File) => {
    const next = [...multiFiles];
    next[i] = f;
    setMultiFiles(next);
  };

  const isProcessing = jobId !== null && progress.status !== "done" && progress.status !== "error";
  const isDone = progress.status === "done";
  const isError = progress.status === "error" || !!error;
  const showProgress = uploading || isProcessing;

  const formatDownloadUrl = (fmt: string) => `/api/img2-3d/${jobId}/result/${fmt}`;
  const multiFormatDownloadUrl = (id: string, fmt: string) => `/api/img2-3d/${id}/result/${fmt}`;

  const multiProcessing = multiUploading || [...multiJobs.values()].some((j) =>
    j.status !== "done" && j.status !== "error" && j.status !== "disconnected"
  );
  const multiHasResults = [...multiJobs.values()].some((j) => j.status === "done");

  const multiJobEntries = [...multiJobs.values()];

  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      <header className="p-6 flex justify-between items-end border-b border-[#222] shrink-0 bg-[#080808]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-bold mb-2">VÉRTICE STUDIO TOOLS / v0.6.0</p>
          <h1 className="text-5xl font-black tracking-tighter leading-none uppercase">Image to 3D</h1>
        </div>
        <div className="text-right flex items-center gap-4">
          <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#222] p-1">
            <button
              onClick={() => { setMultiMode(false); handleReset(); }}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${!multiMode ? "bg-[#00E5FF] text-black" : "text-zinc-500 hover:text-white"}`}
            >
              <LayoutList className="w-3 h-3 inline mr-1" />
              Single
            </button>
            <button
              onClick={() => { setMultiMode(true); handleMultiReset(); }}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${multiMode ? "bg-[#00E5FF] text-black" : "text-zinc-500 hover:text-white"}`}
            >
              <LayoutGrid className="w-3 h-3 inline mr-1" />
              Multi
            </button>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            <div>Engine</div>
            <div className="font-mono text-xs text-[#00E5FF]">TripoSR (local)</div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* LEFT PANE */}
        <div className="bg-[#050505] p-6 overflow-y-auto border-r border-[#222]">
          {!multiMode ? (
            <section>
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">01. Upload Image</h3>
              <div className="mb-4">
                <UploadDropzone file={file} onFile={setFile} disabled={isProcessing} />
              </div>
              <div className="flex gap-3">
                <Button disabled={!file || isProcessing} onClick={handleGenerate}
                  className="flex-1 bg-[#00E5FF] text-black font-black uppercase text-xs py-4 tracking-widest hover:bg-white transition-colors">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : <><Image className="w-4 h-4 mr-2" /> Generate</>}
                </Button>
                {isDone && <Button onClick={handleReset} variant="outline" className="font-black uppercase text-xs tracking-widest">New</Button>}
              </div>
              {error && (
                <div className="mt-4 border border-red-900/40 bg-red-950/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-400">{error}</div>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section>
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">01. Upload Images</h3>
              <p className="text-[10px] text-zinc-500 mb-3">
                Upload 2–4 photos of the same object from different angles for better results.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[9px] uppercase tracking-widest text-zinc-500">Images:</span>
                {MULTI_OPTIONS.map((n) => (
                  <button key={n} onClick={() => { setMultiCount(n); setMultiFiles(new Array(4).fill(null)); }}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest ${multiCount === n ? "bg-[#00E5FF] text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Array.from({ length: multiCount }).map((_, i) => (
                  <div key={i} className="border border-zinc-800 rounded-lg p-3 bg-[#0A0A0A]/50">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">View {i + 1}</p>
                    <UploadDropzone file={multiFiles[i]} onFile={setMultiFileAt(i)} disabled={multiProcessing} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  disabled={multiFiles.filter((f): f is File => f !== null).length < 2 || multiProcessing}
                  onClick={handleGenerateMulti}
                  className="flex-1 bg-[#00E5FF] text-black font-black uppercase text-xs py-4 tracking-widest hover:bg-white transition-colors">
                  {multiUploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><Image className="w-4 h-4 mr-2" /> Generate All</>}
                </Button>
                {multiAllDone && (
                  <Button onClick={handleMultiReset} variant="outline" className="font-black uppercase text-xs tracking-widest">New</Button>
                )}
              </div>
              {error && (
                <div className="mt-4 border border-red-900/40 bg-red-950/20 rounded-lg p-4">
                  <div className="flex items-start gap-2"><XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><div className="text-xs text-red-400">{error}</div></div>
                </div>
              )}
            </section>
          )}

          <section className="mt-6">
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">02. Resolution</h3>
            <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#222] p-1 w-fit mb-4">
              <button
                onClick={() => setResolution(256)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${resolution === 256 ? "bg-[#00E5FF] text-black" : "text-zinc-500 hover:text-white"}`}
              >
                Standard (256)
              </button>
              <button
                onClick={() => setResolution(512)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${resolution === 512 ? "bg-[#00E5FF] text-black" : "text-zinc-500 hover:text-white"}`}
              >
                High (512)
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mb-4">
              {resolution === 512
                ? "512: ~2× mais detalhes, ~4× mais triângulos, ~2× mais lento. Use para peças com detalhes finos."
                : "256: Bom balanço qualidade/velocidade. Ideal para a maioria dos cases."}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">03. Tips</h3>
            <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed">
              <li className="flex items-start gap-2"><span className="text-[#00E5FF] mt-0.5">&#x2022;</span>Use well-lit photos with the object centered on a neutral background</li>
              <li className="flex items-start gap-2"><span className="text-[#00E5FF] mt-0.5">&#x2022;</span>Single objects work best</li>
              <li className="flex items-start gap-2"><span className="text-[#00E5FF] mt-0.5">&#x2022;</span>Generation takes 10–30s on GPU, up to 3 min on CPU</li>
              <li className="flex items-start gap-2"><span className="text-[#00E5FF] mt-0.5">&#x2022;</span>Multi-image mode uploads from different angles for comparison</li>
            </ul>
          </section>
        </div>

        {/* RIGHT PANE */}
        <div className="bg-[#0A0A0A] p-6 flex flex-col overflow-y-auto">
          {!multiMode ? (
            !jobId && !isProcessing && !isDone ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-zinc-600"><Box className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="text-[10px] uppercase tracking-widest">Upload an image and click Generate</p></div>
              </div>
            ) : showProgress && progress.status !== "done" && progress.status !== "error" ? (
              <section className="flex-1">
                <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-6 font-bold">Generating 3D Model</h3>
                <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 text-[#00E5FF] animate-spin" /><span className="text-sm font-mono text-zinc-300">{stepLabel(progress.step) || "Processing..."}</span></div>
                  <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden"><div className="h-full bg-[#00E5FF] rounded-full transition-all duration-500" style={{ width: `${Math.max(progress.progress, 2)}%` }} /></div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">{progress.progress}%</p>
                </div>
              </section>
            ) : isDone ? (
              <section className="flex-1">
                <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">03. Result</h3>
                <div className="bg-[#111] border border-[#00E5FF]/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-[#00FF41]" /><span className="text-xs font-bold text-[#00FF41] uppercase tracking-wider">Complete</span></div>
                  <p className="text-[11px] text-zinc-500">Your 3D model is ready.</p>
                </div>
                <Button onClick={() => navigate(`/viewer?model=${jobId}`)} className="w-full bg-white text-black font-black uppercase text-xs py-3 tracking-widest hover:bg-[#00E5FF] mb-4"><ExternalLink className="w-4 h-4 mr-2" />Open in 3D Viewer</Button>
                <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Download</h4>
                <div className="space-y-2">
                  {(["glb", "obj", "stl"] as const).map((fmt) => (
                    <a key={fmt} href={formatDownloadUrl(fmt)} download={`model.${fmt}`} className="flex items-center justify-between p-2.5 bg-[#151515] border border-zinc-800 hover:border-[#00E5FF]/40 transition-colors group">
                      <span className="text-xs font-mono uppercase">{fmt}</span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 group-hover:text-[#00E5FF]"><Download className="w-3 h-3" /> .{fmt}</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : isError && !showProgress ? (
              <section className="flex-1">
                <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-6 font-bold">Error</h3>
                <div className="bg-[#111] border border-red-900/40 rounded-lg p-6">
                  <div className="flex items-start gap-2 mb-3"><XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-400">Generation Failed</p><p className="text-[11px] text-zinc-500 mt-1">{error || progress.error || "Unknown error"}</p></div></div>
                  <Button onClick={handleReset} variant="outline" className="w-full mt-4 font-black uppercase text-xs tracking-widest">Try Again</Button>
                </div>
              </section>
            ) : null
          ) : !multiAllDone && !multiProcessing ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-zinc-600"><Box className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-[10px] uppercase tracking-widest">Upload 2–4 images and click Generate All</p></div>
            </div>
          ) : (
            <div className="space-y-4">
              {multiProcessing && (
                <section>
                  <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">
                    Generating ({multiJobEntries.filter((j) => j.status === "done").length}/{multiJobEntries.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {multiJobEntries.map((j) => (
                      <div key={j.jobId} className="bg-[#111] border border-[#222] rounded p-3">
                        <span className="font-mono text-[9px] text-zinc-500 block mb-1">{j.jobId.slice(0, 6)}</span>
                        {j.status === "done" ? (
                          <div className="flex items-center gap-1 text-[9px] text-[#00FF41]"><CheckCircle className="w-3 h-3" /> Done</div>
                        ) : j.status === "error" ? (
                          <div className="text-[9px] text-red-400">Error</div>
                        ) : (
                          <div>
                            <div className="w-full bg-[#222] rounded-full h-1 mb-1"><div className="h-full bg-[#00E5FF] rounded-full" style={{ width: `${Math.max(j.progress, 2)}%` }} /></div>
                            <span className="text-[9px] text-zinc-500 font-mono">{stepLabel(j.step)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {multiHasResults && (
                <section>
                  <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 font-bold">Results</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {multiJobEntries.filter((j) => j.status === "done").map((j, i) => (
                      <div key={j.jobId} className="bg-[#111] border border-[#00E5FF]/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-[#00FF41]" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-200">View {i + 1}</span>
                        </div>
                        <Button onClick={() => navigate(`/viewer?model=${j.jobId}`)} className="w-full bg-white text-black font-black uppercase text-[9px] py-2 tracking-widest">
                          <ExternalLink className="w-3 h-3 mr-1" /> Open
                        </Button>
                        <div className="flex gap-1">
                          {(["glb", "obj", "stl"] as const).map((fmt) => (
                            <a key={fmt} href={multiFormatDownloadUrl(j.jobId, fmt)} download={`view${i + 1}.${fmt}`}
                              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-center text-[8px] font-mono uppercase py-1 text-zinc-400 hover:text-white transition-colors">
                              {fmt}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="h-12 border-t border-[#222] px-6 flex items-center justify-between bg-[#0A0A0A] shrink-0">
        <div className="flex gap-6 items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span>Engine: <span className="text-[#00E5FF]">TripoSR</span></span>
          <span>Mode: <span className={multiMode ? "text-[#00E5FF]" : "text-zinc-500"}>{multiMode ? "Multi-View" : "Single"}</span></span>
        </div>
      </footer>
    </div>
  );
}
