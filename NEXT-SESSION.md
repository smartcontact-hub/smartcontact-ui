# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-23, sesión 23 (icono opcional en `sc-card` + piloto de Code
> Connect + limpieza de docs — con el push BLOQUEADO por acceso de solo-lectura).**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **Confirma el acceso de escritura a GitHub ANTES del trabajo caro** (ver el bloqueo
   de abajo). Si puedes pushear, confirma el CI LEYENDO el run del último commit.
3. **Si vas a tocar un fondo o un título, lee DD-33 y DD-34 antes** (`docs/DECISIONS.md`):
   el título vive en el cuerpo, y `--sc-bg-default` es el suelo del shell, nunca una
   superficie de contenido. Las dos revisan decisiones anteriores y no se revierten a medias.
4. **El puente Figma va en los dos sentidos** (`mcp__Figma__*`, file `khNq9dJKNi13pNllrqm6dx`).
   Antes de `use_figma`, carga el skill `figma-use` (`get_figma_skill` →
   `skill://figma/figma-use/SKILL.md`) y pásalo en `skillNames` con prefijo `resource:`.
5. **B3 y B4 cerrados. Del plan de convergencia solo queda B5b** (necesita diseño).
   Suite del supervisor: 125 tests. `--sc-text-subtle` decidido (Rafa: AA por delante).

---

## 🔴 BLOQUEO DE ESTA SESIÓN — GitHub de solo-lectura

Confirmado por tres vías (fallan por motivos distintos, se corroboran):
- `git push` → **403 Forbidden** de GitHub al `receive-pack` (el token del relay lee, no escribe).
- GitHub MCP `create_branch`/`push_files` → **"Resource not accessible by integration"**.
- API directa (`api.github.com`) → **403** por el proxy de egress.

Además la clave de firma (`/home/claude/.ssh/commit_signing_key.pub`) es un fichero **vacío
de 0 bytes** → no se pueden firmar commits.

**Qué falta (acción de Rafa/admin):** dar a la integración de Claude **escritura (contents)
+ una clave de firma real** sobre `smartcontact-hub/smartcontact-ui`. Hasta entonces ninguna
sesión aquí puede pushear ni firmar. Entrega provisional: parche `git format-patch` aplicado
con `git am` desde el propio setup del operador.

---

## HECHO en la sesión 23 (2 commits locales, NO pusheados)

| Commit (local) | Qué |
|---|---|
| `476c9cd` | `sc-card` gana input `icon` opcional (Material Symbols, p. ej. `auto_awesome`) + demo + inventario |
| `287bc62` | Piloto de Code Connect para la card (`card` 238:10355 → `sc-card`) |

- **Gates locales verdes** leídos: `verify` entero, los 3 builds AOT, e2e 54/54, y verificación visual del icono.
- **Limpieza de docs** (en el working tree, va en el mismo push): borrados los 3 `README.md`
  duplicados de `.agents/skills/` y el muerto `playbook-migracion-platform.md` (DD-17 lo
  superó); `pull_request_template` apunta ya a `docs/DECISIONS.md`; las **TRAMPAS** de este
  hand-off se movieron a `AGENTS.md` (su dueño según el índice).
- **El icono en Figma**: el master `card` necesita una propiedad booleana **`Show Icon`** +
  instance-swap de `auto_awesome`, en el `caption`. Prompt de Figma preparado (pásaselo al
  agente de Figma). El código ya soporta el input; falta el lado Figma.

### Teed up (no hecho por el bloqueo/ churn)
- **Archivar a `docs/history/`** los 4 docs de construcción ya cerrados: `convergence-manifesto`,
  `component-port-plan`, `foundations-rationale`, `plan-convergencia-flujos`. Es `git mv` +
  arreglar rutas de link en ~6 ficheros (ningún gate lo checa, pero deja links en prosa). Mejor
  en un lote con push.
- **Publicar el Code Connect**: requiere plan Figma Organization/Enterprise + `FIGMA_ACCESS_TOKEN`
  + que exista `Show Icon` en el master. Ver `docs/code-connect.md`. Revierte la vieja decisión
  `code-connect-low-priority` (a petición de Rafa).

---

## Abierto — decisiones y pendientes

- **B5b · prosa i18n del constructor** — `conditionToDesc()` compone gramática española; necesita
  ICU MessageFormat o compositor por locale. Lo mecánico (~28 claves) ya está. **NECESITA DISEÑO.**
- **`sc-page-header` sigue SIN consumidores** en la app (solo su demo). Es API pública del DS;
  retirarlo es decisión de Rafa.
- **Las 5 `<table>` a mano NO deben migrar** — cada una con su razón en
  [`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md) (matrices de permisos +
  un picker). La familia `.table` está migrada entera.
- **Dos divergencias Figma esperando** (`docs/customs-catalog`): tramo actual del breadcrumb
  (node `13890:157`, la mira **Marta**) y **el lienzo de página gris↔blanco** (node `13920:4298`
  en la página `Flujos`, **espera decisión de Rafa** — es «toda la app pasa de lienzo gris a blanco»).

---

## ▶︎ RAMA SÓLO SI HAY ALGO QUE MIRAR

Cloudflare da preview por rama: `sc-supervisor.pages.dev`, `sc-demo.pages.dev`.

| | |
|---|---|
| **Rama** | El cambio se VE (pantallas, color, tipografía, un flujo). Rafa abre el enlace, compara con prod, decide. |
| **Directo a `main`** | El cambio NO se ve (tokens sin efecto visual, scripts, guardianes, tests, docs). Lo cubren los gates. |

Para un operador que trabaja solo, la única razón de rama es el enlace para mirar. Si no hay nada que mirar, no hay razón.

---

## Aparcado con razón (sin cambios)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro |
| `line-height` sin unidad | Sin token destino en el Kit |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda |
| `group-assignment-table`, `agent-channel-table` | Formularios disfrazados de tabla, NO migran |
| Paginación de tablas | Valor ≈ 0 hoy (6-84 filas) |
| Los paquetes `@smartcontact-hub/*` | APARCADOS (DD-17): la app consume el DS in-repo por tsconfig paths |
