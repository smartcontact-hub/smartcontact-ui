# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-18**, tras aprobar el plan maestro (HEAD `6b95ad7`). Se SOBREESCRIBE en cada cierre.

---

## ▶️ EMPIEZA AQUÍ (prompt de arranque — léeme en orden)
1. **Lee este fichero entero** (estado + primera acción + trampas).
2. **Lee el plan maestro:** `~/.claude/plans/async-greeting-pumpkin.md` — es el norte (4 fases: Puente → Audit → Agent → AED).
3. **El *por qué* durable:** `docs/DECISIONS.md`. Reglas/trampas operativas: `AGENTS.md`.
4. **PRIMERA ACCIÓN de esta sesión:** Fase 1.1 — el **REWIRE de color de componente, empezando por toast + message**
   (ver §"PRIMERA ACCIÓN" abajo). NO empieces otra cosa; foco en eso.
5. **Cómo validar SIEMPRE antes de dar algo por hecho:** `npm run verify` (+ `CI=1 npm run e2e` si tocaste algo visual).
6. **Protocolo:** cada lote con su verificador VERDE; commits a main acaban en `Co-Authored-By: Claude Opus 4.8 (1M context)`;
   `git add` **nunca** incluye `.claude`.

---

## 🎯 Estado de un vistazo
**El puente Figma→código avanza, NO está completo.** Fluyen a código: primitivos (escala/radio/paleta + auto-import),
color **semántico**, **sizing** de componente, y **color de componente** (EMITIDO). Auditado: **0 huecos de primitivos**.

**Lo que falta para cerrar el puente:**
1. **REWIRE** del color de componente — el generador EMITE los `--sc-cmp-*` color pero el preset los tiene
   **hardcodeados** → **nadie los lee** todavía → el toast→sky **aún no se ve**. ESTO es lo inmediato.
2. **Chivato §7** (garantía de completitud).
3. Huecos **effects** (129) + **app** (6).

**El norte (del usuario):** cambiar CUALQUIER token en Figma → fluye solo al preview → lo ve → a main cuando quiere.
**Impecable y autosuficiente. No perseguir a un dev** (salvo bugs).

## 🗺️ Orden maestro (aprobado 2026-06-18) — el detalle está en el PLAN
- **Fase 1 — Puente:** 1.1 rewire (toast/msg → resto) · 1.2 chivato §7 · 1.3 effects/app · 1.4 mini-test.
- **Fase 2 — Audit DS:** clasificación AUTO-generada (standard/extended/custom/anidados/cobertura) como guard +
  capturas del **flujo real** (Supervisor). Es la **referencia dev-facing exhaustiva**.
- **Fase 3 — Agent:** inventario de la pantalla Figma → mapeo a la "pokédex" (nuestro DS) → esqueleto + preview.
  (Necesito el link del Figma del agent.)
- **Fase 4 — AED 1:1** (capstone, necesita el puente probado + bridge Figma).
- **Baja prioridad (tras las 4):** Code Connect (apuntando a NUESTRO repo, interim) + auto-documentar variables Figma.
- **En paralelo (sin bloquear):** doc-fixes one-time restantes · endurecer `preview:live` · W5 marca.

## 🔴 PRIMERA ACCIÓN — Fase 1.1: REWIRE de color de componente (Lote 2.2)
- **Qué:** repuntar el `colorScheme` de los componentes del preset (`projects/ui-smartcontact/src/lib/theme/sc-preset/*.ts`,
  26 con color) de hex hardcodeado a `var(--sc-cmp-*)`. Mismo patrón que la migración de sizing (W1c) pero color.
- **Cadencia:** POR TANDAS, **e2e tras cada una**. EMPEZAR por **toast + message** (el dolor: sky+transparencia).
  **Pausa tras la 1ª tanda** para que el usuario lo VEA en preview, luego seguir el resto (rewire completo).
- **VERIFICADOR (doble, IMPORTANTE):** (a) un guard que falle si un `colorScheme` deja **hex hardcodeado** para un slot
  que SÍ generamos (mata el 2º verde-mudo). (b) **value-equality:** el `var(--sc-cmp-*)` resuelto DEBE igualar el hex que
  estaba hardcodeado → no-op visual DEMOSTRABLE (donde difiera = cambio intencional a revisar).
