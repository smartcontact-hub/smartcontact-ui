# Figma — lo que falta por tocar allí, una cosa a la vez

> **Para qué es este fichero.** Hay cambios que el código no puede cerrar solo: viven en Figma y los hace una
> persona. Aquí están juntos, cada uno con lo que hace falta para atacarlo sin releer media sesión: qué variable o
> qué nodo, de qué valor a cuál, y cómo se comprueba que está hecho.
>
> **Ficheros:**
> - «Smart-Contact Design System» — `khNq9dJKNi13pNllrqm6dx` (110 páginas): las variables del Kit y los maestros.
> - El fichero del **Supervisor** (las maquetas), `Hjyy41SYKqcRuIzCGggfYH`. El código cita sus nodos como
>   «Figma Supervisor 393:…» o «2286:…».
> - PrimeOne 4.0.0 — `bJ01Ym4NrCvxFm7dJXvhqp`, solo de referencia.
>
> **Cómo se mantiene.** Lo cerrado se marca aquí, con la fecha. Lo nuevo entra aquí y **no** en la bandeja del
> hand-off: una cosa que solo se puede hacer en Figma no es trabajo de la próxima sesión.
>
> **Cuenta del 2026-11-03:** 48 fichas cerradas y 30 abiertas. De las abiertas, 22 son de dibujo o de medida, casi todas
> en el Kit (estados y variantes de piezas que ya existen; las piezas nuevas, en la 42), 3 de Contact Center (15, 30 y 64, con su evolutivo) y 5 esperan una
> decisión o están aparcadas (10, 25, 26, 38 y 46).
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
(DD-83): decide con qué familia del Kit se pinta antes de dibujarlo. Mídelo antes. **Repaso del 2026-11-03:** la maqueta ya está (hub `3993:10509`, «Repository card» y el drawer acoplado del Kit). El drawer acoplado y la etiqueta con tono y sin borde están en el Kit y en uso desde ese día (§67); el azul es `sky` (DD-247).

**Distribución y colas con el árbol del DS (DD-157, 2026-10-04).** Pendiente en el Kit y en la maqueta de la ficha de
grupo: la sección en `surface="subtle"`, cada canal un `.Subsection` y cada parte un slot (Distribución, Cola, Mensajes
en cola y, en Chat, el acceso al final); la música en «Cola»; y una variante plegable del slot, con el título como
botón y el chevron de la subsección, que en el Kit no existe. Mídelo antes; no requiere variables nuevas. **Repaso del 2026-11-03:** `.Subsection` ya es plegable, y la parte plegable con pista («Mensajes en cola») está en el Kit desde ese día (§67).

**F · listado (DD-153, 2026-10-02).** Pendiente de reflejar en el Kit y la maqueta: selector de
columnas solo con `view_column` (tallas de botón de icono existentes), Asignar y menú fijos a la
derecha, fondo opaco por estado y sombra solo mientras hay contenido oculto. Mídelo antes contra
las demos de MultiSelect y DataTable; no requiere variables nuevas ni modifica el export de tokens. **Repaso del 2026-11-03:** falta en el Kit la columna fija de la tabla (fondo opaco y sombra con contenido oculto).

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
- [x] **2** · La pastilla sin punto y a 600. **Hecho el 2026-11-03.** La etiqueta IFTA se queda en 400 (decidido).
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

**Medido el 2026-11-03 contra el fichero del Supervisor**: de las 18 casillas no queda ninguna en las pantallas de
administración.
- Hechas: la librería aceptada (el Supervisor usa la publicada); 5, 16, 18, 23, 32 y 35 (en «Cerrado»); y 29, las
  altas: «Nuevo agente» y «Crear agente» (13), «Nuevo usuario» y «Crear usuario» (8), y la línea «Ir a» de
  Distribución y colas en las dos pantallas de Grupos con dos canales («Otras configuraciones 5» y «11»).
- Obsoletas: 3, 31, 33, 34 y 36 (en «Cerrado»).
- De Contact Center, aparcadas con su evolutivo: 15, 30, el interruptor y las tarjetas de opción de la 2, el
  número de Servicio de la 22 y los tres textos de General de la 24.
- Lo que queda de esas fichas es del Kit, no de las maquetas: el icono a 600 (29), la pastilla a 600 (2) y el
  resumen como enlace (37).

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
   - el botón de solo icono, que no es cuadrado (ficha 25; la hora del datepicker ya está a 14).

---

## 4 · Las medidas de PrimeOne que Aura 3 cambió: el código ya sigue a Aura (2026-09-14)

**Repaso del 2026-11-03:** solo quedan las tres medidas que se separan en /y y /x: `divider/vertical/padding`, `divider/horizontal/padding` e `inputgroup/addon/padding`.

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

## 6 · La miga: un tramo que se puede pulsar se subraya al pasar el ratón (2026-09-14)

**Repaso del 2026-11-03:** falta subrayar el tramo al pasar (`Label Hover=True` sigue sin subrayado) y la nota de la manita.

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

**Repaso del 2026-11-03:** los glifos ya no van a tamaño literal (`schedule` mide 15,6 en su caja de 14), pero falta compararlos lado a lado con sc-docs: `check` mide 14 × 10.

**Estado:** decidido el 2026-09-28: se agranda si el `IconSet` ata la caja · **Evidencia:** medido en código (DD-104); **mídelo antes** en el
fichero.

El código calibra el glifo de Material Symbols con `scale: calc(24 / 18)`. La caja del icono mide lo mismo, pero el
dibujo crece hasta ocuparla entera, como hacía PrimeIcons, de donde salen los tamaños del Kit. Un icono de 12 dentro de
un botón pinta ahora 12, no 9. En Figma el glifo sigue a su tamaño literal, así que **toda maqueta con iconos de
Material se ve más pequeña que la app**: botones de solo icono, lupa de los buscadores, índice de las fichas, barra
lateral y menús.

- **Qué mirar en el fichero:** si el `IconSet` y los maestros que lo usan atan el glifo al tamaño de su caja (ancho y
  alto atados a la variable de font-size, DD-24). Si es así, la vía más limpia es agrandar el glifo dentro de la caja un
  33 % (24/18) sin tocar la caja, que es lo que hace el código. **Medido el 2026-10-18** en el botón de solo icono
  (`11:368`): la caja es una instancia de la librería de iconos, a 14 y sin variable, y el dibujo de dentro escala con
  ella (restricción `SCALE`). El 33 % se hace en la librería de iconos y llega a todas las instancias al publicarla.
- **El índice lateral** (ficha 5) es una sola pieza desde DD-122, en cinco pantallas. En código lleva el icono a 14 de
  caja; en Figma, `IconSet` `393:12581` a 20, que pinta más o menos lo mismo. Con esta ficha hecha, ese 20 baja a 14.
- **Se queda fuera, a propósito:** la réplica `agent` no calibra (DD-35). Sus tamaños se midieron sobre el Comunicador
  en vivo.

