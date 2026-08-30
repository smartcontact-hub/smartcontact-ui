# Migration Safety — Smart Contact Design System

> **Filosofía**: el DS minimiza la customización sobre PrimeNG. Styling sí
> (PrimeNG está diseñado para eso), reinventar HTML/lógica NO. Objetivo:
> mantenimiento sostenible + cero sorpresas en upgrades.

Este documento captura las reglas, riesgos y pro tips para que **upgrades de
PrimeNG, re-sync con el Kit de Figma o cambios internos** no rompan el camino
recorrido (tokens en 6 capas (numeradas 01→07; la 06 era el puente PrimeNG y se retiró — DD-1), preset modular, catálogo de customs).

---

## TL;DR — 3 reglas blindaje

1. **`--sc-*` es la única source of truth de tokens** — viven en
   `projects/design-tokens/src/lib/styles/tokens/layers/`. Los componentes
   consumen `--sc-*`, nunca `--p-*` directo. **Hecho cumplir por máquina:
   `npm run tokens:guard`** falla si algo usa `var(--p-*)` fuera del preset
   (`projects/ui-smartcontact/src/lib/theme/sc-preset/`), o una primitiva de
   escala `--sc-scale-*` en vez del alias `--sc-spacing-*`. Así el radio de
   explosión de un upgrade de PrimeNG queda contenido en el preset.
2. **Los wrappers `sc-*` encapsulan PrimeNG** — las apps usan
   `<sc-inputtext>`, nunca `<p-inputtext>` directo. Single point of
   adaptation cuando PrimeNG cambie.
3. **`customs-catalog.md` registra TODA divergencia** — cualquier override
   del preset base debe tener entry. Sin entry no es divergencia permitida —
   es deuda invisible. Las divergencias de color/métrica además constan en la
   listas `DIVERGE` de **`scripts/color-map.mjs`** (color) y `DIVERGE_SIZING` de **`scripts/sizing-map.mjs`** (métrica); `token-parity.mjs` solo las importa (verificación en CI).

---

## Arquitectura de aislamiento

```
┌─────────────────────────────────────────────────────────────┐
│  Apps consumidoras (supervisor, sc-docs, …)                  │
│  consume → <sc-*> de @smartcontact-hub/components                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  @smartcontact-hub/components                                    │
│  - Wrappers sobre <p-*> + componentes custom                 │
│  - Consume tokens --sc-* (alias --sc-spacing-*, semánticos)  │
│  - theme/sc-preset → puente --p-* ← var(--sc-*)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  @smartcontact-hub/styles                                        │
│  - layers/01-primitive … 07-dark.css → define --sc-*         │
│  - bloques @sc-gen generados del export DTCG del Kit         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PrimeNG 22 (runtime de temas PrimeUIX)                      │
│  Espera tokens --p-* — los recibe del preset                 │
└─────────────────────────────────────────────────────────────┘
```

Cualquier cambio upstream de PrimeNG SOLO afecta la última capa. El preset
contiene el blast radius. Los consumidores no se enteran.

---

## Tipografía migration-safe

**3 puntos clave:**

1. Los tipos viven en `--sc-font-*` (capas de tokens) + el preset, **no
   dentro de PrimeNG**. Un update de PrimeNG reemplaza SUS ficheros; los
   nuestros persisten y se re-aplican encima.
2. El único riesgo real es que un update RENOMBRE un slot `--p-*-font-size`
   del preset → desajuste visual, no crash, **detectable** por
   `tokens:type-parity` y arreglable en una línea.
3. **NO vincular `--sc-font-*` a la escala de PrimeNG** — invertiría la
   arquitectura (PrimeNG pasaría a ser la fuente).

**Regla operativa:** la tipografía se cambia **solo por tokens
`--sc-font-size-*`** (rampa redonda 12/14/16/18/20/24/32/48 en rem, DD-13),
nunca con literales `font-size` a mano. El guard lo bloquea (regla 5 de
`tokens:guard`) y `tokens:type-parity` reporta la cobertura (hoy 100 %
tokenizada).

**Las DOS capas de tipo** (clave para entender qué toca un update):

- **Capa de control** (texto de botón/input): font 14 (= `scale.1` del Kit) +
  tokens de componente. Es lo que PrimeNG define y el preset redirige a
  `--sc-*` (el CSS central `css.ts` cubre los módulos PrimeUIX que hardcodean
  `font-size: 1rem`).
- **Capa de contenido** (H/body/display = text styles de Figma): **nuestra**,
  PrimeNG no la define (no renderiza `<h1>`). Vive en los roles semánticos
  (`--sc-font-size-h1`…) de la capa 02.

