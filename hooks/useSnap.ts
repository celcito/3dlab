import { useMemo } from "react";

interface SnapConfig {
  gridSize: number;
  enabled: boolean;
  tolerance: number;
}

interface Point {
  x: number;
  y: number;
}

export function useSnap(config: SnapConfig, vertexPoints: Point[] = []) {
  const snapX = (x: number): number => {
    if (!config.enabled) return x;
    const snapped = Math.round(x / config.gridSize) * config.gridSize;
    if (Math.abs(snapped - x) <= config.tolerance) return snapped;

    for (const v of vertexPoints) {
      if (Math.abs(v.x - x) <= config.tolerance) return v.x;
    }

    return x;
  };

  const snapY = (y: number): number => {
    if (!config.enabled) return y;
    const snapped = Math.round(y / config.gridSize) * config.gridSize;
    if (Math.abs(snapped - y) <= config.tolerance) return snapped;

    for (const v of vertexPoints) {
      if (Math.abs(v.y - y) <= config.tolerance) return v.y;
    }

    return y;
  };

  const snap = (p: Point): Point => ({
    x: snapX(p.x),
    y: snapY(p.y),
  });

  const vertexSnapPoints = useMemo(
    () => vertexPoints,
    [vertexPoints]
  );

  return { snap, snapX, snapY, vertexSnapPoints };
}
