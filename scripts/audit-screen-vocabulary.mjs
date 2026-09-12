#!/usr/bin/env node
/**
 * AUDIT · el VOCABULARIO de dentro de la pantalla — que una fila de dos columnas
 * mida lo mismo en las nueve.
 *
 * POR QUÉ. `audit:page-anatomy` vigila el ESQUELETO (que toda página declare su
 * arquetipo, que ninguna re-declare el molde). Lo de DENTRO no lo miraba nadie, y ahí
 * es donde la deriva es invisible: dos hojas distintas declaran `.grid--2`, una con
 * 24.5/12.25 y la otra con 15.75/15.75, y las dos pantallas se ven "parecidas" hasta
 * que las pones una al lado de la otra.
 *
 * Medido el 2026-09-10 antes de escribir esto: `.grid`, `.field` y `.field__label`
 * estaban declarados DOS veces —`styles/_forms.scss` (los tres formularios de admin) y
 * `features/config/aed/aed-defaults-page.component.scss` (las tres pantallas de
 * config/aed)— con valores distintos en cinco propiedades. Ninguna regla los cruzaba.
 *
 * LA REFERENCIA son los tres flujos de `config/aed`, que se casaron con su maqueta el
 * 2026-09-09 y el 2026-09-10. Y NO se copia aquí: el canon se LEE de la hoja de
 * referencia en cada ejecución. Duplicar los valores en el gate es la misma clase de
 * fallo que el gate persigue — dos sitios que dicen lo mismo hasta que uno cambia.
 * (Es lo que ya nos enseñó `emit-consumer-typography`: leer la lista del preset en vez
 * de repetirla.)
 *
 * QUÉ GATEA — cuatro cosas, todas estáticas:
 *
 * 1. UN NOMBRE, UN HOGAR. Cada nombre del vocabulario compartido (`.grid`, `.field`,
 *    `.sub-section`, …) se declara en UNA sola hoja. Dos hogares = deriva, y el
 *    informe enseña la diferencia propiedad a propiedad para que se triñe con la tabla
 *    delante en vez de a ojo.
 * 2. NADIE SE HACE SU PROPIA CAJA. Una sección de campos vive en `sc-section-card`, no
 *    en un `.card`/`.rule-card` a mano. Trinquete por conteo: la lista solo mengua.
 * 3. QUIEN USA LA CAJA `card` SANGRA SU CONTENIDO. La cabecera de `surface="card"` se
 *    sangra 12.25 a sí misma, así que el contenido tiene que llevar la misma sangría
 *    (`.sub-section`) o el título queda 12.25 a la derecha de todo lo demás. Es un
 *    contrato del componente con lo que proyecta, y hasta el 2026-09-10 solo lo conocían
 *    las tres pantallas que ya usaban la caja: al convertir `sistema-page` sus cinco cards
 *    medían EXACTAS y la pantalla salía torcida igual.
 * 4. LAS DIVERGENCIAS DELIBERADAS SE DECLARAN. Lo que diverge a propósito va en
 *    `DELIBERADAS`, con su motivo y el DD que lo respalda. Sin motivo escrito, la
 *    siguiente pasada de "uniformar" lo borra creyendo que es un descuido — que es
 *    exactamente lo que DD-36 existe para impedir.
 *
 * MUERDE EN LAS DOS DIRECCIONES: una entrada de `DELIBERADAS` o del trinquete que ya
 * no corresponde a nada real también es roja. Una excepción caducada miente sobre lo
 * que falta.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «declarado en N hogares» → deja UNA declaración, en la hoja compartida
 *     (`styles/_forms.scss`), con los valores de la referencia. Si las dos pantallas
 *     necesitan de verdad medidas distintas, es una divergencia deliberada: dale su
 *     entrada en DELIBERADAS con el motivo, o un nombre propio a la que se desvía.
 *   · «caja a mano» → usa `<sc-section-card>`. Si esa pantalla no puede, entra al
 *     trinquete con su motivo.
 *   · «no sangra su contenido» → envuélvelo en `.sub-section`.
 *   · «entrada muerta» → bórrala. Eso es el trinquete avanzando.
 *
 * ES ESTÁTICO y PURO respecto al texto (funciones exportadas → testeable).
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

/** La hoja de la que se LEE el canon. Es la de las tres pantallas de referencia. */
export const HOJA_REFERENCIA =
  'projects/supervisor/src/app/features/config/aed/aed-defaults-page.component.scss';

/** La hoja compartida donde debe vivir el vocabulario de formulario. */
export const HOJA_COMPARTIDA = 'projects/supervisor/src/styles/_forms.scss';

