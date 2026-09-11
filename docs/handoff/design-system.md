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


## ✅ 2026-09-11 · La tipografía de pantalla se pone por su nombre: 165 reglas pasan a `.sc-text-*`

**Sello:** DD-69. `audit:text-styles` gana la §4 (trinquete `TIPOGRAFIA_SUELTA_MAX = 116`,
**validado en rojo por arriba Y por abajo** más control negativo; 23 tests). `text-styles-applied`
+2 en el navegador. Medido antes y después en el build. Veredicto por `ci:verdict` tras el push.

**De dónde sale.** Rafa inspeccionó «Agente AED 1» en Computed y vio 14 / 20 / 600: tres números
que hay que traducir a mano a `Body/body-semibold`. «¿No se puede lincar el estilo de texto?». El
enlace es la clase, existía desde el `#98` y la llevaban 49 textos; el resto seguía con los tres
valores en la hoja. Era el punto 1 de «lo que queda» del tramo del interlineado.

**Lo que se hizo.** Inventario: 301 reglas con tipografía por token en 61 hojas. Migradas **165**
(394 declaraciones fuera de las hojas, 226 elementos con clase en 86 ficheros; usos de `.sc-text-*`
49 → 275). En Inspect ahora se lee `class="cell-name sc-text-body-semibold"` en la línea del
elemento, sin traducir nada.

