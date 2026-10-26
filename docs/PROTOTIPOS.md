# Versiones congeladas del prototipo

> **Esto es lo que se enlaza desde Jira y Confluence. La URL de producción, no.**
>
> Los seis sitios sirven `main`, así que su URL enseña siempre lo último. Un enlace a esa URL
> dentro de un ticket envejece solo: el desarrollador que lo abre semanas después ve una pantalla
> que ya no es la que su ticket especifica, y no tiene forma de saberlo.
>
> Cada fila de abajo es una foto fija: una etiqueta git que apunta a un commit exacto, y una URL
> que sirve ese build y solo ese, para siempre.

## Cómo se congela una versión

Con el trabajo ya mergeado en `main`, un comando:

```
npm run proto
```

Pregunta tres cosas (qué ticket, qué sitio, qué cubre), enseña lo que va a hacer y pide un sí.
No hay flags que aprenderse: esto se usa una vez cada entrega.

Lo que hace con ese sí: la etiqueta `proto/SISMAC-3780`, la rama `proto/sismac-3780` desde ella,
la fila de abajo, y —si dices que sí a la segunda pregunta— publica las dos referencias. Un par
de minutos después responde `https://proto-sismac-3780.sc-supervisor.pages.dev`, y **ésa** es la
que se pega en Jira y en Confluence.

Publicar es inmediato: el hook de pre-push reconoce que un push de `proto/*` sube punteros a un
commit que ya está en `main` (o sea, que ya pasó su preflight y su CI) y no repite la cadena. Lo
comprueba, no se fía: si el commit no está en `main`, corre el gate entero como con cualquier otro
push.

La tabla queda como cambio sin guardar: entra en el siguiente PR.

**La rama congelada no se toca nunca más.** No se rebasa, no se actualiza y no se mergea: por eso
no da conflictos ni hay que mantenerla. Si algún día estorba, se borra y la etiqueta sigue ahí,
que es el registro que de verdad importa.

**Salvo que se pida actualizarla** (pasó el 2026-10-19 con 4058, 4062 y 4064, para que el ticket no
cambie de enlace): con el cambio ya en `main`, la rama AVANZA a ese commit de `main` (el congelado
anterior es su antepasado, así que no se reescribe nada) y la etiqueta se mueve con ella. La fila
cambia la fecha y dice de qué commit venía. El hook de pre-push lo deja pasar sin la cadena, porque
el commit ya está en `main`.

`npm run proto:check` corre en `verify` y no deja que esta tabla mienta: cada fila necesita su
etiqueta, y cada etiqueta `proto/*` su fila.

## Qué NO se hace

- **Apuntar el proyecto de Cloudflare a una rama de feature.** El sitio se queda huérfano en
  cuanto esa rama se borra al mergear. Pasó con `feat/cuscare` y otra vez con `agent-mini`. La
  *production branch* de los seis proyectos se queda en `main`.
- **Mantener viva una rama por entrega.** Habría que rebasarla y decidir qué entra, para siempre.
  Congelada no hace falta tocarla nunca.
- **Borrar la etiqueta al cerrar el ticket.** La etiqueta pesa nada y es lo único que sobrevive a
  cualquier limpieza de ramas.

## Versiones

