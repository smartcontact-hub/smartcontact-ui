#!/usr/bin/env node
/**
 * AUDIT · el acoplamiento a los INTERNOS de PrimeNG.
 *
 * POR QUÉ. Es la deuda estructural más grande del repo, medida: 36 clases
 * `.p-*` distintas usadas desde SELECTORES de nuestro SCSS. **No son API
 * pública.** Una
 * subida de PrimeNG puede renombrar cualquiera y entonces las pantallas
 * revierten al aspecto del preset —filas de 42px, cabecera oscura— **sin que
 * falle ni un solo test de comportamiento**, porque el comportamiento sigue
 * intacto. Es el fallo silencioso más caro que tiene este proyecto.
 *
 * CÓMO. No mira el DOM: muchas de esas clases solo existen con un overlay
 * abierto (`.p-select-option`), así que un barrido de página daría rojos falsos
 * y cobertura parcial. Mira el CÓDIGO DE PRIMENG: si una clase de la que
 * dependemos ya no aparece en `node_modules/primeng`, es que la han renombrado.
 * Estático, completo, sin navegador, y corre dentro de `verify`.
 *
 * QUÉ HACER SI SE PONE ROJO. NO bajes el listón. Es literalmente el aviso de
 * que la actualización te ha cambiado el aspecto por debajo: busca el nombre
 * nuevo en el changelog de PrimeNG y actualiza el selector en nuestro SCSS.
 *
 * Y EL OBJETIVO DE VERDAD es que este número BAJE. Cada `.p-*` que se pueda
 * sustituir por una clase propia o un token es un punto menos de fragilidad.
 * El guardián avisa de que no crezca; reducirlo es trabajo aparte.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const log = (s = '') => process.stdout.write(s + '\n');
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/**
 * Tope de acoplamiento. No es una meta, es un trinquete: que no CREZCA sin que
 * alguien lo decida a conciencia. Si lo bajas porque has quitado dependencias,
 * perfecto — actualiza el número. Si lo subes, escribe por qué.
 */
const TOPE = 36;

/* Cuenta las clases `.p-*` que aparecen en SELECTORES, no en comentarios. Un
 * comentario que menciona `.p-datatable-*` para explicar POR QUÉ dependemos de
 * ella no es una dependencia nueva — contarlo inflaba el número (y peor: un
 * glob como `.p-datatable-*` entraba como una "clase" fantasma con guion al
 * final). Se listan los ficheros que tienen algún `.p-`, se les quitan los
 * comentarios de bloque y de línea, y solo entonces se extraen las clases. */
const ficheros = sh(
  "grep -rl '\\.p-' --include='*.scss' projects/supervisor/src projects/ui-smartcontact/src",
)
  .split('\n')
  .filter(Boolean);

const sinComentarios = (scss) =>
  scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

const usados = [
  ...new Set(
    ficheros.flatMap((f) => {
      try {
        return [...sinComentarios(readFileSync(f, 'utf8')).matchAll(/\.p-[a-z0-9]+(?:-[a-z0-9]+)*/g)].map(
          (m) => m[0].replace(/^\./, ''),
        );
      } catch {
        return [];
      }
    }),
  ),
].sort();

/* Un grep POR CLASE en vez de cargar PrimeNG en memoria: `execSync` trae un
 * búfer de 1 MB por defecto y su bundle lo desborda de largo — la primera
 * versión reportaba «no encuentro PrimeNG» cuando lo que pasaba es que no
 * cabía. Un mensaje de error que miente sobre su propia causa es peor que un
 * fallo. */
const existeEnPrimeng = (clase) =>
  sh(`grep -rlF '${clase}' node_modules/primeng/fesm2022/ 2>/dev/null | head -1`).trim().length > 0;

if (!existeEnPrimeng('p-button')) {
  log('✗ audit:primeng-coupling: no encuentro el código de PrimeNG en node_modules — ¿falta `npm ci`?');
  process.exit(1);
}

const huerfanos = usados.filter((c) => !existeEnPrimeng(c));

log(`audit:primeng-coupling — ${usados.length} clase(s) interna(s) de PrimeNG usadas desde nuestro SCSS\n`);

if (huerfanos.length) {
  log('  Estas clases YA NO EXISTEN en PrimeNG. Tu CSS apunta al vacío:');
  for (const c of huerfanos) {
    log(`  ✗ .${c}`);
    for (const f of sh(`grep -rl '\\.${c}' --include='*.scss' projects/`).split('\n').filter(Boolean).slice(0, 4)) {
      log(`      ${f}`);
    }
  }
  log('\n  → Busca el nombre nuevo en el changelog de PrimeNG. NO borres la regla');
  log('    sin sustituirla: el estilo que aplicaba sigue haciendo falta.');
}

if (usados.length > TOPE) {
  log(`\n  ✗ el acoplamiento CRECIÓ: ${usados.length} clases contra un tope de ${TOPE}.`);
  log('    Cada `.p-*` nuevo es un punto más donde una subida de versión te');
  log('    cambia el aspecto en silencio. Si es inevitable, sube el TOPE en');
  log('    este script y di por qué en el commit.');
}

const problemas = huerfanos.length + (usados.length > TOPE ? 1 : 0);
if (problemas === 0) {
  log(`✓ audit:primeng-coupling OK — las ${usados.length} siguen existiendo, y el acoplamiento no crece (tope ${TOPE}).`);
  process.exit(0);
}
log(`\n✗ audit:primeng-coupling: ${problemas} problema(s).`);
process.exit(1);
