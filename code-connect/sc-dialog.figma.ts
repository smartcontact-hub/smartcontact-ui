// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=243-9556
// source=projects/ui-smartcontact/src/lib/components/custom-modal/sc-custom-modal.component.ts
// component=ScCustomModalComponent

import figma from "figma"

const header = figma.selectedInstance.getString("Header")
const content = figma.selectedInstance.getString("Content")
// showCloseButton vale true por defecto: solo se escribe cuando Figma lo apaga.
const closable = figma.selectedInstance.getBoolean("Closable", { true: "", false: ' [showCloseButton]="false"' })
const footer = figma.selectedInstance.getBoolean("Show Footer", {
  true: `
  <sc-button scCustomModalFooter label="Cancelar" variant="primary" appearance="text" (clicked)="close()" />
  <sc-button scCustomModalFooter label="Guardar" (clicked)="save()" />`,
  false: "",
})

// El Dialog del Kit se construye en código con sc-custom-modal (sc-dialog se retira, DD-240): la carcasa va en un
// componente de contenido abierto con ScDynamicDialogService.open(…).
export default {
  id: "dialog",
  example: figma.code`<sc-custom-modal title="${header}"${closable} [closeRequested]="close">
  <div scCustomModalBody>${content}</div>${footer}
</sc-custom-modal>`,
}
