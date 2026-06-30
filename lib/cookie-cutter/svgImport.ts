import { Shape2D, VectorPiece, VectorScene } from "./svgTypes";

export function createDefaultScene(): VectorScene {
  const piece: VectorPiece = {
    id: crypto.randomUUID(),
    name: "Peça 1",
    shapes: [],
    embosseShapes: [],
    embosseMode: "deboss",
    embosseDepth: 0.8,
  };
  return {
    pieces: [piece],
    activePieceId: piece.id,
    view: { panX: 0, panY: 0, zoom: 1 },
    grid: { enabled: true, size: 10, snap: true, snapTolerance: 5 },
  };
}

export function createShapeFromD(d: string, kind: Shape2D["kind"] = "path"): Shape2D {
  return {
    id: crypto.randomUUID(),
    kind,
    d,
    transform: { tx: 0, ty: 0, sx: 1, sy: 1, rotation: 0, mirrorX: false, mirrorY: false },
    fill: "nonzero",
    metadata: {},
    visible: true,
  };
}

function extractPathsFromSvg(svg: string): Shape2D[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("SVG inválido: erro de parse XML");
  }

  const shapes: Shape2D[] = [];
  const svgEl = doc.documentElement;

  function processNode(node: Element, inheritedTransform: string, groupName?: string) {
    const transform = node.getAttribute("transform") || "";
    const combinedTransform = [inheritedTransform, transform].filter(Boolean).join(" ");
    let name = groupName;
    if (node.tagName === "g" && node.getAttribute("id")) {
      name = node.getAttribute("id")!;
    }

    const pathNodes = node.querySelectorAll(":scope > path, :scope > rect, :scope > circle, :scope > ellipse, :scope > polygon, :scope > polyline, :scope > line");
    for (const el of pathNodes) {
      const d = elementToPathD(el as Element);
      if (!d) continue;
      const shape = createShapeFromD(d, "path");
      if (combinedTransform) {
        shape.rawTransform = combinedTransform;
      }
      if (name) shape.metadata.name = name;
      shapes.push(shape);
    }

    const groups = node.querySelectorAll(":scope > g");
    for (const g of groups) {
      const gName = g.getAttribute("id") || undefined;
      processNode(g as Element, combinedTransform, gName || name);
    }
  }

  processNode(svgEl, "", undefined);

  if (shapes.length === 0) {
    throw new Error("SVG vazio — nenhum path encontrado");
  }

  return shapes;
}

function elementToPathD(el: Element): string | null {
  switch (el.tagName.toLowerCase()) {
    case "path":
      return el.getAttribute("d") || null;
    case "rect": {
      const x = parseFloat(el.getAttribute("x") || "0");
      const y = parseFloat(el.getAttribute("y") || "0");
      const w = parseFloat(el.getAttribute("width") || "0");
      const h = parseFloat(el.getAttribute("height") || "0");
      const rx = parseFloat(el.getAttribute("rx") || "0");
      const ry = parseFloat(el.getAttribute("ry") || "0");
      const r = Math.min(rx || ry, ry || rx);
      if (r > 0) {
        return `M ${x + r} ${y} h ${w - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(w - 2 * r)} a ${r} ${r} 0 0 1 ${-r} ${-r} v ${-(h - 2 * r)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`;
      }
      return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
    }
    case "circle": {
      const cx = parseFloat(el.getAttribute("cx") || "0");
      const cy = parseFloat(el.getAttribute("cy") || "0");
      const r = parseFloat(el.getAttribute("r") || "0");
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    }
    case "ellipse": {
      const cx = parseFloat(el.getAttribute("cx") || "0");
      const cy = parseFloat(el.getAttribute("cy") || "0");
      const rx = parseFloat(el.getAttribute("rx") || "0");
      const ry = parseFloat(el.getAttribute("ry") || "0");
      return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
    }
    case "polygon":
    case "polyline": {
      const points = el.getAttribute("points");
      if (!points) return null;
      const ptList = points.trim().split(/[\s,]+/).map(Number);
      if (ptList.length < 4) return null;
      let d = `M ${ptList[0]} ${ptList[1]}`;
      for (let i = 2; i < ptList.length; i += 2) {
        d += ` L ${ptList[i]} ${ptList[i + 1]}`;
      }
      if (el.tagName.toLowerCase() === "polygon") d += " Z";
      return d;
    }
    case "line": {
      const x1 = parseFloat(el.getAttribute("x1") || "0");
      const y1 = parseFloat(el.getAttribute("y1") || "0");
      const x2 = parseFloat(el.getAttribute("x2") || "0");
      const y2 = parseFloat(el.getAttribute("y2") || "0");
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    default:
      return null;
  }
}

export async function parseSvgFile(file: File): Promise<VectorScene> {
  const text = await file.text();
  return parseSvgString(text, file.name);
}

export function parseSvgString(svg: string, sourceName?: string): VectorScene {
  const shapes = extractPathsFromSvg(svg);
  const scene = createDefaultScene();
  scene.pieces[0].name = sourceName ? sourceName.replace(/\.svg$/i, "") : "Peça 1";
  scene.pieces[0].shapes = shapes;
  return scene;
}
