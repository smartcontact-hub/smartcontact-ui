import { Injectable } from '@angular/core';

/**
 * Clipboard helper. Prefers the modern `navigator.clipboard` API and falls
 * back to a hidden textarea + `execCommand` for older / restricted contexts
 * (mirrors the React prototype's `copyToClipboard`).
 *
 * Returns `true` on success so callers can decide whether to surface a
 * toast. Autocontenido (solo DOM API) — sin acoplamiento de app; se porta tal
 * cual del catálogo de diseño (§5: deuda de aislamiento saldada al traerlo al
 * paquete). `providedIn: 'root'`, así que no necesita `provide*`.
 */
@Injectable({ providedIn: 'root' })
export class ScClipboardService {
  async copy(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy path.
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}
