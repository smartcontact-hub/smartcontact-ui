// @ts-check
/**
 * Los horarios de atención, sin Angular: qué franjas valen un día concreto y por qué. Puro para probarlo con node:test
 * (`scripts/__tests__/horarios.test.mjs`); lo usan el almacén (`horarios.store.ts`), su listado y su editor.
 *
 * QUÉ ES UN HORARIO. Una semana habitual (de lunes a domingo, con sus franjas), unos periodos (una temporada con su
 * propia semana: «Verano, del 1 de junio al 31 de agosto») y unas fechas especiales (un día con sus propias horas, o
 * cerrado). Además puede aplicar calendarios de festivos, que son listas de días cerrados compartidas entre horarios.
 *
 * CADA FECHA TIENE UN ÚNICO DUEÑO, y se busca en este orden: fecha especial propia › festivo aplicado › periodo ›
 * semana habitual. No hay prioridades numéricas: dos periodos no pueden compartir fechas (`validarPeriodo`).
 *
 * LAS FRANJAS son pares de minutos desde las 00:00, `[inicio, fin]`. Un fin menor o igual que el inicio cruza la
 * medianoche («23:00–07:00» es `[1380, 420]`) y pertenece al día en que empieza: su tramo de madrugada vale al día
 * siguiente salvo que ese día sea una fecha especial o un festivo, que sustituyen la fecha entera. «Todo el día» es
 * `[0, 1440]`.
 *
 * Las fechas son cadenas ISO (`2026-12-24`) y toda la aritmética va en UTC: aquí un día es una casilla del
 * calendario, no un instante.
 */

const DIA = 86_400_000;
export const MINUTOS_DEL_DIA = 1440;

/** Los colores que puede llevar un periodo: los de etiqueta del sistema, menos el gris (que es «cerrado»). */
export const COLORES_DE_PERIODO = ['blue', 'green', 'purple', 'orange', 'teal', 'amber', 'red', 'brown'];

/* ── Horas ──────────────────────────────────────────────────────────────────────────────────────────────────────── */

/** «09:30» → 570. `null` si no es una hora; «24:00» vale como fin de día. */
export function minutosDe(texto) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(texto ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24 || (h === 24 && min !== 0)) return null;
  return h * 60 + min;
}

