/**
 * «Pregunta a la IA» de sc-docs: recibe una pregunta y la ficha de la página abierta, lee esa ficha (y las que la
 * pregunta nombre) de la doc publicada y contesta con Workers AI, en streaming.
 *
 * Por qué así:
 *   · Las fichas ya existen en texto: `scripts/docs-ia.mjs` escribe `llms.txt` (el índice) y `ia/<ficha>.md` en cada
 *     build. El Worker las LEE de la doc publicada, no lleva copia: nunca va por detrás del código.
 *   · Toda la doc junta (`llms-full.txt`) son ~100 000 tokens por pregunta. El índice + la ficha de la página + las
 *     nombradas son ~5 000–15 000: así el cupo gratis da para cien preguntas al día y no para ocho.
 *   · El cliente manda solo el NOMBRE de la ficha, nunca texto de contexto: el Worker no es un proxy de IA abierto.
 */

/* Lo poco del runtime de Workers que se usa aquí, declarado a mano: el repo no trae `@cloudflare/workers-types`, y
 * así este fichero type-checkea en `tsconfig.harness.json` con el resto del TypeScript de fuera de `projects/`. */
interface ExecutionContext {
  waitUntil(promesa: Promise<unknown>): void;
}

/** La caché del borde de Cloudflare (`caches.default`), que la librería DOM no conoce. */
const cacheDelBorde = (): Cache => (caches as unknown as { default: Cache }).default;

interface Ai {
  run(modelo: string, entrada: unknown): Promise<unknown>;
}

interface Limite {
  limit(opciones: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  AI: Ai;
  LIMITE?: Limite;
  SITIO: string;
  MODELO: string;
  ORIGENES: string;
}

interface Turno {
  role: 'user' | 'assistant';
  content: string;
}

interface Peticion {
  pregunta?: unknown;
  ficha?: unknown;
  idioma?: unknown;
  historial?: unknown;
}

const MAX_PREGUNTA = 600;
const MAX_TURNO = 4000;
const MAX_TURNOS = 6;
const MAX_FICHAS = 3;
/** Una ficha larga (datatable) mide ~40 000 caracteres; con tres, cabe de sobra en el contexto del modelo. */
const MAX_CONTEXTO = 90_000;
const NOMBRE_FICHA = /^[a-z0-9-]{2,40}$/;

export default {
  async fetch(peticion: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origen = peticion.headers.get('Origin') ?? '';
    const cors = cabecerasCors(origen, env);

    if (peticion.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(peticion.url);
    if (url.pathname !== '/ask' || peticion.method !== 'POST') return json({ error: 'no-encontrado' }, 404, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origen' }, 403, cors);

    if (env.LIMITE) {
      const ip = peticion.headers.get('CF-Connecting-IP') ?? 'local';
      const { success } = await env.LIMITE.limit({ key: ip });
      if (!success) return json({ error: 'demasiadas' }, 429, cors);
    }

    let cuerpo: Peticion;
    try {
      cuerpo = (await peticion.json()) as Peticion;
    } catch {
      return json({ error: 'formato' }, 400, cors);
    }
    const pregunta = typeof cuerpo.pregunta === 'string' ? cuerpo.pregunta.trim().slice(0, MAX_PREGUNTA) : '';
    if (!pregunta) return json({ error: 'vacia' }, 400, cors);
    const idioma = cuerpo.idioma === 'en' ? 'en' : 'es';
    const fichaPagina = typeof cuerpo.ficha === 'string' && NOMBRE_FICHA.test(cuerpo.ficha) ? cuerpo.ficha : null;
    const historial = limpiarHistorial(cuerpo.historial);

    const indice = await leer(`${env.SITIO}/llms.txt`, ctx);
    if (!indice) return json({ error: 'doc' }, 502, cors);

    const fichas = elegirFichas(indice, fichaPagina, [pregunta, ...historial.map((t) => t.content)].join('\n'));
    const leidas: { ficha: string; texto: string }[] = [];
    let total = indice.length;
    for (const ficha of fichas) {
      const texto = await leer(`${env.SITIO}/ia/${ficha}.md`, ctx);
      if (!texto || total + texto.length > MAX_CONTEXTO) continue;
      leidas.push({ ficha, texto });
      total += texto.length;
    }

    const mensajes = [
      { role: 'system', content: instrucciones(idioma, env.SITIO) },
      {
        role: 'system',
        content: [
          '# Índice de la doc (llms.txt)',
          indice,
          ...leidas.map((l) => `\n\n# Ficha: ia/${l.ficha}.md\n\n${l.texto}`),
        ].join('\n'),
      },
      ...historial,
      { role: 'user', content: pregunta },
    ];

    let respuesta: unknown;
    try {
      respuesta = await env.AI.run(env.MODELO, {
        messages: mensajes,
        stream: true,
        max_tokens: 900,
        temperature: 0.2,
        // Sin la fase de «pensar»: con fichas cortas no mejora la respuesta y la retrasa ~10 s.
        chat_template_kwargs: { enable_thinking: false },
      });
    } catch (e) {
      const texto = String(e);
      // 4006: el cupo diario gratis de Workers AI se acabó (en el plan gratis es un tope duro).
      const agotado = /4006|daily free allocation|neurons/i.test(texto);
      return json({ error: agotado ? 'cupo' : 'modelo' }, agotado ? 429 : 502, cors);
    }
    if (!(respuesta instanceof ReadableStream)) return json({ error: 'modelo' }, 502, cors);

    return new Response(respuesta, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Sc-Fichas': leidas.map((l) => l.ficha).join(','),
      },
    });
  },
};

function instrucciones(idioma: 'es' | 'en', sitio: string): string {
  const lengua = idioma === 'en' ? 'Answer in English.' : 'Responde en castellano.';
  return [
    'Eres el asistente de la documentación de Smart Contact UI, el Design System de Smart Contact: componentes Angular',
    'sobre PrimeNG (paquete `@smartcontact-hub/components`) y el contrato de tokens CSS `--sc-*`.',
    '',
    'Reglas:',
    '1. Contesta SOLO con lo que dicen el índice y las fichas que tienes abajo. No inventes propiedades, componentes ni tokens.',
    '2. Si la respuesta no está en las fichas, dilo en una línea y nombra la ficha del índice que más se acerque, con su enlace.',
    '3. Corto y ligero: la respuesta en 1-3 frases llanas, como se lo dirías a un compañero. Nada de copiar la ficha entera.',
    '4. Sin tablas. Si piden propiedades o variantes, una lista de 4 a 6 viñetas con las más usadas, cada una «`nombre`: para',
    '   qué sirve» en pocas palabras, y al final el enlace a la ficha para verlas todas.',
    '5. Después, si ayuda, UN ejemplo de código corto (máximo 8 líneas) con los `sc-*` de las fichas, con su lenguaje',
    '   (```html, ```ts, ```css).',
    '6. Usa `código` solo para nombres de propiedades, componentes y tokens; el resto, texto normal. Negrita, casi nunca.',
    `7. Para enlazar una ficha usa su página para personas: ${sitio}/#/components/<ficha>. Nunca enlaces \`ia/<ficha>.md\`.`,
    '8. Sin saludos ni despedidas, sin «¡Buena pregunta!», sin ofrecer más ayuda al final.',
    '9. Si una story de las fichas enseña justo lo que preguntan, termina con su enlace «Abrir» copiado TAL CUAL de la',
    `   ficha, en una línea propia: [Ver ejemplo](${sitio}/#/components/<ficha>?historia=<story>). Solo uno, y solo uno`,
    '   que salga en la ficha: la doc lo pinta debajo de tu respuesta como componente vivo.',
    lengua,
  ].join('\n');
}

/**
 * Qué fichas leer: la de la página abierta y las que la conversación nombra, por su nombre («Select») o su etiqueta
 * (`sc-select`), sacados del propio índice. Así una ficha nueva entra sola, sin tocar el Worker.
 */
function elegirFichas(indice: string, fichaPagina: string | null, texto: string): string[] {
  const fichas: string[] = fichaPagina ? [fichaPagina] : [];
  const minusculas = texto.toLowerCase();
  const entradas = [...indice.matchAll(/^- \[([^\]]+?)(?: \(`<([a-z0-9-]+)>`\))?\]\(ia\/([a-z0-9-]+)\.md\)/gm)];
  const nombradas = entradas
    .map(([, titulo, etiqueta, ficha]) => {
      const claves = [titulo.toLowerCase(), etiqueta?.toLowerCase()].filter((c): c is string => !!c && c.length > 2);
      const posicion = Math.min(...claves.map((c) => posicionPalabra(minusculas, c)));
      return { ficha, posicion };
    })
    .filter((e) => Number.isFinite(e.posicion))
    .sort((a, b) => a.posicion - b.posicion);
  for (const { ficha } of nombradas) {
    if (fichas.length >= MAX_FICHAS) break;
    if (!fichas.includes(ficha)) fichas.push(ficha);
  }
  return fichas;
}

