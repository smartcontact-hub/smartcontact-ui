# Acoplamiento a los internos de PrimeNG — las 36 clases, una a una

> **Qué es esto.** La clasificación completa de las 36 clases `.p-*` de las que dependía nuestro
> CSS el 2026-09-10, con el veredicto de cada una: **se dice en el preset** (y entonces viaja con
> el tema) o **es genuinamente custom** (y entonces se queda, con su motivo escrito).
>
> **Por qué importa, en una frase.** Una regla que vive en el CSS de una app **no viaja**: se
> exporta el tema, se monta en otro sitio y esa pantalla revierte al preset —filas de 42px,
> cabecera oscura, botones que no chascan— **sin que falle un solo test**, porque el comportamiento
> sigue intacto. Es el fallo silencioso más caro que tiene el proyecto.
>
> El recuento vivo lo lleva `npm run audit:primeng-coupling`. Este documento explica el PORQUÉ de
> cada fila; el gate lleva la cuenta.

## El criterio, y por qué no es «¿es feo?»

Tres preguntas, en este orden:

1. **¿Es una opinión del SISTEMA o de esta app?** Cómo responde un botón al dedo, cómo se ve una
   tabla-lista de administración o cómo se marca una acción destructiva en un menú son del sistema:
   cualquier consumidor los tiene. Que un estado de transcripción se pinte ámbar mientras
   transcribe es de Memory, y solo de Memory.
2. **¿Se puede DECIR en el preset?** Casi siempre sí: `sc-preset/css.ts` emite CSS dentro de
   `@layer primeng`, que es el punto de extensión que `@primeuix/themes` publica justo para esto.
   Si hace falta un gancho, se pone como ENTRADA del componente del DS (`variant="list"`), no como
   una clase que se inventa la app.
3. **Si se queda, ¿deja de ganar en silencio?** Sin capa, el CSS de app gana SIEMPRE a
   `@layer primeng`, sin mirar especificidad. Lo que se queda va en `@layer app` —declarada después
   de `primeng` en `styles/_layers.scss`—: sigue ganando, pero por un orden que se puede leer.

## Resultado

| Hogar | Antes | Después | Qué significa |
| --- | ---: | ---: | --- |
| **app** — SCSS del Supervisor | **16** | **6** | **No viaja.** Es el número que hay que llevar a cero |
| **ds** — SCSS de `ui-smartcontact` | 20 | 20 | Viaja: va dentro del paquete de componentes |
| **preset** — `sc-preset/*.ts` | 49 (sin contar) | 56 | Viaja Y es el sitio correcto |
| Bloques de app **SIN CAPA** sobre `.p-*` | **26** | **1** | El que Rafa señaló: ganaban al tema sin decirlo |

El preset SUBE, y eso es el arreglo, no un empate: siete de esas clases son las que bajaron de la
app. Lo que compra contarlo es el chequeo de HUÉRFANOS, que hasta hoy no miraba el preset y en su
primera pasada encontró **dos selectores muertos** (`.p-inputchips`, `.p-inputchips-input-item`):
PrimeNG no tiene ningún `inputchips` — ni fichero, ni clase.

---

## A · Las 16 del Supervisor (las que NO viajaban)

### A1 · La gramática de tabla-lista → **AL PRESET** (10 bloques, 6 clases)

| Clase | Qué hacía | Veredicto |
| --- | --- | --- |
| `p-datatable-table` | `table-layout: fixed` para que las columnas no bailen al ordenar | → preset |
| `p-datatable-header` | oculta la banda de `caption` que PrimeNG pinta aunque esté vacía | → preset |
| `p-datatable-thead` | cabecera silenciosa: 12/500 gris, sin fondo, hairline abajo | → preset |
| `p-datatable-tbody` | padding de celda, hairline de fila, `position: relative` | → preset |
| `p-selectable-row` | hover solo si la fila hace algo | → preset |
| `p-datatable-row-selected` | gris neutro en vez del resaltado azul de PrimeNG | → preset |

