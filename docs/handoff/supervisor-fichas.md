# Frente · Fichas de administración (agente, grupo, usuario) y Configuración del AED — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.
>
> Nace el 2026-09-16. El tramo anterior (las tres formas de ficha, 2026-09-15) vive en `design-system.md`.

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

## ✅ 2026-09-16 · La ficha de grupo sigue a Voice, Configuración del AED › Grupos habla como ella y los iconos pasan a Rounded opsz 24

> **Sello: rama `comparar/fichas` (no se funde), HEAD `6e183821`.** Vivo: https://comparar-fichas.sc-supervisor.pages.dev ·
> fijo: https://4994b228.sc-supervisor.pages.dev · tarjeta «Fichas» del Lab (#207).

**Qué hay en la rama.**
- **Listas:** Servicios con teléfonos demo en el tooltip; WhatsApp con su logo, la única excepción a Material; exportar
  solo lo seleccionado; «ID» en vez de «Código»; edición masiva «de X a Y»; Email y Grabación en agentes.
- **«Activo» = sesión abierta** (definición del PM): Desconectado, Post-conversando y Administrativo se ven y no se
  cambian. Fuera la columna «Activación» y los «Activo» de agente y usuario; por grupo, «Atiende».
- **Ficha de grupo**, con tres fuentes: manual de Voice (`~/Downloads/aed_mu_mb.pdf`), SISMAC-1975 en COA y el Figma
  «Migración Voice a Smartcontact Supervisor» (`su0goUM3040xeCrvEPQhTK`).
  - Canales, estrategia y agentes van en una sección.
  - Estrategias del COA: fuera Aleatoria; Skills apagada con su motivo; Agente exclusivo se queda.
  - Ring All de 2 a 10; Niveles con subestrategia y nivel por agente.
  - Recursos. Anuncios y audio, con el texto de «Texto a voz» y el audio saliente. Avanzado, con tamaño de cola y
    desbordar sesión. Foto.
- **Configuración del AED › Grupos**: los mismos campos y palabras que la ficha; lo que guarda lo lee el alta
  (`GroupDefaultsStore`).
- **Las tres fichas:** guardar se queda en la ficha, como Contact Center; un alta navega a su edición.
  Identidad va primero al crear y al final al editar, también en «Una página».
- **Iconos en código:** Rounded 400, opsz 24, con la calibración 24/18 (DD-104). `icon-glyph-scale.spec.ts` mide con
  la familia real y vigila que ningún glifo salga recortado.

**Medido** con clics reales (chrome-devtools, localhost:4411 a 1440):
- Guardar y crear en las tres fichas.
- Los valores guardados en Configuración llegan al alta.
- Skills no se elige.
- Los números del Avanzado miden 175.
- Índice y página van en el mismo orden en las tres formas.
- 0 iconos recortados en 8 pantallas.
- El spec de iconos se pone en rojo con `overflow: hidden` forzado.

## SIGUIENTE — sin preguntar

0. **Pendiente de producto, de la ficha de grupo:** tres maneras de sacar a un agente de un grupo (desmarcar su canal,
   apagar «Habilitado», la papelera) y «Habilitado» con cero canales es un estado que no significa nada. Preguntar
   qué es «deshabilitado» frente a «sin canales» antes de dibujarlo. Y el número de WhatsApp sigue colgando de Chat.
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
   - ~~`list-page` (exportar la selección, ancho mínimo con columnas ocultas)~~ · ídem;
   - ~~`sc-bulk-edit-menu matchable`~~ y ~~`sc-select editable`~~ · entraron en **#218**, junto con
     `sc-section-card showHeader` y `sc-drawer width/topOffset`;
   - **las pantallas y el copy** — lo único pendiente, y lo bloquea la pregunta de producto de
     ⏸️ ESPERANDO (qué forma de ficha se queda). Son ~3.700 líneas en ~43 ficheros, más 932 de
     textos. El andamio de `admin/comparar/` (12 ficheros, 1.088 líneas: la barra `?variante=`,
     la guía «Qué mirar», el scroll-spy) **no se funde: se tira** cuando haya decisión.
   ⚠️ Antes de rescatar nada más, compruébalo contra `origin/main`: dos de los cinco puntos ya
   estaban hechos y el hand-off no se había enterado.
3. Probar con scroll real el scroll-spy de «Una página»: al hacer scroll por código no cambiaba la sección activa.

## ⏸️ ESPERANDO — no preguntar

- **Producto:** qué forma de ficha se queda (`?variante=a|b|e`).
- **Devs:** qué son «Audio saliente» y «Desbordar sesión». Solo salen en el Figma; están anotados en `groups-data.ts`.
- **Rafa:** revisar usuarios contra el Supervisor real.

**Trampas del frente:**
- ⚠️ `document.fonts.check()` da `true` con una familia que no existe. Para saber si la fuente de iconos cargó, mira
  `[...document.fonts]` con su nombre y `status === 'loaded'`.
- ⚠️ La opción apagada de `sc-select` (Skills) lleva `data-p-disabled` pero no `aria-disabled`: PrimeNG no la anuncia.
- ⚠️ Un formulario sucio deja colgado el `beforeunload` tras el HMR: navega con `handleBeforeUnload: accept`.
- ⚠️ El preflight no arranca si la memoria compartida pasa de tope (ficha >250 palabras o índice >1.000); lo mide
  `scripts/memory-shape.mjs`.
- ⚠️ En Figma, `importComponentByKeyAsync` se cuelga más de 200 s: usa un nodo remoto que ya esté en el fichero.
