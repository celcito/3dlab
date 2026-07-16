const fs = require('fs');
const path = 'src/pages/PulleyGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'translate([0, d/2, 0]) cube([keyway_w, keyway_h, thickness*3], center=true);',
  'translate([0, d/2 + keyway_h/2, 0]) cube([keyway_w, keyway_h, thickness*3], center=true);'
);

fs.writeFileSync(path, code);
