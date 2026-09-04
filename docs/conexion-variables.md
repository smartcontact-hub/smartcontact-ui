# Conexión de variables: Figma → tema → navegador

Para cada variable de los componentes que publica el showcase del consumidor, **si está
enganchada en Figma y si el CSS de PrimeNG la lee**. Es el mapa que hay que abrir al empezar una
card, y la rutina con la que se lee un tema nuevo.

- **El dato, navegable**: sc-docs → Lab → **Conexión de variables** (`/#/conexion`).
- **El dato, en Excel**: [`conexion-variables.csv`](./conexion-variables.csv).
- Los dos salen de la MISMA ejecución de `npm run variables:map`, así que no pueden divergir.

---

## Por qué hace falta

La cadena tiene cuatro eslabones y **se rompe en silencio**:

1. Una **capa** de Figma usa la variable.
2. El **export del tema** publica el token. Se genera **desde las variables, no desde las capas**:
   atar una capa nunca cambia el export.
3. El **CSS de PrimeNG** lee ese token. Su modelo es cerrado: si no lo lee, no viaja.
4. El **navegador** del consumidor lo pinta, salvo que su propio CSS lo pise.

Un valor escrito a mano en Figma se ve idéntico a uno atado. Un token que PrimeNG no lee se
exporta igual. **«Se ve bien» es el síntoma de este defecto, no su ausencia**: por eso se mide.

---

## Los once veredictos

Seis salen solos de cruzar las dos preguntas:

| Veredicto | ¿La usa una capa? | ¿La lee PrimeNG? | Qué significa |
|---|---|---|---|
| **conectada** | sí | sí | La cadena entera está enganchada |
| **Figma no la usa** | no | sí | El valor viaja igual. Lo que puede desviarse es el dibujo |
| **espejismo** | sí | no | Se ve bien en el Kit y no llega a la pantalla |
| **muerta** | no | no | Nadie la usa. Ocupa sitio en el modelo |
| **solo web** | — | sí | El tema lo publica y Figma no lo modela: sombras, estilos de línea, duraciones, paleta cruda |
| **solo Figma** | sí | — | El Kit dibuja algo sin token detrás: o es un auxiliar que no tiene que viajar, o una divergencia que NO PUEDE viajar |

Los otros cinco **no los ve el cruce**, porque hace falta abrir el nodo o el CSS. Solo los pone una
revisión a mano, y son los que más cuestan de encontrar. Dos abren un caso y tres lo cierran:

- **mal apuntada** — sí está atada, pero **a la variable equivocada**: la del estado vecino, la de
  otro componente, o una de la librería remota. El cruce la da por buena porque hay enlace, así que
  solo se ve abriendo el nodo. De las 12 correcciones de la primera pasada, **5 eran de este tipo y
  7 eran variables sueltas**; contadas por CAPAS sale casi mitad y mitad (44 y 48), porque una sola
  mal apuntada arrastraba 27 capas del maestro del Menu.
- **muerta en el tema** — el tema publica el token y el componente lee otro canal. Hay dos modelos
  para lo mismo y el del tema no manda.
- **conectada por el primitivo** — dos variables con nombres distintos apuntan al mismo primitivo,
  así que hoy coinciden. No está roto; el riesgo es que se mueva una y no la otra.
- **viaja por `--sc-*`** — PrimeNG no lo lee, y es correcto: son extensiones nuestras (`presence`,
  `text/accent`) que llegan por el otro canal del modelo, no por el tema.
- **no es un hallazgo** — parecía un fallo y al abrir el nodo no lo era. Se anota **con el motivo**
  para que nadie lo vuelva a investigar; un mapa que solo guarda los aciertos hace repetir el
  trabajo descartado.

---

## Cómo se mide

### Lado Figma

Recorrer variantes y capas leyendo `boundVariables`, y también los `boundVariables` de cada
`paint`. Agregar por (capa, propiedad).

**Trampas medidas, las dos costaron una pasada entera:**

- **El grosor de borde vive en los CUATRO lados** (`strokeTopWeight`…), no en `strokeWeight`.
  Mirar solo `strokeWeight` dio 56 falsos positivos en un componente y un «0 de 22 atadas» que
  era falso: estaban las 22.
- **`findOne` esconde el defecto.** En un botón con dos iconos, el primero estaba bien atado y el
  segundo no. Buscar todas las coincidencias, siempre.

