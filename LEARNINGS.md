# LEARNINGS — reglas de proceso ganadas trabajando en este repo

> **Léelo al EMPEZAR una tarea** (no solo al cerrarla). Son reglas de **cómo trabajar**,
> destiladas de errores y aciertos reales, cada una con su evidencia. Lo escribe/afila
> `/reflect` al cerrar cada tarea.
>
> **Formato**: `Disparador → acción`. Si no tiene disparador, no sirve: nunca se dispara.
> **Regla de higiene**: esto se **afila, no se acumula**. Tope ~20 entradas. Si una nueva
> lección solapa con otra, funde ambas en la más fuerte. Un fichero largo no se lee, y uno
> que no se lee no mejora nada.
>
> **El tope cuenta REGLAS, no entradas numeradas** (aprendido el 2026-08-13): el fichero
> respetaba "20 entradas" mientras escondía **15 corolarios con disparador y acción propios**
> — 35 reglas reales y 5.206 palabras, con `CLAUDE.md` afirmando que "es corto a propósito".
> El crecimiento se había desviado al interior de las entradas, blanqueado por la instrucción
> "funde en la más fuerte". Al contar, cuenta también los corolarios.
>
> **Los números son IDENTIFICADORES, no un orden**: hay código y docs que citan reglas por
> número (`e2e/supervisor/conversations-row-gesture.spec.ts` cita "LEARNINGS #1"). Por eso la
> numeración no es secuencial y **al fundir dos reglas el número de la absorbida desaparece,
> el de la superviviente NO se toca**. Nunca renumeres.
>
> Ámbito: reglas de proceso **del repo**, versionadas y visibles para todo el mundo. Los
> hechos del proyecto (arquitectura, decisiones, estado) NO van aquí: van a `docs/` y a
> `NEXT-SESSION.md`.

## Índice de disparadores — escanea esto, baja solo a la que te aplique

Las 16 reglas caben aquí. La evidencia de cada una está abajo, y es larga **a propósito**: es
lo que hace que te la creas cuando te toca. Lee el índice siempre; el cuerpo, cuando dispare.

| # | Si estás a punto de… | → |
|---|---|---|
| **1** | concluir que algo NO funciona, **o que ya lo arreglaste tocando una opción** | demuestra que tu estímulo —o tu opción— LLEGÓ, y no extiendas el negativo más allá de lo que mediste |
| **2** | creerte un hallazgo (o un verde) de una sonda **tuya** | valida el instrumento con un caso conocido; pruébalo en todos sus ejes; y valida también el CANAL — rojo y verde pueden venir de otro sitio, y un filtro mudo se lee como "no ha pasado nada" |
| **4** | arreglar un valor sustituyéndolo por otro token | mide el token de DESTINO antes (fondo y texto, misma familia) |
| **5** | dudar entre tu código y tu medición | lo rancio es la medición: build, server, HMR, animación, **el repo bajo tus pies**, **otra instancia (un deploy)**, la máquina ahogada… o atribución. Y si el test miraba un TRANSITORIO, la carga es el disparador, no la causa |
| **6** | creerte un test NUEVO — se ponga rojo **o pase a la primera** | sospecha del test primero: ¿mide la magnitud? ¿el selector casa? ¿reintenta? ¿espera al estado final? Y para probar el arreglo de una CARRERA, hazla determinista en vez de correrla con carga |
| **7** | hacer `git push` | corre los **8 pasos** de `ci.yml`, una vez, sobre el árbol final — y confirma el verde LEYENDO el log |
| **8** | proponer una segunda corrección tras fallar la primera | para: la siguiente acción es una MEDICIÓN que localice la causa |
| **10** | declarar algo bloqueado, o deducir un dato a ojo | comprueba si el sistema ya te lo sirve (DOM oculto, i18n, hoja de estilos) |
| **11** | lanzar una edición masiva por shell | pega la verificación de outcome en el MISMO comando (zsh no hace word-splitting) |
| **12** | dar una cifra de un grep, ejecutar un `sed`, **o volcar un fichero de config** | pregúntate qué entra en el resultado; si hay un ejecutor que sabe el número, el número es el suyo; y **proyecta o enmascara antes de imprimir un `env`** |
| **14** | responder a un "hazlo todo", o escribir "esperando a X" | haz lo verificable de punta a punta y aparca lo demás DOCUMENTADO — pero por no poder verificarlo, **nunca por parecido con otro aparcado** |
| **15** | decidir algo de marca/producto | preséntalo con recomendación y evidencia — y no exageres el encuadre de riesgo |
| **16** | empezar un refactor transversal | monta antes la red que lo verifica, aunque parezca rodeo |
| **17** | construir sobre una descripción que no verificaste tú | es una paráfrasis: vuelve a la fuente (da igual si viene de un hand-off, Figma, un README u otro agente) |
| **18** | zanjar una decisión VISUAL discutiendo | constrúyela en su versión mínima y MÍRALA |
| **19** | elegir cómo validar algo | por la PREGUNTA: gesto→Playwright · aspecto→captura · ¿sabrán usarlo?→recorrido cognitivo |

---

## Verificación (lo que más caro me ha salido)

