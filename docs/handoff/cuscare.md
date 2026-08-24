# Frente · CusCare — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-24 (s32) — HEAD `f4dd1ce` (el motion de los overlays, apagado en el origen). Contenido previo: `a999a85` (s31).**

`projects/cuscare` replica `cuscare.smart-contact.com/aed`. **Las 9 vistas montadas**, con
valores extraídos del sitio real (no estimados) y **91 tests e2e** (`npm run e2e:cuscare`, en CI).

Funciona de verdad, no es maqueta: filtros, paginación sobre 3280 filas, selección de filas,
gestor de columnas con arrastre, las 4 acciones en bloque con sus paneles y su modal, el paso 2
de "+ New ticket", el panel Summary, los tooltips ⓘ y los avisos de acción.

Contexto completo: [`projects/cuscare/README.md`](../../projects/cuscare/README.md).

## ▶︎ SIGUIENTE — sin preguntar

Por orden. Todo esto se coge y se hace.

1. **Auditar el copy del panel Summary y del detalle** contra las claves `PAGES.TICKET.SUMMARY`
   y `TICKET` de su diccionario
   (`https://cuscare.smart-contact.com/aed/assets/i18n/cuscare/en.json`, 1449 claves). Es donde
   más texto se inventó antes de saber que ese fichero existía.
2. **Ordenación por cabecera en la tabla de Tickets** (la del dashboard sí ordena).
3. **Los iconos del detalle siguen siendo glifos** (📞 🗎 ⚑ …), no los SVG reales.
4. **"Show details"**: nuestro botón alterna estado y no pinta nada. El contenido real no se
   pudo observar (pulsarlo en la app real no cambió nada en el ticket probado).

## ⏸️ Sin resolver (no bloquea)

- El disparador real de **"Right to be forgotten"** y del diálogo de motivo de no reembolso:
  cuelgan de celdas de la barra de metadatos como SUPOSICIÓN anotada en el código.
- El diccionario describe funcionalidad que no se ha visto y quizá sea de otro rol: acción en
  bloque **"Quick response"**, estados **On-hold**, substatus con comentario, y entradas de nav
  **"Statistics"** y **"Data Analyzer"**.

## ⚠️ Trampas de este frente

- **Abrir el detalle de un ticket en la app real CAMBIA su estado.** Navegar a
  `…/tickets/ticket/336458` lo pasó de `new` a **OPEN** y lo asignó a Rafa sin pulsar nada. Para
  medir dentro de una ficha, usa una que YA esté `open`/`resolved` (2050567 no deja rastro) o
  pídeselo a él.
- **No replicar sus bugs**: la clave i18n sin traducir de la tabla del dashboard
  (`PAGES.DASHBOARD.DASHBOARD_TICKETS.TABLE.NONE`) y la errata `QEUE` se dejaron fuera a
  propósito.
- **Los dos loaders de la app duran 380 ms y NO se miran en la pantalla.** Paginar
  (`tickets-page.component.ts`) y buscar (`search-page.component.ts`) encienden y apagan su
  overlay con un `setTimeout(…, 380)`. Un `expect(locator).toBeVisible()` justo tras el clic es
  una CARRERA: si el primer sondeo cae pasados los 380 ms, el nodo ya no existe y Playwright
  reintenta 10 s en vano acusando `element(s) not found` — como si el loader no se hubiera
  pintado nunca. Se afirman con `watchTransient()` (`e2e/cuscare/helpers.ts`), que instala un
  `MutationObserver` ANTES de la acción y anota la aparición cuando ocurre. **Si añades otro
  estado transitorio, úsalo; no subas el timeout** (el problema es llegar tarde, no esperar
  poco).
- **El motion de los overlays está APAGADO, y tiene que seguir apagado.** Los overlays de
  PrimeNG 21 entran escalando (el host `<p-motion>`, de ~0.93 a 1), y como
  `getBoundingClientRect()` arrastra el transform del ancestro, la caja de cada `<li>` cambia
  frame a frame aunque el `<li>` no se mueva. Playwright exige la misma caja en dos frames
  seguidos para clicar, y la cola de esa curva es asintótica: a 454 ms el transform seguía en
  `matrix(0.999992, …)`. Con la máquina cargada pasa de los 90 s del timeout. Se apaga con
  `contextOptions: { reducedMotion: 'reduce' }` en `playwright.cuscare.config.ts`, que hace que
  `@primeuix/motion` (`safe: true` por defecto) se salte la animación entera. **Ojo: va DENTRO
  de `contextOptions`; suelto en `use` no llega** —Playwright 1.60 ya no lo reenvía como opción
  de primer nivel—. Escribirlo suelto ya lo para `npm run typecheck` (2026-08-24: los configs de
  la raíz entran por `tsconfig.harness.json`); antes no lo desmentía ningún gate. Los dos frenos
  hacen falta: `tsc` dice que la opción existe donde la pones, y `e2e/cuscare/harness.spec.ts`
  comprueba que el navegador de verdad está en `reduce`. Si ese test se cae, el arreglo es la
  config, no los otros 90 tests.
- **Mezcla PrimeNG y Angular Material según la pantalla**, con métrica distinta (fila 47.5 vs
  32.7px); los rótulos **no predicen las rutas** ("Groups" → `/settings/entities`); y el botón
  azul "SC" de abajo a la derecha **es de terceros** — hay un test que falla si alguien lo añade.
