export interface Shape2D {
  id: string;
  kind: "path" | "text" | "icon";
  d: string;
  transform: ShapeTransform;
  rawTransform?: string;
  fill: "evenodd" | "nonzero";
  metadata: ShapeMetadata;
  visible: boolean;
}

export interface ShapeTransform {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  rotation: number;
  mirrorX: boolean;
  mirrorY: boolean;
}

export interface ShapeMetadata {
  name?: string;
  fontFamily?: string;
  iconSource?: string;
  text?: string;
  fontSize?: number;
}

export interface VectorPiece {
  id: string;
  name: string;
  shapes: Shape2D[];
  embosseShapes: Shape2D[];
  embosseMode: "emboss" | "deboss";
  embosseDepth: number;
}

export interface VectorScene {
  pieces: VectorPiece[];
  activePieceId: string;
  view: VectorView;
  grid: VectorGrid;
}

export interface VectorView {
  panX: number;
  panY: number;
  zoom: number;
}

export interface VectorGrid {
  enabled: boolean;
  size: number;
  snap: boolean;
  snapTolerance: number;
}

export interface FixReport {
  openPaths: number;
  selfIntersections: number;
  duplicatePoints: number;
  windingFixed: number;
  totalFixes: number;
  fixedScene: VectorScene;
  items: FixItem[];
}

export type EditorMode = "select" | "draw" | "text" | "pan" | "zoom" | "pen";

export interface FixItem {
  type: "openPath" | "selfIntersection" | "duplicatePoint" | "winding";
  count: number;
  description: string;
  enabled: boolean;
}
