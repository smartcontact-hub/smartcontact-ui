# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-13 (s27) — HEAD `a3d076f`.**

Sesión larga. Se diagnosticaron los MCP de Figma, se desatascaron 3 PRs parados y se hizo la
**auditoría completa de documentación**. Sin trabajo a medias, sin ramas abiertas, sin PRs.

## ▶︎ SIGUIENTE — sin preguntar

1. **Los 3 hallazgos abiertos de la rutina semanal** en
   [`AUDIT-SEMANAL.md`](../AUDIT-SEMANAL.md) — el P1 de las dos eras de API es el más gordo y
   **necesita un DD antes de tocar código** (decidir si signals es la era objetivo afecta a los
   51 componentes; `sc-button` sigue en `@Input()` siendo la referencia más citada).
2. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)** — 16 items,
   verificados uno a uno como vigentes. El P0 es `field-pattern ×5`.
3. **Los cabos de DD-24** (round-trip de iconos a Figma) en [`ROADMAP.md`](../ROADMAP.md).

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

## 🧹 Lo que hizo la auditoría (informe: [`AUDIT-DOCS-2026-08.md`](../AUDIT-DOCS-2026-08.md))

| | Antes | Ahora |
|---|---|---|
| Ficheros `.md` | 46 | **37** |
| Enlaces rotos | 9 | **0** |
| Gates de documentación | 2 | **10** |
| Claims sin verificar en el informe | 25 | **0** |

- **Borradas ~3.100 líneas**: las 4 skills de `.agents/skills/` (que nada cargaba pese a que
  `AGENTS.md` ordenaba correrlas), `docs/history/` entero, `AUDIT-2026-07` y un playbook fósil.
  Archivadas en los tags **`archive/docs-history`** y **`archive/informes-datareports`**
  (`git show <tag>:<ruta>`).
- **Verificadas las 4.600 líneas de referencia** que nadie había contrastado: **74 claims falsas
  de ~500**. Las dos peores: `guia-tokens` decía que el preset hace `definePreset(Aura, …)` —no
  lo hace, así que **lo no declarado NO hereda de Aura**— y `customs-catalog` §1.9 daba por no
  construido un guardián que existe, corre, y **al fallar te manda leer esa misma sección**.
- **`LEARNINGS`**: 20 → 16 reglas + **índice de disparadores**. Los números son identificadores
  citados desde código: **nunca renumeres**.
- **La rutina semanal ya aterriza sola** — su PR se auto-mergea (CI verde + solo su doc).

## ⚠️ Trampas de este frente

- **Dos e2e fallan SIEMPRE en local (macOS) y no son tuyos**: los screenshots de `sc-card` y
  `sc-message` (`components.spec.ts:116` y `:162`). Reproducidos en commits anteriores a
  cualquier cambio; en CI pasan.
- **El CI son 8 pasos, no `verify`** — enumerados en `ci.yml`, y ahora gateados (CHECK J).
- **`npm run e2e` pisa los PNG de `public/usage/`**. Gatea lo visual con `ng build` AOT.
- **Los permisos de Actions se capan desde la ORG**: cambiar solo el repo no sirve; el ajuste se
  queda en `read` sin avisar. Hay que ponerlo en `write` en los dos niveles.

## 🕳️ Lo que la auditoría dejó fuera, y por qué

- **Partir `AGENTS.md` / vaciar `CLAUDE.md`** → descartado con motivo, ver §5 del informe.
- **`DECISIONS.md` sigue en ~1.700 líneas.** `DD-13` solo son 296 (17%), casi todo addendums de
  un piloto ejecutado; están señalizados con un corte que dice dónde acaba la decisión.
- **Los contadores copiados a prosa siguen sin red** salvo el de componentes (CHECK E). Es la
  clase que produjo la mayoría de las 74 claims falsas.
