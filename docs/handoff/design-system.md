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

- ~~La tabla de transcripciones a 16px~~ — **decidido el 2026-09-12**: Rafa dijo «ajústalo para que
  tenga sentido». Hecho, DD-71, tramo de arriba.
- **12/20 no es ningún estilo**: sale cuando la clase va en un contenedor y el descendiente declara
  solo el tamaño (pastillas de estado de repositorios, cabeceras de grupos asignados, contadores de
  pestaña). ¿Text style propio para pastilla, o `line-height` explícito?
- **`sc-docs` es la siguiente tanda del barrido**: 237 reglas con `font-size` y DOS usos de la clase
  (29 podrían llevarla hoy, 127 heredan el interlineado, 57 están fuera de la rampa). El showcase
  del DS es el que peor predica con el ejemplo. Cifras y matices en el tramo de abajo.

**Lo que queda de la tanda «adelante a todo» del 2026-09-11** (los dos apuntes de la revisión de
Orca se cerraron en el #113; `agent-mini` entró en el CI; la doc, en su PR):

- **El rastreador de textos de esta casa NO está commiteado**, y es la red que exige LEARNINGS #16
  para cualquier barrido de tipografía. Cada sesión lo reescribe. Vive hoy en el scratchpad de dos
  sesiones distintas; si el barrido de `sc-docs` se hace, vale la pena que entre en `tools/`.
- **Los 66 inputs públicos sin ejemplo** que destapó el trinquete de `audit:doc-snippets` (DD-70).
  El gate los imprime con `--inputs`; la lista solo baja, y bajarla es escribir doc, no barrer.

**Lo que dejó s42, medido y sin hacer:**

- ~~**Las descripciones de los text styles de Figma están corridas un peldaño.**~~ → **HECHO el
  2026-09-12** con el bridge: las 12 reescritas y **releídas para verificar** (0 vacías, y cada una
  nombra su propio `tamaño/interlineado`, así que el día que la rampa se mueva el desfase se ve).
  ⚠️ De paso, una corrección MÍA: el 2026-09-11 escribí que el fichero del DS llevaba la rampa
  VIEJA (`display1` 36/52, `H1` 32/48). Era falso — leí con `figma_get_text_styles` sin fijar el
  fichero y me contestó otro. Apuntando por `fileKey`, los 12 son la rampa buena.
- **El tier `app/typography/xl|xxl` existe en Figma y no lo consume nadie** (medido: 0 nodos, 0
  text styles). Está clasificado como `not-consumed` en `coverage-map.mjs`. Si algún día se
  quiere de verdad, va a `sc-preset/extend.ts` + `APP_TYPOGRAPHY_CONTRACT` y sube al bucket
  `value-check`; hasta entonces declararlo consumido sería mentir.
- **`--sc-font-size-caption-bold` está declarado y tiene 0 usos.**
- **`display-1` se quedó sin consumidores y `h1` con uno que es solo fallback.** Es el estado
  honesto tras DD-48 (la rampa era aspiracional desde DD-13), no una regresión: la rampa ya dice
  la verdad y espera consumidores de PRODUCTO. Si el Supervisor adopta la rampa, es ahí.

1. ~~**El eslabón que falta: nadie compara *fichero de Figma ↔ export*.**~~ → **HECHO el
   2026-09-12, y sale LIMPIO.** `tools/figma-export-parity.mjs <capa>` imprime el JavaScript —con
   los valores del Kit ya resueltos y embebidos— que se le pega a `figma_execute_across_files`;
   compara DENTRO de Figma para no perder precisión en el viaje. No es gate de CI (necesita el
   bridge abierto), como el Check D de `docs:coherence`.

   | Capa | Tokens | Divergencias |
   | --- | ---: | ---: |
   | `primitive` | 282 | 0 |
   | `semantic-light` · `semantic-dark` | 82 + 82 | 0 |
   | `component-light` · `component-dark` | 346 + 346 | 0 |
   | `app` | 6 | 0 |

   **844 tokens, ni uno desfasado, y ninguno que exista en un lado y no en el otro.** Por ese
   hueco se coló el desfase de julio; hoy no hay ninguno.

   ⚠️ **Las cuatro trampas están DENTRO de la herramienta**, y las cuatro dieron un falso rojo
   antes del verde: RGBA final por los dos lados (sin alfa, 15 falsos) · alias por los DOS lados
   (el export guarda `{surface.0}`) · cada alias resuelto EN SU CAPA (si no, la oscura pisa a la
   clara) · y la gorda, **el MODO no viaja entre colecciones**: el `modeId` de «Dark» en
   *Component* no es el de «Dark» en *Semantic*, así que seguir un alias con el modo de partida
   cae al primer modo del destino —el claro— y la capa oscura falla **en bloque**. Me dio 21 de 24
   familias «discrepando» y no era deriva, era mi sonda; lo destapó mirar UN token
   (`button/primary/background`) en vez de creerme el informe. Nota del export: la tipografía vive
   en `aura/custom`, no en `aura/primitive`, pese a que los alias la llamen así.

2. **El 1:1 web↔Figma de chip · tag · toast** — sigue **bloqueado por herramienta**, no por
   decisión. Ver la sección de Figma más abajo.
3. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)** que quede tras
   s34, y **los cabos de DD-24** (round-trip de iconos) en [`ROADMAP.md`](../ROADMAP.md).
## ✅ 2026-09-12 · La tabla de transcripciones escribe como el resto: 14/20 y no 16/24

