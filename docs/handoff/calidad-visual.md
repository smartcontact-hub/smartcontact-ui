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

0. **Lo que queda del estudio de Primer (DD-188), un PR cada uno, enseñado antes en local y añadido a la página de
   antes y después** (artefacto «Antes y después del Supervisor»; las capturas salen de `sc-supervisor.pages.dev`
   contra el `ng serve` de la rama, a 1440, vista entera y la cabecera a doble resolución):
   - el toast solo para eventos del sistema: el éxito que se ve, sin aviso; el que no, un mensaje junto al botón
     (`sc-inline-message`, nuevo en el DS); los errores, fijos junto a su contexto (51 toasts de éxito en 28 ficheros);
   - la cabecera y el esqueleto de página comunes, con la escalera 7 · 14 · 28 en la cabecera, ancho máximo de 1280 y
     columnas que quepan a 1024 (Grupos esconde 358 px a 1024);
1. **Antes de la próxima demo, `npm run revision -- --datos editorial` sobre lo que se vaya a enseñar**, que ahora espera
   a que acaben las entradas animadas antes de fotografiar. Lo que se vea mal con nombres de negocio se arregla en la
   pantalla; un nombre de prueba que asome es un hueco del juego y va al mapa editorial (`juego-de-datos.ts`).

## ⏸️ ESPERANDO A RAFA — NO preguntar

- **Celdas vacías: «—» o en blanco.** Primer las deja en blanco (los lectores de pantalla leen el guion); la revisión de
  agentes del 2026-10-09 pintó «—» en todas por consistencia. Decide él cuál gana.
- **La sesión en Figma suma las fichas 38 y 39** de `figma-pendiente` (el maestro `Section` a `Subtitle`, Tag y Badge a
  600, las etiquetas en píldora, publicar la librería con `Title` y `Subtitle`, y las plantillas de vistas), y el texto
  principal pasa a slate-900 en la ficha 8 (DD-188).

- **La sesión en Figma** (`docs/figma-pendiente.md`, entero), en marcha desde el 2026-09-28 con el bridge en su máquina.
  Seis decisiones tomadas y una pendiente: los dos buscadores (ficha 10). Lo que el código hace después (quitar filas de
  `PENDIENTE_FIGMA` y de `EXCLUDE`, `sc-dialog` a 15,75, la etiqueta IFTA de select y multiselect a 400, el título a
  slate-900…) está en su paso 6: lo coge la sesión que llegue después.
- **Los análisis de Telegram y WhatsApp** viven en `~/Documents/Claude/2026-09 teardown admin usuarios-grupos/`, fuera
  del repo: traerlos a `docs/` para que otra sesión (o la nube) los pueda leer.
- **`npm run correcciones` en su máquina**: el registro de correcciones vive allí; en una sesión en la nube se pierde
  al cerrar el contenedor.
- **De gusto, visto en la revisión editorial**: «Web Chat» baja a dos líneas en la cabecera de la tabla de grupos del
  agente, y «Grupos / Agentes / Tipificaciones» en el acceso del usuario. Ya pasaba con los datos de siempre.
- **De gusto, visto en la revisión de Sistema**: dos de sus seis secciones llevan icono delante del título
  («Numeración especial» y «Regeneración de contraseñas») y las otras cuatro no. Ni regla ni prueba lo piden.

## ⚠️ Trampas de este frente

- **En una sesión en la nube**, `ng` necesita Node ≥ 22.22.3, y el Chromium del contenedor es de otra versión:
  `SC_CHROMIUM=/opt/pw-browsers/chromium` para `npm run revision`, y una config de Playwright FUERA del árbol para las
  suites (un `.ts` dentro lo caza `typecheck-coverage`, y bajo `node_modules` Node no lo carga).
- **Sin `git fetch --tags`**, `docs:coherence` da por fantasmas los sellos de los hand-offs que viven en etiquetas.
- **El bridge de Figma vive en la máquina de quien lo abre.** Una sesión en la nube no llega a él: genera el
  JavaScript (`tools/figma-pendiente.mjs`, `tools/figma-export-parity.mjs`) y lo ejecuta la sesión local.
- **Tras fundir un PR, GitHub borra la rama y la ref local `origin/<rama>` se queda colgando.** El aviso de «N commits
  sin subir» que da entonces es falso: `git remote prune origin` lo quita. Compruébalo antes con
  `git rev-list HEAD --not --remotes --count`.

