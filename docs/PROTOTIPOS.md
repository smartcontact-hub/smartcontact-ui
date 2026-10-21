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
| SISMAC-4058 | 2026-10-21 | supervisor | `proto/SISMAC-4058` | [proto-sismac-4058.sc-supervisor.pages.dev](https://proto-sismac-4058.sc-supervisor.pages.dev) | Grupos: alta y edición tras la revisión de producto del 2026-10-15 (DD-206). El mismo build trae agentes, tablas y Repositorios. Actualizada el 2026-10-19 dos veces (antes `61c45d7f`, del 2026-10-16, y luego `52421aa7`) con lo fundido hasta entonces: la revisión del 2026-10-16 (DD-211); en Grupos, «Agentes» sin fijar y «—» con 0 agentes; y Grupos y Agentes como en Figma, sin edición masiva y borrando con la confirmación simple (DD-215). Actualizada otra vez el 2026-10-21 (antes `e1801cc7`): los huecos de la tabla (DD-216), la revisión de producto del 2026-10-20 (DD-217) y Grupos como sus páginas de COA (DD-218); y otra el mismo día (antes `98e6ddce`): lo que falta como la página de COA del alta, con el botón apagado, «Falta: …» en el resumen y el aviso en gris (DD-219) |
| SISMAC-4062 | 2026-10-21 | supervisor | `proto/SISMAC-4062` | [proto-sismac-4062.sc-supervisor.pages.dev](https://proto-sismac-4062.sc-supervisor.pages.dev) | Agentes: alta y edición tras la revisión de producto del 2026-10-15 (DD-209). El mismo build trae grupos, tablas y Repositorios. Actualizada el 2026-10-19 dos veces (antes `61c45d7f`, del 2026-10-16, y luego `52421aa7`) con lo fundido hasta entonces: la revisión del 2026-10-16 (DD-211); en Grupos, «Agentes» sin fijar y «—» con 0 agentes; y Grupos y Agentes como en Figma, sin edición masiva y borrando con la confirmación simple (DD-215). Actualizada otra vez el 2026-10-21 (antes `e1801cc7`): los huecos de la tabla (DD-216), la revisión de producto del 2026-10-20 (DD-217) y Grupos como sus páginas de COA (DD-218); y otra el mismo día (antes `98e6ddce`): lo que falta como la página de COA del alta, con el botón apagado, «Falta: …» en el resumen y el aviso en gris (DD-219) |
| SISMAC-4064 | 2026-10-21 | supervisor | `proto/SISMAC-4064` | [proto-sismac-4064.sc-supervisor.pages.dev](https://proto-sismac-4064.sc-supervisor.pages.dev) | Repositorios y las tablas comunes tras la revisión de producto del 2026-10-15 (DD-210). El mismo build trae grupos y agentes. Actualizada el 2026-10-19 dos veces (antes `61c45d7f`, del 2026-10-16, y luego `52421aa7`) con lo fundido hasta entonces: la revisión del 2026-10-16 (DD-211); en Grupos, «Agentes» sin fijar y «—» con 0 agentes; y Grupos y Agentes como en Figma, sin edición masiva y borrando con la confirmación simple (DD-215). Actualizada otra vez el 2026-10-21 (antes `e1801cc7`): los huecos de la tabla (DD-216), la revisión de producto del 2026-10-20 (DD-217) y Grupos como sus páginas de COA (DD-218); y otra el mismo día (antes `98e6ddce`): lo que falta como la página de COA del alta, con el botón apagado, «Falta: …» en el resumen y el aviso en gris (DD-219) |

