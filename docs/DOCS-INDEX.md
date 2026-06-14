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
| **Tokens + puente Figma** (para diseño) · **plugin MCP** · **Figma change-log** · workflow Migration Assistant | [`docs/guia-tokens.md`](./guia-tokens.md) + técnico: [`projects/design-tokens/README.md`](../projects/design-tokens/README.md) | diseño + Claude |
| Cómo **consume una app externa** los paquetes publicados | [`docs/consumer-onboarding.md`](./consumer-onboarding.md) | apps consumidoras + Claude |
| **Convergencia** DS ↔ catálogo dev (unión, naming DD-12, plan de port) | [`docs/convergence-manifesto.md`](./convergence-manifesto.md) | Claude (al portar) |
| **Fundaciones** (Mitad A): por qué del esqueleto/arquitectura | [`docs/foundations-rationale.md`](./foundations-rationale.md) | Claude (referencia) |
| **Plan de port** de componentes (Mitad B) | [`docs/component-port-plan.md`](./component-port-plan.md) | Claude (referencia) |
| **Playbook** migrar `smart-contact-platform` (sesión aparte) | [`docs/playbook-migracion-platform.md`](./playbook-migracion-platform.md) | Claude (en sesión sobre ese repo) |
| **Playbook** archivar `smartcontact-ui-main` (sesión aparte) | [`docs/playbook-archivar-ui-main.md`](./playbook-archivar-ui-main.md) | Claude (en sesión sobre ese repo) |
| **Log de construcción** per-lote (journal histórico, no se re-litiga) | [`DECISIONS-LOG.md`](../DECISIONS-LOG.md) (Mitad A) · [`DECISIONS-LOG-B.md`](../DECISIONS-LOG-B.md) (Mitad B) | Claude (referencia histórica) |
| **Versiones publicadas** (semver, qué cambió por release) | [`CHANGELOG.md`](../CHANGELOG.md) | todos |
| **Handoff volátil** — estado actual + próximos pasos (se SOBREESCRIBE cada cierre) | [`NEXT-SESSION.md`](../NEXT-SESSION.md) | Claude (lee PRIMERO al arrancar) |
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

Última actualización: 2026-06-14 — creado el índice (Lote L2 del maratón "sistema operativo").
Mapeados los 16 docs del repo; fronteras `DECISIONS.md` ↔ `DECISIONS-LOG(-B)` ↔ `customs-catalog`
↔ `migration-safety` hechas explícitas para matar el solape.