1. **Vas a concluir "X no funciona" a partir de una interacción por herramienta —o "X ya está
   arreglado" tras tocar una opción— → primero demuestra que tu estímulo LLEGÓ.** Un negativo salido de un canal sin validar no es
   evidencia. *Evidencia (s11)*: afirmé —subrayando "reproducible"— que las filas de
   `sc-datatable` no se activaban con Enter; la acción `key` del navegador entrega los eventos
   con `key`/`code` **vacíos**, y sin un clic previo en la página ni llegan. Tuve que
   retractarme. Instrumenta con un `addEventListener` de una línea; si no puedes probarlo, el
   veredicto es **"sin verificar"**, nunca "roto".

   *Corolario (s11)*: **dos validadores que comparten el modo de fallo no se corroboran.** Creí
   confirmar aquel negativo porque un `dispatchEvent` sintético también "fallaba" — pero ninguno
   de los dos podía disparar la activación nativa de un enlace. Antes de sumar una segunda
   señal, pregunta si puede fallar por la misma causa que la primera.

   *Corolario (s32) — el mismo agujero AL REVÉS, y por eso el disparador ya no dice solo "no
   funciona": vas a dar por ARREGLADO algo cambiando una OPCIÓN —config, flag, env, setting—,
   así que demuestra que la opción LLEGÓ, no que está escrita.* Puse
   `reducedMotion: 'reduce'` en el `use` de `playwright.cuscare.config.ts` para matar la
   animación que dejaba los overlays de PrimeNG sin estabilizarse bajo carga. **No llegaba**: en
   Playwright 1.60 el runner ya no reenvía esa opción en primer nivel (va dentro de
   `contextOptions`). El fichero decía lo correcto, la página recibía `no-preference` y el test
   seguía cayendo 3 de 15. Y no saltó nada: TypeScript sí lo marca, pero `npm run typecheck` no
   entraba en los configs de la raíz y `eslint` no reporta errores de tipo — un arreglo que no
   arregla nada y que ningún gate desmiente. (Ese hueco concreto ya está tapado:
   `tsconfig.harness.json` mete la raíz y `e2e/` en el `typecheck`. La regla NO depende de eso:
   un gate de tipos dice que la opción existe donde la escribes, no que llegue.) Solo se cayó
   porque tenía un ROJO DE PARTIDA reproducido (2 de 5 bajo carga) contra el que comparar; con la máquina tranquila habría visto
   verde y lo habría dado por bueno. **Y lo peor no fue el error: había escrito el resultado
   ("con esta línea, 0 de 15") en el comentario del propio arreglo ANTES de medirlo** — prosa con
   forma de evidencia, en el sitio donde nadie la va a dudar. **Acción**: (a) una opción de
   configuración es un estímulo — pregúntale al SISTEMA por su efecto (`matchMedia`,
   `getComputedStyle`, un log del runtime), nunca al fichero; (b) si esa pregunta cabe en una
   aserción, hazla un TEST y no un comentario (`e2e/cuscare/harness.spec.ts` existe justo por
   esto, y se probó en rojo con la opción mal escrita); (c) no escribas una cifra antes de
   medirla, tampoco dentro de un comentario.

   *Corolario (s27) — un negativo VÁLIDO también tiene ALCANCE, y su alcance es lo que mediste, no
   lo que comparte NOMBRE con ello.* Esta vez el estímulo sí llegó y la respuesta era cierta:
   `whoami` del MCP de Figma en la nube devolvió "connection invalidated". Lo que me inventé fue el
   alcance: se lo conté a Rafa como «el MCP oficial está caído» y enumeré como caídas
   `get_design_context`, `get_variable_defs` y `get_screenshot` — tools que **nunca sondeé** y que
   estaban leyendo el fichero tan tranquilas, porque viven en OTRO servidor. «El MCP de Figma»
   resultó ser **tres** servicios independientes debajo de un mismo nombre coloquial. No lo cacé yo:
   lo cazó él preguntando «¿entonces los MCP de Figma funcionan?». **Acción**: al informar de un
   fallo, nombra el sujeto EXACTO que mediste («el server de nube», no «Figma»); y si tu frase usa
   un nombre COLECTIVO —el MCP, el build, la API, los tests, el CI— párate y enumera sus partes:
   casi siempre caen por separado y solo comparten etiqueta.

2. **Tu medición te da un POSITIVO —"encontré N defectos"— y la escribiste tú → valida el
   parser antes de creerte el hallazgo, con un valor cuya respuesta ya sabes.** La regla de
   arriba está escrita para negativos, y por eso no me protegió: yo tenía un positivo y los
   positivos se sienten como evidencia. *Evidencia (s18)*: mi sonda de tema oscuro parseaba
   colores con `/\d+/g`. Sobre `color(srgb 0.996078 0.886275 0.886275 / 0.5)` eso devuelve
   `[0, 996078, 0]` — un verde imposible — y me reportó filas ilegibles en `/conversaciones`
   que **no existían**. Estuve a un paso de escribirlo como hallazgo y de "arreglar" CSS
   sano. Lo salvó mirar los números y que no cuadraran, que es suerte, no método. **Acción**:
   si el pipeline computa algo (color, medida, agregado), pásale primero un caso conocido;
   y para colores, que los normalice el navegador (`canvas.fillStyle`), no un regex tuyo.

   *Corolario A (s21) — un parser correcto midiendo la MAGNITUD equivocada sigue siendo un
   hallazgo falso.* La pregunta era «¿de qué color ve el usuario la franja de debajo de la
   tabla?» y mi sonda medía `main.bottom - page.bottom`: eso es GEOMETRÍA —cuántos píxeles
   quedan, no de qué color son—, así que reportó 489px de costura gris en una ruta donde la
   pantalla es **blanca** (el `:host` de esa página sí se estira y la pinta él). Estuve a punto
   de decírselo a Rafa como hallazgo. El número bueno salió de preguntar por el PÍXEL
   (`elementFromPoint` + subir al primer ancestro con alfa 1): **4 rutas de 34, no 9**. Antes de
   correr la sonda, di en voz alta qué magnitud devuelve y si es la de la pregunta. *Y el ELEMENTO,
   no solo la magnitud (s29)*: medí el VALOR del select (`.p-select-label`=14) cuando el bug vivía
   en las OPCIONES (`.p-select-option`=16), y antes el CONTENEDOR heredado (16) en vez del texto
   hoja — el mismo error dos veces, con flip-flop de veredicto. Mide el nodo EXACTO del que habla la claim.

   *Corolario B (s21) — un control que no LEES no es un control.* En la sonda siguiente sí puse
   un valor conocido… y el control falló (`ctx.fillStyle = 'var(--x)'` no resuelve la variable:
   devolvía negro donde esperaba blanco). Solo sirvió porque miré su línea antes que las demás.
   Si el control no pasa, la medición entera queda invalidada aunque el resto parezca sensato.
   *Y su reverso, en los DOS sentidos: el resultado de tu control —rojo o verde— puede venir de
   otro sitio.* **El rojo ajeno (s30)**: corrí mis dos gates nuevos contra un build sin arreglar
   esperando verlos fallar, y vi "3 failed" — pero eran tres `ERR_CONNECTION_REFUSED`: el servidor
   había muerto. "Falla" no es "falla por MI aserción". Léelo hasta el mensaje, y si no coincide
   con lo que mediste, el control no ha ocurrido: repítelo (revertí el componente, reconstruí y
   volví a correr — ahí sí, `Expected 0 / Received 3` y `↓ x3` fuera de la lista).
   **El verde ajeno (s31), que es el peligroso porque no te obliga a mirar**: rompí `goToPage()`
   a propósito para ver mis dos tests en rojo y salieron **verdes**. No era que el test fuera
   flojo — Playwright, con `reuseExistingServer: !CI`, encontró el puerto 4415 contestando y se
   enganchó al `ng serve` de **OTRO worktree** (`exciting-tesla-f1e6de`, otra sesión viva): medí
   su código, no el mío. La pista estaba impresa en mi propio log —`[WebServer] TS2307: Cannot
   find module '@smartcontact-hub/components'`, MI server sin compilar mientras los tests pasaban
   tan contentos— y no la leí; me salvó que el resultado fuera IMPOSIBLE (un componente roto
   pasando), o sea suerte, no método. **Acción**: si el canal es un puerto compartido, antes de la
   PRIMERA medición pregunta quién contesta —`lsof -nP -iTCP:<puerto> -sTCP:LISTEN` y `lsof -a -p
   <pid> -d cwd` te dice de qué worktree es— y en un worktree corre con `CI=1`, que pone
   `reuseExistingServer: false`: petar ruidosamente por puerto ocupado es infinitamente mejor que
   un verde de otro. Mismo agujero en el canal de AVISO: armé un monitor del CI con
   `select(.headSha=="…" or .headSha|startswith("fe804c9"))` —en `jq` el `|` dentro del `select`
   se come la precedencia— y no casó nunca; 40 minutos de silencio que le vendí a Rafa como "te
   aviso cuando termine" mientras el run llevaba 13 en VERDE. **Un filtro que no emite nada se
   lee igual que "no ha pasado nada": córrelo UNA vez contra un caso que sabes presente y mira
   que imprime la fila, antes de armarlo.**

   *Absorbe la antigua regla 13 (s18) — si el instrumento que construyes es un COMPROBADOR
   (guardián, red, gate), enumera las DIMENSIONES sobre las que varía y pruébalo en cada una,
   no solo en la que tenías en la cabeza.* Escribí un guardián de "build rancio" y lo validé en
   el eje rancio↔fresco, muy satisfactorio; no lo validé en claro↔oscuro, donde leía siempre el
   valor claro y acusaba de rancio a un build recién hecho — **17 tests rojos en CI**. **Un
   guardián con falsos positivos es peor que ninguno: enseña a ignorarlo.** Y al probarlo contra
   un artefacto "viejo", comprueba que **sigue siendo viejo** (reusé un `dist/` que se había
   regenerado: el verde no probaba nada). Fabricar el caso malo a mano cuesta 30 segundos y no
   caduca. *Confirmado el 2026-08-13 en los 5 gates de docs nuevos*: cada uno probado en rojo con
   un caso malo fabricado Y en verde con el bueno, y ahí se vio que el de tokens marcaba familias
   y retirados — falsos positivos que lo habrían convertido en ruido.

   *Absorbe la antigua regla 20 (s16) — el caso opuesto: tu comprobación da VERDE → pregúntate
   si mide algo que tú NO escribiste.* Cuando el arreglo y la lista de comprobación salen de la
   misma cabeza, el verde es circular. Migrando labels a `sc-datatable` medí alto de fila,
   paddings, tipografía y colores: **"DIFERENCIAS: ninguna"**. La captura, acto seguido, enseñaba
   dos defectos que mi lista no podía ver porque yo no los había pensado —la banda de `caption`
   que PrimeNG pinta siempre, y un `table-layout: fixed` global de hace meses—, los dos venidos
   de cosas que yo no escribí. **Acción**: cierra con una observación que NO dependa de tu
   inventario (la pantalla entera, o un control que no has tocado). *Y su gemela (s18)*: **el
   filtro que pusiste para quitar ruido es el que esconde el caso más común** — mi red de
   contraste solo miraba elementos con fondo propio y dio 34/34 verde; el texto vive en `<span>`
   sin fondo, y al quitar el filtro salieron **seis defectos reales**, uno a 1.30:1. Si una red
   tuya se pone verde a la primera, enumera en voz alta qué está EXCLUYENDO.

