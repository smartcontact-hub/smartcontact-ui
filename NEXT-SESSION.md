# NEXT-SESSION — puerta de entrada

> **Esto es el índice, no el hand-off.** El estado de cada línea de trabajo vive en su propio
> fichero, en [`docs/handoff/`](docs/handoff/). Este fichero solo cambia cuando nace o muere un
> frente — así **dos sesiones abiertas a la vez no se pisan**.

## ▶️ EMPIEZA AQUÍ

1. Mira la tabla de frentes, **abre el del trabajo que vas a hacer** (su tramo de arriba es el vigente; los anteriores viven
   en git y en el tag `archive/handoff-<frente>-<fecha>`, y `docs:coherence` los mantiene pocos:
   ≤ 400 líneas y ≤ 6 tramos) y luego el **índice** de
   [`LEARNINGS.md`](LEARNINGS.md) (la tabla; el cuerpo de una regla, cuando te aplique). La
   tarjeta de punto de decisión ya la llevas en `CLAUDE.md`.
2. **Coge lo primero de su sección "SIGUIENTE" y hazlo.** No preguntes qué hacer: está ordenado
   y todo lo que hay ahí se ejecuta sin permiso.
3. **`npm run sesiones` contesta «¿puedo cerrar este chat?» para TODAS las cajas a la vez**:
   qué worktree tiene un PR verde esperando a que lo fundas, cuál tiene commits sin subir, cuál
   sobra ya, y si dos cajas llevan el mismo commit. Córrelo al abrir (para no repetir trabajo que
   otra sesión ya tiene) y al cerrar (una caja se cierra VACÍA: PR fundido y CI leído, no verde y
   sin fundir). Nació el 2026-09-10 midiendo este repo: nueve worktrees vivos, tres con el trabajo
   ya en `main`, y una rama viviendo en dos cajas a la vez (`x` y su `x-2`, el mismo SHA): eso lo
   canta como GEMELAS, no como trabajo duplicado; duplicado es el mismo título en ramas distintas.
   ⚠️ **Lo que diga «borra el worktree» está medido**: antes de proponerlo mira el `status` de SU
   árbol y pasa `git cherry` por sus commits, así que no te manda borrar una caja con ficheros a
   medio editar ni con un commit que nunca llegó a `main`. Si ves `SIN GUARDAR` o `BLOQUEADO`,
   esa caja no se toca.

4. Lo de **"ESPERANDO A RAFA" no se pregunta**. Está aparcado a propósito; solo se toca si él lo saca.
5. Si tocas un fondo o un título → `docs/DECISIONS.md` DD-33 y DD-34. Si tocas una app RÉPLICA
   (`agent`, `cuscare`) → **DD-35**: no se tokenizan a propósito.
6. **Trabaja en TU worktree** (`EnterWorktree name:<tarea>`), no en el árbol principal. Norma de
   Rafa del 2026-09-03, después de que dos sesiones se pisaran el mismo día: el árbol compartido
   comparte `dist/` **y la rama checkouteada**, así que los builds se corrompen entre sí (el
   síntoma engaña: `Cannot find module '@smartcontact-hub/icons'`, que parece una dependencia
   rota) y el checkout se mueve bajo tus pies mientras lees el `git log`. Lo cuentan las dos
   sesiones desde su lado en `docs/handoff/design-system.md` (s42 y s43).
   ⚠️ El worktree **no** aísla el puerto del e2e smoke (:4280, el único sin override): si otra
   sesión está en preflight, toca esperar.

7. **Al cerrar, tu tramo se llama por la FECHA**, no por un contador: en el hand-off del frente,
   `## ✅ <fecha ISO> · <lo que pasó>`, y su **sello va debajo de su propio título**, no en la
   cabecera. Los dos cambios son del 2026-09-04 y salen del mismo sitio: un contador `sNN` es un
   entero global que dos sesiones en paralelo no pueden incrementar a la vez (ese día las dos se
   llamaron «s43»), y una cabecera con estado es lo que se pelea en cada fusión. La fecha y una
   sección propia no necesitan que nadie se coordine.

