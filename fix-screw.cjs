const fs = require('fs');
const path = 'src/pages/ScrewGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/\\`/g, '`');

fs.writeFileSync(path, code);
