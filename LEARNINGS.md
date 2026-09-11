# LEARNINGS — reglas de proceso ganadas trabajando en este repo

> **Formato**: `Disparador → acción` y UNA línea de `Evidencia:`. Sin disparador no se dispara.
> **Los números son IDENTIFICADORES, no un orden**: código y docs citan `LEARNINGS #N`; nunca
> renumeres; al fundir, el absorbido desaparece y el superviviente no se toca (3→5, 9→7, 13→2, 20→2).
> Ámbito: proceso del repo, versionado. Hechos del proyecto → `docs/`; estado → `docs/handoff/`.
> **Dónde vive cada cosa**: lo que una MÁQUINA puede vigilar es un hook o un gate (`scripts/hooks/`,
> `npm run verify`); lo que solo un agente juzga es una regla de aquí; la tarjeta de `CLAUDE.md` viaja
> en cada turno; el terreno va a memoria. `/reflect` enruta en ese orden; ⚙️ marca lo ya vigilado.
> **La forma la vigila un gate** (`docs:coherence` K): ≤200 líneas, ≤20 reglas, ≤12 por regla, sin
> sub-entradas; y ESCALA: ≥3 sesiones de evidencia sin ⚙️ ponen rojo hasta mecanizar o declarar. Un
> párrafo propio es otra regla o un hook. Historia: `git log -S'(s31)' -- LEARNINGS.md` y el tag
> `archive/learnings-2026-09-02`.

## Índice de disparadores — escanea esto, baja solo a la que te aplique

| # | Si estás a punto de… | → |
|---|---|---|
| **1** | concluir que algo NO funciona, **o que ya lo arreglaste tocando una opción** | demuestra que tu estímulo —o tu opción— LLEGÓ **y que es el que el sistema produce de verdad, no uno que inyectaste tú**; no extiendas el negativo más allá de lo que mediste |
| **2** | creerte un hallazgo (o un verde) de una sonda **tuya**, incluido un TEST | valida el instrumento con un caso conocido; pruébalo en todos sus ejes; valida el CANAL (rojo y verde pueden venir de otro sitio); y mira si tu **doble contesta la pregunta que hace el código** — si lo hace, el test se mide a sí mismo |
| **4** | arreglar un valor sustituyéndolo por otro token | mide el token de DESTINO antes (fondo y texto, misma familia) |
| **5** | dudar entre tu código y tu medición | lo rancio es la medición: build, server, HMR, animación, **el repo bajo tus pies** ⚙️, **otra instancia (un deploy)**, la máquina ahogada… o atribución. Y si el test miraba un TRANSITORIO, la carga es el disparador, no la causa |
| **6** | creerte un test NUEVO — se ponga rojo **o pase a la primera** | sospecha del test primero: ¿mide la magnitud? ¿el selector casa? ¿reintenta? ¿espera al estado final? Y para probar el arreglo de una CARRERA, hazla determinista en vez de correrla con carga |
| **7** | hacer `git push`, **o lanzar la cadena** | `preflight` (o `:scope --run`) UNA vez sobre el árbol final —"final" = ya no vas a escribir nada más, ni un `.md`—; **`verify` NO es ese gate: se salta los builds AOT de las apps**. Los e2e los corre el CI (9 pasos), no el preflight (DD-60): si tocaste e2e o algo visual, corre a mano la suite que toca — las baselines visuales de sc-docs NO las corre ningún gate. **+ `guard:lockfile` si tocaste el lock**. Confirma el verde LEYENDO el CI: `npm run ci:verdict` |
| **8** | proponer una segunda corrección tras fallar la primera | para: la siguiente acción es una MEDICIÓN que localice la causa |
| **10** | declarar algo bloqueado, deducir un dato a ojo, **o diseñar un mecanismo nuevo** | comprueba qué te sirve ya el sistema (DOM oculto, i18n, hoja de estilos) y **qué lo vigila ya** (`.githooks/`, `.claude/settings.json`, `scripts/`) |
| **11** | lanzar una edición masiva por shell | pega la verificación de outcome en el MISMO comando (zsh no hace word-splitting) |
| **12** | dar una cifra de un grep **o de un `querySelectorAll`**, ejecutar un `sed`, **o volcar un fichero de config** | pregúntate qué entra en el resultado; si hay un ejecutor que sabe el número, el número es el suyo; y **proyecta o enmascara antes de imprimir un `env`** |
| **14** | responder a un "hazlo todo", escribir "esperando a X", **o anotar en un reporte algo que mediste** | haz lo verificable de punta a punta y aparca lo demás DOCUMENTADO — pero por no poder verificarlo, **nunca por parecido con otro aparcado ni por estar ya redactando** |
| **15** | decidir algo de marca/producto | preséntalo con recomendación y evidencia — y no exageres el encuadre de riesgo |
| **16** | empezar un refactor transversal | monta antes la red que lo verifica, aunque parezca rodeo |
| **17** | construir sobre una descripción que no verificaste tú | es una paráfrasis: vuelve a la fuente (da igual si viene de un hand-off, Figma, un README u otro agente) |
| **18** | zanjar una decisión VISUAL discutiendo | constrúyela en su versión mínima y MÍRALA |
| **19** | elegir cómo validar algo | por la PREGUNTA: gesto→Playwright · aspecto→captura · ¿sabrán usarlo?→recorrido cognitivo |
| **21** | escribir en un LEDGER compartido (`DECISIONS`, `LEARNINGS`, `inventory`, `handoff`, `AGENTS`) o aterrizar en una rama que otro worktree tiene abierta | mira su `status` y el tip ANTES de empezar, no solo al aterrizar; una rama, una sesión; y compara contra `origin/main` tras `fetch`, no contra tu `main` local |

