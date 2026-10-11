# Auditoría UX: fichas de alta/edición — Agentes vs Grupos (2026-10-11)

> **Método:** comparación sección por sección de `features/admin/groups/pages/group-form-page.*`
> (alta y edición, ~1425 líneas) contra `features/admin/agents/pages/agent-form-page.*` (~1350
> líneas), con **Grupos como techo** — ya validado por el equipo en varias rondas (DD-121, DD-135,
> DD-143, DD-182, DD-184, DD-185) — y Agentes evaluado contra ese nivel (su propia alineación,
> DD-187 del 2026-10-09, se tomó como ancla de "qué se decidió a propósito" frente a "qué quedó
> pendiente"). Alcance: solo crear/editar (no listados, filtros, bulk actions ni
> permisos/roles sueltos). Nueve ejes fijos por sección (nomenclatura, agrupación/densidad
> 7·14·28, orden, validación/gates, copy y vacíos, estados de carga, iconografía, consistencia de
> componentes reutilizados, accesibilidad) aplicados a General↔General, Distribución y
> colas↔Configuración, Recursos↔Recursos y tabla de asignación↔tabla de asignación. Cada
> discrepancia se clasificó en (a) divergencia documentada a propósito en un DD, (b) justificada
> por la naturaleza del dato, o (c) inconsistencia evitable = deuda real; solo (c) cuenta como
> hallazgo. Las mejoras de Agentes que superan a Grupos se registran aparte y no compensan ningún
> hallazgo (c). Todas las citas de abajo son archivo:línea releídas en el código real.

**Veredicto general:** la alineación del 2026-10-09 (DD-187) funcionó — la mayoría de los 9 ejes
es igual o está justificada en las cuatro secciones. La deuda real que queda es puntual, no
estructural, y dos puntos van **al revés** de lo esperado: es *Grupos* quien se queda corto
frente a su propio estándar en un caso, y Agentes ya resuelve mejor que Grupos varias cosas que
merece la pena llevar también al techo.

## Resumen ejecutivo

- 🔴 **Importante — un agente no puede ver/editar su propio nivel** en la tabla "Grupos" de su
  ficha cuando el grupo reparte por "Niveles": la columna no existe ahí (§4).
- 🟡 **Importante — Grupos, editando, no avisa si quitas todos los canales**: `channelsError` de
  Grupos no cubre `mode()==='edit'`, a diferencia de sus propios `phoneError`/`typificationError`
  (§1) — y a diferencia del propio Agentes, que sí lo cubre.
- 🟡 **Importante — "Configuración" de Agentes no explica por qué desaparece un campo** al
  apagar un canal (p. ej. "Chats simultáneos"); Grupos sí tiene ese copy para sus canales
  inactivos (§2).
- 🟡 **Media, sin quick-win — ~150 líneas de lógica de negocio duplicadas** entre las dos tablas
  de asignación cruzada, "gemelas" por decisión explícita pero sin base común (§4).
- 🟢 Cosméticos (quick-win): verbo distinto en el mismo mensaje de error de canales ("Selecciona"
  vs "Marca", §1); bloque "Permisos" de Agentes sin subdividir en `sc-slot` como hace Grupos
  (§2); subsecciones de Configuración sin icono (§2); namespace i18n `agents.form.resources.*`
  reutilizado también por Grupos (§3); candado de "no permitido" con marcado distinto en las dos
  tablas (§4).
- ⭐ **Candidatas a subir el techo** (Agentes por encima de Grupos, no urgentes): lista unificada
  de "faltas" en un solo `computed` en vez de varios sueltos; `sc-permission-matrix` reutilizada
  con selección por columna; tarjetas con descripción inline para el descuelgue; patrón de evento
  interno + `sc-button` para el candado de activación (§1, §2, §4).

## Escala de severidad

- **Bloqueante** — impide completar la tarea o produce un dato incorrecto sin aviso.
- **Importante** — el usuario puede quedarse sin explicación o perder una capacidad (editar su
  nivel, saber por qué falta un campo), pero hay rodeo.
- **Cosmético** — inconsistencia visible pero sin coste funcional.

---

## 1. Sección General

