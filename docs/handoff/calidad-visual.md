# Frente · Calidad visual — agrupación, revisión previa, datos de prueba y referencias — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**. Lo durable vive en `docs/`:
> las decisiones en DD-122 y DD-123, la regla en AGENTS §«UX de pantalla» 9, el Kit en `docs/figma-pendiente.md`
> (ficha 15) y las referencias en `docs/referencias-contact-center.md`.
>
> **Por qué existe este frente.** Nace el 2026-09-27 de contrastar el repo con una lista de consejos de UI (espacio,
> agrupación, referencias, fotografía, iterar hasta estar contento, IA que critica en vez de diseñar). El repo era
> riguroso con la FIDELIDAD (tokens, componentes, el Kit) y no con el JUICIO visual: la agrupación no se medía y el
> primer filtro visual era el usuario. El sello va debajo del título de cada tramo; el de más arriba es el vigente.

## ▶︎ SIGUIENTE — sin preguntar

1. **Pasar `npm run revision -- --datos tortura` por el resto de pantallas** (fichas de grupo y usuario, repositorios,
   Config) y llevar lo que se rompa a la decisión de DD-102 de abajo, con su medida. Lo de agentes, grupos y usuarios
   ya está medido en DD-123.
2. **Cuando se decida el pie de los diálogos** (abajo): aplicarlo y borrar sus tres líneas de `CONOCIDOS` en
   `e2e/supervisor/agrupacion.spec.ts`; la prueba se pone roja si se quedan cuando ya están en verde.
3. **Cuando lleguen los nombres del juego editorial**: una tabla por id en `core/services/juego-de-datos.ts`, con su
   `?datos=editorial`, siguiendo el molde de `tortura`.

## ⏸️ ESPERANDO A RAFA — NO preguntar

- **El pie de los diálogos nativos** («Nueva entidad», «Nueva categoría», «Duplicar grupo»): los botones quedan a 18
  del último campo, contra 14–15,75 entre campos. ¿Más aire en el pie desde el tema (todos los diálogos; desvío del
  nativo por token, DD-113 §2, y al Kit) o solo en esos formularios? (DD-122, «Pendiente».)
- **DD-102 con datos reales**: con `?datos=tortura` las listas cortan 14 nombres de grupo, 28 celdas de agentes y 6
  correos. ¿Anchos medidos con los datos que haya, desplazamiento lateral, o cortar con el texto entero al pasar el
  ratón? (DD-123, «Lo primero que enseñó».)
- **Los nombres del juego editorial** (propuesta en DD-123).
- **La ficha 15 de figma-pendiente**: filas de formulario y radios a 14 en las maquetas de Grupos y Servicio.
- **Los análisis de Telegram y WhatsApp** viven en `~/Documents/Claude/2026-09 teardown admin usuarios-grupos/`, fuera
  del repo: traerlos a `docs/` para que otra sesión (o la nube) los pueda leer.
- **`npm run correcciones` en su máquina**: el registro de correcciones vive allí; en una sesión en la nube se pierde
  al cerrar el contenedor.

## ✅ 2026-09-27 · La agrupación por espacio manda y se mide; revisión previa; juego de tortura; referencias

**Sello:** rama `claude/ui-improvement-reddit-iykxgx`, HEAD `9339e35f` (los tres cambios de código; la documentación va
en los commits siguientes de la misma rama).

**Qué pasó.**
- **Recuento** (build de producción a 1440, 34 rutas con sus pestañas = 56 vistas, 12 diálogos de alta y «Duplicar»):
  antes, 10 vistas en 5 pantallas y 4 diálogos por debajo del doble; después, 0 vistas y 3 diálogos, los tres por el
  pie nativo (arriba).
- **Arreglo en las piezas compartidas**: `.grid` y `sc-group-identity-fields` (fila 12,25 → 14), `.radio-row`
  (12,25 → 14), botón del acceso y del panel «Nueva label» a 28 del último campo.
- **`e2e/supervisor/agrupacion.spec.ts`** + `agrupacion-medida.js`: 7 tests en rojo contra el build anterior, 48 en
  verde con el arreglo. La primera sonda dio rojos falsos: la etiqueta del DS vive en un `sc-field-label` con
  `display: contents` y `sc-textarea` es en línea (su caja no es lo que se ve). Está escrito en la cabecera de la medida.
- **`npm run revision`** (captura + medida) y el recordatorio en `stop-guard.mjs`; **`npm run correcciones`** y tres
  patrones visuales nuevos en `correction-capture`; **`?datos=tortura`** en `createVersionedStorage`.
- **Suite e2e del Supervisor entera** contra el build: 326 en verde y 2 en rojo que NO son de este cambio, medido
  contra el build anterior: `dashboard.spec.ts:62` a 768 px (scroll lateral de 45, igual antes y después) y
  `listado-grupos.spec.ts:137` («Agentes» 150>120, inestable: 2 de 3 rojos también antes). Corrieron con el Chromium
  del contenedor, de otra versión que el Playwright del repo.

**Trampas de esta sesión.** Una sesión en la nube necesita Node ≥ 22.22.3 para `ng` y trae un Chromium de otra versión:
`SC_CHROMIUM=/opt/pw-browsers/chromium` para `npm run revision`, y una config de Playwright FUERA del árbol para las
suites (un `.ts` dentro lo caza `typecheck-coverage`, y bajo `node_modules` Node no lo carga). Sin `git fetch --tags`,
`docs:coherence` da por fantasmas los sellos de dos hand-offs que viven en etiquetas.
