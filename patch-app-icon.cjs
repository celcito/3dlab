const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'Flower } from "lucide-react";',
  'Flower, Settings2 } from "lucide-react";'
);

fs.writeFileSync(path, code);
