# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-18, cierre sesión 15.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **Confirma el CI LEYENDO el run** del último commit.
3. **El plan de convergencia está CERRADO**: las 6 olas de
   [`docs/plan-convergencia-flujos.md`](docs/plan-convergencia-flujos.md) están
   hechas, **y también su mitad pendiente de R6**. Ese fichero pasa a ser
   histórico; lo vivo es este hand-off.
4. **No queda nada esperando validación humana.** Lo que estaba en el tejado de
   Rafa se midió y se firmó (ver abajo). Lo que sí queda abierto son B2/B4/B5,
   que están bloqueados por otras razones.

---

# HECHO en la sesión 15 — las 6 olas (6 commits, CI verde)

| Ola | Commit | Qué cambió |
|---|---|---|
| 1 · Cabecera | `cd35413` | El constructor de reglas deja de tener cabecera propia |
| 2 · Menú de fila | `e426bde` | Un solo `<p-menu>` compartido en 7 tablas |
| 3 · Página canónica | `27b7d70` | Un lienzo, 4 arquetipos de ancho, bordes que se ven |
| 4 · Validación | `9707c7f` | R6 en los 3 formularios admin |
| 5 · Selección | `83608cb` | Barra masiva compartida en transcripciones |
| 6 · Gesto de fila | `1c86e41` | La fila ABRE; la casilla selecciona |

La red e2e del supervisor pasa de **14 a 21 tests**: las olas 2 y 6 trajeron su
propia cobertura porque la suite existente no ejercitaba nada de lo que
cambiaban.

## Ola 1 · una sola gramática de identidad

El constructor era la única página que se saltaba el breadcrumb: proyectaba su
cabecera al slot `lead` de la TopBar. Muere el slot entero.

**El orden importaba y se respetó**: primero declarar el breadcrumb, después
matar `setLead`. Al revés, esas dos rutas se quedaban con la TopBar vacía.

**Corrección al plan**: decía de declararlo vía `BreadcrumbService.set()`. No
hacía falta — `nueva` y `:id` son rutas distintas, así que el label sale
estático de la tabla de rutas, como en los tres formularios hermanos de admin.
Cero claves i18n nuevas.

## Ola 2 · un solo motor de menú de fila

Cada lista admin tenía **dos** implementaciones que ya divergían: panel HTML
inline por fila + menú contextual aparte con sus propios handlers. Ahora las dos
las sirve el mismo `<p-menu>`. Muere `core/utils/viewport.ts`.

- **La tabla de conversaciones gana kebab visible.** Sus acciones solo existían
  por click derecho: quien no lo supiera no podía descubrirlas.
- **C4 aplicado leyendo cada diálogo**: "Eliminar…" con puntos donde lleva a la
  puerta tecleada, "Eliminar" a secas donde es confirmación simple (labels).
- **Red nueva**: `e2e/supervisor/admin-row-menu.spec.ts` (3 tests). La suite
  pasaba 14/14 sin ejercitar nada de lo que la ola cambiaba.

## Ola 3 · lienzo, anchos y bordes

**Desvié la decisión escrita, y con motivo medido.** El hand-off mandaba cambiar
`--sc-border-subtle` en oscuro a slate-800. Al medir el código, la premisa era
falsa: **59 de 69 bordes ya usaban `--sc-border-default`**, que da 1.34:1 claro y
1.39:1 oscuro — exactamente los dos números que la decisión perseguía. El
defecto estaba en 7 rezagados con `border-subtle` sobre una superficie que en
oscuro es su mismo color (**1.00:1, el borde no existía**).

Migrar esos 7 evita cambiar un token global usado 70 veces y evita colapsar
`subtle` y `default` al mismo valor en oscuro (dark `border-default` YA es
slate-800). Los que siguen en `subtle` van sobre `--sc-bg-default`, donde sí se
ven (1.14:1): ahí «subtle» significa lo que dice.

**Lienzo único**: el constructor era la única página con lienzo gris. Medido, ese
relleno separaba 1.06:1 — las tarjetas nunca se leyeron por el fondo.
**La trampa C3 no se disparó** porque la unificación va hacia BLANCO: el
`settings-shell` ya es blanco en claro y gris solo en oscuro (deliberado, S67-A,
para que su rail no se funda) y **ese fichero no se tocó** (verificado en diff).

