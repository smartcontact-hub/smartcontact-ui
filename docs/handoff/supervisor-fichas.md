# Frente · Fichas de administración (agente, grupo, usuario) y Configuración del AED — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.
>
> Nace el 2026-09-16. El tramo anterior (las tres formas de ficha, 2026-09-15) vive en `design-system.md`.

## ✅ 2026-09-27 · El pase de diseño de las fichas: la franja, las altas, Guardar, el usuario nuevo y los saltos por canal (DD-130)

> **Sello: rama `areses/sweet-fermat-r9cxzw` sobre `main` (HEAD `ddf711a`), PR nuevo.**
> El tramo del 2026-09-23 (los grupos pierden la cara) sale de aquí:
> `git show ddf711a:docs/handoff/supervisor-fichas.md`.

**Qué pasó.** Se revisó el flujo rehecho con `better-layout` y `better-ui`:
- **Alcance:** 17 vistas, a 1440 y 1280 y en los dos temas.
- **Método:** capturas y medidas por vista; lo propuesto se ensayó inyectando CSS en la página real.
- **Resultado:** siete hallazgos, enseñados en una página de decisión privada, y se aplicaron los siete. El detalle y
  lo descartado, en DD-130.
- **El antes y después** (página privada) cubre ya las tres fichas y Contact Center, con capturas «después» de este
  árbol: agente y usuario conservan sus controles (34 y 16 al abrir) y bajan de 1.304 a 812 de ancho.

Antes, dos retoques del widget (DD-126):
- quedó apuntada la decisión del tinte con el texto en primario;
- la cifra pasó a contar a la par del arco, con la misma curva (`ease`) y redondeando.

**Qué cambia:**
- **La franja:** el anillo junto a su cifra, las tarjetas de una fila a la misma altura y los datos del grupo en dos
  columnas (`subgrid`).
- **Las altas:** agente y usuario llevan la cabecera a la vista y el botón «Crear agente» / «Crear usuario».
- **Usuario:** Guardar se queda en la ficha y crear abre la edición. Un usuario nuevo nace sin secciones ni permisos
  (`EMPTY_SECTIONS` y `EMPTY_PERMISSIONS`, en `users-data.ts`).
- **Distribución y colas:** «Ir a: Teléfono · Chat · Email», con enlaces que saltan al bloque y dejan el foco en su
  título.
- **Iconos y listado:** los avisos del resumen llevan el icono a 600, y el botón de cada fila del listado de grupos
  dice «Asignar».

**Medido:**
- **`pase-fichas.spec.ts`:** 10 de 12 en rojo contra el código anterior.
- **Pruebas viejas que cambian a propósito:** `admin-forms`, `ficha-usuario-agente` y `page-identity`, porque el pase
  cambia justo lo que fijaban.
- **La cifra y el arco:** arrancan en el mismo fotograma. Con la curva nueva la cifra ya no acaba después, medido con
  un `MutationObserver` en el instante de cada cambio.
- **La suite del Supervisor:** 374 de 374 en local.

**Trampas del tramo:**
- ⚠️ **Una consulta de contenedor no suma especificidad.** Una regla dentro de `@container` que va antes que la regla
  base del mismo selector pierde. La franja siguió a 244 px hasta ponerla detrás.
- ⚠️ **Una `subgrid` con su propio `gap` desplaza sus elementos la mitad de la diferencia con el de fuera.** Con
  `column-gap: normal` lo hereda; aquí eran 3 px de más.
- ⚠️ **Un `href="#id"` suelto se resuelve contra `<base href="/">`.** El enlace de un salto lleva la ruta de la ficha y
  su ancla (`jumpHref`).
- ⚠️ **Una sonda por `requestAnimationFrame` puede leer la cifra del fotograma anterior**, según el orden de los
  callbacks. Para comparar cifra y arco hay que usar un `MutationObserver` en el instante del cambio.

## ✅ 2026-09-27 · El resumen de las fichas, como widget: la cifra cuenta y el anillo nativo se llena (DD-126)

> **Sello: rama `areses/sweet-fermat-r9cxzw` sobre `main` (HEAD `9241498`), PR nuevo: el prototipo y lo elegido.**
> El tramo del 2026-09-22 (el laboratorio de administración) sale de aquí:
> `git show 2b8c122:docs/handoff/supervisor-fichas.md`.

