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
a un script que ya no existe). **Borrarlo es un clic de Rafa desde el dashboard** — un
borrado permanente no lo ejecuto yo. Dato útil: `wrangler pages deployment list
--project-name sc-demo` mostró **~26 deployments**, así que el bug de Cloudflare de «más de
100» que citó la extensión NO aplica y el borrado directo debería funcionar.

---

## 🔵 CusCare — qué está hecho y qué falta

`projects/cuscare` replica `cuscare.smart-contact.com/aed`. **Las 9 vistas montadas**, con
valores extraídos del sitio real (no estimados) y **54 tests e2e** (`npm run e2e:cuscare`,
en CI).

Funciona de verdad, no es maqueta: filtros (4 tipos distintos, con multiselect), paginación
con su loader, selección de filas con barra dinámica, búsqueda, modal de nuevo ticket,
gestor de columnas con reordenado por arrastre (Angular CDK) y **las 4 acciones en bloque
con sus paneles y su modal de confirmación**.

### Acciones en bloque — RESUELTO (s26)

Estaban bloqueadas porque parecía que abrirlas exigía ejecutar algo sobre tickets reales.
No hacía falta: **los paneles y los modales viven ocultos en el árbol desde el arranque**,
así que se leyeron del DOM sin pulsar ninguna acción. Para lo que sí requería selección se
marcó un ticket de 2023 ya cerrado.

Lo que se descubrió: **no son cuatro menús iguales**. Assign trae buscador y 34 agentes;
Change status un desplegable de dos opciones (Pending/Resolved) más un enlace "Spam";
Unsubscribe un único radio; y **Archive no abre panel**, va directo al modal. Detalle en
[`projects/cuscare/README.md`](projects/cuscare/README.md).

### Paginador y seed — también corregidos (s26)

El pie decía **"1–10 of 60 results"** con 6 páginas frente a las **328** de la real: la
diferencia más visible de la pantalla. El seed pasa a **3280 filas generadas** (bucle en
tiempo de ejecución, no engordan el bundle) con la fecha retrocediendo hasta 2023, como
en la real. Y la ventana de números **ya sigue a la página actual** (`1 … 4 5 6 … 328`);
antes se quedaba clavada en `1 2 3 4 5`. "Rows per page" tiene ahora las cinco opciones
del original (10/25/50/**100/300**).

### "+ New ticket" paso 2 — RESUELTO (s26)

Rafa pulsó **Save** él mismo y confirmó lo que se temía: **crea un ticket de verdad**
(la app saltó a `…/tickets/ticket/2051827/pre-ticket`). Por eso no se pulsó al extraer.

Y lo que sale **no es un formulario**: es la pantalla de detalle en vacío (`#0`) con el
modal **"Search customer"** encima. Replicado, con su ruta `…/ticket/:id/pre-ticket`.

### Lo que SIGUE pendiente

- **Ordenación por cabecera**: no replicada.
- **Los iconos del detalle de ticket son glifos** (📞 🗎 ⚑ …), no los SVG reales.
- **Los disparadores de dos diálogos son SUPOSICIÓN, no medición**: "Right to be
  forgotten" cuelga del botón Unsubscribe y el de motivo de no reembolso del botón
  Refund. Averiguar los reales exige ejecutar acciones sobre tickets vivos.
- **Nav** (columna Usage de la tabla de suscripciones) sigue sin hacer nada: caja medida
  (67.9×30, radio 3.504, `#233155`), comportamiento no. **Summary ya está** — abría una
  vista entera, replicada en `summary-panel.component.ts`.
- ~~Refund y Unsubscribe apuntan a los componentes equivocados~~ **HECHO (s26)**:
  reapuntados a `refund-modal` y `unsubscribe-confirm-modal`, ambos medidos en la real.
  Del de reembolsos salió un detalle que no se adivina: por cada cargo hay **DOS
  botones, API y BNK** — las dos vías de devolución.
- **Ojo con los tres botones de esa barra** (Unsubscribe · Refund · Detail): en la real
  actúan sobre las **filas de suscripción marcadas**, y no hacen nada sin selección. La
  réplica los abre siempre; replicar esa condición está pendiente.
- **"Show details"** despliega un panel cuyo contenido NO se pudo observar: pulsarlo en
  la real no cambió el texto de la página en el ticket probado. Nuestro botón alterna
  estado y no pinta nada — deliberado, no un olvido.
- **El pre-ticket 2051827 no se puede archivar** (Rafa lo pidió, 2026-08-11): filtrando
  por su ID exacto en la lista da "No Data Found", y su propia pantalla no tiene ni
  archivar ni borrar (sus iconos son editar · guardar · 3 banderas · x · buscar · notas
  · adjunto). Es un borrador que nunca entró en la lista; el total sigue en 3280.

### ⚠️ Abrir el detalle de un ticket CAMBIA su estado

Comprobado a mi costa el 2026-08-11: al navegar a `…/tickets/ticket/336458` en la app
real, el ticket pasó de `new` a **OPEN** y quedó anotado en su historial —
«22:17 · Rafael Areses · Status changed to OPEN»— sin pulsar nada. **Ver ES actuar** en
esta pantalla. Si hace falta volver a medir ahí, usar un ticket que YA esté abierto, o
pedírselo a Rafa.

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
- ~~Archivar a `docs/history/` los 4 docs de construcción cerrados~~ **HECHO (s25)**:
  `convergence-manifesto`, `component-port-plan`, `foundations-rationale` y
  `plan-convergencia-flujos` viven ya en `docs/history/`, con sus filas del índice marcadas
  *construcción CERRADA* y los ~25 enlaces reapuntados.
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
