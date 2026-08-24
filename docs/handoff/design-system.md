# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-24 — HEAD `a275686` (s33: el TypeScript de la raíz y de `e2e/` entra en `typecheck`) sobre HEAD `242598d` (s30+s31: navbar de sc-docs · teclado del palette · DD-40 primary dark · red de contraste ampliada · desfase export↔Figma · el guardián de reutilización del dev server). Contenido previo: `59a5c73` (s29).**


## ✅ s33 — el TypeScript de la raíz y de `e2e/` entra en `typecheck` (`a275686`)

**Ningún `tsconfig` del repo incluía la raíz.** Los de apps y libs arrancan todos en
`projects/*/src`, así que **33 ficheros no los type-checkeaba nadie**: los cuatro
`playwright*.config.ts`, `eslint.config.js` y los 28 de `e2e/`. Y `eslint` no tapa ese hueco
porque no reporta errores de tipo.

Por ahí pasó en s32 un `reducedMotion: 'reduce'` suelto en el `use` de
`playwright.cuscare.config.ts` —en Playwright 1.60 va dentro de `contextOptions`—: error de tipo
real, `verify` entero en verde y la suite de CusCare inestable bajo carga. El caso concreto ya lo
cubría `e2e/cuscare/harness.spec.ts` (comprueba el estado EN LA PÁGINA); lo que quedaba abierto
era la clase.

- **`tsconfig.harness.json`** (nuevo), encadenado en el script `typecheck` → entra en `verify` y
  en el CI. **No añade eslabón a la cadena**: extiende un gate que ya estaba, así que `verify`
  siguen siendo **26 gates** y las 4 cifras sin gatear (`CLAUDE.md`, `DOCS-INDEX`,
  `AUDIT-SEMANAL`, `SKILL.md` de la rutina) **no se tocan**.
- **Nace en verde, medido ANTES de escribirlo**: 0 errores sobre los 33 ficheros tal cual estaban.
- **`include` por PATRÓN** (`*.ts`, `*.js`, `e2e/**/*.ts`): un `.ts` nuevo en la raíz o en `e2e/`
  entra solo, sin que nadie se acuerde.
- **`allowJs`/`checkJs`** por `eslint.config.js`: su `// @ts-check` de la primera línea **no hacía
  nada**, porque el fichero no estaba en ningún programa de TypeScript.
- **Validado en ROJO en sus tres ejes**, no solo en verde: con el bug histórico reinsertado,
  `npm run typecheck` sale con **exit 2** y `TS2769 «'reducedMotion' does not exist in type
  'UseOptions<…>'»`; con un error de tipo en `eslint.config.js`, `TS2339`; con otro en
  `e2e/smoke.spec.ts`, `TS2322`.
- **`scripts/__tests__/typecheck-coverage.test.mjs`** (nuevo, 7 casos dentro de `test:unit`) protege
  la **clase**, no la instancia: recorre el repo y falla si aparece un `.ts` que no mira ningún
  tsconfig. El patrón cubre ficheros nuevos en sitios conocidos; el test cubre un **directorio
  nuevo de primer nivel** (`tools/`, `bench/`), que es exactamente cómo nació el hueco. Su verde
  **no es vacuo**, comprobado: quitando `e2e/**/*.ts` del `include`, señala los 28 huérfanos.

**Fuera a propósito, con la cifra medida antes de decidirlo:**

| Qué | Errores con `tsc` | Por qué queda fuera |
|---|---|---|
| `code-connect/**.figma.ts` | **17** | No son código: son PLANTILLAS que evalúa el CLI de Code Connect (módulo `figma` virtual + globales `_fcc_*` que inyecta el parser y no declara ningún `.d.ts`). Su gate es `npm run figma:connect:parse` —verificado en verde tras el cambio— y `eslint.config.js` ya los ignoraba por lo mismo |
| `scripts/**/*.mjs` | **392** con `checkJs` | JS sin anotar (casi todo TS7006, "implicitly any"). Anotarlos es otra tarea, no un efecto colateral de esta; hoy los cubren `test:unit` y `eslint` |

