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

## Los nueve veredictos

Seis salen solos de cruzar las dos preguntas:

| Veredicto | ¿La usa una capa? | ¿La lee PrimeNG? | Qué significa |
|---|---|---|---|
| **conectada** | sí | sí | La cadena entera está enganchada |
| **Figma no la usa** | no | sí | El valor viaja igual. Lo que puede desviarse es el dibujo |
| **espejismo** | sí | no | Se ve bien en el Kit y no llega a la pantalla |
| **muerta** | no | no | Nadie la usa. Ocupa sitio en el modelo |
| **solo web** | — | sí | El tema lo publica y Figma no lo modela: sombras, estilos de línea, duraciones, paleta cruda |
| **solo Figma** | sí | — | Auxiliar de dibujo, sin token detrás |

Los otros tres **no los ve el cruce**, porque hace falta abrir el nodo o el CSS. Solo los pone una
revisión a mano, y son los que más cuestan de encontrar:

- **mal apuntada** — sí está atada, pero **a la variable equivocada**: la del estado vecino, la de
  otro componente, o una de la librería remota. El cruce la da por buena porque hay enlace. Es el
  defecto dominante: 9 de las 12 correcciones de la primera pasada eran de este tipo, no variables
  sueltas.
- **muerta en el tema** — el tema publica el token y el componente lee otro canal. Hay dos modelos
  para lo mismo y el del tema no manda.
- **conectada por el primitivo** — dos variables con nombres distintos apuntan al mismo primitivo,
  así que hoy coinciden. No está roto; el riesgo es que se mueva una y no la otra.

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

## Estado del 2026-09-03

816 filas, 18 componentes, medidas contra el Kit de Figma y el CSS que sirve
`ui.smart-contact.com`.

| Veredicto | Nº |
|---|---|
| conectada | 636 |
| Figma no la usa | 88 |
| solo web | 79 |
| espejismo | 3 |
| muerta | 3 |
| solo Figma | 2 |
| mal apuntada | 2 |
| muerta en el tema | 2 |
| conectada por el primitivo | 1 |

De las 88 «Figma no la usa»: 34 son el anillo de foco (no atables), 41 llevan `FALTA DIBUJARLO` (el
Kit no dibuja esa variante o ese estado) y el resto se cerraron abriendo el nodo.

**12 variables atadas** en la primera pasada, ninguna con cambio visual, y **9 de ellas estaban mal
apuntadas**, no sueltas. **8 filas esperan decisión** porque atarlas cambiaría el dibujo, o porque
hay dos modelos para lo mismo. El detalle de cada una, con su capa y su selector, está en la página
y en el CSV.

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
