const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace createRoundedRectPath
const oldPathRegex = /function createRoundedRectPath[\s\S]*?return path;\n\}/;
const newPath = `function createRoundedRectPath(w: number, d: number, r: number) {
  const path = new THREE.Path();
  if (r <= 0) {
    path.moveTo(-w / 2, -d / 2);
    path.lineTo(-w / 2, d / 2);
    path.lineTo(w / 2, d / 2);
    path.lineTo(w / 2, -d / 2);
    path.lineTo(-w / 2, -d / 2);
    return path;
  }
  path.moveTo(-w / 2, -d / 2 + r);
  path.lineTo(-w / 2, d / 2 - r);
  path.quadraticCurveTo(-w / 2, d / 2, -w / 2 + r, d / 2);
  path.lineTo(w / 2 - r, d / 2);
  path.quadraticCurveTo(w / 2, d / 2, w / 2, d / 2 - r);
  path.lineTo(w / 2, -d / 2 + r);
  path.quadraticCurveTo(w / 2, -d / 2, w / 2 - r, -d / 2);
  path.lineTo(-w / 2 + r, -d / 2);
  path.quadraticCurveTo(-w / 2, -d / 2, -w / 2, -d / 2 + r);
  return path;
}`;
code = code.replace(oldPathRegex, newPath);

// Remove createLeftHalfShape and createRightHalfShape
code = code.replace(/function createLeftHalfShape[\s\S]*?return shape;\n\}/, '');
code = code.replace(/function createRightHalfShape[\s\S]*?return shape;\n\}/, '');

// Revert BinMesh
const newBinMesh = `function BinMesh({ config }: { config: BinConfig }) {
  const { width, depth, height, thickness, radius, dividersX, dividersY } = config;
  
  const w = width / 10;
  const d = depth / 10;
  const h = height / 10;
  const t = thickness / 10;
  const r = radius / 10;

  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const cellW = innerW / (dividersX + 1);
  const cellD = innerD / (dividersY + 1);

  const { baseGeom, wallGeom } = useMemo(() => {
    const baseShape = createRoundedRectShape(w, d, r);
    const bGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false });
    
    const wallShape = createRoundedRectShape(w, d, r);
    const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
    wallShape.holes.push(innerPath);
    const wGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });

    return { baseGeom: bGeom, wallGeom: wGeom };
  }, [w, d, h, t, r, innerW, innerD]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} geometry={baseGeom}>
        <meshStandardMaterial color={config.baseColor} roughness={0.4} />
      </mesh>
      
      {/* Walls */}
      <mesh castShadow receiveShadow position={[0, 0, t]} geometry={wallGeom}>
        <meshStandardMaterial color={config.baseColor} roughness={0.4} />
      </mesh>

      {/* Dividers X */}
      {Array.from({ length: dividersX }).map((_, i) => {
        const xPos = -innerW / 2 + cellW * (i + 1);
        return (
          <mesh key={\`divx-\${i}\`} position={[xPos, 0, h / 2 + t / 2]} castShadow>
            <boxGeometry args={[t, innerD, h - t]} />
            <meshStandardMaterial color={config.baseColor} roughness={0.5} />
          </mesh>
        );
      })}

      {/* Dividers Y */}
      {Array.from({ length: dividersY }).map((_, i) => {
        const yPos = -innerD / 2 + cellD * (i + 1);
        return (
          <mesh key={\`divy-\${i}\`} position={[0, yPos, h / 2 + t / 2]} castShadow>
            <boxGeometry args={[innerW, t, h - t]} />
            <meshStandardMaterial color={config.baseColor} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}`;
code = code.replace(/function BinMesh\(\{ config \}: \{ config: BinConfig \}\) \{[\s\S]*?\n\}/, newBinMesh);

// Revert exportSTL
const oldExportRegex = /\/\/ 2\. Walls[\s\S]*?\/\/ 3\. Dividers/m;
const newExport = `// 2. Walls
      const wallShape = createRoundedRectShape(w, d, r);
      const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
      wallShape.holes.push(innerPath);
      const wallGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });
      wallGeom.translate(0, 0, t);
      geometries.push(wallGeom);

      // 3. Dividers`;
code = code.replace(oldExportRegex, newExport);

// Update UI text for columns and rows
code = code.replace(/<label className="text-\[9px\] uppercase font-bold text-zinc-600">Divisórias em X<\/label>/, '<label className="text-[9px] uppercase font-bold text-zinc-600">Colunas</label>');
code = code.replace(/<label className="text-\[9px\] uppercase font-bold text-zinc-600">Divisórias em Y<\/label>/, '<label className="text-[9px] uppercase font-bold text-zinc-600">Linhas</label>');

code = code.replace(/<span className="text-\[10px\] font-mono text-\[#00E5FF\]">\{config\.dividersX\}<\/span>/, '<span className="text-[10px] font-mono text-[#00E5FF]">{config.dividersX + 1}</span>');
code = code.replace(/<span className="text-\[10px\] font-mono text-\[#00E5FF\]">\{config\.dividersY\}<\/span>/, '<span className="text-[10px] font-mono text-[#00E5FF]">{config.dividersY + 1}</span>');

code = code.replace(/onChange=\{\(e\) => setConfig\(\{\.\.\.config, dividersX: parseInt\(e\.target\.value\)\}\)\}/, 'onChange={(e) => setConfig({...config, dividersX: parseInt(e.target.value) - 1})}');
code = code.replace(/onChange=\{\(e\) => setConfig\(\{\.\.\.config, dividersY: parseInt\(e\.target\.value\)\}\)\}/, 'onChange={(e) => setConfig({...config, dividersY: parseInt(e.target.value) - 1})}');

code = code.replace(/min="0" max="8"/g, 'min="1" max="9"');
code = code.replace(/value=\{config\.dividersX\}/, 'value={config.dividersX + 1}');
code = code.replace(/value=\{config\.dividersY\}/, 'value={config.dividersY + 1}');

fs.writeFileSync(path, code);
