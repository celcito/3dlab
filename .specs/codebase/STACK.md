# Tech Stack

**Analyzed:** 2026-06-29

## Core

- Framework: React 19.0.1 + Vite 6.2.3
- Language: TypeScript 5.8.2
- Runtime: Node 22 (app) + Python 3.11 (triposr service)
- Package manager: npm (lockfile: package-lock.json)

## Frontend

- UI Framework: React 19 + shadcn-style components
  - Radix UI: @radix-ui/react-label, slider, slot, tabs
  - @base-ui/react 1.6 (Button, Slider primitives)
- Styling: Tailwind v4 (via @tailwindcss/vite 4.1.14)
- 3D Engine: three 0.185.0 + @react-three/fiber 9.6.1 + @react-three/drei 10.7.7
- CSG: three-bvh-csg 0.0.18 (instalado, ainda não consumido)
- Icons: lucide-react 0.546
- Animations: motion 12.23 (Framer Motion v12)
- Routing: react-router-dom 7.18
- Date utils: sem dependência (não usado ainda)
- Color utils: color-convert 3.1 (PaintMixer)

## Backend (Node)

- Server: Express 4.21
- Upload middleware: multer 2.2 (10MB limit)
- Dev tooling: tsx 4.21 (dev), esbuild 0.25 (build)
- AI: @google/genai 2.4 (Gemini para AI Figures)

## Backend (Python)

- API: FastAPI + uvicorn[standard]
- Multipart: python-multipart
- ML: torch 2.4, torchvision 0.19
- 3D: trimesh 4.5, numpy 2.0, Pillow 10.4
- Model: triposr 0.1.2 (stabilityai/TripoSR)
- HTTP client: httpx 0.28

## Testing

- Unit/Integration: **none configured** ⚠️
- E2E: **none configured** ⚠️
- Lint: `tsc --noEmit` via `npm run lint`

## External Services

- Google Gemini API (used by /api/ai-figures/generate) — key via GEMINI_API_KEY
- TripoSR model (stabilityai/TripoSR on HuggingFace) — checkpoint cached at `~/.cache/triposr`

## Development Tools

- Process manager: docker-compose (app + triposr services)
- Build: vite build + esbuild bundle
- HMR control: DISABLE_HMR env var (used by AI Studio)
