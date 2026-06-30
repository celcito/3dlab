import { useCallback, useMemo, useReducer, useRef } from "react";
import * as THREE from "three";
import {
  buildDemoGeometry,
  loadMeshFromFile,
  loadMeshFromUrl,
  triangleCount,
} from "@/lib/loaders";
import { decimate, Quality } from "@/lib/decimate";
import {
  fillHoles,
  smartSelect as smartSelectFaces,
} from "@/lib/meshSelection";
import { cutBySelection } from "@/lib/booleanCut";
import {
  applyDowelToPieces,
  DowelSpec,
} from "@/lib/dowel";
import {
  exportAllZip,
  exportPieceStl,
  ExportablePiece,
} from "@/lib/exportPieces";
import { STLExporter } from "@/lib/threeShims";
import { STLLoader } from "@/lib/threeShims";
import { autoOrient } from "@/lib/autoOrient";

export type EditorMode = "view" | "manual" | "smart" | "erase";

function deriveBaseName(label: string): string {
  const stem = label.replace(/\.(stl|obj|gltf|glb)$/i, "");
  return stem.replace(/[^A-Za-z0-9_]/g, "").slice(0, 12) || "Part";
}

function nextLetterSuffix(
  existing: PieceData[],
  base: string,
  letter: "A" | "B"
): string {
  let n = 1;
  while (existing.some((p) => p.name === `Part_${base}_${letter}_${n}`)) {
    n++;
  }
  return `${base}_${letter}_${n}`;
}

function repositionExistingPieces(
  pieces: PieceData[],
  totalCount: number,
  spacing: number,
  startX: number
) {
  pieces.forEach((p, i) => {
    p.mesh.position.set(startX + i * spacing, 0, 0);
  });
}

export interface PieceData {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  triangleCount: number;
  visible: boolean;
  color: string;
}

export interface MeshEditorState {
  source: { kind: "none" } | { kind: "demo" } | { kind: "url"; url: string } | { kind: "file"; fileName: string };
  sourceLabel: string;
  originalGeometry: THREE.BufferGeometry | null;
  currentGeometry: THREE.BufferGeometry | null;
  originalTriCount: number;
  triangleCount: number;
  quality: Quality;
  mode: EditorMode;
  smartThreshold: number;
  selectedFaces: Set<number>;
  isDecimating: boolean;
  isCutting: boolean;
  isFilling: boolean;
  isApplyingDowel: boolean;
  pieces: PieceData[];
  dowel: {
    visible: boolean;
    spec: DowelSpec;
  } | null;
  showDowelPrompt: boolean;
  error: string | null;
  loading: boolean;
}

type Action =
  | { type: "LOAD_START"; source: MeshEditorState["source"]; label: string }
  | { type: "LOAD_OK"; geometry: THREE.BufferGeometry; tris: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "SET_QUALITY"; quality: Quality; geometry: THREE.BufferGeometry; tris: number }
  | { type: "SET_MODE"; mode: EditorMode }
  | { type: "SET_THRESHOLD"; threshold: number }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_SELECTION"; faces: Set<number> }
  | { type: "ADD_TO_SELECTION"; faces: Set<number> }
  | { type: "REMOVE_FROM_SELECTION"; faces: Set<number> }
  | { type: "CUT_START" }
  | { type: "CUT_OK"; pieces: PieceData[]; newGeom: THREE.BufferGeometry | null; newTris: number }
  | { type: "CUT_ERR"; error: string }
  | { type: "FILL_START" }
  | { type: "FILL_OK"; faces: Set<number> }
  | { type: "FILL_ERR"; error: string }
  | { type: "PIECE_TOGGLE"; id: string }
  | { type: "PIECE_REMOVE"; id: string }
  | { type: "EDIT_PIECE"; id: string; geometry: THREE.BufferGeometry; tris: number }
  | { type: "DOWEL_SHOW"; spec: DowelSpec }
  | { type: "DOWEL_UPDATE"; spec: Partial<DowelSpec> }
  | { type: "DOWEL_HIDE" }
  | { type: "DOWEL_PROMPT"; show: boolean }
  | { type: "DOWEL_APPLY_START" }
  | { type: "DOWEL_APPLY_OK"; pieces: PieceData[] }
  | { type: "DOWEL_APPLY_ERR"; error: string }
  | { type: "RESET" }
  | { type: "DECIMATE_START" }
  | { type: "DECIMATE_END" }
  | { type: "UNDO" }
  | { type: "REDO" };