/** 570 → «09:30»; 1440 → «24:00». */
export function horaDe(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** ¿La franja acaba al día siguiente? */
export function cruzaMedianoche(franja) {
  return franja[1] <= franja[0];
}

/** «09:00–18:00»; la que cruza la medianoche se escribe igual: quien la pinta añade «día siguiente». */
export function textoDeFranja(franja) {
  return `${horaDe(franja[0])}–${horaDe(franja[1])}`;
}

/* ── Fechas ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

export function fechaValida(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

const instante = (iso) => Date.parse(`${iso}T00:00:00.000Z`);

export function sumarDias(iso, n) {
  return new Date(instante(iso) + n * DIA).toISOString().slice(0, 10);
}

/** El día de la semana, con el lunes en 0. */
export function diaDeLaSemana(iso) {
  return (new Date(instante(iso)).getUTCDay() + 6) % 7;
}

export function fechasEntre(desde, hasta) {
  const out = [];
  for (let t = instante(desde); t <= instante(hasta); t += DIA) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

/** Los doce meses de un año, cada uno con sus fechas y los huecos que deja antes del día 1 (lunes primero). */
export function rejillaDelAnio(anio) {
  return Array.from({ length: 12 }, (_, mes) => {
    const primero = `${String(anio).padStart(4, '0')}-${String(mes + 1).padStart(2, '0')}-01`;
    const dias = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    return { mes, huecos: diaDeLaSemana(primero), fechas: Array.from({ length: dias }, (_, i) => sumarDias(primero, i)) };
  });
}

/** La fecha y la hora que son ahora en una zona horaria: lo que hay que preguntarle al horario. */
export function ahoraEn(zona, cuando = new Date()) {
  let partes;
  try {
    partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: zona || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(cuando);
  } catch {
    return ahoraEn('UTC', cuando);
  }
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

/* ── De quién es un día ─────────────────────────────────────────────────────────────────────────────────────────── */

/** ¿El periodo cubre esa fecha? Uno que se repite puede cruzar el fin de año («del 1 de octubre al 31 de mayo»). */
export function periodoCubre(periodo, iso) {
  if (periodo.year !== null && periodo.year !== undefined && Number(iso.slice(0, 4)) !== periodo.year) return false;
  const md = iso.slice(5);
  return periodo.from <= periodo.to ? md >= periodo.from && md <= periodo.to : md >= periodo.from || md <= periodo.to;
}

/** La entrada de una lista de días (fechas especiales o festivos) que cae en esa fecha: la de ese año antes que la anual. */
function entradaDe(dias, iso) {
  const lista = dias ?? [];
  return lista.find((d) => !d.yearly && d.date === iso) ?? lista.find((d) => d.yearly && d.date.slice(5) === iso.slice(5)) ?? null;
}

/** Los calendarios de festivos que aplica el horario, sin los inactivos. */
function aplicados(horario, calendarios) {
  const ids = new Set(horario.holidayCalendarIds ?? []);
  return (calendarios ?? []).filter((c) => ids.has(c.id) && c.status !== 'inactive');
}

/**
 * De quién es la fecha y qué franjas le pone, sin contar lo que venga de la víspera.
 * `tipo`: 'especial' | 'festivo' | 'periodo' | 'semana'.
 */
export function duenoDe(horario, iso, calendarios = []) {
  const especial = entradaDe(horario.specials, iso);
  if (especial) return { tipo: 'especial', especial, festivo: null, calendario: null, periodo: null, franjas: especial.slots ?? [] };
  for (const calendario of aplicados(horario, calendarios)) {
    const festivo = entradaDe(calendario.days, iso);
    if (festivo) return { tipo: 'festivo', especial: null, festivo, calendario, periodo: null, franjas: [] };
  }
  const dia = diaDeLaSemana(iso);
  const periodo = (horario.periods ?? []).find((p) => periodoCubre(p, iso)) ?? null;
  if (periodo) return { tipo: 'periodo', especial: null, festivo: null, calendario: null, periodo, franjas: periodo.week?.[dia] ?? [] };
  return { tipo: 'semana', especial: null, festivo: null, calendario: null, periodo: null, franjas: horario.week?.[dia] ?? [] };
}

/** Une tramos que se tocan o se pisan; los devuelve ordenados. */
function unir(tramos) {
  const orden = tramos.filter(([a, b]) => b > a).map(([a, b]) => [a, b]).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const t of orden) {
    const ultimo = out[out.length - 1];
    if (ultimo && t[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], t[1]);
    else out.push(t);
  }
  return out;
}

/**
 * Lo que vale una fecha: su dueño y sus tramos abiertos dentro del día (de 0 a 1440, unidos). `arrastre` dice si
 * parte viene de una franja que empezó la víspera.
 */
export function resolverDia(horario, iso, calendarios = []) {
  const dueno = duenoDe(horario, iso, calendarios);
  const tramos = dueno.franjas.map((f) => (cruzaMedianoche(f) ? [f[0], MINUTOS_DEL_DIA] : [f[0], f[1]]));
  let arrastre = false;
  // Una fecha especial o un festivo sustituyen la fecha entera: lo que viniera de la víspera se corta a las 00:00.
  if (dueno.tipo !== 'especial' && dueno.tipo !== 'festivo') {
    for (const f of duenoDe(horario, sumarDias(iso, -1), calendarios).franjas) {
      if (cruzaMedianoche(f) && f[1] > 0) {
        tramos.push([0, f[1]]);
        arrastre = true;
      }
    }
  }
  const abiertos = unir(tramos);
  return { fecha: iso, ...dueno, tramos: abiertos, arrastre, minutosAbiertos: abiertos.reduce((n, [a, b]) => n + b - a, 0) };
}

/** ¿Se atiende en esa fecha a esa hora? El inicio cuenta y el fin no: a la hora exacta de cierre ya está cerrado. */
export function abiertoEn(horario, iso, minutos, calendarios = []) {
  return resolverDia(horario, iso, calendarios).tramos.some(([a, b]) => minutos >= a && minutos < b);
}

/**
 * Cómo está ahora y cuándo cambia: `{ abierto, cambia: { fecha, minutos } | null }`. Mira dos semanas hacia delante;
 * `cambia` es `null` si en ese tiempo no cambia (un 24/7, o un horario sin ninguna franja).
 */
export function estadoEn(horario, iso, minutos, calendarios = []) {
  const HORIZONTE = 15;
  const absolutos = [];
  for (let i = 0; i < HORIZONTE; i++) {
    for (const [a, b] of resolverDia(horario, sumarDias(iso, i), calendarios).tramos) absolutos.push([i * MINUTOS_DEL_DIA + a, i * MINUTOS_DEL_DIA + b]);
  }
  const tramos = unir(absolutos);
  const fin = HORIZONTE * MINUTOS_DEL_DIA;
  const punto = (abs) => (abs >= fin ? null : { fecha: sumarDias(iso, Math.floor(abs / MINUTOS_DEL_DIA)), minutos: abs % MINUTOS_DEL_DIA });
  const actual = tramos.find(([a, b]) => minutos >= a && minutos < b);
  if (actual) return { abierto: true, cambia: punto(actual[1]) };
  const siguiente = tramos.find(([a]) => a > minutos);
  return { abierto: false, cambia: siguiente ? punto(siguiente[0]) : null };
}

/* ── Resúmenes ──────────────────────────────────────────────────────────────────────────────────────────────────── */

const mismasFranjas = (a, b) => a.length === b.length && a.every((f, i) => f[0] === b[i][0] && f[1] === b[i][1]);

/** La semana en grupos de días seguidos con las mismas franjas: `[{ desde, hasta, franjas }]`. Los cerrados no salen. */
export function gruposDeLaSemana(semana) {
  const grupos = [];
  for (let dia = 0; dia < 7; dia++) {
    const franjas = semana?.[dia] ?? [];
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.hasta === dia - 1 && mismasFranjas(ultimo.franjas, franjas)) ultimo.hasta = dia;
    else grupos.push({ desde: dia, hasta: dia, franjas });
  }
  return grupos.filter((g) => g.franjas.length > 0);
}

/**
 * La semana en una línea: «L–J 09:00–18:00; V 09:00–15:00» (sin punto medio, DD-183). `dias` son los siete nombres cortos; `cerrado`, lo que
 * dice una semana sin ninguna franja; `siempre`, lo que dice un 24/7.
 */
export function resumenDeLaSemana(semana, dias, cerrado, siempre) {
  const grupos = gruposDeLaSemana(semana);
  if (grupos.length === 0) return cerrado;
  if (grupos.length === 1 && grupos[0].desde === 0 && grupos[0].hasta === 6 && mismasFranjas(grupos[0].franjas, [[0, MINUTOS_DEL_DIA]])) return siempre;
  return grupos
    .map((g) => `${g.desde === g.hasta ? dias[g.desde] : `${dias[g.desde]}–${dias[g.hasta]}`} ${g.franjas.map(textoDeFranja).join(', ')}`)
    .join('; ');
}

/** Cuántos días de un año son de cada dueño: la semana habitual, cada periodo, los festivos y las fechas especiales. */
export function coberturaAnual(horario, anio, calendarios = []) {
  const a = String(anio).padStart(4, '0');
  const cuenta = { total: 0, semana: 0, especiales: 0, festivos: 0, periodos: new Map((horario.periods ?? []).map((p) => [p.id, 0])) };
  for (const iso of fechasEntre(`${a}-01-01`, `${a}-12-31`)) {
    const d = duenoDe(horario, iso, calendarios);
    cuenta.total++;
    if (d.tipo === 'especial') cuenta.especiales++;
    else if (d.tipo === 'festivo') cuenta.festivos++;
    else if (d.tipo === 'periodo') cuenta.periodos.set(d.periodo.id, (cuenta.periodos.get(d.periodo.id) ?? 0) + 1);
    else cuenta.semana++;
  }
  return { ...cuenta, periodos: [...cuenta.periodos].map(([id, dias]) => ({ id, dias })) };
}

/* ── Lo que le falta ────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Qué le pasa a las franjas de un día: `null` si valen, o el código de lo primero que falla.
 * 'hora' (falta una hora o no lo es) · 'vacia' (empieza y acaba a la vez) · 'solape' (dos se pisan) ·
 * 'noche' (más de una cruza la medianoche, o la que cruza no es la última).
 */
export function validarFranjas(franjas) {
  for (const f of franjas) {
    if (!Array.isArray(f) || !Number.isInteger(f[0]) || !Number.isInteger(f[1]) || f[0] < 0 || f[0] >= MINUTOS_DEL_DIA || f[1] < 0 || f[1] > MINUTOS_DEL_DIA) return 'hora';
    if (f[0] === f[1]) return 'vacia';
  }
  const orden = [...franjas].sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < orden.length; i++) {
    if (cruzaMedianoche(orden[i]) && i !== orden.length - 1) return 'noche';
    if (i > 0 && orden[i][0] < orden[i - 1][1]) return 'solape';
  }
  return null;
}