**Por qué al preset.** Es la piel de NUEVE tablas, con todos sus valores en token: eso no es el
gusto de una pantalla, es la gramática de la casa. Vivía fuera del tema por una objeción concreta y
razonable —«tocar el preset cambiaría también la tabla de llamadas de `agent`, que no es una lista
de administración»—, y esa objeción la responde una **variante**: `<sc-datatable variant="list">`.
No aplica a quien no la pide. Ahora vive en `sc-preset/css.ts` (`listTableCss`) y viaja.

**Lo que cambió en las plantillas.** `class="list-table"` → `variant="list"` (11 tablas), y la
clase por fila `table__row--clickable` pasa a `sc-row--clickable`: el tema no puede depender del
nombre que se haya inventado una app.

**La red que lo autorizó.** `e2e/supervisor/list-table-grammar.spec.ts` fija los valores computados
de las nueve páginas. Se corrió ANTES (22/22) y DESPUÉS (22/22) con los mismos números: la piel
cambia de casa, no de valor.

**Una excepción, y su motivo.** `.sc-datatable__check { width: 40px }` NO se fue al preset: ese
nodo lo pinta la plantilla del componente, cuyo SCSS va sin capa y le ganaría a cualquier cosa
dicha desde `@layer primeng`. Vive en `sc-datatable.component.scss`, con `:host(.sc-datatable--list)`.

### A2 · La micro-interacción de botón → **AL PRESET** (2 bloques, 1 clase)

| Clase | Qué hacía | Veredicto |
| --- | --- | --- |
| `p-button` | transición corta en hover/focus, `scale(0.98)` al pulsar, nada si `:disabled` | → preset |

El comentario que la retenía decía «el tema decide cómo SE VE un botón, esta app decide cómo
RESPONDE al dedo». Es media verdad: la app **puede** decidirlo, pero entonces exportas el tema y
los botones dejan de chascar. Que el Kit no publique un token de micro-interacción no la convierte
en propiedad de una app. Las tres clases de chrome propio que acompañaban al selector
(`.empty-state__cta`, `.rename__btn`, `.profile-tabs__tab`) se quedan en el Supervisor y ya no
arrastran ningún `.p-*`.

⚠️ En el preset el selector es `.p-component.p-button` y no `.p-button`: el blob global se inyecta
ANTES que el CSS del componente, así que a igual capa e igual especificidad ganaría PrimeNG. Es el
mismo (0,2,0) que ya usaban los selectores de tipografía, por el mismo motivo.

### A3 · El item de menú destructivo → **AL PRESET** (4 bloques, 3 clases)

| Clase | Qué hacía | Veredicto |
| --- | --- | --- |
| `p-menu-item-link` | rojo del "Eliminar" | → preset |
| `p-menu-item-icon` | rojo de su icono | → preset |
| `p-menu-item-content` | tinte de advertencia en hover | → preset |

«Acción destructiva en un kebab» la tiene cualquier consumidor con una tabla, y los tres valores ya
salían de tokens (`--sc-text-danger`, `--sc-bg-danger-subtle`): no había ninguna medida inventada
que lo retuviera fuera del tema. El gancho pasa de `rules-menu-item--danger` a
`sc-menu-item--danger` — `rules-` era el rastro de la pantalla donde nació, y ya se usaba en nueve.

### A4 · La piel de transcripciones → **SE QUEDA** (9 bloques, 0 clases)

`styles/_memory-conversation-table.scss`. Cabecera fija al scroll, celdas más aireadas y cuatro
estados de fila —transcribiendo, analizando, fallida, borrada—, dos con barrido *shimmer*.

**Por qué se queda.** «Transcribiendo» y «analizando» son estados de Memory, no conceptos del
sistema: un consumidor nuevo del DS no los tiene ni los quiere. Es el ejemplo canónico de
divergencia legítima.

**Qué cambió igualmente, que era lo que la hacía silenciosa:**

1. **Ya no nombra internos de PrimeNG.** Se colgaba de `.p-datatable-thead` / `.p-datatable-tbody`;
   ahora usa `thead` / `tbody`, que los garantiza HTML y no puede renombrar una subida de versión.
   Los nueve bloques salen del recuento **porque la dependencia dejó de existir**, no porque se
   hayan movido de sitio.
2. **Ya no gana en silencio.** Va en `@layer app`.

### A5 · El popover del switcher de prototipos → **SE QUEDA** (1 bloque, 1 clase)

