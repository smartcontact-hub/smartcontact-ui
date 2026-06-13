# DECISIONS-LOG-B — Mitad B, lote 1 (port de componentes)

> Una entrada por pieza: qué se portó, el barrido de escala, el resultado del
> diff visual y las decisiones §4 tomadas con su base. Guion del lote:
> `docs/master-prompt-mitad-b.md` (fuente operativa: `docs/component-port-plan.md`).

---

## GATE — `sc-component-icon-resolver`: se porta TAL CUAL (decisión §4.2)

**Decisión:** portar el resolver del catálogo de desarrollo sin cambios, junto
con los tipos públicos de `lib/core/types`.

**Racional (base verificada):**
- Es autocontenido (109 líneas, cero dependencias más allá de un tipo) y
  resuelve a clases CSS `sc-icon-font--*` que el paquete `@smartcontact/icons`
  YA genera (4.250 clases en `material-symbols-icons.generated.css` — grep).
- Los 15 wrappers del catálogo de desarrollo lo consumen vía template con
  clases CSS, no vía el componente `<sc-icon>`: sustituirlo por el mapeo del
  catálogo de diseño obligaría a reescribir todos los templates y acoplar los
  wrappers al componente de iconos — eso es rediseño, no adopción, y rompería
  el principio "la solución más simple que resuelve el problema real".
- Mantiene compat con strings legacy `pi pi-*` de consumidores existentes.
- **Revisión futura anotada:** al reconciliar `sc-icon` (§4.6, fuera de este
  lote) puede unificarse resolver + componente; la decisión de hoy no lo
  bloquea (el mapa alias→Material es compartible).

Sin barrido de escala (no hay CSS). `npm run verify` en verde tras el port.

---
## Método del diff visual (vale para todo el lote)

El sc-demo del molde no puede ejecutarse (sin node_modules; las fuentes son de
solo lectura), así que la referencia de render es doble y más fuerte que un
screenshot del molde:
1. **Métricas computadas** (`getComputedStyle`) contra los valores del export
   del Kit — la misma vara que `tokens:parity`. Como los wrappers son finos y
   sin SCSS propio, "no-layout-shift" = el wrapper renderiza EXACTAMENTE igual
   que el primitivo PrimeNG ya verificado 1:1 en fundaciones.
2. **Baselines de screenshot** por página (committeados; solo se comparan en
   local — los baselines de Playwright son por-plataforma; en CI mandan las
   métricas).

Barrido de escala 8-point: **cero casos** en las 15 piezas — ningún wrapper
del molde trae SCSS propio (verificado por grep; el único consumo 8-point del
molde está en el modal de negocio, fuera de lote). El guard lo vigila igual.

---

## Piezas del lote (15 + corrección transversal)

### sc-button
Adopción directa. e2e: md 10.5/7/radio 6/font 14/gap 7 · sm 8.75/5.25/12 ·
lg 12.25/8.75/16 · icon-only width 35 — todo 1:1 con el export. El resolver
mapea `pi pi-trash` → `delete` (compat legacy verificada en render).

### Corrección transversal — 15 slots fontSize del preset a tipografía redonda
Auditoría programática de TODOS los `fontSize` de los módulos del preset
contra el export: 15 slots traían la tipografía pre-DD-13 en decimales
(codemod de Mitad A los había tokenizado a escala porque coincidían con pasos:
12.25/17.5/21/15.75/10.5). El Kit S76 los define redondos vía
`typography.font.size.*` → corregidos a `--sc-font-size-100/300/400/450`
(card/dialog título 18, drawer título 20, floatlabel/iftalabel/progressbar 12,
message sm/lg 12/16, tag 12, toast detail 12). Quedan EN ESCALA los font que
el Kit define sobre `scale.*`: badge (10.5/8.75/12.25/14), avatar (14/21/28),
stepper (16) — verificado slot a slot.
**Base verificada:** script de auditoría export↔módulos + e2e (tag pasó de
12.25 → 12 = export).

### sc-badge
Adopción. e2e: alto/min-width 21, font 10.5 (md), sm 8.75, xl 14. El
border-radius del badge de un carácter es 50 % (clase estructural "circle" de
PrimeNG, no drift del slot del Kit) — documentado en el spec.

### sc-card
Adopción. e2e: body padding 17.5, gap 7, radio 12; título 18 tras la
corrección DD-13.

### sc-chip
Adopción (iconos vía resolver). e2e: 10.5/7, radio 16, gap 7, remove icon.

### sc-tag
Adopción (canónico para etiquetas de solo lectura). e2e: 7/3.5, font 12/700,
radio 6. La variante de 8 colores categóricos + puntito (solape label-chip)
NO entra en este lote (Fase 4) — anotada.

### sc-message
Adopción. Hallazgo verificado: la variante por defecto `simple` lleva
`content.padding = 0` EN EL KIT (`message.simple.content.padding = 0`) — la
aserción inicial del e2e era la equivocada, no el render. e2e: simple 0,
outlined 10.5/7, radio 6, texto 14/500.

### sc-panel
Adopción. e2e: header 15.75, radio 6.

### sc-skeleton
Adopción. e2e: radio 6.

