/**
 * Duración (ms) de los toasts por intención — convención única de la app
 * (S62, backlog #63). Pensada para que el mensaje **se pueda leer** antes de
 * desaparecer: antes los toasts de Memory iban a 1800-2500ms (demasiado corto).
 * Los avisos y errores viven más porque suelen importar más y ser más largos.
 *
 * Úsese en `MessageService.add({ ..., life: TOAST_LIFE.success })`.
 *
 * NO cubre: (a) los toasts de undo (`UndoStackService`), con duración propia
 * acoplada a la ventana de Ctrl+Z; (b) los toasts persistentes de progreso,
 * que usan `sticky: true` de PrimeNG (sin `life`) y se cierran a mano.
 */
export const TOAST_LIFE = {
  /** Confirmaciones de éxito (crear / editar / eliminar). */
  success: 4000,
  /** Informativos neutros (p. ej. "duplicado como borrador"). */
  info: 4000,
  /** Avisos. */
  warn: 5000,
  /** Errores — el usuario necesita tiempo para leer qué pasó. */
  error: 6000,
} as const;
