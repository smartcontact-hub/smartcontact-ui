# Frente · Fichas de administración (agente, grupo, usuario) y Configuración del AED — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.
>
> Nace el 2026-09-16. El tramo anterior (las tres formas de ficha, 2026-09-15) vive en `design-system.md`.

## 🔶 2026-09-22 · La quinta forma de ficha («Una página + pestañas») pierde la caja del bloque principal

> **Sello: rama `comparar/fichas`, HEAD `3bb6d020`. NO se funde, y NO dispara CI** (`ci.yml` solo corre en push a
> `main` o en un PR: medido en sus líneas 36-39). Lo único que la ha verificado es `verify` + preflight en local.

**Qué es.** La variante `s` del comparador (`?variante=s`), la quinta. Nace de que Rafa miró «Resumen + panel
lateral» y dijo que no parecía una SaaS; pidió lo importante en una página con pestañas para lo demás. Luego lo
maquetó él en Figma (fichero «Gestión de errores», nodo `381:2463`) prescindiendo del componente sección.

**Las tres decisiones que la definen**, todas medidas a 1440 en la ficha de grupo 1:

- **Sin caja en el bloque principal, con caja en el formulario.** Una caja separa un grupo de sus vecinos y ese
  bloque no tiene vecinos: ES la página. Al quitarla los filos de entrada pasan de tres (108 / 146 / 147) a **uno
  (x=108)** y la tabla gana 76px. Las variantes con índice (`a`, `b`, `u`, `e`) conservan la caja y no se han movido.
- **El nombre del grupo es el título de la página** (`sc-text-h3-semibold`, el rol del `h1` de las nueve listas), y
  «Canales y agentes» baja a `body-semibold`. En la maqueta el título era «Canales y agentes» y el nombre vivía en
  una caja arriba a la derecha; eso pedía 933 de contenido y a 1024 ya no cabía. La banda de ahora pide 630 y **no
  necesita ningún punto de ruptura** dentro del rango soportado.
- **El ancho NO cambia de arquetipo.** La página sigue siendo `--rail` y la ensancha `.page__inner--rail.compare-tabs`
  en `_page.scss`, junto a la regla hermana de la variante `e`. Cambiar el modificador a `--list` la dejó a `0px` de
  relleno por los cuatro lados y `audit:page-anatomy` lo cazó dos veces: una página es de UN tipo.

**Página: 1.209px → 1.082px, de 1,43 a 1,28 pantallas.** Sin scroll lateral a 1440 ni a 1024.

**⚠️ Trampa del tramo, y es la que bloquea fundir.** `npm run e2e:supervisor` da **10 rojos que ya estaban** antes
de este trabajo: son los contratos que rompió la reestructuración de la ficha de grupo (`form-section-nav-legibility`
espera **3** secciones en el índice del rail y hay **5**; `list-table-grammar` busca «Agentes asignados» como item
del índice y ya no lo es). Dos de los diez fallan en `/admin/agentes/editar/1` y `/admin/usuarios`, que esta rama no
toca, así que no son de aquí. **Hay que actualizarlos antes de fundir nada de esta rama.**

**Abierto, en orden de coste:**
- Con los cuatro canales encendidos la cifra «Canales» se recorta a «Teléfono, Ch…» (el entero va en el `title`).
  Decisión de copy de Rafa: dejarlo, o poner «4 canales».
- En las variantes con índice el campo «Nombre» sigue midiendo 787px. Tocarlo cambia la ficha publicada.
- Falta aplicar la forma elegida a las fichas de agente y de usuario, y montar un tab group de verdad en el DS
  (hoy hace de conmutador un `sc-selectbutton`).
- **Transcripción del equipo (2026-09-22, sin trabajar).** Choca con lo construido: dicen que «teléfono asociado» y
  «prioridad» se tocan mucho y el nombre casi nunca, y aquí el nombre es el título y esos dos están tras una pestaña.
  Además piden renombrar «Anuncios» (nadie entiende el concepto) y bajar los canales de la tabla de agentes a acción
  secundaria.

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

1. **Cuando Rafa diga «lanza el script de huérfanos»**, ya habrá hecho tres cosas: publicar Smart-Contact-Icons
   desmarcando los 21 sets `Icon…` de Playground (son de otra sesión), aceptar la actualización en el Design System y
   arrastrar `dashboard` y `neurology` a Playground. Entonces sigue el `LEEME.md` de
   `~/Documents/Claude/2026-09 iconos-material/huerfanos/`: 13 `dashboard`, 8 `brain` → `neurology`, y `query_stats`
   y `graph_5` a 14 × 14. El script para solo si la actualización no está aceptada.
2. **Rescatar a `main` por PRs separados** (la rama no se funde). Medido el 2026-09-20 contra
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
