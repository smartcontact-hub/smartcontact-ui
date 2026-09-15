# Frente · Sidebar del Supervisor — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.

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
   - Selected al 15% (código) o al 12% (Figma).
2. Detalles premium de bajo coste: en `docs/ROADMAP.md`, «Revisión de componentes».

**Trampas del frente:**
- ⚠️ El output de apertura se llama `toggleOpen`: `toggle` choca con el evento nativo (`no-output-native`).
- ⚠️ Una sonda que pulse items del sidebar tiene que dejar el ratón encima: `:hover` desaparece durante el fundido y el
  sidebar lo compensa con `sidebar--pinned` solo en navegaciones que empiezan en él.
- ⚠️ Los hijos de una categoría cerrada siguen en el DOM (`inert`, altura 0): no cuentes filas por `.nav-item` sin
  filtrar las visibles.
