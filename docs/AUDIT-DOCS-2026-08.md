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
> repo, o **[A]** = reportado por un agente auditor y no re-verificado. Los [A] son pistas, no
> hechos: verifica la precondición literal antes de ejecutar su veredicto (`LEARNINGS.md` regla 17).
>
> **CIERRE 2026-08-13 — quedan 0 items `[A]`.** Se verificaron los 25 que había, y verificar valió
> la pena: **cuatro veredictos cambiaron** al comprobarlos. `DD-12` NO era "adoptar DD-8 sin
> cambios" y `AGENTS.md:83` lo cita, así que fundirlo habría roto una referencia; `DD-25` sí es un
> bugfix sin `Descartadas`, pero **28 de los 38 DDs tampoco lo tienen** — no viola la plantilla, la
> plantilla es letra muerta; `colaboracion.md` no es ~60% único sino ~35-40%; y `org-profile.md` no
> es regenerable, porque contradice al README. Un informe de auditoría es la mejor hipótesis
> disponible, no el estado del repo.

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
la escala 14-base aparece en **4 copias** **[V]** (3 skills + `AGENTS.md`, contado sobre el tag `archive/docs-history`).

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

Corolario **[V]** (leído en la cabecera de `token-gen-color.mjs` y `token-gen-cmp-color.mjs`): ambos docs le dicen a Diseño que *"los colores de marca NO se auto-importan"*,
y `token-gen-color.mjs` / `token-gen-cmp-color.mjs` los espejan. Es el consejo operativo que
reciben, y es falso.

### 1.4 · Los números citados en prosa caducan y nadie los vigila **[V]+[A]**

La cadena `verify` está enumerada en **6 sitios con 6 cifras distintas**: 5 (`AGENTS.md`), 7
(`CLAUDE.md`), 7 (`.impeccable.md`), 8 (`pull_request_template`), 18 (tabla del `README`), 25
(`auditoria-semanal`). **La real es 25** **[V]**.

El conteo de componentes va por tres: `README.md` dice 49, `ui-smartcontact/README.md` dice ~55,
`inventory.md` (generado) dice 51 **[V]** — las dos primeras ya estaban cazadas por la rutina
semanal. Y `LEARNINGS` regla 7 decía que el CI son 5 pasos cuando son **8** **[V, arreglado]**.

**Ningún gate compara una cifra citada, un token `--sc-*` o un selector `sc-*` contra el repo.**
`docs:guard` valida forma (mapeo + links del índice) y `docs:coherence` valida solo `npm run X` y
`scripts/*.mjs`. Ahí es donde vive la mayor parte de esta deriva.

### 1.5 · El tope de `LEARNINGS.md` se cumple en la forma, no en el fondo **[V]**

20 entradas numeradas = tope respetado. Pero hay **14 sub-entradas "Corolario" con disparador y
acción propios**: el recuento real es **~34 reglas / 4.732 palabras**. El crecimiento se desvió al
interior de las entradas, blanqueado por la instrucción "funde en la más fuerte". La afirmación de
`CLAUDE.md` *"es corto a propósito"* no se sostiene.

---

## 2. Lo que hay que RESCATAR antes de borrar nada

Tres piezas cuyo borrado destruiría lo único que las guarda:

1. **`docs/history/plan-convergencia-flujos.md` NO es historia** **[V]**. `DOCS-INDEX.md:32` lo
   etiqueta *"construcción CERRADA, referencia histórica"*; el fichero se abre con *"Plan —
   aprobado 2026-07-18 · Siguiente en la cola: **Ola 1**"*. Contiene **[V]** (leído entero antes de rescatarlo a DD-36): 7 divergencias de UX
   **deliberadas** con su motivo (no replicadas en `DECISIONS.md`, y `customs-catalog` solo cubre
   divergencias de token); la trampa **C3**, que muerde directamente a **DD-34** y al item "lienzo
   gris↔blanco" (RESUELTO en DD-45: a blanco, 2026-08-31); y un contrato de test externo
   (`category-modal.spec.ts:52` depende de `.sc-inputtext__msg--error`).
   → **MERGE a `DECISIONS.md` + al hand-off, y LUEGO borrar.**
2. **`convergence-manifesto.md` §4.1/§4.2** **[V]** — el racional de por qué se retiraron
   `sc-label-chip` y `sc-illustrated-avatar`. Es lo único que explica el *porqué*, y hace falta
   para arreglar DD-8, que aún los lista como vivos.
