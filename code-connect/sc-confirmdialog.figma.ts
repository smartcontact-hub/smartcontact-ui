// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=323-12317
// source=projects/ui-smartcontact/src/lib/components/confirmdialog/sc-confirmdialog.component.ts
// component=ScConfirmDialogComponent

import figma from "figma"

// No se instancia con inputs: se coloca UNA vez en la raíz de la app y se abre desde `ScConfirmService`
// (`request()` devuelve una promesa con el sí o el no). La variante de Figma (Dialog True/False) es solo la
// forma del diálogo en el lienzo.
export default {
  id: "confirmdialog",
  example: figma.code`<!-- una vez, en el componente raíz -->
<sc-confirmdialog />

<!-- y donde se pregunta: const ok = await this.confirm.request({ ... }) -->`,
}
