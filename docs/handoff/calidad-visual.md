# Frente · Calidad visual — agrupación, revisión previa, datos de prueba y referencias — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**. Lo durable vive en `docs/`:
> las decisiones en DD-123, DD-124, DD-125, DD-127 y DD-129, la regla en AGENTS §«UX de pantalla» 9, todo lo pendiente
> en Figma en `docs/figma-pendiente.md` (con el plan de la sesión en Figma) y las referencias en
> `docs/referencias-contact-center.md`.
>
> **Por qué existe este frente.** Nace el 2026-09-27 de contrastar el repo con una lista de consejos de UI (espacio,
> agrupación, referencias, fotografía, iterar hasta estar contento, IA que critica en vez de diseñar). El repo era
> riguroso con la FIDELIDAD (tokens, componentes, el Kit) y no con el JUICIO visual: la agrupación no se medía y el
> primer filtro visual era el usuario. El sello va debajo del título de cada tramo; el de más arriba es el vigente.

## ▶︎ SIGUIENTE — sin preguntar

1. **Antes de la próxima demo, `npm run revision -- --datos editorial` sobre lo que se vaya a enseñar**, que ahora espera
   a que acaben las entradas animadas antes de fotografiar. Lo que se vea mal con nombres de negocio se arregla en la
   pantalla; un nombre de prueba que asome es un hueco del juego y va al mapa editorial (`juego-de-datos.ts`).

## ⏸️ ESPERANDO A RAFA — NO preguntar

- **La sesión en Figma** (`docs/figma-pendiente.md`, entero): seis decisiones con recomendación arriba del todo, y el
  plan por pasos. Lo que el código hace después (quitar filas de `PENDIENTE_FIGMA` y de `EXCLUDE`, el marco de
  `sc-dialog`, la etiqueta IFTA de `sc-inputtext`…) está en su paso 6: lo coge la sesión que llegue después.
- **Los análisis de Telegram y WhatsApp** viven en `~/Documents/Claude/2026-09 teardown admin usuarios-grupos/`, fuera
  del repo: traerlos a `docs/` para que otra sesión (o la nube) los pueda leer.
- **`npm run correcciones` en su máquina**: el registro de correcciones vive allí; en una sesión en la nube se pierde
  al cerrar el contenedor.
- **De gusto, visto en la revisión editorial**: «Web Chat» baja a dos líneas en la cabecera de la tabla de grupos del
  agente, y «Grupos / Agentes / Tipificaciones» en el acceso del usuario. Ya pasaba con los datos de siempre.
- **De gusto, visto en la revisión de Sistema**: dos de sus seis secciones llevan icono delante del título
  («Numeración especial» y «Regeneración de contraseñas») y las otras cuatro no. Ni regla ni prueba lo piden.

## ✅ 2026-09-27 (6) · El panel de grupos deja de inventar sus conectados (DD-129)

