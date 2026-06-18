# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-18**, Fase 1.1 (color) + 1.2 (chivato §7) + 1.3 (completitud §8) + **generador de sombras (Etapa 1)** + paridad de tipografía + hand-off durable COMPLETOS (HEAD `6e32953`). SOBREESCRIBE en cada cierre.

---

## ▶️ EMPIEZA AQUÍ (prompt de arranque — léeme en orden)
1. **Lee este fichero entero** (estado + primera acción + trampas).
2. **Lee el plan maestro:** `~/.claude/plans/async-greeting-pumpkin.md` — es el norte (4 fases: Puente → Audit → Agent → AED).
3. **El *por qué* durable:** `docs/DECISIONS.md`. Reglas/trampas operativas: `AGENTS.md`.
4. **PRIMERA ACCIÓN:** Fase **1.3** — cerrar huecos effects/app/semantic-common (ver §"PRIMERA ACCIÓN" abajo). Fase 1.1
   (color), 1.2 (chivato §7) y la paridad de tipografía YA están en main. ⚠️ Antes de tocar tokens, mira la 1ª TRAMPA
   (preview:live zombie ensucia el export). **Opciones alternativas si Rafa lo pide:** adelgazar `cmp-color-rewire` (cleanup
   confirmado-seguro, ver YA HECHO) · W5 (marca, necesita la página de backlog en Figma) · auditoría de tokens (soft-blue).
5. **Cómo validar SIEMPRE antes de dar algo por hecho:** `npm run verify` (+ `CI=1 npm run e2e` si tocaste algo visual).
6. **Protocolo:** cada lote con su verificador VERDE; commits a main acaban en `Co-Authored-By: Claude Opus 4.8 (1M context)`;
   `git add` **nunca** incluye `.claude`.

---

## 🎯 Estado de un vistazo
**El puente está VIVO y GUARDADO** (HEAD `cf004ed`). Fluyen+se-verifican: primitivos (color §7), semántico, sizing,
**color de componente** leído por los 20 componentes con `colorScheme`, **tipografía** (font-size + line-height parity)
y ahora **TODOS los grupos del export** (§8 censo de completitud: ningún grupo queda DIFERIDO).
Un cambio de cualquiera de esos en Figma SE VE y, si no llega al código, salta ROJO (nada en silencio).

**Lo que falta para cerrar el puente:**
1. **Sombras — Etapa 2 (rewire + preview):** Rafa decidió **PUENTE REAL** (generador). Etapa 1 HECHA (`6e32953`):
   `token-gen-effects` emite las 58 sombras a `--sc-cmp-*-shadow` (`@sc-gen:effects`), CERO cambio visual (nadie
   las lee aún). **Falta la Etapa 2:** re-cablear los ~50 presets de su hex hardcoded a `var(--sc-cmp-*-shadow)`,
   con value-equality (como Fase 1.1). **OJO visual:** unas sombras hoy están tintadas de slate (base.ts
   `--sc-shadow-*`) y otras ya en negro puro del Kit (hex hardcoded en presets) → el rewire las unifica al valor
   del Kit; **pausa + preview para que Rafa apruebe el delta** antes de commitear. Tras el rewire, §8 sube de
   "generadas" a "value-check componente==Kit".
2. **Mini-test** end-to-end — Fase 1.4 (puerta). Con eso el puente queda PROBADO completo.

**Decisión de marca DIFERIDA (Rafa, 2026-06-18):** "primero el puente, marca después". El repunte preservó 2 divergencias
de marca SIN cambiar pixeles (vía EXCLUDE): **warn = ámbar** (no yellow/orange del Kit) y **superficie oscura = gris SC**
(no zinc). Rafa quiere ALINEAR al Kit (warn amarillo + zinc) pero como paso DELIBERADO con preview de toda la app → es el
**W5**, no parte del puente. Verlas: `node scripts/cmp-color-rewire.mjs report <comp>`.

