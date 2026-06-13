<!-- Rationale de las fundaciones del repo (Mitad A): objetivo, decisiones cerradas, arquitectura y estándares. El detalle de decisiones de la construcción está en DECISIONS-LOG.md (raíz). -->

# Rationale de las fundaciones — Smart Contact Design System

> Este documento explica **por qué** las fundaciones del repo son como son: el objetivo del repo, las decisiones cerradas antes de construir, la arquitectura objetivo y los estándares de verificación y documentación. El plan de port de componentes (Mitad B) vive en `component-port-plan.md`; el catálogo y los solapes en `convergence-manifesto.md`; cada decisión concreta tomada durante la construcción, con su base verificada, en **`DECISIONS-LOG.md`** (raíz del repo).

---

## 1. Objetivo

Este repositorio es el **Design System empaquetado y publicable** de Smart Contact: la referencia completa y **autosuficiente** del DS — tokens + preset + componentes + tooling de verificación + documentación — en una estructura de paquetes versionados.

El norte operativo: **lo que se diseña en Figma se refleja directamente en el código, y cada valor es trazable a la fuente y verificable por máquina.** Cuando un valor se cuestione, la respuesta es el check verde + el diff 1:1 con Figma, no una discusión.

- **Es** la fuente única del DS, consumible como paquetes npm versionados.
- **No es** un monorepo de aplicaciones: las apps consumidoras (supervisor, doc-site) consumen los paquetes; no viven dentro.

La construcción se hizo en dos mitades: **Mitad A — fundaciones** (esqueleto, escala, tokens, preset, setup, tooling, documentación; completada y descrita aquí) y **Mitad B — port incremental de componentes** (mapeada en `component-port-plan.md`).

---

## 2. Decisiones cerradas

Decisiones tomadas antes de construir las fundaciones; no se re-litigan.

| Tema | Decisión | Racional |
|---|---|---|
| **Escala** | `rem` centralizado: diseño en 14-base → conversión a rem en un punto único. | Coherente con DD-13 (tipografía ya en rem). Mejor para zoom/accesibilidad (`rem` respeta el ajuste de fuente del usuario; `px` no). El catálogo de desarrollo aportó la implementación de referencia (`rem-scale.ts`). |
| **Tooling de tokens** | Un **único generador DTCG-aware** que funde el import DTCG del catálogo de desarrollo (`convert-tokens.js`) con la ley de escala del catálogo de diseño (`tokens:gen`). | El Theme Designer exporta DTCG; el generador lo lee nativo. Un solo punto de transformación Figma→CSS evita doble fuente y drift. |
| **Repositorio** | Repo nuevo en GitHub, con la **estructura y el naming de paquetes** del catálogo de desarrollo (`@smartcontact-hub/styles · icons · components`). | El repo es primordialmente de diseño. Hablar el mismo idioma de empaquetado lo hace consultable como referencia por todo el equipo. |
| **Alcance del repo** | **Solo el DS** (3 paquetes + demo). | Las apps consumen los paquetes versionados; no se mudan. |
| **Orden de construcción** | Fundaciones completas primero (Mitad A); port de componentes después, incremental (Mitad B). | El port exige verificación visual por pantalla → es incremental por naturaleza. La escala bloquea el preset, el preset bloquea el setup. |
| **Documentación** | Documentación de ambos orígenes, adaptada a las convenciones unificadas. Registro **colaborativo y profesional**. | El repo es consultable por todo el equipo. La gobernanza vive en los guardarraíles, no en el lenguaje. |
| **Verificación** | Guardarraíles automáticos como **gate de CI**. | Cada valor trazable a Figma, comprobado por máquina. Es el estándar de calidad del repo. |
| **Consumo** | `sc-demo` (dentro del repo) = doc-site de referencia (un deploy). El supervisor consume los paquetes (el otro deploy). | El supervisor "bebe" del DS empaquetado y el doc-site habla el mismo idioma visual que los paquetes. |

---

## 3. Arquitectura objetivo

**Molde de empaquetado del catálogo de desarrollo + contenido y tooling del catálogo de diseño.**

- **3 paquetes ng-packagr publicables + demo:**
  - `@smartcontact-hub/styles` (`projects/design-tokens/`) ← las 7 capas de tokens 14-base→rem (`src/lib/styles/tokens/layers/01-primitive…07-dark.css`) + reset/globals.
  - `@smartcontact-hub/icons` (`projects/ui-smartcontact-icons/`) ← paquete de iconos (Material Symbols) al que migra el `sc-icon` del catálogo de diseño.
  - `@smartcontact-hub/components` (`projects/ui-smartcontact/`) ← wrappers `sc-*` + **preset modular** (`src/lib/theme/sc-preset/`) + `provideSmartContactUi`.
  - `sc-demo` (privado, `projects/sc-demo/`) ← doc-site / app consumidora de referencia.
- **Preset modular** (un módulo por componente) con **cada slot apuntando a `var(--sc-*)`**; `base.ts` sin color hardcodeado. Conversión a rem por el mecanismo central adoptado.
- **`provideSmartContactUi()`** como frontera única de setup, con `darkModeSelector` por defecto a `.sc-dark`.
- **Tooling de verificación fundido**: el generador único DTCG-aware + `parity` + `guard` + el auditor de escala, conectados como gate.
- **Fuente de verdad de valores**: el export DTCG del Kit, versionado en `projects/design-tokens/scripts/kit-export-dtcg.json` (referencias estilo Figma con slash, p. ej. `{color/gray/800}`; 14-base, valores redondos). Se regenera desde el Theme Designer; nunca se edita a mano.

---

## 4. Guardarraíles (estándar de calidad del repo)

Gate de CI, dos streams + transversal:

- **Stream tokens/Figma**: el generador único (DTCG→CSS) + `tokens:parity` (cruza el export del Kit contra `--sc-*` + preset) + `tokens:guard`.
- **Stream preset/PrimeNG**: el auditor de escala (`audit:theme-scale`) — cero `px` en el preset, sin `css:` por-componente, sin hackear `html{font-size}`.
- **Transversal**: `lint`, `tsc --noEmit`, `e2e` (smoke).

Norte operativo: **lo que viene de Figma se ve tal cual, y cada actualización del Figma se refleja sin pérdida.** Los guardarraíles convierten "nunca inventar tokens" de norma escrita a norma verificada: nada se da por bueno hasta que parity + auditor de escala + `tsc` + build de los 3 paquetes estén en verde.

---

## 5. Estándar de la documentación

Registro **profesional y colaborativo**. La documentación describe **qué** hace cada cosa y **por qué**, con la gobernanza expresada como estándar de calidad ("cada token trazable a Figma, verificado en CI"). Sin nombres de personas ni de librerías externas ajenas al stack (PrimeNG y Figma sí se nombran: son el stack). El repo es una referencia consultable; se redacta como tal.

---

## 6. Dónde está el detalle

- **Cada decisión de la construcción de fundaciones** (qué se eligió, por qué, qué se verificó): `DECISIONS-LOG.md` en la raíz del repo.
- **Catálogo unión, solapes, huecos y empaquetado**: `docs/convergence-manifesto.md`.
- **Plan de port de componentes (Mitad B)**: `docs/component-port-plan.md`.
