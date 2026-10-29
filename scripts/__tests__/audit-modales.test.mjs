import { test } from 'node:test';
import assert from 'node:assert/strict';

import { confirmsSinTarget, usosProhibidos } from '../audit-modales.mjs';

// El valor del gate está también en lo que NO marca: el globo con target, los comentarios y la casa del retirado (LEARNINGS #2).

const PANTALLA = 'projects/supervisor/src/app/features/x/x-page.component.html';

test('ROJO: sc-dialog en una pantalla del Supervisor', () => {
  assert.equal(usosProhibidos('<sc-dialog [(visible)]="open" title="Hola">', PANTALLA).length, 1);
});

test('ROJO: ScDialogComponent importado en un componente de la librería', () => {
  assert.equal(usosProhibidos("import { ScDialogComponent } from '../dialog/sc-dialog.component';", 'projects/ui-smartcontact/src/lib/components/x/x.ts').length, 1);
});

test('VERDE: sc-dialog en su propia carpeta, y en un comentario', () => {
  assert.equal(usosProhibidos('export class ScDialogComponent {}', 'projects/ui-smartcontact/src/lib/components/dialog/sc-dialog.component.ts').length, 0);
  assert.equal(usosProhibidos('<!-- antes era <sc-dialog> -->', PANTALLA).length, 0);
});

test('ROJO: p-dialog y ConfirmationService a pelo en el Supervisor', () => {
  assert.equal(usosProhibidos('<p-dialog [(visible)]="v">', PANTALLA).length, 1);
  assert.equal(usosProhibidos("import { ConfirmationService } from 'primeng/api';", 'projects/supervisor/src/app/x.ts').length, 1);
  assert.equal(usosProhibidos("import { DialogModule } from 'primeng/dialog';", 'projects/supervisor/src/app/x.ts').length, 1);
});

test('VERDE: la librería sí monta p-dialog (sc-custom-modal lo envuelve)', () => {
  assert.equal(usosProhibidos('<p-dialog [visible]="v">', 'projects/ui-smartcontact/src/lib/components/custom-modal/sc-custom-modal.component.html').length, 0);
});

test('ROJO: <sc-confirmdialog> en una pantalla; VERDE: en app.component.html', () => {
  assert.equal(usosProhibidos('<sc-confirmdialog />', PANTALLA).length, 1);
  assert.equal(usosProhibidos('<sc-confirmdialog />', 'projects/supervisor/src/app/app.component.html').length, 0);
});

test('ROJO: request() sin target es el confirm centrado', () => {
  const ts = `import { ScConfirmService } from '@smartcontact-hub/components';
const ok = await this.confirm.request({ header: '¿Borrar?', acceptLabel: 'Borrar', icon: { name: 'x' } });`;
  assert.deepEqual(confirmsSinTarget(ts), [[2, 'request() sin target: es el confirm centrado retirado']]);
});

test('VERDE: request() con target, escrito largo o abreviado', () => {
  const largo = `ScConfirmService; this.confirm.request({ header: 'x', target: ev.currentTarget as HTMLElement })`;
  const corto = `ScConfirmService; const target = el; this.confirm.choose({ header: 'x', target })`;
  assert.deepEqual(confirmsSinTarget(largo), []);
  assert.deepEqual(confirmsSinTarget(corto), []);
});

test('VERDE: un .request() de otro servicio, en un fichero sin ScConfirmService, no cuenta', () => {
  assert.deepEqual(confirmsSinTarget('this.http.request({ method: "GET" })'), []);
});
