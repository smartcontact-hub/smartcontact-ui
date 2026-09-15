import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existeComoClase, sinSelectores } from '../primeng-class-exists.mjs';
import { cambiosDeComportamiento, normalizarSelector, permisosSinFila, sinPermiso } from '../primeng-native-behavior.mjs';

// El chequeo de huérfanos de `audit:primeng-coupling`: ¿una clase que usa nuestro CSS sigue
// existiendo en PrimeNG? Fixtures con la FORMA del bundle real (`fesm2022/*.mjs`).

const BUNDLE_ADDON = [
  `const classes = { root: 'p-inputgroupaddon' };
   static ɵcmp = i0.ɵɵngDeclareComponent({ type: InputGroupAddon, selector: "p-inputgroup-addon", host: {} });
   args: [{ selector: 'p-inputgroup-addon', standalone: true }]`,
];

test('el caso real: la clase solo aparece como selector de etiqueta → NO existe', () => {
  const textos = sinSelectores(BUNDLE_ADDON);
  assert.equal(existeComoClase('p-inputgroup-addon', textos), false);
});

test('la clase que PrimeNG sí pone → existe', () => {
  const textos = sinSelectores(BUNDLE_ADDON);
  assert.equal(existeComoClase('p-inputgroupaddon', textos), true);
});

test('el rojo lo pone el selector: sin quitarlo, la búsqueda suelta daba verde', () => {
  // Es el fallo que dejó pasar el guardián anterior (`texto.includes(clase)`).
  assert.equal(BUNDLE_ADDON.some((t) => t.includes('p-inputgroup-addon')), true);
  // Ni con la clase entera basta: sin quitar los `selector:`, el nombre de etiqueta casa.
  assert.equal(existeComoClase('p-inputgroup-addon', BUNDLE_ADDON), true);
  assert.equal(existeComoClase('p-inputgroup-addon', sinSelectores(BUNDLE_ADDON)), false);
});

test('una clase no cuenta por ir DENTRO de otra más larga', () => {
  const textos = sinSelectores([`TabListClasses["root"] = "p-tablist"; cx('p-tablist-content')`]);
  assert.equal(existeComoClase('p-tab', textos), false);
  assert.equal(existeComoClase('p-tablist', textos), true);
  assert.equal(existeComoClase('p-tablist-content', textos), true);
});

test('una clase dentro de una lista de clases o de CSS cuenta', () => {
  const textos = sinSelectores([
    `class: 'p-tab p-tab-active'`,
    `.p-togglebutton-checked .p-togglebutton-content { background: x; }`,
  ]);
  assert.equal(existeComoClase('p-tab-active', textos), true);
  assert.equal(existeComoClase('p-togglebutton-content', textos), true);
});

test('los selectores con comilla invertida también se quitan', () => {
  const textos = sinSelectores(['selector: `p-foo-bar`, template: `<div></div>`']);
  assert.equal(existeComoClase('p-foo-bar', textos), false);
});

// Sección F: una regla que oculta, anima o transforma una pieza de PrimeNG es un desvío del nativo.

test('F · el caso real: apagar la raya de p-tabs en el tema se detecta', () => {
  const css = 'const tabsActiveMarkCss = ({ dt }) => `\n.p-tablist .p-tablist-active-bar {\n    display: none;\n}\n`;';
  assert.deepEqual(cambiosDeComportamiento(css), [{ selector: '.p-tablist .p-tablist-active-bar', cambios: ['display: none'] }]);
});

test('F · movimiento y transformación cuentan; el aspecto no', () => {
  const css = `.p-component.p-button:active { transform: scale(0.98); transition-duration: 0ms; }
    .p-tab { color: red; padding: 1rem; }
    .p-ink { animation-name: ripple; }`;
  assert.deepEqual(cambiosDeComportamiento(css), [
    { selector: '.p-component.p-button:active', cambios: ['transform', 'transition-duration'] },
    { selector: '.p-ink', cambios: ['animation-name'] },
  ]);
});

test('F · lo que no nombra una clase de PrimeNG no cuenta, ni lo comentado', () => {
  const css = `.sc-icon--spin { animation: sc-icon-spin 1s linear infinite; }
    /* .p-tab { display: none; } */`;
  assert.deepEqual(cambiosDeComportamiento(css), []);
});

test('F · la lista de permitidos casa por selector normalizado', () => {
  const cambios = cambiosDeComportamiento('.p-toast   .p-toast-close-button\n{ display: none }');
  assert.equal(normalizarSelector('`\n.p-toast   .p-toast-close-button\n'), '.p-toast .p-toast-close-button');
  assert.deepEqual(sinPermiso(cambios, { '.p-toast .p-toast-close-button': 'motivo' }), []);
  assert.equal(sinPermiso(cambios, {}).length, 1);
});

test('F · cada permiso necesita su fila en customs-catalog §8, y solo cuenta esa sección', () => {
  const permitidos = { '.p-component.p-button:active': 'x', '.p-ink': 'y' };
  const catalogo = `## 7. Otra
\`.p-ink\` mencionado fuera de la sección no vale.

## 8. Comportamiento que se aparta de PrimeNG nativo
| \`.p-component.p-button:active\` | se encoge | a revisar |

## Cómo añadir una divergencia nueva
\`.p-ink\` tampoco vale aquí.`;
  assert.deepEqual(permisosSinFila(permitidos, catalogo), ['.p-ink']);
  assert.deepEqual(permisosSinFila(permitidos, 'sin sección 8'), ['.p-component.p-button:active', '.p-ink']);
});
