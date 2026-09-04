# NEXT-SESSION — puerta de entrada

> **Esto es el índice, no el hand-off.** El estado de cada línea de trabajo vive en su propio
> fichero, en [`docs/handoff/`](docs/handoff/). Este fichero solo cambia cuando nace o muere un
> frente — así **dos sesiones abiertas a la vez no se pisan**.

## ▶️ EMPIEZA AQUÍ

1. Mira la tabla de frentes, **abre el del trabajo que vas a hacer** y luego el **índice** de
   [`LEARNINGS.md`](LEARNINGS.md) (la tabla; el cuerpo de una regla, cuando te aplique). La
   tarjeta de punto de decisión ya la llevas en `CLAUDE.md`.
2. **Coge lo primero de su sección "SIGUIENTE" y hazlo.** No preguntes qué hacer: está ordenado
   y todo lo que hay ahí se ejecuta sin permiso.
3. Lo de **"ESPERANDO A RAFA" no se pregunta**. Está aparcado a propósito; solo se toca si él lo saca.
4. Si tocas un fondo o un título → `docs/DECISIONS.md` DD-33 y DD-34. Si tocas una app RÉPLICA
   (`agent`, `cuscare`) → **DD-35**: no se tokenizan a propósito.
5. **Trabaja en TU worktree** (`EnterWorktree name:<tarea>`), no en el árbol principal. Norma de
   Rafa del 2026-09-03, después de que dos sesiones se pisaran el mismo día: el árbol compartido
   comparte `dist/` **y la rama checkouteada**, así que los builds se corrompen entre sí (el
   síntoma engaña: `Cannot find module '@smartcontact-hub/icons'`, que parece una dependencia
   rota) y el checkout se mueve bajo tus pies mientras lees el `git log`. Lo cuentan las dos
   sesiones desde su lado en `docs/handoff/design-system.md` (s42 y s43).
   ⚠️ El worktree **no** aísla el puerto del e2e smoke (:4280, el único sin override): si otra
   sesión está en preflight, toca esperar.

6. **Al cerrar, tu tramo se llama por la FECHA**, no por un contador: en el hand-off del frente,
   `## ✅ <fecha ISO> · <lo que pasó>`, y su **sello va debajo de su propio título**, no en la
   cabecera. Los dos cambios son del 2026-09-04 y salen del mismo sitio: un contador `sNN` es un
   entero global que dos sesiones en paralelo no pueden incrementar a la vez (ese día las dos se
   llamaron «s43»), y una cabecera con estado es lo que se pelea en cada fusión. La fecha y una
   sección propia no necesitan que nadie se coordine.

⚠️ Un hand-off es una **pista, no un hecho**: lleva la fecha de cuando se midió. Confírmalo
antes de construir encima.

---

## 🧭 Frentes abiertos

| Frente                                                                | Hand-off                                                         | Último tramo     |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------- |
| **Agent** — réplica medida del Comunicador (SISMAC-3780)              | [`docs/handoff/agent.md`](docs/handoff/agent.md)                 | 2026-08-31       |
| **CusCare** — réplica de la herramienta de tickets                    | [`docs/handoff/cuscare.md`](docs/handoff/cuscare.md)             | 2026-08-31       |
| **Design System + herramienta** — tokens, componentes, Figma, tooling | [`docs/handoff/design-system.md`](docs/handoff/design-system.md) | 2026-09-04       |
| **Agent Mini** — dialpad standalone (réplica del mini aed)            | [`docs/handoff/agent-mini.md`](docs/handoff/agent-mini.md)       | 2026-09-01       |

**Al cerrar, reescribe SOLO el fichero de tu frente.** Si abres una línea de trabajo nueva, crea
su fichero, añade su fila aquí y nómbralo en la fila de `DOCS-INDEX`.

### ⏳ Abierto ahora mismo (mira esto ANTES de empezar)

| Qué | Dónde | Estado |
| --- | ----- | ------ |
| El simulador de `/validar`, jugable | [PR #36](https://github.com/smartcontact-hub/smartcontact-ui/pull/36) | CI verde, **sin mergear** |

Un PR verde sin mergear no es trabajo entregado: `sc-doc.pages.dev` sirve `main`, así que hasta
que entre no existe para nadie. Si sigue abierto, mergéalo (y lee `npm run ci:verdict` después,
que mergear cuenta como pushear). Cuando esta tabla se quede vacía, bórrala.

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
