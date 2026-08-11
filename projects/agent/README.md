# Agent (contact center)

App nueva del producto **Agent** — dashboard del agente de contact center. Esqueleto
ESTRUCTURAL montado reusando el Design System (Fase 3): tiles KPI, `sc-gauge`,
`sc-datatable`, grupos con toggles, perfil y footer. Datos **seed** (sin backend),
**oscuro por defecto** (toggle claro/oscuro en el header).

## Local
- Preview con tokens en vivo: doble-click `preview/preview-agent.command` (o `npm run preview:live -- agent`).
- Dev server: `npm run ng -- serve agent`.
- Build prod: `npm run build:agent` → `dist/agent/browser` (builder `application`: el
  `index.html` queda anidado bajo `browser/`, no en `dist/agent` directo).

## Deploy (Cloudflare Pages)
Crear un proyecto Pages nuevo apuntando a este repo con:
- Build command: `npm run build:agent`
- Output dir: `dist/agent/browser` (⚠️ NO `dist/agent` — da 404, falta el `index.html`)
- SPA fallback: ya cubierto por `public/_redirects` (se copia dentro de `browser/`).

## Estructura
- `src/app/app.component.*` — shell (grid: header / KPIs / tabla / footer).
- `src/app/components/*` — un componente por región del dashboard.
- `src/app/data/seed.ts` — datos de ejemplo.
- `src/app/theme/theme.service.ts` — toggle de tema (default dark).
