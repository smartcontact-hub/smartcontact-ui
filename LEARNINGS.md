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

2. **Dos validadores que comparten el modo de fallo NO se corroboran.** *Evidencia (s11)*: creí
   confirmar lo anterior porque un `dispatchEvent` sintético también "fallaba" — pero ninguno
   de los dos puede disparar la activación nativa de un enlace. Antes de sumar una segunda
   señal, pregunta si puede fallar por la misma causa que la primera.

3. **Vas a atribuir un warning/error a tu cambio (o a "ya estaba") → pruébalo con
   stash-y-reproduce.** Cuesta ~2 llamadas y convierte "creo" en "comprobado". *Evidencia
   (s11)*: el warning de presupuesto SÍ era mío (lo arreglé borrando CSS muerto en vez de
   recortar diseño); los errores de View Transitions NO lo eran (mismos errores sin mi cambio).

4. **Compruebas el DOM en la misma llamada síncrona que dispara la acción → falso negativo.**
   Angular aún no ha renderizado. *Evidencia (s11)*: el lightbox y un `p-menu` salieron
   "cerrados" justo tras el click, y estaban abiertos. Dispara en una llamada, comprueba en otra.

5. **Tu cambio en el DS no se ve en la app → NO es que la regla no entre: el dev server sirve
   el paquete COMPILADO.** *Evidencia (s12)*: cambié el `opsz` del icono, medí en el navegador y
   seguía en 24; el CSS fuente ya decía 14. Faltaba `build:icons` + reiniciar. Antes de dudar de
   la especificidad, comprueba si lo que sirve el servidor es tu código.

6. **Reproduces un fallo de CI en local → replica también sus VARIABLES.** *Evidencia (s12)*:
   `tokens:export-clean` se salta con `CI=1`, así que sin esa variable "reproduje" un fallo que
   en el workflow no existe. Un repro con el entorno equivocado mide otra cosa.

6b. **Mides en un dev server con HMR y el valor no cuadra → RECARGA DURA antes de acusar a tu
   código.** El hot-reload deja vistas y `TemplateRef` del componente ANTERIOR: sus nodos
   conservan el `_ngcontent` viejo, cuyos estilos ya se han retirado. *Evidencia (s13)*: el
   título y el chip proyectados a la TopBar medían 32px y sin píldora; concluí "mi SCSS no
   entra". Tras `location.reload()`: 16px y píldora correcta — el CSS siempre estuvo bien.
   Corolario del mismo día: al sondear la URL de un `@font-face`, resuélvela contra la HOJA DE
   ESTILOS y no contra `location.href`, o te inventas un 404 que no existe (me pasó, y casi
   firmo "la fuente no carga" con una sonda mal construida).

19. **Vas a comprobar un comportamiento INTERACTIVO (click, tecla, arrastre, foco, overlay) →
   escríbelo como test de Playwright, no lo conduzcas a mano por el navegador.** Un
   `dispatchEvent` apunta al elemento que TÚ eliges y se salta el hit-testing, así que es
   estructuralmente incapaz de detectar el fallo más común de la interacción: *que el click
   real lo reciba otro elemento*. Playwright clica coordenadas de verdad y sí lo cazaría.
   *Evidencia (s15), medida contra el MISMO código roto —reintroduje el bug a propósito para
   comprobarlo, porque al principio me lo estaba deduciendo—*: el shift+click de rango
   fallaba porque la casilla ocupa 16px en el centro de una celda de 40 y su
   `stopPropagation` se comía el handler del rango. Mi sonda (`dispatchEvent` sobre el
   `<td>`) daba **[1,2,3,4] = verde**; el test de Playwright daba **rojo**. El bug vivía
   exactamente donde apunta todo el mundo y mi canal no podía verlo.
   **Corolario**: no encadenes dos interacciones en la misma llamada síncrona. Al hacerlo
   para "reproducir más rápido" obtuve un tercer resultado distinto ([2,3,4]) que no era ni
   el bug ni el comportamiento bueno, sino estado rancio de signals — y casi lo escribo como
   si fuera el hallazgo. Una interacción por llamada, o un test.

## Gates y push

