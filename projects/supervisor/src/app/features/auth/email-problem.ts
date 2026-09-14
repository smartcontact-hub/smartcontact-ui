/**
 * Qué le pasa a un email, dicho como una clave de i18n que le explica a la persona
 * CÓMO arreglarlo (no solo que está mal). `null` = bien formado.
 *
 * Solo mira la forma: si la cuenta existe lo decide el servidor, y su respuesta no
 * distingue email de contraseña. Orden = el fallo más probable primero.
 */
export function emailProblem(raw: string): string | null {
  const value = raw.trim();
  const base = 'auth.login.errors.';
  if (value === '') return `${base}email_required`;
  const at = value.split('@').length - 1;
  /* Sin @ va antes que los espacios: «ana empresa.com» es una @ que falta, no un espacio de más. */
  if (at === 0) return `${base}email_missing_at`;
  if (/\s/.test(value)) return `${base}email_spaces`;
  if (at > 1) return `${base}email_many_at`;
  const [name, domain] = value.split('@');
  if (name === '') return `${base}email_missing_name`;
  if (domain === '') return `${base}email_missing_domain`;
  if (!/^[^.]+(\.[^.]+)+$/.test(domain)) return `${base}email_bad_domain`;
  return null;
}
