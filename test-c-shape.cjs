const THREE = require('three');

function createLeftHalfShape(w, d, r, t) {
  const shape = new THREE.Shape();
  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const innerR = Math.max(0, r - t);

  // Outer Top Center
  shape.moveTo(0, d / 2);
  // Outer Top Left
  shape.lineTo(-w / 2 + r, d / 2);
  if (r > 0) shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  // Outer Bottom Left
  shape.lineTo(-w / 2, -d / 2 + r);
  if (r > 0) shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  // Outer Bottom Center
  shape.lineTo(0, -d / 2);
  
  // Inner Bottom Center
  shape.lineTo(0, -innerD / 2);
  // Inner Bottom Left
  shape.lineTo(-innerW / 2 + innerR, -innerD / 2);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, -innerD / 2, -innerW / 2, -innerD / 2 + innerR);
  // Inner Top Left
  shape.lineTo(-innerW / 2, innerD / 2 - innerR);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, innerD / 2, -innerW / 2 + innerR, innerD / 2);
  // Inner Top Center
  shape.lineTo(0, innerD / 2);
  
  // Back to Outer Top Center
  shape.lineTo(0, d / 2);

  return shape;
}

function createRightHalfShape(w, d, r, t) {
  const shape = new THREE.Shape();
  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const innerR = Math.max(0, r - t);

  // Outer Top Center
  shape.moveTo(0, d / 2);
  // Inner Top Center
  shape.lineTo(0, innerD / 2);
  // Inner Top Right
  shape.lineTo(innerW / 2 - innerR, innerD / 2);
  if (innerR > 0) shape.quadraticCurveTo(innerW / 2, innerD / 2, innerW / 2, innerD / 2 - innerR);
  // Inner Bottom Right
  shape.lineTo(innerW / 2, -innerD / 2 + innerR);
  if (innerR > 0) shape.quadraticCurveTo(innerW / 2, -innerD / 2, innerW / 2 - innerR, -innerD / 2);
  // Inner Bottom Center
  shape.lineTo(0, -innerD / 2);

  // Outer Bottom Center
  shape.lineTo(0, -d / 2);
  // Outer Bottom Right
  shape.lineTo(w / 2 - r, -d / 2);
  if (r > 0) shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  // Outer Top Right
  shape.lineTo(w / 2, d / 2 - r);
  if (r > 0) shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  // Outer Top Center
  shape.lineTo(0, d / 2);

  return shape;
}

const w = 8, d = 8, r = 0.6, t = 0.16;
const left = createLeftHalfShape(w, d, r, t);
const right = createRightHalfShape(w, d, r, t);
const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');

const leftGeom = new THREE.ExtrudeGeometry(left, { depth: 4, bevelEnabled: false });
const rightGeom = new THREE.ExtrudeGeometry(right, { depth: 4, bevelEnabled: false });
const merged = BufferGeometryUtils.mergeGeometries([leftGeom, rightGeom]);
console.log("Vertices:", merged.attributes.position.count);

