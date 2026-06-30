import { useState } from "react";
import { Save, Copy, Star, Trash2, History, ArrowLeft, Plus } from "lucide-react";

interface ProjectHeaderProps {
  name: string;
  currentVersion: number;
  favorite: boolean;
  hasProject: boolean;
  onSave: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onVersions: () => void;
  onBack: () => void;
  onNew: () => void;
  onRename: (name: string) => void;
  saving?: boolean;
}

export function ProjectHeader({
  name,
  currentVersion,
  favorite,
  hasProject,
  onSave,
  onDuplicate,
  onToggleFavorite,
  onDelete,
  onVersions,
  onBack,
  onNew,
  onRename,
  saving,
}: ProjectHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== name) {
      onRename(editName.trim());
    }
    setEditing(false);
  };

  if (!hasProject) {
    return (
      <div className="flex items-center gap-2 px-4 h-10 border-b border-[#222] bg-[#0A0A0A]">
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1 px-2 py-1 border border-[#333] text-white/50 font-mono text-[10px] uppercase tracking-widest hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Novo projeto
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-2 py-1 text-white/40 font-mono text-[10px] uppercase tracking-widest hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Galeria
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 h-10 border-b border-[#222] bg-[#0A0A0A]">
      <button
        type="button"
        onClick={onBack}
        className="text-white/40 hover:text-white transition-colors"
        title="Galeria"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>

      {editing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="bg-[#080808] border border-[#00E5FF] px-2 py-0.5 text-white font-black text-[10px] uppercase tracking-widest outline-none min-w-[120px]"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditName(name);
            setEditing(true);
          }}
          className="font-black text-[10px] uppercase tracking-widest text-white hover:text-[#00E5FF] transition-colors truncate max-w-[200px]"
        >
          {name}
        </button>
      )}

      <div className="flex-1" />

      <span className="font-mono text-[10px] text-white/30">
        v{currentVersion}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="p-1 text-white/50 hover:text-[#00E5FF] transition-colors disabled:opacity-30"
          title="Salvar"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1 text-white/50 hover:text-[#00E5FF] transition-colors"
          title="Duplicar"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`p-1 transition-colors ${favorite ? "text-[#00E5FF]" : "text-white/50 hover:text-[#00E5FF]"}`}
          title="Favoritar"
        >
          <Star className="w-3.5 h-3.5" fill={favorite ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={onVersions}
          className="p-1 text-white/50 hover:text-[#00E5FF] transition-colors"
          title="Versões"
        >
          <History className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-white/50 hover:text-red-400 transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
