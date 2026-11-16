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
- Pruebas: `scripts/__tests__/prueba-usuarios.test.mjs` (14, en `test:unit`).

**Primera prueba:** Horarios A (Separado) y B (Junto), 6 personas, una tarea («Dar de alta un festivo») con dos gemelas.
Apunta al preview de `claude-discovery-horarios`, que es de otro hilo.

**Siguiente:**
1. La rama del discovery (no la toques desde aquí): trae `main`, lee `?variante=`, registra `reiniciar` y `comprobar`
   para `festivo-1` (28 de enero, Oficinas Barcelona y Secretaría Barcelona) y `festivo-2` (15 de mayo, Atención
   Madrid y Soporte Sevilla), y esconde su barra de prueba antigua cuando `pruebaEnCurso()`.
2. Ensayar la de Horarios en el preview con Playwright (`/#/prueba/horarios/ensayo`) cuando el discovery tenga `main`.
3. Tras las sesiones: `estado: 'decidida'` y `resultado` con el resumen. Los códigos no entran en el repo.

**Trampas:**
- ⚠️ La capa solo se enciende en `localhost`, `127.0.0.1` y `<rama>.sc-supervisor.pages.dev` (`pruebaPermitida`). En
  producción el enlace de una prueba no hace nada, a propósito.
- ⚠️ La misión es `<tarea>-<vuelta>`: `festivo-1` es la que la persona hace PRIMERO, no la de la versión A.
- ⚠️ sc-docs no tiene `withComponentInputBinding`: los parámetros de ruta se leen con `ActivatedRoute`.
