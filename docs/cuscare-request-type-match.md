# Cuscare: la regla del filtro de tipo de solicitud

Decisión de producto y desarrollo (2026-10-06), que sustituye a la del 2026-10-02.

## La regla

**IA (alguno de los tipos marcados) Y Agente (alguno de los tipos marcados).** Dentro de cada
origen, O; entre orígenes, Y. No hace falta que los dos orígenes pongan el MISMO tipo.

Con IA y Agente encendidos y Baja y Devolución marcados:

| IA | Agente | ¿Sale? |
| --- | --- | --- |
| Baja, Devolución | Spam | No: el agente no puso ninguno de los dos |
| Baja | Baja, Devolución | Sí |
| Devolución | Baja | Sí: cada uno puso uno, aunque no el mismo |
| Legal | Devolución | No: la IA no puso ninguno de los dos |

Con un solo origen encendido, sale lo que puso ese origen, diga lo que diga el otro.
«Vacío» cuenta como un tipo más: «IA (Spam o Vacío)» = la IA puso Spam o no puso nada.

**Sin origen no se filtra.** La lista de tipos está desactivada hasta que se enciende IA,
Agente o los dos. Si se apaga el último origen con tipos marcados, los tipos se conservan
pero dejan de filtrar (el disparador vuelve a «—») hasta que se encienda otro origen; así
pasar de IA a Agente no pierde la selección. Cerrar el panel en ese estado vuelve al inicio.

La «Y» fija entre IA y Agente del panel describe esta regla tal cual.

## Qué cambió respecto al 2026-10-02

La regla anterior pedía que IA y Agente pusieran el MISMO tipo («parejas»):
`(IA Baja y Agente Baja) o (IA Devolución y Agente Devolución)`. Con ella, IA Devolución con
Agente Baja no salía. Se descarta por demasiado restrictiva: en la reunión del 2026-10-06 se
eligió la regla flexible, que enseña más combinaciones y cubre el caso urgente (IA Spam, IA
Vacío) igual que cualquiera de las otras.

También se descartaron en esa reunión: el análisis inicial de desarrollo, con Y entre los
tipos (el origen tenía que poner TODOS los marcados), y la variante en dos columnas, una por
origen.

Por eso:

- **Se retira el «Match» de las opciones del panel.** Afirmaba la condición de pareja, que
  ya no es la regla.
- **La marca de coincidencia de la tabla se queda** (los dos tags del mismo tipo con el
  check). Es de fase 2, pero se conserva en el prototipo: refuerza dónde coinciden IA y
  agente cuando el usuario quiere verlo. No forma parte del criterio del filtro.
- El aspecto del panel no cambia: manda el de Figma.

## Implementación

Lógica: `projects/cuscare/src/app/features/tickets/request-type.ts` (`matchesRequestType`).
Panel: `request-type-filter.component.ts`. La semilla reparte las discrepancias entre todos
los tipos, y la fila 2050493 es el caso de la pizarra (IA Devolución, Agente Baja).

El disparador cerrado muestra «—» sin filtro y «1 tipo» / «N tipos» al filtrar. Su
descripción accesible incluye el contador, los orígenes y todos los tipos seleccionados.
El inglés usa «Classified by», «AND» y «1 type» / «N types».

## Ajuste tras revisión de producto (2026-10-02, sigue vigente)

La fase 1 cubre el filtro y la diferenciación de origen por color en la tabla. La
presentación avanzada de acuerdos y la evolución de clasificaciones quedan para fase 2. No se
introduce un contador «+N». El ancho de la columna queda acotado entre 260 y 320 px; su
contrato responsive y el ciclo de vida del filtro se especifican en
[el handoff](cuscare-filters-table-handoff.md).

Por alcance del prototipo, los colores de origen son locales: IA usa fondo `#d2d9e3` y texto
`#1b273d`; Agente usa fondo `#d5e6ff` y texto `#0a3ba0`. Se conservan los colores medidos, sin
ampliar el contrato del DS ni crear variables globales.

Regresión: `e2e/cuscare/request-type-match.spec.ts` cubre la lista desactivada sin origen, la
regla con los dos orígenes (incluida la discrepancia), un solo origen y apagar el último
origen con tipos marcados.