**Cómo sabes que está hecho:** una captura del botón `sm` de solo icono en Figma y otra de `#/components/button` en
sc-docs, lado a lado, pintan la papelera del mismo tamaño.

---

## 9 · El Dashboard: lo que PrimeNG ya tiene y el fichero del DS aún no dibuja (2026-09-14)

**Repaso del 2026-11-03:** el peso de las pestañas ya va atado. Faltan los bordes a 0, las flechas de desbordamiento, el punto de Badge y el hueco «Añadir widget».

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

**Repaso del 2026-11-03:** sin decidir (decisión 5).

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

**Repaso del 2026-11-03:** `panel` sigue sin la propiedad Severity (None, Warn y Danger), que el código tiene.

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

## 13 · El botón se encoge al pulsarlo: la interacción que el código ya tiene (2026-09-15)

**Repaso del 2026-11-03:** el estado Active del botón mide lo mismo: falta encogerlo al 96 % con una transición de 150 ms.

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

## 15 · La escalera de agrupación manda sobre la maqueta: filas de formulario a 14 (2026-09-27)

**Repaso del 2026-11-03:** sus nodos (`2286:*`) ya no están en ninguna página y lo que queda es de Contact Center: fuera de este repaso.

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

## 17 · El diálogo con formulario: la botonera a 28 del último campo, 14 entre campos y 10,5 entre botones (2026-09-27)

**Repaso del 2026-11-03:** falta el pie del Custom modal a 12,25 del cuerpo cuando hay formulario (`dialog/footer/padding/top` vale 0).

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

## 20 · La barra lateral del Supervisor (SISMAC-4340): lo que Figma dibuja distinto (2026-09-15)

**Repaso del 2026-11-03:** lo seleccionado ya va en cyan y el comportamiento está rotulado. Faltan `neurology` en vez de `brain` en Testing y el fondo oscuro de `sidebar` a la superficie.

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

**Repaso del 2026-11-03:** `neurology` y `dashboard` ya están publicados; falta pasar el script de huérfanos.

**Estado:** pendiente, tres pasos de persona y un script · **Evidencia:** hand-off `supervisor-fichas.md`; el script y
su `LEEME.md` viven fuera del repo, en `~/Documents/Claude/2026-09 iconos-material/huerfanos/`.

1. Publicar **Smart-Contact-Icons** desmarcando los 21 sets `Icon…` de Playground, que son de otra sesión.
2. Aceptar la actualización en el fichero del DS.
3. Arrastrar `dashboard` y `neurology` a Playground.
4. Pasar el script según su `LEEME.md`: 13 `dashboard`, 8 `brain` → `neurology`, y `query_stats` y `graph_5` a 14 × 14.
   Se para solo si la actualización del paso 2 no está aceptada.

---

## 22 · Números sueltos en las maquetas que el código redondeó a la escala

**Repaso del 2026-11-03:** la fila de `Section` está hecha; el resto no tiene nodo o está en otro fichero.

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

## 24 · Los cabos de Figma de DD-24: icono y tamaño de letra, y tres textos (2026-06-22)

**Repaso del 2026-11-03:** faltan el icono de `button` atado a `app/font/size` y el texto de `inputtext` atado a su tamaño de letra.

**Estado:** pendiente · **Evidencia:** `docs/ROADMAP.md`, «Round-trip DD-24»; no re-medido desde junio, **mídelo
antes**.

- **Atar el ancho y el alto de los iconos que acompañan a un texto a la variable de font-size**: en md, `app/font/size`;
  en sm y lg, `{componente}/sm|lg/font`. Quedaban dos huecos: el icono de `button-default`, suelto (va a
  `app/font/size`), y el texto de `inputtext`, suelto (va al font-size del campo).
- **Tres textos de General en los nodos de Figma:** el título de la ventana y el del aviso, «Recepción de
  conversaciones», y la etiqueta de alerta, «Mostrar». Ya están así en `es.json`; busca antes en el fichero para no
  crear otra versión.

---

## 25 · Aparcado: el botón de solo icono no es cuadrado; la hora del datepicker, hecha (2026-09-14)

**Repaso del 2026-11-03:** sigue aparcado: el botón de solo icono mide 31,5 × 32,5.

**Estado:** el botón, aparcado (un píxel no se ve); la hora, **HECHA el 2026-10-18** · **Evidencia:** DD-91,
«Consecuencias».

- El botón de solo icono mide 31,5 × 32,5. El ancho es `button/icon/only/width` = `scale/2-25`, y el alto sale del
  interlineado atado. Un píxel no se ve; si se decide cuadrarlo, el alto sale de la misma variable.
- **La hora del datepicker, de 17,5 a 14 en Figma**, como el código y como Aura (`timePicker.fontSize` =
  `{typography.font.size}`, el mismo token que los días). A 17,5 pesaba más que el título del mes (14, medium) y los
  devs, que construyen desde Figma, se habrían apartado del tema. Cambiados los 5 textos de `datepicker-bar`, variante
  `Type=Time Picker` (`2070:39179`): 12, los dos «:», 47 y pm, sin variable, como los días. Las dos instancias de la
  página heredan (10 textos); la variante pasa de 95,5 a 91,5 de alto. **Para deshacerlo:** esos 5 textos a 17,5.

---

## 26 · Aparcado: borrar la colección «App» (2026-09-14)

**Repaso del 2026-11-03:** sin cambios (opcional).

**Estado:** opcional · **Evidencia:** DD-92.

«App» se quedó como alias de Custom: el DS ya no la usa y no puede desviarse. Borrarla exige publicar la librería,
actualizar el fichero del Supervisor y revincular sus 939 enlaces a «App» dentro de instancias. El alias ya consigue lo
que importaba.

---

## 28 · Menores

**Repaso del 2026-11-03:** `card` ya tiene «Show icon» y `azure` ya está en el Kit (§67). Quedan las variables mono y canvas.

- **`font-family-mono`** no existe en Figma (`customs-catalog.md`). Ojo: el código pone `'JetBrains Mono'` delante de la
  pila del sistema (`01-primitive.css`), y el catálogo decía «Opción A: pila del sistema, sin fuente propia». Aclarar
  cuál es la buena antes de crear la variable.
- **`--sc-bg-canvas`**, el lienzo de página, no tiene variable en Figma (`customs-catalog.md`). Un solo consumidor hoy.
- **`azure`** vive a mano en `01-primitive.css`: no tiene familia en el Kit (DD-83).
- **Code Connect:** el maestro `card` necesita la propiedad booleana «Show Icon» para que `figma:connect:publish` pase
  (`docs/code-connect.md`).

---

## 29 · El pase de diseño de las fichas: icono a 600 junto a semibold, altas con «Crear …» y saltos por canal (2026-09-27)