**Qué pasó.** Revisión de producto: el resumen de las fichas, como el ejemplo «Preview» de ProgressSpinner en
primeng.dev (cifra grande, anillo que se llena, una cuenta sutil). Se hizo un prototipo con dos superficies
(`?resumen=a|b`), se midió, se enseñó en una página de decisión privada y se eligió: el tinte de marca, movimiento al
abrir y al cambiar, anillo en toda proporción y, en el grupo, agentes activos sobre asignados. El conmutador se fue y
queda lo elegido.

**Qué cambia** (el detalle y lo descartado, en DD-126):
- `sc-summary-kpi` (`shared/components/summary-kpi/`): rótulo, cifra con «/total» y el `p-progress-spinner` nativo a
  42 (`[dt]` pone el arco en el acento, `[pt]` oculta su «N%»). Sin total, sin anillo.
- `CountUpDirective` (`core/directives/`), con su núcleo en `shared/utils/count-up.core.mjs` (6 pruebas de node):
  cuenta desde la cifra de antes a la par del arco (su misma curva, `ease`, y redondeada), y la duración la lee del
  `transition-duration` de su elemento.
- `styles/_resumen.scss`: la tarjeta en el tinte, sin borde a la vista y con todo su texto en primario; la escalera
  7 · 14 · 28. Grupo: agentes activos, con las filas por canal debajo, y reparto, salida y recursos en una tarjeta de
  datos. Agente: grupos activos. Usuario: secciones y permisos. Los datos sueltos salen de `summaryFacts`.
- El aviso ámbar del grupo lleva el ámbar en el icono y el texto en primario.
- i18n: `common.summary_of`, `groups.form.summary.agents_active`, `agents.form.summary.groups_active` y
  `agents.form.summary.no_groups`; fuera `groups.form.summary.agents`.
- `theme-contrast`: el gris secundario se perdona solo sobre sus dos fondos, y entran las fichas de agente y usuario.

**Medido:**
- **Rojo primero.** `resumen-widget.spec.ts`, 6 de 6 contra `main`. Con la duración sin apagar, la de menos movimiento
  enrojece por las cifras intermedias (1, 4, 6, 7, 8); sin su regla, la del ámbar en el icono enrojece por el gris.
  `theme-contrast` con el perdón atado a su fondo: rojo en las tres fichas (44 textos a 3,96:1) antes de pasar el
  texto a primario, y verde en las otras 18 rutas.
- 16 anillos en seis fichas y dos temas: 42×42, arco en su token, «N%» sin pintar, `aria-hidden`. El grupo 11 a
  1366×660 mide 554 y cabe.
- `npm run revision`: en regla las 17 vistas de las tres fichas y el alta de agente con los datos de siempre, y las 12
  de las fichas con `--datos tortura`.

**Trampas del tramo:**
- ⚠️ Leer un estilo computado dentro de la detección de cambios hacía nacer lleno el anillo de al lado. La directiva lee
  su duración en el primer fotograma, y el anillo arranca vacío con una señal que cambia un fotograma después de pintar.
- ⚠️ Chrome serializa un color con alfa como `color(srgb r g b / a)`, de 0 a 1, y una sonda que lo lee con `/\d+/` saca
  negro. Así salieron 20,91 y 4,27 para el tinte en oscuro, que miden 15,57 y 3,18: compón las capas translúcidas.
- ⚠️ `--sc-text-secondary` llega a AA solo sobre blanco (4,52:1), y sobre cualquier fondo teñido baja. Hasta este tramo,
  `theme-contrast` lo perdonaba con cualquier fondo.
- ⚠️ En claro, el tinte de marca y «seleccionado» son el mismo color: una tarjeta del resumen no puede hacerse pulsable
  sin cambiar de superficie.

## ✅ 2026-09-27 · Un solo índice con una sola forma, y agente y usuario al molde de la ficha de grupo (DD-122)

> **Sello: rama `areses/sweet-fermat-r9cxzw` rearrancada desde `main`, HEAD `168530c`, PR nuevo, un commit por bloque.**
> El tramo del 2026-09-20 (el contenido anclado a la izquierda, DD-115) sale de aquí:
> `git show 168530c:docs/handoff/supervisor-fichas.md`.

