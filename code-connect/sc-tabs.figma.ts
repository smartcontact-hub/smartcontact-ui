// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=320-12276
// source=projects/ui-smartcontact/src/lib/components/tabs/sc-tabs.component.ts
// component=ScTabsComponent

import figma from "figma"

// El master no tiene propiedades: las pestañas (`tabs-tab`) son DATOS en código. Cada una es un
// `{ value, label, icon? }` (el texto ya traducido) y la activa sale de `value`. `ariaLabel` nombra la lista.
export default {
  id: "tabs",
  example: figma.code`<sc-tabs [tabs]="tabs" ariaLabel="…" [(value)]="activa" />`,
}
