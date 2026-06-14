# Changelog

Todos los cambios notables de los paquetes `@smartcontact-hub/*` (versionados en
lockstep). Formato basado en [Keep a Changelog](https://keepachangelog.com/es/);
versionado [SemVer](https://semver.org/lang/es/). **Pre-1.0: la API puede cambiar
entre minors.** Las versiones de GitHub Packages son inmutables — cada release es
una versión nueva.

Para cortar una versión: `npm run version:bump -- <x.y.z|minor> --write`, edita esta
nota, commitea, y publica (`GITHUB_TOKEN=… npm run publish:packages -- --publish`).

## [Unreleased]

## [0.2.0] — 2026-06-14

### Changed
- **`@smartcontact-hub/components`** — los `input<boolean>()` de los wrappers
  (`fluid`, `required`, `invalid`, `readonly`, `collapsible`, `flush`, `stripedRows`…)
  ahora llevan `transform: booleanAttribute`: el **atributo escueto** funciona
  (`<sc-inputtext fluid>`, como `<input disabled>`). Cambio **aditivo** —
  `[fluid]="true"` sigue válido. Gap surfaceado dogfoodeando `projects/sc-prototype`.

## [0.1.0] — 2026-06-13
Primera publicación en GitHub Packages (privado, org `smartcontact-hub`).

### Added
- **`@smartcontact-hub/styles`** — 7 capas de tokens `--sc-*` (escala 14-base en rem,
  paleta, semánticos, componente, extensiones, dark) generadas desde el export DTCG
  del Kit (Theme Designer). Reset + globals.
- **`@smartcontact-hub/icons`** — `<sc-icon>` (Material Symbols por ligadura) +
  constantes `SC_ICON_SIZE_*`.
- **`@smartcontact-hub/components`** — 48 wrappers/customs `sc-*` (button, inputtext,
  select, toggleswitch, checkbox, dialog, datatable, section-card/subsection/slot,
  command-palette, bulk-transcription-modal…) + `provideSmartContactUi()` + el preset
  modular PrimeNG (cada slot → `var(--sc-*)`).
