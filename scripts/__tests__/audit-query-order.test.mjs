import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  analizar,
  analizarScss,
  analizarUnidad,
  consultasPisadas,
  estilosEnLinea,
  puedeTenerConsultas,
} from '../audit-query-order.mjs';

// Qué se pisa, en una forma que se lee de un vistazo: `selector propiedad Q→B` con las líneas.
const resumen = (pisadas) => pisadas.map((h) => `${h.selector} ${h.propiedad} ${h.q.linea}→${h.b.linea}`);

// ── El caso que lo hizo nacer (DD-130) ─────────────────────────────────────────────────────────
// La franja del resumen de las fichas: la consulta de contenedor ENCIMA de su regla base. El
// anillo siguió a 244 px de su cifra. Es el rojo que el gate tiene que dar sí o sí.

const RESUMEN_ROTO = `@container (min-width: 37.5rem) {
  .resumen__widget {
    justify-content: flex-start;
    gap: var(--sc-spacing-2);
  }
}

.resumen__widget {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sc-spacing-0-75);
}
`;

test('DD-130: la consulta de contenedor encima de su regla base → sus dos declaraciones, pisadas', () => {
  assert.deepEqual(resumen(analizarScss(RESUMEN_ROTO).pisadas), [
    '.resumen__widget justify-content 3→11',
    '.resumen__widget gap 4→12',
  ]);
});

test('DD-130 arreglado: la misma consulta DETRÁS de la regla base → nada', () => {
  const arreglado = RESUMEN_ROTO.split('\n\n').reverse().join('\n\n');
  assert.deepEqual(analizarScss(arreglado).pisadas, []);
});

// ── El criterio, eje por eje ───────────────────────────────────────────────────────────────────
// Cada exclusión evita un falso positivo; cada inclusión, un falso negativo (LEARNINGS #2).

test('`@media` también cuenta, y la regla base basta con estar detrás', () => {
  const css = '@media (max-width: 40rem) { .a { color: red; } }\n.a { color: blue; }';
  assert.deepEqual(resumen(consultasPisadas(css)), ['.a color 1→2']);
});

test('`@supports` es una consulta más', () => {
  const css = '@supports (display: grid) { .a { display: grid; } }\n.a { display: block; }';
  assert.equal(consultasPisadas(css).length, 1);
});

test('propiedad distinta → no se pisa', () => {
  assert.deepEqual(consultasPisadas('@media (x) { .a { color: red; } }\n.a { margin: 0; }'), []);
});

test('selector distinto, aunque case con lo mismo → no se razona: no cuenta', () => {
  assert.deepEqual(consultasPisadas('@media (x) { .a.b { color: red; } }\n.b.a { color: blue; }'), []);
});

test('lista de selectores → solo el selector que comparten', () => {
  const css = '@media (x) { .a, .b { color: red; } }\n.a { color: blue; }';
  assert.deepEqual(resumen(consultasPisadas(css)), ['.a color 1→2']);
});

test('`!important` en la consulta y no en la base → gana la consulta: no cuenta', () => {
  assert.deepEqual(consultasPisadas('@media (x) { .a { color: red !important; } }\n.a { color: blue; }'), []);
});

test('`!important` en las dos → gana la de detrás: cuenta', () => {
  const css = '@media (x) { .a { color: red !important; } }\n.a { color: blue !important; }';
  assert.equal(consultasPisadas(css).length, 1);
});

test('`!important` solo en la base → la base gana igual: cuenta', () => {
  assert.equal(consultasPisadas('@media (x) { .a { color: red; } }\n.a { color: blue !important; }').length, 1);
});

test('capas distintas → manda la capa, no el orden: no cuenta', () => {
  // La consulta sin capa gana a cualquier regla con capa, vaya donde vaya.
  assert.deepEqual(consultasPisadas('@media (x) { .a { color: red; } }\n@layer app { .a { color: blue; } }'), []);
});

test('la misma capa en dos bloques → cuenta', () => {
  const css = '@layer app { @media (x) { .a { color: red; } } }\n@layer app { .a { color: blue; } }';
  assert.equal(consultasPisadas(css).length, 1);
});