4. **Vas a arreglar un valor sustituyéndolo por otro token → MIDE el token de destino antes.**
   Un arreglo que apunta a algo que tampoco cumple no es un arreglo, es mover el fallo de
   sitio, y encima lo entierra bajo un commit que dice "fix". *Evidencia (s18), dos veces el
   mismo día*: (a) puse `--sc-text-subtle` como arreglo de un texto ilegible y resultó que
   subtle mide **2.04:1 sobre blanco** en 161 usos — cambié un fallo por otro; (b) al dar
   valor oscuro a `--sc-label-*-bg` estuve a punto de romper `sc-label[data-tone=info]`, que
   emparejaba ese fondo con un texto en paleta cruda: el mismo defecto **del revés**.
   **Corolario de emparejamiento**: fondo y texto van SIEMPRE de la misma familia. Mezclar
   uno que voltea de tema con uno que no es la forma exacta en que esto se rompe.

5. **La medición contradice al fuente → lo rancio es la MEDICIÓN, no tu código. Compruébalo
   antes de tocar nada.** Cuatro causas distintas, las cuatro vistas, y todas se sienten igual
   («mi CSS no entra»):
   - *(s12)* el dev server sirve el DS **compilado**: cambié el `opsz` del icono, el fuente
     decía 14 y el navegador seguía en 24 — faltaba `build:icons` + **reiniciar**.
   - *(s18)* **`npm run verify` reescribe `dist/` por debajo de un `ng serve` vivo**: el server
     no cae, sigue sirviendo el bundle ANTERIOR tan campante. Tres rondas midiendo un arreglo
     ya escrito y viendo el valor viejo.
   - *(s13)* **HMR** deja vistas y `TemplateRef` del componente anterior, con su `_ngcontent`
     viejo y los estilos ya retirados: 32px y sin píldora; tras `location.reload()`, 16px y
     píldora correcta — el CSS siempre estuvo bien.
   - *(s25)* **una animación a medio terminar**: tras soltar un `cdkDrag`, medir sin esperar
     daba 17 columnas de 18 y parecía que el reordenado PERDÍA una. Con 600ms de espera: 18 y
     todo correcto.
   - *(s28)* **el propio repo, si la sesión es larga**: arranqué leyendo `LEARNINGS.md` y a las
     dos horas Rafa commiteó encima (`b5c790b`, un modo nuevo de la regla 12). O sea que estuve
     el resto de la sesión trabajando contra una versión del fichero de reglas que ya no era la
     última, y **no me enteré hasta el `git push`**, por el rango que imprimió. Da igual que el
     fichero sea de proceso, un hand-off o un `.md` de contrato: lo leíste una vez y lo tratas
     como fijo. Esta vez no costó nada —el cambio era de un tema que no toqué—, que es suerte,
     no método.
   - *(s29)* **mediste OTRA instancia, no tu build.** Validé Select/MultiSelect/Breadcrumb
     contra `ui.smart-contact.com` (el deploy de Carlos) y di por bug de NUESTRO DS lo que solo
     pasaba en producción; al medir por fin NUESTRO sc-docs ya casaba con Figma (chip 14/20/34,
     opciones 14, breadcrumb `slate/600`). Casi edito el preset para "arreglar" bugs inexistentes
     en lo nuestro; lo paró Rafa («confirma el 21 de NUESTRO build, no lo fíes del de producción»).
     Un sitio desplegado es una COPIA de tu fuente que puede haber divergido.
   - *(s30)* **la MÁQUINA, ahogada por procesos huérfanos TUYOS.** `e2e:cuscare` se puso rojo dos
     veces seguidas en un test de paginación; me puse a mirar si lo había roto yo. No: había
     dejado vivos un `ng serve` y un `chrome-headless-shell` **al 125% de CPU** de una vuelta
     anterior, y el test espera un overlay que dura **380 ms**. Con la máquina limpia: 90/90 y la
     suite de 4,3 min a 2,0. El mismo día, otra sesión perdió una vuelta entera de dos suites por
     lo mismo (load average 51,88 → 34 `ERR_CONNECTION_REFUSED`, ni un assert de producto).
     **Un rojo intermitente en un gate que ya pasó pregunta primero por la CARGA, no por el
     código**: `ps`/`lsof`, mata lo tuyo, y repite antes de leer una línea de fuente.
   - *(s31)* **…y volver a verde con la máquina limpia NO cierra el caso.** El bullet de arriba
     es este mismo test de paginación: s30 lo diagnosticó como CPU ahogada, lo vio 90/90 con la
     máquina limpia y ahí lo dejó. **Volvió**, y costó una tarea entera. Porque la carga era el
     DISPARADOR, no la causa: la aserción miraba un overlay que vive **380 ms** exactos
     (`setTimeout` en el componente) y perdía la carrera cuando el primer sondeo llegaba tarde;
     con la máquina cargada llega tarde más a menudo, nada más. **Acción**: tras culpar a la
     carga, mira QUÉ afirmaba el test que se cayó. Si afirmaba sobre algo TRANSITORIO, la carga
     explica el *cuándo* y no el *porqué* — arregla la aserción para que no dependa del reloj
     (instala un `MutationObserver` ANTES del estímulo y afirma sobre lo que anotó, como
     `watchTransient()` en `e2e/cuscare/helpers.ts`) o el rojo vuelve con la siguiente máquina
     ocupada. Subir el timeout no vale: el problema es llegar tarde, no esperar poco.
   **Acción**: antes de la siguiente medición, pregúntate qué puede estar sirviendo/pintando
   algo viejo —build, server, HMR, animación— **o una instancia que no es tu build (un deploy)**,
   **o si la máquina está ahogada por lo que tú mismo dejaste corriendo**,
   y neutralízalo (rebuild, reinicio, recarga dura, espera); si el objetivo es TU artefacto, mídelo a ÉL. Cuesta segundos; la alternativa es depurar código que no se
   está ejecutando o un DOM que aún no ha terminado de moverse. Y para la quinta, la variante
   barata: **anota el SHA al arrancar y, antes de commitear, `git log <sha>..HEAD -- CLAUDE.md
   AGENTS.md LEARNINGS.md docs/handoff/` — si sale algo, reléelo antes de cerrar.**

   *Absorbe la antigua regla 3 (s11) — la variante de ATRIBUCIÓN: «¿este warning es mío o ya
   estaba?» se contesta con **stash-y-reproduce**, no opinando.* Es el mismo gesto —neutraliza
   la variable antes de creerte la señal—, aplicado al origen en vez de a la frescura. Cuesta
   ~2 llamadas y convierte "creo" en "comprobado": el warning de presupuesto SÍ era mío; los
   errores de View Transitions NO (salían igual sin mi cambio). *Y otra vez el 2026-08-13*: tres
   e2e en rojo tras mergear 3 PRs; reproducidos en el commit ANTERIOR, dos salían igual → no
   eran míos. Sin eso habría "arreglado" código sano o, peor, culpado a mi propio cambio.

