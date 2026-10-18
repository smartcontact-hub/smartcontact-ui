/**
 * Color de atención · los datos del estudio (propuesta, sin aplicar).
 *
 * Las cifras se midieron el 2026-10-18 con Playwright sobre el build del Supervisor (`main` en e359910f): cada color se
 * leyó de las primitivas `--sc-color-*` del tema, en claro y en oscuro. Contraste WCAG 2.x (luminancia relativa) y APCA
 * 0.0.98G; tono y viveza en OKLCH; daltonismo con las matrices de Machado (2009, severidad 1) y la distancia en OKLab.
 * Son de esa fecha: si cambia la paleta del Kit, hay que volver a medir. La muestra en vivo de la página sí se mide sola.
 */

/** Un paso de la paleta del Kit: `<familia>-<paso>`, que la página pinta como `var(--sc-color-<paso>)`. */
export type PasoPaleta = string;

export interface ParColor {
  readonly fondo: PasoPaleta;
  /** El tono al pasar el ratón y al pulsar. Siguen la regla del primario de hoy: más oscuro en claro, más claro en oscuro. */
  readonly pasar: PasoPaleta;
  readonly pulsar: PasoPaleta;
  readonly texto: PasoPaleta;
}

export interface MedidaTema {
  /** Texto del botón sobre su fondo (WCAG). */
  readonly texto: number;
  /** APCA (Lc) del mismo par. */
  readonly apca: number;
  /** El fondo del botón contra el lienzo de la página (WCAG): cuánto se separa el botón del fondo. */
  readonly pagina: number;
}

export type Veredicto = 'recomendable' | 'matices' | 'descartado' | 'hoy';

export interface Candidato {
  readonly id: string;
  readonly nombre: string;
  readonly claro: ParColor;
  readonly oscuro: ParColor;
  /** El paso que haría de texto de acento (enlace, frase destacada, foco): el del botón si llega a 4,5 sobre la página. */
  readonly acento: { readonly claro: PasoPaleta; readonly oscuro: PasoPaleta };
  readonly medidas: { readonly claro: MedidaTema; readonly oscuro: MedidaTema };
  /** Croma OKLCH del fondo en claro: cuánta «vida» tiene. El marino de hoy, 0,044. */
  readonly viveza: number;
  /** El color de la interfaz más parecido en tono, y a cuántos grados. */
  readonly vecino: string;
  /** Con deuteranopía o protanopía, el estado que más se le parece. */
  readonly daltonismo: { readonly valor: number | null; readonly texto: string };
  readonly veredicto: Veredicto;
  readonly motivo: string;
  /** Hay capturas del Supervisor con este color (alta de agente y nueva regla). */
  readonly capturas: boolean;
}

/**
 * El par más justo que el DS ya acepta: el fondo de éxito contra el de aviso, con protanopía. Por debajo, un candidato
 * se confunde con un estado más de lo que ya se confunden entre sí.
 */
export const DALTONISMO_REFERENCIA = 0.114;