**El norte (del usuario):** cambiar CUALQUIER token en Figma → fluye solo al preview → lo ve → a main cuando quiere.
**Impecable y autosuficiente. No perseguir a un dev** (salvo bugs).

## 🗺️ Orden maestro (aprobado 2026-06-18) — el detalle está en el PLAN
- **Fase 1 — Puente:** 1.1 rewire de color ✅ · 1.2 chivato §7 ✅ · 1.3 completitud §8 ✅ · **1.4 mini-test (siguiente)**.
- **🔍 AUDITORÍA DE TOKENS (Rafa la pidió para el FINAL del puente, `/audit-design-system`):** confirmar que TODAS las
  paletas del `~/Downloads/design-tokens.json` oficial (= mismo formato/valores que nuestro kit-export) quedan PERFECTAS
  en el DS. Mapa Tailwind→marca en memoria [[palette-rename-map-tailwind-to-brand]]. **Hallazgo ya cazado (2026-06-18):**
  3/4 paletas clave perfectas (blue→Primary, slate→Gray, sky→Electric-Blue), pero **`cyan→soft-blue` DESFASADO** (los 11
  valores difieren un pelín) porque `soft-blue` está CURADO A MANO (fuera de `@sc-gen`) sin guard. Fix: re-sync soft-blue↔
  cyan, idealmente AUTO-derivarlo + un parity-guard de familias curadas (que no se vuelva a desfasar). Auditar TODAS, no solo las 4.
- **Fase 2 — Audit DS:** clasificación AUTO-generada (standard/extended/custom/anidados/cobertura) como guard +
  capturas del **flujo real** (Supervisor). Es la **referencia dev-facing exhaustiva**.
- **Fase 3 — Agent:** inventario de la pantalla Figma → mapeo a la "pokédex" (nuestro DS) → esqueleto + preview.
  **RECON HECHO 2026-06-18** (Figma `Dle87qs0Pjq0OjIaaCfmm7`, nodo **`382:14079`** "Agent - Prueba colores", DARK).
  Es un **dashboard de AGENTE de contact center**, FLAT (mockup, solo 2 instancias → mapear por reconocimiento visual,
  no por estructura). **Pokédex (reúsa el DS ~90%):** tiles KPI → `sc-section-card` · estados ("Conexión/Desconexión",
  Tipificación N1/N2/N3, "No atendidas 54") → `sc-tag`/`sc-badge` · Grupos Asignados (search+filas) → `sc-inputtext`(search)
  + `sc-toggleswitch` + `sc-icon` · perfil → `sc-avatar` + `sc-button` · **tabla central de llamadas → `sc-datatable`** (la
  pieza grande) · iconos dirección llamada (verde/rojo) → `sc-icon` severidad · toggle claro/oscuro → `sc-toggleswitch` ·
  footer estado ("Conversando", contadores) → composición + `sc-button`/`sc-badge`. **ÚNICO GAP claro:** el **donut/gauge
  "234 Conv. Totales"** (anillo verde/rojo) — el DS NO tiene gauge → decidir (PrimeNG `knob`/chart vs SVG custom). El resto
  es composición/layout (shell del agente, grid de KPIs, footer-bar), no componentes nuevos. NO crear tokens salvo imprescindible.
- **Fase 4 — AED 1:1** (capstone, necesita el puente probado + bridge Figma).
- **Baja prioridad (tras las 4):** Code Connect (apuntando a NUESTRO repo, interim) + auto-documentar variables Figma.
- **En paralelo (sin bloquear):** doc-fixes one-time restantes · endurecer `preview:live` · W5 marca.

