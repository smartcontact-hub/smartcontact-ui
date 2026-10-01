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
Contact Center suben a «Trampas del frente».

## ✅ 2026-09-29 · Contact Center fija con qué nace un grupo o un agente (DD-135), y las altas dicen lo que falta (DD-136) y van en pasos (DD-138)

> **Sello: #290 (`e490faf`) y #291 (`4be46a5`) fundidos en `main`, con su CI de `main` en verde; los pasos, en la
> rama `areses/sweet-fermat-r9cxzw` sobre `0ec229c`.**

**Qué pasó.** Producto respondió al cierre del 2026-09-28:
- los valores de fábrica son los del documento de producto de usuarios y grupos;
- la página de valores por defecto del listado de grupos se quita, y se fijan en Contact Center;
- Contact Center es el superadmin y lo contiene todo: sin guardas de acceso, producto recorta qué ve cada rol;
- Tipificaciones va con la supervisión;
- la cola agotada sigue por el VUI: el grupo es un nodo AED del árbol, y quien diseña el VUI elige la salida.

**Qué cambia** (el detalle y lo descartado, en DD-135):
- Contact Center › Grupos es la página que vivía junto al listado, dentro de su tarjeta; › Agentes, la matriz, la
  Configuración y la Integración de la ficha de agente. Las dos guardan y las altas lo leen (`GroupDefaultsStore`, y
  `AgentDefaultsStore`, nuevo).
- De fábrica: 10 · 15 · 60 s, administrativo 5 s, Baja, Balanceada en Teléfono y en Chat, y desbordar encendido; el
  agente, todo menos la numeración especial, con sus tres interruptores encendidos.
- `/admin/grupos/valores-por-defecto` redirige a Contact Center › Grupos, y el listado pierde su botón.
- «Tiempo máximo de espera en cola» dice qué pasa al agotarse, en la ficha y en Contact Center.
- `cloud-identity.test.mjs` deja de depender de no ser root: un `.git/config.lock` en vez de `chmod`.

**Medido:** `contact-center-valores.spec.ts`, seis de seis en rojo contra el código anterior; la prueba nueva de
`ayudas-campos`, en rojo sin la ayuda de la ficha y, aparte, sin la de Contact Center.

**Las altas dicen lo que falta (DD-136)**, el efecto de gradiente de meta que pidió producto:
- el resumen de cada alta dice «Falta: nombre · extensión» y, en cuanto «Crear …» se enciende, «Listo para crear»;
- una pieza compartida de la app, `sc-summary-status`: un solo `role="status"` que cambia en su sitio y reserva su
  línea, en ámbar o en verde con su icono;
- un error de formato va en su campo, y al editar nunca dice «Listo».

`altas-meta.spec.ts`: cuatro de cinco en rojo contra el código anterior (la quinta, de guarda), y el contraste de
«Listo» en los dos temas, en rojo con el color cambiado a propósito.

**Las altas van en pasos (DD-138)**, lo que eligió producto para el mismo gradiente de meta:
- en el alta (y al duplicar agente o usuario), el Stepper vertical nativo de PrimeNG en el sitio del índice y del
  contenido; la edición sigue con el índice. Pieza de la app: `sc-alta-pasos`, con `pasosDeAlta()`, que saca los
  pasos de las secciones del índice;
- cada sección vive en su `ng-template`: la misma en los dos modos;
- la puerta de General del grupo sigue (pasos apagados); agente y usuario, en cualquier orden;
- ✓ al dejar un paso completo, «Atrás» y «Siguiente» como atajos, y el paso no toca la dirección.

`altas-pasos.spec.ts`: siete de ocho en rojo contra el código anterior (la octava, de guarda), y dos más en rojo con
el fallo puesto: el aire (49 con el margen de la tarjeta) y los títulos (h1 → h3 sin el h2 oculto). Las altas de otras
seis pruebas se reescriben para los pasos con `irAPaso()`.

**Trampas del tramo:**
- ⚠️ El Stepper nativo desmonta el panel que se deja cuando acaba de plegarse, no al pulsar: un momento hay dos
  paneles en el DOM y `querySelector('.p-steppanel-content')` coge el que se va (medido: 0 y 747). Espera a que quede
  uno (`irAPaso()` lo hace) o busca el del paso con `aria-current="step"`.
- ⚠️ Un clic de Playwright en un paso apagado espera 30 s a que se encienda. Los recorridos (`revision`,
  `agrupacion`) rellenan antes lo que lo abre (`PREPARAR`).
