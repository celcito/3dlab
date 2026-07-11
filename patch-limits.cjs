const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'dragLimits={[[-innerW/2 + t/2, innerW/2 - t/2], undefined, undefined]}',
  'dragLimits={[[-innerW/2 + t/2, innerW/2 - t/2], [0, 0], [0, 0]]}'
);

code = code.replace(
  'dragLimits={[undefined, [-innerD/2 + t/2, innerD/2 - t/2], undefined]}',
  'dragLimits={[[0, 0], [-innerD/2 + t/2, innerD/2 - t/2], [0, 0]]}'
);

fs.writeFileSync(path, code);
