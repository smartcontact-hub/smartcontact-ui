# Component Generator Skill

## 🧠 Descripción

El **Component Generator** es la skill principal del sistema de agentes de SmartContact UI.

Su objetivo es generar automáticamente componentes Angular (standalone) completamente funcionales, siguiendo los estándares del design system:

- Angular 21
- Uso estricto de design tokens (CSS variables `--sc-*`)
- Naming consistente (DD-12: wrappers `sc-` + nombre PrimeNG pegado; custom en kebab descriptivo)
- Arquitectura escalable
- Documentación integrada en `sc-demo`

Esta skill está diseñada para ser utilizada con agentes de código, permitiendo transformar un prompt en un componente listo para producción.

---

## 🎯 Qué hace esta skill

A partir de una descripción del componente, la skill:

1. Analiza referencias existentes (las que ya estén portadas):
   - `sc-button`
   - `sc-toggleswitch`
   - `sc-inputtext`
   - `sc-dynamic-dialog`

   Si aún no existen, deriva los patrones de `AGENTS.md`, las capas de tokens y el preset.

2. Inspecciona los tokens disponibles

3. Decide el tipo de componente:
   - Custom
   - Wrapper de PrimeNG

4. Genera:
   - Componente Angular completo (TS + HTML + SCSS)
   - Uso correcto de tokens
   - Inputs / Outputs tipados
   - Clases dinámicas consistentes

5. Integra el componente en el proyecto:
   - Export en `public-api.ts`
   - Página de documentación en `sc-demo`
   - Navegación (si aplica)

6. Verifica con `npm run verify`

---

## 🧩 Qué genera exactamente

Dependiendo del caso, la salida incluye:

- `<component>.component.ts`
- `<component>.component.html`
- `<component>.component.scss`
- Export en la librería (`public-api.ts`)
- Página de documentación en la app demo
- Ejemplos de uso
- Sección de API (inputs / outputs)

---

## ⚙️ Reglas clave

### ❗ Uso de tokens

- Nunca se inventan tokens
- Solo se usan tokens reales de las capas:
  ```
  projects/design-tokens/src/lib/styles/tokens/layers/
  ```
- Los tokens métricos ya están en rem (escala 14-base v/14). Se consumen
  directos, sin aritmética:
  ```scss
  padding: var(--sc-spacing-1);       /* 14px de diseño */
  font-size: var(--sc-font-size-200); /* 14 */
  ```
- Prohibido `calc(var(--token)/16*1rem)` y la escala 8-point retirada
  (`--sc-space-*`, `--sc-spacing-200`)

---

### 🎨 Estilos

- Sin valores hardcodeados
- Sin estilos inline
- Uso de clases con prefijo `sc-`
- Convención tipo BEM para variantes y estados
- `--p-*` solo dentro del preset; los componentes consumen `--sc-*`

---

### 🧱 Arquitectura Angular

- Componentes standalone
- Inputs tipados
- Outputs con EventEmitter
- Lógica mínima en template
- Clases calculadas en TS cuando sea necesario

---

### 🔁 Reutilización

Siempre se prioriza:

- Reutilizar patrones existentes
- Mantener coherencia con `sc-button`
- Evitar crear nuevas abstracciones innecesarias

---

## 🔀 Decisión: Custom vs PrimeNG

### Usar wrapper de PrimeNG si:

- El comportamiento ya existe en PrimeNG
- Es un componente tipo:
  - botón
  - input
  - control interactivo estándar

👉 Ejemplo: `sc-button`, `sc-inputtext`, `sc-toggleswitch`

(Selector = `sc-` + nombre PrimeNG pegado, sin guion.)

---

### Usar componente custom si:

- Es específico del design system
- Es un componente compuesto
- Tiene layout propio

👉 Ejemplo (kebab descriptivo):
- `sc-section-card`
- `sc-empty-state`
- `sc-alert`

---

## 📋 Checklist automático

Antes de dar por válido un componente, la skill debe asegurar:

- ✅ Selector según DD-12 (wrapper pegado / custom kebab)
- ✅ Tokens reales usados correctamente (`--sc-spacing-*`, `--sc-font-size-*`…)
- ✅ Sin colores hardcodeados ni conversiones `calc(...)`
- ✅ Estados (`disabled`, `loading`, etc.) bien implementados
- ✅ Exportado en `public-api.ts`
- ✅ Documentación generada
- ✅ Consistencia con las referencias portadas (`sc-button`, `sc-toggleswitch`, `sc-inputtext`, `sc-dynamic-dialog`)
- ✅ `npm run verify` en verde

---

## 📄 Documentación generada

Si el componente se documenta, debe incluir:

- Variants
- Sizes
- States (IMPORTANTE)
- Ejemplos de uso
- Código (usage)
- API (inputs / outputs)
- Layout tipo cards (estilo design system)

---

## 💻 Uso con agentes (VS Code)

Flujo típico:

1. Abres el proyecto en VS Code
2. Escribes un prompt como:

```
Create a new sc-badge component with variants success, warning and error
```

3. El agente ejecuta:

- análisis de tokens
- generación de componente
- generación de docs
- integración en el workspace
- verificación (`npm run verify`)

---

## 🧪 Ejemplos de uso

### Ejemplo 1

```
Create a new sc-badge component with variants neutral, success and danger
```

---

### Ejemplo 2

```
Generate a sc-inputtext component as a PrimeNG wrapper
```

---

### Ejemplo 3

```
Create a sc-alert component with title, description and dismiss button
```

---

## 🎯 Objetivo final

Que cualquier prompt genere:

👉 Un componente completo  
👉 Documentado  
👉 Consistente  
👉 Listo para producción  

Sin intervención manual.

---

## 🚀 Resultado esperado

El código generado debe parecer escrito por el equipo de SmartContact UI, no por un generador automático.
