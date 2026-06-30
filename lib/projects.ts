import type { ProjectMeta, Project, ProjectVersionMeta, ProjectVersion } from "./projectStorage";

const BASE = "/api/projects";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listProjects(): Promise<ProjectMeta[]> {
  return request<ProjectMeta[]>(BASE);
}

export async function getProject(id: string): Promise<Project> {
  return request<Project>(`${BASE}/${encodeURIComponent(id)}`);
}

export async function createProject(name: string): Promise<ProjectMeta> {
  return request<ProjectMeta>(BASE, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateProject(
  id: string,
  data: Partial<Pick<ProjectMeta, "name" | "favorite">>
): Promise<ProjectMeta> {
  return request<ProjectMeta>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function duplicateProject(id: string): Promise<ProjectMeta> {
  return request<ProjectMeta>(`${BASE}/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
}

export async function saveVersion(
  id: string,
  version: { params: unknown; scene: unknown; thumbnail256: string; thumbnail64: string }
): Promise<ProjectVersionMeta> {
  return request<ProjectVersionMeta>(`${BASE}/${encodeURIComponent(id)}/versions`, {
    method: "POST",
    body: JSON.stringify(version),
  });
}

export async function listVersions(id: string): Promise<ProjectVersionMeta[]> {
  return request<ProjectVersionMeta[]>(
    `${BASE}/${encodeURIComponent(id)}/versions`
  );
}

export async function getVersion(
  id: string,
  n: number
): Promise<ProjectVersion> {
  return request<ProjectVersion>(
    `${BASE}/${encodeURIComponent(id)}/versions/${n}`
  );
}

export function getThumbnailUrl(id: string): string {
  return `${BASE}/${encodeURIComponent(id)}/thumbnail`;
}