- ⚠️ El texto de una pestaña de paso es «1\nGeneral»: el número va delante. `nombreDe` lo quita.
- ⚠️ Un error de sintaxis en el decorador de un componente (unas comillas invertidas dentro de `styles`) deja a
  `ng serve` con NG2012 en quien lo importa aunque el fichero ya esté bien: reinicia el servidor.
- ⚠️ La sección dentro del paso la pinta la plantilla de la ficha, no `sc-alta-pasos`: sus estilos encapsulados
  no la alcanzan. El margen de la tarjeta se quita en `_forms.scss` (`.alta-pasos sc-section-card`).
- ⚠️ `toHaveText` lee el `textContent`, y un `sc-icon` pone ahí el nombre de su glifo («error Falta: nombre»). El
  lector no lo oye (va `aria-hidden`): casa el final del texto.
- ⚠️ Las altas de agente y usuario no pasan la medida completa de `theme-contrast`: el marcador de la foto
  (`sc-photo-upload`, del DS) mide 2,58:1. Por eso siguen en `RUTAS_SUELO` (abierto en DD-136).
- ⚠️ Un `sc-inputnumber` con sufijo se describe con el sufijo delante: la espera en cola se anuncia «s Si nadie…».
  Casa el final de la descripción, no el texto exacto.
- ⚠️ En la nube se corre como root, y `chmod` no le quita la escritura. Para simular que la config de git no se puede
  escribir, un `.git/config.lock` ajeno.

## ✅ 2026-09-28 · Panel rápido compacto (DD-131), qué trae cada tipo de usuario (DD-132) y las ayudas (DD-133)

> **Sello: #273 (`7730619`) y #274 (`212debe`) fundidos en `main`; las ayudas, en la rama `areses/sweet-fermat-r9cxzw`
> sobre `212debe`.**

**Qué pasó.** Revisión de producto, con captura: el panel «Agentes · <grupo>» del listado era demasiado ancho y dejaba
mucho aire entre el nombre y las columnas. Pase con `/better-ui`, medido antes y después con una sonda de Playwright
a 1440: 832 → 476 px con dos canales y 448 con uno; del nombre a su primera casilla, 450 → 154; filas, 46 → 34.
Detalle, tabla y descartadas en **DD-131**.

**Qué cambia:**
- el ancho sale de las columnas (mínimo 28rem, nunca más que la pantalla);
- un grupo de un canal (9 de 14) no pinta columna de canal, salvo que una fila llegue sin canal al abrir;
- `sc-agent-channel-table` gana `compact` y `channelColumns` (la ficha no cambia de medidas);
- fuera la línea «Canales: …» y el aire pasa a 14 y 7;
- la papelera dice «Quitar del grupo» al pasar por encima (también en la ficha), y la ayuda del candado dice dónde
  está, en los cuatro idiomas;
- DS: `sc-checkbox` desactivado con una sola opacidad (0,36 → 0,6), con su ejemplo en sc-docs.

**Medido:** las cinco pruebas nuevas de `panel-agentes-grupo.spec.ts` fallan las cinco contra el código anterior,
cada una por su motivo, y la de la columna que se queda falla también con la regla de «las filas de ahora».

**Orden del PR, por la captura del checkbox en sc-docs:** rama → workflow `visual-baselines` sobre ella → PR. Con el
PR ya abierto, el commit del robot dejaba el CI en «action_required» (ver trampas). Así, #273 corrió su CI entero sin
aprobar nada. Pero la captura no es la única línea base de sc-docs: `component-structure` y `component-styles`
cuentan lo que pinta cada demo, y un ejemplo más las puso rojas en el CI. Se regeneran en local (`SC_UPDATE_*`);
antes de pushear un cambio de sc-docs, corre `npm run e2e` entero.

**Los tipos de usuario (DD-132).** Producto respondió la pregunta de DD-121 con el documento de producto de usuarios y
grupos y el manual de usuario de Voice:
- cuatro tipos (Superadmin, Administrador, Supervisor Online y Offline), cada uno con su plantilla de acceso
  (`user-packages.core.mjs`, con sus pruebas en `test:unit`);
- seis secciones y cuatro gestiones nuevas, una por destino del menú, leídas con `resolveUserAccess` sin versionar
  `sc-users`;
- el alta nace Offline; al editar, cambiar el tipo pregunta; y Acceso dice «Plantilla: X · N cambios» con «Volver a
  la plantilla».

`usuario-plantillas.spec.ts`: cinco pruebas, las cinco en rojo contra el código anterior.

