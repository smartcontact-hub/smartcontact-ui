# SmartContact UI - Agents

## Purpose
This project is a design system built with Angular 21, PrimeNG 21, standalone components, and CSS design tokens.

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
- `projects/sc-demo`
- `projects/design-tokens`
- `projects/supervisor` — the real app (Supervisor), brought in-repo 2026-06-15 (**DD-17**).
  It **consumes the DS locally** by tsconfig paths → `./dist/*` (like `sc-demo`), so a token
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
- demo implementation in `projects/sc-demo`

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

1. Run `token-inspector`
2. Run `component-generator`
3. If needed → run `primeng-wrapper`
4. If you touched tokens/theme → run `sync-theme`
5. Document the change in `docs/` and map it in `docs/DOCS-INDEX.md` (enforced by `docs:guard`)
6. Run verification: `npm run verify`

Do not skip steps.

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
- documentation page in `sc-demo`

---

## Documentation Rules

Docs MUST:
- match the existing `projects/sc-demo` page style (see `src/app/pages/`)
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
3. **Rewrite** `NEXT-SESSION.md` (it is the *volatile* hand-off — it gets overwritten,
   not appended): current state + the ordered next steps + the doc index pointer.
4. If the session locked in a **load-bearing decision** (changes architecture, discards
   an alternative, sets a project-wide rule), add an entry to [`docs/DECISIONS.md`](docs/DECISIONS.md)
   in DD-N format with **WHY** and **WHAT-WAS-DISCARDED-AND-WHY**. (`DECISIONS-LOG(-B).md`
   is the historical construction journal — closed; new decisions go to `docs/DECISIONS.md`.)
5. Reply with one or two sentences confirming what was pushed and where the trail lives.

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
  **`mcp__figma__*`** (Figma Console MCP, WebSocket on `localhost:9223`) — see *Figma MCP
  Bridge* below. *Why:* two sessions lost asking for a "channel" that does not exist in this setup.
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

---

## Figma MCP Bridge (recorded)

The Figma source-of-truth file is **"Smart-Contact Prime"** (file key
`khNq9dJKNi13pNllrqm6dx`). To read/write it from an agent:

- **Use `mcp__figma__*`** — the *Figma Console MCP* "Desktop Bridge" plugin (compact panel,
  `</>` icon, green **"MCP ready"**). WebSocket on `localhost:9223`, no channel needed.
  Key tools: `figma_get_status` (health, pass `probe:true`), `figma_execute` (runs JS with the
  `figma` global), `figma_capture_screenshot`.
- **Do NOT use `mcp__ClaudeTalkToFigma__*`** — a different, channel-based plugin that is not running.
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
