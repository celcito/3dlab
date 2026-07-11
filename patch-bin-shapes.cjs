const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldShape = `function createRoundedRectShape(w: number, d: number, r: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return shape;
}`;

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
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return shape;
}`;

const oldPath = `function createRoundedRectPath(w: number, d: number, r: number) {
  const path = new THREE.Path();
  // Clockwise path for the hole
  path.moveTo(-w / 2 + r, d / 2);
  path.lineTo(w / 2 - r, d / 2);
  path.quadraticCurveTo(w / 2, d / 2, w / 2, d / 2 - r);
  path.lineTo(w / 2, -d / 2 + r);
  path.quadraticCurveTo(w / 2, -d / 2, w / 2 - r, -d / 2);
  path.lineTo(-w / 2 + r, -d / 2);
  path.quadraticCurveTo(-w / 2, -d / 2, -w / 2, -d / 2 + r);
  path.lineTo(-w / 2, d / 2 - r);
  path.quadraticCurveTo(-w / 2, d / 2, -w / 2 + r, d / 2);
  return path;
}`;

const newPath = `function createRoundedRectPath(w: number, d: number, r: number) {
  const path = new THREE.Path();
  if (r <= 0) {
    // Clockwise path for the hole
    path.moveTo(-w / 2, d / 2);
    path.lineTo(w / 2, d / 2);
    path.lineTo(w / 2, -d / 2);
    path.lineTo(-w / 2, -d / 2);
    path.lineTo(-w / 2, d / 2);
    return path;
  }
  // Clockwise path for the hole
  path.moveTo(-w / 2 + r, d / 2);
  path.lineTo(w / 2 - r, d / 2);
  path.quadraticCurveTo(w / 2, d / 2, w / 2, d / 2 - r);
  path.lineTo(w / 2, -d / 2 + r);
  path.quadraticCurveTo(w / 2, -d / 2, w / 2 - r, -d / 2);
  path.lineTo(-w / 2 + r, -d / 2);
  path.quadraticCurveTo(-w / 2, -d / 2, -w / 2, -d / 2 + r);
  path.lineTo(-w / 2, d / 2 - r);
  path.quadraticCurveTo(-w / 2, d / 2, -w / 2 + r, d / 2);
  return path;
}`;

code = code.replace(oldShape, newShape);
code = code.replace(oldPath, newPath);
fs.writeFileSync(path, code);