**Qué pasó.** Producto respondió a las preguntas para ir a fondo (DD-121, «Respuestas de producto»): el índice debe
ser uno y funcionar de una sola forma. Medido, había tres: Contact Center con su pieza propia (`routerLink`), la ficha
de grupo y el constructor con `sc-form-section-nav` (`href="#"`, `role="tab"`, la sección en memoria), y agente y
usuario con `p-tabs`.

**Qué cambia** (el detalle y lo descartado, en DD-122):
- **DS**: cada fila de `sc-form-section-nav` es un enlace (`href` opcional por sección). El clic principal sin teclas
  avisa (`activeChange`) y la página navega; los gestos de enlace los hace el navegador. `aria-current="page"`, sin
  `role="tab"`. Gana `titleKey` (rótulo) y `sectionsWithChanges` (punto de marca). CHANGELOG `Added` y `Changed`.
- **App**: la sección sale de `?seccion=` (input de página); `SectionLinksService` hace el `href` y la navegación. En
  un alta, `replaceUrl`. La transición de vista se salta si solo cambia la query, y el router cancela volviendo a
  donde estaba (`canceledNavigationResolution: 'computed'`).
- **Contact Center** usa el índice del DS con su rótulo; `sc-settings-sidebar` fuera.
- **Agente y usuario**, al molde de la ficha de grupo: cabecera encima, índice, sección en `sc-section-card` y
  resumen a la derecha con sus tres cifras (tarjetas en `styles/_resumen.scss`, una para las tres fichas). Un orden
  fijo; abren en Identidad; los listados enlazan a su sección de trabajo. El alta de agente navega a la edición (antes
  `Location.replaceState`). El aviso de otra pestaña, en las tres.
- **Un solo «Guardar» por ficha**: el índice marca las secciones con cambios y la barra dice «Cambios sin guardar».
- **Pendientes pequeños de DD-121**: el diálogo corto solo duplica (`sc-group-duplicate-dialog`), y sale el banner
  `.cross-tab-warning` que no pintaba nadie (tipografía suelta de 81 a 80).

**Medido:**
- **Rojo primero.** Unitaria del índice: 12 de 16 contra el componente anterior. `indice-enlaces.spec.ts`: 11 de 12
  contra `main`; la que pasaba es Contact Center, que ya iba por rutas. Su prueba de Atrás con «Seguir editando» se
  vio en rojo antes de `computed`. `ficha-usuario-agente.spec.ts`: 12 de 15 contra `main`, más la del alta de agente
  con el `replaceState` de antes puesto a propósito.
- **Sin píxeles de más.** Contact Center, la ficha de grupo y el constructor: 0 píxeles distintos contra `main` a
  1440, en claro y en oscuro. La sonda enrojece con medio píxel de relleno.

**Trampas del tramo:**
- ⚠️ `withViewTransitions` abre una transición en TODA navegación, también si solo cambia la query: sin saltarla
  (`onlyQueryChanged`, en `app.config.ts`), cada clic del índice fundía la página. En e2e no se ve,
  porque `disableAnimations` apaga los pseudo-elementos: la prueba envuelve `document.startViewTransition`.
- ⚠️ En el alta de grupo, en cuanto el grupo existe su nombre ya está cogido (por él mismo) y la puerta de General se
  cierra: lo que dependa de `activeSection()` al crear se lee ANTES de `addGroup`, y la puerta no se aplica mientras
  se guarda.
- ⚠️ Con dos `page.goto`, Atrás cruza de documento y el router no se entera: una prueba de un guardián con Atrás
  tiene que llegar a la ficha navegando dentro de la app. Y el aviso de descartar es un `alertdialog`.
- ⚠️ Un `input()` de página enlazado a la query recibe el valor nuevo un microtask después de navegar, y un
  parámetro que falta llega como `undefined`. No lo leas en un efecto que recarga el formulario (el constructor
  recarga la regla con cada cambio del store): cada clic del índice borraría lo editado.
- ⚠️ «Todos cumplen» sobre una lista vacía da verde: la prueba del alta de agente pasaba en `main`, sin índice.
  Cuenta antes de comprobar.
- ⚠️ La ficha de usuario ya tenía un `sectionTree` (el árbol de Acceso): el ayudante de enlaces se llama
  `sectionUrl` en las cuatro páginas.

## ✅ 2026-09-26 · La ficha de grupo sigue la visión de producto: índice lateral, canal por canal, panel rápido y alta en la ficha (DD-121)

