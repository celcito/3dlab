import { MousePointer2, PenTool, Square, Circle, Hand, Undo, Redo, Hexagon, Type } from 'lucide-react';

interface LeftToolbarProps {
  activeTool: 'select' | 'pen' | 'rect' | 'circle' | 'polygon' | 'pan' | 'text';
  onToolSelect: (tool: 'select' | 'pen' | 'rect' | 'circle' | 'polygon' | 'pan' | 'text') => void;
}

export function LeftToolbar({ activeTool, onToolSelect }: LeftToolbarProps) {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pan', icon: Hand, label: 'Pan' },
    { id: 'pen', icon: PenTool, label: 'Pen Tool' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'polygon', icon: Hexagon, label: 'Polygon' },
    { id: 'text', icon: Type, label: 'Text' },
  ] as const;

  return (
    <div className="w-16 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-4 gap-2 z-20">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => onToolSelect(tool.id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === tool.id 
              ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" strokeWidth={1.5} />
        </button>
      ))}

      <div className="w-8 h-[1px] bg-zinc-900 my-2" />

      <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all">
        <Undo className="w-4 h-4" />
      </button>
      <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all">
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
}
