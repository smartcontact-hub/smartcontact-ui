# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-19**. **PARIDAD de nombres EJECUTADA** (soft-blue→cyan, electric-blue→sky, gray→slate;
> DD-23) + **General (Contact Center) HECHO** (chips-vía-modal · radios DS · line-heights tokenizadas).
> Hallazgo nuevo → **regla icono↔font-size** (DD-24). HEAD-DD `edebe85` (**DD-24**).
> Siguiente = **el PLAN DE LA TANDA** (5 bloques), ver §EMPIEZA AQUÍ. SOBREESCRIBE en cada cierre.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero** (estado + primera acción + trampas).
2. **PLAN DE LA TANDA (lo vivo):** `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md` — 5 bloques con
   el sparring registrado. **Es el norte de la próxima sesión.** (Plan maestro de fondo:
   `~/.claude/plans/async-greeting-pumpkin.md`.)
3. **El *por qué* durable:** `docs/DECISIONS.md` (últimos = **DD-23** paridad · **DD-24** regla icono↔font-size).
4. **PRIMERA ACCIÓN:** Bloque 1 del plan → `sc-icon` gana `size="inherit"` + companion icons de los componentes DS.
5. **Validar SIEMPRE:** `npm run verify`. Si tocas pantallas del supervisor → regenera el manifiesto
   (`node scripts/component-audit.mjs --write`) y la captura (`npm run usage:capture`) o `verify` falla.
6. **Protocolo:** cada lote con su verde; commits a main acaban en
   `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`; `git add` **nunca** incluye `.claude`.

---

## 🎯 Estado de un vistazo
- **Fases 1-3 (Puente · Audit · Agent): CERRADAS.**
- **Paridad de nombres: EJECUTADA** (DD-23 → `89be2be` código + `4da83a6` docs). El código usa cyan/sky/slate;
  `palette-map`=identidad; alias `--sc-spacing-*` blindado 1:1 con test.
- **General (Contact Center): HECHO** — estados "no disponible" vía `sc-dialog` + `sc-chip` removible + pop al
  añadir (`dd41c25`); radios→`sc-radiobutton` + line-heights tokenizadas (`4a0d0b3`). Verificado en preview.
- **Regla icono↔font-size (DD-24): DECIDIDA, SIN implementar** — los companion icons siguen el font-size del
  componente; `--sc-icon-size-*` queda solo para iconos sueltos.
- **Bridge Figma `mcp__figma__*`: CAÍDO** — re-abrir el plugin Desktop Bridge para el Bloque 4 (Figma).
- Commits de la sesión en main: `89be2be · 4da83a6 · dd41c25 · 4a0d0b3 · 026435b · edebe85` (+ este handoff).

## 🗺️ Lo que queda → EL PLAN DE LA TANDA
1. `sc-icon` `inherit` + companion icons de los componentes DS.
2. Terminar Contact Center: Agentes/Grupos (topbar `p-button`→`sc-button`) + los 3 copys de General a Figma.
3. Migrar el RESTO de companion icons de las apps (criterio de cierre por grep).
4. **[necesita el bridge]** Figma Kit: atar W/H de iconos a la var de font-size (huecos: button-default,
   inputtext) + re-apuntar las **530 var-docs** a cyan/sky/slate.
5. Cierre (push + reseal + DDs).

**Diferido:** Neutral gray/slate (equipo de Rafa) · W5 (espera validación) · Code Connect · Fase 4 AED ·
var-docs restantes (~811, tras re-apuntar las 530).

## ⚠️ TRAMPAS / PROTECCIONES
- **Tocar pantallas del supervisor DESFASA** el manifiesto y la captura de uso (pasó en este cierre): regenera
  `audit:components --write` + `usage:capture` o `verify` falla.
- **`preview:live` zombie ensucia el export**: `pkill -f preview-live.mjs` antes de `verify`.
- **Bridge Figma = `mcp__figma__*`** (figma-console-mcp). Si cae: re-correr el plugin **Desktop Bridge**.
  Doble-instancia 9223/9224 → mata el stale. REST caducado (403) → usa `figma_execute` + `figma_capture_screenshot`.
- **Figma Dev Mode MIENTE hasta el Bloque 4**: las 530 var-docs aún apuntan a los nombres viejos de color
  (soft-blue / electric-blue / gray, ya renombrados en código) → re-apuntarlas a cyan / sky / slate.
- **NUNCA `[skip ci]`** · **NUNCA borrar `design-tokens-sync`** · **`git add` NUNCA `.claude`**.

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin ai slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Plan de la tanda** → `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md` · **Decisiones** → `docs/DECISIONS.md` (DD-24).
- **Reglas/trampas** → `AGENTS.md` · **Tokens/loop** → `docs/guia-tokens.md` · **Customs** → `docs/customs-catalog.md`.
- **Inventario** → `docs/inventory.md` · **Galería de uso** → sc-demo `/uso` · **Mapa de docs** → `docs/DOCS-INDEX.md`.
