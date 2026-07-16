const fs = require('fs');
const path = 'src/pages/PulleyGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'if (flange_type == "both" || flange_type == "bottom") {',
  'if (flange_type == "both") {'
);

code = code.replace(
  "if (config.flange_type === 'both' || config.flange_type === 'bottom') {",
  "if (config.flange_type === 'both') {"
);

fs.writeFileSync(path, code);
