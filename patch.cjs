const fs = require('fs');
const path = 'src/pages/FlexiModelCreator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const data = await res.json();\n      \n      if (data.svgCode) {',
  'const data = await res.json();\n      \n      if (!res.ok) {\n        alert(data.error || "Authentication error with AI generation. Please reload the app.");\n        setIsAiLoading(false);\n        return;\n      }\n      if (data.svgCode) {'
);

fs.writeFileSync(path, code);
