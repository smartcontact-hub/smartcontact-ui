# SmartContact UI - Agents

## Purpose
This project is a design system built with Angular 22, PrimeNG 22, standalone components, and CSS design tokens.

Before making version-sensitive changes, verify the real baseline in:
- `package.json`
- `projects/ui-smartcontact/package.json`
- `angular.json`

Current workspace baseline:
- Angular `21.x`
- PrimeNG `21.x`
- `@primeuix/themes` `2.x`
- `ng-packagr` `21.x`
- TypeScript `5.9.x`

Agents must generate code that is:
- consistent with existing components
- strictly based on real tokens
- aligned with repository structure
- production-ready without manual fixes

---

## Scope
This configuration applies to:
- `projects/ui-smartcontact`
- `projects/ui-smartcontact-icons`
- `projects/sc-docs`
- `projects/design-tokens`
- `projects/supervisor` — the real app (Supervisor), brought in-repo 2026-06-15 (**DD-17**).
  It **consumes the DS locally** by tsconfig paths → `./dist/*` (like `sc-docs`), so a token
  change is reflected instantly. It is a **vehicle** (free to evolve); the DS lib/tokens/preset stay
  sacred. The published `@smartcontact-hub/*` packages are now **PARKED** (dormant; run
  `publish:packages` only before a real external release).

Agents must NOT invent new architecture.
They must extend the current repository.

---

## Core Principles

### 1. Never invent tokens
Only use tokens defined in the layered token source:
- `projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/03-palette.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/04-component.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/05-extensions.css`
- `projects/design-tokens/src/lib/styles/tokens/layers/07-dark.css`

Layer 6 is the PrimeNG preset and lives in TypeScript:
- `projects/ui-smartcontact/src/lib/theme/sc-preset/`

Do not:
- guess token names
- create aliases
- hardcode values

---

### 2. Always inspect before generating
Before any component or style change, analyze:

- `sc-button`
- `sc-toggleswitch`
- `sc-inputtext`
- existing tokens (the layer files above)
- demo implementation in `projects/sc-docs`

Components are being ported incrementally. If a reference component does not
exist yet in `projects/ui-smartcontact/src/lib/components`, fall back to:
- the conventions in this file
- the token layers and the preset
- the closest component that does exist

If repo and instructions conflict → repo wins.

---

### 3. Follow naming conventions (DD-12)

Two naming families, by component type:

- **PrimeNG wrappers**: selector is `sc-` + the PrimeNG component name,
  lowercase, joined with no hyphen.
  Examples: `sc-button`, `sc-inputtext`, `sc-toggleswitch`, `sc-select`,
  `sc-radiobutton`, `sc-progressbar`, `sc-progressspinner`.
- **Custom components** (no PrimeNG equivalent): descriptive kebab-case.
  Examples: `sc-section-card`, `sc-empty-state`.

Internal CSS class names keep BEM modifiers:
- `sc-button`
- `sc-button--primary`
- `sc-button--md`

---

### 4. Prefer consistency over creativity
Reuse:
- structure
- API patterns
- styling strategy

Avoid introducing new abstractions.

---

## Component Strategy

### Use PrimeNG wrapper when:
- behavior already exists in PrimeNG
- component is a styled primitive

Examples:
- `sc-button`
- `sc-inputtext`
- basic controls

---

### Use custom component when:
- composite UI
- layout-specific
- not supported by PrimeNG

Examples:
- `sc-section-card`
- `sc-empty-state`
- alerts / banners

---

## Mandatory Workflow

Agents MUST follow this order:

1. **Inspect before generating** — read the existing token layers and a reference
   component before writing anything (see *Core Principles §2* and *Token Strategy*).
2. **Reuse before creating** — a PrimeNG wrapper if the Kit has the component, a custom
   only when it does not (see *Component Strategy*).
3. If you touched tokens/theme → follow [`docs/guia-tokens.md`](docs/guia-tokens.md)
   §2.bis / §2.ter (the two sync paths).
