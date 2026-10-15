# Frente · Fichas de administración (agente, grupo, usuario) y Configuración del AED — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.
>
> Nace el 2026-09-16. El tramo anterior (las tres formas de ficha, 2026-09-15) vive en `design-system.md`.
> El tramo del 2026-09-23 (grupos sin foto, alta en diálogo) sale de aquí por el tope de 6: `git show
> 4f4f2018:docs/handoff/supervisor-fichas.md` o el tag `archive/handoff-fichas-2026-09-27`. Su trampa (`main`
> se mueve bajo un worktree local) ya vive en LEARNINGS #21. El del 2026-09-24 (el alta de grupo rima con
> Identidad, DD-119) sale por el mismo tope: `git show 16ff7930:docs/handoff/supervisor-fichas.md`. Y el de las
tablas tras la revisión del equipo (2026-09-24, cinco PRs): `git show 197c5579:docs/handoff/supervisor-fichas.md`;
sus dos trampas suben a «Trampas del frente». El de la visión de producto de grupos (2026-09-26, DD-121) sale por el
mismo tope: `git show f63d13aa:docs/handoff/supervisor-fichas.md`; sus trampas de `p-drawer`, `p-table` y el carril de
Contact Center suben a «Trampas del frente». El de un solo índice (2026-09-27, DD-122), igual: `git show
7458351:docs/handoff/supervisor-fichas.md`; sus trampas también suben. Y el del resumen como widget (2026-09-27,
DD-126): `git show 0990ff3b:docs/handoff/supervisor-fichas.md`, con sus trampas arriba. Y los dos del 2026-09-27
(el «Eliminar» a AA, DD-128, y el pase de diseño, DD-130): `git show 004498dc:docs/handoff/supervisor-fichas.md`; las
cuatro trampas del pase suben a «Trampas del frente». Y el de la revisión de producto del 2026-10-01 (H, los diálogos de
Recursos, D1, D2, R, G1, G2a y G2b): `git show 001bcf5f:docs/handoff/supervisor-fichas.md`; sus trampas suben a
«Trampas del frente». Los del 2026-09-28 y del 2026-09-29: `git show c6a9cd59:…` y `git show 2a894b1c:…`. El de E2
(DD-149, sin trampas propias): `git show a7bca7c0:docs/handoff/supervisor-fichas.md`. El de E3 (DD-150, tampoco):
`git show c065d664:docs/handoff/supervisor-fichas.md`. El de E4 (DD-151, tampoco): `git show 7d70bfb9:…`. El de D3
(DD-152, tampoco): `git show e7e0e8f3:docs/handoff/supervisor-fichas.md`. El de F (DD-153, tampoco): `git show
f41d3ce6:docs/handoff/supervisor-fichas.md`; el de E1b, `git show faf25027:docs/handoff/supervisor-fichas.md`. El de lo que dejó F
(DD-156, la lista virtual con «reducir movimiento»): `git show 5cc9af78:docs/handoff/supervisor-fichas.md`. Y el de la
revisión de producto del 2026-10-04 (DD-157 a DD-162, #325, sin trampas propias): `git show
fcaf40db:docs/handoff/supervisor-fichas.md`. El de Recursos (DD-163 a DD-167, #327, sin trampas propias):
`git show 4217ed41:docs/handoff/supervisor-fichas.md`. Y el de sc-docs y el peso de los iconos (#330, sin
trampas propias): `git show 3ff6cd71:docs/handoff/supervisor-fichas.md`. El de Accesibilidad pendiente (#332, sin DD nueva ni trampas
propias): `git show 540f246c:docs/handoff/supervisor-fichas.md``. El de supervisión y limpieza (2026-10-05, DD-168, #333, sin trampas propias): `git show
60f8e617:docs/handoff/supervisor-fichas.md`. El de las tres columnas sin cabecera (2026-10-05, DD-170, #337): `git show
b49b56e0:docs/handoff/supervisor-fichas.md`. El de Tipificaciones (2026-10-05, DD-173, DD-174 y DD-177, #340): `git show
a3e03136:docs/handoff/supervisor-fichas.md`. El del pulido de las fichas (2026-10-06, DD-176, #341): `git show
0bf19647:docs/handoff/supervisor-fichas.md`. El de Repositorios en tarjetas (2026-10-06, DD-179, #347): `git show
d4843e43:docs/handoff/supervisor-fichas.md`. El de ordenar por cualquier columna (2026-10-06, DD-180 y DD-181): `git show
d94e5ad8:docs/handoff/supervisor-fichas.md`. El de las cuatro secciones en el mismo árbol (2026-10-06, DD-182, sin
trampas propias): `git show 11c607cf:docs/handoff/supervisor-fichas.md`. El de la segunda vuelta de grupos
(2026-10-07, DD-185, #355, sin trampas propias): `git show d4843e43:docs/handoff/supervisor-fichas.md`. Y el de la
baldosa y la fila del resumen al DS (2026-10-07, DD-186, #356, sin trampas propias): `git show
d94e5ad8:docs/handoff/supervisor-fichas.md`. El de la revisión de agentes y tipificaciones (2026-10-09, DD-187,
#360, sin trampas propias): `git show 208019113e9b9fdad6a8c0f6c4338fcf4437260a:docs/handoff/supervisor-fichas.md`.
El de lo que se decide de la auditoría de PrimeNG (2026-10-11, DD-195, sin trampas propias): `git show
a2a837d4:docs/handoff/supervisor-fichas.md`.

## ✅ 2026-10-15 · Revisión de producto de la ficha de grupo: resumen, Ring All, tipificación, audios, Email y rejilla (DD-206)

> **Sello:** worktree `seabiscuit`, rama `arebury/revision-1015-grupos` sobre `main` `a2a837d4`. PR 1 de 3 del plan.

- **Resumen**: Teléfono y Email son enlaces a su bloque, como Chat; fuera el selector rápido de estrategia.
- **Ring All**: `RING_ALL_ALLOWED_MAX = 2`; elegir 3 o más vuelve a 2 y lo dice. **Tipificar conversaciones** siempre,
  con la descripción de la tipificación y «Ver detalle»; el árbol sin «N niveles, N opciones».
- **Audios**: el «Advanced» de primeng.dev con `auto`, sin «Subir» ni «Cancelar» (DS: `saved`, `savedRemoved`,
  `removeLabel`; `uploadLabel` y `cancelLabel` para el ejemplo entero), en música, identificador, «Eres el siguiente» y el audio saliente (`conAudioSaliente`). .wav y .mp3.
- **Email**: las seis estrategias de Teléfono (Niveles con «Dentro de cada nivel» y la columna «Nivel Email»), tiempo
  de ringing y su cola. Desbordar sigue en «Reglas comunes».
- **Rejilla** (DD-206 §10 y §11): Tipificar bajo su interruptor; «Tamaño de cola» a dos columnas (`--sc-option-cards-gap`);
  «Llamadas salientes» en Teléfono; «Web Chat» y «WhatsApp» como partes de Chat; Recursos en dos filas; cada audio en
  su fila; toda ayuda a 7 de su control (DS incluido); `sc-textarea` en columna; títulos a 18 · 16 · 14 (§12 a §15).
- **Pruebas**: en local, a 1440, las de grupo, las 2 de `sc-fileupload` y la de Niveles en Email (enrojece sin él).
- **Trampas**: `p-select` no acepta que le cambies el valor dentro de su propio `onChange`: para devolverlo a 2 hace falta
  `setTimeout(() => select.value.set(2))`. Y un `ng serve` que pilla `dist/` a medio construir se queda en error aunque
  el build acabe: reinícialo (el de sc-docs tapaba la página con `vite-error-overlay` y la prueba fallaba en el clic).

## ✅ 2026-10-14 · Revisión de las fichas a 1440: nombres, resumen en una línea, Recursos y tablas que miden sus filas (DD-204)

> **Sello:** worktree `undine`, rama `arebury/agentes-fila-cli` sobre `main` (con `origin/main` fundido el 2026-10-14).

- **Nombres**: «Agentes asignados» (grupo) y «Grupos asignados» (agente) en el índice y la cabecera, sin subtítulo dentro
  (`sc-subsection` sin `titleKey`). «Música de espera/transferencia».
- **Resumen del grupo**: Distribución con Teléfono y «Teléfono saliente»; Recursos aparte, una fila por tipo (Agendas y
  plantillas de los canales que atiende) con su panel. Fuera «Salida». La tarjeta de datos de las tres fichas, en caption
  y con baldosa pequeña: a 1440 nada parte de línea.
- **Recursos**: «Editar» es un lápiz en la opción del desplegable, al pasar (`sc-resource-option` + `#item` y `hide()`
  nuevos en `sc-multiselect`). Fuera `sc-resource-rows`.
- **Tamaño de cola**: tarjetas de radio, el ejemplo «Card» de primeng.dev sobre `sc-option-cards` (que pasa a ese dibujo
  también en los dos «Descuelgue»). sc-docs › RadioButton › Tarjeta.
- **Tablas de asignar**: `scLlegaAlPie` con `filasReservadas` en vez de `fill`: miden todas sus filas, con el pie de tope,
  y no cambian de alto al filtrar (medido: 402 px con los cuatro filtros). Casillas, radio e interruptor centrados en la
  fila. El panel rápido sigue con `fill`, y su tarjeta ahora encoge hasta su hueco (`--table-card-suelo: 0`): con 28
  agentes pasaba por encima del pie y tapaba «Guardar».
- **Agente**: sin columna Nivel; Salientes vuelve al radio; Habilitado sin candado con «Activación por grupo» (lo cambia
  el supervisor, corrige DD-187 §2) y a 6,75 rem: cabe a 1440. Estado apagado si está Desconectado.
- **Listado de agentes**: «Desconectado» en texto gris, sin etiqueta.
- **Pruebas**: `recursos-resumen.spec.ts` reescrita para el lápiz; `tabla-al-pie.spec.ts` gana la de la tabla corta;
  `agente-grupos-asignados.spec.ts`, nueva (sin Nivel, radio, sin candado, Desconectado). En local, a 1440, las 314 de
  los specs tocados y vecinos, en verde tras corregir las que esperaban los nombres de antes.
- **Trampa**: `--table-card-tope: none` anula también el suelo (`min(…, none)` no vale y cae en `auto`): quien ponga el
  tope en `none` debe poner `--table-card-suelo`.

## ✅ 2026-10-13 · Fuera las notas de decisión

> **Sello:** rama `arebury/quitar-notas-equipo-main` sobre `main` `7711d83d`.

- **Las ocho notas moradas, fuera** con su componente (`sc-nota-decision`), su globo (`_nota-decision.scss`) y
  `decision_notes` en los cuatro idiomas: el equipo dio por resuelto lo que preguntaban (DD-187 §9). Queda lo
  construido: el PIN solo con la extensión en el teléfono, sin filtro de estado en el listado, el punto proporcional,
  «—» en las celdas vacías, «Deshacer» en la barra, la escalera, el nombre fijo y la ayuda debajo.
- **Los huecos que solo servían a las notas, también:** `[scListHeadingNote]` (el título del listado vuelve a ser un
  `h1` suelto, sin `.page__heading-row`) y `[scBulkResult]` en `sc-bulk-action-bar` del DS.

## ✅ 2026-10-13 · Lo que falta se dice cuando ya hubo ocasión (DD-199)

> **Sello:** worktree `lancetfish`, rama `arebury/fix-no-initial-error` sobre `main` en `c5b95584`.

- **El fallo:** al encender «Tipificar llamadas» en un grupo guardado, el desplegable nacía en rojo (borde, aviso y
  punto en General) antes de poder elegir nada. La causa, en cuatro fichas: `mode() === 'edit' || …`, que al editar
  hacía acusar en el acto a todo obligatorio vacío. Pasaba igual al quitar canales y al duplicar un agente o un usuario.
- **La norma** (DD-199; principio 11 de AGENTS §«UX de pantalla» y su copia en sc-docs › Patrones): acusa al dejar la
  sección sin ello, o al abrir si lo guardado ya venía sin ello; antes, el resumen y el motivo junto al botón, sin
  rojo. El contenido equivocado, en vivo.
- **La pieza:** `ocasionDeAvisar` (`shared/utils/alta-secciones.ts`), en grupo, agente, usuario y tipificación. «Lo
  guardado» es lo que había la última vez que la ficha no tenía cambios.
- **Que no vuelva:** regla 7 de `audit:screen-hygiene` (en `main` marcaba las 8 líneas) y
  `sin-acusar-de-primeras.spec.ts` (3 pruebas, en rojo contra `main`). 68 e2e de las fichas, en verde en local.
- **El pie «Atrás / Siguiente», revisado: se queda** (DD-158, «Descartado»): juntos a la izquierda, ni separados ni al
  editar. Medido: el alta de agente ya los lleva en sus cuatro secciones (General, solo «Siguiente»; Grupos, solo
  «Atrás»); al editar no los lleva ninguna ficha.

## ✅ 2026-10-12 · Quick-wins de la auditoría UX Agentes/Grupos + columna Nivel

> **Sello:** PR #375, mergeado en main.
> Fuente: `docs/AUDIT-UX-AGENTES-VS-GRUPOS-2026-10.md` (rama aparte `docs/audit-ux-agentes-vs-grupos`, ya pusheada).

- **6 quick-wins:** `channelsError` de Grupos avisa también al editar (como `phoneError`); mismo verbo
  ("Selecciona…") en el aviso de "sin canales" de Grupos y Agentes; "Chats simultáneos" explica por qué
  no se ve cuando el agente no atiende chat; "Permisos" de Agentes en 2 `sc-slot` (Acceso y dispositivos /
  Grabación y seguimiento); icono en las 3 `sc-subsection` de Configuración; namespace i18n de Recursos
  movido de `agents.form.resources.*` a uno neutro (`resources.*`), compartido de verdad por las dos fichas.
- **`sc-link-button` (nuevo, local a Supervisor):** el candado "no permitido"/autoactivación de
  `agent-channel-table` pasa de `<a><sc-icon></a>` suelto a un botón de solo icono que navega
  (`<a [pButton] [routerLink]>`, directiva de PrimeNG, no el componente). Vive en
  `shared/components/link-button/`, **no** en `@smartcontact-hub/components`: depende de `@angular/router`,
  que el paquete publicado no tiene como peer dependency. No se tocó `sc-button` (DD-172 sigue en pie,
  acotado a este caso).
- **Columna "Nivel"** en `group-assignment-table` (tabla "Grupos" de la ficha de agente): `availableGroups`
  gana `strategy`/`chatStrategy` del grupo (ya estaban en el store, se recortaban antes de llegar a la
  tabla); columna fija con celda condicional por fila — selector 1-10 solo si ese grupo reparte por Niveles
  en una familia que el agente tiene asignada, `sc-celda-vacia` si no. Mismo dato (`GroupAgentLink.levels`)
  que ya usa la tabla del lado del grupo. Probado en el navegador real (Playwright): cambio de nivel desde
  la ficha de agente, persiste y se ve igual desde la ficha del grupo.
- **Abierto (gusto, sin regla):** la columna Nivel añade 9rem a `group-assignment-table` y a 1440 "Habilitado"
  ya no cabe sin desplazar (antes iba ~18px justa, ahora ~162px corta) — scroll horizontal funciona bien, y
  hay precedente ya aceptado en la tabla gemela (`agent-channel-table`, DD-181) de scrollear al ganar
  columnas. No se tocó por no ser un número objetivamente equivocado, solo una decisión de densidad.
- **Pendiente (abierto, gusto):** si se quiere, repasar los anchos de las dos tablas de asignación a la vez
  para que quepan sin scroll a 1440 con Nivel incluido.

## ✅ 2026-10-13 · Salientes como chip+acción, Nivel sin overlay (pide Rafa tras la auditoría)

> **Sello:** rama `design/salientes-nivel-maquetacion` sobre main, HEAD `10b9628c` (incluye #376: `fill` de
> `sc-datatable`, que ya resolvió el tercer punto de abajo — las tablas cortas llegan al pie). Aún sin PR.

Rafa, tras ver la auditoría en vivo: ¿por qué Agentes tiene columna Salientes si Grupos no la tiene en su
tabla de Agentes? El Nivel de Grupos "expande muchísimo". Y la tabla de Grupos en la ficha de Agente no
llega al pie.

- **Salientes no es arbitrario:** es un campo DEL AGENTE (`defaultOutboundGroupId`), no del grupo —
  en Grupos "saliente" es una propiedad fija del propio grupo (un teléfono, sin fila); en Agentes solo
  tiene sentido ENTRE los grupos a los que el agente está asignado, que es la tabla que se edita. Por eso
  vive ahí. Lo que sí era un problema real: un `sc-radiobutton` por fila se leía como "otro toggle más".
  Cambiado a `sc-tag` (el valor ya es un hecho) en la fila elegida y `sc-button` de acción ("marcar como
  saliente") en las demás — visualmente solo una fila destaca, no una columna entera de controles iguales.
- **Nivel (lado Grupo, `agent-channel-table`):** `sc-select` de 10 opciones → `sc-inputnumber` (stepper
  1-10, sin overlay). Es un entero ordenado, no una categoría. El lado Agente (`group-assignment-table`)
  sigue con `sc-select`, sin tocar — no era el que Rafa señaló.
- **Empty-state de las dos tablas gemelas:** el `<div scTableEmpty>` de texto plano pasa a `sc-empty-state`
  (mismo patrón que `agenda-contacts-table`, que ya resolvía justo esto) — con `fill` del #376 la tarjeta
  SIEMPRE llega al pie, así que un texto suelto arriba dejaba un hueco en blanco enorme debajo; el
  empty-state centra icono+texto y lo llena.
- **Pendiente:** abrir el PR.

El del barrido de consistencia y sin punto medio entre datos (2026-10-06, DD-183, sin trampas propias), y el de
la revisión de grupos del equipo y `sc-fileupload` (2026-10-06, DD-184, sin trampas propias): `git show
a7ddc14b:docs/handoff/supervisor-fichas.md`.

## SIGUIENTE — sin preguntar

-3. **PR 2 y PR 3 de la revisión del 2026-10-15** (plan en `~/.claude/plans/tengo-transcripci-n-con-una-foamy-barto.md`):
   la ficha de agente (Salientes como desplegable bajo la tabla, grabación y extensión con icono, «Canales») y las
   tablas comunes y Repositorios («+ Nueva X», «Buscar {entidades}…», la celda de grupos, anchos al abrir, un solo
   diálogo de importar, subcategorías, grupos en plantillas, agendas). Cada uno, enseñado en local antes de subir.
-2b. **Componente tabla (otra sesión):** el «evolutivo» de la tabla con los devs (BI y voz). Propuesta de producto:
   elegir UNA vez qué funciones de la Table de PrimeNG queremos y cerrarlo; hay un Excel con las de BI.
   Punto de partida: `docs/AUDIT-PRIMENG-CATALOGO.md`. En la reunión: reordenar, ajustar ancho y arrastrar columnas
   son lo que falta; una card de Jira con los observadores de componentes.

-2. **Lo que queda de la auditoría de PrimeNG** (DD-195, `docs/AUDIT-PRIMENG-CATALOGO.md`, «Siguientes pasos»), revisado
   el 2026-10-12. Cerrado con evidencia: las dos casillas son intencionales (el Column Toggle calca el ejemplo nativo
   de PrimeNG con `[value]` + `ngModel` de array, que `sc-checkbox` —tri-estado, `state: TriState`— no modela; no es
   una inconsistencia, son dos trabajos distintos); `sc-command-palette` se mantiene frente a CommandMenu (agrupa y
   filtra igual, pero CommandMenu no trae overlay, Cmd+K global, Esc ni `/`, que es la mitad del componente —detalle
   en el audit—).
   **Queda abierto, y no es un hueco de estos cuatro componentes**: documentar Menu, Listbox, Toolbar y MeterGroup en
   sc-docs no tiene dónde ir — el showcase solo tiene página para wrappers `sc-*` (`component-catalog.ts`), y no hay
   precedente de página para un nativo sin wrapper (tampoco lo tienen Inplace, Tooltip, Sidebar o las pestañas del
   Monitor, todos ya «bien directos»). Antes de escribir páginas nuevas, decidir la forma: ¿una categoría «Nativos»
   en el catálogo?, ¿una sola página «PrimeNG directo» con una sección por módulo? Es una decisión de estructura del
   showcase, no de este frente solo.
-1. **`fichas-nombre-fijo.spec.ts`, intermitente en el CI (2026-10-06).** Falló cuatro veces en dos PRs (#349 y #350),
   siempre en el shard 4/8, cada vez en una ficha distinta (agente a 1366, usuario a 1366, grupo a 1280) y con el mismo
   mensaje, «X sigue a la vista»: en el punto donde debía estar el nombre devuelve el texto de la barra superior. Pasa al
   relanzar el shard. **Sin medir la causa**; la hipótesis es de tiempo (`bajar` espera dos fotogramas y lee enseguida, y
   en un runner cargado la cabecera fija aún no se ha asentado). Primer paso: repetir ese shard en bucle en el CI para
   ver cuándo falla, y esperar a que el scroll se asiente antes de leer.
0. **Repositorios en tarjetas (DD-179), en su PR.** Queda en Figma (`figma-pendiente`, la ficha de DD-179) y, para
   producto, fuera de lote: el oscuro en slate en vez de zinc (DD-79) y los grises de texto un paso más oscuros en
   claro (DD-106), que el análisis de la maqueta propuso y cambian todo el producto.
1. **El pulido de las fichas (DD-176), fundido (#341).** Queda en Figma: la ficha de agente y la de usuario en tres
   columnas (`figma-pendiente` §35) y el color marrón de etiqueta (§36b).
2. **Tipificaciones (DD-173, DD-174 y DD-177), fundido (#340).** Queda, fuera del lote: las Reglas de Conversaciones
   con su propia copia de las tipificaciones (`entity-catalog.ts`), Supervisión › Tipificaciones vacía, y dos
   preguntas para producto (en el tramo de DD-177): el chat sin niveles en sc-agent, y la lista que abre cada
   píldora del teléfono, que es una propuesta: sc-agent ya pinta un botón por nivel, pero la réplica no dice qué abre.
3. **Hecho el 2026-10-05:** las fichas sin cabecera (DD-170) entraron en #337, y el triaje de los otros frentes (DS,
   CusCare, Dashboard y Sidebar) dio los lotes 5 a 9, en un PR: cada hand-off lleva su tramo, y lo que queda en ellos
   espera a otros (producto, Figma, devs o el portátil). Con Tipificaciones fundido, en este frente no queda nada
   que dependa de nosotros; lo de fuera de lote, abajo.

   Fuera de lote: el tiempo entre llamadas como ajuste general (pendiente de postventa) y ver y gestionar permisos por
   separado (no entra en esta fase). Cada cosa, con su prueba en rojo; la numeración de DD se mira
   en `origin/main` al empezar y otra vez antes de subir.

   **Lo «sin verificar» de zoom al 200 % y RTL, cerrado:** DD-53 fija 1024 de ancho mínimo (el 200 % a 1440 son 720) y
   la app no tiene idiomas RTL (es, en, fr, pt).
1. **Pendiente de Rafa:** dijo «tanto para Agents como groups»; se hicieron grupos y usuarios (las
   dos entidades del teardown). Si se refería a la lista real de `/admin/agentes`, es una tercera
   con el mismo molde.
2. **Cuando Rafa diga «lanza el script de huérfanos»**, ya habrá hecho tres cosas: publicar Smart-Contact-Icons
   desmarcando los 21 sets `Icon…` de Playground (son de otra sesión), aceptar la actualización en el Design System y
   arrastrar `dashboard` y `neurology` a Playground. Entonces sigue el `LEEME.md` de
   `~/Documents/Claude/2026-09 iconos-material/huerfanos/`: 13 `dashboard`, 8 `brain` → `neurology`, y `query_stats`
   y `graph_5` a 14 × 14. El script para solo si la actualización no está aceptada.
3. **Rescatar a `main` por PRs separados** (la rama no se funde). Medido el 2026-09-20 contra
   `origin/main`, de los cinco puntos **solo queda uno**:
   - ~~iconos opsz 24 con su spec~~ · ya estaban en `main` antes de mirarlo;
   - `list-page`: el ancho mínimo con columnas ocultas NO estaba en `main` (medido el 2026-09-24; entra con el PR
     de listas de las tablas). Exportar solo la selección tampoco, y se decidió no hacerlo: exportar baja todo;
   - ~~`sc-bulk-edit-menu matchable`~~ y ~~`sc-select editable`~~ · entraron en **#218**, junto con
     `sc-section-card showHeader` y `sc-drawer width/topOffset`;
   - **las pantallas y el copy** — ya no aplica: la ficha de grupo (DD-121) y las de agente y usuario (DD-122) no
     salen de `comparar/fichas`, que queda de referencia. Son ~3.700 líneas en ~43 ficheros, más 932 de
     textos. El andamio de `admin/comparar/` (12 ficheros, 1.088 líneas: la barra `?variante=`,
     la guía «Qué mirar», el scroll-spy) **no se funde: se tira** cuando haya decisión.
   ⚠️ Antes de rescatar nada más, compruébalo contra `origin/main`: dos de los cinco puntos ya
   estaban hechos y el hand-off no se había enterado.
4. Probar con scroll real el scroll-spy de «Una página»: al hacer scroll por código no cambiaba la sección activa.

## ⏸️ ESPERANDO — no preguntar

- **Producto:** validar en producción el índice único y las tres fichas en su molde (DD-122), con el antes y después.
  La forma de agente y usuario ya está decidida: el índice lateral (las variantes de `comparar/fichas` quedan de
  referencia).
- **Devs:** el resto de preguntas abiertas de DD-121: el destino del desbordamiento, el script de Web Chat, WhatsApp por
  agente y qué ve el cliente en cola si se toca un grupo activo. «Audio saliente» y los campos de Email los respondió la
  revisión del 2026-10-15 (DD-206).
- **Rafa:** revisar usuarios contra el Supervisor real. Y en el portátil: poner el 4405 al día con `main` y borrar el
  worktree y la rama `codex/supervisor-f-listado` (`f90f7187`, una copia de F), la local y la del remoto; desde la
  nube no se puede.

**Trampas del frente:**
- Los iconos añaden su glifo a `textContent`; el lector no lo oye. `toHaveText` debe distinguirlo.
- Un inputnumber con sufijo lo antepone a su descripción accesible. En cloud root, simula bloqueo de Git con
  `.git/config.lock`, no chmod.
- **La captura no ve un cambio en gris claro sobre blanco** (`maxDiffPixels: 20` y el umbral de color por defecto): un
  borde o un fondo claro que cambia lleva una prueba medida, no basta con que se mueva la captura (Textarea, Skeleton).
- **Una sonda que no enrojece con el fallo puesto no es evidencia:** la de divider medía un host `display: contents`.
- **PrimeNG 22.1, Listbox:** su `aria-activedescendant` no se rellena nunca (un `computed` que lee primero `focused`,
  que no es señal), y Tab desde la lista se queda en un `span` invisible si no hay buscador. Los dos, arreglados en
  `list-page` (DD-162): mírelos ahí antes de usar otro Listbox con teclado.
- **El botón `secondary` de texto del DS mide 2,58:1 en claro** (slate-400): por debajo de AA para texto. Para una acción
  de texto que se lee, `primary` de texto.
- **vitest del DS:** jsdom no trae `matchMedia` y el panel de PrimeNG lo pide al abrirse; `ngModel` escribe el valor un
  ciclo después (`whenStable`). Y un `git stash`/`pop` toca la fecha del DS: el hook de `dist/` pide reconstruir.
- Un NG2012 que persiste después de reparar sintaxis puede exigir reiniciar `ng serve`.

- **Una prueba de «al bajar» necesita recorrido:** con el contenido arriba (DD-170), agente y usuario a 1366×768 solo
  bajan 43 px y la prueba no mediría nada; se miden a 1366×660. Mira el recorrido antes de fiarte de un verde así.
- ⚠️ **Una consulta de contenedor no suma especificidad.** Una regla dentro de `@container` que va antes que la regla
  base del mismo selector pierde. La franja siguió a 244 px hasta ponerla detrás.
- ⚠️ **Una `subgrid` con su propio `gap` desplaza sus elementos la mitad de la diferencia con el de fuera.** Con
  `column-gap: normal` lo hereda; aquí eran 3 px de más.
- ⚠️ **Un `href="#id"` suelto se resuelve contra `<base href="/">`.** El enlace de un salto lleva la ruta de la ficha y
  su ancla (`jumpHref`).
- ⚠️ **Una sonda por `requestAnimationFrame` puede leer la cifra del fotograma anterior**, según el orden de los
  callbacks. Para comparar cifra y arco hay que usar un `MutationObserver` en el instante del cambio.
- ⚠️ `p-drawer` escucha Escape en su contenedor y llama a `hide(false)` aunque `closeOnEscape` esté apagado: quita la
  máscara y deja el panel abierto. El panel rápido corta Escape en su propio `(keydown)`.
- ⚠️ `p-table` reordena en el cliente por el valor crudo del campo ENCIMA del orden que recibe. Con `externalSort`
  (que `sc-list-page` enciende si hay `sortFn`), toda columna ordenable tiene que estar en ese `sortFn`.
- ⚠️ El carril de Contact Center (`.page__rail`) es fijo y NO tiene scroll: lo que se le cuelgue bajo el índice se corta
  en un portátil. Por eso el resumen de las fichas vive en su columna; `ficha-grupo.spec.ts` lo vigila a 1366×660.
- ⚠️ Pulsar un `sc-select` por el centro de su caja: con ayuda o error debajo, el centro cae en el hueco entre el
  control y el texto, y no abre nada (extensión del agente: 33 px de control, 7 de hueco y 35 de ayuda). Desde el
  2026-09-28 `pickSelectOption` pulsa el control.
- ⚠️ Medir anchos antes de que cargue la fuente de iconos: con `font-display: block` el glifo no se ve pero ocupa el
  ancho de su nombre («group_add») con la letra de reserva, y «Asignar» mide 146 px en su celda de 120. Antes de medir,
  `document.fonts.load(…)` y `document.fonts.ready`.
- ⚠️ Un Ctrl+clic que espera a que el navegador cree la pestaña (`context.waitForEvent('page')`) no es fiable en el
  runner del CI: 6 fallos en 203 vueltas (medido el 2026-09-29), ninguno en local. Es una carrera entre Playwright y
  Chromium, vista en el protocolo: si la pestaña empieza a cargar antes de que Playwright active `Page` en ella, no
  llega el `Page.frameNavigated` de su primera navegación, y Playwright no entrega la pestaña o la entrega en
  `about:blank`. La app sí la abría. `indice-enlaces` comprueba la parte de la app (el clic llega al enlace sin
  cancelar; rojo 3 de 3 con el índice cancelándolo) y abre la otra con `context.newPage()`: 0 de 240 en el CI.
- ⚠️ Las opciones de un overlay nativo están en el DOM, con sus atributos, antes de tener caja: `p-motion` las monta con
  `display: none` y no lo quita hasta dos fotogramas después (`nextFrame()`), y `disableAnimations` no lo tapa porque
  no es una animación. Un clic con `force` no espera a la caja y falla en el acto («Element is not visible»; con los
  fotogramas retrasados, 5 de 5). Antes de un clic forzado, `toBeVisible()` (lo hacía `column-selector-order.spec.ts`, borrada en #325).
- ⚠️ Un commit del robot `visual-baselines` sobre un PR ya abierto deja su CI sin jobs (en #325, una ejecución
  «failure» con 0 jobs): hay que aprobarla o subir el siguiente commit. Si un cambio mueve una captura de sc-docs,
  lanza el workflow sobre la rama ANTES de abrir el PR; desde el 2026-10-04 el preflight avisa al final de cuáles.
- ⚠️ Una pila de PRs choca con `main` en movimiento: el preflight exige llevar el `main` del momento, y cada commit
  ajeno obliga a rebasar la pila entera. Solo se apila lo que depende de lo anterior; lo independiente va contra `main`.
- ⚠️ `p-table` con ajustar Y reordenar columnas: si el texto de la cabecera va suelto en el `th`, nunca arrastra
  (la directiva ve el tirador de ancho dentro de lo pulsado). Por eso `sc-datatable` envuelve el texto.
- ⚠️ La tabla ajustable nativa pone `overflow: hidden` en cada celda: rompe un panel anclado DENTRO de la celda
  (Etiquetas). Por eso solo se enciende en las listas con selector de columnas.
- ⚠️ El guardián de Bash ve un preflight vivo de OTRA caja como tuyo (la línea de comandos usa ruta relativa); mira su
  `cwd` con `lsof -a -p <pid> -d cwd` y, si es ajeno, `# sc:ok`.
- ⚠️ El botón de solo icono mide 31,5 de ancho por 32,5 de alto: el token del Kit para su ancho es 1px menor que su
  alto. No es de esta tanda.
- ⚠️ `document.fonts.check()` da `true` con una familia que no existe. Para saber si la fuente de iconos cargó, mira
  `[...document.fonts]` con su nombre y `status === 'loaded'`.
- ⚠️ La opción apagada de `sc-select` (Skills) lleva `data-p-disabled` pero no `aria-disabled`: PrimeNG no la anuncia.
- ⚠️ Un formulario sucio deja colgado el `beforeunload` tras el HMR: navega con `handleBeforeUnload: accept`.
- ⚠️ El preflight no arranca si la memoria compartida pasa de tope (ficha >250 palabras o índice >1.000); lo mide
  `scripts/memory-shape.mjs`.
- ⚠️ En Figma, `importComponentByKeyAsync` se cuelga más de 200 s: usa un nodo remoto que ya esté en el fichero.
- ⚠️ `withViewTransitions` abre una transición en TODA navegación, también si solo cambia la query: sin saltarla
  (`onlyQueryChanged`, en `app.config.ts`) cada clic del índice fundía la página. En e2e no se ve porque
  `disableAnimations` apaga los pseudo-elementos: la prueba envuelve `document.startViewTransition`.
- ⚠️ En el alta de grupo, en cuanto el grupo existe su nombre ya está cogido (por él mismo) y la puerta de General se
  cierra: lo que dependa de la sección abierta al crear se lee ANTES de `addGroup`.
- ⚠️ Con dos `page.goto`, Atrás cruza de documento y el router no se entera: la prueba de un guardián con Atrás llega
  a la ficha navegando dentro de la app. El aviso de descartar es un `alertdialog`.
- ⚠️ Un `input()` de página enlazado a la query recibe el valor nuevo un microtask después de navegar, y lo que falta
  llega como `undefined`: no lo leas en un efecto que recarga el formulario, o cada clic del índice borra lo editado.
- ⚠️ La ficha de usuario ya tenía un `sectionTree` (el árbol de Acceso): el ayudante de enlaces se llama `sectionUrl`
  en las cuatro páginas.
- ⚠️ En claro, el tinte de marca del resumen y «seleccionado» son el mismo color: una tarjeta del resumen no se puede
  hacer pulsable sin cambiar de superficie (cuenta para G, el resumen enlazado).
- ⚠️ `--sc-text-secondary` llega a AA solo sobre blanco (4,52:1); sobre cualquier fondo teñido baja, y
  `theme-contrast` lo perdona solo sobre sus dos fondos.
- ⚠️ Chrome serializa un color con alfa como `color(srgb r g b / a)`, de 0 a 1: una sonda que lo lea con `/\d+/` saca
  negro. Usa `e2e/shared/color.ts`, que compone las capas.
- ⚠️ Leer un estilo computado dentro de la detección de cambios hacía nacer lleno el anillo del resumen: la directiva
  de la cifra lee su duración en el primer fotograma.
- ⚠️ La lista virtual de PrimeNG (`p-scroller`) cuenta las filas que le caben al nacer y después solo al cambiar la
  VENTANA (`onWindowResize`). Si nace en una caja que aún mide 0 —la tarjeta del listado se estira con un `:has()`
  que puede llegar un fotograma tarde—, se queda sin filas. Con «reducir movimiento» pasaba siempre en Agentes.
  `sc-datatable` observa la caja de la lista y le pasa cada cambio por esa misma puerta.
- ⚠️ `preflight:scope -- --run` reconstruye el DS en `dist/`, y un `ng serve` abierto a la vez pierde
  `@smartcontact-hub/components` (sale el `vite-error-overlay`). No midas con el servidor mientras corre el preflight,
  y reinícialo al acabar.
- ⚠️ `pages.dev` no responde desde el contenedor (el proxy no deja llegar): el despliegue de un PR se comprueba por su
  check de Cloudflare y por el comentario del bot, que da la URL fija de cada commit.
- ⚠️ Los JSON de i18n guardan escapes ` `, y un `JSON.parse` + `JSON.stringify` los cambia por el carácter en
  todo el fichero: se editan línea a línea.
- ⚠️ La sonda de recorte de un desplegable solo vale si la has visto enrojecer: el rojo de la prueba nueva venía de la
  opción que no existía. Con el ancho de antes puesto, enrojece en el de Teléfono de Contact Center.
- ⚠️ El texto de un rótulo con su «*» empieza por un espacio («␠Teléfono saliente *»): `getByText` con una expresión
  regular no lo recorta, así que `^Teléfono` no casa. Mídelo antes de anclar.
- ⚠️ La prueba de «Siguiente lleva arriba» solo vale donde la sección nueva no cabe: si cabe, el navegador sube solo
  y la prueba pasa sin el `scrollTo`. A 1280×720, de General a Distribución y colas del grupo, sí enrojece (88).
- ⚠️ En una sonda, el menú lateral se despliega al pasar el ratón y tapa el índice: aparta el ratón (`mouse.move`)
  antes de pulsar, y espera a que se pliegue antes de ralentizar las animaciones.
- ⚠️ Las unitarias del DS corren en jsdom, sin `getAnimations`: ahí no se ve un movimiento, solo la clase que lo
  enciende. El movimiento se mide en el navegador, con la reproducción al 10 % (CDP `Animation.setPlaybackRate`).
- ⚠️ Un elemento `sticky` no sale del área de su rejilla: para que el nombre se quede fijo al bajar (G2), la cabecera
  tiene que ocupar las dos filas o vivir con el contenido en una columna propia.
- ⚠️ Una medida de la rejilla sin `document.fonts.ready` sale con un píxel de más: la fuente de iconos aún no ha
  cargado y las filas del índice miden otra cosa.
- ⚠️ `checkVisibility()` da por visible un `.visually-hidden` (esconde con `clip`), y su texto, sin saltos en una caja
  de 1 px, cae sobre lo de al lado: una sonda que mida texto lo salta aparte (`icon-glyph-scale`, desde DD-144).
- ⚠️ Una copia visual de algo que las pruebas buscan por su texto o su clase choca en modo estricto (cuatro rojas al
  duplicar la cabecera): píntala con `::before` y `attr()`, y con clases propias.
- ⚠️ Un job de e2e que tarda el triple no tiene por qué estar colgado: su paso instala chromium con `apt` (en #305,
  18 minutos antes de la primera prueba) y su log no se lee hasta que acaba. Cancelarlo por el reloj tiró una tanda
  que iba 92 de 92 en verde; espera a que termine.
- ⚠️ El número de una DD se mira en `origin/main` al escribirla y otra vez antes de subir: este lote escribió DD-155
  mientras #320 fundía la suya con ese número, y la del lote pasó a DD-156 al rebasar (2026-10-04). Un PR abierto de
  otra sesión no basta: su número solo se ve si ya lo ha publicado.
- ⚠️ `p-table`, cuando la página en curso se queda fuera, solo retrocede UNA: con un filtro que vive fuera de la tabla
  (un buscador encima), buscar desde la página ≥3 la deja en blanco. La tabla lleva `[(first)]` y un `linkedSignal`
  que lo vuelve a 0 con cada búsqueda (`agent-channel-table`, `agenda-contacts-table`).
- ⚠️ En una caja flex con `gap`, todo hijo suma: un emergente de alto 0 (el `p-menu` de fila) añade el hueco (el editor
  de agendas desplazaba 14 px), y el margen de un párrafo no colapsa, se suma (las líneas de lectura de sc-docs, a 28).
- ⚠️ Si todas las columnas de una `sc-datatable` llevan ancho fijo, la tabla reparte el sobrante también a la casilla
  de selección (105 px en Agendas): una columna, la del nombre, se queda sin ancho.
- ⚠️ El `sc-badge` del DS es un aviso (8,75 px en md; 10,5 en lg): una cifra que se lee va en texto de leyenda.
- ⚠️ `Intl.NumberFormat('es')` no separa los miles de cuatro cifras («1250», «5000»; «12.500» sí): no esperes «1.250»
  en una prueba.
- ⚠️ El Supervisor y sc-docs leen el DS de `dist/`: tras tocar el DS, `npx ng build ui-smartcontact`, y toca un fichero
  de `src` o rearranca el `ng serve`; si no, sigue con el DS de antes (en sc-docs, medido: hubo que rearrancarlo).
- ⚠️ En una e2e de sc-docs, `page.goto` a otro `#/components/…` solo cambia el hash, y la página anterior sigue montada
  hasta que llega la nueva: una espera a algo que tienen las dos pasa en la vieja. Una página por prueba.
- ⚠️ El lienzo de sc-docs es una fila flex: un componente que pide el 100% de su contenedor, suelto, mide 0; va en una
  `.col`. Y al medir, un host con `display: contents` (`sc-divider`) mide 0 siempre: mide su primer hijo.
