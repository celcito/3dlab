const fs = require('fs');
const path = 'src/pages/FilamentPainter.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const geom = createLithophaneGeometry(imagePixels, width, height, maxZ, baseThickness);',
  'const geom = createLithophaneGeometryWithColors(imagePixels, width, height, maxZ, baseThickness, layers);'
);

fs.writeFileSync(path, code);