4. Document the change in `docs/` and map it in `docs/DOCS-INDEX.md` (enforced by `docs:guard`).
5. Run verification: `npm run verify` — and before pushing, the **8 steps of `ci.yml`**.

Do not skip steps.

> **Historia, para que no se repita**: hasta el 2026-08-13 estos pasos decían "Run
> `token-inspector` / `component-generator` / `primeng-wrapper` / `sync-theme`" — cuatro
> pasos **obligatorios e inejecutables**. Vivían en `.agents/skills/` (886 líneas) y no
> los cargaba nada: ni `package.json`, ni `.github/`, ni `.claude/`, ni un `.mcp.json`
> (grep verificado, salida vacía). Su contenido era en su mayor parte esta misma guía
> reescrita, así que se borraron; lo único que no estaba en ningún otro sitio —las dos
> rutas de sync— se movió a `guia-tokens.md`. **Si vuelves a escribir un paso
> obligatorio, comprueba que algo lo ejecuta.**

### Verification tooling (mandatory)
Before considering any token/theme/component change done, run:

- `npm run tokens:parity` — cross-checks the Kit DTCG export ↔ `--sc-*` tokens ↔ preset
- `npm run tokens:guard` — token guardrails (`--p-*` only in the preset, semantic spacing alias, no 8-point names, `font-size` via token)
- `npm run tokens:type-parity` — typography parity
- `npm run audit:theme-scale` — zero `px` in the preset, central `css.ts`
- `npm run verify` — runs the full guardrail chain (canonical list: the table in README.md); also includes test:unit, docs:guard, docs:coherence, build, typecheck, lint

---

## Token Strategy

Priority order:
1. component tokens (layer 4, e.g. `--sc-dialog-bg`)
2. semantic tokens (layer 2, e.g. `--sc-text-primary`, `--sc-bg-surface`)
3. foundation/primitive tokens (layer 1) only through their semantic aliases

### Scale (single source: 14-base v/14)
- The metric scale is generated from the Kit export as `--sc-scale-*`
  primitives, emitted in rem (design px / 16, design px kept in a comment).
- Components consume the semantic alias `--sc-spacing-*`, never `--sc-scale-*`
  directly. Examples: `--sc-spacing-0-5` (7px design), `--sc-spacing-0-75`
  (10.5px), `--sc-spacing-1` (14px), `--sc-spacing-1-5` (21px).
- No manual arithmetic in SCSS: use `var(--sc-spacing-*)` directly. Never
  write `calc(var(--token)/16*1rem)` — tokens are already rem.
- `font-size` ALWAYS comes from a `--sc-font-size-*` token (rounded ramp
  12/14/16/18/20/24/32/48).
- The retired 8-point unitless tokens (`--sc-spacing-50/100/200`,
  `--sc-space-*`) do not exist in this DS. Do not reintroduce them
  (`tokens:guard` blocks them).

### Architecture boundary
- `--sc-*` tokens are the public SmartContact design-system contract.
- `--p-*` PrimeNG variables belong exclusively to the preset
  (`projects/ui-smartcontact/src/lib/theme/sc-preset/`). Components and apps
  never consume `--p-*`.
- PrimeNG palette alignment happens through
  `projects/ui-smartcontact/src/lib/theme/sc-preset/base.ts`, which points
  each PrimeNG color family to `var(--sc-color-*)` (no hex in the preset).
  Do not copy palette values into component SCSS or preset files.
- The default dark mode selector is `.sc-dark` (configured by
  `provideSmartContactUi()`).

If tokens do not exist:
- do not invent
- limit implementation

---

## Output Requirements

Every generated component MUST include:

- standalone Angular component
- TS (typed inputs/outputs)
- HTML (clean structure)
- SCSS using tokens
- export in `public-api.ts`
- documentation page in `sc-docs`

---

## Documentation Rules

Docs MUST:
- match the existing `projects/sc-docs` page style (see `src/app/pages/`)
- use real API
- include variants, states, usage, API
- not invent features

---

## Integration Rules

