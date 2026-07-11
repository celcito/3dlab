const fs = require('fs');
const path = 'src/pages/VaseGenerator.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '            </div>\n          </div>\n          </div>\n          <div className="space-y-4 pt-4 border-t border-zinc-900">',
  '            </div>\n          </div>\n          <div className="space-y-4 pt-4 border-t border-zinc-900">'
);

fs.writeFileSync(path, code);