export interface EditableSlice {
  originalGeometry: THREE.BufferGeometry | null;
  currentGeometry: THREE.BufferGeometry | null;
  originalTriCount: number;
  triangleCount: number;
  quality: Quality;
  selectedFaces: Set<number>;
  pieces: PieceData[];
  source: MeshEditorState["source"];
  sourceLabel: string;
}

function extractEditable(state: MeshEditorState): EditableSlice {
  return {
    originalGeometry: state.originalGeometry,
    currentGeometry: state.currentGeometry,
    originalTriCount: state.originalTriCount,
    triangleCount: state.triangleCount,
    quality: state.quality,
    selectedFaces: state.selectedFaces,
    pieces: state.pieces,
    source: state.source,
    sourceLabel: state.sourceLabel,
  };
}

function applyEditable(state: MeshEditorState, slice: EditableSlice): MeshEditorState {
  return {
    ...state,
    ...slice,
  };
}

const TRACKED_ACTIONS = new Set<Action["type"]>([
  "LOAD_OK",
  "SET_QUALITY",
  "SET_SELECTION",
  "ADD_TO_SELECTION",
  "REMOVE_FROM_SELECTION",
  "CLEAR_SELECTION",
  "FILL_OK",
  "CUT_OK",
  "DOWEL_APPLY_OK",
  "EDIT_PIECE",
  "PIECE_REMOVE",
  "RESET",
]);

const HISTORY_CAP = 20;

interface HistoryState {
  past: EditableSlice[];
  future: EditableSlice[];
}

const initialHistory: HistoryState = { past: [], future: [] };

function captureHistory(
  history: HistoryState,
  prev: EditableSlice
): HistoryState {
  const past = [...history.past, prev];
  if (past.length > HISTORY_CAP) past.shift();
  return { past, future: [] };
}

export function undoReducer(
  baseReducer: (state: MeshEditorState, action: Action) => MeshEditorState,
  history: HistoryState,
  state: MeshEditorState,
  action: Action
): { state: MeshEditorState; history: HistoryState } {
  if (action.type === "UNDO") {
    if (history.past.length === 0) return { state, history };
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const newFuture = [extractEditable(state), ...history.future];
    return {
      state: applyEditable(state, previous),
      history: { past: newPast, future: newFuture },
    };
  }

  if (action.type === "REDO") {
    if (history.future.length === 0) return { state, history };
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    const newPast = [...history.past, extractEditable(state)];
    return {
      state: applyEditable(state, next),
      history: { past: newPast, future: newFuture },
    };
  }

  const prevSlice = TRACKED_ACTIONS.has(action.type)
    ? extractEditable(state)
    : null;
  const next = baseReducer(state, action);
  if (prevSlice === null) {
    return { state: next, history };
  }
  return { state: next, history: captureHistory(history, prevSlice) };
}

const initial: MeshEditorState = {
  source: { kind: "none" },
  sourceLabel: "NONE",
  originalGeometry: null,
  currentGeometry: null,
  originalTriCount: 0,
  triangleCount: 0,
  quality: "original",
  mode: "view",
  smartThreshold: 30,
  selectedFaces: new Set(),
  isDecimating: false,
  isCutting: false,
  isFilling: false,
  isApplyingDowel: false,
  pieces: [],
  dowel: null,
  showDowelPrompt: false,
  error: null,
  loading: false,
};

