// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15534-3907
// source=projects/supervisor/src/app/shared/components/channel-icon/channel-icon.component.ts
// component=ChannelIconComponent

import figma from "figma"

const channel = figma.selectedInstance.getEnum("Canal", {
  Teléfono: "phone",
  Chat: "chat",
  WhatsApp: "whatsapp",
  Email: "email",
})

// Componente de app (shared/components del Supervisor), no del paquete del DS. `size` (px) vale 14 por defecto.
export default {
  id: "channel-icon",
  example: figma.code`<sc-channel-icon channel="${channel}" [size]="14" />`,
}
