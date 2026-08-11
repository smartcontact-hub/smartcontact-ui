# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-08-11 (s25) — Agent, rename sc-demo→sc-docs y CusCare completo, TODO
> mergeado en `main` y desplegado. No queda ninguna rama abierta.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **El push a GitHub funciona con normalidad.** Si un hand-off viejo dice lo contrario,
   está desfasado.
3. **No hay trabajo a medias**: árbol limpio, `main` al día, 4 sitios en producción.
4. **Si vas a tocar un fondo o un título, lee DD-33 y DD-34 antes** (`docs/DECISIONS.md`).
   Si tocas una app RÉPLICA (agent, cuscare), lee **DD-35**: no se tokenizan a propósito.

---

## 🟢 EN PRODUCCIÓN — los 4 sitios, todos desde `main`

| Proyecto | URL | Qué es |
|---|---|---|
| `sc-docs` | **sc-doc.pages.dev** | Showcase del DS (fundaciones, catálogo, uso real, Lab) |
| `supervisor` | **sc-supervisor.pages.dev** | La app real, con datos de demostración |
| `agent` | **sc-agent.pages.dev** | Réplica del dashboard del agente |
| `cuscare` | **sc-cuscare.pages.dev** | Réplica de la herramienta de tickets |

⚠️ **`sc-demo.pages.dev` sigue existiendo** y responde 200 con contenido viejo. Es el
proyecto Cloudflare anterior al rename; sus builds recientes fallan (su build command apunta
a un script que ya no existe). **Borrarlo es un clic de Rafa** — ni yo ni la extensión
ejecutamos borrados permanentes. Dato útil: `wrangler pages deployment list --project-name
sc-demo` mostró **~26 deployments**, así que el bug de Cloudflare de «más de 100» que citó la
extensión probablemente NO aplica: intentar borrarlo desde el dashboard debería bastar.

---

## 🔵 CusCare — qué está hecho y qué falta

`projects/cuscare` replica `cuscare.smart-contact.com/aed`. **Las 9 vistas montadas**, con
valores extraídos del sitio real (no estimados) y **54 tests e2e** (`npm run e2e:cuscare`,
en CI).

Funciona de verdad, no es maqueta: filtros (4 tipos distintos, con multiselect), paginación
con su loader, selección de filas con barra dinámica, búsqueda, modal de nuevo ticket, y
gestor de columnas con reordenado por arrastre (Angular CDK).

### Lo único pendiente, y por qué está bloqueado

**El contenido de los 4 desplegables de acciones en bloque** (Assign · Change status ·
Unsubscribe · Archive) y **el segundo paso del modal de nuevo ticket**.

No es dejadez: abrir esos menús exige tener filas seleccionadas, y **elegir una opción
ejecuta la acción sobre tickets REALES** del sistema de Rafa (asignar, cambiar estado, dar de
baja, archivar). Lo mismo con el modal: llegar al formulario exige pulsar Save, que crea un
ticket.

**Para desbloquearlo**: que Rafa abra uno y pase un pantallazo, o dicte las opciones. Los
botones ya están con su estado correcto (deshabilitados sin selección); solo falta el menú.

### Terreno de esta app (lo que más sorprende)

Está en memoria (`cuscare-replica-terrain`), pero lo esencial: **mezcla PrimeNG y Angular
Material según la pantalla**, con métrica distinta (fila 47.5 vs 32.7px); los rótulos **no
predicen las rutas** ("Groups" → `/settings/entities`, "Search" → `/customer`); y el botón
azul "SC" de abajo a la derecha **es de terceros** (inyectado fuera de `<app-root>`) — hay un
test que falla si alguien lo añade.

---

## Abierto — decisiones y pendientes

- **Exención del guard para apps réplica.** `scripts/token-guard.mjs` exime a `agent` y
  `cuscare` de las reglas 4-7 (campos PrimeNG crudos y tipografía literal), porque una réplica
  debe parecerse al ORIGINAL, no a nuestro DS (DD-35). Se validó las dos veces que el guard
  sigue cazando la infracción fuera de las réplicas. **Rafa lo dio por bueno**; si algún día se
  revisa, el criterio alternativo es tokenizarlas y perder fidelidad.
- **Archivar a `docs/history/`** los 4 docs de construcción cerrados: `convergence-manifesto`,
  `component-port-plan`, `foundations-rationale`, `plan-convergencia-flujos`. Confirmado que
  siguen en `docs/`. Es `git mv` + arreglar links en ~6 ficheros.
- **Publicar el Code Connect**: requiere plan Figma Organization/Enterprise +
  `FIGMA_ACCESS_TOKEN` + que exista `Show Icon` en el master de `card`.
- **B5b · prosa i18n del constructor** — `conditionToDesc()` compone gramática española;
  necesita ICU MessageFormat o compositor por locale. **NECESITA DISEÑO.**
- **`sc-page-header` sigue SIN consumidores** (solo su demo). Retirarlo es decisión de Rafa.
- **Dos divergencias Figma esperando**: tramo actual del breadcrumb (node `13890:157`, la mira
  **Marta**) y el lienzo de página gris↔blanco (node `13920:4298`, **decisión de Rafa**).

---

## ▶︎ RAMA SÓLO SI HAY ALGO QUE MIRAR

Cloudflare da preview por rama en los 4 proyectos.

| | |
|---|---|
| **Rama** | El cambio se VE. Rafa abre el enlace, compara con prod, decide. |
| **Directo a `main`** | El cambio NO se ve (tokens sin efecto visual, scripts, tests, docs). |

⚠️ **Si creas una rama y apuntas un proyecto Cloudflare a ella, NO la borres al mergear sin
repuntar el proyecto a `main` antes.** Pasó con `feat/cuscare`: al borrarla, `sc-cuscare` quedó
apuntando a una rama fantasma y dejó de reconstruirse (la URL seguía sirviendo el último build,
así que no se nota hasta que echas en falta un cambio).

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
