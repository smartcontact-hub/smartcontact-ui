#!/usr/bin/env node
/**
 * AUDIT · datos de contacto en los datos de demostración.
 *
 * POR QUÉ EXISTE. Las réplicas (`agent`, `cuscare`, `agent-mini`) se construyen MIDIENDO la
 * app real, y por ahí se cuela lo que la app real mostraba. El 2026-09-07 se encontraron 7
 * teléfonos de la extracción publicados en `agent/seed.ts` y servidos en sc-agent.pages.dev,
 * uno de ellos colado incluso en `agent-mini/mini-seed.ts`, cuya cabecera dice literalmente
 * «aqui no va ni un dato real de la extraccion». La regla estaba escrita DOS veces (también en
 * `cuscare/seed.ts`) y aun así se saltó, porque **un teléfono inventado y uno real se ven
 * exactamente igual**: no hay revisión humana que los distinga leyendo el diff.
 *
 * QUÉ MIRA. Todo fichero versionado bajo los `src` de `projects` (`.ts`, `.html`, `.json`) en
 * busca de dos formas: teléfono español (móvil o fijo, con `+34` y separadores opcionales) y
 * correo electrónico. Cada valor distinto tiene que estar en la lista de abajo, con su motivo
 * escrito. No mira de dónde viene el número (eso ya no se puede saber, los volcados de
 * `findings/` están tachados desde el mismo día): mira que alguien haya dicho POR ESCRITO que
 * se lo inventó.
 *
 * LOS SEPARADORES IMPORTAN, y esto costó un susto: la primera versión solo veía los 9 dígitos
 * seguidos, así que uno de los teléfonos de la extracción sobrevivió en `agent-mini/mini-seed.ts`
 * ESCRITO CON ESPACIOS, a la limpieza del mismo día, y este gate lo habría dejado pasar. Salió
 * por casualidad horas después, buscando otra cosa.
 * El punto NO cuenta como separador, en cambio, y también está medido: los `d=` de los SVG van
 * llenos de decimales pegados (`…2.556.6c.318.026.629.046.952…`) y admitirlo daba dos falsos
 * positivos en `agent/…/app-icon.component.ts`.
 *
 * Los correos en dominios reservados para ficción (`example.com`, `.test`, `.invalid`) no
 * necesitan entrada: el RFC 2606 los reserva justo para esto y no pueden ser de nadie.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «valor nuevo» → es la pregunta que el gate existe para hacerte: ¿te lo inventaste, o lo
 *     copiaste de una pantalla real? Si lo copiaste, cámbialo. Si te lo inventaste, añádelo
 *     abajo con el motivo. Añadirlo sin mirar es exactamente el fallo que esto previene.
 *   · «ya no aparece» → quita su entrada, que la lista no se pudra.
 *
 * NO cubre: un nombre y apellidos copiados de la app real, que no tienen forma reconocible. Eso
 * sigue dependiendo de la cabecera de cada seed.
 *
 * ⛔ Y NO SE APLICA a Rafael Areses (Rafa), autor del repo. Su nombre y su identificador en las
 * réplicas (`Rafael_3AED` en `agent/seed.ts`) están puestos a propósito y él los quiere ahí:
 * no se marcan, no se sustituyen y no se «limpian» en ningún barrido, presente ni futuro.
 *
 * ES ESTÁTICO y PURO respecto al texto (funciones exportadas → testeable sin tocar el disco).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const log = (s = '') => process.stdout.write(s + '\n');

/** Teléfono español: móvil (6/7) o fijo (8/9), 9 dígitos, con `+34` y separadores opcionales. */
export const TELEFONO_RE = /(?:\+?34[ -]?)?\b[6789]\d{2}[ -]?\d{3}[ -]?\d{3}\b/g;

/** Correo, en su forma corriente. No pretende cubrir el RFC entero: pretende cazar los de verdad. */
export const CORREO_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Dominios que el RFC 2606 y el 6761 reservan para documentación y pruebas. No los puede
 * registrar nadie, así que un correo ahí no es de una persona por construcción.
 */
export const DOMINIOS_DE_FICCION = [/^example\.(com|net|org)$/i, /\.(test|invalid|localhost|example)$/i];

/**
 * Deja el número en su forma canónica de 9 dígitos, para que `+34 600 112 233`, `600-112-233` y
 * `600112233` sean UN valor y no tres. Primero los separadores, luego el prefijo de país: un
 * número español empieza por 6-9, así que un `34` delante solo puede ser el país.
 */
export const normalizarTelefono = (t) => t.replace(/[ -]/g, '').replace(/^\+?34/, '');

export const esDominioDeFiccion = (dominio) => DOMINIOS_DE_FICCION.some((re) => re.test(dominio));

