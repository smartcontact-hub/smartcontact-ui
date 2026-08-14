# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-14 (s28) — HEAD `9d49613`.**

Sesión de una pieza: se cerró **la sección más reciente de la auditoría semanal** —los 4
hallazgos que quedaban del 2026-08-13— y, de camino, dos ítems que colgaban de secciones
anteriores. El lote de código pasó los **8 pasos del CI corridos en local sobre el árbol final**
(los 2 rojos de siempre, `sc-card` y `sc-message`, re-confirmados ajenos por stash-y-reproduce);
los dos commits posteriores son solo `.md` + un docstring, gateados con el subconjunto que les
aplica. **El CI remoto confirmó los tres pushes en verde.** Sin trabajo a medias, sin ramas
abiertas, sin PRs.

## ✅ Lo que cambió

- **DD-38 — la era objetivo de la API es señales**, y ya no es una preferencia: la sostiene un
  **trinquete en `verify`** (`npm run audit:api-era`, el gate nº 26). Nada nuevo puede estrenar
  `@Input()/@Output()`, y la lista de los que aún los usan **solo puede menguar**.
- **`sc-button` migrado** (15 `input()` + 1 `output()`, getters → `computed()`). Era el que más
  se copia —100 usos— y el que hacía que "mira la referencia" significara dos cosas distintas
  según qué fichero abrieras.
- **9 stores de ceremonia → `createRepoStore`** en el supervisor: **−144 líneas** y
  `inject(XStore)` intacto en todos los consumidores.
- **Dos guardianes tenían el mismo punto ciego, y ya no**: contaban lo que aparece en los
  **comentarios**. `component-audit` subió `sc-button` de 15 a 16 inputs solo porque su docstring
  nuevo menciona `input()`; y CHECK E de `docs:coherence` ahora entra en `projects/**`, donde
  llevaba desde el 4 de agosto una cifra falsa que por alcance no podía ver.
- **`sc-bulk-transcription-modal` queda como está, y el ítem cerrado como [intencional]**: no se
  adopta en Memory (sería regresión) y **no se retira**, porque está en el Kit — es el único
  componente custom que `kit-export-dtcg.json` modela con tokens propios. Que ninguna app lo use
  significa que **la app se adelantó al Kit**, y eso se habla en Figma, no en el código.

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
3. **La rama `aura/custom` del Kit no la vigila nadie** (hallazgo nuevo de s28, `[gate-able]`):
   ningún coverage-map la clasifica, así que no se genera su familia `--sc-cmp-*` y, si el Kit
   añade otro custom, no salta nada. Es el mismo agujero que `tokens:parity` ya cubre para
   `semantic/common`, `app` y `effects`.
4. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)**. El P0 sigue
   siendo `field-pattern ×5`.
5. **Los cabos de DD-24** (round-trip de iconos a Figma) en [`ROADMAP.md`](../ROADMAP.md).

## ⏸️ ESPERANDO A RAFA — NO preguntar

| Qué | Estado |
|---|---|
| **Borrar el proyecto Cloudflare `sc-demo`** | Vivo sirviendo contenido viejo; un borrado permanente no lo ejecuto yo |
| **Retirar `sc-page-header`** | Sin consumidores salvo su demo |
| **Lienzo de página gris↔blanco** | Figma `13920:4298`. ⚠️ Antes de tocarlo lee la **trampa C3 de DD-36**: devolverlo a `--sc-bg-default` re-crea un bug documentado del rail de AED |
| **Tramo actual del breadcrumb** | Figma `13890:157`. Lo mira **Marta** |
| **Publicar Code Connect** | Requiere plan Figma Organization/Enterprise |
| **B5b · prosa i18n del constructor** | Necesita ICU MessageFormat. **NECESITA DISEÑO** |
| **35 vulnerabilidades** (1 crítica, 26 altas) | El `npm audit fix` mergeado cerró 7; el resto pide cambio de major |
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
- **`npm run verify` son 26 gates desde s28.** Si añades uno, la cifra vive en 4 sitios y
  **ninguno la gatea**: `CLAUDE.md`, `docs/DOCS-INDEX.md`, `docs/AUDIT-SEMANAL.md` y el
  `SKILL.md` de la rutina. Lo que sí falla solo es el README, que debe **nombrar** el guard nuevo.
- **`npm run e2e` pisa los PNG de `public/usage/`**. Gatea lo visual con `ng build` AOT.
- **Los permisos de Actions se capan desde la ORG**: cambiar solo el repo no sirve; el ajuste se
  queda en `read` sin avisar. Hay que ponerlo en `write` en los dos niveles.
- **Al escribir un docstring, cuidado con lo que MENCIONAS.** Los scripts que cuentan API
  (`component-audit`) ya ignoran comentarios desde s28, pero la lección de fondo aplica a
  cualquier contador nuevo: si tu regex mira el fichero entero, cuenta también lo que se está
  explicando.

## 🕳️ Lo que esta sesión dejó fuera, y por qué

- **Los 16 componentes del trinquete siguen en decoradores.** Se migró solo `sc-button`, que es
  lo que pedía el hallazgo (la referencia). El resto es trabajo por lotes, con su gate ya puesto.
- **No se ha tocado `AUDIT-DEUDA-2026-06`** más allá de marcar el tema A como decidido.
- **`DECISIONS.md` sigue creciendo** (~1.780 líneas con DD-38). Sigue sin doler lo bastante.
