import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { type Shape2D, type ShapeTransform } from "@/lib/cookie-cutter/svgTypes";
import { computeBoundingBox } from "./ShapeRenderer";

interface SelectionLayerProps {
  shapes: Shape2D[];
  onTransform: (shapeId: string, newTransform: Partial<ShapeTransform>) => void;
  panX: number;
  panY: number;
  zoom: number;
}

interface DragState {
  handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "rotate" | "body";
  startMouseX: number;
  startMouseY: number;
  startBbox: { x: number; y: number; w: number; h: number };
  startTransforms: Map<string, ShapeTransform>;
  shiftKey: boolean;
  altKey: boolean;
}

const HANDLE_SIZE = 8;
const ROTATE_OFFSET = 28;

function toScreen(
  svgX: number,
  svgY: number,
  panX: number,
  panY: number,
  zoom: number
) {
  return {
    x: (svgX - panX) * zoom,
    y: (svgY - panY) * zoom,
  };
}

function transformPoint(
  px: number,
  py: number,
  t: ShapeTransform
): { x: number; y: number } {
  let x = px * (t.mirrorX ? -t.sx : t.sx);
  let y = py * (t.mirrorY ? -t.sy : t.sy);

  if (t.rotation !== 0) {
    const rad = (t.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    x = rx;
    y = ry;
  }

  x += t.tx;
  y += t.ty;
  return { x, y };
}

function getShapeWorldBbox(
  shape: Shape2D
): { x: number; y: number; w: number; h: number } | null {
  const local = computeBoundingBox(shape.d);
  if (!local) return null;

  const corners = [
    { x: local.x, y: local.y },
    { x: local.x + local.w, y: local.y },
    { x: local.x + local.w, y: local.y + local.h },
    { x: local.x, y: local.y + local.h },
  ];

  const transformed = corners.map((c) =>
    transformPoint(c.x, c.y, shape.transform)
  );
  const xs = transformed.map((p) => p.x);
  const ys = transformed.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function getSelectionBbox(
  shapes: Shape2D[]
): { x: number; y: number; w: number; h: number } | null {
  if (shapes.length === 0) return null;
  let result: { x: number; y: number; w: number; h: number } | null = null;

  for (const shape of shapes) {
    const bbox = getShapeWorldBbox(shape);
    if (!bbox) continue;
    if (!result) {
      result = { ...bbox };
    } else {
      const nx = Math.min(result.x, bbox.x);
      const ny = Math.min(result.y, bbox.y);
      const nx2 = Math.max(result.x + result.w, bbox.x + bbox.w);
      const ny2 = Math.max(result.y + result.h, bbox.y + bbox.h);
      result = { x: nx, y: ny, w: nx2 - nx, h: ny2 - ny };
    }
  }
  return result;
}

export function SelectionLayer({
  shapes,
  onTransform,
  panX,
  panY,
  zoom,
}: SelectionLayerProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const bbox = useMemo(() => getSelectionBbox(shapes), [shapes]);

  const handleMouseDown =
    (handle: DragState["handle"]) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!bbox) return;

      const startTransforms = new Map<string, ShapeTransform>();
      for (const shape of shapes) {
        startTransforms.set(shape.id, { ...shape.transform });
      }

      setDragState({
        handle,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startBbox: { ...bbox },
        startTransforms,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });
    };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !bbox) return;

      const dx = (e.clientX - dragState.startMouseX) / zoom;
      const dy = (e.clientY - dragState.startMouseY) / zoom;
      const sb = dragState.startBbox;
      const cx = sb.x + sb.w / 2;
      const cy = sb.y + sb.h / 2;

      const minSize = 1;

      for (const shape of shapes) {
        const startT = dragState.startTransforms.get(shape.id);
        if (!startT) continue;
        const newT = { ...startT };

        if (
          dragState.handle === "nw" ||
          dragState.handle === "ne" ||
          dragState.handle === "sw" ||
          dragState.handle === "se"
        ) {
          let anchorX: number;
          let anchorY: number;
          let signX: number;
          let signY: number;

          if (dragState.handle === "nw") {
            anchorX = sb.x + sb.w;
            anchorY = sb.y + sb.h;
            signX = -1;
            signY = -1;
          } else if (dragState.handle === "ne") {
            anchorX = sb.x;
            anchorY = sb.y + sb.h;
            signX = 1;
            signY = -1;
          } else if (dragState.handle === "sw") {
            anchorX = sb.x + sb.w;
            anchorY = sb.y;
            signX = -1;
            signY = 1;
          } else {
            anchorX = sb.x;
            anchorY = sb.y;
            signX = 1;
            signY = 1;
          }

          let newW = sb.w + signX * dx;
          let newH = sb.h + signY * dy;

          if (dragState.shiftKey) {
            const ratio = sb.w / sb.h;
            const absDelta = Math.max(Math.abs(newW - sb.w), Math.abs(newH - sb.h));
            const sign = newW - sb.w >= 0 ? 1 : -1;
            newW = sb.w + sign * absDelta;
            newH = sb.h + sign * (absDelta / ratio);
          }

          newW = Math.max(minSize, newW);
          newH = Math.max(minSize, newH);

          const sfx = sb.w > 0 ? newW / sb.w : 1;
          const sfy = sb.h > 0 ? newH / sb.h : 1;

          if (dragState.altKey) {
            newT.sx = startT.sx * sfx;
            newT.sy = startT.sy * sfy;
            const scx = cx;
            const scy = cy;
            const originalCenterX = (startT.tx - scx) / sfx + scx;
            const originalCenterY = (startT.ty - scy) / sfy + scy;
            newT.tx = scx + (originalCenterX - scx) * sfx;
            newT.ty = scy + (originalCenterY - scy) * sfy;
          } else {
            newT.sx = startT.sx * sfx;
            newT.sy = startT.sy * sfy;
            const relX = startT.tx - anchorX;
            const relY = startT.ty - anchorY;
            newT.tx = anchorX + relX * sfx;
            newT.ty = anchorY + relY * sfy;
          }
        } else if (
          dragState.handle === "n" ||
          dragState.handle === "s" ||
          dragState.handle === "e" ||
          dragState.handle === "w"
        ) {
          let anchorX: number;
          let anchorY: number;
          let scaleAxis: "x" | "y";
          let sign: number;

          if (dragState.handle === "n") {
            anchorX = 0;
            anchorY = sb.y + sb.h;
            scaleAxis = "y";
            sign = -1;
          } else if (dragState.handle === "s") {
            anchorX = 0;
            anchorY = sb.y;
            scaleAxis = "y";
            sign = 1;
          } else if (dragState.handle === "w") {
            anchorX = sb.x + sb.w;
            anchorY = 0;
            scaleAxis = "x";
            sign = -1;
          } else {
            anchorX = sb.x;
            anchorY = 0;
            scaleAxis = "x";
            sign = 1;
          }

          if (scaleAxis === "x") {
            const newW = Math.max(minSize, sb.w + sign * dx);
            const sfx = sb.w > 0 ? newW / sb.w : 1;
            newT.sx = startT.sx * sfx;
            if (dragState.altKey) {
              newT.tx = cx + (startT.tx - cx) * sfx;
            } else {
              newT.tx = anchorX + (startT.tx - anchorX) * sfx;
            }
          } else {
            const newH = Math.max(minSize, sb.h + sign * dy);
            const sfy = sb.h > 0 ? newH / sb.h : 1;
            newT.sy = startT.sy * sfy;
            if (dragState.altKey) {
              newT.ty = cy + (startT.ty - cy) * sfy;
            } else {
              newT.ty = anchorY + (startT.ty - anchorY) * sfy;
            }
          }
        } else if (dragState.handle === "rotate") {
          const scx = cx;
          const scy = cy;
          const screenCenter = toScreen(scx, scy, panX, panY, zoom);
          const angle =
            Math.atan2(
              e.clientY - screenCenter.y,
              e.clientX - screenCenter.x
            ) *
            (180 / Math.PI);
          let startAngle =
            Math.atan2(
              dragState.startMouseY - screenCenter.y,
              dragState.startMouseX - screenCenter.x
            ) *
            (180 / Math.PI);
          let deltaAngle = angle - startAngle;
          if (dragState.shiftKey) {
            deltaAngle = Math.round(deltaAngle / 15) * 15;
          }
          newT.rotation = (startT.rotation + deltaAngle) % 360;
        } else if (dragState.handle === "body") {
          newT.tx = startT.tx + dx;
          newT.ty = startT.ty + dy;
        }

        onTransform(shape.id, {
          tx: newT.tx,
          ty: newT.ty,
          sx: newT.sx,
          sy: newT.sy,
          rotation: newT.rotation,
          mirrorX: newT.mirrorX,
          mirrorY: newT.mirrorY,
        });
      }
    },
    [dragState, bbox, zoom, panX, panY, shapes, onTransform]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  if (shapes.length === 0 || !bbox) return null;

  const tl = toScreen(bbox.x, bbox.y, panX, panY, zoom);
  const br = toScreen(bbox.x + bbox.w, bbox.y + bbox.h, panX, panY, zoom);
  const tr = toScreen(bbox.x + bbox.w, bbox.y, panX, panY, zoom);
  const bl = toScreen(bbox.x, bbox.y + bbox.h, panX, panY, zoom);
  const tc = {
    x: (tl.x + tr.x) / 2,
    y: (tl.y + tr.y) / 2,
  };
  const bc = {
    x: (bl.x + br.x) / 2,
    y: (bl.y + br.y) / 2,
  };
  const ml = {
    x: (tl.x + bl.x) / 2,
    y: (tl.y + bl.y) / 2,
  };
  const mr = {
    x: (tr.x + br.x) / 2,
    y: (tr.y + br.y) / 2,
  };
  const rotatePos = { x: tc.x, y: tc.y - ROTATE_OFFSET };

  const handleBase =
    "absolute w-2 h-2 bg-[#00E5FF] border border-[#00E5FF] z-20";
  const handleCorner =
    "absolute w-2 h-2 bg-white border border-[#00E5FF] z-20";

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 pointer-events-none z-10"
    >
      <div
        className="absolute pointer-events-auto"
        style={{
          left: tl.x,
          top: tl.y,
          width: br.x - tl.x,
          height: br.y - tl.y,
          border: "1px solid #00E5FF",
          cursor: "move",
        }}
        onMouseDown={handleMouseDown("body")}
      >
        <div
          className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-[#00E5FF] uppercase tracking-widest opacity-0 hover:opacity-100 transition-opacity"
          style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
        >
          {Math.round(bbox.w)}×{Math.round(bbox.h)}px
        </div>
      </div>

      <div
        className={handleCorner}
        style={{
          left: tl.x - HANDLE_SIZE / 2,
          top: tl.y - HANDLE_SIZE / 2,
          cursor: "nw-resize",
        }}
        onMouseDown={handleMouseDown("nw")}
      />
      <div
        className={handleCorner}
        style={{
          left: tr.x - HANDLE_SIZE / 2,
          top: tr.y - HANDLE_SIZE / 2,
          cursor: "ne-resize",
        }}
        onMouseDown={handleMouseDown("ne")}
      />
      <div
        className={handleCorner}
        style={{
          left: bl.x - HANDLE_SIZE / 2,
          top: bl.y - HANDLE_SIZE / 2,
          cursor: "sw-resize",
        }}
        onMouseDown={handleMouseDown("sw")}
      />
      <div
        className={handleCorner}
        style={{
          left: br.x - HANDLE_SIZE / 2,
          top: br.y - HANDLE_SIZE / 2,
          cursor: "se-resize",
        }}
        onMouseDown={handleMouseDown("se")}
      />

      <div
        className={handleBase}
        style={{
          left: tc.x - HANDLE_SIZE / 2,
          top: tc.y - HANDLE_SIZE / 2,
          cursor: "n-resize",
        }}
        onMouseDown={handleMouseDown("n")}
      />
      <div
        className={handleBase}
        style={{
          left: bc.x - HANDLE_SIZE / 2,
          top: bc.y - HANDLE_SIZE / 2,
          cursor: "s-resize",
        }}
        onMouseDown={handleMouseDown("s")}
      />
      <div
        className={handleBase}
        style={{
          left: mr.x - HANDLE_SIZE / 2,
          top: mr.y - HANDLE_SIZE / 2,
          cursor: "e-resize",
        }}
        onMouseDown={handleMouseDown("e")}
      />
      <div
        className={handleBase}
        style={{
          left: ml.x - HANDLE_SIZE / 2,
          top: ml.y - HANDLE_SIZE / 2,
          cursor: "w-resize",
        }}
        onMouseDown={handleMouseDown("w")}
      />

      <div
        className="absolute w-2 h-2 rounded-full bg-[#00E5FF] border border-[#00E5FF] cursor-grab z-20"
        style={{
          left: rotatePos.x - HANDLE_SIZE / 2,
          top: rotatePos.y - HANDLE_SIZE / 2,
        }}
        onMouseDown={handleMouseDown("rotate")}
      />

      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
        <line
          x1={tc.x}
          y1={tc.y}
          x2={rotatePos.x}
          y2={rotatePos.y}
          stroke="#00E5FF"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </svg>
    </div>
  );
}