/** Teléfonos distintos que aparecen en un texto, ya normalizados. */
export function extraerTelefonos(texto) {
  return [...new Set((texto.match(TELEFONO_RE) ?? []).map(normalizarTelefono))];
}

/** Correos distintos de un texto, EXCLUIDOS los de dominio de ficción. */
export function extraerCorreos(texto) {
  const todos = texto.match(CORREO_RE) ?? [];
  return [...new Set(todos.filter((c) => !esDominioDeFiccion(c.split('@')[1])))];
}

/**
 * TELÉFONOS DECLARADOS INVENTADOS. La clave es el número; el valor, quién dice que se lo
 * inventó. Un número aquí es una AFIRMACIÓN de una persona, no una medida: si te toca añadir
 * uno, la pregunta que responde esta columna es «¿de dónde salió?».
 */
export const TELEFONOS_PERMITIDOS = new Map([
  // projects/agent — los 7 de la extracción, sustituidos el 2026-09-07 (PR #58).
  ['600112233', 'agent: inventado'],
  ['622334455', 'agent: inventado'],
  ['633445566', 'agent: inventado'],
  ['910010101', 'agent: inventado, forma de fijo de Madrid'],
  ['910010102', 'agent: inventado, forma de fijo de Madrid'],
  ['910010103', 'agent: inventado, forma de fijo de Madrid'],

  // projects/agent-mini — su cabecera declara todo el fichero inventado.
  ['600445566', 'agent-mini: inventado. Sustituyó al de la extracción en SUS DOS formas, la de 9 dígitos y la separada, que sobrevivió medio día a la primera limpieza'],
  ['600998877', 'agent-mini: inventado'],
  ['611223344', 'agent y agent-mini: inventado'],
  ['612345678', 'agent-mini y supervisor: inventado, patrón de teclado'],
  ['634001122', 'agent-mini: inventado'],
  ['655443322', 'agent-mini: inventado'],
  ['677889900', 'agent-mini: inventado'],
  ['698112233', 'agent-mini: inventado'],

  // projects/cuscare — su seed declara TODO inventado en la cabecera.
  ['900000000', 'cuscare: placeholder de 900'],
  ['900907110', 'cuscare: inventado'],
  ['960960960', 'cuscare: inventado, dígito repetido'],

  // projects/sc-docs
  ['600123456', 'sc-docs: ejemplo de la demo de sc-subsection, patrón de teclado'],

  // projects/supervisor
  ['698765432', 'supervisor (agents-data): inventado, patrón de teclado'],
  ['900100200', 'supervisor (agendas + i18n): inventado, serie 900 correlativa'],
  ['900100201', 'supervisor (agendas + i18n): inventado, serie 900 correlativa'],
  ['900100202', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900112000', 'supervisor (conversations-mock): inventado'],
  ['900112233', 'supervisor (conversations-mock): inventado'],
  ['900117711', 'supervisor (conversations-mock): inventado'],
  ['900200300', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900200301', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900223344', 'supervisor (conversations-mock): inventado'],
  ['900300400', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900300401', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900300402', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900300403', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900400500', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900445566', 'supervisor (conversations-mock): inventado'],
  ['900500600', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900500601', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900600700', 'supervisor (agendas): inventado, serie 900 correlativa'],
  ['900778899', 'supervisor (conversations-mock): inventado'],
  ['900889977', 'supervisor (conversations-mock): inventado'],
  ['900998811', 'supervisor (conversations-mock): inventado'],
  ['901223300', 'supervisor (conversations-mock): inventado'],
  ['901334422', 'supervisor (conversations-mock): inventado'],
  ['910001122', 'supervisor (conversations-mock): inventado'],
  ['910223344', 'supervisor (conversations-mock): inventado'],
  ['910334411', 'supervisor (conversations-mock): inventado'],
  ['910445500', 'supervisor (conversations-mock): inventado'],
  ['910445566', 'supervisor (conversations-mock): inventado'],
  ['910556677', 'supervisor (conversations-mock): inventado'],
  ['910887766', 'supervisor (conversations-mock): inventado'],
  ['910998877', 'supervisor (conversations-mock): inventado'],
  ['911222333', 'supervisor (agendas): inventado, serie correlativa'],
  ['911222334', 'supervisor (agendas): inventado, serie correlativa'],
  ['911222335', 'supervisor (agendas): inventado, serie correlativa'],
  ['912334455', 'supervisor (conversations-mock): inventado'],
  ['912445566', 'supervisor (conversations-mock): inventado'],
  ['919110227', 'supervisor (conversations-mock): inventado'],
  ['919665544', 'supervisor (conversations-mock): inventado'],

  // Los dos únicos de todo el repo que NO siguen un patrón inventado, y por eso este gate los
  // sacó a la luz nada más nacer: van pegados a grupos con nombre de producción («ACD Demo
  // C2CB», «ACD demo cuscare») en `groups-data.ts`, y el primero sale además como teléfono del
  // usuario en la barra superior (`top-bar.component.ts`). No son inventados: son LÍNEAS DE LA
  // PROPIA SMART CONTACT, copiadas de la app real, y Rafa las confirmó como tales el
  // 2026-09-07. Se quedan a propósito: el número de una empresa no es dato de una persona, y en
  // la réplica dicen la verdad. Si algún día hay que quitarlos, será por otra razón que esta.
  ['917945449', 'supervisor (groups-data + top-bar): línea de la casa, confirmado por Rafa el 2026-09-07'],
  ['918371548', 'supervisor (groups-data): línea de la casa, confirmado por Rafa el 2026-09-07'],
]);

/**
 * CORREOS DECLARADOS INVENTADOS, fuera de los dominios de ficción del RFC. Que el dominio sea
 * de mentira (`empresa.com`, `company.com`) no basta: la parte de delante puede venir copiada
 * de una lista real de agentes, que es justo como se filtró todo lo demás.
 */
export const CORREOS_PERMITIDOS = new Map([
  ['user+tag@domain.tld', 'sc-docs: ejemplo de validación, no es una dirección'],
  ['ana.lopez@empresa.com', 'supervisor: inventado'],
  ['carlos.garcia@empresa.com', 'supervisor: inventado'],
  ['elena.torres@empresa.com', 'supervisor: inventado'],
  ['laura.martinez@empresa.com', 'supervisor: inventado'],
  ['mario.supervisor@empresa.com', 'supervisor: inventado'],
  ['roberto.sanchez@empresa.com', 'supervisor: inventado'],
  ['jbarcala@company.com', 'cuscare: inventado'],
  ['mperez@company.com', 'cuscare: inventado'],
  ['mrecio@company.com', 'cuscare: inventado'],
]);

/**
 * Compara lo encontrado contra lo declarado. Devuelve la lista de problemas, cada uno con su
 * línea de qué hacer. PURA: recibe el mapa `valor → ficheros`, no toca el disco.
 */
export function chequear(encontrados, permitidos, etiqueta) {
  const problemas = [];
  for (const [valor, ficheros] of [...encontrados].sort()) {
    if (permitidos.has(valor)) continue;
    problemas.push([
      `${etiqueta} sin declarar: ${valor}`,
      `      en ${[...ficheros].sort().join(', ')}`,
      `      → ¿te lo inventaste, o lo copiaste de una pantalla real? Si lo copiaste, cámbialo.`,
      `        Si es tuyo, añádelo a scripts/audit-seed-pii.mjs con el motivo.`,
    ]);
  }
  for (const [valor, motivo] of permitidos) {
    if (!encontrados.has(valor)) {
      problemas.push([
        `${etiqueta} declarado que ya no aparece: ${valor} (${motivo})`,
        `      → quita su entrada de scripts/audit-seed-pii.mjs, que la lista no se pudra.`,
      ]);
    }
  }
  return problemas;
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-seed-pii.mjs')) {
  // Solo ficheros VERSIONADOS: lo que no está en git no se publica, y así no barremos `dist/`
  // ni `node_modules/` por accidente.
  const ficheros = execSync('git ls-files projects', { encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\/src\/.*\.(ts|html|json)$/.test(f));

  if (!ficheros.length) {
    log('✗ audit:seed-pii: no encuentro fuentes de app — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const telefonos = new Map();
  const correos = new Map();
  for (const f of ficheros) {
    const texto = readFileSync(f, 'utf8');
    for (const t of extraerTelefonos(texto)) {
      if (!telefonos.has(t)) telefonos.set(t, new Set());
      telefonos.get(t).add(f);
    }
    for (const c of extraerCorreos(texto)) {
      if (!correos.has(c)) correos.set(c, new Set());
      correos.get(c).add(f);
    }
  }

  const problemas = [
    ...chequear(telefonos, TELEFONOS_PERMITIDOS, 'Teléfono'),
    ...chequear(correos, CORREOS_PERMITIDOS, 'Correo'),
  ];

  if (problemas.length) {
    log('✗ audit:seed-pii — datos de contacto sin declarar en los datos de demostración:');
    log();
    for (const lineas of problemas) log('  ' + lineas.join('\n  '));
    log();
    log(`  ${problemas.length} problema(s). El repo es PÚBLICO y estos ficheros se sirven en`);
    log('  los cinco sitios: un teléfono o un correo de verdad aquí es un dato publicado.');
    process.exit(1);
  }

  log(
    `✓ audit:seed-pii: ${telefonos.size} teléfonos y ${correos.size} correos en ${ficheros.length} ficheros, ` +
      'todos declarados con su motivo.',
  );
}
