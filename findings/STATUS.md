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

## Bloqueo abierto — ACCESO al original

La superficie a medir (`#/private`) está tras login. **Playwright arranca con un navegador
limpio**: los estáticos del original son públicos (por eso la Fase 0 salió), la app no.

### Lo que YA se descartó midiendo

**Medir a través del Chrome de Rafa, sin credenciales.** Se probó y da igual de bien salvo
en una cosa:

- **El DPR no importa.** A ancho idéntico (1460), su Chrome a DPR 2 contra Playwright a
  DPR 1 difieren como mucho **0.01 px** — un orden de magnitud por debajo del umbral de
  ruido. La regla «DPR = 1» del arnés se puede relajar aquí, y está medido, no supuesto.
- **La barra de scroll da 0** en su Chrome (macOS, overlay), igual que en Playwright con
  `--hide-scrollbars`. Hay paridad.
- **Pero la ventana no se deja redimensionar.** `resize_window` responde «ok» y el viewport
  se queda clavado (1460, luego 1442), y su pantalla mide 1470: **1920 es imposible**.

Conclusión: su Chrome sirve para medir a UN ancho (~1442-1460), y ahí no hace falta
sesión. **No sirve para el barrido 320→1920**, que es justo lo que piden las Fases 1 y 5.

### Lo que hace falta

Una sesión guardada, y se genera SIN que ninguna credencial pase por el agente:

```bash
export PATH=/usr/local/bin:$PATH
npm run parity:login          # abre una ventana, te logueas TÚ, guarda .auth/original.json
```

`.auth/` está en `.gitignore`. El fichero es una sesión viva: no se comitea y caduca.

### ⚠️ Antes de lanzarlo, el riesgo real

Eso abre una **SEGUNDA sesión de agente** con el mismo usuario. La app lleva un
`app_opened_in_another_tab` en `localStorage`, así que detecta sesiones concurrentes, y una
sesión de agente es **telefonía en vivo**. Puede echar a la sesión real de Rafa o, peor,
quedar registrada como agente disponible y que le enruten una conversación de verdad.

Mitigaciones a decidir antes de medir:

1. Usar un **usuario de pruebas distinto** al que Rafa tiene abierto, si existe.
2. O medir con la sesión de Rafa **cerrada**, en un rato en que no esté trabajando.
3. Y en cualquier caso, poner el agente en un estado **no disponible** antes de barrer.

Las actuaciones de la matriz de estados son de solo lectura (abrir pestañas del
Comunicador), pero el simple hecho de estar logueado ya cuenta como presencia.

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
