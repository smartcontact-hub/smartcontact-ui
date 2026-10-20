import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  analizar,
  aplanar,
  clasesDePlantilla,
  clasesRetiradas,
  describir,
  distancia,
  forma,
  normaliza,
  plantillaDe,
  revisar,
  sinComentarios,
  textosRetirados,
} from '../audit-e2e-citas.mjs';

// Qué retira un cambio: `a` y `d` son las hojas de UN es.json antes y después; `vivos` lo que hoy dice cualquier es.json.
const retira = (a, d, { vivos = [], enCodigo = () => false, contenidoEn = () => false } = {}) =>
  textosRetirados(aplanar(a), aplanar(d), new Set(vivos.map(forma)), enCodigo, contenidoEn);

const spec = (ruta, ...lineas) => ({ ruta, texto: lineas.join('\n') });
const citas = (retirados, ...specs) => revisar(retirados, specs).map((c) => `${c.spec}:${c.linea}`);
const texto = (viejo, extra = {}) => ({ tipo: 'texto', viejo, nuevos: [null], ampliado: false, ...extra });
const clase = (viejo) => ({ tipo: 'clase', viejo, nuevos: [], fichero: 'x.html' });

// ── Los tres rojos de #471 y #472, con lo que midió cada uno ─────────────────────────────────────────────────────

test('barrido-campos: el error del teléfono perdió su punto final en una clave y su gemela lo conserva → cita', () => {
  const viejo = 'El teléfono no es válido: usa cifras, con un + delante si lleva prefijo.';
  const nuevo = 'El teléfono no es válido: usa cifras, con un + delante si lleva prefijo';
  const retirados = retira(
    { agente: { phone_invalid: viejo }, extension: { phone_invalid: viejo } },
    { agente: { phone_invalid: nuevo }, extension: { phone_invalid: viejo } },
    { vivos: [viejo] },
  );
  assert.deepEqual(retirados, [{ tipo: 'texto', viejo, nuevos: [nuevo], ampliado: false }]);
  const hallazgos = revisar(retirados, [spec('e2e/supervisor/barrido-campos.spec.ts', '', `  await expect(page.locator('#agent-phone-msg')).toHaveText('${viejo}');`)]);
  assert.equal(describir(hallazgos[0]), `e2e/supervisor/barrido-campos.spec.ts:2 → «${viejo}» → «${nuevo}»`);
});

test('LÍMITE medido: «Sin canales» sigue en otra clave y es corto → no se ve (vacio-con-palabra)', () => {
  const retirados = retira({ a: { no_channels: 'Sin canales' }, b: { no_channels: 'Sin canales' } }, { a: { sin_grupos: 'Sin grupos habilitados' }, b: { no_channels: 'Sin canales' } }, { vivos: ['Sin canales'] });
  assert.deepEqual(retirados, []);
});

test('LÍMITE medido: una clase que otras plantillas siguen usando no cuenta (text-styles-applied)', () => {
  const antes = '<label class="field__label">Nombre</label>';
  const despues = '<sc-form-field label="Nombre"></sc-form-field>';
  assert.deepEqual(clasesRetiradas('grupo.component.html', antes, despues, new Set(['field__label'])), []);
});

// ── Textos ────────────────────────────────────────────────────────────────────────────────────────────────────

test('un texto que cambia o desaparece se lista con su valor nuevo, o con null si la clave ya no existe', () => {
  const retirados = retira({ a: { uno: 'Texto que cambia', dos: 'Texto que desaparece' } }, { a: { uno: 'Otro texto' } });
  assert.deepEqual(
    retirados.map((r) => [r.viejo, r.nuevos]),
    [
      ['Texto que cambia', ['Otro texto']],
      ['Texto que desaparece', [null]],
    ],
  );
});

test('lo que no es un cambio de texto no cuenta: menos de 4 caracteres, espacios o mayúsculas, y los textos de otra clave', () => {
  assert.deepEqual(retira({ a: { x: 'Sí' } }, { a: {} }), [], 'menos de 4 caracteres');
  assert.deepEqual(retira({ a: { x: 'T. medio' } }, { a: { x: 'T. medio' } }), [], 'solo el NBSP');
  assert.deepEqual(retira({ a: { x: 'Guardar cambios' } }, { a: { x: 'guardar cambios' } }), [], 'solo mayúsculas');
  assert.deepEqual(retira({ a: { x: 'Tiempo de timbrado de una conversación a un agente' } }, { a: { x: 'Tiempo de ringing', hint: 'Tiempo de timbrado de una conversación a un agente' } }, { vivos: ['Tiempo de timbrado de una conversación a un agente'] }), [], 'se movió a otra clave');
});

