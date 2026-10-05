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
f41d3ce6:docs/handoff/supervisor-fichas.md`; el de E1b, `git show faf25027:docs/handoff/supervisor-fichas.md`.

## ✅ 2026-10-05 · Supervisión y limpieza, en un lote de tres bloques (DD-168), en su PR

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

## ✅ 2026-10-05 · sc-docs y el peso de los iconos, en un lote de cuatro bloques, fundido (#330)

> **Un PR, un commit en rojo y otro en verde por bloque (DD-154). Sin DD nueva: A, B y C son docs, y D cumple DD-130 §6.**

- **A · El lienzo y el código respiran:** en la tabla de API, «Dos sentidos» y «Salidas» llevan el escalón de entre
  grupos (estaban a 0 de la tabla de encima). `.row` y `.col` de las demos vuelven a tener su hueco, acotadas al
  lienzo: `component-page.scss`, que las definía, no lo importaba nadie desde julio, y se borra. «Copiar» ya no tapa la
  primera línea, y una línea larga no estira el Playground bajo «Controles». Las pruebas, a 1280 × 720, el viewport de
  las capturas: a 1440 cabía todo. Al revisar C salió una más: con `.col` en flex, el margen del párrafo se sumaba al
  hueco, y doce líneas de lectura («Valor: …») quedaban a 28 de su control. Y al revisar las capturas, otra: el lienzo
  es una fila flex, y una `.col` medía lo que su hijo más ancho. Ahora crece hasta su tope (40rem): «Fluid» se
  distingue, y los campos de las demos van a su ancho de formulario. Progress Bar no enseñaba ninguna barra, ni el
  Playground de Skeleton su bloque, también en `main`: van en una `.col`.
- **B · Lo que sc-docs escribe es verdad:** el código de una story sin snippet sale del contrato
  (`_component-api.json`). Omite lo que vale su valor por defecto, escribe un booleano que nace encendido y se apaga
  (`[allowEmpty]="false"` en selectbutton) y escribe lo requerido aunque no tenga control (`[sections]="sections"`).
  De 186 cajas de código cambian 43. La lógica, pura, va en `serialize-args.core.mjs`. `audit:doc-snippets` gana la
  regla (e): una story sin snippet que pinta otra plantilla que la del Playground. Había cinco, y ya llevan el suyo.
  `component-audit` deja de cortar un tipo en el `>` de `=>`, lo que arregla tres tipos de la tabla de API.
- **C · Las demos nuevas:** Button gana «Solo icono», como «Icon Only» de primeng.dev: cuatro formas por siete
  variantes, cada botón con su nombre, y el «+» de DD-167, un círculo de 31,5. GroupPopover gana «Al pulsar la
  cifra», con su línea de lectura de `activated`.
- **D · El icono pesa lo que su texto (DD-130 §6, figma-pendiente §29):** en `sc-form-section-nav` plano, el icono y
  el ✓ de la fila activa van a 600 y los demás a 400; en el de por defecto, a 500. El título de `sc-subsection`, a
  600. En el Supervisor cambian el índice de las fichas y de Contact Center, y Teléfono, Chat y Email en Distribución.
- **En local, en verde:**
  - las unitarias del bloque, la vitest de los dos componentes (24) y las e2e del lienzo (6) y de las demos;
  - `component-styles`: 126 claves añadidas, ninguna cambiada;
  - los barridos de las tres rutas (18), las vecinas del índice (39) y `revision` en regla.

  Las 38 capturas de sc-docs se mueven, y se regeneran antes del PR.

## ✅ 2026-10-05 · Recursos, en un lote de cinco bloques (DD-163 a DD-167), fundido (#327)

> **Un PR, un commit en rojo y otro en verde por bloque (DD-154), más el arreglo de `tiempos`: una ejecución que sigue
> en curso no tiene fin. Lo pedido es de la revisión de producto del 2026-10-04.**

- **1 · La agenda es una lista de contactos, con su editor (DD-163):** `contacts: {id, name, phone}[]` en lugar de
  `numbers`; lo guardado se pone al día al leerlo, y un contacto sin nombre se pinta «Sin nombre». `admin/agendas/crear`
  y `editar/:id` van como las fichas: Guardar y Deshacer arriba, la guarda y el cerrojo entre pestañas. Los contactos,
  en `agenda-contacts-table`: buscador (un teléfono, también por sus cifras), paginador y la tarjeta al pie, que sube
  como modificador `.table-card--al-pie` a `_sc-list-table.scss` (el panel rápido lo suelta con `--table-card-tope:
  none`). La agenda 9 trae 1.250 contactos generados, sin literales.
- **DS, en el bloque 1:** `sc-datatable` gana `first` (nativo, de dos vías). Sin él, buscar desde la página ≥3 dejaba
  la tabla en blanco, también en la de agentes de la ficha. Mueve `datatable-linux.png`.
- **2 · El resumen de cada recurso, con «Editar» (DD-164):** `sc-resource-rows` bajo cada campo de Recursos, en la
  ficha de grupo y en la de agente, con sus textos en `ResourceRowsService` y la lógica en `recursos.core.mjs`.
  Plantillas abre su panel con `?editar=`, y todo repositorio siembra su búsqueda con `?buscar=`. Se ofrecen las
  agendas activas y la inactiva que ya estaba puesta; lo borrado no se cuenta ni se guarda, y se quita antes de
  `markPristine`. El desplegable dice «N agendas» en lugar de repetir los nombres de las filas.
- **3 · Repositorios dice cuántos hay, y tiene buscador (DD-165):** la cifra va en texto de leyenda y en el nombre
  accesible de la fila. Cinco almacenes pasan a `repositories/state/`, para que el hub importe almacenes y no páginas.
- **4 · Importar contactos, como en Voice (DD-166):** plantilla CSV con BOM, vista previa con cada error y su línea,
  repetidos que se saltan y se cuentan, y un tope de 5000 por agenda. Un CSV de Excel en español (windows-1252) se lee
  con sus tildes. Lo importado entra sin guardar, con Guardar y Deshacer.
- **5 · El «+» de crear, el botón de solo icono de primeng.dev (DD-167):** decisión de producto del 2026-10-05. Los
  «+» de Recursos de grupo son redondos, con borde y en gris, a la derecha de su desplegable y a su alto, en la fila
  `.control-add`, la regla que ya usaba el «Añadir» de los dominios. Medido: un círculo de 31,5 a 7 del control, con
  los centros a 0,5 px. Antes eran de texto y flotaban sobre el rótulo, a 1,5 px del control.
- **En local, en verde:** las e2e de cada bloque y sus vecinas, los barridos de las rutas tocadas, 914 unitarias y
  las puertas; `revision` del editor a 1440 y a 1366.
- **Fundido:** #327 → `7d70bfb9`. De punta a punta, 7 h 38 min (`npm run tiempos -- 327 --desde 22:37`); el CI del PR,
  9 min, verde a la primera.

**Hecho, en tarea aparte:** la casilla de 74 px de Horarios y Variables (misma causa que Agendas) vuelve a medir 40 —
se quita el ancho fijo de la columna del nombre en las dos instancias, igual que en `agendas.ts`, y las dos rutas
entran en `list-table-grammar`. De paso, en Variables el valor por defecto largo («Encuesta URL») desbordaba su celda
y tapaba la columna «Tipo»: pasa a `kind: 'truncate'` (DD-124). Fundido: #329 → `95d98472`. La página de Button de
sc-docs no tenía una sección «Solo icono» como la de primeng.dev (DD-167): la ganó en el lote 2 (#330).

## ✅ 2026-10-04 · La revisión de producto del 2026-10-04, en un lote de seis bloques (DD-157 a DD-162), fundida (#325)

> **Un PR, un commit en rojo y otro en verde por bloque (DD-154). Medido el tiempo de punta a punta: el feedback llegó
> a las 15:28 UTC; los seis bloques, la pasada final, los barridos y `revision`, en local, a las 18:05 (2 h 37 min).**

- **1 · Distribución y colas (DD-157):** el árbol del DS. La sección en `surface="subtle"`, cada canal un
  `sc-subsection` y cada parte un `sc-slot`; Chat en el orden de Teléfono; la música en «Cola»; los demás mensajes de
  Teléfono de vuelta, plegados y sin «anuncio». DS: `sc-slot` se pliega y `sc-subsection` acepta `titleId`.
- **2 · El alta (DD-158):** ✓ solo en las secciones con algo obligatorio (`seccionesDeAlta` gana `obligatoria`); el
  teléfono saliente, segunda puerta del grupo; «Atrás» y «Siguiente» como el Stepper vertical, con los botones del DS.
- **3 · Los listados (DD-159):** en Grupos, la cifra de agentes abre su asignación y sale «Asignar» (DS:
  `sc-group-popover` gana `activated`); en Agentes, la cifra de grupos ya llevaba a su sección.
- **6 · La tabla al pie (DD-160):** `scLlegaAlPie` mide el alto que queda; norma 10 de AGENTS «UX de pantalla» y en
  Patrones de sc-docs.
- **5 · El resumen con color (DD-161):** la cifra principal, con el degradado del botón principal y el anillo en el
  color del texto; una por ficha.
- **4 · Las columnas (DD-162):** el Listbox nativo (casilla y arrastre) en el globo del icono; las cabeceras ya no se
  arrastran. PickList, valorado y descartado para 8-12 columnas.
- **Pasada final** (Playwright, con la lista de ui-ux-pro-max para web): nombre, foco, objetivo ≥ 24, sin saltos, en
  claro, oscuro y «reducir movimiento». Arreglada la cifra del globo (15 × 20 → 24,5, con un `::after`).

**Pendiente, anotado:** el rótulo-enlace del resumen mide 18 de alto (DD-146): llevarlo a 24 cambia el alto de todos
los resúmenes y se mide aparte. Ordenar columnas con teclado no se puede (tampoco antes, con las cabeceras).

## ✅ 2026-10-04 · Lo que dejó F, en un lote: la lista virtual con «reducir movimiento» y el estado en su columna (DD-156), fundido

> **Sello: #321 → HEAD `8a5660ce`, por squash; CI del PR (37209923320) y de `main` (37210588217), 14 de 14 en verde.
> Dos bloques en un PR (DD-154), cada uno con su commit en rojo. Después, en otro PR, la guarda de los emails (abajo).**

**La lista virtual con «reducir movimiento»** (sin DD: solo arregla, en el DS):
- con esa preferencia del sistema, el listado de agentes salía sin filas: la lista virtual de PrimeNG contaba las que
  le cabían en el fotograma en que la tabla aún medía 0, y solo vuelve a contar si cambia la ventana;
- `sc-datatable` observa la caja de la lista y le pasa cada cambio por esa misma puerta (`onWindowResize`);
- `listados-movimiento-reducido.spec.ts` (6): en rojo, Agentes con la preferencia, 0 filas; en verde, 18 de 18 en
  tres vueltas.

**El estado en su columna** (DD-156):
- «Estado» es la columna que sigue a «Agente», en la ficha y en el panel, con la etiqueta y la palabra del listado;
- cada columna mide lo más largo que lleva en los cuatro idiomas (`COLUMN_REM`), y el panel suma esas mismas
  (`columnsRem`): 48rem con dos canales, antes 47,25;
- medido antes y después en 18 casos (grupos de uno, dos y tres canales, de 1024 a 1680): etiquetas alineadas (antes,
  de 45 a 63 px de diferencia), ningún email más recortado y lo que cabía sigue cabiendo. Lo que ya desplazaba en
  horizontal desplaza 40 px más: a 1440, en un grupo de tres canales, Email también queda fuera;
- `ficha-grupo-estado.spec.ts`: tres en rojo contra DD-149, y la guarda de donde cabía, que sigue cabiendo. Su
  primera versión solo miraba el desplazamiento: la primera versión de DD-156 cabía a 1440 con cuatro emails de diez
  recortados, y la cazó la matriz, no una prueba. Ahora mira también los emails, en un canal a 1440 y dos a 1536 (los
  dos casos más justos, 11 y 3 px), y se pone en rojo con los anchos de entonces (cuatro recortados en cada uno). Cambian `ficha-grupo-familias` (el ancho
  del panel) y `panel-agentes-grupo` (el aire, en dos tramos; visto en rojo con aire puesto);
- en local, en verde: los diez ficheros de prueba de la tabla y el panel (77) y los barridos de Grupos, Agentes,
  Usuarios y Contact Center › Grupos (51, DD-155); `revision` de la ficha, el alta y el listado de grupos, en regla;
  antes y después del panel y de la ficha, en claro y oscuro.

**Pendiente:** la ficha de un grupo de tres canales desplaza en horizontal a 1440, como antes. Si producto quiere que
no, hay dos salidas: fijar Asignado y Agente a la izquierda (las columnas fijas de F) o llevar la densidad compacta
del panel también a la ficha (unos 100 px).

## SIGUIENTE — sin preguntar

0. **Supervisión y limpieza, en su PR** (el tramo de arriba). Con él se acaba lo que dependía de nosotros en este
   frente. Lo siguiente: **triar los otros frentes** (DS, CusCare, Dashboard y Sidebar, cada uno con su hand-off) en
   lotes como estos, y enseñarlos antes de empezar ninguno.

   Fuera de lote: el tiempo entre llamadas como ajuste general (pendiente de postventa) y ver y gestionar permisos por
   separado (no entra en esta fase). Si producto lo pide, que la tabla de agentes de la ficha no desplace a 1440 con
   tres canales (las dos salidas, en el tramo de DD-156). Cada cosa, con su prueba en rojo; la numeración de DD se mira
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
