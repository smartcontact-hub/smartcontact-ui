# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-19, cierre sesión 18.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **Confirma el CI LEYENDO el run** del último commit.
3. **B3 y B4 están cerrados.** De los bloques del plan de convergencia solo
   queda **B5b** (necesita diseño). Suite del supervisor: **108 tests**.
4. Si vas a migrar otra tabla, la receta está escrita y medida:
   [`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md).
5. **La decisión más grande abierta es `--sc-text-subtle`** (2.04:1, 161 usos).
   No es un arreglo mecánico: cumplir AA lo convierte en `text-secondary`, o
   sea la jerarquía de tres grises no cabe. Ver más abajo.

---

# HECHO en la sesión 16

| Commit | Qué |
|---|---|
| `6c84fad` | Un solo tamaño de botón en la TopBar — **lo cazó Rafa** |
| `27104fa` | B4 · `sc-datatable` aprende los 4 gestos que le faltaban |
| `a602010` | B4 · labels y plantillas pasan a la tabla del DS |
| `fef90b0` | La receta para migrar las 14 tablas que quedan |
| `338f4e7` | La columna "Ahora" del recorrido `/reglas` vuelve a ser el ahora |

## B4 · las 4 capacidades (`27104fa`)

`[rowStyleClass]` · `(rowClick)` · `(rowContextMenu)` · `[visibleColumns]`.

Dos decisiones que conviene no revertir sin leer esto:

- **`(rowContextMenu)` emite un evento; NO trae un `<p-contextmenu>` dentro.**
  La Ola 2 mató justo el segundo motor de menú: la app tiene UN `<p-menu>` por
  tabla que sirve el kebab y el click derecho. Un menú propio del DS volvería a
  poner dos modelos donde hay uno.
- **En `selectionMode="multiple"` se desactiva `pSelectableRow`.** PrimeNG
  selecciona al clicar la fila y eso choca con el modelo canónico de la Ola 6
  (la fila abre, la casilla selecciona): con los dos activos, un click hacía las
  dos cosas. En `single` se mantiene, porque ahí seleccionar ES clicar la fila.

**Dónde se verifican**: el piloto que el plan eligió solo ejercita 2 de las 4
—labels y plantillas no tienen click de fila ni selector de columnas, medido: 0
`(click)` en sus `<tr>`—, así que `rowClick` y `visibleColumns` viven en la story
nueva de `sc-demo` con 5 tests (`e2e/datatable-gestures.spec.ts`). La aserción
que más pesa (marcar la casilla NO abre) se probó **en rojo primero**: sin el
`stopPropagation`, el contador de aperturas sube a 2.

## B4 · el piloto (`a602010`)

Lo que casi sale mal: migrar tal cual habría dejado esas dos tablas
**visiblemente distintas de las seis sin migrar** (filas de 42px contra 54,
cabecera 14px/600 contra 12px/500). De ahí `styles/_sc-datatable-list.scss`, la
piel `.list-table`. **Sin esa clase, una tabla migrada no se parece a las que
faltan.**

Y aun con los números cuadrando, la pantalla enseñó dos cosas que mi medición no
cubría (ver LEARNINGS #20): la banda vacía de `caption` y las columnas
recolocadas por `table-layout`. Resultado final medido en claro y oscuro:
idéntico a una tabla sin migrar.

**Red nueva**: `e2e/supervisor/admin-datatable-pilot.spec.ts`, 9 tests. Ninguna
de las dos páginas tenía uno antes. La suite del supervisor pasa de 22 a **31**.

---

# Abierto — por qué y qué haría falta

## B3 · tokens-sync — **SOLO RAFA**

No hay nada que arreglar en código. Falta que Rafa **re-exporte desde el Theme
Designer** para que el workflow corra y quede verde.

## B5b · la prosa i18n del constructor — **NECESITA DISEÑO**

`conditionToDesc()` compone gramática española (` o ` / ` ni `). Necesita ICU
MessageFormat o un compositor por locale. Lo mecánico (~28 claves) ya está.

## Las 14 tablas que quedan

Con receta, orden por dificultad y las 3 trampas medidas en
[`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md). Empieza por
las fáciles; `conversation-table` es la última (shift+click por rango, Enter/
Espacio, columna de 44px medida al píxel).

## La mitad SCSS de B2

Sigue aparcada a propósito: cinco ficheros con divergencias reales y menos
beneficio. Las clases compartidas están puestas como seam.

---

# SESIÓN 17 — lo que cambió

## Tablas: de 2 migradas a 6

`repo-list`, `agentes`, `grupos`, `usuarios` (las 3 hermanas, delegadas con la
receta como spec y revisadas por riesgo). **Queda 1 de la familia `.table`:
`conversation-table`.**