| Ticket | Fecha | App | Etiqueta | URL congelada | Qué cubre |
| --- | --- | --- | --- | --- | --- |
<!-- proto:freeze inserta aquí, más reciente primero -->
| SISMAC-4058 | 2026-10-26 | supervisor | `proto/SISMAC-4058` | [proto-sismac-4058.sc-supervisor.pages.dev](https://proto-sismac-4058.sc-supervisor.pages.dev) | Grupos: alta y edición tras la revisión de producto del 2026-10-15 (DD-206). El mismo build trae agentes, tablas y Repositorios. Actualizada el 2026-10-19 dos veces (antes `61c45d7f`, del 2026-10-16, y luego `52421aa7`) con lo fundido hasta entonces: la revisión del 2026-10-16 (DD-211); en Grupos, «Agentes» sin fijar y «—» con 0 agentes; y Grupos y Agentes como en Figma, sin edición masiva y borrando con la confirmación simple (DD-215). Actualizada otra vez el 2026-10-21 (antes `e1801cc7`): los huecos de la tabla (DD-216), la revisión de producto del 2026-10-20 (DD-217) y Grupos como sus páginas de COA (DD-218); y otra el mismo día (antes `98e6ddce`): lo que falta como la página de COA del alta, con el botón apagado, «Falta: …» en el resumen y el aviso en gris (DD-219); y otra (antes `34f18f37`): el índice de secciones en la caja gris de Contact Center, como en Figma (DD-220); y otra el 2026-10-22 (antes `059956f6`): el índice en la caja con su carril de 235 (DD-221) y el índice del alta con un marcador de paso por sección y su línea de estado, con WhatsApp obligatorio y la edición sin marcadores (DD-222); y otra el mismo día (antes `bfa680d9`): la ficha de grupo como su página de COA publicada, con «En qué conversaciones» también con solo comentarios, el canal que se activa marcado a sus agentes y el aviso antes de sacar a quien se queda sin canal, y la tabla de asignados vacía con su texto (DD-223); y otra el mismo día (antes `d6e487ba`): «Editar en Repositorios» de la tipificación, con cambios sin guardar, pregunta guardar como «Gestionar en Repositorios» (DD-224); y otra el 2026-10-26 (antes `88d2e3e7`): borrar varios en todas las tablas con «Eliminar (N)» por el clic derecho o el «⋮», y sin barra de lote ni edición masiva (DD-227); y otra el 2026-10-26 (antes `4f9d102b`): el icono de los menús con el color de su texto (DD-228) y los botones con «+» redondos, círculo sin rótulo y píldora con él (DD-229); y otra el 2026-10-26 (antes `d2b79441`): los avisos con los iconos de Smart Contact Icons y el icono alineado con el título, y Agendas y Plantillas como sus páginas de COA (DD-230); y otra el 2026-10-26 (antes `03bbe951`): todo borra con la confirmación simple y sin teclear el nombre, con «Eliminar (N)» por el «⋮» o el clic derecho, y duplicar tipificaciones y equipos abre su alta rellena (DD-231, DD-232 y DD-233) |
| SISMAC-4062 | 2026-10-26 | supervisor | `proto/SISMAC-4062` | [proto-sismac-4062.sc-supervisor.pages.dev](https://proto-sismac-4062.sc-supervisor.pages.dev) | Agentes: alta y edición tras la revisión de producto del 2026-10-15 (DD-209). El mismo build trae grupos, tablas y Repositorios. Actualizada el 2026-10-19 dos veces (antes `61c45d7f`, del 2026-10-16, y luego `52421aa7`) con lo fundido hasta entonces: la revisión del 2026-10-16 (DD-211); en Grupos, «Agentes» sin fijar y «—» con 0 agentes; y Grupos y Agentes como en Figma, sin edición masiva y borrando con la confirmación simple (DD-215). Actualizada otra vez el 2026-10-21 (antes `e1801cc7`): los huecos de la tabla (DD-216), la revisión de producto del 2026-10-20 (DD-217) y Grupos como sus páginas de COA (DD-218); y otra el mismo día (antes `98e6ddce`): lo que falta como la página de COA del alta, con el botón apagado, «Falta: …» en el resumen y el aviso en gris (DD-219); y otra (antes `34f18f37`): el índice de secciones en la caja gris de Contact Center, como en Figma (DD-220); y otra el 2026-10-22 (antes `059956f6`): el índice en la caja con su carril de 235 (DD-221) y el índice del alta con un marcador de paso por sección y su línea de estado, con WhatsApp obligatorio y la edición sin marcadores (DD-222); y otra el 2026-10-23 (antes `bfa680d9`): la ficha de grupo como su página de COA publicada (DD-223), «Editar en Repositorios» de la tipificación (DD-224) y Agentes como sus borradores de COA 4060 y 4062: borrar varios, Teléfono y Estado de inicio, Estado ordenable y por familias de color, el índice del alta con marcadores y lo que no se copia al duplicar (DD-225); y otra el mismo día (antes `8f2056b7`): Post-conversando en la etiqueta azul sin borde, la misma pieza que las demás de la columna Estado (DD-226); y otra el 2026-10-26 (antes `a01e13e6`): borrar varios en todas las tablas con «Eliminar (N)» por el clic derecho o el «⋮», y sin barra de lote ni edición masiva (DD-227); y otra el 2026-10-26 (antes `4f9d102b`): el icono de los menús con el color de su texto (DD-228) y los botones con «+» redondos, círculo sin rótulo y píldora con él (DD-229); y otra el 2026-10-26 (antes `d2b79441`): los avisos con los iconos de Smart Contact Icons y el icono alineado con el título, y Agendas y Plantillas como sus páginas de COA (DD-230); y otra el 2026-10-26 (antes `03bbe951`): todo borra con la confirmación simple y sin teclear el nombre, con «Eliminar (N)» por el «⋮» o el clic derecho, y duplicar tipificaciones y equipos abre su alta rellena (DD-231, DD-232 y DD-233) |
| SISMAC-4064 | 2026-10-26 | supervisor | `proto/SISMAC-4064` | [proto-sismac-4064.sc-supervisor.pages.dev](https://proto-sismac-4064.sc-supervisor.pages.dev) | Repositorios y las tablas comunes tras la revisión de producto del 2026-10-15 (DD-210). El mismo build trae grupos y agentes. Actualizada el 2026-10-19 dos veces (antes `61c45d7f`, del 2026-10-16, y luego `52421aa7`) con lo fundido hasta entonces: la revisión del 2026-10-16 (DD-211); en Grupos, «Agentes» sin fijar y «—» con 0 agentes; y Grupos y Agentes como en Figma, sin edición masiva y borrando con la confirmación simple (DD-215). Actualizada otra vez el 2026-10-21 (antes `e1801cc7`): los huecos de la tabla (DD-216), la revisión de producto del 2026-10-20 (DD-217) y Grupos como sus páginas de COA (DD-218); y otra el mismo día (antes `98e6ddce`): lo que falta como la página de COA del alta, con el botón apagado, «Falta: …» en el resumen y el aviso en gris (DD-219); y otra (antes `34f18f37`): el índice de secciones en la caja gris de Contact Center, como en Figma (DD-220); y otra el 2026-10-22 (antes `059956f6`): el índice en la caja con su carril de 235 (DD-221) y el índice del alta con un marcador de paso por sección y su línea de estado, con WhatsApp obligatorio y la edición sin marcadores (DD-222); y otra el 2026-10-26 (antes `bfa680d9`): borrar varios en todas las tablas con «Eliminar (N)» por el clic derecho o el «⋮», y sin barra de lote ni edición masiva (DD-227); y otra el 2026-10-26 (antes `4f9d102b`): el icono de los menús con el color de su texto (DD-228) y los botones con «+» redondos, círculo sin rótulo y píldora con él (DD-229); y otra el 2026-10-26 (antes `d2b79441`): los avisos con los iconos de Smart Contact Icons y el icono alineado con el título, y Agendas y Plantillas como sus páginas de COA (DD-230); y otra el 2026-10-26 (antes `03bbe951`): todo borra con la confirmación simple y sin teclear el nombre, con «Eliminar (N)» por el «⋮» o el clic derecho, y duplicar tipificaciones y equipos abre su alta rellena (DD-231, DD-232 y DD-233) |

