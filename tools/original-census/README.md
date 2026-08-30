# Censo del original — sin login arriesgado

La paridad del Agent tenía bloqueado el **censo COMPUTADO** del original: exige
`getComputedStyle` del DOM en vivo tras login (`#/private`). El plan original era
`parity:login`, que abre una SEGUNDA sesión de agente — riesgo de telefonía viva.

**Alternativa sin riesgo (2026-08-31):** Rafa ya tiene el original abierto y logueado
en su navegador. En vez de una segunda sesión, mide en la SUYA:

1. Pon la ventana a ~**1456px** de ancho (el ancho de referencia de la réplica). Si no
   puedes exacto, no pasa nada: el snippet anota el ancho real y el diff escala.
2. Ve al estado que quieras medir en `#/private` (NO hace falta hacer nada más).
3. F12 → Consola → pega `snippet.js` (todo). Es **solo lectura**: no clica ni navega.
4. Descarga `original-census.ndjson`. Muévelo a `.cache/` del repo (o dime que está en
   Descargas).
5. Cruce: `node tools/compare-ndjson.ts .cache/original-census.ndjson findings/phase-2-metrics-replica-1456-<estado>.ndjson [--scale 1456/<ancho-real>]`

Produce el MISMO formato que `tools/phase2-metrics.ts`, así `compare-ndjson.ts` lo
casa por clave estructural.
