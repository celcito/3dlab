export interface HandlesConfig {
  enabled: boolean;
  autoThreshold: number;
  type: "loop" | "tab";
  width: number;
  thickness: number;
  count: 1 | 2;
}

export interface ReinforcementsConfig {
  auto: boolean;
  spacing: number;
  thickness: number;
}

export interface FilamentConfig {
  material: "PLA" | "PETG" | "ABS" | "TPU";
  density: number;
  costPerKg: number;
}

export interface CutterParams {
  scale: number;
  height: number;
  stampHeight: number;
  stampGap: number;
  wallThickness: number;
  bladeThickness: number;
  baseThickness: number;
  supportEdgeThickness: number;
  cornerRadius: number;
  innerOffset: number;
  outerOffset: number;
  minRadius: number;
  minPrintThickness: number;
  tolerance: number;
  handles: HandlesConfig;
  reinforcements: ReinforcementsConfig;
  printProfile: string;
  filament: FilamentConfig;
}

export interface PrintProfile {
  id: string;
  name: string;
  brand: string;
  buildVolume: { x: number; y: number; z: number };
  nozzleDiameter: number;
  minWallThickness: number;
  minBladeThickness: number;
  minBaseThickness: number;
  minRadius: number;
  maxLayerHeight: number;
  isCustom: boolean;
}

export interface ValidationResult {
  warnings: string[];
  errors: string[];
}

export const DEFAULT_PARAMS: CutterParams = {
  scale: 1,
  height: 25,
  stampHeight: 8,
  stampGap: 0,
  wallThickness: 1.5,
  bladeThickness: 1.0,
  baseThickness: 0,
  supportEdgeThickness: 0,
  cornerRadius: 2,
  innerOffset: 0,
  outerOffset: 0,
  minRadius: 1,
  minPrintThickness: 0.8,
  tolerance: 0.2,
  handles: {
    enabled: true,
    autoThreshold: 50,
    type: "loop",
    width: 20,
    thickness: 3,
    count: 1,
  },
  reinforcements: {
    auto: false,
    spacing: 40,
    thickness: 2,
  },
  printProfile: "ender3-v2",
  filament: {
    material: "PLA",
    density: 1.24,
    costPerKg: 80,
  },
};

export const PRESETS: { name: string; params: Partial<CutterParams> }[] = [
  { name: "Fino 0.8mm", params: { wallThickness: 0.8, bladeThickness: 0.4 } },
  { name: "Robusto 1.6mm", params: { wallThickness: 1.6, bladeThickness: 1.0 } },
  { name: "Hobby", params: { height: 20, wallThickness: 1.2, bladeThickness: 0.8 } },
  { name: "Pro", params: { height: 40, wallThickness: 2.0, bladeThickness: 1.5 } },
];

const FILAMENT_DENSITIES: Record<string, number> = {
  PLA: 1.24,
  PETG: 1.27,
  ABS: 1.04,
  TPU: 1.22,
};

export function validateParams(
  params: CutterParams,
  profile?: PrintProfile
): ValidationResult {
  const result: ValidationResult = { warnings: [], errors: [] };

  if (params.wallThickness < 0.4) result.errors.push("Espessura da parede muito fina (< 0.4mm)");
  if (params.wallThickness > 10) result.warnings.push("Espessura da parede muito grossa");
  if (params.bladeThickness < 0.2) result.errors.push("Espessura da lâmina muito fina (< 0.2mm)");
  if (params.height < 2) result.errors.push("Altura do cortador muito baixa");
  if (params.height > 150) result.warnings.push("Altura do cortador muito alta");
  if (params.stampHeight < 1) result.warnings.push("Altura do carimbo muito baixa");
  if (params.stampHeight > params.height) result.warnings.push("Carimbo mais alto que a parede do cortador");

  if (profile) {
    if (params.wallThickness < profile.minWallThickness)
      result.warnings.push(`Parede abaixo do minimo do perfil ${profile.name} (${profile.minWallThickness}mm)`);
    if (params.bladeThickness < profile.minBladeThickness)
      result.warnings.push(`Lâmina abaixo do minimo do perfil ${profile.name} (${profile.minBladeThickness}mm)`);
  }

  return result;
}

export function applyProfile(
  params: CutterParams,
  profile: PrintProfile
): CutterParams {
  return {
    ...params,
    wallThickness: Math.max(params.wallThickness, profile.minWallThickness),
    bladeThickness: Math.max(params.bladeThickness, profile.minBladeThickness),
    baseThickness: Math.max(params.baseThickness, profile.minBaseThickness),
    minRadius: Math.max(params.minRadius, profile.minRadius),
    printProfile: profile.id,
  };
}

export interface PrintEstimate {
  volumeCm3: number;
  weightG: number;
  filamentLengthM: number;
  printTimeH: number;
  costBRL: number;
}

export function getFilamentDensity(material: string): number {
  return FILAMENT_DENSITIES[material] ?? 1.24;
}
