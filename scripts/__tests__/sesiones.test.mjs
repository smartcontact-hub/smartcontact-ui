import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checksDe, duplicadosDe, enOrigin, gemelasDe, parseaWorktrees, prDe, veredictoDe } from '../sesiones.mjs';

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
  assert.deepEqual(wt, [{ ruta: '/repo/wt-a', rama: 'arebury/a', bloqueado: false }]);
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

test('dos cajas de la MISMA rama (`x` y `x-2`) son gemelas, no trabajo duplicado', () => {
  // Caso real del 2026-09-11: `analizar-PRs` y `analizar-PRs-2`, el mismo SHA y el mismo PR #103.
  const cajas = [
    { nombre: 'arebury/analizar-PRs', veredicto: 'ESPERA', sujetos: ['Un comando contesta «¿puedo cerrar este chat?»'] },
    { nombre: 'arebury/analizar-PRs-2', veredicto: 'ESPERA', sujetos: ['Un comando contesta «¿puedo cerrar este chat?»'] },
  ];
  // En rojo: la primera versión decía «funde una y borra la otra» sobre UN solo PR, y salía con exit 1.
  assert.deepEqual(duplicadosDe(cajas), []);
  assert.deepEqual(gemelasDe(cajas), [
    { rama: 'arebury/analizar-PRs', cajas: ['arebury/analizar-PRs', 'arebury/analizar-PRs-2'] },
  ]);
  // Y el mismo título en ramas de verdad distintas SIGUE cantando.
  assert.equal(duplicadosDe([cajas[0], { ...cajas[1], nombre: 'otra/rama' }]).length, 1);
  assert.deepEqual(gemelasDe([cajas[0], { ...cajas[1], nombre: 'otra/rama' }]), []);
});

test('prDe casa primero la rama EXACTA: una rama que acaba en número no pierde su PR', () => {
  const abiertos = [{ number: 7, headRefName: 'feat/dd-30' }];
  assert.equal(prDe('feat/dd-30', abiertos)?.number, 7);
  // En rojo: recortando el sufijo a ciegas, `feat/dd-30` buscaba `feat/dd`, salía «sin PR» y
  // mandaba a abrir un segundo PR de lo que ya estaba subido.
  assert.equal(enOrigin('feat/dd-30'), 'feat/dd');
});

test('checksDe distingue pendiente de vacío', () => {
  assert.equal(checksDe(null).estado, 'sin-checks');
  assert.equal(checksDe({ statusCheckRollup: [{ conclusion: null }] }).estado, 'pendiente');
  assert.equal(checksDe({ statusCheckRollup: [{ conclusion: 'CANCELLED' }] }).estado, 'rojo');
});

// ── La red que impide borrar trabajo ───────────────────────────────────────────
// Los dos casos de abajo NO son hipótesis: son lo que este comando propuso borrar el 2026-09-11,
// la primera vez que se usó de verdad, recién fundido el #103. Cada regla, en rojo y en verde.

test('CERRADA + ficheros sin commitear → SIN GUARDAR, y nunca «borra»', () => {
  const fundido = { number: 103, mergedAt: '2026-09-11T09:20:00Z' };
  const limpio = veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T09:00:00Z' });
  assert.equal(limpio.veredicto, 'CERRADA'); // el caso bueno sigue funcionando
  assert.match(limpio.accion, /borra el worktree/);

  const sucio = veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T09:00:00Z', sucio: true });
  assert.equal(sucio.veredicto, 'SIN GUARDAR');
  assert.doesNotMatch(sucio.accion, /borra/, 'jamás debe proponer borrar algo con trabajo sin guardar');
});

test('VACÍA + ficheros sin commitear → SIN GUARDAR (el caso del worktree de checkbox)', () => {
  assert.equal(veredictoDe({ sinFundir: 0 }).veredicto, 'VACÍA');
  const v = veredictoDe({ sinFundir: 0, sucio: true });
  assert.equal(v.veredicto, 'SIN GUARDAR');
  assert.doesNotMatch(v.accion, /borra/);
});

