# Auditoría de documentación — 2026-08 (snapshot fechado)

> **Qué es**: censo completo de los 46 `.md` del repo tras 100+ sesiones, con veredicto por
> documento. Encargo: eliminar solapamiento, retirar lo que no se usa, facilitar que se
> encuentre, y alinear los docs entre sí y con el código.
>
> **Por qué existe**: *"yo no te estoy recordando de actualizar xyz verbalmente porque me sería
> imposible"* (Rafa, 2026-08-13). Por eso el entregable no es solo una limpieza: todo lo
> mecanizable acaba en un **gate**, porque una regla que hay que recordar no se cumple.
>
> **Cómo leer la procedencia**: cada hallazgo va marcado **[V]** = verificado por mí contra el
> repo, o **[A]** = reportado por un agente auditor y **no re-verificado todavía**. Los [A] son
> pistas, no hechos: verifica la precondición literal antes de ejecutar su veredicto
> (`LEARNINGS.md` regla 17).

**Censo (2026-08-13)** — 46 ficheros, ~10.600 líneas. Los pesados: `DECISIONS.md` 1.572 ·
`guia-tokens.md` 1.055 · `DECISIONS-LOG-B.md` 986 · `customs-catalog.md` 906 · `AGENTS.md` 513 ·
`convergence-manifesto.md` 383 · `LEARNINGS.md` 372.

---

## 1. Los cinco patrones (importan más que los items sueltos)

### 1.1 · Trabajo terminado que no cruza la última puerta **[V]**

`docs/AUDIT-SEMANAL.md` decía *"aún no ha corrido ninguna auditoría"*. **Falso**: la rutina había
corrido **dos veces** (4 y 10 de agosto) con 14 hallazgos verificados `file:line`, y su salida
estaba en el **PR #22, abierto desde el 4 de agosto**. No era maquinaria muerta: era maquinaria
viva cuya salida no aterrizaba.

Y no era un caso aislado — había **tres** PRs parados: #22, #20 (`npm audit fix`, del 30-jul) y
#23 (lecciones de la sesión 24 que nunca llegaron a `LEARNINGS.md`). **Los tres mergeados el
2026-08-13.**

**Lección de sistema**: el repo tiene gates de sobra para lo que entra; no tiene ninguno para lo
que se queda fuera. Un PR abierto no molesta a nadie y por eso se pudre.

### 1.2 · Instrucciones obligatorias que no ejecuta nadie **[V]**

`AGENTS.md:140-147` ordena *"1. Run `token-inspector` … 4. `sync-theme`. **Do not skip steps.**"*
Los cuatro viven en `.agents/skills/**/SKILL.md` (**886 líneas**) y **nada en el repo los carga**:
ni `package.json`, ni `.github/`, ni `.claude/`, ni `.mcp.json` (grep verificado, salida vacía).
`.claude/skills/` —que Claude Code sí carga— solo contiene `reflect` y `auditoria-semanal`.

Además **quedan fuera de `docs:guard`**, que solo escanea `docs/` + raíz: 886 líneas sin indexar,
sin cargar y sin vigilar. Y su contenido es en su mayor parte `AGENTS.md` reescrito — la regla de
la escala 14-base aparece en **4 copias** **[A]**.

### 1.3 · El doc declarado "canónico" es el más rancio **[V]**

`DOCS-INDEX.md:64-66` declara que `projects/design-tokens/README.md` es *"el canónico técnico"* y
`guia-tokens.md` su *"traducción para diseño"*. **Está invertido**: el canónico lleva 5 semanas
más de retraso, y falla en el corazón del pipeline.

| Afirma el "canónico" | Real (medido) |
|---|---|
| *"**Three** regions of `01-primitive.css` are generated"* | **9 zonas `@sc-gen` en 5 ficheros** (01, 02, 04, 05, 07) |
| *"The **single** generator is `token-gen.mjs`"* | **5 generadores** encadenados en `tokens:import` |

**Y la misma claim, recortada, está en `CLAUDE.md`** — el fichero que se autocarga en CADA
sesión: *"Los bloques `@sc-gen:*` de `01-primitive.css` son generados"*. Un agente que lea eso
puede editar a mano un bloque generado de `02`/`04`/`05`/`07` creyendo que es curado, y
`tokens:import` se lo comerá sin avisar. **Es la claim más peligrosa del repo**: está en el doc
más leído y su consecuencia es pérdida de trabajo.

Corolario **[A]**: ambos docs le dicen a Diseño que *"los colores de marca NO se auto-importan"*,
y `token-gen-color.mjs` / `token-gen-cmp-color.mjs` los espejan. Es el consejo operativo que
reciben, y es falso.

### 1.4 · Los números citados en prosa caducan y nadie los vigila **[V]+[A]**

