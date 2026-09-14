# Figma — lo que falta por tocar allí, una cosa a la vez

> **Para qué es este fichero.** Hay cambios que el código no puede cerrar solo: viven en el fichero
> de Figma del DS y los hace una persona. Antes estaban repartidos por las bandejas de los hand-offs
> y se leían como «nota al margen». Aquí están juntos, **cada uno verificado contra el fichero real**
> y con lo que hace falta para atacarlo sin releer media sesión.
>
> **Fichero**: «Smart-Contact Design System» — `khNq9dJKNi13pNllrqm6dx` (110 páginas).
>
> **Cómo se mantiene.** Lo cerrado se marca aquí, con la fecha. Lo nuevo entra aquí y **no** en la
> bandeja del hand-off: una cosa que solo se puede hacer en Figma no es trabajo de la próxima sesión.
>
> ⚠️ **Verificado el 2026-09-12** leyendo el fichero con el server de Figma. Cada ficha dice de dónde
> sale su evidencia; si una dice «sin verificar», es que se arrastra de un hand-off y hay que
> comprobarla antes de actuar.

---

## 1 · Publicar la librería

**Estado:** pendiente · **Dónde:** Figma, panel *Assets* → icono de librerías → *Publicar* · **Esfuerzo:** un minuto

Los cambios del 2026-09-13 (el título de `Section` a `h3` y el borrado de `app/typography/xl|xxl`)
están hechos en el fichero del DS, pero **los ficheros que usan la librería no los ven hasta que se
publica**. Publicarla es un paso de persona: no lo hace ninguna herramienta desde aquí.

**Cómo sabes que está hecho:** en un fichero que tenga activada la librería del DS, el aviso de
actualizaciones pendientes desaparece. (Qué ficheros la tienen activada no lo he comprobado.)

---

## 2 · Lo que Config cambió en código y Figma aún no sabe (2026-09-13)

**Estado:** pendiente de decidir, una a una: bajarla al Kit o revertirla en código · **Sin
verificar** contra el fichero del DS: sale de la sesión de `/config/aed/*`, medido en código.

- **Pastillas (`sc-tag`, `sc-chip`) sin punto y a 600.** Decisión de Rafa: en una pastilla tintada el
  color ya está en el fondo y en el texto. El Kit sigue dibujando el punto y el peso 500.
- **`--sc-text-heading`** (slate-800 en claro, slate-0 en oscuro) para títulos de sección: existe
  solo en código. En Figma haría falta la variable y atarla al título.
- **Tarjetas de opción (`sc-option-cards`)** en Servicio en lugar del modal de Figma `103:2718`.
- **Etiqueta IFTA (dentro del campo) a 600**, y el **interruptor a la derecha** en la lista de
  ajustes de Grupos (a la izquierda en General y Agentes: va donde van los controles de su patrón).

---

## 3 · La cabecera y el aire de página se compactaron en código (2026-09-14)

**Estado:** pendiente de bajarlo al fichero · **Sin verificar** contra el fichero del DS: medido en
código, en builds estáticos del Supervisor a 1440.

- **TopBar a 56 de alto** (`scale/4`; Figma `12277-4705` dibuja 72, con 20 arriba y abajo): el mismo token que
  el bloque del logo de la barra lateral, para que las dos rayas casen. Avatar a `--sc-cmp-avatar-width` (28) y la
  miga sin relleno propio (DD-90).
- **Página:** barra → título 17,5 (`scale/1-25`), lados 28 (`scale/2`), título → contenido 14 (`scale/1`)
  y buscador → tabla 12,25 (`scale/0-875`).

---

## 4 · Las medidas de PrimeOne que Aura 3 cambió: el código ya sigue a Aura (2026-09-14)

**Estado:** pendiente de bajarlo al fichero · **Sin verificar** contra el fichero del DS: sale del export
del Kit en `main` (`kit-export-dtcg.json`) y está medido en builds estáticos (DD-97; vista previa en
`~/Documents/Claude/2026-09 aura-marca/figma-se-alinea.html`).

PrimeOne 4.0.0 dibujó el Aura de 2024 y Aura 3 cambió 55 de esas medidas. El código ya lleva el valor de
Aura con el **paso de escala con el nombre del rem de Aura** (como DD-81), que es una variable que ya
existe. Mientras Figma no cambie, `PENDIENTE_FIGMA` (`scripts/sizing-map.mjs`) impide que un export
devuelva el código a PrimeOne.

