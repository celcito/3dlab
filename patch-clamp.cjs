const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const r = radius \/ 10;/g, 'const r = Math.min(radius / 10, w / 2, d / 2);');

fs.writeFileSync(path, code);
