# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-18**, **🌉 FASE 1 (EL PUENTE) PROBADA COMPLETA** + **Fase 2.1 (pokédex auto-generada)** — bridge (1.1-1.4 + sombras + tipografía) + hand-off durable + `audit:components` (HEAD `38ae2bd`). Siguiente = **Fase 2.2 (capturas del flujo real) + Rafa confirma standard/extended**. SOBREESCRIBE en cada cierre.

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
**EL PUENTE ESTÁ PROBADO COMPLETO** (HEAD `d3c247a`). Fluyen+se-verifican: primitivos (color §7), semántico, sizing,
**color de componente**, **sombras** (effects → `--sc-cmp-*-shadow`, leídas por el preset), **tipografía** (parity)
y **TODOS los grupos del export** (§8 censo de completitud). El **mini-test e2e (1.4)** prueba que un cambio en el
Kit FLUYE al CSS por CADA generador (regresión para siempre). Un cambio de cualquier clase en Figma SE VE y, si no
llega al código, salta ROJO (nada en silencio). **La Fase 1 (el puente) está CERRADA.**

**Único pendiente del puente (de Rafa, no bloquea):** la **pasada manual real** — cambiar un token de CADA clase
en Figma (un primitivo, un color semántico, una sombra, un sizing) → Push Tokens → verlo en el preview de rama.
Es la confirmación humana del loop entero; lo automatizado ya está PROBADO.

**Decisión de marca DIFERIDA (Rafa, 2026-06-18):** "primero el puente, marca después". El repunte preservó 2 divergencias
de marca SIN cambiar pixeles (vía EXCLUDE): **warn = ámbar** (no yellow/orange del Kit) y **superficie oscura = gris SC**
(no zinc). Rafa quiere ALINEAR al Kit (warn amarillo + zinc) pero como paso DELIBERADO con preview de toda la app → es el
**W5**, no parte del puente. Verlas: `node scripts/cmp-color-rewire.mjs report <comp>`.

**El norte (del usuario):** cambiar CUALQUIER token en Figma → fluye solo al preview → lo ve → a main cuando quiere.
**Impecable y autosuficiente. No perseguir a un dev** (salvo bugs).

## 🗺️ Orden maestro (aprobado 2026-06-18) — el detalle está en el PLAN
- **Fase 1 — Puente:** 1.1 color ✅ · 1.2 chivato §7 ✅ · 1.3 completitud §8 ✅ · sombras ✅ · **1.4 mini-test ✅ → PUENTE CERRADO**.
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

## 🔴 PRIMERA ACCIÓN — Fase 2.2: capturas del flujo real + Rafa confirma standard/extended
**Fase 2.1 HECHA:** la pokédex auto-generada (`audit:components`) ya clasifica los 48 componentes en
`docs/inventory.md` + `docs/_component-status.json`. **Siguiente (2.2):** para cada componente **usado en el
Supervisor** (el manifiesto da el nº de usos), capturar con **Playwright** las pantallas reales donde aparece →
doc visual "cada componente + dónde se usa en la app". Se regeneran (no se quedan viejas). Decisión al construir:
¿capturas en un .md o página navegable en sc-demo?
- **2 juicios de Rafa pendientes (rápidos, no bloquean):** (1) revisar la columna **STANDARD vs EXTENDED** de la
  tabla y forzar las que discrepe en `scripts/component-audit-map.mjs` (`PROVENANCE_OVERRIDE`); (2) los **20
  componentes sin demo** (customs de flujo) — decidir si se les exige página demo (entonces el guard sube a fallo)
  o se documentan como "se ven en el flujo del Supervisor, no aislados". Hoy el guard los INFORMA, no bloquea.
- **Alternativas si Rafa prefiere saltar:** Fase 3 (Agent, recon hecho) · W5 (marca: warn→amarillo, dark→zinc) ·
  auditoría de tokens (soft-blue↔cyan) · adelgazar `cmp-color-rewire`. La **pasada manual del puente** ya la hizo Rafa ✅.
- **W5 (cuando Rafa quiera):** alinear warn→amarillo + dark→zinc. Necesita **ponerlo en Figma en la página de BACKLOG**
  (`figma.com/design/khNq9dJKNi13pNllrqm6dx/...?node-id=13097-13517`) para ver ANTES/DESPUÉS antes de commitear. Decisión de
  marca, no del puente. Necesita el bridge Figma (`mcp__figma__*`).
- **Auditoría de tokens (Rafa, fin del puente):** ver §"Orden maestro" — soft-blue↔cyan desfasado ya cazado por §7.

## ✅ YA HECHO (commits en main, verde)
- **📇 POKÉDEX AUTO-GENERADA (Fase 2.1, `38ae2bd`):** `scripts/component-audit.mjs` (`audit:components`, en verify)
  deriva del CÓDIGO por componente: provenance (CUSTOM/STANDARD/EXTENDED), base PrimeNG, API propia (CVA + nº
  inputs), anidados (sc-* sin sc-icon), demo y **uso real en el Supervisor**. Emite `docs/_component-status.json`
  + tabla en `docs/inventory.md` (zona `@audit:components`; sustituyó las tablas a mano que ya habían driftado —
  photo-upload mal clasificado). **48 comp: 14 custom · 11 standard · 23 extended · 27 usados en Supervisor.**
  standard/extended = heurística (CVA o ≥4 inputs) + override curado (`component-audit-map.mjs`, lo confirma Rafa).
  Guard FALLA por desfase; los 20 sin demo se INFORMAN (no bloquean). Test de la pura (`component-audit.test.mjs`).
- **🚪 MINI-TEST E2E — LA PUERTA (Fase 1.4, `d3c247a`):** `scripts/__tests__/bridge-e2e.test.mjs` prueba que un
  cambio en el export del Kit FLUYE al CSS por CADA generador, en un **sandbox** (copia de capas + export mutado,
  los generadores apuntados ahí por env `SC_KIT_EXPORT`/`SC_LAYERS_DIR`). 5 clases: primitivo, sizing, sombra,
  color semántico, color de componente. Si un generador deja de propagar → ROJO. Regresión para siempre. Corre en
  `test:unit` (verify). Los 5 generadores ganaron override por env (sin las env = rutas reales → todo intacto).
- **🌑 PUENTE DE SOMBRAS COMPLETO (`6e32953` gen + `e16fdd5` rewire):** Rafa decidió **puente real** (el Kit es el
  camino). **Etapa 1** — `token-gen-effects.mjs` + `effects-map.mjs` leen `aura/effects` y emiten 58 sombras a
  `--sc-cmp-*-shadow` en `@sc-gen:effects` (las 71 `*.focus.ring.shadow` transparentes NO, foco por outline). **Etapa
  2** — el preset YA lee `var(--sc-cmp-*-shadow)`: 47 sombras de componente repuntadas (no-op value-equal: el
  design-rem normaliza al mismo px que el token) + 6 de `base.ts` (formField + overlays) unificadas de slate al Kit
  (delta sutil, aprobado en preview). **Guard `tokens:effects-rewire`** (en verify): ningún preset puede volver a
  dejar un shadow hex hardcoded para un slot generado. Tests doble cara (`effects-map`, `effects-rewire`). Los
  `--sc-shadow-*` slate siguen definidos para consumidores directos. **Una sombra cambiada en Figma ahora fluye sola.**
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