**Cómo se hace, sin crear primitivos:** cada variable de la tabla pasa a apuntar (alias) al paso de la
columna «Aura». Las tres marcadas «separar» son hoy una sola variable donde Aura pone dos valores: se
crean `…/y` y `…/x` como en `divider/horizontal/content/padding`, cada una con alias a un paso que ya
existe, y la capa del maestro se ata a las dos.

**Cómo sabes que está hecho:** tras exportar, el robot pasa `token-parity` y avisa «pendiente(s) que el
export YA dice igual: quita la fila». Se quitan esas filas de `PENDIENTE_FIGMA`. En las tres separadas,
además, las filas pasan a leer `…padding.y` y `…padding.x` en `exp`.

| Colección | Variable | Hoy en el Kit | Aura |
|---|---|---|---|
| Semantic Common | `list/option/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `list/option/group/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `navigation/item/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `navigation/submenu/label/padding/y` | scale/0-5 | scale/0-25 |
| Component Common | `message/content/sm/padding/y` | scale/0-375 | scale/0-25 |
| Semantic Common | `list/option/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `list/option/group/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/item/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/submenu/label/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `tooltip/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `message/content/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `radiobutton/icon/size` | scale/0-75 | scale/0-625 |
| Component Common | `badge/font/size` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/submenu/icon/size` | scale/0-875 | scale/0-75 |
| Component Common | `message/content/lg/padding/x` | scale/0-875 | scale/0-75 |
| Component Common | `radiobutton/icon/lg/size` | scale/1 | scale/0-75 |
| Component Common | `badge/lg/font/size` | scale/0-875 | scale/0-75 |
| Component Common | `tooltip/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `tag/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `message/content/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `divider/vertical/content/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `divider/horizontal/content/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `divider/vertical/padding` | 0 | **separar en `divider/vertical/padding/y` → scale/0-375 y `divider/vertical/padding/x` → 0** |
| Component Common | `badge/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `paginator/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `message/content/lg/padding/y` | scale/0-625 | scale/0-5 |
| Component Common | `message/content/sm/padding/x` | scale/0-625 | scale/0-5 |
| Component Common | `badge/sm/font/size` | scale/0-625 | scale/0-5 |
| Component Common | `divider/horizontal/padding` | 0 | **separar en `divider/horizontal/padding/y` → 0 y `divider/horizontal/padding/x` → scale/0-875** |
| Component Common | `paginator/padding/x` | scale/1 | scale/0-875 |
| Component Common | `inputgroup/addon/padding` | scale/0-5 | **separar en `inputgroup/addon/padding/y` → 0 y `inputgroup/addon/padding/x` → scale/0-5** |
| Component Common | `panel/toggleable/header/padding/x` | scale/1-125 | scale/1 |
| Component Common | `panel/header/padding` | scale/1-125 | scale/1 |
| Component Common | `popover/arrow/offset` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/width` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/height` | scale/1-25 | scale/1-125 |
| Component Common | `progressbar/height` | scale/1-25 | scale/1-125 |
| Component Common | `card/body/padding` | scale/1-25 | scale/1-125 |
| Component Common | `badge/sm/min/width` | scale/1-25 | scale/1-125 |
| Component Common | `badge/sm/height` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/lg/width` | scale/1-5 | scale/1-25 |
| Component Common | `radiobutton/lg/height` | scale/1-5 | scale/1-25 |
| Component Common | `badge/min/width` | scale/1-5 | scale/1-25 |
| Component Common | `badge/height` | scale/1-5 | scale/1-25 |
| Component Common | `avatar/lg/font/size` | scale/1-5 | scale/1-25 |
| Component Common | `avatar/lg/icon/size` | scale/1-5 | scale/1-25 |
| Component Common | `confirmdialog/icon/size` | scale/2 | scale/1-5 |
| Component Common | `badge/lg/min/width` | scale/1-75 | scale/1-5 |
| Component Common | `badge/lg/height` | scale/1-75 | scale/1-5 |
| Component Common | `inputgroup/addon/min/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/jump/to/page/input/max/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/nav/button/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/nav/button/height` | scale/2-5 | scale/2-25 |
| Component Common | `avatar/xl/group/offset` | scale/neg-1-5 | scale/neg-1-25 |
| Component Common | `avatar/group/offset` | scale/neg-0-75 | scale/neg-0-625 |

**Tres cosas más de la misma tanda:**

- **Desenfoque del toast en claro:** `toast/blur` en modo claro vale 1,5 y en oscuro 10; Aura pone 10 en
  los dos. El código ya usa 10 en claro. En Figma: el modo claro al mismo valor que el oscuro.
- **Paneles pequeño y grande de select y multiselect:** el código ya no les da relleno ni letra propios a
  la cabecera, la lista y las opciones (siguen a `list/option/*`); solo el buscador conserva la talla del
  trigger. Si algún maestro de panel sm/lg dibuja otro relleno, se ata a `list/option/padding/*`.
