const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('BeltGenerator')) {
  code = code.replace(
    'import PulleyGenerator from "./pages/PulleyGenerator";',
    'import PulleyGenerator from "./pages/PulleyGenerator";\nimport BeltGenerator from "./pages/BeltGenerator";'
  );
  
  code = code.replace(
    '<NavItem to="/pulley-generator" icon={CircleDot} label="Pulley Generator" description="Timing Belt Pulleys" />',
    '<NavItem to="/pulley-generator" icon={CircleDot} label="Pulley Generator" description="Timing Belt Pulleys" />\n            <NavItem to="/belt-generator" icon={WrapText} label="Belt Generator" description="Timing Belts (GT2, HTD)" />'
  );

  code = code.replace(
    '<Route path="/pulley-generator" element={<PulleyGenerator />} />',
    '<Route path="/pulley-generator" element={<PulleyGenerator />} />\n          <Route path="/belt-generator" element={<BeltGenerator />} />'
  );

  if (!code.includes('WrapText')) {
    code = code.replace(
      'Settings2, CircleDot } from "lucide-react";',
      'Settings2, CircleDot, WrapText } from "lucide-react";'
    );
  }
  
  fs.writeFileSync(path, code);
}