/**
 * Qué le pasa a una semana: `null` o `{ dia, codigo }` del primer día que falla. Además de lo de cada día, una
 * franja que acaba de madrugada no puede pisar la primera del día siguiente ('pisa_siguiente').
 */
export function validarSemana(semana) {
  for (let dia = 0; dia < 7; dia++) {
    const franjas = semana?.[dia] ?? [];
    const codigo = validarFranjas(franjas);
    if (codigo) return { dia, codigo };
    const nocturna = franjas.find(cruzaMedianoche);
    if (nocturna) {
      const siguiente = semana?.[(dia + 1) % 7] ?? [];
      if (siguiente.some((f) => f[0] < nocturna[1])) return { dia, codigo: 'pisa_siguiente' };
    }
  }
  return null;
}

const MES_DIA = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** ¿Comparten alguna fecha dos periodos? Se mira día a día en el año que toque (uno bisiesto si los dos se repiten). */
export function periodosSeSolapan(a, b) {
  const fijoA = a.year ?? null;
  const fijoB = b.year ?? null;
  if (fijoA !== null && fijoB !== null && fijoA !== fijoB) return false;
  const anio = String(fijoA ?? fijoB ?? 2024).padStart(4, '0');
  return fechasEntre(`${anio}-01-01`, `${anio}-12-31`).some((iso) => periodoCubre(a, iso) && periodoCubre(b, iso));
}