export const CANDIDATOS: readonly Candidato[] = [
  {
    id: 'hoy',
    nombre: 'Marino (hoy)',
    claro: { fondo: 'blue-700', pasar: 'blue-600', pulsar: 'blue-800', texto: 'slate-0' },
    oscuro: { fondo: 'sky-300', pasar: 'sky-200', pulsar: 'sky-100', texto: 'zinc-900' },
    acento: { claro: 'violet-700', oscuro: 'violet-400' },
    medidas: { claro: { texto: 14.96, apca: 104.6, pagina: 14.96 }, oscuro: { texto: 8.24, apca: 60.3, pagina: 9.25 } },
    viveza: 0.044,
    vecino: 'El enlace y la marca, mismo tono',
    daltonismo: { valor: 0.213, texto: 'Lejos de los estados' },
    veredicto: 'hoy',
    motivo: 'Pasa de sobra, pero es el marino de los títulos y de la barra lateral: no se lee como «aquí se actúa».',
    capturas: true,
  },
  {
    id: 'azul',
    nombre: 'Azul sky 600',
    claro: { fondo: 'sky-600', pasar: 'sky-700', pulsar: 'sky-800', texto: 'slate-0' },
    oscuro: { fondo: 'sky-300', pasar: 'sky-200', pulsar: 'sky-100', texto: 'zinc-900' },
    acento: { claro: 'sky-600', oscuro: 'sky-400' },
    medidas: { claro: { texto: 6.8, apca: 87.6, pagina: 6.8 }, oscuro: { texto: 8.24, apca: 60.3, pagina: 9.25 } },
    viveza: 0.213,
    vecino: 'Es el enlace (a propósito)',
    daltonismo: { valor: null, texto: 'Igual que el enlace, a propósito' },
    veredicto: 'recomendable',
    motivo:
      'El más vivo de los que pasan. Botón, enlace y foco en el mismo azul, como 8 de 17 sistemas; en oscuro ya es así (DD-81).',
    capturas: true,
  },
  {
    id: 'cian-700',
    nombre: 'Cian 700',
    claro: { fondo: 'cyan-700', pasar: 'cyan-800', pulsar: 'cyan-900', texto: 'slate-0' },
    oscuro: { fondo: 'cyan-300', pasar: 'cyan-200', pulsar: 'cyan-100', texto: 'zinc-900' },
    acento: { claro: 'cyan-700', oscuro: 'cyan-300' },
    medidas: { claro: { texto: 5.64, apca: 83.2, pagina: 5.64 }, oscuro: { texto: 11.69, apca: 78.4, pagina: 13.13 } },
    viveza: 0.077,
    vecino: 'El enlace, a 53°',
    daltonismo: { valor: 0.126, texto: 'Peligro, con protanopía' },
    veredicto: 'recomendable',
    motivo: 'El cian de la barra lateral, oscurecido para que pase con texto blanco. Lejos de marca y estados, pero apagado.',
    capturas: true,
  },
  {
    id: 'teal',
    nombre: 'Teal 700',
    claro: { fondo: 'teal-700', pasar: 'teal-800', pulsar: 'teal-900', texto: 'slate-0' },
    oscuro: { fondo: 'teal-300', pasar: 'teal-200', pulsar: 'teal-100', texto: 'zinc-900' },
    acento: { claro: 'teal-700', oscuro: 'teal-300' },
    medidas: { claro: { texto: 5.47, apca: 82.2, pagina: 5.47 }, oscuro: { texto: 11.98, apca: 79.9, pagina: 13.45 } },
    viveza: 0.086,
    vecino: 'El éxito, a 37°',
    daltonismo: { valor: 0.108, texto: 'Peligro, con protanopía' },
    veredicto: 'matices',
    motivo: 'Pasa en los dos temas y funciona en oscuro, pero está a 37° del verde de éxito: junto a un ✓ puede leerse como «hecho».',
    capturas: true,
  },
  {
    id: 'cian-400',
    nombre: 'Cian 400, texto marino',
    claro: { fondo: 'cyan-400', pasar: 'cyan-300', pulsar: 'cyan-500', texto: 'blue-700' },
    oscuro: { fondo: 'cyan-400', pasar: 'cyan-300', pulsar: 'cyan-500', texto: 'blue-700' },
    acento: { claro: 'cyan-700', oscuro: 'cyan-300' },
    medidas: { claro: { texto: 8.55, apca: 68, pagina: 1.75 }, oscuro: { texto: 8.55, apca: 68, pagina: 11.38 } },
    viveza: 0.115,
    vecino: 'El enlace, a 55°',
    daltonismo: { valor: 0.205, texto: 'Lejos de los estados' },
    veredicto: 'matices',
    motivo:
      'El texto se lee (8,55), pero en claro el botón casi no se separa de la página blanca (1,75), y como texto no pasa: el acento tendría que ser otro cian.',
    capturas: true,
  },
  {
    id: 'verde',
    nombre: 'Verde 700',
    claro: { fondo: 'green-700', pasar: 'green-800', pulsar: 'green-900', texto: 'slate-0' },
    oscuro: { fondo: 'green-400', pasar: 'green-300', pulsar: 'green-200', texto: 'zinc-900' },
    acento: { claro: 'green-700', oscuro: 'green-400' },
    medidas: { claro: { texto: 5.02, apca: 79.6, pagina: 5.02 }, oscuro: { texto: 10.17, apca: 71.1, pagina: 11.42 } },
    viveza: 0.137,
    vecino: 'El éxito, a 1°',
    daltonismo: { valor: 0.086, texto: 'Peligro, con deuteranopía' },
    veredicto: 'descartado',
    motivo: 'Es el verde de «éxito». GitHub lo asume; en el Supervisor el verde ya dice «hecho» en las altas y los estados.',
    capturas: false,
  },
  {
    id: 'naranja',
    nombre: 'Naranja 700',
    claro: { fondo: 'orange-700', pasar: 'orange-800', pulsar: 'orange-900', texto: 'slate-0' },
    oscuro: { fondo: 'orange-400', pasar: 'orange-300', pulsar: 'orange-200', texto: 'zinc-900' },
    acento: { claro: 'orange-700', oscuro: 'orange-400' },
    medidas: { claro: { texto: 5.18, apca: 79.9, pagina: 5.18 }, oscuro: { texto: 7.83, apca: 58.2, pagina: 8.79 } },
    viveza: 0.174,
    vecino: 'El peligro, a 11°',
    daltonismo: { valor: 0.024, texto: 'Peligro, con protanopía' },
    veredicto: 'descartado',
    motivo: 'A 11° del rojo de peligro, y con daltonismo casi igual que él y que el aviso.',
    capturas: false,
  },
  {
    id: 'violeta',
    nombre: 'Violeta 700',
    claro: { fondo: 'violet-700', pasar: 'violet-800', pulsar: 'violet-900', texto: 'slate-0' },
    oscuro: { fondo: 'violet-400', pasar: 'violet-300', pulsar: 'violet-200', texto: 'zinc-900' },
    acento: { claro: 'violet-700', oscuro: 'violet-400' },
    medidas: { claro: { texto: 7.1, apca: 88.3, pagina: 7.1 }, oscuro: { texto: 6.51, apca: 50, pagina: 7.31 } },
    viveza: 0.241,
    vecino: 'El enlace, a 30°',
    daltonismo: { valor: 0.01, texto: 'El enlace, con deuteranopía' },
    veredicto: 'descartado',
    motivo: 'La firma de las interfaces hechas con IA, y con deuteranopía se confunde con el enlace.',
    capturas: false,
  },
];

