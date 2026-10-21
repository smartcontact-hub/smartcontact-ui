// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15660-394
// source=projects/supervisor/src/app/shared/components/summary-status/summary-status.component.ts
// component=SummaryStatusComponent

import figma from "figma"

const estado = figma.selectedInstance.getEnum("Estado", {
  Falta: '[missing]="missing()"',
  Listo: '[ready]="true"',
})

// Componente de app (shared/components del Supervisor). «Falta: …» lista lo que impide crear y cada
// elemento lleva a su campo por `(ir)`; «Listo» es `ready`, sin lista.
export default {
  id: "summary-status",
  example: figma.code`<sc-summary-status ${estado} (ir)="irAFalta($event)" />`,
}
