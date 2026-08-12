# Informes / Data Reports — réplica de la app embebida en iframe

> **Source of truth** de los valores medidos de la pantalla que el supervisor real
> embebe bajo `#/private/stats/datareports`. Si un valor de
> `projects/supervisor/src/app/features/informes/` no cuadra con este documento,
> manda **lo medido en el sitio real**, no el código.

## Por qué existe esta réplica

`supervisor.smart-contact.com/aed/#/private/stats/datareports` **no pinta nada
propio**. Monta un `<iframe class="content-iframe">` cross-origin a:

```
statssm.smartcontact.es/SmartContactStatsFN/#/token/<token de sesión>
```

(sandbox: `allow-scripts allow-forms allow-same-origin allow-downloads allow-top-navigation`)

Eso es otra aplicación Angular entera, con **su propia paleta, su propia
tipografía (Roboto) y su propio PrimeNG**. Y es exactamente lo que rompe la
captura a Figma: `html.to.design` y los plugins equivalentes sólo alcanzan a
seleccionar el elemento `iframe.content-iframe`; su contenido queda fuera por
política de mismo origen. En las capturas de referencia se ve el propio plugin
etiquetando `iframe.content-iframe` y `div#content`, sin poder entrar.

La réplica reconstruye ese contenido **de forma nativa, sin iframe**, para que
sea capturable, medible, editable y navegable en `/informes`.

## Cómo se extrajo

Abriendo la URL del iframe **a nivel superior** en el navegador (misma sesión):
ahí ya es mismo origen y el DOM es accesible. Sobre esa pestaña:

- `getComputedStyle` + `getBoundingClientRect` sobre el árbol visible → geometría
  y color de cada caja, a **viewport 1460×792**.
- Recorrido de `document.styleSheets` filtrando los `<style>` que Angular inyecta
  → las reglas de componente con sus unidades ORIGINALES (`vw`/`vh`/`rem`).
- `assets/i18n/es.json` (5044 claves) y `en.json` (5014) → **el copy exacto**.
  Es la misma jugada que funcionó en CusCare: el diccionario de la app manda
  sobre transcribir de un pantallazo.

## Traducción de unidades: `vw`/`vh` → `cqw`/`cqh`

El original dimensiona casi todo en `vw`/`vh` porque, dentro de un iframe, el
viewport **es** la caja del iframe. La réplica vive dentro del área de contenido
del supervisor, así que usa `container-type: size` + `cqw`/`cqh`: la
equivalencia es exacta y el comportamiento al redimensionar, idéntico.

| Original | Réplica | Qué mide |
|---|---|---|
| `gap: 2vw` | `gap: 2cqw` | separación ilustración ↔ tablas |
| `padding: 10vh 0` | `padding-block: 10cqh` | aire arriba/abajo de la columna de tablas |
| `max-width: 50vw` | `inline-size: 50cqw` | ancho de la columna de tablas |
| `height: 32.7vh` | `block-size: 32.7cqh` | alto de la caja de cada tabla |
| `max-width: 16vw` | `max-inline-size: 16cqw` | recorte con elipsis de las celdas |

## Paleta medida

Vive en `projects/supervisor/src/app/features/informes/_informes-replica.scss`.

| Uso | Valor |
|---|---|
| Fondo | `#ffffff` |
| Texto cuerpo | `#495057` |
| Texto en inputs | `#334155` |
| Placeholder y lupa | `#94a3b8` |
| Borde de control | `#cbd5e1` |
| Borde de tabla / panel | `#e2e8f0` |
| Borde de tarjeta (landing) | `#e9ecf1` |
| Cabecera de tabla y toolbars | `#f8f9fa` |
| **Cian de marca** (chips, día activo, «Limpiar») | `#60d3e4` |
| Selección suave (listbox / árbol) | `#f0fcff` sobre texto `#058199` |
| **Azul marino** (FAB, botón primario, diálogo) | `#1c283d` |
| Botones de transferencia | fondo `#f1f5f9`, icono `#475569` |
| Icono suave (cabecera de diálogo) | `#64748b` |
| Scrollbar | `#a4a8af` |

Sombra de control: `0 1px 2px 0 rgb(18 18 23 / 5%)`.
Sombra de diálogo: `0 20px 25px -5px rgb(0 0 0 / 10%), 0 8px 10px -6px rgb(0 0 0 / 10%)`.

