import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FIGMA_TEXT_STYLES,
  PESOS_VALIDOS,
  ROLES,
  TIPOGRAFIA_DELIBERADA,
  aPx,
  esCajaDeIcono,
  esInterlineadoApretado,
  tipografiaDe,
} from '../audit-text-styles.mjs';

/*
 * Lo que se prueba aquí es la tercera comprobación del gate (2026-09-11): que el CSS de
 * pantalla no declare tipografía fuera de los 12 roles.
 *
 * Tiene dos modos de fallo que ya se dieron al construirla, y por eso cada uno tiene su
 * test:
 *
 *   · MIRAR SIN VER. La tabla de tokens se resolvía pasándole a `resolver` el NOMBRE en
 *     vez del valor, así que salía vacía: todas las búsquedas daban null, no se marcaba
 *     nada y el gate cantaba «0 fuera de rol» estando ciego. Lo cazó que una sonda
 *     independiente contaba 8 (LEARNINGS #2).
 *   · MARCAR DE MÁS. Un `font-size` sobre un glifo (`__caret`, `__check`) no es un
 *     estilo de texto, y marcarlo convertía el gate en ruido: 3 de los 9 primeros avisos
 *     eran eso.
 */

/* Tablas mínimas, escritas a mano: el test no debe depender de la misma resolución que
 * el código que prueba, o se mediría a sí mismo. */
const SIZE = { '--sc-font-size-100': 12, '--sc-font-size-200': 14, '--sc-font-size-300': 16 };
const LH = { '--sc-line-height-100': 18, '--sc-line-height-200': 20, '--sc-line-height-300': 24 };
const PESO = {
  '--sc-font-weight-regular': 400,
  '--sc-font-weight-medium': 500,
  '--sc-font-weight-semibold': 600,
  '--sc-font-weight-bold': 700,
};
const tablas = { size: SIZE, lh: LH, peso: PESO };

/* ── los roles salen de Figma, no de una copia ────────────────────────────── */

test('ROLES y PESOS_VALIDOS derivan de FIGMA_TEXT_STYLES', () => {
  for (const estilo of FIGMA_TEXT_STYLES) {
    assert.equal(ROLES.get(estilo.size), estilo.lh, `${estilo.estilo}`);
    assert.ok(PESOS_VALIDOS.has(estilo.weight), `peso de ${estilo.estilo}`);
  }
});

test('los únicos pesos del sistema son 400 y 600 — el 500 no existe', () => {
  assert.deepEqual([...PESOS_VALIDOS].sort(), [400, 600]);
});

/* ── aPx ──────────────────────────────────────────────────────────────────── */

test('aPx entiende las tres formas en que el repo escribe un tamaño', () => {
  assert.equal(aPx('calc(14 / 16 * 1rem)'), 14);
  assert.equal(aPx('0.875rem'), 14);
  assert.equal(aPx('14px'), 14);
  assert.equal(aPx('no-es-un-numero'), null);
});

/* ── la exclusión de iconos ───────────────────────────────────────────────── */

test('un `font-size` sobre un glifo NO es un estilo de texto', () => {
  for (const s of ['.vpick__caret', '.menu__chevron', '.row__check', '.card__icon', '.impact__dot']) {
    assert.equal(esCajaDeIcono(s), true, s);
  }
});

test('…y no se traga nombres que solo CONTIENEN esas palabras', () => {
  for (const s of ['.checkbox-row', '.icon-label', '.dotted-list', '.check-summary']) {
    assert.equal(esCajaDeIcono(s), false, s);
  }
});

/* ── tipografiaDe ─────────────────────────────────────────────────────────── */

test('marca el peso que no es de ningún text style', () => {
  const r = tipografiaDe('.x { font-size: var(--sc-font-size-200); font-weight: var(--sc-font-weight-medium); }', tablas);
  assert.equal(r.length, 1);
  assert.match(r[0].fallos[0], /peso 500/);
});

test('marca el tamaño que no es peldaño de ningún rol', () => {
  const r = tipografiaDe('.x { font-size: var(--sc-font-size-300); }', tablas);
  assert.match(r[0].fallos[0], /tamaño 16/);
});

