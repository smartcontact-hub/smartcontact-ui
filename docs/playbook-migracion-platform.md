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

## Endurecimiento (verificado contra la fuente del DS, 2026-06-14)

> Una sesión de migración real midió la divergencia y un sparring la verificó **contra el
> código fuente de los paquetes publicados** (este repo). Resultado: el andamiaje es real, pero
> el playbook original asumía "compila → funciona" en sitios donde el fallo es **solo-runtime**.
> Estos checks son **obligatorios**; no son opcionales.

### Sólido (confirmado en la fuente — fiarse)
- `provideSmartContactUi()` envuelve `providePrimeNG` + el preset publicado; `darkModeSelector`
  por defecto = `.sc-dark` (consistente con `07-dark.css`). El preset usa `@primeuix/themes`.
- Tokens publicados = **numéricamente idénticos** al local a root 16px (rem×16 == px, zinc aditivo,
  `token-parity` = 0). El swap de fundación no repinta por números.
- Los gaps (`sc-avatar` sin px, `sc-tag` sin `xs`, `illustrated-avatar`/`label-chip` ausentes) son
  reales y están en el ROADMAP del DS — aplazarlos es correcto.

### Riesgos solo-runtime (el plan los trata como "compila → ok" — NO lo son)
1. **`cssLayer order` es INERTE: el CSS publicado no usa `@layer`.** `provideSmartContactUi()` no
   fija `cssLayer` por defecto y las "capas" del CSS publicado son orden de concatenación, no
   `@layer` nativo. **Si la app local pasaba un `cssLayer`/`order` a `providePrimeNG`, hay que
   capturarlo verbatim y re-pasarlo** por `provideSmartContactUi({ theme:{ cssLayer:… } })`. Caer
   al default sin-capa cambia la especificidad → **compila igual, pinta distinto**. ⬅️ el delta
   más peligroso de toda la migración.
2. **El truco de iconos puede romper `[filled]` en silencio.** `sc-icon [filled]` usa
   `font-variation-settings:'FILL' 1` (un **eje de variación**, no un glifo). Si la app carga su
   'Material Symbols Outlined' como build **estático** de Google Fonts (FILL=0 horneado), todo
   estado activo/seleccionado pierde el fill **sin error**. Exigir la Outlined **variable**
   (`woff2-variations`, eje FILL).
3. **Publicar los hosts arrastra el `sc-icon` publicado (Rounded).** 19+ templates publicados
   instancian `<sc-icon>` de `@smartcontact-hub/icons`. Mantener el `sc-icon` local Outlined "de
   momento" produce **split visual**: lo app-autorado Outlined, lo interno de hosts Rounded.
   Decidir explícitamente (aceptar el delta o adelantar icon), no defer silencioso.
4. **El guard de borrado `grep "@sc/" apps/` no ve partials/assets locales.** No detecta los
   `@use` SCSS de los partials no publicados ni el `sc-avatar` leyendo `assets/avatars/*.svg` en
   runtime. Ampliar el guard a `@use` de los **4** globales (`sc-overlay-sizes`, `sc-animations`,
   `sc-list-table`, `sc-toast`) + smoke de 404 sobre `assets/avatars/**`.
5. **ngx-translate v15↔v17 es divergencia solo-runtime.** 32 componentes auto-registran
   diccionarios en su constructor (`setTranslation`, API v16+); el paquete pide `^17`, el consumer
   está en **v15**. Si el provider no sube, la copia DS renderiza **keys crudas sin error de build**.

### Imprecisiones del plan a corregir
- **NO son "28/32 renames triviales, mismo selector".** Hay **49** componentes, todos con prefijo
  `sc-`, y `sc-confirm-host` **cambió de selector** a `sc-confirmdialog`. `sc-checkbox`/`sc-dialog`
  no son wrappers triviales. No rompe runtime, pero **no planificar el lote como mecánico**.