7. **El commit toca componentes (`sc-*`, plantillas) y va a `git push` → corre `npm run verify`
   ENTERO antes, no un subset.** "AOT verde" NO basta: el AOT caza plantillas pero no corre
   `test:unit` ni `audit:components`. *Evidencia (s11)*: racionalicé el subset y pusheé; luego,
   en el piloto de `sc-button`, el verify completo cazó el desfase de `audit:components`
   (`sc-button` 9→12 usos) que el subset se habría comido. Fix: `node
   scripts/component-audit.mjs --write` + commitea `docs/inventory.md` + `_component-status.json`.

8. **Vas a crear un `.md` nuevo en el repo → regístralo en `docs/DOCS-INDEX.md` en el mismo
   commit.** `docs:guard` escanea **todos** los `.md` (docs/ recursivo + raíz) y exige mapeo por
   basename; solo `README.md` y el propio índice están exentos. Sin registrar = `verify` rojo.

9. **Confirma el verde LEYENDO el log o el run**, nunca el exit-code de un proceso en background
   (puede ser espurio). *Evidencia (s11)*: confirmé el CI con `gh run view --json conclusion`,
   no con el `EXIT=0` del watcher.

## Alcance y ediciones

10. **Un item de audit/plan redactado como "solo hay que…" o "nada usa X" → verifica su
   precondición literal contra el código antes de ejecutarlo.** *Evidencia (s11)*: 4 de 4 items
   del `AUDIT-2026-07` eran más grandes o falsos — "nada los lee" era falso (lo leía el plumbing
   de load/save/duplicate), y los PrimeIcons eran PrimeIcons **de verdad**, no mapeados por
   ningún resolver como yo había hipotetizado.

11. **Toda edición masiva por shell lleva su verificación de outcome PEGADA en el mismo comando.**
   *Evidencia (s11)*: un `for f in $FILES` con lista multilínea **no hizo nada** (zsh no hace
   word-splitting como bash); lo cazó el `grep "pi pi-" || echo ninguno` del final. Sin él habría
   commiteado una migración de 12 iconos inexistente. En zsh, enumera los ficheros explícitamente.

12. **Un reemplazo masivo de ATRIBUTO se acota a su ETIQUETA, y se verifica preguntando a qué
    etiqueta pertenece cada match.** Un `sed`/regex por fichero entero pilla homónimos de otros
    componentes. *Evidencia (s12)*: migrando `severity=`→`variant=` de `p-button` convertí el
    `severity` de un `<sc-message>` (que no tiene `variant`). Lo cazó un chequeo posterior que,
    por cada match, buscaba hacia atrás la etiqueta contenedora.

13. **Antes de dar una cifra de alcance ("N usos"), comprueba QUÉ está contando tu grep.**
    *Evidencia (s11)*: dije "111 usos de `p-button`" y escribí eso en el hand-off; los
    `<p-button>` reales eran **50** — el resto eran etiquetas de cierre y clases CSS. Acota el
    match a la etiqueta real antes de dimensionar una migración.

## Entrega

14. **Con un "hazlo todo" / "adelante con todo": haz lo que puedas verificar de punta a punta,
    aparca lo demás DOCUMENTADO, y dilo explícitamente.** No lo pintes como "todo hecho".
    *Evidencia (s11)*: cerré lo acotado del Bloque 3 y dejé por escrito por qué `sc-button`
    (piloto hecho, resto por lotes), `sc-datatable`, Bloque 4 y 2b no entraban.

15. **Si una decisión es de marca/producto (no técnica), preséntala con recomendación y
    evidencia — no la decidas tú.** *Evidencia (s11)*: el estilo de icono (Outlined vs Rounded)
    tenía drift en 3 sitios y el hand-off recomendaba lo contrario que el código de las apps;
    plantearlo evitó revertir una decisión de marca ya tomada.

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

18. **Vas a rebatir una propuesta del usuario con un principio de diseño → MIDE primero el estado
    actual.** Un principio bien enunciado suena a autoridad y no lo es: puede estar protegiendo
    algo que en el código ya no existe. *Evidencia (s14)*: rechacé unificar el fondo de página con
    «una tarjeta sobre un lienzo de su mismo color deja de ser tarjeta». Al medirlo, la diferencia
    de relleno tarjeta/lienzo era de **1.06:1** — las tarjetas ya se leían por su borde, no por el
    fondo, así que mi principio defendía una distinción inexistente. Y la medición destapó algo
    peor que ninguno de los dos veía: en oscuro `--sc-border-subtle` **es el mismo color que la
    tarjeta** (1:1), o sea que ahí no hay borde. Medir convirtió una discusión de opiniones en un
    hallazgo, y de paso le dio la razón a él.
