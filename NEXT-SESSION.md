# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir. Estado *volátil* + qué hacer ahora. Se SOBREESCRIBE en cada cierre.
> **Plan completo y vivo:** `~/.claude/plans/async-greeting-pumpkin.md` (léelo — es el norte de ahora).
> El *por qué* durable: `docs/DECISIONS.md`. Sello: 2026-06-18, HEAD tras Lote 2.1 + alineación de docs.

## 🎯 Estado de un vistazo
**El puente Figma→código avanza, NO está completo.** Fluyen a código: primitivos (escala/radio/paleta
+ auto-import), **color semántico**, **sizing de componente**, y AHORA **color de componente** (emitido).
Auditado 2026-06-18: **0 huecos de primitivos** (cada familia que el export usa está cubierta por valor;
las ausentes o nadie las usa o son divergencias de marca documentadas).

**Falta para cerrar el puente:** (1) **REWIRE** del color de componente — el generador EMITE los
`--sc-cmp-*-color` pero el preset aún tiene el color hardcodeado, así que todavía **nadie los lee**
(verde-mudo); (2) **chivato §7** (garantía de completitud); (3) huecos **effects** (129) + **app** (6).

**El norte (del usuario):** el puente debe ser **impecable y autosuficiente** — cambia CUALQUIER token en
Figma → fluye solo al preview → lo ve → a main cuando quiere. **No perseguir a un dev** (salvo bugs).

## 🔴 HILO ACTIVO: completar el puente (ver el PLAN). Orden:
1. **REWIRE del color de componente** (Lote 2.2) — repuntar el `colorScheme` de los 26 componentes del
   preset a `var(--sc-cmp-*)` para que el cambio SE VEA. **Por tandas, e2e tras cada una**, empezando por
   **toast/message** (el dolor del usuario: sky + transparencia). El generador espeja Figma → donde el píxel
   cambie es "ahora cuadra con Figma", no regresión. Decidido por el usuario: **rewire COMPLETO** (no parcial).
2. **Chivato §7** en `token-parity.mjs` — recorre TODO el export; cada token flowed / divergente / "cambió y
   nadie lo recoge → ROJO con la razón". Mata el verde-mudo en toda capa. (El audit de primitivos de hoy es
   justo lo que debe automatizar.)
3. Cerrar huecos: **effects** (sombras/blur) + **app** (6) + semantic-common no-color.
4. CI ~2 min (cache Chromium + separar preview del gate) · 5. publish privado (diferible).
6. **MINI-TEST de extremo a extremo** (puerta) → 7. **MISIÓN FINAL**: índice componetizado AED 1:1 con Figma.

## Lotes de marca/docs (en paralelo)
- **W5** — decisiones de marca CON comparativo visual antes/después en el Supervisor, anclado en página
  "backlog" de Figma (iconos · dark zinc/navy · grises a11y · primary-dark 3.01:1 · texto sobre primarios).
- **W3 — Code Connect** (sí, como referencia). · **W4** — `sc-avatar [size]`·`sc-tag xs`·`ScConfirmRequest icon?`.
- **Doc-alignment (en marcha):** audit de 21 hallazgos (2026-06-18) + `docs:coherence` ya en `verify`.
  Quedan one-time NO cubiertos por el check (ver "Pendiente doc" abajo).

## El loop HOY (Figma → vivo)
1. Plugin Theme Designer → **Push Tokens** → rama `design-tokens-sync` (**NUNCA borrarla**; ruleset
   17705331; reset = `git push --force origin main:design-tokens-sync`).
   - **Trampa "does not match"** = SHA viejo cacheado del plugin → **re-abrir el plugin**.
2. `tokens-sync.yml` parte de main → `tokens:import` (4 generadores) → verify + e2e → resetea rama + PR.
   **Commit de reset SIN `[skip ci]`** (Cloudflare lo obedece → congelaría el preview).
