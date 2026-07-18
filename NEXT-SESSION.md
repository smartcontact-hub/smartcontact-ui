# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-18, cierre sesión 12 + PLAN de la sesión 13** (pedido por Rafa).

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md) (17 reglas de proceso).
2. **Confirma el CI LEYENDO el run** (el último push de s12 salió con gates de docs
   verdes en local; el run completo confirma).
3. La sesión 13 ejecuta el **PLAN DE BLOQUES** de abajo, en orden. B1 es el encargo
   central de Rafa.
4. Conector Figma: el que FUNCIONA es el de claude.ai (`mcp__acb3d14c…__get_design_context`
   / `get_screenshot`); el server `plugin:figma:figma` es el que pedía re-auth. El análisis
   del nodo ya está hecho (abajo) — no hace falta repetirlo salvo para ampliar.

---

# PLAN SESIÓN 13 — bloques (importantes y críticos, por orden)

## B1 · Rediseño de la pantalla de creación de reglas (encargo de Rafa, 2026-07-18)

**Mandato literal**: usar **`/impeccable`** (skill de usuario, confirmada en
`~/.claude/skills/`) para eliminar el AI slop de la pantalla de crear regla; analizar el
diseño de Figma y darle ese estilo visual. Del Figma **gusta**: más color ("lo nuestro es
boring"), la distribución, el rollo SaaS moderno y elegante. Del Figma **NO valen**: su
tipografía ("falla") y sus colores literales — todo se mapea a tokens `--sc-*`.
Referencia de memoria: con /impeccable en un proyecto CON DS se toman sus principios
(anti-slop, jerarquía), nunca sus fuentes/colores/iconos.

**Figma**: [Reglas de transcripción, nodo 51:10239](https://www.figma.com/design/vIhCh2rkAahLU8NwQD0GLG/Reglas-de-transcripci%C3%B3n?node-id=51-10239)
— **análisis YA hecho en s12** con `get_design_context` (estructura + medidas + captura):

### Qué propone el diseño (medido, no supuesto)
- **Página sobre fondo suave** (`#f4f6fa`) con las secciones como **tarjetas blancas**
  (radius 12, padding 32, gap interno 20; gap entre tarjetas 24; padding de página 40).
- **Cabecera con las acciones**: breadcrumb a la izquierda, `Cancel` + `Create Rule` a la
  DERECHA — el guardar sube del dock inferior a la cabecera. (Esto resuelve además el
  feedback del 1-jul del recorrido: «Guardar vive abajo, lejos de la navegación».)
- **Aside de impacto como tarjeta** fija de 360px: título con icono, frase intro, **número
  héroe** (40px, extrabold, color de acento), caption, filo divisor, filas métrica
  label/valor (valor positivo en verde).
- **"Se cumple si…" como caja tintada** (fondo `#f0f4ff`, texto `#3b32b3`, icono info,
  valores en bold) DENTRO de la tarjeta de información básica, bajo el nombre — no como
  cajón gris suelto entre secciones.
- **Condición = campo · chip de operador · valor**: los extremos como inputs suaves
  (`#f8fafc` + borde `#e9edf5`, radius 6) y el operador como **chip tintado** (fondo
  `#f0efff`, texto acento, radius 20). Papelera a la derecha.
- **Conector Y/O como píldora sólida de acento** (texto blanco, radius full) centrada
  entre dos líneas divisorias horizontales.
- "Añadir condición" como text-button de acento con `+`.
- Sección IA: filas título+descripción con toggle a la derecha, separadas por filos; badge
  "RECOMMENDED" en menta.
- Su acento único es un violeta `#635bff` (con gradiente en el botón primario) y titulares
  en Outfit — **esto es lo que NO se copia**.

### Mapa de traducción diseño → DS (decidido; no inventar tokens)
| Del Figma | En nuestro DS |
|---|---|
| Acento violeta `#635bff` (chips, píldora Y/O, héroe, links de acción) | **Familia sky de MARCA** — Rafa la confirmó con captura y es 11/11 idéntica a `--sc-color-sky-*` (verificado contra `01-primitive.css`). Chips: sky-50/100 fondo + sky-700 texto. Píldora Y/O: sky-500/600 fondo + blanco. Héroe y links: sky-600. Caja "se cumple si": sky-50 fondo + sky-800/900 texto. Usar los roles semánticos (`--sc-*`) que ya apunten a sky donde existan; primitiva solo si no hay rol. |
| Gradiente del botón primario | NO. `sc-button variant="primary"` tal cual — el DS del botón no se toca. |
| Outfit (titulares) | NO. Rampa Inter nuestra: títulos de sección `--sc-font-size-400/500` + `--sc-font-weight-semibold`. |
| Héroe 40px | **Tope de la rampa** (`--sc-font-size-650` = 32px, techo documentado del Kit). No se crea token display sin pasar por el export del Kit. |
| Fondo página `#f4f6fa` / tarjeta blanca / borde `#e9edf5` | `--sc-bg-default` / `--sc-bg-surface` / `--sc-border-subtle|default`. |
| Verde menta badge + verde métrica | Tokens green/success existentes. |
| Espaciados 40/32/24/20/16/12/8 | Alias `--sc-spacing-*` más cercanos de la tabla 14-base (mapear valor a valor al implementar; cero px a pelo — el token-guard ya vigila font-size/weight/mono, y la regla de escala vigila los spacing). |
| Copys ("GPT-4", "Billing Overhead Variance", inglés) | NO. Nuestros copys reales (resumen/sentimiento, proyección día/mes — no tenemos datos de billing). |

### AI slop concreto a eliminar (anclado a capturas de s12, no especulación)
- Eyebrows "01/02/03" flotantes con bloques planos → los números pueden integrarse en el
  título de tarjeta (el Figma hace "01. Basic Information") o eliminarse; decidirlo con
  `/impeccable` en mano.
- **La tarjeta de impacto SE SOLAPA con el formulario en anchos medios** (visto a 739px
  en s12) → el layout de tarjetas con aside en columna propia lo arregla de raíz; en
  estrecho, el aside apila SIN superponerse.
- Prosa "Se cumple si" en cajón gris plano → caja tintada sky dentro de la tarjeta 01.
- Dock inferior desconectado → acciones a la cabecera vía `topBarSlot.setActions` (mismo
  mecanismo que ya usa el listado); los mensajes de validación del dock pasan a inline
  sobre el pie del formulario.
- Todo del mismo peso visual (gris sobre blanco) → jerarquía por tarjetas + acentos sky
  SOLO en la lógica de la regla (operadores, conectores, héroe), no decoración porque sí.

### Lo que NO cambia (semántica intacta)
Modelo y flujos de s12 tal cual: un solo toggle de IA (los "features" del Figma como filas
descriptivas, NO como toggles independientes — el modelo tiene un flag), multiselect de
categorías a detectar, alternativas Y/O implícitas, validación al submit, cross-link
`?categoria=`, descripción, "no es". El rediseño es presentación.

### Pasos y gates
1. Invocar **`/impeccable`** al empezar (principios; su estética se descarta).
2. Reescribir plantilla+SCSS de `rule-builder-page` (+ `rule-condition-builder` y
   `rule-condition-value-picker` en lo visual). **Conservar los hooks del e2e**:
   `.cond-row__field`, `.cond-row__op`, `.vpick__*`, `.scope-desc`,
   `.rule-builder__ai-categories`, botones por rol/nombre — o actualizar los tests EN el
   mismo commit, conscientemente.
3. Acciones a la TopBar; validar a mano el guard de descarte (dirty) tras moverlas.
4. Gates: `/impeccable` checklist + `e2e:supervisor` 14/14 + `verify` entero + AOT +
   screenshots a 1440 **y a ancho medio** (donde hoy se solapa el impacto) + dark mode.
5. Pasada corta de coherencia en el LISTADO de reglas (mismo fondo/tarjeta) sin rehacerlo.
6. Recapturar las pantallas de reglas para la galería de uso con la **config aislada**
   (trampa: `npm run e2e` clobbea `public/usage/*.png`).

## B2 · `sc-field-wrapper` (P0 del audit) — diseño resuelto en s12, ejecutar
La trampa y las 6 decisiones están abajo en «Diseño sc-field-wrapper» (§conservado de
s12). Precondición (red e2e que conduce formularios reales) cumplida. Piloto inputtext
con diff de `outerHTML` → replicar a select/multiselect/datepicker/inputnumber.

## B3 · tokens-sync — decisión TOMADA: `info` = sky de marca
Rafa confirmó con captura (2026-07-18) que la sky del Figma ES la del DS (11/11 valores,
verificado). Por tanto el export del Theme Designer, que manda `info` como sky de
Tailwind (`#0369a1`), es lo desfasado. Arreglo en el LADO FIGMA (variables de `info` →
sky de marca) + re-export + validar en local con `CI=1 npm run tokens:import && CI=1 npm
run verify` (receta s12 — sin `CI=1` mide otra cosa). Si el Theme Designer se resiste,
plan B: registrar la divergencia en `customs-catalog.md` §color y tolerarla en el
generador — pero la dirección es arreglar la fuente. Esto desbloquea el round-trip con
Marta.

## B4 · Tablas → `sc-datatable` (14 a mano, 0 con el componente)
Antes de migrar: `rowStyleClass` + output `rowClick` en el DS, y sonda de teclado con
`page.keyboard` de Playwright (el tooling del navegador manda teclas vacías). Piloto 2
tablas + resto por lotes con la red e2e de gate.

## B5 · i18n del constructor + menores
~50 strings solo en español como constantes TS (`condition.types.ts`): `label`→`labelKey`,
prosa con lambda `t(key, params)` (patrón `ValidationIssue` ya en el fichero), computeds
leen `lang()`. **Sinergia**: si B1 reescribe esas plantillas, hacer i18n en la misma
pasada ahorra tocar dos veces. Menores: avatar px, tag `xs`, 16 wrappers `@Input`→signals,
P1 admin (isNameTaken dup, handlers legacy, formatTime ×3), baselines `-darwin` al final
del bloque que toque componentes del DS.

## Preguntas que me hice (y mis respuestas)
- **¿El violeta pasa a...?** Sky de marca — es la única lectura compatible con "usamos sky
  en Figma" + "sus colores no valen". El botón primario NO cambia.
- **¿Adopto los toggles por-feature de la sección IA?** No: el modelo tiene UN flag
  (`aiAnalysis`); serían toggles mentirosos. Filas descriptivas + el toggle único.
- **¿El héroe de 40px?** 32px (`--sc-font-size-650`), techo real de la rampa. Si el número
  héroe merece un token display propio, eso pasa por el export del Kit, no por CSS.
- **¿Mover Guardar arriba rompe el e2e o el guard?** El e2e localiza por rol/nombre
  (sobrevive); el guard de dirty hay que validarlo a mano tras mover las acciones.
- **¿Rediseño también el listado?** No en B1 — solo una pasada de coherencia de fondo.
  Rehacerlo entero sería scope creep sobre el encargo.
- **¿i18n dentro de B1?** Solo si B1 ya reescribe esa plantilla (sinergia); si aprieta el
  tiempo, B5 lo recoge.

---

# Diseño sc-field-wrapper (resuelto en s12 — no redescubrir)

Trampa: label y mensaje son **hijos flex del host** (`.sc-inputtext{display:flex;column}`);
con encapsulación Angular, un wrapper que los renderice pierde los estilos del padre.
Diseño válido: (1) `:host{display:contents}`; (2) el wrapper emite DOS clases
(`sc-field__label` + `{{block}}__label` — la BEM se mantiene: hay selectores externos
vivos en `e2e/supervisor/category-modal.spec.ts` y `e2e/components.spec.ts`); (3) estilos
a la SCSS del wrapper bajo `.sc-field__*`; (4) la única divergencia (margin-bottom 2px
inputtext/inputnumber vs 0 resto) por custom property heredable `--sc-field-label-mb`;
(5) guard del label variable (`!iftaLabel()`/`!inline()`/ninguno) → input `showLabel`;
(6) `sc-search` NO entra (sin label ni msg). Verificar con diff de `outerHTML` + e2e.

---

# HECHO en la sesión 12 (resumen; detalle en los commits `f1990ba…25e093d`)

- **Red e2e del supervisor**: 14 tests (`npm run e2e:supervisor`, :4405, en CI) — antes
  NADA conducía la app. Cazó 2 bugs el día que nació.
- **Flujo de reglas**: bug de "Categoría IA" (bloqueaba Guardar sin salida) muerto;
  operador "no es"; Descripción visible; cross-link `?categoria=` en el mismo tab con
  auto-vinculación; aviso con 0 activas; CTA del vacío con menú de tipos; demo /reglas
  realineada; desplegables del constructor a `appendTo="body"` (estaban tapados por el
  dock — preexistente).
- **Consistencia**: `p-button` 47→0 (todo `sc-button`); las 3 hermanas iguales (fila
  clicable, kebab con Activar/Desactivar en categorías, vacío compartido).
- **DS**: icono local del supervisor BORRADO (220 usos → `ScIconComponent` del DS; opsz
  inherit→14); `ScConfirmRequest.icon?`; `GroupRef` exportado; 87 font-weight + 11 stacks
  mono a tokens con reglas 6-7 del token-guard.
- **tokens-sync**: causa raíz reproducida con `CI=1` (el diagnóstico heredado era falso).

# Aparcado con razón

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro. |
| `line-height` sin unidad (~55) | Sin token destino en el Kit; migrarlos = inventar tokens. |
| Superficies dark (zinc vs cool) · `--sc-text-subtle` 2.04:1 | Decisiones de marca; presentar con visuales. |
| 145 claves i18n huérfanas | Barrido aparte; `i18n:check` no las caza. |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda. |

# TRAMPAS (verificadas)

- **El dev server sirve el DS COMPILADO**: tocar `projects/ui-smartcontact*/src` no se ve
  hasta `build:icons`/`build:components` + reiniciar.
- **`export-clean` se salta con `CI=1`**: un repro de workflow sin sus variables mide otra cosa.
- **`git ls-files` incluye borrados sin stagear** → `token-guard` peta con ENOENT; `git add -A` antes de `verify` si borraste ficheros.
- **Sin backticks en mensajes de commit por shell** (se comen palabras); usa `-F -` con heredoc.
- El tooling del navegador entrega **teclas vacías**: negativo de teclado sin canal validado = "sin verificar".
- **Nada de `page.reload()`** en journeys de memory (stores en RAM); animaciones off en e2e (overlays PrimeNG dan "element is not stable").
