# CLAUDE.md

Repo del Design System Smart Contact (3 paquetes ng-packagr + demo). Las convenciones completas
del trabajo con agentes están en [AGENTS.md](AGENTS.md): léelas antes de tocar componentes o tokens.

- **Al empezar**: [NEXT-SESSION.md](NEXT-SESSION.md) (índice de frentes) → el hand-off de TU
  frente → el **índice** de [LEARNINGS.md](LEARNINGS.md) (una tabla; baja al cuerpo de una regla
  cuando la tarjeta de abajo la cite). LEARNINGS mide ≤200 líneas y lo vigila un gate.
- **La guía que se impone sola** vive en `.claude/settings.json` → `scripts/hooks/`. El hook de
  Bash deniega, con la regla como motivo, los cinco comandos de LEARNINGS #7 #11 #12 (push sin
  preflight sobre ESTE árbol, `echo $?` colgado, volcar credenciales, `git diff main...rama`,
  `for f in $VAR`). El de Stop exige leer el CI tras un push (`npm run ci:verdict`), que cada
  corrección lleve ruta si reflexionaste, y que el mensaje de cierre lleve el parte en llano (qué
  cambia · en qué te ayuda · rastro · seguro cerrar, que MIDE el árbol y te desmiente; AGENTS.md
  §Session-Close, paso 6). El de compactación avisa
  si la guía cambió en `origin/main`. El de cada mensaje de Rafa apunta lo que suena a corrección y te pide nombrar la
  regla que ya lo cubría; un cierre («cerramos») invoca `/reflect`. Salida explícita: `# sc:ok`.

<!-- tarjeta:inicio -->
## Antes de AFIRMAR, COMMITEAR o PUSHEAR, relee esto (regla de LEARNINGS entre paréntesis)

1. ¿Lo medí YO, hoy, en ESTE build? Si no: "según X, sin verificar". (#17 #5)
2. ¿Mi sonda o mi test enrojece con el fallo puesto? Si no lo probé, no es evidencia. (#2 #6)
3. ¿El estímulo LLEGÓ, y es el que produce el sistema real, no uno que inyecté? (#1)
4. Cifra o escritura EN MASA → ¿qué entra? Clave repetida = emisión: diffea antes/después. (#12 #11)
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
- **Antes de dar nada por bueno**: `npm run verify` (39 gates encadenados) y, si
  tocaste algo visual, `npm run e2e`. **Antes de pushear no basta `verify`**: el CI
  son 9 pasos, enumerados en `.github/workflows/ci.yml`; `npm run preflight:scope -- --run` corre
  la parte rápida (gates + builds, ~8 min) y deja la marca que el hook de push exige (el `--` es
  obligatorio: sin él npm solo IMPRIME el plan). Los e2e los corre el CI: léelo con `ci:verdict`.
- ⚠️ **Los bloques `@sc-gen:*` son GENERADOS y viven en CINCO ficheros**, no solo en
  `01-primitive.css`: `01-primitive` (typography · scale · radius · palette), `02-semantic`
  (semantic-color-light), `04-component` (cmp-sizing · cmp-color-light),
  `05-extensions` (effects) y `07-dark` (semantic-color-dark · cmp-color-dark) —
  10 zonas. **No editar ninguna a mano**: `npm run tokens:import` encadena 5
  generadores y las reescribe todas. (Medido 2026-08-13.)