Cambiar el ramp de contenido NO mueve los controles: carriles distintos.

---

## Re-sync con un Kit/preset nuevo

Cuando el Kit (Figma) o el preset base publican versión nueva, **NO se
re-duplica el Kit entero** (file nuevo = node IDs nuevos = Code Connect
caído). Se evoluciona el file canónico en sitio, trayendo **solo lo que
cambió**.

**Por capas:**
- **Tokens (código):** re-exportar el Kit (DTCG) →
  `projects/design-tokens/scripts/kit-export-dtcg.json` → `npm run
  tokens:import` regenera las zonas `@sc-gen` de `01-primitive.css`. Después
  `npm run tokens:parity`: lo que diverja, o se corrige o se clasifica como
  divergencia consciente (catalog + lista DIVERGE).
- **Figma (variables + text styles):** son **nuestros, locales** en el file
  canónico. Un Kit nuevo no los toca; la reconciliación es decisión humana
  (adoptar / ignorar / divergencia consciente), protegida por parity.
- **Code Connect:** apunta al file canónico (node IDs estables).

**Checklist al recibir Kit/preset nuevo:**
1. Re-export DTCG → `kit-export-dtcg.json` versionado.
2. `npm run tokens:import` + `npm run tokens:parity` (verde = sin drift
   silencioso).
3. Traer al file canónico **solo** los componentes/tokens nuevos.
4. `npm run verify` + `npm run e2e` + diff visual tras el merge.
5. Lo que NO overrideamos y cambie en el preset base nuevo → **decisión
   humana**, no auto-merge.

---

## ¿Qué se puede tocar?

### ✅ Seguro (no rompe nada)

- **Valores de `--sc-*`** en las capas curadas (02–07). La cascada
  `--p-*` ← `--sc-*` propaga sola. (Los bloques `@sc-gen` de la capa 01 NO se
  editan a mano: los reescribe `tokens:import`.)
- **Overrides del preset** documentados, apuntando a `var(--sc-*)`.
- **Componentes internos** (SCSS, templates, props) mientras la API pública
  se mantenga estable.
- **Crear componentes nuevos** siguiendo el patrón del DS (wrapper si PrimeNG
  lo cubre; custom documentado si no).
- **Entries en `customs-catalog.md`** y docs de `docs/`.

### ⚠️ Cuidadoso (puede romper, requiere audit visual)

- **Refactor del preset** (renombrar `--p-*`, cambiar mapping) → snapshot
  diff antes/después.
- **Migración de versión de PrimeNG** (21 → 22): verificar que los `--p-*`
  mapeados siguen existiendo, las APIs de los `<p-*>` envueltos, y diff
  visual de pantallas representativas. `tokens:parity` + `audit:theme-scale`
  detectan la mayoría de roturas de slots.
- **Cambiar API pública de un componente** → major bump + deprecation.

### 🔴 Peligroso (NO hacer sin causa muy justificada)

- **Modificar las variables base del file de Figma** (heredadas del Kit
  original): destruye la trazabilidad con upstream.
- **Consumidores accediendo `--p-*` directo** (el guard lo bloquea aquí; en
  las apps externas es revisión de código).
- **Usar `<p-X>` directo donde existe `<sc-X>`** — si no existe, crearlo
  antes. (Excepción única y deliberada: la página de smoke del tema en
  `sc-docs`, que prueba el preset sobre primitivos crudos.)
- **CSS overrides sobre `<p-X>` desde las apps**: esos selectores se rompen
  en cualquier upgrade.

---

## Pro tips

### 1. Antes de crear un componente nuevo
1. ¿PrimeNG ya lo tiene? → wrapper (`<sc-inputtext>` → `<p-inputtext>`).
2. ¿PrimeNG tiene similar con `pTemplate`? → usar el slot.
3. ¿La lógica existe pero quieres otro render? → headless/`[unstyled]`.
4. ¿No lo tiene? → custom, documentado en `customs-catalog.md` con su porqué.

### 2. Aprovecha los slots de plantilla (`#nombre`)
PrimeNG expone slots de templating en casi todo. Los wrappers de campo
(`<sc-select>`, `<sc-multiselect>`, `<sc-datepicker>`) re-proyectan estos
templates. Para `options: string[]` los wrappers soportan opciones
primitivas (resolución automática de `optionLabel`/`optionValue`) — no
fuerces una clave `label` en opciones string.

