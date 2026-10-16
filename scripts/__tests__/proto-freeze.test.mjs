// Congelar un prototipo (DD-212): el ID de una versión, la siguiente versión libre de un ticket ya congelado y
// la tabla de `docs/PROTOTIPOS.md` con versiones. node:test, dentro de `test:unit`. Cada regla, en verde y con
// el caso malo en rojo (LEARNINGS #2).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { filas, malTicket, ramaDe, siguienteVersion, ticketBase, urlDe } from '../proto-freeze.core.mjs';

test('un ID es el ticket de Jira y, desde la segunda versión, -vN', () => {
  assert.equal(malTicket('SISMAC-4058'), null);
  assert.equal(malTicket('SISMAC-4058-v2'), null);
  assert.equal(malTicket('SISMAC-4058-v12'), null);
});

test('ROJO · lo que no es un ID: minúsculas, una versión sin «v» o pegada', () => {
  for (const malo of ['sismac-4058', 'SISMAC-4058-2', 'SISMAC-4058v2', 'SISMAC-4058-v', 'SISMAC']) {
    assert.notEqual(malTicket(malo), null, malo);
  }
});

test('la siguiente versión de un ticket ya congelado es -v2, y luego -v3, sin pisar ninguna', () => {
  assert.equal(siguienteVersion('SISMAC-4058', ['proto/SISMAC-4058']), 'SISMAC-4058-v2');
  assert.equal(siguienteVersion('SISMAC-4058', ['proto/SISMAC-4058', 'proto/SISMAC-4058-v2']), 'SISMAC-4058-v3');
  // Desde una versión también: la siguiente es la del ticket, no la de esa versión.
  assert.equal(siguienteVersion('SISMAC-4058-v2', ['proto/SISMAC-4058', 'proto/SISMAC-4058-v2']), 'SISMAC-4058-v3');
  // Las de otro ticket no cuentan.
  assert.equal(siguienteVersion('SISMAC-4062', ['proto/SISMAC-4058', 'proto/SISMAC-4058-v2']), 'SISMAC-4062-v2');
  assert.equal(ticketBase('SISMAC-4058-v3'), 'SISMAC-4058');
});

test('una versión tiene su propia rama y su propia URL: la anterior no se mueve', () => {
  assert.equal(ramaDe('SISMAC-4058-v2'), 'proto/sismac-4058-v2');
  assert.equal(urlDe('SISMAC-4058-v2', 'sc-supervisor'), 'https://proto-sismac-4058-v2.sc-supervisor.pages.dev');
  assert.notEqual(urlDe('SISMAC-4058-v2', 'sc-supervisor'), urlDe('SISMAC-4058', 'sc-supervisor'));
});

test('la tabla lee las filas con versión, que `proto:check` compara con su etiqueta', () => {
  const md = [
    '| Ticket | Fecha | App | Etiqueta | URL congelada | Qué cubre |',
    '| --- | --- | --- | --- | --- | --- |',
    '| SISMAC-4058-v2 | 2026-10-16 | supervisor | `proto/SISMAC-4058-v2` | [proto-sismac-4058-v2.sc-supervisor.pages.dev](https://proto-sismac-4058-v2.sc-supervisor.pages.dev) | Grupos |',
    '| SISMAC-4058 | 2026-10-16 | supervisor | `proto/SISMAC-4058` | [proto-sismac-4058.sc-supervisor.pages.dev](https://proto-sismac-4058.sc-supervisor.pages.dev) | Grupos |',
  ].join('\n');
  const [v2, v1] = filas(md);
  assert.equal(v2.ticket, 'SISMAC-4058-v2');
  assert.equal(v2.etiqueta, 'proto/SISMAC-4058-v2');
  assert.equal(v2.url, urlDe(v2.ticket, 'sc-supervisor'));
  assert.equal(v1.ticket, 'SISMAC-4058');
});

test('la tabla real se lee entera: cada fila con su ID, su etiqueta y una URL que cuadra con el ID', () => {
  const md = readFileSync(fileURLToPath(import.meta.resolve('../../docs/PROTOTIPOS.md')), 'utf8');
  const registradas = filas(md);
  assert.ok(registradas.length > 0);
  for (const f of registradas) {
    assert.equal(malTicket(f.ticket), null, f.ticket);
    assert.equal(f.etiqueta, `proto/${f.ticket}`, f.ticket);
    assert.match(f.url, new RegExp(`^https://proto-${f.ticket.toLowerCase()}\\.`), f.ticket);
  }
});