---

## Verificación (lo que más caro me ha salido)

1. **Vas a concluir "X no funciona" desde una interacción por herramienta, o "X ya está arreglado"
   tras tocar una opción → demuestra que tu estímulo (o tu opción) LLEGÓ, y que es el que el
   sistema produce de verdad, no uno que inyectaste tú.** Instrumenta (`addEventListener`,
   `matchMedia`, `getComputedStyle`), relee tus propias mediciones de la sesión antes de probar, y
   nombra el sujeto EXACTO que mediste: un nombre colectivo ("el MCP", "el CI") son varias piezas
   que caen por separado. Dos validadores con el mismo modo de fallo no se corroboran. Si no puedes
   probarlo, el veredicto es "sin verificar", nunca "roto". ⚙️ no mecanizable (tarjeta, punto 3).
   Evidencia: s11 Enter en `sc-datatable` (la acción `key` manda `key` vacío) · s31 inyecté `600px`
   y declaré roto lo que PrimeNG normaliza · s32 `reducedMotion` escrito y no entregado · s27 "el
   MCP de Figma" eran tres servers y sondeé uno.

2. **Tu sonda o tu test te da un hallazgo (positivo o verde) y lo escribiste tú → valida el
   instrumento con un caso cuya respuesta ya sabes, en TODOS los ejes en que varía, y ponle el
   fallo delante para ver que enrojece.** Pregunta por la MAGNITUD (¿color o geometría?) y por el
   NODO exacto de la claim; lee el control (un rojo o un verde puede venir de otro sitio: servidor
   muerto, puerto de OTRO worktree, filtro `jq` que nunca casa); si un doble contesta la pregunta
   que hace el código, el test se mide a sí mismo. Cierra con una observación que NO dependa de tu
   inventario. Un guardián con falsos positivos es peor que ninguno: enseña a ignorarlo. ⚙️ el
   CHECK O de `docs:coherence` exige un test rojo a cada script de `verify` (17 legados, solo encoge).
   Evidencia: s18 regex `/\d+/g` sobre `color(srgb …)` = verde imposible · s21 medí píxeles, no
   color · s34 `closest: () => ({})` dejó 8 tests verdes con el gesto muerto · s31 tests verdes
   contra el `ng serve` de otro worktree · s18 guardián sin probar en claro↔oscuro = 17 rojos.

