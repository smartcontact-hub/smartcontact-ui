/**
 * Cuenta de la maqueta del acceso. No hay servidor: el formulario solo comprueba contra esto, para poder enseñar el error de
 * «credenciales incorrectas» y el paso a Tickets. Es una cuenta FICTICIA de demostración: no abre nada real. Con el botón de
 * Microsoft (también de maqueta) se entra sin ella.
 */
export const DEMO_ACCOUNT = {
  email: 'demo@example.com',
  password: 'cuscare-demo',
} as const;
