const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`      // 1. Base
      const baseShape = createRoundedRectShape(w, d, r);
      const baseGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false });
      geometries.push(baseGeom);

      // 2. Walls
      const wallShape = createRoundedRectShape(w, d, r);
      const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
      wallShape.holes.push(innerPath);
      const wallGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });
      wallGeom.translate(0, 0, t);
      geometries.push(wallGeom);

      // 3. Dividers
      const innerW = w - t * 2;
      const innerD = d - t * 2;
      const cellW = innerW / (dividersX + 1);
      const cellD = innerD / (dividersY + 1);`,
`      const innerW = w - t * 2;
      const innerD = d - t * 2;
      const cellW = innerW / (dividersX + 1);
      const cellD = innerD / (dividersY + 1);

      // 1. Base
      const baseShape = createRoundedRectShape(w, d, r);
      const baseGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false });
      geometries.push(baseGeom);

      // 2. Walls
      const wallShape = createRoundedRectShape(w, d, r);
      const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
      wallShape.holes.push(innerPath);
      const wallGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });
      wallGeom.translate(0, 0, t);
      geometries.push(wallGeom);

      // 3. Dividers`
);

fs.writeFileSync(path, code);
