const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldExport = `      // 2. Walls
      const wallShape = createRoundedRectShape(w, d, r);
      const innerPath = createRoundedRectPath(w - t * 2, d - t * 2, Math.max(0, r - t));
      wallShape.holes.push(innerPath);
      const wallGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });
      wallGeom.translate(0, 0, t);
      geometries.push(wallGeom);`;

const newExport = `      // 2. Walls
      const leftShape = createLeftHalfShape(w, d, r, t);
      const rightShape = createRightHalfShape(w, d, r, t);
      
      const leftWallGeom = new THREE.ExtrudeGeometry(leftShape, { depth: h - t, bevelEnabled: false });
      leftWallGeom.translate(0, 0, t);
      geometries.push(leftWallGeom);
      
      const rightWallGeom = new THREE.ExtrudeGeometry(rightShape, { depth: h - t, bevelEnabled: false });
      rightWallGeom.translate(0, 0, t);
      geometries.push(rightWallGeom);`;

code = code.replace(oldExport, newExport);
fs.writeFileSync(path, code);
