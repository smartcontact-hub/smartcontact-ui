// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=12610-23284
// source=projects/ui-smartcontact/src/lib/components/section-card/sc-section-card.component.ts
// component=ScSectionCardComponent

import figma from "figma"

const title = figma.selectedInstance.getString("Title")
const hint = figma.selectedInstance.getString("Pista")

// Section = sc-section-card; sus subsecciones son <sc-subsection> hijos (nSections = cuántas).
// titleKey y hintKey son CLAVES de traducción, no texto: el texto de Figma es lo que esa clave resuelve.
export default {
  id: "section",
  example: figma.code`<!-- en Figma: título "${title}", pista "${hint}" -->
<sc-section-card titleKey="seccion.titulo" hintKey="seccion.pista">
  <sc-subsection>…</sc-subsection>
</sc-section-card>`,
}
