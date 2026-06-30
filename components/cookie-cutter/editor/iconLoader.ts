import { Shape2D } from "@/lib/cookie-cutter/svgTypes";
import { createShapeFromD } from "@/lib/cookie-cutter/svgImport";

const ICONS: Record<string, string[]> = {
  star5: [
    "M 0 -28 L 8 -9 L 28 -9 L 13 3 L 18 23 L 0 12 L -18 23 L -13 3 L -28 -9 L -8 -9 Z",
  ],
  star6: [
    "M 0 -28 L 6 -10 L 24 -8 L 13 3 L 24 18 L 6 19 L 0 30 L -6 19 L -24 18 L -13 3 L -24 -8 L -6 -10 Z",
  ],
  heart: [
    "M 0 10 C 0 10 -25 -10 -25 -22 C -25 -28 -20 -30 -15 -26 C -10 -22 -4 -14 0 -6 C 4 -14 10 -22 15 -26 C 20 -30 25 -28 25 -22 C 25 -10 0 10 0 10 Z",
  ],
  hexagon: [
    "M 0 -28 L 24.25 -14 L 24.25 14 L 0 28 L -24.25 14 L -24.25 -14 Z",
  ],
  cloud: [
    "M 10 -25 C 20 -25 35 -20 35 -12 C 40 -5 35 5 28 5 L -20 5 C -28 5 -30 -5 -25 -10 C -28 -15 -20 -22 -10 -20 C -12 -28 0 -25 10 -25 Z",
  ],
  moon: [
    "M 0 -25 A 25 25 0 1 1 0 25 A 18 18 0 1 0 0 -25 Z",
  ],
  arrow: [
    "M -25 -10 L 0 -10 L 0 -25 L 28 0 L 0 25 L 0 10 L -25 10 Z",
  ],
  circle: [
    "M -25 0 A 25 25 0 1 1 25 0 A 25 25 0 1 1 -25 0 Z",
  ],
  square: [
    "M -25 -25 h 50 v 50 h -50 Z",
  ],
  triangle: [
    "M 0 -30 L 26 15 L -26 15 Z",
  ],
  diamond: [
    "M 0 -28 L 28 0 L 0 28 L -28 0 Z",
  ],
  cross: [
    "M -8 -25 h 16 v 8 h 8 v 15 h -8 v 8 h 15 v 10 h -15 v 9 h -16 v -9 h -15 v -10 h 15 v -8 h -8 v -15 h 8 v -8 h -15 v -10 h 15 v 8 Z",
  ],
  flower: [
    "M 0 0 C -10 -22 -6 -30 0 -30 C 6 -30 10 -22 0 0 Z",
    "M 0 0 C 18 -14 26 -8 28 0 C 26 8 18 14 0 0 Z",
    "M 0 0 C 22 10 28 18 26 26 C 20 24 14 18 0 0 Z",
    "M 0 0 C -14 18 -8 26 0 28 C 8 26 14 18 0 0 Z",
    "M 0 0 C -22 -10 -28 -18 -26 -26 C -20 -24 -14 -18 0 0 Z",
    "M -5 -5 A 5 5 0 1 1 5 -5 A 5 5 0 1 1 -5 -5 Z",
  ],
};

export function loadIcon(name: string): Shape2D[] {
  const paths = ICONS[name];
  if (!paths) return [];
  return paths.map((d) => {
    const shape = createShapeFromD(d, "icon");
    shape.metadata.iconSource = name;
    return shape;
  });
}
