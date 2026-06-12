# Token Inspector Skill

## 🧠 Descripción

La **Token Inspector** es la skill encargada de analizar los design tokens reales del proyecto y preparar su uso para los componentes del sistema de diseño SmartContact UI.

Su función principal es asegurar que **todo el styling se basa exclusivamente en tokens existentes**, evitando valores hardcodeados o inconsistencias.

Es una skill previa obligatoria antes de generar cualquier componente.

---

## 🎯 Qué hace esta skill

Esta skill:

1. Inspecciona los tokens reales del proyecto
2. Analiza componentes existentes (`sc-button`, `sc-toggleswitch`, `sc-inputtext`, cuando estén portados)
3. Identifica los tokens adecuados para:
   - colores
   - tipografía
   - spacing
   - radius
   - estados
4. Devuelve un mapeo estructurado listo para usar en SCSS

---

## 📁 Fuentes de tokens

Siempre trabaja sobre las capas:

```
projects/design-tokens/src/lib/styles/tokens/layers/
```

Archivos:
- `01-primitive.css` — primitivos: escala `--sc-scale-*` (14-base), alias `--sc-spacing-*`, `--sc-font-size-*`, `--sc-line-height-*`, `--sc-radius-*`, familias de color
- `02-semantic.css` — semánticos (`--sc-text-*`, `--sc-bg-*`, `--sc-border-*`)
- `03-palette.css` — paletas de dominio
- `04-component.css` — tokens por componente
- `05-extensions.css` — extensiones
- `07-dark.css` — modo oscuro (selector `.sc-dark`)

La capa 6 es el preset PrimeNG (TypeScript):
```
projects/ui-smartcontact/src/lib/theme/sc-preset/
```

---

## 🧩 Cómo funciona

### 1. Analiza referencias

Primero revisa (si ya están portados):
- sc-button
- sc-toggleswitch
- sc-inputtext

Si aún no existen, deriva los patrones de `AGENTS.md`, las capas de tokens y el preset.

Esto define:
- cómo se usan los tokens
- naming real
- patrones existentes

---

### 2. Identifica tokens

Busca tokens para:

- background
- text
- border
- icon
- spacing
- typography
- radius
- states (hover, active, disabled, focus)

---

### 3. Aplica estrategia

Orden de prioridad:

1. Tokens de componente (capa 4)
2. Tokens semánticos (capa 2)
3. Tokens base / primitivos (capa 1, vía alias semánticos)

---

## 📤 Output esperado

Devuelve un mapping como:

```
background (default): --sc-bg-primary
background (hover): --sc-bg-primary-hover
text (default): --sc-text-on-primary
padding: --sc-spacing-1
font-size: --sc-font-size-200
```

Esto debe poder usarse directamente en SCSS con `var(--sc-*)`, sin aritmética manual.

---

## ⚠️ Reglas importantes

- Nunca inventar tokens
- No asumir nombres
- No hardcodear valores
- No mezclar capas sin criterio
- Spacing siempre vía alias `--sc-spacing-*` (escala 14-base, ya en rem)
- `font-size` siempre vía `--sc-font-size-*`
- Nada de `calc(var(--token)/16*1rem)` — los tokens ya están en rem
- `--p-*` solo dentro del preset; la paleta se alinea en `sc-preset/base.ts`
- Seguir siempre el patrón del proyecto

---

## ❌ Qué NO debe hacer

- Crear tokens nuevos
- Usar colores directos (#fff, etc.)
- Reintroducir la escala 8-point (`--sc-space-*`, `--sc-spacing-200`)
- Ignorar componentes existentes
- Inventar estados

---

## 💻 Uso con agentes

Ejemplo:

```
Get tokens for a badge component with success and error variants
```

Resultado esperado:
- listado claro de tokens reales
- preparado para usar en el componente

---

## ✅ Verificación

Tras cualquier cambio de tokens:

```
npm run tokens:parity
npm run tokens:guard
npm run tokens:type-parity
```

---

## 🎯 Objetivo final

Garantizar que todos los componentes del design system:

👉 Usan tokens reales  
👉 Son consistentes  
👉 Son escalables  
👉 No rompen el sistema  

---

## 🚀 Resultado esperado

El resultado debe ser directamente utilizable por la skill `component-generator` sin necesidad de interpretación adicional.
