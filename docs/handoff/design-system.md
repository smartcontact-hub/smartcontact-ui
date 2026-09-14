# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
>
> **El sello vive en CADA TRAMO, debajo de su título. El de más arriba es el vigente.**
> Aquí no se copia: esta cabecera no tiene estado, así que dos sesiones a la vez no se pisan
> en ella. Antes sí lo tenía (un bloque con el sello vigente más cuatro «Sello anterior» que
> repetían el resumen de su sección) y era justo lo que se peleaba en cada fusión: el 2026-09-04
> se coló un párrafo DUPLICADO al resolver un conflicto, y nadie lo vio.
>
> **Cómo se nombra un tramo**: `## ✅ <fecha ISO> · <lo que pasó>`. Sin contador `sNN`, que era
> un entero global que dos sesiones en paralelo no pueden incrementar a la vez: el 2026-09-04 las
> dos se llamaron «s43» y hubo que renumerar una al rebasar. La fecha no necesita que nadie se
> coordine. Los `sNN` de los tramos viejos se quedan como están: los nombran commits y
> `docs/DECISIONS.md`, y reescribirlos solo desincronizaría el doc de su propia historia.

## ▶︎ SIGUIENTE — sin preguntar

> **La bandeja del frente, y por eso vive ARRIBA.** Entran dos cosas: lo que queda por hacer, y
> **el tema que aparece a mitad de sesión y NO bloquea** lo que estabas haciendo. Si bloquea no
> es un apunte: es parte del trabajo en curso y se termina ahí mismo.
>
> **Al abrir sesión, lee la lista ENTERA antes de coger nada.** Los apuntes que se tocan entre sí
> son UNA tarea, no tres: agrúpalos en un solo encargo. Esta ficha estuvo hasta el 2026-09-10 con
> esta sección en la línea 2500 de 2685, enterrada bajo el histórico, y el precio fue medible:
> cada hallazgo abría chat propio en vez de esperar aquí, y una rama llegó a vivir en dos cajas a
> la vez (`verdict-avisa-pr-fundido` y su `-2`: el mismo SHA `4964d47` en la local y en `origin`).
>
> Lo cerrado NO se tacha aquí: se baja al histórico del final del fichero.

**LO SIGUIENTE, en orden (Rafa, 2026-09-13: «automatizable, agéntico: no ir a mano salvo que sea necesario»):**

