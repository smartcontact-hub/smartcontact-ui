# Frente · Design System + herramienta — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-09-01 (s39): HEAD `2ad8b77`.** Guía de validación visual en `/validar` (enlazada
> desde el Lab) + **hook `pre-push`** que corre el gate solo. Gate verde leído del log (305 tests) y
> CI verde (run `33542225223`). Tramo anterior de ESTE frente: `3b90fd7` (sc-demo borrado de
> Cloudflare + afila LEARNINGS #7).

## ✅ s39 · Guía de validación en sc-docs + el gate deja de depender de la memoria

**Qué hay nuevo:** una guía en `/#/validar` que explica cómo medir un componente en el navegador
(las 7 dimensiones —tamaño, tipografía, fondo, borde, esquinas, espaciados, sombra— y si el valor
viene de una variable o está escrito a mano). Está enlazada desde el **Lab → «Código y diseño»**,
escrita para perfiles que no leen código, y todas sus cifras están medidas en producción, no
deducidas. Lleva una clave de cortesía (en el componente) para que no se abra por accidente.

⚠️ **Esa clave no es una medida de seguridad, y conviene no presentarla como tal**: es una app
estática y el bundle viaja al cliente, así que el valor es legible desde el navegador. Sirve para
evitar aperturas accidentales. Queda dicho también en el componente y en la ruta.

### El camino que NO hay que repetir
Se evaluó proteger la guía con **Cloudflare Access** y no es viable con el montaje actual:
sc-docs enruta por hash (`withHashLocation()`, `app.config.ts:24`) y el fragmento `#…` **no viaja al
servidor**, con lo que Access solo podría cubrir el sitio entero. Se probó sacarla a una página real
bajo `public/` para poder filtrarla por ruta, y ahí apareció el límite de fondo: **Access exige una
zona activa propia** y `pages.dev` pertenece a Cloudflare. Se revirtió a la SPA.

**Para futuras decisiones:** proteger de verdad una ruta de sc-docs pide dominio propio + custom
domain + Access + un Bulk Redirect que cierre el `pages.dev`. Es una decisión de infraestructura,
no de front, y solo compensa si el contenido lo justifica.

### El hook, y por qué existe
LEARNINGS **#7** («preflight antes de push») acumulaba **tres afilados** (`3b90fd7`, `720bf6e`,
`3fcfa8b`) y seguía incumpliéndose. El diagnóstico no es la redacción: la regla se lee al empezar la
tarea y su disparador salta horas después, cuando ya no se está pensando en ella. Una regla que
depende de recordarla en el momento exacto no se cumple sola.

`.githooks/pre-push` lanza `preflight:scope` antes de cada push y aborta si falla. Se activa con
`npm run hooks:install`; la salida de emergencia es `SKIP_PREFLIGHT=1 git push`, y avisa por pantalla.
**El mismo día de montarlo detuvo tres cosas** que ya se habían dado por buenas: 51 violaciones de
tokens, un `eslint.config.js` que no parseaba, y 2 violaciones más al restaurar un componente.

⚠️ **Trampa medida, aplicable a cualquier gate:** `npm run preflight | tail -40` devuelve el código de
salida del **`tail`**, no del gate → salió `exit 0` con 51 violaciones dentro. Igual con
`npm run lint | tail && echo OK`, que imprimió «OK» con el fichero de configuración roto. **Para
dictaminar, redirige a fichero y lee `$?`; el `tail` es solo para leer.** El hook no usa tubería, a
propósito.

### Cambios de paso
- `eslint.config.js`: `projects/*/public/` fuera del lint. Aplicaba el parser de plantillas de Angular
  a assets estáticos y fallaba con el CSS embebido; los 8 HTML de `explorations/` pasaban por llevar
  menos CSS, no por estar bien encajados.
- ⚠️ Al documentarlo, un patrón glob con `*/` dentro de un comentario de bloque **lo cierra antes de
  tiempo** y rompió el fichero. Comentario de línea en su lugar.

## 🔜 Siguiente en este frente
1. **Figma — revisar un enlace de variable (pendiente de decisión):** `tag/font/size` apunta a
   `app/typography/sm/lineHeight` (18) en lugar de a `primitive/typography/font/size/100` (12), con lo
   que el tamaño de letra del Tag toma el valor del alto de línea. Medido el 2026-09-01; en agosto ese
   mismo nodo daba 12.
2. **Validación de producción (SISMAC-4074), medida y volcada en el board de Figma `14595:4049`**
   (página Feedback): faltan cuatro selectores en el bloque de tipografía del consumidor →
   `.p-tag` y `.p-toast-detail` a talla sm (12/18), `.p-select-option` y `.p-multiselect-option` a md
   (14/20). El resto ya cuadra: chip 20/34, cajas de select y multiselect 20, título de toast 20,
   breadcrumb 14 + #6F7784.
3. **Cloudflare:** se activó temporalmente «Restrict previews» en el proyecto de la doc durante la
   evaluación de Access y se ha pedido revertirlo. **Si algún preview pide login, viene de ahí.**

## ✅ s38 (cont. III) · Verificación (sin código): drift de «N pasos» resuelto + audit PRs limpios

Llegó un encargo diciendo que `docs:coherence` fallaba en `main` porque `8266d94` («paraleliza el
gate», 5 jobs) subió el conteo de pasos con `name:` de `ci.yml` de 8 a 11, y los docs seguían
diciendo «8 pasos». **Ya estaba resuelto, y de otra forma:** no se movieron los docs a 11, se arregló
`ci.yml`: `28e97ed` (restaura la paridad `preflight ≡ ci.yml`) + `05f3ace` («el build del DS de los jobs e2e no cuenta
como paso», le quita el `name:`) → conteo de vuelta a **8**, con lo que los docs (8 pasos = `verify` +
`build:docs` + 3 builds de app + 3 e2e) siguen correctos. ⚠️ Poner «11» HABRÍA ROTO el gate: Check J
de `docs-coherence.mjs` cuenta los pasos con `name:` de `ci.yml`, que son 8.

