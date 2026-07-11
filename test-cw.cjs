const THREE = require('three');
const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');

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

const innerW = 8 - 0.16 * 2;
const innerD = 8 - 0.16 * 2;
const r = 0.6;
const t = 0.16;

const p = createRoundedRectPath(innerW, innerD, Math.max(0, r - t));
const points = p.getPoints(10);
console.log(THREE.ShapeUtils.isClockWise(points));