19. **Elige el validador por la PREGUNTA que tienes, y ten claro que ninguno contesta la de
   usabilidad.** No hay una escalera fija de herramientas; hay tres preguntas distintas:
   - *¿el gesto hace lo que digo?* → **Playwright**. Un `dispatchEvent` apunta al elemento
     que TÚ eliges y se salta el hit-testing, así que es incapaz por construcción de
     detectar el fallo más común: *que el click real lo reciba otro elemento*. *Evidencia
     (s15), medida contra el MISMO código roto —reintroduje el bug a propósito, porque al
     principio me lo estaba deduciendo—*: el shift+click de rango fallaba porque la casilla
     ocupa 16px en el centro de una celda de 40 y su `stopPropagation` se comía el handler.
     Mi sonda daba **verde**; Playwright daba **rojo**.
     *Corolario (s20), y es el MISMO agujero por otra puerta*: un test unitario que llama al
     método a pelo (`c.onCheckCellClick(...)`) prueba su LÓGICA, no que un evento del navegador
     lo dispare ni que su efecto SOBREVIVA al framework. El rango de `sc-datatable` tenía siete
     tests unitarios en verde y **no funcionaba en el navegador**: la casilla de PrimeNG togglea
     en `change` (después del `click`), así que el handler leía la selección rancia y, encima,
     el `selectionChange` de p-table la re-emitía y pisaba el rango. Tres capas —orden de
     eventos, binding de dos vías, render de p-table— que NINGÚN unitario podía ver porque
     todas están fuera del método. Regla: la lógica pura, unitaria; el gesto de principio a
     fin, Playwright — y una capacidad de interacción NUEVA no está hecha hasta que un clic
     REAL la ejerce.
     *Corolario (s26) — vale igual cuando EXPLORAS, no solo cuando pruebas.* Barrí una app
     ajena buscando tooltips disparando `mouseover`/`mouseenter` sintéticos sobre cada icono:
     **cero resultados**, y concluí que no había. Los había — 23 en una sola pantalla — y
     aparecieron al pasar el ratón DE VERDAD. Un descubrimiento por evento sintético que sale
     vacío no dice "no existe", dice "mi canal no lo dispara".
   - *¿esto se ve bien?* → **screenshot a viewport real**, mirando la pantalla entera.
   - *¿alguien sabrá usarlo?* → **ninguna de las dos**. Un test solo comprueba lo que ya se
     te ocurrió afirmar; nunca te dirá que algo confunde o que una capacidad es invisible.
     Para eso, **recorrido cognitivo**: haz la tarea real y pregunta en cada paso si el
     usuario (a) sabrá qué intentar, (b) verá el control, (c) entenderá que hace eso, (d)
     notará que funcionó. *Evidencia (s15)*: con 22 tests en verde, el recorrido destapó que
     tras mover las acciones masivas a la barra de selección, la palabra "transcribir" no
     aparece en la pantalla de entrada — medido, cero coincidencias. Los tests no podían
     verlo porque yo nunca escribí esa afirmación.
   **Corolario — una interacción por llamada, o un test.** No encadenes dos interacciones en
   la misma llamada síncrona: al hacerlo para "reproducir más rápido" obtuve un tercer
   resultado ([2,3,4]) que no era ni el bug ni el comportamiento bueno, sino estado rancio de
   signals, y casi lo escribo como hallazgo. Por lo mismo, **no compruebes el DOM en la misma
   llamada que dispara la acción**: Angular aún no ha renderizado. *Evidencia (s11)*: el
   lightbox y un `p-menu` salieron "cerrados" justo tras el click, y estaban abiertos.

## Gates y push