function reducer(state: MeshEditorState, action: Action): MeshEditorState {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...state,
        loading: true,
        error: null,
        source: action.source,
        sourceLabel: action.label,
        pieces: [],
        selectedFaces: new Set(),
        dowel: null,
        showDowelPrompt: false,
        quality: "original",
      };
    case "LOAD_OK":
      return {
        ...state,
        loading: false,
        originalGeometry: action.geometry,
        currentGeometry: action.geometry,
        originalTriCount: action.tris,
        triangleCount: action.tris,
        quality: "original",
        selectedFaces: new Set(),
        pieces: [],
        dowel: null,
        showDowelPrompt: false,
        error: null,
      };
    case "LOAD_ERR":
      return { ...state, loading: false, error: action.error };
    case "DECIMATE_START":
      return { ...state, isDecimating: true };
    case "DECIMATE_END":
      return { ...state, isDecimating: false };
    case "SET_QUALITY":
      return {
        ...state,
        quality: action.quality,
        currentGeometry: action.geometry,
        triangleCount: action.tris,
        selectedFaces: new Set(),
      };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_THRESHOLD":
      return { ...state, smartThreshold: action.threshold };
    case "CLEAR_SELECTION":
      return { ...state, selectedFaces: new Set() };
    case "SET_SELECTION":
      return { ...state, selectedFaces: new Set(action.faces) };
    case "ADD_TO_SELECTION": {
      const next = new Set(state.selectedFaces);
      for (const f of action.faces) next.add(f);
      return { ...state, selectedFaces: next };
    }
    case "REMOVE_FROM_SELECTION": {
      const next = new Set(state.selectedFaces);
      for (const f of action.faces) next.delete(f);
      return { ...state, selectedFaces: next };
    }
    case "CUT_START":
      return { ...state, isCutting: true, error: null };
    case "CUT_OK":
      return {
        ...state,
        isCutting: false,
        pieces: action.pieces,
        selectedFaces: new Set(),
        showDowelPrompt: action.pieces.length >= 2,
        currentGeometry: action.newGeom,
        triangleCount: action.newTris,
      };
    case "CUT_ERR":
      return { ...state, isCutting: false, error: action.error };
    case "FILL_START":
      return { ...state, isFilling: true };
    case "FILL_OK":
      return { ...state, isFilling: false, selectedFaces: action.faces };
    case "FILL_ERR":
      return { ...state, isFilling: false, error: action.error };
    case "PIECE_TOGGLE":
      return {
        ...state,
        pieces: state.pieces.map((p) =>
          p.id === action.id ? { ...p, visible: !p.visible } : p
        ),
      };
    case "PIECE_REMOVE":
      return {
        ...state,
        pieces: state.pieces.filter((p) => p.id !== action.id),
      };
    case "EDIT_PIECE":
      return {
        ...state,
        currentGeometry: action.geometry,
        triangleCount: action.tris,
        originalTriCount: action.tris,
        originalGeometry: action.geometry,
        quality: "original",
        selectedFaces: new Set(),
        pieces: state.pieces.filter((p) => p.id !== action.id),
        dowel: null,
        showDowelPrompt: false,
      };
    case "DOWEL_SHOW":
      return { ...state, dowel: { visible: true, spec: action.spec } };
    case "DOWEL_UPDATE":
      if (!state.dowel) return state;
      return {
        ...state,
        dowel: {
          ...state.dowel,
          spec: { ...state.dowel.spec, ...action.spec },
        },
      };
    case "DOWEL_HIDE":
      return { ...state, dowel: null };
    case "DOWEL_PROMPT":
      return { ...state, showDowelPrompt: action.show };
    case "DOWEL_APPLY_START":
      return { ...state, isApplyingDowel: true, error: null };
    case "DOWEL_APPLY_OK":
      return {
        ...state,
        isApplyingDowel: false,
        pieces: action.pieces,
        dowel: null,
        showDowelPrompt: false,
      };
    case "DOWEL_APPLY_ERR":
      return { ...state, isApplyingDowel: false, error: action.error };
    case "RESET":
      return {
        ...initial,
      };
    default:
      return state;
  }
}

export interface UseMeshEditor {
  state: MeshEditorState;
  history: { canUndo: boolean; canRedo: boolean; past: number; future: number };
  undo: () => void;
  redo: () => void;
  loadDemo: () => void;
  loadFromFile: (file: File) => Promise<void>;
  loadFromUrl: (url: string, label?: string) => Promise<void>;
  setQuality: (q: Quality) => void;
  decimateServerSide: (ratio: number) => Promise<void>;
  autoOrientMesh: () => void;
  setMode: (m: EditorMode) => void;
  setThreshold: (deg: number) => void;
  selectFace: (faceIndex: number, additive: boolean) => void;
  smartSelectFace: (faceIndex: number, additive: boolean) => void;
  eraseFace: (faceIndex: number) => void;
  fillSelection: () => void;
  clearSelection: () => void;
  performCut: () => void;
  togglePiece: (id: string) => void;
  editPiece: (id: string) => void;
  showDowel: () => void;
  updateDowel: (spec: Partial<DowelSpec>) => void;
  hideDowel: () => void;
  dismissDowelPrompt: () => void;
  applyDowel: () => void;
  exportPiece: (id: string) => void;
  exportAll: () => Promise<void>;
  reset: () => void;
}