/**
 * Los nombres que forman el vocabulario de dentro de la pantalla. Son los que Rafa
 * enumeró el 2026-09-10 al pedir el barrido: la caja, la sangría del contenido, el
 * ritmo entre secciones, las filas de dos columnas, el campo numérico con la etiqueta
 * al lado y las filas-banda.
 *
 * Un nombre entra aquí cuando lo usan DOS pantallas o más. Uno que solo usa una
 * pantalla es suyo y no hay nada que unificar.
 */
export const VOCABULARIO = [
  /* El chip de canal, entrado el 2026-09-12 al unificarlo. Cumple el criterio de
   * abajo (dos pantallas lo usan) y entra por algo más que simetría: las dos
   * copias no diferían en el estilo, diferían en el SIGNIFICADO — en una el chip
   * relleno era el canal apagado y en la otra el encendido. Registrarlo aquí es
   * lo que impide que vuelvan a separarse sin que nadie lo vea. */
  '.channel-chips',
  '.channel-chip',
  '.channel-chip__icon',
  '.grid',
  '.grid--2',
  '.field',
  '.field__label',
  '.field__hint',
  '.field__help',
  '.sub-section',
  '.sub-section__title',
  '.inline-field',
  '.radio-row',
  '.radio',
  '.switch-field',
  '.checkbox-row',
];

/**
 * Divergencias DELIBERADAS: mismo nombre, medidas distintas a propósito. Cada una
 * lleva el motivo y, si lo tiene, el DD que la respalda.
 *
 * Formato: '<nombre> @ <hoja>' → motivo.
 *
 * Entrada muerta (la hoja ya no declara ese nombre) = rojo: una excepción caducada
 * miente sobre lo que falta.
 */
export const DELIBERADAS = {};

/**
 * Cajas a mano que todavía no son `sc-section-card`, con su motivo. TRINQUETE por
 * conteo: la lista solo puede menguar.
 */
export const CAJAS_A_MANO = {
  'projects/supervisor/src/app/features/memory/pages/rule-builder/rule-builder-page.component.scss': 1,
};

/** Por qué sigue cada una en la lista de arriba. Sin motivo escrito no entra nadie. */
export const CAJAS_A_MANO_MOTIVO = {
  'projects/supervisor/src/app/features/memory/pages/rule-builder/rule-builder-page.component.scss':
    'DD-65 · la CAJA ya mide como el maestro (padding 24.5, cabecera→cuerpo 16, radio 12); lo ' +
    'que queda a mano es la CABECERA, que lleva un control de estado a la derecha del título y ' +
    'una descripción de frase entera debajo. `sc-section-card` no proyecta nada a la derecha y ' +
    'pone su pista EN LÍNEA. Dárselas por un solo consumidor sería deformar el DS; entra al DS ' +
    'cuando una segunda pantalla lo pida.',
};

/* ── parser ────────────────────────────────────────────────────────────────── */

/** Quita comentarios de bloque y de línea, sin tocar el contenido de las cadenas. */
export function sinComentarios(scss) {
  return scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
}

/**
 * Aplana el anidamiento SCSS a un mapa `selector plano → { propiedad: valor }`.
 *
 * Resuelve `&__label` / `&--2` pegando el sufijo al padre, que es como se escribe el
 * vocabulario en este repo. Un `&` seguido de espacio, `:` o `>` (`& + &`,
 * `&:hover`, `& > sc-icon`) NO produce un nombre de vocabulario, así que esas ramas se
 * recorren pero su selector se marca como derivado y no se compara.
 *
 * Las @-reglas (`@media`, `@keyframes`) se recorren SIN cambiar el selector padre: sus
 * declaraciones son condicionales y comparar un valor de dentro con uno de fuera es
 * comparar dos cosas distintas. Se anotan aparte.
 */
