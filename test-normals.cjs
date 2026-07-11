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

function createRoundedRectPath(w, d, r) {
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
  path.quadraticCurveTo(-w / 2, d / 2, -w / 2 + r, d / 2);
  path.lineTo(w / 2 - r, d / 2);
  path.quadraticCurveTo(w / 2, d / 2, w / 2, d / 2 - r);
  path.lineTo(w / 2, -d / 2 + r);
  path.quadraticCurveTo(w / 2, -d / 2, w / 2 - r, -d / 2);
  path.lineTo(-w / 2 + r, -d / 2);
  path.quadraticCurveTo(-w / 2, -d / 2, -w / 2, -d / 2 + r);
  return path;
}

const w = 8, d = 8, h = 4, t = 0.16, r = 0.6;
const innerW = w - t*2;
const innerD = d - t*2;

const wallShape = createRoundedRectShape(w, d, r);
const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
wallShape.holes.push(innerPath);

const geom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });
geom.computeVertexNormals();

let normals = geom.attributes.normal.array;
let hasNaN = false;
for (let i = 0; i < normals.length; i++) {
  if (isNaN(normals[i])) hasNaN = true;
}
console.log("Normals has NaN:", hasNaN);
