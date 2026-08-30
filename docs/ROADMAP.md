# Smart Contact UI — Roadmap (backlog durable)

> Backlog **durable** de lo diferido-pero-rastreado. Distinto de `NEXT-SESSION.md` (que es el
> hand-off *volátil* y se sobreescribe). Aquí no se pierde nada al cerrar sesión.
> El *por qué* de cada decisión vive en `docs/DECISIONS.md` (DD-N); aquí va el **qué + cuándo
> (disparador) + cómo se valida**. Cada punto se cierra solo cuando su validación pasa.

## En curso

### Tokenizar los text styles del Figma (raíz común de 4 "fallos" de componente)
- **Qué**: en la validación web↔Figma de s24 (Jira **SISMAC-4074**), Select, MultiSelect, Chip y
  Toast fallaban por lo MISMO: **los estilos de texto de Figma no están tokenizados como `--sc-*`**,
  así que el navegador aplica sus defaults. Se manifiesta distinto por componente —
  Select/MultiSelect en tamaño de fuente (opciones a 16 en vez de 14); Chip/Toast en line-height
  (Chip 35 vs 31, Toast 62 vs 72 + el margen del botón ×) — pero **es un solo arreglo, no cuatro
  tickets**. Enlaza con el aparcado *"`line-height` sin unidad: sin token destino en el Kit"*,
  que es exactamente el token que falta.
- **Procedencia**: medido en la sesión 24 (2026-08-07); entregable en Figma, página `Feedback`,
  sección `14015-179` (file `khNq9dJKNi13pNllrqm6dx`). **Rescatado aquí el 2026-08-13** al mergear
  el PR #23: vivía solo en un hand-off volátil y no estaba en ningún doc durable.
  ⚠️ No re-medido desde entonces — trátalo como pista verificable, no como estado actual.
- **Disparador**: al abordar la deuda de tipografía del Kit, o si vuelve a reportarse cualquiera
  de esos 4 componentes.
- **Validación**: los text styles del Kit exportan `font-size`/`line-height` como tokens; tras
  `tokens:import`, los 4 componentes miden en web lo mismo que su nodo de Figma.
- **Ojo al medir**: varias "diferencias" de aquella validación resultaron ser **el mismo
  componente en otro estado** (placeholder vs elegido, `showClear` on/off, ancho fluido vs 216
  fijo), no defectos. Iguala el estado antes de marcar nada.

> ✅ **CERRADO el round-trip del focus ring** (verificado 2026-08-13). Su propio criterio de
> cierre ya se cumplía desde el 14-jun y nadie lo tachó: la fila `focus.ring` **no está** en la
> lista DIVERGE (0 ocurrencias en `color-map.mjs` y `token-parity.mjs`) y `customs-catalog.md:60`
> lo da por *"RECONCILIADO al Kit — ya no es divergencia"*. Era el **primer** item del ROADMAP,
> o sea lo primero que leía cualquiera al abrirlo: dos meses mandando a hacer trabajo hecho.

### Dos repeticiones de app que sobreviven al cierre del audit de deuda (2026-08-30)

> Vienen de `AUDIT-DEUDA-2026-06.md`, que ese día se puso al día fila a fila. Las demás de su
> familia se cerraron (estaban hechas) o se descartaron con motivo (**DD-43**: no se construye
> una base común admin). Estas dos siguen vivas, son pequeñas, y **ninguna es urgente**: se
> anotan aquí para que no vuelvan a ocupar el hueco de "deuda grande" que no son.

- **`toggleChannel` con cascade-clamping, ×3** — `group-form-page.component.ts:408`,
  `group-assignment-table.component.ts:127`, `agent-channel-table.component.ts:178`.
  *Matiz medido*: **no es duplicación de código**, es lógica de dominio (qué canales se apagan en
  cascada) pegada a tres vistas. Extraerla a un servicio se paga en **testabilidad**, no en DRY —
  y por eso no entra por la regla de DD-4.
  · *Disparador*: la próxima vez que haya que **cambiar la regla de cascada**. Tocar tres sitios
  para un cambio de dominio es la señal, no el conteo.
  · *Validación*: `npm run e2e:supervisor` (los journeys de formulario de grupo y agente cubren
  los tres puntos de entrada) + el comportamiento de cascada idéntico antes y después.
