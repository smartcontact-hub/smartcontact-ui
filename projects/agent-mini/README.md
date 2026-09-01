# Agent Mini (dialpad standalone)

El **Comunicador** de SmartContact como producto SUELTO a pantalla completa, para el
usuario que quiere el dialpad abierto al lado sin el dashboard del agente. Es un
**"primo" autocontenido** de [`agent`](../agent/README.md): cara propia (medidas
`vw`/`vh` reales de la extensión, relativas a la ventana), **estado propio**
([`mini-state.service.ts`](./src/app/mini-state.service.ts)) y **reutiliza los iconos
de `agent`** como assets (`angular.json` apunta `projects/agent/public`). **Sin DS/PrimeNG**
(el Comunicador no usa componentes del Design System), así que su build no compila el DS.

> ¿Por qué autocontenido y no importar el Comunicador de `agent`? El `rootDir` de cada
> `tsconfig` impide importar fuentes de otro proyecto (la misma razón por la que la
> licencia de PrimeUI está duplicada en las 4 apps). Y el CSS de `agent` está calibrado
> como **widget** (17vw), no como mini a pantalla completa. Se comparten iconos + el
> modelo de datos (los 9 estados, la regla de `canCall`, el rojo `#762727`), no el código.

> Réplica fiel de `comunicatormini.smart-contact.com/aed`. Origen medido en
> [docs/MEASURED.md](./docs/MEASURED.md) y [docs/CODE-FINDINGS.md](./docs/CODE-FINDINGS.md).

## Estado (v1)

- **Hecho**: dialpad en reposo (teclado numérico, borrar, selector de servicio, botón
  llamar), navbar de 5 pestañas, y la **barra de estado** inferior con los 9 estados y
  el **enlace real**: poner «No disponible» tiñe la navbar de rojo (`#762727`) y desactiva
  el botón de llamar.
- **Vacío** (como el entorno de desarrollo real): chat / agentes / agenda / historial.
- **Pendiente**: vista EN LLAMADA (colgar / mute / tipificar), Ajustes (engranaje), fuentes
  self-hospedadas (ahora se sirven Roboto/Open Sans por Google), y afinado fino de gaps.

## Local

- Dev server: `npm run serve:agent-mini` (puerto 4291).
- Build prod: `npm run build:agent-mini` → `dist/agent-mini/browser` (builder `application`:
  el `index.html` queda anidado bajo `browser/`).

## Deploy (Cloudflare Pages)

Proyecto Pages nuevo apuntando a este repo con:

- **Build command**: `npm run build:agent-mini`
- **Output dir**: `dist/agent-mini/browser` (⚠️ NO `dist/agent-mini` — da 404, falta el `index.html`)
- **Env**: `NODE_VERSION` = `22.23.2` (el build necesita Node 22; pisa `.node-version`)
- **SPA fallback**: cubierto por `_redirects` (se reutiliza el de `agent/public`, que se
  copia dentro de `browser/`).
