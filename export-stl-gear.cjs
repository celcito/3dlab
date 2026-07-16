const fs = require('fs');
const path = 'src/pages/GearGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add STLExporter import
code = code.replace(
  'import * as THREE from "three";',
  'import * as THREE from "three";\nimport { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";'
);

// 2. Extract createGearGeometry function
const geomFunc = `
function createGearGeometry(config: GearConfig) {
  const shape = new THREE.Shape();
  
  // estimate circular pitch if module is used
  const cp = config.pitch_type === 'module' ? config.pitch_value * Math.PI : config.pitch_value;

  if (config.type === 'rack') {
    const length = config.rack_teeth * cp;
    const h = config.rack_height;
    const th = cp * 0.5;
    
    shape.moveTo(-length/2, 0);
    shape.lineTo(length/2, 0);
    shape.lineTo(length/2, h);
    
    // teeth
    for(let i=config.rack_teeth-1; i>=0; i--) {
      const xStart = (i * cp) - length/2;
      shape.lineTo(xStart + th, h);
      shape.lineTo(xStart + th*0.8, h + th*0.8);
      shape.lineTo(xStart + th*0.2, h + th*0.8);
      shape.lineTo(xStart, h);
    }
    shape.lineTo(-length/2, h);
    shape.lineTo(-length/2, 0);
    
  } else if (config.type === 'worm') {
    const r = config.worm_diam / 2;
    shape.moveTo(0,0);
    shape.absarc(0,0, r, 0, Math.PI*2, false);
  } else {
    const pr = (config.teeth * cp) / (Math.PI * 2);
    const outerR = pr + (cp / Math.PI);
    const rootR = pr - (cp / Math.PI) * 1.25;
    
    if (config.type === 'ring') {
      const extR = outerR + 10;
      shape.moveTo(0,0);
      shape.absarc(0,0, extR, 0, Math.PI*2, false);
      
      const hole = new THREE.Path();
      hole.absarc(0,0, outerR, 0, Math.PI*2, true);
      shape.holes.push(hole);
    } else {
      const numPts = config.teeth * 8;
      for (let i=0; i<=numPts; i++) {
        const a = (i/numPts) * Math.PI*2;
        const teethAngle = Math.PI*2 / config.teeth;
        const la = a % teethAngle;
        const t = la / teethAngle;
        let r = rootR;
        if (t > 0.1 && t < 0.4) r = THREE.MathUtils.lerp(rootR, outerR, (t-0.1)/0.3);
        else if (t >= 0.4 && t <= 0.6) r = outerR;
        else if (t > 0.6 && t < 0.9) r = THREE.MathUtils.lerp(outerR, rootR, (t-0.6)/0.3);
        
        if (i===0) shape.moveTo(Math.cos(a)*r, Math.sin(a)*r);
        else shape.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      
      if (config.hole_d > 0 && config.bore_type === 'round') {
        const hole = new THREE.Path();
        hole.absarc(0,0, config.hole_d/2, 0, Math.PI*2, true);
        shape.holes.push(hole);
      } else if (config.hole_d > 0 && config.bore_type === 'D') {
        const hole = new THREE.Path();
        const d = config.hole_d;
        hole.moveTo(d/2, d/2 * 0.5);
        hole.lineTo(d/2, -d/2);
        hole.lineTo(-d/2, -d/2);
        hole.lineTo(-d/2, d/2 * 0.5);
        hole.lineTo(d/2, d/2 * 0.5);
        shape.holes.push(hole);
      } else if (config.hole_d > 0 && config.bore_type === 'keyway') {
        const hole = new THREE.Path();
        hole.absarc(0,0, config.hole_d/2, 0, Math.PI*2, true);
        
        // keyway cutout
        const kw = config.hole_d * 0.25;
        const kh = config.hole_d * 0.25;
        hole.moveTo(kw/2, config.hole_d/2);
        hole.lineTo(kw/2, config.hole_d/2 + kh);
        hole.lineTo(-kw/2, config.hole_d/2 + kh);
        hole.lineTo(-kw/2, config.hole_d/2);
        
        shape.holes.push(hole);
      } else if (config.hole_d > 0 && config.bore_type === 'spline') {
        const hole = new THREE.Path();
        hole.absarc(0,0, config.hole_d/2, 0, Math.PI*2, true);
        shape.holes.push(hole);
      }
    }
  }
  
  const depth = config.type === 'worm' ? config.worm_length : config.thickness;
  const extrudeSettings = { depth, bevelEnabled: false, curveSegments: 32 };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  
  // Rotate bevel/crown gears for visual distinction
  if (config.type === 'bevel' || config.type === 'crown') {
    const positions = geometry.attributes.position;
    for(let i=0; i<positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // taper based on z to simulate bevel
      const factor = 1 - ((z + depth/2)/depth) * 0.5; 
      positions.setX(i, x * factor);
      positions.setY(i, y * factor);
    }
    geometry.computeVertexNormals();
  }
  
  geometry.rotateX(Math.PI/2);
  
  return geometry;
}
`;

// Replace PlaceholderGear's internal logic
code = code.replace(
  /function PlaceholderGear[\s\S]*?return \([\s\S]*?<\/mesh>\s*\);\s*\}/,
  geomFunc + '\nfunction PlaceholderGear({ config }: { config: GearConfig }) {\n  const geom = useMemo(() => createGearGeometry(config), [config]);\n\n  return (\n    <mesh castShadow receiveShadow geometry={geom}>\n      <meshStandardMaterial \n        color="#00E5FF" \n        metalness={0.8}\n        roughness={0.2}\n      />\n    </mesh>\n  );\n}'
);

// Add export function
code = code.replace(
  '  const handleDownloadScad = () => {',
  `  const handleExportSTL = () => {
    try {
      const exporter = new STLExporter();
      const geometry = createGearGeometry(config);
      const mesh = new THREE.Mesh(geometry);
      
      // Printable orientation
      mesh.rotation.x = -Math.PI / 2;
      mesh.updateMatrixWorld();

      const result = exporter.parse(mesh, { binary: true });
      const blob = new Blob([result], { type: "application/octet-stream" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = \`gear_preview_\${config.type}_\${Date.now()}.stl\`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar STL.");
    }
  };

  const handleDownloadScad = () => {`
);

// Add STL download button
code = code.replace(
  /<button\s+onClick=\{handleDownloadScad\}[\s\S]*?<\/button>/,
  `<div className="flex flex-col gap-2">
              <button
                onClick={handleExportSTL}
                className="w-full bg-[#00E5FF] text-black py-4 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)] group"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                Download Preview STL
              </button>
              <button
                onClick={handleDownloadScad}
                className="w-full bg-zinc-800 text-zinc-300 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all group"
              >
                <Code className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                Download OpenSCAD (.scad)
              </button>
              <p className="text-[9px] text-zinc-500 text-center uppercase tracking-wider px-2">
                O STL gerado é uma versão simplificada de preview. Para engenharia de precisão, utilize o arquivo .scad no OpenSCAD.
              </p>
            </div>`
);

fs.writeFileSync(path, code);
