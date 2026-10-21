# Code Connect (piloto)

Enlaza un componente de Figma con su equivalente en código, para que el codegen de
Dev Mode / MCP devuelva el snippet real (`<sc-card>`) en vez de código genérico. Es
el puente formal Figma ↔ código; hoy ese puente en este repo es solo convención
(nombres + change-log de `guia-tokens.md`).

## Estado: publicado (2026-10-21)

18 componentes mapeados en [`code-connect/`](../code-connect/), todos del archivo de la librería
(`Smart-Contact-Design-System`): `button`, `inputtext`, `toggleswitch`, `checkbox`, `divider`, `Section`
(`sc-section-card`), `.Subsection`, `card`, `chip`, `tag`, `select`, `multiselect`, `breadcrumb`, `toast` y los
cuatro del sidebar. Las maquetas del Supervisor usan instancias de esa librería, así que los mapeos les valen.

Sin mapear aún: los masters con uso en el Supervisor (`selectbutton`, `datatable`, `inputnumber`, `dialog`,
`message`, `textarea`…). `datatable` y `breadcrumb` tienen DOS masters en la librería: decide cuál manda antes de
mapear. `sc-empty-state`, `sc-celda-vacia`, `sc-list-page` y `sc-search` no tienen master en Figma.

Cuando Figma tiene tres booleanos y el código un solo valor (en `button`, Outlined/Text/Link frente a
`appearance`), el snippet lleva un comentario con el valor en vez de adivinar.

## Requisitos para publicar (operador)

1. Plan Figma **Organization o Enterprise** con asiento Design/Dev Mode.
2. Un token personal de Figma en `FIGMA_ACCESS_TOKEN`, con los permisos `file_code_connect:write` y
   `file_content:read`. Caduca como máximo a los 90 días: se regenera al volver a publicar. No va en ningún fichero.
3. Que cada propiedad que lee un mapping exista en su master de Figma: si no, `publish` falla al validarla
   (el `parse` local sí pasa).
4. Ejecutarlo desde la raíz del repo (el `package.json` de `~` no vale).

## Comandos

- `npm run figma:connect:parse` — valida los mappings en local, SIN token.
- `npm run figma:connect:publish` — publica los mappings a Figma (requiere el token).

No está enganchado a `verify` ni a CI: publicar es un paso manual del operador.

## Quitarlo

Borra `code-connect/`, `figma.config.json`, los scripts `figma:connect:*` de
`package.json` y la dependencia `@figma/code-connect`. Nada más depende de ello.
