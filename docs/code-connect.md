# Code Connect (piloto)

Enlaza un componente de Figma con su equivalente en código, para que el codegen de
Dev Mode / MCP devuelva el snippet real (`<sc-card>`) en vez de código genérico. Es
el puente formal Figma ↔ código; hoy ese puente en este repo es solo convención
(nombres + change-log de `guia-tokens.md`).

## Estado: publicado (2026-10-21)

46 componentes mapeados en [`code-connect/`](../code-connect/), todos del archivo de la librería
(`Smart-Contact-Design-System`): los 24 anteriores más `group-summary`, `summary-status`, `channel-icon`,
`fileupload`, `drawer`, `fact-row`, `icon-tile`, y los masters aparte del botón grande y pequeño (`button-large`,
`button-small`), y los de uso suelto en las apps: `badge`, `avatar`, `radiobutton`, `password`, `panel`,
`inputgroup`, `datepicker`, `confirmdialog`, `tabs`, `skeleton`, y tres masters que diseño confirmó como los de su componente (2026-10-22):
`KPI Metric Card` (página Testing, `13864:202`) como `sc-summary-kpi`, `inplace` (`340:12980`, el genérico de PrimeNG)
como `sc-name-inplace` y `popover` (`605:37190`, el genérico) como `sc-group-popover`. Las maquetas del Supervisor usan instancias de esa librería, así
que los mapeos les valen.

Cada plantilla lleva en la cabecera `// source=` (ruta del componente en el repo) y `// component=` (su clase), que
Figma enseña junto al snippet. Si mueves o renombras un componente, actualiza esas dos líneas.

Sin master en la librería (buscado por nombre en las 113 páginas del archivo, también entre los componentes sin
publicar, el 2026-10-22): `sc-empty-state`, `sc-celda-vacia`, `sc-list-page`, `sc-search`, `sc-form-section-nav`,
`sc-option-cards`, `sc-slot`, `sc-resource-option`, `sc-alta-pie`, `sc-link-button` y `sc-inputtags`: primero hay que
crear el master.

Sin mapear a propósito: `agent-summary` (`15510:72604`), que en código es una composición de `sc-summary-kpi` y
`sc-fact-row`, no un componente. `datatable` mapea el master vivo (`15374:66885`, 18 instancias), no el de la página archivada (`374:16034`).

**Mantenimiento.** Un mapping es un fichero fijo que se publica a mano: editar el componente no lo actualiza, y
renombrar una propiedad o una variante en Figma lo rompe en silencio. `npm run audit:code-connect` (en `verify`)
vigila lo que se puede medir sin token: que cada `source` exista, que cada `component` sea una clase suya, que no
haya helpers que Figma no define ni nodos o `id` repetidos. Las propiedades contra el master de Figma piden token:
`figma connect publish --dry-run` en el CI, o `list_file_components_for_code_connect` del MCP de Figma a mano.

Cuando Figma tiene tres booleanos y el código un solo valor (en `button`, Outlined/Text/Link frente a
`appearance`), el snippet lleva un comentario con el valor en vez de adivinar.

**Plantillas sin helpers.** El visor de Figma NO define `_fcc_renderHtmlAttribute` (ni `_fcc_renderHtmlValue`): un
mapping que los use publica bien pero en Dev Mode muestra «Error with Code Connect … is not defined». Las plantillas
de `code-connect/` interpolan directamente: los booleanos y enums se mapean al fragmento de atributo completo
(`{ true: "disabled", false: "" }`, `Small: 'size="sm"'`) y se escriben como `${disabled}`; los textos, como
`label="${label}"`.

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
