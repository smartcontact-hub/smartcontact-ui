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

**LO SIGUIENTE, en orden (Rafa, 2026-09-13: el sistema es automatizable y lo operan agentes; nada a mano salvo que sea necesario):**

- **Criterio de Rafa (2026-09-15)**: lo que digan el Kit y Aura, el código lo sigue; un ajuste nuestro va a `figma-pendiente.md`
  (DD-111). Y cada tarea responde «¿qué cambia para quien usa la app?»: si no, sale (así salió `sc-selectbutton`).
- **Lo que dejó DD-134 (la firma de los commits)**: (a) el 2026-10-05, leer el mensaje con que el robot funde la auditoría, el
  primero con `--subject`/`--body`; (b) en una rutina, `cloud-node.sh` no puso Node 22.23.2 ni `node_modules` (medido dos veces),
  y `nvm` sí estaba; (c) los commits de la nube salen «sin verificar» (`unknown_key`): si estorba, probar sin firma, que el proxy
  aún no ha visto.
- **`sc-selectbutton`: cablear su color a `var(--sc-cmp-togglebutton-*)`** cuando Figma suba la opción no elegida (§8).
- **El índice lateral de las fichas a componente de la librería de Figma**: `figma-pendiente.md` §5. (La sección
  «Repositorios» de la ficha de agente, que se confundía con la página del menú, ya se llama «Recursos».)