test('`@layer a { @layer b }` y `@layer a.b` son la misma capa', () => {
  const css = '@layer a { @layer b { @media (x) { .a { color: red; } } } }\n@layer a.b { .a { color: blue; } }';
  assert.equal(consultasPisadas(css).length, 1);
});

test('dos capas anónimas son dos capas → no cuenta', () => {
  assert.deepEqual(consultasPisadas('@layer { @media (x) { .a { color: red; } } }\n@layer { .a { color: blue; } }'), []);
});

test('la misma consulta repetida → la primera, pisada', () => {
  const css = '@media (x) { .a { color: red; } }\n@media (x) { .a { color: blue; } }';
  assert.deepEqual(resumen(consultasPisadas(css)), ['.a color 1→2']);
});

test('otra consulta detrás, aunque la implique → no se razona: no cuenta', () => {
  const css = '@media (min-width: 40rem) { .a { color: red; } }\n@media (min-width: 30rem) { .a { color: blue; } }';
  assert.deepEqual(consultasPisadas(css), []);
});

test('la de detrás con MÁS consultas no se aplica siempre → no cuenta', () => {
  const css = '@media (x) { .a { color: red; } }\n@media (x) { @container (y) { .a { color: blue; } } }';
  assert.deepEqual(consultasPisadas(css), []);
});

test('la de detrás con PARTE de las consultas sí se aplica siempre → cuenta', () => {
  const css = '@media (x) { @container (y) { .a { color: red; } } }\n@media (x) { .a { color: blue; } }';
  assert.equal(consultasPisadas(css).length, 1);
});

test('las propiedades no distinguen mayúsculas; las personalizadas, sí', () => {
  assert.equal(consultasPisadas('@media (x) { .a { COLOR: red; } }\n.a { color: blue; }').length, 1);
  assert.deepEqual(consultasPisadas('@media (x) { .a { --Tono: red; } }\n.a { --tono: blue; }'), []);
});

test('lo de dentro de `@keyframes` no son reglas de la cascada → no cuenta', () => {
  const css = '@media (x) { @keyframes k { from { opacity: 0; } } }\n@keyframes k { from { opacity: 1; } }';
  assert.deepEqual(consultasPisadas(css), []);
});

test('reglas bajo consulta: se cuentan las escritas, no las de primer nivel', () => {
  assert.equal(analizar('.a { color: red; }\n@media (x) { .a { color: blue; } .b { color: red; } }').conConsulta.length, 2);
});

// ── Por qué lee el COMPILADO ───────────────────────────────────────────────────────────────────

test('SCSS: el anidado `&__x` se resuelve (el caso de aed-servicio, reducido)', () => {
  const scss = `@media (prefers-reduced-motion: reduce) {
  .switch-row__name {
    transition: none;
  }
}

.switch-row {
  &__name {
    transition: color 1s;
  }
}
`;
  assert.deepEqual(resumen(analizarScss(scss).pisadas), ['.switch-row__name transition 3→9']);
});

test('SCSS: una declaración DESPUÉS de un `@media` anidado sale detrás y lo mata', () => {
  // Fija el comportamiento de ESTE sass: si un día vuelve a subir las declaraciones, esto avisa.
  const scss = '.a {\n  @media (x) {\n    color: red;\n  }\n  color: blue;\n}\n';
  assert.deepEqual(resumen(analizarScss(scss).pisadas), ['.a color 3→5']);
});

test('SCSS: el `@media` anidado de siempre, con la base delante → nada', () => {
  assert.deepEqual(analizarScss('.a {\n  color: blue;\n  @media (x) {\n    color: red;\n  }\n}\n').pisadas, []);
});

