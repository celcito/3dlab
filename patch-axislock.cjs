const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/axisLock="x"\s*/g, '');
code = code.replace(/axisLock="y"\s*/g, '');

fs.writeFileSync(path, code);
