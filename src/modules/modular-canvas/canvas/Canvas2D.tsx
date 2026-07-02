import { useEffect, useRef, useState } from 'react';
import paper from 'paper';
import { useProjectStore } from '../store/projectStore';
import * as opentype from 'opentype.js';

interface Canvas2DProps {
  tool: 'select' | 'pen' | 'rect' | 'circle' | 'polygon' | 'pan' | 'text';
}

export function Canvas2D({ tool }: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { elements, addElement, removeElement, activeElementId, setActiveElement, loadedFont } = useProjectStore();
  const [paperScope, setPaperScope] = useState<paper.PaperScope | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scope = new paper.PaperScope();
    scope.setup(canvasRef.current);
    setPaperScope(scope);

    const handleKeyDown = (e: KeyboardEvent) => {
      const { activeElementId, removeElement, undo, redo } = useProjectStore.getState();
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key === 'y') {
          redo();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeElementId && window.confirm('Delete selected element?')) {
          removeElement(activeElementId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      scope.project.clear();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!paperScope) return;
    if (paperScope.tool) paperScope.tool.remove();

    const paperTool = new paperScope.Tool();

    if (tool === 'select') {
      paperTool.onMouseDown = (event: paper.ToolEvent) => {
        const hitResult = paperScope.project.hitTest(event.point, {
          segments: true,
          stroke: true,
          fill: true,
          tolerance: 5,
        });

        if (hitResult) {
          if (hitResult.type === 'segment') {
            paperTool.onMouseDrag = (dragEvent: paper.ToolEvent) => {
              hitResult.segment.point = dragEvent.point;
            };
            paperTool.onMouseUp = () => {
              const svgData = hitResult.item.exportSVG({ asString: true }) as string;
              const pathData = svgData.match(/d="([^"]+)"/)?.[1];
              if (pathData) {
                const { elements, updateElement } = useProjectStore.getState();
                const el = elements.find(e => e.id === hitResult.item.name);
                if (el) {
                  updateElement(el.id, { pathData });
                }
              }
            };
          } else if (hitResult.item && hitResult.item.name) {
            setActiveElement(hitResult.item.name);
          }
        } else {
          setActiveElement(null);
        }
      };
    } else if (tool === 'text') {
      paperTool.onMouseDown = (event: paper.ToolEvent) => {
        const text = prompt('Enter text:');
        if (text) {
          let pathData = '';
          if (loadedFont) {
            const path = loadedFont.getPath(text, event.point.x, event.point.y, 40);
            pathData = path.toPathData();
          } else {
            const textItem = new paperScope.PointText(event.point);
            textItem.content = text;
            textItem.fontSize = 20;
            textItem.fillColor = new paperScope.Color('#ffffff');
            const path = (textItem as any).toPath(true);
            const svgData = path.exportSVG({ asString: true }) as string;
            const match = svgData.match(/d="([^"]+)"/);
            if (match && match[1]) pathData = match[1];
            path.remove();
            textItem.remove();
          }

          if (pathData) {
            addElement({
              type: 'text',
              pathData: pathData,
              extrusion: { height: 10, plate: 1 },
              transform: { x: 0, y: 0, rotation: 0, scale: 1 },
              color: '#00E5FF',
              text: text
            });
          }
        }
      };
    } else if (tool === 'rect') {
       // ... existing rect ...
       let rect: paper.Path.Rectangle | null = null;
       let startPoint: paper.Point | null = null;
       paperTool.onMouseDown = (event: paper.ToolEvent) => {
         startPoint = event.point;
         rect = new paperScope.Path.Rectangle(startPoint, startPoint);
         rect.strokeColor = new paperScope.Color('#00E5FF');
       };
       paperTool.onMouseDrag = (event: paper.ToolEvent) => {
         if (rect && startPoint) {
           rect.remove();
           rect = new paperScope.Path.Rectangle(startPoint, event.point);
           rect.strokeColor = new paperScope.Color('#00E5FF');
         }
       };
       paperTool.onMouseUp = () => {
         if (rect) {
           const svgData = rect.exportSVG({ asString: true }) as string;
           const match = svgData.match(/d="([^"]+)"/);
           if (match && match[1]) {
             addElement({
               type: 'shape',
               pathData: match[1],
               extrusion: { height: 10, plate: 1 },
               transform: { x: 0, y: 0, rotation: 0, scale: 1 },
               color: '#00E5FF'
             });
           }
           rect.remove();
         }
       };
    }
    // ... polygon, circle tools ...
    paperScope.tool = paperTool;
  }, [tool, paperScope, addElement, setActiveElement, loadedFont]);

  useEffect(() => {
    if (!paperScope) return;
    paperScope.project.clear();
    elements.forEach(el => {
      const path = new paperScope.Path(el.pathData);
      path.name = el.id; 
      path.strokeColor = new paperScope.Color('#00E5FF');
      path.strokeWidth = 2;
      path.fillColor = new paperScope.Color('#00E5FF33');
      if (el.id === activeElementId) path.selected = true;
    });
  }, [elements, activeElementId, paperScope]);

  return (
    <div className="w-full h-full relative bg-zinc-950">
      <canvas ref={canvasRef} className="w-full h-full" data-paper-resize="true" />
    </div>
  );
}