7. **Vas a `git push` → corre lo que corre el CI, y el CI NO es `npm run verify`.** `verify` es
   **uno de los OCHO pasos** de `ci.yml` (medido 2026-08-13): `verify`, `build:docs`, los builds
   AOT de **supervisor, agent y cuscare**, `e2e`, `e2e:supervisor` y `e2e:cuscare`. Abre `ci.yml`
   y córrelos; es enumerable, no hay que adivinarlo.
   *Y esta regla se saltó a sí misma*: contaba cinco cuando el CI ya tenía ocho pasos, o sea que la
   regla escrita para que no te saltes un paso te mandaba saltarte los dos más nuevos. **Una
   enumeración copiada a prosa caduca en cuanto alguien añade un paso** (es la regla 17 aplicada a
   una fuente del propio repo). Eso ya no depende de que alguien se acuerde: `ci-preflight-parity`
   lo gatea desde `69f0951`.
   *Evidencia (s11)*: racionalicé un subset y pusheé; el verify completo cazó luego el desfase
   de `audit:components` (`sc-button` 9→12) que el subset se habría comido. Fix: `node
   scripts/component-audit.mjs --write` + commitea `docs/inventory.md` + `_component-status.json`.
   *Evidencia (s18) — **la regla existía, la cumplí al pie de la letra y aun así pusheé rojo***:
   corrí `verify` ENTERO (verde, 40s) y me salté `e2e:supervisor`, que es donde vivía mi
   cambio. CI rojo en 17 tests. La regla decía "verify entero" y yo leí eso como "todo"; el
   artefacto estaba mal nombrado. **Y el carril rápido que acababa de construir agrava esto**:
   itera con él, pero antes de pushear corre la suite entera — el fallo estaba justo en la
   parte que el carril no cubría.
   *Evidencia (s29) — SEGUNDA vez, disfrazada de "es solo un token".* Cambié un line-height del
   preset, corrí `verify` (26 gates, verde) y pusheé: los tokens tienen sus propios gates, ¿qué más
   va a hacer falta? El `e2e`, que `verify` NO incluye — un token mueve la GEOMETRÍA renderizada, y
   el alto que el textarea autoResize se graba a sí mismo vive en el `outerHTML` que fija
   `component-structure`: CI rojo en **DOS push seguidos**, verify verde en ambos, y el rojo pasó
   inadvertido porque tampoco leí el run (la otra mitad de esta regla). Racionalización a desarmar:
   **"es solo un token/CSS" NO es "verify basta"** — cualquier cambio visual o de token puede mover
   un baseline de `e2e`; tras uno, corre `npm run e2e:structure` (barato) antes de pushear, y la
   cadena entera una vez antes del push que shippea. **Ese atajo de un comando ya existe**: `npm run
   preflight` (creado en `69f0951` cerrando s29, cuando esta regla aún decía que no lo había), con un
   gate anti-drift que lo mantiene cuadrado con `ci.yml`. Corre ESE, una vez, sobre el árbol final —
   el ensamblaje manual de `ci.yml` es justo lo que se cae bajo prisa.

   *Corolario (s30) — si has AÑADIDO un test, un gate en verde NO prueba que lo haya ejecutado.*
   Metí dos gates en `components.spec.ts` y `preflight` dio `EXIT=0` **sin correr ninguno**: su
   anti-drift permite sustituciones locales y una cambiaba `npm run e2e` por `e2e:structure`, o sea
   **1 test en vez de 68**. Lo cacé porque fui a mirar en qué paso del CI vivían mis tests, no
   porque el gate avisara — un gate agregado puede correr un SUBCONJUNTO de lo que su nombre
   promete. **Acción**: tras escribir un test, `npx playwright test --list | grep <tu test>` con la
   config del gate que vas a creer, o abre la sustitución (`LOCAL_SUBSTITUTIONS` en
   `scripts/ci-preflight-parity.mjs`). *(Ese hueco se cerró en `649240d`; la lección no.)*

   *Corolario (s21), y es de COSTE, no de cobertura: la cadena entera SÍ, pero UNA sola vez por
   tarea.* Esta regla dice qué correr y no dice cuántas veces, así que la cumplí commit a
   commit: **4 rondas de `verify`, 3 de `e2e:supervisor`, 2 de `e2e` y 2 de los tres builds AOT**
   para una sola tarea, más la espera del CI en 5 pushes. Cada `verify` reconstruye el DS entero
   y cada `e2e:supervisor` son 125 tests: eso fue el grueso del tiempo de la tarea, y Rafa lo
   preguntó. **Acción**: commitea las veces que la historia merezca —los commits separados son
   los que hacen revertible una pieza sin las otras— pero **agrupa el PUSH**, y corre la cadena
   completa una vez, sobre el árbol final. Mientras iteras, el subconjunto que toca tu cambio.
   Y para un cambio que solo toca `.md`, lo único que puede romperse es `docs:guard`,
   `docs:coherence` y `lint`: correr `verify` entero ahí es exactamente el desperdicio que este
   corolario nombra.

   *Absorbe la antigua regla 9 — cómo se confirma ese verde: **LEYENDO el log o el run**, nunca
   un exit-code que no sea el del comando que te importa.* Correr la cadena no sirve de nada si
   luego te crees un código de salida ajeno. *Evidencia (s11)*: confirmé el CI con
   `gh run view --json conclusion`, no con el `EXIT=0` del watcher. *Evidencia (s26) — el atajo
   que yo mismo usaba estaba roto*: `npm run verify 2>&1 | tail -3; echo "VERIFY=$?"` devuelve el
   `$?` del **`tail`**, así que decía 0 con el lint en rojo; solo lo cacé porque el `✖ 1 problem`
   asomó en las tres líneas. *Y la regla, así escrita, NO me protegió (s30): nombraba el TUBO
   cuando el problema es la FORMA.* Corrí `npm run preflight > log 2>&1; echo "EXIT=$?" >> log`
   —sin tubería, cumpliendo la letra— y el `EXIT=1` del fichero era correcto; lo que dijo «exit
   code 0», **tres veces seguidas**, fue la NOTIFICACIÓN de la tarea en segundo plano, porque el
   harness informa del exit del comando **compuesto** y el último era mi propio `echo`. Encima se
   lo conté a Rafa como un fallo del notificador: decía la verdad sobre lo que le di. **No es el
   `| tail`: es que CUALQUIER cosa que pongas detrás —`echo`, `tee`, `sed`— pasa a ser el exit que
   se reporta.** Si envuelves algo cuyo verde te importa, deja el proceso de verdad al final (o
   `exit $?` explícito) — y aun así, lee el log.

   *Corolario (s30) — «este fallo no es mío» es una CLAIM, y se mide como cualquier otra.* Un test
   de `sc-command-palette` se puso rojo y lo descarté en voz alta —«otra página, otro componente,
   no lo toca nada de lo mío»— razonando sobre qué ficheros había editado. Era mío: la cabecera de
   sc-docs adelgazó **1px**, la lista se desplazó, y como el palette resaltaba el ítem bajo el
   cursor (Playwright deja el ratón donde hizo clic) bajo el puntero caía otro. Lo zanjó `git
   stash` + correr ESE test contra `HEAD` limpio: **dos minutos**, y lo hice DESPUÉS de afirmar lo
   contrario. **Acción**: antes de decir que un rojo es ajeno, córrelo en `HEAD` sin tus cambios.
   Y calcula el radio bien: tocar el SHELL compartido (cabecera, layout) mueve la geometría de
   TODA página, así que no es «los ficheros que edité» sino «todo lo que dependa de dónde caen las
   cosas» — ese 1px puso rojas las **39** baselines `fullPage` y un test de teclado.