- El swap de CSS **no es 1:1 en ALCANCE** (los VALORES sí son idénticos — esto NO es fidelidad
  Figma→código, es empaquetado). La copia local importaba **solo tokens** y hacía su propio reset
  (`_reset.scss`). El paquete tiene UNA entrada CSS pública, `styles/index.css`, que es un
  **orquestador**: las 6 capas de tokens **+ además** `base/reset.css` + `base/globals.css`
  (`index.css:15-16`). Swap naíf → la app recibe tokens **+ reset/globals que no tenía** → doble
  reset / colisión. Dos caminos:
  - **A (el más 1:1 con cómo ship-ea el DS):** usar el orquestador Y quitar el `_reset.scss` de la
    app. Requiere check visual (si el reset del DS ≠ el de la app, hay saltos vs baselines).
  - **B (cambio mínimo, recomendado para la migración):** mantener el reset de la app e importar
    solo las 6 capas de tokens por **ruta directa** en el `styles[]` de `angular.json` (ignora el
    `exports`). Cero cambio de reset = migration-safe; adoptar A después como paso deliberado.
  - ⚠️ Gap del DS (registrado en `docs/ROADMAP.md`): el `exports` del paquete solo declara `.`
    (→ el `.mjs`, ni el CSS) y `./package.json` — **el CSS no tiene entrada nombrada** ni hay una
    "solo tokens". Se alcanza por ruta de fichero (vale en `angular.json styles[]`; un
    `@import '@smartcontact-hub/styles/…'` como módulo lo puede bloquear el `exports` estricto).

### Verificar en el consumer ANTES de Lote 0 (no verificable desde el DS)
- **¿node_modules single-root o per-app?** Si supervisor y ds-docs comparten raíz, los bumps de
  Lote-0 (`ngx-translate 15→17`, `@primeng→@primeuix`) **no son app-scoped** — tocan ds-docs aunque
  esté "diferido".
- **La firma real del loader `provideTranslateService`/`TranslateHttpLoader` v17** en supervisor.

### Gate obligatorio de Lote 0 (anti "compila-pero-repinta")
1. Capturar verbatim el `providePrimeNG({ theme:{ options } })` de la app local (cssLayer, prefix,
   ripple) y re-pasarlo idéntico por `provideSmartContactUi(...)`. Diff explícito local-vs-default.
2. Confirmar que el font Outlined que carga la app es **variable con eje FILL**, no el estático.
   Test visual de un `[filled]` activo.
3. Guard de borrado reforzado: `@use` de los 4 partials + smoke 404 de `assets/avatars/**`.
4. **Smoke de runtime** (no solo build verde): una vista con copy i18n + `<sc-avatar illustrationName>`
   — afirmar que NO salen keys crudas y que el SVG carga. (piezas-verdes ≠ loop-verde.)
5. Decisión explícita del split `sc-icon` Rounded/Outlined del lote.
6. Confirmar single-root vs per-app y la firma del loader v17 (los dos puntos consumer-side).

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
   `angular.json` o el `styles.scss` de la app). ⚠️ **No es 1:1** — ver *Endurecimiento* arriba
   (el `index.css` publicado arrastra reset+globals; faltan 4 partials globales; importar capas
   individuales si solo quieres tokens).

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
  los ~2970 usos de `--sc-*`. Los tokens no deben cambiar (CSS numéricamente idéntico), pero **sí
  vigilar** el split `sc-icon` Rounded/Outlined, el `[filled]` y la especificidad por el `cssLayer`
  inerte (ver *Endurecimiento*).
- `npm run e2e` (la suite cross-app del repo origen).
- PR con antes/después de cualquier diferencia visual; merge cuando dev + diseño validen.

## Criterio / rollback
Si una divergencia de API resulta más profunda de lo previsto (p.ej. `sc-illustrated-avatar` no
mapea 1:1 a `sc-avatar`), **parar ese sub-paso, documentar el gap** y decidir: ¿abrir el gap como
lote en el DS publicado (nueva versión) o adaptar el consumo en la app? No forzar un mapeo que
rompa la paridad visual.