**Repaso del 2026-11-03:** falta solo el icono a 600 junto al semibold (`Section` y `nav-item` usan Material Icons Round, sin eje de peso). Las altas con «Crear …» y la línea «Ir a» de Grupos ya están (medido, paso 5).

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
  Hecho en el Supervisor el 2026-11-03 (§69).

**Cómo sabes que está hecho:** el icono del título de sección y el de la fila activa del índice van a 600 en el Kit, y
las maquetas de las fichas enseñan las altas y los saltos como el código.

---

## 30 · Contact Center › Grupos y › Agentes hablan como sus fichas, y guardan (2026-09-29)

**Repaso del 2026-11-03:** es de Contact Center: fuera de este repaso.

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

## 38 · Title y Subtitle: los dos estilos nuevos, el maestro `Section` y la etiqueta a 600 (2026-10-09, DD-188)

**Repaso del 2026-11-03:** los estilos están hechos, y `tag` y `badge` van a 600 desde ese día: `tag/font/weight` y
`badge/font/weight` apuntan a `primitive/typography/font/weight/semibold` (23 textos de `tag`, 56 de `badge` y 56 de
`overlaybadge`). **Falta el push del plugin**: con él, `tag.ts` y `badge.ts` pasan de 700 a 600 por el export. Queda
solo decidir las etiquetas en píldora (abajo), con su propio PR (DD-188).

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

**Repaso del 2026-11-03:** no hay página de plantillas en el Kit.

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

## 41 · La cabecera de página en la escalera 7 · 14 · 28 (2026-10-11, DD-192)

**Repaso del 2026-11-03:** el listado de Grupos ya mide 28, 14 y 7; solo queda la plantilla de listado (la 39).

**Estado:** pendiente · **Dónde:** el `content` de Contact Center (`393:12564`) y las plantillas de la ficha 39.

- **El borde de la página**, 28 por los cuatro lados: el `content` pone 22,75 arriba.
- **La cabecera de un listado**: barra → título 28, título → buscador 14, buscador → tabla 7; Columnas y el buscador, a 7.
- **Con pestañas o segmentado**: 14 del título a las pestañas y 14 de las pestañas al buscador.

**Cómo sabes que está hecho:** en el fichero, el índice y la caja de Contact Center arrancan a 28 del borde de arriba
del `content`, y la plantilla de listado mide 28, 14 y 7.

---

## 42 · Las piezas nuevas del DS desde la revisión de grupos: FileUpload, IconTile, FactRow, Tag mediano, InputTags y la burbuja de estado (2026-10-11, DD-184 a DD-187 y DD-195)

**Repaso del 2026-11-03:** `icon-tile` y `fact-row` ya están. Faltan Tag mediano, InputTags, la burbuja de estado y «Subir archivo» en FileUpload Basic.

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

**Repaso del 2026-11-03:** solo aplica a Conversaciones (DD-215 la quitó de Grupos y Agentes) y no está en el Kit ni en esa página.

**Estado:** pendiente · **Dónde:** la barra de lote, si se maqueta (no tiene maestro en el Kit) y la plantilla de
listado de la ficha 39.

- **Tras aplicar un cambio en lote**, sin filas marcadas, la barra sigue: «✓ Cambio aplicado a 2 grupos» (mensaje
  simple de éxito, talla pequeña), «Deshacer» (botón secundario con borde, pequeño) pegado al texto y la «×».
- **Tras deshacer**: «✓ Cambio revertido» y la «×», sin botón.
- **Ningún toast** en los listados tras un cambio en lote.

**Cómo sabes que está hecho:** la barra tiene sus tres estados (con selección, con resultado y tras deshacer), y
ninguna maqueta de listado enseña un toast tras editar en lote.

---

## 45 · La ayuda de un campo, debajo de su control; copiar, dentro del campo (2026-10-11, DD-198)

**Repaso del 2026-11-03:** copiar dentro del campo está hecho; la ayuda entre rótulo y control no se ha medido.

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

**Repaso del 2026-11-03:** no se puede medir por script: pide repasar el significado de cada icono.

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

**Repaso del 2026-11-03:** falta FileUpload Advanced con solo «Elegir» en el Kit; la maqueta lo resuelve con un override.

- **Títulos**: el maestro `Section` (691:23956) pasa su cabecera a `Heading/h3-semibold` (18/24) y `Subsection` (nodo
  `12610:23080`) la suya a `Subtitle/subtitle-semibold` (16/24); `Slot` se queda en `Body/body-semibold` (14/20). La
  página sigue en `Title` (20/28). En código desde DD-206 §13.
- **FileUpload**: los audios de la ficha de grupo usan el «Advanced» con `auto`: «Elegir» (con el «+»), sin «Subir» ni
  «Cancelar», y lo elegido, en la lista de subidos con su ✕. La ficha 42 ya dibujaba solo «Elegir».
- **Ayudas de campo**: a 7 de su control en todos los campos (la especificación de `sc-select`); `SelectButton`,
  `InputTags` y `Textarea` las dibujaban a 3,5.

## 49 · Tablas: la celda de grupos según cuántos, y el multiselect con «+N más» (2026-10-15, DD-210)

**Repaso del 2026-11-03:** el «+N más» del multiselect está hecho; falta `popover` con Display=Adaptive para la celda de grupos.

- **GroupPopover**: el maestro gana la variante `Display=Adaptive` con sus tres casos: ninguno, «—» en `text/subtle`;
  uno, el nombre del grupo en `text/primary`, sin subrayado, cortado con «…» si no cabe; dos o más, la cifra con su
  subrayado de puntos, como hoy (`Display=Count`).
- **MultiSelect**, `Display=Chip`: pasado el tope, las primeras etiquetas y otra con «+N más», sin «×» (`chipOverflow`
  `more`); hoy el maestro solo enseña «N seleccionados».
- **Opción apagada con su porqué** en un desplegable (los grupos de una plantilla): el nombre apagado y, a su lado, el
  motivo en `caption` y `text/subtle` («No atiende Chat»).

## 51 · `.Subsection` mide distinto que `sc-subsection` (medido el 2026-10-17)

**Repaso del 2026-11-03:** solo falta el hueco del icono al título a `scale/0-625` (hoy, 12 suelto).

**Estado:** sin decidir; no lo cita ninguna DD · **Dónde:** `.Subsection` (`12610:23193`, cinco variantes) contra
`sc-subsection.component.scss`.

- Relleno de arriba y de abajo: Figma 22,75 (`scale/1-625`), código 16 (`scale/1-143`).
- Del título al contenido: Figma 8,75 (`scale/0-625`), código 16 (el relleno de abajo de la cabecera).
- Del icono al título: Figma 12 suelto, código 8,75 (`scale/0-625`).

Si manda el código, los tres son repuntes a variables que ya existen.

## 53 · Lo que el Kit no tiene para las fichas de grupo y agente y el listado de grupos (medido el 2026-10-18)

