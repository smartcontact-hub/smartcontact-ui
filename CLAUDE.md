# CLAUDE.md

Repo del Design System Smart Contact (3 paquetes ng-packagr + demo). Las
convenciones completas del trabajo con agentes están en [AGENTS.md](AGENTS.md)
— leerlas antes de tocar componentes o tokens.

- **AL EMPEZAR CUALQUIER TAREA, lee [LEARNINGS.md](LEARNINGS.md)** (raíz): reglas de
  proceso `disparador → acción` destiladas de errores reales en este repo (verificación,
  gates antes de pushear, dimensionar alcance). Es corto a propósito. Lo escribe y afila
  `/reflect` al cerrar cada tarea; si solo se escribe y no se lee, no sirve de nada.

Resumen operativo:

- **Tokens**: `--sc-*` es el contrato; `--p-*` solo existe dentro de
  `projects/ui-smartcontact/src/lib/theme/sc-preset/`. No inventar tokens: todo
  valor métrico sale del export del Kit
  (`projects/design-tokens/scripts/kit-export-dtcg.json`).
- **Escala**: única tabla 14-base v/14 (`--sc-scale-*`, en rem). En componentes
  se consume el alias `--sc-spacing-*`. Nada de `calc(...)` manual ni px a pelo.
- **Naming**: wrappers PrimeNG pegado (`sc-inputtext`); custom en kebab
  (`sc-empty-state`).
- **Antes de dar nada por bueno**: `npm run verify` (26 gates encadenados) y, si
  tocaste algo visual, `npm run e2e`. **Antes de pushear no basta `verify`**: el CI
  son 8 pasos — ábrelos en `.github/workflows/ci.yml`, están enumerados.
- ⚠️ **Los bloques `@sc-gen:*` son GENERADOS y viven en CINCO ficheros**, no solo en
  `01-primitive.css`: `01-primitive` (scale · radius · palette), `02-semantic`
  (semantic-color-light), `04-component` (cmp-sizing · cmp-color-light),
  `05-extensions` (effects) y `07-dark` (semantic-color-dark · cmp-color-dark) —
  9 zonas. **No editar ninguna a mano**: `npm run tokens:import` encadena 5
  generadores y las reescribe todas. (Medido 2026-08-13; antes esta línea nombraba
  solo `01-primitive` y quien la creyera perdía el trabajo hecho en las otras cuatro.)
