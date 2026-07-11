const fs = require('fs');
const code = fs.readFileSync('node_modules/@react-three/drei/web/DragControls.js', 'utf8');
const usesGroup = code.includes('group');
console.log(usesGroup);