La cadena `verify` está enumerada en **6 sitios con 6 cifras distintas**: 5 (`AGENTS.md`), 7
(`CLAUDE.md`), 7 (`.impeccable.md`), 8 (`pull_request_template`), 18 (tabla del `README`), 25
(`auditoria-semanal`). **La real es 25** **[A]**.

El conteo de componentes va por tres: `README.md` dice 49, `ui-smartcontact/README.md` dice ~55,
`inventory.md` (generado) dice 51 **[A]** — las dos primeras ya estaban cazadas por la rutina
semanal. Y `LEARNINGS` regla 7 decía que el CI son 5 pasos cuando son **8** **[V, arreglado]**.

**Ningún gate compara una cifra citada, un token `--sc-*` o un selector `sc-*` contra el repo.**
`docs:guard` valida forma (mapeo + links del índice) y `docs:coherence` valida solo `npm run X` y
`scripts/*.mjs`. Ahí es donde vive la mayor parte de esta deriva.

### 1.5 · El tope de `LEARNINGS.md` se cumple en la forma, no en el fondo **[A]**

20 entradas numeradas = tope respetado. Pero hay **14 sub-entradas "Corolario" con disparador y
acción propios**: el recuento real es **~34 reglas / 4.732 palabras**. El crecimiento se desvió al
interior de las entradas, blanqueado por la instrucción "funde en la más fuerte". La afirmación de
`CLAUDE.md` *"es corto a propósito"* no se sostiene.

---

## 2. Lo que hay que RESCATAR antes de borrar nada

Tres piezas cuyo borrado destruiría lo único que las guarda:

1. **`docs/history/plan-convergencia-flujos.md` NO es historia** **[V]**. `DOCS-INDEX.md:32` lo
   etiqueta *"construcción CERRADA, referencia histórica"*; el fichero se abre con *"Plan —
   aprobado 2026-07-18 · Siguiente en la cola: **Ola 1**"*. Contiene **[A]**: 7 divergencias de UX
   **deliberadas** con su motivo (no replicadas en `DECISIONS.md`, y `customs-catalog` solo cubre
   divergencias de token); la trampa **C3**, que muerde directamente a **DD-34** y al item "lienzo
   gris↔blanco" que sigue esperando a Rafa; y un contrato de test externo
   (`category-modal.spec.ts:52` depende de `.sc-inputtext__msg--error`).
   → **MERGE a `DECISIONS.md` + al hand-off, y LUEGO borrar.**
2. **`convergence-manifesto.md` §4.1/§4.2** **[A]** — el racional de por qué se retiraron
   `sc-label-chip` y `sc-illustrated-avatar`. Es lo único que explica el *porqué*, y hace falta
   para arreglar DD-8, que aún los lista como vivos.
3. **`.agents/skills/sync-theme/SKILL.md`** **[A]** — la única de las 4 skills muertas con
   contenido que NO está en `AGENTS.md`: las dos rutas de sync y el contrato del preset.
   → **MERGE a `guia-tokens.md`**; las otras tres se borran.

Ya rescatado el 2026-08-13: el hallazgo sistémico de SISMAC-4074 (text styles sin tokenizar =
raíz común de 4 "fallos" de componente), que vivía solo en el hand-off del PR #23 → `ROADMAP.md`.

---

## 3. Veredicto por documento

**DELETE** — nada los carga, o su fase está cerrada y su contenido replicado.

> Los 6 de `docs/history/` se borraron el 2026-08-13 y quedan **consultables para siempre** en el
> tag **`archive/docs-history`** (empujado a `origin`), con el porqué en su mensaje:
> `git show archive/docs-history:docs/history/<fichero>`. Lo que seguía vivo se rescató ANTES
> (§2). El resto de DELETE de esta tabla se recuperan por historia de git.

| Doc | Por qué |
|---|---|
| `.agents/skills/{component-generator,token-inspector,primeng-wrapper}` (775) | Nada los carga **[V]**; contenido duplicado de `AGENTS.md`; citan una skill inexistente (`smartcontact-i18n`) **[A]** |
| `docs/history/foundations-rationale.md` (77) | Construcción cerrada; sus enlaces salientes ya apuntan a rutas muertas **[V]** |
| `docs/history/component-port-plan.md` (118) | Port ejecutado; ya tiene un enlace entrante roto **[V]** |
| `docs/history/DECISIONS-LOG.md` (322) | Sus 2 datos únicos están replicados en código o revertidos por DD-19/20 **[A]** |
| `docs/history/DECISIONS-LOG-B.md` (986) | Journal de lote; salvar solo el GATE de `sc-component-icon-resolver` **[A]** |
| `docs/history/convergence-manifesto.md` (383) | Tras salvar §4.1/§4.2 |
| `docs/history/plan-convergencia-flujos.md` (308) | **Solo tras el MERGE del §2** |
| `docs/playbook-archivar-ui-main.md` (40) | Andamiaje sobre OTRO repo, con enlace roto a un doc borrado en s23 **[V]** |
| `docs/org-profile.md` (36) | Payload de un solo uso para otro repo; regenerable **[A]** |
| `docs/AUDIT-2026-07.md` (94) | Su §5 se auto-declara resumen de `AUDIT-DEUDA`, su §6 lo cerró DD-29 **[A]** |

