# CusCare (atención al cliente)

Réplica fiel del frontend de **SmartCusCare** (`cuscare.smart-contact.com/aed`) — la
herramienta de gestión de tickets de atención al cliente. Sin backend: datos **seed**.

Igual que `projects/agent`, esto es un **cartón pluma FIEL**: los valores de color,
tipografía y métrica están **extraídos del sitio real** con `getComputedStyle`, no
estimados. La spec de medición vive en el scratchpad de la sesión que lo construyó;
lo esencial está anotado en el propio CSS, junto a cada valor.

## Estado — las 9 vistas montadas

| Vista | Ruta | Ojo |
|---|---|---|
| Tickets (lista) | `#/private/cuscare/tickets` | tabla PrimeNG, 18 columnas |
| Ticket (detalle) | `#/private/cuscare/tickets/ticket/:id` | timeline + 3 pestañas |
| Dashboard | `#/private/cuscare/dashboard` | 4 KPI + tabla Groups |
| Search | `#/private/cuscare/**customer**` | el rótulo y la ruta NO coinciden |
| Manage MO in error | `#/private/cuscare/mo-management` | vacía a propósito (así está la real) |
| Users | `#/private/cuscare/settings/users` | tabla **Material** |
| Roles | `#/private/cuscare/settings/roles` | tabla **Material** |
| Groups | `#/private/cuscare/settings/**entities**` | el menú dice "Groups", la ruta es `entities` |
| Templates | `#/private/cuscare/settings/templates` | lista de carpetas, NO tabla |

### Dos tablas distintas, no una

Tickets es un `p-table` de **PrimeNG**; las de ajustes son de **Angular Material**
(`mat-mdc-table`). No es un descuido: la app real usa ambas librerías y su métrica
difiere. Asumir "misma tabla" da una réplica sutilmente falsa en 4 vistas.

| | Tickets (PrimeNG) | Ajustes (Material) |
|---|---|---|
| alto de fila | 47.5px | **32.7px** |
| fondo cabecera | `#f7f8fa` | **blanco** |
| peso cabecera | 600 | **500** |
| separador | `#dadfe6` | **`rgba(0,0,0,.12)`** |
| paginador | sí | **no** |

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

## Red e2e

`npm run e2e:cuscare` (Playwright, :4415, en CI). Conduce la app con **clics reales**:
navegación del sidebar, menú del engranaje, pestañas del detalle — y fija la métrica
medida del original (fila 47.5, cabecera 41.5, ajustes 32.7, sidebar 90.3, lienzo
`#f4f6fc`), que es lo que se rompe en silencio al retocar CSS.

Existe porque el hit-testing pilla lo que la consulta del DOM no: esta suite cazó que
la barra inferior **tapaba el engranaje** —visible y "correcto" en el DOM, pero
imposible de pulsar— porque yo la había puesto `fixed` cuando en la real es `static`.

## Deuda conocida (anotada, no escondida)

- **La ilustración de Search es una aproximación.** Silueta y paleta parecidas; no es
  el asset original. Los iconos del nav y el logo SÍ son los reales (descargados de
  `assets/icons/iconos-cuscare/`).
- **Lo vivo no se replica**: paginación, filtros y ordenación son maqueta (el seed no
  se filtra). La forma y los estados sí son fieles.
- **Los iconos de acción son glifos Unicode** (⌕ ⇩ ✎ 🗑), no los SVG del original.
  Bastan para la caja y la silueta; sustituirlos es trabajo mecánico pendiente.

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
