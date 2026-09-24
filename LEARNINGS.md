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
| **2** | creerte un hallazgo (o un verde) de una sonda **tuya**, incluido un TEST o un GATE | valida el instrumento con un caso conocido; pruébalo en todos sus ejes; valida el CANAL (rojo y verde pueden venir de otro sitio); **mira qué ENUMERA el gate — `git ls-files` no ve lo que no has añadido** ⚙️; y ante un trinquete que NO baja o un rojo demasiado redondo, mira UN caso a mano: el que lee de menos suele ser tu contador |
| **4** | arreglar un valor sustituyéndolo por otro token | mide el token de DESTINO antes (fondo y texto, misma familia) |
| **5** | dudar entre tu código y tu medición | lo rancio es la medición: build, server, HMR, animación, **el repo bajo tus pies** ⚙️, **otra instancia (un deploy)**, la máquina ahogada… o atribución. Y si el test miraba un TRANSITORIO, la carga es el disparador, no la causa |
| **6** | creerte un test NUEVO — se ponga rojo **o pase a la primera** | sospecha del test primero: ¿mide la magnitud? ¿el selector casa? ¿reintenta? ¿espera al estado final? Y para probar el arreglo de una CARRERA, hazla determinista en vez de correrla con carga |
| **7** | hacer `git push`, **o lanzar la cadena** | `preflight` (o `:scope --run`) UNA vez sobre el árbol final —"final" = ya no vas a escribir nada más, ni un `.md`—; **`verify` NO es ese gate: se salta los builds AOT de las apps**. Los e2e los corre el CI (9 pasos), no el preflight (DD-60): si tocaste e2e o algo visual, corre a mano la suite que toca — las baselines visuales de sc-docs NO las corre ningún gate. **+ `guard:lockfile` si tocaste el lock**. Confirma el verde LEYENDO el CI: `npm run ci:verdict` |
| **8** | proponer una segunda corrección tras fallar la primera | para: la siguiente acción es una MEDICIÓN que localice la causa |
| **10** | declarar algo bloqueado, deducir un dato a ojo, diseñar un mecanismo nuevo, **LLEVAR código de una app a otra** o RECOMENDAR un cambio de criterio | comprueba qué te sirve ya el sistema (DOM oculto, i18n, hoja de estilos), **qué lo vigila ya** (`.githooks/`, `scripts/`) y **qué decidió ya una DD — puede estar DENTRO del gate que la aplica**; portar es RE-DERIVAR del destino, no mover ficheros |
| **11** | lanzar una edición masiva por shell | pega la verificación de outcome en el MISMO comando (zsh no hace word-splitting) |
| **12** | dar una cifra de un grep **o de un `querySelectorAll`**, ejecutar un `sed`, **o volcar un fichero de config** | pregúntate qué entra en el resultado **y en qué unidad lo dices** (¿herederos?, ¿visitas repetidas?); si hay un ejecutor que sabe el número, el número es el suyo; y **proyecta o enmascara antes de imprimir un `env`** |
| **14** | responder a un "hazlo todo", escribir "esperando a X", **o anotar en un reporte algo que mediste** | haz lo verificable de punta a punta y aparca lo demás DOCUMENTADO — pero por no poder verificarlo, **nunca por parecido con otro aparcado ni por estar ya redactando** |
| **15** | decidir algo de marca/producto, **o proponer borrar algo** | preséntalo con recomendación y evidencia, sin exagerar el riesgo; y **pon antes la vía que no borra** (alias, deprecar) |
| **16** | empezar un refactor transversal | monta antes la red que lo verifica, aunque parezca rodeo |
| **17** | construir sobre una descripción que no verificaste tú | es una paráfrasis: vuelve a la fuente (da igual si viene de un hand-off, Figma, un README u otro agente) |
| **18** | zanjar una decisión VISUAL discutiendo | constrúyela en su versión mínima y MÍRALA |
| **19** | elegir cómo validar algo | por la PREGUNTA: gesto→Playwright · aspecto→captura · ¿sabrán usarlo?→recorrido cognitivo |
| **21** | escribir en un LEDGER compartido (`DECISIONS`, `LEARNINGS`, `inventory`, `handoff`, `AGENTS`), aterrizar en una rama que otro worktree tiene abierta, **o enseñarle a Rafa ficheros que otra sesión también toca** | mira su `status` y el tip ANTES, no solo al aterrizar; una rama, una sesión; y compara contra `origin/main` tras `fetch`, no contra tu `main` local ⚙️ |

---

## Verificación (lo que más caro me ha salido)