After generation:

- component exported
- route registered (if needed)
- navigation updated
- demo working
- `npm run verify` passes

No broken imports.
No dead routes.

---

## Agent Usage

Expected workflow:

User prompt:
```
Create a new sc-badge component with success and error variants
```

The agent must:
- inspect tokens
- reuse patterns
- generate component
- generate docs
- integrate into workspace
- run verification

---

## Reference Components

Primary references (ported incrementally; use the ones that exist):
- `sc-button`
- `sc-toggleswitch`
- `sc-inputtext`
- `sc-dynamic-dialog`

These define:
- API shape
- styling
- state handling
- wrapper patterns

**API era — signals, always (DD-38).** Declare inputs with `input()` /
`input.required()` / `model()`, outputs with `output()`, queries with
`viewChild()/contentChild()`, and derived state with `computed()` — never a
getter. Booleans take `{ transform: booleanAttribute }`. `@Input()/@Output()`
is frozen: 16 library components still use it and they are the *only* ones
allowed to, tracked in `LEGACY_PENDIENTES` (`scripts/audit-api-era.mjs`). That
list only shrinks — `npm run audit:api-era` fails if anything new declares the
old API, and also if a migrated component is left on the list. Until
2026-08-14 the references above straddled both eras, so the pattern an agent
copied depended on which file it opened first; `sc-button` is now the canonical
example of the target era.

While a reference is not yet ported, derive patterns from this file, the
token layers, and the preset.

---

## Anti-Patterns

❌ Hardcoded values  
❌ Inline styles  
❌ Fake tokens  
❌ `calc(var(--token)/16*1rem)` conversions (tokens are already rem)  
❌ 8-point names (`--sc-space-*`, `--sc-spacing-200`)  
❌ `--p-*` outside the preset  
❌ `@Input()/@Output()` in anything new (signals era — DD-38)  
❌ Ignoring reference components  
❌ Duplicating logic  
❌ Breaking PrimeNG behavior  

---

## Failure Conditions

Stop or limit output if:
- tokens do not exist
- API is unclear
- repo structure is inconsistent

Do NOT invent solutions.

---

## Session-Close Protocol

When the user signals the end of a session — **"cerramos"**, **"lo dejamos"**,
**"paramos aquí"**, **"hasta mañana"**, **"nos vemos"**, or any equivalent cue — run
this wrap-up routine **without asking permission first**:

1. `git status` → if there are uncommitted changes, commit them per lote with a
   Conventional-Commits message summarising what landed (exclude `.claude`:
   `git add -A ':!.claude'`).
2. `git push` to `origin main`, and confirm CI is green (the gate — see Mandatory Workflow).
3. **Rewrite the hand-off of YOUR frente — `docs/handoff/<frente>.md` — and ONLY that file.**
   It is volatile: it gets overwritten, not appended (current state + ordered next steps + its
   own `HEAD <sha>` seal). **Never touch another frente's hand-off**, and leave
   `NEXT-SESSION.md` alone unless a frente is born or retired (it is just the index).
   *Why one file per frente:* the user keeps several sessions open on this repo at once. One
   shared file means whoever closes second overwrites the other's hand-off — the old protocol
   literally instructed it. Separate files cannot clobber each other and git merges them without
   a conflict, so this holds without anyone having to remember it.
