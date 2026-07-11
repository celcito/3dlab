const THREE = require('three');
const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');

const shape = new THREE.Shape();
shape.moveTo(0,0);
shape.lineTo(1,0);
shape.lineTo(1,1);
shape.lineTo(0,1);
shape.closePath();

const extrudeGeom = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
const boxGeom = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();

try {
  const merged = BufferGeometryUtils.mergeGeometries([extrudeGeom, boxGeom]);
  if (!merged) throw new Error("Merged is null");
  console.log("Merge successful! Vertices:", merged.attributes.position.count);
} catch (e) {
  console.error("Merge failed:", e.message);
}