**Por qué NO migra conversation-table** — y no es pereza: su selección por rango
tiene anclaje propio (`lastSelectedIndex`), su casilla de CABECERA necesitaría
plantillas de cabecera en el DS (3ª capacidad nueva), y su modelo de selección
lo posee el componente PADRE, no la tabla. Eso no es aplicar la receta, es
rediseñar su contrato. Si se aborda: `sc-datatable` necesita `headerTemplate`
por columna, y hay que decidir si el rango con anclaje sube al DS o se queda.

**Quedan además las 3 de memory** (`rules`, `categories`, `entities`): misma
gramática con otro nombre de clase, sin selección, sin selector de columnas. Son
las MÁS fáciles que quedan y su arrastre CDK murió con DD-28. Empieza por ahí.

Capacidades nuevas del DS en esta sesión: `col` en el contexto de celda (lo
exigió repo-list, cuyas columnas salen de config), `[rowsFocusable]`,
`(rowKeydown)` y `stopRowClick` por columna.

## Divergencias que la convergencia creó, y hubo que corregir a mano

Pasa siempre que se delega en paralelo. Vigílalo:

- **Zebra**: users la conservó, agents y groups la soltaron. Unificado en
  hairline (6 de 9 ya lo eran). Cambio visible en 3 tablas; se revierte con
  `[stripedRows]`.
- **`cursor: pointer`**: agentes quedó abriendo EN SILENCIO. El `<tr>` lo pinta
  el DS y `pSelectableRowDisabled` le quita la clase de la que PrimeNG saca el
  cursor.
- **Dos `::ng-deep`** para lo mismo → una regla en la piel compartida.
- **El hueco alrededor del kebab** abría la ficha (el `<td>` del DS no corta la
  propagación) → `stopRowClick`.

## Contraste: era un fallo sistemático, no una decisión de marca

Yo había dicho que `text-success` necesitaba Figma y a Marta. **Falso**: solo
`text-secondary` está enforced con el Kit. Al verificarlo apareció lo de verdad:
SEIS colores de texto semánticos no tenían valor en oscuro y heredaban el del
claro, calculado contra blanco. `text-link` daba **2.48:1** sobre slate-900.

Arreglados los dos temas (ningún tono pasa AA en ambos: hace falta valor por
tema) y añadidos a `A11Y_GATED`. **17/18 pares cumplen AA**; el que falta es el
conocido de W5, donde ni negro ni blanco pasan sobre blue-400.

## WCAG 2.1.1: las filas que abren ya se abren con el teclado

Agentes, grupos y usuarios abrían la ficha al clicar y **nunca** fueron
alcanzables por teclado — cero `tabindex`, cero `keydown`, cero enlaces,
comprobado en el árbol anterior. No lo rompió la migración; llevaba así siempre
y nada lo medía. Enter abre en las tres, con test.

## Cabeceras duplicadas — 4 páginas (lo cazó Rafa en pantalla)

El hub de repositorios y las 3 subpáginas AED decían su nombre DOS veces: en
el breadcrumb y otra vez en una banda debajo, con la MISMA clave i18n. Eran las
últimas sin convertir al modelo "todo arriba" de S59. El `<h1>` no se borró, se
ocultó (`visually-hidden`): era el único encabezado del documento.

**`sc-page-header` queda SIN consumidores en la app** — solo lo usa su propio
demo. No lo he borrado (es API pública del DS y otra app podría quererlo), pero
si sigue así en la próxima revisión, es candidato a retirar.

Red: `page-identity.spec.ts` (7 tests). Comprueba que hay UN h1, que mide 1px
—o sea que está oculto de verdad, porque uno visible pasaría un simple conteo— y
que su texto coincide con la miga actual.

## La red que faltaba

`e2e/supervisor/list-table-grammar.spec.ts` — 12 tests que fijan los valores
COMPUTADOS de la piel (que se agarra a clases internas de PrimeNG), el separador
en oscuro, el cursor y el teclado. Suite del supervisor: **43 tests**.

# SESIÓN 18 — el tema oscuro estaba a medias

| Commit | Qué |
|---|---|
| `2506483` | El arnés unitario existía a medias — ahora corre (vitest, 10 tests) |
| `7265a2f` | `--sc-label-*` gana tema oscuro; un solo vocabulario de insignia |
| `6a0b5a1` | La red tenía un agujero, y por él cabían seis defectos |
| `ca9e959` | Un solo anillo de foco, no cuatro |

## La causa raíz, en una frase

