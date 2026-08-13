---
name: auditoria-semanal
description: Auditoría de JUICIO semanal (la corre una rutina cloud) — encuentra lo que los gates de `verify` no pueden ver (deuda de diseño, deriva semántica de docs, PRs terminados que nadie mergea), lo triña (gate-able / arréglalo / intencional) y lo deja en `docs/AUDIT-SEMANAL.md` vía un PR. Si no hay hallazgos reales, NO abre PR. La versión de juicio, en cadencia, de `docs/AUDIT-DEUDA-2026-06.md`.
---

# /auditoria-semanal

Tu trabajo es producir **accionables reales**, no un informe que nadie lee. El
listón: cada semana, o sacas hallazgos que un humano querría arreglar, o dices
"sin hallazgos" y te callas. Un informe de relleno es peor que ninguno — enseña a
ignorar la rutina. Sé el crítico más duro *pero justo* del repo.

## 0. Antes de auditar — lee el marco y sabe qué NO es tu trabajo

**Lee primero** (son la lente y la lista de lo intencional, no los re-audites):
- `AGENTS.md` — convenciones, anti-patterns, trampas conocidas. La autoridad.
- `LEARNINGS.md` — reglas de proceso ganadas.
- `.impeccable.md` — qué es **sagrado / no tocar** vs qué se puede pulir.
- `docs/DOCS-INDEX.md` — la regla de oro: cada info tiene UN source of truth, los demás son punteros, **nunca copias**. Y qué docs son *dormant-by-design*.
- `docs/customs-catalog.md` — las divergencias vs Figma que son **a propósito** (no las marques como bug).

**Fuera de tu alcance — NO lo audites, ya lo caza el CI en cada push:**
toda la cadena `npm run verify` (25 pasos: `tokens:*`, `audit:theme-scale`,
`audit:border-surfaces`, `audit:components`, `audit:datatables`,
`audit:primeng-coupling`, `usage:check`, `i18n:check`, `test:unit`,
`docs:guard`, `docs:coherence`, `build`, `test:components`, `typecheck`,
`lint`) y los `e2e:*` (forms, reglas, theme-contrast, focus-ring, structure).
Si algo de eso está roto, es un fallo de CI, no un hallazgo tuyo. Tú vives en lo
que ninguna máquina vigila.

## 1. Las tres pasadas

### Pasada A — Deuda de diseño y consistencia de código (la lente AUDIT-DEUDA)
Juicio puro, cero solape con `verify`. Busca lo que **multiplica esfuerzo o rompe
consistencia**, no nitpicks:
- Patrones reinventados por feature (CRUD/listas/selección/stores que reimplementan lo mismo).
- Duplicación **verbatim** real (mismo template/CVA/computeds copiados entre componentes).
- Dos eras de API conviviendo sin criterio escrito (`@Input/@Output` legacy vs `input()/output()/model()`).
- Componentes que divergen de la convención DS aunque pasen los gates.

Cada hallazgo: **`file:line` (o las dos ubicaciones de la duplicación)** + el fix en
una línea + severidad (P0/P1/P2). **Tope duro: ≤ 5 hallazgos**, rankeados por
impacto. Esta pasada es la más subjetiva; el tope es lo que impide que dispares
relleno. Si de verdad no hay 5 que valgan la pena, saca menos. Si no hay ninguno,
"sin hallazgos".

### Pasada B — Deriva semántica de docs (lo que `docs:guard`/`docs:coherence` NO ven)
`docs:guard` vela la forma (todo .md mapeado, links resuelven) y `docs:coherence`
vela refs a comandos/scripts + que el README nombre los guards. **Ninguno mira el
SIGNIFICADO.** Ahí entras tú. Para leer la verdad, corre los **generadores en
read-only** (sin `--write`) y compara su salida con lo que afirman los docs:
- **Conteos desfasados**: un doc a mano que ya no cuadra con un manifiesto autogenerado (p. ej. nº de componentes del README vs el inventario generado).
- **Auto-contradicciones**: un doc que declara una regla y la incumple (p. ej. "newest-first" con lo nuevo al final).
- **Notas de índice envejecidas**: una nota que describe un estado ya superado.
- **Afirmaciones doc-vs-código**: valores concretos de `customs-catalog.md` (warn=amber, primary=navy, info=sky…) que ya no coincidan con el preset/CSS.
- **Parejas de duplicación sancionadas** que hayan divergido (`guia-tokens.md` ↔ `projects/design-tokens/README.md`).

### Pasada C — Trabajo TERMINADO que no cruzó la última puerta

Corta, mecánica, y la que más valor dio el día que se descubrió el patrón. El repo tiene 25
gates para lo que ENTRA y **ninguno para lo que se queda fuera**: un PR abierto no molesta a
nadie, así que se pudre en silencio. `verify` no puede vigilarlo —corre offline y determinista,
y consultar GitHub lo volvería flaky—, pero tú sí: corres en la nube y tienes `gh`.

```bash
gh pr list --state open --json number,title,createdAt,mergeable,statusCheckRollup
```

Marca como hallazgo **todo PR abierto con más de 7 días** — uno por PR, con su edad, si es
mergeable y si su CI está verde. El fix es siempre el mismo y es de Rafa: mergear o cerrar.
Nada de "revisar el backlog de PRs" como hallazgo genérico: un PR, una línea, su edad.