### sc-textarea (+ fix de drift del molde)
Adopción + corrección: el molde definía `textareaSize` sin vincularlo (el
input `size` era inerte; el tipo de `pSize` no admite `undefined` y el bind se
omitió). Vinculado con cast explícito. e2e: 10.5/7/radio 6/font 14; sm 12.

### sc-drawer
Adopción. e2e: abre, header 17.5, título 20/600 (redondo DD-13), cierra con
ESC.

### sc-progressbar · sc-progressspinner · sc-radiobutton (renames DD-12)
Adopción con rename a pegado (carpeta, fichero, selector; las clases TS
conservan su nombre — no hay consumidores que romper en este repo, así que no
se publican aliases de selector: el alias vivo de la transición aplica al
repo de origen del catálogo de desarrollo, no aquí). e2e: progressbar alto
17.5/radio 6/label 12 · spinner renderiza · radiobutton caja 17.5 (sm 14,
lg 21) y selección excluyente.

### sc-avatar + sc-avatargroup (construcción hacia la spec Figma)
Avatar adoptado y extendido a la spec del Kit (Type Label/Icon/Image · Size
28/42/56 · Badge · Group): el Badge se compone sobre `p-overlaybadge`
(reutilizar primitivos, la propia regla wrapper-vs-custom) con inputs
`badge`/`badgeVariant`; `sc-avatargroup` (pegado DD-12: envuelve
`p-avatar-group`) apila `sc-avatar` proyectados. Fleco resuelto: el offset
estructural de PrimeUIX (`.p-avatar + .p-avatar`) no atraviesa los hosts
proyectados → re-aplicado en el grupo con los valores del Kit
(`avatar.group.offset` -10.5/-14/-21) vía aliases semánticos; se añadieron los
**aliases negativos `--sc-spacing-neg-*`** (1:1 con los pasos negativos de la
escala — completan la tabla, no inventan valores). e2e: 28/42/56 medidos,
badge visible, offset -10.5 computado.
**Pendiente del solape avatar (Fase 4, fuera de lote):** fallback de
ilustración por hash → tipo Image + reconexión de `sc-photo-upload`.

### sc-toast + ScToastService / provideScToast
Adopción (infra de notificación). e2e: el servicio dispara y el toast
renderiza summary 14 / detail 12 (Kit). Recordatorio de fundaciones aplicado:
el gap de acciones del toast custom del catálogo de diseño quedó en
`--sc-scale-0-5` — ese toast custom es pieza de la Fase 3, no este wrapper.

---

## Diferido al siguiente lote

- **Los 9 wrappers del catálogo de diseño** (datepicker, multiselect,
  inputnumber, search, inputgroup, divider, column-selector, group-popover,
  confirmdialog) — arranque natural del lote 2.
- **Los 5 comunes a convergir** (inputtext, select, toggleswitch, dialog,
  checkbox — con sus decisiones §4.1/§4.3).
- `ScDynamicDialogService` (infra; el molde la trae junto a dialog — se
  adopta al convergir `sc-dialog`).
- Los 16 custom (Fase 3, con la deuda de aislamiento §5), los 4 solapes
  (Fase 4: variante de 8 colores de tag/chip, fallback de ilustración del
  avatar, section-card anidado, dynamic-dialog), `sc-datatable` (§6) y Memory.
- Decisiones §4 aún abiertas: base de `sc-checkbox`, API de `sc-dialog`,
  rename de `sc-confirm-host`, API de `sc-section-card`, reconciliación de
  `sc-icon`. La §4.2 (icon-resolver) quedó cerrada en este lote.

---

# Lote 2 — los 9 wrappers del catálogo de diseño

## Método del diff visual del lote
Misma doble vara del lote 1 (métricas computadas contra el export + baselines
locales) **más la referencia Figma en vivo**: el file canónico
«Smart-Contact Prime» conectado por MCP (Desktop Bridge). Capturas de las
páginas ❖ de los componentes con chrome (Search 11876:22312, MultiSelect
6738:47040) comparadas contra el render de la demo; el resto de páginas ❖
localizadas programáticamente (lectura, cero escrituras en el file). El REST
de export de imágenes tenía el token caducado → capturas vía
`exportAsync` del plugin (mismo resultado).

## Decisiones transversales del lote

### §4.6 cerrada — sc-icon reconciliado en @smartcontact/icons
Los wrappers de diseño (search, column-selector, group-popover) usan
`<sc-icon>` con tamaños numéricos: la reconciliación no podía esperar.
`ScIconComponent` del paquete de iconos se extendió de forma
retro-compatible: `size` acepta número (px de diseño → `font-size` inline +
eje `opsz` vía `--sc-icon-optical-size`) además de sm/md/lg, y se añadió
`spin` (con prefers-reduced-motion). Ejes FILL/wght/GRAD/opsz conservados por
el mecanismo de custom properties existente. Las constantes `SC_ICON_SIZE_*`
se portaron al paquete (salda la deuda `@shared/utils/icon-size`).
**Desviación anotada:** el §4.6 pedía conservar «el proveedor por ligadura»;
el paquete renderiza por glifo de codepoint del catálogo generado — mismo
resultado visual, sin depender de font-feature `liga`, y valida nombres
contra el catálogo. Se adopta el codepoint como proveedor del repo unificado.

