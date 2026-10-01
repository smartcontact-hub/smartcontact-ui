# Frente · Sidebar del Supervisor — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.

## ✅ 2026-10-01 · El sidebar sigue a su tablero de Figma (DD-137)

> **Sello: rama `arebury/sidebar-theme-icon-colors`, sobre `origin/main` HEAD `99818fb2`.**

**Figma** (tablero `14912:6324`):
- Los iconos grises y los padres sin cyan tenían un solo origen: Smart-Contact Icons pinta un gris dentro del dibujo
  que manda sobre el color de la capa. Se eligió arreglarlo solo en el tablero: sus 199 iconos son copias desligadas
  de la librería, a 14×14, con el blanco o el cyan que tocaba. Queda un cyan por sidebar.
- Manda el catálogo de la sección 6 (`14912:6774`): los 198 iconos de los sidebars son el que nombra su tarjeta.
  Se llegaron a poner los de los plegados y se quitaron.
- Textos: «Diseñador VUI», «Análisis de Flujo» y «solicitado en SISMAC-4340».
- El plegado antiguo (`14912:6420`) va con 16 de margen interior y esquinas a 12, sin la fila escondida.
- Los componentes locales del catálogo tienen instancias en la página de archivo del sidebar y en Testing: no se
  mueven ni se tocan.

**Código:**
- Sin botón de anclar, y plegado sigue abierto lo que estaba abierto.
- Texto e icono en blanco y la flecha al 60%.
- Todos los iconos a 14, con los del catálogo; Administración `groups` y Grupos `group` ya no van cruzados.
- Los dos nombres nuevos, en los cuatro idiomas.
- Lo vigila `e2e/supervisor/sidebar-tablero.spec.ts`: 4 pruebas, verdes en local y rojas contra producción.

**Siguiente:**
1. Visto bueno en local dado: PR de esta rama y leer el CI.
2. Lo que el tablero dice y el código aún no hace (no está pedido; preguntar):
   - recordar lo abierto al recargar;
   - no abrir nada al navegar;
   - el texto de la fila en 13 Medium, que no está en la escala.

## ✅ 2026-09-23 · En producción va «abrir no cierra las demás» (DD-118)

> **Sello: rama `sidebar-produccion`, sobre `origin/main` HEAD `b55e3017`.**

**Qué decidió Rafa.** El sidebar de `main` es el de https://c1ae0539.sc-supervisor.pages.dev/solo-sidebar (tag
`archive/comparar-sidebar-sin-cerrar-al-abrir-2026-09-16`, `65185e3b`): «no es mi favorito, pero eventualmente con
primeng dev podamos lograr meter el otro». Se trabaja sobre esa base. «No se cierra nada» (tramo de abajo) queda como la
favorita, pendiente del Sidebar de primeng.dev.

**Qué hay.** La versión del tag sin el andamio de la comparación: selección en cyan, Drawer (se despliega con el ratón,
se pliega 300ms después de salir), botón de anclar recordado en `sc-sidebar-anclado`, abrir no cierra las demás y
plegado solo se pinta la rama de la página. Medido contra el preview a 1440×900 en Informes de Datos: igual plegado y
desplegado.

**Siguiente:**
1. El botón de anclar pisa 5px el texto del logotipo desplegado (texto hasta x=208, botón desde 203). Viene así del preview.
2. Probar «no se cierra nada» con el Sidebar de primeng.dev (tag `archive/lab-sidebar-2026-09-16`).

## ✅ 2026-09-16 · Regla oficial (sustituida en producción por el tramo de arriba): en el sidebar no se cierra nada

> **Sello: rama `comparar/sidebar` (no se funde), HEAD `3c3e76c1`.** Vivo:
> https://comparar-sidebar.sc-supervisor.pages.dev/solo-sidebar · tarjeta «Sidebar» del Lab con las versiones anteriores.

**Qué decidió Rafa.** Una categoría solo se abre o se cierra con su propio clic. Lo abierto sigue abierto al sacar el
ratón, al navegar, al plegar a 80px y al recargar; lo que no cabe va con scroll. **Esto sustituye** lo de DD-112 de
cerrar al salir las categorías que no son de la página.

**Versiones guardadas con tag:**
- `archive/comparar-sidebar-apollo-2026-09-16`: abrir una cierra las demás.
- `archive/comparar-sidebar-sin-cerrar-al-abrir-2026-09-16`: abrir no cierra, pero navegar y plegar sí.
- `archive/lab-sidebar-2026-09-16`: el laboratorio del Sidebar de primeng.dev.

**Figma:** un solo tablero con el padre en cyan y la regla «no se cierra nada» (`khNq9dJKNi13pNllrqm6dx`, nodo
`14912-6324`). Las versiones anteriores están en `14930-1011`.

**Siguiente:** llevar la regla a `main` en la rama del sidebar y reescribir DD-112 en esa parte. Lo de 2026-09-15 sigue
debajo como estaba.

## ✅ 2026-09-15 · El sidebar se pliega a 80px, marca un solo padre y abre y cierra sin saltos (SISMAC-4340)

> **Sello: rama `arebury/sidebar-plegado-80`, sobre `origin/main` HEAD `cc3c7d72`.**

**Qué hay.** Lo que decide DD-112, en `projects/supervisor/src/app/core/layout/sidebar/`: plegado a 80px con filas
contenidas, items nuevos con sus rutas (placeholder) y textos en los cuatro idiomas, un solo padre en cyan, abrir y
cerrar sin tocar las demás mientras el ratón está dentro, cierre al salir y pliegue animado. `ViewTransitionTracker`
(`core/services/`) avisa del fin del fundido del router. Tablero para Carlos en Figma, página Testing, sección
`SISMAC-4340 Sidebar` (`14855:1269`).

**Medido** con sondas de Playwright a 1440×900 (en el scratchpad de la sesión, no en el repo): un solo cyan en los
cuatro casos (Monitor, Nodo IA cerrado, Supervisión cerrada, Usuarios), las categorías siguen abiertas al navegar y se
cierran 400ms después de salir, ancho 240 durante toda la transición al pulsar un item, pliegue de 272px a 0 en ~270ms.

## SIGUIENTE

1. **ESPERANDO A RAFA** (no se pregunta, él lo saca):
   - Plegado: fondo de grupo solo en desplegado (propuesta de Rafa) o solo el primer nivel en plegado (propuesta de Claude).
   - ~~Selected al 15% (código) o al 12% (Figma)~~: ya no aplica. El blanco al 15% era el del sidebar anclado, que se
     quitó el 2026-10-01 (DD-137).
2. Detalles premium de bajo coste: en `docs/ROADMAP.md`, «Revisión de componentes».

**Trampas del frente:**
- ⚠️ El output de apertura se llama `toggleOpen`: `toggle` choca con el evento nativo (`no-output-native`).
- ⚠️ Una sonda que pulse items del sidebar tiene que dejar el ratón encima: `:hover` desaparece durante el fundido y el
  sidebar lo compensa con `sidebar--pinned` solo en navegaciones que empiezan en él.
- ⚠️ Los hijos de una categoría cerrada siguen en el DOM (`inert`, altura 0): no cuentes filas por `.nav-item` sin
  filtrar las visibles.
