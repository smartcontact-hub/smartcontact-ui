import { effect, inject, type Signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { injectAlertModal } from '@core/services';

/**
 * Borrar un grupo o un agente es la confirmación simple del DS (`sc-alert-modal` en `error`, DD-239), sin teclear el nombre
 * (DD-215, enmienda DD-145), igual desde el listado que desde la ficha. Desde el 2026-10-20, con el texto más corto que
 * dice todo: el título pregunta con el nombre («¿Eliminar el grupo «Ventas»?»), el cuerpo solo añade lo que no se sabe
 * («Esta acción no se puede deshacer.») y el botón repite el verbo del título («Eliminar»; «Confirmar» no dice qué
 * pasa). El título es de cada entidad (`titleKey`, con `{{name}}`): el artículo cambia con ella en cada idioma. Se llama
 * en el contexto de inyección y devuelve la pregunta lista: resuelve `true` si se acepta.
 */
export function injectConfirmarBorrado(titleKey: string): (name: string) => Promise<boolean> {
  const alertModal = injectAlertModal();
  const translate = inject(TranslateService);
  return (name) =>
    alertModal({
      variant: 'error',
      title: translate.instant(titleKey, { name }),
      message: translate.instant('common.delete_dialog.body'),
      actionLabel: translate.instant('common.delete'),
      secondaryActionLabel: translate.instant('common.cancel'),
    });
}

/** La misma pregunta para varios a la vez, con su cifra (`titleKey`, con `{{count}}`): «¿Eliminar 3 grupos?» (SISMAC-4056). */
export function injectConfirmarBorradoVarios(titleKey: string): (count: number, detail?: string | null) => Promise<boolean> {
  const alertModal = injectAlertModal();
  const translate = inject(TranslateService);
  return (count, detail) =>
    alertModal({
      variant: 'error',
      title: translate.instant(titleKey, { count }),
      message: [detail, translate.instant('common.delete_dialog.body')].filter(Boolean).join(' '),
      actionLabel: translate.instant('common.delete'),
      secondaryActionLabel: translate.instant('common.cancel'),
    });
}

/**
 * La confirmación simple para quien guarda lo que va a borrar en una señal (`deleteTarget`): al ponerse, pregunta («¿Eliminar el
 * usuario «Ana»?» o «¿Eliminar 3 usuarios?») y llama a `accept` o a `cancel`. Sin teclear el nombre: se alinea con Grupos y
 * Agentes para esta entrega (DD-233). `detail` añade lo que pasa además («La usan 3 grupos.»). Se llama en el contexto de
 * inyección, en un campo de la clase.
 */
export function injectBorradoSimple<T>(opts: {
  readonly target: Signal<readonly T[] | null>;
  readonly titleKey: string | (() => string);
  readonly titleBulkKey: string | (() => string);
  readonly params: (items: readonly T[]) => Record<string, string | number>;
  readonly detail?: (items: readonly T[]) => string | null | undefined;
  readonly accept: () => void;
  readonly cancel: () => void;
}): void {
  const alertModal = injectAlertModal();
  const translate = inject(TranslateService);
  const clave = (k: string | (() => string)): string => (typeof k === 'string' ? k : k());
  let preguntando = false;
  effect(() => {
    const items = opts.target();
    if (!items || items.length === 0 || preguntando) return;
    preguntando = true;
    untracked(() => {
      const extra = opts.detail?.(items);
      const body = [extra, translate.instant('common.delete_dialog.body')].filter(Boolean).join(' ');
      void alertModal({
        variant: 'error',
        title: translate.instant(clave(items.length === 1 ? opts.titleKey : opts.titleBulkKey), opts.params(items)),
        message: body,
        actionLabel: translate.instant('common.delete'),
        secondaryActionLabel: translate.instant('common.cancel'),
      })
        .then((ok) => {
          preguntando = false;
          if (ok) opts.accept();
          else opts.cancel();
        });
    });
  });
}
