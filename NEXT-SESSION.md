# NEXT SESSION — Smart Contact DS (hand-off)

> Sello: **2026-06-29** (sesión 4). Esta sesión: **diagnóstico completo del modal bulk-transcription** (ticket
> Jira W26) con DevTools + Figma MCP, verificado en vivo sin adivinanzas. El marco/stroke ya estaba resuelto; el
> corte de "genera coste" = `height: 239px` fijo en el `:host` (el componente en Figma es **Hug**, no fija → el
> fix es quitar esa línea). Comentario para Jira redactado y pulido (empático, no intrusivo, apoyado en Figma);
> **los devs van a tomar mano del tema.** Próxima sesión: **reglas de transcripción — preparar un LOTE con varios
> bloques** para dejarlo maravilloso, lógico, consistente e intuitivo. SOBREESCRIBE este fichero al cerrar.

---

## ▶️ EMPIEZA AQUÍ
1. **Lee este fichero entero.**
2. **Backlog durable:** `docs/ROADMAP.md` (sección "Sistema de reglas — pivote a transcripción"; ahí está el
   recorrido `/reglas` y los concerns para la charla).
3. **El *por qué* durable:** `docs/DECISIONS.md` (DD-24/25 · sync var-docs). El recorrido `/reglas` NO es un DD:
   es material de presentación para el equipo (Cloudflare), no una decisión de producción.
4. **Elige tarea de §Lo que queda.** No hay una sola "primera acción" forzada: las 3 son independientes.

---

## 🎯 Estado de un vistazo
- **Sistema de reglas — recorrido vivo: HECHO.** `projects/sc-demo/src/app/pages/reglas/`, ruta `/reglas`,
  enlace "Sistema de reglas" en la nav. 9 pasos (regla vs bulk · pivote · modelo · builder · lista ·
  **prioridad/conflictos = la complejidad** · transcripción · concerns · cierre). Snippets = **código real**
  (`rules.store.ts`: `scopeOverlaps` + `conflictsByRuleId` O(n²); `rules-page.ts`: quién gana por prioridad).
  Capturas = **Supervisor real** reutilizadas de `public/usage/` (las regenera `npm run usage:capture`).
  - **Huecos `[RAFA]` resueltos:** ley = fuera de alcance · transcripciones múltiples = varios tramos por
    conversación, cada uno transcribible por separado (ya en el código) · quién = los supervisores.
  - **Para la charla:** Rafa comparte `/reglas` + abre el Supervisor real + baja al código. No es PPT.
- **Bloques 1·2·3 + dialog-fix + var-docs (sesiones previas): HECHOS.** DD-24 (icono↔font-size) ejecutada DS+app.
- **Bridge Figma `mcp__figma__*`:** vivo cuando se re-corre el plugin (WS port 9224).

## 🔧 Modal bulk-transcription (Jira W26) — CERRADO esta sesión, en manos de los devs
Diagnóstico verificado en vivo (DevTools + Figma MCP); comentario de Jira ya redactado y enviado. Referencia por si vuelve:
- **Marco (482→480): RESUELTO** (host 480×239 border-box, stroke `#DADFE6`).
- **"genera coste" se corta: PENDIENTE, y es de IMPLEMENTACIÓN, no de diseño.**
  - **Figma = auto-layout con min/max, NO altura fija.** Maestro `12489-11524`: `min-w-480 max-w-800`,
    altura hug con `max-h-600`. El `h-[239px]` del code-gen es lo que mide VACÍO (un fixed no llevaría
    `max-h`). Con contenido real crece a ~249. Confirmación 100% = panel de Figma (altura "Hug").
  - **Web:** el `:host` del componente clava `height:239px` + `overflow:hidden` → recorta los ~10px del
    contenido real (249). El 239 NO está en la config de apertura (p-dialog sin height inline) → está en
    el SCSS del `:host` (repo devs).
  - **Fix:** el `:host` no debe fijar 239; debe adaptarse al contenido (hug) como el Figma. Verificado en
    vivo: con altura auto el modal pasa a 249 y "genera coste" deja de cortarse.
- **Alcance: solo el bulk.** `ScDynamicDialogService` limpio; diálogo normal + `sc-dialog` +
  `impact-preview` sanos. El bulk es el único full-bleed "a pelo" en el p-dialog (no usa sc-dialog).
- **OJO (autocorrección):** durante el análisis fluctué; la lectura BUENA es esta (Figma auto-layout, no
  fija). El `h-[239px]` del code-gen es valor computado, no un flag de altura fija.

