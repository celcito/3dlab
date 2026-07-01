import * as opentype from "opentype.js";

const DEFAULT_FONT_URL = "/fonts/LiberationSans-Regular.ttf";
const LOAD_TIMEOUT_MS = 3000;

let cachedFont: opentype.Font | null = null;
let loadPromise: Promise<opentype.Font> | null = null;
let lastError: string | null = null;
let loadFailed = false;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export async function loadFont(url: string = DEFAULT_FONT_URL): Promise<opentype.Font> {
  if (cachedFont && url === DEFAULT_FONT_URL) return cachedFont;
  if (loadPromise && url === DEFAULT_FONT_URL) return loadPromise;
  if (loadFailed && url === DEFAULT_FONT_URL) {
    throw new Error(lastError ?? "Fonte falhou ao carregar anteriormente");
  }

  const promise = (async () => {
    const fetchPromise = fetch(url).then(async (resp) => {
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ao buscar ${url}`);
      }
      const buf = await resp.arrayBuffer();
      return opentype.parse(buf);
    });

    const font = await withTimeout(fetchPromise, LOAD_TIMEOUT_MS, `loadFont(${url})`);
    if (url === DEFAULT_FONT_URL) cachedFont = font;
    lastError = null;
    loadFailed = false;
    return font;
  })().catch((e) => {
    lastError = e?.message ?? String(e);
    if (url === DEFAULT_FONT_URL) {
      loadPromise = null;
      loadFailed = true;
    }
    throw e;
  });

  if (url === DEFAULT_FONT_URL) loadPromise = promise;
  return promise;
}

export function isFontLoaded(): boolean {
  return cachedFont !== null;
}

export function getCachedFont(): opentype.Font | null {
  return cachedFont;
}

export function getLastFontError(): string | null {
  return lastError;
}

export function pathToD(path: opentype.Path): string {
  const cmds = path.commands;
  const parts: string[] = [];
  for (const cmd of cmds) {
    switch (cmd.type) {
      case "M":
        parts.push(`M ${num(cmd.x)} ${num(cmd.y)}`);
        break;
      case "L":
        parts.push(`L ${num(cmd.x)} ${num(cmd.y)}`);
        break;
      case "C":
        parts.push(
          `C ${num(cmd.x1)} ${num(cmd.y1)} ${num(cmd.x2)} ${num(cmd.y2)} ${num(cmd.x)} ${num(cmd.y)}`
        );
        break;
      case "Q":
        parts.push(`Q ${num(cmd.x1)} ${num(cmd.y1)} ${num(cmd.x)} ${num(cmd.y)}`);
        break;
      case "Z":
        parts.push("Z");
        break;
    }
  }
  return parts.join(" ");
}

function num(v: number): string {
  if (Math.abs(v) < 1e-6) return "0";
  return v.toFixed(2).replace(/\.?0+$/, "") || "0";
}

export function textToPath(
  text: string,
  fontSize: number,
  x = 0,
  y = 0,
  font?: opentype.Font
): string {
  const f = font ?? cachedFont;
  if (!f) {
    throw new Error("Fonte não carregada. Chame loadFont() antes.");
  }
  const path = f.getPath(text, x, y, fontSize);
  return pathToD(path);
}

export function textBounds(
  text: string,
  fontSize: number,
  font?: opentype.Font
): { width: number; height: number } {
  const f = font ?? cachedFont;
  if (!f) return { width: 0, height: 0 };
  const path = f.getPath(text, 0, 0, fontSize);
  const bbox = path.getBoundingBox();
  return { width: bbox.x2 - bbox.x1, height: bbox.y2 - bbox.y1 };
}

export async function textToShapeD(
  text: string,
  fontSize: number,
  x = 0,
  y = 0
): Promise<string> {
  const font = await loadFont();
  return textToPath(text, fontSize, x, y, font);
}
