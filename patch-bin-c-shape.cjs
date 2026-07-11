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

  const { baseGeom, leftWallGeom, rightWallGeom } = useMemo(() => {
    const baseShape = createRoundedRectShape(w, d, r);
    const bGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false });
    
    const leftShape = createLeftHalfShape(w, d, r, t);
    const lwGeom = new THREE.ExtrudeGeometry(leftShape, { depth: h - t, bevelEnabled: false });

    const rightShape = createRightHalfShape(w, d, r, t);
    const rwGeom = new THREE.ExtrudeGeometry(rightShape, { depth: h - t, bevelEnabled: false });

    return { baseGeom: bGeom, leftWallGeom: lwGeom, rightWallGeom: rwGeom };
  }, [w, d, h, t, r, innerW, innerD]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} geometry={baseGeom}>
        <meshStandardMaterial color={config.baseColor} roughness={0.4} />
      </mesh>
      
      {/* Walls */}
      <mesh castShadow receiveShadow position={[0, 0, t]} geometry={leftWallGeom}>
        <meshStandardMaterial color={config.baseColor} roughness={0.4} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, t]} geometry={rightWallGeom}>
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

const helpers = `
function createLeftHalfShape(w: number, d: number, r: number, t: number) {
  const shape = new THREE.Shape();
  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const innerR = Math.max(0, r - t);
  shape.moveTo(0, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  if (r > 0) shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  if (r > 0) shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  shape.lineTo(0, -d / 2);
  shape.lineTo(0, -innerD / 2);
  shape.lineTo(-innerW / 2 + innerR, -innerD / 2);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, -innerD / 2, -innerW / 2, -innerD / 2 + innerR);
  shape.lineTo(-innerW / 2, innerD / 2 - innerR);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, innerD / 2, -innerW / 2 + innerR, innerD / 2);
  shape.lineTo(0, innerD / 2);
  shape.lineTo(0, d / 2);
  return shape;
}
function createRightHalfShape(w: number, d: number, r: number, t: number) {
  const shape = new THREE.Shape();
  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const innerR = Math.max(0, r - t);
  shape.moveTo(0, d / 2);
  shape.lineTo(0, innerD / 2);
  shape.lineTo(innerW / 2 - innerR, innerD / 2);
  if (innerR > 0) shape.quadraticCurveTo(innerW / 2, innerD / 2, innerW / 2, innerD / 2 - innerR);
  shape.lineTo(innerW / 2, -innerD / 2 + innerR);
  if (innerR > 0) shape.quadraticCurveTo(innerW / 2, -innerD / 2, innerW / 2 - innerR, -innerD / 2);
  shape.lineTo(0, -innerD / 2);
  shape.lineTo(0, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  if (r > 0) shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  if (r > 0) shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(0, d / 2);
  return shape;
}
`;

code = code.replace(/\/\/ Utility Helpers/, '// Utility Helpers' + helpers);
fs.writeFileSync(path, code);