3. **`.agents/skills/sync-theme/SKILL.md`** **[V]** — la única de las 4 skills muertas con
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
| `.agents/skills/{component-generator,token-inspector,primeng-wrapper}` (775) | Nada los carga **[V]**; contenido duplicado de `AGENTS.md`; citan una skill inexistente (`smartcontact-i18n`) **[V]** |
| `docs/history/foundations-rationale.md` (77) | Construcción cerrada; sus enlaces salientes ya apuntan a rutas muertas **[V]** |
| `docs/history/component-port-plan.md` (118) | Port ejecutado; ya tiene un enlace entrante roto **[V]** |
| `docs/history/DECISIONS-LOG.md` (322) | Sus 2 datos únicos están replicados (`01-primitive.css:418`) o revertidos (`tokens:gen-color` está en `verify`) **[V]** |
| `docs/history/DECISIONS-LOG-B.md` (986) | Journal de lote; salvar solo el GATE de `sc-component-icon-resolver` **[V]** — el fichero existe hoy, el dato se salvó bien |
| `docs/history/convergence-manifesto.md` (383) | Tras salvar §4.1/§4.2 |
| `docs/history/plan-convergencia-flujos.md` (308) | **Solo tras el MERGE del §2** |
| `docs/playbook-archivar-ui-main.md` (40) | Andamiaje sobre OTRO repo, con enlace roto a un doc borrado en s23 **[V]** |
| `docs/org-profile.md` (36) | **[V, REFUTADO EN PARTE]** — no es regenerable del todo: tiene texto de marca propio (`:16-18`) y un claim que el README **contradice** (`:35` dice que los paquetes son privados; el README dice que la publicación está APARCADA por DD-17). Regenerarlo daría un texto distinto → **KEEP** hasta que Rafa confirme si ya lo pegó |
| `docs/AUDIT-2026-07.md` (94) | Su §5 se auto-declara resumen de `AUDIT-DEUDA`, su §6 lo cerró DD-29 **[V]** |

**MERGE**

| Doc | Destino |
|---|---|
| `.agents/skills/sync-theme` (111) | `guia-tokens.md` (corregir "7 token layers"→6) |
| `docs/colaboracion.md` (161) | **[V, cifra REFUTADA: es ~35-40%, no ~60%]** — 4 de sus 5 bloques únicos se confirman (PAT y su caducidad, semántica de los 3 botones del plugin, docks) **[V]**. Pero *"nunca borres la rama `design-tokens-sync`"* **NO es único**: ya está en `AGENTS.md:385-389`, con más detalle |
| ~~`DD-12`~~ | **[V, REFUTADO]** — no es "adoptar DD-8 sin cambios": aporta el dato que decide (PrimeNG 21 acepta los dos selectores, así que la fidelidad no desempata), la regla de customs en kebab y la lista de 5 renombrados. Y `AGENTS.md:83` **cita DD-12**: fundirlo rompe esa referencia. **NO se funde** |
| ~~`DD-25`~~ | **[V, pero el veredicto cambia]** — cierto que son 11 líneas sin `Descartadas`… pero **28 de los 38 DDs tampoco lo tienen** (contado). DD-25 no viola la plantilla: la plantilla es letra muerta. Se arregla la CABECERA, no el DD |

**REWRITE**

| Doc | Qué |
|---|---|
| `projects/design-tokens/README.md` (293) | El fallo del §1.3 **[V]** + 3 ejemplos de token muertos **[V]** (los tres con 0 definiciones en `projects/`) + `--sc-scale-12-5` mal **[V]** (dice 153.25px, es 175 — viola su propia ley v/14). **Todo ejecutado** |
| `CLAUDE.md` (26) | **Prioridad 1**: la claim de `@sc-gen` (§1.3). Y volver a ser punteros: sus 5 bullets son contenido copiado **[V, y se decidió NO ejecutarlo]** — ver §5 |
| `AGENTS.md` (513→534) | Pasos inejecutables: **HECHO**. Los **8 pares duplicados con `LEARNINGS`: [V]**, re-contados hoy tras editar ambos ficheros — siguen siendo 8 exactos (+4 solapes débiles). Partirlo: **descartado, ver §5** |
| `docs/DECISIONS.md` (1.572) | 6 DDs con estado falso **[V en 5 de 6]** — **DD-35 el peor: dice que sus ramas no están en `main` y están, y en producción [V]**; reordenar a newest-first (pendiente desde el 30-jun); numerar la sección huérfana `:1265`; faltaba un DD para `cuscare` **[V]** — creado como **DD-37**. Newest-first: reordenado y gateado |
| `docs/ROADMAP.md` (214) | Su **primer** item lleva 2 meses cerrado; otros 2 también **[V]** |
| `docs/inventory.md` §gaps (97) | 2 de sus "4 gaps abiertos" están cerrados **[V]**. La tabla generada sí está al día y bajo gate |
| `.impeccable.md` (102) | Dice "5 componentes locales" (son 2) y "dos apps" (son 4) **[V]** — y es el fichero que se abre para saber qué NO tocar |
| `LEARNINGS.md` (372) | Hacer cumplir el tope de verdad (§1.5): fundir #2+#13+#20, #3→#5, #9→#7; **[V en el conteo, REFUTADO en la propuesta]** — se fundieron 3→5, 9→7 y 13+20→2; #14 y #16 se conservan (ver §5) |