**Repaso del 2026-11-03:** hechos la casilla indeterminada, la celda de selección pequeña, el icono del botón atado y, hoy, `inputnumber` sin botones, el solo lectura, `kbd`, `azure` y el texto final de `menu-item` (§67). Siguen: el botón de texto pequeño a 27, `menu-item` a 27 y con variante de peligro, la cabecera Selected en blanco, Body medium, avatar de 24, overlaybadge con punto, «Empty state» en el Kit e `icon/secondary`.

**Estado:** sin hacer; en las maquetas del Supervisor va ajustado a la app y anotado, sin tocar la librería · **Dónde:**
fichero del DS, y el del Supervisor (páginas «Grupos» y «Agentes», cada una con su índice; «Fuera del DS», borrada el 2026-11-03, §54;
el hand-off de cada una, a la derecha de su índice: `3371:61554` y `3371:61797`) · **Evidencia:** cada caso,
medido contra sc-supervisor.pages.dev a 1440.

- **Botones:** `button-small` de texto sin el borde transparente de 1 de PrimeNG (25 de alto en vez de 27; las filas
  del listado se van a 30). En `button`, el icono de dentro no está atado a «Left Icon» ni a «Icon»: sale el ✓ del
  maestro y hay que cambiarlo a mano.
- **Tablas:** el texto, hecho el 2026-10-19: Body/body-regular y Body/body-semibold (interlineado 20), fila de 42. El
  relleno del Kit (10,5 × 14; Small 5,25 × 7) es el del DS de los devs, medido en ui.smart-contact.com: el que se
  apartaba era el prototipo (8 × 14), que pasó a 10,5 × 14 el 2026-10-19 (DD-214). Queda: la variante Selected de
  `datatable-header-cell` pinta `highlight` (en PrimeNG 22 la ordenada se queda blanca); `datatable-selection-cell`
  Small, con la casilla pequeña.
- **Menú:** `menu` lleva sus filas fijas, sin slot; `menu-item` mide 21 (texto de 14 de alto) frente a 27, y no tiene
  variante de peligro.
- **Formularios:** la casilla sin `indeterminate`; InputNumber sin la variante sin botones ni con sufijo; sin el estado
  «Solo lectura» (§50).
- **Piezas:** el `Toast` del Kit es el de PrimeNG (350, título verde y detalle) y el de la app, `sc-toast` (293), se
  compone con las variables `toast/*`; sin estilo Body medium; avatar sin 24; overlaybadge sin punto; ProgressSpinner
  solo indeterminado; sin `kbd` (el atajo «/» del buscador) ni `sc-empty-state`.
- **Variables:** sin `icon/secondary` (`--sc-icon-secondary`; se usa `slate/600`) ni familia `azure`; la sombra de la
  barra de lote es `popover/shadow` (0,10 negro) y la de la app, `rgb(15, 23, 42)` al 8 y al 6 %.
- **Iconos:** hecho. Los trece que faltaban están en Smart-Contact Icons desde el 2026-10-18, y las maquetas ya los
  llevan (los cuatro últimos sustitutos, `search`, `file_copy` y dos `tune`, cambiados el 2026-10-19).
- **Sale de «Fuera del DS»** (2026-10-19; la página ya solo enseña lo que desarrollo construye distinto): el Header sin
  botón md (la app mide 58 con botones de 32,5, DD-188); el Custom modal con mínimo 480 frente a los 440 de `sc-dialog`,
  y el confirmdialog de 350 frente a 334,6 (a 440, la «×» del maestro queda recortada: empieza en 428, medido el
  2026-10-19); el resumen sin Edición con la línea de Falta; `.Subsection` sin estado plegado; el azul claro del botón
  de foto SÍ tiene variable, `highlight/background` (`blue/50` en claro, como `--sc-bg-subtle`; medido el 2026-10-19),
  y el dibujo no la usa; las sombras del resumen (`--sc-shadow-xs`, `--sc-shadow-card`) sin estilos de efecto. El
  Nav-menu ya trae el rótulo del índice (`titleKey`), oculto por defecto.
- **La copia del DS** (`C5soC7CxcuKSIFPEDCd3gz`) tiene arreglados los botones de texto con su borde, el tooltip con
  máximo de 157,5 y la celda de selección small. Llevarlos al oficial es una decisión de diseño pendiente.

**Cómo sabes que está hecho:** cada maestro mide lo que la app (botón de texto small 28 × 27, fila de menú 27; la celda
small, al revés: la app ya va a la del Kit, 5,25 × 7, DD-214) y las maquetas dejan de necesitar el ajuste a mano.

---

## 64 · La barra común de asignar y el hub de Repositorios como su COA (DD-243, DD-245; 2026-10-31)

**Estado:** dibujado en el Supervisor; queda lo de abajo · **Dónde:** el Supervisor (`Hjyy41SYKqcRuIzCGggfYH`), páginas
Equipos, Agendas, Plantillas, Grupos, Agentes y Repositorios · **Evidencia:** `barra-comun-tablas.spec.ts` y
`repositorios-hub.spec.ts`.

**Hecho** (por el server de la nube, el 2026-10-31):
- **Barra de asignar**: filtro «Todos / Asignados / Sin asignar» (tamaño pequeño), buscador y, al final, el contador
  «N asignados» («1 asignado»; estilo de la descripción, color `text/secondary`). Agendas (19 barras) y Plantillas (13)
  pasan de «Todos / Asignados (N)» y del buscador delante a las tres opciones con el filtro delante; Grupos (9) y Agentes
  (5) ganan el contador; Equipos (16) cambia «N en el equipo» por «N asignados». Las notas «Cómo se comporta» de Equipos,
  Agendas y Plantillas dicen la barra, con qué abre y el orden por nombre. El vacío dice «Asígnalos desde «Todos».».
- **Hub** (`3993:10509` y `3997:295`): el filtro delante del buscador, a 7 (`scale/0-5`); «Diseñador Conversacional» con
  mayúscula; las ocho tarjetas «Próximamente» del COA (también en el mapa, `3998:532`) llevan esa marca en la línea del
  nombre (fila `encabezado`, estilo y color de la descripción).

**Repaso del 2026-11-03** (server de la nube, contra el código de `main`):
- **Las 64 barras** (Grupos 10, Agentes 6, Equipos 16, Agendas 19, Plantillas 13; cinco son de los mapas de componentes):
  todas con el filtro delante, el buscador y, al final, «N asignados». Ninguna pantalla dice «pestaña» ni «N en el
  equipo»; dos notas sí, y se cambiaron (Grupos, «filtro "Asignados"»; Equipos, «"26 asignados"»).
- **Contador que faltaba**, en dos barras de «sin resultados»: alta de grupo, Otras configuraciones 7 («2 asignados»), y
  edición de agente, paso 06 («12 asignados»).
