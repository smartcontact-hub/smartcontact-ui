/**
 * CODEMOD — devolver la replica a unidades FLUIDAS, como el original.
 *
 * La app real dimensiona TODO en vw. La replica lo congelo a px con referencia 1456
 * ('px = vw x 14.56'), lo cual es exacto a 1456 y falso en cualquier otro ancho. Este
 * codemod deshace la congelacion: divide cada longitud en px por 14.56 y emite vw.
 *
 * La conversion es EXACTA por construccion —es la inversa de la calibracion con la que
 * se tomaron las medidas—, asi que a 1456 el resultado tiene que ser identico. Eso es
 * justo lo que verifica 'tools/compare-ndjson.ts': se mide antes, se convierte, se mide
 * despues, y a 1456 el residuo tiene que ser ruido.
 *
 * SE QUEDAN EN px, a proposito:
 *  - 'outline' y 'outline-offset': son los aros de foco que anadi yo por accesibilidad,
 *    no vienen del original, y un aro de foco no deberia encoger con la ventana.
 *  - el '1px' exacto EN UN BORDE: una linea de un pixel de dispositivo es una decision
 *    de pixel, no de escala, y el propio original lo hace asi (el borde del pulsador del
 *    interruptor va 'border: 1px solid #4F5256'). Las lineas que SI escala las declara en
 *    vw ('0.052vw') — y esas, al valer 0.76px aqui, se convierten.
 *
 * OJO: la regla se acota a BORDES a proposito. Al principio conservaba cualquier '1px' y
 * eso dejaba en px el 'padding: 1px' vertical del chip de espera... que el original NO
 * declara asi: el suyo es 'padding: 0.15625vw 0.2604166667vw'. Ese 1px era invencion mia,
 * no una medida, y conservarlo mantenia una divergencia en vez de arreglarla.
 *
 * Uso:  node tools/px-to-vw.ts [--dry]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

/** Ancho de referencia con el que se tomaron todas las medidas. */
const REFERENCE_WIDTH = 1456;
const PER_VW = REFERENCE_WIDTH / 100; // 14.56

const TARGETS = [
  'projects/agent/src/app/**/*.ts',
  'projects/agent/src/styles/*.scss',
];

/** Declaraciones cuyo valor NO se toca. */
const KEEP_PROPERTY = /^\s*(outline|outline-offset|outline-width)\s*:/;

/** Solo aqui sobrevive un '1px': el borde de un pixel de dispositivo. */
const HAIRLINE_PROPERTY = /^\s*border(-(top|right|bottom|left))?(-width)?\s*:/;

/** Numero + px que no forme parte de un identificador ni de otro numero. */
const PX = /(?<![\w.-])(-?\d*\.?\d+)px\b/g;

function toVw(px: number): string {
  /*
   * SE REDONDEA HACIA ARRIBA, no al mas cercano. Chromium resuelve la longitud y luego
   * TRUNCA a LayoutUnit (1/64 px): con 'toFixed', 42px -> 2.884615vw -> 41.999993px ->
   * 41.984375px, y la fila entera perdia 0.02. Encima se acumulaba fila a fila hasta
   * 0.34px al final de la tabla, y de rebote hacia que la caja de linea de 19 textos
   * cayera de 16 a 15 al aterrizar en otra fase subpixel. Medido: las tres cosas eran
   * el MISMO fallo. Redondeando hacia arriba a la millonesima, el valor cae siempre
   * justo por encima y el truncado da el pixel correcto; el exceso es de 1.5e-5 px.
   */
  const raw = px / PER_VW;
  const vw = (Math.sign(raw) * Math.ceil(Math.abs(raw) * 1e6)) / 1e6;
  const s = vw.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return `${s}vw`;
}

const dry = process.argv.includes('--dry');
let filesTouched = 0;
let converted = 0;
let kept = 0;

for (const pattern of TARGETS) {
  for await (const file of glob(pattern)) {
    const src = await readFile(file, 'utf8');
    const lines = src.split('\n');
    let changedHere = 0;

    const out = lines.map((line) => {
      // Los comentarios documentan la medida ORIGINAL: se dejan tal cual para que la
      // trazabilidad no se pierda al cambiar de unidad.
      const trimmed = line.trimStart();
      if (
        trimmed.startsWith('*') ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*')
      ) {
        return line;
      }
      if (KEEP_PROPERTY.test(line)) {
        kept += (line.match(PX) ?? []).length;
        return line;
      }
      const hairline = HAIRLINE_PROPERTY.test(line);
      return line.replace(PX, (match, raw: string) => {
        const px = Number(raw);
        if (hairline && Math.abs(px) === 1) {
          kept += 1;
          return match;
        }
        if (px === 0) {
          return match;
        }
        changedHere += 1;
        converted += 1;
        return toVw(px);
      });
    });

    if (changedHere > 0) {
      filesTouched += 1;
      if (!dry) {
        await writeFile(file, out.join('\n'), 'utf8');
      }
      console.log(`  ${file}: ${changedHere}`);
    }
  }
}

console.log(
  `${
    dry ? '[dry] ' : ''
  }${converted} valores a vw en ${filesTouched} ficheros; ${kept} se quedan en px`
);