| Eje | ¿Igual? | Clasificación |
|---|---|---|
| Nomenclatura | Casi — mismo patrón, verbo distinto en el aviso de canal | (c) cosmético |
| Agrupación/densidad 7·14·28 | Sí (ambos heredan `_forms.scss` / tokens `--sc-spacing-*`) | — |
| Orden de campos | No — Agentes pone canales al final, Grupos los deja en medio | (a) DD-187 §1 |
| Validación/gates | Mixto — ver abajo | (a) + (c) |
| Copy y mensajes vacíos | Sí (hints cortos y descriptivos en ambos) | — |
| Estados de carga | Sí (ninguno usa skeleton; datos síncronos de store) | (b) |
| Iconografía | Sí en icono de sección; botón "ver tipificación" solo en Grupos | (b) — Postconversación es decisión de grupo (DD-187 §6) |
| Consistencia de componentes reutilizados | No — Grupos extrae `GroupIdentityFieldsComponent`, Agentes no | (b) — arquitecturas de duplicado distintas |
| Accesibilidad/contraste | Sí (mismo patrón `ariaLabelledBy`, DD-133, en ambos) | — |

**Hallazgos (c):**

1. **`channelsError` de Grupos no avisa en edición.** `group-form-page.component.ts:404` solo
   activa el aviso con `attemptedGeneral()` (alta); no incluye `mode()==='edit'`, a diferencia de
   `phoneError` (`:360-362`) y `typificationError` (`:340-342`) de la misma ficha, que sí lo
   hacen. Si se edita un grupo y se desmarcan todos los canales, no aparece ningún aviso bajo las
   casillas — solo el botón apagado y el punto rojo del índice. El propio `channelsError` de
   Agentes (`agent-form-page.component.ts:559-563`) ya cubre los dos modos.
   **Severidad: importante. Quick-win**: añadir `mode()==='edit' ||` igual que `typificationError`.
2. **Verbo distinto en el mismo mensaje.** Grupos: "Selecciona al menos un canal"
   (`groups.errors.channels_required`, es.json:2071); Agentes: "Marca al menos un canal"
   (`agents.errors.channels_required`, es.json:2357). Mismo patrón de checkbox-grid vacío, sin DD
   que justifique el cambio de verbo. **Severidad: cosmético. Quick-win**: una cadena en 4 idiomas.

**Agentes por encima (candidata a subir el techo):** el `computed` único `faltas()`
(`agent-form-page.component.ts:523-546`) centraliza resumen + índice + motivo del botón en una
sola fuente tipada; Grupos reparte la misma lógica en varios computed sueltos que replican el
orden a mano (el propio código lo admite, `group-form-page.component.ts:518-521`).

---

## 2. Distribución y colas (Grupos) ↔ Configuración (Agentes)

| Eje | ¿Igual? | Clasificación |
|---|---|---|
| Nomenclatura | No — "Distribución y colas" describe el contenido; "Configuración" es genérico | (b) — justificado por DD-187, rompe simetría de lectura del índice |
| Agrupación/densidad 7·14·28 | Parcial — "Permisos" de Agentes sin subdividir en `sc-slot` | (a) plegado documentado (DD-187) + (c) puntual |
| Orden de campos | No, a propósito en ambos lados | (a) DD-187 / revisión 2026-10-04..09 |
| Validación/gates | Sin gates de "obligatorio" en Configuración | (b) — todos sus controles son de opción cerrada |
| Copy y mensajes vacíos | No — falta el "por qué no veo esto" en Agentes | (c) importante |
| Estados de carga | Sí (mismo patrón `saving()` + `setTimeout`) | — |
| Iconografía | No — subsecciones de Agentes sin icono | (c) cosmético |
| Consistencia de componentes reutilizados | No, pero cada uno resuelve su propio problema | (b) |
| Accesibilidad | Sí en general; dos toggles sin `aria-describedby` (consecuencia de copy ausente) | (c) ligado al punto de copy |

**Hallazgos (c):**

