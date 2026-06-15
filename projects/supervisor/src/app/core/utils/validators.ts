/**
 * Form-input regexes shared across admin entities. Keep these
 * permissive: they exist to catch obvious typos at the form layer,
 * not to enforce server-side validity. The backend remains the
 * source of truth.
 */

/**
 * RFC-permissive email — accepts `user+tag@domain.tld` (delegate
 * addresses common in shared inboxes / role mailboxes).
 */
export const EMAIL_RE = /^[^\s@]+(\+[^\s@]+)?@[^\s@]+\.[^\s@]+$/;

/**
 * 3-6 digit numeric PIN, used for agent self-activation from the
 * phone keypad.
 */
export const PIN_RE = /^\d{3,6}$/;
