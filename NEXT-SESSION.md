# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-18**, Fase 1.1 (puente de color) COMPLETA (HEAD `91ae6e6`). Se SOBREESCRIBE en cada cierre.

---

## ▶️ EMPIEZA AQUÍ (prompt de arranque — léeme en orden)
1. **Lee este fichero entero** (estado + primera acción + trampas).
2. **Lee el plan maestro:** `~/.claude/plans/async-greeting-pumpkin.md` — es el norte (4 fases: Puente → Audit → Agent → AED).
3. **El *por qué* durable:** `docs/DECISIONS.md`. Reglas/trampas operativas: `AGENTS.md`.
4. **PRIMERA ACCIÓN de esta sesión:** Fase 1.2 — el **CHIVATO §7** (ver §"PRIMERA ACCIÓN" abajo). Fase 1.1 (rewire de
   color) ya está hecha y en main. ⚠️ Antes de tocar tokens, mira la 1ª TRAMPA (preview:live zombie ensucia el export).
5. **Cómo validar SIEMPRE antes de dar algo por hecho:** `npm run verify` (+ `CI=1 npm run e2e` si tocaste algo visual).
6. **Protocolo:** cada lote con su verificador VERDE; commits a main acaban en `Co-Authored-By: Claude Opus 4.8 (1M context)`;
   `git add` **nunca** incluye `.claude`.

---

## 🎯 Estado de un vistazo
**El puente de COLOR de componente está VIVO y completo** (Fase 1.1 ✅, sello 2026-06-18, HEAD `91ae6e6`). Fluyen a
código: primitivos, color **semántico**, **sizing** de componente, y **color de componente LEÍDO** por los 20 componentes
con `colorScheme`. Un cambio de color de componente en Figma ahora SE VE. Auditado: **0 huecos de primitivos**.

**Lo que falta para cerrar el puente:**
1. **Chivato §7** (garantía de completitud) — Fase 1.2, lo inmediato.
2. Huecos **effects** (129) + **app** (6) — Fase 1.3.
3. **Mini-test** end-to-end — Fase 1.4 (puerta).

**Decisión de marca DIFERIDA (Rafa, 2026-06-18):** "primero el puente, marca después". El repunte preservó 2 divergencias
de marca SIN cambiar pixeles (vía EXCLUDE): **warn = ámbar** (no yellow/orange del Kit) y **superficie oscura = gris SC**
(no zinc). Rafa quiere ALINEAR al Kit (warn amarillo + zinc) pero como paso DELIBERADO con preview de toda la app → es el
**W5**, no parte del puente. Verlas: `node scripts/cmp-color-rewire.mjs report <comp>`.

**El norte (del usuario):** cambiar CUALQUIER token en Figma → fluye solo al preview → lo ve → a main cuando quiere.
**Impecable y autosuficiente. No perseguir a un dev** (salvo bugs).

## 🗺️ Orden maestro (aprobado 2026-06-18) — el detalle está en el PLAN
- **Fase 1 — Puente:** 1.1 rewire de color ✅ · **1.2 chivato §7 (siguiente)** · 1.3 effects/app · 1.4 mini-test.
- **🔍 AUDITORÍA DE TOKENS (Rafa la pidió para el FINAL del puente, `/audit-design-system`):** confirmar que TODAS las
  paletas del `~/Downloads/design-tokens.json` oficial (= mismo formato/valores que nuestro kit-export) quedan PERFECTAS
  en el DS. Mapa Tailwind→marca en memoria [[palette-rename-map-tailwind-to-brand]]. **Hallazgo ya cazado (2026-06-18):**
  3/4 paletas clave perfectas (blue→Primary, slate→Gray, sky→Electric-Blue), pero **`cyan→soft-blue` DESFASADO** (los 11
  valores difieren un pelín) porque `soft-blue` está CURADO A MANO (fuera de `@sc-gen`) sin guard. Fix: re-sync soft-blue↔
  cyan, idealmente AUTO-derivarlo + un parity-guard de familias curadas (que no se vuelva a desfasar). Auditar TODAS, no solo las 4.
- **Fase 2 — Audit DS:** clasificación AUTO-generada (standard/extended/custom/anidados/cobertura) como guard +
  capturas del **flujo real** (Supervisor). Es la **referencia dev-facing exhaustiva**.
- **Fase 3 — Agent:** inventario de la pantalla Figma → mapeo a la "pokédex" (nuestro DS) → esqueleto + preview.
  (Necesito el link del Figma del agent.)
- **Fase 4 — AED 1:1** (capstone, necesita el puente probado + bridge Figma).
- **Baja prioridad (tras las 4):** Code Connect (apuntando a NUESTRO repo, interim) + auto-documentar variables Figma.
- **En paralelo (sin bloquear):** doc-fixes one-time restantes · endurecer `preview:live` · W5 marca.