/** Dónde aparece `palabra` como palabra entera (para que «tag» no case dentro de «tags» ni de «etiquetas»). */
function posicionPalabra(texto: string, palabra: string): number {
  const escapada = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(^|[^a-z0-9-])${escapada}($|[^a-z0-9-])`).exec(texto);
  return m ? m.index : Infinity;
}

function limpiarHistorial(crudo: unknown): Turno[] {
  if (!Array.isArray(crudo)) return [];
  return crudo
    .filter(
      (t): t is Turno =>
        !!t &&
        typeof t === 'object' &&
        ((t as Turno).role === 'user' || (t as Turno).role === 'assistant') &&
        typeof (t as Turno).content === 'string',
    )
    .slice(-MAX_TURNOS)
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_TURNO) }));
}

/** Lee un fichero de la doc publicada con 5 minutos de caché en el borde. */
async function leer(url: string, ctx: ExecutionContext): Promise<string | null> {
  const cache = cacheDelBorde();
  const guardada = await cache.match(url);
  if (guardada) return guardada.text();
  const r = await fetch(url, { headers: { Accept: 'text/plain' } });
  // La doc es una SPA: una ruta que no existe responde su `index.html` con un 200. Eso no es una ficha.
  if (!r.ok || (r.headers.get('Content-Type') ?? '').includes('text/html')) return null;
  const texto = await r.text();
  ctx.waitUntil(
    cache.put(url, new Response(texto, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'max-age=300' } })),
  );
  return texto;
}

function cabecerasCors(origen: string, env: Env): Record<string, string> {
  const permitidos = env.ORIGENES.split(',').map((o) => o.trim());
  const valido =
    permitidos.includes(origen) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen) ||
    // Las previews por rama de Cloudflare Pages: https://<rama>.sc-doc.pages.dev
    /^https:\/\/[a-z0-9-]+\.sc-doc\.pages\.dev$/.test(origen);
  const cabeceras: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Sc-Fichas',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (valido) cabeceras['Access-Control-Allow-Origin'] = origen;
  return cabeceras;
}

function json(datos: unknown, estado: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
