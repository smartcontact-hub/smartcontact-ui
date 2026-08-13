# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-13 (s27) — HEAD `3706504`.**

Sesión corta de mantenimiento: se diagnosticaron los MCP de Figma, se archivó la réplica de
Informes y se afiló la doc. Sin trabajo a medias.

## 🔌 Figma — qué canal usar (verificado 2026-08-13)

**No hay "el MCP de Figma": hay tres servers y caen por separado.** Tabla completa en
[`AGENTS.md`](../../AGENTS.md) → *Figma MCP Bridge*. Resumen:

- **`mcp__figma-console__*`** (bridge `:9223`, 118 tools) — el de diario, lee **y escribe**.
  Salud: `figma_get_status` con `probe:true`.
- **`mcp__Figma__*`** — app de escritorio, solo lectura. Sobrevive a que la nube caiga.
- **Nube** (`plugin:figma:figma`, 32 tools) — solo aporta búsqueda en librerías remotas y
  funcionar sin Figma Desktop abierto. **Autenticado en terminal**; el conector de claude.ai
  (`mcp__acb3d14c…__*`) sigue invalidado en la app y se reconecta desde sus ajustes.

Fichero: **"Smart-Contact Design System"** (`khNq9dJKNi13pNllrqm6dx`) — 111 páginas, 2.509
variables en 7 colecciones, 30 comentarios activos.

## ⏸️ ESPERANDO A RAFA — NO preguntar

Aparcado a propósito. Solo se toca si él lo saca.

| Qué | Estado |
|---|---|
| **Borrar el proyecto Cloudflare `sc-demo`** | Sigue vivo sirviendo contenido viejo. Es un clic suyo en el dashboard; un borrado permanente no lo ejecuto yo. (~26 deployments → el bug de Cloudflare de «más de 100» NO aplica) |
| **Retirar `sc-page-header`** | Sin consumidores salvo su demo. Decisión suya |
| **Lienzo de página gris↔blanco** | Figma node `13920:4298` (página *Flujos*). Decisión suya |
| **Tramo actual del breadcrumb** | Figma node `13890:157` (página *❖ Breadcrumb*). Lo mira **Marta**. Sin comentario anclado a ese nodo; el último del fichero es del 10-jun |
| **Publicar Code Connect** | Requiere plan Figma Organization/Enterprise + `FIGMA_ACCESS_TOKEN` + que exista `Show Icon` en el master de `card` |
| **B5b · prosa i18n del constructor** | `conditionToDesc()` compone gramática española a mano; necesita ICU MessageFormat o compositor por locale. **NECESITA DISEÑO** |

## 🗄️ Archivado — no lo rehagas

**`archive/informes-datareports`** (tag, en `origin`) — réplica nativa de la pantalla *Informes*
del supervisor, ~2.500 líneas medidas sobre el sitio real. Existía porque el supervisor real
embebe esa pantalla en un iframe cross-origin y `html.to.design` no la puede capturar para
Figma. **Rafa confirmó el 2026-08-13 que ya cumplió su función.** Nunca se mergeó: en producción
`/informes` sigue siendo un placeholder.

Recuperarla: `git switch -c feat/informes archive/informes-datareports`.

## ⚠️ Trampas de este frente

- **`npm run e2e` pisa los PNG de `public/usage/`** — corre usage-capture contra `sc-demo` y las
  rutas del supervisor no existen ahí. Gatea lo visual con `ng build` AOT.
- **`e2e smoke` tiene un flake conocido**: el baseline de `component-structure` leyó 2 `sc-select`
  de 8 en CI (2026-08-13) y pasó en verde localmente sobre el mismo commit, y verde otra vez en
  el siguiente run. Si vuelve a salir, sospecha del temple de lectura antes que del código.