### Lado código, sobre el deploy del consumidor

- **¿Lo lee el CSS de PrimeNG?** Buscar el nombre del token en `rule.cssText`, **nunca** en la
  enumeración de propiedades: una declaración cuyo valor lleva `var()` no aparece al enumerar. Ese
  punto ciego dio un «0 usos» que era falso.
- **¿Lo pisa el consumidor?** Separar por el atributo `data-primeng-style-id`: lo que lo lleva es
  del tema, lo demás es suyo.
- **Medir en la página de cada componente.** Angular retira los estilos del componente al salir de
  la ruta, así que un barrido que navega y mide al final solo ve la última página.

### Los cuatro filtros, antes de anotar nada como hallazgo

Saltárselos produjo cinco falsos positivos seguidos en la primera sesión. Los cinco los desmontó
Rafa abriendo el nodo.

1. **¿La propiedad hace algo EN ESA CAPA?** Un `gap` con un solo hijo no separa nada. Un radio en
   un envoltorio sin fondo ni borde no se ve. Una capa de texto de ancho 0 no pinta nada.
2. **¿El resto del componente ya está atado?** Si 5 de 6 instancias usan la variable y una no, es
   un despiste local, no «el componente está mal».
3. **¿Existe la variable a la que atar?** Si no existe es hueco del modelo. Y si el valor difiere a
   propósito, tampoco es fallo.
4. **¿El CSS del proveedor lee ese token?** Sin esto se ata algo que no viaja.

---

## Cuál de los dos lados manda

> La decisión y sus alternativas descartadas viven en
> [`docs/DECISIONS.md`](./DECISIONS.md) → **DD-49**. Aquí va cómo se ejecuta.

Encontrar una diferencia no dice quién tiene razón. Antes de anotar «esto está mal» hay que decidir
**qué lado es el correcto**, y eso se mide, no se opina. La pregunta se contesta en este orden:

1. **¿Existe el canal en el CSS del proveedor?** Si PrimeNG no tiene token para eso, el Kit puede
   dibujar lo que quiera: no va a viajar. Manda la web por construcción.
2. **¿Qué valor publica el tema, medido en el deploy?** El tema se genera desde las VARIABLES, así
   que si la variable es correcta el valor llega bien aunque ninguna capa la use.
3. **Solo entonces**, ¿qué dibuja el Kit? Si difiere, la divergencia es del dibujo.

**El patrón que sale casi siempre**: el valor llega bien a producción y **lo que va por detrás es
el dibujo**. Eso no rompe la web; engaña a quien lee el Kit, que ve un color que el producto no
pinta nunca. Es deuda de Figma, no de código, y no corre la misma prisa.

**El caso que lo enseña mejor** (medido el 2026-09-04): en `button-small`, 143 de 311 variantes
pintan el icono derecho con la variable gris de la librería externa. Parecía un fallo de conexión.
Pero medido en el deploy, **42 de 42 iconos de botón toman el color de su botón, sin una sola
excepción, y no existe ninguna regla CSS que dé color propio a `.p-button-icon`**. PrimeNG no tiene
canal para eso: el Kit está dibujando algo que no puede ocurrir. La web no está mal, el Kit pide un
imposible.

---

## Qué se ata y qué no

**Se ata** cuando la variable ya existe, el CSS la lee y **el valor no cambia**: no mueve un píxel.

**Se anota y se para** cuando atarla cambiaría el dibujo. Eso es decisión de diseño, no de
mantenimiento.

**No se toca nunca:**

- **El anillo de foco.** Esa capa dibuja el hueco más el anillo, que es la suma de dos tokens, y
  Figma no suma. Son 34 filas y ninguna es un fallo.
- **Lo que Figma no dibuja.** El Kit no representa toda variante ni todo estado. El valor viaja
  igual.
- **Lo que viene igual del PrimeOne.** Sin decisión explícita no es deuda nuestra.
- **Los valores.** Esto es un mapa de conexión, no un cambio de diseño.

---

## Dónde vive el dato

Mismo reparto que la galería de uso real: una **captura** que no puede correr en CI escribe un
crudo versionado, un **script puro** deriva, sc-docs **pinta** y un **guard** barato comprueba que
no se ha quedado viejo.

