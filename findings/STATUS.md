# STATUS — paridad medida réplica ↔ original

Original: `https://comunicatoraeddev.smart-contact.com/sismac/` (superficie a medir:
`#/private`, tras login)
Réplica: `projects/agent` servida en `http://127.0.0.1:8792/`
Stack de la réplica: Angular 20 standalone, CSS por componente en `styles:` en **`vw`**,
igual que el original (era px a escala 1456 hasta el 2026-08-26).

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

Bloques DIRTY: ninguno.

## Decidido y aplicado (2026-08-26)

1. **GATE 0 · Fuentes → opción A.** Los ficheros del original se sirven desde el repo con
   los mismos nombres de familia. Paridad de métricas **exacta**, incluido
   `USE_TYPO_METRICS`. Ver `phase-0-verdict.md` y `projects/agent/public/fonts/LICENSE.md`.

2. **ALCANCE → como el original.** La réplica vuelve a **`vw`**: 640 valores en 16
   ficheros. A 1456 el render es idéntico (**0 bloqueantes y 0 menores en los 9 estados**)
   y el Comunicador escala constante en vw a 1280 / 1456 / 1920. Ver
   `scope-vw-conversion.md` y `projects/agent/docs/escala.md`.

## Bloqueo abierto — necesita algo tuyo

**ACCESO al original.** La superficie a medir (`#/private`) está tras login y no introduzco
credenciales. Sin eso no arrancan la Fase 1 (breakpoints reales del original) ni la Fase 5
(curvas fluidas), y con ellas se queda sin cerrar el hueco de la altura de fila de la tabla
(2.535 / 2.885 / 3.804 vw a 1280 / 1456 / 1920, ver `scope-vw-conversion.md`).

Lo que desbloquea: te logueas una vez y guardamos el `storageState` de Playwright.

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