## 🔴 PRIMERA ACCIÓN — Sombras Etapa 2: rewire del preset + preview
La Etapa 1 (generador de sombras) está HECHA y en main (`6e32953`): los `--sc-cmp-*-shadow` ya existen en
`@sc-gen:effects`, **sin que nadie los lea**. **Etapa 2 = re-cablear los ~50 presets** de su `shadow:` hardcoded
(hex) a `var(--sc-cmp-<comp>-shadow)`, con **value-equality** (mismo método que Fase 1.1: probar que cada repoint
es no-op O un cambio intencional al valor del Kit). **PAUSA + PREVIEW obligatoria:** unas sombras hoy van tintadas
de slate (`--sc-shadow-*` de base.ts), otras ya en negro del Kit → el rewire las unifica al Kit; Rafa lo ve en
preview y aprueba el delta antes del commit. **Verificador:** §8 sube de "generadas" a value-check
(componente lee `--sc-cmp-*-shadow` == Kit) + e2e. Mapa de qué preset usa qué sombra: `grep 'shadow:'
projects/ui-smartcontact/src/lib/theme/sc-preset/`.
- **Luego Fase 1.4 — mini-test (PUERTA):** export-fixture con UN cambio de CADA clase (primitivo, color semántico,
  color de componente, sizing, **sombra**) → `tokens:import` + `tokens:parity` asserta que cada cambio aparece en
  el CSS y §8 sigue VERDE. Committed = regresión para siempre. + pasada manual real (Rafa en Figma). Puente PROBADO.
- **W5 (cuando Rafa quiera):** alinear warn→amarillo + dark→zinc. Necesita **ponerlo en Figma en la página de BACKLOG**
  (`figma.com/design/khNq9dJKNi13pNllrqm6dx/...?node-id=13097-13517`) para ver ANTES/DESPUÉS antes de commitear. Decisión de
  marca, no del puente. Necesita el bridge Figma (`mcp__figma__*`).
- **Auditoría de tokens (Rafa, fin del puente):** ver §"Orden maestro" — soft-blue↔cyan desfasado ya cazado por §7.

## ✅ YA HECHO (commits en main, verde)
- **🌑 GENERADOR DE SOMBRAS — Etapa 1 (`6e32953`, CERO cambio visual):** Rafa decidió **puente real** para las
  sombras. `scripts/token-gen-effects.mjs` + `scripts/effects-map.mjs` leen `aura/effects` del Kit y emiten 58
  sombras a `--sc-cmp-*-shadow` en `@sc-gen:effects` (05-extensions.css) — hermano de `token-gen-cmp-color`. Px
  literal + color de efecto exacto del Kit; las 71 `*.focus.ring.shadow` transparentes NO se emiten (foco por
  outline). En `tokens:import` + `verify`. Test doble cara (`effects-map.test.mjs`). **Nadie las lee aún** → el
  preset sigue con el hex hardcoded; el rewire es la Etapa 2 (ver PRIMERA ACCIÓN).
- **🧩 COMPLETITUD §8 (Fase 1.3) — los 3 grupos restantes CUBIERTOS** (`cf004ed`): `aura/semantic/common` (60),
  `aura/app` (6), `aura/effects` (129) ya NO quedan DIFERIDO. **Sin generadores nuevos** (habrían sido
  sobre-ingeniería: estos valores ya fluyen por REFERENCIA —§1·2·7—, están cableados en `base.ts`, divergen a
  propósito o no se consumen). `scripts/coverage-map.mjs` = buckets declarativos: cada hoja cae en EXACTAMENTE uno;
  una hoja NUEVA del Kit sin bucket → ROJO (garantía de completitud). `token-parity` §8 aplica + **value-check
  fuerte de la rampa `primary`** (primary.N == --sc-color-blue-N, 1:1 por hex → caza un desfase mudo de la marca).
  Test doble cara (`coverage-map.test.mjs`). Reparto real: semantic/common = 15 sizing(§4) + 11 primary(value-check)
  + 29 cableado-base + 3 value-match + 1 aura-default + 1 divergencia(foco) · app = 6 no-consumido · effects = 70
  foco-outline + 59 sombras. **Sombras = DECISIÓN abierta de Rafa** (ver §"Lo que falta para cerrar el puente").
