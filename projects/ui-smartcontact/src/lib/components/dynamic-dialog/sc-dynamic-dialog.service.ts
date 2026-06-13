import { inject, Injectable, Provider, Type } from '@angular/core';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EMPTY, Observable } from 'rxjs';

import { ScDialogPosition } from '../../core/types/theme-component.types';

export type ScDynamicDialogInputValues = Record<string, unknown>;

export type ScDynamicDialogConfig<
    DataType = unknown,
    InputValuesType extends ScDynamicDialogInputValues = ScDynamicDialogInputValues
> = {
    data?: DataType;
    inputValues?: InputValuesType;
    header?: string;
    footer?: string;
    width?: string;
    height?: string;
    closeOnEscape?: boolean;
    focusOnShow?: boolean;
    focusTrap?: boolean;
    baseZIndex?: number;
    autoZIndex?: boolean;
    dismissableMask?: boolean;
    rtl?: boolean;
    style?: Record<string, unknown>;
    contentStyle?: Record<string, unknown>;
    styleClass?: string;
    maskStyleClass?: string;
    closable?: boolean;
    showHeader?: boolean;
    modal?: boolean;
    resizable?: boolean;
    draggable?: boolean;
    keepInViewport?: boolean;
    maximizable?: boolean;
    position?: ScDialogPosition;
    closeAriaLabel?: string;
    appendTo?: unknown;
    duplicate?: boolean;
    breakpoints?: Record<string, string>;
};

export class ScDynamicDialogRef<ComponentType = unknown, CloseValueType = unknown> {
    private readonly dialogRef: DynamicDialogRef<ComponentType> | null;

    constructor(dialogRef: unknown | null) {
        this.dialogRef = dialogRef as DynamicDialogRef<ComponentType> | null;
    }

    get onClose(): Observable<CloseValueType> {
        return (this.dialogRef?.onClose ?? EMPTY) as Observable<CloseValueType>;
    }

    get onDestroy(): Observable<unknown> {
        return this.dialogRef?.onDestroy ?? EMPTY;
    }

    get onDragStart(): Observable<unknown> {
        return this.dialogRef?.onDragStart ?? EMPTY;
    }

    get onDragEnd(): Observable<unknown> {
        return this.dialogRef?.onDragEnd ?? EMPTY;
    }

    get onResizeInit(): Observable<unknown> {
        return this.dialogRef?.onResizeInit ?? EMPTY;
    }

    get onResizeEnd(): Observable<unknown> {
        return this.dialogRef?.onResizeEnd ?? EMPTY;
    }

    get onMaximize(): Observable<unknown> {
        return this.dialogRef?.onMaximize ?? EMPTY;
    }

    get onChildComponentLoaded(): Observable<ComponentType> {
        return this.dialogRef?.onChildComponentLoaded ?? EMPTY;
    }

    close(result?: CloseValueType): void {
        this.dialogRef?.close(result);
    }

    destroy(): void {
        this.dialogRef?.destroy();
    }
}

@Injectable()
export class ScDynamicDialogService {
    private readonly dialogService = inject(DialogService);

    open<
        ComponentType,
        DataType = unknown,
        InputValuesType extends ScDynamicDialogInputValues = ScDynamicDialogInputValues,
        CloseValueType = unknown
    >(
        componentType: Type<ComponentType>,
        config: ScDynamicDialogConfig<DataType, InputValuesType> = {}
    ): ScDynamicDialogRef<ComponentType, CloseValueType> {
        const dialogRef = this.dialogService.open(
            componentType,
            this.mapConfig(config)
        );

        return new ScDynamicDialogRef<ComponentType, CloseValueType>(dialogRef);
    }

    private mapConfig<
        DataType,
        InputValuesType extends ScDynamicDialogInputValues
    >(config: ScDynamicDialogConfig<DataType, InputValuesType>): DynamicDialogConfig<DataType, InputValuesType> {
        return {
            ...config,
            closeOnEscape: config.closeOnEscape ?? true,
            focusOnShow: config.focusOnShow ?? true,
            focusTrap: config.focusTrap ?? true,
            dismissableMask: config.dismissableMask ?? false,
            closable: config.closable ?? true,
            showHeader: config.showHeader ?? true,
            modal: config.modal ?? true,
            resizable: config.resizable ?? false,
            draggable: config.draggable ?? false,
            keepInViewport: config.keepInViewport ?? true,
            position: config.position ?? 'center'
        };
    }
}

export function provideScDynamicDialog(): Provider[] {
    return [DialogService, ScDynamicDialogService];
}