0. **«Aura + color de marca» y el export en un clic** (encargo del 2026-09-13; mediciones en
   `~/Documents/Claude/2026-09 aura-marca/`). Hecho: robot (DD-82, #152), paleta del export (DD-83), capturas
   (DD-84), «vuelve a Aura» y lo vigente de marca y densidad (DD-87). Siguiente: (a) `conectar-medidas` ya aterrizó
   (DD-85, DD-86): alinear EN FIGMA las 123 medidas de PrimeOne que Aura cambió (por nombre de escala)
   y que llegue por el robot: primera prueba real del clic; (b) zip del equipo externo desde nuestro tema;
   (c) densidad: HECHO, 32,5 con el interlineado de la rampa (DD-91). Ojo: el plugin corre el workflow de LA RAMA; un robot nuevo entra un export después.
1. **Lo que dejó el barrido (DD-77/78)**: «Solo fallidas» es un filtro conmutable hecho a mano. La sonda
   ampliada ya existe fuera del repo (E = 209 piezas, `2026-09 aura-marca/`): falta traerla como spec.
   Regla de Rafa para lo que dude: manda Aura en código y Figma se alinea.
   `danger` a 3.76:1 = valor de Aura, aceptado (DD-78).
2. **sc-docs: ejemplos de primeng.dev dentro de `<sc-datatable>`**, la red de «la tabla perfecta»: pasa
   ~20 de las 79 entradas de `p-table`.

- **La barra de búsqueda de Usuarios, Agentes y Grupos no se queda fija al hacer scroll** (visto el
  2026-09-14, DD-90): es `sticky` dentro de `.page`, pero el que hace scroll es `main.app-shell__content`.
  Falla igual antes y después de DD-90. Mismo mecanismo que DD-80 resolvió en las tablas.

**APARCADO por Rafa para OTRA sesión (2026-09-13): nuestros componentes contra Aura tal cual.**
«Si te instalas Aura y le pones este styling estamos así»: una ficha por componente que diga qué
cambia nuestra capa sobre el `p-*` de primeng.dev, para que el código de cualquier equipo hable el
mismo idioma. NO es contra el DS de Carlos: es contra Aura puro. El método ya está probado: con
esbuild se empaquetan `sc-preset/index.ts` y `@primeuix/themes/aura`, y
`Theme.setTheme` + `Theme.getComponent(nombre)` de `@primeuix/styled` dan el CSS de variables de
cada componente para compararlo clave a clave. Ojo: comparar el ÁRBOL del preset engaña (Aura
trae `light-dark()` arriba y nosotros `colorScheme`, y gana lo nuestro); lo que vale es el CSS.

**Lo que deja la base Aura (2026-09-13), pendiente de mirar o de decidir:**

- **Tooltip a 12px** (heredaba 16 del `<body>`; ahora el `0.75rem` de Aura). Un uso. ¿Figma?
- **Menús y desplegables a 14** (salían a 16 en el `<body>`). Mejora, pero se ve en toda la app.
- **Conversaciones**: filtros de 12 junto a campos de 14. ~~«Servicio» parte nombres~~ → no (DD-76).
- **Grupos**: confirmar con producto los «segundos». Lo de Figma, en `docs/figma-pendiente.md` §2.

**Lo que dejó el barrido de estilos de texto del 2026-09-11 (tarde), pendiente de RAFA:**

- ~~**12/20 no es ningún estilo**~~ → se mudó a [`docs/figma-pendiente.md`](../figma-pendiente.md) §4.
- ~~**`sc-docs` es la siguiente tanda del barrido**: 237 reglas~~ → **HECHO en parte el 2026-09-12,
  y las 237 eran la cifra equivocada.** **122 de ellas son `/validar`**, que imita el INSPECTOR DE
  CHROME a propósito y lo dice en su propio fichero desde que se escribió: tokenizarlo le quita al
  simulador lo único que enseña. El alcance real eran 115, de las que se migraron 60 y quedan 55
  con su trinquete (`TIPOGRAFIA_SUELTA_DOCS_MAX`).
  **Las 55 que quedan NO son pereza, son tres familias medidas**: `code`/`kbd`/`pre` (su mono lo
  pone el NAVEGADOR, no una regla, así que la clase se lo quita: 88 nombres de token se quedaron
  en Inter en la primera pasada), reglas con familia propia o `font:` shorthand, y **elementos
  CONTENEDOR** — ahí la clase arrastra a todo lo que solo heredaba: 1.122 `<code>` y 353 `<td>` se
  movieron de golpe antes de acotarlo.
  ⚠️ **Lo que queda pide DECISIÓN, no otro barrido**: cuatro `hero__title` a 32px y seis textos a
  16px (ninguno es peldaño), y qué hacer con los contenedores.

**Lo que deja la segunda vuelta a `/config/aed/servicio` (2026-09-12 tarde), y NINGUNO bloquea:**

- ~~**Las etiquetas de campo a 12 regular** y **`sc-tag`/`sc-chip` a 500**~~ → **HECHO el
  2026-09-13**: las 25 `.field__label` de seis ficheros a semibold, y pastillas a 600.
- **Las seis casillas de la tabla de notificaciones salen MARCADAS y deshabilitadas** cuando no hay
  URL: dicen «esto está encendido» de algo que no puede dispararse. Arreglarlo es decidir si el
  valor por defecto debería ser `false` — es producto, no maquetación.

**Lo que queda de la tanda «adelante a todo» del 2026-09-11** (los dos apuntes de la revisión de
Orca se cerraron en el #113; `agent-mini` entró en el CI; la doc, en su PR):

- ~~**El rastreador de textos NO está commiteado**~~ → **HECHO**: vive en `tools/text-census.mjs`,
  con las cuatro cosas que lo hacen fiable escritas dentro (texto PROPIO y no `textContent`; clave
  con ordinal; el selector ignora `sc-text-*` o el diff sale vacío por construcción; y medir el
  RUIDO primero — dos pasadas del mismo build, 0 diferencias). Se había reescrito tres veces.
- ~~**Los inputs públicos sin ejemplo**~~ → **CERO el 2026-09-12** (eran 66 el día anterior). Todo
  input público del DS sale en un ejemplo de su página o en un control de su Playground, y el
  trinquete en 0 deja de medir deuda para pasar a proteger.
  ⚠️ **11 de los 66 nunca fueron deuda, era el gate**, y las cuatro veces el fallo era LEER DE
  MENOS: `\w+AriaLabel` pedido por nombre en vez de por patrón · los knobs cortados en el primer
  `],` cuando un control lleva sus `options` en varias líneas (leía 9 de 20 en `sc-dialog`) · el
  binding de DOS sentidos `[(x)]` sin reconocer, que es justo como se abre un diálogo · y los
  snippets escritos EN LÍNEA en la story, que no son constantes. Cada uno lleva ya su test rojo.
  Un guardián que reclama lo que ya está hecho enseña a ignorarlo.
  ⚠️ **Un valor por defecto de un knob puede cambiar la demo**: `sortField: 'name'` dejaba la tabla
  ya ordenada y los e2e de gestos empezaron a abrir otra fila. Los knobs arrancan en el valor que
  el componente ya tiene.
  ⚠️ **Tocar una página con métrica cuesta TRES redes**: captura visual, HTML congelado y estilos
  computados. Hay que correr `npm run e2e` ENTERO en local — el preflight no lo incluye (DD-60).

**Lo que deja el 2026-09-12 (la vuelta a las tablas, DD-72), medido y sin hacer:**
- **Gate pendiente: la cabecera que se congela al cambiar de idioma.** `audit:datatables` §6 solo mira un `computed` llamado `columns` y solo en páginas con `<sc-datatable>`; el 2026-09-12 el fallo (`translate.instant` en un `computed` sin `currentLang`) estaba en CINCO, dos sin tabla. Hace falta un gate de toda la app, con parser de bloque y caso rojo.

- **Lo que solo se puede tocar en Figma vive ahora en su propio fichero**:
  [`docs/figma-pendiente.md`](../figma-pendiente.md). Allí están la divergencia del título de sección
  (DD-74), la decisión 18-o-20, y lo que quedaba suelto de otras sesiones. **No lo dupliques aquí**:
  una cosa que solo puede hacer una persona en Figma no es trabajo de la próxima sesión, y en esta
  bandeja se leía como nota al margen — tanto que una llevaba tiempo resuelta sin que nadie la
  tachara.
(Las otras dos de esta bandeja —la piel por defecto sin anclar y la falta de guardián para
las 38 ranuras— se cerraron el mismo día en DD-73.)

**Lo que dejó s42, medido y sin hacer:**

- ~~**El tier `app/typography/xl|xxl`**~~ → se mudó a [`docs/figma-pendiente.md`](../figma-pendiente.md) §3.
- **`--sc-font-size-caption-bold` está declarado y tiene 0 usos.**
- **`display-1` se quedó sin consumidores y `h1` con uno que es solo fallback.** Es el estado
  honesto tras DD-48 (la rampa era aspiracional desde DD-13), no una regresión: la rampa ya dice
  la verdad y espera consumidores de PRODUCTO. Si el Supervisor adopta la rampa, es ahí.

1. ~~**El eslabón que falta: nadie compara *fichero de Figma ↔ export*.**~~ → **HECHO el
   2026-09-12 y sale LIMPIO**: `tools/figma-export-parity.mjs <capa>` comparó **844 tokens en las
   seis capas, cero divergencias** (no es gate de CI: necesita el bridge abierto). ⚠️ **Las cuatro
   trampas de la sonda están escritas DENTRO de esa herramienta** —RGBA por los dos lados, alias
   por los dos lados, cada alias resuelto EN SU CAPA, y la gorda: **el `modeId` no viaja entre
   colecciones**, que me dio 21 de 24 familias «discrepando» cuando el que fallaba era yo. Léelas
   ahí antes de tocarla.

2. **El 1:1 web↔Figma de chip · toast** — ~~tag~~ hecho en DD-76 con el bridge enganchado: ya no es
   «bloqueado por herramienta», es trabajo. Ver la sección de Figma más abajo.
3. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)** que quede tras
   s34, y **los cabos de DD-24** (round-trip de iconos) en [`ROADMAP.md`](../ROADMAP.md).

## ✅ 2026-09-14 · Los controles llevan el interlineado de la rampa, atado en Figma (DD-91)

**Sello:** rama `arebury/densidad-controles` sobre `1707074` (#159). DD-91. Rafa: opción 1 «con 20/18», «adelante».

**Lo que cambia.** Campo y botón md 29,5 → 32,5, sm 24 → 27, lg 36 → 40; Conversaciones no pierde filas (13 con la barra de DD-90).
Figma primero (1.570 textos de maestros de control atados a `app/typography/*/lineHeight`, dos versiones
guardadas) y `css.ts` con una regla por talla. `sc-inputtext/select/multiselect/datepicker` dejan de
escribir tallas a mano. Página, capturas y sondas: `~/Documents/Claude/2026-09 densidad-controles/`.

- ⚠️ **La regla de `css.ts` vive en `@layer primeng`**: un wrapper sin capa le gana siempre. Antes de mover
  un token de tipografía, busca tallas a mano en los SCSS de wrappers.
- ⚠️ **Por el bridge, carga fuentes con `t.fontName`**: con `getRangeAllFontNames` una docena de textos agota 30 s.
- **Colección «App» (DD-92)**: se queda como alias de Custom; el DS ya no la usa y el Supervisor la hereda
  (939 enlaces) hasta actualizar la librería. Revisar más adelante si se borra. De DD-91: hora del datepicker 17,5 contra 14; botón solo icono no cuadrado; filtros 2px.

## ✅ 2026-09-14 · La barra de arriba baja de 91 a 75 y el título queda a la distancia de Aura

**Sello:** rama `arebury/aura-spacing-scale` sobre `4c150f9` (#157). DD-90. Rafa, visto en local: «me gusta».
El tramo «Aura es la base del tema» (2026-09-13) vive en el tag `archive/handoff-ds-2026-09-14-aura-base`.

**Lo que cambia.** `sc-breadcrumb flush` y la TopBar lo usa (91 → 75). Título → contenido `scale/1` en las
13 pantallas con `page__heading` (antes 21, y 31,5-33 en cuatro). Evaluación de por qué Aura no engorda y
simulación de la densidad con ese reparto: `~/Documents/Claude/2026-09 aire-aura/index.html`.

**Lo que hay que recordar**, porque volverá a morder:

- ⚠️ **Si la escala pasa a 16, el aire de página crece un 14 %** con ella (≈690 usos de `--sc-spacing-*` en el
  Supervisor): la simulación da barra 101 y 11 filas en Conversaciones. Con el recorte de Aura (un nombre
  menos donde es aire de página) da 73 y 13 filas. Es parte de la decisión de densidad, no un extra.
- ⚠️ **Un componente de Aura que se dibuja como barra suelta (miga, toolbar) suma su relleno** si lo metes
  en otra barra: mira su `padding` antes de culpar al interlineado.

## ✅ 2026-09-14 · El robot de tokens deja de ponerse rojo por lo que Figma cambia a propósito

**Sello:** rama `arebury/aura-brand-theme-figma`, HEAD `5123008` (#143) más este cambio. DD-82. Rafa: «adelante».

**Lo que cambia.** Los tests de métrica leen el export; el robot regenera las referencias de estructura
y estilos si es lo único que cae, pone rojo un token que pasa a 0, escribe la portada en llano y deja el
check `tokens-sync` en su commit.

**Lo que hay que recordar**, porque volverá a morder:

- ⚠️ **Playwright carga los helpers como CommonJS**: un `.mjs` con `import.meta` no se puede importar
  desde un spec. Y lo que un `.ts` del arnés importa, `tsc` lo revisa: anótalo con JSDoc.
- ⚠️ **`tokens:import` no corrige un 0** del export. Las familias de color ya salen del export (DD-83).
## ✅ 2026-09-13 · La cabecera de Conversaciones se queda arriba, y una etiqueta ya no se parte

**Sello:** rama `arebury/fix-conversaciones-sticky-header` sobre `b7db531` (#140). DD-80. Rafa, visto en
local: «me gusta». 161 e2e del Supervisor en verde.

**Lo que cambia.** `<sc-datatable stickyHeader>` fija la cabecera al scroll de la página (la pinta el
tema); `.table-card` pasa a `overflow: clip`. Una etiqueta es una línea: recorta y enseña el valor al
pasar el ratón. El ID de Conversaciones pasa a 133 (se salía a cualquier ancho).

**Lo que hay que recordar**, porque volverá a morder:

- ⚠️ **`p-table` pone `overflow: auto` EN LÍNEA a su contenedor, siempre**: cualquier `sticky` de página
  dentro de una tabla necesita `!important` ahí, y ninguna caja por encima con `hidden` o `auto`.
- ⚠️ **Un `<thead>` fijo crea contexto de apilamiento**: sin `z-index` las filas (celdas `relative`)
  pintan ENCIMA. Mide `elementFromPoint`, no solo el `top`: la posición salía bien con el fallo puesto.
- **Una rueda lanzada nada más pintarse la tabla se pierde** (`scrollTop` 0): el spec la reintenta.

## ✅ 2026-09-13 · Conversaciones lleva la piel de Aura, las pastillas salen del tag del DS y el producto deja la mono

**Sello:** rama `arebury/conversaciones-piel-aura`, con `main` fusionado hasta `b7cd451` (#137). DD-76.
Rafa, viéndolo en local: «me va gustando», «beben directamente del DS», «no queremos cosas en mono».

**Lo que cambia.** Conversaciones sin piel propia (8/14, fila 44.5), anchos medidos y sin ⋮. Tipo,
Estrategia, Servicio y Grupo usan `sc-tag` secundario, que baja a 1.75 de relleno (21.5, maestro
`373:13337`). Doce sitios dejan la mono. La selección en oscuro de las 25 listas deja de salir clara.
**Barrido (DD-77, #139) y hub (DD-78)**: 140 pastillas a mano pasan a `sc-tag`/`sc-badge`, el hub de
Repositorios al `Menu` del DS, inventario de `hand-made-pieces` a CERO; Figma revinculado (Agentes ×3).

**Lo que hay que recordar**, porque volverá a morder:

- ⚠️ **Mi sonda de piezas a mano leyó de menos dos veces**: excluía lo que vive DENTRO de un `sc-*` (las
  celdas) y pedía radio ≥3 (`sc-label` tiene 2). Se atribuye por `_ngcontent-X` → `_nghost-X`.
- **`<kbd>`/`<code>` salen en mono por la hoja del navegador** (así sobrevivió el «⌘K»): mide lo CALCULADO.
- **Invertir `_layers.scss` no invierte nada**: PrimeNG antepone `@layer reset, primeng`. El testigo
  nuevo del test de capas (tinte de la fila fallida) se vio rojo quitando la regla.

## 🗄️ Histórico de la lista SIGUIENTE — ya cerrado

> Lo que queda VIVO está **arriba**, en `▶︎ SIGUIENTE`. Aquí solo el registro de lo que se cerró:
> se conserva porque explica por qué las cosas están como están, no porque quede algo que hacer.

1. ~~**El P0 del field-pattern ×5**~~ → **HECHO 2026-08-30 ([DD-44](../DECISIONS.md))**. No fue
   «extraer un CVA a mano»: se **BORRÓ** el ControlValueAccessor de los SEIS campos (los 5 +
   `sc-search`), porque no lo ejercía nada (0 Reactive Forms, 0 ngModel externo; las apps usan
   `[(value)]`), y Angular 22 → Signal Forms es su sustituto estructural. La lógica compartida
   vive en `components/field/sc-field.ts` (3 factories). Reconciliado el estado: `invalid` a los
   5, `focused`/`blurred` a los 3. ~265 líneas netas fuera. Cada paso verificado contra el
   baseline de estructura (`ng serve`, no AOT: el `dist` emite `<!---->` donde `ng serve` emite
   `<!--container-->` y confunde) + comportamiento + e2e:supervisor. **Sigue abierto** solo lo
   que se dejó FUERA con motivo: `radiobutton`/`textarea` sin field-pattern (no son CVA, escrito
   a propósito), y el `scFieldHost` para el host class-binding (indirection por ~6 líneas — no
   compensa).
2. ~~**La rama `aura/custom` del Kit no la vigila nadie**~~ → **HECHO**, y la descripción que
   llevaba esta ficha era imprecisa: `aura/custom` **sí** salía en el censo de §7b (visible), lo
   que le faltaba era entrar en el **gate de completitud de §8**. Ahora entra, con sus 52 hojas
   clasificadas midiendo el consumo real:
   - **19 `flows`** — `primitive.typography.*` es la FUENTE de `--sc-font-size-*`,
     `--sc-line-height-*` y `--sc-font-weight-*` (`01-primitive.css:258-291`), verificado por valor.
   - **7 `divergence`** — `text.accent` (Kit violet, DS sky-600 por contraste) · las 5 de
     `presence` (**taxonomías distintas**: el Kit trae available/unavailable/administrative/
     talking/wrap-up y el DS available/paused/training/offline, con hexes curados a AA) ·
     `dialog.icon.color` (el Kit lo quiere a color de texto pleno, el DS atenuado).
   - **26 `not-consumed`** — todas las de `bulktranscriptionmodal`: **no existe ninguna
     `--sc-cmp-bulktranscriptionmodal-*`**; ese componente se estiliza con 36 tokens semánticos
     directos. Elección válida, pero ahora el censo lo dice en voz alta en vez de aparentar que
     fluye.

   Cubierto por 3 tests en `scripts/__tests__/coverage-map.test.mjs`, uno de ellos la **cara
   roja** (un custom nuevo del Kit → `unmatched`), que es justo lo que se escapaba.
3. ~~**La cabecera fija de Conversaciones no fija**~~ → **HECHO 2026-09-13 (DD-80)**: tres causas, no
   dos (la tercera, las filas pintando encima del `<thead>`), y a 1280 las etiquetas recortan.
## ⏸️ ESPERANDO A RAFA — NO preguntar

> Auditada fila a fila el 2026-08-25. Las que ya no procedían salieron; las que quedan llevan **su
> verificación de esa fecha**, no la razón heredada.

| Qué | Estado |
|---|---|
| ~~**Borrar el proyecto Cloudflare `sc-demo`**~~ → **HECHO por Rafa (2026-09-01)** | Proyecto borrado de Cloudflare. Su check «Cloudflare Pages: sc-demo» todavía sale en rojo en el último commit de `design-tokens-sync`: es un snapshot HISTÓRICO de cuando existía (no vuelve a correr sobre un commit viejo), se limpiará solo en el próximo push del bot de tokens. |
| **`org-profile.md`** | `smartcontact-hub/.github` → `profile/README.md` → **HTTP 404** (re-medido 2026-08-25): no está pegado. El borrador sigue en `docs/org-profile.md` |
| ~~**Un primary dark conforme, pero desde el KIT**~~ → **HECHO en DD-81 (2026-09-13)**: el Kit ya lo trae (sky-300 con texto zinc-900, el patrón de Aura) y las filas de `color-map.mjs` volvieron a `enforce` |
| ~~**Lienzo de página gris↔blanco**~~ → **DECIDIDO Y HECHO**: [DD-45](../DECISIONS.md) lo llevó a BLANCO el 2026-08-31 (`app-shell.component.scss` pinta `--sc-bg-canvas`), y Rafa lo reconfirmó el 2026-09-11 («el lienzo sí, pasa a blanco») sin saber que ya estaba. La fila llevaba diez días mintiendo: si una espera se resuelve en otro tramo, hay que venir a tacharla aquí |
| ~~**Tramo actual del breadcrumb**~~ → **DECIDIDO, `bcab818` (2026-08-25)**: la propuesta de Figma `13890:157` (padres slate-500 `#8F97A3`) **se RECHAZA** — da **2,95:1** sobre blanco y no cumple AA. Se queda el código como está (padres slate-600, actual slate-700, ambos AA). Falta solo anotarlo en el nodo de Figma (Bloque 4). *Nota: el mismo commit tokenizó la miga a 14px, otro asunto ya cerrado.* |
| ~~**El botón de crear cambia de ancho entre listas**~~ → **HECHO, `bcab818` (2026-08-25)**: decisión de Rafa «que no cambie de anchura porque sí». `main.scss:205` → `.top-bar__actions button { min-width: 144px; max-width: 288px }`, anclado en clase NUESTRA. Los cinco (122–142px) aterrizan igual. Aplicado y en `main` |
| **B5b · prosa i18n del constructor** | Necesita ICU MessageFormat **y diseño**. Sigue aparcada |
| ~~**Experimento en LOCAL: la escala al tamaño de Aura (16px por rem)**~~ → **DECIDIDO 2026-09-14 ([DD-91](../DECISIONS.md))** | Rafa eligió solo el interlineado con la rampa que existe (20/18): 32,5 y 27, sin perder filas. La escala se queda a 14. Medido también escala 16 + 20/18: 34 / 28 y 11 filas. Simulación en `~/Documents/Claude/2026-09 escala-16/`; el nombre por clave y el gate de la escala entraron en DD-89 |

## 🔌 Figma — tres servers, y caen por separado

Tabla completa en [`AGENTS.md`](../../AGENTS.md) → *Figma MCP Bridge*.

- **`mcp__figma-console__*`** (Figma Desktop Bridge, `:9223`) — el de diario, lee **y escribe**.
- **`mcp__Figma__*`** — app de escritorio, **solo lectura** (6 tools). Sobrevive a que la nube caiga.
- **Nube** (`plugin:figma:figma`) — solo aporta librerías remotas y funcionar sin Figma Desktop.

⚠️ **Medido el 2026-08-25, y es la razón de que el 1:1 siga sin hacerse.** Que el panel del
Desktop Bridge diga *«Connected to 1 AI app»* **no significa que esta sesión lo tenga**: los
servidores MCP se enganchan al ARRANCAR la sesión, así que reconectar el bridge a mitad no añade
sus herramientas a una sesión ya abierta. Comprobado por búsqueda directa de nombre, no deducido:
en s34 solo existían dos prefijos —`mcp__Figma__*` (lectura, y **funcionó**: con él se leyó el
nodo `13890:157` del breadcrumb) y `mcp__ClaudeTalkToFigma__*`, que es el que **está vetado**—.

→ Si necesitas ESCRIBIR en Figma: **abre sesión nueva** con el bridge ya conectado. No hay forma
de arreglarlo desde dentro de una sesión en curso.

Fichero: **"Smart-Contact Design System"** (`khNq9dJKNi13pNllrqm6dx`) — 111 páginas, 2.509
variables, 30 comentarios activos.

## ⚠️ Trampas de este frente

- 🪤 **El verde LOCAL no cubre los dos primeros metros del CI**, y en s34 mordió dos veces:
  - **`npm ci` es el paso 1 del CI y `preflight` NO lo corre.** Un lockfile desincronizado da
    preflight entero en verde y CI muerto antes de instalar nada. Si tocas `package.json` o el
    lock, corre **`npm ci --dry-run`** (exit 0 = en sync) antes de pushear. Y no lo arregles con
    `npm install <paquete>` puntuales: cada uno vuelve a descuadrar la familia `@emnapi/*`
    (opcionales de wasm que macOS no instala y Linux sí espera). Lo que funciona es regenerar
    limpio — **pero eso hace derivar versiones**, incluida la FUENTE DE ICONOS del DS. Mira el
    diff de directas después y verifícalas, no las des por buenas.
  - ⚙️ **Y el caso peor de todos ya lo para una máquina**: lanzar la cadena DOS veces. Las dos
    nacen en el mismo `cwd`, comparten `ng serve` y se pisan — la tabla del supervisor salía
    VACÍA y la suite iba camino de dos horas (con una sola: 127/127 en 1,8 min). Desde s34,
    `playwright-reuse-guard.mjs` para la suite si detecta otra ejecución de Playwright viva.
    Escape explícito si de verdad quieres dos: `SC_ALLOW_PARALLEL_SUITES=1`.
  - **El ratón de Playwright arranca en (0,0), encima de `<sc-sidebar>`.** La barra se expande al
    hover y **se superpone al contenido** (diseño, `sidebar.component.scss:10-12`), así que la
    primera columna de las tablas queda debajo y el clic no entra: *«subtree intercepts pointer
    events»*, 169 reintentos hasta agotar los 90 s. En local pasaba por suerte de timing; el
    runner lento lo destapa. Ya lo cubre `goto()` en `e2e/supervisor/helpers.ts`, que lleva el
    puntero a un punto inerte de la barra superior. **Si lo ves otra vez, no lo tapes con
    `{ force: true }`**: eso se salta el hit-testing y cambia un rojo verdadero por un verde falso.



- **Los dos e2e que "fallan siempre en macOS" se desactivan con `CI=1`**: los screenshots de
  `sc-card` y `sc-message` (`components.spec.ts`) son llamadas a `screenshotBaseline()`, que
  **hace no-op cuando `CI` está puesta**. Medido el 2026-08-24: `CI=1 npm run e2e` → **68/68 en
  verde** en este Mac, dos veces. O sea que el smoke completo SÍ es corrible en local; lo que no
  lo es son sus baselines por plataforma. Sin `CI=1` siguen rojos y **no son tuyos** (el de
  `sc-card` espera una página de 1049px y recibe 1453 — no lo leas como regresión de métrica).
- **El CI son 9 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J). Los e2e de app solo corren allí (DD-60); las baselines visuales de sc-docs, a mano.
- **`npm run verify` (31 gates) NO corre el `e2e smoke`.** El `component-structure.spec` (baseline
  del `outerHTML` de cada componente) es un paso aparte de CI, y el textarea autoResize graba su
  alto calculado en un `style` inline que vive en ese `outerHTML`. Un cambio de token/visual puede
  pasar los 26 gates y aun así romper el baseline en CI: en s29, `line-height` md 21→20 movió ese
  alto (77→74) y tumbó el CI en dos push seguidos mientras el verify local iba verde. **Quien lo
  cubre es `npm run preflight`**, que desde s30 corre el smoke ENTERO (`CI=1 npm run e2e`, 68
  tests) y no un subconjunto. `npm run e2e:structure` sigue valiendo como bucle corto mientras
  iteras (`:update` si el cambio es deliberado, y revisa el diff del JSON), pero el gate de
  pre-push es preflight.
- **La cifra de gates de `verify` YA se gatea** (check M de `docs:coherence`, desde el
  2026-09-06). Esta trampa decía que vivía en 4 sitios sin vigilar; al escribir el check se
  midió y eran **once**, con tres cifras distintas conviviendo (34, 29 y 26 cuando eran 29).
  Seis de las once están en este mismo hand-off y son registros fechados de lo que se lanzó
  aquel día, así que `docs/handoff/` queda exonerado a propósito — pero esta sección de
  trampas no: si cambia la cadena, se actualiza a mano. El README lo cubre aparte (check B),
  que exige **nombrar** el guard nuevo.
- **Para MEDIR color o contraste, no uses `ng serve`** (s31): sirvió `blue-400` durante cinco
  rondas de e2e con el fuente y el bundle construido diciendo `blue-300`. Construye y sirve el
  estático (`ng build supervisor` → `http-server dist/supervisor/browser --proxy` para el
  fallback SPA) y apunta `SC_SUPERVISOR_URL` ahí. Si una medición contradice al fuente, la
  primera hipótesis es el build viejo.
- **`npm run e2e` ya NO pisa los PNG de `public/usage/`**: `playwright.config.ts` tiene
  `testIgnore: ['usage/**', ...]`. Comprobado el 2026-08-24 tras dos smokes completos —
  `public/usage/*.png` y `_usage-raw.json` intactos. (La captura de uso se corre a propósito, con
  su config aparte.) Lo visual se sigue gateando con `ng build` AOT.
- **Los permisos de Actions se capan desde la ORG**: cambiar solo el repo no sirve; el ajuste se
  queda en `read` sin avisar. Hay que ponerlo en `write` en los dos niveles.
- **Al escribir un docstring, cuidado con lo que MENCIONAS.** Los scripts que cuentan API
  (`component-audit`) ya ignoran comentarios desde s28, pero la lección de fondo aplica a
  cualquier contador nuevo: si tu regex mira el fichero entero, cuenta también lo que se está
  explicando.

## 🕳️ Lo que se dejó fuera, y por qué (por sesión)

- **s33 · anotar los `scripts/**/*.mjs`** (392 errores con `checkJs`) y **type-checkear
  `code-connect/`** (17): las dos salen del gate nuevo con su motivo escrito, en la tabla de
  arriba. La primera es trabajo real si algún día se quiere; la segunda no es type-checkeable con
  `tsc` a secas y ya tiene su gate.
- **La web no cambia hasta que Carlos consuma los tokens.** Lo nuestro (Figma) está hecho; el
  loop se cierra en su repo. Editar Figma no mueve producción — pieza-verde ≠ loop-funciona.
- **Badge sin tocar** (alto fijo, tamaños fuera de rampa): decisión, no olvido.
- **El desajuste 20-vs-21 de la escala** queda como deuda de foundations, sin abrir.
- **Sin DD formalizado** de "normal en todo / tokenizar texto de componente": está en este
  hand-off; se sube a `DECISIONS.md` solo si Rafa lo pide.
- **La `[intencional]` de `sc-bulk-transcription-modal` y todo lo de código (s28)** siguen igual:
  los SIGUIENTE de arriba están intactos — s30 no los tocó.
- **s30 · el desajuste `filtered()` vs `grouped()` del palette queda ANOTADO, no arreglado.** Si un
  consumidor publicara sus comandos con las categorías intercaladas, las flechas navegarían en un
  orden distinto del que se ve. Ninguno de los dos consumidores de hoy intercala, y arreglarlo es
  otra tarea: el `scrollIntoView` de esta sesión ya casa por `id` y no depende de ello.
- **s30 · las baselines visuales locales siguen siendo sensibles a la CARGA.** Regeneradas y ya deterministas respecto al scroll de la sidebar (4 pasadas completas seguidas en verde), pero las rojas sueltas caen siempre en las pasadas lentas —4,8 min frente a 2,2—, nunca en las rápidas. El CI no las corre (`screenshotBaseline` hace no-op con `CI=1`), así que no tumban nada; en local, si una sale roja, mira el diff antes de regenerar.
- **s30 · sin DD.** Ni el cambio de hover ni el del scroll son decisiones de arquitectura: la razón
  vive en el docstring de `onItemHover`/`scrollHighlightedIntoView` y en los dos gates, que es donde
  se lee cuando hace falta.
