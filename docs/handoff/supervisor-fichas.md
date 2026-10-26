# Frente · Fichas de administración (agente, grupo, usuario) y Configuración del AED — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.
>
> Nace el 2026-09-16. El tramo anterior (las tres formas de ficha, 2026-09-15) vive en `design-system.md`.
> El tramo del 2026-09-23 (grupos sin foto, alta en diálogo) sale de aquí por el tope de 6: `git show
> 31f48268:docs/handoff/supervisor-fichas.md` o el tag `archive/handoff-fichas-2026-09-27`. Su trampa (`main`
> se mueve bajo un worktree local) ya vive en LEARNINGS #21. El del 2026-09-24 (el alta de grupo rima con
> Identidad, DD-119) sale por el mismo tope: `git show 47b84e02:docs/handoff/supervisor-fichas.md`. Y el de las
tablas tras la revisión del equipo (2026-09-24, cinco PRs): `git show 96b3e407:docs/handoff/supervisor-fichas.md`;
sus dos trampas suben a «Trampas del frente». El de la visión de producto de grupos (2026-09-26, DD-121) sale por el
mismo tope: `git show 23ff8413:docs/handoff/supervisor-fichas.md`; sus trampas de `p-drawer`, `p-table` y el carril de
Contact Center suben a «Trampas del frente». El de un solo índice (2026-09-27, DD-122), igual: `git show
7458351:docs/handoff/supervisor-fichas.md`; sus trampas también suben. Y el del resumen como widget (2026-09-27,
DD-126): `git show bbac5030:docs/handoff/supervisor-fichas.md`, con sus trampas arriba. Y los dos del 2026-09-27
(el «Eliminar» a AA, DD-128, y el pase de diseño, DD-130): `git show 2b88796b:docs/handoff/supervisor-fichas.md`; las
cuatro trampas del pase suben a «Trampas del frente». Y el de la revisión de producto del 2026-10-01 (H, los diálogos de
Recursos, D1, D2, R, G1, G2a y G2b): `git show 98c8dee1:docs/handoff/supervisor-fichas.md`; sus trampas suben a
«Trampas del frente». Los del 2026-09-28 y del 2026-09-29: `git show 52159b90:…` y `git show d496ac74:…`. El de E2
(DD-149, sin trampas propias): `git show a7bca7c0:docs/handoff/supervisor-fichas.md`. El de E3 (DD-150, tampoco):
`git show 2b2674ed:docs/handoff/supervisor-fichas.md`. El de E4 (DD-151, tampoco): `git show 3d75da8f:…`. El de D3
(DD-152, tampoco): `git show f0452c1a:docs/handoff/supervisor-fichas.md`. El de F (DD-153, tampoco): `git show
2d0e2d9a:docs/handoff/supervisor-fichas.md`; el de E1b, `git show c90780cd:docs/handoff/supervisor-fichas.md`. El de lo que dejó F
(DD-156, la lista virtual con «reducir movimiento»): `git show d21a8c03:docs/handoff/supervisor-fichas.md`. Y el de la
revisión de producto del 2026-10-04 (DD-157 a DD-162, #325, sin trampas propias): `git show
d95c0f6f:docs/handoff/supervisor-fichas.md`. El de Recursos (DD-163 a DD-167, #327, sin trampas propias):
`git show 74f3ab14:docs/handoff/supervisor-fichas.md`. Y el de sc-docs y el peso de los iconos (#330, sin
trampas propias): `git show 4c777dd0:docs/handoff/supervisor-fichas.md`. El de Accesibilidad pendiente (#332, sin DD nueva ni trampas
propias): `git show e636c143:docs/handoff/supervisor-fichas.md``. El de supervisión y limpieza (2026-10-05, DD-168, #333, sin trampas propias): `git show
4deb46f9:docs/handoff/supervisor-fichas.md`. El de las tres columnas sin cabecera (2026-10-05, DD-170, #337): `git show
86ac19bf:docs/handoff/supervisor-fichas.md`. El de Tipificaciones (2026-10-05, DD-173, DD-174 y DD-177, #340): `git show
5ca7133d:docs/handoff/supervisor-fichas.md`. El del pulido de las fichas (2026-10-06, DD-176, #341): `git show
a3c77efc:docs/handoff/supervisor-fichas.md`. El de Repositorios en tarjetas (2026-10-06, DD-179, #347): `git show
dedbc7d6:docs/handoff/supervisor-fichas.md`. El de ordenar por cualquier columna (2026-10-06, DD-180 y DD-181): `git show
d22cdafa:docs/handoff/supervisor-fichas.md`. El de las cuatro secciones en el mismo árbol (2026-10-06, DD-182, sin
trampas propias): `git show 03c7fb78:docs/handoff/supervisor-fichas.md`. El de la segunda vuelta de grupos
(2026-10-07, DD-185, #355, sin trampas propias): `git show dedbc7d6:docs/handoff/supervisor-fichas.md`. Y el de la
baldosa y la fila del resumen al DS (2026-10-07, DD-186, #356, sin trampas propias): `git show
d22cdafa:docs/handoff/supervisor-fichas.md`. El de la revisión de agentes y tipificaciones (2026-10-09, DD-187,
#360, sin trampas propias): `git show a35419972b9fcbd0cec596d8f975690b55611bb9:docs/handoff/supervisor-fichas.md`.
El de lo que se decide de la auditoría de PrimeNG (2026-10-11, DD-195, sin trampas propias): `git show
3b9cd31a:docs/handoff/supervisor-fichas.md`. El de los quick-wins de la auditoría UX con la columna Nivel (2026-10-12,
#375) y el de Salientes como etiqueta y botón (2026-10-13, superado por DD-204 y DD-209), sin trampas propias: `git show
e3a6c4b1:docs/handoff/supervisor-fichas.md`. El de lo que falta se dice cuando ya hubo ocasión (2026-10-13, DD-199, sin
trampas propias): `git show b23f6b5f:docs/handoff/supervisor-fichas.md`. El de fuera las notas de decisión (2026-10-13, DD-187
§9, sin trampas propias), con los punteros a DD-183 y DD-184: `git show 8d0d82c1:docs/handoff/supervisor-fichas.md`.
El de la revisión de las fichas a 1440 (2026-10-14, DD-204): `git show 62244684:docs/handoff/supervisor-fichas.md`;
su trampa del suelo de la tarjeta sube a «Trampas del frente». El de la ficha de grupo tras la revisión del 2026-10-15
(DD-206, #416): `git show a3c0f25a:docs/handoff/supervisor-fichas.md`; sus dos trampas suben a «Trampas del frente».
El de la ficha de agente con salientes en un desplegable (2026-10-15, DD-209, #425, sin trampas propias): `git show
6edc21e9:docs/handoff/supervisor-fichas.md`. El de la revisión de producto de las tablas
y Repositorios (2026-10-15, DD-210, #426, sin trampas propias): `git show 840fe501:docs/handoff/supervisor-fichas.md`.
El de la revisión de producto del 2026-10-16 (DD-211): `git show bacaf233:docs/handoff/supervisor-fichas.md`; su trampa
sube a «Trampas del frente».
El de «Agentes» sin fijar y el tooltip del Kit (2026-10-19, DD-212, #456 y #462): `git show
e88a52f7:docs/handoff/supervisor-fichas.md`; sus trampas suben a «Trampas del frente».
El de Grupos y agentes en Figma para desarrollo (2026-10-18 y 19: los ids de cada página y de «Fuera del DS», «Hand-off»
y «Mapa de componentes») y el del relleno de la tabla (2026-10-19, DD-214): `git show
8c9297a7:docs/handoff/supervisor-fichas.md`; la trampa del primero sube a «Trampas del frente».
El del mapa de componentes de Grupos y la tabla única del DS (2026-10-19, #457): `git show
34f18f37:docs/handoff/supervisor-fichas.md`; sus trampas suben a «Trampas del frente».
El de Grupos y Agentes como en Figma, sin edición masiva (2026-10-19, DD-215, sin trampas propias): `git show
archive/handoff-fichas-2026-10-21:docs/handoff/supervisor-fichas.md`.
El de lo que falta al pulsar Crear, grupos sin canales y Recursos en chips (2026-10-20, DD-217, sin trampas propias):
`git show b703321f:docs/handoff/supervisor-fichas.md`.
El de Grupos como sus páginas de COA: cifra a la ficha, duplicar a un alta y eliminar varios (2026-10-20, DD-218, sin
trampas propias): `git show fa98b4bf:docs/handoff/supervisor-fichas.md`.
El de lo que falta como SISMAC-4058: el botón apagado, «Falta: …» en el resumen y el aviso en gris (2026-10-21,
DD-219, sin trampas propias): `git show fdf913d4:docs/handoff/supervisor-fichas.md`.

El del índice en la caja gris de Contact Center, con su interruptor para volver al plano (2026-10-21, DD-220 y DD-221, sin
trampas propias): `git show archive/handoff-fichas-2026-10-26:docs/handoff/supervisor-fichas.md`.

El de marcar una casilla de Grupos o Agentes sin acortar la tabla (2026-10-21, fallo de DD-215, sin trampas propias): `git show 5a04de14:docs/handoff/supervisor-fichas.md`.
El de la ficha de grupo como la versión 17 de su página de COA (2026-10-22, DD-223, sin trampas propias): `git show
5374bb7a:docs/handoff/supervisor-fichas.md`.

## ✅ 2026-10-26 · Duplicar tipificaciones y equipos abre un alta rellena (DD-231)
> **Sello:** rama `claude/duplicate-typifications-teams-920106` sobre `main` `aaa8e0fd`.
- **Código**: `?seedFromId` en `tipificacion-ficha-page` y `equipo-editor-page`; Equipos usa `duplicateAsCreate` (nuevo en
  `RepoPageConfig`). Prueba: `duplicar-tipificaciones-equipos.spec.ts`.
- **Figma**: pasos 12 y 13 al final de los listados de Tipificaciones y Equipos (`3935:8821`, `3935:29304`), sin renumerar.

## ✅ 2026-10-26 · Agendas y Plantillas como sus COA: solo a agentes, en una tabla con sus grupos (DD-230)

> **Sello:** rama `areses/plantillas-agendas-feedback-b6bf8f` sobre `main` HEAD `5a04de14`.

- **`sc-agent-assignment-table`** (nuevo) sustituye al árbol de agendas y al multiselect de plantillas: casilla, nombre,
  email y grupos; la cabecera marca los visibles y lo oculto por el filtro se conserva. Guarda en `Agent.schedules` /
  `Agent.templates`; `Group.*` no se toca. Fuera `agenda-asignacion.core.mjs`.
- **Listados**: Agendas con Descripción y Agentes (cifra, «—» en 0), todo ordenable (`sortable` + `sortFn` en `RepoListPage`);
  Plantillas sin pestañas, con columna Canal. Contactos con casillas y borrado múltiple (confirmación simple, como Reglas).
- **Para Rafa, en el COA**: sumar «Duplicar», las pestañas como columna Canal, y Crear siempre activo (DD-217). **Trampa**: en el e2e, Nombre es un `th` (`rowHeader`): el `td` de «Agentes» es el 3, no el 4. **Pendiente de producto**: la
  ficha de grupo sigue asignando Agendas y Plantillas al grupo (Recursos).

## ✅ 2026-10-26 · Eliminar varios en todas las tablas, sin barra de lote, y las congeladas al día (DD-227)

> **Sello:** rama `areses/multiple-delete-ux-discussion-6ecde6` sobre `main` `9a90d5bd`.

- **Tablas**: clic derecho sobre una marcada → «Eliminar» (`selectionMenu`) en Usuarios, Etiquetas, Plantillas,
  Repositorios, Tipificaciones, Categorías y Reglas. Fuera la barra de lote de esas cinco (la edición masiva no se entregó);
  su código (`bulkEntity`, `requestDeleteSelection`, edición de Usuarios) queda aparcado. Conversaciones conserva la suya.
- **«⋮»**: con la fila entre varias marcadas abre el menú de la selección, «Eliminar (N)» (`common.delete_count`), como el clic derecho.

## ✅ 2026-10-23 · Agentes como sus borradores de COA, 4060 y 4062 (DD-225)

> **Sello:** rama `areses/distracted-mclaren-9c96d2` sobre `main` `a0820c6b`, un PR (#511, fundido como `8f2056b7`).
> La congelada 4062 avanzó a ese commit el mismo día, y luego a `a01e13e6` (#513, DD-226). Los borradores, las
> decisiones y lo que falta en Figma viven fuera del repo (`~/Documents/Claude/2026-10 Agentes COA/`, su LÉEME).

- **Listado**: borrar varios con el clic derecho (`selectionMenu`, `onBulkDelete`); Teléfono y Estado de inicio
  (`sc-agents-columns-v6`); Estado ordena por `PRESENCE_SORT_RANK`; «Grupos» de mayor a menor (`defaultSortOrder`);
  Canales en el Excel.
- **Estado «Conversación»** (Dashboard: «En pausa»), agente 17; una lista guardada no lo trae (versión sin subir). Color
  por familia: Administrativo marrón; Post-conversando, azul sin borde (DD-226). A 1440 desplaza de lado (226 px).
- **Ficha**: duplicar no copia foto, móvil ni estado, y todo agente nace «Desconectado»; solo extensiones libres
  (`extensionOptions`); email repetido en vivo (`agents.errors.email_taken`); tabla de grupos vacía con su motivo
  (`vacio`); índice del alta con marcadores (`sectionStates`, `faltasPorSeccion`, `OBLIGATORIOS_DE`) y sin «Falta: …»
  sobre el resumen; «Deshacer» llama a `alta.reiniciar()`; salientes solo con `CLIENTE_CON_CALL_BLENDING`; singular del
  aviso de quitar canales (`removeBodyKey`).
- **Pruebas**: `agentes-como-coa-4060-4062.spec.ts` nueva; al día las que fijaban el ✓ suelto y «Falta: …».
- **Fuera**: Contact Center › Servicio pinta Administrativo con `warn`, no en marrón como la columna Estado.

## ✅ 2026-10-22 · Repaso de Grupos entre COA, Figma y prototipo; «Editar en Repositorios» pregunta guardar (DD-224)

> **Sello:** rama `areses/repaso-grupos-coa-figma` sobre `main` `fa98b4bf`, un PR (#507, fundido como `88d2e3e7`). La
> congelada 4058 avanzó a ese commit el mismo día. COA, publicado el mismo día con todo el repaso: la 4056 en la v13 y
> la 4058 en la v19, con su tabla de contenidos, las anclas «Indice», «Mensajes» y «Resumen», y la fila 0.2 en el
> control de versiones. El 2026-10-23, la 4058 sumó capturas (v20, 19 imágenes, fila 0.3) y las dos retocaron el texto
> de esas filas: hoy, **4056 v14 y 4058 v21**.

- **Repaso**: COA 4058 (v17) y 4056 (v11) frase a frase contra la congelada 4058 (ya con DD-223) y contra el texto de
  las hojas de Figma de Grupos. Prototipo y Figma cuadraban salvo cinco retoques de texto, hechos con DD-224 (`figma-pendiente` §62); las
  correcciones de COA, ya publicadas, y el prompt que las aplicó viven fuera del repo (`~/Documents/Claude/2026-10 Grupos COA/`).
- **«Editar en Repositorios»** del detalle de la tipificación, con cambios, pregunta «¿Guardar los cambios?» como
  «Gestionar en Repositorios»: `sc-tipificacion-arbol` emite `editar` y la ficha decide (`salirARepositorios`).
- **«Solo salientes» con Call Blending**: ya lo decía DD-211 §9; desde la v19, también la 4058 de COA.
- **Capturas de la 4058** (2026-10-23): 14 nuevas, bajo las reglas que no tenían imagen, en
  `~/Documents/Claude/2026-10 Grupos COA/Capturas 4058/`; fuera las dos repetidas, y la de «Sin canales», cambiada por
  una de la congelada (G14). La extensión no lee archivos del Mac: se suben a los adjuntos de la página y las coloca
  desde ahí.

## SIGUIENTE — sin preguntar

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
- **Decisión de diseño:** llevar o no al DS oficial lo que la copia arregló (el borde de 1 de los botones de texto, el
  tooltip con máximo y la celda de selección small; `figma-pendiente` §53). No bloquea las maquetas.
- **Decisión de diseño:** las 4 fichas que quedan en «Fuera del DS» (aviso, campos numéricos, subsección plegada y lo
  no dibujado: atajo «/» y solo lectura), con sus alternativas en `figma-pendiente` §54.
- **Próxima publicación del DS:** decidir si la tabla «(sin slots)» se oculta de la librería (`_` delante). El
  «Update all» en el Supervisor ya está aplicado (2026-10-20).
- **Rafa:** revisar usuarios contra el Supervisor real. Y en el portátil: poner el 4405 al día con `main` y borrar el
  worktree y la rama `codex/supervisor-f-listado` (`aff63656`, una copia de F), la local y la del remoto; desde la
  nube no se puede.

**Trampas del frente:**
- **La copia del DS con la tabla en slots** (`C5soC7CxcuKSIFPEDCd3gz`, sección `16862:6447`) se quedó con un
  placeholder del buscador anterior a `main`; lo que manda es el listado del Supervisor (`3118:16995`).
- **Maestros de Figma con slots:** un marco de documentación a HUG estira las variantes FILL y cambia el maestro; en
  otro fichero, se busca por la clave del maestro. Cambiar de variante la pieza de fuera rehace las de dentro (ve de
  dentro afuera) y a un resumen le borra los datos; una propiedad no. «El Aura» son dos: el de PrimeNG 22 sin escalar
  (8 × 14) y el de los devs (10,5 × 14).
- **`p-treetable-checkbox` repinta con `selectionSource$`, no al cambiar `[selectionKeys]`**: un mapa nuevo desde fuera no
  repinta las casillas (por eso el árbol de agendas pinta las suyas). Un toast en la pila de capas de PrimeNG
  (`autoZIndex`) le quita el Esc a un `p-dialog` abierto. En la nube, reinicia el `ng serve` de :4405 por su pid antes
  de fiarte de un e2e (`lsof -nP -iTCP:4405 -sTCP:LISTEN`; un `pkill -f` con el patrón en la orden se mata a sí mismo).
- **En el panel del navegador oculto el router se queda en blanco**: mide con Playwright. Un ratón en (2, 2) abre el
  sidebar y tapa Nombre. `sc-docs-a11y` medía la ficha anterior con el nombre de la siguiente (ya espera) (DD-212).
- **El rojo de una ficha se decide en un sitio** (DD-217): `ocasionDeAvisar` apunta lo que faltaba al pulsar
  (`intentar`) y lo calla al guardar o deshacer (`olvidar`). Un aviso nuevo pasa por `ocasion.acusa(falta)` y entra en
  `avisos` con su sección, su texto y su ancla, o el índice no lo dice y el salto no llega.
- **`p-select` no acepta que le cambies el valor dentro de su propio `onChange`**: para devolverlo (Ring All a 2) hace
  falta `setTimeout(() => select.value.set(2))`. Y un `ng serve` que pilla `dist/` a medio construir se queda en error
  aunque el build acabe: reinícialo.
- **`--table-card-tope: none` anula también el suelo** (`min(…, none)` no vale y cae en `auto`): quien ponga el tope
  en `none` debe poner `--table-card-suelo` (DD-204).
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
- ⚠️ Dos rejillas que comparten columnas se pliegan con la MISMA regla (pieza contra ventana discrepan en algún
  tramo, y dos anchos no lo ven). Barrido de 23 vistas de formulario, de 600 a 1920: 8 en producción, 0 con el cambio.
