# LEARNINGS — reglas de proceso ganadas trabajando en este repo

> **Léelo al EMPEZAR una tarea** (no solo al cerrarla). Son reglas de **cómo trabajar**,
> destiladas de errores y aciertos reales, cada una con su evidencia. Lo escribe/afila
> `/reflect` al cerrar cada tarea.
>
> **Formato**: `Disparador → acción`. Si no tiene disparador, no sirve: nunca se dispara.
> **Regla de higiene**: esto se **afila, no se acumula**. Tope ~20 entradas. Si una nueva
> lección solapa con otra, funde ambas en la más fuerte. Un fichero largo no se lee, y uno
> que no se lee no mejora nada.
>
> Ámbito: reglas de proceso **del repo**, versionadas y visibles para todo el mundo. Los
> hechos del proyecto (arquitectura, decisiones, estado) NO van aquí: van a `docs/` y a
> `NEXT-SESSION.md`.

## Verificación (lo que más caro me ha salido)

1. **Vas a concluir "X no funciona" a partir de una interacción por herramienta → primero
   demuestra que tu estímulo LLEGÓ.** Un negativo salido de un canal sin validar no es
   evidencia. *Evidencia (s11)*: afirmé —subrayando "reproducible"— que las filas de
   `sc-datatable` no se activaban con Enter; la acción `key` del navegador entrega los eventos
   con `key`/`code` **vacíos**, y sin un clic previo en la página ni llegan. Tuve que
   retractarme. Instrumenta con un `addEventListener` de una línea; si no puedes probarlo, el
   veredicto es **"sin verificar"**, nunca "roto".

2. **Dos validadores que comparten el modo de fallo NO se corroboran.** *Evidencia (s11)*: creí
   confirmar lo anterior porque un `dispatchEvent` sintético también "fallaba" — pero ninguno
   de los dos puede disparar la activación nativa de un enlace. Antes de sumar una segunda
   señal, pregunta si puede fallar por la misma causa que la primera.

3. **Vas a atribuir un warning/error a tu cambio (o a "ya estaba") → pruébalo con
   stash-y-reproduce.** Cuesta ~2 llamadas y convierte "creo" en "comprobado". *Evidencia
   (s11)*: el warning de presupuesto SÍ era mío (lo arreglé borrando CSS muerto en vez de
   recortar diseño); los errores de View Transitions NO lo eran (mismos errores sin mi cambio).

4. **Compruebas el DOM en la misma llamada síncrona que dispara la acción → falso negativo.**
   Angular aún no ha renderizado. *Evidencia (s11)*: el lightbox y un `p-menu` salieron
   "cerrados" justo tras el click, y estaban abiertos. Dispara en una llamada, comprueba en otra.

## Gates y push

5. **El commit toca componentes (`sc-*`, plantillas) y va a `git push` → corre `npm run verify`
   ENTERO antes, no un subset.** "AOT verde" NO basta: el AOT caza plantillas pero no corre
   `test:unit` ni `audit:components`. *Evidencia (s11)*: racionalicé el subset y pusheé; luego,
   en el piloto de `sc-button`, el verify completo cazó el desfase de `audit:components`
   (`sc-button` 9→12 usos) que el subset se habría comido. Fix: `node
   scripts/component-audit.mjs --write` + commitea `docs/inventory.md` + `_component-status.json`.

6. **Vas a crear un `.md` nuevo en el repo → regístralo en `docs/DOCS-INDEX.md` en el mismo
   commit.** `docs:guard` escanea **todos** los `.md` (docs/ recursivo + raíz) y exige mapeo por
   basename; solo `README.md` y el propio índice están exentos. Sin registrar = `verify` rojo.

7. **Confirma el verde LEYENDO el log o el run**, nunca el exit-code de un proceso en background
   (puede ser espurio). *Evidencia (s11)*: confirmé el CI con `gh run view --json conclusion`,
   no con el `EXIT=0` del watcher.

## Alcance y ediciones

8. **Un item de audit/plan redactado como "solo hay que…" o "nada usa X" → verifica su
   precondición literal contra el código antes de ejecutarlo.** *Evidencia (s11)*: 4 de 4 items
   del `AUDIT-2026-07` eran más grandes o falsos — "nada los lee" era falso (lo leía el plumbing
   de load/save/duplicate), y los PrimeIcons eran PrimeIcons **de verdad**, no mapeados por
   ningún resolver como yo había hipotetizado.

9. **Toda edición masiva por shell lleva su verificación de outcome PEGADA en el mismo comando.**
   *Evidencia (s11)*: un `for f in $FILES` con lista multilínea **no hizo nada** (zsh no hace
   word-splitting como bash); lo cazó el `grep "pi pi-" || echo ninguno` del final. Sin él habría
   commiteado una migración de 12 iconos inexistente. En zsh, enumera los ficheros explícitamente.

10. **Antes de dar una cifra de alcance ("N usos"), comprueba QUÉ está contando tu grep.**
    *Evidencia (s11)*: dije "111 usos de `p-button`" y escribí eso en el hand-off; los
    `<p-button>` reales eran **50** — el resto eran etiquetas de cierre y clases CSS. Acota el
    match a la etiqueta real antes de dimensionar una migración.

## Entrega

11. **Con un "hazlo todo" / "adelante con todo": haz lo que puedas verificar de punta a punta,
    aparca lo demás DOCUMENTADO, y dilo explícitamente.** No lo pintes como "todo hecho".
    *Evidencia (s11)*: cerré lo acotado del Bloque 3 y dejé por escrito por qué `sc-button`
    (piloto hecho, resto por lotes), `sc-datatable`, Bloque 4 y 2b no entraban.

12. **Si una decisión es de marca/producto (no técnica), preséntala con recomendación y
    evidencia — no la decidas tú.** *Evidencia (s11)*: el estilo de icono (Outlined vs Rounded)
    tenía drift en 3 sitios y el hand-off recomendaba lo contrario que el código de las apps;
    plantearlo evitó revertir una decisión de marca ya tomada.
