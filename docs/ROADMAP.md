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

### Round-trip DD-24 (icono↔font-size) → Figma + cabos (2026-06-22)
- **Qué**: DD-24 EJECUTADA en código (DS + app: `sc-icon` gana `inherit`; los companion heredan el font-size
  del texto). Faltan los cabos de Figma + dos revisiones.
- **Por punto (qué · disparador · validación)**:
  - **(4a) Atar W/H de iconos companion a la var de font-size en Figma** (md=`app/font/size`; sm/lg=
    `{cmp}/sm·lg/font`). Huecos: **button-default** (icono raw → `app/font/size`), **inputtext** (el TEXTO raw →
    font-size del input). *Guiado con Rafa, una var a la vez + screenshot.* Bridge vivo (`mcp__figma__*`, WS 9224).
  - **(4b) Sync de los 3 copys de General a los nodos de TEXTO de Figma** (ventana.title, aviso.title →
    "Recepción de conversaciones", alerting_label → "Mostrar"). Grep antes para no crear drift. *Validación*:
    el texto en Figma = el `es.json`.
  - **Validación visual COMPLETA de Bloque 3** (41 pantallas de la app): se validó el chrome (top-bar/sidebar)
    + AOT + verify, pero NO se navegó cada pantalla. *Disparador*: al QA la app. *Riesgo*: un companion migrado
    (13/14→inherit) que descuadre en una pantalla no vista (los controles deliberados ya se revirtieron).
  - **Revisar traducciones EN/FR/PT** de los copys de Recepción (Rafa es nativo ES; las redactó el subagente). Menor.
- **Deuda estructural surfaceada**: el supervisor usa su **PROPIO `<sc-icon>`** (`shared/components/icon`,
  `size: number | 'inherit'`), NO el `ScIconComponent` del DS — **duplicación** de implementación (el DS tiene
  ejes FILL/grade/optical que el wrapper de la app no expone). Ambos ya soportan `inherit` pero divergen. Liga
  con el item "Iconos: estilo + peso" de abajo (Rounded vs Outlined). *Disparador*: al unificar iconografía.

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

### Feedback rápido para diseño "en cristiano" — ✅ HECHO (2026-06-16)
- **Qué**: el plugin rechaza/valida sin decir el porqué (la razón vivía enterrada en el log de CI,
  tras ~5 min de build+e2e+preview). Montado un **carril rápido** (`.github/workflows/tokens-check.yml`
  + `scripts/token-report.mjs` + test) que corre SOLO parity + a11y y postea el veredicto **en
  cristiano** (resumen del run + comentario del PR) en **~1 min**. Sin IA: reglas deterministas sobre
  la salida que los checks YA producen (contraste, color fuera de paleta, drift…). **NO es un gate**
  (el gate sigue siendo `tokens-sync` + `verify`).
- **Siguiente nivel (futuro, gated en necesidad)**:
  - **Plugin-monitor en Figma (tiempo real)** — el sueño: las validaciones DENTRO del plugin según
    editas, sin ir a GitHub. Proyecto propio (el plugin tendría que pollear el run o replicar los
    checks). *Disparador*: si tras el carril rápido, ir a GitHub sigue siendo fricción.
  - **IA: sugerir el color corregido** — cuando un color rompe a11y, proponer el paso de rampa más
    cercano que SÍ cumple. Aquí una heurística/IA sí aporta. *Disparador*: tras el monitor.
  - **Comentario PR "sticky"** (editar en vez de añadir, para no acumular al iterar) + **cachear
    Playwright/npm** en el carril pesado (~1 min menos).

### Resolver de referencias del preset (E2, la mitad no-redundante)
- **Qué**: chequear que cada `{ref}`/`var(--sc-*)` de `sc-preset/` resuelve (caza refs
  colgantes). Diferido de L7 por riesgo de falsos positivos en el guard core.
- **Disparador**: cuando se haga con cuidado (aparte del maratón).
- **Validación**: corre sobre el preset real sin falsos positivos; se cablea en `verify`.

