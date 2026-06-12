# DECISIONS-LOG — Construcción del repo espejo (Mitad A)

> Registro de la sesión de construcción: cada decisión tomada y cada desviación
> del plan, con su porqué y su base verificada. Guion de la sesión:
> `docs/mirror-repo-master-prompt.md` (pre-flight + manifiesto como fuentes de
> decisión). Una entrada por decisión, en orden de aparición.

## Convenciones

- **Base verificada** = qué se leyó/ejecutó para decidir (fichero, export, comando).
- Las decisiones cerradas del pre-flight §1 no se re-litigan; aquí van solo las
  decisiones del ejecutor y los flecos no previstos.

---

## A. Esqueleto

### A1 — El molde vive en `~/dev/smartcontact-ui-main`, no en `~/Downloads`
El prompt maestro apunta a `~/Downloads/smartcontact-ui-main`; esa ruta no
existe. La carpeta añadida a la sesión es `~/dev/smartcontact-ui-main` con el
contenido esperado (4 projects, preset modular, skills).
**Base verificada:** `ls` de ambas rutas; estructura cotejada con pre-flight §2.

### A2 — Paquete de iconos copiado verbatim del molde
`@smartcontact/icons` se adopta tal cual (decisión cerrada: el suyo es más
maduro). La reconciliación con nuestro `sc-icon` (ejes FILL/wght/opsz) toca la
API de un componente del catálogo → **diferida a Mitad B** con el resto de
componentes, anotada en el plan de port.
**Base verificada:** árbol de `projects/ui-smartcontact-icons/` (generador de
codepoints + sc-icon propio del paquete).

### A3 — `public-api` de `@smartcontact/components` recortado a fundaciones
El public-api del molde exporta 25+ wrappers que en Mitad A no existen. Se
recorta a `provideSmartContactUi` + `scPreset`. Los tipos públicos
(`lib/core/types`) y el `sc-component-icon-resolver` son superficie de los
wrappers → viajan con ellos en Mitad B (manifiesto §5.a).

### A4 — `export:*` portados a Node
Los 4 scripts PowerShell (`New-Item … | npm pack`) se sustituyen por
`scripts/export-package.mjs` (mkdir recursivo + `npm pack` por proyecto).
Mismo flujo `ng build → npm pack → dist/archives`.
**Base verificada:** scripts literales del `package.json` del molde.

### A5 — `sc-demo` arranca como shell mínimo (fundaciones + smoke de tema)
El sc-demo del molde tiene ~18 páginas de docs que renderizan SUS wrappers —
imposibles sin portar componentes (fuera de alcance). Se construye un shell
con la misma estructura (app standalone, rutas hash, `provideSmartContactUi()`)
y dos páginas: **Fundaciones** (tokens reales vía `var(--sc-*)`) y **Tema
PrimeNG** (primitivos `p-button`/`pInputText`/… sin wrapper, estilados solo por
el preset). La segunda es además el banco de pruebas del e2e smoke: si el botón
pinta 10.5/7/radio 6, el puente `--p-*`→`--sc-*` está vivo. El doc-site con
cara completa se puebla en Mitad B al portar componentes.
ngx-translate queda como dependencia (los wrappers suyos la traen como peer)
pero el shell no monta i18n todavía — sin contenido que traducir, sería
andamiaje especulativo.

### A6 — Repo GitHub privado `smartcontact-ui`
El pre-flight no fija visibilidad; al ser referencia interna del DS con docs de
proceso, se crea **privado** (cambiarlo a interno/público es un click).

---

## B. Escala y generador único

### B1 — Las referencias del export DTCG son con PUNTO, no con slash
El prompt maestro describe «referencias estilo Figma con slash
(`{color/gray/800}`)». El export real (`kit-export-dtcg-s76.json`, plugin
`primeui-figma-plugin-v4`) usa **punto**: `{scale.0-5}`,
`{form.field.padding.x}`, `{blue.500}`, con los GRUPOS en claves slash de
primer nivel (`aura/primitive`, `aura/semantic/common`…). El generador y parity
resuelven ese formato real.
**Base verificada:** dump programático del JSON (grupos, `$value`, `$type`).

### B2 — Mapa de familias Kit ↔ tokens SC (verificado por valor)
`slate` del Kit = nuestro `--sc-color-gray-*` (`#f7f8fa…#0b0f14` idéntico);
`sky` del Kit = nuestro `--sc-color-electric-blue-*` (`#1464fe`); `blue` del
Kit = nuestro navy 1:1. El surface light del Kit referencia `{slate.*}` y el
dark `{zinc.*}`.
**Base verificada:** comparación programática export ↔ `01-primitive.css` ↔
`base.ts` del molde.