## Pantalla A · Landing (`initial-view`)

Tres columnas: ilustración (`552` de ancho, imagen `522.8×792` con
`object-fit: fill`), columna de tablas (`50vw` = `730`) y carril derecho de
`70` con el engranaje arriba y el `+` abajo (botón `42×42`, radio 50 %).

Cada tarjeta mide `730×297.7`:

- rótulo `h3` de **14.742 px / 700 / #000** con el icono `pi-external-link` DENTRO
- caja de tabla `32.7vh`, borde `1px #e9ecf1`, radio `4.2px` (`.3rem`)
- barra de `34.9` con buscador (`204×28.3`, radio 6) y `pi-sliders-h` a la derecha
- `th` de `29.5` a **12.6 px / 600**; filas de `43`; celdas con `padding: 8.4px 12.6px`
- columna de acciones **sticky** a la derecha con fondo blanco
- chips de entidad: alto `25.2`, radio 16, `padding: 7px 10.5px`, gap `4.3`,
  y badge `+N` a **10.5 px / 700**

«Histórico» es sólo el rótulo (`46.5` de alto): no tiene tabla.

El botón `+` abre el diálogo **«Informes de Estadísticas»**: `642.6×429.5`
anclado abajo a la derecha, **azul marino**, radio 12 — el único sitio oscuro de
toda la aplicación. Dentro, cuatro menús: Servicios (`227.6`), Grupos (`175`) y
Agentes (`175`) en fila, y CDR (`175`) debajo.

## Pantalla B · Constructor (`main-menu-selection`)

Es la pantalla que se estaba intentando capturar. Dos toolbars arriba
(`46.5` + `44`) y una rejilla de cuatro bloques:

```
Entidades (50 %)             │ Fechas (50 %)
Columnas  (25 %)             │ Previsualización (75 %)
```

- **Entidades**: picklist de dos listas de `321.3` con cuatro botones de
  transferencia (`35×32.5`, paso `39.5`) en medio: `»  ›  ‹  «`.
- **Fechas**: listbox de 7 presets (`170` de ancho, items de `34.5` a `15.4 px`)
  + calendario de `511`, con el día activo en cian y la barra «Hoy / Limpiar».
- **Columnas**: árbol de 24 nodos, sangrado de **14 px por nivel**, nodo de
  `31.5` con fondo `#f0fcff`.
- **Previsualización**: `p-select` «Totales» + casilla «Ocultar datos vacíos» y
  una tabla de **25 columnas** (`th` de `38.5`, filas de `49.4`) rellena con `X`.

Los rótulos de sección son `h3` de **16.38 px / 700 / #000**.

## Datos

**El seed es 100 % inventado** (`data/reports.data.ts`). La app real muestra
entidades de clientes con su número de servicio, marcas de terceros y nombres de
informes de prueba de sus empleados. Se replica la FORMA (longitudes, formatos,
distribución) para que el layout respire igual — nunca el contenido.

Sí se replica literal el **catálogo de informes predeterminados** y el **árbol de
columnas**, porque eso es el producto, no dato de cliente; ambos traducidos con
`assets/i18n/es.json` de la propia app.

Dos erratas del original que **no** se replican: doble espacio en
`"Desbordadas  (Ent. Bot N.A.)"` y espacio final en `"AT. Ent. % "`. Copiarlas
sería replicar un fallo, no un diseño.

## Guardarraíl

`scripts/token-guard.mjs` exime a `projects/supervisor/src/app/features/informes/`
de las reglas 5-7 (tipografía literal), igual que a `agent` y `cuscare`: es la
copia de un producto **externo** al design system y tokenizarla la haría
parecerse a nosotros en vez de al original (mismo criterio que DD-35).

## Lo que NO se replica

- El **token de sesión** de la URL del iframe (es una credencial; no entra al repo).
- La lógica viva: el calendario está congelado en **agosto de 2026 con el 12
  marcado**, que es lo que muestran las capturas de referencia. Documenta una
  pantalla, no reimplementa su motor de informes.
- El botón «Crear Tabla» no genera nada: queda deshabilitado hasta que hay
  entidades elegidas, que es su estado real de partida.