1. **Vas a concluir "X no funciona" desde una interacción por herramienta, o "X ya está arreglado"
   tras tocar una opción → demuestra que tu estímulo (o tu opción) LLEGÓ, y que es el que el
   sistema produce de verdad, no uno que inyectaste tú.** Instrumenta (`addEventListener`,
   `matchMedia`, `getComputedStyle`), relee tus propias mediciones de la sesión antes de probar, y
   nombra el sujeto EXACTO que mediste: un nombre colectivo ("el MCP", "el CI") son varias piezas
   que caen por separado. Dos validadores con el mismo modo de fallo no se corroboran. Si no puedes
   probarlo, el veredicto es "sin verificar", nunca "roto". ⚙️ tarjeta p.3; `bash-guard` para `claude mcp list`.
   Evidencia: s11 Enter en `sc-datatable` (la acción `key` manda `key` vacío) · s31 inyecté `600px`
   y declaré roto lo que PrimeNG normaliza · s32 `reducedMotion` escrito y no entregado · s27 "el
   MCP de Figma" eran tres servers y sondeé uno · s44 el CLI decía Playwright ✔ y la sesión no lo tenía.

2. **Tu sonda, tu test o un GATE te da un verde y lo escribiste tú → valida el instrumento con
   un caso cuya respuesta ya sabes, en todos sus ejes, y ponle el fallo delante para verlo
   enrojecer.** Pregunta por la MAGNITUD (¿color o geometría?) y por el NODO exacto; lee el
   control (servidor muerto, puerto de OTRO worktree, `jq` que nunca casa); si un doble contesta
   la pregunta que hace el código, el test se mide a sí mismo. **Y un gate solo mide lo que
   ENUMERA: `git ls-files` no ve lo que no has añadido.** Dos olores de que el que lee de menos
   es TU contador: un trinquete que no baja aunque arregles, y un rojo demasiado REDONDO — mira
   UN caso a mano. ⚙️ CHECK O de `docs:coherence`; el hook deniega la cadena con fuentes sin indexar.
   Evidencia: s18 regex `/\d+/g` sobre `color(srgb …)` = verde imposible · s34 `closest: () => ({})`
   dejó 8 verdes con el gesto muerto · s31 verdes contra el `ng serve` de otro worktree ·
   2026-09-22 `verify` verde sobre 908 ficheros sin ver mis 35 nuevos; al commitear, 932 y 2 fallos.

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
   reproduce, no opines. ⚙️ Compactación avisa si la guía cambió en `origin/main`; `bash-guard`
   deniega Playwright con el DS más nuevo que `dist/`.
   Evidencia: s12 icono en 24 con el fuente en 14 · s18 tres rondas contra un bundle viejo · s30
   overlay de 380 ms con load 51 · 2026-09-14 «falla 4/4 con la clave» era el MISMO `dist/`.

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

10. **Vas a declarar algo BLOQUEADO, deducir un dato a ojo, DISEÑAR un mecanismo nuevo, LLEVAR
    código de una app a otra, o RECOMENDARLE a Rafa un cambio de criterio → gasta una llamada en
    ver qué decidió ya el repo.** DOM oculto (los overlays viven en el árbol desde la carga),
    `i18n`, hoja de estilos y `docs/DECISIONS.md` antes de hipotetizar; si montas un GUARDIÁN,
    "¿qué vigila esto hoy?" en `.githooks/`, `scripts/`. **Una DD puede estar DENTRO del gate que
    la aplica.** Y PORTAR no es mover ficheros: el vocabulario no viaja, se RE-DERIVA del destino
    (`_forms.scss`, `_page.scss`, una pantalla hermana). ⚙️ no mecanizable: juicio; tarjeta p.7.
    Evidencia: 2026-09-19 iba a sacar `e2e:visual` del preflight y lo metió DD-62 a propósito ·
    2026-09-22 porté un laboratorio a otra app con mis cajas y mi asistente; Rafa lo vio como un añadido pegado, ajeno a la app de destino.

11. **Toda edición masiva —shell o API— lleva su verificación de outcome PEGADA en la misma
    operación. Y si la clave con la que escribes puede REPETIRSE en el árbol, no es una asignación:
    es una emisión, y el conteo de escrituras no la ve. Diffea el VALOR antes/después.**
    ⚙️ El hook deniega `for f in $VAR` (zsh no parte por palabras: el bucle corre una vez).
    Evidencia: s11 migración de 12 iconos que no hizo nada, cazada por el `grep … || echo ninguno`
    · 2026-09-07 mínimos por NOMBRE en Figma: `Buscador`, `Origen` y `Fila N` existían dos veces,
    inflaron 47 cajas en silencio y rebrotaron TRES veces, hasta que diffeé tamaños.

12. **Vas a dar una cifra, ejecutar un `sed` o volcar un fichero → pregúntate qué entra en el
    resultado Y EN QUÉ UNIDAD lo vas a decir.** Al contar: comentarios, cierres, `[class*=…]`,
    declaraciones frente a instancias, quien HEREDA frente a quien lo lleva puesto, y VISITAS
    frente a cosas (un recorrido que repite pantallas cuenta mediciones, no textos); si hay un
    ejecutor que sabe el número, el número es el suyo. Al reemplazar: acota y verifica cada match.
    Al imprimir: proyecta las claves. Y una cifra sin comprobar no se publica en tres documentos:
    cada corrección después costó un preflight de 8 min. ⚙️ El hook deniega volcar configs y `main...rama`.
    Evidencia: s18 39 en grep, 108 en el runner · s27 token impreso y rotado · s31 "2.820" = 271 ·
    2026-09-11 "410 con nombre" eran 341 + 69 que solo heredaban, y "4.517 textos" eran mediciones
    sobre 56 estados (las 38 rutas son 2.503).

