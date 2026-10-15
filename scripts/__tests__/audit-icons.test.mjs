import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

import {
  casaConReservado,
  conceptoDe,
  iconosDe,
  iconosEnTs,
  leerSignificados,
  normalizar,
  revisarPlantilla,
} from '../audit-icons.mjs';

// La regla se lee del paquete de iconos: si el fichero cambia de forma y el gate deja de leerlo, el gate se queda
// mudo (verde por no mirar nada). Este test lo ata al fichero REAL, no a una copia.
const { iconos, reservados } = leerSignificados(
  readFileSync(new URL('../../projects/ui-smartcontact-icons/src/lib/icons/sc-icon-meanings.ts', import.meta.url), 'utf8'),
);

const MATERIAL = new Set(['close', 'delete', 'menu', 'tune', 'settings', 'view_column', 'headphones', 'group', 'person', 'add', 'more_vert', 'rotate_left', 'replay_10', 'restart_alt', 'refresh', 'filter_alt', 'check', 'content_copy', 'move_to_inbox', 'outbox', 'error', 'warning']);
const ctx = (resolver = null) => ({
  tr: (k) => ({ 'x.quitar': 'Quitar valor', 'x.eliminar': 'Eliminar condición', 'x.agentes': 'Agentes' })[k] ?? k,
  valido: (n) => MATERIAL.has(n),
  reservados,
  iconos,
  escala: new Set([8, 10, 12, 14, 16, 18, 20, 28, 32, 44, 56, 64]),
  resolver,
});
const reglas = (html, c = ctx()) => revisarPlantilla(html, c).map((f) => f.regla);

test('lee SC_ICONS y SC_ICON_RESERVADOS del fichero real', () => {
  assert.equal(iconos.agentes, 'headphones');
  assert.equal(iconos.eliminar, 'delete');
  assert.deepEqual(reservados.close.verbos.slice(0, 2), ['cerrar', 'quitar']);
  assert.deepEqual(reservados.rotate_left.verbos, []);
});

test('normaliza: minúsculas, sin tildes, sin ¿ ni interpolaciones', () => {
  assert.equal(normalizar('¿Eliminar «{{ name }}»?'), 'eliminar ?');
  assert.equal(normalizar('Añadir  categoría'), 'anadir categoria');
});

test('concepto por la primera palabra; «Cerrar sesión» no es cerrar', () => {
  assert.equal(conceptoDe('Eliminar alternativa'), 'eliminar');
  assert.equal(conceptoDe('Cerrar sesión'), null);
  // Desde DD-210 §7, «Añadir subcategoría» es el «+» con texto al pie de cada categoría, no la flecha de cada fila.
  assert.equal(conceptoDe('Añadir subcategoría a «X»'), 'anadir');
  assert.equal(conceptoDe('Avanzar 10 segundos'), 'avanzar10');
  assert.equal(conceptoDe('Avanzar'), null);
});

test('entidad tras «Aún no hay» o «Sin»; en una cabecera solo cuenta la entidad', () => {
  assert.equal(conceptoDe('Aún no hay usuarios', { soloEntidad: true }), 'usuarios');
  assert.equal(conceptoDe('Sin grupos', { soloEntidad: true }), 'grupos');
  assert.equal(conceptoDe('Editar entidad', { soloEntidad: true }), null);
  // «Ver recursos del grupo» empieza por «ver»: no es la entidad.
  assert.equal(conceptoDe('Ver recursos del grupo', { soloEntidad: true }), null);
});

test('un reservado casa con sus verbos y con nada más', () => {
  assert.equal(casaConReservado('Quitar valor', reservados.close), true);
  assert.equal(casaConReservado('Eliminar condición', reservados.close), false);
});

test('los iconos de un binding: ramas del ternario, no la condición', () => {
  const at = (valor) => ({ clave: '[name]', valor, ligado: true });
  assert.deepEqual(iconosDe(at("side === 'incoming' ? 'move_to_inbox' : 'outbox'")), ['move_to_inbox', 'outbox']);
  assert.deepEqual(iconosDe(at("copiado() === k + '|token' ? 'check' : 'content_copy'")), ['check', 'content_copy']);
  assert.deepEqual(iconosDe(at("mode() === 'dup' ? dupIcon : arrowIcon"), (id) => ({ dupIcon: ['content_copy'], arrowIcon: ['add'] })[id]), ['content_copy', 'add']);
});

// ── las reglas, cada una enrojece con su caso y se calla con el bueno ──────────

test('nombre que no existe → rojo; uno de Material → verde', () => {
  assert.deepEqual(reglas('<sc-icon name="trashcan" />'), ['nombre']);
  assert.deepEqual(reglas('<sc-icon name="delete" />'), []);
});