| Pieza | Fichero |
|---|---|
| Crudo de la medición | `projects/sc-docs/public/variables/_variables-raw.json` |
| Derivado que pinta la web | `projects/sc-docs/public/variables/_variables-status.json` |
| Derivado para Excel | [`conexion-variables.csv`](./conexion-variables.csv) |
| Deriva + guard | [`scripts/variables-map.mjs`](../scripts/variables-map.mjs) |
| Página | `projects/sc-docs/src/app/pages/conexion/` |

```bash
npm run variables:map
```

Reescribe los dos derivados desde el crudo. `npm run variables:check` recomputa y **falla si lo
committeado difiere**: es el guard.

**La medición sí es manual**, porque necesita el puente de Figma y el navegador del consumidor.
Solo ella toca el crudo. Ningún script del repo lo reescribe.

**El guard está en `npm run verify` desde el 2026-09-04**, una vez cerrado el mapa. A partir de
ahí, cualquier commit que deje los derivados viejos se pone rojo. Entrar en la cadena arrastró dos
cosas: el README lo nombra en su tabla de guards, y el filtro del CHECK B de `docs:coherence` pasó
a vigilar los namespaces `usage:` y `variables:`, que antes no miraba. Ese hueco no era teórico:
`usage:check` llevaba meses en `verify` sin estar documentado, que es justo lo que ese check
existe para impedir.

No hizo falta tocar `ci.yml`, porque `verify` es un solo paso allí. Si algún día se añade un paso
suelto al CI, entonces sí entran en juego el test de paridad
[`scripts/ci-preflight-parity.mjs`](../scripts/ci-preflight-parity.mjs) y el hook de pre-push.

---

## Estado del 2026-09-04

816 filas, 18 componentes, medidas contra el Kit de Figma y el CSS que sirve
`ui.smart-contact.com`.

| Veredicto | Nº |
|---|---|
| conectada | 636 |
| Figma no la usa | 87 |
| solo web | 79 |
| espejismo | 3 |
| muerta | 3 |
| solo Figma | 3 |
| conectada por el primitivo | 2 |
| muerta en el tema | 1 |
| viaja por `--sc-*` | 1 |
| no es un hallazgo | 1 |

De las 87 «Figma no la usa»: 34 son el anillo de foco (no atables), 41 llevan `FALTA DIBUJARLO` (el
Kit no dibuja esa variante o ese estado) y el resto se cerraron abriendo el nodo.

**12 variables atadas** en la primera pasada, unas 92 capas en total. **5 estaban mal apuntadas y 7
sueltas**; por capas sale casi mitad y mitad (44 y 48), porque una sola mal apuntada arrastraba las
27 del maestro del Menu. Ninguna cambió el dibujo salvo `checkbox/focus/border/color`, donde 15
capas corrigieron un gris, autorizado en su momento.

**Las 8 que quedaban pendientes se cerraron el 2026-09-04**, y el resultado dice más del método que
de los componentes:

- **Tres eran falsas alarmas.** Las tres capas remotas del InputText resultaron ser una instancia
  de OTRA librería posada en la página (su padre es la página, no el component set). `presence` y
  `text/accent` no están muertos: viajan por `--sc-*` y los consume el Supervisor.
  `app/typography` está conectado desde `sc-preset/extend.ts` y consumido en `sc-preset/css.ts`.
- **Las otras cinco son deuda de DIBUJO, no de conexión.** En las cinco el valor llega bien a
  producción. Lo que va por detrás es el Kit: los iconos del toggle del DataTable y 143 iconos
  derechos de `button-small` pintan con la variable de la librería externa, y dos variantes del
  toggle cogen el fondo de `treetable`. Ninguna rompe la web.
- **Una salió del repo entera**: el modal a medida, que necesita un cambio en el código del
  consumidor. Está abajo.

No queda ninguna fila «pendiente». Lo que sigue abierto lleva su accionable y su porqué, en la
página y en el CSV.

---

## Segunda pasada: ¿está bien tachado?

El mapa marca 92 variables como «no la usa ninguna capa». Esa marca no se puede dar por buena sola:
puede significar que **no hay dónde atarla** (correcto) o que **hay una capa pintada a mano** que
debería estar usándola (defecto). La pregunta se contesta al revés que la primera pasada: en vez de
mirar la variable, se mira **qué capas llevan un valor escrito a mano** en una propiedad para la
que SÍ existe variable.

**Los tres filtros de esta sonda**, los tres nacidos de falsos positivos propios:

