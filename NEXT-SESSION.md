# NEXT-SESSION — hand-off

> Estado volátil. Se SOBREESCRIBE en cada cierre. Lo durable vive en `docs/`.
> **Sello: 2026-08-07, sesión 24 (validación de componentes web↔Figma para Carlos/Marta — Figma-QA, SIN cambios de código de producto).**

## ▶️ EMPIEZA AQUÍ

1. Lee este fichero y luego [`LEARNINGS.md`](LEARNINGS.md) (afilada la regla 17, corolario s24: un estado que firmas en un entregable, o lo mides tú o lo etiquetas "según X").
2. **El bloqueo de escritura a GitHub de s23 está RESUELTO** — el parche s23 aterrizó como PRs #18 y #19. La rama trackea origin y el push funciona; confirma el CI del último commit si vas a pushear.
3. **El puente Figma va en los dos sentidos** (file `khNq9dJKNi13pNllrqm6dx`). Antes de `use_figma`, carga el skill `figma-use`. Gotcha nuevo: un auto-layout de alto FIJO recorta hijos añadidos en silencio → memoria `figma-autolayout-fixed-height-clips`.

---

## HECHO en la sesión 24 — validación de componentes (Figma-QA, sin código)

Encargo de Carlos/Marta (Jira **SISMAC-4074**): validar Select, MultiSelect y Avatar contra Figma y dar estado del resto de los 19 del menú de `ui.smart-contact.com`.

**Entregable en Figma** — página **`Feedback`** (nueva), sección **`14015-179`** (file `khNq9dJKNi13pNllrqm6dx`). Dentro: tabla de estado de los 19 con fuente citada + tarjetas comparativas de los 3. PNGs (completo, Avatar suelto, Select suelto) y comentario de Jira entregados a Rafa en chat.

Estado de los 19: **11 OK · 2 Casi (Chip/Toast) · 3 Por validar (Context Menu, Table, Breadcrumb) · 3 con hallazgos (Select, MultiSelect, Avatar) · 0 pendientes.**

**Hallazgo clave (sistémico):** Select, MultiSelect, Chip y Toast fallan por lo MISMO — los estilos de texto de Figma no están tokenizados como `--sc-*`, así que el navegador aplica sus defaults. Se manifiesta distinto: Select/MultiSelect = tamaño de fuente (opciones a 16 en vez de 14); Chip/Toast = line-height (Chip 35 vs 31, Toast 72 vs 62 + margen del botón ×). **Un solo arreglo (tokenizar los text styles), no cuatro tickets.** Enlaza con el aparcado "line-height sin unidad — sin token destino en el Kit".

### Decisiones abiertas de esta sesión (para Rafa/devs)
- **Select · showClear (X de limpiar)**: la web lo trae, el DS no lo define → añadir variante al DS o apagarlo en la demo.
- **Select · ancho**: Figma instancia a 216 fijos vs web fluido → definir si se fija o se deja fluido.
- **Select · Large**: 41,1 web vs 38,5 Figma (~2,6px) → ajustar o dar por bueno.
- **Avatar · badge**: posición es variante (Supervisor arriba / Agent abajo, no fallo) + falta el aro blanco de 2px. El **color** del badge (marino vs azul) Rafa NO lo quiere asomar aún — no está en la nota, sí en la tabla.

---

## Heredado de s23 — código, NO re-verificado esta sesión

- **B5b · prosa i18n del constructor** — `conditionToDesc()` compone gramática española; necesita ICU MessageFormat o compositor por locale. Lo mecánico (~28 claves) ya está. **NECESITA DISEÑO.**
- **`sc-page-header` sin consumidores** en la app (solo su demo). Retirarlo o no es decisión de Rafa.
- **Las 5 `<table>` a mano NO migran** — cada una con su razón en [`docs/receta-migracion-tablas.md`](docs/receta-migracion-tablas.md).
- **Code Connect**: publicar requiere plan Figma Org/Enterprise + `FIGMA_ACCESS_TOKEN` + `Show Icon` en el master de `card`. Ver `docs/code-connect.md`.
- **Archivar a `docs/history/`** los 4 docs de construcción cerrados (convergence-manifesto, component-port-plan, foundations-rationale, plan-convergencia-flujos): `git mv` + arreglar ~6 links. Ningún gate lo checa.

---

## ▶︎ RAMA SÓLO SI HAY ALGO QUE MIRAR

Cloudflare da preview por rama: `sc-supervisor.pages.dev`, `sc-demo.pages.dev`.

| | |
|---|---|
| **Rama** | El cambio se VE (pantallas, color, tipografía, un flujo). Rafa abre el enlace, compara con prod, decide. |
| **Directo a `main`** | El cambio NO se ve (tokens sin efecto visual, scripts, guardianes, tests, docs). Lo cubren los gates. |

Para un operador que trabaja solo, la única razón de rama es el enlace para mirar. Si no hay nada que mirar, no hay razón.

---

## Aparcado con razón (sin cambios)

| Item | Por qué |
|---|---|
| Soltar `primeicons` | PrimeNG 21 usa `pi pi-*` 631 veces por dentro |
| `line-height` sin unidad | Sin token destino en el Kit (es la raíz del hallazgo sistémico de arriba) |
| Storybook fases 2/3 (DD-29) | Proyecto propio, no deuda |
| `group-assignment-table`, `agent-channel-table` | Formularios disfrazados de tabla, NO migran |
| Paginación de tablas | Valor ≈ 0 hoy (6-84 filas) |
| Los paquetes `@smartcontact-hub/*` | APARCADOS (DD-17): la app consume el DS in-repo por tsconfig paths |