> **Sello: rama `areses/sweet-fermat-r9cxzw`, PR #255, un commit por bloque.** El tramo del 2026-09-16 (la ficha que
> seguía a Voice, rama `comparar/fichas`) sale de aquí: `git show 9e25c83:docs/handoff/supervisor-fichas.md` (y el tag
> `archive/handoff-fichas-2026-09-16`, que apunta ahí).

**Qué pasó.** Llegó la visión de producto de grupos (2026-09-25): un documento que separa lo DICHO de lo que una IA
rellenó en una maqueta HTML y de lo inferido. Ni el documento ni la maqueta entran en el repo (es público): se citan
como «visión de producto de grupos (2026-09-25)». Se leyó con una regla de triaje (DD-121 §1) y se construyó en nueve
bloques con el vocabulario de la app, no con el de la maqueta.

**Qué cambia** (el detalle y lo descartado, en DD-121):
- Ficha de grupo con índice lateral (General · Distribución y colas · Recursos · Agentes), el de Contact Center, y
  resumen en tarjetas en una columna fija a la derecha (una franja arriba por debajo de 1340). Agente y usuario siguen
  con pestañas, a propósito.
- Chat, madre de Web Chat y WhatsApp; distribución y cola por canal (`phoneQueue`, `chatQueue`, `chat`, aditivos, se
  leen con `resolveGroup`); en la cola de teléfono, solo la música y la voz a la vista.
- La tabla de agentes del grupo gestiona composición: sin «Habilitado», al menos un canal, «Quitar» con un sentido.
- Panel rápido de agentes desde el listado y alta en la propia ficha, con General de puerta.
- Listado con una columna por estrategia y prioridad por rango (`sc-datatable` gana `externalSort`); valores por
  defecto por canal; la lista de agentes recorta los canales a los de su grupo.
- `CrossTabLockService` suelta el candado en `pagehide`: la ficha de grupo ya pinta el aviso de otra pestaña.
- Vuelta del 2026-09-27: el resumen pasa a la derecha (bajo el índice se cortaba en portátiles, ver trampas); lo que
  no es componente lleva su `.sc-text-*` (barrido en navegador: error de canales y celdas de la lista de agentes); y
  el índice, medido lado a lado con el de Contact Center, da las mismas cifras.

**Medido:** cada prueba nueva se vio en rojo (contra el código anterior o con el arreglo saboteado) antes que en
verde: `grupo-vision`, `ficha-grupo`, `ficha-grupo-canales`, `panel-agentes-grupo`, `listado-grupos`, y las reglas de
`group-channels.core.mjs` con `node:test`. Contraste en los dos temas. `datatable-linux.png` de sc-docs regenerada en
este entorno (Linux) después de comprobar que la anterior casaba aquí.

**Trampas del tramo:**
- ⚠️ `p-drawer` escucha Escape en su contenedor y llama a `hide(false)` aunque `closeOnEscape` esté apagado: quita la
  máscara y deja el panel abierto. El panel corta Escape en su propio `(keydown)` (`(keydown.escape)` no se ejecutaba).
- ⚠️ `p-table` reordena en el cliente por el valor crudo del campo ENCIMA del orden que recibe: el `sortFn` de una
  página no servía en ninguna columna con campo real. Con `externalSort` (que `sc-list-page` enciende si hay
  `sortFn`), toda columna ordenable tiene que estar en ese `sortFn`, o deja de ordenar.
- ⚠️ El selector de columnas añade una columna nueva AL FINAL de lo guardado (solo si sale por defecto; una opcional
  no se añade). Si su sitio importa, sube la versión de la clave. Y ninguna prueba vigilaba el recorte en las listas:
  lo hace ahora `listado-grupos.spec.ts` a 1440 (DD-102), que cazó dos cabeceras y una etiqueta cortadas.
- ⚠️ En una columna flex, el host de `sc-checkbox` se estiraba (271 px) y su `<label>` no (54-93): pulsar fuera del
  rótulo no marcaba. `.checkbox-stack` lleva `align-items: flex-start`, que arregla también la ficha de usuario.
- ⚠️ Mientras un preflight reconstruye `dist/`, el servidor de desarrollo compila en falso: mira la última
  «Application bundle generation complete», no el primer error.