- **Con qué abren**: la edición de agenda (sus 6 pantallas) y la de plantilla (sus 4) abrían en «Todos»; pasan a
  «Asignados», como `agent-assignment-table` al editar. La agenda y la plantilla de ejemplo no tienen agentes en el
  prototipo, así que la tabla enseña su vacío: «Sin resultados», «Aún no hay agentes asignados.» y «Limpiar búsqueda» (la
  fila vacía del listado, en el slot de filas de la tabla, a los 322 de alto de las filas). La edición de agente, paso 05
  («desde la cifra de grupos»), decía «con el filtro en Asignados» y estaba en «Todos»: corregida. Las altas siguen en «Todos».

**El borde al pasar, en el tono fuerte (DD-246, 2026-11-03)**, con `use_figma`: paso 07 «Estados de la tarjeta» (`4449:2477`),
el estado «Al pasar» (`4449:2597`) pasa de `blue/200` a `blue/500` a 1 px, y el de «Próximamente» (`4449:2667`) toma ese
mismo borde al pasar (antes no cambiaba); «Marcada» ya iba a 2 px en `blue/500`. Reescritos sus rótulos, la nota del paso
y los dos textos del mapa de componentes (`3998:87241`, `3998:87278`). Sigue atado a la familia `blue` de la librería, no
a `azure` (lo de abajo).

**Medidas del hub contra el prototipo (2026-11-03)**, a 1280 × 1160 y a 1920 × 1160: la rejilla (904), las categorías,
las tarjetas y el panel (350) ya casaban. No casaban dos cosas, en los siete hubs de la página (pasos 01 a 06 y el
mapa): (a) la fila de Comunicación tenía las tarjetas en `HUG` (128, 130 y 146): en el prototipo la fila las estira a
146; ahora llevan `minHeight` 146 (con `FILL` en una fila que abraza, las de los pasos 04 y 05, ocultas, se aplastaban a
30). (b) En el filtro, el `content` de «Clasificación» iba en `FILL` (73 para un texto de 74 más 21 de relleno) y el
filtro, fijo a 481: ahora cada opción abraza su texto (66 · 112 · 104 · 181 · 42 = 505; en el prototipo, 500) y el
buscador sigue al filtro. **El velo del paso 06 se queda**: el prototipo lo pone a 1280 (`panelTapa`, DD-179 §4: el panel,
en x 930, taparía tarjetas que llegan a x 1012); a 1920 no. **Queda**: la cabecera mide 58 en Figma y 56 en el prototipo
(todo el hub baja 2 px), el título del panel y la flecha de «Abrir repositorio» (`arrow_forward` en el código, chevron en
Figma) y sus entradas de ejemplo. La flecha, **hecha el 2026-11-03**: las 30 (3 botones y 27 entradas) son `arrow_forward`.

**Queda:**
- ~~**Comunicación sin su azul**~~ → **Hecho el 2026-11-03 (DD-247)**: Comunicación va en `sky`, que ya está publicada
  (en la página Repositorios, 82 en 700, 65 del fondo al 50 y 6 bordes en 500; en «Componentes del Supervisor», las 12 de
  las piezas del hub), y el fondo de los cuatro tonos del hub pasa del 100 al 50, como `--sc-label-<color>-bg`. `azure`
  se borró del Kit sin publicar. Lo de §67 sobre atar a `azure` queda sin objeto.
- **La cabecera mide 58 en el Kit y 56 en el código**: en el `Header` del Kit, `container buttons` mide 32,5; en el código,
  lo más alto es 28 en una caja de 30,5. Es un componente compartido: mirar quién lo usa antes de tocarlo y publicar.
- ~~**«❖ Alert modal» con superficie blanca** (DD-242)~~ → publicada, y los 22 avisos del Supervisor ya la usan (§65).
- **Enlaces de Figma en los COA** de 4438, 4440 y 4064 (páginas `4077:58411`, `4067:100978` y `3491:35886`): van en los
  prompts de `~/Documents/Claude/2026-10 Empate flujos AED/`; los pega y publica Rafa.

## Lo de estas semanas que NO va a Figma, y por qué

- **El juego de datos** (Demo · Editorial · Tortura, en Configuración → Sistema → Datos; DD-124): es una herramienta de
  la demo, no una función del producto.
- **El monitor del Dashboard** (DD-127): el fichero no tiene maqueta del Dashboard; sus piezas son las de la ficha 9.
  Si se maqueta, las reglas de tabla de abajo.
- **Las reglas de tabla del código**, para cuando se maqueten tablas:
  - las cifras miden su dato y el nombre crece hasta 384 (24rem), recortando con «…» (el texto entero va en el
    `title`); en una tabla más ancha, el sobrante va a la columna del «⋮» (DD-187 §7, §59);
  - las cabeceras de varias palabras no se parten;
  - el texto libre de Conversaciones, hasta dos líneas y «…»;
  - la fila de totales lleva raya arriba.
- **La regla R4 y la medida de agrupación** (DD-125): son medidas del build, no del dibujo.
- **Las fichas enteras de agente, grupo y usuario** no tenían maqueta desde DD-121 y DD-122. Las de grupo y agente,
  con el listado de grupos, se maquetaron el 2026-10-18 (§53); la de usuario sigue sin ella, y maquetarla es trabajo de
  diseño, no un pendiente.

---

## Cerrado

**Repaso del 2026-11-03** (fichas cerradas ese día; el detalle de cada una, en `git log -p docs/figma-pendiente.md`):

