# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-19, cierre sesión 17.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **Confirma el CI LEYENDO el run** del último commit.
3. **B4 está cerrado.** Con él caen los tres bloques que llevaban meses
   abiertos: B2 (sesión 15), la red de componentes (15) y B4 (16). De los
   bloques del plan de convergencia solo quedan **B3** (necesita a Rafa) y
   **B5b** (necesita diseño).
4. Si vas a migrar otra tabla, la receta está escrita y medida:
   [`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md).

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

## La red que faltaba

`e2e/supervisor/list-table-grammar.spec.ts` — 12 tests que fijan los valores
COMPUTADOS de la piel (que se agarra a clases internas de PrimeNG), el separador
en oscuro, el cursor y el teclado. Suite del supervisor: **43 tests**.

# Decisiones que siguen necesitando a Rafa

1. **`--sc-text-secondary` a 2.95:1 sobre blanco** — bajo AA para texto normal, y
   es el texto secundario de TODA la app. Está *enforced* 1:1 con el Kit por
   parity §6: subirlo exige cambiarlo en Figma y re-exportar. **Rafa + Marta.**
   slate-500 `#8f97a3` → haría falta ~slate-600 `#6f7784` (4.52:1).
2. ~~`--sc-text-success`~~ — **HECHO en la sesión 17**, y resultó que yo estaba
   equivocado al listarlo aquí: no estaba enforced con el Kit, así que nunca
   necesitó a nadie. Ver la sección de contraste de arriba.
3. ~~El separador de filas en oscuro~~ — **hecho**: `border-default` en vez de
   `subtle`, aplicando la regla que ya escribió la Ola 3. Se paga en claro (el
   separador pasa de 1.10:1 a 1.34:1, se ve más). Si no te convence, es una
   línea en `_sc-datatable-list.scss`.


---

# TRAMPAS (verificadas, las nuevas primero)

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
| `--sc-text-subtle` 2.04:1 | Decisión de marca; su uso es placeholder/disabled. |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda. |
| `group-assignment-table` y `agent-channel-table` | NO deben migrar: son formularios disfrazados de tabla. |
| Paginación de las tablas | Valor ≈ 0 hoy (6-84 filas). |