test('un texto que el código sigue diciendo no está retirado', () => {
  const retirados = retira({ a: { x: 'Asigna un grupo con teléfono' } }, { a: {} }, { enCodigo: (n) => n === 'Asigna un grupo con teléfono' });
  assert.deepEqual(retirados, []);
});

test('{{variable}}: pide 10 caracteres fijos, y el nombre de la variable no distingue textos', () => {
  assert.deepEqual(retira({ a: { x: '{{name}} (copia)' } }, { a: {} }), [], '«{{name}} (copia)» cita a cualquier copia');
  assert.equal(retira({ a: { x: '{{count}} agentes asignados' } }, { a: {} }).length, 1);
  assert.deepEqual(retira({ a: { x: '{{count}} agentes asignados' } }, { a: { x: '{{n}} agentes asignados' } }), [], 'solo cambia el nombre de la variable');
  assert.deepEqual(retira({ a: { x: '{{count}} agentes asignados' } }, { a: {} }, { vivos: ['{{total}} agentes asignados'] }), [], 'otra clave lo pinta igual');
});

test('un texto que hoy vive dentro de otro más largo queda marcado `ampliado`', () => {
  const nuevo = retira({ a: { x: 'Asigna un grupo con teléfono' } }, { a: { x: 'Asigna un grupo con teléfono.' } });
  assert.equal(nuevo[0].ampliado, true);
  const dentro = retira({ a: { x: 'Asignar agentes' } }, { a: {} }, { contenidoEn: (n) => n === 'asignar agentes' });
  assert.equal(dentro[0].ampliado, true);
  assert.equal(retira({ a: { x: 'Texto que desaparece' } }, { a: {} })[0].ampliado, false);
});

test('distancia de edición', () => {
  assert.equal(distancia('abc', 'abc'), 0);
  assert.equal(distancia('prefijo.', 'prefijo'), 1);
  assert.equal(distancia('', 'abc'), 3);
});

// ── Clases ────────────────────────────────────────────────────────────────────────────────────────────────────

test('clasesDePlantilla: class, styleClass, ngClass, [class.x] y lo que va entre llaves; lo dinámico solo aporta sus cadenas', () => {
  const plantilla = `
    <div class="ficha ficha--abierta {{ activo ? 'ficha--on' : '' }}" [ngClass]="{ 'ficha--roja': roja, 'ficha--azul': azul }">
      <sc-button styleClass="boton-guardar" [styleClass]="cond ? 'a-uno b-dos' : ''" [class.ficha--ancha]="ancha" />
      <span [attr.class]="x" class="ok"></span>
    </div>`;
  assert.deepEqual([...clasesDePlantilla(plantilla)].sort(), ['a-uno', 'b-dos', 'boton-guardar', 'ficha', 'ficha--abierta', 'ficha--ancha', 'ficha--azul', 'ficha--on', 'ficha--roja']);
});

test('plantillaDe: todo el .html, y solo el `template:` de un .ts', () => {
  assert.equal(plantillaDe('a.html', '<p class="x"></p>'), '<p class="x"></p>');
  assert.equal(plantillaDe('a.ts', 'const claseFuera = "no";\n@Component({ template: `<p class="x"></p>` })'), '<p class="x"></p>');
  assert.equal(plantillaDe('a.scss', '.x {}'), '');
  assert.equal(plantillaDe('a.html', null), '');
});

test('clasesRetiradas: la que deja de declarar el fichero y no está en ningún sitio; dice qué clases gana', () => {
  const antes = '<p class="rotulo-a-mano texto">a</p><span class="viva"></span>';
  const despues = '<p class="texto sc-field__label">a</p>';
  const r = clasesRetiradas('x.html', antes, despues, new Set(['viva', 'texto']));
  assert.deepEqual(r.map((c) => [c.viejo, c.nuevos]), [['rotulo-a-mano', ['sc-field__label']], ['viva', ['sc-field__label']]].filter(([v]) => v === 'rotulo-a-mano'));
});

