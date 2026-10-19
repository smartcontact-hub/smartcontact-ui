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
6edc21e9:docs/handoff/supervisor-fichas.md`.

## ✅ 2026-10-19 · Grupos: «Agentes» sin fijar y «—» con 0 agentes; el tooltip del Kit; las tres congeladas, al día con `main`

> **Sello:** #456 (fundido en `6edc21e9`) y la rama `areses/tooltips-y-duplicar` sobre él, otro PR.

- **Grupos** (DD-159): «Agentes» sin candado en «Columnas»; con 0, `sc-group-popover` en `count` pinta «—» y sigue
  siendo el botón que abre el panel (también Servicios con 0). Agentes sin grupos ya salía «—» (DD-210).
- **Tooltip del Kit (DD-212)**: 39 `title` nativos pasan a `pTooltip`, los textos cortados con `showOnEllipsis`;
  `audit:screen-hygiene` regla 9, con Monitor y Conversaciones en su trinquete. Queda `sc-tag` (recorta dentro del `p-tag`).
- **Prioridad**: «Solo para las conversaciones entrantes.». **Duplicar sin Call Blending**, sin el teléfono saliente:
  anotado en `figma-pendiente` §50. Pruebas: `panel-agentes-grupo`, `columnas-en-una-lista`, `tooltips-del-kit`; rojas sin.
- **Trampas**: `sc-docs-a11y` medía la ficha anterior con el nombre de la siguiente (ya espera). En el panel de navegador
  oculto el router se queda en blanco: mide con Playwright. Un ratón en (2, 2) abre el sidebar y tapa Nombre.
- **Congeladas** 4058, 4062 y 4064, a todo lo de `main`: rama y etiqueta avanzan al commit fundido (`docs/PROTOTIPOS.md`).

## ✅ 2026-10-18 y 19 · Grupos y agentes en Figma para desarrollo: listado, altas, ediciones y su hand-off

> **Sello:** sin código. Fichero del Supervisor (`Hjyy41SYKqcRuIzCGggfYH`); en el repo, solo docs (ramas
> `arebury/figma-fichas-orden` sobre `main` `33dd2c90` y `arebury/figma-fichas-numeros` sobre `3f225663`).

- **Dónde está** (2026-10-19): cada página abre con un índice que enlaza sus secciones, a 1920. «Grupos»: índice
  `3124:47747`, «1. Listado de grupos» `3118:16995`, «2. Alta de grupo» `3010:6411`, «3. Edición de grupo» `3055:11053`.
  «Agentes»: índice `3124:47856`, «1. Alta de agente» `3070:26714`, «2. Edición de agente» `3110:31067`. «Fuera del DS»
  (`3034:114`): nueve fichas, dibujo frente a app, de lo que se construye distinto. «Hand-off: Grupos y agentes»
  (`2997:47`): qué cambia (DD-211), lo contratado, cómo leer y reglas comunes; a su lado, «Mapa de componentes»
  (`3149:191`): los 22 de ui.smart-contact.com (14 tal cual, 5 extendidos, 3 propios) y lo que falta.
- **Listado de grupos, rehecho** (2026-10-19): 7 pasos con flechas en vez de 4 estados: 01 sin casillas, 02 menú de
  fila, 03 diálogo "Duplicar grupo", 04 la copia en edición con el toast `Grupo "{nombre}" creado`, 05 "¿Eliminar
  grupo?", 06 eliminado, 07 búsqueda sin resultados. Fuera la edición masiva (casillas, barra y editar en bloque), a otra
  fase; "Acciones" se queda, solo exporta. En «Cómo se comporta», las filas 10 y 11 son "Duplicar" y "Eliminar".
- **Agentes, igual** (2026-10-19): el listado, sin columna de casillas ni `selectionMode`, en sus tres pantallas (Paso 01
  de Alta `3070:26732`, Paso 01 de Edición `3111:13984` y E4 `3111:31167`). Las casillas de "Asignado" de la tabla de
  grupos de la ficha se quedan: son la asignación, no una selección.
- **Eliminar sin escribir el nombre** (DD-145 lo pedía): confirmdialog del DS (`common.delete_dialog.title_single` y
  `body_single`) en grupos (listado y ficha, sección 3, E5) y agentes (ficha, E3). Sale la ficha "Diálogo de eliminar"
  de «Fuera del DS» y el maestro de `sc-delete-entity-dialog` de `figma-pendiente` §53.
- **Lo que se fue**: las secciones a 1440 (`2934:580`, `2970:4752`); las pantallas sueltas, a Playground (`3124:39080`).
- **Cómo está hecho**: instancias y variables del DS, medidas de sc-supervisor.pages.dev a 1920. Cada pantalla, una nota
  (Dev Mode) con las filas que leer; bajo cada flujo, la hoja «Cómo se comporta» numera cada pieza una vez sin repetir
  lo que enseña Dev Mode, y su número va en un círculo morado sobre la pantalla (marco «Guía» bloqueado; no es de la app).
  Cada índice abre con «Cómo usar estas maquetas». Nativo de PrimeNG tapado por la app (`.sc-toast`): en Figma, el
  nativo, y la diferencia, a «Fuera del DS». Maestros arreglados: «What's new» del DS. Kit: `figma-pendiente` §53 y §50.
- **Pendiente**: marcar «Ready for dev» (a mano: la API no puede); cómo ordenar «❖ DataTable» del DS (`6738:49721`).
  El prototipo sigue con la edición masiva y pide el nombre al eliminar: Figma va por delante.
- **Trampa**: el fichero de la copia del DS con la tabla en slots (`C5soC7CxcuKSIFPEDCd3gz`, sección `16862:6447`) se
  quedó con un placeholder del buscador anterior a `main`; lo que manda es el listado del Supervisor.

## ✅ 2026-10-17 · Los campos y los canales de General, en las mismas columnas a cualquier ancho (DD-170 §6)

> **Sello:** rama `arebury/fix-supervisor-select-alignment` sobre `main` `8d0d82c1`, un PR.

- **Ficha de grupo**: `sc-group-identity-fields` en fila es un `.grid.grid--3` (fuera su `@container` de 720, que en la
  ficha caía entre 1344 y 1404, de 1024 a 1134 y por debajo de 900); en el diálogo de duplicar, `apilada`.
- **`_forms.scss`**: un solo paso a una columna por debajo de 720 para `.grid--2`, `.grid--3` y `.checkbox-grid--3`
  (los canales del agente seguían en tres), y `.field--span-2` sin pista vacía en una columna (email 24,5 de más).
- **Pruebas**: `columnasACadaAncho` (helpers) barre de 1024 a 1914 cada 10 y 700; la usan la de los canales del grupo
  (antes solo 1440 y 1920, fuera del hueco) y una nueva del agente. Rojas contra `main`.
- **Trampa**: dos rejillas que comparten columnas se pliegan con la MISMA regla (pieza contra ventana discrepan en algún
  tramo, y dos anchos no lo ven). Barrido de 23 vistas de formulario, de 600 a 1920: 8 en producción, 0 con el cambio.

## ✅ 2026-10-16 · Revisión de producto: agendas en árbol, la ficha de agente, toasts y un solo Guardar en Contact Center (DD-211)

> **Sello:** rama `arebury/revision-producto-1016` sobre `main` `b23f6b5f`, un PR.

- **Agendas**: «Grupos y agentes» es un árbol (`sc-agenda-assignment-tree`, `p-treetable` nativo, casillas `sc-checkbox`)
  por persona, con grupos enteros dinámicos (en `Group.schedules`) y «Sin grupo». Las reglas, puras y probadas, en
  `agenda-asignacion.core.mjs` (`scripts/__tests__/agenda-asignacion.test.mjs`). El listado, «Grupos y agentes», sacado
  con las mismas funciones que el árbol (`estructuraDe`, `deLoGuardado`, `paraGuardar`): dice lo mismo que el editor,
  también el grupo que sale entero al leer porque sus agentes ya la tenían todos. Fuera `sc-agenda-agents-table`.
- **Agente**: PIN del sistema (`nextPin` en `agents.store.ts`) y de solo lectura al editar; `CLIENTE_CON_WEBRTC` con
  «Navegador» deshabilitado; Agentes y Grupos en el Destino, y lo guardado sin ellos se lee como de fábrica
  (`agenteAlDia`, el `normalize` de `AgentsStore`); fuera «Automático con preview» y «Actualizar teléfono en login»;
  `attendsPhone` oculta lo de las llamadas.
- **DS**: `ScConfirmService.popupClosed`: el globo cerrado sin responder resuelve «no». **Solo lectura** en `sc-inputtext`,
  `sc-inputnumber`, `sc-textarea` y `sc-select` (§10): sin borde, sobre `--sc-bg-default`, anillo de foco con el
  teclado; el select sin flecha (clase propia por `pt.dropdown`), el textarea sin asa; en sc-docs, en sus estados.
- **Grupo**: audio saliente en «Mensajes en cola»; la estrategia del resumen en una línea; canal y nivel juntos.
- **Toasts**: `ResultadoAccionService.contar` (fuera `visto`, `enLaBarra` y `limpiar`, y la zona de la barra);
  `TOAST_DEL_SISTEMA` con el servicio; AGENTS.md §7 reescrita.
- **Altas**: ✓ en toda sección que se deja completa (`seccionesDeAlta` sin `obligatoria`).
- **Contact Center**: `ContactCenterBorradorService` en el armazón, con el guardián en la ruta de Contact Center.
- **sc-docs**: SelectButton con Múltiple, Inválido, Deshabilitado y A todo el ancho. `tools/primeng-doc.mjs` no corre en
  la nube sin acceso a la API de GitHub de primefaces/primeng: se leyó la doc con un clon parcial de
  `apps/showcase/doc/selectbutton`.
- **Figma**: nota 50 de `figma-pendiente.md` (lo que depende de Call Blending, CusCare y WebRTC, anotado y no apagado).
- **Trampas**: `p-treetable-checkbox` refresca su casilla con `selectionSource$` y no al cambiar `[selectionKeys]`: un
  mapa nuevo desde fuera no repinta las casillas; por eso el árbol pinta las suyas. Un toast que entra en la pila de
  capas de PrimeNG (`autoZIndex`) le quita el Esc a un `p-dialog` abierto. Y en la nube, el `ng serve` de :4405 no
  siempre ve un cambio de código (medido: un arreglo de Contact Center no llegó hasta reiniciarlo): reinícialo, por su
  pid, antes de fiarte de un e2e (un `pkill -f` con el patrón en la línea de órdenes se mata a sí mismo, exit 144; sin
  `ss`, el pid lo da `lsof -nP -iTCP:4405 -sTCP:LISTEN`). Un cambio del DS no llega a las apps sin `npm run
  build:components` y reiniciar su `ng serve` (leen `dist/`). Los `*.pages.dev` no se alcanzan desde la nube: para ver
  una prueba en rojo, se quita el arreglo en local.

## ✅ 2026-10-15 · Revisión de producto de las tablas y Repositorios (DD-210)

> **Sello:** PR 3 de 3, fundido en `main` como #426, HEAD `d4f22f0e`, con el PR 2 (#425) ya dentro.

- **Textos**: «+ Nueva X» en la barra y en el vacío de cada tabla (repositorios con su `createTitleKey`), «Buscar
  {entidades}…» en todas, también dentro de las fichas, y «Acciones» con «Importar» y «Exportar» a secas; la plantilla
  CSV sale del menú (`sc-list-page` pierde `templateDownloadable`).
- **DS**: `sc-group-popover` gana `display="adaptive"` (ninguno «—», uno su nombre, varios la cifra) y `sc-multiselect`,
  `chipOverflow="more"` («+N más»); los dos con su ejemplo en sc-docs y la nota 49 de Figma.
- **Comunes**: `sc-import-dialog` (las tres copias fuera; la ayuda, solo en Tipificaciones, porque Agendas la quitó esa
  mañana) y `sc-column-toggle` con `column-prefs.ts` (el globo de Columnas sale de `sc-list-page`, con buscador pasadas
  12 columnas). Anchos de partida medidos en `sc-list-page` (`anchosDePartida`): solo columnas con ancho, esperando a
  que la lista virtual pinte; se guardan en `<clave>:medidos` con su idioma para que el esqueleto de la segunda
  apertura ya los lleve (el CI lo cazó en `esqueleto-carga`); «Restablecer» vuelve a medir.
- **Repositorios**: «+ Añadir subcategoría» por categoría; grupos de una plantilla con «+N más» y apagados sin su canal;
  editores en gris; agentes de agenda sin «Código»; un contacto sin obligatorios (también al importar) y la tabla de
  contactos con sus 34 columnas a elegir. «El menú de arriba desaparece» no se reproduce (§14).
- **Pruebas**: `tablas-revision-1015.spec.ts` nueva (5); ajustadas las de textos, `listado-acciones-fijas` a 1024 y la
  carrera de `agenda-agentes`. En local, a 1440: 250 de listas y repositorios, 6 de componente y la línea de estilos
  (solo altas nuevas) en verde.

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
- **Rafa:** revisar usuarios contra el Supervisor real. Y en el portátil: poner el 4405 al día con `main` y borrar el
  worktree y la rama `codex/supervisor-f-listado` (`aff63656`, una copia de F), la local y la del remoto; desde la
  nube no se puede.

**Trampas del frente:**
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
