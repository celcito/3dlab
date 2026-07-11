const fs = require('fs');
const path = 'src/pages/VaseGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Interface
code = code.replace(
  '  baseThickness: number;',
  '  baseThickness: number;\n  wallThickness: number;'
);

// 2. Initial State
code = code.replace(
  '    baseThickness: 2,',
  '    baseThickness: 2,\n    wallThickness: 2,'
);

// 3. UI Section
const newSection = `          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-black flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-[#00E5FF]" />
              04. Parede & Base
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Espessura da Parede</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.wallThickness}mm</span>
              </div>
              <input 
                type="range" min="0.8" max="10" step="0.2" 
                value={config.wallThickness} 
                onChange={(e) => setConfig({...config, wallThickness: parseFloat(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase font-bold text-zinc-600">Espessura da Base</label>
                <span className="text-[10px] font-mono text-[#00E5FF]">{config.baseThickness}mm</span>
              </div>
              <input 
                type="range" min="1" max="10" step="0.5" 
                value={config.baseThickness} 
                onChange={(e) => setConfig({...config, baseThickness: parseFloat(e.target.value)})}
                className="w-full accent-[#00E5FF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
`;

code = code.replace(
  '          <div className="pt-6">',
  newSection + '\n          <div className="pt-6">'
);

// 4. Geometry Generation
const oldGeom = `function createVaseGeometry(config: VaseConfig) {
  const { height, baseRadius, midRadius, topRadius, midPosition, twist, sides, waves, waveIntensity, baseThickness } = config;
  
  const h = height / 10;
  const br = baseRadius / 10;
  const mr = midRadius / 10;
  const tr = topRadius / 10;
  const bt = baseThickness / 10;
  
  const resolutionY = Math.floor(h * 5); // 5 segments per cm
  const points: THREE.Vector3[] = [];
  const indices: number[] = [];

  // Generate Vertices
  for (let y = 0; y <= resolutionY; y++) {
    const t = y / resolutionY;
    const currentY = t * h;
    
    // Interpolate Radius using quadratic bezier for smoothness
    // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    // We adjust this to use midPosition
    let r = 0;
    if (t < midPosition) {
      const nt = t / midPosition;
      r = THREE.MathUtils.lerp(br, mr, nt);
    } else {
      const nt = (t - midPosition) / (1 - midPosition);
      r = THREE.MathUtils.lerp(mr, tr, nt);
    }

    const currentTwist = (t * twist * Math.PI) / 180;

    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      
      // Apply Waves
      let waveOffset = 0;
      if (waves > 0) {
        waveOffset = Math.sin(angle * waves) * (waveIntensity / 10);
      }

      const x = Math.cos(angle + currentTwist) * (r + waveOffset);
      const z = Math.sin(angle + currentTwist) * (r + waveOffset);
      points.push(new THREE.Vector3(x, currentY, z));
    }
  }

  // Generate Faces
  for (let y = 0; y < resolutionY; y++) {
    for (let s = 0; s < sides; s++) {
      const row1 = y * (sides + 1);
      const row2 = (y + 1) * (sides + 1);

      const a = row1 + s;
      const b = row1 + s + 1;
      const c = row2 + s;
      const d = row2 + s + 1;

      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Add a base plate for 3D printing
  const basePoints: THREE.Vector3[] = [];
  const baseIndices: number[] = [];
  
  // Center of base
  basePoints.push(new THREE.Vector3(0, 0, 0));

  // Loop through first row of vertices
  for (let s = 0; s <= sides; s++) {
    basePoints.push(points[s]);
  }
  
  for (let s = 0; s < sides; s++) {
    baseIndices.push(0, s + 2, s + 1);
  }

  const baseGeom = new THREE.BufferGeometry().setFromPoints(basePoints);
  baseGeom.setIndex(baseIndices);
  baseGeom.computeVertexNormals();

  return BufferGeometryUtils.mergeGeometries([geometry, baseGeom]);
}`;

// Make sure it exists before replacing
if (!code.includes('const resolutionY = Math.floor(h * 5); // 5 segments per cm')) {
  console.log("Could not find geometry generator!");
}