- ~~**La puerta barata del preflight, contra un ledger en PR ajeno**~~ → hecho el 2026-10-05: `avisarLedgers` avisa, sin bloquear, si otro PR abierto toca tus ledgers (LEARNINGS #21).
- **Guardianes que miden un PROXY, no la condición** (tanda 2026-09-19: seis hallados, cuatro ya arreglados; el patrón lo caza LEARNINGS #2, «ante un trinquete que NO baja, mira un caso a mano»). Quedan cuatro, en orden de valor (la (b) se cerró el 2026-10-04): (a) **2º punto ciego de `audit-text-styles`** — la comprobación de ROLES usa el mismo `aplanar()` que no ve `code`/`pre`/descendientes ni `@media`; antes de tocarla hay que DECIDIR si un `html { font-size: 100% }` debe cumplir un rol (probablemente no): primero la regla, luego el gate.
  (b) ~~El hook de cierre casa la cadena `git push`, no el acto~~ — **cerrado el 2026-10-04**: `stop-guard` cuenta el push que CORRIÓ (el resultado de su herramienta no trae `is_error`, o enseña el ref subido: un push denegado por `bash-guard` o un `false && … git push` no llegaron a subir nada, y un `git push && npm run build` con el build roto sí subió), trata el cuerpo de un heredoc como dato salvo que lo lea un shell (`bash <<EOF`), y no cuenta el push de OTRO repositorio, con el mismo `usaPreflight` y el mismo analizador de carpetas que `bash-guard` desde el `cwd` de cada evento. Medido sobre el transcript de una sesión: de 12 comandos que el hook contaba como push, 4 nunca pushearon y 8 solo llevaban `git push` en el texto de un heredoc; los pushes de verdad eran 2, y los de después se cuentan bien.
  (c) **Fuera de PrimeNG jubilado** (`WRAPPERS_SOBRE_COMPONENTE_OBSOLETO_MAX`, hoy 2 tras DD-172): quedan dos, y son de las que se proponen. `sc-button → [pButton]`: la directiva no trae `label`, `icon` ni salidas, y cambia el DOM de todos los botones (mueve las capturas y las 8 entradas `p-button` de `component-styles.json`; `component-structure.json` no tiene ninguna, medido el 2026-10-06). Coste medido y opciones: tramo del 2026-10-06. `sc-multiselect → p-select` con `multiple`: le faltan seis cosas que usamos (`showToggleAll`, `selectAll`, `selectionLimit`, `maxSelectedLabels`, `selectedItemsLabel`, `display`; medido en 22.1.0), y DD-153 eligió ampliar el envoltorio.
  (d) **La plantilla de PR promete lo que no sabe**: medido, ningún gate lee el checklist y solo 2 de sus 6 casillas están respaldadas (`verify` y tokens). Barato: que cada línea diga si la vigila un gate y que «no aplica» no se escriba con un tick. Gateables de verdad, si Rafa quiere: bump de versión y CHANGELOG.
  (e) **`preflightVivo` de `bash-guard` cuenta el preflight de CUALQUIER caja**: busca la carpeta en la línea de comandos, que es relativa (y en macOS `pgrep -af` da solo PIDs). Medido el 2026-09-28: el preflight de otra caja denegó `npm run build:supervisor` en esta. Arreglo: el `cwd` de cada PID (`lsof -a -p PID -d cwd`, `/proc/PID/cwd`), con su test en rojo.

0. **«Aura + color de marca» y el export en un clic** (encargo del 2026-09-13; mediciones en
   `~/Documents/Claude/2026-09 aura-marca/`). Hecho: robot (DD-82, #152), paleta del export (DD-83), capturas
   (DD-84), «vuelve a Aura» y lo vigente de marca y densidad (DD-87). (a) Las medidas de PrimeOne que Aura
   cambió: HECHO en código (DD-97, 55 variables al paso de Aura con `PENDIENTE_FIGMA`); falta Figma,
   `docs/figma-pendiente.md` §4, y con cada export parity dice qué filas sobran; (b) tema del equipo
   externo: HECHO, paquete `smartcontact-tema.tgz` que se publica solo (DD-88, DD-93); Rafa lo adjunta en
   SISMAC-4074 (comentario y capturas en `2026-09 aura-marca/`); (c) densidad: HECHO, 32,5 con el interlineado de la rampa (DD-91). Ojo: el plugin corre el workflow de LA RAMA; un robot nuevo entra un export después.
1. **Lo que dejó el barrido (DD-77/78)**: «Solo fallidas» es un filtro conmutable hecho a mano. La sonda
   ampliada ya existe fuera del repo (E = 209 piezas, `2026-09 aura-marca/`): falta traerla como spec.
   Regla de Rafa para lo que dude: manda Aura en código y Figma se alinea.
   `danger` a 3.76:1 = valor de Aura, aceptado (DD-78).
2. **sc-docs: ejemplos de primeng.dev dentro de `<sc-datatable>`**, la red de «la tabla perfecta»: pasa
   ~20 de las 79 entradas de `p-table`.

- **Archivar la comparación de tablas** (desde la nube no se puede): con tag las ramas `comparar/tabla-*`, y borrar la
  local `arebury/tabla-scroll-listas`. Lo que la seguía ya está: Conversaciones monta `sc-list-page` (DD-98) y
  Entidades entró en `.page--tabla` (DD-95), los dos el 2026-10-05.
- **Conversaciones con más de 100 filas**: la lista virtual pide filas del mismo alto, y a 1280 Origen y Destino
  parten en dos líneas. Con los datos demo (34-47) no se activa. Agentes lo resolvió con `tableMinWidth` y scroll
  lateral (DD-102), pero aquí chocaría con las etiquetas que se recortan a 1280 a propósito: decidirlo con Rafa
  cuando haya datos reales.
- **Las tablas de dentro de los formularios** (agentes de un grupo, grupos de un agente) las rehace la sesión de
  `hind` (`arebury/agents-groups-users-ds`, sin commit el 2026-09-14): toca también Usuarios, Grupos y
  `audit-page-anatomy`, así que rebasa sobre DD-98 antes de subir.
- ~~**La baseline `datatable` de `e2e:visual`, en rojo en `main`**~~ → cerrado: no se reproduce desde el preflight de
  #175 (2026-09-14), y `visual-baselines` la regeneró en #330 sin moverse. El detalle, en `git show c065d664:` este fichero.
- **Acceso (DD-110), a juicio de Rafa**: la intensidad del fondo (`amplitude` 0.045 ≈ 64 px), la frase de marca de la
  izquierda y el texto del botón de Microsoft en pt/fr (de memoria).

**APARCADO por Rafa para OTRA sesión (2026-09-13): nuestros componentes contra Aura tal cual.**
Qué resulta de instalar Aura y aplicarle nuestro styling: una ficha por componente que diga qué
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
  y las 237 eran la cifra equivocada.** **122 de ellas son `/validar`** (hoy 141 exentas), que imita el INSPECTOR DE
  CHROME a propósito y lo dice en su propio fichero desde que se escribió: tokenizarlo le quita al
  simulador lo único que enseña. El alcance real eran 115, de las que se migraron 60 y quedaban 55
  (hoy 94 en `TIPOGRAFIA_SUELTA_DOCS_MAX`: #212 arregló el contador, que perdía 52 de 107).
  **Las que quedan NO son pereza, son tres familias medidas**: `code`/`kbd`/`pre` (su mono lo
  pone el NAVEGADOR, no una regla, así que la clase se lo quita: 88 nombres de token se quedaron
  en Inter en la primera pasada), reglas con familia propia o `font:` shorthand, y **elementos
  CONTENEDOR** — ahí la clase arrastra a todo lo que solo heredaba: 1.122 `<code>` y 353 `<td>` se
  movieron de golpe antes de acotarlo.
  ⚠️ **Lo que queda pide DECISIÓN, no otro barrido**: cuatro `hero__title` a 32px y seis textos a
  16px (ninguno es peldaño), y qué hacer con los contenedores.

**Lo que deja la segunda vuelta a `/config/aed/servicio` (2026-09-12 tarde), y NINGUNO bloquea:**

- ~~**Las etiquetas de campo a 12 regular** y **`sc-tag`/`sc-chip` a 500**~~ → **HECHO el
  2026-09-13**: las 25 `.field__label` de seis ficheros a semibold, y pastillas a 600.

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
- ~~**`--sc-font-size-caption-bold` está declarado y tiene 0 usos.**~~ → retirado el 2026-10-05 (criterio de #194).
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

## ✅ 2026-10-06 · Lote 10 · velocidad: cola de capturas por rama, «sin máquina», aviso de estilos y DD libre (DD-175)

**Sello:** rama `claude/lote-10-velocidad`, sobre `99534623` (#342), PR nuevo. Sale por el tope el tramo del 2026-10-04
(DD-154 y DD-155): `git show 99534623:docs/handoff/design-system.md`.

**Lo que cambia.** Cuatro huecos que en el #342 costaron colas y un CI de más (DD-175): `visual-baselines` encola por
rama; `ci:verdict` sale con 7 cuando los únicos rojos son jobs sin máquina, y `-- --relanzar` los relanza una vez; el
aviso de capturas del preflight da el comando de `component-styles` y no cuenta como pendiente lo que el robot ya
comprobó; y el preflight avisa si tu número de DD ya lo usa un PR abierto (tests en `aviso-ledgers.test.mjs`).

- ⚠️ **El 10.5 (envoltorios neutros en `component-styles`) se midió y no se hizo**: 267 entradas nuevas, 180 de celdas del
  `datatable`. Para leer el botón de las piezas compuestas, prueba a no gastar nivel solo en los hosts `sc-*` y `p-*`, y
  mide de nuevo.
- ⚠️ **En la nube, Angular pide Node ≥ 22.22.3 y el contenedor trae 22.22.0**: baja la de `.nvmrc` (22.23.2). Playwright
  busca `chromium_headless_shell-1234`; usa `executablePath: '/opt/pw-browsers/chromium'` en una config temporal.
- **Plan sin ejecutar** (medido 2026-10-06): `sc-button → [pButton]`, 265 usos en 78 ficheros y 178 `(clicked)`; la
  directiva no trae `label`, `icon`, `clicked`, el mapeo `variant`/`appearance` ni `type="button"`. `sc-multiselect →
  p-select`: 14 usos, 13 con `maxSelectedLabels`/`selectedItemsLabel` y 3 con `display`, que `p-select` 22.1.2 no tiene.

## ✅ 2026-10-05 · Los lotes 5 a 9 en un PR: fuera de PrimeNG jubilado, lo seguro (DD-172), y el cajón modal con foco

**Sello:** rama `areses/sweet-fermat-r9cxzw`, sobre `b4d1f145` (#339), PR nuevo. Sale por el tope el tramo del 2026-10-01
(`sc-dialog`, DD-140): `git show b4d1f145:docs/handoff/design-system.md`.

**Lo que cambia.** Las cinco piezas compuestas pintan `sc-button` y `sc-password` va sobre `pInputPassword`, con su medidor
propio: el trinquete de piezas sobre PrimeNG jubilado baja de 8 a 2 (DD-172). `sc-drawer` modal se anuncia como diálogo, se lleva
el foco y lo devuelve (DD-168, actualización). `sc-datatable` pinta todas las filas de un tramo seleccionado y nombra la casilla de
«todas» desde que se pinta (DD-98). `sc-slot` toma el token del divisor (DD-113) y sale `--sc-font-size-caption-bold`. En el mismo
PR, fuera del DS: Entidades en `.page--tabla` (DD-95), Conversaciones sobre `sc-list-page` (DD-98) y CusCare (su hand-off).

- ⚠️ **Al quitar un import de PrimeNG, el trinquete de descripciones pide JSDoc** para lo que heredaba la suya (diez miembros esta
  vez): la de la pieza hermana (`sc-inputtext`) sirve donde coincide.

## ✅ 2026-10-04 · La red que le faltó al primer lote: GitHub por `gh api`, la puerta de los generados, el aviso de capturas y `npm run tiempos`

**Sello:** rama `areses/sweet-fermat-r9cxzw`, sobre `c756d895` (#325), PR nuevo. Sale por el tope el tramo del 2026-09-28 (DD-134):
`git show c756d895:docs/handoff/design-system.md`.

**Lo que cambia.** #325 tardó 3 h 30 min de punta a punta; esto quita tres de sus tropiezos. `ci:verdict` y `sesiones` leen GitHub
por `gh api` (`scripts/github.mjs`): en la nube salían con código 2 o callaban. El preflight para en el segundo 1 si un generado no
está al día (antes, tres arranques perdidos: unos 8 min), y avisa de las capturas de sc-docs que el cambio mueve: de las tres causas
de la vuelta roja de #325 (36 min), la captura era la única sabida de antemano. `npm run tiempos -- <PR> --desde HH:MM` saca los
tiempos de cada lote para su squash. Lo pendiente de DD-154 y DD-155, cerrado: con 8 partes la mediana es 8,4 min (n=9, frente a
12,8 con 4) y no hace falta el filtro de barridos (DD-155, actualización).

- ⚠️ **Un `gh api` suelto no cuenta como lectura del CI** para el hook de cierre, porque no compara contra tu HEAD: usa `ci:verdict`.

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
| ~~**Lienzo de página gris↔blanco**~~ → **DECIDIDO Y HECHO**: [DD-45](../DECISIONS.md) lo llevó a BLANCO el 2026-08-31 (`app-shell.component.scss` pinta `--sc-bg-canvas`), y Rafa lo reconfirmó el 2026-09-11 (lienzo en blanco) sin saber que ya estaba. La fila llevaba diez días mintiendo: si una espera se resuelve en otro tramo, hay que venir a tacharla aquí |
| ~~**Tramo actual del breadcrumb**~~ → **DECIDIDO, `bcab818` (2026-08-25)**: la propuesta de Figma `13890:157` (padres slate-500 `#8F97A3`) **se RECHAZA** — da **2,95:1** sobre blanco y no cumple AA. Se queda el código como está (padres slate-600, actual slate-700, ambos AA). Falta solo anotarlo en el nodo de Figma (Bloque 4). *Nota: el mismo commit tokenizó la miga a 14px, otro asunto ya cerrado.* |
| ~~**El botón de crear cambia de ancho entre listas**~~ → **HECHO, `bcab818` (2026-08-25)**: decisión de Rafa: el ancho no cambia sin motivo. `main.scss:205` → `.top-bar__actions button { min-width: 144px; max-width: 288px }`, anclado en clase NUESTRA. Los cinco (122–142px) aterrizan igual. Aplicado y en `main` |
| ~~**Qué forma de ficha (agente, grupo, usuario)**~~ → **DECIDIDO** (DD-121, DD-122) | Índice lateral en las tres. Las variantes de `comparar/fichas` quedan de referencia; la rama se archiva con tag desde el portátil |
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

- 🪤 **Una rutina no acepta un «sí» escrito en su encargo** para actuar con la identidad del usuario: la confirmación va en esa sesión (DD-134).
- 🪤 **`styleClass` de `p-button` y `class` en `<sc-button>` no caen en el mismo elemento**: el primero, en el `<button>` interior,
  fuera del alcance de la SCSS emulada de la pieza; el segundo, en el host. Una regla que nunca aplicaba empieza a aplicar: al
  migrar, mide la caja (DD-172, `bulk-edit__apply`).
- 🪤 **Una rama de antes del barrido de nombres (DD-120, 2026-09-24) choca en comentarios al rebasar**, y `audit:personal-names` le hará reescribir los suyos (`gulper`: `channel-icon`).
- 🪤 **«Sin uso» se mide por familia, no por token**: sin el fondo de una etiqueta cuyo punto sí se usa, la paleta queda a medias (DD-111).
- 🪤 **Las capturas de sc-docs no ven el botón de aviso con contorno ni el modo oscuro**: esos colores se miden a mano (#193).
- 🪤 **El host de una tabla se interpone en la cadena de altos**: `.page--tabla .table-card` no basta si la tarjeta vive dentro
  de un componente; el host tiene que ser flex (`0 1 auto`, `min-height: 0`) o la página no hace scroll (DD-95).
- 🪤 **Una regla SIN CAPA de un wrapper gana siempre al tema**: el rojo de error de seis campos tapaba el borde de foco.
  Un estado que PrimeNG sabe pintar (`p-invalid`) se le pasa a PrimeNG, no se repinta en el SCSS del wrapper (DD-111).
- 🪤 **La hoja de una página no alcanza el `<img>` ni el `<canvas>` de OTRO componente** (encapsulación): esos estilos van
  en el propio componente (DD-110, el fondo del acceso).
- 🪤 **Para estilar un interno de PrimeNG sin `.p-*`, ponle clase propia por `pt`**: `pBind` la mezcla con la suya y el
  acoplamiento no crece (DD-108).
- 🪤 **«Sin transcribir» en el backend real**: `getTranscriptions` da 503 por encima de ~416-663 resultados y solo marca
  tres meses. Hablarlo con los devs antes de llevar la vista a la app real.
- 🪤 **Con varias cajas en preflight, `e2e:visual` se pisa en :4280** (o tumba `sc-datatable`): sirve un sc-docs de TU
  árbol en otro puerto y lanza con `SC_DOCS_URL` + `SC_ALLOW_PARALLEL_SUITES=1`.
- 🪤 **Día de muchas PRs**: cada rebase renumera DD, secciones de `figma-pendiente.md` y regenera capturas ajenas (#171,
  #176). Mira `git log HEAD..origin/main` justo antes de cada preflight.
- 🪤 **Un valor del Kit pasado a rem pierde la forma del shorthand**: `1` dibujado abajo en Figma es `0 0 1px 0` en
  Aura, y escrito `0.071429rem` pinta cuatro lados. Solo se ve el día que alguien usa el componente (DD-107).
- 🪤 **Una caja `x-2` puede ser gemela de otra que trabaja la misma rama** (el PR 171 lo arreglaba ya `coelacanth`, y se
  vio hora y media después): `npm run sesiones` lo canta al abrir.
- 🪤 **Un `--sc-cmp-*` generado no significa que el tema lo lea**: mídelo en pantalla con el export simulado (DD-106).
- 🪤 **Un fallo que ves en una pantalla, repítelo en la documentación del DS antes de arreglarlo en la pantalla**: si
  está en el componente, el arreglo en la ficha solo lo tapa ahí (DD-105, `sc-multiselect`).
- 🪤 **Una carpeta de `public/` con el nombre de una ruta la tapa**: `public/login/` hacía que `/login` diera 301 a la
  carpeta en vez de la app. Las imágenes del acceso viven en `public/illustrations/`.
- 🪤 **`pgrep -f 'texto'` dentro de un bucle de espera casa con el propio bucle** (en macOS, con otra espera igual) y no termina
  nunca: ancla el patrón al proceso (`'^node scripts/preflight-scope.mjs'`) y compruébalo con `pgrep -fl`. ⚙️ `bash-guard` lo deniega.
- 🪤 **Un `sc-multiselect` con `[value]` que sale de un método se cuelga**: cada ciclo devuelve un array nuevo, que
  cuenta como cambio. Dale un `computed` y compara antes de escribir (`labelValue` y `sameValues` en la ficha de agente).
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
- **`CI=1 npm run e2e` corre en local el smoke ENTERO con su propio `ng serve`** (96/96 en 9 min, 2026-09-28); las capturas
  `-linux.png` se saltan fuera de Linux. Si se queda en «Espero a que se libere», mira quién tiene el puerto.
- **El CI son 9 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J). Los e2e de app solo corren allí (DD-60); las baselines visuales de sc-docs también, en `e2e-smoke` (DD-116).
- **`npm run verify` (31 gates) NO corre el `e2e smoke`.** El `component-structure.spec` (baseline
  del `outerHTML` de cada componente) es un paso aparte de CI, y el textarea autoResize graba su
  alto calculado en un `style` inline que vive en ese `outerHTML`. Un cambio de token/visual puede
  pasar los 26 gates y aun así romper el baseline en CI: en s29, `line-height` md 21→20 movió ese
  alto (77→74) y tumbó el CI en dos push seguidos mientras el verify local iba verde. **Desde DD-60
  no lo cubre ningún gate local**: lo ve el CI (`e2e-smoke`), o tú antes con `CI=1 npm run e2e`.
  `npm run e2e:structure` sigue valiendo como bucle corto mientras iteras (`:update` si el cambio
  es deliberado, y revisa el diff del JSON).
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
