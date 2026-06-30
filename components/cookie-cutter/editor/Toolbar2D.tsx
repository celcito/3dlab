import { useEffect, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import {
  MousePointer2,
  Hand,
  ZoomIn,
  Pen,
  Type,
  Move,
  Maximize2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Undo,
  Redo,
  Grid3x3,
  Magnet,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVectorEditor } from "@/hooks/useVectorEditor";

interface Toolbar2DProps {
  editor: ReturnType<typeof useVectorEditor>;
}

interface ToolButton {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
  dividerAfter?: boolean;
}

export function Toolbar2D({ editor }: Toolbar2DProps) {
  const {
    mode,
    setMode,
    scene,
    selection,
    activePiece,
    undo,
    redo,
    addPiece,
    reset,
    toggleGrid,
    toggleSnap,
    setShowTextDialog,
    setShowShapeLibrary,
    undoRedo,
  } = editor;

  const hasSelection = selection.size > 0;
  const hasShapes = (activePiece?.shapes.length ?? 0) > 0;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "v":
          e.preventDefault();
          setMode("select");
          break;
        case "h":
          e.preventDefault();
          setMode("pan");
          break;
        case "d":
          e.preventDefault();
          setMode("draw");
          break;
        case "t":
          e.preventDefault();
          setShowTextDialog(true);
          break;
        case "g":
          e.preventDefault();
          toggleGrid();
          break;
        case "s":
          e.preventDefault();
          toggleSnap();
          break;
      }
    },
    [setMode, setShowTextDialog, toggleGrid, toggleSnap]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const buttons: ToolButton[] = [
    {
      icon: MousePointer2,
      label: "Select",
      shortcut: "V",
      action: () => setMode("select"),
      active: mode === "select",
    },
    {
      icon: Hand,
      label: "Pan",
      shortcut: "H",
      action: () => setMode("pan"),
      active: mode === "pan",
    },
    {
      icon: ZoomIn,
      label: "Zoom",
      shortcut: "",
      action: () => setMode("zoom"),
      active: mode === "zoom",
      dividerAfter: true,
    },
    {
      icon: Pen,
      label: "Draw",
      shortcut: "D",
      action: () => setMode("draw"),
      active: mode === "draw",
    },
    {
      icon: Type,
      label: "Text",
      shortcut: "T",
      action: () => setShowTextDialog(true),
    },
    { icon: Move, label: "Move", action: () => {}, disabled: !hasSelection, dividerAfter: true },
    { icon: Maximize2, label: "Scale", action: () => {}, disabled: !hasSelection },
    { icon: RotateCw, label: "Rotate", action: () => {}, disabled: !hasSelection },
    { icon: FlipHorizontal, label: "Mirror H", action: () => {}, disabled: !hasSelection },
    { icon: FlipVertical, label: "Mirror V", action: () => {}, disabled: !hasSelection, dividerAfter: true },
    {
      icon: Undo,
      label: "Undo",
      shortcut: "Ctrl+Z",
      action: () => undo(),
      disabled: !undoRedo.canUndo,
    },
    {
      icon: Redo,
      label: "Redo",
      shortcut: "Ctrl+Y",
      action: () => redo(),
      disabled: !undoRedo.canRedo,
      dividerAfter: true,
    },
    {
      icon: Grid3x3,
      label: "Grid",
      shortcut: "G",
      action: () => toggleGrid(),
      active: scene.grid.enabled,
    },
    {
      icon: Magnet,
      label: "Snap",
      shortcut: "S",
      action: () => toggleSnap(),
      active: scene.grid.snap,
      dividerAfter: true,
    },
    {
      icon: Plus,
      label: "Nova peça",
      shortcut: "",
      action: () => addPiece(),
    },
    { icon: Trash2, label: "Reset", action: () => reset(), dividerAfter: true },
  ];

  return (
    <div
      className="absolute top-2 left-2 z-30 flex gap-1 p-1.5 bg-[#0A0A0A]/90 border border-[#222] backdrop-blur-sm"
    >
      {buttons.map((btn, i) => {
        const Icon = btn.icon;
        const key = `${btn.label}-${i}`;

        return (
          <div key={key} className="relative group flex items-center">
            <button
              type="button"
              onClick={btn.action}
              disabled={btn.disabled}
              className={cn(
                "w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors",
                btn.active && "border border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]",
                btn.disabled && "opacity-30 cursor-not-allowed hover:text-white/70",
                !btn.active && !btn.disabled && "hover:bg-white/5"
              )}
              title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
            >
              <Icon className="w-4 h-4" />
            </button>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
              <span className="font-mono text-[10px] text-white/80 bg-[#0A0A0A] border border-[#333] px-1.5 py-0.5 whitespace-nowrap uppercase tracking-widest">
                {btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
              </span>
            </div>
            {btn.dividerAfter && (
              <div className="w-px h-4 bg-[#333] ml-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
