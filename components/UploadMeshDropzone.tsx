import { useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import { isSupportedFilename } from "@/lib/loaders";

interface UploadMeshDropzoneProps {
  file: File | null;
  onFile: (file: File) => void;
  disabled: boolean;
  error: string | null;
}

export function UploadMeshDropzone({
  file,
  onFile,
  disabled,
  error,
}: UploadMeshDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f && isSupportedFilename(f.name)) onFile(f);
    },
    [disabled, onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? "border-[#222] cursor-not-allowed opacity-50"
            : "border-zinc-700 hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/5 cursor-pointer"
        }`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".stl,.obj,.gltf,.glb,.3mf,.fbx"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        {file ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-[#00E5FF]" />
            <p className="text-xs text-zinc-300 font-mono truncate">{file.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
              Click para trocar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs text-zinc-400">
              <span className="text-[#00E5FF] font-semibold">Clique para upload</span>{" "}
              ou arraste
            </p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
              STL · OBJ · GLB · GLTF · 3MF · FBX (max 50MB)
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-[10px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  );
}