⚠️ **En PrimeNG 22 el slot se nombra `<ng-template #item>`, no
`pTemplate="item"`.** El cambio no es cosmético: v22 los resuelve por
`contentChild(<nombre>)`, o sea por un nombre de referencia **estático**. Un
puente que re-emita plantillas con `[pTemplate]` calculado en tiempo de
ejecución deja de funcionar, y lo hace **sin lanzar ningún error** — el
componente renderiza, simplemente sin tu plantilla. Le pasó a `<sc-select>` en
la migración; ver el docstring de `sc-select.component.ts`.

### 3. Aprovecha `pt` (passthrough)
Para inyectar attributes/classes en subnodos sin custom CSS:

```html
<p-select [pt]="{ root: { class: 'mi-clase' }, dropdown: { 'data-testid': 'x' } }" />
```

### 4. NO uses `::ng-deep` salvo casos canónicos
Aceptable: resetear chrome de PrimeNG para un shell propio,
`prefers-reduced-motion`, `:disabled` nativo. NO aceptable: estilar un custom
propio (debe tener API) o sobrescribir tokens (eso va por el preset).

### 5. Checklist anti-divergencia (4 preguntas)
1. ¿PrimeNG ya lo expone? → API nativa.
2. ¿Un token PrimeNG lo cubre? → ajustar vía preset, no vía CSS.
3. ¿Es brand-required? → entry en `customs-catalog.md` + override en preset.
4. ¿Es handoff 1:1 del Kit? → importar y enlazar.

Si las 4 son "no", probablemente NO necesitas la divergencia.

### 6. ~~CVA wrappers con signals~~ → HISTÓRICO: el CVA se retiró (DD-43, 2026-08-30)

Los seis campos del DS (inputtext, select, multiselect, datepicker, inputnumber,
search) daban soporte a `[(ngModel)]`/Reactive Forms con un `ControlValueAccessor`.
**Ese CVA se borró**: no lo ejercía ni un consumidor en todo el repo (0 Reactive
Forms, 0 `ngModel` externo; las apps usan `[(value)]`), y Angular 22 gradúa Signal
Forms —que detecta el `value = model()` de forma estructural— como su sustituto. El
día que aparezca el primer consumidor de forms real, `implements FormValueControl` es
una línea por componente; el `value = model()` ya cumple el contrato.

La guía vieja (el `untracked()` sin side-effects dentro de `writeValue`) ya no aplica
porque `writeValue` no existe. Se conserva aquí como nota histórica: si algún día se
reintroduce un CVA, esa era la trampa —`untracked` escribe SOLO el signal, un
side-effect dentro queda silenciado para los effects que lo observan—.

El estado que el field-pattern SÍ comparte (id, msgId, invalid, footer, sizing de
panel, opciones) vive hoy en `components/field/sc-field.ts` como funciones factory,
no en cada componente.

### 7. Refactor de wrappers: audit de CSS overrides en consumidores
Si un refactor cambia el DOM interno de un wrapper, los consumidores pueden
tener selectores apuntando al DOM antiguo que se rompen en silencio (AOT no
valida CSS). Post-refactor: grep de selectores del patrón viejo + diff visual
o revisión manual.

---

## Lo que aprendimos migrando de verdad — PrimeNG 21 → 22

> Hasta el 2026-08-25 este documento decía qué **debería** pasar en un major.
> Ese día pasó. Esto es lo medido, incluido lo que salió distinto de lo previsto.
> Se escribe aquí porque la plataforma tendrá que hacer este mismo camino, y
> conviene que llegue sabiendo dónde duele de verdad.

### El resultado en cuatro números

| Qué | Cuánto hubo que tocar |
|---|---|
| **Tokens `--sc-*`** (las 6 capas) | **0 líneas** |
| **Preset** (el único sitio que puede tocar `--p-*`) | **6 líneas, en 1 fichero** |
| Wrappers del DS (`projects/ui-smartcontact`) | 242 líneas |
| Las 4 apps que consumen el DS | 237 líneas — y de esas, **111 no eran de PrimeNG** (una violación de frontera que TypeScript 6 destapó) y 61 eran un renombrado mecánico de plantillas |

Un salto de versión mayor del proveedor de componentes **no movió ni un token**.
Ese es el resultado que contesta la pregunta de si el mapeo de tokens vale la
pena: es el seguro más barato del repo, porque su prima se paga una vez y no
vuelve a cobrarse en cada subida.

Y el reparto de las otras líneas dice lo mismo por el otro lado: el golpe cayó
**dentro** de los wrappers, que es exactamente para lo que están. Las apps no se
enteraron salvo en un renombrado mecánico.

### Lo que aguantó, y por qué

- **Las 36 clases internas de PrimeNG de las que dependemos desde nuestro SCSS
  siguen existiendo las 36.** `audit:primeng-coupling` pasó sin un solo rojo.
  Era el riesgo que este documento marcaba como el más caro, y no se materializó.