- ⚠️ El carril de Contact Center (`.page__rail`) es fijo y NO tiene scroll: lo que se le cuelgue debajo del índice
  se corta en un portátil y, al bajar, se lleva el índice por arriba (el resumen del grupo, bajo el índice, se cortaba
  20 px a 1366×768 y escondía el índice 99 px a 1280×720). Por eso el resumen vive en su columna, con scroll propio;
  `ficha-grupo.spec.ts` lo vigila a 1366×660.

## ✅ 2026-09-24 · Las tablas de agentes y grupos tras la revisión del equipo, en cinco PRs

> **Sello: rama `arebury/tablas-6-docs` sobre `origin/main` (con #247 y #252 fundidos). Rama de trabajo, ya sin uso:
> `arebury/actualizar-tabla-grupos`.**

**Qué pasó.** Revisión con el equipo de las tablas de `/admin/agentes` y `/admin/grupos` para entregarlas a
desarrollo mientras se decide el layout de la ficha. Se cerró tabla a tabla y se partió en PRs por tema.

**Qué cambia, por PR:**
- **#247 (fundido) · DS.** `sc-group-popover` enseña todos los nombres (scroll desde 50vh). `sc-delete-entity-dialog`:
  borrar varios pide lo mismo que uno (teclear «N agentes»), sin la lista de nombres quitables. `sc-datatable`: ancho
  ajustable y orden arrastrando, los nativos de `p-table`, con `(columnOrderChange)` y `(columnWidthsChange)`.
  `sc-multiselect`: `optionDisabled`, `ariaLabel` y la flecha en Material Symbols.
- **#249 · Listas + selector de columnas nativo** (#251 se fundió dentro). Agentes: ID opcional detrás del nombre,
  Email, Teléfono y Tipo opcionales, fuera Activación, Estado en etiqueta de solo lectura con los colores de Contact
  Center, Grabación con el REC rojo, extensión con icono, búsqueda por todos los campos de texto. Grupos: ID con
  ancho medido, Estrategia sin corte. Datos de demo nuevos. El dashboard usa check en sus menús de elección. El
  selector es el «Column Toggle» de primeng.dev/table y la lista recuerda visibles, orden y anchos en `localStorage`
  (NO con `stateKey`: restaura también la selección).
- **#252 (fundido) · Coherencia.** Contact Center › Servicio con los colores de la tabla; canales alineados ópticamente.
- **#253 · Inplace** en el título de la ficha de agente y de grupo (`sc-name-inplace`): el mismo campo que Identidad.
- **Este · Docs:** `figma-pendiente.md` §14 (la etiqueta «Draft» a `slate/700`) y `ROADMAP.md` (el avatar que se
  vuelve check).

**Medido** con clics y arrastres reales a 1440 en local: 500 filas sin texto cortado, orden y anchos que vuelven al
recargar, Inplace sin mover la cabecera (texto en x=108, pestañas en y=127,8). `verify` verde; suite del Supervisor
240/243 con los tres rojos entendidos y arreglados (ver trampas); sc-docs entera en verde (92), y las pruebas nuevas
vistas fallar contra `main`.

**Trampa del tramo:** la pila de PRs choca con `main` en movimiento. El preflight exige al EMPEZAR que la rama lleve el
`main` del momento, y ese día entraron cuatro commits ajenos en dos horas: cada uno obligaba a rebasar la pila entera.
Solo se apila lo que depende de lo anterior; lo independiente va contra `main`. Y un commit del bot (`visual-baselines`)
deja el CI del PR en «action_required»: hay que aprobarlo.

## ✅ 2026-09-24 · El alta de grupo rima con Identidad: pide lo de la cabecera, no los canales (DD-119)

> **Sello: rama `arebury/alta-grupo-rima`, worktree `shipworm`, sobre `origin/main` `9f0cfd88` (#243).**

**Qué pasó.** Rafa, del alta de #243: «es un paso extra; al entrar tengo lo mismo que acabo de configurar; tiene que
rimar». El diálogo pedía nombre y canales, y la ficha abría por la fila de canales.

**Qué cambia.** El diálogo pide nombre, teléfono asociado y prioridad con `sc-group-identity-fields`, la MISMA pieza
que la pestaña Identidad (en columna en el diálogo, en fila en la pestaña, por `@container`). Nace con Teléfono y la
ficha abre en «Canales y agentes». Duplicar: «… (copia)», la prioridad del original, sin teléfono; se lleva canales,
agentes y ajustes. Enter crea solo desde el nombre (en un desplegable, Enter elige opción).

**Medido** con clics en local a 1440: alta, aterrizaje (la cabecera dice lo rellenado) e Identidad con la misma
pieza. e2e de grupo y fichas en verde.

**Si vuelve a sonar a paso de más:** la alternativa que rima del todo es sin diálogo, «Nuevo grupo» abre la ficha con
el nombre como campo en el sitio del título. Rafa pidió no quitar el paso.

## SIGUIENTE — sin preguntar

0. **Lo que queda del pase de diseño** (DD-130 aplicó los siete hallazgos de la revisión). Sin revisar aún a fondo:
   - los estados vacíos: un grupo sin agentes, una búsqueda sin resultados, un alta sin grupos;
   - las ayudas bajo casi cada campo;
   - la columna de 240, que sigue quitando 492 px de contenido a agente y usuario.

   Es del DS, no de la app:
   - el icono a 400 junto a texto semibold en el título de sección y en la fila activa del índice
     (`figma-pendiente` §29);
   - «Eliminar» en rojo de texto, a 3,76:1 (conocido en `theme-contrast`).
   Después, **el panel rápido de agentes, también en Supervisión** (respuesta de producto del 2026-09-27): es donde
   trabaja el supervisor, y hoy solo se abre desde el listado de grupos; anotado en DD-121, sin código. Las preguntas abiertas para producto y desarrollo
   siguen en DD-121 («Consecuencias»).
1. **Decidir sobre el laboratorio de administración** (`/lab/admin/grupos`, `/lab/admin/usuarios`).
   Lo primero que hay que discutir con Rafa y con producto son **los paquetes por tipo**
   (`TYPE_PACKAGES` en `admin-lab.model.ts`): hoy no existe ninguno porque el tipo no significa
   nada, así que los propuse yo y **no están validados con nadie**. Lo demás sale del teardown y
   está medido. Sin esa decisión, A1 no puede aterrizar en el formulario real.
2. **Pendiente de Rafa:** dijo «tanto para Agents como groups»; se hicieron grupos y usuarios (las
   dos entidades del teardown). Si se refería a la lista real de `/admin/agentes`, es una tercera
   con el mismo molde.
3. **Cuando Rafa diga «lanza el script de huérfanos»**, ya habrá hecho tres cosas: publicar Smart-Contact-Icons
   desmarcando los 21 sets `Icon…` de Playground (son de otra sesión), aceptar la actualización en el Design System y
   arrastrar `dashboard` y `neurology` a Playground. Entonces sigue el `LEEME.md` de
   `~/Documents/Claude/2026-09 iconos-material/huerfanos/`: 13 `dashboard`, 8 `brain` → `neurology`, y `query_stats`
   y `graph_5` a 14 × 14. El script para solo si la actualización no está aceptada.
4. **Rescatar a `main` por PRs separados** (la rama no se funde). Medido el 2026-09-20 contra
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
3. Probar con scroll real el scroll-spy de «Una página»: al hacer scroll por código no cambiaba la sección activa.

## ⏸️ ESPERANDO — no preguntar

- **Producto:** validar en producción el índice único y las tres fichas en su molde (DD-122), con el antes y después.
  La forma de agente y usuario ya está decidida: el índice lateral (las variantes de `comparar/fichas` quedan de
  referencia).
- **Devs:** qué son «Audio saliente» y «Desbordar sesión» (solo salen en el Figma; anotados en `groups-data.ts`), y el
  resto de preguntas abiertas de DD-121: el destino del desbordamiento, Email, el script de Web Chat, WhatsApp por
  agente y qué ve el cliente en cola si se toca un grupo activo.
- **Rafa:** revisar usuarios contra el Supervisor real.

**Trampas del frente:**
- ⚠️ `p-table` con ajustar Y reordenar columnas: si el texto de la cabecera va suelto en el `th`, nunca arrastra
  (la directiva ve el tirador de ancho dentro de lo pulsado). Por eso `sc-datatable` envuelve el texto.
- ⚠️ La tabla ajustable nativa pone `overflow: hidden` en cada celda: rompe un panel anclado DENTRO de la celda
  (Etiquetas). Por eso solo se enciende en las listas con selector de columnas.
- ⚠️ `scripts/__tests__/bash-guard.test.mjs` (caso `npm run e2e`) lee el `dist/` real: falla si has editado el DS y no
  has reconstruido. Es un defecto del test (depende de la máquina), sin arreglar.
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
