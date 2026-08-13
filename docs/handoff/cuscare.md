# Frente · CusCare — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/`.
> **Sello: 2026-08-12 (s26) — HEAD `3891327`.**

`projects/cuscare` replica `cuscare.smart-contact.com/aed`. **Las 9 vistas montadas**, con
valores extraídos del sitio real (no estimados) y **90 tests e2e** (`npm run e2e:cuscare`, en CI).

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
- **Mezcla PrimeNG y Angular Material según la pantalla**, con métrica distinta (fila 47.5 vs
  32.7px); los rótulos **no predicen las rutas** ("Groups" → `/settings/entities`); y el botón
  azul "SC" de abajo a la derecha **es de terceros** — hay un test que falla si alguien lo añade.