1. **Excluir el marco del propio component set.** Es andamiaje de Figma, no el componente.
2. **Comprobar que la variable existe.** El Tag tiene 29 capas con grosor de borde a mano y
   **no existe `tag/border/width`**: hueco del modelo de PrimeNG, no despiste.
3. **Comprobar que la capa PINTA algo.** El Button dio 732 capas de texto con relleno crudo y
   **ninguna pinta**: 516 tienen ancho cero. Sin este filtro, el componente más grande del Kit
   sale como el más roto.

### Resultado del 2026-09-05, los 18 componentes

| Componente | Estado | Detalle |
|---|---|---|
| Tag, InputNumber, Checkbox, RadioButton | **limpios** | Cero capas a mano donde exista variable |
| Badge | **bien tachado** | Sus 56 radios crudos son variantes `Circle=True`: 10,5 / 15,75 / 21, la mitad del alto de cada talla. Un radio por tamaño y una sola variable: no hay dónde atarlos |
| Avatar | **bien tachado** | Idéntico: 14 / 21 / 28 son la mitad de sus tres tallas |
| Button | **bien tachado** | 732 capas con relleno crudo y **cero pintan** (516 con ancho 0). Sus enlaces de color: 5.050 al DS, 143 remotos (los iconos de `button-small` ya documentados) |
| **InputText** | **DEFECTO CONFIRMADO** | Ver abajo |
| Select, MultiSelect | **bien tachados** | Los mejor conectados del Kit: 7.982 y 8.234 enlaces al DS y **cero remotos**. La mitad de sus huecos no separa nada (253 y 263 en capas con menos de dos hijos) y el resto vive en el envoltorio del formulario, que PrimeNG no modela |
| Toast, ToggleSwitch | **bien tachados** | Sus grosores a 1 están en capas sin variable: no existe `toast/close/button/border/width` ni `toggleswitch/handle/border/width`. Los grosores a 3 son el anillo de foco |
| Chip, Dialog, Breadcrumb, ContextMenu | **bien tachados** | Ninguno tiene `border/width` en su modelo. Los chevrons crudos del ContextMenu son el ENVOLTORIO del icono, blanco sobre blanco: el vector de dentro **sí está atado**, en los cuatro estados. Los huecos del Breadcrumb vuelven a salir nulos, confirmando el falso positivo de la primera pasada |
| DataTable | **bien tachado** | Sus candidatos son en su mayoría componentes ANIDADOS (checkbox, radiobutton, rating dentro de las celdas), que pertenecen a otro componente y no son fallo suyo |
| **Menu** | **DEFECTO CONFIRMADO** | Ver abajo |

**Balance: dos defectos en 18 componentes.** Todo lo demás es hueco del modelo, anillo de foco,
capas que no pintan o componentes anidados. El problema no estaba repartido.

### El segundo defecto: el popup del Menu no sigue el modo oscuro

`menu/background` **existe y la usan** las otras variantes (`Type=Basic` y los frames `menu`). Pero
los dos componentes de `menu-popup`, `Menu=False` (`2355:48562`) y `Menu=True` (`2360:44447`),
llevan el fondo **blanco escrito a mano**.

Hoy no se nota: `menu/background` resuelve a `{content.background}` → `{surface.0}`, que es blanco.
**En oscuro sí se nota**, porque el tema manda `{surface.900}`: las capas atadas se oscurecen y
estas dos se quedan blancas.

*Accionable*: atarlas a `menu/background`. **No cambia el dibujo en claro** y arregla el oscuro. Es
de los seguros, como las 12 de la primera pasada.

### El defecto confirmado: la tipografía del InputText no está conectada

Medido capa a capa en sus dos component sets, 660 capas de texto:

| Capa | Atadas | ¿A qué? | Sueltas | Tamaños sueltos |
|---|---|---|---|---|
| Placeholder | 51 | variable **remota** de la librería | 228 | 11,5 · 13,25 · 15 · 16,75 |
| Text | 9 | remota | 36 | 13,25 · 15 · 16,75 |
| Label | 48 | remota | 48 | 15 |
| Helper Text | 0 | — | 240 | 13 |

Tres hechos, los tres medidos:

1. **Ninguna apunta a una variable del DS.** Las atadas van a la librería externa.
2. **Ninguna usa un estilo de texto.** Cero de 660, comprobado porque era la primera sospecha de
   falso positivo.
