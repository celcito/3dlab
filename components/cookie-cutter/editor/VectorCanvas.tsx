import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { useVectorEditor } from "@/hooks/useVectorEditor";
import { ShapeRenderer } from "./ShapeRenderer";
import { SelectionLayer } from "./SelectionLayer";

export function VectorCanvas() {
  const editor = useVectorEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  const {
    scene,
    activePiece,
    selection,
    mode,
    selectShape,
    clearSelection,
    removeShape,
    selectAll,
    setViewZoom,
    setViewPan,
    importSvgFile,
    updateShapeTransform,
  } = editor;

  const view = scene.view;
  const grid = scene.grid;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ w: width, h: height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const viewWidth = Math.max(1, containerSize.w / view.zoom);
  const viewHeight = Math.max(1, containerSize.h / view.zoom);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const svgX = mouseX / view.zoom + view.panX;
      const svgY = mouseY / view.zoom + view.panY;

      const step = 0.1;
      const delta = e.deltaY > 0 ? -step : +step;
      const newZoom = Math.max(0.1, Math.min(10, view.zoom + delta));

      const newPanX = svgX - mouseX / newZoom;
      const newPanY = svgY - mouseY / newZoom;

      setViewPan(newPanX, newPanY);
      setViewZoom(newZoom);
    },
    [view.zoom, view.panX, view.panY, setViewZoom, setViewPan]
  );

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && mode === "pan")) {
        e.preventDefault();
        isPanning.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        return;
      }
    },
    [mode]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      setViewPan(view.panX - dx / view.zoom, view.panY - dy / view.zoom);
    };

    const handleMouseUp = () => {
      isPanning.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [view.panX, view.panY, view.zoom, setViewPan]);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current) return;
      const target = e.target as SVGElement;
      if (
        target === svgRef.current ||
        target.classList.contains("canvas-bg")
      ) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  const handleShapeClick = useCallback(
    (shapeId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (mode === "select") {
        if (selection.has(shapeId)) {
          clearSelection();
        } else {
          selectShape(shapeId, e.shiftKey);
        }
      }
    },
    [mode, selection, selectShape, clearSelection]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const svgFiles = files.filter((f) => f.name.endsWith(".svg"));
      for (const file of svgFiles) {
        try {
          await importSvgFile(file);
        } catch {
          console.error(`Failed to import: ${file.name}`);
        }
      }
    },
    [importSvgFile]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        for (const id of selection) {
          removeShape(scene.activePieceId, id);
        }
        clearSelection();
      }

      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
      }

      if (e.key === "Escape") {
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, scene.activePieceId, removeShape, clearSelection, selectAll]);

  const selectedShapes = useMemo(
    () => activePiece?.shapes.filter((s) => selection.has(s.id)) ?? [],
    [activePiece, selection]
  );

  const shapes = activePiece?.shapes ?? [];

  const gridPatternId = "vector-grid-pattern";
  const gridXOff = view.panX - (view.panX % grid.size);
  const gridYOff = view.panY - (view.panY % grid.size);

  const bgPad = 5000;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#080808]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        className="w-full h-full block"
        viewBox={`${view.panX} ${view.panY} ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="none"
        onMouseDown={handleSvgMouseDown}
        onClick={handleSvgClick}
        style={{
          cursor: mode === "pan" ? "grab" : mode === "zoom" ? "zoom-in" : "default",
        }}
      >
        <rect
          className="canvas-bg"
          x={view.panX - bgPad}
          y={view.panY - bgPad}
          width={bgPad * 2 + viewWidth}
          height={bgPad * 2 + viewHeight}
          fill="#080808"
        />

        {grid.enabled && (
          <defs>
            <pattern
              id={gridPatternId}
              x={gridXOff}
              y={gridYOff}
              width={grid.size}
              height={grid.size}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${grid.size} 0 L 0 0 L 0 ${grid.size}`}
                fill="none"
                stroke="#1a1a1a"
                strokeWidth={0.5}
              />
            </pattern>
          </defs>
        )}
        {grid.enabled && (
          <rect
            x={view.panX - bgPad}
            y={view.panY - bgPad}
            width={bgPad * 2 + viewWidth}
            height={bgPad * 2 + viewHeight}
            fill={`url(#${gridPatternId})`}
          />
        )}

        {shapes.map((shape) => (
          <ShapeRenderer
            key={shape.id}
            shape={shape}
            selected={selection.has(shape.id)}
            mode={mode}
            onClick={handleShapeClick(shape.id)}
          />
        ))}
      </svg>

      {containerSize.w > 0 && containerSize.h > 0 && (
        <SelectionLayer
          shapes={selectedShapes}
          onTransform={(shapeId, newTransform) =>
            updateShapeTransform(scene.activePieceId, shapeId, newTransform)
          }
          panX={view.panX}
          panY={view.panY}
          zoom={view.zoom}
        />
      )}

      {shapes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
            Drop .svg files here
          </p>
        </div>
      )}
    </div>
  );
}
