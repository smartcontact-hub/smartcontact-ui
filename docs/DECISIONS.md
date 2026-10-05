# Smart Contact UI — Architectural Decisions

> Decisiones grandes que afectan al diseño del Design System Smart Contact.
>
> **Source of truth**: este doc para decisiones arquitectónicas. Brand divergences
> en [`customs-catalog.md`](./customs-catalog.md). Reglas de blindaje en
> [`migration-safety.md`](./migration-safety.md).
>
> Formato DD-N, **newest first** (lo vigila `docs:coherence`; hasta el 2026-08-13 lo prometía y
> no lo cumplía), y cada número una sola vez: dos sesiones a la vez pueden coger el mismo, y la que
> funde después renumera la suya con todas sus citas (también lo vigila, desde el 2026-09-27). Plantilla:
>
> **`Descartadas` es obligatorio SI hubo alternativas que se consideraron y se rechazaron** —
> que es donde está el valor de este log: saber *qué se probó y por qué no*. No lo es cuando la
> entrada registra un hecho o un bugfix sin bifurcación real; escribir "ninguna" es ruido.
> *(Corregido el 2026-08-13: la cabecera lo declaraba obligatorio SIEMPRE y **28 de los 38 DDs no
> lo tienen** — contado. Una regla que incumple el 74% de los casos no es una regla, es una
> aspiración que enseña que la plantilla es opcional. Se ajusta la regla a lo que de verdad
> aporta, en vez de fingir que 28 entradas están mal.)*
>
> ```
> ## DD-N · YYYY-MM-DD — Título
> **Contexto** · qué problema/situación lo motiva.
> **Decisión** · qué se decide.
> **Razón** · por qué — el dato que decide, verificado (fichero/export/comando).
> **Descartadas** · cada alternativa considerada y por qué se rechazó.
> **Consecuencias** · qué cambia, qué queda pendiente, qué desbloquea.
> ```
>
> Las decisiones *load-bearing* de cada sesión aterrizan aquí (ver *Session-Close Protocol*
> en [`AGENTS.md`](../AGENTS.md)). `DECISIONS-LOG(-B).md` es el journal histórico de
> construcción — cerrado, no se re-litiga.
>
> Nota de adaptación: estas decisiones se tomaron durante la construcción y
> convergencia del sistema (anotaciones "(histórico)" donde el contexto lo
> requiere). Este repo es el resultado unificado: las rutas y comandos citados
> son los actuales.
>
> **Índice temático — cómo se compone una pantalla.** La razón vive en cada DD; esto solo
> apunta. Nace de medir que este log tiene 2.500 líneas ordenadas por FECHA y ninguna por tema,
> así que las reglas de composición estaban escritas y eran inencontrables al componer (DD-53).
>
> | Tema | DD |
> |---|---|
> | El «+» de crear es el botón de solo icono de primeng.dev, redondo, con borde y en gris, a la derecha de su control y a su alto · la misma fila que el «Añadir» de los dominios (`.control-add`) | DD-167 |
> | Importar contactos de un CSV, como en Voice: la plantilla (`nombre;teléfono`, con `;` y BOM) y una vista previa con lo que entra, cada error con su línea, los repetidos y lo que no cabe · `;` o `,`, UTF-8 o windows-1252 · tope de 5000 por agenda · entra sin guardar | DD-166 |
> | Repositorios dice cuántos hay de cada uno (la cifra del almacén que enseña su página; las de IA, las de Conversaciones), también en el nombre que oye el lector, y tiene buscador por nombre y descripción · los almacenes salen de su página a `repositories/state/` (enmienda DD-101 §2) | DD-165 |
> | El resumen de cada recurso en las fichas: una fila por agenda, plantilla o tipificación con su dato y «Editar» (`sc-resource-rows`), que lleva a su sitio (`?editar=` en Plantillas, `?buscar=` en cualquier repositorio) · «Editar» solo al editar · se ofrecen las agendas activas y la inactiva ya puesta · lo borrado no se cuenta ni se guarda (enmienda DD-101 §2 y §4, DD-105 §2) | DD-164 |
> | La agenda es una lista de contactos (nombre y teléfono) con su editor en su propia ruta, como las fichas; la fila del listado lo abre | DD-163 |
> | Elegir y ordenar columnas en un solo control nativo: el Listbox (casilla y arrastre) en el globo del icono; las cabeceras ya no se arrastran | DD-162 |
> | La cifra principal del resumen, con el degradado del botón principal y el anillo en el color de su texto: una por ficha | DD-161 |
> | Una tabla dentro de una sección llega al pie de la pantalla: tope medido desde donde empieza (`scLlegaAlPie`), con suelo | DD-160 |
> | En el listado de Grupos, la cifra de agentes abre su asignación y sale la columna «Asignar»; en Agentes, la de grupos ya llevaba a su sección | DD-159 |
> | El alta: ✓ solo en secciones con algo obligatorio, el teléfono saliente como segunda puerta del grupo y «Atrás / Siguiente» como el Stepper vertical | DD-158 |
> | Distribución y colas con el árbol del DS (canal = subsección, parte = slot), Chat en el orden de Teléfono y los mensajes de la cola plegados | DD-157 |
> | El estado del agente en su columna de la tabla de agentes del grupo; cada columna medida, y el panel las suma | DD-156 |
> | Tiempos con catálogo, cola Fija/Variable, horarios de atención por subcanal y música en un control | DD-152 |
> | Asignación desde la lista completa, filtro estable y confirmación colectiva desde dos cambios | DD-151 |
> | Canales permitidos del agente; intersección con grupo y enlace, aviso al retirar y compatibilidad en los selectores | DD-150 |
> | Habilitación por grupo separada de la presencia y de la cuenta; etiqueta compartida y recuento de habilitados en reglas | DD-149 |
> | Niveles 1–10 independientes de Teléfono y Chat; migración sin subir versión, prevalece el nivel nuevo; subestrategia de Chat y columnas por familia | DD-148 |
> | Asignación de agentes por tres familias; Chat engloba Web Chat y WhatsApp, con normalización sin borrar datos | DD-147 |
> | El resumen de la ficha de grupo lleva a su sección: el rótulo de cada tarjeta, a su sección, y cada fila, a su sitio en ella (el bloque del canal, el campo del número) · enlaces de verdad, en el primario, con manita y subrayado al pasar · la tarjeta no se pulsa entera · en el alta, como el índice (enmienda DD-126 §5) | DD-146 |
> | El nombre de la ficha, fijo arriba al bajar: una copia muda de la cabecera (`sc-nombre-fijo`), en su sitio a partir de 1340 y al quedar fija por debajo · la cabecera sigue siendo el `h1` y el sitio donde se edita el nombre · las anclas, apartadas `--sc-form-anchor-offset` · borrar pide escribir el nombre, con su prueba (enmienda DD-144) | DD-145 |
> | Las fichas en tres columnas que arrancan a la misma altura (índice, contenido y resumen): el título va en la columna del contenido · el resumen, sin rótulo a la vista (la región conserva su nombre) · «Eliminar», bajo el índice · por debajo de 1340, como estaba · una rejilla con áreas, sin mover nada en el DOM (enmienda DD-121 §2 y DD-122 §8) | DD-144 |
> | Las altas vuelven al índice de la edición (revierte DD-138): ✓ en la sección que se deja completa (`sectionsDone` de `sc-form-section-nav`) y el punto rojo en la que se deja sin lo obligatorio · «Atrás» y «Siguiente» al pie (`sc-alta-pie`), que llevan al principio de la sección nueva con el foco en su título · General sigue siendo la puerta del grupo · la sección no va en la dirección (enmienda DD-121 §11, DD-122 §1 y §4, DD-130 §2 y DD-136) | DD-143 |
> | Con Teléfono, el teléfono saliente es obligatorio (en el alta, al editar y al duplicar) y se elige de los números asignados (`OUTBOUND_NUMBERS`), sin escribir uno nuevo · «Caducar sesión» · la ayuda de Balanceada, corregida · Recursos sin Etiquetas, apagado y guardado (`conEtiquetas`) · el teléfono se nombra por su rótulo (enmienda DD-121 §11, DD-136 §2, DD-141 §4-5 y DD-133 §1) | DD-142 |
> | Las estrategias reparten conversaciones: «Menos conversaciones atendidas» (Teléfono) y «Menos conversaciones activas» (Chat) · lo guardado con un nombre de antes se lee con el de ahora (`normalize` de `createVersionedStorage`), sin subir la versión · la prioridad solo cuenta en las entrantes · fuera «Desbordar sesión», que se sigue guardando sin pantalla · cerrar el chat por inactividad nace con 5 min · el tamaño de cola, un texto por modo · la tipificación, sin su cuenta (enmienda DD-133 §1, DD-121 §5 y DD-135 §3) | DD-141 |
> | Un `sc-dialog` es UN diálogo para el lector: el `role="dialog"` modal es el `p-dialog` de PrimeNG, el que atrapa el foco, con el título de nombre y el subtítulo de descripción por `pt.root` · la card no repite el rol, ni lo que va dentro · un atributo en el host de `p-dialog` no llega a su raíz (enmienda DD-113) | DD-140 |
> | El estado de un agente es uno, el de Administración › Agentes, y el Dashboard lo lee por id con `PRESENCIA_EN_DASHBOARD` (Disponible · No disponible, sus motivos, Administrativo y Post-conversando son En pausa · Desconectado) · lo guardado del Dashboard se relee al pintar, sin subir la versión · fuera `DEMO_AGENT_PRESENCE` (enmienda DD-127 §1 y DD-129) | DD-139 |
> | Las altas van en pasos: el Stepper vertical nativo (`sc-alta-pasos`, de la app) con las secciones del índice, en su orden · la edición sigue con el índice · ✓ al dejar un paso completo · «Atrás» y «Siguiente», atajos · el paso no va en la dirección · la puerta de General del grupo sigue · el plegado es el de PrimeNG, y la línea entre pasos no se despega al plegar (`pt`) · **revertida por DD-143** | DD-138 |
> | El sidebar sigue a su tablero de Figma (14912:6324): sin botón de anclar · plegado sigue abierto lo que estaba abierto · texto e icono en blanco y la flecha al 60% · todos los iconos a 14, los que nombra el catálogo del tablero (14912:6774) · «Diseñador VUI» y «Análisis de Flujo» · SCC (CusCare) lleva el logo de CusCare (enmienda DD-118 §2 y §5) | DD-137 |
> | Un alta dice en su resumen lo que falta («Falta: nombre · extensión») y, cuando «Crear …» se enciende, «Listo para crear»: `sc-summary-status`, un solo `role="status"` que cambia en su sitio · sin porcentaje ni barra · un error de formato va en su campo · al editar, nunca «Listo» | DD-136 |
> | Con qué nace un grupo o un agente se fija en Contact Center (› Grupos, › Agentes), con las palabras de su ficha, y el alta lo lee · de fábrica, los valores del documento de producto (10 · 15 · 60 s, Baja, Balanceada, desbordar; el agente, todo menos la numeración especial) · la cola agotada sigue por el VUI | DD-135 |
> | Una ayuda bajo un campo dice lo que dicen las fuentes (manual de Voice, documento de producto) o no existe · va en el `helperText`, que la anuncia · `sc-select` pone sus `aria-*` en el elemento con foco · los desplegables del DS hablan el idioma de la app · fuera las ⓘ de la ficha de grupo | DD-133 |
> | Cuatro tipos de usuario (Superadmin, Administrador, Supervisor Online y Offline), cada uno con su plantilla de acceso · el alta nace Offline · al editar, cambiar el tipo pregunta · «Plantilla: X · N cambios» con «Volver a la plantilla» | DD-132 |
> | El panel rápido de agentes mide lo que lleva dentro (28rem mínimo, 5rem por canal) · sin columna de canal en un grupo de un canal, salvo que una fila llegue sin canal · la papelera dice «Quitar del grupo» · `sc-checkbox` desactivado, una sola opacidad (60 %) | DD-131 |
> | El pase de diseño de las fichas: en la franja el anillo junto a su cifra y los datos en dos columnas · las tres altas con su cabecera a la vista y «Crear …» · Guardar deja en la ficha · un usuario nuevo nace sin permisos · saltos por canal en Distribución y colas · el icono de un aviso con el peso de su texto · «Asignar» en el listado de grupos (enmienda DD-122 §8) | DD-130 |
> | El panel de grupos deja de inventar sus «conectados»: salen de `DEMO_AGENT_PRESENCE`, no de una cifra que escala con el número de colas del panel (enmienda DD-127) | DD-129 |
> | El botón `danger` de texto (el «Eliminar» de las fichas) sube de red-500 a red-600, mismo escalón que el sólido: cierra los tres últimos botones bajo AA de §1.8 | DD-128 |
> | Los datos de demostración del Dashboard cuadran: un solo estado por agente (`DEMO_AGENT_PRESENCE`) para la tabla, los anillos y su detalle · los disponibles no derivan en el latido · unos totales fijos al pie llevan raya arriba | DD-127 |
> | El resumen de las fichas como widget: la cifra con «/total» y el `p-progress-spinner` nativo a 42 (`sc-summary-kpi`), que cuenta y se llena al abrir y al cambiar, y nada con menos movimiento · anillo en toda proporción, oculto al lector (la cifra final va en texto oculto) · la tarjeta en el tinte de marca, con todo su texto en primario (el secundario no llega a AA sobre el tinte) · `theme-contrast` perdona el gris solo sobre sus fondos (enmienda DD-121 §3, DD-122 §8) | DD-126 |
> | La caja de sección: 17,5 arriba y abajo en las dos pieles (el aire vertical de los nodos era de más) · una lista con rayas las centra y no suma relleno fuera · en el monitor, la leyenda del anillo pegada a su cifra · R4: lo que apilan los envoltorios de dentro de una caja no llega a 7 | DD-125 |
> | Otro juego de datos para juzgar una pantalla: `?datos=tortura` estira textos y vacía la mitad de las descripciones, en sus propias claves y sin tocar los de siempre · `?datos=editorial` da a los grupos y a los servicios nombres de negocio y baraja los agentes generados, y el juego se elige en Configuración → Sistema · la tortura llega también a Conversaciones y a los widgets del Dashboard · en una tabla que se ajusta, las cifras miden su dato y el nombre recorta con «…» y el `title` · con un dato más largo que lo medido, la celda recorta con «…» y el texto entero en el `title` (matiza DD-102) | DD-124 |
> | Agrupar por espacio: escalera 7 · 14 · 28 (etiqueta→control · entre hermanos · entre grupos y antes del botón que envía), entre grupos al menos el doble que dentro · manda sobre la maqueta, y el Kit se apunta en figma-pendiente · lo mide `e2e/supervisor/agrupacion.spec.ts` · `sc-dialog` con cuerpo: la botonera a 28 y 14 entre hermanos | DD-123 |
> | Un solo índice en toda la app (`sc-form-section-nav`: fichas, constructor y Contact Center) · cada fila es un ENLACE a su sitio (ruta o `?seccion=`), la actual con `aria-current="page"` · clic navega, Cmd+clic abre otra pestaña, Atrás vuelve · en un alta la sección no deja rastro · un solo «Guardar» por ficha, con las secciones con cambios marcadas en el índice · agente y usuario al molde de la ficha de grupo (enmienda DD-121 §2 y DD-113) | DD-122 |
> | La ficha de grupo: índice lateral con 4 secciones (General · Distribución y colas · Recursos · Agentes) y resumen en tarjetas en una columna fija a la derecha (franja arriba por debajo de 1340) · la cabecera de la ficha va ENCIMA de índice y contenido (`.ficha-rail`; desde DD-144, en la columna del contenido) · Chat, casilla madre de Web Chat y WhatsApp · distribución y cola dentro de cada canal (`resolveGroup`) · la tabla de agentes del grupo gestiona composición: sin pausa, ≥1 canal, «Quitar» con un sentido · panel rápido de agentes desde el listado · el alta es la ficha en modo alta, con General de puerta · listado y valores por defecto por canal (enmienda DD-119 §2 §4, DD-101 §1 §2, DD-100 §3) | DD-121 |
> | Sidebar en producción: abrir una categoría no cierra las demás y nada se cierra al salir · plegado solo la rama de la página · se despliega con el ratón y se ancla con su botón · selección en cyan · subsecciones en 450ms con la curva de Apollo (enmienda DD-112 §3-§5) | DD-118 |
> | La cabecera del Dashboard: pestañas sin fondo con `⋮` y `+ Monitor` pegados; las acciones de la página en `p-toolbar` en tres grupos con `sc-divider` (enmienda DD-113 §6) · en modo pared un monitor sin widgets enseña su vacío y el carrusel se lo salta | DD-114 |
> | Cambiar de COLECCIÓN (se vacían búsqueda y selección) son pestañas `p-tabs`; filtrar la misma lista o elegir un valor son botones segmentados `sc-selectbutton` · un componente de primeng.dev entra NATIVO tal cual (doc entera con `tools/primeng-doc.mjs`, sin contador ni icono que el ejemplo no tenga) y un desvío de comportamiento lo para `audit:primeng-coupling` §F · un separador entre bloques es `sc-divider` salvo que su línea deba alinearse con el contenido · el Supervisor sin `ripple`, como primeng.dev | DD-113 |
> | El sidebar plegado mide 80px con las filas contenidas · un solo padre en cyan: el más cercano a la página que se vea · los hijos se pliegan en altura · el sidebar no se pliega durante el fundido de una navegación que inició él (lo que abre y cierra, en DD-118) | DD-112 |
| Una pantalla fuera del shell (acceso) va en `features/auth/` y en `EXENTAS` de `audit:page-anatomy` · un error de campo dice QUÉ falta, uno de credenciales no delata cuentas · un SSO de terceros es nuestro `sc-button` con su logo sin tocar · la contraseña es `sc-password` | DD-110 |
> | `<sc-panel severity="warn|danger">`: borde y anillo de 1 en `--sc-border-warning/danger`, decidido en código y pendiente en Figma · `<ng-template #header let-titleId>` para un título que es encabezado, con `[id]="titleId"` | DD-109 |
> | Una tarjeta con acciones en la cabecera es `<sc-panel>` con `<ng-template #icons>` (Panel de primeng.dev; Figma `panel` `Custom Icon=True`) · `[fill]` la estira al alto de su hueco · las piezas internas se estilan por `pt` con clases propias, no por `.p-panel-*` | DD-108 |
> | Un `borderWidth` del tema tiene la FORMA de Aura: si Aura pinta un lado (`0 0 1px 0`), nosotros también; si Aura dice `0`, sin borde · `p-tabs` como Aura 3: pestaña sin borde, tira con raya abajo, marca de la activa en `activeBar` · lo vigila `preset-border-shorthand.test.mjs` | DD-107 |
> | Un campo que ACUMULA valores de una lista es un `sc-multiselect` con chips, no un `sc-select` que se vacía más pastillas debajo · la casilla de «todos» de `sc-multiselect` marca y desmarca (`[selectAll]="null"` contra PrimeNG 22.1.0) · una sección no se llama ni se dibuja como una página del menú | DD-105 |
> | Una miga que navega pasa `routerLink`, no un `command` · el tramo pulsable lleva manita y subrayado en hover (lo pone `sc-breadcrumb`) | DD-103 |
> | Una lista nunca corta texto: columnas cortas con el ancho MEDIDO de su dato y `<sc-list-page tableMinWidth>`; por debajo, la tabla se desplaza de lado · un dato más largo que lo medido recorta con «…» y el `title` (DD-124) | DD-102 |
> | Los editores agente↔grupo: una columna por canal con `sc-checkbox`, elegir varios con la barra en lote, «Añadir» con `sc-select` · una asignación de repositorio es un `sc-multiselect`, no una tabla · se juntan secciones que responden la misma pregunta | DD-101 |
> | Las fichas de agente, grupo y usuario usan el molde de Contact Center: `.page__inner--rail`, índice sin cajas, tarjeta `surface="card"` con `.sub-section`, interruptor delante con su ayuda visible, «Deshacer» solo con cambios | DD-100 |
> | Todo suelo de pantalla es `--sc-bg-canvas` (las tarjetas, `--sc-bg-surface`) · el color de pantallas y componentes va por rol, nunca `--sc-color-*`, a pelo ni `.sc-dark` a mano: el oscuro vive en la capa 7 · lo vigilan `tokens:guard` (regla 8) y `theme-contrast` | DD-99 |
> | Una pantalla de lista se monta sobre `<sc-list-page>`: la pantalla pone columnas, celdas, acciones y diálogos; la pieza, título, barra, tabla, selección y menú de fila · un `computed` con `translate.instant()` LEE el idioma (`injectLangChange`) | DD-98 |
> | El clic derecho en una fila abre su menú en el puntero (lo hace `sc-datatable`, en todas las tablas) · el estado de un agente se cambia con un botón compacto y su lista, como el dialpad | DD-96 |
> | Una lista de tabla lleva `.page--tabla` y `<sc-datatable scrollable scrollHeight="flex" virtualScroll>`: la tabla hace scroll dentro, se ajusta a sus filas y con más de 100 pinta solo las visibles | DD-95 |
> | TopBar y bloque del logo con el mismo `scale/4` (56) · tallas de dentro con tokens del DS · barra → título `1-25`, lados `2`, buscador → tabla `0-875` · una barra `sticky` necesita que ningún antepasado tenga `overflow: auto` | DD-94 |
> | Título de página → contenido `scale/1` en las 13 pantallas · una miga dentro de una barra va `flush` (la barra pone el aire) | DD-90 |
> | Cabecera fija al scroll de la página con `<sc-datatable stickyHeader>` · ninguna caja por encima con `overflow: hidden` (usa `clip`) · una etiqueta no se parte, recorta | DD-80 |
> | Una lista de destinos es el `Menu` del DS en línea · lo que dice Aura lo sigue el código y Figma se revincula | DD-78 |
> | Un estado es `sc-tag` con severidad y un contador `sc-badge` · una pastilla dibujada por la pantalla la caza `hand-made-pieces` | DD-77 |
> | Un valor categórico en una celda es `sc-tag` secundario del DS · nada en monoespaciada en el producto (sí en sc-docs) · el ancho de columna se mide | DD-76 |
> | El texto de una celda va en SU envoltorio con su clase · suelto en el `<td>` hereda los 16 del documento | DD-71 |
> | El estilo de texto se pone por su NOMBRE (`.sc-text-*` en la plantilla) · tokens sueltos solo donde la clase no puede | DD-69 |
> | Los 12 text styles son los ÚNICOS · pesos 400 y 600, y un `font-size` sobre un glifo no es texto | DD-67 |
> | El vocabulario de dentro de la pantalla se declara UNA vez · lo vigila `audit:screen-vocabulary` | DD-65 |
> | El título de una pantalla con rail va DENTRO de su sección · `sc-section-card` es la única caja | DD-57 |
| Cada piel de `sc-section-card` trae las medidas de SU nodo · el maestro del DS manda en la gris | DD-61 |
| Los estilos de texto se ponen a lo que NO es un componente · un `<sc-*>` no lleva `.sc-text-*` encima | DD-55 |
| Qué escala tipográfica manda (la de la librería del DS) y qué se rompió al elegirla | DD-54 |
| Anatomía de página en `_page.scss` · el constructor entra en el molde · la barra sticky del trío admin es deliberada · escritorio primero · `DD#` no es `DD-` | DD-53 |
> | El índice del rail envuelve en vez de recortar el nombre de su destino | DD-52 |
> | El lienzo de la app es blanco | DD-45 |
> | Patrón de campo compartido, sin `ControlValueAccessor` | DD-44 |
> | Siete divergencias deliberadas entre flujos, que NO se unifican | DD-36 |
> | `--sc-bg-default` es el suelo del shell, nunca una superficie | DD-34 |
> | El título de página vive en el cuerpo; la identidad, en el breadcrumb | DD-33 |

---

## DD-167 · 2026-10-05 — El «+» de crear es el botón de solo icono de primeng.dev, redondo y con borde, junto a su control

**Contexto.** Decisión de producto del 2026-10-05, al ver Recursos: el «+» de añadir es una variante del botón, la de
solo icono de primeng.dev («Icon Only»), en cada sitio donde haya un «+» solo. Medido ese día:
- **dónde hay:** cinco, todos en Recursos de la ficha de grupo (tipificación, agendas, plantillas de chat y de email, y
  el de Etiquetas, apagado por DD-142). La ficha de agente no tiene ninguno, y los demás «+» de las apps llevan rótulo;
- **cómo eran:** para PrimeNG ya eran de solo icono (`p-button-icon-only`), pero de texto y `sm` (28 × 27, sin borde ni
  fondo en reposo), y flotaban sobre el rótulo. Se veían como un «+» suelto, a 1,5 px del control y con su centro 31 px
  por encima del de él.

**Decisión.**
1. **El «+» es la fila «rounded» + «outlined» del «Icon Only» de primeng.dev, en gris** (`secondary`), para no competir
   con «Guardar»: `<sc-button icon="add" [rounded]="true" appearance="outlined" variant="secondary" [ariaLabel]="…">`.
   Con `rounded`, PrimeNG iguala el alto al ancho: un círculo de 31,5 (el ancho de solo icono del Kit), sin el
   31,5 × 32,5 de DD-91. El nombre va en `ariaLabel`, como pide la sección de accesibilidad de la doc, y el tooltip lo
   repite al pasar el ratón.
2. **Va a la derecha de su control, a su alto.** Control y «+» comparten fila (`.control-add`): alineados arriba, con
   7 de hueco, y el control se estira. Medido a 1440 y a 1366: un círculo de 31,5 junto a un control de 32,5, con los
   centros a 0,5 px. Es la regla que ya tenía el «Añadir» de los dominios del chat, que pasa de `.domain-add` a
   `.control-add`: una regla con dos usos.
3. **El rótulo queda solo.** Sale la fila que sacaba el botón del flujo (`.field__label-row`).
4. **El glifo se lee**: 4,52:1 en claro y 6,91:1 en oscuro, y un icono pide 3:1. El borde es el del botón secundario
   con borde del DS, el mismo del «Añadir».

**Razón.** Con forma visible, el «+» no cabía junto al rótulo: quedaba a medio píxel del control, y la casa pide 7. A
la derecha del control es el patrón de elegir uno o crear uno nuevo, y a su alto se lee como parte del campo.

**Descartadas.**
- Las demás filas de la doc: la de relleno pesa más que el control al que acompaña, y la de texto sin borde es la que
  se veía como un «+» suelto.
- Dejarlo junto al rótulo con forma visible: queda pegado al control.
- La fila con sombra: `sc-button` no expone `raised`, y una sombra no es de un control de formulario.

**Consecuencias.** Precisa DD-121 §7 («cada una con su "+"»). DD-140, un diálogo por «+», no cambia.
`ficha-recursos-dialogos` busca los «+» por su nombre y prueba las clases, el círculo del Kit, el hueco y los centros.
La página de Button de sc-docs aún no tiene una sección «Solo icono» como la de primeng.dev: queda pendiente.

## DD-166 · 2026-10-04 — Importar contactos a una agenda desde un CSV, como en Voice

**Contexto.** La revisión de producto del 2026-10-04: hoy una agenda se llena descargando una plantilla e importándola
(manual de usuario de Voice), y había que replicarlo o inventar algo.

**Decisión.**
1. **«Importar»**, junto a «Añadir contacto», abre un diálogo con la ayuda del formato, «Descargar plantilla» y «Elegir
   archivo».
2. **La plantilla es la cabecera y nada más** (`nombre;teléfono`, en el idioma de la app), con `;`, que es lo que
   espera Excel en español, y con BOM, para que Excel la abra como UTF-8. Sin filas de ejemplo: se importarían si nadie
   las borra.
3. **Antes de añadir nada, la vista previa dice qué entra** («Se añadirán N contactos»), cada línea con error con su
   número («Línea 3: el teléfono no es válido»; las 20 primeras, y de las demás cuántas son), los repetidos (los que ya
   están en la agenda o salen dos veces en el archivo, comparados por sus cifras) y lo que no cabe. Las reglas son las
   del diálogo de un contacto: nombre obligatorio y el teléfono de DD-163.
4. **Lo importado entra en el formulario**, arriba y sin guardar: Guardar y Deshacer, como un contacto añadido a mano.
5. **Se lee lo que guarda una hoja de cálculo**: `;` o `,` (el de la primera línea con datos), campos entre comillas
   con `""`, el BOM, la cabecera en los cuatro idiomas y las líneas vacías. El archivo se lee en UTF-8 y, si no lo es,
   en windows-1252: Excel en español guarda así, y leído en UTF-8 «Señal» llegaba como «Se�al».
6. **Tope de 5000 contactos por agenda** (`TOPE_DE_CONTACTOS`): la cuota de localStorage es una para todos los
   almacenes, y lo que la pasa se pierde sin avisar.

La lógica es pura y tiene su unitaria (`parsearContactosCsv`, `decodificarCsv` y `plantillaCsv`, en
`agenda-contacts.core.mjs`).

**Razón.** Es el flujo que ya se conoce, y la vista previa evita importar a ciegas: quien sube un archivo con errores
sabe qué líneas corregir antes de que entren.

**Descartadas.**
- Leer `.xlsx`: pide una librería de lectura, y Excel guarda CSV (la plantilla ya se abre con él).
- Importar sin vista previa: los errores y los repetidos se perdían en silencio.
- Un campo entre comillas que parte la línea: un contacto no lo necesita, y el lector queda más simple.

## DD-165 · 2026-10-04 — Repositorios dice cuántos hay de cada uno, y tiene buscador

**Contexto.** La revisión de producto del 2026-10-04, sobre el hub de Repositorios: se queda como está (DD-77, DD-78),
con un dato más (cuántas agendas hay, que de horarios no hay ninguno) y un buscador.

**Decisión.**
1. **Cada fila dice cuántos hay**, a la derecha y en el gris de su descripción (texto de leyenda, cifras tabulares),
   con el separador de miles del idioma. La cifra es la del almacén que enseña su página: las tres de IA llevan a
   Conversaciones y cuentan lo que hay allí (reglas, entidades y categorías), no los repositorios de IA de antes.
2. **El lector la oye.** El Menu nombra cada fila con `item.label` (DD-78), así que `label` es «Agendas (9)» y lo que
   se ve va aparte. La cifra pintada se oculta al lector, para no decirla dos veces.
3. **Un buscador** encima, por nombre y descripción, en minúsculas y por subcadena, como en las listas. Un grupo sin
   filas no sale; sin ninguna, el vacío de búsqueda, con «Limpiar búsqueda».
4. **Los almacenes de horarios, tipificaciones, variables, entidades e intenciones salen de su página** a
   `repositories/state/`, como el de agendas (DD-163): el hub y las fichas leen el almacén sin cargar la lista.

Enmienda DD-101 §2: en el hub hay cifras, que dicen dónde hay algo y no hay que leerlas para descartar.

**Razón.** Una cifra junto a cada destino dice dónde hay algo antes de entrar, y con once destinos un buscador ahorra
recorrerlos. Lo que oye el lector tiene que decir lo mismo que se ve.

**Descartadas.**
- La cifra en un `sc-badge`: el del DS es de aviso (8,75 px de letra; 10,5 en `lg`), por debajo de los 12 de la
  descripción que tiene al lado. Medido en la página.
- Contar los repositorios de IA de `instances/` (reglas IA y compañía): las filas no llevan a ellos.

## DD-164 · 2026-10-04 — El resumen de cada recurso, con «Editar»: una fila por agenda, plantilla o tipificación

**Contexto.** La revisión de producto del 2026-10-04, sobre Recursos de las fichas de grupo y de agente: cada recurso
asignado era un chip con su nombre (DD-105 §2), sin nada que dijera qué es (una agenda de 3 contactos y otra de 1.250
se veían iguales) ni cómo llegar a editarlo, y se pidió poder ir desde ahí a editar la agenda. Medido además: las dos
fichas ofrecían agendas inactivas, y contaban (y guardaban de vuelta) las ya borradas en Repositorios, cada una
calculándolo a su manera.

**Decisión.**
1. **Bajo cada campo, una fila por recurso** (`sc-resource-rows`, pieza de la app): su nombre, un dato y «Editar», con
   un nombre accesible que dice de cuál es («Editar Ventas Nacional»):
   - agenda: cuántos contactos y su estado («1250 contactos · Activa», la cifra con el separador del idioma) → su
     editor (DD-163);
   - plantilla: el principio de su texto, que es lo que dice qué es (el campo ya dice el canal) →
     `/admin/plantillas?editar=<id>`, que abre su panel en su pestaña. Al cerrarlo, la dirección deja de pedirlo sin
     apilar otra entrada;
   - tipificación: cuántas tiene su categoría → `/admin/tipificaciones?buscar=<categoría>`. `sc-repo-list-page` siembra
     su búsqueda con `?buscar=` al entrar, así que vale para cualquier repositorio. Es la búsqueda de siempre, por
     subcadena: «Venta» encuentra también «Ventas».
2. **Las filas sustituyen a los chips, y el desplegable sigue para elegir.** Dice cuántos («3 agendas»,
   `maxSelectedLabels=0`) sin repetir los nombres de las filas. Etiquetas, en la ficha de agente, sigue con chips: su
   color es el dato.
3. **«Editar», solo al editar.** Entonces la dirección lleva la sección (`?seccion=recursos`) y Atrás vuelve a Recursos.
   En un alta, y al duplicar, la dirección no la lleva (DD-143) y Atrás caería en una ficha vacía: las filas se quedan
   como resumen, sin «Editar».
4. **Lo que se ofrece y lo que cuenta sale de un sitio** (`features/admin/services/recursos.core.mjs`, con su
   unitaria), y las dos fichas lo usan:
   - se ofrecen las agendas activas, y las ya puestas aunque estén inactivas. Puesta, una inactiva no se apaga (como
     los horarios): apagada, no se podría quitar;
   - lo borrado en Repositorios sale del modelo al leer la ficha, ANTES de marcarla como guardada. Así no se ofrece, no
     se cuenta (ni en «3 agendas» ni en la cifra de Recursos del resumen) y no se guarda de vuelta, y la ficha no abre
     con cambios por ello. La tipificación cuenta solo si a su categoría le queda alguna.

Enmienda DD-101 §2 (en Recursos hay cifras: dicen qué es cada cosa, no hay que leerlas para descartarla) y §4, y
DD-105 §2 (en Agendas y Plantillas, filas en vez de chips).

**Razón.** La pregunta de Recursos es qué tiene asignado el grupo o el agente, y un nombre no la responde: el dato que
dice qué es cada cosa, y el camino para cambiarla, sí. Medido a 1366 y a 1440: la fila cabe en media columna de la
rejilla de Recursos (319 px a 1366, con el nombre entero y el dato recortado), así que el campo no pasa a ocupar las
dos.

**Descartadas.**
- Editar el recurso en un diálogo dentro de la ficha: serían dos editores del mismo objeto, y el de la agenda es una
  página con su tabla.
- Una tarjeta por recurso: caja dentro de caja (`audit:screen-vocabulary`).
- Un filtro por categoría en Tipificaciones: `?buscar=` sirve para cualquier repositorio sin otro control.

## DD-163 · 2026-10-04 — La agenda es una lista de contactos, con su editor

**Contexto.** La revisión de producto del 2026-10-04, sobre Recursos. Una agenda es lo que el agente ve en la sección
Agenda de su teléfono, cada número con su nombre, y lo que se hace con ella es dar de alta contactos, cambiarlos y
guardarlos. En el prototipo era un texto con números separados por comas (`numbers`), sin nombres, que se editaba en
un panel sobre la lista. La agenda del Comunicador (`agent-mini`, `ContactRow`) ya pinta ese par nombre–teléfono.

**Decisión.**
1. **Una agenda es `contacts: { id, name, phone }[]`.** Lo guardado con `numbers` se pone al día al leerlo
   (`normalize`, sin subir la versión del almacén): cada número es un contacto con el nombre vacío, que la vista pinta
   «Sin nombre» hasta que alguien lo edite. Un número repetido entra una vez.
2. **Tiene su editor**, en `admin/agendas/crear` y `admin/agendas/editar/:id`, como las fichas:
   - Guardar y Deshacer arriba;
   - la guarda de cambios sin guardar, y el cerrojo entre pestañas;
   - abrir una fila del listado lleva a él, y «Crear» también. `RepoPageConfig.editRoute` lo enciende en el
     listado genérico de repositorios.
3. **Los contactos, en una tabla dentro de su sección** (DD-160), en su propio componente:
   - buscador, paginador y menú de fila (Editar, Eliminar). Se busca en el nombre y en el teléfono, y un teléfono
     también por sus cifras, como se comparan los repetidos: «900100200» encuentra «900 100 200»;
   - buscar vuelve a la primera página, y añadir también. Para eso `sc-datatable` gana `first`, el nativo de `p-table`:
     el paginador de PrimeNG solo retrocede una página cuando la abierta queda fuera de rango, así que desde la tercera
     un resultado corto dejaba la tabla en blanco. La tabla de agentes de la ficha tenía el mismo fallo con su buscador
     y su filtro, y lo arregla igual;
   - «Añadir contacto» va en un diálogo con el mismo formulario que los «+» de Recursos, y el contacto nuevo sale el
     primero: al final, en la agenda grande caería en la última página, sin que se viera;
   - la tarjeta llega al pie de la pantalla, como la de Agentes. Con dos tablas, la regla deja de ser de una y sube a
     `.table-card--al-pie` (`styles/_sc-list-table.scss`), y la variable con la que el panel rápido cambia el tope
     pasa de `--assign-table-max` a `--table-card-tope`.
4. **Regla de contacto:**
   - todo contacto que se crea o se edita lleva nombre;
   - el teléfono admite un `+` y de 3 a 15 cifras, con espacios, guiones, puntos o paréntesis, así que caben
     extensiones y números cortos;
   - un teléfono no se repite en la agenda, y se compara solo por sus cifras: «900 100 200» y «900-100-200» son el
     mismo.
5. **El listado dice cuántos contactos tiene cada agenda**, con el separador de miles de cada idioma (`Intl`).

**Razón.** El dato es el contacto, no la lista de números: el agente busca por nombre. Una ruta propia hace que Atrás
vuelva a donde se estaba y que la guarda avise, como en las fichas. Paginador y no lista virtual porque es la tabla de
una sección con campos encima, como la de Agentes de la ficha: la lista virtual pide un alto fijo que aquí no hay.

**Descartadas.**
- Un campo de texto con «nombre: número» por línea: no se busca, no se valida y no escala.
- Subir la versión del almacén para cambiar la forma: borraría lo guardado (AGENTS, «normalize»).
- Seguir editando en el panel sobre la lista: no cabe una tabla de contactos, y Atrás no vuelve a ningún sitio.

## DD-162 · 2026-10-04 — Elegir y ordenar columnas en un solo control nativo: el Listbox en el globo del icono

**Contexto.** Desde DD-153 las columnas se elegían en el icono de la barra (el MultiSelect del ejemplo «Column
Toggle») y se ordenaban arrastrando las cabeceras de la tabla (`reorderableColumns` de `p-table`): dos controles
nativos, en dos sitios, para una misma tarea. La revisión de producto del 2026-10-04 pidió un solo control nativo de
PrimeNG y sin arrastrar cabeceras. Se valoraron Listbox y PickList con su documentación entera (`tools/primeng-doc.mjs`)
y contra tres SaaS de referencia: Airtable y Notion usan una sola lista con casilla y asa; HubSpot, dos columnas en un
modal («elegir» y «seleccionadas»), que es PickList, porque ofrece cientos de propiedades con buscador.

**Decisión.**
1. **El icono (`view_column`) es un botón del DS que abre un globo (`p-popover`) con el Listbox nativo**, con
   `multiple`, `checkbox` y `dragdrop`: la casilla elige qué se ve y arrastrar ordena, en la misma lista y en el orden
   de la tabla. El botón dice en su nombre cuántas se ven («Columnas, 7 de 10») y si el globo está abierto
   (`aria-expanded`).
2. **Las cabeceras ya no se arrastran**: un solo sitio para elegir y ordenar. Los anchos se siguen ajustando en la
   cabecera.
3. **Del nativo, tres entradas** (sin CSS sobre `.p-*`): sin la casilla de «todas» (`showToggleAll`: no tiene rótulo
   y, con una columna fija, no las quita todas), sin tope de alto (`scrollHeight="none"`: son pocas, se ven todas) y sin
   su borde ni su sombra (`dt` de la instancia: la caja ya la pone el globo). La columna fija sale marcada y apagada.
4. **Lo que se guarda no cambia**: visibles, orden y anchos en `localStorage`, con `normalizePrefs` (las fijas vuelven
   a su sitio aunque se suelten encima). Enmienda DD-153 (el orden, arrastrando las cabeceras).

**Razón.** Listbox es el control de Airtable y Notion para lo mismo: con 8 a 12 columnas, una lista corta en un globo
se usa sin salir de la tabla. PickList obliga a un modal ancho y a dos gestos por columna (pasarla y ordenarla); compensa
con decenas de columnas y buscador, que no es el caso. Si un listado llega ahí, se cambia a PickList.

**Coste.** Ordenar es arrastrar, como antes con las cabeceras: con teclado se elige pero no se ordena (tampoco antes).
`sc-multiselect` conserva su variante de solo icono (DD-153) en el DS, sin uso en el supervisor.

**Descartado.** PickList (ver Razón); dejar los dos controles; un control a medida con asas propias
(`sc-column-selector`, que ya existe en el DS sin uso y no es nativo).

**Actualización (2026-10-05)** · Se ordena sin arrastrar (WCAG 2.1.1 y 2.5.7), y se cierra el «Coste». Medido antes:
con el teclado ni siquiera se elegía. El globo cuelga de `<body>` y, al abrirlo con Intro, el foco se quedaba en el icono
y Tab seguía por la página.
- **El foco entra en la lista** al abrir: `p-popover` enfoca lo que lleve `autofocus`, y se lo pone el `<ul>` del Listbox
  (`pt.list`). Al cerrar con el foco dentro (Escape), vuelve al icono.
- **«Subir» y «Bajar»**, bajo la lista, mueven la última columna enfocada, la de las flechas; su nombre la dice («Subir
  Email»), y el lector oye a qué puesto llega. No pasan por encima de una fija. Son primarios de texto: el secundario de
  texto mide 2,58:1 en claro. Arrastrar sigue igual; los dos caminos mueven con la misma función.
- **El teclado del Listbox es el nativo**, con dos arreglos alrededor, medidos en PrimeNG 22.1:
  - su `aria-activedescendant` no se rellenaba nunca: lo calcula un `computed` que lee primero `focused`, que no es una
    señal, y sin foco no llega a leer la opción. Las flechas movían el foco y el lector no oía nada. Se escribe desde su
    señal, `focusedOptionId`;
  - Tab desde la lista se quedaba en un elemento invisible de PrimeNG (el que lleva al buscador, que aquí no hay). Si se
    queda ahí, el foco sigue a «Subir».
- **Pruebas:** `columnas-en-una-lista` gana dos, en rojo antes: todo con el teclado (entrar, elegir con flechas, subir,
  bajar, Escape) y subir con el ratón hasta debajo de la fija, que se queda al volver.

## DD-161 · 2026-10-04 — La cifra principal del resumen, con color: el degradado de la vista previa de ProgressSpinner

**Contexto.** La revisión de producto del 2026-10-04 pidió para el resumen de las fichas la imagen de la vista previa
de ProgressSpinner en primeng.dev: una tarjeta con degradado y color, la cifra grande y el anillo que se llena. El
widget ya era ese ejemplo pasado a nuestros tokens (DD-126): cifra, «/total», anillo nativo y cuenta al abrir y al
cambiar. Lo que faltaba era la imagen: todas las tarjetas llevaban el mismo tinte claro.

**Decisión.**
1. **Una tarjeta destacada por resumen, la cifra principal**: agentes habilitados del grupo (también en el alta),
   grupos activos del agente y secciones del usuario. `sc-summary-kpi` gana `destacada`. Las demás siguen con su
   tinte: si todo destaca, nada destaca.
2. **El degradado es de los tokens del botón principal** (`--sc-bg-primary-active` → `--sc-bg-primary` →
   `--sc-bg-primary-hover`, a 135°) con `--sc-text-inverse` encima, y la sombra de tarjeta (`--sc-shadow-card`). Es el
   par que ya usa el botón principal en claro y en oscuro, así que el texto llega a AA sobre los tres tonos; en
   oscuro, la tarjeta es celeste con el texto oscuro. Ningún token nuevo.
3. **El anillo y las barras, en el color del texto**, sobre una pista translúcida del mismo color (`color-mix` al
   25 %): el arco del anillo por `dt` de la instancia y la pista por una clase propia en `pt` (DD-108); la pista de
   cada barra, por `dt` de su `p-metergroup`. El icono de cada canal y el aviso «Sin agentes», con su icono, toman el
   color de la tarjeta: el ámbar no llega a 3:1 sobre el degradado (en oscuro, 1,37:1), y el aviso sigue siendo icono
   y palabra. Bajo el degradado, el tono central como color de fondo: lo que queda si la imagen no se pinta.
4. **El movimiento no cambia**: el nativo del anillo (0,3 s) y la cifra que cuenta, al abrir y al cambiar; con menos
   movimiento, quietos (DD-126).

**Razón.** Es la imagen pedida sin salir del sistema: el color de marca dice cuál es la cifra que importa (AGENTS «UX
de pantalla» 1: color con significado, aquí jerarquía), y el par fondo-texto ya está probado en el botón principal.
Medido en claro y en oscuro, en grupo, alta de grupo, agente y usuario: cifra y rótulo a 4,5:1 o más sobre el tono
más difícil del degradado, y el arco a 3:1 o más (`resumen-destacado`).

**Descartado.** Un verde como el del ejemplo (no es color de marca y aquí significaría «éxito»); destacar todas las
tarjetas; tokens de degradado nuevos (el Kit no los tiene: van a `figma-pendiente` si se quieren propios).

## DD-160 · 2026-10-04 — Una tabla dentro de una sección llega al pie de la pantalla, medida desde donde empieza

**Contexto.** La revisión de producto del 2026-10-04, con una captura de la sección Agentes de la ficha de grupo: la
tabla desplazaba por dentro (DD-95) y, a la vez, debajo de su tarjeta quedaba pantalla vacía. Su tope era
`100dvh − 420 px`, una constante que no sabía dónde empieza la tabla. Medido el 2026-10-04 en los grupos 1, 2 y 11:
- a 1440×900, 158 px vacíos bajo la tarjeta mientras la tabla escondía 180 px de filas;
- a 1512×945, los mismos 158 px vacíos, con 137 px de filas escondidas;
- a 1280×720, al revés: la página entera desplazaba de 85 a 149 px.
Se pidió como norma: si una sección necesita más sitio, que aproveche el resto de la pantalla.

**Decisión.**
1. **El tope se mide**: la directiva `scLlegaAlPie` (`core/directives`) pone en el elemento `--llega-al-pie`, el
   alto que le deja la zona que desplaza (`main`) sin que esta desplace: su alto visible, menos lo que hay encima del
   elemento (medido en el contenido, da igual cuánto se haya bajado) y lo que hay debajo (lo que va apilado debajo en
   cada antepasado, sus márgenes, rellenos y bordes; no el final de la zona, que la ficha estira a toda la pantalla).
   Se rehace en cada pintado y al cambiar la ventana. Un nombre sin `--sc-`: es una medida de la app, no un token.
2. **La tabla de agentes del grupo la usa** con su suelo de siempre (`scale/18`); el panel rápido sigue con su
   `--assign-table-max` (hoy `--table-card-tope`, de la clase `.table-card--al-pie`: DD-163).
3. **Norma en AGENTS.md (UX de pantalla, punto 10)**, con su prueba: con 2 px más de tabla, la página desplaza.

**Razón.** Medido después, en los mismos casos: a 1440×900 la tabla pasa de 480 a 594 px y la página no desplaza; a
1512×945, de 525 a 639. Bajo la tarjeta quedan 44 px, su margen (21) y el relleno de la página (24,5), como en
cualquier otra pantalla. Es lo que hacen las vistas de tabla de los SaaS de referencia (Airtable, Notion, HubSpot): la
tabla ocupa el alto disponible, con la cabecera fija y el paginador al pie.

**Coste.** A 1280×720 la tabla se queda en su suelo y la página desplaza de 37 a 101 px (antes, de 85 a 149): en
pantallas bajas, el suelo manda.

**Descartado.** Otra constante mejor elegida (fallaría en cuanto cambie lo de encima: el aviso de otra pestaña, el
filtro); que la página desplace y la tabla mida todas sus filas (se pierde la cabecera fija de DD-95).

## DD-159 · 2026-10-04 — La cifra de un listado lleva a donde se cambia: en Grupos, los agentes abren su asignación

**Contexto.** La revisión de producto del 2026-10-04, sobre los listados de Grupos y Agentes: en Grupos, la cifra de
agentes (que al pasar enseña quiénes son) y el botón «Asignar», fijo a la derecha (DD-121 §10, DD-153), eran dos
columnas para lo mismo. En Agentes se pedía que la cifra de grupos llevara a la sección «Grupos asignados» de su
ficha: ya lo hacía, porque abrir una fila de Agentes lleva a esa sección (DD-122).

**Decisión.**
1. **En Grupos, la cifra de agentes abre el panel rápido de ese grupo**, y la columna «Asignar agentes» desaparece.
   Al pasar por encima o con el foco, la cifra sigue enseñando quiénes son; al pulsarla, el globo se cierra y se abre
   el panel. Su nombre accesible dice las dos cosas: «12 agentes · Asignar agentes de ACD demo cuscare». La columna
   «Agentes» pasa a fija en el selector, como lo era «Asignar»: es la tarea más frecuente del listado. Pulsarla no
   abre la ficha (`stopRowClick`). Enmienda DD-121 §10 y DD-153 («Asignar» fija a la derecha).
2. **En Agentes no cambia nada**: la prueba nueva fija que la cifra de grupos lleva a «Grupos asignados».
3. **DS: `sc-group-popover` gana `activated`**, la salida al pulsar la cifra (clic, Intro o Espacio). Sin nadie que
   la escuche, pulsar solo cierra el globo.

**Razón.** Una acción por dato: la cifra es a la vez el resumen y la puerta para cambiarlo, como en las tablas de
Airtable o Notion, donde el contador de una relación abre la relación. La fila pierde una columna de 7,5rem.

**Descartado.** Llevar la cifra a la sección Agentes de la ficha (el panel rápido es justo para no salir del
listado); dejar las dos columnas.

## DD-158 · 2026-10-04 — El alta: ✓ solo donde hay algo obligatorio, el teléfono saliente como puerta y el pie del Stepper

**Contexto.** La revisión de producto del 2026-10-04, sobre las tres altas (DD-143):
- el ✓ del índice salía en Recursos o en Agentes solo por pasar por ellas: no comprobaba nada. Medido el 2026-10-04:
  lo llevaban Agentes y Recursos del grupo, Grupos asignados del agente y Acceso del usuario;
- en el alta de grupo había dos controles, el nombre y el teléfono saliente, pero solo el primero era puerta: sin
  teléfono saliente se seguía a Recursos y a Agentes, y la falta quedaba para el final (DD-142 la quiso libre);
- «Atrás» y «Siguiente» iban en los extremos de la fila, contorneados y con flecha, a 658 px uno del otro. La
  referencia que se pidió es el Stepper vertical de primeng.dev: «Back» secundario y «Next» principal, juntos.

**Decisión.**
1. **✓ solo en la sección con algo obligatorio** que se deja completa. `seccionesDeAlta` gana `obligatoria(id)`, y
   cada ficha la dice: el grupo, General y, con Teléfono, Distribución y colas; el agente y el usuario, Identidad. La
   que no tiene nada obligatorio no lleva nunca ✓ ni punto: no hay nada que dar por bueno ni nada que falte.
2. **El teléfono saliente es la segunda puerta del alta de grupo**: con Teléfono y sin él, ni «Siguiente» ni el
   índice pasan de Distribución y colas; se queda en ella, lo dice bajo el campo y lleva el foco al campo. Se puede
   volver a General (donde se quita Teléfono), y saltar desde General a Recursos o a Agentes lleva a Distribución.
   Al editar sigue sin puerta: el punto rojo y «Guardar» apagado bastan. Enmienda DD-142 («no es puerta»).
3. **El pie, como el Stepper vertical, con los botones del DS**: juntos a la izquierda, «Atrás» `secondary` y
   «Siguiente» el principal, rellenos, a su tamaño y sin icono; entre ellos, 10,5, el de una botonera del DS (el pie
   de `sc-dialog`), y no los 8 del ejemplo. Enmienda DD-143 («Siguiente», a la derecha y contorneado).

**Razón.** Un ✓ que sale por pasar enseña a no fiarse de los que sí comprueban algo. Con dos puertas, el alta de grupo
llega a Recursos y Agentes con lo único obligatorio ya resuelto, y lo que queda es libre. El pie del Stepper deja claro
cuál es el paso esperado, y «Crear grupo» de arriba sigue siendo la única acción que crea.

**Descartado.** El ✓ en todas las secciones visitadas (lo de antes); hacer puerta también al editar (al editar se va
por el índice y no hay pasos); los 8 px del ejemplo entre botones.

## DD-157 · 2026-10-04 — Distribución y colas, con el árbol del DS: cada canal una caja, cada parte un slot, y los mensajes de la cola de vuelta

**Contexto.** La revisión de producto del 2026-10-04 pidió tres cosas de esta sección:
- «Distribución» pesaba lo mismo que la etiqueta «Estrategia» y no parecía una parte de Teléfono: cada canal era una
  `.sub-section` sobre la tarjeta blanca, sus partes un rótulo de 12 px gris y los canales, separados por un divisor;
- Chat partía su cola con el acceso en medio (horario, dominios, script y número entre la distribución y la cola);
- la música de espera iba sola en «Mensajes en cola», y los demás mensajes de Teléfono (identificador, «Eres el
  siguiente», periódicos, voz y avisos), fuera de la vista desde DD-121 §6, se querían de vuelta, sin llamarlos
  «anuncios». El tiempo máximo de espera no decía qué pasa si no hay siguiente destino.

**Decisión.**
1. **El árbol del DS, Section → Subsection → Slot** (nodo Figma `12610:23080`): la sección pasa a `surface="subtle"`,
   cada canal y las reglas comunes son un `sc-subsection` (la caja blanca sobre el gris, con su icono y su título) y
   cada parte un `sc-slot` (título de 14 semibold y el divisor del DS entre partes). Sin divisores a mano entre
   canales. No es una caja a mano: `audit:screen-vocabulary` no deja dibujarla en una pantalla, y el DS ya tenía la
   pieza.
2. **Chat sigue el orden de Teléfono**: Distribución, Cola, Mensajes en cola, y al final Web Chat · acceso y
   WhatsApp · número. Enmienda DD-121 §5.
3. **Teléfono: la música va en «Cola»**, junto al tiempo máximo, el % de servicio y el tamaño (dos filas de dos). La
   voz pasa a los mensajes, que es lo que lee.
4. **«Mensajes en cola» de Teléfono vuelve, plegado**: el identificador del grupo y «Eres el siguiente» (sin nada,
   texto a voz o un .wav), los mensajes periódicos (uno o varios, cada uno con su frecuencia), la voz de los mensajes
   y los tres avisos («Decir el tiempo medio de espera», «Decir la posición en la cola», «Decir al agente cuánto ha
   esperado el cliente»). Nace plegado porque casi nunca se toca; su título dice qué hay dentro. «Audio saliente»
   sigue fuera, pendiente de desarrollo. Enmienda DD-121 §5 («nada nace plegado») y §6.
5. **Sin «anuncio»**: son mensajes, como en Chat («Mensajes periódicos», «Voz de los mensajes», «Decir…»), en la
   ficha y en Contact Center › Grupos, en los cuatro idiomas.
6. **El tiempo máximo de espera** añade «Sin siguiente destino, la conversación termina.»
7. **El DS gana dos entradas, sin cambiar lo que había**: `sc-slot` se pliega (`collapsible`, `initiallyCollapsed`),
   como ya hacía `sc-subsection`, con el título entero como botón y `aria-expanded`; y `sc-subsection` acepta
   `titleId`, para que su título sea el destino de «Ir a» y del resumen enlazado (DD-130, DD-146). El título de un
   slot ya no se parte cuando su aclaración es larga.

**Razón.** El árbol del DS es exactamente la jerarquía que se pedía, y ya estaba en Figma y en sc-docs: tres niveles
que se leen por el fondo, el tamaño y el divisor, sin inventar ninguno. Lo medido: el título de una parte pasa de 12
a 14 px (la etiqueta de un campo sigue en 12) y cada canal pinta su propio fondo sobre el de la sección.

**Coste.** La sección es la única de la ficha con fondo gris: es la única con un nivel más. Con todo desplegado y los
cuatro canales mide 3.129 px a 1440, y plegado, 2.620 (medido el 2026-10-04, grupo 11).

**Descartado.** Una caja con borde hecha en la hoja de la página (la para `audit:screen-vocabulary`); los mensajes
siempre a la vista (seis controles que casi nadie toca entre la cola y Chat); un botón «Ver los mensajes» bajo el
título, en vez del título plegable (dos cosas para lo mismo).

## DD-156 · 2026-10-04 — El estado del agente, en su propia columna; cada columna de la tabla, medida

**Contexto.** La referencia de producto de la asignación de agentes («4. Agentes y revisión», revisión del
2026-10-01) pide el estado de la persona como un dato aparte, tras el agente. DD-149 lo puso junto al nombre, en la
misma celda, con 21rem para los dos. Medido el 2026-10-04 en la ficha de grupo y en el panel rápido:
- cada etiqueta empezaba donde acababa su nombre: de 45 a 63 px de diferencia entre filas, a cualquier ancho;
- se comía el sitio del email: en el panel, el de la fila en «Administrativo» salía recortado;
- «Asignado» y «Habilitado» medían 7rem en las dos densidades: 18 y 14 px de aire en la ficha, y 34 y 30 en el panel.

**Decisión.**
1. **«Estado» es una columna**, la que sigue a «Agente», en la ficha y en el panel. Lleva la etiqueta del listado de
   agentes y su misma palabra (`agents.table.presence`). Sin estado, la celda queda vacía. Enmienda DD-149: «junto al
   nombre» y los 21rem compartidos.
2. **Cada columna mide lo más largo que lleva** en los cuatro idiomas, más el relleno de celda (14 px a cada lado en
   la ficha, 6 en el panel) y unos 6 px de margen (`COLUMN_REM`):

   | Columna | Lo más largo | Ficha | Panel |
   |---|---|---|---|
   | Asignado | «Asignado», 66 px | 6,25rem | 5,25rem |
   | Agente | el email más largo de la semilla, 203 px, con avatar y hueco | 15rem, mínimo | 16,25rem |
   | Estado | «Post-conversando» o «Post-conversation», 123 px | 9,75rem | 8,75rem |
   | Nivel de un canal | sin cambios | 9rem | 9rem |
   | Canal | sin cambios | 6,5rem | 5rem |
   | Habilitado | «Habilitado», 70 px | 6,5rem | 5,5rem |

   En la ficha, el agente es un mínimo: el nombre más largo cabe siempre, y la columna crece con el sitio que haya.
   En el panel, que mide lo que lleva (DD-131), cabe el email entero. El email gana `title`: uno más largo que su
   columna se lee al pasar.
3. **El panel suma esas mismas columnas** (`columnsRem`): 48rem con dos canales y 43rem con uno (antes, 47,25 y
   42,25). Enmienda DD-151 §Panel.

**Razón.** Medido antes y después en la ficha, con grupos de uno, dos y tres canales, a 1024, 1280, 1366, 1440, 1536
y 1680 (18 casos):
- las etiquetas empiezan en la misma vertical en los 18 (antes, de 45 a 63 px de diferencia);
- ningún caso recorta más emails que antes; los que recortaban, uno menos o los mismos;
- lo que cabía sin desplazar sigue cabiendo: un canal a 1280, 1440, 1536 y 1680; dos, a 1280, 1536 y 1680; los tres,
  a 1680.

En el panel, ningún email de la primera página sale recortado.

**Coste.** Lo que ya desplazaba en horizontal desplaza 40 px más: la columna nueva (156 px en la ficha) menos lo que
ceden el agente (96) y el aire de Asignado y Habilitado (20). A 1440, en un grupo de tres canales, Email también queda
fuera; a 1366, un grupo de un canal ya desplazaba 3 px, y ahora 43.

**Descartadas.**
- *Un punto de color en vez de la etiqueta*, como en la referencia: la etiqueta es la del listado de agentes y la de
  Contact Center › Servicio (DD-149), y un punto solo aquí haría dos lenguajes para lo mismo. El ancho lo marca el
  texto, no la caja.
- *El estado bajo el email, en la celda del agente*: una tercera línea alarga cada fila (DD-131 pide filas compactas),
  y no es el dato aparte que pide la referencia.
- *Reservar el email entero también en la ficha (17rem)*: un grupo de un canal dejaría de caber a 1440; por cuenta,
  736 px en una caja de 735.
- *El estado sin ancho fijo*: su columna cambiaría de ancho al filtrar o paginar, según las etiquetas de cada página.
- *La densidad compacta del panel también en la ficha*: ganaría unos 100 px, pero DD-131 la dejó solo para el panel.
  Queda como salida si la ficha no debe desplazar a 1440, junto con fijar Asignado y Agente a la izquierda.

**Consecuencias.**
- **Pruebas:** `ficha-grupo-estado.spec.ts` (cuatro: tres en rojo contra DD-149, en su propio commit, y la guarda de
  no desplazar). Cambian `ficha-grupo-familias` (el ancho del panel, 768 y 688 px) y `panel-agentes-grupo`: el aire
  se mide del email a su estado y del estado a la primera casilla, y se ha visto en rojo con aire puesto.
- **Código:** `COLUMN_REM` y `columnsRem`, en `agent-channel-table.component.ts`. El panel deja de tener constantes
  propias.
## DD-155 · 2026-10-04 — Los barridos de tus pantallas en local, el CI en 8 partes y un selector que no lo prueba todo por un fichero suelto

**Contexto.** Medido tras DD-154:
- **Barridos.** Son las pruebas que comprueban una regla en muchas pantallas: 232 pruebas, el 43 % del
  tiempo de la batería del Supervisor (16,4 de 38 minutos por pasada, sumando las partes del CI). Los cuatro
  grandes (contraste, agrupación, foco e iconos: 159 pruebas, 10 minutos) nombran su pantalla en cada
  título. En la pantalla tocada cazan fallos: en D3, agrupación cazó dos reales en crear y editar grupo. En
  las no tocadas, solo con un cambio compartido: contraste, en el PR del sidebar (2026-09-23).
- **Otras apps.** Un PR de una sola app corre solo su suite y despliega solo su sitio (DD-117). En `main`
  corre todo, pero en paralelo: sc-docs y CusCare tardan unos 4 minutos y el Supervisor 13-15, así que no
  añaden espera. En los últimos 80 PR, cinco corrieron las tres suites por un fichero que nada lee: la
  plantilla de PR, `tools/` o un fichero suelto de la raíz. El #319, de solo texto, tardó 15 minutos en vez
  de 2.
- **En local.** `preflight:scope` compilaba las cinco apps si se tocaba `e2e/` o `scripts/`, algo que
  pasaba en cada bloque.

**Decisión** (de producto, 2026-10-04):
1. **En local, las pruebas del bloque incluyen los barridos de sus pantallas**:
   `npm run e2e:barridos -- --grep "admin/grupos|config/aed/grupos"`. Son 22 pruebas para las de grupos,
   frente a las 159 de los cuatro barridos.
2. **El CI reparte la batería del Supervisor en 8 partes**, no en 4.
3. **El selector del CI** (`ci-cambios`) trata como documentación la plantilla de PR, las plantillas de
   incidencias, `.git-blame-ignore-revs` y los `.txt` de la raíz. `tools/` cuenta como `scripts/`: corre
   suites solo si una e2e lo alcanza.
4. **`preflight:scope` compila solo las apps tocadas** aunque el cambio incluya pruebas e2e, configs de
   Playwright, tests o hooks de `scripts/` o el CI (`preflight-alcance.mjs`). `angular.json` pasa a mandar
   a la cadena completa, como debía.
5. **En el PR y en `main` los barridos siguen corriendo enteros.**

**Razón.** Las 8 partes y los dos arreglos del selector quitan espera sin quitar red. Los barridos de las
pantallas propias en local son los que han cazado fallos de un bloque.

**Descartadas.**
- *Filtrar también en el CI del PR los barridos por pantalla tocada.* Con 8 partes ahorraría unos 1,5
  minutos por PR. A cambio, haría falta una tabla de qué fichero pinta qué pantalla, que hay que mantener
  y que, si se equivoca, deja pasar un fallo hasta `main` y el sitio publicado. Se decide después de
  medir la espera con 8 partes.
- *Barridos solo en `main`*: un fallo de contraste o de agrupación llegaría al sitio publicado antes de
  verse.
- *Seguir con 4 partes.*

**Consecuencias.** La espera del PR con 8 partes se mide en el CI de este mismo lote. Si sigue alta, se
retoma el filtro de barridos en el CI.

**Actualización (2026-10-04, noche)** · Medida sobre las ejecuciones de `ci` que corrieron las pruebas del
Supervisor desde el 2026-09-29:
- con 4 partes, mediana de 12,8 min (n=67, de 8,0 a 20,1), y crecía con la batería;
- con 8, mediana de 8,4 min (n=9, de 6,9 a 8,8), y estable.

El filtro de barridos por pantalla en el CI sigue descartado: ahorraría ~1,5 min a cambio de una tabla que
mantener. Se retoma si la mediana pasa de 10 min; los tiempos de cada lote los saca `npm run tiempos`.

---

## DD-154 · 2026-10-04 — En local, solo las pruebas del bloque; un PR por lote

**Contexto.** Los bloques E2, E3, E4 y D3 del frente de fichas (2026-10-02) fueron un PR cada uno, y cada
ciclo tardó entre 89 y 118 minutos. Escribir el código, las pruebas y la documentación ocupó 13 minutos
de media. El resto del ciclo, medido sobre el registro de la sesión y las CI:
- 30 min de CI: la del PR y la de `main`.
- 26 min de la batería entera del Supervisor en local.
- 11 min de otras pruebas y gates.
- 21 min leyendo, consultando estado y esperando.

La regla 3 de DD-60 («corre a mano la suite que toca») se escribió con 139 pruebas en la batería del
Supervisor, que costaban unos 3 minutos. El 2026-10-02 ya eran 528 (`playwright --list` sobre `main`
en cada fecha: 226 el 16-09, 366 el 27-09, 462 el 01-10). Pasarlas en local cuesta entre 13 y 29 minutos;
20,1 en una pasada controlada el 2026-10-04. Esa misma pasada midió que, prueba a prueba, el Mac va el
doble de rápido que el runner de CI y no se frena a lo largo de la tanda: la lentitud viene de pasarlas
en serie, no de la máquina. En los bloques E1b-D3, quince pasadas completas (cinco locales y diez de CI)
no cazaron ningún fallo nuevo.

**Decisión** (de producto, 2026-10-04):
1. **En local, cada bloque pasa solo sus pruebas**: los ficheros de prueba que añade o cambia, y los de
   la pantalla que toca (`npx playwright test -c <config> <ficheros>`), que son de 1 a 5 minutos. La batería
   entera de una app no se pasa en local; la pasa el CI. Enmienda DD-60 §3. `npm run revision` sigue
   siendo previo a enseñar una pantalla del Supervisor.
2. **Un lote planificado va en un solo PR.** Varios bloques de un mismo frente van en una rama, con un
   commit por bloque que lleva su prueba roja y su DD. `preflight:scope -- --run` corre una vez, sobre el
   árbol final del lote (LEARNINGS #7), y las CI del PR y de `main` corren una vez por lote. Se funde
   como siempre; el PR conserva el commit de cada bloque, que es por donde se revisa y se deshace uno.

**Razón.** Cada PR paga unos 30 minutos de CI, y la batería local unos 20, sea cual sea el tamaño del
cambio: seis bloques eran seis veces ese peaje. Las pruebas del bloque son las que ese bloque puede
poner en rojo. La batería entera sigue corriendo dos veces por lote, en paralelo, en el CI.

**Descartadas.**
- *Mantener la batería entera en local*: de 13 a 29 minutos por bloque, y ningún fallo nuevo en las quince
  pasadas medidas.
- *Pasar en local las pruebas de toda la zona tocada*: unos 8 minutos (las 218 de fichas y grupos son el
  41 % de la batería). Esa red ya la da el CI del lote.
- *Un PR cada tres bloques*: menos peaje que uno por bloque, pero lo paga dos veces en un lote de seis.
- *Más máquina*: limpiar el Mac llevaría la pasada de 20 a 13 minutos como mucho (el mínimo medido),
  y el peaje se cuenta en horas.

**Consecuencias.** Un fallo que solo caza la batería entera aparece en el CI del lote, no antes, y se
localiza por los commits del PR; una vuelta más de CI (unos 15 minutos) sigue saliendo más barata que
el peaje por bloque. Queda pendiente decidir qué barridos van en cada PR y cuáles una vez al día: son
232 pruebas que revisan una regla en muchas pantallas (contraste, agrupación, tablas, foco…) y suman el
43 % del tiempo de la batería.

---

## DD-153 · 2026-10-02 — Columnas en un icono y acciones fijas en los listados

**Contexto.** En una tabla ancha, Asignar y el menú de fila desaparecían al mostrar ID o ensanchar
una columna. El selector de columnas ocupaba espacio con una etiqueta y un conteo que no son datos de la tabla.

**Decisión.** `sc-multiselect` publica `iconOnly` (falso por defecto) e `icon` (`view_column`). La lista
lo usa con nombre accesible traducido «Columnas, 8 de 10» y el mismo título. El tema oculta solo el
contenedor de texto, conservando su altura; las tallas usan los anchos de botón de icono existentes.
Se conservan selección, opciones bloqueadas, foco y overlay nativos. Excepción declarada en
`audit:primeng-coupling` §F y `customs-catalog` §8, con demo en sc-docs.

`ScColumnDef.frozen` y `alignFrozen` pasan a `pFrozenColumn` en cabeceras y celdas de las plantillas
por defecto. El menú de `sc-list-page` y Asignar del grupo quedan a la derecha *(DD-159: Asignar sale; su acción va
en la cifra de agentes, y solo queda fijo el menú. DD-162: el orden se cambia en el globo de columnas, no arrastrando
cabeceras)*. No se arrastran esas
columnas fijas. PrimeNG calcula sus posiciones y hereda el fondo de fila; el hover inerte conserva
un fondo opaco. Una sombra del token existente señala contenido oculto y desaparece al alcanzar
el extremo. Un observador de tamaño y el scroll actualizan esa señal, también con lista virtual.
La tabla con scroll encoge dentro de flex y las demos usan pistas grid con mínimo cero: el contenido
ancho se desplaza dentro de su caja. Las estrategias de Teléfono y Chat disponen de 15 y 14 rem,
respectivamente, para evitar los dos recortes de 3 px reproducidos en la base de E1b.

**Razón.** Las acciones frecuentes siguen alcanzables a 1024 y 1366 sin obligar a buscar el extremo
horizontal. Las pruebas comprueban hit testing después de arrastrar ID, fondos normales/hover/selección
en ambos temas, persistencia de columnas y navegación por teclado. Una prueba del DS cubre ambos lados
fijos y el cambio de sombra al desplazar. La API sigue exportada por el punto público existente.

**Descartadas.** Una tabla o un selector nuevos duplicarían PrimeNG; offsets manuales romperían al
redimensionar. Fijar solo el icono dejaría Asignar fuera. Una sombra permanente sugeriría contenido
oculto cuando ya no lo hay. No se migra MultiSelect a Select multiple en este bloque: aunque PrimeNG
22.1.0 marca el primero como obsoleto, el contrato vigente del DS y el plan piden ampliar ese wrapper.
No se añaden tokens, niveles en árbol ni cambios de vocabulario ajenos al listado.

**Consecuencias.** Variante y columnas son aditivas. Se prepara versión 1.1.0 en lockstep sin publicar
paquetes (DD-17). Las capturas Linux de las demos deben regenerarse y revisarse antes de fusionar.
No cambia el export del Kit: no procede sincronizar tokens ni el Theme Designer.

---

## DD-152 · 2026-10-02 — Tiempos, capacidad, horarios y música de los grupos (D3)

**Contexto.** La revisión de producto sustituye el número con unidad del plan inicial por desplegables de valores
fijos, iguales en ficha y Contact Center. Las duraciones y asignaciones anteriores deben sobrevivir al cambio.

**Decisión.**
- Transferencia, espera en cola, tiempo del porcentaje de servicio y entre llamadas ofrecen 5, 10, 15, 20, 25 y
  30 segundos; 1, 1,5 y 2 minutos. Se guardan segundos. Un valor anterior fuera del catálogo sigue visible y
  seleccionable mientras sea el actual; no se redondea ni se cambia la versión del almacén.
- Inactividad ofrece 5, 10, 15, 30 y 60 minutos, con 5 de fábrica. Criterio delegado de producto (2026-10-02):
  intervalos cortos para atención inmediata y largos para conversaciones asíncronas. Se conserva cualquier valor
  anterior. Las semillas existentes con 10 minutos no se reescriben.
- Tipo de cola en `sc-select`: Fija o Variable. Variable admite enteros 1–10 y al cambiar a ese modo propone 2
  («Recomendado: 2»). Fija admite enteros positivos sin máximo; al volver a Fija conserva la cifra actual.
  Una cola antigua fuera de rango se muestra con error y bloquea Guardar hasta corregirla; abrir no modifica datos.
  Se reutiliza el input numérico nativo del DS, con su límite al perder foco, sin cambiar el componente.
- Web Chat y WhatsApp eligen su horario activo de `HorariosStore`; Siempre es ausencia/null. El dato aditivo
  `chat.attendanceScheduleIds` es independiente de `Group.schedules`, que sigue guardando agendas. Un horario
  inactivo ya guardado se conserva visible y deshabilitado, sin ofrecerlo como nueva elección.
- Música: sin archivo, Música por defecto y Elegir .wav; con archivo, un único nombre, Cambiar y Quitar. Se
  mantiene el alcance de la demo: guardar el nombre del archivo, sin incorporar una subida de audio.
- Los dos interruptores de Chat se emparejan, y también número de WhatsApp y horario. La fila de capacidad y
  voz queda alineada, a 28 de la de tiempos: el selector y la cifra componen otro grupo. Etiquetas de horarios
  con la misma clase y arista que el campo vecino. No se altera el movimiento ni el DOM interno de PrimeNG.

**Descartadas.** `sc-duracion` con cifra y unidad queda superado por la decisión posterior. Redondear tiempos
históricos o resembrar perdería configuración válida; permitir cualquier duración nueva incumpliría el catálogo.
Reutilizar agendas para horarios mezclaría entidades. Un catálogo de inactividad limitado a dos minutos no
podría expresar los cinco de fábrica. Truncar silenciosamente colas antiguas ocultaría un cambio de capacidad.

**Validación.** Siete flujos e2e en rojo contra E4 antes de implementar; pruebas de guardado, valores anteriores,
catálogos y límites, horarios independientes y ciclo de música. Unitarias de formato/unidades, límites y conservación.
La evidencia ejecutada y el estado de publicación se registran en el hand-off del frente.

---

## DD-151 · 2026-10-02 — Asignar agentes desde la lista completa (E4)

**Decisión.** La ficha de grupo y el panel rápido comparten la lista de todos los agentes. «Asignado» añade o
quita el enlace; sustituye el selector de incorporación, la selección de filas para un lote y la papelera.
El SelectButton nativo filtra Todos / Asignados / Sin asignar, sin contadores. Edición y panel abren en Asignados;
el alta, en Todos. La búsqueda encuentra nombre o email y se conserva al cambiar de filtro. La identidad muestra
nombre, email y la presencia compartida de DD-149. Los incompatibles siguen visibles, apagados y explicados (DD-150).

El conjunto de filas se calcula al cambiar filtro o búsqueda y conserva su pertenencia mientras se modifica una
asignación. Así el control no desaparece bajo el puntero. La paginación nativa de la tabla muestra 10 filas y permite
25 o 50; las cabeceras actúan sobre todos los resultados filtrados, también los de otras páginas.

**Acciones colectivas.** La cabecera Asignado añade los compatibles que faltan; cuando todos están asignados,
los quita. La de cada familia cambia solo enlaces asignados y compatibles, y nunca retira su último canal.
Se confirma cualquier acción que cambie a dos o más agentes (decisión de producto, 2026-10-02), contando cambios
reales, sin incluir incompatibles ni filas que quedarían iguales. Cancelar conserva el borrador. Se anuncia el
número de agentes modificados. Los cambios siguen pendientes hasta Guardar en la ficha o el panel.

**Panel.** Nace arriba y ocupa toda la altura, sin `topOffset`. Su ancho suma Asignado, identidad, niveles,
familias y Habilitado, limitado por la ventana. *(DD-156: y Estado, cada columna medida.)* Las familias también aparecen cuando solo hay una: ahora la lista
incluye agentes sin asignar y necesita explicar su compatibilidad. Enmienda DD-121 §8/10 y DD-131 §1–3/6.

**Descartadas.** Mantener dos entradas para asignar duplicaría el mismo estado. Refiltrar tras cada casilla haría
desaparecer la fila antes de revisar sus canales. Actuar solo sobre la página visible dejaría parte de los
resultados sin modificar. Retirar el último canal o inventar permisos rompería DD-147 y DD-150. No se modifica
TreeTable ni la tabla de grupos de la ficha del agente.

## DD-150 · 2026-10-02 — Canales permitidos del agente (E3)

**Contexto.** Un enlace con un grupo no concede a la persona todos sus canales. La tabla, el panel, el listado y
el resumen deben expresar el mismo conjunto efectivo: enlace ∩ familias del grupo ∩ permisos del agente.

**Decisión.** `Agent.allowedChannels` contiene Teléfono, Chat y Email. Ausente conserva las tres familias; vacío
significa ninguna. Se edita en Permisos del agente y en Contact Center › Agentes, cuyos valores hereda el alta.
No se recupera el campo retirado `Agent.channels` ni se suben versiones de almacén. Web Chat y WhatsApp siguen
perteneciendo a Chat (DD-147). Dos agentes concretos de la semilla, 499 y 500, tienen solo Chat, después de generar
sus datos; no se modifica el molde que comparten los demás.

Al guardar una retirada, el diálogo enumera los grupos afectados. Cancelar conserva la persistencia; confirmar
recorta solo los canales y conserva asignaciones, habilitación y niveles, incluso si un enlace queda vacío. La
tabla ya distingue esos enlaces heredados con «Sin canales». Los controles no autorizados están apagados y el
candado enlaza a los permisos con su motivo. No se puede crear una asignación sin ninguna familia compatible.
Los selectores usan `optionDisabled` nativo, con la razón en la etiqueta de la opción.

**Razón.** La misma función pura recorta los enlaces en lectura y guardado sin clonar los que no cambian. Los
almacenes no se acoplan entre sí: sus consumidores pasan los permisos de la persona. La ficha conserva el aviso
antes de persistir, y la vista calcula lo efectivo sin inventar permisos al abrir datos anteriores.

**Descartadas.** Borrar la asignación al retirar su último canal perdería habilitación y niveles. Subir la versión
borraría datos existentes. Filtrar las opciones incompatibles sin mostrarlas escondería por qué no se puede
asignar. Modificar las bases de la semilla extendería la restricción a decenas de agentes generados.

## DD-149 · 2026-10-02 — Habilitación por grupo y presencia del agente (E2)

**Decisión.** La tabla de agentes de la ficha y el panel rápido recuperan «Habilitado»: el interruptor edita
`GroupAgentLink.active`, igual que la ficha del agente. Enmienda DD-121: deshabilitar una asignación no es poner
a la persona en pausa. No elimina la relación, sus canales ni sus niveles, ni cambia las otras asignaciones.

La presencia se muestra junto al nombre con la misma etiqueta de color y texto del listado. *(Enmendado por DD-156,
2026-10-04: va en su propia columna, «Estado», tras el agente.)* `PRESENCE_TAGS`
pasa a los datos compartidos de agentes; ficha, panel y listado leen `AgentsStore`. Un estado ausente no se
inventa. La presencia, la cuenta activa (`Agent.status`) y la habilitación del enlace son conceptos distintos;
los textos de los cuatro idiomas explicitan esa diferencia.

El resumen dice «Agentes habilitados» y cuántos están deshabilitados. El constructor de reglas ya filtraba
`link.active`: su cuenta ahora se rotula como agentes habilitados, por lo que cambiar el interruptor modifica
los miembros que una condición de grupo incluye. No se cambia el evaluador ni la presencia de la persona.

**Composición.** Se reutilizan `sc-toggleswitch` y las dos variantes de `sc-tag` del listado. La columna de
habilitación mide 7rem y se suma al ancho del panel y al mínimo de tabla, incluidos ambos niveles. El nombre
reserva 21rem para compartir celda con las presencias largas sin ocultar los nombres de prueba (la sonda
falló con 15rem). La tabla desplaza horizontalmente cuando no cabe. El lote sigue siendo solo quitar del
grupo; la asignación desde la lista completa pertenece a E4. *(DD-156: el agente y el estado se miden por separado, y Asignado y Habilitado,
por su rótulo.)*

**Alternativas descartadas.** Reutilizar «En pausa» confundiría una relación con la presencia. Cambiar
`Agent.status` desde una fila afectaría a la cuenta, no al grupo. Duplicar el catálogo de colores haría divergir
el listado y las fichas. No se añade un lote de habilitación no solicitado.

## DD-148 · 2026-10-02 — Niveles independientes de Teléfono y Chat (E1b)

**Por qué.** La prioridad de un agente para llamadas puede ser distinta de la que tiene para Chat. Un nivel único
no representaba esa diferencia y la comparación de enlaces ignoraba cualquier cambio de nivel de Chat.

**Decisión.**
- `GroupAgentLink.levels` conserva `phone` y `chat` independientemente; sin nivel explícito, cada familia usa 1.
  Los selectores ofrecen los enteros de 1 a 10. Cambiar de estrategia o de canales no borra los niveles.
- Al leer el almacén, `linkWithFamilies` mantiene el contrato de DD-147 y `linkWithLevels` convierte `level` en
  `levels.phone`. Si coexisten ambos formatos, prevalece el nivel nuevo de Teléfono; el antiguo solo rellena su
  ausencia. Chat y las demás propiedades se conservan. Se retira `level` del resultado y se mantiene la identidad
  del objeto que ya estaba normalizado. La versión sigue en 1; la siguiente escritura persiste la migración.
- `sameLink` compara los dos niveles, con 1 como valor implícito. Dos cambios en el mismo agente cuentan como un
  agente pendiente en el panel.
- Chat ofrece Niveles y `chatSubStrategy` elige el reparto dentro de cada nivel entre las estrategias de Chat sin
  Niveles. Se normalizan los nombres antiguos al leer, como en DD-141. Contact Center excluye Niveles de sus valores
  por defecto de Chat, siguiendo el criterio ya existente en Teléfono.
- Ficha y panel comparten una columna por familia configurada con Niveles. Cada cabecera y cada control identifican
  Teléfono o Chat. El panel suma el ancho de cada columna a su cálculo existente; el `colspan` lo resuelve la tabla
  del DS a partir de sus columnas y de la selección.

**Comprobación.** Pruebas del núcleo de migración, precedencia, identidad, límites y comparación; recorridos de
persistencia en ficha y panel con una y ambas familias; subestrategia y defaults; regresiones de E1a. Medidas de
columnas, `colspan` y capturas a 1024/1440 en claro y oscuro. Las evidencias ejecutadas y su estado constan en el
hand-off del frente.

**Descartadas.** Subir la versión borraría asignaciones. Dar preferencia al nivel antiguo sobrescribiría decisiones
nuevas. Compartir el nivel entre familias impediría priorizarlas por separado. Niveles dentro de Niveles no es una
subestrategia de reparto. TreeTable y el flujo de asignación completo quedan fuera de E1b.

---

## DD-147 · 2026-10-02 — El agente atiende por familias: Teléfono, Chat y Email (E1a)

**Por qué.** La revisión de producto del 2026-10-01 distingue la oferta del grupo de lo que atiende un agente.
Web Chat y WhatsApp comparten la asignación Chat; separarlos duplicaba columnas y podía quitarle Chat a un agente
cuando el grupo todavía lo ofrecía por el otro subcanal. Enmienda la asignación por cuatro canales de DD-121.

**Decisión.**
- El grupo conserva `phone`, `chat` (Web Chat), `whatsapp` y `email`, con sus ajustes y sus números separados.
  `GroupAgentLink.channels` guarda las familias `phone`, `chat`, `email`; sus etiquetas viven en `FAMILY_LABEL_KEYS`.
- `linkWithFamilies`, en el `normalize` del almacén, convierte `whatsapp` en `chat`, elimina duplicados y ordena
  canónicamente. Devuelve el mismo objeto si ya estaba normalizado. La versión de almacenamiento sigue en 1;
  lo siguiente que se guarda ya lleva familias y conserva el resto de propiedades, incluido el nivel anterior.
- `familiesOf`, `removedFamilies`, el recorte de enlaces y las altas usan familias. Un grupo solo de WhatsApp ofrece
  Chat. Quitar un subcanal mientras queda el otro no quita Chat ni pide cascada; quitar ambos calcula el impacto
  y el aviso nombra Chat. Al confirmar, salen los enlaces que quedan sin ninguna familia.
- Tabla del grupo, panel rápido, tabla de grupos del agente, resumen y listado usan las mismas tres familias.
  El resumen del agente, como su listado, solo cuenta las que sus grupos ofrecen y cuyos enlaces están activos.
  Reparto y Salida conservan su significado: el número de WhatsApp sigue siendo independiente.
- El panel cuenta familias para decidir sus columnas y ancho: 448 px con una sola, 476 con dos y 556 con tres,
  sin columna Nivel. Conserva la excepción de DD-131 si llega un enlace sin familia. La columna Canales del listado
  mide 6.25rem: tres glifos ocupan 69 px, dentro de una celda de 100 px. Su mínimo de tabla pasa a 97.75rem.

**Comprobación.** `group-channel-families.test.mjs` cubre normalización e identidad, orden, altas, recorte e impacto.
`ficha-grupo-familias.spec.ts` cubre las tres columnas, lectura y escritura de enlaces v1, cascada, grupos solo
WhatsApp, anchos del panel, resumen y listado. Las pruebas de canales, panel, widget y pase de fichas dejan de
esperar cuatro columnas o un WhatsApp vacío: los avisos se prueban con una familia sin agentes explícita.
Revisión de agrupación en las diez vistas de las dos fichas y el listado; capturas a 1024 y 1440, en claro y oscuro.

**Descartadas.** Subir la versión borraría asignaciones guardadas. Eliminar WhatsApp del grupo perdería sus ajustes
y su salida. Mantener cuatro columnas de agente contradice la asignación por familia. Los niveles 1–10 por familia
son E1b: este cambio conserva `level` y las estrategias existentes; no introduce `levels.phone/chat`.

---

## DD-146 · 2026-10-02 — El resumen de la ficha de grupo lleva a su sección

**Contexto** · La revisión de producto del 2026-10-01 pidió que el resumen no fuera solo de mirar. Lo que dice se
arregla en una sección (Agentes, Distribución y colas, Recursos), y había que buscarla en el índice: «Sin número» en
Salida no llevaba al número. DD-126 §5 eligió para sus tarjetas el tinte de «elegido» porque no se pulsaban.

**Decisión** ·
1. **El rótulo de cada tarjeta lleva a su sección:** Agentes activos, a Agentes; Reparto y Salida, a Distribución y
   colas; Recursos, a Recursos. Son enlaces de verdad, con la dirección de la sección (Cmd+clic la abre en otra
   pestaña), y el clic llega arriba con el foco en el título, como el índice.
2. **Cada fila lleva a su sitio:** las de Reparto, al bloque de su canal; las de Salida, a su número (el teléfono
   saliente, el de WhatsApp). El foco va a él, y queda a la vista debajo del nombre fijo (DD-145).
3. **Se nombran por lo que se ve:** Reparto y Salida son grupos con su rótulo por nombre, así que dos «Teléfono» no se
   confunden y el nombre de cada enlace es su texto.
4. **En el alta, como el índice:** abre la sección sin tocar la dirección (DD-143), y General sigue siendo la puerta.
5. **Se leen como el texto de la tarjeta:** en el primario, que es el que llega a AA sobre el tinte (DD-126 §6), con
   manita y subrayado al pasar, como la miga (DD-103), y el anillo de foco del sistema. La tarjeta no se pulsa entera.

**Razón** ·
- **Del resumen a donde se arregla**, sin pasar por el índice.
- **Rótulos y filas, no la tarjeta:** con el tinte de «elegido», una tarjeta que se pulsa parecería elegida, y una
  tarjeta lleva a varios sitios.
- **En el primario y subrayado al pasar:** en azul y subrayado siempre, el resumen se leería como una lista de
  enlaces; y el gris secundario no llega sobre el tinte.
- **Medido el 2026-10-02, en este build:**
  - el enlace sobre el tinte llega a AA, y con el gris secundario se queda en 3,955 (la prueba enrojece);
  - se subraya al pasar, y sin el subrayado la prueba enrojece;
  - Reparto › Chat deja el título del canal debajo del nombre fijo, y Salida › WhatsApp enfoca su campo.
- **Rojo primero:** `resumen-enlazado`, cinco de cinco en rojo contra el resumen sin enlaces.

**Descartadas** ·
- **La tarjeta entera pulsable** → parecería elegida (DD-126 §5), y una tarjeta lleva a varios sitios.
- **Enlaces en azul y subrayados siempre**, como «Ir a: Teléfono · Chat» → el resumen se leería como una lista de
  enlaces.
- **Las filas por canal de Agentes activos, enlazadas** → irían todas a la sección de su rótulo.
- **El resumen de agente y de usuario** → no lo pidió la revisión; el widget ya acepta una dirección (`href`).

**Consecuencias** ·
- **Enmienda** DD-126 §5: en el resumen de grupo se pulsan los rótulos y las filas; la tarjeta sigue sin pulsarse.
- `sc-summary-kpi` gana `href` y `abrir`; `sc-group-summary`, `hrefs` e `ir`; `alta-secciones.ts`, `llegarAAncla`.
- **Pruebas:** `resumen-enlazado.spec.ts`, nueva, con cinco.
- **Para el Kit:** `figma-pendiente` §37.

**Actualización (2026-10-05)** · Cada enlace del resumen se pulsa en al menos 24,5 × 24,5 (WCAG 2.5.8): pintaba 18 de
alto. Un `::after` invisible y centrado agranda la zona sin mover nada, como la cifra de `sc-group-popover` (DD-159).
Las filas están a 25 de arriba a arriba, así que una zona no pisa la de al lado. `resumen-enlazado` gana la sexta: a
1366 × 660, las cuatro esquinas de un cuadrado de 24 centrado en cada enlace caen en él (`elementFromPoint`); en rojo
antes, los ocho.

---

## DD-145 · 2026-10-01 — El nombre de la ficha se queda arriba al bajar, y borrarla pide escribirlo

**Contexto** · La segunda revisión con el equipo (2026-10-01) pidió el nombre del grupo fijo arriba al bajar. Con el
título en la columna del contenido (DD-144), al bajar se iba con la sección: en Distribución y colas del grupo 11, la
más larga (1865 px de recorrido a 1440×900), no quedaba nada que dijera qué grupo se edita. La misma revisión pidió que
borrar un grupo pida escribir su nombre. Medido en el código, ya lo pide: las tres fichas usan
`sc-delete-entity-dialog` en modo `single`, que no habilita «Eliminar» hasta teclear el nombre exacto.

**Decisión** ·
1. **Una copia muda de la cabecera, fija arriba de la columna del contenido** (`sc-nombre-fijo`, de la app), en las
   tres fichas: el nombre y su línea de datos, con sus mismos estilos de texto.
   - A partir de 1340 cae justo encima de la cabecera y se ve desde el primer píxel que se baja: el nombre no se mueve
     y la sección pasa por debajo.
   - Por debajo de 1340 sale al quedar fija arriba, sin tapar la franja del resumen.
2. **La cabecera de verdad no cambia:** sigue siendo el único `h1`, la primera en el tabulador y el sitio donde se
   edita el nombre. La copia es `aria-hidden`, no se enfoca y no se ve en reposo. Su texto va pintado (`::before`) y
   sus clases son suyas: buscar el nombre por su texto, o la cabecera por su clase, da solo con la de verdad.
3. **Lo que se salta o se enfoca no queda debajo de ella:** mientras la ficha está en pantalla, la zona que se desplaza
   aparta sus anclas `--sc-form-anchor-offset` (80; la copia mide 78,75).
4. **Borrar pide escribir el nombre**, en las tres fichas: una prueba lo fija.

**Razón** ·
- **Una copia y no la cabecera `sticky`:** un `sticky` no sale del área de su rejilla, y la cabecera ocupa la fila de
  arriba (DD-144). Para fijarla habría que envolverla con el contenido en una columna, y eso cambia el orden del DOM:
  el índice delante del título, o detrás del contenido.
- **Pintada y con clases propias:** con el texto escrito y las clases de la cabecera, las pruebas que buscaban el
  nombre por su texto o la cabecera por su clase encontraban dos. Fueron cuatro rojas en `ficha-grupo` y
  `ficha-usuario-agente`, y hay 16 sitios que buscan así.
- **Medido el 2026-10-01, en este build:**
  - a 1440 la copia cae sobre la cabecera al píxel: el nombre en (332; 79,75), a 18 px y 600, y los datos en
    (332; 103,75);
  - a 1280, con 40 px bajados, la franja del resumen sigue a la vista; del todo, el nombre va arriba de la columna del
    contenido, a la altura del índice;
  - un salto a Chat dejaba su título en y=55,6; con las anclas apartadas, queda debajo de la línea de datos;
  - `revision`, en regla en las 24 vistas de las tres fichas.
- **Rojo primero:** `fichas-nombre-fijo`, cinco de nueve en rojo contra la maqueta de DD-144:
  - el nombre al bajar, en las tres fichas;
  - por debajo de 1340;
  - el salto de canal.

  Las otras cuatro son de guarda: en reposo, y borrar en las tres fichas. La de borrar enrojece con el diálogo en modo
  `bulk`.

**Descartadas** ·
- **La cabecera `sticky`, envuelta con el contenido** → cambia el orden del DOM y del tabulador, y por debajo de 1340 la
  cabecera va encima del resumen, fuera de esa columna.
- **El nombre solo en la miga de la barra de arriba** (DD-33: la identidad, en el breadcrumb) → la revisión pidió el
  nombre de la ficha arriba, no en la barra.
- **Una barra compacta con el nombre en 14 px** → en el prototipo parecía otro elemento que aparece; la copia en su
  sitio no se nota.
- **Por debajo de 1340, la copia a todo lo ancho** → taparía el índice, que se queda fijo a la izquierda.

**Consecuencias** ·
- **Enmienda** DD-144: lo que quedaba para G2, el nombre fijo y la prueba de borrar.
- **Pruebas:** `fichas-nombre-fijo.spec.ts`, nueva, con nueve.
- **Queda para G2b:** el resumen que lleva a su sección.
- **Para el Kit:** `figma-pendiente` §36.

---

## DD-144 · 2026-10-01 — Las fichas en tres columnas: índice, contenido y resumen arrancan a la misma altura

**Contexto** · Pedido el 2026-10-01, tras la segunda revisión con el equipo: que el contenido suba arriba y el resumen
se alinee con el índice, en una rejilla de tres columnas, sin el rótulo «Resumen». Hasta hoy la cabecera de la ficha
(el nombre, su línea y «Eliminar») iba en una fila propia, encima de las tres columnas (DD-121 §2, DD-122 §8). Medido
a 1440:
- el título, en y=79, y el índice, el contenido y el resumen, en y≈135;
- el resumen gastaba 25 px en su rótulo;
- «Eliminar» iba arriba a la derecha.

**Decisión** ·
1. **Tres columnas que arrancan a la misma altura**, en las tres fichas, al crear y al editar: el índice (196), el
   contenido y el resumen (240). `.ficha-rail` pasa de una fila partida (flex) a una rejilla con áreas.
2. **El título va en la columna del contenido**, encima de la sección: su borde izquierdo es el de la tarjeta, y 14
   lo separan de ella.
3. **El resumen, sin rótulo a la vista**: su `h2` queda oculto (`visually-hidden`) y sigue nombrando la región
   («Resumen»).
4. **«Eliminar», bajo el índice**, al editar: a 28 de su última fila, el aire entre grupos, y con su icono en la
   vertical de los del índice.
5. **Por debajo de 1340, como estaba**: el título arriba a todo lo ancho, el resumen en su franja, y luego el índice y
   el contenido. Las áreas de la rejilla mueven lo que se ve; el orden del DOM, y el del tabulador, es el mismo en las
   dos maquetas.

**Razón** ·
- **Lo que se lee primero, arriba:** el nombre de la ficha, el índice y el resumen empiezan en la misma línea. Antes,
  el índice, el contenido y el resumen arrancaban 56 px por debajo del título.
- **El rótulo no decía nada que no dijeran sus tarjetas**, y empujaba la primera 25 px.
- **Una rejilla con áreas, sin mover el título en el DOM:** el título cambia de sitio según el ancho sin pintarse dos
  veces, y el lector y el tabulador lo encuentran siempre en el mismo orden.
- **Medido el 2026-10-01, en este build:**
  - a 1440, el índice, el título y el resumen arrancan en y=79, y el título en x=332, la de la tarjeta;
  - el rótulo del resumen mide 1 px (oculto);
  - «Eliminar» queda a 28 de la última fila del índice, y su icono a 0,75 de la vertical de los del índice;
  - por debajo de 1340, igual que antes;
  - `revision`, en regla en las 24 vistas de las tres fichas.
- **Rojo primero:** `fichas-tres-columnas`, ocho de nueve en rojo contra la maqueta anterior:
  - seis por el título en y=79 con el índice en y=135;
  - una por el rótulo, a 18 px;
  - una por «Eliminar» fuera del índice.

  La de por debajo de 1340 es de guarda.

**Descartadas** ·
- **Mover el título dentro de la columna del contenido, en el DOM** → por debajo de 1340 tendría que volver encima del
  resumen, y habría que pintarlo dos veces o moverlo con código.
- **Quitar el `h2` del resumen** → la región se quedaría sin nombre para el lector.
- **«Eliminar» a la derecha del título, como antes** → la revisión lo pidió bajo el índice.
- **Subir la primera fila del índice (y=88) a la altura del título y el resumen (y=79)** → es el relleno del índice de
  Contact Center (8,75), el mismo desfase que tiene allí con su contenido (DD-122: Contact Center no se mueve un
  píxel).

**Consecuencias** ·
- **Enmienda** DD-121 §2 (la cabecera ya no va encima de índice y contenido) y DD-122 §8 (agente y usuario, con el
  mismo molde).
- **Pruebas:**
  - `fichas-tres-columnas.spec.ts`, nueva, con nueve;
  - se reescriben, cada una con su porqué, `ficha-grupo` (el molde, con el título en el contenido) y
    `ficha-usuario-agente` («Eliminar» bajo el índice).
- **Queda para G2:**
  - el nombre fijo al bajar;
  - una prueba que fije que borrar pide escribir el nombre, que ya pide `sc-delete-entity-dialog` en modo `single` en
    las tres fichas;
  - el resumen que lleva a su sección.
- **Enmendado por DD-145** (2026-10-01): el nombre fijo al bajar y la prueba de borrar, hechos.
- **Para el Kit:** `figma-pendiente` §35.

---

## DD-143 · 2026-10-01 — Las altas vuelven al índice, con ✓ en las secciones que se dejan completas y «Atrás / Siguiente» al pie

**Contexto** · La segunda revisión con el equipo (2026-10-01) no quiso el Stepper de las altas (DD-138): un asistente
para un formulario tan largo, y una ficha que cambia de forma entre crear y editar. Pidió volver a como estaba, con el
índice, un botón «Siguiente» y un ✓ en lo que ya está.

**Decisión** ·
1. **El alta tiene la maqueta de la edición**, en las tres fichas (grupo, agente y usuario) y al duplicar un agente o
   un usuario: el índice a la izquierda (`sc-form-section-nav`), una sección a la vista en su `sc-section-card`, con su
   cabecera, y el resumen a la derecha. Salen `sc-alta-pasos` y, con él, el `p-stepper`.
2. **✓ en la sección que se deja completa** *(DD-158: solo si tiene algo obligatorio)*: `sc-form-section-nav` gana
   `sectionsDone` (DS). El ✓ va detrás de la
   etiqueta, en el verde de éxito y con el peso de la etiqueta, y el enlace lo dice («Esta sección está completa»). La
   abierta no lo lleva aunque esté bien. Lo que falta y los cambios sin guardar ganan al ✓: se ve una marca y se oyen
   todas.
3. **La sección que se deja sin lo obligatorio lleva el punto rojo**: Identidad, en agente y usuario, y Distribución
   y colas sin teléfono saliente, en el grupo (DD-142). Antes de abrirla, ninguna marca: un alta recién abierta no
   acusa (DD-136).
4. **«Atrás» y «Siguiente» al pie de la sección, en las tres altas** (`sc-alta-pie`, de la app): atajos a la sección de
   al lado, en el orden del índice *(DD-158: juntos a la izquierda, «Atrás» secundario y «Siguiente» el principal, como
   el Stepper vertical)*. La primera no lleva «Atrás» y la última no lleva «Siguiente». «Crear …» sigue
   arriba, la única acción que crea (DD-122 §6). Llevan al principio de la sección nueva, con el foco en su título
   (`llegarASeccion`).
5. **General sigue siendo la puerta del grupo** (DD-121): sin nombre o sin canales, ni el índice ni «Siguiente» sacan
   de ella; cada campo dice lo que falta y el foco va al primero.
6. **Cambiar de sección en el alta no toca la dirección ni el historial**, como con los pasos: Atrás del navegador
   sale del alta, y crear abre la edición en la sección abierta. El estado del alta (la sección abierta y las que se
   dejaron) vive en `seccionesDeAlta`, que era `pasosDeAlta`.
7. **El ✓ entra como un icono que cambia de estado** (better-ui): escala de 0,25 a 1, opacidad y 4 px de desenfoque,
   en 300 ms (`--sc-transition-slow`) con la curva enfática. Solo si llega con el índice a la vista; con menos
   movimiento, quieto.

**Razón** ·
- **Un formulario, una forma:** al crear y al editar se ve lo mismo. El índice dice lo que falta (el punto), lo que ya
  está (el ✓) y lo que queda (sin marca), que era lo que aportaba el Stepper.
- **De DD-138 se queda lo que funcionaba:** una plantilla por sección, la puerta, el ✓ al dejar una sección completa,
  los atajos y que la sección no vaya en la dirección.
- **Medido el 2026-10-01, en este build:**
  - el ✓ entra en 300 ms, con `cubic-bezier(0.2, 0, 0, 1)` en sus fotogramas, desde escala 0,25, opacidad 0 y 4 px de
    desenfoque. Con menos movimiento, sin animación. Su centro queda a 0,25 px del centro del texto. Verde 700 en claro
    y 600 en oscuro, con el peso 400 de la etiqueta;
  - a 1280×720, «Siguiente» desde el final de General dejaba Distribución y colas a 88 px de su principio. Ahora llega
    arriba, con el foco en su título. Donde la sección nueva cabe entera, el navegador ya subía solo;
  - de la tarjeta de la sección a «Atrás / Siguiente», 28: el margen de abajo de la tarjeta (21) se funde con el del
    pie;
  - `revision`, en regla en las 24 vistas de las tres altas y sus ediciones; `agrupacion`, en verde.
- **Rojo primero:**
  - `altas-indice`: nueve de once en rojo contra los pasos, y dos de guarda;
  - la duodécima, la del punto rojo de Identidad, en rojo sin su regla;
  - la de «llega arriba», en rojo sin el `scrollTo` (88 en vez de 0), y la del foco, sin el foco;
  - la unitaria del ✓ que ya estaba al pintar, en rojo con el ✓ siempre animado.

**Descartadas** ·
- **Quedarse con el Stepper y añadirle «Siguiente»** → era justo lo que la revisión no quería: un asistente y dos
  formas de ficha.
- **La sección en la dirección (`?seccion=` con `replaceUrl`), como antes de DD-138** → una dirección que abre una
  sección del alta invita a saltarse la puerta, y Atrás ya sale del alta sin ella.
- **El ✓ en el sitio del icono de la sección, o al final de la fila** → el icono identifica la sección, y una columna a
  la derecha le quita ancho a la etiqueta, que envuelve (DD-52). Va detrás de la etiqueta, como el punto.
- **El pie dentro de la tarjeta de cada sección** → cada plantilla tendría que pintarlo, y es la misma al editar. Fuera
  de la tarjeta hay uno por ficha.

**Consecuencias** ·
- **Revierte DD-138** (las altas en pasos). **Enmienda**:
  - DD-121 §11: el alta, con el índice;
  - DD-122 §1 y §4: el índice también en el alta, y la sección sigue sin ir en la dirección;
  - DD-130 §2: los atajos, al pie;
  - DD-136: la sección que se deja sin lo obligatorio lleva el punto.

  La nota del plegado del Stepper en DD-113 se queda como historia.
- **DS:** `sectionsDone` en `sc-form-section-nav`, con su entrada en el CHANGELOG `[Unreleased]`, su ejemplo en
  sc-docs, su unitaria y su e2e. Su diccionario pasa a los cuatro idiomas: en francés y en portugués se decía en
  español.
- **App:**
  - `sc-alta-pie` sustituye a `sc-alta-pasos`, y `seccionesDeAlta` a `pasosDeAlta`;
  - salen las claves `common.steps_aria` y `common.step_done`;
  - en `audit:components`, `stepper` vuelve a la lista de lo no usado.
- **Pruebas:**
  - `altas-indice` (antes `altas-pasos`), con doce pruebas; sale `altas-pasos-movimiento`;
  - vuelven al índice las que DD-138 pasó a los pasos;
  - `revision` y `agrupacion` recorren el índice del alta y abren su puerta con `PREPARAR`;
  - `irAPaso` sale de `helpers`.
- **Para el Kit:** en `figma-pendiente` §32, el ✓ del índice y el pie «Atrás / Siguiente» sustituyen al marco del
  Stepper.

---

## DD-142 · 2026-10-01 — Con Teléfono, el teléfono saliente es obligatorio y de los números asignados; «Caducar sesión», y Recursos sin Etiquetas

**Contexto** · La segunda revisión con el equipo (2026-10-01), sobre la ficha de grupo ya con DD-141:
- un grupo tiene dos campos obligatorios: el nombre y, con Teléfono, el teléfono saliente, con el mismo aviso que el
  nombre. Hasta hoy se podía crear y guardar sin él, y el duplicado lo vaciaba;
- el número no se inventa: es uno de los asignados a la cuenta, los que tienen call blending. El desplegable dejaba
  escribir cualquiera, y su ayuda lo decía («Elige uno o escríbelo»);
- la ayuda de «Balanceada» decía «Por turnos…», que es lo que hace Rotativa;
- el cierre del chat por inactividad se llama «Caducar sesión», como en el Contact Center validado;
- Etiquetas sale de Recursos, con el trabajo guardado por si vuelve (respuesta del usuario, 2026-10-01).

**Decisión** ·
1. **Con Teléfono, el teléfono saliente es obligatorio**, como el nombre:
   - su rótulo lleva el «*» y el desplegable, `required`;
   - el resumen dice «Falta: … · teléfono saliente», y «Crear grupo» y «Guardar» esperan, con el motivo en la barra;
   - al editar, el aviso va bajo el campo y Distribución y colas lleva el punto del índice; en el alta, después de
     salir de su sección sin él, como el nombre al salir de General;
   - en el alta, Distribución no lleva su ✓ sin él, pero no es puerta: los pasos siguen libres; *(enmendado por
     DD-158, 2026-10-04: es la segunda puerta del alta, como el nombre)*
   - duplicar lo pide al enviar, como el resto de sus campos, y lleva el foco a él.
2. **Se elige de los números asignados** (`OUTBOUND_NUMBERS`, en la demo los de los grupos de ejemplo), en la ficha y
   al duplicar: el desplegable ya no deja escribir. El número que un grupo ya tuviera guardado sigue entre las
   opciones, aunque no esté en la lista: abrir la ficha no lo borra.
3. **Textos:** la ayuda del teléfono pierde «Elige uno o escríbelo», y el diálogo de duplicar dice «el teléfono saliente»,
   no «el asociado». «Balanceada»: «Reparte las conversaciones de forma equilibrada entre los agentes».
   «Cerrar chat por inactividad» pasa a «Caducar sesión», y su ayuda dice que la sesión caduca.
4. **Recursos sin Etiquetas, apagado y guardado:** el campo y su «+» quedan en la plantilla tras `conEtiquetas`
   (`false`). El grupo conserva las suyas (`labels` se lee y se guarda tal cual), y el resumen deja de contarlas
   mientras no se vean. Volver es poner `conEtiquetas` a `true`.
5. **El teléfono se nombra por su rótulo** (`ariaLabelledBy`), en la ficha y al duplicar: con `<label for>` solo, el
   lector leía el número como nombre (lo que DD-133 dejó abierto para otros selects).

**Razón** ·
- **El número sale a la calle:** es lo que ve el cliente cuando le llama un agente. Un grupo con Teléfono y sin él no
  puede llamar con su identidad, y uno inventado no está dado de alta para salir.
- **El aviso, como el del nombre:** la revisión pidió el mismo control. No acusa en un alta recién abierta; sí en un
  grupo ya guardado que no lo tiene, porque ahí falta de verdad.
- **Medido:** contra el código anterior, 11 pruebas en rojo, cada una por lo que mide:
  - el resumen sin «teléfono saliente»;
  - «Crear grupo» encendido sin número;
  - el texto de Rotativa en Balanceada;
  - «Cerrar chat por inactividad»;
  - Etiquetas a la vista;
  - un desplegable con campo para escribir;
  - un duplicado sin número.

  Con el cambio, en verde. El rótulo del teléfono se midió: su texto empieza por un espacio, y la prueba que lo busca
  por expresión regular lo tiene en cuenta.

**Descartadas** ·
- **Que Distribución sea puerta del alta, como General** → la revisión lo pide obligatorio, no que bloquee los pasos.
  El ✓ y el resumen dicen que falta.
- **Borrar Etiquetas de la ficha y del modelo** → el usuario pidió guardar el trabajo. Apagado, vuelve con una línea,
  y los grupos no pierden lo que tenían.
- **Dejar escribir un número y validarlo** → el producto solo permite los asignados (call blending), así que una lista
  cerrada no deja equivocarse.

**Consecuencias** ·
- **Pruebas:** `telefono-saliente.spec.ts` (nueva, cuatro): alta, edición sin número, lista cerrada y duplicar.
  `ficha-recursos-dialogos` gana Recursos sin Etiquetas, con sus etiquetas conservadas al guardar. Pasan al
  comportamiento nuevo las altas de grupo (`altas-meta`, `admin-forms`, `ficha-grupo`, `pase-fichas`), la ayuda de Balanceada
  (`ayudas-campos`) y «Caducar sesión» (`grupo-vision`, `ficha-grupo-textos`). `e2e/supervisor/helpers.ts` gana
  `elegirTelefonoSaliente`.
- **Un grupo guardado con Teléfono y sin número** (el duplicado de antes lo vaciaba) pide el número para guardar.
- **Enmienda** DD-121 §11 (crear espera también al teléfono saliente), DD-136 §2 (qué falta en el grupo), DD-141 §4-5
  (el nombre del cierre por inactividad) y DD-133 §1 (la ayuda de Balanceada).

---

## DD-141 · 2026-10-01 — La ficha de grupo con las palabras de la revisión de producto: las estrategias reparten conversaciones, y sale «Desbordar sesión»

**Contexto** · La revisión de producto del 2026-10-01 dio el flujo de grupos por bueno para que desarrollo empiece,
con ajustes. Estos son los de texto y de campos de la ficha de grupo, que se repiten en Contact Center › Grupos:
- dos estrategias hablaban de llamadas o de chats: «Menos llamadas atendidas» (Teléfono y «Dentro de cada nivel») y
  «Menos chats activos» (Chat);
- la ayuda de la prioridad decía, con el manual de Voice, que contaba también en las salientes (DD-133 §1), y solo
  cuenta en las entrantes;
- «Desbordar sesión» es de Chat y caduca la sesión, que es lo que ya hace «Cerrar chat por inactividad»;
- el tiempo de inactividad se da en minutos, y de fábrica son 5;
- el tamaño de cola no decía qué cuenta cada modo: Fijo es el total que espera; por agente conectado, varía;
- la tipificación llevaba al lado cuántas tiene su categoría («Consulta (3)»), y se leía como niveles o como grupos.

**Decisión** ·
1. **Las estrategias reparten conversaciones.** «Menos llamadas atendidas» pasa a «Menos conversaciones atendidas»
   (Teléfono, «Dentro de cada nivel» y Contact Center), y «Menos chats activos», a «Menos conversaciones activas»
   (Chat). Su ayuda dice conversaciones en los cuatro idiomas (`strategy_help.fewest_conversations`).
2. **Lo guardado con el nombre de antes se lee con el de ahora, sin subir la versión de ningún almacén.** El nombre
   ES el valor guardado:
   - `createVersionedStorage` gana `normalize`, que pone al día cada elemento leído de `localStorage`;
   - `GroupsStore` lo usa con `groupWithCurrentStrategies` (la lista y cada ficha), y `GroupDefaultsStore` pone al día
     sus dos estrategias al leer;
   - lo siguiente que se guarde ya va con el nombre nuevo.
3. **La prioridad solo cuenta en las entrantes.** Enmienda DD-133 §1.
4. **Sale «Desbordar sesión»** de la ficha y de Contact Center: lo cubre «Cerrar chat por inactividad», en Chat.
   `advanced.overflowSession` se sigue leyendo y guardando tal cual, y lo que alguien guardó no se pierde. Enmienda
   DD-121 §5 y DD-135 §3.
5. **«Cerrar chat por inactividad» nace con 5 minutos** (`FACTORY_GROUP_DEFAULTS.chat`): en un grupo nuevo, y en
   Contact Center mientras nadie guarde otro valor. Desde DD-142 se llama «Caducar sesión». El interruptor sigue apagado de fábrica. Los grupos de ejemplo
   guardan los 10 de siempre (`DEFAULT_CHAT_SETTINGS`).
6. **El tamaño de cola, un texto por modo.** Fijo: «Como mucho 50 conversaciones esperando en total, haya los agentes
   que haya». Por agente conectado: «Varía con los agentes conectados: 50 conversaciones en cola por cada uno».
7. **La tipificación se elige por su categoría**, sin la cuenta al lado.
8. **Los anchos, medidos de nuevo (DD-102), a 1440:**
   - en el listado, «Estrategia de teléfono» pasa de 12.5 a 14.5rem, porque su etiqueta pide 229 px con la celda;
   - «Estrategia de chat» pasa de 11 a 13.5rem, porque pide 213;
   - `tableMinWidth` pasa de 91.25 a 95.75rem: sube lo mismo que suman las dos;
   - en Contact Center, los cuatro desplegables pasan de 252 (`scale/18`) a 350 (`scale/25`).
     «Menos conversaciones atendidas» pide 270 con su flecha, y la escala no tiene peldaño entre los dos.

**Razón** ·
- **Una palabra para lo que se reparte.** La cola, el % de servicio y el tiempo máximo de espera ya decían
  conversaciones. Dos estrategias decían llamadas o chats, y la de Teléfono es también la de «Dentro de cada nivel».
- **La vía que no borra (LEARNINGS #15).** Si se renombra un valor guardado y no se pone al día, el grupo se queda con
  una estrategia que no está en su desplegable. Si se sube la versión del almacén, se borra lo que cada uno guardó en
  la demo. El normalizador al leer cuesta una función, y con él lo guardado sigue como estaba. Medido con un grupo y
  unos valores sembrados con los nombres de antes: abren con los de ahora y sin cambios pendientes.
- **Medido:** contra el código anterior, 13 pruebas en rojo, cada una por lo que mide:
  - la opción que no existe;
  - el texto viejo;
  - 10 minutos en vez de 5;
  - «Consulta (3)»;
  - 195 px de texto en una celda de 162.

  Con el cambio, en verde. La sonda de recorte de los desplegables, con el ancho de antes puesto, se pone en rojo
  en el de Teléfono de Contact Center.

**Descartadas** ·
- **Subir la versión de `sc-groups` y de `sc-group-defaults`** → borra lo guardado y re-siembra.
- **Traducir el nombre al pintarlo, en cada pantalla** → el valor guardado seguiría siendo el viejo. Cada consumidor
  tendría que acordarse de traducirlo: la lista, el orden, la búsqueda, el lote, la exportación y la ficha.
- **Quitar `overflowSession` del modelo** → borraría lo guardado. Sin pantalla no estorba.
- **Encender «Cerrar chat por inactividad» de fábrica** → la revisión fija los minutos, no que nazca encendido. Y
  «Desbordar sesión», al que sustituye, nacía apagado (DD-135 §3).
- **En Contact Center, 350 solo para los dos de estrategia** → saldrían tres anchos de control en la misma lista de
  ajustes. Con el cambio quedan dos: desplegables y números.

**Consecuencias** ·
- **Pruebas:**
  - `ficha-grupo-textos.spec.ts` (nueva, 8) fija lo de arriba, con lo guardado de antes sembrado en `localStorage`;
  - `listado-grupos.spec.ts` gana las estrategias más largas de cada catálogo a 1440, aunque ninguna semilla las use;
  - `contact-center-valores`, `listado-grupos` y `ayudas-campos` pasan a los nombres y al texto nuevos.
- **`normalize` vale para el siguiente cambio de forma**, por ejemplo el de los enlaces de agente y grupo, sin subir
  versión.
- **Fuera las claves** `overflow_session`, `overflow_session_hint` y `typification_option`; `fewest_calls` pasa a
  `fewest_conversations`.

---

## DD-140 · 2026-10-01 — Un `sc-dialog` es un solo diálogo para el lector: el de PrimeNG, con el título de nombre

**Contexto** · Al revisar los diálogos de Recursos de la ficha de grupo (2026-10-01) se midió que cada `sc-dialog`
abierto expone dos `role="dialog"` modales, uno dentro de otro: el `div.p-dialog` de PrimeNG y la `section` de la
card. El de fuera no tiene nombre: su `aria-labelledby` apunta a la cabecera de PrimeNG (`pn_id_…_header`), que con
`showHeader=false` no se pinta. En el árbol de accesibilidad de Chromium sale un diálogo modal sin nombre y, dentro,
otro con el título: un lector de pantalla anuncia dos diálogos, o uno sin nombre.

**Decisión** ·
1. **El diálogo es el de PrimeNG.** El `div.p-dialog` se queda con su `role="dialog"`, su `aria-modal` y su trampa
   de foco. La card (`section.sc-dialog`) deja de llevar rol, `aria-modal`, `aria-labelledby` y `aria-describedby`.
2. **Su nombre es el título y su descripción, el subtítulo**, por `pt.root`: `aria-labelledby` al `h2` y
   `aria-describedby` al subtítulo, que sin subtítulo no se pone. Es la API del propio nativo (DD-113 §4), como el
   `aria-label` de `p-tabs`.

**Razón** ·
- **El rol va donde está el foco.** Un diálogo modal es el que retiene el foco, y el de PrimeNG es el que lo atrapa
  y el que cierra con Escape: nombrarlo no toca su comportamiento.
- **Medido el 2026-10-01 en sc-docs** (build estático, Chromium a 1440, árbol de accesibilidad leído por CDP), antes
  y después del cambio:
  - antes, dos diálogos modales: el de fuera sin nombre, y el de dentro «¿Eliminar el agente?», con su descripción;
  - después, uno: «¿Eliminar el agente?», con la descripción «Esta acción no se puede deshacer.» y modal;
  - igual antes y después: el foco al abrir (la X), Tab y Mayús+Tab sin salir del diálogo, y Escape, que cierra y
    devuelve el foco al botón que lo abrió.

**Descartadas** ·
- **El atributo en el host (`<p-dialog aria-labelledby>`)**, que es lo que propone la sección de accesibilidad de
  primeng.dev (que todo atributo pasa a la raíz) → medido con PrimeNG 22.1.2 en el arnés unitario del DS: se queda
  en el host, y la raíz sigue apuntando a la cabecera que no existe. `ariaLabelledBy` tampoco es una entrada en esta
  versión: es un `computed` que sale de `header`.
- **Dejar el diálogo en la card y quitárselo a PrimeNG** (su entrada `role`, y `pt` para el resto) → serían tres
  cambios contra el nativo (rol, `aria-modal` y `aria-labelledby`) para llevar el diálogo a un nodo que no atrapa el
  foco, en vez de uno a su favor.
- **La cabecera de PrimeNG (`header`)** → pinta la suya, y la card del DS lleva la propia (icono, subtítulo y X) a la
  medida del Kit.

**Consecuencias** ·
- **Prueba:** `e2e/components.spec.ts`, «se anuncia UN diálogo modal…»: un solo `role="dialog"`, con el título de
  nombre, el subtítulo de descripción y `aria-modal`, y el foco dentro al tabular. En rojo contra el código anterior
  (dos diálogos), en verde con el cambio. Y en la pantalla donde se vio, `ficha-recursos-dialogos.spec.ts` pide UN
  diálogo en la página con cada «+» de Recursos abierto: con el `sc-dialog` de antes, 2.
- **Las pruebas del Supervisor que buscan un diálogo por su nombre no cambian:** antes casaban con la `section` y
  ahora con el `div.p-dialog`, que la contiene. La que lo busca sin nombre (el asistente de widgets del Dashboard)
  pasa de dos coincidencias a una.
- **Lo que va dentro de un `sc-dialog` no lleva su propio `role="dialog"`**: el diálogo ya lo pone.
- **Enmienda DD-113** (lo medido que la documentación no dice): un `p-dialog` sin cabecera se nombra por `pt.root`.

---

## DD-139 · 2026-10-01 — Un agente enseña el mismo estado en el Dashboard y en Administración › Agentes: la fuente es Administración

**Contexto** · DD-127 dejó un solo estado por agente DENTRO del Dashboard, `DEMO_AGENT_PRESENCE`, escrito a mano (5
disponibles, 4 en pausa y 1 desconectado). Administración › Agentes tiene el suyo en las semillas, `presenceStatus`, con
otro vocabulario: Disponible, No disponible, Baño, Comida, Formación, Administrativo, Post-conversando y Desconectado.
Medido el 2026-10-01 por id, ejecutando los dos ficheros: de los 10 agentes de la demo del Dashboard (ids 1 a 10), 6 no
casaban, los ids 5, 6, 7, 8, 9 y 10 (el 6, disponible en el Dashboard y desconectado en el listado). En esos seis el
desajuste sale con cualquier reparto de los estados intermedios. La ficha de grupo va a enseñar el estado de cada agente
en su tabla de agentes: con dos verdades, contradiría al Dashboard. Y copiar los valores a mano no lo cerraba, porque hay
dos caminos más para separarse: la ficha de un agente cambia su estado («Presencia inicial»), y el navegador guarda los
monitores del Dashboard con el estado que tenía cada fila (el latido los escribe cada 8 s).

**Decisión** ·
1. **La única fuente es Administración**: el `presenceStatus` de cada agente en el almacén de agentes (`AgentsStore`, que
   nace de `AGENTS_SEED`), el que pinta el listado. El Dashboard no guarda estados propios: `DEMO_AGENT_PRESENCE` se va.
2. **Los agentes de la demo del Dashboard son los ids 1 a 10 de Administración** (`DEMO_AGENTS`, `demo-entities.ts`), con
   su nombre de allí. El estado se busca por id: un agente renombrado en Administración se sigue encontrando.
3. **La correspondencia es una tabla fija**, `PRESENCIA_EN_DASHBOARD` (`dashboard/data/presencia.ts`), y cubre todos los
   estados del listado: uno nuevo no compila hasta que se decida qué es en el Dashboard.
   - Disponible → Disponible.
   - No disponible, Baño, Comida, Formación, Administrativo y Post-conversando → En pausa.
   - Desconectado → Desconectado.

   «En pausa» es todo lo conectado que no está disponible, para que disponibles y en pausa sumen los conectados de los
   anillos y del panel de grupos.
4. **El Dashboard lee el estado al pintar** (`DashboardStore.monitors`, un `computed` sobre lo guardado y el almacén de
   agentes). Cambiarlo en la ficha de un agente lo cambia en la tabla, los anillos, el panel de grupos, el detalle que
   abren y la vista previa del asistente.
5. **Lo guardado se lee de forma aditiva** (`conPresencia`): se queda todo (disposición, nombres, cifras de
   conversaciones) menos el estado y lo que se cuenta con él. `sc-dashboard-monitors` sigue en la versión 2 y
   `sc-agents` en la 3: subirlas borraría los monitores y los agentes de cada usuario.
6. Un agente de la demo que Administración ya no tiene, o que no tiene estado, cuenta como Desconectado en todas las piezas.

**Razón** · Del vocabulario corto no se saca el largo (de «En pausa» no sale si es Comida o Formación), así que la fuente
tiene que ser Administración y el Dashboard, derivar. Se lee del almacén y no de las semillas porque la ficha cambia el
estado y el listado lo enseña al momento. Lo prueba `e2e/supervisor/estado-agentes.spec.ts` sobre lo pintado en las dos
pantallas, con un caso por cada manera de volver a tener dos verdades. Los tres salieron en rojo contra `main` y en verde
con el cambio:
- los 10 agentes del Dashboard tienen el estado que les toca por el listado (en rojo, los seis de arriba);
- un monitor guardado con todos sus agentes desconectados y el anillo a 0 enseña el estado de Administración (en rojo,
  mandaba lo guardado);
- un agente en pausa puesto Disponible en su ficha sale disponible en el Dashboard y el anillo suma uno (en rojo, el
  listado lo enseñaba y el Dashboard no).

**Descartadas** ·
- **Copiar a mano los estados de un lado al otro** → arregla los 10 de hoy y deja dos listas, que se separan en cuanto
  alguien edita una. Tampoco cubre la ficha ni lo guardado.
- **Que la fuente sea el Dashboard** (cambiar las semillas para que cuadren con sus 5, 4 y 1) → del estado del Dashboard
  no sale el del listado: habría que inventar a mano un motivo de pausa por agente, y cambiarían también las 144 copias
  de esos seis entre los agentes generados.
- **Subir la versión de los monitores** para que se regeneren con el estado nuevo → borra los monitores que haya montado
  cada usuario, y el siguiente cambio de estado pediría otra subida.
- **Un cuarto estado, «En conversación»**, como el monitor del Supervisor, que cuenta aparte a quien está en una
  conversación o acaba de salir de ella → cambia la tabla, los anillos, el asistente y el catálogo, y no hace falta para
  que las dos vistas cuadren. Si llega, Post-conversando pasa ahí: una línea de la tabla.

**Consecuencias** · El Dashboard enseña las cifras de Administración: 5 disponibles, 3 en pausa y 2 desconectados («5 de 8
conectados» y «3 de 8» en pausa; el panel de grupos, 8 conectados y 5 disponibles). Enmienda DD-127 §1 (de dónde sale el
estado, y sus cifras) y DD-129 (el panel cuenta los mismos agentes, con el estado de Administración); la prueba de DD-129
deja de fijar 9 y 5 y lee las cifras de la tabla del primer monitor. La tabla de agentes de la ficha de grupo, cuando
enseñe el estado, lee el mismo `presenceStatus` y cuadra con el Dashboard sin nada más. Queda dicho y sin tocar: la ficha
llama al campo «Presencia inicial» y el listado lo enseña como el estado de ahora; la demo usa un solo dato para las dos
cosas.

---

## DD-138 · 2026-10-01 — Las altas van en pasos: el Stepper vertical nativo de PrimeNG

> **Revertida por DD-143** (2026-10-01): la segunda revisión con el equipo no quiso el Stepper. Las altas vuelven al
> índice de la edición, y se quedan la plantilla por sección, la puerta del grupo, el ✓ al dejar una sección completa
> (ahora en el índice), «Atrás» y «Siguiente» (al pie) y que la sección no vaya en la dirección.

**Contexto** · Producto (2026-09-29), con el gradiente de meta en los formularios: en el alta, los pasos en columna;
cada uno abre su contenido debajo y se pliega con ✓ al acabarlo; la edición sigue con el índice lateral. Señaló el
Stepper de primeng.dev y pidió revisar DD-121, que lo había descartado. Hasta hoy las tres altas eran su ficha con el
índice (DD-121 §11, DD-122).

**Decisión** · (decisión de producto, 2026-09-29)
1. **El alta va en pasos; la edición, con el índice.** Al crear, y al duplicar un agente o un usuario, el `p-stepper`
   vertical ocupa el sitio del índice y del contenido; el resumen sigue a la derecha. Es el nativo tal cual (DD-113):
   `p-stepper` › `p-step-item` › `p-step` + `p-step-panel`, sin envoltura del DS y sin CSS `.p-*`. Se le ajustan dos
   cosas, con su propia API: el fondo del panel, transparente por `dt` de la instancia (el del preset pintaba una
   franja gris en oscuro), y la envoltura del panel, por `pt` (§9).
2. **Un formulario, dos maquetas.** El cuerpo de cada sección vive en su `ng-template`: la edición lo pinta junto al
   índice, y el alta dentro de su paso (`sc-alta-pasos`, de la app). Los pasos salen de las secciones del índice
   (`pasosDeAlta`), así que tienen sus nombres y su orden.
3. **La puerta del grupo sigue (DD-121 §11).** Sin nombre o sin canales, los pasos 2 a 4 van apagados (`disabled` del
   nativo), y «Siguiente» en General dice lo que falta y lleva el foco al campo. En agente y usuario, los pasos van en
   cualquier orden.
4. **✓ en el paso que se deja completo**, dentro del título nativo, con el texto oculto «completado» en el nombre de
   su pestaña. El abierto no lo lleva aunque esté bien. El número lo sigue pintando el nativo.
5. **«Atrás» y «Siguiente» al pie de cada paso, en las tres altas**: atajos al paso de al lado, que llevan el foco a
   su pestaña. En agente y usuario no son una puerta. «Crear …» sigue siendo la única acción que crea, arriba (DD-122
   §6), y se enciende desde cualquier paso. El último paso solo lleva «Atrás».
6. **Cambiar de paso no toca la dirección** ni el historial: Atrás del navegador sale del alta. Las tres altas quitan
   `?seccion=` al abrir, y crear abre la edición en la sección del paso abierto, ya con su índice.
7. **Cada paso abierto lleva su título de nivel 2**, oculto porque lo dice su pestaña, y su panel se llama así. La
   sección va sin su cabecera, a sangre (`sc-section-card` con `flush` y sin `showHeader`), y sin el margen con el
   que se separa de otra tarjeta.
8. **El aire, en la escalera 7 · 14 · 28**: 28 de la sección a «Atrás / Siguiente», y 28 de ahí al paso siguiente.
9. **El movimiento es el de PrimeNG tal cual** (2026-10-01): al cambiar de paso, el que se deja se pliega y el nuevo
   se abre a la vez, con su `p-collapsible` (0,2 s, `ease-out`). La envoltura del panel no se estira a la fila que
   anima (`pt` `contentWrapper`, `align-self: start`), para que la línea entre pasos siga al plegado.

**Razón** ·
- **El gradiente de meta, a la vista.** Los pasos dicen cuánto queda y el ✓ lo que ya está, sin porcentaje (DD-121,
  DD-126, DD-136).
- **DD-121 lo descartó porque serían dos formularios**, pasos para crear e índice para editar. Con una plantilla por
  sección y los pasos sacados del índice es un formulario con dos maquetas: lo que cambia en una sección cambia en
  las dos.
- **Nativo, porque es el componente que se señaló**: su teclado, sus pestañas y su plegado vienen hechos (DD-113).
- **Medido el 2026-09-29, en este build:**
  - con el margen de la tarjeta dentro del paso había 49 del último campo a los botones y 21 de ahí al paso
    siguiente; ahora, 28 y 28;
  - sin el título oculto, el alta de grupo saltaba de h1 a h3 («Canales»), y el panel nativo no tenía nombre: le pone
    `aria-controls`, no `aria-labelledby`;
  - con las altas de agente y usuario en la medida completa de `theme-contrast`, lo único en rojo es el marcador de
    la foto (2,58:1, abierto en DD-136): los colores del Stepper pasan en claro y en oscuro.
- **El plegado, medido el 2026-10-01, fotograma a fotograma y a cámara lenta al 10 %:**
  - anima de verdad: el paso que se deja y el nuevo, en unos 175 ms de fotogramas, sin fotogramas perdidos;
  - pero la línea que une los números se despegaba del paso siguiente. A mitad (100 ms), en General, la caja medía
    114 y la línea 36. Al abrir Distribución y colas, 666 y 456. El hueco llegaba a 90 px;
  - la causa es de PrimeNG: aplica la fracción dos veces en la misma rejilla del `p-motion`. Su alto sale de
    X·contenido, y luego reparte ese alto con la misma X, así que su fila mide X·caja. El contenido no se nota, porque
    lo recorta la caja; la línea sí, porque sigue a la fila. Se reproduce con sus reglas tal cual, sin nuestra capa;
  - con la envoltura sin estirar, la línea mide lo que el contenido y la caja la recorta igual que a él: llega al
    borde de la caja en cada fotograma, al plegar y al abrir. Quieto no cambia nada: fila, envoltura y contenido
    miden lo mismo.

**Descartadas** ·
- **`linear` del nativo para la puerta del grupo** → apaga también los pasos terminados: para volver a General no
  bastaría su pestaña.
- **Una cabecera de paso propia, con el título y el ✓** → perdería la pestaña, el teclado y el `aria-current` del
  nativo.
- **El paso en la dirección** (`?seccion=` con `replaceUrl`, como hacía el índice del alta) → cambiar de paso no es
  navegar, y una dirección que abre un paso invita a saltarse la puerta.
- **Envolverlo en el DS** → lo usa una pantalla, las tres altas, y el nativo sirve tal cual, como `p-tabs` (DD-113).
- **La sección con su caja dentro del paso** → caja dentro de caja: a sangre, el paso hace de caja.
- **Pasos también al editar** → producto lo pidió para el alta. Al editar se va a una sección concreta, y el índice
  lleva a ella con un enlace (DD-122).
- **El panel en bloque, para quitar la rejilla de fuera** → la medida no cambia: la fracción se aplica dos veces
  dentro de la misma rejilla, la del `p-motion`.
- **Otra duración u otra curva para el plegado** (300 ms con la curva enfática del Kit) → el plegado de PrimeNG no
  tiene token; cambiarlo sería CSS sobre `.p-collapsible-*`, un desvío que caza `audit:primeng-coupling` §F, y
  movería a la vez todos los plegables (acordeón, panel, menús).

**Consecuencias** ·
- **Enmiendas:**
  - DD-121: §11, el alta va en pasos con la misma puerta; y su descarte del Stepper;
  - DD-122: §1, §3 y §4, que en las altas dejan de aplicarse: no hay índice y el paso no va en la dirección;
  - DD-130: §2 y su descarte de «Siguiente» en agente y usuario, que ahora es un atajo en las tres.
- **Límites del nativo que se aceptan (DD-113):**
  - los paneles viven dentro del `tablist`, y el paso abierto se marca con `aria-current="step"` en su envoltura, no
    con `aria-selected`;
  - el plegado anima la altura (`grid-template-rows`), con la duración y la curva de PrimeNG, que no tienen token.
    Con menos movimiento, el paso cambia de golpe;
  - el título del paso pesa 500; en oscuro, el del paso abierto va en el color primario;
  - en el alta el contenido mide 995 a 1440 (812 al editar);
  - de la cabecera del paso a su contenido hay 23: los 15,75 con los que el cuerpo de `sc-section-card` `flush` se
    separa de su cabecera, que aquí está oculta, más los 7 del nativo. Quitarlos es un cambio del DS, con sus
    capturas.
- **Pruebas:**
  - `altas-pasos.spec.ts`, diez. Ocho se escribieron antes que el código: siete en rojo contra él, y la octava, «al
    editar, el índice», es de guarda. La del aire y la de los títulos, en rojo con el margen (49) y sin el título;
  - se reescriben para los pasos la puerta de `ficha-grupo` y las altas de `indice-enlaces`, `pase-fichas`,
    `ficha-usuario-agente`, `usuario-plantillas` y `contact-center-valores`. «Atrás del navegador sale del alta» se
    pone en rojo si el paso cambia la dirección, y también si deja una entrada de historial;
  - el alta de grupo entra en `focus-ring`; `irAPaso()` en `helpers.ts`;
  - `altas-pasos-movimiento.spec.ts`, tres, sin `disableAnimations`, con el plegado congelado a mitad. La de la línea,
    en rojo primero (36 de 114). La del movimiento nativo y la de menos movimiento son de guarda: esta última se pone
    en rojo sin la preferencia, con 13 alturas a medias.
- **Para el Kit:** el marco del Stepper vertical en las tres altas, con el ✓, «Atrás» y «Siguiente» y su aire, va a
  `figma-pendiente` §32.
- **Herramientas:** `revision` y `agrupacion` recorren los pasos. Al llegar al primer paso apagado rellenan lo que lo
  abre (`PREPARAR`), y `agrupacion` falla si alguno sigue apagado. El nombre de la vista va sin el número del paso
  (prueba unitaria, en rojo primero).

---

## DD-137 · 2026-10-01 — El sidebar sigue a su tablero de Figma: sin anclar, plegado guarda lo abierto, blanco al 100% e iconos de 14

**Contexto** · SISMAC-4340. Producto revisó el tablero del sidebar en Figma (`khNq9dJKNi13pNllrqm6dx`, nodo `14912:6324`):
iconos grises que no tocaban y padres sin su cyan. Al medirlo salieron más diferencias, entre el propio tablero y
contra el código:
- **En el código**, el icono iba al 50% de blanco y el texto al 60%; en el tablero, los dos al 100%.
- **Los tamaños**: 16 en el primer nivel, 14 en los hijos y 13 en los nietos; en el tablero, 14 en todos.
- **Plegado a 80**, el código solo pintaba abierta la rama de la página; el tablero dice que lo abierto sigue abierto.
- **Producción tenía un botón de anclar** que el tablero no tiene.

**Decisión** · (decisión de producto, 2026-10-01; enmienda DD-118 §2 y §5)
1. **Sin botón de anclar.** Fuera el botón, su clase y el recuerdo en el navegador (`sc-sidebar-anclado`). Si vuelve,
   será con el Sidebar de primeng.dev de la rama experimental, cuando los devs pasen a PrimeNG 22.
2. **Plegado a 80 se pinta abierto lo mismo que desplegado.** Ninguna categoría se repliega por no ser la de la página.
3. **Texto e icono de cada fila en blanco al 100%** (`--sc-sidebar-fg`); con el ratón encima solo cambia el fondo. La
   flecha, al 60% (`--sc-sidebar-fg-muted`). Los títulos de sección, en caption regular, blancos y sin espaciado extra.
4. **Todos los iconos a 14.**
5. **Los iconos los manda el catálogo del tablero** (sección «Iconos del menú», nodo `14912:6774`): cada sidebar del
   tablero y el código toman de ahí el suyo. En el código solo cambia que Administración lleva `groups` y Grupos
   `group`, que estaban cruzados; la paleta de comandos copia el icono del menú.
6. **«Diseñador VUI» y «Análisis de Flujo»** en todo el Supervisor en español. «Análisis» también en inglés, francés y
   portugués; «VUI Designer» se queda como nombre de producto en esos tres.
7. **La fila SCC es CusCare (`SCC-*` es su clave de Jira) y lleva el logo de CusCare del DS** (Figma `13775:62831`) en
   vez de un icono. En el código, `public/logos/cuscare-isotype.svg` como máscara con el color de la fila (blanco en
   reposo, navy seleccionada), en la caja de `--sc-icon-size-default`. En el tablero, una instancia del logo en cada
   sidebar; la tarjeta del catálogo («SCC (ignorar)») no cambia.

**Razón** ·
- **Medido en Figma** (exportando a SVG los 199 iconos del tablero): todas las filas con texto e icono en `#FFFFFF`,
  flechas al 60% y un solo cyan por sidebar.
- **Medido en el código**, a 1440×900 contra `ng serve`: `e2e/supervisor/sidebar-tablero.spec.ts`. Son cuatro
  pruebas, verdes en local y las cuatro en rojo contra producción, que aún lleva lo anterior. Fallan por lo que deben:
  - plegado se repliega Supervisión;
  - el botón de anclar existe;
  - el texto va al 60%;
  - el icono de Supervisión mide 16.
- **La flecha al 60% pasa el 3:1 que pide un indicador.** Los suelos medidos son 0,338 sobre una fila con el ratón
  encima y 0,5 dentro del bloque de hijos (DD-118).

**Descartadas** ·
- **Arreglar el gris en la librería Smart-Contact Icons** (quitar el color de dentro del dibujo, publicar y aceptar la
  actualización) → se eligió arreglarlo solo en el tablero. Ahí los iconos van desligados de la librería y pintados
  a mano. El gris de los botones del DS sigue pendiente aparte.
- **Los iconos de los plegados** (`query_stats`, `dashboard`, `build`, `finance_mode`, `support_agent`, `folder`) → se
  llegaron a poner en todo el tablero y en el código, y se quitaron: manda el catálogo.
- **Atar a variable el icono del seleccionado en Figma** (`primary/color`) → «No hace falta que usemos variables».
  Sigue en negro en el tablero; en el código va en el navy de la barra.

**Consecuencias** ·
- **Figma:** el plegado antiguo del tablero (`14912:6420`) pasa a 16 de margen interior y esquinas a 12, sin la fila
  «Monitor Selected» escondida. Los iconos de los sidebars son copias desligadas de Smart-Contact Icons: si cambia el
  catálogo, hay que volver a pasarlos.
- **Sin seguir del tablero todavía:**
  - «Lo abierto se recuerda al recargar»: el código empieza vacío en cada carga.
  - «Ir a otra página no abre ni cierra nada»: el código abre la rama de la página al entrar.
  - El texto de la fila: el código lo pinta en body 14 regular y el tablero en 13 Medium, que no está en la escala.

---

## DD-136 · 2026-09-29 — Las altas dicen lo que falta, hasta «Listo para crear»

**Contexto** · Producto pidió (2026-09-29) llevar a los formularios el efecto de gradiente de meta: que nazcan con
valores por defecto y el usuario solo cambie lo que necesite. DD-135 hizo que las altas nazcan con los de Contact
Center; faltaba que dijeran cuánto queda. El resumen de la ficha de grupo decía «Falta: nombre · canales» (DD-121),
pero al completarse desaparecía sin confirmar nada. Los de agente y usuario no decían nada: solo el motivo del botón,
en la barra de arriba y de uno en uno.

**Decisión** · (decisión de producto, 2026-09-29)
1. **Las tres altas dicen en su resumen lo que falta**, «Falta: nombre · extensión», y en cuanto el botón «Crear …» se
   enciende, «Listo para crear». Sin porcentaje ni barra (DD-121, DD-126). **Enmendado por DD-143 (2026-10-01)**:
   además, la sección que se deja sin lo obligatorio lleva el punto rojo del índice, y la que se deja completa, ✓; un
   alta recién abierta sigue sin acusar.
2. **Qué falta:** en el grupo, nombre y canales (y, desde DD-142, con Teléfono, el teléfono saliente); en el agente,
   nombre y extensión; en el usuario, nombre y email. Un
   error de formato (un nombre repetido, un email o un PIN mal escritos) se dice en su campo, y mientras lo haya el
   resumen no dice «Listo».
3. **Una pieza compartida, `sc-summary-status`** (de la app, no del DS), arriba del resumen:
   - un solo `role="status"`, que existe desde que se abre el alta y cambia en su sitio;
   - reserva su línea aunque esté vacía, así el resumen no salta;
   - «Falta» en el ámbar de los avisos (`--sc-text-warning`), con su icono; «Listo» en el verde de éxito
     (`--sc-text-success`), con `check_circle`; los dos iconos a 600, como su texto semibold (DD-130).
4. **Al editar, nunca «Listo».** «Falta» sale solo si se vacía un obligatorio, como ya hacía la ficha de grupo.
5. **Textos:** lo común pasa a `common` (`summary_missing`, `summary_missing_name`, `summary_ready`); lo de cada
   entidad se queda en ella (canales, extensión, email).

**Razón** ·
- **Cuanto más cerca se ve la meta, antes se termina.** Con los valores de Contact Center, al alta de grupo solo le
  falta el nombre, y decirlo en palabras lo hace visible.
- **«Listo para crear» confirma** lo que antes solo decía un botón al pasar de gris a azul.
- **Palabras, no un número.** Un porcentaje cuenta campos, no lo que importa: DD-121 descartó el de la maqueta, que
  arrancaba en 33 % con el alta vacía y marcaba siempre 100 % al editar.
- **El lector anuncia el cambio porque la región ya existe.** Un `role="status"` que se inserta con su texto no se
  anuncia de forma fiable; por eso la pieza está desde el principio, aunque vacía.

**Descartadas** ·
- **Porcentaje o barra de progreso** → DD-121 y DD-126.
- **Decir en el resumen los errores de formato** → ya están en su campo, en rojo; repetirlos sería ruido.
- **«Listo» también al editar con cambios** → la barra ya dice «Cambios sin guardar» (DD-122).
- **Quitar el motivo de la barra ahora que lo dice el resumen** → va junto al botón apagado y dice por qué no se
  puede. Y por debajo de 1340 el resumen es una franja encima del contenido que se va al bajar; la barra de arriba
  se queda.

**Consecuencias** ·
- **Pruebas:** `altas-meta.spec.ts`, siete:
  - cinco de comportamiento, cuatro en rojo contra el código anterior (la quinta, de guarda, «al editar nunca
    Listo», ya pasaba);
  - dos del contraste de «Listo» en claro y en oscuro, que `theme-contrast` no ve porque abre las altas vacías; la
    de claro, en rojo con el color cambiado a propósito (2,95:1).
- **`theme-contrast`** mide entera el alta de grupo.
- **Queda abierto:** las altas de agente y usuario aún no entran en la medida completa de `theme-contrast`. El
  marcador de la foto (`sc-photo-upload`, del DS) mide 2,58:1 y un icono pide 3:1: usa el color de «deshabilitado»
  sin estarlo. Es un arreglo del DS, con su captura de sc-docs, para su propio cambio.

**Actualización (2026-10-05)** · Cerrado. El marcador usa `--sc-icon-secondary`, el secundario de los iconos del DS, y
mide 3,96:1 en claro. Las altas de agente y usuario entran en `RUTAS` de `theme-contrast`, en rojo antes del arreglo
(solo el marcador, en claro) y en verde después, en los dos temas.

---

## DD-135 · 2026-09-29 — Contact Center fija con qué nace un grupo o un agente, con los valores del documento de producto

**Contexto** · Con qué nacía un grupo se fijaba en «Valores por defecto», un botón del listado de grupos
(`/admin/grupos/valores-por-defecto`, decisión de producto del 2026-09-18). Contact Center › Grupos y › Agentes eran
réplicas de sus maquetas (Figma Supervisor 1:12676 y 393:12562) que guardaban en memoria y nadie leía: multiselecciones
de estrategia, prioridad y voz (códecs), cola FIFO/LIFO, una fila «Llamadas internas», una columna «Permisos» y un título
de la URL que ninguna ficha tiene. El alta de agente nacía con permisos escritos en el código. De fábrica, un grupo nacía
con 30 s de transferencia, 120 s de espera en cola y 20 s de % de servicio. El documento de producto de usuarios y
grupos trae otros «parámetros por defecto»: transferencia 10 s, espera en cola 15 s, % de servicio 60 s, prioridad baja,
estrategia balanceada, tiempo administrativo casi nulo y desbordar si los agentes están inactivos; y, para agentes,
permisos a todo menos la numeración especial, gestión de dispositivos, activación por grupo y dispositivos externos.

**Decisión** · (decisión de producto, 2026-09-29)
1. **Contact Center es la única fuente.** Contact Center › Grupos (`/config/aed/grupos`) fija con qué nace un grupo, y
   Contact Center › Agentes (`/config/aed/agentes`), con qué nace un agente. Las dos guardan (`GroupDefaultsStore`,
   `AgentDefaultsStore`) y las altas leen lo guardado. Duplicar sigue copiando del original.
2. **Con las palabras de cada ficha.**
   - Grupos: lo que era la página del listado (General, reglas comunes, Teléfono, Chat y Ficha de cliente), en la
     tarjeta de Contact Center con su `h1`.
   - Agentes: la matriz de la ficha de agente (cuatro destinos por Llamadas y Transferencias, con casilla de columna),
     su Configuración (gestión de dispositivos y activación por grupo) y su Integración (URL del iframe y dispositivos
     externos).
   - Fuera: las multiselecciones, FIFO/LIFO, los códecs, «Llamadas internas» y el título de la URL.
3. **De fábrica, los valores del documento de producto.**
   - Grupo: transferencia 10 s, espera en cola 15 s y % de servicio 60 s, en Teléfono y en Chat; tiempo administrativo
     5 s; prioridad Baja; Balanceada en los dos canales; desbordar si todos los agentes están inactivos, encendido.
     «Desbordar sesión», apagado: el documento no le da valor. **Enmendado por DD-141 (2026-10-01)**: «Desbordar
     sesión» sale de la pantalla, y «Cerrar chat por inactividad» nace con 5 minutos.
   - Agente: llamadas y transferencias a fijos, móviles e internacionales, y no a la numeración especial; gestión de
     dispositivos, activación por grupo y dispositivos externos, encendidos; grabación apagada; sin URL de iframe.
   - Los grupos y agentes de ejemplo no cambian (`DEFAULT_ADVANCED`, `SEED_AGENT_PERMISSIONS`).
4. **Fuera «Valores por defecto» del listado de grupos**, el botón y la página. Su dirección lleva a Contact Center ›
   Grupos. `GroupDefaultsStore` conserva su clave y su versión: lo guardado allí sigue valiendo, y la cola única de antes
   cae en los dos canales.
5. **«Tiempo máximo de espera en cola» dice qué pasa al agotarse**, en la ficha (Teléfono y Chat) y en Contact Center:
   «Si nadie la atiende en este tiempo, la conversación sale del grupo y pasa al siguiente destino, que se elige en el
   VUI Designer.» El grupo es un nodo AED del árbol del VUI, y quien lo diseña elige qué pasa al salir de él (respuesta
   de producto, 2026-09-29). Chat usa el mismo texto: el nodo es el mismo.

**Razón** ·
- **Un valor por defecto vive en un sitio, y ese sitio guarda.** Había dos páginas para lo mismo, y la de Contact
  Center no guardaba. Contact Center es donde el superadmin lo tiene todo; producto recorta después qué ve cada rol.
- **Un alta que nace con lo habitual solo pide lo propio.** Es el efecto de gradiente de meta: cuanto menos le falta a
  un formulario, antes se termina. Con los valores de fábrica, a un alta de grupo le falta el nombre (Teléfono ya viene
  marcado); lo demás se cambia si hace falta.
- **La ayuda de la cola sale de quien lo sabe.** Ninguna fuente escrita decía qué pasa al agotarse (DD-133); la
  respuesta vino de producto.

**Descartadas** ·
- **Dejar los valores junto al listado de grupos** (decisión del 2026-09-18) → eran dos sitios para lo mismo. Producto
  la retira.
- **Conservar la réplica con sus multiselecciones** → un valor por defecto es uno: una multiselección de estrategias no
  dice con cuál nace un grupo. Sus códecs, FIFO/LIFO y «Urgente» no existen en la ficha.
- **«Rotativa (por turnos)» en Chat, como equivalente de balanceada** → «Balanceada» ya es estrategia de chat
  (`CHAT_STRATEGIES`), y el documento pide balanceada.
- **Cambiar también los grupos de ejemplo** → movería pantallas y pruebas que los miran sin ganar nada: el documento
  habla de con qué nace un grupo.
- **Subir la versión de `GroupDefaultsStore`** → borraría lo guardado.
- **Guardas de acceso para las casillas de Acceso** (abierto en DD-132) → el prototipo es el superadmin y lo contiene
  todo; producto recorta qué ve cada rol.

**Consecuencias** ·
- **Enmiendas:**
  - DD-121 §11 (el alta nace con lo de Contact Center) y §12 (Valores por defecto sale del listado); su «Fuera a
    propósito» ya no incluye `/config/aed/grupos`;
  - DD-132: se cierran sus dos «Queda abierto». Tipificaciones va con la supervisión (confirmado) y no hay guardas;
  - DD-133: la ayuda de la cola sale de Descartadas y de «Queda abierto».
- **Pruebas:**
  - `contact-center-valores.spec.ts`, seis, las seis en rojo contra el código anterior;
  - `ayudas-campos.spec.ts` gana una, en rojo sin la ayuda en la ficha y, aparte, sin la de Contact Center;
  - se retiran las dos de valores por defecto de `grupo-vision`, la del `h1` de `ficha-usuario-agente` y la dirección
    vieja en `theme-contrast` y `agrupacion`;
  - en `listado-grupos`, un grupo nuevo solo de Chat nace con Balanceada.
- **Figma:** las maquetas 1:12676 y 393:12562 siguen dibujando la réplica (`figma-pendiente`, 30).
- **Queda abierto:** las ayudas de la lista de ajustes de Contact Center van bajo el nombre y el lector no las anuncia
  con su control, porque los campos del DS no dejan pasar `aria-describedby`. En las fichas sí se anuncian: van en el
  `helperText`.

**Actualización (2026-10-05)** · Cerrado. Los campos del DS ganan `ariaDescribedBy`, y cada fila de ajustes de Contact
Center lleva el id de su ayuda en su control: las 14 de Grupos y las 3 de Agentes. El cómo, en la actualización del
mismo día de DD-133.

---

## DD-134 · 2026-09-28 — Los commits firman con la cuenta del mantenedor, y ningún squash deja el mensaje a GitHub

**Contexto** · El repo es público y un commit fundido es un documento del proyecto (AGENTS.md §«Pull
requests y commits»). Al fundir por squash con el mensaje por defecto, desde la web o con
`gh pr merge --squash` sin `--body`, GitHub añade una línea `Co-authored-by:` por cada autor de commit
que no es quien funde. Las sesiones cloud firmaban con la identidad del contenedor, que es la de la
herramienta (`/root/.gitconfig`, medido el 2026-09-28), y así entraron en `main` cinco fusiones con la
herramienta de coautora entre el 2026-09-21 y el 2026-09-28 (#223, #224, #266, #267 y #270) sin que
ningún commit de sus ramas llevara la línea; dos (#223 y #266) las fundió el robot de la auditoría. Las
sesiones locales firmaban con una identidad de relleno, `x <x@y.z>`, que ha dejado su coautor en 121
commits de `main`. Ni `bash-guard` ni `pr-footer-guard` lo veían: ese mensaje no lo escribe ninguna sesión.

**Decisión** · (decisión de producto, 2026-09-28)
1. Los commits de las sesiones, en la nube y en local, firman con la cuenta de GitHub del mantenedor. En
   la nube la fija `scripts/hooks/cloud-identity.mjs` al arrancar (SessionStart): actúa si el clon
   firmaría como la herramienta y `origin` es este repo (un fork no firma con ella), sin depender de
   `CLAUDE_CODE_REMOTE`: en una sesión programada de ese día, `cloud-node.sh`, que sí depende de ella, no
   puso su Node ni `node_modules`, y no quedó medido por qué. En local, la config de git del repo en la
   máquina del mantenedor.
2. La autofusión de la auditoría escribe el mensaje del squash: título y cuerpo del PR, sin trailers ni
   el pie de la herramienta (`scripts/mensaje-squash.mjs`, desde `audit-automerge.yml`). Un test impide
   que un workflow vuelva a fundir por squash sin `--subject` y `--body`.
3. `audit:commit-attribution` (gate 44 de `verify`) pone rojo un commit de la rama que tenga el correo
   de la herramienta de autor o de committer, o una línea de atribución al principio de una línea del
   mensaje. Mira `origin/main..HEAD`; el job `verify` del CI hace el checkout con la historia entera.
4. Lo que ya está en `main` se queda. 820 commits llevan el coautor de la herramienta, casi todos con la
   línea escrita en el propio commit (la atribución del CLI estuvo encendida hasta el 2026-09-14), y 121
   el de relleno. Reescribir `main` cambiaría los SHA que citan este log, los hand-offs y los PR.

**Razón** · Con autor y quien funde en la misma cuenta, GitHub no añade coautor: medido en el #249,
que mezclaba commits de las dos identidades y solo sacó de coautora a la de relleno. Con el mensaje
escrito, GitHub lo usa tal cual: medido el mismo día en el #279, de una rama `prueba/*` desechable a
otra, un commit firmado con el correo de la herramienta fundido con los comandos del robot entró con
cero líneas de coautor; con el mismo `gh pr merge --squash` sin `--body`, el #266 la llevaba.

**Descartadas** ·
- Una identidad neutra: no nombra a la herramienta, pero cada fusión seguiría sumando su línea de
  coautor, que es lo que ya hacía `x <x@y.z>`.
- El correo privado de GitHub (`…@users.noreply.github.com`) en vez del de la cuenta: no deja el correo
  escrito en el repo, pero no está medido que GitHub lo trate como la misma cuenta al fundir, y el
  correo de la cuenta ya sale como autor de cada fusión de `main`.
- Borrar la línea a mano al fundir desde la web: era la regla de AGENTS.md, y aun así entraron cinco.
- Reescribir la historia de `main` para quitar las líneas (punto 4).

**Consecuencias** · Un PR fundido desde la web con el mensaje por defecto entra sin coautor si sus
commits son de la cuenta de quien funde; la auditoría del 2026-10-05 será la primera que el robot funda
con el mensaje escrito. El proxy de git de la nube acepta el push con la cuenta del mantenedor: medido
el mismo día desde una sesión cloud (0dcfe28, en una rama de prueba ya borrada), y GitHub atribuye ese
commit a su cuenta. El contenedor lo firma con su clave SSH, que GitHub da por buena solo para la cuenta
de la herramienta (`verified: true` en 1f7abca1, d9783902 y 8d34a82c): con el correo del mantenedor, el
PR enseña esos commits sin verificar (`unknown_key`, medido en 0dcfe28). La fusión de `main` la firma
GitHub en cualquier caso.

**Ampliación (2026-10-04)** · (decisión de producto) Las sesiones cloud tampoco firman con la clave de la
herramienta: `cloud-identity.mjs` pone `commit.gpgsign=false` en el clon cuando la config global la activa.
Por qué: el aviso de Stop del entorno (`~/.claude/stop-hook-git-check.sh`, que solo corre si hay firma
configurada) bloquea el cierre de cada turno con commits sin pushear y manda re-firmarlos con la identidad de
la herramienta (`git commit --amend --reset-author`), lo que contradice el punto 1 y pone rojo el gate 44; y
la firma no aporta nada verificable (arriba: `unknown_key`, y la fusión de `main` la firma GitHub). Medido que
nada del repo lee firmas de commits: un `git grep` de `gpgsig`, `%G`, `verify-signatures` y «signed» en
workflows, scripts y docs solo da `audit-commit-attribution`, que mira la identidad, no la firma. Descartado:
editar el aviso del entorno, que se regenera en cada contenedor y no es de este repo, y re-firmar como la
herramienta, que es lo que esta decisión descarta.

## DD-133 · 2026-09-28 — Las ayudas bajo los campos salen de las fuentes y se anuncian con su campo

**Contexto** · Revisión de las ayudas de las fichas de administración con dos fuentes:
- **el manual de usuario de Voice**, que explica campo a campo el nodo AED y el agente;
- **el documento de producto de usuarios y grupos**, con los parámetros, sus valores habituales y lo que se usa.

Lo que había:
- **La estrategia de teléfono** solo explicaba Niveles, con «la tabla de abajo» (ya no está debajo), y Agente exclusivo.
  Las otras cinco, nada.
- **Prioridad** no decía en qué llamadas cuenta. **El % de servicio** se explicaba con sus propias palabras («cuentan
  como atendidas a tiempo las que se atienden antes de este tiempo»).
- **Cuatro ⓘ en la ficha de grupo**, puestas «mientras se decide el copy final» (2026-09-18). Dos repetían el rótulo
  (música de espera, número de WhatsApp) y dos, la ayuda visible de su campo (Voz, dominios).
- **«Desbordar sesión»** decía «al superar su límite», sin límite a la vista.
- **La ayuda de un `sc-select` no se anunciaba.** El DS ponía `aria-describedby` (y `aria-required`, `aria-invalid`) en
  la envoltura `<p-select>`, no en el elemento que recibe el foco. Y un select rotulado con `<label for>` no tenía
  nombre: el lector leía el valor.
- **Los desplegables del DS** decían «Sin opciones», «Sin resultados», «Buscar» y «{0} seleccionados» en español en
  los cuatro idiomas: eran literales en sus `input()`.

**Decisión** ·
1. **Ayudas nuevas, del manual:**
   - Prioridad: cuenta en las llamadas entrantes y en las salientes, telemarketing incluido. **Enmendado por DD-141
     (2026-10-01)**: la revisión de producto lo corrige, y solo cuenta en las entrantes;
   - Estrategia de teléfono: una línea por cada una de las seis que describe el manual, que cambia con la elegida.
     Skills sale apagada con su motivo y no lleva. **Enmendado por DD-142**: la de Balanceada decía «Por turnos…»,
     que es Rotativa; ahora, que reparte de forma equilibrada;
   - Extensión del agente: Tel atiende en el móvil; WebRTC, en el navegador, con Smart Contact Agent.
2. **Reescritas:**
   - % de servicio: cuenta las atendidas en ese tiempo o menos;
   - Niveles, sin «la tabla de abajo»;
   - Voz: la voz sintética de los anuncios;
   - dominios: una sola ayuda, con lo que decía la ⓘ. Va dentro del campo, así que la fila se alinea arriba y
     «Añadir» pasa a `md`, la altura del campo (centrado, caía 21 px, contra campo y ayuda);
   - «Desbordar sesión»: tras un minuto sin actividad, como dice el documento de producto. Sin pantalla desde DD-141.
3. **Fuera las cuatro ⓘ de la ficha de grupo.** Su texto pasa a la ayuda visible, o sale si repetía el rótulo.
4. **La ayuda va en el `helperText` del campo, que la anuncia.** En el DS, `sc-select` pasa sus `aria-*` al elemento
   que recibe el foco por passthrough (`pt.label`), como ya hacía `sc-password`. Los selects que se tocan se nombran por
   su etiqueta (`ariaLabelledBy`).
5. **En el DS, los textos fijos de `sc-select` y `sc-multiselect` salen de su diccionario** (`sc.select.*`, cuatro
   idiomas), como `sc-drawer`. Quien los pase por entrada, manda.
6. **Fuera las claves `*_filtered`** de usuarios, grupos y agentes, que nada usaba.

**Razón** ·
- **Nada inventado:** cada ayuda dice lo que dice una de las dos fuentes. Lo que ninguna explica se queda sin ayuda
  antes que con relleno (AGENTS «UX de pantalla» 3).
- **Una ayuda que el lector no anuncia no ayuda a quien más la necesita.** Medido antes del cambio: la estrategia, la
  prioridad y la extensión no tenían ni nombre accesible; los dominios, descripción vacía.

**Descartadas** ·
- **Ayuda para «Tiempo máximo de espera en cola»** → el manual lo define con sus mismas palabras, y ninguna fuente dice
  qué pasa al agotarse. Queda como pregunta para desarrollo. Respondida en DD-135, que añade la ayuda.
- **Ayuda para «Tipo de agente»** (Normal, CusCare…) → ninguna fuente explica esos tipos. El manual explica la
  extensión, y ahí va.
- **Ayudas para las estrategias de chat** → el manual es de Voice.
- **Quitar los literales del DS y dejar que traduzca PrimeNG** (su `setTranslation`) → una app que no configure PrimeNG
  pasaría a inglés.

**Consecuencias** ·
- **Pruebas:** `ayudas-campos.spec.ts` gana cinco, las cinco en rojo contra el código anterior. La línea base de
  estructura de sc-docs cambia en los dos selects con error: sus `aria-*` bajan al combobox.
- **CHANGELOG:** `[Unreleased]` › Changed y Fixed.
- **Queda abierto:**
  - qué pasa al agotarse el tiempo máximo de espera en cola (respondido en DD-135);
  - los subtítulos de sección, que no se tocan aquí;
  - los selects de la app rotulados con `<label for>` y sin `ariaLabelledBy` que esta tanda no toca: en la ficha de
    agente, «Tipo de agente» y «Presencia inicial» se anuncian como «normal» y «disponible» (medido el 2026-09-28).
    Un gate que los cace evitaría el siguiente.

**Actualización (2026-10-05)** · Cerrado lo de los selects sin nombre, con su gate. Medido en el navegador recorriendo
las secciones de las fichas, Sistema y el constructor de reglas: PrimeNG nombra un combobox sin nombre con la opción
elegida («cuscare», «Sin tipificación», «8 caracteres», «Servicio»). Un `<label for>` sí nombra un `sc-multiselect`,
porque su combobox es un `<input>`, y no un `sc-select`, cuyo combobox es un `<span>`.
- **En el DS**, `sc-select` gana `ariaLabel`, que es el nativo de `p-select` y llega al combobox. Sus opciones
  apagadas dicen `aria-disabled` (`pt.option`, con el `context` de cada opción). `sc-bulk-edit-menu` nombra sus tres
  desplegables con las palabras de su frase: «Cambiar», «de» y «a».
- **`audit:screen-hygiene` gana la regla**, sin sumar gates: todo `sc-select` y `sc-multiselect` lleva `label`,
  `ariaLabelledBy` o `ariaLabel`. Un `<label for>` vale solo para el multiselect, y un `aria-label` en el host no
  vale. Cazó 31 de 119: 23 en el Supervisor, 3 en el DS y 5 en sc-docs. Quedan 0.
- **El arreglo**, en cada sitio como ya hacían sus vecinos: con rótulo a la vista, `ariaLabelledBy` con el id del
  rótulo; sin él, `ariaLabel`. Los cuatro desplegables de una condición de regla se nombran por lo que eligen (Campo,
  Operador, Valor, Unidad), en los cuatro idiomas. Los snippets de sc-docs enseñan el rótulo que su demo pinta.
- **Pruebas:** la unitaria de la regla, la vitest de `sc-select` y `desplegables-con-nombre.spec.ts`, las tres en rojo
  contra el código anterior.

Y las ayudas que van al lado de su campo, no debajo (la fila de un interruptor, de Contact Center o de Sistema), se
veían y no se oían: ningún control las apuntaba, y los campos del DS no dejaban.
- **En el DS**, seis campos ganan `ariaDescribedBy` (ids separados por espacios), que se oye después de la ayuda propia:
  `sc-select`, `sc-multiselect`, `sc-inputnumber`, `sc-toggleswitch`, `sc-textarea` y `sc-selectbutton` (los ids los
  junta `joinDescribedBy`, en `sc-field`). `sc-multiselect` lleva además sus `aria-*` al `<input role="combobox">`
  (`pt.hiddenInput`, que PrimeNG 22.1 pinta aunque sus tipos no lo declaren): en la envoltura no se oían su ayuda ni su
  error.
- **En las pantallas**, cada ayuda lleva id y la apunta su campo principal: 12 en la ficha de grupo (con «Mensajes en
  cola»), 6 en la de agente, 1 en la de usuario, 3 en Contact Center › Agentes, 14 en Grupos y 6 en Sistema. Con una
  ayuda para dos campos (la cola: tipo y tamaño), los dos la apuntan. La fila de borrar los datos no cuenta: su botón
  confirma con su propio texto.
- **Pruebas:** `ayudas-campos` recorre esas vistas, con lo plegado abierto, y pide que cada ayuda la anuncie un campo de
  su caja (42 en rojo antes); en sc-docs, que el error de un multiselect se anuncie con su combobox.

---

## DD-132 · 2026-09-28 — Qué trae cada tipo de usuario: cuatro tipos, cada uno con su plantilla de acceso

**Contexto** · El tipo de usuario no significaba nada: elegirlo no marcaba ni una casilla, y DD-130 §4 dejó el alta sin
ninguna, con la pregunta de qué trae cada tipo abierta en DD-121. Producto la respondió con dos fuentes y dos
respuestas:
- **el documento de producto de usuarios y grupos**, con una matriz de permisos por rol (configuración del sistema,
  configuración del AED, y alta, edición y borrado de grupos, agentes y repositorios) para Superadmin, Administrador,
  Supervisor Online y Supervisor Offline;
- **los perfiles del manual de usuario de Voice**;
- **las respuestas (2026-09-28):** los cuatro tipos del documento, y la supervisión para todos con lo sensible a mano.

Lo que había: cuatro tipos (administrador, supervisor, agente y visor), 11 secciones y 5 permisos. Ninguna de las
áreas del documento (Grupos, Agentes, Repositorios, Contact Center, Sistema) tenía casilla.

**Decisión** ·
1. **Cuatro tipos**, del que más puede al que menos: Superadmin, Administrador, Supervisor Online y Supervisor Offline.
   «Agente» deja de ser un tipo de usuario: los agentes tienen su ficha. Lo guardado con los tipos de antes
   (`supervisor`, `viewer`, `agent`) se lee como Supervisor Offline, el que según el documento «se queda igual».
2. **Una casilla por destino del menú.** Secciones nuevas: Tipificaciones, Grupos, Agentes, Repositorios, Contact
   Center y Sistema. Permisos nuevos: gestión de grupos, de agentes, de repositorios y de Contact Center.
   «Grupos / Agentes / Tipificaciones» juntaba tres destinos que el menú separa: sale de la vista y sigue en el modelo,
   y lo guardado en ella no concede nada nuevo.
3. **La plantilla de cada tipo** (`user-packages.core.mjs`):

   | | Superadmin | Administrador | Sup. Online | Sup. Offline |
   |---|---|---|---|---|
   | Supervisión (Dashboard, Servicios, Nodo IA, Tipificaciones, Campañas, Conversaciones, Estadísticas y sus dos hijas) | ✓ | ✓ | ✓ | ✓ |
   | VUI Designer y Usuarios, y su gestión | ✓ | ✓ | — | — |
   | Grupos, Agentes y Repositorios, y su gestión | ✓ | ✓ | ✓ | — |
   | Contact Center, y su gestión | ✓ | ✓ | — | — |
   | Sistema | ✓ | — | — | — |
   | Grabaciones, transcripciones y espiar | ✓ | a mano | a mano | a mano |
4. **Lectura aditiva** (`resolveUserAccess`, como `resolveGroup`): una casilla que un usuario guardado no tenía se lee
   apagada. `sc-users` no sube de versión, que borraría lo creado en la demo.
5. **En la ficha:**
   - el alta nace Supervisor Offline con su plantilla (enmienda DD-130 §4: ya no nace vacía, y lo sensible sigue
     apagado);
   - elegir el tipo marca su plantilla: en un alta que nadie tocó, sin preguntar; al editar, o con casillas tocadas,
     pregunta cuántas cambian, con «Aplicar la plantilla» o «Mantener las casillas». El tipo cambia en los dos casos;
   - Acceso dice «Plantilla: X» y, si alguien se apartó, «· N cambios» con «Volver a la plantilla»;
   - los anillos del resumen cuentan las casillas que se ven: 16 secciones y 9 permisos;
   - el desplegable de tipo se nombra por su etiqueta (`ariaLabelledBy`): el lector leía el valor en crudo.
6. **Los usuarios de ejemplo:** U001 (el de la barra) es Superadmin; U005, Administrador; U002 y U006, Supervisor
   Online; U003 y U004, Supervisor Offline. Tres siguen su plantilla y tres llevan cambios a mano, para que el desvío
   se vea.
7. **En el listado**, la columna Tipo mide 10,75rem, lo que pide el más largo de los cuatro idiomas, «Superviseur hors
   ligne» (DD-102). A 8,5rem se cortaban los dos Supervisor ya en español.

**Razón** ·
- **El reparto es el del documento.** Lo que no reparte lo respondió producto: la supervisión, para los cuatro; lo
  sensible, a mano salvo en Superadmin.
- **Tipificaciones va con la supervisión**, porque el menú la pone ahí.
- **Al editar se pregunta.** El laboratorio aplicaba el paquete sin preguntar y pisaba casillas elegidas a mano; eso
  no se copia.
- **El tipo cambia antes de preguntar**, así el desplegable nunca enseña un valor que el formulario no tiene.

**Descartadas** ·
- **Que el tipo bloquee casillas** → el documento reparte plantillas, no bloqueos, y la app aún no tiene guardas de
  acceso: una casilla que no se puede tocar prometería una restricción que nadie aplica.
- **Deducir las casillas nuevas de «Grupos / Agentes / Tipificaciones»** → concedería gestión sin que nadie lo
  decidiera. Mínimo privilegio.
- **Subir la versión de `sc-users`** → borraría los usuarios creados en la demo.
- **Un aviso de color para el desvío, como en el laboratorio** → apartarse de la plantilla es legítimo, y una línea de
  texto informa sin alarmar.
- **Agrupar las casillas de Acceso por área del menú** → con 25 casillas se leería mejor, pero cambia la forma de la
  sección entera. Queda para cuando se revise Acceso.

**Consecuencias** ·
- **Enmiendas:** DD-130 §4 (el alta). Cierra la pregunta abierta de DD-121.
- **Pruebas:**
  - `usuario-plantillas.spec.ts` gana cinco, las cinco en rojo contra el código anterior;
  - `user-packages.test.mjs` gana siete, en `test:unit`;
  - cambian a propósito `pase-fichas` (25 casillas, 9 marcadas) y `resumen-widget` (8 de 16, 2 de 9).
- **Queda abierto:** que las casillas restrinjan de verdad (guardas de ruta y de acción), y confirmar con producto que
  Tipificaciones va con la supervisión. Las dos, respondidas en DD-135: Tipificaciones va con la supervisión, y no hay
  guardas, porque el prototipo es el superadmin y producto recorta qué ve cada rol.

---

## DD-131 · 2026-09-28 — El panel rápido de agentes mide lo que lleva dentro, y una casilla fija se lee marcada

**Contexto** · Revisión de producto del panel «Agentes · <grupo>» del listado de grupos (DD-121 §10): demasiado
ancho, con mucho aire entre el nombre y las columnas; se pidió compactarlo y quitarle ruido con la guía de pulido.
Medido a 1440 en claro, antes del cambio:
- **El ancho era un `52rem` fijo**, el de la tabla de la ficha: 832 px, con 450 px del final de un nombre a su
  primera casilla en un grupo de dos canales, y filas de 46.
- **En los grupos de un solo canal**, 9 de los 14 del ejemplo, la única columna eran casillas grises: 13 de 13
  bloqueadas en «ACD Demo C2CB», porque el último canal de un agente no se quita (DD-121 §8).
- **Una línea «Canales: …» bajo el título** repetía las cabeceras.
- **La casilla del último canal**, marcada y desactivada, se leía como apagada. El DS aplicaba la opacidad de
  desactivado dos veces, en la casilla y en su caja: 0,6 × 0,6 = 0,36, contra el 60 % de Figma.
- **La ayuda del candado mandaba a «Quitar del grupo»**, un rótulo que el panel no enseñaba: la papelera no decía
  nada al pasar por encima.

**Decisión** ·
1. **El ancho sale de las columnas**: 15rem de nombre, 5rem por canal, 6,5rem de nivel con la estrategia Niveles,
   2,5rem de papelera y el marco del cajón. Nunca menos de 28rem, lo que piden el título y la barra en una línea, y
   nunca más que la pantalla (`min(…, 100vw)`).
2. **Un grupo de un solo canal no pinta columna de canal**: todo agente asignado lo atiende. La columna vuelve si
   alguna fila LLEGÓ sin canal al abrir (datos de antes, o recortada), porque es la única forma de dárselo desde
   ahí, y se queda hasta cerrar el panel.
3. **La tabla gana una densidad compacta solo para el panel** (`compact` en `sc-agent-channel-table`): filas `sm`,
   5rem por canal y 2,5rem de papelera. La ficha no cambia. Enmienda DD-121 §10, que pedía la MISMA tabla: lo sigue
   siendo en reglas y palabras, no en medidas.
4. **Fuera la línea de canales** bajo el título.
5. **El aire, a la escalera de DD-123**: 14 entre el aviso, la tabla y el pie, y 7 entre los controles de la barra.
   Antes, 12,25 en todo.
6. **La papelera dice «Quitar del grupo» al pasar por encima**, lo mismo que nombra la ayuda del candado. Esa ayuda
   dice ahora dónde está: «Para sacarle del grupo, pulsa la papelera de su fila», en los cuatro idiomas.
7. **En el DS, `sc-checkbox` desactivado lleva la opacidad una vez**, el 60 % de Figma. Es un fallo contra la
   especificación, no un cambio de estética; sc-docs enseña el caso «Deshabilitado y marcado».

**Razón** · Medido después, en el mismo build:

| | Antes | Después |
|---|---|---|
| Ancho con dos canales | 832 px | 476 px |
| Ancho con un canal | 832 px | 448 px |
| Del nombre a su primera casilla (dos canales) | 450 px | 154 px |
| Alto de fila | 46 px | 34 px |
| Casillas en un grupo de un canal | 13, todas bloqueadas | ninguna |
| Opacidad efectiva de la casilla fija | 0,36 | 0,6 |

Con cuatro canales, 636 px y todas las cabeceras en una línea, en los dos temas.

**Descartadas** ·
- **Un ancho fijo menor, p. ej. 36rem** → con un canal seguía el hueco y con cuatro canales y Niveles no cabía.
- **Estrechar el nombre por debajo de 15rem** → con uno o dos canales manda el mínimo de 28rem y no gana nada, y un
  nombre largo con «En pausa» dejaría de caber.
- **Mantener la columna en los grupos de un canal con la casilla sin bloquear** → dejaría a un agente sin canales,
  contra DD-121 §8.
- **Decidir la columna por las filas de AHORA** → al marcar la casilla de la fila sin canal, la columna desaparecía
  y el panel encogía bajo el puntero. Lo cazó su prueba, que falla con esa regla.
- **Arreglar la opacidad solo en la app** → el fallo es del DS y lo hereda cualquier casilla desactivada.

**Consecuencias** ·
- **Pruebas:** `panel-agentes-grupo.spec.ts` gana cinco, que contra el código anterior daban cinco de cinco en rojo.
  `components.spec.ts` vigila la opacidad en sc-docs.
- **La captura de referencia del checkbox** de sc-docs se regenera con el workflow `visual-baselines`.
- **CHANGELOG** `[Unreleased]` › Fixed.

---

## DD-130 · 2026-09-27 — El pase de diseño de las fichas: la franja, las altas, Guardar, el usuario nuevo y los saltos por canal

**Contexto** · Con el resumen ya como widget (DD-126), se revisó el flujo rehecho de administración con las guías de
maquetación y de pulido: listados, panel rápido, las tres fichas por sección, las altas, los valores por defecto y
Contact Center, a 1440 y 1280 y en los dos temas. Salieron siete hallazgos, que se enseñaron con capturas y con lo
propuesto ensayado en la página real (inyectando el CSS, sin tocar el código). Se aplicaron los siete.

**Decisión** ·
1. **La franja (por debajo de 1340)**: el anillo va junto a su cifra, a 28; las tarjetas de una fila miden lo mismo;
   y en la tarjeta de datos del grupo, clave y valor van en dos columnas que comparten reparto, salida y recursos
   (`subgrid`). La columna de 1440 no cambia.
2. **Las tres altas, iguales.** La cabecera de la ficha se pinta también al crear: «Nuevo agente» o «Nuevo usuario»
   («Duplicar …» al duplicar) hasta que se escribe el nombre, como en el grupo. El botón principal dice lo que hace:
   «Crear agente» y «Crear usuario», como «Crear grupo». «Siguiente» sigue solo en el grupo, donde General es la
   puerta (DD-121). Desde DD-138, «Atrás» y «Siguiente» van en las tres altas, como atajos entre pasos, y desde DD-143
   al pie de cada sección; puerta, solo la del grupo.
3. **Guardar deja en la ficha, también en la de usuario.** Al editar se queda; al crear, abre la edición del usuario
   nuevo en la sección en la que se estaba. Hasta hoy, la de usuario volvía siempre al listado.
4. **Un usuario nuevo nace sin secciones ni permisos**, por mínimo privilegio. Qué paquete trae cada tipo pasa a las
   preguntas abiertas de DD-121. Los usuarios de ejemplo no cambian.
5. **Distribución y colas lleva saltos a cada canal**: una línea arriba de la sección («Ir a: Teléfono · Chat ·
   Email»), solo con dos o más canales. El salto lleva al bloque y deja el foco en su título, sin navegar. Respeta
   DD-121 §5: nada nace plegado.
6. **El icono de un aviso pesa lo que su texto**: 600 junto a semibold, en «Sin agentes», «Sin número» y «Falta:
   nombre».
7. **En el listado de grupos, el botón de cada fila dice «Asignar»**. Antes decía «Agentes», pegado a la columna
   «Agentes». Su nombre accesible ya era «Asignar agentes de …».

**Razón** ·
- **La franja**, medida a 1280:
  - de la cifra a su anillo había 290 px en el usuario 3 y 440 en el grupo 11;
  - entre clave y valor de la tarjeta de datos, unos 450;
  - la tarjeta «Tipo» medía 65 de alto junto a dos de 105.

  Ahora el anillo va a 28, los cinco valores caen en una sola vertical y la fila tiene una sola altura.
- **Las altas.** El título de agente y usuario medía 1 px (estaba oculto), y al crear aparecía la cabecera y la ficha
  saltaba hacia abajo, contra AGENTS «UX de pantalla» 7. Con la cabecera en los dos modos, el índice queda a la misma
  altura al pasar del alta a la edición (medido). De DD-138 a DD-143 el alta no tuvo índice; desde DD-143 lo tiene,
  y quedan a la misma altura el índice y el contenido.
- **El usuario nuevo** abría con las 16 casillas marcadas, «Gestión de usuarios» y «Espiar conversaciones»
  incluidas, fuera cual fuera su tipo. El anillo del resumen lo puso a la vista: 11 de 11 y 5 de 5 nada más abrir.
- **Distribución y colas** mide 2.355 px con los cuatro canales: quedan 1.816 bajo el pliegue a 1440 y 2.148 a 1280.
- **Guardar** hacía dos cosas distintas, desde el mismo botón y el mismo sitio, según la ficha.
- **El peso del icono** se arregla en la app, porque `sc-icon` ya acepta `weight`.

**Descartadas** ·
- **En la franja, tarjetas de ancho fijo como los widgets de iOS** → conservaba la composición de la columna, pero
  dejaba hueco a la derecha de la fila, y en el grupo las barras por canal perdían ancho.
- **Esconder también el título del alta de grupo**, la otra forma de igualar → la ficha saltaría al crear, que es
  justo lo que se arregla.
- **«Siguiente» en agente y usuario** → sería una puerta que esas fichas no piden, porque se rellenan en cualquier
  orden. Con los pasos (DD-138), y al pie de cada sección desde DD-143, va como atajo, no como puerta: se siguen
  rellenando en cualquier orden.
- **Que las tres vuelvan al listado al guardar** → obliga a reabrir la ficha para tocar otra sección.
- **El paquete por tipo del laboratorio para el usuario nuevo** → no está validado con producto.
- **Plegar cada canal de Distribución y colas** → esconde lo configurado y enmienda DD-121 §5.
- **Una fila por canal en el índice lateral** → pediría cambiar `sc-form-section-nav` (DS); los saltos son solo de
  la app.

**Consecuencias** ·
- **Enmiendas:** enmienda DD-122 §8 (agente y usuario llevan la cabecera también en el alta) y la regla 4 de
  `page-identity.spec.ts` para las fichas.
- **Para el Kit:** el peso de los iconos junto a texto semibold dentro de piezas del DS (el título de cada sección y
  la fila activa del índice) va a `figma-pendiente` §29.
- **Pruebas:** lo vigila `e2e/supervisor/pase-fichas.spec.ts`, que contra el código anterior daba 10 de 12 en rojo.
  Las otras dos son el patrón del grupo y la guarda de «un solo canal, sin saltos».

---

## DD-129 · 2026-09-27 — El panel de grupos deja de inventar sus conectados: agentes reales, no una cifra por cola

**Contexto** · DD-127 cerró la tabla y el anillo de «Monitor x», y dejó anotado sin tocar que el panel de grupos
(`buildWidget`, case `group-panel`) seguía inventando «conectados»: `int(3,4) * n` (n = colas del panel), sin
relación con los agentes reales de la demo. En «Colas y agentes» (4 colas) esto daba 12 o 16 conectados con solo 10
agentes reales, y el detalle (`detail.ts`) truncaba en silencio a los 9 que hay de verdad (`pool.slice(0, count)`):
la cifra de arriba no tenía techo, el detalle sí.

**Decisión** · `connected` y `available` del panel de grupos salen de `DEMO_AGENT_PRESENCE`, la misma fuente que ya
usa `agents-state` desde DD-127: `connected` = agentes no-offline (9), `available` = agentes disponibles (5). El
panel agrega sobre todos los agentes de la demo, no sobre los de un grupo concreto — la demo no modela ese reparto
por grupo —, así que se usa el total real en vez de escalar una cifra con el número de colas del panel.

**Razón** · Medido en «Colas y agentes» tras el cambio: «Conectados» dice 9 y «Disponibles» 5, y abrir el detalle de
cada cifra lista exactamente 9 y 5 filas, sin truncar. `dashboard.spec.ts` («cuenta agentes reales…») salió en rojo
contra el build anterior (12 conectados, no 9) y en verde con el arreglo.

**Descartadas** ·
- **Mantener `int(3,4) * n` y solo subir el techo del detalle** → esconde el síntoma (la cifra de arriba seguiría
  sin relación con agentes reales) en vez de arreglar la causa.
- **Derivar `connected` por grupo** (qué agentes atienden cada grupo seleccionado) → la demo no tiene esa relación
  grupo↔agente; inventarla para este panel sería otro dato fabricado, más difícil de auditar que el actual.

**Consecuencias** · `total`, `attended` y el resto de cifras de conversación del panel siguen siendo pseudoaleatorias
(son cifras de cola, no de plantilla de agentes) y no se tocan aquí. El mismo `case 'group-panel'` lo usan también
el asistente de widgets y el panel «Groups» del primer monitor sin pasar por `buildWidget` (va escrito a mano, ya
correcto); los dos quedan consistentes con el mismo mecanismo.

---

## DD-128 · 2026-09-27 — El botón `danger` de TEXTO sube a red-600: cierra los tres últimos botones bajo AA

**Contexto** · `theme-contrast` tenía fichado desde el 2026-09-26, el día que la ficha de grupo entró en su barrido,
que el «Eliminar» de la cabecera de las fichas de grupo, agente y usuario (`sc-button variant="danger"
appearance="text"`) pinta su etiqueta en `red-500`: 3.76:1 sobre blanco, bajo el 4.5:1 de WCAG AA. El `danger`
SÓLIDO ya se había arreglado así (§1.8, 2026-07-19); el de texto quedó fuera porque tocaba un token de un componente
compartido, no una ficha, y customs-catalog §1.8 lo dejó anotado con el arreglo exacto sin aplicarlo.

**Decisión** · `--sc-cmp-button-text-danger-color` (claro) sube de `red-500` a `red-600` — el mismo par de colores
que el sólido, mismo 4.83:1. A diferencia del sólido (cuyo token no lo consume nadie), este SÍ lo lee el preset por
`var(...)`, así que va por el mecanismo de `outlined.secondary` (§1.8, ya declarado): el slot sale de la zona
`@sc-gen` y se fija a mano en `04-component.css`, con `light:button.text.danger.color` en el `EXCLUDE` de
`cmp-color-map.mjs` para que el generador no lo reescriba.

**Razón** · Medido tras el cambio: `admin/grupos/editar/11` en claro pasa de 3.76:1 a 4.83:1 en el botón «Eliminar»
de la cabecera; oscuro no cambia (ya usaba `red-400`, sin fallo). `theme-contrast.spec.ts` perdía su caso conocido
(la línea del array `CONOCIDOS_CLARO`) y salía en rojo contra el `red-500` anterior; en verde con el token a
`red-600`. `tokens:parity`, `tokens:guard` y `tokens:cmp-rewire` limpios; la suite entera de `theme-contrast`
(91 tests) en verde.

**Descartadas** ·
- **Arreglarlo por ficha** (una clase local en las tres páginas de ficha) → el botón es del DS y sus otros
  consumidores (fuera de las fichas) seguirían bajo AA; es una decisión del componente, no de la pantalla.
- **Hardcodear `{red.600}` en el preset**, como el sólido → innecesario: a diferencia del sólido, el token de este
  slot SÍ lo consume el preset, así que puede ir por el mecanismo de token + `EXCLUDE`, más simple de cerrar cuando
  Figma suba el valor.

**Consecuencias** · Cierra la lista de §1.8: no queda ningún botón del DS bajo AA. Todo uso de `appearance="text"` +
`variant="danger"` de la app (no solo las fichas) hereda el cambio. Se cierra cuando el Kit suba
`button.text.danger.color` a `red-600` (customs-catalog §1.8).

---

## DD-127 · 2026-09-27 — Los datos de demostración del Dashboard cuadran entre widgets: un solo estado por agente

**Contexto** · Al medir el monitor (DD-125) quedó sin verificar que la cabecera de la tabla de agentes de «Monitor x»
nombraba 10 agentes y la tabla enseñaba 8. Medido el 2026-09-27 en el build de producción: las filas estaban escritas a
mano y faltaban Keanu Reeves y Viola Davis. La misma pantalla se contradecía en dos cosas más:
- el detalle del anillo «Agentes disponibles · 5» listaba como disponibles a los cinco primeros de la lista, entre ellos
  Denzel, en pausa en la tabla, y Leonardo, desconectado;
- el latido de 8 s movía por separado los disponibles del anillo y los del panel de grupos. A los 24 s el panel decía 4
  y el anillo 6, con 5 puntos verdes en la tabla, y el detalle de un «6» no podía listar un sexto disponible.

**Decisión** ·
1. **Un solo estado por agente de la demo**, `DEMO_AGENT_PRESENCE` (`dashboard/data/demo-entities.ts`): 5 disponibles,
   4 en pausa y 1 desconectado. Lo leen las tablas de agentes (la de «Monitor x» y las que crea el asistente), los
   anillos (los de las demos y los que crea el asistente con agentes de la demo) y su detalle, que lista a los que están
   en ese estado y no a los primeros de la lista.
2. **La tabla de «Monitor x» enseña los 10 agentes que nombra su cabecera.** El almacén de monitores sube a la versión 2,
   para que un navegador que ya guardó la demo vea la nueva.
3. **Los disponibles no derivan en el latido**, ni los del anillo ni los del panel de grupos: son el estado de cada
   agente. Lo demás (en curso, en espera, tendencias, totales del día) sigue moviéndose.
4. **Los totales de la tabla llevan raya arriba.** Con 10 filas a 900 de alto la tabla se desplaza 8 px por dentro (a
   800 de alto ya pasaba con 8 filas), y la última fila quedaba pegada a «Totales», que van fijos al pie. La raya va por
   fuera, justo encima: sin desplazar cae sobre la de la última fila y se ve una sola.

**Razón** · En una demo, una pantalla que se contradice (6 disponibles en el anillo, 4 en el panel de al lado y 5
puntos verdes en la tabla) se lee como un fallo del producto, no de los datos. Medido con el cambio, a 1440:
- la tabla enseña 10 filas;
- el anillo dice «5 de 9 conectados» y el panel de grupos, 5 de 9, durante cuatro latidos;
- el detalle del «5» lista a los 5 disponibles de la tabla;
- en «Colas y agentes», «5 de 9» y «4 de 9», con sus 5 disponibles y sus 4 en pausa.
Lo prueba `dashboard.spec.ts`, que salió en rojo contra el build anterior porque faltaban 2 de los 10 agentes.

**Descartadas** ·
- **Dejar la tabla y su cabecera en 8** → el anillo de al lado vigila a los mismos 10 («5 de 9»), y el de «Colas y
  agentes» también: los dos monitores se habrían contradicho entre sí.
- **Que el latido cambie también el estado de los agentes** → la tabla, los anillos y el panel tendrían que cambiar a la
  vez. Para una demo bastan los disponibles fijos, y lo demás sigue vivo.

**Consecuencias** · Un panel de grupos que crea el asistente sigue inventando sus conectados («12 conectados» con 10
agentes en la demo), y su detalle lista a los 9 conectados que hay. Es una cifra de colas, no de estos agentes, y no se
toca aquí.

---

## DD-126 · 2026-09-27 — El resumen de las fichas, como widget: la cifra cuenta y el anillo nativo se llena

**Contexto** · Revisión de producto: el resumen de la derecha de las fichas de grupo, agente y usuario (DD-121 §3,
DD-122 §8) enseñaba cifras sueltas en tarjetas blancas, y se pide que se lea como un widget: la cifra grande, un anillo
pequeño que se llena con la proporción y una cuenta sutil, como el ejemplo «Preview» de ProgressSpinner en primeng.dev.
Solo en las tres fichas: el «impacto estimado» del constructor de reglas se queda como está. Se construyó un prototipo
con dos superficies conmutables por la URL (blanca con borde · tinte de marca), se midió en el build y se eligió sobre
capturas y vídeo.

**Decisión** ·
1. **Cada proporción es un widget** (`sc-summary-kpi`, en `shared/components`): el rótulo con su icono, la cifra grande
   con «/total» y, al lado, el `p-progress-spinner` NATIVO en modo determinado (`value` sobre `max`) a 42, con el arco
   en `--sc-bg-accent` por `[dt]` y su «N%» oculto por `[pt]`, como en el ejemplo (`customs-catalog` §8). Lo que no es
   una proporción (reparto, salida, recursos, el tipo) va en una tarjeta de datos, uno por línea.
2. **Anillo en toda proporción**, la misma pieza en las tres fichas: grupo, agentes activos sobre asignados (el canal
   sin nadie sigue avisando debajo, con icono y texto); agente, grupos activos sobre asignados (sin grupos, sin anillo
   y «Sin grupos»); usuario, secciones y permisos.
3. **Se mueve al abrir y al cambiar** (enmienda DD-121 §3, que animaba solo al cambiar): el anillo se llena desde
   vacío con su transición nativa, y la cifra cuenta a la par (`CountUpDirective`), con la misma curva del arco
   (`ease`) y redondeada, en `--sc-transition-slow`. La directiva lee la duración del CSS, así que con menos movimiento
   y en las e2e la cifra sale ya final. Al lector de pantalla le llega la cifra final en un texto oculto («8 de 11»),
   no la cuenta.
4. **El anillo va oculto al lector** (`aria-hidden`): su `progressbar` lleva `aria-busy="true"` y anunciaría «cargando»
   de un dato que no carga. La proporción ya la dice el texto oculto.
5. **La tarjeta, en el tinte de marca** *(DD-161: salvo la cifra principal, con el degradado del botón principal)*
   (`--sc-bg-primary-subtle`), sin borde a la vista (transparente, para que con
   colores forzados siga teniendo contorno). En claro es el mismo color que `--sc-bg-selected`; se eligió sabiéndolo,
   porque estas tarjetas no se pulsan ni se eligen.
6. **Todo el texto de la tarjeta, en `--sc-text-primary`**, rótulos, «/total», canales y claves incluidos: sobre el
   tinte, el secundario no llega a AA (ver Razón). La jerarquía la llevan el tamaño y el peso. El aviso ámbar del grupo
   («Sin agentes», «Sin número») lleva el ámbar en el icono, y el texto en primario. Confirmado el mismo día frente a
   la tarjeta blanca, que dejaba el gris en 4,52: en claro, los rótulos solo suben de slate-600 a slate-700; en
   oscuro, de gris a blanco.
7. **`theme-contrast` perdona el gris secundario solo sobre sus dos fondos aceptados** (el lienzo y slate-100), no con
   cualquier fondo, y suma a sus rutas las fichas de agente y usuario.

**Razón** ·
- Medido en el build a 1440, con los datos de siempre: 16 anillos en seis fichas y dos temas, todos a 42×42, con el arco
  en su token, el «N%» sin pintar y `aria-hidden`. El resumen del grupo 11 a 1366×660 mide 554 y cabe sin scroll (lo
  vigila `ficha-grupo.spec.ts`).
- Contraste contra la tarjeta: el texto, 6,46:1 en claro y 15,57 en oscuro; el arco, 4,29 y 3,18 (un objeto gráfico
  pide 3); el icono del aviso, 4,31.
- El secundario (slate-600) solo llega a AA sobre blanco (4,52:1), y sobre el tinte mide 3,96. `theme-contrast` no lo
  vio porque perdonaba ese color con cualquier fondo: con el perdón atado a sus fondos, fallan exactamente las tres
  fichas y ninguna de las otras 18 rutas. El ámbar como texto, sobre el tinte, 4,31 a 12 px.
- La cifra y el arco (usuario 3, aperturas en frío): arrancan en el mismo fotograma. Con ease-out y truncando, la
  cifra seguía en 7 con el arco al 99 % y acababa hasta 66 ms después. Con la curva del arco y redondeando, en el
  instante en que cambia cada cifra el arco va a la par: al pasar a 6 de 8, al 58 %; a 8, entre el 92 y el 95 %. La
  final llega con el arco o antes (de 0 a 101 ms), nunca después.
- Con menos movimiento, ninguna cifra intermedia: la prueba confirma en la página que la preferencia llegó
  (`matchMedia`) antes de medir, y con la duración sin apagar enrojece (se vieron 1, 4, 6, 7 y 8).
- En los datos de prueba, el anillo sale a medias en 4 de 6 usuarios, 5 de 14 grupos y 4 de 20 agentes con grupos: dice
  algo. Un anillo siempre lleno no diría nada.

**Descartadas** ·
- **La tarjeta blanca con borde y sombra suave** (la otra superficie del prototipo) → con ella el gris secundario
  cumplía (4,52), pero se eligió el tinte, que se lee como un widget sobre la página blanca.
- **Una tarjeta navy o en degradado, como la del ejemplo** → no hay token para una superficie así, en oscuro sería una
  superficie clara, y el degradado es color decorativo (AGENTS «UX de pantalla» 1).
- **`sc-gauge`** → no se mueve y empieza en 96 px. El anillo del ejemplo es el `p-progress-spinner` nativo.
- **El porcentaje de la ficha completa** → DD-121 ya lo descartó: siempre marcaba 100.
- **Canales cubiertos como anillo del grupo** → salía a medias en 3 de 14 grupos, y el canal sin nadie ya avisa en su
  fila.
- **Mover solo al cambiar** (lo de DD-121 §3) → al abrir, la cifra y el anillo se leerían parados, que es justo lo que
  el widget viene a cambiar. Si repetido cansa, es una línea.
- **Dejar el gris secundario sobre el tinte**, como el límite conocido de `customs-catalog` §1.5 → ese límite es del
  lienzo, y se acepta porque el texto secundario vive sobre blanco. El tinte sería el primer sitio de la app con el
  gris bajo AA en reposo.
- **Oscurecer los rótulos solo en claro** → pediría una regla por tema en la hoja de la app, y el tema oscuro vive en la
  capa 7 de tokens (se quitó `:host-context(.sc-dark)` el 2026-09-14).

**Consecuencias** · Enmienda DD-121 §3 (las cifras se mueven también al abrir) y DD-122 §8 (el resumen de agente y
usuario deja las cifras sueltas). `customs-catalog` §8 recoge el «N%» oculto; `figma-pendiente` §18, el widget, que el
Kit no tiene; la tabla de AGENTS, la pieza. La primera medida del tinte en oscuro, 20,91 la cifra y 4,27 el arco, salió
de leer mal `color(srgb … / a)`: lo medido son 15,57 y 3,18, y siguen pasando. **Enmendado por DD-146**
(2026-10-02): en el resumen de grupo se pulsan los rótulos y las filas, que llevan a su sección; la tarjeta sigue sin
pulsarse.

---

## DD-125 · 2026-09-27 — La caja de sección compacta su aire vertical: 17,5 arriba y abajo en las dos pieles

**Contexto** · Revisión de producto: el relleno superior e inferior de `sc-section-card` sobra, y compactar es quitar
el aire que es de más, no apretar lo que separa algo. Va con el principio de densidad aceptado el mismo día (AGENTS
§«UX de pantalla» 9): compacto donde se escanea (el monitor, las listas), más aire donde se lee y se rellena (fichas,
formularios), y en ninguno aire que no separe nada. Medido en el build a 1440 en las 8 plantillas del Supervisor que
la usan (todas en `surface="card"`): de la raya de la caja a la primera y a la última tinta hay 26,5 y 25,5 px, o sea
el propio relleno (24,5) más el interlineado. No hay márgenes que se sumen, salvo en «Políticas de contraseñas»
(Sistema): 39,8 abajo, porque la última fila conservaba su relleno de 12,25, y la raya entre filas quedaba 10 px más
cerca de la fila de abajo que de la de arriba por el hueco de 14 de `.sub-section`.

**Decisión** ·
1. **Arriba y abajo, 17,5** (`scale/1-25`) en las dos pieles; antes, 24,5 en la blanca y 22,75 en la gris. Los lados y
   el aire del título a su contenido no cambian. Plegada, la cabecera sigue midiendo lo mismo arriba que abajo.
2. **«Políticas de contraseñas»**: la raya, centrada (12,25 a cada lado, sin el hueco de la sub-sección), y sin
   relleno fuera de la primera y de la última fila, que ya pone la caja.
3. El Kit, en `docs/figma-pendiente.md` (ficha 16).

**Razón** · La caja ya la delimitan su borde y su fondo: el relleno vertical no separa nada, solo alarga cada sección
(14 px por caja, 84 en las seis de Sistema). 17,5 es además el aire con el que arranca la página bajo la barra (DD-94).

**Descartadas** ·
- **21 (`scale/1-5`)** → 3,5 px por lado no quitan el aire de más que se veía.
- **14 (`scale/1`)** → el borde quedaría a la misma distancia del título que el título de su contenido (16), y la caja
  se leería apretada.
- **Solo la piel blanca** → es el mismo componente; la gris se habría quedado con otro ritmo vertical.

**Consecuencias** · La captura `sectioncard-linux.png` y la línea base de estilos de `sectioncard` se regeneran. La
demo de sc-docs dice las medidas nuevas (y deja de decir que el título mide 14/20: es el h3, 18/24, desde el
2026-09-12).

**En el monitor del Dashboard (el mismo día)** · El principio de densidad pide compacto donde se escanea, y se midió
el monitor a 1440 para ver qué aire sobraba. Su ritmo ya es el compacto: 14 entre tarjetas y las medidas del panel
del Kit (14 de cabecera, 15,75 de cuerpo). La cabecera mide 59,5 porque el ⋮ reserva el alto del chip de filtro
(31,5, decidido para que la cabecera no salte al filtrar). Dentro de las tarjetas no se suma ningún relleno. El
blanco que se ve sale de la rejilla de alto fijo con menos contenido que hueco: 42 px bajo las 8 filas de la tabla de
agentes, y las cifras centradas. Eso es tamaño de widget, que elige quien monta el monitor, no densidad. Lo único que
no separaba nada: en el anillo de «Agentes disponibles», la flecha de «ver el detalle», invisible hasta pasar el
ratón pero ocupando su sitio, quedaba entre el anillo y «de 9 conectados» y los separaba 36 px. Ahora la leyenda va
dentro de la cifra pulsable, delante de la flecha, a 14 del anillo, y el botón la anuncia como descripción. Lo
prueba `dashboard.spec.ts`, que midió 31,5 contra el build anterior y 14 con el cambio. No se tocó la cabecera del
panel: bajar su relleno a 10,5 la dejaría en 52,5, pero es una medida del Kit y el monitor ya cabe entero en 900 de
alto.

**La regla R4, «aire que se suma» (el mismo día)** · El principio se mide ya en la prueba de agrupación
(`agrupacion-medida.js`), sin decidir cuánto aire es el bueno. Una caja (`sc-section-card`, `sc-panel`) mide su
relleno y nada más. Se recorre el camino de su cabecera o su cuerpo hasta lo primero y lo último que se ve, y se suma
lo que añade cada envoltorio intermedio: el margen que de verdad desplaza (no el hueco libre de una rejilla de alto
fijo), el borde y el relleno. En rojo si llega a 7, el peldaño más pequeño de la escalera. Por debajo no hay
separación que competir: los 3,5 de `.checkbox-row` agrandan la zona que se pulsa. Un borde solo cuenta como límite
visible en el lado que se mide: una fila con raya arriba sigue sumando su relleno de abajo. La primera versión no lo
separaba y dejaba pasar justo el caso de «Políticas». Validado en los dos sentidos: contra el build anterior a esta
decisión marca «Políticas de contraseñas (abajo): 12,25», y con ella, nada. Mide 90 bordes en 10 pantallas, y la
suite de agrupación sigue en verde (48). No cubre el hueco del anillo del monitor, que es entre dos piezas y no del
borde a una: ese lo vigila su propia prueba en `dashboard.spec.ts`.

---

## DD-124 · 2026-09-27 — La demo tiene un segundo juego de datos, `?datos=tortura`, para ver dónde se rompe una pantalla

**Contexto** · Una pantalla se juzga con los datos que tiene delante. Medido en la semilla del Supervisor el
2026-09-27: 500 agentes con nombres de 7 a 18 letras y ningún campo vacío; 480 salen de cruzar 25 nombres con 25
apellidos («Harrison Kidman») y no están en ningún grupo; y los grupos llevan nombres de producción o de prueba
(«Grupo de prueba 1», «ACD demo cuscare», «Campaigns»). No sirven para ver belleza, porque no son editoriales, ni para
ver roturas, porque no hay extremos. Rafa aceptó tener dos juegos: uno cuidado para juzgar y hacer demos, y uno de
tortura.

**Decisión** ·
1. **`?datos=tortura`** estira los textos: `name` y `title` más largos (con un apellido compuesto real si el
   elemento es una persona), el correo más largo y la descripción larga en la mitad y vacía en la otra mitad. Ids,
   códigos y referencias no se tocan, así que las relaciones entre almacenes siguen igual. `?datos=demo` vuelve.
2. **Lo aplica `createVersionedStorage`** (`core/services/juego-de-datos.ts`), por donde pasan todos los almacenes
   persistidos: ninguna pantalla lo sabe. Cada juego guarda en SUS claves (`sc-agents@tortura`) y la elección se
   recuerda en `sessionStorage`, que no sobrevive a cerrar la pestaña.
3. **Los datos de siempre no cambian**: con `demo`, mismas claves y mismos `defaults`. Los e2e y la demo pública
   siguen igual.
4. Se mira con `npm run revision -- --datos tortura <ruta>`; lo prueba `e2e/supervisor/juego-de-datos.spec.ts`
   (llega a los almacenes, se recuerda, vuelve, y no comparte claves).

**El juego editorial (el mismo día)** · `?datos=editorial` da a los 14 grupos un nombre de negocio, elegido por lo que
hace cada uno (sus servicios y sus canales): Atención al cliente (1), Bajas (2), Campañas salientes (3), Ventas (4),
Clientes VIP (5), Citas y reservas (6), Distribuidores (7), Retención (8), Posventa (9), Facturación (10), Soporte
técnico (11), Incidencias (12), Segundo nivel (13) y Cobros (14). Desde la revisión con `--datos editorial` del mismo día,
también las cuatro colas que solo viven en Conversaciones, que sin nombre de negocio enseñaban una cola de prueba en el
juego para enseñar la app: Soporte Nivel 1 → Primer nivel, Soporte Nivel 2 → Escalados, Clientes vip → Clientes VIP (el
grupo VIP, el mismo nombre que toma Exclusivo) y COLA_PRUEBA → Desbordamiento. La tabla va por el NOMBRE de siempre, no por el id,
porque el nombre se repite fuera del almacén de grupos: el grupo saliente del agente, la ficha de usuario, los filtros
y las conversaciones de Conversaciones y las entidades del Dashboard, que lo toman de `deGrupos` y `nombreDeGrupo`
(`core/services/juego-de-datos.ts`). Solo cambian los campos que guardan un nombre de grupo: «Reclamaciones» también
es un servicio y ahí sigue. Los agentes conservan sus nombres de Hollywood (decisión de producto del 2026-09-14). Lo
prueba `e2e/supervisor/juego-de-datos.spec.ts`: el nombre cambia en la lista y en una conversación, y `demo` vuelve.
Decidido el mismo día: la demo pública sigue con los datos de siempre (los que reconocen quien compara con el producto
y los tickets), y el editorial se enseña con su enlace. Para no depender de recordar el parámetro, **el juego se elige
también en Configuración → Sistema → Datos** (Demo · Editorial · Tortura), delante de «Restaurar datos de fábrica».
Elegir lo recuerda en la pestaña y navega a la misma página con `?datos=`: el parámetro manda sobre lo recordado, y
los almacenes leen el juego al arrancar. Lo prueba `juego-de-datos.spec.ts`: entrando con tortura en la dirección,
elegir Editorial le gana y se recuerda al navegar, y Demo vuelve.

**Descartadas** ·
- **Cambiar la semilla por defecto** → tumba los e2e que leen nombres («ACD Demo C2CB», «Tom Hanks») y cambia la
  demo pública sin decisión.
- **Un juego por pantalla** → cada pantalla tendría que saberlo; en el almacén no lo sabe ninguna.
- **Tortura con datos inválidos** (formatos rotos) → eso es validar formularios, otra pregunta. Aquí los datos siguen
  siendo válidos, solo extremos.

**Consecuencias** · Lo que vive en memoria (las pantallas de Conversaciones) y los datos de los widgets del Dashboard
no pasan por `createVersionedStorage` y no se estiran; los monitores del Dashboard, sí. (Resuelto el mismo día: ver «La
tortura llega a lo que vive en memoria», al final.)

**Lo primero que enseñó** (build de producción a 1440, el mismo día) · Con los datos de siempre ninguna lista corta
un texto; con tortura, las listas cortan con «…» los **14** nombres de grupo, **28** celdas de agentes (nombre y
correo) y **6** correos de usuario: «Tom Hanks Fernández-Villaverde de la Concepción» necesita 345 px y recibe 218. Es
justo lo que DD-102 prometía que no pasaría («una lista nunca corta texto»), pero sus anchos se midieron con nombres
de 7 a 18 letras, y un nombre compuesto español real pasa de 40. La cabecera de la ficha de agente también corta el
nombre, con sitio libre a su derecha.

**Decidido con esa medida (el mismo día)** · DD-102 sigue siendo la regla con los datos que se midieron: con los de
siempre, ninguna lista corta. Con un dato más largo que lo medido, la celda recorta con «…» y lleva el texto entero en
el `title`. Descartado que el ancho crezca con el dato: la lista virtual y `table-layout: fixed` necesitan anchos
estables (DD-95). Descartado también desplazar la tabla de lado a 1440: esconde columnas a todos por un nombre largo.
Medido con tortura, ya fundido DD-122: 56 textos recortados, todos en listas (1 con los datos de siempre, la vista
previa de Plantillas). Antes, los de Agentes (nombre y correo), Grupos, Plantillas y Tipificaciones no llevaban el
texto entero; ahora lo llevan los 56.
La cabecera de las fichas de agente y usuario, que recortaba el nombre a 252 con sitio libre al lado, ya no recorta:
con DD-122 (el mismo día) las dos van al molde de la ficha de grupo, sin cifras al lado, y el nombre toma el ancho que
queda. Medido tras fundirlo, a 1440: 1213 px para el nombre, y el de tortura más largo mide 461 y cabe entero.

**La tortura llega a lo que vive en memoria (el mismo día)** · Con el molde del editorial. `nombreDeGrupo` estira también
en tortura, y `nombreDePersona` y `nombreDeCosa` hacen lo mismo con agentes, servicios, intenciones, tipificaciones y
campañas, con el mismo sufijo que `torturar` da a los almacenes. Lo toman:
- los widgets del Dashboard: `DEMO_ENTITIES`, las filas de «Monitor x» y el estado de cada agente (DD-127);
- las conversaciones: el grupo, el servicio, y el origen y el destino cuando son una persona (no un teléfono ni un id de
  chat). Las opciones de sus filtros pasan por la misma función, así que siguen encontrando lo que filtran;
- el catálogo del constructor de reglas, cuyas condiciones guardan el id.

Con los datos de siempre no cambia nada. Lo que enseñó a 1440, medido con un barrido de recortes, y lo que se hizo. Cada
punto salió en rojo contra un build con la tortura y sin el arreglo, y en verde con él:
- **La tabla de agentes del monitor se salía 183 px de su tarjeta.** El nombre empujaba las cifras, y «Transferidas» y
  «T. medio» quedaban fuera. Ahora las cifras miden lo que su dato (`width: 1%`) y el nombre se queda el resto, donde
  recorta con «…» y lleva el entero en el `title`.
- **El título de cinco tarjetas se recortaba antes que la lista de a quién vigila** («Tabla de agent…»). Cedía una
  fracción de píxel frente a esa lista, y a Chrome le basta para poner la elipsis. Ahora no encoge frente a ella, y su
  tope es su hueco.
- **En el detalle del anillo, cada nombre bajaba a tres líneas.** Ahora va en una, con el entero en el `title`.
- **Las cabeceras de varias palabras se partían al ajustarse su columna** («T. medio», «En este estado»). Sus palabras van
  unidas por un espacio que no separa (U+00A0, escrito `\u00a0` en las cuatro traducciones), que es además lo correcto
  tras una abreviatura.
- **En Conversaciones, un origen bajaba a cuatro líneas y la tabla triplicaba su alto.** El texto libre llega hasta dos
  líneas, que es lo que decidió el reparto de anchos (2026-09-13), y a partir de ahí recorta con «…» y lleva el entero en
  el `title`. Las etiquetas ya lo hacían: `sc-tag` pone el `title` al pasar el ratón si recorta.
- **En Conversaciones → Entidades, una descripción recortada no llevaba el texto entero**, también con los datos de
  siempre. Ahora lo lleva.

Lo prueban `dashboard.spec.ts` y `conversations-table-scroll.spec.ts`.

**Lo que la revisión editorial dejó por decidir, decidido (el mismo día)** · Las dos cosas, solo en el editorial: la
demo pública sigue con los datos de siempre.
- **Los agentes generados, sin bloques de un apellido.** Los 480 cruzaban en orden 25 nombres con 25 apellidos, y la
  lista enseñaba 25 seguidos apellidados «Kidman»: en una demo se lee como generado. En el editorial el cruce va en
  diagonal, así que cada agente cambia de apellido respecto al anterior, y con 480 no se repite ninguna combinación.
  Los nombres siguen siendo de Hollywood (decisión de producto del 2026-09-14).
- **Los servicios de Conversaciones, con nombre de negocio** (`nombreDeServicio`). Dicen el motivo de la llamada,
  distinto del equipo que la atiende, para que las columnas Servicio y Grupo no repitan lo mismo: DV: Smart Contact →
  Información general, Atención al Cliente → Consultas, Soporte Técnico → Averías, Ventas Comercial → Contratación y
  Postventa → Instalaciones. Ninguno coincide con un nombre de grupo.

Al hacerlo salió un fallo: **la previsión de impacto de Reglas casa la regla con las conversaciones por nombre**, y con
otro juego dejaba de casar. Medido en el build: la regla #1 prevé 6 conversaciones con la demo y ninguna con el
editorial, y sin el puente, la #2 prevé 5 con la demo y ninguna con tortura. Ahora las reglas de la demo nombran sus
servicios y grupos con el juego activo, y el puente de la previsión (`demo-impact-bridge.ts`) devuelve grupos y agentes
con el nombre que llevan las conversaciones. En el editorial, el nombre y la descripción de la regla dicen además el
servicio de negocio («Transcribir Contratación >60s»), como los habría escrito quien la creó; en tortura no se tocan,
que son texto escrito a mano. Lo prueba `juego-de-datos.spec.ts`: cada regla prevé el mismo impacto con los tres
juegos (en rojo sin el arreglo de las reglas y sin el del puente), y los 25 primeros generados llevan 25 apellidos.

---

## DD-123 · 2026-09-27 — Lo que va junto se separa menos: la escalera 7 · 14 · 28 manda sobre la maqueta, y se mide en el build

**Contexto** · Una revisión de calidad visual contra principios generales de UI (el segundo: agrupar por espacio, lo
relacionado más cerca que lo que no) encontró que el repo ya tenía la regla, pero solo como comentario: la escalera
**7 · 14 · 28** y «entre grupos, al menos el doble que dentro» vivían en la hoja de Config AED
(`aed-servicio-page.component.scss`), tomadas de la skill `better-layout`. Ni AGENTS ni Patrones la nombraban y nada la
medía; lo que sí se medía iba en contra: un test fijaba la fila de `.grid` en los 12,25 de la maqueta. Medido en el
build de producción a 1440 (34 rutas del Supervisor con cada pestaña o sección, 56 vistas, más los 12 diálogos de alta y
«Duplicar» de un grupo): **10 vistas en 5 pantallas y 4 diálogos por debajo del doble**. Los campos quedaban a 12,25 de
su vecino con la etiqueta a 7 de su control (1,75×; 16 pares en la ficha de agente, la de grupo y Config AED); las dos
opciones de «Mostrar en el aviso», a 12 entre sí; y el botón del acceso, a los mismos 14 del último campo que hay entre
campos, igual que el de «Nueva label» (15,75 contra 12,25).

**Decisión** ·
1. **La escalera es regla del sistema** (AGENTS §«UX de pantalla» 9 y su tarjeta en Patrones, que el check L de
   `docs:coherence` mantiene a la par): 7 entre una etiqueta y lo que etiqueta; 14 entre hermanos (campos, filas,
   opciones, celdas); 28 entre grupos y secciones, y entre el último campo y el botón que lo envía. Entre grupos, al
   menos el doble que dentro.
2. **Cuando la maqueta trae otro valor, manda la escalera**, y el cambio del Kit se apunta en `docs/figma-pendiente.md`
   (ficha 15). Decisión de Rafa del 2026-09-27. No nace ningún token: los tres peldaños ya existían
   (`--sc-spacing-0-5`, `-1`, `-2`).
3. **Aplicado en las piezas, no pantalla a pantalla:** la fila de `.grid` y de su copia en `sc-group-identity-fields`
   (12,25 → 14), `.radio-row` (12,25 → 14), el botón de las dos vistas del acceso (a 28 del último campo) y el panel
   «Nueva label» (15,75 → 28).
4. **Lo mide `e2e/supervisor/agrupacion.spec.ts` sobre las cajas renderizadas** (`agrupacion-medida.js`): campo
   apilado, opciones en fila y botón que envía. Un test por ruta, por alta y por «Duplicar», para que el CI los reparta.
   Probado en los dos sentidos: contra el build anterior al arreglo, 7 tests en rojo que nombran cada par; con él, los
   48 en verde.
5. **Una pantalla se revisa antes de enseñarla** (`npm run revision -- <ruta>`): la abre a 1440, recorre sus
   pestañas, guarda las capturas en `.cache/revision/` y aplica la misma medida. Las capturas se miran con la skill
   `better-layout`: lo medible se arregla y lo que sea gusto se le lista al usuario. El hook de Stop lo recuerda una
   vez si la sesión escribió plantillas u hojas del Supervisor sin revisarlas después. La IA construye; esta pasada es
   la que critica, y el primer filtro visual deja de ser el usuario.

**Razón** · Por debajo del doble, la proximidad no agrupa: la etiqueta de un campo queda casi igual de cerca de su
control que del de arriba, y un botón a la distancia de los campos se lee como uno más. La regla la escribió ya el repo
(la escalera de Config AED; `better-layout`: «the gap between groups must be at least 2× the gap within one»); lo que
faltaba era que mandara y que se midiera.

**Descartadas** ·
- **Seguir la maqueta (12,25 entre filas)** → es lo que salía en rojo en 9 de las 10 vistas.
- **Medirlo en el SCSS con una auditoría estática** → solo ve valores declarados, y la relación entre etiqueta, campo
  y botón existe en el render. La primera versión de la sonda dio rojos falsos justo por eso: la etiqueta de los campos
  del DS vive en un `sc-field-label` con `display: contents` y `sc-textarea` es un elemento en línea cuya caja no
  coincide con lo que se ve.
- **Un token por relación (`related`, `group`…)** → sería inventar tokens fuera del Kit (AGENTS §1), y los tres
  peldaños ya existen.
- **La revisión previa dentro del preflight** → necesita el Supervisor sirviendo, y mirar las capturas es juicio, no
  un umbral: el hook la recuerda y no la juzga. Lo medible ya lo cubre la prueba en el CI.
- **Llevar todos los 12,25 del Supervisor a 14 de una vez** → quedan 54 huecos (`gap`, `row-gap`, `column-gap`) en
  28 hojas y la mayoría no separa hermanos (icono y texto, celdas, avisos); se cambia lo que la medida señala, no lo
  que se parece.

**El pie de los diálogos (resuelto el mismo día)** · Los tres diálogos que seguían por debajo del doble en el botón
(«Nueva entidad», «Nueva categoría» y «Duplicar grupo») no llevan el pie nativo de PrimeNG, como se escribió primero,
sino el de `sc-dialog`: es del DS y pinta su propio marco con los 17,5 de `dialog/content/padding` del Kit. El botón
quedaba a 18 del último campo, contra 14–15,75 entre campos. No había desvío del nativo que decidir (DD-113 §3 no
aplica) y rige el punto 2: con cuerpo, la botonera va a 28 del contenido (el pie gana 10,5 arriba) y el hueco por
defecto entre hermanos del cuerpo baja de 15,75 a 14. Las confirmaciones sin cuerpo y el cuerpo a ras (`flushBody`) no
cambian: allí no hay campo con el que confundir la botonera. Los dos formularios de Conversaciones pasan de 15,75 a 14
entre campos. Medido tras el cambio: los tres, 28,5 contra 14; `CONOCIDOS` queda vacío y la prueba, entera en verde.
En el Kit, ficha 17 de figma-pendiente. *Corregido el mismo día, al repasar figma-pendiente contra el export:* los 17,5
son de `sc-dialog` (`--sc-dialog-padding`), no del Kit. El Kit, como Aura, ata el relleno del diálogo a
`overlay/modal/padding` = `scale/1-125` (15,75), y el `p-dialog` nativo ya pinta eso. Qué hacer con la diferencia, en
la ficha 17.

**Consecuencias** · Una maqueta nueva con 12,25 o 24,5 se implementa en el peldaño de la escalera y se apunta en
figma-pendiente. La prueba corre en el CI con el resto de la suite del Supervisor (DD-60); en local,
`npm run e2e:supervisor -- agrupacion`.

---

## DD-122 · 2026-09-27 — Un solo índice, y que funcione de una sola forma: cada sección es un enlace

**Contexto** · Respuestas de producto del 2026-09-27 a la visión de grupos: el índice debe ser uno y funcionar de
una sola forma; las pestañas ya se habían visto y no gustaron (la maqueta de la visión partió de una captura de
ellas); y el 90 % del trabajo, asignar agentes, lo hace el supervisor. Medido ese día, la app tenía tres formas de
moverse por las secciones de una pantalla:
- Contact Center, con una pieza propia (`sc-settings-sidebar`): enlaces a sus tres rutas con `routerLink`.
- La ficha de grupo y el constructor de reglas, con `sc-form-section-nav`: `<a href="#" role="tab">`, el clic se
  tragaba siempre y la sección vivía en la memoria de la página. Atrás no volvía a la sección anterior, Cmd+clic
  abría la misma página con `#`, ningún enlace podía llevar a una sección y el lector oía «pestaña» sin lista de
  pestañas (el pendiente de DD-113).
- Las fichas de agente y usuario, con `p-tabs`.
Las dos primeras medían igual al píxel; se comportaban distinto.

**Decisión** ·
1. **Un índice**: `sc-form-section-nav` del DS en las cinco pantallas con índice (fichas de agente, grupo y usuario,
   constructor de reglas y Contact Center). `sc-settings-sidebar` se borra con sus claves que no pintaba nadie. En
   las altas de las fichas fueron los pasos del Stepper de DD-138 a DD-143, que las devuelve al índice.
2. **Cada fila es un ENLACE a su sitio**: una ruta (Contact Center) o la misma página con `?seccion=` (fichas y
   constructor). La sección a la vista sale de la dirección: un `input` de página que el router rellena en cada
   navegación, también cuando solo cambia la query (`withComponentInputBinding`). Sin parámetro, la de aterrizaje.
   La actual lleva `aria-current="page"` y ninguna, `role="tab"`.
3. **Una forma de moverse**: clic = navegar dentro de la app. El DS avisa (`activeChange`) y la página decide y
   navega: el alta de grupo no deja salir de General sin nombre ni canales. `SectionLinksService` hace el `href`
   de la fila y la navegación con el mismo árbol de URL. Cmd/Ctrl, Mayús, Alt o el clic central los hace el
   navegador, la regla de `routerLink`: otra pestaña en esa sección. Al editar, Atrás vuelve a la sección anterior.
4. **En un ALTA la sección no deja rastro** (`replaceUrl`, en grupo, agente, usuario y regla): Atrás sale del alta,
   y tras crear no se vuelve a un alta vacía. El alta de grupo quita `?seccion=` al abrir. Desde DD-138, en las altas
   de grupo, agente y usuario cambiar de sección no toca la dirección (con los pasos y, desde DD-143, con el índice),
   y las tres quitan `?seccion=` al abrir; la regla sigue así.
5. **Cambiar de sección no funde la página**: la transición de vista se salta cuando solo cambia la query (medido:
   fundía la página entera en cada clic del índice). Cambiar de ruta funde como siempre, Contact Center incluido.
6. **Guardar: uno, explícito, por ficha. No se guarda al cambiar de sección.** El índice marca las secciones con
   cambios sin guardar con un punto en el color de marca, distinto del rojo de lo que falta. Si están las dos
   cosas, se ve el rojo y se oyen las dos. La barra lo dice en palabras, «Cambios sin guardar». Es la barra de
   guardado contextual de un registro con secciones que dependen entre sí (Shopify, las fichas de Salesforce).
   `sectionsWithChanges` y `titleKey` son entradas nuevas del índice; el estado nuevo va a `figma-pendiente` §5.
7. **Un aviso cancelado vuelve a donde estaba**: el router con `canceledNavigationResolution: 'computed'`.
8. **Agente y usuario, al molde de la ficha de grupo** (desde DD-144, el título en la columna del contenido y las tres
   columnas a la misma altura). Van con la cabecera encima, el índice a la izquierda, una
   sección a la vista en su `sc-section-card` y el resumen a la derecha con sus tres cifras de siempre, que dejan
   la franja del nombre (desde DD-126, cada proporción es un widget con su anillo; desde DD-130, la cabecera va
   también en el alta). Cada ficha tiene un orden, el de sus dependencias, igual en los dos modos:
   - agente: Identidad · Grupos asignados · Permisos · Recursos · Avanzado;
   - usuario: Identidad · Acceso · Servicios asignados.
   Abren en la primera. Los listados enlazan a la sección de trabajo (`?seccion=grupos`, `?seccion=acceso`), así
   que el clic de siempre sigue llegando ahí. Las tarjetas del resumen pasan a `styles/_resumen.scss`, una para
   las tres fichas. El aviso de «abierta en otra pestaña» se pinta en las tres; en agente y usuario el candado
   ya se cogía y no se decía.
9. **Un punto de referencia por índice**: el carril es un `div` y el `nav` se nombra con su rótulo visible
   (Contact Center) o con `common.form_index_aria` (en los cuatro idiomas).

**Razón** · Medido el 2026-09-27, en este build:
- **Contact Center no se mueve un píxel**: 0 píxeles distintos contra `main`, en sus tres páginas, en claro y en
  oscuro, con una sonda que enrojece con medio píxel de relleno de más en el rótulo. Lo mismo en la ficha de
  grupo (edición y alta) y en el constructor (nueva y edición).
- **El segundo Atrás se perdía**: con `replace`, un Atrás cancelado desde una ficha con cambios sustituía la
  entrada del listado por la de la ficha, y el siguiente Atrás salía de la app. `indice-enlaces.spec.ts` lo vio en
  rojo antes del cambio.
- **El alta de agente cambiaba la dirección con `Location.replaceState`**: el router seguía en `crear` y cada
  enlace del índice habría llevado a un alta vacía. Ahora navega a la edición, como el de grupo.
- **El punto rojo ya se oía en Chrome**: el `aria-label` de un `span` entraba en el nombre del enlace. Pasa a texto
  oculto dentro del enlace porque ARIA 1.2 lo prohíbe en un elemento sin rol, no porque fallara.
Rojo primero: 12 de 16 casos de la unitaria del índice contra el componente anterior, 11 de 12 de
`indice-enlaces.spec.ts` contra `main`; la que pasaba es la de Contact Center, que ya iba por rutas.

**Descartadas** ·
- **Que el DS pinte `routerLink`**: ataría el DS al router (sc-docs enruta con `#`) y el enlace navegaría antes de
  que la página decida, así que la puerta de General del alta llegaría tarde.
- **`<button>` en vez de `<a>`**: cambia píxeles (estilos de botón) y deja de ser enlace: sin Cmd+clic, sin copiar
  el enlace, sin Atrás.
- **Guardar al cambiar de sección**: un gesto de mirar se volvería uno de cambiar, y aquí cambiar mueve tráfico en
  vivo. Hay cambios que cruzan secciones: quitar un canal en General recorta los canales de los agentes, y
  guardar al salir de General dejaría medio cambio en producción. La validación bloquearía moverse o guardaría
  datos inválidos, y habría dos formas de guardar. El autoguardado encaja con ajustes independientes y sin
  riesgo, y ya se usa donde toca: las columnas del listado.
- **Mantener la tira de pestañas en agente y usuario**: el índice debe ser uno.
- **Que las fichas abran en su sección de trabajo sin parámetro**: la dirección de la ficha significaría una
  sección distinta según el modo. Se prefirió que abran en la primera y que el listado enlace a la de trabajo.
- **Quitar también el fundido de Contact Center**: se deja como estaba; si el movimiento entre secciones debe ser
  uno solo, lo decide el pase de diseño.

**Consecuencias** ·
- Enmienda DD-121 §2: la divergencia agente/usuario con pestañas se acaba. También la forma «una página +
  pestañas» (2026-09-22) y el orden común de #240: al editar, Identidad ya no baja al segundo puesto.
- Cierra el pendiente de DD-113: el `role="tab"` sin `tablist` de `sc-form-section-nav`.
- **Enmienda #239 («sin caja»)** en agente y usuario: sus secciones vuelven a `sc-section-card`, como las de grupo.
  El pase de diseño decide UNA forma para las tres.
- En agente y usuario el contenido baja de 1.304 a 812 a 1440 (lo mide el antes y después). Acceso y Servicios de
  usuario pasan de cinco y seis columnas a tres, y crecen de alto. Está en la lista del pase de diseño.
- CHANGELOG `[Unreleased]`: `Added` (href, titleKey, sectionsWithChanges) y `Changed` (sin `role="tab"`,
  `aria-current="page"`, el texto del punto). Sin romper: `href` es opcional y, sin él, la fila sigue en `#`.
- Fuera de alcance: el índice hecho a mano de `comparar/fichas` (laboratorio, `features/lab/`), que sigue siendo
  un `<button aria-current="true">`.
- Queda comprobar en Figma el peso del rótulo de Contact Center. El código pinta 14/20 semibold, como pintaba
  Contact Center; un comentario anterior lo anotaba como 14 regular (`figma-pendiente` §5).

---

## DD-121 · 2026-09-26 — La ficha de grupo sigue la visión de producto de grupos: índice lateral, canal por canal, y la tabla de agentes solo para composición

**Contexto** · Llega la visión de producto de grupos (2026-09-25): un documento que separa lo DICHO por producto de lo
que una IA RELLENÓ en una maqueta HTML y de lo INFERIDO, más esa maqueta. Pide una interfaz mucho más sencilla; menú
lateral y no pestañas; cuatro secciones; solo lo que aplica a cada canal; Chat como madre de Web Chat y WhatsApp;
distribución y cola dentro de cada canal; un desbordamiento común a todos los canales; en la cola de teléfono, la
música como único mensaje; y asignar agentes, el uso más frecuente, a un clic. Choca con tres decisiones de esa misma
semana: la forma «una página + pestañas» (2026-09-22, sin DD, escrita en la ficha), el orden común de pestañas de las
tres fichas (#240) y el alta en diálogo (DD-119).

**Decisión** ·
1. **Cómo se lee la visión.** Lo DICHO se implementa. Una decisión del repo con fuente (COA/SISMAC-1975, manual de
   Voice, una DD) gana a un relleno de la maqueta; un relleno sin conflicto entra si es barato; lo inferido entra con
   un valor provisional y pasa a las preguntas abiertas. Lo que la visión quita sale de la VISTA y se queda en el
   MODELO, que es la vía reversible.
2. **Índice lateral, solo en grupos.** El índice de Contact Center (`--rail`: carril de 196, fijo, sin scroll) con
   `sc-form-section-nav` y cuatro secciones en el orden de sus dependencias, una a la vista y abriendo en General:
   General · Distribución y colas · Recursos · Agentes. La cabecera (nombre como `h1` editable, línea meta y
   «Eliminar») va ENCIMA de índice y contenido (`.ficha-rail` en `_page.scss` solo parte la fila), en la misma vertical
   que las fichas de agente y usuario, que siguen con pestañas: la divergencia es a propósito, y extender el índice a
   ellas es el siguiente paso si se valida en grupos. **Enmendado por DD-122 (2026-09-27)**: producto pide un solo
   índice con una sola forma, y agente y usuario pasan a este molde. **Enmendado por DD-144 (2026-10-01)**: el
   nombre va en la columna del contenido, las tres columnas arrancan a la misma altura y «Eliminar» va bajo el
   índice.
3. **Resumen a la derecha, en su propia columna** (enmendado el 2026-09-27; antes iba bajo el índice, ver
   Descartadas). Tarjetas de KPI (`sc-group-summary`): agentes, con una barra `p-metergroup` por canal (base: el
   ejemplo «Template» de MeterGroup en primeng.dev) y aviso con icono y texto si un canal activo no tiene quien lo
   atienda; reparto por familia; salida (teléfono saliente y WhatsApp); recursos; y lo que falta para guardar. Cifras
   animadas al cambiar (`AnimateOnChangeDirective`, en `core/directives`). **Enmendado por DD-126 (2026-09-27)**: cada
   proporción es un widget con su anillo, y la cifra cuenta también al abrir. La columna (`.ficha-summary`) mide 240, la
   del panel del constructor de reglas; va fija al hacer scroll, así que no se va mientras se toca lo que la mueve, y
   lo que no quepa hace scroll dentro de ella. El índice se queda solo en el carril de Contact Center, que no tiene
   scroll. El tope de la página sube a 1600 (`.ficha-rail--summary`) y el contenido mide 812 a 1440 y 738 a 1366.
   Por debajo de 1340 no caben tres columnas: el resumen pasa a una franja encima de índice y contenido, que vuelven a
   medir lo de Contact Center (contenido de 920 a 1280).
4. **General: nombre, prioridad y canales, y Chat es la casilla MADRE** de Web Chat y WhatsApp (patrón B12 del
   laboratorio): marcarla enciende los dos; desmarcarla, los apaga; con uno, queda a medias. Las claves no cambian
   (`chat` sigue siendo Web Chat), así que no hay datos que migrar. Las reglas viven en `group-channels.core.mjs`.
5. **Distribución y colas, canal por canal.** Arriba, las reglas comunes: «Desbordar si todos los agentes están
   inactivos», que pasa a valer para TODOS los canales (un `true` ya guardado desborda también chat y email), y
   «Desbordar sesión». **Enmendado por DD-141 (2026-10-01)**: sale «Desbordar sesión», que era de Chat; lo cubre
   «Cerrar chat por inactividad», y lo guardado se conserva. Debajo, un bloque por canal activo con su distribución
   y su cola:
   - Teléfono: estrategia del COA, teléfono saliente (antes «teléfono asociado», en Identidad), transferencia, tiempo
     entre llamadas, su cola, la voz de los anuncios y la música de espera.
   - Chat: estrategia, transferencia, cierre por inactividad con sus minutos, valoración; el acceso de Web Chat
     (dominios y script) y el número de WhatsApp si están marcados; su cola; y tres mensajes de espera por subcanal.
   - Email: una nota (sin estrategia ni cola propias).
   El modelo es ADITIVO: `phoneQueue`, `chatQueue` y `chat`, opcionales, se leen con `resolveGroup()` (lo nuevo, si
   no el juego único de antes, si no el de fábrica). Un canal apagado deja una línea que dice dónde se enciende. Nada
   nace plegado: la sección mide 2.355 px con los cuatro canales, frente a unos 4.000 de la maqueta. *(Enmendado por
   DD-157, 2026-10-04: cada canal es una subsección del DS y cada parte un slot; Chat va en el orden de Teléfono, con
   el acceso al final; y los mensajes de la cola de Teléfono nacen plegados.)*
6. **Mensajes en cola de teléfono: la música.** El identificador, «eres el siguiente», los anuncios periódicos, el
   audio saliente y los avisos salen de la vista y siguen en el modelo (`announcements` se guarda entero).
   *(Enmendado por DD-157: vuelven, plegados y sin «anuncio», salvo el audio saliente; la música pasa a «Cola».)*
7. **Recursos** como estaban (tipificación, agendas, plantillas de sus canales, etiquetas, cada una con su «+»), más
   la ficha de cliente, que vivía en Avanzado.
8. **La tabla de agentes del grupo gestiona COMPOSICIÓN**: quién está y por qué canales. Sin «Habilitado» ni su lote:
   la pausa es estado de la persona, se ve («En pausa», solo lectura) y se cambia en la ficha del agente. Un agente
   asignado tiene siempre al menos un canal: la casilla del último se apaga con su porqué. Quitar un canal al grupo
   avisa de cuántos agentes lo pierden y cuántos se quedan sin ninguno y salen. «Quitar» significa salir del grupo,
   desde la papelera, en lote o desmarcando en «Añadir agentes». Los canales de cada agente se recortan al leer a los
   que ofrece el grupo.
9. **El aviso de «abierto en otra pestaña» se pinta**: `CrossTabLockService` suelta el candado en `pagehide`
   (recargar no destruye el componente, y cada F5 se habría creído otra pestaña).
10. **Asignar agentes, a un clic desde el listado** *(enmendado por DD-159, 2026-10-04: lo abre la cifra de agentes, y
    la columna del botón sale)*: cada fila lleva «Agentes», un botón de TEXTO en la variante
    `contrast`, en una columna fija junto al «⋮» (un primario por fila haría una pared azul que compite con «Nuevo
    grupo», y el gris secundario del DS es 2,95:1 sobre blanco). Abre `sc-group-agents-panel`: `sc-drawer` a la
    derecha, bajo la barra de la app, con la MISMA tabla de la ficha y sin elegir filas (la barra de lote quedaría
    bajo la máscara). Pie dentro del contenido con «Asignados · Sin guardar», Cancelar y «Guardar (N)», donde N son
    AGENTES que cambian (`diffLinks`). El cierre de `p-drawer` no se puede vetar, así que su X, el clic fuera y su
    Escape van apagados y cierra el panel, que pregunta antes si hay cambios; Escape se atiende en el propio panel y
    no sube, porque el contenedor de `p-drawer` lo escucha y, aun con `closeOnEscape` apagado, llama a `hide(false)`,
    que quita la máscara y deja el panel abierto (medido con PrimeNG 22.1.2). Coge el mismo candado que la ficha.
11. **El alta es la propia ficha, en modo alta** (de DD-138 a DD-143, en pasos; desde DD-143, con el índice de la
    edición, ✓ en las secciones que se dejan completas y «Atrás / Siguiente» al pie, y la sección no va en la
    dirección): `/admin/grupos/crear` la abre vacía, con los valores por defecto
    de Grupos (desde DD-135, los de Contact Center › Grupos) y Teléfono marcado. General es la puerta: sin nombre (o repetido) o sin canales no se sale de ella, ni
    por el índice ni con «Siguiente»; cada campo dice lo que le falta y el foco va al primero. «Siguiente», al pie de
    cada sección, solo en el alta. «Crear grupo», en la barra, se enciende con General completa (lo demás nace con
    valores por defecto). **Enmendado por DD-142 (2026-10-01)**: con Teléfono, también espera al teléfono saliente,
    que es obligatorio y se elige de los números asignados. Crear guarda también los agentes y abre su edición en la sección en la que se estaba
    (`?seccion=distribucion|recursos|agentes`, que en el alta no cuenta: siempre abre en General). Agente y usuario
    ya creaban así, y la de grupo lo hacía hasta el 2026-09-23. Duplicar conserva su diálogo.
12. **Lo que rodea a la ficha habla como ella.** El listado tiene una columna por estrategia, «Estrategia de
    teléfono» y «Estrategia de chat» (opcional, en el selector: con las dos a la vez la tabla no cabe a 1440 sin
    recortar, medido), con «—» donde el grupo no tiene el canal (también el teléfono saliente), y buscar,
    ordenar, editar en bloque y exportar leen lo mismo; el lote de una estrategia escribe SU campo (antes las
    de chat caían en la de teléfono) y solo en los grupos con su canal. Prioridad ordena por rango: `sc-datatable`
    gana `externalSort`, porque `p-table` reordenaba por el valor crudo del campo encima del orden de la página.
    Valores por defecto va en el orden y con las palabras de la ficha, con estrategia y cola por canal y el cierre
    por inactividad de Chat (aditivo, como el grupo: lo guardado con la cola única cae en las dos). DD-135 lo lleva a
    Contact Center › Grupos y quita la página del listado. La lista de
    agentes recorta los canales de cada enlace a los que ofrece su grupo y los nombra como las fichas.

**Razón** · Lo dicho por producto es la vara; las piezas salen del vocabulario de la app (índice del DS, molde de
Contact Center, `sc-section-card`, `p-metergroup` como el panel de grupo del Dashboard) y no de la maqueta, que es la
forma de que no quede como un pegote. Medido en su maqueta: «configuración esencial» arranca en 33 % con el alta vacía
y marca siempre 100 % al editar, y la sección de distribución con Teléfono y Chat mide unos 4.000 px a 1440.

**Descartadas** ·
- **Stepper de PrimeNG** → el horizontal es lo que la visión rechaza; el vertical mete el contenido entre los pasos
  (no hay menú + contenido), y usarlo para crear e índice para editar serían dos formularios. Revisado en DD-138:
  producto lo pidió para el alta, y con una plantilla por sección y los pasos sacados del índice es un formulario con
  dos maquetas. Revertido en DD-143: la segunda revisión con el equipo no lo quiso, por ser un asistente para un
  formulario tan largo y una forma distinta al crear y al editar.
- **Resumen bajo el índice, en el mismo carril** (la primera versión, del 2026-09-26, con el patrón del constructor
  de reglas) → el carril es el de Contact Center y no tiene scroll, y el resumen lo alargaba hasta 844 px. Medido: a
  1366×768 se cortaba 20 px al abrir y, a 1280×720, al bajar al final de una sección larga el índice se escondía 99
  px por arriba; la navegación se perdía a medio editar. El constructor lo puso bajo su índice porque en una columna
  hermana se iba con el scroll; esta columna es fija, así que eso no pasa. Lo que cuesta: 108 px de contenido a 1440.
- **Colores por canal en las barras** → los glifos de canal van de un solo color (decisión de producto,
  2026-09-16): el canal lo dice la forma.
- **El porcentaje de «configuración esencial»** → no informa (ver Razón).
- **Desasignar solo al quitar el último canal, como la maqueta** → mover a alguien de Teléfono a Chat costaría 4
  clics y un aviso en vez de 2, y la fila desaparecería a mitad del gesto.
- **Mensajes de chat rellenos de fábrica** → los textos de la maqueta no constan como aprobados; van de ejemplo.
- **Subir la versión de los stores** para el modelo nuevo → borraría lo que haya guardado quien ya usó la demo.
- **El pie nativo de `p-drawer` (`#footer`) en el panel rápido** → `sc-drawer` aún no lo deja pasar y solo este
  panel lo pide; el pie va dentro del contenido y sube al DS cuando otra pantalla lo necesite.
- **Una sola columna de estrategia con las dos** → no se ordena ni se edita en bloque una sin arrastrar la otra.

**Consecuencias** · Enmienda, una por una: **DD-119 §2 y §4** (el alta en diálogo y la ficha solo de edición: el alta
pasa a la propia ficha, §11; duplicar conserva su diálogo); **la forma «una
página + pestañas» del 2026-09-22** y **el orden común de pestañas de #240**, para grupos; **DD-101 §1** (sin
«Pausar» en el lote del grupo) y **§2** (el aviso de la barra cuenta todas las filas sin canales, no solo las
activas); **DD-100 §3** (la identidad no va sobre el índice: la cabecera va a todo lo ancho). Y una licencia sobre
**DD-105 §3**: la ficha de cliente entra en «Recursos» sin ser un objeto de Repositorios, porque de las cuatro
secciones es su casa menos mala y la visión la cuenta entre los recursos. El `role="tab"` de `sc-form-section-nav`
(un `tab` sin `tablist`) quedó pendiente (DD-113) hasta DD-122, que lo quita. Preguntas abiertas, para producto y desarrollo: qué hace
exactamente el desbordamiento y dónde se configura su destino; si «Desbordar sesión» es lo mismo; si Email tiene
estrategia o capacidad propias; si la URL del script de Web Chat la pone cada grupo o la plataforma; si el backend
tendrá un permiso de WhatsApp por agente (el AED en vivo solo tiene Tlf / Chat / Email); qué ve el cliente en cola si
se quita un canal o se cambia la estrategia de un grupo activo; el choque con postventa (2026-09-18), que pidió
más de un anuncio periódico en teléfono; y, desde DD-130, qué secciones y permisos trae cada tipo de usuario
(respondida en DD-132). Fuera a propósito: la forma de las fichas de agente y usuario, y
`/config/aed/grupos`, la página vieja de Configuración, que no está conectada con la ficha (DD-135 la conecta: es donde
se fija con qué nace un grupo). Vigilan esto
`grupo-vision.spec.ts`, `ficha-grupo.spec.ts`, `ficha-grupo-canales.spec.ts`, `panel-agentes-grupo.spec.ts`,
`listado-grupos.spec.ts`, `admin-forms.spec.ts` y el grupo en `form-section-nav-legibility` y `theme-contrast`. De
`page-anatomy` sale (su tope ya no es el de Contact Center): el índice lo mide `ficha-grupo.spec.ts` con las mismas
cifras.

**Respuestas de producto (2026-09-27)** a las preguntas para ir más a fondo:
- La maqueta de la visión partió de una captura de nuestras pestañas.
- Producto ya había visto la ficha de pestañas, y el «no pestañas» es informado.
- Las variantes de `comparar/fichas` siguen de referencia.
- El 90 % del trabajo, asignar agentes, lo hace el supervisor.
- Se enseñará en producción, con una vista de antes y después sin sesgo.
- El índice debe ser uno y funcionar de una sola forma.
De ahí sale DD-122. **Siguiente paso: el panel rápido de agentes, también en Supervisión**, que es donde trabaja el
supervisor; hoy solo se abre desde el listado de grupos. Anotado, sin código.

---

## DD-120 · 2026-09-24 — El código no nombra a personas: la procedencia es la fuente, no quien lo pidió

**Contexto** · El repo es público. Medido el 2026-09-24: 197 menciones del autor en ficheros de código (100 en apps,
librería y e2e; 97 en scripts, hooks y workflows), casi todas de tres formas: «(Nombre, fecha)» como firma de una
decisión, citas literales de conversación (la reacción tal cual, entre comillas) y quién detectó un fallo. Y el «Por
qué» de 28 de los últimos 60 commits contaba quién lo había pedido en vez del criterio. Ninguna ayudaba a entender la
línea que acompañaba, y todas dejaban un registro de conversación donde se lee el código.

**Decisión** ·
1. **Comentarios, commits y portadas de PR sin nombres de personas** ni citas literales. La procedencia es la DD, el
   ticket o el nodo de Figma; si no hay, «decisión de producto (fecha)», que avisa de que no se deshace a la ligera
   (la fecha sola solo data un hecho). Las citas pasan al criterio
   que expresaban, en vocabulario de UX engineering y DesignOps. Colegas, por su rol. AGENTS.md §«Voz del código».
2. **La excepción es el nombre como DATO**: el agente de demo con el nombre del autor sigue ahí a propósito
   (`audit-seed-pii.mjs`), declarado con su motivo en `DATO_PERMITIDO`.
3. **Lo vigila una máquina**: `audit:personal-names` en `verify` para el código, y `bash-guard` para commits y PRs
   (reusa el mismo patrón). Los hooks, al hablarle al agente, dicen «el usuario».
4. **Nada deja de ser encontrable.** La firma era, de hecho, una llave de búsqueda; la sustituye la etiqueta
   «decisión de producto (fecha)», que se busca igual. El barrido entra en `.git-blame-ignore-revs` para que
   `git blame` siga llevando al commit y al PR donde se decidió cada línea, y la redacción original, con sus citas,
   sigue en la historia de git. AGENTS.md §«Voz del código» da el recorrido para volver a una decisión.

**Razón** · Un comentario explica el criterio que sostiene la línea; la autoría no añade nada que la DD no diga mejor,
y la cita literal suena a chat, no a código de producto. La regla escrita para las portadas de PR (2026-09-14) no
cubría el código y por ahí se coló.

**Documentación de proceso** (enmienda del 2026-09-24) · En los `.md` el nombre se queda como quien decide, que es
contexto para un agente; lo que sale son sus citas literales (74, pasadas al criterio con su misma fuerza y alcance,
revisadas una a una por un revisor independiente). Se quedan las que son DATO de un detector o disparador de una regla.
Los hand-offs de otros frentes los limpia su propia sesión al reescribirlos. Sin gate: lo dice AGENTS.md.

**Descartadas** ·
- **Reescribir la historia de git** para limpiar los commits viejos → reescribir historia publicada rompe cada clon y
  cada rama abierta. La regla vale de aquí en adelante.
- **Una lista de nombres del equipo en el gate** → no hay forma fiable de enumerarlos; el gate caza el nombre del
  autor y la regla escrita cubre al resto.

---

## DD-119 · 2026-09-23 — Los grupos no llevan cara, y se crean con un diálogo corto

**Contexto** · Del equipo: «las fotos en grupo no deberían existir». En WhatsApp, Telegram o Teams la foto distingue un
grupo de una persona porque van en la misma lista; aquí están separados. Medido en local: la foto que se subía en la
ficha no salía en ningún otro sitio (la lista y la tabla de grupos del agente pintaban un avatar sacado del nombre), y
crear un grupo abría la ficha entera, cinco pestañas y unos 35 campos, cuando solo pide un nombre.

**Decisión** ·
1. **Sin foto ni avatar de grupo** en la ficha, la lista y la tabla de grupos de la ficha de agente. Cara = persona.
2. **El alta es un diálogo sobre la lista que pide lo que dice la cabecera**: nombre, teléfono asociado y prioridad,
   con la MISMA pieza que la pestaña Identidad (`sc-group-identity-fields`). Nace con Teléfono y lo demás con los
   valores por defecto de Grupos (`newGroupDraft`); crear deja en la ficha, en «Canales y agentes», que es lo
   siguiente. `/admin/grupos/crear` sigue viva y abre el diálogo. (Enmienda del 2026-09-24: el primer diálogo pedía
   nombre y canales.)
3. **Duplicar usa el mismo diálogo** con «… (copia)» y la prioridad del original; se lleva canales, agentes y ajustes,
   no el teléfono asociado (`duplicateGroupDraft`).
4. **La ficha es solo de edición.** Identidad sigue SEGUNDA, como en usuario y agente (#240), sin foto y con nombre,
   teléfono asociado (solo con canal Teléfono) y prioridad. Recursos, Anuncios y Avanzado van sin caja, como el resto.
5. Un nombre de grupo repetido se avisa en vivo, en el alta y en Identidad, y Guardar espera.

**Razón** · Rafa lo vio en local y eligió cada punto. El alta ya era de dos pasos por dentro (guardar con solo el
nombre llevaba a «Canales y agentes»); el diálogo lo hace visible.

**Descartadas** ·
- **Alta con nombre y canales** (la primera versión) → la ficha abre por la fila de canales, así que al entrar se veía
  lo que se acababa de rellenar. Rafa lo descartó: era un paso extra, al entrar se repetía lo recién configurado, y el
  alta y la ficha tienen que ser coherentes. Pidiendo lo de la cabecera, el alta es el primer paso de la ficha y no una copia de su primera pantalla.
- **Sin pestaña Identidad** (nombre con un lápiz junto al título, teléfono y prioridad en la fila de canales) → Rafa lo
  descartó: la edición no era evidente y, como usuario, no se sabía si esos datos se podían tocar.
- **«Editar datos» en la cabecera con un diálogo** → añadía un «Aplicar» que no guardaba, un segundo nivel de
  confirmación que había que explicar con una frase, y rompía el orden común de las tres fichas (#240).
- **Avatar generado del nombre** (teardown B7 lo daba por bueno) → B7 medía apps de mensajería, donde grupos y personas
  se mezclan; en una lista donde todo son grupos no distingue nada.

**Enmienda del 2026-09-26 (DD-121)** · §2 y §4 dejan de valer: el alta vuelve a ser la ficha, en modo alta,
porque la visión de producto de grupos pide que al crear queden definidos canales, distribución, colas y recursos.
`newGroupDraft` ya no existe. Duplicar (§3) conserva su diálogo, que pide nombre, teléfono saliente y prioridad.

## DD-118 · 2026-09-23 — En producción, el sidebar de «abrir no cierra las demás»; «no se cierra nada» espera a primeng.dev

**Contexto** · SISMAC-4340. El 2026-09-16 se compararon tres comportamientos en la rama `comparar/sidebar` (tipo Apollo,
abrir no cierra las demás y no se cierra nada) y quedó como oficial «no se cierra nada», pero no llegó a `main`: producción
seguía con DD-112, que cierra al salir del menú lo que no es de la página. Rafa decidió el 2026-09-23 que
producción lleve este (https://c1ae0539.sc-supervisor.pages.dev/solo-sidebar), aunque no es su favorito, con la
intención de llegar más adelante a «no se cierra nada» a través de primeng.dev.

**Decisión** · Va a `main` la versión del tag `archive/comparar-sidebar-sin-cerrar-al-abrir-2026-09-16` (`65185e3b`), sin
el andamio de la comparación (variante de Figma, modo Slim, botón de la esquina y `/solo-sidebar`). Enmienda DD-112 §3,
§4 y §5:
1. Desplegado, cada categoría se abre y se cierra con su clic y abrir una no cierra las demás; nada se cierra al salir.
2. Plegado a 80 solo se pinta la rama de la página actual.
3. Drawer de Apollo: se despliega al entrar el ratón y se pliega 300ms después de salir.
4. Selección en cyan (`--sc-sidebar-accent`). Grupo abierto al 10% plegado y al 5% desplegado, y sus hijos otro 10%
   encima (`--sc-sidebar-item-group-bg`).
5. Un botón ancla el sidebar desplegado; la página le deja 240 y se recuerda en el navegador (`sc-sidebar-anclado`).
   Anclado, el seleccionado vuelve al blanco del 15% y sin fondos de grupo.
6. Las subsecciones abren en altura en `--sc-sidebar-submenu-duration` (450ms) con la curva de Apollo, sin fundido.
7. Si la página actual queda fuera de la vista, el menú baja hasta ella; y una URL con `?` o `#` ya no deja el menú sin
   página marcada.

**Razón** · Medido el 2026-09-23 a 1440×900 en Informes de Datos, el build contra el preview: plegado y desplegado dan
el mismo ancho, las 17 filas a la misma altura y los mismos fondos. Abrir Administración deja Supervisión abierta, y
anclar lleva el contenido de x=80 a x=240 y lo devuelve al soltar.

**Descartadas** ·
- **No se cierra nada** (la favorita de Rafa, tablero de Figma `14912-6324`) → espera a poder hacerse con el Sidebar
  de primeng.dev; no va a producción ahora.
- **Tipo Apollo, abrir una cierra las demás** y **Slim** (raíl con panel flotante) → comparados el 2026-09-16, no elegidos.
- **Seleccionado en blanco, la propuesta de Figma** → Rafa eligió la de cyan.

**Consecuencias** · Pendiente: el botón de anclar pisa 5px el texto del logotipo desplegado (el texto acaba en x=208 y
el botón empieza en 203); sube igual que en el preview.

---

## DD-117 · 2026-09-23 — Cada PR prueba y despliega lo que toca; `main` lo sigue probando todo

**Contexto** · Rafa señaló el ruido: cada PR disparaba los despliegues de Cloudflare y cinco comentarios,
aunque el cambio no tocara todos los sitios. Medido sobre los últimos 40 PR de `main`: 10 tocaban el DS, 10 la
raíz, 10 una sola app, 6 solo documentación y 4 varias apps. El acoplamiento real con el DS no es
parejo: importan `@smartcontact-hub/*` 70 ficheros del Supervisor, 62 de sc-docs, 4 de agent, 1 de
CusCare y 0 de agent-mini.

**Decisión** ·
1. **CI**: un job `changes` (`scripts/ci-cambios.mjs`) decide qué suites e2e necesita el PR. Un
   fichero de una app corre solo su suite; documentación, ninguna; un script de `scripts/` que
   ninguna e2e alcanza (se siguen los `import`), ninguna. **Lo que no sabe clasificar corre todo.**
   `verify` y `build` corren siempre, y todo push a `main` corre todo. Si `changes` falla, las e2e
   corren igual. Repetido sobre los 40 PR: 19 se ahorran e2e.
2. **Cloudflare**: cada proyecto vigila `*` y excluye lo que seguro no le cambia (documentación,
   tests, herramientas, las otras apps) según `excluye` de `cf-sites.mjs`. Una app nunca excluye
   una carpeta de la que tira su build (agent-mini publica `projects/agent/public`; lo vigila un
   test contra `angular.json`), y solo agent-mini ignora el DS, porque su build no lo construye.
   `audit:cf-config` compara el dashboard con esa lista; `scripts/cf-watch-paths.mjs --aplicar` la
   pone.
3. **`record-deploy`** ya no espera a un sitio que el commit no reconstruye (lo dejaría rojo tras
   35 min sobre algo que no está roto): no lo registra, como a un commit adelantado (DD-64).

**Lo que se acepta** · Un fallo que el filtro no vea se descubre al fundir, en el CI de `main`, no
en el PR. Una app que entre al DS no necesita tocar nada aquí: un cambio del DS ya corre todo; sí
necesita su fila en `APPS` (`ci-cambios`) y en `SITIOS` (`cf-sites`), y un test falla si falta.

**Descartadas** · *Un allowlist por app* (lo que no esté listado no corre): un fichero no previsto
se colaría sin probar. *Filtrar también `verify`/`build`*: cuestan 1-2 min y son los que cazan lo
que cruza apps.

## DD-116 · 2026-09-23 — `e2e:visual` sale del `preflight`: su única razón para estar ahí ya no existe

**Contexto** · DD-62 metió `e2e:visual` en `preflight` con una regla explícita: es **lo que el CI
no puede** correr, porque las capturas eran `-darwin`. Esa condición cayó después: las 38 capturas
son hoy `*-linux.png`, las toma el workflow `visual-baselines` y las compara el job `e2e-smoke`
(obligatorio en `main`). En un Mac, `screenshotBaseline()` se salta la comparación, así que en
local el paso solo corría las aserciones de métrica, que el CI también corre.

**Medido el 2026-09-23** ·
· El CI corre la suite entera: `npm run e2e` lista **92 tests en 8 ficheros**, 64 de ellos de
  `components.spec.ts`, y el `e2e-smoke` de `main` sale «92 passed».
· La comparación del CI **enrojece**: la run 35536252484 (PR #218, 20-sep) cayó por
  `toHaveScreenshot(bulkeditmenu|sectioncard|select.png)`, 66.862 px distintos en una.
· Nadie apaga las capturas en `ci.yml` (`SC_SKIP_VISUAL_BASELINES` solo está en `tokens-sync`).
· Coste local: **2m09s** por preflight (la cadena sin él, en frío: **6m28s**, casi todo builds
  AOT en serie a 111% de CPU en un Mac de 10 núcleos), más la cola del puerto fijo 4280: con otra sesión
  (o un servidor olvidado) dentro, el guardián espera 25 min y falla. Pasó ese mismo día con un
  `ng serve` de otro worktree vivo desde las 00:56.

**Decisión** · `e2e:visual` sale de `preflight` y de `preflight:scope`, y de `LOCAL_ONLY` en
`ci-preflight-parity`. La red visual es la del CI, que es la única que compara píxeles. Además
`components.spec.ts` corre en paralelo dentro del fichero (`describe.configure({ mode:
'parallel' })`): medido en local, 2m09s → 1m00s-1m28s, 64/64 en tres pasadas.

**Lo que se acepta** · Un rojo de métrica en el catálogo se ve en el CI tras el push, no antes. La
promesa «verde en local ⇒ verde en CI» ya no cubría este paso de todos modos: en el Mac no se
comparaban capturas.

**Descartadas** ·
· *Servir `dist/sc-docs` estático para acelerar la suite* — con `python3 -m http.server` la app
  salía en blanco en parte de los tests (4 y 11 fallos). No se persiguió: deja de hacer falta.
· *Menos workers* — con 3 fue más lento (1m31s y 1m51s) que con los 5 por defecto.

## DD-115 · 2026-09-20 — El contenido de página se ANCLA a la izquierda: el tope limita la lectura, no empuja al centro

**Contexto** · Llegó la queja de que el índice lateral de las pantallas con rail «colgaba». Medido
en local con sonda, a 1440 y a 1920, sobre `main`: el sidebar está clavado al borde izquierdo y
reserva 80px, y `.page__inner` se centraba con `margin: 0 auto`. Entre las dos navegaciones quedaba
lienzo muerto: **108px a 1440 y 348 a 1920** hasta el índice de `--rail`. Y las pantallas hermanas
arrancaban en cuatro verticales distintas a 1920: `--rail` en 80, `--list` en 200, `--hub` en 520 y
`--reading` en 584. La miga de la barra, que `top-bar.component.scss` dice alinear con el título de
la página, solo casaba por casualidad a 1440.

**Decisión** ·

1. **`.page__inner` va anclado**: `margin: 0 auto` → `margin: 0`. `--rail` pierde su
   `margin-inline: auto` y `.page__form` su `margin: 0 auto`.
2. **Los topes NO se tocan** (832 / 960 / 1100 / 1200 / 1600): siguen siendo límite de ancho de
   LECTURA. Lo que se retira es su uso como empuje al centro.
3. La regla, en una línea: **se acota lo que se lee; lo que es navegación va pegado.**

**Razón** · Medido después, a 1440 y 1920, las cuatro pantallas arrancan en x=80 y el hueco hasta
el índice de `--rail` es de 28 (el `padding` del molde) en cualquier ancho. El contenido de `--rail`
sigue midiendo 920, el `Block` 393:12587 de Figma. `audit:page-anatomy` y las 35 pruebas de molde
del Supervisor pasan sin tocarlas: miden tope, `padding`, `gap`, rail de 196 y los 920, no el margen.

Las referencias se midieron el mismo día en el navegador. Los ajustes de GitHub sí centran (bloque
de 1280 a 1440), pero **pueden**: su navegación es horizontal y no hay rail vertical del que
despegarse. Su vista de código, que sí tiene árbol lateral pegado, no acota el contenido: a 2560 lo
deja en 2239. Meridian (el agéntico de PrimeNG) centra teniendo rail, pero con tope 1680: no muerde
hasta ~1760, así que en portátil y en 1920 no se le ve. El centrado de `_page.scss` nació citando
«patrón de ajustes GitHub/Stripe» y se aplicó a un shell que GitHub no tiene.

**Descartadas** ·

- **Subir el tope de `--rail` a 1680, como Meridian** → tapa el síntoma en las dos pantallas
  medidas pero lo devuelve por encima de ~1760, y mueve el contenido de 920 a 1400, que es el ancho
  del `Block` de Figma.
- **Anclar solo `--rail`**, que es lo que se señaló → a 1920 dejaba las hermanas arrancando en
  80 / 200 / 520 / 584. Cambiaba un desajuste por otro.
- **Mover la miga de la barra** para que case con el contenido → **no hace falta, y la primera
  lectura de este PR se equivocó al decir que sí.** Medido a 1440 en los cuatro arquetipos, el
  botón de inicio de la barra ya cae en x=108, la misma vertical que el primer elemento de la
  página. Lo que arranca en 161.5 es el TEXTO de la miga, que va detrás del botón y del divisor,
  y no tiene debajo nada con lo que deba casar. Lo que sí estaba mal era el comentario de
  `top-bar.component.scss`, que prometía esa alineación con un número de la época del sidebar de
  64px; se corrige aquí.

## DD-114 · 2026-09-15 — La cabecera del Dashboard se ordena en dos bloques y el modo pared no se queda en negro

**Contexto** · Rafa pidió quitar el fondo gris de la tira de pestañas del Dashboard y ordenar sus botones, y propuso
la Toolbar de primeng.dev. Las acciones del monitor (`⋮`, `+ Monitor`) quedaban en medio de la cabecera, lejos de las
pestañas y pegadas a «En directo», y se leían como acciones de la página. Después vio el modo pared en negro: era un
monitor recién creado, sin widgets, cuyos huecos vacíos el modo pared no pinta.

**Decisión** ·
1. **Pestañas sin fondo**: `p-tabs` con `[dt]` de instancia (`tablist.background: transparent`); la raya sigue.
2. **Lo del monitor, con el monitor**: `⋮` y `+ Monitor` van pegados a la última pestaña; su hueco se estira hasta
   las acciones de la página para que la raya de abajo siga siendo una.
3. **Lo de la página, en `p-toolbar`** (enmienda DD-113 §6, que dejaba la Toolbar solo en el modo pared): sin caja
   propia (`[dt]` de instancia), nombrada con el monitor, en tres grupos separados por `sc-divider` vertical:
   estado · alertas y rotación · modo pared. Los botones, de texto; la campana lleva borde de color solo con
   alertas nuevas.
4. **Modo pared con un monitor vacío**: enseña `sc-empty-state` («Este monitor no tiene widgets») con «Salir».
5. **El carrusel se salta los monitores sin widgets**; con las flechas o anterior y siguiente sí se llega a ellos.

**Razón** · Medido con Playwright en claro y oscuro a 1440, 1024 y 390: la raya de abajo es continua, sin desbordes;
a 1024 las acciones suben encima de las pestañas como antes y a 390 se ocultan los separadores. Con un monitor vacío
y el carrusel a 20 s, la rotación fue Monitor x → Colas y agentes → Monitor x, y la flecha izquierda llevó al vacío.

**Descartadas** ·
- **La cabecera entera en `p-toolbar`** → la tira de pestañas quedaba dentro de un `role="toolbar"`.
- **Separador propio con un `span`** → el DS ya tiene `sc-divider`.

## DD-113 · 2026-09-15 — Pestañas, botones segmentados, separadores, grupos de campo y barras: los de primeng.dev, bien puestos

**Contexto** · Rafa pidió estudiar Tabs, Toolbar, InputGroup, Divider y SelectButton de primeng.dev porque sospechaba
que los teníamos hechos a mano o mal usados. Se leyó el código de los ejemplos de primeng.dev (GitHub,
`apps/showcase/doc/<componente>`), la hoja de cada componente (`@primeuix/styles`) y `tools/aura-diff.mjs`, y cinco
barridos del Supervisor, sc-docs y el DS. Medido en local a 1440: (1) la barra del modo pared era una `p-toolbar`
con un `display: block` que apilaba inicio y fin (74 px de alto en vez de 50); (2) las pestañas del Dashboard y el
SelectButton de Conversaciones no tenían nombre accesible: el `aria-label` iba al host de `p-tablist` y no al nodo
con `role="tablist"`, y el `[attr.aria-labelledby]` lo pisaba el propio `p-selectbutton`; (3) las reglas de
`sc-inputgroup` apuntaban a `.p-inputgroup-addon`, que PrimeNG 22 ya no pone, con 0 elementos casados; y
`audit:primeng-coupling` las daba por vivas porque el texto sigue en el bundle como nombre de etiqueta; (4) el
reproductor de conversación cambiaba de vista con dos botones sin rol ni estado, y Plantillas decía ser pestañas
sin flechas ni foco itinerante; (5) al pasar Plantillas a `p-tabs`, la barra de la activa medía 153 px sobre una
pestaña de 99: PrimeNG la mide solo al cambiar de pestaña, antes de que cargue la fuente de iconos; (6) Rafa vio un
sombreado al pulsar una pestaña que primeng.dev no tiene: era el `ripple`, encendido en el Supervisor desde la
migración de junio; (7) la primera versión apagó esa raya y pintó una marca fija, y Rafa notó que en primeng.dev el
movimiento era más sutil. Medido: allí la raya se desliza en 250 ms y el color cambia en 200; aquí la marca saltaba
de golpe. Y las pestañas de Plantillas llevaban icono y contador (6 y 6), heredados de la versión a mano, que el
ejemplo no tiene. Su regla: se parte de que el componente se implementa tal cual sale en la documentación.

**Decisión** ·
1. **Pestañas o segmentado, por lo que hace.** Cambiar de colección (Plantillas: se vacían búsqueda y selección,
   el alta nace del tipo) son `p-tabs`, como los monitores del Dashboard. Filtrar la misma lista o elegir un valor
   (vistas de Conversaciones, tema, idioma, canal de la plantilla) son botones segmentados. Rafa eligió pestañas
   para Plantillas con las dos versiones construidas delante.
2. **`sc-selectbutton` entra en el DS** (wrapper de `p-selectbutton`): pasa `ariaLabelledBy` por la entrada,
   añade `ariaLabel`, tallas `sm/md/lg` y reenvía `#item`. El texto de cada opción es su nombre accesible: va
   traducido, y la lista se re-traduce leyendo `injectLangChange`. Lo usan Conversaciones, Sistema (tema e
   idioma, sin las banderas emoji) y el panel de Plantillas.
3. **Un componente de primeng.dev entra nativo, tal cual su documentación** (AGENTS.md, «Componentes de
   primeng.dev»): la doc entera antes de escribir (`tools/primeng-doc.mjs`, que `scripts/hooks/primeng-doc-guard.mjs`
   recuerda al ver un enlace), su plantilla, sus props y su movimiento, y nuestra capa solo en tokens. Las
   pestañas de Plantillas y del reproductor son de texto, como el ejemplo básico: sin contador (la tabla ya enseña
   las filas) ni icono (repetía la palabra). Con eso la raya nativa vuelve a caer en su sitio sin parche: la
   descolocaba la ligadura del icono antes de cargar su fuente. Fuera también `scrollable` en el Dashboard, que la
   API instalada marca obsoleto.
4. **Separadores:** `sc-divider` en el modal de categoría (+7 por lado), Entidades (conservando el aire de antes
   con los márgenes de sus secciones) y la barra de Etiquetas (+7 por lado). El panel «Tipo» de Conversaciones
   se queda con su línea: la de PrimeNG sobresale 10,5 px por lado de la columna de casillas.
5. **`sc-inputgroup`:** fuera las reglas muertas; las tallas mueven en el tema las variables hoja del campo y
   del addon, y quedan como las de `sc-inputtext`. `audit:primeng-coupling` busca la clase entera y sin los
   `selector:` (`scripts/primeng-class-exists.mjs`, con su test).
6. **Barras:** la del modo pared recupera el reparto de la Toolbar y se nombra con el monitor. Ninguna otra barra
   pasa a `p-toolbar`.
7. **Sin `ripple` en el Supervisor**, como primeng.dev. Las réplicas (`agent`, `cuscare`) lo conservan (DD-35).
8. **`audit:primeng-coupling` §F:** una regla que oculta, anima o transforma una pieza de PrimeNG (`display: none`,
   `visibility: hidden`, `transition`, `animation`, `transform`) tiene que estar en `COMPORTAMIENTO_PERMITIDO` con su
   porqué. Hoy hay seis: el caption vacío de la tabla, el hover de la tabla-lista, la micro-interacción del botón
   y el toast del Supervisor. Cada una tiene su fila en `customs-catalog.md` §8, y el gate lo exige.
9. **La pulsación del botón es la de better-ui**: al pulsar se encoge al 96 % con 150 ms ease-out y vuelve suave, con
   la misma transición en color y sombra (`buttonMotionCss`). Sustituye al 98 % sin transición y los 100 ms que venían
   de la plataforma. Rafa la eligió entre seis probadas en un playground local (§8.1) como la de acabado más premium. En Figma,
   `figma-pendiente.md` §13.

**Razón** · Es lo que Rafa pidió: que el código hable el idioma de primeng.dev y que sus piezas lleguen con su
espaciado, su movimiento y su accesibilidad, sin copiar a mano lo que PrimeNG ya da. Medido tras el cambio: la raya
nativa casa con su pestaña al pintar y con las fuentes cargadas en Plantillas (63 sobre 63,4), Dashboard (96 sobre
95,5) y reproductor (125 sobre 124,8), y al pulsar se desliza en ~250 ms con la curva de primeng.dev; flechas e Intro
cambian de pestaña;
«Vistas», «Tema», «Canal», «Monitores» y el nombre del monitor llegan como nombre del grupo, tira o barra; la vista
«Fallidas» filtra (34 → 2); el tema oscuro y el idioma se aplican desde el segmentado; la barra del modo pared
mide 50 en una fila; los gates nuevos (clase entera, §F) y el gancho se vieron en rojo con su fallo puesto.

**Descartadas** ·
- **Plantillas con botones segmentados** → iguala a Conversaciones, pero allí se filtra y aquí se cambia de
  colección; cada opción sería una parada de tabulador y las flechas no harían nada.
- **Apagar la raya nativa y pintar la marca en la propia pestaña** (`::after` en el tema, la primera versión de este
  DD) → sigue al ancho sin medir, pero quita el deslizamiento de primeng.dev y cambia el comportamiento desde el tema,
  que `.impeccable.md` guarda como sagrado. Rafa lo vio en pantalla. Es el caso que §F caza ahora.
- **Arreglar la barra con un `updateInkBar` al cargar las fuentes** → parche para un icono que sobraba.
- **Contador en las pestañas** → repite lo que la tabla ya enseña; Conversaciones lo quitó el 2026-09-14 por lo mismo.
- **`p-toolbar` en la barra de las listas** → su caja (borde, radio, relleno de 10,5) rompe las medidas de DD-94,
  y sin caja solo se gana el rol. Tampoco la cabecera, la barra de acciones masivas, los filtros ni los reproductores:
  son cabeceras, piezas fijas o formularios.
- **`p-tabs` en el índice de las fichas (`sc-form-section-nav`)** → `p-tabs` solo es horizontal (sin ↑↓ ni
  `aria-orientation`). Su ARIA está mal montado y queda apuntado aparte.
- **`p-tabs` en Fundamentos de sc-docs** → son enlaces de ruta; se perdería el cmd+clic.
- **Segmentado en el selector de idioma de la barra lateral de sc-docs y en los filtros de Conexión** → el primero es
  gemelo visual del interruptor de tema y ya usa el mismo modelo accesible; los segundos son nueve opciones en una
  celda.
- **`sc-divider` en el panel «Tipo», los conectores Y/O de reglas, la barra lateral y la barra superior** → la
  línea pierde la alineación con el contenido, el fondo del contenido del divider asoma o el aire se duplica.

**Consecuencias** · `audit:primeng-coupling`: tope del DS 20 → 12 y sección F. AGENTS.md gana «Componentes de
primeng.dev» y tres filas en la tabla de bifurcaciones. `e2e/supervisor/admin-datatable-pilot.spec.ts` busca la
pestaña por rol. `docs/customs-catalog.md` §5.1 y §5.2 al día. Pendiente en Figma: nada nuevo (la marca de la activa
ya estaba en `figma-pendiente.md` §9). Cada desvío permitido tiene su fila en `customs-catalog.md` §8 (el gate lo exige).
El botón que se encoge al pulsarlo se queda, con la receta de better-ui (punto 9, §8.1): primeng.dev no lo hace, y es a propósito.
Desde DD-138: en el Stepper vertical, el plegado nativo despegaba la línea entre pasos, porque PrimeNG aplica la
fracción dos veces en la rejilla del `p-motion`. Se arregla por `[pt]` (`contentWrapper`), como el `aria-label` de
`p-tabs`, sin tocar su movimiento. El Stepper salió de las altas con DD-143, y el arreglo con él.
Desde DD-140: un `p-dialog` sin cabecera (`showHeader=false`) se nombra por `pt.root`. Un atributo en su host se queda
en el host, aunque la sección de accesibilidad de primeng.dev diga que pasa a la raíz.

---

## DD-112 · 2026-09-15 — El sidebar del Supervisor se pliega a 80px, marca un solo padre y abre y cierra sin saltos

**Contexto** · SISMAC-4340. Rafa y Carlos acordaron volver al ancho plegado de 80px (el del Supervisor en producción,
4,1667vw a 1920), dar icono a los items que no estaban en la v1 (Intenciones, Monitor y Agentic AI dentro de Nodo IA,
Tipificaciones, Centro de control y Mask Manager) y definir cómo se ve un padre con el sidebar plegado. Al probarlo en
local salieron cuatro problemas: plegado no se veía dónde acaba un grupo, se encendían en cyan varios padres a la vez,
abrir una categoría movía otras bajo el ratón y, al pulsar un item, el sidebar se plegaba y volvía a abrirse.

**Decisión** · (1) `--sc-sidebar-width-collapsed` pasa de 64 a 80px; el menú lleva `--sc-spacing-0-875` de margen y las
filas `--sc-radius-100`, así el Selected y el fondo de grupo quedan contenidos, como en Figma. (2) Un solo padre lleva el
icono en `--sc-sidebar-accent`: el ancestro de la página actual más cercano que se vea. (3) Con el ratón dentro del menú,
abrir o cerrar una categoría no toca las demás; al entrar en una página se abre su categoría; 400ms después de salir del
menú se cierran las que no la contienen. (4) Plegado, la categoría abierta de primer nivel lleva de fondo
`--sc-sidebar-item-hover-bg`; las subcategorías no. (5) Los hijos se pliegan en altura en `--sc-transition-slow` con
`--sc-easing-default`, con fundido propio, y el chevron gira. (6) Mientras dura el fundido de una navegación que empezó
en el sidebar, este se queda abierto (`ViewTransitionTracker`).

**Razón** · Medido con Playwright a 1440×900. La transición del router tapa la página durante su fundido y el sidebar
pierde `:hover` sin mover el ratón: bajaba a 82px, y en producción a 66px. Con la curva enfatizada, al abrir
Administración la categoría de debajo bajaba 44px en el primer fotograma; con la estándar el mayor salto es de 21px, a
mitad del movimiento. Dos fondos del 6% superpuestos suman un 11,6%, casi el Selected: por eso solo el primer nivel.

**Descartadas** ·
- **Acordeón, una categoría abierta por nivel** → al abrir Administración con Supervisión abierta, Administración subía
  unos 400px en el momento del clic. Rafa lo descartó: el salto se percibía como un fallo.
- **Cerrar al navegar** → cerraba las categorías que el usuario acababa de abrir.
- **Encender en cyan todos los ancestros** → dos o tres cyan a la vez y ningún sitio claro donde mirar.
- **Mask Manager con `contact_phone`** → el equipo pide mantener `theater_comedy`, el icono que ya conocen.

**Consecuencias** · Tablero para Carlos en Figma, página Testing, sección `SISMAC-4340 Sidebar` (`14855:1269`). Pendiente:
decidir si plegado se ve solo el primer nivel; el Selected va al 15% en código y al 12% en Figma; Nodo IA usa `neurology`
en código y el componente `brain` de la librería antigua en Figma, que la fuente de iconos no trae; y el drawer de Figma,
atado a `primary/color`, en oscuro queda en azul claro con el texto blanco a 2,15:1.

---

## DD-111 · 2026-09-15 — El foco y el error de los campos siguen a Aura y al Kit

**Contexto** · Rafa vio en el buscador dos señales de foco a la vez: el borde pasaba a marino (preset,
`focusBorderColor` = primario, como el Kit y Aura) y una regla global de `supervisor/src/styles/main.scss` le
sumaba un anillo sky. La regla solo existía en el Supervisor, así que sc-docs enseñaba otro foco. Medido además
con una sonda que tabula por cuatro pantallas: 86 anillos escritos a mano (`2px`, separación `2px` o `1px`) y 6
halos difusos en el Dashboard.

**Decisión** · (1) Fuera la regla global: el campo enfoca como Aura y el Kit, con el borde primario y sin anillo.
(2) **El error lo pinta PrimeNG**: `sc-inputtext`, `sc-password`, `sc-datepicker`, `sc-inputnumber`, `sc-select` y
`sc-multiselect` le pasan `[invalid]` (`p-invalid`) y dejan de pintar el borde rojo con CSS propio. (3) Los anillos
a mano de la app y del DS leen `--sc-focus-ring-width` y `--sc-focus-ring-offset`, y los halos del Dashboard, el
mismo anillo. (4) Criterio de Rafa para lo que venga: si el Kit y Aura dicen una cosa, el código la sigue, y un
ajuste que quisiéramos se propone en `docs/figma-pendiente.md`, no se mete en código.

**Razón** · Cada divergencia es algo que los devs tienen que aprender y mantener (Rafa). El error pintado a mano
iba SIN CAPA y una regla sin capa gana siempre a `@layer primeng`: medido en `/login` tras enviar vacío, el campo en
error enfocado seguía rojo y no enseñaba el foco. Con `p-invalid` en la capa de PrimeNG, el foco gana, como en
primeng.dev (medido: pasa a marino). `e2e/supervisor/focus-ring` lo fija con email y contraseña.

**Descartadas** ·
- **Anillo del sistema en los campos y borde quieto** (recomendación de Claude, construida y medida) → una
  divergencia con el Kit y Aura más que explicar y mantener, para un valor de usuario bajo.
- **Quitar solo la regla global** → el campo en error enfocado se quedaba mudo (el rojo sin capa tapa el foco).
- **Dejar las dos señales** → dos colores para una sola cosa, y distinto en sc-docs.

**Consecuencias** · Sin divergencia nueva: `coverage-map.mjs` sigue con `form.field.focus.ring.*` en `value-match`.
Como en Aura, un campo en error pierde el rojo mientras está enfocado o con el ratón encima; el mensaje de error
sigue debajo. El token del halo (sc-shadow-focus-ring) se quedó sin usos y se retiró el mismo día con los tokens sin uso. Quedan
10 separaciones negativas (`-2px`, anillo hacia dentro en la barra lateral y en tablas) sin token.

---

## DD-110 · 2026-09-14 — El Supervisor tiene pantalla de acceso: SSO de Microsoft con nuestro botón, errores que guían sin delatar cuentas y sin guardia de rutas

**Contexto** · Rafa pidió un login con el look & feel de SnowUI «Sign In - B» (Figma `epbXh5uopOOwU1ofdINqbh`,
nodos `12780:102945` y el panel `12780:102950`), logo SmartContact, un único SSO (Microsoft, con sus guías),
guía para quien se equivoca con el email o la contraseña, «¿Has olvidado tu contraseña?», «Contáctanos», el
«Hola» con la mano y la forma de cerrar sesión dentro de la herramienta. Todo con tokens y piezas del DS, sobre
PrimeNG (referencia de patrón: el bloque «Login» de primeblocks.dev/application/signin).

**Decisión** ·
1. Ruta `/login` fuera del shell (`features/auth/`), con tres vistas en el mismo panel: entrar, recuperar y
   correo enviado; «Contáctanos» es un enlace a la web de contacto. Cambiar de vista lleva el foco a su título.
2. **Sin guardia de rutas.** La sesión es un marcador en `sessionStorage` (`AuthService`, cuenta demo
   `DEMO_ACCOUNT`); la app sigue abriéndose sin entrar.
3. **Botón de Microsoft = `sc-button` secundario con contorno** (el mismo patrón de PrimeBlocks) con el logo
   oficial de cuatro cuadrados SIN alterar (`public/logos/microsoft-logo.svg`, bajado de Microsoft Learn) y el
   texto que Microsoft localiza («Iniciar sesión con Microsoft»).
4. **Errores**: al enviar, y a partir de ahí en vivo. El email dice QUÉ le falta (`email-problem.ts`: sin @,
   espacios, varias @, sin nombre, sin dominio, dominio sin terminación). El fallo de credenciales es UN aviso
   para los dos campos, vacía la contraseña y devuelve el foco. Recuperar la contraseña responde lo mismo exista o
   no la cuenta. Aviso de Bloq Mayús en la contraseña.
5. Cerrar sesión (menú del avatar) navega PRIMERO a `/login` y cierra la sesión solo si la navegación sale: con
   un formulario a medias, el guardia de cambios pregunta y quien se queda sigue dentro.
6. La ilustración es la de SnowUI (clara en claro, la composición oscura exportada a 2x en oscuro). Rafa
   decidió llevarla a producción: la herramienta no se comercializa. El logo se pinta por máscara con
   `--sc-text-heading` para leerse sobre las dos.
7. La mano del «Hola» es `sc-icon waving_hand` (no el emoji: UX 4), con un saludo de una vez por `transform` que
   se apaga con `prefers-reduced-motion`.
8. **«Hola de nuevo»** si en ese navegador se entró en las últimas 48 h (`AuthService.isReturning`,
   `RETURNING_WINDOW_MS`). Solo se guarda la HORA de la última entrada en `localStorage`, ni email ni nombre: en
   un puesto compartido no delata quién estuvo. Pasado el plazo, la marca se borra y el saludo vuelve a «Hola».
   Sin género («Bienvenido» deja fuera a media plantilla); en/pt/fr «Welcome back», «Olá de novo», «Rebonjour».
9. **El fondo se mueve** (`features/auth/components/login-art.component.ts`, propuesta de Claude Design): un
   shader WebGL ondula la ilustración y deja estela bajo el puntero, con el `<img>` fijo debajo. Sin WebGL, con el
   shader sin compilar o al imprimir, queda la imagen; con menos movimiento, un fotograma SIN deformar; se para
   fuera de pantalla y con la pestaña oculta; baja a 1x por debajo de 45 fps; media amplitud con el formulario
   enfocado. Sus estilos viven en el componente: la hoja de la página no alcanza su `<img>` ni su `<canvas>`.

**Razón** · Microsoft Learn («Sign in with Microsoft branding guidelines», actualizado 2026-06-15): lo único que
prohíbe es alterar el logo; las medidas (41 px, Segoe UI 15, #2F2F2F/#FFFFFF) son «recommended redlines», y
admite esquema claro u oscuro. Un «este email no existe» deja enumerar cuentas. Los cinco sitios sirven `main` a
desarrolladores y a enlaces pegados en Jira: un guardia mandaría cada enlace profundo al login. La carpeta de
imágenes se llamaba `public/login/` y el servidor servía la CARPETA en `/login` (301): se llama
`public/illustrations/`.

**Descartadas** ·
- **El botón con las medidas de Microsoft a pelo** → cuatro colores y una tipografía fuera del DS en una pantalla
  que es toda tokens; no lo exige la guía.
- **Guardia de rutas que obligue a entrar** → rompe los enlaces profundos de la demo y los e2e sin backend que lo
  justifique; el día que haya backend, el guardia y el token viven en `AuthService`.
- **Decir qué campo falla en las credenciales** → enumeración de cuentas.
- **El ojo de la contraseña a mano sobre `sc-inputtext`** → `audit:primeng-coupling` prohíbe alcanzar clases
  internas del DS; PrimeNG ya lo trae en `p-password` (`toggleMask`), de ahí `sc-password`. Su conmutador nativo
  es un `svg` sin foco ni nombre (medido), así que `sc-password` pinta un botón real por la plantilla del icono.
  Ojo: PrimeNG 22 marca `p-password` como obsoleto en favor de `pInputPassword`, que no trae conmutador; la API
  de `sc-password` no depende de ello.
- **«Recordarme» y bloqueo tras N intentos** → decisiones de producto/backend que no se inventan.

**Consecuencias** · Nuevo e2e `e2e/supervisor/login.spec.ts` (con menos movimiento por defecto: sin GPU en el CI
el shader en bucle solo gasta CPU; el test del fondo lo enciende). La amplitud del fondo (`amplitude`, 0.045 ≈ 64 px)
es la de Claude Design y queda a juicio de Rafa. «Contáctanos» abre https://www.smart-contact.com/contacto/ en pestaña nueva (Rafa). Pendiente de Rafa: la frase de marca de la
izquierda y el texto del botón de Microsoft en pt/fr (de memoria, sin contrastar con el buscador de cadenas de
Microsoft). El radio del panel es `--sc-radius-2xl` (16) y no los 32 de SnowUI: el Kit no tiene un radio mayor.

## DD-109 · 2026-09-14 — `sc-panel` gana cabecera propia (`#header`) y aviso (`severity`), y lo segundo lo decide Rafa en código

**Contexto** · Tras DD-108, la sesión del Dashboard midió que la tarjeta de widget aún no podía ser `sc-panel` sin
perder cuatro cosas: el título es `h2` con una línea de entidades debajo (Panel pinta `header` como `<span>`); el asa
de arrastre va en la cabecera; la tarjeta en alerta lleva borde y anillo ámbar o rojo, que solo se alcanzaban con
`::ng-deep` (tope 0); y con cabecera de plantilla la región del cuerpo perdía su nombre. Panel no tiene variante de
aviso ni en Figma ni en primeng.dev, y el chrome del catálogo solo cambia cuando lo dicta Figma (`.impeccable.md`),
así que se le preguntó a Rafa: quitar el borde, variante en `sc-panel` o pintarlo solo en el Dashboard. Eligió la
variante.

**Decisión** ·
1. **`<ng-template #header let-titleId>`** se reenvía a la plantilla `header` de `p-panel`. `sc-panel` le da a
   `p-panel` un id propio, y el contexto de la plantilla trae `titleId` (`<id>_header`), que es a donde apunta el
   `aria-labelledby` de la región: con `[id]="titleId"` en el título, la región se llama como él. En la plantilla del
   componente el input se lee por `headerText`, porque `#header` lo tapa.
2. **`severity: 'warn' | 'danger' | null`**: borde y anillo de 1 (sombra, no cambia el tamaño) en
   `--sc-border-warning` / `--sc-border-danger`, con transición de los tokens de movimiento y sin ella si se pide
   menos movimiento. Sobre la clase `sc-panel__root` de `pt`, sin `.p-*`.
3. **Figma:** la variante `Severity` de `panel` entra en `docs/figma-pendiente.md` §11.

**Razón** · La cabecera es API pública de Panel (plantilla `header`), y el id propio resuelve la accesibilidad sin
tocar PrimeNG. El aviso lo pidió Rafa como pieza del DS para que cualquier tarjeta lo pinte igual.

**Descartadas** ·
- **Quitar el borde y dejar solo la etiqueta** (la opción recomendada) → Rafa prefirió que el aviso se vea de lejos.
- **Pintarlo en el Dashboard colgándolo de `sc-panel__root`** → funcionaba sin `::ng-deep`, pero cada pantalla lo
  volvería a escribir.
- **`headingLevel` + `subtitle`** → dos inputs para un solo caso; la plantilla cubre también el asa de arrastre.

**Consecuencias** · Dos stories más en `#/components/panel`, dos tests más; la referencia de estilos solo añade anclas.

---

## DD-108 · 2026-09-14 — `sc-panel` gana acciones en la cabecera (`#icons`) y `fill`, para que la tarjeta del Dashboard sea un Panel

**Contexto** · Rafa pidió que las piezas del Dashboard salgan de primeng.dev con los valores de Aura. La tarjeta de
widget (cabecera con título y menú ⋮, cuerpo que llena su celda de la rejilla) es un Panel con la plantilla `icons`,
y en Figma existe: `panel` `229:10217`, variante `Custom Icon=True`. `sc-panel` no pasaba `icons`, y para llenar el
hueco la sesión del Dashboard tendría que estilar `.p-panel-content` desde la app, que `audit:primeng-coupling` no
deja crecer. `audit-screen-vocabulary.mjs` ya anotaba que la cabecera con acciones iría al DS «cuando lo pida una
segunda pantalla» (la primera, el constructor de reglas).

**Decisión** ·
1. **`<ng-template #icons>`** en `sc-panel`: se reenvía a la plantilla `icons` de `p-panel`, delante del botón de
   colapsar. Siempre presente en la plantilla (sin `@if`), porque `p-panel` la busca entre sus hijos directos.
2. **`[fill]`**: el panel toma el alto de su contenedor y el cuerpo se estira (flex en columna, la fila de la rejilla
   de colapso a `minmax(0, 1fr)`), para una tabla con `scrollHeight="flex"` o una rejilla que reparte el alto.
3. **Por `pt`, no por `.p-*`:** el componente pone `sc-panel__root`, `__body`, `__wrapper` y `__content` con el
   pass-through público de PrimeNG, y `fill` se estila sobre esas clases. El acoplamiento no crece.

**Razón** · Es la plantilla documentada de Panel en primeng.dev y la variante que ya dibuja Figma, así que la tarjeta
hereda del tema borde, radio y rellenos de Aura sin CSS de pantalla. Medido en sc-docs: la acción queda en la línea
del título y a su derecha, y con `fill` el panel mide lo mismo que su hueco (252) con el cuerpo hasta el pie.

**Descartadas** ·
- **`sc-card`** → no tiene hueco de acciones ni lo dibuja Figma; Panel sí.
- **Estilar `.p-panel-content` desde la app** → sube `audit:primeng-coupling` y no viaja con el tema.

**Consecuencias** · Dos stories nuevas en `#/components/panel` y dos tests en `components.spec.ts`; la captura de la
página crece (lo de antes no cambia) y la referencia de estilos solo añade las anclas nuevas. Con `toggleable`, al
colapsar un panel `fill` el hueco se queda: está dicho en la API.

**Corrección, mismo día** · `fill` fijaba la fila de la rejilla del cuerpo pero no la columna, que quedaba implícita en
`auto`: una tabla ancha (la de agentes del Dashboard, 582 de mínimo) sacaba el envoltorio de la tarjeta y a 390 la
página ganaba 271 de scroll lateral (medido por la sesión del Dashboard). Ahora también `grid-template-columns:
minmax(0, 1fr)`, y lo ancho se desplaza en su contenedor. Test «fill no deja que un contenido ancho ensanche el
panel», en rojo con el fallo (envoltorio 631,5 en un cuerpo de 198,5).

---

## DD-107 · 2026-09-14 — Un borde de un lado se escribe de un lado: `p-tabs` y otros tres temas dejan de pintar cajas

**Contexto** · La sesión del Dashboard usó `p-tabs` por primera vez en la app (Rafa pidió componentes de
primeng.dev con los valores de Aura) y cada pestaña salió como una caja de 1 px, la activa en navy. Medido allí con
Playwright: `.p-tab { border-width: var(--p-tabs-tab-border-width) }` y el tema daba `tab.borderWidth: "0.071429rem"`,
un solo valor, que CSS aplica a los cuatro lados; lo mismo `tablist.borderWidth`. El Kit (PrimeOne 4.0.0) guarda ese
borde como `1` y lo dibuja solo abajo; al pasar a rem se perdió la forma. Barrido con Aura puro en los 82 temas: la
misma pérdida en `accordion.panel`, `dataview` (cabecera, pie, paginadores) y `treetable` (cabecera, pie,
paginadores). Ninguno de los cuatro se usaba aún en `projects/`.

**Decisión** ·
1. **`tabs` sigue a Aura 3** (DD-97): `tab.borderWidth` `0`, colores de borde `transparent`, `tab.margin` `0`,
   `tablist.borderWidth` `0 0 0.071429rem 0`, `activeBar.bottom` `0`. La marca de la activa es la barra.
2. **`accordion`, `dataview` y `treetable`** llevan el shorthand de Aura con nuestro grosor
   (`0 0 0.071429rem 0` o `0.071429rem 0 0 0`).
3. **Red:** `scripts/__tests__/preset-border-shorthand.test.mjs` compara cada `borderWidth` con Aura puro: varios
   valores en Aura y uno en el tema (caja donde Aura pinta un lado), o `0` en Aura y grosor en el tema. Probado en
   rojo con los cuatro temas de antes (11 filas) y exige haber comparado más de 50 temas, para no pasar en verde
   si deja de cargar Aura.

**Razón** · `tools/aura-diff.mjs tabs` tras el cambio: ya no sale ninguna fila de borde, margen ni barra; las 22 que
quedan son color de marca, anillo de foco y medidas del Kit, todas con motivo.

**Descartadas** ·
- **`0 0 0.071429rem 0` en la pestaña, con el margen negativo** (el Aura de 2024, el que dibuja PrimeOne) → mismo
  resultado a la vista, pero DD-97 ya decidió seguir a Aura 3 donde difieren.
- **Arreglarlo en la rama del Dashboard** → es el tema del DS; un parche en una pantalla deja la caja en las demás.

**Consecuencias** · Sin cambio en pantallas ni capturas: ningún tema tocado estaba en uso. En Figma, `tabs-tab`
dibuja la marca de la activa como borde del propio tab: pasa a la barra (`docs/figma-pendiente.md` §9).

---

## DD-106 · 2026-09-14 — Grises intermedios: los textos y la opción no elegida suben un paso, y la paleta gris del Kit se queda

**Contexto** · `theme-contrast` cazó en el PR 171 la opción no elegida de SelectButton («Todas · Sin transcribir ·
Fallidas») a 2,56:1: gris 500 sobre el carril gris 100. Rafa preguntó por Aura: sus ajustes de ToggleButton son los
mismos que los nuestros (`surface.500` sobre `surface.100`); lo que cambia es la paleta. Se miraron en capturas de
las mismas pantallas tres versiones: los grises de hoy, una «intermedia» y la paleta slate de Aura
(`~/Documents/Claude/2026-09 grises-y-primario/`). Y preguntó si un cambio de color en Figma llega de verdad al tema.

**Decisión** · (1) Se queda la paleta `aura/primitive.slate` del Kit (DD-87) y en claro suben un paso el texto
principal (`slate-800`), el secundario y `subtle` (`slate-700`) y la opción no elegida de ToggleButton (`slate-700`,
con el ratón encima `slate-900`). Se hace en Figma, con alias a otro paso y sin variables nuevas
(`figma-pendiente.md` §8). (2) `cmp-color-rewire` empareja un slot `root` del preset con su token del Kit, que no
tiene ese nivel: `root.color` es `--sc-cmp-togglebutton-color`.

**Razón** · Medido en el navegador: principal 7,38 → 12,16:1, secundario 4,52 → 7,38:1 y opción no elegida
2,56 → 6,40:1. Con la paleta de Aura: 10,35, 7,58 y **4,34:1**, que no llega al 4,5 del test. En OKLCH, el gris 900
de Aura tiene tono 266° e intensidad 0,040, casi los del marino de marca (262° y 0,044); el del Kit, 262° y 0,019,
que es lo que deja destacar al marino (DD-87, razón 1). La migración se probó de punta a punta: con el cambio
simulado en el export, `tokens:import` escribe los tres textos y los cuatro colores de ToggleButton; los textos
llegan a la pantalla (celda `rgb(47, 54, 66)`), pero la opción no elegida seguía en `rgb(143, 151, 163)` porque el
preset tiene `{surface.*}` escrito a mano. Cableado a `var(--sc-cmp-togglebutton-*)`, pinta `rgb(79, 86, 99)` y
`theme-contrast` da 53 de 53. Ese cable no se podía poner: el guard esperaba un token con `root` en el nombre, que el
generador nunca escribe (dos tests nuevos, rojos con el guard anterior).

**Descartadas** ·
- **La paleta slate de Aura** (11 valores en el Kit) → la opción no elegida se queda bajo AA, el gris compite con
  el marino y reabre DD-87.
- **Subir solo la opción no elegida** → pasa el test, pero no da el contraste general que Rafa eligió al ver las
  capturas.
- **Apuntarla en el test como fallo conocido sin decidir su valor** → deja el defecto sin fecha de cierre.

**Consecuencias** · Hasta que llegue el export, el código sigue con los grises de hoy. Cuando llegue, el preset de
ToggleButton se cablea, `--sc-text-subtle` sube a mano y se borra una excepción de `theme-contrast` (§8). El guard
sigue sin ver un hex o una referencia `{…}` en un slot generado: 185 slots de 7 componentes que un cambio de
Figma no alcanza hoy (`ROADMAP.md`). El color del botón principal queda sin decidir, también en `ROADMAP.md`.

---

## DD-105 · 2026-09-14 — Un campo que acumula es un multiselect, su casilla de «todos» también quita, y la sección del agente se llama «Recursos»

**Contexto** · Rafa, probando la ficha de agente tras #174: buscó la sección «Repositorios» en la página del
menú del mismo nombre; en «Plantillas de email», la casilla de «todos» marcaba pero no quitaba; y pidió que
un campo que permite acumular chips sea un multiselect. Medido: 2 elegidas → clic → 6 → clic → 6, igual en la
documentación del DS (sin la ficha por medio). PrimeNG 22.1.0 declara `selectAll = input()` (undefined) y
`allSelected()` hace `selectAll !== null ? selectAll : …`, así que «todo seleccionado» es siempre falso y
`onToggleAll` vuelve a marcarlo todo.

**Decisión** ·
1. **`sc-multiselect` pasa `[selectAll]="null"`** a `p-multiselect`: la selección la calcula el propio control y
   la casilla alterna. Arreglo en el DS, no en la ficha: vale para todo multiselect de las apps. Test en
   `e2e/components.spec.ts` (rojo con el fallo dentro, verde con el arreglo; la captura del componente no cambia).
2. **Un campo que acumula valores de una lista es un `sc-multiselect` con chips.** Idiomas (Avanzado) y Etiquetas
   (Recursos) eran un `sc-select` que se vaciaba tras cada elección más una fila de pastillas debajo; ahora son
   como Agendas y Plantillas. «Idioma» pasa a «Idiomas». Se van `.language-chips` y `.label-chips`.
3. **La sección se llama «Recursos»**, con icono `library_books`: ni el nombre ni la carpeta del menú.
   «Gestionar en Repositorios» se queda y dice dónde se crean.

**Razón** · Dos controles para una lista (uno para añadir, otro para ver y quitar) es el patrón que el
multiselect ya resuelve, con buscador y «todos». Y una sección con el nombre y el icono de una página se lee
como esa página: quien la busca va al menú.

**Descartadas** ·
- **Herramientas** → suena a funciones del puesto. **Asignaciones** → choca con «Grupos asignados» en la misma
  ficha. **Etiquetas, agendas y plantillas** → no cabe en el índice y crece con cada repositorio.
- **Arreglar la casilla en la ficha** (reescribir la selección en `onTemplatesChange`) → el fallo es del
  control y estaba en todos.
- **Los motivos de «No disponible» de Contact Center › Servicio como multiselect** → se escriben a mano, no se
  eligen de una lista.

**Consecuencias** · Las etiquetas pierden su color dentro del campo (chips grises); devolverlo pide un chip con
plantilla en `sc-multiselect`, propuesto y sin hacer. CusCare usa `p-multiselect` a pelo en los filtros de Tickets, con la
casilla de «todos» por defecto: lleva el mismo `[selectAll]="null"` (mismo patrón, no medido en su navegador). Si
PrimeNG corrige `selectAll`, el `null` sigue siendo correcto.

---

## DD-104 · 2026-09-14 — Un icono pinta el tamaño que promete: el glifo de Material se calibra a la rejilla de PrimeIcons

**Contexto** · Rafa, en la ficha de un agente, vio iconos mal escalados, claramente más pequeños de lo debido. Medido: la
papelera de un botón `sm` de solo icono tenía la caja de 12px en un botón de 28 y pintaba **9**. No era de esa
pantalla. Los tamaños de icono del DS salen del Kit (DD-24: el companion mide su `font-size`; `--sc-icon-size-*`),
y el Kit dibuja con PrimeIcons, que llena su caja (`trash` ocupa 100 de 100 unidades). Material Symbols deja aire
dentro de la suya: `delete`, `search` y `edit` ocupan 18 de 24 (`measureText`, 2026-09-14). Cada icono de la app
salía a tres cuartos del tamaño escrito.

**Decisión** · (1) `material-symbols.css` pone `scale: calc(24 / 18)` en `.sc-icon` y `.sc-icon-font::before`:
crece el DIBUJO y la caja se queda igual, así que nada se mueve. Va como propiedad `scale` y no en `transform`
para no pisar el giro de `sc-icon--spin`. DD-24 sigue en pie: el tamaño escrito es el mismo; ahora se cumple.
(2) La réplica `agent` se queda fuera (`scale: none` en su hoja, DD-35): sus `[size]` se midieron sobre el
Comunicador en vivo. (3) El menú de AED (`settings-sidebar`) tenía `[size]="20"` fijado a ojo junto a una etiqueta
de 14. Con la calibración compensaba dos veces y `groups` quedaba a 1,9px de «Grupos». Pasa a companion
(`size="inherit"`), y el text style sube al item, como en el sidebar principal. El índice de las fichas
(`sc-form-section-nav` `flush`, que DD-100 igualó a ese menú con el icono a 20) baja igual a 14, el tamaño de su
etiqueta: si no, `hub` quedaba a 1,9px de «Servicios asignados» y las dos pantallas dejaban de rimar. (4) `e2e/supervisor/icon-glyph-scale.spec.ts`
vigila, en 12 pantallas, que todo glifo Material lleve la escala COMPUTADA y que su tinta quede a ≥2px del
texto de su línea.

**Razón** · Un barrido de las 35 rutas del Supervisor, más 18 menús, desplegables y diálogos abiertos: 0 piezas
con la geometría cambiada en 4 pantallas (la comparación sí detecta un cambio real: salen 309) y 0 iconos sin
calibrar. Los únicos roces eran los del punto (3); tras ellos, el hueco más estrecho de la app es
el de los dos índices, el mismo en los dos: 2,9px (`groups` y `hub`, glifos anchos). El spec se probó en rojo con los dos fallos puestos: sin `scale` y con el `[size]="20"` de vuelta.

**Descartadas** ·
- **Subir un paso el icono de los botones** (`sm` 16, `md` 18, `lg` 20, como el 18/14 de Material 3) → arregla los
  botones y deja enanos la lupa, la barra lateral, los menús y los títulos de sección.
- **Agrandar el `font-size` del glifo con márgenes negativos** → mismo resultado óptico, pero con los `[size]`
  numéricos de `sc-icon` (estilo en línea) hacía falta tocar el componente.
- **Calibrar a 24/20** (el área viva máxima) → 1,2 se quedaba corto en la captura; 24/18 casa con el glifo típico.

**Consecuencias** · Figma sigue dibujando Material a su tamaño literal, así que el código se ve más grande que el
fichero hasta que se ajuste (`docs/figma-pendiente.md` §7). Un glifo ANCHO (`groups`, `manage_accounts`) sobresale
hasta 0,11em por lado de su caja: donde el hueco icono↔texto sea menor de ~3px, lo caza el spec. Las 38 baselines
visuales de sc-docs se regeneran con este cambio.

---

## DD-103 · 2026-09-14 — Un tramo de la miga que lleva a algún sitio lo parece: enlace de verdad, manita y subrayado al pasar el ratón

**Contexto** · Rafa señaló que no quedaba claro qué se podía pulsar. Medido en sc-docs: los tramos con solo
`command` salían con cursor de texto (el navegador pone la manita solo en un `<a>` con dirección, y el CSS de
la miga de PrimeNG no la pide; su menú sí), y al pasar el ratón el padre se oscurecía al mismo gris que el
tramo actual, que es lo único que no se pulsa. El Supervisor navegaba con un `command` que llamaba a
`navigateByUrl`, así que sus tramos eran texto: sin manita, sin Cmd+clic y sin «copiar enlace».

**Decisión** · (1) Una miga que navega pasa `routerLink`, no un `command` (la TopBar del Supervisor ya lo hace).
(2) `sc-breadcrumb` pone `sc-breadcrumb-item--link` en cada tramo con `routerLink`, `url` o `command` que no sea
el último ni esté deshabilitado, y en el inicio si lleva a algún sitio. (3) El tema (`sc-preset/css.ts`) le da
`cursor: pointer` y, solo con ratón (`hover: hover`), subrayado con grosor y posición de la fuente. El tramo
actual no cambia.

**Razón** · Medido el 2026-09-14 en sc-docs y en el Supervisor, antes y después: los padres pasan de `auto` a
`pointer` y en hover de `none` a `underline`; el tramo actual sigue en `auto` y sin subrayar; en el Supervisor
el padre lleva `href` y un clic real navega. Lo respaldan tres fuentes: la regla de `ui-ux-pro-max` (lo pulsable
lleva la manita y algo visible en hover), `better-accessibility` (lo que navega es un enlace con dirección y un
estado no se dice solo con color) y Nielsen Norman Group (el tramo actual no es un enlace y se distingue de los
que sí).

**Descartadas** · *Poner la manita en línea con `linkStyle`*: tapaba el síntoma y dejaba al Supervisor sin
Cmd+clic ni «copiar enlace»; la causa era pasar una acción en vez de una dirección. *Selector `[href]`*: se deja
fuera el tramo con solo `command`, que es justo el que no tenía manita. *Subrayado siempre visible*: una miga es
navegación secundaria y el Kit no lo dibuja; con el hover basta para separar el padre del tramo actual.

**Consecuencias** · Figma no dibuja el subrayado: queda en `docs/figma-pendiente.md` ficha 6, con las guías de
PrimeNG y de comportamiento. `aria-current` no lo pone PrimeNG Angular aunque su guía lo diga (medido); queda
anotado en el wrapper, sin cambiar. `e2e/baselines/component-structure.json` recoge la clase nueva, y
`e2e/breadcrumb-affordance.spec.ts` vigila lo que hace (se pone rojo si la regla del tema no llega).

---

## DD-102 · 2026-09-14 — Una lista nunca corta texto: las columnas cortas miden su dato y, si no cabe, la tabla se desplaza de lado

**Contexto** · Rafa, mirando `/admin/agentes`, pidió como regla fija que el texto no se trunque
nunca (aquí, en las listas). Medido en las tres listas de admin, de 1024 a 1920 de ancho: en Grupos el nombre se cortaba hasta
1440, en Usuarios el email hasta 1440 y en Agentes «CusCare Carrier» hasta 1280. Con `table-layout: fixed` y sin
anchos, las columnas miden lo mismo: Canales o Grupos con media columna vacía y el nombre recortado al lado.

**Decisión** · (1) Cada columna de dato corto lleva el ancho del dato más largo en los cuatro idiomas, con la
cabecera y su flecha de orden en una línea (medido, no a ojo). El nombre, y en Usuarios también el email, se
reparten el resto. (2) `sc-datatable` gana `tableMinWidth` (va a `tableStyle` de `p-table`) y `<sc-list-page>` lo
pasa: la suma de lo que necesita cada columna (Agentes 66rem, Usuarios 61rem, Grupos 56rem). Por debajo, la tabla
se desplaza de lado dentro de su contenedor de scroll (DD-95) en vez de estrechar columnas.

**Razón** · Con las filas a un renglón la lista virtual sigue midiendo bien (DD-95), y ningún texto se pierde a
ningún ancho. Medido tras el cambio: cero textos recortados en las tres listas de 1024 a 1920 y cabeceras de 37 px;
solo a 1024 aparece el desplazamiento lateral. El instrumento, probado con el fallo: a 900 marca los 16 nombres.

**Descartadas** ·
- **Que el nombre parta en dos líneas** → primera versión; con los anchos fijos que necesitan las demás columnas,
  a 1024 el nombre de Agentes se quedaba en 62 px, y dos renglones rompen el alto de fila de la lista virtual.
- **La regla de ancho mínimo como CSS de la app sobre `.p-datatable-table`** → funcionaba, pero una regla de app
  sobre `.p-*` no viaja con el tema; `audit:primeng-coupling` la paró y va como entrada del componente.

**Consecuencias** · Matiza DD-80 en las listas: «una etiqueta no se parte, recorta» sigue valiendo, pero en una
lista con `tableMinWidth` ya no llega a recortar. El número de «Agentes» de Grupos abre la lista de sus agentes
con el mismo `sc-group-popover` que «Grupos» en Agentes (entrada nueva `countAriaLabel`). Matizada por DD-124: con un
dato más largo que los medidos (un apellido compuesto real), la celda recorta con «…» y el texto entero va en su
`title`.

---

## DD-101 · 2026-09-14 — Los editores agente↔grupo se leen por columnas, y cada sección responde una sola pregunta

**Contexto** · Tras DD-100, Rafa pidió quitar el relleno de las fichas (datos redundantes como «12 asignados · 0
sin canales») y aprovechar el espacio de cada sección; después, poder seleccionar varios agentes a la vez en
grupos y, en Repositorios, menos ruido visual.

**Decisión** ·
1. **Agentes de un grupo y grupos de un agente**, el mismo editor visto desde cada lado: barra con buscador que
   solo filtra y «Añadir…» con `sc-select`; una columna por canal con `sc-checkbox` (donde el grupo no ofrece el
   canal, un guion); la tabla siempre, también vacía, con la línea de qué hacer dentro. En el de grupo, elegir
   varios agentes con `sc-bulk-action-bar` (Pausar, Quitar del grupo).
2. **Sin contadores que hay que leer para descartar**: el recuento solo al filtrar («5 de 12») y un aviso solo si
   hay agentes activos sin canal. Fuera los subtítulos que repetían las columnas.
3. **Secciones**: Grupos junta Canales y Estrategia (la estrategia depende de los canales marcados); Usuarios junta
   Secciones y Permisos en «Acceso»; Agentes saca Etiquetas, Agendas y Plantillas de Avanzado a «Recursos».
4. **Recursos de un agente**: un campo por repositorio con lo asignado a la vista, `sc-multiselect` para
   Agendas y Plantillas (de chat y de email por separado) y el selector con etiquetas de color para Etiquetas.
5. **Copy**: «Activo» en vez de «Estado»; «Grabar llamadas» sin ayuda que repita; «Expirar contraseña» una vez.

**Razón** · Las columnas con casilla son la gramática de la matriz de Contact Center y se leen en vertical. Las
dos tablas de Repositorios listaban todo lo que existe (6 plantillas y 8 agendas, con buscador, pestañas y vista
previa) para responder qué tiene asignado el agente: el mismo dato cabe en cuatro campos, sin caja dentro de caja.

**Descartadas** ·
- **El chip de canal de DD-74** (gramática de togglebutton) → queda por columnas; `_channel-chip.scss` se borra.
- **Quitar la selección de filas** para que no convivan dos casillas en la fila → se probó; Rafa quiere elegir
  varios, y la cabecera de cada columna ya dice qué es cada casilla.
- **Repositorios con los desplegables de antes abiertos** → mismo ruido en una sección propia.
- **Llamar a la sección «Repositorios», como el menú** → así salió primero, y Rafa, al probarla, acabó en la
  página del menú buscando el cambio. Se llama «Recursos», con icono de libros y no la carpeta del menú, y su enlace
  «Gestionar en Repositorios» dice dónde viven.

**Consecuencias** · Grupos pasa de 4 secciones a 3, Usuarios de 4 a 3 y Agentes de 4 a 5 (lo vigila
`form-section-nav-legibility.spec.ts`). `sc-multiselect` necesita un valor estable: con un método que devolvía un
array nuevo por ciclo la sección se colgaba (medido), por eso son `computed`. `list-table-grammar.spec.ts` deja de
medir la tabla de Plantillas, que ya no existe, y `audit:datatables` reconoce rutas con parámetro (`editar/:id`).

---

## DD-100 · 2026-09-14 — Las fichas de agente, grupo y usuario usan el molde de Contact Center

**Contexto** · Rafa señaló un problema en los flujos de agentes, grupos y usuarios: estaban hechos a mano y no
eran consistentes con Contact Center. Medido en capturas a 1440: índice con iconos en cajitas grises dentro de un
panel, tarjetas grises, cabeceras en MAYÚSCULAS, tres estilos de etiqueta en un mismo formulario, interruptores
unas veces a la derecha y otras a la izquierda, ayudas escondidas en iconos ⓘ y, a 1440, 67 px de blanco entre el
índice y el formulario. Contact Center se había casado con su maqueta (DD-57, DD-61) y las fichas no.

**Decisión** ·
1. **Un molde para las dos**: `.page__inner--rail` + `.page__rail` + `.page__main` en `_page.scss` (tope 1200,
   centrado, índice de 196 fijo al scroll, 28 entre índice y contenido). `settings-shell` deja su copia y lo usa.
   `--with-panel` se queda para el constructor de reglas. `audit:page-anatomy` conoce el arquetipo `rail`.
2. **El índice** `sc-form-section-nav [flush]` se ve como el de Contact Center: sin panel, icono desnudo a 20,
   `Body/body-regular`, activo con `--sc-bg-hover`. Es lo que dibuja la maqueta: el marco `393:12565` se llama
   «sc-form-section-nav (pure-sc)». La librería del DS no tiene componente de índice (`figma-pendiente` §5).
3. **La ficha** de encima del índice, sin panel y sin pastilla dibujada a mano; recorta el dato largo.
4. **Tarjeta** `surface="card"`, contenido en `.sub-section` con `<sc-divider />` entre tramos y títulos en
   `Body/body-semibold`; etiquetas de campo `.field__label` + `Caption/caption-semibold` en todos los campos.
5. **Interruptor delante de su etiqueta** (`.switch-field`, que sube a `_forms.scss`) con la ayuda visible debajo.
6. **Barra de arriba como Contact Center**: Guardar y, solo con cambios, «Deshacer» (vuelve al último estado
   guardado; `createFormDirtyState` gana `pristineValue()`). Sin «Cancelar» fijo ni «No hay cambios que guardar».
   «Descartar cambios» pasa a «Deshacer» también en Contact Center.

**Razón** · Contact Center antes y después, comparado píxel a píxel: idéntico (salvo el avatar, que cambió en main
por otro motivo). Las fichas quedan en las mismas coordenadas que él (índice en x=180, tarjeta en x=404).

**Descartadas** ·
- **Dejar las fichas de admin fuera, como decía DD-57** (su `<h1>` oculto y la ficha como identidad) → el `<h1>`
  sigue oculto y la ficha se queda; lo que cambia es todo lo demás, que es lo que no rimaba.
- **Una caja de índice propia para las fichas** → sería la tercera versión del mismo índice.

**Consecuencias** · `page-anatomy.spec.ts` mide el molde en las tres altas y en dos pantallas de Contact Center con
las mismas aserciones. Se van `.pill`, `.perm-matrix__head`, `.field--inline`, `.ipanel__delete`, `.disclosure` y
unas 450 líneas de la hoja de la ficha de agente. `customs-catalog` §2.7 describía el índice antiguo.

## DD-99 · 2026-09-14 — El modo oscuro cae en cascada: todo suelo es el lienzo y ningún color de pantalla o componente es fijo

**Contexto** · Rafa vio que en modo oscuro la app no respondía igual que Contact Center (el fondo no era el mismo)
y fijó el criterio: ningún valor suelto; todo va con las variables del modo oscuro, para que un cambio en cualquier
sitio caiga en cascada; y el modo oscuro tiene que leer de Aura, del tema y de PrimeNG. Después pidió igualar a Aura también en oscuro. Medido en 19
pantallas: Contact Center pinta su suelo con `--sc-bg-canvas` (zinc-950) y sus tarjetas en `--sc-bg-surface`
(zinc-900); las otras tapaban el suelo con una caja a toda página en `--sc-bg-surface`. En claro no se ve (los
dos son blanco).

**Decisión** · (1) Todo suelo de pantalla (host, `.page`, `sc-list-page`, formularios, constructor, hub,
Sistema, Seguridad) pinta `--sc-bg-canvas`. (2) Cero primitivas `--sc-color-*`, colores a pelo, reservas de color
y `:host-context(.sc-dark)` en el Supervisor y en los componentes del DS: ~150 usos pasan a su rol, conservando el
píxel del claro cuando el rol existe. (3) Capa 7: lo que no cambiaba en oscuro pasa a receta de Aura sobre
nuestros roles: seleccionado/resaltado = el primario al 16/24/32 % (antes navy blue-900, más oscuro que la
tarjeta), borde primario = relleno primario, bordes suaves de estado = paso 700 al 36 % (el borde de `message`),
iconos de color = su texto, `border-subtle` sobre zinc y no slate, presencia y prioridad con valor oscuro,
sombra de flechas de pestañas y fondo del toast de info (el de `message`, EXCLUDE en `cmp-color-map.mjs`).
(4) La barra lateral en oscuro es la superficie del tema (antes navy blue-900) y su texto sale de nueve
`--sc-sidebar-*` (05-extensions) en vez de nueve `rgb(255 255 255 / x)`. (5) `datatable` recibe una sola clave
oscura (borde de celda seleccionada), la única que leía la rampa navy según `tools/aura-diff.mjs`. (6) Red:
regla 8 de `tokens:guard` y la pregunta «el suelo es el lienzo» en `theme-contrast.spec.ts` (23 rutas).

**Razón** · Aura contra código en oscuro (`aura-diff` en los 97 componentes, filtrado a los que usamos): 145
claves distintas, 111 igual de distintas en claro (marca, Kit, accesibilidad: no son del oscuro) y 34 solo en
oscuro, de las que 32 son la misma receta con nuestra paleta (sky por esmeralda, yellow por orange). Las 2 restantes
eran fugas y están arregladas. PrimeNG ya declaraba `color-scheme: dark` bajo `.sc-dark`, así que los
`light-dark()` de Aura resuelven bien (medido). Las dos redes enrojecen con el fallo puesto (Usuarios con la
pieza en surface; primitiva, color a pelo, reserva y `.sc-dark` inyectados).

**Descartadas** ·
- **Quitar el fondo de los hosts y dejar ver el del shell** → las barras `sticky` necesitan fondo opaco; el lienzo
  explícito es el mismo token y no depende de lo que haya debajo.
- **Cambiar el valor oscuro de `--sc-bg-surface` a zinc-950** → las tarjetas, diálogos y campos de PrimeNG
  (`content.background`) se fundirían con el suelo; Aura y Contact Center separan suelo y tarjeta.
- **Mantener la barra lateral navy en oscuro** → era el único fondo de la app fuera de los neutros de Aura; su
  rampa de alfa sigue pasando sobre zinc-900 (chevron 3,36:1, texto de 12 px 5,19:1).
- **Rampa `primary` sky solo en oscuro** (`colorScheme.dark.primary.50…950`) → cambiaría todo `{primary.N}` de Aura
  en oscuro para arreglar una clave; las demás ya están sobrescritas.

**Consecuencias** · En claro se mueven un poco: los avisos ámbar pasan al warn del tema (yellow), el botón
«Crear» del aviso de categoría pasa a primario, y los focos de campo del DS usan el primario (blue-700 en vez de
blue-500). `sc-bulk-transcription-modal` `surface="dark"` pasa a la superficie de contraste de Aura (antes texto
oscuro sobre navy en modo oscuro). Quedan fuera, documentados: los hex de presencia en claro (sin paso de paleta)
y los iconos de menú en zinc-400 (Aura zinc-500), divergencia de accesibilidad en los dos temas.

---

## DD-98 · 2026-09-14 — Las listas se montan sobre una sola pieza, `sc-list-page`, y cada pantalla pone solo lo suyo

**Contexto** · Al llevar la tabla con scroll propio (DD-95) a las demás listas, el cambio había que copiarlo en
siete pantallas casi iguales (300-800 líneas cada una: título, barra, tabla, selección, menú de fila). Rafa
fijó el objetivo: reutilizar tablas, no multiplicar copias casi iguales, y eligió ir directo a la pieza.

**Decisión** · (1) `shared/components/list-page` (`<sc-list-page>`) monta título, barra (selector de columnas,
buscador, exportar), `<sc-datatable>` con scroll propio y lista virtual, selección con barra en lote y un menú
de fila para «⋮» y clic derecho. La pantalla da `rows`, `columns` con sus celdas, `searchFn`, `sortFn` (orden
que no es un campo tal cual), `rowMenu`, `rowOpenable`, `rowClass` y ranuras `[scListEmpty]`,
`[scListNoResults]`, `[scListBeforeToolbar]` (pestañas, avisos) y `[scListBulkActions]`; diálogos, paneles y
acciones siguen en la pantalla. (2) La montan Usuarios, Agentes, Grupos, Etiquetas, Plantillas, los nueve
repositorios, Reglas y Categorías. (3) Unificado de paso: exportar es el botón de icono en todas; la columna del
menú mide `scale/4`; las casillas de Repositorios se nombran («Seleccionar …», antes «Row Unselected»); Enter abre
la fila solo con el foco en la fila, no en un control de dentro. (4) `core/utils/lang-change.ts`
(`injectLangChange`): las columnas LEEN el idioma; `audit:datatables` exige la lectura y mira también las
pantallas sobre la pieza, y `audit:page-anatomy` cuenta la pieza como arquetipo `list`.

**Razón** · Una red de comportamiento antes/después sobre 9 listas (buscar, Escape, ordenar, columnas, «⋮», clic
derecho, seleccionar una y todas, limpiar, abrir con clic y con Enter, exportar): igual en todo salvo lo
unificado adrede. Los nueve repositorios, mismo título, filas, cabeceras y alto. Pestañas de Plantillas y panel
de edición de Etiquetas, iguales. 161 e2e del Supervisor en verde. −1.300 líneas en `features/`.

**Descartadas** ·
- **Copiar el patrón en cada pantalla** (rama local `arebury/tabla-scroll-listas`, sin subir) → siete copias más
  de lo mismo; el siguiente cambio de lista vuelve a costar siete.
- **Meter en la pieza las tablas de dentro de un formulario** (agentes de un grupo, grupos de un agente) → viven
  en una tarjeta, sin título ni exportar y con controles por fila; las rehace otra sesión (`hind`).
- **Guardar el orden de la tabla como objeto nuevo en cada `sortChange`** → p-table reemite el orden al recibir
  filas nuevas: bucle que colgaba la pestaña al primer clic en una cabecera (medido en Agentes y Grupos).

**Consecuencias** · En Grupos, arrastrar en el selector reordena la tabla (como Agentes y Usuarios); una columna
oculta que se reactiva sale al final, en las tres. «Agentes» de Grupos pierde su ancho fijo (partía la cabecera
en dos líneas). Siete listas declaraban una dependencia de idioma que nunca leían: cabeceras congeladas con el
gate en verde. Fuera de la pieza: Conversaciones (filtros y tabla propia) y Entidades (dos tablas). Ya estaba
antes: el panel de edición de la última fila de Etiquetas, Plantillas y Repositorios hace scroll dentro de la tabla.

---

## DD-97 · 2026-09-14 — Las medidas de PrimeOne que Aura 3 cambió siguen a Aura en código, atadas a la escala, y Figma se alinea después

**Contexto** · DD-87 dejó 109 filas (55 variables) donde el Kit dibuja la medida de PrimeOne 4.0.0 (el
Aura de 2024) y Aura 3 ya la cambió: relleno de opciones de listas y menús, badge, radio, paginador,
mensaje, panel, card, divisor, tag, avatar, tooltip, popover, barra de progreso y diálogo de confirmación.
Vista previa medida en builds estáticos antes de tocar nada (`~/Documents/Claude/2026-09 aura-marca/figma-se-alinea.html`).
Rafa, tras verla, decidió seguir a Aura por consistencia, aplicar los cambios de Figma más tarde
con `docs/figma-pendiente.md`, y que todo quede atado a variables y estilos existentes.

**Decisión** · (1) Las 55 van al paso de escala con el nombre del rem de Aura (como DD-81), una variable
que ya existe. (2) `PENDIENTE_FIGMA` en `sizing-map.mjs`: el generador escribe ese paso en vez del valor del
export, así un export del plugin no devuelve el código a PrimeOne; `token-parity` compara el preset con el
paso y avisa, nombrando la fila, cuando el export ya dice lo mismo. (3) Las opciones de listas y menús
(`list.option`, `list.optionGroup`, `navigation.item`, `navigation.submenuLabel`, icono de submenú) dejan de
estar escritas a mano en `base.ts` y leen `--sc-cmp-*` generados del Kit. (4) El relleno exterior del
divisor y el del addon del grupo de campo, una sola variable en el Kit y dos valores en Aura, se parten en
alto y ancho. (5) Los paneles sm/lg de `sc-select` y `sc-multiselect` dejan su rampa propia de relleno y
letra en cabecera, lista y opciones; solo el buscador conserva la talla del trigger. (6) El desenfoque del
toast en claro pasa al de oscuro (10), como Aura. (7) `toast.width` y `toggleswitch.height` se quedan: Aura
pide 22 y 1,375 rem, que no existen en la escala, y el paso existente más cercano es el actual. (8) Lo que
Figma tiene que hacer, variable a variable: `docs/figma-pendiente.md` §4.

**Razón** · Medido con el mismo camino que un cambio real (export del Kit con los pasos nuevos,
`tokens:import`, builds antes y después): opción de lista 34 → 27 px, badge 21 → 17,5, radio 17,5 → 15,75,
botón de página 35 → 31,5, mensaje 34 → 30,5, cabecera de panel 51,5 → 48; en el Supervisor la pantalla
que más cambia es Repositorios (3,5 %, la lista se compacta unos 105 px), Conversaciones 1,4 % y el resto
por debajo del 1,2 %. Los 708 `--sc-cmp-*` comunes con la simulación salen idénticos. El filtro de
Conversaciones no cambiaba (30,5 px antes y después) porque la rampa del panel sm pisaba al tema: por eso
se retira. Las redes, probadas en rojo: con el relleno de lista devuelto a mano, parity cae con DRIFT en
las dos filas; con un export que ya dice el paso de Aura en `badge.height`, parity avisa de esa fila; con un
paso inexistente, el test del mapa cae.

**Descartadas** ·
- **Cambiar primero Figma y esperar al robot** → Rafa quiere el código en Aura en esta sesión; Figma va
  después con el documento.
- **`DIVERGE_SIZING` con el valor a mano fuera de la zona generada** → 55 tokens más escritos a mano y sin
  aviso de cuándo sobran; `PENDIENTE_FIGMA` los mantiene generados y se vacía sola.
- **Conservar la rampa sm/lg del panel (DD-50)** → Aura no modela el panel por talla y la rampa hacía que el
  filtro de Conversaciones no siguiera ni a Figma ni a Aura.
- **Crear pasos de escala para 22 y 1,375 rem** → serían variables nuevas; Rafa: atado a lo que existe.

**Consecuencias** · Con cada export, parity dice qué pendientes ya están alineados en Figma para quitar su
fila; en las tres variables separadas, además, cambian sus `exp` a `…y`/`…x`. Baselines de estilos,
estructura y capturas de sc-docs regeneradas en el mismo cambio. DD-87 punto 5 y DD-50 anotadas.

---

## DD-96 · 2026-09-14 — El menú de una fila sale donde se hace clic, y el estado de un agente se cambia como en el dialpad

**Contexto** · Revisando Agentes con la tabla nueva (DD-95), Rafa pidió: que el clic derecho abra el menú
donde se hace clic, como es habitual en un SaaS B2B, y siempre igual (salía pegado al borde izquierdo de la
fila); cambiar el desplegable de estado de cada fila por un botón que abra los estados, como el panel
«Estados» del dialpad de Agent; 500 agentes de demostración con nombres de Hollywood, él incluido como
«Rafa Areses»; y las mejoras de `better-ui` medidas (dos X en el buscador, nombres cortados con columnas
de igual ancho, icono de ordenar pegado al título, avatares sin contorno). Además salían avatares «+3».

**Decisión** · (1) `sc-datatable` relanza el clic derecho desde un punto de 0 px en el puntero: el
`<p-menu>` de cada pantalla (el mismo del kebab) se coloca junto a ese punto, en todas las tablas y sin
tocar ninguna pantalla. Antes cierra lo que haya abierto y abre en el siguiente turno, para que un segundo
clic derecho mueva el menú. (2) Estado del agente: botón de texto con punto de color, estado y flecha, y
un `<p-menu>` compartido con los estados (el actual con punto, negrita y ✓). (3) Seed de 500 agentes: los
16 de siempre con nombres de Hollywood y el 15 «Rafa Areses»; el resto repite sus datos; versión del almacén
local a 3. (4) El reparto de avatares ilustrados usa 22 dibujos: `avatar-22` es una «F» y `avatar-23` un
«+3». (5) Nombre a `scale/18`; sin la X del navegador en `sc-search`; icono de ordenar a `scale/0-5` del
título; contorno interior de 1 px `--sc-border-subtle` en el avatar ilustrado.

**Razón** · Medido en builds estáticos: tres clics derechos seguidos en Agentes, Usuarios y Categorías abren
en el punto exacto; en Conversaciones una fila sin acciones no abre nada; en la esquina inferior derecha el
menú se recoloca; el kebab sigue junto a su botón. Con la lista de estados abierta la fila no navega y elegir
«Comida» la cambia. Cero nombres cortados (antes 4 de 16). Ningún avatar «F» ni «+3» en pantalla.

**Descartadas** ·
- **`p-contextmenu` para el clic derecho** → otro componente y otras clases para el mismo modelo del kebab,
  y cambiar las 10 pantallas y sus pruebas; el punto en el puntero consigue lo mismo desde el DS.
- **Cerrar y abrir seguidos** → `p-menu` no se recoloca hasta terminar de cerrarse: reabría en el sitio viejo
  con las opciones de la fila nueva (medido).
- **Fijar el ancho de todas las columnas con la escala** → sus pasos grandes van a saltos (70, 175, 252) y a
  1280 dejaban Nombre sin sitio; solo Nombre se fija y el resto reparte.
- **Contorno de avatar en negro con transparencia** (receta de `better-ui`) → no hay variable; se usa el borde
  sutil del DS.
- **Quitar el doble anillo de foco del buscador** → es el foco de TODOS los campos del DS (anillo sky 2 px +
  borde): cambiarlo en uno rompería la coherencia. Queda como decisión aparte.

**Consecuencias** · La flecha del botón de estado lleva `--sc-icon-subtle`: con el color del botón de texto
salía a 2,95:1 y `theme-contrast` lo cazó. Casi todos los avatares cambian de dibujo (el reparto depende del
número de dibujos). Pendiente de decidir: el foco de los campos (anillo y borde a la vez).

---

## DD-95 · 2026-09-14 — Las listas hacen scroll dentro de la tabla: se ajusta a sus filas y, con muchas, solo pinta las que se ven

**Contexto** · El jefe de Rafa pidió que al bajar no se pierdan el buscador ni la cabecera de columnas, y
preguntó si era mucho desarrollo frente a una tabla con scroll propio. Se midieron las dos en ramas que no se
funden (`comparar/tabla-sticky` y `comparar/tabla-scroll`, informe en `~/Documents/Claude/2026-09
tabla-sticky-vs-scroll/`): con la cabecera fija y scroll de página, 5.000 filas tardan 3 min 36 s y 1,37 GB;
con scroll propio y lista virtual, 0,27 s y 26 MB. A cambio, el scroll propio veía menos filas, se quedaba en
191 px con zoom al 200 % y dejaba la tarjeta vacía con 3 filas. Rafa y dos usuarios eligieron el scroll propio.

**Decisión** · (1) `sc-datatable` estrena `virtualScroll`: con `scrollable`, por encima de 100 filas solo
pinta las visibles; mide sola el alto de fila (pinta una, la mide y activa la lista), sin número a mano. (2)
Con `scrollHeight="flex"`, sin lista virtual la tabla se AJUSTA a sus filas y solo hace scroll si no caben
(`sc-datatable--fit`); con ella, LLENA el alto (`sc-datatable--fill`), que es lo que la lista virtual necesita.
(3) La barra de scroll empieza bajo la cabecera de columnas: `sc-datatable` mide la cabecera
(`--sc-datatable-thead-height`) y el tema coloca la pista. (4) Forma de página compartida `.page--tabla` en
`_page.scss`: la página no hace scroll, alto mínimo `scale/25` para zoom y pantallas bajas, y con filas
marcadas la tarjeta deja sitio a la barra de selección (`.table-card--seleccion`). (5) Agentes es la primera.

**Razón** · Escala sin límite y es un solo patrón para todas las listas, también las que crecerán. Medido en
Agentes (build estático): 3 y 12 filas sin hueco bajo la última; 60 hacen scroll dentro con la cabecera fija;
150 y 5.000 cargan igual con 20 filas pintadas; al 200 % se ven 3 filas (antes 2); buscar pasa de llenar a
ajustarse y vuelve; con una fila marcada la tarjeta acaba a 9 px de la barra de selección.

**Descartadas** ·
- **Cabecera fija con scroll de página** → más filas a la vista y Ctrl+F completo, pero se hunde con muchas
  filas y cualquier caja con `overflow` por encima la rompe (pasó con la tarjeta de Agentes).
- **Llenar siempre el alto** (la rama de comparación) → con 3 filas, tarjeta vacía hasta abajo.
- **Ajustarse también con lista virtual** → la lista virtual necesita alto fijo: la tarjeta se hundía a 2 px
  y no pintaba ninguna fila (medido).
- **Alto de fila escrito a mano** (54 en la rama de comparación) → cambia con el contenido de cada tabla.

**Consecuencias** · Con lista virtual, Ctrl+F solo encuentra las filas visibles (la pantalla tiene su
buscador) y las filas deben medir igual: una lista con filas desplegables no la activa. Una página con
`.page--tabla` no puede reservar la barra de selección con `padding-bottom` ni poner `overflow` en su
`.table-card`. Pendiente: llevar el patrón al resto de listas (Usuarios, Grupos, Etiquetas, Plantillas,
repositorios, Conversaciones).

---

## DD-94 · 2026-09-14 — La cabecera y el bloque del logo miden 56 con el mismo token, y todas las listas reparten el aire igual

**Contexto** · Tras DD-90 y DD-91, Rafa pidió compactar todo lo posible. Medido en 15 rutas del Supervisor
(builds estáticos, 1440): barra → título 24,5 en 13 pantallas, 14 en Conversaciones y 38,5 en Repositorios;
buscador → tabla 28 en Usuarios, Agentes y Grupos, 21 en Etiquetas y Plantillas y 15,75 en las listas de
repositorio, contra título → buscador 14; la TopBar a 75 contra el bloque del logo de la barra lateral a 64;
lados de página 31,5 contra los 28 de la miga. Y la barra de búsqueda de Usuarios, Agentes y Grupos era
`sticky` pero no se quedaba: `.page` tenía `overflow-y: auto`, era contenedor de scroll sin hacer scroll.

**Decisión** · (1) TopBar `min-height` y `.sidebar__brand` `height` con el mismo `scale/4` (56, la barra de
Sakai sobre Aura): las dos rayas casan. Lo de dentro pasa a tokens del DS: botón de la barra lateral
`--sc-cmp-button-sm-icon-only-width` (28), avatar `--sc-cmp-avatar-width` (28, antes 32 a mano; el avatar ilustrado
acepta ya una longitud CSS) y raya `scale/1-143`. Criterio de Rafa: todo con variables existentes, ningún valor a mano. (2) Página: arriba `1-25` (17,5) y lados `2` (28) en las 13 pantallas con título y en el hub.
(3) Buscador → tabla `0-875` en todas las listas, en MARGEN: el degradado de 12 px de la barra fija tapaba el
borde de la tabla si iba en relleno. (4) Fuera `overflow-y: auto` de `.page` en las tres listas con barra fija.

**Razón** · Lo que es de la tabla va más cerca de la tabla (12,25) que del título (14), que es la regla de Aura
de DD-90. Medido antes y después con el #160 dentro: ninguna pantalla pierde filas (Conversaciones 13, Grupos
gana una), por debajo de la tabla ningún texto cambia de posición, sin scroll horizontal a 1280, y la barra de
Agentes y Grupos pasa de irse a −251 a quedarse en 0. 161 e2e del Supervisor en verde.

**Descartadas** ·
- **Buscador → tabla 10,5 o 14 en relleno** → el degradado de la barra tapa el borde de arriba de la tabla.
- **Título a 14 de la barra, como Conversaciones** → quedaría a la misma distancia de la barra que de su
  contenido y dejaría de agruparse con él.
- **TopBar a `min-height: 64px`**, el `height` que tenía el logo → número a mano; primera versión de Claude.
- **Compactar más para ganar filas** → los ≈33 px que se ganan no dan ninguna fila (una fila de lista mide 44-54).

**Consecuencias** · Figma dibuja la TopBar a 72 y el avatar a 32: apuntado en `docs/figma-pendiente.md` §3. Sin tocar: los
formularios con rail (`.page__form`, 24,5/28, lo fija `page-anatomy`) y `settings-shell`. Pendiente de
decisión aparte: cabecera de columnas fija con scroll de página o tabla con scroll propio (comparación en
`~/Documents/Claude/2026-09 tabla-sticky-vs-scroll/`).

---

## DD-93 · 2026-09-14 — El tema del equipo externo se instala con npm y habla el idioma del plugin

**Contexto** · Rafa pidió que al equipo externo le funcionen sin fallos el tema y el `extend`, y que se actualicen
en su código sin pasar por nadie cada vez. Medido el 2026-09-14 sobre su web publicada (ui.smart-contact.com, raíz a 16 px)
y con los paquetes de PrimeNG 21 (`@primeuix/styled` 0.7.4, `@primeuix/styles` 2.0.3): (1) su hoja global
lee variables del `extend` del plugin (`--p-typography-font-size-100`, `--p-app-typography-xl-line-height`…)
y nuestro tema no traía 63 de las que el plugin define; (2) con PrimeNG 21, los estilos de sus componentes
leen 2.250 variables: el tema del plugin deja 367 sin definir, el nuestro 10, y el Aura propio de PrimeNG 21
esas mismas 10 (son de PrimeNG, no un hueco); control con PrimeNG 22: 727 contra 4; (3) el zip había que
descargarlo a mano en cada cambio.

**Decisión** · (1) `tema-zip.mjs` añade al tema empaquetado el `extend` del plugin, generado de la
colección `aura/custom` del Kit (de donde lo saca el plugin): tipografía a nuestros `--sc-font-*`, pasos
de escala a `--sc-scale-*`, las divergencias escritas en `coverage-map` (acento, icono de diálogo) a
nuestro token, y el resto con el valor del Kit; pesos sin «px». Lo que `sc-preset/extend.ts` ya declara,
gana. Nuestras apps no cambian: solo el paquete. (2) Comprobación 4: rojo si al tema empaquetado le falta
una variable de ese contrato. (3) El tema es un paquete npm, `smartcontact-tema`, que `tema-zip.yml`
publica también como fichero, `smartcontact-tema.tgz`. Se entrega así, adjunto en Jira; ellos lo guardan
donde ya guardan paquetes como `.tgz` (`smart-contact-ui-lab/local-libs/archives`) y lo instalan con
`npm install ./….tgz`. Rafa pidió que no necesiten acceso a su GitHub, y que sea privado. La rama `tema-zip`
sigue siendo instalable como dependencia git, para uso interno. (4) `tema-zip.yml` también corre cuando
cambia el export del Kit.

**Razón** · Un solo tema, el de nuestras apps, que además cumple el contrato del plugin: la hoja que
escribieron contra el plugin sigue encontrando sus variables y los componentes de PrimeNG 21 quedan tan
completos como con Aura. Medido: el `extend` solo añade (59 variables nuevas, 0 existentes cambian ni
desaparecen); de las 63 que faltaban quedan 4, `app.typography.xl/xxl`, que el Kit de hoy tampoco tiene y
cuyo respaldo en su hoja (1,5rem y 1,75rem) da lo mismo que daba el plugin (24 y 28 px). Instalación
ensayada con la rama simulada en un repo local (instala sin los zips, importa el preset, y tras un commit
nuevo `npm update smartcontact-tema` lo trae) y desde el `.tgz` (7 ficheros, el preset importa).

**Descartadas** ·
- **Arreglar el export del plugin a posteriori** (raíz, pesos, reglas CSS, decisiones de código) → sería
  reescribir su salida en cada export, y aun así no lleva lo que se decide en código.
- **Meter el `extend` del plugin en `sc-preset` de nuestras apps** → nadie de este repo lo lee; en el paquete
  basta y no toca nada nuestro.
- **Instalar desde nuestra rama de GitHub** (primera propuesta de Claude) → el equipo externo dependería
  de nuestro GitHub; Rafa lo quiere en su casa.
- **npm público (npmjs.com)** → el nombre está libre y se actualiza solo, pero el paquete sería público.
- **Inicio de sesión único (SSO)** → sirve a personas en el navegador; `npm install` y su CI entran con
  token, así que cualquier registro privado acaba pidiendo uno.
- **Etiquetas semver en el repo para `#semver:`** → se mezclarían con las del DS (v1.x).

**Consecuencias** · El equipo externo cambia la instalación una vez (guía en el `README.md` del paquete,
con redacción profesional). Cada versión se llama igual, `smartcontact-tema.tgz`: Rafa la descarga del
enlace fijo (`…/raw/tema-zip/smartcontact-tema.tgz`) y la adjunta en Jira, y ellos sustituyen el fichero y
reinstalan (medido: con el mismo nombre y contenido nuevo, npm instala la versión nueva). Sin token en su
GitLab, porque diseño y producto no tocan su código (Rafa).

Prueba por fuera en su entorno de desarrollo (Contact Center, SISMAC-4074), con el tema inyectado solo en
el navegador de la sesión, sin guardar nada: los controles siguen al tema (campo 32 → 32,5, botón sm
28 → 27, md 32 → 32,5, primario `#1b273d`), y en la pantalla no cambia ningún texto, color ni espaciado:
de 115 elementos propios visibles, 37 cambian solo de alto, arrastrados por los controles. Cuadra con su
hoja: 465 declaraciones, 96 medidas y 57 colores fijos, 70 `!important` y ningún `var()`. Pendiente de medir
en su app que el preset rinda igual con PrimeNG 21. Fuera de alcance: sus `--sc-*` propias (557
definiciones, 253 con valor fijo, 304 nombres que no existen en el nuestro) y la hoja de Contact Center no
siguen a ningún tema; pasarlas a variables es otra tanda.

---

## DD-92 · 2026-09-14 — La colección «App» de PrimeOne se queda, como alias de Custom: el DS ya no la usa y no puede desviarse

**Contexto** · Al cerrar DD-91 quedó a la vista una colección duplicada en el Smart-Contact Design System:
«App», la que vino con PrimeOne, con `app/font/size`, `app/sm|lg/font/size`, `app/sm|lg/line/height` y
`app/card/background`. Dice lo mismo que `app/typography/{sm,md,lg}/*` de Custom, pero sin interlineado md, y
el código no la lee (`coverage-map`: `not-consumed`). Rafa pidió estudiarlo contra el DS de sus devs para no
sobrecargarlos.

**Decisión** · (1) Revincular 1:1, con versión guardada antes, cada enlace del fichero del DS: `app/font/size` →
`app/typography/md/fontSize`, `app/sm|lg/font/size` → `app/typography/sm|lg/fontSize`, `app/sm|lg/line/height`
→ `app/typography/sm|lg/lineHeight`, `app/card/background` → `content/background`. (2) **No borrarla**: sus
cinco variables de letra e interlineado pasan a ser alias de su gemela en Custom (`app/card/background` ya lo
era de `content/background`), cada una con una descripción que dice que es heredada y remite aquí. Queda
anotado para revisar más adelante si se borra.

*Corregido el mismo día.* La primera versión de esta entrada (#161) decía «se retira», en cuatro pasos que
acababan borrando la colección. Rafa lo paró: primero garantizar que nada se rompa. Borrar exigía publicar la
librería, actualizar el fichero Supervisor y revincular sus 939 enlaces a «App» dentro de instancias; el alias
consigue lo mismo que importaba (que no se desvíe) sin tocar nada de eso.

**Razón** · Cada variable de «App» era un alias de una primitiva que también usa Custom, así que el cambio de
enlace no cambia ningún valor: medido nodo a nodo, antes y después, letra, interlineado y color idénticos en los 1.572 enlaces
de maestros (32 páginas) y en los 37 overrides de instancias (AutoComplete, DatePicker, InputNumber, InputOtp,
OrganizationChart, Flujos); relectura final, 0 enlaces a «App» en el fichero. Mientras existiera, un cambio
en `app/typography/md/fontSize` movía el código y no el botón md de Figma, cuya letra colgaba de «App»: eran
hermanas de la misma primitiva, no una alias de la otra. Con el alias, releído en Figma, las seis resuelven al
mismo valor que antes en claro y en oscuro, y un cambio en Custom arrastra a «App». Y no
afecta a los devs: en su web y su bundle (ui.smart-contact.com) hay 0 apariciones de `app.font`, `app.sm.` o
`--p-app-font-size`; su tema es un preset propio que ya lee `app.typography.*`, con tokens de otro Figma.
Tampoco es la estructura por defecto que espera el tema (la duda de Rafa): la guía del UI Kit de PrimeTek
(https://primeng.dev/uikit/guide/v4, «Collections») dice «App: Variables in this collection are not part of
the PrimeUIX system. They are intended for values defined in your own application», y la que llega al Theme
Designer es Custom; ninguna se declara obligatoria. El preset Aura de `@primeuix/themes` solo trae
`primitive`, `semantic`, `components` y `css`, y hay 0 referencias a `{app.` o `p-app-` en `@primeuix/*` y
en `primeng`. Probado con una copia del export sin `aura/app` (`SC_KIT_EXPORT`): los cinco generadores y
`token-parity` salen igual que con el export real, salvo el recuento de hojas de `aura/app` (6 → 0). Lo que
lee el código no pasa por «App» en ninguna opción: el tema del plugin solo saca `app.typography` (de Custom) en
`extend.js`, y nuestro `extend.ts` lo sigue con el contrato de `token-parity`.

**Descartadas** ·
- **Borrarla** (la primera versión de esta entrada) → lo más limpio, pero pide publicar la librería, actualizar
  el Supervisor y revincular sus 939 enlaces a «App» antes; sin eso quedan con el número suelto. Se revisará.
- **Dejarla apuntando a las primitivas** → no rompe nada, pero es la trampa: la primera que aparece al buscar
  «app line height» en Figma, y un cambio en Custom no la movía.

**Consecuencias** · Sin cambio de píxeles, en Figma ni en código. En el próximo export del plugin, las cinco
hojas de `aura/app` cambian de texto (`{primitive.typography.font.size.200}` → `{app.typography.md.fontSize}`
y sus hermanas); el código las ignora (`coverage-map`: `not-consumed`). Si un día se borra, el código ya aguanta
un export sin `aura/app` y sobraría su regla de `coverage-map` y su línea del censo. Versiones de Figma: «Antes de
limpiar la colección App: revincular a Custom» y «Antes de apuntar App a Custom».

---

## DD-91 · 2026-09-14 — Los controles llevan el interlineado de la rampa, atado en Figma: campo y botón 32,5, sm 27, lg 40

**Contexto** · Tras DD-81 el campo y el botón md medían 29,5 y el sm 24, un 12 % por debajo de primeng.dev
(35 y 28). La simulación de la escala a 16 (PR #153, `~/Documents/Claude/2026-09 escala-16/`) midió que lo
que más separa es el interlineado: Aura pone 1,5 a los controles y DD-51 los había dejado en `normal`
porque sus maestros de Figma iban en `AUTO`. Rafa eligió entre tres opciones (solo interlineado, escala a
16 más interlineado, solo escala) la primera, con 20/18: un interlineado que ya existe como variable.
Para no decidir con una suma, se midió también la segunda con 20/18.

**Decisión** · (1) Figma primero, con versión guardada antes de cada tanda y todo releído: el texto propio
de los maestros de botón (md, sm, lg), contenido de campo, select, multiselect, treeselect, cascadeselect,
autocomplete y textarea, togglebutton y opciones de select, multiselect y listbox (1.570 textos) queda
atado a `app/typography/{sm,md,lg}/lineHeight` (18/20/24), la variable «Custom» que ya lee el tema.
(2) `sc-preset/css.ts` deja las dos familias de DD-51: una regla por talla, controles y etiquetas leen
`app.typography.*`. `emit-consumer-typography.mjs` emite lo mismo para el equipo externo. (3) Tres
wrappers dejan de escribir tallas a mano, sin capa, por encima del tema: `sc-inputtext` pasa su talla a
PrimeNG (`[pSize]`) y quita letra y relleno sm/lg; `sc-select` y `sc-multiselect` quitan letra y relleno
sm/lg del disparador; `sc-datepicker` quita su letra md, que ganaba también en sm y lg.

**Razón** · Medido en build estático a 1440 × 900, en claro, contra el mismo `main`: campo y botón md 29,5
→ 32,5, sm 24 → 27, lg 36 → 40, select y multiselect 32,5; los maestros de Figma, releídos tras atar,
miden lo mismo (32,5 / 27 / 40, campo sm 27, lg 40). Conversaciones no pierde filas: 13 sin scroll antes y
después, con la barra de DD-90 (12 y 12 sobre la barra anterior). La
opción 2 con 20/18, medida inyectando la misma regla sobre el build de la escala a 16 (la inyección
coincide con el build real de esta opción en todas las medidas; medida antes de DD-90): 34 / 28 / 42 y 11
filas contra 12. El arreglo de
los wrappers no es opcional: con solo la regla, la barra de filtros de Conversaciones (seis controles sm)
pasaba de 27,5 · 26 · 27,5 a 32,5 · 27 · 30,5, porque `sc-inputtext` sm no llevaba la clase sm y la fecha
sm salía con letra de 14. Con el arreglo, los seis miden 27. El relleno sm que escribían (5,25 × 8,75) era
el md de una generación vieja de Figma: el maestro de hoy y el export dicen 3,5 × 7. Y el DS de los devs
(ui.smart-contact.com, medido) ya da a sus controles esa misma rampa: botón y campo md 32, sm 28, lg 42.

**Descartadas** ·
- **Interlineado 1,5 (21 a 14px), el de Aura** → no existe variable de 21; habría que crearla, y 20 es el
  interlineado md que DD-39 unificó para todo el sistema.
- **Escala a 16 más 20/18** (34 y 28) → agranda un 14 % todos los márgenes de todas las pantallas para
  ganar 1,5px en el control, y quita una fila en Conversaciones. Para un producto de tablas, las filas
  visibles mandan.
- **Solo botón, campo y select** → un multiselect junto a un select mediría 3px menos.
- **Atar también el datepicker en Figma** → en código sus celdas tienen tamaño fijo y no cambian (28 × 28;
  la fila de días de la semana sube 1px); en Figma se ajustan al texto y pasarían de 35 a 38. Atarlo abriría
  un desfase que hoy no existe. Se queda en `AUTO`.
- **Atar las etiquetas (chip, tag, toast) a la variable por talla** → ya van atadas a la primitiva, y no
  tienen tallas: cumplen el criterio de Rafa (lo que tiene tallas sm, md y lg se ata por talla; lo que no, a la primitiva).

**Consecuencias** · Acota DD-51: los controles ya no llevan `normal`, y la frase «el Kit no modela el
interlineado del botón» deja de ser cierta. Textarea md 62 → 71 (tres filas de 20). Fila de las
tablas-lista 41 → 44 (su kebab es un botón sm: 27 + 8×2 + 1; `list-table-grammar` actualizado). 34
capturas de referencia de sc-docs, `component-styles` (32 interlineados de `normal` a px y el relleno sm/lg
de `sc-inputtext`) y `component-structure` (clase de talla en el input y alto del textarea) regenerados. Quedan anotados sin tocar: la
hora del datepicker va a 17,5 en Figma y a 14 en código; el botón solo icono no es cuadrado (31,5 × 32,5,
antes 31,5 × 29,5); en los filtros, origen y destino quedan unos 2px más arriba que los multiselect (hueco
entre rótulo y control de cada wrapper, ya pasaba); y la colección «App» de PrimeOne duplica letra e
interlineado sin md, el código no la lee y el DS de los devs tampoco, pero el botón md tiene su letra atada
ahí. Página, capturas y sondas en `~/Documents/Claude/2026-09 densidad-controles/`.

---

## DD-90 · 2026-09-14 — La barra de arriba deja de sumar el relleno de la miga, y el título queda a la distancia de Aura en las 13 pantallas

**Contexto** · Rafa, pensando en llevar la densidad a la de Aura (escala 16 e interlineado 1,5), vio que la cabecera
ocupaba demasiado, y los huecos entre título y contenido parecían grandes. Medido en builds estáticos a
1440 (`~/Documents/Claude/2026-09 aire-aura/`): (1) la TopBar medía 91 y 48 eran la miga, porque
`<p-breadcrumb>` trae su relleno de barra suelta (14 a cada lado) dentro de una barra que ya pone 21.
(2) Título → contenido: 21 en 9 pantallas y 31,5-33 en Usuarios, Agentes, Grupos y Conversaciones, donde
se sumaba el relleno de la barra de búsqueda o de los filtros. (3) Por qué Aura no engorda: Aura 3 subió
el interlineado a 1,5 y en la misma versión bajó un paso de 1/8 rem casi todos los rellenos (campo
0,5→0,375, celda 0,75→0,5, diálogo y tarjeta 1,25→1,125). Las cajas quedan como en Aura 2 a 14 px
(Sakai: celda 38,8 contra 38). Entre la cabecera de un Panel y su contenido pone 1rem.

**Decisión** · (1) `sc-breadcrumb` estrena `flush`: sin relleno propio, en línea sobre la raíz (como
`labelStyle`), y la TopBar lo usa. Barra de 91 a 75. (2) `h1.page__heading` pasa de `1-5` a `scale/1`:
el 1rem de Aura con el nombre de paso de DD-81 (hoy 14, 16 con la escala a 16). Donde el hueco lo ponía
otra cosa se compensa en su SCSS: las tres listas con barra fija suben la barra lo que mide su relleno de
arriba, los filtros de Conversaciones pierden un relleno superior que ya no pintaba nada, y Reglas,
Entidades y Categorías bajan su `gap` a `scale/1` y devuelven lo que pierden en márgenes (35 y 42 de
siempre). Rafa eligió «las 13 a 16, como Aura» frente a «las 13 a 21».

**Razón** · Es el reparto de Aura: el relleno lo pone la barra y no lo que va dentro (`Toolbar`), y un
título se separa de su contenido con un solo hueco. Medido en las 15 rutas: barra 75 (79 en
Conversaciones, por la pastilla DEMO), título → contenido 14 en todas, y ningún texto por debajo del título
cambia de posición relativa (sonda probada en rojo: un margen quitado a propósito da 51 de 73 distintos).

**Descartadas** ·
- **Quitar el relleno en el preset (`breadcrumb.root.padding`)** → lo define el Kit y viaja a cualquier
  miga suelta; el problema es de la barra que la contiene.
- **`::ng-deep .p-breadcrumb` desde la TopBar** → reach-in a un componente del DS, lo que caza
  `audit:primeng-coupling` §E; el precedente es una entrada del DS (`flushBody`).
- **Las 4 pantallas a 21, como las otras 9** → cambio mínimo, pero Rafa prefirió la distancia de Aura.
- **`scale/1-143` (16 px exactos hoy)** → rompe la regla de DD-81 y con la escala a 16 valdría 18,3.

**Consecuencias** · Todo el contenido empieza 16 px más arriba (12 en Conversaciones). La miga arranca 14
px más a la izquierda: a la misma distancia de la raya que el icono de inicio. `text-styles-applied` pasa
a esperar 14. Visto de paso, sin tocar: la barra de búsqueda de Usuarios, Agentes y Grupos es `sticky`
dentro de `.page`, pero el que hace scroll es `main.app-shell__content`, así que no se queda fija ni
antes ni después (el mismo fallo que DD-80 resolvió en las tablas).

---

## DD-89 · 2026-09-14 — Cada paso de la escala se llama por su clave del export, y un gate cae si algo apunta a un paso que no existe

**Contexto** · La simulación de la escala a tamaño Aura (PR #153) midió una trampa: el generador
nombraba cada paso por su valor (`scaleSuffix`, valor/14). Si un valor de `scale/*` cambia en Figma, el
paso se renombra (con 6px pasaría a llamarse «0-429») y todo lo que apuntaba al nombre viejo (`--sc-spacing-*`,
temas) queda sin definir. Una variable sin definir es un valor inválido que el navegador ignora, así que
el build salía verde: 30 de 35 pasos colgados y cientos de usos rotos por pantalla. Rafa aprobó
arreglarlo aunque no se cambie la escala.

**Decisión** · (1) `token-gen.mjs` nombra cada paso por su clave (`scale.0-375` → `--sc-scale-0-375`) con
`scaleNameFromKey`; si un paso deja de valer rem×14 lo avisa, sin fallar. (2) Un gate en el mismo
generador, en `--write` (el robot) y en el chequeo de `verify`: rojo si algún `var(--sc-scale-*)` o
`var(--sc-spacing-*)` del repo apunta a un nombre que ninguna capa declara.

**Razón** · El nombre es el contrato que usan 1.280 espaciados y los temas; el valor es lo que Figma
decide. Con el export de hoy las claves coinciden con valor/14, así que las capas salen idénticas.

**Descartadas** ·
- **Solo el gate, sin cambiar el nombre** → cantaría el rojo, pero cualquier cambio de valor en la escala
  obligaría a renombrar a mano cientos de usos.
- **Comprobarlo en el navegador** (la sonda de la simulación) → lento y fuera de `verify`; el gate estático
  compara referencias del código con nombres declarados en las capas.

**Consecuencias** · Probado con copias del export y de las capas (`SC_KIT_EXPORT`, `SC_LAYERS_DIR`): los
34 pasos ×16/14 con el nombre por clave → verde y `--sc-scale-0-375` pasa a valer 6px; lo mismo con el
nombre por valor (el fallo de antes) → rojo, 49 referencias colgadas; y quitar `scale/0-375` del export →
rojo. Con el export real, `tokens:import` no cambia ninguna capa. Tests de `token-naming` 6/6. No decide
la densidad ni cambia la escala: eso lo lleva otra sesión.

---

## DD-88 · 2026-09-14 — El equipo externo recibe dos zips publicados solos: el tema de nuestras apps y el export del plugin, comprobados

**Contexto** · Hasta hoy el equipo externo recibía el zip del plugin de Figma (el preset que monta el
Theme Designer), descargado y enviado a mano, con tres comprobaciones a mano que `conexion-variables.md`
describía y ningún script hacía. Medido (H3): con el mismo Kit, ese preset y el de nuestras apps difieren
en el 43 % de las claves (pesos con «px», esquema anterior a Aura 3, rem pensados para raíz 14, 714
claves que Aura 3 lee y el plugin no define). Criterio de Rafa: el equipo externo sigue
nuestro tema, no al revés.

**Decisión** · (1) `scripts/tema-zip.mjs` empaqueta el tema de NUESTRAS apps: el preset (`sc-preset`, con
Aura dentro) en un solo `sc-preset.mjs`, las 6 capas de tokens, las clases de tipografía, una guía de
instalación en llano y un manifiesto. (2) Hace las tres comprobaciones de la rutina: ningún token que
tenía valor pasa a 0 (sale con error), raíz 16 declarada, y diferencia con el zip anterior (variables,
semántica común y componentes). (3) `tema-zip.yml` lo genera en cada cambio del tema en `main` y, si algo
cambió, lo publica en la rama `tema-zip` (enlace fijo al zip y a su guía). (4) **Y el export del plugin
también**, porque la licencia comercial es suya (Rafa: entregarlo le evita fricciones políticas con el otro equipo): cuando un push
del plugin trae `.theme-designer/`, el robot de tokens lo empaqueta tal cual (`ts/` y `js/`) con
`scripts/tema-plugin-zip.mjs`, lo comprueba (token a 0, raíz para la que está pensado, pesos con «px»,
diferencia con el anterior) y mide cuánto se aparta de nuestras apps, y lo publica en la misma rama como
`tema-plugin.zip` con `LEEME-plugin.md`. El equipo externo elige; la guía de cada zip dice en qué se
diferencian.

**Razón** · Medido en local: el preset empaquetado genera el mismo CSS que el del código en los 97
componentes, y un valor tocado en el paquete lo caza (sale `button`). La diferencia entre `main` y la
tanda de DD-87 sale exacta: 0 variables, semántica común distinta y `menu`, `skeleton` y `toast`. Un token
puesto a 0 respecto al anterior pone el script en rojo nombrándolo. La publicación se probó en un repo
desechable en tres pasadas: crea la rama, se salta la pasada sin cambios, añade la siguiente. Export del
plugin del 11-09 contra el tema de hoy: 620 de 2.003 variables comparables distintas (31 %), 284 de ellas
solo por la raíz 14; 4 pesos con «px». Control: nuestro tema pasado como si fuera el del plugin da 0 de
3.160. El comparador leyó de más tres veces antes de ese control (rampas primitivas contadas, `light-dark()`
sin elegir tema, formatos de color): cada arreglo está comentado en el script.

**Descartadas** ·
- **Solo el zip del plugin** → no es lo que pintan nuestras apps (31 % distinto) y había que prepararlo a mano.
- **Solo nuestro tema** (propuesta inicial de Claude) → la licencia contratada es la del plugin; Rafa prefiere
  entregar también su export.
- **Publicarlo como versión de GitHub** → publicar una versión dispara `publish-packages.yml` (sube los
  paquetes del DS) y quitaría a v1.0.0 la marca de «última».
- **Un preset con los valores resueltos, sin CSS de tokens** → habría que partir cada clave por tema a
  mano; con los tokens, el zip es exactamente lo que usan nuestras apps.

**Consecuencias** · El paso a mano del zip desaparece: el enlace no cambia y siempre sirve la última
versión. El equipo externo tiene que cambiar cómo instala el tema (guía en el zip); el mensaje lo envía
Rafa. Pendiente de medir: que el preset empaquetado funcione en su PrimeNG 21 (el nuestro es 22); su
paquete de estilos pide login desde el 2026-09-14.

**Corrección (2026-09-14, mismo día)** · La comprobación 3 leía de menos: comparaba variables, semántica
común y el CSS de variables de cada componente, pero no las reglas CSS del preset (`css.ts`, el campo
`style` de `@primeuix/styled`). DD-91 cambió esas reglas, el zip dijo «no cambia» y no se publicó. Ahora
se publica si cambia cualquiera de los tres ficheros del tema (el build es determinista: dos builds del
mismo árbol dan los mismos bytes), y la guía añade las reglas CSS al desglose. Medido: contra el zip
publicado sale `sc-preset.mjs` y «reglas CSS distintas»; contra sí mismo, nada. Los dos tests nuevos se
ponen rojos con la comprobación vieja.

---

## DD-87 · 2026-09-14 — Lo que es marca, la densidad y cada divergencia con Aura que se queda: una sola página vigente

**Contexto** · Encargo de Rafa (2026-09-13): Aura más el color de marca, con el export de Figma en un clic.
Medido con `tools/aura-diff.mjs` en los 33 componentes de PrimeNG que usan el DS, el Supervisor y
sc-docs: 724 diferencias (clave × tema) entre nuestro código y Aura 3.0.0 en `main` del 2026-09-14. Las
razones estaban repartidas en DD-3, DD-40, DD-41, DD-79, DD-81, `customs-catalog.md` y `color-map.mjs`,
y algunas se contradecían o habían caducado (el aviso «ámbar» de DD-3, el hover a blue/500 de las notas
de marca). Rafa pidió criterio experto sobre cada una, sin apego a lo decidido antes, y una sola referencia
que no se contradiga.

**Decisión** · (1) **Marca** = azul marino como primario claro (`blue/700`, `#1B273D`, hover 600, active
800), `sky` como azul eléctrico (info, enlaces, foco y primario oscuro, DD-81) y **el gris de marca**
(`slate` del Kit) para la superficie en claro; en oscuro, `zinc` (DD-79). Tipografía propia (Inter y los
12 estilos, DD-67). (2) **Densidad**: la de DD-81, medidas de Aura enlazadas por nombre a la escala a 14
px por rem; campo y botón a 32,5 px con el interlineado de la rampa atado en Figma (DD-91; al escribir
esto eran 29,5). Se mantiene `typography.lineHeight: 'inherit'`. (3) **Divergencias
que se quedan**, cada una con su motivo: foco `sky` a 2 px; aviso en amarillo; botón rojo un paso más
oscuro; grises de texto e icono subidos un paso por AA; info de toast y message en `sky`; icono atenuado
del oscuro en zinc-400; la selección y el foco de opción del multiselect como PrimeOne. (4) **Vuelven a
Aura** (quitando lo nuestro de `sc-preset`): borde y hover de borde de campo, relleno de campo en oscuro,
borde de error, hover de texto y de contenido, velo de los diálogos, anillo «solid» de grosor 0 del campo,
transiciones de menú y toast y el esqueleto de carga. (5) Las medidas que PrimeOne dibujó con el Aura de 2024 y
Aura ya cambió (123 filas, 73 claves) se alinean EN FIGMA, por nombre de escala como en DD-81: con el cableado de DD-85
y DD-86 ya en `main`, el cambio llega al código por el robot.

**Razón** · (1) Gris de marca, medido en OKLCH contra el original PrimeOne 4.0.0 (`bJ01Ym4NrCvxFm7dJXvhqp`):
el `slate` de Tailwind tiene el mismo tono que el marino (257° contra 262°) y la misma croma (0,041 contra
0,044), y su 900 casi no se distingue del primario; el gris de marca conserva el tono con la mitad de
croma (0,02) y el marino destaca. Es lo que decía la nota de marca de Rafa. Pasarse al de Tailwind solo
quitaba 31 diferencias, que el Kit ya resuelve solo. (2) Medido el 2026-09-14 en build estático:
primeng.dev 35 px (relleno 6/10, interlineado 21), `main` 29,5, y con el interlineado de Aura 33,5. No
existe variable de 21 px en el Kit (18, 20, 24…) y la app ya es más compacta que primeng.dev, que es lo
que Rafa busca. Una letra de 14 px es lo normal en interfaces densas; los componentes de primeng.dev
también la usan. *Corregido el 2026-09-14 (DD-91): Rafa eligió ese mismo día subir el interlineado de los
controles con la rampa que sí existe (20 y 18): 32,5 y 27, sin perder filas y sin tocar la escala.* (3) Foco: la barra lateral del Supervisor es exactamente `#1B273D` y el foco del teclado
cae en ella (medido: tres tabuladores, anillo sky de 2 px); un anillo en el primario sería invisible ahí.
2 px por WCAG 2.4.13. Aviso: medido en primeng.dev, el botón de aviso de Aura (blanco sobre naranja 500)
da 2,80:1, y el amarillo se distingue mejor del rojo de error (45° contra 25°). Botón rojo: Aura 3,76:1,
el nuestro 4,83:1. Icono oscuro: con el zinc-500 de Aura quedaría a 3,08:1 sobre el hover, y el token
lo usa toda la app. Multiselect: el PrimeOne original ya trae la selección tintada (herencia de PrimeTek);
tocar Figma por esto nos alejaría de su kit. (4) Sin motivo escrito, y el Kit ya dice lo mismo que Aura
o no lo define. Red: todas las claves resueltas de los 33 componentes, antes y después, en claro y oscuro:
cambian 96, todas de estos grupos, y las diferencias bajan de 724 a 630; contraste y foco del Supervisor
60/60. De las 630: 236 son medidas de Aura a densidad 14 (decisión), 123 son medidas de PrimeOne que
Aura ya cambió (punto 5), 10 son radios en % que Figma no admite y el resto tienen motivo aquí.

**Descartadas** ·
- **Gris `slate` de Tailwind en claro** (recomendación inicial de Claude) → compite con el marino, medido.
- **Foco en el color primario** (recomendación intermedia de Claude, por contraste sobre blanco) → invisible
  sobre la barra lateral marina; no se había medido la superficie donde cae el foco.
- **Densidad a 35 px, igual que primeng.dev** (recomendación de Claude medida antes de que DD-81 entrara)
  → pide llevar la escala a 16 o una variable de interlineado que no existe, y agranda la app. La
  simulación a 16 queda como experimento local aparte (hand-off).
- **Aviso en el naranja de Aura** → no pasa AA en el botón.
- **Reescribir las decisiones antiguas** → se pierde el porqué de cada momento; se anota «sustituida en
  esto por DD-87» en las que se contradicen.

**Consecuencias** · Las diferencias con Aura que quedan tienen todas motivo escrito aquí o en DD-81:
medidas de densidad 14, foco, aviso, rojo, grises AA, info, primario oscuro, tipografía, icono oscuro,
multiselect e interlineado heredado. Si PrimeTek publica un kit nuevo, esta página es la lista de lo que
se reaplica; las familias de color se reaplican solas desde el export (DD-83).

> **Sustituida en parte por DD-97** (2026-09-14): las medidas del punto 5 siguen a Aura primero en código
> (`PENDIENTE_FIGMA`) y Figma se alinea después con `docs/figma-pendiente.md` §4.
>
> **Sustituida en parte por DD-91** (2026-09-14): campo y botón md ya no miden 29,5 sino 32,5 (sm 27,
> lg 40), con el interlineado de la rampa atado en Figma. La escala a 14 de DD-81 no cambia.

---

## DD-86 · 2026-09-14 — El resto de medidas de los temas sigue a Figma, sin mover un píxel

**Contexto** · Tras DD-85 quedaban 238 medidas escritas a mano con un paso de escala en los temas: 184
sueltas con equivalente en el Kit, 42 rellenos compuestos, 10 tamaños de letra y 2 sin equivalente. Medido
el valor: de las 184 sueltas, 180 valen ya lo mismo que el Kit, y los 42 compuestos también.

**Decisión** · Pasan al mapa de medidas (`scripts/sizing-map.mjs`, de 110 a 407 filas), con el mismo método
de DD-85, todas las que ya valen lo mismo que el Kit: las 180 sueltas (50 temas) y, en una segunda tanda,
42 compuestos (un token por lado, como ya hacían las pestañas: `padding: var(--…-y) var(--…-x)`) y 7
tamaños de letra. Fuera: el hueco del cuerpo de la tarjeta (hoy 7, el Kit dice 10,5), que sí cambiaría en
pantalla, 3 tamaños de letra cuyo alias del Kit no se pudo confirmar al comparar, y 2 sin equivalente.

**Razón** · Con el número escrito, un cambio en Figma no llega a la app y nadie lo avisa (la casilla de
DD-85 se quedó en 17,5 después de cambiarla en Figma). Conectadas, `tokens:parity` compara cada una con el
export y se pone rojo si se separan.

**Descartadas** ·
- **Meter también las que cambian de valor** → mezclaría una conexión sin efecto visible con cambios de
  diseño; el hueco de la tarjeta necesita mirarlo.

**Consecuencias** · Sin cambio visual, comprobado dos veces (tras cada tanda): las 55 capturas de
componentes, `component-styles` y `component-structure` pasan con sus referencias de antes, sin
regenerar. `tokens:parity` 407/407 y 519 tests unitarios. En los temas de componente quedan 9 medidas con paso
de escala escritas a mano (de 238): el hueco de la tarjeta, 3 tamaños de letra, 3 rellenos que en el Kit
son compuestos, el tamaño del badge del botón y la sangría del stepper. Fuera de este mapa siguen 9 en los
tokens semánticos de `base.ts` (listas, navegación, overlays) y 5 en `extend.ts`.

---

## DD-85 · 2026-09-14 — Las medidas que los temas escribían a mano salen del export: un cambio de Figma llega solo al código

**Contexto** · Tras DD-81, Rafa pidió que todo caiga en cascada. Medido con `tools/aura-diff.mjs` en los 15
componentes del Supervisor: de 209 medidas que el Kit define, 153 ya llegaban del export y 56 no. De esas,
26 son la tabla, que sigue a Aura a propósito; el resto estaban escritas a mano en el tema con el paso de
escala de antes (`var(--sc-scale-1-25)` en la casilla, el chip, los avisos, el toast, el calendario, el
diálogo, la etiqueta y los desplegables). Figma ya tenía los valores de DD-81 y el código no los leía. Y
`sc-checkbox` es un `input` nativo con su propio CSS: tampoco leía el tema.

**Decisión** · 57 filas nuevas en `scripts/sizing-map.mjs` (de 53 a 110), una por medida suelta con paso
de escala en `select`, `multiselect`, `datepicker`, `checkbox`, `dialog`, `tag`, `chip`, `message` y
`toast`. El generador escribe su `--sc-cmp-*` y el tema lo lee; `sc-checkbox.component.scss` pasa su caja
y su ✓ (tres tallas) a esos mismos tokens. La correspondencia tema ↔ export se sacó con un script que
recorre el preset y casa cada ruta con su clave del Kit, y la edición se hizo por ruta en el árbol del
fichero, no buscando texto.

**Razón** · Es lo que ya hacían botón y campos desde el principio: una fila del mapa, un token generado y
`tokens:parity` vigilando que el tema lo lea. Con el paso escrito a mano, cambiar la variable en Figma no
movía nada en la app, y nadie lo cantaba.

**Descartadas** ·
- **Ampliar el generador a todos los temas** (309 pasos a mano en total) → este PR cubre los 14
  componentes del Supervisor; el resto va igual cuando toque.
- **Los 13 rellenos compuestos** (`padding: a b`) y los 2 tamaños de letra que usaban un paso de escala →
  fuera: el mapa necesita una fila por lado o su propio tratamiento. Se quedan escritos a mano.
- **La tabla** → sigue a Aura a propósito, no al Kit.

**Consecuencias** · Cambian en pantalla los valores que ya decidió DD-81: casilla 17,5 → 15,75 (✓ 10,5),
chip 10,5/7 → 8,75/5,25, botón de cerrar de avisos y toast 24,5 → 21, desplegables 35 → 31,5, y huecos del
diálogo, el calendario y la etiqueta. `tokens:parity` 110/110; 519 tests unitarios; 18 capturas de
referencia regeneradas y 2 cajas en `component-styles` (el chip). La prueba del chip pasa a leer el
export (`kitPx`), como las demás desde DD-82. Medido en el navegador: casilla 15,75, chip 8,75/5,25, cerrar
del aviso 21, desplegable 31,5. La casilla a 15,75 queda por debajo de 24 como objetivo táctil: cuenta la
etiqueta, que también la marca.

---

## DD-84 · 2026-09-14 — El PR del robot de tokens enseña capturas de antes y después del Supervisor

**Contexto** · Para que Rafa pueda revisar y fundir con un clic hacía falta ver el cambio sin montar nada. El
PR del robot ya decía qué tokens cambian (DD-82), pero no cómo se ve, y los píxeles no cruzan de
máquina: una captura del Mac no se puede comparar con una del runner.

**Decisión** · (1) El robot construye el Supervisor de `main` ANTES de aplicar el export y otra vez
después, en el mismo runner, y fotografía 8 pantallas en claro y oscuro a 1440
(`e2e/tokens-sync/capturas.capture.ts`, config propia `playwright.capturas.config.ts`, fuera de la
suite). (2) `scripts/tokens-sync-capturas.mjs` compara cada pareja con `pixelmatch` y escribe «Cómo se
ve» en la portada: solo las pantallas que cambian, con el porcentaje. (3) Las imágenes de las que
cambian se publican en la rama `tokens-sync-capturas`, una carpeta por run, con `[skip ci]` para que
Cloudflare no la construya. (4) Las capturas informan: nunca ponen rojo.

**Razón** · Validado en las dos direcciones con estímulos reales, en el mismo navegador: producción
contra el preview de `design-tokens-sync` (el export de DD-81) cambia 14 de 16 pantallas, y el diff de
Usuarios enseña el buscador, el botón y las filas desplazados unos píxeles, que es el cambio de
medidas. Producción contra sí misma salió con 1 pantalla y 31 píxeles distintos: el reloj de «Última
búsqueda» de Conversaciones había avanzado un minuto. Con la hora congelada (`page.clock`), 0 de 16.
La publicación se probó contra un repo desechable: la primera pasada crea la rama, la segunda añade
su carpeta, `main` no se toca.

**Descartadas** ·
- **Subir las capturas como artifact del run** → no se ven dentro del PR; hay que descargar un zip.
- **Guardarlas en la propia rama `design-tokens-sync`** → acabarían en `main` al fundir.
- **Comparar contra baselines guardadas** → las `*-darwin.png` no corren en Linux; antes y después en
  el mismo runner no necesita baselines.

**Consecuencias** · El robot tarda unos minutos más (construye el DS y el Supervisor una vez más). La
rama `tokens-sync-capturas` crece con cada export que cambia pantallas: podarla si pesa. Las 8
pantallas son una muestra; si un cambio vive en otra, no sale en las capturas (sí en «Qué cambia»).
**Corrección (2026-09-14, mismo día)** · El primer comparador leía de menos: `pixelmatch` descarta por
defecto los píxeles de antialias, y el texto está hecho casi solo de ellos. Un gris de texto que pasaba
de `#4f5663` a `#334155` salía «0,1 % de la pantalla». Ahora compara con `includeAA: true` y umbral 0,05:
el control antes-contra-antes sigue en 0 de 16, y el test nuevo se pone rojo con el comparador viejo.

---

## DD-83 · 2026-09-14 — Las familias de color del Kit salen del export: un color cambiado en Figma llega solo al código

**Contexto** · Probando el robot de tokens (DD-82) con un cambio de color de marca real (`sky.500` de
`#1464fe` a `#2a74ff` en el export), `tokens:import` no tocó `--sc-color-sky-500` y `tokens:parity` §7
salió rojo con «DESFASE MUDO». Causa medida: 12 familias de color del Kit (blue, sky, slate, cyan, green,
amber, red, orange, purple, violet, teal y emerald) vivían copiadas a mano en
`01-primitive.css`, fuera de la zona `@sc-gen:palette`, que solo escribía `yellow` y `zinc`. Cada color
tocado en Figma pedía editar el CSS a mano antes de fundir.

**Decisión** · (1) El generador escribe en `@sc-gen:palette` todas las familias de
`scripts/palette-map.mjs` que el Kit trae, además de las que ya importaba por referencia. (2) En la
parte a mano de `01-primitive.css` quedan solo `slate-0` (el blanco, sin paso 0 en el Kit) y `azure`
(sin familia en el Kit). (3) Se retira la divergencia `green.950` de marca (`#0a2916`, «un punto más
oscuro»): pasa al valor del Kit y de Aura, `#052e16`.

**Razón** · (1)(2) Con las familias generadas, el mismo estímulo (`sky.500` cambiado) regenera
`--sc-color-sky-500: #2a74ff` y `tokens:parity` sale «PARIDAD OK». (3) Rafa pidió valorar cada
divergencia con criterio, sin heredarlas: la de `green-950` no tenía función medible (texto de éxito en
oscuro de 8,98:1 a 8,55:1 sobre green-400, muy por encima de AA) y era la única primitiva que se
apartaba del Kit. Red: todas las variables `--sc-*` resueltas antes y después, en claro y oscuro: de
1.014, solo cambia `--sc-color-green-950`.

**Descartadas** ·
- **Generar las 22 familias del Kit** → metería rampas que nada usa; se generan las del mapa y las que
  un color referencia, como hasta ahora.
- **Mantener las copias a mano y avisar mejor del desfase** → el aviso ya existía (§7) y era rojo: el
  problema era tener que ir a mano.
- **Quitar ya las exclusiones de `cmp-color-map.mjs` para el éxito oscuro** → cambiaría dos cosas a la
  vez; con el mismo valor ya no hace falta excluirlas, se pueden borrar en otra tanda.

**Consecuencias** · Un cambio de color de familia en Figma fluye sin tocar código. `azure` sigue siendo
huérfana del Kit (revisar si es familia legítima). Los comentarios que explicaban cada familia a mano se
van con ellas; el porqué de las de marca vive en `customs-catalog.md` §1.

---

## DD-82 · 2026-09-14 — El robot de tokens no se pone rojo por lo que Figma cambia a propósito, y dice en llano qué cambia y por qué cae

**Contexto** · Rafa quiere que el paso de Figma a producción sea revisar y fundir con un clic, y preguntó
si un Kit que se aparte de Aura dejaría al robot en rojo para siempre. Medido en la historia de
`tokens-sync`: 28 de 44 pasadas rojas, 11 pasos a mano con el robot en verde y 15 en rojo. El PR #144
(export de DD-81, 2026-09-13) dio 14 rojos: 11 eran tests con la medida del Kit escrita a mano
(«10.5px», «17.5px», «35×21»), 2 las referencias de estructura y estilos, y 1 un contraste.

**Decisión** · (1) Los tests de métrica leen la medida esperada del export (`e2e/kit-metrics.ts`, la
misma fila de `sizing-map.mjs` que usan el generador y `tokens:parity`). (2) Si lo único que cae son
las referencias de estructura y estilos, el robot las regenera, repite la smoke y las sube en su
commit. (3) Un token del Kit que tenía medida y pasa a 0 pone rojo al robot (`--ceros`), salvo que
esté apuntado en `CEROS_A_PROPOSITO`. (4) La portada del PR la escribe el robot: veredicto con quién se
mueve (`scripts/tokens-sync-rojo.mjs`), qué tokens cambian y quién los lee
(`scripts/tokens-sync-cambios.mjs`) y enlaces al preview de la rama. (5) El commit verificado lleva el
check `tokens-sync`. Apartarse de Aura no es rojo: es información.

**Razón** · (1) Con el número escrito, cada edición deliberada en Figma pedía tocar tests antes de
fundir; leído del export, el test sigue preguntando lo que importa (¿el componente pinta lo que dice
el Kit?). Medido en tres casos sobre el build estático de sc-docs: `main` 26/26 verde; export de
DD-81 26/26 verde (el robot dio 11 rojos); tema roto a propósito (relleno del botón y del campo a
literal) 9 rojos, en esas piezas. (3) Medido: `tokens:import` NO normaliza el 0
(`button.padding.x = 0` sale `--sc-cmp-button-padding-x: 0`) y, con (1), el test leería el 0 y pasaría.
(5) Los pushes del robot con `GITHUB_TOKEN` no disparan workflows: el PR no enseñaba ningún check suyo
y había que comparar SHA a mano.

**Descartadas** ·
- **Poner rojo si el Kit se aparta de Aura** → castiga justo lo que el robot existe para dejar pasar
  (una decisión de diseño); la distancia a Aura se informa y se vigila con su trinquete.
- **Regenerar siempre las referencias** → taparía un fallo real; solo se hace si no cae nada más.
- **Atribuir el contraste a Figma** (primera versión) → en #144 lo causaba el código de DD-81 que aún
  no estaba en `main`: la frase dice que puede venir de los dos lados.
- **Importar `scripts/paths.mjs` en el test** → usa `import.meta` y Playwright carga los helpers como
  CommonJS; la ruta se lee igual que allí. Y `dtcg-export.mjs` y `sizing-map.mjs` llevan JSDoc porque
  `tsconfig.harness.json` los revisa al importarlos (su propia regla).

**Consecuencias** · Quedan por hacer, en este orden: las familias de color de marca escritas a mano en
`01-primitive.css` (un cambio de color en Figma hoy sale «desfase mudo» y rojo, medido con `sky.500`),
las capturas de antes y después en el PR, y el zip del equipo externo comprobado por el robot. La
prueba de verdad es el siguiente export real desde Figma: el workflow no se puede correr fuera de
GitHub. El PR #145 (DD-81) cambia las mismas líneas de test a mano: al fundir, vale la versión que lee
del export.

---

## DD-81 · 2026-09-13 — Figma y código siguen a Aura: primario oscuro en `sky`, texto deshabilitado legible y medidas enlazadas por nombre a la escala

**Contexto** · Rafa vio que el «Guardar» deshabilitado de la barra no se leía en oscuro (2,73:1) y pidió
contrastar sus sesgos y los de Claude con `better-ui`, con la regla de DD-78: en lo que dude, manda
Aura y Figma se alinea. Medido con `tools/aura-diff.mjs` (PR #142) y en el Supervisor:
(1) Aura pinta el primario oscuro CLARO con texto oscuro, porque ese mismo color es también texto
(botón de texto, contornos, cursor) sobre el fondo oscuro. El Kit copió sus pasos (400, 300, 200) pero
no su claridad: el esmeralda-400 de Aura es L77 y nuestro azul 400, L52. (2) Los botones deshabilitados
no tienen color propio en Aura: son el mismo botón al 60 %. (3) El texto de los campos deshabilitados
se pintaba a 1,21:1 en claro y 1,35:1 en oscuro. (4) En oscuro los seleccionados, el hover de los
botones de texto y contorno y la etiqueta primaria salían VERDES: restos del esmeralda de Aura en crudo
en el Kit y en `base.ts`. (5) Las medidas del Kit vienen de PrimeOne 4.0.0, dibujado sobre Aura 4.0 de
2024 a 14px por rem (relleno de campo 0,5rem → 7). Aura ha cambiado desde entonces (0,375rem = 6).
(6) Aura no tiene escala de espaciado; la del Kit es la de PrimeOne (34 pasos, idénticos, ninguno
nuestro) y cada paso se llama como un rem de Aura: `scale/0-375` es 0,375rem, dibujado a 14px por rem.

**Decisión** · Todo con variables que ya existían, primero en Figma y después por el export:
(1) Primario oscuro con el patrón de Aura en `sky`: base sky-300, hover sky-200, pulsado sky-100, texto
`surface.900` (zinc-900). Los pasos se eligen por claridad (esmeralda N ≈ sky N−100), también en la
etiqueta primaria (sky-200), el borde del botón de contorno (sky-600) y el de la celda seleccionada
(sky-700). Las filas oscuras de `primary.*` pasan a `enforce` y el generador las escribe. (2) El
esmeralda en crudo pasa a sky con la misma transparencia, y `highlight` oscuro en `base.ts` cuelga de
`--sc-bg-primary`. (3) `form.field.disabled.color` a `enforce` en los dos modos: slate-500 en claro,
zinc-400 en oscuro, lo que ya decían el Kit y Aura. (4) Las 56 medidas de componente de los 15
componentes del Supervisor apuntan al paso de escala con el MISMO NOMBRE que el rem de Aura (0,375rem →
`scale/0-375`): 15 ya lo hacían, 39 cambian (Aura se compactó desde 2024) y 2 sin paso con ese nombre
se quedan (alto del interruptor 1,375rem y ancho del toast 22rem). 16 llegan a código por el export.

**Razón** · (1) E fue la única opción medida que da el resultado de Aura sin bajar contraste en ningún
sitio: base 8,24, deshabilitado 3,77, como texto sobre zinc-900 8,24. `sky` tiene el mismo tono que el
azul marino (257° contra 262°) con más croma, así que no cambia la marca. (3) 2,20 y 4,07, con APCA Lc
37 y 42 (el mínimo para lo deshabilitado es Lc 30); slate-500 sigue un paso por debajo de `secondary`.
(4) Es la regla de Rafa (variables que ya existen) y la traducción que usa el propio Figma de PrimeTek:
cuando Aura cambie una medida, su rem dice qué paso usar. Guarda las proporciones de Aura a nuestro
tamaño (todo ×14/16, como siempre). Corregido el 2026-09-14 (DD-85): primeng.dev no mide 31 sino 35,
porque su interlineado es 21 y el nuestro «normal» (≈17); con este relleno el campo queda en 29,5.

**Descartadas** ·
- **C · el Kit tal cual, azul 400 con texto blanco** (lo que Claude recomendó primero) → el botón de
  texto «Ver detalle» queda a 3,15:1. Claude solo había mirado el botón relleno.
- **D · Aura con nuestro azul marino (azul 200)** → misma claridad que Aura pero una quinta parte de su
  color (croma 0,031 contra 0,153): el interruptor encendido parece apagado.
- **El número exacto de Aura suelto dentro de la variable** (lo que Claude escribió primero en Figma, 53
  de 56 sin paso de escala) → rompe la regla de variables existentes. Claude tomó como cambio de criterio
  una suposición en voz alta de Rafa sobre Aura, no una instrucción, sin confirmarlo.
- **El paso más cercano en píxeles** → deforma proporciones: el hueco del botón (Aura 0,5rem, ya en
  `scale/0-5`) habría pasado a `scale/0-625`.
- **Llevar la escala a 16px por rem** → agranda un 14 % todo lo que la usa y hoy rompe en silencio
  (`scaleSuffix` nombra por valor/14). Apuntado como experimento en local en el hand-off.
- **Dejar el texto deshabilitado más tenue a propósito** (la razón que tenía la fila de claro) → a 1,21:1
  no parece deshabilitado, parece vacío. WCAG 1.4.3 lo exime, pero tiene que leerse.

**Consecuencias** · Figma se escribió antes que el código, desde listas únicas
(`~/Documents/Claude/2026-09 aura/plan-figma-aura.json` para color y `…-por-nombre.json` para medidas),
con versión guardada antes de cada tanda, comprobadas contra el estado de Figma antes de escribir y
releídas una a una después. El export de color salió idéntico al del plugin (#144); el de medidas
tiene que salir idéntico en el siguiente export. Tres piezas del tema apuntaban a pasos del azul marino en oscuro y no al
componente del Kit, y el e2e `severities-contrast` lo cazó en la etiqueta: `tag.ts`, `button.ts`
(borde del contorno) y `treetable.ts` pasan a sus `--sc-cmp-*`, y su excepción del tag primario oscuro
se borra porque ya no hace falta (10/10 sin ella). `theme-contrast` del Supervisor: 53/53. Pendiente:
`datatable` no tiene fichero de tema (manda Aura), así que su borde de celda seleccionada en oscuro
sigue en azul marino 900. Campos y botones a 29,5 de alto (antes 33), pequeños a 24 (el mínimo de WCAG
2.5.8, sin margen), casilla de Figma a 15,75 (en código sigue a 17,5: el generador no lee casilla). En oscuro, primario, enlaces, foco y avisos informativos comparten la familia `sky`: vigilar que
un aviso no se lea como un botón. `--sc-text-disabled` tiene 23 usos, no solo campos: en oscuro coincide
con `secondary` (lo mismo que hace Aura). Sin tocar: `--sc-icon-disabled` sigue en slate-300.

---

## DD-80 · 2026-09-13 — La cabecera fija de una tabla la pide `stickyHeader` y la pinta el tema, y una etiqueta es siempre una línea

**Contexto** · La cabecera de Conversaciones llevaba `position: sticky` desde S37 y **nunca fijó**: tras
600px de scroll acababa en -284. Rafa lo midió: el que hace scroll es `main.app-shell__content`, pero
`.table-card` (`overflow: hidden`) y `.p-datatable-table-container` (`overflow: auto`) crean su propio
contenedor de scroll. Y a 1280 las etiquetas largas no cabían en sus columnas.

**Decisión** · (1) `sc-datatable` estrena `stickyHeader`: cabecera fija al scroll de la PÁGINA. La pinta
el tema (`sc-preset/css.ts`, `stickyHeaderCss`) con el mecanismo que PrimeNG usa en `scrollable`: el
`<thead>` fijo con `inset-block-start: 0` y `z-index: var(--sc-z-sticky)`, más `overflow: visible
!important` e `isolation: isolate` en el contenedor. Si llega con `scrollable`, manda `scrollable`.
(2) `.table-card` pasa de `overflow: hidden` a `clip`. (3) Conversaciones activa `stickyHeader` y borra su
`sticky` a mano. (4) Una etiqueta es una línea: el tema pone `.p-tag` a `max-width: 100%` y recorta su
texto con puntos suspensivos (`label` igual); `sc-tag` repone el valor en `title` al pasar el ratón, solo
si está recortada. (5) La columna ID pasa de 119 a 133.

**Razón** · (1) Medido inyectando antes de escribir: arreglar solo la tarjeta deja -284, las dos juntas
dan 91 (el borde de `main`). `p-table` pone `overflow: auto` EN LÍNEA a su contenedor, siempre, y solo un
`!important` le gana. Arreglados los dos apareció una tercera causa: el `<thead>` fijo crea contexto de
apilamiento y las celdas de la tabla-lista van con `position: relative`, así que las filas pintaban
ENCIMA de la cabecera. `isolation` encierra el `z-index` en la tabla: gana a la casilla de PrimeNG
(`z-index: 1`) sin competir con menús ni diálogos. (2) `clip` recorta las esquinas igual y no crea
contenedor de scroll. (4) A 1280 las diez columnas piden 1203px y hay 1153: 31 de 68 etiquetas se partían
en dos líneas. El maestro del Kit (❖ Tag, `373:13337`) es una línea de 21.5. (5) `GDPR-MR-EXP` mide 100 +
28 de relleno: con 119 el ID se salía a cualquier ancho.

**Descartadas** ·
- **`scrollable` + `scrollHeight="flex"`, la receta de PrimeNG** → la tabla haría scroll dentro de sí
  misma, con su propia barra, y las otras 25 listas desplazan la página entera.
- **Pegar la cabecera fija a la gramática de `variant="list"`** → Agentes y Grupos ya fijan su barra de
  acciones a `top: 0`; las dos se pisarían. Es opcional.
- **`sticky` en el `th` (lo que había)** → funciona igual, pero duplica lo que PrimeNG ya pone en el
  `<thead>` en línea, y el `z-index` en cada `th` no escapaba del contexto del `<thead>`.
- **Ancho fijo a Servicio y Grupo para que no recorten a 1280** → a 1024, el mínimo soportado (DD-53),
  las columnas fijas sumarían más que la tabla y se saldría de su caja. Rafa vio en local la solución elegida,
  con esta alternativa sobre la mesa, y se quedó con la elegida.
- **`title` siempre en la etiqueta** → un tooltip que repite lo que ya se lee en las 104 que caben.

**Consecuencias** · `e2e/supervisor/conversations-sticky-header.spec.ts` se vio rojo con cada una de las
seis causas puestas por separado en el código real (sin `stickyHeader`, tarjeta `hidden`, sin `z-index`,
sin la etiqueta de una línea, sin el `title`, ID a 119). Geometría de las 18 listas con tabla idéntica con
`hidden` y con `clip`; etiquetas de 22 rutas a 1440 y 1280 idénticas salvo Conversaciones. Se mantiene al
cambiar a oscuro en caliente (medido). **Condición de uso**: una tabla con `stickyHeader` no hace scroll
horizontal dentro de sí (desborda hacia la página), y ningún antepasado hasta el que hace scroll puede
llevar `overflow: hidden` o `auto`. Sin verificar en Safari ni Firefox. A 1280 el texto libre de Origen y
Destino baja a dos líneas.

---

## DD-79 · 2026-09-13 — Los neutros del modo oscuro pasan a zinc, lo que dicen Aura y el Kit

**Contexto** · Una comparación clave a clave de los 15 componentes del Supervisor contra Aura,
PrimeOne y el export del Kit (CSS de variables de `@primeuix/styled`, resuelto en claro y oscuro). De las 323 diferencias entre nuestro código y el Kit sin motivo
escrito, **262 eran del modo oscuro** y salían de una sola divergencia: la superficie y los neutros
en gris de marca (navy), declarada en `color-map.mjs` como «paleta de marca SC», mientras Aura y el
Kit usan zinc. Rafa lo miró lado a lado en local y preguntó qué opinaría un experto en UI,
accesibilidad y escalabilidad.

**Decisión** · En oscuro, superficie y neutros en **zinc**. Los tokens con papel en el Kit
(`bg-surface`, `bg-default`, `border-default`, `border-strong`, `bg-disabled`, `bg-secondary-hover`,
`text-primary`, `text-secondary`) los escribe el generador desde el export (18 filas `dark` nuevas en
`color-map.mjs` y la rampa `surface.*`); el resto de `07-dark.css` pasa a zinc a mano, siguiendo a su
gemelo generado. `text-subtle` queda en **zinc-400, igual que `text-secondary`**. El primario oscuro y
su texto siguen divergiendo (DD-40). Todo con variables que ya existían.

**Razón** · (1) Escalabilidad: es lo que traen Aura y el Kit, así que nuestro código deja de
sobrescribir 262 valores y las subidas de Aura entran sin reasignar. (2) El gris de marca tenía casi
el tono del primario (oklch 262° contra 257°), y el acento dejaba de destacar como lo interactivo; el
zinc es neutro (croma 0,006). (3) Claro en gris de marca y oscuro en zinc es el patrón de fábrica de
Aura. (4) Contraste medido: los 22 pares críticos de `tokens:parity` pasan AA, los textos de color
suben (enlace 5,36 → 5,62) y el primario sobre la superficie pasa de 5,05 a 5,29.

**Descartadas** ·
- **Mantener el gris de marca y llevarlo al Kit** (lo que Claude recomendó primero) → deja 262 valores
  divergentes respecto a Aura que hay que mantener en Figma y en código a cada subida.
- **Pasar la gama slate→zinc paso por paso sin mirar el Kit** (la emulación del primer prototipo) →
  deja `text-subtle` en zinc-500, **3,67:1**, bajo AA. El Kit pone el texto atenuado en zinc-400.
- **Un paso intermedio para `text-subtle`** → entre zinc-400 (6,91) y zinc-500 (3,67) no existe
  ninguno, y la regla de Rafa es no crear variables. En oscuro sutil y secundario coinciden.

**Consecuencias** · Las diferencias sin motivo en oscuro bajan de 262 a 68, y ninguna es un gris
(quedan aviso y éxito). `e2e/severities-contrast.spec.ts` actualiza dos excepciones que ya estaban bajo
AA y MEJORAN con zinc (tag primario 3,88 → 4,10; summary de error del toast 3,83 → 3,99).
**Anillo de foco en oscuro a `sky-400`** (y su halo): con zinc, `sky-500` daba 3,61:1, pasaba justo;
`sky-400` da 5,62:1. Es divergencia de código a propósito porque el Kit no puede expresarlo sin crear
variable: `focus/ring/color` vive en «Semantic Common», que no tiene modos (verificado en el fichero).
Pendiente: los bordes de campo siguen sin llegar a 3:1 contra la superficie, y el primario oscuro
deshabilitado se pinta a 2,73:1 (ya pasaba con el gris de marca; es DD-40, no este cambio).

---

## DD-78 · 2026-09-13 — El hub de Repositorios es el `Menu` del DS, y en lo que dude el código manda Aura y Figma se alinea

**Contexto** · DD-77 dejó el hub de Repositorios como la última pieza del inventario y la justificó mal.
Criterio de Rafa: todo tiene que salir del DS, y el agente decide por su cuenta con tres principios
(consistencia, sencillez, intuitividad) aunque no haya maqueta. Y sobre las tres decisiones que le pedí: lo que diga Aura lo sigue
el código, y en Figma se revincula donde haga falta.

**Decisión** · (1) El hub pasa de una fila hecha a mano (botón, icono enmarcado, título, descripción,
flecha, hover, deshabilitado) al `Menu` de PrimeNG en línea: un grupo por categoría, filas que son
enlaces (`routerLink`), y de la página solo el contenido de cada fila por la plantilla `#item` de
primeng.dev. Fuera el marco del icono, la flecha y «Próximamente» (ninguna fila lo usaba).
(2) Categorías: el tag de Aura NO va redondeado por defecto → el código se queda así y en Figma el Tipo
de Agentes (y sus copias en las páginas Usuarios y Grupos) pasa a `Rounded=False`. (3) Aura no
transforma el texto del tag → Figma deja «ACTIVO/INACTIVO/WEBRTC» y escribe «Activo/Inactivo/WebRTC».
(4) El `danger` del DS (red-500 con blanco, 3.76:1) es el valor de Aura: se queda.

**Razón** · (1) Es exactamente lo que resuelve un Menu: título de grupo, fila con hover y foco, teclado
con flechas y Enter; el tema lo pinta y cualquier otra app lo trae igual. Medido: 11 filas, 4 grupos,
`href` reales, Enter navega, nombre accesible traducido y en inglés también. (2)(3) Aura `tag`:
`roundedBorderRadius` es una opción, no el defecto; y no hay `text-transform` en su hoja. Figma
revinculado con el bridge: 36 tags redondeados y 72 textos en las tres páginas, releídos a 0 después.

**Descartadas** ·
- **Migrar solo el icono a `sc-avatar`** → dejaba la fila a mano y bajaba el inventario a 0 en falso.
- **`command` para navegar** → con plantilla `#item` el Menu pulsa el `<li>`, que no tiene manejador:
  Enter no hacía nada. Lo que funciona es marcar el `<a>` con `data-pc-section="itemlink"`, la marca con
  la que el Menu reconoce su enlace (medido en el DOM).
- **Traducir las etiquetas en la plantilla** → el Menu pone `item.label` como `aria-label` de la fila y
  un lector de pantalla leía «repositories.horarios.title». Van traducidas en el modelo, con el idioma
  vivo.
- **Oscurecer el `danger` del DS para pasar AA** → se aparta de Aura, que es la regla que fijó Rafa.
  «Solo fallidas» sigue con el badge `contrast` porque el rojo ya lo pone el chip.

**Consecuencias** · `hand-made-pieces` queda con el inventario VACÍO. El `danger` sigue bajo AA en
botón y badge, aceptado y escrito aquí. Fuera de este cambio: la página `Contact Center` de Figma y el
marco «Editar agente» usan tags redondeados para presencia, que en código es un desplegable con punto;
no se tocaron.

---

## DD-77 · 2026-09-13 — Los estados y contadores que las pantallas se dibujaban salen del DS, y un test impide que vuelvan

**Contexto** · Tras DD-76, criterio de Rafa: en un sistema de diseño automatizable y operado por agentes,
nada se hace a mano salvo que sea estrictamente necesario. Una sonda que atribuye
cada pastilla a la plantilla que la pinta (`_ngcontent-X` → host `_nghost-X` → ¿selector del DS?)
encontró 14 familias y 140 piezas dibujadas por pantallas en 22 rutas.

**Decisión** · (1) Un ESTADO es `<sc-tag [severity]>`: Activo/Inactivo de Usuarios, Agentes, Reglas y
Categorías (`success`/`secondary`), la prioridad de Grupos (`secondary`/`info`/`warning`/`danger`) y el
estado de las listas de repositorio, cuyos `statusMap` pasan a hablar severidades (`muted` →
`secondary`). (2) El tipo de extensión y el tipo de entidad son `sc-tag` secundario; los chips de
acción de regla, `sc-tag` de solo icono con el nombre accesible en el host. (3) Un CONTADOR es
`sc-badge`: varias grabaciones (`info`) y fallidas (`contrast`). (4) Se borran `.sc-label`,
`.status-pill`, `.rules-status`, `.entity-type-chip`, `.rules-action-chip` y el tipo de extensión.
(5) Nace `e2e/supervisor/hand-made-pieces.spec.ts`: congela el inventario por clase y se pone rojo
si una cifra sube, aparece una clase o baja sin actualizarse. Queda una: el icono de las filas del hub
de Repositorios, que es solo lo que la sonda ve de una fila de navegación hecha a mano entera.

**Razón** · Figma (`Supervisor` › Agentes) dibuja el estado con `tag` Success/Secondary y el tipo de
extensión con `tag` Secondary; los contadores con `badge`/`overlaybadge`. Las pantallas sin maqueta
(Reglas, Categorías, Entidades, repositorios) siguen la misma gramática. El inventario se validó en
las dos direcciones: sin contar ninguno de los 104 `sc-tag` y rojo (+6) al volver a pintar a mano el
Tipo de Usuarios.

**Descartadas** ·
- **Mantener las mayúsculas de «ACTIVO»** → las ponía un `text-transform` de la pastilla a mano; el
  tag del Kit pinta el texto tal cual. Salen «Activo», «WebRTC».
- **Badge `danger` en «Solo fallidas»** → blanco sobre red-500 da 3.76:1, bajo AA (lo cazó
  `theme-contrast`); es el mismo valor que el botón `danger`, pendiente de decidir en el DS.
- **Migrar solo el icono del hub (p. ej. a `sc-avatar`)** → lo hecho a mano es la fila entera
  (`<button class="hub-item">` con icono, título, descripción, flecha o «Próximamente», hover y
  deshabilitado); el icono es lo único que la sonda ve. Bajar ese 11 a 0 sin tocar la fila haría
  pasar el test sin que el hub bebiera del DS. Tampoco hay maqueta: el fichero `Supervisor` no tiene
  página de Repositorios. (Una primera versión de esta entrada decía que migrarlo obligaba a «pisar
  el componente por dentro»; no se había medido, y Rafa pidió revisarlo con ojo crítico.)
- **Añadir las piezas a una lista de «conocidas» del test** → el test existe para que bajen, no para
  archivarlas.

**Consecuencias** · Entidades pierde el azul del tipo (era color sin significado) y el sistema deja de
distinguirse en gris: las dos secciones ya se separan por su título y el candado. Pendiente, en la
bandeja: el `badge danger` del DS bajo AA, el botón «Solo fallidas» entero (un filtro conmutable hecho
a mano, que la sonda no cuenta porque es un botón), la fila de navegación del hub a un componente del DS,
y que la sonda solo mira pastillas.

---

## DD-76 · 2026-09-13 — Conversaciones lleva la piel de Aura, los valores categóricos salen del `tag` del DS a la medida del Kit, y el producto deja la monoespaciada

**Contexto** · Tras DD-72/#136 (Aura como base), Rafa vio que la tabla de Conversaciones no la
llevaba y pidió consistencia: que las piezas salgan directamente del DS, y nada en tipografía
monoespaciada. Al mirarlo, la tabla tenía piel propia (relleno 14/15.75, raya de cabecera, gris de
selección), una pastilla hecha a mano copiada en dos hojas (`.memory-cell-pill` y `.sc-type-tag`,
redonda, con borde, 12 regular) y doce sitios en `--sc-font-family-mono`.

**Decisión** · (1) Conversaciones queda con la piel de Aura: fuera rellenos, raya y gris propios;
se quedan la cabecera fija, los cuatro estados de fila y la clase de selección (que es funcional: pinta
al instante las filas de un rango). (2) Columnas de largo conocido con ancho MEDIDO (lo más largo de
celdas y cabecera en es/en/fr/pt + 28 de relleno, redondeado a múltiplo de 7); las de texto libre se
reparten el resto. (3) Sin columna ⋮: sus tres acciones tienen otra puerta visible (barra de
selección, reproductor) y el clic derecho sigue. (4) Tipo, Estrategia, Servicio y Grupo usan
`<sc-tag severity="secondary">`; `.sc-type-tag` y `.memory-cell-pill` se borran. (5) El `tag` del tema
pasa a `tag/padding/y` = `scale/0-125` (1.75): medía 25 de alto contra los 21.5 del maestro. (6) Nada
en monoespaciada en el Supervisor ni en los componentes del DS: códigos e identificadores son texto de
celda, y donde la mono evitaba que las cifras bailaran lo hace `tabular-nums`. sc-docs la conserva.

**Razón** · (1) Consistencia con las otras 25 tablas: medido, Conversaciones queda 8/14 y 44.5 de fila,
idéntica a Usuarios. (2) Con reparto fijo, una columna sin ancho se lleva la MISMA parte: Hora tenía
122px para 5 caracteres mientras Origen partía nombres; a 1440 ya nada se parte. (4) La maqueta
(`Supervisor` › Conversaciones) dibuja Servicio y Grupo con la instancia `tag` Severity=Secondary de la
librería, y el maestro (DS › ❖ Tag, set `373:13337`) fija Inter 12/18 **700**, relleno 1.75/7, radio 6,
separación 3.5, icono 10.5, todo atado a variables; Aura también pone el tag a 700. (5) Era el fleco que
DD-51 dejó anotado («el `tag` mide 25 contra 21.5 por su `padding` vertical»). (6) `--sc-font-family-mono`
se escribió a mano con el esqueleto del repo y no está en el export del Kit; Figma dibuja el ID en Inter.
En la documentación sí se queda: el código y los nombres de token se leen mejor en mono.

**Descartadas** ·
- **Servicio y Grupo en texto plano, como primeng.dev** (lo recomendé yo) → la maqueta del producto
  dibuja el `tag`, y manda sobre la documentación de PrimeNG.
- **Mantener la pastilla propia y solo corregir su tipografía** → duplicaba un componente que el DS ya
  tiene; «un nombre, un hogar».
- **El ID en `caption` (12) en vez de `body-regular`** → Figma lo pinta con el color de fila, como una
  celda más; el 13 del Figma no es peldaño.
- **Borrar el token mono también de sc-docs** → decisión de Rafa: la documentación de código va en mono.
- **Quitar el `<kbd>` del buscador** → basta `font-family: inherit`; el navegador lo pinta en mono por
  defecto, y así se había escapado del primer barrido.

**Consecuencias** · Medido en 23 pantallas × 2 temas: 104 tags a 21.5, **cero textos en monoespaciada**
(también con el reproductor abierto). La selección de fila en oscuro de la lista compartida usaba
`--sc-color-slate-100` crudo (gris claro con texto casi blanco): pasa a `--sc-bg-secondary-hover`, que
en claro vale lo mismo. El test de capas de transcripciones cambia de testigo (del padding al tinte de
la fila fallida) y deja escrito que PrimeNG antepone su `@layer reset, primeng`, así que el orden no se
puede invertir desde la app. Quedan en la bandeja: el barrido de las piezas hechas a mano que siguen en
pantallas (`status-pill`, `sc-label`, tipo de extensión, tipo de entidad, estado de regla) y la
cabecera fija de Conversaciones, que NO fija: `.table-card` lleva `overflow: hidden` desde el L1.

---

## DD-75 · 2026-09-13 — Figma alcanza al código en el título de sección, el puente de tipografía se queda en las tres tallas que se usan, y el 12/20 accidental pasa a caption

**Contexto** · DD-74 subió el título de sección a `h3` en código y dejó cuatro cosas que solo se
resolvían tocando Figma o decidiendo. Con el bridge abierto se verificaron contra el fichero real
(`khNq9dJKNi13pNllrqm6dx`), Claude recomendó y Rafa aprobó todas las sugerencias.

**Decisión** · (1) En Figma, las 4 capas `Title` del componente `Section` pasan a
`Heading/h3-semibold`; las 25 de `.Subsection` se quedan en `Body/body-semibold`, igual que en código.
(2) El título se queda en **18**, sin crear un estilo de 20. (3) Se **borran** del Kit
`app/typography/xl` y `xxl` (sus 4 variables), y a la vez sus 4 entradas del export y la regla del
mapa de cobertura que existía solo para ellas. (4) El 12/20 accidental pasa a **12/18** (interlineado
de `caption`) en los 11 sitios que lo producían; el de `sc-chip` se queda.

**Razón** · (1) La descripción de `Heading/h3-semibold` en el propio fichero dice «bloques, tarjetas,
formularios»: el estilo ya declaraba su sitio. (2) 18 es un estilo con nombre; 20 exigiría un estilo
nuevo por 2px que no se distinguen (medido en DD-74). (3) **Nadie las usaba**, medido antes de borrar:
0 aliases, 0 text styles, 0 capas atadas en las 110 páginas (26.498 textos, con control: 2.281 capas
con el tamaño atado a 30 variables, incluida su hermana `app/font/size`) y 0 en el fichero de
Supervisor (5.644 textos). Quedan `sm/md/lg`, exactamente las que `sc-preset/extend.ts` declara.
Tras quitarlas del export, `tokens:import` regeneró las capas **byte a byte idénticas**. (4) En los
siete casos de pantalla el mecanismo es el mismo, medido regla a regla en el navegador: el padre
lleva `sc-text-body-regular` (14/20) y el hijo solo baja el tamaño a 12, así que hereda el 20. En
`sc-form-section-nav` era un `line-height: 20px` a pelo, portado así en junio sin decisión escrita.

**Descartadas** ·
- **Cambiar las ~35 capas `Title` de la página `❖ Section`** (lo que decía `figma-pendiente.md`) →
  la cifra mezclaba dos componentes; las de `.Subsection` son el segundo nivel y deben quedarse en 14.
- **Quitar el 20 de `sc-chip`** → no es accidental: el tema documenta que en Figma el chip tiene el
  interlineado ATADO a 20 (`sc-preset/css.ts`, «ETIQUETAS … chip 20»), y ahí arbitra Figma.
- **Un text style propio de 12/20 para pastillas** → formalizaría un accidente.
- **Dejar la regla `not-consumed` de xl/xxl «por si vuelven»** → sin ella, si alguien las recrea en
  Figma el sync las trae `unmatched` y §8 se pone en rojo, que obliga a decidir qué son.

**Consecuencias** · Figma y código dicen lo mismo en el título de sección, y la divergencia que
anunció DD-74 queda cerrada. `tools/text-census.mjs` gana `--rutas`: en el Supervisor el crawl moría
en `/` porque su menú son botones, y un censo de 1 ruta y 19 textos parece un verde y no mide nada;
con las rutas sembradas mide 27 rutas y 3.040 textos, con un ruido de 2 (un reloj en vivo). El censo
antes/después dio **96 interlineados de 20 a 18 a 12px y ningún otro cambio de letra**. Pendiente de
Rafa y fuera del repo: **publicar la librería** en Figma para que los ficheros consumidores reciban
el título nuevo y dejen de ver las dos variables.

---

## DD-74 · 2026-09-12 — El chip relleno significa lo mismo en las dos pantallas, y un título vuelve a ser más grande que su contenido

**Contexto** · Rafa, sobre el barrido de tablas, delegó las dudas en el criterio del agente con cuatro
principios (automatización, consistencia, sencillez e intuitividad), y después pidió los títulos de cada
parte a 20px y peso 600, para diferenciar los títulos del resto. Las dos cosas salieron de
mirar las pantallas, y las dos se midieron antes de tocar nada.

**Decisión** · (1) El **chip de canal** se declara UNA vez (`_channel-chip.scss`), con la gramática
del **togglebutton** que publica el tema: apagado = pista rellena y texto apagado; encendido = blanco
en relieve, con ✓. (2) El **título de `sc-section-card`** pasa de `Body/body-semibold` (14/20) a
`Heading/h3-semibold` (18/24). (3) Los tres nombres del chip entran en el canon de
`audit:screen-vocabulary`, que ya sabe exigir un nombre = un hogar.

**Razón** · Para (1), y no es simetría: las dos copias no diferían en el estilo, **diferían en el
significado**. En el editor de grupos el chip RELLENO era el canal apagado; en el de agentes, el
encendido. La misma señal decía lo contrario en dos pantallas que son la misma cosa vista desde cada
lado. Ganó la del togglebutton porque es la que publica el tema, leído en `sc-preset/togglebutton.ts`
(claro): `root.background = surface.100`, `root.color = surface.500`, `checkedColor = surface.900` y
un `content.checkedShadow` para el elegido. La otra además pintaba con `--sc-color-blue-700`, paleta
CRUDA como fondo, que no voltea en oscuro. Para (2): el título medía **exactamente lo mismo que su
contenido** —14/20/600 contra 14/21/400 en `config/aed/agentes`—, así que solo el peso lo separaba.
Un título que no es más grande que lo que titula no hace jerarquía.

**Descartadas** ·
- **Los 20px que pidió Rafa** → 20 existe en la escala (`--sc-font-size-450`) pero NO lo nombra
  ningún text style: los seis roles son 64, 48, 24, 18, 14 y 12. Sería la única tipografía de la app
  fuera de la rampa —lo que `audit:text-styles` existe para impedir— y no seguiría un remapeo de
  Figma. Se construyeron 14, 18 y 20 y se miraron juntos: entre 18 y 20 no hay diferencia apreciable.
- **Quedarse con el chip azul relleno** («relleno = encendido» es más intuitivo a primera vista) →
  rechazado: es mi gusto contra lo que el tema publica, y encima obligaba a mantener la paleta cruda.
  El icono ✓/＋ ya deja el estado dicho sin depender del color (UX 6).
- **Un gate nuevo para el chip** → no hacía falta: `audit:screen-vocabulary` ya vigila que un nombre
  compartido tenga un solo hogar, y su propio criterio de entrada es «lo usan dos pantallas o más».

**Consecuencias** · Los dos editores hermanos quedan **idénticos**, también en medida: su fila pasa a
69 px en los dos (antes 65 y 69 — los chips diferían en padding y radio, no solo en color).
`page-identity` deja de comparar dos cifras: el título de página dentro de una card medía 14 **para
igualar al título de sección**, así que sube con él y las dos familias quedan en 18 — una regla menos
que explicar. El trinquete de tipografía suelta baja a 99. **Queda vivo**: esto DIVERGE de Figma a
propósito. La ficha del Kit sigue diciendo que una cabecera de sección es `Body/body-semibold`; hasta
que ese text style pase a `h3` allí, el código va por delante, y está anotado en la bandeja.

---

## DD-73 · 2026-09-12 — La tabla no hereda su letra de la app en NINGUNA de sus dos pieles, y un guardián vigila las 38 ranuras

**Contexto** · DD-72 ancló la tipografía de la piel `list` y dejó escritas dos cosas como deuda: que
la piel **por defecto** no la había seguido, y que nadie comprobaba que las 38 ranuras reenviadas
siguieran existiendo en PrimeNG. Las dos eran del mismo tipo — fallos que no rompen nada hoy y que
nadie vería el día que pasen.

**Decisión** · (1) El tema fija un **suelo tipográfico para cualquier `sc-datatable`**, no solo para
la piel `list`: celda `Body/body-regular`, cabecera `Body/body-semibold`, que es lo que la piel por
defecto ya rendía. (2) Nace **`audit:datatable-slots`** (`verify` pasa a 39 eslabones), que lee el
código de PrimeNG en `node_modules` y muerde en tres direcciones: la ranura que declaramos y ya no
existe, la que PrimeNG trae y no reenviamos, y la que se declara en el `.ts` y la plantilla no emite.

**Razón** · Para (1), medido y no deducido: en la página del DS, subir el `font-size` del `body` de
14 a 20 px **se llevaba la celda de la piel por defecto a 20**, mientras la `list` se quedaba en 14.
O sea que seguía colgando de la app que la montara — el mismo fallo que hacía que la misma tabla
midiera 16 en el Supervisor y 14 en sc-docs, y que en sc-docs salía bien **por casualidad**. Para
(2): el nombre de una ranura es un string acordado con PrimeNG; si una subida lo renombra, el
`contentChild` apunta al vacío sin que falle el build ni ningún test de comportamiento, porque el
modelo de column-defs sigue pintando. Es el mismo modo de fallo silencioso que persigue
`audit:primeng-coupling`, y se mide igual.

**Descartadas** ·
- **Ponerlo en `datatable.ts`** (el preset de tokens) → el juego de tokens de PrimeNG no tiene
  `fontSize` en `bodyCell`. El hook `css` existe justo para lo que los tokens no cubren.
- **Dar a la piel por defecto la misma tipografía que la `list`** (cabecera `caption-semibold`) →
  rechazado aquí: tapar el agujero y rediseñar la piel son dos cosas, y la segunda se decide
  mirándola. Queda apuntado en la bandeja del frente.
- **Añadir la comprobación a `audit:datatables`** → está en la lista de legado sin test, y meterle
  una regla nueva la habría hecho crecer sin red. Un script nuevo nace con su caso rojo, que es lo
  que pide CHECK O.
- **Exonerar `docs/DECISIONS.md` de la cuenta de gates** (el gate M la exige, y dos frases de DD-65
  daban la cifra de entonces como hecho de su día) → rechazado: exonerar el fichero entero dejaría
  ciego al gate para las afirmaciones que sí son del presente. Esas dos frases pasan a decir
  «eslabones», que conserva el hecho de aquel día sin una cifra que caduque. Nota para quien venga:
  el gate lee el NÚMERO, no el contexto, así que ni siquiera una cita entrecomillada se salva — este
  mismo párrafo lo aprendió por las malas.

**Consecuencias** · Las dos pieles quedan inmunes al `body` de la app que las monte, verificado con
el mismo experimento que destapó el fallo. `verify` pasa a 39 eslabones (actualizado en `README.md`,
`CLAUDE.md`, `DOCS-INDEX.md` y la skill de auditoría semanal). **Queda vivo** el tercer punto de la
bandeja de DD-72: los dos editores simétricos siguen pintando sus chips de canal distinto, y cuál
gana es decisión de producto.

---

## DD-72 · 2026-09-12 — La tabla publica su tipografía; la matriz de permisos es OTRO componente; las 38 ranuras de PrimeNG se reenvían

**Contexto** · Rafa pidió revisar todas las tablas de la plataforma, partiendo de la página
del DS y combinándola con la documentación de PrimeNG, con el foco en que fueran **visualmente iguales
y compatibles**. Medido al abrir: el Supervisor tenía 16 tablas, 11 con `sc-datatable` y **5 escritas a
mano**, y esas cinco no eran la misma cosa — dos matrices de permisos, dos editores de formulario y un
selector. Las apps réplica quedaron fuera por DD-35 y DD-37.

**Decisión** · Tres, y cada una cierra un hueco distinto:

1. **La celda de tabla declara su estilo de texto.** El `<td>` no declaraba tipografía y heredaba los
   16px del documento; cada página lo tapaba por dentro pegando una `.sc-text-*` en el contenido (104
   repartidas). Ahora la gramática de tabla-lista publica `Body/body-regular` en la celda y
   `Caption/caption-semibold` en la cabecera, **por token de rol**, y el padding vertical sube a
   `--sc-spacing-1-25` para que la fila respire con la letra ya correcta (53 → 63,5px).
2. **`sc-permission-matrix` es un componente propio**, no una opción de `sc-datatable`. Una matriz
   lleva cabecera de FILA (`<th scope="row">`) y un control en la cabecera de columna, y eso no lo
   hace ni `sc-datatable` ni `p-table`: no es una función de PrimeNG que falte traer.
3. **Las 38 ranuras de plantilla de `p-table` se reenvían**, para que un ejemplo de primeng.dev se
   pegue dentro de `<sc-datatable>` y funcione ya tokenizado — que es lo que Rafa pidió al elegir
   que funcione como PrimeNG, para poder estudiar más adelante evolutivos con todas sus opciones.

**Razón** · Para (1): el mismo `<td>` rendía **16px en el Supervisor y 14px en sc-docs**, porque cada
app fija un `body` distinto. Una tabla cuya letra depende de quién la monta no es un componente, es una
sugerencia; y el parche por celda solo funciona mientras nadie olvide la clase — que es justo lo que
había pasado: **DD-71 lo arregló ese mismo día** envolviendo a mano cuatro columnas de
`/conversaciones`. Aquella entrada y esta miran el mismo defecto desde los dos lados — allí el
envoltorio que faltaba en una tabla, aquí el suelo que ninguna tenía. Para
(2): forzarlas dentro de la tabla de datos la infla para dos pantallas. Para (3): medido con una sonda
y su control positivo, una plantilla del consumidor **NO** atraviesa un `<ng-content/>` hasta `p-table`
—sus queries son `contentChild` y solo ven su propio contenido—, así que «dejar hueco» no era una
opción: hay que capturarla y re-emitirla. Cada ranura va dentro de un `@if` porque declararlas siempre
haría que PrimeNG pintara elementos vacíos (un `<tfoot>` sin pie), también medido.

**Descartadas** ·
- **Converger la matriz en la piel del `sc-datatable` por defecto** → la piel del Supervisor es
  `variant="list"`, medido: **las 10 páginas con tabla la usan**. La matriz copia esa, no la otra.
- **Reenviar solo las ranuras «que hacen falta»** → rechazado: la lista de «las que hacen falta» se
  queda corta el día que alguien quiera una función nueva, y el coste de las 38 es mecánico.
- **Arreglar el 16px celda a celda** (DD-71) → sirve para una tabla y no para la siguiente. NO se
  revierte: su envoltorio sigue siendo la forma canónica de que un texto diga su estilo, y su test
  sigue verde; lo que cambia es que ya no es lo ÚNICO que sostiene la medida.
- **Padding `--sc-spacing-1`** (fila de 56,5px) → construido y mirado junto al de 63,5; Rafa pidió que
  respirara y eligió el holgado. Queda a un token de distancia si se quiere revertir.

**Consecuencias** · **EJECUTADA.** Cero tablas escritas a mano en el Supervisor: las 16 pasan por el
DS. `list-table-grammar.spec.ts` gana la tipografía de la celda como contrato (validada en rojo con el
valor viejo) y tres casos nuevos para las tablas que viven dentro de un formulario, que hasta hoy el
guardián no visitaba (lo cantó `audit:datatables` §7). `sc-datatable-slots.spec.ts` fija el reenvío, con
su caso rojo. **Una diferencia de comportamiento deliberada**: vaciar la selección desde la cabecera ya
no borra las filas que la búsqueda esté ocultando — antes ese camino y el de marcar una a una no decían
lo mismo. **Queda vivo**: los dos editores simétricos pintan sus chips de canal distinto (pastilla azul
con `--sc-color-blue-700` de fondo contra contorno blanco), divergencia anterior a esto y contraria a la
regla de no usar paleta cruda como fondo; y la piel por defecto de `sc-datatable` no ha seguido a la
`list` en tipografía, así que sc-docs y el Supervisor ya no coinciden en ese punto.
## DD-71 · 2026-09-12 — El texto de una celda va en SU envoltorio, y por eso las tablas miden igual

**Contexto** · El barrido de estilos de texto dejó un residuo grande y raro: en `/conversaciones`,
la tabla de transcripciones escribía a **16/24** mientras las otras diez de la app miden 14/20. No
era una regla que dijera 16 en ninguna parte — no había nada que corregir en ninguna hoja. Cuatro
columnas (Hora, Fecha, Origen, Destino) ponían el texto **directamente en el `<td>`**, y las dos
numéricas en un `<span>` que no declaraba tamaño; como el `<td>` lo pinta el DS y `html, body` no
declara `font-size`, ese texto heredaba **los 16px del documento**. Y 16 no es peldaño de la rampa
(DD-54), así que ninguna clase `.sc-text-*` podía nombrarlo.

**Decisión** · El texto de una celda va SIEMPRE dentro de su propio elemento, con su estilo dicho
por el nombre (`<span class="sc-text-body-regular">`), nunca suelto en el `<td>`. Es el patrón que
ya usaban las otras diez tablas; aquí solo faltaba. Lo vigila `text-styles-applied` en el navegador,
midiendo la COLUMNA y no la hoja.

**Razón** · El `<td>` no es nuestro: lo pinta el componente del DS y lleva su propio `_ngcontent`,
así que una regla encapsulada de la página no lo alcanza (por eso las demás tablas ya proyectaban un
`<span>`; ver el comentario de `agents-list-page.component.scss`). Dejar el texto suelto en el `<td>`
no es «una tabla sin estilo»: es una tabla que hereda del DOCUMENTO, que es el único sitio del que
puede venir un 16 en una app cuya rampa no lo tiene. Se ve en pantalla y no lo caza ningún gate
estático, porque no hay ninguna declaración que auditar.

**Lo que costó y lo que NO cambia** · 1.020 textos pasan de 16/24 a 14/20, todos dentro de
`/conversaciones`; 0 cambios en las otras 37 rutas y sus estados. La tabla encoge de 2.478 a 2.249px
y baja de 26 a 16 filas partidas en dos líneas. La fila de una línea sigue en 57px porque su suelo
lo pone el `<td>` a 16/24 — que es así en TODAS las tablas de la app (medido en `/admin/agendas` y
`/admin/usuarios` el mismo día), de modo que esto alinea la tabla con las demás en lugar de
inventarle una excepción. Los 4px que la separan de esas dos (57 contra 53) son su padding propio,
el aire de Memory, deliberado y ya vigilado.

**Descartadas** ·
- *Declarar `font-size: 14px` en el `<td>` desde la piel de Memory* → arregla una tabla y deja el
  mecanismo intacto: la siguiente columna sin plantilla vuelve a heredar del documento. Además
  compite con el tema por la misma propiedad, que es justo lo que DD-66 sacó de las pantallas.
- *Bajar el `font-size` del documento a 14* → mueve TODO lo que hereda del `<body>` en las cinco
  apps, incluido lo que hoy mide bien por accidente. Un cambio de esa talla necesita su propia
  medición, no colarse dentro de un arreglo de tabla.
- *Dejarlo como estaba, «que es lo que hay en producción»* → es el residuo que Rafa señaló y el
  único de la lista que se veía a simple vista: la pantalla principal escribía más grande que el
  resto sin que nadie lo hubiera decidido.

## DD-70 · 2026-09-11 — El código que enseña la doc no se compara por IGUALDAD con el que ejecuta, sino por cuatro relaciones

**Contexto** · Rafa, mirando `/#/components/button`, preguntó si el código de cada ejemplo de sc-docs
está basado realmente en PrimeNG. El ejemplo enseña `<sc-button label=… variant=… />` mientras el DOM
que sus devs tienen delante es `sc-button > p-button > button`. Medido: 43 páginas llevan el
snippet escrito A MANO en una constante y **ningún gate** lo cruzaba con la plantilla que de verdad
se renderiza. `audit:doc-snippets` (2026-09-07) solo comprobaba que lo que enseña EXISTA.

**Decisión** · **No se exige igualdad snippet ≡ plantilla.** Se midió antes de decidir: de los 71
pares, 31 coinciden y **40 divergen a propósito** (el snippet inlinea los datos para que se lean
donde la demo ata una variable; omite el andamiaje que la demo usa para enseñar el resultado). Un
gate de igualdad daría 40 falsos positivos y enseñaría a ignorarse (LEARNINGS #2). En su lugar, el
gate ata las cuatro relaciones que sí son defecto sin discusión, y cada una nació de un caso REAL:

| Relación | El caso que la justifica |
| --- | --- |
| (a) lo que el snippet enseña, la demo viva lo pinta | `emptystate#CTA` enseñaba `(cta)="onCreate()"` y no existía ni el binding ni el método |
| (d) lo que la demo viva pinta, el snippet lo enseña | **el caso de Rafa**: `button#ICONS` renderiza `variant` y `fullWidth` y el código enseñaba cuatro botones sin ninguno |
| (c) la proyección usa el slot que el componente declara | `select#OBJETOS` enseñaba `pTemplate="item"` y `sc-select` proyecta por `contentChild('item')`: al wrapper NO le llega |
| (b) cada input público sale en algún ejemplo o knob | 66 no salen; va por TRINQUETE, no por lista |

Se comparan **nombres, no valores** (`[home]="{…}"` cubre `[home]="home"`), se ignora el ruido de
plantilla (`class`, `data-testid`, `#ref`) y los comentarios HTML no cuentan como código.

**Y la doc gana la ANATOMÍA, leída del DOM** · Cada página enseña además la estructura que de
verdad se renderiza (`sc-button > p-button > button.p-button`), que es lo que necesita quien depura
CSS o escribe un selector. No se escribe: `storybook/story-anatomy.component.ts` la lee del DOM ya
pintado, así que el día que PrimeNG cambie por dentro, la ficha lo dirá sola. Una tabla tecleada
sería otro texto que puede mentir — el mismo defecto que este cambio viene a cerrar.

**Descartadas** · *Extraer el snippet de la plantilla en build* (una sola fuente): elimina la clase
de fallo pero también el control editorial del ejemplo, que es lo que hace legible una doc — el
snippet de `breadcrumb` inlinea los datos justamente para que se vean. *Exigir igualdad*: 40 falsos
positivos medidos. *Una tabla de selectores a mano* para la anatomía: ya existe una en
`validar.component.ts` con valores tecleados, y es exactamente lo que no queremos repetir.

**Alcance** · El trinquete (b) arranca en 66 y solo baja: los 66 no se documentan de golpe (un
ejemplo malo enseña peor que ninguno), pero un input nuevo sin ejemplo pone el gate en rojo el día
que se añade, que es cuando cuesta un minuto.

---

## DD-69 · 2026-09-11 — El estilo de texto se pone por su nombre: la clase es el enlace con Figma

**Contexto** · Rafa, inspeccionando el nombre de un agente en la lista: Computed le da 14 / 20 / 600 y
tiene que traducirlo él a `Body/body-semibold`, y preguntó si el estilo de texto se podía vincular. Sí: la clase
`.sc-text-body-semibold` ES ese enlace (DD-55, `#98`), y existía; pero solo 49 textos la llevaban y
301 reglas de pantalla seguían declarando los tres valores con tokens sueltos, correctos pero mudos.

**Decisión** · (1) La forma canónica de poner tipografía a un texto de pantalla es la clase
`.sc-text-*` en la plantilla; los tokens de rol en la hoja son el paso previo, no el destino. (2) Se
migran las 165 reglas que la clase puede sustituir sin mover un píxel, medido en el navegador antes y
después (3.664 textos en 38 rutas + 813 en modales: 0 cambios). (3) `audit:text-styles` gana un
trinquete por conteo: las reglas con `font-size` en las hojas del Supervisor solo pueden bajar.

**Razón** · El nombre tiene que viajar hasta el DOM: es lo que hace que alguien que no es del equipo
pueda abrir Inspect y leer «esto es Body/body-semibold» sin tabla de traducción, y lo que ata cada
texto al text style de Figma por su nombre y no por coincidencia de valores. Y con la clase, mover un
rol en el DS mueve todos sus textos a la vez.

**Descartadas** ·
- *Migrar TODO, chips incluidos* → los muebles apretados miden 12/12 y 14/14, que no es ningún text
  style (DD-67); ponerles la clase los hace crecer 6px.
- *Quitar la familia de la clase para que sirva en celdas mono* → la clase vale lo que el text style
  de Figma, familia incluida (lo comprueba la §1 del gate). Un texto mono no lleva text style.
- *Quitar el `font: inherit` de los botones y confiar en la clase* → el shorthand también resetea
  estilo y variante del `<button>`; sin medirlo en cada navegador no se toca. Se quedan 3 reglas.

**Segunda pasada, la misma tarde (116 → 101 reglas)** · Rafa preguntó si el barrido aplicaba
también a `/admin/repositorios`. Aplicaba, y no por esa pantalla sola: la primera pasada dejó fuera
lo que no estaba en SU inventario, no lo que tenía motivo. Lo que faltaba, medido rastreando el
build entero —**4.517 mediciones sobre 56 estados de pantalla**: las 38 rutas (2.503 textos sin
repetir) más 18 estados abiertos (modales, paneles, popovers, fichas de edición), contra las 38
rutas y 6 modales de la mañana—:

| Qué faltaba | Textos |
|---|---:|
| Celdas de las **nueve listas de repositorio** + grupos + usuarios | 270 |
| **Título de página** de las 13 pantallas — DD-55 lo dejó nombrado como pendiente | 31 |
| Barra lateral de Configuración, cabecera de grupos asignados, chip de tipo de entidad, pista de Sistema, modal de descarga, selector de conjunto de datos | 40 |

Resultado: **0 diferencias** de tamaño, interlineado, peso, familia, tracking y posición; **341**
textos que llevan la clase en su propio elemento y miden ese estilo, 283 de ellos en las 38 rutas
y el resto solo visibles con algo abierto. (Otros 69 la heredan de un
ancestro que la ganó —61 pastillas de estado, 5 prefijos, 3 rótulos activos—: esos NO cuentan como
atados, porque miden otra cosa que la clase del padre. Contarlos sería inflar el resultado con la
herencia.) Ruido del instrumento, dos rastreos del mismo build: 0.

**Y una regla de composición que salió de medirlo, no de razonarlo** · una clase `.sc-text-*` sobre
un selector **global** de la app (no encapsulado) compite de tú a tú: las dos valen (0,1,0) y decide
el orden del bundle. El bloque compartido de `typography.css` declara `margin: 0`, así que
`.page__heading` se jugaba sus 21px de separación con el cuerpo a una carrera que hoy gana por una
consecuencia del empaquetado —los `@import` de las capas suben a la cabecera y el partial acaba
278 KB más abajo— y no por decisión de nadie. Se probó **con el fallo puesto**: con `.page__heading`
a secas el margen aguanta, o sea que ningún gate estático lo vería venir. El selector pasa a
`h1.page__heading` (0,1,1) y `text-styles-applied` mide el margen en el navegador. En las reglas
ENCAPSULADAS de componente no se plantea: el atributo `_ngcontent` ya les da la especificidad.

## DD-68 · 2026-09-11 — Un push del plugin que no trae export también pasa por el robot: el filtro `paths` se va

**Contexto** · A las 08:27 se fundió el PR #104 «Design tokens sync» y `main` se puso en rojo
(`verify`, test 412: *«ningún `.ts` fuera de `projects/` se queda sin type-checkear»*). El PR
llevaba **172 ficheros de `.theme-designer/`**, el artefacto del plugin de Figma que `.gitignore`
excluye y que `tokens-sync.yml` promete descartar. No tocaba ni el export ni una capa `@sc-gen`.
Cadena medida: (1) el plugin empujó a `design-tokens-sync` un commit «Update theme from Figma»
que solo traía `.theme-designer/`; (2) `tokens-sync.yml` solo disparaba si cambiaba
`kit-export-dtcg.json` (`on.push.paths`), así que no corrió (último run: 2026-09-02) y la rama
no se reseteó a «main + cambio»; (3) `ci.yml` exime a esa rama en PR en sus cinco jobs porque
confía en que el robot ya la verificó; (4) el PR se fundió a mano con tres commits crudos del
plugin y sin que ningún check lo hubiera mirado. Salió al medir el ruido del diff de tokens
mientras se revisaba qué adoptar del repo `stablyai/orca`: el «+8182 líneas» no era generado
nuestro, era el plugin.

**Decisión** · `tokens-sync.yml` dispara con **cualquier** push a `design-tokens-sync` (sin
`paths`). El paso de reset ya contempla el caso «export == main»: deja la rama limpia y cierra el
PR. `.theme-designer/` sale de `main` (`git rm -r`). La exención de `ci.yml` se queda: vuelve a
ser verdad que todo lo que llega por esa rama pasó por el robot.

**Razón** · El hueco estaba en la premisa, no en un job: la exención del CI se apoya en que el
robot corre SIEMPRE que el plugin escribe, y el filtro `paths` la hacía falsa justo en el push que
más basura trae. Quitar el filtro restaura la premisa; el coste es un run del robot por push
del plugin (unos minutos, runner gratis).

**Descartadas** · *Quitar la exención de `ci.yml`* (B): habría parado este PR, pero devuelve el
rojo espurio de drift por el que nació la exención (el CI verifica sin regenerar primitivos), y
deja el hueco de fondo abierto: la rama seguiría sin normalizarse en ese push. *Añadir
`.theme-designer/**` al filtro `paths`*: cubre el caso de hoy y el siguiente fichero nuevo del
plugin vuelve a colarse; una lista de lo que el plugin escribe es una lista que envejece.

**Consecuencias** · `main` limpio y `verify` en verde tras fundir esto. Un PR de tokens vuelve a
ser «main + el cambio». Pendiente, y no se hace aquí: que la portada del PR diga si el robot lo
ha verificado, para que un PR del plugin no se pueda fundir a ciegas (hoy lo dice solo el estado
del run).

---

## DD-67 · 2026-09-11 — Los 12 text styles son los únicos: el 500 no es «casi», no existe

**Contexto** · Rafa, al cerrar el barrido de vocabulario, pidió casar cada título, subtítulo y todo lo
que no sea componente con el estilo de texto que le corresponda. El DS publica **12** text styles —seis
tamaños (64 · 48 · 24 · 18 · 14 · 12) por **dos pesos (400 y 600)**— y `audit:text-styles` ya
comprobaba que las 12 clases valen lo que Figma. Su propia cabecera decía el hueco: *«no opina sobre
dónde se usan las clases»*. Nadie miraba, entonces, lo que las pantallas declaran por su cuenta.

**Lo que salió al medir** (barrido estático sobre las 61 hojas del Supervisor, antes de tocar):

| | Cuántas |
| --- | ---: |
| Reglas con `font-weight: medium` (**500**), que no es el peso de NINGÚN text style | **76** |
| Reglas con un tamaño que no es peldaño de ningún rol (16 · 32) | 9 |
| Tamaño e interlineado que no casan entre sí | 2 |
| Reglas sin `line-height` (heredan) | 211 |

**Decisión** · (1) Los 76 pesos pasan a **400 o 600** con un criterio explícito: **600** para títulos,
para el dato que IDENTIFICA una fila y para el item activo del rail; **400** para etiquetas, opciones,
chips, pastillas y ayudas. (2) Los tamaños y los interlineados que no existen se llevan a su rol.
(3) El título de sección del constructor de reglas baja de **18 a 14** — era el único de la app que no
iba a `Body/body-semibold`. (4) `audit:text-styles` gana una tercera comprobación que cierra su propio
hueco declarado.

**Razón** · Un 500 no es una desviación pequeña de un 600: es un valor que el sistema no publica, así
que no hay Figma que lo respalde ni token de destino al que converger. Y el coste no es estético: con
76 reglas a 500 repartidas por 25 ficheros, cualquiera que copie una pantalla para hacer la siguiente
propaga un peso que no existe.

**Descartadas** ·
- *Gatear las reglas sin `line-height` en la misma tanda* → se hizo DESPUÉS, el mismo día y en este
  mismo DD: **212 → 23**, y los 23 que quedan son los muebles de interlineado apretado. El delta se
  midió en pantalla ANTES de tocar: los de 12px ya computaban 18 (el rol, por herencia) y no se
  mueven; los de 14px pasan de 21 a 20, −1px por línea. Declararlo los hace deterministas en vez de
  correctos por casualidad.
- *Marcar los `line-height` SIN UNIDAD (1.4, 1.5…)* → rechazado: están **aparcados con razón** en
  `NEXT-SESSION.md` («sin token destino en el Kit»). Un guardián que pide lo que el sistema no puede
  dar enseña a ignorarlo.
- *Marcar todo `font-size` fuera de la escala* → rechazado: tres de los nueve primeros avisos eran
  `font-size` sobre un GLIFO (`__caret`, `__check`), donde el tamaño es una caja de icono y no un
  estilo de texto. Se excluyen por nombre, con su test de control negativo.
- *Llevar la tarjeta de impacto de Memory a la escala* → rechazado: su tamaño tiene el motivo escrito
  al lado y trazado a Figma (32 es el tope real de la rampa, el Figma pedía 40; la variante `--rail`
  baja a 20 porque a 32 «conversaciones» se parte). Entra en `TIPOGRAFIA_DELIBERADA` con ese motivo,
  que es DD-36 aplicado aquí.

**Consecuencias** · Pesos fuera de estilo: **76 → 2**, y los dos son los deliberados con su motivo.
El gate muerde en las dos direcciones (una entrada deliberada que ya no corresponde a nada es roja) y
**está validado con el fallo puesto en tres ejes más un control negativo** — el mismo tamaño sobre un
selector de icono NO salta. `audit-text-styles` sale de `LEGADO_SIN_TEST` en `docs-coherence`: gana
sus 15 tests, y esa lista solo encoge.

⚠️ **Lo que este gate NO puede ver, y por eso no sustituye al e2e**: mira lo que se DECLARA, no lo que
GANA la cascada. `.impact__hero` declara 32 y su variante `--rail` lo baja a 20, así que el número que
de verdad se renderiza no sale de aquí. Lo rendido lo mide `e2e/supervisor/text-styles-applied.spec.ts`.
Esa misma ceguera me dio a MÍ una cifra equivocada al medir (dije 32 donde se pintan 20).

**Y un punto ciego de DD-65 que este cierra**: `audit:screen-vocabulary` compara un nombre declarado en
DOS hojas. `.rule-card__title` solo lo usaba una pantalla, así que podía irse a 18 sin que nada saltara.
El de tipografía mira el VALOR y no el nombre, así que una pantalla sola ya no puede derivar en silencio.

---

## DD-66 · 2026-09-10 — Lo que es del SISTEMA se dice en el tema; lo que es de la app se queda, pero en su capa

**Contexto** · `audit:primeng-coupling` contaba 36 clases internas de PrimeNG usadas desde nuestros
selectores, y **26 bloques de esas reglas vivían en el Supervisor SIN CAPA**. Sin capa gana SIEMPRE
a `@layer primeng`, sin mirar especificidad, así que ganaban al tema en silencio. Y lo que importa:
esas reglas **no viajan**. Se exporta el tema, se monta en otro sitio y la pantalla revierte al
preset —filas de 42px, cabecera oscura, botones que no chascan— **sin que falle un solo test**,
porque el comportamiento sigue intacto. El criterio de aceptación que puso Rafa fue exactamente
ese: exportar el tema y montarlo en otro sitio tiene que dar la misma pantalla.

**Decisión** · Cada una de las 36 se clasifica con una pregunta —¿es una opinión del SISTEMA o de
esta app?— y el resultado va a uno de dos sitios, nunca a un tercero:

1. **Del sistema → al TEMA** (`sc-preset/css.ts`), que es el punto de extensión que
   `@primeuix/themes` publica para esto. Tres se mudaron: la **gramática de tabla-lista** (10
   bloques), la **micro-interacción de botón** (2) y el **item de menú destructivo** (4).
2. **De la app → se queda, con su motivo escrito y en `@layer app`**, declarada después de
   `primeng` en `styles/_layers.scss`. Sigue ganando al tema —que es lo que hace falta— pero por un
   orden que se puede leer, no porque lo sin capa gane siempre.

Y el gancho de lo que sube al tema deja de ser una clase inventada por la app: la gramática se pide
con `<sc-datatable variant="list">` (entrada del componente del DS), y las clases por fila y por
item pasan a `sc-row--clickable` y `sc-menu-item--danger`.

**Razón** · El dato que decide es la objeción que mantenía la piel fuera del preset y que estaba
escrita en el propio partial: «tocar el preset cambiaría también la tabla de llamadas de `agent`,
que no es una tabla-lista de administración». Es cierta para un preset global y **falsa para una
variante**: `variant="list"` no aplica a quien no la pide. Quitada esa objeción, no quedaba ningún
argumento para tener en una app la piel de nueve tablas cuyos valores salen todos de token.

Lo mismo con el botón: el comentario decía «el tema decide cómo SE VE un botón, esta app decide
cómo RESPONDE al dedo». La app **puede** decidirlo; el problema es que entonces los botones dejan
de chascar al exportar el tema. Que el Kit no publique un token de micro-interacción no convierte
la micro-interacción en propiedad de una app.

Medido, antes → después: bloques de app sin capa sobre `.p-*` **26 → 1**; clases `.p-*` en SCSS de
app **16 → 6**. La red que lo autorizó es `e2e/supervisor/list-table-grammar.spec.ts`, que fija los
valores computados de las nueve páginas: **22/22 antes y 22/22 después, con los mismos números**.

**Descartadas** ·

- **Dejarlo en la app y solo documentarlo mejor.** Es lo que ya había —los comentarios eran
  buenos y decían «pisa al tema a propósito»— y no resuelve el criterio: seguía sin viajar.
- **Mover la piel al SCSS del componente del DS con `ViewEncapsulation.None`.** Viaja igual y
  conserva la precedencia exacta de hoy (sin capa), o sea menos riesgo. Se descarta porque estilar
  los internos de PrimeNG es el trabajo del TEMA, y porque dejarlo sin capa perpetúa lo que este DD
  viene a arreglar: que la gramática del sistema no pueda ser pisada de forma declarada.
- **Contar el preset dentro del mismo tope que el SCSS.** Habría hecho que mover una regla de la
  app al tema —el arreglo— pareciera un empate. El tope se parte en tres hogares (`app`, `ds`,
  `preset`) y solo `app` se lee como barra de progreso.
- **Renombrar los `.p-datatable-*` de la piel de Memory a `thead`/`tbody` y dejarla sin capa.**
  Se hizo lo primero (la estructura de una tabla la garantiza HTML; el nombre de la clase, la
  versión de PrimeNG) pero no lo segundo: sin capa seguiría ganando sin decirlo.

**Consecuencias** ·

- `audit:primeng-coupling` cuenta por hogar y **ahora también mira el preset**, que no miraba. En
  su primera pasada encontró dos selectores MUERTOS que llevaban tiempo ahí: `.p-inputchips` y
  `.p-inputchips-input-item` — PrimeNG no tiene ningún `inputchips`, ni fichero ni clase. Retirados.
- `audit:datatables` exige `variant="list"` en vez de `class="list-table"`.
- La ficha de `sc-datatable` en sc-docs gana el control `variant` y una story propia.
- **Queda pendiente y medido**: el Supervisor monta el toast con un `<p-toast>` a pelo y su propia
  plantilla, teniendo el DS un `<sc-toast>` que no proyecta contenido. Los cinco `.p-toast-*` que
  quedan (5 de los 6 de `app`) no son custom: son esa migración sin hacer. Y cuatro declaraciones
  del SCSS del DS repiten un `font-size` que el tema ya publica; retirarlas pide correr
  `e2e/component-styles.spec.ts` delante.
- La clasificación entera, fila a fila, en [`acoplamiento-primeng.md`](./acoplamiento-primeng.md).

---

## DD-65 · 2026-09-10 — Un nombre, un hogar: el vocabulario de dentro de la pantalla se declara una vez, y un gate lo vigila

**Contexto** · Los tres flujos de `config/aed` se casaron con su maqueta el 2026-09-09 y el
2026-09-10, y quedaron como la referencia de cómo se compone una pantalla de ajustes. Rafa pidió
llevar ese mismo estilo al resto de la app, midiendo ANTES de tocar. `audit:page-anatomy` ya
vigilaba el ESQUELETO (que toda página declare su arquetipo, que ninguna re-declare el molde),
pero **lo de dentro no lo miraba nadie**.

**Lo que salió al medir** (barrido estático sobre las 61 hojas del supervisor, 2026-09-10):

| Nombre | Referencia (`config/aed`) | La otra hoja (`styles/_forms.scss`) |
| --- | --- | --- |
| `.grid` | `column-gap` 24.5 · `row-gap` 12.25 | `gap` 15.75 a los dos ejes |
| `.field` | `gap` 7 · `min-width: 0` | ninguno de los dos |
| `.field__label` | 12 / **400** / `line-height` del rol | 12 / **500** / sin `line-height` / `margin-bottom: 2px` |
| `.grid--2` | idéntico | idéntico (la duplicación es lo que sobra) |
| `.checkbox-row` | — | `padding` 3.5 aquí, **7** re-declarado en `user-form` |
| `.sub-section__title` | `Body/body-semibold` | versalitas 12/600 `subtle` en `agent-form` |

Seis nombres con dos hogares, seis pantallas repartidas entre dos vocabularios, y ninguna regla
que los cruzara. `.field__label` es el que más pesa: **29 usos en 7 pantallas** — es el «barrido
global de la tipografía» que los hand-offs del 2026-09-09 y del 2026-09-10 dejaban pendiente.

**Decisión** · Cuatro cosas:

1. **El vocabulario de formulario vive en `styles/_forms.scss` y solo ahí**, con los valores de
   la referencia (los de la maqueta). Las copias de `config/aed` se retiran; las tres pantallas
   AED no mueven un píxel porque la global pasa a decir lo que ellas decían.
2. **`.sub-section` de `agent-form` pasa a llamarse `.disclosure`.** No era una divergencia que
   unificar: eran DOS MUEBLES con el mismo nombre — un tramo de formulario separado por
   `<sc-divider />` en AED, y un acordeón de versalitas separado por `border-top` en admin. La
   encapsulación de Angular los mantenía separados en el navegador, así que nada avisaba; lo que
   colisionaba era el vocabulario, que es lo que lee la siguiente persona.
3. **La caja de sección la pone el DS.** `sistema-page` y `numeracion-especial-section` tenían
   cada una su `.card` a mano (radio 300, sombra `xs`, línea bajo la cabecera, paddings propios)
   haciendo el trabajo de `sc-section-card surface="card"`. Pasan al componente. Es la misma
   copia local que `config/aed` ya se había quitado el 2026-09-09, viva en otras dos pantallas.
4. **Un gate nuevo, `audit:screen-vocabulary`**, en `verify` (que pasa de 37 a 38 eslabones). Lee el
   canon de la hoja de referencia EN CADA EJECUCIÓN en vez de copiarlo — duplicar los valores en
   el gate es la misma clase de fallo que el gate persigue.
5. **El CONTRATO de `surface="card"` deja de ser tradición oral**: quien usa esa caja sangra su
   contenido con `.sub-section`. Lo añadió el `/reflect` de la misma sesión, después de que ese
   contrato se me escapara al convertir `sistema-page`: sus cinco cards medían EXACTAS —radio,
   borde, paddings, todo verde— y el título salía a 37.75 del filo con el contenido a 25.5. Medir
   la caja no basta; hay que medir la RELACIÓN entre la caja y lo que proyecta. Lo cazó una
   captura y una medición, no el verde de la caja, y ahora es la cuarta comprobación del gate.

**Razón** · Una regla encapsulada de componente le gana siempre a una global, así que
re-declarar un nombre en la hoja de una pantalla no "ajusta" nada: le da a esa pantalla una
medida propia, en silencio y para siempre. Es el mismo mecanismo que DD-53 gateó para el molde
de página; lo que faltaba era aplicarlo al contenido. Y el canon leído en vivo es lo que ya
enseñó `emit-consumer-typography`: leer la lista del preset en vez de repetirla.

**Descartadas** ·
- *Unificar hacia los valores de `_forms.scss` (15.75/15.75, etiqueta a 500)* → rechazado: no los
  respalda ningún nodo. Los de `config/aed` salen de la maqueta, con `boundVariables` comprobados.
- *Dejar las dos hojas y solo documentar la diferencia* → rechazado: es lo que había, y es lo que
  produjo la deriva. Un documento no impide una tercera copia; un gate sí.
- *Renombrar el `.sub-section` de AED en vez del de `agent-form`* → rechazado: el de AED es el que
  casa con la maqueta y el que nombran los comentarios de las tres pantallas de referencia.
- *Dar a `sc-section-card` un slot de acciones en la cabecera y una pista de bloque* para poder
  convertir también los tres paneles del constructor de reglas → rechazado POR AHORA: sería
  deformar el componente del DS por UN consumidor, que es la deuda que este barrido vino a
  quitar. Entra cuando una segunda pantalla lo pida.
- *Re-añadir `__foot` a `sc-section-card`* para el pie de guardado de «Numeración especial» →
  rechazado por lo mismo: ese `__foot` ya existió y se borró el 2026-09-09 por no tener usos. Las
  acciones van dentro del cuerpo detrás de un `<sc-divider />`, que es el ritmo de la referencia.

**Consecuencias** · `verify` pasa de 37 a 38 eslabones (actualizado en `CLAUDE.md`, `DOCS-INDEX.md` y
la skill de auditoría semanal). El gate trae DOS listas que solo pueden menguar y que muerden en
las dos direcciones: `DELIBERADAS` (mismo nombre, medidas distintas a propósito) y `CAJAS_A_MANO`
+ `CAJAS_A_MANO_MOTIVO` — **una entrada sin motivo escrito es roja**, que es DD-36 aplicado aquí.

**La divergencia que queda, con su motivo**: los tres paneles del constructor de reglas
(`rule-builder`). Su CAJA ya mide como el maestro (se igualó en esta misma pasada: padding
31.5 → 24.5, cabecera→cuerpo 21 → 16; el radio ya coincidía, `--sc-radius-xl` y `--sc-radius-400`
son el mismo peldaño). Lo que sigue a mano es la CABECERA: dos de los tres llevan un control de
estado a la derecha del título y una descripción de frase entera debajo, y `sc-section-card` no
tiene ninguna de las dos cosas.

**Y una divergencia que NO era deliberada, encontrada por el camino**: el botón «Eliminar» del
rail estaba **duplicado, con un `|` literal entre las dos copias**, en los tres formularios de
admin. Sale del `7470fdc` («64 botones y 51 controles a mano pasan a componentes»): la reescritura
en masa emitió el reemplazo dos veces y nadie diffeó el resultado. Es `LEARNINGS` **#12** literal.
Llevaba ahí desde el 2026-09-05, a la vista, en tres pantallas.

**Lo que este gate NO mira, y por qué**: las nueve páginas de lista y el hub. Son otro arquetipo
—tabla y tarjetas, no campos en secciones— y su gramática ya la vigilan `audit:datatables` y
`e2e/supervisor/list-table-grammar.spec.ts`. La comprobación de "caja a mano" se limita además a
hojas de PÁGINA y de SECCIÓN: un panel lateral, un modal o una tabla son muebles distintos y su
caja es suya con razón. Mirarlo todo daba ocho avisos de los que cinco eran ruido.

---


## DD-64 · 2026-09-10 — Un commit que `main` ya ha adelantado no es un despliegue roto: no se registra

**Contexto** · La pantalla de *Deployments*, estrenada horas antes con DD-59, se llenó de rojo en
los cinco entornos y Rafa preguntó si estaba todo bien. No lo estaba, pero lo roto no era ninguno
de los cinco sitios: los cinco servían `main` y ningún build de Cloudflare había fallado.
Contadas por la API de GitHub: **23 filas en rojo** de 55 despliegues apuntados, y **las 23 se
explican sin que nada esté caído** — 20 son de cuatro commits que Cloudflare descartó
(`8cc9bce`, `287f075`, `7812c38` y `37f9d6f`, cinco filas cada uno) y las **3** restantes son un
único sitio cada una (`agent-mini` una vez, `supervisor` dos) que llegó pasados los 20 minutos
mientras sus cuatro hermanos entraban a tiempo.

**Lo que se midió** (2026-09-10, API de Cloudflare sobre la cuenta `b8361bb4…`, y cronómetro
contra los cinco `build.json`):

- `npm run audit:cf-config` en **verde**: los cinco proyectos siguen como el repo espera.
- **Cloudflare construye de UNA EN UNA en toda la cuenta.** Sobre los 87 builds de las 2,7 h
  anteriores, la concurrencia máxima observada fue **1**. Construir un sitio cuesta ~70 s
  (mediana 67 s, máx 146 s), pero la mediana de **cola** por despliegue fue **885 s** y el máximo
  **1.272 s**: manda la cola, no el build.
- Cada empujón encola **5** builds (uno por sitio) y **cada rama de trabajo encola otros 5**:
  236 despliegues en 24 h, 889 desde el 1 de septiembre.
- **8 de los últimos 41 despliegues de producción de `sc-doc` están `skipped`**, entre ellos los
  tres que dispararon los rojos de esta noche — `8cc9bce` (#80), `287f075` (#82) y `7812c38`
  (#81), empujados en 7 minutos. Cloudflare solo construye el **último** commit encolado de cada
  rama y descarta el anterior, así que esos tres **no los iba a servir nadie nunca**: sus 15
  filas rojas no podían volverse verdes jamás, por mucho que se esperase.
- El commit que sí quedó arriba (`fee8c34`) llegó a los cinco sitios en **12,7 · 13,4 · 15,1 ·
  16,8 · 17,8 min** desde el empujón, con UNA rama vecina construyendo. La ventana eran 20: pasó
  con 2,2 minutos de margen. Los tres rojos de un solo sitio de arriba son ese mismo margen
  agotándose en empujones anteriores.

**Decisión** · Tres cambios, uno por cada cosa que se midió:

1. **`record-deploy.mjs` mira la cabeza de `main`** antes de empezar y en cada vuelta. Si el
   commit que espera ya ha sido adelantado, lo dice y **sale sin registrar nada** — lo registrará
   la comprobación del que quedó arriba. Un commit adelantado no es un despliegue roto.
   No basta con «la cabeza es otro sha»: el job arranca **segundos** después del empujón, y una
   lectura rezagada de la API haría que un despliegue bueno se quedara **sin registrar y en
   silencio**, que es peor que el rojo que se venía a quitar. Así que se pregunta la ancestría
   (`GET /compare/<sha>...<cabeza>`) y solo se concluye con `ahead` o `diverged`; con `behind` o
   sin respuesta, se sigue esperando. Comprobado contra la API con los shas de esta noche:
   `7812c38…fee8c34` → `ahead`, y al revés → `behind`.
2. **`deploy-record.yml` cancela la comprobación anterior** cuando entra un empujón nuevo
   (`concurrency` + `cancel-in-progress`), que es exactamente lo que Cloudflare hace con el build.
3. **La ventana pasa de 20 a 35 minutos** (y el `timeout-minutes` del job de 25 a 40), fijada
   sobre la cola medida y no sobre la intuición de «un par de minutos por sitio» con la que se
   escribió.

**Razón** · DD-59 se escribió para que la pantalla no afirmara nada sin medirlo, y el rojo por
supersesión es la otra mitad del mismo error: **afirmar «este sitio no sirve el commit» cuando lo
que pasa es que ese commit ya no le toca a nadie servirlo**. Un rojo que no puede volverse verde
enseña a ignorar la pantalla, que es como se llegó a los tres meses de mentira de DD-58. Y los
17,8 minutos del commit de cabeza dicen que la ventana de 20 no tenía margen para una segunda
rama construyendo: habría dado un rojo con los cinco sitios sanos.

**Descartadas** ·
· *Dejar el rojo y explicarlo en la doc* — es gratis y es justo lo que no funciona: la pantalla
  la lee Rafa, no la doc, y lo que le dice es «cinco sitios caídos».
· *Solo subir la ventana* — no toca el rojo permanente: los commits `skipped` seguirían saliendo
  rojos a los 35 minutos igual que a los 20.
· *Apagar los previews por rama en Cloudflare* — es la mitad de la cola, y es la palanca más
  grande que hay. Pero el preview por rama es lo que Rafa pidió para compartir un link (DD-17),
  así que **no se toca sin él**; queda anotado con sus números en el hand-off.
· *Filtrar por rutas (`path_includes` por proyecto)* — cada sitio se construiría solo cuando
  cambia lo suyo, pero entonces un commit de tooling deja los cinco sitios sirviendo el commit
  anterior y el registro lo marcaría en rojo **con razón**: el sello dice «este sitio sirve este
  commit» y dejaría de ser cierto. Cambiaría el contrato de DD-59 entero.
· *Preguntarle a la API de Cloudflare si el build está `skipped`* — diría el motivo exacto en vez
  de deducirlo, pero ata el registro a un secret para saber algo que la cabeza de `main` ya dice
  sin credenciales. Se queda como mejora del MENSAJE si algún día un rojo no se explica solo.
  *(Al escribir esto el secret `CLOUDFLARE_API_TOKEN` no existía —`gh api …/actions/secrets`
  devolvía 0— y el paso de `audit:cf-config` del workflow solo avisaba. Rafa lo creó ese mismo
  2026-09-10 y el paso ya corre de verdad, verde, desde el #88. No cambia la decisión: la cabeza
  de `main` sigue diciendo lo mismo sin credenciales.)*

**Consecuencias** · Un empujón sobre otro deja de escribir filas rojas: escribe **una sola vez**,
la del commit que queda arriba, y las comprobaciones adelantadas salen en gris (canceladas) o en
verde diciendo por qué no registran. La regla vive en `supersesion()`, con su test en rojo y en
verde (`scripts/__tests__/record-deploy.test.mjs`), que además cruza los cinco sitios del
registro con los cinco proyectos que audita `audit:cf-config` — si nace una sexta app y solo se
apunta en un sitio, salta. **Lo que este DD NO arregla**: la cola. Con concurrencia 1 y 5 sitios
por empujón, dos ramas trabajando a la vez dejan el despliegue de `main` en ~18 minutos, y eso
solo baja apagando previews o pagando concurrencia. Está medido y anotado; es decisión de Rafa.

## DD-63 · 2026-09-10 — Una red de caja y tipo en NÚMEROS, porque 16 componentes no aseveraban ninguna

**Contexto** · Rafa preguntó si las baselines visuales eran overengineering. La respuesta corta
resultó ser que no, pero el camino destapó otra cosa. Al medir «¿qué se pierde si se quitan?» se
contó, por primera vez, **qué asevera de verdad el test de cada componente** — y la cuenta salió
mucho peor de lo esperado.

**Lo que se midió (2026-09-10, sobre `components.spec.ts`)** ·

| | componentes |
| --- | --- |
| con captura | 38 |
| **sin ninguna aserción de CAJA** (padding, gap, alto, ancho) | **16** |
| sin ninguna aserción de TIPO (tamaño, peso, interlineado) | 25 |
| con una sola propiedad aseverada, o ninguna | 15 |

Los 16 desnudos: `sc-skeleton`, `sc-grouppopover`, `sc-column-selector`, `sc-checkbox`,
`sc-bulk-edit-menu`, `sc-bulk-action-bar`, `sc-form-danger-zone`, `sc-sticky-form-header`,
`sc-color-dot-picker`, `sc-photo-upload`, `sc-command-palette`, `sc-keyboard-shortcuts`,
`sc-inline-rename-cell`, `sc-datatable`, `sc-bulk-transcription-modal` y `sc-section-card`.

En esos 16 la captura no es «la última línea» del test: es la ÚNICA. Y como las capturas son
`-darwin` y no cruzan de máquina, **en el CI no hay nada mirando su aspecto**. El contraejemplo
que lo destapó es de ese mismo día: otra sesión cambió cinco propiedades de `sc-section-card`
—padding 24.5 → 22.75, icono 16 → 14, gap 12.25 → 8.75, título 18/24 → 14/20 y la línea de la
cabecera fuera— y de las cinco aserciones de su test no se movió ninguna.

**Decisión** · Nace `e2e/component-styles.spec.ts`: por cada `[data-testid]` de las 38 páginas
del catálogo, congela 16 propiedades computadas de caja, tipo y color en
`e2e/baselines/component-styles.json`. Se regenera con `SC_UPDATE_STYLES=1` y **se revisa en el
`git diff`**, igual que el baseline de `component-structure.spec.ts`.

**Razón** · Un valor computado cruza de máquina: `22.75px` es `22.75px` en Ubuntu, en el Mac de
Rafa y en un runner de macOS. Un píxel no. Eso pone en el CI la parte del aspecto que se puede
comprobar en cualquier sitio, sin tocar las capturas, que siguen en local viendo lo que esto no
ve (un icono, una sombra, un color de borde). Tres redes con fronteras distintas y dichas:
estructura del DOM, caja y tipo, y comportamiento.

**Descartadas** ·
- *Escribir a mano las aserciones que faltan en los 16.* Son cientos de valores copiados del
  Kit, se desincronizan al primer cambio de token y nadie los revisa. Un baseline generado y
  revisable en diff da lo mismo sin el trabajo manual ni el óxido.
- *Retirar las capturas y quedarse solo con esto.* Era la propuesta inicial de esta sesión,
  basada en que en 33 commits no cazaron una regresión. Se cayó el mismo día: otra sesión las
  recortó al contenido, que era la mitad cara del problema. Ver las notas de esa decisión.
- *Meter esto dentro de `component-structure.spec.ts`.* Comparten patrón pero no pregunta: uno
  fija el HTML de 9 componentes para refactores, este los valores de 38 para el aspecto. Un
  fichero con dos baselines y dos motivos se acaba regenerando entero por el motivo que no era.

**Lo que el primer intento hizo mal, medido y corregido** · Vale la pena que quede, porque las
dos primeras versiones de esta red **no medían lo que decían medir**:

1. *Solo el nodo del `data-testid`.* En la mitad del catálogo ese nodo es el host del wrapper
   (`<sc-section-card>`), que es transparente: sin padding, sin radio, sin borde. La caja de
   verdad está dos niveles más abajo (`.section-card__head`). Con el contraejemplo puesto, la
   red pasó en **VERDE**. Ahora baja hasta 3 niveles y guarda los descendientes que definen
   caja, descartando los neutros para no multiplicar el baseline por ocho guardando ceros.
2. *`width` y `height` dentro.* **No cruzan de plataforma.** Medido en el primer run en CI
   (34414537272): 24 de 38 páginas en rojo y el diff ENTERO en `width` (`108.55px` frente a
   `110px`, `189px` frente a `233px`), más una `height`. Ni un padding, ni un gap, ni un radio,
   ni un tamaño de letra, ni un color se movieron. Un ancho es texto renderizado y ancho
   disponible —hinting de fuente y barra de scroll, que en macOS es overlay y en Linux ocupa—;
   un padding sale del token. Fuera las dos, y dicho: un tamaño que el Kit fija (el 28/42/56 de
   `sc-avatar`) lo vigilan las aserciones a mano de `components.spec.ts`, que es su sitio.

**Consecuencias** · Tres detalles más que costaron medirlos y quedan escritos donde se usan:
sc-docs enruta por hash, así que un `goto` NO recarga y hay que esperar al componente destino o
se leen las anclas de la página anterior; hay componentes que nacen ocultos (`sc-command-palette`
resolvió 33 veces a un nodo `hidden`), así que la espera es `toBeAttached` y no `toBeVisible`; y
las animaciones se apagan antes de medir, porque `sc-message` monta con la de PrimeNG y leerlo a
media entrada daba 5,15px, 8,78px y 19,09px sobre un valor final de 19,11px.

## DD-62 · 2026-09-10 — Las baselines visuales vuelven al `preflight`, ahora que enrojecen por lo que vigilan

**Contexto** · DD-60 sacó las suites e2e del `preflight` y las dejó solo en el CI. Con las
**baselines visuales de sc-docs** no se pudo: sus 38 capturas son del Mac de Rafa y el runner de
macOS las falla TODAS por la fuente monoespaciada del sistema. Quedaron **sin gate, a mano** —
dicho en alto en DD-60, no por omisión. Rafa lo cuestionó al día siguiente: no hacía falta
tenerlas siempre al día, y el storybook podría bastar.

**Razón** · Al medirlo apareció que la pregunta correcta no era si sobraban, sino **por qué
molestaban**: capturaban `fullPage`, o sea con el shell dentro, así que cualquier cambio del
MARCO las invalidaba todas a la vez. Medido el 2026-09-09: añadir UN enlace a la barra lateral
puso **8 en rojo** (147-337 px) sin que ningún componente hubiera cambiado. Eso es lo que enseña
a regenerarlas sin mirar, y es como se pudrieron 213 commits. Arreglado el encuadre
(`getByRole('main')`), la red vuelve a ser señal: con el mismo enlace nuevo, **38 en verde**; con
UNA letra cambiada en una story, **roja a 204 px**. Y el estímulo del primer caso se verificó que
llegaba al navegador con un control que debía enrojecer y enrojeció.

**Decisión** · `e2e:visual` vuelve a `preflight` (**2 min** medidos; el carril completo pasa de
~3 a ~5). En `preflight:scope` se corre **solo si el cambio puede mover el catálogo**
(`sc-docs`, `ui-smartcontact`, `design-tokens` o el propio spec): un cambio del Supervisor no
puede tocarlas. En `ci-preflight-parity` entra en `LOCAL_ONLY`, cuya regla se explicita: no es
«lo que me apetece saltarme», es **lo que el CI no puede hacer**. Ese lado hace el preflight más
estricto que el CI, nunca menos, así que la promesa «verde en local ⇒ verde en CI» se mantiene.

**El contraejemplo que lo cierra** (lo midió la sesión `numbfish` el mismo día, en `sc-section-card`):
cambió **padding, línea de cabecera, icono, gap y tipografía**, y de las **cinco aserciones** que
tiene el test de ese componente **ninguna toca nada de eso**. Lo único que enrojeció fue la
captura, y las tres veces. O sea que la red de valores computados y la de píxeles **no se
solapan**: hay cambios reales que solo ve la segunda.

**Descartadas** ·
· *Borrarlas, que era la lectura literal de la pregunta de Rafa* — habría sido tirar la única
  detección de cambio visual no intencionado. Un showcase enseña cómo está algo AHORA; no
  contesta «¿esto ha cambiado sin que nadie quisiera?». Y lo que Rafa describía como su valor
  (un inventario con ejemplos de dónde está cada cosa) es **otra cosa**: la galería *Uso real*, 25
  capturas que ya se generan solas y tienen gate en `verify`. Se estaba a punto de quitar una
  cosa por la descripción de otra.
· *Dejarlas a mano, como en DD-60* — es el estado peor: 38 ficheros que **parecen** una red y no
  lo son. Es el patrón que esta misma sesión arregló tres veces (los paquetes en junio, la
  pantalla de Deployments, el registro sin comprobar). Un paso que hay que recordar no se ejecuta.
· *Un runner de macOS en el CI* — ya se midió en DD-60 y falla las 38. No ha cambiado nada.

**Consecuencias** · DD-60 sigue en pie en todo lo demás: las tres suites de APP siguen viviendo
solo en el CI, que es donde estaba la cola de una hora. Lo que vuelve es lo que el CI **no puede**
correr, y cuesta 2 minutos.

**El coste que esto reintroduce, dicho aquí y no descubierto luego**: en un portátil solo cabe UN
Playwright, así que devolver `e2e:visual` al `preflight` devuelve la **cola** que DD-60 quitó. La
diferencia es el orden de magnitud: 2 minutos por sesión en vez de 20, y en `preflight:scope` solo
para quien toque el catálogo. Además ya no es un fallo, es una espera: el guardián aguarda a que
la vecina suelte (25 min de techo) en vez de tirar la cadena. Se vio la misma noche de escribir
esto — un preflight esperó a la sesión `numbfish` y agotó el techo, y lo dijo en alto en vez de
mentir. **Si con cuatro sesiones a la vez la cola vuelve a doler, la salida no es quitar la red:
es autohospedar la fuente monoespaciada** (hoy es un stack del sistema, `01-primitive.css:249`, y
aparece DENTRO de la captura en `.sb-snippet pre` y `.sb-host__tag`). Sin esa dependencia de
plataforma, las capturas podrían casar en un runner y volver al CI, que es donde no hacen cola.

## DD-61 · 2026-09-09 — Cada PIEL de `sc-section-card` trae las medidas de SU nodo de Figma, y el maestro del DS es el que manda en la gris

**Contexto** · DD-57 subió el padding de `sc-section-card` de 21 a 24.5 «hacia el valor que la
maqueta del DS respalda», y eso movió también las once cards de los tres formularios de admin.
Rafa pidió contrastar ese número contra la maqueta de esos formularios antes de darlo por bueno.

Al ir a buscarla apareció el problema: **no existe**. En el archivo Supervisor hay una sola
maqueta de formulario de admin («Editar agente — Grupos asignados», 41:5624) y su panel es un
`p-card` con 12/16 de padding — justo el que en el código NO es una `sc-section-card`
(`sc-group-assignment-table`, la tabla que hace de panel entero). De las secciones que sí usan
el componente —Identificación, Permisos, Avanzado— no hay ni un nodo.

Lo que sí existe es el **maestro del DS**: el component set `Section` (691:23956, librería
Smart-Contact Design System), las cuatro variantes idénticas, con sus medidas atadas a
variables. Y dice otra cosa que el 24.5.

**Decisión** ·

1. **`surface="subtle"` toma las medidas del maestro `Section`**: 22.75 arriba y abajo
   (`scale/1-625`), 16 a los lados (`scale/1-143`) y 14 (`scale/1`, el gap de su `Container`)
   entre el título y el contenido.
2. **`surface="card"` conserva las del `Block`** de la maqueta de Agentes (393:12587): 24.5 por
   los cuatro lados (`scale/1-75`) y 16 (`scale/1-143`) entre el título y el contenido. Además su
   cabecera se sangra 12.25 más (`scale/0-875`, el padding que el `Header` 393:12588 se pone a sí
   mismo): es lo que pone el título en la MISMA vertical que el contenido de dentro, mientras los
   divisores siguen cruzando la caja entera.
3. **Ninguna de las dos lleva línea bajo la cabecera.** No está en el maestro ni en el `Block`:
   en los dos, título y contenido los separa aire.
4. **El icono de la cabecera baja a 14** (`SC_ICON_SIZE_DEFAULT`) y la separación icono→título a
   8.75 (`scale/0-625`). Los dos nodos dicen 14 y 8.
5. **`headingLevel` deja de arrastrar el tamaño**: decide la SEMÁNTICA (`<h1>` o `<h2>`) y nada
   más. Los dos niveles miden 14/20 semibold. Lo que distingue al título de la página de los de
   sección dentro de la misma card es su ICONO, que solo lleva la cabecera — que es lo que hace
   la maqueta.

**Razón** · El 24.5 no sale del componente del DS: sale de un marco LOCAL del archivo de
pantallas, que es la variante blanca. Aplicarlo también a la gris es exactamente el fallo que
DD-57 vino a arreglar —dos cajas que derivan— solo que al revés: una caja con las medidas de la
otra. Medido el 2026-09-09 leyendo `boundVariables` en los dos nodos: el maestro ata
`scale/1-625` y `scale/1-143`, el `Block` ata `scale/1-75`. No es interpretación, es el token que
cada uno tiene puesto.

Y el 18/24 del título de página tenía el mismo vicio de origen, en el eje de la tipografía: DD-57
lo justificaba como «el escalón que le toca en la escala del Figma del DS», o sea, lo dedujo de
que la escala TIENE un peldaño `h3`, no de que algún nodo lo dibuje. **Medido el 2026-09-09: en
todo el archivo Supervisor no hay un solo texto por encima de 14** —ni en las cuatro pantallas
principales, ni en el rail, ni en la barra—; la jerarquía la llevan el peso, el color y la caja.
Tres razones convergen y por eso se baja:

- la maqueta pone «Agentes» y «Configuración» en el MISMO estilo, y los separa el icono;
- el icono de la cabecera mide 14 en los dos nodos, y un título de 18 al lado de un icono de 14
  deja el icono corto — este es el argumento que decide, porque es del objeto y no de su origen;
- un input que mezcla semántica y tamaño necesita un párrafo para explicarse; separados, cada
  uno se explica solo.

**Descartadas** ·

- **Dejar 24.5 en las dos.** Es lo que había, y no lo respalda ningún nodo del DS.
- **Bajar también la blanca a 22.75/16.** Rompe la única pantalla verificada al píxel (Agentes,
  393:12562) por igualar dos cajas que Figma dibuja distintas a propósito: una va dentro de un
  formulario y la otra sola sobre el lienzo.
- **Dejar el título de página en 18/24 y anotar la maqueta como discrepante.** Es lo cómodo y
  habría sido defendible, pero la discrepancia estaba en el código: el 18 no lo respalda ningún
  nodo. Se avisó a Rafa y él zanjó igualar a la maqueta.
- **Bajar TAMBIÉN a 14 los títulos de las otras 20 páginas** (`.page__heading`), por coherencia.
  No: ahí el título va SUELTO sobre el lienzo, sin caja que lo acote, y es el único elemento que
  dice qué miras. Además el Figma no modela esos títulos —no existen en él—, así que no hay nada
  contra lo que igualar: los puso DD-33 desde una referencia externa (Snow UI).
- **Sangrar la cabecera con el padding de la caja** (36.75 de una vez) en vez de con un margen en
  su primer hijo. 36.75 no es un peldaño de la tabla 14-base, así que habría que sumarlo con
  `calc`; y el `chevron` de la variante colapsable se ancla al lado contrario, donde esa sangría
  sobra.

**Consecuencias** · Las once cards de los formularios de admin bajan a 22.75/16 y pierden su
línea; la card de las tres pantallas AED se queda en 24.5 y gana la alineación del título con su
contenido, y su título baja de 18 a 14.

`page-identity.spec.ts` pasa a vigilar **dos familias** en vez de una lista sola: título suelto
sobre el lienzo (`.page__heading`) a 18/600 y título contenido en su sección a 14/600, cada una
invariante hacia dentro. La distinción es del CONTENEDOR, no del nivel del documento. El test no
se debilita: seguía existiendo para cazar una regla de página que pisara el tamaño en una ruta y
no en las demás, y eso lo sigue haciendo — antes escondía la diferencia real bajo un
`toHaveLength(1)`. La ficha de `sc-section-card` en sc-docs cuenta ya las medidas de cada piel. Queda
abierto lo que no se puede cerrar sin diseño: **los formularios de admin no tienen maqueta**, así
que su contenido interior sigue sin contrastar contra nada.

## DD-60 · 2026-09-09 — Rápido en casa, completo en GitHub: los e2e salen del `preflight` local y viven solo en el CI

**Contexto** · Rafa trabaja con varias sesiones de agente a la vez, y cada una lanza su
`preflight` antes de pushear. El preflight completo eran 20-25 minutos, y **7 de cada 10 eran
las suites e2e**, que en un portátil solo pueden correr de una en una (`playwright-reuse-guard`:
dos suites a la vez se pisan el servidor y dan verdes falsos). Medido el 2026-09-09: con tres
sesiones vivas, el tercer preflight esperaba una hora, y tres murieron denunciando como
«Playwright vivo» a bucles de espera de la sesión vecina. Ese mismo día `main` pasó a estar
protegida: GitHub no funde nada sin los cinco jobs del CI en verde, así que el CI ya es la red
obligatoria, y allí cada suite tiene su propio runner.

**Decisión** ·
1. `preflight` (y `preflight:scope`) corren la parte SIN navegador: `guard:lockfile`, `verify`,
   `build:docs` y los tres builds AOT (~8 min, sin cola, tantas sesiones como haya).
2. Las tres suites e2e de aplicación (smoke, supervisor, cuscare) corren solo en el CI. Son la
   lista cerrada `CI_ONLY` de `ci-preflight-parity`, vigilada en las dos direcciones. Las
   **baselines visuales de sc-docs** se intentaron llevar a un runner de macOS y **no pueden ir
   allí hoy**: ver «Lo que se midió» abajo. Quedan sin gate, a mano.
3. Quien toque un e2e o algo visual corre a mano la suite que toca antes de pushear (LEARNINGS
   #7). El veredicto sigue siendo el CI leído (`ci:verdict`), y el hook de Stop lo exige.
   *(Enmendado por DD-154, 2026-10-04: en local solo las pruebas del bloque, no la suite entera.)*
4. El carril *preflight:fast* desaparece: su única razón era servir builds estáticos a las suites.

**Razón** · Es la práctica estándar (hooks locales = comprobaciones rápidas, ≤ minutos, para
que nadie las salte; CI = la cadena completa y autoritativa; branch protection = lo que se
impone). Lo que dice Anthropic sobre harnesses y lo que dicen las guías de Playwright y de git
hooks coincide: un hook lento se acaba saltando con `--no-verify`, y aquí ya tenía su salida de
emergencia (`SKIP_PREFLIGHT=1`). El coste real de descubrir un rojo de e2e en GitHub (~10 min,
en paralelo) es menor que el de la cola local.

**Descartadas** ·
- *Dejar el preflight entero y esperar la cola.* Es lo que había; con tres sesiones son 60 min
  por push y el gate se convierte en el motivo para saltárselo.
- *Puertos por worktree y servidores dedicados para correr suites en paralelo.* Arregla la cola
  a cambio de más máquina local, y el CI ya da ese paralelismo gratis (repo público).
- *Un job `e2e-visual` en `macos-latest` que corra las baselines de sc-docs.* Nació en este
  mismo cambio y **se cayó al medirlo**; lo que se midió está abajo.

**Lo que se midió (2026-09-09, run 34401618582)** · El job de macOS falló **las 38 capturas**
(17 tests de métricas pasaron). No es ruido de umbral ni baselines rancias:

- El control: con el MISMO commit y el MISMO build servido en local, `e2e:visual` en el Mac de
  Rafa da **55/55 en verde**. Las capturas del repo están sanas.
- Las diferencias del runner son de 87 a ~1.100 px por captura, y en **37 de las 38 caen
  ENTERAS en una sola banda de 14 px de alto** (y≈47-61): la línea del título, donde sc-docs
  pinta el nombre del selector (`<sc-badge>`) en monoespaciada. La única con algo fuera es
  `textarea` (~1.174 px, las asas de redimensionado del propio navegador).
- La causa es la **fuente**: `--sc-font-family-mono` es una pila del SISTEMA
  (`ui-monospace, 'SF Mono', 'Menlo', …`) y es la única familia que sc-docs no autohospeda —
  Inter y Material Symbols sí lo están, y por eso todo el resto de la página casa. Dos macOS
  distintos resuelven o hintan esa mono con otra métrica.
- Los números enormes del log (17.021 px) eran capturas INTERMEDIAS de overlays aún animándose;
  la captura estable de ese mismo test dio 132 px. No confundirlos con diferencias reales.

Salidas, para el PR que lo retome (ninguna es gratis, y las dos cambian el contrato de la red):
**(a)** quitar la dependencia del sistema autohospedando también la mono (`@fontsource`, como se
hizo con Inter) — cambia la tipografía del código en la doc y en las apps, así que es una
decisión de diseño, y hay que regenerar las 38; **(b)** enmascarar ese rótulo en la captura
(`toHaveScreenshot({ mask })`) — dejaría 37 de 38 deterministas y `textarea` seguiría roja.
Lo que NO vale: subir `maxDiffPixels`, porque un cambio real de UNA letra mide 1.501 px y
quedaría por debajo del techo que haría falta.

**Consecuencias** · `ci.yml` se queda en 9 pasos con nombre (CHECK J; eran 8 al escribirse esto, `agent-mini` entró el 2026-09-11). Las baselines visuales
**no las corre ningún gate**: quien toque sc-docs corre `npm run e2e:visual` a mano antes de
pushear (punto 3). Es el agujero que este DD quería tapar y hoy sigue abierto, dicho aquí para
que nadie lo dé por cerrado. El guardián de reuso deja de contar shells que solo *hablan* de
Playwright (`esRunner`).

## DD-59 · 2026-09-09 — Un registro de despliegue solo puede escribir lo que ha MEDIDO, y el CI guarda la caja negra del rojo

**Contexto** · Al limpiar el fósil de `github-pages` (DD-58) quedó la pregunta de Rafa: si
Cloudflare despliega los cinco sitios y GitHub no se entera de nada, ¿no interesa tener ahí el
registro? Sí, pero la pantalla que acabábamos de borrar llevaba **tres meses** diciendo que el
último despliegue era del 15 de junio. El modo de fallo no es "no había pantalla", es que
**una pantalla que afirma sin medir da una respuesta falsa a quien la pregunta**, y eso es peor
que no tenerla. Y en paralelo: con el auto-merge encendido, un CI rojo pasa a ser lo ÚNICO que
para un merge, y hoy un rojo de e2e era una línea de texto sin nada que mirar.

**Decisión** ·
1. **`deploy-record.yml` no apunta nada al fundir.** Cada app sella su build con el commit que
   la generó (`stamp-build.mjs` → `build.json` en la raíz del sitio) y el registro **pide ese
   fichero a cada sitio y espera hasta ver el commit correcto**. Si a los 20 minutos alguno no
   lo sirve, se registra como **fallo** y el job se pone rojo.
2. **El CI guarda la traza y la captura de Playwright cuando algo falla**, como artifact de 7
   días. Solo al fallar.

**Razón** · El sello es lo que convierte "hemos empujado a main" en "el sitio sirve esto", que
son afirmaciones distintas y solo la segunda es la que responde la pantalla. Medido al
construirlo: `GET https://sc-doc.pages.dev/build.json` devuelve **200 con el `index.html`**,
porque las cinco son SPA con fallback — o sea que un chequeo por código de estado se habría
tragado un falso verde en los cinco sitios a la vez. Por eso la comprobación parsea el JSON y
exige un `commit` de tipo cadena; probado contra los sitios vivos, devuelve `null` en los dos
que se sondearon. Los pasos de artifact van **sin `name:`** a propósito: en este `ci.yml` los
pasos con nombre son los gates, y su número está gateado contra la doc; la caja negra de un
accidente no es un gate.

**Descartadas** ·
· *Apuntar el despliegue al fundir, sin comprobar* — es de una línea, y es literalmente el
  fallo que veníamos de borrar. Habría dado una pantalla siempre verde, incluso con Cloudflare
  caído.
· *Preguntarle a la API de Cloudflare* — es la fuente autorizada y lo diría antes, pero exige
  meter un token suyo en los secretos del repo. El sello no necesita credenciales y además
  comprueba algo **mejor**: no que Cloudflare crea que desplegó, sino que el sitio lo sirve.
· *Comparar el hash del `main.js` construido por el CI contra el del sitio* — no necesita
  tocar nada, pero depende de que Cloudflare y el runner produzcan bytes idénticos (misma
  versión de Node incluida, que en Cloudflare se fija en el panel). Un desajuste dejaría el
  registro en rojo permanente sin que nada esté roto.
· *Nombrar los pasos de artifact* — subiría la cifra de "pasos del CI" de 8 a 11 en cinco
  documentos, y esa cifra significa "lo que tienes que correr antes de pushear". Contar ahí la
  recogida de pruebas de un fallo la haría **menos** cierta.

**Consecuencias** · Los cinco `build:*` de `package.json` terminan en `stamp-build.mjs`: son
los comandos que corre Cloudflare, así que el sello no necesita tocar su panel. **Si alguien
quita ese eslabón, su sitio deja de confirmarse y `deploy-record` lo dirá en rojo** — que es el
comportamiento que se quiere, no un efecto colateral. Queda una incógnita honesta: no se puede
leer desde aquí qué comando exacto tiene configurado cada proyecto en el panel de Cloudflare,
así que la primera ejecución real es la que lo dice; si algún sitio no se confirma, ahí está la
causa a mirar primero.

**Corolario (2026-09-09, primera ejecución real)** · El primer registro puso supervisor en rojo
con el sitio sirviendo el commit correcto: su comando de build en Cloudflare era un `ng build`
suelto, el único de los cinco sin `stamp-build.mjs` detrás, y la incógnita que dejaba el hand-off
(«no se puede leer desde aquí qué comando tiene cada proyecto») resultó ser exactamente el fallo.
Se corrigió por API, y agent-mini tenía además una `NODE_VERSION` duplicando `.node-version`.
Como ningún gate del repo puede ver el panel de Cloudflare, ahora lo lee `audit:cf-config`: los
cuatro ajustes por proyecto contra lo que el repo espera, en local con el OAuth de wrangler y en
`deploy-record.yml` con el secret `CLOUDFLARE_API_TOKEN` (sin secret, el paso lo dice y no afirma
nada). Y el rojo del registro, cuando un sitio nunca mostró sello, apunta a ese comando.

**Ampliado por DD-64** (2026-09-10): la ventana son **35 minutos**, no 20, y un commit al
que `main` ya ha adelantado no se registra — Cloudflare descarta su build encolado y ningún sitio
llega a servirlo.

## DD-58 · 2026-09-09 — El DS corta **1.0.0**, y se descarga por *release*, no por registro

**Contexto** · Rafa abre la pantalla de *Deployments* del repo y ve el último despliegue del
**15 de junio**. Ese entorno (`github-pages`) es un **fósil**: Pages se retiró ese mismo día a
favor de Cloudflare (DD-17) y su workflow se borró en el commit `dbc3603`, así que la pantalla
lleva casi tres meses contando algo que ya no existe. Lo que sí estaba parado de verdad: los
tres paquetes seguían en **0.2.0 (2026-06-14)** con **654 commits** encima, la sección
`[Unreleased]` del CHANGELOG **vacía**, y **cero releases** en un repo **público**. Nadie de
fuera podía descargarse el DS ni enterarse de qué había cambiado.

**Decisión** · Cuatro cosas, en el mismo corte:
1. **Versión `1.0.0`**, con la promesa que trae: la API pública `sc-*` y el contrato `--sc-*`
   rompen **solo en un major**, y cuando rompen se dice en el CHANGELOG con su DD enlazado.
2. **Dos canales, uno por audiencia, y los dos los mueve la misma release**: los tres
   **tarballs adjuntos** (abiertos, un `npm i <url del .tgz>` y ya) para quien viene de fuera,
   y **GitHub Packages** (privado, org `smartcontact-hub`) para quien ya tiene acceso, que lo
   publica `publish-packages.yml` al publicarse la release.
3. **Las notas se LEEN del CHANGELOG**, no se escriben aparte: `scripts/release.mjs` extrae la
   sección de la versión y reescribe sus enlaces relativos a URLs absolutas del tag.
4. **Se borra el entorno `github-pages`** muerto.

**Razón** · El número lo justifica **lo que hay dentro**, medido hoy en este árbol, no el
calendario: **5 aplicaciones en producción** consumiéndolo, **50 componentes** en el inventario
auto-generado, **10 zonas `@sc-gen:*`** que se regeneran desde el export del Kit, y **36 pasos**
encadenados en `verify`. Y hay **cambios que rompen** desde 0.2.0 (Angular 21→22 y PrimeNG
21→22, el `ControlValueAccessor` fuera de los seis campos, los tokens renombrados a los nombres
del Kit, `sc-page-header` retirado): en pre-1.0 esos cambios viajan en un **minor** sin que nadie
tenga que avisar, y eso es exactamente lo que 1.0.0 deja de permitir.

**Descartadas** ·
· *Seguir en 0.x (`0.3.0`)* — honesto con el calendario (la primera decisión de este sistema es
  del 2026-05-13: **cuatro meses**, no un año) pero **deshonesto con el estado**. Un `0.x` le
  dice al que lo instala "esto puede cambiar debajo de ti en cualquier minor", y hace meses que
  no cambia nada debajo de nadie sin un DD que lo explique. La versión describe el **contrato**,
  no el tiempo trabajado.
· *`2.x` o más alto, para señalar madurez* — un major inventado obliga a fingir
  un `1.x` que nunca existió. Lo que se nota es el contenido de la nota, no el dígito.
· *Publicar en el registro A MANO, o no publicar* — descartadas las dos, y aquí está el matiz
  que costó ver. Lo que DD-17 aparcó es el ciclo **DIARIO**: publicar, subir versión e instalar
  cada vez que se toca un token, para consumir el DS **dentro** del repo. Eso sigue aparcado y
  no se reabre: las cinco apps leen de `dist/` por `tsconfig paths` y no instalan nada.
  Publicar **al cortar una versión** es otra cosa: pasa una vez por versión, en un momento en
  que ya has decidido que esa versión existe, y no cuesta nada al día. Con esa distinción, "no
  publicar" solo servía para que el registro se quedara en 0.2.0 mientras el repo iba por 1.0.0,
  que es literalmente lo que había pasado (14 de junio, 0 descargas): el mismo fósil que la
  pantalla de Deployments. Y "a mano" es **cómo se llega** a ese fósil, porque un paso que hay
  que recordar no se ejecuta. Por eso lo dispara la release, no una persona.
  *(Rectificado el mismo 2026-09-09, después de que Rafa señalara la pantalla de Packages: la
  primera versión de este DD descartaba el registro entero, sin separar el ciclo diario del
  publish por release. Se descartaba de más.)*
· *Escribir las notas a mano en la página de la release* — dos textos del mismo anuncio divergen.
  Es la misma clase de fallo que los snippets de `sc-docs` (dos textos, ninguno atado al otro).
· *Revivir GitHub Pages para que la pantalla de Deployments deje de mentir* — sería un **sexto
  sitio** que mantener solo para que una pantalla no engañe. Los 5 sitios vivos están en
  Cloudflare desde DD-17; el fósil se borra, que es lo que arregla el síntoma de raíz.

**Consecuencias** · `npm run release` corta la versión (**dry-run por defecto**, `-- --publish`
para hacerla) y falla antes de tocar nada si el árbol está sucio, tu HEAD no es el tip de
`origin/main`, el tag ya existe, los cuatro `package.json` no van en lockstep o el CHANGELOG no
tiene sección para esa versión. Lo que comprueba es el **commit**, no el nombre de la rama: la
primera versión miraba que te llamaras `main` y eso dejaba el script inservible desde un
worktree, que es justo donde este repo manda trabajar. Lo cazó su propio estreno. Desde aquí, **un cambio que rompa obliga a un major**: el CHANGELOG ya no dice
"pre-1.0, la API puede cambiar entre minors". El README estrena badge de versión y la sección
de descarga; `docs/ROADMAP.md` registra el corte.

## DD-57 · 2026-09-09 — En una pantalla con índice lateral el título va DENTRO de su sección, y esa caja es UNA sola en todo el repo

**Contexto** · La maqueta de `Contact Center · Agentes` (Figma Supervisor 393:12588) pone el
título de la página dentro de la primera sección, con su icono. Se aplicó ahí, y Rafa pidió lo
mismo para el resto de flujos con rail: el título contenido en la sección de ajustes, con la
misma posición, en todos los flujos con índice lateral, y las clases adaptadas donde
corresponda.

Al ir a replicarlo apareció lo de siempre: el patrón **ya existía** en el DS. `sc-section-card`
lo usan los tres formularios de admin desde hace tiempo, con su cabecera de icono + título. Y
`config/aed/*` tenía una copia local llamada `settings-card`, escrita a mano. Dos
implementaciones de la misma caja, ya divergidas: la copia con 24.5 de padding y el componente
con 21.

**Decisión** ·

1. **El título de una pantalla con rail lo pinta `sc-section-card`**, nunca una etiqueta suelta.
   Contenido, el título ACOTA su caja —que es lo que hace un título— y arranca en la misma línea
   que el rail en vez de 16px más abajo.
2. **El componente gana dos ejes**, porque las dos variantes eran la misma caja con otra piel:
   - `headingLevel` (`2` por defecto, `1` para el título de la página). El nivel arrastra el
     tamaño: `1` usa los tokens `h3` (18/24) y `2` los de `body` semibold (14/20). Tres escalones
     legibles: 18 la página, 14 semibold la sección, 14 regular el contenido.
   - `surface` (`subtle` por defecto, gris de formulario; `card` blanca con borde, la sección que
     va sola sobre el lienzo).
3. **`settings-card` se borra.** Las tres pantallas AED usan el componente; con ella se van
   `__foot`, `__link` y `__actions`, que llevaban tiempo sin aparecer en ninguna plantilla.
4. **Lo vigila `audit:titulo-contenido`** (gate 36), en las dos direcciones: las pantallas con
   rail llevan su título dentro, y ninguna otra plantilla se pone el nivel de página.

**Razón** · Lo que pidió Rafa no era replicar el HTML en dos sitios más: era mantener la
consistencia con todo vinculado, para que los cambios sean lo más automáticos posible. Copiar
el patrón a mano en tres pantallas es exactamente lo contrario — a la tercera copia ya hay dos
que derivan, que es lo que había pasado con el padding.

Los números salen de la maqueta, no de gusto: `Block` 393:12587 son 920 de ancho, radio 12,
padding 24.5 y gap 16 entre secciones; el `Header` 393:12588 lleva el icono a la izquierda del
título. Tras el cambio, la pantalla casa con esas medidas SIN una sola diferencia (medido en el
build: ancho, padding, gap, radio y borde de las ocho cajas de la pantalla).

**Descartadas** ·

- **Copiar el patrón a servicio y grupos con `settings-card`.** Es lo rápido y deja tres copias.
- **Migrar sin `surface`**, aceptando el gris del componente. Probado y descartado en pantalla:
  `sc-section-card` es el contenedor gris de formulario (sus subsecciones blancas destacan sobre
  él) y el `Block` de la maqueta es blanco con borde, porque va solo sobre el lienzo. No son la
  misma piel, aunque sí la misma caja.
- **Aplicarlo también a los tres formularios de admin.** Su `<h1>` está oculto A PROPÓSITO: la
  identidad la pinta la ficha de su propio rail, y un título visible más sería el duplicado que
  S59 ya quitó (`page-identity.spec.ts`, punto 4). Quedan fuera, y el guardián lo dice.

**Consecuencias** · El padding de `sc-section-card` sube de 21 a 24.5 y el de su cabecera se
reparte para dejar los 16 del gap: eso mueve también las once cards de los formularios de admin.
⚠️ **Esa última parte la corrige DD-61**: el 24.5 sale del `Block` de la maqueta de Agentes, que es
la piel BLANCA; el maestro `Section` del DS —la piel gris que usan los formularios— mide 22.75/16.
Aquí decía «hacia el valor que la maqueta del DS respalda» y no era así. `settings-card` deja de
existir. Y el subtítulo
«Ajustes de la plataforma» del rail se retira: no está en la maqueta y repetía lo que ya dicen el
rótulo, la miga y el título.

## DD-56 · 2026-09-09 — Un enlace en un ticket apunta a una versión CONGELADA, no a la URL viva

**Contexto** · Los cinco sitios sirven `main`, así que su URL enseña siempre lo último. Rafa pegó
enlaces a esas URLs en Confluence y en Jira, y el problema es de fecha, no de contenido: el
desarrollador que abre el enlace semanas después ve una pantalla que ya no es la que especifica su
ticket, y no tiene forma de saber que está mirando algo posterior. Su propia preocupación al
plantearlo: que la alternativa obvia (una rama por entrega) le deje, con el tiempo, muchas
ramas desfasadas que nadie usa.

**Decisión** · Tres piezas, ninguna con mantenimiento:

1. Una **etiqueta** `proto/<TICKET>` sobre el commit exacto. Es el registro durable.
2. Una **rama** `proto/<ticket>` creada desde esa etiqueta que **no se toca nunca más**.
   Cloudflare le da su preview solo, y esa URL sirve ese build para siempre.
3. Una **fila** en `docs/PROTOTIPOS.md`, que es lo que se enlaza desde Jira o Confluence en vez
   de la URL viva: dice de qué fecha es y qué cubre.

`npm run proto:freeze -- --ticket … --app … --que …` hace las tres cosas y NO pushea: imprime los
dos comandos, porque un push sobre este árbol exige su preflight. `npm run proto:check` entra en
`verify` (gate 35) y exige la biyección: cada fila con su etiqueta y cada etiqueta con su fila.

**Razón** · La preocupación de Rafa es correcta para una rama VIVA y no aplica a una congelada. Lo
que hace cara una rama de larga vida es tener que rebasarla, resolver sus conflictos y decidir qué
entra; una rama que nadie mergea ni actualiza no hace nada de eso. Su coste de mantenimiento es
literalmente cero, y si algún día estorba se borra y la etiqueta —que es lo que importa— sigue
estando. La tabla es lo que impide el otro fallo, el silencioso: una URL congelada sin registro es
un enlace que nadie sabe a qué corresponde.

**Descartadas** ·

- **Apuntar el proyecto de Cloudflare a la rama de la entrega.** Deja el sitio huérfano en cuanto
  esa rama se borra al mergear, y la URL sigue sirviendo el último build sin avisar. Ya pasó dos
  veces aquí, con `feat/cuscare` y con `agent-mini` (que se quedó clavado en
  `worktree-agent-mini` hasta el 2026-09-01). La *production branch* de los cinco se queda en `main`.
- **La URL inmutable por deployment de Cloudflare** (`<id>.<proyecto>.pages.dev`). Existe, pero su
  identificador es un hash del deploy que solo se saca del dashboard o de la API — probado el
  2026-09-09 con el SHA del commit y da 404, y el token OAuth de `wrangler` estaba caducado. Un
  mecanismo que depende de ir a buscar un id a otro sitio no se usa cuando hay prisa.
- **Un banner de versión en la app viva, en lugar de la tabla.** No sustituye: el que llega por el
  enlace equivocado ya está mirando la pantalla equivocada. Cabe como complemento, no como el
  mecanismo.

**Consecuencias** · La URL de producción deja de ser lo que se pega en un ticket. Al entregar hay
un paso más (`npm run proto`, tres preguntas), y a cambio el enlace no envejece.

**El aviso en la app viva: NO, y con fecha** (Rafa, 2026-09-12). La tabla de `docs/PROTOTIPOS.md`
sigue VACÍA: un aviso que apunta a una tabla sin filas no ayuda a nadie y añade una franja
permanente a una app que sí se usa. Se reabre el día que haya una versión congelada de verdad;
hasta entonces esto deja de ser una pregunta abierta.

Dos cosas salieron al probarlo de punta a punta, y las dos eran del mismo tipo: la herramienta
estaba escrita para quien la escribió.

- **Los flags no se memorizan.** La primera versión pedía `-- --ticket … --app … --que …` y Rafa
  dio con el problema en cuanto la vio: exigía aprenderse los comandos. Algo que se usa
  una vez cada entrega no puede exigir recordar tres flags y un `--`. `npm run proto` pregunta.
- **El pre-push habría cobrado 10-25 minutos** por subir dos punteros a un commit que ya pasó su
  preflight y su CI al entrar en `main`. Un trámite que cuesta eso no se hace: se acaba usando
  `SKIP_PREFLIGHT=1`, que sí desactiva el gate. El hook gana un atajo estrecho y COMPROBADO (todas
  las refs `proto/*` y su commit antepasado de `origin/main`), probado también con el commit fuera
  de main, donde no salta.

## DD-55 · 2026-09-09 — Los estilos de texto se ponen a lo que NO es un componente

**Contexto** · Al instalar los 12 estilos de texto del Figma como clases `.sc-text-*` aparece la
pregunta de dónde se aplican. Rafa lo zanjó con el motivo: los estilos de texto no se anclan a los
componentes, para respetar la estructura y la arquitectura de PrimeNG tal como las tiene el DS y
que el tema se lea automáticamente. La maqueta lo hace exactamente así.

**Decisión** · Una clase `.sc-text-*` se pone al texto de la PÁGINA. Nunca en la etiqueta de un
`<sc-*>`. El contenido proyectado dentro de un componente (`<sc-dialog><p class="sc-text-…">`) sí
puede llevarla: ese texto es de la app, no del componente. Si el texto de un componente tiene que
verse distinto, se mueve su TOKEN. Lo vigila `audit:text-styles` §3, probado con el fallo puesto.

**Razón** · El dato está en la propia maqueta (Supervisor 393:12562, medida el 2026-09-09): de sus
**43 textos**, los **25** de página llevan text style anclado y los **18** que viven dentro de un
componente (breadcrumb, botones, checkbox, badge) no llevan **ninguno**. No es descuido: es lo que
mantiene al componente leyendo el tema. Y en código el mecanismo es literal — el preset vive en
`@layer primeng` y una clase de app va sin capa, así que **sin capa gana siempre** (DD-50): una
clase encima no «ajusta» el componente, lo desconecta del canal por el que un cambio de token
llega solo a los 85.

**Descartadas** ·

- **Aplicar la clase también a los componentes, «por consistencia».** Es la que rompe el sistema:
  cada componente vestido a mano deja de responder al tema y hay que repetir el cambio en cada
  sitio. Es el mismo error que la Sección E de `audit:primeng-coupling` ya vigila por la otra
  puerta (meterse DENTRO); esto lo vigila por la de encima.
- **No escribir la regla y confiar en la revisión.** El repo ya tiene el precedente: la regla de
  «datos inventados» estaba escrita en dos cabeceras de fichero y aun así se saltó en el tercer
  seed (DD del 2026-09-07). Una regla de composición que no corre no es una regla.

**Consecuencias** · Las primitivas de app que aún no migran (`field__label`, 29 usos en 7
pantallas; `sub-section__title`, 8 en 3) se quedan declarando tipografía, pero pasan a leer los
mismos TOKENS DE ROL que resuelve la clase: el día que se barran, la clase entra sin mover un
píxel. Queda pendiente ese barrido y el de `page__heading`.

## DD-54 · 2026-09-09 — La escala tipográfica que manda es la de la LIBRERÍA del DS, no la del archivo de pantallas

**Contexto** · La maqueta `Contact Center · Agentes` (Supervisor 393:12562) usa estilos de texto
anclados y Rafa pidió empezar a instalarlos. Al medirlo aparecieron **cinco familias de estilos de
texto** conviviendo en ese archivo: los 12 de la librería `Smart-Contact Design System`, 12
**locales** del archivo Supervisor (`display1`, `H1`..`H4`, `body1/2`, `subtitle1/2/3`, `caption`,
`caption bold`) y tres más remotas de otra librería (`subtitle1`, `body-2`, `caption-bold`, y una
familia nombrada por tamaño: `14 Regular`, `12 Regular`). La maqueta enlaza las **locales**; el
código tenía instaladas las de la **librería** (PR #62). Y para rematar, los tokens de rol de
`02-semantic.css` llevan los NOMBRES de la familia local (`subtitle-1`, `body-1`) con los VALORES
de la de librería: por eso «subtitle1» medía 16/24 en código y 14/22 en el Figma que se miraba.

**Decisión** · Manda la **librería del DS**: Display 64/78 · h1 48/58 · h2 24/36 · h3 18/24 ·
Body 14/20 · Caption 12/18, en Regular y Semibold. Es la que ya estaba en código, así que la escala
no se mueve. Los 12 estilos locales del archivo Supervisor **no** se adoptan.

**Razón** · Decisión de Rafa, tomada sobre las dos listas enfrentadas con sus números. Lo que la
sostiene técnicamente: los 12 de la librería declaran sus `boundVariables` contra
`primitive/typography/font/size/*` y `line/height/*`, o sea que cada estilo dice de qué variable
cuelga y esa variable es la misma que nombra el token de rol — la cadena es comprobable de punta a
punta, y por eso se pudo gatear (`audit:text-styles`). Los 12 locales no son librería: viven
sueltos en un archivo de pantallas, así que CusCare o Agent no podrían usarlos aunque quisieran.

**Descartadas** ·

- **Adoptar los 12 locales del Supervisor** (lo que se recomendó primero, y Rafa descartó). Tienen
  los pasos intermedios que una app de gestión agradece (15px, `subtitle3`, un H4), mientras la del
  DS salta de 24 a 48 sin nada en medio. Pero exigía subirlos antes a la librería y añadir los
  pesos Medium y Bold, que el DS no publica.
- **Mantener las dos y elegir por pantalla.** Es el estado actual y es justo el que produjo el
  cruce nombre/valor de `02-semantic.css`.

**Consecuencias** · `--sc-font-size-300` (16) se queda **sin text style detrás**: los títulos que
lo usaban suben a `h3` (18/24) o bajan a `body` (14/20). Se ve en esta entrega — el título de la
card de Agentes, el rótulo del rail y `settings-card__title` se recolocaron por eso. Y una
desviación de trazabilidad que salió al medir: `--sc-line-height-body-2` colgaba de
`--sc-line-height-220`, un peldaño que **no existe en el export del Kit**, mientras Figma ata
`Body/*` a `line/height/200`. Mismo valor (20px), cero cambio visual, pero un rol que Figma ata no
puede colgar de uno inventado; corregido y vigilado.

## DD-53 · 2026-09-06 — La composición de pantalla se escribe donde el agente la lee: el molde sube a los partials, el constructor de reglas entra en él, y lo deliberado queda dicho

**Contexto** · Un vídeo sobre preparar la documentación de un Design System para la IA sostiene
que hay que ESCRIBIR las reglas de composición: regiones con nombre, patrón de formulario,
excepciones con su porqué. Medido aquí, las reglas ya existían —en comentarios de SCSS y en este
mismo fichero— pero **ninguno de sus nombres** (`app-shell`, `page__inner`, `_page.scss`,
`TopBarSlotService`) aparecía en `AGENTS.md` ni en `CLAUDE.md`, que es lo que lee un agente.
Existían y no se leían: por eso dos veces seguidas afirmé que no existían. Midiendo salieron
cuatro cosas más: el molde del formulario con rail estaba declarado **tres veces byte a byte**;
la cabecera de `_page.scss` decía haber cerrado siete anchos y había cerrado cinco (1100 seguía
vivo ×3 y 78rem ×1); el constructor de reglas era la única página **sin arquetipo**; y
`--sc-form-panel-top` se usaba nueve veces **sin estar definido en ninguna**.

**Decisión** ·

1. **El molde vive en un sitio.** `.page__inner--with-panel` y `.page__form` (1100) en
   `projects/supervisor/src/styles/_page.scss`; `.ipanel` en `_forms.scss`, junto a `.ficha` e
   `.ipanel__delete`, que ya estaban ahí por el mismo motivo. Las tres páginas se quedan con su
   fondo y un puntero. Se borra su `padding` base de `.page__inner`: era código muerto (las tres
   plantillas llevan siempre el modificador, que lo anula) y dejarlo era la trampa, porque lo
   scoped le gana a lo global. **No-op demostrado**, no prometido: mismos computados en las tres
   altas a 1440 (grid `240px 1136px`, padding 0, `max-width: none`, columna a 1100 con padding
   24.5/28, rail 240) y mismos altos de página (430, 658, 371).
2. **Lo que aparentaba anclar el rail se retira.** `--sc-form-panel-top` no existe: 9 usos, 0
   definiciones, así que `top` y `height` eran inválidos y caían a `auto` (medido en navegador:
   `top: auto`, alto 302px de contenido). Y la banda `sticky-form-header` cuyo alto justificaba
   ese offset tampoco existe: la retiró S59 y solo quedan comentarios nombrándola. Anclarlo de
   verdad se deja FUERA, con su medición: de las cinco secciones del formulario de agente solo
   una llega a scrollear (1311px contra un viewport de 809), así que no compensa inventarle un
   valor. Los dos usos que quedaban vivían en `.form-grid`, que resultó ser CSS muerto entero
   (la clase aparecía 3 veces en el repo, las tres en su propio fichero de estilos, y ninguna
   plantilla la usaba): se borró el mismo día, así que el token ya no lo nombra nadie.
3. **El constructor de reglas entra en el molde**, con PESTAÑAS y una sección a la vez, como sus
   tres hermanos de admin. Cae su rejilla propia de 78rem y la numeración 01/02/03 de las
   tarjetas, que con una sola visible no ordenaba nada. El impacto sube al rail, **debajo** del
   índice: antes era una columna hermana que se iba con el scroll justo mientras tocabas las
   condiciones que lo mueven, y puesto encima hundía la navegación (mide 350px). Aterrizajes:
   alta en General, edición en Alcance, y el enlace desde una categoría en Análisis IA.
   La etiqueta de la primera sección pasa de «Información básica» a «General» en los cuatro
   idiomas: el cuadro mide 99px y el texto pedía 108, y cortar no es una opción.
   **Su motivo caducó el mismo día**, y conviene saberlo: DD-52 hizo que el índice ENVUELVA en
   vez de recortar, así que ese corte ya no ocurriría. La etiqueta corta se queda igualmente
   —«General» nombra bien lo que hay ahí y es lo que usan sus tres hermanos—, pero se sostiene
   por sí sola, no por el defecto que la motivó. Si alguien la revierte buscando el problema
   original, no lo va a encontrar.
4. **La barra de acciones sticky de agentes, usuarios y grupos es DELIBERADA.** Su motivo vive
   en el ledger de la PLATAFORMA (entrada 43, 2026-05-07): son las tres listas con gestor de
   columnas, y la búsqueda ahí es iterativa. Etiquetas, plantillas y repositorios van planas a
   propósito. **No se unifica en ninguna dirección** — es exactamente la clase de divergencia
   con dueño que DD-36 existe para que nadie borre creyendo que es un descuido.
5. **`page__search` suelta un `position: relative` muerto** en cuatro listas: los hijos absolutos
   de `sc-search` resuelven contra el wrapper del propio componente, no contra él. El control es
   la lista de agentes, que nunca lo tuvo y coloca el atajo en la misma x. Plantillas además se
   normaliza de 288px fijo a 480 flexible: aquel fijo no tenía ni DD ni comentario ni entrada en
   ningún ledger.
6. **Escritorio primero, sin colapso móvil.** Mínimo soportado 1024. Los cortes que hay (640 en
   la barra, 1024 en el rail) son locales, no una política de breakpoints; no había ninguna
   decisión escrita al respecto en este repo y ahora la hay.
7. **`DD#nn` no es `DD-nn`.** Con almohadilla, en comentarios de código, apunta al ledger de la
   plataforma; con guion, a este fichero. Misma cifra, tema distinto: `DD#43` es la barra sticky
   y `DD-43` es por qué no se extrae una base común admin. No se renumeran: son identificadores.
8. **Vigilancia**, porque lo que no tiene gate se pudre: `audit:page-anatomy` (arquetipo
   declarado, molde no re-declarado, trinquete de anchos sueltos), el check L de `docs:coherence`
   (la barra de UX de pantalla cuadra con su página navegable) y el check M (la cifra de gates
   deja de caducar a mano).

**Razón** · Las mediciones de arriba. La de fondo: DD-47 ya demostró que la guía leída en t=0 no
dispara en t=decisión, así que esto NO añade prosa nueva — añade punteros en el sitio que se lee
en cada turno, un índice temático sobre un log que estaba ordenado solo por fecha, y tres gates.

**Descartadas** ·
- *Unificar la barra de acciones.* Borra una decisión con dueño y motivo escrito (DD-36).
- *Promover el bloque de `page__search` a global.* Es un one-liner repetido: se escribe, no se
  extrae (DD-43 lo dice con esas palabras).
- *Eximir al constructor de reglas del molde.* Considerada y descartada por Rafa: la
  consistencia con sus tres hermanos vale más que conservar su rejilla propia.
- *Un índice que salta a la sección en vez de pestañas.* Exigiría un mecanismo de scroll-spy que
  el sistema no sirve hoy, y se alejaría del molde en vez de acercarse.
- *Definirle un valor a `--sc-form-panel-top` para que el rail se ancle.* Sería inventarse un
  número: la banda que lo justificaba no existe y solo una de cinco secciones scrollea.
- *Un doc nuevo de composición.* Nada lo cargaría, y `docs/` ya tiene 20 ficheros y dos
  auditorías de documentación.

**Consecuencias** · `verify` pasa a 30 eslabones, y esa cifra ya no caduca sola: al escribir el
check M se midió que vivía en **once** sitios con tres valores distintos conviviendo (34, 29 y
26 cuando eran 29). Los `docs/handoff/` quedan exonerados a propósito: son partes fechados.
La captura de la galería de uso se regenera, y con pestañas una sola captura ya no puede enseñar
todos los componentes de una página, así que `usage:check` avisa de `sc-textarea` — le pasa igual
a los tres formularios de admin desde que son pestañas. Y el nombre del token fantasma solo
sobrevive en dos sitios a propósito: el comentario de `.ipanel` que cuenta la historia, y la
lista de tokens retirados de `docs:coherence`, que es la que permite nombrarlo en la doc.
## DD-52 · 2026-09-06 — El índice del rail ENVUELVE: un componente de navegación no esconde el nombre de su destino

**Contexto**: `sc-form-section-nav` truncaba con elipsis. Su propio SCSS lo
declaraba como intención: «el ancho del rail define la truncación, no la
longitud del copy». Medido en el Supervisor a 1440×900 con el rail de 240px
(`.page__inner--with-panel`, duplicado hoy en los SCSS de los tres form-pages),
la caja de texto mide 99px, o 74px si el item lleva punto de error. Con ese
presupuesto **cortaban 13 de las 48 etiquetas** de los tres formularios en los
cuatro idiomas: «Servicios asignados» pide 114px, «Agentes asignados» 108,
«Grupos asignados» 103, y «Identificación» 79 contra los 74 que le dejaba el
punto. Solo 5 de las 13 eran del español: la restricción se rompía sola al
traducir. Se venía esquivando POR PÁGINA, acortando el copy hasta que cupiera.

**Decisión**: el label envuelve y **nunca** se recorta. La fila crece de alto
antes que esconder el nombre de la sección; el ancho del rail decide dónde parte
la línea, nunca QUÉ se ve. El punto de error deja de ser hermano flex y pasa a
fluir DENTRO del label, así que la caja de texto conserva sus 99px también en la
sección que tiene el error.

**Razón**: un índice existe para decir a dónde vas. «Servicios asign…» no lo
dice, y el coste de leerlo se paga en cada visita. La elipsis además convertía
una restricción del componente en un impuesto invisible sobre quien redacta: el
parche que funcionaba era acortar el copy, que ni escala a cuatro idiomas ni
queda registrado en ningún sitio donde el siguiente redactor lo vea. Envolver
mueve el coste a donde es barato — 8px de alto de fila en un rail que ya es
`sticky` a altura de viewport — y lo hace visible en vez de silencioso.
Verificado: 48/48 etiquetas sin recorte en 3 formularios × 4 idiomas, y 144
medidas sin recorte ni desbordes en el barrido de 768/900/1024/1280/1440/1600
(`e2e/supervisor/form-section-nav-legibility.spec.ts`, que enrojece con el
`nowrap` puesto).

**Descartadas**:

- **Ensanchar el rail (240 → ~264px)**: compra 15px, que es exactamente el
  déficit del peor caso de HOY. No es una regla, es un margen; la siguiente
  traducción larga lo agota y volvemos aquí. Además el 240 es parte del molde
  compartido de los formularios, así que moverlo cambia las cuatro páginas para
  arreglar una etiqueta.
- **Tooltip con el texto completo**: resuelve el acceso al dato, no la
  legibilidad de un vistazo, que es lo que un índice vende. Y pide hover, que en
  táctil no existe.
- **`line-clamp: 2`**: devuelve la elipsis en la línea 3, o sea el mismo fallo
  con más pasos.
- **Seguir acortando el copy por página**: es el statu quo, y es lo que motivó
  esta entrada.

**Consecuencias**: la fila deja de tener alto fijo (53px con una línea, 61px con
dos), así que cualquier medida que asuma altura uniforme en el rail hay que
releerla. `overflow-wrap: anywhere` queda como red para la palabra suelta más
ancha que la caja. El punto de error se lee ahora pegado al final del texto en
vez de alineado al borde derecho de la fila.

---

## DD-51 · 2026-09-05 — El interlineado de los CONTROLES vuelve a la métrica de la fuente; la rampa se queda solo donde el Kit la ata

> **Acotado por DD-91 (2026-09-14).** Los maestros de control de Figma atan ya su interlineado a la
> rampa, y el tema los sigue: las dos familias vuelven a ser una. Lo de abajo explica por qué hubo
> `normal` mientras Figma dibujaba `AUTO`.

**Contexto** · Rafa, mirando el Supervisor contra su Figma, vio que los botones seguían con el tamaño
desviado y lo marcó como inaceptable en la plataforma: o algo sobrescribía mal, o sc-docs ya partía
mal del DS. No era el consumidor: **sc-docs, que es el DS puro, salía
igual de desviado**. Medido en el deploy y contra los maestros del Kit con el Desktop Bridge.

**Dato que decide** · El padding, el `font-size` y el borde casaban EXACTOS con Figma en los tres
tamaños. Todo el sobrante era el `line-height`, y el reparto no era uniforme:

| Maestro del Kit | line-height en Figma | lo que ponía el tema |
| --- | --- | --- |
| button md/sm/lg, inputtext, select (trigger y opción) | `AUTO` (17 / 15 / 19 en Inter) | rampa 20 / 18 / 24 |
| chip | atado a 20 | 20 ✔ |
| tag | atado a 18 | 18 ✔ |
| toast summary / detail | atado a 20 / 18 | 20 / 18 ✔ |

O sea: el Kit **sí** arbitra el interlineado de las etiquetas, y **no** el de los controles — ahí
dibuja lo que da la fuente. El tema aplicaba la rampa a los dos grupos por igual, y de ahí los
3px de más en md y sm y los 5 de lg. Alturas: botón md 36 contra 33, sm 30.5 contra 27.5, lg 43.5
contra 38.5, campo 36 contra 34. El icon-only lo confirma por partida doble: Figma lo dibuja
35×33, 28×27.5 y 42×38.5, o sea **tampoco cuadrado**, y con el arreglo el código cae en esas
mismas cifras.

**Decisión** · `css.ts` parte su regla en dos familias. Los CONTROLES reciben el `font-size` del
Kit y `line-height: normal`; las ETIQUETAS (chip, tag, toast, breadcrumb, context-menu) siguen
leyendo `app.typography.*.line-height`. El token de `extend.ts` no cambia de valor: cambia de
clientela.

**Por qué `normal` y no quitar la regla** · Quitarla dejaría a los controles heredando el
`line-height` del body de cada app (1.5 en el supervisor, o sea 21px a 14): peor que la rampa, y
justo lo que DD-39 vino a evitar. `normal` desacopla igual del body y además es exactamente lo que
significa el `AUTO` de Figma. Esto **acota DD-39**, no lo revierte: el 20 sigue siendo el
interlineado md del sistema, y lo siguen leyendo el cuerpo y las etiquetas.

**Consecuencias medidas** · Botón md 33, sm 27.5, icon-only 35×33 y 28×27.5, chip 34 y tag 25 sin
moverse. La fila de tabla-lista del supervisor pasa de 56 a 53 porque su contenido más alto es el
kebab (`list-table-grammar` actualizado). Dos flecos quedan ANOTADOS y sin tocar, porque no son
interlineado: el botón lg sale 39.5 contra los 38.5 de Figma (Inter da 19.5 a 16px y el Kit
redondea a 19), y el `tag` mide 25 contra 21.5 por su `padding` vertical (3.5 contra 1.75).

**Lo que retira este DD** · El `.p-button { line-height: normal }` que el consumidor tenía y que
`cf7abab` (PR #40) quitó estaba produciendo los 33px del diseño. Se retiró con el argumento de que
el Kit modela botón y campo como la misma caja: cierto para el padding, pero el Kit no modela el
interlineado del botón, así que aquel parche compensaba esta desviación real. El arreglo bueno era
este, y vive en el tema, no en la app.

## DD-50 · 2026-09-05 — El estilo del overlay de un wrapper vive en SU componente del DS, y el CSS de app sin capa sobre `.p-*` pasa a trinquete

**Contexto** · `cf7abab` retiró un `.p-button { line-height: normal }` del supervisor y el botón
pasó de 33px a 36. La causa no era un token: era que una hoja global de app va SIN CAPA y el preset
va en `@layer primeng`, y en CSS lo sin-capa gana SIEMPRE a lo en-capa, sin mirar especificidad.
Quedaba por repasar el resto de esa capa. Recorriendo `document.styleSheets` y separando por
`CSSLayerBlockRule` sobre 8 rutas del supervisor salieron **67 colisiones** (regla sin capa que pisa
una propiedad que el tema también publica para un selector solapado): **52 del supervisor** y 15 de
componentes del propio DS.

**Decisión** · Dos cosas.
1. **Los estilos del panel overlay de un wrapper del DS viven en el SCSS de ese componente**, no en
   un partial global del consumidor. Se retira `projects/supervisor/src/styles/_sc-overlay-sizes.scss`
   y sus bloques van a `sc-select`, `sc-multiselect` y `sc-datepicker`.
2. **El CSS de app sin capa sobre selectores `.p-*` pasa a tener tope por app**, vigilado en
   `audit:primeng-coupling` (sección D). Hoy: supervisor 26, el resto 0.

**Razón** · La clase que estiliza el panel (`sc-select-panel--sm`…) la EMITE el componente del DS
(`createScPanelSizing` en `sc-field.ts`, vía `panelStyleClass`), así que tenerla estilada solo en un
consumidor deja al resto aplicando una clase que no estiliza nadie — verificado: `sc-multiselect` y
`sc-datepicker` no tenían esos bloques en el DS. Además el bloque de `select` estaba DUPLICADO en los
dos sitios con el mismo valor, uno tokenizado y otro en px a pelo, y **cuál ganaba lo decidía el
orden de inserción de las hojas** (medido: ganaba el del DS, por ir en posición 30 del `<head>`
contra la 2 del `styles.css`). Nadie había decidido eso. Los cinco px literales del partial
(5.25 / 8.75 / 12.25 / 24.5 / 31.5) tienen token exacto en la escala v/14, medido en runtime.

**Descartadas** ·
- *Llevarlo al preset (`sc-preset/`)* — no cabe: `sc-*-panel--sm` es una clase inventada por el DS,
  no un `--p-*`; el preset no tiene forma de expresarla.
- *Envolver el CSS de app en un `@layer`* — arreglaría el reglamento del cascade de golpe, pero
  cambia quién gana en las 52 colisiones a la vez, incluidas las deliberadas. Es un cambio de
  comportamiento global disfrazado de refactor; queda para una sesión que pueda medirlo entero.
- *Retirar también la rampa sm/lg del panel* — el Kit NO la modela (`list.option.padding.x/y` es un
  valor único, y `datepicker.date.width/height` es `{scale.2}` = 28px sin variante), así que la rampa
  es una decisión del DS por encima del Kit. Pero quitarla cambia pantallas vivas: es rediseño, no
  retirada de acoplamiento. Se conserva, con el silencio del Kit escrito al lado.
- *Un gate nuevo, propio* — la sección D cabe en `audit:primeng-coupling`, que ya vigila la misma
  familia de fragilidad y ya está en `verify` y en `ci.yml`; un script nuevo habría arrastrado la
  paridad preflight≡ci.yml y el conteo de pasos en la doc sin comprar nada.

**Consecuencias** · El supervisor baja de 52 colisiones a **28**, todas deliberadas y todas con un
comentario que dice que pisan al tema a propósito (micro-interacciones DD#21, item destructivo del
menú, popover del switcher, y las dos pieles de tabla). Cero cambio visual: las medidas de los
paneles `sm` y la huella de 6 rutas (altura de botón, campo y fila, padding de celda y cabecera)
salen idénticas antes y después. sc-docs, agent y cuscare ganan el tamaño de panel que ya pedían con
la clase. El tope de la sección D solo se sube escribiendo en el commit a cuál de los tres cubos
pertenece la regla nueva: deliberada, parche caducado o del sistema.

> **Sustituida en parte por DD-97** (2026-09-14): la rampa sm/lg de cabecera, lista y opciones del panel
> se retira y esas partes siguen al tema, como en Aura; solo el buscador conserva la talla del trigger.

---

## DD-49 · 2026-09-04 — Ante una diferencia Figma↔web, primero se pregunta QUÉ LADO MANDA; y el que no tiene canal no manda nunca

**Contexto** · El mapa de conexión de variables (816 filas, 18 componentes, medido contra el Kit y
el CSS que sirve `ui.smart-contact.com`) dejó 8 filas donde el dibujo del Kit y el tema no decían
lo mismo. El instinto, y lo que yo propuse, fue tratarlas como una lista de arreglos: «¿lo
corrijo?». Rafa lo paró: no se corrige nada sin analizar antes qué lado debe mandar, la web o Figma;
el objetivo era ver las diferencias de conexión para que el tema las lea, nada más.

**Dato que decide** · Al reencuadrar la pregunta apareció lo que la versión «¿lo arreglo?»
escondía. En `button-small`, 143 de 311 variantes pintan el icono DERECHO con la variable gris de
la librería externa; parecía un fallo de conexión de manual. Medido en su deploy: **42 de 42
iconos de botón toman exactamente el color de su botón, cero excepciones, y no existe ninguna
regla CSS que dé color propio a `.p-button-icon`**. PrimeNG **no tiene canal** para eso. El Kit
está dibujando algo que no puede ocurrir: no había nada que conectar.

Y el patrón se repitió en las cinco filas abiertas: **el valor llega bien a producción en todas**,
porque el tema se genera desde las VARIABLES y no desde las capas. Lo que va por detrás es el
dibujo. Tres de las ocho, además, ni siquiera eran hallazgos.

**Decisión** ·

1. **Encontrar una diferencia no dice quién tiene razón.** Antes de anotar «esto está mal» se
   decide qué lado es el correcto, y se decide midiendo, en este orden:
   1. **¿Existe el canal en el CSS del proveedor?** Si PrimeNG no tiene token para eso, manda la
      web por construcción y el Kit está pidiendo un imposible.
   2. **¿Qué valor publica el tema, medido en el deploy?** Si la variable es correcta, el valor
      llega aunque ninguna capa la use.
   3. **Solo entonces, ¿qué dibuja el Kit?** Si difiere, la divergencia es del dibujo.
2. **Deuda de dibujo y deuda de conexión no son lo mismo y no corren la misma prisa.** La de
   dibujo no rompe producción; engaña a quien lee el Kit. Se anota, no se prioriza como un fallo.
3. **Los descartes se anotan con su motivo.** Veredicto propio (`no es un hallazgo`) en el mapa.
4. **Esto ACOTA DD-48, no lo contradice.** DD-48 dice que Figma manda **en las escalas**, y sigue
   siendo así: es sobre a qué paso apunta cada rol. Aquí se decide otra cosa, sobre qué lado tiene
   razón cuando dibujo y tema difieren. Leer DD-48 como «Figma manda siempre» lleva a atar cosas
   que no pueden viajar.

**Razón** · La regla vieja implícita («si difieren, arréglalo en Figma») presupone que la
diferencia siempre significa un fallo de conexión. Medido, casi nunca lo es: de 8 casos, 3 no eran
hallazgos y los 5 restantes eran dibujo. Actuar sobre esa presuposición gasta trabajo en cambios
visibles que no arreglan nada, y peor, **hace tocar el Kit sin necesidad**. El punto 3 es la parte
que más rinde: hoy tres de ocho fueron descartes, y **un mapa que solo guarda los aciertos hace
repetir el trabajo tirado**.

**Descartadas** ·
- **Corregir el Kit para que case con el tema, sin preguntar** → es lo que iba a hacer. Habría
  cambiado 143 iconos para alinear el dibujo con un color que PrimeNG ya pinta solo, sin arreglar
  nada, y tocando un fichero publicado.
- **Tratar «el tema no lo lee» como sinónimo de roto** → falso en dos direcciones. `presence/*` y
  `text/accent` no los lee PrimeNG y están bien: viajan por `--sc-*`, la segunda profundidad del
  modelo. Y `app/typography` está conectado desde el preset sin que ninguna capa lo use.
- **Borrar los 27 tokens muertos del modal a medida de la colección de Figma** → la colección está
  publicada y habría que barrer el fichero entero buscando consumidores antes. Ruido inofensivo
  mientras tanto; lo que falta es el último eslabón, y es del consumidor.
- **Meter esta regla en `AGENTS.md`** → el método tiene su propio canónico registrado en
  `DOCS-INDEX`: [`docs/conexion-variables.md`](./conexion-variables.md). Aquí va la decisión y el
  porqué; allí, cómo se ejecuta.

**Consecuencias** ·
- El mapa queda con **cero filas pendientes** y once veredictos en vez de nueve: entran
  `viaja por --sc-*` y `no es un hallazgo`.
- Las cinco abiertas llevan accionable `FIGMA` o `PETICIÓN AL CONSUMIDOR`, ninguna `arreglar ya`.
- Sale una petición fuera del repo: el modal a medida usa 0 de sus 27 tokens del tema y se pinta
  con 53 variables propias del consumidor. Redactada, **sin mandar**.
- Del DataTable sale un dato más fino que el que había: los 8 iconos del toggle usan la variable
  remota en TODAS las variantes, no solo en hover.

---

## DD-48 · 2026-09-03 — En las escalas MANDA FIGMA: la rampa semántica se repunta a los text styles, y la letra gana un chivato Figma-vivo

**Contexto** · Una duda de copy en la página de tipografía de `sc-docs` («el root creo que es
14») destapó que **Figma iba por delante del código en 11 variables** de tipografía sin que
ningún gate lo dijera. Al rebasar los text styles del Kit (2026-09-02: `Display` a 64/78, `h1`
a 48/58) nacieron `font/size/900`, `line/height/900` y el tier `app/typography/xl|xxl`, y la
rampa SEMÁNTICA del código se quedó apuntando al mundo anterior. Medido en vivo con el bridge:

| Rol del código | Apuntaba a | Su text style en Figma | Δ |
|---|---|---|---|
| `display-1` | 700 = 32/40 | `Display/display-*` 64/78 | la mitad |
| `h1` | 650 = 32/40 | `Heading/h1-*` 48/58 | −16 / −18 |
| `h2` | 500 = 24/36 | `Heading/h2-*` 24/36 | casaba |
| `h3` | 450 = 20/28 | `Heading/h3-*` 18/24 | +2 / +4 |

**Dato que decide** · El root NO era la discusión: son 16 y siempre lo fueron (`html` a `100%`,
medido en el build; el 14 que confunde es la base de la escala de ESPACIADO, `--sc-scale-1`, y
el cuerpo por defecto). Lo que sí divergía era la rampa semántica, y la divergencia no la vio
nadie porque **`tokens:type-parity` va export → código**: lo que existe en Figma y nunca llegó
al export le es invisible *por construcción*. Decía «15/15 · al día» con verdad, contestando a
una pregunta más estrecha de la que se le estaba leyendo.

**Decisión** (de Rafa, 2026-09-03: se siguen las escalas de Figma y se aceptan como
innegociables salvo que él diga lo contrario):

1. **Figma manda en las escalas.** Cada rol de `02-semantic.css` apunta al MISMO paso al que
   apunta su text style en el Kit. Si un text style se remapea, la tabla se mueve detrás. No se
   negocia por comodidad del consumidor.
2. **`h4` se queda donde estaba** (18/24) y coincide con `h3`. La escalera de Figma tiene TRES
   niveles de heading, no cuatro; se deja como alias redundante en vez de inventarle un tamaño
   que el Kit no respalda. Misma doctrina que `subtitle-2 = subtitle-3` en DD-13.
3. **El consumidor que quiera otro tamaño NOMBRA EL PASO, no el rol.** `sc-docs` quiere títulos
   de 32 (su look «Constellation») y tras el repunte ningún rol cae en 32, así que sus seis
   consumos pasan a `--sc-font-size-650`. Es más honesto que lo que hacía: tomar prestado
   `display-1` porque casualmente valía 32.
4. **`figma-parity.mjs` cubre también la LETRA**, y de paso comprueba que cada variable de
   tipografía vale lo mismo en TODOS los modos.

**Razón** · Un design system con dos fuentes de verdad no tiene ninguna. Si el Kit es la fuente,
la divergencia se arregla en el código, no al revés — y cuando el código tenga razón (a11y,
contraste), eso es una DIVERGENCIA declarada y vigilada, como las de color, no un empate mudo.
La regla 3 protege lo que el repunte deja al aire: los roles son la voz de Figma, y una app que
necesite otra cosa lo dice nombrando el paso, donde se ve, en vez de doblar el significado de un
rol compartido.

**Descartadas** ·
- **Que Figma bajara a los valores del código** → invierte la dirección del sistema; el Kit es
  lo que ve el diseñador y lo que exporta el Theme Designer.
- **Inventar un rol nuevo a 32 para que `sc-docs` siguiera con un rol** → un rol semántico que
  existe solo porque un consumidor quería un tamaño es exactamente cómo se pudre una rampa.
- **Mover la tipografía de Figma a una colección de UN modo** (lo estructuralmente limpio, ya
  que la letra no cambia con el tema) → la colección `Custom` está PUBLICADA y sus 69 variables
  incluyen 33 de color, 12 de las cuales sí difieren de verdad entre Light y Dark. Mover
  variables entre colecciones en Figma es borrar y recrear: rompe todos los bindings de los
  consumidores. Coste alto, beneficio solo de higiene → se deja y **se vigila** (punto 4).
- **Un gate de CI para la paridad Figma-vivo** → necesita el bridge abierto. Sigue siendo
  procedimiento manual, como el resto de `figma-parity.mjs`.

**Consecuencias** ·
- `display-1` se queda **sin consumidores** y `h1` con uno que es solo fallback. Es el estado
  honesto: la rampa semántica era aspiracional desde DD-13 («la adoptan las apps consumidoras →
  hueco a cubrir»), y hoy `sc-docs` es cromo de documentación, no tipografía de producto. La
  rampa ya dice la verdad y espera consumidores reales.
- Un cambio visible en app: el `h3` de `repositorios-hub-page` (Supervisor) pasa de 20 a 18. Es
  el único consumo de la rampa fuera de `sc-docs`, y va detrás de Figma por la regla 1.
- `npm run figma:parity <volcado>` comprueba ahora color + letra + invariancia por modo. Primera
  corrida completa el 2026-09-03: **36/36 en valor y 36/36 en modos**.
- El bug que motivó el punto 4 era real y llevaba semanas: `app/typography/xl|xxl` tenían alias
  en Light y un **0 crudo** en Dark, cuatro de treinta y seis. Arreglado el 2026-09-03 igualando
  el alias; lo que faltaba no era el arreglo, era algo que lo mirara.

---

## DD-47 · 2026-09-02 — La guía de proceso se sirve en el PUNTO DE DECISIÓN: hooks + tarjeta + gate de forma, y la prosa deja de crecer

**Contexto.** `LEARNINGS.md` pasó de 1.765 a 10.757 palabras en 46 días (50 commits) con el tope
"~20 reglas" escrito en su cabecera y `CLAUDE.md` afirmando "es corto a propósito". El audit de
2026-08-13 ya lo había diagnosticado y el fichero se duplicó después. Medido: 16 reglas numeradas
escondían 43 sub-entradas (37 reglas reales); el 69 % eran "afirmé sin medir"; la regla más larga
(#7, 2.180 palabras) era la más rota (≥8 reincidencias documentadas con la prosa delante). En una
sesión larga con 6 compactaciones el fichero se releyó ENTERO 5 veces (~70k tokens) y aun así
las reglas no dispararon. Causa estructural: la guía se leía una vez en t=0 y nada la presentaba
en t=decisión; el único enforcement (los gates) corría en el push, después de decidir. Y `/reflect`
inflaba por diseño: "make the rule more specific" ante una reincidencia, tope que solo contaba
cabeceras, gate en tercer lugar, y la misma lección escrita también en memoria (39 `feedback`).

**Decisión.** Tres capas por mecanismo, no por fichero:
1. **Imponer** (t=decisión): `.claude/settings.json` versionado → `scripts/hooks/`. `PreToolUse`
   sobre Bash deniega, con la regla como motivo, los comandos exactos de las reincidencias: push
   sin marca `.preflight-ok` sobre ESTE árbol (`scripts/preflight-mark.mjs`, tree id del working
   tree = HEAD), `echo $?`/tubo detrás de un gate, volcado de configs con credenciales, `git diff
   main...rama`, `for f in $VAR`. `Stop` bloquea una vez si hubo push sin leer el CI
   (`npm run ci:verdict`). `SessionStart(compact)` avisa si la guía cambió en `origin/main`.
   Salida explícita `# sc:ok`, dicha en el mensaje. Cada patrón nace con su caso rojo y verde.
2. **Decidir** (cada turno): tarjeta de 7 preguntas en `CLAUDE.md` (lo único que viaja en todos
   los turnos y sobrevive a la compactación); cada pregunta cita su regla. No crece.
3. **Aprender** (cierre): `LEARNINGS.md` = índice + 16 reglas de ≤12 líneas con UNA `Evidencia:`;
   la historia vive en git (`archive/learnings-2026-09-02`, `git log -S`). La forma la impone el
   check K de `docs:coherence` (`scripts/learnings-shape.mjs`). `/reflect` enruta hook → gate →
   tarjeta → regla → memoria, y memoria solo guarda terreno (`project`/`reference`/`user`).

**Lo que ya existía y cómo encaja.** `.githooks/pre-push` (s39, `2ad8b77`) ya corría
`preflight:scope -- --run` en cada push. No lo vi en la fase de medición (LEARNINGS #10: el sistema
ya lo servía) y lo descubrí cuando el primer push de este cambio repitió 10 minutos de cadena
sobre un árbol recién verificado y agotó el timeout. Los dos hooks comparten la marca: el de git
la mira primero (`preflight-mark.mjs --check`) y solo corre la cadena si falta; el de Claude
deniega el push antes si no cuadra. `SKIP_PREFLIGHT=1` sigue siendo la salida del de git;
`# sc:ok`, la del de Claude.

**Sostenedores intactos.** Formato disparador → acción; IDs estables (los 16 se conservan; las
citas `LEARNINGS #1/#2/#5/#7/#10/#17` resuelven); separación LEARNINGS/docs/memoria/NEXT-SESSION
(reparada: memoria deja de guardar proceso); versionado (`.claude/settings.json`, `scripts/hooks/`
y el tag están en git); todo pasa los gates (ahora 14 checks de doc: 2 + 12).

**Descartadas.**
- *Vía A, solo recortar + gate K + tarjeta, sin hooks.* Adelgaza lo que se lee en t=0, que los
  datos dicen que no es donde fallan las reglas (#7 era la mejor conocida y la más rota).
- *Avisos suaves en el hook.* `PreToolUse` no tiene "aviso": solo permitir o denegar. Un aviso que
  Claude no ve no es un aviso; la denegación con razón y salida explícita cuesta una llamada.
- *Reinyectar la tarjeta al compactar.* Innecesario: `CLAUDE.md` va en el system prompt de cada
  turno. El hook de compactación solo lleva lo que cambia con el tiempo (sha de arranque, marca).
- *Renumerar o fundir reglas.* No ahorra nada que no ahorre cortar el cuerpo, y rompe citas.

**Evidencia de que funciona (mismo día).** El hook de push denegó su primer comando en el primer
minuto: un `printf` con "git push" en prosa. Segundo falso positivo: un heredoc con `npm run
lint`. Los dos se convirtieron en tests (segmentación por comando, heredocs excluidos). Un
guardián con falsos positivos enseña a ignorarlo (LEARNINGS #2): por eso los patrones son
estrechos y probados.

## DD-46 · 2026-09-01 — La tipografía también se GENERA; el fallback md baja a 20 y el bloque `css` se entrega al consumidor

**Contexto.** De las diez familias de tokens, nueve se regeneraban solas desde el export y
la tipografía era la única a mano. DD-13 estableció (y sigue siendo cierto) que *PrimeNG*
no modela la tipografía y que la letra se aplica a nivel documento; de ahí se derivó, sin
decisión explícita, que nuestras capas `--sc-font-size-*` / `--sc-line-height-*` también se
escribieran a mano. Son dos cosas distintas, y confundirlas costó caro: el Kit SÍ trae
`primitive.typography.*`, así que se podía generar desde el primer día.

El precio se cobró esta semana. El drift del line-height md (21 vs 20) vivió semanas en
producción, y el único gate que vigilaba la tipografía —`tokens:type-parity`— llevaba ciego
otro tanto: el Kit renombró las hojas a `primitive.typography.*`, el regex dejó de casar,
y el gate imprimía «✓ 0/0 · al día». Verde por VACÍO. La única familia a mano era también
la única con un vigilante que podía quedarse mudo sin que nadie lo notara.

**Decisión.**
1. Nueva zona `@sc-gen:typography` en `01-primitive.css`. Diez zonas en cinco ficheros.
   Los pasos que el Kit no trae (snaps del DS; el naming por step es API pública) se derivan
   del vecino, con el mapa explícito y testeado en `token-gen.mjs` en vez de repetido en CSS.
2. `type-parity` deja de ser el vigilante y pasa a ser un no-op demostrable, como
   `tokens:cmp-rewire` con el color. Menos aparato y más garantía a la vez.
3. El fallback del line-height md pasa de 21 a **20**. Solo entra si la variable no resuelve,
   pero contradecía al token desde DD-39 y era el escenario exacto que reintroducía el bug.
4. El bloque de tipografía se puede **emitir para el consumidor** del tema
   (`npm run emit:consumer-typography`), leyéndolo de `sc-preset/css.ts` para que no se
   pueda desincronizar. PrimeNG no modela `line-height` por componente y el plugin no
   generará nunca esa regla: sin ella, quien instale el tema tiene los valores pero no los
   aplica — que es justo lo que dejó chip/tag/toast/opciones heredando el 1.5 del documento.

**Descartadas.**
- *Dejar la tipografía a mano y confiar en el gate.* Es lo que había, y falló por partida
  doble: el gate se quedó mudo y el drift entró igual.
- *Mantener el fallback en 21 «por compatibilidad».* Un fallback que contradice al token no
  es compatibilidad, es una trampa esperando a que la variable no resuelva.
- *Duplicar la lista de selectores en un CSS estático para el consumidor.* Se desincroniza
  el día que añadamos un componente. Se lee de `css.ts` o no se hace.

**Consecuencias.**
- Cambiar la letra en Figma llega al código sin manos, como el radius. Verificado: subiendo
  line-height 200 de 20 a 22, el código lo recoge y el snap 220 lo sigue solo.
- Un snap cuyo paso del Kit desaparezca ya NO se omite en silencio: el generador para.
- Queda un modo de fallo cerrado a conciencia: cualquier gate que pueda medir CERO cosas
  debe ponerse rojo, no verde. `type-parity` ya lo hace.
- Pendiente, del lado del consumidor: los cuatro selectores que aún le faltan a producción
  (`.p-tag`, `.p-toast-detail`, `.p-select-option`, `.p-multiselect-option`) los cubre la
  hoja emitida; falta acordar la entrega con su equipo.

## DD-45 · 2026-08-31 — El lienzo de la app pasa a BLANCO (`--sc-bg-canvas`); cierra el item pendiente de DD-34/DD-36

**Contexto** · El "lienzo de página gris↔blanco" llevaba meses esperando decisión (lo nombran
DD-34, DD-36/C3 y `AUDIT-DOCS-2026-08`). Configuración ya se había movido a blanco en S67
(`settings-shell` usa `--sc-bg-canvas`), así que media app iba en blanco y media en gris
(`--sc-bg-default` = slate-50 = `#f7f8fa`, casi-blanco). La incoherencia era el defecto real.

**Decisión** · El shell del supervisor pinta el suelo con **`--sc-bg-canvas`** (blanco en light,
gray-950 en dark) en vez de `--sc-bg-default`. Un solo cambio: `app-shell.component.scss:20`. Las
tarjetas se separan por su BORDE, que ya existe (`_sc-list-table`, `_forms`: `1px --sc-border-default`) —
verificado midiendo el render (suelo `rgb(255,255,255)`, card con borde `1px #dadfe6`). El relleno gris
de los campos de formulario sigue en `--sc-bg-default` (otro trabajo del mismo token), intacto.

**Razón** · Consistencia (termina lo que Configuración empezó) + dirección limpia/actual
(Linear/Stripe/Notion: blanco con bordes, no gris con tarjetas flotando). Decisión de Rafa
(2026-08-31), con las dos fotos A/B delante.

**El cabo de DD-36/C3** · La trampa documentada era *rail gris sobre lienzo gris*; ir a BLANCO es la
dirección SEGURA (el blanco separa el rail). NO hace falta tocar el token del rail — al revés que
"volver a gris", que sí lo exigiría.

**Alcance** · Solo **supervisor** (donde vive el prototipo de Rafa y el rail de AED). `agent` y
`cuscare` son réplicas de sus propios originales; no se tocan sin decisión aparte.

**Figma** · La propuesta ya estaba dibujada como A/B (`node 13920:4298`, page `Flujos`); esta decisión
la vuelve canónica. La deuda `--sc-bg-canvas` de `customs-catalog §5.11` deja de estar diferida para el
suelo del shell: ya lo consume.

**Descartadas** · *Seguir en gris* → la incoherencia con Configuración es el defecto. *Cambiar el VALOR
de `--sc-bg-default` a blanco* → rechazado: hace doble trabajo (suelo + relleno de campos, 32 ficheros);
dejaría los campos rellenos invisibles sobre blanco. Por eso se apunta a `--sc-bg-canvas`, no se retoca
`--sc-bg-default`.

---

## DD-44 · 2026-08-30 — El `ControlValueAccessor` de los 6 campos se BORRA; el field-pattern se comparte por factories

**Contexto** · Los seis campos del DS (`sc-inputtext`, `sc-select`, `sc-multiselect`,
`sc-datepicker`, `sc-inputnumber`, `sc-search`) llevaban cada uno ~28 líneas de un
`ControlValueAccessor` idéntico (provider `NG_VALUE_ACCESSOR`, `_onChange`/`_onTouched`/
`_ngControl`, `writeValue`/`registerOn*`/`setDisabledState`) para dar soporte a
`[(ngModel)]` y Reactive Forms. Era el ítem **P0** de `AUDIT-DEUDA-2026-06.md` (el
field-pattern ×5), y **DD-42** lo aparcó a propósito al saltar a Angular 22, apuntando a
que Signal Forms —graduada a API pública en ese salto— sería su sustituto.

**Decisión** · **Se borra el CVA entero de los seis**, no se sustituye por otro. El valor
sigue por `[(value)]` (`value = model<T>()`), que es como lo consumen TODAS las apps. La
lógica que el field-pattern sí compartía se extrae a `components/field/sc-field.ts` como
funciones factory: `createScFieldState` (id/msgId/isInvalid/footerText),
`createScPanelSizing` (pSize/panelStyleClass) y `createScOptionState` (los computeds de
opciones de select/multiselect). `disabled` pasa de `model()` a `input()`.

**Razón** · Medido el 2026-08-30, no lo ejercía **nada** dentro del repo:
- `ReactiveFormsModule`/`FormBuilder`/`FormGroup`/`FormControl`: **0 ficheros** en `projects/`.
- De 145 instancias de los cinco tags en plantillas de app, **0** con `ngModel`/`formControl`;
  74 con `[(value)]`. El único `[(ngModel)]` sobre un CVA del DS era la demo de `sc-search`,
  migrado a `[(value)]` en el mismo cambio.
- Los paquetes `@smartcontact-hub/*` están aparcados (DD-17): las apps consumen el DS in-repo,
  así que no hay consumidor externo que pudiera depender del CVA.

Sustituir 6 CVA a mano por 1 CVA a mano (el plan viejo `scCreateControlValueAccessor()`)
habría sido trabajo tirado: la vía de Angular 22 es Signal Forms, y su directiva `FormField`
detecta el `value = model()` de forma **estructural**, sin `implements`. El día que aparezca
el primer consumidor de forms real, `implements FormValueControl` es una línea por componente.

**Descartadas** ·
· *`implements FormValueControl<T>` ahora* — barato en apariencia (el `value=model()` ya
  cumple), pero `FormUiControl.min` se tipa `InputSignal<number>` y el `min = input<number>()`
  de `sc-inputnumber` es `number|undefined`: obligaría a contorsionar la API pública de
  inputnumber para satisfacer una interfaz que hoy no ejercita nadie. La compatibilidad es
  estructural igualmente; no se pierde nada esperando.
· *Conservar el CVA como compat declarada* — mantendría ~140 líneas que ningún test ni
  consumidor recorre, y una superficie de API que promete algo (Reactive Forms) que el repo no
  usa. Deuda que se lee como función.

**Consecuencias** · ~265 líneas netas fuera de los seis componentes (`+207/−472`), factory
compartida de ~105. Cierra el P0 de `AUDIT-DEUDA-2026-06.md`. Se aprovechó para **reconciliar
estado**: `invalid` explícito pasa de estar solo en inputtext a los cinco (antes `[invalid]`
sobre un `sc-select` no hacía nada — bug latente), y `focused`/`blurred` a los tres que
faltaban. Se congelan como divergencias de capacidad: readonly/filled/iftaLabel donde no
existen, el clamp de min/max de inputnumber, el puente contentChild de select.
`migration-safety.md` §6 pasa a histórico. **Condición de reentrada**: el primer consumidor de
forms real → `implements FormValueControl` (1 línea/componente). **Roce conocido**: el
`min/max` de inputnumber no casa el tipo de `FormUiControl` sin tocar su API.

---

## DD-43 · 2026-08-30 — NO se extrae una «base común admin»: la duplicación que el audit veía no existe

**Contexto** · `AUDIT-DEUDA-2026-06.md` abre con *"CRUD / listas / selección reinventados por
feature"* (tema **D**) y su §3 pone como paso 3 de la secuencia recomendada una **base común
admin** (`BaseCrudStore<T>` / `FilteredSortedTable`). Lleva desde junio como uno de los ítems
grandes de deuda, y todo plan que abre ese doc se lo encuentra por delante.

**Decisión** · **No se construye.** El tema D se cierra como *resuelto por otro camino*, y la §3
deja de recomendarlo. Lo que sí sale de ahí son tres arreglos pequeños, tratados por separado
(dos ya cerrados el 2026-08-30: `isNameTaken` y `hashName`; el tercero, `toggleChannel`, va a
`ROADMAP.md` con disparador).

**Razón** · Medido contra el código del 2026-08-30, no contra la descripción de junio:

1. **La duplicación no es verbatim.** Normalizando el nombre de la entidad
   (`agent`→`X` vs `group`→`X`) y comparando `agents-list-page.component.ts` (775 líneas) con
   `groups-list-page.component.ts` (708), quedan **595 líneas divergentes**: ~77% del fichero no
   coincide ni después de borrar la diferencia tonta. Lo que sí se repite verbatim entre las
   cinco list-pages son *one-liners* — `const ids = this.selectedIds();`, `life: TOAST_LIFE.success,`,
   un `onSelectionChange` de **3 líneas** —. Eso no se extrae: se escribe.
2. **La base que pedía el ítem ya existe, en cuatro capas y adoptada al 100%**:
   `core/services/local-store.factory.ts` (`createLocalStore`, 182 líneas — los stores de admin
   que lo consumen son wrappers de 36 a 106) · `shared/utils/form-dirty-state.ts` +
   `CrossTabLockService`, cableados igual en los 3 formularios · los componentes del DS que
   absorben la lista (`sc-datatable`, `sc-bulk-action-bar`, `sc-column-selector`,
   `sc-delete-entity-dialog`…) · y
   `repo-list-page.component.ts`, **un** componente config-driven que sirve **9 rutas** de
   repositorios. `BaseCrudStore<T>` no está por construir: se llama `createLocalStore`.
3. **`FilteredSortedTable` no se puede construir sin romper una divergencia deliberada.**
   `users-list-page.component.ts:157-166` explica por escrito que su `sorted` es
   `[...this.filtered()]` a secas porque el orden lo resuelve `p-table` client-side y la copia
   existe solo para que no ordene el array del store in-place. Agents y groups sí llevan
   comparador. Una tabla común obligaría a las tres a compartir estrategia de orden — justo lo
   que se decidió distinto a propósito.
4. **El repo ya rechazó una abstracción de esta familia, y lo dejó escrito.** El
   `SelectionState` compartido se **retiró** de agents/groups/users/labels/repos el 2026-08-24:
   *"de sus nueve miembros esta página usaba DOS"* (`groups-list-page.component.ts:138`).
   Construir ahora una base mayor sería repetir el error del que se volvió hace seis días.

**Descartadas** ·
· *Extraer `BaseCrudStore<T>` + `FilteredSortedTable`* (lo que pedía el audit) — mataría ~3
líneas por página y añadiría una capa que las tres estrategias de orden no comparten. Coste real
> beneficio real.
· *Extraer solo `FilteredSortedTable`, dejando los stores* — mismo choque del punto 3, y encima
parte el patrón en dos mitades con dueños distintos.
· *Dejar el ítem abierto "por si acaso"* — es lo que ha pasado dos meses. Un backlog que
recomienda trabajo que no se debe hacer cuesta lo mismo que uno que esconde trabajo pendiente:
en ambos casos deja de decir la verdad (precedente: el focus ring, `ROADMAP.md:31-34`).

**Consecuencias** · El tema D y la §3·3 del audit quedan cerrados con esta referencia. Sigue
vigente **DD-4** (regla 2+ consumidores) como criterio: se consolida duplicación genuina —
`hashName` verbatim entre DS y supervisor lo era y se unificó el mismo día—, no parecido
estructural. Si algún día tres list-pages convergen de verdad en su estrategia de orden, esto se
revisa; el disparador es ese, no el número de páginas.

---

## DD-42 · 2026-08-25 — Angular 22 + PrimeNG 22, y los builders a `@angular/build`

**Contexto** · El repo iba por Angular 21.2 / PrimeNG 21.1. La justificación que llevaba el plan
para subir era de seguridad: 7 vulnerabilidades, 6 de ellas colapsando en `@angular-devkit/build-angular`.
**Esa justificación resultó falsa al medirla**: el salto de Angular por sí solo dejó el contador en
**8**, no en 0 — `build-angular@22` arrastra la misma cadena de webpack (`less`, `image-size`,
`sockjs`, `uuid`, `webpack-dev-server`). Y `npm audit fix` proponía como "arreglo" un downgrade a
la era de Angular 10.

Segundo hecho medido: **Angular y PrimeNG no son separables**. `primeng@21` fija
`@angular/core ^21.0.7` en sus peers, así que "solo la familia Angular" no era una opción
disponible. La decisión se retomó con esa premisa corregida.

**Decisión** ·

- Angular **22.1.3** · TypeScript **6.0.3** · PrimeNG **22.1.0** · `@primeuix/themes` **3.0.0** ·
  angular-eslint 22.1.0.
- **`@angular-devkit/build-angular` eliminado del repo.** Los 7 proyectos pasan a `@angular/build`
  (esbuild/Vite), que es el builder soportado en v22.
- `@types/node` pasa a ser **dependencia declarada**. Angular 21 lo arrastraba de forma
  transitiva y v22 ya no; el gate de tipos de la raíz (`tsconfig.harness.json`) depende de él.
- `xlsx` (alta, sin arreglo publicado) **se acepta con evidencia, no se migra**: su vector es
  *parsear*, y `xlsx-export.service.ts` solo escribe (`aoa_to_sheet`/`book_new`/`writeFile`).
  **Cero `XLSX.read` en el repo** — ese grep es el criterio de revisión si algún día cambia.

**Razón** · Migrar los builders es lo que de verdad cerró el problema: **8 → 1 vulnerabilidad**.
Toda la cadena de webpack desaparece del árbol porque `@angular/build` no la usa. El salto de
versión por sí solo no cerró ninguna.

**Descartadas** ·

- *Subir solo Angular y dejar PrimeNG en 21* — imposible: el peer de `primeng@21` lo impide.
- *Quedarse en 21* — se llegó a recomendar cuando la justificación de seguridad se cayó. Rafa
  decidió actualizar, con la razón real escrita: **estar al día**, no la seguridad.
- *Migrar `xlsx` a otra librería* — coste alto para un riesgo que el uso real no toca. Se prefiere
  la evidencia y el criterio de revisión.

**Consecuencias** ·

- **El bundle de sc-docs sube de 938 kB a 2,23 MB** (transferido 186 → 378 kB), y el presupuesto
  se sube a 2,3 MB / 2,6 MB. La causa está aislada por experimento: **no son los 54 imports**
  reapuntados, es **un único fichero eager** (`app.config.ts`) que, al importar el paquete en vez
  del fuente, sube el FESM entero (812 kB) a `main`. Revirtiendo solo ese fichero el bundle baja a
  861 kB.
  La elección fue **quedarse con la frontera de paquete correcta** —es lo que hacen las otras tres
  apps y lo que TypeScript 6 exige— y pagar los 192 kB en una herramienta interna, con el número
  medido escrito aquí para que no sea un presupuesto subido en silencio.
- **TypeScript 6 destapó una violación de frontera preexistente**: `sc-docs` importaba el DS por
  ruta relativa a su *fuente* en **54 ficheros**. Reapuntados al alias `@smartcontact-hub/components`.
- Deuda que el salto **aparca a propósito**: el P0 del field-pattern (los 5 CVA a mano). Angular 22
  gradúa **Signal Forms** a API pública y es justo lo que los sustituye; refactorizarlos ahora sería
  trabajo tirado.
- Lo aprendido en la migración —qué aguantó, qué se rompió en silencio y qué gate lo vigila ahora—
  está en [`migration-safety.md`](./migration-safety.md).

---

## DD-41 · 2026-08-25 — El `warn` vuelve a la familia del Kit (yellow), con un paso de corrección por contraste

**Contexto** · El sync del Theme Designer del 24-ago movió el `warn` de la capa generada de
`orange`/`amber` a **`yellow`**, pero solo esa capa. Quedaron **tres verdades conviviendo**: la
generada en yellow, el preset remapeando `orange → amber` y `yellow → amber`, y los semánticos y
customs escritos a mano en amber. Efecto visible medido: **el tag warn salía amber en claro y
yellow en oscuro**, y el botón ya no casaba con el chrome del toast.

**Decisión** · **Manda el Theme Designer** (decisión de Rafa). Todo el `warn` pasa a la familia
`yellow`: el remap del preset (`base.ts`), los semánticos (`--sc-text-warning`, `--sc-bg-warning`,
`--sc-border-warning`, `--sc-icon-warning`), los customs del toast y la rampa sólida del botón.
**`customs-catalog.md §1.3` («Warn → amber, no orange») se retira**: ya no es divergencia.

**Razón** · El Kit es la fuente, y el export nuevo lo dice. Corroborado **fuera del export**, en el
fichero de Figma: el nodo `393:42378` da `toast/warn/color = #a16207`, que es `yellow-700`.

**Un paso NO se copia literal, y hay precedente escrito para eso** · `--sc-icon-warning` baja a
**`yellow-700`**, no a `yellow-600`: medido, `yellow-600` sobre blanco da **2,94:1** y no cumple el
3:1 de WCAG 1.4.11 para objetos gráficos (su consumidor es `sc-gauge`). Es la misma regla que ya
estaba escrita en `02-semantic.css:94` para success y warning. Por lo mismo suben
`--sc-toast-success-icon-bg` (green-500 → 600) y `--sc-toast-secondary-icon-bg` (slate-500 → 600).

**Consecuencias** ·

- Se destapó que **el gate de contraste no veía las severidades**: recorría el supervisor, donde no
  se renderiza ningún botón `severity="warn"`. Por eso un par a **2,15:1** llevaba meses sin que
  saltara nada. Se añade `e2e/severities-contrast.spec.ts` sobre la galería de sc-docs, y con él
  aparecieron 2 hallazgos más que estaban tapados.
- Ese gate nuevo salió **inestable** (2 verdes / 1 rojo con el mismo árbol) porque medía toasts a
  medio animar. Se estabilizó con `disableAnimations`, y **estabilizarlo fue lo que destapó los 2
  hallazgos**: un test intermitente no es un test que a veces falla, es un test que a veces miente.
- ~30 exclusiones rancias de `warn` en `scripts/cmp-color-map.mjs` retiradas: eran las que dejaban
  el botón warn fuera de todo control (llegó a bajar a 1,92:1 durante el propio cambio, y lo cazó
  el gate recién escrito).

---

## DD-40 · 2026-08-24 — El primary dark sube un paso y DIVERGE del Kit: su rampa no admite texto legible

**Contexto** · `--sc-text-on-primary` sobre `--sc-bg-primary` en `.sc-dark` medía **3,01:1**, bajo
el AA de 4,5. No era un hallazgo nuevo: estaba en `A11Y_KNOWN` de `token-parity.mjs`, comentado en
`07-dark.css` y anotado en DD-19, aparcado como "revisión de marca (W5)" desde junio. Lo que lo
desbloquea es que **la razón por la que se aparcó era falsa**. Las tres notas decían que «ni
gray-900 ni blanco llegan a AA sobre blue-400». Medido: el **blanco sí llega (5,62:1)**. La otra
mitad sí era cierta, y más de lo que decía — sobre `blue-400` **ni el negro puro llega** (topa en
**3,74**), así que ningún texto oscuro puede cumplir ahí.

Con eso sobre la mesa, el problema real no es la base sino la **rampa entera**. El relleno en
reposo necesita dos cosas a la vez: ≥3:1 contra el lienzo (1.4.11, o el control pierde su silueta)
y ≥4,5:1 con su texto (1.4.3). Traducido a luminancia relativa sobre `slate-900`, el blanco solo
cumple en la banda **L ∈ [0,136 · 0,183]**, y de los seis azules de la rampa **solo `blue-400`
cae dentro** — y cae en el canto inferior (su 3,01 contra la superficie supera el mínimo por ocho
milésimas). Consecuencia: con texto blanco **no existe hover ni active legales**; aclarar sale de
la banda (`blue-300` con blanco = 3,35) y oscurecer hunde el relleno (`blue-500` vs superficie =
1,90). La opción del blanco no es peor: es que **no se puede terminar**.

**Decisión** ·

- El primary dark **sube un paso**: `--sc-bg-primary` `blue-400`→**`blue-300`**, hover
  `blue-300`→**`blue-200`**, active `blue-200`→**`blue-100`**. `--sc-text-on-primary` **no se
  toca** (sigue `slate-900`).
- Las tres filas `primary.*` de `mode:'dark'` pasan de `enforce` a **`diverge`** en
  `scripts/color-map.mjs`, con su razón medida y su condición de reversión. Es el mismo mecanismo
  y el mismo motivo que las tres divergencias que ya había por contraste (`text.muted.color`,
  `form.field.icon.color`, `navigation.item.icon.color`).
- **`A11Y_KNOWN` queda VACÍO** en `token-parity.mjs`: el par pasa a gatearse de verdad. §6b va a
  **22/22**.
- La zona generada `@sc-gen:semantic-color-dark` **queda vacía a propósito**, y su cabecera lo
  dice: el primary era lo único que el dark recibía del Kit, así que **el dark pasa a estar 100%
  curado a mano**. Es la factura de esta decisión y hay que verla escrita, no descubrirla.

**Razón** · Es la única combinación que cumple los dos criterios en los tres estados —
5,05 / 8,03 / 11,89, tanto de texto como de relleno contra la superficie. Además arregla de paso
los usos donde `--sc-bg-primary` **no es un relleno** sino borde, `caret-color`, `accent-color` o
el `focusBorderColor` del preset: estaban en 3,01 contra la superficie, justo en la raya de
1.4.11, y suben a 5,05. Medido por tres caminos que no comparten modo de fallo: aritmética WCAG
sobre los hex de `01-primitive.css` (instrumento validado antes con casos conocidos), el propio
`tokens:parity`, y `getComputedStyle` sobre el botón real de `sc-docs` compilado, incluido un
**hover real** para leer el estado hover (5,05 medido, no deducido).

**Descartadas** ·
- **Texto blanco sobre la rampa del Kit** (base `blue-400` intacta, 1:1 con el export). Pone la
  base en 5,62 y el gate en verde, pero **empeora dos de los tres estados**: hover 5,05→3,35 y
  active 8,03→2,11, porque el `contrastColor` del preset es **uno solo** para los tres — medido
  con hover real: `--p-button-primary-hover-color` y `-active-color` resuelven ambos a
  `--sc-text-on-primary`. Un arreglo que el indicador aplaude y el usuario sufre.
- **Blanco + invertir la rampa a 400/500/600.** Los tres textos cumplen (5,62 / 8,90 / 12,44),
  pero el relleno cae a **1,90 y 1,36** contra la superficie: el botón se funde con la tarjeta
  justo al interactuar con él.
- **Oscurecer más el texto** (`slate-950`, negro puro). Imposible por definición: 3,42 y 3,74.
- **Tocar `kit-export-dtcg.json` a mano** para que el puente lo generase. Falsifica la fuente y lo
  pisa el siguiente export real; además `tokens:export-clean` lo bloquea en local a propósito.
- **Pedirle al Kit un azul nuevo** en la banda L ∈ [0,136 · 0,183], apuntando a su centro en vez
  de al canto. **No descartada: es la salida durable**, pero necesita a Figma y a marca. Esta
  decisión es el puente hasta que llegue, y por eso se revierte sola devolviendo tres filas a
  `enforce`.

**Consecuencias** ·
- El botón primario en oscuro **se ve más pálido** en toda la plataforma, y en `active`
  (`blue-100`) casi pierde el azul. Es el coste aceptado.
- Arregla de golpe **17 consumidores** de `--sc-text-on-primary` (12 en el supervisor, 2 en el DS,
  2 en sc-docs, más el `contrastColor` del preset del que hereda todo botón primario de PrimeNG),
  y entre ellos dos que se veían a diario: la **barra de navegación de sc-docs** (3,01→5,05 en
  todos sus enlaces) y el **skip-link** del supervisor, que es el control pensado precisamente
  para quien navega con teclado o lector de pantalla.
- **Pendiente**: ver la actualización de abajo — la petición al Kit cambia de forma.

**Actualización (mismo día, tras el sync del export del 24-ago)** · Rafa señaló un nodo del
master (`14393:3775`) y ahí estaba el dato que faltaba: **Figma ya decidió texto BLANCO** en el
primario oscuro. El export del 24-ago lo confirma — `primary.contrast.color` dark pasa de
`#18181b` a `#ffffff`, en base, hover y active — **y deja los fondos como estaban**
(`blue-400/300/200`, que ACLARAN al interactuar). Medido, eso da base 5,62 ✓ pero hover **3,35 ✗**
y active **2,11 ✗**: pasaría de UN estado incumpliendo a DOS.

Y lo más importante, porque **corrige lo que esta misma DD daba por bueno arriba**: la salida NO
es pedirle al Kit un azul mejor. La banda de luminancia donde el relleno cumple los dos criterios
con texto blanco va de 0,136 a 0,183, o sea **1,25:1 de ancho de punta a punta**; tres estados
repartidos ahí salen a 1,12:1 unos de otros, que es invisible. **No existe ningún azul que
arregle esto** — se puede tener texto blanco, o un hover que se note, no las dos cosas. Con texto
oscuro el suelo está en 0,230 y no hay techo: la banda mide **3,76:1** y los tres pasos salen a
1,94:1. Por eso B no era un puente a la espera de un color mejor: es la única estructura donde
caben tres estados visibles.

Lo que SÍ puede hacer diseño, si el blanco les importa (y es legítimo, es el idioma del tema
claro): **sacar el hover y el active del relleno** — un borde, un anillo, una elevación. Entonces
el relleno se queda quieto en `blue-400` con blanco a 5,62 y la interacción la cuenta otra cosa.
Es una decisión de diseño, no un problema de paleta. Hasta que se tome, la fila sigue en
`diverge` y el repo mantiene el texto oscuro.

---

## DD-39 · 2026-08-24 — Tipografía de componente explícita en `css.ts` + line-height md unificado a 20

> **Acotado por DD-51 (2026-09-05).** El punto 1 sigue en pie entero: los componentes declaran su
> tipografía explícita y no heredan del `body`. Lo que cambió es el REPARTO del interlineado. Este
> DD lo aplicó por igual a etiquetas y a controles, y medido después contra los maestros del Kit,
> el Kit solo ata el interlineado de las etiquetas: en botón, campo, select y opciones su texto va
> en `AUTO`. Por eso los controles pasaron a `normal` y salían 3px por encima del diseño. El 20 del
> punto 2 no se toca: lo siguen leyendo el cuerpo y las etiquetas.

**Contexto** · chip/toast/tag/opciones/breadcrumb/context-menu no estaban en los selectores de
tipografía de `css.ts` — heredaban font-size y line-height del `body` de cada app. Funcionaba en
sc-docs (body a `--sc-line-height-200` = 20) pero NO en los prototipos (supervisor/agent/cuscare,
`reset.scss` a 1.5): allí el chip salía a 21. Además el texto de 12px heredaba el 20 absoluto del
body (suelto; debía 18), y coexistían dos line-heights de 14px: 20 (rampa) y 21 (control, vía
`app.typography.md` = `scale-1-5`). Medido en sc-docs con chrome-devtools.

**Decisión** ·
1. Los componentes que muestran/abrazan texto declaran su tipografía **explícita** en `css.ts`
   (md 14/20, sm 12/18), sin depender del `body` del app consumidor.
2. **Unificación**: `app.typography.md.lineHeight` de `scale-1-5` (21) → `line-height-200` (20).
   Todo 14px a 20, 12px a 18 (`line-height-100`).
3. **Badge fuera**: alto fijo y tamaños fuera de rampa (8.75/10.5/12.25) — el line-height no le
   afecta y no hay token que le pegue.

**Razón** · que los componentes rendericen igual —y como Figma— en TODAS las apps, no según el body
de cada una. El 21 era load-bearing para la geometría icon-only; medido que 20 baja el control de
alto 37 a 36 (icon-only más cuadrado) sin romperla. `type-parity` sigue 15/15 1:1 con el export.

**Descartadas** ·
- **Set "compact" de line-height ceñido** (rampa paralela ~1.2 para UI): añade un segundo sistema a
  esparcir por cada hug (tag, badge…) y una decisión "¿normal o compact?" en cada uso. Una sola
  rampa normal es más mantenible.
- **Dejar la herencia del body**: frágil (depende del `reset.scss` de cada app) y ya rompía en los
  prototipos.
- **Aceptar el 1px** (Figma 20 vs código 21): la unificación es barata y segura (medido) y deja el
  sistema sin el desajuste latente.

**Consecuencias** · migration-safe (tokens que ya existían, sin cambiar valor). Verificado en
sc-docs: botón 36/20, tag 25, chip 34, opciones 14/20, breadcrumb 14 + slate/600. Los prototipos
heredan la corrección al reconstruir. Producción (ui.smart-contact, Carlos) sigue su camino hasta
consumir los tokens.

---

## DD-38 · 2026-08-14 — La era objetivo de la API es **señales**; `@Input()/@Output()` queda congelado con trinquete

**Contexto** · Dos formas de declarar la API conviven en el repo sin criterio escrito en ningún
sitio (`AGENTS.md`, este doc, `migration-safety.md`) — lo levantó la rutina semanal del 2026-08-13
como P1. Medido hoy sobre los **204 `.component.ts`** de `projects/`: **76 en señales, 17 en
decoradores**, el resto sin API propia. Los 17 se reparten así: **16 en la librería del DS** y
**1 en el paquete de iconos** (`sc-icon`). Las **apps están ya al 100% en señales** — el único
`@Input()` que aparecía en el supervisor es un **comentario** de `sidebar-nav-item.component.ts`
que explica por qué NO lo usa. O sea que esto no es una migración pendiente del producto: es
deuda de la librería, y solo de ella.

Lo que lo hace urgente no es la estética: `AGENTS.md` → *Reference Components* manda inspeccionar
**4 referencias antes de generar nada**, y estaban repartidas entre las dos eras — `sc-button`
(decoradores, **100 usos** en plantillas: 61 supervisor, 35 sc-docs, 4 DS) frente a
`sc-toggleswitch` e `sc-inputtext` (señales); la cuarta, `sc-dynamic-dialog`, es un servicio y no
tiene API de inputs. El patrón que copia un agente dependía de **cuál abriera primero**.

**Decisión** ·

- **La era objetivo es señales**: `input()` / `input.required()` / `model()` / `output()`,
  `viewChild()/contentChild()`, y estado derivado en `computed()` — no en getters.
- **`@Input()/@Output()` queda CONGELADO**: no se estrena en nada nuevo, y a un componente de los
  16 que quedan **no se le añade un input más** — si necesita API nueva, primero se migra entero.
- **Migración por lotes**, empezando por `sc-button` (hecho aquí) por ser la referencia más citada.
- **La migración no renombra nada.** El contrato de plantilla es idéntico en las dos eras
  (`[label]="x"`, `(clicked)`); lo único que cambia es la lectura interna (`this.label()`), que es
  privada del componente. Verificado: **cero** accesos programáticos (`ViewChild` sobre
  `ScButtonComponent`) en todo el repo.
- **Lo gatea `audit:api-era`** (gate 26 de `verify`), que es un **trinquete**: la lista de
  pendientes solo puede menguar.

**Razón** · La migración es mecánica y está medida: de los 17 componentes legacy, **0 usan
`@Input() set`** (setters, que es el caso que obliga a rediseñar), **1** tiene `ngOnChanges`
(`sc-bulk-transcription-modal`) y **0** implementan `ControlValueAccessor`. No hay ningún caso
donde los decoradores hagan algo que las señales no hagan: Angular 21, API estable. Y el lado
caro —las apps— ya está hecho, así que el trabajo restante es finito y acotado a la librería.

La dirección no es una preferencia nueva: `AUDIT-DEUDA-2026-06.md` ya la enunciaba
("16 wrappers legacy → migrar a `input()/output()/model()`"), pero vivía en un informe de deuda,
que es un sitio donde se lee un plan, no donde se busca una regla.

**Descartadas** · *Dejar convivir las dos eras y documentarlo* → rechazado: el problema no es la
convivencia, es que la referencia más copiada del set enseña la era vieja, así que se reproduce
sola. *Migrar los 17 de golpe* → rechazado: solo `sc-button` tiene 100 usos y `sc-icon` está en
todas las pantallas; por lotes con AOT + `e2e` por lote (regla 16 de `LEARNINGS`). *Escribirlo
solo en `AGENTS.md`* → rechazado, y es el motivo de que aquí haya un gate: la prosa no impide el
fichero número 18, y esta clase de deriva ya se coló una vez. *Aprovechar para renombrar la API*
(`clicked` → `onClick`) → rechazado: convertiría una migración invisible en una rotura de 100
llamadas.

**Consecuencias** · `sc-button` pasa a ser la referencia de la era objetivo: 15 `input()`, 1
`output()`, getters → `computed()`, booleanos con `booleanAttribute` como ya hacían 48
declaraciones del DS. Efecto lateral querido: `<sc-button disabled>` **sin binding** ahora sí
deshabilita — antes el atributo pelado entraba como `''` y no hacía nada; medido, **0 usos** con
esa forma, así que no rompe a nadie.

Quedan **16 en el trinquete** (`LEGACY_PENDIENTES` en `scripts/audit-api-era.mjs`). Al migrar uno
hay que **borrarlo de la lista**: el guard también se pone rojo si un componente ya migrado sigue
ahí, porque una lista con nombres muertos deja de decir la verdad sobre lo que falta. Probado en
rojo en sus cuatro direcciones (legacy nuevo fuera de la lista · migrado que sigue dentro · nombre
inexistente · fichero que mezcla las dos eras) y en verde sobre el árbol limpio.

---

## DD-37 · 2026-08-13 — `cuscare` es una app RÉPLICA de pleno derecho: exenta de tokenizar, gateada por fidelidad

**Contexto** · `projects/cuscare` replica `cuscare.smart-contact.com/aed`, está **en producción**
(`sc-cuscare.pages.dev`) y tiene su propia suite (`npm run e2e:cuscare`, en `ci.yml`). Pero **ningún
DD la cubría**: la auditoría de documentación de 2026-08 midió `grep cuscare docs/DECISIONS.md` → **0**.
DD-35 legisla las apps réplica y solo nombra a `agent`, así que el criterio que hoy rige a `cuscare`
vivía únicamente en un comentario de `scripts/token-guard.mjs`. Una app en producción sin decisión
escrita es una que el próximo "vamos a tokenizar todo" se lleva por delante.

**Decisión** · `cuscare` se rige por el **mismo criterio que `agent`** (DD-35), y se hace explícito:

- **NO se tokeniza a propósito.** Sus valores se **extraen del sitio real** (`getComputedStyle`) y se
  copian crudos. Tokenizarla destruiría justo lo que aporta: una réplica debe parecerse al
  **ORIGINAL**, no a nuestro DS.
- **Exenta de las reglas 5-7 de `token-guard`** (tipografía literal), como `agent`. El resto del
  guard **sí** se le aplica.
- **Su gate no es la paridad de tokens, es la fidelidad**: `e2e:cuscare` conduce la app con clics
  reales y compara métrica medida contra el sitio original.

**Razón** · El valor de una réplica es que un tercero la mire y no distinga cuál es cuál. Cada token
`--sc-*` que se le mete es una desviación del original disfrazada de mejora.

**Descartadas** · *Tokenizarla como el resto* → rechazado: pierde fidelidad, que es su única razón de
existir. *Sacarla del repo* → rechazado: consume el DS local, comparte tooling y CI, y el coste de
tenerla dentro es una línea en `REPLICA_APPS`. *Dejar el criterio solo en el comentario del guard*
→ rechazado, y es el motivo de este DD: un comentario en un script no es donde se busca una decisión.

**Consecuencias** · La exención es explícita en `token-guard.mjs` (`REPLICA_APPS`) y ya se validó dos
veces que el guard **sigue cazando** la misma infracción fuera de las réplicas. Nota de historia que
conviene no repetir: `agent` pasaba por un **agujero**, no por una decisión —sus estilos viven en
bloques `styles:` inline de los `.ts` y el guard solo miraba `.scss/.css`, así que sus 23 literales
no se detectaban— mientras `cuscare`, que usa `.scss`, saltaba. Misma decisión de diseño, distinto
resultado según dónde viviera el CSS. **La incoherencia era el guard, no `cuscare`.**

---

## DD-36 · 2026-08-13 — Lo que NO se unifica entre los 4 flujos, y por qué (rescatado del plan de convergencia)

**Contexto** · El plan de convergencia de los 4 flujos (aprobado 2026-07-18) se archivó en
`docs/history/` etiquetado como *"construcción CERRADA, referencia histórica"*. La auditoría de
documentación de 2026-08 destapó que **no lo estaba**: seguía con olas abiertas, y guardaba siete
divergencias de UX **deliberadas** con su motivo que no estaban replicadas en ningún sitio vivo.
`customs-catalog.md` solo cubre divergencias de **token**, no de interacción, así que al borrar el
plan se habrían perdido — y sin el motivo escrito, la próxima pasada de "uniformar" las borra
creyendo que son descuidos.

**Decisión** · Estas siete divergencias se mantienen **a propósito**. Uniformar no siempre es mejor:

1. **El fondo como valor único** — mataría las tarjetas del builder y de AED. Converge una *regla
   por arquetipo*, no un token.
2. **La confirmación destructiva a un solo mecanismo** — poner puerta tecleada a borrar una
   categoría es fricción sin consecuencia; quitársela a borrar un usuario es peligro sin aviso.
   Confirmar todo igual entrena la **ceguera de confirmación**.
3. **El empty state de contact center** — sus hojas no listan nada, son matrices de permisos. Un
   vacío ahí no representa nada.
4. **El rail de 235px de AED** — es navegación local legítima. Converge el chrome de alrededor, no
   la existencia del rail.
5. **La puerta tecleada de la re-transcripción** — no es un borrado: cuesta dinero y sobrescribe.
   Su aviso de coste es contenido, no decoración.
6. **La ausencia de acción primaria en transcripciones.**
7. **`<h1>` visible en AED** — la regla a11y es *"toda página tiene un h1"*, no *"todo h1 es
   visible"*.

Y una convención que las hace legibles: cuando el mismo kebab lleva a dos sitios distintos,
**"Eliminar…"** con puntos suspensivos si abre una puerta tecleada, **"Eliminar"** si no.

**Razón** · Cada una tiene un motivo funcional verificado en su contexto, no estético. La nº2 es la
que más se malinterpreta: la asimetría *es* la protección.

**Descartadas** · *Unificar los 7 por coherencia visual* → rechazado, cada uno rompe algo concreto
(ver motivos). *Dejarlas solo en el plan archivado* → rechazado: es exactamente lo que estuvo a punto
de perderlas. *Meterlas en `customs-catalog.md`* → rechazado: ese doc es de divergencias de **token**
frente a Figma; estas son de **interacción** y su hogar es este registro.

**Consecuencias** · Con esto se borró `docs/history/` entero (consultable en el tag
`archive/docs-history`). Dos
datos más que viajan con él y hay que conservar:

- ⚠️ **Trampa del rail de AED (conflicto C3)**, que muerde directamente a **DD-34** y al item
  "lienzo de página gris↔blanco" **(RESUELTO en DD-45: a blanco, 2026-08-31)**:
  `settings-shell.component.scss:20-25` documenta que se movió el lienzo a blanco *porque el rail gris
  se fundía con un lienzo gris*. **Devolver el lienzo a `--sc-bg-default` re-crea ese bug** salvo que el
  rail cambie de token en la misma edición — por eso DD-45 va a BLANCO (`--sc-bg-canvas`), la dirección
  segura, y no al revés.
- ~~**El "undo asimétrico en usuarios" estaba mal diagnosticado**~~ → **CERRADO, y el rescate
  estaba rancio.** El plan archivado decía que `users.store.ts` no tenía `bulkUpdate()` y que
  faltaba una funcionalidad que presentar a producto. **Existe desde el 2026-07-18**
  (`users.store.ts:62`, commit `094f0f4` «usuarios recupera la edición masiva que le faltaba»), y
  sí pasa por undo (`users-list-page.component.ts:403,407`).
  ⚠️ *Este párrafo se escribió el 2026-08-13 copiando el plan sin verificarlo, y corregido el
  mismo día al auditar. Es exactamente `LEARNINGS` **#17** —toda descripción heredada es una
  paráfrasis— incumplida en el acto de rescatarla: al mover una claim de un doc archivado al
  registro VIVO de decisiones se le da un ascenso de credibilidad, así que ahí hay que verificar
  más, no menos.*

---

## DD-35 · 2026-08-07 — `sc-demo` → `sc-docs`; el Agent pasa de mockup idealizado a réplica fiel del producto real

**Contexto** · Dos piezas independientes, misma sesión. (1) `sc-demo` nació como "un demo rápido" pero
lleva meses siendo infraestructura viva a diario: gate de CI (`build:docs` + `audit:components` +
`usage:check`), smoke del tema, catálogo textual (`docs/inventory.md`) y superficie de e2e — "demo" ya
no describe lo que es. (2) `projects/agent` existía desde la Fase 3 (commit `44033ef`) como un cartón-
pluma **idealizado desde el propio DS** (`sc-gauge`, tokens `--sc-*`, datos genéricos en español,
"Nombre apellido"/"Nombre Grupo 1") — nunca fue una copia del producto real
(`agent.smart-contact.com/aed`). Rafa pidió una réplica **idéntica salvo backend**, para tener una base
real de la que tokenizar después, no una interpretación.

**Decisión** · (1) Rename técnico completo `sc-demo` → `sc-docs` (carpeta, `angular.json`,
`package.json`, CI, Playwright ×3, `scripts/*.mjs`, toda la doc viva) en rama
`refactor/sc-demo-to-sc-docs`. URL pública: **sc-doc.pages.dev** (singular — ver Descartadas). (2)
`projects/agent` reconstruido con CSS plano (NO tokens `--sc-*`, a propósito: fidelidad antes que
integración) y valores **extraídos** del sitio real vía `getComputedStyle`/muestreo de píxel — colores,
tipografía, spacing, 8 iconos SVG reales, timers vivos — en rama `feat/agent-dashboard`, desplegado en
**sc-agent.pages.dev**.

**Razón** · Para (1): un nombre que no describe el rol actual del proyecto es fricción cognitiva
permanente, y el coste del rename (mecánico, cubierto por `verify`+`e2e`) es menor que seguir
arrastrándolo. Para (2): la estimación desde capturas fallaba sistemáticamente — colores medidos
directamente en el sitio real diferían 15-40% de lo estimado a ojo (p. ej. fondo `#3e4246` real vs
`#1f2329` estimado, aro del gauge `#1c1f27` vs `#3a424c`), confirmado por Rafa comparando ambas
pantallas lado a lado. Solo la extracción directa cierra esa brecha.

**Descartadas** ·
- **`sc-docs.pages.dev`** (plural, coherente con el nombre interno) → colisión global de namespace
  `.pages.dev` (ya usado por otra cuenta, confirmado por Cloudflare con el sufijo aleatorio `-4a5`
  al reservarlo). `sc-doc` (singular) estaba libre. El id interno del proyecto sigue siendo `sc-docs`
  — mismo patrón que `agent`/`sc-agent.pages.dev`: el nombre interno y la URL pública no coinciden.
- **Reusar el cartón-pluma idealizado de Fase 3 y solo pulir detalles** → rechazado: partía de una
  interpretación del DS, no del producto; la tipografía sola estaba inflada 30-40% frente al sitio real.
- **Tokens `--sc-*` en el nuevo Agent** → rechazado por ahora: mezclar tokenización con fidelidad
  visual habría ocultado errores de extracción. La tokenización es trabajo aparte, a partir de esta
  base ya verificada contra el sitio real.

**Consecuencias** · **EJECUTADA** (estado verificado 2026-08-13): `projects/sc-docs` y
`projects/agent` están en `main` y en producción (`sc-doc.pages.dev`, `sc-agent.pages.dev`), con sus
proyectos Cloudflare ya repuntados a `main`. Queda **una** cosa suelta: el proyecto Cloudflare viejo
`sc-demo.pages.dev` sigue vivo sirviendo contenido antiguo y sus builds fallan — borrarlo es un clic
de Rafa en el dashboard. Los históricos NO se reescribieron con el nuevo nombre: documentan lo que
era cierto cuando se escribieron.

> ⚠️ Hasta el 2026-08-13 este campo decía *"Ninguna de las dos ramas está mergeada a `main`
> todavía"* — falso desde hacía semanas, en la entrada **más nueva y más leída** del fichero. Un DD
> describe una decisión (inmutable) y también un **estado** (perecedero): al ejecutar una decisión,
> vuelve a su DD y cierra el estado, o el registro empieza a mentir por donde más se lee.

---

## DD-34 · 2026-07-22 — `--sc-bg-default` es el SUELO del shell, nunca una superficie de contenido

**La pregunta era otra.** Rafa preguntó por qué en Contact Center el fondo parece gris y en el
resto blanco. Medidas las 17 rutas en los dos temas: **no existe tal división**. El lienzo de
página es `--sc-bg-surface` en 17 de 17. El gris que se veía era el del SHELL asomando por
debajo de donde acababa el contenido, en tres páginas cuyo `:host` no llevaba `height: 100%`
(452px de gris en `/reglas`, 345 en `/categorias`, y `/entidades` con el defecto **latente**).

**Lo que sí destapó la medición.** El sistema tiene tres tokens de superficie y **dos valores**
—`--sc-bg-elevated` vale lo mismo que `--sc-bg-surface` en ambos temas—, y los dos que difieren
lo hacen por nada: `bg-default` contra `bg-surface` es **1.06:1 en claro y 1.14:1 en oscuro**.
Lo que separa una tarjeta de su lienzo **no es el relleno** (1.00:1, son el mismo color): es su
borde de 1px, 1.34:1 en claro y 1.39:1 en oscuro. Es el mismo modelo que la referencia (Snow UI:
lienzo blanco, tarjeta blanca, borde al 10% del color de texto).

**Decisión.** `--sc-bg-default` es el suelo sobre el que se apoya un lienzo —el fondo del shell
detrás de sidebar y barra, y el lienzo del `settings-shell` en oscuro, donde `bg-surface` vale
lo mismo que el índice y se fundirían—. **Dentro de `main`, una región es o el lienzo de página
(`bg-surface`) o un bloque que se lee por su BORDE.** Se retira el único sitio que lo
incumplía: la bandeja gris de las tres páginas AED, invisible en claro (1.06:1 sobre lienzo
blanco) e **idéntica al lienzo** en oscuro (1.00:1). Era un resto del modelo anterior a S67-A,
cuando el lienzo de config también era gray-50; al pasar el lienzo a blanco se quedó sin
trabajo. Medido después: en oscuro la card **gana** separación, 1.581:1 contra el suelo frente
a 1.063 contra la bandeja.

**Lo que la decisión NO cubre, y hay que no confundir.** Siguen usando `bg-default`:

- **Estados** (hover de fila, seleccionado, deshabilitado, activo). Un estado no es una
  superficie; retirarlos borra feedback, no ruido.
- **Huecos hundidos dentro de una tarjeta** (grupo de condiciones del constructor, cajas de
  aviso de sistema, pie de numeración especial). En oscuro **funcionan** —card gray-900 sobre
  hueco gray-950—; en claro miden 1.06:1 y solo se leen por su borde. Es una asimetría real con
  su propia decisión detrás: queda **anotada, no aplanada**.

**Round-trip pendiente con Figma.** Retirar la bandeja es una **divergencia** con el maestro —
misma categoría que el tramo actual del breadcrumb (`customs-catalog §2.12`). Va al puente
código→Figma como propuesta para Marta, no se corrige en el código.

> **Corrección (S22), tras abrir la fuente.** Este párrafo describía la divergencia de oídas y
> se equivocaba en casi todo: el nodo `1:12381` **no existe**, el maestro real es `13593:5401`
> y ese `Main Content` **no pinta nada** (`fills: []`, radius 0) — ni gray/50 ni radius 12. Y
> la pantalla del maestro no es Contact Center: es **`ScMemoryRuleBuilderPage`** (el constructor
> de reglas), en la página `Flujos`.
>
> La divergencia **existe**, pero es más ancha y de otra naturaleza: lo que el maestro pinta en
> gris es el **lienzo de página** (`13593:5402` → `#f7f8fa` = `slate-50` = `--sc-bg-default`),
> con las cards blancas radius 8 encima. Medido a ambos lados, sobre la misma pantalla:
>
> | | lienzo | card | separación |
> |---|---|---|---|
> | maestro Figma | `#f7f8fa` | `#ffffff` | **1.063:1** |
> | código tras DD-34 | `#ffffff` | `#ffffff` | **1.00:1** (lo hace el borde) |
>
> O sea: el maestro usa exactamente el modelo que esta DD midió y descartó. La propuesta a Marta
> no es «quitamos una bandeja de una pantalla», es «el lienzo de página pasa de gris a blanco y
> la separación la hace el borde» — decisión de más alcance, **pendiente de confirmar antes de
> escribirla en Figma**.
>
> De paso, la fuente **respalda** el punto de abajo: los huecos hundidos SÍ están en el maestro
> (tres `Container` `#f7f8fa` radius 6 dentro de la card blanca del Alcance). La asimetría que
> esta DD dejó anotada es intención de diseño, no un descuido del código.

---

Última actualización: 2026-07-22 (**DD-34** `--sc-bg-default` es el suelo del shell, nunca una
superficie de contenido [3 tokens de superficie y 2 valores; default↔surface = 1.06:1 claro /
1.14:1 oscuro, o sea que lo que separa es el BORDE]; se retira la bandeja gris de Contact
Center — divergencia a proponer en Figma; estados y huecos hundidos quedan fuera y anotados ·
**DD-33** el título de página vuelve al CUERPO a 16px/600 sin banda [medido en Snow UI], el
`<h1>` se destapa como `.page__heading` y el trail gana un padre para no repetir la palabra;
las 9 páginas de repositorio no tenían `<h1>` ninguno · **DD-32** un solo acento: la familia
`accent`/`link` +
halo de foco se unifican con `info` bajo `sky`; repara 3.46:1 → 6.80:1 y obliga a
`text-on-accent`/`icon-on-accent` a blanco; barrido de 38 outlines hardcodeados a
`--sc-border-focus` · **DD-30** varias reglas activas a la vez + solape por unión [una conversación se procesa una vez, sin prioridad/conflictos], supersede el invariante «una sola activa» de DD-28; recorrido `/reglas` realineado · **DD-29** showcase «estilo Storybook» en sc-demo — motor propio, render por
`<ng-template>`+`viewChild` [no `NgComponentOutlet`], canvas aislado + knobs en vivo + snippet + API + sidebar por
categorías; 51/51 en formato story · **DD-28** reglas MVP: borradores fuera del todo + invariante «una sola activa»
(radio) + fuera prioridad/conflictos en el supervisor; recorrido `/reglas` realineado · **DD-27** constructor de
condiciones **v2** — refs tipadas dinámicas + modelo `value` + estimación de procesado [barra de proporción +
proyección día/mes] + guía de errores + duración con presets + scope MVP [fuera grabación/borradores]; mergeado a
main. · **DD-26** la base Variante B `conditionTree` 2 niveles + tipificación + builder progresivo · DD-25 gap footer
sc-dialog · var-docs de color re-apuntadas en Figma).

---

## DD-33 · 2026-07-22 — El título de página vive en el CUERPO (revisa parte de S59)

**Qué se revisa.** S59 («todo arriba») quitó de cada página su banda de título y dejó la
identidad SOLO en el breadcrumb de la TopBar. El `<h1>` sobrevivió `visually-hidden`: existía
para lectores de pantalla y el vidente no tenía título de página en ninguna ruta.

**Lo que la medición cambió.** Se midió en vivo la referencia que eligió Rafa —Snow UI
`/orders`, que es nuestro mismo arquetipo: barra con miga + tabla— y el título de página **no
vive en la barra**: es un encabezado de **16px/600 en el cuerpo, sin banda**. Lo que sobraba en
S59 era el CHROME de aquella banda (icono, borde, sombra, `position: sticky`), no el título.

**Decisión.** El `<h1>` se destapa como `.page__heading` (tokens `--sc-*-subtle-1`, que valen
exactamente 16px/600) en las 15 páginas de contenido. **No se añade encabezado**: sigue habiendo
uno por documento, así que el conteo de `page-identity.spec.ts` no cambia — cambia su veredicto.
Los **formularios quedan fuera**: su identidad la pinta su chrome propio (cabecera sticky /
ficha), y un título más sería el duplicado de S59 por otra puerta.

**Consecuencia obligatoria: el trail gana un padre.** Con la miga de un solo tramo, el título
del cuerpo repetía la palabra a 95px —«Usuarios» sobre «Usuarios»—, que es literalmente el
defecto que Rafa cazó en la sesión 17. Las diez rutas que tenían miga corta abren ahora con su
sección (`Administración ›`, `Configuración ›`, `Conversaciones ›`); las secciones que no son
rutas van con `link: false`. Es lo que hace la referencia (`Dashboards / Order List` arriba,
`Order List` en el cuerpo): la barra dice DÓNDE estás, el título QUÉ miras. **Sin el padre, esta
DD reintroduce el defecto que dice arreglar** — no se revierte una mitad sin la otra.

**Hallazgo de paso.** Las NUEVE páginas de repositorio no tenían `<h1>` **ninguno** — no oculto,
inexistente— así que su documento iba sin encabezado y `page-identity.spec.ts` no las cubría.
Ahora lo tienen, resuelto desde `config().titleKey`, que es la misma clave que la ruta usa para
su última miga: título y breadcrumb no pueden divergir.

**Nombre `__heading` y no `__title`, a propósito.** `.page__title` sobrevive como CSS MUERTO de
la banda de S59 en unas nueve hojas de página, con tamaños distintos entre sí (h2 en seguridad,
h3 en el hub). Una regla encapsulada de componente le gana siempre a una global, así que reusar
el nombre habría dado un tamaño por página sin que nada avisara. Lo vigila un test de
uniformidad que compara los 11 valores computados y exige uno solo.

**Alternativa descartada.** *Pintar el título en el shell desde el breadcrumb* (un sitio, cero
duplicación): el título tiene que alinearse con la columna de contenido, y su ancho sale del
arquetipo de página (`--list` 1600 / `--hub` 960 / `--reading` 832), que el shell no conoce.

---

## DD-32 · 2026-07-18 — Un solo acento: la familia `accent` se unifica con `info` bajo `sky`

**El problema no era una decisión discutible, era una que nunca se tomó.** `--sc-text-accent`
apuntaba a `cyan-600` desde el andamiaje inicial. No estaba en `customs-catalog.md` (el sitio
donde viven las divergencias conscientes), no hay ninguna DD que lo justifique, y **DD-23** —
que llevó `info` a la familia `sky` de marca — no revisó el alias. El DS acabó con **dos
acentos conviviendo**: `--sc-bg-info` en sky con `--sc-text-info` en cyan, y el **halo** del
foco en cyan alrededor de un **borde** de foco ya en sky.

**Decisión.** Toda la familia (`text/bg/border/icon` de `accent` y `link`, más el halo de foco)
pasa a `sky`. Detalle completo y tabla de tokens en `docs/customs-catalog.md §1.4`.

**No es solo estética — repara accesibilidad.** `cyan-600` sobre blanco daba **3.46:1**, por
debajo de AA para texto normal; `sky-600` da **6.80:1**. La contrapartida obligatoria:
`--sc-text-on-accent` e `--sc-icon-on-accent` **pasan a blanco**, porque `slate-800` sobre
`sky-500` cae a **2.48:1** (sobre `cyan-500` daba 5.89:1). Blanco sobre `sky-500`: 4.90:1.

**Barrido asociado.** 38 declaraciones `outline: 2px solid var(--sc-color-cyan-500)` en 31
ficheros hardcodeaban la primitiva para el anillo de foco en vez de consumir
`--sc-border-focus`. Verificado que las 38 estaban dentro de un `:focus-visible` antes de
migrarlas (cero falsos positivos).

**Alternativa descartada.** *Cambiar solo `--sc-text-info`* (una línea): arreglaba el síntoma
visible pero dejaba links, iconos y halo de foco en la otra familia — es decir, dejaba el
problema de consistencia intacto y sin registrar.

**Sin round-trip con Figma.** El export del Kit **no tiene concepto de `accent`** (0
coincidencias); `info` solo existe a nivel de componente y ya resuelve a `{sky.500}`. Las
líneas viven fuera de toda zona `@sc-gen` → el cambio sobrevive a `tokens:import` y ningún
gate lo marca como drift. **Corolario incómodo**: por eso mismo **ningún gate los vigila**;
`token-parity` §6 solo cruza lo que está en `scripts/color-map.mjs`.

**Abierto (no bloquea):** la rampa de texto atenuado está bajo AA sobre blanco —
~~`--sc-text-subtle` (slate-400) **2.04:1** y `--sc-text-secondary` (slate-500) **2.95:1**~~ → **CERRADO el 2026-07-19 sin pasar por Figma**: los dos son hoy `slate-600` (`02-semantic.css:57,84`) y cumplen AA; `secondary` además dejó de ser `enforce` y es `diverge` en `color-map.mjs:88`. Lo de abajo describe el estado anterior. No se
toca aquí: `subtle` es una divergencia consciente documentada (`02-semantic.css:40-44`) y
`secondary` está *enforced* 1:1 con el Kit por parity §6, así que subirlo es conversación de
marca con Figma, no un cambio de código.

---

## DD-31 · 2026-07-17 — Icono canónico del DS = Material Symbols **Outlined**, self-hospedado (unifica demo↔apps)

Cierra la mitad de «estilo» de la decisión abierta de iconografía del ROADMAP
(*Iconos: estilo + peso*). Estado previo: drift en tres sitios — el código del DS
servía **Rounded** self-hospedado (`@fontsource-variable/material-symbols-rounded`),
las apps (supervisor/agent) lo overrideaban a **Outlined** por CDN con una «decisión
de marca» documentada, y `customs-catalog.md` ya describía Outlined. sc-demo mostraba
Rounded; las apps reales, Outlined.

**Decisión:**
- **El icono canónico del DS es Material Symbols Outlined**, servido
  **self-hospedado** por `@smartcontact-hub/icons`
  (`@fontsource-variable/material-symbols-outlined`, familia
  `'Material Symbols Outlined Variable'`). Alinea código↔docs↔apps con el look que
  las apps reales ya tenían.
- **Las apps sueltan el CDN y su `.sc-icon` replicado.** supervisor/agent importan el
  `material-symbols.css` del DS (fuente única) y quitan el `<link>` de Google Fonts +
  el override; el `<sc-icon>` local del supervisor apunta a la familia self-hospedada.
  Los codepoints son idénticos entre estilos Material → el mapa de glifos generado no
  cambia.

**Consecuencia:** sc-demo pasa a Outlined (iguala a las apps); cada app sirve el woff2
self-hospedado (~340KB) en vez del CDN. El `font-display` del @fontsource es `swap` (el
CDN usaba `block`): posible FOUT breve de la ligadura en carga fría — aceptable (fuente
local, ya vigente en sc-demo).

**Abierto (no bloquea):** el **peso** del icono a la par de la tipografía y el ajuste
fino de ejes (wght/fill/opsz) sigue pendiente — la otra mitad del item de iconografía
del ROADMAP. ~~Y el icono de cabecera de `ScConfirmService` (API `icon?`).~~ → **HECHO**: `sc-confirm.service.ts:31` lo declara y `:68` resuelve `req.icon ?? 'exclamation-triangle'` (verificado 2026-08-13).

**Verificado:** `npm run verify` verde · AOT supervisor + agent + sc-demo · iconos
renderizan Outlined self-hospedado (sc-demo + supervisor: familia computada + woff2 200,
sin CDN) · CI no afectado (los snapshots de píxeles se saltan en CI,
`components.spec.ts:25`). Baselines visuales `-darwin` locales quedan por refrescar (no
gatean CI).

---

## DD-30 · 2026-07-17 — Reglas: varias activas a la vez, solape por unión (supersede el invariante de DD-28)

Revierte el invariante «una sola activa» de **DD-28**. Origen: trabajo de la UI
designer (rama `sandbox`) que levantó el límite en `RulesStore`, adoptado como
decisión de producto tras sopesar la consecuencia (reabre el solape que DD-28
esquivaba).

**Decisión:**
- **Varias reglas pueden estar activas a la vez.** `toggleActive` solo conmuta la
  regla tocada; encender una no apaga a las demás. `addRule`/`updateRule` dejan de
  forzar el patrón radio.
- **El solape se resuelve por unión, sin prioridad ni conflictos.** Si una
  conversación encaja en varias reglas activas, se procesa **una sola vez**
  aplicando la unión de lo que pidan (p.ej. la suma de categorías IA a detectar).
  Sin orden, sin «cuál gana», sin doble transcripción. Por eso NO se reintroduce la
  maquinaria de prioridad/conflictos que DD-28 retiró.

**Consecuencia (presentación, no producto):** el recorrido `/reglas` de sc-demo se
realinea: el beat «Prioridad y conflictos» pasa de «lo simplificamos a una sola
activa» a «siguen varias activas, pero el lío se disuelve con la regla de la
unión». Misma moraleja, distinto mecanismo. Snippet `manyActiveAfter` con el
`toggleActive` real.

**Abierto (producto, no bloquea el mock):** el detalle fino de la unión cuando dos
reglas piden análisis distintos (¿siempre se suman todas las categorías?, ¿algún
tope de coste?) lo cierra el equipo cuando exista el motor real. Hoy es mock.

**Verificado:** merge limpio de `sandbox` · AOT supervisor + sc-demo · typecheck (5
apps) + lint + i18n 1:1 (en/fr/pt) · CI verde.

---

## DD-29 · 2026-07-01 — Showcase de componentes «estilo Storybook» en sc-demo (motor propio, sin tooling nuevo)

La doc de componentes eran páginas con variantes hardcodeadas (sin canvas aislado, sin controles en vivo, sin código,
sin tabla de API, sin sidebar/categorías). Se reconvierte a un **showcase estilo Storybook COMPLETO** — pero como
**motor propio dentro de `sc-demo`** (Angular 21, tokens `--sc-*`, deploy Cloudflare Pages), **sin añadir Storybook ni
tooling nuevo**.

**Alternativas descartadas.** (a) *Storybook oficial*: pesado, otra build/estética, otra fuente de verdad de tokens
— rompe consonancia y el deploy actual. (b) *`NgComponentOutlet`* para pintar el componente desde metadatos: **no
soporta** el content-projection de `sc-select`/`sc-multiselect` (`pTemplate` vía `contentChildren`) ni el `model()`
two-way + `cellTemplate` de `sc-datatable` sin un adaptador por componente (= el trabajo manual que se quería evitar).

**Decisión — patrón `<ng-template>` por story.** El demo declara cada story como un `<ng-template>` con la API real
del componente (type-safe, proyección y `model()` nativos); el motor lo pinta vía `viewChild` + `ngTemplateOutlet` y
dibuja alrededor: **canvas aislado** (tema claro/oscuro/comparar local, aplicado a un wrapper, no a `documentElement`),
**knobs en vivo** (un `signal<Args>` que muta el contexto del outlet → re-bind instantáneo, OnPush; los controles
hacen *dogfooding* de sc-select/toggleswitch/inputtext/inputnumber), **snippet** serializado (`serialize-args`, puro) +
copiar, y **tabla de API**. `StoryHost` es **apilado** (todas las stories a la vista, no por pestañas) a propósito:
así los `data-testid` del Kit siguen en el DOM y los e2e de métrica los miden.

**Shell + rutas.** `/components` pasa a `StorybookShell` (sidebar fija: 7 categorías + búsqueda, derivada de
`component-catalog.ts` que evoluciona `component-pages.ts`) con las páginas como children; `/foundations`·`/uso`·
`/reglas` y el top-nav intactos; el toggle dark global sigue. *(El top-nav dejó de estar intacto el
2026-08-24: `/foundations`, `/foundations-type` y `/theme` se agruparon bajo `/fundamentos/*` para
bajar la barra de 7 destinos planos a 4 secciones. Las rutas viejas redirigen —con test en
`e2e/smoke.spec.ts`— así que nada de lo de arriba se rompió.)* **Los 51 componentes** (eran 49 al escribirlo) quedan en formato story (button
piloto + 46 migrados por lotes + `slot`/`subsection` nuevos) → **pokédex 49/49**. Migración por subagentes paralelos
con spec común + gate de integración (AOT + spot-check) por lote. `verify` entero verde.

---

## DD-28 · 2026-06-30 — Reglas MVP: borradores fuera del todo + invariante «una sola activa» + sin prioridad/conflictos

> **El invariante «una sola activa» queda supersedido por DD-30** (2026-07-17): se
> readmiten varias activas, con el solape resuelto por unión. El resto de DD-28
> (borradores fuera, sin grabación, sin prioridad/conflictos) sigue vigente.

Cierra la limpieza que **DD-27** dejó pendiente a propósito ("`isDraft`/`recording`/`'draft'` se dejan en el modelo
para no cascadear errores antes del merge — limpieza follow-up"). Origen: feedback de Rafa: solo una regla puede
estar activa, y desactivarla no crea inactivas ni borradores; solo aparece como inactiva. El supervisor aún
contradecía ese modelo: el listado mostraba la sección «Inactivas y borradores», el estado «Borrador sin editar»,
duplicar→borrador no-activable y el gating del botón Activar; el store mantenía `priority` + detección de conflictos
(vivos en código, invisibles en UI).

**Decisión** (solo `features/memory`; el `draft` de admin —agents/groups/users, DD#294— es OTRO concepto, intacto):
- **Borrador fuera del modelo**: `isDraft`/`duplicatedFromId`/`RuleStatus` eliminados de `rule.types.ts`; 2ª sección
  del listado «Inactivas y borradores» → «Inactivas»; **duplicar crea una copia inactiva normal** (editable/activable,
  sin estado especial); fuera el gating del botón Activar + i18n `status.draft`/`status.conflict`/`activate_draft_tooltip`/
  `builder.{draft_banner,discard_draft,draft_ready_toast,discarded_toast}`/`order_updated`/`cols.order`/bloque `conflict.*`
  en los 4 idiomas + el scss muerto del banner de borrador.
- **Invariante «una sola activa»** en `RulesStore`: `toggleActive`/`addRule`/`updateRule` desactivan el resto al activar
  una (patrón radio). El seed (`rules-mock.ts`) arranca con **1 activa + 3 inactivas** (antes 4 activas con `priority` 1..4).
- **Prioridad y conflictos eliminados** (maquinaria de un mundo multi-activa que ya no existe, muerta en UI): fuera
  `priority`, `conflictsByRuleId`, `isInConflict`, `getConflictingRules`, `reorderActive`, `scopeOverlaps`/`dimensionOverlaps`.
  El alcance plano (`servicios/grupos/agentes` vía `deriveLegacyScope`) se mantiene solo para el resumen en prosa del
  listado. Título del listado → «Regla activa» (singular).

**Verificado**: AOT supervisor + sc-demo verde · typecheck (5 apps) + lint + **125 tests** + `audit:components` verde ·
capturas reales del Supervisor (listado: 1 activa / 3 inactivas, alcance en prosa; builder editando una regla con
estimación «6 de 34» + barra + «≈74/día»). Único ✗ de `verify`: falso-positivo **pre-existente** de `docs:coherence`
(`AUDIT-DEUDA-2026-06.md:72` propone crear `scripts/paths.mjs`), ajeno a este cambio.

**Presentación (no es DD, nota de consecuencia)**: el recorrido `/reglas` de sc-demo (material, NO producto) reescrito
como **historia antes/después** — el giro a transcripción + 3 beats de transformación (alcance · prioridad/conflictos ·
borradores), cada uno con Antes / Ahora / Por qué, capturas comparadas (las «antes» extraídas de git) y código
antes/después. Skills `/impeccable`+`/minimalist-ui` aplicadas solo donde no contrastan con el DS (anti-slop, jerarquía,
editorial; descartadas sus fuentes/colores/iconos propios). Nombres propios → genéricos. Dark-safe + AOT/typecheck/lint verde.

---

## DD-27 · 2026-06-30 — Constructor de condiciones v2: referencias dinámicas + estimación + scope MVP

Evoluciona **DD-26** a producción real con membresía **dinámica** y recorta el scope al MVP. Mergeado a main.

**El problema de DD-26**: las condiciones guardaban **snapshots de nombre** (`agentes: ['María García']`) →
frágil (cambiar miembros de un grupo o renombrar no se reflejaba). Y dirección/duración filtraban en **dos sitios**
(builder + "Criterios de transcripción") con un bug (dirección ×2).

**Decisión**:
- **Referencias tipadas, no nombres** (`ConditionRef`: service por nombre [sin id] / group·agent·agentGroup·
  tipificacion·category por id) + **modelo `value`** (`any` comodín | `refs` | `enum` | `número`). Etiqueta y
  **membresía** se resuelven EN VIVO (`ConditionResolverService` + `GroupAgentLinksStore`), no se congelan. "Todos"
  = comodín (incluye futuros); un grupo en el campo **Agente** = `agentGroup` = "sus miembros AHORA". El árbol sigue
  derivando `servicios/grupos/agentes` planos (`deriveLegacyScope`) → listado/`scopeOverlaps` intactos.
- **Unifica dirección + duración como campos** del builder (cierra el abierto de DD-26) → mata el bug dirección-×2
  por construcción. Operadores contextuales por kind (lista: es/no es · número: más de/menos de/entre).
- **Estimación de procesado** (adaptada de la PPT del jefe, sticky): proyección día/mes desde el **ratio REAL**
  (matched/total sobre el mock) × volumen base demo documentado (`CONVERSATIONS_PER_DAY`) → es **estimación, no dato**.
  Barra de proporción (amplia vs quirúrgica). **Rechazado** un gráfico día/mes (2 números de escala distinta = slop).
- **Guía de errores** (`condition-validate.core.mjs`, pura+testeada): incompleta/rango inválido = **error** (bloquean
  guardar, revelado al **intentar guardar** — no acusa al crear); duplicado/contradicción/tautología = **aviso**
  (elección de Rafa: la validación guía y solo bloquea lo que está roto). Honestidad: contradicción/0-impacto se apoyan en el preview real.
- **Scope MVP**: sin priorización ni grabación (obsoleta por ley) → **fuera reglas de grabación** (seed + creación +
  Horario) y **borradores** (banner + flujo + toasts). Tipo por defecto = transcripción. Miembros de tipo
  `recording`/`isDraft`/`'draft'` se dejan en el modelo para no cascadear errores antes del merge (limpieza follow-up).
- **Arquitectura de tests**: lógica pura en `.mjs` (`condition-eval.core` [impacto+proyección], `condition-validate.core`,
  `duration-presets.core`) + `.d.mts` + wrapper `.ts` → cubierta por `test:unit` (node:test) en el gate. **118 tests.**

**Verificado**: verify entero verde (incl. `audit:components` regenerado: `sc-select` 31→33 por los presets), AOT,
118 tests, preview en vivo (impacto 8/34 → barra 24%, contradicción, presets, MVP sin grabación/borradores, regla del
jefe en la lista). **Slop/impeccable**: builder limpio (0 gradient-text, 0 border-left stripes, 0 glassmorphism); el
único visual añadido (barra de proporción) es dato real, no decoración.

---

## DD-26 · 2026-06-30 — Constructor de condiciones de reglas (Variante B + builder progresivo)

**Contexto**: el alcance de una regla de transcripción era rígido — 3 dimensiones (Servicio Y Grupo Y
Agente), AND entre ellas / OR dentro. La charla de reglas pidió potencia booleana real (match all/any,
mezcla AND/OR, agrupar) modelando la tipificación como entidad AND/OR, y "una sola regla activa" (esquiva
priorización). Esto es **producto real en el supervisor (app), no material de charla** → sí es DD.

**Decisión**:
- **Modelo recursivo aditivo** `Rule.conditionTree?` (`features/memory/data/condition.types.ts`): árbol de
  **2 niveles** (raíz → grupos → condiciones), cada nivel con `match: 'all'|'any'`. Campos: servicio /
  grupo / agente / **tipificación** (lista, op `es`/`no es`). NO anidación libre (sería Variante C) — el
  tope de 2 niveles cubre el caso real y mantiene la UI legible para un supervisor.
- **Puente con el modelo plano legacy**: al guardar se deriva `servicios/grupos/agentes`
  (`deriveLegacyScope`, unión de los `is`) para **no tocar** el listado ni `scopeOverlaps`. Es una
  **sobre-aproximación** (los `is_not` y el OR entre grupos no caben en los 3 campos planos) → marca
  conflictos de más, nunca de menos. Coherente con "una sola regla activa". `tipificación` no tiene
  dimensión plana → vive solo en el árbol. Reglas antiguas reconstruyen el árbol con `deriveTreeFromLegacy`.
- **Divulgación progresiva (lente `/impeccable`)**: con 1 grupo el builder es **plano** (un único control de
  coincidencia, sin toggle raíz ni caja); el chrome de grupos (toggle raíz + cajas slate-50 + conectores
  navy) solo aparece con **2+**. Al añadir el 2º grupo la raíz arranca en `any` (añadir grupo = alternativa
  O). Quita la redundancia del doble-toggle del caso común.
- **Quita "Atendida por"** del bloque Transcripción: era redundante con agente/grupo del builder
  (`attendedBy` fuera del modelo, builder y store).

**Verificado**: AOT + typecheck + lint + preview en vivo (plano↔agrupado, derivación legacy al editar regla
antigua, guardar→listado, mezcla AND/OR con precedencia). Commits `d873308`/`c815c0d`.

**Pendiente (decisión abierta)**: unificar **dirección + duración** como campos del builder (un solo sitio
para filtrar, sin el bloque "Criterios de transcripción" aparte) — requiere tipos de campo enum/número y
toca el flujo de **grabación** (dirección vive también ahí). Hoy siguen como bloque separado.

---

## DD-25 · 2026-06-22 — Gap del footer de sc-dialog: el wrapper proyectado es la fila flex

**Contexto**: Rafa reportó los botones del footer de los dialogs demasiado juntos, comparando con el ConfirmDialog
de Figma (`323:12317`, footer/gap 7 Kit). El token `--sc-dialog-footer-gap` (10.5px, divergencia consciente
del 7 de Figma por feedback de diseño previo) estaba aplicado a `.sc-dialog__foot`, pero su **único hijo** es
el `<div modal-actions>` que el consumidor envuelve → el `gap` separaba el wrapper, no los botones, que
quedaban a **0px** (medido).

**Decisión**: el `[modal-actions]` **proyectado** es quien debe ser la fila flex (`display:flex` +
`justify-content:flex-end` + `flex-wrap` + `gap`), vía `::ng-deep` (contenido proyectado bajo encapsulation
Emulated). Un solo punto en sc-dialog arregla los **13 dialogs** del repo. Medido en sc-demo: **0px → 10.5px**.

---

## DD-24 · 2026-06-19 — Regla icono↔font-size: los iconos *companion* siguen el font-size

**Contexto**: Estudiando el Kit (button, inputtext, iconfield) Rafa detectó incoherencia en cómo se
dimensionan los iconos. Hallazgo: en PrimeOne/el Kit un icono junto a texto es un **glifo de fuente** →
su tamaño ES el `font-size`. En código un icono-fuente hereda el font-size por cascada CSS; en Figma hay
que atar la W/H del icono a la misma variable de font-size que el texto (no hay cascada). `IconField` solo
posiciona y colorea (token oficial = solo `iconfield.icon.color`); **NO dimensiona**.

**Decisión (Rafa)**: un icono **companion** (junto a texto, dentro de un control: button/input/search/
chip/tag/select/menu…) **sigue el font-size de su componente** — `inherit`/`1em` en código; W/H atada a
la var de font-size en Figma (md=`app/font/size`; sm/lg=`{cmp}/sm·lg/font`). `--sc-icon-size-*` (DD-13)
queda **solo para iconos sueltos/decorativos** (ilustraciones, headers, logos), que conservan su tamaño.
Aplicación **GLOBAL** (todos los companion) pero ejecución por pantalla con QA visual (no sed a ciegas).

**Razón**: hace que icono y texto **rimen por fuente** (escalan juntos en sm/lg), no por casualidad de
valor. Mismo principio que la paridad: una sola fuente de verdad — aquí, el font-size del componente.

**Estado (2026-06-22) — EJECUTADO en el DS**: `sc-icon` gana `size="inherit"` (`font-size: 1em`); migrados los
11 companion de la cara-A del DS (search, chip, inline-rename, delete-entity, column-selector, bulk-action-bar,
form-section-nav, keyboard-shortcuts, sticky-form-header, command-palette, impact-preview). Dos hallazgos del
QA visual: **(1)** cuando el icono es **hermano** del texto y no descendiente (iconfield de sc-search, head de
command-palette) el **host** debe portar el font-size por variante para que el icono herede el correcto a sm/lg
(si no, a sm el icono se queda en 14 con el input a 12). **(2)** los `<button>` **resetean** el font-size al
default del UA (~13.3px) → el wrapper debe ser **transparente** (`font-size: inherit`) para que el icono rime;
en el DS se hizo por-componente. En las **apps** el reset global ya existe
(`supervisor/styles/_reset.scss` → `input, button, textarea, select { font: inherit }`), así que el barrido de
la app (Bloque 3) NO necesita plumbing por-botón — es mecánico. **md no-leak** confirmado: `.p-button`/
`.p-inputtext` a md ya llevan `--sc-font-size-200` (14), no se fuga al 1rem de PrimeNG.
**Bloque 3 (app) — EJECUTADO (2026-06-22)**: 153 companion del supervisor pasados a `size="inherit"`. Hallazgo:
~~el `<sc-icon>` del supervisor es un **wrapper propio**~~ → **YA NO** (verificado 2026-08-13: ese directorio no existe; los usos los sirve el `ScIconComponent` del DS vía `@smartcontact-hub/icons`). Decía que NO era el
`ScIconComponent` del DS — lo cazó el build AOT; le añadí soporte `inherit` (`1em`, opsz al default, espejo
del DS). **Standalone pinneados a propósito**: page-headings, empty-states (20/28), avatares, focal del
player-state (24), chips de tamaño fijo, `[size]="22"`. **Controles deliberados revertidos** (no riman con
texto): transport del reproductor (back10/play/fwd10), toolbar de conversation-filters, back del rule-builder.
Validado: AOT + verify + render en vivo (space_dashboard→16, arrow_outward→12).
**Pendiente**: Figma 4a (atar W/H de iconos companion a la var de font-size: huecos button-default, inputtext)
+ sync de los 3 copys de General (Recepción/Mostrar) a los nodos de texto de Figma.

---

## DD-23 · 2026-06-19 — Paridad de nombres token ↔ Figma (rename a los nombres del Kit)

**Contexto**: Tras el re-sync de valores soft-blue↔cyan (DD-22), Rafa aclaró que el punto NO es de
marca sino de **paridad de nombres**: no tiene sentido que un token `--sc-*` se llame distinto que su
variable en Figma: el token lleva el nombre de familia de Figma (`cyan` → `--sc-color-cyan`).

**Decisión (Rafa)**: los nombres de familia de color del CÓDIGO adoptan los nombres del Kit/Figma:
`soft-blue → cyan`, `electric-blue → sky`, `gray → slate` (`blue` ya coincide). El **rol de marca**
(Soft Blue / Electric Blue / Gray) vive en la **descripción** de la variable, NO en el nombre del token.
**SUPERSEDE** el "auto-derive soft-blue" de DD-22 (al renombrar no queda rename que derivar; el chivato
§7 pasa a identidad trivial; `palette-map` queda identidad).

**Razón**: un dev no debería traducir nombres entre Figma y código. Paridad = cero confusión y el puente
más legible. Es el principio "el Kit es la verdad" aplicado también al NOMBRE, no solo al valor.

**Consecuencia / pendiente**: refactor ANCHO (rename en primitivos, semántico, `base.ts`, SCSS de TODOS
los componentes, apps, `palette-map.mjs`→identidad, generadores/auto-import, + re-apuntar las var-docs de
Figma a `--sc-color-cyan-*` etc.). Es el **PRIMER gran bloque** (desbloquea var-docs limpio + Code Connect).
Planificado en `NEXT-SESSION.md` §GRANDES BLOQUES; NO ejecutado aún (se planifica fresco). Conceptualmente
simple pero amplio → find-replace con frontera (`--sc-color-gray-` exacto; `gray` es palabra común).

**EJECUTADA 2026-06-19** (commits `89be2be` código + `4da83a6` docs): rename completo (73 ficheros, valores ya idénticos al Kit → cambio nominal), `palette-map`→identidad, alias `--sc-spacing-*` blindado 1:1, var-docs de Figma PENDIENTES de re-apuntar (necesita el bridge).

---

## DD-23·b · 2026-06-22 — Sync Figma: var-docs de color re-apuntadas al Kit

> *Apéndice de DD-23.* Antes se titulaba "Sync Figma (DD-23)", sin número: rompía el barrido
> `grep "^## DD-"` y no salía en ningún índice. Numerado el 2026-08-13.

Las **33 variables primitivas de color** (cyan/sky/slate × 11 shades) tenían `codeSyntax` + `description` aún
en los nombres viejos (soft-blue/electric-blue/gray) pese a que el **nombre** de la variable ya era
cyan/sky/slate → Dev Mode mentía. Re-apuntadas en Figma vía el bridge: `codeSyntax` → `--sc-color-{cyan,sky,
slate}-N`; descripción con el rol de marca (`(marca: Soft-Blue/Electric-Blue/Gray)`). Verificado: 0 nombres
viejos restantes en ningún campo. **Aclaración del "530"**: solo había **33** vars a re-apuntar (las primitivas
cyan/sky/slate × 11 con el nombre VIEJO en codeSyntax). El "530" del plan NO era un error de Figma (Figma es la
fuente de verdad, no desvía) — era el TOTAL de vars documentadas el 2026-06-19 (154 color + 40 scale + 336
component, ver el DD de var-docs arriba); el plan aplicó ese número-de-otra-cosa a esta tarea. Las ~497
non-color tienen codeSyntax `--sc-cmp-*`/`--sc-scale-*`, nunca apuntaron a una paleta. Pendiente Figma: atar
W/H de iconos companion a la var de font-size (Bloque 4a).

---

## DD-22 · 2026-06-19 — Fase 2.2 (galería de uso) + Fase 3 (Agent + sc-gauge) + auditoría de tokens + var-docs Figma

**Contexto**: Sesión larga tras cerrar el puente (DD-21). Se atacaron Fase 2.2, Fase 3, la
auditoría de tokens que el chivato §7 dejó pendiente, y se empezó a documentar las variables de Figma.

**Decisión**:
- **Fase 2.2 (galería de uso real)** — entregable = **página navegable en sc-demo** (`/uso`), NO doc
  markdown (SUPERSEDE el plan). Captura Playwright del Supervisor (config aislada `:4290`) escanea el
  DOM por componentes `sc-*` (verdad de campo) → `_usage-status.json` + PNGs; guard `usage:check` sin
  navegador. (commit `b9f3e53`)
- **Fase 3 (Agent)** — app nueva **`projects/agent`** (standalone) + componente DS nuevo **`sc-gauge`**
  (anillo SVG; el único gap del recon). Dashboard oscuro montado 100% con el DS + sc-gauge. (`44033ef`)
- **Auditoría de tokens** — todas las paletas 1:1 con el Kit salvo `soft-blue` (curado a mano, desviado)
  y green-950 (divergencia consciente). Decisión de Rafa: **re-sync soft-blue al cyan del Kit** (adoptar
  Kit, NO auto-derive) + el §7 lo BLOQUEA 1:1 (quitada la excepción "pendiente"). (`ea3962b`)
- **cmp-color-rewire adelgazado** — la value-equality del `check` era CIRCULAR (HEAD ya tiene el var)
  → retirada + herramientas de migración (report/excludes/rewire); queda SOLO el guard vivo (hex
  hardcodeado en slot generado, por-modo). 318→137 líneas. (`08dfe46`)
- **standard/extended** — dejado cosmético (sin cambio); override 1-línea en component-audit-map cuando se quiera.
- **W5 (marca al Kit)** — PINTADO el antes/después (warn ámbar→amarillo, dark gris-SC→zinc) + STAR en la
  página BACKLOG de Figma (`khNq9dJKNi13pNllrqm6dx`, frame `13268:3769`). **PENDIENTE: validación de Rafa**.
- **var-docs Figma** — probado que el bridge ESCRIBE description + code-syntax. **530 variables
  documentadas** (todas las de token `--sc-*` directo): 154 primitivos color (renames cyan→soft-blue,
  slate→gray, sky→electric-blue visibles en Dev Mode), 40 radius/scale, 336 component own-token. Las
  non-DS (1027 componentes PrimeNG no envueltos + 88 paletas Tailwind no usadas) se dejan EN BLANCO a
  propósito (no tienen token `--sc-*`).

**Razón**: cada fase del orden maestro + cerrar el desfase real que §7 cazó; documentar la fuente
(Figma) para que la rename cyan↔soft-blue no confunda a un dev.

**Consecuencia / PENDIENTE**:
- **W5**: aplicar (base.ts warn→yellow / surface dark→zinc + quitar EXCLUDEs + regenerar) SOLO tras
  validación de Rafa en la página backlog de Figma.
- **var-docs (~811)**: component-sizing-alias (669 de componentes DS) + semantic (142) necesitan un
  **script repo-mapping** que dé el token IDIOMÁTICO (sizing→`--sc-spacing-*`, semantic→`--sc-bg/text-*`),
  NO el primitivo (puro-Figma daría `--sc-scale` y confundiría). Receta: leer kit-export +
  sizing-map/color-map/cmp-color-map → {var Figma → token} → bulk-write vía bridge.
- **auto-derive soft-blue**: opcional (generarlo del cyan → imposible que se desvíe; hoy §7 lo caza).

---

## DD-21 · 2026-06-18 — Puente PROBADO de extremo a extremo + sombras fluyen + pokédex

**Contexto**: DD-20 declaró la ARQUITECTURA del puente (un generador por clase de valor). Esta
sesión lo CIERRA y lo PRUEBA.

**Decisión**:
- **Sombras (`aura/effects`) fluyen del Kit** vía `token-gen-effects.mjs` → `--sc-cmp-*-shadow`,
  leídas por el preset (rewire de 53 slots). El Kit es la verdad: el tinte slate de marca se retira
  (decisión de Rafa: manda el Kit). Guard `tokens:effects-rewire` impide volver a hardcodear hex.
- **Completitud §8**: cada hoja de `semantic/common`/`app`/`effects` queda clasificada (fluye /
  divergencia / no-consumida); una hoja NUEVA del Kit sin clasificar → ROJO.
- **Mini-test e2e (la "puerta")**: `bridge-e2e.test.mjs` prueba en sandbox que un cambio del Kit
  aparece en el CSS por CADA generador. Regresión para siempre → el puente está PROBADO, no solo montado.
- **Hand-off durable**: `docs:coherence` verifica que el sello de `NEXT-SESSION` apunta a un commit real.
- **Pokédex** (`audit:components`): clasificación dev-facing auto-generada (provenance / PrimeNG / API /
  uso real en el Supervisor), guard anti-desfase. Base de la Fase 2.

**Razón**: "nada se cae en silencio" hasta el final — toda clase de token fluye Y se verifica, y el
hand-off no puede mentir. Verificado por Rafa a mano (cambió radius/color/tamaños en Figma → localhost).

**Consecuencia**: la Fase 1 (el puente) está CERRADA. Pendiente de MARCA (no del puente): alinear las
divergencias conscientes (warn→amarillo, dark→zinc, soft-blue↔cyan) como paso DELIBERADO (W5).

---

## DD-20 · 2026-06-17 — Puente Figma→código COMPLETO: un generador por clase de valor + chivato como garantía de completitud

**Contexto** · Tras DD-18 (sizing) y DD-19 (color semántico), una sesión de testing real destapó que el
espejo NO está completo. Auditoría del export vs los generadores: fluyen primitivos, color **semántico** y
sizing de componente; NO fluyen el **color de COMPONENTE** (`aura/component/light|dark`, 346+346 tokens —
toast/botón/tag…), **effects** (129) ni **app** (6). El operador cambió el color de toast (blue→sky) + un
fondo translúcido y el sistema dio **VERDE en los dos carriles pero no aplicó nada** ("verde-mudo"): el
cambio se evaporó en silencio. Repetido (radius, yellow, sky), fue la fuente de su frustración. Norte del
operador (solo, no-dev): el puente debe ser impecable y autosuficiente — cambia CUALQUIER token → fluye →
lo ve; **no perseguir a un dev** (salvo bugs).

**Decisión** · (1) **Una clase de valor = un generador.** Añadir el set que falta: `token-gen-cmp-color.mjs`
(+ `cmp-color-map.mjs`) para color de componente — **UNO general para TODOS** (no uno por componente); +
cubrir effects/app. (2) **Garantía de completitud:** todo token del export debe (a) fluir por un generador,
(b) ser divergencia/custom documentada, o (c) DISPARAR EL CHIVATO. `token-parity.mjs §7` recorre el export
ENTERO y FALLA (rojo, en cristiano) cuando un token cambió y nadie lo recogió. (3) **Transparencia:** el
export trae `#rrggbbaa`; se reconstruye como `color-mix(… var(--sc-color-X) N%, transparent)` (idioma del
CSS). (4) **Marca vs Kit:** cada color de componente se etiqueta una vez `mirror`/`brand`, default `brand`.
(5) **Feedback de 3 niveles:** local `preview:live` (instante) → preview link Cloudflare (~2 min) → main.

**Razón** · Auditoría verificada (2026-06-17, `node` sobre el export): `aura/component/light|dark` 346+346,
`aura/effects` 129, `aura/app` 6, y `grep` confirma que NINGÚN generador los lee. El verde-mudo es el fallo
de fondo: el operador no puede confiar en un sistema que dice OK sin hacer nada. El chivato como garantía
hace IMPOSIBLE el silencio sin tener que escribir un generador para cada rincón.

**Descartadas** · (a) *Curar a mano el color de componente (un dev edita 04-component.css a petición)* —
RECHAZADO por el operador: contradice "no perseguir a un dev". (b) *Un generador por componente* — no
escala (policing); se hace UNO general table-driven. (c) *Emitir hex/rgba crudo* — rompe "no hex crudo"; se
reconstruye color-mix (mismo resultado visual, trazable). (d) *Dejar el feedback rápido en el roadmap* —
RECHAZADO: proceso sin fricción ya. (e) *Solo generadores, sin chivato* — deja huecos silenciosos.

**Consecuencias** · El espejo pasa a COMPLETO + auto-verificado: nada se cae en silencio. Pendiente (orden
aprobado): `preview:live` → generador color-componente → chivato §7 → effects/app → CI ~2 min. Lo afinado a
mano (frosted dark…) sigue a mano pero el chivato lo marca (correcto, no fallo). Plan:
`~/.claude/plans/async-greeting-pumpkin.md`. Absorbe la duda de distribución (DD-19/consumo): **GitHub
Packages privado, dos profundidades del mismo paquete**; el operador confirmó que los devs SÍ consumen (un
equipo tokens `--sc-*`, otro "el tema").

---

## DD-19 · 2026-06-16 — Color semántico auto-aplicado desde el Kit (espejo de color)

**Contexto** · Tras DD-18 el **sizing** fluía Figma→código solo, pero el **color de marca** seguía con
gate humano (editar la capa curada a mano). El operador (solo, no-dev) quería que CUALQUIER cambio
—incl. color— se viera en el preview sin fricción. El mapa export↔`--sc-*` ya existía inline en
`token-parity.mjs` §6 (41 filas enforce + 7 divergencias conscientes); solo se comparaba, no se generaba.

**Decisión** · Tercer generador `token-gen-color.mjs` (hermano de `token-gen.mjs` / `token-gen-component.mjs`)
lee las filas GENERABLES del mapa compartido `scripts/color-map.mjs` (extraído 1:1 de parity §6),
resuelve cada color del export a su hex terminal y lo **mapea a la primitiva `--sc-color-*` existente**,
escribiendo `--sc-token: var(--sc-color-*)` en zonas `@sc-gen:semantic-color-{light,dark}` de
`02-semantic.css` / `07-dark.css` (13 light + 3 dark). Respeta las **7 divergencias** (DIVERGE) y los
~10 `color-mix` (custom SC, fuera del export) que quedan a mano. + chivato a11y en parity **§6b** (WCAG
AA en pares críticos). `tokens:import` corre los 3 generadores; `verify` valida las 3 zonas.

**Razón** · El mapa ya era fuente de verdad (ahora compartido por parity + generador, como el sizing).
Emisión **value-preserving**: los 16 valores generados == los curados (e2e **58/58**, parity **41/41**).
Clave: emitir `var(--sc-color-*)` (no hex crudo) preserva el contrato `--sc-*` + la indirección;
resolver `export→hex→primitiva` (reverse-map, **0 colisiones** verificadas) absorbe gratis el rename
slate→gray del Kit. Prueba de fuego: `text.muted.color` {surface.500}→{surface.600} en el export →
`tokens:import` → `--sc-text-secondary` gray-500→gray-600, parity verde, **0 `.ts` tocado**, revert limpio.

**Descartadas** ·
- **Adoptar el preset que escupe el plugin (`.theme-designer/`) tal cual** → rompería el contrato
  `--sc-*`, las divergencias y el a11y: usa el idioma PrimeNG (`--p-*`) con los valores del Kit crudos.
- **Emitir hex crudo en las zonas** → rompe "sin hex en capas curadas" + pierde la indirección a
  primitiva (cambiar `blue-700` dejaría de cascadear). Si un hex no tiene primitiva → falla ruidoso.
- **Una capa generada que OVERRIDE a la curada** → duplica declaraciones (last-wins) y vuelve parity
  tautológica para esos tokens (compararía generado-desde-export contra el export).
- **Auto-aplicar los `color-mix` / la paleta de dominio (labels)** → no están en el export (custom SC).

**Consecuencias** · Cualquier cambio de color semántico en el Theme Designer → `tokens:import` → vivo,
sin mano, como el sizing. Las 13 light + 3 dark son GENERADAS (zonas `@sc-gen:semantic-color-*`, no
editar). `DIVERGE` en `color-map.mjs` blinda las 7 divergencias (opt-in). El chivato §6b **cazó un real**:
primary dark `gray-900`/`blue-400` = **3.01:1** (bajo AA; el comentario afirmaba ~5.9:1) → `A11Y_KNOWN`
+ flagged **W5** (ni gray-900 ni blanco llegan a AA sobre blue-400 → pide cambiar el color del primary
dark). Pendiente W5: ese primary dark + los grises suaves (secondary 2.95:1, subtle 2.04:1, sub-AA a propósito).

---

## DD-18 · 2026-06-15 — Sizing de componente auto-aplicado desde el Kit (puente seamless)

**Contexto** · El loop Theme Designer→código solo era seamless para PRIMITIVOS (escala/radio/zinc):
el generador los regeneraba y parity los validaba. Un cambio de **sizing de componente** (radio,
padding, fontSize de botón/input/overlay…) caía en rojo y exigía editar el preset a mano — el
operador (solo, no-dev) lo vivía como "el puente me persigue". Verificado: el mapa export↔preset ya
existía en `token-parity.mjs` (las 53 filas §4); solo se comparaba, no se generaba.

**Decisión** · Un segundo generador `token-gen-component.mjs` (hermano de `token-gen.mjs`) lee cada
slot del mapa compartido `scripts/sizing-map.mjs` desde el export y escribe tokens `--sc-cmp-*` en la
zona marcada `@sc-gen:cmp-sizing` de `04-component.css` (rem = px/16, igual que los primitivos). El
preset referencia esos `--sc-cmp-*` en vez de `var(--sc-scale-*)`/`{refs}`. `tokens:import` corre los
dos generadores; `verify` valida ambas zonas. Así un cambio de **sizing** en Figma fluye a vivo sin
mano. El **color** sigue con gate humano (protege divergencias de marca; ver `customs-catalog.md`).

**Razón** · El mapa ya era la fuente de verdad (no se reinventa). Estrategia más segura de 3: emitir
CSS vars `--sc-cmp-*` (reusa el `rewriteRegion` ya probado, cero parsing de TS, imposible
doble-aplicar la normalización rem) vs reescribir el preset TS in-place (frágil) o un TS generado
(más novedad). Migración value-preserving: **e2e 58/58 sin un pixel de diff**; parity 53/53. Prueba
de fuego: `form.field.border.radius` md→lg en el export → `tokens:import` → parity verde sin tocar
ningún `.ts` (botón + input siguieron al export); revert determinista, idempotente.

**Descartadas** ·
- **Reescribir el preset TS in-place** → frágil (riesgo de tocar leaves de color en módulos de 500+
  líneas); el writer de CSS marcado es trivial y ya probado.
- **Auto-aplicar también el color** → no: el color de marca tiene divergencias conscientes (grises
  navy vs zinc del Kit); auto-sobrescribirlas las borraría. Color = gate humano + hint copy-paste.
- **Dejar el sizing como "human applies"** → era la fricción exacta que el operador pidió eliminar.

**Consecuencias** · Cualquier cambio de sizing en el Theme Designer → `tokens:import` → vivo, sin
intervención. `DIVERGE_SIZING` (`sizing-map.mjs`, vacío hoy) blinda una divergencia de sizing
deliberada (opt-in, único toque humano). Los 53 `--sc-cmp-*` son GENERADOS — no editar (zona
`@sc-gen:cmp-sizing`). Pendiente futuro: extender el mapa para slots fuera de las 53 (p.ej. el
custom `app.toggleswitch`).

---

## DD-17 · 2026-06-15 — Consolidación monorepo: el Supervisor entra al repo del DS

**Contexto** · Rafa es operador **solo y no-dev**; quiere feedback **instantáneo** (tocar un token →
verlo en la doc Y en los flujos) + **ramas compartibles**. El modelo de **2 repos + paquetes
publicados versionados** está pensado para equipos; para un solo no-dev es **pura fricción** (token
401 en CI, lag de publicar+bump, dos repos que confunden, Netlify pidiendo suscripción). Su instinto
inicial (meter la app dentro del DS) era **correcto para su caso**. (Memoria [[user-solo-nondev-seamless-first]].)

**Decisión** · **UN repo.** El Supervisor entra como `projects/supervisor` y consume el DS por
`tsconfig paths` → `./dist/*` (como `sc-demo`): instantáneo, sin publicar/versionar. Los paquetes
`@smartcontact-hub/*` quedan **APARCADOS** (dormidos, para un futuro consumidor externo). El repo
`smart-contact-platform` se **archiva** (read-only, reversible), **PR #51 se cierra** (superado). Lo
útil de `ds-docs` se funde en `sc-demo` + `docs/inventory.md`. Hosting → **Cloudflare Pages** (link
por rama, gratis); fuera Netlify y GitHub Pages.

**Razón** · El desacople publicado optimiza **multi-consumidor** (que no existe: 1 app, 1 persona) a
costa de fricción diaria pagada **ahora** → YAGNI. El Supervisor es **frontend + mock, sin secretos**
(verificado) → seguro como estático público. La migración previa (`feat/adopt-published-ds`) **no se
desperdicia**: sus imports `@smartcontact-hub/*` resuelven local por paths — es justo lo que se copia.

**Descartadas** ·
- **Mantener 2 repos + paquetes publicados** → fricción para 1 consumidor solo (lo que sufría Rafa);
  el beneficio (multi-team) puede no llegar nunca.
- **Borrar los scripts de publish** → no; se aparcan (coste cero, recuperable si entra otro consumidor).
- **Netlify (Free, 1 site)** → Rafa quería salir; Cloudflare da per-branch gratis sin cap de créditos.
- **GitHub Pages para todo** → no da preview por rama (lo que Rafa pidió para compartir).
- **Re-implementar la app como dogfood en sc-prototype** → desperdicia la app real ya hecha.

**Consecuencias** · Loop seamless: Theme Designer → PR tokens → merge → Cloudflare reconstruye
`sc-demo` **y** `supervisor` (~1-2 min, sin publicar). Repo público con app + DS + showcase. Los 4
gaps del DS siguen como **locales** en el Supervisor (`shared/components`). Paquetes = aparcados
(correr `publish:packages` solo antes de un release externo real).

**Ejecutado (2026-06-15)** · `sc-prototype` jubilado y **GitHub Pages retirado** (`deploy-demo.yml`
borrado, Pages deshabilitado) — los supera el Supervisor + Cloudflare. `smart-contact-platform`
**archivado** (read-only, reversible; preserva audits/galerías) + **PR #51 cerrado**. Hosting vivo en
**Cloudflare Pages**, ambos en raíz con preview por rama automático:
- **sc-docs** → https://sc-doc.pages.dev (showcase; hash-routing, SPA-safe sin `_redirects`).
  *Renombrado por DD-35 — el proyecto era `sc-demo` y su URL `sc-demo.pages.dev`, que sigue viva
  sirviendo contenido antiguo hasta que Rafa la borre.*
- **agent** → https://sc-agent.pages.dev · **cuscare** → https://sc-cuscare.pages.dev (réplicas, DD-35/DD-37).
- **supervisor** → https://sc-supervisor.pages.dev (app real; routing por path + `_redirects` SPA).

---

## DD-16 · 2026-06-14 — Showcase (`sc-demo`) desplegado a GitHub Pages; repo abierto a público

> **SUPERSEDED por DD-17 (2026-06-15)** · GitHub Pages se retiró a favor de **Cloudflare Pages**
> (preview por rama, ambos sitios en raíz). El repo sigue público. Se conserva este registro como
> histórico del primer hosting.

**Contexto** · El consumidor (`smart-contact-platform`) tenía su `ds-docs` desplegado que aplicaba
tokens al instante; este repo no tenía página viva — `sc-demo` solo corría en local y CI hacía
`build:docs` sin publicar. El usuario quería una página viva del DS, equivalente a su `ds-docs`.

**Decisión** · Workflow `deploy-demo.yml` que construye `sc-demo` y lo despliega a **GitHub Pages**
on-push-to-main (`base-href /smartcontact-ui/`, opt-in a Node 24 vía `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`).
Para habilitar Pages en plan Free se abrió el **repo a público** — el *source*, no los paquetes npm
(siguen privados en GitHub Packages). URL: https://smartcontact-hub.github.io/smartcontact-ui/.

**Razón** · Cierra el round-trip de tokens de forma **visible**: cambio de variable en el Theme
Designer → PR `design-tokens-sync` → merge a main → redeploy → página viva (~1-2 min). Pages desde
repo privado requiere plan de pago; el historial se escaneó limpio antes de abrir (`.npmrc` nunca
commiteado + gitignored, cero patrones de token/clave) y el código del DS no es sensible.

**Descartadas** ·
- **Dominio propio (CNAME)** → el usuario no tiene dominio extra; `github.io/smartcontact-ui/` vale
  para un showcase. (Si algún día se quiere: re-puntar `base-href` a `/` + CNAME.)
- **Sitio raíz de la org** (`smartcontact-hub.github.io`) → "gasta" el sitio-raíz de la org en el
  showcase; diferido.
- **Mantener el repo privado + Pages** → requiere plan Pro/Team (y el sitio sería público igual).
- **Dejar el showcase solo en local** → no daba la página viva que se pedía.

**Consecuencias** · `sc-demo` se publica solo en cada push a main; el round-trip de tokens es ahora
end-to-end visible. El repo es **público** (source/historial/docs world-readable; paquetes npm
siguen privados). `.claude/launch.json` documenta el arranque local (sc-demo 4200, sc-prototype 4300).

---

## DD-15 · 2026-06-14 — Optimización del pipeline de tokens: rebanadas baratas ahora, lo caro diferido

**Contexto** · Se planteó automatizar dos cosas grandes: generar la capa de color semántico
desde el export, y validar/generar el preset para sobrevivir a subidas de versión de PrimeNG.
Ambas son semanas de trabajo.

**Decisión** · Hacer ahora solo las rebanadas baratas y seguras: unit tests de la ley v/14
(`token-naming.mjs` + `node --test`, cableado en `verify`) y un hint copy-paste en `token-parity`
cuando un color de marca diverge. Diferir el generador de color completo (opt-in). Disolver el
validador propio de preset.

**Razón** · Ya tenemos validadores potentes para el presente (`token-parity` evalúa el preset
real vs export, `tokens:guard`, color §6). El generador de color ataca un dolor menor (los
semánticos cambian poco) con coste/riesgo alto (parte la capa en generado+a-mano+guard y mete un
config = 2ª fuente de verdad). El validador de preset lo cubre **upstream** el Migration Assistant
del Theme Designer (escanea el tema y añade tokens que faltan) + el resolver de refs.

**Descartadas** ·
- Construir el generador de color ahora → over-engineering; el flujo "rojo-flag → humano" cumple y
  el hint copy-paste lo suaviza.
- Construir un validador/generador de preset propio → redundante con el Migration Assistant.
- Meter el resolver de refs del preset en `token-parity` ya → diferido: riesgo de falsos positivos
  que romperían el guard core; se hace aparte con cuidado.

**Consecuencias** · `verify` corre `test:unit`. El validador de preset queda DISUELTO en favor del
Migration Assistant (verificar su comportamiento la 1ª vez que subamos versión — lección
integration-glue). Generador de color y resolver de refs = follow-ups con disparador escrito.

---

## DD-14 · 2026-06-14 — Sistema operativo de documentación y aprendizaje (repo que aprende de sí mismo)

**Contexto** · El repo acumulaba docs sin jerarquía clara de "qué doc manda en cada tema", y las
lecciones de cada sesión vivían solo en la memoria privada del agente (ni trazable ni compartida).
Una sesión se perdió usando el MCP de Figma equivocado y por insistir en un camino bloqueado —
errores evitables si estuvieran escritos en el repo.

**Decisión** · Formalizar, todo en el repo: (1) `docs/DOCS-INDEX.md` = source-of-truth por tema +
regla "una fuente por tema / solo se toca el doc que cambió". (2) En `AGENTS.md`: protocolo de
cierre, sección "Known Traps" (semilla con las de hoy) y el bridge Figma MCP recorded. (3)
`.impeccable.md` = alcance sagrado vs pulir. (4) Gobernanza de la fuente de verdad: "no se escribe
en Figma sin registro" + Figma change-log en `guia-tokens.md`.

**Razón** · El drift no nace de "no se actualiza" sino de "no hay jerarquía clara"; y repetir
errores no nace de no-apuntarlos sino de que vivían fuera del repo. Escrito y formal sobrevive a
sesiones, a fallos de memoria y a nuevos contributors.

**Descartadas** ·
- `LESSONS.md` como archivo nuevo → sería otro doc = el mismo problema de duplicación. Las trampas
  van en `AGENTS.md`, que ya se lee antes de trabajar.
- Dejar las lecciones solo en la memoria del agente → ni trazable, ni visible para el usuario/otros,
  ni sobrevive a un fallo de memoria.

**Consecuencias** · Convención de cierre activa (palabras-gatillo). Toda escritura en Figma queda
registrada. `DOCS-INDEX` es el juez anti-duplicación de aquí en adelante.

---

## DD-13 · 2026-06-09 — Tipografía: escala REDONDA desacoplada de `--sc-scale`, en rem root-16, naming de styles = tokens de código

**Contexto**: la tipografía estaba atada a la escala de espaciado 14-base
(`--sc-font-size-X = var(--sc-scale-Y)` → decimales: h1 31,5 · body 15,75 · sm
12,25). El Kit Pro Figma usaba esos mismos decimales. Al unificar los dos repos
de origen en este repo había que decidir UN modelo de tipografía.

**Dato que decide** (verificado en `sc-preset/rem-scale.ts` + `extend.ts`): el
preset renderiza en **rem sobre root 16** (a11y) y los tamaños reales de la capa
de aplicación son **redondos** — sm/md/lg = **12 / 14 / 16**, line-heights
18/21/24 — **no** los decimales 14-base. `rem-scale.ts` autora en "design-rem"
base-14 y compila a browser-rem ×0,875. → A root 16: **redondo = rem limpio**
(16=1rem, 24=1,5rem), **decimal = rem feo** (15,75=0,984rem). El código ya iba
redondo; los decimales del lado de diseño eran LA divergencia.

**Decisión**:
1. **Escala redonda** (12/14/16/18/20/24/32 + display 36/48/64 de registro),
   **desacoplada de `--sc-scale`** (la escala sigue para espaciado; la letra tiene
   su propio set redondo). En **rem sobre root 16** (converge + a11y).
2. **Line-heights** (cuerpo generoso ~1,5 → títulos apretando ~1,25, en px par):
   12/18 · 14/20 · 16/24 · 18/24 · 20/28 · 24/36 (h1 aireado, revisable) · 32/40 ·
   48/58 · 64/78.
3. **2 pesos** (Regular + Semibold), no 4.
4. **Cuerpo/control** = tier sm/md/lg (12/14/16) — lo que PrimeNG exige; converge
   1:1 entre diseño y código.
5. **Rampa de contenido semántica** (display-1, h1-h4, body-1/2/3, subtitle-1/2,
   caption, caption-bold) = **canónica del sistema**. La adoptan las apps
   consumidoras (no existía aún en el repo de aplicaciones → hueco a cubrir, no
   deuda del DS). Se limpian redundancias reales con el tiempo (subtitle-2 =
   subtitle-3) **sin estripar** el modelo.
6. **Naming**: text styles Figma renombrados 1:1 con los tokens de código (`h1`,
   `body-1`, `caption-bold`…) → quien inspecciona en Dev Mode ve el mismo nombre
   que `--sc-font-size-h1`. Las **VARIABLES** (lo que cruza al código vía Theme
   Designer) mantienen naming PrimeNG. El naming por-tamaño ("24 Semibold") se
   **DESCARTA**: crearía desajuste Figma↔código en el handoff.

**Razón**: redondo acerca el sistema a PrimeNG (menos divergencia que cuidar) + da
rem limpio + a11y; el naming espejo elimina la fricción en el handoff.
**Migration-safe**: solo se toca la capa propia (variables `app/*` + preset
modular `sc-preset/` + `--sc-font-size-*`), nunca el core de PrimeNG ni el Kit
compartido. Coherente con la doctrina del sistema ("la letra vive en `--sc-*` +
bridge; NO vincular a la escala de PrimeNG").

**Consecuencias**:
- **POC en el duplicado Figma** (histórico) HECHO: 12 text styles a redondo +
  line-heights por regla; variables App ancladas a redondo (sm-font 12 · lg-font
  16 · sm-line 18 · lg-line 24; md-font 14); text-style naming = tokens código
  (12/12, `subtitle-3`→`body-3`).
- **Validación en real** (resuelto en addendums posteriores): (a) variables de la
  rampa de TÍTULOS (los títulos eran text style sin variable); (b) repetir en el
  Kit OFICIAL (el que lee el Theme Designer); (c) reflejar en código
  `--sc-font-size-*` (redondo, rem) con diff visual + e2e — **ejecutado**, ver
  addendum final; (d) ajustar `npm run tokens:type-parity` al pasar a redondo —
  **hecho**.
- Display 36/48/64 → **registrados solo en specs** (uso ocasional; fuera de la
  rampa activa de Figma).

**Anexo — filosofía de cableado, "contradicción" letra/espaciado y pipeline:**

- **Cableado de la tipografía de componentes: VARIABLES, no text styles.** Hay dos
  modelos. El *design-tool-native* ata cada texto de componente a un **text style**
  de Figma. PrimeNG (y por tanto SC Prime) ata los textos a **variables** (tokens de
  componente, p.ej. `button.label.font.size`), porque el código aplica el tema vía
  tokens: usar variables mantiene Figma↔código sincronizados. Migrar al modelo de
  styles metería en Figma un concepto que el código no lee → drift. **Se sigue el
  modelo de variables.**
- **Hallazgo (auditoría del Kit, histórico)**: de **~4.420 textos de componente
  revisados (7 páginas), 0 usan text style**; ~58% atados a variable, **~42% con
  el tamaño a pelo** (hardcoded → no se actualizan al cambiar la variable). El Kit
  estaba **parcialmente cableado**; completar el cableado a variables es trabajo
  en el Kit oficial.
- **La "contradicción" letra-redonda / espaciado-decimal (no lo es):** la tipografía
  se desacopla a redondo, pero el **espaciado se queda en `--sc-scale`** (valores
  14-base). Son sistemas distintos: el espaciado es geometría estructural
  (consistente en toda la app, imperceptible); la letra es legibilidad (redondo +
  rem importan). Cada uno con su escala; el espaciado **no se toca**. (Nota actual:
  la escala `--sc-scale-*` se **emite en rem** — px de diseño /16 — por el
  generador único DTCG; el naming sigue la ley `v/14` y el px de diseño va en
  comentario. Ver DD-10.)
- **El icono "de texto" hereda el tier tipográfico, NO la escala** (validado contra
  el preset). Un icono embebido con la letra (botón, chip, input, menú, breadcrumb)
  se compara ópticamente con el texto en la misma línea → debe atarse al
  `font-size` del componente (idealmente `1em`), **no** a `--sc-icon-size-*` cuando
  este aliasee la escala decimal. Así rima por construcción (Δ0) a cualquier
  tamaño. Dato: el cruce letra-redonda ↔ icono-escala era ≤0,25px en controles
  (sm 12↔12,25 · md 14↔14 · lg 16↔15,75) — imperceptible — pero sube a 0,5–1px en
  display y, sin atar, permite un icono default 14 junto a texto 12 (Δ2px, **sí**
  se ve). El icono de **geometría/UI** (empty-state, avatar, ilustración) SÍ se
  queda en `--sc-icon-size-*`/escala. Mismo principio: dos sistemas (legibilidad
  vs geometría); el icono se asigna **por rol**, no por defecto a la escala.
  Bonus: `<sc-icon>` ya alimenta `opsz` con el size → atarlo al tier afina también
  el trazo del glifo al tamaño del texto. **Implicación Figma:** los main
  components que aten el icono a la escala habría que re-atarlos al tier
  tipográfico (depende del naming de variables — due-diligence abierta).
- **Pipeline a código:** Figma (variables `app/*` + estilos) → **Theme Designer** →
  PR al repo → `--sc-font-size-*`. Es lo que hace que tocar la variable una vez en
  Figma llegue al código sin copiar valores a mano.
- **Anclaje vs literal — la letra ancla a primitivos propios en la colección _Custom_**
  (criterio "a prueba de balas"). La escala redonda vive como primitivos
  (`font-size/12..32`, `line-height/18..40`) en la colección **Custom** (la de
  tokens de proyecto), **no** en la base `Primitive` (la que deriva de
  PrimeNG/Aura); ambas son colecciones del mismo file/Kit. Importa porque un
  re-export del Kit **regenera** la base (Primitive/Semantic/Component) pero
  **respeta** App y Custom (las propias). La colección **App** ancla a ellos
  (`app/lg/font/size → font-size/16`…). **Razón:** una sola fuente por valor
  (cambiar un tamaño = 1 edición; las futuras variables de títulos anclan al mismo
  set) → escala trazable y futuro-proof, vs literales que dispersan el valor y son
  deuda a futuro. **Safe:** PrimeNG es *reference-native* (`{...}`, ej.
  `{form.field.font.size}`), así que la cadena de alias es su idioma; todo en
  Custom, no toca el core. La fuente de verdad de diseño (Figma) mantiene la
  jerarquía correcta aunque el código resuelva valores.

**Validación contra PrimeNG — cómo modela la tipografía y qué instala el dev:**
investigación multi-fuente (doc oficial PrimeNG/PrimeUIX + código
`@primeuix/themes` + export del Kit + un tema generado por el Theme Designer) +
verificación empírica.

- **PrimeNG NO modela la tipografía como sistema.** No hay grupo `typography` en
  sus 3 tiers (primitive/semantic/component). Postura oficial literal: *"There is
  no design for fonts as UI components inherit their font settings from the
  application."* Y la doc "Scale": *"Use the root font-size to adjust the size of
  the components globally."* Hay **un único dial: el `font-size` del `<html>`**
  (su web usa 14px); el resto es `rem` colgando de ahí. Confirmado por grep cero
  de `typography` en `@primeuix/themes` y por el issue PrimeNG #3273. Excepción
  acotada: la capa semántica de INPUTS `form.field.sm/lg.font.size`. Fuera de
  inputs cada componente hardcodea `font-size: 1rem` y NO es token (issue
  PrimeUIX #192 pide tokenizarlos — abierto). → **No hay capa de tipografía de
  CONTENIDO** (heading/title/body): se hereda del root.
- **El tema se instala en `rem`, no en px.** Verificado en un tema generado por el
  Theme Designer (carpetas `ts`/`js`, un archivo por componente): TODOS los
  `fontSize` en rem (`formField.sm` `0.875rem`, `lg` `1.125rem`, `dialog.title`
  `1.25rem`, `avatar` `2rem`…); los px del tema son solo bordes/radios/sombras. El
  plugin **convierte los px de las variables Figma a rem dividiendo por 16**. Con
  escala REDONDA → **rem limpios** (12→0,75 · 14→0,875 · 16→1 · 18→1,125 ·
  20→1,25 · 24→1,5 · 32→2); con los decimales 14-base habrían salido feos
  (15,75→0,984rem). **Esto valida empíricamente el punto 1 de esta DD** (redondo
  + rem) con los propios ficheros del tema.
  - Nota operativa — el plugin tiene DOS salidas distintas: **"Generar tema"** = el
    preset de PrimeNG cocinado y listo para instalar (`ts`/`js`, letra ya en rem)
    — lo que se usa; **"Exportar"** = el JSON crudo de variables (hoy
    `projects/design-tokens/scripts/kit-export-dtcg.json`, formato DTCG; sustituye
    al antiguo export plano) — la lista de ingredientes, no el plato. Para decidir
    unidades manda el tema generado (rem).
  - **Qué se integra (verificado comparando archivos):** el preset modular
    `projects/ui-smartcontact/src/lib/theme/sc-preset/` (`base.ts` + un `.ts` por
    componente, ensamblados en `index.ts`) **ES un tema del Theme Designer**
    (mismo carácter que el tema generado), sobre el que se añade la capa custom
    (`extend.ts`, `rem-scale.ts`) y la capa de aliases `--sc-*` generada desde
    `projects/design-tokens/scripts/kit-export-dtcg.json`. Es decir: **tema
    generado y tokens SÍ se combinan** — es justo para lo que se paga el Theme
    Designer. El pipeline: Figma → Theme Designer → **preset base instalable**
    (`base` + componentes) + `extend` custom + aliases `--sc-*` estables (con
    unidad/rem) → componentes.
- **Naming — dos capas, dos reglas:** lo que el componente CONSUME (la capa
  semántica **App**: `app/font/size` → CSS `--app-font-size`) usa **jerarquía con
  barra**, espejo del dot-path de PrimeNG (`{form.field.font.size}`) — el guion
  solo aparece como kebab-case al emitir el CSS, nunca como separador semántico.
  El **primitivo de escala** (el almacén de tamaños, que NADIE referencia directo)
  va **PLANO**: `typography/font-size/12..48` + `typography/line-height/18..58`.
  Razón: PrimeNG NO tiene primitivo de tipografía — su `font.size` es un token
  *semántico terminal* (un valor), no una escala; no hay patrón PrimeNG que imitar
  para una LISTA de tamaños, y anidar `font/size/<valor>` solo mete un grupo vacío
  de más (error cometido y revertido: el componente consume `--app-font-size`, no
  el primitivo, así que su naming es interno). El primitivo plano (nombre = valor,
  convención estándar de escala) se lee mejor. La capa de aliases expone
  `--sc-font-size-*` / `--sc-line-height-*` (guion en CSS), alimentada por el
  export de valores.
- **Rampa de CONTENIDO (h1–h4, body-1/2/3, subtitle, caption): modelo SIMPLE, sin
  capa de variables propia.** Verificado contra la referencia de diseño inicial
  (text styles literales), el export del Kit y el código: **nadie** tiene una capa
  semántica de variables de tipografía de contenido (`heading/h1`, `body/body-1`)
  — solo el tier de control (sm/md/lg) + font-size por componente (`card.title`,
  `dialog.title`). Crear esa capa de variables en Figma sería sobre-ingeniería.
  Modelo correcto: **text styles** (h1, body…) con su `font-size` / `line-height`
  / `weight` atados **directamente a los primitivos**
  (`typography/font-size/24`…) — el text style ES la capa semántica visual
  (cambiar h1 de 24→28 = reapuntar el estilo, un sitio). Los `--sc-font-size-h1` /
  `body-1` del código viven en la **capa de aliases**, anclados a los primitivos
  que cruzan de Figma. **NO una tercera capa de variables semánticas.**
- **(Histórico, resuelto)** El código estaba en `px` (`--sc-scale-1: 14px`; los
  `--sc-font-size-*` colgaban de la escala px) → divergía del output nativo de
  PrimeNG (rem) y rompía el dial de escala global (un usuario que sube el tamaño
  base del navegador no veía crecer la letra; a11y degradada). La migración
  **px → rem** se ejecutó (ver addendum final) y hoy alcanza también a la escala
  de espaciado (decisión "rem centralizado", DD-10).

> **A partir de aquí es HISTORIA DE EJECUCIÓN, no decisión.** La decisión de DD-13 termina
> arriba; lo que sigue son los addendums del piloto —ya ejecutado— con sus valores medidos. Se
> conservan porque esos números son la fuente de la escala canónica, pero **si vienes a saber qué
> se decidió, ya puedes parar**. (Señalizado el 2026-08-13: DD-13 son 293 líneas, 17% del
> fichero, contra una mediana de 38 — el bulto está aquí abajo.)

**Addendum — Piloto del pipeline EJECUTADO + modelo corregido (verificado contra
doc oficial).**

El gate se ejecutó de verdad: export del duplicado por el Theme Designer → PR
(JSON crudo + tema cocinado). Hallazgos, todos verificados sobre los archivos:

1. **PrimeNG NO tiene design tokens de tipografía — es document-level.** Doc
   oficial ([theming/styled](https://primeng.org/theming/styled)): *"font family,
   font size, line-height do not have design tokens since they can be inherited
   from the document… not available in the generated theme and need to be applied
   to your application at the document level."* → **refuerza** el cuerpo de esta
   DD. La letra **no viaja por el preset**; se aplica a nivel documento.
   Excepción acotada ya conocida: `formField.sm/lg.font.size` (inputs) sí están
   en el preset, en rem.
2. **"App" es colección NATIVA de PrimeOne 4.0**, no custom. Las 5 oficiales:
   Primitive · Semantic · Component · **App** · Custom
   ([PrimeOne 4.0](https://www.primefaces.org/blog/primeone-4-0-is-here-native-figma-variables/)).
   "App" = ajustes a nivel-app; su tipografía es document-level → **por diseño NO
   se emite al preset**. (Corrige una hipótesis errónea previa — "App = cajón que
   el plugin no reconoce": falso, el plugin la lee al export crudo; simplemente la
   tipografía no se cocina al preset por ser document-level.)
3. **La conversión px→rem del Theme Designer es context-aware.** Convierte ÷16
   solo para tokens que reconoce como tamaño (estándar/semántico). En **Custom
   pierde el contexto y a todo número le pega `px`** — mismo bicho que el bug
   `bulkTranscriptionModal/title/font/weight: 600 → "600px"`. Por eso los
   `typography/font/size/12` (número en Custom) salieron `"12px"`, no rem.
   **Regla:** lo que necesite trato de rem por el plugin no puede vivir solo como
   número en Custom; lo que es etiqueta (peso, variante, familia) va como
   **texto** para que el plugin lo respete tal cual.
4. **Evidencia del export** (verificada en los ficheros): `Custom` cruza a
   `extend` (typography 12-48 + line 18-58 en **px**, + `bulkTranscriptionModal`
   con refs `{...}`). `App` (6 vars) **no aparece** en el tema cocinado — ni font
   ni `card/background` — consistente con #1/#2. Las refs `{...}` **sobreviven**
   en el JSON crudo. `formField` sm/lg en el preset, en rem.
5. **Consecuencia — dónde vive de verdad la tipografía:**
   - Los primitivos `typography/*` en Custom = **fuente de diseño en Figma**
     (anclan App + text styles). En el preset salen huérfanos en px → inofensivo,
     pero **ese no es el canal**.
   - **NO esperar que el Theme Designer lleve la letra a los componentes.** La
     tipografía se aplica a **nivel documento** = la capa `--sc-font-size-*`
     (rem), espejo de `sc-preset/rem-scale.ts`.
   - **El rem lo pone el sistema** a nivel documento (÷16; redondo → rem limpio).
     Que el plugin deje Custom en px **es irrelevante** para la letra.
   - **NO re-apuntar la colección App → primitivos Custom esperando rem** (eso
     rompió el rem en el duplicado: en el original App apunta a `scale/*` nativo).
     Si se toca App, asumir que su tipografía es document-level de todos modos.
6. *(El "Meta (proceso)" que había aquí se movió a `LEARNINGS.md` **#10** el 2026-08-13: era
   una regla de proceso, no una decisión, y duplicaba la que ya vivía allí.)*

**Addendum final — Naming STEP cerrado + escala canónica + código ejecutado (todo
verificado contra los Figma reales).**

Cerrado con dato leído en vivo de los dos Kits (duplicado + oficial) y del código:

1. **Naming = STEP en Figma + código (idioma único).** El puente Theme Designer
   es **naming-neutral** (en el export del piloto echó los nombres del Figma
   verbatim) y PrimeNG no tiene escala de tipografía propia → la elección es del
   sistema. El código YA es step; el Kit oficial estaba **vacío de tipografía**
   (greenfield) → step = coste cero, 0 renames. El código usa
   `--sc-font-size-{step}` de forma idéntica en diseño y aplicaciones.
2. **Escala canónica = espejo del duplicado** (probado, no se re-inventa): 8
   tamaños `12·14·16·18·20·24·32·48` + 7 line-heights `18·20·24·28·36·40·58` + los
   10 text styles (display-1 48/58, h1 32/40, h2 24/36, h3 20/28, h4 18/24,
   body-1 16/24, body-2/3 14/20, caption(-bold) 12/18; pesos Regular + Semi
   Bold). Las LH salen del Figma propio (es la fuente que manda). Los steps del
   código fuera del set se **snapean** (10→12, 28→24, 36→32, 64→48).
3. **NO se cortan los roles en esta fase.** El audit confirmó que la capa de roles
   casi no se usa (592 usos por step vs 21 por rol; el preset la ignora), pero esa
   fase era **validar el pipeline, no re-arquitectura** → corte = limpieza
   posterior (backlog).
4. **Dos streams, por diseño:** la letra NO baja por el Theme Designer
   (document-level, addendum anterior) sino por la capa `--sc-*` en rem; el preset
   PrimeNG (color/spacing/dims) es el otro tubo. "Pipeline perfecto" = cada stream
   sin pérdidas + `tokens:type-parity` vigilando Figma↔código, no un solo tubo.
5. **icon-size en el stream de tipo:** redondeado con font/LH (desacoplado de
   `--sc-scale`) para que un icono junto a texto-16 mida 16, no 15.75. Sin
   contrapartida Figma → divergencia en customs-catalog.

**Código EJECUTADO** (histórico): `--sc-font-size-*`, `--sc-line-height-*`,
`--sc-icon-size-*` en
`projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css` →
**redondo en rem**, desacoplados de `--sc-scale`; nombres step + roles intactos.
Ajustados `npm run tokens:type-parity` y el export de tokens (resuelven la forma
rem). Validado: e2e en verde (funcionales + visuales; baselines dark
actualizadas tras cruzar el umbral del 2%), `type-parity` 99%, `tokens:guard`
exit 0. Render = filas un pelín más compactas + micro-labels 10.5→12, sin
roturas.

**Kit oficial:** primitivos `typography/font/size|line/height/{step}`
**step-named** + 10 text styles bindeados, espejo del duplicado
(**editar-no-borrar**). Es la fuente de diseño en Figma; la letra al producto
sigue siendo la capa `--sc-*` (stream 2).

**Relación con DD-11 (no se contradicen):** DD-11 es el **mecanismo** — los
`font-size` viven en `--sc-*`, blindados por guard + comprobador; sigue vigente.
DD-13 es la **escala** que circula por ese mecanismo: cambia el *target* de
"snap a base-14" (decimales) a **redondo + rem**, y **decide** las deudas que
DD-11 dejó abiertas (line-heights "por regla", tiers display 36/48/64 de
registro). El guard "Dura 4" y `tokens:type-parity` no cambian; solo se reajustó
el comprobador de snap al pasar a redondo. **Esta DD es el hogar canónico de la
ESCALA tipográfica; DD-11, el del blindaje.**

---

## DD-12 · 2026-06-04 — Naming de convergencia: el catálogo unión sigue DD-8 (Kit Pro 1:1, pegado)

**Contexto** (histórico, fase de convergencia): existían dos repos gemelos del DS
que **divergían en el naming** de wrappers: uno hyphenaba los multi-palabra
(`sc-input-text`, `sc-toggle-switch`, `sc-radio-button`, `sc-progress-bar`,
`sc-progress-spinner`) y el otro seguía DD-8 (pegado 1:1 Kit Pro/PrimeNG:
`sc-inputtext`, `sc-toggleswitch`). Al montar el proyecto convergido (este repo,
unión de ambos catálogos) había que cerrar UN naming para que todo el equipo
"hable igual".

**Dato que decide** (verificado): PrimeNG 21 acepta los DOS selectores
(`p-toggleswitch` **y** `p-toggle-switch` son ambos oficiales; idem multiselect/
inputnumber/inputgroup/radiobutton/progressbar) → la fidelidad a PrimeNG **no
desempata**.

> **Nota de 2026-08-25, al subir a PrimeNG 22 — la decisión aguanta, y por poco.**
> PrimeNG 22 sigue aceptando las dos formas de ESTA decisión (`p-toggleswitch` y
> `p-toggle-switch`), así que el naming pegado que se eligió aquí no se ha roto. Lo
> que sí desapareció es una TERCERA forma que este DD no contemplaba: el **camelCase**
> (`p-multiSelect`, `p-tableCheckbox`, `p-sortIcon`). En v22 esos selectores ya no
> existen y el build se cae con `NG8001`. En el repo solo quedaba uno
> (`<p-multiSelect>` en cuscare) precisamente porque este DD había empujado todo lo
> demás al pegado — o sea que la decisión pagó su coste el día del salto. Pero los componentes del **Kit Pro/Figma se nombran pegado en
minúsculas** (`❖ inputtext`, `❖ toggleswitch`, `❖ multiselect`). Como los
componentes se construyen **leyendo el Figma**, el pegado hace Figma→código 1:1
sin traducción; el kebab mete una traducción permanente.

**Opciones consideradas**: (a) kebab uniforme en todo (máxima uniformidad de
string) — pero rompe el espejo con el Figma y obliga a traducir en cada handoff
de diseño. (b) **mantener DD-8** (pegado para lo del Kit Pro; kebab para custom)
en el proyecto convergido.

**Decisión**: **(b)** — el repo unificado adopta **DD-8 sin cambios**:
`sc-` + nombre Kit Pro/Figma literal (pegado) para todo lo que existe en el Kit
Pro; **custom (sin equivalente Kit Pro) → kebab** descriptivo (`sc-section-card`,
`sc-empty-state`, `sc-bulk-transcription-modal`). Es la **misma meta-regla que
los tokens** (espejar el Kit Pro; lo propio, custom). Los 5 selectores
divergentes se realinean en la convergencia:
`input-text→inputtext`, `toggle-switch→toggleswitch`, `radio-button→radiobutton`,
`progress-bar→progressbar`, `progress-spinner→progressspinner`.

**Razón**: el Figma/Kit Pro es la fuente común que todo el equipo lee; espejarla
elimina la traducción diseño→código para siempre. Migration-safe porque el
wrapper encapsula PrimeNG (un rename interno de selector/`--p-*` es 1 línea
dentro del wrapper, invisible a la API pública `sc-`). Una sola regla a nivel de
**sistema** (la misma de tokens), aunque a nivel de string convivan pegado +
kebab — la mezcla es señal de procedencia (¿está en el Kit Pro?), no ruido.

**Consecuencias**:
- El catálogo que ya seguía DD-8 no renombra nada; los 5 divergentes se
  realinean al converger.
- El naming es entrada base del plan de convergencia (histórico).

---

## DD-11 · 2026-06-02 — Tipografía migration-safe: los `font-size` viven en `--sc-*`, blindados por guard + comprobador

**Contexto**: la tipografía era el último frente sin blindar. La app consumidora
tenía 367 `font-size` literales repartidos en SCSS de componentes y features
(cobertura tokenizada 48%). Cada literal es un punto donde un update de PrimeNG
o un re-export del Kit puede introducir drift sin que nadie lo cace. Faltaba
cerrar el cinturón que color (DD-3) y spacing/escala (DD-10) ya tenían.

**Opciones consideradas**:
- A. **Dejar los literales + que `tokens:parity` solo avise**. Reactivo: el drift
  se detecta tarde (en el commit que lo cruza por casualidad) y los literales
  nuevos siguen entrando.
- B. **Tokenizar masivo + guard proactivo + comprobador read-only dedicado**.
  Cierra la puerta por construcción: ningún `font-size` literal nuevo entra, y
  los slots de tipo se cruzan contra el export.

**Decisión**: **B**.
- **Tokenización (olas 1+2)**: 367 `font-size` literales → `--sc-font-size-*`,
  snapeados a la escala base-14 (misma ley `v/14` de DD-10; el target pasó
  después a redondo+rem, DD-13). Cobertura 48% → 99% → 100% del accionable. El
  hero de 88px → token `--sc-font-size-900`.
- **Guard "Dura 4"** en `scripts/token-guard.mjs` (`npm run tokens:guard`):
  bloquea cualquier `font-size` literal nuevo en CI/pre-commit, **0 excepciones**.
- **`npm run tokens:type-parity`**: comprobador SOLO-LECTURA (hermano de
  `tokens:parity`, NO crea tokens) que cruza los slots de tipo contra el export
  del Kit (`kit-export-dtcg.json`).
- Los tipos viven en **nuestros** tokens `--sc-font-size-*` (capa primitive) +
  el bridge del preset modular `sc-preset/` → `--p-*` — **nunca dentro de
  PrimeNG**.
- Las **`line-height`** NO se tocaron en esta fase (diferidas, riesgo de layout).
  **(Decididas después en DD-13: "por regla", e implementadas con la escala
  redonda.)**

> **Superado en parte por DD-13:** el *mecanismo* de esta DD (tokens en `--sc-*`,
> guard, `tokens:type-parity`) sigue intacto. Lo que cambia es la **escala** que
> viaja por él: de "snap a base-14" (decimales) a **redonda + rem root-16**. La
> escala tiene su hogar canónico en **DD-13**; esta DD se queda con el
> **blindaje**.

**Razón**: misma arquitectura unidireccional que color (DD-3) y escala (DD-10).
Como los tipos viven en `--sc-*` y el preset reenvía a `--p-*`, **un update de
PrimeNG no los borra** — el bridge sigue apuntando a los valores propios. El
único riesgo residual es que PrimeNG renombre un slot `--p-*-font-size`, y eso lo
caza `tokens:type-parity` (queda detectable, no silencioso). Por eso **NO se
vincula `--sc-font-*` a la escala tipográfica de PrimeNG**: invertiría la
arquitectura (haría que la identidad propia dependa de la suya).

**Consecuencias**:
- El cinturón migration-safe queda cerrado: badge/button/form-field ya estaban
  cubiertos; ahora todo `font-size` accionable es token.
- `migration-safety.md` (racional de blindaje) **apunta a esta DD**, no la
  duplica.
- Deuda diferida en su momento (line-heights, tamaños display, contraste índice
  dark) — line-heights y display resueltos por DD-13.

---

## DD-10 · 2026-05-27 — Escala formalizada (ley `v/14`) + comprobador/generador de tokens, NO un generador que escriba las capas

**Contexto**: diseño pidió "el arreglo definitivo anti-drift" para los tokens del
Kit Pro. La opción intuitiva era un **generador** que escribiera las capas
`--sc-*` desde el export. Pero la arquitectura (DD-1/DD-2) dice lo contrario:
las capas de tokens son la fuente de verdad de la app; el export es contra lo
que **comprobamos**.

**Opciones consideradas**: (a) generador que reescribe `01-primitive.css` desde
el export → invierte la arquitectura + riesgo de machacar lo curado (comentarios,
negativos, los pasos custom). (b) comprobador robusto + formalizar la ley + un
generador SOLO-LECTURA que deriva el canónico y verifica.

**Decisión**: (b).
- La **escala** es una rampa única base-14: `--sc-scale-{m}` = `m × 14` (px de
  diseño). El nombre se deriva del VALOR (`v/14`), nunca del string de la clave
  del export (es lossy: `scale125`=175=×12.5 vs `scale1125`=15.75=×1.125).
  Radius = escala fija aparte (NO 14-base).
- **Actualización (decisión "rem centralizado")**: la escala `--sc-scale-*` se
  **emite en REM** (px de diseño /16) por el **generador único DTCG**
  (`npm run tokens:gen` sobre `kit-export-dtcg.json`) — un solo punto de
  conversión px→rem en todo el sistema. El naming sigue la ley `v/14`
  (5.25px de diseño → `--sc-scale-0-375`); el px de diseño va en comentario
  junto al valor.
- **Consumo**: los componentes consumen el alias semántico **`--sc-spacing-*`**
  (mismo sufijo `v/14`, p. ej. `--sc-spacing-0-75`), nunca la primitiva
  `--sc-scale-*` directa. La nomenclatura 8-point (`--sc-space-*`,
  `--sc-spacing-100`…) está **prohibida por el guard** (`tokens:guard`).
- `npm run tokens:parity` ampliado: sizing **valor↔valor** (37 checks:
  button/formField/tabs/tooltip/overlays) en vez de regex con literal hardcodeado
  (que dejaba pasar drift), + sección informativa de tokens code-only con vecino
  más cercano (regla: snap a token existente, no literal divergente), +
  **sección de COLOR de marca**: resuelve `--sc-*` a hex por la cadena `var()` y
  cruza la rampa primary (color/hover/active/contrast, light+dark) +
  surface↔gray + content contra el export. Cierra el punto ciego que dejó pasar
  el drift de `primary-hover` (lo cazó el ojo, no la herramienta) — divergencias
  de marca conscientes (info/warn/focus/dark-navy) van allow-listadas, no fallan.
- `npm run tokens:gen`: deriva el set canónico `--sc-scale-*` **y `--sc-radius-*`**
  del export y verifica la ley de NOMBRES (que paridad no valida); imprime los
  bloques. **NO reescribe** el CSS (eso es `npm run tokens:import`).
- Todo corre en `npm run verify` (CI) y pre-commit.

**Razón**: el drift se vuelve imposible por construcción vía el CHECK (no vía un
generador libre que pelea con la arquitectura y arriesga lo curado). Datos >
supuestos.

**Consecuencias**: re-exportar el Kit y sobrescribir `kit-export-dtcg.json` →
`tokens:parity` + `tokens:gen` cazan cualquier desalineación (valor o nombre)
antes del commit. Flag abierto: `17.5`/`35` figuran como Kit pero el export puede
no traerlos → reconciliar al próximo re-export (`customs-catalog §4`).

**Addendum — pipeline import completo (`tokens:import` = `tokens:gen --write`)**:
el writer SCOPED cubre **escala + radios** (zonas marcadas `@sc-gen:scale … :end`
y `@sc-gen:radius … :end` en
`projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css`; mirror
mecánico del export). Sigue sin ser el writer-libre descartado (que pisaba toda
la capa); todo lo demás (colores, navy, aliases, extras documentados) queda
intacto.

**La cascada llega a los componentes sin px a mano.** Antes el preset fijaba las
métricas de componente con literales (`paddingX: '10.5px'`) — solo *comprobadas*
por parity, no *generadas*. Trust gap detectado por diseño: "¿el puente solo
cubre la escala?". Fix: cada métrica del preset modular es una **referencia a
token generado** — `var(--sc-scale-0-75)`, `var(--sc-font-size-300)`,
`var(--sc-radius-200)` — porque todas caen exactas en la escala `v/14` / radios /
font-size del export. **El preset modular apunta cada slot a `var(--sc-*)`;
`base.ts` no contiene ningún hex.** No hace falta un generador de "métricas de
componente" aparte: el preset apunta a los primitivos generados y la cascada
propaga. (Fiel a Figma, donde el componente también está vinculado a la
variable, no a un número.) Si un re-export reasigna un paso, parity
(valor↔valor) lo caza loud.

Flujo completo: diseño cambia métrica/color en Figma → `kit-export-dtcg.json` →
`tokens:import` reescribe escala+radios → cascada (`--sc-spacing-*` aliases +
componentes + **preset por referencia**) propaga sola. Color de marca = decisión
a mano (no auto-import) pero **vigilada por parity**. Verificado idempotente. El
CHECK (`tokens:gen` + `tokens:parity`, en `verify`) es la garantía; el writer es
la comodidad. `npm run audit:theme-scale` vigila además que el preset no se
salga de la escala.

---

## DD-9 · 2026-05-25 — Icon set del DS = Material Symbols vía `<sc-icon>` (migración desde Lucide)

**Contexto**: la app consumidora usaba `lucide-angular` (`<lucide-icon [img]>`)
como icon set en ~140 ficheros. Decisión de diseño: migrar a **Material
Symbols** (Google). El no-goal "sin Material" de la documentación se refiere a
Angular Material (componentes), NO a la font de iconos Material Symbols —
aclarado y confirmado.

**Decisión**: wrapper **`<sc-icon name [size] [fill] [weight]>`** (paquete
`@smartcontact-hub/icons`, fuente en `projects/ui-smartcontact-icons/`) que renderiza
un glifo Material Symbols Outlined por ligadura. Es la **única API de icono** del
DS. La variable font se carga en el `index.html` de cada app consumidora (Google
Fonts CSS link). Los campos de icono pasan de ref Lucide a **string** (nombre
Material); los contratos `[icon]` de los componentes del DS (`empty-state`,
`dialog`, `section-card`, `page-header`, `form-section-nav`) cambian de tipo
Lucide → `string`.

**Opciones consideradas**: (a) Material Symbols variable font + wrapper
[elegida] — cero deps npm, modulable (opsz/wght/FILL/GRAD), 1 API; (b) set SVG
vía `@ng-icons/material` — dep nueva, rechazada; (c) seguir en Lucide —
descartado por decisión de producto.

**Excepciones que SIGUIERON en Lucide durante la migración** (histórico; la
migración se cerró después y `lucide-angular` salió del repo):
- **Iconos de marca** (GitHub) — Material Symbols no tiene glifos de marca; hoy
  se resuelven con SVG inline `fill="currentColor"`.
- **Spinner animado** — resuelto después con `<sc-icon name="progress_activity"
  [spin]="true">` (ver customs-catalog §2.6).

**Consecuencias**:
- **Gotcha NG0919** (circular runtime, el build NO lo caza): un componente del DS
  que importe `IconComponent` desde el barrel del paquete se importa a sí mismo →
  circular. **Regla**: dentro de las librerías del DS, importar IconComponent por
  **ruta relativa** (`../icon/icon.component`), nunca por el barrel.
- **Pendientes en su momento** (mayormente cerrados): entry de `<sc-icon>` en
  customs-catalog (hecha, §2.6); self-host de la font para producción — **CERRADO por DD-31**
  (verificado 2026-08-13; el DS sirve Material Symbols Outlined self-hospedado).

---

## DD-8 · 2026-05-20 — Naming de wrappers alineado 1:1 con Kit Pro Figma + PrimeNG

**Contexto**: 7 wrappers tenían naming kebab-multi-word divergente con sus
equivalentes en Kit Pro Figma SC y en PrimeNG. Por ejemplo `<sc-input>` cuando
Figma tiene `❖ InputText` y PrimeNG tiene `<p-inputtext>`. Lo mismo con
`multi-select`/`MultiSelect`, `input-number`/`InputNumber`,
`toggle-switch`/`ToggleSwitch`, `modal`/`Dialog`, `tri-state-checkbox`/`Checkbox`,
`input-group`/`InputGroup`.

La inconsistencia complicaba (a) audits Figma manuales (matching por concepto en
vez de nombre literal), (b) Code Connect mapping futuro (necesita alias mapping
en vez de match directo), (c) onboarding de desarrolladores nuevos.

**Opciones consideradas**:
- A. **Mantener el naming kebab-multi-word** (convención Polaris/Carbon). Pro:
  nada cambia. Contra: divergencia persistente, Code Connect requiere mapping
  manual, audits siempre por concepto.
- B. **Rename completo 7 wrappers** matching Kit Pro literal. Pro: 1:1 con Figma,
  Code Connect directo, audits literales. Contra: rename masivo (60+ archivos por
  componente), riesgo temporal de regresión.

**Decisión**: **B** — rename completo. Aplicado a los 7 wrappers con equivalente
PrimeNG/Figma:
- `<sc-input>` → `<sc-inputtext>` (PrimeNG `<p-inputtext>`, Figma `❖ InputText`)
- `<sc-input-number>` → `<sc-inputnumber>` (`<p-inputnumber>`, `❖ InputNumber`)
- `<sc-input-group>` → `<sc-inputgroup>` (`<p-inputgroup>`, `❖ InputGroup`)
- `<sc-multi-select>` → `<sc-multiselect>` (`<p-multiselect>`, `❖ MultiSelect`)
- `<sc-toggle-switch>` → `<sc-toggleswitch>` (`<p-toggleswitch>`, `❖ ToggleSwitch`)
- `<sc-modal>` → `<sc-dialog>` (`<p-dialog>`, `❖ Dialog`) — además class
  `ModalComponent` → `DialogComponent` y tokens `--sc-modal-*` → `--sc-dialog-*`
- `<sc-tri-state-checkbox>` → `<sc-checkbox>` (`<p-checkbox>`, `❖ Checkbox`) —
  además class `TriStateCheckboxComponent` → `CheckboxComponent`. El behavior
  tri-state queda en la API (`TriState` type + `cycle` output), no en el nombre.

**Razón**: alineación literal beneficia el mantenimiento long-term (audits, Code
Connect, onboarding). El coste mecánico es one-shot y se ejecuta con tsc verde
como guarda.

**Consecuencias**:
- **Componentes pure-sc SIN equivalente Figma se mantienen** con su naming
  descriptivo del dominio: `<sc-search>`, `<sc-bulk-action-bar>`,
  `<sc-empty-state>`, `<sc-form-danger-zone>`, `<sc-form-section-nav>`,
  `<sc-color-dot-picker>`,
  `<sc-inline-rename-cell>`, `<sc-group-popover>`, `<sc-column-selector>`,
  `<sc-command-palette>`, `<sc-keyboard-shortcuts>`,
  `<sc-delete-entity-dialog>`, `<sc-impact-preview-dialog>`, `<sc-page-header>`,
  `<sc-sticky-form-header>`, `<sc-section-card>`, `<sc-photo-upload>`,
  `<sc-bulk-edit-menu>`.

  > **Tres de esta lista ya NO existen** (corregido 2026-08-13; el DD los daba por vivos).
  > `sc-confirm-host` se borró; y **`sc-label-chip` y `sc-illustrated-avatar` se RETIRARON a
  > propósito**, con este racional — que vivía solo en el manifiesto de convergencia y se
  > rescata aquí antes de borrarlo:
  > - **`sc-label-chip` → variante de `sc-tag`/`sc-chip`, no componente.** `sc-tag` es el
  >   canónico para etiquetas de **solo lectura**; `sc-chip` para las **quitables** (botón ×).
  >   Su sistema de **8 colores categóricos + puntito** entra como *variante de estilo*; los
  >   tokens `--sc-label-*` y el `LABEL_COLORS` que comparte con `sc-color-dot-picker` se
  >   conservan como paleta de esa variante.
  > - **`sc-illustrated-avatar` → fallback de `sc-avatar`, no componente.** Su comportamiento
  >   —si no hay foto, ilustración SVG por hash del nombre (pools `illustrated`/`abstract`)—
  >   alimenta el tipo *Image* de `sc-avatar`. La foto subida sigue ganando sobre la
  >   ilustración, y `sc-photo-upload` se reconecta a ese fallback.
  >
  > El supervisor **aún conserva copias locales** de ambos: esa es la deuda que sigue abierta
  > en `docs/inventory.md`, no un contra-ejemplo de esta decisión.
- **CSS classes intra-componente también renombradas** para coherencia 1:1
  selector ↔ classes (`.sc-input__label` → `.sc-inputtext__label`).
- **Class names mantenidas cuando ya eran correctas** (`InputNumberComponent`,
  `InputGroupComponent`, `MultiSelectComponent`, `ToggleSwitchComponent`).
  Renombradas las divergentes (`Input→InputText`, `Modal→Dialog`,
  `TriStateCheckbox→Checkbox`).
- **Type aliases TS sin cambio** (`ScInputSize`, `ScInputType`, etc.) — son
  etiquetas, no afectan la API del consumer.

**Regla portable**: cualquier wrapper nuevo que tenga equivalente PrimeNG nace
con naming `sc-XYZ` matching `<p-XYZ>` literal. NO `sc-x-y-z`.

---

## DD-7 · 2026-05-20 — Política tokens: toda primitive nueva entra en customs-catalog

**Contexto** (histórico): se añadió `--sc-font-family-mono` a `01-primitive.css`
sin entry en `customs-catalog.md` ni aviso a diseño. Esto puede crear drift entre
código y Figma SC: si diseño no sabe que el token existe, no puede referenciarlo
al construir specs.

**Decisión**: **toda primitive nueva añadida al DS requiere entry en
`customs-catalog.md`** con: razón concreta, valor, consumers actuales, plan para
la collection de Variables de Figma SC, decisión pendiente de diseño si aplica.

**Razón**: el customs-catalog es la fuente única que diseño consulta al
actualizar el Kit Pro de Figma. Si un token vive solo en código, se desalinea
silenciosamente. Es el estándar de calidad del sistema: **cada token trazable al
export del Kit (`kit-export-dtcg.json`), verificado en CI** (`npm run verify`).

**Consecuencia**: el checklist anti-divergencia (`customs-catalog §0`) aplica
también a primitives nuevas, no solo a overrides de Aura.

---

## DD-6 · 2026-05-15 — `"sideEffects": false` en los paquetes del DS

**Contexto**: bundle inicial de la app consumidora 1.61 MB. `source-map-explorer`
reveló que el bundler estaba importando módulos enteros del DS por imports
transitivos.

**Decisión**: `"sideEffects": false` en el `package.json` de los paquetes del DS
(`@smartcontact-hub/components`, `@smartcontact-hub/icons`; `@smartcontact-hub/styles` es
CSS y se declara explícitamente).

**Razón**: tree-shaking efectivo. Resultado inmediato en su momento: bundle
1.61 MB → 1.41 MB (-200 KB, bajo el budget de 1.5 MB del momento).

**Consecuencia**: cualquier futuro componente con CSS side-effect debe declararse
explícitamente en el array `sideEffects` del `package.json` para no romper esto.

---

## DD-5 · 2026-05-15 — Política minimal customization sobre PrimeNG

**Contexto**: tendencia a crear componentes pure-sc cuando PrimeNG ya tenía el
patrón. Riesgo: el coste de mantenimiento se dispara cuando PrimeNG actualiza
minor versions.

**Decisión**: **customizar lo MÍNIMO** sobre PrimeNG. Antes de cocinar un
pure-sc nuevo, 3 preguntas obligatorias:
1. ¿PrimeNG ya lo tiene? → wrapper.
2. ¿`pTemplate` cubre el render? → usar slot.
3. ¿PrimeNG NO lo tiene? → pure-sc + entry en catalog.

**Razón**: un dry-run de upgrade de PrimeOne se vuelve trivial si el DS es
mayoritariamente wrappers. Cocinar un pure-sc duplicado de algo que ya existe es
deuda permanente.

**Consecuencia**: refactors de consistencia (`sc-toggleswitch`,
`sc-bulk-edit-menu`) y declines justificados (`inline-rename-cell`,
`label-chip`).

---

## DD-4 · 2026-05-15 — Regla 2+ consumers antes de promover al DS

**Contexto**: tentación de promover patrones al DS "por si los necesitamos en el
futuro". Resultado: catálogo inflado con componentes sin uso real.

**Decisión**: un componente entra al DS cuando:
- (a) se usa en ≥2 lugares de las apps consumidoras, **O**
- (b) es parte explícita del DS por decisión de diseño.

**Razón**: minimizar surface area. Patrón usado solo 1 vez = vive donde se usa.

**Consecuencia**: gaps documentados en `customs-catalog §5` (`sc-select-button`,
`sc-toggle-button`) esperan trigger real, no se cocinan. *(`sc-tag` salía en esta lista y ya
NO es un gap: existe en `components/tag/` y lo exporta el public-api — verificado 2026-08-13.)*

---

## DD-3 · 2026-05-14 — Brand divergence: navy primary + electric-blue info + amber warn

**Contexto**: la base Aura usa azul saturado para primary, sky-blue para info,
orange para warn. Smart Contact tiene identidad propia: navy oscuro para
primary, electric-blue saturado para info, amber para warn (no orange).

**Decisión**: overrides en el preset modular `sc-preset/` mapean `--p-*` a
`--sc-color-*` SC. Entries 1.1, 1.2, 1.3 del customs-catalog.

**Razón**: identidad de marca Smart Contact. Verificado contra Figma Kit Pro 1:1.

**Consecuencia**: re-sync con PrimeOne upstream nunca toca estos overrides
automáticamente. Si Aura cambia su default, SC sigue navy.

> **Sustituida en parte por DD-41 y DD-87** (2026-09-14): el aviso es amarillo, no ámbar; lo vigente
> sobre marca y divergencias con Aura está en DD-87.

---

## DD-2 · 2026-05-14 — El preset `sc-preset` como source of truth `--p-*` ↔ `--sc-*`

**Contexto**: PrimeNG 21 expone tokens `--p-*`. El DS expone `--sc-*`.
Necesitábamos un punto único donde mapear los dos sistemas para que cambiar
identidad SC no requiera tocar PrimeNG.

**Decisión**: el preset es el bridge canónico. Hoy vive en
`projects/ui-smartcontact/src/lib/theme/sc-preset/` en forma **modular**
(`base.ts` + ~82 módulos por componente + `extend.ts` + `css.ts` +
`rem-scale.ts`, ensamblados en `index.ts`) — el antiguo fichero monolítico
`sc-preset.ts` ya no existe. Los componentes consumen `--sc-*`; el preset
reenvía a `--p-*` automáticamente. El selector de dark mode por defecto es
**`.sc-dark`**, configurado por `provideSmartContactUi`.

**Razón**: arquitectura unidireccional. Componentes nunca consumen `--p-*`
directamente. Cambiar identidad → cambiar `--sc-*` → bridge propaga.

**Consecuencia**: el directorio `sc-preset/` es **load-bearing** — no se puede
mover, renombrar ni simplificar sin auditar. `base.ts` no contiene ningún hex:
cada slot apunta a `var(--sc-*)`. Documentado en `migration-safety.md`.

---

## DD-1 · 2026-05-13 — Tokens en capas CSS

**Contexto**: tokens dispersos en múltiples archivos sin jerarquía. Difícil
saber qué cambiar al modificar identidad.

**Decisión**: tokens organizados en capas CSS
(`projects/design-tokens/src/lib/styles/tokens/layers/`):
1. `01-primitive.css` — raw values (color scales, font, spacing, radius).
2. `02-semantic.css` — aliases semánticos (`--sc-text-primary`, `--sc-bg-default`).
3. `03-palette.css` — color palette por categoría (labels).
4. `04-component.css` — tokens por componente (`--sc-dialog-radius`).
5. `05-extensions.css` — z-index scale, motion, shadows, layout dims.
6. `06-primeng-bridge.css` — (histórico: marcado dead code en la auditoría
   inicial y retirado en este repo; el bridge vive en el preset `sc-preset/`).
7. `07-dark.css` — overrides dark mode (activados por el selector `.sc-dark`).

**Razón**: cascada estable y auditable. Cada capa tiene una responsabilidad
clara.

**Consecuencia**: los componentes consumen tokens de capa 2-4 (semánticos /
componente), nunca de capa 1 directamente (excepto raros casos donde primitive
ES el semantic). Para espaciado, el alias de consumo es `--sc-spacing-*`
(`02-semantic.css`); la primitiva `--sc-scale-*` queda reservada a la capa de
tokens y al preset (vigilado por `tokens:guard`).