## ✅ 2026-10-09 · El estudio de Primer: título de página a 20, sección a 16, la barra a una altura y sin 700

**Sello:** rama `arebury/design-system-primer-research`, sobre `origin/main` `d94e5ad8`.

**Qué pasó.**
- **Estudio de Primer (GitHub) y medición** de github.com contra sc-supervisor a 1440: lo que más separa es el contraste
  del texto (7,38:1 frente a 15,8:1), página y sección con el mismo tamaño (18 y 18), el botón principal de la barra
  más bajo que el buscador (27 frente a 32,5) y el 700. Informes en el archivo de entregables (`2026-10 estudio-primer`).
- **Dos text styles nuevos en el Kit**, creados por la API de Figma en la nube: `Title/title-semibold` (20/28) y
  `Subtitle/subtitle-semibold` (16/24), con sus filas en el tablero de tipografía. En código, sus clases y el rol
  `title`; el título de página y el nombre de las fichas a `Title`, la sección de `sc-section-card` a `Subtitle`.
- **La barra**: los botones de `#topbarActions` (32 en 21 pantallas) de sm a md. **Sin 700** fuera del Kit (35 usos).
- **Decisiones** en DD-188: el texto principal a slate-900 en el plan de color; la escala se queda y se pide una medida
  por relación; el toast solo para eventos del sistema; Guardar deshabilitado y las acciones arriba se quedan.
- **El icono que acompaña a un texto sigue a su estilo** (DD-189, «UX de pantalla» 4): tamaño y peso del texto y eje
  óptico a 20. En `sc-section-card`, 16 en sección y 20 en página; lo que cuelga en la piel blanca sale de su tamaño.
- **El estado de cada componente en sc-docs** (DD-190): listo, experimental o retirado, calculado por
  `component-audit` (maestro en el Kit + demo; `@deprecated`). Si cambian las páginas «❖» del Kit, `KIT_MAESTROS`.
- **Página de comparación** (artefacto «Antes y después del Supervisor»): el antes es la app del 2026-10-09 antes de
  empezar; el después, el estado acumulado. Se recaptura solo el después (`capturar` con `sites` = el local).

**Trampas.**
- **El título de página tiene dos familias** (`.page__heading` sobre el lienzo y `sc-section-card` con
  `headingLevel="1"`); `page-identity.spec.ts` exige que midan igual. Por eso la caja de página sube a `Title` con
  `:host(.sc-section-card--page)`.
- **Otra sesión abierta el mismo día** (`arebury/feat-agentes-tipificacion-design`) tocaba la ficha de agente y
  `DECISIONS.md` con DD-187: esta tomó DD-188, y sus cambios en la ficha están en líneas que no se cruzan.

---

## ✅ 2026-09-28 (7) · Las decisiones de Figma, tomadas, y un script que aplica las variables verificando cada una

**Sello:** rama `claude/ui-improvement-reddit-iykxgx`, sobre `origin/main` HEAD `ac02acc6` (#264 a #269 fundidos).

**Qué pasó.**
- **Seis de las siete decisiones de `figma-pendiente`, tomadas:**
  - el diálogo a 15,75, y el código se alinea;
  - la etiqueta IFTA a 400 en todas (contra la recomendación, y válida: el Kit ya lo dice);
  - el hover y el título a 900;
  - el glifo de los iconos, solo si el `IconSet` ata la caja;
  - el seleccionado de la barra lateral al 15 %;
  - el rojo contorneado sube con el de texto.

  Pendiente: los dos buscadores. Se explicó; falta la respuesta.
- **`tools/figma-pendiente.mjs`:** genera el JavaScript del bridge para las tres tandas de variables (53 medidas,
  21 colores más la variable nueva del título, 6 de componentes).
  - Antes de generar, comprueba cada valor de partida contra el export; con un «hoy» falso puesto, para.
  - En Figma solo cambia lo que vale lo de partida.
  - Probado sobre un Figma simulado con las variables del export: mira, aplica, repasa «ya estaba», y respeta una
    variable con un valor inesperado. **Sin probar contra el fichero real**, y los nombres de las dos colecciones
    «common» no están comprobados.
- **Esta sesión no llega al bridge**, que vive en la máquina de Rafa: lo ejecuta su sesión local.

## ✅ 2026-09-27 (6) · El panel de grupos deja de inventar sus conectados (DD-129)

> **Sello:** fusionado en `main` con #267, HEAD `16ff7930`.
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

**Sello:** fusionado en `main` con #264, HEAD `e4e18564`.

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