**MERGE**

| Doc | Destino |
|---|---|
| `.agents/skills/sync-theme` (111) | `guia-tokens.md` (corregir "7 token layers"→6) |
| `docs/colaboracion.md` (161) | `guia-tokens.md` como §0 "Arranque + loop del día a día" — ~60% es runbook único (PAT y su caducidad, semántica de los 3 botones del plugin, docks, "nunca borres la rama `design-tokens-sync`") **[A]** |
| `DD-12`, `DD-25` | DD-8 y un comentario en `sc-dialog` **[A]** |

**REWRITE**

| Doc | Qué |
|---|---|
| `projects/design-tokens/README.md` (293) | El fallo del §1.3 + 3 ejemplos de token muertos + `--sc-scale-12-5` mal (dice 153.25px, es 175 — viola su propia ley v/14) **[A]** |
| `CLAUDE.md` (26) | **Prioridad 1**: la claim de `@sc-gen` (§1.3). Y volver a ser punteros: sus 5 bullets son contenido copiado **[A]** |
| `AGENTS.md` (513) | Quitar los 4 pasos inejecutables (§1.2); mover a `LEARNINGS` lo que es proceso puro; 8 pares duplicados con `LEARNINGS` **[A]** |
| `docs/DECISIONS.md` (1.572) | 6 DDs con estado falso — **DD-35 el peor: dice que sus ramas no están en `main` y están, y en producción [V]**; reordenar a newest-first (pendiente desde el 30-jun); numerar la sección huérfana `:1265`; falta un DD para `cuscare`, que está en producción sin cobertura **[A]** |
| `docs/ROADMAP.md` (214) | Su **primer** item lleva 2 meses cerrado; otros 2 también **[A]** |
| `docs/inventory.md` §gaps (97) | 2 de sus "4 gaps abiertos" están cerrados **[A]**. La tabla generada sí está al día y bajo gate |
| `.impeccable.md` (102) | Dice "5 componentes locales" (son 2) y "dos apps" (son 4) **[A]** — y es el fichero que se abre para saber qué NO tocar |
| `LEARNINGS.md` (372) | Hacer cumplir el tope de verdad (§1.5): fundir #2+#13+#20, #3→#5, #9→#7; #14 y #16 son indisparables **[A]** |

**KEEP** (con parches menores): `customs-catalog.md` (load-bearing: lo citan 5 scripts),
`migration-safety.md`, `receta-migracion-tablas.md`, `code-connect.md`, `consumer-onboarding.md`
(dormido a propósito, con 3 enlaces entrantes reales), `AUDIT-DEUDA-2026-06.md` (verificado item
por item que sigue abierto), `AUDIT-SEMANAL.md`, `.claude/skills/{reflect,auditoria-semanal}`,
`pull_request_template.md`, y los READMEs de `projects/**` salvo sus claims falsas.
`CHANGELOG.md`: **KEEP congelado** con banner — las versiones publicadas son inmutables y nada más
dice qué hay dentro **[A]**.

---

## 4. Gates propuestos (fase D)

Ordenados por evidencia, no por elegancia:

1. **Cifra citada vs conteo real** — ya propuesto **dos veces** por la rutina semanal con dos
   instancias distintas (`README.md` 49, `ui-smartcontact/README.md` ~55, real 51). Compara contra
   `docs/_component-status.json`. **Es el más justificado de todos.**
2. **Tokens `--sc-*` citados en docs vs las 6 capas** — cubriría los 3 ejemplos de token muertos
   del §3 y evitaría que un doc enseñe un token retirado.
3. **Links relativos en TODOS los docs** — hoy `docs:guard` solo valida los de `DOCS-INDEX`. Los 9
   links rotos del censo estaban fuera de su alcance **[V]**.
4. **Caducidad declarada** — `mapa-producto-2026-08.html` caduca el 2026-09-08 y nadie lo vigila.
5. **PRs parados** — el patrón §1.1 no lo caza ningún gate del repo. Un aviso a los N días es la
   única red posible para "trabajo terminado que no aterriza".

---

*Levantado el 2026-08-13. Los items que se prioricen se mueven a `ROADMAP.md`; este documento es
un snapshot y no se mantiene al día.*
