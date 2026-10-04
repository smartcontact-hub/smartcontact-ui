#!/usr/bin/env node
/**
 * ¿Qué capturas de sc-docs se van a mover con este cambio, y siguen sin regenerar?
 *
 * POR QUÉ. En #325 (2026-10-04) `sc-group-popover` ganó la salida `activated`. Su página de sc-docs pintó una tabla
 * «Salidas» nueva, 142 px más alta, y `e2e-smoke` cayó en el CI por la captura `grouppopover-linux.png`: una vuelta de
 * CI y su diagnóstico, por algo que se sabía antes de subir. Las capturas `-linux.png` solo las puede hacer el workflow
 * `visual-baselines`, sobre una rama ya subida, así que esto NO es un gate: un gate que esperase la captura nueva no
 * dejaría subir la rama que hace falta para tenerla. Es un aviso al final del preflight, para lanzar el workflow ANTES de
 * abrir el PR (un commit del robot sobre un PR abierto deja su CI sin jobs).
 *
 * QUÉ MIRA, respecto a la base de la rama con `origin/main`:
 *   · la tabla de API de cada componente, campo a campo como la pinta `story-props-table` (por clase, el nombre, si es
 *     obligatorio, la marca de PrimeNG, el tipo, el valor por defecto, si está obsoleta y la descripción que se ve), y
 *     su «Cuándo se usa». Un campo que la tabla no enseña (`ocultas`, la descripción nativa tapada por la propia) no
 *     cuenta: regenerar no cambiaría nada y el aviso sería falso;
 *   · la carpeta del componente en el DS y su página en sc-docs.
 * Y solo avisa de las capturas que existen (`screenshotBaseline` en `components.spec.ts`) y que este cambio no ha tocado.
 *
 * Uso: node scripts/api-baselines.mjs (lo llama `preflight-scope` al final; nunca sale en rojo).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const API = 'projects/sc-docs/public/components/_component-api.json';
export const SPEC = 'e2e/components.spec.ts';
const CAPTURAS = 'e2e/components.spec.ts-snapshots';

/** Los nombres de las capturas de `components.spec.ts`: el segundo argumento de cada `screenshotBaseline`. */
export function capturasDeSpec(texto) {
  return new Set([...String(texto).matchAll(/screenshotBaseline\(\s*page\s*,\s*'([^']+)'\s*\)/g)].map((m) => m[1]));
}

/** La página de un componente: su nombre sin guiones (`group-popover` → `grouppopover`), como `component-audit`. */
export const slugDe = (nombre) => String(nombre).replace(/-/g, '');

/** Lo que la tabla de API pinta de un componente, en el orden en que lo pinta. */
export function tablaPintada(c) {
  const miembros = c?.contrato ?? [];
  const fila = (m) => ({
    nombre: m.nombre,
    requerido: Boolean(m.requerido),
    primeng: m.origen === 'nativo',
    tipo: m.tipo,
    porDefecto: m.porDefecto ?? null,
    obsoleta: m.nativo?.obsoleta ?? null,
    descripcion: m.descripcion ?? m.nativo?.descripcion ?? '',
  });
  const grupo = (clase) => miembros.filter((m) => m.clase === clase).map(fila);
  return JSON.stringify({ cuando: c?.cuando ?? null, entradas: grupo('input'), dosSentidos: grupo('model'), salidas: grupo('output') });
}

/**
 * Las capturas que este cambio mueve y que no ha regenerado, con el porqué de cada una.
 * `cambiados`: rutas que difieren de la base. `apiAntes` y `apiAhora`: el `_component-api.json` en la base y ahora.
 */
export function capturasPendientes({ apiAntes, apiAhora, cambiados, capturas }) {
  const motivos = new Map();
  const anota = (slug, motivo) => {
    if (!capturas.has(slug)) return;
    motivos.set(slug, [...new Set([...(motivos.get(slug) ?? []), motivo])]);
  };

  const antes = new Map((apiAntes?.components ?? []).map((c) => [c.name, c]));
  const ahora = new Map((apiAhora?.components ?? []).map((c) => [c.name, c]));
  for (const nombre of new Set([...antes.keys(), ...ahora.keys()])) {
    if (tablaPintada(antes.get(nombre)) !== tablaPintada(ahora.get(nombre))) anota(slugDe(nombre), 'su tabla de API');
  }
  for (const ruta of cambiados) {
    const ds = /^projects\/ui-smartcontact\/src\/lib\/components\/([^/]+)\//.exec(ruta);
    if (ds) anota(slugDe(ds[1]), 'el componente');
    const docs = /^projects\/sc-docs\/src\/app\/pages\/components\/([^/]+)\//.exec(ruta);
    if (docs) anota(docs[1], 'su página');
  }

  const regeneradas = new Set(cambiados.filter((r) => r.startsWith(`${CAPTURAS}/`)).map((r) => r.slice(CAPTURAS.length + 1)));
  return [...motivos]
    .filter(([slug]) => !regeneradas.has(`${slug}-linux.png`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, porque]) => ({ slug, porque }));
}

/** El aviso, listo para imprimir; vacío si no hay nada pendiente. */
export function aviso(pendientes, rama) {
  if (!pendientes.length) return '';
  const filas = pendientes.map((p) => `    ${p.slug}-linux.png  (cambia ${p.porque.join(' y ')})`);
  return [
    `\n⚠️ CAPTURAS DE SC-DOCS SIN REGENERAR (${pendientes.length}). El CI las compara en e2e-smoke y caería:`,
    ...filas,
    `    Tras el push, y ANTES de abrir el PR: lanza el workflow visual-baselines con rama=${rama}, trae su commit y`,
    '    mira cada PNG. Un commit del robot sobre un PR ya abierto deja su CI sin jobs.',
    '',
  ].join('\n');
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim();

function main() {
  try {
    const base = git(['merge-base', 'HEAD', 'origin/main']);
    // Contra el árbol de trabajo, no contra HEAD: el preflight mide lo que va a subir, commiteado o no.
    const cambiados = git(['diff', '--name-only', base]).split('\n').filter(Boolean);
    const leer = (texto) => (texto ? JSON.parse(texto) : null);
    let apiAntes = null;
    try {
      apiAntes = leer(git(['show', `${base}:${API}`]));
    } catch {
      /* la base no tenía el fichero: todo lo de ahora es nuevo */
    }
    const apiAhora = existsSync(API) ? leer(readFileSync(API, 'utf8')) : null;
    const capturas = capturasDeSpec(existsSync(SPEC) ? readFileSync(SPEC, 'utf8') : '');
    const rama = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    const texto = aviso(capturasPendientes({ apiAntes, apiAhora, cambiados, capturas }), rama);
    if (texto) console.log(texto);
  } catch (e) {
    // Es un aviso: si no puede medir, lo dice y deja seguir.
    console.log(`(aviso de capturas: no pude medir — ${String(e?.message ?? e).split('\n')[0]})`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