test('SCSS: un partial entra en el orden de quien lo usa, y cada línea es la de SU fichero', () => {
  // `realpath`: en macOS el directorio temporal cuelga de un enlace, y el mapa da la ruta real.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'query-order-')));
  try {
    writeFileSync(join(dir, '_base.scss'), '@media (x) {\n  .a {\n    color: red;\n  }\n}\n');
    const hoja = join(dir, 'hoja.scss');
    writeFileSync(hoja, "@use 'base';\n\n.a {\n  color: blue;\n}\n");
    const [h, ...resto] = analizarUnidad({ fichero: hoja }).pisadas;
    assert.equal(resto.length, 0);
    assert.deepEqual([h.q.fichero, h.q.linea, h.b.fichero, h.b.linea], [join(dir, '_base.scss'), 3, hoja, 4]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Lo que no se compila ───────────────────────────────────────────────────────────────────────
// El filtro solo ahorra tiempo: si deja fuera algo que puede tener una consulta, el gate se queda
// ciego sin avisar. Por eso se prueba contra lo que SÍ da pisadas.

test('filtro: sin consultas ni cargas no se compila; con cualquiera de las dos, sí', () => {
  assert.equal(puedeTenerConsultas('.a { color: red; }\n:host { display: contents; }'), false);
  for (const s of ['@media (x) {}', '@container (x) {}', '@supports (x) {}', "@use 'a';", "@forward 'a';", "@import 'a';", '.a { @include m; }'])
    assert.equal(puedeTenerConsultas(s), true, s);
});

test('filtro: todo lo que da una pisada lo pasa, también una consulta que llega por un mixin', () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'query-order-')));
  try {
    writeFileSync(join(dir, '_mixins.scss'), '@mixin ancho {\n  @media (x) {\n    color: red;\n  }\n}\n');
    const hoja = join(dir, 'hoja.scss');
    const fuente = "@use 'mixins';\n\n.a {\n  @include mixins.ancho;\n}\n\n.a {\n  color: blue;\n}\n";
    writeFileSync(hoja, fuente);
    assert.equal(analizarUnidad({ fichero: hoja }).pisadas.length, 1);
    assert.equal(puedeTenerConsultas(fuente.replace("@use 'mixins';", '')), true, 'el @include solo ya obliga');
    for (const fixture of [RESUMEN_ROTO, '.a {\n  @media (x) {\n    color: red;\n  }\n  color: blue;\n}\n'])
      assert.equal(puedeTenerConsultas(fixture), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Los `styles:` en línea de los componentes ─────────────────────────────────────────────────

test('estilos en línea: literal de plantilla, con la línea donde empieza', () => {
  const ts = "@Component({\n  selector: 'x',\n  styles: `\n    .a { color: red; }\n  `,\n})";
  assert.deepEqual(estilosEnLinea(ts), [{ texto: '\n    .a { color: red; }\n  ', linea: 3, interpolado: false }]);
});

test('estilos en línea: cadena con comillas y lista de literales', () => {
  assert.deepEqual(
    estilosEnLinea("styles: ':host { display: contents; }',").map((b) => b.texto),
    [':host { display: contents; }'],
  );
  assert.deepEqual(
    estilosEnLinea('styles: [\n  `.a {}`,\n  `.b {}`\n]').map((b) => [b.texto, b.linea]),
    [['.a {}', 2], ['.b {}', 3]],
  );
});

test('estilos en línea: los escapes del literal se quitan y los del CSS se quedan', () => {
  assert.equal(estilosEnLinea("styles: `.a::after { content: '\\\\2014'; }`")[0].texto, ".a::after { content: '\\2014'; }");
});

test('estilos en línea: `${…}` no es estático → marcado, no compilado a ciegas', () => {
  assert.equal(estilosEnLinea('styles: `.a { width: ${ancho}px; }`')[0].interpolado, true);
  assert.equal(estilosEnLinea("styles: '.a { content: \"${x}\"; }'")[0].interpolado, false);
});

test('estilos en línea: `styleUrl` y un tipo `styles: string[]` no son estilos', () => {
  assert.deepEqual(estilosEnLinea("styleUrl: './a.scss',\ninterface X { styles: string[] }"), []);
});

test('estilos en línea: la pisada sale con la línea del `.ts`, no la del literal', () => {
  const ts = [
    '@Component({',
    "  selector: 'x',",
    '  styles: `',
    '    @media (x) { .a { color: red; } }',
    '    .a { color: blue; }',
    '  `,',
    '})',
  ].join('\n');
  const [bloque] = estilosEnLinea(ts);
  const fichero = '/repo/x.component.ts';
  const { pisadas } = analizarUnidad({ fichero, texto: bloque.texto, desfase: bloque.linea - 1 });
  assert.deepEqual(
    pisadas.map((h) => [h.q.fichero, h.q.linea, h.b.linea]),
    [[fichero, 4, 5]],
  );
});
