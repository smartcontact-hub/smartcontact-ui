## Qué y por qué

<!-- Una línea: qué cambia y el porqué. Enlaza decisión en DECISIONS-LOG si aplica. -->

## Checklist (gate del DS)

- [ ] `npm run verify` limpio (tokens:gen · parity · guard · type-parity · audit:theme-scale · build · typecheck · lint)
- [ ] Si toqué algo visual: `CI=1 npm run e2e` verde
- [ ] Tokens: solo `--sc-*` (nunca `--p-*` fuera del preset); escala 14-base (sin 8-point, sin `calc` a mano)
- [ ] Si añadí/cambié un componente: demo en `sc-demo` + export en `public-api.ts`
- [ ] Si es un cambio consumible del paquete: bump de versión (`npm run version:bump`) + nota en `CHANGELOG.md`
- [ ] `DECISIONS-LOG-B.md` actualizado si hubo decisión

## Notas

<!-- Riesgos, follow-ups, gaps anotados. -->
