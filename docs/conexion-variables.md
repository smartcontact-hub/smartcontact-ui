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
  otro componente, o una de la librería remota. El cruce la da por buena porque hay enlace. Es el
  defecto dominante: 9 de las 12 correcciones de la primera pasada eran de este tipo, no variables
  sueltas.
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

**El guard todavía NO está en `npm run verify`.** Entra cuando el mapa esté cerrado, porque a
partir de ese momento cualquier commit que lo deje viejo se pone rojo. Añadir un paso a `verify`
arrastra tres cosas más: el README tiene que nombrarlo, el test de paridad
[`scripts/ci-preflight-parity.mjs`](../scripts/ci-preflight-parity.mjs) exige que el preflight y
`ci.yml` no diverjan, y el hook de pre-push lo ejecuta.

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

**12 variables atadas** en la primera pasada, ninguna con cambio visual, y **9 de ellas estaban mal
apuntadas**, no sueltas.

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

## Peticiones abiertas al consumidor

Algunos hallazgos no se arreglan aquí: el eslabón que falla es el código del consumidor. Se anotan
en el mapa con el accionable `PETICIÓN AL CONSUMIDOR` y el texto completo vive aquí, para que no
haya que reconstruirlo cada vez que se retoma.

### El modal a medida lee su propio canal, no el tema

**Medido** con el modal ABIERTO en su página: el tema publica **27 tokens**
`--p-component-custommodal-*` y **no se usa ninguno**. El componente se pinta con **53 variables**
`--sc-custom-modal-*` de su paquete de estilos, que no existen en este repo.

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
`--p-<componente>-*` (hoy solo el Tag, con 13), y el control de siempre. Si la sonda no encuentra
el Tag, la sonda está mal.
