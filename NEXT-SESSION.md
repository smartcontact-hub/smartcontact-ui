# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-22** (sesión 2). Tanda casi cerrada: **Bloques 1·2·3 + dialog-fix + var-docs Figma HECHOS**.
> DD-24 (icono↔font-size) **EJECUTADA en el DS Y en la app** (153 companion del supervisor → `inherit`).
> Todo pusheado en `main` (último: `63825c6`). **Mañana arranca con la PPT del PUENTE** (redactar el prompt para
> Claude Design — specs ya decididas, §EMPIEZA AQUÍ) → luego **Bloque 4a** (Figma, guiado). SOBREESCRIBE al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. **PLAN DE LA TANDA:** `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md` (5 bloques; 1·2·3·4b hechos).
3. **El *por qué* durable:** `docs/DECISIONS.md` (DD-24 EJECUTADA DS+app · DD-25 gap footer · sync var-docs).
4. **PRIMERA ACCIÓN — PPT del PUENTE código↔Figma (redactar el PROMPT para Claude Design).** Rafa monta la PPT
   en Claude Design; aquí solo se redacta el prompt. Specs YA decididas con él (2026-06-22):
   - **Audiencia:** **devs**, contando NUESTRO pipeline — pero **accesible / no extremadamente técnico**: la
     **presenta Rafa (no-dev)**, así que las slides deben sostener la explicación solas (poco depende de él en vivo).
   - **Tamaño:** corta — **6-8 slides, ~10 min**.
   - **Mensaje:** las tres → **QUÉ** es + **CÓMO** funciona (el flujo) + **QUÉ GANAMOS**.
   - **Tono:** **mixto** — gancho visual + 1-2 diagramas claros del flujo, poco texto. (Lo eligió Claude; Rafa
     dijo "me gustan todas".)
   - **Contenido (esqueleto a refinar al redactar el prompt):**
     - **QUÉ:** puente bidireccional código↔Figma; UNA sola fuente de verdad para los design tokens.
     - **CÓMO (el flujo):** Theme Designer/plugin → export DTCG (`kit-export-dtcg.json`) → `npm run tokens:import`
       genera las capas CSS `--sc-*` → el DS Angular las consume → `verify` (parity + scale auditor + guards) caza
       el drift → desplegado en Cloudflare. Vuelta: el bridge MCP escribe metadata en Figma (codeSyntax, vars)
       para que Dev Mode muestre el código real (justo lo de Bloque 4b: 33 var-docs re-apuntadas).
     - **QUÉ GANAMOS:** una sola fuente de verdad; diseño y código no driftan; feedback rápido (carril a11y/parity
       en ~1 min); Dev Mode no miente.
   - **Arranque:** redacto el prompt con esto → Rafa lo revisa → lo manda a Claude Design. **La PPT NO la hago yo.**
5. **Bloque 4a (Figma, GUIADO con Rafa).** Bridge `mcp__figma__*` vivo (WS port **9224**). Una var a la vez +
   screenshot + reversible:
   - **(a) Atar W/H de iconos companion** a la var de font-size (md=`app/font/size`; sm/lg=`{cmp}/sm·lg/font`).
     Huecos: **button-default** (icono raw → `app/font/size`); **inputtext** (el TEXTO raw → font-size del input).
   - **(b) Sync de los 3 copys de General a los nodos de texto de Figma** (ventana.title, aviso.title→"Recepción
     de conversaciones", alerting_label→"Mostrar"). Grep antes para no crear drift.
6. **Validar:** `npm run verify`. Si tocas pantallas del supervisor → `node scripts/component-audit.mjs --write`.
7. **Protocolo:** commits a main → `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`;
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
1. **PPT del PUENTE (1er punto):** redactar el prompt para Claude Design (specs decididas, §EMPIEZA AQUÍ). La
   PPT la monta Claude Design, no nosotros.
2. **Bloque 4a (Figma, GUIADO):** atar W/H de iconos a font-size (button-default, inputtext) + sync de los 3
   copys de General a Figma. Ver §EMPIEZA AQUÍ.
3. **Bloque 5:** cierre (push + reseal + DDs) — hecho este cierre; repetir al acabar.

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
