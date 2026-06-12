---
name: sync-theme
description: Synchronize incoming SmartContact PrimeNG theme changes (Theme Designer DTCG export, design handoffs, pasted preset files) into the design system while preserving the token contract (every slot resolves to var(--sc-*)), the centralized rem scale, the zero-px preset rule, and the parity guardrails. Use when the user says sync-theme, re-exports the Kit, or asks to apply/merge theme preset modifications.
---

# Sync Theme

## Purpose
Apply incoming theme changes without breaking the contract:

```text
Kit export (DTCG, px design values)
  -> npm run tokens:import  (regenerates @sc-gen zones of 01-primitive.css, in rem)
  -> --sc-* tokens (single source of truth)
  -> preset slots var(--sc-*) / {token.refs}
  -> normalizeDesignRem (residual design-rem literals)
  -> generated CSS (--p-* -> var(--sc-*))
```

Targets:

```text
projects/design-tokens/scripts/kit-export-dtcg.json        (Kit export, versioned)
projects/design-tokens/src/lib/styles/tokens/layers/       (7 token layers)
projects/ui-smartcontact/src/lib/theme/sc-preset/          (modular preset)
```

## Two sync paths

### Path A — Kit re-export (the normal flow)
1. Save the new DTCG export over
   `projects/design-tokens/scripts/kit-export-dtcg.json`.
2. `npm run tokens:import` — rewrites the `@sc-gen:scale|radius|palette`
   zones of `01-primitive.css` (rem values, design px in comments). Never
   edit those zones by hand.
3. `npm run tokens:parity` — if a curated token or preset slot now diverges,
   either fix it or record it as a conscious divergence
   (docs/customs-catalog.md + the DIVERGE list in scripts/token-parity.mjs).
4. `npm run verify` and, if anything visual changed, `npm run e2e`.

### Path B — incoming preset files (lab/design handoff)
1. Inspect repo state (`git status --short`) and read source + target before
   editing. Preserve unrelated changes.
2. Merge component token changes surgically into the per-component modules.
3. Re-tokenize every incoming metric: if the design px value (incoming rem ×14
   or a raw px) falls on the 14-base scale, point the slot at
   `var(--sc-scale-*)`; colors point at `var(--sc-color-*)` / semantic
   tokens via `base.ts`. Only off-scale metrics may stay as design-rem
   literals (`N/14` rem, 6 decimals) for `normalizeDesignRem` to convert.
4. `base.ts` must never contain hex; component modules must never contain px.

## Files that must exist after every sync

```text
projects/ui-smartcontact/src/lib/theme/sc-preset/rem-scale.ts
projects/ui-smartcontact/src/lib/theme/sc-preset/css.ts
projects/ui-smartcontact/src/lib/theme/sc-preset/extend.ts
projects/ui-smartcontact/src/lib/theme/sc-preset/index.ts
projects/ui-smartcontact/src/lib/theme/sc-preset/base.ts
scripts/check-theme-scale.mjs
scripts/token-gen.mjs
scripts/token-parity.mjs
```

## Scale rules
- Do not change global `html { font-size }` to solve PrimeNG scale.
- Do not add `css:` inside individual component preset files — typography
  patches live centrally in `css.ts`.
- Zero `px` in the preset (comments included — the audit greps the file).
- Prefer `var(--sc-scale-*)` over rem literals whenever the value is
  on-scale; the scale tokens are already rem (centralized conversion).
- Preserve `0` as `"0"`.

## Preset contract
- `base.ts`: primitive families and semantic slots resolve to `var(--sc-*)`.
  Family map: sky→electric-blue, slate→gray, orange/yellow→amber, zinc→zinc.
- Application-owned tokens live in `extend.ts` under `app.*`:
  `app.typography.{sm,md,lg}` (control typography — fonts via
  `--sc-font-size-100/200/300`, line-heights 18/21/24) and
  `app.toggleswitch.md.*` (Kit metrics via scale tokens).
- `index.ts` builds `normalizeDesignRem({ ...base, components, extend, css }
  satisfies Preset)` and exports it as default.

## Central CSS contract
`css.ts` must keep covering the PrimeUIX modules that hardcode
`font-size: 1rem` (autocomplete, button, datepicker, editor, inputchips,
inputtext, select, terminal, textarea, togglebutton) through
`mdTypographySelectors` / `smTypographySelectors` / `lgTypographySelectors`,
with fallbacks md 14/21 · sm 12/18 · lg 16/24 (design px), plus:

```css
.p-button .p-button-icon {
    line-height: 1;
}
```

## Validation
After every sync:

```bash
npm run verify          # tokens:gen + parity + guard + type-parity + audit + typecheck + lint
npm run build
npm run e2e             # if anything visual changed
```

## Output
Report: source used · files changed · parity result (including new conscious
divergences) · zero-px confirmation · build/audit/e2e results · components
that deserve manual visual review. Prefer concise Spanish output when the
user writes in Spanish.