## 🔴 PRIMERA ACCIÓN — Fase 1.2: CHIVATO §7 (garantía de completitud)
Fase 1.1 (rewire de color) **HECHA y en main** (ver YA HECHO). Lo inmediato es el **chivato §7**: extender
`token-parity.mjs` para que recorra **TODO** el export y cada token sea: espejado-OK / divergente-a-propósito /
"cambió pero nadie lo recoge → ROJO con la razón". Mata el verde-mudo en CUALQUIER capa (incl. las sin generador).
- **VERIFICADOR:** test de DOBLE CARA (fixture que no fluye → ROJO; fixture que fluye → VERDE).
- El chivato debe vigilar las divergencias de marca EXCLUIDAS en `cmp-color-map.mjs` (warn-ámbar, surface-gris): si Figma
  cambia uno de esos slots, avisar para re-decidir (es el mecanismo sostenible de la lista EXCLUDE, no se desfasa).
- (Alternativa si Rafa quiere: arrancar el **W5** = alinear warn→amarillo + dark→zinc, con preview de TODA la app antes de
  commitear. Es decisión de marca, no del puente.)

## ✅ YA HECHO (commits en main, verde)
- **🌉 REWIRE de color COMPLETO (Fase 1.1)** — los 20 componentes con `colorScheme` leen ya `var(--sc-cmp-*)`:
  toast+message (`a325b31`) + los otros 18 (`91ae6e6`). **306 slots no-op repuntados, value-equality DEMOSTRADA**;
  40 divergencias de marca preservadas SIN cambiar pixeles. Probado en runtime (preview): `--p-*` fluye por `--sc-cmp-*`,
  colores idénticos, warn sigue ámbar, el cascade `.sc-dark` flipa light↔dark.
  - **Verificador nuevo `npm run tokens:cmp-rewire`** (`scripts/cmp-color-rewire.mjs`, en `verify`): resuelve los dos
    lados a RGBA y exige value-equality vs HEAD + sin hex hardcodeado para slots generados. Subcomandos:
    `report` (tabla noop/diverge/no-token) · `excludes` (claves EXCLUDE de los diverge) · `rewire` · `check`.
  - **Regla sostenible `isSemanticRef`** (`cmp-color-map.mjs`): el generador NO emite slots cuyo valor del Kit es ref
    SEMÁNTICA (`{primary/text/form/content}.*`) → se quedan semánticos (arrastran marca). No es lista a mano.
  - **EXCLUDE = solo 2 divergencias de marca** (surface-gris dark, warn-ámbar) que el Kit no infiere → W5 + chivato §7.
- **`preview:live` + `preview:check`** — preview LOCAL instantáneo, doble-click en `preview/preview-componentes.command`
  / `preview/preview-supervisor.command`. Verificado por el usuario: **funciona** (`6cc4330`, carpeta `6b95ad7`).
- **Generador de color de componente** — `scripts/token-gen-cmp-color.mjs` + `scripts/cmp-color-map.mjs`: emite 652
  tokens `--sc-cmp-*` a `@sc-gen:cmp-color-{light,dark}`; transparencia → `color-mix`; auto-import extendido a `yellow`.
  **CERO cambio visual** (nadie los lee aún → falta el rewire) (`45a925f`). + test `scripts/__tests__/cmp-color-map.test.mjs`.
- **`scripts/docs-coherence.mjs`** — gate anti-drift de doc (en `verify`) + 13 incoherencias alineadas (`0ac6702`).
- Auditoría de primitivos: 0 huecos. Antes: `[skip ci]`/Cloudflare (`ce49d16`) · auto-import semántico (`6e3addd`) ·
  carril rápido (`dff887f`) · W2 (`74eeeff`).

## ⚠️ TRAMPAS / PROTECCIONES (no fallar aquí)
- **`preview:live` export sucio — ENDURECIDO 2026-06-18 (`68b8c9d`).** Antes: zombies re-bajaban el export de la rama y
  `verify` pasaba en verde igual (regenera contra el export sucio). Ahora: anti-zombie (mata instancias previas + PID
  file), restore en `process.on('exit')`, y **guard `tokens:export-clean`** (primero en `verify`) que FALLA en local si
  `kit-export-dtcg.json` ≠ HEAD (se salta en CI, donde el sync aplica el export sobre main a propósito). Si aún ves el
  export sucio: `pkill -f preview-live.mjs && git checkout HEAD -- <export> <01-primitive.css> && npm run tokens:import`.
- **RED DE SEGURIDAD color fuera de paleta (`68b8c9d`+ siguiente):** un color elegido en Figma que NO esté en una primitiva
  ya NO crashea el sync entero — `token-gen-cmp-color` lo OMITE + avisa (⚠), el resto fluye, y `token-report` lo explica en
  cristiano + sugiere la primitiva más cercana. (Diagnóstico del experimento de Rafa: el `#0369a1` era Tailwind-sky default,
  no su sky; su `sky` = `electric-blue`, mismos 11 valores. El export sano fluye solo.)
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
