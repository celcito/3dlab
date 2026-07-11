const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add divPositions to BinConfig
if (!code.includes('divPositionsX')) {
  code = code.replace(
    'dividersY: number;',
    'dividersY: number;\n  divPositionsX?: number[];\n  divPositionsY?: number[];'
  );
}

// 2. Modify handleExportSTL dividers logic
code = code.replace(
  /\/\/ Dividers X \(Vertical separators\)[\s\S]*?\/\/ 4\. Inner Fillets/,
  `// Dividers X (Vertical separators)
      for (let i = 0; i < dividersX; i++) {
        let posX = (i + 1) / (dividersX + 1);
        if (config.divPositionsX && config.divPositionsX.length === dividersX) {
          posX = config.divPositionsX[i];
        }
        const xPos = -innerW / 2 + innerW * posX;
        const divXGeom = new THREE.BoxGeometry(t, innerD, h - t);
        divXGeom.translate(xPos, 0, h / 2 + t / 2);
        geometries.push(divXGeom.toNonIndexed());
      }

      // Dividers Y (Horizontal separators)
      for (let i = 0; i < dividersY; i++) {
        let posY = (i + 1) / (dividersY + 1);
        if (config.divPositionsY && config.divPositionsY.length === dividersY) {
          posY = config.divPositionsY[i];
        }
        const yPos = -innerD / 2 + innerD * posY;
        const divYGeom = new THREE.BoxGeometry(innerW, t, h - t);
        divYGeom.translate(0, yPos, h / 2 + t / 2);
        geometries.push(divYGeom.toNonIndexed());
      }

      // 4. Inner Fillets`
);

fs.writeFileSync(path, code);
