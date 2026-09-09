import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FRAGMENTOS,
  compararPatrones,
  entradasDocs,
  sliceUx,
  titulosAgents,
} from '../patrones-parity.mjs';

const AGENTS = readFileSync('AGENTS.md', 'utf8');
const RUTA_PATRONES = 'projects/sc-docs/src/app/pages/patrones/patrones.component.ts';
const PATRONES = readFileSync(RUTA_PATRONES, 'utf8');
// El texto de los principios vive en i18n (es = referencia); la página solo guarda la clave.
const ES = JSON.parse(readFileSync('projects/sc-docs/public/assets/i18n/es.json', 'utf8'));
const PRINCIPIOS = ES.fundamentos.patterns.principles;

/*
 * El caso verde se mide contra las DOS fuentes reales: un fixture amable probaría el fixture.
 * Los rojos son las dos derivas que de verdad ocurren — se añade un principio en un lado, o
 * se recorta una regla al reescribir una tarjeta — y la segunda ya había pasado de verdad.
 */

/* ── lectores ─────────────────────────────────────────────────────────────── */

test('recorta la sección de AGENTS y no se lleva la siguiente', () => {
  const s = sliceUx(AGENTS);
  assert.match(s, /^## UX de pantalla/);
  assert.equal(s.includes('\n## '), false);
});

test('lee los principios numerados de AGENTS', () => {
  const t = titulosAgents(sliceUx(AGENTS));
  assert.ok(t.length >= 7, `esperaba al menos 7, leí ${t.length}`);
  assert.deepEqual(
    t.map((x) => x.n),
    t.map((_, i) => i + 1),
    'los números tienen que ir corridos desde 1',
  );
});

test('lee las entradas de la página con su título', () => {
  const e = entradasDocs(PATRONES, PRINCIPIOS);
  assert.equal(e.length, titulosAgents(sliceUx(AGENTS)).length);
  assert.ok(e.every((x) => x.titulo.length > 0));
});

test('sección renombrada → lo dice en vez de callar', () => {
  const p = compararPatrones('# Otro doc\n\n## Otra cosa\n', PATRONES, PRINCIPIOS);
  assert.equal(p.length, 1);
  assert.match(p[0], /no encuentro la sección/);
});

/* ── el par REAL cuadra ───────────────────────────────────────────────────── */

test('AGENTS y la página de Patrones cuadran hoy', () => {
  assert.deepEqual(compararPatrones(AGENTS, PATRONES, PRINCIPIOS), []);
});

/* ── rojos: las dos derivas que ocurren de verdad ─────────────────────────── */

test('ROJO: AGENTS gana un principio y la página se queda atrás', () => {
  // El número del principio inyectado se calcula: escrito a mano había que venir a tocar este
  // test cada vez que la barra de calidad crece, y eso convierte una red en un peaje.
  const n = titulosAgents(sliceUx(AGENTS)).length;
  const conUnoDeMas = AGENTS.replace(
    '## Mandatory Workflow',
    `${n + 1}. **Principio nuevo.** Algo que alguien añadió sin tocar la página.\n\n## Mandatory Workflow`,
  );
  const p = compararPatrones(conUnoDeMas, PATRONES, PRINCIPIOS);
  assert.ok(
    p.some((x) => new RegExp(`AGENTS tiene ${n + 1} principios y la página ${n}`).test(x)),
    p.join(' | '),
  );
});

test('ROJO: una tarjeta pierde una regla al reescribirse (el caso que ya pasó)', () => {
  // La regla load-bearing del principio 1 vive ahora en el texto i18n, no en el `.ts`.
  const principios = JSON.parse(JSON.stringify(PRINCIPIOS));
  principios.color.avoid = principios.color.avoid.replace(
    'no voltea en oscuro y queda ilegible',
    'queda raro',
  );
  assert.notEqual(
    principios.color.avoid,
    PRINCIPIOS.color.avoid,
    'el reemplazo tiene que morder para que el test valga',
  );
  const p = compararPatrones(AGENTS, PATRONES, principios);
  assert.equal(p.length, 1);
  assert.match(p[0], /principio 1/);
});

/* ── higiene de FRAGMENTOS ────────────────────────────────────────────────── */

test('FRAGMENTOS cubre todos los principios y ninguno de más', () => {
  const n = titulosAgents(sliceUx(AGENTS)).length;
  assert.deepEqual(
    Object.keys(FRAGMENTOS).map(Number).sort((a, b) => a - b),
    Array.from({ length: n }, (_, i) => i + 1),
  );
});

test('cada patrón de FRAGMENTOS muerde de verdad contra la página real', () => {
  const entradas = entradasDocs(PATRONES, PRINCIPIOS);
  for (const [n, patrones] of Object.entries(FRAGMENTOS)) {
    for (const patron of patrones) {
      assert.match(entradas[Number(n) - 1].texto, patron, `principio ${n}: ${patron} no casa`);
    }
  }
});
