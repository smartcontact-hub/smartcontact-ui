# Migration Safety — Smart Contact Design System

> **Filosofía**: el DS minimiza la customización sobre PrimeNG. Styling sí
> (PrimeNG está diseñado para eso), reinventar HTML/lógica NO. Objetivo:
> mantenimiento sostenible + cero sorpresas en upgrades.

Este documento captura las reglas, riesgos y pro tips para que **upgrades de
PrimeNG, re-sync con el Kit de Figma o cambios internos** no rompan el camino
recorrido (tokens en 7 capas, preset modular, catálogo de customs).

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
   lista DIVERGE de `scripts/token-parity.mjs` (verificación en CI).

---

## Arquitectura de aislamiento

```
┌─────────────────────────────────────────────────────────────┐
│  Apps consumidoras (supervisor, doc-site, …)                 │
│  consume → <sc-*> de @smartcontact/components                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  @smartcontact/components                                    │
│  - Wrappers sobre <p-*> + componentes custom                 │
│  - Consume tokens --sc-* (alias --sc-spacing-*, semánticos)  │
│  - theme/sc-preset → puente --p-* ← var(--sc-*)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  @smartcontact/styles                                        │
│  - layers/01-primitive … 07-dark.css → define --sc-*         │
│  - bloques @sc-gen generados del export DTCG del Kit         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PrimeNG 21 (runtime de temas PrimeUIX)                      │
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
  `sc-demo`, que prueba el preset sobre primitivos crudos.)
- **CSS overrides sobre `<p-X>` desde las apps**: esos selectores se rompen
  en cualquier upgrade.

---

## Pro tips

### 1. Antes de crear un componente nuevo
1. ¿PrimeNG ya lo tiene? → wrapper (`<sc-inputtext>` → `<p-inputtext>`).
2. ¿PrimeNG tiene similar con `pTemplate`? → usar el slot.
3. ¿La lógica existe pero quieres otro render? → headless/`[unstyled]`.
4. ¿No lo tiene? → custom, documentado en `customs-catalog.md` con su porqué.

### 2. Aprovecha `pTemplate`
PrimeNG expone slots de templating en casi todo. Los wrappers de campo
(`<sc-select>`, `<sc-multiselect>`, `<sc-datepicker>`) re-proyectan estos
templates. Para `options: string[]` los wrappers soportan opciones
primitivas (resolución automática de `optionLabel`/`optionValue`) — no
fuerces una clave `label` en opciones string.

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

### 6. CVA wrappers con signals: `untracked()` SIN side-effects

```typescript
// ✅ BIEN — solo el signal CVA:
writeValue(v: string | null | undefined): void {
  untracked(() => this.value.set(v ?? ''));
  // Side-effects (si los hubiera) van FUERA, sin untracked.
}
```

El bloque `untracked` escribe SOLO el signal de valor del CVA; side-effects
dentro quedarían silenciados para los effects que los observan.

### 7. Refactor de wrappers: audit de CSS overrides en consumidores
Si un refactor cambia el DOM interno de un wrapper, los consumidores pueden
tener selectores apuntando al DOM antiguo que se rompen en silencio (AOT no
valida CSS). Post-refactor: grep de selectores del patrón viejo + diff visual
o revisión manual.

---

## Riesgos vivos

- **Bajo**: drift Figma ↔ código fuera de los streams vigilados → mitigado
  por parity en CI + auditorías periódicas. Patches de PrimeNG (21.x → 21.y)
  → el preset protege.
- **Medio**: major de PrimeNG (21 → 22) → audit de `--p-*` + APIs envueltas +
  diff visual. Kit de Figma major → merge manual con decisión por entry.
- **Alto (no debería pasar con las reglas)**: consumidor tocando `--p-*` o
  `<p-X>` directo · customs sin entry en el catalog. El guard y la revisión
  de código lo previenen.

---

## Referencias cruzadas

- [`customs-catalog.md`](customs-catalog.md) — divergencias documentadas + checklist anti-divergencia.
- [`DECISIONS.md`](DECISIONS.md) — decisiones DD-* (DD-11 mecanismo tipográfico · DD-13 escala tipográfica).
- [`../projects/design-tokens/README.md`](../projects/design-tokens/README.md) — tooling de tokens.
- [`guia-tokens.md`](guia-tokens.md) — guía del sistema de tokens (diseño).
- [`component-port-plan.md`](component-port-plan.md) — plan del port de componentes.
