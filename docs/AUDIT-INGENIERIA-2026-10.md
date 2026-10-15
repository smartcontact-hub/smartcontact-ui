# Auditoría de ingeniería del monorepo (2026-10-15)

> Snapshot fechado, junto a [`AUDIT-DEUDA-2026-06.md`](./AUDIT-DEUDA-2026-06.md) (deuda de código) y
> [`AUDIT-SEMANAL.md`](./AUDIT-SEMANAL.md) (backlog vivo de la rutina semanal). Lo que se priorice de aquí
> pasa a [`ROADMAP.md`](./ROADMAP.md) con su disparador.
>
> **Medido sobre `0a15a78`** (el árbol de `main` al empezar). `main` ya lleva dos commits más, solo CSS del
> laboratorio y del Supervisor; ninguno toca un fichero citado aquí (comprobado con `git diff --name-only`).
> Los números de línea son de `0a15a78`.
>
> **Etiquetas.** CONFIRMADO: lo vi en el código, en los datos o en una medición. PROBABLE: hay indicios
> suficientes, sin medir el efecto. HIPÓTESIS: necesita validación. Un hallazgo "heredado" lo midió un
> agente de apoyo y no lo repetí; va marcado.

## 1. Resumen ejecutivo

El código es sano. En las librerías y las seis apps: 0 `any`, 0 `@ts-ignore`, 0 ciclos de import en runtime,
todos los componentes en OnPush y con señales, `--p-*` solo dentro del preset y tokens trazables al export del
Kit. ESLint sale con 0 errores y 0 avisos, y la CI de `main` está en verde.

Los riesgos reales no están en el estilo. Están en cuatro sitios:

1. **Seguridad de la CI**: el robot de auto-merge no mira de dónde viene el PR, y una rama de nombre especial
   se salta toda la CI también desde un fork.
2. **Promesas escritas que el repo no cumple**: se retiraron 31 tokens `--sc-*` después de 1.0.0 y se preparan
   como un minor, cuando el CHANGELOG promete romper solo en un major; y varias cifras de la documentación
   están viejas.
3. **Un fallo que ve el usuario**: una redirección abierta en la ruta del laboratorio del Supervisor.
4. **Accesibilidad medida y sin cerrar** en el DS (nombre de la barra de progreso, ayuda del datepicker, foco de
   la paleta de comandos) y cuatro sombras del preset que escapan del gate que dice vigilarlas.

Más tres decisiones que no son código (licencia de PrimeNG 22, cómo publicar 1.1.0 y teléfonos en el historial).

El roadmap queda en **11 cambios en 3 PRs, unos 2 días** (PR-1 y PR-2 ya ejecutados). De las 39 propuestas del primer borrador salen 25;
la sección 6 dice por qué. Más abajo, la sección 7 enumera lo que se deja intacto.

## 2. Baseline

| Comprobación | Resultado | Cómo |
|---|---|---|
| Git | árbol limpio; la rama coincidía con `main` | `git status` |
| CI de `main` | verde en `0a15a78` y en las 5 últimas; 19 de las 20 últimas | `gh run list`, repetido |
| CI de PRs, últimos 3 días | 42 verdes y 17 rojas de 59 ejecuciones terminadas | `gh run list`, repetido |
| `eslint .` | 0 errores, 0 avisos, 1.253 ficheros, 15 s | ejecutado |
| `tsc --noEmit`, librería de iconos | sin errores | ejecutado |
| `tsc --noEmit`, librería de componentes | 25 errores, todos "no encuentro `@smartcontact-hub/*`" | ejecutado; el worktree no tiene `dist/`: es el entorno, no un defecto |
| Reglas de accesibilidad de plantilla (ESLint, en memoria, sin tocar la config) | 84 avisos en todo `projects/` | ejecutado; de los 3 del DS que miré, 2 son falsos positivos |
| `npm audit` | 15 (3 críticos, 8 altos), casi todo tooling de desarrollo; en runtime 3, ninguno explotable aquí | heredado |

