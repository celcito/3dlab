const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. handleExportSTL
const exportStackableCode = `      // 3. Dividers
      if (stackable) {
        const lipH = Math.min(t, 0.4);
        const lipW = innerW - 0.04;
        const lipD = innerD - 0.04;
        const lipR = Math.max(0, r - t - 0.02);
        const lipShape = createRoundedRectShape(lipW, lipD, lipR);
        const lipInnerW = lipW - t * 2;
        const lipInnerD = lipD - t * 2;
        if (lipInnerW > 0 && lipInnerD > 0) {
          const lipInnerR = Math.max(0, lipR - t);
          const lipInnerPath = createRoundedRectPath(lipInnerW, lipInnerD, lipInnerR);
          lipShape.holes.push(lipInnerPath);
        }
        const lipGeom = new THREE.ExtrudeGeometry(lipShape, { depth: lipH, bevelEnabled: false, curveSegments: 24 });
        lipGeom.translate(0, 0, -lipH);
        geometries.push(lipGeom);
      }
`;

code = code.replace(
  /\/\/ 3\. Dividers/,
  exportStackableCode
);

// 2. BinMesh destructure
code = code.replace(
  'const { width, depth, height, thickness, radius, dividersX, dividersY } = config;',
  'const { width, depth, height, thickness, radius, dividersX, dividersY, stackable } = config;'
);

// 3. BinMesh geometries
const binMeshGeomCode = `  const { baseGeom, wallGeom, lipGeom } = useMemo(() => {
    const baseShape = createRoundedRectShape(w, d, r);
    const bGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false, curveSegments: 24 });
    
    const wallShape = createRoundedRectShape(w, d, r);
    const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
    wallShape.holes.push(innerPath);
    const wGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false, curveSegments: 24 });

    let lGeom = null;
    if (stackable) {
      const lipH = Math.min(t, 0.4);
      const lipW = innerW - 0.04;
      const lipD = innerD - 0.04;
      const lipR = Math.max(0, r - t - 0.02);
      const lipShape = createRoundedRectShape(lipW, lipD, lipR);
      const lipInnerW = lipW - t * 2;
      const lipInnerD = lipD - t * 2;
      if (lipInnerW > 0 && lipInnerD > 0) {
        const lipInnerR = Math.max(0, lipR - t);
        const lipInnerPath = createRoundedRectPath(lipInnerW, lipInnerD, lipInnerR);
        lipShape.holes.push(lipInnerPath);
      }
      lGeom = new THREE.ExtrudeGeometry(lipShape, { depth: lipH, bevelEnabled: false, curveSegments: 24 });
    }

    return { baseGeom: bGeom, wallGeom: wGeom, lipGeom: lGeom };
  }, [w, d, h, t, r, innerW, innerD, stackable]);`;

code = code.replace(
  /const { baseGeom, wallGeom } = useMemo\(\(\) => \{[\s\S]*?return \{ baseGeom: bGeom, wallGeom: wGeom \};\n  \}, \[w, d, h, t, r, innerW, innerD\]\);/,
  binMeshGeomCode
);

// 4. BinMesh render
const binMeshRenderCode = `  const lipH = Math.min(t, 0.4);
  const zOffset = stackable ? lipH : 0;
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, zOffset, 0]}>
      {stackable && lipGeom && (
        <mesh castShadow receiveShadow position={[0, 0, -lipH]} geometry={lipGeom}>
          <meshStandardMaterial color={config.baseColor} roughness={0.4} />
          <Edges scale={1} threshold={15} color="rgba(0,0,0,0.2)" />
        </mesh>
      )}
      {/* Base */}`;

code = code.replace(
  /return \(\n    <group rotation=\{\[-Math.PI \/ 2, 0, 0\]\}>\n      \{\/\* Base \*\/\}/,
  binMeshRenderCode
);

fs.writeFileSync(path, code);
