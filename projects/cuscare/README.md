# CusCare (atención al cliente)

Réplica fiel del frontend de **SmartCusCare** (`cuscare.smart-contact.com/aed`) — la
herramienta de gestión de tickets de atención al cliente. Sin backend: datos **seed**.

Igual que `projects/agent`, esto es un **cartón pluma FIEL**: los valores de color,
tipografía y métrica están **extraídos del sitio real** con `getComputedStyle`, no
estimados. La spec de medición vive en el scratchpad de la sesión que lo construyó;
lo esencial está anotado en el propio CSS, junto a cada valor.

## Estado — Fase 1 de 2

**Montadas** (las 3 vistas núcleo):

| Vista | Ruta |
|---|---|
| Tickets (lista) | `#/private/cuscare/tickets` |
| Ticket (detalle) | `#/private/cuscare/tickets/ticket/:id` |
| Dashboard | `#/private/cuscare/dashboard` |

**Pendientes** (Fase 2): Search (`/customer`), Manage MO in error (`/mo-management`)
y las 4 de administración (`/settings/{users,roles,groups,templates}`). El sidebar ya
las enlaza.

## Decisiones que conviene conocer antes de tocarlo

- **La tabla es un `p-table` de PrimeNG a propósito.** La del sitio real también lo es
  (clases `p-datatable-*` medidas en vivo), así que el DOM sale idéntico en vez de
  aproximado. El *look* va en CSS plano con los valores extraídos.
- **NO usa tokens `--sc-*`,** usa `--cc-*` propios. Es deliberado (DD-35): mezclar
  tokenización con fidelidad esconde errores de extracción. Tokenizar es trabajo
  aparte, encima de esta base ya verificada.
- **Tipografía mixta**, como la real: Roboto en el cuerpo, Open Sans en títulos y
  tabla. No unificar "por limpieza" — es una diferencia real del producto.
- **Raíz fluida `0.8vw`** (medido: 11.68px a 1460px de ancho). Toda la app escala con
  el viewport; por eso casi nada lleva `rem` a mano.

## Deuda conocida (anotada, no escondida)

- **Iconos del nav y logo = placeholders.** Los SVG reales viven inline en el bundle
  de cuscare y la extracción los trunca. Los actuales igualan silueta y caja (20×24,
  `currentColor`) para que el layout mida bien, pero el trazo no es el suyo.
- **Lo vivo no se replica**: paginación, filtros y ordenación son maqueta (el seed no
  se filtra). La forma y los estados sí son fieles.

## Datos

`src/app/data/seed.ts` está **inventado al 100%**. La app real muestra PII de clientes
(teléfonos, emails, IPs) y **nada de eso entra al repo**; solo se replica la *forma* de
los datos —longitudes, formatos, distribución de estados— para que el layout respire
igual.

## Local

- Dev server: `npm run start:cuscare` (o `npm run ng -- serve cuscare --port 4295`).
- Build prod: `npm run build:cuscare` → **`dist/cuscare/browser`** (builder
  `application`: el `index.html` queda anidado bajo `browser/`, no en `dist/cuscare`).

## Deploy (Cloudflare Pages)

- Build command: `npm run build:cuscare`
- Output dir: **`dist/cuscare/browser`** (⚠️ NO `dist/cuscare` — da 404)
- SPA fallback: cubierto por `public/_redirects`, y además enruta por hash.