**KEEP** (con parches menores): `customs-catalog.md` (load-bearing: lo citan 5 scripts),
`migration-safety.md`, `receta-migracion-tablas.md`, `code-connect.md`, `consumer-onboarding.md`
(dormido a propósito, con 3 enlaces entrantes reales), `AUDIT-DEUDA-2026-06.md` (verificado item
por item que sigue abierto), `AUDIT-SEMANAL.md`, `.claude/skills/{reflect,auditoria-semanal}`,
`pull_request_template.md`, y los READMEs de `projects/**` salvo sus claims falsas.
`CHANGELOG.md`: **KEEP congelado** con banner — las versiones publicadas son inmutables y nada más
dice qué hay dentro **[V]** — no existen tags `v0.1.0`/`v0.2.0`, y los 2 commits que lo tocan dan el titular de cada release, no el detalle: reconstruirlo exigiría diffear árboles.

---

## 4. Gates — TODOS EJECUTADOS (2026-08-13)

Los cinco propuestos están construidos y **validados en rojo Y en verde** con casos fabricados,
que es la única forma de saber que un guardián muerde (`LEARNINGS` regla 2). De 2 gates de
documentación se pasa a **8**:

| Gate | Qué vigila | Nace de |
|---|---|---|
| `docs:coherence` **E** | una cifra de componentes en prosa vs `docs/_component-status.json` | 2 instancias reales cazadas por la rutina semanal en semanas distintas (49 · "~55" · real 51) |
| `docs:coherence` **F** | un token `--sc-*` citado en la doc que no existe en `projects/**` | 3 ejemplos muertos enseñándose como vivos. Ampliado a los README de `projects/**`, que era donde vivía el que se le escapó |
| `docs:guard` **(2)** | links relativos de **todos** los docs, no solo del índice | de los 9 rotos del censo, **ninguno** estaba en el índice |
| `docs:coherence` **C** | citar uno de los 6 docs borrados sin nombrar `archive/docs-history` | la regla anterior se quedó vigilando un fichero inexistente al borrarlo |
| `docs:coherence` **G** | el índice de disparadores de `LEARNINGS` cuadra con su cuerpo | el índice nuevo: desincronizado deja de ser índice y pasa a ser una mentira corta |
| `docs:coherence` **H** | un doc que declara "caduca el YYYY-MM-DD" y ya venció | el mapa de producto caduca el 2026-09-08 y nadie lo vigilaba |
| `docs:coherence` **D** | cada hand-off de frente lleva sello y su SHA existe | miraba solo `NEXT-SESSION.md`; al pasar ese fichero a índice se habría quedado en no-op silencioso |

**PRs parados** — el patrón del §1.1 — **no** va a `verify`: esa cadena corre offline y
determinista, y consultar GitHub la volvería flaky. Su hogar es la **pasada C** nueva de
`.claude/skills/auditoria-semanal/SKILL.md`, que corre en la nube con `gh`: marca todo PR
abierto con más de 7 días, uno por línea, con su edad. La ironía que lo justifica: esa misma
rutina llevaba 9 días bloqueada por un PR sin mergear **suyo**, y no tenía forma de verlo.

---

## 5. Propuestas del informe que se decidieron NO ejecutar

Un informe propone; ejecutarlo todo a ciegas es el mismo error que no leerlo. Tres veredictos
se descartaron **con motivo**, y consta aquí para que nadie los reabra creyendo que se olvidaron:

- **Partir `AGENTS.md` en tres.** Es la autoridad del repo. Trocearla crea tres ficheros nuevos,
  tres punteros y tres superficies que se desincronizan — exactamente lo que esta auditoría vino
  a reducir. Sus claims falsas ya están corregidas y su solape con `LEARNINGS` no hace daño hoy.
  Que lo pida una deriva real, no un informe.
- **Vaciar `CLAUDE.md` hasta dejarlo en punteros.** Es el ÚNICO fichero que se autocarga en cada
  sesión: es el sitio del repo donde mejor rinde una advertencia de una línea, y de hecho una de
  las suyas (`@sc-gen` en 5 ficheros) evita perder trabajo. Se corrigió el **índice**, que lo
  catalogaba como "puntero sin info nueva" — la etiqueta era falsa, el fichero no.
- **Borrar las reglas #14 y #16 de `LEARNINGS` por "indisparables".** #14 disparó ese mismo día
  (entregar lo verificable y decir qué queda fuera) y #16 tiene evidencia real. Lo que sí se
  ejecutó del §1.5 fueron las **fusiones** (3→5, 9→7, 13+20→2), que es donde estaba el bulto.

**El criterio, para la próxima**: un veredicto de auditoría es una hipótesis con evidencia, no una
orden. Si al abrir el fichero la propuesta empeora el repo, gana el fichero — y se escribe aquí.

---

*Levantado el 2026-08-13. Los items que se prioricen se mueven a `ROADMAP.md`; este documento es
un snapshot y no se mantiene al día.*
