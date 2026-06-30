import { useCallback, useState, useRef, useEffect } from "react";
import { VectorScene, VectorPiece, Shape2D, EditorMode, FixReport } from "@/lib/cookie-cutter/svgTypes";
import { createDefaultScene, createShapeFromD, parseSvgFile } from "@/lib/cookie-cutter/svgImport";
import { sceneToSvgString, downloadSvg } from "@/lib/cookie-cutter/svgExport";
import { validate } from "@/lib/cookie-cutter/svgValidator";
import { autoFix } from "@/lib/cookie-cutter/svgAutoFix";
import { useUndoRedo } from "./useUndoRedo";
import { useSnap } from "./useSnap";

export type { EditorMode };

export interface VectorEditorState {
  pieces: VectorPiece[];
  activePieceId: string;
  view: { panX: number; panY: number; zoom: number };
  grid: { enabled: boolean; size: number; snap: boolean; snapTolerance: number };
  selection: Set<string>;
  mode: EditorMode;
  fixReport: FixReport | null;
  originalScene: VectorScene | null;
  showFixDialog: boolean;
  showTextDialog: boolean;
  showShapeLibrary: boolean;
}

export function useVectorEditor() {
  const [scene, setScene] = useState<VectorScene>(createDefaultScene);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<EditorMode>("select");
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showShapeLibrary, setShowShapeLibrary] = useState(false);
  const [fixReport, setFixReport] = useState<FixReport | null>(null);
  const [originalScene, setOriginalScene] = useState<VectorScene | null>(null);

  const snapshot = useRef<VectorScene>(scene);

  const undoRedo = useUndoRedo<VectorScene>(scene, 50);

  const activePiece = scene.pieces.find(p => p.id === scene.activePieceId) || scene.pieces[0];

  const allVertexPoints = activePiece?.shapes.map(s => {
    if (!s.visible) return [];
    const d = s.d;
    const pts: { x: number; y: number }[] = [];
    const re = /([MmLl])\s*([-\d.e]+)[,\s]([-\d.e]+)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
      pts.push({ x: parseFloat(m[2]), y: parseFloat(m[3]) });
    }
    return pts;
  }).flat() || [];

  const snap = useSnap(
    { gridSize: scene.grid.size, enabled: scene.grid.snap, tolerance: scene.grid.snapTolerance },
    allVertexPoints
  );

  const updateScene = useCallback((next: VectorScene) => {
    snapshot.current = next;
    setScene(next);
    undoRedo.push(next);
  }, [undoRedo]);

  const addPiece = useCallback(() => {
    const next = { ...scene };
    const piece: VectorPiece = {
      id: crypto.randomUUID(),
      name: `Peça ${next.pieces.length + 1}`,
      shapes: [],
      embosseShapes: [],
      embosseMode: "deboss",
      embosseDepth: 0.8,
    };
    next.pieces = [...next.pieces, piece];
    next.activePieceId = piece.id;
    updateScene(next);
  }, [scene, updateScene]);

  const removePiece = useCallback((id: string) => {
    if (scene.pieces.length <= 1) return;
    const next = { ...scene };
    const idx = next.pieces.findIndex(p => p.id === id);
    next.pieces = next.pieces.filter(p => p.id !== id);
    if (next.activePieceId === id) {
      const newIdx = Math.min(idx, next.pieces.length - 1);
      next.activePieceId = next.pieces[newIdx].id;
    }
    updateScene(next);
  }, [scene, updateScene]);

  const renamePiece = useCallback((id: string, name: string) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p => p.id === id ? { ...p, name } : p);
    updateScene(next);
  }, [scene, updateScene]);

  const setActivePiece = useCallback((id: string) => {
    setScene(prev => ({ ...prev, activePieceId: id }));
    setSelection(new Set());
  }, []);

  const addShape = useCallback((pieceId: string, shape: Shape2D) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? { ...p, shapes: [...p.shapes, shape] } : p
    );
    updateScene(next);
  }, [scene, updateScene]);

  const addShapeToActive = useCallback((shape: Shape2D) => {
    addShape(scene.activePieceId, shape);
  }, [scene.activePieceId, addShape]);

  const removeShape = useCallback((pieceId: string, shapeId: string) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? { ...p, shapes: p.shapes.filter(s => s.id !== shapeId) } : p
    );
    updateScene(next);
    setSelection(prev => {
      const n = new Set(prev);
      n.delete(shapeId);
      return n;
    });
  }, [scene, updateScene]);

  const updateShape = useCallback((pieceId: string, shapeId: string, updates: Partial<Shape2D>) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? {
        ...p,
        shapes: p.shapes.map(s => s.id === shapeId ? { ...s, ...updates } : s),
      } : p
    );
    updateScene(next);
  }, [scene, updateScene]);

  const updateShapeTransform = useCallback((pieceId: string, shapeId: string, transform: Partial<Shape2D["transform"]>) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? {
        ...p,
        shapes: p.shapes.map(s => s.id === shapeId ? {
          ...s,
          transform: { ...s.transform, ...transform },
        } : s),
      } : p
    );
    updateScene(next);
  }, [scene, updateScene]);

  const moveShape = useCallback((pieceId: string, shapeId: string, dx: number, dy: number) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? {
        ...p,
        shapes: p.shapes.map(s => s.id === shapeId ? {
          ...s,
          transform: { ...s.transform, tx: s.transform.tx + dx, ty: s.transform.ty + dy },
        } : s),
      } : p
    );
    updateScene(next);
  }, [scene, updateScene]);

  const scaleShape = useCallback((pieceId: string, shapeId: string, sx: number, sy: number, uniform = true) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? {
        ...p,
        shapes: p.shapes.map(s => s.id === shapeId ? {
          ...s,
          transform: {
            ...s.transform,
            sx: s.transform.sx * sx,
            sy: uniform ? s.transform.sy * sx : s.transform.sy * sy,
          },
        } : s),
      } : p
    );
    updateScene(next);
  }, [scene, updateScene]);

  const rotateShape = useCallback((pieceId: string, shapeId: string, angleDeg: number) => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? {
        ...p,
        shapes: p.shapes.map(s => s.id === shapeId ? {
          ...s,
          transform: { ...s.transform, rotation: (s.transform.rotation + angleDeg) % 360 },
        } : s),
      } : p
    );
    updateScene(next);
  }, [scene, updateScene]);

  const mirrorShape = useCallback((pieceId: string, shapeId: string, axis: "x" | "y") => {
    const next = { ...scene };
    next.pieces = next.pieces.map(p =>
      p.id === pieceId ? {
        ...p,
        shapes: p.shapes.map(s => s.id === shapeId ? {
          ...s,
          transform: {
            ...s.transform,
            mirrorX: axis === "x" ? !s.transform.mirrorX : s.transform.mirrorX,
            mirrorY: axis === "y" ? !s.transform.mirrorY : s.transform.mirrorY,
          },
        } : s),
      } : p
    );
    updateScene(next);
  }, [scene, updateScene]);

  const selectShape = useCallback((shapeId: string, additive = false) => {
    setSelection(prev => {
      const n = additive ? new Set(prev) : new Set<string>();
      n.add(shapeId);
      return n;
    });
  }, []);

  const deselectShape = useCallback((shapeId: string) => {
    setSelection(prev => {
      const n = new Set(prev);
      n.delete(shapeId);
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!activePiece) return;
    setSelection(new Set(activePiece.shapes.filter(s => s.visible !== false).map(s => s.id)));
  }, [activePiece]);

  const clearSelection = useCallback(() => {
    setSelection(new Set());
  }, []);

  const setViewZoom = useCallback((zoom: number) => {
    setScene(prev => ({ ...prev, view: { ...prev.view, zoom: Math.max(0.1, Math.min(10, zoom)) } }));
  }, []);

  const setViewPan = useCallback((panX: number, panY: number) => {
    setScene(prev => ({ ...prev, view: { ...prev.view, panX, panY } }));
  }, []);

  const toggleGrid = useCallback(() => {
    setScene(prev => ({ ...prev, grid: { ...prev.grid, enabled: !prev.grid.enabled } }));
  }, []);

  const setGridSize = useCallback((size: number) => {
    setScene(prev => ({ ...prev, grid: { ...prev.grid, size } }));
  }, []);

  const toggleSnap = useCallback(() => {
    setScene(prev => ({ ...prev, grid: { ...prev.grid, snap: !prev.grid.snap } }));
  }, []);

  const importSvgFile = useCallback(async (file: File) => {
    try {
      const imported = await parseSvgFile(file);
      const report = validate(imported);
      if (report) {
        setFixReport(report);
        setOriginalScene(imported);
        setShowFixDialog(true);
      } else {
        const result = autoFix(imported);
        updateScene(result.fixed);
      }
    } catch (e: any) {
      console.error("Import SVG error:", e);
      throw e;
    }
  }, [updateScene]);

  const applyFix = useCallback(() => {
    if (!fixReport) return;
    const result = autoFix(fixReport.fixedScene);
    updateScene(result.fixed);
    setShowFixDialog(false);
    setFixReport(null);
    setOriginalScene(null);
  }, [fixReport, updateScene]);

  const rejectFix = useCallback(() => {
    if (originalScene) {
      updateScene(originalScene);
    }
    setShowFixDialog(false);
    setFixReport(null);
    setOriginalScene(null);
  }, [originalScene, updateScene]);

  const reset = useCallback(() => {
    const fresh = createDefaultScene();
    updateScene(fresh);
    setSelection(new Set());
    setMode("select");
    setFixReport(null);
    setOriginalScene(null);
  }, [updateScene]);

  const exportSvg = useCallback((pieceId?: string) => {
    let exportScene = scene;
    if (pieceId) {
      const piece = scene.pieces.find(p => p.id === pieceId);
      if (piece) {
        exportScene = { ...scene, pieces: [piece], activePieceId: pieceId };
      }
    }
    downloadSvg(exportScene, `${activePiece?.name || "cookie-cutter"}.svg`);
  }, [scene, activePiece]);

  const undo = useCallback(() => {
    const prev = undoRedo.undo();
    if (prev) {
      snapshot.current = prev;
      setScene(prev);
    }
  }, [undoRedo]);

  const redo = useCallback(() => {
    const next = undoRedo.redo();
    if (next) {
      snapshot.current = next;
      setScene(next);
    }
  }, [undoRedo]);

  return {
    scene,
    setScene: updateScene,
    activePiece,
    selection,
    setSelection,
    mode,
    setMode,
    snap,
    fixReport,
    showFixDialog,
    setShowFixDialog,
    showTextDialog,
    setShowTextDialog,
    showShapeLibrary,
    setShowShapeLibrary,
    originalScene,
    undoRedo,

    addPiece,
    removePiece,
    renamePiece,
    setActivePiece,
    addShape,
    addShapeToActive,
    removeShape,
    updateShape,
    updateShapeTransform,
    moveShape,
    scaleShape,
    rotateShape,
    mirrorShape,
    selectShape,
    deselectShape,
    selectAll,
    clearSelection,
    setViewZoom,
    setViewPan,
    toggleGrid,
    setGridSize,
    toggleSnap,
    importSvgFile,
    applyFix,
    rejectFix,
    reset,
    exportSvg,
    undo,
    redo,
  };
}
