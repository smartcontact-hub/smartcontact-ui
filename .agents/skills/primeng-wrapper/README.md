# PrimeNG Wrapper Skill

## 🧠 Descripción

La **PrimeNG Wrapper** es la skill encargada de crear componentes del design system SmartContact UI basados en componentes existentes de PrimeNG.

Su objetivo es reutilizar la lógica y accesibilidad de PrimeNG, añadiendo:
- una API coherente con SmartContact
- estilos basados en tokens
- naming consistente (`sc-*`)

---

## 🎯 Qué hace esta skill

Esta skill:

1. Analiza componentes existentes (`sc-button`, `sc-toggleswitch`, `sc-inputtext`)
2. Selecciona el componente de PrimeNG adecuado
3. Crea un wrapper standalone
4. Mapea inputs/outputs
5. Aplica estilos con tokens
6. Integra el componente en la librería

---

## 🧩 Cuándo usarla

Usar esta skill cuando:

- el componente ya existe en PrimeNG
- solo necesitas adaptar estilo y API
- no necesitas lógica compleja

Ejemplos:
- botones
- inputs
- controles simples

---

## ❌ Cuándo NO usarla

No usar esta skill si:

- el componente es complejo o compuesto
- requiere layout personalizado
- PrimeNG no cubre el comportamiento

En esos casos → usar componente custom

---

## ⚙️ Reglas clave

### Naming DD-12
El selector del wrapper es `sc-` + nombre PrimeNG PEGADO (`sc-inputtext`,
`sc-toggleswitch`, `sc-radiobutton`). El kebab queda reservado a los
componentes custom sin equivalente PrimeNG. Las clases BEM internas sí usan
kebab (`sc-button--primary`).

### Escala
Las medidas se consumen por alias semántico `--sc-spacing-*` (14-base v/14,
ya en rem) — sin `calc(...)` ni px a pelo. `font-size` siempre por token
`--sc-font-size-*`.


### No reimplementar lógica
PrimeNG gestiona:
- interacción
- accesibilidad
- eventos

👉 No duplicar lógica

---

### Mantener comportamiento
No romper:
- focus
- navegación por teclado
- atributos ARIA

---

### API consistente

Ejemplo:

```
variant → estilo visual
size → tamaño
loading → estado
clicked → output
```

---

### Estilos con tokens

- usar CSS variables reales
- no hardcodear valores
- seguir patrones existentes

---

### Clases

```
sc-button
sc-button--primary
sc-button--md
```

---

## 🔄 Integración

La skill debe:

- exportar el componente
- usar módulos de PrimeNG
- mantener coherencia con el repo
- opcionalmente añadir demo

---

## 💻 Uso con el agente

Ejemplo:

```
Create a sc-inputtext component based on PrimeNG InputText
```

Resultado:
- wrapper funcional
- API consistente
- estilos con tokens

---

## 🎯 Objetivo final

Conseguir componentes:

👉 consistentes  
👉 reutilizables  
👉 accesibles  
👉 alineados con el design system  

---

## 🚀 Resultado esperado

El componente generado debe parecer parte nativa de SmartContact UI, no un wrapper improvisado.
