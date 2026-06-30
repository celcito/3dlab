import type { ProjectMeta } from "@/lib/projectStorage";

interface ProjectListProps {
  projects: ProjectMeta[];
  onOpen: (id: string) => void;
  onCreate: () => void;
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: ProjectMeta;
  onOpen: (id: string) => void;
}) {
  const date = new Date(project.updatedAt).toLocaleDateString("pt-BR");

  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#222] hover:border-[#00E5FF]/40 transition-colors text-left w-full"
    >
      <div className="w-10 h-10 shrink-0 bg-[#111] border border-[#333] flex items-center justify-center overflow-hidden">
        {project.thumbnail64 ? (
          <img
            src={project.thumbnail64}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-mono text-[8px] text-zinc-600">3D</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-[10px] uppercase tracking-widest text-white truncate">
          {project.name}
        </div>
        <div className="font-mono text-[9px] text-white/40 mt-0.5">
          {project.pieceCount} peças &middot; {project.totalTriangles.toLocaleString()} tri
        </div>
        <div className="font-mono text-[9px] text-[#00E5FF]/60">
          v{project.currentVersion} &middot; {date}
        </div>
      </div>
      {project.favorite && (
        <span className="text-[#00E5FF] text-xs shrink-0">&#9733;</span>
      )}
    </button>
  );
}

export function ProjectList({ projects, onOpen, onCreate }: ProjectListProps) {
  const sorted = [...projects].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="flex flex-col h-full text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-white">
            Meus projetos
          </h2>
          <p className="font-mono text-[10px] text-white/40 mt-0.5">
            {projects.length} projeto{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="px-3 py-1.5 bg-[#00E5FF] text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#00E5FF]/80 transition-colors"
        >
          Novo projeto
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest">
            Nenhum projeto salvo ainda
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-3 px-4 py-2 border border-[#333] text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
          >
            Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {sorted.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
