import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { useVectorEditor } from "@/hooks/useVectorEditor";
import { useCookieCutter } from "@/hooks/useCookieCutter";
import { useProjects } from "@/hooks/useProjects";
import { VectorCanvas } from "@/components/cookie-cutter/editor/VectorCanvas";
import { Toolbar2D } from "@/components/cookie-cutter/editor/Toolbar2D";
import { PieceTabs } from "@/components/cookie-cutter/editor/PieceTabs";
import { ShapeLibrary } from "@/components/cookie-cutter/editor/ShapeLibrary";
import { LayerPanel } from "@/components/cookie-cutter/editor/LayerPanel";
import { HistoryPanel } from "@/components/cookie-cutter/editor/HistoryPanel";
import { TextInputDialog } from "@/components/cookie-cutter/editor/TextInputDialog";
import { FixReportDialog } from "@/components/cookie-cutter/editor/FixReportDialog";
import { Preview3D } from "@/components/cookie-cutter/cutter/Preview3D";
import { ParameterPanel } from "@/components/cookie-cutter/cutter/ParameterPanel";
import { ExportPanel } from "@/components/cookie-cutter/cutter/ExportPanel";
import { ProjectList } from "@/components/cookie-cutter/projects/ProjectList";
import { ProjectHeader } from "@/components/cookie-cutter/projects/ProjectHeader";
import { VersionHistory } from "@/components/cookie-cutter/projects/VersionHistory";
import type { Project, ProjectVersion } from "@/lib/projectStorage";
import type { VectorScene } from "@/lib/cookie-cutter/svgTypes";
import {
  Upload,
  Download,
  Trash2,
  Type,
  Grid3x3,
  Box,
} from "lucide-react";

