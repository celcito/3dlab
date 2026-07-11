const fs = require('fs');
const path = 'src/pages/VaseGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('Edges')) {
  code = code.replace(
    'import { OrbitControls, Grid, Center, PerspectiveCamera, ContactShadows } from "@react-three/drei";',
    'import { OrbitControls, Grid, Center, PerspectiveCamera, ContactShadows, Edges } from "@react-three/drei";'
  );
}

const replacement = `function VaseMesh({ config }: { config: VaseConfig }) {
  const geometry = useMemo(() => createVaseGeometry(config), [config]);

  return (
    <mesh castShadow receiveShadow geometry={geometry}>
      <meshPhysicalMaterial 
        color={config.baseColor} 
        roughness={0.2} 
        metalness={0.1}
        transmission={0.8}
        thickness={0.5}
        ior={1.5}
        clearcoat={1}
        transparent={true}
        opacity={1}
        side={THREE.DoubleSide}
      />
      <Edges scale={1} threshold={15} color="rgba(255,255,255,0.3)" />
    </mesh>
  );
}`;

code = code.replace(/function VaseMesh\(\{ config \}: \{ config: VaseConfig \}\) \{[\s\S]*?return \([\s\S]*?<mesh castShadow receiveShadow geometry=\{geometry\}>[\s\S]*?<meshStandardMaterial[\s\S]*?\/>[\s\S]*?<\/mesh>[\s\S]*?\);[\s\S]*?\}/, replacement);

fs.writeFileSync(path, code);
