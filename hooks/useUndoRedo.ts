import { useState, useCallback, useRef } from "react";

export interface UndoRedoState<T> {
  current: T;
  canUndo: boolean;
  canRedo: boolean;
  push: (snapshot: T) => void;
  undo: () => T | null;
  redo: () => T | null;
  stackSize: number;
  redoStackSize: number;
  clear: () => void;
}

export function useUndoRedo<T>(
  initialState: T,
  maxSize = 50
): UndoRedoState<T> {
  const undoStack = useRef<T[]>([initialState]);
  const redoStack = useRef<T[]>([]);
  const [current, setCurrent] = useState<T>(initialState);

  const push = useCallback(
    (snapshot: T) => {
      undoStack.current.push(snapshot);
      if (undoStack.current.length > maxSize + 1) {
        undoStack.current.shift();
      }
      redoStack.current = [];
      setCurrent(snapshot);
    },
    [maxSize]
  );

  const undo = useCallback((): T | null => {
    if (undoStack.current.length <= 1) return null;
    const currentState = undoStack.current.pop()!;
    redoStack.current.push(currentState);
    const prev = undoStack.current[undoStack.current.length - 1];
    setCurrent(prev);
    return prev;
  }, []);

  const redo = useCallback((): T | null => {
    if (redoStack.current.length === 0) return null;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    setCurrent(next);
    return next;
  }, []);

  const clear = useCallback(() => {
    undoStack.current = [current];
    redoStack.current = [];
  }, [current]);

  return {
    current,
    canUndo: undoStack.current.length > 1,
    canRedo: redoStack.current.length > 0,
    push,
    undo,
    redo,
    stackSize: undoStack.current.length - 1,
    redoStackSize: redoStack.current.length,
    clear,
  };
}
