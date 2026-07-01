import { describe, it, expect } from "vitest";
import {
  pointsFromPathD,
  parseTransform,
  applyMatrixToPathD,
  parseViewBox,
  shape2DToThreeShape,
  identityMatrix,
} from "./shape2D";
import { parseSvgString } from "./svgImport";
import * as THREE from "three";

describe("pointsFromPathD - arc (A/a)", () => {
  it("arc with large-arc=0, sweep=1 draws the small arc with positive angle direction", () => {
    const d = "M 0 0 A 10 10 0 0 1 10 0";
    const pts = pointsFromPathD(d);
    expect(pts.length).toBeGreaterThan(10);
    const start = pts[0];
    const end = pts[pts.length - 1];
    expect(start.x).toBeCloseTo(0, 3);
    expect(start.y).toBeCloseTo(0, 3);
    expect(end.x).toBeCloseTo(10, 3);
    expect(end.y).toBeCloseTo(0, 3);
    const midY = pts[Math.floor(pts.length / 2)].y;
    expect(Math.abs(midY)).toBeGreaterThan(0);
  });

  it("arc with large-arc=1, sweep=1 draws the long way around (opposite side from sweep=0)", () => {
    const d = "M 0 0 A 10 10 0 1 1 10 0";
    const pts = pointsFromPathD(d);
    const mid = pts[Math.floor(pts.length / 2)];
    const dSweep0 = "M 0 0 A 10 10 0 1 0 10 0";
    const ptsSweep0 = pointsFromPathD(dSweep0);
    const midSweep0 = ptsSweep0[Math.floor(ptsSweep0.length / 2)];
    expect(mid.y * midSweep0.y).toBeLessThan(0);
  });

  it("full circle closes back to start", () => {
    const d = "M 5 0 A 5 5 0 1 1 5 0.0001 Z";
    const pts = pointsFromPathD(d);
    expect(pts[0].x).toBeCloseTo(5, 3);
    expect(pts[pts.length - 1].x).toBeCloseTo(5, 1);
  });

  it("arc with rx != ry draws an ellipse (no rotation)", () => {
    const d = "M 0 0 A 20 10 0 0 1 20 0";
    const pts = pointsFromPathD(d);
    const midY = pts[Math.floor(pts.length / 2)].y;
    expect(Math.abs(midY)).toBeGreaterThan(0);
    expect(Math.abs(midY)).toBeLessThan(10);
  });

  it("rx=0 degenerates to a straight line to the endpoint", () => {
    const d = "M 0 0 A 0 10 0 0 1 10 10";
    const pts = pointsFromPathD(d);
    expect(pts[pts.length - 1].x).toBeCloseTo(10, 3);
    expect(pts[pts.length - 1].y).toBeCloseTo(10, 3);
  });

  it("relative arc 'a' uses current point as origin", () => {
    const d = "M 5 5 a 5 5 0 0 1 10 0";
    const pts = pointsFromPathD(d);
    expect(pts[pts.length - 1].x).toBeCloseTo(15, 3);
    expect(pts[pts.length - 1].y).toBeCloseTo(5, 3);
  });
});

describe("pointsFromPathD - T/t (smooth quadratic)", () => {
  it("T after Q reflects the control point", () => {
    const d = "M 0 0 Q 5 0 10 0 T 20 0";
    const pts = pointsFromPathD(d);
    expect(pts.length).toBeGreaterThan(10);
    expect(pts[pts.length - 1].x).toBeCloseTo(20, 3);
  });

  it("T without prior Q/T uses current point as control", () => {
    const d = "M 0 0 T 10 0";
    const pts = pointsFromPathD(d);
    expect(pts[pts.length - 1].x).toBeCloseTo(10, 3);
  });
});

describe("pointsFromPathD - relative commands", () => {
  it("lowercase m sets first subpath via relative coords", () => {
    const d = "m 5 5 l 10 0 l 0 10 l -10 0 z";
    const pts = pointsFromPathD(d);
    expect(pts[0].x).toBeCloseTo(5, 3);
    expect(pts[0].y).toBeCloseTo(5, 3);
  });

  it("uppercase M then lowercase m starts new subpath at relative position", () => {
    const d = "M 0 0 L 10 0 m 5 5 L 20 5";
    const pts = pointsFromPathD(d);
    expect(pts[0].x).toBeCloseTo(0, 3);
    expect(pts[0].y).toBeCloseTo(0, 3);
    expect(pts[pts.length - 1].x).toBeCloseTo(20, 3);
  });
});

describe("shape2DToThreeShape - closed shapes", () => {
  it("creates closed shape from path d", () => {
    const s = shape2DToThreeShape("M 0 0 L 10 0 L 10 10 L 0 10 Z");
    const pts = s.getPoints();
    expect(pts.length).toBeGreaterThanOrEqual(4);
  });
});