- **`onSearchKey()` ×6 list-pages, en dos formas divergentes** — surfaceado por la auditoría
  semanal (2026-08-17). Lo que molesta no es la repetición sino que **no se comporten igual**.
  · *Disparador*: al tocar el buscador de cualquier list-page — se unifica hacia la forma buena
  ahí mismo, no en una pasada dedicada.
  · *Validación*: mismo gesto (teclear, Escape, borrar) con el mismo resultado en las seis.

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
  227 usos / 48 ficheros — medido 2026-07-18), NO el `ScIconComponent` del DS — **duplicación** de
  implementación. El local expone `fill` + `weight` desde 2026-07-17 (GRAD fijo 0, opsz derivado del size);
  lo que NO expone es grade/optical explícitos. Ambos soportan `inherit` pero divergen en el opsz de
  `inherit` (local 14 vs DS 24). *Disparador*: al unificar iconografía (plan F5, 2026-07-18: converger a 14).

## Producto · Sistema de reglas — pivote a transcripción (charla con el equipo)

> **✅ EJECUTADO (DD-26 → DD-27, 2026-06-30, en main).** El constructor de condiciones está **construido y
> mergeado**. El modelo de condiciones vive en `supervisor/.../memory/data/condition.types.ts` (refs tipadas
> **dinámicas** + `value`), **no** en `rule.types.ts`. Del "Rumbo MVP" de abajo ya está hecho: dirección+duración
> unificadas como **campos del builder** · tipificación como campo · **grabación y borradores ELIMINADOS** (y la
> priorización, fuera del MVP) · Horario quitado · **estimación de impacto en vivo** (primer paso del simulador de
> coste). Sigue ABIERTO del backlog: sección **Repositorios**, **simulador de coste** completo, **AED**, y los
> accionables backend (VAP/Lucas). Detalle y por-qué en **DD-27** (`docs/DECISIONS.md`).

- **Qué**: las reglas de **grabación** quedan obsoletas por la **nueva ley SEC** → el foco pasa a reglas de
  **transcripción** (+clasificación), con el **sistema de transcripciones múltiples EN DESARROLLO**. Modelo
  (histórico, ver nota EJECUTADO arriba): la charla partió de `rule.types.ts`; el constructor v2 movió las
  condiciones a `condition.types.ts`. Regla = qué pasa con conversaciones FUTURAS; bulk = qué hago AHORA con las existentes.
- **Disparador**: charla de alineación con el equipo. PPT vía Claude Design — master prompt redactado
  (why/what/how/when/who + concerns), con huecos `[RAFA]` de dominio: qué dice la ley SEC, diseño de
  transcripciones múltiples, quién la usa y timeline.
- **HECHO (2026-06-23) — recorrido vivo en sc-docs `/reglas`** (decisión B sobre la PPT estática): página
  paso a paso en `projects/sc-docs/src/app/pages/reglas/` (qué es regla vs bulk · el pivote · anatomía del
  modelo · el builder · la lista · **prioridad/conflictos = la complejidad** · transcripción en detalle ·
  concerns). Los snippets son **código real** (`rules.store.ts`: `scopeOverlaps` + `conflictsByRuleId` O(n²);
  `rules-page.ts`: quién gana por prioridad) y las capturas son del **Supervisor real** (`public/usage/`,
  regeneradas por `npm run usage:capture`, no se desfasan). Verificado: AOT `build:docs` + typecheck + lint +
  `audit:theme-scale`. La PPT-prompt queda como backup. Los 3 huecos `[RAFA]` resueltos (2026-06-23): la ley
  queda fuera de alcance; transcripciones múltiples = varios tramos por conversación, cada uno transcribible
  por separado; quién = los supervisores.
- **CHARLA DADA (2026-06-23)** — conclusiones + accionables sumados a `/reglas`. **Rumbo MVP**: una sola regla
  ACTIVA a la vez (esquiva la priorización); tipificación como entidad de alcance (AND/OR); grabación = aviso,
  no bloqueo; criterios MVP = dirección + duración mínima + tipificación + horario (recuperar); casa = una
  sección de **Repositorios** (transcripción + tipificación), no modal; clasificación/categorías después; nada
  retroactivo (eso es bulk). **Accionables**: hablar con desarrollo backend (VAP/Lucas) para cerrar criterios y que el
  backend avance sin UI · crear sección Repositorios (empezar por tabla) · módulo **simulador de coste** (vs
  mes anterior) · avanzar **AED** (tipificación/agendas/migración). A confirmar: naming (contactantes vs
  grupos/ACD) · invertir-excluir condición · detalle de conversación en ventana propia.