3. **Los tamaños están fuera de la escala.** 11,5 · 13 · 13,25 · 15 · 16,75, contra una escala de
   12 / 14 / 16. Y el componente solo modela dos tallas de letra,
   `inputtext/sm/font/size` y `inputtext/lg/font/size`, que el tema publica como 12 y 16.

**Consecuencia práctica**: cambiar el tamaño de letra del InputText en las variables del DS no
mueve el dibujo, porque no lo lee nadie. Es el caso del Tag otra vez, en tipografía.

#### Qué lado manda, aplicando DD-49

**Manda la web.** El canal existe, funciona y llega; los números del Kit no alcanzan nada. Medido
en su deploy: el campo normal pinta **14px**, el pequeño **12** y el grande **16**, con la raíz a 16.

Y dentro del mismo componente hay **tres situaciones distintas**, que piden tres cosas distintas:

**1. Small y Large: hay variable y no se usa.** `inputtext/sm/font/size` y `inputtext/lg/font/size`
existen, el tema las publica como `0.75rem` y `1rem`, y el navegador pinta 12 y 16. El Kit dibuja
13,25 y 16,75, atado a la librería REMOTA. *Accionable*: repuntar a las variables del DS. **Cambia
el dibujo** (13,25 → 12 y 16,75 → 16), así que es decisión de diseño, no mantenimiento.

**2. Normal: no hay variable de `inputtext`, y no puede haberla.** PrimeNG **no modela** un
font-size de raíz para este componente: `--p-inputtext-font-size` sale «sin definir» en su deploy,
y la hoja de PrimeNG dice `.p-inputtext { font-size: 1rem }`, o sea 16. El 14 que ves llega porque
**nuestro bloque global lo pisa**:

```css
.p-component.p-inputtext { font-size: var(--p-app-typography-md-font-size, 0.875rem) }
```

Así que la variable que de verdad gobierna el tamaño normal es `app/typography/md/fontSize`, no una
de `inputtext`. El Kit dibuja 15. *Accionable*: atar a esa, sabiendo que cambia 15 → 14.

**3. Label y Helper Text: no hay token y no lo va a haber.** PrimeNG no los modela dentro de
`inputtext` porque no son suyos, son marcado de la app. En su deploy las etiquetas pintan a 12.
El Kit dibuja 15 y 13. *Accionable*: ninguno del lado de la conexión. Si se quiere gobernar el
texto de los formularios desde el DS hace falta **crear** ese modelo, y eso es una decisión de
diseño, no un arreglo.

**El patrón que enseña este componente**: «no está conectado» puede significar tres cosas muy
distintas (hay variable y no se usa, la variable vive en otro sitio del que crees, o no existe el
modelo), y las tres piden respuestas distintas. Contarlas juntas no sirve para nada.

---

### Select y MultiSelect: el componente está bien, lo suelto es el envoltorio

Medidos el 2026-09-05. **Son los dos mejor conectados del Kit**: 7.982 y 8.234 enlaces de color a
variables del DS y **cero enlaces remotos**, al contrario que InputText o Button.

Sus candidatos se caen casi todos al aplicar los filtros:

- **La mitad de los huecos no separa nada.** 253 en Select y 263 en MultiSelect están en capas con
  menos de dos hijos visibles. Es la trampa del Breadcrumb, ahora automatizada en la sonda.
- **Lo que queda son 12 y 14 en `Helper Text` y `Action`**, y un hueco de 7 en el envoltorio. Y
  **no existe variable para nada de eso**: las únicas de tipografía son `sm/font/size` y
  `lg/font/size`, y de separación solo `list/gap` (MultiSelect además tiene `option/gap`). No hay
  `select/gap`, ni tamaño de letra del texto de ayuda, ni de la acción.

Es el mismo patrón que la parte 3 del InputText: **lo que está suelto es el envoltorio del campo de
formulario** (etiqueta, texto de ayuda, la separación entre ellos), que PrimeNG no modela porque no
es suyo. No hay nada que conectar sin crear antes el modelo.

*Sin verificar*: que las 228 capas con hueco 7 sean efectivamente las variantes del envoltorio. El
nombre y la estructura lo sugieren, pero el puente de Figma se cayó antes de poder abrir una. No
cambia el veredicto, porque la variable no existe en ninguno de los dos casos.

---

## Peticiones abiertas al consumidor