> **Sello:** rama `claude/resumen-cambios-recientes-14kfjb`, sobre `origin/main` HEAD `4f4f2018` (#263 fundido).
> Numerado (6) al fundir: el tramo (5) de abajo (#264) llegó antes a `main` con el mismo número.

**Qué pasó.** La «Consecuencia» que el tramo (4) dejó sin tocar: el panel de grupos (`buildWidget`, case
`group-panel`) sacaba «conectados» de `int(3,4) * n` (n = colas del panel) — en «Colas y agentes» (4 colas), 12 o 16,
sin relación con los 10 agentes reales de la demo, y el detalle truncaba en silencio a los 9 que hay de verdad.
Ahora `connected` y `available` salen de `DEMO_AGENT_PRESENCE` (la fuente que ya usa `agents-state` desde DD-127):
9 conectados, 5 disponibles, consistentes con lo que lista el detalle al abrirlo. `dashboard.spec.ts` («cuenta
agentes reales…») en rojo contra el build anterior (12, no 9) y en verde con el arreglo; la suite entera del
Supervisor (`dashboard`, `agrupacion`, `juego-de-datos`) sigue en verde. Detalle y descartadas en **DD-129**.

**Qué NO se toca:** `total`, `attended` y el resto de cifras de conversación del panel (son de cola, no de agentes) y
el resto de pendientes de ESPERANDO A RAFA de arriba.

## ✅ 2026-09-27 (5) · El editorial, sin rastro de generado; las reglas casan con cualquier juego; y Figma, a punto

**Sello:** rama `claude/ui-improvement-reddit-iykxgx`, sobre `origin/main` HEAD `4f4f2018` (#263 fundido; la rama se
rehízo desde `main` con los commits de este tramo encima).

**Qué pasó.**
- **Las dos cosas del editorial que esperaban decisión, hechas** (DD-124), solo en el editorial:
  - los 480 agentes generados cruzan nombre y apellido en diagonal: la lista ya no enseña 25 «Kidman» seguidos, y los
    primeros salen como los de verdad («Nicole Kidman», «Harrison Ford»…);
  - los cinco servicios de Conversaciones dicen el motivo de la llamada («Información general», «Consultas»,
    «Averías», «Contratación», «Instalaciones»), distinto de los grupos.
- **Al hacerlo salió un fallo:** la previsión de impacto de Reglas casa por nombre, y con otro juego no casaba nada.
  Medido: la regla #1 prevé 6 conversaciones con la demo y ninguna con el editorial; sin el puente, la #2 prevé 5 con la
  demo y ninguna con tortura. Ahora las reglas nombran servicios y grupos con el juego activo, y el puente
  (`demo-impact-bridge.ts`) devuelve grupos y agentes como las conversaciones. `juego-de-datos.spec.ts` lo prueba con
  las cuatro reglas y los tres juegos; salió en rojo sin cada una de las dos mitades del arreglo.
- **`docs/figma-pendiente.md`, repasado entero** contra el código y el export de `main`, con dos agentes en paralelo
  (uno ficha a ficha, otro buscando lo que faltaba) y cada hallazgo comprobado a mano antes de escribirlo:
  - ninguna ficha estaba hecha en el Kit;
  - cinco tenían un dato mal. La 14 apuntaba a `slate/600` y es `surface/600`; la 17 daba por hecho un marco de 17,5 y
    el Kit, como Aura, dice 15,75; la 11 ataba a variables que no existen; la 12 cambiaba también el blanco del texto; la
    8 no decía que hay que sacar dos filas de `EXCLUDE`;
  - entran 10 fichas nuevas (19 a 28), entre ellas cuatro grises bajo AA que el código ya subía sin ficha, el botón
    rojo de texto (3,76:1), la barra lateral y los iconos huérfanos;
  - arriba del todo, un plan en seis pasos y seis decisiones con recomendación.

  DD-123 lleva la corrección de los 17,5.
- **Revisión** con `--datos editorial` y `--datos tortura` de Conversaciones, Reglas (lista y constructor) y Agentes:
  agrupación en regla, y las capturas se leen bien con los nombres nuevos.
- **Visto y no tocado:** en el editorial, la regla «Transcribir Ventas: venta o incidencia» apunta al grupo 6, que allí
  se llama «Citas y reservas»: el nombre dice ventas y el grupo, citas. Viene de que el catálogo de Memoria llama
  «Ventas» a ese grupo con los datos de siempre y el editorial usa el nombre de Administración.

## ✅ 2026-09-27 (4) · El monitor deja de contradecirse, la tortura llega a lo que vive en memoria, y revisión editorial

**Sello:** fusionado en `main` con #263, HEAD `4f4f2018`.

**Qué pasó.**
- **El «sin verificar» del tramo (3) era un fallo** (DD-127). La tabla de «Monitor x» enseñaba 8 de los 10 agentes de su
  cabecera, el detalle del anillo daba por disponibles a Denzel (en pausa) y a Leonardo (desconectado), y el latido
  movía por su lado los disponibles del anillo y del panel de grupos: a los 24 s, 6 y 4 en la misma pantalla, con 5 en
  la tabla. Ahora hay un solo estado por agente (`DEMO_AGENT_PRESENCE`), la tabla enseña los 10, el latido no mueve los
  disponibles y el almacén de monitores sube a la versión 2. Los totales llevan raya arriba: con 10 filas a 900 de alto
  la tabla se desplaza 8 px por dentro.
- **La tortura llega a lo que vive en memoria** (DD-124): los widgets del Dashboard, las conversaciones con sus filtros y
  el catálogo del constructor de reglas, con `nombreDeGrupo`, `nombreDePersona` y `nombreDeCosa`. Lo que rompió, y está
  arreglado:
  - la tabla de agentes se salía 183 px;
  - el título de cinco tarjetas se recortaba por una fracción de píxel;
  - los nombres del detalle bajaban a tres líneas;
  - las cabeceras de varias palabras se partían (ahora las une un espacio que no separa);
  - los orígenes de Conversaciones bajaban a cuatro líneas (ahora, hasta dos y «…»);
  - a una descripción de Entidades le faltaba el texto entero, también con los datos de siempre.
- **Cómo se midió.** Un barrido de recortes (sin texto entero, celdas que envuelven, tablas que se salen, títulos y
  cabeceras partidos) en Dashboard y Conversaciones, contra un build con la tortura y sin los arreglos: todo en rojo. Con
  ellos, todo a cero, y con los datos de siempre, cero antes y después. Las pruebas nuevas de `dashboard.spec.ts` y
  `conversations-table-scroll.spec.ts` salieron en rojo contra ese build.
- **Revisión con `--datos editorial`** de Dashboard, Conversaciones, las listas y fichas de agentes, grupos y usuarios,
  y Sistema (19 vistas, agrupación en regla). Salieron dos cosas:
  - **cuatro colas de Conversaciones sin nombre de negocio**, entre ellas «COLA_PRUEBA». Ya lo tienen (DD-124), y
    `juego-de-datos.spec.ts` salió en rojo contra el build sin el mapa;
  - **la revisión fotografiaba el Dashboard a medio entrar**: la última tarjeta y el hueco vacío de «Colas y agentes»
    salían desvaídos, parecían rotos. `npm run revision` espera ya a que acaben las animaciones con final.
  Lo que es decisión de producto o de gusto está arriba, en «Esperando».
- **Visto y no tocado:** con tortura, el párrafo de alcance del detalle del anillo lista los 10 nombres largos (unas 12
  líneas antes de la tabla). Es un párrafo, no una lista, así que no lo cubre DD-124.

## ✅ 2026-09-27 (3) · El monitor medido, el juego de datos en Sistema y la regla del aire que se suma

**Sello:** fusionado en `main` con #260, HEAD `cd84f8ec`.

**Qué pasó.**
- **Medido a 1440** (DD-125): su ritmo ya era el compacto y no se suma relleno dentro de las tarjetas. El blanco
  que se ve es de la rejilla de alto fijo. Sobraba una cosa: la flecha invisible de «ver el detalle» separaba el
  anillo de «de 9 conectados» 36 px; ahora van a 14, con su prueba (31,5 en rojo contra el build anterior). Sin
  verificar: la cabecera de la tabla de agentes nombra 10 y la tabla enseña 8.
- **El juego de datos se elige en Configuración → Sistema** (DD-124): la demo pública sigue con los de siempre y el
  editorial se enseña con su enlace o eligiéndolo ahí. Prueba nueva en `juego-de-datos.spec.ts` (12 de 12 en tres
  pasadas); la primera versión la hizo roja una carrera real, navegar antes de que la recarga guardara el juego, y
  ahora se recuerda antes de navegar.
- **La regla R4, «aire que se suma»** (DD-125), en la medida de agrupación: de su borde a lo primero y lo último que
  tiene dentro, una caja no suma 7 o más. En rojo contra el build anterior («Políticas», 12,25); en el actual, 90
  bordes y ninguno. Los 3,5 de `.checkbox-row` quedan por debajo del umbral: son zona de clic.
- **Verificado en local**: las e2e del Dashboard, la anatomía de página, el contraste en los dos temas, los estilos de
  texto y la agrupación, 157 en verde; la revisión previa de los dos monitores, en regla; y el lector de pantalla
  anuncia «Ver el detalle de 5» con la descripción «de 9 conectados».

## ✅ 2026-09-27 (2) · Las preguntas abiertas, respondidas con medida

**Sello:** fusionado en `main` con #258, HEAD `a5619a2f` (el seguimiento de #257, rehecho desde `main` porque #257
se fusionó antes de que esto llegara).

**Qué pasó.**
- **El pie de los diálogos** no era el nativo de PrimeNG, como se escribió en el tramo de abajo, sino el de
  `sc-dialog`, que es del DS. Rige la escalera: con cuerpo, la botonera a 28 del contenido y 14 entre hermanos
  (DD-123). «Nueva entidad», «Nueva categoría» y «Duplicar grupo» pasan de 18 a 28,5 contra 14; `CONOCIDOS`, vacío.
- **DD-102 con datos largos** (DD-124): sigue siendo la regla con los datos medidos; más largo que eso, «…» y el texto
  entero en el `title`. Barrido de 19 pantallas con los dos juegos: 56 recortes (1 con los datos de siempre), 0 sin
  `title`. Antes faltaba en Agentes, Grupos, Plantillas y Tipificaciones. La cabecera de ficha ya no recorta el nombre:
  con DD-122 (#256) agente y usuario van al molde de la de grupo y el nombre toma el ancho libre (1213 a 1440).
- **`?datos=editorial`**: los 14 grupos con nombre de negocio, también en la ficha de usuario, Conversaciones y el
  Dashboard; `juego-de-datos.spec.ts` lo prueba.
- **La caja de sección**, 17,5 arriba y abajo (DD-125); «Políticas de contraseñas» de 327 a 260 de alto. Con #256
  alcanza también a las fichas de agente y usuario: revisadas con `npm run revision`, en regla.
- **La densidad de pantalla**, aceptada en la revisión de producto: compacto donde se escanea (monitor, listas), más
  aire donde se lee y se rellena (fichas, formularios), y ningún aire que no separe nada. Escrita en AGENTS §«UX de
  pantalla» 9 y en su tarjeta de Patrones.
- **#256 y #257**: la DD-122 de #256 (el índice único) llegó antes, así que las de este frente son DD-123, 124 y 125.
  #257 se fusionó con la renumeración que hizo otra sesión en paralelo, la misma que aquí, y antes de que llegara este
  tramo: va en un PR de seguimiento, rehecho desde `main` con un commit por bloque.
- **Cuántas correcciones son de espaciado**, aproximado sobre `docs/DECISIONS.md` porque el registro vive en la
  máquina de Rafa: 39 de las 124 DD nacen de algo que Rafa vio o pidió. Leídas a mano, 7 son de espaciado o
  alineación (DD-25, 57, 61, 90, 94, 101, 114) y 3 lo tocan de lado (DD-63, 81, 87), más DD-125 de hoy: una de cada
  cuatro. El clasificador de `correcciones-resumen` marca 21, porque en una DD «hueco», «ancho» o «padding» salen
  aunque el asunto sea otro. Vale para los mensajes, no para las DD.
- **Verificado en local** contra el build de producción del árbol fundido con `main`: suite e2e del Supervisor, 346 en
  verde y 1 en rojo que no es de esta rama (`listado-grupos.spec.ts:137`, «Agentes» 150>120: igual con el código
  anterior, y verde en el CI, que usa otro Chromium). La revisión previa de las 10 pantallas tocadas o alcanzadas, en
  regla. La foto de estilos del DS casa con el build fundido.

## ✅ 2026-09-27 · La agrupación por espacio manda y se mide; revisión previa; juego de tortura; referencias

**Sello:** fusionado en `main` con #257, HEAD `dff8dbee`. La rama se fusionó aplastada y sus commits no sobreviven:
el que citaba este sello (`9339e35f`, los tres cambios de código) ya no está en la historia de `main`.

**Qué pasó.**
- **Recuento** (build de producción a 1440, 34 rutas con sus pestañas = 56 vistas, 12 diálogos de alta y «Duplicar»):
  antes, 10 vistas en 5 pantallas y 4 diálogos por debajo del doble; después, 0 vistas y 3 diálogos, los tres por el
  pie nativo (arriba).
- **Arreglo en las piezas compartidas**: `.grid` y `sc-group-identity-fields` (fila 12,25 → 14), `.radio-row`
  (12,25 → 14), botón del acceso y del panel «Nueva label» a 28 del último campo.
- **`e2e/supervisor/agrupacion.spec.ts`** + `agrupacion-medida.js`: 7 tests en rojo contra el build anterior, 48 en
  verde con el arreglo. La primera sonda dio rojos falsos: la etiqueta del DS vive en un `sc-field-label` con
  `display: contents` y `sc-textarea` es en línea (su caja no es lo que se ve). Está escrito en la cabecera de la medida.
- **`npm run revision`** (captura + medida) y el recordatorio en `stop-guard.mjs`; **`npm run correcciones`** y tres
  patrones visuales nuevos en `correction-capture`; **`?datos=tortura`** en `createVersionedStorage`.
- **Suite e2e del Supervisor entera** contra el build: 326 en verde y 2 en rojo que NO son de este cambio, medido
  contra el build anterior: `dashboard.spec.ts:62` a 768 px (scroll lateral de 45, igual antes y después) y
  `listado-grupos.spec.ts:137` («Agentes» 150>120, inestable: 2 de 3 rojos también antes). Corrieron con el Chromium
  del contenedor, de otra versión que el Playwright del repo.

**Trampas de esta sesión.** Una sesión en la nube necesita Node ≥ 22.22.3 para `ng` y trae un Chromium de otra versión:
`SC_CHROMIUM=/opt/pw-browsers/chromium` para `npm run revision`, y una config de Playwright FUERA del árbol para las
suites (un `.ts` dentro lo caza `typecheck-coverage`, y bajo `node_modules` Node no lo carga). Sin `git fetch --tags`,
`docs:coherence` da por fantasmas los sellos de dos hand-offs que viven en etiquetas.