test('talla fuera de escala → rojo; de la escala o inherit → verde', () => {
  assert.deepEqual(reglas('<sc-icon name="check" [size]="15" />'), ['talla']);
  assert.deepEqual(reglas('<sc-icon name="check" [size]="16" />'), []);
  assert.deepEqual(reglas('<sc-icon name="check" size="inherit" />'), []);
});

test('X que elimina → rojo (reservado); X que quita → verde', () => {
  assert.deepEqual(reglas(`<sc-button icon="close" [ariaLabel]="'x.eliminar' | translate" />`), ['reservado']);
  assert.deepEqual(reglas(`<sc-button icon="close" [ariaLabel]="'x.quitar' | translate" />`), []);
});

test('hamburguesa que no abre la navegación → rojo', () => {
  assert.deepEqual(reglas('<sc-button icon="menu" ariaLabel="Opciones de procesamiento" />'), ['reservado']);
});

test('icono retirado → rojo aunque no se sepa cómo se llama el control', () => {
  assert.deepEqual(reglas('<sc-button [icon]="resetIcon" [label]="resetLabel()" />', ctx((id) => (id === 'resetIcon' ? ['rotate_left'] : null))), ['reservado']);
});

test('concepto con otro icono → rojo; con el suyo → verde', () => {
  assert.deepEqual(reglas('<sc-button icon="tune" label="Eliminar" />'), ['concepto']);
  assert.deepEqual(reglas(`<sc-section-card icon="group" [titleKey]="'x.agentes'" />`), ['concepto']);
  assert.deepEqual(reglas(`<sc-section-card icon="headphones" [titleKey]="'x.agentes'" />`), []);
});

test('un contraejemplo de la doc (data-contraejemplo) no cuenta', () => {
  assert.deepEqual(reglas('<div data-contraejemplo><sc-button icon="menu" ariaLabel="Opciones" /></div>'), []);
});

test('tooltip: repite el nombre → rojo; dice otra cosa sin «both» → rojo; con «both» → verde', () => {
  assert.deepEqual(reglas('<sc-button icon="add" ariaLabel="Nuevo" pTooltip="Nuevo" />'), ['tooltip']);
  assert.deepEqual(reglas('<sc-button icon="add" ariaLabel="Nuevo" pTooltip="Crea una agenda vacía" />'), ['tooltip']);
  assert.deepEqual(reglas('<sc-button icon="add" ariaLabel="Nuevo" pTooltip="Crea una agenda vacía" tooltipEvent="both" />'), []);
  assert.deepEqual(reglas('<sc-button icon="add" ariaLabel="Nuevo" title="Nuevo" />'), ['tooltip']);
});

test('enfocable con tooltip que no sale al enfocar → rojo; con «both» → verde', () => {
  assert.deepEqual(reglas('<span tabindex="0" role="note" aria-label="3 niveles" pTooltip="A, B, C">3</span>'), ['tooltip']);
  assert.deepEqual(reglas('<span tabindex="0" role="note" aria-label="3 niveles" pTooltip="A, B, C" tooltipEvent="both">3</span>'), []);
  // Un <button> es enfocable sin tabindex: el estado de una conversación cayó aquí.
  assert.deepEqual(reglas('<button type="button" aria-label="Abrir" pTooltip="Transcrita">x</button>'), ['tooltip']);
  assert.deepEqual(reglas('<button type="button" aria-label="Abrir" pTooltip="Transcrita" tooltipEvent="both">x</button>'), []);
});

test('botón nativo de solo icono sin nombre → rojo; con aria-label o con texto → verde', () => {
  assert.deepEqual(reglas('<button type="button"><sc-icon name="close" /></button>'), ['sin-nombre']);
  assert.deepEqual(reglas('<button type="button" aria-label="Cerrar"><sc-icon name="close" /></button>'), []);
  assert.deepEqual(reglas('<button type="button"><sc-icon name="close" /> Cerrar</button>'), []);
});

test('aria-label en un span sin rol → rojo; con role="img" → verde', () => {
  assert.deepEqual(reglas('<span aria-label="Sube"><sc-icon name="add" /></span>'), ['aria-label-sin-rol']);
  assert.deepEqual(reglas('<span role="img" aria-label="Sube"><sc-icon name="add" /></span>'), []);
});

test('objetos de un .ts: icono, nombre y si es una acción del menú', () => {
  const ts = "const items = [{ label: 'Eliminar', icon: 'sc-icon-font sc-icon-font--close', command: () => x() }, { labelKey: 'nav.agents', icon: 'headphones', route: '/a' }];";
  assert.deepEqual(iconosEnTs(ts).map(({ icono, texto, esAccion }) => [icono, texto, esAccion]), [
    ['close', 'Eliminar', true],
    ['headphones', 'nav.agents', false],
  ]);
});
