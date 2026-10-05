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
`git show c065d664:docs/handoff/supervisor-fichas.md`. El de E4 (DD-151, tampoco): `git show 7d70bfb9:…`.

## ✅ 2026-10-05 · sc-docs y el peso de los iconos, en un lote de cuatro bloques, en su PR

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

**Pendiente, anotado:** en Horarios y Variables la casilla de selección mide 74 px, por la misma causa que tuvo Agendas
(todas las columnas con ancho fijo). Va en una tarea aparte, con su prueba en `list-table-grammar`. La página de
Button de sc-docs no tenía una sección «Solo icono» como la de primeng.dev (DD-167): la gana en el lote 2.

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

## ✅ 2026-10-04 · F: columnas y acciones del listado (DD-153), fundida

> **Sello: #318 → `001bcf5f`, por squash; CI del PR (37204180260) y de `main` (37204858176), en verde.
> `codex/supervisor-f-listado` (`f90f7187`) es la misma F, subida desde el portátil: copia, se borra.**

**Qué hace.**
- **El selector de columnas, en un icono:** `sc-multiselect` gana `iconOnly` e `icon`, con nombre accesible
  «Columnas, 8 de 10».
- **«Asignar» y «⋮», fijas a la derecha:** `ScColumnDef` gana `frozen` y `alignFrozen`, que van a `pFrozenColumn`. La
  sombra solo aparece mientras queda contenido por la derecha.
- **Los recortes de 3 px de las estrategias:** arreglados.
- **El paquete:** versión 1.1.0, preparada y sin publicar.

**Medido.**
- **En el portátil:**
  - pruebas: cuatro e2e y una unitaria en rojo contra D3; después, la suite del Supervisor (532/532) y la del DS
    (100/100), en verde; verify, limpio;
  - pantallas: `revision` de Grupos, Agentes y Usuarios, y catorce capturas de antes y después.
- **En la nube:**
  - preflight, en verde sobre el árbol de F;
  - `visual-baselines` regeneró cuatro `-linux.png`, revisadas una a una:
    - `datatable`, con la demo nueva de columnas fijas. Sale sin filas porque la captura se toma tras «Vaciar»,
      como el resto de esa página; que funciona con filas lo cubre la prueba funcional del DS;
    - `multiselect`, con los controles nuevos y la sección «Solo icono»;
    - `radiobutton` y `select`, que mejoran: con las pistas de rejilla a mínimo cero, su tarjeta y su bloque de
      código ya no se salen por la derecha de la página.

**Pendiente, fuera de F.**
- **Página de docs de MultiSelect:**
  - el ejemplo del playground escribe `icon="view_column"` aunque `iconOnly` esté apagado (es el valor por defecto);
  - los cuatro selectores de solo icono salen apilados y pegados, sin hueco.
- **Bloques de código de sc-docs:** «Copiar» flota encima de las líneas largas.
- ~~**Agentes:** con `prefers-reduced-motion: reduce`, su tabla puede pintar cero filas virtuales~~ · arreglado en el
  lote de arriba; la causa, en «Trampas del frente».
- **Sin verificar:** zoom al 200 % y RTL.

**En el portátil, al fundir:**
- poner el local 4405 al día con `main`;
- borrar el worktree y la rama `codex/supervisor-f-listado`, la local y la del remoto.

El detalle de E1b salió por el tope de seis secciones: `git show faf25027:docs/handoff/supervisor-fichas.md`.

## ✅ 2026-10-02 · D3: tiempos, horarios y música (DD-152)

**Entregado:** #315 → `faf25027`; CI PR `37038447269` y main `37040177041`, leídas verdes con
`ci:verdict`. Rama y worktree propios eliminados; evidencias externas en `d3`.
Primer commit `11f1fafe`: siete pruebas rojas contra E4. Implementados catálogos de tiempos e inactividad, colas
Fija/Variable, horarios independientes de Web Chat/WhatsApp y música en un control. Valores históricos conservados.
Cierre por inactividad: criterio delegado, 5/10/15/30/60 minutos, defecto 5. Detalle y alternativas en DD-152.
**Ejecutado:** tres unitarias verdes; ocho casos propios verdes; ampliada 90/92, dos rojos de agrupación corregidos
con `revision` posterior verde; tanda final 13/13. Suite completa **525/528** (25,3 min): los dos recortes históricos
del listado (181>178 y 197>194) y una carrera al cerrar/reabrir el menú de subestrategia. Esa prueba ahora elige en el
menú ya abierto, sin alterar su contrato; **3/3 repeticiones verdes**. Contraste claro/oscuro incluido en la suite.
Una tanda tras interrupción falló por servidor apagado, no por comportamiento; reiniciado y pruebas repetidas.
**Visual:** 30 capturas de ficha/Contact Center, claro/oscuro a 1024/1440 y claro a 1366×768/1490×860; cero desborde
horizontal o combobox sin nombre. Etiquetas de horarios alineadas y capacidad separada a 28. Antes E4 capturado en
ambos temas. Revisión better-layout: sin hallazgos pendientes en lo inspeccionado; zoom 200 % y RTL no verificados.
Lint, docs:guard, docs:coherence, i18n, primeng-coupling y **verify verdes**. Preflight, PR/CI y merge/CI completados en verde.
Local 4405 actualizado al build de producción de D3; ocho pruebas propias verdes allí. Evidencia en `visualizations/2026/10/02/01a0fbe8-af94-73f3-a2cd-49d70c24736f/d3`.

## SIGUIENTE — sin preguntar

0. **sc-docs y el peso de los iconos, en su PR** (el tramo de arriba). Lo siguiente, en dos lotes con su PR cada uno
   (DD-154), decididos tras la revisión del 2026-10-04:
   - **lote 3 · lo que queda abierto de DD-133, DD-135, DD-136, DD-146 y DD-162:**
     - cada desplegable con nombre (los selects rotulados con `<label for>` sin `ariaLabelledBy`): la regla, dentro
       de `audit:screen-hygiene`;
     - las ayudas se anuncian con su control (`ariaDescribedBy` en `sc-select`, `sc-inputnumber` y
       `sc-toggleswitch`), también las de Contact Center;
     - las opciones apagadas de `sc-select` dicen `aria-disabled`;
     - el marcador de la foto de `sc-photo-upload`, de 2,58:1 a 3:1: las altas de agente y usuario entran en `RUTAS`
       de `theme-contrast`;
     - el rótulo-enlace del resumen se pulsa en 24;
     - ordenar columnas sin arrastrar («Subir» y «Bajar»);
     - los subtítulos de sección, sin relleno;
   - **lote 4 · Supervisión y limpieza:** el panel rápido también en el widget «Grupos» del Monitor (respuesta de
     producto del 2026-09-27, anotada en DD-121); la columna de 240 de agente y usuario, medida a 1366 y a 1440 antes
     de tocar el molde; y fuera `/lab/admin/*`, superado por DD-132, con su tag de archivo.

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
- **Rafa:** revisar usuarios contra el Supervisor real.

**Trampas del frente:**
- Los iconos añaden su glifo a `textContent`; el lector no lo oye. `toHaveText` debe distinguirlo.
- Un inputnumber con sufijo lo antepone a su descripción accesible. Las altas siguen fuera del contraste completo
  por el marcador de foto de 2,58:1 (DD-136). En cloud root, simula bloqueo de Git con `.git/config.lock`, no chmod.
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
  fotogramas retrasados, 5 de 5). Antes de un clic forzado, `toBeVisible()` (`column-selector-order.spec.ts`).
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