**Anchos**: `main.scss` llevaba desde S55 una nota pidiendo una escala canónica
antes de consolidar. Nace `styles/_page.scss` con los 4 arquetipos reales; cada
página declara cuál es en su plantilla.

## Ola 4 · una sola política de error

`validate()` era **código muerto** en los 3 formularios: `save()` salía antes si
`!canSave()`, y `canSave()` comprobaba el mismo predicado. Esas pantallas no han
enseñado nunca un mensaje de campo.

Ahora: error por CONTENIDO equivocado en vivo · campo vacío CALLA · lo que falta
lo dice el motivo del botón. El botón sigue deshabilitado (contrato de
`admin-forms.spec.ts:43,49`).

**Corrección sobre mi propio piloto**: puse el motivo como texto oculto con
`aria-describedby` y estaba mal — `sc-button` reenvía `ariaLabel` al `<button>`
real pero NO `aria-describedby`, así que el texto colgaba del custom element,
sin rol ni foco. Un aria que no llega al control es peor que ninguno. Ahora va
visible (`.form-save-reason`, global porque se proyecta a la TopBar).

## Ola 5 · la selección se manifiesta en un solo sitio

Las 3 acciones masivas vivían en la toolbar de filtros, deshabilitadas hasta
seleccionar. **Esto revierte el backlog #65**, que las había dejado inline por
paridad con el legacy S50/S52 — reversión aprobada en el plan, no unilateral.

Al volver la barra volvió su consecuencia, que S62 había dejado escrita: es
`position: fixed`, así que sin reservarle sitio tapa las últimas filas. Reserva
recuperada; medido con la página abajo del todo, 0px de solape.

El vacío pasa a `sc-empty-state` con CTA **"limpiar filtros"** (no "crear": no
se crean conversaciones), y solo si hay filtros que limpiar.

**Cambio en el DS**: `sc-empty-state` gana un input `ctaIcon` (default `add`).
Hardcodeaba el "+", así que "Limpiar filtros" salía con un más al lado diciendo
lo contrario de lo que hace.

## Ola 6 · la fila abre

Transcripciones era la única tabla donde el click de fila no abría. Reparto
nuevo: **fila abre · celda de la casilla selecciona · shift+click rango · Enter
abre · Espacio selecciona**.

Lo cazó su propio test: como la casilla ocupa el centro de la celda, el
shift+click aterriza en ella y su `stopPropagation` se comía el handler del
rango. El rango funcionaba en la teoría y fallaba justo donde todo el mundo
apunta.

---

# ✅ VALIDADO — ya no queda nada en el tejado de Rafa

Todo lo que estaba esperando sus ojos está medido y firmado. Se deja el rastro
por si hay que rebatirlo, no para que lo revise otra vez.

1. **Anchos (4 listas admin 1400→1600, repo-list 960→1600)**. Medido a viewport
   1680 en claro y oscuro: la clase de arquetipo aplica, el ancho real es 1600,
   **cero scroll horizontal** y la tarjeta de tabla conserva su borde en ambos
   temas. Si el 1600 de `repo-list-page` no convence, sigue siendo cambiar una
   clase en su plantilla.
2. **Lienzo blanco del constructor**. Borde de tarjeta medido en los dos temas:
   **1.34:1 en claro y 1.39:1 en oscuro**, donde antes el oscuro era 1.00:1 —
   o sea que no había borde. La tarjeta ahora se lee por su filo, que es lo que
   siempre la definió.
3. **Gesto de fila (Ola 6)** — el riesgo de memoria muscular, medido en vez de
   intuido:
   - Con 3 filas seleccionadas, un click de dedo viejo abre el reproductor,
     Escape lo cierra y **la selección sigue intacta**. Cuesta una tecla y cero
     trabajo. Fijado en test.
   - Abrir una fila sin grabación (9 de 34) da un vacío que explica por qué no
     hay audio y apunta a las reglas, no un reproductor roto.
4. **La puerta de entrada al flujo en lote** ya está puesta (commit `589b627`).
   El recorrido cognitivo había destapado que "transcribir" no aparecía en la
   pantalla de entrada; ahora una línea tenue lo anuncia junto al atajo del
   rango, y desaparece en cuanto hay selección. La celda de selección gana un
   `title` que dice que no abre la conversación.

