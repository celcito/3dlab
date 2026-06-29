import { useState, useEffect, useRef, useCallback } from "react";

interface JobProgress {
  status: string;
  progress: number;
  step: string;
  error: string;
  files: Record<string, string>;
}

export function useJobStream(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress>({ status: "idle", progress: 0, step: "", error: "", files: {} });
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const url = `/api/img2-3d/${jobId}/sse`;
    const es = new EventSource(url);
    eventSourceRef.current = es;
    setConnected(true);

    es.addEventListener("progress", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as JobProgress;
        setProgress(data);
        if (data.status === "done" || data.status === "error") {
          es.close();
          setConnected(false);
        }
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener("ping", () => {
      // keepalive, no-op
    });

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects; close manually after terminal states
      setProgress(p => {
        if (p.status !== "done" && p.status !== "error") {
          return { ...p, status: "disconnected" };
        }
        return p;
      });
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [jobId]);

  return { progress, connected, stop };
}