export const VEREDICTO: Readonly<Record<Veredicto, { readonly label: string; readonly severity: 'success' | 'warn' | 'danger' | 'secondary' }>> = {
  hoy: { label: 'Hoy', severity: 'secondary' },
  recomendable: { label: 'Recomendable', severity: 'success' },
  matices: { label: 'Con matices', severity: 'warn' },
  descartado: { label: 'Descartado', severity: 'danger' },
};

/* ── OTROS SISTEMAS ─────────────────────────────────────────────────────────────────────────────
 * El color del botón principal de cada sistema, leído de sus tokens o su código publicados el 2026-10-18. Linear y
 * Notion no publican sistema: se midió su pantalla de entrada. Intercom y Talkdesk no publican el suyo y no cuentan.
 * Los hex son DATO de otros productos, no color de nuestra interfaz: por eso no son tokens. */
export interface Sistema {
  readonly nombre: string;
  readonly boton: string;
}

export interface Bando {
  readonly id: string;
  readonly titulo: string;
  readonly texto: string;
  readonly sistemas: readonly Sistema[];
  readonly nuestro?: string;
}

export const BANDOS: readonly Bando[] = [
  {
    id: 'azul',
    titulo: 'Azul de interacción',
    texto: 'Botón, enlace y foco en el mismo azul. En Zendesk, Twilio y Genesys no es el color de su marca.',
    nuestro: 'Nuestro oscuro',
    sistemas: [
      { nombre: 'IBM Carbon', boton: '#0f62fe' },
      { nombre: 'Salesforce', boton: '#066afe' },
      { nombre: 'Microsoft Fluent', boton: '#0f6cbd' },
      { nombre: 'Atlassian', boton: '#1868db' },
      { nombre: 'Zendesk', boton: '#1f73b7' },
      { nombre: 'Twilio', boton: '#0263e0' },
      { nombre: 'Genesys', boton: '#2143a2' },
      { nombre: 'Notion', boton: '#2383e2' },
    ],
  },
  {
    id: 'neutro',
    titulo: 'Tinta neutra',
    texto: 'Casi negro o marino, y el azul para los enlaces. Funciona cuando el botón es el único bloque oscuro.',
    nuestro: 'Nuestro claro',
    sistemas: [
      { nombre: 'Vercel', boton: '#171717' },
      { nombre: 'Shopify', boton: '#303030' },
      { nombre: 'GitLab', boton: '#3a383d' },
      { nombre: 'Adobe', boton: '#292929' },
      { nombre: 'Freshworks', boton: '#12344d' },
    ],
  },
  {
    id: 'propio',
    titulo: 'Otro color propio',
    texto: 'Su color de marca, salvo GitHub, que usa el verde de «éxito».',
    sistemas: [
      { nombre: 'Stripe', boton: '#533afd' },
      { nombre: 'Linear', boton: '#6d78d5' },
      { nombre: 'Aircall', boton: '#00884f' },
      { nombre: 'GitHub', boton: '#1f883d' },
    ],
  },
];

