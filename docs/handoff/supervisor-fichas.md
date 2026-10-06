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
trampas propias): `git show 3ff6cd71:docs/handoff/supervisor-fichas.md`.

## ✅ 2026-10-06 · Repositorios en tarjetas por grupo, con su panel (DD-179), en su PR

> **Sello:** rama `arebury/premium-repository-hub-redesign` sobre `main` en `3ff6cd71`. **Un PR, un commit en rojo y
> otro en verde (DD-154).** Sale de una maqueta de Figma Make («Premium Repository Hub»), estudiada en su código y su
> comportamiento con `impeccable` y `better-ui`, e iterada en local antes de subir.

- **El hub, en tarjetas por grupo:** icono, cifra, nombre y descripción; la rejilla de cuatro, tres o dos según el
  grupo, y los grupos de dos juntos en una fila. Cabe sin desplazar a 1440 × 800 y 1366 × 768, en los cuatro idiomas.
- **Un tono por grupo**, de los de etiqueta del DS (azul, morado, teal y naranja): el título, el icono, la cifra, el
  borde al pasar y al marcar, el filtro elegido y el panel. Un icono por concepto (`sell` y `category`).
- **El panel**, acoplado bajo la barra de la app: lo que hay dentro, de verdad, y «Abrir repositorio» arriba. Lo cierran
  la X, Escape, su tarjeta y un clic fuera; con velo solo si taparía tarjetas, medido al abrir.
- **El filtro por grupo** con transición del navegador y **los recientes** en el buscador vacío.
- **En el DS:** `sc-drawer` `docked`, `sc-avatar` `labelColor` y `sc-tag` `bordered`, con su ejemplo en sc-docs y su
  línea en el CHANGELOG.
- **En local, en verde:** las 9 del hub (las 9 en rojo contra `main`, y las del clic fuera y el velo, también con el
  fallo puesto a propósito); las guardas de la ruta (contraste en los dos temas, foco, iconos, identidad, agrupación y
  piezas hechas a mano); el contraste de icono y título, medido a mano; `revision` en regla.

**Trampas del lote:**
- **`npm run revision` mide 0 relaciones en tarjetas** (y en los títulos de grupo del `Menu`): el aire entre grupos se
  mide a mano, entre cajas de texto.
- **`dismissible` de `p-drawer` solo cierra al pulsar el velo**: sin modal, el clic fuera lo pone la página.
- **Un «clic fuera» a una coordenada puesta a ojo cayó dentro del panel acoplado** (empieza en 1090 a 1440) y navegó:
  se pulsa un elemento de fuera (el `h1`), no un punto.
- **Tocar un comentario de un componente del DS lo deja más nuevo que `dist/`**, y el hook no deja medir con
  Playwright: reconstruye y reinicia el `ng serve`.
- **`p-avatar` no tiene entrada de estilo**: el tono va con `[style.background]` sobre su elemento, que gana al tema.

## ✅ 2026-10-06 · El pulido de las fichas (DD-176), en un lote de ocho bloques, fundido (#341)