export function useMeshEditor(): UseMeshEditor {
  const [bundle, dispatchBundle] = useReducer(
    (b: { state: MeshEditorState; history: HistoryState }, action: Action) =>
      undoReducer(reducer, b.history, b.state, action),
    { state: initial, history: initialHistory }
  );
  const state = bundle.state;
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback((action: Action) => {
    dispatchBundle(action);
  }, []);

  const loadDemo = useCallback(() => {
    dispatch({
      type: "LOAD_START",
      source: { kind: "demo" },
      label: "DEMO_CUBE.STL",
    });
    try {
      const geom = buildDemoGeometry();
      const tris = triangleCount(geom);
      dispatch({ type: "LOAD_OK", geometry: geom, tris });
    } catch (e: any) {
      dispatch({ type: "LOAD_ERR", error: e?.message || "Falha ao gerar demo" });
    }
  }, []);

  const loadFromFile = useCallback(async (file: File) => {
    dispatch({
      type: "LOAD_START",
      source: { kind: "file", fileName: file.name },
      label: file.name,
    });
    try {
      const geom = await loadMeshFromFile(file);
      const tris = triangleCount(geom);
      dispatch({ type: "LOAD_OK", geometry: geom, tris });
    } catch (e: any) {
      dispatch({ type: "LOAD_ERR", error: e?.message || "Falha ao carregar" });
    }
  }, []);

  const loadFromUrl = useCallback(async (url: string, label?: string) => {
    const displayLabel = label || url.split("/").pop() || "model.glb";
    dispatch({
      type: "LOAD_START",
      source: { kind: "url", url },
      label: displayLabel,
    });
    try {
      const geom = await loadMeshFromUrl(url);
      const tris = triangleCount(geom);
      dispatch({ type: "LOAD_OK", geometry: geom, tris });
    } catch (e: any) {
      dispatch({ type: "LOAD_ERR", error: e?.message || "Falha ao carregar URL" });
    }
  }, []);

  const setQuality = useCallback(
    (q: Quality) => {
      const s = stateRef.current;
      if (!s.originalGeometry) return;
      dispatch({ type: "DECIMATE_START" });
      setTimeout(() => {
        try {
          const geom = decimate(s.originalGeometry!, q);
          const tris = triangleCount(geom);
          dispatch({ type: "SET_QUALITY", quality: q, geometry: geom, tris });
        } catch (e: any) {
          dispatch({ type: "LOAD_ERR", error: e?.message || "Decimação falhou" });
        } finally {
          dispatch({ type: "DECIMATE_END" });
        }
      }, 30);
    },
    []
  );

  const decimateServerSide = useCallback(
    async (ratio: number) => {
      const s = stateRef.current;
      if (!s.currentGeometry) return;
      dispatch({ type: "DECIMATE_START" });
      try {
        const exporter = new STLExporter();
        const mesh = new THREE.Mesh(s.currentGeometry);
        const stlData = exporter.parse(mesh, { binary: true });
        const stlBytes = stlData instanceof DataView
          ? new Uint8Array(stlData.buffer, stlData.byteOffset, stlData.byteLength)
          : new Uint8Array(stlData as ArrayBuffer);
        const stlBlob = new Blob([stlBytes], { type: "application/sla" });

        const formData = new FormData();
        formData.append("file", stlBlob, "mesh.stl");
        formData.append("ratio", String(ratio));

        const res = await fetch("/api/decimate", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.text().catch(() => "Unknown");
          throw new Error(`Server decimate failed (${res.status}): ${err}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        const loader = new STLLoader();
        const geom = loader.parse(arrayBuffer);
        geom.computeVertexNormals();
        geom.computeBoundingBox();

        const tris = triangleCount(geom);
        dispatch({ type: "SET_QUALITY", quality: "original", geometry: geom, tris });
      } catch (e: any) {
        dispatch({ type: "LOAD_ERR", error: `Decimação server-side falhou: ${e?.message || e}` });
      } finally {
        dispatch({ type: "DECIMATE_END" });
      }
    },
    []
  );

  const autoOrientMesh = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentGeometry) return;
    try {
      const result = autoOrient(s.currentGeometry);
      const tris = triangleCount(result.geometry);
      dispatch({ type: "SET_QUALITY", quality: s.quality, geometry: result.geometry, tris });
    } catch (e: any) {
      dispatch({ type: "LOAD_ERR", error: `Auto-orient falhou: ${e?.message || e}` });
    }
  }, []);

  const setMode = useCallback((m: EditorMode) => {
    dispatch({ type: "SET_MODE", mode: m });
  }, []);

  const setThreshold = useCallback((deg: number) => {
    dispatch({ type: "SET_THRESHOLD", threshold: deg });
  }, []);

  const selectFace = useCallback((faceIndex: number, additive: boolean) => {
    const s = stateRef.current;
    if (additive) {
      const next = new Set(s.selectedFaces);
      next.add(faceIndex);
      dispatch({ type: "SET_SELECTION", faces: next });
    } else {
      dispatch({ type: "SET_SELECTION", faces: new Set([faceIndex]) });
    }
  }, []);

  const smartSelectFace = useCallback(
    (faceIndex: number, additive: boolean) => {
      const s = stateRef.current;
      if (!s.currentGeometry) return;
      try {
        const sel = smartSelectFaces(
          s.currentGeometry,
          faceIndex,
          s.smartThreshold
        );
        if (additive) {
          dispatch({ type: "ADD_TO_SELECTION", faces: sel });
        } else {
          dispatch({ type: "SET_SELECTION", faces: sel });
        }
      } catch (e: any) {
        dispatch({ type: "LOAD_ERR", error: e?.message || "Smart select falhou" });
      }
    },
    []
  );

  const eraseFace = useCallback((faceIndex: number) => {
    dispatch({ type: "REMOVE_FROM_SELECTION", faces: new Set([faceIndex]) });
  }, []);

  const fillSelection = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentGeometry || s.selectedFaces.size === 0) return;
    dispatch({ type: "FILL_START" });
    setTimeout(() => {
      try {
        const filled = fillHoles(
          s.currentGeometry!,
          s.selectedFaces,
          s.smartThreshold
        );
        dispatch({ type: "FILL_OK", faces: filled });
      } catch (e: any) {
        dispatch({ type: "FILL_ERR", error: e?.message || "Fill falhou" });
      }
    }, 30);
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  const performCut = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentGeometry || s.selectedFaces.size === 0) return;
    dispatch({ type: "CUT_START" });
    setTimeout(() => {
      try {
        const result = cutBySelection(s.currentGeometry!, s.selectedFaces);

        const existingPieces = s.pieces;
        const totalPieces = existingPieces.length + 2;
        const spacing = 3.0;
        const startX = -((totalPieces - 1) * spacing) / 2;
        const indexA = existingPieces.length;
        const indexB = existingPieces.length + 1;

        const baseName = deriveBaseName(s.sourceLabel);
        const aSuffix = nextLetterSuffix(existingPieces, baseName, "A");
        const bSuffix = nextLetterSuffix(existingPieces, baseName, "B");

        const pieceA: PieceData = {
          id: `Part_${aSuffix}`,
          name: `Part_${aSuffix}`,
          mesh: result.pieceA,
          triangleCount: result.pieceATris,
          visible: true,
          color: "#00E5FF",
        };
        const pieceB: PieceData = {
          id: `Part_${bSuffix}`,
          name: `Part_${bSuffix}`,
          mesh: result.pieceB,
          triangleCount: result.pieceBTris,
          visible: true,
          color: "#FF7A00",
        };

        repositionExistingPieces(existingPieces, totalPieces, spacing, startX);
        result.pieceA.position.set(startX + indexA * spacing, 0, 0);
        result.pieceB.position.set(startX + indexB * spacing, 0, 0);

        const newPieces = [...existingPieces, pieceA, pieceB];
        const newGeom: THREE.BufferGeometry | null = null;
        const newTris = 0;

        dispatch({
          type: "CUT_OK",
          pieces: newPieces,
          newGeom,
          newTris,
        });
      } catch (e: any) {
        dispatch({ type: "CUT_ERR", error: e?.message || "Corte falhou" });
      }
    }, 50);
  }, []);

  const togglePiece = useCallback((id: string) => {
    dispatch({ type: "PIECE_TOGGLE", id });
  }, []);

  const editPiece = useCallback((id: string) => {
    const s = stateRef.current;
    const piece = s.pieces.find((p) => p.id === id);
    if (!piece) return;

    piece.mesh.updateMatrixWorld(true);
    const localGeom = piece.mesh.geometry.clone();
    const inverse = new THREE.Matrix4().copy(piece.mesh.matrixWorld).invert();
    localGeom.applyMatrix4(inverse);
    localGeom.computeVertexNormals();
    localGeom.computeBoundingBox();
    localGeom.computeBoundingSphere();
    const tris = localGeom.index
      ? localGeom.index.count / 3
      : localGeom.attributes.position.count / 3;

    dispatch({ type: "EDIT_PIECE", id, geometry: localGeom, tris });
  }, []);

  const showDowel = useCallback(() => {
    const s = stateRef.current;
    if (s.pieces.length < 2) return;
    const piece = s.pieces[0];
    piece.mesh.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(piece.mesh);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const dir = new THREE.Vector3(0, 1, 0);
    dispatch({
      type: "DOWEL_SHOW",
      spec: {
        diameter: 5,
        depth: 10,
        position: center,
        direction: dir,
      },
    });
    dispatch({ type: "DOWEL_PROMPT", show: false });
  }, []);

  const updateDowel = useCallback((spec: Partial<DowelSpec>) => {
    dispatch({ type: "DOWEL_UPDATE", spec });
  }, []);

  const hideDowel = useCallback(() => {
    dispatch({ type: "DOWEL_HIDE" });
  }, []);

  const dismissDowelPrompt = useCallback(() => {
    dispatch({ type: "DOWEL_PROMPT", show: false });
  }, []);

  const applyDowel = useCallback(() => {
    const s = stateRef.current;
    if (!s.dowel || s.pieces.length < 2) return;
    dispatch({ type: "DOWEL_APPLY_START" });
    setTimeout(() => {
      try {
        const result = applyDowelToPieces(
          s.pieces[0].mesh,
          s.pieces[1].mesh,
          s.dowel!.spec
        );
        if (!result.ok) {
          dispatch({
            type: "DOWEL_APPLY_ERR",
            error: result.reason || "Pino falhou",
          });
          return;
        }
        const newPieces: PieceData[] = s.pieces.map((p, i) => ({
          ...p,
          mesh: i === 0 ? result.base : result.opposite,
          triangleCount: triangleCount(
            i === 0 ? result.base.geometry : result.opposite.geometry
          ),
        }));
        dispatch({ type: "DOWEL_APPLY_OK", pieces: newPieces });
      } catch (e: any) {
        dispatch({
          type: "DOWEL_APPLY_ERR",
          error: e?.message || "Pino falhou",
        });
      }
    }, 50);
  }, []);

  const exportPiece = useCallback((id: string) => {
    const s = stateRef.current;
    const piece = s.pieces.find((p) => p.id === id);
    if (!piece) return;
    try {
      exportPieceStl(piece.mesh, piece.name);
    } catch (e: any) {
      dispatch({ type: "LOAD_ERR", error: e?.message || "Export falhou" });
    }
  }, []);

  const exportAll = useCallback(async () => {
    const s = stateRef.current;
    if (s.pieces.length === 0) return;
    const list: ExportablePiece[] = s.pieces.map((p) => ({
      id: p.id,
      name: p.name,
      mesh: p.mesh,
    }));
    try {
      await exportAllZip(list, "parts.zip");
    } catch (e: any) {
      dispatch({ type: "LOAD_ERR", error: e?.message || "ZIP falhou" });
    }
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  return useMemo(
    () => ({
      state,
      history: {
        canUndo: bundle.history.past.length > 0,
        canRedo: bundle.history.future.length > 0,
        past: bundle.history.past.length,
        future: bundle.history.future.length,
      },
      undo,
      redo,
      loadDemo,
      loadFromFile,
      loadFromUrl,
      setQuality,
      decimateServerSide,
      autoOrientMesh,
      setMode,
      setThreshold,
      selectFace,
      smartSelectFace,
      eraseFace,
      fillSelection,
      clearSelection,
      performCut,
      togglePiece,
      editPiece,
      showDowel,
      updateDowel,
      hideDowel,
      dismissDowelPrompt,
      applyDowel,
      exportPiece,
      exportAll,
      reset,
    }),
    [
      state,
      bundle.history.past.length,
      bundle.history.future.length,
      undo,
      redo,
      loadDemo,
      loadFromFile,
      loadFromUrl,
      setQuality,
      decimateServerSide,
      autoOrientMesh,
      setMode,
      setThreshold,
      selectFace,
      smartSelectFace,
      eraseFace,
      fillSelection,
      clearSelection,
      performCut,
      togglePiece,
      editPiece,
      showDowel,
      updateDowel,
      hideDowel,
      dismissDowelPrompt,
      applyDowel,
      exportPiece,
      exportAll,
      reset,
    ]
  );
}
