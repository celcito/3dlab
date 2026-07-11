const fs = require('fs');
const code = fs.readFileSync('node_modules/@react-three/drei/web/DragControls.d.ts', 'utf8');
console.log(code);
