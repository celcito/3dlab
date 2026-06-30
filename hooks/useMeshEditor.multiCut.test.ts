import { describe, it, expect } from "vitest";
import {
  undoReducer,
  MeshEditorState,
  PieceData,
  EditorMode,
} from "./useMeshEditor";
import { Quality } from "@/lib/decimate";

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
        source: { kind: "demo" },
        sourceLabel: "test.stl",
      };
    case "SET_SELECTION":
      return { ...state, selectedFaces: new Set(action.faces) };
    case "CUT_OK":
      return {
        ...state,
        isCutting: false,
        pieces: action.pieces,
        currentGeometry: action.newGeom,
        triangleCount: action.newTris,
        selectedFaces: new Set(),
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
      };
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
    case "RESET":
      return {
        ...state,
        originalGeometry: null,
        currentGeometry: null,
        triangleCount: 0,
        selectedFaces: new Set(),
        pieces: [],
      };
    default:
      return state;
  }
}

function makeState(): MeshEditorState {
  return {
    source: { kind: "demo" },
    sourceLabel: "test.stl",
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

function makePiece(id: string, name: string, color = "#00E5FF"): PieceData {
  return {
    id,
    name,
    mesh: { geometry: {} } as any,
    triangleCount: 100,
    visible: true,
    color,
  };
}

function makeCut(pieces: PieceData[]): Action {
  return { type: "CUT_OK", pieces, newGeom: null, newTris: 0 };
}

describe("multi-cut flow", () => {
  it("first cut produces 2 pieces, both in horizontal row", () => {
    let state = makeState();
    let history = { past: [], future: [] };

    const r1 = undoReducer(
      baseReducer,
      history,
      state,
      { type: "LOAD_OK", geometry: {} as any, tris: 100 }
    );
    state = r1.state;
    history = r1.history;

    const pieceA = makePiece("Part_A_1", "Part_A_1", "#00E5FF");
    const pieceB = makePiece("Part_B_1", "Part_B_1", "#FF7A00");

    const r2 = undoReducer(
      baseReducer,
      history,
      state,
      makeCut([pieceA, pieceB])
    );
    state = r2.state;

    expect(state.pieces.length).toBe(2);
    expect(state.currentGeometry).toBeNull();
  });

  it("EDIT_PIECE moves piece back to currentGeometry and removes from pieces", () => {
    let state = makeState();
    let history = { past: [], future: [] };

    let r = undoReducer(
      baseReducer,
      history,
      state,
      { type: "LOAD_OK", geometry: {} as any, tris: 100 }
    );
    state = r.state;
    history = r.history;

    const pieceA = makePiece("Part_A_1", "Part_A_1", "#00E5FF");
    const pieceB = makePiece("Part_B_1", "Part_B_1", "#FF7A00");

    r = undoReducer(baseReducer, history, state, makeCut([pieceA, pieceB]));
    state = r.state;
    history = r.history;
    expect(state.pieces.length).toBe(2);

    r = undoReducer(baseReducer, history, state, {
      type: "EDIT_PIECE",
      id: "Part_A_1",
      geometry: { attributes: { position: { count: 50 } } } as any,
      tris: 50,
    });
    state = r.state;
    expect(state.currentGeometry).toBeTruthy();
    expect(state.triangleCount).toBe(50);
    expect(state.pieces.length).toBe(1);
    expect(state.pieces[0].id).toBe("Part_B_1");
  });

  it("after edit + second cut, total pieces = 3", () => {
    let state = makeState();
    let history = { past: [], future: [] };

    let r = undoReducer(
      baseReducer,
      history,
      state,
      { type: "LOAD_OK", geometry: {} as any, tris: 100 }
    );
    state = r.state;
    history = r.history;

    const pieceA = makePiece("Part_A_1", "Part_A_1", "#00E5FF");
    const pieceB = makePiece("Part_B_1", "Part_B_1", "#FF7A00");
    r = undoReducer(baseReducer, history, state, makeCut([pieceA, pieceB]));
    state = r.state;
    history = r.history;

    r = undoReducer(baseReducer, history, state, {
      type: "EDIT_PIECE",
      id: "Part_A_1",
      geometry: { attributes: { position: { count: 50 } } } as any,
      tris: 50,
    });
    state = r.state;
    history = r.history;

    const newA1 = makePiece("Part_A_1", "Part_A_1", "#00E5FF");
    const newA2 = makePiece("Part_A_2", "Part_A_2", "#FF7A00");

    r = undoReducer(
      baseReducer,
      history,
      state,
      makeCut([pieceB, newA1, newA2])
    );
    state = r.state;

    expect(state.pieces.length).toBe(3);
    expect(state.currentGeometry).toBeNull();
  });

  it("undo of EDIT_PIECE restores the piece", () => {
    let state = makeState();
    let history = { past: [], future: [] };

    let r = undoReducer(
      baseReducer,
      history,
      state,
      { type: "LOAD_OK", geometry: {} as any, tris: 100 }
    );
    state = r.state;
    history = r.history;

    const pieceA = makePiece("Part_A_1", "Part_A_1", "#00E5FF");
    const pieceB = makePiece("Part_B_1", "Part_B_1", "#FF7A00");
    r = undoReducer(baseReducer, history, state, makeCut([pieceA, pieceB]));
    state = r.state;
    history = r.history;

    r = undoReducer(baseReducer, history, state, {
      type: "EDIT_PIECE",
      id: "Part_A_1",
      geometry: {} as any,
      tris: 50,
    });
    state = r.state;
    history = r.history;
    expect(state.pieces.length).toBe(1);

    r = undoReducer(baseReducer, history, state, { type: "UNDO" });
    state = r.state;
    expect(state.pieces.length).toBe(2);
    expect(state.pieces.map((p) => p.id)).toContain("Part_A_1");
    expect(state.pieces.map((p) => p.id)).toContain("Part_B_1");
  });

  it("PIECE_REMOVE deletes a piece (UI only, not undoable in CUT context)", () => {
    let state = makeState();
    state.pieces = [makePiece("p1", "p1"), makePiece("p2", "p2")];
    state = baseReducer(state, { type: "PIECE_REMOVE", id: "p1" });
    expect(state.pieces.length).toBe(1);
    expect(state.pieces[0].id).toBe("p2");
  });
});