- **Concerns a decidir en la charla**: migración de las reglas de grabación obsoletas (¿auto-desactivar?,
  ¿datos ya grabados?) · resolución de conflictos/prioridad cuando varias reglas chocan · coste de
  transcripción (compute/IA) y límites · gobierno de transcripciones múltiples (qué regla gobierna cuál,
  almacenamiento, re-transcripción) · dependencia transcripción→clasificación IA · legal/retención (ley SEC).
- **Validación**: el equipo cierra las decisiones grandes; las que apliquen se registran como DD en `DECISIONS.md`.

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
> El Supervisor vive en el repo; un cambio de token se refleja en `sc-docs` **y** en la app real.
- **L0** deps · **L1** Supervisor en `projects/supervisor` (consume el DS local, instantáneo) ·
  **L3** ds-docs fundido (`docs/inventory.md` + página Tipografía en sc-docs).
- **L2 · Cloudflare Pages** ✅ — 2 proyectos servidos en raíz, preview por rama automático
  (`NODE_VERSION=22`). Verificado en vivo (raíz + F5 en ruta profunda + i18n):
  **sc-docs** → https://sc-doc.pages.dev · **supervisor** → https://sc-supervisor.pages.dev
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
  - ✅ **CERRADO (2026-08-13)**: la auditoría de documentación
    ([`AUDIT-DOCS-2026-08.md`](./AUDIT-DOCS-2026-08.md)) superó este item. No se fusionó nada:
    los 6 docs de construcción se **borraron** (2.194 líneas) tras rescatar lo que seguía vivo a
    DD-36 y DD-8. Consultables en el tag `archive/docs-history`. Motivo: 13 de las 19 claims
    rotas del repo vivían ahí.
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
- **Iconos: peso + ejes (Material Symbols) = decisión de diseño deliberada** — el **estilo** ya está
  cerrado: **Outlined**, self-hospedado por el DS (**DD-31**), unificando demo↔apps (antes el DS servía
  Rounded y las apps overrideaban a Outlined por CDN). Queda abierto el **peso** del icono a la par del
  peso de la tipografía (principio registrado en `.impeccable.md` → *Iconografía*) y el ajuste fino de
  ejes (weight · fill · optical size) por **lo que case con la UI de SC**, no al azar. *Validación*: la
  suite visual-regression de sc-docs (baselines por-plataforma; en CI mandan las métricas). *Disparador*:
  decisión de diseño antes de tocar los ejes.
- (Menor) **Drift de tokens local↔publicado**: caracterizado por la migración como **convergencia
  intencional** (rampa zinc aditiva + px→rem que resuelve idéntico a root 16px + refactor de refs),
  no regresión. Confirmado visual/numéricamente idéntico → swap de fundación = bajo riesgo.
- **Tamaños que faltan en el publicado: `sc-avatar` (px) y `sc-tag` (`xs`)** — la app usa avatares en
  px concretos y un tag `xs` que el paquete publicado no expone (usa buckets de tamaño / no tiene xs).
  *Decisión DS (no de la migración)*: ¿son **necesidades legítimas** → el DS añade esos tamaños en una
  versión nueva; o son **drift de la app** → la app converge a los buckets (con visto bueno de diseño)?
  *Disparador*: decidir add-vs-converge. La migración los deja **locales** mientras tanto (cero regresión).
- ✅ **CERRADO — `ScConfirmService` ya expone el icono de cabecera** (verificado 2026-08-13).
  Se implementó exactamente el fix que este item pedía, y nadie lo tachó:
  `confirmdialog/sc-confirm.service.ts:31` declara `readonly icon?: string` y `:68` resuelve
  `req.icon ?? 'exclamation-triangle'` — opcional, con el default de siempre. Un consumidor ya
  puede conservar su glifo sin forkear.
