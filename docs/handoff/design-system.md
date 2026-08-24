# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-24 (s31) — HEAD `be98983` (DD-40 primary dark · red de contraste ampliada · swatches de sc-docs). Contenido previo: `59a5c73`.**

Sesión de dos mitades. **(1) Figma:** se revisaron 6 componentes + Table cruzando el master
contra la **web en vivo** (chrome-devtools) y se **tokenizó** tamaño y line-height del texto de
componente. **(2) Código (nuestro repo):** medido que **nuestro sc-docs ya casaba** con Figma casi
entero —lo desviado era producción (Carlos)—; se **casó lo que faltaba** en el preset (`css.ts` +
`extend.ts`) con la **unificación de line-height** (md 21→20), **verificado en sc-docs con build**.
Los **SIGUIENTE de código** de más abajo siguen intactos.

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

- **Dos e2e fallan SIEMPRE en local (macOS) y no son tuyos**: los screenshots de `sc-card` y
  `sc-message` (`components.spec.ts:116` y `:162`). **Re-confirmado el 2026-08-14 por
  stash-y-reproduce**: en HEAD limpio fallan los mismos dos, con el mismo error. En CI pasan.
  El de `sc-card` no es sutil —espera una página de 1049px y recibe 1453— así que no lo leas
  como una regresión de métrica.
- **El CI son 8 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J).
- **`npm run verify` (26 gates) NO corre el `e2e smoke`.** El `component-structure.spec` (baseline
  del `outerHTML` de cada componente) es un paso aparte de CI, y el textarea autoResize graba su
  alto calculado en un `style` inline que vive en ese `outerHTML`. Un cambio de token/visual puede
  pasar los 26 gates y aun así romper el baseline en CI: en s29, `line-height` md 21→20 movió ese
  alto (77→74) y tumbó el CI en dos push seguidos mientras el verify local iba verde. **Tras tocar
  tokens o algo visual, corre `npm run e2e:structure` antes de pushear** (`:update` si el cambio es
  deliberado, y revisa el diff del JSON).
- **`npm run verify` son 26 gates desde s28.** Si añades uno, la cifra vive en 4 sitios y
  **ninguno la gatea**: `CLAUDE.md`, `docs/DOCS-INDEX.md`, `docs/AUDIT-SEMANAL.md` y el
  `SKILL.md` de la rutina. Lo que sí falla solo es el README, que debe **nombrar** el guard nuevo.
- **Para MEDIR color o contraste, no uses `ng serve`** (s31): sirvió `blue-400` durante cinco
  rondas de e2e con el fuente y el bundle construido diciendo `blue-300`. Construye y sirve el
  estático (`ng build supervisor` → `http-server dist/supervisor/browser --proxy` para el
  fallback SPA) y apunta `SC_SUPERVISOR_URL` ahí. Si una medición contradice al fuente, la
  primera hipótesis es el build viejo.
- **`npm run e2e` pisa los PNG de `public/usage/`**. Gatea lo visual con `ng build` AOT.
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
  esta sesión no tocó el repo, sus SIGUIENTE están intactos.
