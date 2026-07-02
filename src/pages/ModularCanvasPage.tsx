import { useState } from 'react';
import { Canvas2D } from '../modules/modular-canvas/canvas/Canvas2D';
import { Preview3D } from '../modules/modular-canvas/canvas/Preview3D';
import { LeftToolbar } from '../modules/modular-canvas/panels/LeftToolbar';
import { TopBar } from '../modules/modular-canvas/panels/TopBar';

export default function ModularCanvasPage() {
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'rect' | 'circle' | 'polygon' | 'pan' | 'text'>('rect');

  return (
    <div className="flex flex-col w-full h-full bg-[#080808]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
        
        {/* Split View */}
        <div className="flex flex-1">
          <div className="flex-1 relative">
            <Canvas2D tool={activeTool} />
          </div>
          <div className="flex-1 relative">
            <Preview3D />
          </div>
        </div>
      </div>
    </div>
  );
}