⚠️ **"Fuera del `include`" no es "fuera del programa", y se vio el mismo día.** El guardián de
reutilización del dev server (`scripts/playwright-reuse-guard.mjs`, de s31) lo IMPORTA
`playwright.config.ts` — y con eso entra en el gate de tipos aunque `scripts/` esté fuera del
`include`: 3 errores (TS7006 ×2 y un TS2339 en el `catch`, que TypeScript tipa como `unknown`).
Se arreglaron con **JSDoc en el script**, que es lo correcto: si un config type-checkeado depende
de él, su firma es parte del contrato. Si mañana añades un import así y no quieres anotarlo, la
decisión se toma en `tsconfig.harness.json`, no con un `@ts-nocheck` a escondidas.

**Doc corregida donde afirmaba lo contrario** (quedaba falsa al aterrizar esto): la fila «Tipos +
lint» del README —que estaba **vacía**—, el comentario del propio `playwright.cuscare.config.ts`,
la trampa de `docs/handoff/cuscare.md` y el corolario s32 de `LEARNINGS.md`.

---

## ✅ s31 · Accesibilidad: el primary dark y el agujero de la red de contraste

**DD-40** — el par `--sc-text-on-primary`/`--sc-bg-primary` en `.sc-dark` medía **3,01:1**.
Llevaba desde junio aparcado en `A11Y_KNOWN` con una razón **falsa**: decía que «ni gray-900 ni
blanco llegan a AA sobre blue-400», y el blanco sí llega (5,62). Lo que de verdad lo bloqueaba no
era la base sino la rampa: con blanco no hay hover ni active legales (aclarar sale de la banda,
oscurecer hunde el relleno bajo el 3:1 de 1.4.11). Única salida: **subir la rampa un paso**
(`blue-300/200/100`, texto sin tocar) → **5,05 / 8,03 / 11,89** en los dos criterios.

- Las tres filas `primary.*` de dark pasan a **`diverge`** en `color-map.mjs`. Como eran lo único
  que el dark recibía del Kit, **la zona `@sc-gen:semantic-color-dark` queda VACÍA** y el dark
  pasa a estar 100% curado a mano. La cabecera de la zona lo dice, para que se lea como dato.
- **`A11Y_KNOWN` queda vacío**; §6b va de 21/22 a **22/22**.
- Arregla de rebote la **barra de sc-docs en oscuro** (la que se veía negra sobre oscuro) y el
  **skip-link** del supervisor.

**La red de contraste miraba solo la vista enrutada.** `theme-contrast.spec.ts` recorría
`main#main-content`, y el skip-link, la `sc-sidebar` y la `sc-top-bar` son **hermanos** de
`<main>`: el marco de la app no lo miraba nadie, en ningún tema. Raíz ampliada a `body`. Salieron
tres defectos más, arreglados: `sidebar__section-title` y `sidebar__decisions-label` (TEXTO de
12 px → umbral 4,5, alpha a `0.5`), el `mock-sample-switcher` (pastilla ámbar clara sin variante
oscura) y antes los chevrones (`0.3`→`0.4`, commit `b3a0fdf`).

**Segundo fallo de la red, del signo contrario**: su filtro de visibilidad hacía
`cs.opacity === '0'` mirando solo al elemento, y `opacity` no se hereda como valor computado —
un span dentro de un ancestro a 0 se colaba como visible. Ahora sube por la cadena. Y como eso
dejaba sin medir la sidebar (invisible en reposo), se añade **un test por tema que la despliega y
mide con hover**, que es medio punto peor que el reposo. 125 → **127** tests.

**sc-docs · swatches de fundaciones**: hover/foco abre una tarjeta con token, hex y HSL, y cada
línea se copia (vía `ScClipboardService`). Los tres valores salen de `getComputedStyle`, no de
una tabla a mano.

⚠️ **Trampa que costó cinco rondas**: `ng serve` sirvió CSS **viejo** mientras el fuente,
`dist/design-tokens` y `ng build` estaban los tres correctos. Los e2e daban rojos
irreproducibles. **Para medir color/contraste, sirve el build estático y apunta con
`SC_SUPERVISOR_URL`** — ahí pasó de 5 fallos fantasma a **53 verdes**.