**No ejecutado, porque escribe en disco**: `verify`, los builds, `test:components`, `test:unit` y los e2e. Su
resultado en este commit es el de la CI de `main`. Ningún problema de este informe lo introduce una
modificación: todos son preexistentes.

## 3. Arquitectura actual

- **Tres librerías ng-packagr**: `@smartcontact-hub/styles` (`projects/design-tokens`), `@smartcontact-hub/icons`
  (`projects/ui-smartcontact-icons`) y `@smartcontact-hub/components` (`projects/ui-smartcontact`, 61
  componentes `sc-*` en el manifiesto).
- **Seis apps**: `sc-docs` (showcase con motor propio), `supervisor` (la app real, con datos de demostración en
  localStorage y login de demostración, DD-110), `cuscare-ds`, y las réplicas `agent`, `cuscare` y `agent-mini`,
  que no se tokenizan a propósito (DD-35, DD-37).
- **Consumo**: las apps importan el DS desde `dist/` por rutas de `tsconfig` (DD-17, DD-58).
- **Versiones reales**: Angular 22.1.3, PrimeNG 22.1.0, `@primeuix/themes` 3.0.0, TypeScript 6.0.3, Node 22.23.2,
  npm 10.9.8, Playwright 1.62.1, vitest 4.1.11, ESLint 9.39.5. Las apps usan zone.js (no son zoneless).
- **Tokens**: export DTCG del Kit, cinco generadores, diez zonas `@sc-gen` en cinco ficheros y un preset de
  PrimeNG que lee `var(--sc-*)`. En los últimos 25 commits sobre las capas, ninguno toca una zona generada sin
  tocar su generador.
- **Pantallas del Supervisor**: 84 aristas de import cruzan sub-features de `admin/` y 22 cruzan features de
  primer nivel (grafo propio, 720 aristas, heredado), con 0 ciclos en runtime.

## 4. Fortalezas que se conservan

1. API en la era de señales, vigilada por trinquete (`audit:api-era`, DD-38).
2. Frontera `--sc-*` / `--p-*` y pipeline de tokens generado y con paridad (DD-18 a DD-23, DD-46).
3. La CI: permisos mínimos en los 9 workflows, e2e por alcance (DD-117) y Supervisor en 8 partes (DD-155),
   `deploy-record` que mide lo que sirve cada sitio (DD-59), `release` en dry-run con guardas,
   `ci-preflight-parity` entre `preflight` y `ci.yml`.
4. Decisiones que no se reabren: DD-43 (sin base común de admin), DD-44 (sin CVA), DD-72 (una fachada de tabla;
   no se trocea `sc-datatable`), DD-35 y DD-37 (réplicas sin tokens), DD-17 (consumo dentro del repo).
5. Lógica de dominio en módulos `.core.mjs` con `node:test`, gates nacidos de incidentes reales (datos de
   contacto, firma de commits, base href, lockfile) y docstrings que registran la medida detrás de cada elección.

## 5. El roadmap

Un cambio entra solo si cumple tres condiciones: evidencia propia (una hipótesis entra como paso de "medir", no
como cambio), daño real hoy y un coste y riesgo menores que ese daño. El repo agrupa los bloques por lote
(DD-154): un PR por lote, un commit por bloque, que se revierte solo.

### PR-1 · Seguridad de la CI y documentación que miente (unas 2 h, no toca producto; fundido en el PR #412)

**1. El robot de auto-merge mira de dónde viene el PR** (CONFIRMADO la configuración, PROBABLE la explotación)
- Evidencia: `.github/workflows/audit-automerge.yml:51-79` funde por título más lista de ficheros, sin mirar autor
  ni repo de origen. `main` no exige revisión y la aprobación de forks solo se pide la primera vez.
- Por qué merece la pena: es la única vía a `main` sin ninguna persona, y lo que funde
  (`docs/AUDIT-SEMANAL.md`) lo lee después una rutina con agente.
- Coste: un `if:` de job con `github.event.workflow_run.head_repository.full_name == github.repository` y
  `--match-head-commit "$SHA"` en la misma línea del `gh pr merge` (lo fija `scripts/__tests__/mensaje-squash.test.mjs`).
