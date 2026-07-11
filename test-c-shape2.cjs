const THREE = require('three');
const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');

function createLeftHalfShape(w, d, r, t) {
  const shape = new THREE.Shape();
  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const innerR = Math.max(0, r - t);

  shape.moveTo(0, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  if (r > 0) shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  if (r > 0) shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  shape.lineTo(0, -d / 2);
  
  shape.lineTo(0, -innerD / 2);
  shape.lineTo(-innerW / 2 + innerR, -innerD / 2);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, -innerD / 2, -innerW / 2, -innerD / 2 + innerR);
  shape.lineTo(-innerW / 2, innerD / 2 - innerR);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, innerD / 2, -innerW / 2 + innerR, innerD / 2);
  shape.lineTo(0, innerD / 2);
  
  shape.lineTo(0, d / 2);
  return shape;
}
const shape = createLeftHalfShape(8, 8, 0.6, 0.16);
console.log(THREE.ShapeUtils.isClockWise(shape.extractPoints(10).shape));
