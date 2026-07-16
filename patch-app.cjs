const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('GearGenerator')) {
  code = code.replace(
    'import LithophaneGenerator from "./pages/LithophaneGenerator";',
    'import LithophaneGenerator from "./pages/LithophaneGenerator";\nimport GearGenerator from "./pages/GearGenerator";'
  );
  
  code = code.replace(
    '<NavItem to="/bin-generator" icon={Box} label="Bin & Tray Generator" description="Custom bins and sorting trays" />',
    '<NavItem to="/bin-generator" icon={Box} label="Bin & Tray Generator" description="Custom bins and sorting trays" />\n            <NavItem to="/gear-generator" icon={Settings2} label="Gear Generator" description="BOSL2 Parametric Gears" />'
  );

  code = code.replace(
    '<Route path="/vase-generator" element={<VaseGenerator />} />',
    '<Route path="/vase-generator" element={<VaseGenerator />} />\n          <Route path="/gear-generator" element={<GearGenerator />} />'
  );

  code = code.replace(
    'import { \n  BoxSelect, \n  UserCircle2, \n  Waves, \n  Baseline, \n  Gamepad2, \n  Palette, \n  QrCode, \n  ArrowRightLeft, \n  Scissors, \n  Sparkles, \n  Brush, \n  Box, \n  Cuboid,\n  Calculator,\n  Megaphone,\n  Flower\n} from "lucide-react";',
    'import { \n  BoxSelect, \n  UserCircle2, \n  Waves, \n  Baseline, \n  Gamepad2, \n  Palette, \n  QrCode, \n  ArrowRightLeft, \n  Scissors, \n  Sparkles, \n  Brush, \n  Box, \n  Cuboid,\n  Calculator,\n  Megaphone,\n  Flower,\n  Settings2\n} from "lucide-react";'
  );
  
  fs.writeFileSync(path, code);
}