### Migration Assistant del Theme Designer (cómo subimos PrimeNG)
- **Disparador**: próximo major de PrimeNG.
- **Validación**: **verificar su comportamiento real la 1ª vez** (no asumir): Migration
  Assistant → re-export → `verify` caza el resto → cablear lo nuevo en `sc-preset/`.

## Consolidación monorepo (DD-17, 2026-06-15) — ✅ COMPLETADA
> El Supervisor vive en el repo; un cambio de token se refleja en `sc-demo` **y** en la app real.
- **L0** deps · **L1** Supervisor en `projects/supervisor` (consume el DS local, instantáneo) ·
  **L3** ds-docs fundido (`docs/inventory.md` + página Tipografía en sc-demo).
- **L2 · Cloudflare Pages** ✅ — 2 proyectos servidos en raíz, preview por rama automático
  (`NODE_VERSION=22`). Verificado en vivo (raíz + F5 en ruta profunda + i18n):
  **sc-demo** → https://sc-demo.pages.dev · **supervisor** → https://sc-supervisor.pages.dev
- **L4** ✅ — `sc-prototype` jubilado + **GitHub Pages retirado** (los supera Supervisor + Cloudflare);
  `smart-contact-platform` **archivado** (read-only; preserva audits/galerías) + **PR #51 cerrado**.
- **Paquetes APARCADOS** — `scripts/{publish-packages,version-bump}.mjs` + `publishConfig` **intactos**.
  Dormidos en el modelo monorepo-by-path; correr `publish:packages` solo antes de un release externo real.
- **Atribución por persona en Theme Designer (Marta)** — hoy el plugin empuja con UN token (el de Rafa)
  → todo sale como Rafa. Para que un colaborador (Marta) salga con su cara: (1) añadirla como
  colaboradora con permiso de escritura; (2) el plugin debe commitear/empujar con SU identidad (su
  token + su email, registrado en su cuenta GitHub). *Abierto*: que el plugin permita login por persona
  depende del propio plugin (no verificado). *Disparador*: cuando Marta itere tokens a menudo.
- **(Deuda) i18n absoluto del Supervisor** — `app.config.ts` carga `/assets/i18n/` absoluto. Funciona
  servido en RAÍZ (Cloudflare); si algún día va a subpath, pasar a `APP_BASE_HREF`/ruta relativa.

## Operador / sesiones aparte
- ✅ **0.2.0 publicada** (2026-06-14). El pipeline de publish queda **APARCADO** (ver consolidación arriba).
- ~~Migrar `smart-contact-platform`~~ → **SUPERSEDED por la consolidación monorepo (DD-17)**: la app
  vive ahora en este repo; no se migra a paquetes, se consume local.
- **Archivar `smartcontact-ui-main`** (el DS viejo original) → `docs/playbook-archivar-ui-main.md`.

## Mantenimiento documental (pasada periódica — NO centralizar)

- **Qué**: podar muertos y fusionar solapes — reduce-deuda aplicado a docs. NO es "un doc
  único" (eso es lo MENOS mantenible); es mantener "una fuente por tema" sano.
- **Disparador**: revisión periódica, o cuando el nº de docs crezca notablemente.
- **Candidatos**:
  - ✅ **HECHO (2026-06-14)**: los 2 `DECISIONS-LOG` (journals de construcción cerrados) archivados
    a `docs/history/`; `docs:guard` ahora escanea `docs/` recursivo (vigila también el archivo).
  - ⏳ `foundations-rationale.md` + `component-port-plan.md` = ambos racional de construcción →
    evaluar fusión (pendiente).
- **Validación**: `docs:guard` verde (todo mapeado, links resuelven) + DOCS-INDEX actualizado +
  fronteras siguen sin solapar.

## Gaps del DS surfaceados por consumir-real (migración de smart-contact-platform, 2026-06-14)

El ente evolutivo en acción: la migración de la app real saca a la luz huecos del paquete publicado.

