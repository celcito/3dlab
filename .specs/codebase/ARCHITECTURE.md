# Architecture

**Pattern:** Modular monolith (Node SSR-like shell) + separate Python microservice (image-to-3D)

## High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ React App (Vite SPA)                              │  │
│  │  ├── /             → PaintMixer                   │  │
│  │  ├── /ai-figures   → AiFigures (Gemini proxy)     │  │
│  │  ├── /viewer       → Viewer3D (3D mesh editor)    │  │
│  │  ├── /price-calc   → PriceCalculator              │  │
│  │  └── /image-to-3d  → ImageTo3D (TripoSR UI)       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              │ HTTP                  │ HTTP
              ▼                       ▼
┌────────────────────────┐  ┌──────────────────────────┐
│ Express server.ts      │  │ FastAPI app.py           │
│ (port 3000)            │  │ (port 8001)              │
│ ├── /api/ai-figures/*  │  │ ├── /generate            │
│ ├── /api/img2-3d/*     │──│ ├── /jobs/:id/stream     │
│ ├── static + Vite mw   │  │ ├── /jobs/:id/status     │
│ └── SSE proxy          │  │ └── /jobs/:id/file/:fmt  │
└────────────────────────┘  └──────────────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ TripoSR (PyTorch)│
                              │ → GLB → OBJ/STL  │
                              │ via trimesh      │
                              └──────────────────┘
```

## Identified Patterns

### Pattern: Page-as-Component (SPA)

**Location:** `src/pages/*.tsx`
**Purpose:** Cada rota do React Router é um único arquivo TSX que renderiza header + grid de painéis + footer
**Implementation:** Compositional layout com `flex flex-col h-full overflow-hidden`, `grid-cols-1 lg:grid-cols-[1fr_320px]`
**Example:** `src/pages/ImageTo3D.tsx`, `src/pages/Viewer3D.tsx`

### Pattern: Express + Vite Middleware

**Location:** `server.ts:172-184`
**Purpose:** Servir o app Vite em dev (via middleware) e estático em prod, na mesma porta 3000
**Implementation:** `createViteServer({ middlewareMode: true })` em dev; `express.static(dist)` em prod
**Benefit:** Não precisa de CORS nem proxy separado em dev

### Pattern: SSE Stream Proxy

**Location:** `server.ts:90-137` (Node) → `python/app.py:107-152` (Python)
**Purpose:** Frontend consome progresso de jobs longos via Server-Sent Events
**Implementation:** Node lê o stream do Python com `reader.read()` e repassa para o client com `res.write`
**Benefit:** Backpressure-friendly; reconexão automática do `EventSource` no client

### Pattern: Job Directory as Filesystem

**Location:** `python/jobs.py:34-44` + `python/app.py:24-25`
**Purpose:** Cada job = diretório em `tmp/jobs/{jobId}/` com arquivos de saída por formato
**Implementation:** `{jobId}/model.glb`, `model.obj`, `model.stl`
**Benefit:** Cleanup trivial (`rm -rf tmp/jobs/*`); download direto via FileResponse

### Pattern: Local Component + Tailwind Primitive

**Location:** `components/ui/button.tsx`, `slider.tsx`, `tabs.tsx`
**Purpose:** Wrappers de Radix/Base-UI com class-variance-authority para variantes
**Implementation:** CVA define variants, primitiva é wrapped com className mergeado via `cn()`
**Example:** `Button` aceita `variant` (default, outline, ghost, destructive, link) e `size`

### Pattern: Suspense + useGLTF (drei)

**Location:** `src/pages/Viewer3D.tsx:11-18`
**Purpose:** Carregamento assíncrono de GLB com fallback `<Suspense fallback={null}>`
**Implementation:** Hook `useGLTF(url)` faz fetch e parse automático
**Limitation atual:** Não trata cancelamento, retry, ou outros formatos além de GLB

## Data Flow

### Flow 1: Image → 3D (long-running)

```
1. User drops image on UploadDropzone (ImageTo3D.tsx:90)
2. POST /api/img2-3d/generate with multipart (server.ts:62)
3. Express forwards to Python /generate (app.py:88)
4. Python: create_job() → spawn thread → return jobId
5. Thread: TripoSR inference → trimesh convert → update_job("done", files={...})
6. Frontend: useJobStream opens SSE /jobs/:id/stream
7. Server proxies SSE events from Python to client
8. On "done", UI shows download links for .glb/.obj/.stl
9. User clicks "Open in 3D Viewer" → navigate to /viewer?model={jobId}
```

### Flow 2: 3D Viewer (current, broken)

```
1. User opens /viewer?model=xxx (Viewer3D.tsx:30-32)
2. Loads GLB from /api/img2-3d/{id}/result/glb via useGLTF
3. Renders in <Canvas> with OrbitControls + Grid
4. "Add Cutting Plane" button draws red translucent plane (decorative)
5. "Execute Boolean Cut" button has no onClick — does nothing
6. Parts list shows hardcoded "Part_01_Top" / "Part_02_Bottom" (mock)
```

### Flow 3: AI Figures (Gemini proxy)

```
1. User types prompt in AiFigures.tsx
2. POST /api/ai-figures/generate { prompt }
3. server.ts:40 calls Gemini with system instruction
4. Returns { optimizedPrompt } — displayed as text
```

## Code Organization

**Approach:** Feature-based (pastas `src/pages/` e `components/` por feature/camada)

```
src/
  App.tsx           ← layout + router
  main.tsx          ← root mount
  index.css         ← Tailwind + shadcn theme tokens
  pages/            ← uma pasta-arquivo por rota
    PaintMixer.tsx
    AiFigures.tsx
    Viewer3D.tsx
    PriceCalculator.tsx
    ImageTo3D.tsx

components/
  UploadDropzone.tsx ← shared upload UI
  ui/                ← shadcn-style primitives (button, slider, etc)

hooks/
  useJobStream.ts    ← SSE consumer para jobs TripoSR

lib/
  utils.ts           ← cn() class merge
```

**Module boundaries:** Pages são auto-contidas (não importam umas às outras). Componentes compartilhados ficam em `components/` ou `components/ui/`. Lógica de SSE fica em `hooks/`.

**Imports:** Alias `@/` aponta para raiz do projeto (configurado em `vite.config.ts:11` e `tsconfig.json`).