### Clases públicas renombradas a `Sc*`
Las clases del catálogo de diseño venían sin prefijo (`SearchComponent`);
la API pública del paquete usa `Sc*` (uniforme con el lote 1). Los selectores
NO cambian salvo donde DD-12 lo exige.

### DD-12 aplicado con su borde exacto
`sc-group-popover` y `sc-column-selector` CONSERVAN el kebab: su nombre es
descriptivo propio (gestor de columnas, popover de grupos), no el nombre de
un componente PrimeNG — la tabla Rosetta ya los listaba en kebab. El pegado
solo aplica a hosts 1:1 (p. ej. confirmdialog).

### Specs unitarios del origen no portados
La verificación del repo es e2e + diff + guardarraíles; no hay infra karma
para libs. Si se monta, los specs del origen son recuperables tal cual.

## Piezas

### sc-divider
Port directo (ya pegado). e2e: margin 14 H/V, content padding 7.

### sc-inputgroup
Port directo. Addons por proyección (el consumidor importa los módulos
PrimeNG de los slots — superficie mínima preservada). e2e: input interno con
métrica de form field; fix de spec: la clase del addon en PrimeNG 21 es
`p-inputgroupaddon` (sin guiones).

### sc-search
Port con iconos reconciliados (§4.6). **Diff visual contra ❖ Search del
file canónico:** lupa izquierda, placeholder, radio 6, hint de atajo —
render 1:1. e2e: métrica de campo + CVA (ngModel) + clear.

### sc-datepicker
Port directo (chrome label/required/error + CVA). e2e: métrica de campo,
panel del calendario radio 6, error visible, ESC cierra.

### sc-inputnumber
Port directo (input nativo numérico — decisión deliberada del origen vs
p-inputNumber, documentada allí). e2e: métrica + chrome de error.

### sc-multiselect
Port directo (opciones primitivas string[] soportadas). **Diff visual contra
❖ MultiSelect del Kit:** estructura overlay + checkboxes + estados 1:1.
e2e: radio 6 campo y overlay, opción 7/10.5, selección reflejada.

### sc-group-popover
Port con la i18n DESACOPLADA de la app: las claves `common.*` del origen
pasan a diccionario colocado `sc.groupPopover.*` auto-registrado por el
componente (patrón establecido por el modal del molde); la demo monta
`provideTranslateService`. e2e: hover abre, lista limitada a 5, cola
«+N más». Fix de demo: `GroupRef` exige `id: number` + `active`.

### sc-column-selector
Port sin acoplamientos (CDK drag-drop ya es dependencia; persistencia por
`storageKey` del consumidor). e2e: popover, columnas listadas, radio 6.

### sc-confirmdialog (decisión §4.4 cerrada)
**Rename `sc-confirm-host` → `sc-confirmdialog`**: es un host 1:1 de
`p-confirmdialog` → regla pegado. El acoplamiento que justificaba el nombre
"host" desaparece al portar el servicio AL paquete: `ScConfirmService`
(+ `provideScConfirm()`, patrón del toast) conserva la API
`await request(): Promise<boolean>` y la matriz de tonos/énfasis de botonera.
Icono por el resolver (`exclamation-triangle` → warning Material): PrimeIcons
no forma parte del DS y el string `pi pi-*` del origen no renderizaría aquí.
e2e: abre con radio 12 (Kit dialog), accept/reject resuelven la Promise.

## Diferido al lote 3
- Los 5 comunes a convergir (inputtext, select, toggleswitch, dialog,
  checkbox) con las decisiones §4.1 (base checkbox) y §4.3 (API dialog);
  `ScDynamicDialogService` entra con dialog.
- Los 16 custom (Fase 3), los 4 solapes (Fase 4), `sc-datatable` (§6), Memory.
- El token REST de Figma caducado: renovarlo permite volver a exportar
  imágenes por nodeId sin plugin.

---

# Lote 3 — los 5 comunes a convergir (fusión de implementaciones)

## Método del lote
Fusión real (no adopción de un solo lado): por cada común se leyó la impl del
catálogo de diseño (chrome rico/CVA/tri-estado/card canónica) y la del molde
(wrapper fino con props PrimeNG extra), se eligió la base y se absorbió del
otro lado lo que aportaba capacidad. Apoyo de dos workflows:
1. **Comprensión** (5 lectores en paralelo) → specs de fusión por componente,
   con la decisión §4.1/§4.3 razonada.
2. **Revisión adversarial** (5 revisores) tras escribir → cazó pérdidas de API
   silenciosas y asimetrías de familia (ver "Fixes" abajo).
Diff visual por métrica computada contra el export del Kit (tokens:parity lo
cruza 1:1) + baselines. El Desktop Bridge de Figma se desconectó a mitad del
lote (reabrir el plugin es acción del operador); la referencia del Kit sigue
siendo el export que parity verifica, no se degradó el rigor.

## Decisiones por-componente cerradas