**Pendiente (no bloquea)**: pedirle al Kit un primary dark conforme — luminancia relativa entre
**0,136 y 0,183**, apuntando al centro de la banda y no al canto. Es la salida durable; el día
que llegue, esto se revierte devolviendo tres filas a `enforce`.

---


## ✅ s30 — tres cosas, el mismo día, ya en `main`

Salieron en cadena: **A** es lo que se pidió, y **B** y **C** son hallazgos de paso de A que se
resolvieron en su propio worktree y se mergearon después (`974c827`).

### A · sc-docs: la barra baja de 7 destinos planos a 4 secciones (`dcad8e2`)

Fundaciones, Tipografía y Tema PrimeNG gastaban tres huecos de primer nivel para la misma cosa
—36/51/40 líneas de plantilla—; se agrupan bajo **`/fundamentos/*`** con pestañas, y Lab y el
interruptor de tema salen de la nav a un cluster de herramientas. Medido a 1280px: lo ocupado
**966 → 670px**, la nav **624 → 364**; por debajo de 1000px la nav se desliza y el body no
desborda. Las rutas viejas **redirigen, con test**: sin él `/#/foundations-type` no daba 404, te
mandaba **en silencio** a otra página. Otro gate fija la barra en cuatro destinos.

- **Fuera el `opacity: 0.72`** de los inactivos: en oscuro los dejaba en **2.29:1**. Al medirlo
  salió lo de C (ver abajo).
- **El interruptor se queda con TEXTO**: `<sc-icon>` en el shell *eager* mete **+127 kB** en
  `main.js` (573,85 → 701,15 kB) y revienta el presupuesto de bundle por un glifo decorativo.
  Dentro de las páginas, que son lazy, `sc-icon` sí sale gratis.
- La **portada de `/components`** deja de repetir la lista entera (era la tercera copia de la
  misma navegación en pantalla) y ofrece un salto por familia.
- **Tres gates hubo que arreglarlos de paso.** `eslint` entraba en el `dist/` de los worktrees de
  agente (en flat-config `dist/` está anclado a la raíz → `**/dist/` + `.claude/`); el test del
  palette ataba una aserción de teclado a la geometría (→ B); y `screenshotBaseline` capturaba la
  sidebar con su scroll en dos estados (**exactamente 4912 px** de diff siempre, firma de
  bistabilidad, no de ruido) → se fija a 0 antes de capturar. **Las 39 baselines visuales van
  regeneradas: ya estaban desfasadas en `HEAD` antes de tocar nada** (esperaban 2507px de alto y
  la página rinde 2497).

### B · `sc-command-palette` (teclado) + el alcance real de `preflight`

Dos defectos de teclado en `sc-command-palette`, los dos **medidos antes de tocar nada** y
arreglados con su gate (`87abad5`):

1. **El resaltado inicial dependía de dónde hubiera quedado el ratón.** Con `(mouseenter)`, abrir el
   overlay bajo un puntero PARADO disparaba el hover: con el cursor sobre el ítem 3, el activo al
   abrir era «Usuarios» y ↓+Enter ejecutaba «Crear grupo». Como la paleta se abre sobre todo por ⌘K,
   la primera flecha partía de un sitio que el usuario no eligió. **El mecanismo, medido:** al
   aparecer un elemento bajo un puntero quieto el navegador dispara `mouseover` y `mouseenter` pero
   **NO** `mousemove` ni `pointermove` → basta `(mouseenter)` → `(mousemove)`, sin flag de estado.
2. **Las flechas movían el resaltado pero no la vista.** Con la ventana a 1280x400, `scrollTop` se
   quedaba en 0 las cinco pulsaciones y desde la tercera el activo caía **3, 78 y 112 px** por debajo
   del borde visible → ↓+Enter ejecutaba un comando invisible. Añadido
   `scrollIntoView({block:'nearest'})`, **casando el índice por `id`**: `highlighted` indexa
   `filtered()` y el DOM se pinta desde `grouped()`, así que con categorías intercaladas los dos
   órdenes dejarían de coincidir (ningún consumidor de hoy intercala — trampa latente, anotada).

