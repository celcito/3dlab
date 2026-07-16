const fs = require('fs');
const path = 'src/pages/BeltGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync(path, code);
