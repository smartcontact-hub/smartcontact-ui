#!/usr/bin/env node
/**
 * El mensaje de un squash, ESCRITO: el título del PR con su número y el cuerpo del PR, sin trailers
 * ni el pie de la herramienta. Lo usa `audit-automerge.yml` al fundir la auditoría semanal.
 *
 * Por qué (2026-09-28): `gh pr merge --squash` sin `--subject` ni `--body` deja que GitHub componga el
 * mensaje, y GitHub añade una línea `Co-authored-by:` por cada autor de commit que no es quien funde.
 * En la auditoría funde el robot de Actions, así que cualquier autor de la rama salía de coautor: el
 * #266 entró en `main` con la herramienta como coautora sin que ningún commit de su rama llevara la
 * línea. Con el mensaje escrito, GitHub lo usa tal cual (así salieron limpios #263 y #264, fundidos
 * con título y cuerpo explícitos). AGENTS.md §«Pull requests y commits»; DD-134.
 *
 * Qué quita del cuerpo: las líneas de trailer `Co-authored-by:` y `Signed-off-by:`, la línea
 * «Generated with Claude Code» y el enlace a una sesión de claude.ai (el servidor MCP los añade al
 * crear un PR en la nube, y `pr-footer-guard` pide quitarlos, pero aquí no se da por hecho), y las
 * rayas y líneas vacías que el pie deja colgando al final.
 *
 * Uso: `gh pr view N --json number,title,body | node scripts/mensaje-squash.mjs asunto|cuerpo`.
 * PURA la función exportada (testeable sin gh ni red).
 */
import { fileURLToPath } from 'node:url';

/** Las líneas que no viajan al commit: trailers de autoría y el pie de la herramienta. */
export const LINEAS_FUERA = [
  /^[ \t]*(?:co-authored-by|signed-off-by):/i,
  /generated with \[?claude code\b/i,
  /claude\.ai\/code\/session_/i,
];

/** El cuerpo cuando el PR no trae ninguno: un squash sin cuerpo explícito vuelve al mensaje de GitHub. */
export const CUERPO_POR_DEFECTO =
  'Fundido por audit-automerge.yml: el PR solo toca docs/AUDIT-SEMANAL.md y su CI salió verde.';

/** `{ asunto, cuerpo }` del squash a partir del PR. PURA. */
export function mensajeDeSquash({ number, title, body }) {
  const asunto = `${String(title ?? '').trim()} (#${number})`;
  const lineas = String(body ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => !LINEAS_FUERA.some((re) => re.test(l)));
  // Lo que el pie deja al final: su raya (`---`) y las líneas en blanco.
  while (lineas.length && /^\s*(?:[-*_]\s*){0,}$/.test(lineas.at(-1))) lineas.pop();
  const cuerpo = lineas.join('\n').trim();
  return { asunto, cuerpo: cuerpo || CUERPO_POR_DEFECTO };
}

async function main() {
  const parte = process.argv[2];
  if (parte !== 'asunto' && parte !== 'cuerpo') {
    process.stderr.write('uso: gh pr view N --json number,title,body | node scripts/mensaje-squash.mjs asunto|cuerpo\n');
    process.exit(2);
  }
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  const pr = JSON.parse(raw);
  if (!pr.number || !String(pr.title ?? '').trim()) {
    process.stderr.write('mensaje-squash: el JSON no trae `number` y `title`.\n');
    process.exit(1);
  }
  process.stdout.write(mensajeDeSquash(pr)[parte] + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