`--sc-color-*` es la paleta PRIMITIVA y **`07-dark.css` no redefine ni una**.
Escribir `background: var(--sc-color-slate-100)` en una hoja de página es
escribir un valor FIJO: en claro se ve bien y nadie se entera, en oscuro se
queda claro. Si encima el texto sí es semántico, sale gris claro sobre gris
claro. Medido en 28 rutas: `.rules-status--inactive` 1.40:1, `.avatar` 1.09,
el item ACTIVO del menú de AED 1.09, el chip que avisa de errores 2.16, el id
de una conversación fallida 1.30.

Y debajo: los **32 tokens `--sc-label-*` no tenían valor oscuro**, así que
`sc-chip` y `sc-tag` —que son del DS— pintaban islas pastel en media app, y
el defecto llegaba a cualquier consumidor.

## Lo que dejó de ser opinión

Ahora hay **un solo vocabulario de insignia**: `--sc-label-*`. Lo hablan
`.sc-label`, `.chip`, `.status-pill`, `.rules-status`, `.state-tag`,
`.entity-type-chip` y `.memory-failed-chip`. Se probó antes con la rampa
`--sc-bg-*-subtle`/`--sc-text-*` y **salió peor** (danger a 4.41:1): esa
pareja está calibrada para texto sobre el LIENZO, no dentro de una pastilla.
Ver `customs-catalog` §1.6.

## Las redes nuevas

- **`theme-contrast.spec.ts`** — 51 tests, 17 rutas × 2 temas. Dos preguntas:
  ¿queda alguna superficie clara en oscuro? y ¿se lee el texto encima? La
  segunda existe porque al oscurecer un fondo puedes dejar texto oscuro
  encima. **Corre también en claro**: al arreglar el oscuro salieron 4 fallos
  de AA en claro que llevaban ahí desde siempre.
- **`focus-ring.spec.ts`** — 7 rutas tabulando. No fija el hex (lo resuelve
  del token en vivo): vigila la UNANIMIDAD. Cuenta los anillos que ve y falla
  si son menos de 3, para no pasar en verde sin medir.
- **`sc-datatable.component.spec.ts`** — el primer `TestBed` del repo. Los
  targets `test` apuntaban a karma y karma nunca se instaló: los "0 tests
  unitarios" no eran una decisión, eran un arnés sin terminar.

# Decisiones que siguen necesitando a Rafa