test('el MISMO tamaño sobre un icono no se marca — el control negativo', () => {
  assert.deepEqual(tipografiaDe('.x__caret { font-size: var(--sc-font-size-300); }', tablas), []);
});

test('marca el interlineado que no es el de su tamaño', () => {
  const r = tipografiaDe(
    '.x { font-size: var(--sc-font-size-200); line-height: var(--sc-line-height-300); }',
    tablas,
  );
  assert.match(r[0].fallos[0], /14\/24/);
});

test('marca el tamaño declarado SIN su interlineado', () => {
  const r = tipografiaDe('.x { font-size: var(--sc-font-size-200); }', tablas);
  assert.match(r[0].fallos[0], /NO su interlineado/);
});

test('…pero no en un chip ni en un icono: esos dos son los controles negativos', () => {
  /* Un chip hereda un `line-height: 1` a propósito —su altura la manda el padding— y
   * ponerle el del rol lo hace crecer 6px. Un icono no es texto. Si el gate los marcara,
   * serían 26 avisos que nadie puede atender, y eso enseña a ignorarlo. */
  assert.deepEqual(tipografiaDe('.x__chip { font-size: var(--sc-font-size-200); }', tablas), []);
  assert.deepEqual(tipografiaDe('.x__caret { font-size: var(--sc-font-size-200); }', tablas), []);
});

test('reconoce los muebles de interlineado apretado por su nombre', () => {
  for (const s of ['.a__pill', '.b__chip', '.c__badge', '.d-tag', '.e__count', '.f__num']) {
    assert.equal(esInterlineadoApretado(s), true, s);
  }
  for (const s of ['.numeric-field', '.counter-row', '.tagline'] ) {
    assert.equal(esInterlineadoApretado(s), false, s);
  }
});

test('un rol bien puesto no se marca', () => {
  const bien = '.x { font-size: var(--sc-font-size-200); line-height: var(--sc-line-height-200); font-weight: var(--sc-font-weight-semibold); }';
  assert.deepEqual(tipografiaDe(bien, tablas), []);
});

test('el `line-height` SIN UNIDAD no se marca: está aparcado con razón', () => {
  /* `NEXT-SESSION.md` → «Aparcado con razón»: no hay token destino en el Kit. Pedirlo
   * sería pedir algo que el sistema no puede dar. */
  const r = tipografiaDe('.x { font-size: var(--sc-font-size-200); line-height: 1.4; }', tablas);
  assert.deepEqual(r, []);
});

test('una tabla de tokens VACÍA no puede dar verde en silencio', () => {
  /* El modo de fallo real: si la resolución se rompe, todo da null y el gate dice «0
   * fuera de rol» estando ciego. Con las tablas vacías, un peso literal se sigue viendo. */
  const r = tipografiaDe('.x { font-size: 14px; font-weight: 500; }', { size: {}, lh: {}, peso: {} });
  assert.equal(r.length, 1, 'con las tablas vacías debe seguir viendo el peso literal');
});

/* ── contra el repo real ──────────────────────────────────────────────────── */

test('toda entrada de TIPOGRAFIA_DELIBERADA lleva un motivo de verdad', () => {
  for (const [selector, motivo] of Object.entries(TIPOGRAFIA_DELIBERADA)) {
    assert.ok(motivo.length > 60, `${selector}: el motivo es demasiado corto para explicar nada`);
  }
});

test('el gate corre en verde sobre el repo tal cual está', () => {
  execSync('node scripts/audit-text-styles.mjs', { stdio: 'ignore' });
});

test('ninguna hoja del supervisor declara `font-weight: medium`', () => {
  /* El bucket grande del barrido: 76 reglas. Este test es el trinquete de que no vuelva. */
  const hojas = execSync("find projects/supervisor/src -name '*.scss'", { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const culpables = hojas.filter((h) => /font-weight:\s*var\(--sc-font-weight-medium\)/.test(readFileSync(h, 'utf8')));
  assert.deepEqual(culpables, []);
});
