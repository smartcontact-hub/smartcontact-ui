# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-22** (sesión 2). Tanda casi cerrada: **Bloques 1·2·3 + dialog-fix + var-docs Figma HECHOS**.
> DD-24 (icono↔font-size) **EJECUTADA en el DS Y en la app** (153 companion del supervisor → `inherit`).
> Commits en `main`: `9ba5415 · 3d7a7cf · ce9010c · 67a21c9 · f697fe7` (+ este cierre).
> **Solo queda lo de Figma (Bloque 4a + sync de copys), que es GUIADO con Rafa.** SOBREESCRIBE en cada cierre.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. **PLAN DE LA TANDA:** `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md` (5 bloques; 1·2·3·4b hechos).
3. **El *por qué* durable:** `docs/DECISIONS.md` (DD-24 EJECUTADA DS+app · DD-25 gap footer · sync var-docs).
4. **PRIMERA ACCIÓN — Bloque 4a (Figma, GUIADO con Rafa).** El bridge `mcp__figma__*` está vivo (WS port **9224**).
   Dos cosas, una variable a la vez + screenshot para confirmar + reversible:
   - **(a) Atar W/H de iconos companion** a la var de font-size del texto (md=`app/font/size`; sm/lg=`{cmp}/sm·lg/font`).
     Huecos conocidos: **button-default** (icono raw → `app/font/size`); **inputtext** (el TEXTO raw → font-size del
     input; el icono ya cuelga vía iconfield).
   - **(b) Sync de los 3 copys de General a los nodos de texto de Figma** (ventana.title, aviso.title→"Recepción
     de conversaciones", alerting_label→"Mostrar"). Grep antes para no crear drift.
5. **Validar:** `npm run verify`. Si tocas pantallas del supervisor → `node scripts/component-audit.mjs --write`.
6. **Protocolo:** commits a main → `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`;
   `git add` **nunca** `.claude`; **nunca** `[skip ci]`; **nunca** borrar `design-tokens-sync`.

---

## 🎯 Estado de un vistazo
- **Bloque 1 (DD-24, DS): HECHO** (`9ba5415`). `sc-icon` (DS) gana `inherit`; 11 companion del DS + QA.
- **Bloque 2 (Contact Center): HECHO** (`3d7a7cf`). Topbar `sc-button` (servicio/agentes/grupos) + copys es/en/fr/pt.
  **idiomas: cerrados** — las traducciones EN/FR/PT verificadas (ES es el de Rafa).
- **Fix gap footer sc-dialog (DD-25): HECHO** (`ce9010c`). 0px→10.5px, 13 dialogs.
- **Bloque 3 (DD-24, app): HECHO** (`f697fe7`). 153 companion del supervisor → `inherit`. El `<sc-icon>` del
  supervisor es un **wrapper propio** (`shared/components/icon`) — le añadí `inherit` (lo cazó el AOT).
  Standalone + controles deliberados (transport del reproductor, toolbar filters, back rule-builder) pinneados
  a propósito. Validado AOT + verify + render en vivo.
- **Bloque 4b (var-docs Figma): HECHO.** 33 vars de color re-apuntadas (codeSyntax + desc) a cyan/sky/slate.
- **Bridge Figma `mcp__figma__*`: VIVO** (WS port 9224). Conectado a "Smart-Contact Design System".

## 🗺️ Lo que queda
1. **Bloque 4a (Figma, GUIADO):** atar W/H de iconos a font-size (button-default, inputtext) + sync de los 3
   copys de General a Figma. Ver §EMPIEZA AQUÍ.
2. **Bloque 5:** cierre (push + reseal + DDs) — hecho este cierre; repetir al acabar 4a.

**Diferido:** Neutral gray/slate (equipo de Rafa) · W5 · Code Connect · Fase 4 AED.

## ⚠️ TRAMPAS / PROTECCIONES
- **El supervisor tiene su PROPIO `<sc-icon>`** (`shared/components/icon`, no el del DS). Si tocas iconos de la
  app, recuerda que es ese wrapper (ya soporta `inherit`).
- **Figma `figma_execute` da "timeout" (7s) en batches** pero **suele aplicar igual** — confirma releyendo, no
  reintentes a ciegas. Sube `timeout` (≤30000) o trocea.
- **Tocar pantallas del supervisor** que cambie USO de componentes DS → `component-audit.mjs --write`. (Cambiar
  solo `[size]` de un icono NO desfasa el manifiesto.)
- **`preview:live` zombie ensucia el export:** `pkill -f preview-live.mjs` antes de `verify`.
- **Bridge Figma**: si cae, re-correr el plugin **Desktop Bridge**; doble-instancia 9223/9224 → usa el vivo.
- **NUNCA `[skip ci]`** · **NUNCA borrar `design-tokens-sync`** · **`git add` NUNCA `.claude`**.

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin ai slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Plan** → `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md` · **Decisiones** → `docs/DECISIONS.md`.
- **Reglas/trampas** → `AGENTS.md` · **Tokens/loop** → `docs/guia-tokens.md` · **Customs** → `docs/customs-catalog.md`.
- **Inventario** → `docs/inventory.md` · **Galería de uso** → sc-demo `/uso` · **Mapa de docs** → `docs/DOCS-INDEX.md`.
