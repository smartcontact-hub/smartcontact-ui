#!/usr/bin/env node
/**
 * Los tiempos de un PR, de punta a punta, sacados de GitHub y siempre en el mismo formato.
 *
 * POR QUÉ. Para saber si el ciclo de validación se acorta hay que comparar lote con lote, y hasta el 2026-10-04 los
 * tiempos se apuntaban a mano en notas que mueren con el contenedor (DD-154 midió así los suyos). Esto los saca de
 * GitHub: cuándo se abrió y se fundió el PR, cada vuelta de su CI y la de `main`. Lo único que GitHub no sabe es cuándo
 * llegó el feedback que lo pidió: se le pasa con `--desde`. La salida va al mensaje del squash, así que la serie queda en `git log`.
 *
 * Dos trampas medidas al escribirlo (#325):
 *   · las ramas se reutilizan entre PRs: las ejecuciones se filtran por los commits del PR, no por la rama;
 *   · el fin de una ejecución es el del último job (`updated_at` puede llegar más tarde), y una sin jobs (la del commit
 *     del robot de `visual-baselines` sobre un PR abierto) no tiene fin: se dice.
 *
 * Uso:  npm run tiempos -- <PR> [--desde HH:MM | --desde <fecha ISO>]   (horas en UTC)
 */
import { fileURLToPath } from 'node:url';

import { cliente } from './github.mjs';

const hhmm = (iso) => new Date(iso).toISOString().slice(11, 16);
const dia = (iso) => new Date(iso).toISOString().slice(0, 10);
/** Minutos entre dos instantes, contados sobre las horas que se ven (HH:MM): así «15:28 → 18:58» da 3 h 30 min. */
const minutos = (a, b) => Math.floor(Date.parse(b) / 60000) - Math.floor(Date.parse(a) / 60000);

/** «3 h 30 min», «45 min». */
export function duracion(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

/** `--desde`: una hora (`15:28`, el día del primer commit) o una fecha ISO completa. */
export function desdeISO(desde, diaBase) {
  if (!desde) return null;
  if (/^\d{1,2}:\d{2}$/.test(desde)) return `${diaBase}T${desde.padStart(5, '0')}:00Z`;
  const t = Date.parse(desde);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

const resultado = (c) => ({ success: 'verde', failure: 'rojo', cancelled: 'cancelado', timed_out: 'agotado' })[c] ?? c ?? 'en curso';

/** Una línea por vuelta del CI: inicio → fin · minutos · resultado (id). Sin jobs no hay fin, y se dice. */
function lineaDeCI(etiqueta, e, diaPr) {
  const hora = (iso) => (dia(iso) === diaPr ? hhmm(iso) : `${dia(iso).slice(5)} ${hhmm(iso)}`);
  if (e.sinJobs) return `- ${etiqueta}: ${hora(e.inicio)} · sin jobs, ${resultado(e.conclusion)} (${e.id})`;
  if (!e.fin) return `- ${etiqueta}: ${hora(e.inicio)} · ${resultado(e.conclusion)} (${e.id})`;
  return `- ${etiqueta}: ${hora(e.inicio)} → ${hora(e.fin)} · ${duracion(minutos(e.inicio, e.fin))} · ${resultado(e.conclusion)} (${e.id})`;
}

/**
 * Las líneas del informe, a partir de datos ya leídos (la parte que prueba el test).
 * `pr`: número, título, abierto y fundido. `ejecuciones` y `main`: `{ id, inicio, fin, conclusion, sinJobs }`.
 */
export function lineasDeTiempos({ pr, primerCommit, ejecuciones, main, desde = null }) {
  const diaPr = dia(pr.abierto);
  const hora = (iso) => (dia(iso) === diaPr ? hhmm(iso) : `${dia(iso).slice(5)} ${hhmm(iso)}`);
  const lineas = [`#${pr.numero} · ${pr.titulo}`, `Tiempos (UTC, ${diaPr}):`];
  if (desde) lineas.push(`- feedback: ${hora(desde)}`);
  if (primerCommit) lineas.push(`- primer commit: ${hora(primerCommit)}`);
  lineas.push(`- PR abierto: ${hora(pr.abierto)}`);
  for (const e of [...ejecuciones].sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))) lineas.push(lineaDeCI('CI del PR', e, diaPr));
  if (pr.fundido) {
    lineas.push(`- fundido: ${hora(pr.fundido)}`);
    const origen = desde ?? primerCommit;
    if (origen) lineas.push(`- de punta a punta: ${duracion(minutos(origen, pr.fundido))}, desde ${desde ? 'el feedback' : 'el primer commit'}`);
  } else {
    lineas.push('- sin fundir');
  }
  if (main) lineas.push(lineaDeCI('CI de main', main, diaPr));
  return lineas;
}

/** Una ejecución con su fin: el del último job, y solo si la ejecución ha acabado. Mientras sigue, alguno de sus jobs
 *  puede haber acabado ya (`changes`, en el primer minuto), y su hora no es el fin de nada. */
export function conFin(github, r) {
  const jobs = github.jobsDe(r.id);
  const fin = r.status === 'completed' ? (jobs.map((j) => j.completedAt).filter(Boolean).sort().at(-1) ?? null) : null;
  return { id: r.id, inicio: r.startedAt, fin, conclusion: r.conclusion, sinJobs: jobs.length === 0 };
}

function main() {
  const args = process.argv.slice(2);
  const numero = Number(args.find((a) => /^\d+$/.test(a)));
  const i = args.indexOf('--desde');
  if (!numero) {
    console.error('Uso: npm run tiempos -- <PR> [--desde HH:MM]');
    process.exit(2);
  }
  const github = cliente();
  const p = github.pr(numero);
  const commits = github.commitsDe(numero);
  const shas = new Set(commits.map((c) => c.sha));
  const primerCommit = commits.map((c) => c.date).filter(Boolean).sort()[0] ?? null;
  const ejecuciones = github
    .ejecucionesCI(p.head.ref, 100)
    .filter((r) => shas.has(r.headSha))
    .map((r) => conFin(github, r));
  const deMain = p.merge_commit_sha && p.merged_at ? github.ejecucionesDeCommit(p.merge_commit_sha).find((r) => r.event === 'push') : null;
  const desde = desdeISO(i >= 0 ? args[i + 1] : null, dia(primerCommit ?? p.created_at));
  const lineas = lineasDeTiempos({
    pr: { numero, titulo: p.title, abierto: p.created_at, fundido: p.merged_at },
    primerCommit,
    ejecuciones,
    main: deMain ? conFin(github, deMain) : null,
    desde,
  });
  console.log(lineas.join('\n'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