- **🧷 HAND-OFF DURABLE (que no se desfase solo)** — `docs:coherence` Check D (`de0d285`, LOCAL-only como
  `check-export-clean`): el sello `HEAD \`<sha>\`` de ESTE fichero debe EXISTIR en git → el hand-off no puede
  mentir sobre su estado. **Por qué:** el sello se quedó stale EN SILENCIO una vez (una nota cayó tras sellar).
  Criterio de Rafa: "cuanto más creemos, más fácil perderse" → NO más docs; la durabilidad la da el verificador.
  **Regla dura (memoria `session-close-protocol`):** el commit que actualiza NEXT-SESSION es el ÚLTIMO de la
  sesión; el sello = HEAD real; nada sustantivo aterriza después. Doble cara probada (sello real→verde, fantasma→rojo).
- **🔤 PARIDAD DE TIPOGRAFÍA (gate nuevo)** — `tokens:type-parity` REESCRITO de informe-siempre-verde a **gate real**:
  cada `typography.font.size.N` Y `typography.line.height.N` del Kit tiene su `--sc-font-size-N`/`--sc-line-height-N`
  1:1 por valor (15/15 hoy). **Antes el line-height se escapaba** (el informe solo miraba font-size) — Rafa lo exigió.
  Test de doble cara (`token-type-parity.test.mjs`). El `font-size` LITERAL lo sigue bloqueando `tokens:guard` rule 5.
  **OJO (verificado):** font-size/line-height están **CURADOS A MANO** (fuera de `@sc-gen`, sin generador) → un cambio de
  Figma NO llega solo al código (como soft-blue). El verificador es la única defensa HOY. **Mejora de raíz (auditoría de
  tipos):** AUTO-generar las primitivas de tipografía del export (como la escala) → fluyen solas y el verificador pasa a red de respaldo.
- **🧹 AUDITORÍA DE GUARDIANES (13 agentes + crítico)** — veredicto: el suite NO está sobre-ingenierizado (12 guardianes,
  cada uno caza un bug distinto), PERO hay andamiaje de migración muerto. HECHO: docs:guard substring→frontera (bug real).
  **PENDIENTE (confirmado-seguro, retomar):** **adelgazar `cmp-color-rewire.mjs`** — la value-equality del `check` es
  CIRCULAR/muerta (compara el token vs `HEAD:` del preset ya repunteado → token==token trivial; un cambio de Figma lo caza
  `tokens:gen-cmp-color`, no esto). Conservar SOLO la rama VIVA (hex hardcodeado en un slot generado = guard anti-regresión).
  Borra ~238 LOC sin perder cobertura. (NO tocar `tokens:parity` el grande — es esencial; `type-parity` ya NO se corta, se mejoró.)
- **🚨 CHIVATO §7 (Fase 1.2)** — `token-parity.mjs` §7 + `scripts/palette-map.mjs`: verifica que cada **primitiva de
  color** del DS sigue 1:1 a su fuente del export (mapa Tailwind→marca). Era el hueco de §1-6 (nunca miraban color
  primitivo) por el que `soft-blue` se desfasó del `cyan` SIN que nadie lo viera — ahora un desfase mudo = ROJO.
  Divergencias conscientes (green-950 marca, soft-blue pendiente-audit, azure huérfano) listadas → no fallan. + censo
  §7b (qué grupo del export está cubierto/diferido). Test de DOBLE CARA (`palette-map.test.mjs`).
- **🪂 RED DE SEGURIDAD color fuera de paleta** — `token-gen-cmp-color` non-fatal + `token-report` traduce y sugiere la
  primitiva más cercana (el `#0369a1` del experimento ya no crashea el sync) (`6b509be`).
- **🛡️ preview:live endurecido** — anti-zombie + restore fiable + guard `tokens:export-clean` en verify (`68b8c9d`).
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
