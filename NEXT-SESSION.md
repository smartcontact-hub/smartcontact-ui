# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-22**. Sesión larga y productiva: **Bloque 1 (icono↔font-size, DD-24) EJECUTADO en el DS** ·
> **Bloque 2 (Contact Center: topbar `sc-button` + copys Recepción)** · **fix gap footer sc-dialog (DD-25)** ·
> **Bloque 4b (var-docs de color re-apuntadas en Figma)**. Commits en `main`: `9ba5415 · 3d7a7cf · ce9010c`
> (+ este cierre). **Queda: Bloque 3 (iconos de la app) + Bloque 4a (Figma atar W/H) + revisar copys EN/FR/PT.**
> SOBREESCRIBE en cada cierre.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero** (estado + primera acción + trampas).
2. **PLAN DE LA TANDA:** `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md` (5 bloques; 1·2·4b hechos).
3. **El *por qué* durable:** `docs/DECISIONS.md` (últimos = **DD-24 EJECUTADA** · **DD-25** gap footer · sync var-docs).
4. **PRIMERA ACCIÓN — Bloque 3 (iconos de la app), ahora MECÁNICO:** migrar los companion `<sc-icon [size]="N">`
   de supervisor/agent → `size="inherit"`. **Hallazgo clave que lo desbloquea:** el supervisor YA resetea
   `button { font: inherit }` (`supervisor/styles/_reset.scss`), así que los iconos en botones heredan solo —
   **no hace falta el plumbing por-botón de Bloque 1** (ese era para la lib/sc-demo, sin ese reset).
   - **Scope:** `grep -rnE '<sc-icon[^>]*\[size\]="[0-9]' projects/supervisor/src` → **203** (0 en agent).
     Distribución: ~188 son ≤16px (probables **companion** → migrar); 18-44px suelen ser **standalone** (page
     headers, avatares, ilustraciones → **se quedan pin**). **NO sed a ciegas:** clasificar companion vs
     standalone. **NO tocar `[size]="22"`** (fuera de rampa, fiel a Figma).
   - **Criterio de cierre:** tras migrar, `grep '<sc-icon \[size\]="[0-9]'` debe dejar SOLO standalone.
5. **Validar:** `npm run verify`. Si tocas pantallas del supervisor → regen manifiesto
   (`node scripts/component-audit.mjs --write`); `usage:check` NO se desfasó esta vez (no hizo falta capturar).
   QA visual con el preview del supervisor (`ng serve supervisor`, hash-routing `/#/...`).
6. **Protocolo:** commits a main acaban en `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`;
   `git add` **nunca** `.claude`; **nunca** `[skip ci]`; **nunca** borrar `design-tokens-sync`.

---

## 🎯 Estado de un vistazo
- **Bloque 1 (DD-24 icono↔font-size): EJECUTADO en el DS** (`9ba5415`). `sc-icon` gana `size="inherit"`; 11
  companion del DS migrados. Hallazgos: (a) icono **hermano** del texto → el host porta el font-size por
  variante (sc-search md/sm/lg, command-palette head); (b) `<button>` resetea a ~13.3px → wrapper transparente
  (`font-size: inherit`), hecho por-componente en el DS. **md no-leak** confirmado.
- **Bloque 2 (Contact Center): HECHO** (`3d7a7cf`). Topbar `p-button`→`sc-button` en servicio/agentes/grupos
  (migré también servicio para no dejar 2 de 3 hermanas). Copys General es/en/fr/pt: ventana.title +
  aviso.title→"Recepción de conversaciones" + alerting_label→"Mostrar". **EN/FR/PT los traduje yo →
  PENDIENTE revisión de Rafa.** Claves/código `alerting_*` siguen como internos a propósito.
- **Fix gap footer sc-dialog (DD-25): HECHO** (`ce9010c`). El `[modal-actions]` proyectado ahora es la fila
  flex con el gap → botones 0px→10.5px. Arregla los 13 dialogs de una vez.
- **Bloque 4b (var-docs Figma): HECHO.** 33 vars de color (cyan/sky/slate) re-apuntadas (codeSyntax +
  descripción) a los nombres del Kit. Dev Mode ya no miente. (Eran 33, no 530.)
- **Bridge Figma `mcp__figma__*`: VIVO** (WebSocket port **9224**, fallback de 9223). Conectado a "Smart-Contact
  Design System".

## 🗺️ Lo que queda
1. **Bloque 3** — barrer el RESTO de companion icons de supervisor/agent a `inherit` (ahora mecánico, ver
   §EMPIEZA AQUÍ). Criterio de cierre por grep.
2. **Bloque 4a** — Figma: atar W/H de iconos companion a la var de font-size (huecos: **button-default**
   icono raw→`app/font/size`; **inputtext** texto raw→font-size del input). Guiado, una var a la vez + screenshot.
3. **Revisar copys EN/FR/PT** de Bloque 2 (Rafa, nativo ES, validó solo el ES).
4. **Bloque 5** — cierre (push + reseal + DDs) — hecho este cierre; repetir al acabar la próxima.

**Diferido:** Neutral gray/slate (equipo de Rafa) · W5 · Code Connect · Fase 4 AED.

## ⚠️ TRAMPAS / PROTECCIONES
- **Bloque 3 NO es sed a ciegas:** clasificar companion (≤16px, junto a texto) vs standalone (headers/avatares/
  ilustraciones, se quedan pin). `[size]="22"` NO se toca.
- **Tocar pantallas del supervisor DESFASA el manifiesto:** `node scripts/component-audit.mjs --write` antes de verify.
- **`preview:live` zombie ensucia el export:** `pkill -f preview-live.mjs` antes de `verify`.
- **Figma `figma_execute` da "timeout" (7s) en batches** pero **suele aplicar igual** — confirma releyendo el
  estado, no reintentes a ciegas. Sube `timeout` (hasta 30000) o trocea.
- **Bridge Figma**: si cae, re-correr el plugin **Desktop Bridge**; doble-instancia 9223/9224 → usa el vivo.
- **NUNCA `[skip ci]`** · **NUNCA borrar `design-tokens-sync`** · **`git add` NUNCA `.claude`**.

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin ai slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Plan de la tanda** → `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md` · **Decisiones** → `docs/DECISIONS.md` (DD-25).
- **Reglas/trampas** → `AGENTS.md` · **Tokens/loop** → `docs/guia-tokens.md` · **Customs** → `docs/customs-catalog.md`.
- **Inventario** → `docs/inventory.md` · **Galería de uso** → sc-demo `/uso` · **Mapa de docs** → `docs/DOCS-INDEX.md`.