test('CERRADA + un commit que no está en main POR CONTENIDO → SIN SUBIR', () => {
  // El caso de `arebury/analizar-PRs-2`: su `393d0ab` era ANTERIOR al merge del #103 y no iba
  // dentro, así que comparar fechas nunca podía verlo. `git cherry` sí, porque mira el parche.
  const fundido = { number: 103, mergedAt: '2026-09-11T09:20:00Z' };
  const v = veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T09:03:07Z', noFundidos: 1 });
  assert.equal(v.veredicto, 'SIN SUBIR');
  assert.match(v.accion, /PR #103/, 'debe decir de qué PR cuelga lo que falta por subir');
  assert.doesNotMatch(v.accion, /borra/);
  // En rojo: con la lógica vieja (solo fechas) esto salía CERRADA y mandaba borrarlo. Se prueba
  // pasando `noFundidos: null`, que es justo «no se pudo medir el contenido» → solo queda la fecha.
  assert.equal(veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T09:03:07Z', noFundidos: null }).veredicto, 'CERRADA');
});

test('un worktree `locked` no se propone borrar', () => {
  const v = veredictoDe({ sinFundir: 0, bloqueado: true });
  assert.equal(v.veredicto, 'BLOQUEADO');
  assert.doesNotMatch(v.accion, /borra/);
});

test('lo que NO propone borrar conserva su veredicto y solo avisa', () => {
  const abierto = { number: 9, statusCheckRollup: [{ name: 'verify', conclusion: 'SUCCESS' }] };
  const v = veredictoDe({ abierto, sucio: true });
  assert.equal(v.veredicto, 'LISTA', 'un PR verde sigue siendo fundible aunque haya ficheros sueltos');
  assert.match(v.accion, /⚠ cambios sin commitear/);
});

test('parseaWorktrees marca los `locked`', () => {
  const wt = parseaWorktrees(
    'worktree /a\nHEAD abc\nbranch refs/heads/x\nlocked\n\nworktree /b\nHEAD def\nbranch refs/heads/y\n',
  );
  assert.equal(wt.find((w) => w.rama === 'x').bloqueado, true);
  assert.equal(wt.find((w) => w.rama === 'y').bloqueado, false);
});

// ── El contenido manda sobre la fecha, en los DOS sentidos ─────────────────────

test('FALSO POSITIVO: un commit posterior al merge cuyo contenido YA está en main → CERRADA', () => {
  // `arebury/analizar-PRs-2` el 2026-09-11: su commit era posterior al merge del #103, pero se
  // había fundido aparte como #107, así que `git cherry` no devolvía nada. Decía «falta subirlo».
  const fundido = { number: 103, mergedAt: '2026-09-11T09:20:00Z' };
  const v = veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T10:03:07Z', noFundidos: 0 });
  assert.equal(v.veredicto, 'CERRADA');
  // En rojo: sin `noFundidos`, la fecha sola lo acusaba de tener trabajo sin subir.
  assert.equal(veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T10:03:07Z' }).veredicto, 'SIN SUBIR');
});

test('si no se pudo medir el contenido (null), se cae a la fecha y NUNCA se adivina', () => {
  const fundido = { number: 103, mergedAt: '2026-09-11T09:20:00Z' };
  // git falló: con fecha posterior, conservador (avisa de trabajo sin subir; no borra nada).
  assert.equal(veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T10:03:07Z', noFundidos: null }).veredicto, 'SIN SUBIR');
  // y con fecha anterior sigue diciendo CERRADA, que es el comportamiento de siempre
  assert.equal(veredictoDe({ fundido, ultimoCommitISO: '2026-09-11T09:00:00Z', noFundidos: null }).veredicto, 'CERRADA');
});

test('la red de seguridad no se dispara con `null`, solo con un número mayor que cero', () => {
  const v = veredictoDe({ sinFundir: 0, noFundidos: null });
  assert.equal(v.veredicto, 'VACÍA', 'null no es «hay trabajo fuera»: es «no lo sé»');
  assert.equal(veredictoDe({ sinFundir: 0, noFundidos: 2 }).veredicto, 'SIN SUBIR');
});
