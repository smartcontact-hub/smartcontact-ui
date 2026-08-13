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
> Ámbito: reglas de proceso **del repo**, versionadas y visibles para todo el mundo. Los
> hechos del proyecto (arquitectura, decisiones, estado) NO van aquí: van a `docs/` y a
> `NEXT-SESSION.md`.

## Verificación (lo que más caro me ha salido)

1. **Vas a concluir "X no funciona" a partir de una interacción por herramienta → primero
   demuestra que tu estímulo LLEGÓ.** Un negativo salido de un canal sin validar no es
   evidencia. *Evidencia (s11)*: afirmé —subrayando "reproducible"— que las filas de
   `sc-datatable` no se activaban con Enter; la acción `key` del navegador entrega los eventos
   con `key`/`code` **vacíos**, y sin un clic previo en la página ni llegan. Tuve que
   retractarme. Instrumenta con un `addEventListener` de una línea; si no puedes probarlo, el
   veredicto es **"sin verificar"**, nunca "roto".

   *Corolario (s11)*: **dos validadores que comparten el modo de fallo no se corroboran.** Creí
   confirmar aquel negativo porque un `dispatchEvent` sintético también "fallaba" — pero ninguno
   de los dos podía disparar la activación nativa de un enlace. Antes de sumar una segunda
   señal, pregunta si puede fallar por la misma causa que la primera.

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
   correr la sonda, di en voz alta qué magnitud devuelve y si es la de la pregunta.

   *Corolario B (s21) — un control que no LEES no es un control.* En la sonda siguiente sí puse
   un valor conocido… y el control falló (`ctx.fillStyle = 'var(--x)'` no resuelve la variable:
   devolvía negro donde esperaba blanco). Solo sirvió porque miré su línea antes que las demás.
   Si el control no pasa, la medición entera queda invalidada aunque el resto parezca sensato.

3. **Vas a atribuir un warning/error a tu cambio (o a "ya estaba") → pruébalo con
   stash-y-reproduce.** Cuesta ~2 llamadas y convierte "creo" en "comprobado". *Evidencia
   (s11)*: el warning de presupuesto SÍ era mío (lo arreglé borrando CSS muerto en vez de
   recortar diseño); los errores de View Transitions NO lo eran (mismos errores sin mi cambio).

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
   **Acción**: antes de la siguiente medición, pregúntate qué puede estar sirviendo/pintando
   algo viejo — build, server, HMR o animación — y neutralízalo (rebuild, reinicio, recarga
   dura, espera de asentamiento). Cuesta segundos; la alternativa es depurar código que no se
   está ejecutando o un DOM que aún no ha terminado de moverse.

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
   **uno de los cinco pasos** de `ci.yml`; los otros cuatro son `build:docs`, el build AOT de
   supervisor y de agent, `e2e` y `e2e:supervisor`. Abre `ci.yml` y córrelos; es enumerable, no
   hay que adivinarlo.
   *Evidencia (s11)*: racionalicé un subset y pusheé; el verify completo cazó luego el desfase
   de `audit:components` (`sc-button` 9→12) que el subset se habría comido. Fix: `node
   scripts/component-audit.mjs --write` + commitea `docs/inventory.md` + `_component-status.json`.
   *Evidencia (s18) — **la regla existía, la cumplí al pie de la letra y aun así pusheé rojo***:
   corrí `verify` ENTERO (verde, 40s) y me salté `e2e:supervisor`, que es donde vivía mi
   cambio. CI rojo en 17 tests. La regla decía "verify entero" y yo leí eso como "todo"; el
   artefacto estaba mal nombrado. **Y el carril rápido que acababa de construir agrava esto**:
   itera con él, pero antes de pushear corre la suite entera — el fallo estaba justo en la
   parte que el carril no cubría.

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

9. **Confirma el verde LEYENDO el log o el run**, nunca un exit-code que no sea el del comando que
   te importa. *Evidencia (s11)*: confirmé el CI con `gh run view --json conclusion`, no con el
   `EXIT=0` del watcher.
   *Evidencia (s26) — **el atajo que yo mismo usaba estaba roto***: cerré media sesión con
   `npm run verify 2>&1 | tail -3; echo "VERIFY=$?"`. Ese `$?` es el del **`tail`**, no el del
   verify, así que decía 0 con el lint en rojo; solo lo cacé porque el `✖ 1 problem` asomó en las
   tres líneas del `tail`. Si vas a mirar un código de salida, que sea del proceso correcto
   (`set -o pipefail`, o redirige a fichero y mira `$?` sin tubería) — y aun así, lee el log.

6. **Tu test NUEVO se pone rojo → sospecha del test ANTES que del código.** Un test recién
   escrito falla casi siempre porque afirma mal, no porque el código esté roto; empezar por el
   código te lleva a "arreglar" algo sano. *Evidencia (s25), ocho veces en una sesión y cuatro
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

