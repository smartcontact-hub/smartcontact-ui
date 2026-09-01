# NEXT-SESSION — puerta de entrada

> **Esto es el índice, no el hand-off.** El estado de cada línea de trabajo vive en su propio
> fichero, en [`docs/handoff/`](docs/handoff/). Este fichero solo cambia cuando nace o muere un
> frente — así **dos sesiones abiertas a la vez no se pisan**.

## ▶️ EMPIEZA AQUÍ

1. Mira la tabla de frentes, **abre el del trabajo que vas a hacer** y luego lee
   [`LEARNINGS.md`](LEARNINGS.md).
2. **Coge lo primero de su sección "SIGUIENTE" y hazlo.** No preguntes qué hacer: está ordenado
   y todo lo que hay ahí se ejecuta sin permiso.
3. Lo de **"ESPERANDO A RAFA" no se pregunta**. Está aparcado a propósito; solo se toca si él lo saca.
4. Si tocas un fondo o un título → `docs/DECISIONS.md` DD-33 y DD-34. Si tocas una app RÉPLICA
   (`agent`, `cuscare`) → **DD-35**: no se tokenizan a propósito.

⚠️ Un hand-off es una **pista, no un hecho**: lleva la fecha de cuando se midió. Confírmalo
antes de construir encima.

---

## 🧭 Frentes abiertos

| Frente                                                                | Hand-off                                                         | Última sesión    |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------- |
| **Agent** — réplica medida del Comunicador (SISMAC-3780)              | [`docs/handoff/agent.md`](docs/handoff/agent.md)                 | 2026-08-31 (s37) |
| **CusCare** — réplica de la herramienta de tickets                    | [`docs/handoff/cuscare.md`](docs/handoff/cuscare.md)             | 2026-08-31 (s37) |
| **Design System + herramienta** — tokens, componentes, Figma, tooling | [`docs/handoff/design-system.md`](docs/handoff/design-system.md) | 2026-08-31 (s38) |
| **Agent Mini** — dialpad standalone (réplica del mini aed)            | [`docs/handoff/agent-mini.md`](docs/handoff/agent-mini.md)       | 2026-09-01       |

**Al cerrar, reescribe SOLO el fichero de tu frente.** Si abres una línea de trabajo nueva, crea
su fichero, añade su fila aquí y nómbralo en la fila de `DOCS-INDEX`.

---

## 🟢 EN PRODUCCIÓN — 5 sitios (4 desde `main`; `agent-mini` pendiente de repuntar, ver ⚠️)

| Proyecto     | URL                         | Qué es                                 |
| ------------ | --------------------------- | -------------------------------------- |
| `sc-docs`    | **sc-doc.pages.dev**        | Showcase del DS                        |
| `supervisor` | **sc-supervisor.pages.dev** | La app real, con datos de demostración |
| `agent`      | **sc-agent.pages.dev**      | Réplica del dashboard del agente       |
| `cuscare`    | **sc-cuscare.pages.dev**    | Réplica de la herramienta de tickets   |
| `agent-mini` | **agent-mini.pages.dev** ⚠️ | Réplica del dialpad mini (standalone)  |

⚠️ Cloudflare da preview por rama en los 5. **Si apuntas un proyecto a una rama, NO la borres al
mergear sin repuntarlo a `main` antes** — pasó con `feat/cuscare`: al borrarla, `sc-cuscare` quedó
apuntando a una rama fantasma y dejó de reconstruirse, y la URL seguía sirviendo el último build,
así que no se nota hasta que echas en falta un cambio.

⚠️ **`agent-mini` está HOY en esa trampa.** Su proyecto Cloudflare apuntaba a la rama
`worktree-agent-mini`, que GitHub borró al mergear (PR #31/#32). La URL sirve el último build
(`0b1d210`, correcto) pero dejará de reconstruirse. **Falta que Rafa lo repunte a `main` en el
dashboard** (y, si quiere, lo renombre `sc-agent-mini` para casar con el resto). Detalle en
[`docs/handoff/agent-mini.md`](docs/handoff/agent-mini.md).

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