Los **dos gates nuevos** (`components.spec.ts`) están validados en los DOS sentidos: rojos contra el
componente sin arreglar, con los valores exactos medidos. El primero, en su primera versión, pasaba
**en verde contra el código roto** porque leía el resaltado antes de que llegara el evento; ahora
espera a confirmar que el `mouseover` llegó y solo entonces afirma.

**Y de ahí salió lo otro (`649240d`): `preflight` no corría `components.spec.ts`.** Su sustitución
local cambiaba `npm run e2e` por `e2e:structure` — **1 test en vez de 68**, dejando los 56 de
`components.spec.ts` fuera del gate de pre-push. El motivo escrito (los screenshots de `sc-card` y
`sc-message` fallan siempre en macOS) resultó ser sorteable: son `screenshotBaseline()`, que hace
**no-op con `CI=1`**. Hoy la sustitución es `npm run e2e` → `CI=1 npm run e2e`, y el test del gate
lleva el caso inverso para que la vuelta atrás salte.

### C · El chevron de la sidebar cumple 3:1 (`b3a0fdf`)

El chevron **no es decorativo**: cambiar `chevron-right` por `chevron-down` es la ÚNICA señal de
que un item tiene hijos y de si está abierto, así que le aplica WCAG 1.4.11 a 3:1. Estaba en
`rgb(255 255 255 / 0.3)` y **no llegaba en ninguno de los dos temas** — un alfa blanco se aclara
al mismo ritmo que el fondo de detrás, así que el navy oscuro no lo rescata. Medido en el estado
vinculante (sidebar abierta por hover, fila bajo el puntero, medio punto peor que en reposo):
claro **2,57 → 3,42**, oscuro **2,71 → 3,80**. Alpha 0.3 → 0.4.

**No lo cazó ningún gate, por dos motivos anotados en el fichero:** la sidebar es HERMANA de
`<main>` y `theme-contrast.spec.ts` solo recorre `main#main-content`; y `tokens:parity` no ve un
literal que no pasa por ninguna variable.

⚠️ **Esto no cerraba el contraste** — lo que disparó la investigación era el par
`--sc-bg-primary`/`--sc-text-on-primary` a **3,01:1** en oscuro, el contraste primario del preset
(`base.ts`) y por tanto el botón primario de toda la plataforma. **Cerrado en s31** (arriba,
DD-40): la razón de marca que lo bloqueaba resultó apoyarse en un dato falso, y `07-dark.css`
resultó ser zona `@sc-gen` **solo para los tres `--sc-bg-primary*`** — el token de texto ya vivía
fuera. Se resolvió divergiendo esas tres filas en `color-map.mjs`, no editando la zona.

---

## s29 (previo) — Figma + casar preset

Sesión de dos mitades. **(1) Figma:** se revisaron 6 componentes + Table cruzando el master
contra la **web en vivo** (chrome-devtools) y se **tokenizó** tamaño y line-height del texto de
componente. **(2) Código (nuestro repo):** medido que **nuestro sc-docs ya casaba** con Figma casi
entero —lo desviado era producción (Carlos)—; se **casó lo que faltaba** en el preset (`css.ts` +
`extend.ts`) con la **unificación de line-height** (md 21→20), **verificado en sc-docs con build**.
Los **SIGUIENTE de código** de más abajo siguen intactos.

## ✅ Código (nuestro repo — casar sc-docs/prototipos con Figma)

Medido que **nuestro sc-docs ya casaba** casi entero (chip 14/20/34, opciones 14/20, breadcrumb 14 +
`slate/600`); lo desviado era **producción (Carlos)**. Lo que faltaba, hecho en el preset y
**verificado en sc-docs con build**:

- **`css.ts`** — chip, toast-summary, select/multiselect/listbox-option, breadcrumb, context-menu →
  tipografía **md (14/20)**; tag, toast-detail → **sm (12/18)**. Ahora **explícito**, no depende del
  `line-height` del body de cada app (así los **prototipos** —body 1.5— también casan).
- **`extend.ts`** — **unificación**: `app.typography.md.lineHeight` `scale-1-5` (21) →
  `line-height-200` (20). Medido: control de alto 37 a 36 (icon-only más cuadrado), **sin romper
  geometría**. Verificado: botón 36/20, tag 25, chip 34. Efecto colateral esperado: movió el alto
  inline del textarea autoResize (77→74) → regenerado el baseline de estructura (`59a5c73`).
