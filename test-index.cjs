const THREE = require('three');

const shape = new THREE.Shape();
shape.moveTo(0,0);
shape.lineTo(1,0);
shape.lineTo(1,1);
shape.lineTo(0,1);
shape.closePath();

const extrudeGeom = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
const boxGeom = new THREE.BoxGeometry(1, 1, 1);

console.log("Extrude indexed:", !!extrudeGeom.index);
console.log("Box indexed:", !!boxGeom.index);