/**
 * Qué le falta a un periodo para guardarse en ese horario: `null` o `{ codigo, con? }`.
 * 'nombre' · 'fechas' · 'cruza_anio' (uno de un solo año no puede acabar antes de empezar) ·
 * 'solape' (con `con`, el periodo con el que comparte fechas) · 'semana' (con `dia` y el código de `validarSemana`).
 */
export function validarPeriodo(horario, periodo) {
  if (!String(periodo.name ?? '').trim()) return { codigo: 'nombre' };
  if (!MES_DIA.test(periodo.from ?? '') || !MES_DIA.test(periodo.to ?? '')) return { codigo: 'fechas' };
  if ((periodo.year ?? null) !== null && periodo.from > periodo.to) return { codigo: 'cruza_anio' };
  const choque = (horario.periods ?? []).find((p) => p.id !== periodo.id && periodosSeSolapan(p, periodo));
  if (choque) return { codigo: 'solape', con: choque };
  const semana = validarSemana(periodo.week);
  if (semana) return { codigo: 'semana', dia: semana.dia, detalle: semana.codigo };
  return null;
}

/** La entrada de la lista que ya ocupa esa misma fecha (misma fecha del mismo año, o el mismo día de cada año). */
export function diaRepetido(dias, dia) {
  return (
    (dias ?? []).find(
      (d) => d.id !== dia.id && !!d.yearly === !!dia.yearly && (dia.yearly ? d.date.slice(5) === dia.date.slice(5) : d.date === dia.date),
    ) ?? null
  );
}

/* ── Lo guardado con la forma de antes ──────────────────────────────────────────────────────────────────────────── */

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * La semana de un horario de cuando era un texto («L-V 09:00–18:00», «L-D 23:00–07:00», «S-D 10:00–14:00»).
 * Lo que no se entiende queda cerrado: se corrige en el editor.
 */
export function semanaDeTexto(texto) {
  const semana = Array.from({ length: 7 }, () => []);
  const m = /^\s*([LMXJVSD])(?:\s*[-–]\s*([LMXJVSD]))?\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*$/i.exec(String(texto ?? ''));
  if (!m) return semana;
  const desde = LETRAS.indexOf(m[1].toUpperCase());
  const hasta = m[2] ? LETRAS.indexOf(m[2].toUpperCase()) : desde;
  const inicio = minutosDe(m[3]);
  let fin = minutosDe(m[4]);
  if (inicio === null || fin === null || desde > hasta) return semana;
  if (inicio === 0 && fin === MINUTOS_DEL_DIA - 1) fin = MINUTOS_DEL_DIA;
  if (inicio === fin || inicio >= MINUTOS_DEL_DIA) return semana;
  for (let d = desde; d <= hasta; d++) semana[d] = [[inicio, fin]];
  return semana;
}

const semanaLimpia = (semana) =>
  Array.from({ length: 7 }, (_, d) => (Array.isArray(semana?.[d]) ? semana[d].filter((f) => Array.isArray(f) && f.length === 2).map((f) => [f[0], f[1]]) : []));

/** Un horario con todos sus campos, venga con la forma de ahora o con la de antes (`schedule`, un texto). */
export function normalizarHorario(crudo) {
  const { schedule, ...resto } = crudo ?? {};
  return {
    ...resto,
    name: resto.name ?? '',
    timezone: resto.timezone || 'Europe/Madrid',
    description: resto.description ?? '',
    status: resto.status ?? 'active',
    week: Array.isArray(resto.week) ? semanaLimpia(resto.week) : semanaDeTexto(schedule),
    periods: (Array.isArray(resto.periods) ? resto.periods : []).map((p) => ({ ...p, year: p.year ?? null, week: semanaLimpia(p.week) })),
    specials: (Array.isArray(resto.specials) ? resto.specials : []).map((s) => ({ ...s, yearly: !!s.yearly, slots: Array.isArray(s.slots) ? s.slots : [] })),
    holidayCalendarIds: Array.isArray(resto.holidayCalendarIds) ? resto.holidayCalendarIds : [],
  };
}

/** El siguiente identificador libre de una lista de cosas con `id` numérico. */
export function siguienteId(lista) {
  return (lista ?? []).reduce((max, x) => Math.max(max, x.id), 0) + 1;
}
