import { test } from 'node:test';
import assert from 'node:assert/strict';

import { evaluar } from '../hooks/bash-guard.mjs';

// Cada patrón del hook se prueba EN ROJO (el comando que motivó la regla) y EN VERDE (la forma
// correcta y los vecinos legítimos). Un guardián que solo se ha visto pasar no prueba que sepa
// fallar, y uno con falsos positivos enseña a ignorarlo (LEARNINGS 2).

const verde = { preflight: () => ({ ok: true, motivo: 'ok' }) };
const rojo = { preflight: () => ({ ok: false, motivo: 'no hay marca' }) };
const deny = (cmd, ctx, regla) => {
  const r = evaluar(cmd, ctx);
  assert.equal(r.decision, 'deny', `debía denegar: ${cmd}`);
  assert.match(r.reason, regla);
};
const allow = (cmd, ctx = verde) => assert.equal(evaluar(cmd, ctx).decision, 'allow', `debía dejar pasar: ${cmd}`);

test('#7 push: sin marca fresca → deny; con marca → allow; tags/borrados/dry-run no cuentan', () => {
  deny('git push origin main', rojo, /LEARNINGS #7/);
  deny('git add -A && git commit -m "x" && git push', rojo, /LEARNINGS #7/);
  allow('git push origin main', verde);
  allow('git push origin archive/learnings-2026-09-02', rojo);
  allow('git push --tags', rojo);
  allow('git push origin --delete feat/vieja', rojo);
  allow('git push origin :feat/vieja', rojo);
  allow('git push --dry-run', rojo);
  allow('git push origin main # sc:ok', rojo);
});

test('#7 exit enmascarado: algo detrás del gate → deny; gate al final o pipefail → allow', () => {
  deny('npm run verify 2>&1 | tail -3; echo "VERIFY=$?"', verde, /exit/);
  deny('(npm run verify && npm run e2e) > log 2>&1; echo "LANE_EXIT=$?"', verde, /exit/);
  deny('gh run watch 123 --exit-status; echo "CI=$?"', verde, /exit/);
  deny('npm run docs:coherence | tail -2', verde, /exit/);
  allow('npm run verify');
  allow('npm run verify 2>&1 > /tmp/log');
  allow('git status && npm run docs:guard && npm run docs:coherence');
  allow('set -o pipefail; npm run verify 2>&1 | tee log');
  allow('npm run verify 2>&1 | tee log; exit ${pipestatus[1]}');
  deny('npm run verify || echo "falló"', verde, /exit/); // el echo devuelve 0: el rojo se pierde igual
  allow('npm run verify || exit 1');
  allow('tail -20 verify.log'); // leer el log en otra llamada es la forma correcta
});

test('#12 secretos: volcar config con credenciales → deny; proyectar claves → allow', () => {
  deny('cat ~/.claude.json', verde, /LEARNINGS #12/);
  deny("node -e \"console.log(JSON.stringify(require(process.env.HOME+'/.claude.json')))\"", verde, /LEARNINGS #12/);
  deny('cat .env', verde, /LEARNINGS #12/);
  deny('head -50 .npmrc', verde, /LEARNINGS #12/);
  allow("jq '.mcpServers | keys' ~/.claude.json");
  allow("node -e \"console.log(Object.keys(require(process.env.HOME+'/.claude.json').mcpServers))\"");
  allow('grep -c FIGMA .env');
  allow('cat .claude/settings.local.json'); // permisos, no credenciales: fuera del patrón a propósito
  allow('cat package.json');
});

test('#12 base de diff: `main...rama` → deny; `main..rama` → allow', () => {
  deny('git diff main...feat/x --stat', verde, /base de fusión/);
  deny('git diff origin/main...HEAD', verde, /base de fusión/);
  allow('git diff main..feat/x --stat');
  allow('git diff origin/main..HEAD --name-only');
  allow('git log main...feat/x'); // en `log` los tres puntos son la diferencia simétrica: otra cosa
  allow('git diff main...feat/x # sc:ok');
});

test('#11 zsh: `for f in $VAR` → deny; enumerado, $(…) o ${=VAR} → allow', () => {
  deny('for f in $FILES; do sed -i "" "s/a/b/" "$f"; done', verde, /LEARNINGS #11/);
  deny('for f in "$LISTA"\ndo echo $f\ndone', verde, /LEARNINGS #11/);
  allow('for f in a.ts b.ts; do echo $f; done');
  allow('for f in $(grep -rl foo src); do echo $f; done && grep -rl foo src || echo ninguno');
  allow('for f in ${=FILES}; do echo $f; done');
  allow('for i in 1 2 3; do echo $i; done');
});

test('prosa y heredocs no son comandos: los dos falsos positivos reales del primer día', () => {
  allow("printf '\\n# la lee el hook de git push.\\n' >> .gitignore", rojo);
  allow("python3 - <<'EOF'\ns = s + ' && npm run lint'\nopen(p,'w').write(s)\nEOF\ngrep -n lint scripts/x.mjs", verde);
  allow('cat <<EOF > nota.txt\ngit push origin main\nEOF', rojo);
  allow('echo "npm run verify" > recordatorio.txt');
});

test('un comando corriente pasa sin ruido', () => {
  allow('ls -la');
  allow('git status -sb');
  allow('npm run tokens:gen');
  allow('npx ng build supervisor --configuration production');
  allow('gh run list --branch main --workflow ci --limit 1 --json headSha,conclusion');
});
