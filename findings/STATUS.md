# STATUS — paridad medida réplica ↔ original

Original: `https://comunicatoraeddev.smart-contact.com/sismac/` (superficie a medir:
`#/private`, tras login)
Réplica: `projects/agent` servida en `http://127.0.0.1:8792/`
Stack de la réplica: Angular 20 standalone, CSS por componente en `styles:` con px
literales a escala 1456.

Herramientas en `./tools/`, ejecutables con `node tools/<script>.ts` (Node 25 lee TS
directo). Node de nvm (v20) NO vale: `export PATH=/usr/local/bin:$PATH`.

## Fases

| fase                        | alcance    | estado       | gate                                                     |
| --------------------------- | ---------- | ------------ | -------------------------------------------------------- |
| 0 · Forense de fuentes      | global     | **COMPLETA** | **NO SUPERADO** — 2 bloqueantes de pipeline sin resolver |
| 1 · Breakpoints             | global     | no iniciada  | bloqueada por gate 0 + acceso                            |
| 1.5 · Matriz de estados     | global     | no iniciada  | bloqueada por gate 0                                     |
| 2 · Extracción de métricas  | global     | no iniciada  | bloqueada por gate 0                                     |
| 3 · Censo y caos            | global     | no iniciada  | —                                                        |
| 4 · Clasificación de causas | global     | no iniciada  | —                                                        |
| 5 · Curvas fluidas          | global     | no iniciada  | —                                                        |
| 6 · Aplicación              | por bloque | no iniciada  | —                                                        |
| 7 · Verificación            | por bloque | no iniciada  | —                                                        |
| 8 · Comportamientos nuevos  | global     | no iniciada  | —                                                        |

Bloques DIRTY: ninguno (no se ha aplicado ningún cambio).

## Bloqueos abiertos — los tres necesitan decisión tuya

1. **GATE 0 · Pipeline de fuentes.** El original sirve Open Sans **estático** en 8
   familias separadas más Roboto estático; la réplica sirve Open Sans **variable** en una
   sola familia y **no sirve Roboto**. Además el bit `USE_TYPO_METRICS` difiere
   (original `false`, réplica `true`). Opciones A/B/C en `phase-0-verdict.md`.

2. **ACCESO.** La superficie medible del original está tras login. No introduzco
   credenciales. Hace falta un `storageState` de Playwright generado por ti, o acotar el
   alcance.

3. **ALCANCE RESPONSIVE.** El encargo pide todo el rango 320→1920. La réplica está
   congelada a px con referencia **1456** por decisión ya documentada
   (`projects/agent/docs/escala.md`). Tal cual, las Fases 1 y 5 darían BLOQUEANTE en todo
   ancho distinto de 1456 por diseño. Elegir: rango responsive (volver a vw) o mantener px
   (conjunto de medición = 1456).

## Harness — verificado

| regla                                      | estado                                                  |
| ------------------------------------------ | ------------------------------------------------------- |
| 1 · DPR 1, viewport fijo, sin zoom         | aplicada (`deviceScaleFactor: 1`)                       |
| 2 · Paridad de barra de scroll             | **medida: 0 px en ambos lados** con `--hide-scrollbars` |
| 3 · `document.fonts.ready` antes de medir  | aplicada en `settle()`                                  |
| 4 · Movimiento anulado                     | `reducedMotion: reduce` + CSS inyectado a 0s            |
| 5 · Render completo forzado                | scroll abajo → networkidle → arriba → networkidle       |
| 6 · Locale, zona y esquema fijados         | `es-ES`, `Europe/Madrid`, `light`                       |
| 7 · Analítica bloqueada, consentimiento no | lista en `DEFAULT_HARNESS.blockedHosts`                 |
| 8 · Manifiesto en cada artefacto           | `tools/lib/manifest.ts`, con `manifestDrift()`          |

## Nota de instrumento

`document.fonts.check()` **no sirve** para saber si una familia existe: devuelve `true` en
cuanto cualquier fallback puede pintar los caracteres. La primera versión de la sonda lo
usaba y firmaba positivos falsos en las siete familias. La sonda actual mide **ancho de
texto** contra tres bases genéricas, y con ella solo `Open Sans` da positivo.