4. **Vas a arreglar un valor sustituyéndolo por otro token → MIDE el token de destino antes.**
   Fondo y texto van de la misma familia: mezclar uno que voltea de tema con uno que no es el
   fallo exacto. `npm run e2e:contrast` lo mide por ti; córrelo antes de dar el cambio por bueno.
   Evidencia: s18 `--sc-text-subtle` como "arreglo" medía 2.04:1 en 161 usos.

5. **La medición contradice al fuente → lo rancio es la MEDICIÓN; neutralízalo antes de tocar
   código.** Sospechosos, todos vistos: el dev server sirve el DS COMPILADO (rebuild y reinicio);
   `verify` reescribe `dist/` bajo un `ng serve` vivo; HMR deja vistas viejas (recarga dura); una
   animación a medio terminar (espera); OTRA instancia (un deploy no es tu build); la máquina
   ahogada por procesos huérfanos TUYOS (`ps`, `lsof`, mata, repite). Si tras culpar a la carga el
   test afirmaba sobre algo TRANSITORIO, la carga es el cuándo y no el porqué: arregla la aserción
   (`watchTransient()` en `e2e/cuscare/helpers.ts`). ¿Warning mío o preexistente? Stash y
   reproduce, no opines. ⚙️ El hook de compactación avisa si la guía cambió en `origin/main`.
   Evidencia: s12 icono en 24 con el fuente en 14 · s18 tres rondas contra un bundle viejo · s29
   "bugs" del deploy de Carlos que nuestro build no tenía · s30 overlay de 380 ms con load 51.

19. **Elige el validador por la PREGUNTA, y ninguno contesta la de usabilidad.** ¿El gesto hace lo
   que digo? → Playwright con clic REAL: `dispatchEvent` y un unitario a pelo se saltan el
   hit-testing, el orden de eventos y el render, y un descubrimiento por evento sintético que sale
   vacío dice "mi canal no dispara", no "no existe". ¿Se ve bien? → captura a viewport real,
   pantalla entera. ¿Sabrán usarlo? → recorrido cognitivo: ¿sabrá qué intentar, verá el control,
   entenderá qué hace, notará que funcionó? Una interacción por llamada: no leas el DOM en la misma
   llamada que dispara la acción (Angular aún no pintó). ⚙️ no mecanizable (elegir es juicio).
   Evidencia: s15 shift+click verde en mi sonda, rojo en Playwright · s20 siete unitarios verdes y
   el rango no funcionaba · s26 cero tooltips sintéticos, 23 con el ratón real · s15 "transcribir"
   no aparecía en pantalla con 22 tests verdes.

## Gates y push

7. **Vas a `git push` → `preflight` (o `:scope --run`) UNA vez sobre el árbol FINAL, y el
   veredicto es el del CI leído.** "Final" = commiteado y sin nada más que escribir, ni un `.md`.
   `verify` NO es ese gate: se salta los builds AOT ("es solo un token, una ruta, un md" no es
   "verify basta"). Los e2e NO van en preflight (DD-60): los corre el CI, obligatorio y en
   paralelo; si tocaste e2e o algo visual, corre a mano la suite que toca ANTES de pushear.
   Después: `npm run ci:verdict`. Si tocaste el lock, `guard:lockfile` (`npm ci --dry-run` a
   secas es ciego a la plataforma). "Este rojo no es mío" se mide: `git stash` y ese test.
   ⚙️ El hook de push exige `.preflight-ok` sobre ESTE árbol y deniega un `echo $?` colgado de un
   gate; el de Stop exige leer el CI; `ci-preflight-parity` y `playwright-reuse-guard`, el resto.
   Evidencia: ≥8 reincidencias con la regla escrita; por eso dejó de ser prosa. `git log -S'(s35)'`.

