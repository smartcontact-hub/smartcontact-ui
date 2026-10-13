# Frente · CusCare con el DS — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> **Sello:** 2026-10-13 · HEAD `b49b56e0` — primer tramo (listado de Tickets, inicio de sesión) listo para publicar.

`projects/cuscare-ds` es CusCare hecha con los componentes `sc-*` y los tokens `--sc-*`. Es independiente de
`projects/cuscare` (la réplica sin DS, que se conserva tal cual como referencia): otro proyecto de Cloudflare
(`sc-cuscare-ds`), otra url, y un cambio aquí no reconstruye la réplica ni al revés (`scripts/cf-sites.mjs`).

## Regla de trabajo

Los cambios van **solo dentro de `projects/cuscare-ds`**, con piezas de PrimeNG. No se toca el DS compartido
(`ui-smartcontact`) ni el Supervisor sin permiso. La lógica es la de producción; el aspecto, el del DS, con los
tamaños del Supervisor (14 px, 32,5 px de alto).

## Hecho

- Barra lateral propia (4 entradas, se abre al pasar el ratón), inicio de sesión con formas en movimiento y cuenta
  de demostración ficticia (`src/app/data/demo-credentials.ts`).
- Listado de Tickets: 19 columnas ordenables, filtros por columna (selección, múltiple, texto, fechas, ID y
  Productos con opción + texto, tipo de solicitud con «Match»), gestor de columnas, selección, exportación a CSV.
- Auditoría Figma ↔ producción para desarrollo (documento de Claude, enlazado desde el equipo).

## Pendiente

- Reembolso en espera de la lógica de producto; datos de ejemplo inventados.
- Sin comprobación real de credenciales ni doble factor; sin guarda de acceso ni «Log out».
- Panel de control, búsqueda y «Manage MO in error» son páginas vacías.
- `list-page` y la barra lateral son copias locales; subirlas al DS exige permiso (toca el Supervisor).
- Crear en Cloudflare Pages el proyecto `sc-cuscare-ds` (comando `npm run build:cuscare-ds`, salida
  `dist/cuscare-ds/browser`, mismas exclusiones de ruta que los otros sitios).