- **Code Connect (C):** 6 componentes mapeados en `code-connect/*.figma.ts` (formato v2
  templates de `@figma/code-connect` 2.0), **publicados en Figma dev mode**. Context-menu
  excluido: no existe wrapper en el DS.
- **Previews (B):** referencias estáticas HTML nativas en `sc-docs/public/explorations/components/`
  que consumen los `--sc-*` reales vía `/tokens` (assets en `angular.json`, opción 3, cero drift).
  Light+dark+estados, 6 componentes + índice. Verificadas por pantalla.

## ✅ Figma (master `khNq9dJKNi13pNllrqm6dx`)

Todo **migration-safe**: atado a tokens que **ya existían**, sin tocar su valor → cero efecto colateral.

- **Tamaño → `primitive/typography/font/size/200` (14):** `breadcrumb-item`, `contextmenu-item`,
  `select-option`, `multiselect-option`, `listbox-option` (**23 nodos**). Estaban a 14 pero **a
  pelo**; ahora vinculados. **Sin cambio visual.**
- **Line-height → rampa normal** (`line/height/200`=20 para 14px, `line/height/100`=18 para 12px):
  **chip 31→34, toast 62→68, tag 22→25** (**30 nodos**). Antes AUTO/libre.
- **Badge EXCLUIDO con motivo:** alto **FIJO** (18/21/25/28) y tamaños fuera de rampa
  (8.75/10.5/12.25) → el line-height no le afecta y no hay token que le pegue. Tocarlo sería
  inventar tokens.
- **Decisión — "line-height normal en todo", NO un set compact.** Se sopesó y **descartó** una
  rampa de line-height ceñido; los hug (chip/toast/tag) tiran de la rampa normal. *(Candidata a
  DD si se quiere formalizar; hoy solo aquí.)*

**Hallazgos de la revisión web↔Figma** (por si se retoma):

- **Select/MultiSelect:** el **valor** ya es 14 (correcto); el bug está en las **opciones del
  desplegable** (16, deben 14). El "16→14" que se arrastraba era medir el **contenedor**, no el
  texto — falso positivo de sesiones pasadas.
- **Breadcrumb:** 16→14 **y** color `#8F97A3` → `slate/600` (`breadcrumb/item/color`).
- **Context-menu:** 16→14 (color `slate/700`, correcto).
- **Chip/Toast/Tag:** line-height (hug); la web va a 1.5.

**Pendiente de Carlos (dev, NO nuestro):** consumir estos tokens en código (tamaño, line-height,
color breadcrumb). Mensaje de diseño enviado. Editar Figma **no mueve la web**.

**Nota (20-vs-21):** en NUESTRO código ya **unificado a 20** (`extend.ts`, esta sesión). En producción
(Carlos) sigue el legacy hasta que consuma los tokens.

**Table:** endosada como **buena base** (mensaje ligero), sin push a reconstruir sobre PrimeNG.

## ▶︎ SIGUIENTE — sin preguntar

