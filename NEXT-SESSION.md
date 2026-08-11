# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-08-11 — Agent y el rename YA EN `main`. En curso: réplica de
> CusCare, Fase 1 desplegada, parada limpia a mitad de la Fase 2.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **El push a GitHub funciona con normalidad.** Si un hand-off viejo dice lo contrario,
   está desfasado — no lo asumas.
3. **Estás a mitad de la Fase 2 de CusCare** (rama `feat/cuscare`). Todo lo hecho está
   commiteado y pusheado; nada a medias en el árbol. Retomar por "Siguiente paso".
4. **Si vas a tocar un fondo o un título, lee DD-33 y DD-34 antes** (`docs/DECISIONS.md`).
5. **El puente Figma va en los dos sentidos** (`mcp__Figma__*`, file `khNq9dJKNi13pNllrqm6dx`).
   Antes de `use_figma`, carga el skill `figma-use`.

---

## 🟢 EN PRODUCCIÓN (`main`) — los 3 sitios vivos

| Proyecto | URL | Estado |
|---|---|---|
| Showcase del DS (`sc-docs`) | **sc-doc.pages.dev** | ✅ desde `main` |
| Supervisor (app real) | **sc-supervisor.pages.dev** | ✅ desde `main` |
| Agent (réplica) | **sc-agent.pages.dev** | ✅ desde `main` |

`sc-demo.pages.dev` (proyecto Cloudflare VIEJO) **sigue existiendo** — Rafa tiene que
borrarlo a mano (borrado permanente: ni yo ni la extensión lo ejecutamos). No corre prisa:
su build command apunta a un script que ya no existe en `main` (se renombró a
`build:docs`), así que está congelado sirviendo una copia vieja e inofensiva.

---

## 🔵 EN CURSO — CusCare (`feat/cuscare`, sin mergear)

Réplica de `cuscare.smart-contact.com/aed` en `projects/cuscare`. Preview:
**sc-cuscare.pages.dev** (production branch = `feat/cuscare`, NO `main`). Verificado:
hash del bundle servido == build local.

**Fase 1 HECHA** — shell + 3 vistas núcleo, con valores medidos y contrastados:
Tickets (`#/private/cuscare/tickets`), detalle (`…/tickets/ticket/:id`), Dashboard.
Iconos y logo REALES (descargados de su `assets/`, commit `b1ececc`+).

**Fase 2 — lo que queda (6 vistas).** Ya CONFIRMADO en el sitio real, no supuesto:
- `Search` → ruta `/private/cuscare/customer`
- `Manage MO in error` → ruta `/private/cuscare/mo-management`
- Menú del engranaje = **Users · Roles · Groups · Templates** (confirmado abriéndolo;
  las rutas concretas de cada uno AÚN NO se han capturado)

### Siguiente paso concreto
1. Abrir el engranaje en la real y **clicar "Users"** para capturar el patrón de ruta de
   ajustes (el menú se cierra entre llamadas: hay que **clicar y medir en la MISMA**
   llamada de `javascript_tool`, o se pierde).
2. Capturar DOM+estilos de Search y MO-in-error (las dos ya vistas: Search es una pantalla
   de búsqueda con 2 selects + input e ilustración; MO-in-error es tabla vacía con
   filtros por columna).
3. Construirlas y **montar la red e2e de Playwright** (`playwright.cuscare.config.ts`) —
   Rafa lo pidió explícitamente: verificar interacción real, no aproximar.

### Gotchas ya pagados en esta app (no repetirlos)
- **El alto de una fila lo marca su celda MÁS ALTA.** La cabecera medía 44.5 en vez de
  41.5 y la culpa era del **checkbox** de la columna de selección, no de la celda del
  label. Costó 3 intentos fallidos tocando la celda equivocada.
- **Los `<svg-icon>` tienen `src` a ficheros reales** en `assets/icons/iconos-cuscare/…`
  → se descargan con `curl`, no hace falta extraerlos del bundle.
- **El mapeo icono↔item NO va por nombre**: `customer.svg` es el de "Manage MO in error".
  Cruzar la Y del icono con la de su etiqueta.
- **Los iconos NO se recolorean**: el del item activo sigue gris `#8d939d`, solo cambia
  el TEXTO. Por eso van como `<img>`, no inline con `currentColor`.
- **El builder `application` anida el `index.html`** bajo `dist/<app>/browser/` — el
  output dir de Cloudflare para cuscare y agent lleva `/browser`. Sin él, 404.

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
