# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-24 (s30) — HEAD `649240d` (hover del command palette · scroll de flechas · preflight ≡ CI). Contenido previo: `59a5c73` (s29).**

## ✅ s30 — `sc-command-palette` (teclado) + el alcance real de `preflight`

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

## 🕳️ Lo que esta sesión dejó fuera, y por qué

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
- **s30 · sin DD.** Ni el cambio de hover ni el del scroll son decisiones de arquitectura: la razón
  vive en el docstring de `onItemHover`/`scrollHighlightedIntoView` y en los dos gates, que es donde
  se lee cuando hace falta.
