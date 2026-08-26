import { execFileSync } from 'node:child_process';

/**
 * ¿EL SERVIDOR QUE YA ESCUCHA EN ESE PUERTO ES TUYO, O DE OTRA SESIÓN?
 *
 * Los cuatro configs de Playwright fijan puerto (sc-docs :4280, usage :4290,
 * supervisor :4405, cuscare :4415) y traían `reuseExistingServer: !CI`. Eso da
 * por bueno CUALQUIER cosa que conteste en ese puerto. Con un solo árbol es
 * cómodo —reruns sin pagar los ~40 s de arranque—; con varios worktrees de
 * agente vivos a la vez es una trampa, porque el puerto es un espacio de nombres
 * COMPARTIDO entre todos.
 *
 * Medido el 2026-08-24 (s31): rompí `goToPage()` a propósito para ver dos tests
 * caer y salieron **verdes**. Playwright encontró :4415 contestando y se enganchó
 * al `ng serve` de OTRO worktree (`exciting-tesla-f1e6de`, otra sesión viva), o
 * sea que medí su código, no el mío. Mi propio server había muerto al compilar
 * —`TS2307: Cannot find module '@smartcontact-hub/components'`, impreso en mi log
 * y no leído— y los tests pasaban tan contentos. Solo lo cacé porque el resultado
 * era IMPOSIBLE (un componente roto pasando), que es suerte, no método: con un
 * cambio más sutil —validar un arreglo en vez de una rotura— el verde ajeno se
 * habría ido de paseo hasta producción.
 *
 * Un verde de otro es peor que un rojo de otro (regla 2 de `LEARNINGS.md`): el
 * rojo te obliga a mirar y el verde te invita a seguir.
 *
 * Este guardián no quita la reutilización, la ACOTA: reutiliza si el proceso que
 * escucha nació en tu mismo directorio de trabajo, y si no, **para con un mensaje
 * que dice de quién es el puerto**. Un fallo ruidoso cuesta segundos; una medición
 * silenciosamente equivocada cuesta todo lo que construyas encima.
 *
 * @param {number} port puerto del `webServer` de ese config.
 * @returns {boolean} el valor de `reuseExistingServer`.
 * @throws si algo escucha y no se puede probar que es tuyo.
 */
export function reuseOnlyOwnServer(port) {
  // En CI cada job es una máquina limpia: nunca reutilices, y así un puerto
  // ocupado peta en vez de colarse.
  if (process.env['CI']) return false;

  otraCadenaViva(port);

  const pid = listenerPid(port);
  if (pid === null) return true; // nadie escucha → Playwright arrancará el suyo

  const cwd = pid === undefined ? undefined : processCwd(pid);
  if (cwd !== undefined && cwd === process.cwd()) return true; // es el nuestro

  throw new Error(
    [
      `[playwright] El puerto ${port} ya lo ocupa un servidor que NO es de este árbol.`,
      cwd !== undefined
        ? `  Ese servidor arrancó en: ${cwd}`
        : `  No se ha podido determinar de quién es (¿sin \`lsof\`?).`,
      `  Tú estás en:              ${process.cwd()}`,
      '',
      '  Reutilizarlo mediría el código de OTRA sesión y te daría un verde que no es tuyo.',
      '  Salidas, de menos a más invasiva:',
      `    · Arranca el tuyo aparte y apunta a él:  SC_*_URL=http://localhost:<puerto libre>`,
      `    · Fuerza servidor propio:                CI=1 npm run e2e:<suite>`,
      `    · O espera a que la otra sesión termine y suelte el puerto ${port}.`,
    ].join('\n'),
  );
}

/**
 * PID que escucha en el puerto.
 * `null` = nadie · `undefined` = no se puede saber (sin `lsof`) · número = ese.
 *
 * Se distinguen los dos casos a propósito: "nadie escucha" es inocuo, pero
 * "no puedo saberlo" con algo escuchando NO lo es, y colapsarlos devolvería el
 * agujero que este fichero existe para tapar.
 *
 * @param {number} port
 * @returns {number | null | undefined}
 */
