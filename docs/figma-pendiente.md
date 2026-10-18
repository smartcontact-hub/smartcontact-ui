# Figma — lo que falta por tocar allí, una cosa a la vez

> **Para qué es este fichero.** Hay cambios que el código no puede cerrar solo: viven en Figma y los hace una
> persona. Aquí están juntos, cada uno con lo que hace falta para atacarlo sin releer media sesión: qué variable o
> qué nodo, de qué valor a cuál, y cómo se comprueba que está hecho.
>
> **Ficheros:**
> - «Smart-Contact Design System» — `khNq9dJKNi13pNllrqm6dx` (110 páginas): las variables del Kit y los maestros.
> - El fichero del **Supervisor** (las maquetas). Su clave no está en el repo; el código cita sus nodos como
>   «Figma Supervisor 393:…» o «2286:…».
> - PrimeOne 4.0.0 — `bJ01Ym4NrCvxFm7dJXvhqp`, solo de referencia.
>
> **Cómo se mantiene.** Lo cerrado se marca aquí, con la fecha. Lo nuevo entra aquí y **no** en la bandeja del
> hand-off: una cosa que solo se puede hacer en Figma no es trabajo de la próxima sesión.
>
> ⚠️ **Repasado entero el 2026-09-27** contra el código y el export del Kit de `main` (`4f4f2018`): cada ficha,
> cada fila de la tabla de la ficha 4 y cada variable citada. **No contra el fichero de Figma**: esa sesión no
> tenía server de Figma. Lo que solo se ve en el fichero lo marca cada ficha con **«mídelo antes»**. Ninguna ficha
> está hecha: en todas las que tocan una variable, el export aún dice el valor de antes.
>
> ✅ **Sesión en el fichero del 2026-10-17**, con el bridge sobre `khNq9dJKNi13pNllrqm6dx`. Regla: **solo repuntes**
> a variables y estilos que ya existen. Ni variables, ni propiedades, ni variantes, ni dibujo nuevos, para que el plugin
> siga leyendo el tema de PrimeNG tal cual. Lo que pide algo que no existe queda para otra sesión, y su ficha lo dice.
> Versiones guardadas en el fichero: «antes de figma-pendiente (2026-10-17)» y «figma-pendiente: repuntes
> (2026-10-17)». Al cerrar, cada colección tenía las mismas variables que al empezar (medido).
>
> **El maestro `Section` del fichero del DS es `12610:23284`** (página `❖ Section`, `13644:4169`). El `691:23956` que
> citan esta guía y el código no existe en este fichero (medido el 2026-10-17).


**Repositorios en tarjetas por grupo (DD-179, 2026-10-06).** El hub no tiene página en el fichero del Supervisor
(DD-77); si se dibuja, a 1440 y sin desplazar: tarjetas por grupo (radio 12, 14 por dentro, borde `border-default`),
el icono en el Avatar cuadrado de 28, la cifra en el Tag `label` sin borde, y el borde de la tarjeta en el tono de su
grupo al pasar (el borde de la etiqueta) y al marcarla (su punto y un halo de un píxel). El panel lateral, acoplado bajo
la barra de la app: 350 de ancho, sin sombra, con el borde en su filo interior y la esquina de arriba a 12. En el Kit,
tres variantes que aún no existen: Drawer acoplado, Avatar con tono de etiqueta y Tag `label` sin borde. Los tonos son
los de etiqueta del código (`--sc-label-<color>-bg`, `-text`, `-border` y `-dot`: Comunicación azul, Clasificación
morado, Diseñador teal, IA naranja), que no tienen variables en el Kit, y el azul sale de `azure`, que el Kit no tiene
(DD-83): decide con qué familia del Kit se pinta antes de dibujarlo. Mídelo antes.

**La cifra principal del resumen, con color (DD-161, 2026-10-04).** Pendiente en la maqueta de las fichas: una
tarjeta del resumen por ficha con el degradado del botón principal (pulsado → reposo → al pasar, a 135°), el texto
`text-inverse`, la sombra de tarjeta y el anillo y las barras en el color del texto sobre una pista al 25 %. Si se
quieren tokens propios de degradado, nacen en el Kit. Mídelo antes.

**El alta, el listado y la tabla al pie (DD-158 a DD-160, 2026-10-04).** «Atrás» secundario y «Siguiente» principal,
juntos a la izquierda y sin icono; sin la columna «Asignar» en Grupos; y la tabla de agentes del grupo hasta el pie de
la pantalla. Solo maqueta: ninguna variable nueva.

**Distribución y colas con el árbol del DS (DD-157, 2026-10-04).** Pendiente en el Kit y en la maqueta de la ficha de
grupo: la sección en `surface="subtle"`, cada canal un `.Subsection` y cada parte un slot (Distribución, Cola, Mensajes
en cola y, en Chat, el acceso al final); la música en «Cola»; y una variante plegable del slot, con el título como
botón y el chevron de la subsección, que en el Kit no existe. Mídelo antes; no requiere variables nuevas.

**Estado del agente en su columna (DD-156, 2026-10-04).** Pendiente de reflejar en la maqueta de la asignación de
agentes del grupo (ficha y panel): «Estado» es la columna que sigue a «Agente», con la etiqueta del listado, y cada
columna mide lo que lleva (Asignado y Habilitado, su rótulo). La referencia de producto dibuja un punto de color: se
mantiene la etiqueta del listado y de Contact Center › Servicio. Mídelo antes; no requiere variables nuevas.

**F · listado (DD-153, 2026-10-02).** Pendiente de reflejar en el Kit y la maqueta: selector de
columnas solo con `view_column` (tallas de botón de icono existentes), Asignar y menú fijos a la
derecha, fondo opaco por estado y sombra solo mientras hay contenido oculto. Mídelo antes contra
las demos de MultiSelect y DataTable; no requiere variables nuevas ni modifica el export de tokens.

---

## ▶︎ El plan de la sesión en Figma

Primero va lo que viaja por el export, que lo comprueba el robot. Después, el dibujo del DS. Luego se publica. Las
maquetas del Supervisor van al final, porque usan lo publicado. Cada paso deja el fichero en un estado bueno: si
se corta a medias, se retoma en el siguiente.

### Paso 0 · Antes de tocar nada (15 min)

- [x] Guarda una versión del fichero del DS (*File → Save to version history*), con un nombre como «antes de
      figma-pendiente». Guarda otra al acabar cada paso. **Hecho el 2026-10-17.**
- [ ] Repasa **«Decisiones»**, justo debajo: seis tomadas el 2026-09-28 y una pendiente (los buscadores). Si no
      decides una, sáltate esa ficha: las demás no dependen de ella.
- [ ] Plugin `primeui-figma-plugin-v4`, panel *GitHub Settings*: owner `smartcontact-hub`, repositorio
      `smartcontact-ui`, rama `design-tokens-sync`, fichero `projects/design-tokens/scripts/kit-export-dtcg.json`,
      carpeta de tema `.theme-designer/`. El token necesita `repo` sobre la organización.
- [ ] Si trabajas con Claude en local y el bridge de Figma (`figma-console`, WebSocket 9224), arráncalo **antes**
      de abrir la sesión de Claude: no se engancha a mitad.

### Paso 1 · Variables de medida, push y PR del robot (~45 min)

