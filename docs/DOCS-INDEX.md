# Smart Contact UI — Índice de documentación

> **Source of truth** de qué documento canónico contiene qué tipo de información.
>
> Causa raíz que motiva este índice: el drift entre docs no nace de "no se actualizan",
> nace de **no tener claro qué doc manda en cada tema** → la misma info acaba en dos
> sitios y divergen.
>
> **Regla de oro**: cada tipo de información tiene **UN** source of truth. Los demás docs
> son punteros o resúmenes, **nunca copias**. Al cerrar trabajo, **solo se tocan los docs
> cuyo contenido cambió esa sesión**. El resto queda estable.

---

## Por tipo de información

| Tipo | Source of truth | Quién lo lee |
|---|---|---|
| Cómo trabajar con agentes — convenciones, workflow, anti-patterns, **protocolo de cierre**, **trampas conocidas**, plugin MCP de Figma | [`AGENTS.md`](../AGENTS.md) | Claude + contributors (PRIMERO al tocar el repo) |
| Qué es **sagrado / no tocar** vs dónde se puede pulir (alcance) | [`.impeccable.md`](../.impeccable.md) | Claude (antes de "mejorar / pulir / refactor") |
| **Decisiones arquitectónicas grandes** — por qué, con alternativas descartadas (formato DD-N) | [`docs/DECISIONS.md`](./DECISIONS.md) | Claude + diseño/devs |
| **Brand divergences** — dónde SC se aparta del Figma a propósito (incl. las 3 de color) | [`docs/customs-catalog.md`](./customs-catalog.md) | Claude (antes de añadir override/token) + diseño |
| Reglas de **blindaje / migration-safe** (minimizar customización de PrimeNG) | [`docs/migration-safety.md`](./migration-safety.md) | Claude (antes de tocar HTML/lógica PrimeNG) |
| **Tokens + puente Figma** (para diseño) · **Figma change-log** · workflow Migration Assistant | [`docs/guia-tokens.md`](./guia-tokens.md) + técnico: [`projects/design-tokens/README.md`](../projects/design-tokens/README.md) | diseño + Claude |
| **Colaboración + arranque de diseño** (puerta de entrada práctica: flujo día a día, links, setup del token, docks, git pull, qué tocar/evitar) — el detalle a fondo vive en `guia-tokens.md` | [`docs/colaboracion.md`](./colaboracion.md) | diseño (Marta) + equipo |
| **Code Connect** (piloto Figma ↔ código: qué es, requisitos de publicación, cómo quitarlo) | [`docs/code-connect.md`](./code-connect.md) | Claude + diseño + devs |
| Cómo **consume una app externa** el DS · **el modelo** (un DS, dos profundidades: "instalar y ya el tema" vs `--sc-*` — combinable + migration-safe) · **propuesta de distribución** (GitHub Packages) | [`docs/consumer-onboarding.md`](./consumer-onboarding.md) | apps consumidoras + los 2 equipos front + Claude |
| **Perfil público de la org** — borrador para el repo `smartcontact-hub/.github` → `profile/README.md` (lo crea Rafa en GitHub) | [`docs/org-profile.md`](./org-profile.md) | Rafa + Claude |
| **Convergencia** DS ↔ catálogo dev (unión, naming DD-12, plan de port) | [`docs/convergence-manifesto.md`](./convergence-manifesto.md) | Claude (al portar) |
| **Fundaciones** (Mitad A): por qué del esqueleto/arquitectura | [`docs/foundations-rationale.md`](./foundations-rationale.md) | Claude (referencia) |
| **Plan de port** de componentes (Mitad B) | [`docs/component-port-plan.md`](./component-port-plan.md) | Claude (referencia) |
| **Plan de convergencia** de los 4 flujos (7 olas + modelo canónico R1-R7) | [`docs/plan-convergencia-flujos.md`](./plan-convergencia-flujos.md) | Claude + Rafa |
| **Inventario de componentes** — tracklist: cada componente + wrapper/pure + los 4 gaps abiertos | [`docs/inventory.md`](./inventory.md) | Claude + diseño + Rafa |
| **Receta para migrar una tabla** a `sc-datatable` — pasos, la piel `.list-table`, las 3 trampas medidas y las 14 tablas que quedan por dificultad | [`docs/receta-migracion-tablas.md`](./receta-migracion-tablas.md) | Claude (al migrar una tabla) |
| **Playbook** archivar `smartcontact-ui-main` (sesión aparte) | [`docs/playbook-archivar-ui-main.md`](./playbook-archivar-ui-main.md) | Claude (en sesión sobre ese repo) |
| **Log de construcción** per-lote (journal histórico CERRADO, no se re-litiga) | [`docs/history/DECISIONS-LOG.md`](./history/DECISIONS-LOG.md) (Mitad A) · [`docs/history/DECISIONS-LOG-B.md`](./history/DECISIONS-LOG-B.md) (Mitad B) | Claude (referencia histórica) |
| **Versiones publicadas** (semver, qué cambió por release) | [`CHANGELOG.md`](../CHANGELOG.md) | todos |
| **Backlog durable** — lo diferido-pero-rastreado (qué + disparador + cómo se valida) | [`docs/ROADMAP.md`](./ROADMAP.md) | Claude + Rafa |
| **Auditoría de deuda** (snapshot fechado, por bloques) — temas transversales + P0/P1 + quick-wins, backlog con checkboxes. Los items que se prioricen se mueven a `ROADMAP.md` | [`docs/AUDIT-DEUDA-2026-06.md`](./AUDIT-DEUDA-2026-06.md) | Claude + Rafa |
| **Auditoría de consistencia y cobertura** (snapshot fechado) — pokédex, i18n, divergencias de token, cobertura demo/uso + arreglos concretos; complementa (no reescribe) la deuda de código | [`docs/AUDIT-2026-07.md`](./AUDIT-2026-07.md) | Claude + Rafa |
| **Handoff volátil** — estado actual + próximos pasos (se SOBREESCRIBE cada cierre) | [`NEXT-SESSION.md`](../NEXT-SESSION.md) | Claude (lee PRIMERO al arrancar) |
| **Reglas de proceso ganadas** — cómo trabajar en este repo (disparador → acción), destiladas de errores reales; se AFILA, no se acumula (tope ~20) | [`LEARNINGS.md`](../LEARNINGS.md) | Claude (lee al EMPEZAR tarea; `/reflect` lo escribe al cerrar) |
| Preferencias / comportamiento Claude + atajos (privado, fuera del repo) | `~/.claude/projects/.../memory/` | Solo Claude |