4. If the session locked in a **load-bearing decision** (changes architecture, discards
   an alternative, sets a project-wide rule), add an entry to [`docs/DECISIONS.md`](docs/DECISIONS.md)
   in DD-N format with **WHY** and **WHAT-WAS-DISCARDED-AND-WHY**. (The old build journals (`DECISIONS-LOG(-B).md`
   is the historical construction journal — closed; new decisions go to `docs/DECISIONS.md`.)
5. **Work that is RETIRED gets archived with a tag, never just deleted.** If the session drops
   a branch that will not be merged, tag it first and push the tag:
   `git tag -a archive/<nombre> <sha>` with a message saying **what it is, why it existed, and
   why it is being retired**, then delete the branch. Deleting alone leaves the commits
   unreachable: the local reflog prunes them in ~30-90 days, and GitHub serving them by SHA is
   observed behaviour, not a written guarantee. A tag is a permanent ref — the work stays
   recoverable for good (`git tag -l 'archive/*'`, then
   `git switch -c <rama> archive/<nombre>`) without cluttering the branch list.
   *First use (2026-08-13):* `archive/informes-datareports` — the native Informes replica,
   built because the real screen lives in a cross-origin iframe that `html.to.design` cannot
   capture; retired once it had served that purpose. Never merged to `main`.
6. Reply with one or two sentences confirming what was pushed and where the trail lives.

**Why this exists.** Every session must leave the repo with both the code *and* a written
trail of how we got there, so the next session — and any future contributor — never has to
re-derive context from `git log` alone. See [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) for
which doc owns what.

---

## Known Traps — do not repeat

A self-improving repo writes down each trap the moment it bites, so it is paid for once.
Each entry: **what bites → the rule → why**. Append here when a new one is found.

- **Wrong Figma bridge.** *Bites:* reaching for `mcp__ClaudeTalkToFigma__*` (channel-based,
  not running) gives endless "Not connected". *Rule:* the live write-bridge is
  **`mcp__figma-console__*`** (Figma Console MCP, WebSocket on `localhost:9223`) — see *Figma MCP
  Bridge* below. *Why:* two sessions lost asking for a "channel" that does not exist in this setup.
- **"The Figma MCP" is three servers, and they fail independently.** *Bites:* on 2026-08-13
  `whoami` on the cloud server returned "connection invalidated", and that was reported as
  *the official MCP is down* — but `mcp__Figma__get_metadata` was reading the file fine the
  whole time. *Rule:* probe the half you actually need; never generalise one server's failure
  to the others. *Why:* they are genuinely different services — see the table below.
  ↔ *La regla de proceso, con su evidencia: `LEARNINGS.md` **#1** (corolario s27).*
- **An e2e test depends on `.sc-inputtext__msg--error` as a public contract.** *Bites:* renaming
  or restructuring that class inside `sc-inputtext` breaks `e2e/supervisor/category-modal.spec.ts:52`
  (verified 2026-08-13), and the failure looks like a modal bug rather than a CSS rename. *Rule:*
  treat intra-component classes that a spec asserts on as API — grep `e2e/` for the class before
  touching it. *Why:* rescued from the convergence plan before deleting it; it was the kind of
  detail whose loss makes a refactor fail for no visible reason.
- **`columns` in a datatable must be a `computed()` reading the `viewChild<TemplateRef>`.** *Bites:*
  those refs resolve LATE; assigning `columns` eagerly can block the render until they resolve.
  *Rule:* wrap in `computed()`. Reference implementation:
  `projects/agent/src/app/components/call-table/call-table.component.ts`.
- **Rasters can't be imported into Figma by code.** *Bites:* the plugin sandbox blocks
  `createImageAsync`/`fetch` to localhost, `set_image_fill` is unimplemented, and a
  hand-transcribed base64 corrupts ("Invalid base64 string"). *Rule:* leave an auto-layout
  **drop-zone** and let the user drag the PNG in. Native vectors/swatches *do* render fine
  from code. *Why:* burned time brute-forcing every import path before accepting it.
- **The Theme Designer plugin pushes 2 commits** (token export + `.theme-designer/`).
  *Rule:* the `tokens-sync` workflow works **off `main`** and resets its own branch — it never
  races the plugin's branch. *Why:* a non-fast-forward push race the first time.
- **Never delete the `design-tokens-sync` branch.** *Bites:* deleting it "to clean up" leaves the
  Theme Designer plugin with **no target** — its push silently no-ops (no branch → no run → no PR)
  and the operator's token change just vanishes. *Rule:* the branch is **long-lived**; the
  `tokens-sync` workflow self-heals it (force-reset to `main + cambio`). Leave it. If it ever needs
  resetting, push main onto it (`git push origin main:design-tokens-sync`), **never** delete it.
  *Why:* deleted it after a loop test → the operator's next plugin push left zero trace, looked like
  the plugin broke. [[integration-glue-full-loop]]: don't touch what an external actor depends on.
- **Two-strikes rule.** *Bites:* insisting on a blocked approach. *Rule:* if two distinct
  attempts at the same sub-goal fail, **stop** — state the blocker, then pivot or ask. Do not
  keep grinding. *Why:* stubbornness, not lack of skill, is what wastes a session.
- **Check the docs before calling something "new architecture".** *Rule:* grep `docs/` +
  [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) first — most flows (token pipeline, Theme Designer
  round-trip) are already designed. *Why:* over-architecting a documented flow twice.
- **Verify live external state before an operator action — don't trust the hand-off doc.**
  *Bites:* told the user to publish 0.2.0 when all 3 packages were already at 0.2.0, trusting
  NEXT-SESSION/memory's "pending publish" instead of checking the registry. *Rule:* before
  asking the user to run an operator action (publish, deploy, install), VERIFY the real state
  (`gh api …/versions`, `npm view`, etc.). The hand-off can be stale. *Why:* the mechanism
  (authed `gh`) was available and unused — cost the user a needless command.
- **`[skip ci]` on the `tokens-sync` reset commit freezes the Cloudflare preview.** *Bites:* the
  workflow's canonical reset commit carried `[skip ci]` "to avoid re-triggering" — but a `GITHUB_TOKEN`
  push **already can't** re-trigger a workflow (GitHub's own non-recursion rule), so it was redundant,
  and **Cloudflare Pages also honors `[skip ci]`** → it skipped the branch build → the per-branch
  preview stayed frozen on the OLD value (prod — built from `main`'s no-skip merge commit — showed the
  change; the preview did not). *Rule:* **never** put `[skip ci]`/`[ci skip]`/`[skip-ci]` on the
  `design-tokens-sync` reset commit. The loop is protected by the `GITHUB_TOKEN` non-recursion rule, not
  by skip tokens. The per-branch preview is exactly what the designer reviews — its build must not be
  skipped. *Why:* an operator pushed a radius change, saw it live in prod but frozen in the preview
  link — looked broken (fixed in `ce49d16`). [[integration-glue-full-loop]]: green pieces ≠ working
  loop — verify the actual served output, not just the run status.