- **PrimeNG puso red donde pudo.** Renombró sus elementos a kebab
  (`p-tableCheckbox` → `p-table-checkbox`) pero declara **las dos grafías**:
  `selector: "p-table-checkbox, p-tablecheckbox"`. Quien no tocara nada, no se
  rompía.
- **El preset absorbió el cambio de motor de temas** (`@primeuix/themes` 2 → 3)
  en una línea. Sin la regla de que solo el preset toca `--p-*`, ese cambio se
  habría repartido por todo el repo.

### Lo que se rompió — y por qué ninguno fue culpa de PrimeNG

Siete arreglos. Seis eran API de PrimeNG y se vieron enseguida: el compilador
o los tests los cantaron. Los dos que importan son los que **no cantó nadie**:

0. **Los filtros y la tabla de CusCare, 42 tests en rojo a la vez.** PrimeNG 22
   **retiró la entrada `styleClass`** de `p-table`, `p-select` y `p-multiselect`
   — pero **no** de `p-menu`, `p-popover`, `p-button` ni `p-dialog`. La retirada
   es **por componente**, así que preguntarse «¿existe `styleClass` en PrimeNG?»
   da la respuesta equivocada. Y como se escribe como atributo **estático**
   (`styleClass="cc-table"`), Angular **no lo considera un error**: se queda en
   el DOM como atributo suelto, la clase nunca llega, y todo el CSS que colgaba
   de ella deja de aplicar. Con `[styleClass]="expr"` sí habría fallado la
   compilación — o sea que **la forma que menos parece un binding es justo la
   que rompe en silencio**.
1. **`sc-datatable`, selección por rango con Mayús.** El código preguntaba
   `closest('p-tablecheckbox')` para saber si el gesto había empezado sobre la
   casilla. La migración pasó la plantilla a `<p-table-checkbox>`. El tag
   renderizado cambió, el `closest` empezó a devolver `null` **siempre**, el
   guard cortaba en su primera línea y el gesto quedó muerto. Sin error en
   consola, sin nada roto en pantalla.
2. **Los filtros de CusCare, en su test.** Mismo patrón: la plantilla pasó a
   `<p-multi-select>` y el test seguía buscando `p-multiselect`.

Los dos últimos **los introdujo nuestro propio renombrado, no el proveedor**:
PrimeNG aceptaba las dos grafías precisamente para que esto no ocurriera. Lo que
rompió fue que **nuestro código dependía en secreto del tag que nuestra propia
plantilla escribe**, y esos dos ficheros no se leen juntos jamás.

El primero sí fue un cambio real del proveedor — y el más caro de los tres, 42
tests de golpe. Lo que tienen en común es el modo de fallo, no la culpa: **algo
dejó de casar y nadie lanzó un error**.

Y hay una tercera, la más incómoda: **los 8 tests unitarios de ese gesto
siguieron verdes**. Usaban un doble que decía «sí» a cualquier selector
(`{ closest: () => ({}) }`), así que medían su propio stub, no el código. Con un
elemento de verdad, 4 de ellos se ponen rojos — comprobado reintroduciendo el
bug a propósito.

> **La regla que deja: un doble no debe responder que sí a la pregunta que el
> código está haciendo.** Si lo hace, el test se está midiendo a sí mismo.

### La frontera que hay que respetar, en una frase

`--sc-*` y `<sc-*>` protegen de los cambios del proveedor **mientras no se
alargue la mano por debajo**. Los dos fallos silenciosos de este major están,
los dos, en sitios donde el código sí alargaba la mano: un `closest()` contra un
tag de PrimeNG y un localizador de test contra otro.

Cuando un gesto es **nuestro** (un guard, un ancla de selección, un test),
ánclalo en algo **nuestro** — una clase que ponga nuestra plantilla — y no en el
nombre que renderiza el proveedor. `sc-datatable` ahora usa
`.sc-datatable__check-box`, puesta por nosotros: un renombrado ajeno ya no puede
apagar ese gesto en silencio.

### Lo que ahora vigila la máquina

`audit:primeng-coupling` (dentro de `npm run verify`) pasó a tener dos secciones:

- **A · clases `.p-*`** — que PrimeNG no borre bajo nuestros pies ninguna de las
  36 de las que dependemos, y que el número no crezca (tope 36).
- **B · nombres de elemento** — que una consulta desde código (`closest`,
  `querySelector`, el `locator` de Playwright) use **exactamente** la grafía que
  escriben nuestras plantillas, y que **no convivan dos grafías del mismo
  elemento** en el repo.
