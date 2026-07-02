import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useProjectStore } from '../store/projectStore';
import { useMemo } from 'react';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

function ExtrudedPath({ pathData, height, color }: { pathData: string; height: number; color: string }) {
  const geometry = useMemo(() => {
    if (!pathData) return null;
    
    // Create a dummy SVG string to parse it with SVGLoader
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathData}" /></svg>`;
    const loader = new SVGLoader();
    const svgData = loader.parse(svgStr);
    
    if (svgData.paths.length === 0) return null;

    const shapes = svgData.paths[0].toShapes();
    if (shapes.length === 0) return null;

    // Extrude geometry
    const extrudeSettings = {
      depth: height,
      bevelEnabled: false,
      steps: 1,
    };
    
    const geom = new THREE.ExtrudeGeometry(shapes[0], extrudeSettings);
    // Center it somewhat or adjust coordinates? 
    // SVGLoader loads shapes with Y pointing down. Let's invert Y.
    geom.scale(0.1, -0.1, 0.1); // Scaled down and Y-flipped
    geom.translate(-15, 15, 0); // Arbitrary center adjustment for now
    
    return geom;
  }, [pathData, height]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

export function Preview3D() {
  const { elements } = useProjectStore();

  return (
    <div className="w-full h-full relative bg-zinc-900 border-l border-zinc-800">
      <Canvas 
        camera={{ position: [0, 20, 40], fov: 45 }}
        shadows
      >
        <ambientLight intensity={1.5} />
        <directionalLight 
          position={[10, 20, 15]} 
          intensity={2} 
          castShadow 
        />
        <gridHelper args={[100, 100, 0x444444, 0x222222]} />
        <axesHelper args={[50]} />

        {elements.map(el => (
          <ExtrudedPath 
            key={el.id} 
            pathData={el.pathData} 
            height={el.extrusion.height} 
            color={el.color} 
          />
        ))}

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      </Canvas>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur border border-zinc-800/80 px-2.5 py-1 rounded font-mono text-[8.5px] text-zinc-400">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        <span>PREVIEW 3D (EXTRUSÃO)</span>
      </div>
    </div>
  );
}
