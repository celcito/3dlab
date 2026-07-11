const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

const newShape = `function createRoundedRectShape(w: number, d: number, r: number) {
  const shape = new THREE.Shape();
  if (r <= 0) {
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.lineTo(-w / 2, -d / 2);
    return shape;
  }
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.absarc(w / 2 - r, -d / 2 + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w / 2, d / 2 - r);
  shape.absarc(w / 2 - r, d / 2 - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.absarc(-w / 2 + r, d / 2 - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.absarc(-w / 2 + r, -d / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  shape.closePath();
  return shape;
}`;

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
  path.absarc(-w / 2 + r, d / 2 - r, r, Math.PI, Math.PI / 2, true);
  path.lineTo(w / 2 - r, d / 2);
  path.absarc(w / 2 - r, d / 2 - r, r, Math.PI / 2, 0, true);
  path.lineTo(w / 2, -d / 2 + r);
  path.absarc(w / 2 - r, -d / 2 + r, r, 0, -Math.PI / 2, true);
  path.lineTo(-w / 2 + r, -d / 2);
  path.absarc(-w / 2 + r, -d / 2 + r, r, -Math.PI / 2, -Math.PI, true);
  return path;
}`;

code = code.replace(/function createRoundedRectShape[\s\S]*?return shape;\n\}/, newShape);
code = code.replace(/function createRoundedRectPath[\s\S]*?return path;\n\}/, newPath);

// Add curveSegments
code = code.replace(/\{ depth: t, bevelEnabled: false \}/g, '{ depth: t, bevelEnabled: false, curveSegments: 24 }');
code = code.replace(/\{ depth: h - t, bevelEnabled: false \}/g, '{ depth: h - t, bevelEnabled: false, curveSegments: 24 }');

fs.writeFileSync(path, code);
