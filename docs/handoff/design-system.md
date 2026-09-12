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

- ~~**12/20 no es ningún estilo**~~ → se mudó a [`docs/figma-pendiente.md`](../figma-pendiente.md) §4.
- ~~**`sc-docs` es la siguiente tanda del barrido**: 237 reglas~~ → **HECHO en parte el 2026-09-12,
  y las 237 eran la cifra equivocada.** **122 de ellas son `/validar`**, que imita el INSPECTOR DE
  CHROME a propósito y lo dice en su propio fichero desde que se escribió: tokenizarlo le quita al
  simulador lo único que enseña. El alcance real eran 115, de las que se migraron 60 y quedan 55
  con su trinquete (`TIPOGRAFIA_SUELTA_DOCS_MAX`).
  **Las 55 que quedan NO son pereza, son tres familias medidas**: `code`/`kbd`/`pre` (su mono lo
  pone el NAVEGADOR, no una regla, así que la clase se lo quita: 88 nombres de token se quedaron
  en Inter en la primera pasada), reglas con familia propia o `font:` shorthand, y **elementos
  CONTENEDOR** — ahí la clase arrastra a todo lo que solo heredaba: 1.122 `<code>` y 353 `<td>` se
  movieron de golpe antes de acotarlo.
  ⚠️ **Lo que queda pide DECISIÓN, no otro barrido**: cuatro `hero__title` a 32px y seis textos a
  16px (ninguno es peldaño), y qué hacer con los contenedores.

**`/config/aed/servicio` (2026-09-12) deja pendiente de RAFA o de PRODUCTO:** el granate de
«Administrativo» (decisión suya) pasó a la paleta de etiquetas para que el estado se vea igual en
las dos secciones — si lo quiere de vuelta, la barra de «Estados visibles» se mueve con él; y «No
disponible» y «Desconectado» tenían la MISMA descripción en los cuatro idiomas, así que escribí en
qué se diferencian, pero es lectura razonable, **no un dato**. Y un hueco del DS: `sc-select` rotula
con `for` sobre un `<span role="combobox">`, que no es etiquetable — sus dos formas (`[label]`,
`iftaLabel`) emiten el mismo `for`, así que se queda sin nombre accesible en toda la app.