6. **Tu test NUEVO se pone rojo → sospecha del test ANTES que del código. Y si pasa a la
   primera, sospecha igual.** Un test recién escrito falla casi siempre porque afirma mal, no
   porque el código esté roto; empezar por el código te lleva a "arreglar" algo sano. El verde
   es la mitad que no duele y por eso se cuela. *Evidencia (s25), ocho veces en una sesión y cuatro
   modos distintos*: (a) **contaba filas visibles** para probar que un filtro reduce resultados,
   pero con paginación de 10 el número no baja aunque filtre de 60 a 12 — la señal estaba en el
   TOTAL del pie; (b) **selector ambiguo**: `'Status'` casa también con "Sub-status" y `'Filter'`
   con "Delete filters" (que además está deshabilitado, así que el clic esperaba 90s); (c)
   **lectura de una sola pasada**: `allInnerTexts()`/`innerText()` no reintentan y capturaban el
   estado ANTERIOR al repintado de Angular — con `expect(locator).toHaveText()` (que reintenta)
   pasa; (d) **no esperar la segunda operación**: afirmé sobre un locator que ya estaba visible y
   conté los resultados de la búsqueda anterior. **Acción**: ante un rojo en un test nuevo,
   pregúntate primero *¿mide la magnitud correcta? ¿el selector casa solo con lo que creo? ¿la
   aserción reintenta? ¿espera al estado FINAL?* — y solo después mira el código. El caso
   contrario existe y también apareció: el e2e cazó que "Seleccionar todo" marcaba la fila
   bloqueada, que sí era un fallo real; distinguirlos es justo el trabajo.

   *Corolario (s27) — un test que falla y pasa sobre el MISMO código no es "mala suerte": es un
   test que lee sin reintentar, y su firma constante te lo está diciendo.* `component-structure`
   tumbó el CI **3 veces en un día** sobre commits que solo tocaban `.md`, y pasaba en local —
   siempre con la misma firma (`sc-select`: 8 esperados, 2 leídos). No era aleatorio: el helper
   esperaba a que existiera **uno** (`.first()).toBeVisible()`) y acto seguido leía **todos** con
   `evaluateAll`, que da una foto única sin reintento. En local la página pinta antes de que se
   llegue a leer; en CI, cargado, no. **Acción**: si una aserción compara un CONJUNTO, espera al
   **número** con algo que reintente (`toHaveCount`) antes de leerlo — nunca a "que haya alguno".
   Y para saber si el arreglo va: fabrica un número inalcanzable y comprueba que **agota el
   timeout** en vez de fallar al instante; eso prueba que el reintento está cableado, cosa que un
   verde no prueba. *Corolario del corolario*: un flake que tumba el CI 3 de 5 veces no es
   inocuo — es un gate que entrena a ignorar los gates (misma familia que la regla 13).

   *Y en s30 la MISMA lectura de una pasada me dio un VERDE FALSO — por eso el disparador de esta
   regla ya no dice solo "se pone rojo".* Escribí el gate del command palette con
   `page.evaluate(...)` leyendo la clase activa justo después de la tecla: `evaluate` no reintenta,
   así que leía ANTES de que Angular pintara y **pasaba en verde contra el componente roto**. Solo
   salió porque corrí el control esperando rojo. Y a la hora siguiente repetí el mismo gesto en el
   segundo test (`s.idx` = 0 tras `↓ x1`). El arreglo es el de arriba: esperar con algo que
   reintente (`toHaveClass`, `toHaveCount`, `expect.poll`) y solo entonces leer. **Acción nueva:
   cuando el test afirma que algo NO pasa, la espera no puede ser un timeout — espera a que el
   estímulo esté CONFIRMADO (instrumenta el evento) y afirma después**; si no, estás midiendo tu
   propia lentitud, no el producto.

   *Y para PROBAR que arreglaste una carrera (s31): si no consigues reproducirla, no la persigas
   — cambia el experimento hasta hacerla determinista.* Arreglado el test del loader, quise
   demostrarlo con carga artificial: 20 procesos `yes` en 10 núcleos (load average 37) y la
   versión VIEJA pasó 15/15. La carga sube la probabilidad, no la garantiza, así que ese verde no
   demostraba nada en ninguna de las dos direcciones. Lo que sí lo demostró fue **encoger la
   ventana en vez de ahogar la máquina**: bajé el `setTimeout` del componente de 380 ms a 20, con
   lo que "el sondeo llega tarde" pasa de probable a seguro — la vieja falló **5/5** con el mismo
   `element(s) not found` que reportaba el usuario y la nueva pasó **5/5**. **Acción**: para una
   aserción sensible al tiempo, el control no es correrla muchas veces con la máquina ocupada,
   es llevar la variable temporal a un extremo donde el resultado sea forzoso.

8. **La primera corrección no funciona → deja de proponer la segunda y MIDE dónde nace el
   efecto.** Encadenar arreglos a ciegas es caro y además puede empeorarlo. *Evidencia (s25),
   el caso negativo*: la cabecera de la tabla medía 44.5 en vez de los 41.5 medidos, y probé
   tres cosas sobre la celda del rótulo —fijar `line-height` (44.5), `font-size:0` (**49.5**,
   peor), meter el contenido en un contenedor de bloque (44.5)— antes de medir celda por celda
   y ver que la causa estaba **en otra celda**: el checkbox de la columna de selección, porque
   el alto de una fila lo marca su celda más alta. *El caso positivo, el mismo día*: con el
   reordenado por arrastre fallé UNA vez, monté un diagnóstico (¿arranca el drag? ¿cambia el
   panel? ¿cambia la tabla?) y salió que el código estaba bien y lo que medía mal era el test.
   **Disparador afilado**: tras el primer intento fallido, la siguiente acción es una MEDICIÓN
   que localice la causa, no otra edición.

## Alcance y ediciones

10. **Vas a declarar algo BLOQUEADO, o a deducir un dato a ojo → comprueba primero si el sistema
    ya te lo está sirviendo.** Lo que necesitas suele venir dentro de lo que la app ya te manda;
    aparcarlo o transcribirlo a mano es caro y, encima, sale peor. Dos evidencias de la misma
    sesión (s26), las dos replicando CusCare:
    - **Lo declarado imposible ya estaba en el DOM.** Di por bloqueado el contenido de los 4
      desplegables de acciones en bloque —"abrirlos ejecuta acciones sobre tickets reales"— y lo
      arrastré como pendiente **una sesión entera**. Resultó que los 4 paneles y sus 4 modales
      viven en el árbol desde que carga la página, ocultos: se midieron enteros con
      `getComputedStyle` sin pulsar nada. La suposición no costó un minuto comprobarla y nunca la
      comprobé.
    - **El copy estaba en su fichero de traducciones.** Estuve transcribiendo textos de
      pantallazos hasta que una clave sin traducir asomó en su UI y delató que hay un
      `assets/i18n/…/en.json` con **1449 claves**. Lo transcrito tenía dos fallos que el
      diccionario destapó: un subtítulo cortado en la preposición (`"…tickets to {{name}}"`, yo
      lo leí sin destino elegido) y una frase mía en castellano dentro de una interfaz inglesa.
    **Acción**: antes de aparcar algo por "no se puede ver sin efectos" o de transcribir a ojo,
    gasta una llamada en preguntar si ya está ahí — DOM oculto, fichero de i18n, hoja de estilos,
    lista de componentes. La versión servida por el sistema es exacta; la tuya es una copia.

    *Absorbe el "Meta (proceso)" que vivía dentro de DD-13 (movido aquí el 2026-08-13; era una
    regla de proceso viviendo en el registro de decisiones).* Ante un **"¿por qué el pipeline no
    trae X?"**, lee la doc del tool y **grepea `DECISIONS.md` ANTES de hipotetizar**: la respuesta
    a por qué PrimeNG no traía la tipografía —es document-level— **ya estaba escrita en la propia
    DD** que se estaba leyendo. Teorizar cuesta más que buscar, y encima sale mal.

