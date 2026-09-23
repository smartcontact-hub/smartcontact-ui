#!/usr/bin/env node
/**
 * Lanza varios comandos A LA VEZ y falla si falla cualquiera.
 *
 * Existe para los builds AOT de las apps en `preflight`: en serie iban a ~111% de CPU en un Mac
 * de 10 núcleos. Cada salida se guarda y se imprime ENTERA al acabar su comando, nunca mezclada
 * con las demás: un error de plantilla tiene que poder leerse de un tirón.
 *
 * Los comandos van como argumentos entre comillas en `package.json`, a la vista, porque el gate
 * `ci-preflight-parity` los lee de ahí y los compara con `ci.yml`.
 *
 * Uso:  node scripts/en-paralelo.mjs 'cmd 1' 'cmd 2' …
 */
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** @param {string} cmd */
function correr(cmd) {
  const inicio = Date.now();
  return new Promise((resolve) => {
    const salida = [];
    const hijo = spawn(cmd, { shell: true, env: process.env });
    hijo.stdout.on('data', (d) => salida.push(d));
    hijo.stderr.on('data', (d) => salida.push(d));
    hijo.on('close', (code, signal) => {
      const r = { cmd, code: code ?? 1, signal, segundos: Math.round((Date.now() - inicio) / 1000) };
      const marca = r.code === 0 ? '✓' : '✗';
      process.stdout.write(`\n▶ ${marca} ${cmd}  (${r.segundos}s)\n`);
      process.stdout.write(Buffer.concat(salida));
      resolve(r);
    });
  });
}

/**
 * @param {string[]} cmds
 * @returns {Promise<boolean>} true si TODOS acabaron en 0.
 */
export async function enParalelo(cmds) {
  const resultados = await Promise.all(cmds.map(correr));
  const rotos = resultados.filter((r) => r.code !== 0);
  console.log(`\nen paralelo: ${resultados.length - rotos.length}/${resultados.length} en verde`);
  for (const r of rotos) console.error(`✗ falló (exit ${r.code}${r.signal ? `, ${r.signal}` : ''}): ${r.cmd}`);
  return rotos.length === 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cmds = process.argv.slice(2);
  if (cmds.length === 0) {
    console.error('Uso: node scripts/en-paralelo.mjs \'cmd 1\' \'cmd 2\' …');
    process.exit(2);
  }
  process.exit((await enParalelo(cmds)) ? 0 : 1);
}