### B3 — Conversión a rem EN EL GENERADOR (el "punto único")
Decisión cerrada: rem centralizado. El molde lo hace en dos capas (preset
`normalizeDesignRem` + aliases `/16*1rem`). El generador único lo centraliza:
los bloques generados de `01-primitive.css` emiten **rem** (`px diseño / 16`)
con el px de diseño en comentario — `--sc-scale-1: 0.875rem; /* 14px */`. La
ley de naming v/14 no cambia (el nombre deriva del px de diseño del export).
Todos los pasos 14-base con cuantos de 0.25px dividen exacto entre 16 → cero
pérdida. `rem-scale.ts` se adopta además en el preset para los literales rem
que queden en módulos (autoría design-rem del molde).

### B4 — `--sc-radius-full: 9999px` se queda en px
Es un clamp para pills (no una métrica que deba escalar con zoom). El resto de
radios del Kit (0–12) se emiten en rem como la escala.

### B5 — Extras de escala reducidos a `0`
El export S76 ya trae `scale.1-25` (17.5) y `scale.2-5` (35) que antes eran
extras documentados. Solo queda el extra `0` (reset, no es paso métrico).
**Base verificada:** dump del grupo `aura/primitive/scale` (33 pasos).

### B6 — El barrido `--sc-spacing-*`/`--sc-space-*` → `--sc-scale-*` queda resuelto estructuralmente
En Mitad A no se porta ningún wrapper, y el paquete de styles nuevo **no
contiene** ni la escala 8-point (`--sc-spacing-50/100/200…`) ni los aliases
`--sc-space-*` del molde — solo `--sc-scale-*` + los aliases v/14 nuestros
(`--sc-spacing-1` = `var(--sc-scale-1)`, API preservada). Cualquier wrapper que
llegue en Mitad B consumiendo nomenclatura 8-point no resuelve y se detecta:
regla del guard + token inexistente.

### B7 — Generación de tokens semánticos/de componente NO se automatiza
`convert-tokens.js` del molde regenera TODO el CSS desde tokens.json; nuestras
7 capas son curadas (semántica más rica, customs documentados). Del molde se
funde el **import DTCG** (parseo + resolución de referencias); la emisión
total de ficheros se sustituye por zonas generadas (`@sc-gen:*`) + **parity**
que cruza lo curado contra el export. Mismo resultado (cero drift verificable
por máquina) sin pisar la capa curada. Las ~20 ramas muertas (bloques
`font-size` repetidos) no se portan.

### B8 — Drift heredado corregido: `--sc-toast-gap-actions` apuntaba a un token inexistente
La capa 04 traía `var(--sc-spacing-100)` (naming 8-point que nunca existió en
las capas v/14): la propiedad no resolvía. Se repunta a `var(--sc-scale-0-5)`
(7px, coherente con los demás gaps del toast). Afecta al render del toast
cuando se porte en Mitad B (antes el gap caía a valor inválido).
**Base verificada:** grep de `--sc-spacing-1xx` en las 7 capas (cero
declaraciones).

### B9 — Barrido de px de la capa 04 a tokens de escala
Todos los px metricos de 04-component que caen exactos en la escala
(17.5/7/28/350/10.5/15.75/24.5/12.25/14) pasan a `var(--sc-scale-*)` —
trazabilidad sin cambio visual. Quedan en px: 3 font-size raw del Figma
(dialog-title 17.5, toast summary 14 / detail 12.25 — el stream tipográfico
DD-13 los reconciliará al portar esos componentes) y el blur 1.5px (efecto, no
métrica).

### B10 — Focus ring unificado en 2px
`01-primitive.css` declaraba `--sc-focus-ring-width: 1px` pero el preset
renderizaba `2px` (divergencia consciente a11y, customs §1.1) y el token no
tenía ningún consumidor. Se unifica el token en 2px y el preset pasa a
referenciarlo (`var(--sc-focus-ring-width)`) — una sola fuente. Sigue en px:
es un hairline de outline, no una métrica tipográfica.
**Base verificada:** grep de consumidores en packages/ y apps/ del repo origen
(solo la declaración).

---

## C. Preset