### §4.1 — sc-checkbox: base NATIVA tri-estado (no p-checkbox)
Base única = `<input type="checkbox">` nativo con el contrato tri-estado
`[state]` (none/some/all) + `(cycle)` del catálogo de diseño. Se DESCARTA
unificar sobre `p-checkbox`: su `indeterminate` es binario y no modela el
ciclo (clic en 'some' no puede expresar "primer clic limpia"); además sobre el
input nativo heredamos Space/Tab + semántica SR y reflejamos `indeterminate`
imperativamente (el DOM no lo permite declarativo). Del molde se absorbe
`inputId`. El slot `checkbox` del preset queda inerte (el componente no usa
`p-checkbox`). **Base verificada:** lectura de ambas impls + p-checkbox de
PrimeNG 21; e2e del ciclo some→none→all con `input.indeterminate`/`checked`
reflejados y `aria-checked=mixed`.

### §4.3 — sc-dialog: una sola card canónica + ScDynamicDialogService
UNA `sc-dialog` = la card canónica del catálogo de diseño (icono+título+
subtítulo+close, body, footer projection `[modal-actions]`, restauración de
foco), con `<p-dialog showHeader=false>` como motor (focus-trap/ESC/mask). Las
props útiles del wrapper fino del molde (`modal/position/draggable/resizable/
dismissableMask`) se absorben como passthrough; `visible` pasa a two-way
`model` conservando el `cancelled` semántico + outputs `shown`/`hidden`. El
caso imperativo (abrir un componente arbitrario al vuelo) NO se pierde: lo
cubre `ScDynamicDialogService` (+ `provideScDynamicDialog`), infra paralela
adoptada del molde tal cual — no un segundo componente. Omisiones deliberadas
del molde documentadas en el JSDoc (`header`/`showHeader` → la card; `closeOnEscape`
→ derivado de `closable`). **Base verificada:** e2e card two-way+ESC, radio 12,
header/footer; dynamic dialog abre componente y resuelve `onClose`.

## Piezas

### sc-inputtext
Base: impl de diseño (label/required/helper/error + CVA + filled + iftaLabel).
Suma del molde: `fluid`, `invalid` explícito (OR con error/touched), outputs
`focused`/`blurred` y `ariaLabel` (reincorporado tras la revisión). El
`variant:'filled'` del molde se pliega en el boolean `filled` (sin input
redundante). e2e: métrica 10.5/7/6/14, CVA, ifta, sm 12.

### sc-select
La impl de diseño ya era superset (showClear/filter/pTemplate/iftaLabel/
appendTo/opciones primitivas/CVA). Tras la revisión se añadió `readonly` +
outputs `focused`/`blurred` (paridad con sc-inputtext en la familia de campos)
y passthrough `optionDisabled`/`loading`. Panel sizes sm/lg co-localizados en
el SCSS (ViewEncapsulation.None) tokenizados a v/14. Handlers de focus/blur
tipados a `Event` (p-select reenvía el FocusEvent del DOM como `Event`).
e2e: overlay radio 6, opción 7/10.5, pTemplate re-proyectado, CVA.

### sc-toggleswitch
API estable del diseño (`[checked]`/`(checkedChange)`/ariaLabelledBy) + `size`
(sm/md/lg) y `readonly` (bloquea el emit sin el look disabled) del molde +
output nativo `changed` (reincorporado tras la revisión). `checked` relajado a
opcional. e2e: 35×21 del Kit, toggle emite, readonly no muta.

### sc-dialog + ScDynamicDialogService
Ver §4.3. Iconos via @smartcontact/icons (reconciliación §4.6); aria-label de
cierre por input `closeAriaLabel` (sin acoplar i18n de la app).

### sc-checkbox
Ver §4.1.

## Gap de tooling detectado (y cómo se cubre)
`npm run typecheck` (tsc `--noEmit`) NO chequea las plantillas Angular: un
error de tipos en un binding de template (p-select emite `Event`, no
`FocusEvent`) pasó el typecheck pero lo cazó `ng build` / el dev server / e2e.
El gate de CI corre `npm run build` (ng build de los 3 paquetes) ANTES del
typecheck, así que la red está cubierta; queda anotado que la verificación de
plantillas vive en el build, no en tsc.

## Diferido al lote 4
- Los 16 custom (Fase 3) con la deuda de aislamiento §5 restante.
- Los 4 solapes (Fase 4): variante de 8 colores de tag/chip, fallback de
  ilustración del avatar, section-card anidado (Section→Subsection→Slot),
  integración de dynamic-dialog ya hecha (solo queda el modal de negocio).
- `sc-datatable` (§6, hueco prioritario) y, según necesidad, accordion/
  breadcrumb/menu/stepper/tabs.
- Migración de Memory (resuelve `sc-bulk-transcription-modal`) y de las apps a
  paquetes versionados.
- Decisiones §4 restantes: §4.5 (API anidada de sc-section-card). Las §4.1,
  §4.2, §4.3, §4.4, §4.6 quedan cerradas.

## Diff visual con Figma — completado (bridge reconectado)
Tras reconectar el Desktop Bridge se cerró el diff visual en vivo de las 5
piezas contra el file canónico «Smart-Contact Prime» (capturas vía exportAsync
del plugin), confirmando el diff por métrica:
- **❖ Select** (6738:47281): trigger + chevron + overlay con buscador (lupa) y
  opciones, radio 6 — 1:1 con la demo.