1. **Falta el copy de "por qué no ves esto" en Configuración.** Grupos avisa con una línea por
   cada familia de canal inactiva (`inactiveFamilies()`, `groups.form.distribution.inactive`,
   html:630-636). Agentes no tiene equivalente: si se desmarca Chat en General, "Chats
   simultáneos" desaparece de Configuración sin ninguna nota de dónde se fue ni cómo recuperarlo.
   **Severidad: importante. Quick-win**: una interpolación i18n + `@if`/`@else` bajo la matriz o
   "Avanzado" cuando `!attendsChat()`.
2. **Bloque "Permisos" sin `sc-slot`.** Grupos subdivide cada bloque de canal en `sc-slot` con
   título propio (p. ej. `groups.form.distribution.routing`, html:376). Agentes agrupa los 5
   toggles de "Permisos" en un único `div.bloque` sin subdivisión (html:384-449). **Severidad:
   cosmético. Quick-win**: envolver en 2 `sc-slot`, mismo árbol Sección→Subsección→Slot que fija
   DD-157.
3. **Subsecciones sin icono.** Grupos distingue sus 4 bloques de canal con icono propio (`call`,
   `chat_bubble`, `mail`); "Permisos"/"Llamadas"/"Avanzado" de Agentes no llevan ninguno.
   **Severidad: cosmético, menor** (las subsecciones de Agentes ya se distinguen por contenido).
4. **Dos toggles sin `aria-describedby`** (`recording`, `pendingConversations`) por no tener hint
   bajo el control — resuelto en cuanto se complete el hint que falte (punto 1 de esta sección).

**Agentes por encima:** `sc-permission-matrix` reutilizada de Contact Center con selección por
columna de un clic (html:453-464) — más densidad resuelta con menos espacio que cualquier control
de Distribución y colas; tarjetas de descuelgue con descripción inline (`sc-option-cards`,
ts:254-261) — más autoexplicativo que depender de un `helperText` que solo se lee tras seleccionar.

---

## 3. Recursos (ambas fichas) y resumen lateral

| Eje | ¿Igual? | Clasificación |
|---|---|---|
| Nomenclatura, agrupación, orden, validación, estados de carga, iconografía, accesibilidad | Sí — mismo `sc-section-card`, mismo `bloque`/`grid--2`, mismo patrón de campo oculto-pero-guardado | — |
| Copy y mensajes vacíos | Casi — namespace i18n compartido mal nombrado | (c) cosmético |
| Consistencia de componentes reutilizados | Sí — las dos usan literalmente `ResourceRowsComponent`, misma API, sin reimplementación paralela | — |

**Hallazgo (c):** los placeholders de Recursos en **ambas** fichas usan el namespace
`agents.form.resources.*` (p. ej. `groups`:663/686/710 y `agents`:603/627) — Grupos consume claves
con prefijo `agents.*`, deuda de nomenclatura i18n. **Severidad: cosmético. Quick-win**: renombrar
a un namespace neutro (`resources.*`).