### C1 — Los módulos por-componente del molde YA estaban convergidos al Kit
Sorpresa verificada: los valores design-rem de los módulos (divider 14/7,
tooltip 7/10.5/175, tabs 14/15.75 y 12.25/15.75, toggleswitch 35/21/3.5/14/7)
son exactamente los del export S76 multiplicados ×14. Nuestros overrides del
preset monolítico coinciden con lo que ya había — el port consistió en
**tokenizar**, no en corregir valores.
**Base verificada:** codemod ×14 contra la tabla de escala del export +
cotejo de `toggleswitch.*` y `button.*` en `aura/component/common`.

### C2 — Codemod design-rem → `var(--sc-scale-*)` sobre los 82 módulos
Todo literal rem de los módulos cuyo px de diseño (rem×14) cae exacto en la
escala del Kit pasa a token: 392 reemplazos en 65 ficheros, render idéntico.
Lo que queda en rem son valores fuera de escala (hairlines 1/2px, restos
8-point 4/8/20px de su autoría, blur/sombras) que `normalizeDesignRem`
(mecanismo adoptado, `rem-scale.ts`) sigue convirtiendo design-rem→browser-rem.

### C3 — `base.ts` reescrito: familias recortadas a las referenciadas
El base del molde declara 22 familias primitivas en hex; los módulos solo
referencian 10 (`red, sky, blue, slate, zinc, amber, green, purple, orange,
yellow` — grep exhaustivo). Como la doctrina prohíbe consumir `--p-*` fuera
del preset (regla del guard), la superficie `--p-<familia>-*` no es contrato:
se declaran solo las 10 con `var(--sc-color-*)`. Remapeos de marca (los del
preset monolítico): orange→amber y yellow→amber (warn de marca), sky→
electric-blue y slate→gray (que en el Kit ya SON esos valores, verificado por
hex). `zinc` se añade a la capa 01 como bloque generado del export.

### C4 — colorScheme dark = mismos tokens semánticos que light
Doctrina nuestra: el dark vive en la capa 7 (`.sc-dark` redeclara `--sc-*`).
El `colorScheme.dark` del preset referencia los MISMOS `var(--sc-*)` que
light (como hacía el preset monolítico) en lugar del zinc-dark del Kit
(divergencia de marca consciente ya documentada: dark navy-tinted).
`highlight` no tiene token semántico: se porta la receta Aura/Kit
(`#34d39929`) como `color-mix` sobre `--sc-color-emerald-400` (hex verificado
= emerald-400; alphas 0x29/0x3d/0xde ≈ 16 %/24 %/87 %, redondeo <0,5 % de
alpha). Sin hex en base.
**Pendiente Mitad B:** validar el dark de listas/highlight en pantalla cuando
haya componentes que lo rendericen.

### C5 — `extend.ts`: `app.control` retirado; line-height de control md = 21
`app.control.*` traía las métricas 8-point de su Figma antiguo (paddings 12/5,
alturas 33) que CHOCAN con el Kit (10.5/7, iconOnly 35). Sus consumidores
(formField en base, `button.iconOnlyWidth`) apuntan ahora a los tokens del Kit
(`scale-0-75/0-5`, `scale-2-5/2/3` — claves `form.field.*` y
`button.icon.only.width` del export). `app.typography` queda (alimenta el CSS
central de css.ts) con fuentes redondas DD-13 (12/14/16 vía
`--sc-font-size-*`) y line-heights 18/21/24: la de control md es **21**
(`--sc-scale-1-5`, control = 14×1,5), no la 20 del cuerpo — es lo que cuadra
la altura md con `iconOnlyWidth = scale.2-5` del Kit. sm/lg usan
`--sc-line-height-100/300` (18/24, emparejamiento del Kit).

### C6 — Comentarios del preset sin unidades literales
El auditor de escala cuenta cualquier `px`/hex del fichero, comentarios
incluidos. Los comentarios de base/extend se redactan sin `Npx` ni `#hex`
para que "cero px en preset" sea un grep limpio sin allowlist.

---

## D. Setup

### D1 — `provideSmartContactUi` con `darkModeSelector: '.sc-dark'`
Decisión cerrada aplicada tal cual (el molde traía `'none'`). Un solo
interruptor: la clase que flipa los `--sc-*` (capa 7) es la misma bajo la que
PrimeNG emite su scheme dark.

---

## E. Guardarraíles