describe("parseTransform", () => {
  it("parses translate", () => {
    const m = parseTransform("translate(10, 20)");
    expect(m.e).toBe(10);
    expect(m.f).toBe(20);
  });

  it("parses scale", () => {
    const m = parseTransform("scale(2)");
    expect(m.a).toBe(2);
    expect(m.d).toBe(2);
  });

  it("parses rotate (in degrees)", () => {
    const m = parseTransform("rotate(90)");
    expect(m.a).toBeCloseTo(0, 6);
    expect(m.b).toBeCloseTo(1, 6);
  });

  it("parses matrix", () => {
    const m = parseTransform("matrix(1 0 0 1 5 5)");
    expect(m.e).toBe(5);
    expect(m.f).toBe(5);
  });

  it("composes multiple transforms (translate then rotate, applied right-to-left)", () => {
    const m = parseTransform("translate(10, 0) rotate(90)");
    expect(m.a).toBeCloseTo(0, 6);
    expect(m.b).toBeCloseTo(1, 6);
    expect(m.e).toBeCloseTo(10, 6);
    expect(m.f).toBeCloseTo(0, 6);
  });

  it("returns identity for empty string", () => {
    const m = parseTransform("");
    expect(m).toEqual(identityMatrix());
  });
});

describe("applyMatrixToPathD", () => {
  it("translates a path by (10, 20)", () => {
    const d = "M 0 0 L 10 10";
    const out = applyMatrixToPathD(d, { a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 });
    expect(out).toContain("10 20");
    expect(out).toContain("20 30");
  });

  it("scales a path by 2x", () => {
    const d = "M 1 1 L 5 5";
    const out = applyMatrixToPathD(d, { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
    expect(out).toContain("2 2");
    expect(out).toContain("10 10");
  });

  it("identity leaves the path unchanged", () => {
    const d = "M 1 1 L 5 5";
    const out = applyMatrixToPathD(d, identityMatrix());
    expect(out.replace(/\s+/g, "")).toBe(d.replace(/\s+/g, ""));
  });

  it("does not transform relative commands (they stay relative)", () => {
    const d = "M 0 0 l 10 10";
    const out = applyMatrixToPathD(d, { a: 2, b: 0, c: 0, d: 2, e: 100, f: 100 });
    expect(out).toContain("l 10 10");
  });
});

describe("parseViewBox", () => {
  it("parses '0 0 100 100'", () => {
    const vb = parseViewBox("0 0 100 100");
    expect(vb).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });

  it("parses comma-separated", () => {
    const vb = parseViewBox("10,20,30,40");
    expect(vb).toEqual({ x: 10, y: 20, w: 30, h: 40 });
  });

  it("returns null for invalid input", () => {
    expect(parseViewBox("garbage")).toBeNull();
    expect(parseViewBox("0 0 100")).toBeNull();
  });
});

describe("parseSvgString - improved parser", () => {
  it("applies translate transform to path coordinates", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 0 0 L 10 10" transform="translate(50, 50)" fill-rule="evenodd" />
    </svg>`;
    const scene = await parseSvgString(svg);
    expect(scene.pieces[0].shapes.length).toBe(1);
    const d = scene.pieces[0].shapes[0].d;
    expect(d).toContain("50 50");
    expect(d).toContain("60 60");
  });

  it("preserves fill-rule='evenodd' from SVG", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 10 10 L 50 10 L 50 50 L 10 50 Z" fill-rule="evenodd" />
    </svg>`;
    const scene = await parseSvgString(svg);
    expect(scene.pieces[0].shapes[0].fill).toBe("evenodd");
  });

  it("default fill-rule is nonzero when not specified", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 0 0 L 10 10 L 0 10 Z" />
    </svg>`;
    const scene = await parseSvgString(svg);
    expect(scene.pieces[0].shapes[0].fill).toBe("nonzero");
  });

  it("applies scale transform", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 1 1 L 2 2" transform="scale(10)" />
    </svg>`;
    const scene = await parseSvgString(svg);
    const d = scene.pieces[0].shapes[0].d;
    expect(d).toContain("10 10");
    expect(d).toContain("20 20");
  });

  it("applies composed transforms (translate + rotate, applied right-to-left)", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g transform="translate(50, 50)">
        <path d="M 0 0 L 10 0" transform="rotate(90)" />
      </g>
    </svg>`;
    const scene = await parseSvgString(svg);
    const d = scene.pieces[0].shapes[0].d;
    expect(d).toMatch(/M\s*50\s+50/);
    expect(d).toMatch(/L\s*50\s+60/);
  });

  it("strips editor metadata (sodipodi/inkscape)", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd" viewBox="0 0 100 100">
      <metadata>Sodipodi 0.34</metadata>
      <sodipodi:namedview id="base" />
      <path d="M 0 0 L 10 10" sodipodi:nodetypes="cc" />
    </svg>`;
    const scene = await parseSvgString(svg);
    expect(scene.pieces[0].shapes.length).toBe(1);
  });

  it("compound path with multiple subpaths is kept as a single shape with evenodd", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path fill-rule="evenodd" d="M 10 10 L 50 10 L 50 50 L 10 50 Z M 20 20 L 30 20 L 30 30 L 20 30 Z" />
    </svg>`;
    const scene = await parseSvgString(svg);
    expect(scene.pieces[0].shapes.length).toBe(1);
    expect(scene.pieces[0].shapes[0].fill).toBe("evenodd");
  });

  it("preserves group id as metadata.name", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g id="cutter">
        <path d="M 0 0 L 10 10" />
      </g>
    </svg>`;
    const scene = await parseSvgString(svg);
    expect(scene.pieces[0].shapes[0].metadata.name).toBe("cutter");
  });
});
