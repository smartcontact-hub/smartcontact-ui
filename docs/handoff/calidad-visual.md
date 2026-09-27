# Frente · Calidad visual — agrupación, revisión previa, datos de prueba y referencias — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**. Lo durable vive en `docs/`:
> las decisiones en DD-123, DD-124 y DD-125, la regla en AGENTS §«UX de pantalla» 9, el Kit en
> `docs/figma-pendiente.md` (fichas 15 a 17) y las referencias en `docs/referencias-contact-center.md`.
>
> **Por qué existe este frente.** Nace el 2026-09-27 de contrastar el repo con una lista de consejos de UI (espacio,
> agrupación, referencias, fotografía, iterar hasta estar contento, IA que critica en vez de diseñar). El repo era
> riguroso con la FIDELIDAD (tokens, componentes, el Kit) y no con el JUICIO visual: la agrupación no se medía y el
> primer filtro visual era el usuario. El sello va debajo del título de cada tramo; el de más arriba es el vigente.

## ▶︎ SIGUIENTE — sin preguntar

1. **Llevar a verde el PR del monitor** (el tramo de arriba), que va aparte porque #258 se fusionó antes de que
   llegara. No cambia ninguna foto de sc-docs: el anillo solo vive en el Supervisor.
2. **Pasar `npm run revision -- --datos editorial` por las pantallas que se enseñen** en la próxima demo: es el juego
   para juzgar cómo luce. Si algo se ve mal con nombres de negocio, se arregla en la pantalla, no en los datos.
3. **Lo que la tortura aún no estira** (DD-124, «Consecuencias»): los datos en memoria de Conversaciones y de los
   widgets del Dashboard. El editorial sí los alcanza, con `deGrupos` y `nombreDeGrupo`: el mismo molde serviría.

## ⏸️ ESPERANDO A RAFA — NO preguntar

- **Las fichas 15, 16 y 17 de figma-pendiente**: filas de formulario y radios a 14; la caja de sección a 17,5 arriba y
  abajo; el diálogo con formulario, botonera a 28 y 14 entre campos.
- **Si el juego editorial pasa a ser la demo pública** (DD-124): hoy es `?datos=editorial` y la demo sigue igual. La
  recomendación dada: dejar la demo como está y compartir el enlace con el parámetro fuera del equipo; y, si cuesta
  recordarlo, un selector «Juego de datos» en Configuración → Sistema → Datos, junto a «Restaurar datos de fábrica».
- **La regla R4, «aire que se suma», en la medida de agrupación** (recomendada, pendiente de su sí): de su borde a lo
  primero y lo último que tiene dentro, una caja mide su relleno y nada más. Caza lo de «Políticas de contraseñas»
  (39,8 en vez de 17,5) y lo del anillo del Dashboard (DD-125) sin decidir cuánto aire es el bueno.
- **Los análisis de Telegram y WhatsApp** viven en `~/Documents/Claude/2026-09 teardown admin usuarios-grupos/`, fuera
  del repo: traerlos a `docs/` para que otra sesión (o la nube) los pueda leer.
- **`npm run correcciones` en su máquina**: el registro de correcciones vive allí; en una sesión en la nube se pierde
  al cerrar el contenedor.
- **De gusto, visto en la revisión de Sistema**: dos de sus seis secciones llevan icono delante del título
  («Numeración especial» y «Regeneración de contraseñas») y las otras cuatro no. Ni regla ni prueba lo piden.

## ✅ 2026-09-27 (3) · El monitor del Dashboard, medido con la regla de densidad

**Sello:** rama `claude/ui-improvement-reddit-iykxgx`, sobre `origin/main` HEAD `a5619a2f` (#258 ya fundido).

**Qué pasó.**
- **Medido a 1440** (DD-125): su ritmo ya era el compacto y no se suma relleno dentro de las tarjetas. El blanco
  que se ve es de la rejilla de alto fijo. Sobraba una cosa: la flecha invisible de «ver el detalle» separaba el
  anillo de «de 9 conectados» 36 px; ahora van a 14, con su prueba (31,5 en rojo contra el build anterior). Sin
  verificar: la cabecera de la tabla de agentes nombra 10 y la tabla enseña 8.
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
