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
