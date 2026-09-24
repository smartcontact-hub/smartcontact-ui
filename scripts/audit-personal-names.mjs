#!/usr/bin/env node
/**
 * AUDIT · el código no nombra a personas.
 *
 * POR QUÉ EXISTE. El repo es público y el código es lo que más se lee de él. El 2026-09-24 había
 * 197 menciones del autor del repo en ficheros de código, casi todas con una de tres formas: la
 * autoría de una decisión entre paréntesis («(Nombre, fecha)»), una cita literal de conversación
 * («veo desalineaciones») o quién detectó un fallo. Nada de eso ayuda a entender la línea que
 * acompaña: lo que la sostiene es un criterio de diseño o técnico, y la fuente de una decisión es
 * su DD (`docs/DECISIONS.md`), su ticket o su nodo de Figma. La cita literal, además, deja en el
 * código un registro de conversación que no le corresponde. Cómo se escribe en su lugar:
 * AGENTS.md §«Voz del código».
 *
 * QUÉ MIRA. Todo fichero de código del repo, versionado o nuevo sin ignorar (un fichero que aún
 * no has añadido también se publica al añadirlo, LEARNINGS #2), más los hooks de `.githooks/`.
 * Fuera: la documentación en `.md` y `findings/`, que son volcados de medición de la app real.
 * Busca las formas del nombre como palabra entera y sin distinguir mayúsculas, así que un
 * identificador como `Rafael_3AED` o una ruta `/Users/…` no cuentan.
 *
 * LO QUE SÍ PUEDE LLEVARLO: el nombre como DATO, nunca como autoría. Un agente de demo con el
 * nombre del autor está puesto a propósito (lo explica `audit-seed-pii.mjs`), y el test del
 * guardián de portadas necesita el texto que debe denegar. Cada caso vive en DATO_PERMITIDO con su
 * motivo, y la lista no se pudre: una entrada que ya no casa con nada, falla.
 *
 * QUÉ HACER SI SE PONE ROJO: reescribe el comentario sin la persona. «(Nombre, 2026-09-18)» pasa a
 * su fuente (DD, ticket, maqueta) o, si registra una decisión, a «decisión de producto (fecha)», que
 * avisa como antes el nombre de que no se deshace a la ligera; una cita pasa al criterio que expresaba;
 * «X lo detectó» pasa a «detectado en revisión visual». Si de verdad es un dato, añádelo abajo con
 * su motivo.
 *
 * ES PURO respecto al texto (funciones exportadas → testeable sin tocar el disco).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const log = (s = '') => process.stdout.write(s + '\n');

/**
 * Las formas del nombre del autor del repo, como palabra entera. Sin `g`: `bash-guard` la reusa
 * con `.test()` sobre cada comando, y una regex global arrastra `lastIndex` entre llamadas.
 */
export const NOMBRE_RE = /\b(?:rafa|rafael|areses)\b/i;

/** Qué es código: fuentes, estilos, plantillas, config y scripts. Ni docs ni volcados de medida. */
export function esCodigo(fichero) {
  if (fichero.startsWith('findings/')) return false;
  if (/(^|\/)package-lock\.json$/.test(fichero)) return false;
  return fichero.startsWith('.githooks/') || /\.(?:[cm]?js|tsx?|html|s?css|ya?ml|sh|json)$/.test(fichero);
}

/** Este gate y su test: definen y prueban el patrón, así que lo llevan escrito por fuerza. */
export const EXCLUIDOS = new Set(['scripts/audit-personal-names.mjs', 'scripts/__tests__/audit-personal-names.test.mjs']);

/**
 * El nombre como DATO. `texto` es un trozo literal de la línea: una línea que lo contiene pasa, y
 * cualquier otra mención en el mismo fichero no. Si te toca añadir una, la pregunta que responde
 * `motivo` es «¿por qué esto es un dato y no una firma?».
 */
