# CLAUDE.md

Repo del Design System Smart Contact (3 paquetes ng-packagr + demo). Las
convenciones completas del trabajo con agentes están en [AGENTS.md](AGENTS.md)
— leerlas antes de tocar componentes o tokens. Resumen operativo:

- **Tokens**: `--sc-*` es el contrato; `--p-*` solo existe dentro de
  `projects/ui-smartcontact/src/lib/theme/sc-preset/`. No inventar tokens: todo
  valor métrico sale del export del Kit
  (`projects/design-tokens/scripts/kit-export-dtcg.json`).
- **Escala**: única tabla 14-base v/14 (`--sc-scale-*`, en rem). En componentes
  se consume el alias `--sc-spacing-*`. Nada de `calc(...)` manual ni px a pelo.
- **Naming**: wrappers PrimeNG pegado (`sc-inputtext`); custom en kebab
  (`sc-empty-state`).
- **Antes de dar nada por bueno**: `npm run verify` (generador + paridad +
  guard + tipografía + auditor de escala + typecheck + lint) y, si tocaste algo
  visual, `npm run e2e`.
- Los bloques `@sc-gen:*` de `01-primitive.css` son generados — no editar a
  mano (`npm run tokens:import` los reescribe).