3. **Carril rápido** `tokens-check.yml` + `token-report.mjs` → veredicto en cristiano en ~1 min.
4. **Preview LOCAL instantáneo:** doble-click `preview-componentes.command` / `preview-supervisor.command`
   (`npm run preview:live`) — baja el export de la rama, regenera, `ng serve` con HMR, vigila la rama ~12s.
5. **Preview por rama** (Cloudflare) → gusta → merge PR → prod (`sc-demo` / `sc-supervisor.pages.dev`).

## YA HECHO (commits en main)
- **preview:live + preview:check** (doble-click local instantáneo + verificador) — `6cc4330`.
- **Generador general de color de componente** (`token-gen-cmp-color.mjs` + `cmp-color-map.mjs`, emisión a
  `@sc-gen:cmp-color-{light,dark}`; transparencia → `color-mix`; auto-import extendido a yellow; divergencias
  marca/orfanas en EXCLUDE) — `45a925f`. **CERO cambio visual** (nadie las lee aún → falta el rewire).
- **`docs:coherence`** (mecanismo anti-drift de doc, en `verify`) + alineación de 12 incoherencias.
- Antes: fix `[skip ci]`/Cloudflare (`ce49d16`) · auto-import semántico (`6e3addd`) · carril rápido
  (`dff887f`) · W2 READMEs+metadata (`74eeeff`).

## 🟡 Pendiente doc (one-time, NO cubierto por docs:coherence — del audit 2026-06-18)
- **Estado "publicado→aparcado"** (auto-safe): CHANGELOG (nota DD-17), ROADMAP:94 ("publicada"→"versionada"),
  playbook-archivar. **Registro docs (necesita-decisión):** foundations-rationale/convergence-manifesto →
  añadir nota DD-17 arriba, NO reescribir el cuerpo (mezclan histórico-aspiracional con estado).
- **"Trabajo ya hecho" presentado como pendiente** (necesita-decisión): `component-port-plan.md` + manifiesto §7
  (Mitad B ejecutada) → banner; DD-15 → blockquote "Superado por DD-19/DD-20" (patrón DD-11/DD-16).
- **Auto-safe sueltos:** `guia-tokens.md` ("solo zinc"→zinc+yellow), `org-profile.md` (falta URL Supervisor),
  `consumer-onboarding.md` (presente→condicional), `foundations-rationale.md:51` (refs slash→punto),
  history logs (refs `master-prompt-*` rotas), ROADMAP "Grises sutiles" (ratios → enlazar DD-19),
  `migration-safety.md` (doc-site→sc-demo), `customs-catalog.md` (fecha footer), inventory bulk-transcription (nota).
- **AGENTS paso 4 docs-generator**: ya reescrito a "documentar en docs/ + DOCS-INDEX".

## Hechos clave / cómo
- **Gate**: `npm run verify` (cadena completa, ver tabla README) + `CI=1 npm run e2e` si visual.
- **Generadores** (`tokens:import`): `token-gen.mjs` (primitivos + auto-import) · `token-gen-component.mjs`
  (sizing) · `token-gen-color.mjs` (color semántico) · `token-gen-cmp-color.mjs` (color de componente).
  Fuentes: `sizing-map.mjs`, `color-map.mjs`, `cmp-color-map.mjs`. **Pronto: effects.**
- **App local**: `npm run start:supervisor` (4400) · `npx ng serve sc-demo`.
- Commits acaban con `Co-Authored-By: Claude Opus 4.8 (1M context)`. `git add` NUNCA incluye `.claude`.

## 🟡 RECAP que el usuario PIDIÓ (al cerrar lotes)
Lenguaje **mega-dumb, sin ai slop, conciso**: qué se hizo, por qué, conclusiones, pendiente, y lo que NO
se hizo a drede.

## Índice
- Plan → `~/.claude/plans/async-greeting-pumpkin.md`. Decisiones → `docs/DECISIONS.md`.
- Consumo → `docs/consumer-onboarding.md §0`. Loop/tokens → `docs/guia-tokens.md`. Mapa docs → `docs/DOCS-INDEX.md`.
