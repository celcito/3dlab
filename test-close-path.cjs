const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/return shape;\n\}/g, 'shape.closePath();\n  return shape;\n}');
code = code.replace(/return path;\n\}/g, 'path.closePath();\n  return path;\n}');

fs.writeFileSync(path, code);