### E1 — `tokens:parity` evalúa el preset REAL, no lo parsea con regex
El parity de origen parseaba el preset monolítico con regex de llaves. Con el
preset modular eso se rompe (valores repartidos en 85 ficheros con `{refs}`
cruzadas). El nuevo parity **transpila los módulos TS (compilador del repo) y
ejecuta `sc-preset/index.ts`** — incluido `normalizeDesignRem` — y resuelve
cada slot contra capas CSS (`var(--sc-*)` → px/hex) y árbol del preset
(`{a.b.c}`). Cruza 53 valores de sizing valor↔valor contra el export: 53/53
en verde, y cubre más que el original (añade toggleswitch, gutter del
tooltip, rounded del botón, paddings de overlay).

### E2 — La allow-list de drift tipográfico DD-13 desaparece
El export S76 ya trae la tipografía redonda (12/14/16): los 4 font-size que en
origen estaban en `KNOWN_TYPO_DRIFT` (preset redondo vs export decimal) ahora
cruzan limpios. Verificado: `form.field.sm.font.size` → 12 = token.

### E3 — `dark.primary.contrast.color` pasa a divergencia consciente
Kit dark: contraste sobre primario = zinc-900; nuestro dark es gray-900
navy-tinted — la MISMA divergencia documentada del surface dark. Se mueve de
enforce a la lista de divergencias (donde ya estaba surface.*).

### E4 — Guard adaptado: regla nueva anti-8-point
A las reglas duras de origen (solo el preset toca `--p-*` · componentes usan
el alias `--sc-spacing-*`, no la primitiva · campos PrimeNG solo vía wrapper ·
font-size solo por token) se añade la regla que cierra la convergencia de
escala por construcción: `--sc-space-*` y `--sc-spacing-50/100/200…` (8-point)
prohibidos en todo el repo. Excepción documentada de la regla de wrappers: la
página `sc-demo/pages/theme` usa primitivos PrimeNG crudos a propósito (es el
smoke del preset).
Se añadieron además los aliases `--sc-spacing-12-5/18/25` que faltaban (pasos
grandes del Kit sin alias semántico — completan el 1:1 escala↔alias).

### E5 — e2e smoke verifica la métrica RENDERIZADA
Playwright contra la demo: botón md computa 10.5/7/radio 6/font 14 y el form
field 10.5/7/6 (getComputedStyle — el puente entero tokens rem → preset →
--p-* probado en navegador), la escala resuelve (barra de `--sc-scale-1` mide
14px) y `.sc-dark` flipa el fondo. Es la prueba de que el rem centralizado
renderiza idéntico al px de diseño.

### E6 — Gate de CI en GitHub Actions
`.github/workflows/ci.yml`: tokens:gen + parity + guard + type-parity (stream
Figma) · audit:theme-scale (stream preset) · lint (ESLint flat config nuevo,
el molde no traía linter) + typecheck (tsc por proyecto) · build de los 3
paquetes + demo · e2e smoke. `npm run verify` agrupa los checks estáticos en
local.

---

## F. Documentación

### F1 — Adaptación con las convenciones unificadas
Portados y adaptados al repo: DECISIONS.md (DD-* íntegros), customs-catalog.md,
migration-safety.md, guía de tokens (README técnico del paquete en inglés +
docs/guia-tokens.md en español), manifiesto de convergencia (framing
comparativo retirado: §11 reescrito como "qué aporta cada origen"),
foundations-rationale.md (destilado del pre-flight, sin mandatos operativos de
sesión) y component-port-plan.md (Mitad B accionable). AGENTS.md + PROMPTS.md +
las 9 skills del pipeline portados con: naming pegado DD-12 en reglas y
componentes de referencia, regla `/16` eliminada (tokens ya en rem; consumo por
alias `--sc-spacing-*`), drift `sc-palette.ts` corregido (la alineación vive en
`theme/sc-preset/base.ts`), tooling de parity como paso obligatorio, flujo
sync-theme reescrito sobre el export DTCG + `tokens:import`, y bloques
PowerShell→bash. Sin nombres de personas ni de librerías de plantillas de
origen; sin artefactos internos del repo origen (MEMORY/SESSION-LOG/CLAUDE.md
— el repo genera los suyos).

### F2 — Dos lotes de adaptación se rehicieron a mano
Dos subagentes de documentación murieron por límite de uso a mitad de tarea;
migration-safety.md y 6 de las 9 skills se completaron directamente,
verificando después todo el árbol de docs con greps de tono (personas,
librerías de origen, "Codex") y de enlaces rotos: limpio.