0. **Re-exportar desde el Theme Designer, y luego cerrar `text.muted.color`.** Medido el
   2026-08-24 comparando el **fichero** de Figma contra `kit-export-dtcg.json`: de **164 valores
   semánticos, 160 idénticos**; divergen **4, con 2 causas raíz**, y las dos van en la misma
   dirección — son arreglos de contraste que el fichero YA tiene y el export no. El export está
   **desfasado** (lo generó el plugin `primeui-figma-plugin-v4` el **2026-07-22**), no roto.
   - `text/muted/color` (claro): fichero `slate/600` `#6f7784` · export `surface/500` `#8f97a3`.
     Arrastra `list/option/group/color` y `navigation/submenu/label/color`, que le alias.
     **Su condición de reversión escrita en `color-map.mjs` ("revertir cuando el Kit suba el
     suyo") ya se cumple** — el Kit lo subió al MISMO valor que pusimos a mano. No se puede pasar
     a `enforce` hasta re-exportar: `tokens:parity` compara contra el export, así que hacerlo
     antes lo deja rojo. Anotado en la propia fila (`c7e9ea0`).
   - `primary/contrast/color` (oscuro): fichero **`#ffffff`** · export `#18181b`. Ese export es
     el origen del "seguimos al Kit" que llevaba el `07-dark.css` y de que el par quedara en
     3,01:1. **NO revierte DD-40**: su decisión se apoya en que con texto blanco no existen hover
     ni active legales en esa rampa, y eso es independiente de lo que diga el Kit.
   - **El eslabón que falta**: `tokens:parity` compara *export ↔ CSS*. **Nadie compara
     *fichero ↔ export***, y por ahí se coló esto. No puede ser un gate de CI (necesita el bridge
     de Figma abierto), así que de momento es procedimiento manual — mismo caso que el Check D de
     `docs:coherence`, que también es LOCAL-only y por el mismo motivo.
   - **Cómo repetir la medición sin tropezar**: resuelve a **RGBA final los DOS lados** antes de
     comparar. La primera pasada dio **15 divergencias falsas** por dos motivos tontos: leer los
     colores de Figma sin el canal alfa (`#00000000` vs `#000000`) y comparar un alias contra un
     valor ya resuelto (`slate/0` vs `#ffffff`). Y ojo con el JSON del export: **las claves raíz
     llevan las barras dentro** (`d['aura/semantic/dark']['primary']`, no `d['aura']['semantic']`).
1. **Los 16 del trinquete de DD-38**, por lotes (`LEGACY_PENDIENTES` en
   `scripts/audit-api-era.mjs`). El de más impacto es **`sc-icon`**: está en todas las pantallas.
   Receta y criterio, en DD-38; al migrar uno, **bórralo de la lista** (el guard lo exige).
2. **Los hallazgos viejos de [`AUDIT-SEMANAL.md`](../AUDIT-SEMANAL.md)** (secciones 2026-08-10 y
   2026-08-04). Dos son borrado de código muerto y su precondición **ya está verificada**
   (2026-08-14): `ClipboardService` del supervisor tiene 0 consumidores —solo su fichero y el
   barrel `core/services/index.ts:4`— y difiere del `ScClipboardService` del DS solo en el nombre
   de la clase y un párrafo de docstring; y `shared/utils/is-typing-target.ts` es **idéntico**
   (`diff` vacío) al del DS con 0 usos. `icon-size.ts` sí tiene un consumidor
   (`label-chip.component.ts`): ahí es importar de `@smartcontact-hub/icons`, no borrar.
3. **`npm audit fix` — y NO es lo que decía esta ficha.** Medido el 2026-08-14: **30**
   vulnerabilidades (**0 críticas**, 24 altas, 4 moderadas, 2 bajas), no las "35 con 1 crítica"
   que este hand-off arrastraba, y **29 de las 30 tienen arreglo NO-breaking** (ninguna marcada
   `isSemVerMajor`) — o sea que lo de "pide cambio de major" también era falso. Por eso sale de
   ESPERANDO A RAFA: es trabajo normal, verificable con la cadena de 8 pasos. Las 24 altas son
   en realidad **tres cosas**: un XSS de i18n en `@angular/compiler` propagado a 11 paquetes de
   Angular (Angular instalado: 21.2.17), `xlsx`, y 12 de cadena de build (vite, postcss, undici,
   piscina…) que no viajan al bundle que sirve Cloudflare. **La única sin arreglo publicado es
   `xlsx`** (prototype pollution de SheetJS) y **su vía es PARSEAR** un fichero: nuestro
   `xlsx-export.service.ts` solo escribe (`aoa_to_sheet`/`book_new`/`writeFile`) — cero
   `XLSX.read` en todo el repo, verificado. Sí viaja al navegador, en su chunk diferido.
4. **La rama `aura/custom` del Kit no la vigila nadie** (hallazgo nuevo de s28, `[gate-able]`):
   ningún coverage-map la clasifica, así que no se genera su familia `--sc-cmp-*` y, si el Kit
   añade otro custom, no salta nada. Es el mismo agujero que `tokens:parity` ya cubre para
   `semantic/common`, `app` y `effects`.
5. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)**. El P0 sigue
   siendo `field-pattern ×5`.