11. **Toda edición masiva por shell lleva su verificación de outcome PEGADA en el mismo comando.**
   *Evidencia (s11)*: un `for f in $FILES` con lista multilínea **no hizo nada** (zsh no hace
   word-splitting como bash); lo cazó el `grep "pi pi-" || echo ninguno` del final. Sin él habría
   commiteado una migración de 12 iconos inexistente. En zsh, enumera los ficheros explícitamente.

12. **Tu comando alcanza más de lo que crees — al CONTAR, al REEMPLAZAR y al IMPRIMIR. Antes de
    dar una cifra, ejecutar un `sed` o volcar un fichero, pregúntate qué entra en el resultado.**
    - *Contando de más (s11)*: dije "111 usos de `p-button`" y lo escribí en el hand-off; los
      `<p-button>` reales eran **50** — el resto, etiquetas de cierre y clases CSS. *Y su forma
      recurrente (s28), que en este repo ya ha picado a TRES scripts: los **comentarios** entran
      en el conteo.* `component-audit` subió `sc-button` de 15 a 16 inputs porque su docstring
      nuevo menciona `input()` — un número falso, y encima dentro de un manifiesto generado, que
      es donde nadie lo va a dudar. `audit-primeng-coupling` tenía el mismo agujero (arreglado en
      s20). **Si tu regex mira un fichero de código, quítale los comentarios antes de contar o
      clasificar**; un docstring habla de la API, no la declara. *Y los GATES lo leen igual (s29)*:
      un «1px» en un comentario de `extend.ts` tumbó `audit:theme-scale` (prohíbe px en el preset);
      no escribas «Npx» ni en un comentario de un fichero gateado.
    - *Contando de menos (s18)*: `grep 'test('` me dio 39 tests en el supervisor; el runner
      dice **108**. Mis tests viven dentro de bucles `for`, así que el grep cuenta
      DECLARACIONES y el runner cuenta INSTANCIAS. **Cuando exista un ejecutor que sepa el
      número de verdad, el número es el suyo, no el de tu grep.**
    - *Reemplazando de más (s12)*: migrando `severity=`→`variant=` de `p-button` convertí el
      `severity` de un `<sc-message>`, que no tiene `variant`. Un `sed` por fichero entero
      pilla homónimos: acota el reemplazo a su ETIQUETA y verifica, por cada match, a qué
      etiqueta pertenece.
    - *Imprimiendo de más (s27) — y esta cuesta rotar una credencial*: para ver qué servidores
      MCP había configurados volqué el bloque entero de `~/.claude.json` con un `JSON.stringify`,
      y dentro venía el `env` con el **token personal de Figma en claro**. Salió impreso completo
      en el transcript. Lo detecté al verlo ya escrito, que es tarde: un secreto impreso una vez
      deja de ser secreto, y el arreglo no es borrar el mensaje, es **rotar el token**.
      **Acción**: antes de volcar cualquier fichero de configuración (`~/.claude.json`,
      `.env`, `settings.json`, la salida de un `docker inspect`…), **proyecta solo los campos que
      necesitas** o enmascara los sospechosos (`token`, `key`, `secret`, `password`, `env`) —
      `Object.keys()` en vez de `JSON.stringify()`, o un `.slice(0,7)+'…'`. Filtrar cuesta una
      línea; rotar cuesta entrar en dos servicios y reconfigurar el cliente.

## Entrega

14. **Con un "hazlo todo" / "adelante con todo": haz lo que puedas verificar de punta a punta,
    aparca lo demás DOCUMENTADO, y dilo explícitamente.** No lo pintes como "todo hecho".
    *Evidencia (s11)*: cerré lo acotado del Bloque 3 y dejé por escrito por qué `sc-button`
    (piloto hecho, resto por lotes), `sc-datatable`, Bloque 4 y 2b no entraban.

    *Afilado (s28) — aparca por FALTA DE VERIFICABILIDAD, nunca por PARECIDO con otro item ya
    aparcado.* Mandé "retirar `sc-bulk-transcription-modal`" a la lista de ESPERANDO A RAFA
    razonando que era «la misma clase de decisión que `sc-page-header`», que ya estaba ahí. El
    parecido era real y la conclusión, falsa: al investigarlo de verdad el componente **está en
    el Kit** (único bajo `aura/custom` de `kit-export-dtcg.json`), así que no había nada que
    decidir — ni se adopta ni se retira. La evidencia estaba a un grep y no lo hice **porque el
    precedente me dio permiso para dejar de investigar**. Eso es lo caro: un aparcado no es una
    conclusión, es la ausencia de una, y encima devuelve trabajo a quien te lo dio. **Acción**:
    antes de escribir "esperando a X" o "bloqueado", gasta UNA sonda más en la evidencia que
    decidiría; y si aparcas, que sea porque no puedes verificarlo o porque la decisión es suya
    de verdad (marca, producto, borrado irreversible), no porque se parezca a algo aparcado.

15. **Si una decisión es de marca/producto (no técnica), preséntala con recomendación y
    evidencia — no la decidas tú.** *Evidencia (s11)*: el estilo de icono (Outlined vs Rounded)
    tenía drift en 3 sitios y el hand-off recomendaba lo contrario que el código de las apps;
    plantearlo evitó revertir una decisión de marca ya tomada.

    *Corolario (s27) — el ENCUADRE DE RIESGO es parte de la evidencia: si lo exageras, le has
    inclinado la decisión con una premisa falsa.* Aquí cumplí la regla al pie —recomendación,
    evidencia y `AskUserQuestion`— pero para quitarle peso a la elección escribí que borrar la rama
    era «barata y **reversible** en las dos direcciones». Rafa lo cuestionó: «¿cómo que borrar es
    reversible? si me acuerdo de esto dentro de un año, ¿se podría rescatar?». La respuesta honesta
    era **no**: borrar una rama deja los commits inalcanzables, el reflog local los tritura a los
    ~30-90 días, y que GitHub los sirva por SHA es comportamiento observado, no garantía escrita.
    Mi frase era cierta a una semana vista y falsa al año, que es justo el horizonte que a él le
    importaba. **Acción**: si justificas una acción destructiva con «es reversible», di el
    **horizonte** y el **mecanismo** ("recuperable por reflog ~30 días") — y si no te gusta cómo
    suena dicho así, hazla reversible ANTES en vez de matizar después: aquí bastó
    `git tag -a archive/<nombre>` empujado a `origin`, que fija esos commits para siempre. Entonces
    la palabra ya era verdad.

16. **Antes de un refactor transversal, monta primero la red que lo verifica — y hazlo aunque
    parezca un rodeo.** *Evidencia (s12)*: la suite e2e del supervisor cazó dos bugs el mismo día
    que nació: uno preexistente (desplegables tapados por el dock) y una regresión mía (kebab que
    abría el modal al hacer la fila clicable). Sin ella, la migración de 47 botones y el swap de
    220 iconos se habrían pusheado a ciegas.

