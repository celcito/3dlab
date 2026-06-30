import { useEffect } from "react";
import { useMeshEditor, EditorMode } from "@/hooks/useMeshEditor";

interface ShortcutHandlers {
  setMode: (m: EditorMode) => void;
  fillSelection: () => void;
  clearSelection: () => void;
  performCut: () => void;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const editor = useMeshEditor();
  const hasGeometry = !!editor.state.currentGeometry;
  const hasSelection = editor.state.selectedFaces.size > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      if (ctrlOrMeta && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          handlers.undo();
          return;
        }
        if ((key === "z" && e.shiftKey) || key === "y") {
          e.preventDefault();
          handlers.redo();
          return;
        }
      }

      if (ctrlOrMeta || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === "v") {
        handlers.setMode("view");
        e.preventDefault();
        return;
      }
      if (!hasGeometry) return;

      if (key === "m") {
        handlers.setMode("manual");
        e.preventDefault();
      } else if (key === "s") {
        handlers.setMode("smart");
        e.preventDefault();
      } else if (key === "e") {
        handlers.setMode("erase");
        e.preventDefault();
      } else if (key === "escape") {
        handlers.clearSelection();
        handlers.setMode("view");
        e.preventDefault();
      } else if (key === "f") {
        if (hasSelection) {
          handlers.fillSelection();
          e.preventDefault();
        }
      } else if (key === "c" || key === "enter") {
        if (hasSelection) {
          handlers.performCut();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers, hasGeometry, hasSelection]);
}
