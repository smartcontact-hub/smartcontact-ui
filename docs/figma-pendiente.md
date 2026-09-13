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
