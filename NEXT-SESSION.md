# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-08-07 — Agent (réplica fiel) + rename sc-demo→sc-docs, ambos
> desplegados a Cloudflare y verificados, NINGUNO mergeado a `main` todavía.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **El push a GitHub funciona con normalidad** (confirmado: 4 pushes esta sesión, sin
   fricción). Si un hand-off viejo dice lo contrario, está desfasado — no lo asumas.
3. **Dos ramas activas sin mergear, ambas con preview verificado** — ver abajo. Antes de
   seguir puliendo cualquiera de las dos, decide con Rafa si toca mergear a `main`.
4. **Si vas a tocar un fondo o un título, lee DD-33 y DD-34 antes** (`docs/DECISIONS.md`):
   el título vive en el cuerpo, y `--sc-bg-default` es el suelo del shell, nunca una
   superficie de contenido.
5. **El puente Figma va en los dos sentidos** (`mcp__Figma__*`, file `khNq9dJKNi13pNllrqm6dx`).
   Antes de `use_figma`, carga el skill `figma-use`.

---

## 🟡 DOS RAMAS SIN MERGEAR — decide antes de seguir

| Rama | Qué es | Preview (verificado en el navegador) | Production branch en Cloudflare |
|---|---|---|---|
| `feat/agent-dashboard` | Réplica fiel del dashboard del Agent (`agent.smart-contact.com/aed`): colores/iconos/timers medidos del sitio real, no estimados | **sc-agent.pages.dev** | apunta a esta rama (no a `main`) |
| `refactor/sc-demo-to-sc-docs` | Rename técnico completo `sc-demo`→`sc-docs` (carpeta, angular.json, scripts, CI, Playwright, docs vivos — históricos como `DECISIONS.md` intactos a propósito) | **sc-doc.pages.dev** (singular — `sc-docs.pages.dev` estaba pillado por otra cuenta, colisión global de namespace) | apunta a esta rama (no a `main`) |

**Cuando Rafa apruebe cada una** (mirando el preview): mergear a `main`, y ENTONCES repuntar
el proyecto Cloudflare correspondiente de la rama a `main` (Settings → Builds & deployments
→ Production branch). Hasta entonces:
- `sc-demo.pages.dev` (el proyecto Cloudflare VIEJO) sigue vivo apuntando a `main`, que
  todavía tiene el nombre antiguo — normal, no está roto, solo pendiente del merge.
- El link "Agent" en Recursos (Lab) solo existe en `feat/agent-dashboard` — `sc-docs` (rama
  del rename) parte de `main`, así que no lo tiene todavía. Se junta al mergear ambas.

**Gotcha ya cazado**: el builder `application` (Angular nuevo) anida el `index.html` bajo
`dist/<app>/browser/`, NO en `dist/<app>` directo — pilló un 404 en el primer deploy del
Agent. `sc-docs` usa el builder viejo `browser` (sin anidar), así que no le afecta.

---

## Abierto — decisiones y pendientes (de antes, sin re-verificar esta sesión)

- **Archivar a `docs/history/`** los 4 docs de construcción ya cerrados: `convergence-manifesto`,
  `component-port-plan`, `foundations-rationale`, `plan-convergencia-flujos`. Confirmado que
  SIGUEN en `docs/` (no archivados). Es `git mv` + arreglar rutas de link en ~6 ficheros.
- **Publicar el Code Connect**: requiere plan Figma Organization/Enterprise + `FIGMA_ACCESS_TOKEN`
  + que exista `Show Icon` en el master de `card`. Ver `docs/code-connect.md`.
- **B5b · prosa i18n del constructor** — `conditionToDesc()` compone gramática española; necesita
  ICU MessageFormat o compositor por locale. **NECESITA DISEÑO.**
- **`sc-page-header` sigue SIN consumidores** en la app (solo su demo). Es API pública del DS;
  retirarlo es decisión de Rafa.
- **Las 5 `<table>` a mano NO deben migrar** — cada una con su razón en
  [`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md).
- **Dos divergencias Figma esperando** (`docs/customs-catalog`): tramo actual del breadcrumb
  (node `13890:157`, la mira **Marta**) y **el lienzo de página gris↔blanco** (node `13920:4298`,
  **espera decisión de Rafa**).

---

## ▶︎ RAMA SÓLO SI HAY ALGO QUE MIRAR

Cloudflare da preview por rama: `sc-supervisor.pages.dev`, `sc-doc.pages.dev`, `sc-agent.pages.dev`.

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
