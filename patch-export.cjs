const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

const exportRegex = /\/\/ 1\. Base[\s\S]*?\/\/ 4\. Inner Fillets/g;

const newExport = `// 1. Base
      const w = width / 10;
      const d = depth / 10;
      const h = height / 10;
      const t = thickness / 10;
      const r = radius / 10;

      const baseShape = createRoundedRectShape(w, d, r);
      const baseGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false });
      geometries.push(baseGeom);

      // 2. Walls
      const wallShape = createRoundedRectShape(w, d, r);
      const innerPath = createRoundedRectPath(w - t * 2, d - t * 2, Math.max(0, r - t));
      wallShape.holes.push(innerPath);
      const wallGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });
      wallGeom.translate(0, 0, t);
      geometries.push(wallGeom);

      // 3. Dividers
      const innerW = w - t * 2;
      const innerD = d - t * 2;
      const cellW = innerW / (dividersX + 1);
      const cellD = innerD / (dividersY + 1);

      // Dividers X (Vertical separators)
      for (let i = 1; i <= dividersX; i++) {
        const xPos = -innerW / 2 + cellW * i;
        const divXGeom = new THREE.BoxGeometry(t, innerD, h - t);
        divXGeom.translate(xPos, 0, h / 2 + t / 2);
        geometries.push(divXGeom);
      }

      // Dividers Y (Horizontal separators)
      for (let i = 1; i <= dividersY; i++) {
        const yPos = -innerD / 2 + cellD * i;
        const divYGeom = new THREE.BoxGeometry(innerW, t, h - t);
        divYGeom.translate(0, yPos, h / 2 + t / 2);
        geometries.push(divYGeom);
      }

      // 4. Inner Fillets`;

code = code.replace(exportRegex, newExport);

fs.writeFileSync(path, code);