- ~~**1 · Publicar la librería**~~ → **HECHA el 2026-11-03**: Custom modal `14238:4140` (cabecera en FILL) y «❖ Alert modal» `15876:698` con `Surface`, publicados (CURRENT).
- ~~**3 · La cabecera y el aire de página se compactaron en código (2026-09-14)**~~ → **OBSOLETA el 2026-11-03**: la dejan sin objeto DD-188 (cabecera a 58) y DD-192 (escalera 7 · 14 · 28), y el listado de Grupos `3118:17001` ya las sigue.
- ~~**5 · El índice lateral de las pantallas con rail no es componente de la librería (2026-09-14)**~~ → **HECHA el 2026-11-03**: `nav-item` `12555:23029` (Active a 600, con error, con cambios y hecha) y `Nav-menu` con rótulo, en uso en Grupos y Agentes. Lo de Contact Center, fuera.
- ~~**8 · Grises intermedios: los textos y la opción no elegida, un paso más oscuros (2026-09-14)**~~ → **HECHA el 2026-11-03**: `text/color` y `form/field/color` a `surface/900`, `text/muted/color` a `slate/700`, `togglebutton/*` a 700 y 900, en el Kit y en el export.
- ~~**12 · Los botones rojos en claro, un paso más oscuros por contraste (2026-09-15)**~~ → **HECHA el 2026-11-03**: `button/danger/background`, `button/text/danger/color` y `button/outlined/danger/color` a `red/600` (al pasar, 700; pulsado, 800).
- ~~**14 · La etiqueta «Draft» (secundaria) no llega al contraste (2026-09-24)**~~ → **HECHA el 2026-11-03**: `tag/secondary/color` a `surface/700`, en el Kit y en el export.
- ~~**16 · La caja de sección, 17,5 arriba y abajo en las dos pieles (2026-09-27)**~~ → **HECHA el 2026-11-03**: `Section` `12610:23284`, arriba y abajo a `scale/1-25` en sus cuatro variantes. El bloque de Contact Center, fuera.
- ~~**18 · El widget del resumen de las fichas: cifra, «/total» y anillo (2026-09-27)**~~ → **HECHA el 2026-11-03**: el anillo de 42 con pista y valor, en `group-summary` `15486:188` y `agent-summary` `15510:72610`.
- ~~**19 · Cuatro grises del Kit bajo AA que el código ya sube (2026-07 a 2026-09)**~~ → **HECHA el 2026-11-03**: `button/outlined/secondary/color`, `form/field/icon/color` y `navigation/item/icon/color` a `surface/600`; el placeholder, a `surface/700`.
- ~~**23 · La presencia en Contact Center y en «Editar agente» (2026-09-13)**~~ → **HECHA el 2026-11-03**: el «Estado» de la ficha de agente es un `select` con «Disponible» en las seis pantallas de Agentes. Lo de Contact Center, fuera.
- ~~**27 · Tokenizar los text styles: la raíz común de cuatro fallos (2026-08-07)**~~ → **HECHA el 2026-11-03**: los 14 estilos de texto atan tamaño, interlineado, estilo y familia a variables.
- ~~**31 · Las altas dicen lo que falta, hasta «Listo para crear» (2026-09-29)**~~ → **OBSOLETA el 2026-11-03**: DD-222 y DD-225 quitaron «Listo para crear» de las fichas de grupo y agente.
- ~~**32 · Las altas, con el índice de la edición: el ✓ y «Atrás / Siguiente» (2026-10-01)**~~ → **HECHA el 2026-11-03**: el pie del alta de Agentes («Atrás» secundario y «Siguiente» principal) y `nav-item` con la marca de hecha.
- ~~**33 · La ficha de grupo con las palabras de la revisión de producto (2026-10-01)**~~ → **OBSOLETA el 2026-11-03**: los textos de la ficha de grupo cambiaron después (`priority_hint`, `strategy_help.balanced`) y la maqueta ya no dice «Desbordar sesión».
- ~~**34 · El teléfono saliente, obligatorio y de una lista; «Caducar sesión», y Recursos sin Etiquetas (2026-10-01)**~~ → **OBSOLETA el 2026-11-03**: la dejan sin objeto DD-218 (duplicar es un alta) y DD-239 (Recursos oculto en el grupo); «Caducar sesión» ya está en Grupos.
- ~~**35 · Las fichas en tres columnas: el nombre encima del índice y el resumen sin rótulo (2026-10-01, DD-170 el 2026-10-05)**~~ → **HECHA el 2026-11-03**: «Record header» `4428:25893` encima del índice, a 235 y en `Title/title-semibold`, en todas las fichas.
- ~~**36 · El nombre de la ficha, fijo arriba al bajar (2026-10-01)**~~ → **OBSOLETA el 2026-11-03**: DD-170 retiró el nombre fijo arriba.
- ~~**40 · El icono que acompaña a un texto, al tamaño y al peso de ese texto (2026-10-09, DD-189)**~~ → **HECHA el 2026-11-03**: el icono de `Section` a 18 (`…/font/size/400`) y el de `.Subsection` a 16 (`…/size/300`); el peso va con la 29.
- ~~**44 · Una celda sin dato: «—» en gris suave (2026-10-11, DD-197)**~~ → **HECHA el 2026-11-03**: `datatable-content` Type=Empty «—» en `text/muted/color`, en uso en Grupos.
- ~~**48 · Resumen de las fichas: la tarjeta de datos plana en las tres y sus baldosas en el color de la marca (2026-10-15, DD-209)**~~ → **HECHA el 2026-11-03**: la tarjeta de datos en `content/background` con borde sutil, radio xl y sin sombra, y `icon-tile` con el tono de la marca.
- ~~**50 · Agendas en árbol, la ficha de agente con lo contratado y el toast de toda acción (2026-10-16, DD-211)**~~ → **HECHA el 2026-11-03**: lo que quedaba, el estado de solo lectura, está en `inputtext` y `textarea` (§67, publicado el 2026-11-03); el árbol y el diálogo de duplicar los dejaron sin objeto DD-230 y DD-218.
- ~~**52 · El tema del plugin que recibe el equipo externo lleva Custom con el valor del oscuro (medido el 2026-10-17)**~~ → **HECHA el 2026-11-03**: en el export, `semantic.text.heading`, `subtle` e `inverse` ya apuntan a sus variables. `accent` sigue sin decidir.
- ~~**La cifra principal del resumen, con color (DD-161, 2026-10-04)**~~ → **HECHA el 2026-11-03**: la tarjeta destacada con degradado y anillo, en `group-summary` `15486:188` y `agent-summary` `15510:72610`.
- ~~**El alta, el listado y la tabla al pie (DD-158 a DD-160, 2026-10-04)**~~ → **HECHA el 2026-11-03**: el pie del alta de Agentes y el listado de Grupos `3118:17013` sin la columna «Asignar».
- ~~**Estado del agente en su columna (DD-156, 2026-10-04)**~~ → **OBSOLETA el 2026-11-03**: DD-218 quitó el estado de «Agentes asignados».
- ~~**36b · El color de etiqueta marrón (2026-10-05, DD-176)**~~ → **HECHA el 2026-11-03**: `tag` `Severity=Label`, `Color=Brown`, en `amber/100` y `amber/900`, como `--sc-label-brown-*` y la etiqueta «Marrón» de sc-docs. `chip` sin colores: ninguna pantalla lo usa con color.
- ~~**54 · «Fuera del DS»: cerrada, y la página se borra**~~ → **HECHA el 2026-11-03**: ninguna ficha quedaba como «se queda»; la página `3034:114` se borró (la versión de antes del repaso la conserva). Cada ficha salió por A (ya existe y se usa), B (se queda con su porqué) o C (pieza para el Kit, §67). La ficha 1, hecha en el prototipo (DD-97).
- ~~**58 · Los flujos que faltaban en Grupos y Agentes, y lo que la librería no tiene para ellos (2026-10-21)**~~ → **HECHA el 2026-11-03**: los flujos, en el Supervisor desde el 2026-10-21 (V1 a V7 del alta de grupo, el listado de Agentes, X1 a X3); y lo de la librería, hecho: Custom modal y `.Subsection` plegable publicados, `group-summary` con las filas en slots (V1 vuelve a ser instancia; V5 no tiene resumen propio) y `key` en «Expirar contraseña».
- ~~**65 · «❖ Alert modal» con su superficie blanca (DD-242, 2026-10-31)**~~ → **HECHA el 2026-11-03**: `Surface` (`Tinted` y `Plain`) en el conjunto `15876:698`, publicado, y los 22 avisos del Supervisor en `Plain`.
- ~~**66 · Repaso del Supervisor del 2026-11-03: lo que no se hizo y las piezas que pide el Kit**~~ → **HECHA el 2026-11-03**: Tipificaciones (DD-244), Equipos sin «Nombre repetido» (DD-235), el hub de Repositorios cerrado, las notas sin lo que solo existe en este repo, Usuarios (§68) y los iconos nuevos publicados y en uso; las piezas que pedía al Kit, decididas y hechas en §67.
- ~~**67 · Lo que el Kit no tiene: una regla y una decisión por pieza**~~ → **HECHA el 2026-11-03**, publicada y en uso en el Supervisor: tono de etiqueta, drawer acoplado, parte plegable, `group-summary` en slots, `Surface=Card`, `summary-kpi`, `inputnumber` `Type=Plain`, `kbd`, solo lectura, `menu-item` con texto al final y siete iconos; `Nav-menu` con las filas en blanco y radio 12, también publicado. **La regla sigue valiendo** para cada pieza nueva: (1) si PrimeNG lo tiene, variante o propiedad del componente que lo representa; (2) si no, y lo usa más de una pantalla, pieza propia del Kit, en inglés; (3) si lo usa una pantalla, componente local; (4) el color sale del Kit, y la familia que falte se añade con los valores del código; (5) variantes, solo las combinaciones en uso.
- ~~**68 · Usuarios maquetada de nuevo, contra el prototipo (cuarta vuelta)**~~ → **HECHA el 2026-11-03**: la página al nivel de las demás (índice, hand-off, alta, edición, listado y mapa), con `Surface=Card`, `summary-kpi` y `hub` en «Servicios asignados» desde el Kit publicado.
- ~~**69 · Grupos: qué se ve con Email en Distribución y colas**~~ → **HECHA el 2026-11-03**: Otras configuraciones 10, 11 y 12 con Email; «Ir a» como componente local «Channel jumps» (`4568:27273`, regla 3 de §67) en las pantallas con dos o más canales; hoja y mapa al día.
- ~~**2 · Lo que Config cambió en código y Figma aún no sabe (2026-09-13)**~~ → **HECHA el 2026-11-03**: la pastilla de etiqueta sin punto (`Severity=Label`) y a 600 (`tag/font/weight`, ficha 38); `--sc-text-heading` en `semantic/text/heading`; la etiqueta IFTA, a 400. Las tarjetas de opción de Servicio y el interruptor de los ajustes de Grupos, de Contact Center, van con su evolutivo.
- ~~**37 · El resumen de la ficha de grupo lleva a su sección (2026-10-02)**~~ → **HECHA el 2026-11-03**: `group-summary` gana `Enlace` (Reposo, Al pasar y Foco; las dos últimas, solo en Edición, regla 5 de §67). Al pasar, «Distribución» subrayado en su color, a 1,75 del texto; en foco, el trazo exterior de la miga, atado a `focus/ring/width` y `focus/ring/color` (`sky/500`), a 2 del texto, como `.resumen__enlace:focus-visible`. Sin piezas ni variables nuevas.

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
- ~~**§55 · Lo que falta se dice al pulsar Crear, grupos sin canales, duplicar sin diálogo y Recursos en chips
  (DD-217)**~~ → **HECHO el 2026-10-21** en el fichero del Supervisor, contra el build de `main` servido en
  `sc-supervisor.pages.dev` (`98e6ddce`; los despliegues `proto-sismac-4058` y `-4062` seguían en `e1801cc7`).
  Altas de grupo y agente: «Crear» siempre activo; E1 y E2 rehechos como «Crear pulsado con lo pendiente», con el punto
  rojo y su texto debajo en el índice y el error en cada campo; en el agente, «Siguiente» avanza sin marcar nada.
  Resúmenes sin «Falta» ni «Listo», «Sin agentes» a 0 y «Sin número» sin icono: `nav-item`, `group-summary`,
  `agent-summary` y `multiselect` pasados a la versión publicada de la librería (210 instancias en Grupos y Agentes; el
  resto de componentes, sin tocar). Recursos: Agendas, Equipos y Plantillas sin «+», a media columna, con chips al
  editar; título con `library_books`. «Agentes asignados» con `headphones`. Edición de grupo: E2, guardar sin nombre;
  E3, sin canales se guarda. Edición de agente: E2, guardar sin email. Hojas «Cómo se comporta» de las cuatro fichas,
  mapa de componentes, Hand-off e índices reescritos. Versión del fichero: «§55 y §56: Grupos y Agentes al día con el
  prototipo (2026-10-21)». 30 capturas, fuera del repo.
