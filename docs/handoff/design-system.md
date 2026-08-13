# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-13 (s27) — HEAD `538375a`.**

Sesión larga: MCP de Figma, cierre de 3 PRs parados, y la **auditoría completa de
documentación** (fases A, C y D del plan). Sin trabajo a medias.

## ▶︎ SIGUIENTE — sin preguntar

1. **Los items `[gate-able]` de [`AUDIT-SEMANAL.md`](../AUDIT-SEMANAL.md)** que aún no tienen
   guard. La rutina ya los marca; convertirlos es trabajo directo.
2. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)** — 16 items
   abiertos, verificados uno a uno como vigentes. El P0 es `field-pattern ×5`.
3. **Los 4 pendientes de DD-24** (round-trip de iconos a Figma) en
   [`ROADMAP.md`](../ROADMAP.md).

## 🔌 Figma — qué canal usar (verificado 2026-08-13)

**No hay "el MCP de Figma": hay tres servers y caen por separado.** Tabla completa en
[`AGENTS.md`](../../AGENTS.md) → *Figma MCP Bridge*.

- **`mcp__figma-console__*`** (bridge `:9223`, 118 tools) — el de diario, lee **y escribe**.
  Salud: `figma_get_status` con `probe:true`.
- **`mcp__Figma__*`** — app de escritorio, solo lectura. Sobrevive a que la nube caiga.
- **Nube** (`plugin:figma:figma`, 32 tools) — solo aporta búsqueda en librerías remotas y
  funcionar sin Figma Desktop abierto. **Autenticado en terminal**; el conector de claude.ai
  (`mcp__acb3d14c…__*`) sigue invalidado en la app y se reconecta desde sus ajustes.

Fichero: **"Smart-Contact Design System"** (`khNq9dJKNi13pNllrqm6dx`) — 111 páginas, 2.509
variables en 7 colecciones, 30 comentarios activos.

## 🧹 Auditoría de documentación — qué cambió (2026-08-13)

Informe con veredicto por documento: [`AUDIT-DOCS-2026-08.md`](../AUDIT-DOCS-2026-08.md).

| | Antes | Ahora |
|---|---|---|
| Ficheros `.md` | 46 | **37** |
| Enlaces rotos | 9 | **0** |
| Gates de documentación | 2 | **8** |

- **Borradas 3.100+ líneas**: las 4 skills de agente (que nada cargaba, pese a que `AGENTS.md`
  ordenaba correrlas), la carpeta de historia entera, `AUDIT-2026-07` y un playbook fósil.
- **Dos tags de archivo** en `origin`: `archive/docs-history` y `archive/informes-datareports`.
  Se consultan con `git show <tag>:<ruta>`.
- **`LEARNINGS`**: 20 → 16 reglas (4 fusiones) + **índice de disparadores** arriba, para poder
  escanearlo sin leer 5.700 palabras. **Los números son identificadores citados desde código —
  nunca renumeres.**
- **Deuda: 4 sitios → 3.** `AUDIT-DEUDA` (snapshot fechado) · `AUDIT-SEMANAL` (backlog vivo
  autogenerado) · `ROADMAP` (lo priorizado).
- **DD-36 nuevo**: las 7 divergencias de UX deliberadas entre los 4 flujos + la trampa C3 del
  rail de AED, rescatadas de un doc mal catalogado como histórico.

## ⏸️ ESPERANDO A RAFA — NO preguntar

| Qué | Estado |
|---|---|
| **Borrar el proyecto Cloudflare `sc-demo`** | Sigue vivo sirviendo contenido viejo. Es un clic suyo; un borrado permanente no lo ejecuto yo |
| **Retirar `sc-page-header`** | Sin consumidores salvo su demo |
| **Lienzo de página gris↔blanco** | Figma node `13920:4298`. ⚠️ Antes de tocarlo, lee la trampa **C3 de DD-36**: devolver el lienzo a `--sc-bg-default` re-crea un bug documentado del rail de AED |
| **Tramo actual del breadcrumb** | Figma node `13890:157`. Lo mira **Marta**; sin comentario anclado a ese nodo |
| **Publicar Code Connect** | Requiere plan Figma Organization/Enterprise |
| **B5b · prosa i18n del constructor** | Necesita ICU MessageFormat. **NECESITA DISEÑO** |
| **35 vulnerabilidades** (1 crítica, 26 altas) | El `npm audit fix` mergeado cerró 7; las demás piden cambio de major |

## ⚠️ Trampas de este frente

- **`npm run e2e` pisa los PNG de `public/usage/`** — corre usage-capture contra el showcase.
  Gatea lo visual con `ng build` AOT.
- **Dos e2e fallan SIEMPRE en local (macOS) y no son tuyos**: los screenshots de `sc-card` y
  `sc-message` (`components.spec.ts:116` y `:162`). Reproducidos en commits anteriores a
  cualquier cambio; en CI pasan.
- **El CI son 8 pasos, no `verify`**. Están enumerados en `ci.yml` — ábrelo.
