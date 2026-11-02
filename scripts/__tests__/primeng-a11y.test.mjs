// La accesibilidad que PrimeNG documenta, para la pestaña «Accesibilidad» de las fichas (`scripts/primeng-a11y.mjs`).
import assert from 'node:assert/strict';
import test from 'node:test';

import { carpetasDe, modulosPrincipales, seccionesDeA11y } from '../primeng-a11y.mjs';

test('seccionesDeA11y: un <h3> por sección, sus párrafos en texto plano y su tabla de teclas', () => {
  const ts = `
    <app-docsectiontext>
      <h3>Screen Reader</h3>
      <p>Uses <i>combobox</i> role
        with <i>aria-expanded</i>.</p>
    </app-docsectiontext>
    <h3>Keyboard Support</h3>
    <table>
      <thead><tr><th>Key</th><th>Function</th></tr></thead>
      <tbody>
        <tr>
          <td><i>tab</i></td>
          <td>Moves focus to the select element.</td>
        </tr>
        <tr>
          <td><i>shift</i> + <i>tab</i></td>
          <td>Moves focus back.</td>
        </tr>
      </tbody>
    </table>`;
  assert.deepEqual(seccionesDeA11y(ts), [
    { titulo: 'Screen Reader', parrafos: ['Uses combobox role with aria-expanded.'], teclas: [] },
    {
      titulo: 'Keyboard Support',
      parrafos: [],
      teclas: [
        { tecla: 'tab', funcion: 'Moves focus to the select element.' },
        { tecla: 'shift + tab', funcion: 'Moves focus back.' },
      ],
    },
  ]);
});

test('modulosPrincipales y carpetasDe: un módulo por componente, y la carpeta del showcase sin «input» si hace falta', () => {
  assert.deepEqual(modulosPrincipales([{ primengPrincipal: 'select' }, { primengPrincipal: null }, { primengPrincipal: 'select' }]), ['select']);
  assert.deepEqual(carpetasDe('inputpassword'), ['inputpassword', 'password']);
  assert.deepEqual(carpetasDe('tag'), ['tag']);
});