// ── Las e2e ───────────────────────────────────────────────────────────────────────────────────────────────────

test('sinComentarios: en blanco, con las líneas intactas, y un `//` dentro de una cadena no es un comentario', () => {
  const t = "const a = 'http://x'; // antes «Sin canales»\n/* varias\n líneas */ const b = 1;";
  const s = sinComentarios(t);
  assert.equal(s.split('\n').length, 3);
  assert.ok(s.includes("'http://x'"));
  assert.ok(!s.includes('Sin canales') && !s.includes('varias'));
  assert.ok(s.includes('const b = 1;'));
});

test('un texto cuenta si un literal de la línea ES el texto entero; «Guardar» no cita «Guardar cambios»', () => {
  const r = [texto('Guardar')];
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "await page.getByRole('button', { name: 'Guardar' }).click();")), ['e2e/a.spec.ts:1']);
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "await page.getByRole('button', { name: 'Guardar cambios' }).click();")), []);
  assert.deepEqual(citas([texto('Sin canales')], spec('e2e/a.spec.ts', "await expect(x).toContainText('sin   canales');")), ['e2e/a.spec.ts:1'], 'sin mayúsculas ni espacios de más');
});

test('una palabra suelta se compara con sus mayúsculas: la ruta `supervisor` no cita «Supervisor»', () => {
  assert.deepEqual(citas([texto('Supervisor')], spec('e2e/a.spec.ts', "const MEDIDA = join(process.cwd(), 'e2e', 'supervisor', 'x.js');")), []);
  assert.deepEqual(citas([texto('Supervisor')], spec('e2e/a.spec.ts', "await page.getByText('Supervisor').click();")), ['e2e/a.spec.ts:1']);
});

test('en una regex, el valor entero o uno largo es una cita; una palabra dentro de otra frase, no', () => {
  assert.deepEqual(citas([texto('Nivel')], spec('e2e/a.spec.ts', 'await expect(x).toHaveAccessibleDescription(/^La conversación se distribuye al agente de mayor nivel/);')), []);
  assert.deepEqual(citas([texto('Nivel')], spec('e2e/a.spec.ts', 'await expect(x).toHaveText(/^Nivel$/);')), ['e2e/a.spec.ts:1']);
  assert.deepEqual(citas([texto('Asignar agentes')], spec('e2e/a.spec.ts', 'await expect(x).toHaveAccessibleName(/Asignar agentes de ACD/);')), ['e2e/a.spec.ts:1']);
});

test('{{variable}} casa con una palabra o un número de la cita, no con una frase entera', () => {
  const r = [texto('{{count}} de {{total}} asignados')];
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "await expect(x).toHaveText('3 de 14 asignados');")), ['e2e/a.spec.ts:1']);
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "test('Email reparte por niveles y su columna en Agentes asignados', async () => {});")), []);
});

test('un comentario no es una cita', () => {
  const r = [texto('Sin canales')];
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "// antes, 'Sin canales'", "/* 'Sin canales' */", "await expect(x).toContainText('Sin grupos habilitados'); // antes, 'Sin canales'")), []);
});

test('una aserción de que algo NO está sigue siendo cierta, también si se guarda en una variable o en un bucle', () => {
  const r = [texto('Capacidades del agente'), clase('resumen__warn')];
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "await expect(page.getByText('Capacidades del agente')).toHaveCount(0);", "await expect(page.locator('main')).not.toContainText('Capacidades del agente');", "await expect(page.locator('.resumen__warn')).toBeHidden();")), []);
  assert.deepEqual(
    citas(r, spec('e2e/a.spec.ts', "const avisos = page.locator('.ficha .resumen__warn');", 'await goto(page);', 'await expect(avisos).toHaveCount(0);')),
    [],
    'la variable se afirma ausente más abajo',
  );
  assert.deepEqual(
    citas(r, spec('e2e/a.spec.ts', 'for (const [seccion, relleno] of [', "  ['permisos', 'Capacidades del agente'],", ']) {', '  await expect(page.getByText(relleno)).toHaveCount(0);', '}')),
    [],
    'la variable del bucle se afirma ausente dentro',
  );
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "const avisos = page.locator('.ficha .resumen__warn');", 'await expect(avisos).toBeVisible();')), ['e2e/a.spec.ts:1'], 'si la variable se afirma presente, es una cita');
});

