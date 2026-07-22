/*
 * GUARDIÁN · un borde no puede valer lo mismo que el lienzo que bordea.
 * ====================================================================
 *
 * Por qué existe. `--sc-border-subtle` valía `slate-900` en oscuro, que es
 * EXACTAMENTE `--sc-bg-surface`: 1.00:1 contra la superficie que bordea. No era
 * un filo discreto, era un filo que no se pintaba, y lo consumen 56 sitios entre
 * el DS, sc-demo, agent y el supervisor. Estuvo así meses y no lo cazó nada:
 * `theme-contrast.spec.ts` mide TEXTO sobre fondo, no bordes contra su lienzo.
 *
 * Es el modo de fallo de siempre en este repo —un token que no tiene valor
 * propio por tema, o que lo tiene y colisiona— pero por una puerta que ninguna
 * red vigilaba. Una nota en un doc no lo habría cazado: hace falta algo que
 * corra solo. (README: una comprobación que no está en una cadena automática no
 * es una comprobación, es documentación.)
 *
 * Qué afirma, y nada más: NINGÚN `--sc-border-*` puede resolver, en su tema, a
 * un color a menos de UMBRAL de `--sc-bg-surface` o `--sc-bg-default`. No opina
 * sobre si un borde es "bastante" visible —eso depende de dónde se use y es
 * criterio— solo sobre el caso indefendible: el borde que ES su fondo.
 *
 * Lee el FUENTE, no un build: así no puede darte verde midiendo un `dist/`
 * rancio.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const LAYERS = 'projects/design-tokens/src/lib/styles/tokens/layers';
const PRIMITIVE = `${LAYERS}/01-primitive.css`;
const THEMES = {
  claro: `${LAYERS}/02-semantic.css`,
  oscuro: `${LAYERS}/07-dark.css`,
};

/* 1.02 y no 1.00: deja un pelo de margen para que un cambio que "casi" iguale
 * el lienzo también salte, sin entrar a juzgar cuánto contraste merece cada
 * borde. Los valores reales hoy quedan muy por encima (el más ajustado es
 * `border-subtle` en oscuro, 1.126). */
const UMBRAL = 1.02;

const leer = (ruta) => readFileSync(ruta, 'utf8');

