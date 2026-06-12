# PROMPTS.md

> Colección de prompts optimizados para usar con agentes en Smart Contact UI.
> Todos están alineados con AGENTS.md y las skills del proyecto.

---

## 🧩 1. Crear componentes

### 🔹 Componente básico
```
$component-generator Create sc-badge with variants primary, secondary and danger
```

### 🔹 Wrapper PrimeNG
```
$primeng-wrapper Create sc-inputtext based on PrimeNG InputText with size and disabled support
```

### 🔹 Componente complejo (custom)
```
$component-generator Create sc-section-card with header, body and footer slots.
Use tokens for spacing, radius and typography.
```

---

## 🔄 2. Refactor de componentes

### 🔹 Refactor simple
```
Refactor sc-button to remove duplicated logic and improve token usage
```

### 🔹 Refactor GOLDEN
```
$component-generator Refactor sc-button to be the golden reference of the system.
- remove any dependency on demo styles
- use only real tokens
- unify API (variant, size, states)
- preserve PrimeNG behavior
- update docs
```

### 🔹 Alinear componentes
```
Refactor all button-related components to share the same API and token strategy
```

---

## 🎨 3. Tokens

### 🔹 Inspeccionar tokens
```
$token-inspector Get tokens for button including states and sizes
```

### 🔹 Migrar tokens
```
Replace deprecated tokens with new ones across ui-smartcontact
```

### 🔹 Actualizar tokens desde el Kit
```
Update projects/design-tokens/scripts/kit-export-dtcg.json with the new Kit export,
run npm run tokens:import to regenerate the @sc-gen zones of 01-primitive.css,
and verify with npm run tokens:parity
```

---

## 📄 4. Documentación

### 🔹 Crear docs
```
$docs-generator Create docs for sc-alert component
```

### 🔹 Refactor docs
```
Update sc-button docs to match current API and remove outdated examples
```

### 🔹 Auditoría docs
```
Audit all docs pages and ensure they match real component APIs
```

---

## 🔗 5. Workspace

### 🔹 Sincronizar
```
$workspace-sync Sync workspace after creating sc-badge
```

---

## 🧪 6. Casos avanzados

### 🔹 Crear componente completo
```
Create sc-alert component with variants success and error.
Then generate docs, sync workspace and run npm run verify.
```

### 🔹 Refactor global
```
Refactor entire component library to ensure all components use tokens correctly
```

### 🔹 Debug estilos
```
sc-button styles are broken.
Inspect tokens, fix SCSS and update docs
```

### 🔹 Verificación completa
```
Run npm run verify and fix every parity, guard, scale or lint finding
```

---

## 🎯 Consejo PRO

> Usa prompts específicos, con contexto y restricciones.
> Evita prompts vagos.

---

## 🚀 Resultado esperado

Cada prompt debe generar:
- código consistente
- tokens correctos
- docs alineadas
- integración completa
- `npm run verify` en verde
