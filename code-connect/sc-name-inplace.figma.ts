// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=340-12980
// source=projects/supervisor/src/app/shared/components/name-inplace/name-inplace.component.ts
// component=NameInplaceComponent

import figma from "figma"

const estado = figma.selectedInstance.getEnum("Active", {
  False: "mostrando el nombre",
  True: "editándolo",
})

// Componente de app (shared/components del Supervisor) que envuelve el `p-inplace` de PrimeNG: el master de
// Figma es el genérico. `name` es el nombre actual (el texto del display), `label` su nombre accesible y
// `(nameChange)` lo que se guarda. Active y State (Idle/Hover) no son inputs: salen de si se está editando.
export default {
  id: "name-inplace",
  example: figma.code`<!-- Active en Figma: ${estado} -->
<sc-name-inplace [name]="nombre" label="…" [error]="error" (nameChange)="guardar($event)" />`,
}