6. **Los cabos de DD-24** (round-trip de iconos a Figma) en [`ROADMAP.md`](../ROADMAP.md).

## ⏸️ ESPERANDO A RAFA — NO preguntar

| Qué | Estado |
|---|---|
| **Un primary dark conforme, pero desde el KIT** | ⚠️ Ya NO es el 3,01:1: eso lo resolvió **DD-40** en s31 subiendo la rampa un paso (5,05 / 8,03 / 11,89) y **divergiendo** del Kit, y con ello `theme-contrast.spec.ts` pudo ampliarse a `body`. Lo que queda en manos de Rafa es pedirle al Kit su primary dark conforme —luminancia relativa entre **0,136 y 0,183**, al centro de la banda—; el día que llegue, esto se revierte devolviendo tres filas de `color-map.mjs` a `enforce` |
| **Borrar el proyecto Cloudflare `sc-demo`** | Vivo sirviendo contenido viejo; un borrado permanente no lo ejecuto yo |
| **Retirar `sc-page-header`** | Sin consumidores salvo su demo |
| **Lienzo de página gris↔blanco** | Figma `13920:4298`. ⚠️ Antes de tocarlo lee la **trampa C3 de DD-36**: devolverlo a `--sc-bg-default` re-crea un bug documentado del rail de AED |
| **Tramo actual del breadcrumb** | Figma `13890:157`. Lo mira **Marta** |
| **Publicar Code Connect** | Requiere plan Figma Organization/Enterprise |
| **B5b · prosa i18n del constructor** | Necesita ICU MessageFormat. **NECESITA DISEÑO** |
| **`org-profile.md`** | ¿Lo llegaste a pegar en el repo `.github` de la org? Si sí, se borra |

## 🔌 Figma — tres servers, y caen por separado

Tabla completa en [`AGENTS.md`](../../AGENTS.md) → *Figma MCP Bridge*.

- **`mcp__figma-console__*`** (bridge `:9223`, 118 tools) — el de diario, lee **y escribe**.
- **`mcp__Figma__*`** — app de escritorio, solo lectura. Sobrevive a que la nube caiga.
- **Nube** (`plugin:figma:figma`, 32 tools) — solo aporta librerías remotas y funcionar sin
  Figma Desktop. Autenticado en terminal; el conector de claude.ai sigue invalidado en la app.

Fichero: **"Smart-Contact Design System"** (`khNq9dJKNi13pNllrqm6dx`) — 111 páginas, 2.509
variables, 30 comentarios activos.

## ⚠️ Trampas de este frente

- **Los dos e2e que "fallan siempre en macOS" se desactivan con `CI=1`**: los screenshots de
  `sc-card` y `sc-message` (`components.spec.ts`) son llamadas a `screenshotBaseline()`, que
  **hace no-op cuando `CI` está puesta**. Medido el 2026-08-24: `CI=1 npm run e2e` → **68/68 en
  verde** en este Mac, dos veces. O sea que el smoke completo SÍ es corrible en local; lo que no
  lo es son sus baselines por plataforma. Sin `CI=1` siguen rojos y **no son tuyos** (el de
  `sc-card` espera una página de 1049px y recibe 1453 — no lo leas como regresión de métrica).
- **El CI son 8 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J).
- **`npm run verify` (26 gates) NO corre el `e2e smoke`.** El `component-structure.spec` (baseline
  del `outerHTML` de cada componente) es un paso aparte de CI, y el textarea autoResize graba su
  alto calculado en un `style` inline que vive en ese `outerHTML`. Un cambio de token/visual puede
  pasar los 26 gates y aun así romper el baseline en CI: en s29, `line-height` md 21→20 movió ese
  alto (77→74) y tumbó el CI en dos push seguidos mientras el verify local iba verde. **Quien lo
  cubre es `npm run preflight`**, que desde s30 corre el smoke ENTERO (`CI=1 npm run e2e`, 68
  tests) y no un subconjunto. `npm run e2e:structure` sigue valiendo como bucle corto mientras
  iteras (`:update` si el cambio es deliberado, y revisa el diff del JSON), pero el gate de
  pre-push es preflight.
