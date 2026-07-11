const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('Edges')) {
  code = code.replace(
    'import { OrbitControls, Grid, Center, PerspectiveCamera, ContactShadows }',
    'import { OrbitControls, Grid, Center, PerspectiveCamera, ContactShadows, Edges }'
  );
}

// Add edges to base
code = code.replace(
  '<meshStandardMaterial color={config.baseColor} roughness={0.4} />\n      </mesh>',
  '<meshStandardMaterial color={config.baseColor} roughness={0.4} />\n        <Edges scale={1} threshold={15} color="rgba(0,0,0,0.2)" />\n      </mesh>'
);
// This will replace the first occurrence (base). Now replace again for walls:
code = code.replace(
  '<meshStandardMaterial color={config.baseColor} roughness={0.4} />\n      </mesh>',
  '<meshStandardMaterial color={config.baseColor} roughness={0.4} />\n        <Edges scale={1} threshold={15} color="rgba(0,0,0,0.2)" />\n      </mesh>'
);
// For dividers:
code = code.replace(
  /<meshStandardMaterial color=\{config\.baseColor\} roughness=\{0\.5\} \/>\n\s*<\/mesh>/g,
  '<meshStandardMaterial color={config.baseColor} roughness={0.5} />\n            <Edges scale={1} threshold={15} color="rgba(0,0,0,0.2)" />\n          </mesh>'
);

fs.writeFileSync(path, code);
