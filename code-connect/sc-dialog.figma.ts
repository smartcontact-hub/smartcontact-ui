// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=243-9556

import figma from "figma"

const header = figma.selectedInstance.getString("Header")
const content = figma.selectedInstance.getString("Content")
// closable y hasFooter valen true por defecto: solo se escriben cuando Figma los apaga.
const closable = figma.selectedInstance.getBoolean("Closable", { true: "", false: '[closable]="false"' })
const footer = figma.selectedInstance.getBoolean("Show Footer", { true: "", false: '[hasFooter]="false"' })

// Los botones del pie (1st y 2nd button de Figma) se proyectan en el hueco [modal-actions].
export default {
  id: "dialog",
  example: figma.code`<sc-dialog [(visible)]="visible" title="${header}" ${closable} ${footer}>
  ${content}
  <div modal-actions>…</div>
</sc-dialog>`,
}