- [x] **Ficha 4:** los 52 alias y `toast/blur` en claro **ya estaban** en el fichero y en el export desde el
      2026-09-28 (#276; medido el 2026-10-17: 52 de 52 y `toast/blur` a 10 en los dos modos). Lo que falta es código:
      quitar esas filas de `PENDIENTE_FIGMA` (paso 6).
- [ ] **Ficha 4, las 3 que se separan en dos:** piden variables nuevas (`…/padding/y` y `…/padding/x`). Otra sesión.
- [ ] *Push* en el plugin. En segundos sale un run de `tokens-sync`; si no sale ninguno, el push no llevaba
      cambios. Si el plugin dice «does not match», ciérralo y vuelve a abrirlo.
- [ ] El robot abre el PR «chore(tokens): sync del Theme Designer». **Qué esperar:** ningún cambio visual, porque
      el código ya pintaba Aura, y `token-parity` avisando «quita la fila» por las 55. Fúndelo cuando esté verde.

### Paso 2 · Variables de color, push y PR del robot (~30 min)

- [x] **Fichas 8, 12, 14 y 19:** los 21 repuntes, hechos en el fichero el 2026-10-17 con
      `node tools/figma-pendiente.mjs color` (comprobados uno a uno después). Push el mismo día: el robot abrió
      el PR #439, y el código que lo completa (paso 6) va en otro PR con el mismo export.
- [x] **La variable nueva `text/heading/color` (ficha 2): no se crea.** El Kit ya tiene `semantic/text/heading`
      (colección Custom), lo mismo que `--sc-text-heading`. El título de `Section` se repuntó a ella y, con la
      decisión 3, su claro pasó a `slate/900` el 2026-10-17 (ver ficha 2).
- ⚠️ **El plugin exporta la colección Custom con un solo modo, el oscuro** (medido en el export del 2026-10-17:
      `semantic.text.heading` = `{surface.0}`, `accent` = `{violet.400}`). Nada que viva solo en Custom llega bien
      al claro por el export: esas claves se escriben a mano en código y, en el tema publicado, manda el DS
      (`scripts/tema-zip.mjs`, `MANDA_EL_DS`).
- [ ] Empuja cuando el PR del paso 1 esté **fundido**. El robot reescribe la misma rama: si empujas antes, actualiza
      aquel PR en vez de abrir otro, y los dos cambios quedan mezclados.
- [ ] **Qué esperar:**
      - el texto principal y el secundario, un paso más oscuros (ficha 8);
      - más oscura también la etiqueta «Desconectado» (ficha 14);
      - los botones rojos y los grises de la ficha 19, sin cambios: el código ya los pintaba así (el «Eliminar» de
        texto, desde DD-128).

      Puede salir rojo en pruebas que fijan el gris de antes (`theme-contrast`, las fotos de sc-docs). No lo fundas
      en rojo: pásalo a la sesión de código del paso 6, que lo lleva a verde.

### Paso 3 · Componentes del DS, casi todo dibujo (~2–3 h)

Por orden, de lo que más se usa a lo que menos:

- [x] **16** · `Section`, a 17,5 arriba y abajo. **Hecho el 2026-10-17** (`12610:23284`, las cuatro variantes).
- [x] **17** · El diálogo: 10,5 entre botones (`dialog/footer/gap` → `scale/0-75`), **hecho el 2026-10-17**.
- [ ] **17** · La botonera a 28 del último campo y 14 entre campos: el maestro `dialog` (`243:9556`) no tiene variante
      con formulario, solo texto. Crearla es otra sesión; en las maquetas, paso 5.
- [ ] **6** · La miga, subrayada al pasar el ratón: es dibujo nuevo, no un repunte. Otra sesión.
- [x] **9** · Tabs, el peso: atado a `tabs/tab/font/weight` (600), **hecho el 2026-10-17**. El trazo de abajo de cada
      pestaña, atado a `tabs/tab/border/width`.
- [ ] **9** · Tabs, los bordes a 0 y transparente: son valores, no repuntes (el Kit no tiene variable de transparente ni
      de cero para eso). Sin decidir. Las flechas, el punto del Badge y el hueco de «Añadir widget»: nuevos, otra sesión.
- [ ] **11** · Panel con `Severity`.
- [ ] **13** · El botón pulsado, al 96 %.
- [ ] **5** · El índice lateral, como componente.
- [ ] **29** · El icono a 600 junto a su texto semibold: el del título de `Section` y el de la fila activa del índice.
      **No se puede repuntar:** el icono de `Section` es un glifo de la librería Material Icons (`Style` = Filled,
      Outlined, Round, Sharp, Two Tone), que no tiene eje de peso (medido el 2026-10-17).
- [x] **40 y 47** · El icono de `Section`, a 18 atado a `primitive/typography/font/size/400` (el tamaño de su título
      `h3`), y el de `.Subsection` (`12610:23193`), a 16 atado a `…/size/300`; el título de `.Subsection`, a
      `Subtitle/subtitle-semibold`. **Hecho el 2026-10-17.** El icono que cuelga (ficha 40) es solo del `Block`.
- [x] **22** · En `Section`, del icono al título: el 8 suelto pasa a `scale/0-625` (8,75). **Hecho el 2026-10-17.**
- [ ] **2** · La pastilla sin punto y a 600. La etiqueta IFTA se queda en 400 (decidido): en Figma no hay que tocarla.
- [ ] **24** · El icono de `button-default` y el texto de `inputtext`, atados al tamaño de letra.
- [ ] **21 y 20** · Los iconos huérfanos (se publica Smart-Contact-Icons), y después el tablero de la barra lateral de
      la página Testing, que necesita `neurology`.
- [ ] **7** · El glifo de los iconos, si el `IconSet` ata la caja (decidido). Va el último porque cambia cómo se ven todas las
      maquetas.
- [ ] **Otro push:** las fichas 9 (los bordes de Tabs) y 17 (`dialog/footer/gap`) también cambian variables
      (`node tools/figma-pendiente.mjs componentes`). El 2026-10-17 solo se aplicó `dialog/footer/gap`, y viaja en el
      push del paso 2. Qué
      esperar del PR del robot: nada visual en las pestañas, porque el código ya las pinta así (DD-107); en los
      diálogos nativos de PrimeNG, 10,5 entre botones, como ya tiene `sc-dialog`.

### El script de las variables: `tools/figma-pendiente.mjs`

Hace los cambios de variables de los pasos 1 a 3 con el bridge, y los comprueba dos veces:

- **al generarlo, contra el export de `main`:** cada valor de partida tiene que ser el que dice el Kit, y cada destino
  tiene que existir. Si una ficha trae un dato falso, para y no genera nada;
- **dentro de Figma:** una variable solo cambia si vale lo de partida. Si ya vale lo nuevo, la salta. Si vale otra cosa,
  no la toca y la pone en `revisar`.

Probado el 2026-09-28 sobre un Figma simulado con las variables del export: las tres tandas miran, aplican, salen «ya
estaba» al repasar y no tocan una variable con un valor inesperado. **No probado todavía contra el fichero real.** Los
nombres de las colecciones «Semantic Common» y «Component Common» no están comprobados. Si no casan, el script usa la
variable cuando su nombre es único y avisa.

1. `node tools/figma-pendiente.mjs medidas` (o `color`, o `componentes`) y la salida, a `figma_execute`. Solo mira.
2. Lee `cuenta` y `revisar`. Si `revisar` está vacío, repite con `--aplicar`.
3. Vuelve a pasarlo sin `--aplicar`: todo tiene que salir «ya estaba».
4. Guarda versión en Figma y haz el push del plugin.

### Paso 4 · Publicar la librería (ficha 1, 1 min)

### Paso 5 · Maquetas del Supervisor (~1–2 h)

- [ ] Acepta la actualización de la librería en el fichero del Supervisor.
- [ ] **3** · TopBar a 56 y el aire de las páginas de lista.
- [ ] **15** · Filas de formulario y radios a 14; botón de envío a 28.
- [ ] **16** · `Block` (393:12587), a 17,5.
- [ ] **5** · Contact Center, con una instancia del índice en lugar del marco.
- [ ] **18** · El resumen de las fichas.
- [ ] **29** · Las altas de agente y usuario, con su cabecera y «Crear …», y los saltos por canal de Distribución y colas.
- [ ] **2** · Tarjetas de opción en Servicio; el interruptor a la derecha en los ajustes de Grupos.
- [ ] **22 y 23** · Los números sueltos y la presencia de Contact Center.
- [ ] **24** · Los tres textos de General.
- [ ] **30** · Contact Center › Grupos y › Agentes, con los bloques y las palabras de sus fichas.
- [ ] **31** · El resumen de las tres altas, con «Falta: …» y «Listo para crear».
- [ ] **32** · Las tres altas con el índice de la edición: el ✓ de la sección hecha y «Atrás» / «Siguiente» al pie.
- [ ] **33** · La ficha de grupo y Contact Center › Grupos: estrategias con «conversaciones», sin «Desbordar sesión».
- [ ] **34** · El teléfono saliente obligatorio y cerrado, «Caducar sesión» y Recursos sin Etiquetas.
- [ ] **35** · Las fichas en tres columnas: el título en el contenido, el resumen sin rótulo y «Eliminar» bajo el índice.
- [ ] **36** · El nombre de la ficha, fijo arriba al bajar.
- [ ] **37** · El resumen de la ficha de grupo, con sus rótulos y filas como enlaces.

### Paso 6 · Después, en el repo (una sesión de código; pásale este fichero)

**Hecho el 2026-10-17 para el export de ese día**, salvo lo que se dice abajo: las 52 filas de `PENDIENTE_FIGMA`
(quedan las tres separadas), las filas de `EXCLUDE`, las dos de iconos de `color-map.mjs` a `enforce`,
`togglebutton.ts`, `--sc-text-subtle` y `--sc-text-heading`. El marcador de campo pasó a `enforce` con el tercer envío
del mismo día (ficha 19). Lo decidido el 2026-09-28 para `sc-dialog` y la etiqueta IFTA sigue pendiente.

**Las dos excepciones de `theme-contrast` NO salen** (medido el 2026-10-17): sin ellas aparecen otros textos en
slate-600 que no son el secundario. Dos etiquetas de botón de 12 px en `admin/agendas/editar/1` (4,25:1 sobre el
lienzo) y un texto de 14 px en `conversaciones/reglas/nueva?seccion=alcance` (3,92:1 sobre slate-100). Falta decidir su
color; hasta entonces el par se queda, con su motivo escrito en el spec.

- **Tras el PR del paso 1:** quitar de `PENDIENTE_FIGMA` (`scripts/sizing-map.mjs`) las filas que señale
  `token-parity`. En las tres separadas, la fila pasa a leer `…padding.y` y `…padding.x`.
- **Tras el PR del paso 2**, cada divergencia que el Kit ya dice igual:
  - de `EXCLUDE` (`scripts/cmp-color-map.mjs`) salen las 6 de `button.danger`, `light:button.text.danger.color`
    (DD-128), `light:togglebutton.color`, `light:togglebutton.hover.color` y `light:button.outlined.secondary.color`;
  - en `scripts/color-map.mjs`, las filas `diverge` de `form.field.icon.color`, `navigation.item.icon.color` y
    `form.field.placeholder.color` pasan a `enforce`;
  - en `togglebutton.ts`, los 2 slots aún escritos a mano pasan a `var(--sc-cmp-togglebutton-*)`;
  - `--sc-text-subtle` sube a slate-700 a mano: vive fuera de la zona generada;
  - `e2e/supervisor/theme-contrast.spec.ts` pierde las 2 excepciones del secundario en slate-600;
  - la fila de `text/heading/color` en `color-map.mjs`, si se creó la variable;
  - se regeneran las fotos de sc-docs.
- **Lo decidido el 2026-09-28, en el DS** (con su DD y sus fotos):
  - `sc-dialog` pasa a 15,75, con el pie con cuerpo a 12,25 (sigue a 28);
  - la etiqueta IFTA de `sc-select` y `sc-multiselect` baja a 400, como `sc-inputtext` y el Kit;
  - `--sc-text-heading` sube a slate-900.
- **Tras los pasos 3 y 5:** se borran los comentarios que dicen que el código se aparta de la maqueta (`.grid` en
  `_forms.scss`, `sc-section-card.component.scss`, `sc-dialog.component.scss`, `sc-form-section-nav.component.scss`) y
  se citan los nodos nuevos (el índice, el resumen).
- En cada caso: `npm run tokens:import`, `npm run tokens:parity`, `npm run verify`.

---

## Decisiones, tomadas el 2026-09-28

1. **El marco del diálogo, a 15,75, y el código se alinea** (la recomendada). El Kit ata todo el relleno del diálogo a
   `overlay/modal/padding` = `scale/1-125` (15,75), igual que Aura (1,125 rem) y que el `p-dialog` nativo. Solo
   `sc-dialog` pintaba 17,5, sin divergencia declarada. En Figma, el pie con cuerpo gana 12,25 arriba (ficha 17). En
   código, `sc-dialog` baja a 15,75 (paso 6).
2. **La etiqueta dentro del campo (IFTA), a 400 en todas.** Aquí se fue en contra de la recomendación (600), y vale: el
   Kit y Aura ya dicen 400, así que Figma no cambia. En código, `sc-select` y `sc-multiselect` bajan de 600 a 400 (paso 6).
3. **El texto al pasar el ratón y el título de sección suben a 900** (la recomendada). El script cambia
   `text/hover/color` y crea `text/heading/color` en `surface/900`. En código, `--sc-text-heading` sube a slate-900 (paso 6).
4. **El glifo de los iconos se agranda en Figma si el `IconSet` ata la caja** (la recomendada). Se mira antes. Si ata
   el ancho y el alto a la variable de tamaño, el glifo crece un 33 % (24/18) sin tocar la caja, y el índice lateral baja
   de 20 a 14. Si no los ata, no se toca y se anota aquí.
5. **Los dos buscadores: pendiente.** Explicada el 2026-09-28; falta la respuesta. Se recomienda la lupa de Material a
   la izquierda en los dos: el icono de la app es Material (DD-104) y `sc-search` es el buscador de todas las listas. En
   código, pasar a la izquierda la lupa de los paneles son cinco clases `.p-*` (medido); cambiar su glifo no está medido.
6. **El fondo del item seleccionado de la barra lateral, al 15 %, y Figma se alinea** (la recomendada). Dos fondos de
   grupo del 6 % superpuestos suman 11,6 % (DD-112): a 12 %, lo seleccionado se confundía con ellos.
7. **El rojo contorneado sube con el de texto** (la recomendada): `button/outlined/danger/color` a `red/600`. Va en el
   script.
8. **Aparcadas, no para esta sesión:**
   - el color del botón principal (ROADMAP, «Decisiones de marca pendientes»: decisión de marca);
   - borrar la colección «App» (ficha 26);
   - el botón de solo icono, que no es cuadrado, y la hora del datepicker (ficha 25).

---

## 1 · Publicar la librería

**Estado:** pendiente · **Dónde:** Figma, panel *Assets* → icono de librerías → *Publicar* · **Esfuerzo:** un minuto

Los ficheros que usan la librería no ven sus cambios hasta que se publica, y publicar es un paso de persona. Hay al
menos tres tandas hechas en el fichero del DS sin publicar, salvo que se haya publicado después (el repo no puede
saberlo):

- la del 2026-09-13: el título de `Section` a `h3` y el borrado de `app/typography/xl|xxl` (DD-75);
- la del 2026-09-14: el interlineado atado en los maestros de botón y campo (DD-91);
- y la colección «App» como alias de Custom (DD-92), también del 2026-09-14.

Se suma lo que se haga en los pasos 1 a 3 del plan.

**Cómo sabes que está hecho:** en el fichero del Supervisor desaparece el aviso de actualizaciones pendientes.

---

## 2 · Lo que Config cambió en código y Figma aún no sabe (2026-09-13)

**Estado:** pendiente, una a una: bajarla al Kit o revertirla en código · **Evidencia:** medido en código (sesión de
`/config/aed/*`); **mídelo antes** en el fichero.

- **Pastillas sin punto y a 600.** Vale para la variante `label` de `sc-tag` y `sc-chip`: en una pastilla tintada, el
  color ya está en el fondo y en el texto. El `<p-tag>` sin variante sigue al Kit: `tag/font/weight` es bold (700).
  **En Figma:** la pastilla de etiqueta sin punto y con el texto a semibold. **Mídelo antes:** qué peso dibuja hoy el
  maestro. Esta ficha decía 500; la variable dice 700.
- **`--sc-text-heading`** (slate-800 en claro, blanco en oscuro) para los títulos de sección. **Ya existe en Figma**
  (medido el 2026-10-17): `semantic/text/heading`, colección Custom, claro `slate/800` y oscuro `surface/0`. El título
  de `Section` se repuntó a ella el 2026-10-17 (antes iba a `text/color`). No se crea `text/heading/color`.
  **Decisión 3, hecha el 2026-10-17:** su claro pasa a `slate/900`, porque `text/color` ya está en `surface/900` y el
  título no puede ser más claro que su contenido. Las otras capas que la usan se miraron antes: 53 de `❖ Sidebar`, todas
  en la tabla «Sidebar (Para desarrollo)» (rótulos y nombres de icono sobre blanco, no la barra del producto), 1 de
  `❖ Navmenu` y 1 de `🌈 Colors`. En código, `--sc-text-heading` a slate-900 el mismo día.
- **Tarjetas de opción (`sc-option-cards`)** en Servicio, en lugar del modal `103:2718`: es una maqueta del
  Supervisor.
- **La etiqueta IFTA (dentro del campo): decidido el 2026-09-28, a 400 en todas.** En código iba a 600 en `sc-select` y
  `sc-multiselect` y a 400 en `sc-inputtext` y en el `p-iftalabel` nativo (`iftalabel/font/weight` es regular). Figma
  ya dice 400 y no se toca. En código, `sc-select` y `sc-multiselect` bajan a 400 (paso 6).
- **El interruptor, a la derecha** en la lista de ajustes de Grupos, y a la izquierda en General y Agentes: va donde
  van los controles de su patrón. Es una maqueta del Supervisor.

---

## 3 · La cabecera y el aire de página se compactaron en código (2026-09-14)

**Estado:** pendiente de bajarlo al fichero · **Evidencia:** medido en código, en builds del Supervisor a 1440; el
export no tiene variables para esto.

- **TopBar a 56 de alto** (`scale/4`). Figma `12277-4705` dibuja 72, con 20 arriba y abajo. Es el mismo token que el
  bloque del logo de la barra lateral, para que las dos rayas casen. El avatar va a `--sc-cmp-avatar-width` (28), y la
  miga, sin relleno propio (DD-90).
- **Páginas de lista:** de la barra al título 17,5 (`scale/1-25`), lados 28 (`scale/2`), del título al contenido 14
  (`scale/1`) y del buscador a la tabla 12,25 (`scale/0-875`).
- **No se aplica a las páginas con índice ni a las de formulario:** esas empiezan a 22,75 y 24,5 (`_page.scss`), que
  DD-94 dejó como estaban.

---

## 4 · Las medidas de PrimeOne que Aura 3 cambió: el código ya sigue a Aura (2026-09-14)

**Estado:** las 52 de alias y `toast/blur`, **HECHAS** en Figma y en el export desde el 2026-09-28 (#276; medido en el
fichero el 2026-10-17). Falta quitar sus filas de `PENDIENTE_FIGMA` (paso 6). Las tres que se separan, pendientes:
piden variables nuevas, otra sesión. · **Evidencia:** export del Kit y builds (DD-97). **Verificado el 2026-09-27:**
las 55 filas de la tabla casan una a una con `PENDIENTE_FIGMA` (`scripts/sizing-map.mjs`) en colección, ruta, valor
de hoy y valor de Aura; también las tres que se separan.

**Lo medido en el fichero el 2026-10-17 para las tres que se separan.** `divider/horizontal/padding` (0) solo ata el
relleno de arriba y abajo de la raya horizontal; `divider/vertical/padding` (0), el de los lados de la vertical; e
`inputgroup/addon/padding` (`scale/0-5`), los cuatro lados de los 12 maestros del addon. El tramo de raya antes o
después del contenido (`Align=Left|Right|Top|Bottom`) es un rectángulo de 17,5 suelto, que es lo que el código pinta
con el relleno de Aura (12,25 en horizontal, 5,25 en vertical). Y el addon con 0 arriba y abajo, como Aura, se
encogería en Figma: en código su alto lo da el campo de al lado.

PrimeOne 4.0.0 dibujó el Aura de 2024, y Aura 3 cambió 55 de esas medidas. El código ya lleva el valor de Aura con el
**paso de escala con el nombre del rem de Aura** (como DD-81), que es una variable que ya existe. Mientras Figma no
cambie, `PENDIENTE_FIGMA` impide que un export devuelva el código a PrimeOne.

**Cómo se hace, sin crear primitivos:** cada variable de la tabla pasa a apuntar (alias) al paso de la columna «Aura».
Las tres marcadas «separar» son hoy una sola variable donde Aura pone dos valores: se crean `…/y` y `…/x`, como en
`divider/horizontal/content/padding`, cada una con alias a un paso que ya existe, y la capa del maestro se ata a las dos.

**Cómo sabes que está hecho:** tras el push, el robot pasa `token-parity` y avisa «pendiente(s) que el export YA dice
igual: quita la fila». Se quitan esas filas de `PENDIENTE_FIGMA`. En las tres separadas, además, las filas pasan a leer
`…padding.y` y `…padding.x` en `exp`.

| Colección | Variable | Hoy en el Kit | Aura |
|---|---|---|---|
| Semantic Common | `list/option/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `list/option/group/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `navigation/item/padding/y` | scale/0-5 | scale/0-25 |
| Semantic Common | `navigation/submenu/label/padding/y` | scale/0-5 | scale/0-25 |
| Component Common | `message/content/sm/padding/y` | scale/0-375 | scale/0-25 |
| Semantic Common | `list/option/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `list/option/group/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/item/padding/x` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/submenu/label/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `tooltip/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `message/content/padding/x` | scale/0-75 | scale/0-625 |
| Component Common | `radiobutton/icon/size` | scale/0-75 | scale/0-625 |
| Component Common | `badge/font/size` | scale/0-75 | scale/0-625 |
| Semantic Common | `navigation/submenu/icon/size` | scale/0-875 | scale/0-75 |
| Component Common | `message/content/lg/padding/x` | scale/0-875 | scale/0-75 |
| Component Common | `radiobutton/icon/lg/size` | scale/1 | scale/0-75 |
| Component Common | `badge/lg/font/size` | scale/0-875 | scale/0-75 |
| Component Common | `tooltip/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `tag/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `message/content/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `divider/vertical/content/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `divider/horizontal/content/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `divider/vertical/padding` | 0 | **separar en `divider/vertical/padding/y` → scale/0-375 y `divider/vertical/padding/x` → 0** |
| Component Common | `badge/padding/x` | scale/0-5 | scale/0-375 |
| Component Common | `paginator/padding/y` | scale/0-5 | scale/0-375 |
| Component Common | `message/content/lg/padding/y` | scale/0-625 | scale/0-5 |
| Component Common | `message/content/sm/padding/x` | scale/0-625 | scale/0-5 |
| Component Common | `badge/sm/font/size` | scale/0-625 | scale/0-5 |
| Component Common | `divider/horizontal/padding` | 0 | **separar en `divider/horizontal/padding/y` → 0 y `divider/horizontal/padding/x` → scale/0-875** |
| Component Common | `paginator/padding/x` | scale/1 | scale/0-875 |
| Component Common | `inputgroup/addon/padding` | scale/0-5 | **separar en `inputgroup/addon/padding/y` → 0 y `inputgroup/addon/padding/x` → scale/0-5** |
| Component Common | `panel/toggleable/header/padding/x` | scale/1-125 | scale/1 |
| Component Common | `panel/header/padding` | scale/1-125 | scale/1 |
| Component Common | `popover/arrow/offset` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/width` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/height` | scale/1-25 | scale/1-125 |
| Component Common | `progressbar/height` | scale/1-25 | scale/1-125 |
| Component Common | `card/body/padding` | scale/1-25 | scale/1-125 |
| Component Common | `badge/sm/min/width` | scale/1-25 | scale/1-125 |
| Component Common | `badge/sm/height` | scale/1-25 | scale/1-125 |
| Component Common | `radiobutton/lg/width` | scale/1-5 | scale/1-25 |
| Component Common | `radiobutton/lg/height` | scale/1-5 | scale/1-25 |
| Component Common | `badge/min/width` | scale/1-5 | scale/1-25 |
| Component Common | `badge/height` | scale/1-5 | scale/1-25 |
| Component Common | `avatar/lg/font/size` | scale/1-5 | scale/1-25 |
| Component Common | `avatar/lg/icon/size` | scale/1-5 | scale/1-25 |
| Component Common | `confirmdialog/icon/size` | scale/2 | scale/1-5 |
| Component Common | `badge/lg/min/width` | scale/1-75 | scale/1-5 |
| Component Common | `badge/lg/height` | scale/1-75 | scale/1-5 |
| Component Common | `inputgroup/addon/min/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/jump/to/page/input/max/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/nav/button/width` | scale/2-5 | scale/2-25 |
| Component Common | `paginator/nav/button/height` | scale/2-5 | scale/2-25 |
| Component Common | `avatar/xl/group/offset` | scale/neg-1-5 | scale/neg-1-25 |
| Component Common | `avatar/group/offset` | scale/neg-0-75 | scale/neg-0-625 |

**Tres cosas más de la misma tanda:**

- **Desenfoque del toast en claro:** `toast/blur` vale 1,5 en claro y 10 en oscuro; Aura pone 10 en los dos, y el
  código también. En Figma, el modo claro al mismo valor que el oscuro.
- **Paneles pequeño y grande de select y multiselect:** el código ya no les da relleno ni letra propios a la cabecera,
  la lista y las opciones, que siguen a `list/option/*`. Solo el buscador conserva la talla del trigger. Si algún
  maestro de panel sm o lg dibuja otro relleno, se ata a `list/option/padding/*`.
- **Se quedan como están, a propósito:** `toast/width` (`scale/25`) y `toggleswitch/height` (`scale/1-5`). Aura pide
  22 rem y 1,375 rem, que no existen en la escala. El paso más cercano es el que ya tienen: en el interruptor, 1-25 y
  1-5 quedan a la misma distancia y se conserva el actual.

---

## 5 · El índice lateral de las pantallas con rail no es componente de la librería (2026-09-14)

**Estado:** pendiente · **Verificado** con el server de Figma el 2026-09-14: en el fichero del DS no hay ningún
componente de índice lateral (revisados sus 228 componentes y conjuntos). En el fichero del Supervisor, el único dibujo
es un MARCO, no una instancia: `393:12565`, «sc-form-section-nav (pure-sc)», de 196 de ancho, dentro de la maqueta de
Contact Center.

En código es UNA pieza desde el 2026-09-27 (DD-122): `sc-form-section-nav` con `[flush]`, en las cinco pantallas con
índice (fichas de agente, grupo y usuario, constructor de reglas y Contact Center). Contact Center no se movió un píxel
al cambiar de pieza (medido contra `main`, en claro y en oscuro). Las cifras, medidas a 1440 y comprobadas en el código
el 2026-09-27:

- carril de 196, fijo a 22,75 de arriba y a 28 del contenido;
- item de 37,5, con relleno 8,75, hueco 5,25 y radio 12;
- texto 14/20 en 400 (600 el activo), icono de 14 de caja, y el activo sobre `rgb(236, 239, 243)`.

Mientras sea un marco suelto, cada maqueta nueva lo vuelve a dibujar a mano y puede salir distinto: es lo que pasó con
la generación anterior (`12277:4818`, panel gris con el icono en su cajita).

**Lo que el código ya tiene y Figma no (DD-122):**

- **El rótulo de encima** (`titleKey`, «Contact Center», `Text` `393:12569`): 14/20 en semibold y gris secundario, con
  3,5/12,25 de relleno. **Mídelo antes:** un comentario anterior del código lo anotaba en regular. Si la maqueta dice
  regular, el código la sigue (DD-111).
- **Sección con cambios sin guardar** (`sectionsWithChanges`): el mismo punto de 8 que el de error, en `--sc-bg-primary`
  (marino en claro, sky-300 en oscuro) en vez de rojo. Si una sección tiene las dos cosas, se ve el rojo. La ficha tiene
  un solo «Guardar», y el índice dice dónde está lo que se va a guardar.

**Cómo se hace:** convertir el marco `393:12565` en componente del DS, con los estados de item del código:

- reposo;
- activo: fondo `--sc-bg-hover` y texto en semibold;
- con algo obligatorio sin rellenar: punto rojo;
- con cambios sin guardar: punto de marca.

La etiqueta, en `Body/body-regular`, y el rótulo opcional encima. El icono, a 20 mientras Figma no agrande el glifo
(ficha 7): 20 en Figma pinta lo mismo que los 14 de caja del código; con la ficha 7 hecha, baja a 14. Opcional: la ficha
de encima (avatar 36, nombre en `Body/body-semibold` y dato en `Caption/caption-regular`).

**Cómo sabes que está hecho:** la maqueta de Contact Center usa una instancia del componente en lugar del marco.

---

## 6 · La miga: un tramo que se puede pulsar se subraya al pasar el ratón (2026-09-14)

**Estado:** pendiente de bajarlo al fichero · **Verificado el 2026-09-14** contra el fichero del DS: página
`❖ Breadcrumb` (`6738:52933`), conjunto `breadcrumb-item` (`6115:29096`). Las dos variantes `Type=Label, Hover=True`
(`6115:29104` sin foco y `6115:29419` con foco) solo oscurecen el texto; ninguna lo subraya. El código ya subraya
(DD-103), y la manita y el subrayado van solo en los tramos con enlace.

**Qué cambia en Figma:**

- **`Type=Label, Hover=True`**, con y sin foco: el texto, subrayado. Grosor y posición, los de la fuente; el color no
  cambia respecto a lo que ya dibuja.
- **`Type=Icon, Hover=True`**: sin subrayado. Un icono subrayado no se lee, y el icono ya cambia de color.
- **El tramo actual** (el último, en color pleno y peso medio desde el 2026-08-31) **no se subraya nunca**: no se puede
  pulsar. Si el maestro `breadcrumb` (`185:6637`) usa una variante con hover para ese tramo, hay que quitársela.
- **La manita no se dibuja**, pero se anota en la descripción del componente: «los tramos que llevan a algún sitio
  muestran la mano; el tramo actual, no».

**Lo que dicen PrimeNG y las guías** (leídas el 2026-09-14):

- [primeng.dev/breadcrumb](https://primeng.dev/breadcrumb): la miga es un `nav` con nombre, los tramos van en una lista
  ordenada y los separadores se ocultan al lector de pantalla. Pide `aria-current="page"` en el último tramo, pero
  ⚠️ PrimeNG Angular no lo pone (medido el 2026-09-14); en código queda anotado en el wrapper. Su CSS no pide la
  manita: la pone nuestro tema.
- W3C, [patrón Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/): región de navegación con nombre, y
  `aria-current="page"` en el enlace de la página actual. Sin teclado propio.
- Nielsen Norman Group, [Breadcrumbs: 11 Design Guidelines](https://www.nngroup.com/articles/breadcrumbs/): la página
  actual va como último tramo, y ese tramo no es un enlace. Se distingue a la vista de los que sí lo son.
- `better-accessibility`: **un estado no se dice solo con color**. El subrayado es esa segunda pista: al pasar el
  ratón, el padre acaba en el mismo gris que el tramo actual.

**Cómo sabes que está hecho:**

- en `6115:29096`, las dos `Label, Hover=True` subrayadas, y las de icono sin subrayar;
- el maestro `185:6637`, sin subrayado en el último tramo;
- la descripción del componente, con la nota de la manita.

---

## 7 · Los iconos pintan un tercio más grande en código que en Figma (2026-09-14)

**Estado:** decidido el 2026-09-28: se agranda si el `IconSet` ata la caja · **Evidencia:** medido en código (DD-104); **mídelo antes** en el
fichero.

El código calibra el glifo de Material Symbols con `scale: calc(24 / 18)`. La caja del icono mide lo mismo, pero el
dibujo crece hasta ocuparla entera, como hacía PrimeIcons, de donde salen los tamaños del Kit. Un icono de 12 dentro de
un botón pinta ahora 12, no 9. En Figma el glifo sigue a su tamaño literal, así que **toda maqueta con iconos de
Material se ve más pequeña que la app**: botones de solo icono, lupa de los buscadores, índice de las fichas, barra
lateral y menús.

- **Qué mirar en el fichero:** si el `IconSet` y los maestros que lo usan atan el glifo al tamaño de su caja (ancho y
  alto atados a la variable de font-size, DD-24). Si es así, la vía más limpia es agrandar el glifo dentro de la caja un
  33 % (24/18) sin tocar la caja, que es lo que hace el código.
- **El índice lateral** (ficha 5) es una sola pieza desde DD-122, en cinco pantallas. En código lleva el icono a 14 de
  caja; en Figma, `IconSet` `393:12581` a 20, que pinta más o menos lo mismo. Con esta ficha hecha, ese 20 baja a 14.
- **Se queda fuera, a propósito:** la réplica `agent` no calibra (DD-35). Sus tamaños se midieron sobre el Comunicador
  en vivo.

**Cómo sabes que está hecho:** una captura del botón `sm` de solo icono en Figma y otra de `#/components/button` en
sc-docs, lado a lado, pintan la papelera del mismo tamaño.

---

## 8 · Grises intermedios: los textos y la opción no elegida, un paso más oscuros (2026-09-14)

**Estado:** **HECHO en el fichero el 2026-10-17** (las 8 filas); push y paso 6 el mismo día (export del 2026-10-17) · decidido el 2026-09-14
(DD-106) · **Evidencia:** verificado de punta a
punta en código, no en el fichero. Se simuló este cambio en `kit-export-dtcg.json`, `tokens:import` lo escribió y el
Supervisor pintó los grises nuevos (`theme-contrast`: 53 de 53). Las rutas de variable salen del export; el 2026-09-27
todas decían aún la columna «Hoy».

**Cómo se hace, sin crear variables ni tocar la paleta:** cada una pasa a apuntar a otro paso. Todo en modo claro; el
oscuro no se toca.

| Export | Variable | Hoy | Nuevo | Qué consigue |
|---|---|---|---|---|
| `aura/semantic/light` | `text/color` | `surface/700` | **`surface/900`** (DD-188) | texto principal 7,38 → 16,9:1; del secundario se separa 2,29:1 (con 800, 1,65) |
| `aura/semantic/light` | `form/field/color` | `surface/700` | **`surface/900`** (DD-188) | alimenta el mismo `--sc-text-primary`: se mueven juntas |
| `aura/semantic/light` | `text/muted/color` | `slate/600` | **`slate/700`** | texto secundario 4,52 → 7,38:1 |
| `aura/semantic/light` | `text/hover/color` | `surface/800` | **`surface/900`** (decidido) | con el texto ya en 900 (DD-188) no cambia de color al pasar el ratón: lo marca el fondo, como en GitHub |
| `aura/component/light` | `togglebutton/color` | `surface/500` | **`surface/700`** | opción no elegida de SelectButton 2,56 → 6,40:1 |
| `aura/component/light` | `togglebutton/hover/color` | `surface/700` | **`surface/900`** | que el ratón encima se siga notando |
| `aura/component/light` | `togglebutton/icon/color` | `surface/500` | **`surface/700`** | el icono, igual que su texto |
| `aura/component/light` | `togglebutton/icon/hover/color` | `surface/700` | **`surface/900`** | ídem |

El título de sección (`--sc-text-heading`, slate-800) mediría igual que el texto principal nuevo: sube a slate-900
(decidido), con su variable nueva `text/heading/color` (ficha 2).

**Lo que cierra el código cuando llegue el export** (paso 6):

- sacar `light:togglebutton.color` y `light:togglebutton.hover.color` de `EXCLUDE` (`scripts/cmp-color-map.mjs`).
  Mientras sigan ahí, el generador no escribe `--sc-cmp-togglebutton-color` y el cambio no llega;
- en `togglebutton.ts`, los 2 slots aún escritos a mano pasan a `var(--sc-cmp-togglebutton-*)`;
- `--sc-text-subtle` vive fuera de la zona generada: pasa a slate-700 a mano, con el secundario;
- en `e2e/supervisor/theme-contrast.spec.ts`, las dos excepciones del secundario en slate-600
  (`fg=rgb(111,119,132)`) dejan de aplicar y se borran.

**Cómo sabes que está hecho:** el PR del robot trae `--sc-text-primary: var(--sc-color-slate-800)` y
`--sc-text-secondary: var(--sc-color-slate-700)` en `02-semantic.css`. Tras el paso 6, `--sc-cmp-togglebutton-color:
var(--sc-color-slate-700)` en `04-component.css`.

---

## 9 · El Dashboard: lo que PrimeNG ya tiene y el fichero del DS aún no dibuja (2026-09-14)

**Estado:** pendiente · **Verificado el 2026-09-14** con el bridge contra el fichero del DS y PrimeOne 4.0.0, y en el
código de PrimeNG 22.1.0. Las variables, otra vez contra el export el 2026-09-27. Las piezas del Dashboard salen de los
componentes de [primeng.dev](https://primeng.dev) con los valores y las variables de Aura.

**Lo que ya está en Figma, atado a sus variables** (no hay que hacer nada; sirve para maquetar el Dashboard):

| Pieza del Dashboard | Componente de primeng.dev | En el fichero del DS |
|---|---|---|
| Pestañas de monitor | Tabs | `❖ Tabs` (`6738:49740`): `tabs` `320:12276`, `tabs-tab` `320:12255`, variables `tabs/*` |
| Número de la campana | Badge / OverlayBadge | `❖ Badge` (`6738:55106`): `badge` `330:13237`, `overlaybadge` `6998:92179` |
| Aviso en la cabecera del widget | Tag | `❖ Tag` (`6738:55116`): `tag` `373:13337`, con icono y `Rounded` |
| Barras de proporción | MeterGroup | `❖ MeterGroup` (`6738:55111`): `metergroup` `6962:59067`; alto `metergroup/meters/size` → `scale/0-5` (7) |
| Tarjeta de widget con acciones arriba | Panel con plantilla `icons` | `❖ Panel` (`6738:49736`): `panel` `229:10217`, variante `Custom Icon=True` |
| Lista de entidades con buscador | Listbox | `❖ Listbox` (`6738:22650`): `listbox` `6212:6733` con `Show Filter` |
| Lista del panel de alertas | Menu (popup) y Popover | `❖ Menu` (`6738:52936`), `❖ Popover` (`6738:50211`) |
| Selector de tipo de widget | SelectButton | `❖ SelectButton` (`6738:46433`); no hace rejilla con icono |

**Qué falta en Figma:**

- **Tabs, el peso del texto.** Las tres variantes de `tabs-tab` (`320:12255`) dibujan Inter **Bold 700** con el peso
  sin atar. La variable `tabs/tab/font/weight` existe y vale semibold (600), que es lo que dice Aura y lo que pinta el
  código. Atar el peso a la variable.
- **Tabs, los bordes (DD-107).** La marca de la activa ya es la barra: `tabs/active/bar/background` es el primario y la
  tira ya lleva su raya (`tabs/tablist/border/width` 1). Lo que cambia:
  - `tabs/tab/border/width`: de 1 a **0**;
  - `tabs/tab/border/color`, `tabs/tab/hover/border/color` y `tabs/tab/active/border/color`: a **transparente**;
  - `tabs/active/bar/bottom`: de −1 a **0**.

  Se ve igual.
- **Tabs, las flechas de desbordamiento** (`scrollable` en primeng.dev). Las variables existen (`tabs/nav/button/*`:
  fondo, color, ancho `scale/2-5` = 35, hover, foco), pero no hay dibujo, ni en el DS ni en PrimeOne. En código salen
  cuando las pestañas no caben. Dibujar el botón de cada lado sobre `tabs`.
- **Badge, el punto.** En primeng.dev, un Badge sin valor es un punto (`p-badge-dot`): cubre el punto de presencia y
  el de «en vivo» del Dashboard. La variable `badge/dot/size` existe (`scale/0-5`, 7), pero `badge` no tiene variante de
  punto, ni aquí ni en PrimeOne. Añadir `Dot=True` con cada `Severity`.
- **El hueco discontinuo de «Añadir widget».** No hay nada equivalente en PrimeNG, PrimeOne ni el DS, y en el
  Supervisor hay 5 cajas discontinuas hechas a mano con bordes y radios distintos. Es pieza propia: diseñarla en
  `Custom` (`12508:5736`) con un borde, un radio y los dos botones (`Añadir widget` outlined, `Dividir en cuatro` text).
- **Fuera, a propósito:** la sparkline del KPI. primeng.dev la resolvería con Chart (Chart.js), que no está en PrimeOne.

**Cómo sabes que está hecho:**

- en `❖ Tabs`: las tres variantes con el peso atado a `tabs/tab/font/weight`, y un `tabs` con flechas;
- en `❖ Badge`: una variante de punto atada a `badge/dot/size`;
- en `Custom`: el hueco de «Añadir widget».

---

## 10 · Dos buscadores que no se parecen: decisión de Figma, no de código (2026-09-14)

**Estado:** pendiente de decidir (decisión 5) · **Evidencia:** medido en la barra de Conversaciones del Supervisor, en
local, con capturas a 3x.

En la misma barra conviven dos buscadores del DS que se leen como piezas distintas. Se probó a igualarlos en código y
**se revirtió**: el aspecto de un componente del catálogo solo cambia cuando lo dice Figma (`.impeccable.md`, «Alcance
de pulir»).

- **La lupa de `sc-search` es más gruesa que sus vecinos.** Es el glifo `search` de Material Symbols; al lado, la
  flecha del desplegable y el calendario son los SVG finos de PrimeNG. ¿La lupa sigue el trazo de los iconos de campo
  o el de Material?
- **La lupa del buscador de dentro de un panel va a la derecha** (`p-select` y `p-multiselect`, como PrimeNG), y la de
  `sc-search`, a la izquierda. ¿En qué lado va en los dos? Si es el mismo, cambiarlo en código cuesta cinco clases
  `.p-*` en el preset (medido).

El texto de la opción no elegida de SelectButton, que esta ficha también citaba, es la ficha 8.

---

## 11 · Panel en aviso: la variante `Severity` que el código ya tiene (2026-09-14)

**Estado:** pendiente · **Verificado el 2026-09-14** con el bridge: `❖ Panel` (`6738:49736`), conjunto `panel`
(`229:10217`), no tiene variante de aviso; PrimeOne 4.0.0 tampoco.

Desde DD-109, `<sc-panel severity="warn|danger">` pinta el borde del panel en `--sc-border-warning` o
`--sc-border-danger` y un anillo exterior de 1 del mismo color (sombra, no borde: el panel no cambia de tamaño). Es
para las tarjetas de widget del Dashboard en alerta.

**Cómo se hace:** en `panel` (`229:10217`), propiedad `Severity` con `None | Warn | Danger`. En `Warn` y `Danger`, el
trazo del panel y una sombra exterior sin desenfoque, de extensión 1, del mismo color. Nada más cambia: cabecera,
rellenos y radio siguen atados a `panel/*`.

⚠️ **`border/warning` y `border/danger` no existen en el Kit** (no están en el export). En código son `yellow-500` y
`red-600`, iguales en claro y en oscuro. Ata el trazo y la sombra a esas dos primitivas (`yellow/500` y `red/600`): no
hace falta crear variables.

**Cómo sabes que está hecho:** una captura de `panel` con `Severity=Warn` y `Severity=Danger`, al lado de
`#/components/panel` → «Con aviso» en sc-docs.

---

## 12 · Los botones rojos en claro, un paso más oscuros por contraste (2026-09-15)

**Estado:** **HECHO en el fichero el 2026-10-17** (las 8 variables); push y paso 6 el mismo día (export del 2026-10-17) · **Evidencia:** export
de `main` (comprobado el 2026-09-27) y el guard
`tokens:cmp-rewire`.

- **El sólido.** El Kit pinta el botón `danger` en `red/500` con texto blanco: **3,76:1**, no llega a AA. El código usa
  un paso más (`red/600`, 4,83:1; ratón encima `red/700`, pulsado `red/800`) y lo declara en `EXCLUDE`
  (`scripts/cmp-color-map.mjs`), así que el generador no emite esos seis `--sc-cmp-button-danger-*`.
- **El de texto** («Eliminar» en la cabecera de las fichas). `button/text/danger/color` es `red/500` sobre blanco:
  **3,76:1**. Desde DD-128 (2026-09-28), el código ya pinta `red/600` con una divergencia declarada
  (`light:button.text.danger.color` en `EXCLUDE`). Con el Kit en `red/600`, esa fila sobra.
- **El contorneado** (`button/outlined/danger/color`, `red/500`) es el mismo caso. No se ha medido que la app lo use.
  Decidido el 2026-09-28: sube con el de texto.

**Cómo se hace, en `aura/component/light`:**

| Variable | Hoy | Nuevo |
|---|---|---|
| `button/danger/background` y `button/danger/border/color` | `red/500` | **`red/600`** |
| `button/danger/hover/background` y `button/danger/hover/border/color` | `red/600` | **`red/700`** |
| `button/danger/active/background` y `button/danger/active/border/color` | `red/700` | **`red/800`** |
| `button/text/danger/color` | `red/500` | **`red/600`** |
| `button/outlined/danger/color` (decidido el 2026-09-28) | `red/500` | **`red/600`** |

`hover/color` y `active/color` (el blanco del texto) **no cambian**: solo el fondo y el borde.

**Cómo sabes que está hecho:** tras el push, se quitan las seis filas de `EXCLUDE`, el preset lee
`var(--sc-cmp-button-danger-*)` y `tokens:cmp-rewire` sigue en verde. Sale también la fila de
`light:button.text.danger.color` (DD-128), en el paso 6.

---

## 13 · El botón se encoge al pulsarlo: la interacción que el código ya tiene (2026-09-15)

**Estado:** pendiente · **Mídelo antes:** no se ha abierto `❖ Button` para ver si tiene estado pulsado ni
interacciones de prototipo.

Desde DD-113, al pulsar un botón (cualquier `.p-button`, no solo `sc-button`) se encoge al **96 %** con una transición de
**150 ms ease-out**, y al soltar vuelve igual de suave. El cambio de color del estado pulsado viaja con la misma
transición. Se eligió entre seis probadas en un playground (`customs-catalog.md` §8.1). primeng.dev no se mueve: es un
desvío a propósito, y un prototipo de Figma que no lo lleve enseña otro botón.

**Cómo se hace:** en el conjunto del botón, una interacción *While pressing* → *Change to* su variante pulsada (o
`Active`), con *Smart animate*, *Ease out* y **150 ms**. Esa variante, al 96 % del tamaño de la de reposo y centrada,
con el color pulsado que ya tenga. Si el conjunto no tiene variante pulsada, crearla es parte de la ficha.

**Cómo sabes que está hecho:** en modo prototipo, mantener pulsado un botón lo encoge y soltarlo lo devuelve, a la par
que la historia «Al pulsar» de `#/components/button` en sc-docs.

---

## 14 · La etiqueta «Draft» (secundaria) no llega al contraste (2026-09-24)

**Estado:** **HECHO en el fichero el 2026-10-17**, con su push · **Dónde:** variable `tag/secondary/color` de
`aura/component/light`: era `surface/600`, pasa a
**`surface/700`** · **Esfuerzo:** un cambio de alias · **Evidencia:** medido en el navegador y en el código generado;
el alias, en el export del 2026-09-27.

- **Medido:** el texto de `<p-tag severity="secondary">` sale en `#6f7784` (slate-600) sobre `#eceff3` (slate-100):
  **3,92:1**, por debajo del 4,5 que pide un texto de 12 px. En Aura (primeng.dev/tag, la «Draft») es `#475569`
  sobre `#f1f5f9`: 6,92:1. Nuestro slate-600 es más claro que el de Aura.
- **Con slate-700 (`#4f5663`): 6,40:1.** Y rima: el resto de etiquetas ya apuntan a su 700 sobre su 100 (verde, cielo,
  amarillo, rojo); la secundaria es la única en 600.
- **Alcance:** todas las etiquetas secundarias de la plataforma («Desconectado» en Agentes, la columna Tipo, lo que use
  `severity="secondary"`). En código llega sola: `--sc-cmp-tag-secondary-color` vive en la zona generada y `EXCLUDE`
  solo la tiene en oscuro.

**Cómo sabes que está hecho:** tras el push, `--sc-cmp-tag-secondary-color` dice `var(--sc-color-slate-700)` y la
etiqueta «Desconectado» de `/admin/agentes` mide 6,40:1.

---

## 15 · La escalera de agrupación manda sobre la maqueta: filas de formulario a 14 (2026-09-27)

**Estado:** pendiente · **Dónde:** las maquetas de formulario de Grupos y Servicio del fichero del Supervisor, y las que
copien su fila · **Evidencia:** los nodos son los que cita el código; el código, comprobado el 2026-09-27.

- **Filas de formulario de dos columnas:** `row` 2286:5408 y `container` 2286:5407 (Grupos), 2286:5581 y 2286:5558
  (Servicio) separan las filas **12,25** (`scale/0-875`). Pasan a **14** (`scale/1`), el doble de los 7 de la etiqueta a
  su control. Con 12,25, un campo quedaba a 1,75× de su vecino y su etiqueta se leía a medio camino entre los dos
  (DD-123). Entre columnas no cambia: 24,5 (`scale/1-75`).
- **Radios en fila:** `container radio buttons` 2286:5583 pone **12 suelto** entre radios; pasa a 14 (`scale/1`).
- **El botón que envía un formulario** va a 28 (`scale/2`) del último campo, no a la distancia que hay entre campos: el
  acceso del Supervisor y el panel «Nueva label».
- **Para lo que venga:** la escalera es 7 · 14 · 28 (etiqueta y control · entre hermanos · entre grupos). Un valor
  intermedio en una maqueta nueva (12,25 o 24,5) se lee como deriva, no como decisión.

**Cómo sabes que está hecho:** las maquetas de Grupos y Servicio miden 14 entre filas y entre radios.

---

## 16 · La caja de sección, 17,5 arriba y abajo en las dos pieles (2026-09-27)

**Estado:** `Section` **HECHO el 2026-10-17** (`12610:23284`: arriba y abajo atados a `scale/1-25` en las cuatro
variantes); el `Block`, pendiente (paso 5) · **Dónde:** el maestro `Section` del DS (relleno vertical atado a `scale/1-625`) y el
`Block` del Supervisor (393:12587, atado a `scale/1-75`) · **Esfuerzo:** revincular el relleno de arriba y de abajo de
los dos a **`scale/1-25`** · **Evidencia:** los nodos y sus variables son los que cita
`sc-section-card.component.scss`; el código, comprobado el 2026-09-27.

- **Por qué** (DD-125): el relleno vertical no separaba nada; la caja ya la delimitan su borde y su fondo. En código,
  17,5 arriba y abajo en las dos pieles. Los lados (16 la gris, 24,5 la blanca) y el aire del título a su contenido
  (14 y 16) no cambian.
- **Plegada**, la cabecera mide 17,5 arriba y abajo.

**Cómo sabes que está hecho:** `Section` y `Block` miden 17,5 arriba y abajo.

---

## 17 · El diálogo con formulario: la botonera a 28 del último campo, 14 entre campos y 10,5 entre botones (2026-09-27)

**Estado:** pendiente · marco a 15,75, decidido el 2026-09-28 · **Dónde:** el maestro del diálogo del DS y las maquetas que lo
usan con un formulario («Nueva entidad», «Nueva categoría», «Duplicar grupo») · **Evidencia:** export del 2026-09-27 y
código; **mídelo antes** en el maestro: el código no cita su nodo.

**Lo que dice cada lado:**

- **El Kit**, como Aura, ata todo el relleno del diálogo a `overlay/modal/padding` = `scale/1-125` (**15,75**):
  cabecera, cuerpo y pie. El pie empieza en 0 (`dialog/footer/padding/top`). El hueco entre botones,
  `dialog/footer/gap`, es `scale/0-375` (5,25).
- **El código**:
  - el `p-dialog` nativo sigue al Kit;
  - `sc-dialog` pinta su propio marco a **17,5** (`--sc-dialog-padding`), sin fila de divergencia;
  - con cuerpo, su pie gana 10,5 arriba: 17,5 + 10,5 = **28** del último campo (DD-123);
  - entre campos del cuerpo, 14;
  - entre botones, **10,5**: una divergencia anotada en el código («con botones pequeños, 7 se leía apelotonado;
    propagar a Figma»). Su comentario dice que el Kit pone 7, pero el export dice 5,25.

**Cómo se hace** (marco a 15,75, decidido):

- **En la variante con cuerpo**, el relleno superior del pie atado a **`scale/0-875`** (12,25): 15,75 + 12,25 = 28. Átalo
  en la capa, no cambies `dialog/footer/padding/top`: esa variable sigue en 0 para las confirmaciones.
- **Entre campos del cuerpo, 14** (`scale/1`).
- **Entre botones, `dialog/footer/gap` → `scale/0-75`** (10,5).
- **Sin cuerpo** (una confirmación: título, texto y botones), nada más cambia: no hay campo con el que confundir la
  botonera.
- En código (paso 6), `sc-dialog` pasa a 15,75 y su pie con cuerpo a 12,25. Con la otra respuesta (17,5),
  `overlay/modal/padding` pasa a `scale/1-25`, lo que mueve también el drawer y las confirmaciones, y el pie con
  cuerpo a `scale/0-75`.

**Cómo sabes que está hecho:** el diálogo con formulario mide 28 del último campo a la botonera, 14 entre campos y
10,5 entre botones.

---

## 18 · El widget del resumen de las fichas: cifra, «/total» y anillo (2026-09-27)

**Estado:** pendiente · **Dónde:** las maquetas de las fichas de grupo, agente y usuario (el resumen de la derecha) del
fichero del Supervisor y, si se quiere reutilizable, un componente nuevo allí · **Esfuerzo:** una pieza con dos
variantes, con anillo y sin él · **Evidencia:** el código; ningún nodo, porque el resumen nació en código (DD-121) y el
Kit no lo dibuja.

- **Por qué** (DD-126): cada proporción del resumen es un widget, como el ejemplo «Preview» de ProgressSpinner en
  primeng.dev.
- **La tarjeta:** en `--sc-bg-primary-subtle` (en el Kit, `highlight/background` = `primary/50`), sin borde a la vista,
  con relleno `scale/0-75` y radio `border/radius/xl`.
- **Por dentro, de arriba abajo:**
  - el rótulo, con su icono a 5,25, en caption regular;
  - a 7, la cifra (h1 semibold; h2 en el grupo), con «/total» a 1,75 (h3 regular; body en el grupo);
  - a la derecha de la cifra, a 10,5, el anillo: de 42, trazo 10, el arco en `--sc-bg-accent` y sin el «N%».

  Todo el texto en `--sc-text-primary`: el secundario no llega a AA sobre el tinte.
- **La nota** va debajo de la cifra. Sale en el agente sin grupos, que tampoco lleva anillo, y en el grupo, con anillo.
- **En el grupo**, los canales cuelgan debajo, a 28.

**Cómo sabes que está hecho:** las tres fichas de Figma enseñan el resumen con esta pieza, y
`summary-kpi.component.ts` puede citar su nodo.

---

## 19 · Cuatro grises del Kit bajo AA que el código ya sube (2026-07 a 2026-09)

**Estado:** **HECHO en el fichero el 2026-10-17** (las 4); push y paso 6 el mismo día (export del 2026-10-17) · **Evidencia:** export del
2026-09-27 y las divergencias declaradas en `scripts/color-map.mjs` y
`scripts/cmp-color-map.mjs` (DD-87, DD-111). Cada fila dice «revertir cuando el Kit suba el suyo». El código pinta los
cuatro en slate-600 (4,52:1 sobre blanco).

| Export | Variable | Hoy | Nuevo | Contraste hoy | Dónde se ve |
|---|---|---|---|---|---|
| `aura/component/light` | `button/outlined/secondary/color` | `surface/500` | **`surface/600`** | 2,95:1 | «Añadir» de AED |
| `aura/semantic/light` | `form/field/icon/color` | `surface/400` | **`surface/600`** | 2,04:1 (un icono pide 3:1) | iconos dentro de los campos |
| `aura/semantic/light` | `navigation/item/icon/color` | `surface/400` | **`surface/600`** | 2,04:1 | iconos de menús |
| `aura/semantic/light` | `form/field/placeholder/color` | `surface/500` | **`surface/600`** | 2,95:1 | texto de ayuda de los campos |

**Cómo sabes que está hecho:** tras el push y el paso 6, las cuatro filas salen de `EXCLUDE` y de las divergencias de
`color-map.mjs`, y `tokens:parity` sigue en verde.

**El marcador, un paso más (2026-10-17):** en código lo pinta `--sc-text-subtle`, que ese día sube a slate-700 con el
secundario (DD-106). Para que Figma y código digan lo mismo, `form/field/placeholder/color` pasó también a
`surface/700` en el fichero, después del push. **Llegó con el tercer envío del mismo día** (`8f030ffb`): su fila pasa a
`enforce` contra `--sc-text-subtle`, que en claro escribe ya el generador. El robot no abrió PR porque un run cancelado
borró el envío (ver «Herramientas»); entró a mano, con el arreglo del robot.

---

## 20 · La barra lateral del Supervisor (SISMAC-4340): lo que Figma dibuja distinto (2026-09-15)

**Estado:** pendiente · **Dónde:** fichero del DS, página Testing: sección `SISMAC-4340 Sidebar` (`14855:1269`), tablero
`14912-6324`, versiones anteriores en `14930-1011` · **Evidencia:** DD-112 y DD-118, y el hand-off
`supervisor-sidebar.md`; **mídelo antes** en el fichero.

- **El fondo del item seleccionado:** 15 % en código, 12 % en Figma. Decidido el 2026-09-28: 15 %, Figma se alinea.
- **Nodo IA:** en código, el icono `neurology`; en Figma, el componente `brain` de la librería antigua, que la fuente
  de iconos no trae. Cambiarlo cuando `neurology` esté publicado (ficha 21).
- **El drawer en oscuro:** en Figma va atado a `primary/color`, y en oscuro queda azul claro con el texto blanco a
  **2,15:1**. En código, el fondo de la barra en oscuro es la superficie (`--sc-bg-surface`). Atarlo a la superficie del
  modo oscuro.
- **El comportamiento:** el tablero `14912-6324` dibuja «no se cierra nada», y producción lleva «abrir una categoría no
  cierra las demás» (DD-118). Rotular el tablero con lo que hay en producción, o dibujarlo.
- Del frente de la barra, no de aquí: plegada, ¿fondo de grupo solo en desplegado, o solo en el primer nivel?

---

## 21 · Iconos huérfanos: publicar Smart-Contact-Icons y pasar el script (2026-09-20)

**Estado:** pendiente, tres pasos de persona y un script · **Evidencia:** hand-off `supervisor-fichas.md`; el script y
su `LEEME.md` viven fuera del repo, en `~/Documents/Claude/2026-09 iconos-material/huerfanos/`.

1. Publicar **Smart-Contact-Icons** desmarcando los 21 sets `Icon…` de Playground, que son de otra sesión.
2. Aceptar la actualización en el fichero del DS.
3. Arrastrar `dashboard` y `neurology` a Playground.
4. Pasar el script según su `LEEME.md`: 13 `dashboard`, 8 `brain` → `neurology`, y `query_stats` y `graph_5` a 14 × 14.
   Se para solo si la actualización del paso 2 no está aceptada.

---

## 22 · Números sueltos en las maquetas que el código redondeó a la escala

**Estado:** pendiente, de poco esfuerzo · **Evidencia:** los comentarios del código que citan cada nodo. Es la «lista de
discrepancias del Figma» que prometía `sc-section-card.component.scss`: en la maqueta el número está suelto (sin
variable) y el código usa el peldaño que le toca.

| Dónde | Figma | Código | Atarlo a |
|---|---|---|---|
| Cabecera de `Section` y `Block`: del icono al título | 8 suelto | 8,75 | `scale/0-625` |
| Frase con hueco de AED («Máximo de conversaciones en cola [ 9 ]»): 2286:5411, 2286:5417, 2286:5402 y, en Servicio, 2286:5624 | 12 suelto | 12,25 | `scale/0-875` |
| `container tags` de Servicio, entre pastillas | 12 suelto | 12,25 | `scale/0-875` |
| El número de Servicio (`inputnumber`) | 71 de ancho | 70 | `scale/5` |
| El héroe del impacto en el constructor de reglas (51:10316) | 40 | 32 | el techo de la rampa: 40 pediría un estilo nuevo |
| Las filas del impacto, debajo de la intro | 13 | 12 | el peldaño de abajo, para que sigan por debajo de la intro (14) |

El constructor de reglas es de otro fichero («Reglas de transcripción», `vIhCh2rkAahLU8NwQD0GLG` según la historia de
git): **mídelo antes**.

---

## 23 · La presencia en Contact Center y en «Editar agente» (2026-09-13)

**Estado:** pendiente · **Evidencia:** DD-78, «Consecuencias»; sin verificar desde entonces.

La página Contact Center y el marco «Editar agente» del fichero del Supervisor dibujan la presencia con tags
redondeados. En código es un desplegable con un punto de color. Cambiar el dibujo por el del código.

---

## 24 · Los cabos de Figma de DD-24: icono y tamaño de letra, y tres textos (2026-06-22)

**Estado:** pendiente · **Evidencia:** `docs/ROADMAP.md`, «Round-trip DD-24»; no re-medido desde junio, **mídelo
antes**.

- **Atar el ancho y el alto de los iconos que acompañan a un texto a la variable de font-size**: en md, `app/font/size`;
  en sm y lg, `{componente}/sm|lg/font`. Quedaban dos huecos: el icono de `button-default`, suelto (va a
  `app/font/size`), y el texto de `inputtext`, suelto (va al font-size del campo).
- **Tres textos de General en los nodos de Figma:** el título de la ventana y el del aviso, «Recepción de
  conversaciones», y la etiqueta de alerta, «Mostrar». Ya están así en `es.json`; busca antes en el fichero para no
  crear otra versión.

---

## 25 · Aparcado: el botón de solo icono no es cuadrado, y la hora del datepicker (2026-09-14)

**Estado:** aparcado, sin lado decidido · **Evidencia:** DD-91, «Consecuencias».

- El botón de solo icono mide 31,5 × 32,5. El ancho es `button/icon/only/width` = `scale/2-25`, y el alto sale del
  interlineado atado. Un píxel no se ve; si se decide cuadrarlo, el alto sale de la misma variable.
- La hora del datepicker va a 17,5 en Figma y a 14 en código.

---

## 26 · Aparcado: borrar la colección «App» (2026-09-14)

**Estado:** opcional · **Evidencia:** DD-92.

«App» se quedó como alias de Custom: el DS ya no la usa y no puede desviarse. Borrarla exige publicar la librería,
actualizar el fichero del Supervisor y revincular sus 939 enlaces a «App» dentro de instancias. El alias ya consigue lo
que importaba.

---

## 27 · Tokenizar los text styles: la raíz común de cuatro fallos (2026-08-07)

**Estado:** pendiente, sin prisa · **Evidencia:** `docs/ROADMAP.md`, «Tokenizar los text styles del Figma»
(SISMAC-4074); entregable en la página `Feedback`, sección `14015-179`. **No re-medido desde el 2026-08-07:** es una
pista, no un estado.

Select, MultiSelect, Chip y Toast fallaban en la validación web ↔ Figma por lo mismo: los estilos de texto de Figma no
exportan su tamaño y su interlineado como variables. Antes de actuar, iguala el estado de cada componente: varias
diferencias de entonces eran el mismo componente en otro estado.

---

## 28 · Menores

- **`font-family-mono`** no existe en Figma (`customs-catalog.md`). Ojo: el código pone `'JetBrains Mono'` delante de la
  pila del sistema (`01-primitive.css`), y el catálogo decía «Opción A: pila del sistema, sin fuente propia». Aclarar
  cuál es la buena antes de crear la variable.
- **`--sc-bg-canvas`**, el lienzo de página, no tiene variable en Figma (`customs-catalog.md`). Un solo consumidor hoy.
- **`azure`** vive a mano en `01-primitive.css`: no tiene familia en el Kit (DD-83).
- **Code Connect:** el maestro `card` necesita la propiedad booleana «Show Icon» para que `figma:connect:publish` pase
  (`docs/code-connect.md`).

---

## 29 · El pase de diseño de las fichas: icono a 600 junto a semibold, altas con «Crear …» y saltos por canal (2026-09-27)

**Estado:** pendiente · **Dónde:** Figma, el maestro `Section` del DS (el icono de su título), el índice lateral (la
fila activa) y las maquetas de las fichas de grupo, agente y usuario · **Esfuerzo:** revincular el peso de dos iconos
y retocar tres maquetas · **Sin verificar** contra el fichero: el código no cita los nodos.

- **Por qué** (DD-130): un icono junto a un texto lleva su peso óptico. En la app, los avisos en semibold ya llevan el
  icono a 600 (`sc-icon [weight]="600"`). En el código del DS también, desde el 2026-10-05: el icono del título de
  cada sección (`sc-section-card`) y de cada subsección (`sc-subsection`), y el de la fila activa del índice
  (`sc-form-section-nav`), a 600; las demás filas del índice, a 400, como sus rótulos. En el Kit siguen a 400.
- **Las altas:** agente y usuario enseñan su cabecera al crear («Nuevo agente» hasta que se escribe el nombre), y el
  botón principal dice «Crear agente» / «Crear usuario», como «Crear grupo».
- **Distribución y colas:** una línea «Ir a: Teléfono · Chat · Email» arriba de la sección, con dos o más canales.

**Cómo sabes que está hecho:** el icono del título de sección y el de la fila activa del índice van a 600 en el Kit, y
las maquetas de las fichas enseñan las altas y los saltos como el código.

---

## 30 · Contact Center › Grupos y › Agentes hablan como sus fichas, y guardan (2026-09-29)

**Estado:** pendiente · **Dónde:** Figma, las maquetas `1:12676` (Contact Center · Grupos) y `393:12562` (Contact
Center · Agentes) del fichero del Supervisor · **Esfuerzo:** redibujar el contenido de dos tarjetas con piezas que ya
existen en las fichas · **Sin verificar** contra el fichero: se da por hecho que las maquetas siguen dibujando la
réplica que el código acaba de quitar.

- **Por qué** (DD-135): con esas dos páginas se fija con qué nace un grupo o un agente, así que dicen lo mismo que sus
  fichas. Salen las multiselecciones de estrategia, prioridad y voz (códecs), el tipo de cola FIFO/LIFO, la fila
  «Llamadas internas», la columna «Permisos» y el título de la URL.
- **Grupos:** la lista de ajustes con los bloques de la ficha de grupo (General, reglas comunes, Teléfono, Chat, Ficha
  de cliente), cada fila con su ayuda bajo el nombre, y la ayuda de la tarjeta bajo el título («Con esto nace cada
  grupo nuevo…»).
- **Agentes:** la matriz de la ficha de agente (Fijos, Móviles, Internacionales y Numeración especial × Llamadas y
  Transferencias, con casilla de columna), Configuración con sus dos interruptores y su ayuda, e Integración con la URL
  del iframe y Dispositivos externos.

**Cómo sabes que está hecho:** las dos maquetas enseñan lo que la app en `/config/aed/grupos` y `/config/aed/agentes`.

---

## 31 · Las altas dicen lo que falta, hasta «Listo para crear» (2026-09-29)

**Estado:** pendiente · **Dónde:** Figma, las maquetas de las altas de grupo, agente y usuario (el resumen de la
derecha) · **Esfuerzo:** una línea de texto con icono, en dos estados · **Sin verificar** contra el fichero: el código
no cita los nodos.

- **Por qué** (DD-136): el resumen de cada alta dice lo que le falta y, cuando se puede crear, lo confirma.
- **Qué dibujar:** bajo el título «Resumen», una línea en caption semibold con su icono a 600: «Falta: nombre ·
  extensión» en el ámbar de los avisos, con `error`; y «Listo para crear» en el verde de éxito, con `check_circle`.
  Sin porcentaje ni barra.

**Cómo sabes que está hecho:** las tres altas del fichero enseñan los dos estados como el código.

---

## 32 · Las altas, con el índice de la edición: el ✓ y «Atrás / Siguiente» (2026-10-01)

**Estado:** pendiente · **Dónde:** Figma, las maquetas de las altas de grupo, agente y usuario, y el índice
(`393:12565`, el `sc-form-section-nav` de la maqueta) · **Esfuerzo:** una marca nueva en el índice y un pie por alta,
sin piezas nuevas · **Sin verificar** contra el fichero: el código no cita los nodos de las altas.

- **Por qué** (DD-143, que revierte los pasos de DD-138): el alta tiene la maqueta de la edición, con el índice.
- **Qué dibujar:**
  - en el índice, el ✓ (`check_circle`, en el verde de éxito, con el peso de la etiqueta) detrás de la etiqueta de la
    sección que se dejó completa, en el sitio del punto; la que se dejó sin lo obligatorio, con el punto rojo;
  - la sección abierta, en su caja con su cabecera, como al editar;
  - al pie, fuera de la caja, «Atrás» a la izquierda y «Siguiente» a la derecha, botones pequeños secundarios con
    contorno, a 28 de la caja; la primera sección, solo «Siguiente», y la última, solo «Atrás».
- «Crear …» sigue arriba, en la barra.

**Cómo sabes que está hecho:** las tres altas del fichero enseñan el índice, el ✓ y el pie como
`/admin/grupos/crear`, `/admin/agentes/crear` y `/admin/usuarios/crear`.

---

## 33 · La ficha de grupo con las palabras de la revisión de producto (2026-10-01)

**Estado:** pendiente · **Dónde:** Figma, las maquetas de la ficha de grupo (Distribución y colas, Recursos) y
`1:12676` (Contact Center · Grupos) del fichero del Supervisor · **Esfuerzo:** textos y una fila menos, sin piezas
nuevas · **Sin verificar** contra el fichero: el código no cita los nodos de la ficha.

- **Por qué** (DD-141): la revisión de producto del 2026-10-01 cambia palabras y quita un campo.
- **Qué cambiar:**
  - las estrategias: «Menos conversaciones atendidas» (Teléfono y «Dentro de cada nivel») y «Menos conversaciones
    activas» (Chat), en los desplegables y en el listado de grupos;
  - fuera la fila «Desbordar sesión» de las reglas comunes, en la ficha y en Contact Center;
  - la ayuda de Prioridad: «La prioridad con que entran sus llamadas. Solo cuenta en las entrantes.»;
  - la ayuda del tamaño de cola, una por modo: «Como mucho 50 conversaciones esperando en total, haya los agentes que
    haya» (Fijo) y «Varía con los agentes conectados: 50 conversaciones en cola por cada uno» (por agente conectado);
  - los minutos de «Cerrar chat por inactividad», 5;
  - la tipificación, por su categoría: «Consulta», sin «(3)»;
  - en Contact Center, los desplegables a 350 (`scale/25`).

**Cómo sabes que está hecho:** las maquetas dicen lo mismo que `/admin/grupos/editar/11?seccion=distribucion` y
`/config/aed/grupos`, y ninguna dice «Desbordar sesión».

---

## 34 · El teléfono saliente, obligatorio y de una lista; «Caducar sesión», y Recursos sin Etiquetas (2026-10-01)

**Estado:** pendiente · **Dónde:** Figma, las maquetas de la ficha de grupo (Distribución y colas, Recursos), del
diálogo de duplicar y `1:12676` (Contact Center · Grupos) del fichero del Supervisor · **Esfuerzo:** un campo en dos
estados, textos y un campo menos · **Sin verificar** contra el fichero: el código no cita los nodos de la ficha.

- **Por qué** (DD-142): la segunda revisión con el equipo fija el teléfono saliente como obligatorio con Teléfono, y
  de los números asignados.
- **Qué cambiar:**
  - «Teléfono saliente *», un desplegable cerrado, sin escritura, con el marcador «Elige un número» y la ayuda «El número
    que ven los clientes cuando un agente del grupo llama.»; y su estado de error: «El teléfono saliente es
    obligatorio», con el punto en «Distribución y colas» del índice;
  - lo mismo en el diálogo de duplicar, cuyo subtítulo dice «El teléfono saliente, no.»;
  - «Caducar sesión» en vez de «Cerrar chat por inactividad», en la ficha y en Contact Center;
  - la ayuda de «Balanceada»: «Reparte las conversaciones de forma equilibrada entre los agentes.»;
  - Recursos sin el campo Etiquetas.

**Cómo sabes que está hecho:** las maquetas dicen lo mismo que `/admin/grupos/editar/1?seccion=distribucion`, el
diálogo de duplicar de un grupo con Teléfono y `/config/aed/grupos`.

---

## 35 · Las fichas en tres columnas: el nombre encima del índice y el resumen sin rótulo (2026-10-01, DD-170 el 2026-10-05)

**Estado:** pendiente en agente y usuario; la de grupo ya está dibujada (fichero «Landing page»,
`cLO8JZfPuC3EMx6EgCjmsU`, nodo 2467:7078) · **Dónde:** Figma, las maquetas de las fichas de agente y usuario, al crear
y al editar · **Esfuerzo:** recolocar la cabecera y «Eliminar», y quitar un rótulo, sin piezas nuevas.

- **Por qué** (DD-144 y DD-170): tres columnas sin fila de cabecera, que arrancan a la misma altura.
- **Qué cambiar,** como en el nodo 2467:7078:
  - el nombre de la ficha y su línea, arriba de la columna del índice (196), a 14 del índice;
  - la sección, arriba de la columna del centro, que es la que crece (Fill de ancho, Hug de alto);
  - el resumen, sin su rótulo «Resumen», arriba de su columna (240);
  - «Eliminar», bajo el índice, a 28 de su última fila;
  - por debajo de 1340, el nombre sigue encima del índice y el resumen pasa a una franja encima de la sección.

**Cómo sabes que está hecho:** las maquetas se ven como `/admin/grupos/editar/11`, `/admin/agentes/editar/1` y
`/admin/usuarios/crear` a 1440.

---

## 36 · El nombre de la ficha, fijo arriba al bajar (2026-10-01)

**Estado:** retirada el 2026-10-05 (DD-170): el nombre vive en la columna del índice, que ya se queda fija al bajar.
No hay estado «al bajar» que dibujar.

---

## 36b · El color de etiqueta marrón (2026-10-05, DD-176)

**Estado:** pendiente · **Dónde:** Figma, la librería del DS, las variantes de color de `tag`/`chip` en `label` y la
paleta de puntos · **Esfuerzo:** una variante más, con variables que ya existen.

- **Por qué** (DD-176 §8): el estado Administrativo va en marrón, y la paleta del Kit no trae familia marrón.
- **Qué añadir:** el color `brown`, lleno: fondo `amber-800` y texto blanco; en oscuro, `amber-900` con `amber-100`. Va
  detrás de `amber` en el orden de la paleta.

**Cómo sabes que está hecho:** la etiqueta «Marrón» de sc-docs (`/components/tag`) y la de Figma dicen lo mismo.

---

## 37 · El resumen de la ficha de grupo lleva a su sección (2026-10-02)

**Estado:** pendiente · **Dónde:** Figma, el resumen de la ficha de grupo · **Esfuerzo:** un estado al pasar el ratón,
sin piezas nuevas · **Sin verificar** contra el fichero: el código no cita los nodos de las fichas.

- **Por qué** (DD-146): lo que dice el resumen se arregla en una sección, y desde él se llega a ella.
- **Qué dibujar:**
  - los rótulos (Agentes activos, Reparto, Salida, Recursos) y las claves de las filas (Teléfono, Chat, WhatsApp),
    al pasar el ratón: subrayados, en el mismo color de texto;
  - el foco: el anillo del sistema alrededor del enlace;
  - la tarjeta, igual: no cambia al pasar.

**Cómo sabes que está hecho:** se ve como `/admin/grupos/editar/11` a 1440, con el ratón sobre «Reparto».

---

## 38 · Title y Subtitle: los dos estilos nuevos, el maestro `Section` y la etiqueta a 600 (2026-10-09, DD-188)

**Estado:** los estilos, HECHOS; lo demás, pendiente · **Dónde:** fichero del DS, página «ª Typography» (`12899:61527`),
tablero `Text styles` (`13407:3586`).

- **Hecho el 2026-10-09:** `Title/title-semibold` (20/28, atado a `font/size/450` y `line/height/450`) y
  `Subtitle/subtitle-semibold` (16/24, a `font/size/300` y `line/height/300`), Inter Semi Bold, con sus filas en el
  tablero (`15334:14` y `15334:18`) y una viñeta nueva en las reglas de jerarquía (`13407:3602`). **Falta publicar la
  librería** (paso 4) para que el fichero del Supervisor los vea.
- **El maestro `Section`** (`691:23956`): su título pasa a `Subtitle/subtitle-semibold`, y en la variante que titula la
  página, a `Title/title-semibold`. Hoy dibuja `Body/body-semibold` (14) y el código pinta 16 y 20.
- **Las maquetas del Supervisor:** el título de página (`.page__heading`, el nombre de las fichas) a `Title`.
- **Tag y Badge a 600:** sus maestros llevan 700 (`tag.ts` y `badge.ts` lo copian del Kit). Primer no tiene 700 y DD-13
  pedía dos pesos, regular y semibold. El código sigue en 700 hasta que el maestro cambie aquí.
- **Etiquetas en píldora (propuesta, decídela aquí):** Primer separa la etiqueta de dato (píldora con borde de 1, 20 de
  alto, texto 12 en 500) de la de estado (rellena, con icono), y el contador va en su propio chip (12 en 600, 18 de
  alto). El Tag del Kit es uno solo: radio 6, sin borde, 21,5 de alto y 700. Si se adopta, primero aquí y luego el
  código por el export.

**Cómo sabes que está hecho:** `npm run audit:text-styles` lista los 14 estilos en verde, y el título de `Section` en el
fichero mide 16 (20 en la variante de página).

---

## 39 · Plantillas de vistas: listado, ficha y diálogo ya montados (2026-10-09, DD-188)

**Estado:** pendiente · **Origen:** el estudio de Primer. GitHub publica en Figma, además de sus componentes, una
librería de plantillas («Primer Interfaces») con las vistas y los patrones que más se repiten, para empezar una maqueta
desde algo ya montado y no desde piezas sueltas.

- **Qué montar:** tres plantillas en el fichero del DS, a 1440 y medidas sobre producción: el listado (barra con
  título `Title`, buscador y botón principal a 32,5; tabla), la ficha en tres columnas (nombre en `Title`, índice,
  secciones con `Subtitle`, resumen) y el diálogo con formulario (la escalera 7 · 14 · 28 de DD-123).
- **Con qué:** solo instancias de la librería y variables que ya existen. Lo que no tenga componente, se anota.
- **Cuándo:** después de los pasos 1 a 4 (variables y estilos publicados), para que nazcan con lo nuevo.

**Cómo sabes que está hecho:** una página «Plantillas» con las tres, cada una con su enlace a la pantalla de producción
que calca, y sin un número suelto que no salga de una variable.

---

## 40 · El icono que acompaña a un texto, al tamaño y al peso de ese texto (2026-10-09, DD-189)

**Estado:** pendiente · **Dónde:** el maestro `Section` (`691:23956`; su icono, `691:23976`) y las maquetas que lo usan.

- **El icono de la cabecera** pasa de 14 a 16 (el tamaño de `Subtitle`) y a 20 en la variante que titula la página
  (`Title`), en peso 600. Si el `IconSet` expone el eje óptico, a 20.
- **Lo que cuelga**: el título tiene que seguir en la vertical del contenido; el icono retrocede 12,5 con 16 y 16,5 con
  20 (sangría 12,25 − hueco 8,75 − icono).
- **La regla, para cualquier maqueta**: un icono junto a un texto toma su tamaño y su peso; los de control (chevron,
  cerrar) se quedan en su talla.

**Cómo sabes que está hecho:** en el fichero, el icono de `Section` mide 16 (20 en la de página) y el texto del título
empieza en la misma x que el contenido de la caja.

---

## 41 · La cabecera de página en la escalera 7 · 14 · 28 (2026-10-11, DD-192)

**Estado:** pendiente · **Dónde:** el `content` de Contact Center (`393:12564`) y las plantillas de la ficha 39.

- **El borde de la página**, 28 por los cuatro lados: el `content` pone 22,75 arriba.
- **La cabecera de un listado**: barra → título 28, título → buscador 14, buscador → tabla 7; Columnas y el buscador, a 7.
- **Con pestañas o segmentado**: 14 del título a las pestañas y 14 de las pestañas al buscador.

**Cómo sabes que está hecho:** en el fichero, el índice y la caja de Contact Center arrancan a 28 del borde de arriba
del `content`, y la plantilla de listado mide 28, 14 y 7.

---

## 42 · Las piezas nuevas del DS desde la revisión de grupos: FileUpload, IconTile, FactRow, Tag mediano, InputTags y la burbuja de estado (2026-10-11, DD-184 a DD-187 y DD-195)

**Estado:** pendiente · **Dónde:** el fichero del DS (maestros) · Ninguna variable nueva: todo sale de las que ya hay.
La ficha de grupo entera no va (no tiene maqueta desde DD-121; ver abajo). **Mídelo antes**: ningún nodo de esta ficha
se ha leído en el fichero.

- **FileUpload** (`sc-fileupload`, DD-184): el maestro de PrimeOne en sus dos modos. El de uso hoy es `basic` (los audios
  del grupo, DD-187): solo el botón, secundario y pequeño, «Subir archivo» con el icono `upload` del `IconSet`. El
  `advanced` (caja de soltar, lista de archivos, aviso de tipo y tamaño) queda para importar tipificaciones y contactos.
  La referencia es la página de sc-docs (Componentes › FileUpload).
- **IconTile** (`sc-icon-tile`, DD-186): la baldosa de un icono. `md`, 28 × 28 con el icono a 16 (para texto de 14);
  `sm`, 24,5 con el icono a 14; radio `md`. Relleno: el color del título al 6 % sobre la tarjeta; brillo arriba (1 px, la
  superficie al 60 %) y la sombra `xs`. Variante `tone=strong` para un título. El icono, al peso de su texto (DD-189).
- **FactRow** (`sc-fact-row`, DD-186): la clave (baldosa `md` + texto 14 regular, del color del texto de su tarjeta) a la izquierda y el
  valor (14 semibold, color de título) a la derecha, centrados en la fila; si no cabe, el valor baja y sigue a la
  derecha. Variante con enlace: la clave subrayada al pasar. Las filas, a 7 entre sí dentro de su tarjeta.
- **Tag mediano** (`sc-tag size="md"`, DD-186): la píldora a 14 en semibold con relleno 1,75 × 10,5, para un valor entre
  valores de 14. El Tag del Kit (12 en negrita) sigue siendo el pequeño. Va con la ficha 38: si el Tag pasa a 600, el
  mediano ya nace así.
- **InputTags** (`sc-inputtags`, DD-195): el Kit no tiene maestro (por eso sale «experimental» en sc-docs). El campo
  de los demás (32,5 de alto, borde y radio de campo) con las etiquetas dentro: el Chip del Kit a 24,5 de alto, texto
  14, radio 6, y su ✕ al final; el texto guía a 14 detrás de la última. Mira antes si PrimeOne lo trae.
- **La burbuja de estado en el avatar** (`sc-presence-avatar`, DD-185 y DD-187 §8): el Avatar con el Badge de punto,
  abajo a la derecha y dentro del cuadro de la foto; diámetro el 30 % de la foto (8 como mínimo), con un aro del color de
  la superficie, en el color del punto de la etiqueta de su estado (gris para «Desconectado»). Solo en la tabla de
  agentes del grupo.

**Cómo sabes que está hecho:** los seis maestros existen en el fichero con estas medidas, atados a variables (ningún
número suelto), y cada uno con el enlace a su página de sc-docs en la descripción.

---

## 43 · La barra de lote cuenta el resultado, con «Deshacer» (2026-10-11, DD-196)

**Estado:** pendiente · **Dónde:** la barra de lote, si se maqueta (no tiene maestro en el Kit) y la plantilla de
listado de la ficha 39.

- **Tras aplicar un cambio en lote**, sin filas marcadas, la barra sigue: «✓ Cambio aplicado a 2 grupos» (mensaje
  simple de éxito, talla pequeña), «Deshacer» (botón secundario con borde, pequeño) pegado al texto y la «×».
- **Tras deshacer**: «✓ Cambio revertido» y la «×», sin botón.
- **Ningún toast** en los listados tras un cambio en lote.

**Cómo sabes que está hecho:** la barra tiene sus tres estados (con selección, con resultado y tras deshacer), y
ninguna maqueta de listado enseña un toast tras editar en lote.

---

## 44 · Una celda sin dato: «—» en gris suave (2026-10-11, DD-197)

**Estado:** pendiente · **Dónde:** las tablas de las plantillas de la ficha 39 y las maquetas con tablas.

- **Celda sin dato**: «—» con el color `text/subtle`, alineado como el resto de la columna. Nunca en blanco.
- **Una cifra a cero** se escribe «0», como las demás cifras.

**Cómo sabes que está hecho:** ninguna tabla del fichero deja una celda en blanco, y sus guiones van en `text/subtle`.

---

## 45 · La ayuda de un campo, debajo de su control; copiar, dentro del campo (2026-10-11, DD-198)

**Estado:** pendiente · **Dónde:** el maestro del botón segmentado (si lo hay), las maquetas de la ficha de grupo y las
plantillas de la ficha 39.

- **Ayuda de un campo**: debajo del control, también en un segmentado. Nunca entre el rótulo y el control.
- **Una lista que crece** (avisos periódicos): su ayuda bajo el título.
- **Un campo que se copia** (script de Web Chat): botón de solo icono (`content_copy`, pequeño, de texto) dentro del
  campo arriba a la derecha; sin botón «Copiar» debajo.

**Cómo sabes que está hecho:** en el fichero, ninguna ayuda va entre un rótulo y su control, y el script de Web Chat
lleva su copiar dentro.

---

## 46 · Iconos: un significado por icono y el estado de una conversación con forma (2026-10-13, DD-200)

**Estado:** pendiente · **Dónde:** los maestros que llevan icono (Button «Icon Only», Section, Empty state) y las maquetas
del Supervisor; en el fichero del Supervisor, «Memory +» › Iconografía transcripciones.

- **Iconos reservados**: la X solo cierra o quita de una lista; eliminar es la papelera; la hamburguesa solo abre la
  navegación; el engranaje es Configuración. «Columnas» lleva `view_column`.
- **Un icono por concepto** (`SC_ICONS`): Agentes `headphones`, Grupos `group`, Usuarios `person`, Administración
  `groups`; Restablecer `restart_alt`; Filtrar `filter_alt`; saltos de audio `replay_10` y `forward_10`.
- **Botón de solo icono**: su tooltip con el mismo nombre (en una anotación, no hace falta dibujarlo en cada maqueta).
- **Estado de una conversación**: el fallo, con la insignia `error` rellena (10) en la esquina de abajo a la derecha del
  glifo, sobre un recorte del fondo del botón; el trabajo en curso, con la insignia `progress_activity`; la llamada sin
  grabación, el teléfono tachado (trazo de 1,5, de esquina a esquina). Mídelo antes: el código pinta los glifos de la
  maqueta del 2026-09-23.

**Cómo sabes que está hecho:** ningún maestro ni maqueta usa la X para eliminar ni la hamburguesa para otra cosa que el
menú, y la iconografía de transcripciones tiene sus tres insignias.

---

## 47 · Fichas: un peldaño de la rampa por nivel de título, y el FileUpload «Advanced» entero (2026-10-15, DD-206)

- **Títulos**: el maestro `Section` (691:23956) pasa su cabecera a `Heading/h3-semibold` (18/24) y `Subsection` (nodo
  `12610:23080`) la suya a `Subtitle/subtitle-semibold` (16/24); `Slot` se queda en `Body/body-semibold` (14/20). La
  página sigue en `Title` (20/28). En código desde DD-206 §13.
- **FileUpload**: los audios de la ficha de grupo usan el «Advanced» con `auto`: «Elegir» (con el «+»), sin «Subir» ni
  «Cancelar», y lo elegido, en la lista de subidos con su ✕. La ficha 42 ya dibujaba solo «Elegir».
- **Ayudas de campo**: a 7 de su control en todos los campos (la especificación de `sc-select`); `SelectButton`,
  `InputTags` y `Textarea` las dibujaban a 3,5.

## 48 · Resumen de las fichas: la tarjeta de datos plana en las tres y sus baldosas en el color de la marca (2026-10-15, DD-209)

- **IconTile**: el maestro gana la variante `Tone=Brand`: el relleno, el degradado de 135° de la tarjeta destacada del
  resumen (`bg/primary-active` → `bg/primary` al 55 % → `bg/primary-hover`), el icono en `text/inverse` y un brillo
  arriba del mismo blanco al 18 %. Sin tokens nuevos.
- **Tarjeta de datos del resumen**: blanca (`bg/surface`) con borde de 1 en `border/subtle` y radio `radius/xl`, sin
  sombra, en agente, grupo y usuario; sus baldosas, `Tone=Brand`.

## 49 · Tablas: la celda de grupos según cuántos, y el multiselect con «+N más» (2026-10-15, DD-210)

- **GroupPopover**: el maestro gana la variante `Display=Adaptive` con sus tres casos: ninguno, «—» en `text/subtle`;
  uno, el nombre del grupo en `text/primary`, sin subrayado, cortado con «…» si no cabe; dos o más, la cifra con su
  subrayado de puntos, como hoy (`Display=Count`).
- **MultiSelect**, `Display=Chip`: pasado el tope, las primeras etiquetas y otra con «+N más», sin «×» (`chipOverflow`
  `more`); hoy el maestro solo enseña «N seleccionados».
- **Opción apagada con su porqué** en un desplegable (los grupos de una plantilla): el nombre apagado y, a su lado, el
  motivo en `caption` y `text/subtle` («No atiende Chat»).

## 50 · Agendas en árbol, la ficha de agente con lo contratado y el toast de toda acción (2026-10-16, DD-211)

- **Agenda › «Grupos y agentes»**: el árbol (TreeTable) con la flecha, la casilla tri-estado y el nombre en la primera
  columna, y el email en la segunda; el grupo en `body-semibold`, plegado; «Sin grupo» el último. Encima, el buscador,
  «Todos / Asignados (n)», «N de M agentes y G grupos enteros» y la regla en una línea en `caption` y `text/subtle`.
  Anota el comportamiento: un agente marcado lo está en todos sus grupos; un grupo entero es dinámico; quitar a uno lo
  deja parcial; un grupo cuyos agentes ya la tienen todos sale entero también al abrir la agenda, y el listado lo cuenta
  igual.
- **Anotaciones de lo contratado** (el prototipo lo enseña todo; en producción se oculta):
  - **Call Blending**: «Llamadas salientes» del grupo (teléfono y audio saliente), «Grupo para llamadas salientes» del
    agente, «Solo salientes» en la tipificación del grupo, la fila del teléfono saliente en los resúmenes y su columna
    en el listado.
  - **CusCare**: el campo «Tipo de agente» y su fila del resumen.
  - **WebRTC**: sin él, «Navegador» deshabilitado en «Dónde suena» y la ayuda «Solo teléfono…».
- **Estado «Solo lectura» de los campos** (InputText, InputNumber, Textarea y Select del Kit, que hoy no lo tienen): sin
  borde, fondo `bg/default`, texto `text/primary` a contraste completo; en el Select, sin la flecha (que deja su
  sitio), y en el Textarea, sin el asa de cambiar el tamaño. Con el foco de teclado, el anillo de foco del sistema. Es el del PIN y el del código de Web Chat.
- **Ficha de agente**: el PIN no sale en el alta; al editar, de solo lectura (el estado de arriba). Sin Teléfono, sin «Grabar llamadas», sin la
  matriz de Llamadas y sin Grabación ni Salientes en el resumen. La matriz con Agentes y Grupos encima de Fijos. Fuera
  «Automático con preview» y «Actualizar teléfono en login».
- **Edición en bloque de las tablas de asignar**: el globo junto a la casilla; mientras pregunta, las casillas de las
  filas bloqueadas; al aceptar, cancelar o pulsar fuera, se desbloquean.
- **Índice de las altas**: ✓ en toda sección que se deja completa, también sin obligatorios.
- **Toast**: el resultado de crear, guardar, duplicar o eliminar, abajo a la derecha (`Toast` del Kit, `success`); fuera
  el mensaje junto a los botones de la barra. En una lista, la barra de lote sigue con «Deshacer».
- **Contact Center**: «Guardar» y «Deshacer» una vez en la barra para las tres secciones, y el punto de cambios en el
  índice.
- **Ficha de grupo**: el audio saliente en «Mensajes en cola»; en la tabla de agentes, cada canal con su nivel al lado.

## 51 · `.Subsection` mide distinto que `sc-subsection` (medido el 2026-10-17)

**Estado:** sin decidir; no lo cita ninguna DD · **Dónde:** `.Subsection` (`12610:23193`, cinco variantes) contra
`sc-subsection.component.scss`.

- Relleno de arriba y de abajo: Figma 22,75 (`scale/1-625`), código 16 (`scale/1-143`).
- Del título al contenido: Figma 8,75 (`scale/0-625`), código 16 (el relleno de abajo de la cabecera).
- Del icono al título: Figma 12 suelto, código 8,75 (`scale/0-625`).

Si manda el código, los tres son repuntes a variables que ya existen.

## 52 · El tema del plugin que recibe el equipo externo lleva Custom con el valor del oscuro (medido el 2026-10-17)

**Estado:** el repunte de los tres, **HECHO en el fichero el 2026-10-18** (en las dos columnas de Custom), con la
librería publicada y el tema empujado ese día (envío `8309a90c`, que ya los lleva). Falta que el robot publique
`tema-plugin.zip`: la guarda de ceros lo paró por el divider (§Herramientas); tras fundir su arreglo, un envío más del
tema. `accent`, sin repunte: al equipo externo le basta una línea en `extend.ts`,
`accent: "light-dark({violet.700}, {violet.400})"` (medida con el motor de PrimeNG: 7,10 y 6,51:1) · **Dónde:** fichero del DS, colección Custom:
`semantic/text/heading`, `subtle`, `inverse` y `accent` · **Evidencia:** `tema-plugin.zip` de la rama `tema-zip`
(export `7b06bcce`, `ts/extend.ts`) y el export del 2026-10-17.

**Medido el 2026-10-18, antes de tocar:**

- **El fallo, con el motor de temas de PrimeNG** (`@primeuix/styled`, como `tema-plugin-zip.mjs`): con el zip publicado,
  en claro el título sale `#ffffff` sobre `#ffffff` (1,00:1), el sutil `#a1a1aa` (2,56:1), el acento `#a78bfa` (2,72:1)
  y el inverso oscuro, `#181d26`, cuando debe ser blanco.
- **El arreglo, simulado sobre una copia del zip:** con `{text.color}`, `{text.muted.color}` y
  `{primary.contrast.color}`, el título sale slate-900 y blanco (16,90 y 17,72:1), el sutil slate-700 y zinc-400 (7,38 y
  6,91:1) y el inverso blanco y zinc-900: lo mismo que `tema-smartcontact.zip`.
- **Cómo exporta el plugin:** Custom tiene dos columnas (Light, la de por defecto, y Dark) y el export lleva solo la Dark.
  Un alias de Custom a otra colección sale como referencia: `component/custommodal/background` apunta a
  `overlay/modal/background` y el export dice `"{overlay.modal.background}"` (47 alias así en Custom).
- **Ninguna capa cambia:** en las 98 páginas del fichero, 63 capas usan esas tres variables (53 en `❖ Sidebar`, 4 en
  `❖ Section`, 3 en `🌈 Colors`, 2 en `⚪️ Internal Components` y 1 en `❖ Navmenu`), y todas resuelven el mismo color
  antes y después (`resolveForConsumer`). El fichero del Supervisor no se miró: su clave no está en el repo.
- **Para deshacerlo:** `heading` Light → `Primitive/slate/900`, Dark → `Semantic Color Scheme/surface/0`; `subtle` Light
  → `Primitive/slate/700`, Dark → `Primitive/zinc/400`; `inverse` Light → `Semantic Color Scheme/surface/0`, Dark →
  `Semantic Color Scheme/surface/900`. Las colecciones conservan el número de variables (Custom, 68).

- El plugin exporta Custom con un solo valor, el del modo oscuro: `heading = {surface.0}`, `subtle = {zinc.400}`,
  `inverse = {surface.900}` y `accent = {violet.400}`. En el tema de nuestras apps manda el DS (`tema-zip.mjs`,
  `MANDA_EL_DS`), pero el del plugin (DD-88) lo lleva tal cual: en claro, un título con `text.heading` sale blanco sobre
  blanco.
- **El repunte (hecho el 2026-10-18).** En las dos columnas de Custom: `semantic/text/heading` → `text/color` (900 y 0,
  los valores de antes), `semantic/text/subtle` → `text/muted/color` (700 y zinc 400) y `semantic/text/inverse` →
  `primary/contrast/color` (blanco y zinc 900).
- **`accent` no tiene repunte:** ninguna variable del esquema de color vale violet 700 en claro y violet 400 en oscuro.
  Pide una variable nueva en el esquema de color (otra sesión), o se queda anotado.
- Después del export, se revisan `MANDA_EL_DS` y el bucket de esas claves en `coverage-map.mjs`.

**Cómo sabes que está hecho:** en `tema-plugin.zip`, `ts/extend.ts` dice `heading: "{text.color}"`,
`subtle: "{text.muted.color}"` e `inverse: "{primary.contrast.color}"`.

---

## Lo de estas semanas que NO va a Figma, y por qué

- **El juego de datos** (Demo · Editorial · Tortura, en Configuración → Sistema → Datos; DD-124): es una herramienta de
  la demo, no una función del producto.
- **El monitor del Dashboard** (DD-127): el fichero no tiene maqueta del Dashboard; sus piezas son las de la ficha 9.
  Si se maqueta, las reglas de tabla de abajo.
- **Las reglas de tabla del código**, para cuando se maqueten tablas:
  - las cifras miden su dato y el nombre se queda el resto, recortando con «…» (el texto entero va en el `title`);
  - las cabeceras de varias palabras no se parten;
  - el texto libre de Conversaciones, hasta dos líneas y «…»;
  - la fila de totales lleva raya arriba.
- **La regla R4 y la medida de agrupación** (DD-125): son medidas del build, no del dibujo.
- **Las fichas enteras de agente, grupo y usuario** no tienen maqueta desde DD-121 y DD-122; las fichas 5 y 18 cubren
  sus piezas. Maquetarlas es trabajo de diseño, no un pendiente.

---

## Cerrado

- ~~**El título del componente `Section` a `Heading/h3-semibold`**~~ → **HECHO el 2026-09-13** (DD-75). Eran **4
  capas maestras, no ~35**: la cifra de este fichero mezclaba dos componentes. Las del conjunto `Section` son el título
  de sección y pasaron a `h3`; las 25 de `.Subsection` (15 maestras y 10 copias) son el segundo nivel y se quedan en
  `Body/body-semibold`, como en código. Verificado leyendo cada capa después y con captura del componente.
- ~~**¿18 o 20?**~~ → **18**, decidido el 2026-09-13. Se queda `h3`; no se crea un estilo de 20.
- ~~**`app/typography/xl` y `xxl`**~~ → **BORRADAS el 2026-09-13** (DD-75). Medido antes: 0 alias, 0 text styles,
  0 capas atadas en las 110 páginas (26.498 textos, con control positivo) y 0 en el fichero del Supervisor. Sus
  valores eran alias: `xl` = size 400 / height 300 y `xxl` = size 450 / height 450, en la colección `Custom`, por si
  hubiera que recrearlas.
- ~~**`12/20` no es ningún estilo**~~ → **no era de Figma**, se arregló en código el 2026-09-13 (DD-75): 96 textos pasan
  a 12/18 en 11 sitios. **Excepción deliberada: `sc-chip`**, cuyo 20 sí está atado en Figma.
- ~~**Las descripciones de los text styles están corridas un peldaño**~~ → **YA NO, verificado el 2026-09-12**: las
  doce tienen su descripción correcta, con sus medidas. Alguien lo arregló entre medias y la bandeja se quedó rancia.
  Es el motivo de que este fichero exija verificar antes de actuar.

---

## Herramientas

- **El loop del export** (`docs/guia-tokens.md` §2.bis): push en el plugin → rama `design-tokens-sync` → el workflow
  `tokens-sync` (import, `verify`, e2e, capturas de antes y después) → PR a `main`. El plugin empuja **dos veces**
  («design tokens» y «theme»): el primer run se cancela y deja la portada en rojo hasta que acaba el segundo. Hasta
  el 2026-10-17 el robot podía decir «Verde» con verify o el e2e en rojo (sus pasos guardaban el log con `| tee` sin
  `pipefail`); lo vigila `workflow-pipefail.test.mjs`. Y hasta ese día **el run cancelado borraba el envío nuevo**: su
  paso de reset corría con `always()` y forzaba la rama a main antes de que el run siguiente la leyera (dos veces
  seguidas el 2026-10-17). Ahora corre con `!cancelled()` y empuja con `--force-with-lease`; lo vigila
  `workflow-push-cancelado.test.mjs`. Si un envío no abre PR, mira el log del paso «Resetear»: «Export == main» con un
  export distinto es este fallo. **Un arreglo del workflow no rige hasta el envío siguiente al reset**: el robot corre
  el `tokens-sync.yml` de la rama del plugin, no el de `main`, así que el primer envío del 2026-10-18 aún corrió el
  viejo y volvió a perder el tema. **El tema del plugin no se publica si un token pasa a 0** (`tema-plugin-zip.mjs`);
  hasta el #440 el `| tee` se tragaba ese rojo y salía igual. Las medidas de `PENDIENTE_FIGMA` (§4), que el Kit dibuja a
  0 a sabiendas, no lo paran: el LEEME del zip las cuenta aparte. Si `tema-zip` no se mueve tras un envío del tema, mira
  el paso «Export del plugin para el equipo externo». Además, `tokens-check` comenta un
  veredicto rápido, y al fundir, `tema-zip` publica el tema del equipo externo.
- **Solo viajan por el export las variables:** las fichas 4, 8, 12, 14 y 19, la variable nueva de la 2, los bordes de
  Tabs (9) y el hueco entre botones del diálogo (17). El dibujo no lo recoge el robot.
- **Figma contra el export**, con el bridge abierto: `node tools/figma-export-parity.mjs <capa>` imprime el JavaScript
  para `figma_execute_across_files` con `fileKeys: ["khNq9dJKNi13pNllrqm6dx"]`. Verde es `distintos: []` **con**
  coincidencias distintas de cero (`tools/README.md`).
- **Dos servers de Figma.** El bridge de diario (`figma-console`) se engancha al arrancar la sesión y no se puede añadir
  a mitad. El de la nube (`plugin:figma:figma`) leyó este fichero el 2026-09-12 —páginas, text styles, variables y
  capas— y además **escribe** por la API de plugins. Es el camino que hay que probar antes de dar algo por bloqueado.
