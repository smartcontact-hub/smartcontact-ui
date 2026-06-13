/**
 * Returns true if the event target is an editable element (input, textarea,
 * select, contenteditable). Used by global keyboard shortcuts to avoid
 * stealing characters while the user is typing — e.g. pressing `?` inside a
 * search field should type "?" instead of opening the shortcuts cheatsheet.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}
