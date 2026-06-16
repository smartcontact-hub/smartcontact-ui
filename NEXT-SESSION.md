# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir. Estado *volátil* + qué hacer ahora. Se SOBREESCRIBE en cada cierre.
> El *por qué* durable vive en `docs/DECISIONS.md` (DD-N). Plan: `~/.claude/plans/async-greeting-pumpkin.md`.

## Estado de un vistazo
**El espejo Figma→código está COMPLETO.** Sizing (DD-18) **y color** (DD-19) fluyen solos: cambias un
token en el Theme Designer → `tokens:import` → se auto-aplica al código (zonas `@sc-gen:*`) → preview.
Sin mano, respetando las divergencias de marca.

**Hecho esta sesión** (todo en `main`, CI verde):
- **Fix del loop** (`e2276ee`): `tokens-sync.yml` SIEMPRE resetea la rama al estado canónico (un revert
  ya no deja preview stale ni basura del plugin; `add` acotado; revert cierra el PR).
- **W0** (`690b98c`): `docs/ppt-proyecto.md` — presentación de onboarding para la diseñadora (Marta).
- **W-color** (`23bb9c7`): generador de color. `scripts/color-map.mjs` + `scripts/token-gen-color.mjs`
  + zonas `@sc-gen:semantic-color-{light,dark}` (02-semantic/07-dark) + chivato a11y §6b + `color-map.test.mjs`
  + DD-19. **value-preserving** (e2e 58/58, parity 41/41). Prueba de fuego pasada.
- **Doc de consumo** (`7cc8a5b`, `7f7261d`): `consumer-onboarding.md §0`.
- **W2 — READMEs + oficialización**: 3 READMEs nuevos (`components`, `sc-demo`, `supervisor`) + badges
  (Angular/PrimeNG/TS/License) en los 6 READMEs + **metadata npm** en los 3 paquetes (`description`,
  `keywords`, `license: UNLICENSED`, `author`, `homepage`, `bugs`, `repository.directory`) — verificado
  que viaja al `dist/` (build verde). + `docs/org-profile.md` (borrador). Drift corregido: el "port
  pendiente" (era mentira, ya hecho) en README raíz + `public-api.ts`.
  - `license: UNLICENSED` = propietario/privado (confirmable; cambiar a MIT/Apache solo si se abre).
  - **→ paso TUYO pendiente:** crear el repo público `smartcontact-hub/.github` y pegar `docs/org-profile.md`
    en `profile/README.md` (el agente no puede crear repos).