- **❖ Checkbox** (6738:46504): checked = caja navy con check blanco; unchecked
  outlined; tamaños; filled — 1:1 (el tri-estado 'some' usa el mismo box con
  glifo de guión).
- **❖ ToggleSwitch** (6738:47576): off track gris / on track navy, handle
  blanco, tamaños — 1:1.
- **❖ dialog** (6872:72091): header con close X + body + footer (Cancel
  secundario + Save primario), radio 12 — 1:1 con la card canónica (que añade
  el icono+subtítulo de la variante SC).
- **InputText**: chrome de campo estándar; la métrica (10.5/7/6/14) ya estaba
  verificada y el chrome coincide.
Conclusión: el diff por métrica computada (la vara primaria) y el diff visual
con Figma concuerdan en las 5 piezas.

---

# Lote 4 — los custom «quick wins» (Fase 3, primer bloque)

Primer bloque del roadmap de la gran sesión (Lotes 4→9). Se portan los 8 custom
de bajo acoplamiento del catálogo de diseño + los 2 que componen la `sc-dialog`
canónica. `sc-icon` NO entra: ya está reconciliado en `@smartcontact/icons`
(§4.6), así que la Fase 3 es de 15 custom, no 16. inline-rename-cell se difiere
al Lote 8 (es el cell-renderer del datatable, su único consumidor).

## Método del lote
Adopción 1:1 del catálogo de diseño con el método innegociable por pieza:
1. **Token-existence + scale-sweep**: por cada `--sc-*` del SCSS se verificó que
   resuelve en el mirror (grep contra las capas de `design-tokens`). Resultado
   del lote: **cero tokens faltantes, cero scale-sweep, cero tokens inventados**
   — el catálogo de diseño ya emite en escala 14-base v/14, así que sus
   `--sc-spacing-*` (incl. `1-125`, `1-143`, `2-25`, `2-75`) ya existen aliasados
   a `--sc-scale-*` en el mirror.
2. **Desacople i18n**: los custom con copy/aria propios registran SOLO su
   diccionario colocado `sc.<x>.*` (patrón `sc-group-popover`), sin tirar de
   claves `common.*` de la app de origen. 7 de las 9 piezas necesitaron dict
   colocado (empty-state y page-header son i18n-driven puros → sin dict).
3. **Iconos** vía `@smartcontact/icons` (§4.6); nunca `pi pi-*`.
4. Demo en `sc-demo` + e2e (métricas `getComputedStyle` vs Kit + comportamiento).
5. Commit por pieza.

## Decisión §10 (auditoría de reutilización) — bespoke as-is
Para los 2 candidatos de la §10 (inline-rename-cell → `p-inplace`, photo-upload
→ `p-fileupload`) la decisión del operador fue **portar las impls bespoke tal
cual**: criterio «lo más migration-free + 1:1 con Figma, independiente de la
carga». Racional: las impls bespoke SON los componentes del catálogo de diseño
hechos contra Figma; reconstruir sobre los primitivos importaría el chrome
propio de PrimeNG (toggle de inplace, zona drag-drop, lista de ficheros) que NO
casa 1:1, y añade reescritura + riesgo de regresión. La reconstrucción §10 queda
**anotada como deuda opcional NO tomada**. (Aplica a los Lotes 5/8 donde caen
esas piezas; se registra aquí porque la decisión es del roadmap.)

## Piezas

### sc-empty-state
Adopción directa. i18n-driven puro (titleKey/bodyKey/ctaKey los resuelve el
consumidor) → sin dict. e2e: min-height 320 reservado, gap v/14 15.75
(`--sc-spacing-1-125`), icono circular 64², título 16/600, CTA condicional.

### sc-page-header
Adopción. i18n-driven puro. JSDoc alineado al chip 36×36 real del SCSS (el
origen decía 44 — drift de doc del experiment compact S59). Tipografía
subtitle-1 (16/600). e2e: chip 36², título 16/600, eyebrow uppercase, slot
`[page-header-actions]`, variante mínima.

### sc-form-section-nav
Nav controlado (padre posee `activeId`). Dict colocado `sc.formSectionNav.*`:
las 2 claves propias (aria del `<nav>` + del punto de error) se desacoplan; las
labels de sección las da el consumidor. Chip 28² default / 32² flush (Figma
índice). e2e: aria-current, punto de error, click controla, flush 32².

### sc-bulk-edit-menu
Compone `sc-select` (two-way value) + `p-button`. Dict colocado
`sc.bulkEditMenu.*`: las palabras de conexión de la frase «Cambiar…a…» + el
rótulo del grupo estaban hardcodeadas en español (la auditoría inicial las
había clasificado como decoupled, pero el chrome SÍ estaba hardcodeado). e2e:
2 selects, Aplicar habilitado por el effect inicial, commit con labels.

