# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-22, cierre sesión 22 (limpieza de la banda de S59, las
> baselines visuales vuelven a ser una red, y la divergencia de Figma resulta
> ser otra — hay UNA decisión esperando a Rafa).**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **Confirma el CI LEYENDO el run** del último commit.
3. **Lo último que se tocó fue la IDENTIDAD DE PÁGINA y los FONDOS**, y las dos
   cosas están cerradas con DD: **DD-33** (el título vive en el cuerpo, la miga
   gana un padre) y **DD-34** (`--sc-bg-default` es el suelo del shell, nunca una
   superficie de contenido). Si vas a tocar un fondo o un título, **lee esas dos
   DD antes**: las dos revisan decisiones anteriores (S59 y S67-A) y las dos
   tienen una mitad que no se revierte sin la otra.
4. **EL PUENTE FIGMA ESTÁ EN MARCHA Y VA EN LOS DOS SENTIDOS** (probado con el
   breadcrumb, ver «EL PUENTE FIGMA» abajo). **El conector está autorizado y la
   escritura código→Figma FUNCIONA** (`use_figma`, file `khNq9dJKNi13pNllrqm6dx`).
   Hay ahora **DOS divergencias esperando propuesta**: el tramo actual del
   breadcrumb (ya escrita en Figma, la mira Marta) y **el color del lienzo de
   página** — que en la s22 resultó ser bastante más ancha de lo que este
   hand-off decía, y **espera decisión de Rafa**. Ver «DOS divergencias» abajo.