## Punteros (no contienen info nueva)

| Doc | Rol |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | Resumen operativo + punteros a `AGENTS.md` y al pipeline de tokens. Si hay que escribir más de un párrafo, va en uno de los sources de arriba. |

---

## Fronteras explícitas (para no duplicar)

Los pares que más se confunden — cada uno tiene un trabajo distinto:

- **`AGENTS.md` (cómo trabajar)** ≠ **`.impeccable.md` (qué no romper)** ≠ **`CLAUDE.md` (punteros)**.
- **`docs/DECISIONS.md` (por qué — decisiones grandes con alternativas)** ≠ **`DECISIONS-LOG(-B).md`
  (journal per-lote de la construcción, histórico)** ≠ **`customs-catalog.md` (qué diverge de Figma)**
  ≠ **`migration-safety.md` (reglas de blindaje)**.
- **`docs/guia-tokens.md` (puente Figma, lenguaje de diseño)** ≠ **`projects/design-tokens/README.md`
  (lo mismo, lenguaje técnico)**. Misma info, dos audiencias: el README es el canónico técnico; la guía
  es la traducción para diseño.
- **`docs/colaboracion.md` (arranque + colaboración de diseño, puerta de entrada práctica)** ≠ **`docs/guia-tokens.md`
  (manual a fondo)**. `colaboracion.md` pone a la diseñadora a operar y a ir alineada con el equipo (lean,
  práctico, flujo día a día); la guía es la enciclopedia. `colaboracion.md` **apunta** a la guía, no la copia.
- **`NEXT-SESSION.md` (estado volátil, se sobreescribe)** ≠ todo lo demás (durable, se acumula).

---

## Reglas operativas

1. **Al cerrar sesión, solo se actualiza el doc cuyo contenido cambió.** El instinto de "tocar todos
   por si acaso" es lo que causa drift.
2. **Si dudas dónde va una info nueva**, consulta esta tabla. Si no encaja en ningún source, decídelo
   explícitamente: ¿ampliar un doc existente o crear uno nuevo? (Crear uno nuevo = añadir su fila aquí.)
3. **`CLAUDE.md` = punteros, no contenido.** Más de un párrafo → va a un source de la tabla.
4. **Memoria del agente** (`~/.claude/...`) = solo preferencias/atajos/trampas personales. **Nunca**
   repite lo que vive en el repo; si una lección es del proyecto, va a `AGENTS.md` (trampas).
5. **Mover una source de un doc a otro** = actualizar este índice en el mismo commit.

---

Última actualización: 2026-07-23 — `sc-card` gana input `icon` (icono de cabecera opcional) + piloto de **Code Connect** (`card` → `sc-card`); nueva fila `docs/code-connect.md`. **Limpieza s23**: borrado `playbook-migracion-platform.md` (muerto por DD-17) + su fila; 3 `README.md` duplicados de `.agents/skills/`; TRAMPAS de `NEXT-SESSION` movidas a `AGENTS.md`; `pull_request_template` apunta a `docs/DECISIONS.md`.
2026-06-30 — sesión 7: **dirty-state compartido** (primitivo `createFormDirtyState`, Guardar por cambio neto en los 5 forms) mergeado + **auditoría de deuda por bloques** del monorepo → nuevo `docs/AUDIT-DEUDA-2026-06.md` (Tema C ya cerrado ahí). Añadida su fila arriba.
2026-06-30 — sesión 6: **DD-27** (constructor de condiciones v2 + recorte MVP sin grabación/borradores) registrado en `DECISIONS.md`; `ROADMAP.md` §reglas marcada EJECUTADA; ningún *source* nuevo cambió de sitio (mapa intacto). Pendiente de orden: `DECISIONS.md` newest-first (DD-21..27 al final).
2026-06-23 — `ppt-proyecto.md` consolidado y renombrado a `colaboracion.md` (lean + práctico + flujo día a día + colaboración git + nota de caducidad del token); borrado el viejo.
2026-06-16 — W2: READMEs de paquete (`components`) y de las apps (`sc-demo`, `supervisor`) + badges + metadata npm (description/keywords/license/author) + `org-profile.md` (borrador del perfil de la org). Los README de `projects/**` no los escanea docs:guard (solo `docs/` + raíz).
2026-06-16 — añadido `ppt-proyecto.md` (presentación de onboarding para diseño, W0).
2026-06-14 — creado el índice (Lote L2 del maratón "sistema operativo"). Mapeados los docs del repo;
fronteras `DECISIONS.md` ↔ `DECISIONS-LOG(-B)` ↔ `customs-catalog` ↔ `migration-safety` explícitas.
