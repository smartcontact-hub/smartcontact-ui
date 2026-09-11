import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checksDe, duplicadosDe, enOrigin, parseaWorktrees, prDe, veredictoDe } from '../sesiones.mjs';

// `npm run sesiones` contesta «¿puedo cerrar este chat?» para todas las cajas a la vez, y su
// respuesta se obedece sin comprobarla: si dice CERRADA se borra un worktree, y si dice SIN SUBIR
// se abre un PR. Así que cada regla se prueba EN ROJO con el caso malo fabricado y EN VERDE
// (LEARNINGS #2). Los tres primeros casos NO son hipótesis: son los tres fallos que este script
// tuvo el 2026-09-10 al correrlo contra el repo de verdad.

const conChecks = (...cs) => ({ number: 42, headRefName: 'r', statusCheckRollup: cs });

test('SQUASH: un PR fundido manda sobre el conteo de commits', () => {
  // El repo funde con squash, así que `origin/main..rama` cuenta 1 PARA SIEMPRE aunque el trabajo
  // esté dentro. Fue el fallo original: el #95 llevaba fundido veinte minutos y salía «SIN SUBIR».
  const fundido = { number: 95, mergedAt: '2026-09-10T17:16:38Z' };
  assert.equal(
    veredictoDe({ sinFundir: 1, fundido, ultimoCommitISO: '2026-09-10T16:29:55Z' }).veredicto,
    'CERRADA',
  );
  // En rojo: si mandara el conteo, esto diría SIN SUBIR y te mandaría a abrir un PR duplicado.
  assert.notEqual(veredictoDe({ sinFundir: 1, fundido, ultimoCommitISO: '2026-09-10T16:29:55Z' }).veredicto, 'SIN SUBIR');
});

test('las fechas se comparan como INSTANTES, no como texto', () => {
  // git da `+02:00` y GitHub da `Z`. Como texto, «18:44+02:00» > «17:16Z» siendo ANTERIOR, y una
  // rama quieta se anunciaba como «commits nuevos encima».
  const fundido = { number: 95, mergedAt: '2026-09-10T17:16:38Z' };
  assert.equal(veredictoDe({ fundido, ultimoCommitISO: '2026-09-10T18:44:56+02:00' }).veredicto, 'CERRADA');
  assert.ok('2026-09-10T18:44:56+02:00' > '2026-09-10T17:16:38Z', 'el bug textual sigue siendo posible: por eso el caso existe');
  // Y cuando la rama SÍ avanzó de verdad, tiene que verse. Caso real del mismo día: el #96 se
  // fundió a las 16:55:19Z y su rama siguió commiteando a las 19:14:37+02:00, que son las 17:14Z.
  const v = veredictoDe({
    fundido: { number: 96, mergedAt: '2026-09-10T16:55:19Z' },
    ultimoCommitISO: '2026-09-10T19:14:37+02:00',
  });
  assert.equal(v.veredicto, 'SIN SUBIR');
  assert.match(v.accion, /encima del PR #96/);
});

test('un worktree `…-2` empuja a la rama SIN sufijo', () => {
  const abiertos = [{ number: 95, headRefName: 'arebury/verdict-avisa-pr-fundido' }];
  assert.equal(enOrigin('arebury/verdict-avisa-pr-fundido-2'), 'arebury/verdict-avisa-pr-fundido');
  assert.equal(prDe('arebury/verdict-avisa-pr-fundido-2', abiertos)?.number, 95);
  // En rojo: sin la convención, la caja `-2` sale «sin PR» y provoca el segundo PR de lo mismo.
  assert.equal(abiertos.find((p) => p.headRefName === 'arebury/verdict-avisa-pr-fundido-2'), undefined);
});

test('el árbol principal `bare` no es una caja', () => {
  const wt = parseaWorktrees(
    'worktree /repo\nbare\n\nworktree /repo/wt-a\nHEAD abc\nbranch refs/heads/arebury/a\n',
  );
  assert.deepEqual(wt, [{ ruta: '/repo/wt-a', rama: 'arebury/a' }]);
});

test('los checks deciden entre ESPERA, ROJA y LISTA', () => {
  assert.equal(veredictoDe({ abierto: conChecks({ name: 'verify', conclusion: 'SUCCESS' }) }).veredicto, 'LISTA');
  assert.equal(
    veredictoDe({ abierto: conChecks({ name: 'verify', conclusion: 'SUCCESS' }, { name: 'e2e', conclusion: null }) }).veredicto,
    'ESPERA',
  );
  assert.equal(veredictoDe({ abierto: conChecks({ name: 'e2e', conclusion: 'FAILURE' }) }).veredicto, 'ROJA');
  // Un PR recién abierto no tiene checks todavía: eso es esperar, no vía libre para fundir.
  assert.equal(veredictoDe({ abierto: conChecks() }).veredicto, 'ESPERA');
  // Verde y con conflicto NO es fundible, por muy verde que esté.
  assert.equal(
    veredictoDe({ abierto: { ...conChecks({ name: 'verify', conclusion: 'SUCCESS' }), mergeable: 'CONFLICTING' } }).veredicto,
    'CONFLICTO',
  );
});

test('una caja sin PR y sin commits está VACÍA; con commits, SIN SUBIR', () => {
  assert.equal(veredictoDe({ sinFundir: 0 }).veredicto, 'VACÍA');
  assert.match(veredictoDe({ sinFundir: 1 }).accion, /1 commit dentro/);
  assert.match(veredictoDe({ sinFundir: 3 }).accion, /3 commits dentro/);
});

test('el mismo título en dos cajas se canta como duplicado', () => {
  const cajas = [
    { nombre: 'a', veredicto: 'SIN SUBIR', sujetos: ['El veredicto del CI responde a «¿puedo fundir?»'] },
    { nombre: 'b', veredicto: 'SIN SUBIR', sujetos: ['El veredicto del CI responde a «¿puedo fundir?»'] },
    { nombre: 'c', veredicto: 'SIN SUBIR', sujetos: ['Otra cosa distinta'] },
  ];
  const d = duplicadosDe(cajas);
  assert.equal(d.length, 1);
  assert.deepEqual(d[0].ramas, ['a', 'b']);
  assert.match(d[0].detalle, /funde una y borra la otra/);

  // Si las dos copias ya están fundidas, el consejo es otro: sobran las dos.
  const fundidas = cajas.slice(0, 2).map((c) => ({ ...c, veredicto: 'CERRADA' }));
  assert.match(duplicadosDe(fundidas)[0].detalle, /borra los 2 worktrees/);

  // En rojo: sin duplicación no debe cantar nada.
  assert.deepEqual(duplicadosDe([cajas[0], cajas[2]]), []);
});

test('checksDe distingue pendiente de vacío', () => {
  assert.equal(checksDe(null).estado, 'sin-checks');
  assert.equal(checksDe({ statusCheckRollup: [{ conclusion: null }] }).estado, 'pendiente');
  assert.equal(checksDe({ statusCheckRollup: [{ conclusion: 'CANCELLED' }] }).estado, 'rojo');
});
