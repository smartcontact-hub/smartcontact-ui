## Qué y por qué

<!-- Una línea: qué cambia y el porqué. Enlaza la decisión en docs/DECISIONS.md (DD-N) si aplica. -->

## Checklist (gate del DS)

<!--
  CÓMO SE MARCA, y por qué importa:
    [x] = lo he hecho.        [ ] = no lo he hecho todavía.
    n/a = NO APLICA a este cambio — escríbelo así, con el motivo al lado.

  El tick NO es para decir «no aplica». Quien revisa lee un tick como «hecho», y marcar «no
  aplica» con un ✅ dice otra cosa de la que se quiere decir. (Pasó en #210, 2026-09-19.)

  Y lee la columna «¿lo vigila un gate?»: MEDIDO el 2026-09-19, ningún gate, workflow ni script
  lee este checklist. De las seis líneas, DOS las respalda el CI y te desmiente si mientes. Las
  otras CUATRO son tu palabra: si te equivocas ahí, no se entera nadie. Por eso están marcadas.
-->

| ¿Lo vigila un gate? | |
| --- | --- |
| **Sí — el CI lo comprueba** | `verify` · tokens |
| **No — es tu palabra** | capturas visuales · demo y export · bump y CHANGELOG · DECISIONS |

- [ ] **[gate: sí]** `npm run verify` limpio (tokens:gen · parity · guard · type-parity · audit:theme-scale · build · typecheck · lint)
- [ ] **[gate: no]** Si toqué algo visual: `CI=1 npm run e2e` verde. ⚠️ Las capturas `-linux.png` las compara el CI; en un Mac se saltan, así que esa parte la ves en el CI
- [ ] **[gate: sí]** Tokens: solo `--sc-*` (nunca `--p-*` fuera del preset); escala 14-base (sin 8-point, sin `calc` a mano)
- [ ] **[gate: a medias]** Si añadí/cambié un componente: demo en `sc-docs` + export en `public-api.ts`. `audit:components` avisa de los que no tienen demo, pero **no bloquea** (hoy hay 5)
- [ ] **[gate: no]** Si es un cambio consumible del paquete: bump de versión (`npm run version:bump`) + nota en `CHANGELOG.md`
- [ ] **[gate: no]** `docs/DECISIONS.md` actualizado (DD-N) si hubo decisión. Solo se vigila que el fichero esté ordenado, no que hayas añadido nada

## Notas

<!-- Riesgos, follow-ups, gaps anotados. Lo que NO pudiste verificar va aquí, en alto. -->
