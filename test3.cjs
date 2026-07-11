const THREE = require('three');
const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');
const STLExporter = require('three/examples/jsm/exporters/STLExporter.js').STLExporter;

function createRoundedRectShape(w, d, r) {
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
}
function createRoundedRectPath(w, d, r) {
  const path = new THREE.Path();
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
}

const w = 8, d = 8, h = 4, t = 0.16, r = 0.6;
const innerW = w - t * 2;
const innerD = d - t * 2;
const baseShape = createRoundedRectShape(w, d, r);
const bGeom = new THREE.ExtrudeGeometry(baseShape, { depth: t, bevelEnabled: false });

const wallShape = createRoundedRectShape(w, d, r);
const innerPath = createRoundedRectPath(innerW, innerD, Math.max(0.01, r - t));
wallShape.holes.push(innerPath);
const wGeom = new THREE.ExtrudeGeometry(wallShape, { depth: h - t, bevelEnabled: false });
wGeom.translate(0, 0, t);

const merged = BufferGeometryUtils.mergeGeometries([bGeom, wGeom]);
const mesh = new THREE.Mesh(merged);
const exporter = new STLExporter();
const result = exporter.parse(mesh);
const fs = require('fs');
fs.writeFileSync('test.stl', result);
console.log("Saved test.stl, size:", result.length);
