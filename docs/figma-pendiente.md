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

## 1 · El título del componente `Section` va a `Heading/h3-semibold`

**Estado:** pendiente · **Dónde:** página `❖ Section` · **Esfuerzo:** un rato, son ~35 capas

Las capas llamadas `Title` de ese componente usan hoy **`Body/body-semibold` (14/20)**. Tienen que
pasar a **`Heading/h3-semibold` (18/24)**.

**Por qué.** El título medía **exactamente lo mismo que el texto que titulaba** — 14/20/600 contra
14/21/400, medido en `config/aed/agentes`. Solo el peso los separaba, así que no hacía jerarquía. El
código ya lo cambió (DD-74) y hasta que Figma lo siga, los dos no dicen lo mismo.

**Lo que lo confirma, y es lo bonito:** la descripción que `Heading/h3-semibold` tiene EN ESTE FICHERO
dice *«Encabezado pequeño (18/24): bloques, tarjetas, formularios»*. O sea que el estilo ya declaraba
que su sitio era este; lo que faltaba era aplicarlo.

**Cómo sabes que está hecho:** las capas `Title` de la página `❖ Section` reportan
`Heading/h3-semibold`. Después, el 1:1 de `sc-section-card` deja de cantar.

*Evidencia: leído el 2026-09-12 — 41 textos en la página, ~35 `Title` a 14/20 Semi Bold.*

---

## 2 · Decidir si el título es 18 o 20 (y si es 20, crear el estilo)

**Estado:** decisión de Rafa · **Dónde:** página `ª Typography` · **Esfuerzo:** 5 min si es 18

Rafa pidió los títulos **a 20px**. El código puso **18** porque 20 no lo nombra ningún estilo de
texto: los doce que hay miden 64, 48, 24, 18, 14 y 12.

**El peldaño de 20 SÍ existe** como variable (`primitive/typography/font/size/450 = 20`); lo que no
existe es un text style que lo use.

- **Si vale 18** → no hay nada que hacer aquí; la ficha 1 lo deja cerrado.
- **Si quieres 20 de verdad** → hay que crear un text style (p. ej. `Heading/h2-5-semibold`) atado a
  `size/450`, y entonces el código lo sigue. **No al revés**: fijar 20 en el CSS sin estilo detrás
  deja esa tipografía fuera de la rampa y sin seguir un remapeo de Figma.

*Evidencia: los 12 text styles y las 9 variables de tamaño, leídos el 2026-09-12.*

---

## 3 · `app/typography/xl` y `xxl`: adoptarlos o quitarlos

**Estado:** decisión de Rafa · **Dónde:** colección de variables `App` · **Esfuerzo:** corto

Existen las cuatro variables (`xl/fontSize`, `xl/lineHeight`, `xxl/fontSize`, `xxl/lineHeight`) y
**no las consume nadie**: 0 nodos y 0 text styles. En el mapa de cobertura del repo están como
`not-consumed`, que es la verdad, pero una variable que nadie usa es ruido en el selector de todos.

- **Quitarlas** → el mapa de cobertura deja de tener una excepción.
- **Adoptarlas** → van a `sc-preset/extend.ts` + `APP_TYPOGRAPHY_CONTRACT` y suben de bucket.

*Evidencia: las 16 variables `app/*` leídas el 2026-09-12; el «0 nodos, 0 estilos» viene del
hand-off de s42 y **no lo he vuelto a medir yo**.*

---

## 4 · `12/20` no es ningún estilo: decidir cuál es

**Estado:** decisión de Rafa · **Esfuerzo:** corto

Sale cuando una clase va en un contenedor y el descendiente declara solo el tamaño: pastillas de
estado de repositorios, cabeceras de grupos asignados, contadores de pestaña. Queda 12px con
interlineado 20, y **ninguno de los doce estilos mide eso** (caption es 12/18, body es 14/20).

- **Un estilo propio para pastilla** (12/20), o
- **interlineado explícito** en esos sitios, aceptando que no es un text style.

*Evidencia: apuntado por el barrido de estilos de texto del 2026-09-11. **Sin verificar por mí.***

---

## Cerrado

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
