# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-18, sesión 12** (deuda de diseño + flujo de reglas).

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md) (reglas de proceso).
2. **Confirma el CI LEYENDO el run**, no este hand-off.
3. Todo pusheado a main y desplegado en Pages (sc-demo + supervisor + agent).
4. Lo grande que queda está en **§3**, con su precondición ya verificada.

---

# HECHO en la sesión 12

Seis fases, cada una con `npm run verify` entero + push + CI leído.

### La red que faltaba (lo más importante)
**Ningún test conducía la app real** — 0 specs, 0 tests de componente. Ahora hay
`e2e/supervisor/` (14 tests, config propia en :4405, `npm run e2e:supervisor`) que
rellena formularios, valida, guarda y comprueba el resultado. Está en el CI.
Cazó dos bugs reales durante la propia sesión (ver abajo).

Trampas del entorno, ya codificadas en los helpers: **nada de `page.reload()`** en
memory (rules/categories/entities viven en RAM y la recarga los repone) y
animaciones desactivadas (los overlays animados dan "element is not stable").

### Flujo de reglas (`2cab28d`)
- **Bug duro muerto**: el campo "Categoría IA" se podía elegir pero su selector
  devolvía lista vacía → condición incompleta → **Guardar bloqueado sin salida**.
  El resolver ya tenía el TODO puesto; ahora lee `CategoriesStore`.
- **Operador "no es"** en campos lista y dirección. El motor lo soportaba entero
  (evaluación, detección de contradicciones, prosa con "ni"); solo faltaba la UI.
- **Descripción** pintada en el constructor (el modelo y el guardado ya existían).
- **Ida y vuelta categoría↔regla**: el CTA del modal navega en el MISMO tab con
  `?categoria=<id>`; el builder preselecciona y enciende el análisis IA antes de
  fijar `pristine`. La vinculación se deriva sola al guardar.
- Aviso no bloqueante con **0 reglas activas**; el CTA del vacío abre el menú de
  tipos; recorrido `/reglas` de sc-demo realineado (Y/O honesto, categoría en los
  snippets, notas DD-28 encuadradas como histórico).

### Consistencia (`e942ee8`, `2171991`)
- **`p-button` 47 → 0**: toda la app usa `sc-button` (12 → 59 usos).
- Las tres páginas hermanas se comportan igual: fila clicable en Categorías y
  Entidades, kebab de Categorías con Activar/Desactivar (la tabla pintaba el
  estado sin ofrecer forma de cambiarlo), vacío de Entidades al componente
  compartido.
- **Entidades NO gana Duplicar**: su store no lo implementa y `Entity` no tiene
  estado. No se inventan acciones sin semántica.

### DS (`fa0232d`, `da9dc39`)
- **Iconos**: el supervisor tenía su PROPIO `sc-icon` (mismo selector que el del
  paquete) y los 220 usos resolvían al local. Migrados los 44 ficheros al
  `ScIconComponent` del DS y **borrado el duplicado**. `opsz` de `inherit` pasa a
  14 (default del Kit — decisión de Rafa).
- `ScConfirmRequest.icon?` (antes hardcodeaba el triángulo de peligro) y
  `GroupRef` exportado (el supervisor tenía copia local).
- **Tipografía**: 87 `font-weight` y 11 stacks mono a tokens, con las **reglas 6 y
  7 del `token-guard`** en el mismo commit para que no se deshaga.

### Higiene (`f1990ba`)
`testIgnore` en Playwright (el `npm run e2e` recogía specs de la app equivocada),
3 checkboxes del AUDIT ya hechos, cifras corregidas en docs y comentarios DD-28
obsoletos actualizados a DD-30.

## Bugs cazados (dos de ellos, por la red nueva)

1. **Desplegables del constructor tapados** (preexistente, verificado con
   `git show HEAD~1`): se renderizaban en el flujo y quedaban debajo del dock fijo
   y de la sección de IA — las opciones de abajo no se podían clicar. Los 6
   `sc-select` pasan a `appendTo="body"`.
2. **Kebab que abría el modal** (regresión mía): al hacer la fila clicable, al
   kebab le faltaba el `stopPropagation` que sí tenía Reglas. La suite lo cazó
   antes del commit.
3. **`severity` convertido en `variant` fuera de sitio**: el primer pase de la
   migración de botones tocó un `sc-message`. Lo cazó un chequeo que comprueba a
   qué ETIQUETA pertenece cada atributo.

---

# ⚠️ tokens-sync — causa raíz encontrada (y NO es la que decía el hand-off viejo)

El hand-off anterior decía "drift en capas curadas". **Es falso.** Reproducido en
local con el export real de la rama y `CI=1` (sin `CI` el fallo es otro, porque
`export-clean` se salta en CI — validar el validador importa):

```
not ok 12 — el export real no deja NADA sin resolver ni sin primitiva
  [dark] message.info.border.color = #0369a15c (base #0369a1 sin --sc-color-* primitiva)
  [dark] toast.info.border.color   = #0369a15c
```

El Theme Designer mapea `info` a **sky de Tailwind** (`#0369a1`), pero en este DS
la familia `sky` está **renombrada a la marca**: `--sc-color-sky-700` es `#0a3ba0`.
Así que el valor del export no tiene primitiva y el generador lo rechaza.

