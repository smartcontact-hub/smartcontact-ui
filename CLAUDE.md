# CLAUDE.md

Repo del Design System Smart Contact (3 paquetes ng-packagr + demo). Las convenciones completas
del trabajo con agentes están en [AGENTS.md](AGENTS.md): léelas antes de tocar componentes o tokens.

- **Al empezar**: [NEXT-SESSION.md](NEXT-SESSION.md) (índice de frentes) → el hand-off de TU
  frente → el **índice** de [LEARNINGS.md](LEARNINGS.md) (una tabla; baja al cuerpo de una regla
  cuando la tarjeta de abajo la cite). LEARNINGS mide ≤200 líneas y lo vigila un gate.
- **La guía que se impone sola** vive en `.claude/settings.json` → `scripts/hooks/`. El hook de
  Bash deniega, con la regla como motivo: un push sin preflight sobre ESTE árbol, un `echo $?`
  colgado de un gate, volcar configs con credenciales, `git diff main...rama` y `for f in $VAR`.
  El de Stop exige leer el CI tras un push (`npm run ci:verdict`). El de compactación te dice si
  la guía cambió en `origin/main`. Salida explícita: `# sc:ok` en el comando, y dicho en el mensaje.

<!-- tarjeta:inicio -->
## Antes de AFIRMAR, COMMITEAR o PUSHEAR, relee esto (regla de LEARNINGS entre paréntesis)

1. ¿Lo medí YO, hoy, en ESTE build? Si no: "según X, sin verificar". (#17 #5)
2. ¿Mi sonda o mi test enrojece con el fallo puesto? Si no lo probé, no es evidencia. (#2 #6)
3. ¿El estímulo LLEGÓ, y es el que produce el sistema real, no uno que inyecté? (#1)
4. Cifra → ¿qué entra en el conteo? Si hay un ejecutor que la sabe, es la suya. (#12)
5. El primer arreglo falló → lo siguiente es una MEDICIÓN, no otro arreglo. (#8)
6. Push → preflight UNA vez sobre el árbol FINAL; veredicto = `npm run ci:verdict`. (#7)
7. "Bloqueado" o "esperando a Rafa" → una sonda más: ¿ya lo sirve el sistema? (#10 #14)
<!-- tarjeta:fin -->

Resumen operativo:

- **Tokens**: `--sc-*` es el contrato; `--p-*` solo existe dentro de
  `projects/ui-smartcontact/src/lib/theme/sc-preset/`. No inventar tokens: todo
  valor métrico sale del export del Kit
  (`projects/design-tokens/scripts/kit-export-dtcg.json`).
- **Escala**: única tabla 14-base v/14 (`--sc-scale-*`, en rem). En componentes
  se consume el alias `--sc-spacing-*`. Nada de `calc(...)` manual ni px a pelo.
- **Naming**: wrappers PrimeNG pegado (`sc-inputtext`); custom en kebab
  (`sc-empty-state`).
- **UX de pantalla**: al construir pantallas de app, sigue la barra de calidad de
  [AGENTS.md](AGENTS.md) §«UX de pantalla» (color funcional, `sc-skeleton` en carga, copy sin
  relleno, `sc-icon` sin emojis, contraste, sin saltos). Navegable: `sc-docs` → Fundamentos →
  Patrones.
- **Antes de dar nada por bueno**: `npm run verify` (28 gates encadenados) y, si
  tocaste algo visual, `npm run e2e`. **Antes de pushear no basta `verify`**: el CI
  son 8 pasos, enumerados en `.github/workflows/ci.yml`; `npm run preflight:scope -- --run` elige
  el carril y deja la marca que el hook de push exige (el `--` es obligatorio: sin él npm se
  come el flag, el script solo IMPRIME el plan y no deja marca).
- ⚠️ **Los bloques `@sc-gen:*` son GENERADOS y viven en CINCO ficheros**, no solo en
  `01-primitive.css`: `01-primitive` (typography · scale · radius · palette), `02-semantic`
  (semantic-color-light), `04-component` (cmp-sizing · cmp-color-light),
  `05-extensions` (effects) y `07-dark` (semantic-color-dark · cmp-color-dark) —
  10 zonas. **No editar ninguna a mano**: `npm run tokens:import` encadena 5
  generadores y las reescribe todas. (Medido 2026-08-13; antes esta línea nombraba
  solo `01-primitive` y quien la creyera perdía el trabajo hecho en las otras cuatro.)