5. **B3 y B4 están cerrados.** Del plan de convergencia solo queda **B5b**
   (necesita diseño). Suite del supervisor: **125 tests**. La familia `.table`
   está migrada entera; la receta queda por si aparece una tabla nueva:
   [`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md).
6. **`--sc-text-subtle` está DECIDIDO y hecho** (Rafa: AA por delante de la
   jerarquía). En claro hay ahora **dos** niveles de gris, no tres; en oscuro
   siguen siendo tres. Si compensas jerarquía, hazlo con peso o tamaño, nunca
   con claridad. Ver `customs-catalog` §1.7 antes de tocar un gris.

---

# ▶︎ SESIÓN 22 — tres cosas que la doc daba por sabidas y no eran

| Commit | Qué |
|---|---|
| `fce05d4` | La banda de S59 se borra ENTERA: 7 clases muertas, 192 líneas |
| `510b7ea` | La divergencia con Figma no era la que estaba escrita (DD-34 corregida) |
| `77088af` | Las 25 baselines visuales estaban **obsoletas**, no rotas |
| — | `customs-catalog §6` avisado: su «réplica 1:1» no se pudo verificar |

## 📍 LA PROPUESTA NUEVA, Y DÓNDE ESTÁ EXACTAMENTE

Rafa la aprobó en la s22 con el enunciado corregido. **Ya escrita en Figma:**

| | |
|---|---|
| **Fichero** | `khNq9dJKNi13pNllrqm6dx` («Smart Contact Design System») |
| **Página** | `Flujos` |
| **Frame** | `Lienzo de página — Current state · propuesta (código S22)` |
| **Node** | **`13920:4298`** · `?node-id=13920-4298` |
| **Dónde en el lienzo** | `x 6500, y 14094` — a la DERECHA del maestro `SmartContact AED` (`13593:5374`), en la misma banda que las «Label Variante A/B/C» |
| **Qué lleva** | el porqué en prosa + comparativa **A (maestro, lienzo gris) / B (propuesta, lienzo blanco)** con los números debajo de cada una |
| **Maestro** | **NO se ha tocado** — la escritura solo crea nodos nuevos en espacio libre |

Registrada en `docs/guia-tokens.md` → *Figma change-log*, como manda AGENTS.md.
**Ahora le toca a Marta**: si le vale, sube al maestro y deja de ser divergencia.

> Al escribirla apareció el dato que más la refuerza: **la card del maestro YA
> lleva el borde `#dadfe6` de 1px**, el mismo del código. O sea que el maestro
> tiene borde *y* gris; la propuesta solo quita el que no hace nada.

## El patrón de la sesión: la doc describía la fuente de oídas

Las tres cosas salieron del mismo sitio — un texto que parafraseaba algo
externo y nadie había vuelto a mirar:

- **El CSS muerto no era una clase, eran siete.** El hand-off decía
  «`.page__title` en ~9 hojas». Mapeado el conjunto: `__header`, `__title`,
  `__subtitle`, `__actions`, `__title-block`, `__icon` y `__footer`, todas sin
  un consumidor. Un `grep` plano no las ve —son `&__x` anidados dentro de
  `.page`—, así que hizo falta una sonda que resolviera el anidamiento SCSS.
  **Controles leídos antes de creerla**: `page__inner` sale viva con 19 usos,
  una clase inventada sale con 0.
- **La divergencia de Figma no era la descrita** (ver abajo). El nodo citado
  no existe.
- **Las baselines no fallaban «por entorno»**: fallaban por un rediseño
  deliberado (DD-29) que nadie acompañó de un `--update-snapshots`.

## Lo que casi firmo mal, y cómo se evitó

Dos veces, y las dos por lo mismo: mirar una muestra y creerla el todo.

1. **«12 píxeles, es antialiasing».** Fue mi primer diagnóstico de las
   baselines, sacado del único bloque de error que el log truncado enseñaba.
   Con la distribución de los 25 delante: entre **94.000 y 651.000** píxeles.
   El 12 era el mínimo. La conclusión correcta era la contraria: la tolerancia
   por defecto está bien y lo viejo era la baseline.
2. **«No hay bandeja en Figma».** Lo había buscado **por nombre**. Y
   `customs-catalog §6` insistía en una bandeja radius 12 «réplica 1:1 del
   Figma». Antes de firmar, segunda búsqueda **por propiedad** —que falla de
   otra manera—: 118.347 nodos de todas las páginas filtrados por relleno
   `slate-50` + radius ≥ 8 + ancho > 500. **Cero.** Los dos métodos coinciden,
   y por eso el veredicto se sostiene.

## Las baselines vuelven a ser una red (y está medido)

Regeneradas las 25 y verificadas en **los dos ejes**, porque quedarse en el
primero es silenciar la red, no arreglarla:

| eje | comprobación | resultado |
|---|---|---|
| pasan | suite entera | **54/54 verde** |
| **cazan** | UNA letra cambiada en una story de `sc-tag` | **rojo, 1501 px** |

Revertida la letra, vuelve a verde. El helper `screenshotBaseline` lleva ahora
escrito que regenerar va en el MISMO commit que el cambio de diseño, con el
comando.

> **Ojo con `--update-snapshots`**: bendice lo que haya en pantalla. Úsalo solo
> cuando el cambio visual sea deliberado y lo hayas mirado.

---

# ▶︎ SESIÓN 21 — la identidad de página y el modelo de superficies

| Commit | Qué |
|---|---|
| `6f2efc0` | El título de página vuelve al CUERPO, y se ve (**DD-33**) |
| `36edfc8` | El gris que asomaba bajo la tabla era una FUGA, no un fondo |
| `4645072` | `--sc-border-subtle` existe en oscuro — valía el color de la tarjeta |
| `2474adf` | Se retira la bandeja gris de Contact Center (**DD-34**) |
| `a3ef758` | Cierre: este hand-off + DD-33 + DD-34 + `customs-catalog §1.9` |
| `ff1ea04` | **`audit:border-surfaces`** — guardián nuevo DENTRO de `verify` |
| `aaf53c0` · `4ee5a30` | `/reflect`: afila las reglas 18 y 7 de `LEARNINGS.md` |

Los ocho en `main`, CI verde leído del run.

> **Si vienes a tocar tokens de borde**: `verify` tiene un paso más que antes,
> `npm run audit:border-surfaces` (104 pares token × lienzo × tema). Falla si un
> `--sc-border-*` resuelve a menos de 1.02:1 de `--sc-bg-surface` o
> `--sc-bg-default` **en su tema**. Sus exenciones son condicionales: valen solo
> mientras el token no lo lea nadie, y el guardián comprueba esa condición.

## Lo que hizo girar la sesión: medir la referencia antes de opinar

Snow UI `/orders` es nuestro **mismo arquetipo** (barra con miga + tabla), así que
se midió en vivo en vez de discutirlo. Tres datos que decidieron todo:

- El título de página **no vive en la barra**: es 16px/600 **en el cuerpo, sin
  banda**. Lo que sobraba en S59 era el chrome, no el título.
- Su lienzo es **blanco** y la tarjeta **también**: lo que las separa es un borde
  al **10% del color de texto**, el mismo alfa en claro y en oscuro.
- Por eso su oscuro no se rompe. El nuestro sí se rompía, porque mapeamos roles a
  primitivas **por tema** y hay que escribir las dos.

## Los números que conviene no volver a derivar

| | claro | oscuro |
|---|---|---|
| relleno tarjeta vs lienzo | 1.00:1 | 1.00:1 |
| borde de tarjeta (`border-default`) | 1.34:1 | 1.39:1 |
| `bg-default` vs `bg-surface` | **1.06:1** | **1.14:1** |
| `border-subtle` vs superficie | 1.15:1 | **1.13:1** (era 1.00) |

**Corolario que ya está en DD-34**: hay tres tokens de superficie y **dos
valores** (`--sc-bg-elevated` == `--sc-bg-surface` en ambos temas), y los dos que
difieren no separan nada. **Lo que separa es el borde.**

## La fuga del gris: geometría no es color

Tu captura de `/reglas` enseñaba gris bajo la tabla. No era un fondo de diseño:
era el shell asomando por debajo de donde acaba el contenido, en las **tres**
páginas de memory cuyo `:host` no llevaba `height: 100%` (las otras trece sí).
452px en `/reglas`, 345 en `/categorias`, y `/entidades` con el defecto
**latente** — invisible solo porque su contenido llegaba abajo.

**Y una sonda mía mintió por el camino**: la primera versión medía
`main.bottom - page.bottom` y acusaba a `/config/seguridad` de 489px de costura
donde la pantalla es blanca (allí el `:host` SÍ se estira y pinta él). Rehecha
para preguntar por el **píxel** (`elementFromPoint` + fondo efectivo). Rutas con
salto de color: **4 de 34 → 0 de 34**.

## Deuda que la sesión destapó y NO cerró

- **`.page__title` es CSS muerto en ~9 hojas de página** (resto de la banda de
  S59), con tamaños distintos entre sí. Por eso la clase nueva se llama
  `.page__heading`. Borrarlo es limpieza segura: cero referencias en `.html`.
- **`bg-default` como hueco hundido dentro de una tarjeta** (constructor de
  condiciones, avisos de sistema, pie de numeración especial): funciona en oscuro,
  mide 1.06:1 en claro. Asimetría real, decisión propia. Ver DD-34.
- ~~Nadie vigila que un token de borde no iguale a su superficie.~~ **HECHO**:
  `npm run audit:border-surfaces`, dentro de `verify` (104 pares: token × lienzo ×
  tema). En su primera ejecución destapó un SEGUNDO caso —
  `--sc-border-primary-active`, `blue-800` heredado a oscuro, 1.019:1 contra
  `slate-900`— **latente**, porque hoy no lo lee nadie. Está exento, pero la
  exención es **condicional**: el guardián comprueba que siga sin consumidores y
  se pone rojo el día que alguien lo use. Si lo vas a usar, dale valor oscuro
  antes.
- **Las 25 baselines visuales de `npm run e2e` llevan tiempo en rojo en local.**
  Comprobado con stash-y-reproduce: fallan igual sin cambios. El CI las salta por
  diseño (`if (process.env['CI']) return`), así que la red está muda sin avisar.

---

# HECHO en la sesión 16

| Commit | Qué |
|---|---|
| `6c84fad` | Un solo tamaño de botón en la TopBar — **lo cazó Rafa** |
| `27104fa` | B4 · `sc-datatable` aprende los 4 gestos que le faltaban |
| `a602010` | B4 · labels y plantillas pasan a la tabla del DS |
| `fef90b0` | La receta para migrar las 14 tablas que quedan |
| `338f4e7` | La columna "Ahora" del recorrido `/reglas` vuelve a ser el ahora |

## B4 · las 4 capacidades (`27104fa`)

`[rowStyleClass]` · `(rowClick)` · `(rowContextMenu)` · `[visibleColumns]`.

Dos decisiones que conviene no revertir sin leer esto:

- **`(rowContextMenu)` emite un evento; NO trae un `<p-contextmenu>` dentro.**
  La Ola 2 mató justo el segundo motor de menú: la app tiene UN `<p-menu>` por
  tabla que sirve el kebab y el click derecho. Un menú propio del DS volvería a
  poner dos modelos donde hay uno.
- **En `selectionMode="multiple"` se desactiva `pSelectableRow`.** PrimeNG
  selecciona al clicar la fila y eso choca con el modelo canónico de la Ola 6
  (la fila abre, la casilla selecciona): con los dos activos, un click hacía las
  dos cosas. En `single` se mantiene, porque ahí seleccionar ES clicar la fila.

**Dónde se verifican**: el piloto que el plan eligió solo ejercita 2 de las 4
—labels y plantillas no tienen click de fila ni selector de columnas, medido: 0
`(click)` en sus `<tr>`—, así que `rowClick` y `visibleColumns` viven en la story
nueva de `sc-demo` con 5 tests (`e2e/datatable-gestures.spec.ts`). La aserción
que más pesa (marcar la casilla NO abre) se probó **en rojo primero**: sin el
`stopPropagation`, el contador de aperturas sube a 2.

## B4 · el piloto (`a602010`)

Lo que casi sale mal: migrar tal cual habría dejado esas dos tablas
**visiblemente distintas de las seis sin migrar** (filas de 42px contra 54,
cabecera 14px/600 contra 12px/500). De ahí `styles/_sc-datatable-list.scss`, la
piel `.list-table`. **Sin esa clase, una tabla migrada no se parece a las que
faltan.**

Y aun con los números cuadrando, la pantalla enseñó dos cosas que mi medición no
cubría (ver LEARNINGS #20): la banda vacía de `caption` y las columnas
recolocadas por `table-layout`. Resultado final medido en claro y oscuro:
idéntico a una tabla sin migrar.

**Red nueva**: `e2e/supervisor/admin-datatable-pilot.spec.ts`, 9 tests. Ninguna
de las dos páginas tenía uno antes. La suite del supervisor pasa de 22 a **31**.

---

# Abierto — por qué y qué haría falta

## ~~B3 · tokens-sync~~ — **CERRADO el 2026-07-22**

Rafa re-exportó desde el Theme Designer y el workflow corrió **verde**
(run `29922768184`, leído: `completed`/`success`). Es el **primer `tokens-sync`
que pasa** — los dos anteriores, de junio, fallaron. El carril entero
(Theme Designer → export DTCG → `tokens:import` → `verify` → Cloudflare) queda
probado de punta a punta. Nada que hacer aquí.

## B5b · la prosa i18n del constructor — **NECESITA DISEÑO**

`conditionToDesc()` compone gramática española (` o ` / ` ni `). Necesita ICU
MessageFormat o un compositor por locale. Lo mecánico (~28 claves) ya está.

## ~~Las 14 tablas que quedan~~ — **SECCIÓN CADUCA, no la sigas**

Es un resto de la sesión 16 y **contradice al punto 5 de EMPIEZA AQUÍ**, que es
el que vale: la familia `.table` está **migrada entera** (las 10, incluida
`conversation-table` en la s20). Las **5 `<table>` a mano que quedan NO deben
migrar** y cada una tiene su razón escrita en
[`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md) — tres son
matrices de permisos (ahí `<table>` con `<th scope="row">` es MEJOR
accesibilidad) y una es un picker cuya fila selecciona al clicar. La receta
sigue sirviendo, pero **solo si aparece una tabla nueva**.

## La mitad SCSS de B2

Sigue aparcada a propósito: cinco ficheros con divergencias reales y menos
beneficio. Las clases compartidas están puestas como seam.

---

# SESIÓN 17 — lo que cambió

## Tablas: de 2 migradas a 6

`repo-list`, `agentes`, `grupos`, `usuarios` (las 3 hermanas, delegadas con la
receta como spec y revisadas por riesgo). **Queda 1 de la familia `.table`:
`conversation-table`.**

**Por qué NO migra conversation-table** — y no es pereza: su selección por rango
tiene anclaje propio (`lastSelectedIndex`), su casilla de CABECERA necesitaría
plantillas de cabecera en el DS (3ª capacidad nueva), y su modelo de selección
lo posee el componente PADRE, no la tabla. Eso no es aplicar la receta, es
rediseñar su contrato. Si se aborda: `sc-datatable` necesita `headerTemplate`
por columna, y hay que decidir si el rango con anclaje sube al DS o se queda.

**Quedan además las 3 de memory** (`rules`, `categories`, `entities`): misma
gramática con otro nombre de clase, sin selección, sin selector de columnas. Son
las MÁS fáciles que quedan y su arrastre CDK murió con DD-28. Empieza por ahí.

Capacidades nuevas del DS en esta sesión: `col` en el contexto de celda (lo
exigió repo-list, cuyas columnas salen de config), `[rowsFocusable]`,
`(rowKeydown)` y `stopRowClick` por columna.

## Divergencias que la convergencia creó, y hubo que corregir a mano

Pasa siempre que se delega en paralelo. Vigílalo:

- **Zebra**: users la conservó, agents y groups la soltaron. Unificado en
  hairline (6 de 9 ya lo eran). Cambio visible en 3 tablas; se revierte con
  `[stripedRows]`.
- **`cursor: pointer`**: agentes quedó abriendo EN SILENCIO. El `<tr>` lo pinta
  el DS y `pSelectableRowDisabled` le quita la clase de la que PrimeNG saca el
  cursor.
- **Dos `::ng-deep`** para lo mismo → una regla en la piel compartida.
- **El hueco alrededor del kebab** abría la ficha (el `<td>` del DS no corta la
  propagación) → `stopRowClick`.

## Contraste: era un fallo sistemático, no una decisión de marca

Yo había dicho que `text-success` necesitaba Figma y a Marta. **Falso**: solo
`text-secondary` está enforced con el Kit. Al verificarlo apareció lo de verdad:
SEIS colores de texto semánticos no tenían valor en oscuro y heredaban el del
claro, calculado contra blanco. `text-link` daba **2.48:1** sobre slate-900.

Arreglados los dos temas (ningún tono pasa AA en ambos: hace falta valor por
tema) y añadidos a `A11Y_GATED`. **17/18 pares cumplen AA**; el que falta es el
conocido de W5, donde ni negro ni blanco pasan sobre blue-400.

## WCAG 2.1.1: las filas que abren ya se abren con el teclado

Agentes, grupos y usuarios abrían la ficha al clicar y **nunca** fueron
alcanzables por teclado — cero `tabindex`, cero `keydown`, cero enlaces,
comprobado en el árbol anterior. No lo rompió la migración; llevaba así siempre
y nada lo medía. Enter abre en las tres, con test.

## Cabeceras duplicadas — 4 páginas (lo cazó Rafa en pantalla)

El hub de repositorios y las 3 subpáginas AED decían su nombre DOS veces: en
el breadcrumb y otra vez en una banda debajo, con la MISMA clave i18n. Eran las
últimas sin convertir al modelo "todo arriba" de S59. El `<h1>` no se borró, se
ocultó (`visually-hidden`): era el único encabezado del documento.

**`sc-page-header` queda SIN consumidores en la app** — solo lo usa su propio
demo. No lo he borrado (es API pública del DS y otra app podría quererlo), pero
si sigue así en la próxima revisión, es candidato a retirar.

Red: `page-identity.spec.ts` (7 tests). Comprueba que hay UN h1, que mide 1px
—o sea que está oculto de verdad, porque uno visible pasaría un simple conteo— y
que su texto coincide con la miga actual.

## La red que faltaba

`e2e/supervisor/list-table-grammar.spec.ts` — 12 tests que fijan los valores
COMPUTADOS de la piel (que se agarra a clases internas de PrimeNG), el separador
en oscuro, el cursor y el teclado. Suite del supervisor: **43 tests**.

# ▶︎ RAMA SOLO SI HAY ALGO QUE MIRAR

Cloudflare Pages da **preview por rama automático** desde junio (verificado en
vivo, ver `DECISIONS.md`). El patrón es `<rama-con-guiones>.<proyecto>.pages.dev`:

- **supervisor** → https://sc-supervisor.pages.dev
- **sc-demo** → https://sc-demo.pages.dev

**La regla:**

| | |
|---|---|
| **Rama** | El cambio se VE: pantallas, color, tipografía, espaciado, un flujo nuevo. Rafa abre el enlace, compara con producción en otra pestaña, y decide. Si no le vale, no se mergea y no hay nada que deshacer. |
| **Directo a `main`** | El cambio NO se ve: tokens sin efecto visual, scripts, guardianes, tests, documentación. Lo cubren los gates. Una rama ahí es papeleo y además deja `main` atrás. |

**Por qué importa, con el caso real:** el 2026-07-19 Rafa decidió subir
`--sc-text-subtle` a slate-600. Eso cambió la jerarquía de grises de TODA la
app y lo aprobó fiándose de mi descripción, porque no había dónde mirarlo. Es
el ejemplo exacto de cambio que debía ir en rama.

> **Y lo que NO hay que hacer**, porque ya lo hice: escribí «todo trabajo va en
> una rama». Es la respuesta de manual, y para un operador que trabaja SOLO las
> razones clásicas —varias personas, revisión, mantener main desplegable— no
> aplican. La única que aplica es el enlace para mirar. Si no hay nada que
> mirar, no hay razón. (Tercera vez que doy la respuesta de equipo en vez de la
> de su situación; ver la memoria `user-solo-nondev-seamless-first`.)

---

# ▶︎ SESIÓN 20 — conversation-table migrada (la última de la familia `.table`)

**MERGEADA a main** (`f475429`), verde en los 6 pasos de CI local + CI de main.
Aspecto idéntico al original (comparado captura a captura). Rafa delegó el merge
("confío en tu criterio") tras leer la decisión de producto abierta de abajo.

## Lo que costó de verdad: un bug latente del DS, no la tabla

El rango con ancla que se añadió a `sc-datatable` en la 19 tenía 7 tests
unitarios en verde y **no funcionaba en el navegador**. Lo cazó Playwright al
migrar (no un unitario — no podían). Dos cosas:

1. La casilla de PrimeNG togglea en `change` (DESPUÉS del `click`), así que el
   handler del rango leía la selección rancia y el `selectionChange` de p-table
   la re-emitía y **pisaba** el rango. Reescrito: `shiftKey` se captura en
   `mousedown`, el rango se aplica en `onSelectionChange` (tras el toggle).
2. p-table no re-resalta las filas que un rango añade por el input (solo las que
   togla él). La SELECCIÓN es correcta (barra masiva bien); el tinte se pinta
   desde `[rowStyleClass]` leyendo el `Set` de la página, no de
   `.p-datatable-row-selected`. Ver LEARNINGS #19 (corolario).

## DECISIÓN DE PRODUCTO ABIERTA — para Rafa

**El objetivo grande (toda la celda seleccionaba) se unificó a la casilla**, como
en las otras nueve tablas. El `stopPropagation` del DS ya evita lo que importaba
(que fallar el objetivo ABRA el reproductor: no lo abre, es un no-op). Recuperar
el objetivo de celda entera es posible pero pide ampliar el hit-area del DS
(o CSS frágil sobre la casilla de PrimeNG). **Si lo echas de menos al probarlo,
dilo y se hace.**

## De paso: el guardián de acoplamiento contaba comentarios

`audit:primeng-coupling` contaba las `.p-*` que salían en COMENTARIOS, no solo en
selectores. El número real era **36**, no 41 (5 eran fantasma). Ahora los quita
antes de contar y el tope baja a 36 — trinquete más ceñido.

---

# ▶︎ EL PUENTE FIGMA — EN MARCHA, y ya va en los DOS sentidos (breadcrumb = 1er caso)

Los bloqueadores se levantaron esta sesión: **el conector de Figma está
autorizado** y **la escritura código→Figma FUNCIONA**. El Kit oficial es el file
`khNq9dJKNi13pNllrqm6dx` («Smart Contact Design System»). El puente ya está probado
de punta a punta con un componente real — el **breadcrumb**:

| Commit | Qué |
|---|---|
| `6033838` | `sc-breadcrumb` — 1er componente traído por el puente Figma→código |
| `0b8c38a` | la miga de la TopBar adopta `sc-breadcrumb` (código→app) |
| `6b70f2a` | `sc-breadcrumb` marca el tramo actual (más oscuro, mismo peso) |
| Figma | frame `Current state · propuesta` node `13890:157` (código→Figma) |
| `5c83b85` | `customs-catalog §2.12` referencia el ejemplo de Figma |

Todos en `main`, CI verde leído del run (incluido `e2e:supervisor`).


- **Figma → código**: `sc-breadcrumb` (wrapper de `<p-breadcrumb>`) creado desde el
  nodo `185:6637`. Destapó un preset DORMIDO (themed pero sin componente/consumidor)
  — el puente no solo trae diseños, AUDITA lo que tienes a medias. Demo + pokédex.
- **código → app**: adoptado en la **TopBar** del supervisor. La clave que zanjó el
  debate: *Figma es la fuente de verdad del COMPONENTE, no de la composición de
  página*. Se pinta idéntico a Figma; se soltó el retoque local S59 (último tramo
  en negrita como título) — mezclaba wayfinding con título.
- **código → Figma** (PRIMERA escritura): frame `Current state · propuesta` (node
  `13890:157`) en la página `❖ Breadcrumb`, debajo de los Examples, SIN tocar el
  maestro. Propone el estado «tramo actual más oscuro».

**Lo que validó los biases (con evidencia, no opinión)**: `/ui-ux-pro-max` + medir
**Snow UI** en vivo (`snow-interface.netlify.app`). Hallazgos: (a) un breadcrumb
DEBE marcar el actual —Snow UI: padre al 64%, actual al 100%, MISMO peso—; el DS lo
hace ahora (`--sc-text-primary`, `labelStyle` en línea, cero acoplamiento). (b) El
título de página **no** vive en el breadcrumb: es un `<h2>` modesto en el CUERPO,
contextual (dashboards sí, feeds no). Ver `customs-catalog §2.12`.

**La mitad de TOKENS sigue HECHA y seamless** (DD-18…DD-22): Theme Designer → export
DTCG → `tokens:import` → `verify` → Cloudflare. Con carril «en cristiano» ~1 min
(`tokens-check.yml`). No se rehace.

## DOS divergencias esperando propuesta en Figma (esto es lo siguiente del puente)

1. **Tramo actual del breadcrumb** — frame `Current state · propuesta` (node
   `13890:157`) ya escrito en Figma. **Marta lo mira** y, si le vale, lo sube al
   componente maestro; ahí deja de ser divergencia (`customs-catalog §2.12`) y pasa
   a 1:1.
2. **El lienzo de página: gris en el maestro, blanco en el código** (DD-34) —
   **ESPERA UNA DECISIÓN DE RAFA ANTES DE ESCRIBIRLA EN FIGMA.** Se abrió la fuente
   (s22) y el enunciado que había aquí era erróneo casi entero: el nodo `1:12381`
   **no existe**; el real es `13593:5401` y **no pinta nada** (`fills: []`,
   radius 0); y la pantalla del maestro no es Contact Center sino
   **`ScMemoryRuleBuilderPage`** (el constructor de reglas), página `Flujos`.

   La divergencia es real pero **más ancha**: el gris del maestro es el **lienzo de
   página** (`13593:5402` → `#f7f8fa` = `slate-50` = `--sc-bg-default`) con las
   cards blancas radius 8 encima. Medido a los dos lados sobre la MISMA pantalla
   (control validado: el sidebar mide `#1b273d` en ambos):

   | | lienzo | card | separación |
   |---|---|---|---|
   | maestro Figma | `#f7f8fa` | `#ffffff` | **1.063:1** |
   | código tras DD-34 | `#ffffff` | `#ffffff` | **1.00:1**, la hace el borde |

   O sea, el maestro usa justo el modelo que DD-34 midió y descartó. Proponer esto
   no es «quitamos una bandeja»: es «el lienzo de página pasa de gris a blanco en
   toda la app». Por eso no se ha escrito todavía.

   Lo que la fuente SÍ confirmó: los **huecos hundidos** están en el maestro (tres
   `Container` `#f7f8fa` radius 6 dentro de la card del Alcance). La asimetría que
   DD-34 dejó anotada es intención de diseño, no descuido.

> El **título de página** salió de esta lista: era la decisión abierta de la sesión
> 20 y Rafa la cerró — está hecha y documentada en **DD-33**.

## Cómo seguir con el puente

- **Más componentes Figma→código**: Rafa pasa un nodo; se repite el patrón
  `sc-divider`/`sc-breadcrumb` (wrapper fino + preset + demo + pokédex + adopción).
- **Round-trips pendientes** (código→Figma, guiados): focus-ring, cabos DD-24 — en
  `ROADMAP.md § En curso`.
- **Code Connect**: BAJA prioridad (los devs usan su repo). Figma lo ofrece al hacer
  `get_design_context`; se declina por nuestra decisión (`code-connect-low-priority`).

**Operativo de escritura a Figma** (aprendido esta sesión): SIEMPRE carga el skill
`figma-use` (recurso MCP `get_figma_skill` → `skill://figma/figma-use/SKILL.md`)
ANTES de `use_figma`, y pásalo en `skillNames` con prefijo `resource:`. Reglas que
duelen: cargar la FUENTE antes de tocar texto, colores en 0–1, posicionar nodos
nuevos lejos de (0,0) —escanea `page.children`—, auto-layout para hijos
relacionados, y `return` de TODOS los ids creados. NUNCA ClaudeTalkToFigma (memoria
`figma-bridge-which-mcp`). El write es atómico: si peta, no deja nada a medias.

---

# SESIÓN 19 — se acaba el contraste, y las tablas llegan a su tope real

| Commit | Qué |
|---|---|
| `631ea98` | Los dos últimos botones bajo AA (§1.8). **Cero fallos de contraste** salvo el límite conocido de §1.5 |
| `158855d` | reglas + categorias + entidades a `sc-datatable` (9 migradas) + 4 arreglos que destapó la revisión |

## Lo que hay que saber antes de tocar tablas

**Quedan 5 `<table>` a mano y NINGUNA debe migrar tal cual.** Está escrito con
su razón en `docs/receta-migracion-tablas.md`: tres son matrices de permisos
(una casilla por celda — ahí `<table>` con `<th scope="row">` es MEJOR
accesibilidad, no peor), una es un picker cuya fila selecciona al clicar
(contradice el modelo de la Ola 6) y `conversation-table` necesita **una
capacidad nueva del DS**: selección de rango con ancla (shift+click). Hoy la
cubren 5 tests e2e que una migración rompería.

**Los 29 checkboxes nativos NO caen migrando tablas** — corrijo lo que decía el
hand-off anterior. Están en filtros desplegables (12 solo en
`type-filter-button`) y formularios, no en tablas. Cambiarlos por `<sc-checkbox>`
es una tarea propia y legítima, pero es otra tarea.

## El patrón que funcionó, y su pega

Tres agentes en paralelo (worktree cada uno) + **un revisor adversarial por
migración**. Los tres autores dieron su trabajo por verde; los revisores
encontraron cuatro cosas reales, una grave (la tabla inerte que se iluminaba al
pasar el ratón). **El valor estuvo en la revisión, no en el paralelismo.**
Pega: los worktrees dejan `dist/` y `.angular/cache`, y eslint los escanea →
`verify` en rojo hasta hacer `git worktree remove` + borrar las ramas.

# SESIÓN 18 — el tema oscuro estaba a medias

| Commit | Qué |
|---|---|
| `2506483` | El arnés unitario existía a medias — ahora corre (vitest, 10 tests) |
| `7265a2f` | `--sc-label-*` gana tema oscuro; un solo vocabulario de insignia |
| `6a0b5a1` | La red tenía un agujero, y por él cabían seis defectos |
| `ca9e959` | Un solo anillo de foco, no cuatro |

## La causa raíz, en una frase

`--sc-color-*` es la paleta PRIMITIVA y **`07-dark.css` no redefine ni una**.
Escribir `background: var(--sc-color-slate-100)` en una hoja de página es
escribir un valor FIJO: en claro se ve bien y nadie se entera, en oscuro se
queda claro. Si encima el texto sí es semántico, sale gris claro sobre gris
claro. Medido en 28 rutas: `.rules-status--inactive` 1.40:1, `.avatar` 1.09,
el item ACTIVO del menú de AED 1.09, el chip que avisa de errores 2.16, el id
de una conversación fallida 1.30.

Y debajo: los **32 tokens `--sc-label-*` no tenían valor oscuro**, así que
`sc-chip` y `sc-tag` —que son del DS— pintaban islas pastel en media app, y
el defecto llegaba a cualquier consumidor.

## Lo que dejó de ser opinión

Ahora hay **un solo vocabulario de insignia**: `--sc-label-*`. Lo hablan
`.sc-label`, `.chip`, `.status-pill`, `.rules-status`, `.state-tag`,
`.entity-type-chip` y `.memory-failed-chip`. Se probó antes con la rampa
`--sc-bg-*-subtle`/`--sc-text-*` y **salió peor** (danger a 4.41:1): esa
pareja está calibrada para texto sobre el LIENZO, no dentro de una pastilla.
Ver `customs-catalog` §1.6.

## Las redes nuevas

- **`theme-contrast.spec.ts`** — 51 tests, 17 rutas × 2 temas. Dos preguntas:
  ¿queda alguna superficie clara en oscuro? y ¿se lee el texto encima? La
  segunda existe porque al oscurecer un fondo puedes dejar texto oscuro
  encima. **Corre también en claro**: al arreglar el oscuro salieron 4 fallos
  de AA en claro que llevaban ahí desde siempre.
- **`focus-ring.spec.ts`** — 7 rutas tabulando. No fija el hex (lo resuelve
  del token en vivo): vigila la UNANIMIDAD. Cuenta los anillos que ve y falla
  si son menos de 3, para no pasar en verde sin medir.
- **`sc-datatable.component.spec.ts`** — el primer `TestBed` del repo. Los
  targets `test` apuntaban a karma y karma nunca se instaló: los "0 tests
  unitarios" no eran una decisión, eran un arnés sin terminar.

# Decisiones que siguen necesitando a Rafa

1. **Dos botones del preset, bajo AA en claro**: `p-button-danger` (blanco
   sobre red-500, 3.76:1) y la etiqueta de `p-button-secondary outlined`
   (slate-500, 2.95:1 — es el botón "Añadir" de AED, un control primario).
   Vienen del Kit → **Rafa + Marta**. Es lo ÚLTIMO que queda bajo AA, y ya no
   hay nada de CSS de página en la lista.
2. **`--sc-text-secondary` sobre el lienzo**: 4.25:1 (y 3.92 sobre slate-100).
   Aceptado a propósito en §1.5 — subirlo lo pega a `text-primary`.
3. Los tres están fijados en `theme-contrast.spec.ts` con su número, a la
   vista. Cualquier OTRO fallo rompe la prueba; estos no, hasta que decidas.
4. **Los huecos hundidos en claro** (DD-34): `bg-default` dentro de una tarjeta
   mide 1.06:1 y solo se lee por su borde; en oscuro sí funciona. O se acepta que
   el hueco lo dibuje el borde, o hace falta un token de relleno hundido que valga
   algo en claro. **No lo decido yo**: son 9 sitios con intención declarada.
   **Dato nuevo (s22)**: la intención está **confirmada en el maestro de Figma** —
   los tres `Container` del Alcance son `#f7f8fa` radius 6 dentro de la card
   blanca. No es un descuido del código; es cómo está diseñado.
5. ~~`--sc-text-subtle` 2.04:1~~ — **decidido y hecho** (§1.7). ~~`text-secondary`
   2.95~~ · ~~`text-success`~~ · ~~separador en oscuro~~ — hechos en la 17.
   ~~Título de página~~ · ~~`bg-default` como superficie~~ · ~~`border-subtle` en
   oscuro~~ — **decididos y hechos en la 21** (DD-33, DD-34, §1.9).

## Lo que hay que saber antes de tocar un gris

Sobre blanco, de la rampa slate **solo cumplen AA dos pasos**: 600 (4.52) y 700
(7.38, que es `text-primary`). El 500 se queda en 2.95 y el 400 en 2.04. Por eso
`subtle` y `secondary` valen ya lo mismo en claro: no es un descuido, es que no
caben tres. **Si necesitas un tercer nivel, sepáralo por peso o tamaño.**

Al aplicarlo aparecieron tres pestañas cuyo único hover era el salto
`subtle → secondary` y se quedaron mudas; su hover subió a `primary`. Si añades
un control con estados, comprueba que su feedback no dependa solo de la
claridad del gris.


---

# TRAMPAS (verificadas, las nuevas primero)

- **Geometría no es color.** `main.bottom - page.bottom` te dice cuántos píxeles
  quedan por debajo del contenido, NO de qué color son: si el `:host` de la página
  se estira, los pinta él. Para «¿qué ve el usuario ahí?», `elementFromPoint` +
  subir buscando el primer ancestro con alfa 1. Me dio 489px de costura falsa.
- **Un `color-mix` computa a `color(srgb …)`**, no a `rgb()`. Cualquier
  normalizador que parsee `rgb()`/hex devuelve `null` o basura ahí. Que convierta
  el navegador: pinta 1px en un canvas y lee `getImageData`. Y **valida el control
  de la sonda**: `ctx.fillStyle = 'var(--x)'` NO resuelve la variable (se queda en
  negro) — el control tiene que pasar por `getComputedStyle` como los demás.
- **Una regla encapsulada de componente le gana a una global.** Hay `.page__title`
  MUERTO en ~9 hojas de página con tamaños distintos: reusar ese nombre para una
  clase global habría dado un tamaño por página sin que nada avisara. Antes de
  bautizar una clase compartida, `grep` el nombre en los `.scss` de componente.
- **Un `:host` de página sin `height: 100%` deja ver el shell por debajo.** Trece
  páginas lo llevan y tres no lo llevaban. El defecto es LATENTE mientras el
  contenido llegue abajo: no fíes en «se ve bien», mira la regla.
- **Las baselines visuales de `npm run e2e` se saltan en CI**
  (`if (process.env['CI']) return`). En local llevan 25 en rojo por entorno. Si te
  fallan, haz stash-y-reproduce antes de culpar a tu cambio — y no las uses como
  red, porque no lo son.
- **La paleta `--sc-color-*` NO se remapea en oscuro** (cero definiciones en
  `07-dark.css`). Usarla en un `background` o un `color` de página es escribir
  un valor fijo. Si además la pareja del otro lado sí es semántica, el
  resultado es ilegible en uno de los dos temas. Es la causa de casi todo lo
  de la sesión 18.
- **Un token de FONDO no es un color de texto, ni al revés.** `--sc-bg-primary`
  como `color:` daba 3.39:1; `--sc-text-info` como `background:` daba 3.15.
  Los dos colaban en claro y se rompían en oscuro.
- **`npm run verify` reescribe `dist/` debajo de un `ng serve` vivo** y lo deja
  con `Cannot find module '@smartcontact-hub/components'`. El server sigue
  sirviendo el bundle ANTERIOR, así que mides código viejo sin enterarte. Tras
  un `verify`, reinicia el dev server antes de volver a medir. Me pasó.
- **Los iconos de Material son LIGATURAS**: llegan al DOM como nodos de texto.
  Al medir contraste hay que darles el umbral de 1.4.11 (3:1, gráfico), no el
  de texto (4.5), o la medición se llena de falsos positivos y acabas
  silenciando la red.
- **Un `color-mix(... transparent)` claro sobre un fondo oscuro no sale
  "claro"** (0.24 de luminancia) pero sí lo bastante claro para matar el texto
  de encima. Medir solo la luminancia del fondo no basta; hay que medir el
  contraste con lo que lleva encima.
- **Al medir contraste, no filtres por "tiene fondo propio".** El texto casi
  siempre vive en un `<span>` sin fondo dentro de un contenedor que sí lo
  tiene. Con ese filtro la red pasa en verde saltándose el caso más común.
- **`waitForLoadState('networkidle')` sin acotar puede tumbar el CI sin que
  falle ninguna aserción.** Pasó: el test del datepicker agotó sus 60s en el
  `goto` y sus comprobaciones ni corrieron. sc-demo descarga 3,9 MB de fuente
  más chunks perezosos, así que con 2 workers la red tarda en callarse. Ya está
  acotado a 10s y sin `throw` en los 4 sitios. **Si añades un `goto` nuevo, usa
  el mismo patrón.** (La re-ejecución pasó: era flake, pero el arreglo va a la
  causa, no al síntoma.)
- **`table-layout`**: `main.scss` fuerza `fixed` en `table.table`; `sc-datatable`
  es `auto`. Al migrar, las columnas se recolocan si no lo corriges (la piel
  `.list-table` ya lo hace).
- **PrimeNG pinta SIEMPRE la banda de `caption`**, proyectes o no en
  `[scTableCaption]` → franja vacía sobre la cabecera.
- **Los `<td>` los pinta el DS**: cualquier regla encapsulada de la página que
  apuntara a `.table__td-*` deja de aplicar. Si una celda tiene estilo propio,
  dale un `cellTemplate` con su `<span>`.
- **`sc-demo` enruta por HASH**: `/#/components/x`. Sin la almohadilla el
  deep-link rompe los assets, la app no arranca y los tests fallan por el arnés,
  no por el componente. (Me pasó; 5 tests en rojo por eso.)
- **La casilla de PrimeNG mide 17,5px** (la nativa medía 15,75): con
  `table-layout: auto` eso ensancha la columna 2px. Con `fixed` no.
- **El tema oscuro se activa con `.sc-dark` en `<html>`**, vía `localStorage`
  `sc-theme` (ThemeService). Ponerle la clase a mano NO vale: el servicio la
  revierte y te deja midiendo un tema mixto — me dio números incoherentes hasta
  que validé el canal.
- **`borderBottomColor` existe aunque el ancho sea 0** (vale `currentColor`).
  Mide también `borderBottomWidth` o firmarás un contraste de un borde que no se
  pinta. Casi lo hago.
- **La fuente de iconos pesa 3,9 MB**: espera `document.fonts.ready` +
  `document.fonts.load(...)` antes de medir o capturar. Ojo: las ligaduras salen
  en `innerText` aunque estén bien pintadas, así que eso NO sirve para
  comprobarlo — hay que mirar la imagen.
- **`http-server` no hace fallback SPA**: para rutas profundas, `ng serve`.
- **El dev server sirve el DS COMPILADO**: tocar `projects/ui-smartcontact*/src`
  no se ve hasta `build:components` + **reiniciar** (una recarga dura no basta).
- **`export-clean` se salta con `CI=1`**.
- **Sin backticks en mensajes de commit**; usa `-F -` con heredoc.
- **Nada de `page.reload()`** en journeys de memory (stores en RAM).
- **`npm run e2e` pisa `public/usage/*.png`** y `usage:capture` reescribe
  `_usage-raw.json`: para capturar, script aislado con la API de Playwright.
- **Añadir o quitar un `<sc-*>` desfasa `audit:components`** → `node
  scripts/component-audit.mjs --write` + commitea `docs/inventory.md` y
  `docs/_component-status.json` en el mismo commit.

# Aparcado con razón (sin cambios)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro. |
| `line-height` sin unidad (~55) | Sin token destino en el Kit. |
| ~~`--sc-text-subtle` 2.04:1~~ | **Salió de aquí en la 18**: era falso que su uso fuera placeholder/disabled. Está en contenido real (161 usos). Sube a «Decisiones que necesitan a Rafa». |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda. |
| `group-assignment-table` y `agent-channel-table` | NO deben migrar: son formularios disfrazados de tabla. |
| Paginación de las tablas | Valor ≈ 0 hoy (6-84 filas). |
