# Frente · Pruebas con personas (modo prueba común) — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.

## ✅ 2026-11-16 · Nace el modo prueba común (DD-256)

> **Sello: rama `claude/pruebas-usuarios`, sobre `origin/main` HEAD `762ab8d8`.**

**Qué es:** desempatar dos o más versiones de una pantalla con 5 a 10 personas. Cada versión es un enlace; el Lab de
sc-docs es la sala de control y el Supervisor, la sala de pruebas. La skill `probar-prototipos` lo monta de punta a punta.

**Dónde vive:**
- Plan de cada prueba: `projects/sc-docs/src/app/pages/lab/pruebas/pruebas.data.ts`.
- La regla y el códec: `prueba.core.mjs` (sc-docs) y `prueba-enlace.core.mjs` (Supervisor; el códec va copiado porque
  cada app tiene su `rootDir`, y la prueba cruza las dos).
- Sala de control: `/#/lab/pruebas/<id>`. Puertas: `/#/prueba/<id>/P3` y `/#/prueba/<id>/P3/fin` (sin marco: `solo` en
  `app.component.ts` de sc-docs). Ensayo: `/#/prueba/<id>/ensayo` (se ve, no cuenta).
- Supervisor: `projects/supervisor/src/app/core/prueba/` — `prueba-arranque.ts` (lee `#prueba=` antes del router, en
  `main.ts`), `prueba.service.ts` (mide), `prueba-capa.component.ts` (lo que ve la persona, con `@defer`),
  `prueba-ganchos.ts` (`registrarPrueba`).
- Pruebas: `scripts/__tests__/prueba-usuarios.test.mjs` (14) y `prueba-informe.test.mjs` (7), en `test:unit`.

**Informe tras la prueba (DD-256 §8):** `informe`, `csvDeResultados` e `informeEnTexto` en `prueba.core.mjs`. TSR con
intervalo, ToT, SEQ, FCS y Lostness (estos dos, del ensayo), y accionables por gravedad. La sala enseña los tres más
graves; «Copiar informe» y «Descargar CSV» dan el resto.

**La sala (DD-256 §9):** marcador, un punto por persona (copia su enlace; se enciende al llegar su código), la caja que
coge los códigos al pegarlos y «Qué arreglar». Lo demás, plegado en «Todo el detalle». Lenguaje del Lab: papel blanco
sobre gris, entrada escalonada de 100 ms, movimiento reducido respetado.

**Primera prueba:** Horarios A (Separado) y B (Junto), 6 personas, una tarea («Dar de alta un festivo») con dos gemelas.
Apunta al preview de `claude-discovery-horarios`, que es de otro hilo.

**Siguiente:**
1. ✅ 2026-11-17 · La rama del discovery (`claude/discovery-horarios`, 66074d23) ya trae `main`, lee `?variante=`,
   registra `reiniciar` y `comprobar` (`cal-prueba-comun.ts`) y esconde su barra antigua. Ensayado en local con su
   build: la variante cambia de paso, la corrección llega a la sala y no hay errores.
2. La gemela 2 pasa del 15 de mayo al 7 de octubre (el 15 de mayo ya era San Isidro en Atención Madrid): el plan, en
   este PR; `FESTIVOS['festivo-2']`, en la rama del discovery.
3. Tras las sesiones: `estado: 'decidida'` y `resultado` con el resumen. Los códigos no entran en el repo.

**Trampas:**
- ⚠️ La capa solo se enciende en `localhost`, `127.0.0.1` y `<rama>.sc-supervisor.pages.dev` (`pruebaPermitida`). En
  producción el enlace de una prueba no hace nada, a propósito.
- ⚠️ La misión es `<tarea>-<vuelta>`: `festivo-1` es la que la persona hace PRIMERO, no la de la versión A.
- ⚠️ Las gemelas han de costar lo mismo: mira en los datos de partida que su día no sea ya festivo en ninguna ubicación ni
  caiga en un periodo de los calendarios que pide. Ensayar sin hacer nada lo delata: las dos deben sacar los mismos puntos.
- ⚠️ sc-docs no tiene `withComponentInputBinding`: los parámetros de ruta se leen con `ActivatedRoute`.
- ⚠️ La caja de códigos se vacía en el turno siguiente (`setTimeout`): vaciarla en el mismo deja la señal de '' a '' y el
  texto pegado se queda a la vista.
- ⚠️ La ruta `/lab/pruebas/` es de portada en `app.component.ts` (`esPortada`): fondo gris y sin «En esta página».