- Riesgo: si la condición está mal, la auditoría semanal espera a una persona. Falla seguro.

**2. Una rama de fork no se salta la CI** (CONFIRMADO)
- Evidencia: los 7 jobs de `ci.yml` se saltan con `head_ref == 'design-tokens-sync'`, también desde un fork, y
  un job saltado cuenta como check verde. DD-68 justifica el salto porque "todo lo que llega por esa rama pasó
  por el robot", cosa que solo es cierta en el mismo repo.
- Por qué: hoy un check verde puede no significar nada. Esto restituye la intención de DD-68.
- Coste: una condición más en 7 líneas y una nota bajo DD-68. Riesgo: un rojo espurio visible en el PR del robot.

**3. Los hooks escriben donde deben** (CONFIRMADO)
- Evidencia: `scripts/hooks/main-drift-guard.mjs:35` y `scripts/hooks/compact-card.mjs:27` hacen
  `join(cwd, <ruta absoluta>)`; en un worktree git devuelve la ruta absoluta y se crea un árbol `Users/...`
  dentro de la carpeta. No llega a git porque la ruta contiene `.git`.
- Por qué: es un bug real con arreglo de dos líneas, y ya despistó a esta auditoría.
- Coste: `resolve()` en vez de `join()` y un test que enrojece con el bug puesto. Riesgo: ninguno.

**4. Corregir las cifras que mienten en la documentación** (CONFIRMADO)
- `AGENTS.md:351` dice 8 pasos de CI y son 9; el README dice "Cinco" apps y falta `cuscare-ds`;
  `docs/guardarrailes.md:68,83,176` y su tabla de workflows (3 de 8); DD-31 dice "~340KB, swap" y la fuente pesa
  3,96 MB con `font-display: block`; `docs/acoplamiento-primeng.md` dice 36 clases y el gate cuenta 84;
  `projects/supervisor/README.md:51-58` nombra un componente que ya no existe.
- Por qué: una documentación que miente hace equivocarse al siguiente que la lee. Donde la cifra no aporta, se
  quita en vez de corregirla. Los dos README a la vez, por `docs:readme-parity`.
- Coste: 1 h. Riesgo: ninguno.

**Fuera del repo** (ajustes de GitHub, hecho el 15 de octubre con `gh api`): secret scanning, push protection y
alertas de Dependabot activados, y la aprobación pedida a todo colaborador externo en vez de solo al primerizo. Las
actualizaciones automáticas de Dependabot siguen apagadas a propósito: abren PRs y cada uno gasta una CI entera.

Verificación del lote: `test:unit`, `docs:guard`, `docs:coherence`, `preflight:scope` y la CI del PR leída con `ci:verdict`.

### PR-2 · Supervisor: una redirección abierta (unas 2 h; los otros tres cambios previstos salieron al medirlos)

