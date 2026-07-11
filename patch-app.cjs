const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'import VaseGenerator from "./pages/VaseGenerator";',
  'import VaseGenerator from "./pages/VaseGenerator";\nimport LithophaneGenerator from "./pages/LithophaneGenerator";'
);

code = code.replace(
  '<NavItem to="/filament-painter" icon={Brush} label="Filament Painter" description="Multicolor Print Generator" />',
  '<NavItem to="/filament-painter" icon={Brush} label="Filament Painter" description="Multicolor Print Generator" />\n            <NavItem to="/lithophane-generator" icon={Box} label="Lithophane Maker" description="Foto em Relevo STL" />'
);

code = code.replace(
  '<Route path="/filament-painter" element={<FilamentPainter />} />',
  '<Route path="/filament-painter" element={<FilamentPainter />} />\n          <Route path="/lithophane-generator" element={<LithophaneGenerator />} />'
);

fs.writeFileSync(path, code);
