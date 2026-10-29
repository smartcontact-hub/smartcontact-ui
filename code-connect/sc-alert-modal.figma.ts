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
const title = figma.selectedInstance.getString("Title")
const message = figma.selectedInstance.getString("Message")
// showIcon y showCloseButton valen true por defecto: solo se escriben cuando Figma los apaga.
const showIcon = figma.selectedInstance.getBoolean("Show icon", { true: "", false: "\n    showIcon: false," })
const showClose = figma.selectedInstance.getBoolean("Show close", { true: "", false: "\n    showCloseButton: false," })
const secondary = figma.selectedInstance.getBoolean("Secondary action", { true: "\n    secondaryActionLabel: 'Cancelar',", false: "" })
const tertiary = figma.selectedInstance.getBoolean("Tertiary action", {
  true: "\n    tertiaryActionLabel: 'No guardar',\n    tertiaryActionRequested: () => ref.close('tertiary'),",
  false: "",
})

// Se abre por servicio, como en ui.smart-contact.com: no se coloca en la plantilla.
export default {
  id: "alert-modal",
  example: figma.code`const ref = this.dynamicDialog.open(ScAlertModalComponent, {
  inputValues: {
    variant: '${variant}',
    title: '${title}',
    message: '${message}',
    actionLabel: '…',${secondary}${tertiary}${showIcon}${showClose}
    closeRequested: () => ref.close('closed'),
    actionRequested: () => ref.close('action'),
  },
});
ref.onClose.subscribe((result) => { /* 'action' | 'tertiary' | 'closed' | undefined (Escape) */ });`,
}
