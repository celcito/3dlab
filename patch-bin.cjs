const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

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

const oldBinMeshRegex = /function BinMesh\(\{ config \}: \{ config: BinConfig \}\) \{[\s\S]*?\n\}/g;
code = code.replace(oldBinMeshRegex, newBinMesh);

if (!code.includes('useMemo')) {
    code = code.replace('import { useState', 'import { useState, useMemo');
}

fs.writeFileSync(path, code);
