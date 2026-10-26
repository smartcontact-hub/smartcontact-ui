import { inject, Injectable, Provider } from '@angular/core';
import { MessageService } from 'primeng/api';

import { resolveScComponentIconClass } from '../../core/icons/sc-component-icon-resolver';

export type ScToastSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';

export type ScToastMessage = {
    text?: unknown;
    severity?: ScToastSeverity;
    summary?: string;
    detail?: string;
    id?: unknown;
    key?: string;
    life?: number;
    sticky?: boolean;
    closable?: boolean;
    data?: unknown;
    icon?: string;
    contentStyleClass?: string;
    styleClass?: string;
    closeIcon?: string;
};

// PrimeNG pinta sus propios SVG (Check, InfoCircle...) si el mensaje no trae icono, y a `secondary` y `contrast` no les
// pone ninguno. Cada severidad lleva aquí su glifo de Smart Contact Icons, el mismo que el master de Figma.
const SC_TOAST_SEVERITY_ICON: Record<ScToastSeverity, string> = {
    success: 'check',
    info: 'info',
    warn: 'warning',
    error: 'cancel',
    secondary: 'content_copy',
    contrast: 'auto_awesome'
};

const SC_TOAST_CLOSE_ICON = 'close';

@Injectable()
export class ScToastService {
    private readonly messageService = inject(MessageService);

    show(message: ScToastMessage): void {
        const severity = message.severity ?? 'info';

        this.messageService.add({
            ...message,
            severity,
            icon: message.icon ?? resolveScComponentIconClass(SC_TOAST_SEVERITY_ICON[severity]),
            closeIcon: message.closeIcon ?? resolveScComponentIconClass(SC_TOAST_CLOSE_ICON)
        });
    }

    success(summary: string, detail?: string, options: Omit<ScToastMessage, 'severity' | 'summary' | 'detail'> = {}): void {
        this.show({ ...options, severity: 'success', summary, detail });
    }

    info(summary: string, detail?: string, options: Omit<ScToastMessage, 'severity' | 'summary' | 'detail'> = {}): void {
        this.show({ ...options, severity: 'info', summary, detail });
    }

    warn(summary: string, detail?: string, options: Omit<ScToastMessage, 'severity' | 'summary' | 'detail'> = {}): void {
        this.show({ ...options, severity: 'warn', summary, detail });
    }

    error(summary: string, detail?: string, options: Omit<ScToastMessage, 'severity' | 'summary' | 'detail'> = {}): void {
        this.show({ ...options, severity: 'error', summary, detail });
    }

    clear(key?: string): void {
        this.messageService.clear(key);
    }
}

export function provideScToast(): Provider[] {
    return [MessageService, ScToastService];
}