test('clases: `.nombre` dentro de una cadena; `.first()` no cita la clase `first`; con guion, como palabra suelta; `:not(.x)` no', () => {
  assert.deepEqual(citas([clase('cabecera')], spec('e2e/a.spec.ts', "page.locator('.cabecera > .t')", 'page.locator(x).first()', "page.locator('.cabecera-nueva')")), ['e2e/a.spec.ts:1']);
  assert.deepEqual(citas([clase('first')], spec('e2e/a.spec.ts', 'await page.locator(x).first().click();')), []);
  assert.deepEqual(citas([clase('sc-field__label')], spec('e2e/a.spec.ts', "const sel = selector ?? 'x';", "await expect(el).toHaveClass(/sc-field__label/);", "page.locator('.sc-field__label-extra')")), ['e2e/a.spec.ts:2']);
  assert.deepEqual(citas([clase('resumen__pair-button')], spec('e2e/a.spec.ts', "page.locator('main button:not([aria-haspopup]):not(.resumen__pair-button)')")), []);
});

test('un texto que hoy vive dentro de otro más largo solo se rompe si la spec lo compara ENTERO con una cadena', () => {
  const r = [texto('Asigna un grupo con teléfono', { nuevos: ['Asigna un grupo con teléfono.'], ampliado: true })];
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "await expect(x).toContainText('Asigna un grupo con teléfono');")), []);
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "await expect(x).toHaveText('Asigna un grupo con teléfono');")), ['e2e/a.spec.ts:1']);
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', 'await expect(x).toHaveText(/Asigna un grupo con teléfono/);')), [], 'una regex busca, no compara entero');
});

test('`// sc:cita-ok` en la línea o en la anterior deja pasar la cita; en otra, no', () => {
  const r = [texto('Sin canales')];
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', "await expect(x).toContainText('Sin canales'); // sc:cita-ok")), []);
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', '// sc:cita-ok', "await expect(x).toContainText('Sin canales');")), []);
  assert.deepEqual(citas(r, spec('e2e/a.spec.ts', '// sc:cita-ok', '', "await expect(x).toContainText('Sin canales');")), ['e2e/a.spec.ts:3']);
});

test('describir: texto con varios nuevos, clave borrada y clase', () => {
  const t = { spec: 'e2e/a.spec.ts', linea: 7, tipo: 'texto', viejo: 'Viejo', nuevos: ['Nuevo', null] };
  assert.equal(describir(t), 'e2e/a.spec.ts:7 → «Viejo» → «Nuevo» | (la clave ya no existe)');
  const c = { spec: 'e2e/a.spec.ts', linea: 7, tipo: 'clase', viejo: 'rotulo', nuevos: ['sc-field__label'], fichero: 'x.html' };
  assert.equal(describir(c), 'e2e/a.spec.ts:7 → .rotulo (ya no sale en x.html) → .sc-field__label');
});

// ── De punta a punta, sobre un repo de verdad (LEARNINGS #2: el rojo se fabrica y se ve) ────────────────────────

const escribir = (dir, archivos) => {
  for (const [ruta, contenido] of Object.entries(archivos)) {
    mkdirSync(dirname(join(dir, ruta)), { recursive: true });
    writeFileSync(join(dir, ruta), contenido);
  }
};

const I18N = 'projects/supervisor/src/assets/i18n/es.json';
const DOCS_I18N = 'projects/sc-docs/public/assets/i18n/es.json';
const PLANTILLA = 'projects/supervisor/src/app/ficha/ficha.component.html';

function repoTemporal(archivos) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'citas-')));
  // Las `GIT_*` heredadas se tiran: dentro de un hook de git apuntan al repositorio real.
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
  const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, env, stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  escribir(dir, archivos);
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('checkout', '-q', '-b', 'rama');
  return { dir, limpiar: () => rmSync(dir, { recursive: true, force: true }) };
}

