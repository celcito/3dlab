const THREE = require('three');

// Let's create the geometry function
function createVaseGeometry(config) {
  const { height, baseRadius, midRadius, topRadius, midPosition, twist, sides, waves, waveIntensity, baseThickness, wallThickness } = config;
  
  const h = height / 10;
  const br = baseRadius / 10;
  const mr = midRadius / 10;
  const tr = topRadius / 10;
  const bt = baseThickness / 10;
  const wt = wallThickness / 10;
  
  const resolutionY = Math.floor(h * 5); // 5 segments per cm
  const points = [];
  const indices = [];
  
  // Helper to calculate radius at t (0 to 1)
  const getRadius = (t) => {
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
  const innerStartYOffset = Math.floor((bt / h) * resolutionY); 
  // Let's just create inner shell from bt to h
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

  console.log("Points:", points.length);
  console.log("Indices:", indices.length);
}

createVaseGeometry({
  height: 100, baseRadius: 30, midRadius: 40, topRadius: 20,
  midPosition: 0.5, twist: 0, sides: 32, waves: 0, waveIntensity: 0,
  baseThickness: 2, wallThickness: 2
});

