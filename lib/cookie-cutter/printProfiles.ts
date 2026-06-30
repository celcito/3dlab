import type { PrintProfile } from "./cutterParams";

export const BUILTIN_PROFILES: PrintProfile[] = [
  {
    id: "ender3-v2",
    name: "Ender 3 V2",
    brand: "Creality",
    buildVolume: { x: 220, y: 220, z: 250 },
    nozzleDiameter: 0.4,
    minWallThickness: 0.8,
    minBladeThickness: 0.4,
    minBaseThickness: 0,
    minRadius: 0.4,
    maxLayerHeight: 0.2,
    isCustom: false,
  },
  {
    id: "prusa-mk4",
    name: "Prusa MK4",
    brand: "Prusa",
    buildVolume: { x: 250, y: 210, z: 220 },
    nozzleDiameter: 0.4,
    minWallThickness: 0.8,
    minBladeThickness: 0.4,
    minBaseThickness: 0,
    minRadius: 0.4,
    maxLayerHeight: 0.2,
    isCustom: false,
  },
  {
    id: "bambu-x1",
    name: "Bambu Lab X1",
    brand: "Bambu Lab",
    buildVolume: { x: 256, y: 256, z: 256 },
    nozzleDiameter: 0.4,
    minWallThickness: 0.8,
    minBladeThickness: 0.4,
    minBaseThickness: 0,
    minRadius: 0.4,
    maxLayerHeight: 0.2,
    isCustom: false,
  },
  {
    id: "bambu-a1",
    name: "Bambu Lab A1",
    brand: "Bambu Lab",
    buildVolume: { x: 256, y: 256, z: 256 },
    nozzleDiameter: 0.4,
    minWallThickness: 0.8,
    minBladeThickness: 0.4,
    minBaseThickness: 0,
    minRadius: 0.4,
    maxLayerHeight: 0.2,
    isCustom: false,
  },
  {
    id: "voron-24",
    name: "Voron 2.4",
    brand: "Voron",
    buildVolume: { x: 350, y: 350, z: 350 },
    nozzleDiameter: 0.6,
    minWallThickness: 1.2,
    minBladeThickness: 0.6,
    minBaseThickness: 0,
    minRadius: 0.6,
    maxLayerHeight: 0.3,
    isCustom: false,
  },
  {
    id: "anycubic-kobra2",
    name: "Anycubic Kobra 2",
    brand: "Anycubic",
    buildVolume: { x: 250, y: 220, z: 220 },
    nozzleDiameter: 0.4,
    minWallThickness: 0.8,
    minBladeThickness: 0.4,
    minBaseThickness: 0,
    minRadius: 0.4,
    maxLayerHeight: 0.2,
    isCustom: false,
  },
];

const STORAGE_KEY = "cookie-cutter-custom-profiles";

export function loadCustomProfiles(): PrintProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((p: PrintProfile) => ({ ...p, isCustom: true })) : [];
  } catch {
    return [];
  }
}

export function saveCustomProfile(profile: PrintProfile): void {
  const profiles = loadCustomProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = { ...profile, isCustom: true };
  } else {
    profiles.push({ ...profile, isCustom: true });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function deleteCustomProfile(id: string): void {
  const profiles = loadCustomProfiles().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getAllProfiles(): PrintProfile[] {
  return [...BUILTIN_PROFILES, ...loadCustomProfiles()];
}

export function getProfileById(id: string): PrintProfile | undefined {
  return getAllProfiles().find((p) => p.id === id);
}
