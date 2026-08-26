# Agent (contact center)

App del producto **Agent** — réplica del dashboard del agente de contact center: tiles KPI,
`sc-gauge`, tabla de Historial/Pendientes, grupos con toggles, perfil y footer. Datos
**seed** (sin backend), **oscuro por defecto** (toggle claro/oscuro en el header).

> 📓 **[`docs/`](./docs/README.md) — el cuaderno de la réplica.** Ábrelo ANTES de tocar
> nada: la escala (`px = vw × 14.56`), qué codifica cada icono, los estados del Comunicador
> y cómo volver a medir contra la app real. Está para que una sesión nueva no empiece de cero.

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
- `src/app/data/seed.ts` — datos, extraídos del entorno de desarrollo real.
- `public/icons/` — SVG originales de la app real (historial + comunicador).
- `src/app/theme/theme.service.ts` — toggle de tema (default dark).