**Las ayudas (DD-133)**, del manual de usuario de Voice y del documento de producto, sin inventar nada:
- nuevas: Prioridad, la estrategia de teléfono (una línea por cada una, que cambia con la elegida) y la extensión del
  agente;
- reescritas: % de servicio, Voz, dominios y «Desbordar sesión»; fuera las cuatro ⓘ de la ficha de grupo;
- en el DS, `sc-select` pone sus `aria-*` en el elemento con foco (antes el lector no anunciaba ninguna ayuda de un
  select), y los textos fijos de los desplegables hablan los cuatro idiomas.

`ayudas-campos.spec.ts`: cinco pruebas, las cinco en rojo contra el código anterior.

## ✅ 2026-09-27 · El «Eliminar» de las fichas sube a AA: red-500 → red-600 (DD-128)

> **Sello: rama `claude/resumen-cambios-recientes-14kfjb` sobre `main` (HEAD `4f4f2018`).**

**Qué pasó.** El botón de texto «Eliminar» de la cabecera de las tres fichas medía 3,76:1 en claro (`red-500`
sobre blanco), fichado como conocido en `theme-contrast` desde el 2026-09-26 y anotado aquí mismo como pendiente
del pase de diseño. Es un token del DS (`--sc-cmp-button-text-danger-color`), no algo local a la ficha, así que se
cierra ahí: sube a `red-600` (4,83:1), el mismo escalón que ya llevaba el `danger` sólido desde julio. Detalle,
medición y descartadas en **DD-128**; customs-catalog §1.8 cierra su lista de botones bajo AA.

**Qué NO se toca de la lista de abajo:** el resto del pase de diseño (caja o sin caja para las tres fichas, el
fundido al cambiar de sección, distribución y colas, etc.) sigue igual de pendiente — esto solo cierra el punto de
contraste, que era un bug medible y no una decisión de producto.

## ✅ 2026-09-27 · El pase de diseño de las fichas: la franja, las altas, Guardar, el usuario nuevo y los saltos por canal (DD-130)

> **Sello: rama `areses/sweet-fermat-r9cxzw` sobre `main` (HEAD `16ff793`), #265.**

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

## SIGUIENTE — sin preguntar

0. **Lo que queda abierto de DD-133, DD-135, DD-136 y DD-138:**
   - los selects rotulados con `<label for>` sin `ariaLabelledBy` que DD-133 no tocó: un gate que los cace;
   - los subtítulos de sección, sin revisar;
   - las ayudas de la lista de ajustes de Contact Center no se anuncian con su control (el DS no deja pasar
     `aria-describedby`);
   - el marcador de la foto de `sc-photo-upload` (DS), a 2,58:1: al arreglarlo, las altas de agente y usuario entran
     en `RUTAS` de `theme-contrast`;
   - el cuerpo de `sc-section-card` `flush` sin cabecera guarda los 15,75 que lo separan de la cabecera oculta: en el
     paso quedan 23 de su título al contenido. Es un cambio del DS, con sus capturas (DD-138).

   Después: **el panel rápido, también en Supervisión** (respuesta de producto del 2026-09-27; anotado en DD-121, sin
   código) y la columna de 240, que sigue quitando 492 px de contenido a agente y usuario. Es del DS, no de la app: el
   icono a 400 junto a texto semibold en el título de sección y en la fila activa del índice (`figma-pendiente` §29).
   El laboratorio de administración (`/lab/admin/*`): sus paquetes quedan superados por los de DD-132.
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
- **Devs:** qué son «Audio saliente» y «Desbordar sesión» (solo salen en el Figma; anotados en `groups-data.ts`), y el
  resto de preguntas abiertas de DD-121: el destino del desbordamiento, Email, el script de Web Chat, WhatsApp por
  agente y qué ve el cliente en cola si se toca un grupo activo.
- **Rafa:** revisar usuarios contra el Supervisor real.

**Trampas del frente:**
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
- ⚠️ Un commit del robot `visual-baselines` sobre un PR ya abierto deja su CI en «action_required», y hay que
  aprobarlo a mano (2026-09-24). Si un cambio mueve una captura de sc-docs, lanza el workflow sobre la rama ANTES de
  abrir el PR.
- ⚠️ Una pila de PRs choca con `main` en movimiento: el preflight exige llevar el `main` del momento, y cada commit
  ajeno obliga a rebasar la pila entera. Solo se apila lo que depende de lo anterior; lo independiente va contra `main`.
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