- ~~**§56 · Grupos como sus páginas de COA (DD-218)**~~ → **HECHO el 2026-10-21**. Listado sin columna ID; la cifra de
  Agentes lleva a la ficha; con varios marcados, menú con solo «Eliminar» y «¿Eliminar 3 grupos?» (pasos 08 y 09);
  duplicar abre «Nuevo grupo» con la copia y el toast sale al crear (pasos 03 y 04); eliminar dice el nombre, con
  «Eliminar» en rojo, en grupos y agentes. Las siete tablas de «Agentes asignados» y «Grupos asignados»: flecha de
  ordenar en «Agente» y «Grupo», sin filtro ni punto de estado. Estados nuevos: E3 del alta de grupo, la confirmación de
  columna entera (`confirmpopup` del DS, «¿Deshabilitar 2 agentes?» con «Deshabilitar»); E4, un agente con «Activación
  por grupo» y su tooltip; E7 de la edición, «Gestionar en Repositorios» con cambios («¿Guardar los cambios?»). Toasts
  con «». Listados de agentes con su columna de casillas. Lo contratado, como nota en las hojas. **Sin maqueta, solo en
  la hoja:** el desplegable «Nivel {canal}» (con la estrategia Niveles) y «Tipificar conversaciones» deshabilitado
  cuando no hay tipificaciones. **Visto de paso, sin tocar:** las tablas de asignados de Figma van en tamaño normal
  (14 de relleno) y el build en `small` (7), por eso en Figma «Habilitado», «Chat» y «Email» van más anchos que en
  código; y los botones de la cabecera van en `sm` (27) frente a `md` (33) en el build.
