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

## ▶︎ SIGUIENTE — sin preguntar

> **La bandeja del frente, y por eso vive ARRIBA.** Entran dos cosas: lo que queda por hacer, y
> **el tema que aparece a mitad de sesión y NO bloquea** lo que estabas haciendo. Si bloquea no
> es un apunte: es parte del trabajo en curso y se termina ahí mismo.
>
> **Al abrir sesión, lee la lista ENTERA antes de coger nada.** Los apuntes que se tocan entre sí
> son UNA tarea, no tres: agrúpalos en un solo encargo. Esta ficha estuvo hasta el 2026-09-10 con
> esta sección en la línea 2500 de 2685, enterrada bajo el histórico, y el precio fue medible:
> cada hallazgo abría chat propio en vez de esperar aquí, y una rama llegó a vivir en dos cajas a
> la vez (`verdict-avisa-pr-fundido` y su `-2`: el mismo SHA `4964d47` en la local y en `origin`).
>
> Lo cerrado NO se tacha aquí: se baja al histórico del final del fichero.

**Lo que dejó el barrido de estilos de texto del 2026-09-11 (tarde), pendiente de RAFA:**

- **La tabla de transcripciones escribe a 16px y ninguna otra lo hace** (204 textos en una carga:
  seis columnas de `/conversaciones`). Es el residuo más grande y 16 no es peldaño de la rampa.
  Está medido y fotografiado a 16 y a 14; solo falta que Rafa elija. Detalle en el tramo de abajo.
- **12/20 no es ningún estilo**: sale cuando la clase va en un contenedor y el descendiente declara
  solo el tamaño (pastillas de estado de repositorios, cabeceras de grupos asignados, contadores de
  pestaña). ¿Text style propio para pastilla, o `line-height` explícito?
- **`sc-docs` es la siguiente tanda del barrido**: 237 reglas con `font-size` y DOS usos de la clase
  (29 podrían llevarla hoy, 127 heredan el interlineado, 57 están fuera de la rampa). El showcase
  del DS es el que peor predica con el ejemplo. Cifras y matices en el tramo de abajo.

**Lo que dejó el 2026-09-11 (revisión de Orca), sin hacer:**

- **`preflight:scope` debería negarse sobre un árbol que no está rebasado en `origin/main`.** Hoy se
  tiraron DOS preflights (8 min cada uno) porque `main` avanzó dos veces (#105, #103) entre el
  preflight y el push, y `ci:verdict` respondió «en conflicto». Es mecanizable: `git fetch` y
  `merge-base --is-ancestor origin/main HEAD` antes de correr nada; con su caso rojo fabricado.
- **La portada del PR de `design-tokens-sync` no dice si el robot lo verificó.** #104 se fundió a
  ciegas con tres commits crudos del plugin. Que el cuerpo del PR (lo escribe `tokens-sync.yml`)
  lleve el sha que el robot reseteó, y que un push posterior del plugin lo invalide a la vista.

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

1. **El eslabón que sigue faltando: nadie compara *fichero de Figma ↔ export*.** `tokens:parity`
   compara *export ↔ CSS*. Por ese hueco se coló el desfase de julio. No puede ser gate de CI
   (necesita el bridge abierto), así que es procedimiento manual — mismo caso que el Check D de
   `docs:coherence`.
   ⚠️ **Cómo repetirlo sin tropezar**: resuelve a RGBA final **los dos lados** antes de comparar.
   La primera pasada dio **15 divergencias falsas** por leer los colores de Figma sin canal alfa
   (`#00000000` vs `#000000`) y por comparar un alias contra un valor ya resuelto. Y en el JSON del
   export **las claves raíz llevan las barras dentro** (`d['aura/semantic/dark']['primary']`).
2. **El 1:1 web↔Figma de chip · tag · toast** — sigue **bloqueado por herramienta**, no por
   decisión. Ver la sección de Figma más abajo.
3. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)** que quede tras
   s34, y **los cabos de DD-24** (round-trip de iconos) en [`ROADMAP.md`](../ROADMAP.md).
## ✅ 2026-09-11 · El barrido de estilos de texto llega a lo que la primera pasada no miró (116 → 101)

