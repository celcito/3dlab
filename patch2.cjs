const fs = require('fs');
const path = 'src/pages/FilamentPainter.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const result = exporter.parse(scene, { binary: true });',
  'const result = exporter.parse(scene);'
);

code = code.replace(
  'const blob = new Blob([result], { type: "application/octet-stream" });',
  'const blob = new Blob([result], { type: "text/plain" });'
);

fs.writeFileSync(path, code);
