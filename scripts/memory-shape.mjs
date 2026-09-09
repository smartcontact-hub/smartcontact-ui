/**
 * Forma de la MEMORIA del agente, como gate (CHECK N de `docs:coherence`).
 *
 * Por qué existe: la memoria (`~/.claude/projects/<slug>/memory/`) es el otro almacén de lecciones,
 * y no tenía tope. Medido el 2026-09-09: 63 fichas, 26.164 palabras, 36 tocadas solo en septiembre,
 * 35 de ellas «feedback» de proceso (que el enrutador de /reflect dice que NO va ahí). Es la misma
 * curva que hizo `LEARNINGS.md` (162 → 676 líneas en cinco semanas) hasta que el CHECK K lo bajó a
 * 196 y ahí sigue: añadir obliga a fundir o borrar. Y el índice `MEMORY.md` se carga ENTERO en cada
 * sesión, así que cada línea de más diluye a las otras (esa misma sesión, una regla cargada en el
 * índice se rompió igual). Esto lo cumple una máquina, no la voluntad.
 *
 * Qué exige:
 *   · ≤ MAX_FICHAS fichas (sin contar `MEMORY.md`);
 *   · cada ficha ≤ MAX_PALABRAS_FICHA palabras de cuerpo, con frontmatter `name:` y `type:` válido;
 *   · `MEMORY.md` ≤ MAX_PALABRAS_INDICE palabras, y ≡ fichas: cada ficha enlazada, cada enlace existe.
 *
 * Vive FUERA del repo (por usuario): sin directorio (CI, otra máquina) el check se omite y lo dice.
 * `SC_MEMORY_DIR` lo fuerza a una ruta; `SC_CLAUDE_PROJECT_DIR` fuerza la carpeta del proyecto.
 * Se prueba en rojo con casos fabricados en `scripts/__tests__/memory-shape.test.mjs`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const MAX_FICHAS = 40;
export const MAX_PALABRAS_FICHA = 250;
export const MAX_PALABRAS_INDICE = 1000;
const TIPOS = new Set(['user', 'feedback', 'project', 'reference']);

/** Carpeta de Claude Code para este repo (`~/.claude/projects/<slug>`). Sigue al repo PRINCIPAL, no al worktree. */
export function dirProyectoClaude(cwd = process.cwd()) {
  if (process.env.SC_CLAUDE_PROJECT_DIR) return process.env.SC_CLAUDE_PROJECT_DIR;
  let repo;
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    repo = dirname(common);
  } catch {
    return null;
  }
  const slug = repo.replace(/[^a-zA-Z0-9]/g, '-');
  return join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'projects', slug);
}

export function localizarMemoria(cwd) {
  if (process.env.SC_MEMORY_DIR) return process.env.SC_MEMORY_DIR;
  const p = dirProyectoClaude(cwd);
  return p ? join(p, 'memory') : null;
}

export function leerMemoria(dir) {
  const nombres = readdirSync(dir)
    .filter((n) => n.endsWith('.md') && n !== 'MEMORY.md')
    .sort();
  const idx = join(dir, 'MEMORY.md');
  return {
    indice: existsSync(idx) ? readFileSync(idx, 'utf8') : '',
    fichas: nombres.map((n) => ({ nombre: n, texto: readFileSync(join(dir, n), 'utf8') })),
  };
}

const palabras = (s) => (s.trim().match(/\S+/g) || []).length;
const partir = (texto) => {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { front: m[1], cuerpo: m[2] } : { front: null, cuerpo: texto };
};

/** Devuelve la lista de problemas (vacía = forma correcta). */
export function revisarMemoria({ indice, fichas }) {
  const problemas = [];
  if (fichas.length > MAX_FICHAS)
    problemas.push(`hay ${fichas.length} fichas; el tope es ${MAX_FICHAS}: añadir obliga a fundir o borrar (el mismo tope que salvó a LEARNINGS).`);
  const pi = palabras(indice);
  if (pi > MAX_PALABRAS_INDICE)
    problemas.push(`MEMORY.md mide ${pi} palabras; el tope es ${MAX_PALABRAS_INDICE}. Se carga entero en cada sesión: cada línea de más diluye a las otras.`);

  const enlazadas = new Set([...indice.matchAll(/\]\(([^)\s]+\.md)\)/g)].map((m) => m[1]));
  const existentes = new Set(fichas.map((f) => f.nombre));
  for (const e of enlazadas) if (!existentes.has(e)) problemas.push(`MEMORY.md enlaza ${e}, que no existe. Quita la línea o recupera la ficha.`);

  for (const f of fichas) {
    const { front, cuerpo } = partir(f.texto);
    if (!front) problemas.push(`${f.nombre}: sin frontmatter (name / description / type).`);
    else {
      const tipo = (front.match(/^\s*type:\s*(\S+)/m) || [])[1];
      if (!TIPOS.has(tipo)) problemas.push(`${f.nombre}: type «${tipo ?? '∅'}» no es user | feedback | project | reference.`);
      if (!/^name:\s*\S/m.test(front)) problemas.push(`${f.nombre}: sin \`name:\` en el frontmatter.`);
    }
    const pc = palabras(cuerpo);
    if (pc > MAX_PALABRAS_FICHA)
      problemas.push(`${f.nombre} mide ${pc} palabras; el tope es ${MAX_PALABRAS_FICHA}. Una ficha es un hecho, no un documento: el relato largo va a docs/ del repo o al archivo.`);
    if (!enlazadas.has(f.nombre)) problemas.push(`${f.nombre} no está enlazada en MEMORY.md: sin puntero queda huérfana.`);
  }
  return problemas;
}