11. **Toda edición masiva por shell lleva su verificación de outcome PEGADA en el mismo comando.**
   *Evidencia (s11)*: un `for f in $FILES` con lista multilínea **no hizo nada** (zsh no hace
   word-splitting como bash); lo cazó el `grep "pi pi-" || echo ninguno` del final. Sin él habría
   commiteado una migración de 12 iconos inexistente. En zsh, enumera los ficheros explícitamente.

12. **Tu patrón casa algo distinto de lo que crees — al CONTAR y al REEMPLAZAR. Antes de dar
    una cifra o de ejecutar un `sed`, pregúntate qué está casando cada match.**
    - *Contando de más (s11)*: dije "111 usos de `p-button`" y lo escribí en el hand-off; los
      `<p-button>` reales eran **50** — el resto, etiquetas de cierre y clases CSS.
    - *Contando de menos (s18)*: `grep 'test('` me dio 39 tests en el supervisor; el runner
      dice **108**. Mis tests viven dentro de bucles `for`, así que el grep cuenta
      DECLARACIONES y el runner cuenta INSTANCIAS. **Cuando exista un ejecutor que sepa el
      número de verdad, el número es el suyo, no el de tu grep.**
    - *Reemplazando de más (s12)*: migrando `severity=`→`variant=` de `p-button` convertí el
      `severity` de un `<sc-message>`, que no tiene `variant`. Un `sed` por fichero entero
      pilla homónimos: acota el reemplazo a su ETIQUETA y verifica, por cada match, a qué
      etiqueta pertenece.

13. **Construyes un comprobador (guardián, red, sonda) → enumera las DIMENSIONES sobre las que
    varía y pruébalo en cada una, no solo en la que tenías en la cabeza.** Probar un checker
    en un eje y darlo por bueno es el mismo agujero que él existe para tapar.
    *Evidencia (s18), y duele porque es dentro del arreglo*: escribí un guardián de "build
    rancio" y lo validé en el eje **rancio↔fresco** —rojo contra un build viejo, verde contra
    uno nuevo, muy satisfactorio—. No lo validé en el eje **claro↔oscuro**: leía siempre el
    valor claro del token, así que en tema oscuro comparaba slate-600 contra el slate-500 que
    el navegador computa CORRECTAMENTE, y acusaba de rancio a un build recién hecho. 17 tests
    rojos en CI. Un guardián con falsos positivos es peor que ninguno: enseña a ignorarlo.
    **Corolario**: y cuando lo pruebes contra un artefacto "viejo", **comprueba que sigue
    siendo viejo**. Reusé `dist/supervisor/browser` como build rancio sin mirar que se había
    regenerado entretanto; el verde que obtuve no probaba nada. Fabricar el caso malo a mano
    (copiar y rebobinar el valor) cuesta 30 segundos y no caduca.

## Entrega

14. **Con un "hazlo todo" / "adelante con todo": haz lo que puedas verificar de punta a punta,
    aparca lo demás DOCUMENTADO, y dilo explícitamente.** No lo pintes como "todo hecho".
    *Evidencia (s11)*: cerré lo acotado del Bloque 3 y dejé por escrito por qué `sc-button`
    (piloto hecho, resto por lotes), `sc-datatable`, Bloque 4 y 2b no entraban.

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

20. **Tu comprobación da VERDE → pregúntate si mide algo que tú no escribiste.** Cuando el
    arreglo y la lista de comprobación salen de la misma cabeza, el verde es circular: mides
    justo las propiedades que te propusiste reproducir, y por eso coinciden. *Evidencia (s16)*:
    al migrar labels a `sc-datatable` medí alto de fila, paddings, tipografía y colores contra
    la tabla original — **"DIFERENCIAS: ninguna"**. La captura, hecha a continuación, enseñaba
    dos defectos que mi lista no podía ver porque yo no los había pensado: una franja vacía
    sobre la cabecera (PrimeNG pinta siempre la banda de `caption`) y las columnas recolocadas
    ~290px (`main.scss` fuerza `table-layout: fixed` en `table.table` y la tabla del DS es
    `auto`). Las dos venían de cosas que yo no había escrito: una del componente de terceros y
    otra de una regla global de hace meses. **Acción**: cierra siempre con una observación que
    no dependa de tu inventario — la pantalla entera, o comparar contra un control que no has
    tocado (aquí, una tabla sin migrar; fue lo que confirmó que en oscuro el defecto era
    preexistente y no mío).

    *Corolario (s18) — el filtro que pusiste para quitar ruido es el que esconde el caso más
    común.* Mi red de contraste solo miraba elementos **con fondo propio**, porque parecía lo
    razonable para no medir basura. Dio **34/34 verde**. Pero el texto casi siempre vive en un
    `<span>` sin fondo dentro de un contenedor que sí lo tiene: al quitar ese filtro
    aparecieron **seis defectos reales**, uno de ellos a 1.30:1. **Disparador**: cuando una red
    tuya se pone verde a la primera, enumera en voz alta qué está EXCLUYENDO y pregúntate si
    el caso típico cae dentro de la exclusión.
