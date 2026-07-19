# Smart Contact UI — Customs Catalog

> Catálogo único de **brand divergences** entre el Design System y la referencia Figma
> `Smart Contact Prime` (PrimeOne UI Kit duplicado para SC).
> Cada entry documenta UN punto donde SC se aparta del Figma de forma **intencionada** —
> con razón y mapping concreto en código.
>
> No es un changelog. No es un audit (eso vive en cada spec doc). Es la lista de
> "decisiones de marca" SC que un consumer (otra app, un contributor nuevo, alguien
> de diseño comparando con Figma) necesita conocer en un solo sitio.
>
> Estándar de calidad: cada token trazable al export del Kit
> (`projects/design-tokens/scripts/kit-export-dtcg.json`, formato DTCG), verificado
> en CI (`npm run verify`).
>
> **Nomenclatura (DD-23, 2026-06-19):** las familias primitivas de color se llaman como en el
> Kit/Figma — `cyan` (antes "soft-blue"), `sky` (antes "electric-blue"), `slate` (antes "gray").
> Donde abajo se lea "electric-blue" / "gray" / "soft-blue" como rol o valor de marca, la familia
> y el token son `sky` / `slate` / `cyan` (`--sc-color-{sky,slate,cyan}-*`).

---

## Categorías de divergencias

1. **Brand colors** — semánticas reasignadas a paleta SC (más oscuro / más vibrante / familia distinta).
2. **Component extensions** — slots / variants / behaviors que SC añade y Figma no modela.
3. **Component overloads** — slots Figma reusados con semántica SC distinta.
4. **Sizes / density** — SC añade variantes que Figma no contempla (sm/lg en algunos componentes).
5. **Gaps conocidos** — piezas del Kit Figma que aún no tienen wrapper en el DS (decisión consciente).

---

## Checklist anti-divergencia

Antes de añadir cualquier prop / slot / CSS override a un componente del DS, responder estas 4 preguntas en orden:

1. **¿PrimeNG ya lo expone?** Si sí → exponerlo con el mismo nombre de input, mismo evento, mismos templates (`pTemplate` content projection). NO inventar API custom.
2. **¿Hay un token PrimeNG que lo cubra?** Si sí → consumirlo vía el preset modular (`projects/ui-smartcontact/src/lib/theme/sc-preset/`), NO inventar variable nueva.
3. **¿La divergencia es brand-required?** Si sí → entry obligatoria en este catálogo con razón concreta + mapping en código. Si no → no añadir.
4. **¿Al portarlo a otra app bastaría con "import + linkar CSS"?** Si no → revisar.

Sobre Figma SC: pedir el link del componente ANTES de tocar nada. Replicar 1:1 los componentProperties (variants), auto-layout, paddings (incluso decimales), tokens (boundVariables).

---

## 1. Brand colors

### 1.1 Primary navy (todo el sistema)

| Componente | Figma | SC | Mapping en código |
|------------|-------|-----|-------------------|
| Button `severity=primary` | `#3b82f6` (azure-500) | `#344a70` (navy-500) | `semantic.primary.color = var(--sc-bg-primary)` (preset `base.ts`) |
| Tabs `active` | azure | navy | `tabs.ts` hereda `primary.color` |
| Select / Datepicker / Input / MultiSelect `focus border` | azure | navy | `formField.focusBorderColor = var(--sc-bg-primary)` |
| Checkbox `checked` (bg + border) | azure | navy | `sc-checkbox.scss` checked state `--sc-bg-primary` |
| Modal `header icon` | slate-700 | (puede ser primary tinted) | — |

**Razón**: brand identity SC = navy oscuro, distinto del Aura primary default. Marca corporate consistente en CTAs principales.

**Trade-off**: el focus ring usa `--sc-color-sky-500` (azure vibrante) para que el contraste de accesibilidad no sufra el navy oscuro, con **`--sc-focus-ring-width` = 2px**. **RECONCILIADO al Kit (2026-06-14)**: el Kit (Figma) ahora define el focus ring en electric-blue (`focus/ring/color` → `{sky.500}`) + width 2 → ya **no es divergencia**, es lo que dice la fuente de verdad (antes: navy + width 1). Round-trip: variable cambiada en Figma por MCP → re-export → código.

---

### 1.2 Info → sky de marca (rol: Electric Blue)

> El Kit y el código nombran esta familia `sky` (`--sc-color-sky-*`, `#1464fe` — azul de marca
> vibrante). NO es el Tailwind sky (`#0ea5e9`) que el PrimeOne/Aura vanilla trae por defecto.

| Componente | Aura vanilla | SC (`sky` de marca) | Mapping |
|------------|-------|-----|---------|
| Button `severity=info` | sky-500 (`#0ea5e9`) | `--sc-color-sky-500` (`#1464fe`) | preset `base.ts` (familia `sky` = marca) |
| Toast `severity=info` icon-bg | Tailwind sky | `sky` de marca | `--sc-toast-info-icon-bg = var(--sc-color-sky-500)` |
| Message / Notification info chrome | sky | `sky` de marca | (idem, vía familia `sky`) |

**Razón**: el sky default de Aura es demasiado suave para el tratamiento de info de la app. Electric-blue da el peso visual que la marca SC necesita para notificaciones sistémicas (Toast info, Message info, Banner info).

---

### 1.3 Warn → amber (no orange)

| Componente | Figma | SC | Mapping |
|------------|-------|-----|---------|
| Button `severity=warn` | orange-500 (`#f97316`) | amber-500 (`#f59e0b`) | `primitive.orange → amber` (preset `base.ts`) |
| Toast `severity=warn` | (mapeado a primitive orange) | amber | `--sc-toast-warn-* = var(--sc-color-amber-*)` |
| Message / Notification warn chrome | orange | amber | (idem) |

**Razón**: el amber es coherente con el warn semantic establecido en Message + Toast desde antes del audit. El orange de Aura quedaría demasiado naranja-saturado para el resto del UI SC. Se mantiene amber.

**Nota**: `--sc-color-orange-*` sigue existiendo como primitive — es la paleta del label palette (`--sc-label-orange-*`). NO se toca; los labels siguen usando orange real. El override solo afecta el slot `primitive.orange` que el button de PrimeNG consume para warn.

---

### 1.4 Accent → sky (unificado con info) · 2026-07-18

> **Esto NO es una divergencia nueva: es la RETIRADA de una que nunca se decidió.**

`--sc-text-accent` apuntaba a `cyan-600` desde el andamiaje inicial del DS. No estaba
registrado en este catálogo, no hay ninguna decisión en `DECISIONS.md` que lo justifique,
y el rename **DD-23** (que llevó `info` a la familia `sky` de marca) no revisó el alias.
Resultado: el DS tenía **dos acentos conviviendo**.

| Token | Antes | Ahora | Por qué |
|---|---|---|---|
| `--sc-text-accent` · `--sc-text-link` | `cyan-600` | `sky-600` | Contraste sobre blanco: **3.46:1 → 6.80:1**. El valor anterior estaba **bajo AA** para texto normal. |
| `--sc-text-info` | alias de accent (→ cyan) | alias de accent (→ **sky**) | Antes `--sc-bg-info` era sky y `--sc-text-info` cyan: fondo de una familia con texto de otra. |
| `--sc-bg-accent{,-hover,-active}` | `cyan-500/600/700` | `sky-500/600/700` | Una sola familia de acento. |
| `--sc-border-accent{,-hover,-active}` | `cyan-500/600/700` | `sky-500/600/700` | idem. |
| `--sc-icon-link` · `--sc-icon-accent` | `cyan-600` | `sky-600` | idem (`--sc-icon-info` ya aliasaba a accent). |
| **`--sc-text-on-accent` · `--sc-icon-on-accent`** | `slate-800` / `cyan-800` | **`slate-0` (blanco)** | **Obligatorio**: slate-800 daba 5.89:1 sobre cyan-500, pero sobre sky-500 cae a **2.48:1**. Blanco da 4.90:1. |
| `--sc-shadow-focus-ring-rgb` (`05-extensions.css`) | `cyan-500` | `sky-500` | El **halo** del foco era cyan mientras su **borde** (`--sc-border-focus`) ya era sky: el anillo se veía turquesa alrededor de un borde azul. |

**Barrido asociado**: 38 declaraciones `outline: 2px solid var(--sc-color-cyan-500)` en 31
ficheros (DS + app) hardcodeaban la primitiva para su anillo de foco en vez de consumir
`--sc-border-focus`, que existe exactamente para eso. Verificado que las **38 estaban
dentro de un `:focus-visible`** (cero falsos positivos) antes de migrarlas.

**Sin round-trip con Figma**: el export del Kit **no tiene concepto de `accent`** (0
coincidencias en 3.054 hojas de `kit-export-dtcg.json`); `info` solo existe a nivel de
componente y ya resuelve a `{sky.500}`. Estas líneas viven fuera de toda zona `@sc-gen`,
así que el cambio sobrevive a `npm run tokens:import` y ningún gate lo marca como drift.

**Consecuencia que conviene saber**: por eso mismo, **ningún gate vigila estos tokens**.
`token-parity` §6 solo cruza lo que está en `scripts/color-map.mjs`, y accent no está.

---

### 1.5 Texto secundario → slate-600 (AA) · 2026-07-19

> **Es el mismo movimiento que §1.4, aplicado al token que se le pasó.**