## 🗺️ Lo que queda (3 independientes)
1. **PROMPT de la PPT del PUENTE código↔Figma** (aún sin redactar). La monta Claude Design; aquí solo el prompt.
   Specs decididas con Rafa (2026-06-22):
   - **Audiencia:** devs, contando NUESTRO pipeline, pero **accesible** (la presenta Rafa, no-dev → las slides
     se sostienen solas). **Tamaño:** 6-8 slides, ~10 min. **Mensaje:** QUÉ es + CÓMO (el flujo) + QUÉ GANAMOS.
     **Tono:** mixto (gancho visual + 1-2 diagramas del flujo, poco texto).
   - **Esqueleto:** QUÉ = puente bidireccional, UNA fuente de verdad para tokens. CÓMO = Theme Designer → export
     DTCG (`kit-export-dtcg.json`) → `tokens:import` genera capas `--sc-*` → el DS las consume → `verify` caza
     drift → Cloudflare; vuelta = bridge MCP escribe metadata en Figma (codeSyntax/vars) para Dev Mode.
     QUÉ GANAMOS = una fuente de verdad, sin drift, feedback en ~1 min, Dev Mode no miente.
2. **Bloque 4a (Figma, GUIADO con Rafa).** Una var a la vez + screenshot + reversible:
   - **(a) Atar W/H de iconos companion** a la var de font-size (md=`app/font/size`; sm/lg=`{cmp}/sm·lg/font`).
     Huecos: **button-default** (icono raw → `app/font/size`); **inputtext** (el TEXTO raw → font-size del input).
   - **(b) Sync de los 3 copys de General a los nodos de texto de Figma** (ventana.title; aviso.title→"Recepción
     de conversaciones"; alerting_label→"Mostrar"). Grep antes para no crear drift.
3. **Accionables de la charla de reglas (DADA 2026-06-23; conclusiones + accionables en `/reglas`).** Rumbo
   MVP: una sola regla activa (esquiva priorización) · tipificación como entidad AND/OR · grabación=aviso ·
   casa=Repositorios · clasificación después · retroactivo=bulk. **Pendiente**: hablar con desarrollo
   backend (VAP/Lucas) — cerrar criterios (faltan duración + tipificación) y backend sin UI · crear sección
   Repositorios (transcripción+tipificación) · módulo simulador de coste (vs mes anterior) · avanzar AED.

**Diferido:** Neutral gray/slate (equipo de Rafa) · W5 · Code Connect · Fase 4 AED · dark zinc vs cool · grises a11y.

## ⚠️ TRAMPAS / PROTECCIONES
- **`kit-export-dtcg.json` está SUCIO en el árbol** (cambio del rol info `{blue}`→`{sky}`, del pipeline de
  tokens). **NO commitearlo a main** (viaja por el plugin → `design-tokens-sync`). Es lo que corta `verify` en
  el paso 1 (`tokens:export-clean`). Para validar un cambio ajeno a tokens: corre el **subconjunto relevante**
  (`build:demo` AOT + `typecheck` + `lint` + `audit:theme-scale`), no el `verify` entero.
- **El supervisor tiene su PROPIO `<sc-icon>`** (`shared/components/icon`, no el del DS; ya soporta `inherit`).
- **sc-demo usa hash routing** (`/#/reglas`). Capturas del Supervisor servidas desde `/usage/*.png`.
- **Figma `figma_execute` "timeout" (7s) en batches** suele aplicar igual: confirma releyendo, no reintentes a
  ciegas. Sube `timeout` (≤30000) o trocea.
- **`preview:live` zombie ensucia el export:** `pkill -f preview-live.mjs` antes de `verify`.
- **NUNCA `[skip ci]`** · **NUNCA borrar `design-tokens-sync`** · **`git add` NUNCA `.claude`**.
- **Commits a main** → `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## 🟡 RECAP al cerrar lotes (lo pidió Rafa)
Mega-dumb, sin ai slop, conciso: qué se hizo, por qué, conclusiones, pendiente, y lo que NO se hizo a drede.

## Índice — dónde mirar
- **Decisiones** → `docs/DECISIONS.md` · **Backlog** → `docs/ROADMAP.md` · **Mapa de docs** → `docs/DOCS-INDEX.md`.
- **Reglas/trampas** → `AGENTS.md` · **Tokens/loop** → `docs/guia-tokens.md` · **Customs** → `docs/customs-catalog.md`.
- **Recorrido de reglas** → sc-demo `/reglas` · **Galería de uso** → sc-demo `/uso` · **Inventario** → `docs/inventory.md`.
