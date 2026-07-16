const fs = require('fs');
const path = 'src/pages/PulleyGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const geometry = createPulleyGeometry(config);',
  'const geoms = createPulleyGeometry(config, profileData);'
);

code = code.replace(
  'const mesh = new THREE.Mesh(geometry);\n      \n      mesh.rotation.x = -Math.PI / 2;\n      mesh.updateMatrixWorld();\n\n      const result = exporter.parse(mesh, { binary: true });',
  `const group = new THREE.Group();
      geoms.forEach(g => {
        const mesh = new THREE.Mesh(g);
        group.add(mesh);
      });
      group.rotation.x = -Math.PI / 2;
      group.updateMatrixWorld(true);

      const result = exporter.parse(group, { binary: true });`
);

fs.writeFileSync(path, code);
