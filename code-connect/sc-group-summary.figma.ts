// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15486-255
// source=projects/supervisor/src/app/features/admin/groups/components/group-summary/group-summary.component.ts
// component=GroupSummaryComponent

import figma from "figma"

const estado = figma.selectedInstance.getEnum("Estado", {
  "Edición": "",
  "Alta sin agentes": '[creating]="true"',
  "Alta con agentes": '[creating]="true"',
})

// Componente de app (grupos del Supervisor). El estado de Figma se deriva, no se pasa: «Edición» es
// `creating` apagado; «Alta» lo enciende. «Mostrar estado» es `creating() || missing().length > 0`, y
// «Deshabilitados» sale de `links` (los agentes pausados), no de un input. `hrefs` lleva el enlace de
// cada tarjeta a su sección del formulario.
export default {
  id: "group-summary",
  example: figma.code`<sc-group-summary [channels]="channels()" [links]="links()" [hrefs]="hrefs" [missing]="missing()" [ready]="ready()" ${estado} (ir)="irA($event)" (irAFalta)="irAFalta($event)" />`,
}
