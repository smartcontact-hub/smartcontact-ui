# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-30** (sesión 5). Esta sesión: **construido y mergeado a main el constructor de condiciones
> de reglas (DD-26)** — Variante B (`conditionTree` 2 niveles, match all/any, mezcla AND/OR, agrupar) +
> campo **tipificación**, **builder progresivo** (1 grupo = plano sin toggle raíz redundante; el chrome de
> grupos solo con 2+) y **quitado "Atendida por"** (redundante). Verificado AOT + typecheck + lint + preview
> en vivo. Próximo paso natural: **unificar dirección/duración como campos del builder** (un solo sitio para
> filtrar) — abierto en DD-26. SOBREESCRIBE este fichero al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. **El *por qué* durable:** `docs/DECISIONS.md` (**DD-26** = constructor de condiciones; modelo + puente
   legacy + builder progresivo). **Backlog:** `docs/ROADMAP.md`.
3. **Elige tarea de §Lo que queda.** Son independientes; la #0 (unificar dirección/duración) es la
   continuación directa de esta sesión.

---

## 🎯 Estado de un vistazo
- **Constructor de condiciones de reglas — HECHO y en main** (DD-26). Vive en el supervisor:
  `features/memory/components/rule-condition-builder/` + integrado en `pages/rule-builder/`. Modelo en
  `features/memory/data/condition.types.ts` (`ConditionTree` 2 niveles + helpers `deriveLegacyScope` /
  `deriveTreeFromLegacy` / `describeConditionTree`). Campo `tipificación` con valores de
  `conversation-filter-options.ts` (espejo del repo de Tipificaciones). Commits `d873308`/`c815c0d`,
  merges `2d3af1a`/`b22b7db`.
  - **Puente legacy**: al guardar se derivan `servicios/grupos/agentes` (sobre-aproximación segura) → listado
    y `scopeOverlaps` intactos. `tipificación` solo vive en el árbol.
  - **Builder progresivo**: 1 grupo = plano (un único toggle); 2+ = grupos + toggle raíz + conectores navy.
- **Recorrido `/reglas` (sc-demo): material de presentación, NO producto.** No confundir con el builder real
  del supervisor (DD-26).
- **Bloques 1·2·3 + dialog-fix + var-docs + modal bulk W26 (sesiones previas): HECHOS.** El bulk W26 quedó en
  manos de los devs (fix = quitar `height:239px` del `:host`, el componente en Figma es Hug).
- **Bridge Figma `mcp__figma__*`:** vivo cuando se re-corre el plugin (WS port 9224).

## 🗺️ Lo que queda
0. **Unificar dirección + duración como campos del builder** (continuación de DD-26). Un solo sitio para
   filtrar conversaciones, sin el bloque "Criterios de transcripción" aparte. **Coste**: el builder necesita
   tipos de campo **enum** (dirección → `es`) y **número** (duración → `mayor/menor que`, con unidad), y
   **dirección vive también en el bloque de grabación** → toca ese flujo. Decisión abierta: hacerlo, o dejar
   dirección/duración como "filtros de coste" separados.
1. **PROMPT de la PPT del PUENTE código↔Figma** (sin redactar). La monta Claude Design; aquí solo el prompt.
   Specs (2026-06-22): audiencia devs pero accesible (la presenta Rafa) · 6-8 slides ~10 min · QUÉ (puente
   bidireccional, una fuente de verdad) + CÓMO (Theme Designer → DTCG → `tokens:import` → DS → `verify` →
   Cloudflare; vuelta = bridge MCP escribe metadata Dev Mode) + QUÉ GANAMOS (sin drift, feedback ~1 min).
2. **Bloque 4a (Figma, GUIADO con Rafa).** Una var a la vez + screenshot + reversible: (a) atar W/H de iconos
   companion a la var de font-size (huecos: button-default, inputtext); (b) sync de los 3 copys de General a
   los nodos de texto de Figma. Grep antes para no crear drift.
3. **Accionables de la charla de reglas** (en `/reglas`). Pendiente: hablar con backend (VAP/Lucas) — cerrar
   criterios (duración + tipificación) y backend sin UI · crear sección Repositorios (transcripción+
   tipificación) · módulo simulador de coste (vs mes anterior) · avanzar AED.

**Diferido:** Neutral gray/slate (equipo de Rafa) · W5 · Code Connect · Fase 4 AED · dark zinc vs cool.

## ⚠️ TRAMPAS / PROTECCIONES
- **AOT es el gate de plantillas**: `tsc`/`typecheck` NO type-checkean a fondo las plantillas. Corre
  `ng build supervisor` (AOT) antes de commitear cambios de binding. **El supervisor tiene su PROPIO
  `<sc-icon>`** (`shared/components/icon`, ya soporta `inherit`) — importa ese, no el del DS.
- **`withViewTransitions()` activo** (app.config.ts): navegación rápida (varios `location.href`/reload
  seguidos en pruebas) lanza `InvalidStateError: Transition was aborted` en consola → **benigno**, es el
  router abortando transiciones, no tu código. En uso normal no pasa.
- **Overlays PrimeNG (p-select/p-multiselect)** no fijan selección por click-CSS desde el preview de forma
  fiable; verifica las opciones por DOM, no la selección por click.
- **`kit-export-dtcg.json`**: vigilar si aparece sucio (viaja por el plugin → `design-tokens-sync`); puede
  cortar `verify` en el paso `tokens:export-clean`. **Esta sesión estaba limpio.** Si lo está, corre el
  subconjunto relevante (`ng build supervisor` AOT + typecheck + lint) en vez del verify entero.
- **sc-demo usa hash routing** (`/#/reglas`); el supervisor usa routing normal (`/conversaciones/reglas/...`).
- **`preview:live` zombie ensucia el export:** `pkill -f preview-live.mjs` antes de `verify`.
- **NUNCA `[skip ci]`** · **NUNCA borrar `design-tokens-sync`** · **`git add` NUNCA `.claude`** (stagea rutas
  explícitas o el dir de la feature).
- **Commits a main** → `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin ai slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Decisiones** → `docs/DECISIONS.md` · **Backlog** → `docs/ROADMAP.md` · **Mapa de docs** → `docs/DOCS-INDEX.md`.
- **Reglas/trampas** → `AGENTS.md` · **Tokens/loop** → `docs/guia-tokens.md` · **Customs** → `docs/customs-catalog.md`.
- **Builder de reglas (real)** → supervisor `features/memory/` · **Recorrido `/reglas`** → sc-demo (presentación).