`--sc-text-secondary` valía `slate-500`: **2.95:1 sobre blanco**. Eso no es solo estar
bajo el 4.5 de AA para texto normal — es que **ni siquiera llega al 3:1 de texto grande**,
así que fallaba en sus **178 usos** del supervisor, sin excepción. Es el color del texto
secundario de toda la app: descripciones, etiquetas de campo, cabeceras de tabla.

| Token | Antes | Ahora | Contraste sobre blanco |
|---|---|---|---|
| `--sc-text-secondary` (claro) | `slate-500` | **`slate-600`** | 2.95:1 → **4.52:1** |
| `--sc-text-secondary` (oscuro) | `slate-300` | `slate-300` (sin cambio) | 10.47:1, ya cumplía |

**Por qué diverge del Kit y con qué permiso.** El Kit dice `text.muted.color = {surface.500}`
y `color-map.mjs` lo tenía como `enforce`, o sea 1:1 obligatorio. Su fila pasa a
`kind: 'diverge'` — que es el mecanismo que el propio fichero documenta para esto:
*«para divergir un color a propósito: mover su fila enforce a aquí»*. Ya lo usan otras
siete filas por motivos bastante más leves («un punto más tenue»).

**Esto no es criterio nuevo.** §1.4 subió accent de `cyan-600` a `sky-600` por
exactamente el mismo motivo (3.46:1, bajo AA). Aquí solo se aplica esa misma decisión al
token al que no se le aplicó.

**Límite conocido, y por qué no se va más lejos.** Sobre `--sc-bg-default` (el lienzo
gris) slate-600 da **4.25:1**, aún 0,25 corto. `slate-700` lo arreglaría (6.95:1) pero
queda a un paso de `--sc-text-primary`, y entonces «secundario» deja de significar nada:
se cambiaría un fallo de contraste por uno de jerarquía. La mayor parte del texto
secundario vive dentro de tarjetas (`bg-surface`, blanco), donde sí cumple.

**A diferencia de §1.4, este SÍ está vigilado**: el par sube de `A11Y_INFO` a
`A11Y_GATED` en `token-parity`. Llevaba meses informándose en 2.95:1 sin que nadie
actuara, que es exactamente lo que pasa cuando un defecto solo se avisa.

**Cómo se cierra la divergencia**: que Marta suba `text.muted` en el Kit a un valor que
cumpla AA y se re-exporte. Entonces esta fila vuelve a `enforce` y esta entrada se borra.

---

## 2. Component extensions (el DS añade lo que Figma no modela)

### 2.1 Toast action button (undo pattern)

- **Figma**: el toast tiene icon + summary + detail + close. NO hay slot para botón de acción.
- **SC**: slot opcional vía `data.undoEntryId` en `MessageService.add()`. Si presente, el template renderiza un botón "Deshacer" entre el body y el close X.
- **Visual**: botón outlined neutral por defecto (`sc-toast__action`), o solid primary con `data-action="solid"` o `.sc-toast__action--solid` para acciones high-stakes.
- **Implementación**: template del `<p-toast>` en la app consumidora + estilos en el partial `_sc-toast.scss` del DS (`&__action`, `&__action--solid`).
- **Para qué**: undo pattern post-acción destructiva ("Agente eliminado · Deshacer"). UX crítica SC.

**Decisión consciente: botón texto, NO countdown circular** (evaluado y descartado). El patrón countdown circular (Notion / Linear / Twitter) genera urgencia visual innecesaria en herramientas enterprise + falla en accesibilidad (28×28px < 44×44 WCAG 2.1 AA touch target, el screen-reader solo oye un aria-label sin tiempo) + falacia común "urgencia visual = menos errores" (en realidad induce click-en-pánico). La urgencia debe ser **proporcional al riesgo**: acciones de bajo riesgo (toast undo) usan texto sin presión visual; acciones destructivas reales (eliminar agente, re-transcribir, restaurar fábrica) usan modal con confirmación type-CONFIRMAR — NO toast.

Para el caso futuro de backend real: el grace period del undo vive **server-side** (soft commit con timestamp + reversal en N segundos), no en la UI. La urgencia visual NO afecta data integrity — eso lo cubren mecanismos de locking optimista (ETags, version numbers) cuando exista DB.

### 2.2 Toast icon-square chrome

- **Figma**: el icono va "pelado" (svg sin background).
- **SC**: el icono va dentro de un cuadrado coloreado (severity-icon-bg). Glifo blanco sobre fill colored.
- **Implementación**: bloque `.sc-toast__icon` en el partial — `width/height` = `--sc-toast-icon-size`, `background` por severity vía descendant selectors.
- **Para qué**: peso visual + glifo invertido (white-on-color) lee más limpio que glifo severity-color sobre background semi-transparente.

### 2.3 Checkbox indeterminate state ('some')

- **Figma**: el checkbox modela Selected=True/False (binary). NO hay variant para indeterminate.
- **SC**: tercer state `'some'` para el patrón "select all" del header de tabla con selección parcial.
- **Visual**: mismo bg/border que `'all'` (checked, navy primary) + barra horizontal blanca en lugar del ✓.
- **Implementación**: `checkbox.scss` `.tri-checkbox__input:indeterminate + .tri-checkbox__box`. El width de la barra escala con size (8 / 10 / 12 px de diseño).
- **Para qué**: bulk-select de tablas (header row marca todo / nada / mixto según children).

### 2.4 Modal body slot stacking

- **Figma**: el body es un free slot sin layout opinionado.
- **SC**: el body es `display: flex; flex-direction: column; gap: var(--sc-spacing-1-125)` por defecto. Los hijos directos quedan apilados con gap 16px (de diseño) automático.
- **Implementación**: `sc-modal.scss` `.sc-modal__body`.
- **Para qué**: el caso 95% de uso del modal es forms verticales (2-5 inputs). Sin gap por defecto, cada consumer reinventaba un wrapper. Ahora `<sc-inputtext>`, `<sc-select>` etc. proyectados directamente quedan separados.

### 2.5 Modal `[bodyless]` mode

- **Figma**: el body siempre existe.
- **SC**: prop `[bodyless]="true"` colapsa el modal a header + footer pegados (sin body band visual). Para confirm dialogs donde la descripción cabe en subtitle.
- **Implementación**: template de `<sc-dialog>` + scss `.sc-modal--bodyless`.
- **Para qué**: confirm dialogs (delete, discard, leave page) son el 60% de los usos de modal.

### 2.6 `<sc-icon>` — único proveedor de iconos (Material Symbols)

- **Figma**: el Kit Pro pinta iconos con PrimeIcons / la librería `Smart-Contact-Icons` (10.610 glifos a SCALE). No modela un "componente icono" con API.
- **SC**: `<sc-icon>` (paquete `@smartcontact-hub/icons`) es la **única** API de icono del DS. Renderiza un glifo de la variable font **Material Symbols Outlined** por ligadura de texto (`{{ name() }}`), no SVG. Migración Lucide→Material cerrada (DD-9): ya **no queda `lucide-angular`** en el código.
  - **API**: `name` (string snake_case Material, p.ej. `delete`, `progress_activity`, requerido) · `size` (number px de diseño, default `--sc-icon-size`; alimenta el eje `opsz`) · `fill` (bool, eje FILL 0→1) · `weight` (number, eje wght 100→700) · `spin` (bool — gira el glifo en bucle para spinners; keyframe + `prefers-reduced-motion` encapsulados en el componente).
  - **Spinner**: el patrón `Loader2` de Lucide se reemplaza por `<sc-icon name="progress_activity" [spin]="true">`. Sin dependencia de animación en el consumer.
  - **Ejes variables**: `font-variation-settings` computado expone `FILL / wght / GRAD / opsz`. Font cargada en el `index.html` de cada app consumidora (rango `opsz 20..48, wght 100..700, FILL 0..1, GRAD -50..200`, `display=block`).
  - **Escala de tamaño**: el `size` numérico consume la escala TS `SC_ICON_SIZE_*` (mirror de `--sc-icon-size-*`). Nota DD-13: `--sc-icon-size-*` está hoy en el *stream de tipo* (redondo, rem), ver §4.2.
- **Excepción — iconos de marca**: glifos sin equivalente Material (p.ej. **GitHub**) se resuelven con un `<svg>` inline `fill="currentColor"` en el consumer, NO con `<sc-icon>`.
- **Para qué**: un solo proveedor de iconos (Material) = un solo eje de escala, theming por `color`/variación, y cero dependencias SVG en bundle. Alineado con la librería `Smart-Contact-Icons` del Kit Pro (mismo set Material).
- **Escalas Material (gotcha)**: Material Outlined se ve ~1.6× más grande que PrimeIcons al mismo px ("a sangre"); al portar tamaños viejos, bajar a ~60-65% del px. En Figma, un glifo Material que "se esquina" = ponerlo a SCALE.

### 2.7 Variante `[flush]` — lenguaje visual low-chrome (flush)