17. **Cualquier DESCRIPCIÓN heredada de una fuente de verdad externa —diagnóstico, spec, nodo de
    Figma, contrato— es una paráfrasis: vuelve a la fuente antes de construir encima.** No vale
    solo para "está roto por X": vale igual para "el diseño dice Y". *Evidencia (s12)*: el
    hand-off decía que `tokens-sync` fallaba por "drift en capas curadas"; reproducido, la causa
    era otra. *Evidencia (s14) — **la regla ya existía y aun así la incumplí***: implementé la
    tarjeta de impacto desde el resumen escrito de s12 («número héroe 40px, extrabold, color de
    acento») en vez de abrir el nodo. El resumen decía *número*; el nodo tenía **una frase entera
    en un solo nodo de texto**. Salió una cifra grande con una etiqueta gris al lado, que es otra
    cosa. Al medir contra el nodo aparecieron 6 desviaciones más que el resumen no mencionaba.
    **Por qué no disparó**: la regla hablaba de *diagnósticos de fallo* y yo estaba leyendo un
    *spec de diseño*, así que no me sentí aludido. El disparador correcto es: **si vas a
    implementar contra algo que existe fuera del repo y lo que tienes delante es texto sobre ello,
    para y abre la fuente** — cuesta una llamada.

    *Corolario (s23) — vale también cuando solo ACONSEJAS, y cuando la fuente es tu propio
    código.* La regla decía «implementar» contra una fuente «fuera del repo», así que no disparó
    al soltar una recomendación de refactor a devs («cambiad el kebab por p-button, exponed
    [contextMenu]») redactada sin abrir el componente: ya había un p-menu compartido reusado por
    kebab Y click derecho, y el swap era fiddly. El mismo día aconsejé sobre un token («quizá ya
    tengas accent/violet») sin leer el CSS, y --sc-text-violet sí existía. Disparador afilado:
    antes de RECOMENDAR un cambio o AFIRMAR un estado de este código, abre el fichero primero; si
    no lo has abierto, di "no lo he mirado", no lo supongas — aunque solo estés conversando.

    *Corolario (s24) — el disparador es cualquier ESTADO que vas a firmar en un entregable, venga
    de donde venga, no solo "este código".* El corolario anterior decía "este código", así que no
    disparó al meter "Casi" en la tabla de estado de Chip/Toast: ese veredicto salía del comentario
    de Marta en Jira, no de una medición mía, pero dentro de la tabla se lee como MI dictamen. Rafa
    preguntó "¿tú lo has mirado?" — no. Lo mismo con el ancho: escribí "el select no tiene ancho
    fijo" (cierto en la WEB) como verdad a secas, y en Figma la instancia está a **216 fijos**; una
    propiedad medida en UN artefacto/estado hay que acotarla a ése. **Disparador afilado**: antes de
    que un estado entre en un entregable (tabla, PNG, comentario que firmas), o lo mides tú, o lo
    etiquetas "según X / sin verificar"; y toda medida lleva pegado DE QUÉ artefacto y estado sale
    (web vs Figma, vacío vs elegido). Corolario barato: si al final lo mides —como hice con el Toast
    tras la pregunta—, casi siempre confirma la pista, pero ahora es medido, no heredado.

    *Corolario (s27) — **RESCATAR una claim de un doc archivado al doc VIVO es donde MÁS hay que
    verificar, y es donde menos lo hice.*** Al borrar `docs/history/` salvé a `DECISIONS.md` un
    párrafo del plan de convergencia que decía «a usuarios le falta `bulkUpdate()`, es decisión de
    producto → preséntala». Existía desde hacía un mes (`users.store.ts:62`, commit `094f0f4`) y
    pasaba por undo. Lo escribí en un **DD nuevo** sin abrir el fichero. **Por qué duele más que
    una paráfrasis normal**: mover algo de un archivo muerto al registro vivo le da un **ascenso de
    credibilidad** — mañana nadie lo leerá como «esto venía de un plan viejo», lo leerá como una
    decisión firmada. **Disparador**: cuando copies una frase de un doc que estás archivando o
    borrando, verifica CADA claim comprobable antes de darle sitio en el destino; el motivo por el
    que archivas ese doc (está rancio) aplica a lo que te llevas de él.

    *Absorbe la antigua regla 10 (s11) — un item de audit/plan redactado como «solo hay que…» o
    «nada usa X» es exactamente eso, una paráfrasis: verifica su precondición literal contra el
    código antes de ejecutarlo.* 4 de 4 items del `AUDIT-2026-07` eran más grandes o falsos —
    «nada los lee» era falso (lo leía el plumbing de load/save/duplicate) y los PrimeIcons eran
    PrimeIcons de verdad, no mapeados por ningún resolver.

    *Corolario (s25) — **la regla estaba escrita, la había afilado yo, y volví a romperla**: el
    diagnóstico de OTRO AGENTE también es una paráfrasis.* La extensión de Chrome informó de que
    `sc-demo` no se podía borrar por un bug conocido de Cloudflare con «más de 100 deployments».
    Lo repetí a Rafa como hecho, y encima construí encima una recomendación (instala Wrangler,
    monta un script de borrado masivo). Cuando por fin corrió `wrangler pages deployment list`:
    **~26 deployments**. El bug probablemente ni aplicaba y le mandé por un rodeo. **Por qué no
    disparó**: el corolario anterior habla de «este código» y la fuente aquí era un servicio
    externo relatado por un tercero, así que no me sentí aludido. **Disparador definitivo**: si
    la afirmación no la has verificado TÚ —da igual que venga de un hand-off, de un README, de
    Figma, de tu propio resumen o de otro agente— es una paráfrasis. Verifícala o etiquétala
    («según la extensión, sin confirmar»); nunca la reenvíes como hecho ni construyas un plan
    sobre ella.

18. **Vas a zanjar una decisión VISUAL con un argumento —rebatiendo al usuario o discutiéndola
    contigo mismo— → constrúyela en su versión mínima y MÍRALA.** Un principio bien enunciado
    suena a autoridad y no lo es: puede estar protegiendo algo que en el código ya no existe.
    *Evidencia (s14)*: rechacé unificar el fondo de página con
    «una tarjeta sobre un lienzo de su mismo color deja de ser tarjeta». Al medirlo, la diferencia
    de relleno tarjeta/lienzo era de **1.06:1** — las tarjetas ya se leían por su borde, no por el
    fondo, así que mi principio defendía una distinción inexistente. Y la medición destapó algo
    peor que ninguno de los dos veía: en oscuro `--sc-border-subtle` **es el mismo color que la
    tarjeta** (1:1), o sea que ahí no hay borde. Medir convirtió una discusión de opiniones en un
    hallazgo, y de paso le dio la razón a él.

    *Corolario (s21) — vale igual cuando el que discute eres tú solo.* Al devolver el título de
    página al cuerpo me quedé un buen rato sopesando en abstracto si la miga necesitaba un tramo
    padre: enumeré cuatro modelos, me fui a los pros y contras de cada uno y no avancé. Lo zanjó
    **una captura**: puesto el título, «Usuarios» encima de «Usuarios» se ve en un segundo y no
    hay nada que sopesar. La versión mínima ya construida es más barata que la deliberación —
    móntala y mírala **antes** de escribir el tercer argumento, no después.
