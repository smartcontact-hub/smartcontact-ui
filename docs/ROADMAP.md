# Smart Contact UI — Roadmap (backlog durable)

> Backlog **durable** de lo diferido-pero-rastreado. Distinto de `NEXT-SESSION.md` (que es el
> hand-off *volátil* y se sobreescribe). Aquí no se pierde nada al cerrar sesión.
> El *por qué* de cada decisión vive en `docs/DECISIONS.md` (DD-N); aquí va el **qué + cuándo
> (disparador) + cómo se valida**. Cada punto se cierra solo cuando su validación pasa.

## En curso

### Round-trip del focus ring → Figma
- **Qué**: el focus ring (electric-blue 2px) ya se escribió en Figma (2026-06-14, ver Figma
  change-log en `guia-tokens.md`). Falta cerrar el round-trip.
- **Disparador**: ahora.
- **Validación**: re-exportar el tema desde el plugin → reemplazar `kit-export-dtcg.json` →
  `npm run tokens:import` + `npm run verify` verde → quitar la fila `['both','focus.ring',…]`
  de la lista DIVERGE en `scripts/token-parity.mjs` (ya no diverge) + actualizar
  `customs-catalog.md` (deja de ser divergencia de marca, está en el Kit).

## Decisiones de marca pendientes (system-wide → review)

### Superficies dark — ¿alinear a zinc o mantener cool?
- **Qué**: nuestra rampa dark es slate/cool (`gray-900 #181d26`); el Kit usa zinc neutro
  (`#18181b`). Diferencia casi imperceptible, pero afecta a TODO el modo oscuro.
- **Disparador**: decisión de Rafa (identidad de marca).
- **Validación**: review visual del modo dark. Si se mantiene → encodar en Figma (con registro)
  y round-trip como el focus ring. Si se alinea → repuntar la capa `07-dark.css` a `zinc-*` y
  quitar la fila de DIVERGE.

### Grises sutiles (ex-"divergencia de campos") — a11y
- **Qué**: `--sc-text-subtle` (gray-400) da **2.04:1** sobre blanco; el Kit (slate-500) da
  **2.95:1**. Es **system-wide** (`--sc-text-subtle` en 22 ficheros, `--sc-border-default` en
  15) → no es un retoque de inputs, es la paleta sutil de todo el DS. Hay tema a11y real donde
  ese token es texto con significado (placeholder/secundario).
- **Disparador**: priorizar a11y.
- **Validación**: auditar contraste WCAG AA por uso (¿es texto significativo o decorativo?),
  decidir oscurecer system-wide (al Kit) vs quirúrgico (token propio de form-field), + review
  visual de los 15-22 ficheros. No es un swap rápido.

## Profundidad del pipeline (gated en necesidad — DD-15)

### Generador de color semántico desde el export (E1)
- **Disparador**: si los diseñadores iteran color a menudo. Hoy el "rojo-flag → humano" + el
  hint copy-paste de `token-parity` cumplen.
- **Validación**: las ~35 filas ENFORCE se generan 1:1 desde el export; DIVERGE sigue a mano
  con guard; `verify` verde.

### Resolver de referencias del preset (E2, la mitad no-redundante)
- **Qué**: chequear que cada `{ref}`/`var(--sc-*)` de `sc-preset/` resuelve (caza refs
  colgantes). Diferido de L7 por riesgo de falsos positivos en el guard core.
- **Disparador**: cuando se haga con cuidado (aparte del maratón).
- **Validación**: corre sobre el preset real sin falsos positivos; se cablea en `verify`.

### Migration Assistant del Theme Designer (cómo subimos PrimeNG)
- **Disparador**: próximo major de PrimeNG.
- **Validación**: **verificar su comportamiento real la 1ª vez** (no asumir): Migration
  Assistant → re-export → `verify` caza el resto → cablear lo nuevo en `sc-preset/`.

## Operador / sesiones aparte
- **Publicar 0.2.0** → `GITHUB_TOKEN=… npm run publish:packages -- --publish` (operador).
- **Migrar `smart-contact-platform`** → `docs/playbook-migracion-platform.md` (sesión aparte).
- **Archivar `smartcontact-ui-main`** → `docs/playbook-archivar-ui-main.md` (sesión aparte).

## Mantenimiento documental (pasada periódica — NO centralizar)

- **Qué**: podar muertos y fusionar solapes — reduce-deuda aplicado a docs. NO es "un doc
  único" (eso es lo MENOS mantenible); es mantener "una fuente por tema" sano.
- **Disparador**: revisión periódica, o cuando el nº de docs crezca notablemente.
- **Candidatos identificados (2026-06-14)**:
  - `DECISIONS-LOG.md` + `DECISIONS-LOG-B.md` = journals de construcción **cerrados** → archivar
    (p.ej. `docs/history/`) en vez de tenerlos en raíz como si fueran vivos.
  - `foundations-rationale.md` + `component-port-plan.md` = ambos racional de construcción →
    evaluar fusión.
- **Validación**: `docs:guard` verde (todo mapeado, links resuelven) + DOCS-INDEX actualizado +
  fronteras siguen sin solapar.
