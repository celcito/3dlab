const fs = require('fs');
const path = 'src/pages/FilamentPainter.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const geom = createLithophaneGeometryWithColors(imagePixels, width, height, maxZ, baseThickness, layers);\n      const mesh = new THREE.Mesh(geom);',
  'const { geometry } = createLithophaneGeometryWithColors(imagePixels, width, height, maxZ, baseThickness, layers);\n      const mesh = new THREE.Mesh(geometry);'
);

fs.writeFileSync(path, code);
