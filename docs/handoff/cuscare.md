# Frente · CusCare — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-30 (s36) — HEAD `304948c`. Las 4 tareas del hand-off anterior, HECHAS. 100 tests e2e verdes, `preflight:fast` leído.**

`projects/cuscare` replica `cuscare.smart-contact.com/aed`. **Las 9 vistas montadas**, con
valores extraídos del sitio real (no estimados) y **100 tests e2e** (`npm run e2e:cuscare`, en CI).

Funciona de verdad, no es maqueta: filtros, paginación sobre 3280 filas, **ordenación por
cabecera**, selección de filas, gestor de columnas con arrastre, las 4 acciones en bloque con
sus paneles y su modal, el paso 2 de "+ New ticket", el panel Summary, los tooltips ⓘ y los
avisos de acción.

Contexto completo: [`projects/cuscare/README.md`](../../projects/cuscare/README.md).

## ✅ Lo que se cerró el 2026-08-30 (las 4 tareas que dejaba este hand-off)

Todo medido contra las FUENTES del original, no contra su descripción. La palanca fue el bundle
sin minificar cacheado en `.cache/original-bundle/` (26-ago) + su diccionario real, bajado a
`.cache/cuscare-en.json` (1454 claves, gitignored).

1. **Copy** — cruzados literal a literal el panel Summary (43) y el detalle (16) contra el
   diccionario. La sospecha de partida (copy inventado) era **falsa en casi todo**: los
   placeholders y `<h2>Subscriptions</h2>` están hardcoded en el original también. Lo que sí
   estaba mal: castellano en una UI inglesa. Y al mirar el conjunto salió lo gordo: **66 nombres
   accesibles en castellano** (Cerrar, Buscar, Página N…) por toda la app — lo que oye un lector
   de pantalla estaba en otro idioma. Todos a inglés, con la palabra del diccionario. Lo gatea
   `scripts/__tests__/cuscare-english-ui.test.mjs` (en `test:unit`).
2. **Ordenación por cabecera** — las **7** columnas que ordenan en el original (leído de su
   bundle: `sortable` ×7, 0 con `false`), ciclo asc → desc → sin orden, reset a página 1. Ordena
   las 3280 en memoria (entre `filtered()` y `rows()`), NO con `pSortableColumn`.
3. **Iconos** — 17 SVG reales bajados del original (bytes mágicos, no HTTP 200). Cuatro símbolos
   Material van EN LÍNEA porque con `fill="none"` son invisibles como `<img>` y no valen como
   máscara CSS (medido). La bandera de prioridad la elige el ticket.
4. **"Show details"** — despliega el cuerpo de TODOS los eventos del timeline a la vez (como su
   `showDetailsHistory`). Separado del botón "Detail" de suscripciones, con el que compartía señal.

**Bug destapado al verificar (3):** el detalle enseñaba SIEMPRE el ticket 2050567 fuera cual
fuera la URL — el `id` era un `input()` que nadie enlazaba. Ahora se lee del `paramMap` por
observable (no snapshot: el router reutiliza el componente) y se busca en las 3280 filas.

## ▶︎ SIGUIENTE — sin preguntar

1. **"Subs Info" del panel Summary muestra 2 campos** (User Agent, IP); el original tiene **11**
   bajo `CUSTOMER_INFO.*` (Placement, Carrier, Device, Device/OS, Connection, Banner, Campaign…).
   Es fidelidad con datos inventados, por eso quedó fuera del cierre; si se hace, seed sin PII.
2. **El conmutador de periodo pinta "1 Week" fijo**; el diccionario tiene 12 periodicidades
   (`SERVICE.DAY/WEEK/MONTH/QUARTER/BIANNUAL/YEAR/DAYS30…`). Mismo caso: fidelidad, no corrección.

## ⏸️ Sin resolver (no bloquea)

- El disparador real de **"Right to be forgotten"** y del diálogo de motivo de no reembolso:
  cuelgan de celdas de la barra de metadatos como SUPOSICIÓN anotada en el código.
- El diccionario describe funcionalidad no vista, quizá de otro rol: acción en bloque
  **"Quick response"**, estados **On-hold**, substatus con comentario, y nav **"Statistics"** y
  **"Data Analyzer"**.

## ⚠️ Trampas de este frente

- **Abrir el detalle de un ticket en la app real CAMBIA su estado.** Navegar a
  `…/tickets/ticket/336458` lo pasó de `new` a **OPEN** y lo asignó a Rafa sin pulsar nada. Para
  medir dentro de una ficha, usa una que YA esté `open`/`resolved` (2050567 no deja rastro) o
  pídeselo a él. **El `en.json` y los SVG son assets estáticos por URL: bajarlos NO toca sesión.**
- **El bundle cacheado es `/sismac/`, no `/aed/`, y es POSTERIOR a las mediciones (26-ago).** Es
  el mismo código multi-tenant, pero contrasta lo visible contra la app viva antes de replicar.
- **Al leer el DOM tras un gesto en e2e, usa `expect(...)`, no `getAttribute`/`innerText` a
  secas.** Estos últimos leen de una pasada, sin reintento; medido el 30-ago, 5 de 6 leían el
  estado anterior y parecía que la tabla perdía el primer clic. Con `expect`, 6 de 6. Fallaba el
  instrumento, no la app.
- **No replicar sus bugs**: la clave i18n sin traducir del dashboard
  (`PAGES.DASHBOARD.DASHBOARD_TICKETS.TABLE.NONE`) y la errata `QEUE` se dejaron fuera a
  propósito. En cambio SÍ se replican sus erratas de contenido: `Reccuring` (dos C) y
  `Unsubsribed` (sin la segunda c) son del diccionario original.
- **Los dos loaders de la app duran 380 ms y NO se miran en la pantalla.** Paginar y buscar
  encienden y apagan su overlay con `setTimeout(…, 380)`. Un `expect(locator).toBeVisible()`
  justo tras el clic es una CARRERA. Se afirman con `watchTransient()` (`e2e/cuscare/helpers.ts`),
  que instala un `MutationObserver` ANTES de la acción. No subas el timeout: el problema es
  llegar tarde, no esperar poco.
- **El motion de los overlays está APAGADO, y tiene que seguir apagado.** Los overlays de
  PrimeNG 21 entran escalando y `getBoundingClientRect()` arrastra el transform del ancestro, así
  que la caja de cada `<li>` cambia frame a frame y Playwright no puede clicar. Se apaga con
  `contextOptions: { reducedMotion: 'reduce' }` en `playwright.cuscare.config.ts`. **Va DENTRO de
  `contextOptions`; suelto en `use` no llega** (Playwright 1.60). Lo vigilan `npm run typecheck` y
  `e2e/cuscare/harness.spec.ts`.
- **Mezcla PrimeNG y Angular Material según la pantalla**, con métrica distinta (fila Tickets
  47.5 vs ajustes Material 32.7px); los rótulos **no predicen las rutas** ("Groups" →
  `/settings/entities`); y el botón azul "SC" de abajo a la derecha **es de terceros** — hay un
  test que falla si alguien lo añade.

## Cómo se retoma

```bash
export PATH=/usr/local/bin:$PATH
npx ng build cuscare --configuration production          # una vez
python3 -m http.server 4416 --directory dist/cuscare/browser &
SC_CUSCARE_URL=http://localhost:4416 npx playwright test --config=playwright.cuscare.config.ts
```

Servir el build estático + `SC_CUSCARE_URL` es MÁS RÁPIDO que `ng serve` y no lo bloquea el
guard de reutilización. Para tocar código, reconstruye (el server sirve `dist/`, no el fuente).
