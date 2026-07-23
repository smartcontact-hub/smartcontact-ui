# Code Connect (piloto)

Enlaza un componente de Figma con su equivalente en código, para que el codegen de
Dev Mode / MCP devuelva el snippet real (`<sc-card>`) en vez de código genérico. Es
el puente formal Figma ↔ código; hoy ese puente en este repo es solo convención
(nombres + change-log de `guia-tokens.md`).

## Estado: PILOTO

Un solo componente mapeado a propósito: `card` → `sc-card`
([`code-connect/sc-card.figma.ts`](../code-connect/sc-card.figma.ts)). Se prueba el
flujo end-to-end sobre uno antes de decidir el resto de wrappers.

## Requisitos para publicar (operador)

1. Plan Figma **Organization o Enterprise** con asiento Design/Dev Mode.
2. Un token de acceso de Figma en la variable `FIGMA_ACCESS_TOKEN`.
3. Que el master `card` tenga ya la propiedad booleana **"Show Icon"** (la añade
   diseño en Figma). La prop `icon` del mapping se resuelve de ahí; hasta que exista,
   `publish` falla al validarla (el `parse` local sí pasa).

## Comandos

- `npm run figma:connect:parse` — valida el mapping en local, SIN token.
- `npm run figma:connect:publish` — publica el mapping a Figma (requiere el token).

No está enganchado a `verify` ni a CI: publicar es un paso manual del operador.

## Quitarlo

Borra `code-connect/`, `figma.config.json`, los scripts `figma:connect:*` de
`package.json` y la dependencia `@figma/code-connect`. Nada más depende de ello.