- ~~**§57 · Lo que falta, como SISMAC-4058 (DD-219)**~~ → **HECHO el 2026-10-21**. En la librería, `summary-status`
  (Falta / Listo) arriba de `group-summary` y `agent-summary`, con «Mostrar estado». En el Supervisor, los 41 resúmenes
  de Grupos y Agentes en esa versión: cada alta con su «Falta: …» (grupo: «nombre, teléfono saliente» vacía y
  «teléfono saliente» después; agente: «nombre, email, extensión, un grupo» y luego «un grupo») o «Listo para crear»; al
  editar, la línea apagada salvo en las E2 («Falta: nombre», «Falta: email»). «Crear» y «Guardar» apagados; bajo cada
  obligatorio vacío, su aviso en gris con punto; en rojo y sin foco solo al dejar el campo vacío (E1, E2 de edición) y,
  tras Ctrl+S, con el foco en el primer pendiente (E2 del alta). Notas, hojas y hand-off con la regla; el tooltip, descrito.
  Versiones del fichero: «Lo que falta, antes de pulsar», «Lo que falta: el rojo sin foco al salir del campo» y
  «Resúmenes con la línea Falta / Listo (librería publicada)». La ficha de usuario no tiene maqueta.
- ~~**§59 · El nombre del listado de grupos tiene tope (DD-187 §7)**~~ → **HECHO el 2026-10-22**. La fila 5 de «Cómo se
  comporta: listado de grupos» (`3131:11194`) decía «Nombre: ancho flexible, mín. 240» y «Acciones: 56», la regla de
  antes de DD-187 §7; ahora, «mín. 240, máx. 384» y Acciones con el sobrante, el ⋮ pegado al borde derecho. En las nueve
  tablas del flujo (`3118:16995`) y en la copia del Mapa (`3178:11368`), Nombre fijo a 384 y Acciones en FILL (595, como
  la app a 1920: Nombre 384 y el ⋮ con 599). Con ellas se movieron los números 7 y 8 de la guía del paso 01, el menú de
  la selección del paso 08 y los recuadros de Canales a Agentes del Mapa. El listado de Agentes (`3405:12408`) ya medía
  así y su hoja no lo contradice. Versión del fichero: «Listado de grupos: Nombre a 384 y el sobrante en Acciones
  (DD-187 §7)».
- ~~**§60 · El índice del alta de grupo con su marcador de paso (DD-222)**~~ → **HECHO el 2026-10-22**. En la librería,
  `nav-item` con las marcas del alta con pasos (Paso pendiente, actual, nuevo, hecho y con error: marcador y una línea
  que pasa también bajo él, en una línea y con «…»), Hecha de vuelta al ✓ de las altas sin pasos y Con error al punto
  de la edición; rótulo e icono atados en las 27 variantes (clonar una variante pierde ese enlace). En ❖ Navmenu, la
  ficha «Cómo se comporta: índice de una ficha» (`15742:347`). En Grupos, el índice de las 17 pantallas del alta, la
  copia del listado y las cuatro del Mapa como el prototipo en cada paso; el resumen sin «Falta» ni «Listo para crear»;
  hojas, tarjetas, Hand-off y mapa al día, con el número de WhatsApp obligatorio; y la fila «Interacción del índice»
  (`3654:76460`, I1 a I8). Agentes y Tipificaciones, con su ✓ (medido). Queda fuera: `group-summary`, de otra librería,
  con «Mostrar estado» encendido por defecto. Versiones: «Grupos: índice del alta con marcas de paso (DD-222) e
  «Interacción del índice»» y «nav-item: Paso hecho con rótulo e icono atados».
- ~~**§61 · La ficha de grupo, como su página de COA publicada (DD-223)**~~ → **HECHO el 2026-10-22** en la página
  Grupos (`41:2847`). Tres pantallas nuevas: V8 (`3678:25449`), solo «Permitir comentarios» con «En qué
  conversaciones», en «Otras configuraciones»; E5 (`3681:25364`), un agente sin canales del grupo con «Sin canales
  compatibles» y el candado, y el Custom modal «¿Sacar del grupo a 1 agente?» con «Cancelar» y «Sacar» en rojo; V9
  (`3682:26036`), el grupo recién creado en «Asignados» con «Sin agentes asignados» y «Asígnalos desde la pestaña
  «Todos».» (V7, con búsqueda, sin tocar). V1 y V2 con el rótulo «En qué conversaciones». Hojas del alta (filas 7, 8,
  12, 14 y 16) y de la edición (fila 1: la entrada desde la rueda de la monitorización, solo administradores, sin
  maqueta; fila 7: el aviso al guardar), Hand-off con la rueda y el marcado automático, portadas e índice de Grupos.
  Versión del fichero: «Grupos: §61 DD-223».
- ~~**§62 · Grupos: lo que no cuadraba en el repaso entre COA, Figma y prototipo (DD-224)**~~ → **HECHO el
  2026-10-22** en la página Grupos (`41:2847`), tras leer entero el texto de sus hojas contra la congelada 4058. Alta
  (`3033:18497`), fila 7: «Editar en Repositorios», con cambios, cierra el detalle y pregunta lo mismo que «Gestionar en
  Repositorios», y «En qué conversaciones» lleva «Solo salientes» solo con Call Blending; fila 17 y hand-off
  («Lo que falta, antes de pulsar»): el rojo también al dejar la sección sin el campo, y lo que aparece después en ella,
  ya en rojo. Edición (`3064:15154`), fila 7: la misma pregunta para «Editar en Repositorios». Tarjeta de «Otras
  configuraciones 2». Listado (`3131:11194`), fila 8: el tooltip de Agentes con 15 nombres como mucho y «y N más»;
  fila 12: lo apagado es «Exportar», no el botón «Acciones». Notas de Dev Mode de «Si algo falla 5» y «Otras
  configuraciones 8» y «9» con punto final, y la capa de la fila 14 del alta, «Fila: 14. Agente». Versión del fichero:
  «Grupos: repaso COA, Figma y prototipo (DD-224, §62) (2026-10-22)».
- ~~**§63 · Grupos: Agendas y Plantillas fuera de Recursos, y el aviso de borrar sin «grupos» (DD-239)**~~ → **HECHO el
  2026-10-28** en el fichero Supervisor (`Hjyy41SYKqcRuIzCGggfYH`), solo ocultando capas y retocando texto, sin dibujo nuevo.
  Página Grupos (`41:2847`): oculto el bloque «Repositorios» de Recursos (Alta, Edición y Mapa de componentes: 3) y la fila
  «Recursos» de la caja resumen (36, en Alta, Edición, Listado y Mapa), más la ayuda «Lo que se asigna desde Repositorios»
  (3). Notas de Dev Mode al día: la de Recursos y el paso 5 del alta dicen que se oculta (DD-239), la del resumen ya no suma
  «Plantillas de chat», y el Mapa lo anota. Páginas Plantillas (`4077:58411`): «Los agentes que la tengan asignada
  perderán la referencia» en las tres notas del borrado. Versiones: «Grupos: antes de DD-239…» y «Grupos y Plantillas:
  Agendas y Plantillas solo a agentes (DD-239, §63)». «Si algo falla 7 / Edición de grupo / Gestionar en
  Repositorios con cambios» (`3314:65868`) se queda como el COA 4058, que aún lo recoge: el enlace va con el bloque oculto y
  su nota lo dice; el aviso sigue vivo en «Editar en Repositorios» de la tipificación.

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
