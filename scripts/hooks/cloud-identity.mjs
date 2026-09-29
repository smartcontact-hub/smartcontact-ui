#!/usr/bin/env node
/**
 * Hook SessionStart — si este clon va a firmar como la herramienta, firma con la cuenta del mantenedor.
 *
 * Por qué (2026-09-28, DD-134): el contenedor cloud trae como identidad de git la de la herramienta
 * (en su `/root/.gitconfig`, medido ese día), y al fundir un PR por squash con el mensaje por defecto
 * GitHub añade una línea `Co-authored-by:` por cada autor de commit que no es quien funde. Así entraron
 * en `main` cinco fusiones con la herramienta de coautora (#223, #224, #266, #267 y #270) sin que
 * ningún commit de sus ramas llevara la línea. Con la cuenta del mantenedor, autor y quien funde son la
 * misma cuenta y GitHub no añade nada: medido en el #249, que mezclaba commits de las dos identidades
 * y solo sacó de coautora a la otra. Es decisión de producto del 2026-09-28, igual que la identidad de
 * las sesiones locales, que vive en la config de git de cada máquina.
 *
 * Qué hace: si `origin` es este repo y la identidad con que git firmaría es la de la herramienta,
 * escribe `user.name` y `user.email` en la config del clon, que gana a la global del contenedor (allí
 * no hay variables `GIT_AUTHOR_*` que la pisen, medido). Decide por esa CONDICIÓN y no por la variable
 * `CLAUDE_CODE_REMOTE`: el mismo día, en una sesión programada de la nube, `cloud-node.sh` (que sí
 * depende de ella) no llegó a poner su Node ni a instalar `node_modules`, y no quedó medido por qué.
 * Con cualquier otra identidad (la de una máquina local) calla y no toca nada; con otro `origin` (un
 * fork, otro repo) tampoco: la cuenta del mantenedor no firma trabajo ajeno. Si algo falla lo dice y
 * sale en 0, porque una sesión no se bloquea por esto: el commit con la firma de la herramienta lo pone
 * rojo `audit:commit-attribution` antes de pushear.
 *
 * Salida: una línea en el contexto de la sesión cuando cambia la identidad o cuando no ha podido.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CORREO_HERRAMIENTA } from '../audit-commit-attribution.mjs';

/** La cuenta de GitHub del mantenedor: la del correo con que GitHub firma sus fusiones en `main`. */
export const IDENTIDAD = { nombre: 'Rafa Areses Brackenbury', email: 'rafaelareses@gmail.com' };

/** true si la URL de `origin` es este repo, venga directa de GitHub o por el proxy de la nube. */
export function esEsteRepo(url) {
  return /(?:^|[/:])smartcontact-hub\/smartcontact-ui(?:\.git)?\/?$/i.test(String(url ?? '').trim());
}

/** true si este clon firmaría como la herramienta y es este repo: entonces firma el mantenedor. */
export function debeFirmar({ urlOrigen, correoActual }) {
  return esEsteRepo(urlOrigen) && String(correoActual ?? '').trim().toLowerCase() === CORREO_HERRAMIENTA;
}

export function main({ env = process.env, cwd = env.CLAUDE_PROJECT_DIR || process.cwd(), escribir = (s) => process.stdout.write(s) } = {}) {
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const leer = (...args) => {
    try {
      return git(...args);
    } catch {
      return '';
    }
  };
  try {
    const urlOrigen = leer('remote', 'get-url', 'origin');
    const correoActual = leer('config', 'user.email');
    if (!debeFirmar({ urlOrigen, correoActual })) return;
    git('config', 'user.name', IDENTIDAD.nombre);
    git('config', 'user.email', IDENTIDAD.email);
    const autor = git('var', 'GIT_AUTHOR_IDENT').replace(/\s+\d+\s+[+-]\d{4}$/, '');
    escribir(`sc: los commits de esta sesión firman como ${autor} (DD-134), no con la identidad de la herramienta.\n`);
  } catch (e) {
    escribir(`sc: no pude fijar la identidad de git (${e.message.split('\n')[0]}); audit:commit-attribution lo parará antes del push.\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
