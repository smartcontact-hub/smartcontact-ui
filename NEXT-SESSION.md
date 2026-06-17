# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir. Estado *volátil* + qué hacer ahora. Se SOBREESCRIBE en cada cierre.
> **Plan completo y vivo:** `~/.claude/plans/async-greeting-pumpkin.md` (léelo — es el norte de ahora).
> El *por qué* durable: `docs/DECISIONS.md`.

## 🎯 Estado de un vistazo (CORREGIDO 2026-06-17)
**El espejo Figma→código NO está completo — y ese es el trabajo activo.** Fluyen: primitivos, color
**semántico**, sizing de componente. **NO fluyen (huecos auditados):** **color de COMPONENTE** (toast,
botón… los 692 tokens `aura/component/light|dark` — esto se comió el cambio sky→toast del usuario),
**effects** (129: sombras/blur), **app** (6). Cuando el usuario cambia algo de un hueco, el sistema da
**VERDE pero no hace nada** ("verde-mudo") — **ese es el enemigo a matar.**

**El norte (clarísimo, del usuario):** el puente debe ser **impecable y autosuficiente** — cambia
CUALQUIER token en Figma → fluye solo → lo ve. **No quiere perseguir a un dev** para nada (salvo bugs).

**Principio rector a implementar:** *todo token del export DEBE (a) fluir por un generador, (b) ser
divergencia/custom documentada, o (c) DISPARAR EL CHIVATO.* El chivato = **garantía de completitud**.

## 🔴 HILO ACTIVO: completar el puente (ver el PLAN). Orden que el usuario aprobó:
1. **`npm run preview:live`** (NO existe — su intento dio "Missing script"). Preview LOCAL instantáneo
   (<2s, HMR). Dejárselo en **doble-click `.command`** (no es de terminal). → flujo de 3 niveles que él
   propuso y adoptamos: **local (instante) → preview link (~2min, compartible) → main (prod).**
2. **Generador de COLOR DE COMPONENTE** — UNO general (no uno por componente), hermano de
   `token-gen-color.mjs`: `token-gen-cmp-color.mjs` + `cmp-color-map.mjs`. Lee `aura/component/*` color,
   transparencia `#rrggbbaa` → `color-mix(... var(--sc-color-X) N%, transparent)`. Decisión por-fila una
   vez (`mirror` Kit vs `brand`; **default brand**). Diseño detallado en el PLAN. Esfuerzo M.
3. **Chivato §7** en `token-parity.mjs` — recorre TODO el export; flowed / divergente / "cambió y nadie
   lo recoge → ROJO con la razón". Mata el verde-mudo en toda capa.
4. Cerrar huecos: effects, app, semantic-common no-color.
5. CI ~2 min (cache Chromium + separar preview del gate) · 6. publish privado (diferible).

## Lotes de marca/docs (en paralelo)
- **W5** — decisiones de marca CON **comparativo visual antes/después** en el **Supervisor**, **anclado en
  una página "backlog" de Figma** (que LO VEA, no lo adivine; necesita bridge `mcp__figma__*`): iconos
  Outlined/Rounded · dark zinc/navy · grises a11y · **primary-dark 3.01:1** (sub-AA conocido) · texto sobre
  primarios fuertes (ej. amarillo: blanco encima = ilegible).
- **W3 — Code Connect** (DECIDIDO: **sí**, como referencia). · **W4** — `sc-avatar [size]`·`sc-tag xs`·
  `ScConfirmRequest icon?`. · **W-docs** — guía (3 niveles preview · duplicado Figma · "does not match"→
  re-abrir plugin · texto oscuro/claro · mapa de cobertura) + drift. · **W-gate** — 68 tests métrica→snapshot.

## Consumo / distribución (resuelto-mayormente)
UN DS, dos profundidades del MISMO paquete. **GitHub Packages privado** (ya cableado; encender
`publish:packages` al mergear verde). Equipo-A usa tokens `--sc-*`, equipo-B "el tema"
(`provideSmartContactUi()`); ninguno clona el repo. Usuario CONFIRMÓ que **sí consumen** (no es moot).
Diferible hasta que entren. Detalle: `docs/consumer-onboarding.md §0`.

## El loop HOY (Figma → vivo)
1. Plugin Theme Designer → **Push Tokens** → rama `design-tokens-sync` (**NUNCA borrarla**; ruleset
   17705331; reset = `git push --force origin main:design-tokens-sync`).
   - **Trampa "does not match"** = SHA viejo cacheado del plugin → **re-abrir el plugin** (re-lee el SHA).
2. `tokens-sync.yml` parte de main → `tokens:import` → verify + e2e → resetea rama + abre/actualiza PR
   (`if: always()`). **Commit de reset SIN `[skip ci]`** (Cloudflare lo obedece → congelaría el preview).
3. **Carril rápido** `tokens-check.yml` + `token-report.mjs` (paralelo) → veredicto parity+a11y EN
   CRISTIANO en ~1 min (resumen run + comentario PR). Sin IA.
4. **Preview por rama:** `design-tokens-sync.sc-demo.pages.dev` + `…sc-supervisor.pages.dev`.
5. Gusta → merge PR → prod (`sc-demo.pages.dev` / `sc-supervisor.pages.dev`).

## YA HECHO (commits en main, CI verde)
Fix preview congelado `[skip ci]`/Cloudflare (`ce49d16`) · **auto-import** de familias de primitiva
referenciadas por semánticos (`6e3addd` — un color semántico nuevo del Kit, p.ej. yellow/sky, se importa
solo) · carril rápido `tokens-check`+`token-report` (`dff887f`) + mensaje "fuera de paleta" honesto +
sugiere primitiva más cercana (`7e76ae9`) · **W2** READMEs+badges+metadata npm (`74eeeff`) + `org-profile.md`
(→ paso TUYO: crear repo `smartcontact-hub/.github`, pegar en `profile/README.md`) · trampas en AGENTS.

## Hechos clave / cómo
- **Gate**: `npm run verify` (+ `CI=1 npm run e2e` si visual) + `npm run docs:guard`.
- **Generadores** (en `tokens:import`): `token-gen.mjs` (primitivos + auto-import) · `token-gen-component.mjs`
  (sizing) · `token-gen-color.mjs` (color semántico). **Pronto: `token-gen-cmp-color.mjs` (color componente)
  + effects.** Fuentes únicas con parity: `sizing-map.mjs`, `color-map.mjs` (+ `cmp-color-map.mjs`). NO
  editar zonas `@sc-gen` a mano.
- **Chivato a11y**: `token-parity.mjs §6b` (contraste WCAG). **Pronto §7**: garantía de completitud.
- **App local**: `npm run start:supervisor` (4400) · `npx ng serve sc-demo`.
- Commits acaban con `Co-Authored-By: Claude Opus 4.8 (1M context)`. `git add` NUNCA incluye `.claude`.

## 🟡 RECAP que el usuario PIDIÓ (no olvidar al cerrar lotes)
Lenguaje **mega-dumb, sin ai slop, conciso**: qué se hizo, por qué, conclusiones, pendiente, y lo que NO
se hizo a drede.

## Índice
- Plan → `~/.claude/plans/async-greeting-pumpkin.md`. Decisiones → `docs/DECISIONS.md`.
- Consumo → `docs/consumer-onboarding.md §0`. Loop/tokens → `docs/guia-tokens.md`. Onboarding →
  `docs/ppt-proyecto.md`. Reglas/trampas → `AGENTS.md`. Mapa docs → `docs/DOCS-INDEX.md`.
