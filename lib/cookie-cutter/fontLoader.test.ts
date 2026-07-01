import { describe, it, expect } from "vitest";
import { pathToD, getCachedFont, isFontLoaded, getLastFontError } from "./fontLoader";

describe("fontLoader.pathToD", () => {
  it("converts an empty path to empty string", () => {
    const mockPath = { commands: [] } as any;
    expect(pathToD(mockPath)).toBe("");
  });

  it("converts M (move) command", () => {
    const mockPath = { commands: [{ type: "M", x: 10, y: 20 }] } as any;
    expect(pathToD(mockPath)).toBe("M 10 20");
  });

  it("converts L (line) command", () => {
    const mockPath = { commands: [{ type: "L", x: 30, y: 40 }] } as any;
    expect(pathToD(mockPath)).toBe("L 30 40");
  });

  it("converts C (cubic bezier) command", () => {
    const mockPath = {
      commands: [{ type: "C", x1: 1, y1: 2, x2: 3, y2: 4, x: 5, y: 6 }],
    } as any;
    expect(pathToD(mockPath)).toBe("C 1 2 3 4 5 6");
  });

  it("converts Q (quadratic bezier) command", () => {
    const mockPath = {
      commands: [{ type: "Q", x1: 1, y1: 2, x: 3, y: 4 }],
    } as any;
    expect(pathToD(mockPath)).toBe("Q 1 2 3 4");
  });

  it("converts Z (close) command", () => {
    const mockPath = { commands: [{ type: "Z" }] } as any;
    expect(pathToD(mockPath)).toBe("Z");
  });

  it("joins multiple commands with spaces", () => {
    const mockPath = {
      commands: [
        { type: "M", x: 0, y: 0 },
        { type: "L", x: 10, y: 0 },
        { type: "L", x: 10, y: 10 },
        { type: "Z" },
      ],
    } as any;
    expect(pathToD(mockPath)).toBe("M 0 0 L 10 0 L 10 10 Z");
  });

  it("rounds near-zero values to 0", () => {
    const mockPath = {
      commands: [{ type: "M", x: 1e-10, y: 5.5 }],
    } as any;
    expect(pathToD(mockPath)).toBe("M 0 5.5");
  });

  it("strips trailing zeros from decimals", () => {
    const mockPath = {
      commands: [{ type: "M", x: 10.0, y: 20.5 }],
    } as any;
    expect(pathToD(mockPath)).toBe("M 10 20.5");
  });
});

describe("fontLoader cache state", () => {
  it("starts with no font loaded", () => {
    expect(isFontLoaded()).toBe(false);
    expect(getCachedFont()).toBeNull();
  });
});
