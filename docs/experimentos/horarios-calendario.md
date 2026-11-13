# Experimento · Horarios con el calendario como protagonista

Rama experimental: **no pasa los gates ni el arnés** y no se mergea tal cual. Sirve para enseñar la dirección y decidir.
Los e2e de Horarios (`horarios-estres`, `grupo-tiempos-horarios`, `hand-made-pieces`…) apuntan a la pantalla anterior y no
se han tocado: fallarán hasta que se decida qué se queda.

## Qué cambia

**Listado** (`/admin/horarios`)

- «Ahora» pasa a **Atención ahora**: glifo + «En horario / Fuera de horario» + matiz («hasta las 18:00», «abre mañana a las 09:00»).
  Ya no es una pastilla igual que la de Estado.
- **Grupos**: siempre la cifra (0 incluido) y los nombres al pasar, como Equipos (`groupsDisplay: 'count'`).
- **Estado**: solo glifo (`check_circle` / `pause_circle`), con el texto en el nombre accesible y en el tooltip.
  Dos tipos nuevos en `RepoColumnDef`: `statusDisplay: 'icon'` y `kind: 'availability'`.

**Editor** (`/admin/horarios/editar/:id`)

- Dos filas: el calendario a todo el ancho y alto de pantalla; debajo, las **reglas en segundo plano** (semana habitual,
  periodos, fechas especiales y festivos), en tres tarjetas compactas con su lápiz.
- «General» sale a un diálogo («Editar datos»). En un horario nuevo se abre solo. «Activo» se queda a la vista.
- Calendario: vistas **día · semana · mes · año**; filtros arriba (semana habitual, cada periodo, festivos, fechas
  especiales, cerrado) que atenúan lo apagado; sin botón «Hoy» (hoy va marcado); hasta 5 años atrás y 3 adelante con
  selectores de mes y año.
- El día elegido, en **una línea** bajo la barra: horas, quién las decide y dos lápices (editar eso que lo decide /
  cambiar solo ese día). Sin día elegido, los lápices están apagados.
- Semana y día pintan cada tramo a su minuto (14:00–16:54 se ve tal cual) sobre una rejilla de 30 minutos.

## Piezas custom (no hay equivalente en el DS)

| Pieza | Por qué |
| --- | --- |
| `sc-horario-vista` (rejilla de año, mes, semana y día) | PrimeNG solo trae un selector de fecha. |
| Filtros del calendario (botones con `aria-pressed`) | No hay un chip que se encienda y se apague. |
| `sc-horario-reglas` (tarjetas compactas con acciones en la cabecera) | `sc-section-card` no lleva acciones en su cabecera. |

Todo lo demás sale del DS: `sc-button`, `sc-select`, `sc-selectbutton`, `sc-multiselect`, `sc-custom-modal`,
`sc-toggleswitch`, `sc-icon` y los tokens `--sc-*`. El modelo (`horarios.core.mjs`) no cambia.
