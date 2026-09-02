---
name: reflect
description: At the close of a task, reflect honestly on what worked, what cost time or risk, and which one process to change next time — then ROUTE each durable lesson to the strongest home it can have (hook → gate → tarjeta → LEARNINGS rule → memory terrain), so future tasks actually improve. Also the READER of the LEARNINGS index at the start of a task. Invoke when the user types /reflect (optionally with a focus area), or offer it proactively after a big, messy, or error-prone task.
---

# /reflect

Get **measurably better next time** — not a feel-good recap. Be the harshest *fair* critic of your own execution.

If the user passed a focus area (e.g. `/reflect the rename`), scope to that. Otherwise reflect on the work since the last `/reflect` or the start of the session.

## 0. Read before you write

**Read the INDEX of [`LEARNINGS.md`](../../../LEARNINGS.md) (the table) and the tarjeta in `CLAUDE.md` FIRST**, every time. Open the body of a rule only when you are about to touch it.

If a rule was already there and you **still broke it, that is the most valuable finding of the whole reflection — and it is NOT a request for more prose.** A rule that did not fire with the text in front of you will not fire with more text. Measured: rule #7 reached 2.180 words and ≥8 documented re-breaks before it became a hook. So the question for a re-broken rule is only this: **which machine could have seen the moment?** (§3, first two rows). Sharpen the wording only if no machine can.

## 0b. No reflexiones sobre trabajo que aún no ha aterrizado

Si has pusheado, confirma el CI **leyendo el run**: `npm run ci:verdict`. Una reflexión sobre trabajo en rojo describe una tarea que no existe todavía, y la lección que saques será la equivocada. *Evidencia (s16)*: iba a cerrar con el CI rojo por un `waitForLoadState('networkidle')` que llevaba tiempo pudiendo tumbar el build sin comprobar nada; esa era la lección real, y no habría aparecido cerrando al `git push`.

## 1. Reconstruct — evidence first

Skim the recent turns, tool calls, and diffs. Pull out the SPECIFIC moments that mattered: a tool call that failed or that you had to redo; an edit you reverted; an assumption that turned out wrong (or a check that caught one); a decision that clearly paid off or clearly cost time. **No concrete moment → no claim.**

## 2. Assess — three angles, all concrete

- **What worked & why.** The move that found the right path. Name the *why* so it's repeatable.
- **What cost time or risk.** The slowest, riskiest, or wrong step. What cheaper/safer path did you skip?
- **One process change.** A single if-then rule that prevents the misstep or banks the win.

Give **near-misses** the same weight as failures: a mistake that a check caught is evidence the check earns its keep (name it); a mistake that only luck caught is a missing check (add it).

## 3. Persist — ROUTE, don't append

For every lesson, walk this table top-down and stop at the FIRST row that fits. Each row is stronger than the one below it because it depends less on someone reading.

| Si la lección es… | Va a… | Cómo |
|---|---|---|
| un COMANDO que no debió escribirse así (push, exit enmascarado, volcado, `sed`, diff) | **hook** `scripts/hooks/bash-guard.mjs` | un patrón ESTRECHO + su caso rojo y verde en `scripts/__tests__/bash-guard.test.mjs`; el motivo de la denegación cita la regla |
| algo que un script puede ver en el repo o en un artefacto ("X nunca debe regresar") | **gate** en `npm run verify` (o un `e2e:*`) | prueébalo en rojo con el caso malo fabricado, después en verde; un gate que no enrojece con el fallo que lo motivó no es un gate |
| una PREGUNTA que hay que hacerse a mitad de tarea, en cualquier tarea | **tarjeta** de `CLAUDE.md` (≤7 líneas, viaja en cada turno) | solo si desplaza a otra: la tarjeta no crece. Cita la regla `#N` |
| proceso que solo un agente puede juzgar (criterio, recorrido cognitivo, decisión de producto) | **regla** en `LEARNINGS.md` | afila la existente ANTES de añadir; ≤12 líneas, una `Evidencia:`; sin `*Corolario*` (el gate K lo rechaza). Añadir en el tope obliga a fundir o borrar, y hay que decir cuál |
| terreno del proyecto ("en este repo Z se comporta como W", dónde está X, quién decide) | **memoria** (`type: project` / `reference` / `user`) | afila el fichero existente; puntero de una línea en `MEMORY.md`. **Nunca `feedback` de proceso**: eso es una regla o un hook, no un hecho, y duplicarlo en dos almacenes fue como se llegó a 39 ficheros |

Rules of the router:

- **Una lección, UN sitio.** Si acaba en hook o gate, la regla de LEARNINGS lo marca con ⚙️ en una línea y no repite el mecanismo.
- **Cero palabras netas en prosa salvo que borres.** Si escribes un párrafo, di qué párrafo sale.
- **La historia va en git.** La línea `Evidencia:` lleva sesión y hecho; el relato completo va en el mensaje del commit (`git log -S'(sNN)' -- LEARNINGS.md` lo recupera).
- LEARNINGS y la tarjeta son versionados: escríbelos para un agente frío que no vio esta conversación.
- ⚠️ Si creas un `.md` nuevo, regístralo en `docs/DOCS-INDEX.md` en el mismo commit (`docs:guard`).

If genuinely nothing transfers, skip persistence and say so. Don't invent lessons to fill the file.

## 4. Report

3–6 bullets, tight, zero AI slop. Each bullet = the change + WHERE it landed (hook / gate / tarjeta / regla #N / memoria) + the trigger that should fire it. End with the single thing you'll do differently on the very next similar task.

## Rules

- **Specific > general, always.** Tie every point to this session's evidence.
- **Honesty over reassurance.** Name real gaps, including in work you already shipped or pushed.
- **Don't pad.** Two real lessons beat six vague ones.
- **Reflect on YOUR execution**, not on decisions the user already made.
