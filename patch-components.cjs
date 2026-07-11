const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('useThree')) {
  code = code.replace(
    'import { Canvas } from "@react-three/fiber";',
    'import { Canvas, useThree } from "@react-three/fiber";'
  );
}

if (!code.includes('DragControls')) {
  code = code.replace(
    'import { OrbitControls, Grid, Center, PerspectiveCamera, ContactShadows, Edges } from "@react-three/drei";',
    'import { OrbitControls, Grid, Center, PerspectiveCamera, ContactShadows, Edges, DragControls } from "@react-three/drei";'
  );
}

// BinMesh signature update
code = code.replace(
  'function BinMesh({ config }: { config: BinConfig }) {',
  'function BinMesh({ config, setConfig }: { config: BinConfig; setConfig: React.Dispatch<React.SetStateAction<BinConfig>> }) {'
);

code = code.replace(
  '<BinMesh config={config} />',
  '<BinMesh config={config} setConfig={setConfig} />'
);

// We need to inject DividerX and DividerY components above BinMesh
const dividerComponents = `
function DividerX({ config, setConfig, index, innerW, innerD, h, t }: any) {
  const { controls } = useThree<any>();
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  let posX = (index + 1) / (config.dividersX + 1);
  if (config.divPositionsX && config.divPositionsX.length === config.dividersX) {
    posX = config.divPositionsX[index];
  }
  const x = -innerW / 2 + innerW * posX;

  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.setPosition(x, 0, 0);
    return m;
  }, [x]);

  const handleDragEnd = () => {
    if (controls) controls.enabled = true;
    if (ref.current) {
      const newX = ref.current.matrix.elements[12];
      let newPosX = (newX + innerW / 2) / innerW;
      newPosX = Math.max(0.01, Math.min(0.99, newPosX));
      
      const newPositions = [...(config.divPositionsX || Array.from({length: config.dividersX}).map((_, i) => (i + 1) / (config.dividersX + 1)))];
      newPositions[index] = newPosX;
      setConfig({ ...config, divPositionsX: newPositions });
    }
  };

  return (
    <DragControls 
      ref={ref}
      matrix={matrix}
      axisLock="x" 
      dragLimits={[[-innerW/2 + t/2, innerW/2 - t/2], undefined, undefined]}
      onDragStart={() => { if(controls) controls.enabled = false; }} 
      onDragEnd={handleDragEnd}
    >
      <mesh 
        position={[0, 0, h / 2 + t / 2]} 
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'ew-resize'; }}
        onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[t, innerD, h - t]} />
        <meshStandardMaterial color={hovered ? "#00E5FF" : config.baseColor} roughness={0.5} />
        <Edges scale={1} threshold={15} color={hovered ? "#00E5FF" : "rgba(0,0,0,0.2)"} />
      </mesh>
    </DragControls>
  );
}

function DividerY({ config, setConfig, index, innerW, innerD, h, t }: any) {
  const { controls } = useThree<any>();
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  let posY = (index + 1) / (config.dividersY + 1);
  if (config.divPositionsY && config.divPositionsY.length === config.dividersY) {
    posY = config.divPositionsY[index];
  }
  const y = -innerD / 2 + innerD * posY;

  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.setPosition(0, y, 0);
    return m;
  }, [y]);

  const handleDragEnd = () => {
    if (controls) controls.enabled = true;
    if (ref.current) {
      const newY = ref.current.matrix.elements[13];
      let newPosY = (newY + innerD / 2) / innerD;
      newPosY = Math.max(0.01, Math.min(0.99, newPosY));
      
      const newPositions = [...(config.divPositionsY || Array.from({length: config.dividersY}).map((_, i) => (i + 1) / (config.dividersY + 1)))];
      newPositions[index] = newPosY;
      setConfig({ ...config, divPositionsY: newPositions });
    }
  };

  return (
    <DragControls 
      ref={ref}
      matrix={matrix}
      axisLock="y" 
      dragLimits={[undefined, [-innerD/2 + t/2, innerD/2 - t/2], undefined]}
      onDragStart={() => { if(controls) controls.enabled = false; }} 
      onDragEnd={handleDragEnd}
    >
      <mesh 
        position={[0, 0, h / 2 + t / 2]} 
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'ns-resize'; }}
        onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[innerW, t, h - t]} />
        <meshStandardMaterial color={hovered ? "#00E5FF" : config.baseColor} roughness={0.5} />
        <Edges scale={1} threshold={15} color={hovered ? "#00E5FF" : "rgba(0,0,0,0.2)"} />
      </mesh>
    </DragControls>
  );
}

`;

code = code.replace(
  'function BinMesh({ config, setConfig }',
  dividerComponents + '\nfunction BinMesh({ config, setConfig }'
);

// Update Dividers mapping inside BinMesh
code = code.replace(
  /\{\/\* Dividers X \*\/\}[\s\S]*?\{\/\* Dividers Y \*\/\}/,
  `{/* Dividers X */}
      {Array.from({ length: dividersX }).map((_, i) => (
        <DividerX key={\`divx-\${i}\`} index={i} config={config} setConfig={setConfig} innerW={innerW} innerD={innerD} h={h} t={t} />
      ))}
      {/* Dividers Y */}`
);

code = code.replace(
  /\{\/\* Dividers Y \*\/\}[\s\S]*?<\/group>/,
  `{/* Dividers Y */}
      {Array.from({ length: dividersY }).map((_, i) => (
        <DividerY key={\`divy-\${i}\`} index={i} config={config} setConfig={setConfig} innerW={innerW} innerD={innerD} h={h} t={t} />
      ))}
    </group>`
);

fs.writeFileSync(path, code);
