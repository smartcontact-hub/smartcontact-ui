# Frente · Fichas de administración (agente, grupo, usuario) y Configuración del AED — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.
>
> Nace el 2026-09-16. El tramo anterior (las tres formas de ficha, 2026-09-15) vive en `design-system.md`.

## ✅ 2026-09-26 · La ficha de grupo sigue la visión de producto: índice lateral, canal por canal, panel rápido y alta en la ficha (DD-121)

> **Sello: rama `areses/sweet-fermat-r9cxzw`, PR #255, un commit por bloque.** El tramo del 2026-09-16 (la ficha que
> seguía a Voice, rama `comparar/fichas`) sale de aquí: `git show 9e25c83:docs/handoff/supervisor-fichas.md` (y el tag
> `archive/handoff-fichas-2026-09-16`, que apunta ahí).

**Qué pasó.** Llegó la visión de producto de grupos (2026-09-25): un documento que separa lo DICHO de lo que una IA
rellenó en una maqueta HTML y de lo inferido. Ni el documento ni la maqueta entran en el repo (es público): se citan
como «visión de producto de grupos (2026-09-25)». Se leyó con una regla de triaje (DD-121 §1) y se construyó en nueve
bloques con el vocabulario de la app, no con el de la maqueta.

**Qué cambia** (el detalle y lo descartado, en DD-121):
- Ficha de grupo con índice lateral (General · Distribución y colas · Recursos · Agentes) y resumen en tarjetas bajo
  el índice. Agente y usuario siguen con pestañas, a propósito.
- Chat, madre de Web Chat y WhatsApp; distribución y cola por canal (`phoneQueue`, `chatQueue`, `chat`, aditivos, se
  leen con `resolveGroup`); en la cola de teléfono, solo la música y la voz a la vista.
- La tabla de agentes del grupo gestiona composición: sin «Habilitado», al menos un canal, «Quitar» con un sentido.
- Panel rápido de agentes desde el listado y alta en la propia ficha, con General de puerta.
- Listado con una columna por estrategia y prioridad por rango (`sc-datatable` gana `externalSort`); valores por
  defecto por canal; la lista de agentes recorta los canales a los de su grupo.
- `CrossTabLockService` suelta el candado en `pagehide`: la ficha de grupo ya pinta el aviso de otra pestaña.

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

## ✅ 2026-09-23 · Los grupos pierden la cara y se crean con un diálogo corto (DD-119)

