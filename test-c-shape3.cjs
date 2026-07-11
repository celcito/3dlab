const THREE = require('three');
const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');

function createLeftHalfShapeCorrected(w, d, r, t) {
  const shape = new THREE.Shape();
  const innerW = w - t * 2;
  const innerD = d - t * 2;
  const innerR = Math.max(0, r - t);

  // Outer (CCW)
  shape.moveTo(0, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  if (r > 0) shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  if (r > 0) shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  shape.lineTo(0, -d / 2);
  
  // Inner (CW)
  shape.lineTo(0, -innerD / 2); // Inward seam
  
  // Actually, wait. From (0, -d/2) to (0, -innerD/2) is going UP.
  // To go CW around the inner hole (left half), we should go UP to top-center, then LEFT to top-left, DOWN to bottom-left, RIGHT to bottom-center.
  // Let's trace it:
  
  // From bottom-center (0, -innerD/2), go UP to top-center (0, innerD/2)
  shape.lineTo(0, innerD / 2);
  // From top-center, go LEFT to top-left
  shape.lineTo(-innerW / 2 + innerR, innerD / 2);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, innerD / 2, -innerW / 2, innerD / 2 - innerR);
  // From top-left, go DOWN to bottom-left
  shape.lineTo(-innerW / 2, -innerD / 2 + innerR);
  if (innerR > 0) shape.quadraticCurveTo(-innerW / 2, -innerD / 2, -innerW / 2 + innerR, -innerD / 2);
  // From bottom-left, go RIGHT to bottom-center
  shape.lineTo(0, -innerD / 2);
  
  // Outward seam
  shape.lineTo(0, -d / 2);
  
  return shape;
}
const shape = createLeftHalfShapeCorrected(8, 8, 0.6, 0.16);
const geom = new THREE.ExtrudeGeometry(shape, {depth: 4, bevelEnabled: false});
console.log("Geom vertices:", geom.attributes.position.count);