**5. Redirección abierta** (CONFIRMADO; hecho en el PR #414)
- Evidencia: `projects/supervisor/src/app/app.routes.ts:59-61` acepta `?to=//dominio-ajeno` porque empieza por
  `/`, y hace `location.assign`. El sitio es público y sc-docs enlaza a esa ruta.
- Por qué: sirve para phishing desde un dominio propio. Coste: resolver el destino contra el origen de la app
  (`ruta-interna.core`, con su test, que rechaza los casos que el predicado anterior daba por buenos).
  Riesgo: ninguno.

**Salieron del lote al medir** (lo previsto era recuperar un chunk viejo, avisar de un guardado fallido y estabilizar una prueba):
- **Recuperar un chunk viejo tras un deploy**: el Supervisor usa `PreloadAllModules`
  (`projects/supervisor/src/app/app.config.ts`), que precarga todos los chunks de ruta al arrancar, así que una
  pestaña vieja ya los tiene. Copiar el handler de sc-docs habría sido además un error: sc-docs enruta por hash
  (`location.hash = url`) y el Supervisor por path. Lo único que queda expuesto es `import('exceljs')`
  (`xlsx-export.service.ts:41`), cuyo fallo se pierde como promesa rechazada.
- **Guardado que falla en silencio** (`local-store.factory.ts:107-115`): el mecanismo es real, pero
  `sc-photo-upload` no reduce la imagen (hasta 800 KB por foto) y la cuota solo se alcanza con unas cinco fotos
  casi al tope.
- **Qué comparten los dos**: no hay dónde mostrar el error sin un patrón nuevo. El toast está en un trinquete que
  solo puede menguar (`audit:screen-hygiene`, DD-191). La propuesta, si se retoma, es un `sc-message` junto al
  control (el de exportar, el de guardar). Ambos quedan diferidos en `ROADMAP.md`.
- **Prueba inestable**: no lo era. Los 2 rojos de `e2e/supervisor/admin-row-menu.spec.ts:44` fallaban de forma
  determinista (`toHaveCount(1)` con un segundo menú, el de la barra superior) y el commit `feb94c88` lo arregló
  el mismo día. De las 17 ejecuciones rojas de PR en 3 días, 12 tocan las capturas visuales de `e2e-smoke`, que se
  regeneran a propósito con `visual-baselines` cuando el cambio es deliberado, 5 tocan el Supervisor y 3 no
  tienen un job fallido. Los rojos que se miraron eran aciertos de la CI, no inestabilidad.

### PR-3 · DS: contrato y accesibilidad antes de publicar 1.1.0 (hecho en el PR #417)

**9. El contrato de tokens que promete el CHANGELOG** (CONFIRMADO; resuelto con alias, decisión D2)
- Evidencia: el commit `0efaf40f` (#194, después de `v1.0.0`) quita 30 tokens `--sc-*` (33 líneas, con su copia
  oscura) y se suma `--sc-font-size-caption-bold`: 31. Ninguno volvió con otro nombre. Van como "preparada
  1.1.0", un minor. `CHANGELOG.md:5-7`, DD-58 y `docs/consumer-onboarding.md:64` dicen que `--sc-*` es contrato
  público y solo rompe en un major, y el CHANGELOG nombra uno de los 31. Además `appendTo` de `sc-select` y
  `sc-multiselect` cambió de tipo y de valor por defecto (`d2459189`) sin nota.
- Por qué: lo consume un equipo externo (tema-zip). Publicar 1.1.0 así rompe una promesa escrita.
- Coste: 2 h. Alias `@deprecated` fuera de las zonas `@sc-gen` (la vía que no borra, LEARNINGS #15) o cortar
  2.0.0; en los dos casos, la lista completa en el CHANGELOG. Riesgo: bajo, es aditivo.
- Hecho: los 31 vuelven como alias en un bloque «Alias en desuso» al final de `05-extensions.css` y de
  `07-dark.css`, fuera de las zonas generadas. El CHANGELOG los lista en `Deprecated` y anota el cambio de
  `appendTo`. La regla queda escrita en `docs/migration-safety.md`: retirar algo público se hace con alias en
  desuso y en un major.

**10. Exportar `ScFieldSize`**: seis alias `@deprecated` dicen "Usa `ScFieldSize`" (por ejemplo
`sc-inputtext.component.ts:16`) y `public-api.ts` no lo exporta. Una línea, sin riesgo. Hecho.

**11. Etiquetas por defecto en el idioma de la app** (CONFIRMADO)
- Hay textos fijos en español o inglés en `sc-chip`, `sc-search`, `sc-dialog`, `sc-progressspinner`,
  `sc-password` (`:127-129`) y `sc-datepicker` (`:123`), mientras otros 17 componentes ya usan diccionario.
- Por qué: con el Supervisor en inglés, francés o portugués el lector de pantalla anuncia otro idioma.
  Coste: 2 h. Riesgo: bajo, son textos accesibles y no cambian lo que se ve.
- Hecho para cuatro: `sc-dialog`, `sc-search`, `sc-password` y `sc-datepicker`. `sc-chip` y `sc-progressspinner`
  salen: ninguna de las apps los usa, y un cambio sin consumidor es coste sin daño que pagar. Medido: el defecto
  lo usan sin sobrescribir 20 de 21 `sc-dialog`, 5 de 14 `sc-search`, 1 de 3 `sc-password` y 1 de 2
  `sc-datepicker`. Las entradas de etiqueta pasan a `string | null` y el componente exige `TranslateService`,
  peer ya documentado en `docs/consumer-onboarding.md`.

**12. `sc-progressbar` con nombre accesible** (CONFIRMADO): sin entrada de nombre
(`projects/ui-smartcontact/src/lib/components/progressbar/sc-progressbar.component.ts:13-21`); la baseline de
axe guarda 4 fallos `aria-progressbar-name`. Coste: 30 min más su knob en sc-docs. La baseline de axe baja.
Hecho: `ariaLabel` y `ariaLabelledBy`, y el tope baja de 4 a 0.

**13. Ayuda del datepicker y foco de la paleta de comandos**
- Datepicker (PROBABLE; primero se mide): `sc-datepicker.html:31-35` pone `aria-describedby`, `aria-invalid` y
  `aria-required` en el host y no en el input enfocable. Si el árbol de accesibilidad confirma que ayuda y
  error no llegan al input, se pasan por las entradas o el `pt` de PrimeNG (DD-113). Si no, sale del lote.
- Paleta de comandos (CONFIRMADO en el código): `sc-command-palette` está montada en toda la app del
  Supervisor, declara `role=dialog aria-modal` y no atrapa ni devuelve el foco. Se compone con el `p-dialog`
  nativo, que ya lo hace.
- Coste: 4,5 h. Riesgo: medio, cambia comportamiento; lleva e2e de teclado y los barridos de foco.
- Resultado del datepicker: CONFIRMADO. Una spec que busca el `<input>` por su id lo encontraba sin ninguno de
  los tres `aria-*`. Se pasan por `pt.pcInputText.root`, como `sc-select` con `pt.label` (DD-133).
- Resultado de la paleta: CONFIRMADO con una spec que enrojecía en tres cosas (Tab salía, el foco no volvía y el
  resaltado no se anunciaba). No se compuso con `p-dialog`: se arregló en el sitio, con Tab fijo en el campo,
  retorno del foco y una región `aria-live`. El patrón combobox con `listbox` y `option` a mano se descartó: lo
  prohíbe la regla 8 de `audit:screen-hygiene`, y el nativo (`p-listbox`) obliga a reescribir la paleta. Queda
  sin resolver que la lista no sea un `listbox` para el lector; solo lo resolvería el nativo.

**14. Las cuatro sombras que se escapan del Kit** (CONFIRMADO)
- Evidencia: `scripts/effects-rewire.mjs:77` busca `shadow:` en minúscula y no ve `raisedShadow`
  (`button.ts:70`, `splitbutton.ts:6`), `checkedShadow` (`togglebutton.ts:42`) ni `insetShadow` (`timeline.ts:22`).
  Las cuatro llevan hex en el preset y sus tokens ya se generan.
- Por qué: la promesa central del DS es que cada valor se traza al Kit. Coste: 1,5 h, con una regex que case
  `*Shadow` y prueba roja. Riesgo: si el valor generado no es idéntico al hex, cambia una sombra; se comprueba
  antes que es un no-op, y si no lo es, se para y se enseña.

Hecho con una prueba roja primero: el gate de sombras ahora ve `*Shadow` y las cuatro quedan atadas a su
token (valor idéntico, comprobado con `report`).

Verificación del lote: `verify` entero, `test:components` con specs nuevas, la baseline de axe, `preflight:scope`,
la CI completa del Supervisor y la revisión de las pantallas tocadas.

Lección del lote: un cambio de accesibilidad en un componente mueve tres baselines que nadie recuerda a la vez,
los topes de axe, las capturas de `visual-baselines` y el HTML de `e2e/baselines/component-structure.json`. El
primer CI del PR salió rojo por la tercera. Quien toque el DOM de un componente regenera las tres antes de abrir
el PR.

## 6. Decisiones que no son código

| | Decisión | Evidencia | Recomendación |
|---|---|---|---|
| D1 | Licencia de PrimeNG 22 | La licencia Community/dev permite usar PrimeNG en las apps, con tope de 4 puestos, menos de 10 empleados y renovación anual. Prohíbe distribuir el software "as-is, bundled, or with superficial modifications" para que otros lo usen como librería o herramienta de desarrollo, y eso exige una licencia OEM. El texto no exceptúa presets ni temas derivados. `@primeuix/themes` (Aura) lleva la misma licencia PrimeUI. `scripts/tema-zip.mjs` lo empaqueta con esbuild (`bundle: true`) dentro del `sc-preset.mjs` publicado como `smartcontact-tema`. La clave está además en cinco `app.config.ts` de un repo público, y la licencia prohíbe publicarla para que otros la usen | Decidido y hecho: `@primeuix/themes` se queda fuera del bundle y no se pide la licencia OEM por ahora (DD-207, `docs/licencias-primeui.md`). El tema sin Aura se publicó en la rama `tema-zip` el 15 de octubre y se comprobó descargándolo. No se reescribe el historial de esa rama: los commits viejos seguirían descargables por SHA y no se ganaría nada. La clave se queda en el código, porque ya va en el JavaScript público de los sitios. Lo que sigue dependiendo de fuera: que el equipo que usa el tema tenga `@primeuix/themes` 3.x, y renovar la clave antes de su vencimiento |
| D2 | 1.1.0 con alias o 2.0.0 | Punto 9 | Alias `@deprecated` hasta 2.0 |
| D3 | Teléfonos en el historial público | Tres teléfonos de la extracción de la réplica están en seis commits de los datos de paridad de `findings/`, de finales de agosto y principios de septiembre, alcanzables desde `main`, desde `v1.0.0`, desde las ramas archivadas y desde unos 390 `refs/pull/*`. El árbol actual los tiene tachados (`findings/STATUS.md`). El commit que los retiró dice que eran "de verdad" | Decidido: no se reescribe. GitHub solo purga los `refs/pull/*` y las vistas en caché cuando antes se ha reescrito el historial con `git-filter-repo` y forzado el push de ramas y etiquetas; sin eso, Support no hace nada. Reescribir cambia los SHA de unos 600 commits, la etiqueta `v1.0.0` con su release y las PRs abiertas, y los commits viejos seguirían descargables por SHA. `audit-seed-pii.mjs` cuenta que los teléfonos salieron de la extracción de la app real, así que no se dan por inventados. La petición a Support está redactada fuera del repo por si algún día se decide reescribir |

## 7. Lo que sale del roadmap, y lo que queda intacto

| Propuesta del primer borrador | Por qué sale |
|---|---|
| `sc-dialog` emite dos veces `cancelled` y `hidden` | Defecto real (PrimeNG emite `visibleChange` y `onHide` y el componente atiende los dos), pero hoy no daña: los handlers del Supervisor solo ponen una señal a su valor. Arreglarlo cambia 48 bindings. Va a `ROADMAP.md` con disparador |
| `keydown` doble en `sc-search` | Los consumidores ya lo esquivan y quitar la salida rompe API pública: lista de 2.0 |
| Vigilar `_filter()` y `sortSingle()` de PrimeNG en `sc-datatable` | Ya lo cubre la spec del componente, que corre en `verify` |
| Alias de tipos de PrimeNG en el API; unificar nombres de salidas y uniones de tamaño | Preferencia, y rompe API en 1.x |
| Ampliar `audit:primeng-coupling` a TypeScript | Más código de gate; las capturas visuales cubren esas clases. Solo se corrige la cifra |
| `concurrency`, `timeout-minutes`, `node-version-file`; merge queue | Sin evidencia de colas, cuelgues ni deriva; 1 rojo en 20 de `main` |
| `dependabot.yml` con PRs y `SECURITY.md`; parches de `npm audit` | Cada PR cuesta unos 30 min de CI; en runtime no aplica y los críticos son de tooling |
| `env:` en `deploy-record`, CSP, clave de la página de validar, Actions por SHA | Sin vía de ataque: lo lanza el mantenedor, son sitios de demostración y las Actions son de primera parte |
| Carrera del `setTimeout` al guardar; ids estáticos; `aria-checked`; movimiento del modal masivo | No reproducido o sin daño observado |
| Fuente de iconos, avatares SVG, presupuestos, `afterEveryRender` | Sin medir; `font-display: block` fue una decisión medida y la fuente fija rompe los ejes que el DS usa. Solo queda la medición (build de producción y Lighthouse), guardada aquí |
| Inversión `shared` a `features`; trocear formularios de 1.400 líneas | 1 caso y 0 ciclos; el tamaño solo no es un defecto |
| Código y dependencias sin uso, `track $index`, `effect` a `linkedSignal` | Ganancia mínima; se limpia al tocar el fichero. `@angular/animations` sí se usa (`provideAnimationsAsync`) |
| Archivar el harness de paridad | Hay una decisión pendiente en `ROADMAP.md` |
| `templateAccessibility`, `noUncheckedIndexedAccess`, lint con tipos | 2 falsos positivos de 3 en la muestra: cambio masivo para poco |
| TS 7, ESLint 10, vitest 5, zoneless, Storybook, NgRx, Nx, otra librería en vez de PrimeNG | Modernización sin un problema que resolver |

**Queda intacto**: `projects/design-tokens` entero; el preset salvo los 4 slots de sombra; las réplicas `agent`,
`cuscare` y `agent-mini`; sc-docs (solo gana un knob); los componentes del DS salvo los citados (sin tocar
`sc-datatable`, `sc-dialog`, `sc-button` ni las factorías de `sc-field.ts`); la arquitectura del Supervisor, sus
stores y formularios; los 48 gates de `verify` (no se añade ni se quita ninguno); los workflows salvo dos
condiciones; dependencias, `tsconfig`, ESLint y `angular.json`; y la estructura de DECISIONS, LEARNINGS y AGENTS.

## 8. Graphify

- **Índice** al día (`0a15a78`, 8.248 nodos, 18.417 aristas).
- **Limitación CONFIRMADA**: no ve a quién usa el DS, porque las apps importan `@smartcontact-hub/components`,
  un alias a `dist/` que no está indexado. `ScDatatableComponent` sale con 0 consumidores y una búsqueda de
  texto encuentra 16 ficheros; `createLocalStore` sale con 1 llamador. El radio de impacto de cada cambio del DS
  se mide con búsqueda de texto sobre el nombre público.
- **Útil**: las factorías de `sc-field.ts` alimentan 9 campos y no tienen spec; si un día se tocan, llevan
  caracterización antes. El alias `@smartcontact-hub/components` lo importan 83 ficheros del Supervisor, 73 de
  sc-docs y 6 de `cuscare-ds`.

## 9. Observación sobre el peso de la gobernanza

Es una opinión fundamentada, no un defecto, y no entra en el roadmap. Hay 48 gates, 101 scripts (unas 21.000
líneas; 36.800 con hooks y tests), 9 hooks y 1,7 MB de Markdown, con 204 decisiones en cuatro meses y medio. El
39 % de los commits de los últimos 60 días toca `scripts/`. Un `font-size` literal lo miran tres gates y la
atribución de commits, cuatro sitios. Cada gate tiene un porqué documentado en `docs/guardarrailes.md`, así que
no conviene quitar ninguno a ciegas. Lo que sí merece la pena a medio plazo es que un gate nuevo sustituya a
otro o demuestre un incidente que ninguno caza, y que un desarrollador nuevo sepa cuáles importan el primer día.

## 10. Limitaciones

- No se ejecutaron `verify`, builds ni e2e (escriben en disco); no se midió peso de bundle ni Lighthouse.
- Los recuentos de grep de los agentes (clases `.p-*`, tokens sin uso, cobertura de specs, aristas entre features,
  `npm audit`) los doy como heredados; los hallazgos del roadmap sí los verifiqué en el código.
- Graphify no cubre el consumo del DS por `dist/` (sección 8).
- No hubo pruebas con lector de pantalla real; los hallazgos de accesibilidad son de código y de axe.
- La clasificación de los rojos de CI se hizo por firma en el log, no por causa raíz.
