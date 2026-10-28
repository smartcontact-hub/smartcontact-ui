# Frente · CusCare con el DS — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> **Sello:** 2026-10-13 · HEAD `86ac19bf` — primer tramo (listado de Tickets, inicio de sesión) listo para publicar.

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
- Pie de la app (`shared/status-bar`): botón de estado del agente y avatar; el botón abre el panel «Status» (popover que
  no se cierra al clicar fuera; lista de estados con su punto de color y «Administrativo» con buscador y lista de grupos).
- Comunicador: panel flotante con forma de móvil, sobre `p-dialog` sin modal y arrastrable por su franja superior; lo abre el
  avatar del pie y el panel de estados se hace a su izquierda mientras está abierto. Vistas: histórico, teclado,
  agentes/grupos y ajustes (perfil). Maqueta: no marca ni recibe llamadas y las listas son de ejemplo.
- Acciones en bloque del listado (`features/tickets/bulk-actions`): Assign (buscador + lista de agentes), Change status
  (selector + «Accept» + «Spam»), Cancellation y File (abren directo el modal). Un solo `p-popover` compartido: se cierra al
  clicar fuera, con Esc y al pulsar otro botón, que lo recoloca sin apilar. Modal único con `sc-dialog` y la tabla de tickets
  (`sc-datatable`); al confirmar avisa con `sc-toast` y limpia la selección (no cambia los datos). El diseño está en Figma, en
  la página «🛝 Playground» del archivo de la Landing, sección «Acciones masivas / Desplegables y modal de confirmación».
- Auditoría Figma ↔ producción para desarrollo (documento de Claude, enlazado desde el equipo).

## Pendiente

- Acciones en bloque: «Cancellation» abre directo el modal porque hoy solo hay «Todos los productos» (pendiente de confirmar con
  producto; si pudiera haber varios, popover + radios). La tabla del modal usa `sc-datatable`, el envoltorio del DS sobre `p-table`.
- Modo oscuro acotado (`sc-dark` en pie, comunicador y panel de estados): las variables de componente de PrimeNG
  (`--p-tabs-*`, `--p-inputtext-*`) no se recalculan dentro de una zona; parche a mano en `src/styles/_dark-scope.scss`.
  Se retira cuando el DS lo genere bajo `.sc-dark` acotado (cambio en el DS: pedir permiso). Los avatares siguen claros.
- Tamaños del comunicador y del panel de estados: ajustados a mano con las medidas de producción (letra 11,5 px → token de
  12; títulos 13,5 → 14; teclas 18; pestañas 9,75 → 12, sin token menor). Aproximaciones. Se pide a diseño un modo de
  tamaño «Agent» para retirar el ajuste a mano. Vistas Agentes, Histórico y barra de iconos sin comparar con producción.
- Panel de estados: lo que pasa tras elegir un estado (aquí cierra el panel y cambia la píldora) no se pudo comprobar en
  producción sin cambiar el estado real. Contador amarillo del pie, «Managed ticket» y el aviso del teclado («No puede
  realizar llamadas en estados de No Disponible») sin hacer.
- Reembolso en espera de la lógica de producto; datos de ejemplo inventados.
- Sin comprobación real de credenciales ni doble factor; sin guarda de acceso ni «Log out».
- Panel de control, búsqueda y «Manage MO in error» son páginas vacías.
- `list-page` y la barra lateral son copias locales; subirlas al DS exige permiso (toca el Supervisor).
- Crear en Cloudflare Pages el proyecto `sc-cuscare-ds` (comando `npm run build:cuscare-ds`, salida
  `dist/cuscare-ds/browser`, mismas exclusiones de ruta que los otros sitios).