export const HALLAZGOS: readonly string[] = [
  'Ninguno de los 17 usa cian en el botón principal.',
  'Un botón principal por vista: lo escriben 10 de los 17.',
  'La IA sin color propio en 7: icono, etiqueta o brillo en sus colores de siempre.',
  'GitLab pasó el botón a neutro en junio de 2026 para que, cuando aparezca color, se sepa por qué.',
];

/* ── IMPLICACIONES ──────────────────────────────────────────────────────────────────────────────
 * Quién lee hoy `--sc-bg-primary` (y su `-hover` y `-active`), contado con grep el 2026-10-18 sobre `main`. El preset
 * lo lee como `{primary.color}`; `base.ts`, que lo define, no cuenta. */
export interface Lector {
  readonly donde: string;
  readonly cuantos: number;
  readonly que: string;
}

export const LECTORES: readonly Lector[] = [
  {
    donde: 'Componentes de PrimeNG (preset)',
    cuantos: 19,
    que: 'Botón (también el de texto y el de contorno), casilla, radio, interruptor, pestañas, barra de progreso, deslizador, pasos, calendario, insignia y nueve más.',
  },
  {
    donde: 'Componentes propios (sc-*)',
    cuantos: 9,
    que: 'Casilla, índice de secciones («estás aquí» y cambios sin guardar), mosaico de icono, selector de columnas, cursor al renombrar, borde de foco del diálogo de borrar y de la cabecera fija, y textos del ⌘K y del modal de transcripción.',
  },
  {
    donde: 'Pantallas del Supervisor',
    cuantos: 6,
    que: 'La cifra principal del resumen (DD-161), el enlace «saltar al contenido», y textos y fondos de categorías, reglas y el conmutador de muestras.',
  },
];

export interface Paso {
  readonly titulo: string;
  readonly texto: string;
}

export const CAMINO: readonly Paso[] = [
  {
    titulo: 'Figma',
    texto: 'Repuntar las variables `button/primary` (fondo, pasar, pulsar, borde, texto y foco) del primario a un paso de la paleta, en claro y en oscuro.',
  },
  {
    titulo: 'Exportar e importar',
    texto: '`npm run tokens:import` genera solo las `--sc-cmp-button-primary-*`: hoy no las genera porque apuntan a `{primary.*}`, que es tema.',
  },
  {
    titulo: 'El preset',
    texto: '`button.ts` lee esas variables en vez de `{primary.color}`. Es el único fichero de código; `tokens:cmp-rewire` avisa si una se emite y nadie la lee.',
  },
  {
    titulo: 'Medir y decidir',
    texto: 'Contraste en los dos temas (`e2e:contrast`), la fila del catálogo de excepciones y una DD.',
  },
];

export const DECISIONES: readonly string[] = [
  'La cifra principal del resumen (DD-161) lleva hoy los tres tonos del botón. ¿Sigue al botón nuevo o se queda en marino?',
  'Los botones de texto y de contorno usan el primario como color de letra. ¿Cambian con el botón? Un cian 400 como letra no pasa (1,75).',
  'El acento (`--sc-text-accent`) es violeta desde el PR #437. ¿Vuelve al azul del enlace o sigue al botón?',
];

/* ── REGLAS ────────────────────────────────────────────────────────────────────────────────────── */
export const REGLAS: readonly Paso[] = [
  { titulo: 'Un trabajo y pocos sitios', texto: 'Más color en más sitios no dirige la atención: la reparte.' },
  { titulo: 'Un botón principal por vista', texto: 'Los demás, secundarios. Hoy el alta de agente tiene dos.' },
  { titulo: 'Su color es solo del botón', texto: 'Casillas, interruptores y selección no lo heredan.' },
  { titulo: 'Un color claro, de fondo', texto: 'Con texto oscuro, o como letra sobre fondo oscuro. Nunca letra clara sobre blanco.' },
  { titulo: 'Ni violeta ni morado', texto: 'Tampoco para la IA: se marca con su icono y su texto.' },
  { titulo: 'El acento es lo que se pulsa', texto: 'Una cifra principal va en el color de los títulos.' },
  { titulo: 'Un color nuevo se mide antes', texto: 'Tono frente a marca y estados, contraste en los dos temas y daltonismo.' },
];

/* ── PANTALLAS REALES ─────────────────────────────────────────────────────────────────────────────
 * Capturas del Supervisor a 1440 con datos editoriales, en `public/explorations/color-de-atencion/img/`. El color se
 * inyectó solo en el botón principal (el de la derecha), como haría la variable de componente. */
export const PANTALLAS = [
  { id: 'alta', label: 'Alta de agente' },
  { id: 'regla', label: 'Nueva regla' },
] as const;

export const CARPETA = '/explorations/color-de-atencion';
