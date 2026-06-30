import type { PrintEstimate } from "./cookie-cutter/cutterParams";
import type { VectorScene } from "./cookie-cutter/svgTypes";
import type { CutterParams } from "./cookie-cutter/cutterParams";

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
  currentVersion: number;
  versionCount: number;
  thumbnail64: string;
  pieceCount: number;
  totalTriangles: number;
  estimate: PrintEstimate;
}

export interface Project {
  id: string;
  name: string;
  favorite: boolean;
  currentVersion: number;
  scene: VectorScene;
  params: CutterParams;
  printProfile: string;
  versions: ProjectVersionMeta[];
}

export interface ProjectVersionMeta {
  version: number;
  createdAt: number;
  thumbnail64: string;
}

export interface ProjectVersion {
  version: number;
  createdAt: number;
  params: CutterParams;
  scene: VectorScene;
  thumbnail256: string;
}
