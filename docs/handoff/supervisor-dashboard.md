# Frente · Supervisor Dashboard — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.

## ✅ 2026-10-01 · Cada agente enseña en el Dashboard el estado que tiene en Administración

> **Sello: rama `areses/kind-liskov-9cae8c`, sobre `origin/main` HEAD `0b748e75`.**

**Qué pasaba** (medido por id, ejecutando los dos ficheros): de los 10 agentes de la demo, 6 (ids 5 a 10) salían en un
estado en el Dashboard y en otro en Administración › Agentes. El Dashboard llevaba su propia lista a mano
(`DEMO_AGENT_PRESENCE`, DD-127) y Administración la suya en las semillas, con un vocabulario más rico.

**Qué hay** (DD-139). La fuente es el almacén de agentes, el que pinta el listado. El Dashboard lo lee por id con una
correspondencia fija, `PRESENCIA_EN_DASHBOARD` (`data/presencia.ts`): Disponible; todo lo conectado que no lo está
(No disponible, sus motivos, Administrativo y Post-conversando) es En pausa; Desconectado. Lo lee al pintar
(`DashboardStore.monitors`), también sobre lo que el navegador ya guardó (`conPresencia`), sin subir la versión de
ningún almacén. Los agentes de la demo son los ids 1 a 10 (`DEMO_AGENTS`). `buildWidget` y `detailRows` piden el estado
como parámetro obligatorio, y el asistente y el detalle lo reciben de la página (`[estadoDe]`). Las cifras pasan a las de
Administración: 5 disponibles, 3 en pausa y 2 desconectados («5 de 8 conectados»).

**Medido.** `e2e/supervisor/estado-agentes.spec.ts`, con tres casos sobre lo pintado en las dos pantallas (los datos de
fábrica, un monitor guardado con todos desconectados y un cambio en la ficha), en rojo contra `main` y en verde con el
cambio. ⚠️ La primera versión del caso de la ficha salía en rojo sin probar nada: el guardado llega 400 ms después del
clic y la prueba se iba antes, con el botón ya apagado (cargando). Ahora espera al aviso de guardado y comprueba que el
listado ya enseña el estado nuevo. La prueba de DD-129 lee sus cifras de la tabla del primer monitor en vez de fijar 9 y 5.

## ✅ 2026-09-28 · El detalle de una cifra ya no corta el tiempo por la derecha

> **Sello: rama `areses/magical-vaughan-5cf689`, sobre `origin/main` HEAD `212debe8`.**

