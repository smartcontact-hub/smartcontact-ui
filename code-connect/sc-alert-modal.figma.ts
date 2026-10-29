// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15876-698
// source=projects/ui-smartcontact/src/lib/components/alert-modal/sc-alert-modal.component.ts
// component=ScAlertModalComponent

import figma from "figma"

const variant = figma.selectedInstance.getEnum("Variant", {
  Default: "default",
  Info: "info",
  Warning: "warning",
  Error: "error",
})
// El título, el icono y la X se editan en la instancia de Custom modal que lleva dentro; el mensaje va en su hueco.
const shell = figma.selectedInstance.findInstance("Custom modal")
const title = shell.getString("Edit header")
const message = shell.findText("Message").textContent
// showIcon y showCloseButton valen true por defecto: solo se escriben cuando Figma los apaga.
const showIcon = shell.getBoolean("Show icon", { true: "", false: "\n    showIcon: false," })
const showClose = shell.getBoolean("Show close", { true: "", false: "\n    showCloseButton: false," })

// Se abre por servicio, como en ui.smart-contact.com: no se coloca en la plantilla.
export default {
  id: "alert-modal",
  example: figma.code`const ref = this.dynamicDialog.open(ScAlertModalComponent, {
  inputValues: {
    variant: '${variant}',
    title: '${title}',
    message: '${message}',
    actionLabel: '…',
    secondaryActionLabel: 'Cancelar',${showIcon}${showClose}
    closeRequested: () => ref.close('closed'),
    actionRequested: () => ref.close('action'),
  },
});
ref.onClose.subscribe((result) => { /* 'action' | 'closed' | undefined (Escape) */ });`,
}
