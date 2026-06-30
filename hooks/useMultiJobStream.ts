import { useState, useCallback } from "react";

interface MultiJobProgress {
  jobId: string;
  status: string;
  progress: number;
  step: string;
  error: string;
}

export function useMultiJobStream() {
  const [jobs, setJobs] = useState<Map<string, MultiJobProgress>>(new Map());

  const addJobs = useCallback((ids: string[]) => {
    const next = new Map(jobs);
    for (const id of ids) {
      next.set(id, { jobId: id, status: "queued", progress: 0, step: "", error: "" });
      connectSSE(id, next);
    }
    setJobs(new Map(next));
  }, [jobs]);

  const connectSSE = (jobId: string, map: Map<string, MultiJobProgress>) => {
    const es = new EventSource(`/api/img2-3d/${jobId}/sse`);
    es.addEventListener("progress", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Omit<MultiJobProgress, "jobId">;
        const entry = map.get(jobId);
        if (!entry) return;
        entry.status = data.status;
        entry.progress = data.progress;
        entry.step = data.step;
        entry.error = data.error;
        setJobs(new Map(map));
        if (data.status === "done" || data.status === "error") {
          es.close();
        }
      } catch {}
    });
    es.addEventListener("ping", () => {});
    es.onerror = () => {
      const entry = map.get(jobId);
      if (entry && entry.status !== "done" && entry.status !== "error") {
        entry.status = "disconnected";
        setJobs(new Map(map));
      }
    };
  };

  const allDone = jobs.size > 0 && [...jobs.values()].every((j) => j.status === "done" || j.status === "error");

  return { jobs, addJobs, allDone };
}