test('sobre un repo: el texto de es.json y la clase de una plantilla que una e2e sigue citando ponen rojo; con la spec al día, verde', () => {
  const { dir, limpiar } = repoTemporal({
    [I18N]: JSON.stringify({ ficha: { vacio: 'No hay nada que enseñar todavía', titulo: 'Ficha de grupo' } }),
    [DOCS_I18N]: JSON.stringify({ docs: { intro: 'Bienvenida al catálogo' } }),
    [PLANTILLA]: '<h2 class="ficha__titulo rotulo-a-mano">{{ t }}</h2>',
    'e2e/supervisor/vacio.spec.ts': "await expect(page.locator('.ficha')).toContainText('No hay nada que enseñar todavía');",
    'e2e/supervisor/rotulo.spec.ts': "await expect(page.locator('.rotulo-a-mano')).toBeVisible();",
    'e2e/supervisor/docs.spec.ts': "await expect(page.getByText('Bienvenida al catálogo')).toBeVisible();",
    'e2e/supervisor/intacto.spec.ts': "await expect(page.getByText('Ficha de grupo')).toBeVisible();",
  });
  try {
    // El cambio: el texto vacío se reescribe, el de sc-docs desaparece, y la plantilla cambia de clase.
    escribir(dir, {
      [I18N]: JSON.stringify({ ficha: { vacio: 'Aún no hay nada', titulo: 'Ficha de grupo' } }),
      [DOCS_I18N]: JSON.stringify({ docs: {} }),
      [PLANTILLA]: '<h2 class="ficha__titulo sc-field__label">{{ t }}</h2>',
    });
    const rojo = analizar({ cwd: dir, base: 'main' });
    assert.deepEqual(
      rojo.citas.map(describir).sort(),
      [
        'e2e/supervisor/docs.spec.ts:1 → «Bienvenida al catálogo» → (la clave ya no existe)',
        'e2e/supervisor/rotulo.spec.ts:1 → .rotulo-a-mano (ya no sale en projects/supervisor/src/app/ficha/ficha.component.html) → .sc-field__label',
        'e2e/supervisor/vacio.spec.ts:1 → «No hay nada que enseñar todavía» → «Aún no hay nada»',
      ],
    );
    assert.equal(rojo.textos, 2);
    assert.equal(rojo.clases, 1);

    // Las specs al día con el cambio: verde, y dice cuánto retiró y cuántas miró.
    escribir(dir, {
      'e2e/supervisor/vacio.spec.ts': "await expect(page.locator('.ficha')).toContainText('Aún no hay nada');",
      'e2e/supervisor/rotulo.spec.ts': "await expect(page.locator('.sc-field__label')).toBeVisible();",
      'e2e/supervisor/docs.spec.ts': "await expect(page.getByText('Catálogo')).toBeVisible();",
    });
    const verde = analizar({ cwd: dir, base: 'main' });
    assert.deepEqual(verde.citas, []);
    assert.equal(verde.textos, 2);
    assert.equal(verde.specs, 4);
  } finally {
    limpiar();
  }
});

test('sobre un repo: una rama sin cambios en projects/ no retira nada, y una base que no existe no responde en verde', () => {
  const { dir, limpiar } = repoTemporal({ [I18N]: JSON.stringify({ a: { b: 'Algo' } }), 'e2e/a.spec.ts': "x('Algo');" });
  try {
    const r = analizar({ cwd: dir, base: 'main' });
    assert.deepEqual([r.citas, r.textos, r.clases], [[], 0, 0]);
    const sinBase = analizar({ cwd: dir, base: 'origin/main' });
    assert.match(sinBase.error, /no hay punto común con `origin\/main`/);
  } finally {
    limpiar();
  }
});

test('enganchado: `verify` lo corre y la puerta barata de `preflight:scope` lo lee', () => {
  const raiz = join(import.meta.dirname, '..', '..');
  const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['audit:e2e-citas'], 'node scripts/audit-e2e-citas.mjs');
  assert.ok(pkg.scripts.verify.split(' && ').includes('npm run audit:e2e-citas'), 'falta en la cadena `verify`');
  const preflight = readFileSync(join(raiz, 'scripts', 'preflight-scope.mjs'), 'utf8');
  assert.match(preflight, /from "\.\/audit-e2e-citas\.mjs"/);
  assert.match(preflight, /\.\.\.citas\]/, 'la puerta barata no suma las citas a sus problemas');
});

test('normaliza colapsa todo tipo de espacio', () => {
  assert.equal(normaliza('  T. medio \n x '), 'T. medio x');
});