1. **`--sc-text-subtle` a 2.04:1 sobre blanco, en 161 usos.** Descripciones
   del hub de repositorios, cuerpo de los estados vacíos, hints, placeholders.
   **Corrijo lo que decía este mismo fichero** ("su uso es placeholder/
   disabled"): eso es falso, está medido en contenido real.
   **No tiene arreglo mecánico**: para llegar a 4.5:1 sobre blanco hay que
   subir a slate-600, que **es** el valor de `--sc-text-secondary`. O sea, la
   jerarquía de tres grises no cabe en AA sobre blanco; caben dos. El tercer
   nivel tendría que distinguirse por tamaño, peso o cursiva. Cambia el
   aspecto de casi todas las pantallas → decisión tuya, no mía.
2. **Dos botones del preset, bajo AA en claro**: `p-button-danger` (blanco
   sobre red-500, 3.76:1) y la etiqueta de `p-button-secondary outlined`
   (slate-500, 2.95:1 — es el botón "Añadir" de AED, un control primario).
   Vienen del Kit → **Rafa + Marta**.
3. Los cuatro están fijados en `theme-contrast.spec.ts` con su número, a la
   vista. Cualquier OTRO fallo rompe la prueba; estos no, hasta que decidas.
4. ~~`--sc-text-secondary` 2.95:1~~ · ~~`--sc-text-success`~~ · ~~separador en
   oscuro~~ — hechos en la 17.


---

# TRAMPAS (verificadas, las nuevas primero)

- **La paleta `--sc-color-*` NO se remapea en oscuro** (cero definiciones en
  `07-dark.css`). Usarla en un `background` o un `color` de página es escribir
  un valor fijo. Si además la pareja del otro lado sí es semántica, el
  resultado es ilegible en uno de los dos temas. Es la causa de casi todo lo
  de la sesión 18.
- **Un token de FONDO no es un color de texto, ni al revés.** `--sc-bg-primary`
  como `color:` daba 3.39:1; `--sc-text-info` como `background:` daba 3.15.
  Los dos colaban en claro y se rompían en oscuro.
- **`npm run verify` reescribe `dist/` debajo de un `ng serve` vivo** y lo deja
  con `Cannot find module '@smartcontact-hub/components'`. El server sigue
  sirviendo el bundle ANTERIOR, así que mides código viejo sin enterarte. Tras
  un `verify`, reinicia el dev server antes de volver a medir. Me pasó.
- **Los iconos de Material son LIGATURAS**: llegan al DOM como nodos de texto.
  Al medir contraste hay que darles el umbral de 1.4.11 (3:1, gráfico), no el
  de texto (4.5), o la medición se llena de falsos positivos y acabas
  silenciando la red.
- **Un `color-mix(... transparent)` claro sobre un fondo oscuro no sale
  "claro"** (0.24 de luminancia) pero sí lo bastante claro para matar el texto
  de encima. Medir solo la luminancia del fondo no basta; hay que medir el
  contraste con lo que lleva encima.
- **Al medir contraste, no filtres por "tiene fondo propio".** El texto casi
  siempre vive en un `<span>` sin fondo dentro de un contenedor que sí lo
  tiene. Con ese filtro la red pasa en verde saltándose el caso más común.
- **`waitForLoadState('networkidle')` sin acotar puede tumbar el CI sin que
  falle ninguna aserción.** Pasó: el test del datepicker agotó sus 60s en el
  `goto` y sus comprobaciones ni corrieron. sc-demo descarga 3,9 MB de fuente
  más chunks perezosos, así que con 2 workers la red tarda en callarse. Ya está
  acotado a 10s y sin `throw` en los 4 sitios. **Si añades un `goto` nuevo, usa
  el mismo patrón.** (La re-ejecución pasó: era flake, pero el arreglo va a la
  causa, no al síntoma.)
- **`table-layout`**: `main.scss` fuerza `fixed` en `table.table`; `sc-datatable`
  es `auto`. Al migrar, las columnas se recolocan si no lo corriges (la piel
  `.list-table` ya lo hace).
- **PrimeNG pinta SIEMPRE la banda de `caption`**, proyectes o no en
  `[scTableCaption]` → franja vacía sobre la cabecera.
- **Los `<td>` los pinta el DS**: cualquier regla encapsulada de la página que
  apuntara a `.table__td-*` deja de aplicar. Si una celda tiene estilo propio,
  dale un `cellTemplate` con su `<span>`.
- **`sc-demo` enruta por HASH**: `/#/components/x`. Sin la almohadilla el
  deep-link rompe los assets, la app no arranca y los tests fallan por el arnés,
  no por el componente. (Me pasó; 5 tests en rojo por eso.)
- **La casilla de PrimeNG mide 17,5px** (la nativa medía 15,75): con
  `table-layout: auto` eso ensancha la columna 2px. Con `fixed` no.
- **El tema oscuro se activa con `.sc-dark` en `<html>`**, vía `localStorage`
  `sc-theme` (ThemeService). Ponerle la clase a mano NO vale: el servicio la
  revierte y te deja midiendo un tema mixto — me dio números incoherentes hasta
  que validé el canal.
- **`borderBottomColor` existe aunque el ancho sea 0** (vale `currentColor`).
  Mide también `borderBottomWidth` o firmarás un contraste de un borde que no se
  pinta. Casi lo hago.
- **La fuente de iconos pesa 3,9 MB**: espera `document.fonts.ready` +
  `document.fonts.load(...)` antes de medir o capturar. Ojo: las ligaduras salen
  en `innerText` aunque estén bien pintadas, así que eso NO sirve para
  comprobarlo — hay que mirar la imagen.
- **`http-server` no hace fallback SPA**: para rutas profundas, `ng serve`.
- **El dev server sirve el DS COMPILADO**: tocar `projects/ui-smartcontact*/src`
  no se ve hasta `build:components` + **reiniciar** (una recarga dura no basta).
- **`export-clean` se salta con `CI=1`**.
- **Sin backticks en mensajes de commit**; usa `-F -` con heredoc.
- **Nada de `page.reload()`** en journeys de memory (stores en RAM).
- **`npm run e2e` pisa `public/usage/*.png`** y `usage:capture` reescribe
  `_usage-raw.json`: para capturar, script aislado con la API de Playwright.
- **Añadir o quitar un `<sc-*>` desfasa `audit:components`** → `node
  scripts/component-audit.mjs --write` + commitea `docs/inventory.md` y
  `docs/_component-status.json` en el mismo commit.

# Aparcado con razón (sin cambios)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro. |
| `line-height` sin unidad (~55) | Sin token destino en el Kit. |
| ~~`--sc-text-subtle` 2.04:1~~ | **Salió de aquí en la 18**: era falso que su uso fuera placeholder/disabled. Está en contenido real (161 usos). Sube a «Decisiones que necesitan a Rafa». |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda. |
| `group-assignment-table` y `agent-channel-table` | NO deben migrar: son formularios disfrazados de tabla. |
| Paginación de las tablas | Valor ≈ 0 hoy (6-84 filas). |