⚠️ Un hand-off es una **pista, no un hecho**: lleva la fecha de cuando se midió. Confírmalo
antes de construir encima.

---

## 🧭 Frentes abiertos

| Frente                                                                | Hand-off                                                         |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Agent** — réplica medida del Comunicador (SISMAC-3780)              | [`docs/handoff/agent.md`](docs/handoff/agent.md)                 |
| **CusCare** — réplica de la herramienta de tickets                    | [`docs/handoff/cuscare.md`](docs/handoff/cuscare.md)             |
| **Design System + herramienta** — tokens, componentes, Figma, tooling | [`docs/handoff/design-system.md`](docs/handoff/design-system.md) |
| **Agent Mini** — dialpad standalone (réplica del mini aed)            | [`docs/handoff/agent-mini.md`](docs/handoff/agent-mini.md)       |
| **Supervisor Dashboard** — adaptación del Monitor del Supervisor      | [`docs/handoff/supervisor-dashboard.md`](docs/handoff/supervisor-dashboard.md) |
| **Sidebar del Supervisor** — plegado a 80px y apertura de categorías (SISMAC-4340) | [`docs/handoff/supervisor-sidebar.md`](docs/handoff/supervisor-sidebar.md) |
| **Fichas de administración y Configuración del AED** — agente, grupo, usuario (grupo: DD-121; un solo índice y las tres fichas en un molde: DD-122; el resumen como widget: DD-126; el pase de diseño: DD-130; el panel rápido compacto: DD-131; los tipos de usuario con su plantilla: DD-132; las ayudas de las fuentes: DD-133; Contact Center fija con qué nacen grupos y agentes: DD-135; las altas dicen lo que falta: DD-136; las altas fueron en pasos, DD-138, y vuelven al índice con ✓ y «Siguiente»: DD-143; la revisión de producto del 2026-10-01, en PRs pequeños de H a F; sus palabras de la ficha: DD-141; el teléfono saliente: DD-142; la maqueta en tres columnas: DD-144; el nombre fijo al bajar: DD-145; el resumen enlazado: DD-146; los canales por familia y los niveles por canal: DD-147 y DD-148; «Habilitado» y la presencia: DD-149; los canales permitidos: DD-150; asignar desde la lista entera: DD-151; tiempos, horarios y música: DD-152; las columnas en un icono y las acciones fijas del listado: DD-153; después, en un PR, la lista virtual con «reducir movimiento» y el estado en su columna: DD-156; la revisión del 2026-10-04, en un lote: Distribución y colas con el árbol del DS (DD-157), el alta (DD-158), la cifra que lleva a su sitio (DD-159), la tabla al pie (DD-160), el resumen con color (DD-161) y las columnas en un Listbox (DD-162); Recursos, en un lote: la agenda con sus contactos y su editor (DD-163), el resumen de cada recurso con «Editar» (DD-164), Repositorios con cifras y buscador (DD-165), importar contactos (DD-166) y el «+» de crear como el botón de solo icono de primeng.dev (DD-167); sc-docs y el peso de los iconos, en un lote: el código de los ejemplos sale del contrato, «Solo icono» en Button y el icono del índice y de la subsección a su peso (DD-130 §6); la accesibilidad pendiente, en un lote: cada desplegable con nombre y su regla en `audit:screen-hygiene`, las ayudas que se anuncian con su campo (`ariaDescribedBy` en el DS), el marcador de la foto a 3:1, el enlace del resumen pulsable en 24, ordenar columnas sin arrastrar y los subtítulos sin relleno (actualizaciones de DD-133, DD-135, DD-136, DD-146 y DD-162); supervisión y limpieza, en un lote: el panel rápido de agentes también en el Monitor (DD-168), la columna de 240 de agente y usuario medida y con su guarda (actualización de DD-144) y fuera `/lab/admin`, archivado en el Lab de sc-docs (actualización de DD-132); las fichas en tres columnas sin cabecera, con el nombre encima del índice y los canales en las columnas de los campos (DD-170, que retira el nombre fijo de DD-145)) | [`docs/handoff/supervisor-fichas.md`](docs/handoff/supervisor-fichas.md) |
| **Calidad visual** — agrupación medida, revisión previa a enseñar, datos de tortura y editorial, caja de sección compacta, monitor coherente, `figma-pendiente` con el plan de la sesión en Figma, referencias (DD-123 a DD-125, DD-127) | [`docs/handoff/calidad-visual.md`](docs/handoff/calidad-visual.md) |

