// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=505-29350
// source=projects/ui-smartcontact/src/lib/components/fileupload/sc-fileupload.component.ts
// component=ScFileUploadComponent

import figma from "figma"

const mode = figma.selectedInstance.getEnum("Type", {
  Advanced: 'mode="advanced"',
  Basic: 'mode="basic"',
})
const state = figma.selectedInstance.getEnum("State", {
  Idle: "reposo",
  Ready: "con ficheros elegidos, sin subir",
  Uploaded: "subidos: `saved` los lista",
  Error: "rechazado por tamaño o tipo (maxFileSize, accept)",
})

// State no es un input: sale de lo que el usuario elige y de `saved`. Los límites son `maxFileSize` (bytes),
// `fileLimit` y `accept`.
export default {
  id: "fileupload",
  example: figma.code`<!-- State en Figma: ${state} -->
<sc-fileupload ${mode} [accept]="accept" [maxFileSize]="maxFileSize" [saved]="saved()" />`,
}
