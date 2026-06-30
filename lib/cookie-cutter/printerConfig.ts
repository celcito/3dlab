export interface SavedPrinter {
  id: string;
  name: string;
  type: "bambu-a1" | "bambu-x1" | "prusa-mk4" | "ender3-v2" | "custom";
  ip: string;
  accessCode: string;
}

const STORAGE_KEY = "cookie-cutter-printers";

export const defaultPrinterTypes = [
  { id: "bambu-a1", label: "Bambu Lab A1", buildVolume: "256 x 256 x 256" },
  { id: "bambu-x1", label: "Bambu Lab X1", buildVolume: "256 x 256 x 256" },
  { id: "prusa-mk4", label: "Prusa MK4", buildVolume: "250 x 210 x 220" },
  { id: "ender3-v2", label: "Ender 3 V2", buildVolume: "220 x 220 x 250" },
  { id: "custom", label: "Custom", buildVolume: "—" },
];

export function loadPrinters(): SavedPrinter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePrinter(p: SavedPrinter): void {
  const printers = loadPrinters().filter((x) => x.id !== p.id);
  printers.push(p);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
}

export function deletePrinter(id: string): void {
  const printers = loadPrinters().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
}