*Por qué existe esta pasada (2026-08-13)*: `docs/AUDIT-SEMANAL.md` en `main` decía "aún no ha
corrido ninguna auditoría" mientras **esta misma rutina** llevaba dos pasadas y 14 hallazgos
verificados esperando en el PR #22 desde hacía 9 días. Había tres PRs así — uno era un
`npm audit fix` de 7 vulnerabilidades, otro las lecciones de una sesión que nunca llegaron a
`LEARNINGS.md`. **La rutina se estaba quedando fuera a sí misma**, y no tenía forma de verlo.

## 2. Triaje por hallazgo — la regla de la casa

Regla del repo (`.claude/skills/reflect/SKILL.md`): *"una comprobación que se puede
automatizar debe ser un gate, no documentación"*. Así que cada hallazgo se clasifica:

- **gate-able** → es mecánico, una máquina podría vigilarlo. Descríbelo como *"debería ser un guard en `verify`"* **en prosa** — di qué compara y contra qué. Que deje de repetirse cada semana es el objetivo. ⚠️ NO escribas la ruta literal del script propuesto (ver §3).
- **arréglalo** → item de backlog con `file:line`. Va al backlog de `AUDIT-SEMANAL.md`.
- **intencional** → cruza contra `.impeccable.md` / `customs-catalog.md` / los docs *dormant-by-design* de `DOCS-INDEX` (consumer-onboarding, org-profile, playbook-archivar…). Si es a propósito, **NO lo marques**. Ni lo menciones.

## 3. Contrato anti-slop + seguridad de CI (lo que separa esto de la rutina vieja)

- **Todo hallazgo cita `file:line`.** Sin ubicación concreta, no es un hallazgo — es una opinión. No la escribas. (Espíritu de `reflect`: "no concrete moment → no claim".)
- **Si una pasada no encuentra nada real, escribe "sin hallazgos".** Inventar para llenar está **prohibido**.
- **Nada de lo que ya cubren los 25 gates ni los `e2e:*`** (§0).
- **Semana sin hallazgos en ninguna pasada → NO abres PR.** Cero ruido.

**Seguridad de CI (CRÍTICO — `docs/AUDIT-SEMANAL.md` lo escanea `docs:coherence` en cada `verify`, para siempre):**
- `docs:coherence` CHECK A falla el build si el doc cita un `npm run <algo>` o un `scripts/<algo>.mjs` **que no existe**.
- Por eso, al proponer un gate nuevo (que aún no existe), **descríbelo en prosa** — *"un guard nuevo que cuente los componentes y los compare con el manifiesto"* — **nunca** con su path (`scripts/…​.mjs`) ni con un `npm run …:…` inventado. Precedente: `docs-coherence.mjs` exime `scripts/paths.mjs` en `PROPOSED_SCRIPTS`; no dependas de eso, simplemente no teclees el token.
- Referencia scripts/comandos **reales** con moderación; prefiere prosa. Un `file:line` de código (`README.md:19`, `foo.store.ts:50`) es seguro — CHECK A no lo mira.

## 4. Salida — `docs/AUDIT-SEMANAL.md` + un PR

Doc **único y vivo** (ya registrado en `DOCS-INDEX`), con secciones fechadas y
backlog de checkboxes al estilo `AUDIT-DEUDA-2026-06.md` (`[x]` = cerrado). Añade
la sección de esta semana **arriba** (newest-first); no borres las anteriores
salvo para marcar `[x]` lo que ya se arregló. Formato de cada sección:

```
## <YYYY-MM-DD>

> Método: pasada A (deuda de código, ≤5) + pasada B (deriva de docs) + pasada C (PRs parados >7d).
> Contra AGENTS.md/.impeccable.md.

### Deuda de código
- [ ] **P0/P1** <qué> (`file:line`) → <fix en una línea>. [gate-able | arréglalo]

### Deriva de docs
- [ ] <qué afirma el doc> (`doc:line`) vs <la verdad> (`fuente:line` o el generador) → <fix>. [gate-able | arréglalo]

### Trabajo sin mergear
- [ ] PR #N «título» — abierto hace Nd, mergeable, CI verde → mergear o cerrar.

```

Entrega vía PR:
1. `git switch -c audit/semanal-<YYYY-MM-DD>` desde la rama por defecto actualizada.
2. Escribe la sección nueva en `docs/AUDIT-SEMANAL.md`.
3. **Corre `npm run docs:guard && npm run docs:coherence` localmente** — si rojo, lo más probable es que hayas tecleado un `scripts/*.mjs`/`npm run` inexistente (§3); quítalo y re-corre. No abras el PR en rojo.
4. `gh pr create` (mecanismo probado en los workflows de tokens) con título `chore(audit): auditoría semanal <YYYY-MM-DD>` y cuerpo = resumen de los hallazgos. Si ya hay un PR de auditoría abierto sin mergear, **actualízalo** en vez de abrir otro.
5. Rafa revisa, mergea (= aceptar en el backlog) o marca cajas.

## 5. El orden que sigues en cada run

1. Actualiza a la rama por defecto (`git pull`), lee el marco (§0).
2. Corre los generadores en read-only para tener la verdad-terreno (pasada B).
3. Pasada A + pasada B → triña cada hallazgo (§2).
4. ¿Cero hallazgos reales? → registra "sin hallazgos" en tu propio output y **termina sin PR**.
5. ¿Hay hallazgos? → escribe la sección, corre los dos guards de docs, abre/actualiza el PR (§4).
6. Nunca inventes para justificar la run. Una run honesta en silencio vale más que un PR de humo.