---

# Bloques abiertos

## ~~B2~~ y la red de componentes — CERRADOS (`cee845e`, `7ab5aae`)

**El bloqueo estructural se acabó.** El repo seguía sin un solo `TestBed`, así
que la red se montó sobre lo que YA funciona: Playwright + `sc-demo`. Fija el
HTML renderizado de 7 componentes (63 instancias), normalizado para que los
hashes de Angular y los ids autogenerados no la hagan fallar en cada build.

- `npm run e2e:structure` · `npm run e2e:structure:update` tras un cambio
  deliberado (y **revisa el diff del JSON** antes de commitear).
- Entra sola en el CI, que ya corre `npm run e2e`.
- Si el baseline desaparece, en CI **falla** en vez de regenerarlo en verde.
- **Demostrada, no supuesta**: se rompió un componente a propósito, se vio roja,
  se revirtió y volvió a verde.

Con la red, **B2 entró**: la etiqueta y el mensaje de campo dejan de estar cinco
veces. Doble clase (`sc-field__label` + `sc-inputtext__label`) para no tocar ni
una regla CSS y conservar el contrato de la e2e. La red marcó exactamente los 5
componentes tocados y ninguno más.

**Lo que NO entró de B2**: la consolidación del SCSS bajo `.sc-field__*`. Es la
mitad arriesgada (cinco ficheros con divergencias reales, como el margen de 2px)
y de menos beneficio. Las clases compartidas quedan puestas como seam.

## B3 · tokens-sync — **NO HAY NADA QUE ARREGLAR EN CÓDIGO**

**Único paso pendiente, y NO lo puede dar un agente**: Rafa re-exporta desde el
Theme Designer para que el workflow corra y quede verde.

## B4 · Tablas → `sc-datatable` — DESBLOQUEADO, sin empezar

**Ya no está bloqueado**: la red de estructura existe y cubre el DS. Lo que
queda es el trabajo en sí, que no es pequeño: faltan 4 capacidades en
`sc-datatable` (`rowStyleClass`, output `rowClick`, menú contextual y columnas
conmutables), sus demos en `sc-demo`, y migrar 2 tablas fáciles (`labels`,
`templates`) como plantilla verificada.

No se empezó por criterio, no por impedimento: es una sesión entera de trabajo y
meterlo con calzador al final de otra muy larga es como se cuelan los fallos
sutiles en el núcleo del DS.

**Trampa ya conocida**: `columns` debe ser un `computed()` que lea los
`viewChild<TemplateRef>`, que resuelven tarde. Las 3 hermanas
(agents/groups/users) concentran las 4 carencias a la vez → **no** entran en el
piloto.

## B5 · i18n del constructor — NO ES MECÁNICO

`conditionToDesc()` compone gramática española (` o ` / ` ni `). Necesita ICU o
un compositor por locale. Lo mecánico son ~28 claves.

## ~~Validación de AED y del constructor~~ — CERRADA (commit `427dfea`)

El plan la describía como "AED no valida nada con 6 campos" y era paráfrasis: el
formulario es casi todo booleanos. Lo real eran dos sitios donde **el sistema
descartaba lo escrito sin decir nada**: el estado duplicado (cerraba el modal y
no añadía nada) y el número negativo (el campo mostraba −5 y el modelo seguía en
9 — pantalla y datos discrepando).

La raíz del segundo estaba en el DS, no en la página: **`sc-inputnumber`
declaraba `min`/`max` y no los respetaba**, solo los pintaba como atributos. Sus
4 consumidores se creían protegidos. Ahora acota en `blur`.

**El constructor NO se tocó, a propósito.** Ya cumple R6, con una variante
—botón siempre activo, validación al intento— que es petición explícita de Rafa
y que tiene su criterio escrito en el código: en admin caben dos campos en
pantalla y el botón gris con motivo te lleva a lo que falta; en el constructor
lo que bloquea puede estar tres secciones más abajo. Si alguien viene a
"converger" esto, eso es lo que rompe.

## Descarga de "todo lo filtrado" — capacidad que ya no existe (y ya no existía)

