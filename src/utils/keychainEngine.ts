import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import JSZip from "jszip";
// @ts-ignore
import ImageTracer from "imagetracerjs";

export type BaseShapeType = 
  | "contour" 
  | "rounded_rect" 
  | "circle" 
  | "oval" 
  | "shield" 
  | "hexagon" 
  | "pill" 
  | "heart" 
  | "star" 
  | "motel_tag"
  | "pet_bone";

export type LoopPosition = 
  | "top_center" 
  | "top_left" 
  | "top_right" 
  | "left_center" 
  | "right_center" 
  | "bottom_center"
  | "custom";

export type LoopStyle = 
  | "external_tab" 
  | "top_eyelet" 
  | "integrated_hole" 
  | "dual_rings" 
  | "none";

export interface ColorLayerConfig {
  id: string;
  name: string;
  hex: string;
  originalHex: string;
  pixelCount: number;
  percentage: number;
  extrusionHeight: number; // in mm
  isFlush: boolean;
  visible: boolean;
  amsSlot: number; // 1 to 4 (or 1 to 8)
  svgPaths: string[];
}

export interface KeychainConfig {
  // Model Dimensions
  targetWidth: number;       // in mm (e.g. 50mm)
  targetHeight: number;      // in mm (e.g. 65mm)
  keepAspectRatio: boolean;

  // Base Plate
  baseShape: BaseShapeType;
  baseThickness: number;     // in mm (e.g. 2.0mm)
  baseColor: string;
  contourMargin: number;     // in mm (e.g. 2.5mm)
  contourSmoothing?: number; // 0 to 5 (corner rounding & spline smoothness)
  fillContourHoles?: boolean;// true = solid base plate, false = keep inner cutouts
  autoContourOnImport?: boolean;
  baseBorderRadius: number;  // in mm
  hasRaisedBorder: boolean;
  raisedBorderHeight: number;// in mm (e.g. 0.8mm)
  raisedBorderWidth: number; // in mm (e.g. 1.2mm)
  raisedBorderColor: string;

  // Keychain Loop / Eyelet
  loopStyle: LoopStyle;
  loopPosition: LoopPosition;
  loopCustomX: number;       // normalized -1 to 1 or mm
  loopCustomY: number;       // normalized -1 to 1 or mm
  loopHoleDiameter: number;  // in mm (standard 4.2mm)
  loopWallThickness: number; // in mm (standard 2.5mm)
  loopHeight: number;        // in mm (usually matches base or slightly thicker)

  // Multi-Color Options
  colorCount: number;        // 2, 3, 4, 5, 6
  colorMode: "embossed" | "flush" | "debossed";
  layers: ColorLayerConfig[];
  removeBackground: boolean;
  backgroundColor: string;
  tolerance: number;

  // Back Text / Inscription
  hasBackText: boolean;
  backText: string;
  backTextSize: number;
  backTextDepth: number;     // in mm
  backTextEngraved: boolean; // true = engraved, false = embossed

  // 3D View Helpers
  showSplitRing: boolean;
  showWireframe: boolean;
  splitRingColor: string;
}

export interface KeychainPreset {
  id: string;
  name: string;
  category: "gaming" | "pop" | "cute" | "badges" | "cars";
  icon: string;
  description: string;
  svg: string;
  defaultBaseShape: BaseShapeType;
  defaultColors: { name: string; hex: string; height: number; amsSlot: number }[];
}

