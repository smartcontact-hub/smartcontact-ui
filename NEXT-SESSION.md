# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-19**, **FASE 3 (AGENT) HECHA** + auditoría de tokens (soft-blue re-sync) +
> var-docs de Figma (primitivos) — sobre el puente PROBADO (DD-21) y el Audit CERRADO (pokédex +
> galería de uso). HEAD-DD `eb7dbbb` (**DD-23**). Siguiente = **PARIDAD de nombres (rename a Kit) →
> var-docs script · W5 (espera validación) · Code Connect · Fase 4 AED** (ver §GRANDES BLOQUES).
> SOBREESCRIBE en cada cierre.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero** (estado + primera acción + trampas).
2. **Plan maestro:** `~/.claude/plans/async-greeting-pumpkin.md` (el norte: Puente→Audit→Agent→AED).
   Detalle de la última sesión: `~/.claude/plans/retomamos-el-ds-de-whimsical-sparrow.md`.
3. **El *por qué* durable:** `docs/DECISIONS.md` (último = **DD-23**). Reglas/trampas: `AGENTS.md`.
4. **PRIMERA ACCIÓN:** ver §PENDIENTE — lo más vivo es **W5** (espera TU validación en Figma) y el
   **script de var-docs**.
5. **Validar SIEMPRE:** `npm run verify` (+ `CI=1 npm run e2e` si tocas algo visual). `npm run usage:capture`
   regenera la galería de uso (sirve supervisor :4290).
6. **Protocolo:** cada lote con su verde; commits a main acaban en
   `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`; `git add` **nunca** incluye `.claude`.

---

## 🎯 Estado de un vistazo
- **Fase 1 — Puente: CERRADA y PROBADA** (DD-21).
- **Fase 2 — Audit: CERRADA** — 2.1 pokédex (`audit:components`) + 2.2 **galería de uso real**
  (sc-demo `/uso`: captura Playwright que escanea el DOM del Supervisor por componentes `sc-*` =
  verdad de campo; guard `usage:check` sin navegador). (`b9f3e53`)
- **Fase 3 — Agent: HECHA** — app **`projects/agent`** (dashboard oscuro) + componente DS nuevo
  **`sc-gauge`** (anillo SVG). Montada 100% con el DS. `npm run preview:live -- agent`. (`44033ef`)
- **Auditoría de tokens** — `soft-blue` re-sincronizado al `cyan` del Kit; el chivato §7 lo BLOQUEA 1:1
  (no se vuelve a desviar en silencio). (`ea3962b`)
- **cmp-color-rewire** adelgazado al guard vivo (quitada la value-equality circular; 318→137 líneas). (`08dfe46`)
- **var-docs de Figma** — **530** variables con code-syntax + descripción (todos los primitivos con token
  `--sc-*` directo + 336 component own-token). Las renames (cyan→soft-blue, slate→gray, sky→electric-blue)
  ya se ven en Figma **Dev Mode**.

## 🗺️ Orden maestro: Puente ✅ → Audit ✅ → Agent ✅ → **AED (Fase 4, pendiente)**

