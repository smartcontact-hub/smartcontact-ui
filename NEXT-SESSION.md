# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-08-13 (s27) — HEAD `8f98145`. Sesión corta de mantenimiento: se
> diagnosticaron los MCP de Figma, se archivó la réplica de Informes y se afiló la doc.
> `main` al día, sin ramas abiertas, árbol limpio.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **Coge lo primero de "SIGUIENTE" y hazlo.** No preguntes qué hacer: la lista está
   ordenada y todo lo que hay en ella se ejecuta sin permiso.
3. Lo de "ESPERANDO A RAFA" **no se pregunta**. Está aparcado a propósito; solo se toca si
   él lo saca.
4. Si tocas un fondo o un título → `docs/DECISIONS.md` DD-33 y DD-34. Si tocas una app
   RÉPLICA (`agent`, `cuscare`) → **DD-35**: no se tokenizan a propósito.

⚠️ Todo lo de CusCare y producción de aquí abajo viene medido en **s26** y **no se
re-verificó hoy**. Es una pista, no un hecho: confírmalo antes de construir encima.

---

## 🟢 EN PRODUCCIÓN — 4 sitios, todos desde `main`

| Proyecto | URL | Qué es |
|---|---|---|
| `sc-docs` | **sc-doc.pages.dev** | Showcase del DS |
| `supervisor` | **sc-supervisor.pages.dev** | La app real, con datos de demostración |
| `agent` | **sc-agent.pages.dev** | Réplica del dashboard del agente |
| `cuscare` | **sc-cuscare.pages.dev** | Réplica de la herramienta de tickets |

---

## ▶︎ SIGUIENTE — sin preguntar

Por orden. Todo esto se coge y se hace.

1. **Auditar el copy del panel Summary y del detalle de CusCare** contra las claves
   `PAGES.TICKET.SUMMARY` y `TICKET` de su diccionario
   (`https://cuscare.smart-contact.com/aed/assets/i18n/cuscare/en.json`, 1449 claves). Es
   donde más texto se inventó antes de saber que ese fichero existía.
2. **Ordenación por cabecera en la tabla de Tickets** (la del dashboard sí ordena).
3. **Los iconos del detalle de CusCare siguen siendo glifos** (📞 🗎 ⚑ …), no los SVG reales.
4. **"Show details"** de CusCare: nuestro botón alterna estado y no pinta nada. El contenido
   real no se pudo observar (pulsarlo en la app real no cambió nada en el ticket probado).

Contexto de la réplica: [`projects/cuscare/README.md`](projects/cuscare/README.md) —
9 vistas, 90 tests (`npm run e2e:cuscare`, en CI), 3280 filas de seed.

---

## ⏸️ ESPERANDO A RAFA — NO preguntar

Aparcado a propósito. Solo se toca si él lo saca.

| Qué | Estado |
|---|---|
| **Borrar el proyecto Cloudflare `sc-demo`** | Sigue vivo sirviendo contenido viejo. Es un clic suyo en el dashboard; un borrado permanente no lo ejecuto yo. (~26 deployments → el bug de Cloudflare de «más de 100» NO aplica) |
| **Retirar `sc-page-header`** | Sin consumidores salvo su demo. Decisión suya |
| **Lienzo de página gris↔blanco** | Figma node `13920:4298` (página *Flujos*). Decisión suya |
| **Tramo actual del breadcrumb** | Figma node `13890:157` (página *❖ Breadcrumb*). Lo mira **Marta**. Sin comentario anclado a ese nodo; el último comentario del fichero es del 10-jun |
| **Publicar Code Connect** | Requiere plan Figma Organization/Enterprise + `FIGMA_ACCESS_TOKEN` + que exista `Show Icon` en el master de `card` |
| **B5b · prosa i18n del constructor** | `conditionToDesc()` compone gramática española a mano; necesita ICU MessageFormat o compositor por locale. **NECESITA DISEÑO** |

---

## 🔌 Figma — qué canal usar (verificado 2026-08-13)

**No hay "el MCP de Figma": hay tres servers y caen por separado.** La tabla completa está en
[`AGENTS.md`](AGENTS.md) → *Figma MCP Bridge*. Resumen:

- **`mcp__figma-console__*`** (bridge `:9223`, 118 tools) — el de diario, lee **y escribe**.
  Salud: `figma_get_status` con `probe:true`.
- **`mcp__Figma__*`** — app de escritorio, solo lectura. Sobrevive a que la nube caiga.
- **Nube** (`plugin:figma:figma`, 32 tools) — solo aporta búsqueda en librerías remotas y
  funcionar sin Figma Desktop abierto. **Autenticado en terminal**; el conector de claude.ai
  (`mcp__acb3d14c…__*`) sigue invalidado en la app y se reconecta desde sus ajustes.

Fichero: **"Smart-Contact Design System"** (`khNq9dJKNi13pNllrqm6dx`) — 111 páginas,
2.509 variables en 7 colecciones, 30 comentarios activos.

---

## 🗄️ Archivado — no lo rehagas

**`archive/informes-datareports`** (tag, en `origin`) — réplica nativa de la pantalla
*Informes* del supervisor, ~2.500 líneas medidas sobre el sitio real. Existía porque el
supervisor real embebe esa pantalla en un iframe cross-origin y `html.to.design` no la puede
capturar para Figma. **Rafa confirmó el 2026-08-13 que ya cumplió su función.** Nunca se
mergeó: en producción `/informes` sigue siendo un placeholder.

Recuperarla: `git switch -c feat/informes archive/informes-datareports`.

---

## ⚠️ Trampas que cuestan caro

- **Abrir el detalle de un ticket en CusCare real CAMBIA su estado.** Navegar a
  `…/tickets/ticket/336458` lo pasó de `new` a **OPEN** y lo asignó a Rafa sin pulsar nada.
  Para medir dentro de una ficha, usa una que YA esté `open`/`resolved` (2050567 no deja
  rastro) o pídeselo a él.
- **`npm run e2e` pisa los PNG de `public/usage/`** — corre usage-capture contra `sc-demo` y
  las rutas del supervisor no existen ahí. Gatea lo visual con `ng build` AOT.
- El resto, en [`AGENTS.md`](AGENTS.md) → *Known Traps*.

---

## 📚 Dónde vive cada cosa

[`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) manda: qué documento es el *source of truth* de qué.
Regla de oro al cerrar — **solo se toca el doc cuyo contenido cambió esa sesión.**

---

## Aparcado con razón (sin cambios)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro |
| `line-height` sin unidad | Sin token destino en el Kit |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda |
| `group-assignment-table`, `agent-channel-table` | Formularios disfrazados de tabla, NO migran |
| Paginación de tablas | Valor ≈ 0 hoy (6-84 filas) |
| Los paquetes `@smartcontact-hub/*` | APARCADOS (DD-17): las apps consumen el DS in-repo |
