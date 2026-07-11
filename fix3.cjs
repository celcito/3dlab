const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

// Using regex to fix the exact structure
const regex = /\s*\/\/ 1\. Base[\s\S]*?\/\/ 3\. Dividers\s*const innerW = w \- t \* 2;\s*const innerD = d \- t \* 2;\s*const cellW = innerW \/ \(dividersX \+ 1\);\s*const cellD = innerD \/ \(dividersY \+ 1\);/m;

const replacement = `
      const innerW = w - t * 2;
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

      // 3. Dividers`;

code = code.replace(regex, replacement);

fs.writeFileSync(path, code);