- ⚠️ **OJO (sesgo cazado en el review):** el `e2e` del repo es de **MÉTRICA** (padding/radio) → puede NO cazar un cambio de
  COLOR. La **value-equality** es el verificador fuerte aquí, + revisión visual de toast/message. NO fiarse solo del e2e.
- Las divergencias de marca ya excluidas (`scripts/cmp-color-map.mjs` EXCLUDE: green-950, sky-info) se quedan a mano.

## ✅ YA HECHO (commits en main, verde)
- **`preview:live` + `preview:check`** — preview LOCAL instantáneo, doble-click en `preview/preview-componentes.command`
  / `preview/preview-supervisor.command`. Verificado por el usuario: **funciona** (`6cc4330`, carpeta `6b95ad7`).
- **Generador de color de componente** — `scripts/token-gen-cmp-color.mjs` + `scripts/cmp-color-map.mjs`: emite 652
  tokens `--sc-cmp-*` a `@sc-gen:cmp-color-{light,dark}`; transparencia → `color-mix`; auto-import extendido a `yellow`.
  **CERO cambio visual** (nadie los lee aún → falta el rewire) (`45a925f`). + test `scripts/__tests__/cmp-color-map.test.mjs`.
- **`scripts/docs-coherence.mjs`** — gate anti-drift de doc (en `verify`) + 13 incoherencias alineadas (`0ac6702`).
- Auditoría de primitivos: 0 huecos. Antes: `[skip ci]`/Cloudflare (`ce49d16`) · auto-import semántico (`6e3addd`) ·
  carril rápido (`dff887f`) · W2 (`74eeeff`).

## ⚠️ TRAMPAS / PROTECCIONES (no fallar aquí)
- **`preview:live` deja el export sucio si se cierra la ventana de golpe** (el restore no dispara). Cosmético (cada run
  re-baja el export); pendiente endurecer. Si ves `kit-export-dtcg.json` modificado sin querer: `git checkout -- <ruta>`.
- **NUNCA `[skip ci]`** en el commit de reset del workflow (Cloudflare lo obedece → congela el preview de rama).
- **NUNCA borrar la rama `design-tokens-sync`** (el plugin la necesita; ruleset 17705331; reset =
  `git push --force origin main:design-tokens-sync`).
- **Trampa "does not match"** del plugin = SHA viejo cacheado → re-abrir el plugin.
- **`git add` NUNCA incluye `.claude`.**
- El **`e2e` es de métrica, no de color** (ver PRIMERA ACCIÓN).

## El loop HOY (Figma → vivo)
1. Plugin Theme Designer → **Push Tokens** → rama `design-tokens-sync`.
2. `tokens-sync.yml` parte de main → `npm run tokens:import` (4 generadores) → `verify` + `e2e` → resetea rama + PR.
3. Carril rápido `tokens-check.yml` + `scripts/token-report.mjs` → veredicto en cristiano en ~1 min.
4. **Preview LOCAL instantáneo:** doble-click `preview/*.command`. **Preview por rama:** Cloudflare (`…sc-demo.pages.dev`).
5. Gusta → merge PR → prod (`sc-demo.pages.dev` / `sc-supervisor.pages.dev`).

## 👥 Colaboración (equipo, incl. la diseñadora con el repo ya clonado)
Guía paso a paso (preview con los docks, loop Figma→código, **git pull/push para no-devs**) en `docs/ppt-proyecto.md`.
Resumen: la diseñadora normalmente **solo hace `git pull`** (sus cambios van por Figma, no por git); el código lo
pusheamos el usuario y yo. Ante conflicto → avisar, no pelear.

## 🟡 RECAP que el usuario PIDIÓ (al cerrar lotes)
Lenguaje **mega-dumb, sin ai slop, conciso**: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Plan maestro** → `~/.claude/plans/async-greeting-pumpkin.md`. **Decisiones** → `docs/DECISIONS.md`.
- **Reglas/trampas** → `AGENTS.md`. **Colaboración** → `docs/ppt-proyecto.md`. **Tokens/loop** → `docs/guia-tokens.md`.
- **Mapa de docs** → `docs/DOCS-INDEX.md`. **Inventario de componentes** → `docs/inventory.md`.
