# Code Conventions

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `Viewer3D.tsx`, `ImageTo3D.tsx`)
- Hooks: `camelCase.ts` com prefixo `use` (e.g., `useJobStream.ts`)
- Lib/utils: `camelCase.ts` (e.g., `utils.ts`)
- UI primitives: `camelCase.tsx` (e.g., `button.tsx`, `slider.tsx`)
- Python: `snake_case.py` (e.g., `triposr_runner.py`, `convert.py`)

**Functions/Methods:**
- React components: `PascalCase` (e.g., `function LoadedModel`, `export default function Viewer3D`)
- Helpers: `camelCase` (e.g., `stepLabel`, `handleGenerate`, `findClosestPaints`)
- Python: `snake_case` (e.g., `create_job`, `update_job`, `convert_glb_to_all`, `infer`)

**Variables:**
- React state: `camelCase` (e.g., `setModelLoaded`, `setCutting`)
- Constants: `UPPER_SNAKE` para globais (e.g., `JOBS_DIR`, `MOCK_PAINTS`, `BRANDS`)
- Local config: `camelCase` (e.g., `IMG2_3D_PY_URL`, `modelUrl`)

**TypeScript types:**
- Interfaces: `PascalCase` (e.g., `JobProgress`, `UploadDropzoneProps`)
- Types: `PascalCase` (e.g., `Tool`, `VariantProps`)

## Code Organization

**Import/Dependency Declaration:**
- Externos primeiro (react, three, libs)
- Internos depois (`@/...`)
- Ordem alfabética não é obrigatória; agrupamento por origem sim
- Exemplo típico (`Viewer3D.tsx:1-9`):
  ```ts
  import { useState, Suspense } from "react";
  import { useSearchParams } from "react-router-dom";
  import { Canvas } from "@react-three/fiber";
  import { OrbitControls, Grid, useGLTF, Center } from "@react-three/drei";
  import * as THREE from "three";
  import { Upload, Download, Scissors, AlertCircle, ExternalLink } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent } from "@/components/ui/card";
  import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
  ```

**File Structure (typical page):**
1. Imports
2. Sub-componentes locais (se houver) — ex. `LoadedModel`, `BoxMesh`
3. `export default function` do componente principal
4. Hooks de state no topo do componente
5. Handlers no meio
6. JSX no fim, em seções numeradas (01., 02., 03.)

**Component composition:**
- Página sempre começa com `<div className="flex flex-col h-full overflow-hidden text-white">`
- Header (sticky top) + Grid (1fr sidebar) + Footer (sticky bottom)
- Sidebars sempre com `overflow-y-auto`

## Type Safety/Documentation

**Approach:** TypeScript estrito (sem `any` explícito onde possível; `error: any` em catch é tolerado)

**Props pattern:**
```ts
interface UploadDropzoneProps {
  file: File | null;
  onFile: (file: File) => void;
  disabled: boolean;
}

export function UploadDropzone({ file, onFile, disabled }: UploadDropzoneProps) { ... }
```

**Hook return types:** Explícitos (e.g., `useJobStream` retorna `{ progress, connected, stop }`)

**Validation:** Não usa Zod/Yup; tipos TS fazem a validação.

## Error Handling

**Pattern:** Try/catch com `catch (e: any)` + log + setError state

**Exemplo (`ImageTo3D.tsx:50-55`):**
```ts
try {
  // ...
} catch (e: any) {
  setError(e.message);
}
```

**Backend Python:** `logger.exception(...)` em catches + `update_job("error", error=str(e))` para propagar ao cliente via SSE

## Comments/Documentation

**Style:** Comentários mínimos. Quando aparecem, são curtos e explicam "porquê" não "o quê".

- Inline: `// reset`, `// ignore parse errors`
- Bloco: raro
- JSDoc: não usado
- README: mínimo, focado em como rodar

## Styling Conventions

**Tailwind v4:** Utility-first, classes longas inline (e.g., `className="w-12 h-12 flex items-center justify-center border-2 transition-colors"`)

**Color palette (tema dark/cyan):**
- Background: `#080808`, `#0A0A0A`, `#050505`
- Border: `#222`, `#333`
- Accent (cyan): `#00E5FF`, `text-[#00E5FF]`
- Success (green): `#00FF41`
- Warning (orange): `#FF3D00`
- Text: `text-white`, `text-zinc-500`, `text-zinc-400`

**Typography:**
- Heading: `font-black tracking-tighter leading-none uppercase`
- Mono: `font-mono` (JetBrains Mono via CSS variable)
- Label: `text-[10px] uppercase tracking-widest font-bold`

**Borders/Corners:** Sharp (sem `rounded` na maioria dos cards de painel), `rounded-lg` em dropzones e botões
