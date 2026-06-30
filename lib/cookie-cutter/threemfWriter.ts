import * as THREE from "three";
import JSZip from "jszip";
import type { BambuProfile } from "./bambuProfile";

export async function write3MF(
  mesh: THREE.Mesh,
  bambuProfile: BambuProfile
): Promise<Blob> {
  const zip = new JSZip();

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel"/>
  <Default Extension="config" ContentType="application/vnd.ms-printing.printsettings+xml"/>
  <Default Extension="json" ContentType="application/json"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  const modelXml = generate3mfModel(mesh);
  const printerXml = generatePrinterConfig(bambuProfile.printerSettings);
  const filamentJson = JSON.stringify(bambuProfile.filamentSettings, null, 2);
  const modelConfig = generateModelConfig(bambuProfile.modelSettings);
  const sliceConfig = generateSliceConfig(bambuProfile.sliceSettings);

  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", rels);
  zip.file("3D/3dmodel.model", modelXml);
  zip.file("Metadata/printer_settings.json", printerXml);
  zip.file("Metadata/filament_settings.json", filamentJson);
  zip.file("Metadata/model_settings.config", modelConfig);
  zip.file("Metadata/slice_info.config", sliceConfig);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.ms-package.3dmanufacturing-3dmodel",
  });
}

function generate3mfModel(mesh: THREE.Mesh): string {
  const bbox = new THREE.Box3().setFromObject(mesh);
  const vertices: string[] = [];
  const triangles: string[] = [];

  mesh.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    if (!pos) return;
    const idx = child.geometry.index;
    const baseIdx = vertices.length;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      vertices.push(
        `    <vertex x="${x.toFixed(4)}" y="${y.toFixed(4)}" z="${z.toFixed(4)}"/>`
      );
    }

    const triCount = idx ? idx.count / 3 : pos.count / 3;
    for (let i = 0; i < triCount; i++) {
      const a = idx ? idx.getX(i * 3) + baseIdx : i * 3 + baseIdx;
      const b = idx ? idx.getX(i * 3 + 1) + baseIdx : i * 3 + 1 + baseIdx;
      const c = idx ? idx.getX(i * 3 + 2) + baseIdx : i * 3 + 2 + baseIdx;
      triangles.push(`    <triangle v1="${a}" v2="${b}" v3="${c}"/>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
       unit="millimeter"
       xml:lang="en-US">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${vertices.join("\n")}
        </vertices>
        <triangles>
${triangles.join("\n")}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`;
}

function generatePrinterConfig(ps: BambuProfile["printerSettings"]): string {
  return JSON.stringify(ps, null, 2);
}

function generateModelConfig(ms: BambuProfile["modelSettings"]): string {
  return JSON.stringify(ms, null, 2);
}

function generateSliceConfig(ss: BambuProfile["sliceSettings"]): string {
  return JSON.stringify(ss, null, 2);
}
