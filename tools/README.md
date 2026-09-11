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
| `figma-export-parity.mjs` | **el eslabón que faltaba**: el fichero de Figma contra el export del Kit. `tokens:parity` compara *export ↔ CSS*, y por el tramo *Figma ↔ export* se coló el desfase de julio. Imprime el JavaScript que se le pega a `figma_execute_across_files` (fileKey del DS), con los valores del Kit ya resueltos. No es gate: necesita el bridge abierto. |

## Paridad Figma ↔ export, en dos minutos

```bash
node tools/figma-export-parity.mjs primitive   # y semantic-light · semantic-dark · component-light · component-dark · app
```

Pega la salida en `figma_execute_across_files` con `fileKeys: ["khNq9dJKNi13pNllrqm6dx"]`. Verde es
`distintos: []` **con `coincidencias` distinto de cero**: si sale 0 y la lista vacía, el comparador
no está casando nada y el verde es falso.

**Medido el 2026-09-12, las seis capas: 844 tokens, 0 divergencias.** (`primitive` 282 ·
`semantic` 82+82 · `component` 346+346 · `app` 6.) Para `component`, que son 346 por modo, se
compara un checksum por familia y solo se baja al detalle donde no cuadre.

⚠️ **El modo no viaja entre colecciones.** El `modeId` de «Dark» en *Component* no es el de «Dark»
en *Semantic*: seguir un alias con el modo de partida cae al primer modo del destino (el claro) y
la capa oscura falla EN BLOQUE — 21 de 24 familias «discrepando» que no eran deriva, era la sonda.
La herramienta busca el modo del destino por NOMBRE. Si algún día vuelve a salir un rojo así de
redondo, sospecha del instrumento antes que del fichero.

## Una trampa que ya mordió

`document.fonts.check()` **no dice si una familia existe**: devuelve `true` en cuanto
cualquier fallback puede pintar esos caracteres. La primera sonda lo usaba y daba positivo
en las siete familias, incluidas las que no se sirven. La sonda actual mide **ancho de
texto** contra tres bases genéricas; con ella solo `Open Sans` da positivo, que es la
verdad. Antes de firmar un veredicto de fuentes, valida el validador.