**Qué pasaba** (medido en producción a 1440, claro y oscuro): el panel «En curso (23)» medía los 20rem de PrimeNG y
la tabla 300 px en una caja de 287,5; el contenedor recortaba los 12,5 de más y el tiempo se leía «9:1». Lo empujaba
la segunda línea de cada conversación («Cliente #56705 · Atención al cliente», 200 px sin partir): el nombre ya
llevaba `contain: inline-size` (#263), esa línea no.

**Qué hay.** `contain: inline-size` sube a `.detail__main` (ninguna de las dos líneas pide ancho), la segunda línea
lleva el entero en el `title` (DD-124) y el panel mide `var(--sc-spacing-25)` (350 px). Hacen falta las dos piezas,
medido quitando cada una: solo el `contain` recorta 7 líneas con los datos de siempre; solo el ancho deja la tabla en
673 px con `?datos=tortura`. Con las dos, los seis detalles del primer monitor caben a 1440 sin recortar nada (y «En
curso», también a 375), y con tortura recortan con «…» las 46 líneas, todas con su `title`. Lo vigila un caso nuevo de
`e2e/supervisor/dashboard.spec.ts` (demo y tortura), visto en rojo contra producción (12 y 386 px de más).

## ✅ 2026-09-15 · Rafa acepta los cambios del DS y la raya de las pestañas cruza la cabecera

Aceptados por Rafa: pie de tabla, `sc-gauge max` y las barras de `metergroup` a 7 (medido: las 8 a 7 px). La cabecera
pintaba DOS rayas (la de la tira, que acababa tras «+ Monitor», y otra más clara un píxel más abajo): ahora hay una,
la de la tira, que continúan las acciones con el mismo borde (`align-items: stretch`). Visto a 1440, 1024 y 390.
Rama `arebury/arreglos-que-se-notan`.

## ✅ 2026-09-15 · La tarjeta de widget pasa a ser un sc-panel

> **Sello: rama `arebury/dashboard-widget-card-panel` (caja `bladderwrack`), sobre `origin/main` HEAD `a4c2209`
> (#186 cabecera propia y aviso de sc-panel, #187 `fill` que no se ensancha).**
> Local: `npm run ng -- serve supervisor --port 4311` → `http://localhost:4311/dashboard` (tras `build:design-tokens`
> y `build:components`: el servidor no vigila `dist/`).

**Qué hay.** `widget-card` es un `sc-panel` con `fill`, `severity` (borde de alerta), `<ng-template #header let-titleId>`
(h2 con `[id]="titleId"`, línea de entidades y `cdkDragHandle`) y el ⋮ en `#icons`. Fuera el marco, el borde y los
rellenos propios. Sin `toggleable`: `p-panel` pondría el mismo id en su botón de colapsar y en el título.

**Medido** con `e2e/supervisor/dashboard.spec.ts` (6/6) y la sonda `v4` (`sondas/v4.mjs` + `v4-resumen.mjs`, antes,
después y con tres fallos fabricados, los tres en rojo) a 1440/1024/768/390: ningún título cortado, asa y ⋮ bien,
3 alertas con borde de rol, la región del cuerpo la nombra el h2 (id único), y el chip del filtro no mueve la cabecera
(59,5 px con y sin chip). Lo que cambia a la vista son los rellenos del panel: el cuerpo baja 7 px, el ⋮ se separa
7 px más del borde, y el cuerpo va 1,75 px más adentro que el título (cabecera 14, cuerpo 15,75: tokens del panel).

⚠️ La primera versión daba 271 px de scroll lateral a 390: el cuerpo de `p-panel` es una rejilla con la columna en
`auto` y la tabla de agentes lo ensanchaba. Lo arregló hind en `sc-panel` (#187); si una pieza nueva del Dashboard
se sale de su tarjeta, mira primero si su contenedor es `grid` o `flex` sin `minmax(0, …)` / `min-width: 0`.

## ✅ 2026-09-14 · El Monitor del Supervisor queda adaptado y subido en su rama, para iterar con Rafa

> **Sello: rama `arebury/dashboard-adapt-supervisor-monitor` (caja `volute`), sobre `origin/main` HEAD `c55f857`;
> fundido como #184 el 2026-09-14.**

**Qué hay.** Adaptación del «Monitor» del Supervisor real (`supervisor.smart-contact.com/aed/#/private/monitor`)
en `projects/supervisor/src/app/features/dashboard/`: pestañas de monitores con arrastre, rejilla de
cajas (una o cuatro), 16 tipos de widget del catálogo real con datos demo que laten cada 8 s, alertas
por umbral con campana y «marcar como vistas», panel lateral de detalle al pulsar una cifra, asistente
para crear o editar widget, carrusel, modo pared (pantalla completa) y responsive a 1440/1024/768/390.
Persiste en `localStorage` (`sc-dashboard-monitors`, versión 1).

**Fuera de la carpeta:**
- `supervision.routes.ts`: la ruta `dashboard` carga `dashboard.routes.ts`; bloque `dashboard` en los 4 `i18n/*.json`.
- DS: pie de tabla en `sc-preset/css.ts` (`sc-datatable .p-datatable-tfoot td` a body-2 semibold, tope
  del preset en `audit:primeng-coupling` 59 → 60 con su motivo) y `max` en `sc-gauge` (anillo contra un
  total mayor que la suma; ejemplo «Sobre un total» en su página de sc-docs).
- `audit:datatables`: lista `NO_SON_LISTA` (las dos tablas del Dashboard no son pantallas de lista) y la
  regla 3 ya no confunde las ranuras de `sc-datatable` (`#footer`…) con plantillas de celda.
- `e2e/supervisor/dashboard.spec.ts`: el asistente no cambia de tamaño y la rejilla cabe a 4 anchos
  (las dos mitades vistas en rojo con el fallo fabricado).

**Estudio y capturas del original:** `~/Documents/Claude/2026-09 dashboard monitor/` (ESTUDIO.md,
`catalogo-widgets.json`, `captura/`, y las sondas de Playwright en `sondas/`, que apuntan a
`node_modules` de `volute`). El perfil con la sesión de Rafa en el Supervisor ya está borrado.

## SIGUIENTE

1. **ESPERANDO A RAFA** (no se pregunta, él lo saca):
   - Umbrales: paso «Avisar cuando» en el asistente y objetivo visible en el widget (hoy fijos en `data/alerts.ts`).
   - Plantillas + «Restablecer» por monitor (en vez de «volver a la demo»).

**Trampas del frente:**
- ⚠️ El estado de un agente no se escribe en el Dashboard: sale del almacén de agentes (DD-139). Un widget nuevo que
  cuente agentes recibe `estadoDe` y se relee en `conPresencia`; una cifra de agentes escrita a mano vuelve a separar
  las dos pantallas.
- ⚠️ Una prueba de scroll lateral mide `main#main-content`, no `documentElement` (el scroll de la app vive ahí).
- ⚠️ `lint` y `usage:check` a mano antes del `preflight`: a #184 le costó tres vueltas.
- ⚠️ Un `output` llamado `select` choca con el evento nativo; por eso las pestañas avisan con `activate`.
- ⚠️ En una celda de `sc-datatable` (tabla automática), `min-width: 0` y `overflow: hidden` no bastan: un texto
  `nowrap` sigue pidiendo su ancho entero a la columna. Lo corta `contain: inline-size` en el bloque del texto.
- ⚠️ Las sondas de `~/Documents/Claude/2026-09 dashboard monitor/sondas/` hasta la `v3` escriben con
  `new URL('.', import.meta.url).pathname`, que deja `%20` y guarda en una carpeta hermana
  `2026-09%20dashboard%20monitor`. La `v4` usa `fileURLToPath`.

**No tocar:** `docs/figma-pendiente.md` ni las piezas del DS que lleva hind (tabs, panel).
