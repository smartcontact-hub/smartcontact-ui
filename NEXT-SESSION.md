# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-30** (sesión 6). Esta sesión: **construido y mergeado a main el constructor de condiciones
> v2 (DD-27)** — referencias tipadas **dinámicas** (no snapshots de nombre) + modelo `value` (any/refs/enum/
> número) + picker custom (multi-select + "Todos" comodín + grupos-como-miembros vivos) + **Estimación de
> procesado** (sticky: barra de proporción + proyección día/mes desde el ratio real) + **guía de errores**
> (incompleta/rango bloquean al guardar; contradicción/duplicado/tautología avisan) + **Duración con presets** +
> **scope MVP** (fuera grabación y borradores). Verify entero verde, **118 tests**, en producción.
> SOBREESCRIBE este fichero al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. El *por qué* durable: `docs/DECISIONS.md` (**DD-27** = cond-builder v2; **DD-26** = la base Variante B).
3. Elige tarea de §Lo que queda.

---

## 🎯 Estado de un vistazo
**Constructor de condiciones v2 — HECHO y en main** (DD-27). Supervisor `features/memory/`.
- **Modelo** (`data/condition.types.ts`): refs tipadas (`ConditionRef`: service[por nombre, sin id] / group ·
  agent · agentGroup · tipificacion · category[por id]) + `ConditionValue` (`any` comodín | `refs` | `enum` |
  `número`). Etiqueta y **membresía** se resuelven EN VIVO (`condition-resolver.service.ts` + `GroupAgentLinksStore`),
  no se congelan. "Todos" = comodín (incluye futuros); grupo en el campo **Agente** = `agentGroup` = "sus miembros
  AHORA". El árbol deriva `servicios/grupos/agentes` planos (`deriveLegacyScope`) → listado/conflictos intactos.
- **Campos unificados** (servicio/grupo/agente/dirección/duración/tipificación/categoría) con operadores
  contextuales (lista: es/no es · número: más de/menos de/entre). Picker custom en `components/rule-condition-value-picker/`.
- **Estimación de procesado** (sticky, siempre visible): "Afectaría a N de las últimas M" + **barra de proporción**
  (matched/total) + "≈ X/día · Y/mes" (proyección desde el ratio REAL × volumen base demo `CONVERSATIONS_PER_DAY`
  en `demo-impact-bridge.ts` → es estimación, no dato).
- **Guía de errores** (`data/condition-validate.core.mjs`, pura+testeada): incompleta/rango = **error** (bloquean,
  revelado al **intentar guardar**, no acusan al crear); duplicado/contradicción/tautología = **aviso** (elección
  "guía, bloquea solo lo roto").
- **Duración con presets** (15s…2h) + "Personalizado" (`data/duration-presets.core.mjs`).
- **Motor/lógica pura en `.mjs`** (`condition-eval.core` impacto+proyección, `condition-validate.core`,
  `duration-presets.core`) + `.d.mts` + wrapper `.ts` → cubierto por `test:unit` (node:test). **118 tests en el gate.**

**Scope MVP** (DD-27): solo transcripción/clasificación. **Fuera reglas de grabación** (seed + creación + Horario) y
**borradores** (banner + flujo + toasts). Tipo por defecto = transcripción. Seed = 4 reglas activas, incl. la **regla
del jefe** (caso compuesto de su PPT: servicio + grupo + tipificación venta/incidencia + duración 1–30 min).

## 🗺️ Lo que queda
0. **Limpieza follow-up del recorte MVP** (no rompe, no se ve, lo dejé a drede para no cascadear antes del merge):
   scss del draft-banner + badge "draft" en rules-page + claves i18n de borrador + señales schedule/direction de la
   página + miembros de tipo `recording`/`isDraft`/`'draft'`. Quitar cuando se quiera el modelo limpio.
   **OJO punto ciego (lo cazó la auditoría de docs):** el recorrido vivo **`sc-demo` `/reglas`**
   (`projects/sc-demo/src/app/pages/reglas/`) — material de PRESENTACIÓN — sigue enseñando el modelo VIEJO como
   actual: grabación, **Prioridad** ("el más bajo gana"), borradores. Si se va a presentar, alinear con DD-27 (o avisar).
1. **Header/breadcrumb (11c)**: resuelto a nivel de página (breadcrumb "Reglas › …"). Si Rafa lo quería en el
   `.top-bar` del shell (compartido, app-wide), es otro cambio — confirmar.
2. (de antes) PPT puente código↔Figma · Bloque 4a Figma guiado · accionables backend (VAP/Lucas): sección
   Repositorios (transcripción+tipificación), simulador de coste, avanzar AED.

**Diferido:** Neutral gray/slate · W5 · Code Connect · Fase 4 AED.

## ⚠️ TRAMPAS / PROTECCIONES
- **`npm run verify` ENTERO antes de cada commit que toque componentes.** Los subsets (AOT+lint) **SALTAN
  `audit:components`**; la staleness se acumula (esta sesión: `sc-select` 31→33 por los presets) y rompe el gate al
  final. Fix: `node scripts/component-audit.mjs --write` + commit `docs/_component-status.json` + `docs/inventory.md`.
- **El `ng serve` del entorno se cae solo a mitad de sesión** (esbuild) → reinicia el preview server; **no es tu
  código** (AOT pasa). Las notificaciones de exit-code de un verify backgrounded con `&` pueden ser **espurias** →
  confirma leyendo el log (`grep ✗`).
- **preview_eval + iconos Material = ligaduras**: "check"/"error"/"close" se cuelan en `textContent` → no compares
  por textContent (usa clase/atributo); **cierra el overlay anterior** antes de abrir el siguiente.
- **AOT = gate de plantillas** (`tsc` no las type-checkea a fondo) · **el supervisor usa su PROPIO `<sc-icon>`**
  (`@shared/components`) · **NUNCA `git add .claude`** · **NUNCA commitear `kit-export-dtcg.json`** · commits a main
  con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin AI slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Decisiones** → `docs/DECISIONS.md` (DD-27/DD-26) · **Backlog** → `docs/ROADMAP.md` · **Mapa** → `docs/DOCS-INDEX.md`.
- **Builder real** → supervisor `features/memory/` (`components/rule-condition-builder` + `rule-condition-value-picker`
  + `data/condition-*.{ts,mjs}` + `pages/rule-builder`) · **Recorrido `/reglas`** → sc-demo (presentación, no producto).
