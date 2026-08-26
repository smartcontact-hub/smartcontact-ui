# La tabla — Historial y Pendientes

Componente: [`call-table.component.ts`](../src/app/components/call-table/call-table.component.ts).
Datos: [`seed.ts`](../src/app/data/seed.ts).

Dos pestañas sobre la misma rejilla. **Pendientes** es el visor de conversaciones perdidas
del grupo que introduce la card [SISMAC-3780](https://jira.dvtech.io/browse/SISMAC-3780).

## El icono de fila: el color es DATO, no estilo

Lo más fácil de hacer mal. El real **no** gira una flecha genérica: elige entre una matriz
de ficheros distintos, y el color codifica el resultado de la conversación.

|                                         | entrante ↙           | saliente ↗           |
| --------------------------------------- | -------------------- | -------------------- |
| **verde** — atendida                    | `verde_entrante.svg` | `verde_saliente.svg` |
| **rojo** — perdida / abandonada         | `rojo_entrante.svg`  | `rojo_saliente.svg`  |
| **negro** — transferida (**solo chat**) | `negro_entrante.svg` | `negro_saliente.svg` |

…por canal: `telefono/`, `chat/`, `mail/` (mail **no** tiene negro), más
`whatsapp_entrante.svg` / `whatsapp_saliente.svg` sueltos. Y un modificador `expired`, que
en el real repinta el SVG de `#8d939d`.

Los ficheros están en `public/icons/historial/` **sin tocar**: no se recolorean con
`currentColor`, porque eso destruiría la información. Portado en `iconFor()`, que replica
`getIcon()` del Agent real.

> **Convención de la flecha**: ↗ arriba-derecha = **saliente**, ↙ abajo-izquierda =
> **entrante**. Comprobado dos veces: por la firma del SVG en el DOM y porque las filas con
> `Origen` relleno son entrantes y las de `Origen: -` salientes. Casó fila por fila.

## La barra de estado de la izquierda

En el real es una **columna propia** (`td.status`, `0.261vw` de ancho) que se pinta:
`#f75454` cuando la conversación está en estado de error/abandono, `#8d939d` cuando está
caducada. Aquí se resuelve como `box-shadow: inset 3.8px` sobre la celda del icono, para no
meter una celda extra en la rejilla.

## Pendientes: los tres estados de gestión

El backend devuelve `management_status`, y la columna «Estado» cambia entera:

| Estado          | Qué se pinta                               | Icono       | «Gestionada por»          |
| --------------- | ------------------------------------------ | ----------- | ------------------------- |
| `pending`       | Botón primario **«Gestionar»** (`#0058ff`) | —           | `-`                       |
| `in_management` | Texto **«En gestión»**                     | `autorenew` | el agente que la tiene    |
| `managed`       | Texto **«Gestionada»**                     | `check`     | el agente que la gestionó |

Los dos últimos son un `p-button` secundario de tipo texto en el real: gris `#9d9fa3`, sin
fondo.

**El badge rojo de la pestaña cuenta solo las `pending`** — en el entorno de desarrollo,
10 de 17 filas. Por eso `PENDING_COUNT` se deriva del array y no se escribe a mano.

## Columnas

- **Historial**: (icono) · Fecha · Número · Grupo · Origen · Destino · Atención/Esp. ·
  Tipificación · Comentarios
- **Pendientes**: (icono) · Fecha · Número · Grupo · Origen · Destino · Atención/Esp. ·
  **Estado** · **Gestionada por**

«Atención/Esp.» son dos tiempos: el primero plano, el segundo como chip (`#5f6776`, rojo si
supera el umbral).

## El contador usa `sc-badge` del Design System

Igual que el real. **Ojo**: la app real le pasa `shape="circle"`, un input que el
`sc-badge` de este repo **no tiene** (no hay `shape` ni `circle` en el componente actual, ni
rastro en git). Aquí el círculo se fuerza por CSS. Pendiente de aclarar si su build del DS
es otro o si el atributo se está ignorando en silencio.

## Los datos

Extraídos del DOM del entorno de desarrollo: 19 filas de Historial y 17 de Pendientes, con
sus grupos, nodos y tiempos reales. Si hay que refrescarlos, el método está en
[`README.md`](./README.md).

## Orden de «Pendientes» y filas ya gestionadas

Portado de `applyLostEventsSort()` del Agent real. La tabla se ordena por **bloque
funcional** y, dentro del bloque, de más reciente a más antigua:

| bloque | estado          |
| ------ | --------------- |
| 0      | `pending`       |
| 1      | `in_management` |
| 2      | `managed`       |

Para las gestionadas la fecha que cuenta **no es la de la conversación sino la de
gestión** (`managed_at`), así que la que se acaba de cerrar baja hasta justo encima de la
primera ya gestionada. Ese es el efecto que se ve: lo hecho queda separado de lo que
queda por hacer, sin reordenar el resto.

Y la fila entera se atenúa: `tr.lost-managed { opacity: 0.55 }`. Encima de eso, el rótulo
«Gestionada» lleva su propio `opacity: 0.72` en gris; el de «En gestión» va en blanco.
