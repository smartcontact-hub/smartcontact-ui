# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-19, cierre sesión 16.**

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

# HALLAZGOS de esta sesión (medidos, sin arreglar)

1. **En oscuro el separador de filas es invisible — 1.00:1 — en las OCHO tablas
   de lista**, migradas y sin migrar por igual (`border-subtle` sobre
   `bg-surface`, que en oscuro son el mismo color). Es un rezagado de la Ola 3,
   que migró 7 bordes pero no estos. **No lo arreglé porque tocarlo solo en las
   dos migradas las separaría del resto**: va en un cambio propio que toque las
   ocho, y se te nota en pantalla, así que decides tú.

2. **Las claves i18n huérfanas son ≤88, no 145.** Cada vez que afiné el detector
   bajó el número (145 → 108 → 88): los falsos positivos son las claves
   construidas por interpolación (`` `memory.mock_samples.${id}.label` ``), que
   un escaneo ingenuo da por muertas — y borrarlas deja la clave cruda en
   pantalla. **No las borré**: el detector ya se equivocó dos veces, el beneficio
   para el usuario es cero y el fallo sí se ve. Es un barrido de 20 minutos con
   la app delante, pantalla por pantalla; a ciegas no.
   Cluster de más confianza: `memory.rules.active_title` / `inactive_title` (del
   diseño de dos secciones que ya no existe) y `memory.rules.builder.crumb_rules`
   (sobra desde la Ola 1).

---

# Decisiones que siguen necesitando a Rafa

1. **`--sc-text-secondary` a 2.95:1 sobre blanco** — bajo AA para texto normal, y
   es el texto secundario de TODA la app. Está *enforced* 1:1 con el Kit por
   parity §6: subirlo exige cambiarlo en Figma y re-exportar. **Rafa + Marta.**
   slate-500 `#8f97a3` → haría falta ~slate-600 `#6f7784` (4.52:1).
2. **`--sc-text-success` a 3.30:1 sobre la tarjeta en CLARO** — no llega al 4.5
   que pide AA para el texto de 12px del estimado mensual. En oscuro da 5.13. A
   `green-700` serían 5.02:1 y una línea, pero es el verde de toda la app.
3. **El separador de filas en oscuro** (hallazgo 1 de arriba).

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