export function aplanar(scss) {
  const texto = sinComentarios(scss);
  const reglas = new Map();
  const pila = [];
  let buffer = '';
  let enMedia = 0;

  const registrar = (selector, cuerpo) => {
    if (!selector || enMedia > 0) return;
    /* Un selector compuesto (`&__label, &__label-inline`) declara el MISMO cuerpo para
     * cada uno de sus nombres. Registrarlos por separado es lo que hace visible que
     * `.field__label` vive en dos hojas: escrito en lista, el nombre existe igual. */
    for (const uno of selector.split(' ')) {
      if (!uno) continue;
      const previo = reglas.get(uno) ?? {};
      reglas.set(uno, { ...previo, ...cuerpo });
    }
  };

  const declaracionesDe = (trozo) => {
    const props = {};
    for (const linea of trozo.split(';')) {
      const m = linea.match(/^\s*([a-z-]+)\s*:\s*([^;{}]+)\s*$/i);
      if (!m) continue;
      props[m[1].trim()] = m[2].trim().replace(/\s+/g, ' ');
    }
    return props;
  };

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (c === '{') {
      const cabecera = buffer.trim();
      buffer = '';
      if (cabecera.startsWith('@')) {
        enMedia += 1;
        pila.push({ selector: pila.at(-1)?.selector ?? '', esMedia: true });
        continue;
      }
      const padre = pila.at(-1)?.selector ?? '';
      pila.push({ selector: componer(padre, cabecera), esMedia: false });
    } else if (c === '}') {
      const marco = pila.pop();
      if (marco?.esMedia) enMedia -= 1;
      else registrar(marco?.selector, declaracionesDe(buffer));
      buffer = '';
    } else if (c === ';') {
      const marco = pila.at(-1);
      if (marco && !marco.esMedia) registrar(marco.selector, declaracionesDe(buffer + ';'));
      buffer = '';
    } else {
      buffer += c;
    }
  }
  return reglas;
}

/**
 * Compone el selector plano de un hijo a partir del padre. Devuelve '' cuando la rama
 * no produce un nombre de vocabulario (pseudo-clases, combinadores, listas).
 */
export function componer(padre, cabecera) {
  /* Una LISTA declara el mismo cuerpo para cada nombre: se resuelve cada rama y se
   * devuelven todas separadas por espacio, que es como las lee `registrar`. */
  const partes = cabecera.split(',').map((p) => p.trim()).filter(Boolean);
  if (partes.length > 1) {
    return partes
      .map((p) => componer(padre, p))
      .filter(Boolean)
      .join(' ');
  }
  const bruto = partes[0] ?? '';
  if (/^&\s*[+~>:]/.test(bruto) || /^&\s+/.test(bruto)) return '';
  if (bruto.startsWith('&')) {
    const sufijo = bruto.slice(1).trim();
    if (!/^(__|--)[a-z0-9-]+$/i.test(sufijo)) return '';
    return padre + sufijo;
  }
  if (/^\.[a-z0-9_-]+$/i.test(bruto)) return bruto;
  return '';
}

/**
 * El CONTRATO de `surface="card"`: quien la usa tiene que sangrar su contenido.
 *
 * La caja `card` sangra 12.25 el primer hijo de su cabecera (el `Header` 393:12588 se lo pone a
 * sí mismo dentro del `Block`), así que el contenido tiene que llevar la MISMA sangría o el
 * título queda 12.25 a la derecha de todo lo demás. Esa sangría la pone `.sub-section`.
 *
 * Es un contrato que solo conocían las tres pantallas de `config/aed`, porque eran las únicas
 * que habían usado la caja. Al pasar `sistema-page` al componente (2026-09-10) me lo salté: sus
 * cinco cards medían EXACTAS —radio, borde, paddings, todo verde— y aun así el título salía a
 * 37.75 del filo con el contenido a 25.5. Medir la caja no basta: hay que medir la RELACIÓN
 * entre la caja y lo que proyecta dentro.
 *
 * Lo cazó una captura + una medición, no el verde de la caja. Esto es esa medición, hecha
 * máquina.
 */
export function usaCajaCard(html) {
  return /surface\s*=\s*"card"/.test(sinComentariosHtml(html));
}

/** ¿Sangra su contenido con `.sub-section`, que es lo que casa con la cabecera? */
export function sangraContenido(html) {
  return /class\s*=\s*"[^"]*\bsub-section\b/.test(sinComentariosHtml(html));
}

const sinComentariosHtml = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** Solo los nombres del vocabulario que una hoja DECLARA (con al menos una propiedad). */
export function vocabularioDe(scss) {
  const reglas = aplanar(scss);
  const encontrados = new Map();
  for (const nombre of VOCABULARIO) {
    const props = reglas.get(nombre);
    if (props && Object.keys(props).length) encontrados.set(nombre, props);
  }
  return encontrados;
}

/** Diferencias propiedad a propiedad entre dos cuerpos. */
export function diferencias(referencia, otro) {
  const claves = [...new Set([...Object.keys(referencia), ...Object.keys(otro)])].sort();
  const filas = [];
  for (const clave of claves) {
    const a = referencia[clave];
    const b = otro[clave];
    if (a === b) continue;
    filas.push({ propiedad: clave, referencia: a ?? '—', otro: b ?? '—' });
  }
  return filas;
}