> **Sello:** fundido en `main` como #341, con `main` dentro hasta #345 (DD-177); CI del PR en verde (leído). Un
> commit en rojo y otro en verde por bloque (DD-154). Sale de la revisión de DD-170 en local. **Era DD-171 y luego DD-172**:
> `main` fundió antes las suyas y Tipificaciones (#340) tomó DD-173, DD-174 y DD-177, así que se renumeró a DD-176
> con todas sus citas.

- **1 · El nombre editable:** se cierra al salir (pulsar fuera, Tab) con lo escrito, y al cerrar el foco vuelve al
  nombre. Lo encontró la revisión de interacción con Playwright (una sonda que anota y no afirma): la columna fija
  cabe hasta 1440×520, al 200 % el orden es bueno y cambiar de sección deja la página arriba; solo falló esto.
- **2 · Las ayudas, cortas:** 19 textos en los cuatro idiomas, `text-wrap: pretty` en las ayudas del DS y de la app,
  y «Tiempo de ringing» con su ayuda «a otro agente». De 13 ayudas que se alargaban a 1440 quedan 3 en dos líneas, sin
  palabras solas; lo vigila `fichas-textos.spec.ts`.
- **3 · Las marcas del índice** (`sc-form-section-nav`), al final de su fila y en la misma vertical, con su hueco fijo.
- **4 · La tabla de agentes del grupo**, compacta (`sm`) y cada columna a su rótulo: cabe a 1440 con tres canales (antes
  desplazaba 181 px). **Sin paginación**, en la ficha y en el panel; con lista virtual la caja ocupa su tope (con
  «Todos» se quedaba en 2 px). El porqué de la paginación (DD-151 no lo decía), en DD-176 §5. **La cabecera, una fila
  de texto** alineada con sus controles y solo la casilla de «todos» de Asignado: elegida entre tres opciones en la
  revisión, tras una investigación de SaaS de referencia y sistemas de diseño (DD-176 §4). Icono y casilla en cada
  cabecera se probó antes y se descartó. La barra de filtro, de borde a borde.
- **5 · «2/14 grupos seleccionados»** en la barra en lote del DS (`total`), y «2 de 14» para el lector.
- **6 · El «Column Toggle» de primeng.dev**, tal cual, en los listados (sustituye el Listbox de DD-162), con su teclado
  sin arrastrar. Medido contra primeng.dev.
- **7 · «Administrativo», en marrón:** el color de etiqueta `brown`, nuevo en todo el DS (nueve colores, sc-docs, la
  paleta de puntos y el selector de Etiquetas). El Kit no trae marrón: `amber-800` lleno con texto blanco (7,1:1).
  Pendiente en Figma (`figma-pendiente` §36b).
- **Una prueba ajena que falla en tanda:** `panel-agentes-monitor` «… dice en el foco que abre un menú» (de DD-171, la
  otra sesión) pide `…menu-1_list` y en la tanda completa llega `…menu-2_list`; pasa 3 de 3 a solas.

## ✅ 2026-10-05 · Tipificaciones, en un lote de tres bloques (DD-173, DD-174 y DD-177), fundido (#340)

> **Sello:** rama `arebury/tipificaciones-creacion` sobre `main` en `b4d1f145`. **Un PR, un commit en rojo y otro en
> verde por bloque (DD-154).** Sale de la propuesta de producto «Tipificaciones» (PDF, 2026-10-05), discutida punto por
> punto y probada en local antes de subir.

> **Fundido el 2026-10-06 (#340, `4217ed41`).** El título del squash cita DD-172, DD-173 y DD-174, los números de antes
> de renumerar: mientras su CI corría entraron #342 (DD-172) y #343 (DD-175), y al fundir quedaron en DD-173 (el
> modelo), DD-174 (la ficha) y DD-177 (el teléfono). El código, las pruebas y los docs ya citan estos.

- **1 · Una tipificación es una ficha propia (DD-173):** su árbol de hasta tres niveles, su dirección, su comentario y
  sus grupos por canal; una por dirección y canal en cada grupo. Repositorios › Tipificaciones con las columnas de la
  propuesta, todas ordenables; importar y descargar detrás de UN icono (`importable` en `sc-list-page`; importar, como
  las agendas). La ficha de grupo elige varias, con su fila y su «Editar», y pierde el «+» de la tipificación.
- **2 · La ficha, sin saltos (DD-174):** el molde de las fichas (índice; el nombre encima); la dirección en un control y
  el comentario en un interruptor; los niveles son las columnas (las tres siempre, la siguiente fantasma, la última con
  su ×); añadir y renombrar en la línea de la columna; cada aviso en su línea reservada. Su prueba cazó una carrera:
  dos «Añadir» seguidos y el segundo pisaba al primero (ahora `linkedSignal`).
- **3 · Lo que verá el agente (DD-177):** a la derecha, el teléfono de sc-agent en su sección de Tipificación, calcado
  de la réplica y para probarlo. Tokens nuevos `--sc-agent-window-*` (05-extensions) y su sombra con spread; en su
  propia columna, porque la del resumen recortaba la sombra.
- **En local, en verde:** las 17 de los tres bloques (en rojo antes de cada uno) y las 13 unitarias; las vecinas que
  tocan tipificaciones (45, cuatro cambiadas a propósito); `revision` de la ficha, el alta, el listado y la ficha de
  grupo; las guardas de tokens y de pantalla. Las mediciones sin saltos, con su medidor validado con un salto puesto.

**Trampas del lote:**
- **`git add -N` para que las guardas vean ficheros nuevos impide el `git stash`** (`not uptodate. Cannot merge`): quita
  la marca (`git reset -- <rutas>`) antes de apartar, y vuelve a ponerla para pasar las guardas.
- **La columna `.ficha-summary` desplaza por dentro** (`overflow-y: auto`) y corta todo lo que sale por los lados, también
  una sombra: lo que tenga que salirse va en su propia columna del área `summary`.
- **Un `.sc-dark` alrededor de una pieza no pone los campos de PrimeNG en oscuro**: sus `--p-*` se resuelven en la raíz.

## ✅ 2026-10-05 · Las fichas en tres columnas sin cabecera: el nombre encima del índice (DD-170), fundido (#337)

> **Sello:** fundido en `main` como HEAD `7d470054`; CI del PR y de `main`, en verde (leídos). Sale del marco de la
> ficha de grupo en Figma («Landing page», nodo 2467:7078), leído contenedor a contenedor. En su CI salieron dos
> pruebas que con DD-170 ya no medían nada (General ya cabía a 1280×720; las 10 filas cabían a 1512×945): rehechas.

- **El molde, en las tres fichas:** el nombre y su línea van arriba de la columna del índice (dentro de `.page__rail`
  en el DOM); la sección y el resumen arrancan a su altura; la rejilla es de una fila (`'rail main summary'`), y la
  sección es la única columna que crece (812 a 1440, 1052 a 1920). Por debajo de 1340 la columna de la izquierda no
  cambia y el resumen pasa a una franja encima de la sección.
- **Fuera `sc-nombre-fijo` (DD-145 §1-§3):** el nombre ya no se va al bajar, porque vive en la columna fija. Fuera
  también el `scroll-padding` que apartaba las anclas bajo la copia.
- **Un nombre largo baja a dos líneas** y se corta al final de la segunda (también en `sc-name-inplace`, que ahora usa
  los 196 enteros). En 196 caben unos 22 caracteres; todos los de la demo caben en una. Al pulsarlo para editarlo, el
  título conserva su alto (el índice subía 24 px): `sc-name-inplace` pasa a `flow-root`, porque su `:host` sin
  encapsular no casaba y se pintaba en línea. Del nombre a sus datos, 7: el campo de editar tapaba media línea.
- **Los canales de General, en las columnas de Nombre y Prioridad** (`.checkbox-grid--3`): antes, a 3 y 6 px a 1440 y
  86 px a 1920.
- **En local, en verde:** las 38 del bloque (20 en rojo: 19 contra `main` y la del alto al editar, sin su arreglo), 126 vecinas, 63 de los barridos de las tres
  fichas y `revision` (16 vistas, en regla). Mirado a 1440, 1280 (nombre en dos líneas), 1100 y con `?datos=tortura`.
- **Figma:** `figma-pendiente` §35 pasa a DD-170 (grupo ya dibujado; faltan agente y usuario) y §36 se retira.

## ✅ 2026-10-05 · Supervisión y limpieza, en un lote de tres bloques (DD-168), fundido (#333)

> **Un PR, un commit en rojo y otro en verde por bloque (DD-154); el 2, en uno solo, porque la medida dijo que no
> faltaba nada. Es el último lote del frente: lo que queda espera a producto, a devs o al portátil (abajo).**

- **1 · El panel rápido de agentes, también en el Monitor (DD-168):** «Agentes», en la cabecera del widget «Grupos»,
  abre el panel del listado de grupos: con un grupo, el suyo; con varios, un menú «Asignar agentes de…». No sale en
  modo pared ni en la vista previa del asistente. Los grupos de la demo van por id (`DEMO_GROUPS`, como los agentes
  de DD-139): un grupo renombrado sale con su nombre nuevo. El panel devuelve el foco a quien lo abrió, también en el
  listado, donde caía en `<body>`. La prueba del latido de 8 s se vio en rojo con el fallo puesto.
- **2 · La columna de 240 de agente y usuario cabe (DD-144):** 96 vistas (1366 × 768, 1440 × 900 y 1366 × 660, los
  cuatro idiomas, ocho fichas): cada texto en una línea, la cifra más justa a 81 px de su anillo y sin scroll ni a
  660. El molde se queda; la sonda pasa a guarda (`resumen-cabe.spec.ts`), vista en rojo con un fallo por comprobación.
- **3 · Fuera `/lab/admin` (DD-132):** la carpeta (24 ficheros), su ruta y sus textos. Su tarjeta deja los
  laboratorios del Lab de sc-docs y pasa a las exploraciones, archivada con el commit de `main` que la tenía
  (`f41d3ce6`) y su enlace fijo, sin etiqueta: la nube no puede subirla.
- **En local, en verde:** las pruebas de cada bloque (rojas antes; la guarda del 2, con un fallo por comprobación),
  las vecinas del 1 (107), los barridos de las rutas tocadas (36) y `revision` del Dashboard y de las fichas (18 vistas,
  en regla), con el menú y el panel abiertos desde el Monitor en una sonda aparte.

## ✅ 2026-10-05 · Accesibilidad pendiente, en un lote de seis bloques, fundido (#332)

> **Un PR, un commit en rojo y otro en verde por bloque (DD-154). Sin DD nueva: cada bloque cierra lo que dejó abierto
> una DD, con su «Actualización (2026-10-05)»: DD-133, DD-135, DD-136, DD-146 y DD-162.**

- **1 · Cada desplegable con nombre:** PrimeNG nombra un combobox sin nombre con la opción elegida, y un `<label for>`
  no nombra el span de `sc-select` (sí el `<input>` de `sc-multiselect`). `sc-select` gana `ariaLabel` (el nativo) y
  sus opciones apagadas dicen `aria-disabled`. `audit:screen-hygiene` gana la regla: cazó 31 de 119; quedan 0.
- **2 · Las ayudas se anuncian con su campo:** seis campos del DS ganan `ariaDescribedBy` (`joinDescribedBy`), y
  `sc-multiselect` lleva sus `aria-*` al combobox. 42 ayudas de las fichas, Contact Center y Sistema llevan su id.
- **3 · El marcador de la foto, a 3:1:** `--sc-icon-secondary` (3,96:1). Las altas de agente y usuario, en `RUTAS`.
- **4 · El enlace del resumen se pulsa en 24:** el `::after` de la cifra de `sc-group-popover`.
- **5 · Ordenar columnas sin arrastrar:** con el teclado no se llegaba al globo. Ahora el foco entra en la lista,
  «Subir» y «Bajar» mueven la última enfocada y Escape vuelve al icono; dos arreglos alrededor del Listbox (abajo).
- **6 · Subtítulos sin relleno:** fuera «Capacidades del agente» y «Comportamiento, integración y sesión».
- **En local, en verde:** las pruebas de cada bloque (rojas antes), sus vecinas y barridos, y `revision` de las 32
  vistas, en regla. `visual-baselines` regeneró cinco capturas de sc-docs (select, multiselect, inputnumber, textarea
  y toggleswitch), miradas una a una.
- **Fundido:** #332 → `f41d3ce6`. De punta a punta, 2 h 21 min (`npm run tiempos -- 332 --desde 08:16`); el CI del PR,
  8 min, verde a la primera.

## SIGUIENTE — sin preguntar

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
