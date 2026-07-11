const THREE = require('three');

function createRoundedRectShape(w, d, r) {
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
}
const shape = createRoundedRectShape(8, 8, 0.6);
const points = shape.getPoints(10);
console.log("Shape is CCW:", !THREE.ShapeUtils.isClockWise(points));
