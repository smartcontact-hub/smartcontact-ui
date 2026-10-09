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
d94e5ad8:docs/handoff/supervisor-fichas.md`.

## 🚧 2026-10-09 · Revisión de agentes y tipificaciones: en el PR #360

> **Sello:** worktree `pinniped`, rama `arebury/feat-agentes-tipificacion-design` sobre `main` en `1a0ae258` (DD-188 y DD-189
> integrados), **PR #360**.
> Fuentes: la transcripción del design review del 2026-10-09, el pptx de producto (parte de agentes), la propuesta
> dibujada de producto («Postconversación») y el chat del equipo. Enseñado en local (`ng serve supervisor --port 4310`).

- **Ficha de agente en 4 secciones** como la de grupo (General, Configuración, Recursos, Grupos) con `sc-subsection`.
  General: email obligatorio, tipo de extensión (navegador/teléfono; con teléfono, móvil obligatorio y PIN con nota),
  canales (mínimo uno), estado al editar, tipo de agente al final y solo con CusCare (`CLIENTE_CON_CUSCARE`).
  Configuración en el orden del pptx: grabar, activación por grupo, gestión de dispositivos (pide móvil), externos,
  conversaciones pendientes (permiso nuevo, «gestionar pérdidas»), la matriz y «Avanzado» plegado. Grupos: la tabla
  del grupo con «Salientes» (obligatorio; se elige el primero con Teléfono si no hay otro). Lo obligatorio, en `faltas`.
- **«Habilitado» bloqueado** con «Activación por grupo», en las dos tablas. **Contact Center › Agentes** en el orden de
  la ficha.
- **Equipos**: repositorio con su editor (nombre y agentes, como en Voice), columna en el listado de agentes.
- **Tipificación**: solo nombre, descripción y árbol; árbol entero en columnas, ramas de profundidad libre (sin regla de
  completar), icono `menu` (el de tipificar en sc-agent). **El grupo** decide en General › Postconversación: permitir
  comentarios, tipificar, con cuál (una) y Todas / Solo entrantes / Solo salientes; ver su mapa en un diálogo con
  «Editar en Repositorios». Deshace DD-173 §2 y §5 y la regla de ramas completas.
- **Notas de decisión** (`sc-nota-decision`, tarjeta morada sólida): PIN, filtrar por estado en el listado, burbuja o
  aro del estado. Se borran cuando el equipo decida.
- **Listados sin tope de ancho** (`.page__inner--list`) para enseñarlo: a 1920 la columna Nombre se lleva 737 px.
- **Audios del grupo** en modo `basic` (sin caja de soltar).
- **Barrido de consistencia grupo↔agente** (24 hallazgos; arreglados los de regla salvo la DD): el resumen del grupo
  dice que falta la tipificación y la marca bajo su campo; «Atiende por» en el resumen del agente lleva a Grupos; los
  candados de la tabla del agente llevan a su sitio; «N sin canal» en su tabla; «+» de agenda y plantilla en Recursos
  del agente; `.bloque`, `.control-add` y `.field--span-2` pasan a `_forms.scss`; iconos de canal con nombre en el
  listado de grupos; «repartir conversaciones»; «Editar» traducido en las dos barras de lote.
- **Abierto (gusto, sin regla):** marca de aviso para un obligatorio vacío en el resumen del agente, «Salientes»
  (agente) frente a «Salida» (grupo), la ficha de tipificación aún en `surface="card"`, «Grupos» y «Equipos»
  contiguas en el listado. **Para producto:** quitar canales saca del grupo desde la ficha de grupo y conserva la
  asignación vacía desde la del agente (DD-147 frente a DD-150).
- **Tercera vuelta (misma tarde):** el hub de Repositorios ya no pinta sus tarjetas encima del menú al entrar (el
  `view-transition-name` solo existe mientras cambia el filtro; medido: 80 capas → 0); las tablas llegan siempre al
  pie, también vacías (enmienda DD-95 §1: el marco ya no baila al filtrar); en los listados, Nombre se queda en 24rem
  en pantallas anchas y el sobrante va a la columna del «⋮»; tipificaciones con un solo «+» en la fila de lo
  que se añade; el punto de estado, proporcional (30 % de la foto) y solo en la tabla de agentes del grupo; las notas,
  sólidas; los equipos filtran la tabla de agentes del grupo (con el estado, en el mismo menú); y **quitar
  canales hace lo mismo en las dos fichas**: la asignación que se queda sin canal sale al guardar, con «Vas a quitar
  canales» (enmienda DD-150).
- **Tipografía** (barrido medido, DD-187 §10): diálogo, ayudas y error de campo, y título de tarjeta, a la rampa (toca el
  DS: `sc-dialog`, `sc-section-card` y los seis campos con ayuda); el árbol de tipificaciones a 14. Abierto: la etiqueta
  propia de los campos del DS (`[label]`) hereda 21 de interlineado; el filtro segmentado de las tablas de asignación
  mide 34 junto a un buscador de 32,5 (en mediano, 36).
- **Botón y gate** (DD-187 §11 y §12): `sc-button` abre `help`, `plain` y `raised` (las nueve severidades de
  `button-small` del Kit) y sc-docs las enseña; el «+» de añadir y el botón que abre la tipificación son el pequeño
  secundario relleno (28×27, nodo 7593:168617), centrado con su campo (enmienda DD-167). El tirador del árbol aparece al
  pasar por la fila. Gate nuevo `audit:css-literals` (46 gates): trinquete de tipografía y espaciados escritos a mano,
  DS y Supervisor; rojo medido con el `1.45` puesto de vuelta.
- **Barrido tipográfico del flujo de grupos** (DD-187 §10, segunda pasada), medido en el navegador: menú «⋮», tooltip y
  aviso a 20; título del panel de agentes a 28; `sc-inputnumber` sm a 27 y 12/18; etiquetas de los paneles de crear a
  12/18/600; barra masiva a 400; plural de «quitar canales». La nota de decisión pasa a `pTooltipPT` (clases propias, la
  flecha nativa en morado): `audit:primeng-coupling` cazaba su `.p-tooltip-*` sin capa. Tope del preset 63 → 69.
  Lo de gusto, decidido en la cuarta vuelta (abajo).
- **Cuarta vuelta (misma tarde, DD-187 §11):** los componentes riman en talla (el «+» y los botones de fila, a la de su
  campo; «Eliminar» masivo y pies de paneles en pequeño; «Tamaño de cola» de CC en mediano); `sc-button` gana
  `iconOnly` y el playground de sc-docs tiene los controles del panel de Figma; Categorías distingue «Añadir categoría»
  (con rótulo) de la flecha de subcategoría; una sola etiqueta de campo (12/18/600, también la propia del DS); enlaces de
  Recursos a 12/600; el multiselect con la flecha del Kit, centrada (medido: 5 desplegables a −2,5 → 0). Se quedan como
  están, por su motivo: «Agentes habilitados» (la maqueta del widget, DD-186), el ajuste de CC como fila (otro patrón) y
  la tecla «/» de `sc-search` (mueble de interlineado apretado).
- **Quinta vuelta (misma tarde, DD-187 §7 y §12), ya sobre DD-188:** «Editar» de Recursos abre la ventana del «+» con
  sus datos, sin salir (`app-recurso-dialog`, compartida por las dos fichas); borrar una tipificación dice qué grupos la
  usan y los deja sin tipificar; «Añadir categoría» en la esquina de la sección (`scSectionActions` del DS); el teléfono
  con tamaño fijo y «Guardar» abajo; las tablas miden lo que sus filas y no encogen al filtrar (vuelve DD-95 §1: la
  tarjeta hasta el fondo con 5 filas se veía vacía).
- **Sexta vuelta:** «Grupos de agentes» pasa a **Equipos** en la interfaz y en el código (`/admin/equipos`,
  `EquiposStore`, `Agent.teams`): el nombre se confundía con los grupos y con los agentes. Fuera el aviso de «abierta en
  otra pestaña» y su candado (DD-187 §13).
- **Aterrizaje:** PR #360, un commit por bloque (DS, Supervisor, gate) y los arreglos que pidieron los gates. Hecho:
  `component-styles.json` y las capturas de sc-docs regeneradas (revisadas), preflight en verde, y las e2e de
  tipificación, canales del agente, Recursos y sus diálogos reescritas y en verde en local. Lo que falte lo dice
  `npm run ci:verdict` sobre el PR.

## ✅ 2026-10-07 · La baldosa y la fila del resumen, al DS (DD-186)

> **Sello:** rama `arebury/resumen-al-ds` sobre main, HEAD `d4843e43`. Un PR con dos bloques: este y la auditoría de
> PrimeNG (abajo, en «SIGUIENTE»).

- **`sc-icon-tile` y `sc-fact-row`** (`<div scFactRow>`) en el DS, con su página en sc-docs; **`sc-tag size="md"`**, la
  píldora a 14. El resumen de grupo, agente y usuario los usan; el de agente y usuario pasa a una tarjeta de filas.

## ✅ 2026-10-07 · Segunda vuelta de la revisión de grupos (DD-185)

> **Sello:** rama `arebury/grupos-segunda-revision` sobre main, HEAD `0bf19647`. Un PR; enseñado en local antes de subir.

- Chat con «Menos conversaciones atendidas» (en el resumen baja de línea); «Tiempo de ringing» y «Tiempo entre llamadas»
  como nombre, con el timbrado y la espera como ayuda; el aviso de Ring All a partir de tres agentes, junto a su campo y
  con cierre; audios con «Subir archivo» y su icono, sin el texto de soltar.
- **Tabla de agentes del grupo, como la matriz de permisos:** cabeceras centradas con la casilla de «todos» después del
  rótulo; Asignado, solo la casilla. Desplaza 51 px a 1440 con tres canales.
- «Administrativo» tintado, no lleno.
- **El estado, en la burbuja del avatar** (`sc-presence-avatar`): la columna sale de la tabla de agentes del grupo y queda
  escondida de inicio en el listado; se filtra por estado desde la cabecera del agente.
- **Repositorio de Email** (`/admin/emails`, tarjeta en Comunicación): cuentas de correo y triggers, con su editor cada uno.
  Datos de prototipo; las pruebas de conexión no salen a ninguna parte.
- **El resumen del grupo**, medido sobre la maqueta del widget (baldosa, peso del icono, sombras, jerarquía). Si convence,
  la baldosa y la fila pasan al DS (pendiente).
- **Filtro por estado:** cinco opciones; los cuatro motivos de no atender, juntos en «No disponible».
- **Pendiente:** el nodo de la tabla de agentes en Figma (`figma-pendiente`), y lo de DD-184.

## ✅ 2026-10-06 · La revisión de grupos del equipo y `sc-fileupload` (DD-184)

> **Sello:** rama `arebury/revision-grupos-telefono-indice` (#351) sobre main, HEAD `b49b56e0`. Un solo PR, con la revisión del equipo punto por punto y el
> componente de subida; los cambios, enseñados en local antes de subir.

- **La ficha, alineada con Voice:** sin Skills ni Rotativa (lo guardado con ellas se lee con Balanceada y Menos
  conversaciones activas, por `RENAMED_STRATEGIES`); Ring All con «Nº agentes simultáneos» y su aviso siempre; tiempos
  hasta 30 min; los rótulos del equipo; «Anunciar»; voces como las lista Voice; «Caducar sesión» con minutos escritos y
  sin las ayudas de «Caducar sesión» y «Pedir valoración»; la cabecera sin «Sin teléfono saliente».
- **Chat y WhatsApp:** Distribución, Cola, y por subcanal mensajes inicial y final, horario con sus dos mensajes
  (solo con horario elegido) y, en Web Chat, dominios y script; WhatsApp después, con su número de una lista y, sin él,
  nada de lo que sigue. El modelo de mensajes cambia a `initial`, `final`, `outOfSchedule` y `nonWorkingDay`; lo guardado
  con las claves de antes se lee vacío, sin romper nada.
- **`sc-fileupload`:** `p-fileupload` en modo advanced, sin servidor (`customUpload`) y con `auto`; los cuatro audios de
  Grupos lo llevan, con `clearAfterSelect`. Página en sc-docs (Componentes › FileUpload). Registrado en DD-184 y en la
  memoria (`primeng-fileupload`) para la subida de tipificaciones y las que vengan.
- **Contact Center › Grupos** comparte rótulos y quita las ayudas de transferencia y tiempo entre llamadas.
- **Pendiente:** su nodo en Figma (`figma-pendiente.md`); medir el modo `basic` si hace falta; la subida de tipificaciones
  con este componente. **Tipificaciones** (la propuesta de Miguel, niveles por rama, vista previa fiel al agente) se
  aparta hasta que la presente.

60f8e617:docs/handoff/supervisor-fichas.md`. El de las fichas en tres columnas (2026-10-05, DD-170, #337, sin trampas propias): `git show
b49b56e0:docs/handoff/supervisor-fichas.md`.

## ✅ 2026-10-06 · Sin punto medio entre datos de la interfaz (DD-183)

> **Sello:** rama `arebury/sin-punto-medio` sobre `main`, HEAD `b49b56e0`.

- Fuera el «·» de unos 25 textos por idioma y de unos 30 sitios de código del Supervisor y del DS; cada sustituto mide
  lo mismo o menos. Regla y casos en DD-183. `audit:interpunct` (tope 0) lo vigila, en `verify`.
- Los e2e que fijaban esos textos se ponen al día (rótulos de columna, resúmenes, título del panel de agentes).
- **No se tocó:** sc-docs y las réplicas (`agent`, `agent-mini`, `cuscare`), que calcan la app viva (DD-35).

## ✅ 2026-10-06 · Las cuatro secciones de la ficha de grupo, en el mismo árbol (DD-182)

> **Sello:** rama `arebury/daily-transcript-change-validation` sobre `main` en `60f8e617`.

- General, Recursos y Agentes pasan a `surface="subtle"` con un `sc-subsection` por bloque, como Distribución y colas
  (DD-157). Clave nueva `groups.form.agents.assigned_title`. Medido en local: sin desborde a 1440 y 12 e2e en verde.
- **Solo el prototipo**: Figma conserva el cuerpo anterior y el índice con sus bordes grises. Las fichas de agente y
  usuario no se tocaron.

## SIGUIENTE — sin preguntar

-3. **Aterrizar la revisión del 2026-10-09** (tramo de arriba): pruebas, DD y PR. Se enseña antes al equipo.
-2b. **Componente tabla (otra sesión):** el «evolutivo» de la tabla con los devs (BI y voz). Propuesta de producto:
   elegir UNA vez qué funciones de la Table de PrimeNG queremos y cerrarlo; hay un Excel con las de BI.
   Punto de partida: `docs/AUDIT-PRIMENG-CATALOGO.md`. En la reunión: reordenar, ajustar ancho y arrastrar columnas
   son lo que falta; una card de Jira con los observadores de componentes.

-2. **Auditoría de PrimeNG contra el DS: hecha (2026-10-07)**, en `docs/AUDIT-PRIMENG-CATALOGO.md`. Queda decidir lo que
   propone, por orden: TreeSelect/Tree para las tipificaciones (con la propuesta pendiente), InputTags para los dominios
   del chat y OrderList para el selector de columnas; revisar `sc-inputnumber` sobre `p-inputnumber` y las dos maneras de
   editar un nombre en su sitio; envolver Tabs y quitar Sidebar del laboratorio. Nada se construye sin decidirlo.
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
- **Devs:** qué es «Audio saliente» (solo sale en el Figma; anotado en `groups-data.ts`; «Desbordar sesión» lo
  respondió la revisión de producto, DD-141), y el resto de preguntas abiertas de DD-121: el destino del desbordamiento, Email, el script de Web Chat, WhatsApp por
  agente y qué ve el cliente en cola si se toca un grupo activo.
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
