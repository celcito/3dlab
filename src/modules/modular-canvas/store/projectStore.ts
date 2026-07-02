import { create } from 'zustand';
import { Font } from 'opentype.js';

export interface DesignElement {
  id: string;
  type: 'shape' | 'path' | 'text';
  pathData: string;
  extrusion: {
    height: number;
    plate: 1 | 2;
  };
  transform: { x: number; y: number; rotation: number; scale: number };
  color: string;
  text?: string;
}

export interface ProjectState {
  elements: DesignElement[];
  past: DesignElement[][];
  future: DesignElement[][];
  activeElementId: string | null;
  loadedFont: Font | null;
  addElement: (el: Omit<DesignElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  removeElement: (id: string) => void;
  undo: () => void;
  redo: () => void;
  setActiveElement: (id: string | null) => void;
  setLoadedFont: (font: Font | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  elements: [],
  past: [],
  future: [],
  activeElementId: null,
  loadedFont: null,
  addElement: (el) => set((state) => ({
    past: [...state.past, state.elements],
    elements: [...state.elements, { ...el, id: crypto.randomUUID() }],
    future: []
  })),
  updateElement: (id, updates) => set((state) => ({
    past: [...state.past, state.elements],
    elements: state.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    future: []
  })),
  removeElement: (id) => set((state) => ({
    past: [...state.past, state.elements],
    elements: state.elements.filter(el => el.id !== id),
    future: [],
    activeElementId: state.activeElementId === id ? null : state.activeElementId
  })),
  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    return {
      elements: previous,
      past: newPast,
      future: [state.elements, ...state.future],
    };
  }),
  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      elements: next,
      past: [...state.past, state.elements],
      future: newFuture,
    };
  }),
  setActiveElement: (id) => set({ activeElementId: id }),
  setLoadedFont: (font) => set({ loadedFont: font })
}));
