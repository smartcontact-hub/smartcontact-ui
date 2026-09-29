import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CUERPO_POR_DEFECTO, mensajeDeSquash } from '../mensaje-squash.mjs';

// El mensaje con que el robot funde la auditoría semanal. Lo que importa es lo que NO viaja a
// `main`: los trailers de autoría y el pie que el servidor MCP añade a una portada creada en la nube.
// Y, del workflow, que ningún squash deje el mensaje a GitHub (así entró el #266 con coautora).

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = join(raiz, 'scripts', 'mensaje-squash.mjs');

test('asunto: el título del PR con su número, como el de GitHub', () => {
  const { asunto } = mensajeDeSquash({ number: 300, title: '  chore(audit): auditoría semanal 2026-10-05 ', body: '' });
  assert.equal(asunto, 'chore(audit): auditoría semanal 2026-10-05 (#300)');
});

test('cuerpo: fuera trailers y pie de la herramienta; la raya del medio se queda', () => {
  const body = [
    '## Hallazgos',
    '',
    '- uno',
    '',
    '---',
    '',
    '- dos',
    '',
    'Co-authored-by: Claude <noreply@anthropic.com>',
    'Co-Authored-By: Otra Persona <otra@example.com>',
    'Signed-off-by: Alguien <a@example.com>',
    '',
    '---',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
    'https://claude.ai/code/session_01Mt9NQoD65Km9Aw79Ed9fZw',
    '',
  ].join('\r\n');
  const { cuerpo } = mensajeDeSquash({ number: 1, title: 't', body });
  assert.equal(cuerpo, '## Hallazgos\n\n- uno\n\n---\n\n- dos');
  assert.doesNotMatch(cuerpo, /co-authored-by|signed-off-by|claude code|claude\.ai|\r/i);
});

test('cuerpo: un PR sin cuerpo lleva uno escrito, nunca vacío (vacío, GitHub vuelve a componerlo)', () => {
  for (const body of ['', null, undefined, '\n\n---\n', 'Co-authored-by: Claude <noreply@anthropic.com>'])
    assert.equal(mensajeDeSquash({ number: 1, title: 't', body }).cuerpo, CUERPO_POR_DEFECTO, JSON.stringify(body));
});

test('CLI: lee el JSON de `gh pr view` y escribe la parte pedida', () => {
  const pr = JSON.stringify({ number: 7, title: 'Título', body: 'Cuerpo\n\nCo-authored-by: Claude <noreply@anthropic.com>' });
  const correr = (parte) => spawnSync(process.execPath, [SCRIPT, parte], { input: pr, encoding: 'utf8' });
  assert.equal(correr('asunto').stdout, 'Título (#7)\n');
  assert.equal(correr('cuerpo').stdout, 'Cuerpo\n');
  assert.equal(correr('otra').status, 2);
  assert.equal(spawnSync(process.execPath, [SCRIPT, 'asunto'], { input: '{}', encoding: 'utf8' }).status, 1);
});

test('audit-automerge.yml funde con el mensaje escrito, sacado de este script', () => {
  const yml = readFileSync(join(raiz, '.github', 'workflows', 'audit-automerge.yml'), 'utf8');
  assert.match(yml, /sparse-checkout: scripts\/mensaje-squash\.mjs/);
  assert.match(yml, /ASUNTO=\$\(printf '%s' "\$PR_JSON" \| node scripts\/mensaje-squash\.mjs asunto\)/);
  assert.match(yml, /CUERPO=\$\(printf '%s' "\$PR_JSON" \| node scripts\/mensaje-squash\.mjs cuerpo\)/);
  assert.match(yml, /gh pr merge "\$PR" [^\n]*--squash[^\n]*--subject "\$ASUNTO" --body "\$CUERPO"/);
});

test('ningún workflow funde por squash dejándole el mensaje a GitHub', () => {
  const dir = join(raiz, '.github', 'workflows');
  const sinMensaje = [];
  for (const f of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)))
    for (const linea of readFileSync(join(dir, f), 'utf8').split('\n'))
      if (/^\s*gh pr merge\b.*--squash/.test(linea) && !(/--subject\b/.test(linea) && /--body\b/.test(linea))) sinMensaje.push(`${f}: ${linea.trim()}`);
  assert.deepEqual(sinMensaje, []);
});