### sc-bulk-action-bar (+ useBulkEntityI18n)
Barra fija de selección. Desacople i18n completo: rótulo de región, del botón
limpiar y SUFIJOS por defecto («seleccionado/s») → `sc.bulkActionBar.*`. El
helper `useBulkEntityI18n` cambia sus defaults de `common.bulk.*` a
`sc.bulkActionBar.*` y comparte un `registerScBulkActionBarTranslations`
idempotente con el componente (resuelve los sufijos aunque el helper se use sin
montar el componente). e2e: resumen plural, acciones proyectadas, clear desmonta.

### sc-form-danger-zone
Compone `p-button` (severity danger outlined). Dict colocado
`sc.formDangerZone.*`: defaults de title/action pasan de `common.*`; la
descripción la da el consumidor (required). e2e: título, descripción, botón
dispara `action`.

### sc-sticky-form-header
**@deprecated / retenido** (rollback DD#65; ya no lo usa ningún form). Nombre
editable inline + Save (spinner vía `sc-icon [spin]`). `@ViewChild` →
`viewChild` signal. Dict colocado `sc.stickyFormHeader.*` (6 palabras de
acción/placeholder). e2e: el lápiz abre el rename inline, Save presente.

### sc-impact-preview-dialog
Compone la `sc-dialog` canónica (§4.3): badge + lista con pruning individual +
confirm de supervivientes. Dict colocado `sc.impactPreviewDialog.*` (aria de
quitar con param `{{name}}`, mensaje de vacío, defaults de botón;
confirmLabel/cancelLabel pasan a input opcional con fallback colocado).
**Desviación anotada**: se OMITE el bloque `::ng-deep .sc-impact-dialog
.p-dialog-*` del origen — era CSS muerto (nunca recibía `styleClass` y apuntaba
a la estructura del wrapper fino previo a §4.3; nuestra card pinta `.sc-dialog`,
no `.p-dialog-*`). El tamaño lo fija `width="520px"` sobre la sc-dialog. e2e:
abre, pruning 3→2, confirm emite 2.

### ScClipboardService + sc-delete-entity-dialog (§5 saldado)
`ScClipboardService` portado al paquete (autocontenido, solo DOM API,
`providedIn:'root'`) — **salda la deuda §5 del clipboard** sin acoplar paths de
app. El diálogo compone la `sc-dialog` canónica en 2 modos (single = retype del
nombre + copiar; bulk = chips quitables con reset). Dict colocado
`sc.deleteEntityDialog.*` (~13 textos, con params). **Decisión de diseño**:
`MessageService` (PrimeNG) se inyecta **opcional** (`{optional:true}`) — el toast
de «copiado» degrada si no hay infra de toast, en vez de obligar al consumidor a
proveerla. e2e: single (retype habilita Delete), bulk (pruning emite
supervivientes).

## Fix de robustez (test preexistente de lote 2)
`sc-multiselect` e2e (línea 376) usaba `getByText('Soporte')` global, que bajo
carga paralela (2 workers) casa la label del campo Y la opción del overlay aún
abierto → strict-mode violation (flaky; pasaba en aislamiento). Se acotó la
aserción a `.p-multiselect-label` (intención preservada, ahora determinista). No
es relajar un guardarraíl: el selector ambiguo era el defecto.

## Verificación del lote
`npm run verify` limpio (tokens:gen/parity/guard/type-parity, audit:theme-scale,
build de los 3 paquetes, typecheck, lint). `npm run e2e` **46/46 verde** (10
nuevos + 36 previos). La compilación de las 9 páginas demo (strict templates) la
valida el `ng serve` del e2e. Commit por pieza + CI de GitHub Actions verde tras
el push (gate real).

## Diferido a los siguientes lotes (roadmap Lotes 5→9)
- **Lote 5**: solapes de color/avatar — color-dot-picker + variante 8-colores de
  tag/chip (comparten `LABEL_COLORS`/`--sc-label-*`); photo-upload (bespoke
  as-is) + fallback de ilustración del avatar.
- **Lote 6**: superficie de comandos — command-palette + keyboard-shortcuts;
  **invertir `CommandPaletteService`** a API data-driven (el fuente arrastra
  `Router`/`NAV_SECTIONS`/rutas `/admin/*`/categorías ES — no se porta verbatim);
  `KeyboardShortcutsService` directo.
- **Lote 7**: section-card §4.5 (API anidada Section→Subsection→Slot, medición
  Figma en vivo) — cierra la última decisión §4 abierta.
- **Lote 8**: inline-rename-cell (bespoke as-is) + sc-datatable §6 (greenfield).
- **Lote 9**: Fase 5 — Memory (sc-bulk-transcription-modal) + adopción de apps a
  paquetes versionados.

---

# Lote 5 — solapes de color y avatar (Fase 4 §4.1 + §4.2)

## Context
Segundo bloque del roadmap. Cierra **2 de los 4 solapes**: §4.1 (tag/chip/
label-chip) y §4.2 (avatar). Porta 2 custom (`sc-color-dot-picker`,
`sc-photo-upload`) y extiende 3 componentes ya publicados (`sc-tag`, `sc-chip`,
`sc-avatar`) de forma **aditiva** — la rama/comportamiento de lote 1 queda
intacta (cero regresión por construcción).

Hallazgo clave: los **32 tokens `--sc-label-{color}-{bg,text,border,dot}` YA
EXISTÍAN** en `03-palette.css` (Mitad A). Cero trabajo de tokens. Mapeos del Kit:
`green`→emerald, `blue`→azure.

## §4.1 cerrada — variante `label` de tag/chip (retira sc-label-chip)
El `sc-label-chip` se **retira**: su sistema de 8 colores categóricos + punto se
mete como **variante** de los componentes canónicos. Nuevo tipo compartido
`LabelColor` + `LABEL_COLORS` (8: gray/red/orange/amber/green/teal/blue/purple)
en `core/types`, consumido por tag, chip y el dot-picker.
- **sc-tag** (read-only canon): `variant='label'` + `labelColor` → rama
  condicional que pinta punto + texto (outline), 8 colores vía custom props
  `--label-*` fijadas desde `labelColor`. Rama default `<p-tag>` **idéntica**.
- **sc-chip** (removable canon): misma variante + botón × (emite `removed`).
  `removeAriaLabel` como input (el consumidor traduce — sin infra i18n en un
  wrapper fino).
- **Base verificada**: e2e — red→red-50 bg/red-700 text/red-500 dot; azul→
  azure-50; × emite `removed`; los primeros tag/chip siguen siendo `<p-tag>`/
  `<p-chip>` (default intacto).

## §4.2 cerrada — fallback de ilustración en sc-avatar (retira illustrated-avatar)
**Decisión (operador)**: teniendo el `p-avatar` de PrimeNG, NO se porta
`sc-illustrated-avatar` como componente nuevo — su comportamiento se **funde** en
`sc-avatar` (cara Image). Nuevo helper compartido `core/avatar-illustration.ts`
(`hashName` DJB2 verbatim + `POOLS` illustrated(24)/abstract(3) +
`buildIllustrationSrc`) = **fuente única** que consumen avatar y photo-upload.
- `sc-avatar`: inputs `illustrationName`/`illustrationPool`/`illustrationBase` +
  getter `resolvedImage = image ?? path-hasheado` → `[image]` del p-avatar.
  Aditivo: sin image ni illustrationName → label/icon como en lote 1.
- **Decisión de assets**: el fallback necesita 27 SVG (**6 MB**, cada uno con un
  PNG base64). El paquete **NO los empaqueta** — expone solo la lógica con
  `illustrationBase` configurable (default `assets/avatars`); el consumidor sirve
  los SVG (la app AED ya los tiene). La demo copia solo el pool `abstract` (3
  SVG, ~1 MB) y las demos fijan `pool='abstract'` para que el hash resuelva.
- Hover-zoom del origen: **omitido** (flourish, no requisito §4.2) — anotado.
- **A11y (validación post-fusión)**: el `<img>` del `p-avatar` NO lleva `alt`,
  solo `[attr.aria-label]="ariaLabel"` (verificado en `primeng-avatar.mjs`). La
  fusión, tal cual, dejaba la ilustración **sin nombre accesible** cuando el
  consumidor no pasaba `ariaLabel` (el retirado `illustrated-avatar` usaba
  `role="img" aria-label="{name}"`). Corregido: getter `resolvedAriaLabel` →
  cuando se pinta la ilustración y no hay `ariaLabel`, el nombre ES el accesible
  name. e2e lo guarda (`aria-label="Inés García"`).
- **Base verificada**: e2e — avatar con `illustrationName` pinta `<img>` con src
  del path abstract hasheado + nombre accesible; los avatares de label/badge de
  lote 1 intactos.

## Piezas
- **5-1 sc-color-dot-picker**: port (ya signal-based: `input.required` +
  `model.required`); aria-label del radiogroup como input; no acopla la paleta
  (colores por `ColorDotOption.color`). e2e: 8 swatches, aria-checked, click two-way.
- **5-2 sc-tag** / **5-3 sc-chip**: ver §4.1.
- **5-4 sc-avatar** + helper: ver §4.2.
- **5-5 sc-photo-upload**: bespoke as-is (§10): input file nativo + FileReader.
  El fallback compone `buildIllustrationSrc`. `MessageService` **opcional**
  (toasts de validación degradan sin infra de toast). i18n colocado
  `sc.photoUpload.*`.

## Verificación del lote
`npm run verify` limpio. `npm run e2e` verde (5 specs nuevos + previos; re-run de
avatar/tag/chip de lote 1 → cero regresión). Commit por pieza + CI de GitHub
Actions verde tras el push.

## Diferido (roadmap Lotes 6→9)
- **Lote 6**: command-palette + keyboard-shortcuts (invertir `CommandPaletteService`).
- **Lote 7**: section-card §4.5 (API anidada, Figma).
- **Lote 8**: inline-rename-cell + sc-datatable §6.
- **Lote 9**: Memory + adopción de apps. Solapes restantes: §4(3) section-card
  (Lote 7), §4(4) dynamic-dialog ya hecho salvo el modal de Memory (Lote 9).

# Lote 6 — superficie de comandos (Fase 3 §5)

## Context
Tercer bloque del roadmap. Cierra la **deuda §5 de la superficie de comandos**
(no es decisión §4): `sc-command-palette` (⌘K) + `sc-keyboard-shortcuts` (?). El
trabajo real es **invertir** el servicio de la paleta a una API data-driven — el
único rediseño de servicio del roadmap, por eso aislado en su bloque.

El port se ancló en una fase de **grounding** (5 agentes read-only sobre el molde)
que confirmó el plan: el servicio del molde inyecta `Router` + `TranslateService`
y deriva los comandos de `NAV_SECTIONS` (rutas `/admin/*` + categorías
`'Páginas'|'Acciones'` hardcodeadas); el de keyboard-shortcuts es signal-puro de
27 líneas; `isTypingTarget` es DOM-puro de 13. **Scale-sweep nulo**: los SCSS de
ambos overlays usan tokens que ya existían (mismos componentes, mismo sistema de
tokens) — verificado pieza por pieza.

## Inversión de ScCommandPaletteService (data-driven)
El servicio deja de conocer la app: el consumidor entrega los comandos vía
`setCommands()`. API = `visible()` + `commands()` (readonly via `asReadonly`) +
`open/close/toggle/setCommands`. Interface `ScPaletteCommand {id, label, category,
icon?, keywords?, action}`. **Se STRIPea**: Router, TranslateService, NAV_SECTIONS,
el walk del árbol, las rutas `/admin/*` y las categorías ES. La navegación pasa a
`action` (callback del consumidor); los iconos a nombre Material directo.

### Refinamientos sobre el plan (3, todos hacia el split presentación/dominio)
1. **`category` = string de display provisto por el consumidor** (paralelo a
   `label`, ya traducido), NO una clave i18n del DS. Un dict de categorías fijo en
   el DS constreñiría la taxonomía del consumidor (supervisor usa Páginas/Acciones;
   otra app podría usar Archivos/Ajustes/Recientes). El DS solo i18n-iza su **propio
   chrome** (placeholder/empty/aria/hints).
2. **Sin indirección `NAV_ICONS`/`resolveIcon`**: `icon` es nombre Material que
   `sc-icon` resuelve directo (`resolveScIconGlyph` cae al literal si no existe →
   sin crash). El template usa `cmd.icon` tal cual.
3. **`sc-keyboard-shortcuts` inyecta `ScCommandPaletteService` directo** (sin el
   token de abstracción que sugería el grounding) — ambos son DS-owned,
   `providedIn root`, mismo paquete; el token era over-engineering para nuestro caso.

## Piezas
- **6-1 isTypingTarget**: `lib/core/utils/is-typing-target.ts`, port verbatim.
- **6-2 ScCommandPaletteService**: invertido (ver arriba). providedIn root.
- **6-3 sc-command-palette**: overlay buscable; keyboard ⌘K/`/`(enfoca `<sc-search>`,
  guardado por isTypingTarget)/Esc/↑↓(wrap)/Enter; i18n colocado `sc.commandPalette.*`;
  `viewChild` signal. e2e: abre, agrupa, ↓+Enter ejecuta, filtra por keyword, Esc.
- **6-4 ScKeyboardShortcutsService**: port directo (signal-puro).
- **6-5 sc-keyboard-shortcuts**: cheat-sheet `?`; grupos **data-driven** (`[groups]`)
  con default colocado exportado (`SC_KEYBOARD_SHORTCUTS_DEFAULT_GROUPS`) que cubre
  los atajos intrínsecos del DS (⌘K/`/`/`?`/↑↓/↵/Esc); el consumidor extiende con
  spread (sus ⌘S/⌘Z). `title`/`label` por `translate` (claves del default resuelven;
  strings del consumidor pasan tal cual). Fix de drift del molde: el JSDoc del fuente
  decía "no service is needed" pero sí inyecta el servicio — corregido en el port.

## Fixes de robustez (en la misma sesión, previos al lote)
- **sc-toggleswitch readonly** (lote 3): el wrapper exponía `readonly` y bloqueaba
  el emit del modelo en TS pero **no reenviaba `[readonly]` a `<p-toggleswitch>`** —
  PrimeNG toggleaba optimista la clase `.p-toggleswitch-checked` y el one-way
  `[ngModel]` la restauraba async (ventana de race que volvía flaky el e2e bajo 2
  workers). Fix: reenviar `[readonly]="readonly()"`. Mata el race de raíz, corrige el
  readonly a medias (sin flip visual ni `changed.emit` espurio) y conserva a11y
  (readonly solo guarda el onClick; el `<input>` sigue focusable/`role=switch`).
  Verificado e2e 153/153 en stress (`--repeat-each=3 --workers=2`).
- **CI Node 20→24**: bump `actions/checkout@v5` + `actions/setup-node@v5`
  (deprecación de Node 20 en runners, forzado el 16-jun-2026). Inputs sin cambio.

## Verificación del lote
`npm run verify` limpio. `CI=1 npm run e2e` verde (2 specs nuevos + previos).
Commit por pieza + CI de GitHub Actions verde tras el push.

## Diferido (roadmap Lotes 7→9)
- **Lote 7**: section-card §4.5 (API anidada, Figma). **Lote 8**: inline-rename-cell
  + sc-datatable §6. **Lote 9**: Memory + adopción de apps (modal de transcripción
  presentacional + pipeline de publish versionado).