**Medido (HEAD = origin/main = `05f3ace`):** `node scripts/docs-coherence.mjs` → verde; `ci.yml` = 8
pasos con `name:`; el run de CI `33395393021` cerró con los 5 jobs en verde (incl. `verify`, que
contiene `docs:coherence`). Ningún `.md` describe el CI como «un solo job en serie».

**Audit PRs verificados limpios (no reintrodujeron el drift):** #29/#30 (hoy) y #21-#27 (semanales
previos), todos ancestros del `main` verde. #22/#24/#25/#26/#27 → solo `docs/AUDIT-SEMANAL.md` (exento
de Check J). #21 → además `DOCS-INDEX.md`, pero solo una fila nueva + la nota de fecha; la línea «8
pasos» (`DOCS-INDEX.md:47`) quedó intacta y hoy es correcta. #30 → 7 ficheros, ninguno con la cifra
(`CLAUDE.md`/`README.md`/`LEARNINGS.md` intactos). La skill de la auditoría lleva «blindaje anti-CI»
por diseño (commit de #21): su doc de salida no cita pasos/comandos inexistentes.

## ✅ s38 (cont. II) · UX de la sección Componentes + toggle de tema

**Sidebar de Componentes → acordeón** (`d0c755a`). Antes se desplegaban las 7 familias con sus 49
ítems de golpe y «Uso real / Reglas / Lab» quedaban enterrados (ilocalizables). Ahora: cabeceras de
familia con chevron + contador, **una abierta a la vez** (single-open que sigue a la ruta activa).
Estado en `app.component` (`openGroup` signal).

**Portada de Componentes → tarjetas con propósito** (`341334f`). Cada componente es una card con
nombre + una línea de para qué sirve; las 49 descripciones en un mapa `BLURB` del `component-catalog`
(fuente única, junto a la categoría). Es el valor que la sidebar no da.

**Claro/oscuro → toggle sol/luna + fundido premium** (`b205c83`). Componente reutilizable
`app-theme-toggle` (recibe `dark`, emite `toggled` — NO `toggle`, colisiona con el evento DOM; el
icono morfa sol↔luna). En el sidebar (tema global) y en cada story-canvas (tema local, con «Comparar»
aparte). El fundido usa la **View Transitions API**: una transición CSS NO anima el cambio porque los
colores salen de `var(--sc-*)` (medido: el fondo SALTA); la VT funde sobre una instantánea de píxeles.
`toggleDark` la invoca con fallback instantáneo (sin soporte / reduced-motion). El smoke del modo
oscuro espera a `.sc-dark` porque la VT aplica el DOM de forma DIFERIDA.

**⚠️ Trampa de lock, recurrente (s35 + s38):** `@napi-rs/wasm-runtime` pide `@emnapi/runtime` con rango
FLOTANTE; el **npm 10 del CI (node 22)** lo resuelve a la última publicada (1.11.3) y la exige en el
lock, pero **npm 11 (node 25, mi máquina) da VERDE FALSO** — se queda en 1.11.2, igual que
`guard:lockfile` y `npm ci --dry-run` locales. **El oráculo del lock es el npm del CI**: regenerar/
verificar con `~/.nvm/versions/node/v22.23.2/bin/npm` (el EXACTO del CI). Fix en `6c8cc80` (el de
`99c5c46`, solo `engines`, no bastó).

## ✅ s38 (cont.) · Deploy de sc-docs arreglado + «Tema PrimeNG» movido a Lab

**El deploy de sc-docs llevaba SEMANAS fallando en Cloudflare (todos los commits en `Failure`).**
Dos capas en serie:

1. **Build (`0f88492`).** `build:docs` arrancaba con `build:icons` en vez de `npm run build`, así
   que NO construía `dist/ui-smartcontact` (los componentes). En local colaba porque `dist/` ya
   estaba poblado de builds anteriores; en el checkout LIMPIO de Cloudflare, `ng build sc-docs` no
   resolvía `@smartcontact-hub/components` y el build moría (reproducido en frío: `rm -rf dist &&
   npm run build:docs` → «Could not resolve», exit 1). Alineado con `build:supervisor`/`:agent`/
   `:cuscare`, que sí arrancan con `npm run build` (por eso ELLAS desplegaban bien).
2. **Directorio de salida (dashboard, lo cambió Rafa).** Con el build ya en verde (`da576e6` pasó
   a `Active`), Cloudflare publicaba `dist/sc-docs` en vez de `dist/sc-docs/browser` → raíz 404,
   app escondida bajo `/browser/`. Cambiado el «Build output directory» del proyecto sc-doc a
   `dist/sc-docs/browser`. Verificado vivo: `sc-doc.pages.dev/` → 200 con `main-THA4YP7N.js`.

**⚠️ Terreno durable (config INVISIBLE al grep: vive en el dashboard de Cloudflare, no en el repo).**
Cada app en Pages tiene **Build output directory = `dist/<app>/browser`** y build command que arranca
con `npm run build`. sc-docs estuvo roto en AMBOS ejes hasta aquí. sc-docs usa **hash routing**
(`withHashLocation`), así que NO necesita `_redirects` de SPA. Cero referencias a `/browser/` en
docs/README. Cuenta account `b8361bb4…`, proyecto `sc-doc`.

**«Tema PrimeNG» → Lab (`da576e6` + `6a04dcc`).** Era un smoke test del preset y ya no justificaba
pestaña de primer nivel (cada componente `sc-*` ya demuestra el tema). Fundamentos baja a 2 pestañas;
la página vive en `/tema` (redirects desde `/fundamentos/tema` y `/theme` legacy), enlazada y
explicada en llano desde **Lab → «Verificación del tema»**. `smoke.spec.ts` codificaba el redirect
viejo `/theme`→`/fundamentos/tema` → actualizado en `6a04dcc` (por eso `da576e6` enrojeció el CI un
rato; lección afilada en LEARNINGS #7: `verify` no corre `e2e smoke`, usa `preflight`).

## ✅ s37 · Restyle de sc-docs (Constellation), lienzo blanco (DD-45) y breadcrumb con "aquí estás"

**sc-docs re-vestido con el lenguaje del DS "Constellation" de Digital Virgo, con tokens `--sc-*`
propios (acento sky, NO su rosa).** El DS y sus componentes **NO se tocaron** — solo el envoltorio
de la doc. Qué entró (`280bae1` + `2c558d9`):
- **Una sola sidebar** (secciones + lista de componentes anidada bajo Componentes; antes eran dos
  navegaciones). `storybook-shell` queda como frontera lazy sin sidebar. Componentes es la portada.
- **Buscador ⌘K** reusando el propio `sc-command-palette` del DS (dogfooding): montado en el shell,
  se le publican secciones + los 49 componentes. La demo del palette provee su servicio **scoped**
  para no chocar con el global. Se cierra en cualquier navegación.
- **Sombras `--sc-shadow-*`** en tarjetas, tipografía de display vía `--sc-font-size-display-1`
  (token, no px a pelo — la doc bebe del mismo sitio), **logo SC** real en círculo navy.

**Lienzo BLANCO (DD-45):** `app-shell` del supervisor de `--sc-bg-default` (gris) a `--sc-bg-canvas`
(blanco), cerrando el item pendiente de DD-34/DD-36 (`fa4382a`). Los campos rellenos siguen grises.

**Breadcrumb — tramo actual (elegido por Rafa: B, color + peso):** `sc-breadcrumb` marca el último
tramo en `--sc-text-primary` + `--sc-font-weight-medium`; **gate** en `e2e/component-structure`
congela su `outerHTML`, no puede regresar en silencio. Aplicado al maestro de Figma (`185:6637`).

**✅ Hecho (sesión nueva, bridge enganchó a la primera en 9223):** ejemplo del tramo actual en
Figma, fichero "Smart-Contact Design System" (`khNq9dJKNi13pNllrqm6dx`), página `❖ Breadcrumb`
(`6738:52933`), frame **"Breadcrumb, tramo actual"** (node `14558:514`, en x:650 y:977), con una
instancia del maestro (`14558:516`) y etiqueta mínima "Tramo actual" (`14558:515`). El maestro
`185:6637` no se tocó, ya llevaba B (color + peso) heredado por la instancia. De paso se borró
el mockup viejo de sesión 20 en esa misma página (`13890:157`, "Current state (propuesta)": texto
suelto sin instancia real, no aplicaba el peso Medio) — a petición de Rafa, sustituido por el
ejemplo de arriba.
>
> Sello histórico (2026-08-25): HEAD `f78977c`, **CI verde, los 8 pasos**. Cierra con `aura/custom` dentro del gate de completitud del Kit. Antes, `b5b07a5`. Los dos últimos commits son los que el verde LOCAL no cazó y conviene leer: `b5b07a5` (el puntero de Playwright sale de la barra lateral) y `25cedef` (el lockfile vuelve a estar en sync — `npm ci` es el paso 1 del CI y `preflight` NO lo corre). Antes: `1fb7d5f` (el audit de acoplamiento a PrimeNG pasa a mirar tres caras) sobre HEAD `9e3f0bd` (Angular 22 + PrimeNG 22 + los builders a `@angular/build`). Antes, en esta misma sesión y ya en `main`: `3b65f07` (duplicación del supervisor), `bee2acc` (retirada de `sc-page-header` + deriva de docs), `0ef136c` (**trinquete DD-38 a CERO**), `1698f47` (red de contraste de severidades), `edfb2ec` (código muerto) y `4417bb8` (`text.muted.color` a enforce + el warn unificado).**
>
> _Corrección 2026-08-31: esta línea citaba además "rescate de s33" sobre `HEAD \`97f34e1\`` — ese sello no resuelve a ningún commit real (cazado por `docs:coherence`); se retira en vez de inventar el hash que debería llevar._

## ✅ s34 · Se cerró la deuda abierta, y el salto a Angular 22 destapó una clase de fallo nueva

**Diez bloques, todos en `main`.** El trinquete de DD-38 quedó **a CERO** (93 componentes en
señales, 0 en decoradores), el `warn` volvió a la familia del Kit (**DD-41**), `text.muted.color`
pasó a `enforce`, se retiraron 3 ficheros muertos y `sc-page-header`, y el wiring de
`TopBarSlotService` —el patrón más repetido del repo, 17 páginas en dos idiomas— quedó en un solo
`useTopbarActions()`.

**Angular 22 · TypeScript 6 · PrimeNG 22 · `@primeuix/themes` 3** (**DD-42**), con
`@angular-devkit/build-angular` **fuera**: los 7 proyectos en `@angular/build`. Vulnerabilidades
**7 → 1**; el salto por sí solo no cerraba ninguna —lo que las cerró fue migrar los builders—.

### Lo que hay que saber de esa migración

Está entero en [`migration-safety.md`](../migration-safety.md), que dejó de proyectar lo que
«debería» pasar en un major y pasa a contar lo medido. El resumen:

- **La capa aguantó**: **0 líneas** de tokens `--sc-*` y **6 líneas en un fichero** del preset.
  Las 36 clases internas de PrimeNG de las que dependemos **siguen existiendo las 36**.
- **Lo que rompió fue lo que se salta la capa**, y las tres veces **en silencio**:
  `styleClass` retirado de `p-table`/`p-select`/`p-multiselect` (42 tests de CusCare de golpe);
  un `closest('p-tablecheckbox')` en `sc-datatable` que dejó muerta la selección por rango con
  Mayús; y un localizador de test contra otra grafía.
- **Dos de las tres las introdujo nuestro propio renombrado**, no el proveedor: PrimeNG declara
  las dos grafías (`selector: "p-table-checkbox, p-tablecheckbox"`) justamente para no romper a
  nadie.
- **Y sus 8 tests unitarios siguieron verdes** porque usaban un doble que decía «sí» a cualquier
  selector. Medían su propio stub.

`audit:primeng-coupling` pasa a tener **tres secciones** (clases · nombres de elemento · entradas
inertes), las tres probadas **en rojo con los fallos reales** antes de darlas por buenas. La
primera versión de la sección B los dejaba pasar a los dos: *un gate que no se pone rojo con el
fallo que lo motivó no es un gate.*

### Aparcado a propósito

**El P0 del field-pattern** (los 5 CVA a mano). Angular 22 gradúa **Signal Forms** a API pública y
es justo lo que los sustituye: refactorizarlos ahora sería trabajo tirado. No es que no se pudiera;
es que hacerlo hoy sale más caro que esperar.

### La trampa que costó más tiempo que cualquier bug

Lancé **la cadena entera dos veces** sin darme cuenta, y las dos suites del supervisor se pisaron
sobre el mismo dev server. Resultado: la tabla del supervisor salía vacía y la suite iba camino de
**dos horas**. Con una sola cadena y la máquina libre: **127/127 en 1,8 minutos**. Si una suite que
conduce la app real da rojos absurdos, **cuenta los procesos antes de leer el código**.

---

## ✅ s31 (b) · Sync del Kit tras un mes parado, y qué dice Figma del primario oscuro

**El puente llevaba muerto desde el 22 de julio** (último PR de sync: #17). Causa: el token de
GitHub del plugin caducó. Rafa pasó el export a mano (`design-tokens24Aug.json`) y entró por el
pipeline normal.

**Lo que trae**: la familia `warn` pasa de `orange-*` a `yellow-*` en los dos temas — 14 líneas en
`04-component.css` y 30 en `07-dark.css`, resolviendo contra primitivas que ya existían. Es **W5
aterrizando**. Cumple AA antes y después: claro 5,58→4,92, oscuro 6,92→11,06. Visualmente se nota
(naranja vivo → mostaza). **El `tag` warn se queda ÁMBAR** porque está en el EXCLUDE de
`cmp-color-map.mjs` (divergencia a mano, customs-catalog §1.3) → **coherencia botón/tag a revisar
con diseño**, no la resolvió esta sesión.

**Y el dato que faltaba para cerrar DD-40**: el export trae `primary.contrast.color` dark a
**#ffffff**. O sea, Figma decidió texto BLANCO — y dejó los fondos aclarando. Eso da base 5,62 ✓,
hover 3,35 ✗, active 2,11 ✗. **No se adoptó**, y la razón está medida en la actualización de
DD-40: con texto blanco la banda válida mide 1,25:1 de ancho y no caben tres estados que se
distingan (con texto oscuro mide 3,76:1). **Ningún azul arregla eso.** La pelota está en diseño:
o el hover/active dejan de expresarse con el relleno, o el primario oscuro se queda con texto
oscuro. Mientras tanto la fila sigue en `diverge`.

**Nota de infra**: `playwright.config.ts` gana `SC_DOCS_URL` — era el único de los tres configs
sin escape por env, y con dos worktrees de agente vivos moría con «Port 4280 is already in use».
⚠️ Pero **no apuntes el `component-structure` a un build de producción**: su baseline guarda
`outerHTML` y Angular escribe `<!--container-->` en dev y `<!---->` en prod → 16 filas en rojo que
no son una regresión. Está avisado en el propio config.


## ✅ s33 — el TypeScript de la raíz y de `e2e/` entra en `typecheck` (`a275686`)

**Ningún `tsconfig` del repo incluía la raíz.** Los de apps y libs arrancan todos en
`projects/*/src`, así que **33 ficheros no los type-checkeaba nadie**: los cuatro
`playwright*.config.ts`, `eslint.config.js` y los 28 de `e2e/`. Y `eslint` no tapa ese hueco
porque no reporta errores de tipo.

Por ahí pasó en s32 un `reducedMotion: 'reduce'` suelto en el `use` de
`playwright.cuscare.config.ts` —en Playwright 1.60 va dentro de `contextOptions`—: error de tipo
real, `verify` entero en verde y la suite de CusCare inestable bajo carga. El caso concreto ya lo
cubría `e2e/cuscare/harness.spec.ts` (comprueba el estado EN LA PÁGINA); lo que quedaba abierto
era la clase.

- **`tsconfig.harness.json`** (nuevo), encadenado en el script `typecheck` → entra en `verify` y
  en el CI. **No añade eslabón a la cadena**: extiende un gate que ya estaba, así que `verify`
  siguen siendo **26 gates** y las 4 cifras sin gatear (`CLAUDE.md`, `DOCS-INDEX`,
  `AUDIT-SEMANAL`, `SKILL.md` de la rutina) **no se tocan**.
- **Nace en verde, medido ANTES de escribirlo**: 0 errores sobre los 33 ficheros tal cual estaban.
- **`include` por PATRÓN** (`*.ts`, `*.js`, `e2e/**/*.ts`): un `.ts` nuevo en la raíz o en `e2e/`
  entra solo, sin que nadie se acuerde.
- **`allowJs`/`checkJs`** por `eslint.config.js`: su `// @ts-check` de la primera línea **no hacía
  nada**, porque el fichero no estaba en ningún programa de TypeScript.
- **Validado en ROJO en sus tres ejes**, no solo en verde: con el bug histórico reinsertado,
  `npm run typecheck` sale con **exit 2** y `TS2769 «'reducedMotion' does not exist in type
  'UseOptions<…>'»`; con un error de tipo en `eslint.config.js`, `TS2339`; con otro en
  `e2e/smoke.spec.ts`, `TS2322`.
- **`scripts/__tests__/typecheck-coverage.test.mjs`** (nuevo, 7 casos dentro de `test:unit`) protege
  la **clase**, no la instancia: recorre el repo y falla si aparece un `.ts` que no mira ningún
  tsconfig. El patrón cubre ficheros nuevos en sitios conocidos; el test cubre un **directorio
  nuevo de primer nivel** (`tools/`, `bench/`), que es exactamente cómo nació el hueco. Su verde
  **no es vacuo**, comprobado: quitando `e2e/**/*.ts` del `include`, señala los 28 huérfanos.

**Fuera a propósito, con la cifra medida antes de decidirlo:**

| Qué | Errores con `tsc` | Por qué queda fuera |
|---|---|---|
| `code-connect/**.figma.ts` | **17** | No son código: son PLANTILLAS que evalúa el CLI de Code Connect (módulo `figma` virtual + globales `_fcc_*` que inyecta el parser y no declara ningún `.d.ts`). Su gate es `npm run figma:connect:parse` —verificado en verde tras el cambio— y `eslint.config.js` ya los ignoraba por lo mismo |
| `scripts/**/*.mjs` | **392** con `checkJs` | JS sin anotar (casi todo TS7006, "implicitly any"). Anotarlos es otra tarea, no un efecto colateral de esta; hoy los cubren `test:unit` y `eslint` |

⚠️ **"Fuera del `include`" no es "fuera del programa", y se vio el mismo día.** El guardián de
reutilización del dev server (`scripts/playwright-reuse-guard.mjs`, de s31) lo IMPORTA
`playwright.config.ts` — y con eso entra en el gate de tipos aunque `scripts/` esté fuera del
`include`: 3 errores (TS7006 ×2 y un TS2339 en el `catch`, que TypeScript tipa como `unknown`).
Se arreglaron con **JSDoc en el script**, que es lo correcto: si un config type-checkeado depende
de él, su firma es parte del contrato. Si mañana añades un import así y no quieres anotarlo, la
decisión se toma en `tsconfig.harness.json`, no con un `@ts-nocheck` a escondidas.

**Doc corregida donde afirmaba lo contrario** (quedaba falsa al aterrizar esto): la fila «Tipos +
lint» del README —que estaba **vacía**—, el comentario del propio `playwright.cuscare.config.ts`,
la trampa de `docs/handoff/cuscare.md` y el corolario s32 de `LEARNINGS.md`.

---

## ✅ s31 · Accesibilidad: el primary dark y el agujero de la red de contraste

**DD-40** — el par `--sc-text-on-primary`/`--sc-bg-primary` en `.sc-dark` medía **3,01:1**.
Llevaba desde junio aparcado en `A11Y_KNOWN` con una razón **falsa**: decía que «ni gray-900 ni
blanco llegan a AA sobre blue-400», y el blanco sí llega (5,62). Lo que de verdad lo bloqueaba no
era la base sino la rampa: con blanco no hay hover ni active legales (aclarar sale de la banda,
oscurecer hunde el relleno bajo el 3:1 de 1.4.11). Única salida: **subir la rampa un paso**
(`blue-300/200/100`, texto sin tocar) → **5,05 / 8,03 / 11,89** en los dos criterios.

- Las tres filas `primary.*` de dark pasan a **`diverge`** en `color-map.mjs`. Como eran lo único
  que el dark recibía del Kit, **la zona `@sc-gen:semantic-color-dark` queda VACÍA** y el dark
  pasa a estar 100% curado a mano. La cabecera de la zona lo dice, para que se lea como dato.
- **`A11Y_KNOWN` queda vacío**; §6b va de 21/22 a **22/22**.
- Arregla de rebote la **barra de sc-docs en oscuro** (la que se veía negra sobre oscuro) y el
  **skip-link** del supervisor.

**La red de contraste miraba solo la vista enrutada.** `theme-contrast.spec.ts` recorría
`main#main-content`, y el skip-link, la `sc-sidebar` y la `sc-top-bar` son **hermanos** de
`<main>`: el marco de la app no lo miraba nadie, en ningún tema. Raíz ampliada a `body`. Salieron
tres defectos más, arreglados: `sidebar__section-title` y `sidebar__decisions-label` (TEXTO de
12 px → umbral 4,5, alpha a `0.5`), el `mock-sample-switcher` (pastilla ámbar clara sin variante
oscura) y antes los chevrones (`0.3`→`0.4`, commit `b3a0fdf`).

**Segundo fallo de la red, del signo contrario**: su filtro de visibilidad hacía
`cs.opacity === '0'` mirando solo al elemento, y `opacity` no se hereda como valor computado —
un span dentro de un ancestro a 0 se colaba como visible. Ahora sube por la cadena. Y como eso
dejaba sin medir la sidebar (invisible en reposo), se añade **un test por tema que la despliega y
mide con hover**, que es medio punto peor que el reposo. 125 → **127** tests.

**sc-docs · swatches de fundaciones**: hover/foco abre una tarjeta con token, hex y HSL, y cada
línea se copia (vía `ScClipboardService`). Los tres valores salen de `getComputedStyle`, no de
una tabla a mano.

⚠️ **Trampa que costó cinco rondas**: `ng serve` sirvió CSS **viejo** mientras el fuente,
`dist/design-tokens` y `ng build` estaban los tres correctos. Los e2e daban rojos
irreproducibles. **Para medir color/contraste, sirve el build estático y apunta con
`SC_SUPERVISOR_URL`** — ahí pasó de 5 fallos fantasma a **53 verdes**.

**Pendiente (no bloquea)**: pedirle al Kit un primary dark conforme — luminancia relativa entre
**0,136 y 0,183**, apuntando al centro de la banda y no al canto. Es la salida durable; el día
que llegue, esto se revierte devolviendo tres filas a `enforce`.

---


## ✅ s30 — tres cosas, el mismo día, ya en `main`

Salieron en cadena: **A** es lo que se pidió, y **B** y **C** son hallazgos de paso de A que se
resolvieron en su propio worktree y se mergearon después (`974c827`).

### A · sc-docs: la barra baja de 7 destinos planos a 4 secciones (`dcad8e2`)

Fundaciones, Tipografía y Tema PrimeNG gastaban tres huecos de primer nivel para la misma cosa
—36/51/40 líneas de plantilla—; se agrupan bajo **`/fundamentos/*`** con pestañas, y Lab y el
interruptor de tema salen de la nav a un cluster de herramientas. Medido a 1280px: lo ocupado
**966 → 670px**, la nav **624 → 364**; por debajo de 1000px la nav se desliza y el body no
desborda. Las rutas viejas **redirigen, con test**: sin él `/#/foundations-type` no daba 404, te
mandaba **en silencio** a otra página. Otro gate fija la barra en cuatro destinos.

- **Fuera el `opacity: 0.72`** de los inactivos: en oscuro los dejaba en **2.29:1**. Al medirlo
  salió lo de C (ver abajo).
- **El interruptor se queda con TEXTO**: `<sc-icon>` en el shell *eager* mete **+127 kB** en
  `main.js` (573,85 → 701,15 kB) y revienta el presupuesto de bundle por un glifo decorativo.
  Dentro de las páginas, que son lazy, `sc-icon` sí sale gratis.
- La **portada de `/components`** deja de repetir la lista entera (era la tercera copia de la
  misma navegación en pantalla) y ofrece un salto por familia.
- **Tres gates hubo que arreglarlos de paso.** `eslint` entraba en el `dist/` de los worktrees de
  agente (en flat-config `dist/` está anclado a la raíz → `**/dist/` + `.claude/`); el test del
  palette ataba una aserción de teclado a la geometría (→ B); y `screenshotBaseline` capturaba la
  sidebar con su scroll en dos estados (**exactamente 4912 px** de diff siempre, firma de
  bistabilidad, no de ruido) → se fija a 0 antes de capturar. **Las 39 baselines visuales van
  regeneradas: ya estaban desfasadas en `HEAD` antes de tocar nada** (esperaban 2507px de alto y
  la página rinde 2497).

### B · `sc-command-palette` (teclado) + el alcance real de `preflight`

Dos defectos de teclado en `sc-command-palette`, los dos **medidos antes de tocar nada** y
arreglados con su gate (`87abad5`):

1. **El resaltado inicial dependía de dónde hubiera quedado el ratón.** Con `(mouseenter)`, abrir el
   overlay bajo un puntero PARADO disparaba el hover: con el cursor sobre el ítem 3, el activo al
   abrir era «Usuarios» y ↓+Enter ejecutaba «Crear grupo». Como la paleta se abre sobre todo por ⌘K,
   la primera flecha partía de un sitio que el usuario no eligió. **El mecanismo, medido:** al
   aparecer un elemento bajo un puntero quieto el navegador dispara `mouseover` y `mouseenter` pero
   **NO** `mousemove` ni `pointermove` → basta `(mouseenter)` → `(mousemove)`, sin flag de estado.
2. **Las flechas movían el resaltado pero no la vista.** Con la ventana a 1280x400, `scrollTop` se
   quedaba en 0 las cinco pulsaciones y desde la tercera el activo caía **3, 78 y 112 px** por debajo
   del borde visible → ↓+Enter ejecutaba un comando invisible. Añadido
   `scrollIntoView({block:'nearest'})`, **casando el índice por `id`**: `highlighted` indexa
   `filtered()` y el DOM se pinta desde `grouped()`, así que con categorías intercaladas los dos
   órdenes dejarían de coincidir (ningún consumidor de hoy intercala — trampa latente, anotada).

Los **dos gates nuevos** (`components.spec.ts`) están validados en los DOS sentidos: rojos contra el
componente sin arreglar, con los valores exactos medidos. El primero, en su primera versión, pasaba
**en verde contra el código roto** porque leía el resaltado antes de que llegara el evento; ahora
espera a confirmar que el `mouseover` llegó y solo entonces afirma.

**Y de ahí salió lo otro (`649240d`): `preflight` no corría `components.spec.ts`.** Su sustitución
local cambiaba `npm run e2e` por `e2e:structure` — **1 test en vez de 68**, dejando los 56 de
`components.spec.ts` fuera del gate de pre-push. El motivo escrito (los screenshots de `sc-card` y
`sc-message` fallan siempre en macOS) resultó ser sorteable: son `screenshotBaseline()`, que hace
**no-op con `CI=1`**. Hoy la sustitución es `npm run e2e` → `CI=1 npm run e2e`, y el test del gate
lleva el caso inverso para que la vuelta atrás salte.

### C · El chevron de la sidebar cumple 3:1 (`b3a0fdf`)

El chevron **no es decorativo**: cambiar `chevron-right` por `chevron-down` es la ÚNICA señal de
que un item tiene hijos y de si está abierto, así que le aplica WCAG 1.4.11 a 3:1. Estaba en
`rgb(255 255 255 / 0.3)` y **no llegaba en ninguno de los dos temas** — un alfa blanco se aclara
al mismo ritmo que el fondo de detrás, así que el navy oscuro no lo rescata. Medido en el estado
vinculante (sidebar abierta por hover, fila bajo el puntero, medio punto peor que en reposo):
claro **2,57 → 3,42**, oscuro **2,71 → 3,80**. Alpha 0.3 → 0.4.

**No lo cazó ningún gate, por dos motivos anotados en el fichero:** la sidebar es HERMANA de
`<main>` y `theme-contrast.spec.ts` solo recorre `main#main-content`; y `tokens:parity` no ve un
literal que no pasa por ninguna variable.

⚠️ **Esto no cerraba el contraste** — lo que disparó la investigación era el par
`--sc-bg-primary`/`--sc-text-on-primary` a **3,01:1** en oscuro, el contraste primario del preset
(`base.ts`) y por tanto el botón primario de toda la plataforma. **Cerrado en s31** (arriba,
DD-40): la razón de marca que lo bloqueaba resultó apoyarse en un dato falso, y `07-dark.css`
resultó ser zona `@sc-gen` **solo para los tres `--sc-bg-primary*`** — el token de texto ya vivía
fuera. Se resolvió divergiendo esas tres filas en `color-map.mjs`, no editando la zona.

---

## s29 (previo) — Figma + casar preset

Sesión de dos mitades. **(1) Figma:** se revisaron 6 componentes + Table cruzando el master
contra la **web en vivo** (chrome-devtools) y se **tokenizó** tamaño y line-height del texto de
componente. **(2) Código (nuestro repo):** medido que **nuestro sc-docs ya casaba** con Figma casi
entero —lo desviado era producción (Carlos)—; se **casó lo que faltaba** en el preset (`css.ts` +
`extend.ts`) con la **unificación de line-height** (md 21→20), **verificado en sc-docs con build**.
Los **SIGUIENTE de código** de más abajo siguen intactos.

## ✅ Código (nuestro repo — casar sc-docs/prototipos con Figma)

Medido que **nuestro sc-docs ya casaba** casi entero (chip 14/20/34, opciones 14/20, breadcrumb 14 +
`slate/600`); lo desviado era **producción (Carlos)**. Lo que faltaba, hecho en el preset y
**verificado en sc-docs con build**:

- **`css.ts`** — chip, toast-summary, select/multiselect/listbox-option, breadcrumb, context-menu →
  tipografía **md (14/20)**; tag, toast-detail → **sm (12/18)**. Ahora **explícito**, no depende del
  `line-height` del body de cada app (así los **prototipos** —body 1.5— también casan).
- **`extend.ts`** — **unificación**: `app.typography.md.lineHeight` `scale-1-5` (21) →
  `line-height-200` (20). Medido: control de alto 37 a 36 (icon-only más cuadrado), **sin romper
  geometría**. Verificado: botón 36/20, tag 25, chip 34. Efecto colateral esperado: movió el alto
  inline del textarea autoResize (77→74) → regenerado el baseline de estructura (`59a5c73`).
- **Code Connect (C):** 6 componentes mapeados en `code-connect/*.figma.ts` (formato v2
  templates de `@figma/code-connect` 2.0), **publicados en Figma dev mode**. Context-menu
  excluido: no existe wrapper en el DS.
- **Previews (B):** referencias estáticas HTML nativas en `sc-docs/public/explorations/components/`
  que consumen los `--sc-*` reales vía `/tokens` (assets en `angular.json`, opción 3, cero drift).
  Light+dark+estados, 6 componentes + índice. Verificadas por pantalla.

## ✅ Figma (master `khNq9dJKNi13pNllrqm6dx`)

Todo **migration-safe**: atado a tokens que **ya existían**, sin tocar su valor → cero efecto colateral.

- **Tamaño → `primitive/typography/font/size/200` (14):** `breadcrumb-item`, `contextmenu-item`,
  `select-option`, `multiselect-option`, `listbox-option` (**23 nodos**). Estaban a 14 pero **a
  pelo**; ahora vinculados. **Sin cambio visual.**
- **Line-height → rampa normal** (`line/height/200`=20 para 14px, `line/height/100`=18 para 12px):
  **chip 31→34, toast 62→68, tag 22→25** (**30 nodos**). Antes AUTO/libre.
- **Badge EXCLUIDO con motivo:** alto **FIJO** (18/21/25/28) y tamaños fuera de rampa
  (8.75/10.5/12.25) → el line-height no le afecta y no hay token que le pegue. Tocarlo sería
  inventar tokens.
- **Decisión — "line-height normal en todo", NO un set compact.** Se sopesó y **descartó** una
  rampa de line-height ceñido; los hug (chip/toast/tag) tiran de la rampa normal. *(Candidata a
  DD si se quiere formalizar; hoy solo aquí.)*

**Hallazgos de la revisión web↔Figma** (por si se retoma):

- **Select/MultiSelect:** el **valor** ya es 14 (correcto); el bug está en las **opciones del
  desplegable** (16, deben 14). El "16→14" que se arrastraba era medir el **contenedor**, no el
  texto — falso positivo de sesiones pasadas.
- **Breadcrumb:** 16→14 **y** color `#8F97A3` → `slate/600` (`breadcrumb/item/color`).
- **Context-menu:** 16→14 (color `slate/700`, correcto).
- **Chip/Toast/Tag:** line-height (hug); la web va a 1.5.

**Pendiente de Carlos (dev, NO nuestro):** consumir estos tokens en código (tamaño, line-height,
color breadcrumb). Mensaje de diseño enviado. Editar Figma **no mueve la web**.

**Nota (20-vs-21):** en NUESTRO código ya **unificado a 20** (`extend.ts`, esta sesión). En producción
(Carlos) sigue el legacy hasta que consuma los tokens.

**Table:** endosada como **buena base** (mensaje ligero), sin push a reconstruir sobre PrimeNG.

## ▶︎ SIGUIENTE — sin preguntar

> Los puntos 0 a 3 que llevaba esta ficha (re-exportar y cerrar `text.muted.color` · los 16 del
> trinquete · los hallazgos viejos del audit semanal · `npm audit`) están **HECHOS** en s34. Lo que
> sigue es lo que queda de verdad.

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
3. **El eslabón que sigue faltando: nadie compara *fichero de Figma ↔ export*.** `tokens:parity`
   compara *export ↔ CSS*. Por ese hueco se coló el desfase de julio. No puede ser gate de CI
   (necesita el bridge abierto), así que es procedimiento manual — mismo caso que el Check D de
   `docs:coherence`.
   ⚠️ **Cómo repetirlo sin tropezar**: resuelve a RGBA final **los dos lados** antes de comparar.
   La primera pasada dio **15 divergencias falsas** por leer los colores de Figma sin canal alfa
   (`#00000000` vs `#000000`) y por comparar un alias contra un valor ya resuelto. Y en el JSON del
   export **las claves raíz llevan las barras dentro** (`d['aura/semantic/dark']['primary']`).
4. **El 1:1 web↔Figma de chip · tag · toast** — sigue **bloqueado por herramienta**, no por
   decisión. Ver la sección de Figma más abajo.
5. **La deuda de código de [`AUDIT-DEUDA-2026-06.md`](../AUDIT-DEUDA-2026-06.md)** que quede tras
   s34, y **los cabos de DD-24** (round-trip de iconos) en [`ROADMAP.md`](../ROADMAP.md).

## ⏸️ ESPERANDO A RAFA — NO preguntar

> Auditada fila a fila el 2026-08-25. Las que ya no procedían salieron; las que quedan llevan **su
> verificación de esa fecha**, no la razón heredada.

| Qué | Estado |
|---|---|
| ~~**Borrar el proyecto Cloudflare `sc-demo`**~~ → **HECHO por Rafa (2026-09-01)** | Proyecto borrado de Cloudflare. Su check «Cloudflare Pages: sc-demo» todavía sale en rojo en el último commit de `design-tokens-sync`: es un snapshot HISTÓRICO de cuando existía (no vuelve a correr sobre un commit viejo), se limpiará solo en el próximo push del bot de tokens. |
| **`org-profile.md`** | `smartcontact-hub/.github` → `profile/README.md` → **HTTP 404** (re-medido 2026-08-25): no está pegado. El borrador sigue en `docs/org-profile.md` |
| **Un primary dark conforme, pero desde el KIT** | Ya NO es el 3,01:1 — lo resolvió **DD-40** subiendo la rampa un paso y **divergiendo** del Kit. Lo que queda es pedirle al Kit su primary dark conforme (luminancia relativa entre **0,136 y 0,183**, al centro de la banda); el día que llegue, se revierte devolviendo tres filas de `color-map.mjs` a `enforce` |
| **Lienzo de página gris↔blanco** | Figma `13920:4298`. **DESBLOQUEADO** por `bcab818` (2026-08-25): nace `--sc-bg-canvas` (blanco en claro / slate-950 en oscuro), el token que faltaba, SIN tocar `--sc-bg-default` (que hace doble trabajo: suelo + relleno de campos, 32 ficheros). El bug del rail de AED que describía DD-36 ya no aplica. Lo que queda es SOLO la decisión de diseño: ¿el lienzo de contenido pasa a blanco? El token para hacerlo limpio ya está; el valor pintado hoy no ha cambiado |
| ~~**Tramo actual del breadcrumb**~~ → **DECIDIDO, `bcab818` (2026-08-25)**: la propuesta de Figma `13890:157` (padres slate-500 `#8F97A3`) **se RECHAZA** — da **2,95:1** sobre blanco y no cumple AA. Se queda el código como está (padres slate-600, actual slate-700, ambos AA). Falta solo anotarlo en el nodo de Figma (Bloque 4). *Nota: el mismo commit tokenizó la miga a 14px, otro asunto ya cerrado.* |
| ~~**El botón de crear cambia de ancho entre listas**~~ → **HECHO, `bcab818` (2026-08-25)**: decisión de Rafa «que no cambie de anchura porque sí». `main.scss:205` → `.top-bar__actions button { min-width: 144px; max-width: 288px }`, anclado en clase NUESTRA. Los cinco (122–142px) aterrizan igual. Aplicado y en `main` |
| **B5b · prosa i18n del constructor** | Necesita ICU MessageFormat **y diseño**. Sigue aparcada |

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
- **El CI son 8 pasos, no `verify`** — enumerados en `ci.yml`, y gateados (CHECK J).
- **`npm run verify` (26 gates) NO corre el `e2e smoke`.** El `component-structure.spec` (baseline
  del `outerHTML` de cada componente) es un paso aparte de CI, y el textarea autoResize graba su
  alto calculado en un `style` inline que vive en ese `outerHTML`. Un cambio de token/visual puede
  pasar los 26 gates y aun así romper el baseline en CI: en s29, `line-height` md 21→20 movió ese
  alto (77→74) y tumbó el CI en dos push seguidos mientras el verify local iba verde. **Quien lo
  cubre es `npm run preflight`**, que desde s30 corre el smoke ENTERO (`CI=1 npm run e2e`, 68
  tests) y no un subconjunto. `npm run e2e:structure` sigue valiendo como bucle corto mientras
  iteras (`:update` si el cambio es deliberado, y revisa el diff del JSON), pero el gate de
  pre-push es preflight.
- **`npm run verify` son 26 gates desde s28.** Si añades uno, la cifra vive en 4 sitios y
  **ninguno la gatea**: `CLAUDE.md`, `docs/DOCS-INDEX.md`, `docs/AUDIT-SEMANAL.md` y el
  `SKILL.md` de la rutina. Lo que sí falla solo es el README, que debe **nombrar** el guard nuevo.
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
