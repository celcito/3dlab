const THREE = require('three');
const shape = new THREE.Shape();
let w=8, d=8, r=1.5;
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

const geom = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 12 });
console.log(geom.attributes.position.count);
