# Project Structure

**Root:** `/home/celso/Área de trabalho/lab/3dlab`

## Directory Tree

```
3dlab/
├── server.ts                  # Express + Vite (porta 3000)
├── vite.config.ts             # Vite + Tailwind + alias @
├── tsconfig.json              # TS strict mode
├── package.json               # Deps Node
├── docker-compose.yml         # app + triposr services
├── Dockerfile.app             # build do container Node
│
├── index.html                 # Vite entry
├── metadata.json              # AI Studio metadata
├── .env.example               # GEMINI_API_KEY, IMG2_3D_PY_URL
│
├── src/                       # Frontend React
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── pages/                 # 1 arquivo por rota
│       ├── PaintMixer.tsx
│       ├── AiFigures.tsx
│       ├── Viewer3D.tsx       # ⚠️ a ser reescrito
│       ├── PriceCalculator.tsx
│       └── ImageTo3D.tsx
│
├── components/                # Compartilhados
│   ├── UploadDropzone.tsx
│   └── ui/                    # shadcn-style primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── slider.tsx
│       └── tabs.tsx
│
├── hooks/
│   └── useJobStream.ts        # SSE consumer
│
├── lib/
│   └── utils.ts               # cn() helper
│
├── python/                    # Microserviço TripoSR
│   ├── app.py                 # FastAPI (porta 8001)
│   ├── jobs.py                # Job dataclass + thread-safe store
│   ├── triposr_runner.py      # Wraps TripoSRPipeline
│   ├── convert.py             # GLB → OBJ/STL via trimesh
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.sh
│
├── tmp/                       # Runtime (gitignored)
│   └── jobs/                  # {jobId}/model.{glb,obj,stl}
│
└── dist/                      # Build output (gitignored)
```

## Module Organization

### Frontend (src/)

**Purpose:** SPA React que renderiza 5 ferramentas via React Router
**Location:** `src/pages/`
**Key files:**
- `App.tsx` — Layout shell com nav rail de 80px + main area; define as 5 rotas
- `pages/Viewer3D.tsx` — Foco da feature mesh-editor (a reescrever)
- `pages/ImageTo3D.tsx` — Pipeline TripoSR (funcionando, não mexer)

### UI Primitives (components/ui/)

**Purpose:** Wrappers shadcn-style sobre Radix/Base-UI com CVA variants
**Location:** `components/ui/`
**Key files:**
- `button.tsx` — CVA com variants (default, outline, ghost, destructive, link) e sizes
- `slider.tsx` — Base-UI Slider primitive
- `tabs.tsx` — Radix Tabs

### Backend Node (root)

**Purpose:** SSR shell com proxies para Gemini e TripoSR + serve Vite dev/build
**Location:** `server.ts` (single file)
**Endpoints:**
- `POST /api/ai-figures/generate` — proxy Gemini
- `POST /api/img2-3d/generate` — proxy TripoSR (multipart)
- `GET /api/img2-3d/:id/sse` — SSE proxy (stream)
- `GET /api/img2-3d/:id/status` — status JSON
- `GET /api/img2-3d/:id/result/:format` — download file

### Backend Python (python/)

**Purpose:** Image-to-3D inference com TripoSR + conversão multi-formato
**Location:** `python/`
**Key files:**
- `app.py` — FastAPI app, lifespan com cleanup de jobs antigos
- `triposr_runner.py` — Wraps `TripoSRPipeline.from_pretrained`
- `convert.py` — trimesh convert GLB → OBJ/STL
- `jobs.py` — Thread-safe job state com listeners para SSE

## Where Things Live

**[3D Viewer (atual)]:**
- UI/Interface: `src/pages/Viewer3D.tsx`
- 3D helpers: inline no mesmo arquivo (LoadedModel, BoxMesh)
- Estado: useState local

**[Mesh Editor (novo) — vai substituir o acima]:**
- UI/Interface: `src/pages/Viewer3D.tsx` (reescrito)
- 3D components: `src/components/three/*.tsx` (novo)
- Lógica de seleção/CSG: `src/lib/*.ts` (novo)
- Estado central: `src/hooks/useMeshEditor.ts` (novo)

**[TripoSR Image→3D]:**
- UI/Interface: `src/pages/ImageTo3D.tsx`
- Hook SSE: `hooks/useJobStream.ts`
- Node proxy: `server.ts:62-169`
- Python service: `python/app.py:88-104`
- Python inference: `python/triposr_runner.py`
- Python convert: `python/convert.py`

**[Paint Mixer]:**
- UI/Interface: `src/pages/PaintMixer.tsx`
- Lógica de cor: inline (color-convert)
- Mock data: constante `MOCK_PAINTS` no topo do arquivo

**[AI Figures]:**
- UI/Interface: `src/pages/AiFigures.tsx`
- Backend Gemini: `server.ts:14-53`

## Special Directories

**`tmp/`:**
- **Purpose:** Runtime data (job files, uploads temporários)
- **Gitignored:** sim (`.gitignore` lista `tmp/`)
- **Key files:** `tmp/jobs/{jobId}/model.{glb,obj,stl}` — saída de cada job TripoSR

**`dist/`:**
- **Purpose:** Build output (`npm run build` → `dist/index.html` + assets + `server.cjs`)
- **Gitignored:** sim
- **Key files:** `dist/server.cjs` (production server bundled), `dist/index.html`

**`node_modules/`:**
- **Purpose:** Dependências npm
- **Gitignored:** sim
- **Tamanho:** ~381 pacotes (inclui three.js, react, three-bvh-csg, etc)