**Lo que queda de la tanda «adelante a todo» del 2026-09-11** (los dos apuntes de la revisión de
Orca se cerraron en el #113; `agent-mini` entró en el CI; la doc, en su PR):

- ~~**El rastreador de textos NO está commiteado**~~ → **HECHO**: vive en `tools/text-census.mjs`,
  con las cuatro cosas que lo hacen fiable escritas dentro (texto PROPIO y no `textContent`; clave
  con ordinal; el selector ignora `sc-text-*` o el diff sale vacío por construcción; y medir el
  RUIDO primero — dos pasadas del mismo build, 0 diferencias). Se había reescrito tres veces.
- ~~**Los inputs públicos sin ejemplo**~~ → **CERO el 2026-09-12** (eran 66 el día anterior). Todo
  input público del DS sale en un ejemplo de su página o en un control de su Playground, y el
  trinquete en 0 deja de medir deuda para pasar a proteger.
  ⚠️ **11 de los 66 nunca fueron deuda, era el gate**, y las cuatro veces el fallo era LEER DE
  MENOS: `\w+AriaLabel` pedido por nombre en vez de por patrón · los knobs cortados en el primer
  `],` cuando un control lleva sus `options` en varias líneas (leía 9 de 20 en `sc-dialog`) · el
  binding de DOS sentidos `[(x)]` sin reconocer, que es justo como se abre un diálogo · y los
  snippets escritos EN LÍNEA en la story, que no son constantes. Cada uno lleva ya su test rojo.
  Un guardián que reclama lo que ya está hecho enseña a ignorarlo.
  ⚠️ **Un valor por defecto de un knob puede cambiar la demo**: `sortField: 'name'` dejaba la tabla
  ya ordenada y los e2e de gestos empezaron a abrir otra fila. Los knobs arrancan en el valor que
  el componente ya tiene.
  ⚠️ **Tocar una página con métrica cuesta TRES redes**: captura visual, HTML congelado y estilos
  computados. Hay que correr `npm run e2e` ENTERO en local — el preflight no lo incluye (DD-60).

**Lo que deja el 2026-09-12 (la vuelta a las tablas, DD-72), medido y sin hacer:**

- **Lo que solo se puede tocar en Figma vive ahora en su propio fichero**:
  [`docs/figma-pendiente.md`](../figma-pendiente.md). Allí están la divergencia del título de sección
  (DD-74), la decisión 18-o-20, y lo que quedaba suelto de otras sesiones. **No lo dupliques aquí**:
  una cosa que solo puede hacer una persona en Figma no es trabajo de la próxima sesión, y en esta
  bandeja se leía como nota al margen — tanto que una llevaba tiempo resuelta sin que nadie la
  tachara.
(Las otras dos de esta bandeja —la piel por defecto sin anclar y la falta de guardián para
las 38 ranuras— se cerraron el mismo día en DD-73.)

**Lo que dejó s42, medido y sin hacer:**

- ~~**El tier `app/typography/xl|xxl`**~~ → se mudó a [`docs/figma-pendiente.md`](../figma-pendiente.md) §3.
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
## ✅ 2026-09-12 · El chip relleno significa lo mismo en las dos pantallas, y un título vuelve a ser más grande que su contenido

**Sello:** HEAD `c1f829f`. DD-74. `npm run verify` (39 eslabones); **156** e2e del Supervisor,
**82** de sc-docs. El guardián del chip, probado en rojo volviendo a declararlo en la segunda hoja.

**De dónde sale.** «Resuelve las dudas con tu criterio, queremos automatización, consistencia,
simpleza y que sea intuitivo», y después los títulos. Las dos cosas se midieron antes de tocar.

**Lo que cambia.** El chip de canal se declara UNA vez, y el título de sección pasa de 14 a 18.

**Los dos hallazgos, que es lo que hay que recordar:**

- **El chip no era una inconsistencia de estilo, era de SIGNIFICADO.** En un editor el chip relleno
  era el canal APAGADO; en el hermano, el encendido. Ganó la gramática del **togglebutton**, que es
  la que publica el tema (`sc-preset/togglebutton.ts`: pista `surface.100`, elegido en blanco con
  sombra), no la que me parecía más intuitiva a mí. La otra además pintaba con paleta CRUDA de fondo.
  Al unificar, los dos editores quedan idénticos también en medida: 69 px de fila los dos (antes 65
  y 69 — diferían en padding y radio, no solo en color).
- **El título medía lo mismo que su contenido.** 14/20/600 contra 14/21/400 en `config/aed/agentes`:
  solo el peso los separaba. Se construyeron 14, 18 y 20 y se miraron juntos. Se eligió `h3` (18)
  porque 20 no lo nombra ningún text style, y entre 18 y 20 no hay diferencia apreciable.

**Un efecto que no vi venir y resultó bueno:** `page-identity` comparaba DOS familias de título de
página (18 suelto, 14 dentro de una card) porque la de dentro existía **para igualar al título de
sección**. Al subir la sección, sube con ella: ahora un título de página mide lo mismo esté donde
esté. Una regla menos que explicar.

## ✅ 2026-09-12 · La tabla deja de heredar su letra en las DOS pieles, y las 38 ranuras tienen guardián

**Sello:** HEAD `c1f829f`. DD-73. `npm run verify` con sus 39 eslabones; **156** e2e del Supervisor,
**82** de sc-docs. El gate nuevo, probado en rojo en el repo de verdad además de en su test.

**De dónde sale.** Los dos primeros puntos que DD-72 dejó en esta bandeja. Eran del mismo tipo:
fallos que no rompen nada hoy y que nadie vería el día que pasen.

**Lo que cambia.** La piel **por defecto** también queda anclada (antes seguía colgando del `body` de
cada app), y nace `audit:datatable-slots`, que vigila que las 38 ranuras reenviadas sigan existiendo
en PrimeNG.

**El experimento que lo destapó, que es lo reutilizable**: en vez de leer el CSS y deducir quién
declara qué, se sube el `font-size` del `body` en el navegador y se mira **qué se mueve**. La piel por
defecto se iba a 20 px; la `list` se quedaba en 14. Eso no se puede discutir, y sirve igual para
cualquier otro componente del que se sospeche que hereda algo que debería declarar.

**Lo que costó.** `verify` cazó dos cosas que yo no vi: un import de test sin usar (le puse su propio
caso en vez de borrarlo) y la cuenta de gates en tres documentos. La tercera fue más fina: dos frases
de DD-65 decían «38 gates» como hecho de su día, y el gate las daba por desfasadas. Ni exonerar el
fichero (dejaría ciego al gate para lo que sí es del presente) ni cambiar la cifra (falsearía aquella
decisión): pasan a decir «eslabones».

**Fuera a propósito:** el tercer punto de la bandeja de DD-72 sigue vivo, y es decisión de producto.

## ✅ 2026-09-12 · Las tablas de la plataforma pasan todas por el sistema, y la celda deja de heredar su letra del navegador

**Sello:** HEAD `c1f829f`. DD-72. `npm run verify` entero; **156** e2e del Supervisor, **82** de sc-docs,
**23** de la librería. Las dos redes nuevas, validadas EN ROJO antes de fiarme de su verde. Veredicto
del CI por `ci:verdict` tras el push.

**De dónde sale.** Rafa: «dar una vuelta a todas las tablas de la plataforma», con la página del DS y
la documentación de PrimeNG como material, y el foco en que fueran **visualmente iguales y
compatibles**. Al abrir: 16 tablas en el Supervisor, 11 con `sc-datatable` y **cinco a mano** que no
eran la misma cosa (dos matrices de permisos, dos editores de formulario, un selector).

**Lo que cambia.** Cero tablas escritas a mano: las 16 pasan por el DS. La celda **declara su estilo
de texto** (antes heredaba los 16px del documento, y el mismo `<td>` rendía 16 en el Supervisor y 14
en sc-docs); nace `sc-permission-matrix`, que no es un `sc-datatable` porque lleva cabecera de FILA y
un control en la de columna; y se reenvían **las 38 ranuras de plantilla de `p-table`**, para pegar un
ejemplo de primeng.dev dentro y que funcione ya tokenizado.

**Lo que hay que recordar de esto**, porque volverá a morder:

- **Una plantilla del consumidor NO atraviesa un `<ng-content/>` hasta `p-table`.** Sus queries son
  `contentChild` y solo ven su propio contenido. Medido con sonda y control positivo. Reenviar es
  código, no configuración, y por eso lleva su test.
- **`audit:datatables` §6 cazó un fallo real**: `translate.instant()` dentro de un `computed` cuyas
  dependencias son solo `viewChild` no se re-evalúa, así que las cabeceras se congelan al cambiar de
  idioma. El gate solo sabe mirar un computed llamado `columns`; el defecto estaba en **cinco**.
- **Un test mío salía verde por rebote**: pulsaba el `<span>` de adorno de un desplegable en vez de su
  botón (1 rojo de 152). `aria-controls` es el gancho, y la prueba de que ya no es intermitente son
  tres pasadas seguidas, no una verde.

**Fuera a propósito:** los dos editores simétricos pintan sus chips de canal distinto y la piel por
defecto de `sc-datatable` no ha seguido a la `list` en tipografía. Los dos bajan a la bandeja.

## ✅ 2026-09-12 · La pantalla de Servicio habla el idioma de Agentes (PR #122)

Sello `02324a1`, CI verde leído. Rafa: «it feels off», contra `/config/aed/agentes`. Medido ANTES de
tocar: **tres** vocabularios para «un estado de agente» (pastilla sólida con `red-800` crudo · chip
gris · banda con barra) y cuatro distancias que sobran (**487** chips↔«Añadir», **443**
estado↔interruptor, **434** entre casillas hermanas, **89** entre dos `inputnumber`). Ahora: una
familia sola, cada control pegado a lo que gobierna, las dos filas compartiendo las CUATRO columnas
y la matriz como TABLA. `sc-tag` estrena uso en el Supervisor (0 → 3); el trinquete de tipografía
suelta baja a 100.
⚠️ **Las SEIS casillas de notificaciones no tenían `(cycle)`**: se vio MIDIENDO, con una casilla con
manejador como control. Y `theme-contrast` cazó mi único paso en falso (botón «Añadir» a 2.95:1).

> El tramo de **la tabla de transcripciones** (14/20 en vez de 16/24, #120) se archivó el
> 2026-09-12 por el tope de 400 líneas, al entrar el del chip de canal. Vive en git y en el tag
> `archive/handoff-ds-2026-09-12-chip-titulos`; su causa la explica DD-71 y su red sigue en
> `text-styles-applied`, que es donde hace falta.

> El tramo de **las tres guardas** (#113, #117, #118: el preflight que se niega sobre una rama
> rezagada, `agent-mini` en el CI, y el código que la doc enseña atado al que ejecuta) se archivó
> el 2026-09-12 por el tope de 400 líneas. Tag `archive/handoff-ds-2026-09-12`; lo durable, DD-70.

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
