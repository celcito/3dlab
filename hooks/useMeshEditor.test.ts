import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  undoReducer,
  MeshEditorState,
  PieceData,
} from "./useMeshEditor";
import { Quality } from "@/lib/decimate";
import { EditorMode } from "./useMeshEditor";

type Action = Parameters<typeof undoReducer>[3];

function baseReducer(
  state: MeshEditorState,
  action: Action
): MeshEditorState {
  switch (action.type) {
    case "LOAD_OK":
      return {
        ...state,
        originalGeometry: action.geometry,
        currentGeometry: action.geometry,
        originalTriCount: action.tris,
        triangleCount: action.tris,
        quality: "original",
        selectedFaces: new Set(),
      };
    case "SET_SELECTION":
      return { ...state, selectedFaces: new Set(action.faces) };
    case "CLEAR_SELECTION":
      return { ...state, selectedFaces: new Set() };
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
    case "SET_QUALITY":
      return {
        ...state,
        quality: action.quality,
        currentGeometry: action.geometry,
        triangleCount: action.tris,
        selectedFaces: new Set(),
      };
    case "RESET":
      return { ...state, originalGeometry: null, currentGeometry: null, selectedFaces: new Set() };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    default:
      return state;
  }
}

function makeState(): MeshEditorState {
  return {
    source: { kind: "none" },
    sourceLabel: "NONE",
    originalGeometry: null,
    currentGeometry: null,
    originalTriCount: 0,
    triangleCount: 0,
    quality: "original" as Quality,
    mode: "view" as EditorMode,
    smartThreshold: 30,
    selectedFaces: new Set(),
    isDecimating: false,
    isCutting: false,
    isFilling: false,
    isApplyingDowel: false,
    pieces: [] as PieceData[],
    dowel: null,
    showDowelPrompt: false,
    error: null,
    loading: false,
  };
}

function makeGeom(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(2, 2, 2, 1, 1, 1);
}

describe("undoReducer", () => {
  it("captures pre-state on tracked actions and clears future", () => {
    let state = makeState();
    let history = { past: [], future: [] };

    const geom = makeGeom();
    const r1 = undoReducer(
      baseReducer,
      history,
      state,
      { type: "LOAD_OK", geometry: geom, tris: 12 }
    );
    state = r1.state;
    history = r1.history;
    expect(history.past.length).toBe(1);
    expect(state.originalTriCount).toBe(12);

    const r2 = undoReducer(
      baseReducer,
      history,
      state,
      { type: "SET_SELECTION", faces: new Set([0, 1]) }
    );
    state = r2.state;
    history = r2.history;
    expect(history.past.length).toBe(2);
    expect(state.selectedFaces.size).toBe(2);
  });

  it("does not capture pre-state on untracked actions (SET_MODE)", () => {
    let state = makeState();
    let history = { past: [], future: [] };
    const r1 = undoReducer(
      baseReducer,
      history,
      state,
      { type: "SET_MODE", mode: "manual" }
    );
    state = r1.state;
    history = r1.history;
    expect(history.past.length).toBe(0);
    expect(state.mode).toBe("manual");
  });

  it("UNDO restores previous state", () => {
    let state = makeState();
    let history = { past: [], future: [] };
    state = undoReducer(
      baseReducer,
      history,
      state,
      { type: "LOAD_OK", geometry: makeGeom(), tris: 12 }
    ).state;
    state = undoReducer(
      baseReducer,
      history,
      state,
      { type: "SET_SELECTION", faces: new Set([0, 1, 2]) }
    ).state;
    history = { past: [extractSlice(makeState())], future: [] };

    const r = undoReducer(
      baseReducer,
      history,
      state,
      { type: "UNDO" }
    );
    state = r.state;
    history = r.history;
    expect(state.selectedFaces.size).toBe(0);
    expect(history.past.length).toBe(0);
    expect(history.future.length).toBe(1);
  });

  it("REDO replays undone action", () => {
    let state = makeState();
    let history = { past: [], future: [] };

    state = undoReducer(
      baseReducer,
      history,
      state,
      { type: "LOAD_OK", geometry: makeGeom(), tris: 12 }
    ).state;
    state = undoReducer(
      baseReducer,
      history,
      state,
      { type: "SET_SELECTION", faces: new Set([5]) }
    ).state;
    history = {
      past: [extractSlice(makeState())],
      future: [],
    };

    const afterUndo = undoReducer(
      baseReducer,
      history,
      state,
      { type: "UNDO" }
    );
    state = afterUndo.state;
    history = afterUndo.history;
    expect(state.selectedFaces.size).toBe(0);

    const afterRedo = undoReducer(
      baseReducer,
      history,
      state,
      { type: "REDO" }
    );
    state = afterRedo.state;
    history = afterRedo.history;
    expect(state.selectedFaces.size).toBe(1);
    expect(state.selectedFaces.has(5)).toBe(true);
  });

  it("doing a new action after UNDO clears the future stack", () => {
    let state = makeState();
    let history = { past: [], future: [] };

    let r = undoReducer(baseReducer, history, state, { type: "LOAD_OK", geometry: makeGeom(), tris: 12 });
    state = r.state; history = r.history;
    r = undoReducer(baseReducer, history, state, { type: "SET_SELECTION", faces: new Set([1]) });
    state = r.state; history = r.history;
    r = undoReducer(baseReducer, history, state, { type: "SET_SELECTION", faces: new Set([2]) });
    state = r.state; history = r.history;
    expect(state.selectedFaces.has(2)).toBe(true);

    const afterUndo = undoReducer(baseReducer, history, state, { type: "UNDO" });
    state = afterUndo.state;
    history = afterUndo.history;
    expect(state.selectedFaces.has(2)).toBe(false);
    expect(history.future.length).toBe(1);

    const afterNew = undoReducer(baseReducer, history, state, { type: "CLEAR_SELECTION" });
    state = afterNew.state;
    history = afterNew.history;
    expect(history.future.length).toBe(0);
  });

  it("UNDO on empty history is a no-op", () => {
    const state = makeState();
    const history = { past: [], future: [] };
    const r = undoReducer(
      baseReducer,
      history,
      state,
      { type: "UNDO" }
    );
    expect(r.state).toBe(state);
    expect(r.history).toBe(history);
  });
});

function extractSlice(state: MeshEditorState) {
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