Es exactamente el mismo tema que la PR #16 que cerraste ("info se queda blue").
**Decisión pendiente tuya**, no técnica: (a) arreglar el mapeo de `info` en el
Theme Designer para que apunte a la paleta real del DS, o (b) registrar `info`
como divergencia de marca en `customs-catalog.md` para que el generador la tolere.
Mientras tanto el workflow seguirá rojo en cada export — y está bien que lo esté:
te está avisando de una divergencia real.

---

# §3 · Lo que queda (por valor, con precondición verificada)

### 1. `sc-field-wrapper` — el P0 del audit. **Diseño resuelto, ejecución pendiente**
Los 5 componentes CVA (`inputtext`/`select`/`multiselect`/`datepicker`/`inputnumber`)
repiten el bloque label+control+error palabra por palabra. La precondición que el
audit exigía ("piloto detrás de `npm run e2e`") **ya existe**: la red del supervisor.

**Trampa encontrada al diseñarlo** (esto es lo que ahorra la próxima sesión): el
label y el mensaje son **hijos flex del host** (`.sc-inputtext{display:flex;column}`),
y con la encapsulación de Angular un wrapper que los renderice **pierde los estilos
del padre** (`.sc-x__label[_ngcontent-padre]` no casa con el elemento del wrapper).

Diseño válido:
1. `:host { display: contents }` en el wrapper → no rompe el flex del padre.
2. El wrapper emite **dos clases**: `sc-field__label` + `{{block}}__label`. La BEM se
   mantiene porque hay selectores externos vivos (`e2e/supervisor/category-modal.spec.ts`
   usa `.sc-inputtext__msg--error`; `e2e/components.spec.ts` usa `.sc-inputtext__ifta-label`).
3. Los estilos se mueven a la SCSS del wrapper bajo `.sc-field__*`.
4. Única divergencia real entre los 5: `margin-bottom` 2px (inputtext, inputnumber)
   vs 0 (el resto) → custom property heredable `--sc-field-label-mb`, que sí
   atraviesa la encapsulación.
5. El guard del label difiere (`!iftaLabel()` / `!inline()` / ninguno) → input `showLabel`.
6. `sc-search` NO entra: no tiene label ni mensaje.

Verificación: diff de `outerHTML` del formulario antes/después + `e2e:supervisor`.

### 2. Tablas → `sc-datatable` (14 a mano, 0 usando el componente)
Sigue necesitando primero: hook `rowStyleClass` y output `rowClick`/`rowActivate`
en el DS, y una **sonda de teclado instrumentada** — con `page.keyboard` de
Playwright, que sí entrega eventos completos (el tooling del navegador los manda
vacíos; ya me costó una retractación).

### 3. i18n del constructor de reglas (~50 strings solo en español)
Labels de campo, operadores, unidades y toda la prosa del alcance viven como
**constantes TS** en `condition.types.ts`, así que no pueden usar el pipe.
Patrón a seguir (ya hay precedente en el propio fichero con `ValidationIssue`):
`label` → `labelKey`, las funciones de prosa reciben un lambda `t(key, params)`
igual que ya reciben `labelFor`, y los computeds que pintan leen `lang()` para
recomponer al cambiar de idioma. Ningún test unitario asevera prosa (comprobado).

### 4. Menores
- Refrescar baselines `-darwin` (stale desde 2026-06-13; **ya fallaban antes** de
  esta sesión, 39 fallos TODOS de píxel y 0 de métrica; el CI los salta).
- Absorber `illustrated-avatar` (10 usos) → `sc-avatar` en px, y `label-chip`
  (4 usos) → `sc-tag` size `xs`. Son los 2 gaps del DS que quedan.
- 16 wrappers del DS con `@Input()` → signals.
- P1 admin: `isNameTaken` duplicado (categories/entities), handlers legacy
  `onLabelAdd`/`onLanguageAdd`, `formatTime` ×3, `EXPORT_PATH` ×7.

---

# Aparcado con razón (no es olvido)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` **631 veces** por dentro (select, multiselect, cascadeselect, api). Imposible sin barrer esos componentes. |
| `line-height` sin unidad (~55) | La escala del Kit es en px/rem: no hay token destino. Migrarlos sería inventar tokens. Los px/rem sí quedan gateados. |
| Superficies dark (zinc vs cool) · `--sc-text-subtle` 2.04:1 | Decisiones de marca: se presentan con visuales, no se deciden por el camino. |
| 145 claves i18n huérfanas | Barrido key-por-key aparte (`i18n:check` solo exige paridad entre idiomas, no detecta huérfanas). |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda. |

---

# TRAMPAS (verificadas en esta sesión)

- **El dev server sirve el DS COMPILADO**: tocar `projects/ui-smartcontact*/src` no
  se ve hasta `npm run build:icons` / `build:components` + reiniciar. Me dio una
  medición falsa (opsz 24 cuando el CSS ya decía 14).
- **`export-clean` se salta con `CI=1`**: reproducir un fallo de workflow sin esa
  variable mide otra cosa.
- **`git ls-files` incluye borrados sin stagear** → `token-guard` peta con ENOENT.
  Haz `git add -A` antes de correr `verify` si has borrado ficheros.
- **Nada de backticks en un mensaje de commit por shell**: el intérprete se come la
  palabra (le pasó a `Entity` en `2171991`). Usa `-F -` con heredoc.
- El tooling del navegador entrega **teclas vacías**: un negativo de teclado sin
  canal validado es "sin verificar", nunca "roto".