- **C · entradas inertes** — que ningún atributo que escribimos sobre un `p-*`
  haya dejado de ser una entrada de ese componente. Se lee la metadata
  **compilada** del PrimeNG instalado, que es la única fuente que no se puede
  quedar desfasada respecto al paquete que hay en disco.

Las tres secciones se probaron **en rojo con los fallos reales de este día**
antes de darlas por buenas, y en verde con los casos legítimos (`p-popover` sí
acepta `styleClass`, y no debe dar rojo). La primera versión de la B los dejaba
pasar a los dos: **un gate que no se pone rojo con el fallo que lo motivó no es
un gate, y solo se sabe probándolo.**

La C, además, nació mirando solo `styleClass` —el caso medido— y generalizarla a
*todas* las entradas destapó otra en el acto: `<p-message text="…">`, que v22
también retiró. **Un gate que solo mira el caso que ya conoces solo caza el
pasado.**

### Contrapesos honestos — lo que esto NO demuestra

- **La capa de abstracción no evitó los cambios de API: los contuvo.** Son cosas
  distintas. Hubo que reescribir el puente de plantillas de `<sc-select>` entero.
  Lo que compró la capa es que se reescribió **una vez**, y no en los 9 sitios
  que proyectan plantillas.
- **La capa no es gratis, y en este salto fue la parte más cara** (242 líneas,
  más que las 4 apps juntas). El trato es ese: pagas concentrado en un sitio en
  vez de repartido por todos. Sale a cuenta cuando hay varias apps —que es
  nuestro caso—, no necesariamente cuando hay una.
- **36 clases internas de PrimeNG en nuestro CSS siguen siendo deuda real.**
  Aguantaron este major; no hay ninguna promesa de que aguanten el siguiente. El
  tope solo impide que crezcan.
- **Y la arquitectura no cazó los dos bugs: los cazó una suite corriendo.** Uno
  de ellos, además, ni siquiera llegó a verse hasta arreglar otro fallo distinto
  que lo tapaba. La lección de proceso pesa aquí tanto como la de diseño.
- **El renombrado cosmético fue el que rompió.** PrimeNG no lo exigía. Si algo
  no hace falta cambiarlo en una migración, no lo cambies: cada línea tocada es
  una superficie donde algo puede depender de ti sin que lo sepas.

### Para la próxima migración (aquí o en la plataforma)

1. **Antes de empezar**, ten un gate que sepa decir de qué internos del
   proveedor dependes. Sin eso, «funciona» solo significa «no he mirado».
2. **Cambia lo que el proveedor exige, y nada más.** Lo cosmético lo pagas.
3. **Después de cada renombrado**, busca quién consultaba ese nombre desde
   JavaScript y desde los tests. Es un `grep`, y es donde vivió el fallo
   silencioso de este major.
4. **Desconfía de los atributos estáticos.** Un binding que desaparece
   (`[algo]="x"`) lo caza el compilador; un atributo (`algo="x"`) no. Es
   exactamente al revés de lo que la intuición dice.
5. **Desconfía de los verdes de los tests que usan dobles.** Comprueba que el
   test se pone rojo con el fallo puesto, sobre todo si el doble simula justo
   la pregunta que hace el código.
6. **Corre la suite entera una sola vez y sin tocar el árbol.** Dos suites a la
   vez sobre el mismo servidor dan rojos falsos, y perseguirlos cuesta más que
   la migración.

---

## Riesgos vivos

- **Bajo**: drift Figma ↔ código fuera de los streams vigilados → mitigado
  por parity en CI + auditorías periódicas. Patches de PrimeNG (21.x → 21.y)
  → el preset protege.
- **Medio**: major de PrimeNG → audit de `--p-*` + APIs envueltas + diff
  visual. Kit de Figma major → merge manual con decisión por entry.
  *(El 21 → 22 ya se hizo el 2026-08-25 y está medido abajo: el coste real no
  estuvo donde este documento lo esperaba.)*
- **Alto (no debería pasar con las reglas)**: consumidor tocando `--p-*` o
  `<p-X>` directo · customs sin entry en el catalog. El guard y la revisión
  de código lo previenen.

---

## Referencias cruzadas

- [`customs-catalog.md`](customs-catalog.md) — divergencias documentadas + checklist anti-divergencia.
- [`DECISIONS.md`](DECISIONS.md) — decisiones DD-* (DD-11 mecanismo tipográfico · DD-13 escala tipográfica).
- [`../projects/design-tokens/README.md`](../projects/design-tokens/README.md) — tooling de tokens.
- [`guia-tokens.md`](guia-tokens.md) — guía del sistema de tokens (diseño).
