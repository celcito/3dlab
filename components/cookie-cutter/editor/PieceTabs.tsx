import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVectorEditor } from "@/hooks/useVectorEditor";

interface PieceTabsProps {
  editor: ReturnType<typeof useVectorEditor>;
}

interface ContextMenuState {
  pieceId: string;
  x: number;
  y: number;
}

export function PieceTabs({ editor }: PieceTabsProps) {
  const {
    scene,
    setActivePiece,
    addPiece,
    removePiece,
    renamePiece,
  } = editor;

  const pieces = scene.pieces;
  const activePieceId = scene.activePieceId;
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, pieceId: string) => {
      e.preventDefault();
      setContextMenu({ pieceId, x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleRenameStart = useCallback((pieceId: string) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (piece) {
      setRenameValue(piece.name);
      setRenaming(pieceId);
      setContextMenu(null);
    }
  }, [pieces]);

  const handleRenameConfirm = useCallback(() => {
    if (renaming && renameValue.trim()) {
      renamePiece(renaming, renameValue.trim());
    }
    setRenaming(null);
  }, [renaming, renameValue, renamePiece]);

  const handleRemove = useCallback(
    (pieceId: string) => {
      removePiece(pieceId);
      setContextMenu(null);
    },
    [removePiece]
  );

  const maxTabWidth = 120;
  const hasMultiple = pieces.length > 1;

  if (!hasMultiple) {
    const single = pieces[0];
    return (
      <div className="flex items-center h-9 px-4 gap-2 bg-[#0A0A0A] border-b border-[#222]">
        <span className="font-black text-xs uppercase tracking-widest text-[#00E5FF] truncate max-w-[200px]">
          {single?.name ?? "Peça"}
        </span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => addPiece()}
            className="flex items-center gap-1 px-2 py-1 text-white/50 hover:text-[#00E5FF] transition-colors"
            title="Nova peça"
          >
            <Plus className="w-3 h-3" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Nova peça</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end h-9 bg-[#0A0A0A] border-b border-[#222] relative overflow-x-auto">
      <div className="flex items-end h-full min-w-0">
        {pieces.map((piece) => {
          const isActive = piece.id === activePieceId;
          const isRenaming = renaming === piece.id;

          return (
            <div
              key={piece.id}
              className={cn(
                "relative flex-shrink-0 max-w-[120px] group",
                isActive ? "z-10" : "z-0"
              )}
            >
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameConfirm}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameConfirm();
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="block h-full w-[120px] px-3 bg-[#080808] border-0 border-b-2 border-[#00E5FF] text-white font-mono text-[10px] uppercase tracking-widest outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActivePiece(piece.id)}
                  onContextMenu={(e) => handleContextMenu(e, piece.id)}
                  className={cn(
                    "block h-full px-3 text-left border-b-2 transition-colors truncate font-black text-[10px] uppercase tracking-widest w-[120px]",
                    isActive
                      ? "text-[#00E5FF] border-[#00E5FF]"
                      : "text-white/50 border-[#333] hover:text-white/80 hover:border-white/40"
                  )}
                  title={piece.name}
                >
                  {piece.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => addPiece()}
        className="flex-shrink-0 h-full px-2 flex items-center text-white/40 hover:text-[#00E5FF] transition-colors"
        title="Nova peça"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {contextMenu && (
        <div
          className="fixed z-50 bg-[#0A0A0A] border border-[#333] py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => handleRenameStart(contextMenu.pieceId)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/5 font-mono text-[10px] uppercase tracking-widest"
          >
            <Pencil className="w-3 h-3" />
            Renomear
          </button>
          <button
            type="button"
            onClick={() => handleRemove(contextMenu.pieceId)}
            disabled={pieces.length <= 1}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest",
              pieces.length <= 1
                ? "text-white/20 cursor-not-allowed"
                : "text-red-400 hover:text-red-300 hover:bg-red-400/5"
            )}
          >
            <Trash2 className="w-3 h-3" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
