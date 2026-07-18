# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-07-18, cierre sesión 13.**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md).
2. **Confirma el CI LEYENDO el run** de los commits de s13.
3. Lo que queda vivo está en «Bloques abiertos». **Los tres llevan una precondición
   verificada contra el código** — no re-descubras el alcance, pero sí re-comprueba
   antes de ejecutar.
4. Figma: el bridge que FUNCIONA es el **plugin de escritorio** (`mcp__Figma__*`,
   probado con `get_metadata`/`get_screenshot` sobre 51:10239). El conector de
   claude.ai también sirve. El server `plugin:figma:figma` pide re-auth.

---

# HECHO en la sesión 13

## B1 · Rediseño de crear-regla — CERRADO Y VERIFICADO (commit `9659689`)

El encargo central. Se toma la **distribución** del Figma (nodo 51:10239) y se
descarta su estética (ni violeta `#635bff`, ni Outfit, ni gradiente).

- Página sobre `--sc-bg-default`, secciones como **tarjetas** (`--sc-radius-xl` =
  12px exacto, padding `--sc-spacing-2-25` = 31,5px, gap `1-75` = 24,5px).
- El índice se integra en el título («01. Información básica»); mueren los
  eyebrows flotantes.
- **Acciones a la TopBar** (`setActions`) y el dock inferior desaparece.
- **Aside de impacto en su PROPIA columna de grid** (360px, el spec del Figma).
  El solape a anchos medios queda arreglado *de raíz*: un grid no superpone sus
  pistas. Medido a 739px: sin solape, sin scroll horizontal.
- «Se cumple si» pasa a caja **tintada** dentro de la tarjeta 01
  (`--sc-bg-info-subtle`, que sí voltea en oscuro).
- Conector Y/O como píldora de acento entre filos; «añadir condición» como
  text-button. El grupo de condiciones deja de ser tarjeta-sobre-tarjeta.
- Sección IA con filas descriptivas. **No** se adoptan sus toggles por-feature:
  el modelo tiene UN flag y serían mentira.

Gates: `e2e:supervisor` 14/14 · `verify` entero (26 gates) · AOT · capturas a
1440 / 739 / oscuro (contrastes medidos: chip 15,9:1, héroe 5,36:1).

## B5 (parcial) · `scope_lead`/`scope_all` a los 4 locales (commit `1afe5cc`)

## Extra · `filled` del DS arreglado en oscuro (commit `912e718`)

Los 5 componentes con variante rellena (`inputtext`, `select`, `multiselect`,
`checkbox`, `search`) hardcodeaban `--sc-color-slate-50`/`-100`. Las primitivas
no voltean → input casi blanco sobre superficie oscura, **contradiciendo al
propio preset**, que ya declaraba `filledBackground: var(--sc-bg-default)`.
Pasados a roles semánticos (el patrón de la casa: ningún componente usa
overrides `.sc-dark`; el oscuro se resuelve en `07-dark.css`).

**En claro es un no-op EXACTO**, medido: `--sc-bg-default` ES `#f7f8fa` y
`--sc-bg-hover` ES `#eceff3`. Solo cambia oscuro (`#0b0f14`, 18:1 de contraste).
Riesgo de CI descartado leyendo los specs: `components.spec.ts` no ejercita
oscuro ni `filled`. Con esto, la fila de condición recupera el input suave del
Figma.

---

# Bloques abiertos (con su precondición YA verificada)

## B3 · tokens-sync — **NO HAY NADA QUE ARREGLAR EN CÓDIGO**

El diagnóstico heredado («el export manda `info` como sky de Tailwind
`#0369a1`») es **materialmente falso**. Comprobado hoy:

- La rampa `sky` DENTRO del export es la de marca (`sky.500 = #1464fe`,
  `600 = #0d4fd4`, `700 = #0a3ba0`), idéntica a `--sc-color-sky-*`. Igual en
  `main` y en la rama `design-tokens-sync`.
- La causa real del run rojo del 30-jun (leída del log) eran **2 tokens de
  componente en dark**: `message.info.border.color` y `toast.info.border.color`
  = `#0369a15c`, hex literal sin primitiva.
- **Hoy: 0 ocurrencias de `#0369a1` en el export**, y el test que lo cazaba
  (`scripts/__tests__/cmp-color-map.test.mjs`) pasa **8/8**.

El rojo de GitHub está **congelado** desde hace 18 días porque el plugin no ha
vuelto a empujar. **Único paso pendiente, y NO lo puede dar un agente**: Rafa
re-exporta desde el Theme Designer para que el workflow corra y quede verde.

## B2 · `sc-field-wrapper` — BLOQUEADO POR FALTA DE RED

Precondición verificada: la duplicación **es genuina y verbatim** en 5
componentes. Guards reales: `inputtext`/`select`/`multiselect` → `!iftaLabel()`;
`datepicker` → `!inline()`; `inputnumber` → ninguno.