const newGeom = `function createVaseGeometry(config: VaseConfig) {
  const { height, baseRadius, midRadius, topRadius, midPosition, twist, sides, waves, waveIntensity, baseThickness, wallThickness } = config;
  
  const h = height / 10;
  const br = baseRadius / 10;
  const mr = midRadius / 10;
  const tr = topRadius / 10;
  const bt = baseThickness / 10;
  const wt = wallThickness / 10;
  
  const resolutionY = Math.floor(h * 5); // 5 segments per cm
  const points: THREE.Vector3[] = [];
  const indices: number[] = [];
  
  // Helper to calculate radius at t (0 to 1)
  const getRadius = (t: number) => {
    let r = 0;
    if (t < midPosition) {
      const nt = t / (midPosition || 0.001);
      r = THREE.MathUtils.lerp(br, mr, nt);
    } else {
      const nt = (t - midPosition) / (1 - midPosition || 0.001);
      r = THREE.MathUtils.lerp(mr, tr, nt);
    }
    return r;
  };

  // Generate Vertices
  // Outer shell: y goes 0 to resolutionY
  for (let y = 0; y <= resolutionY; y++) {
    const t = y / resolutionY;
    const currentY = t * h;
    const r = getRadius(t);
    const currentTwist = (t * twist * Math.PI) / 180;

    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      let waveOffset = 0;
      if (waves > 0) {
        waveOffset = Math.sin(angle * waves) * (waveIntensity / 10);
      }
      const x = Math.cos(angle + currentTwist) * (r + waveOffset);
      const z = Math.sin(angle + currentTwist) * (r + waveOffset);
      points.push(new THREE.Vector3(x, currentY, z));
    }
  }

  // Inner shell: y goes 0 to resolutionY. Note inner base is at y = bt
  const innerResY = resolutionY;
  
  for (let y = 0; y <= innerResY; y++) {
    const t = y / innerResY;
    const currentY = bt + t * (h - bt); // from baseThickness to height
    
    // We sample radius at corresponding global t
    const globalT = currentY / h;
    let r = getRadius(globalT);
    
    const currentTwist = (globalT * twist * Math.PI) / 180;
    
    // we want inner radius
    const innerR = Math.max(0.01, r - wt);

    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      let waveOffset = 0;
      if (waves > 0) {
        waveOffset = Math.sin(angle * waves) * (waveIntensity / 10);
      }
      const x = Math.cos(angle + currentTwist) * (innerR + waveOffset);
      const z = Math.sin(angle + currentTwist) * (innerR + waveOffset);
      points.push(new THREE.Vector3(x, currentY, z));
    }
  }

  // Faces
  const vertsPerRow = sides + 1;
  const outerOffset = 0;
  const innerOffset = (resolutionY + 1) * vertsPerRow;

  // Outer shell faces
  for (let y = 0; y < resolutionY; y++) {
    for (let s = 0; s < sides; s++) {
      const a = outerOffset + y * vertsPerRow + s;
      const b = outerOffset + y * vertsPerRow + s + 1;
      const c = outerOffset + (y + 1) * vertsPerRow + s;
      const d = outerOffset + (y + 1) * vertsPerRow + s + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  // Inner shell faces (winding reversed)
  for (let y = 0; y < innerResY; y++) {
    for (let s = 0; s < sides; s++) {
      const a = innerOffset + y * vertsPerRow + s;
      const b = innerOffset + y * vertsPerRow + s + 1;
      const c = innerOffset + (y + 1) * vertsPerRow + s;
      const d = innerOffset + (y + 1) * vertsPerRow + s + 1;
      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  // Top lip
  const topOuterY = resolutionY;
  const topInnerY = innerResY;
  for (let s = 0; s < sides; s++) {
    const a = outerOffset + topOuterY * vertsPerRow + s;
    const b = outerOffset + topOuterY * vertsPerRow + s + 1;
    const c = innerOffset + topInnerY * vertsPerRow + s;
    const d = innerOffset + topInnerY * vertsPerRow + s + 1;
    indices.push(a, c, d);
    indices.push(a, d, b);
  }

  // Base Plate (outer bottom)
  // Center vertex
  const bottomOuterCenter = points.length;
  points.push(new THREE.Vector3(0, 0, 0));
  for (let s = 0; s < sides; s++) {
    const a = outerOffset + s;
    const b = outerOffset + s + 1;
    indices.push(bottomOuterCenter, b, a); // facing down
  }

  // Inner Base Plate (inner bottom)
  const bottomInnerCenter = points.length;
  points.push(new THREE.Vector3(0, bt, 0));
  for (let s = 0; s < sides; s++) {
    const a = innerOffset + s;
    const b = innerOffset + s + 1;
    indices.push(bottomInnerCenter, a, b); // facing up
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}`;

// Replace the old geometry function
code = code.replace(/function createVaseGeometry\([\s\S]*?return BufferGeometryUtils.mergeGeometries\(\[geometry, baseGeom\]\);\n\}/, newGeom);

fs.writeFileSync(path, code);
console.log("Patched!");
