---
name: probar-prototipos
description: Desempata dos o más versiones de una pantalla con personas reales usando el modo prueba común (DD-256) — plan con misiones gemelas, alta en el Lab de sc-docs, enlaces por persona y veredicto. Úsala cuando pidan comparar, probar con usuarios o con gente, o desempatar prototipos, ramas o variantes.
---

# /probar-prototipos

Tu trabajo es que una prueba con personas se monte en minutos y diga la verdad: qué versión gana o que, con tan pocas
personas, no se puede saber. El usuario no tiene que tocar código ni entender la regla: le das UN enlace, la sala de
control del Lab, y allí está todo.

**Nombre**: es el «modo prueba común». Nunca «kit»: en este proyecto el Kit es el de Figma.

## Lo que ya existe (no lo reconstruyas)

- **Supervisor** · `projects/supervisor/src/app/core/prueba/`: la capa que guía a la persona (tarea, «Necesito ayuda»,
  «He terminado», facilidad 1–7) y mide sin enseñar reloj ni contadores. Llega a toda rama que traiga `main`, se carga
  aparte (`@defer`) y solo se activa con el enlace de una prueba en `localhost` o en un preview de rama
  (`<rama>.sc-supervisor.pages.dev`), nunca en producción.
- **sc-docs** · `projects/sc-docs/src/app/pages/lab/pruebas/`: el plan (`pruebas.data.ts`), la puerta de cada persona
  (`/#/prueba/<id>/P3`), el final con su código (`…/fin`) y la sala de control (`/#/lab/pruebas/<id>`) con enlaces,
  guía de quien modera, caja para pegar códigos y veredicto.
- **La regla** · `prueba.core.mjs` (`veredicto`), con pruebas en `scripts/__tests__/prueba-usuarios.test.mjs`. La decisión
  y sus descartes, en DD-256.

## Pasos

1. **Cierra el plan** con lo que ya sepas; pregunta solo lo que falte, en una pregunta:
   - Qué se decide, en una pregunta con «¿Con qué versión… sin ayuda?».
   - Las versiones: cada una es **un enlace**. Otra rama → su preview; la misma rama con un parámetro →
     `?variante=A`. Nómbralas por lo que son («Separado», «Junto»), no «la buena».
   - De 1 a 3 tareas cortas, cada una con **una misión gemela por versión**: el mismo trabajo con otros datos y la misma
     dificultad, para que nadie repita en la segunda versión lo que ya resolvió en la primera.
   - Personas: 6 por defecto (de 5 a 10). Con menos de 5 la regla nunca da ganadora; dilo antes de empezar.

2. **Prepara cada rama** (si no, la prueba igual funciona: quien modera marca si salió bien):
   - Que traiga `main` (si no, no tiene el modo prueba).
   - Si la versión es un parámetro, que lo lea de la dirección (`?variante=`): la sesión llega en `#prueba=…` y el
     arranque la quita, la consulta se queda.
   - Que **corrija sola** y empiece limpia, registrando sus ganchos al arrancar:
     ```ts
     provideAppInitializer(() =>
       registrarPrueba({
         reiniciar: (mision) => { /* deja los datos como empieza la misión */ },
         comprobar: (mision) => ({ bien: 3, total: 4, titular: 'Falta Secretaría Barcelona' }),
       }),
     );
     ```
     La misión es `<tarea>-<vuelta>`: `festivo-1` es la gemela que la persona hace PRIMERO, sea cual sea la versión.
     `comprobar` mira los datos de esa gemela en las dos versiones.
   - Que esconda sus propias barras de prueba si las tiene (`pruebaEnCurso()` de `prueba-arranque.ts`).
   - Que el enlace de cada versión abra donde empieza la tarea de verdad (encontrar el sitio es parte de la tarea).

3. **Dala de alta** en `pruebas.data.ts`: `estado: 'preparada'` y, si corrige sola, `correccion` en llano («Comprueba
   sola que…»). Con eso el Lab ya enseña la tarjeta y la sala de control.

4. **Ensáyala** con Playwright en el preview: abre `/#/prueba/<id>/ensayo`, «Empezar», haz la misión, «He terminado»,
   valora, y comprueba que el código llega a la sala de control y el veredicto lo lee. El ensayo se ve, pero no cuenta.

5. **Entrega UN enlace**: la sala de control (`https://sc-doc.pages.dev/#/lab/pruebas/<id>`, o el preview de sc-docs si
   aún no está en `main`). Ahí están los enlaces de cada persona, la guía de la sesión y la caja de los códigos.

6. **Lee el resultado** cuando te lo pidan: el veredicto sale solo en la sala. Si te pegan los códigos en el chat,
   calcúlalo con `leerResultados` y `veredicto` de `prueba.core.mjs` en Node, sin inventar cifras. Al decidir, pasa la
   prueba a `estado: 'decidida'` con `resultado: { fecha, resumen }`: solo el resumen.

## Qué se mide y por qué

- **Decide**: resuelta bien y **sin ayuda**. Luego la facilidad (pregunta única 1–7), luego el tiempo (solo si una tarda
  la mitad más que la otra), luego la preferencia. Una diferencia solo cuenta con la prueba de signos exacta, p < 0,10:
  con 6 personas, 5 a 0. Si no, «Empate» y decide lo que se vio en las sesiones. No lo maquilles.
- **Explica, no decide**: primer clic (con dónde), clics en vacío, pantallas recorridas y en qué momento se pidió ayuda.
- **No**: mapas de calor (con 6 personas no dicen nada), SUS (para una tarea es demasiado), grabar la pantalla (la
  llamada ya graba, si la persona quiere), analítica de terceros.

## Privacidad (el repo es público)

- Las personas son P1, P2…; sus nombres nunca entran en el repo, ni en commits ni en la skill.
- Datos reales en las misiones, siempre anonimizados.
- Los códigos y los `.json` que manda cada persona no se commitean: se quedan en el navegador de quien modera.
- Nada sale del navegador de la persona hasta que ella copia su código.

## Límites de hoy

- La capa solo existe en el Supervisor. Para otra app, porta `core/prueba/` y su arranque en `main.ts`.
- Sin servidor: los resultados viajan copiando un código. Si un día hacen falta muchas personas o remoto sin moderador,
  eso es otra decisión (DD-256, «Descartadas»).