export const DATO_PERMITIDO = [
  {
    fichero: 'projects/supervisor/src/app/features/admin/agents/data/agents-data.ts',
    texto: "name: 'Rafa Areses'",
    motivo: 'agente de demo con el nombre del autor, a propósito (audit-seed-pii.mjs)',
  },
  {
    fichero: 'projects/supervisor/src/app/features/memory/data/entity-catalog.ts',
    texto: "15: 'Rafa Areses'",
    motivo: 'el mismo agente de demo, en el catálogo de nombres para mostrar',
  },
  {
    fichero: 'projects/agent/src/app/data/seed.ts',
    texto: 'soy Rafael del equipo de soporte',
    motivo: 'texto de un chat de la réplica, firmado por el perfil `Rafael_3AED`',
  },
  {
    fichero: 'scripts/__tests__/bash-guard.test.mjs',
    texto: 'Para Rafa',
    motivo: 'el rótulo de portada que `bash-guard` debe denegar: el test lo necesita escrito',
  },
  {
    fichero: 'scripts/__tests__/bash-guard.test.mjs',
    texto: 'Esto lo pidió Rafa',
    motivo: 'el «Por qué» de commit que `bash-guard` debe denegar',
  },
];

/** Líneas de un texto que nombran al autor, con su número (desde 1). */
export function buscar(texto) {
  const hallazgos = [];
  texto.split('\n').forEach((linea, i) => {
    if (NOMBRE_RE.test(linea)) hallazgos.push({ n: i + 1, linea });
  });
  return hallazgos;
}

/**
 * Cruza lo encontrado con la lista de datos. PURA: recibe `fichero → hallazgos` y devuelve las
 * menciones sin permiso y las entradas que ya no casan con nada.
 */
export function chequear(encontrados, permitidos = DATO_PERMITIDO) {
  const usadas = new Set();
  const menciones = [];
  for (const [fichero, hallazgos] of [...encontrados].sort(([a], [b]) => a.localeCompare(b))) {
    for (const h of hallazgos) {
      const entrada = permitidos.find((p) => p.fichero === fichero && h.linea.includes(p.texto));
      if (entrada) usadas.add(entrada);
      else menciones.push({ fichero, ...h });
    }
  }
  const podridas = permitidos.filter((p) => !usadas.has(p));
  return { menciones, podridas };
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-personal-names.mjs')) {
  const ficheros = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && esCodigo(f) && !EXCLUIDOS.has(f) && existsSync(f));

  if (!ficheros.length) {
    log('✗ audit:personal-names: no encuentro ficheros de código — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const encontrados = new Map();
  for (const f of ficheros) {
    const hallazgos = buscar(readFileSync(f, 'utf8'));
    if (hallazgos.length) encontrados.set(f, hallazgos);
  }

  const { menciones, podridas } = chequear(encontrados);

  if (menciones.length || podridas.length) {
    if (menciones.length) {
      log(`✗ audit:personal-names — ${menciones.length} mención(es) de una persona en el código:`);
      log();
      for (const m of menciones) log(`  ${m.fichero}:${m.n}  ${m.linea.trim().slice(0, 140)}`);
      log();
      log('  El repo es público y un comentario explica el criterio, no quién lo pidió. Reescríbelo');
      log('  sin la persona: la decisión se cita por su fuente (DD, ticket, nodo de Figma) o como');
      log('  «decisión de producto (fecha)», y una cita literal pasa al criterio de diseño que expresaba.');
      log('  Cómo escribirlo: AGENTS.md §«Voz del código». Si es un DATO, va en DATO_PERMITIDO');
      log('  (scripts/audit-personal-names.mjs) con su motivo.');
    }
    if (podridas.length) {
      if (menciones.length) log();
      log('✗ audit:personal-names — entradas de DATO_PERMITIDO que ya no casan con nada:');
      for (const p of podridas) log(`  ${p.fichero} · «${p.texto}» (${p.motivo})`);
      log('  → quítalas de scripts/audit-personal-names.mjs, que la lista no se pudra.');
    }
    process.exit(1);
  }

  log(
    `✓ audit:personal-names: ${ficheros.length} ficheros de código sin nombres de personas ` +
      `(${DATO_PERMITIDO.length} datos declarados con su motivo).`,
  );
}
