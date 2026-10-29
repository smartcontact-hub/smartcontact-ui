// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=323-12317
// source=projects/ui-smartcontact/src/lib/components/alert-modal/sc-alert-modal.component.ts
// component=ScAlertModalComponent

import figma from "figma"

// El diálogo de confirmación centrado es ahora sc-alert-modal (DD-241): borrar va con `variant: 'error'`, descartar
// cambios con `warning`. La variante de Figma (Dialog True/False) es solo la forma del diálogo en el lienzo. El globo
// pegado al botón sigue con ScConfirmService.request({ …, target }).
export default {
  id: "confirmdialog",
  example: figma.code`const ref = this.dynamicDialog.open(ScAlertModalComponent, {
  inputValues: {
    variant: 'error',
    title: '¿Eliminar…?',
    message: 'Esta acción no se puede deshacer.',
    actionLabel: 'Eliminar',
    secondaryActionLabel: 'Cancelar',
    closeRequested: () => ref.close('closed'),
    actionRequested: () => ref.close('action'),
  },
});

// Para una frase junto a lo pulsado: await this.confirm.request({ …, target: event.currentTarget })`,
}