function listenerPid(port) {
  try {
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out ? Number(out.split('\n')[0]) : null;
  } catch (err) {
    // `lsof -t` sale con 1 cuando no hay ninguna coincidencia: eso es "nadie".
    if (err && /** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') return undefined;
    return null;
  }
}

/**
 * Directorio en el que arrancó ese proceso, o `undefined` si no se puede leer.
 *
 * @param {number} pid
 * @returns {string | undefined}
 */
function processCwd(pid) {
  try {
    const out = execFileSync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const line = out.split('\n').find((l) => l.startsWith('n'));
    return line ? line.slice(1) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * ¿HAY OTRA CADENA DE TESTS CORRIENDO AHORA MISMO, DEL MISMO ÁRBOL?
 *
 * El chequeo de arriba acota la reutilización a los servidores de TU directorio.
 * Eso deja pasar el caso peor: **dos cadenas tuyas a la vez**. Las dos nacen en
 * el mismo `cwd`, así que el guardián las bendice, comparten el mismo `ng serve`
 * y se pisan — una siembra datos mientras la otra los lee, una limpia el
 * `localStorage` a mitad del test de la otra.
 *
 * Medido el 2026-08-25 (s34): lancé la cadena DOS veces sin darme cuenta (una
 * antes de compactar el contexto y otra después). Las dos suites del supervisor
 * corrieron contra el mismo servidor: la tabla salía VACÍA, los primeros tests
 * caían con timeouts de 90 s y la suite iba camino de **dos horas**. Con una sola
 * cadena y la máquina libre: **127/127 en 1,8 minutos**. Estuve a punto de
 * atribuirlo al código —el rastro apuntaba a un `sc-datatable` que renderizaba
 * sin filas— y de "arreglar" algo que no estaba roto.
 *
 * Es la regla 7 de `LEARNINGS.md` ("córrela UNA vez") convertida en máquina,
 * porque esa regla la tenía escrita y la incumplí igual: el disparador que falta
 * en la cabeza es justo el que aquí sobra, **acordarte de que ya la lanzaste**.
 * Tras una compactación o un relevo de sesión, no te acuerdas.
 *
 * Escape: `SC_ALLOW_PARALLEL_SUITES=1` para el caso legítimo de querer dos suites
 * distintas a la vez. Explícito, no por descuido.
 *
 * @param {number} port puerto de la suite que intenta arrancar (solo para el mensaje).
 */
function otraCadenaViva(port) {
  if (process.env['SC_ALLOW_PARALLEL_SUITES'] === '1') return;

  /*
   * Playwright evalúa el config UNA VEZ POR WORKER, y en los primeros segundos varios
   * arrancan a la vez: cada uno ve a sus hermanos por `pgrep` y los denuncia como "otra
   * ejecución". Medido el 2026-08-26: con `--workers=4` morían 8 de 13 tests por esto, y
   * el mensaje culpaba a una concurrencia que no existía.
   *
   * La pregunta que este guardián responde —¿hay OTRA cadena viva?— se contesta una sola
   * vez, al arrancar la ejecución. En los workers, Playwright define `TEST_WORKER_INDEX`;
   * ahí ya está contestada.
   */
  if (process.env['TEST_WORKER_INDEX'] !== undefined) return;

  /*
   * Los workers de UNA misma ejecución son HERMANOS, no antepasados, así que
   * `nuestros()` —que sube por los padres— no los reconoce y cada worker denuncia a los
   * demás. Medido el 2026-08-26: con `--workers=4`, 7 de 23 tests morían aquí, y el
   * mensaje decía "otra ejecución" cuando era la misma. Por eso además del linaje se
   * mira el GRUPO DE PROCESO: los hermanos lo comparten, otra cadena no.
   */
  const propios = nuestros();
  const miGrupo = grupoDe(process.pid);
  const ajenos = pidsDePlaywright().filter(
    (pid) => !propios.has(pid) && !(miGrupo !== undefined && grupoDe(pid) === miGrupo),
  );
  if (ajenos.length === 0) return;

  throw new Error(
    [
      `[playwright] Ya hay OTRA ejecución de Playwright viva (pid ${ajenos.join(', ')}).`,
      `  Esta suite (puerto ${port}) compartiría servidor con ella y las dos se pisarían:`,
      '  datos sembrados por una, leídos por la otra; sesión limpiada a mitad de un test.',
      '',
      '  El síntoma NO parece de concurrencia: tablas vacías, timeouts largos y una suite',
      '  que tarda 40× lo normal. Se lee como un bug del producto, y no lo es.',
      '',
      '  Salidas:',
      '    · Espera a que termine la otra (o mátala) y relanza — es lo normal.',
      '    · Si de verdad quieres dos suites distintas a la vez: SC_ALLOW_PARALLEL_SUITES=1',
    ].join('\n'),
  );
}

/**
 * Grupo de proceso de un PID, o `undefined` si no se puede leer. Los workers de una misma
 * ejecución de Playwright lo comparten; una cadena distinta, no.
 *
 * @param {number} pid
 * @returns {number | undefined}
 */
function grupoDe(pid) {
  try {
    const out = execFileSync('ps', ['-o', 'pgid=', '-p', String(pid)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const pgid = Number(out);
    return Number.isInteger(pgid) ? pgid : undefined;
  } catch {
    return undefined;
  }
}

/**
 * PIDs de procesos `playwright test` vivos.
 *
 * @returns {number[]}
 */
function pidsDePlaywright() {
  try {
    const out = execFileSync('pgrep', ['-f', 'playwright test'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out ? out.split('\n').map(Number).filter((n) => Number.isInteger(n)) : [];
  } catch {
    // `pgrep` sale con 1 si no hay coincidencias, y con ENOENT si no existe.
    // En los dos casos: no podemos afirmar que haya otra cadena → no bloquees.
    return [];
  }
}

/**
 * Nuestro propio proceso y toda su cadena de padres. El proceso que ejecuta este
 * fichero ES un `playwright test`, así que sin esto el guardián se denunciaría a
 * sí mismo — el modo de fallo clásico de un chequeo que se busca en su propia
 * lista.
 *
 * @returns {Set<number>}
 */
function nuestros() {
  const set = new Set();
  let pid = process.pid;
  for (let i = 0; i < 12 && pid > 1; i++) {
    set.add(pid);
    try {
      const out = execFileSync('ps', ['-o', 'ppid=', '-p', String(pid)], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const ppid = Number(out);
      if (!Number.isInteger(ppid) || ppid <= 1) break;
      pid = ppid;
    } catch {
      break;
    }
  }
  return set;
}
