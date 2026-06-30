import { useState } from "react";
import { type Shape2D, type EditorMode } from "@/lib/cookie-cutter/svgTypes";

interface ShapeRendererProps {
  shape: Shape2D;
  selected: boolean;
  mode?: EditorMode;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
}

function composeTransform(t: Shape2D["transform"]): string | undefined {
  const { tx, ty, rotation, sx, sy, mirrorX, mirrorY } = t;
  const parts: string[] = [];
  if (tx !== 0 || ty !== 0) parts.push(`translate(${tx} ${ty})`);
  if (rotation !== 0) parts.push(`rotate(${rotation})`);
  const scaleX = mirrorX ? -sx : sx;
  const scaleY = mirrorY ? -sy : sy;
  if (scaleX !== 1 || scaleY !== 1) parts.push(`scale(${scaleX} ${scaleY})`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function computeBoundingBox(
  d: string
): { x: number; y: number; w: number; h: number } | null {
  const numbers = d
    .replace(/[^\d.e\-\s]/g, " ")
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(parseFloat);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = numbers[i];
    const y = numbers[i + 1];
    if (isNaN(x) || isNaN(y)) continue;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (minX === Infinity) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function ShapeRenderer({
  shape,
  selected,
  mode,
  onClick,
  onMouseDown,
  onMouseUp,
}: ShapeRendererProps) {
  const [hovered, setHovered] = useState(false);
  const transform = composeTransform(shape.transform);

  const cursor =
    mode === "draw" || mode === "pen"
      ? "crosshair"
      : mode === "select"
        ? "default"
        : "default";

  return (
    <g
      transform={transform}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <title>{shape.metadata.name ?? shape.id}</title>
      <path
        d={shape.d}
        fillRule={shape.fill}
        fill="none"
        stroke={selected ? "#00E5FF" : "#ffffff"}
        strokeWidth={selected ? 2 : 1}
        strokeDasharray={selected ? "4 2" : "none"}
        opacity={shape.visible ? 1 : 0.3}
        style={{ cursor }}
      />
      {hovered && shape.metadata.name && (
        <title>{shape.metadata.name}</title>
      )}
    </g>
  );
}
