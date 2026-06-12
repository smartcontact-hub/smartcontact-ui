# Smart Contact UI — Design System

Design System de Smart Contact, empaquetado y publicable. Lo que se diseña en
Figma (Smart Contact Prime UI Kit) se refleja directamente en el código y
**cada valor es trazable al export del Kit y verificable por máquina**.

## Paquetes

| Paquete | Proyecto | Contenido |
|---|---|---|
| `@smartcontact/styles` | `projects/design-tokens` | Tokens `--sc-*` (7 capas, escala 14-base en rem) + reset/globals |
| `@smartcontact/icons` | `projects/ui-smartcontact-icons` | `<sc-icon>` + Material Symbols generados |
| `@smartcontact/components` | `projects/ui-smartcontact` | Preset modular (`theme/sc-preset`, cada slot → `var(--sc-*)`) + `provideSmartContactUi()`. Los wrappers `sc-*` llegan en el port incremental — [docs/component-port-plan.md](docs/component-port-plan.md) |
| `sc-demo` (privada) | `projects/sc-demo` | App de referencia: fundaciones + smoke del tema |

## Construir

```bash
npm ci
npm run build          # design-tokens + icons + components → dist/
npm run build:demo     # demo producción
npm start              # demo en local (ng serve)
npm run export:all     # tarballs npm en dist/archives/
```

## Verificar (guardarraíles)

```bash
npm run verify         # todos los checks estáticos
npm run e2e            # smoke en navegador (Playwright)
```

| Guardarraíl | Comando | Qué garantiza | Estado |
|---|---|---|---|
| Generador | `npm run tokens:gen` | Los bloques `@sc-gen` de `01-primitive.css` reproducen el export del Kit (ley v/14, rem) | ✅ |
| Paridad | `npm run tokens:parity` | Escala/radios completos + 53 valores de sizing del preset + colores de marca 1:1 con el export (divergencias conscientes listadas) | ✅ |
| Guard | `npm run tokens:guard` | `--p-*` solo en el preset · componentes con alias `--sc-spacing-*` · sin escala 8-point · campos PrimeNG solo vía wrapper · font-size solo por token | ✅ |
| Tipografía | `npm run tokens:type-parity` | Cobertura de `font-size` tokenizado (hoy 100 %) | ✅ |
| Escala del preset | `npm run audit:theme-scale` | Cero `px` en el preset · sin `css:` por-componente · sin hack de `html{font-size}` | ✅ |
| Tipos + lint | `npm run typecheck` · `npm run lint` | | ✅ |
| e2e smoke | `npm run e2e` | La demo levanta y el botón/form field renderizan la métrica del Kit medida en navegador (10.5/7, radio 6, font 14) | ✅ |

El mismo gate corre en CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Flujo Figma → código

1. El Kit se re-exporta (DTCG) → se versiona en
   `projects/design-tokens/scripts/kit-export-dtcg.json`.
2. `npm run tokens:import` regenera las zonas `@sc-gen:*` de
   `01-primitive.css` (escala/radios/paleta complementaria). La cascada
   (aliases → semántica → preset) propaga sola.
3. `npm run verify` confirma paridad. Si algo diverge, o se corrige o se
   documenta como divergencia consciente — nunca se deja en silencio.

## Documentación

- [docs/DECISIONS.md](docs/DECISIONS.md) — decisiones de arquitectura (DD-*)
- [docs/guia-tokens.md](docs/guia-tokens.md) — guía del sistema de tokens (diseño)
- [projects/design-tokens/README.md](projects/design-tokens/README.md) — referencia técnica de tokens
- [docs/customs-catalog.md](docs/customs-catalog.md) — divergencias conscientes vs Figma
- [docs/migration-safety.md](docs/migration-safety.md) — patrones de cambio seguro
- [docs/convergence-manifesto.md](docs/convergence-manifesto.md) — catálogo unión y plan de convergencia
- [docs/foundations-rationale.md](docs/foundations-rationale.md) — racional de las fundaciones
- [docs/component-port-plan.md](docs/component-port-plan.md) — plan del port de componentes (Mitad B)
- [DECISIONS-LOG.md](DECISIONS-LOG.md) — log de decisiones de la sesión de construcción
- [AGENTS.md](AGENTS.md) — convenciones para el pipeline de agente