export default function CookieCutter() {
  const editor = useVectorEditor();
  const cutter = useCookieCutter();
  const projects = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"gallery" | "editor">("gallery");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  const {
    scene,
    activePiece,
    importSvgFile,
    exportSvg,
    reset,
    setScene,
    setShowTextDialog,
    showTextDialog,
    showFixDialog,
  } = editor;

  const {
    params,
    results,
    generating,
    wireframe,
    showDimensions,
    setParams,
    setWireframe,
    setShowDimensions,
    regenerate,
    getActiveResult,
    getAggregateEstimate,
  } = cutter;

  const totalPieces = scene.pieces.length;
  const totalShapes = scene.pieces.reduce((acc, p) => acc + p.shapes.length, 0);
  const activeShapes = activePiece?.shapes.length ?? 0;
  const hasShapes = totalShapes > 0;

  useEffect(() => {
    regenerate(scene.pieces, params);
  }, [scene.pieces, params, regenerate]);

  const activeResult = useMemo(
    () => getActiveResult(scene.activePieceId),
    [getActiveResult, scene.activePieceId]
  );

  const aggregateEstimate = useMemo(
    () => getAggregateEstimate(),
    [getAggregateEstimate]
  );

  const allResults = useMemo(
    () =>
      scene.pieces
        .map((p) => results.get(p.id))
        .filter((r): r is NonNullable<typeof r> => r != null),
    [results, scene.pieces]
  );

  const allPieceNames = useMemo(
    () => scene.pieces.map((p) => p.name),
    [scene.pieces]
  );

  const pieceIds = useMemo(() => scene.pieces.map((p) => p.id), [scene.pieces]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await importSvgFile(file);
      } catch {
        console.error("Failed to import SVG");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [importSvgFile]
  );

  const handleExportSvg = useCallback(() => {
    exportSvg();
  }, [exportSvg]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleCreateProject = useCallback(async () => {
    const name = `Projeto ${new Date().toLocaleDateString("pt-BR")}`;
    const meta = await projects.create(name);
    if (meta) {
      const proj: Project = {
        id: meta.id,
        name: meta.name,
        favorite: false,
        currentVersion: 0,
        scene,
        params,
        printProfile: params.printProfile,
        versions: [],
      };
      setCurrentProject(proj);
      setView("editor");
    }
  }, [projects, scene, params]);

  const handleOpenProject = useCallback(
    async (id: string) => {
      const proj = await projects.load(id);
      if (proj) {
        setCurrentProject(proj);
        setScene(proj.scene);
        setParams(proj.params);
        setView("editor");
      }
    },
    [projects, setScene, setParams]
  );

  const handleSaveProject = useCallback(async () => {
    if (!currentProject) return;
    const project: Project = {
      ...currentProject,
      scene,
      params,
      currentVersion: (currentProject.currentVersion || 0) + 1,
    };
    const ok = await projects.save(project);
    if (ok) {
      const v = (currentProject.currentVersion || 0) + 1;
      setCurrentProject((p) => (p ? { ...p, currentVersion: v } : p));
    }
  }, [currentProject, scene, params, projects]);

  const handleRenameProject = useCallback(
    (name: string) => {
      setCurrentProject((p) => (p ? { ...p, name } : p));
    },
    []
  );

  const handleBackToGallery = useCallback(() => {
    setView("gallery");
    setCurrentProject(null);
    projects.refresh();
  }, [projects]);

  const handleNewProject = useCallback(() => {
    setCurrentProject(null);
    reset();
    setView("editor");
  }, [reset]);

  const handleLoadVersion = useCallback(
    (version: ProjectVersion) => {
      setScene(version.scene as VectorScene);
      setParams(version.params);
    },
    [setScene, setParams]
  );

  const handleDeleteProject = useCallback(async () => {
    if (!currentProject) return;
    if (confirm("Excluir este projeto e todas as versões?")) {
      await projects.remove(currentProject.id);
      setCurrentProject(null);
      setView("gallery");
    }
  }, [currentProject, projects]);

  const handleDuplicateProject = useCallback(async () => {
    if (!currentProject) return;
    await projects.duplicate(currentProject.id);
    projects.refresh();
  }, [currentProject, projects]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentProject) return;
    const newFav = !currentProject.favorite;
    setCurrentProject((p) => (p ? { ...p, favorite: newFav } : p));
    await projects.toggleFavorite(currentProject.id, newFav);
  }, [currentProject, projects]);

  if (view === "gallery") {
    return (
      <div className="flex flex-col h-full overflow-hidden text-white">
        <header className="px-6 py-4 border-b border-[#222] shrink-0 bg-[#080808]">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-bold mb-1">
            VÉRTICE STUDIO TOOLS / v0.7.0
          </p>
          <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">
            Cookie Cutter Maker
          </h1>
        </header>
        <div className="flex-1 overflow-hidden">
          <ProjectList
            projects={projects.state.list}
            onOpen={handleOpenProject}
            onCreate={handleCreateProject}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      <ProjectHeader
        name={currentProject?.name || "Sem título"}
        currentVersion={currentProject?.currentVersion || 0}
        favorite={currentProject?.favorite || false}
        hasProject={currentProject !== null}
        onSave={handleSaveProject}
        onDuplicate={handleDuplicateProject}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteProject}
        onVersions={() => setShowVersions(true)}
        onBack={handleBackToGallery}
        onNew={handleNewProject}
        onRename={handleRenameProject}
        saving={projects.state.saving}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] overflow-hidden">
        <div className="relative flex flex-col h-full min-h-0 bg-[#080808] border-r border-[#222]">
          <PieceTabs editor={editor} />

          <div className="flex-1 relative min-h-0">
            <VectorCanvas />
            <Toolbar2D editor={editor} />

            <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
              <div className="bg-[#0A0A0A]/70 border border-[#222] px-2 py-1 backdrop-blur-sm text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                V select &middot; H pan &middot; T text &middot; Del delete
              </div>
            </div>
          </div>

          <div className="border-t border-[#222] p-3 space-y-2 bg-[#0A0A0A]">
            <div className="flex items-center gap-2">
              <ShapeLibrary editor={editor} />
              <button
                type="button"
                onClick={() => setShowTextDialog(true)}
                className="shrink-0 flex items-center justify-center gap-1 px-2 py-1.5 border border-[#333] text-white/50 font-mono text-[10px] uppercase tracking-widest hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
              >
                <Type className="w-3 h-3" />
                Texto
              </button>
            </div>

            <div className="flex gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleImportClick}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-[#333] text-white/40 font-mono text-[9px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Importar
              </button>
              <button
                type="button"
                onClick={handleExportSvg}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-[#333] text-white/40 font-mono text-[9px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors"
              >
                <Download className="w-3 h-3" />
                SVG
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-[#333] text-white/40 font-mono text-[9px] uppercase tracking-widest hover:text-red-400 hover:border-red-400/40 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Limpar
              </button>
            </div>
          </div>
        </div>

        <div className="relative bg-[#050505] flex flex-col min-h-0">
          {generating && (
            <div className="absolute top-2 right-2 z-10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF] animate-pulse">
                Gerando...
              </span>
            </div>
          )}
          <Preview3D
            results={results}
            pieceIds={pieceIds}
            wireframe={wireframe}
            showDimensions={showDimensions}
            activePieceId={scene.activePieceId}
          />
          <div className="absolute bottom-2 right-2 z-10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setWireframe(!wireframe)}
                className={`px-2 py-1 font-mono text-[9px] uppercase tracking-widest border transition-colors ${wireframe ? "bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40" : "text-white/40 border-[#333] hover:text-white/70"}`}
              >
                <Grid3x3 className="w-3 h-3 inline mr-1" />
                Wireframe
              </button>
              <button
                type="button"
                onClick={() => setShowDimensions(!showDimensions)}
                className={`px-2 py-1 font-mono text-[9px] uppercase tracking-widest border transition-colors ${showDimensions ? "bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40" : "text-white/40 border-[#333] hover:text-white/70"}`}
              >
                <Box className="w-3 h-3 inline mr-1" />
                Dims
              </button>
            </div>
          </div>
        </div>

        <aside className="bg-[#0A0A0A] border-l border-[#222] p-4 flex flex-col gap-4 overflow-y-auto">
          <section>
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
              01. Camadas
            </h3>
            <LayerPanel editor={editor} />
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
              02. Histórico
            </h3>
            <HistoryPanel editor={editor} />
          </section>

          <div className="border-t border-[#222]" />

          <ParameterPanel
            params={params}
            onParamsChange={setParams}
            profile={null}
            estimate={aggregateEstimate}
            piece={activePiece}
          />

          <div className="border-t border-[#222]" />

          <ExportPanel
            activeResult={activeResult}
            activePiece={activePiece || null}
            allResults={allResults}
            allPieceNames={allPieceNames}
            cutterParams={params}
          />
        </aside>
      </div>

      {showTextDialog && (
        <TextInputDialog
          open={showTextDialog}
          onClose={() => setShowTextDialog(false)}
          onAdd={(shape) => {
            editor.addShapeToActive(shape);
            setShowTextDialog(false);
          }}
        />
      )}

      {showFixDialog && <FixReportDialog editor={editor} />}

      {showVersions && currentProject && (
        <VersionHistory
          open={showVersions}
          projectId={currentProject.id}
          currentVersion={currentProject.currentVersion || 0}
          onClose={() => setShowVersions(false)}
          onLoadVersion={handleLoadVersion}
        />
      )}

      <footer className="h-10 border-t border-[#222] px-4 flex items-center justify-between bg-[#0A0A0A] shrink-0">
        <div className="flex gap-4 items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span>
            Status:{" "}
            <span className={hasShapes ? "text-[#00FF41]" : "text-zinc-500"}>
              {hasShapes ? "Pronto" : "Idle"}
            </span>
          </span>
          {generating && (
            <span className="text-[#00E5FF] animate-pulse">
              Atualizando preview...
            </span>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
          {activeShapes} paths &middot; {aggregateEstimate.weightG.toFixed(0)}g &middot; R${aggregateEstimate.costBRL.toFixed(2)}
        </div>
      </footer>
    </div>
  );
}
