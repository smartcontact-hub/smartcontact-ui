import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ScConfirmService } from '@smartcontact-hub/components';

/**
 * Borrar un grupo o un agente es la confirmación simple del DS (`sc-confirmdialog`), sin teclear el nombre
 * (DD-215, enmienda DD-145): «¿Eliminar grupo?» y «Vas a eliminar el grupo «…». Esta acción no se puede
 * deshacer.», igual desde el listado que desde la ficha, como en Figma. Se llama en el contexto de inyección y
 * devuelve la pregunta lista: resuelve `true` si se acepta.
 */
export function injectConfirmarBorrado(entityKey: string): (name: string) => Promise<boolean> {
  const confirm = inject(ScConfirmService);
  const translate = inject(TranslateService);
  return (name) => {
    const entity = translate.instant(entityKey);
    return confirm.request({
      title: translate.instant('common.delete_dialog.title_single', { entity }),
      body: translate.instant('common.delete_dialog.body_single', { entity, name }),
      acceptLabel: translate.instant('common.delete'),
      rejectLabel: translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
  };
}
