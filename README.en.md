# Smart Contact Design System

[![Versión](https://img.shields.io/badge/versi%C3%B3n-1.0.0-0B2C5C)](https://github.com/smartcontact-hub/smartcontact-ui/releases/latest)
![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/PrimeNG-22-10B981)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Packages](https://img.shields.io/badge/packages-3-blue)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)](LICENSE)

[Español](README.md) · **English**

Smart Contact's design system: **56 components `sc-*`** on top of Angular and PrimeNG, with a
theme in which **every value is traceable to the Figma Kit and machine-verifiable**.

> 📖 **[Live documentation: sc-doc.pages.dev](https://sc-doc.pages.dev)** · component
> catalogue, foundations, screen patterns and runnable examples.
>
> ⚖️ This repository is **public but not open source**. You may read, link to, quote and fork
> it for evaluation; any other use requires written permission ([LICENSE](LICENSE)).

## Install
<!--sc:sec=install-->

Every version ships as a [GitHub release](https://github.com/smartcontact-hub/smartcontact-ui/releases/latest)
with the three packages attached as tarballs. No need to clone or compile:

```bash
npm i https://github.com/smartcontact-hub/smartcontact-ui/releases/download/v1.0.0/smartcontact-hub-styles-1.0.0.tgz
```

If you already have access to the `smartcontact-hub` org, those same three packages are on
**GitHub Packages** (private): [`publish-packages.yml`](.github/workflows/publish-packages.yml)
publishes them when the release goes out, from the tag's commit. Two routes depending on who
you are: the **tarball** from outside, the **registry** from inside.

What changed in each version: [CHANGELOG.md](CHANGELOG.md). How to adopt it in an existing
app: [docs/consumer-onboarding.md](docs/consumer-onboarding.md) (in Spanish).

## The packages
<!--sc:sec=packages-->

| Package | Project | Contents |
| ------- | ------- | -------- |
| `@smartcontact-hub/styles` | [`projects/design-tokens`](projects/design-tokens/README.md) | `--sc-*` tokens (7 layers, 14-base scale in rem), reset and globals |
| `@smartcontact-hub/icons` | [`projects/ui-smartcontact-icons`](projects/ui-smartcontact-icons/README.md) | `<sc-icon>` and the generated Material Symbols |
| `@smartcontact-hub/components` | [`projects/ui-smartcontact`](projects/ui-smartcontact/README.md) | `provideSmartContactUi()`, the modular preset and the `sc-*` components ([inventory](docs/inventory.md)) |

## The apps in this repo
<!--sc:sec=apps-->

Five of them, all five live on Cloudflare Pages.

| App | What it is | In production |
| --- | ---------- | ------------- |
| [`sc-docs`](projects/sc-docs/README.md) | Showcase: foundations, catalogue, real usage and Lab | [sc-doc.pages.dev](https://sc-doc.pages.dev) |
| [`supervisor`](projects/supervisor/README.md) | **The real app.** Canonical consumption: only `sc-*` and tokens | [sc-supervisor.pages.dev](https://sc-supervisor.pages.dev) |
| [`agent`](projects/agent/README.md) | Replica of the agent dashboard | [sc-agent.pages.dev](https://sc-agent.pages.dev) |
| [`agent-mini`](projects/agent-mini/README.md) | Replica of the standalone Communicator | [agent-mini.pages.dev](https://agent-mini.pages.dev) |
| [`cuscare`](projects/cuscare/README.md) | Replica of the ticketing tool | [sc-cuscare.pages.dev](https://sc-cuscare.pages.dev) |

The apps in this repo **import the DS straight from `dist/`**, through `tsconfig` paths, not
as an npm package. That way you touch a token and see it instantly across all five, with
nothing published. The reasoning is in [DD-17](docs/DECISIONS.md); why publishing per release
does not reopen it, in DD-58.

> ⚠️ **The replicas (`agent`, `agent-mini`, `cuscare`) are deliberately not tokenised**
> (DD-35, DD-37). A replica has to look like the **original**, not like our DS: its values are
> extracted from the real site and `tokens:guard` exempts them. **Do not "fix" them to use
> `--sc-*`.**

## Build
<!--sc:sec=build-->

```bash
npm ci
npm run build          # design-tokens + icons + components into dist/
npm start              # sc-docs locally (ng serve)
npm run build:docs     # production docs
npm run export:all     # npm tarballs into dist/archives/
```

## Verify
<!--sc:sec=verify-->

```bash
npm run verify         # the 42 chained static checks (~40s)
npm run e2e            # browser smoke test (Playwright)
npm run preflight      # gates + AOT builds + visual baselines (~5 min), before pushing
```

The `verify` chain's composition is canonical here, and this README is its single source (the
`docs:coherence` CHECK B enforces it). **Why each one exists lives in
[docs/guardarrailes.md](docs/guardarrailes.md)** (in Spanish), together with `preflight`, the
three e2e nets and the other workflows.

| Family | Commands | What it guarantees |
| ------ | -------- | ------------------ |
| Tokens | `tokens:gen` · `tokens:gen-component` · `tokens:gen-color` · `tokens:gen-cmp-color` · `tokens:gen-effects` · `tokens:parity` · `tokens:guard` · `tokens:export-clean` · `tokens:cmp-rewire` · `tokens:effects-rewire` · `tokens:type-parity` | Every theme value reproduces the Kit export, and `--p-*` never leaves the preset |
| Screens | `audit:theme-scale` · `audit:border-surfaces` · `audit:screen-hygiene` · `audit:page-anatomy` · `audit:screen-vocabulary` · `audit:text-styles` · `audit:titulo-contenido` · `audit:base-href` | Screens measure by token, with one shared vocabulary and no layout shifts |
| Components | `audit:components` · `audit:api-era` · `audit:datatables` · `audit:datatable-slots` · `audit:primeng-coupling` · `audit:doc-snippets` · `test:components` | The public API, the coupling to PrimeNG and what the docs show all match the code |
| Content and docs | `i18n:check` · `novedades:check` · `usage:check` · `variables:check` · `audit:seed-pii` · `audit:personal-names` · `docs:guard` · `docs:coherence` · `docs:readme-parity` | Genuinely multilingual, zero real contact data in demos, no personal names in the code, and no doc that lies |
| Repo | `proto:check` · `explorations:check` · `guard:backticks` · `test:unit` · `typecheck` · `lint` · `build` | Frozen versions stay findable, types stay clean and the libs keep building |

The same gate runs in CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)), which is
**nine steps**: `verify` on its own neither builds the apps nor runs the e2e suites.

## From Figma to code
<!--sc:sec=figma-->

1. The Kit is re-exported as DTCG and versioned in `projects/design-tokens/scripts/kit-export-dtcg.json`.
2. `npm run tokens:import` regenerates the `@sc-gen:*` zones. The cascade (aliases, semantics, preset) propagates on its own.
3. `npm run verify` confirms parity. If anything diverges, it is either fixed or documented as a deliberate divergence in [docs/customs-catalog.md](docs/customs-catalog.md). It is never left silent.

## Documentation
<!--sc:sec=docs-->

The documents below are written in Spanish; this README is the English entry point.

| Document | What for |
| -------- | -------- |
| [docs/DOCS-INDEX.md](docs/DOCS-INDEX.md) | **Master index**: which document owns which topic |
| [docs/guardarrailes.md](docs/guardarrailes.md) | What each gate guarantees, and `preflight` in depth |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decisions (DD-\*), with the alternatives that were ruled out |
| [docs/guia-tokens.md](docs/guia-tokens.md) | Token system guide, for designers |
| [docs/customs-catalog.md](docs/customs-catalog.md) | Deliberate divergences from Figma |
| [docs/migration-safety.md](docs/migration-safety.md) | Safe-change patterns on top of PrimeNG |
| [AGENTS.md](AGENTS.md) | Contribution conventions and the agent pipeline |

## License
<!--sc:sec=license-->

**Public but not open source**: [LICENSE](LICENSE) reserves all rights to Smart Contact, in
line with the three packages, which are published as `UNLICENSED` with restricted access. You
may read, link to, quote and fork it to evaluate it or propose changes; any other use requires
written permission. Dependencies keep their own licences (the fonts shipped with the published
sites are OFL 1.1).

The legal notice for all five sites is a page of sc-docs itself:
[sc-doc.pages.dev/#/aviso-legal](https://sc-doc.pages.dev/#/aviso-legal).
