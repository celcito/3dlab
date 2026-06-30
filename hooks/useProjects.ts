import { useState, useCallback, useEffect } from "react";
import type { ProjectMeta, Project, ProjectVersionMeta, ProjectVersion } from "@/lib/projectStorage";
import * as api from "@/lib/projects";

export interface ProjectsState {
  list: ProjectMeta[];
  current: Project | null;
  loading: boolean;
  saving: boolean;
}

export function useProjects() {
  const [state, setState] = useState<ProjectsState>({
    list: [],
    current: null,
    loading: false,
    saving: false,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const list = await api.listProjects();
      setState((s) => ({ ...s, list, loading: false }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const create = useCallback(async (name: string): Promise<ProjectMeta | null> => {
    try {
      const meta = await api.createProject(name);
      setState((s) => ({ ...s, list: [meta, ...s.list] }));
      return meta;
    } catch {
      return null;
    }
  }, []);

  const save = useCallback(async (project: Project): Promise<boolean> => {
    setState((s) => ({ ...s, saving: true }));
    try {
      await api.saveVersion(project.id, {
        params: project.params,
        scene: project.scene,
        thumbnail256: "",
        thumbnail64: "",
      });
      setState((s) => ({ ...s, saving: false }));
      return true;
    } catch {
      setState((s) => ({ ...s, saving: false }));
      return false;
    }
  }, []);

  const load = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const project = await api.getProject(id);
      setState((s) => ({ ...s, current: project }));
      return project;
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    await api.deleteProject(id);
    setState((s) => ({
      ...s,
      list: s.list.filter((p) => p.id !== id),
      current: s.current?.id === id ? null : s.current,
    }));
  }, []);

  const duplicate = useCallback(
    async (id: string): Promise<ProjectMeta | null> => {
      try {
        const meta = await api.duplicateProject(id);
        setState((s) => ({ ...s, list: [meta, ...s.list] }));
        return meta;
      } catch {
        return null;
      }
    },
    []
  );

  const toggleFavorite = useCallback(async (id: string, favorite: boolean): Promise<void> => {
    try {
      await api.updateProject(id, { favorite });
      setState((s) => ({
        ...s,
        list: s.list.map((p) => (p.id === id ? { ...p, favorite } : p)),
      }));
    } catch {}
  }, []);

  const goToVersion = useCallback(async (_id: string, _n: number): Promise<ProjectVersion | null> => {
    try {
      return await api.getVersion(_id, _n);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    state,
    refresh,
    create,
    save,
    load,
    remove,
    duplicate,
    toggleFavorite,
    goToVersion,
  };
}