- **Theme Designer plugin: `"… does not match <sha>"` = stale cached SHA, not a repo problem.** *Bites:*
  the plugin caches the file blob SHA of `kit-export-dtcg.json`; the workflow rewrites the branch after
  every push, and rapid back-to-back pushes (or a cancelled/failed run that didn't reset) leave the
  plugin's cached SHA pointing at a version that's gone → GitHub's contents API rejects with `does not
  match`. *Rule:* the operator **re-opens the plugin** (close + re-run from Figma's plugin menu) so it
  re-fetches the current SHA, then pushes. If it persists, reset the branch to a clean state
  (`git push --force origin main:design-tokens-sync`) so the plugin re-reads a stable target. *Why:*
  rapid token-testing churned the branch; the operator hit an opaque error mid-iteration.
  [[integration-glue-full-loop]]. **Diagnostic for "I pushed but nothing happened":** a real change
  triggers a `tokens-sync` run within seconds — no new run = the push carried no diff (Figma == branch),
  GitHub accepts it as a no-op.

### Trampas de CSS / medición / testing (destiladas de las sesiones de componentes)

- **Geometría ≠ color.** `main.bottom - page.bottom` dice cuántos px quedan bajo el
  contenido, NO de qué color son (si el `:host` de la página se estira, los pinta él).
  Para «¿qué ve el usuario ahí?»: `elementFromPoint` + subir al primer ancestro con alfa 1.
  ↔ `LEARNINGS.md` **#2** (corolario A).*
- **`color-mix` computa a `color(srgb …)`, no a `rgb()`.** Cualquier parser de `rgb()`/hex
  devuelve basura ahí. Que convierta el navegador (1px en canvas + `getImageData`), y valida
  el control: `ctx.fillStyle = 'var(--x)'` NO resuelve la variable (se queda en negro).
  ↔ `LEARNINGS.md` **#2** (+ corolario B).*
- **Una regla encapsulada de componente le gana a una global.** Antes de bautizar una clase
  compartida, `grep` el nombre en los `.scss` de componente (hubo `.page__title` muerto en
  ~9 hojas con tamaños distintos).
- **Un `:host` de página sin `height: 100%` deja ver el shell por debajo.** Defecto LATENTE
  mientras el contenido llegue abajo: mira la regla, no fíes en «se ve bien».
- **Las baselines visuales de `npm run e2e` se saltan en CI** (`if (process.env['CI']) return`).
  En local pueden llevar tiempo en rojo por entorno; stash-y-reproduce antes de culpar tu
  cambio, y no las uses como red si no las has regenerado. ↔ `LEARNINGS.md` **#5**.*
- **La paleta `--sc-color-*` NO se remapea en oscuro** (cero definiciones en `07-dark.css`).
  Usarla en un `background`/`color` de página es escribir un valor fijo → ilegible en un tema.
- **Un token de FONDO no es de texto, ni al revés.** `--sc-bg-primary` como `color:` → 3.39:1;
  `--sc-text-info` como `background:` → 3.15. Cuelan en claro y rompen en oscuro.
- **`npm run verify` reescribe `dist/` bajo un `ng serve` vivo** y lo deja con `Cannot find
  module '@smartcontact-hub/components'`; el server sigue sirviendo el bundle ANTERIOR. Tras un
  `verify`, reinicia el dev server antes de volver a medir. ↔ `LEARNINGS.md` **#5**.*
- **Los iconos Material son LIGATURAS** (llegan al DOM como texto): umbral de contraste 1.4.11
  (3:1), no 4.5. Y salen en `innerText` aunque estén bien pintados → para comprobar que la
  fuente cargó, mira la imagen, no el texto.
- **`waitForLoadState('networkidle')` sin acotar puede tumbar el CI sin fallar ninguna
  aserción** (agota el timeout del `goto`). Acótalo a ~10s sin `throw`. sc-docs baja 3,9 MB de
  fuente + chunks perezosos.
- **`table-layout`:** `main.scss` fuerza `fixed` en `table.table`; `sc-datatable` es `auto` →
  columnas recolocadas al migrar (la piel `.list-table` lo corrige). Y **PrimeNG pinta SIEMPRE
  la banda de `caption`** → franja vacía sobre la cabecera. ↔ `LEARNINGS.md` **#2**.*
- **Los `<td>` los pinta el DS**: reglas encapsuladas de página a `.table__td-*` dejan de
  aplicar; usa un `cellTemplate` con su `<span>`. **La casilla de PrimeNG mide 17,5px** (nativa
  15,75): con `table-layout: auto` ensancha la columna 2px.
- **`sc-docs` enruta por HASH** (`/#/components/x`): sin la almohadilla el deep-link rompe los
  assets y la app no arranca. **`http-server` no hace fallback SPA**: para rutas profundas,
  `ng serve`.
- **El tema oscuro se activa con `.sc-dark` en `<html>`** vía `localStorage sc-theme`
  (ThemeService); ponerlo a mano no vale (el servicio lo revierte).
- **`borderBottomColor` existe aunque el ancho sea 0** (vale `currentColor`): mide también
  `borderBottomWidth`. **La fuente de iconos pesa 3,9 MB**: espera `document.fonts.ready` +
  `document.fonts.load(...)` antes de medir/capturar.
- **El dev server sirve el DS COMPILADO**: tocar `projects/ui-smartcontact*/src` no se ve hasta
  `build:components` + **reiniciar** (una recarga dura no basta). **`export-clean` se salta con
  `CI=1`.** ↔ `LEARNINGS.md` **#5**.*
- **Sin backticks en mensajes de commit**; usa `-F -` con heredoc. **Nada de `page.reload()`**
  en journeys de memory (stores en RAM).
- **`npm run e2e` pisa `public/usage/*.png`** y `usage:capture` reescribe `_usage-raw.json`:
  para capturar, script aislado con la API de Playwright.
- **Añadir o quitar un `<sc-*>` desfasa `audit:components`** → `node
  scripts/component-audit.mjs --write` + commitea `docs/inventory.md` y `docs/_component-status.json`. ↔ `LEARNINGS.md` **#7**.*

---

## Figma MCP Bridge (recorded)

The Figma source-of-truth file is **"Smart-Contact Design System"** (file key
`khNq9dJKNi13pNllrqm6dx`; it used to be called *"Smart-Contact Prime"* — same key).

**There is no single "Figma MCP". There are three servers, and each one can be down on its
own** — check the one you need before concluding anything (state verified 2026-08-13):

| Server | What it talks to | Gives you | Needs |
|---|---|---|---|
| `mcp__figma-console__*` | Desktop Bridge plugin, WebSocket `localhost:9223` | Everything: read **and write** (`figma_execute` runs JS with the `figma` global), screenshots, variables, comments | Figma Desktop open with the plugin running |
| `mcp__Figma__*` | The Figma **desktop app** | Read only: `get_metadata`, `get_design_context`, `get_screenshot`, `get_variable_defs` | Figma Desktop open |
| `mcp__acb3d14c-…__*` / `plugin:figma:figma` | `https://mcp.figma.com/mcp` (**cloud**) | `use_figma` (write), **remote library search** (`get_libraries`, `search_design_system`), Code Connect, FigJam diagrams | OAuth, and it is the **only one that works headless/cron** |

- **Default to `mcp__figma-console__*`.** It covers read and write on any Figma plan, and it is
  the one that is reliably up. `figma_get_status` with `probe:true` is the health check.
- **The cloud server is worth having for two things only:** searching *remote/published*
  libraries (icons that are not local, e.g. `more_vert`), and any run without Figma Desktop
  open. Before EVERY `use_figma` call, load the `figma-use` skill and pass `skillNames`.
- **The cloud server is registered TWICE, independently**: as a claude.ai connector
  (`mcp__acb3d14c-…__*`, reconnected from claude.ai connector settings) and as a Claude Code
  plugin (`plugin:figma:figma`, authenticated with `/mcp` in an interactive terminal).
  **Authenticating one does NOT authenticate the other** — measured 2026-08-13: the terminal
  plugin went to `✔ connected · 32 tools` while the app session's `whoami` still returned
  "connection invalidated".
- **Do NOT use `mcp__ClaudeTalkToFigma__*`** — a different, channel-based plugin that is not running.
- **`get_metadata` with no `nodeId` only lists the pages Figma has LOADED** (in s22: just
  `🖼 Cover`). That is not "the file has one page" — the file has **111 pages** (counted
  2026-08-13). To enumerate them all without switching page, run
  `await figma.loadAllPagesAsync()` then read `figma.root.children` inside `figma_execute`.
- **Node ids in docs go stale — resolve them before building on them.** DD-34 cited
  `Main Content 1:12381`; that node does not exist. Verify with `get_metadata` first.
- **Reconnect:** if the MCP server restarts, the panel still shows "MCP ready" but the socket is
  dead (`transport: none`, "No active file connected"). Re-run the plugin: Figma → *Plugins →
  Development → Figma Desktop Bridge*. (Via computer-use, Figma Desktop's bundle id is
  `com.figma.Desktop`; the name "Figma" does not resolve.)

**Figma is the source of truth — never write to it without leaving a record.** Every change to
the Figma file is logged in [`docs/guia-tokens.md`](docs/guia-tokens.md) → *Figma change-log*
(fecha · nodo/página · qué cambió · por qué · quién).

---

## Goal

Convert prompts into:

- real components
- fully documented
- token-driven
- production-ready

with zero manual fixes.
