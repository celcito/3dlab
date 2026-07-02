import { Download, Upload, Type } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as opentype from 'opentype.js';
import paper from 'paper';

export function TopBar() {
  const { elements, setLoadedFont, addElement } = useProjectStore();

  const handleExportSTL = () => {
    // Generate a temporary Three.js scene to export
    const scene = new THREE.Scene();
    const loader = new SVGLoader();

    elements.forEach(el => {
      const svgStr = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${el.pathData}" /></svg>`;
      const svgData = loader.parse(svgStr);
      
      if (svgData.paths.length > 0) {
        const shapes = svgData.paths[0].toShapes();
        if (shapes.length > 0) {
          const geom = new THREE.ExtrudeGeometry(shapes[0], {
            depth: el.extrusion.height,
            bevelEnabled: false,
            steps: 1
          });
          geom.scale(0.1, -0.1, 0.1); 
          geom.translate(-15, 15, 0); 
          
          const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
          scene.add(mesh);
        }
      }
    });

    const exporter = new STLExporter();
    const stlString = exporter.parse(scene);
    
    const blob = new Blob([stlString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modular_canvas_export.stl';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const font = opentype.parse(buffer);
      setLoadedFont(font);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSVGImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target?.result as string;
      
      // Use a hidden paper scope to parse the SVG
      const scope = new paper.PaperScope();
      scope.setup(new paper.Size(100, 100));
      const imported = scope.project.importSVG(svgText);
      
      imported.getItems({ class: paper.Path }).forEach((path: paper.Path) => {
        const svgData = path.exportSVG({ asString: true }) as string;
        const match = svgData.match(/d="([^"]+)"/);
        if (match && match[1]) {
          addElement({
            type: 'shape',
            pathData: match[1],
            extrusion: { height: 10, plate: 1 },
            transform: { x: 0, y: 0, rotation: 0, scale: 1 },
            color: '#ffffff'
          });
        }
      });
      (scope as any).remove();
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-6 z-20">
      <div className="flex flex-col">
        <h1 className="text-white font-bold text-sm tracking-wide">Modular Canvas</h1>
        <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Fase 2 - Texto & SVG</span>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          Load Font
          <input type="file" className="hidden" accept=".ttf,.otf" onChange={handleFontUpload} />
        </label>
        <label className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          Import SVG
          <input type="file" className="hidden" accept=".svg" onChange={handleSVGImport} />
        </label>
        <button 
          onClick={handleExportSTL}
          className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export STL
        </button>
      </div>
    </div>
  );
}
