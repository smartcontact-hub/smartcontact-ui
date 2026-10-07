# Cuscare: filtros y tabla — handoff

Decisión de producto validada para publicación (2026-10-02); la regla del filtro cambió el
2026-10-07. Implementación en
`projects/cuscare/src/app/features/tickets/`. Complementa
[cuscare-request-type-match.md](cuscare-request-type-match.md).

## Contrato del filtro

El campo de esta pantalla se llama **Tipo de solicitud**. No se crea un segundo
campo «Tipo de contenido» ni se cambia el vocabulario del dominio.

| Acción / estado | Panel y disparador | Tabla |
| --- | --- | --- |
| Entrada inicial | Cerrado, «—», descripción accesible «Sin filtro aplicado», orígenes apagados | Todos los tickets; nunca empty state por no haber interactuado |
| Abrir y cerrar sin tocar nada | Sigue neutral | No cambia |
| Abrir sin origen | La lista de tipos, el buscador y «todos» están desactivados hasta encender un origen | No cambia |
| Activar orígenes sin tipos | Preparación dentro del panel; no aparece limpieza | No filtra ni cambia la página |
| Apagar el último origen con tipos marcados | Los tipos siguen marcados pero desactivados; «—», sin × | Deja de filtrar hasta encender otro origen |
| Cerrar sin tipos o sin origen, por clic exterior, disparador o Escape | Descarta lo preparado; siguiente apertura empieza apagada | Todos los tickets compatibles con los otros filtros |
| Seleccionar tipos | Aplica inmediatamente, «1 tipo» / «N tipos» y × | Filtra y vuelve a página 1; no existe un paso adicional Aplicar |
| Cerrar y reabrir con tipos | Conserva selección y orígenes | Conserva resultados |
| Desmarcar el último tipo | «—», sin ×; permite preparar otra selección dentro del panel | Retira esta condición; mantiene los demás filtros |
| Limpiar con × | Vacía tipos y orígenes | Retira solo este filtro |
| Eliminar filtros | Vacía todos los filtros | Recupera catálogo completo |
| Salir de Tickets y volver, o recargar | Estado inicial, igual que los demás filtros de esta réplica | Reinicia consulta, orden y paginación; no se persiste en URL/storage |

La búsqueda «Buscar tipo» solo reduce las opciones del panel. Se limpia al cerrar
para que la próxima apertura muestre el catálogo completo, conservando las casillas
seleccionadas. Una búsqueda sin coincidencias muestra «Ningún tipo coincide» dentro
del panel y no cambia los resultados de tickets.

La regla (2026-10-07): cada origen encendido tiene que haber puesto alguno de los tipos
marcados, no necesariamente el mismo. OR dentro de cada origen, AND entre orígenes. Las
opciones ya no llevan «Match»; el detalle, en
[cuscare-request-type-match.md](cuscare-request-type-match.md).

**Resultados vacíos:** con filtros activos, «Ningún ticket coincide con estos
filtros» y acción «Eliminar filtros». Se conservan los controles y el criterio
aplicado para poder corregirlo. Sin filtros y sin datos, «Todavía no hay tickets».
El contador indica 0–0 de 0. No se usa ninguno de estos mensajes al abrir el filtro
sin haber seleccionado. La semilla actual tiene datos: el estado sin tickets está
implementado, pero no reproducido visualmente con una fuente vacía.

## Contenedor, anchos y overflow

Medidas en **CSS px**, incluidos los rellenos de cada columna. Se conserva la
métrica local de Cuscare (DD-35); estas medidas no son nuevos tokens del DS.

- Escritorio mínimo soportado: viewport **1024 px**. Sin cambio a tarjetas ni
  ocultación automática de columnas. Por debajo no se certifica un diseño móvil.
- El contenedor es fluido y no tiene máximo artificial: ocupa el espacio de la
  tarjeta. Shell: sidebar 90.3 px + márgenes laterales 54 px + padding tarjeta
  32 px. Su ancho útil C es aproximadamente `viewport − 176.3 px` (puede variar
  por la barra vertical del navegador). En 1024, C ≈ **847.7 px**.
- No hay nuevos breakpoints de layout: toolbar y pie envuelven sus elementos si
  no caben. El cambio de densidad de Tipo de solicitud es continuo:
  `redondear(clamp(260, C / 4, 320))`.
- Hasta C=1040, esa columna mide 260. Entre C=1040 y 1280 crece gradualmente.
  Desde C=1280 mide 320. Equivale aproximadamente a viewports 1216 y 1456 con
  este shell; son umbrales de ancho disponible, no media queries.
- Cada otra columna mantiene mínimo=máximo. El contenido nunca decide su ancho.
  No hay redimensionamiento manual en esta fase.
