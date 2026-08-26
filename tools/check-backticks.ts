/**
 * GUARDIAN — backticks dentro de `template:` o `styles:`.
 *
 * En un componente Angular inline, esos bloques son template literals. Un backtick suelto
 * dentro —tipico al citar una propiedad CSS en un comentario— CIERRA el literal y el
 * decorador se rompe. El error que suelta el compilador es
 *
 *     NG1002: Incorrect number of arguments to @Component decorator
 *
 * que **no menciona los backticks por ningun lado**, asi que se pierde un rato largo
 * buscando en el sitio equivocado. Ha pasado varias veces en este repo.
 *
 * Uso:  node tools/check-backticks.ts [ruta...]
 * Sale con codigo 1 si encuentra alguno.
 */
import { glob, readFile } from 'node:fs/promises';

const TARGETS =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ['projects/*/src/**/*.ts'];

interface Hit {
  file: string;
  line: number;
  block: string;
  text: string;
}

const hits: Hit[] = [];
let scanned = 0;

for (const pattern of TARGETS) {
  for await (const file of glob(pattern)) {
    const src = await readFile(file, 'utf8');
    if (!/\b(template|styles)\s*:\s*`/.test(src)) {
      continue;
    }
    scanned += 1;

    for (const block of ['template', 'styles'] as const) {
      const open = new RegExp(`\\b${block}\\s*:\\s*\``, 'g');
      for (const m of src.matchAll(open)) {
        const start = m.index + m[0].length;
        // El literal acaba en el primer backtick sin escapar.
        let end = start;
        while (end < src.length) {
          if (src[end] === '\\') {
            end += 2;
            continue;
          }
          if (src[end] === '`') {
            break;
          }
          end += 1;
        }
        /*
         * Un backtick DENTRO del cuerpo ya lo habria cerrado antes de tiempo, asi que el
         * sintoma no es encontrarlo: es que el literal ACABE donde no toca. Se detecta por
         * lo que viene despues del cierre — en un decorador sano, una coma o un salto.
         */
        const after = src.slice(end + 1, end + 4);
        if (!/^\s*[,\n]/.test(after)) {
          const line = src.slice(0, end).split('\n').length;
          hits.push({
            file,
            line,
            block,
            text: src
              .slice(Math.max(start, end - 60), end + 20)
              .replace(/\n/g, ' '),
          });
        }
      }
    }
  }
}

if (hits.length) {
  console.error(`BACKTICKS sueltos en ${hits.length} sitio(s):\n`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  (dentro de ${h.block}:)`);
    console.error(`    …${h.text}…\n`);
  }
  console.error(
    'El compilador dirá NG1002 y no mencionará los backticks. Son estos.'
  );
  process.exit(1);
}

console.log(
  `sin backticks sueltos (${scanned} componentes con bloques inline)`
);