**Sello:** sobre HEAD `3052ec5` (el #116 en `main`). DD-69 ampliado. `audit:text-styles` §4 con el
trinquete en 101. `text-styles-applied` +3 en el navegador, los tres **rojos contra el build
anterior** y verdes contra este. Veredicto por `ci:verdict` tras el push.

**De dónde sale.** Rafa preguntó si el barrido de la mañana aplicaba también a
`/admin/repositorios`. Aplicaba — y la respuesta útil no era esa pantalla, era que **la primera
pasada barrió lo que estaba en SU inventario, no lo que tenía motivo para quedarse**: su inventario
salía de 38 rutas y 6 modales, y lo que no se abrió, no se vio.

**Lo que faltaba, medido.** Un rastreador más ancho: las 38 rutas **más 18 estados abiertos**
(modales, paneles, popovers, fichas, menú de usuario, barra lateral desplegada). **4.517 mediciones
sobre 56 estados**; las 38 rutas solas, sin repetir, son 2.503 textos.

| Qué faltaba | Textos |
| --- | ---: |
| Celdas de las **nueve listas de repositorio** + grupos + usuarios | 270 |
| **Título de página** de las 13 pantallas (DD-55 lo dejó nombrado como pendiente) | 31 |
| Barra lateral de Configuración, cabecera de grupos asignados, chip de tipo de entidad, pista de Sistema, modal de descarga, selector de conjunto de datos | 40 |

14 reglas migradas y una MUERTA fuera (`.hub__title`: ninguna plantilla la usaba, el título del hub
es `page__heading`). **0 diferencias** de tamaño, interlineado, peso, familia, tracking y posición,
medido contra el build de `main` recién construido aquí. **341 textos llevan la clase en su propio
elemento Y miden ese estilo** (283 en las 38 rutas). Otros 69 solo la heredan de un ancestro que la
ganó —61 pastillas de estado, 5 prefijos, 3 rótulos activos— y NO cuentan: miden otra cosa, y son
el punto 2 de abajo. Ruido del instrumento (dos rastreos del mismo build): 0.

**La trampa nueva, cazada con el fallo puesto.** Una clase `.sc-text-*` sobre un selector **global**
de la app compite de tú a tú (0-1-0 las dos) y decide el ORDEN del bundle, que hoy fija el
empaquetador. `.page__heading` se jugaba así sus 21px de separación con el cuerpo, porque la clase
trae `margin: 0`. Pasa a `h1.page__heading` y el margen se mide desde el navegador. El razonamiento
entero y la inyección del fallo, en DD-69 y en el comentario de `_page.scss`.

---

### 🔴 LO QUE QUEDA SIN ATAR Y **NECESITA A RAFA**, no otro barrido

**1. La tabla de transcripciones escribe a 16px y ninguna otra lo hace.** Seis columnas de
`/conversaciones` (Hora, Fecha, Origen, Destino, T. Conv., T. Espera) ponen el texto directamente en
la celda, sin el `<span>` que el resto de tablas usa para declarar tipografía, y heredan los **16px
del documento** (`html, body` no declara `font-size`). **204 textos en una sola carga**, el residuo
más grande, y **16 no es ningún text style** (DD-54). Medido el mismo día: `/conversaciones` →
16/24; `/admin/agendas`, `/admin/usuarios` y `/conversaciones/entidades` → 14/20. La trampa la
documenta ya la hoja de la página de entidades («sin repetirla aquí las celdas heredaban los 16px
del documento»); nadie la llevó a esta tabla. En toda la app hay 222 textos a 16/24: los otros 18
son el disparador del popover de grupos de `/admin/agentes` y dos `<h2>` de entidades.

**No se ha tocado a propósito**: bajar a 14 es un cambio VISIBLE en la pantalla principal, y eso no
se cuela en un barrido cuyo contrato es «0 diferencias». Está construido en su versión mínima y
fotografiado a 16 y a 14 para decidirlo mirándolo (LEARNINGS #18). Recomiendo bajarlo: alinea esa
tabla con las otras nueve y con la rampa.

**2. Combinaciones que no son ningún estilo, por herencia de un contenedor con clase.** 12/20 en las
pastillas de estado de repositorios (61), en las cabeceras de grupos asignados y en los contadores
de pestaña. No es regresión del barrido —pasaba igual con los tokens sueltos—, pero es lo siguiente
que decidir: ¿pastilla con text style propio, o `line-height` explícito?

**3. El resto tiene motivo escrito y está en el gate**: familia mono (264 textos), muebles de
interlineado apretado, y los **1.198 textos** que pinta un componente del DS o PrimeNG — que por
DD-55 no llevan clase: si tienen que verse distinto se mueve su TOKEN. Ahí viven los pesos 500 que
la rampa no tiene (`th` a 12/18/500, etiquetas de campo a 14/21/500). Eso es del TEMA.

**4. El Supervisor no es «toda la plataforma»: falta `sc-docs`.** El showcase del DS tiene **237
reglas con `font-size` y DOS usos de la clase** — más tipografía suelta de la que tenía el
Supervisor al empezar. Clasificadas contra las capas: **29** podrían llevar la clase hoy, **127**
declaran el tamaño y heredan el interlineado, **57** están fuera de la rampa (pesos 700, tamaños sin
peldaño) y **24** son mono o glifo. Otra app, otro build y otra medición: mezclarla aquí dejaba el
PR sin poder revisarse. Tiene una punta propia: en un showcase hay texto que **ilustra** tipografía,
así que no todo lo que declara tamaño está mal. **Las demás no entran por decisión escrita**:
`agent` y `agent-mini` no declaran ninguna, las 134 de `cuscare` son de una RÉPLICA (DD-35) y las
102 de `ui-smartcontact` son de los componentes del DS, que leen el tema (DD-55).

## ✅ 2026-09-11 · El botón de guardar vuelve a medir lo que dice su texto

**Sello:** PR #114, fundido con el CI de `main` VERDE leído por `ci:verdict` (HEAD `ed28a9a`);
`preflight:scope --run` verde sobre el árbol final, `verify` verde y `e2e:supervisor` 149/149 en
local. Los números de cada medición están en el cuerpo del PR y en el comentario de `main.scss`.

**De dónde sale.** Rafa, mirando `/config/aed/servicio` en producción: «no entiendo por qué el
botón guardar no está en hug contents y se ve del mismo tamaño que descartar cambios». No estaban
igualados a propósito: los dos chocaban con el MISMO suelo —el `min-width: 128px` de
`.top-bar__actions button`, puesto el 2026-08-25 contra el SALTO del CTA entre listas— y la
coincidencia lo disfrazaba de decisión de diseño. Medido en el build desplegado a 1440px:
«Guardar» hug 65.79 → pintado 128 (62px de aire) y «Descartar cambios» hug 127.84 → 128, o sea
**0.16px por debajo del suelo**. Esa regla es la ÚNICA de las 5.532 de la página que toca
width/min/max/flex en ese botón: ni `flex: 1`, ni `width: 100%`, ni DS, ni PrimeNG.

**Lo que cambia.** El gancho pasa a `.top-bar__cta`, una clase que la página pone A MANO en su
botón de crear (las 9 listas). Los formularios —7 de las 16 páginas que proyectan acciones— van a
hug puro, como los dibuja Figma (66.5 / 128.5), y el anti-salto de las listas sigue en pie:
`/admin/usuarios` 121.45 natural → 128; `/admin/labels` (el envuelto en `.page__create-anchor`)
→ 128; a ≤640px el suelo se suelta. Lo que pasó estaba PREDICHO en el comentario de la regla
(«si algún día lleva dos, revisa si los dos quieren suelo») y aun así tardó dos semanas en verse:
un aviso en un comentario no es un gate.

**La clase se pone a mano a propósito, no por pereza de selector.** `:has(> sc-button:only-child)`
era la solución obvia y es FALSA por dos sitios medidos: en un formulario limpio el botón de
descartar no existe (`@if (dirty())`), así que le daría suelo al Guardar y se lo quitaría al
escribir —el botón encogiendo 62px en vivo—; y 4 de los 9 CTA de lista viven dentro de
`.page__create-anchor`, así que tampoco son hijo único del contenedor.

**La trampa de medición, que vuelve a morder a cualquiera que enumere reglas CSS desde la consola:**
`CSSStyleRule` TAMBIÉN tiene `cssRules` (nesting). Un recorrido `if (r.cssRules) { recurse;
continue }` salta TODAS las reglas de estilo y devuelve «ninguna regla casa» con 5.532 presentes:
a un paso de afirmar que no había override con el `min-width` a la vista en el computado. Bifurca
por `r.selectorText` y contrasta SIEMPRE el barrido contra `getComputedStyle` — si el computado
dice 128px y tu barrido dice 0 reglas, el roto es el barrido. Queda en la memoria del agente
(`browser-measure-traps`).

**Fuera a propósito:** el `max-width: 256px` se va con el suelo al CTA de lista; los botones de
formulario se quedan sin tope porque ahí no resolvía ningún problema medido. Y no se tocó el
tramo de Figma: el Kit no arbitra este suelo, la divergencia sigue siendo nuestra y deliberada.


## ✅ 2026-09-11 · Cerrar un chat deja de ser una corazonada: un comando lo dice, y no manda borrar trabajo

**Sello:** PRs #103, #109 y #110, fundidos con el CI de `main` VERDE leído por `ci:verdict`
(`5764b84`, `7d479b9`, `fcf8f87`); `preflight` verde sobre cada árbol final; 19 tests en
`scripts/__tests__/sesiones.test.mjs`, cada regla en rojo y en verde. El detalle de cada fallo
está en el cuerpo de los tres PRs; aquí queda la pista.

**De dónde sale.** Rafa pidió analizar las PRs de dos días y acabó en dos preguntas: «¿podría
cerrar este chat ya?» y «que fuera esto más rápido e infalible». Misma causa MEDIDA: la
`▶︎ SIGUIENTE` de esta ficha vivía en la **línea 2500 de 2685**, bajo todo el histórico, mientras
los otros frentes la tienen en las 43, 58 y 83. Sin sitio visible donde aparcar el tema que sale a
mitad de sesión, cada hallazgo abre chat propio: **nueve worktrees vivos**, tres con su trabajo ya
en `main`, y **dos ramas con el mismo commit** de dos sesiones que no se vieron.

**Lo que cambia.** La bandeja sube arriba con la regla que faltaba (leer la lista ENTERA al abrir:
los apuntes que se tocan son UNA tarea), y nace **`npm run sesiones`**, que contesta «¿puedo
cerrar este chat?» para todas las cajas y canta el trabajo duplicado. No pisa `ci:verdict`, que es
el veredicto PROFUNDO de UNA rama.

**Las dos trampas que hay que recordar de él**, porque volverán a morder a quien toque el script:

- **El repo funde con SQUASH**: ni `origin/main..rama` ni las fechas dicen si el trabajo está
  dentro. Lo dice el PR, y por contenido `git cherry origin/main <rama>` — lo único que ve un
  commit anterior al merge que se quedó fuera de él (#109) y que no acusa a uno que ya entró por
  otra puerta (#110).
- **Nada que diga «borra» sale si hay algo que perder**: `status --porcelain` del árbol AJENO y
  `locked` mandan sobre el veredicto. Estrenándolo propuso borrar dos worktrees con trabajo dentro.

**Lo que costó, que es el dato para la próxima.** Tres rebases y cinco preflights para entregar
cinco ficheros: dos murieron por la máquina (cola del :4280 y falta de memoria con seis sesiones
vivas), uno por un gate rojo propio, y `main` se movió cinco veces por debajo. El #104 (Design
tokens sync, automático) se fundió **con su CI en rojo** y dejó `main` roto para todas. Tres veces
dos sesiones hacían lo mismo sin verse; la tercera no acabó en rama gemela **solo porque se
preguntó antes de tocar** (`SendMessage` a la hermana, que cedió el arreglo y dio el método bueno).

**Fuera a propósito:** no se borró ningún worktree ajeno — uno recién creado también está vacío, y
esas pueden ser sesiones que arrancan. Es el error del #109 visto desde el otro lado.


> El tramo de la PRIMERA pasada del barrido de estilos de texto (165 reglas, #111) se archivó
> el 2026-09-11 al entrar la segunda: lo cuenta entero el tramo de arriba y su decisión vive en
> `docs/DECISIONS.md` DD-69. Tag `archive/handoff-ds-2026-09-11-tarde`.

> El tramo del **plugin de Figma** (filtro `paths` de `tokens-sync.yml`, DD-68) se archivó el
> 2026-09-11 por el tope de 400 líneas. Vive en git y en el tag `archive/handoff-ds-2026-09-11-tarde`;
> su decisión, que es lo durable, está entera en `docs/DECISIONS.md` DD-68.

## 🗄️ Histórico de la lista SIGUIENTE — ya cerrado

> Lo que queda VIVO está **arriba**, en `▶︎ SIGUIENTE`. Aquí solo el registro de lo que se cerró:
> se conserva porque explica por qué las cosas están como están, no porque quede algo que hacer.

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
- **El CI son 9 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J). Los e2e de app solo corren allí (DD-60); las baselines visuales de sc-docs, a mano.
- **`npm run verify` (31 gates) NO corre el `e2e smoke`.** El `component-structure.spec` (baseline
  del `outerHTML` de cada componente) es un paso aparte de CI, y el textarea autoResize graba su
  alto calculado en un `style` inline que vive en ese `outerHTML`. Un cambio de token/visual puede
  pasar los 26 gates y aun así romper el baseline en CI: en s29, `line-height` md 21→20 movió ese
  alto (77→74) y tumbó el CI en dos push seguidos mientras el verify local iba verde. **Quien lo
  cubre es `npm run preflight`**, que desde s30 corre el smoke ENTERO (`CI=1 npm run e2e`, 68
  tests) y no un subconjunto. `npm run e2e:structure` sigue valiendo como bucle corto mientras
  iteras (`:update` si el cambio es deliberado, y revisa el diff del JSON), pero el gate de
  pre-push es preflight.
- **La cifra de gates de `verify` YA se gatea** (check M de `docs:coherence`, desde el
  2026-09-06). Esta trampa decía que vivía en 4 sitios sin vigilar; al escribir el check se
  midió y eran **once**, con tres cifras distintas conviviendo (34, 29 y 26 cuando eran 29).
  Seis de las once están en este mismo hand-off y son registros fechados de lo que se lanzó
  aquel día, así que `docs/handoff/` queda exonerado a propósito — pero esta sección de
  trampas no: si cambia la cadena, se actualiza a mano. El README lo cubre aparte (check B),
  que exige **nombrar** el guard nuevo.
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