6. **Tu test NUEVO se pone rojo, o pasa a la primera → sospecha del test antes que del código.**
   ¿Mide la magnitud correcta? ¿El selector casa solo con lo que crees? ¿La aserción REINTENTA
   (`toHaveText`, `toHaveCount`, `expect.poll`; `innerText` y `evaluate` leen una foto)? ¿Espera al
   estado FINAL? Si afirma que algo NO pasa, espera al estímulo confirmado, no a un timeout. Para
   probar el arreglo de una carrera, hazla determinista (encoge la ventana) en vez de correrla con
   carga. Un flake que tumba el CI 3 de 5 no es inocuo: entrena a ignorar los gates. ⚙️ CHECK O.
   Evidencia: s25 ocho rojos falsos en una sesión · s27 `component-structure` 3 rojos al día por
   `evaluateAll` sin reintento · s30 gate verde contra el componente roto por leer antes de pintar
   · s31 `setTimeout` de 380 a 20 ms: la vieja 5/5 rojo, la nueva 5/5 verde.

8. **La primera corrección no funciona → no propongas la segunda: la siguiente acción es una
   MEDICIÓN que localice la causa.** Encadenar arreglos a ciegas es caro y puede empeorarlo.
   Evidencia: s25 tres cambios en la celda del rótulo cuando el alto lo marcaba el checkbox de otra.

## Alcance y ediciones

10. **Vas a declarar algo BLOQUEADO, a deducir un dato a ojo, o a DISEÑAR un mecanismo nuevo →
    gasta una llamada en ver qué te sirve ya el sistema.** DOM oculto (los overlays viven en el
    árbol desde la carga), ficheros `i18n`, hoja de estilos, `docs/DECISIONS.md` antes de
    hipotetizar. Y si lo que vas a montar es un GUARDIÁN, la pregunta es "¿qué vigila esto hoy?":
    `.githooks/`, `.claude/settings.json`, `scripts/`, `package.json`. Un diagnóstico que enumera
    los ficheros que se LEEN y no los mecanismos que se EJECUTAN mide media realidad. ⚙️ no
    mecanizable: es juicio y ya va en la tarjeta (punto 7).
    Evidencia: s26 cuatro modales "imposibles" medidos sin pulsar nada, y 1.449 claves de `en.json`
    · s41 propuse un hook de pre-push que ya existía desde s39 (lo vi al repetir 10 min de cadena).

11. **Toda edición masiva —shell o API— lleva su verificación de outcome PEGADA en la misma
    operación. Y si la clave con la que escribes puede REPETIRSE en el árbol, no es una asignación:
    es una emisión, y el conteo de escrituras no la ve. Diffea el VALOR antes/después.**
    ⚙️ El hook deniega `for f in $VAR` (zsh no parte por palabras: el bucle corre una vez).
    Evidencia: s11 migración de 12 iconos que no hizo nada, cazada por el `grep … || echo ninguno`
    · 2026-09-07 mínimos por NOMBRE en Figma: `Buscador`, `Origen` y `Fila N` existían dos veces,
    inflaron 47 cajas en silencio y rebrotaron TRES veces, hasta que diffeé tamaños.

12. **Vas a dar una cifra, ejecutar un `sed` o volcar un fichero → pregúntate qué entra en el
    resultado.** Al contar: comentarios, etiquetas de cierre, `[class*=…]` (comodín por los dos
    lados), declaraciones frente a instancias; si hay un ejecutor que sabe el número, el número es
    el suyo. Al reemplazar: acota a la etiqueta y verifica cada match. Al imprimir: proyecta las
    claves, nunca el fichero. ⚙️ El hook deniega el volcado de configs y el `main...rama`.
    Evidencia: s18 39 tests en grep, 108 en el runner · s27 token de Figma impreso y rotado · s35
    `main...rama` casi borra 432 ficheros · s31 "2.820 elementos" = 271.