## 🔴 GRANDES BLOQUES PENDIENTES (a planificar — orden propuesto)
1. **PARIDAD DE NOMBRES (rename a nombres del Kit) — decisión Rafa 2026-06-19. VA PRIMERO.**
   El token `--sc-*` debe llamarse IGUAL que la variable en Figma; no más rename de marca ("si en Figma
   es cyan, en código `--sc-color-cyan`"). Renombrar `--sc-color-{soft-blue→cyan, electric-blue→sky,
   gray→slate}` (blue ya coincide) en TODO: primitivos (`01-primitive.css`), semántico/capas, preset
   `base.ts` (families/surface/ramp), SCSS de TODOS los componentes, apps (supervisor/sc-demo/agent),
   `palette-map.mjs` (→ identidad), generadores/auto-import, y re-apuntar las var-docs de Figma
   (code-syntax → `--sc-color-cyan-*` etc.). El rol de marca (Soft Blue / Electric Blue / Gray) vive en
   la DESCRIPCIÓN, no en el nombre. Refactor ANCHO pero conceptualmente simple. **SUPERSEDE el
   "auto-derive soft-blue"** (al renombrar ya no hay rename que derivar; §7 pasa a identidad trivial).
   Cuidado: find-replace con frontera (`--sc-color-gray-` exacto; `gray` es palabra común).
2. **var-docs script (~811) — DESPUÉS de la paridad** (si no, se re-hace el code-syntax). Faltan ~669
   sizing de componentes DS (alias a scale) + 142 semantic. NO hay atajo puro-Figma (daría primitivos
   `--sc-scale`/`--sc-color` y CONFUNDE; convención = `--sc-spacing-*` sizing, `--sc-bg/text-*` semantic).
   Receta: node-script lee `kit-export-dtcg.json` + `sizing-map`/`color-map`/`cmp-color-map` →
   `{var-Figma → token idiomático}` → bulk-write con `figma_execute`. 530 ya hechas (primitivos +
   component own-token). El bridge ESCRIBE ✓.
3. **W5 — marca al Kit — ESPERA VALIDACIÓN DE RAFA** (independiente del resto). Pintado el antes/después
   (warn ámbar→amarillo; dark gris-SC→zinc) + STAR en BACKLOG Figma (`khNq9dJKNi13pNllrqm6dx`, frame
   `13268:3769`). Si valida → `base.ts` (`yellow:'yellow'` / surface dark=`ramp('zinc')`) + quitar EXCLUDE
   warn/surface en `cmp-color-map.mjs` + regenerar + verify + screenshot. warn=contenido; dark→zinc=amplio.
4. **Code Connect (baja prioridad) — DESPUÉS de la paridad.** Prerequisito OK: la Kit tiene 5080
   componentes + 172 component-sets (mapeables). PERO necesita `@figma/code-connect` + **token Figma
   válido** (el REST está caducado → publish bloqueado) + ~49 ficheros `figma.connect()` apuntando a
   nuestro repo. El audit exhaustivo sigue siendo la ref dev-facing principal.
5. **Fase 4 — AED 1:1** (capstone; plan maestro §4). Flujo config/aed 1:1 con Figma; necesita el bridge.
6. **Menores:** W4 gaps (`sc-tag` size, `sc-avatar` px → retirar copias locales del Supervisor);
   descripciones de variables restantes.

## ⚠️ TRAMPAS / PROTECCIONES
- **`preview:live` zombie ensucia el export** (pasó hoy): un `preview-live.mjs` viejo re-baja el export de
  la rama → `tokens:export-clean` falla. Arreglo: `pkill -f preview-live.mjs && git checkout HEAD --
  projects/design-tokens/scripts/kit-export-dtcg.json
  projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css && npm run tokens:import`.
- **Figma bridge = `mcp__figma__*`** (figma-console-mcp). Si cae: re-correr el plugin **Desktop Bridge**.
  **OJO doble-instancia:** si hay 2 servers (puertos 9223/9224) el plugin engancha al equivocado →
  `lsof -nP -iTCP:9223 -iTCP:9224 -sTCP:LISTEN`, mata el stale, reabre el plugin. **REST token caducado**
  (`figma_get_file_data`/`figma_take_screenshot` → 403): usa `figma_execute` + `figma_capture_screenshot`
  (van por el plugin, no por REST).
- **var-docs en Figma:** los nombres Figma usan el Kit (cyan/slate/sky); el code-syntax pone el nombre DS
  (`--sc-color-soft-blue/gray/electric-blue-*`).
- **NUNCA `[skip ci]`** en el reset del workflow (Cloudflare lo obedece → congela el preview).
- **NUNCA borrar la rama `design-tokens-sync`** (ruleset; reset = `git push --force origin main:design-tokens-sync`).
- **`git add` NUNCA incluye `.claude`.**

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin ai slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Plan maestro** → `~/.claude/plans/async-greeting-pumpkin.md` · **Decisiones** → `docs/DECISIONS.md` (DD-23).
- **Reglas/trampas** → `AGENTS.md` · **Colaboración** → `docs/ppt-proyecto.md` · **Tokens/loop** → `docs/guia-tokens.md`.
- **Inventario de componentes** → `docs/inventory.md` · **Galería de uso** → sc-demo `/uso` · **Mapa de docs** → `docs/DOCS-INDEX.md`.