/** `--sc-color-x: #rrggbb` de la capa primitiva. */
const primitivas = () => {
  const mapa = new Map();
  for (const m of leer(PRIMITIVE).matchAll(/^\s*(--sc-color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/gm)) {
    mapa.set(m[1], m[2].toLowerCase());
  }
  return mapa;
};

/** Declaraciones de una capa, con el valor tal cual (sin resolver). */
const declaraciones = (ruta, prefijo) => {
  const mapa = new Map();
  const re = new RegExp(`^\\s*(${prefijo}[a-z0-9-]*):\\s*([^;]+);`, 'gm');
  for (const m of leer(ruta).matchAll(re)) mapa.set(m[1], m[2].trim());
  return mapa;
};

const hexARgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbAHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * Resuelve un valor a hex. Cubre las dos formas que existen hoy en las capas:
 *   var(--sc-color-x)
 *   color-mix(in srgb, var(--sc-color-a) N%, var(--sc-color-b))
 * Cualquier otra devuelve null → el guardián la SALTA y lo dice, en vez de
 * inventarse un color (un guardián que adivina es peor que ninguno).
 */
const resolver = (valor, prims) => {
  const directo = valor.match(/^var\((--sc-color-[a-z0-9-]+)\)$/);
  if (directo) return prims.get(directo[1]) ?? null;

  const mix = valor.match(
    /^color-mix\(in srgb,\s*var\((--sc-color-[a-z0-9-]+)\)\s*([\d.]+)%,\s*var\((--sc-color-[a-z0-9-]+)\)\s*\)$/,
  );
  if (mix) {
    const a = prims.get(mix[1]);
    const b = prims.get(mix[3]);
    if (!a || !b) return null;
    const p = Number(mix[2]) / 100;
    const [ra, rb] = [hexARgb(a), hexARgb(b)];
    return rgbAHex(ra.map((v, i) => v * p + rb[i] * (1 - p)));
  }
  return null;
};

const luminancia = (hex) => {
  const [r, g, b] = hexARgb(hex).map((v) => v / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const prims = primitivas();
const luz = {
  bordes: declaraciones(THEMES.claro, '--sc-border-'),
  lienzos: declaraciones(THEMES.claro, '--sc-bg-'),
};
const oscuro = {
  bordes: declaraciones(THEMES.oscuro, '--sc-border-'),
  lienzos: declaraciones(THEMES.oscuro, '--sc-bg-'),
};

/* En oscuro solo se redeclara lo que cambia: lo que falta HEREDA del claro, y
 * ese es justo el caso que hay que mirar (un borde pensado contra blanco
 * sobreviviendo a un lienzo oscuro). */
const porTema = {
  claro: { bordes: luz.bordes, lienzos: luz.lienzos },
  oscuro: {
    bordes: new Map([...luz.bordes, ...oscuro.bordes]),
    lienzos: new Map([...luz.lienzos, ...oscuro.lienzos]),
  },
};

const LIENZOS = ['--sc-bg-surface', '--sc-bg-default'];

/*
 * EXENCIONES CONDICIONADAS — y la condición la comprueba el guardián.
 *
 * Un allowlist normal es cómo un guardián se pudre: silencias un caso, nadie
 * revisa la lista y el defecto se queda. Aquí la exención vale SOLO mientras el
 * token no lo lea NADIE. En cuanto alguien lo use, el guardián vuelve a rojo y
 * obliga a darle valor propio en la capa oscura antes de consumirlo.
 *
 * `--sc-border-primary-active` es el mismo defecto que tenía `border-subtle`
 * —declarado solo en claro (blue-800), heredado a oscuro, donde queda a 1.019:1
 * de slate-900— pero LATENTE: cero consumidores hoy. No se le inventa un valor
 * oscuro porque sería decidir una tonalidad de marca sin nadie que la pida.
 */
const EXENTOS_SI_NO_SE_USAN = ['--sc-border-primary-active'];

/** ¿Lo lee alguien fuera de las propias capas de tokens? */
const tieneConsumidores = (token) => {
  try {
    const salida = execSync(
      `grep -rl --include=*.scss --include=*.css --include=*.ts -- '${token}' projects/ 2>/dev/null || true`,
      { encoding: 'utf8' },
    );
    return salida
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .some((f) => !f.includes(`${LAYERS}/`));
  } catch {
    // Si el grep falla, NO conceder la exención: ante la duda, rojo.
    return true;
  }
};

const fallos = [];
const saltados = [];
const exentos = [];
let comprobados = 0;

for (const [tema, { bordes, lienzos }] of Object.entries(porTema)) {
  const canvas = LIENZOS.map((n) => [n, resolver(lienzos.get(n) ?? '', prims)]).filter(
    ([, hex]) => hex,
  );
  if (canvas.length !== LIENZOS.length) {
    console.error(`✗ No resuelvo los lienzos (${LIENZOS.join(', ')}) en tema ${tema}.`);
    process.exit(1);
  }

  for (const [token, valor] of bordes) {
    const hex = resolver(valor, prims);
    if (!hex) {
      saltados.push(`${tema} · ${token} = ${valor}`);
      continue;
    }
    for (const [nombreLienzo, hexLienzo] of canvas) {
      comprobados++;
      const r = contraste(hex, hexLienzo);
      if (r >= UMBRAL) continue;

      const linea = `${tema} · ${token} (${hex}) contra ${nombreLienzo} (${hexLienzo}) = ${r.toFixed(3)}:1`;
      if (EXENTOS_SI_NO_SE_USAN.includes(token) && !tieneConsumidores(token)) {
        exentos.push(linea);
      } else {
        fallos.push(linea);
      }
    }
  }
}

console.log('─'.repeat(60));
if (saltados.length) {
  console.log(`ℹ ${saltados.length} valor(es) con sintaxis no soportada, SALTADOS (no fallan):`);
  for (const s of saltados) console.log(`   ${s}`);
}

if (exentos.length) {
  console.log(`ℹ ${exentos.length} exento(s) MIENTRAS no los use nadie (se vuelven rojo al usarse):`);
  for (const e of exentos) console.log(`   ${e}`);
}

if (fallos.length) {
  console.error(`✗ BORDES INVISIBLES — ${fallos.length} par(es) por debajo de ${UMBRAL}:1\n`);
  for (const f of fallos) console.error(`   ${f}`);
  console.error(
    `\n  Un borde que vale lo mismo que su lienzo no se pinta. Dale valor propio en\n` +
      `  la capa del tema (07-dark.css) — ver docs/customs-catalog.md §1.9.`,
  );
  process.exit(1);
}

console.log(
  `✓ BORDES OK — ${comprobados} pares (token de borde × lienzo × tema) por encima de ${UMBRAL}:1.`,
);
