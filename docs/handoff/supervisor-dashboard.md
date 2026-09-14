# Frente · Supervisor Dashboard — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.

## ✅ 2026-09-14 · El Monitor del Supervisor queda adaptado y subido en su rama, para iterar con Rafa

> **Sello: rama `arebury/dashboard-adapt-supervisor-monitor` (caja `volute`), sobre `origin/main` HEAD `a9f7c19`,
> con PR abierto SIN fundir: Rafa pidió subirlo e iterar después sobre las decisiones de abajo.**
> Local: `npm run ng -- serve supervisor --port 4311` → `http://localhost:4311/dashboard`.

**Qué hay.** Adaptación del «Monitor» del Supervisor real (`supervisor.smart-contact.com/aed/#/private/monitor`)
en `projects/supervisor/src/app/features/dashboard/`: pestañas de monitores con arrastre, rejilla de
cajas (una o cuatro), 16 tipos de widget del catálogo real con datos demo que laten cada 8 s, alertas
por umbral con campana y «marcar como vistas», panel lateral de detalle al pulsar una cifra, asistente
para crear o editar widget, carrusel, modo pared (pantalla completa) y responsive a 1440/1024/768/390.
Persiste en `localStorage` (`sc-dashboard-monitors`, versión 1).

**Fuera de la carpeta:**
- `supervision.routes.ts`: la ruta `dashboard` carga `dashboard.routes.ts`; bloque `dashboard` en los 4 `i18n/*.json`.
- DS: pie de tabla en `sc-preset/css.ts` (`sc-datatable .p-datatable-tfoot td` a body-2 semibold, tope
  del preset en `audit:primeng-coupling` 59 → 60 con su motivo) y `max` en `sc-gauge` (anillo contra un
  total mayor que la suma; ejemplo «Sobre un total» en su página de sc-docs).
- `audit:datatables`: lista `NO_SON_LISTA` (las dos tablas del Dashboard no son pantallas de lista) y la
  regla 3 ya no confunde las ranuras de `sc-datatable` (`#footer`…) con plantillas de celda.
- `e2e/supervisor/dashboard.spec.ts`: el asistente no cambia de tamaño y la rejilla cabe a 4 anchos
  (las dos mitades vistas en rojo con el fallo fabricado).

**Estudio y capturas del original:** `~/Documents/Claude/2026-09 dashboard monitor/` (ESTUDIO.md,
`catalogo-widgets.json`, `captura/`, y las sondas de Playwright en `sondas/`, que apuntan a
`node_modules` de `volute`). El perfil con la sesión de Rafa en el Supervisor ya está borrado.

## SIGUIENTE

1. **Cuando fusione el PR #183 de `sc-panel` (`#icons` + `fill`)**: pasar `widget-card` a `sc-panel` y
   correr `dashboard.spec.ts` + la sonda `v3`.
2. **ESPERANDO A RAFA** (no se pregunta, él lo saca):
   - Umbrales: paso «Avisar cuando» en el asistente y objetivo visible en el widget (hoy fijos en `data/alerts.ts`).
   - Plantillas + «Restablecer» por monitor (en vez de «volver a la demo»).
   - Aceptar o quitar los dos cambios del DS (pie de tabla, `sc-gauge max`).
   - Barras de `p-metergroup` a 7px (antes 3,5).
   - Línea bajo las pestañas: acaba tras «+ Monitor»; recomendación, alargarla a toda la cabecera.
   - Cuándo fundir el PR.

**No tocar:** `docs/figma-pendiente.md` ni las piezas del DS que lleva hind (tabs, panel).