- **Contexto**: dirección visual definida por diseño (low-chrome / flush, validada en Figma `12277-4185`): **bajo chrome** — el dato es el héroe, la jerarquía la lleva el espacio + la tipografía, no las cajas. Las superficies van **a sangre** (flush) sobre la página en vez de en cards con borde/sombra.
- **SC**: input opt-in `[flush]` (default `false`) en:
  - **`<sc-section-card>`**: quita fondo/borde/sombra/radio de la card + el padding lateral del header/body → el contenido alinea con la página. La cabecera (título + hint) se mantiene.
  - **`<sc-form-section-nav>`**: el índice del rail se renderiza como **PANEL embebido** 1:1 con el Figma `12277:4818` (fondo, radio 6, padding 16, gap; chip 32; item activo gris-100; label semibold/regular). **Modelo de color (confirmado por variables del nodo): página BLANCA (`content/background`=#fff) + paneles del rail (índice, ficha) en gray-50 (#f9fafb)**, recogidos sobre la página blanca. Por eso los form-pages pasan `.page`/`:host` a `--sc-bg-surface` (blanco) y el índice/ficha a `--sc-bg-secondary-subtle` (gray-50). (El input `compact` —placeholder no-op— se **eliminó**: 0 consumidores tras estandarizar; `flush` es el único modo de chrome.)
- **Tokens**: el diseño se hizo en **rejilla de 8** (8/12/16/24/48) pero **NO se crea escala nueva** — se snapea a la escala base-14 del Kit Pro (16px de diseño exacto = `--sc-spacing-1-143`; 8→7, 12→12,25, 24→24,5; diferencias ≤1px imperceptibles). Único literal: altura de fila 48px (dimensión de componente, no token de spacing). **NO forkear a un 8-grid paralelo** (rompería el 1:1 con el Kit Pro · `migration-safety.md`); la nomenclatura 8-point (`--sc-space-*`, `--sc-spacing-100`…) está además **prohibida por `tokens:guard`**.
- **Chips de canal** (tabla de asignación de grupos): on-state = pill claro neutro (`bg-secondary-subtle` + borde sólido + texto primario + ✓); off-state = dashed transparente + muted + ＋. El "activo" se lee por relleno sólido vs dashed, no por color fuerte.
- **Estado de adopción** (histórico, reconciliado):
  - **`<sc-form-section-nav> [flush]`** → **EN USO en los 3 forms** (agents/groups/users). El índice perdió su panel al introducir flush (regresión); **corregido 1:1** con el nodo (panel, chip 32, activo gris-100, label semibold). Decisión de diseño: **editar-agente `12277:4185` es la referencia común** → grupos/usuarios se **estandarizan a ella** (no esperan Figma propio). `compact` eliminado (no-op sin consumers).
  - **`<sc-section-card> [flush]`** → **0 consumidores (reservado)**. La sección que lo motivó (Grupos asignados) acabó siendo panel propio `<sc-group-assignment-table>` (imita el p-card del Figma, sin section-card), así que el flush de section-card quedó sin adoptar. Identity/Permisos/Avanzado siguen carded en los 3 forms (consistente). **Trigger de adopción**: que la referencia muestre esas secciones en flush. Mantenido por ser camino documentado de una dirección activa, NO borrado (evita churn re-add).
- **⚠️ Verificación obligatoria al aplicar una variante de bajo-chrome (lección aprendida)**: antes de cerrar un `[flush]`/low-chrome, **confirmar dato↔dato** contra el nodo Figma con `get_metadata` + `get_design_context` (autolayout, medidas, **fills y variables**, no solo el layout). Quitar un fondo/borde/sombra lee como "1:1" desde la estructura pero puede ser una **regresión visual silenciosa**: el índice perdió su panel `gray-50` porque el flush se interpretó como "a sangre" sin contrastar el fill real del nodo (`get_design_context` lo da: `bg-[var(--gray/50)]`, radio 6, padding 16). **Acceder al file elemento a elemento es exacto; comparar capturas a ojo NO** — la captura solo sirve como smoke de "renderiza".

### 2.8 DataTable — celdas SC por composición, sin tocar mains

- **Contexto**: la tabla de Agentes (y futuras tablas) necesita columnas que el Kit Pro **no modela** en su celda. Estudio cruzado código PrimeNG (`primeng.org/table`) ↔ Figma SC: el Kit Pro `datatable` (`374:16034`) es un **componente monolítico** (4 booleanos: Show Header/Footer/Header-Cells/Footer-Cells, sin eje de variante). El contenido de celda vive en `datatable-content` (set **`4295:53254`**), eje `Type` = `Text · Checkbox · Tag · Rating · Image · Row Toggle Button · RadioButton`. La página `❖ DataTable` tiene 9 ejemplos (Basic, Small, Large, Grid Lines, Striped Rows, Sort, Column Group, Selection, Row Expansion) — **NO hay el ejemplo Customers/Filter** (avatar+nombre+flag) ni ningún "avatar-cell" en Parts.

- **Mapping columnas Agentes** (reuso vs composición SC):

  | Columna | Solución | Origen |
  |---|---|---|
  | Checkbox | `Type=Checkbox` | reuso Kit Pro |
  | Extensión "122 · WEBRTC" | `Type=Text` (override texto, bicolor) | reuso Kit Pro |
  | Tipo (chip) | `Type=Tag` · `Show Icon=false` · `Severity=Secondary` | reuso Kit Pro |
  | Estado (Disponible/Baño/No disponible) | `Type=Tag` · `Severity=Success/Warn/Danger` | reuso Kit Pro |
  | Acciones (⋮) / ver-transcripción | swap contenido → `button` Icon Only (set `12381:22723`), icono por `Left Icon` | reuso Kit Pro |
  | **Nombre (avatar+nombre)** | **composición SC** `sc/agente-nombre` = `avatar` (set `12422:26385`) + texto | composición |
  | **Canales (phone/chat/mail)** | **composición SC** `sc/agente-canales` = iconos `phone/chat/mail` | composición |

- **Decisión de diseño — Estado = tag de color**: se descarta el dot+texto del prototipo legacy; el `Severity` del Tag del Kit Pro (Success/Warn/Danger) cubre el estado sin componente nuevo.

- **Las 2 composiciones SC** (`sc/agente-nombre`, `sc/agente-canales`) viven en la página **`Flujos`** (NO en `❖ DataTable`), **instancian** primitivos del Kit Pro (no los forkean), y se meten en la celda vía **instance-swap** del `datatable-content`. La celda sigue siendo `datatable-body-cell` real (enlazada) — no hay nodos *detached*.

- **Unidad reusable = la FILA** (`fila-agente`, componente SC = 7 `datatable-body-cell` reales + las 2 composiciones + el `button` kebab). **NO se componetiza la tabla entera** (los datos son dinámicos = bucle en código). El `datatable` del Kit Pro queda **intacto**.

- **Mirror en código — 0 componentes, 0 tokens**: cada `<td>` inline-compone primitivos PrimeNG (`<p-avatar>` + `<span>`, `<i class="pi pi-*">`, `<p-tag [severity]>`, `<p-button icon>`). PrimeNG no tiene "cell component" — el `<td>` admite cualquier cosa. Las composiciones SC de Figma son **helpers de autoría sin counterpart de código** (existen solo para no recomponer en cada fila al maquetar en Figma).

- **Tokens nuevos: 0.** El chrome usa el namespace `datatable/*` del Kit Pro (ya mapeado a `--sc-*`); las composiciones reusan los tokens de los primitivos. La collection Variables **`Custom` (`9193:39727`) sigue con política "NO bootstrap hasta ≥5 entries"** (la tipografía DD-13 la estrenó después con sus primitivos).

- **Mains `❖` tocados: 0.** Regla de oro migration-safe: nunca editar páginas `❖` ni variables del Kit Pro, nunca crear token; solo **instanciar + componer en `Flujos`**. Una migración de PrimeNG/Kit Pro no puede romper lo que solo *instancia* primitivos (el cambio fluye por la instancia hacia abajo).

- **Theming dark — toda adición SC debe VINCULAR fills a variables del Kit Pro, NO hardcodear** (gotcha que cerró el bug "Dark textos invisibles"): el dark de Figma cambia por **modo de variable** (collections `Component Color Scheme` `7225:3443` + `Semantic Color Scheme` `9112:23777` → modo Dark sobre el frame). Lo que tenga fill hardcoded (texto negro, fondos blancos) NO cambia → invisible en dark. Bindings correctos: texto del nombre → `datatable/row/color` (`9713:69676`), fondo de la fila/componente → `datatable/row/background` (`9713:69675`), fondo de cabecera → `datatable/header/cell/background` (`9713:69660`), iconos de canal (Vector) → `datatable/row/color`. En el datatable real el fondo vive en la **fila** (`datatable-row`), no en las celdas (transparentes). Así la fila SC tematiza light/dark igual que el Kit Pro. (En código, el dark se activa por el selector **`.sc-dark`**, default de `provideSmartContactUi`.)

- **Estado**: prototipo Figma montado en `Flujos` (`fila-agente` + tabla 12 filas, light+dark OK). Pendiente: llevar el `<td>` template al código de la app (`<p-table>` de la pantalla Agentes).

### 2.9 IftaLabel — label dentro del campo en sc-select / sc-inputtext / sc-multiselect

- **Figma**: `❖ IftaLabel` (node `7462:106725`) — *In-Field Top Aligned*: el label se fija arriba-dentro del campo y el valor baja. El Kit lo usa en los selects/inputs de config Grupos. Distinto de `❖ FloatLabel` (`7421:322901`, el label flota al focus).
- **SC**: input opt-in **`[iftaLabel]`** en `<sc-select>`, `<sc-inputtext>` y `<sc-multiselect>`. Cuando está activo, el label-encima se oculta y se renderiza dentro del `.sc-*__field` (relative), con el valor empujado hacia abajo.
- **Tokens** (del export; decimales = px de diseño exactos): `iftalabel/input/padding/top 21` · `/bottom 7` · label `iftalabel/font/size 10.5` · `/weight 400` · color `iftalabel/color #8f97a3` (`--sc-text-subtle`) en `(x 10.5, top 7)`.
- **Opt-in**: `default false`; los campos con label-encima del resto de la app no cambian. **Sin tokens nuevos.** En uso: selects/inputs de config Grupos + "Tipo de descuelgue" de General.
- **Pendiente**: extender a `<sc-inputnumber>` cuando un diseño lo pida.
- **`<sc-multiselect>` options primitivas**: el wrapper soporta `options: string[]` directos (`hasPrimitiveOptions` + `resolvedOptionLabel/Value`, portado de `<sc-select>`) — arregló los multiselect de Grupos que renderizaban vacíos.

### 2.10 Divider — `<sc-divider>` (wrapper de `<p-divider>`; reuso 1:1 del Kit Pro)

- **Estado**: `<sc-divider>` (wrapper fino de `<p-divider>`). Antes era `<hr class="divider">` in-page. **NO es divergencia de marca** — es reuso 1:1 del `❖ divider` del Kit Pro (Kit node `302:11810`, ejes `Type`/`Content`/`Align`/`Direction`).
- **Por qué wrapper de PrimeNG** (minimal customization, DD-5): `<p-divider>` ya aporta todas las variantes del Kit (layout horizontal/vertical · type solid/dashed/dotted · align · proyección de contenido). No reinventamos HTML; solo cableamos los tokens vía el preset (`divider.ts`): margin 14 / content-padding 7 (escala 14-base; Aura usa 16/8 → divergencia consciente), borde gray-200, content `--sc-text-secondary` sobre `--sc-bg-surface`. Light+dark salen solos por los semánticos. Los 10 valores de sizing los vigila `tokens:parity` (1:1 con el export).
- **Consumer actual**: pantallas de config Contact Center, todas **horizontal-solid sin contenido**. vertical/dashed/contenido quedan disponibles 1:1 para cuando un diseño los pida (sin código extra: ya los da `<p-divider>`).
- **Spacing 1:1**: el divider aporta su propio margin 14/14 (token Kit). El `.settings-card__body` baja su `gap` a 8.75 (`--sc-spacing-0-625`) **solo cuando contiene un divider** (`:has(> sc-divider)`), para que la separación total quede 1:1 con el Figma de referencia. Las cards sin divider conservan el gap de 16.
- **Color**: borde `--sc-border-default` (gray-200, `#dadfe6`), 1:1 con `divider/border/color` del Kit.

### 2.11 Estados de agente — 3 tags fijos + chips editables

- **Contexto**: la celda/ficha de estado de agente en config Contact Center distingue **estados sistémicos fijos** (no editables) de **estados editables** que el usuario añade/quita.
- **3 tags fijos** (`<p-tag>` del Kit Pro, no removibles):
  - **Disponible** → `severity="success"` (verde).
  - **No disponible** → `severity="danger"` (rojo).
  - **Administrativo** → **granate**: fondo `red-800` + texto `red-100`. Tono sólido más oscuro, deliberadamente distinto del danger estándar para separar "estado administrativo" de "no disponible". **Sin token nuevo** — reusa `--sc-color-red-800` / `--sc-color-red-100` ya presentes en primitive; el master del Kit queda intacto (el granate vive solo en prototipo Figma + código).
- **Chips editables**: estados custom como **chips removibles con ×** (re-añadibles), **separados visualmente** de los tags fijos para que se lea la diferencia "sistémico vs editable".
- **Por qué aquí**: es reasignación de severidad/visual en UI de config (no componente nuevo del DS), pero al introducir un tratamiento de color propio (granate) DD-7 pide registrarlo.

---

## 3. Component overloads (slots reusados con semántica SC)

### 3.1 Toast `severity='secondary'` → violet (no slate)

- **Figma**: `Severity=Secondary` muestra slate-100 bg / slate-600 text — un "neutral notice" gris.
- **SC**: overload — `severity='secondary'` en `MessageService.add()` mapea a **violeta** (no slate).
- **Por qué**: la app usa `severity='secondary'` para "neutral notices" tipo `Borrador creado`, `Renombrado`. El slate de Figma queda demasiado apagado para esa categoría; violet da presencia sin sentirse celebratorio (como green success) ni urgente (como info azul).
- **Implementación**: tokens `--sc-toast-violet-*` (separados de `--sc-toast-secondary-*` que también existen pero sin uso). El selector `&[data-severity='secondary']` en el partial apunta a violet.
- **Si diseño** quiere un slate real para algún caso, se puede añadir un mapping nuevo `severity='contrast'` → slate sin afectar el violet.

---

## 4. Sizes / density (SC añade variantes off-Figma)

### 4.1 Input / Select / MultiSelect / Datepicker / Checkbox — sizes `sm` / `lg`

- **Figma**: Input + Select + MultiSelect tienen Sizes Small / Normal / Large explícitas (con px de diseño decimales 12.25 / 14 / 15.75 font, 8.75/5.25 / 10.5/7 / 12.25/8.75 padding).
- **Datepicker / Checkbox**: Figma SOLO modela densidad Normal — no hay variants Small / Large.
- **SC añade** `sm` y `lg` por consistencia de familia con el resto. Mismo escalado proporcional. Si diseño en algún momento define densidades específicas para datepicker o checkbox, ajustar.
- **Implementación**:
  - Input: `sc-inputtext.scss` `--sm/--lg` con valores Figma exactos (vía tokens `--sc-spacing-*`).
  - Select / MultiSelect: idem en `.p-select-label / .p-multiselect-label`.
  - Datepicker: `sc-datepicker.scss` (extiende formField vía `[size]`).
  - Checkbox: `checkbox.scss` `&--sm / &--lg` con box de 14/21 px de diseño.

### 4.3 Form field font-size base (md) = 14 — fix fuga `1rem` de PrimeNG

- **Síntoma**: los inputs leían "enormes" (texto 16px). Raíz (verificada en `@primeuix/styles`): PrimeNG **hardcodea** `.p-inputtext { font-size: 1rem }` / `.p-select-label { font-size: 1rem }` y el export del Kit Pro **NO define un `form.field.font.size` base** (solo los sm/lg). Resultado: el md caía al `1rem` (16px) de Aura, fuera de la rampa del Kit. Prueba de la fuga: `lg` era más pequeño que `md`, absurdo.
- **Por qué no se arregla en el preset**: `formField.fontSize` NO es un token consumido por el CSS base de PrimeNG (el `1rem` está a pelo en `.p-inputtext`/`.p-select-label`). Ponerlo en el preset sería no-op. La referencia de densidad de form confirma 14.
- **SC fija** el base a `var(--sc-font-size-200)` (14 de diseño) en el SCSS de cada wrapper, con selector host-prefijado para ganar a `.p-*` (misma cuenta de clases): `inputtext`, `select`, `multiselect`, `datepicker`, `inputnumber`, `search`, `inputgroup`. Viaja con el componente a cualquier app.
- **Guardarraíl**: `tokens:guard` (Dura 3) prohíbe campos PrimeNG crudos en plantillas de app (fuera de los wrappers) — si no, reintroducen el `1rem` en silencio.
- **Inspiración**: forms de referencia de diseño (14 valores, 12 labels/helpers, semibold-14 títulos, cards flat). Adoptado **densidad + flat** (label encima, NO el inset-label de esa referencia).

### 4.4 Dialog footer gap — divergencia consciente del Figma

`--sc-dialog-footer-gap` 7 (Figma `dialog/footer/gap: 7`) → **10.5** (`--sc-spacing-0-75`). Con botones `size="small"` content-width el 7 leía apelotonado (feedback de diseño). Token limpio de escala. **Propagar a Figma en el próximo sync del Kit.** Footers de modal usan `<p-button size="small">` (la regla muerta `min-width: 128px` que apuntaba a `.btn` se eliminó).

### 4.2 Primitive layer — ✅ Kit Pro 1:1 estructural + naming

**Refactor estructural** (histórico): primitive layer reorganizada para reflejar el Kit Pro tal cual. Una sola escala primitive numérica (`--sc-scale-*`) servía a spacing, padding, font-size, line-height, icon-size (igual que `aura/primitive.scale` en Kit Pro). Border-radius tiene escala dedicada (Kit Pro `aura/primitive.border.radius`).

> **Actualización (DD-13 + "rem centralizado"):**
> - `--sc-font-size-*`, `--sc-line-height-*` e `--sc-icon-size-*` se **desacoplaron** de `--sc-scale` → son **redondos en rem**, su propio *stream de tipo* (espejo del Kit oficial, naming step). **`--sc-icon-size-*` = divergencia consciente**: sin contrapartida en Figma (el Kit solo tiene `icon/size` base + iconos por componente), redondo y atado al stream de tipo para que un icono junto a texto-16 mida 16, no 15.75.
> - La propia escala `--sc-scale-*` se **emite en REM** (px de diseño /16) por el generador único DTCG (`tokens:gen` sobre `kit-export-dtcg.json`): un solo punto de conversión. El naming sigue la ley `v/14` sobre el px de diseño (5.25 → `--sc-scale-0-375`); el px de diseño va en comentario.
> - Los componentes consumen el **alias semántico `--sc-spacing-*`** (v/14), no la primitiva; la nomenclatura 8-point (`--sc-space-*`, `--sc-spacing-100`…) está **prohibida por el guard**.

| Primitive | Kit Pro origen | Notas |
|---|---|---|
| `--sc-scale-*` (34 valores: 24 positivos + 10 negativos) | `aura/primitive.scale.*` | Escala numérica única — naming base 14, emitida en rem |
| `--sc-radius-{none/xs/sm/md/lg/xl}` | `aura/primitive.border.radius.*` | Escala dedicada border-radius |
| `--sc-color-{paleta}-*` (24 paletas) | `aura/primitive.{slate/blue/...}.*` | Colores primitive |
| `--sc-font-family-*`, `--sc-font-weight-*` | (Kit Pro semantic) | Tipográficos primitive |

**Tokens semantic-derived (alias de primitive)** — preservan la API pública:

- `--sc-spacing-*` → `var(--sc-scale-*)` con sufijo idéntico (`--sc-spacing-0-25` = `var(--sc-scale-0-25)`) — **el alias de consumo de los componentes**
- `--sc-font-size-*` / `--sc-line-height-*` / `--sc-icon-size-*` → stream de tipo (redondo, rem; ya NO alias de `--sc-scale`, ver DD-13)
- `--sc-radius-{0/50/100/200/300/400/500}` → `var(--sc-radius-{none/xs/sm/md/lg/xl/2xl})` (legacy numérico preservado)

**Beneficios del refactor estructural**:

1. **Single source of truth numérico**: cambiar un paso de la escala propaga automáticamente a padding/gap sin tocar consumers.
2. **Mapping mecánico Kit Pro ↔ código**: cuando el export referencia `{scale.0-875}`, el código lo expone como `--sc-scale-0-875` literal — sin traducción.
3. **Cero divergencia naming**: diseño y desarrollo hablan el mismo idioma.
4. **API pública preservada**: los 1127+ consumers de `--sc-spacing-*` siguen funcionando sin sweep cross-app.

**Política**:
- Tokens primitive → SOLO matching exact con Kit Pro Variables (categoría + sufijo).
- Tokens semantic → naming propio libre (`--sc-text-primary`, `--sc-bg-elevated`, `--sc-shadow-card`) — son decisiones de marca SC.
- Tokens custom (no en Kit Pro) → entry en customs-catalog + collection "Custom" en Figma Variables (acción de diseño).

**Tokens "Custom column" Figma** (a mantener fuera del primitive layer canónico Kit Pro):

| Token | Razón |
|---|---|
| `--sc-color-navy-*` (5 steps) | Brand primary SC (vs azure Aura) — §1.1 |
| `--sc-color-sky-*` (5 steps) | Brand info SC (vs sky Aura) — §1.2 |
| `--sc-shadow-card-soft`, `--sc-shadow-toast-*` | Brand chrome SC — §2.x |
| `--sc-z-{sticky-form-header,bulk-action-bar,modal-backdrop,...}` | Pool overlay SC (no en Kit Pro) — §5.8 |
| `--sc-font-family-mono` | System mono stack (no exportado por Kit Pro) — §5.8 |
| `--sc-toast-undo-*` | Extension pattern undo SC — §2.1 |
| `--sc-radius-2xl` (16), `--sc-radius-full` (9999) | Steps custom SC fuera de la escala Kit Pro |
| `--sc-focus-ring-width` (2px) | RECONCILIADO al Kit 2026-06-14: el Kit ahora define electric-blue + width 2 → ya no diverge — §1.1 |

Diseño formaliza estos en la collection "Custom" al vincular el Kit Pro con Variables.

---

### 4.2.legacy Spacing scale — historial (referencia, no acción)

**Histórico**:
- Fase inicial: `--sc-spacing-*` usaba escala aditiva entera (4/8/12/16/24/32…); los sub-pixel paddings de Figma (5.25/8.75/10.5/12.25/15.75/17.5) se escribían raw decimal con comment "off-scale".
- Después: escala → decimal multiplicativa (3.5/7/10.5/12.25/14/15.75/21/24.5/...) base 14, alineada con PrimeOne 4.0, manteniendo el naming numérico antiguo.
- Finalmente: naming renombrado 1:1 con Kit Pro Variables (`--sc-spacing-{0-25/0-5/.../5}`) + 10 tokens missing añadidos (escala completa Kit Pro). Cero divergencia naming código ↔ export. (El naming numérico 8-point antiguo —`--sc-spacing-100`…— queda **prohibido por el guard**.)

**Principio**: el sufijo del token ES el multiplicador (× base 14 en px de diseño). `scale.0-25` en Kit Pro = `--sc-spacing-0-25` = 3.5 de diseño. Sin mapping mental, sin traducción. Cuando diseño exporta el JSON, el matching string→token es mecánico. (El valor se emite en rem: 3.5/16 = 0.21875rem, con el px de diseño en comentario.)

**Tabla referencia completa** (valores en px de diseño):

| Kit Pro Variables | Token | Valor (diseño) | Notas |
|---|---|---|---|
| `scale.0` | `--sc-spacing-0` | 0 | reset |
| `scale.0-125` | `--sc-spacing-0-125` | 1.75 | focus ring offset |
| `scale.0-25` | `--sc-spacing-0-25` | 3.5 | gap tight |
| `scale.0-375` | `--sc-spacing-0-375` | 5.25 | padding sm vertical |
| `scale.0-5` | `--sc-spacing-0-5` | 7 | gap default |
| `scale.0-625` | `--sc-spacing-0-625` | 8.75 | padding sm horizontal |
| `scale.0-75` | `--sc-spacing-0-75` | 10.5 | padding md vertical |
| `scale.0-875` | `--sc-spacing-0-875` | 12.25 | padding md horizontal |
| `scale.1` | `--sc-spacing-1` | 14 | base unit |
| `scale.1-125` | `--sc-spacing-1-125` | 15.75 | padding lg horizontal |
| `scale.1-143` | `--sc-spacing-1-143` | 16 | step de 16 exacto |
| `scale.1-25` | `--sc-spacing-1-25` | 17.5 | checkbox size, dialog padding |
| `scale.1-5` | `--sc-spacing-1-5` | 21 | gap medium, checkbox lg size |
| `scale.1-625` | `--sc-spacing-1-625` | 22.75 | |
| `scale.1-75` | `--sc-spacing-1-75` | 24.5 | section gap |
| `scale.2` | `--sc-spacing-2` | 28 | |
| `scale.2-25` | `--sc-spacing-2-25` | 31.5 | hero spacing |
| `scale.2-5` | `--sc-spacing-2-5` | 35 | |
| `scale.2-75` | `--sc-spacing-2-75` | 38.5 | hero gap |
| `scale.3` | `--sc-spacing-3` | 42 | |
| `scale.4` | `--sc-spacing-4` | 56 | hero block |
| `scale.5` | `--sc-spacing-5` | 70 | hero block lg |

**Resultado verificable**: 0 hits literal raw decimal en los wrappers (inputtext, multiselect, select, search, inputgroup, checkbox). Sweep cross-app: ~1127 hits migrados del naming antiguo al naming Kit Pro 1:1.

**Política**: NUNCA añadir tokens `--sc-spacing-*` sin matching `scale.*` en Kit Pro Variables. Si Figma evoluciona la escala, el mapping sigue automático.

**Ley formal de la escala**: el nombre del token = `valor de diseño / 14` (base 14), con `.`→`-` y negativos prefijo `neg-`. Radius = escala aparte, NO 14-base. `npm run tokens:gen` deriva el set canónico `--sc-scale-*` **y `--sc-radius-*`** del export DTCG, emite los valores en **rem** (px de diseño /16, conversión centralizada) y verifica que el código cumple la ley (incluida la de nombres, que `tokens:parity` no valida); `npm run tokens:import` los reescribe in-place desde el export. Corre en `npm run verify`.

**Métricas de componente = referencias, no px**: el preset modular no fija paddings/sizes con literales (`'10.5px'`) sino con `var(--sc-scale-*)` / `var(--sc-radius-*)` / `var(--sc-font-size-*)` — todas caen exactas en la escala generada del export; `base.ts` no contiene ningún hex. Así un re-export del Kit propaga a los componentes sin teclear nada. `tokens:parity` cruza valor↔valor (37 checks) y `npm run audit:theme-scale` vigila que el preset no se salga de la escala.

**Color de marca vigilado**: `tokens:parity` resuelve los `--sc-*` a hex y cruza **43 colores** (light+dark) contra el export: rampa primary (color/hover/active/contrast) + surface↔gray + texto/content/formField/navigation/list/overlay. Las divergencias conscientes van allow-listadas: info=electric-blue, warn=amber, dark navy-tinted vs zinc del Kit, y unas de chrome/jerarquía fina (placeholder gray-400 / disabled gray-300 más tenues que el gray-500 plano del Kit; nav-activo gray-700; borde de input gray-200 vs Kit gray-300). Cerró el punto ciego que dejó pasar el drift de `primary-hover`.

**Rampa de texto alineada al Kit**: texto cuerpo `--sc-text-primary` gray-800→**gray-700** (export textColor), secundario `--sc-text-secondary` gray-600→**gray-500** (export textMutedColor). El Kit es más plano (2 niveles); se mantienen `subtle`/`disabled` más finos a propósito.

**Borde de input — divergencia consciente**: el Kit usa gray-300 para el borde de form-field (un punto más definido que content/overlay gray-200). Se deja en `--sc-border-default` (gray-200, = content/overlay): 1 paso, imperceptible, y **sin crear token nuevo** (decisión de diseño: no mintar aliases que no estén ya en el preset/export). Allow-listado en parity.

**Auditoría de componentes — métricas heredan correctamente**: una auditoría solo-lectura cruzó el **default de Aura** (lo que PrimeNG renderiza sin override) contra el **export SC Prime**, resolviendo refs `{…}` + rem + aplanando camelCase→dot. Resultado: de 976 métricas numéricas, **655 coinciden** y **0 drift accionable** en componentes no pinados — confirma con datos que SC Prime ES PrimeNG limpio en sizing, así que **heredar Aura es correcto** (no hay que pinar los 81 componentes). Única divergencia conocida: `accordionHeaderFocusRingOffset` (Aura -1 inset vs SC 2; accordion no usado → no se pina, allow-list). Caveat: ~320 claves del export sin equivalente en Aura (SC-specific o naming divergente) no se cruzan — sin default Aura que filtre, bajo riesgo; reconciliar naming es follow-up. La marca (color) ya la cubre parity (43 enforce).

**Reconciliación pendiente**: `scale.1-25` (17.5) y `scale.2-5` (35) figuran arriba como Kit Pro Variables, pero el export actual puede no traerlos (`tokens:parity` los lista como code-only). Al próximo re-export del Kit: o diseño los añade, o se marcan SC-custom explícito.

---

## 5. Gaps conocidos

Componentes del Kit Figma SC que **NO** tienen wrapper todavía. Decisión consciente: añadir solo cuando aparezca primer caso real de uso.

### 5.1 `sc-inputgroup` — ✅ Resuelto (Figma `❖ InputGroup` node 6738:22644)

- **Figma SC**: 8 variants `Left × Right × SecondLeft × SecondRight` para addons laterales del input (icon, button, prefix/suffix con border merge).
- **PrimeNG**: `<p-inputgroup>` + `<p-inputgroup-addon>` cubren esto.
- **Resolución**: wrapper Extended. API minimal (`size`, `fluid`). Tokens fluyen vía `formField.*` sin overrides propios.
- **Decisión arquitectónica**: NO se re-empaqueta `<p-inputgroup-addon>` como `<sc-inputgroup-addon>` — los addons son 100% PrimeNG sin overrides, un wrapper añadiría boilerplate sin valor (minimal customization, DD-5). El consumer importa `InputGroupAddonModule` directo. Patrón consistente con `<sc-dialog>` que permite `<p-button>` por dentro.
- **NO confundir con search**: `<sc-search>` usa `<p-iconfield>` (icon overlay decorativo dentro del input, sin border merge). `<sc-inputgroup>` usa `<p-inputgroup>` (addons con border merge). Semánticas distintas.

### 5.2 `sc-select-button` — gap (Figma `❖ SelectButton` node 6738:46433)

- **Figma SC**: 24 variants `Select (First/Second/Third/Fourth/Multiple) × OptionAmount (2/3/4) × Multiple (true/false) × Invalid (true/false)`.
- **PrimeNG**: `<p-selectbutton>` (componente distinto a `<p-select>`).
- **Composición**: el `❖ SelectButton` Figma **NO** referencia `❖ Button` — son nodes independientes. Si diseño vincula los 2 en el Kit, este wrapper hereda automáticamente.
- **Estado**: sin uso hoy. Caso típico: filtros segmented horizontal ("Todos / Activos / Archivados"), choice radio visual.
- **Cuándo crear**: primer filtro segmented real en una app consumidora.

### 5.3 `sc-tag` — gap (Figma `❖ Tag` node 6738:55116)

- **Figma SC**: 4 variants `Basic / Severity (Primary/Secondary/Success/Info/Warn/Danger/Contrast) / Pill / Icon`. NO removible, fondo lleno de color (vs `❖ Chip` que es outline + removible).
- **PrimeNG**: `<p-tag>`.
- **Relación con sc-label-chip**: NO confundir. `sc-label-chip` cumple el rol del **Chip** Figma (outline, removible, categórico). `sc-tag` sería un componente nuevo para etiquetar contenido (estado de un ticket, severity de una alerta) — semántica distinta.
- **Cuándo crear**: primer caso de tag visual (severity de algo, estado lleno color).

### 5.5 `sc-search` — componente nuevo (Figma `❖ Search` node 11861:55210)

- **Estado**: ✅ creado, con galería de demos y consumers reales migrados (toolbars de list-pages + picker-search en forms). Tipo `extended`.
- **Composición**: `<p-iconfield iconPosition="left">` + `<p-inputicon>` + `<input pInputText type="search">` + clear button (×) + opcional kbd hint (⌘K, /). El componente añade chrome funcional encima del IconField nativo PrimeNG (clear automático cuando hay value, focus API pública).
- **Por qué NO se usa `<p-inputgroup>` aquí**: IconField es overlay decorativo dentro del input (correcto para search). InputGroup es addon con border merge (para botones de acción). Semánticas distintas — no intercambiables.
- **Figma**: página `❖ Search` (node 11861:55210) creada por diseño; variants (Size sm/md/lg × HasHint × Filled × Disabled) compuestos por el equipo.

### 5.4 Reclasificación: `sc-checkbox`

- **No es gap** (el componente existe), pero estaba mal etiquetado.
- **Auditoría confirmó**: NO importa `primeng/*`, usa `<input type="checkbox">` nativo + CSS custom para los 3 estados. Es **pure-sc**, no extended.
- **Acción**: tracker de componentes actualizado. Sin impacto runtime.

### 5.6 `sc-toggle-button` — gap (Figma `❖ ToggleButton` node 6738:46435)

- **Figma SC**: button con estado pressed/unpressed. Diferente de `❖ ToggleSwitch` (que es el switch-style; ese ya está cubierto por `<sc-toggleswitch>`).
- **PrimeNG**: `<p-togglebutton>`.
- **Cuándo crear**: primer caso real — segmented toggle de un single estado. No hay caso hoy.

### 5.8 `--sc-font-family-mono` — primitive nuevo SC

- **Tipo de divergencia**: token primitivo añadido al catálogo SC; PrimeNG/Aura **NO expone** equivalente (`--p-font-family-*` no incluye monospace).
- **Razón concreta**: time labels de players de audio + gate input "CONFIRMAR" del retranscription modal usan tabular monospace. Antes cada consumer hardcodeaba `ui-monospace, monospace` como fallback inline — desalineación garantizada.
- **Valor**: system mono stack — `ui-monospace, 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', monospace`. No mapea a font custom; es la heurística cross-OS estándar.
- **Definición en código**: `projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css` (junto a `--sc-font-family-primary` / `--sc-font-family-secondary`).
- **Consumers actuales**: players de audio (time + label-meta) + modal de confirmación de retranscripción (gate label + gate input).
- **🟡 Pendiente Figma SC**: añadir variable `font-family-mono` a la collection Variables SC con el mismo stack. Sin export → entry "Custom" en Figma SC que diseño no podrá referenciar al construir specs. **Acción Diseño**: importar token vía plugin de Variables cuando toque resync.
- **✅ Decisión de diseño (Opción A)**: mantener system stack (no adoptar fuente mono custom como JetBrains/IBM Plex/Geist). Razón: cero webfont weight, look nativo en cada OS, los usos (time labels, gate input "CONFIRMAR", ID labels) son contextos invisible-a-ojo donde la diferencia entre system mono y custom no aporta valor de marca. Reabrir si surge razón concreta (branding tech-fuerte / consistencia con doc pública).
- **Cuándo borrar**: nunca (es primitive permanente). Si diseño decide custom font, solo cambia el valor del primitive — los consumers no se enteran.

### 5.7 Refactors de consistencia (pure-sc → Extended)

- **No son divergencias** — al revés, son **alineaciones con PrimeNG** que reducen el custom innecesario. Se documentan como reseña para futuros contributors:
  - `sc-toggleswitch`: era CSS sobre `<input type="checkbox">`; ahora wrapper de `<p-toggleswitch>`. Misma API pública, los 21 consumers no se enteraron.
  - `sc-bulk-edit-menu`: internamente usa `<sc-select>` × 2 (era `<select>` HTML nativo).
- **Declines documentados**: `inline-rename-cell` y `label-chip` evaluados — declinados con justificación. El `<sc-inputtext>` rompería la metáfora "flat cell" de rename-cell; el modelo `LabelColor` de label-chip no encaja con `<p-tag>` ni `<p-chip>`.
- **Política**: prioridad clara — **minimizar custom sobre PrimeNG**. Antes de cualquier nuevo pure-sc, las 4 preguntas del checklist §0 son obligatorias.

### 5.8 Convenciones implícitas duration + shadow (cerrado sin token)

**Un audit detectó**: 50+ hits literales de `transition: X 200ms ease` (canonical) + drift menores (140/160/180/220ms) y 5 hits `box-shadow` divergentes fuera del set de tokens `--sc-shadow-*`. Tentación natural: cocinar escala `--sc-duration-*` y/o token `--sc-shadow-card-soft`.

**Decisión (NO crear tokens)**:

Motivación de la decisión, no del valor:

1. **Migration safety**: cada primitive nuevo `--sc-*` SIN equivalente en Figma Variables se vuelve carga futura — un día PrimeNG 22 / un import de Variables pasarán por encima y la "convención implícita" queda como deuda invisible.
2. **DD-7** (toda primitive nueva → entry customs-catalog + plan Figma): durations no se exportan en Figma Variables como categoría de primer nivel; intentar tokenizar es modelo prematuro.
3. **Práctica de industria**: los design systems de referencia no exponen duration tokens semantic-named (`fast/base/slow`); cuando los tokenizan usan una escala numérica (`duration-75/100/150/200/300/500/700/1000`) que es literal-mapping disfrazado. La buena práctica converge a "literal + convención documentada" sobre "token semántico".

**Convención canonical** (drift normalizado en sweep):

| Caso | Duración | Easing | Hits |
|---|---|---|---|
| State transitions (background, border, opacity primary) | `200ms` | `ease` / `var(--sc-easing-default)` | ~25 |
| Hover micro-interactions (color, transform scale) | `150ms` | `ease` / `ease-out` | ~10 |
| Focus rings (box-shadow grow) | `100-120ms` | `ease` / `cubic-bezier elastic` | ~9 |
| Instant feedback (active state, tap) | `60-80ms` | `linear` / `ease-in` | ~3 |
| Emphasis (modal slide-in) | `300ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | ~1 |

**Drift normalizado**: 220→200ms, 140→150ms, 160→150ms en 5 hits → escala convergente. `180ms` mantenido como caso especial (elastic ring, `cubic-bezier(0.16, 1, 0.3, 1)` necesita timing más lento para el bounce — intencional).

**Convención shadows** (5 hits divergentes del audit):

1. Sticky footer con `box-shadow: 0 -4px 12px rgb(0 0 0 / 0.04)` — TOP-inverse Y (sombra hacia arriba). Patrón **único** en codebase. NO tokenizable. Mantener inline con comment; tokenizar cuando aparezca 2º consumer.
2. Drops de drag-hover en filas de tabla (12px / 16px blur con 12% / 18% opacity). Diferentes por **intensidad semántica** (suggestion sutil vs active drop). NO consolidar a token; son 2 contextos drag-hover con presencia distinta. Documentar inline.
3. Keyframe focus-ring animation (`0 0 0 0 currentColor` → `0 0 0 4px currentColor 0%`) — animación load-bearing, no shadow estática. NO aplica al audit.
4. Hover thumbnail scoped a la app de demos (no DS core). NO aplica.

**Decisión consolidada**: los tokens `--sc-shadow-*` existentes (xs/sm/card/dropdown/popover/dialog/toast) cubren el 95% canonical. Los hits divergentes son **casos legítimos únicos** donde documentar inline supera a tokenizar.

**Cuándo reabrir**:

- **Durations**: si diseño exporta una categoría `duration` en Figma SC Kit Pro (no existe hoy). Trigger formal Figma → token mapping mecánico.
- **Shadows**: si el patrón `0 -4px 12px ...` aparece en 2º consumer → crear `--sc-shadow-sticky-footer-top` y mover ambos.

**Decisiones abiertas para diseño**:

- Decision A: ¿hay apetito para definir escala duration en Figma SC Variables (instant / fast / base / slow / emphasis)? Beneficio: source-of-truth visible en kit. Coste: mantenimiento + sync con consumers.
- Decision B: ¿hay apetito para tokens shadow "sticky-footer-top" + "drag-hover" si aparecen 2+ consumers respectivos? Mismo coste-beneficio que A.

Sin decisión activa, el statu-quo (literales + convención documentada) es la opción más mantenible para un proyecto de este tamaño.

**Convención z-index local stacking** (12 hits de audit):

El DS expone tokens globales `--sc-z-*` para el **pool de overlays compartidos** (dropdown 1000, sticky 1020, sticky-form-header 1030, fixed 1040, bulk-action-bar 1050, sidebar 1055, modal-backdrop 1060). Sin embargo, hay hits literales `z-index: N` con `N ∈ [1, 5]` que NO son candidatos a token global.

| Pattern | Valor | Justificación |
|---|---|---|
| Sticky table header thead | `5` | Stacking local DENTRO del `<table>` container con `position: relative`. Z=5 > z=0 default = thead encima de rows scrolleadas. `var(--sc-z-sticky) = 1020` sería overkill (z global afectaría composición fuera del table). |
| Drop drag-hover row indicator | `4` | Stacking local dentro de drag-drop list, capa ↑ que filas hermanas pero ↓ que sticky header del padre. |
| Shell layer ordering | `1-2` | Stacking local dentro de panel/section container para resolver overlap sutil (scrim sobre body, hero sobre decorative). |

**Decisión**: NO tokenizar `z-index: 1-5`. Son **stacking context LOCAL** confinados a un contenedor `position: relative` ancestor. Convertir a token global sería contradictorio — promovería el valor al pool overlay 1000+ y rompería la composición.

**Cuándo aplica `--sc-z-*` global**: cuando el elemento sale del flujo normal y compite con overlays de OTROS componentes/features (modal vs dropdown vs toast).

**Cuándo aplica `z-index: 1-5` literal**: cuando el elemento solo necesita orden DENTRO de su contenedor padre. El valor literal es self-evident en contexto y NO contamina el pool global.

**Reabrir**: si aparece confusión cross-feature ("¿por qué este z=5 no domina ese dropdown?") → probablemente es un caso que SÍ necesita pool global. Re-evaluar.

### 5.9 Preset-native tokens — `formField`, `overlay color`, `text.hover`

Un audit cruzó la capa `semantic.*` del código vs Kit Pro Variables (`aura/semantic.form.field.*`, `aura/semantic.overlay.*`, `aura/semantic.text.*`, `aura/semantic.surface.*`, `aura/semantic.focus.ring.*`, `aura/semantic.disabled.opacity`) buscando desalineaciones tipo las de spacing/radius.

**Resultado**:

| Categoría Kit Pro | Cobertura en código | Naming 1:1 | Estructura 1:1 | Acción |
|---|---|---|---|---|
| `surface.{0-950}` (12 stops) | `--sc-color-slate-*` mapping vía `colorScheme.light.surface` | ✅ | ✅ | OK — sin cambios |
| `focus.ring.*` | electric-blue + width 2 (reconciliado 2026-06-14) | ✅ | En el Kit, ya no diverge | §1.1 |
| `disabled.opacity` | N/A en Kit Pro | N/A | Custom legítimo (defensive 0.6) | Documentado en el preset |
| `form.field.*` (11 paths) | Vive en el preset (`base.ts` colorScheme.light.formField, 10/11 paths) | ❌ camelCase TS vs JSON nested | ⚠️ Subset, no expone CSS `--sc-form-field-*` | **Documentar como preset-native** ↓ |
| `overlay.{select,popover,modal}.{background,color,border}` | Geometría (radius/shadow) en CSS; colores en el preset colorScheme | ⚠️ parcial | ⚠️ Color tokens no expuestos como CSS | **Documentar como preset-native** ↓ |
| `text.{color, hover.color, hover.muted.color, muted.color}` | 19+ semantic roles propios (primary, secondary, subtle, accent, success, danger, etc.) **SIN** `text.hover.*` | ⚠️ parcial | ⚠️ extendido; falta `text.hover.*` | **Postergar** (sin consumer real, DD-4) |

**Decisión (NO tokenizar `--sc-form-field-*`, `--sc-overlay-*-color`, `--sc-text-hover-*`)**:

Motivación:

1. **DD-5 minimal customization**: el preset modular ES el bridge a PrimeNG. Los tokens PrimeNG-internal (`formField`, `overlay color`) viven en TS porque PrimeNG consume el preset, no CSS variables directas. Crear `--sc-form-field-*` en `02-semantic.css` y luego inyectarlas en el preset sería **wrap-around redundante** sin consumer real.
2. **Migration safety**: cada token `--sc-*` nuevo SIN matching en Figma Variables es carga futura. Kit Pro NO expone `form.field` / `overlay color` como variables flat — viven nested. Crear el CSS shadow sería divergencia naming contraria a la política Kit Pro 1:1.
3. **DD-4 trigger real**: ningún consumer consume `formField` o `overlay color` directamente como CSS variable. Todo el wiring va por preset → `--p-formField-*` → componente PrimeNG. Tokenizar sería trabajo en vacío.

**Política implícita establecida**: los tokens **PrimeNG-internal** (`formField`, `overlay color`, `disabled.opacity`) son **preset-native**. Viven en el colorScheme del preset (TS), NO se duplican como CSS variables `--sc-*`.

Los tokens **brand-visible** (paletas, spacing, radius, scale, surface, shadows propios) sí viven en las capas CSS (`01-primitive.css` … `05-extensions.css`) y son consumibles desde el SCSS de componentes.

**Cuándo reabrir**:

- **`form.field` / `overlay color`**: si aparece un consumer que necesite `var(--sc-form-field-background)` directo en SCSS (no vía componente PrimeNG). Hoy 0 consumers — promover sería prematuro.
- **`text.hover`**: si Kit Pro formaliza `text.hover.*` como variable flat exportable Y aparece consumer que pida hover de texto tokenizado. Hoy hover se maneja inline en SCSS de componentes.
- **PrimeNG 22+ migration**: si el shape de `formField` cambia upstream, evaluar si conviene tokenizar como CSS shadow para aislar del cambio.

**Acción**: NO crear tokens nuevos. Esta entry documenta la decisión.

### 5.10 Modal legacy custom — descartado a favor del Kit Pro Dialog

**Origen**: el DS antiguo de Smart Contact tenía un **Modal custom** pre-existente a la adopción del Kit Pro PrimeOne. Audit vía Figma MCP confirmó su estructura:

| Pieza | Legacy custom | Kit Pro Dialog (`6738:50209`) |
|---|---|---|
| `Header` prop text | ✅ | ✅ |
| `Subheader` prop text separado | ✅ default "Subheader" | ❌ (Kit Pro usa `Content` TEXT) |
| Body como SLOT apilable | ✅ tipo SLOT real | ❌ (Kit Pro usa `Content` TEXT, no slot) |
| `Show icon` + `Swap icon` (INSTANCE_SWAP) | ✅ icon-swap = drag handle visible | ❌ |
| Dividers hairline header/body/foot | ✅ visibles | ❌ NO los pinta |
| `Show Footer` / `Closable` / `Show 1st-2nd Button` toggles | ❌ no individuales | ✅ todos |
| `[Confirm Dialog] Show Icon` boolean | ❌ | ✅ |
| Border color | `#D3D5DA` aprox | `#DBDFE6` aprox |
| Drop shadow | 1 layer y:16 b:40 sp:-8 alpha:0.12 | 2 layers y:8 b:10 + y:20 b:25 alpha:0.10 |
| Corner radius | (no medido) | 12 = `--sc-radius-xl` |

**Decisión** (audit cruzado): **adoptar el Kit Pro Dialog como canónico**. Descartar el legacy custom completo. Razones:

1. **El Kit Pro tampoco tiene drag handle ni dividers** — el descarte de esos 2 elementos visuales en `<sc-dialog>` resulta estar **alineado con el Kit Pro nuevo**, no era arbitrario. El legacy custom representaba una iteración anterior del DS.
2. **Toggles individuales del Kit Pro** (`Show Footer`, `Closable`, `1st/2nd Button`) son mejor API que el legacy custom (que tenía todo on/off). `<sc-dialog>` ya replica parte vía `[closable]`, `[hasFooter]`; el footer projected resuelve el caso "cuántos botones" sin toggles individuales.
3. **Shadow del Kit Pro** (double layer y:8 + y:20) es más refinado que el legacy single layer.

**Lo que SÍ preserva `<sc-dialog>` del legacy** (y mejora vs Kit Pro):
- `Subheader` como prop separado (`[subtitle]`) — el Kit Pro tiene `Content` TEXT, perdiendo la semántica title+subtitle.
- Body como SLOT real apilable (`<ng-content>` con `gap: var(--sc-spacing-1-125)`) — el Kit Pro lo modela como `Content` TEXT. El DS recupera el modelo legacy aquí.

**Mapping final 3 wrappers PrimeNG ↔ Kit Pro**:

- `<sc-dialog>` → `<p-dialog>` → Kit Pro `❖ Dialog` (`6738:50209`) ✅
- `<sc-confirm-host>` → `<p-confirmdialog>` → Kit Pro `❖ ConfirmDialog` (`6738:50207`) ✅
- **gap reservado** → `<p-confirmpopup>` → Kit Pro `❖ ConfirmPopup` (`6738:50208`) — sin trigger consumer real, common-in-SaaS reservado.

### 5.11 `--sc-bg-canvas` — gap de token semántico de lienzo (deuda)

- **Gap**: no existe un token semántico único para el **lienzo de página** (blanco en light / gray-950 en dark). Hoy la jerarquía de color de config (§6) resuelve el lienzo con un override por tema en el shell: `:host` = `--sc-bg-surface` (blanco light) y `:host-context(.sc-dark)` = `--sc-bg-default` (gray-950 dark) — `.sc-dark` es el darkModeSelector por defecto de `provideSmartContactUi`.
- **Por qué es gap**: el workaround funciona pero acopla la jerarquía de color a dos tokens distintos según tema en vez de a un único `--sc-bg-canvas` semántico.
- **Fix limpio**: cuando diseño añada la variable a la collection Custom de Figma, promover vía el import de Variables. Hoy 1 solo consumidor (config) → prematuro mintarlo.

---

## 6. Jerarquía de color de config Contact Center

> Réplica 1:1 del Figma de config. Documenta **qué color lleva cada superficie**
> de la pantalla de config y por qué. Es el hogar canónico de esta jerarquía.

| Superficie | Selector | Light | Dark | Forma |
|---|---|---|---|---|
| **Lienzo de página** | shell `:host` / `:host-context(.sc-dark)` | `--sc-bg-surface` (blanco) | `--sc-bg-default` (gray-950) | — (deuda `--sc-bg-canvas` §5.11) |
| **Bandeja** (contenedor interior gris) | `.page__inner` | `--sc-bg-default` (gray-50) | gray-950 | radius 12 · padding 16 · gap 28 |
| **Cards de sección** | `.settings-card` | surface (blanco) | surface | radius 8 · padding 16 · borde sutil · **sin sombra** |
| **Índice** (rail de navegación) | `.settings-sidebar` | gray-50 | gray-50/dark | radius 12 · alineado arriba |
| **Divisor** | `<sc-divider>` | `--sc-border-default` (gray-200, `#dadfe6`) | idem | antes `--sc-border-subtle` (gray-100) — ver §2.10 |

**Lectura de la jerarquía**: lienzo blanco → bandeja gris recogida (radius 12) → cards de sección blancas a sangre dentro de la bandeja, con borde sutil y sin sombra (chrome bajo) → índice gris recogido alineado al tope. El divisor sube a gray-200 para definir la separación contra los grises de la bandeja/índice sin meter sombra.

**Sin tokens nuevos** salvo el gap `--sc-bg-canvas` (§5.11, diferido).

---

## 7. Tipografía — punteros

El **cinturón tipográfico** está cerrado (tokenización de 367 literales `font-size` → `--sc-font-size-*`, cobertura 48%→100% accionable; guard "Dura 4" bloquea `font-size` literal nuevo, 0 excepciones; el hero 88px pasó a `--sc-font-size-900`). NO es divergencia de marca, así que su contenido vive en sus hogares canónicos:

- **Racional / blindaje** (por qué un update de PrimeNG no borra los tipos: viven en `--sc-*` + el bridge del preset, no en PrimeNG; único riesgo = slot `--p-*` renombrado → drift detectable por `npm run tokens:type-parity`; **NO** vincular `--sc-font-*` a la escala PrimeNG) → `migration-safety.md` + DD-11 en `DECISIONS.md`.
- **Escala tipográfica** (redonda 12/14/16/18/20/24/32, desacoplada de `--sc-scale`, rem root-16, line-heights por regla, 2 pesos, naming de text styles = tokens de código) → **DD-13** en `DECISIONS.md`. Es la decisión que circula por el mecanismo de DD-11.
- **Rampa de CONTENIDO (h1–h4, body-1/2/3, subtitle, caption) = divergencia consciente**: PrimeNG no tiene tipografía de contenido (solo `form.field` para inputs; el resto hereda del root del `<html>` — issue PrimeUIX #192 abierto). Es hueco upstream, **no deuda del DS** → la aporta el sistema, con naming de **barra** (`typography/heading/h1`, `typography/body/body-1`) en la capa expuesta, separado de los tokens atados a `form.field` (que sí espejan PrimeNG). Regla de naming **por capa**: la capa **expuesta** (App, lo que el componente consume → `--app-font-size`) usa barra/jerarquía espejo del dot-path de PrimeNG; el **primitivo de escala** va plano (`typography/font-size/14`, nombre=valor, interno). Evidencia y validación contra PrimeNG → DD-13 (Anexo "Validación contra PrimeNG").
- **Tooling** → `npm run tokens:type-parity` (read-only) + `npm run tokens:guard` (Dura 4), ambos dentro de `npm run verify`.

**Line-heights**: decididos en DD-13 (por regla) e implementados con la escala redonda.

---

## Cómo añadir una divergencia nueva a este catálogo

1. Detéctala en un audit (comparación elemento a elemento contra el nodo Figma).
2. Decisión conjunta con diseño: ¿se documenta como divergencia intencionada o se alinea a Figma?
3. Si divergencia → añadir entry aquí + en el spec doc del componente afectado (sección "Divergencias documentadas").
4. Si alineación → arreglar el código + actualizar el parity de Figma en el inventario de componentes.

---

## Para consumers no-Angular de los tokens (p. ej. apps React)

Las divergencias del catálogo **NO** se transmiten automáticamente a otros stacks. Una app no-Angular hereda los tokens (`--sc-color-*`, `--sc-spacing-*`, etc. vía `@smartcontact-hub/styles`) pero su capa de componentes tiene que decidir conscientemente cuál usar.

Recomendación:

- Brand colors (Primary navy / Info electric-blue / Warn amber): consumir vía `--sc-color-*` → alineado automáticamente.
- Component extensions (toast undo button, modal stacking, checkbox tri-state): implementar equivalentes si se necesitan. No es responsabilidad del DS forzar el patrón.
- Component overloads (severity='secondary'→violet): cada API decide si expone el slot violet o no.

---

Última actualización: 2026-06-14 (adaptación al repo unificado: rutas, export DTCG,
preset modular, escala en rem, focus-ring 2px reconciliado al Kit).
