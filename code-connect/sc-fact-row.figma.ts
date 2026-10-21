// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15483-99
// source=projects/ui-smartcontact/src/lib/components/fact-row/sc-fact-row.component.ts
// component=ScFactRowComponent

import figma from "figma"

const label = figma.selectedInstance.getString("Clave")
const value = figma.selectedInstance.getString("Valor")
const size = figma.selectedInstance.getEnum("Size", { md: 'size="md"', sm: 'size="sm"' })

// Es una directiva de atributo sobre un div (`div[scFactRow]`), no una etiqueta propia: la clave es
// `label` y el valor se proyecta como contenido. Aviso y el icono del valor de Figma no tienen input
// equivalente; `icon`, `tone` y `href` sí existen si la fila los necesita.
export default {
  id: "fact-row",
  example: figma.code`<div scFactRow label="${label}" ${size}>${value}</div>`,
}