**La red, montada antes de tocar (LEARNINGS #16).** Un rastreador visita las 38 rutas del build y
anota tamaño, interlineado, peso, familia, letter-spacing, márgenes y posición de cada texto:
**3.664 textos**, más **813** abriendo seis modales y paneles. Ruido del instrumento: dos rastreos
del mismo build, **0** diferencias. Resultado tras migrar: **0** diferencias. Y el instrumento se
validó con el fallo puesto sin buscarlo: la primera pasada cazó **27** cambios, que son las dos
lecciones de abajo.

**Dos cosas que la clase NO puede sustituir, cazadas midiendo:**

1. **`font: inherit` en la misma regla** (el nombre de categoría es un `<button>`): el shorthand,
   con la especificidad del componente, pisa a la clase y el texto se fue a 16/24/400. Se quedan
   con tokens (3 reglas), y el migrador salta cualquier regla con `font:`.
2. **Texto que hereda familia mono** (`.ext__type` dentro de `.cell--mono`): la clase impone Inter.
   Se quedan (5 reglas); el migrador compara también la familia MEDIDA, no solo los tres números.

Y lo excluido a propósito, con nombre: chips y pastillas (37, su interlineado no es ningún estilo),
familia propia (22), modificadores que solo cambian el peso (15), interlineados sin unidad (33,
aparcados), hosts dinámicos o inexistentes (14). Para las reglas SIN peso declarado (120), el peso
heredado se decidió por la MEDIDA cuando el texto era visible y, si no (modales), por los ancestros
reales en la plantilla: si alguno declara 600 no se decide a ciegas.

**Lo que queda (116 reglas con `font-size`, y el trinquete lo vigila):** son exactamente esas
familias. Bajar más pide una decisión de Rafa, no un barrido: ¿un text style para chips?, ¿la clase
sin familia para las celdas mono? Hasta entonces, el tope solo baja.

## ✅ 2026-09-11 · El plugin ya no cuela ficheros en main, el hand-off deja de crecer y las bifurcaciones al componer tienen tabla

**Sello:** HEAD `cc6925b` (el squash de #106 en `main`). DD-68. Veredicto del CI por
`ci:verdict`, leído.

**De dónde sale.** Rafa pidió analizar `stablyai/orca` (skills, `.github`, docs, releases) y sacar qué
adoptar; luego, revisar esa lista contra mis sesgos y los suyos. Medido cada punto contra este repo:
4 de 10 ya existían (ratchet, tests de doc, release seguro, bloques compartidos), 3 no aplican, y al
medir el ruido del diff de tokens salió el defecto de verdad.

**Lo que se hizo.**
- **`main` estaba en rojo desde las 08:27**: el PR #104 metió 172 ficheros de `.theme-designer/` (el
  plugin) sin que ningún check los mirase. Cadena: push del plugin sin export → `tokens-sync.yml` no
  dispara (filtro `paths`) → `ci.yml` exime esa rama confiando en el robot → fundido a mano. Se quita
  el filtro `paths` (cualquier push a `design-tokens-sync` pasa por el reset), se borran los 172
  ficheros, DD-68 con la alternativa descartada.
- **Tabla «Bifurcaciones al componer»** en `AGENTS.md` §UX (mapa de composición): 15 filas «quieres /
  usa / no uses / lo sostiene», cada una apuntando a su DD o gate. Molde: el style guide de Orca.
- **Este hand-off medía 2.924 líneas (49 tramos, ~52k tokens) y se leía entero cada sesión.** Se
  archiva completo en el tag `archive/handoff-ds-2026-09-11`, se deja el tramo vigente + dos + las
  secciones fijas, y `docs:coherence` CHECK P (`scripts/handoff-shape.mjs`, con test rojo) lo mantiene
  en ≤ 400 líneas y ≤ 6 tramos. `NEXT-SESSION.md` lo dice en su paso 1.
- `Users/` (basura sin versionar en la raíz, con un `.git` dentro) borrado. `findings/` se queda: lo
  lee el frente Agent.

**Lo que NO se hizo, y por qué.** Nada de lo demás de la lista de Orca: CI por paths, `type(scope):`
en commits, plantillas de issue, `linguist-generated` (las zonas `@sc-gen` son bloques, no ficheros).
Están medidos y descartados en el plan de la sesión; el análisis de formato de skills de Orca vale
como molde para cuando toque escribir una guía nueva.

**Pendiente que abre.** Que la portada del PR de `design-tokens-sync` diga si el robot lo verificó,
para que un PR del plugin no se pueda fundir a ciegas (hoy solo lo dice el estado del run).

## ✅ 2026-09-11 · El interlineado deja de depender de quién sea el padre: 212 reglas bajan a 23

**Sello:** DD-67 (ampliado). Gate ampliado y **validado con el fallo puesto más DOS controles
negativos**: una regla con tamaño y sin interlineado → rojo; la misma en un CHIP → no salta; en un
ICONO → no salta. 18 tests. Medido en el navegador antes y después. Veredicto por `ci:verdict`.

**De dónde sale.** Rafa: «ataca las 211 reglas sin interlineado y ya cerramos». Era el bucket que
la tanda anterior dejó nombrado.

**LO PRIMERO FUE MEDIR EL DELTA, y cambió el plan.** Un `font-size` sin `line-height` hereda, así
que el texto no mide lo que dice su rol. Pero cuánto se mueve depende de quién sea el padre, y eso
no se deduce del CSS:

| | Hoy computa | El rol | Delta |
| --- | --- | --- | --- |
| Los de **12px** | 18px | 18 | **0** — ya estaban bien, por casualidad |
| Los de **14px** | 21px | 20 | **−1px** por línea |
| Chips y pastillas | 12/12 y 14/14 | 18 y 20 | **+6px** — les cambia la altura |

Esa tercera fila es la que salvó el trabajo: en una pantalla de lista había **25 textos a 14/14 y
17 a 12/12**, todos chips, pastillas y contadores que heredan un `line-height: 1` a propósito
porque su altura la manda el padding. Aplicar el rol a ciegas les habría sumado 6px a cada uno.

**Lo que se hizo.** 212 → **23**, y los 23 que quedan son exactamente esa familia, excluida por
nombre y con su test de control negativo. Los de 12px no mueven un píxel: pasan de ser correctos
por herencia a serlo por declaración. Los de 14px se aprietan 1px por línea.

**TRES FALLOS MÍOS EN LA EDICIÓN EN MASA, y cómo se cazó cada uno** — que es lo que merece la pena
contar, porque los tres dieron «verde» en el conteo:

1. **46 bloques con DOS interlineados.** Mi control de «¿ya lo tiene?» solo miraba lo que iba
   ANTES del `font-size`, así que duplicaba en las reglas que lo declaran después. Se rehízo en DOS
   pasadas: `aplanar` da el mapa completo del bloque y solo entonces se inserta.
2. **24 reglas saltadas en silencio.** El reescritor no ignoraba las llaves dentro de COMENTARIOS,
   así que la pila se descuadraba en el primer `/* … { … */` y a partir de ahí el selector salía
   vacío. `aplanar` no sufre porque quita los comentarios antes de mirar nada.
3. **Un fallo de la tanda ANTERIOR que mi verificación había tapado**: `.table__td-name` vive en
   DOS ficheros y mi comprobación agrupaba por NOMBRE en un `Map`, que se queda con el último. En
   usuarios y agentes quedó en 600 y **en grupos se quedó en 400**, y se fundió así en el `#102`.
   Verificar por nombre cuando el mismo nombre vive en dos sitios es no verificar. Ahora se
   comprueba por (fichero, selector).

**Y una limitación que queda dicha**: lo que no tiene regla propia sigue heredando. En la pantalla
de referencia quedan cuatro `<span>` sin clase a 14/21; no hay regla que arreglar, y ponerles una
sería inventar un nombre para cada texto suelto.

**⚠️ La trampa de la memoria mordió, y no era mía.** El preflight se cayó por el gate de forma de
la memoria: otra sesión había dejado `MEMORY.md` en 1.010 palabras (tope 1.000) y una ficha en 440
(tope 250). Se comprimieron **sin perder un solo hecho ni un puntero** — es lo que Rafa avisó al
abrir la sesión, y conviene saber que bloquea a cualquiera, no solo a quien la engordó.

**Lo que queda:**

1. **Migrar a `.sc-text-*` lo que aún declara tipografía por token en SCSS.** El `#98` lo hizo para
   las etiquetas de campo; el resto sigue con tokens en la hoja — correcto, pero es el paso previo.
2. Los formularios de admin siguen sin maqueta de `sc-section-card` para su CONTENIDO.
3. Decidir si la app viva lleva un aviso que apunte a `docs/PROTOTIPOS.md` (DD-56).

---

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
- **El CI son 8 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J). Los e2e de app solo corren allí (DD-60); las baselines visuales de sc-docs, a mano.
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