21. **Vas a escribir en un fichero COMPARTIDO (los ledgers: `DECISIONS.md`, `LEARNINGS.md`,
    `inventory.md`, `docs/handoff/`, `AGENTS.md`) o a aterrizar trabajo en una rama que otro
    worktree tiene checkouteada → mide su árbol y su tip ANTES de empezar, no solo al aterrizar.**
    `git worktree list`, su `git status --porcelain`, el `rev-parse` de la rama. Si el fichero está
    sucio en su árbol, no lo toques: quien hace el cambio de código escribe su entrada. Una rama,
    una sesión: si necesitas su trabajo sin fundir, sal a rama propia y vuelve con PR. Y compara
    contra `origin/main` tras un `fetch`: tu `main` local puede estar días por detrás y te dirá que
    no hay conflicto cuando lo hay.
    Evidencia: 2026-09-06 tres choques en un día con la sesión hermana (DD-52 y la pokédex escritas
    dos veces, la segunda byte a byte idéntica) y el PR #50 nació CONFLICTING contra el #52 ya
    fundido; los cuatro choques cayeron en ledgers, ninguno en código.

## Entrega

14. **"Hazlo todo" → haz lo verificable de punta a punta, aparca lo demás DOCUMENTADO y dilo.**
    Aparca por falta de verificabilidad o porque la decisión es suya (marca, producto, borrado
    irreversible), NUNCA por parecido con otro aparcado ni **por estar ya escribiendo el reporte**:
    una divergencia que MEDISTE y podías corregir se corrige en la misma pasada — anotarla es
    dejarle a él el trabajo de encontrarla, con el de medirla ya hecho.
    Evidencia: s28 aparqué un componente "como sc-page-header" y estaba en el Kit · 2026-09-09
    dejé "el subtítulo del rail no está en Figma" en un reporte y lo tuvo que señalar Rafa.

15. **Decisión de marca o producto → preséntala con recomendación y evidencia; no la decidas tú.**
    El encuadre de riesgo es parte de la evidencia: "reversible" lleva horizonte y mecanismo
    (reflog ~30 días); si no te gusta cómo suena, hazlo reversible ANTES (`git tag archive/…`).
    Evidencia: s11 estilo de icono con drift en 3 sitios · s27 "borrar la rama es reversible".

16. **Antes de un refactor —o de una REVISIÓN— transversal, monta primero la red que lo verifica
    (tabla de valores esperados + barrido de anomalías), aunque parezca un rodeo.**
    Evidencia: s12 la suite e2e del supervisor cazó dos bugs el día que nació · 2026-09-07 revisé
    15 pantallas nodo a nodo hasta montar esas dos; entonces salió todo en una pasada.

17. **Vas a construir, recomendar o FIRMAR un estado sobre una descripción que no verificaste TÚ
    hoy → es una paráfrasis: abre la fuente.** Da igual de dónde venga: hand-off, README, Figma, tu
    propio resumen, otro agente, un item de audit ("solo hay que…"), un check de CI atado a un
    commit VIEJO, o un doc archivado que rescatas (ahí más: el traslado le da credibilidad). Si no
    lo mediste, etiqueta "según X, sin verificar" y acota a QUÉ artefacto y estado. Si la fuente
    AVISA de una trampa, cabléala en tu primer comando en vez de redescubrirla. ⚙️ no mecanizable
    (es juicio; sus síntomas ya los vigilan los checks D, E, J y M de `docs:coherence`).
    Evidencia: s14 "número héroe" que era una frase entera · s25 "100 deployments" eran 26 · s27 DD
    nuevo con una claim de un doc muerto · s36 154 falsos por no aplicar el aviso leído · s39 check
    rojo de un proyecto ya borrado.

18. **Vas a zanjar una decisión VISUAL discutiendo (con el usuario o contigo mismo) → constrúyela
    en su versión mínima y MÍRALA.** Un principio bien enunciado puede defender algo que ya no
    existe en el código.
    Evidencia: s14 "la tarjeta deja de ser tarjeta" con 1.06:1 de diferencia real · s21 cuatro
    modelos sopesados en abstracto; una captura lo zanjó en un segundo.
