# Referencias de contact center — cómo resuelven otros las pantallas que hacemos

> **Para qué es.** Las referencias del repo eran de SaaS genérico (SnowUI, Linear, Stripe, Notion) y de mensajería
> (el análisis de Telegram y WhatsApp, que vive fuera del repo). Ninguna del propio dominio: hasta el 2026-09-27, cero
> menciones a Zendesk, Talkdesk, Genesys, Five9, Twilio, Intercom, Freshdesk o Aircall. Esto es la estantería para las
> tres pantallas que más se hacen aquí: la administración de agentes, la de grupos y colas, y el monitor del
> supervisor.
>
> **Cómo se usa: inspiración, no copia.** El molde es DD-119: el análisis de mensajería daba por bueno un avatar para
> los grupos, y se descartó porque allí grupos y personas van en la misma lista y aquí no. Antes de llevarte un
> patrón, pregunta si el contexto que lo justifica existe aquí.
>
> ⚠️ **Cómo se verificó, y su límite.** La red de la sesión bloqueaba los dominios de los fabricantes, así que **cada
> dato sale del extracto de búsqueda de la página oficial que se cita, no de leerla entera**. Lo que no se pudo
> comprobar dice «no verificado». Antes de construir encima de un dato, abre su enlace (LEARNINGS #17). De Five9 solo
> hay páginas de producto: su documentación no devolvió texto.

---

## A · Administración de agentes (lista y ficha)

| Producto | Lo que hace | Fuente |
|---|---|---|
| Zendesk | La lista (Team members) busca por nombre o email y filtra por rol, grupo y último acceso. La columna de grupos enseña el grupo por defecto y un «+more»; en masivo, «Add to group» / «Remove from group». En la ficha, un multiselect con los grupos actuales resaltados. | [Team members](https://support.zendesk.com/hc/en-us/articles/4408843830938-Viewing-and-using-the-Team-members-page) · [Pertenencia](https://support.zendesk.com/hc/en-us/articles/4408821536794-Viewing-and-managing-team-member-group-membership) |
| Zendesk | La capacidad por canal va en reglas de capacidad, y los agentes se asignan a la regla. | [Capacity rules](https://support.zendesk.com/hc/en-us/articles/4776409839770-Creating-capacity-rules-to-balance-agent-workloads) |
| Talkdesk | Users: nombre, email, rol y equipo; filtros por activación, rol, cola y equipo. En masivo, un menú de acciones (añadir y quitar colas, rol, dispositivo…). Todo agente tiene al menos una cola. | [Users](https://support.talkdesk.com/hc/en-us/articles/20710739790619-Talkdesk-Users) · [Queues](https://support.talkdesk.com/hc/en-us/articles/200617459-Setting-up-Queues-formerly-Ring-Groups) |
| Talkdesk | El color del estado dice si el agente es enrutable: verde recibe llamadas, rojo o gris no, naranja solo transferencias. | [Agent Status](https://support.talkdesk.com/hc/en-us/articles/200496719-Agent-Status-set-your-availability) |
| Genesys Cloud | People: filtro, búsqueda y acciones masivas (skills). La capacidad simultánea por medio se define para toda la organización y se sobrescribe por agente. | [People](https://help.mypurecloud.com/articles/work-with-the-people-page/) · [Utilization](https://help.mypurecloud.com/?p=67728) |
| Twilio Flex | La capacidad es un NÚMERO por canal y por agente (p. ej. 1 voz y 3 chats). | [Multitasking](https://www.twilio.com/docs/taskrouter/multitasking) |
| Aircall | La disponibilidad se cambia en la propia celda de la lista. Estados: disponible, o no disponible con motivo (descanso, comida, formación…); «ocupado» es automático. | [Users](https://support.aircall.io/en-gb/articles/10375395665437) · [Estados](https://support.aircall.io/en-gb/articles/21534398461213) |
| Intercom | Límite de asignación por agente y bandejas de equipo primarias y secundarias, editables en masivo. | [Balanced assignment](https://www.intercom.com/help/en/articles/6553774-balanced-assignment-deep-dive) |
| Freshdesk | Un estado propio es nombre + tipo (disponible, ocupado, ausente) + emoji; por canal, máximo de tickets y chats. | [Estados](https://support.freshdesk.com/support/solutions/articles/50000006076-configure-custom-agent-status) · [Omnicanal](https://support.freshdesk.com/support/solutions/articles/50000002833-overview-of-omnichannel-availability-dashboard-classic-freshdesk-omnichannel-) |

## B · Grupos, colas y equipos

| Producto | Lo que hace | Fuente |
|---|---|---|
| Zendesk | La lista enseña miembros y descripción. El alta pide nombre, miembros (un «+» por persona o «Add all») y si es el grupo por defecto. Clonar un grupo no es nativo (petición de la comunidad). | [Groups](https://support.zendesk.com/hc/en-us/articles/4408831652890-About-the-Groups-page) · [Crear](https://support.zendesk.com/hc/en-us/articles/4408894175130-Creating-groups) · [Clonar](https://support.zendesk.com/hc/en-us/community/posts/4416155466650-Ability-to-Clone-Groups) |
| Genesys Cloud | Crear cola pide nombre y «copiar ajustes y miembros de» otra; luego abre su pestaña General. Miembros por usuario o por grupo, hasta 100 de golpe. | [Crear cola](https://help.mypurecloud.com/?p=18650) |
| Talkdesk | La cola se crea en una ventana; el detalle se abre al pulsar su nombre en la tabla. | [Queues Management](https://support.talkdesk.com/hc/en-us/articles/32966941212699--Queues-Queues-Management) |
| Twilio Flex | El equipo se edita en un panel lateral, sin cambiar de página («Add team members» por email). Cada miembro, en un único equipo. | [Teams](https://www.twilio.com/docs/flex/admin-guide/setup/teams) |
| Aircall | El reparto va en el NÚMERO: simultáneo, aleatorio o el que más lleva libre, más un tiempo de cola de 20 s a 40 min. Se puede importar el reparto de un número a otro. | [Teams](https://support.aircall.io/en-gb/articles/10375395382685) · [Importar](https://support.aircall.io/hc/en-gb/articles/15148428289437-How-to-Import-a-Smartflows-Call-Distribution-to-Another-Number) |
| Freshdesk | La lista de grupos enseña agentes, horario y método de reparto en columnas. | [Grupos](https://support.freshdesk.com/support/solutions/articles/37604-organize-agents-into-groups) |
| Intercom | El horario es un objeto reutilizable que se enlaza desde varios equipos. | [Horarios](https://www.intercom.com/help/en/articles/3305941-set-custom-office-hours-and-reply-times-for-your-teams) |

## C · Monitor del supervisor en tiempo real

| Producto | Lo que hace | Fuente |
|---|---|---|
| Talkdesk | Hasta 16 widgets y pantalla completa. La lista de agentes en vivo: estado (se cambia desde la fila), tiempo en el estado, colas, canales y ocupación contra capacidad con barra por umbrales. El nivel de servicio, por cola y en indicador. | [FAQ](https://support.talkdesk.com/hc/en-us/articles/360053051152-Talkdesk-Live-FAQ) · [Live Agents List](https://support.talkdesk.com/hc/en-us/articles/4409606243867-Live-Agents-List) · [Service Level](https://support.talkdesk.com/hc/en-us/articles/4409690831259-Service-Level) |
| Twilio Flex | Encima de la tabla de colas, una barra con los agentes por estado; la tabla lleva tareas activas y en espera, espera más larga y SLA, y cada uno elige sus métricas. | [Queues View](https://www.twilio.com/docs/flex/end-user-guide/real-time-reporting/real-time-queues-view) · [Programabilidad](https://www.twilio.com/docs/flex/developer/ui/queues-view-programmability) |
| Genesys Cloud | Resumen de colas (hasta 50) → al pulsar el nombre, su detalle; pulsar «En espera» o «Interactuando» filtra la vista. | [Resumen](https://help.mypurecloud.com/?p=89051) · [Detalle](https://help.mypurecloud.com/?p=185887) |
| Zendesk | Tres paneles en tiempo real; pulsar «número de agentes» abre la lista de agentes. (Explore en vivo se retira el 25-01-2027: no tomarlo como referencia estable.) | [Productividad](https://support.zendesk.com/hc/en-us/articles/9757103842458-Using-the-agent-productivity-real-time-dashboard) · [Retirada](https://support.zendesk.com/hc/en-us/articles/10860286407962-Announcing-end-of-life-for-live-reporting-in-Zendesk-Explore) |
| Aircall | Umbrales verde/naranja/rojo del SLA configurables por el cliente; cada cabecera explica su métrica en un tooltip. | [Numbers](https://support.aircall.io/hc/en-gb/articles/21355252169885-Live-Monitoring-Numbers-table) · [Users](https://support.aircall.io/hc/en-gb/articles/21355210478749-Live-Monitoring-Users-table) |
| Intercom | Cambio de estado en masivo desde el monitor; no tiene modo pantalla de pared (recomiendan compartir pantalla). | [Real-time](https://www.intercom.com/help/en/articles/5784131-real-time-dashboard) · [FAQ](https://www.intercom.com/help/en/articles/8921906-reporting-faqs) |
| Freshcaller | Vistas del panel en vivo filtradas por cola o equipo, guardadas. | [Vistas](https://support.freshcaller.com/en/support/solutions/articles/50000002826-filter-and-save-live-dashboard-views) |
| Five9 | Wallboards con plantillas (solo página de producto). | [Wallboards](https://www.five9.com/products/capabilities/performance-management-dashboard) |

---

## Lo que comparten al menos dos, y a qué pantalla nuestra le toca

| Patrón | Quién | Aquí |
|---|---|---|
| La pertenencia agente↔grupo se edita desde el agente, desde el grupo y en masivo | Zendesk, Talkdesk, Intercom | Fichas de agente y de grupo (DD-121); comprobar que el masivo existe en las dos listas |
| Un grupo principal, o la regla de que todo agente tenga al menos uno | Zendesk, Intercom · Zendesk, Talkdesk | Comparar con «Grupos asignados» de la ficha de agente y su grupo saliente por defecto (`defaultOutboundGroup`) |
| La capacidad por canal es un NÚMERO, no una casilla | Zendesk, Genesys, Twilio, Freshdesk, Intercom | Ya lo es: `maxChats` en la ficha de agente (Avanzado, 4 por defecto). Las casillas por canal del grupo dicen en qué canales atiende, que es pertenencia y no capacidad: no hay nada que copiar |
| Pocos estados base más un motivo | Zendesk, Talkdesk, Aircall, Freshdesk, Twilio, Intercom | Los estados de Config AED (por defecto + personalizados) ya lo son |
| Tiempo en el estado actual como columna | Zendesk, Talkdesk, Intercom, Freshcaller, Genesys | La tabla de agentes del Dashboard no lo enseña |
| Una cifra del monitor lleva a su lista | Genesys, Zendesk, Talkdesk, Aircall | Comprobar si las cifras del Dashboard llevan a su lista (sin verificar) |
| Una barra o un donut de agentes por estado | Twilio, Intercom, Talkdesk | El widget «Agentes disponibles» es un donut de una sola serie (5 de 9 conectados) |
| Acciones del supervisor en la fila (cambiar estado; escuchar) | Talkdesk, Intercom, Aircall · Twilio, Freshcaller | — |

**Donde no se ponen de acuerdo.** Dónde vive el reparto (en el grupo, en el número, en una expresión de cola o en anillos
de skills); si hay pantalla de pared (nativa en Talkdesk y Five9, explícitamente no en Intercom); y si un grupo lleva
imagen (foto en Genesys, emoji en Intercom; aquí DD-119 dijo que no, por su motivo).

**No aplica aquí:** los filtros por marca de Zendesk (modelo multimarca), divisiones y licencias como ejes de la lista
(Genesys, escala enterprise), expresiones tipo SQL para elegir agentes (Twilio, para desarrolladores) y los emojis por
estado o por equipo (Freshdesk, Intercom): nuestra regla es `sc-icon`, sin emojis (AGENTS §«UX de pantalla» 4).