- Ancho de tabla W = 40 (selección) + suma de columnas visibles. Con todas,
  **3108–3168 px**, según el ancho de Tipo de solicitud. **3168 px es el máximo
  del contenido**, no un breakpoint para comenzar a desplazar.
- Scroll horizontal nativo cuando **W > C**. Con todas las columnas, deja de
  hacer falta cuando C ≥3168, aproximadamente viewport ≥3344.3 px. Ocultar
  columnas reduce W y por tanto ese umbral. Si W<C, no se estiran para rellenar.
- Un único contenedor desplazable: `.p-datatable-table-container` de PrimeNG.
  No hay scroll horizontal del documento ni contenedor exterior redundante.

| Columna | Mínimo | Máximo | Prioridad inicial |
| --- | ---: | ---: | --- |
| Selección / bloqueo | 40 | 40 | Siempre primera |
| ID | 80 | 80 | Identificación |
| Estado | 120 | 120 | Operación |
| Tipo de solicitud | 260 | 320 | Criterio del filtro, visible a 1024 |
| Asignado a | 186 | 186 | Operación |
| Grupo | 130 | 130 | Operación |
| Canal | 110 | 110 | Contexto |
| Source | 140 | 140 | Contexto |
| Email | 167 | 167 | Contexto |
| País | 101 | 101 | Contexto |
| Productos | 348 | 348 | Detalle |
| Creación | 167 | 167 | Detalle |
| Actualización | 167 | 167 | Detalle |
| Descripción | 250 | 250 | Detalle |
| Prioridad | 110 | 110 | Detalle, reordenable |
| Subestado | 130 | 130 | Detalle |
| Devolución | 130 | 130 | Detalle |
| GDPR | 155 | 155 | Detalle |
| Operador | 150 | 150 | Detalle |
| Contenido del MO | 167 | 167 | Detalle |

Las prioridades determinan el orden inicial, no permisos de ocultación. Se
conserva el gestor para reordenar/ocultar y restaurar ese orden. ID, Estado y Tipo
de solicitud caben completos en el ancho mínimo al iniciar el scroll a la izquierda.
Las acciones masivas siguen fuera de la tabla; nunca quedan fuera de alcance por
el desplazamiento horizontal. No se crea una columna de acciones redundante.

## Lectura, desplazamiento y accesibilidad

- Textos largos, direcciones y tags envuelven líneas dentro del ancho asignado;
  `overflow-wrap: anywhere` resuelve cadenas sin espacios. No hay ellipsis que
  oculte datos críticos, recorte de tags, límite de líneas ni contador «+N».
- Filas de altura variable, celdas alineadas arriba. Los productos y grupos de
  tags envuelven. El disparador mantiene una línea y contador compacto.
- No hay columnas sticky horizontales en esta fase: se conserva todo el espacio
  útil al desplazarse, también en 1024. La cabecera conserva el comportamiento
  vertical nativo de la tabla; no se añade cabecera fija a la ventana.
- El aviso «Desplázate horizontalmente para ver más columnas» aparece solo con
  overflow, en un hueco reservado para evitar saltos. Es visible incluso si el
  SO oculta la scrollbar hasta interactuar. No hay flechas simuladas ni sombras
  que parezcan una acción. Scrollbar, trackpad, gesto táctil y teclado nativos.
- El viewport entra en Tab solo cuando desborda, con rol region y nombre «Tabla
  de tickets», descripción vinculada al aviso y foco visible. Flechas desplazan
  la tabla; cuando el foco está en un input conservan su comportamiento de edición.
- Cabeceras ordenables accesibles por Tab, Enter y Espacio; conservan aria-sort.
  Disparador y limpieza tienen foco visible. El panel tiene nombre accesible.
- El origen de cada tag se expone también en nombre accesible y title. Los
  colores locales IA/Agente y la agrupación de coincidencias, con su check, se conservan
  en el prototipo como avance de fase 2 (decisión del 2026-10-07).
- Se respeta reduced-motion para los checks de origen y el chevron. No se añade
  animación al filtrado ni al scroll.

## Verificación y límites del handoff

Regresión automatizada: `e2e/cuscare/filter-lifecycle-table.spec.ts`,
`request-type-match.spec.ts` y `filters-pagination.spec.ts`.
Se prueban los flujos del filtro, la recuperación de cero resultados, anchos y
prioridades en 1024/1280/1440/1920, ausencia de overflow del documento y scroll
por teclado. Revisión visual local en los extremos de escritorio y con textos largos.

No verificado: lector de pantalla real, dispositivos táctiles, catálogo realmente
vacío, diseño móvil por debajo de 1024 y reproducción de animaciones al 10% en
DevTools. No se altera el motion nativo de PrimeNG. La aceptación visual y la publicación a main fueron autorizadas el 2026-10-02.
