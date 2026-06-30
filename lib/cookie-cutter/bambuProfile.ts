import type { CutterParams } from "./cutterParams";
import { getFilamentDensity } from "./cutterParams";

export interface BambuProfile {
  printerSettings: {
    machine: string;
    nozzle_diameter: string;
    bed_shape: string;
    gcode_flavor: string;
  };
  filamentSettings: {
    filament_diameter: string;
    nozzle_temperature: number;
    bed_temperature: number;
    filament_density: number;
  };
  modelSettings: {
    plate_layout: string;
    model_count: number;
  };
  sliceSettings: {
    layer_height: string;
    infill_density: string;
    infill_pattern: string;
    wall_loops: number;
    brim_width: string;
    support: string;
    bottom_shell_layers: number;
    top_shell_layers: number;
  };
}

const MATERIAL_TEMPS: Record<
  string,
  { nozzle: number; bed: number }
> = {
  PLA: { nozzle: 220, bed: 60 },
  PETG: { nozzle: 240, bed: 80 },
  ABS: { nozzle: 250, bed: 100 },
  TPU: { nozzle: 220, bed: 60 },
};

export function generateBambuProfile(
  params: CutterParams
): BambuProfile {
  const material = params.filament.material;
  const temps = MATERIAL_TEMPS[material] || MATERIAL_TEMPS.PLA;
  const density = getFilamentDensity(material);

  return {
    printerSettings: {
      machine: "Bambu Lab A1",
      nozzle_diameter: "0.4",
      bed_shape: "0x0,220x0,220x220,0x220",
      gcode_flavor: "marlin2",
    },
    filamentSettings: {
      filament_diameter: "1.75",
      nozzle_temperature: temps.nozzle,
      bed_temperature: temps.bed,
      filament_density: density,
    },
    modelSettings: {
      plate_layout: "center",
      model_count: 1,
    },
    sliceSettings: {
      layer_height: "0.2",
      infill_density: "15%",
      infill_pattern: "gyroid",
      wall_loops: 3,
      brim_width: "5",
      support: "auto",
      bottom_shell_layers: 3,
      top_shell_layers: 4,
    },
  };
}
