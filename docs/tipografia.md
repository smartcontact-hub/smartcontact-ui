# Tipografía, de Figma hasta el navegador del consumidor

**Source of truth** de cómo viaja la tipografía end-to-end, y en particular del caso que
`consumer-onboarding.md` no cubre: un **equipo externo con su propio código** que no instala
nuestro paquete npm y solo recibe el **export del tema** (zip del plugin de Figma).

Escrito el 2026-09-02 tras cerrar SISMAC-4074. Todo lo que hay aquí está **medido**, no
deducido; cada afirmación lleva su método al lado.

**Las dos fuentes del estudio**, que se corroboran entre sí:

1. **El DOM de `ui.smart-contact.com`** — `getComputedStyle` componente a componente, y las
   reglas CSS leídas de `document.styleSheets` para saber qué hoja aplica cada valor.
2. **El repo del consumidor**, [`smart-contact-ui-lab`](https://gitvoz.jmeservicios.com/desarrollovoz/smart-contact-ui-lab)
   (GitLab privado, requiere sesión) — su README declara qué paquetes consume y cómo los
   carga.

---

## 1. El mapa: qué propiedad viaja por qué canal

Medido sobre `ui.smart-contact.com` (entorno del consumidor externo) el 2026-09-02, contando
además en el export del tema cuántos componentes declaran cada propiedad.

| Propiedad | La declara el tema | Quién la aplica de verdad | ¿Llega sola? |
| --- | --- | --- | --- |
| `fontFamily` | **0 componentes** | el `body` del consumidor, y los componentes con `font-family: inherit` | sí, pero ojo con el canal (ver abajo) |
| `fontSize` | 21 componentes | el propio tema | sí |
| `fontWeight` | 27 componentes | el propio tema | sí |
| `lineHeight` | **0 componentes** | **nadie** | **NO** |
| `letterSpacing` | 0 componentes | nadie | no se usa |

**Método**: `grep -rl "<prop>" ts/ | grep -v extend.ts | wc -l` sobre el export descomprimido,
más `getComputedStyle` en la web para confirmar el valor aplicado.

**Cuidado con el canal de la familia, que es el punto donde es fácil equivocarse.** En el DOM del
consumidor conviven dos declaraciones:

```css
:root { font-family: var(--sc-font-family-primary); }              /* nuestro */
body  { font-family: var(--sc-font-family-base, Arial, sans-serif); }  /* suyo */
```

`--sc-font-family-primary` es nuestro y sale de `01-primitive.css`. **`--sc-font-family-base` no
existe en ningún `projects/**` de este repo**: es un token del consumidor. El resultado computado
es Inter y es correcto, pero la cadena pasa por un token suyo, así que **cambiar nuestra familia no
garantiza que su `body` cambie**.

Lo cazó `verify` al escribir este documento: el gate de coherencia doc-repo comprobó que el token
citado no existía en el código. Es exactamente para lo que está.

### La causa raíz del interlineado

PrimeNG **no modela `lineHeight` como token en ningún componente**. El tema publica el valor
correcto como variable CSS (`--p-app-typography-md-line-height` y compañía), pero ninguna hoja
de PrimeNG lo lee, así que el navegador acaba usando su `normal` heredado.

No es un fallo del export ni del consumidor. Es un hueco del framework, y la única vía es
aplicarlo por CSS.

---

## 2. La escala

Las primitivas viven en la colección **`Custom`** de Figma, que es la única que el plugin
exporta (`App` **no se exporta**: si algo acaba ahí, no llega y no da ningún error).

| Paso | `font/size` | `line/height` | Ratio | Lo usa |
| --- | --- | --- | --- | --- |
| 100 | 12 | 18 | 1,50 | 15 componentes · talla `sm` |
| 200 | 14 | 20 | 1,43 | talla `md`, la base |
| 300 | 16 | 24 | 1,50 | 11 componentes · talla `lg` |
| 400 | 18 | (usa el 300) | 1,33 | títulos de card, dialog, modal · `xl` |
| 450 | 20 | 28 | 1,40 | títulos de drawer y overlay · `xxl` |
| 500 | 24 | 36 | **1,50** | estilo `Heading/h2` |
| 650 | 32 | 40 | 1,25 | sin uso |
| 800 | 48 | 58 | 1,21 | estilo `Heading/h1` |
| 900 | 64 | 78 | 1,22 | estilo `Display` |

El ratio baja al subir el tamaño, que es lo correcto. **La única anomalía es el 24/36**: un
título de 24 con 1,50 lleva el mismo aire que un párrafo, debería rondar 1,30 (24/32). Viene
copiado literal de SnowUI, que también lo tiene así. Decidido dejarlo por ahora porque no lo
usa ningún componente, solo un estilo de pantalla.

### Las cinco tallas del puente

`app/typography/{sm,md,lg,xl,xxl}/{fontSize,lineHeight}`, en `Custom`, cada una **alias** de un
paso de la escala. Son el contrato con el consumidor: cambias el paso y se mueve todo detrás.

| Talla | Apunta a | Valor |
| --- | --- | --- |
| `sm` | size 100 · height 100 | 12 / 18 |
| `md` | size 200 · height 200 | 14 / 20 |
| `lg` | size 300 · height 300 | 16 / 24 |
| `xl` | size 400 · height 300 | 18 / 24 |
| `xxl` | size 450 · height 450 | 20 / 28 |

`sm`, `md` y `lg` vienen del kit de PrimeNG, que ya traía este patrón a medias (le falta el
`lineHeight` del `md`, justo la talla base). `xl` y `xxl` los añadimos nosotros el 2026-09-02
para los títulos, que no encajaban en ninguna de las tres.

### Nomenclatura, la regla exacta

Verificada contra el export y contra las variables vivas en el navegador:

| En el tema | En el navegador |
| --- | --- |
| `app.typography.md.lineHeight` | `--p-app-typography-md-line-height` |
| `primitive.typography.font.size.400` | `--p-typography-font-size-400` |

1. Prefijo `--p-`
2. Puntos a guiones, y el camelCase se parte (`lineHeight` → `line-height`)
3. **El segmento `primitive` se omite.** Es el único que desaparece.

---

## 3. Los estilos de texto de Figma

12 estilos en carpetas, con los valores literales de SnowUI, atados a variable en las cuatro
propiedades (familia, tamaño, peso, interlineado).

```
Display/display-{regular,semibold}   64 / 78
Heading/h1-{regular,semibold}        48 / 58
Heading/h2-{regular,semibold}        24 / 36
Heading/h3-{regular,semibold}        18 / 24
Body/body-{regular,semibold}         14 / 20
Caption/caption-{regular,semibold}   12 / 18
```

**Los estilos de texto NO viajan al export.** Ningún plugin los exporta, nunca. Su equivalente
en código son las clases `.sc-*` que se entregan aparte, y esas sí hay que mantenerlas a mano
si se añade un estilo nuevo.

Restricciones de la colección `Custom` aprendidas a base de romperlas:

- **Ningún nombre puede llevar guion.** Los nombres se convierten en claves de un objeto JS
  literal, y un guion sin comillas deja el tema **sin compilar**. Pasó con `presence/wrap-up`.
  Un segmento numérico (`size/100`) sí es válido.
- Para atar el peso de un estilo de texto hace falta una variable **STRING** con el nombre de
  la fuente (`"Semi Bold"`), no el número. De ahí `font/style/*`, que convive con
  `font/weight/*` (numérica, la que consume el tema).

---

## 4. El fichero puente para el consumidor externo

`sc-typography.css`. Se carga **después** del tema y aplica lo que el tema publica pero nadie
lee. Siete reglas.

Decisiones de diseño, y el porqué:

- **Barrido sobre `.p-component`, no lista de componentes.** Una lista hay que ampliarla cada
  vez que aparece un componente nuevo. El barrido cubre los de hoy y los futuros.
- **Las variantes de tamaño van por patrón** (`[class*="-sm"]`), excluyendo badge y avatar,
  cuya altura no la manda el texto. Verificado que caza exactamente lo mismo que enumerarlas
  una a una, y que resuelve solo el hueco de `message`.
- **Solo interlineado, más una red de cinco selectores de `font-size`.** No lleva ni familia ni
  pesos, porque esos ya llegan por sus propios canales y duplicarlos solo añade riesgo de
  choque.
- **Lee variables, no valores.** Los números literales son el respaldo por si una variable no
  resuelve. Cambiar un valor en Figma y reexportar se refleja sin tocar el fichero.

---

## 5. Verificado el 2026-09-02

Estado del consumidor externo antes de aplicar el fichero, medido con `getComputedStyle`
componente a componente:

| Componente | Interlineado medido | Debe ser |
| --- | --- | --- |
| Chip | 14 / 20 | correcto |
| Toast, título | 14 / 20 | correcto |
| Tag | 12 / **24** | 12 / 18 |
| Toast, detalle | 12 / **20** | 12 / 18 |
| Breadcrumb | 14 / **14** | 14 / 20 |
| Context Menu | 14 / **14** | 14 / 20 |
| Opciones de Select y MultiSelect | 14 / **24** | 14 / 20 |

Con el fichero aplicado: los seis correctos, familia y pesos intactos, y ningún texto recortado
ni solapado en 8 páginas del showcase con todas las variantes.

### Dos falsos positivos que costaron tiempo

**El `"400px"` de los grosores no rompe nada.** El export declara los pesos con unidad
(`font.weight.regular: "400px"`) desde el primer export que conservamos, y aun así la variable
llega al navegador como `400` limpio: **PrimeNG normaliza la unidad**. Se llegó a preparar una
corrección de cuatro líneas y se retiró tras comprobarlo. Método: comparar todos los zips de
`~/Downloads/figma-theme*` contra el valor vivo de `--p-typography-font-weight-semibold`.

**El respaldo desactualizado tampoco.** El preset del consumidor arrastra un respaldo de `md`
en `1.3125rem` (21px, anterior a la unificación de DD-39), pero nunca entra, porque la variable
sí resuelve. Medido: el chip da 20, no 21.

---

## 6. Abierto

- **El 24/36.** Único paso fuera de curva. Cambiarlo a 24/32 es un valor y no afecta a ningún
  componente, solo a `Heading/h2`.
- **`Listbox`** no se pudo medir: no tiene página en el showcase del consumidor.
- **Las variables `xl` y `xxl`** se crearon después del último export, así que el nombre CSS
  que generarán (`--p-app-typography-xl-line-height`) sigue la regla de la sección 2 pero
  **está sin verificar contra un export real**. Los respaldos del fichero lo cubren mientras
  tanto. Confirmar en el próximo export.
- **Los pasos 650 (32/40) y el interlineado 450 (28)** quedaron huérfanos al pasar los estilos
  a los valores de SnowUI. No molestan, son escala disponible.
- **Los subpaths CSS de nuestros paquetes no están exportados.** El README del lab lo documenta
  como limitación: los `exports` de `@smartcontact/styles` y `@smartcontact/icons` no publican
  `styles/index.css`, así que el consumidor tiene que importar por ruta directa a
  `node_modules`. Es deuda nuestra, no suya, y afecta a cualquier consumidor externo.