**Bloqueante**: el repo **no tiene ni un test de componente Angular** (0
`TestBed`). `test:unit` solo cubre `scripts/__tests__/*.mjs`. La única red visual
es `e2e/components.spec.ts` + snapshots, poco fiable en macOS y cuyo runner pisa
`public/usage/*.png`. Refactorizar 5 componentes núcleo del DS sin red, y sin
beneficio visible para el usuario, es mal negocio.

**Recomendación**: montar primero la red (tests de componente, o un arnés de diff
de `outerHTML` por componente) — exactamente lo que se hizo en s12 con la red e2e
*antes* del refactor transversal (LEARNINGS #16). Contrato externo a preservar:
`e2e/supervisor/category-modal.spec.ts:52` usa `.sc-inputtext__msg--error`.

## B5 · i18n del constructor — NO ES MECÁNICO (el plan lo subestimaba)

`conditionToDesc()` en `condition.types.ts` **compone gramática española**:

```ts
const link = cond.operator === 'is' ? ' o ' : ' ni ';   // concordancia negativa
`miembro de ${labelFor(r)}` · 'mayor que' · `entre ${a} y ${b}`
```

Ese ` ni ` no tiene equivalente 1:1 en fr/pt. Clave-a-clave rompe las frases en
los otros tres idiomas → hace falta **ICU MessageFormat o un compositor por
locale**, que es diseño, no sustitución.

Lo mecánico y seguro sí está acotado (~28 claves): 7 labels + 7 nouns + 5
placeholders de campo, 5 operadores, 2 direcciones, 2 unidades de duración, via
`labelKey` + `t()` con `LanguageService.lang()` como señal reactiva.

## B4 · Tablas → `sc-datatable` — SIN EMPEZAR

Mismo problema de red que B2 (toca el DS: `rowStyleClass` + output `rowClick`).
Sonda de teclado con `page.keyboard` de Playwright, no con el navegador (entrega
teclas vacías).

---

# Decisiones que necesitan a Rafa

1. **Incoherencia en la capa semántica**: `--sc-bg-info` → sky, pero
   `--sc-text-info` → `--sc-text-accent` → **cyan-600**. Fondo sky con texto cyan.
2. **Fondo del listado vs el constructor**: el constructor va sobre
   `--sc-bg-default` y las páginas-lista sobre `--sc-bg-surface` (blanco). No lo
   toqué: el listado está deliberadamente alineado con las AED list-pages (S41) y
   s12 dejó **las tres hermanas idénticas**; cambiar solo reglas rompería esa
   simetría. Alternativas: (a) dejar la distinción editor-vs-lista, que es un
   patrón legítimo; (b) pasada sobre las tres.

---

# TRAMPAS (verificadas)

- **HMR deja `TemplateRef` rancios**: tras editar, los nodos proyectados a la
  TopBar conservaban el `_ngcontent` del componente VIEJO y medían estilos
  falsos. Ante una medición rara, **recarga dura antes de acusar al CSS**.
- **Un nodo proyectado fuera del host no admite override de tema desde el SCSS
  del componente**: `:host-context()` exige un `[_nghost]` ancestro (no lo hay) y
  `.sc-dark .x` compila con `[_ngcontent]` pegado TAMBIÉN a `.sc-dark`, que vive
  en `<html>`. Solución: usar un rol que ya voltee, no una primitiva + override.
- **La fuente de iconos pesa 3,9 MB**: si capturas antes de que cargue salen las
  ligaduras como TEXTO (`leaderboard`, `add`) y descuadran el layout. Espera
  `document.fonts.load(...)` antes de cualquier captura.
- **Al sondear una URL de `@font-face`, resuélvela contra la HOJA DE ESTILOS**,
  no contra `location.href`: resolví mal y me inventé un 404 que no existía.
- **El dev server sirve el DS COMPILADO**: tocar `projects/ui-smartcontact*/src`
  no se ve hasta `build:icons`/`build:components` + reiniciar.
- **`export-clean` se salta con `CI=1`**.
- **`git ls-files` incluye borrados sin stagear** → `token-guard` peta con ENOENT.
- **Sin backticks en mensajes de commit** por shell; usa `-F -` con heredoc.
- **Nada de `page.reload()`** en journeys de memory (stores en RAM).
- **`npm run e2e` clobbea `public/usage/*.png`**: para capturar, script aislado
  fuera del repo (ver `scratchpad/shots.mjs` de s13).

# Aparcado con razón (sin cambios desde s12)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro. |
| `line-height` sin unidad (~55) | Sin token destino en el Kit. |
| Superficies dark · `--sc-text-subtle` 2.04:1 | Decisiones de marca. |
| 145 claves i18n huérfanas | Barrido aparte; `i18n:check` no las caza. |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda. |
| Recaptura de la galería de uso de reglas | `usage:check` pasa; es pulido. |