> **Sello: rama `arebury/remove-group-avatar-photos`, worktree `shipworm`, sobre `origin/main` `e1b8f5fd` (#242).**

**Qué pasó.** Del equipo: «las fotos en grupo no deberían existir». Medido en local: la foto se guardaba y no salía en
ningún otro sitio, y crear un grupo abría la ficha entera (5 pestañas, ~35 campos) cuando solo pide el nombre.

**Qué cambia.**
- **Sin foto ni avatar de grupo**: ficha, lista (fila de 54 a 44) y tabla de grupos de la ficha de agente (46 a 44).
- **Alta en diálogo** (`sc-group-create-dialog`): nombre y canales; lo demás, de los valores por defecto
  (`newGroupDraft` en `groups-data.ts`). Crear deja en «Canales y agentes». `/admin/grupos/crear` abre el diálogo.
- **Duplicar**, el mismo diálogo: «… (copia)», los canales del original, sus agentes; sin teléfono asociado.
- **Ficha solo de edición**: Identidad segunda (como #240), sin foto; Recursos, Anuncios y Avanzado sin caja.
- Nombre repetido avisado en vivo (alta e Identidad); la cabecera dice «918371548 · Prioridad: Media».
- Un grupo nuevo ya no enseña buscador sobre la tabla vacía, y el vacío nombra el botón que existe.

**Medido** con clics en local a 1440, claro y oscuro: alta, duplicado, avisos, grupo sin Teléfono. La cabecera, las
pestañas y el contenido caen en el mismo píxel que la ficha de agente (121/128/178/185). e2e tocadas en verde.

**Descartado por Rafa, y por qué** (DD-119): sin pestaña Identidad («no sé si puedo tocarlo como usuario») y un
«Editar datos» con diálogo (un «Aplicar» que no guardaba, y rompía el orden de las tres fichas).

**Integrado con #242** (la otra caja, fundida a las 21:50 sobre el mismo fichero): «Anuncios y audio» siempre en la
tira, apagada sin Teléfono; «Habilitado» en vez de «Atiende»; glifos de canal en la cabecera. Todo se queda.

**Trampa del tramo:** `main` se movió CUATRO veces bajo estos ficheros mientras Rafa miraba mi local (#237, #239,
#240, #242), y vio deshecho «lo que ya se había hecho». Al empezar no había nada que ver: hacía falta mirar a mitad
de sesión. Nace `scripts/hooks/main-drift-guard.mjs` (en cada mensaje de Rafa, LEARNINGS #21 ⚙️).

## ✅ 2026-09-22 · Laboratorio de administración: lista + ficha con las decisiones del teardown dentro

> **Sello: rama `arebury/supervisor-admin-lab-teardown`, worktree `humpback`.** Todo nuevo bajo
> `projects/supervisor/src/app/features/lab/admin/`; de lo existente solo se tocan `app.routes.ts`
> (una ruta) y los cuatro locales. **No toca ninguna pantalla de producto.**

**Qué pasó.** Del teardown de Telegram y WhatsApp
(`~/Documents/Claude/2026-09 teardown admin usuarios-grupos/SINTESIS.md`, bloques A y B) salieron
20 decisiones medidas. Este tramo las pone donde se pueden juzgar: en `/lab/admin/grupos` y
`/lab/admin/usuarios`, dentro del shell real (sidebar, barra, miga), al lado de `/admin/grupos` y
`/admin/usuarios`.

**Qué cambia.** Lista con su CTA arriba (`sc-list-page`) → ficha con el molde de siempre
(`page__inner--rail` + `sc-section-card`, acciones por `TopBarSlotService`). Dentro:

- **A1** · el tipo de usuario ES el paquete: elegirlo preselecciona sus casillas con
  `sc-option-cards`, y apartarse se cuenta en el índice y en la lista («Supervisor · 2 cambios»).
  Hoy `onTypeValueChange` solo escribe el campo.
- **B12** · apagar una madre apaga las hijas de verdad, las deja pulsables y reencenderla las
  enciende todas. La regla vive en `toggleMother`/`toggleChild` (`admin-lab.model.ts`), no en la
  plantilla, así que se puede probar sin pintar.
- **B17** · cada fila del índice lleva su valor debajo del rótulo.
- **B1 · B4 · B6 · B11 · B14 · B15 · B18 · B19**, cada una con su código en el comentario.

**El interruptor «reproducir el fallo de hoy»** (botón flotante abajo a la derecha, mismo sitio y
mismo motivo que los controles de `/lab/sidebar`) apaga las dos reglas nuevas y enseña las dos
grietas en vivo, sin abrir el código.

**Medido**, no supuesto: el item del índice del laboratorio y el de `sc-form-section-nav` dan lo
mismo en el navegador — relleno 8,75 · hueco 5,25 · radio 12 · etiqueta 14/20/600 · rail 196. Lo
único que añade es la segunda línea.

**Tres hallazgos del código de HOY, que no son del laboratorio:**

1. **`checkbox-row--child` es una clase muerta.** La usa `user-form-page.component.html:195` y no
   está declarada en ninguna hoja: hoy una sección hija se lee al mismo nivel que su madre. Su
   sitio es `styles/_forms.scss`.
2. **`.table__td-name` está duplicada** en la hoja de cada lista en vez de vivir en
   `styles/_table-elements.scss`, con su hermana `.table__td-text`. El laboratorio la copia una
   cuarta vez, con la nota puesta.
3. **`sc-form-section-nav` no tiene `value` ni `disabled`.** `value` es literalmente B17;
   `disabled` es lo que impide forzar el orden de un alta. Si B17 se adopta, se añade `value` a
   `FormNavSection` y se borra la copia del laboratorio.

**Trampa del tramo:** la primera versión se construyó en `sc-docs` y se trasladó tal cual, con
componentes y espaciados propios. Veredicto de Rafa: «no casa con nada, se siente un pegote». Se
tiró entero y se rehízo con las piezas de la app. Si vuelves a este frente, **empieza por el
vocabulario que ya existe** (`_forms.scss`, `_page.scss`, `sc-list-page`) y dibuja solo lo que
propones.

Decisiones, lo que no cuadró con los tokens y lo que queda abierto:
`~/Documents/Claude/2026-09 teardown admin usuarios-grupos/LABORATORIO-decisiones.md`.

## ✅ 2026-09-20 · El contenido de página se ancla a la izquierda: el índice lateral deja de colgar (DD-115)

> **Sello: rama `arebury/candlefish`, sobre `origin/main` HEAD `84f37bd5`.** Un solo fichero de código:
> `projects/supervisor/src/styles/_page.scss`.

**Qué pasó.** Llegó de fuera del equipo que el índice lateral «colgaba». Medido con sonda en local: el sidebar
está clavado al borde y `.page__inner` se centraba, así que entre las dos navegaciones había lienzo muerto —108px
a 1440 y 348 a 1920 hasta el índice de `--rail`— y las hermanas arrancaban en cuatro verticales distintas a 1920
(80 / 200 / 520 / 584).

**Qué cambia.** `.page__inner` pasa a `margin: 0`, `--rail` a `margin-inline: 0` y `.page__form` a `margin: 0`.
**Los topes no se tocan**: 832 / 960 / 1100 / 1200 / 1600 siguen limitando el ancho de LECTURA. El contenido de
`--rail` sigue midiendo 920, el `Block` 393:12587. El porqué y las referencias medidas (GitHub, Meridian) están en
`docs/DECISIONS.md` DD-115.

**Medido** con sonda de navegador a 1440 y 1920, en Configuración del AED, Seguridad, Usuarios y Repositorios: las
cuatro arrancan en x=80 y el hueco hasta el índice es de 28 (el `padding` del molde) en cualquier ancho. En el
laboratorio del Sidebar de PrimeNG (`/lab/sidebar`) el sidebar mide 48 y la página arranca en 48: anclado, el
contenido no depende del ancho del sidebar, así que un cambio de marco no lo mueve.

`audit:page-anatomy` y las 35 pruebas de molde del Supervisor pasan **sin tocarlas**: miden tope, `padding`, `gap`,
rail de 196 y los 920, no el margen.

**Trampa del tramo:** las capturas de `projects/sc-docs/public/usage/` son del 2026-09-07 y aún enseñan el sidebar
de 64px y el contenido centrado. No sirven para comprobar esto; regéneralas con `npm run usage:capture`.

## SIGUIENTE — sin preguntar

0. **Validar con producto la ficha de grupo nueva** (DD-121). Si se da por buena, lo siguiente es el mismo índice
   lateral en las fichas de agente y usuario. Las preguntas abiertas para producto y desarrollo están en DD-121
   («Consecuencias»). Resuelto ahí lo que aquí estaba pendiente: sacar a alguien del grupo es solo «Quitar», no hay
   «Habilitado» en el grupo, y el número de WhatsApp ya no cuelga de Web Chat.
   Pendientes pequeños del tramo: las fichas de agente y usuario calculan `conflictWarning` y no lo pintan (el
   candado ya se suelta al recargar, así que pintarlo es seguro); `sc-group-create-dialog` conserva un modo alta que
   ya no abre nadie (solo duplica); el `role="tab"` de `sc-form-section-nav` (DD-113); y «Eliminar» en rojo de texto
   mide 3,76:1 (conocido en `theme-contrast`).
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
   - **las pantallas y el copy** — para GRUPOS ya no aplica: su ficha nueva (DD-121) no sale de `comparar/fichas`.
     Para agente y usuario lo bloquea la pregunta de producto de ⏸️ ESPERANDO (qué forma de ficha se queda). Son ~3.700 líneas en ~43 ficheros, más 932 de
     textos. El andamio de `admin/comparar/` (12 ficheros, 1.088 líneas: la barra `?variante=`,
     la guía «Qué mirar», el scroll-spy) **no se funde: se tira** cuando haya decisión.
   ⚠️ Antes de rescatar nada más, compruébalo contra `origin/main`: dos de los cinco puntos ya
   estaban hechos y el hand-off no se había enterado.
3. Probar con scroll real el scroll-spy de «Una página»: al hacer scroll por código no cambiaba la sección activa.

## ⏸️ ESPERANDO — no preguntar

- **Producto:** qué forma de ficha se queda en agente y usuario (`?variante=a|b|e`); en grupos, validar el índice
  lateral de DD-121.
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
