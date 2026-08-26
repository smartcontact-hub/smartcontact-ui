# `tools/` — arnés de paridad medida

Herramientas de medición para llevar `projects/agent` a paridad **medida** con la app real.
Regla del encargo: **medir, nunca estimar**. Si algo no se puede medir se declara «sin
verificar»; no se inventa un valor.

Los resultados **no viven aquí**: van a `../findings/`. Empieza siempre por
[`../findings/STATUS.md`](../findings/STATUS.md).

## Cómo se ejecutan

Node 25 lee TypeScript directo. El node de nvm (v20) **rompe el repo**:

```bash
export PATH=/usr/local/bin:$PATH
npm run parity:phase0   # forense de fuentes de los dos lados
npm run parity:probe    # qué familias resuelve de verdad la réplica
```

Variables: `SC_ORIGINAL_URL` y `SC_REPLICA_URL` (por defecto, el dev de la app real y
`http://127.0.0.1:8792/`).

## Qué hay

| fichero                   | qué hace                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/harness.ts`          | las 8 reglas de determinismo en un solo sitio: DPR 1, movimiento anulado, `document.fonts.ready`, render forzado, locale y zona fijados, analítica bloqueada. Ningún script abre un navegador por su cuenta. |
| `lib/manifest.ts`         | el sello de cada artefacto (versiones, SO, SHA de la réplica, ajustes del arnés) y `manifestDrift()` para negarse a comparar artefactos incomparables.                                                       |
| `phase0-fonts.ts`         | intercepta la red, descarga cada fichero de fuente y lo abre con fontkit; parsea los `@font-face` con css-tree. Escribe `findings/phase-0-fonts.json`.                                                       |
| `phase0-resolve-probe.ts` | qué familias existen DE VERDAD en la réplica.                                                                                                                                                                |

## Una trampa que ya mordió

`document.fonts.check()` **no dice si una familia existe**: devuelve `true` en cuanto
cualquier fallback puede pintar esos caracteres. La primera sonda lo usaba y daba positivo
en las siete familias, incluidas las que no se sirven. La sonda actual mide **ancho de
texto** contra tres bases genéricas; con ella solo `Open Sans` da positivo, que es la
verdad. Antes de firmar un veredicto de fuentes, valida el validador.