**Al cerrar, reescribe SOLO el fichero de tu frente.** Si abres una línea de trabajo nueva, crea
su fichero, añade su fila aquí y nómbralo en la fila de `DOCS-INDEX`.

La tabla de «trabajo terminado que no aterriza» se fue el 2026-09-05, que era lo que ella misma
pedía al quedarse vacía: el PR #36 lleva mergeado desde el 2026-09-04 y `gh pr list --state open`
sale sin nada. La regla que la justificaba **no** se va con ella, así que queda dicha aquí: un PR
verde sin mergear no es trabajo entregado — los cinco sitios sirven `main`, así que hasta que entre
no existe para nadie. Si te encuentras uno abierto, mergéalo y lee `npm run ci:verdict` después,
que mergear cuenta como pushear.

---

## 🟢 EN PRODUCCIÓN — 5 sitios, todos desde `main`

| Proyecto     | URL                         | Qué es                                 |
| ------------ | --------------------------- | -------------------------------------- |
| `sc-docs`    | **sc-doc.pages.dev**        | Showcase del DS                        |
| `supervisor` | **sc-supervisor.pages.dev** | La app real, con datos de demostración |
| `agent`      | **sc-agent.pages.dev**      | Réplica del dashboard del agente       |
| `cuscare`    | **sc-cuscare.pages.dev**    | Réplica de la herramienta de tickets   |
| `agent-mini` | **agent-mini.pages.dev**    | Réplica del dialpad mini (standalone)  |

⚠️ Cloudflare da preview por rama en los 5. **Si apuntas un proyecto a una rama, NO la borres al
mergear sin repuntarlo a `main` antes** — pasó con `feat/cuscare` y volvió a pasar con `agent-mini`
(estaba clavado en `worktree-agent-mini`, que GitHub borró al mergear; repuntado a `main` el
2026-09-01). La URL sigue sirviendo el último build aunque la rama desaparezca, así que **no se
nota hasta que echas en falta un cambio**. Nota: `agent-mini.pages.dev` no lleva prefijo `sc-`
como el resto; renombrarlo a `sc-agent-mini` cambiaría la URL (y el enlace en sc-docs), pendiente si Rafa lo quiere.

---

## 📚 Dónde vive cada cosa

[`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) manda: qué documento es el _source of truth_ de qué.
Regla de oro al cerrar — **solo se toca el doc cuyo contenido cambió esa sesión.**
Trampas de trabajo: [`AGENTS.md`](AGENTS.md) → _Known Traps_.

---

## Aparcado con razón (sin cambios)

| Item                                            | Por qué                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| Soltar `primeicons`                             | PrimeNG 21 usa `pi pi-*` 631 veces por dentro      |
| `line-height` sin unidad                        | Sin token destino en el Kit                        |
| Storybook fases 2/3 (DD-29)                     | Proyecto propio, no deuda                          |
| `group-assignment-table`, `agent-channel-table` | Formularios disfrazados de tabla, NO migran        |
| Paginación de tablas                            | Valor ≈ 0 hoy (6-84 filas)                         |
| Los paquetes `@smartcontact-hub/*`              | APARCADOS (DD-17): las apps consumen el DS in-repo |
