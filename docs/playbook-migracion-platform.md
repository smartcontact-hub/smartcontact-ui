# Playbook — migrar `smart-contact-platform` a los paquetes publicados

> **Sesión APARTE.** Este repo (`smartcontact-ui`) es read-only desde la sesión de la app.
> Esta receta se ejecuta abriendo sesión **sobre `smart-contact-platform`**. Objetivo:
> reemplazar la **copia local** del DS (`packages/design-system/`, ~7 MB) por los paquetes
> publicados `@smartcontact-hub/{styles,icons,components}`. Principio rector: **migration-safe**
> (rama feature, sin regresión visual, build + arranque verdes antes de mergear).
>
> Estado verificado (2026-06-14) del repo origen: Angular `21.2`, PrimeNG `21.1.6`,
> `@ngx-translate/core` **15**, `@primeng/themes` **21.0.4**, preset local en
> `packages/design-system/tokens/sc-preset.ts`, alias en `tsconfig.json`.

## Pre-flight
1. Rama dedicada: `feat/adopt-published-ds`.
2. Confirmar acceso a GitHub Packages: `.npmrc` con `@smartcontact-hub:registry=https://npm.pkg.github.com`
   + un PAT con `read:packages` (ver `docs/consumer-onboarding.md` de este repo).
3. Anotar baseline visual: capturas de las pantallas clave (agents, labels, top-bar) en `main`.

## Pasos (uno a uno, commit por paso)

1. **Instalar los paquetes**: `npm i @smartcontact-hub/styles @smartcontact-hub/icons @smartcontact-hub/components`
   (la versión publicada vigente — hoy 0.2.0). NO borrar aún `packages/design-system/`.

2. **Repuntar los alias** en `tsconfig.json` (paths) — de la copia local al paquete:
   - `@sc/design-system` → `@smartcontact-hub/components`
   - `@sc/tokens/sc-preset` → `@smartcontact-hub/components` (el preset se consume vía
     `provideSmartContactUi`, ver paso 3 — no se importa `ScPreset` a pelo).
   - Quitar de `apps/*/tsconfig.app.json` el `include` de `../../packages/design-system/**/*.ts`
     (ya no se compila el source local).

3. **Swap del preset** en `apps/supervisor/src/app/app.config.ts`:
   - Hoy: `import { ScPreset } from '@sc/tokens/sc-preset';` + `providePrimeNG({ preset: ScPreset, … })`.
   - Nuevo: `import { provideSmartContactUi } from '@smartcontact-hub/components';` y sustituir
     `providePrimeNG({...})` por `provideSmartContactUi()` (envuelve `providePrimeNG` + el preset
     publicado + `darkModeSelector: '.sc-dark'`). Mantener el resto de providers.

4. **Swap del CSS**: donde la app importa el CSS de tokens/iconos de la copia local, importar el de
   los paquetes: `@smartcontact-hub/styles` + `@smartcontact-hub/icons` (en el `styles` de
   `angular.json` o el `styles.scss` de la app). Contenido idéntico al local.

5. **Reconciliar divergencias de API** (el publicado fusionó/renombró piezas):
   - `sc-illustrated-avatar` → **`sc-avatar`** con sus inputs de ilustración. Ficheros con uso (baseline):
     `top-bar`, `group-assignment-table`, `agents-list-page`, `delete-labels-dialog`, `labels-page`,
     `agent-form-page`. (Re-grep al ejecutar: `grep -rl "sc-illustrated-avatar" apps/`.)
   - `sc-label-chip` → **`sc-tag`** variante label (read-only) o `sc-chip` (removable). Re-grep igual.
   - Auditar el resto contra el `public-api.ts` publicado antes de asumir 1:1.

6. **Resolver el skew de dependencias**:
   - `@ngx-translate/core` **15 → 17** (el publicado/la app deben cuadrar). Revisar breaking changes
     de 16/17 (API de `TranslateService`/`provideTranslateService`).
   - `@primeng/themes` → **`@primeuix/themes`** (v21). El preset publicado ya usa `@primeuix/themes`;
     `provideSmartContactUi` lo abstrae, así que la app no debería importar el paquete de themes a
     pelo — quitar imports directos de `@primeng/themes` si los hubiera.

7. **(Opcional, lote aparte)** Adoptar `sc-datatable` + `sc-inline-rename-cell` en las list pages
   bespoke que hoy hacen su propia tabla. No bloquea la migración.

8. **Borrar `packages/design-system/`** solo cuando 1-7 estén verdes y nada lo importe
   (`grep -rl "@sc/" apps/` vacío).

## Verificación migration-safe
- `npm run build` + arranque de `apps/supervisor` sin errores.
- Regresión visual: comparar contra las capturas baseline — foco en los ~217 `sc-icon`, forms, y
  los ~2970 usos de `--sc-*` (no deben cambiar; el CSS publicado es el mismo).
- `npm run e2e` (la suite cross-app del repo origen).
- PR con antes/después de cualquier diferencia visual; merge cuando dev + diseño validen.

## Criterio / rollback
Si una divergencia de API resulta más profunda de lo previsto (p.ej. `sc-illustrated-avatar` no
mapea 1:1 a `sc-avatar`), **parar ese sub-paso, documentar el gap** y decidir: ¿abrir el gap como
lote en el DS publicado (nueva versión) o adaptar el consumo en la app? No forzar un mapeo que
rompa la paridad visual.
