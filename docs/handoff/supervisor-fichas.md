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
cuatro trampas del pase suben a «Trampas del frente».

## ▶ 2026-10-02 · E2: Habilitado, palabras y presencia (DD-149)

> **Sello: `codex/supervisor-e2-habilitado`, base `3c6d13e9` (#310, CI de main leída en verde).**

**Implementado:** interruptor por enlace en tabla y panel; presencia con las etiquetas del listado y catálogo
compartido; cuenta, presencia y habilitación separadas en cuatro idiomas. Resumen y reglas nombran habilitados.
El panel suma la columna nueva; se conserva la asignación, sus canales y niveles al deshabilitar. Detalle: DD-149.

**Ejecutado aquí:** dos pruebas nuevas en rojo contra E1b; 54/58 afectadas, con cuatro fallos de expectativas
(ancho antiguo y nombre del catálogo), corregidas y repetidas: 22/22. Capturas de ficha/panel en claro/oscuro,
1024/1440 con ambos niveles; acceso por teclado al interruptor dentro del desplazamiento horizontal.
`revision` pasó las seis rutas afectadas. La sonda de nombres falló con 15rem; se reservan 21rem para compartir
celda con presencias largas, y se actualizan las medidas de panel (DD-149). Zoom 200 % y RTL no verificados.
**Validación final:** 27/29 afectadas y 2/2 repetidas tras corregir medidas antiguas; suite completa 502/504
(22,4 min): solo los dos recortes conocidos del listado, con las mismas medidas de E1b. Contraste claro/oscuro
incluido. `revision` repetida en las tres rutas modificadas tras el ajuste de ancho, sin incidencias.
**`verify` verde. Pendiente:** preflight final, PR/CI, squash/CI de main y limpieza propia.

## ✅ 2026-10-02 · E1b: niveles por familia (DD-148)

**Entregado:** #310 → `3c6d13e9`; CI del PR `36995125759` y de main `36996276443`, leídas en verde. Rama y worktree
propios eliminados; evidencias fuera del worktree. Niveles independientes 1–10, migración con precedencia del
formato nuevo, subestrategia de Chat, defaults sin Niveles y columnas por familia. E1a y su recuperación intactos.
**Ejecutado en E1b:** 4 unitarias y 7 e2e rojas primero; 19 unitarias, 44/27/12 e2e afectados, revision, verify y
preflight verdes. Suite local 496/498: dos recortes de 3 px del listado reproducidos también sobre la base limpia
`83e371e7`; registrados para F. Zoom 200 % y RTL no verificados. Estos resultados no validan E2 ni los siguientes.
**Continuidad:** E2 → E3 → E4 → D3 → F, un bloque/PR tras el merge verde del anterior.

## ✅ 2026-10-02 · E1a: asignaciones por familia (DD-147)

> **Sello: rama `codex/supervisor-e1a-familias`, base `c6a9cd59` (G2b, #308 fundido; CI del merge leído en verde).**

**Recuperado:** 14 archivos de implementación y dos de pruebas del paquete E1a; SHA-256 e integridad del ZIP
reverificados. El parche se aplicó sin conflictos tras G2b. Se recuperó contenido, no el objeto Git `643c72fc`.
La copia original sigue intacta. Los seis e2e en rojo de Cloud son evidencia histórica del registro de recuperación.

**Completado:** tres familias en enlaces, tablas, panel, resumen y listado; lectura de WhatsApp como Chat sin
subir versión; recorte y cascada por familia. Completadas las pruebas que aún fijaban cuatro canales y el ancho
del listado. El resumen del agente cuenta solo familias ofrecidas, igual que su listado. Detalle: DD-147.

**Validado localmente:** las 15 unitarias de canales; las 42 pruebas afectadas, con repetición de las dos
expectativas corregidas; diez vistas en `npm run revision`. Capturas en claro/oscuro, 1024/1440: tres glifos en
69 px dentro de 100; panel de tres familias en 556 px sin desbordamiento. Dos contratos del núcleo se reprodujeron
en rojo contra G2b. El CI y preflight del PR propio son la evidencia de entrega, no el registro de Cloud.

**Siguiente:** E1b, niveles 1–10 por familia y estrategia Niveles en Chat (DD-148 disponible al empezar E1a;
recomprobar). Después E2 → E3 → E4 → D3 → F. No se cambió el singular «1 agentes», ajeno al alcance.

## ✅ 2026-10-01 · La revisión de producto del flujo de grupos, en PRs pequeños: el documento quieto (H), los diálogos de Recursos, las palabras de la ficha (D1, DD-141), el teléfono saliente (D2, DD-142), el alta al índice (R, DD-143), las tres columnas (G1, DD-144), el nombre fijo (G2a, DD-145) y el resumen enlazado (G2b, DD-146)

> **Sello: rama `areses/sweet-fermat-r9cxzw` sobre `main` (HEAD `b02fdb9b`). H (#298, `57f03a0`), los diálogos de
> Recursos (#300, `5cf3f5e1`), D1 (#303, `78b2efb9`), D2 (#304, `004498dc`), R (#305, `85c32239`) y G1 (#306,
> `86d5b18c`) y G2a (#307, `b02fdb9b`), fundidos con su CI en verde; G2b (DD-146), en su PR.**

**Qué pasó.** La revisión de producto del 2026-10-01 da el flujo de grupos por bueno para que desarrollo empiece, con
ajustes en el listado, la ficha, los agentes del grupo, el resumen y la maqueta. Va en PRs pequeños, cada uno con su
prueba en rojo y, si decide algo, su DD: H (lo que se corta) → los diálogos de Recursos (la parte de D1 que pidió
el usuario aparte) → D1 (estrategias y textos) → D2 (teléfono saliente) →
D3 (tiempos, horarios y música) → E1 (canales por familia y niveles) → E2 («Habilitado» y presencia) → E3 (canales
del agente) → E4 (asignar desde la lista y el panel) → G (maqueta y resumen enlazado) → F (listado).

**H · lo que se corta al bajar del todo** (sin DD: solo arregla):
- en Distribución y colas, al llegar al final, la rueda seguía con el documento: se iba la barra de arriba, el índice y
  el resumen se cortaban por arriba y quedaba una franja gris;
- la causa: el input de fichero oculto de «Música de espera» (`.visually-hidden`, `position: absolute`) no tenía
  antepasado posicionado, así que se colgaba del documento y lo alargaba: 160 px en el grupo 1, 206 en el 11 y 147 en
  el alta;
- `main.app-shell__content` pasa a `position: relative`. Medido en las 36 pantallas de `agrupacion`: el documento no
  sobra en ninguna, y lo único que toma esa zona por caja son textos ocultos;
- `documento-quieto.spec.ts`: tres en rojo contra el código anterior (206, 147 y 160) y seis pantallas largas de
  guarda.

**Los diálogos de Recursos** (sin DD: solo arregla):
- cada «+» de Recursos de la ficha abre un `sc-dialog` con el formulario de su pantalla, que seguía pintando su tarjeta
  (320 px con borde, sombra y radio), su título repetido y su propio `role="dialog"`. La ficha le pasaba `flush`, pero
  la entrada no existía;
- los tres formularios (repositorios, plantillas y etiquetas) ganan `flush`: sin caja, sin título y sin rol propio;
- cada diálogo se llama como su «+» («Nueva tipificación», no «Nuevo/a tipificación»; «Nueva etiqueta», no «Nueva
  label»), y cada repositorio, su título de alta con género (`createTitleKey`; sin él, el genérico);
- `ficha-recursos-dialogos.spec.ts`: dos en rojo y una de guarda. Al arreglar los títulos, la de los «+» siguió en
  rojo por el `role` propio del formulario: cada parte de la prueba enrojece con su fallo;
- fuera: `sc-dialog` traía dos `role="dialog"` modales anidados (el `p-dialog` y su `section`), del DS: lo arregló
  DD-140 (#302). Y el ejemplo del campo de etiqueta dice «Nombre de la label», el vocabulario de la pantalla de Labels.

**D1 · las palabras de la ficha** (DD-141; el detalle y lo descartado, allí):
- las estrategias reparten conversaciones: «Menos conversaciones atendidas» (Teléfono y «Dentro de cada nivel») y
  «Menos conversaciones activas» (Chat);
- lo guardado con el nombre de antes se lee con el de ahora, sin subir versión: `createVersionedStorage` gana
  `normalize` (opcional), que usa `GroupsStore`; `GroupDefaultsStore` pone al día sus dos estrategias al leer. Sirve
  igual para los enlaces de E1 (WhatsApp → Chat);
- la prioridad solo cuenta en las entrantes; sale «Desbordar sesión» de la ficha y de Contact Center, y
  `overflowSession` se sigue guardando; cerrar el chat por inactividad nace con 5 minutos (las semillas, con sus 10);
- el tamaño de cola, un texto por modo; la tipificación, sin «(3)»;
- anchos medidos de nuevo: estrategia de teléfono 14.5rem y de chat 13.5rem, `tableMinWidth` 95.75rem; los
  desplegables de Contact Center, a 350 (`scale/25`): la escala no tiene peldaño entre 252 y 350;
- `ficha-grupo-textos.spec.ts` (8) y las reescritas: 13 en rojo contra el código anterior, cada una por lo que mide.

**La segunda revisión con el equipo** (2026-10-01, tarde) cambia el plan, que va en el plan de trabajo:
- el alta vuelve al índice con ✓ por sección y «Siguiente» (R, revierte DD-138);
- los tiempos, en desplegable con los valores del Contact Center validado (D3);
- la cola por agente, de 1 a 10 enteros y 2 por defecto;
- el nombre del grupo, fijo al bajar;
- «Eliminar», bajo el índice (G1), y escribiendo el nombre para confirmar, que ya pedía `sc-delete-entity-dialog`;
- los agentes del grupo, todos a la vista y sin marcar (E4, con la referencia del usuario «4. Agentes y revisión»).

Respuestas del usuario: Etiquetas fuera, guardada; «Caducar sesión»; los valores del Contact Center validado; borrar
escribiendo el nombre.

**D2 · el teléfono saliente** (DD-142):
- con Teléfono es obligatorio. Lo dicen el resumen, la barra («Crear grupo» y «Guardar» esperan), su campo y el
  punto de Distribución. En el alta, tras salir de su sección sin él; duplicar lo pide al enviar;
- se elige de `OUTBOUND_NUMBERS` (los asignados), sin escribir; el que ya tuviera un grupo sigue entre las opciones;
- «Caducar sesión»; la ayuda de Balanceada, corregida; Recursos sin Etiquetas tras `conEtiquetas` (el grupo
  conserva las suyas); el teléfono, nombrado por su rótulo (`ariaLabelledBy`);
- `telefono-saliente.spec.ts` (4) y las reescritas: 11 en rojo contra el código anterior.

**R · el alta vuelve al índice** (DD-143, que revierte DD-138):
- las tres altas, con la maqueta de la edición: índice, una sección en su caja con su cabecera, y el resumen;
- el índice dice lo que ya está y lo que falta: ✓ en la sección que se deja completa (`sectionsDone`, nuevo en
  `sc-form-section-nav`) y el punto rojo en la que se deja sin lo obligatorio; antes de abrirla, ninguna marca;
- «Atrás» y «Siguiente» al pie (`sc-alta-pie`): llevan al principio de la sección nueva, con el foco en su título
  (`llegarASeccion`). General sigue siendo la puerta del grupo, y la sección no va en la dirección;
- `seccionesDeAlta` (antes `pasosDeAlta`) guarda la sección abierta y las que se dejaron;
- `altas-indice.spec.ts` (12): nueve en rojo contra los pasos, dos de guarda, y la del punto rojo vista en rojo sin
  su regla; las que DD-138 pasó a los pasos vuelven al índice, y `revision` y `agrupacion` recorren el del alta.

**G1 · las fichas en tres columnas** (DD-144), pedido por el usuario el 2026-10-01:
- el índice, el contenido y el resumen arrancan a la misma altura; `.ficha-rail` es una rejilla con áreas;
- el título va en la columna del contenido, encima de la sección; el resumen, sin rótulo a la vista (su `h2`,
  `visually-hidden`, sigue nombrando la región); «Eliminar», bajo el índice, a 28 de su última fila;
- por debajo de 1340, como estaba;
- `fichas-tres-columnas.spec.ts` (9): ocho en rojo contra la maqueta anterior y una de guarda.

**G2a · el nombre fijo al bajar** (DD-145): `sc-nombre-fijo`, una copia muda de la cabecera en la columna del
contenido, de arriba abajo de la rejilla, con `sticky`. A partir de 1340 cae sobre la cabecera y se ve desde el primer
píxel; por debajo, al quedar fija. Texto pintado (`::before`) y clases propias; las anclas, apartadas
`--sc-form-anchor-offset`. Borrar ya pedía el nombre: ahora lo fija una prueba. `fichas-nombre-fijo.spec.ts` (9):
cinco en rojo y cuatro de guarda.

**G2b · el resumen enlazado** (DD-146): el rótulo de cada tarjeta del resumen de grupo lleva a su sección, y cada fila
a su sitio (el bloque del canal, el campo del número), con `llegarAAncla`. Enlaces de verdad en el primario, con
manita y subrayado al pasar; la tarjeta no se pulsa. `resumen-enlazado.spec.ts` (5): las cinco en rojo primero.

**Trampas del tramo:**
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

## ✅ 2026-09-29 · Contact Center fija con qué nace un grupo o un agente (DD-135), y las altas dicen lo que falta (DD-136) y van en pasos (DD-138)

> **Sello: #290 (`e490faf`), #291 (`4be46a5`) y los pasos, #295 (`7458351`), fundidos en `main`, con su CI de
> `main` en verde.**

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
- ✓ al dejar un paso completo, «Atrás» y «Siguiente» como atajos, y el paso no toca la dirección;
- el plegado es el de PrimeNG tal cual (0,2 s, `ease-out`). La línea entre pasos se despegaba al plegar, por un fallo
  de PrimeNG, y se arregla con `pt` en la envoltura del panel (`panelPt`).

`altas-pasos.spec.ts`: siete de ocho en rojo contra el código anterior (la octava, de guarda), y dos más en rojo con
el fallo puesto: el aire (49 con el margen de la tarjeta) y los títulos (h1 → h3 sin el h2 oculto). Las altas de otras
seis pruebas se reescriben para los pasos con `irAPaso()`. `altas-pasos-movimiento.spec.ts`, tres, con el movimiento
real: la línea a mitad del plegado (en rojo primero, 36 de 114), el plegado nativo y menos movimiento.

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
- ⚠️ El fin del plegado lo pone un temporizador de respaldo de p-motion (201 ms), no solo `animationend`. Para verlo
  a cámara lenta hay que retrasar ese temporizador además de las animaciones: si no, corta el plegado a mitad. Para
  medirlo a mitad, congélalo en el mismo fotograma en que empieza (`altas-pasos-movimiento.spec.ts`).
- ⚠️ En el plegado del Stepper, la caja mide X·contenido y su fila X·caja: lo que se estire a la fila (la línea entre
  pasos) se queda corto, y lo que mide su contenido no. Poner el panel en bloque no cambia nada: las dos X están
  dentro del `p-motion`.
- ⚠️ En la nube se corre como root, y `chmod` no le quita la escritura. Para simular que la config de git no se puede
  escribir, un `.git/config.lock` ajeno.

El tramo del 2026-09-28 (panel compacto, tipos de usuario y ayudas) vive en
`git show c6a9cd59:docs/handoff/supervisor-fichas.md`; su criterio sigue en DD-131, DD-132 y DD-133.

## SIGUIENTE — sin preguntar

0. **La revisión del 2026-10-01, en su orden** (tramo de arriba), con la segunda revisión: E1b → E2 → E3 → E4 → D3 →
   F (G termina con G2b, DD-146). E4, con la referencia del usuario «4. Agentes y revisión»: todos a la vista y sin
   marcar, búsqueda, filtro Todos / Asignados / Sin asignar, estado y canales. Cada uno con su prueba en rojo;
   la numeración de DD se mira en `origin/main` al empezar. D3 lleva los valores de tiempo del Contact Center
   validado: pídeselos al usuario si no están en el repo.

   **Lo que queda abierto de DD-133, DD-135 y DD-136:**
   - los selects rotulados con `<label for>` sin `ariaLabelledBy` que DD-133 no tocó: un gate que los cace;
   - los subtítulos de sección, sin revisar;
   - las ayudas de la lista de ajustes de Contact Center no se anuncian con su control (el DS no deja pasar
     `aria-describedby`);
   - el marcador de la foto de `sc-photo-upload` (DS), a 2,58:1: al arreglarlo, las altas de agente y usuario entran
     en `RUTAS` de `theme-contrast`.

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
- **Devs:** qué es «Audio saliente» (solo sale en el Figma; anotado en `groups-data.ts`; «Desbordar sesión» lo
  respondió la revisión de producto, DD-141), y el resto de preguntas abiertas de DD-121: el destino del desbordamiento, Email, el script de Web Chat, WhatsApp por
  agente y qué ve el cliente en cola si se toca un grupo activo.
- **Rafa:** revisar usuarios contra el Supervisor real.

**Trampas del frente:**
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
