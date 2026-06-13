import { inject, Injectable, Provider } from '@angular/core';
import { MessageService } from 'primeng/api';

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

@Injectable()
export class ScToastService {
    private readonly messageService = inject(MessageService);

    show(message: ScToastMessage): void {
        this.messageService.add({
            ...message,
            severity: message.severity ?? 'info'
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