- **Se quedan como están, a propósito:** `toast/width` (`scale/25`) y `toggleswitch/height` (`scale/1-5`).
  Aura pide 22 rem y 1,375 rem, que no existen en la escala; el paso existente más cercano es el que ya
  tienen (en el interruptor, 1-25 y 1-5 quedan a la misma distancia y se conserva el actual).

---

## 5 · El índice lateral de las pantallas con rail no es componente de la librería (2026-09-14)

**Estado:** pendiente · **Verificado** con el server de Figma el 2026-09-14: en el fichero del DS no hay
ningún componente de índice lateral (revisados sus 228 componentes y conjuntos); en el fichero Supervisor
el único dibujo es un MARCO, no una instancia: `393:12565`, «sc-form-section-nav (pure-sc)», 196 de
ancho, dentro de la maqueta de Contact Center.

En código es `sc-form-section-nav` con `[flush]`, y desde el 2026-09-14 lo usan igual Contact Center y
las fichas de agente, grupo y usuario (con la ficha de identidad encima). Mientras sea un marco suelto,
cada maqueta nueva lo vuelve a dibujar a mano y puede salir distinto: es justo lo que pasó con la
generación anterior (`12277:4818`, panel gris con el icono en su cajita).

**Cómo se hace:** convertir el marco `393:12565` en componente del DS con dos estados de item (reposo y
activo: fondo `--sc-bg-hover`, texto en semibold), el icono de 20 y la etiqueta en `Body/body-regular`.
Opcional, la ficha de encima (avatar 36, nombre en `Body/body-semibold`, dato en `Caption/caption-regular`).

**Cómo sabes que está hecho:** la maqueta de Contact Center usa una instancia del componente en lugar
del marco.

---

## Cerrado

- ~~**El título del componente `Section` a `Heading/h3-semibold`**~~ → **HECHO el 2026-09-13**
  (DD-75). Eran **4 capas maestras, no ~35**: la cifra de este fichero mezclaba dos componentes. Las
  del conjunto `Section` son el título de sección y pasaron a `h3`; las 25 de `.Subsection` (15
  maestras y 10 copias) son el segundo nivel y se quedan en `Body/body-semibold`, como en código.
  Verificado leyendo cada capa después y con captura del componente.
- ~~**¿18 o 20?**~~ → **18**, decidido por Rafa el 2026-09-13. Se queda `h3`; no se crea un estilo de 20.
- ~~**`app/typography/xl` y `xxl`**~~ → **BORRADAS el 2026-09-13** (DD-75). Medido antes: 0 aliases,
  0 text styles, 0 capas atadas en las 110 páginas (26.498 textos, con control positivo) y 0 en el
  fichero de Supervisor. Sus valores eran alias: `xl` = size 400 / height 300 y `xxl` = size 450 /
  height 450, en la colección `Custom`, por si hubiera que recrearlas. El export y el mapa de
  cobertura del repo se actualizaron en el mismo cambio, y el CSS generado no se movió.
- ~~**`12/20` no es ningún estilo**~~ → **no era de Figma**, se arregló en código el 2026-09-13
  (DD-75): 96 textos pasan a 12/18 en 11 sitios. **Excepción deliberada: `sc-chip`**, cuyo 20 sí
  está atado en Figma.
- ~~**Las descripciones de los text styles están corridas un peldaño**~~ → **YA NO, verificado el
  2026-09-12.** El hand-off decía que `h1-semibold` reclamaba ser «el texto más grande», que
  `h2-regular` llevaba una descripción de body y que `h1-regular` y `h3-regular` estaban vacías.
  **Ninguna de las cuatro es cierta hoy**: las doce tienen su descripción correcta, con sus medidas.
  Alguien lo arregló entre medias y la bandeja se quedó rancia. Es el motivo de que este fichero
  exija verificar antes de actuar.

---

## Nota de herramienta, que cambia lo que se puede hacer desde aquí

El hand-off da por **bloqueado por herramienta** el 1:1 web↔Figma de chip · tag · toast, porque el
bridge de diario (`figma-console`) se engancha al arrancar la sesión y no se puede añadir a mitad.

**Eso sigue siendo cierto para ESE server, pero no para todos.** El 2026-09-12 se leyó este fichero
—páginas, text styles, variables y las capas de un componente— con el server de la nube
(`plugin:figma:figma`), que además **escribe** por la API de plugins. Si el 1:1 volviera a intentarse,
ese es el camino que hay que probar antes de declararlo bloqueado otra vez.
