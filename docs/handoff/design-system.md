# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
>
> **El sello vive en CADA TRAMO, debajo de su título. El de más arriba es el vigente.**
> Aquí no se copia: esta cabecera no tiene estado, así que dos sesiones a la vez no se pisan
> en ella. Antes sí lo tenía (un bloque con el sello vigente más cuatro «Sello anterior» que
> repetían el resumen de su sección) y era justo lo que se peleaba en cada fusión: el 2026-09-04
> se coló un párrafo DUPLICADO al resolver un conflicto, y nadie lo vio.
>
> **Cómo se nombra un tramo**: `## ✅ <fecha ISO> · <lo que pasó>`. Sin contador `sNN`, que era
> un entero global que dos sesiones en paralelo no pueden incrementar a la vez: el 2026-09-04 las
> dos se llamaron «s43» y hubo que renumerar una al rebasar. La fecha no necesita que nadie se
> coordine. Los `sNN` de los tramos viejos se quedan como están: los nombran commits y
> `docs/DECISIONS.md`, y reescribirlos solo desincronizaría el doc de su propia historia.

## ✅ 2026-09-05 · El botón del supervisor medía 33 y el input 36, y no era cosa de tokens

**Sello:** HEAD `b383696`, en el [PR #40](https://github.com/smartcontact-hub/smartcontact-ui/pull/40).
**CI VERDE**, leído con `npm run ci:verdict` sobre ese mismo HEAD: los cinco jobs en
`success` (`verify`, `build`, `e2e-smoke`, `e2e-cuscare`, `e2e-supervisor`).
Carril `preflight:scope` COMPLETO en verde sobre el árbol final: `guard:lockfile`, `verify`
(29 gates), `build:docs`, el build de producción del supervisor, **e2e sc-docs 78 passed** y
**e2e supervisor 127 passed**.

**El diagnóstico, en una frase**: el supervisor sí lee los componentes y sí lee los tokens; lo
que pasaba es que una regla suya SIN CAPA le ganaba al tema por reglamento del cascade.

### Lo medido, no lo supuesto

En `/config/aed/servicio`, con el mismo `padding` (7/10.5px), el mismo `font-size` (14px) y el
mismo borde, el botón salía a **33px** y el input a **36px**. La única diferencia era el
`line-height`: `normal` en el botón, `20px` en el input.

Enumerando las reglas que le llegaban al botón salieron cuatro, y la ganadora era la del propio
supervisor:

| Regla | Capa | Qué decía |
| --- | --- | --- |
| `.p-component.p-button` (preset del DS) | `@layer primeng` | `var(--p-app-typography-md-line-height)` = 20px |
| `.p-button` (app, `main.scss`) | **sin capa** | `normal` |

CSS sin capa gana SIEMPRE a CSS en capa, sin mirar la especificidad. Por eso empujar tokens no
podía arreglarlo: no había token que empujar, había una regla que no escuchaba.

El parche llevaba su propio motivo escrito («no es token de botón en el preset»), y ese motivo
había caducado: DD-39 unificó el line-height md y el preset ya lo publica.

### Quién arbitró el `sm`

El comentario del parche defendía 27.5px citando un nodo de Figma (Kit Pro 7593:168546). Eso es
la medida de un nodo, no un token. Lo que dicen los tokens del Kit
(`projects/design-tokens/scripts/kit-export-dtcg.json`) es que **no existe** altura ni
line-height de botón, y que:

```
common.button.padding.x/y     → {form.field.padding.x/y}
common.button.sm.padding.x/y  → {form.field.sm.padding.x/y}
```

Alias por REFERENCIA. El Kit modela el botón y el campo como la misma caja. Así que el `sm` a
30.5px es lo que piden los tokens, aunque contradiga aquella nota.

### Antes y después, en las tres pantallas del hub

| Pantalla | Botón md | Botón sm | Campos |
| --- | --- | --- | --- |
| `aed/servicio` | 33 → **36** | 27 → **30.5** | 36 (x4) y 50 (x1), sin cambio |
| `aed/agentes` | 33 → **36** | no hay | 36 (x2), sin cambio |
| `aed/grupos` | 33 → **36** | no hay | 50 (x8), sin cambio |

El campo a 50px NO es este bug: es la variante IFTA (etiqueta dentro, 21px de padding arriba),
y es deliberada.

Barrido de regresión, porque el parche era app-wide: todos los `.p-button` visibles quedan a 36
(md) en `/admin/usuarios`, `/admin/agentes`, `/admin/grupos`, `/admin/plantillas`,
`/admin/labels`, `/config/sistema` y `/config/seguridad`. Las filas de tabla siguen a 53.5px
(los kebab de fila no son `.p-button`). No hay ningún `.p-button` escrito a mano en plantillas,
así que nada se queda heredando el `line-height: 1.5` del reset, que era el miedo original.

### Lo que queda abierto (medido aquí, sin tocar)

El supervisor tiene **65 reglas sin capa** que caen sobre selectores de PrimeNG, y **24 pisan una
propiedad que el tema también publica**. La mayoría parecen deliberadas (micro-interacciones de
DD#21, piel de severidad del toast, tamaño de los paneles de select). El botón era distinto
porque peleaba contra una regla de TAMAÑO de la que el Kit ya es dueño. Repasar las otras 23 una
a una pide criterio caso por caso, y es otro trabajo.

Contexto que lo explica: reglas globales `.p-*` por app son **supervisor 44, cuscare 5, agent 0,
sc-docs 0, agent-mini 0** (fuente; en runtime el supervisor expande a 65 por el anidamiento).
El supervisor es el único con una capa de override real encima del DS, y por eso es el único
donde el DS se ve distinto de lo que publica.

⚠️ Aviso caducado detectado de paso, sin arreglar: `NEXT-SESSION.md` dice que `:4280` es «el
único sin override», pero `playwright.config.ts` ya tiene `SC_DOCS_URL`.

## ✅ 2026-09-04 · El simulador de `/validar` se juega, y el veredicto lo pone quien practica

**Sello:** en `main` desde `aff232d` ([PR #36](https://github.com/smartcontact-hub/smartcontact-ui/pull/36)),
CI verde y **servido en `sc-doc.pages.dev/#/validar`**, comprobado ahí a clics.
Carril `preflight` COMPLETO en verde sobre el árbol final: `verify` entero, los 4 builds y las
tres suites e2e (**78 + 127 + 100**). CI verde leído con `npm run ci:verdict` en tres HEAD de esta
rama (`0d1ee36`, `b40cba2`, `6676f60`).

⚠️ Un sello con SHA **caduca al rebasar**, y esta rama rebasó tres veces en un día porque `main`
se movió debajo. Si el SHA no existe, mira el PR: el número no cambia. Sellar por PR y no por
commit es el siguiente paso obvio de esto, y está sin hacer.

**El diagnóstico, en una frase**: «Practícalo aquí» no era una simulación, era una demostración.
Dabas a una misión y el panel ya traía el token en verde, así que **la única pregunta que la guía
existe para enseñar («¿esto sale de una variable?») se contestaba sola**. Se leía; no se practicaba.

**Lo que hay ahora** (todo en `projects/sc-docs/src/app/pages/validar/practica.component.*`):

- **Bucle de juzgar y localizar.** El origen sale tapado con `?`. Se pregunta por el bloque
  entero y, si dices que hay algo a pelo, **hay que señalarlo**. 21 comprobaciones, 5 con defecto.
- **Tres rondas** con escenas vivas: chip (1 defecto), botón (2) y un aviso con **caja y texto
  dentro**. Esa tercera practica la trampa que la guía cuenta en «La caja y el texto de dentro» y
  que el simulador no ejercitaba: la tipografía se juzga sobre el TEXTO, y si tienes seleccionada
  la caja el panel te lo dice en vez de dejarte fallar.
- **El buscador es un `input` de verdad** sobre el catálogo entero de 24 propiedades, como el
  «Computed» real. El término de cada dimensión pasó a ser SUGERENCIA (placeholder y tarjeta), no
  filtro: `font` esconde `line-height` y `color`, que son parte de lo que hay que juzgar.
- **La prueba del algodón**, desbloqueada al cerrar una ronda: cambia el tema SOLO en la escena
  (`.sc-dark` sobre el lienzo, sin tocar el de la página) y enseña qué color se mueve.
- **Marcador con racha e informe final** con lo que se escapó.

Se mantiene lo que sostenía la versión anterior: **ningún número está escrito**. Todo sale de
`getComputedStyle` sobre elementos vivos y el origen se resuelve contra los `--sc-*` del documento.

### Los siete defectos que solo aparecieron al EJECUTARLO

Ninguno se veía leyendo el código. El primero estaba en `main` desde s42.

1. **El defecto plantado del borde era un token.** El `#c6ccd6` del chip es `--sc-text-disabled`
   **y** `--sc-color-slate-300`: solo «funcionaba» por no estar esos dos en la lista de candidatos.
   Un roce en esa lista y el juego habría dado por buena una respuesta mala. Los cinco valores
   plantados de hoy están comprobados contra los **1013 `--sc-*`** del sistema: cero coincidencias.
2. **El oráculo nombraba tokens desorientadores por empate de valor**: el relleno de 14px salía
   como `--sc-font-size-200` (empata con `--sc-spacing-1`) y el texto blanco de un botón como
   `--sc-bg-surface` (empata con `--sc-text-on-accent`). Verdad, pero desorientadora en algo que
   enseña. Ahora se guardan TODOS los tokens que valen ese valor y se elige por familia según la
   propiedad.
3. **Volver a una comprobación ya cerrada enseñaba la pregunta de la anterior.**
4. **Señalar solo valía el primer culpable.** Con los cuatro paddings a pelo, acertar
   `padding-left` contaba como fallo.
5. **La prueba del algodón llamaba «no se movió» a una tipografía bien tokenizada.** El tema solo
   mueve COLORES: `--sc-font-size-200` vale 14px en claro y en oscuro. Ahora solo juzga colores y
   lo explica en el propio panel.
6. **Leer a media transición miente.** El fundido de 200ms de la escena devolvía el color de
   SALIDA, no el de llegada. Se apaga mientras se mide (`aplicarOscuro()`).
7. **El ancho se medía en su hueco real**, y un padre estrecho deja un Hug en su `min-content`:
   parecía fijo. Medido con el hueco a 30px, el chip crecía 4px (una palabra) y el botón, cero,
   siendo los dos Hug. Ahora se mide en un banco ancho y distingue las **cuatro** formas que
   nombra la guía: Hug, Fill, techo (`max-width`) y ancho clavado.

**Contraste**: en oscuro había texto del TEMA sobre fondos claros CLAVADOS del panel (el cartón
imita a Chrome), o sea casi invisible. Corregido: cero elementos por debajo de 4.5 en oscuro. En
claro quedan cuatro a 4.25, que son `--sc-text-subtle` sobre `--sc-bg-default`; **es la pareja de
tokens del DS**, medida igual en `.section-lead` y `.note` de la propia guía, sin tocar.

### Trampas medidas hoy, en orden de lo que más cuesta

- **La pestaña oculta del navegador falsea las medidas visuales.** El panel del previsualizador
  estaba oculto y con eso: el layout colapsa (`.pagina` medía 30px de ancho), los temporizadores se
  estrangulan a ~600ms, `requestAnimationFrame` no dispara y **las transiciones no avanzan nunca**,
  así que `getComputedStyle` devuelve el valor de salida para siempre. Perseguí un fondo blanco en
  modo oscuro que no existía. Antes de creerte una medida visual: `document.hidden` y
  `resize_window` a un tamaño real.
- **`npm run preflight:scope --run` NO corría nada, y estaba escrito así en 8 sitios.** npm se
  come el `--run` antes de que llegue al script, que lo busca en `process.argv`
  (`preflight-scope.mjs:147`). Medido: **6 segundos, 0 pasos ejecutados, sin marca `.preflight-ok`**;
  solo imprime el plan. Lo corrí dos veces creyendo que había pasado la cadena. La forma buena es
  `npm run preflight:scope -- --run`, y así lo hacía ya `.githooks/pre-push:44`: la AUTOMATIZACIÓN
  estaba bien y lo roto era la instrucción, incluido el mensaje con el que el propio guard te
  deniega el push (te mandaba a un comando que no hace nada, o sea a un bucle). Corregidos los 8:
  `CLAUDE.md`, `AGENTS.md`, `README.md`, `bash-guard.mjs`, `preflight-mark.mjs`, `DECISIONS.md` y
  dos del tramo s41 de este hand-off.
  **El agujero de gate**: `docs:coherence` comprueba que el SCRIPT exista, y `preflight:scope`
  existe; un flag que npm se traga le es invisible. Candidato a check nuevo: en la doc, un
  `npm run <script> --<flag>` sin `--` es siempre un error.
- **Un `ng build` a la vez que el `ng serve` del mismo árbol se pisan en `dist/`.** El servidor
  quedó sirviendo un bundle roto sin decírmelo (el error vive en su log, no en la página). Es el
  mismo choque que el hand-off de s42 apuntó entre DOS sesiones; también pasa con UNA sola.
- **`ng.getComponent(el)` es la forma rápida de auditar un componente entero.** En build de dev,
  `window.ng` da la instancia y `ng.applyChanges(c)` fuerza el repintado sin esperar a nada. Sacó
  la tabla de verdad de las 21 comprobaciones en UNA llamada; conducir el DOM a clics tardó 39
  minutos y se contaminó dos veces.
- **NO hay prettier en este repo** (solo `eslint .` y `.editorconfig`). Un `npx prettier --write`
  se trae la configuración por defecto: aplastó la indentación de los `@if` de la plantilla y
  troceó el `.ts` a 80 columnas cuando aquí se escribe hasta 125-341. Hubo que rehacerlo a mano.
- **Restaurar desde una copia vieja tira el trabajo posterior.** Para probar si un rojo de e2e era
  anterior, copié los tres ficheros al scratchpad, hice `git checkout --` y los devolví: la copia
  era de ANTES del último pulido y se perdió sin avisar. Si vas a hacer ese experimento, refresca
  la copia justo antes.
- **`npm run e2e` en local no es el gate de CI, y un `ng serve` viejo lo enrojece.** Sus 37
  baselines de captura están saltadas cuando `CI` está puesto (son por plataforma) y en este
  entorno mueren con `screencast.hideOverlays: Target page... closed`. Con `CI=1` la suite tarda
  **4,2 minutos** en vez de 39. Pero el dato que cuesta: contra un `ng serve` que llevaba horas
  vivo salía **1 rojo** (`sc-inputgroup`, esperando `getByTestId('ig-input')`), y llegué a
  confirmarlo con el árbol en `main` para descartar que fuera mío. Lo era del SERVIDOR: ese mismo
  proceso ya había escupido `Cannot find module '@smartcontact-hub/components'` al pisarse con un
  `ng build` mío. Levantado de cero, **78/78**. Antes de dar por «anterior» un rojo de e2e, tira el
  servidor y repite: reproducirlo en `main` demuestra que no es tu código, NO que sea del código.

### Lo que NO se tocó, a propósito

- Los defectos plantados viven en el `.scss` con su comentario: si alguien los «limpia»
  tokenizándolos, el simulador pierde lo único que de verdad enseña. Está dicho en el fichero.
- El cartón del inspector sigue con los colores de Chrome (11px, morado/azul), amparado por la
  exención por LÍNEA `sc-replica-navegador` de `token-guard`. Las líneas nuevas la llevan escrita.
## ✅ 2026-09-05 · Segunda pasada del mapa: dos defectos en 18 componentes

**Sello:** en la rama `feat/segunda-pasada-conexion`. Solo doc y una línea de la página; sin tocar
Figma, porque los accionables cambian el dibujo y eso lo decide Rafa.

**La pregunta que faltaba.** El mapa marcaba 92 variables como «no la usa ninguna capa», y esa
marca no se puede dar por buena sola: puede significar que **no hay dónde atarla** o que **hay una
capa a mano** que debería usarla. Se contesta al revés: en vez de mirar la variable, mirar qué
capas llevan un valor escrito a mano en una propiedad para la que SÍ existe variable.

**La sonda necesitó tres filtros, los tres nacidos de falsos positivos propios**, y sin ellos
miente a lo grande:
1. Excluir el marco del propio component set (andamiaje de Figma).
2. Comprobar que la variable existe. El Tag tiene 29 grosores a mano y **no existe
   `tag/border/width`**: hueco del modelo de PrimeNG, no despiste.
3. Comprobar que la capa PINTA. El Button dio 732 capas con relleno crudo y **ninguna pinta**:
   516 tienen ancho cero. Sin esto, el componente más grande sale como el más roto.

**Resultado: dos defectos de 18.** El resto es hueco del modelo, anillo de foco, capas que no
pintan o componentes anidados. Detalle completo en
[`docs/conexion-variables.md`](../conexion-variables.md) §«Segunda pasada».

- **InputText, tipografía a medio conectar.** 660 capas de texto: **108 atadas, todas a variables
  del DS** (cero remotas) y **552 sueltas**, con tamaños fuera de escala. `Label` está a medias:
  48 atadas y 48 sueltas con el mismo valor. ⚠️ **Corregido el 2026-09-05**: la primera versión
  decía que las 108 iban a la librería remota, y era FALSO. La sonda leía `boundVariables` por
  acceso directo en vez de enumerando, y devolvía enlaces sin resolver que interpreté como
  remotos. Detalle en el doc. Ninguna usa estilo de texto (comprobado, era la
  primera sospecha de falso positivo). Y dentro del mismo componente hay TRES situaciones: hay
  variable y no se usa (sm y lg), la variable vive en otro sitio del que crees (el tamaño normal
  lo gobierna `app/typography/md/fontSize` porque PrimeNG **no modela** un font-size de raíz
  para `inputtext`, y el 14 llega porque nuestro bloque global pisa su `1rem`), y no existe el
  modelo (Label y Helper Text no son de PrimeNG).
- **Menu, el popup no sigue el oscuro.** `Menu=False` y `Menu=True` de `menu-popup` llevan el
  fondo blanco a mano mientras el resto usa `menu/background`. En claro no se nota (esa variable
  resuelve a blanco); en oscuro el tema manda `surface.900` y estas dos se quedan blancas. Atarlas
  no cambia el claro y arregla el oscuro.

**Lo mejor conectado**: Select y MultiSelect, con 7.982 y 8.234 enlaces al DS y **cero remotos**.

**Y del lado del consumidor, medido con la VPN puesta**: **cero overrides y cero valores de diseño
a mano** en sus 21 rutas. Validado con un control, que es lo que faltaba antes: la misma sonda
encuentra 1.450 declaraciones en las hojas del tema y ninguna en las suyas. Esto **corrige** una
medida anterior que decía «el Tag tiene 13 overrides»: aquellas reglas LEEN el token, no lo pisan.

**Aviso de terreno, otra vez.** Esta sesión perdió sus ediciones sin commitear cuando otra cambió
de rama en el mismo working tree. No se perdió nada porque la otra sesión las rescató en
`68c5af1`, pero **un worktree por tarea** sigue sin cumplirse y ya ha costado dos sustos.

## ✅ s43 · Mapa de conexión de variables Figma → tema → navegador

**Sello:** 2026-09-04, HEAD `1779914`, CI VERDE leído en los dos PR (`9036856` del #35 y
`1779914` del #37, 5 jobs cada uno). El mapa queda **cerrado**: 816 filas, 18 componentes, CERO
pendientes, vivo en `sc-doc.pages.dev/#/conexion`. Dos hallazgos, y el segundo cambia cómo se lee
el primero. Uno: el defecto dominante no son las variables sueltas sino las **mal apuntadas** (9
de las 12 atadas). Dos: lo que queda **no es deuda de conexión sino de DIBUJO**, porque el tema
se genera desde las variables y el valor llega bien a producción; el que va por detrás es el Kit.
Escrito por la sesión paralela a la del simulador; las dos se llamaron «s43» y esta se quedó el
número por llegar antes.

**Qué contesta**: para cada variable de los 18 componentes que publica el showcase del consumidor,
si está enganchada en Figma **y** si el CSS de PrimeNG la lee. Nace del caso del Tag, donde había
valores escritos a mano que se veían idénticos a los atados.

**Medido el 2026-09-03** contra el Kit y el CSS que sirve `ui.smart-contact.com`: 816 filas, 18
componentes. 636 conectadas, 88 «Figma no la usa» (34 son el anillo de foco, no atables, y 41
llevan `FALTA DIBUJARLO`), 79 solo web, y 11 que piden mirar algo. **12 variables atadas sin
cambio visual, 9 de ellas MAL APUNTADAS** (a la variable del estado vecino, de otro componente o
de la librería remota), no sueltas: ese es el defecto dominante, y el cruce no lo ve solo, porque
sí hay enlace.

**Lo que quedó** (mismo reparto que la galería de uso: captura manual → crudo versionado → script
puro → página + CSV → guard):

- `projects/sc-docs/public/variables/_variables-raw.json` — lo medido. Solo lo toca la sesión de
  medición, que necesita el puente de Figma y el navegador.
- [`scripts/variables-map.mjs`](../../scripts/variables-map.mjs) — `npm run variables:map` deriva,
  `npm run variables:check` es el guard.
- [`docs/conexion-variables.csv`](../conexion-variables.csv) y `_variables-status.json`, los dos de
  la MISMA ejecución, así que no pueden divergir.
- [`docs/conexion-variables.md`](../conexion-variables.md) — el método: las dos sondas, sus trampas
  medidas (el grosor de borde vive en los cuatro lados, no en `strokeWeight`; un valor con `var()`
  no aparece al enumerar propiedades) y los cuatro filtros. Fila nueva en `DOCS-INDEX`.
- Página `/#/conexion`, colgada del Lab. Verificada VIVA en el preview de rama, no solo en local.

**Nueve veredictos, no seis**: a los del cruce se suman los tres que solo ve una revisión a mano
(«mal apuntada», «muerta en el tema», «conectada por el primitivo»).

### Segunda tanda (2026-09-04): las 8 pendientes cerradas

En [PR #37](https://github.com/smartcontact-hub/smartcontact-ui/pull/37), mergeado como `1779914`.
Carril acotado de `preflight:scope` en verde (78 e2e) y **CI verde leído** sobre `319159c`: los
dos que el carril se salta en local, `e2e-supervisor` y `e2e-cuscare`, pasaron en el CI, que era
lo que había que ver.

**Tres de las ocho eran falsas alarmas**, las tres por contar una diferencia sin abrir el nodo:
- InputText: las 27 vinculaciones remotas cuelgan de `IconText` (`13282:10564`), instancia de OTRA
  librería **posada en la página** — su padre es la página, no el component set.
- `presence/*` y `text/accent` no están muertos: viajan por `--sc-*`. `presence` lo consume el
  Supervisor, `text-accent` sc-docs.
- `app/typography` está conectado: `sc-preset/extend.ts` lo DEFINE desde `--sc-*` y
  `sc-preset/css.ts` lo CONSUME. Ninguna capa tiene que usarlo.

**Las otras cinco son deuda de DIBUJO, no de conexión.** En las cinco el valor llega bien a
producción. El caso que lo demuestra, medido en su deploy: **42 de 42 iconos de botón toman el
color de su botón, y NO existe regla CSS que dé color propio a `.p-button-icon`**. PrimeNG no tiene
canal. Las 143 variantes de `button-small` con el icono derecho en el gris de la librería dibujan
algo que no puede ocurrir. Del DataTable sale un dato más fino que el anterior: los 8 iconos del
toggle son remotos en TODAS las variantes, no solo en hover.

**Lo que ganó el método**: la sección «Cuál de los dos lados manda» (encontrar una diferencia no
dice quién tiene razón; se contesta en tres pasos, empezando por si el canal existe siquiera) y
«Peticiones abiertas al consumidor», donde vive entera la del modal. Y dos veredictos más, hasta
once: `viaja por --sc-*` y `no es un hallazgo` — **un mapa que solo guarda los aciertos hace
repetir el trabajo descartado**, y hoy tres de ocho fueron descartes.

**El frente queda CERRADO.** El mapa está medido, vivo en producción y **gateado**: desde el
2026-09-04 `variables:check` corre dentro de `verify`, así que un commit que deje los derivados
viejos se pone rojo solo. No hay nada a medias esperando a nadie.

**Lo que queda son notas, no tareas.** Ninguna bloquea:

1. **La petición al consumidor** sobre el modal a medida, en
   [`docs/conexion-variables.md`](../conexion-variables.md) §«Peticiones abiertas al consumidor».
   **Decidido el 2026-09-04: se queda anotada y ya.** Está redactada por si se retoma; nadie la
   espera.
2. **El comprobador del zip del plugin**, sin escribir: ningún token a `0`, la base de los rem y el
   diff contra el zip anterior. Manual y con argumento, **no va en `verify`**. Las tres
   comprobaciones nacen de fallos reales y están descritas en el doc.
3. **La deuda de dibujo de las cinco abiertas es de Figma y no corre prisa.** No rompe producción:
   el valor llega bien. Lo que cuesta es que quien lee el Kit ve un color que el producto no pinta.
   La de `button-small` ni siquiera se puede arreglar, porque PrimeNG no tiene canal.
4. **Extender el mapa más allá de los 18 del showcase** cuando una card toque otra página del Kit.
   El método y la sonda ya están; es repetir la pasada, no inventar nada.

**Aviso de terreno**: esta sesión y la de s42 corrieron **en el mismo working tree** y se pisaron.
El reflog lo data: un cherry-pick de DD-48 sobre la rama ajena y un reset 30 segundos después, más
dos cambios de rama a media compilación (que tiró un build de cuscare por falta de
`@smartcontact-hub/icons`, y a la segunda pasó). No se perdió nada, pero **un worktree por tarea**.

## ✅ s42 · Figma iba por delante en 11 variables, y el gate no podía verlo

**Sello:** 2026-09-03, HEAD `7bb9aab`, CI VERDE leído en `516b911`, `6678a5b` y `7bb9aab`
(5 jobs cada uno).

**El disparador fue una duda de copy**: «la página de tipografía dice root 16, ¿no era 14?». El
root ES 16 (`html` a `100%`, medido en el build); el 14 que confunde es la base de la escala de
ESPACIADO (`--sc-scale-1`) y el cuerpo por defecto. Pero tirando del hilo salió lo de verdad.

**El hallazgo**: al rebasar los text styles del Kit (`Display` a 64/78, `h1` a 48/58) nacieron en
Figma 11 variables que nunca llegaron al export, y **`tokens:type-parity` decía «15/15 · al día»
con verdad**: va export → código, así que lo que está en Figma y no llegó al export le es
invisible POR CONSTRUCCIÓN. Contestaba una pregunta más estrecha de la que se le leía.

**Lo que quedó (en orden de aterrizaje)**:
- `65c3fa9` — la página de tipografía deja de invitar al error del root, y corrige dos cosas que
  decía mal: «dos pesos» cuando el sistema declara y usa CUATRO (medido: regular 16 usos, medium
  119, semibold 120, bold 28), y los snaps que estaban en el CSS sin aparecer en la doc.
- **Figma** — `app/typography/xl|xxl` tenían alias en Light y un **0 CRUDO** en Dark, 4 de 36,
  durante semanas. Igualadas al alias de Light. Escaneo previo: 110 páginas, 137.386 nodos, CERO
  consumidores, así que era una mina sin pisar. No se borran: la colección está publicada.
- `f18c676` — las 9 hojas del rebase clasificadas en `coverage-map.mjs` midiendo su consumo, no
  por el nombre. El guard «una talla NUEVA de `app.typography` va en rojo» NO se aflojó: su
  ejemplo era `xl`, que ya existe, y ahora apunta a `xxxl`.
- `c4925ba` — el snap `900` jubilado. Escribía 48 en vez de 64 Y emitía la línea DOS VECES (el
  paso salía en la lista del Kit y en la de snaps, que no deduplica). `emitRamp` ahora corta
  ruidoso con la instrucción dentro del mensaje.
- `6678a5b` (PR #34) — `--sc-font-size-900` = 64 y `--sc-line-height-900` = 78 en `main`.
- `7bb9aab` (DD-48) — **manda Figma en las escalas** (decisión de Rafa). `display-1` 32→64, `h1`
  32→48, `h3` 20→18. Regla nueva: *el consumidor que quiere otro tamaño nombra el PASO, no el
  rol* — sc-docs quiere 32 y ningún rol cae ya ahí, así que sus seis consumos pasan a
  `--sc-font-size-650`. Efecto en producto: UN sitio (`repositorios-hub-page`, h3 20→18).
- `9f37566` + `516b911` — la guía de `/validar`: los cuatro pasos llevan una SIMULACIÓN en HTML
  de lo que aparece en pantalla, y entra **«Practícalo aquí»**, un inspector de mentira que lee
  valores de VERDAD del chip real con `getComputedStyle` y dice de dónde sale cada uno. El borde
  del chip va sin token A PROPÓSITO: sin un caso real de «esto no usa la variable», la misión 4
  no enseñaría nada.

**El agujero, tapado**: `figma-parity.mjs` ya no es solo color. Cubre la letra Y comprueba que
cada variable de tipografía valga lo mismo en TODOS los modos. `npm run figma:parity <volcado>`,
snippet en el README de design-tokens. Corrido contra el fichero del DS con el bridge:
**36/36 en valor y 36/36 en modos**. Sigue siendo manual: necesita el bridge, no puede ser gate.

### ⚠️ Trampas medidas hoy, en orden de lo que más cuesta

- **Dos sesiones en un worktree comparten `dist/` Y la rama.** Tres preflights murieron con
  `Cannot find module '@smartcontact-hub/icons'` / `components`, que engaña porque parece una
  dependencia rota: era la otra sesión reescribiendo `dist/` a la vez (verificado por `ps`: su
  `ng build` borró `dist/ui-smartcontact-icons/package.json` entre dos lecturas mías). Peor: esa
  sesión se llevó el checkout a una rama nueva y **leí su `git log` creyendo que era `main`** —
  parecía que me habían borrado el commit. Antes de leer historia o cherry-pickear:
  `git rev-parse --abbrev-ref HEAD`. **Desde el 2026-09-03 se trabaja en worktree propio.**
- **Mergear un PR cuenta como PUSHEAR**: hay que leer `npm run ci:verdict` igual. Me lo cazó el
  stop-hook después de mergear el #34 y darlo por hecho.
- **`ci` se SALTA a propósito en `design-tokens-sync`** (está escrito en `ci.yml`): el gate real
  de ese PR es `tokens-sync`. Un `action_required` ahí no es el bloqueo que parece.
- **Pushear «Tokens» sin cambios = commit VACÍO = el workflow NO dispara** (su filtro es
  `paths: [kit-export-dtcg.json]`). Y **«Push Theme» mete 170 ficheros de `.theme-designer/`** en
  la rama saltándose el `.gitignore` (empuja por API, no con git). El sync los borra al
  auto-curarse, pero solo si VUELVE A CORRER: si el push de tokens iba vacío, se quedan y el PR
  se los lleva a `main`. Relanzar `tokens-sync` es la cura.
- **Un snap no se jubila solo.** Quedan 9 vivos (font-size 50·75·600·700, line-height
  50·220·400·600·700). Cuando Figma publique uno, el generador ahora lo dice.

## ✅ s41 · La guía se sirve en el punto de decisión (DD-47)

**Sello:** 2026-09-02, HEAD `7d343a9`, CI VERDE en los tres commits (`f116bbd`, `718d149`,
`7d343a9`).

**Diagnóstico medido**: `LEARNINGS.md` había pasado de 1.765 a 10.757 palabras en 46 días con el
tope "~20" escrito en su cabecera; 16 reglas escondían 43 sub-entradas; la regla más larga (#7,
2.180 palabras) era la más rota (≥8 reincidencias con la prosa delante); en una sesión con 6
compactaciones se releyó entera 5 veces. La causa no era "mucho texto": nada presentaba la regla
en el momento de escribir el comando, y el único enforcement (gates) corría en el push.

**Lo que hay ahora, todo en un commit**:
- `.claude/settings.json` (versionado) → `scripts/hooks/bash-guard.mjs` deniega, con la regla
  como motivo: push sin marca `.preflight-ok` sobre ESTE árbol, `echo $?`/tubo detrás de un gate,
  volcado de configs con credenciales, `git diff main...rama`, `for f in $VAR`. `stop-guard.mjs`
  bloquea el cierre una vez si hubo push sin `npm run ci:verdict`. `compact-card.mjs` avisa al
  compactar si la guía cambió en `origin/main`. Salida explícita: `# sc:ok`, dicho en el mensaje.
  Cada patrón con caso rojo y verde (`scripts/__tests__/bash-guard.test.mjs`).
- `scripts/preflight-mark.mjs`: `preflight`, `preflight:fast` y `preflight:scope -- --run` dejan la
  marca (tree id del working tree; solo vale si ese tree es HEAD). `ci-preflight-parity` la filtra.
- Tarjeta de 7 preguntas en `CLAUDE.md` (viaja en cada turno, sobrevive a la compactación).
- `LEARNINGS.md` recortado a 16 reglas de ≤12 líneas con UNA `Evidencia:`; la historia entera en
  el tag `archive/learnings-2026-09-02` y en `git log -S`. Check K (`scripts/learnings-shape.mjs`)
  impide que vuelva a crecer por dentro.
- `/reflect` enruta hook → gate → tarjeta → regla → memoria; memoria solo terreno (65 → 40
  ficheros, los 25 duplicados en `memory-archive-2026-09-02/` fuera del repo).

**Cómo se probó, y el guard cazándose a sí mismo CUATRO veces.** Dos falsos positivos: prosa con
"git push" dentro de un `printf`, y un heredoc de Python que contenía `npm run lint`. Se arreglaron
segmentando por comando y descartando los cuerpos de heredoc. Dos aciertos contra su propio autor:
`npm run -s ci:verdict …; echo` (los flags entre `run` y el script se colaban, `718d149`) y
`node --test … | tail` (el runner enmascara el exit igual que `npm run`, `7d343a9`). Los cuatro
son casos rojos del test. Cadena completa antes de cada push: 213/213 unitarios, 14 checks de doc,
e2e 78 + 127 + 100.

`.githooks/pre-push` (s39) sigue ahí y ahora honra la marca: si el árbol ya pasó un carril, sube
sin repetir la cadena. Antes la repetía en CADA push, y así "colgó" el primero de s41 (10 min
sobre un árbol recién verificado). Es la evidencia que afiló `LEARNINGS #10`: en el diagnóstico
enumeré los ficheros que se LEEN y no los mecanismos que se EJECUTAN, y este hook ya existía.

⚠️ **Cómo repetirlo sin tropezar**: el hook exige la marca sobre el árbol FINAL. Commitea TODO
(hand-off incluido) y CORRE LA CADENA DESPUÉS, nunca al revés; un commit posterior invalida la
marca y el push se queda fuera. Para un cambio solo de `.md`, `preflight:scope -- --run` elige el
carril corto (verify + build:docs + e2e smoke) y deja la marca igual.

## ✅ s40 · Tipografía end-to-end y SISMAC-4074 resuelto

**Sello:** 2026-09-02, HEAD `fe0a442`. Gate verde leído del log (78 e2e) y CI verde en los dos
commits. Doc nuevo: [`docs/tipografia.md`](../tipografia.md).

**En Figma.** Los estilos de texto pasaron de 11 sueltos a **12 en carpetas** (Display, Heading,
Body, Caption), con los valores literales de SnowUI y atados a variable en las cuatro propiedades:
familia, tamaño, peso e interlineado. Los **761 textos** del DS siguieron a sus 5 componentes padre,
sin tocar ninguno a mano. 11 variables nuevas en `Custom`: la familia Inter, cuatro estilos de
fuente (STRING, que es lo que Figma necesita para atar el peso de un estilo), el paso 900 (64/78) y
las parejas `xl` y `xxl`.

**El mapa del tema quedó en cinco tallas**, `sm md lg xl xxl`. Antes eran tres y dos huecos: los
títulos de card, dialog y modal (18) y los de drawer y overlay (20) no tenían pareja publicada, así
que un dev no tenía forma de saber qué interlineado les tocaba.

**El diagnóstico de SISMAC-4074, medido componente a componente** en el deploy del dev. La causa
raíz no es el export: **PrimeNG no modela `lineHeight` en ninguno de los 85 componentes**, así que
el valor llega y no hay nada que lo aplique. Y no eran cuatro selectores como decía el hand-off
anterior, eran **seis**: tag, detalle del toast, breadcrumb, context menu, y opciones de select y
multiselect.

**El entregable**: `sc-typography.css`, 7 reglas. Barrido sobre `.p-component` en vez de lista, y
las variantes de tamaño por patrón, así que cubre los componentes de hoy y los futuros sin volver a
tocarlo. Probado en 8 páginas del showcase con todas las variantes: cero recortes, cero
solapamientos.

### Dos falsos positivos que casi llegan a Jira
- **El `"400px"` de los grosores no rompe nada.** El export los declara con unidad desde el primer
  zip que conservamos, y aun así la variable llega limpia: **PrimeNG normaliza la unidad**. Se llegó
  a preparar una corrección de cuatro líneas y se retiró tras medirlo.
- **El respaldo desactualizado de `md` (21px) tampoco.** Nunca entra, porque la variable sí resuelve.

Los dos se afirmaron antes de medirlos. De ahí salen los afilados de LEARNINGS **#1** (el estímulo
tiene que ser el que el sistema produce, no uno que inyectaste tú) y **#12** (un selector CSS es un
grep sobre el DOM: `[class*="p-"]` daba 2.820 «elementos», los componentes reales eran 271).

### Terreno que conviene no volver a descubrir
`ui.smart-contact.com` es **el deploy del dev**, no nuestro sc-docs. Su CSS de tipografía sale del
bloque `css:` del preset, o sea es nuestro, en una versión anterior. Y la familia no viaja por el
tema: **0 componentes del export la declaran**. En su web el `:root` sí usa nuestro
`--sc-font-family-primary`, pero el `body` usa un token propio suyo que nosotros no publicamos, con
respaldo a Arial. O sea que el resultado (Inter) es correcto, pero **no llega solo por nuestro
canal**. Todo eso, con su método, en [`docs/tipografia.md`](../tipografia.md).

## ✅ s39 · Guía de validación en sc-docs + el gate deja de depender de la memoria

**Qué hay nuevo:** una guía en `/#/validar` que explica cómo medir un componente en el navegador
(las 7 dimensiones —tamaño, tipografía, fondo, borde, esquinas, espaciados, sombra— y si el valor
viene de una variable o está escrito a mano). Está enlazada desde el **Lab → «Código y diseño»**,
escrita para perfiles que no leen código, y todas sus cifras están medidas en producción, no
deducidas. Lleva una clave de cortesía (en el componente) para que no se abra por accidente.

⚠️ **Esa clave no es una medida de seguridad, y conviene no presentarla como tal**: es una app
estática y el bundle viaja al cliente, así que el valor es legible desde el navegador. Sirve para
evitar aperturas accidentales. Queda dicho también en el componente y en la ruta.

### El camino que NO hay que repetir
Se evaluó proteger la guía con **Cloudflare Access** y no es viable con el montaje actual:
sc-docs enruta por hash (`withHashLocation()`, `app.config.ts:24`) y el fragmento `#…` **no viaja al
servidor**, con lo que Access solo podría cubrir el sitio entero. Se probó sacarla a una página real
bajo `public/` para poder filtrarla por ruta, y ahí apareció el límite de fondo: **Access exige una
zona activa propia** y `pages.dev` pertenece a Cloudflare. Se revirtió a la SPA.

**Para futuras decisiones:** proteger de verdad una ruta de sc-docs pide dominio propio + custom
domain + Access + un Bulk Redirect que cierre el `pages.dev`. Es una decisión de infraestructura,
no de front, y solo compensa si el contenido lo justifica.

### El hook, y por qué existe
LEARNINGS **#7** («preflight antes de push») acumulaba **tres afilados** (`3b90fd7`, `720bf6e`,
`3fcfa8b`) y seguía incumpliéndose. El diagnóstico no es la redacción: la regla se lee al empezar la
tarea y su disparador salta horas después, cuando ya no se está pensando en ella. Una regla que
depende de recordarla en el momento exacto no se cumple sola.

`.githooks/pre-push` lanza `preflight:scope` antes de cada push y aborta si falla. Se activa con
`npm run hooks:install`; la salida de emergencia es `SKIP_PREFLIGHT=1 git push`, y avisa por pantalla.
**El mismo día de montarlo detuvo tres cosas** que ya se habían dado por buenas: 51 violaciones de
tokens, un `eslint.config.js` que no parseaba, y 2 violaciones más al restaurar un componente.

⚠️ **Trampa medida, aplicable a cualquier gate:** `npm run preflight | tail -40` devuelve el código de
salida del **`tail`**, no del gate → salió `exit 0` con 51 violaciones dentro. Igual con
`npm run lint | tail && echo OK`, que imprimió «OK» con el fichero de configuración roto. **Para
dictaminar, redirige a fichero y lee `$?`; el `tail` es solo para leer.** El hook no usa tubería, a
propósito.

### Cambios de paso
- `eslint.config.js`: `projects/*/public/` fuera del lint. Aplicaba el parser de plantillas de Angular
  a assets estáticos y fallaba con el CSS embebido; los 8 HTML de `explorations/` pasaban por llevar
  menos CSS, no por estar bien encajados.
- ⚠️ Al documentarlo, un patrón glob con `*/` dentro de un comentario de bloque **lo cierra antes de
  tiempo** y rompió el fichero. Comentario de línea en su lugar.

## 🔜 Siguiente en este frente
1. **Esperando a Carlos:** tiene el CSS y el tema. Si lo instala, los seis componentes cuadran. Si
   dice que algo le descuadra, el plan B es la lista de selectores, que va en el propio comentario.
2. **El paso 24/36 es el único fuera de curva** (ratio 1,50 en un título, debería rondar 1,30 →
   24/32). No lo usa ningún componente, solo el estilo `Heading/h2`, así que cambiarlo es un valor y
   cero efectos colaterales. **Decisión de Rafa, no ejecutar sin él.**
3. **Verificar `xl` y `xxl` contra un export real.** Se crearon después del último export, así que
   el nombre CSS que generarán sigue la regla medida pero **no se ha visto**. Los respaldos del
   fichero lo cubren mientras tanto.
4. **Listbox sin medir**: no tiene página en el showcase del dev. Queda declarado como tal en el
   comentario, no como correcto.
5. **Deuda propia detectada:** los `exports` de `@smartcontact/styles` y `@smartcontact/icons` no
   publican `styles/index.css`, así que un consumidor externo tiene que importar por ruta directa a
   `node_modules`. No es urgente y **no se ha mencionado fuera**.
6. **Cloudflare:** se activó temporalmente «Restrict previews» en el proyecto de la doc durante la
   evaluación de Access y se ha pedido revertirlo. **Si algún preview pide login, viene de ahí.**
7. **`compact-card` VERIFICADO en sesiones reales el 2026-09-02, en tres tramos** (antes decía
   aquí que solo se había probado con JSON fabricado; ya no es cierto). (a) El harness lo invoca
   de verdad: `.git/sc-hooks/` acumula **11 ficheros con UUID de sesión reales** escritos entre
   las 09:09 y las 18:00, o sea que el ramal de arranque corre solo en cada sesión de este repo.
   (b) El ramal de compactación, con el sha de arranque REAL de otra sesión (`7d343a9`) y deriva
   REAL en `origin/main`, imprimió el aviso correcto y **filtró bien**: nombró `2a6bc9c` (toca el
   hand-off) y descartó los otros tres commits, que no tocan guía. (c) La salida de un hook de
   `SessionStart` **llega al contexto del modelo**: con un hook temporal en `settings.local.json`
   (ignorado por git), una sesión `claude -p` real devolvió el marcador literal. Lo único no
   probado en vivo es que el harness mande `reason:"compact"` en una compactación de verdad; está
   documentado y el matcher ya lo cubre. Si algún día no imprime, mira `.git/sc-hooks/` y el
   `reason` que llega. `stop-guard` sigue sin probarse en un cierre ajeno: dio un aviso
   correcto-pero-molesto tras un push ABORTADO (no distingue el que el `pre-push` cortó), se
   aceptó a propósito porque cuesta un `ci:verdict`, y arreglarlo pide parsear los `tool_result`.
   Los dos fallan ABIERTOS: el riesgo es que no avisen, no que estorben.
8. **Memoria podada de 65 a 40 ficheros**; los 25 retirados están en
   `~/.claude/projects/-Users-rafareses-dev-smartcontact-ui/memory-archive-2026-09-02/`, no
   borrados. Si echas en falta un hecho del proyecto, míralo ahí antes de reescribirlo.

## ✅ s38 (cont. III) · Verificación (sin código): drift de «N pasos» resuelto + audit PRs limpios

Llegó un encargo diciendo que `docs:coherence` fallaba en `main` porque `8266d94` («paraleliza el
gate», 5 jobs) subió el conteo de pasos con `name:` de `ci.yml` de 8 a 11, y los docs seguían
diciendo «8 pasos». **Ya estaba resuelto, y de otra forma:** no se movieron los docs a 11, se arregló
`ci.yml`: `28e97ed` (restaura la paridad `preflight ≡ ci.yml`) + `05f3ace` («el build del DS de los jobs e2e no cuenta
como paso», le quita el `name:`) → conteo de vuelta a **8**, con lo que los docs (8 pasos = `verify` +
`build:docs` + 3 builds de app + 3 e2e) siguen correctos. ⚠️ Poner «11» HABRÍA ROTO el gate: Check J
de `docs-coherence.mjs` cuenta los pasos con `name:` de `ci.yml`, que son 8.

**Medido (HEAD = origin/main = `05f3ace`):** `node scripts/docs-coherence.mjs` → verde; `ci.yml` = 8
pasos con `name:`; el run de CI `33395393021` cerró con los 5 jobs en verde (incl. `verify`, que
contiene `docs:coherence`). Ningún `.md` describe el CI como «un solo job en serie».

**Audit PRs verificados limpios (no reintrodujeron el drift):** #29/#30 (hoy) y #21-#27 (semanales
previos), todos ancestros del `main` verde. #22/#24/#25/#26/#27 → solo `docs/AUDIT-SEMANAL.md` (exento
de Check J). #21 → además `DOCS-INDEX.md`, pero solo una fila nueva + la nota de fecha; la línea «8
pasos» (`DOCS-INDEX.md:47`) quedó intacta y hoy es correcta. #30 → 7 ficheros, ninguno con la cifra
(`CLAUDE.md`/`README.md`/`LEARNINGS.md` intactos). La skill de la auditoría lleva «blindaje anti-CI»
por diseño (commit de #21): su doc de salida no cita pasos/comandos inexistentes.

## ✅ s38 (cont. II) · UX de la sección Componentes + toggle de tema

**Sidebar de Componentes → acordeón** (`d0c755a`). Antes se desplegaban las 7 familias con sus 49
ítems de golpe y «Uso real / Reglas / Lab» quedaban enterrados (ilocalizables). Ahora: cabeceras de
familia con chevron + contador, **una abierta a la vez** (single-open que sigue a la ruta activa).
Estado en `app.component` (`openGroup` signal).

**Portada de Componentes → tarjetas con propósito** (`341334f`). Cada componente es una card con
nombre + una línea de para qué sirve; las 49 descripciones en un mapa `BLURB` del `component-catalog`
(fuente única, junto a la categoría). Es el valor que la sidebar no da.

**Claro/oscuro → toggle sol/luna + fundido premium** (`b205c83`). Componente reutilizable
`app-theme-toggle` (recibe `dark`, emite `toggled` — NO `toggle`, colisiona con el evento DOM; el
icono morfa sol↔luna). En el sidebar (tema global) y en cada story-canvas (tema local, con «Comparar»
aparte). El fundido usa la **View Transitions API**: una transición CSS NO anima el cambio porque los
colores salen de `var(--sc-*)` (medido: el fondo SALTA); la VT funde sobre una instantánea de píxeles.
`toggleDark` la invoca con fallback instantáneo (sin soporte / reduced-motion). El smoke del modo
oscuro espera a `.sc-dark` porque la VT aplica el DOM de forma DIFERIDA.

**⚠️ Trampa de lock, recurrente (s35 + s38):** `@napi-rs/wasm-runtime` pide `@emnapi/runtime` con rango
FLOTANTE; el **npm 10 del CI (node 22)** lo resuelve a la última publicada (1.11.3) y la exige en el
lock, pero **npm 11 (node 25, mi máquina) da VERDE FALSO** — se queda en 1.11.2, igual que
`guard:lockfile` y `npm ci --dry-run` locales. **El oráculo del lock es el npm del CI**: regenerar/
verificar con `~/.nvm/versions/node/v22.23.2/bin/npm` (el EXACTO del CI). Fix en `6c8cc80` (el de
`99c5c46`, solo `engines`, no bastó).

## ✅ s38 (cont.) · Deploy de sc-docs arreglado + «Tema PrimeNG» movido a Lab

**El deploy de sc-docs llevaba SEMANAS fallando en Cloudflare (todos los commits en `Failure`).**
Dos capas en serie:

1. **Build (`0f88492`).** `build:docs` arrancaba con `build:icons` en vez de `npm run build`, así
   que NO construía `dist/ui-smartcontact` (los componentes). En local colaba porque `dist/` ya
   estaba poblado de builds anteriores; en el checkout LIMPIO de Cloudflare, `ng build sc-docs` no
   resolvía `@smartcontact-hub/components` y el build moría (reproducido en frío: `rm -rf dist &&
   npm run build:docs` → «Could not resolve», exit 1). Alineado con `build:supervisor`/`:agent`/
   `:cuscare`, que sí arrancan con `npm run build` (por eso ELLAS desplegaban bien).
2. **Directorio de salida (dashboard, lo cambió Rafa).** Con el build ya en verde (`da576e6` pasó
   a `Active`), Cloudflare publicaba `dist/sc-docs` en vez de `dist/sc-docs/browser` → raíz 404,
   app escondida bajo `/browser/`. Cambiado el «Build output directory» del proyecto sc-doc a
   `dist/sc-docs/browser`. Verificado vivo: `sc-doc.pages.dev/` → 200 con `main-THA4YP7N.js`.

**⚠️ Terreno durable (config INVISIBLE al grep: vive en el dashboard de Cloudflare, no en el repo).**
Cada app en Pages tiene **Build output directory = `dist/<app>/browser`** y build command que arranca
con `npm run build`. sc-docs estuvo roto en AMBOS ejes hasta aquí. sc-docs usa **hash routing**
(`withHashLocation`), así que NO necesita `_redirects` de SPA. Cero referencias a `/browser/` en
docs/README. Cuenta account `b8361bb4…`, proyecto `sc-doc`.

**«Tema PrimeNG» → Lab (`da576e6` + `6a04dcc`).** Era un smoke test del preset y ya no justificaba
pestaña de primer nivel (cada componente `sc-*` ya demuestra el tema). Fundamentos baja a 2 pestañas;
la página vive en `/tema` (redirects desde `/fundamentos/tema` y `/theme` legacy), enlazada y
explicada en llano desde **Lab → «Verificación del tema»**. `smoke.spec.ts` codificaba el redirect
viejo `/theme`→`/fundamentos/tema` → actualizado en `6a04dcc` (por eso `da576e6` enrojeció el CI un
rato; lección afilada en LEARNINGS #7: `verify` no corre `e2e smoke`, usa `preflight`).

## ✅ s37 · Restyle de sc-docs (Constellation), lienzo blanco (DD-45) y breadcrumb con "aquí estás"

**sc-docs re-vestido con el lenguaje del DS "Constellation" de Digital Virgo, con tokens `--sc-*`
propios (acento sky, NO su rosa).** El DS y sus componentes **NO se tocaron** — solo el envoltorio
de la doc. Qué entró (`280bae1` + `2c558d9`):
- **Una sola sidebar** (secciones + lista de componentes anidada bajo Componentes; antes eran dos
  navegaciones). `storybook-shell` queda como frontera lazy sin sidebar. Componentes es la portada.
- **Buscador ⌘K** reusando el propio `sc-command-palette` del DS (dogfooding): montado en el shell,
  se le publican secciones + los 49 componentes. La demo del palette provee su servicio **scoped**
  para no chocar con el global. Se cierra en cualquier navegación.
- **Sombras `--sc-shadow-*`** en tarjetas, tipografía de display vía `--sc-font-size-display-1`
  (token, no px a pelo — la doc bebe del mismo sitio), **logo SC** real en círculo navy.

**Lienzo BLANCO (DD-45):** `app-shell` del supervisor de `--sc-bg-default` (gris) a `--sc-bg-canvas`
(blanco), cerrando el item pendiente de DD-34/DD-36 (`fa4382a`). Los campos rellenos siguen grises.

**Breadcrumb — tramo actual (elegido por Rafa: B, color + peso):** `sc-breadcrumb` marca el último
tramo en `--sc-text-primary` + `--sc-font-weight-medium`; **gate** en `e2e/component-structure`
congela su `outerHTML`, no puede regresar en silencio. Aplicado al maestro de Figma (`185:6637`).

**✅ Hecho (sesión nueva, bridge enganchó a la primera en 9223):** ejemplo del tramo actual en
Figma, fichero "Smart-Contact Design System" (`khNq9dJKNi13pNllrqm6dx`), página `❖ Breadcrumb`
(`6738:52933`), frame **"Breadcrumb, tramo actual"** (node `14558:514`, en x:650 y:977), con una
instancia del maestro (`14558:516`) y etiqueta mínima "Tramo actual" (`14558:515`). El maestro
`185:6637` no se tocó, ya llevaba B (color + peso) heredado por la instancia. De paso se borró
el mockup viejo de sesión 20 en esa misma página (`13890:157`, "Current state (propuesta)": texto
suelto sin instancia real, no aplicaba el peso Medio) — a petición de Rafa, sustituido por el
ejemplo de arriba.
>
> Sello histórico (2026-08-25): HEAD `f78977c`, **CI verde, los 8 pasos**. Cierra con `aura/custom` dentro del gate de completitud del Kit. Antes, `b5b07a5`. Los dos últimos commits son los que el verde LOCAL no cazó y conviene leer: `b5b07a5` (el puntero de Playwright sale de la barra lateral) y `25cedef` (el lockfile vuelve a estar en sync — `npm ci` es el paso 1 del CI y `preflight` NO lo corre). Antes: `1fb7d5f` (el audit de acoplamiento a PrimeNG pasa a mirar tres caras) sobre HEAD `9e3f0bd` (Angular 22 + PrimeNG 22 + los builders a `@angular/build`). Antes, en esta misma sesión y ya en `main`: `3b65f07` (duplicación del supervisor), `bee2acc` (retirada de `sc-page-header` + deriva de docs), `0ef136c` (**trinquete DD-38 a CERO**), `1698f47` (red de contraste de severidades), `edfb2ec` (código muerto) y `4417bb8` (`text.muted.color` a enforce + el warn unificado).**
>
> _Corrección 2026-08-31: esta línea citaba además "rescate de s33" sobre `HEAD \`97f34e1\`` — ese sello no resuelve a ningún commit real (cazado por `docs:coherence`); se retira en vez de inventar el hash que debería llevar._

## ✅ s34 · Se cerró la deuda abierta, y el salto a Angular 22 destapó una clase de fallo nueva

**Diez bloques, todos en `main`.** El trinquete de DD-38 quedó **a CERO** (93 componentes en
señales, 0 en decoradores), el `warn` volvió a la familia del Kit (**DD-41**), `text.muted.color`
pasó a `enforce`, se retiraron 3 ficheros muertos y `sc-page-header`, y el wiring de
`TopBarSlotService` —el patrón más repetido del repo, 17 páginas en dos idiomas— quedó en un solo
`useTopbarActions()`.

**Angular 22 · TypeScript 6 · PrimeNG 22 · `@primeuix/themes` 3** (**DD-42**), con
`@angular-devkit/build-angular` **fuera**: los 7 proyectos en `@angular/build`. Vulnerabilidades
**7 → 1**; el salto por sí solo no cerraba ninguna —lo que las cerró fue migrar los builders—.

### Lo que hay que saber de esa migración

Está entero en [`migration-safety.md`](../migration-safety.md), que dejó de proyectar lo que
«debería» pasar en un major y pasa a contar lo medido. El resumen:

- **La capa aguantó**: **0 líneas** de tokens `--sc-*` y **6 líneas en un fichero** del preset.
  Las 36 clases internas de PrimeNG de las que dependemos **siguen existiendo las 36**.
- **Lo que rompió fue lo que se salta la capa**, y las tres veces **en silencio**:
  `styleClass` retirado de `p-table`/`p-select`/`p-multiselect` (42 tests de CusCare de golpe);
  un `closest('p-tablecheckbox')` en `sc-datatable` que dejó muerta la selección por rango con
  Mayús; y un localizador de test contra otra grafía.
- **Dos de las tres las introdujo nuestro propio renombrado**, no el proveedor: PrimeNG declara
  las dos grafías (`selector: "p-table-checkbox, p-tablecheckbox"`) justamente para no romper a
  nadie.
- **Y sus 8 tests unitarios siguieron verdes** porque usaban un doble que decía «sí» a cualquier
  selector. Medían su propio stub.

`audit:primeng-coupling` pasa a tener **tres secciones** (clases · nombres de elemento · entradas
inertes), las tres probadas **en rojo con los fallos reales** antes de darlas por buenas. La
primera versión de la sección B los dejaba pasar a los dos: *un gate que no se pone rojo con el
fallo que lo motivó no es un gate.*

### Aparcado a propósito

**El P0 del field-pattern** (los 5 CVA a mano). Angular 22 gradúa **Signal Forms** a API pública y
es justo lo que los sustituye: refactorizarlos ahora sería trabajo tirado. No es que no se pudiera;
es que hacerlo hoy sale más caro que esperar.

### La trampa que costó más tiempo que cualquier bug

Lancé **la cadena entera dos veces** sin darme cuenta, y las dos suites del supervisor se pisaron
sobre el mismo dev server. Resultado: la tabla del supervisor salía vacía y la suite iba camino de
**dos horas**. Con una sola cadena y la máquina libre: **127/127 en 1,8 minutos**. Si una suite que
conduce la app real da rojos absurdos, **cuenta los procesos antes de leer el código**.

---

## ✅ s31 (b) · Sync del Kit tras un mes parado, y qué dice Figma del primario oscuro

**El puente llevaba muerto desde el 22 de julio** (último PR de sync: #17). Causa: el token de
GitHub del plugin caducó. Rafa pasó el export a mano (`design-tokens24Aug.json`) y entró por el
pipeline normal.

**Lo que trae**: la familia `warn` pasa de `orange-*` a `yellow-*` en los dos temas — 14 líneas en
`04-component.css` y 30 en `07-dark.css`, resolviendo contra primitivas que ya existían. Es **W5
aterrizando**. Cumple AA antes y después: claro 5,58→4,92, oscuro 6,92→11,06. Visualmente se nota
(naranja vivo → mostaza). **El `tag` warn se queda ÁMBAR** porque está en el EXCLUDE de
`cmp-color-map.mjs` (divergencia a mano, customs-catalog §1.3) → **coherencia botón/tag a revisar
con diseño**, no la resolvió esta sesión.

**Y el dato que faltaba para cerrar DD-40**: el export trae `primary.contrast.color` dark a
**#ffffff**. O sea, Figma decidió texto BLANCO — y dejó los fondos aclarando. Eso da base 5,62 ✓,
hover 3,35 ✗, active 2,11 ✗. **No se adoptó**, y la razón está medida en la actualización de
DD-40: con texto blanco la banda válida mide 1,25:1 de ancho y no caben tres estados que se
distingan (con texto oscuro mide 3,76:1). **Ningún azul arregla eso.** La pelota está en diseño:
o el hover/active dejan de expresarse con el relleno, o el primario oscuro se queda con texto
oscuro. Mientras tanto la fila sigue en `diverge`.

**Nota de infra**: `playwright.config.ts` gana `SC_DOCS_URL` — era el único de los tres configs
sin escape por env, y con dos worktrees de agente vivos moría con «Port 4280 is already in use».
⚠️ Pero **no apuntes el `component-structure` a un build de producción**: su baseline guarda
`outerHTML` y Angular escribe `<!--container-->` en dev y `<!---->` en prod → 16 filas en rojo que
no son una regresión. Está avisado en el propio config.


## ✅ s33 — el TypeScript de la raíz y de `e2e/` entra en `typecheck` (`a275686`)

**Ningún `tsconfig` del repo incluía la raíz.** Los de apps y libs arrancan todos en
`projects/*/src`, así que **33 ficheros no los type-checkeaba nadie**: los cuatro
`playwright*.config.ts`, `eslint.config.js` y los 28 de `e2e/`. Y `eslint` no tapa ese hueco
porque no reporta errores de tipo.

Por ahí pasó en s32 un `reducedMotion: 'reduce'` suelto en el `use` de
`playwright.cuscare.config.ts` —en Playwright 1.60 va dentro de `contextOptions`—: error de tipo
real, `verify` entero en verde y la suite de CusCare inestable bajo carga. El caso concreto ya lo
cubría `e2e/cuscare/harness.spec.ts` (comprueba el estado EN LA PÁGINA); lo que quedaba abierto
era la clase.

- **`tsconfig.harness.json`** (nuevo), encadenado en el script `typecheck` → entra en `verify` y
  en el CI. **No añade eslabón a la cadena**: extiende un gate que ya estaba, así que `verify`
  siguen siendo **26 gates** y las 4 cifras sin gatear (`CLAUDE.md`, `DOCS-INDEX`,
  `AUDIT-SEMANAL`, `SKILL.md` de la rutina) **no se tocan**.
- **Nace en verde, medido ANTES de escribirlo**: 0 errores sobre los 33 ficheros tal cual estaban.
- **`include` por PATRÓN** (`*.ts`, `*.js`, `e2e/**/*.ts`): un `.ts` nuevo en la raíz o en `e2e/`
  entra solo, sin que nadie se acuerde.
- **`allowJs`/`checkJs`** por `eslint.config.js`: su `// @ts-check` de la primera línea **no hacía
  nada**, porque el fichero no estaba en ningún programa de TypeScript.
- **Validado en ROJO en sus tres ejes**, no solo en verde: con el bug histórico reinsertado,
  `npm run typecheck` sale con **exit 2** y `TS2769 «'reducedMotion' does not exist in type
  'UseOptions<…>'»`; con un error de tipo en `eslint.config.js`, `TS2339`; con otro en
  `e2e/smoke.spec.ts`, `TS2322`.
- **`scripts/__tests__/typecheck-coverage.test.mjs`** (nuevo, 7 casos dentro de `test:unit`) protege
  la **clase**, no la instancia: recorre el repo y falla si aparece un `.ts` que no mira ningún
  tsconfig. El patrón cubre ficheros nuevos en sitios conocidos; el test cubre un **directorio
  nuevo de primer nivel** (`tools/`, `bench/`), que es exactamente cómo nació el hueco. Su verde
  **no es vacuo**, comprobado: quitando `e2e/**/*.ts` del `include`, señala los 28 huérfanos.

**Fuera a propósito, con la cifra medida antes de decidirlo:**

| Qué | Errores con `tsc` | Por qué queda fuera |
|---|---|---|
| `code-connect/**.figma.ts` | **17** | No son código: son PLANTILLAS que evalúa el CLI de Code Connect (módulo `figma` virtual + globales `_fcc_*` que inyecta el parser y no declara ningún `.d.ts`). Su gate es `npm run figma:connect:parse` —verificado en verde tras el cambio— y `eslint.config.js` ya los ignoraba por lo mismo |
| `scripts/**/*.mjs` | **392** con `checkJs` | JS sin anotar (casi todo TS7006, "implicitly any"). Anotarlos es otra tarea, no un efecto colateral de esta; hoy los cubren `test:unit` y `eslint` |

⚠️ **"Fuera del `include`" no es "fuera del programa", y se vio el mismo día.** El guardián de
reutilización del dev server (`scripts/playwright-reuse-guard.mjs`, de s31) lo IMPORTA
`playwright.config.ts` — y con eso entra en el gate de tipos aunque `scripts/` esté fuera del
`include`: 3 errores (TS7006 ×2 y un TS2339 en el `catch`, que TypeScript tipa como `unknown`).
Se arreglaron con **JSDoc en el script**, que es lo correcto: si un config type-checkeado depende
de él, su firma es parte del contrato. Si mañana añades un import así y no quieres anotarlo, la
decisión se toma en `tsconfig.harness.json`, no con un `@ts-nocheck` a escondidas.

**Doc corregida donde afirmaba lo contrario** (quedaba falsa al aterrizar esto): la fila «Tipos +
lint» del README —que estaba **vacía**—, el comentario del propio `playwright.cuscare.config.ts`,
la trampa de `docs/handoff/cuscare.md` y el corolario s32 de `LEARNINGS.md`.

---

## ✅ s31 · Accesibilidad: el primary dark y el agujero de la red de contraste

**DD-40** — el par `--sc-text-on-primary`/`--sc-bg-primary` en `.sc-dark` medía **3,01:1**.
Llevaba desde junio aparcado en `A11Y_KNOWN` con una razón **falsa**: decía que «ni gray-900 ni
blanco llegan a AA sobre blue-400», y el blanco sí llega (5,62). Lo que de verdad lo bloqueaba no
era la base sino la rampa: con blanco no hay hover ni active legales (aclarar sale de la banda,
oscurecer hunde el relleno bajo el 3:1 de 1.4.11). Única salida: **subir la rampa un paso**
(`blue-300/200/100`, texto sin tocar) → **5,05 / 8,03 / 11,89** en los dos criterios.

- Las tres filas `primary.*` de dark pasan a **`diverge`** en `color-map.mjs`. Como eran lo único
  que el dark recibía del Kit, **la zona `@sc-gen:semantic-color-dark` queda VACÍA** y el dark
  pasa a estar 100% curado a mano. La cabecera de la zona lo dice, para que se lea como dato.
- **`A11Y_KNOWN` queda vacío**; §6b va de 21/22 a **22/22**.
- Arregla de rebote la **barra de sc-docs en oscuro** (la que se veía negra sobre oscuro) y el
  **skip-link** del supervisor.

**La red de contraste miraba solo la vista enrutada.** `theme-contrast.spec.ts` recorría
`main#main-content`, y el skip-link, la `sc-sidebar` y la `sc-top-bar` son **hermanos** de
`<main>`: el marco de la app no lo miraba nadie, en ningún tema. Raíz ampliada a `body`. Salieron
tres defectos más, arreglados: `sidebar__section-title` y `sidebar__decisions-label` (TEXTO de
12 px → umbral 4,5, alpha a `0.5`), el `mock-sample-switcher` (pastilla ámbar clara sin variante
oscura) y antes los chevrones (`0.3`→`0.4`, commit `b3a0fdf`).

**Segundo fallo de la red, del signo contrario**: su filtro de visibilidad hacía
`cs.opacity === '0'` mirando solo al elemento, y `opacity` no se hereda como valor computado —
un span dentro de un ancestro a 0 se colaba como visible. Ahora sube por la cadena. Y como eso
dejaba sin medir la sidebar (invisible en reposo), se añade **un test por tema que la despliega y
mide con hover**, que es medio punto peor que el reposo. 125 → **127** tests.

**sc-docs · swatches de fundaciones**: hover/foco abre una tarjeta con token, hex y HSL, y cada
línea se copia (vía `ScClipboardService`). Los tres valores salen de `getComputedStyle`, no de
una tabla a mano.

⚠️ **Trampa que costó cinco rondas**: `ng serve` sirvió CSS **viejo** mientras el fuente,
`dist/design-tokens` y `ng build` estaban los tres correctos. Los e2e daban rojos
irreproducibles. **Para medir color/contraste, sirve el build estático y apunta con
`SC_SUPERVISOR_URL`** — ahí pasó de 5 fallos fantasma a **53 verdes**.

**Pendiente (no bloquea)**: pedirle al Kit un primary dark conforme — luminancia relativa entre
**0,136 y 0,183**, apuntando al centro de la banda y no al canto. Es la salida durable; el día
que llegue, esto se revierte devolviendo tres filas a `enforce`.

---


## ✅ s30 — tres cosas, el mismo día, ya en `main`

Salieron en cadena: **A** es lo que se pidió, y **B** y **C** son hallazgos de paso de A que se
resolvieron en su propio worktree y se mergearon después (`974c827`).

### A · sc-docs: la barra baja de 7 destinos planos a 4 secciones (`dcad8e2`)

Fundaciones, Tipografía y Tema PrimeNG gastaban tres huecos de primer nivel para la misma cosa
—36/51/40 líneas de plantilla—; se agrupan bajo **`/fundamentos/*`** con pestañas, y Lab y el
interruptor de tema salen de la nav a un cluster de herramientas. Medido a 1280px: lo ocupado
**966 → 670px**, la nav **624 → 364**; por debajo de 1000px la nav se desliza y el body no
desborda. Las rutas viejas **redirigen, con test**: sin él `/#/foundations-type` no daba 404, te
mandaba **en silencio** a otra página. Otro gate fija la barra en cuatro destinos.

- **Fuera el `opacity: 0.72`** de los inactivos: en oscuro los dejaba en **2.29:1**. Al medirlo
  salió lo de C (ver abajo).
- **El interruptor se queda con TEXTO**: `<sc-icon>` en el shell *eager* mete **+127 kB** en
  `main.js` (573,85 → 701,15 kB) y revienta el presupuesto de bundle por un glifo decorativo.
  Dentro de las páginas, que son lazy, `sc-icon` sí sale gratis.
- La **portada de `/components`** deja de repetir la lista entera (era la tercera copia de la
  misma navegación en pantalla) y ofrece un salto por familia.
- **Tres gates hubo que arreglarlos de paso.** `eslint` entraba en el `dist/` de los worktrees de
  agente (en flat-config `dist/` está anclado a la raíz → `**/dist/` + `.claude/`); el test del
  palette ataba una aserción de teclado a la geometría (→ B); y `screenshotBaseline` capturaba la
  sidebar con su scroll en dos estados (**exactamente 4912 px** de diff siempre, firma de
  bistabilidad, no de ruido) → se fija a 0 antes de capturar. **Las 39 baselines visuales van
  regeneradas: ya estaban desfasadas en `HEAD` antes de tocar nada** (esperaban 2507px de alto y
  la página rinde 2497).

### B · `sc-command-palette` (teclado) + el alcance real de `preflight`

Dos defectos de teclado en `sc-command-palette`, los dos **medidos antes de tocar nada** y
arreglados con su gate (`87abad5`):

1. **El resaltado inicial dependía de dónde hubiera quedado el ratón.** Con `(mouseenter)`, abrir el
   overlay bajo un puntero PARADO disparaba el hover: con el cursor sobre el ítem 3, el activo al
   abrir era «Usuarios» y ↓+Enter ejecutaba «Crear grupo». Como la paleta se abre sobre todo por ⌘K,
   la primera flecha partía de un sitio que el usuario no eligió. **El mecanismo, medido:** al
   aparecer un elemento bajo un puntero quieto el navegador dispara `mouseover` y `mouseenter` pero
   **NO** `mousemove` ni `pointermove` → basta `(mouseenter)` → `(mousemove)`, sin flag de estado.
2. **Las flechas movían el resaltado pero no la vista.** Con la ventana a 1280x400, `scrollTop` se
   quedaba en 0 las cinco pulsaciones y desde la tercera el activo caía **3, 78 y 112 px** por debajo
   del borde visible → ↓+Enter ejecutaba un comando invisible. Añadido
   `scrollIntoView({block:'nearest'})`, **casando el índice por `id`**: `highlighted` indexa
   `filtered()` y el DOM se pinta desde `grouped()`, así que con categorías intercaladas los dos
   órdenes dejarían de coincidir (ningún consumidor de hoy intercala — trampa latente, anotada).

Los **dos gates nuevos** (`components.spec.ts`) están validados en los DOS sentidos: rojos contra el
componente sin arreglar, con los valores exactos medidos. El primero, en su primera versión, pasaba
**en verde contra el código roto** porque leía el resaltado antes de que llegara el evento; ahora
espera a confirmar que el `mouseover` llegó y solo entonces afirma.

**Y de ahí salió lo otro (`649240d`): `preflight` no corría `components.spec.ts`.** Su sustitución
local cambiaba `npm run e2e` por `e2e:structure` — **1 test en vez de 68**, dejando los 56 de
`components.spec.ts` fuera del gate de pre-push. El motivo escrito (los screenshots de `sc-card` y
`sc-message` fallan siempre en macOS) resultó ser sorteable: son `screenshotBaseline()`, que hace
**no-op con `CI=1`**. Hoy la sustitución es `npm run e2e` → `CI=1 npm run e2e`, y el test del gate
lleva el caso inverso para que la vuelta atrás salte.

### C · El chevron de la sidebar cumple 3:1 (`b3a0fdf`)

El chevron **no es decorativo**: cambiar `chevron-right` por `chevron-down` es la ÚNICA señal de
que un item tiene hijos y de si está abierto, así que le aplica WCAG 1.4.11 a 3:1. Estaba en
`rgb(255 255 255 / 0.3)` y **no llegaba en ninguno de los dos temas** — un alfa blanco se aclara
al mismo ritmo que el fondo de detrás, así que el navy oscuro no lo rescata. Medido en el estado
vinculante (sidebar abierta por hover, fila bajo el puntero, medio punto peor que en reposo):
claro **2,57 → 3,42**, oscuro **2,71 → 3,80**. Alpha 0.3 → 0.4.

**No lo cazó ningún gate, por dos motivos anotados en el fichero:** la sidebar es HERMANA de
`<main>` y `theme-contrast.spec.ts` solo recorre `main#main-content`; y `tokens:parity` no ve un
literal que no pasa por ninguna variable.

⚠️ **Esto no cerraba el contraste** — lo que disparó la investigación era el par
`--sc-bg-primary`/`--sc-text-on-primary` a **3,01:1** en oscuro, el contraste primario del preset
(`base.ts`) y por tanto el botón primario de toda la plataforma. **Cerrado en s31** (arriba,
DD-40): la razón de marca que lo bloqueaba resultó apoyarse en un dato falso, y `07-dark.css`
resultó ser zona `@sc-gen` **solo para los tres `--sc-bg-primary*`** — el token de texto ya vivía
fuera. Se resolvió divergiendo esas tres filas en `color-map.mjs`, no editando la zona.

---

## s29 (previo) — Figma + casar preset

Sesión de dos mitades. **(1) Figma:** se revisaron 6 componentes + Table cruzando el master
contra la **web en vivo** (chrome-devtools) y se **tokenizó** tamaño y line-height del texto de
componente. **(2) Código (nuestro repo):** medido que **nuestro sc-docs ya casaba** con Figma casi
entero —lo desviado era producción (Carlos)—; se **casó lo que faltaba** en el preset (`css.ts` +
`extend.ts`) con la **unificación de line-height** (md 21→20), **verificado en sc-docs con build**.
Los **SIGUIENTE de código** de más abajo siguen intactos.

## ✅ Código (nuestro repo — casar sc-docs/prototipos con Figma)

Medido que **nuestro sc-docs ya casaba** casi entero (chip 14/20/34, opciones 14/20, breadcrumb 14 +
`slate/600`); lo desviado era **producción (Carlos)**. Lo que faltaba, hecho en el preset y
**verificado en sc-docs con build**:

- **`css.ts`** — chip, toast-summary, select/multiselect/listbox-option, breadcrumb, context-menu →
  tipografía **md (14/20)**; tag, toast-detail → **sm (12/18)**. Ahora **explícito**, no depende del
  `line-height` del body de cada app (así los **prototipos** —body 1.5— también casan).
- **`extend.ts`** — **unificación**: `app.typography.md.lineHeight` `scale-1-5` (21) →
  `line-height-200` (20). Medido: control de alto 37 a 36 (icon-only más cuadrado), **sin romper
  geometría**. Verificado: botón 36/20, tag 25, chip 34. Efecto colateral esperado: movió el alto
  inline del textarea autoResize (77→74) → regenerado el baseline de estructura (`59a5c73`).
- **Code Connect (C):** 6 componentes mapeados en `code-connect/*.figma.ts` (formato v2
  templates de `@figma/code-connect` 2.0), **publicados en Figma dev mode**. Context-menu
  excluido: no existe wrapper en el DS.
- **Previews (B):** referencias estáticas HTML nativas en `sc-docs/public/explorations/components/`
  que consumen los `--sc-*` reales vía `/tokens` (assets en `angular.json`, opción 3, cero drift).
  Light+dark+estados, 6 componentes + índice. Verificadas por pantalla.

## ✅ Figma (master `khNq9dJKNi13pNllrqm6dx`)

Todo **migration-safe**: atado a tokens que **ya existían**, sin tocar su valor → cero efecto colateral.

- **Tamaño → `primitive/typography/font/size/200` (14):** `breadcrumb-item`, `contextmenu-item`,
  `select-option`, `multiselect-option`, `listbox-option` (**23 nodos**). Estaban a 14 pero **a
  pelo**; ahora vinculados. **Sin cambio visual.**
- **Line-height → rampa normal** (`line/height/200`=20 para 14px, `line/height/100`=18 para 12px):
  **chip 31→34, toast 62→68, tag 22→25** (**30 nodos**). Antes AUTO/libre.
- **Badge EXCLUIDO con motivo:** alto **FIJO** (18/21/25/28) y tamaños fuera de rampa
  (8.75/10.5/12.25) → el line-height no le afecta y no hay token que le pegue. Tocarlo sería
  inventar tokens.
- **Decisión — "line-height normal en todo", NO un set compact.** Se sopesó y **descartó** una
  rampa de line-height ceñido; los hug (chip/toast/tag) tiran de la rampa normal. *(Candidata a
  DD si se quiere formalizar; hoy solo aquí.)*

**Hallazgos de la revisión web↔Figma** (por si se retoma):

- **Select/MultiSelect:** el **valor** ya es 14 (correcto); el bug está en las **opciones del
  desplegable** (16, deben 14). El "16→14" que se arrastraba era medir el **contenedor**, no el
  texto — falso positivo de sesiones pasadas.
- **Breadcrumb:** 16→14 **y** color `#8F97A3` → `slate/600` (`breadcrumb/item/color`).
- **Context-menu:** 16→14 (color `slate/700`, correcto).
- **Chip/Toast/Tag:** line-height (hug); la web va a 1.5.

**Pendiente de Carlos (dev, NO nuestro):** consumir estos tokens en código (tamaño, line-height,
color breadcrumb). Mensaje de diseño enviado. Editar Figma **no mueve la web**.

**Nota (20-vs-21):** en NUESTRO código ya **unificado a 20** (`extend.ts`, esta sesión). En producción
(Carlos) sigue el legacy hasta que consuma los tokens.

**Table:** endosada como **buena base** (mensaje ligero), sin push a reconstruir sobre PrimeNG.

## ▶︎ SIGUIENTE — sin preguntar

> Los puntos 0 a 3 que llevaba esta ficha (re-exportar y cerrar `text.muted.color` · los 16 del
> trinquete · los hallazgos viejos del audit semanal · `npm audit`) están **HECHOS** en s34. Lo que
> sigue es lo que queda de verdad.

**Lo que dejó s42, medido y sin hacer:**

- **Las descripciones de los text styles de Figma están corridas un peldaño.** Se escribieron
  cuando `h1` era la cima y no se movieron al meter `Display` encima: `Heading/h1-semibold` dice
  *«el texto más grande… uno por pantalla, no más»* (ya no lo es, Display es 64 y reclama lo
  mismo); `Heading/h2-regular` lleva una descripción de BODY (*«el texto de leer, párrafos»*) en
  un heading de 24; `Display/display-regular` una de SUBTÍTULO; y `h1-regular` y `h3-regular` la
  tienen vacía. Es texto, no estructura: se arregla en Figma en cinco minutos.
- **El tier `app/typography/xl|xxl` existe en Figma y no lo consume nadie** (medido: 0 nodos, 0
  text styles). Está clasificado como `not-consumed` en `coverage-map.mjs`. Si algún día se
  quiere de verdad, va a `sc-preset/extend.ts` + `APP_TYPOGRAPHY_CONTRACT` y sube al bucket
  `value-check`; hasta entonces declararlo consumido sería mentir.
- **`--sc-font-size-caption-bold` está declarado y tiene 0 usos.**
- **`display-1` se quedó sin consumidores y `h1` con uno que es solo fallback.** Es el estado
  honesto tras DD-48 (la rampa era aspiracional desde DD-13), no una regresión: la rampa ya dice
  la verdad y espera consumidores de PRODUCTO. Si el Supervisor adopta la rampa, es ahí.

1. ~~**El P0 del field-pattern ×5**~~ → **HECHO 2026-08-30 ([DD-44](../DECISIONS.md))**. No fue
   «extraer un CVA a mano»: se **BORRÓ** el ControlValueAccessor de los SEIS campos (los 5 +
   `sc-search`), porque no lo ejercía nada (0 Reactive Forms, 0 ngModel externo; las apps usan
   `[(value)]`), y Angular 22 → Signal Forms es su sustituto estructural. La lógica compartida
   vive en `components/field/sc-field.ts` (3 factories). Reconciliado el estado: `invalid` a los
   5, `focused`/`blurred` a los 3. ~265 líneas netas fuera. Cada paso verificado contra el
   baseline de estructura (`ng serve`, no AOT: el `dist` emite `<!---->` donde `ng serve` emite
   `<!--container-->` y confunde) + comportamiento + e2e:supervisor. **Sigue abierto** solo lo
   que se dejó FUERA con motivo: `radiobutton`/`textarea` sin field-pattern (no son CVA, escrito
   a propósito), y el `scFieldHost` para el host class-binding (indirection por ~6 líneas — no
   compensa).
2. ~~**La rama `aura/custom` del Kit no la vigila nadie**~~ → **HECHO**, y la descripción que
   llevaba esta ficha era imprecisa: `aura/custom` **sí** salía en el censo de §7b (visible), lo
   que le faltaba era entrar en el **gate de completitud de §8**. Ahora entra, con sus 52 hojas
   clasificadas midiendo el consumo real:
   - **19 `flows`** — `primitive.typography.*` es la FUENTE de `--sc-font-size-*`,
     `--sc-line-height-*` y `--sc-font-weight-*` (`01-primitive.css:258-291`), verificado por valor.
   - **7 `divergence`** — `text.accent` (Kit violet, DS sky-600 por contraste) · las 5 de
     `presence` (**taxonomías distintas**: el Kit trae available/unavailable/administrative/
     talking/wrap-up y el DS available/paused/training/offline, con hexes curados a AA) ·
     `dialog.icon.color` (el Kit lo quiere a color de texto pleno, el DS atenuado).
   - **26 `not-consumed`** — todas las de `bulktranscriptionmodal`: **no existe ninguna
     `--sc-cmp-bulktranscriptionmodal-*`**; ese componente se estiliza con 36 tokens semánticos
     directos. Elección válida, pero ahora el censo lo dice en voz alta en vez de aparentar que
     fluye.

   Cubierto por 3 tests en `scripts/__tests__/coverage-map.test.mjs`, uno de ellos la **cara
   roja** (un custom nuevo del Kit → `unmatched`), que es justo lo que se escapaba.
3. **El eslabón que sigue faltando: nadie compara *fichero de Figma ↔ export*.** `tokens:parity`
   compara *export ↔ CSS*. Por ese hueco se coló el desfase de julio. No puede ser gate de CI
   (necesita el bridge abierto), así que es procedimiento manual — mismo caso que el Check D de
   `docs:coherence`.
   ⚠️ **Cómo repetirlo sin tropezar**: resuelve a RGBA final **los dos lados** antes de comparar.
   La primera pasada dio **15 divergencias falsas** por leer los colores de Figma sin canal alfa
   (`#00000000` vs `#000000`) y por comparar un alias contra un valor ya resuelto. Y en el JSON del
   export **las claves raíz llevan las barras dentro** (`d['aura/semantic/dark']['primary']`).
4. **El 1:1 web↔Figma de chip · tag · toast** — sigue **bloqueado por herramienta**, no por
   decisión. Ver la sección de Figma más abajo.
5. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)** que quede tras
   s34, y **los cabos de DD-24** (round-trip de iconos) en [`ROADMAP.md`](../ROADMAP.md).

## ⏸️ ESPERANDO A RAFA — NO preguntar

> Auditada fila a fila el 2026-08-25. Las que ya no procedían salieron; las que quedan llevan **su
> verificación de esa fecha**, no la razón heredada.

| Qué | Estado |
|---|---|
| ~~**Borrar el proyecto Cloudflare `sc-demo`**~~ → **HECHO por Rafa (2026-09-01)** | Proyecto borrado de Cloudflare. Su check «Cloudflare Pages: sc-demo» todavía sale en rojo en el último commit de `design-tokens-sync`: es un snapshot HISTÓRICO de cuando existía (no vuelve a correr sobre un commit viejo), se limpiará solo en el próximo push del bot de tokens. |
| **`org-profile.md`** | `smartcontact-hub/.github` → `profile/README.md` → **HTTP 404** (re-medido 2026-08-25): no está pegado. El borrador sigue en `docs/org-profile.md` |
| **Un primary dark conforme, pero desde el KIT** | Ya NO es el 3,01:1 — lo resolvió **DD-40** subiendo la rampa un paso y **divergiendo** del Kit. Lo que queda es pedirle al Kit su primary dark conforme (luminancia relativa entre **0,136 y 0,183**, al centro de la banda); el día que llegue, se revierte devolviendo tres filas de `color-map.mjs` a `enforce` |
| **Lienzo de página gris↔blanco** | Figma `13920:4298`. **DESBLOQUEADO** por `bcab818` (2026-08-25): nace `--sc-bg-canvas` (blanco en claro / slate-950 en oscuro), el token que faltaba, SIN tocar `--sc-bg-default` (que hace doble trabajo: suelo + relleno de campos, 32 ficheros). El bug del rail de AED que describía DD-36 ya no aplica. Lo que queda es SOLO la decisión de diseño: ¿el lienzo de contenido pasa a blanco? El token para hacerlo limpio ya está; el valor pintado hoy no ha cambiado |
| ~~**Tramo actual del breadcrumb**~~ → **DECIDIDO, `bcab818` (2026-08-25)**: la propuesta de Figma `13890:157` (padres slate-500 `#8F97A3`) **se RECHAZA** — da **2,95:1** sobre blanco y no cumple AA. Se queda el código como está (padres slate-600, actual slate-700, ambos AA). Falta solo anotarlo en el nodo de Figma (Bloque 4). *Nota: el mismo commit tokenizó la miga a 14px, otro asunto ya cerrado.* |
| ~~**El botón de crear cambia de ancho entre listas**~~ → **HECHO, `bcab818` (2026-08-25)**: decisión de Rafa «que no cambie de anchura porque sí». `main.scss:205` → `.top-bar__actions button { min-width: 144px; max-width: 288px }`, anclado en clase NUESTRA. Los cinco (122–142px) aterrizan igual. Aplicado y en `main` |
| **B5b · prosa i18n del constructor** | Necesita ICU MessageFormat **y diseño**. Sigue aparcada |

## 🔌 Figma — tres servers, y caen por separado

Tabla completa en [`AGENTS.md`](../../AGENTS.md) → *Figma MCP Bridge*.

- **`mcp__figma-console__*`** (Figma Desktop Bridge, `:9223`) — el de diario, lee **y escribe**.
- **`mcp__Figma__*`** — app de escritorio, **solo lectura** (6 tools). Sobrevive a que la nube caiga.
- **Nube** (`plugin:figma:figma`) — solo aporta librerías remotas y funcionar sin Figma Desktop.

⚠️ **Medido el 2026-08-25, y es la razón de que el 1:1 siga sin hacerse.** Que el panel del
Desktop Bridge diga *«Connected to 1 AI app»* **no significa que esta sesión lo tenga**: los
servidores MCP se enganchan al ARRANCAR la sesión, así que reconectar el bridge a mitad no añade
sus herramientas a una sesión ya abierta. Comprobado por búsqueda directa de nombre, no deducido:
en s34 solo existían dos prefijos —`mcp__Figma__*` (lectura, y **funcionó**: con él se leyó el
nodo `13890:157` del breadcrumb) y `mcp__ClaudeTalkToFigma__*`, que es el que **está vetado**—.

→ Si necesitas ESCRIBIR en Figma: **abre sesión nueva** con el bridge ya conectado. No hay forma
de arreglarlo desde dentro de una sesión en curso.

Fichero: **"Smart-Contact Design System"** (`khNq9dJKNi13pNllrqm6dx`) — 111 páginas, 2.509
variables, 30 comentarios activos.

## ⚠️ Trampas de este frente

- 🪤 **El verde LOCAL no cubre los dos primeros metros del CI**, y en s34 mordió dos veces:
  - **`npm ci` es el paso 1 del CI y `preflight` NO lo corre.** Un lockfile desincronizado da
    preflight entero en verde y CI muerto antes de instalar nada. Si tocas `package.json` o el
    lock, corre **`npm ci --dry-run`** (exit 0 = en sync) antes de pushear. Y no lo arregles con
    `npm install <paquete>` puntuales: cada uno vuelve a descuadrar la familia `@emnapi/*`
    (opcionales de wasm que macOS no instala y Linux sí espera). Lo que funciona es regenerar
    limpio — **pero eso hace derivar versiones**, incluida la FUENTE DE ICONOS del DS. Mira el
    diff de directas después y verifícalas, no las des por buenas.
  - ⚙️ **Y el caso peor de todos ya lo para una máquina**: lanzar la cadena DOS veces. Las dos
    nacen en el mismo `cwd`, comparten `ng serve` y se pisan — la tabla del supervisor salía
    VACÍA y la suite iba camino de dos horas (con una sola: 127/127 en 1,8 min). Desde s34,
    `playwright-reuse-guard.mjs` para la suite si detecta otra ejecución de Playwright viva.
    Escape explícito si de verdad quieres dos: `SC_ALLOW_PARALLEL_SUITES=1`.
  - **El ratón de Playwright arranca en (0,0), encima de `<sc-sidebar>`.** La barra se expande al
    hover y **se superpone al contenido** (diseño, `sidebar.component.scss:10-12`), así que la
    primera columna de las tablas queda debajo y el clic no entra: *«subtree intercepts pointer
    events»*, 169 reintentos hasta agotar los 90 s. En local pasaba por suerte de timing; el
    runner lento lo destapa. Ya lo cubre `goto()` en `e2e/supervisor/helpers.ts`, que lleva el
    puntero a un punto inerte de la barra superior. **Si lo ves otra vez, no lo tapes con
    `{ force: true }`**: eso se salta el hit-testing y cambia un rojo verdadero por un verde falso.



- **Los dos e2e que "fallan siempre en macOS" se desactivan con `CI=1`**: los screenshots de
  `sc-card` y `sc-message` (`components.spec.ts`) son llamadas a `screenshotBaseline()`, que
  **hace no-op cuando `CI` está puesta**. Medido el 2026-08-24: `CI=1 npm run e2e` → **68/68 en
  verde** en este Mac, dos veces. O sea que el smoke completo SÍ es corrible en local; lo que no
  lo es son sus baselines por plataforma. Sin `CI=1` siguen rojos y **no son tuyos** (el de
  `sc-card` espera una página de 1049px y recibe 1453 — no lo leas como regresión de métrica).
- **El CI son 8 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J).
- **`npm run verify` (26 gates) NO corre el `e2e smoke`.** El `component-structure.spec` (baseline
  del `outerHTML` de cada componente) es un paso aparte de CI, y el textarea autoResize graba su
  alto calculado en un `style` inline que vive en ese `outerHTML`. Un cambio de token/visual puede
  pasar los 26 gates y aun así romper el baseline en CI: en s29, `line-height` md 21→20 movió ese
  alto (77→74) y tumbó el CI en dos push seguidos mientras el verify local iba verde. **Quien lo
  cubre es `npm run preflight`**, que desde s30 corre el smoke ENTERO (`CI=1 npm run e2e`, 68
  tests) y no un subconjunto. `npm run e2e:structure` sigue valiendo como bucle corto mientras
  iteras (`:update` si el cambio es deliberado, y revisa el diff del JSON), pero el gate de
  pre-push es preflight.
- **`npm run verify` son 26 gates desde s28.** Si añades uno, la cifra vive en 4 sitios y
  **ninguno la gatea**: `CLAUDE.md`, `docs/DOCS-INDEX.md`, `docs/AUDIT-SEMANAL.md` y el
  `SKILL.md` de la rutina. Lo que sí falla solo es el README, que debe **nombrar** el guard nuevo.
- **Para MEDIR color o contraste, no uses `ng serve`** (s31): sirvió `blue-400` durante cinco
  rondas de e2e con el fuente y el bundle construido diciendo `blue-300`. Construye y sirve el
  estático (`ng build supervisor` → `http-server dist/supervisor/browser --proxy` para el
  fallback SPA) y apunta `SC_SUPERVISOR_URL` ahí. Si una medición contradice al fuente, la
  primera hipótesis es el build viejo.
- **`npm run e2e` ya NO pisa los PNG de `public/usage/`**: `playwright.config.ts` tiene
  `testIgnore: ['usage/**', ...]`. Comprobado el 2026-08-24 tras dos smokes completos —
  `public/usage/*.png` y `_usage-raw.json` intactos. (La captura de uso se corre a propósito, con
  su config aparte.) Lo visual se sigue gateando con `ng build` AOT.
- **Los permisos de Actions se capan desde la ORG**: cambiar solo el repo no sirve; el ajuste se
  queda en `read` sin avisar. Hay que ponerlo en `write` en los dos niveles.
- **Al escribir un docstring, cuidado con lo que MENCIONAS.** Los scripts que cuentan API
  (`component-audit`) ya ignoran comentarios desde s28, pero la lección de fondo aplica a
  cualquier contador nuevo: si tu regex mira el fichero entero, cuenta también lo que se está
  explicando.

## 🕳️ Lo que se dejó fuera, y por qué (por sesión)

- **s33 · anotar los `scripts/**/*.mjs`** (392 errores con `checkJs`) y **type-checkear
  `code-connect/`** (17): las dos salen del gate nuevo con su motivo escrito, en la tabla de
  arriba. La primera es trabajo real si algún día se quiere; la segunda no es type-checkeable con
  `tsc` a secas y ya tiene su gate.
- **La web no cambia hasta que Carlos consuma los tokens.** Lo nuestro (Figma) está hecho; el
  loop se cierra en su repo. Editar Figma no mueve producción — pieza-verde ≠ loop-funciona.
- **Badge sin tocar** (alto fijo, tamaños fuera de rampa): decisión, no olvido.
- **El desajuste 20-vs-21 de la escala** queda como deuda de foundations, sin abrir.
- **Sin DD formalizado** de "normal en todo / tokenizar texto de componente": está en este
  hand-off; se sube a `DECISIONS.md` solo si Rafa lo pide.
- **La `[intencional]` de `sc-bulk-transcription-modal` y todo lo de código (s28)** siguen igual:
  los SIGUIENTE de arriba están intactos — s30 no los tocó.
- **s30 · el desajuste `filtered()` vs `grouped()` del palette queda ANOTADO, no arreglado.** Si un
  consumidor publicara sus comandos con las categorías intercaladas, las flechas navegarían en un
  orden distinto del que se ve. Ninguno de los dos consumidores de hoy intercala, y arreglarlo es
  otra tarea: el `scrollIntoView` de esta sesión ya casa por `id` y no depende de ello.
- **s30 · las baselines visuales locales siguen siendo sensibles a la CARGA.** Regeneradas y ya deterministas respecto al scroll de la sidebar (4 pasadas completas seguidas en verde), pero las rojas sueltas caen siempre en las pasadas lentas —4,8 min frente a 2,2—, nunca en las rápidas. El CI no las corre (`screenshotBaseline` hace no-op con `CI=1`), así que no tumban nada; en local, si una sale roja, mira el diff antes de regenerar.
- **s30 · sin DD.** Ni el cambio de hover ni el del scroll son decisiones de arquitectura: la razón
  vive en el docstring de `onItemHover`/`scrollHighlightedIntoView` y en los dos gates, que es donde
  se lee cuando hace falta.
