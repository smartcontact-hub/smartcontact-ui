# Smart Contact UI — Architectural Decisions

> Decisiones grandes que afectan al diseño del Design System Smart Contact.
>
> **Source of truth**: este doc para decisiones arquitectónicas. Brand divergences
> en [`customs-catalog.md`](./customs-catalog.md). Reglas de blindaje en
> [`migration-safety.md`](./migration-safety.md).
>
> Formato DD-N, **newest first** (lo vigila `docs:coherence`; hasta el 2026-08-13 lo prometía y
> no lo cumplía). Plantilla:
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
4. **Un gate nuevo, `audit:screen-vocabulary`**, en `verify` (que pasa de 37 a 38 gates). Lee el
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

**Consecuencias** · `verify` pasa de 37 a 38 gates (actualizado en `CLAUDE.md`, `DOCS-INDEX.md` y
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
dicho en alto en DD-60, no por omisión. Rafa lo cuestionó al día siguiente: *«realmente no
necesitamos tenerlas hiper actualizadas… teniendo el storybook ya sería increíble, ¿no?»*.

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
  («un inventario y un ejemplo de dónde están») es **otra cosa**: la galería *Uso real*, 25
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

**Consecuencias** · `ci.yml` se queda en 8 pasos con nombre (CHECK J). Las baselines visuales
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
· *`2.x` o más alto, "para que se note que está avanzado"* — un major inventado obliga a fingir
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
mismo para el resto de flujos con rail: «ese mismo estilo de contener título en la section
settings tiene que ser aplicable al resto de flujos que tengan nav trail. Y su posición. Y adapta
también las clases según corresponda».

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

**Razón** · Lo que pidió Rafa no era replicar el HTML en dos sitios más: era «que mantengamos la
consistencia y todo vinculado, para que los cambios sean lo más automatizados posibles». Copiar
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
plantearlo: que la alternativa obvia (una rama por entrega) le deje «un montón de ramas basura y
desfasadas con el tiempo».

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
un paso más (`npm run proto`, tres preguntas), y a cambio el enlace no envejece. Queda pendiente
decidir si la app viva lleva además un aviso que apunte a la tabla.

Dos cosas salieron al probarlo de punta a punta, y las dos eran del mismo tipo: la herramienta
estaba escrita para quien la escribió.

- **Los flags no se memorizan.** La primera versión pedía `-- --ticket … --app … --que …` y Rafa
  dio con el problema en cuanto la vio: «¿cómo me voy a aprender esos comandos?». Algo que se usa
  una vez cada entrega no puede exigir recordar tres flags y un `--`. `npm run proto` pregunta.
- **El pre-push habría cobrado 10-25 minutos** por subir dos punteros a un commit que ya pasó su
  preflight y su CI al entrar en `main`. Un trámite que cuesta eso no se hace: se acaba usando
  `SKIP_PREFLIGHT=1`, que sí desactiva el gate. El hook gana un atajo estrecho y COMPROBADO (todas
  las refs `proto/*` y su commit antepasado de `origin/main`), probado también con el commit fuera
  de main, donde no salta.

## DD-55 · 2026-09-09 — Los estilos de texto se ponen a lo que NO es un componente

**Contexto** · Al instalar los 12 estilos de texto del Figma como clases `.sc-text-*` aparece la
pregunta de dónde se aplican. Rafa lo zanjó con el motivo: «los estilos de texto no van anclados a
componente para respetar la estructura y arquitectura de PrimeNG como la tenemos en el DS, para
que el tema se lea automáticamente». La maqueta lo hace exactamente así.

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

**Contexto** · Rafa, mirando el Supervisor contra su Figma: *«los botones siguen igual de tamaño
no lo ves? esto no puede pasar en nuestra plataforma, hay algo que está sobreescribiendo mal, o en
la sc-docs está mal partiendo del ds»*. No era el consumidor: **sc-docs, que es el DS puro, salía
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

---

## DD-49 · 2026-09-04 — Ante una diferencia Figma↔web, primero se pregunta QUÉ LADO MANDA; y el que no tiene canal no manda nunca

**Contexto** · El mapa de conexión de variables (816 filas, 18 componentes, medido contra el Kit y
el CSS que sirve `ui.smart-contact.com`) dejó 8 filas donde el dibujo del Kit y el tema no decían
lo mismo. El instinto, y lo que yo propuse, fue tratarlas como una lista de arreglos: «¿lo
corrijo?». Rafa lo paró: *«no lo corrijas, primero analiza si la web o figma debe ser la correcta.
Estamos viendo diferencias, en conexión y tal para que el tema las lea, nada mas»*.

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

**Decisión** (de Rafa, 2026-09-03: *«voto por seguir las escalas de Figma, y aceptarlas como
impepinables a menos que lo diga yo»*):

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
  decidió seguir ("actualiza bien") con la razón real escrita: **estar al día**, no la seguridad.
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
para no cascadear errores antes del merge — limpieza follow-up"). Origen: feedback de Rafa — *«solo una regla puede
estar activa; al desactivar no crea inactivas ni borradores, solo aparece como inactiva»*. El supervisor aún
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
  (elección de Rafa: "guía, bloquea solo lo roto"). Honestidad: contradicción/0-impacto se apoyan en el preview real.
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

**Contexto**: Rafa reportó los botones del footer de los dialogs "muy juntos", comparando con el ConfirmDialog
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
variable en Figma. "Si en Figma es `cyan`, en código `--sc-color-cyan`."

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
  ("el Kit es el camino", Rafa). Guard `tokens:effects-rewire` impide volver a hardcodear hex.
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
inicial ("meter la app dentro del DS") era **correcto para su caso**. (Memoria [[user-solo-nondev-seamless-first]].)

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
