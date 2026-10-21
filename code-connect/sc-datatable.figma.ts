// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15374-66885

import figma from "figma"

const size = figma.selectedInstance.getEnum("Size", { Small: "sm", Default: "md", Large: "lg" })
const showGridlines = figma.selectedInstance.getBoolean("Grid Lines")

// Columns y Rows son slots de Figma: en código son datos (`columns` con ScColumnDef y `value`), no
// contenido proyectado. Container (None/Card) lo pinta el contenedor de la pantalla, no la tabla.
export default {
  id: "datatable",
  example: figma.code`<sc-datatable [value]="rows" [columns]="columns" ${_fcc_renderHtmlAttribute("size", size)} ${_fcc_renderHtmlAttribute("showGridlines", showGridlines)}></sc-datatable>`,
}
