import { useCallback, useRef } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface UploadDropzoneProps {
  file: File | null;
  onFile: (file: File) => void;
  disabled: boolean;
}

export function UploadDropzone({ file, onFile, disabled }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith("image/")) onFile(f);
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

  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        disabled
          ? "border-[#222] cursor-not-allowed opacity-50"
          : "border-zinc-700 hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/5"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      {previewUrl ? (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-48 mx-auto rounded-lg border border-[#222] object-contain"
          />
          <p className="text-xs text-zinc-500 font-mono truncate">{file?.name}</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Click to change</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="w-10 h-10 mx-auto text-zinc-600" />
          <p className="text-xs text-zinc-400">
            <span className="text-[#00E5FF] font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">PNG, JPEG, WebP (max 10MB)</p>
        </div>
      )}
    </div>
  );
}
