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

*(entradas C en construcción — se completan en el bloque C)*
