const fs = require('fs');
const path = 'src/pages/BinGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const newPositions = \[\.\.\.\(config\.divPositionsX \|\| Array\.from\(\{length: config\.dividersX\}\)\.map\(\(_, i\) => \(i \+ 1\) \/ \(config\.dividersX \+ 1\)\)\)\];/g,
  `const oldArray = (config.divPositionsX && config.divPositionsX.length === config.dividersX) ? config.divPositionsX : Array.from({length: config.dividersX}).map((_, i) => (i + 1) / (config.dividersX + 1));
      const newPositions = [...oldArray];`
);

code = code.replace(
  /const newPositions = \[\.\.\.\(config\.divPositionsY \|\| Array\.from\(\{length: config\.dividersY\}\)\.map\(\(_, i\) => \(i \+ 1\) \/ \(config\.dividersY \+ 1\)\)\)\];/g,
  `const oldArray = (config.divPositionsY && config.divPositionsY.length === config.dividersY) ? config.divPositionsY : Array.from({length: config.dividersY}).map((_, i) => (i + 1) / (config.dividersY + 1));
      const newPositions = [...oldArray];`
);

fs.writeFileSync(path, code);