| Clase | Dónde | Motivo escrito |
| --- | --- | --- |
| `p-popover-content` | `styles/main.scss` | Panel de un PROTOTIPO con su propio cromo (`padding: 0`), no una opinión del sistema sobre los popovers. Es el único `.p-*` de app que queda en esa hoja, y va en `@layer app` |

### A6 · El toast → **SE QUEDA, con la deuda apuntada** (5 clases)

| Clase | Dónde | Qué hace |
| --- | --- | --- |
| `p-toast` | `app.component.scss` | ancla de los tres strips de abajo |
| `p-toast-message` | ídem | quita fondo y borde de PrimeNG, pone la sombra del Kit |
| `p-toast-message-content` | ídem | `padding: 0` para que el cromo lo ponga `.sc-toast` |
| `p-toast-message-icon` | ídem | oculta el icono de PrimeNG (el nuestro va dentro) |
| `p-toast-close-button` | ídem | oculta su cierre (el nuestro es un `sc-button`) |

**El diagnóstico honesto: esto no es custom, es una migración pendiente.** El DS ya tiene
`<sc-toast>`; el Supervisor **no lo usa** — monta un `<p-toast>` a pelo con su propia plantilla y
su partial `styles/_sc-toast.scss`. Estos cinco strips existen para desnudar el toast de PrimeNG y
dejar sitio a ese cromo propio. El arreglo de verdad es migrar a `<sc-toast>` (que hoy no proyecta
contenido: habría que darle esa API), y eso es un trabajo aparte, no un renombrado. Van en un SCSS
de componente encapsulado, así que **no cuentan como bloque sin capa**, pero sí como acoplamiento
de app: son 5 de los 6 que quedan.

---

## B · Las 20 del DS (viajan)

Todas viven en el SCSS de un componente de `projects/ui-smartcontact`. Ahí la falta de capa **es la
arquitectura**: es la opinión del componente sobre su propio preset, y viaja dentro del paquete.
Siguen entrando en el chequeo de huérfanos, porque un renombrado de PrimeNG las apaga igual.

| Componente | Clases | Qué dicen |
| --- | --- | --- |
| `sc-select` | `p-select-label` · `-header` · `-filter` · `-list` · `-option` | tamaño md/sm/lg del valor, y la tipografía del panel, que se renderiza en `<body>` |
| `sc-multiselect` | `p-multiselect-label` · `-header` · `-filter` · `-list` · `-option` | lo mismo |
| `sc-datepicker` | `p-datepicker-input` · `-header` · `-day` · `-day-view` · `-month` · `-year` · `-weekday` | ancho y letra del input; tamaño del panel sm/lg |
| `sc-inputgroup` | `p-inputgroup-addon` · `p-inputtext` | el addon iguala el padding y la letra de `sc-inputtext` en sm/lg |
| `sc-dialog` | `p-dialog-content` | desnuda el contenedor de `p-dialog` para que el cromo lo ponga `.sc-dialog` |

**Lo que sí queda medido y pendiente aquí.** Cuatro declaraciones de este grupo repiten lo que el
tema YA publica: el `font-size` md de `.p-select-label`, `.p-multiselect-label`, `.p-inputtext` (en
`sc-inputgroup`) y `.p-datepicker-input` está en `sc-preset/css.ts` (`mdControlSelectors`) con el
mismo valor. Retirarlas no baja el recuento —esas clases se usan también para el padding sm/lg—,
así que es limpieza, no deuda estructural, y pide correr `e2e/component-styles.spec.ts` delante
para probar que el computado no se mueve. **No se hizo en esta pasada**, que iba a lo que no viaja.

---

## Qué hacer cuando el gate se ponga rojo

**Si crece `app`**: no subas el tope sin contestar la pregunta 2 de arriba. Casi siempre se puede
decir en el preset, y entonces viaja.

**Si crece `preset` o `ds`**: es menos grave, pero cada `.p-*` sigue siendo un punto donde una
subida de versión cambia el aspecto en silencio. Sube el tope con el motivo en el commit.

**Si aparece un HUÉRFANO**: PrimeNG renombró (o retiró) esa clase. Busca el nombre nuevo en su
changelog. No borres la regla sin sustituirla — salvo que, como con `.p-inputchips`, el componente
entero haya dejado de existir.