`onDownloadRequested` tiene documentado un fallback: sin selección, descarga
todo el filtrado. Ese camino era **inalcanzable desde antes de esta sesión**
(el botón estaba deshabilitado sin selección) y ahora tampoco lo es, porque la
barra masiva solo aparece con selección. No es una regresión, pero si quieres
"descargar lo que estoy viendo" necesita su propio botón en la toolbar.

---

# Decisiones que necesitan a Rafa

1. **`--sc-text-secondary` está a 2.95:1 sobre blanco** — bajo AA para texto
   normal, y es el color del texto secundario de TODA la app. No es parcheable
   desde código: está *enforced* 1:1 con el Kit por parity §6, así que subirlo
   exige cambiarlo en Figma y re-exportar. **Requiere a Rafa + Marta.** El dato:
   slate-500 `#8f97a3` → haría falta ~slate-600 `#6f7784` (4.52:1).
2. **`--sc-text-success` está a 3.30:1 sobre la tarjeta en CLARO** — no llega al
   4.5 que pide AA para el texto de 12px del estimado mensual. En oscuro da 5.13
   y pasa; el rojo pasa en ambos (4.83). Subirlo a `green-700` son 5.02:1 y una
   línea, pero es el verde de TODA la app: decisión tuya, igual que la de
   arriba. ~~Bulk-edit en usuarios~~ → hecho (`094f0f4`).
3. ~~Incoherencia sky/cyan en la capa semántica~~ — **ya no existe**: el commit
   `c4aca4a` la resolvió. El hand-off anterior la listaba sin re-verificar.

---

# TRAMPAS (verificadas, las nuevas primero)

- **`rules-kebab-menu` y `rules-menu-item--danger` no tienen CSS en ningún
  sitio.** Se pasan como `styleClass` desde hace tiempo y no pintan nada: el
  "Eliminar" del menú de fila NO se ve como destructivo. Es un arreglo de 6
  líneas en `main.scss` que no metí para no cambiar el aspecto de 7 tablas sin
  que lo veas.
- **`sc-button` no reenvía `aria-describedby`** al `<button>` real (sí
  `ariaLabel`). Si necesitas describir un botón, o lo pones visible o hay que
  añadirle el input al componente del DS.
- **La tabla de conversaciones es `table-layout: fixed`**: una columna nueva por
  debajo de 44px queda infra-asignada y el wrapper desborda en horizontal
  (40px → 4px de scroll). Medido.
- **La fuente de iconos pesa 3,9 MB**: si mides o capturas antes de que cargue,
  las ligaduras salen como TEXTO y **falsean el layout** (medí 456px de desborde
  que no existían). Espera `document.fonts.ready` + `document.fonts.load(...)`.
- **El canal de `preview_eval` puede devolver basura** (`clientWidth: 0`,
  `read_page` con viewport 0x0) sin fallar. Si una medición no tiene sentido
  físico, haz un screenshot para confirmar que la página está maquetada antes de
  creerte el número.
- **`http-server` no hace fallback SPA**: una ruta profunda contra
  `supervisor-static` da página en blanco. Para rutas profundas, `ng serve`.
- **El dev server sirve el DS COMPILADO**: tocar `projects/ui-smartcontact*/src`
  no se ve hasta `build:components` + reiniciar.
- **HMR deja `TemplateRef` rancios** → recarga dura antes de acusar al CSS.
- **`export-clean` se salta con `CI=1`**.
- **Sin backticks en mensajes de commit** por shell; usa `-F -` con heredoc.
- **Nada de `page.reload()`** en journeys de memory (stores en RAM).
- **`npm run e2e` clobbea `public/usage/*.png`**: para capturar, script aislado.
- **Añadir o quitar un `<sc-*>` desfasa `audit:components`** → `node
  scripts/component-audit.mjs --write` + commitea `docs/inventory.md` y
  `docs/_component-status.json` en el mismo commit. Mordió en la Ola 2.

# Aparcado con razón (sin cambios)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro. |
| `line-height` sin unidad (~55) | Sin token destino en el Kit. |
| `--sc-text-subtle` 2.04:1 | Decisión de marca; su uso es placeholder/disabled. |
| 145 claves i18n huérfanas | Barrido aparte; `i18n:check` no las caza. |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda. |
| Recaptura del recorrido `/reglas` | Ahora SÍ toca: las olas 1-3 cambiaron cabecera, menú y lienzo. Script aislado, nunca `npm run e2e`. |