- **Publicar los partials SCSS** — `@smartcontact-hub/styles` solo ships **CSS compilado**; la app
  consume 3 partials vía `@use` (`sc-overlay-sizes`, `sc-animations`, `sc-list-table`) que el
  paquete NO publica → el consumidor tiene que mantenerlos locales. *Fix*: exportar también los
  partials SCSS (o documentar que se quedan locales). *Disparador*: ahora (bloquea el "borrar copia
  local" total).
- **Entrada del paquete `styles`: orquestador-only + `exports` no expone el CSS** — `styles/index.css`
  es un **orquestador** que mete tokens **+ `base/reset.css` + `base/globals.css`** (no hay entrada
  "solo tokens"). Y el `exports` del package.json solo declara `.` (→ el `.mjs`) y `./package.json`
  — **el CSS no tiene entrada nombrada**, se alcanza por ruta de fichero. Esto NO es drift de valores
  (los tokens son idénticos, sigue siendo 1:1 con Figma); es un hueco de **empaquetado**: un consumidor
  que ya tiene su propio reset (p.ej. supervisor) no puede importar tokens-sin-reset de forma limpia.
  *Fix*: shippear una entrada `tokens-only` (las 6 capas sin reset/globals) **y** cablear el `exports`
  para exponer el CSS con nombre (`.` o `./tokens`). *Disparador*: lo pide la migración de la app;
  hoy se resuelve con ruta directa en `angular.json styles[]`. *Validación*: el consumidor importa
  tokens-only por nombre sin arrastrar el reset del DS; `verify` verde.
- **Iconos: estilo + peso (Material Symbols) = decisión de diseño deliberada** — `@smartcontact-hub/icons`
  usa **Rounded**; la app usa **Outlined**. Y el **peso** del icono debe ir a la par con el peso de la
  tipografía (principio registrado en `.impeccable.md` → *Iconografía*). Hay que elegir los ejes de
  Material Symbols (style · weight · fill · optical size) por **lo que case con la UI de SC**, no al
  azar. Migrar = cambia el aspecto de ~217 iconos. *Validación*: la suite visual-regression de la app
  (14 baselines) lo caza. *Disparador*: decisión de diseño antes de migrar iconos.
- (Menor) **Drift de tokens local↔publicado**: caracterizado por la migración como **convergencia
  intencional** (rampa zinc aditiva + px→rem que resuelve idéntico a root 16px + refactor de refs),
  no regresión. Confirmado visual/numéricamente idéntico → swap de fundación = bajo riesgo.
- **Tamaños que faltan en el publicado: `sc-avatar` (px) y `sc-tag` (`xs`)** — la app usa avatares en
  px concretos y un tag `xs` que el paquete publicado no expone (usa buckets de tamaño / no tiene xs).
  *Decisión DS (no de la migración)*: ¿son **necesidades legítimas** → el DS añade esos tamaños en una
  versión nueva; o son **drift de la app** → la app converge a los buckets (con visto bueno de diseño)?
  *Disparador*: decidir add-vs-converge. La migración los deja **locales** mientras tanto (cero regresión).
- **`ScConfirmService` no expone el icono de cabecera** — `ScConfirmRequest`
  (`confirmdialog/sc-confirm.service.ts:6-25`) no tiene campo `icon`; `request()` hardcodea
  `resolveScComponentIconClass('exclamation-triangle')` (`:61`). Un consumidor con otro glifo de
  cabecera (la app local usa `pi pi-exclamation-triangle`) **no puede conservarlo** sin forkear → al
  adoptar el servicio se traga el cambio a Material Outlined. Es **parte de la decisión de iconos**
  (diferida). *Fix*: permitir `icon?: string` opcional en `ScConfirmRequest` (default = el resolver
  actual). *Disparador*: cuando se decida la cabecera de confirm (bundleado con la decisión de iconos).
  La migración deja **confirm-host local** mientras tanto (cero regresión). *Validación*: un consumer
  puede pasar `icon` y conservar su glifo; default sin cambios; `verify` verde.
