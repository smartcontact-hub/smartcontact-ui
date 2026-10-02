# Cuscare: Match en las opciones de tipo de solicitud

Decisión de producto (2026-10-02).

El panel presenta «Clasificado por» y una «Y» fija entre IA y Agente, para expresar
que activar el segundo origen añade una condición AND. Los toggles empiezan desactivados y se pueden activar de forma independiente.
Cuando ambos están activos, cada opción seleccionada del listado de tipos muestra un `sc-tag` neutro
con el texto «Match». Describe la condición AND entre orígenes: el mismo tipo debe estar
asignado por IA y por Agente. No afirma que todos los tickets del catálogo ya coincidan,
ni significa validación o corrección de la clasificación. No es un tercer control.

Se retira la ayuda dinámica bajo los toggles y su espacio reservado. El tag usa la
severidad `secondary` del DS, sin icono de éxito. Su espacio en cada opción se conserva
al desactivarlo para no alterar la altura de las filas ni el salto de línea del texto.

La lógica de filtrado no cambia: solo actúa al seleccionar tipos; exige todos los
orígenes activados para un mismo tipo y mantiene la combinación existente entre tipos.
Las opciones, el buscador, las casillas y el teclado siguen siendo los de `p-listbox`,
con su plantilla pública `#item`. Desmarcar una opción retira su Match; seleccionar todas
aplica la misma regla a todas. Activar orígenes sin tipos no activa la limpieza del filtro.

Implementación: `projects/cuscare/src/app/features/tickets/request-type-filter.component.ts`.
Referencia del DS: `projects/sc-docs/src/app/pages/components/tag/`.

El disparador cerrado muestra «—» sin tipos y «1 tipo» / «N tipos» al filtrar, sin
etiquetas de origen ni check de Match. Conserva el borde activo, el chevron y la acción
de limpiar. Su descripción accesible incluye el contador, los orígenes y todos los
tipos seleccionados. El inglés usa «Classified by», «AND» y «1 type» / «N types».

## Ajuste tras revisión de producto

La fase 1 cubre el filtro y la diferenciación de origen por color en la tabla. La
presentación avanzada de acuerdos y la evolución de clasificaciones quedan para
fase 2. La retirada de la agrupación actual de la tabla queda pendiente de validación
local; no se introduce un contador «+N». El ancho de la columna queda acotado entre 260 y 320 px; su contrato responsive y
el ciclo de vida del filtro se especifican en [el handoff](cuscare-filters-table-handoff.md).

Por alcance del prototipo, los colores de origen son locales: IA usa fondo `#d2d9e3`
y texto `#1b273d`; Agente usa fondo `#d5e6ff` y texto `#0a3ba0`. Se conservan los
colores medidos, sin ampliar el contrato del DS ni crear variables globales. Esta
excepción corresponde a la decisión de producto para fase 1 (2026-10-02).

Regresión: `e2e/cuscare/request-type-match.spec.ts` cubre estado inicial, AND,
selección individual, selección total, desmarcado y limpieza. La versión local fue validada y su publicación a main autorizada el 2026-10-02.