21. **Vas a escribir en un fichero COMPARTIDO (ledgers: `DECISIONS.md`, `LEARNINGS.md`, `inventory.md`,
    `docs/handoff/`, `AGENTS.md`), a aterrizar en una rama que otro worktree tiene checkouteada, o a
    enseñarle a Rafa ficheros que otra sesión también toca → mide su árbol y su tip ANTES, no solo al
    aterrizar.** `git worktree list`, su `status --porcelain`, el `rev-parse` de la rama; si el fichero
    está sucio en su árbol, no lo toques. Una rama, una sesión: si necesitas su trabajo sin fundir,
    rama propia y PR. Compara contra `origin/main` tras un `fetch`, no contra tu `main` local, que
    miente sobre los conflictos. ⚙️ `main-drift-guard` lo mira en cada mensaje de Rafa.
    Evidencia: 2026-09-06 cuatro choques en ledgers con la hermana (el PR #50 nació CONFLICTING) ·
    2026-09-23 #237, #239 y #240 entraron sobre las fichas mientras Rafa miraba mi local, y vio deshecho
    «lo que ya se había hecho».

## Entrega

14. **"Hazlo todo" → haz lo verificable de punta a punta, aparca lo demás DOCUMENTADO y dilo.**
    Aparca por falta de verificabilidad o porque la decisión es suya (marca, producto, borrado
    irreversible), NUNCA por parecido con otro aparcado ni **por estar ya escribiendo el reporte**:
    una divergencia que MEDISTE y podías corregir se corrige en la misma pasada — anotarla es
    dejarle a él el trabajo de encontrarla, con el de medirla ya hecho.
    Evidencia: s28 aparqué un componente "como sc-page-header" y estaba en el Kit · 2026-09-09
    dejé "el subtítulo del rail no está en Figma" en un reporte y lo tuvo que señalar Rafa.

15. **Decisión de marca o producto → preséntala con recomendación y evidencia; no la decidas tú.**
    El riesgo es evidencia: "reversible" lleva horizonte y mecanismo (reflog ~30 días), y antes de
    proponer BORRAR o retirar algo, ofrece la vía que no borra (alias, deprecar, `git tag archive/…`;
    en Figma, moverlo a una sección «Archivo»: el plugin no deshace).
    ⚙️ no mecanizable (qué opciones se ponen en la mesa es juicio).
    Evidencia: s27 "borrar la rama es reversible" · 2026-09-14 propuse borrar «App» y el alias lo trajo la duda de Rafa (#161→#163) · 2026-09-23 borré en Figma la tabla vieja al «limpiar» y Rafa pidió volver a ella.

16. **Antes de un refactor —o de una REVISIÓN— transversal, monta primero la red que lo verifica
    (tabla de valores esperados + barrido de anomalías), aunque parezca un rodeo.**
    Evidencia: s12 la suite e2e del supervisor cazó dos bugs el día que nació · 2026-09-07 revisé
    15 pantallas nodo a nodo hasta montar esas dos; entonces salió todo en una pasada.

17. **Vas a construir, recomendar o FIRMAR un estado sobre una descripción que no verificaste TÚ
    hoy → es una paráfrasis: abre la fuente.** Da igual de dónde venga: hand-off, README, Figma, tu
    resumen, otro agente, un audit, un check de CI viejo o un doc archivado (ahí más: el traslado da
    credibilidad). **Y si nombra QUÉ pieza cumple la propiedad, ese nombre es parte de la claim**:
    mide si es ESA y no otra, o medirás bien el sujeto equivocado. Si no lo mediste, etiqueta "según
    X, sin verificar". Si la fuente AVISA de una trampa, cabléala en tu primer comando. ⚙️ no
    mecanizable (es juicio; sus síntomas los vigilan los checks D, E, J y M de `docs:coherence`).
    Evidencia: s14 "número héroe" que era una frase entera · s25 "100 deployments" eran 26 · s27 DD
    nuevo con una claim de un doc muerto · s36 154 falsos por no aplicar el aviso · s45 el comentario
    decía que alineaba "la miga" y alineaba el lead: heredé su sujeto y firmé un defecto inexistente.

18. **Vas a zanjar una decisión VISUAL discutiendo (con el usuario o contigo mismo) → constrúyela
    en su versión mínima y MÍRALA.** Un principio bien enunciado puede defender algo que ya no
    existe en el código.
    Evidencia: s14 "la tarjeta deja de ser tarjeta" con 1.06:1 de diferencia real · s21 cuatro
    modelos sopesados en abstracto; una captura lo zanjó en un segundo.
