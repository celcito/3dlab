const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('ScrewGenerator')) {
  code = code.replace(
    'import BeltGenerator from "./pages/BeltGenerator";',
    'import BeltGenerator from "./pages/BeltGenerator";\nimport ScrewGenerator from "./pages/ScrewGenerator";'
  );
  
  code = code.replace(
    '<NavItem to="/belt-generator" icon={WrapText} label="Belt Generator" description="Timing Belts (GT2, HTD)" />',
    '<NavItem to="/belt-generator" icon={WrapText} label="Belt Generator" description="Timing Belts (GT2, HTD)" />\n            <NavItem to="/screw-generator" icon={Nut} label="Screw Generator" description="Parametric Fasteners" />'
  );

  code = code.replace(
    '<Route path="/belt-generator" element={<BeltGenerator />} />',
    '<Route path="/belt-generator" element={<BeltGenerator />} />\n          <Route path="/screw-generator" element={<ScrewGenerator />} />'
  );

  if (!code.includes('Nut')) {
    code = code.replace(
      'Settings2, CircleDot, WrapText } from "lucide-react";',
      'Settings2, CircleDot, WrapText, Nut } from "lucide-react";'
    );
  }
  
  fs.writeFileSync(path, code);
}
