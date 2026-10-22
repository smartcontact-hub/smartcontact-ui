// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=13864-202
// source=projects/supervisor/src/app/shared/components/summary-kpi/summary-kpi.component.ts
// component=SummaryKpiComponent

import figma from "figma"

const size = figma.selectedInstance.getEnum("Size", {
  Default: "",
  Compact: "[compact]=\"true\"",
  Comfortable: "",
  Large: "",
})

// Componente de app (shared/components del Supervisor). El master vive en la página Testing de la librería.
// Del Size de Figma solo Compact tiene input (`compact`); Default, Comfortable y Large no existen en código.
// `labelKey` y `noteKey` son CLAVES de traducción. Con `of` la tarjeta pinta «value/of» y el anillo.
export default {
  id: "summary-kpi",
  example: figma.code`<sc-summary-kpi icon="headphones" labelKey="…" [value]="valor" [of]="total" ${size} (abrir)="ir()">
  …
</sc-summary-kpi>`,
}
