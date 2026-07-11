const THREE = require('three');

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
  path.absarc(-w / 2 + r, d / 2 - r, r, Math.PI, Math.PI / 2, true);
  path.lineTo(w / 2 - r, d / 2);
  path.absarc(w / 2 - r, d / 2 - r, r, Math.PI / 2, 0, true);
  path.lineTo(w / 2, -d / 2 + r);
  path.absarc(w / 2 - r, -d / 2 + r, r, 0, -Math.PI / 2, true);
  path.lineTo(-w / 2 + r, -d / 2);
  path.absarc(-w / 2 + r, -d / 2 + r, r, -Math.PI / 2, -Math.PI, true);
  return path;
}

const p = createRoundedRectPath(8, 8, 1);
console.log(p.getPoints(2).map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`).join(', '));