- **Fix del preview congelado** (`ce49d16`): el reset de `tokens-sync.yml` llevaba `[skip ci]` → Cloudflare
  se saltaba el build del preview de rama (prod mostraba el cambio, el preview no). Quitado (el bucle lo evita
  la regla de GITHUB_TOKEN) + trampa anotada en AGENTS Known Traps. Verificado: los 4 links sirven el cambio.
  Disparador: un push de radio del usuario (era prueba; **revertido** en `dde9d55`; PR #10/#11 cerrados).
- **Carril rápido de feedback "en cristiano"** (este commit): `.github/workflows/tokens-check.yml` +
  `scripts/token-report.mjs` (+ test, npm `tokens:report`). Corre SOLO parity+a11y y postea el veredicto
  **en cristiano** (resumen del run + comentario PR) en **~1 min** — el "¿es válido y por qué?" sin esperar
  los ~5 min del build+e2e+preview. Sin IA (reglas deterministas). NO es gate. → ROADMAP: plugin-monitor en
  Figma (tiempo real) + IA-sugiere-color-corregido.
- **Sesión de testing del loop (color):** color **semántico** (`primary.color`→ámbar/cian) **fluye** y se
  ve en preview; **per-componente** (`button.primary.background`) NO (footgun #1, a decidir A/C). El chivato
  a11y cazó un primary verde ilegible (1.92:1) → run rojo (¡funciona!). **Trampa nueva en AGENTS:** plugin
  "does not match" = SHA viejo cacheado → **re-abrir el plugin**. **Pendiente:** decidir el control A/C del
  footgun de color per-componente (A=chillar [rec] / C=divergencia declarada).

## 🔴 HILO ABIERTO (el usuario quiere SEGUIR aquí): CÓMO SE CONSUME EL DS
Compendio del tema → **`docs/consumer-onboarding.md §0`** (seguir AHÍ).
- **Modelo (resuelto):** UN DS, dos **profundidades**. Equipo **BI** = instala + `provideSmartContactUi()`
  → componentes PrimeNG tematizados, NO toca `--sc-*`. Equipo **Voz** = lo mismo + usa `--sc-*` +
  componentes `sc-*`. **Mismo paquete, misma marca, los dos blindados** (anti-PrimeNG). El tema *crudo*
  del plugin NO se distribuye. Los 4 sabores base (Aura/Material/Lara/Nora) = fundación elegida 1 vez =
  **Aura**; "jugar" con otros = salirse de la marca (decisión de PRODUCTO, no diseño/dev).
- **DECISIÓN PENDIENTE (no urge — proyecto NO lanzado):** ¿dónde se **publica** el DS para equipos
  externos? Hoy NO se publica (el Supervisor lo usa local por tsconfig paths). Para que instalen →
  encender `npm run publish:packages` (apagado desde DD-17, cuando Rafa era solo). **Registro: GitHub
  Packages (recomendado, el DS es dueño de su distribución) vs su GitLab.** → *Pendiente de que el
  usuario PREGUNTE a sus equipos: "¿podéis usar un token de solo-lectura de GitHub en vuestro CI de
  GitLab, o todo tiene que ser GitLab?"*. Cuando responda → **DD-20** + alinear el doc + encender publish.
- **Contexto:** dos equipos front en **GitLab**, repos propios. (Su repo es DEMO, su código NO hace
  falta → la "convergencia" se DESCARTA.)

## El loop HOY (Figma → vivo)
1. Diseño cambia token en Theme Designer → **Push Tokens** (rama `design-tokens-sync` — el plugin la
   NECESITA; **NUNCA borrarla**, ruleset 17705331; reset = `git push --force origin main:design-tokens-sync`).
2. `tokens-sync.yml` parte de main → `tokens:import` (primitivos + sizing + **color**) → verify + e2e →
   **resetea la rama limpia + abre/actualiza PR** (`if: always()`; un revert→cierra el PR).
   El commit de reset va **SIN `[skip ci]`** (`ce49d16`): el bucle ya lo evita la regla de GITHUB_TOKEN,
   y el `[skip ci]` además **congelaba el build de Cloudflare** del preview. NUNCA re-añadirlo (AGENTS Known Traps).
3. **Preview por rama (ON, ya rebuildea de verdad):** `design-tokens-sync.sc-demo.pages.dev` +
   `…sc-supervisor.pages.dev`. (El nombre `design-tokens-sync` SE QUEDA — decidido; se documenta, no se renombra.)
4. Gusta → merge PR a main → producción (`sc-demo.pages.dev` / `sc-supervisor.pages.dev`).

> **Carril rápido (paralelo al paso 2):** `tokens-check.yml` + `token-report.mjs` → veredicto parity+a11y
> EN CRISTIANO en ~1 min (resumen del run + comentario PR). El "¿válido y por qué?" sin esperar el preview.
> **Tiempos:** ver el cambio renderizado tiene suelo ~5 min (CI gate ~3 + Cloudflare ~1-2); ritmo bueno =
> 1 cambio → Push → ~5 min → mirar. Para explorar color rápido, **júzgalo en Figma** (instantáneo); empuja
> para validar. No es por "el primary toca muchos sitios" (recolorear es instantáneo) ni por los 2 links.

## Lotes pendientes (plan durable: `~/.claude/plans/async-greeting-pumpkin.md`)
- **W5** — decisiones de marca (TUYAS): iconos Outlined vs Rounded · dark zinc vs navy · grises a11y.
  **+ el primary dark = 3.01:1 (bajo AA)** que cazó el chivato §6b (allowlist `A11Y_KNOWN` en
  `token-parity.mjs`; ni gray-900 ni blanco llegan a AA sobre blue-400 → pide cambiar el color).
- **W4** — 3 gaps mecánicos: `sc-avatar [size]` px · `sc-tag` `xs` · `ScConfirmRequest icon?`.
- **W3** — mapa Figma↔componente (`docs/figma-map.json`; necesita el bridge `mcp__figma__*`).
- **W-gate (#85) — SECUNDARIO:** ~68 aserciones de métrica del e2e → snapshot, para que un cambio de
  **tamaño** mergee a main sin rojo. (El **color** NO lo necesita — el e2e no asercia color semántico.)
- **W-docs** — auditoría de drift al final (NO reescribir-todo; corregir solo lo desfasado).

## 🟡 RECAP que el usuario PIDIÓ (al acabar los lotes — no olvidar)
Darle en lenguaje **mega-dumb, sin ai slop, conciso**: qué se hizo, por qué, todas las conclusiones, lo
pendiente, y lo que NO se hizo a drede. (Lo pidió explícitamente.)

## Hechos clave / cómo
- **Gate**: `npm run verify` (+ `CI=1 npm run e2e` si visual) + `npm run docs:guard`.
- **3 generadores** (corren en `tokens:import`): `token-gen.mjs` (primitivos) · `token-gen-component.mjs`
  (sizing `--sc-cmp-*`) · `token-gen-color.mjs` (color, zonas `@sc-gen:semantic-color-*`). Fuentes
  únicas compartidas con parity: `sizing-map.mjs`, `color-map.mjs`. **NO editar zonas `@sc-gen` a mano.**
- **Chivato a11y**: `token-parity.mjs §6b` (contraste WCAG; gatea pares de alto contraste, informa los
  grises suaves; `A11Y_KNOWN` = sub-AA conocidos que no fallan).
- **App local**: `npm run start:supervisor` (4400) · `npx ng serve sc-demo`.
- **Rama de trabajo**: una por lote hasta verde; merge a main + watch CI. Commits acaban con
  `Co-Authored-By: Claude Opus 4.8 (1M context)`. `git add` nunca incluye `.claude`.

## Índice
- Decisiones → `docs/DECISIONS.md` (DD-19 color, DD-18 sizing, DD-17 consolidación).
- **Consumo del DS (HILO ABIERTO)** → `docs/consumer-onboarding.md §0`. Loop Figma → `docs/guia-tokens.md`.
- Onboarding diseño → `docs/ppt-proyecto.md`. Reglas/trampas → `AGENTS.md`. Mapa docs → `docs/DOCS-INDEX.md`.
