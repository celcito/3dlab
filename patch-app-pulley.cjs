const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('PulleyGenerator')) {
  code = code.replace(
    'import GearGenerator from "./pages/GearGenerator";',
    'import GearGenerator from "./pages/GearGenerator";\nimport PulleyGenerator from "./pages/PulleyGenerator";'
  );
  
  code = code.replace(
    '<NavItem to="/gear-generator" icon={Settings2} label="Gear Generator" description="BOSL2 Parametric Gears" />',
    '<NavItem to="/gear-generator" icon={Settings2} label="Gear Generator" description="BOSL2 Parametric Gears" />\n            <NavItem to="/pulley-generator" icon={CircleDot} label="Pulley Generator" description="Timing Belt Pulleys" />'
  );

  code = code.replace(
    '<Route path="/gear-generator" element={<GearGenerator />} />',
    '<Route path="/gear-generator" element={<GearGenerator />} />\n          <Route path="/pulley-generator" element={<PulleyGenerator />} />'
  );

  code = code.replace(
    'Settings2 } from "lucide-react";',
    'Settings2, CircleDot } from "lucide-react";'
  );
  
  fs.writeFileSync(path, code);
}
