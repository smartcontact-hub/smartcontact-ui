import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clasificarEra, LEGACY_PENDIENTES, sinComentarios } from '../audit-api-era.mjs';

// clasificarEra: deriva la era de la API del texto del componente. PURA → fixtures directos.
// Se prueba en las CUATRO salidas y, sobre todo, en el eje que hace falsos positivos
// (comentarios que MENCIONAN la era vieja sin declararla).

test('señales: input()/model()/output() → signals', () => {
  const ts = `
    export class ScFooComponent {
      readonly label = input('');
      readonly value = model<string>('');
      readonly changed = output<boolean>();
    }`;
  assert.equal(clasificarEra(ts), 'signals');
});

test('señales: input.required<T>() también cuenta', () => {
  assert.equal(clasificarEra('readonly items = input.required<string[]>();'), 'signals');
});

test('decoradores: @Input()/@Output() → legacy', () => {
  const ts = `
    export class ScFooComponent {
      @Input() label = '';
      @Output() clicked = new EventEmitter<MouseEvent>();
    }`;
  assert.equal(clasificarEra(ts), 'legacy');
});

test('las dos a la vez → mixta (media migración es su propio fallo)', () => {
  const ts = `
    @Input() label = '';
    readonly disabled = input(false);`;
  assert.equal(clasificarEra(ts), 'mixta');
});

test('un componente sin API propia no es legacy', () => {
  assert.equal(clasificarEra('export class ScAvatarGroupComponent {}'), 'sin-api');
});

// El caso REAL que motiva quitar comentarios: `sidebar-nav-item.component.ts` del
// supervisor explica en un comentario por qué NO usa `@Input()`. Contarlo lo marcaría
// como legacy justo por documentar lo contrario.
test('un comentario que MENCIONA @Input() no convierte el fichero en legacy', () => {
  const ts = `
    /**
     * \`currentPath\` is a signal input — non-signal \`@Input()\` would break the
     * computed below.
     */
    export class SidebarNavItemComponent {
      readonly currentPath = input('');
    }`;
  assert.equal(clasificarEra(ts), 'signals');
});

test('un comentario de línea con @Output() tampoco', () => {
  assert.equal(clasificarEra('// antes esto era un @Output()\nreadonly done = output<void>();'), 'signals');
});

test('sinComentarios no se come una URL (el // de https://)', () => {
  assert.match(sinComentarios("const doc = 'https://primeng.org/button';"), /primeng\.org/);
});

test('el trinquete no tiene duplicados y está ordenado', () => {
  assert.equal(new Set(LEGACY_PENDIENTES).size, LEGACY_PENDIENTES.length);
  assert.deepEqual(LEGACY_PENDIENTES, [...LEGACY_PENDIENTES].sort());
});

test('sc-button ya NO está en el trinquete (migrado en DD-38)', () => {
  assert.ok(!LEGACY_PENDIENTES.includes('sc-button'));
});
