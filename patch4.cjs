const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '// Utility Helpers\nfunction createRoundedRectShape(w: number, d: number, r: number) {',
  `// Utility Helpers
function createRoundedRectShape(w: number, d: number, r: number) {`
);

fs.writeFileSync(path, code);
