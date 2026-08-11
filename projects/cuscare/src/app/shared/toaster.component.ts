import { ChangeDetectionStrategy, Component, inject, Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly text: string;
}

/**
 * Los avisos de la app. Tras confirmar una acción, la real saca un toast arriba
 * a la derecha; la réplica no decía nada — confirmabas y no pasaba aparentemente
 * nada.
 */
@Injectable({ providedIn: 'root' })
export class ToasterService {
  private next = 0;
  readonly toasts = signal<readonly Toast[]>([]);

  show(text: string, kind: ToastKind = 'success'): void {
    const id = ++this.next;
    this.toasts.update((t) => [...t, { id, kind, text }]);
    // 4s: lo justo para leerlo sin que estorbe. No medido en la real.
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 4000);
  }
}

/**
 * `app-toaster` — arriba a la derecha, fijo.
 *
 * Métrica LEÍDA de las hojas de estilo de la app real (no estimada):
 *   contenedor `position: fixed; top: 24px; right: 24px; z-index: 10000; gap: 8px`
 *   toast      radio 10 · padding 12/16 · 13px · blanco · sombra 0 6px 20px rgba(0,0,0,.12)
 *   colores    success #16a34a · error #dc2626 · warning #d97706 · info #2563eb
 *   entrada    animación de 0.3s
 */
@Component({
  selector: 'app-toaster',
  standalone: true,
  template: `
    <div class="toaster-container" role="status" aria-live="polite">
      @for (t of toaster.toasts(); track t.id) {
        <div class="toast" [class]="'toast ' + t.kind">{{ t.text }}</div>
      }
    </div>
  `,
  styles: `
    .toaster-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toast {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #ffffff;
      font-family: var(--cc-font-head);
      font-size: 13px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
      animation: slideIn 0.3s ease forwards;
    }

    .toast.success {
      background: #16a34a;
    }

    .toast.error {
      background: #dc2626;
    }

    .toast.warning {
      background: #d97706;
    }

    .toast.info {
      background: #2563eb;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(12px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToasterComponent {
  protected readonly toaster = inject(ToasterService);
}
