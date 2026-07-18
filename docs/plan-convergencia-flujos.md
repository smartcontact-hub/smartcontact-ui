# Plan — Convergencia de los 4 flujos (aprobado 2026-07-18)

> **Estado**: Fase 1 (fidelidad Figma + acento único) y Ola 0 **HECHAS** en la sesión 14.
> Siguiente en la cola: **Ola 1**. El delta y las correcciones vivas están en
> [`NEXT-SESSION.md`](../NEXT-SESSION.md) — **léelo antes que esto**, porque la Ola 3
> cambió respecto a lo escrito aquí abajo.
>
> Vivía fuera del repo (`~/.claude/plans/`); se trae aquí para que sobreviva a la sesión,
> quede versionado y lo pueda leer cualquiera.

## Contexto

Rafa señaló que la tarjeta de impacto del constructor de reglas no reproduce el Figma.
Tenía razón, y la causa es de método: implementé desde el **resumen escrito de la sesión
12** ("número héroe 40px, extrabold, color de acento") en lugar de volver al nodo. La
paráfrasis decía *número*; el nodo dice **frase**. Es la regla que ya está en
`LEARNINGS.md` (el hand-off es una pista, no la verdad) aplicada al revés.

De ahí salen tres encargos que se atacan juntos porque comparten raíz —consistencia:

1. **Fidelidad**: reparar la tarjeta contra el nodo medido, no contra su resumen.
2. **Acento único**: `--sc-bg-info` apunta a sky pero `--sc-text-info` a cyan. Rafa
   decidió ir a sky en toda la familia y documentarlo.
3. **Convergencia de los 4 flujos** (transcripciones · contact center · management ·
   reglas): el usuario debe poder predecir el comportamiento sin releer la interfaz.

Y siguen abiertos B2 (`sc-field-wrapper`), B4 (tablas → `sc-datatable`) y B5 (i18n).

> **Honestidad de alcance**: esto es trabajo de varias sesiones. Las fases están
> ordenadas por riesgo creciente y cada una es entregable y verificable por separado.
> No se empieza la siguiente sin cerrar los gates de la anterior.

---

## Hallazgos que reencuadran el encargo (verificados, no supuestos)

| # | Hallazgo | Consecuencia |
|---|---|---|
| **H1** | La e2e **ya fija** la dirección de dos convergencias: `sibling-pages.spec.ts:21-30,49-59` afirma que la fila ABRE; `admin-forms.spec.ts:43,49` que Guardar está deshabilitado si es inválido. | El modelo canónico no es libre: elegir otra cosa rompe 4 tests. Converge a favor. |
| **H2** | En los 3 formularios admin, `validate()` es **código muerto**. `save()` sale antes si `!canSave()`, y `validate()` comprueba el mismo predicado. Verificado en `user-form-page.component.ts:209-215` vs `:457-464` vs `:371-372`. | Los `[error]` de esas plantillas **nunca disparan**. No es divergencia de política: es un defecto. Esas pantallas no muestran ni un mensaje de campo. |
| **H3** | 12 páginas no tienen `<h1>`: el modelo "todo arriba" (S59) lo borró y la identidad la lleva un `<ol>` de breadcrumb. | Defecto de a11y transversal que ninguna divergencia nombraba. Va gratis en la fase de cabecera. |
| **H4** | `--sc-text-accent` (cyan-600) sobre blanco está **hoy a 3.46:1 — ya por debajo de AA**. Ir a sky-600 lo sube a **6.80:1**. | La unificación no es solo estética: repara accesibilidad. Pero cuidado: `--sc-bg-accent` a sky-500 hunde `--sc-text-on-accent` (slate-800) a 2.48:1 → hay que voltearlo a blanco. |
| **H5** | El export del Kit **no tiene concepto de `accent`** (0 coincidencias en 3.054 hojas). Las líneas viven fuera de toda zona `@sc-gen`. | El cambio de color **no pasa por Figma**, sobrevive a `tokens:import` y **ningún gate se pone rojo**. También significa que ningún gate lo vigila. |
| **H6** | `core/services/confirm-host.service.ts` (83 líneas) es copia casi verbatim de `sc-confirm.service.ts` del DS (80 líneas); el del DS además expone `icon`. Y `sc-confirmdialog.component.html` renderiza `<p-confirmdialog />`. | Se puede borrar la copia de la app y consumir el DS **sin romper la e2e**, que busca `.p-confirmdialog`. |
| **H7** | `sc-datatable` **no tiene** `rowStyleClass` ni un output `rowClick` (0 coincidencias en todo `ui-smartcontact/src`). Su `@for` usa `track col.field`. | El plan heredado de B4 acierta. Toda columna de acciones necesitará un `field` único. |