**Sello:** sobre HEAD `11d1373` (el #118 en `main`). DD-71. `text-styles-applied` +1 en el
navegador, **rojo contra el deploy de `main`** y verde contra este build. Veredicto por
`ci:verdict` tras el push.

**De dónde sale.** Era el punto 1 de «lo que queda» del barrido de ayer, el único residuo grande que
pedía una decisión y no otro barrido. Rafa: «lo de la tabla a 16, ajústalo para que tenga sentido».

**Qué pasaba.** Cuatro columnas de `/conversaciones` —Hora, Fecha, Origen, Destino— escribían el
texto DIRECTAMENTE en el `<td>`, y las dos numéricas en un `<span>` que no declaraba tamaño. El
`<td>` lo pinta el DS y `html, body` no declara `font-size`, así que ese texto heredaba **los 16px
del documento**. Las otras diez tablas de la app no caen en esto porque proyectan un `<span>` que sí
lo declara; aquí faltaba ese envoltorio. 16 tampoco es peldaño de la rampa (DD-54).

**El arreglo es el patrón que ya existía**, no uno nuevo: una plantilla de celda que envuelve el
texto en un `<span class="sc-text-body-regular">`, y la clase en las dos numéricas, que la comparten
con `.memory-num-cell` (cifras tabulares, que siguen tabulares).

| Medido en el build, tema claro, 1440px | Antes | Después |
| --- | ---: | ---: |
| Texto de celda | 16/24 | **14/20** |
| Alto de la tabla | 2.478 px | **2.249 px** |
| Filas que parten el nombre en dos líneas | 26 | **16** |
| Fila de una línea | 57 px | 57 px |

**Dos cosas que NO cambian, y conviene saber por qué.** La fila de una línea sigue midiendo 57px
porque su suelo lo pone el `<td>`, que sigue a 16/24 — eso es así en TODAS las tablas de la app
(medido el mismo día en `/admin/agendas` y `/admin/usuarios`), o sea que el arreglo alinea esta
tabla con las demás en vez de inventarle una excepción. Y los 4px que la separan de esas dos (57
contra 53) son su padding propio, el aire de Memory, deliberado y ya vigilado por un test.

**Lo que se midió para dar esto por bueno.** Rastreo de las 38 rutas más 18 estados abiertos, antes
y después: **1.020 textos** cambian de tamaño, todos dentro de `/conversaciones` y todos de 16/24 a
14/20; **0 cambios** en las otras 37 rutas y sus estados. El test nuevo mide EL ELEMENTO QUE PINTA
el texto, lo envuelva un `<span>` o no: la primera versión buscaba el `<span>` y contra el build
anterior moría con «element not found», un rojo que dice que falta un nodo en vez de decir que la
pantalla mide mal. Ahora el rojo trae la magnitud: «la celda de Hora mide 16px/24px».


## ✅ 2026-09-11 · Tres guardas que cierran la lista de pendientes del proyecto

**Sello:** DD-70. Tres PR sobre `main` (#113, #117, #118), cada uno con su `ci:verdict` leído.

**De dónde sale.** Rafa pidió el orden de prioridad de todo lo pendiente y luego «adelante a todo».
Se leyeron los cuatro hand-offs, los PR abiertos y las cajas, y se ordenó por lo que le cuesta a
él (defectos que le llegan), no por tamaño.

**Lo que entró.** (1) El preflight **no corre sobre una rama rezagada** y la marca deja de valer si
`main` avanzó y funde con CONFLICTO —solo entonces, o son 8 min en bucle con tres sesiones
fundiendo—; la portada del PR de tokens lleva el sha que el robot verificó. (2) **`agent-mini` entra
en el CI**, el preflight, `typecheck` y el carril acotado: era el quinto sitio en producción y solo
Cloudflare cazaba una rotura de su build. (3) **`audit:doc-snippets` ata el código que la doc ENSEÑA
con el que EJECUTA** y cada ficha gana su **anatomía leída del DOM** (`sc-button > p-button >
button.p-button`); cuatro defectos reales, uno el que vio Rafa en `/#/components/button`.

**Lo que NO se hizo, y por qué.** El barrido de tipografía suelta lo estaba haciendo **otra sesión a
la vez** (#115, caja `grayling`). Se vio mirando `git worktree list` y los PR abiertos ANTES de
tocar las mismas plantillas: dos sesiones editando `projects/supervisor` es lo que costó el día del
2026-09-03. Queda suyo, con sus preguntas para Rafa arriba.

---

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

**1. La tabla de transcripciones a 16px** — **RESUELTO el 2026-09-12** (DD-71): Rafa pidió
ajustarlo y las seis columnas escriben ya a 14/20 como el resto. Lo cuenta el tramo de arriba.

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

> El tramo del **botón de guardar** (#114, el suelo de 128px queda solo en el CTA de lista) se
> archivó el 2026-09-12 por el tope de 400 líneas. Vive en git y en el tag
> `archive/handoff-ds-2026-09-12`; el cuerpo del PR #114 y el comentario de `main.scss` guardan
> sus números.

> El tramo de **`npm run sesiones`** (la bandeja sube arriba, y un comando contesta «¿puedo
> cerrar este chat?») se archivó el 2026-09-11 por el tope de 400 líneas. Vive en git, en el
> tag `archive/handoff-ds-2026-09-11-tarde` y en el cuerpo de sus PR; el comando lo cuenta
> `NEXT-SESSION.md`, que es donde hace falta.

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
| ~~**Lienzo de página gris↔blanco**~~ → **DECIDIDO Y HECHO**: [DD-45](../DECISIONS.md) lo llevó a BLANCO el 2026-08-31 (`app-shell.component.scss` pinta `--sc-bg-canvas`), y Rafa lo reconfirmó el 2026-09-11 («el lienzo sí, pasa a blanco») sin saber que ya estaba. La fila llevaba diez días mintiendo: si una espera se resuelve en otro tramo, hay que venir a tacharla aquí |
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