// Built-in starter vector presets for instant testing
export const KEYCHAIN_PRESETS: KeychainPreset[] = [
  {
    id: "retro_gamepad",
    name: "Controle Retro 8-Bit",
    category: "gaming",
    icon: "🎮",
    description: "Controle clássico com botões coloridos A/B, D-Pad e corpo ergonômico",
    defaultBaseShape: "contour",
    defaultColors: [
      { name: "Corpo do Controle", hex: "#27272A", height: 2.0, amsSlot: 1 },
      { name: "D-Pad & Detalhes", hex: "#71717A", height: 2.8, amsSlot: 2 },
      { name: "Botão A (Vermelho)", hex: "#EF4444", height: 3.4, amsSlot: 3 },
      { name: "Botão B (Amarelo)", hex: "#EAB308", height: 3.4, amsSlot: 4 },
    ],
    svg: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
      <!-- Body Outline -->
      <path fill="#27272A" d="M 18 15 C 8 15 2 24 2 38 C 2 54 10 65 24 65 C 32 65 38 58 44 52 C 48 48 52 48 56 52 C 62 58 68 65 76 65 C 90 65 98 54 98 38 C 98 24 92 15 82 15 C 72 15 62 20 50 20 C 38 20 28 15 18 15 Z"/>
      <!-- Screen / Center Inset -->
      <rect x="36" y="26" width="28" height="18" rx="3" fill="#71717A"/>
      <rect x="40" y="30" width="20" height="10" rx="1" fill="#18181B"/>
      <!-- D-Pad (Cross) -->
      <path fill="#71717A" d="M 18 28 L 22 28 L 22 34 L 28 34 L 28 38 L 22 38 L 22 44 L 18 44 L 18 38 L 12 38 L 12 34 L 18 34 Z"/>
      <!-- Action Buttons -->
      <circle cx="75" cy="40" r="4.5" fill="#EF4444"/>
      <circle cx="85" cy="32" r="4.5" fill="#EAB308"/>
      <!-- Start / Select -->
      <rect x="42" y="48" width="6" height="2" rx="1" fill="#E4E4E7"/>
      <rect x="52" y="48" width="6" height="2" rx="1" fill="#E4E4E7"/>
    </svg>`
  },
  {
    id: "pixel_heart",
    name: "Coração Pixel Gamer",
    category: "gaming",
    icon: "❤️",
    description: "Coração estilo 8-bit com borda preta, brilho branco e preenchimento vermelho",
    defaultBaseShape: "contour",
    defaultColors: [
      { name: "Contorno Preto", hex: "#18181B", height: 2.2, amsSlot: 1 },
      { name: "Coração Vermelho", hex: "#DC2626", height: 3.0, amsSlot: 2 },
      { name: "Sombra Carmim", hex: "#991B1B", height: 2.6, amsSlot: 3 },
      { name: "Brilho Pixel Branco", hex: "#FFFFFF", height: 3.4, amsSlot: 4 },
    ],
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Black Outer Border -->
      <path fill="#18181B" d="M 16 8 H 32 V 16 H 40 V 16 H 48 V 8 H 64 V 16 H 72 V 40 H 64 V 48 H 56 V 56 H 48 V 64 H 40 V 72 H 32 V 64 H 24 V 56 H 16 V 48 H 8 V 40 H 0 V 16 H 8 V 8 H 16 Z"/>
      <!-- Red Core Fill -->
      <path fill="#DC2626" d="M 16 16 H 32 V 24 H 48 V 16 H 64 V 40 H 56 V 48 H 48 V 56 H 40 V 64 H 32 V 56 H 24 V 48 H 16 V 40 H 8 V 24 H 16 Z"/>
      <!-- Dark Red Shade -->
      <path fill="#991B1B" d="M 16 40 H 24 V 48 H 32 V 56 H 40 V 64 H 48 V 56 H 56 V 48 H 64 V 40 H 56 V 48 H 48 V 56 H 32 V 48 H 24 V 40 Z"/>
      <!-- White Specular Pixel Highlight -->
      <rect x="16" y="24" width="8" height="8" fill="#FFFFFF"/>
      <rect x="24" y="24" width="8" height="8" fill="#FFFFFF"/>
      <rect x="16" y="32" width="8" height="8" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "kawaii_cat",
    name: "Gatinho Kawaii",
    category: "cute",
    icon: "🐱",
    description: "Gato fofo com bochechas rosas, olhos brilhantes e orelhas destacadas",
    defaultBaseShape: "contour",
    defaultColors: [
      { name: "Corpo Branco", hex: "#FAFAFA", height: 2.2, amsSlot: 1 },
      { name: "Contorno e Olhos", hex: "#18181B", height: 3.2, amsSlot: 2 },
      { name: "Bochechas Rosas", hex: "#F472B6", height: 2.8, amsSlot: 3 },
      { name: "Orelhinha Amarela", hex: "#FBBF24", height: 2.8, amsSlot: 4 },
    ],
    svg: `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <!-- Main Head White -->
      <path fill="#FAFAFA" d="M 20 30 L 15 10 L 35 22 C 41 20 49 20 55 22 L 75 10 L 70 30 C 82 42 82 62 70 74 C 58 84 32 84 20 74 C 8 62 8 42 20 30 Z"/>
      <!-- Ear Details -->
      <polygon points="19,16 28,24 20,26" fill="#F472B6"/>
      <polygon points="71,16 62,24 70,26" fill="#FBBF24"/>
      <!-- Eyes & Whiskers Black -->
      <circle cx="32" cy="46" r="5" fill="#18181B"/>
      <circle cx="58" cy="46" r="5" fill="#18181B"/>
      <circle cx="34" cy="44" r="1.5" fill="#FFFFFF"/>
      <circle cx="60" cy="44" r="1.5" fill="#FFFFFF"/>
      <path d="M 45 52 L 42 56 L 48 56 Z" fill="#F472B6"/>
      <path d="M 42 58 C 42 62 45 63 45 63 C 45 63 48 62 48 58" stroke="#18181B" stroke-width="2.5" fill="none"/>
      <!-- Pink Cheeks -->
      <ellipse cx="23" cy="54" rx="4.5" ry="3" fill="#F472B6"/>
      <ellipse cx="67" cy="54" rx="4.5" ry="3" fill="#F472B6"/>
    </svg>`
  },
  {
    id: "kawaii_egg",
    name: "Ovo Estalado Kawaii",
    category: "cute",
    icon: "🍳",
    description: "Ovo frito com clara branca sólida, gema amarela destacada, contorno e bochechas",
    defaultBaseShape: "contour",
    defaultColors: [
      { name: "Clara Branca", hex: "#FFFFFF", height: 2.2, amsSlot: 1 },
      { name: "Contorno Preto", hex: "#18181B", height: 3.2, amsSlot: 2 },
      { name: "Gema Amarela", hex: "#FBBF24", height: 3.6, amsSlot: 3 },
      { name: "Bochechas Rosas", hex: "#F472B6", height: 2.8, amsSlot: 4 },
    ],
    svg: `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <!-- White Egg White Body with undulating perimeter -->
      <path fill="#FFFFFF" stroke="#18181B" stroke-width="3" stroke-linejoin="round" d="M 45 12 C 65 12 80 25 80 45 C 80 58 72 75 55 78 C 38 81 25 78 15 65 C 5 52 10 32 22 20 C 30 14 38 12 45 12 Z"/>
      <!-- Golden Yolk in the center -->
      <circle cx="48" cy="46" r="18" fill="#FBBF24" stroke="#18181B" stroke-width="2.5"/>
      <!-- Cute Eyes on Yolk -->
      <circle cx="42" cy="44" r="3.2" fill="#18181B"/>
      <circle cx="54" cy="44" r="3.2" fill="#18181B"/>
      <circle cx="43" cy="42.5" r="1" fill="#FFFFFF"/>
      <circle cx="55" cy="42.5" r="1" fill="#FFFFFF"/>
      <!-- Cute Smile -->
      <path d="M 46 49 Q 48 53 50 49" stroke="#18181B" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Pink Blush -->
      <circle cx="36" cy="48" r="2.5" fill="#F472B6"/>
      <circle cx="60" cy="48" r="2.5" fill="#F472B6"/>
      <!-- Specular Highlight on Yolk -->
      <ellipse cx="44" cy="34" rx="4" ry="2" fill="#FEF08A"/>
    </svg>`
  },
  {
    id: "cyber_star",
    name: "Estrela Cósmica",
    category: "badges",
    icon: "⭐",
    description: "Estrela chanfrada com núcleo brilhante, aro metálico e linhas sci-fi",
    defaultBaseShape: "circle",
    defaultColors: [
      { name: "Placa Base Roxa", hex: "#4C1D95", height: 2.0, amsSlot: 1 },
      { name: "Estrela Dourada", hex: "#F59E0B", height: 3.2, amsSlot: 2 },
      { name: "Faceta Âmbar", hex: "#D97706", height: 2.8, amsSlot: 3 },
      { name: "Brilho Ciano Neon", hex: "#00E5FF", height: 3.6, amsSlot: 4 },
    ],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#4C1D95"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="#00E5FF" stroke-width="3"/>
      <!-- Star Facets -->
      <polygon points="50,15 62,38 86,40 68,56 73,80 50,68" fill="#F59E0B"/>
      <polygon points="50,15 50,68 27,80 32,56 14,40 38,38" fill="#D97706"/>
      <circle cx="50" cy="50" r="8" fill="#00E5FF"/>
      <circle cx="50" cy="50" r="4" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "space_helmet",
    name: "Capacete Astronauta",
    category: "pop",
    icon: "👨‍🚀",
    description: "Capacete espacial com visor espelhado dourado e iluminação sci-fi",
    defaultBaseShape: "contour",
    defaultColors: [
      { name: "Traje Branco", hex: "#F4F4F5", height: 2.2, amsSlot: 1 },
      { name: "Visor Dourado", hex: "#F59E0B", height: 3.4, amsSlot: 2 },
      { name: "Detalhes Grafite", hex: "#27272A", height: 2.8, amsSlot: 3 },
      { name: "Luzes LED Ciano", hex: "#06B6D4", height: 3.6, amsSlot: 4 },
    ],
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Helmet Outer -->
      <rect x="14" y="10" width="52" height="52" rx="20" fill="#F4F4F5"/>
      <!-- Neck Ring -->
      <rect x="22" y="60" width="36" height="8" rx="3" fill="#27272A"/>
      <!-- Golden Visor Bubble -->
      <rect x="20" y="20" width="40" height="30" rx="14" fill="#F59E0B"/>
      <!-- Reflection Highlight -->
      <path d="M 28 25 C 40 22 52 26 52 26 C 52 26 40 28 30 32 Z" fill="#FEF08A"/>
      <!-- Side Comm Pods -->
      <rect x="8" y="30" width="8" height="16" rx="3" fill="#27272A"/>
      <rect x="64" y="30" width="8" height="16" rx="3" fill="#27272A"/>
      <!-- Cyan LED indicator -->
      <circle cx="12" cy="38" r="2" fill="#06B6D4"/>
      <circle cx="68" cy="38" r="2" fill="#06B6D4"/>
    </svg>`
  },
  {
    id: "pet_tag_bone",
    name: "Tag de Pet (Ossinho)",
    category: "badges",
    icon: "🦴",
    description: "Placa em formato de osso para identificação de cachorros e gatos",
    defaultBaseShape: "pet_bone",
    defaultColors: [
      { name: "Base Placa Azul", hex: "#2563EB", height: 2.4, amsSlot: 1 },
      { name: "Borda Branca", hex: "#FFFFFF", height: 3.2, amsSlot: 2 },
      { name: "Ícone Patinha", hex: "#FACC15", height: 3.6, amsSlot: 3 },
    ],
    svg: `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <path fill="#2563EB" d="M 25 15 C 22 6 12 6 8 14 C 4 22 8 30 8 30 C 8 30 4 38 8 46 C 12 54 22 54 25 45 L 75 45 C 78 54 88 54 92 46 C 96 38 92 30 92 30 C 92 30 96 22 92 14 C 88 6 78 6 75 15 Z"/>
      <!-- Center Paw Print -->
      <ellipse cx="50" cy="34" rx="7" ry="6" fill="#FFFFFF"/>
      <circle cx="43" cy="23" r="2.8" fill="#FFFFFF"/>
      <circle cx="48" cy="20" r="2.8" fill="#FFFFFF"/>
      <circle cx="53" cy="20" r="2.8" fill="#FFFFFF"/>
      <circle cx="58" cy="23" r="2.8" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "retro_motel",
    name: "Chaveiro Vintage Motel",
    category: "badges",
    icon: "🗝️",
    description: "Clássico chaveiro losango/diamante de hotel americano vintage",
    defaultBaseShape: "motel_tag",
    defaultColors: [
      { name: "Placa Verde Esmeralda", hex: "#065F46", height: 2.2, amsSlot: 1 },
      { name: "Borda Dourada", hex: "#F59E0B", height: 3.2, amsSlot: 2 },
      { name: "Tipografia Branco", hex: "#FFFFFF", height: 3.2, amsSlot: 3 },
    ],
    svg: `<svg viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg">
      <!-- Diamond / Oval Motel Tag Silhouette -->
      <path fill="#065F46" d="M 35 5 C 55 25 65 45 65 55 C 65 65 55 85 35 105 C 15 85 5 65 5 55 C 5 45 15 25 35 5 Z"/>
      <path fill="none" stroke="#F59E0B" stroke-width="2.5" d="M 35 12 C 50 30 58 47 58 55 C 58 63 50 80 35 98 C 20 80 12 63 12 55 C 12 47 20 30 35 12 Z"/>
      <!-- Keyhole Graphic -->
      <circle cx="35" cy="42" r="6" fill="#F59E0B"/>
      <polygon points="32,45 38,45 40,58 30,58" fill="#F59E0B"/>
      <!-- Room Number -->
      <rect x="24" y="66" width="22" height="12" rx="2" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: "turbo_engine",
    name: "Turbina Automotiva",
    category: "cars",
    icon: "🏎️",
    description: "Turbocompressor com carcaça metálica, hélice e flange",
    defaultBaseShape: "contour",
    defaultColors: [
      { name: "Carcaça Cinza", hex: "#3F3F46", height: 2.2, amsSlot: 1 },
      { name: "Hélice Vermelha", hex: "#EF4444", height: 3.2, amsSlot: 2 },
      { name: "Centro Metálico", hex: "#E4E4E7", height: 3.6, amsSlot: 3 },
    ],
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path fill="#3F3F46" d="M 40 8 C 22 8 8 22 8 40 C 8 58 22 72 40 72 C 58 72 72 58 72 40 L 72 15 L 56 15 C 51 10 46 8 40 8 Z"/>
      <circle cx="40" cy="40" r="24" fill="#18181B"/>
      <!-- Turbo Blades -->
      <circle cx="40" cy="40" r="18" fill="#EF4444"/>
      <circle cx="40" cy="40" r="7" fill="#E4E4E7"/>
      <line x1="40" y1="22" x2="40" y2="58" stroke="#18181B" stroke-width="2.5"/>
      <line x1="22" y1="40" x2="58" y2="40" stroke="#18181B" stroke-width="2.5"/>
      <line x1="27" y1="27" x2="53" y2="53" stroke="#18181B" stroke-width="2.5"/>
      <line x1="27" y1="53" x2="53" y2="27" stroke="#18181B" stroke-width="2.5"/>
    </svg>`
  }
];

/**
 * Returns human-friendly descriptive name for a color
 */
function getFriendlyColorName(hex: string, index: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);

  if (hsl.l > 0.92) return `Branco / Claro (#${hex.replace('#','')})`;
  if (hsl.l < 0.12) return `Preto / Contorno (#${hex.replace('#','')})`;
  if (hsl.s < 0.15) return `Cinza (#${hex.replace('#','')})`;

  const deg = hsl.h * 360;
  if (deg >= 345 || deg < 15) return `Vermelho (#${hex.replace('#','')})`;
  if (deg >= 15 && deg < 45) return `Laranja / Âmbar (#${hex.replace('#','')})`;
  if (deg >= 45 && deg < 70) return `Amarelo / Gema (#${hex.replace('#','')})`;
  if (deg >= 70 && deg < 165) return `Verde (#${hex.replace('#','')})`;
  if (deg >= 165 && deg < 200) return `Ciano (#${hex.replace('#','')})`;
  if (deg >= 200 && deg < 260) return `Azul (#${hex.replace('#','')})`;
  if (deg >= 260 && deg < 315) return `Roxo / Violeta (#${hex.replace('#','')})`;
  return `Rosa / Magenta (#${hex.replace('#','')})`;
}

/**
 * Pre-processes an image canvas using Flood Fill BFS from outer edges
 * to turn ONLY true external background into transparent pixels,
 * preserving internal white/light objects (such as egg white, teeth, eyes).
 */
async function preprocessImageSmartBackground(
  imageSrc: string,
  mode: "smart" | "keep_all" | "remove_white" = "smart",
  customBgHex?: string
): Promise<string> {
  if (typeof document === "undefined" || mode === "keep_all") {
    return imageSrc;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const maxDim = 600;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          const s = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        if (mode === "remove_white") {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
          return;
        }

        // Smart BFS mode: Sample 4 corners
        const cornerIdxs = [
          0,
          (w - 1) * 4,
          (h - 1) * w * 4,
          ((h - 1) * w + (w - 1)) * 4
        ];

        let bgR = 255, bgG = 255, bgB = 255, bgA = 255;
        let hasTrans = false;

        for (const cIdx of cornerIdxs) {
          if (data[cIdx + 3] < 30) {
            hasTrans = true;
            break;
          }
        }

        if (hasTrans) {
          // Image already has native PNG transparency! Keep as is.
          resolve(canvas.toDataURL("image/png"));
          return;
        }

        // Pick top-left corner as reference background color
        bgR = data[0];
        bgG = data[1];
        bgB = data[2];
        bgA = data[3];

        if (customBgHex) {
          const c = new THREE.Color(customBgHex);
          bgR = Math.round(c.r * 255);
          bgG = Math.round(c.g * 255);
          bgB = Math.round(c.b * 255);
        }

        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        // Push all outer border pixels that match background color
        const colorTolerance = 32;
        const matchesBg = (x: number, y: number) => {
          const p = (y * w + x) * 4;
          const dr = Math.abs(data[p] - bgR);
          const dg = Math.abs(data[p + 1] - bgG);
          const db = Math.abs(data[p + 2] - bgB);
          return (dr + dg + db) < colorTolerance * 3;
        };

        // Top & Bottom edges
        for (let x = 0; x < w; x++) {
          if (matchesBg(x, 0)) {
            visited[x] = 1;
            queue.push(x);
          }
          const bIdx = (h - 1) * w + x;
          if (matchesBg(x, h - 1)) {
            visited[bIdx] = 1;
            queue.push(bIdx);
          }
        }

        // Left & Right edges
        for (let y = 0; y < h; y++) {
          const lIdx = y * w;
          if (matchesBg(0, y) && !visited[lIdx]) {
            visited[lIdx] = 1;
            queue.push(lIdx);
          }
          const rIdx = y * w + (w - 1);
          if (matchesBg(w - 1, y) && !visited[rIdx]) {
            visited[rIdx] = 1;
            queue.push(rIdx);
          }
        }

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const qx = curr % w;
          const qy = Math.floor(curr / w);

          const neighbors = [
            [qx + 1, qy],
            [qx - 1, qy],
            [qx, qy + 1],
            [qx, qy - 1]
          ];

          for (let i = 0; i < 4; i++) {
            const nx = neighbors[i][0];
            const ny = neighbors[i][1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (!visited[nIdx] && matchesBg(nx, ny)) {
                visited[nIdx] = 1;
                queue.push(nIdx);
              }
            }
          }
        }

        // Only make VISITED boundary pixels transparent; keep enclosed inner whites/shades!
        for (let i = 0; i < w * h; i++) {
          if (visited[i]) {
            data[i * 4 + 3] = 0; // Alpha 0
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Quantizes image colors into N discrete color layers and builds SVG
 */
export async function processImageToMulticolorSvg(
  imageSrc: string,
  options: {
    colorCount: number;
    blurRadius?: number;
    pathOmit?: number;
    removeBackground?: boolean;
    bgMode?: "smart" | "keep_all" | "remove_white";
    backgroundColor?: string;
  }
): Promise<{
  svgString: string;
  layers: ColorLayerConfig[];
  detectedPalette: { hex: string; pixelPercent: number }[];
}> {
  const bgMode = options.bgMode || (options.removeBackground !== false ? "smart" : "keep_all");
  const processedImage = await preprocessImageSmartBackground(imageSrc, bgMode, options.backgroundColor);

  return new Promise((resolve, reject) => {
    const tracerOptions = {
      corsenabled: true,
      ltilesize: 128,
      numberofcolors: Math.max(2, Math.min(8, options.colorCount || 4)),
      pathomit: options.pathOmit ?? 4,
      blurradius: options.blurRadius ?? 0,
      blurdelta: 20,
      strokewidth: 0,
      linefilter: false,
      scale: 1,
      roundcoords: 1,
      colorsampling: 2,
      mincolorratio: 0.002,
      colorquantcycles: 5,
      layering: 0
    };

    try {
      ImageTracer.imageToSVG(processedImage, (svgString: string) => {
        if (!svgString) {
          reject(new Error("Falha na vetorização da imagem"));
          return;
        }

        const loader = new SVGLoader();
        const parsed = loader.parse(svgString);
        
        // Group paths by distinct colors
        const colorMap = new Map<string, { paths: string[]; originalColor: THREE.Color }>();
        
        parsed.paths.forEach((path) => {
          const c = path.color || new THREE.Color("#000000");
          const hex = `#${c.getHexString().toUpperCase()}`;
          
          // Transparent SVG paths or matching explicit background removal in remove_white mode
          if (bgMode === "remove_white") {
            const r = c.r * 255;
            const g = c.g * 255;
            const b = c.b * 255;
            if (r > 248 && g > 248 && b > 248) {
              return;
            }
          }

          const existing = colorMap.get(hex);
          if (existing) {
            existing.paths.push(hex);
          } else {
            colorMap.set(hex, { paths: [hex], originalColor: c });
          }
        });

        const totalLayers = Math.min(colorMap.size, 8);
        const layers: ColorLayerConfig[] = [];
        const detectedPalette: { hex: string; pixelPercent: number }[] = [];

        let slotCounter = 1;
        let layerIdx = 0;

        // Sort colors: darker/contours first, lighter/highlights last
        const sortedColors = Array.from(colorMap.entries()).sort((a, b) => {
          const hslA = { h: 0, s: 0, l: 0 };
          const hslB = { h: 0, s: 0, l: 0 };
          a[1].originalColor.getHSL(hslA);
          b[1].originalColor.getHSL(hslB);
          return hslA.l - hslB.l;
        });

        sortedColors.forEach(([hex, val]) => {
          const stepHeight = 2.0 + layerIdx * 0.6; // Progressive layer heights
          const friendlyName = getFriendlyColorName(hex, layerIdx + 1);

          layers.push({
            id: `layer_${layerIdx + 1}`,
            name: `${friendlyName}`,
            hex: hex,
            originalHex: hex,
            pixelCount: val.paths.length,
            percentage: Math.round((val.paths.length / (parsed.paths.length || 1)) * 100),
            extrusionHeight: parseFloat(stepHeight.toFixed(1)),
            isFlush: false,
            visible: true,
            amsSlot: slotCounter,
            svgPaths: val.paths
          });

          detectedPalette.push({
            hex,
            pixelPercent: Math.round((val.paths.length / (parsed.paths.length || 1)) * 100)
          });

          slotCounter = (slotCounter % 4) + 1;
          layerIdx++;
        });

        resolve({
          svgString,
          layers: layers.length > 0 ? layers : [
            {
              id: "layer_1",
              name: "Camada Principal",
              hex: "#18181B",
              originalHex: "#18181B",
              pixelCount: 100,
              percentage: 100,
              extrusionHeight: 3.0,
              isFlush: false,
              visible: true,
              amsSlot: 1,
              svgPaths: []
            }
          ],
          detectedPalette
        });
      }, tracerOptions);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Builds 2D Shape for the chosen Base Shape
 */
export function generateBaseShape(
  type: BaseShapeType,
  width: number,
  height: number,
  radius: number = 4
): THREE.Shape {
  const shape = new THREE.Shape();
  const w = width;
  const h = height;
  const r = Math.min(radius, w / 2, h / 2);

  switch (type) {
    case "circle": {
      const rad = Math.min(w, h) / 2;
      shape.absarc(0, 0, rad, 0, Math.PI * 2, false);
      break;
    }

    case "oval": {
      shape.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false);
      break;
    }

    case "hexagon": {
      const rad = Math.min(w, h) / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const x = Math.cos(angle) * rad;
        const y = Math.sin(angle) * rad;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      break;
    }

    case "shield": {
      const halfW = w / 2;
      const topY = h / 2;
      const botY = -h / 2;
      shape.moveTo(-halfW, topY);
      shape.lineTo(halfW, topY);
      shape.bezierCurveTo(halfW, topY * 0.2, halfW * 0.8, botY * 0.5, 0, botY);
      shape.bezierCurveTo(-halfW * 0.8, botY * 0.5, -halfW, topY * 0.2, -halfW, topY);
      shape.closePath();
      break;
    }

    case "heart": {
      const scale = Math.min(w, h) / 2;
      shape.moveTo(0, -scale * 0.8);
      shape.bezierCurveTo(-scale * 1.2, -scale * 0.2, -scale * 1.2, scale * 0.6, -scale * 0.6, scale * 0.9);
      shape.bezierCurveTo(-scale * 0.2, scale * 1.1, 0, scale * 0.8, 0, scale * 0.6);
      shape.bezierCurveTo(0, scale * 0.8, scale * 0.2, scale * 1.1, scale * 0.6, scale * 0.9);
      shape.bezierCurveTo(scale * 1.2, scale * 0.6, scale * 1.2, -scale * 0.2, 0, -scale * 0.8);
      shape.closePath();
      break;
    }

    case "star": {
      const points = 5;
      const rOuter = Math.min(w, h) / 2;
      const rInner = rOuter * 0.45;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const dist = i % 2 === 0 ? rOuter : rInner;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      break;
    }

    case "motel_tag": {
      const halfW = w / 2;
      const halfH = h / 2;
      shape.moveTo(0, halfH);
      shape.bezierCurveTo(halfW * 0.9, halfH * 0.6, halfW, halfH * 0.2, halfW, 0);
      shape.bezierCurveTo(halfW, -halfH * 0.2, halfW * 0.9, -halfH * 0.6, 0, -halfH);
      shape.bezierCurveTo(-halfW * 0.9, -halfH * 0.6, -halfW, -halfH * 0.2, -halfW, 0);
      shape.bezierCurveTo(-halfW, halfH * 0.2, -halfW * 0.9, halfH * 0.6, 0, halfH);
      shape.closePath();
      break;
    }

    case "pet_bone": {
      const halfW = w / 2;
      const halfH = h / 2;
      const lobeR = halfH * 0.45;
      shape.moveTo(-halfW + lobeR, halfH * 0.4);
      shape.lineTo(halfW - lobeR, halfH * 0.4);
      shape.absarc(halfW - lobeR, halfH - lobeR, lobeR, -Math.PI / 4, Math.PI / 4, false);
      shape.absarc(halfW - lobeR, -halfH + lobeR, lobeR, Math.PI / 4, (3 * Math.PI) / 4, false);
      shape.lineTo(-halfW + lobeR, -halfH * 0.4);
      shape.absarc(-halfW + lobeR, -halfH + lobeR, lobeR, (3 * Math.PI) / 4, (5 * Math.PI) / 4, false);
      shape.absarc(-halfW + lobeR, halfH - lobeR, lobeR, (5 * Math.PI) / 4, (7 * Math.PI) / 4, false);
      shape.closePath();
      break;
    }

    case "pill": {
      const halfW = w / 2;
      const halfH = h / 2;
      const pillR = Math.min(halfW, halfH);
      if (w >= h) {
        shape.moveTo(-halfW + pillR, halfH);
        shape.lineTo(halfW - pillR, halfH);
        shape.absarc(halfW - pillR, 0, pillR, Math.PI / 2, -Math.PI / 2, true);
        shape.lineTo(-halfW + pillR, -halfH);
        shape.absarc(-halfW + pillR, 0, pillR, -Math.PI / 2, Math.PI / 2, true);
      } else {
        shape.moveTo(-halfW, halfH - pillR);
        shape.absarc(0, halfH - pillR, pillR, Math.PI, 0, true);
        shape.lineTo(halfW, -halfH + pillR);
        shape.absarc(0, -halfH + pillR, pillR, 0, Math.PI, true);
      }
      shape.closePath();
      break;
    }

    case "rounded_rect":
    default: {
      const halfW = w / 2;
      const halfH = h / 2;
      shape.moveTo(-halfW + r, halfH);
      shape.lineTo(halfW - r, halfH);
      shape.absarc(halfW - r, halfH - r, r, Math.PI / 2, 0, true);
      shape.lineTo(halfW, -halfH + r);
      shape.absarc(halfW - r, -halfH + r, r, 0, -Math.PI / 2, true);
      shape.lineTo(-halfW + r, -halfH);
      shape.absarc(-halfW + r, -halfH + r, r, -Math.PI / 2, Math.PI, true);
      shape.lineTo(-halfW, halfH - r);
      shape.absarc(-halfW + r, halfH - r, r, Math.PI, Math.PI / 2, true);
      shape.closePath();
      break;
    }
  }

  return shape;
}

/**
 * Ramer-Douglas-Peucker 2D polygon simplification
 */
function simplifyPolygon2D(points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
  if (points.length <= 3) return points;
  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lenSq = dx * dx + dy * dy;
    let dist = 0;
    if (lenSq === 0) {
      dist = Math.hypot(points[i].x - start.x, points[i].y - start.y);
    } else {
      let t = ((points[i].x - start.x) * dx + (points[i].y - start.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      dist = Math.hypot(points[i].x - (start.x + t * dx), points[i].y - (start.y + t * dy));
    }
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPolygon2D(points.slice(0, index + 1), tolerance);
    const right = simplifyPolygon2D(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

/**
 * Traces binary mask boundary and returns ordered polygon points
 */
function traceMaskContour(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { x: number; y: number }[] {
  let startX = -1;
  let startY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 128 || data[idx] > 128) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }

  if (startX === -1) return [];

  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  const contour: { x: number; y: number }[] = [];
  let currX = startX;
  let currY = startY;
  let dir = 7;

  const isSolid = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * 4;
    return data[idx + 3] > 128 || data[idx] > 128;
  };

  const maxSteps = width * height;
  let step = 0;

  do {
    contour.push({ x: currX, y: currY });
    let found = false;
    const checkDir = (dir + 5) % 8;
    for (let i = 0; i < 8; i++) {
      const nd = (checkDir + i) % 8;
      const nx = currX + dx[nd];
      const ny = currY + dy[nd];
      if (isSolid(nx, ny)) {
        currX = nx;
        currY = ny;
        dir = nd;
        found = true;
        break;
      }
    }
    if (!found) break;
    step++;
  } while ((currX !== startX || currY !== startY) && step < maxSteps);

  return contour;
}

/**
 * Generates true 2D Silhouette Shape following the artwork contours with custom margin and smoothing
 */
export function generateSilhouetteShape(
  parsed: any,
  config: KeychainConfig,
  customMargin?: number
): THREE.Shape {
  const margin = customMargin !== undefined ? customMargin : (config.contourMargin ?? 2.5);
  const fillHoles = config.fillContourHoles !== false;
  const smoothing = config.contourSmoothing ?? 2;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const allShapes: THREE.Shape[] = [];
  parsed.paths.forEach((p: any) => {
    const shapes = SVGLoader.createShapes(p);
    shapes.forEach((s) => {
      allShapes.push(s);
      s.getPoints().forEach((pt) => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });
    });
  });

  if (minX === Infinity || allShapes.length === 0) {
    return generateBaseShape("rounded_rect", config.targetWidth + margin * 2, config.targetHeight + margin * 2, config.baseBorderRadius);
  }

  const rawW = maxX - minX || 1;
  const rawH = maxY - minY || 1;
  const scale = Math.min(config.targetWidth / rawW, config.targetHeight / rawH);

  const totalW_mm = config.targetWidth + margin * 2 + 10;
  const totalH_mm = config.targetHeight + margin * 2 + 10;
  const pxPerMm = 6;
  const canvasW = Math.max(200, Math.min(800, Math.round(totalW_mm * pxPerMm)));
  const canvasH = Math.max(200, Math.min(800, Math.round(totalH_mm * pxPerMm)));

  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) {
    return generateBaseShape("rounded_rect", config.targetWidth + margin * 2, config.targetHeight + margin * 2, config.baseBorderRadius);
  }

  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return generateBaseShape("rounded_rect", config.targetWidth + margin * 2, config.targetHeight + margin * 2, config.baseBorderRadius);
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const rawMidX = (minX + maxX) / 2;
  const rawMidY = (minY + maxY) / 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1, margin * pxPerMm * 2);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  allShapes.forEach((s) => {
    const pts = s.getPoints();
    if (pts.length < 3) return;

    ctx.beginPath();
    pts.forEach((pt, idx) => {
      const x = cx + (pt.x - rawMidX) * scale * pxPerMm;
      const y = cy + (pt.y - rawMidY) * scale * pxPerMm;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    if (margin > 0) {
      ctx.stroke();
    }
  });

  const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imgData.data;

  if (fillHoles) {
    const visited = new Uint8Array(canvasW * canvasH);
    const queue: number[] = [0, canvasW - 1, (canvasH - 1) * canvasW, canvasW * canvasH - 1];
    queue.forEach(pos => visited[pos] = 1);

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      const qx = curr % canvasW;
      const qy = Math.floor(curr / canvasW);

      const neighbors = [
        [qx + 1, qy],
        [qx - 1, qy],
        [qx, qy + 1],
        [qx, qy - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];
        if (nx >= 0 && nx < canvasW && ny >= 0 && ny < canvasH) {
          const nIdx = ny * canvasW + nx;
          if (!visited[nIdx]) {
            const pIdx = nIdx * 4;
            if (data[pIdx] < 128 && data[pIdx + 3] < 128) {
              visited[nIdx] = 1;
              queue.push(nIdx);
            }
          }
        }
      }
    }

    for (let i = 0; i < canvasW * canvasH; i++) {
      if (!visited[i]) {
        const pIdx = i * 4;
        data[pIdx] = 255;
        data[pIdx + 1] = 255;
        data[pIdx + 2] = 255;
        data[pIdx + 3] = 255;
      }
    }
  }

  const rawContour = traceMaskContour(data, canvasW, canvasH);
  if (rawContour.length < 4) {
    return generateBaseShape("rounded_rect", config.targetWidth + margin * 2, config.targetHeight + margin * 2, config.baseBorderRadius);
  }

  const tolerancePx = Math.max(1.2, 1.8 + (5 - Math.min(5, smoothing)) * 0.6);
  const simplified = simplifyPolygon2D(rawContour, tolerancePx);

  const mmPoints = simplified.map(pt => ({
    x: (pt.x - cx) / pxPerMm,
    y: -(pt.y - cy) / pxPerMm
  }));

  if (mmPoints.length < 3) {
    return generateBaseShape("rounded_rect", config.targetWidth + margin * 2, config.targetHeight + margin * 2, config.baseBorderRadius);
  }

  const shape = new THREE.Shape();
  const n = mmPoints.length;

  if (smoothing > 0 && n >= 4) {
    const mid0 = {
      x: (mmPoints[0].x + mmPoints[1].x) / 2,
      y: (mmPoints[0].y + mmPoints[1].y) / 2
    };
    shape.moveTo(mid0.x, mid0.y);

    for (let i = 1; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const mid = {
        x: (mmPoints[i].x + mmPoints[nextIdx].x) / 2,
        y: (mmPoints[i].y + mmPoints[nextIdx].y) / 2
      };
      shape.quadraticCurveTo(mmPoints[i].x, mmPoints[i].y, mid.x, mid.y);
    }
    shape.quadraticCurveTo(mmPoints[0].x, mmPoints[0].y, mid0.x, mid0.y);
    shape.closePath();
  } else {
    shape.moveTo(mmPoints[0].x, mmPoints[0].y);
    for (let i = 1; i < n; i++) {
      shape.lineTo(mmPoints[i].x, mmPoints[i].y);
    }
    shape.closePath();
  }

  return shape;
}

/**
 * Calculates coordinates for keychain attachment ring
 */
export function getLoopCoordinates(
  pos: LoopPosition,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  customOffset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midY = (bounds.minY + bounds.maxY) / 2;

  switch (pos) {
    case "top_left":
      return { x: bounds.minX + w * 0.2, y: bounds.maxY };
    case "top_right":
      return { x: bounds.maxX - w * 0.2, y: bounds.maxY };
    case "left_center":
      return { x: bounds.minX, y: midY };
    case "right_center":
      return { x: bounds.maxX, y: midY };
    case "bottom_center":
      return { x: midX, y: bounds.minY };
    case "custom":
      return { x: midX + customOffset.x, y: midY + customOffset.y };
    case "top_center":
    default:
      return { x: midX, y: bounds.maxY };
  }
}

/**
 * Generates 3D Geometry for Keychain Loop / Eyelet Ring
 */
export function generateLoopGeometry(
  config: KeychainConfig,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): THREE.BufferGeometry | null {
  if (config.loopStyle === "none") return null;

  const loopPos = getLoopCoordinates(config.loopPosition, bounds, {
    x: config.loopCustomX,
    y: config.loopCustomY
  });

  const holeR = config.loopHoleDiameter / 2;
  const outerR = holeR + config.loopWallThickness;
  const height = config.loopHeight || config.baseThickness;

  const loopShape = new THREE.Shape();

  if (config.loopStyle === "external_tab") {
    // Protruding rounded tab with hole
    const tabCenterY = loopPos.y + outerR * 0.7;
    loopShape.absarc(loopPos.x, tabCenterY, outerR, 0, Math.PI * 2, false);

    // Cutout hole
    const hole = new THREE.Path();
    hole.absarc(loopPos.x, tabCenterY, holeR, 0, Math.PI * 2, true);
    loopShape.holes.push(hole);

    // Connector bridge to base
    const bridgeShape = new THREE.Shape();
    bridgeShape.moveTo(loopPos.x - outerR, loopPos.y - 2);
    bridgeShape.lineTo(loopPos.x + outerR, loopPos.y - 2);
    bridgeShape.lineTo(loopPos.x + outerR, tabCenterY);
    bridgeShape.lineTo(loopPos.x - outerR, tabCenterY);
    bridgeShape.closePath();

    const g1 = new THREE.ExtrudeGeometry(loopShape, { depth: height, bevelEnabled: false });
    const g2 = new THREE.ExtrudeGeometry(bridgeShape, { depth: height, bevelEnabled: false });
    return BufferGeometryUtils.mergeGeometries([g1, g2]);
  } else if (config.loopStyle === "top_eyelet") {
    // Elegant concentric eyelet ring
    const eyeletY = loopPos.y + outerR;
    loopShape.absarc(loopPos.x, eyeletY, outerR, 0, Math.PI * 2, false);

    const hole = new THREE.Path();
    hole.absarc(loopPos.x, eyeletY, holeR, 0, Math.PI * 2, true);
    loopShape.holes.push(hole);

    return new THREE.ExtrudeGeometry(loopShape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelSegments: 2
    });
  } else if (config.loopStyle === "integrated_hole") {
    // Inset hole inside base (reinforcement ring)
    const insetY = loopPos.y - outerR * 1.2;
    loopShape.absarc(loopPos.x, insetY, outerR, 0, Math.PI * 2, false);

    const hole = new THREE.Path();
    hole.absarc(loopPos.x, insetY, holeR, 0, Math.PI * 2, true);
    loopShape.holes.push(hole);

    return new THREE.ExtrudeGeometry(loopShape, { depth: height, bevelEnabled: false });
  }

  return null;
}

/**
 * Builds Full 3D Multipart Model Geometries for Keychain (Base + Color Layers + Ring)
 */
export function buildKeychainGeometries(
  svgString: string,
  config: KeychainConfig
): {
  baseGeometry: THREE.BufferGeometry | null;
  borderGeometry: THREE.BufferGeometry | null;
  loopGeometry: THREE.BufferGeometry | null;
  colorGeometries: { layer: ColorLayerConfig; geometry: THREE.BufferGeometry }[];
  overallBounds: { minX: number; maxX: number; minY: number; maxY: number; depth: number };
} {
  const loader = new SVGLoader();
  const parsed = loader.parse(svgString);

  // 1. Calculate SVG bounding box to scale to mm
  let rawMinX = Infinity, rawMaxX = -Infinity;
  let rawMinY = Infinity, rawMaxY = -Infinity;

  parsed.paths.forEach((p) => {
    const shapes = SVGLoader.createShapes(p);
    shapes.forEach((s) => {
      s.getPoints().forEach((pt) => {
        if (pt.x < rawMinX) rawMinX = pt.x;
        if (pt.x > rawMaxX) rawMaxX = pt.x;
        if (pt.y < rawMinY) rawMinY = pt.y;
        if (pt.y > rawMaxY) rawMaxY = pt.y;
      });
    });
  });

  if (rawMinX === Infinity) {
    rawMinX = 0; rawMaxX = 100;
    rawMinY = 0; rawMaxY = 100;
  }

  const rawW = rawMaxX - rawMinX || 1;
  const rawH = rawMaxY - rawMinY || 1;
  const scale = Math.min(config.targetWidth / rawW, config.targetHeight / rawH);

  const centerX = (rawMinX + rawMaxX) / 2;
  const centerY = (rawMinY + rawMaxY) / 2;

  // 2. Generate Color Layers
  const colorGeometries: { layer: ColorLayerConfig; geometry: THREE.BufferGeometry }[] = [];

  // Group SVG paths to layer configurations
  config.layers.forEach((layer) => {
    if (!layer.visible) return;

    const layerShapes: THREE.Shape[] = [];

    parsed.paths.forEach((p) => {
      const c = p.color || new THREE.Color("#000000");
      const hex = `#${c.getHexString().toUpperCase()}`;

      // Match layer by hex or active assignments
      if (hex === layer.originalHex.toUpperCase() || config.layers.length === 1) {
        const shapes = SVGLoader.createShapes(p);
        layerShapes.push(...shapes);
      }
    });

    if (layerShapes.length > 0) {
      const extrudeGeoms: THREE.BufferGeometry[] = [];
      const depth = Math.max(0.4, layer.extrusionHeight);

      layerShapes.forEach((shape) => {
        try {
          const g = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: 0.15,
            bevelSize: 0.15,
            bevelSegments: 1
          });
          extrudeGeoms.push(g);
        } catch {
          // fallback if shape is complex
        }
      });

      if (extrudeGeoms.length > 0) {
        const merged = extrudeGeoms.length === 1 
          ? extrudeGeoms[0] 
          : BufferGeometryUtils.mergeGeometries(extrudeGeoms, false);

        if (merged) {
          // Normalize to center & scale to mm
          merged.center();
          merged.scale(scale, -scale, 1); // SVG Y is flipped in 3D
          merged.computeVertexNormals();

          colorGeometries.push({
            layer,
            geometry: merged
          });
        }
      }
    }
  });

  // 3. Generate Base Plate Geometry
  const targetW = config.targetWidth + (config.contourMargin ?? 2.5) * 2;
  const targetH = config.targetHeight + (config.contourMargin ?? 2.5) * 2;

  let baseShape: THREE.Shape;
  if (config.baseShape === "contour") {
    baseShape = generateSilhouetteShape(parsed, config);
  } else {
    baseShape = generateBaseShape(config.baseShape, targetW, targetH, config.baseBorderRadius);
  }

  const baseGeometry = new THREE.ExtrudeGeometry(baseShape, {
    depth: config.baseThickness,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 2
  });
  baseGeometry.center();
  baseGeometry.computeVertexNormals();

  // 4. Generate Raised Border Geometry if enabled
  let borderGeometry: THREE.BufferGeometry | null = null;
  if (config.hasRaisedBorder) {
    let outerShape: THREE.Shape;
    let innerShape: THREE.Shape;

    if (config.baseShape === "contour") {
      outerShape = generateSilhouetteShape(parsed, config);
      innerShape = generateSilhouetteShape(
        parsed,
        config,
        Math.max(0.2, (config.contourMargin ?? 2.5) - config.raisedBorderWidth)
      );
    } else {
      outerShape = generateBaseShape(config.baseShape, targetW, targetH, config.baseBorderRadius);
      innerShape = generateBaseShape(
        config.baseShape,
        targetW - config.raisedBorderWidth * 2,
        targetH - config.raisedBorderWidth * 2,
        Math.max(1, config.baseBorderRadius - 1)
      );
    }

    // Create hollow rim
    const rimShape = outerShape;
    const holePath = new THREE.Path();
    innerShape.getPoints().forEach((pt, idx) => {
      if (idx === 0) holePath.moveTo(pt.x, pt.y);
      else holePath.lineTo(pt.x, pt.y);
    });
    holePath.closePath();
    rimShape.holes = [holePath];

    borderGeometry = new THREE.ExtrudeGeometry(rimShape, {
      depth: config.baseThickness + config.raisedBorderHeight,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelSegments: 1
    });
    borderGeometry.center();
    borderGeometry.computeVertexNormals();
  }

  // 5. Generate Loop Ring Geometry based on actual bounding box
  baseGeometry.computeBoundingBox();
  const bb = baseGeometry.boundingBox;
  const bounds = {
    minX: bb ? bb.min.x : -targetW / 2,
    maxX: bb ? bb.max.x : targetW / 2,
    minY: bb ? bb.min.y : -targetH / 2,
    maxY: bb ? bb.max.y : targetH / 2
  };

  const loopGeometry = generateLoopGeometry(config, bounds);

  return {
    baseGeometry,
    borderGeometry,
    loopGeometry,
    colorGeometries,
    overallBounds: {
      minX: bounds.minX,
      maxX: bounds.maxX,
      minY: bounds.minY,
      maxY: bounds.maxY,
      depth: Math.max(...config.layers.map(l => l.extrusionHeight), config.baseThickness)
    }
  };
}

/**
 * Exports Multicolor .3MF with individual colored objects for Bambu Studio, OrcaSlicer, PrusaSlicer
 */
export async function exportKeychainTo3MF(
  baseGeom: THREE.BufferGeometry | null,
  loopGeom: THREE.BufferGeometry | null,
  colorGeoms: { layer: ColorLayerConfig; geometry: THREE.BufferGeometry }[],
  config: KeychainConfig,
  modelName: string = "keychain"
): Promise<{ blob: Blob; filename: string; sizeBytes: number }> {
  const zip = new JSZip();

  // Combine Base & Loop if loop exists
  let fullBaseGeom = baseGeom;
  if (baseGeom && loopGeom) {
    fullBaseGeom = BufferGeometryUtils.mergeGeometries([baseGeom, loopGeom], false) || baseGeom;
  }

  // Build Objects XML
  let objectId = 1;
  const objectsXml: string[] = [];
  const buildItemsXml: string[] = [];
  const colorMapXml: string[] = [];

  // 1. Add Base Plate Object
  if (fullBaseGeom) {
    const baseObj = geometryTo3MFMesh(fullBaseGeom, objectId, `01_BasePlate_${config.baseColor.replace('#','')}`);
    objectsXml.push(baseObj);
    buildItemsXml.push(`    <item objectid="${objectId}" />`);
    colorMapXml.push(`      <m:color color="${config.baseColor}" />`);
    objectId++;
  }

  // 2. Add Color Layer Objects
  colorGeoms.forEach((cg, idx) => {
    const layerName = `0${idx + 2}_Layer_${cg.layer.name.replace(/[^a-zA-Z0-9_-]/g, '')}_AMS${cg.layer.amsSlot}`;
    const objStr = geometryTo3MFMesh(cg.geometry, objectId, layerName);
    objectsXml.push(objStr);
    buildItemsXml.push(`    <item objectid="${objectId}" />`);
    colorMapXml.push(`      <m:color color="${cg.layer.hex}" />`);
    objectId++;
  });

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${modelName}</metadata>
  <metadata name="Designer">Vértice Studio Keychain Maker</metadata>
  <metadata name="Application">KeychainMaker 3D Pro</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  <resources>
    <m:colorgroup id="1">
${colorMapXml.join("\n")}
    </m:colorgroup>
${objectsXml.join("\n")}
  </resources>
  <build>
${buildItemsXml.join("\n")}
  </build>
</model>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  zip.file("[Content_Types].xml", contentTypesXml);
  zip.folder("_rels")?.file(".rels", relsXml);
  zip.folder("3D")?.file("3dmodel.model", modelXml);

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  const cleanName = modelName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const filename = `${cleanName}_multicolor_${config.layers.length}colors.3mf`;

  return { blob, filename, sizeBytes: blob.size };
}

/**
 * Converts THREE.BufferGeometry into 3MF <object><mesh> XML tag
 */
function geometryTo3MFMesh(geometry: THREE.BufferGeometry, id: number, name: string): string {
  const geom = geometry.index ? geometry : geometry.toNonIndexed();
  const posAttr = geom.getAttribute("position");
  if (!posAttr) return "";

  const verticesXml: string[] = [];
  const trianglesXml: string[] = [];

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i).toFixed(4);
    const y = posAttr.getY(i).toFixed(4);
    const z = posAttr.getZ(i).toFixed(4);
    verticesXml.push(`          <vertex x="${x}" y="${y}" z="${z}" />`);
  }

  if (geom.index) {
    const indices = geom.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      trianglesXml.push(`          <triangle v1="${indices[i]}" v2="${indices[i + 1]}" v3="${indices[i + 2]}" />`);
    }
  } else {
    for (let i = 0; i < posAttr.count; i += 3) {
      trianglesXml.push(`          <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}" />`);
    }
  }

  return `    <object id="${id}" name="${name}" type="model">
      <mesh>
        <vertices>
${verticesXml.join("\n")}
        </vertices>
        <triangles>
${trianglesXml.join("\n")}
        </triangles>
      </mesh>
    </object>`;
}

/**
 * Exports separate STL files inside a ZIP for Multi-Material slicers
 */
export async function exportKeychainToMultiStlZip(
  baseGeom: THREE.BufferGeometry | null,
  loopGeom: THREE.BufferGeometry | null,
  colorGeoms: { layer: ColorLayerConfig; geometry: THREE.BufferGeometry }[],
  config: KeychainConfig,
  modelName: string = "keychain"
): Promise<{ blob: Blob; filename: string; sizeBytes: number }> {
  const zip = new JSZip();
  const exporter = new STLExporter();

  // Combine Base + Loop
  let fullBaseGeom = baseGeom;
  if (baseGeom && loopGeom) {
    fullBaseGeom = BufferGeometryUtils.mergeGeometries([baseGeom, loopGeom], false) || baseGeom;
  }

  if (fullBaseGeom) {
    const mesh = new THREE.Mesh(fullBaseGeom);
    const stlData = exporter.parse(mesh, { binary: true });
    const buffer = stlData instanceof DataView ? stlData.buffer : stlData;
    zip.file(`01_base_plate_${config.baseColor.replace('#','')}.stl`, new Uint8Array(buffer as ArrayBuffer));
  }

  colorGeoms.forEach((cg, idx) => {
    const mesh = new THREE.Mesh(cg.geometry);
    const stlData = exporter.parse(mesh, { binary: true });
    const buffer = stlData instanceof DataView ? stlData.buffer : stlData;
    const cleanLayer = cg.layer.name.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    zip.file(`0${idx + 2}_layer_${cleanLayer}_ams${cg.layer.amsSlot}.stl`, new Uint8Array(buffer as ArrayBuffer));
  });

  const readme = `# Vértice Studio - Keychain Maker 3D Print Package
=====================================================
Modelo: ${modelName}
Dimensões: ${config.targetWidth}mm x ${config.targetHeight}mm
Espessura da Base: ${config.baseThickness}mm
Cores Segmentadas: ${config.layers.length} cores

Instruções para Bambu Studio / OrcaSlicer / PrusaSlicer:
1. Selecione todos os arquivos .stl desta pasta simultaneamente.
2. Arraste e solte todos juntos na mesa do fatiador.
3. Quando perguntado "Carregar estes arquivos como um único objeto com múltiplas partes?", clique em "SIM".
4. Atribua cada parte ao filamento AMS correspondente no painel de objetos.
=====================================================
`;
  zip.file("README_SLICER_INSTRUCTIONS.txt", readme);

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  const cleanName = modelName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const filename = `${cleanName}_multibody_stls.zip`;

  return { blob, filename, sizeBytes: blob.size };
}

/**
 * Exports single unified STL for single color printing or manual layer-pause
 */
export async function exportKeychainToSingleSTL(
  baseGeom: THREE.BufferGeometry | null,
  loopGeom: THREE.BufferGeometry | null,
  colorGeoms: { layer: ColorLayerConfig; geometry: THREE.BufferGeometry }[],
  modelName: string = "keychain"
): Promise<{ blob: Blob; filename: string; sizeBytes: number }> {
  const geomsToMerge: THREE.BufferGeometry[] = [];

  if (baseGeom) geomsToMerge.push(baseGeom);
  if (loopGeom) geomsToMerge.push(loopGeom);
  colorGeoms.forEach(cg => geomsToMerge.push(cg.geometry));

  const merged = BufferGeometryUtils.mergeGeometries(geomsToMerge, false);
  if (!merged) throw new Error("Falha ao unir geometrias para STL unificado");

  const mesh = new THREE.Mesh(merged);
  const exporter = new STLExporter();
  const stlData = exporter.parse(mesh, { binary: true });
  const blob = new Blob([stlData], { type: "application/octet-stream" });

  const cleanName = modelName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const filename = `${cleanName}_single_unified.stl`;

  return { blob, filename, sizeBytes: blob.size };
}
