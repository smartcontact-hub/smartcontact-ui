// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=393-39252
// source=projects/ui-smartcontact/src/lib/components/message/sc-message.component.ts
// component=ScMessageComponent

import figma from "figma"

const text = figma.selectedInstance.getString("Text")
const severity = figma.selectedInstance.getEnum("Severity", {
  Success: 'severity="success"',
  Info: 'severity="info"',
  Warn: 'severity="warn"',
  Error: 'severity="danger"',
  Secondary: 'severity="secondary"',
  Contrast: 'severity="contrast"',
})
const variant = figma.selectedInstance.getEnum("Type", {
  Default: 'variant="simple"',
  Simple: 'variant="simple"',
  Outlined: 'variant="outlined"',
})
const size = figma.selectedInstance.getEnum("Size", { Normal: 'size="md"', Small: 'size="sm"', Large: 'size="lg"' })
const closable = figma.selectedInstance.getBoolean("Closable", { true: "closable", false: "" })
const icon = figma.selectedInstance.getBoolean("Show Icon", { true: 'icon="info"', false: "" })

export default {
  id: "message",
  example: figma.code`<sc-message text="${text}" ${severity} ${variant} ${size} ${closable} ${icon}></sc-message>`,
}
