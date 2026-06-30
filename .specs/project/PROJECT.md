# 3dlab

**Vision:** Estúdio web 3D para criadores e makers manipularem malhas (STL/OBJ/GLB) no navegador — corte, decimação, seleção por pintura, pinos de alinhamento — antes de enviar ao fatiador.
**For:** Makers, designers de miniaturas, hobistas de impressão 3D que precisam preparar peças grandes para a área útil de impressão.
**Solves:** Modelos 3D frequentemente excedem a área de impressão; ferramentas desktop (Blender, Meshmixer) exigem instalação. 3dlab oferece um fluxo de preparação (corte + pinos) 100% no browser, com geração opcional por IA (TripoSR).

## Goals

- [ ] Substituir o placeholder `BoxMesh` do `Viewer3D` por pipeline real: upload STL/OBJ/GLB → decimação opcional → seleção → corte booleano → pinos → download STL.
- [ ] Atingir paridade funcional com o fluxo de "corte com seleção inteligente + pino" demonstrado no vídeo de referência.
- [ ] Manter o pipeline TripoSR (image→3D) como uma das fontes de geometria do Viewer, sem quebrar o fluxo atual.
- [ ] Manter o app Dockerizável e self-hosted (sem dependências externas além de GEMINI_API_KEY para AI Figures).

## Tech Stack

**Core:**
- Framework: React 19 + Vite 6 (SSR-mode via `server.ts` Express)
- Language: TypeScript 5.8
- Runtime: Node 22 (app) + Python 3.11 (TripoSR)
- Package manager: npm

**Frontend:**
- UI Framework: React 19 + shadcn-style components (Radix UI primitives, @base-ui/react)
- Styling: Tailwind v4 (via `@tailwindcss/vite`)
- 3D Engine: three.js 0.185 + @react-three/fiber 9 + @react-three/drei 10
- CSG: three-bvh-csg 0.0.18 (instalado, ainda não usado)
- Icons: lucide-react
- Animations: motion (Framer Motion v12)

**Backend:**
- App server: Express 4 (Vite middleware em dev, static em prod)
- Image→3D service: FastAPI + TripoSR (PyTorch CUDA/CPU)
- Format conversion: trimesh
- Mesh simplification: SimplifyModifier (client-side, three.js examples)

## Scope

**v1 (em andamento):**
- Upload real de arquivos 3D do usuário (STL, OBJ, GLB)
- Contagem e exibição de triângulos
- Decimação client-side com 4 níveis de qualidade
- Seleção de faces (manual, inteligente, apagar, preencher)
- Corte booleano real gerando duas peças
- Pino de alinhamento (dowel) com diâmetro/profundidade ajustável
- Download individual e em ZIP das peças

**Out of scope (v1):**
- Múltiplos cortes encadeados / fatiamento em mais de 2 partes
- Edição de geometria por vertex/edge (esculpir)
- Edição de UV / texturas / materiais
- Múltiplas seleções salvas / undo-redo history
- Suporte a arquivos 3MF, FBX, PLY
- Autenticação / multi-usuário / persistência em cloud
- Fatiador real (G-code) — escopo do fatiador externo

## Constraints

- **Técnico:** Tudo pesado de geometria (CSG, decimação) roda no browser. Cap de ~1M triângulos no client (acima disso, exibir warning).
- **Performance:** Corte via `three-bvh-csg` exige geometria indexed e sem NaN — sempre sanitizar antes.
- **Distribuição:** App + TripoSR rodam em containers separados via `docker-compose` (triposr com GPU opcional).
- **Compatibilidade:** Mantém rotas atuais (`/viewer?model=xxx`, `/image-to-3d`, `/ai-figures`, `/price-calculator`, `/paint-mixer`).
