// Pone antes (arriba) y después (abajo), recortados a la misma zona, en una PNG.
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';
const [antes, despues, salida, x, y, w, h] = process.argv.slice(2);
const [X, Y, W, H] = [x, y, w, h].map(Number);
const a = PNG.sync.read(readFileSync(antes)), d = PNG.sync.read(readFileSync(despues));
const out = new PNG({ width: W, height: H * 2 + 8 });
out.data.fill(255);
const copia = (src, dy) => { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const s = ((Y + j) * src.width + (X + i)) * 4, t = ((dy + j) * W + i) * 4; for (let k = 0; k < 4; k++) out.data[t + k] = src.data[s + k] ?? 255; } };
copia(a, 0); copia(d, H + 8);
writeFileSync(salida, PNG.sync.write(out));
console.log('ok', a.width, a.height, d.width, d.height);
