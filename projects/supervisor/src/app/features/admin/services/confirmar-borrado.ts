import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ScConfirmService } from '@smartcontact-hub/components';

/**
 * Borrar un grupo o un agente es la confirmación simple del DS (`sc-confirmdialog`), sin teclear el nombre
 * (DD-215, enmienda DD-145), igual desde el listado que desde la ficha. Desde el 2026-10-20, con el texto más corto que
 * dice todo: el título pregunta con el nombre («¿Eliminar el grupo «Ventas»?»), el cuerpo solo añade lo que no se sabe
 * («Esta acción no se puede deshacer.») y el botón repite el verbo del título («Eliminar»; «Confirmar» no dice qué
 * pasa). El título es de cada entidad (`titleKey`, con `{{name}}`): el artículo cambia con ella en cada idioma. Se llama
 * en el contexto de inyección y devuelve la pregunta lista: resuelve `true` si se acepta.
 */
export function injectConfirmarBorrado(titleKey: string): (name: string) => Promise<boolean> {
  const confirm = inject(ScConfirmService);
  const translate = inject(TranslateService);
  return (name) =>
    confirm.request({
      title: translate.instant(titleKey, { name }),
      body: translate.instant('common.delete_dialog.body'),
      acceptLabel: translate.instant('common.delete'),
      rejectLabel: translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
}

/** La misma pregunta para varios a la vez, con su cifra (`titleKey`, con `{{count}}`): «¿Eliminar 3 grupos?» (SISMAC-4056). */
export function injectConfirmarBorradoVarios(titleKey: string): (count: number) => Promise<boolean> {
  const confirm = inject(ScConfirmService);
  const translate = inject(TranslateService);
  return (count) =>
    confirm.request({
      title: translate.instant(titleKey, { count }),
      body: translate.instant('common.delete_dialog.body'),
      acceptLabel: translate.instant('common.delete'),
      rejectLabel: translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
}
