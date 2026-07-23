import figma, { html } from '@figma/code-connect/html';

/**
 * Code Connect (PILOTO) — enlaza el master `card` de Figma con el wrapper `sc-card`.
 * Es el único componente mapeado a propósito: probamos el flujo end-to-end sobre
 * uno antes de decidir el resto. Ver docs/code-connect.md.
 *
 * Publicar:  npm run figma:connect:publish
 *   Requiere la variable FIGMA_ACCESS_TOKEN y plan Figma Organization/Enterprise.
 *
 * Validar sin token (local):  npm run figma:connect:parse
 *
 * Dependencia: la prop `icon` se resuelve desde la propiedad booleana "Show Icon"
 * del master. Esa propiedad la añade diseño en Figma. Hasta que exista, `publish`
 * fallará al validar "Show Icon" (parse local sí pasa).
 */
figma.connect(
  'https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=238-10355',
  {
    props: {
      header: figma.string('Header'),
      subheader: figma.string('Subheader'),
      icon: figma.boolean('Show Icon', { true: 'auto_awesome', false: undefined }),
      content: figma.children('*'),
    },
    example: ({ header, subheader, icon, content }) =>
      html`<sc-card header="${header}" subheader="${subheader}" icon="${icon}">${content}</sc-card>`,
  },
);