Algunos hallazgos no se arreglan aquí: el eslabón que falla es el código del consumidor. Se anotan
en el mapa con el accionable `PETICIÓN AL CONSUMIDOR` y el texto completo vive aquí, para que no
haya que reconstruirlo cada vez que se retoma.

> **Esto es una NOTA, no una tarea abierta** (decidido por Rafa el 2026-09-04). Queda escrito por
> si algún día se retoma; nadie lo está esperando y no bloquea nada. Si alguien decide mandarlo,
> el texto ya está listo.

### El modal a medida lee su propio canal, no el tema

**Medido dos veces con el modal ABIERTO en su página** (2026-09-03 y 2026-09-04): el tema publica
**26 tokens** `--p-component-custommodal-*` y **no los lee nadie, cero de 26**. El componente se
pinta por su propio canal, `--sc-custom-modal-*`, que no existe en este repo: en las hojas
cargadas se leen 8 de esas variables y solo 4 están definidas ahí, así que el resto llega por
respaldo o por una hoja que no se carga en esa ruta.

**Por qué importa**: hay dos modelos para el mismo componente y el del tema está muerto. Si diseño
cambia el modal en Figma y se manda un tema nuevo, **no cambia nada**, y no salta ningún aviso: el
modal se sigue viendo bien, con los valores de antes. Es el caso del Tag al revés: allí había
valores a mano donde tocaba una variable; aquí hay un modelo entero que nadie lee.

**Lo que se pide**: que las reglas del componente lean el token del tema en vez de la variable
propia. En la práctica es cambiar el nombre de la variable en su hoja de estilos:

```css
/* antes */
.custom-modal__header { background: var(--sc-custom-modal-header-bg); }

/* después */
.custom-modal__header { background: var(--p-component-custommodal-header-background); }
```

**Lo que hay que preguntarles antes de que toquen nada**:

1. ¿Las 53 `--sc-custom-modal-*` las usa algo más aparte del modal?
2. Son 53 contra 27: ¿las 26 que sobran son composiciones, o al tema le falta modelo?
3. ¿Prefieren que el cambio se prepare desde aquí como PR contra su repo?

**Lo que NO se pide**: tocar Figma ni el tema. Ese lado ya está bien; falta el último eslabón, que
es suyo.

**Por qué no se borra el grupo de Figma**: la colección está publicada, y antes de quitar 27
variables habría que barrer el fichero entero buscando consumidores. Ruido inofensivo mientras
tanto.

---

## La rutina por tema

**Al recibir un zip del plugin**, antes de pasarlo:

1. **Ningún token puede salir a `0`.** El respaldo de `var()` NO entra si la variable está
   definida, así que un `0` gana. Un zip de septiembre llevaba dos tallas de tipografía a `0` y
   eso dejó los títulos de card y de diálogo con altura cero en su web.
2. **La base de los rem.** El DS diseña en base 14 y el plugin exporta el número tal cual. A raíz
   16, la de su aplicación, toda la geometría sale un 14,3 % más grande. El repo lo normaliza al
   importar; el consumidor que recibe solo el zip, no.
3. **Diff contra el zip anterior**, que es lo que contesta «qué cambia con este tema».

Las tres son comprobables por script y **ese script todavía no está escrito**. Hoy se hacen a mano
al preparar el envío. No entra en `verify`: es manual y con argumento.

**Después de que lo instalen**, dos sondas sobre su deploy: si alguna regla suya redeclara un token
`--p-<componente>-*`, y el control de siempre. Si la sonda no encuentra el Tag, la sonda está mal.

**Resultado del 2026-09-05, sobre las 21 rutas de su showcase: CERO overrides y CERO valores de
diseño a mano.** Ninguna hoja suya redeclara un token del tema, y ninguna regla suya sobre una
clase `.p-*` fija un color, un tamaño o un radio con un literal. Lo único que tocan a mano son
propiedades de maquetación (`min-width: 0`, `padding: 0`, `overflow: hidden`), que no son tokens.

Este resultado corrige una medida anterior mía que decía «el Tag tiene 13 overrides». Era falsa:
esas reglas **leen** `var(--p-tag-icon-size)`, no lo redeclaran. La sonda de entonces contaba
menciones y no distinguía declarar de consumir. La de ahora lo separa, y se valida con un control:
sobre las hojas del tema encuentra 1.450 declaraciones, y sobre las suyas, ninguna. **Sin ese
control, un cero no vale nada.**