Diferencias de campos presentes (email/etiquetas fuera, Equipos dentro de Agentes; "Ficha de
cliente" solo en Grupos) están documentadas en DD-187 §1/§4 y DD-121 (naturaleza del dato) — no
son hallazgos.

---

## 4. Tabla de asignación cruzada (Agentes↔canal en Grupos; Grupos↔canal en Agentes)

El propio código documenta que `agent-channel-table` y `group-assignment-table` son dos
implementaciones deliberadamente paralelas de la misma idea ("la misma tabla... con las filas al
revés", `group-assignment-table.component.ts:71-86`), y DD-121 §10 ya decidió no fusionarlas en
un componente Angular único. Eso convierte la existencia de dos componentes en **(a) divergencia
de implementación documentada**, pero deja un coste real sin cubrir por ningún DD:

| Eje | ¿Igual? | Clasificación |
|---|---|---|
| Nomenclatura de columnas | No — "Salientes" solo en la tabla del agente | (b) — solo tiene sentido visto desde el agente (DD-187 §2) |
| Agrupación/densidad | Sí (mismos tokens de spacing) | — |
| **Orden de campos (columnas) — falta "Nivel"** | No | **(c) importante** |
| Validación/gates | Sí (misma regla "último canal no se quita", mismo aviso) | — |
| Copy y mensajes vacíos | Sí en forma; "candado" con destino distinto por motivo real | (b) |
| Estados de carga | Sí (mismo `virtualScroll` + `table-card--al-pie`) | — |
| Iconografía | Candado con marcado distinto en los dos lados | (c) cosmético |
| **Consistencia de componentes reutilizados — lógica duplicada** | No | **(c) media, sin quick-win** |
| Accesibilidad | Sí (mismo `aria-live`, `scope`, `ariaLabel`) | — |

**Hallazgos (c):**

1. **La tabla "Grupos" de la ficha de agente no tiene columna "Nivel".** `GroupAgentLink.levels`
   solo es editable desde la ficha del GRUPO (`setLevel`/`levelFamily`,
   `agent-channel-table.component.ts:448-456`); cero referencias a nivel en toda
   `features/admin/agents`. Un agente asignado a un grupo con estrategia "Niveles" no puede ver ni
   cambiar su propio nivel desde su propia ficha — tiene que ir a la ficha de ESE grupo. DD-187
   §2 enumera las columnas de esta tabla y no incluye Nivel: no se decidió excluirla, nadie la
   pidió. **Severidad: importante. Sin quick-win** — exige una columna condicional por fila/familia
   (cada grupo visible puede o no tener estrategia Niveles), no una columna fija como en el lado
   del grupo. Cambio de alcance medio.
2. **~150 líneas de lógica de negocio duplicadas** entre `agent-channel-table.component.ts:325-404`
   y `group-assignment-table.component.ts:258-350` (cabecera "todos", confirmación en lote, acción
   masiva) y dos tablas de medidas en rem mantenidas a mano con comentarios cruzados ("la gemela",
   líneas 65-68). No fusionar los componentes fue una decisión a propósito (DD-121 §10), pero el
   coste de mantener la lógica sincronizada entre "gemelos" no se ha revisado desde entonces.
   **Severidad: media. Sin quick-win** — extraer a un servicio o directiva compartida es cambio de
   arquitectura.
3. **Candado "no permitido" con marcado distinto.** Lado del grupo: `<a><sc-icon
   name="lock"></a>` (`agent-channel-table.component.html:105,156`); lado del agente: `sc-button
   appearance="text" icon="lock"` (`group-assignment-table.component.html:72-76,115-118`). Mismo
   icono y significado, construcción distinta. **Severidad: cosmético. Quick-win parcial**:
   alinear el lado del grupo al `sc-button` del agente cuando el destino sea interno (cuando cruza
   de ficha sigue necesitando ser un enlace real).

**Agentes por encima:** el candado de la tabla de agente usa `sc-button` + evento interno (`irA`)
en vez de forzar navegación — patrón más limpio que el `<a><sc-icon>` suelto del lado del grupo,
coherente con "la ficha resuelve el clic en su sitio" (DD-146); se repite en dos sitios
(autoactivación y no-permitido).

---

## Quick-wins (horas) vs cambios mayores (días)

**Quick-wins:**
- [ ] `channelsError` de Grupos: añadir rama `mode()==='edit'` (§1.1).
- [ ] Unificar verbo "Selecciona"/"Marca" en el aviso de canal (§1.2).
- [ ] Copy "por qué no ves esto" en Configuración cuando se apaga un canal (§2.1).
- [ ] Subdividir "Permisos" de Agentes en `sc-slot` (§2.2).
- [ ] Icono en subsecciones de Configuración (§2.3, menor).
- [ ] Renombrar namespace i18n `agents.form.resources.*` a uno neutro (§3).
- [ ] Alinear el candado del lado del grupo a `sc-button` (§4.3).

**Cambios mayores:**
- [ ] Columna "Nivel" condicional en la tabla "Grupos" de la ficha de agente (§4.1).
- [ ] Extraer a base común la lógica duplicada de las dos tablas de asignación (§4.2).

**Candidatas a subir el techo de Grupos (no urgentes, evaluar aparte):**
- [ ] Modelo único de "faltas" (como `faltas()` de Agentes) en vez de computeds sueltos (§1).
- [ ] Evaluar `sc-permission-matrix`/tarjetas con descripción inline como patrón general para
  bloques densos de opciones (§2).
