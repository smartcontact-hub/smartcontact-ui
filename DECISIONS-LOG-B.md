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
