import { useState, useEffect, useCallback, useRef } from "react";
import type { VectorPiece } from "@/lib/cookie-cutter/svgTypes";
import type { CutterParams, PrintEstimate, PrintProfile } from "@/lib/cookie-cutter/cutterParams";
import { DEFAULT_PARAMS } from "@/lib/cookie-cutter/cutterParams";
import { buildCutter, type CutterResult } from "@/lib/cookie-cutter/cutterBuild";
import { calculateEstimate } from "@/lib/cookie-cutter/printEstimate";
import { renderThumbnail } from "@/lib/cookie-cutter/thumbnail";
import * as THREE from "three";

export interface CookieCutterState {
  params: CutterParams;
  results: Map<string, CutterResult>;
  generating: boolean;
  wireframe: boolean;
  showDimensions: boolean;
  activePrintProfile: string;
}

export function useCookieCutter(initialParams: Partial<CutterParams> = {}) {
  const [params, setParamsState] = useState<CutterParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [results, setResults] = useState<Map<string, CutterResult>>(new Map());
  const [generating, setGenerating] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);
  const piecesRef = useRef<VectorPiece[]>([]);

  const regenerate = useCallback((pieces: VectorPiece[], activeParams: CutterParams) => {
    piecesRef.current = pieces;
    abortRef.current = true;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      abortRef.current = false;
      setGenerating(true);

      const newResults = new Map<string, CutterResult>();
      for (const piece of pieces) {
        if (abortRef.current) break;
        if (piece.shapes.length === 0) continue;
        const result = buildCutter(piece, activeParams);
        if (result) {
          newResults.set(piece.id, result);
        }
      }

      if (!abortRef.current) {
        setResults(newResults);
        setGenerating(false);
      }
    }, 300);
  }, []);

  const setParams = useCallback(
    (newParams: Partial<CutterParams> | ((prev: CutterParams) => CutterParams)) => {
      setParamsState((prev) => {
        const updated =
          typeof newParams === "function" ? newParams(prev) : { ...prev, ...newParams };
        return updated;
      });
    },
    []
  );

  const applyProfile = useCallback(
    (_profile: PrintProfile) => {
      setParamsState((prev) => ({ ...prev }));
    },
    []
  );

  const getActiveResult = useCallback(
    (pieceId: string | null) => {
      if (!pieceId) return null;
      return results.get(pieceId) ?? null;
    },
    [results]
  );

  const getAggregateEstimate = useCallback((): PrintEstimate => {
    let total: PrintEstimate = {
      volumeCm3: 0,
      weightG: 0,
      filamentLengthM: 0,
      printTimeH: 0,
      costBRL: 0,
    };
    for (const [, result] of results) {
      total.volumeCm3 += result.estimate.volumeCm3;
      total.weightG += result.estimate.weightG;
      total.filamentLengthM += result.estimate.filamentLengthM;
      total.printTimeH += result.estimate.printTimeH;
      total.costBRL += result.estimate.costBRL;
    }
    total.volumeCm3 = +total.volumeCm3.toFixed(2);
    total.weightG = +total.weightG.toFixed(1);
    total.filamentLengthM = +total.filamentLengthM.toFixed(2);
    total.printTimeH = +total.printTimeH.toFixed(2);
    total.costBRL = +total.costBRL.toFixed(2);
    return total;
  }, [results]);

  const getThumbnail = useCallback(
    async (pieceId: string, size: 256 | 64 = 256): Promise<string> => {
      const result = results.get(pieceId);
      if (!result) return "";
      return renderThumbnail(result.combined, size);
    },
    [results]
  );

  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    params,
    results,
    generating,
    wireframe,
    showDimensions,
    setParams,
    setWireframe,
    setShowDimensions,
    regenerate,
    applyProfile,
    getActiveResult,
    getAggregateEstimate,
    getThumbnail,
  };
}

export function piecesToGrid(
  results: Map<string, CutterResult>,
  pieceIds: string[],
  spacing = 3.0
): { pieceId: string; pos: [number, number, number] }[] {
  const entries = pieceIds.filter((id) => results.has(id));
  if (entries.length === 0) return [];

  const cols = Math.ceil(Math.sqrt(entries.length));
  const rows = Math.ceil(entries.length / cols);

  const positions: { pieceId: string; pos: [number, number, number] }[] = [];

  const gridWidth = 0;
  const maxBboxW = Math.max(
    ...entries.map((id) => {
      const r = results.get(id);
      return r?.stats.bbox.w ?? 0;
    })
  );
  const totalW = maxBboxW * cols + spacing * (cols - 1);

  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index >= entries.length) break;
      const id = entries[index];
      const result = results.get(id);
      if (!result) {
        index++;
        continue;
      }
      const x = col * (maxBboxW + spacing) - totalW / 2 + maxBboxW / 2;
      const y = row * (maxBboxW + spacing);
      positions.push({ pieceId: id, pos: [x, -y, 0] });
      index++;
    }
  }

  return positions;
}