- **`npm run verify` son 26 gates desde s28.** Si añades uno, la cifra vive en 4 sitios y
  **ninguno la gatea**: `CLAUDE.md`, `docs/DOCS-INDEX.md`, `docs/AUDIT-SEMANAL.md` y el
  `SKILL.md` de la rutina. Lo que sí falla solo es el README, que debe **nombrar** el guard nuevo.
- **Para MEDIR color o contraste, no uses `ng serve`** (s31): sirvió `blue-400` durante cinco
  rondas de e2e con el fuente y el bundle construido diciendo `blue-300`. Construye y sirve el
  estático (`ng build supervisor` → `http-server dist/supervisor/browser --proxy` para el
  fallback SPA) y apunta `SC_SUPERVISOR_URL` ahí. Si una medición contradice al fuente, la
  primera hipótesis es el build viejo.
- **`npm run e2e` ya NO pisa los PNG de `public/usage/`**: `playwright.config.ts` tiene
  `testIgnore: ['usage/**', ...]`. Comprobado el 2026-08-24 tras dos smokes completos —
  `public/usage/*.png` y `_usage-raw.json` intactos. (La captura de uso se corre a propósito, con
  su config aparte.) Lo visual se sigue gateando con `ng build` AOT.
- **Los permisos de Actions se capan desde la ORG**: cambiar solo el repo no sirve; el ajuste se
  queda en `read` sin avisar. Hay que ponerlo en `write` en los dos niveles.
- **Al escribir un docstring, cuidado con lo que MENCIONAS.** Los scripts que cuentan API
  (`component-audit`) ya ignoran comentarios desde s28, pero la lección de fondo aplica a
  cualquier contador nuevo: si tu regex mira el fichero entero, cuenta también lo que se está
  explicando.

## 🕳️ Lo que se dejó fuera, y por qué (por sesión)

- **s33 · anotar los `scripts/**/*.mjs`** (392 errores con `checkJs`) y **type-checkear
  `code-connect/`** (17): las dos salen del gate nuevo con su motivo escrito, en la tabla de
  arriba. La primera es trabajo real si algún día se quiere; la segunda no es type-checkeable con
  `tsc` a secas y ya tiene su gate.
- **La web no cambia hasta que Carlos consuma los tokens.** Lo nuestro (Figma) está hecho; el
  loop se cierra en su repo. Editar Figma no mueve producción — pieza-verde ≠ loop-funciona.
- **Badge sin tocar** (alto fijo, tamaños fuera de rampa): decisión, no olvido.
- **El desajuste 20-vs-21 de la escala** queda como deuda de foundations, sin abrir.
- **Sin DD formalizado** de "normal en todo / tokenizar texto de componente": está en este
  hand-off; se sube a `DECISIONS.md` solo si Rafa lo pide.
- **La `[intencional]` de `sc-bulk-transcription-modal` y todo lo de código (s28)** siguen igual:
  los SIGUIENTE de arriba están intactos — s30 no los tocó.
- **s30 · el desajuste `filtered()` vs `grouped()` del palette queda ANOTADO, no arreglado.** Si un
  consumidor publicara sus comandos con las categorías intercaladas, las flechas navegarían en un
  orden distinto del que se ve. Ninguno de los dos consumidores de hoy intercala, y arreglarlo es
  otra tarea: el `scrollIntoView` de esta sesión ya casa por `id` y no depende de ello.
- **s30 · las baselines visuales locales siguen siendo sensibles a la CARGA.** Regeneradas y ya deterministas respecto al scroll de la sidebar (4 pasadas completas seguidas en verde), pero las rojas sueltas caen siempre en las pasadas lentas —4,8 min frente a 2,2—, nunca en las rápidas. El CI no las corre (`screenshotBaseline` hace no-op con `CI=1`), así que no tumban nada; en local, si una sale roja, mira el diff antes de regenerar.
- **s30 · sin DD.** Ni el cambio de hover ni el del scroll son decisiones de arquitectura: la razón
  vive en el docstring de `onItemHover`/`scrollHighlightedIntoView` y en los dos gates, que es donde
  se lee cuando hace falta.