---

## Modelo canónico de interacción (la regla que se aplica en todo)

Siete frases que el usuario debería poder decir sin haber leído nada:

- **R1 · El click en una fila ABRE.** Siempre, en los 4 flujos. (Ley de Jakob: Gmail,
  Linear, Jira, GitHub. La casilla selecciona; la fila abre.) El nombre sigue siendo un
  `<a>` real dentro de la celda → teclado y cmd+click intactos (WCAG 2.1.1).
- **R2 · La acción primaria vive en el slot derecho de la TopBar.** 16 de 17 páginas ya
  lo hacen. **No se inventa un CTA** donde no hay acción primaria: en transcripciones no
  se crean conversaciones, y un slot vacío es información honesta.
- **R3 · Un solo motor de menú de fila**: `p-menu` compartido con `appendTo="body"`,
  abierto por un **kebab visible**; el click derecho abre *ese mismo* menú. Un menú que
  no anuncia su existencia no existe (Nielsen #6).
- **R4 · Fricción proporcional a la consecuencia**, no uniforme. Dos niveles:
  confirmación simple (`ConfirmHostService`) para lo acotado y rehacible; **puerta
  tecleada** (`sc-delete-entity-dialog`) para lo irreversible o de radio amplio. El
  contrato aprendido: *"si tengo que teclear el nombre, esto no se deshace"*.
- **R5 · La selección se manifiesta en un solo sitio**: la barra de acción masiva. Un
  control deshabilitado sin explicación es el antipatrón de Nielsen #1.
- **R6 · Una sola política de error**: validación en vivo, revelada **al tocar** (nunca
  sobre un campo prístino vacío), botón deshabilitado **con motivo** (`title` +
  `aria-describedby`). El modelo de referencia ya existe:
  `category-form-modal.component.ts:151-159`.
- **R7 · Dos arquetipos de página**, no uno:
  | Arquetipo | Fondo | max-width |
  |---|---|---|
  | Lista (la tabla *es* el contenido) | `--sc-bg-surface` | 1600 |
  | Editor (tarjetas de controles) | `--sc-bg-default` + tarjetas `--sc-bg-surface` | 1200 |
  | Hub de tarjetas | surface | 960 |

  Esto **no** es "poner todo igual": es figura/fondo. Una tarjeta sobre un lienzo de su
  mismo color deja de ser una tarjeta.

---

## Fase 1 · Fidelidad al Figma + acento único (bajo riesgo, alta visibilidad)

### 1a. Tarjeta de impacto — reparar contra el nodo `51:10310`

Desviaciones medidas (izquierda: Figma; derecha: lo que implementé):

| | Figma | Mío | Arreglo |
|---|---|---|---|
| **Héroe** | **un solo nodo** `1,842 calls`, 40px extrabold, todo en acento | número 32px sky + unidad 14px gris | **una frase entera** al mismo tamaño y color |
| Padding tarjeta | 32px | 24,5px | `--sc-spacing-2-25` |
| Gap entre bloques | 24px | 10,5px | `--sc-spacing-1-75` |
| Título | 16px bold | 14px semibold | `--sc-font-size-300` + bold |
| Intro | 14px, lh 1.5 | 12px | `--sc-font-size-200` |
| Filas métrica | 13px, valores **semibold**, gap 14px | 12px, sin jerarquía | subir a `-200`, valor semibold |
| 2ª métrica | teal `#0d9488` (positivo) | igual que la 1ª | `--sc-text-success` |

Tamaño del héroe: se queda en **32px** (`--sc-font-size-650`, techo de la rampa). El
Figma pide 40 y nuestra rampa salta de 32 a 48; crear un token display exigiría
re-exportar el Kit. Decisión de Rafa.

**Ficheros**: `features/memory/pages/rule-builder/rule-builder-page.component.{html,scss}`.

### 1b. Acento único: toda la familia a sky + documentarlo

Un solo fichero para lo esencial:
`projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css`

- `--sc-text-accent` · `--sc-text-link` (`:48-49`) → `sky-600`
- `--sc-text-info` (`:53`) → deja de aliasar accent; apunta a `sky-600` explícito
- `--sc-bg-accent{,-hover,-active}` (`:93-95`) → `sky-500/600/700`
- `--sc-border-accent{,-hover,-active}` (`:142-144`) → idem
- `--sc-icon-link` · `--sc-icon-accent` (`:172,174`) → sky
- **`--sc-text-on-accent` (`:56`) y `--sc-icon-on-accent` (`:183`) → blanco** ← obligatorio,
  si no el contraste cae a 2.48:1 (H4)
- `05-extensions.css:45` — `--sc-shadow-focus-ring-rgb` es cyan mientras
  `--sc-border-focus` es sky: **el halo y el borde del foco no casan hoy**. A sky.

**Documentación** (Rafa pidió explícitamente documentarlo): el auditor confirmó que
`accent = cyan` **nunca se documentó como divergencia consciente** — es un resto del
andamiaje inicial (`git blame`: la línea es del scaffolding, y el rename DD-23 que llevó
`info` a sky no revisó el alias). Añadir §1.4 a `docs/customs-catalog.md` y una entrada
en `docs/DECISIONS.md` registrando que accent se unifica con info bajo sky.

**Ojo al radio de blast**: `sc-demo/.../rules-walkthrough.component.scss` tiene **11
referencias** a accent — es tu material de presentación y cambiará de color entero.
Verificar a ojo.

**Deuda de a11y que va en el mismo lote**: `--sc-text-subtle` está a 2.04:1 (aparcado
desde s12). Con el auditor de contraste ya montado para esta fase, resolverlo aquí.

**Riesgo de pipeline: ninguno** (H5). Riesgo real: contraste y sc-demo.

---

## Fase 2 · Convergencia — olas de riesgo creciente

Cada ola cierra con: **`npm run verify` entero** (26 gates, nunca un subset) +
**`e2e:supervisor` 14/14** + **`ng build supervisor`** (AOT).

| Ola | Contenido | Riesgo | ¿Autónoma? |
|---|---|---|---|
| **0 · Código muerto** | Borrar `PageHeaderService` (8 refs, ninguna plantilla lo lee) · `<h1 class="visually-hidden">` en las 12 páginas sin él (H3) · borrar `confirm-host.service.ts` y consumir `ScConfirmService` del DS (H6) | 🟢 | ✅ Sí, nada visible cambia |
| **1 · Cabecera** | **D13 primero**: declarar breadcrumb en `reglas/nueva` y `reglas/:id` vía `BreadcrumbService.set()` (el label depende de crear-vs-editar). **Luego D2**: borrar `setLead`/`clearLead` del `TopBarSlotService` y pasar el rule-builder a breadcrumb como los demás editores. El chip de tipo se reubica en la tarjeta 01 (es estado, no navegación) | 🟡 | ⚠️ Mirar 2 rutas |
| **2 · Un solo menú** | Sustituir en las 6 listas admin el panel HTML propio **y** su menú contextual duplicado por el `p-menu` compartido · añadir kebab visible a la tabla de conversaciones (hoy solo tiene click derecho) · borrar `core/utils/viewport.ts` (queda sin consumidores) · **añadir un e2e de kebab admin** | 🟠 | ⚠️ 14 ficheros, semántica idéntica |
| **3 · Página canónica** | R7: fondos y `max-width` por arquetipo. Promover `.page__inner` a un `styles/_page.scss` con 3 variantes y podar el `max-width` de ~15 SCSS | 🟠 | 🚫 **Validación humana**, claro y oscuro |
| **4 · Validación** | R6 en los 3 form admin (sustituir el `validate()` muerto por un `computed` con la regla del prístino), en AED (**hoy no valida nada** con 6 campos) y en el builder. `title` en el Guardar deshabilitado | 🟡 | ⚠️ La e2e cubre el contrato |
| **5 · Selección** | Bulk bar en transcripciones ← los 3 iconos salen de la toolbar de filtros · empty state de conversaciones a `sc-empty-state` con CTA **"limpiar filtros"** (no "crear": no se crean conversaciones) | 🟡 | 🚫 Revierte backlog #65 |
| **6 · Click en fila** | R1 en transcripciones: la fila abre; la **celda** de la casilla toglea; shift+click = rango; Enter abre / Espacio selecciona. **Test e2e en el mismo paso** | 🔴 | 🚫 **La más peligrosa, sola** |

**El orden importa**: la ola 6 solo es soportable *después* de la 5. Cambiar el click de
fila antes de que exista la bulk bar deja al usuario de transcripciones sin el gesto de
selección **y** sin feedback de que la selección sigue existiendo.

### Conflictos ya identificados (con solución)

- **C1 · Si la fila abre, ¿cómo se selecciona?** Tres piezas, todas con precedente en el
  repo: la celda de la casilla toglea (`users-list-page.component.html:117-120` ya lo
  hace), shift+click hace rango, Espacio toglea la fila enfocada. Orden: **ola 5 antes
  que la 6, sin excepción**.
- **C2 · Quitar `setLead` sin breadcrumb deja la TopBar vacía** — hoy esas dos rutas
  producen un trail de cero crumbs. D13 va primero.
- **C3 · Trampa del rail AED**: `settings-shell.component.scss:20-25` documenta que S67-A
  movió el lienzo a blanco *porque el rail gris se fundía con un lienzo gris*. Volver el
  lienzo a `--sc-bg-default` **re-crea ese bug** salvo que el rail cambie de token en el
  mismo edit.
- **C4 · Mismo kebab, dos diálogos**: tras la ola 2, "Eliminar" abre puerta tecleada en
  admin y confirmación simple en reglas. Es deliberado (R4) pero debe ser *legible*:
  **"Eliminar…"** con puntos suspensivos cuando lleva a la puerta, **"Eliminar"** cuando
  no. Convención de menús de escritorio.

### Lo que NO se unifica (y por qué)

Uniformar no siempre es mejor. Se deja divergente, con motivo:

1. **El fondo, como valor único** — mataría las tarjetas del builder y de AED. Converge
   una *regla por arquetipo*, no un token.
2. **La confirmación destructiva, a un solo mecanismo** — poner puerta tecleada a borrar
   una categoría es fricción sin consecuencia; quitársela a borrar un usuario es peligro
   sin aviso. Confirmar todo igual entrena la ceguera de confirmación.
3. **El empty state de contact center** — sus hojas no listan nada; son matrices de
   permisos. Un vacío ahí no representa nada.
4. **El rail de 235px de AED** — es navegación local legítima. Converge el chrome de
   alrededor, no la existencia del rail.
5. **La puerta tecleada de la re-transcripción** — no es un borrado: cuesta dinero y
   sobrescribe. Su aviso de coste es contenido, no decoración.
6. **La ausencia de acción primaria en transcripciones** (R2).
7. **`<h1>` visible en AED** — la regla a11y es *"toda página tiene un h1"*, no *"todo h1
   es visible"*.

### Reencuadre de dos divergencias

- **Undo asimétrico en usuarios**: mal diagnosticado. `undo-stack.service.ts:31` dice que
  lo destructivo NO pasa por undo; agentes y grupos empujan undo por **bulk-edit**, y
  usuarios no lo tiene (ni `users.store.ts` tiene `bulkUpdate()`). No es asimetría de
  undo: **le falta una funcionalidad**. Es decisión de producto → se presenta, no se
  decide (LEARNINGS #15).
- **Paginación**: los seeds van de 6 a 84 filas. Valor hoy ≈ 0 y coste = migrar 16
  tablas. Se aparca documentado; lo que sí avanza es B4 abajo.

---

## Fase 3 · Bloques abiertos

### B2 · `sc-field-wrapper` — primero la red, luego el refactor

La duplicación está **verificada como genuina y verbatim** en 5 componentes (label
idéntico salvo el nombre BEM y el guard; mensaje idéntico salvo el nombre). Guards
reales: `inputtext`/`select`/`multiselect` → `!iftaLabel()`; `datepicker` → `!inline()`;
`inputnumber` → ninguno.

**El bloqueante es real y medido**: el repo no tiene ni un test de componente Angular (0
`TestBed`), y la suite visual del DS falla 39 de 54 en macOS *y además escribe baselines
`-darwin` que ensucian el repo*.

**Por eso B2 empieza por su red**, igual que s12 montó la e2e antes del refactor
transversal (LEARNINGS #16): un arnés de **diff de `outerHTML`** por componente contra
`sc-demo`, que es el gate que el propio diseño de s12 pedía. Con la red verde, el
refactor: `:host{display:contents}` · doble clase (`sc-field__label` +
`{{block}}__label`) · estilos bajo `.sc-field__*` · `--sc-field-label-mb` para la
divergencia de 2px · input `showLabel` · `sc-search` fuera.

**Contrato externo a preservar**: `e2e/supervisor/category-modal.spec.ts:52` usa
`.sc-inputtext__msg--error`.

### B4 · Extender `sc-datatable` + piloto en 2 tablas

Faltan 4 capacidades (H7): `rowStyleClass`, output `rowClick`, menú contextual y columnas
conmutables. Se añaden al DS con sus demos en `sc-demo`, y se migran **2 tablas fáciles**
(`labels`, `templates`) como plantilla verificada. Las 11 restantes quedan documentadas
con su receta.

**Plantilla de referencia** (consumidor real, no demo):
`projects/agent/src/app/components/call-table/call-table.component.ts` — 8 columnas, 3
`cellTemplate`, búsqueda global cableada al `scTableCaption`.

**Trampa**: `columns` debe ser un `computed()` que lea los `viewChild<TemplateRef>`, que
resuelven tarde; el demo llega a bloquear el render hasta que resuelven.

Las 3 hermanas (agents/groups/users) concentran las 4 carencias a la vez → **no** entran
en el piloto.

### B5 · i18n del constructor — ICU, no sustitución

`conditionToDesc()` en `condition.types.ts` **compone gramática española**: el enlace
`' o '` / `' ni '` es concordancia negativa sin equivalente 1:1 en fr/pt, más
`miembro de X`, `mayor que`, `entre X y Y`. Clave-a-clave rompe tres idiomas.

Dos partes: (a) lo mecánico y seguro, ~28 claves (`labelKey` + `t()` con
`LanguageService.lang()` como señal reactiva) para 7 labels + 7 nouns + 5 placeholders +
5 operadores + 2 direcciones + 2 unidades; (b) la prosa, con **ICU MessageFormat o un
compositor por locale**, que es diseño y va después.

---

## Verificación

**Por cada fase**, sin excepción:

1. `npm run verify` **entero** — 26 gates. Nunca un subset: los subsets se saltan
   `audit:components` y su desfase se acumula (LEARNINGS #7).
2. `npm run e2e:supervisor` — 14/14. Si un cambio rompe un selector, el test se actualiza
   **en el mismo commit**, conscientemente.
3. `npx ng build supervisor --configuration production` — el AOT caza errores de binding
   en plantillas que `tsc` y `verify` no ven.
4. **Confirmar el verde LEYENDO el log**, nunca por el exit-code de un background.

**Específico por fase**:

- **Fase 1**: medir contraste computado en el navegador (claro y oscuro) para cada par
  que cambie; capturas de la tarjeta de impacto y de `sc-demo /reglas` (los 11 refs de
  accent).
- **Olas 3 y 6**: **validación humana obligatoria** mirando pantalla, claro y oscuro. No
  se firman por gates.
- **Ola 6**: el test e2e nuevo (fila abre el player; casilla selecciona sin abrir) va en
  el mismo paso que el cambio.
- **B2**: el arnés de diff de `outerHTML` debe estar verde ANTES de tocar los 5
  componentes.

**Gates operativos que muerden**:

- Añadir o quitar un `<sc-*>` en supervisor desfasa `audit:components` → correr
  `node scripts/component-audit.mjs --write` y commitear `docs/inventory.md` +
  `docs/_component-status.json` en el mismo commit.
- Claves i18n nuevas → los **4** locales o `i18n:check` cae.
- Un `.md` nuevo → registrarlo en `docs/DOCS-INDEX.md` en el mismo commit.
- Tocar `projects/ui-smartcontact*/src` → `build:components` **y reiniciar** el dev
  server antes de medir; el servidor sirve el DS compilado.
- Ante una medición rara en la TopBar → **recarga dura** antes de acusar al CSS: el HMR
  deja `TemplateRef` rancios con el `_ngcontent` del componente viejo.
- Nunca `npm run e2e` para capturar pantallas: usar un script aislado fuera del repo.

## Fuera de alcance (aparcado con motivo)

- **Paginación de las 16 tablas** — valor hoy ≈ 0 (6-84 filas), coste alto.
- **La prosa i18n del constructor** (B5b) — necesita diseño ICU.
- **Bulk-edit en usuarios** — decisión de producto, se presenta.
- **Re-exportar el Kit** para un token display de 40px — solo Rafa puede, y se juntaría
  con el re-export que ya debe B3.
