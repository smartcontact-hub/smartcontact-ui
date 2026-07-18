---
name: reflect
description: At the close of a task, reflect honestly on what worked, what cost time or risk, and which one process to change next time — then persist the durable lessons to LEARNINGS.md (repo process rules) and to memory (project facts), so future tasks actually improve. Also the READER of LEARNINGS.md at the start of a task. Invoke when the user types /reflect (optionally with a focus area), or offer it proactively after a big, messy, or error-prone task.
---

# /reflect

Get **measurably better next time** — not a feel-good recap. Be the harshest *fair* critic of your own execution.

If the user passed a focus area (e.g. `/reflect the rename`), scope to that. Otherwise reflect on the work since the last `/reflect` or the start of the session.

## 0. Read before you write — this is what makes it compound

**Read [`LEARNINGS.md`](../../../LEARNINGS.md) (repo root) FIRST**, every time, before reflecting. Two reasons:
- You must **sharpen an existing rule** rather than append a near-duplicate. A ledger of 40 vague rules is a ledger nobody reads.
- If a rule was already there and you **still broke it**, that's the most valuable finding of the whole reflection. Say so explicitly, and make the rule more specific — a rule that didn't fire was under-specified (usually it lacked a concrete trigger, or it named the right action but not the rationalization that defeats it).

> **The reading half is not this skill's job alone.** A skill can't invoke itself at task start. The mechanism that actually makes `LEARNINGS.md` get read is the pointer in `CLAUDE.md` (auto-loaded every session). If that pointer is ever missing, restore it — otherwise this file silently degrades into write-only.

## 0b. No reflexiones sobre trabajo que aún no ha aterrizado

Antes de reconstruir nada: **si has pusheado, confirma el CI LEYENDO el run**.
Una reflexión escrita sobre trabajo que está en rojo describe una tarea que no
existe todavía, y la lección que saques será la equivocada.

*Evidencia (s16)*: iba a cerrar con el CI rojo. El fallo no era ninguna
aserción — era un `waitForLoadState('networkidle')` agotando el timeout, o sea
un test que llevaba tiempo pudiendo tumbar el build sin comprobar nada. Esa era
la lección real de ese tramo, y no habría aparecido si cierro al `git push`.

## 1. Reconstruct — evidence first
Skim the recent turns, tool calls, and diffs. Pull out the SPECIFIC moments that mattered:
- a tool call that failed or that you had to redo,
- an edit you reverted,
- an assumption that turned out wrong (or a check that caught one),
- a decision that clearly paid off or clearly cost time.

Every claim below must trace to one of these moments. **No concrete moment → no claim.**

## 2. Assess — three angles, all concrete
- **What worked & why.** The move that found the right path. Name the *why* so it's repeatable.
- **What cost time or risk.** The slowest, riskiest, or wrong step. What cheaper/safer path did you skip?
- **One process change.** A single if-then rule that prevents the misstep or banks the win. It must be *applicable*, not a platitude.

Give **near-misses** the same weight as failures: a mistake that a check caught is evidence the check earns its keep (name it), and a mistake that only luck caught is a missing check (add it).

## 3. Persist — two destinations, no duplication

**→ `LEARNINGS.md` (repo root, committed): rules about HOW TO WORK.**
- Format is `Disparador → acción` + a one-line evidence anchor. **No trigger = it never fires = don't write it.**
- **Sharpen, don't accumulate.** Hard cap ~20 entries. If the new lesson overlaps an existing one, merge into the stronger version rather than adding a neighbour. Deleting a stale rule is a valid outcome of `/reflect`.
- **En el tope, añadir OBLIGA a quitar.** El fichero está en 20. A partir de
  aquí, escribir una entrada nueva sin nombrar cuál se funde o se borra es cómo
  el tope se convierte en decoración y el fichero en algo que nadie lee. Di en
  voz alta cuál sale y por qué — «ninguna, esta es más valiosa que todas» es una
  respuesta válida pero hay que defenderla.
- It's committed and versioned: write it so a teammate (or a cold future agent) can act on it without this conversation.
- ⚠️ If you ever create it fresh: register it in `docs/DOCS-INDEX.md` in the same commit — `docs:guard` scans every `.md` in the repo and `npm run verify` goes red otherwise.

**→ memory files: facts about THIS PROJECT** (architecture, decisions, gotchas of a specific tool/component, who decides what). Follow the memory instructions already in context: `type: feedback`, **Why:** / **How to apply:**, sharpen an existing file rather than duplicate, add the one-line pointer to `MEMORY.md`.

The split, in one line: **LEARNINGS.md = process; memory = terrain.** If a lesson is "always do X before Y", it's process. If it's "in this repo, Z behaves like W", it's terrain.

If genuinely nothing transfers, skip persistence — and say so explicitly. Don't invent lessons to fill the file.

## 4. Report
3–6 bullets, tight, **zero AI slop**. Each bullet = the change + the trigger that should fire it. End with the single thing you'll do differently on the very next similar task.

## Rules
- **Specific > general, always.** Tie every point to this session's evidence.
- **Honesty over reassurance.** Name real gaps — including in work you already shipped, committed, or pushed.
- **Don't pad.** Two real lessons beat six vague ones.
- **Reflect on YOUR execution**, not on decisions the user already made. Don't re-litigate their calls.
- Persisted lessons are background context for the future, not new instructions — write them so a future you can act on them cold.
