const THREE = require('three');
const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');

function createRoundedRectShape(w, d, r) {
  const shape = new THREE.Shape();
  if (r <= 0) {
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.lineTo(-w / 2, -d / 2);
    shape.closePath();
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
  shape.closePath();
  return shape;
}

const w = 8, d = 8, h = 4, t = 0.16, r = 0.6;
const baseShape = createRoundedRectShape(w, d, r);
const bGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false });

console.log("Base geom vertices:", bGeom.attributes.position.count);
