// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=14238-4140
// source=projects/ui-smartcontact/src/lib/components/custom-modal/sc-custom-modal.component.ts
// component=ScCustomModalComponent

import figma from "figma"

const title = figma.selectedInstance.getString("Edit header")
const subtitle = figma.selectedInstance.getBoolean("Show Subheader", {
  true: ` subtitle="${figma.selectedInstance.getString("Edit placeholder")}"`,
  false: "",
})
const icon = figma.selectedInstance.getBoolean("Show icon", { true: ' icon="…"', false: "" })
const footer = figma.selectedInstance.getBoolean("Show footer", {
  true: `
  <sc-button scCustomModalFooter label="Cancelar" appearance="text" (clicked)="close()" />
  <sc-button scCustomModalFooter label="Guardar" (clicked)="save()" />`,
  false: "",
})
// La carcasa no tiene tono, como la de los devs: un modal con tono es sc-alert-modal, con su `variant` (DD-240).

// Va en la plantilla de un componente de contenido con `static scDynamicDialogDefaults =
// SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS`, que se abre con ScDynamicDialogService.open(…).
export default {
  id: "custom-modal",
  example: figma.code`<sc-custom-modal title="${title}"${subtitle}${icon} [closeRequested]="close">
  <div scCustomModalBody>…</div>${footer}
</sc-custom-modal>`,
}
