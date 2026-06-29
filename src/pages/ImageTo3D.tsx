import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image, Loader2, CheckCircle, XCircle, Download, Box, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useJobStream } from "@/hooks/useJobStream";

export default function ImageTo3D() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { progress, connected } = useJobStream(jobId);

  const stepLabel = (step: string) => {
    const labels: Record<string, string> = {
      starting: "Initializing model...",
      loading_model: "Loading TripoSR checkpoint...",
      model_loaded: "Model ready, processing image...",
      preprocessing_done: "Preprocessing complete, running inference...",
      inference_done: "Generating mesh...",
      converting_formats: "Converting to OBJ/STL...",
      complete: "Done",
    };
    return labels[step] || step;
  };

  const handleGenerate = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/img2-3d/generate", {
        method: "POST",
        body: formData,
      });

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

  const handleReset = () => {
    setFile(null);
    setJobId(null);
    setError(null);
  };

  const isProcessing = jobId !== null && progress.status !== "done" && progress.status !== "error";
  const isDone = progress.status === "done";
  const isError = progress.status === "error" || !!error;
  const showProgress = uploading || isProcessing;

  const formatDownloadUrl = (fmt: string) => `/api/img2-3d/${jobId}/result/${fmt}`;

  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      <header className="p-8 flex justify-between items-end border-b border-[#222] shrink-0 bg-[#080808]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-bold mb-2">VÉRTICE STUDIO TOOLS / v0.4.2</p>
          <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">Image to 3D</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Engine</div>
          <div className="font-mono text-xs text-[#00E5FF]">TripoSR (local)</div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* LEFT PANE - Upload & Controls */}
        <div className="bg-[#050505] p-8 overflow-y-auto border-r border-[#222]">
          <section>
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-6 font-bold">01. Upload Image</h3>

            <div className="mb-6">
              <UploadDropzone file={file} onFile={setFile} disabled={isProcessing} />
            </div>

            <div className="flex gap-3">
              <Button
                disabled={!file || isProcessing}
                onClick={handleGenerate}
                className="flex-1 bg-[#00E5FF] text-black font-black uppercase text-xs py-4 tracking-widest hover:bg-white transition-colors"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</>
                ) : (
                  <><Image className="w-4 h-4 mr-2" /> Generate 3D Model</>
                )}
              </Button>
              {isDone && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="font-black uppercase text-xs tracking-widest"
                >
                  New
                </Button>
              )}
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

          <section className="mt-8">
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">02. Tips</h3>
            <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF] mt-0.5">&#x2022;</span>
                Use well-lit photos with the object centered on a neutral background
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF] mt-0.5">&#x2022;</span>
                Single objects work best (not complex scenes with multiple items)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF] mt-0.5">&#x2022;</span>
                Generation takes 10–30 seconds on GPU, up to 3 minutes on CPU
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF] mt-0.5">&#x2022;</span>
                Output includes GLB, OBJ, and STL formats for maximum compatibility
              </li>
            </ul>
          </section>
        </div>

        {/* RIGHT PANE - Progress & Results */}
        <div className="bg-[#0A0A0A] p-8 flex flex-col overflow-y-auto">
          {!jobId && !isProcessing && !isDone && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-zinc-600">
                <Box className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-[10px] uppercase tracking-widest">Upload an image and click Generate</p>
              </div>
            </div>
          )}

          {/* Progress */}
          {showProgress && progress.status !== "done" && progress.status !== "error" && (
            <section className="flex-1">
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-6 font-bold">Generating 3D Model</h3>
              <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#00E5FF] animate-spin" />
                  <span className="text-sm font-mono text-zinc-300">
                    {stepLabel(progress.step) || "Processing..."}
                  </span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#00E5FF] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(progress.progress, 2)}%` }}
                  />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">{progress.progress}%</p>
              </div>
            </section>
          )}

          {/* Results */}
          {isDone && (
            <section className="flex-1">
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-6 font-bold">03. Result</h3>

              <div className="bg-[#111] border border-[#00E5FF]/30 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-[#00FF41]" />
                  <span className="text-xs font-bold text-[#00FF41] uppercase tracking-wider">Generation Complete</span>
                </div>
                <p className="text-[11px] text-zinc-500">Your 3D model is ready. Open it in the full 3D Viewer or download in your preferred format.</p>
              </div>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => navigate(`/viewer?model=${jobId}`)}
                  className="w-full bg-white text-black font-black uppercase text-xs py-4 tracking-widest hover:bg-[#00E5FF] transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in 3D Viewer
                </Button>
              </div>

              <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Download</h4>
              <div className="space-y-2">
                {(["glb", "obj", "stl"] as const).map((fmt) => (
                  <a
                    key={fmt}
                    href={formatDownloadUrl(fmt)}
                    download={`model.${fmt}`}
                    className="flex items-center justify-between p-3 bg-[#151515] border border-zinc-800 hover:border-[#00E5FF]/40 transition-colors group"
                  >
                    <span className="text-xs font-mono uppercase">{fmt}</span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500 group-hover:text-[#00E5FF] transition-colors">
                      <Download className="w-3 h-3" /> Download .{fmt}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Error state */}
          {isError && !showProgress && (
            <section className="flex-1">
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-6 font-bold">Error</h3>
              <div className="bg-[#111] border border-red-900/40 rounded-lg p-6">
                <div className="flex items-start gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400">Generation Failed</p>
                    <p className="text-[11px] text-zinc-500 mt-1">{error || progress.error || "Unknown error"}</p>
                  </div>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full mt-4 font-black uppercase text-xs tracking-widest"
                >
                  Try Again
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>

      <footer className="h-12 border-t border-[#222] px-8 flex items-center justify-between bg-[#0A0A0A] shrink-0">
        <div className="flex gap-6 items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span>Engine: <span className="text-[#00E5FF]">TripoSR</span></span>
          <span>Status: <span className={connected ? "text-[#00FF41]" : "text-zinc-500"}>{connected ? "Connected" : "Idle"}</span></span>
        </div>
      </footer>
    </div>
  );
}
