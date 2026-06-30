# External Integrations

## AI Services

### Google Gemini API

**Service:** Google Gemini (gemini-3.5-flash)
**Purpose:** Otimizar prompts de geração 3D no `AiFigures.tsx` (transforma ideia do usuário em prompt otimizado para Meshy/Luma/etc)
**Implementation:**
- Client: `src/pages/AiFigures.tsx:22-39` (POST `/api/ai-figures/generate`)
- Server: `server.ts:14-53` (proxy que inicializa `new GoogleGenAI({ apiKey })` e chama `ai.models.generateContent`)
- System instruction: `server.ts:35-38`
**Configuration:**
- API key: env `GEMINI_API_KEY` (injetada pelo AI Studio runtime)
- Fallback: retorna 500 se não configurada (`server.ts:22-24`)
**Authentication:** API Key via header (configurado pelo SDK)

## 3D Model Services

### TripoSR (HuggingFace)

**Service:** stabilityai/TripoSR
**Purpose:** Reconstrução de malha 3D a partir de uma única imagem (image-to-3D)
**Implementation:**
- Python pipeline: `python/triposr_runner.py:16-101` (função `infer()`)
- TripoSRPipeline carregado de `stabilityai/TripoSR` com cache em `~/.cache/triposr`
- Background removal simples via luminância (luminance > 0.05 mask) em `triposr_runner.py:50-61`
**Configuration:**
- `foreground_ratio=0.85` (default)
- `mc_resolution=256` (resolução do marching cubes; 512 seria alta qualidade)
- Device: auto-detecta CUDA, fallback CPU com warning
**Authentication:** Sem auth (modelo público HF); cache local após primeiro download

## Storage

### Filesystem (tmp/jobs/)

**Service:** Filesystem local
**Purpose:** Armazenar saída de cada job TripoSR (GLB + OBJ + STL)
**Implementation:** `tmp/jobs/{jobId}/model.{glb,obj,stl}`
**Lifecycle:** 24h TTL via `remove_old_jobs` em `python/jobs.py:71-78` (chamado a cada 1h pelo `cleanup_loop` em `app.py:30-35`)
**Volume:** Docker compose monta `jobs-data:/tmp/jobs` (triposr) e `jobs-data:/app/tmp/jobs` (app) — volume compartilhado entre containers

## API Integrations

### `/api/img2-3d/*` (Node → Python internal)

**Purpose:** Proxy chain Express → FastAPI para geração de modelos
**Location:** `server.ts:55-169` (Node side)
**Endpoints (Node proxies these to Python):**
- `POST /api/img2-3d/generate` → `POST /generate` (multipart upload)
- `GET /api/img2-3d/:id/sse` → `GET /jobs/:id/stream` (SSE)
- `GET /api/img2-3d/:id/status` → `GET /jobs/:id/status` (JSON)
- `GET /api/img2-3d/:id/result/:format` → serve `model.{format}` direto do filesystem
**Configuration:** `IMG2_3D_PY_URL` env var (default `http://127.0.0.1:8001`)

### Python internal endpoints (not exposed to internet)

- `POST /generate` — start job (multipart with `image` field)
- `GET /jobs/:id/stream` — SSE stream de progresso
- `GET /jobs/:id/status` — JSON status snapshot
- `GET /jobs/:id/file/:fmt` — download file direto (não usado pelo proxy Node)
- `GET /health` — health check

## Webhooks

_Nenhuma integração de webhook configurada._

## Background Jobs

**Queue system:** In-memory thread spawn (Python `threading.Thread` daemon)
**Location:** `python/app.py:102` (chamada em `_run_inference`)
**Jobs:**
- `triposr_image_to_3d` — cada request POST /generate spawna uma thread que:
  1. Carrega pipeline (lazy, 5% progress)
  2. Carrega modelo (15%)
  3. Preprocessing (30%)
  4. Inference (70%)
  5. Convert GLB → OBJ/STL (75%)
  6. Move files para `tmp/jobs/{id}/model.{fmt}` (100%)

**State management:** `python/jobs.py` (thread-safe dict + listeners para SSE push)