/* ── cajas a mano ──────────────────────────────────────────────────────────── */

/**
 * Dónde se mira lo de la caja: hojas de PÁGINA y de SECCIÓN de página. Un panel
 * lateral, un modal, una tabla o una fila de lista son MUEBLES distintos y su caja es
 * suya con razón — `sc-section-card` es la caja de "una sección de campos", no la de
 * todo lo que tiene borde. Mirarlo todo convertía el gate en ruido: la primera pasada
 * marcó ocho hojas y cinco eran paneles y tablas.
 */
export function esHojaDePantalla(ruta) {
  return /-page\.component\.scss$/.test(ruta) || /\/sections\/[^/]+\.component\.scss$/.test(ruta);
}

/**
 * Una regla pinta una CAJA cuando declara fondo, borde y radio a la vez: es
 * exactamente lo que `sc-section-card` ya hace. Se ignoran las que no son de nivel de
 * sección (radios pequeños: chips, pastillas, campos).
 */
export function cajasAMano(scss) {
  const reglas = aplanar(scss);
  const cajas = [];
  for (const [selector, props] of reglas) {
    const fondo = props['background'] ?? props['background-color'];
    const borde = props['border'];
    const radio = props['border-radius'];
    if (!fondo || !borde || !radio) continue;
    if (!/(^|-)(card|panel|box|section)$/i.test(selector.replace(/^\./, ''))) continue;
    if (borde === '0' || borde === 'none') continue;
    cajas.push({ selector, radio });
  }
  return cajas;
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-screen-vocabulary.mjs')) {
  const hojas = sh(
    "find projects/supervisor/src/app projects/supervisor/src/styles " +
      "-name '*.scss' -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean)
    .sort();

  if (!hojas.length) {
    log('✗ audit:screen-vocabulary: no encuentro hojas — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  let canon;
  try {
    canon = vocabularioDe(readFileSync(HOJA_REFERENCIA, 'utf8'));
  } catch {
    log(`✗ audit:screen-vocabulary: no puedo leer la hoja de referencia ${HOJA_REFERENCIA}.`);
    log('      → el canon se LEE de ahí; si la hoja se movió, actualiza HOJA_REFERENCIA.');
    process.exit(1);
  }

  /* nombre → [{ hoja, props }] */
  const hogares = new Map();
  const cajas = {};
  for (const hoja of hojas) {
    const scss = readFileSync(hoja, 'utf8');
    for (const [nombre, props] of vocabularioDe(scss)) {
      if (!hogares.has(nombre)) hogares.set(nombre, []);
      hogares.get(nombre).push({ hoja, props });
    }
    if (esHojaDePantalla(hoja)) {
      const propias = cajasAMano(scss);
      if (propias.length) cajas[hoja] = propias.length;
    }
  }

  const problemas = [];
  const vistas = new Set();

  for (const [nombre, sitios] of [...hogares].sort()) {
    if (sitios.length < 2) continue;
    /* El patrón que manda es el de la hoja de REFERENCIA; si ella no declara ese
     * nombre, manda la hoja COMPARTIDA. Si tampoco, no hay canon que oponer y el
     * informe lo dice en vez de ascender a referencia la primera hoja que salga. */
    const canonico =
      sitios.find((s) => s.hoja === HOJA_REFERENCIA) ??
      sitios.find((s) => s.hoja === HOJA_COMPARTIDA);
    const patron = canonico ?? sitios[0];
    const rotulo = canonico ? 'referencia' : 'sin canon (ninguna de las dos hojas lo declara)';
    for (const sitio of sitios) {
      if (sitio === patron) continue;
      const clave = `${nombre} @ ${sitio.hoja}`;
      vistas.add(clave);
      if (clave in DELIBERADAS) continue;
      const filas = diferencias(patron.props, sitio.props);
      const detalle = filas.length
        ? filas.map((f) => `          ${f.propiedad}: ${f.referencia}  ≠  ${f.otro}`).join('\n')
        : '          (mismos valores — la duplicación es la que sobra)';
      problemas.push([
        `${nombre}: declarado en ${sitios.length} hogares.`,
        `      ${rotulo}: ${patron.hoja}\n      también en: ${sitio.hoja}\n${detalle}\n` +
          '      → deja UNA declaración en styles/_forms.scss con los valores de la referencia,\n' +
          '        o dale su entrada en DELIBERADAS con el motivo (DD-36), o un nombre propio.',
      ]);
    }
  }

  for (const [clave, motivo] of Object.entries(DELIBERADAS)) {
    if (!vistas.has(clave)) {
      problemas.push([
        `${clave}: DELIBERADAS la cita ("${motivo}") pero ya no hay tal divergencia.`,
        '      → quita su entrada. Una excepción caducada miente sobre lo que falta.',
      ]);
    }
  }

  /* CONTRATO de `surface="card"`: quien la usa sangra su contenido (ver `usaCajaCard`). */
  const plantillas = sh(
    "find projects/supervisor/src/app -name '*.component.html' -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean)
    .sort();
  for (const ruta of plantillas) {
    const html = readFileSync(ruta, 'utf8');
    if (!usaCajaCard(html) || sangraContenido(html)) continue;
    problemas.push([
      `${ruta}: usa \`surface="card"\` y NO sangra su contenido.`,
      '      → envuelve el contenido de la card en `.sub-section`. La cabecera de esa caja se\n' +
        '        sangra 12.25 a sí misma; sin la misma sangría en el contenido, el título queda\n' +
        '        12.25 a la derecha de todo lo demás (medido: 37.75 contra 25.5).',
    ]);
  }

  const { chequearTrinquete } = await import('./audit-screen-hygiene.mjs');
  problemas.push(
    ...chequearTrinquete(
      cajas,
      CAJAS_A_MANO,
      'caja a mano (fondo + borde + radio)',
      'usa `<sc-section-card>`; la caja de sección es del DS, no de la pantalla.',
    ),
  );

  /* Una entrada del trinquete SIN motivo escrito es una divergencia anónima, y una
   * divergencia anónima la borra la siguiente pasada de uniformar creyendo que es un
   * descuido — o peor, se queda para siempre porque nadie sabe si puede tocarla. Es lo que
   * DD-36 existe para impedir, aplicado aquí. Muerde en las dos direcciones. */
  for (const ruta of Object.keys(CAJAS_A_MANO)) {
    if (!CAJAS_A_MANO_MOTIVO[ruta]) {
      problemas.push([
        `${ruta}: está en el trinquete de cajas a mano SIN motivo escrito.`,
        '      → añade su entrada en CAJAS_A_MANO_MOTIVO diciendo por qué esa caja no puede\n' +
          '        ser `sc-section-card` todavía, o conviértela.',
      ]);
    }
  }
  for (const ruta of Object.keys(CAJAS_A_MANO_MOTIVO)) {
    if (!(ruta in CAJAS_A_MANO)) {
      problemas.push([
        `${ruta}: CAJAS_A_MANO_MOTIVO lo cita pero ya no está en el trinquete.`,
        '      → quita su motivo. Un motivo huérfano miente sobre lo que falta.',
      ]);
    }
  }

  /* Un nombre del VOCABULARIO que ya no declara NADIE es una entrada muerta de la lista:
   * el gate cree vigilar algo que no existe. Pasa al retirar una clase del repo y olvidar
   * la lista, y no se nota nunca porque «cero hogares» no es «dos hogares». */
  const huerfanos = VOCABULARIO.filter((n) => !hogares.has(n));
  if (huerfanos.length) {
    problemas.push([
      `VOCABULARIO cita ${huerfanos.length} nombre(s) que ya no declara ninguna hoja: ${huerfanos.join(', ')}.`,
      '      → quítalos de VOCABULARIO. Un nombre que no existe no se puede desviar,\n' +
        '        y tenerlo ahí hace creer que está vigilado.',
    ]);
  }

  const compartidos = [...hogares].filter(([, s]) => s.length > 1).length;
  /* El canon se reparte entre las DOS hojas y va migrando: lo que usan varias pantallas
   * acaba en la compartida, y en la de referencia se queda lo que es solo de AED. Por eso
   * el resumen cuenta las dos — ver solo la de referencia menguar da la impresión falsa de
   * que el canon se está perdiendo. */
  const enCompartida = vocabularioDe(readFileSync(HOJA_COMPARTIDA, 'utf8')).size;
  log(
    `audit:screen-vocabulary — ${hojas.length} hoja(s) · canon: ${enCompartida} nombre(s) en la ` +
      `hoja compartida + ${canon.size} propios de la referencia · ${compartidos} con más de un ` +
      `hogar · trinquete de cajas a mano: ${Object.keys(CAJAS_A_MANO).length}\n`,
  );

  if (!problemas.length) {
    log(
      '✓ audit:screen-vocabulary OK — un nombre, un hogar; y la caja de sección la pone el DS.',
    );
    process.exit(0);
  }

  log('✗ audit:screen-vocabulary — vocabulario de pantalla:');
  for (const [linea, fix] of problemas) {
    log(`  · ${linea}`);
    log(fix);
  }
  process.exit(1);
}
