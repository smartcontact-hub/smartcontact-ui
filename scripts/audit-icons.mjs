#!/usr/bin/env node
/**
 * AUDIT · iconos (DD-200). Lo que la auditoría de iconos del 2026-10-13 midió a mano, convertido en chequeo: un
 * icono que dice dos cosas, un concepto con dos iconos, una talla fuera de escala, un nombre que no existe y un
 * botón de solo icono que no enseña su nombre.
 *
 * La regla vive en el paquete de iconos (`projects/ui-smartcontact-icons/src/lib/icons/sc-icon-meanings.ts`):
 * `SC_ICONS` (un icono por concepto) y `SC_ICON_RESERVADOS` (lo único que puede significar cada icono). Este gate la
 * LEE de ahí; no la repite.
 *
 * Gatea, en el DS, sc-docs y el Supervisor (las réplicas copian su app a propósito, DD-35):
 *
 * 1. NOMBRE QUE NO EXISTE. Un nombre literal que no es de Material, ni un alias del DS, ni una clave del menú: la
 *    ligadura se pinta como palabra.
 * 2. TALLA FUERA DE ESCALA. `<sc-icon [size]="15">`: la escala es 8 a 20, 28 y las de ilustración (32 a 64).
 * 3. ICONO RESERVADO CON OTRO SIGNIFICADO. Un control con `close` que se llama «Eliminar…», un `menu` que no abre la
 *    navegación, un `settings` que no es configuración, `rotate_left` en cualquier sitio.
 * 4. CONCEPTO CON OTRO ICONO. «Eliminar…» sin papelera, «Columnas» sin `view_column`, «Agentes» sin `headphones`…
 *    Por la primera palabra del nombre del control, o del título si es una cabecera.
 * 5. TOOLTIP DE UN BOTÓN. `sc-button` pone él mismo, en un botón de solo icono, el tooltip con su nombre, y sale
 *    también al enfocar con teclado. Así que: un `pTooltip` que repite el nombre sobra; uno que dice otra cosa
 *    lleva `tooltipEvent="both"` (el de PrimeNG, por defecto, solo sale con el ratón); un `title` sobra siempre.
 * 6. BOTÓN NATIVO DE SOLO ICONO. Un `<button>` o `<a>` con solo un icono dentro y sin nombre accesible.
 * 7. `aria-label` EN UN `span` O `div` SIN ROL: el lector de pantalla no lo anuncia.
 *
 * Un contraejemplo a propósito (la columna «No» de la doc) lleva `data-contraejemplo` en su elemento o en uno que lo
 * envuelva, y el gate no lo mira.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · Usa el icono que dice el mensaje (sale de `SC_ICONS`), o cambia el nombre del control si el icono era el bueno.
 *   · Si el concepto es nuevo, añádelo a `SC_ICONS` (y a la doc, que lo lee) en vez de inventar otro icono.
 *   · «bajó a N» en el trinquete → actualiza el número (avanza). El trinquete solo guarda ficheros que otra rama tiene
 *     abiertos el día que nació el gate; NO crece.
 *
 * ES ESTÁTICO y PURO respecto al texto (funciones exportadas → testeable en `scripts/__tests__/audit-icons.test.mjs`).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const log = (...a) => process.stdout.write(a.join(' '));

/* ── la regla, leída del paquete de iconos ───────────────────────────────────── */

/** `SC_ICONS` y `SC_ICON_RESERVADOS` del fichero de significados. Una entrada por línea (lo avisa el propio fichero). */
export function leerSignificados(fuente) {
    const bloque = (nombre) => {
        const i = fuente.indexOf(`export const ${nombre} = {`);
        if (i < 0) return '';
        const fin = fuente.indexOf('\n} as const', i);
        return fuente.slice(i, fin);
    };
    const iconos = {};
    for (const m of bloque('SC_ICONS').matchAll(/^\s+(\w+):\s*'([a-z0-9_]+)',?\s*$/gm)) iconos[m[1]] = m[2];
    const reservados = {};
    for (const m of bloque('SC_ICON_RESERVADOS').matchAll(/^\s+(\w+):\s*\{(.*)\},?\s*$/gm)) {
        const verbos = [...(m[2].match(/verbos:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']*)'/g)].map((v) => v[1]);
        const enSuLugar = m[2].match(/enSuLugar:\s*'([^']+)'/)?.[1] ?? null;
        const significa = m[2].match(/significa:\s*'([^']+)'/)?.[1] ?? '';
        reservados[m[1]] = { verbos, enSuLugar, significa };
    }
    return { iconos, reservados };
}

/**
 * La primera palabra del nombre de un control → el concepto de `SC_ICONS` que le toca. Solo lo que no admite duda:
 * «Cerrar sesión» no es cerrar, y «Avanzar» solo es el salto de audio si habla de segundos.
 */
export const VERBO_A_CONCEPTO = [
    [/^(eliminar|borrar)\b/, 'eliminar'],
    [/^(quitar|desvincular)\b/, 'quitar'],
    [/^cerrar\b(?! sesion)/, 'cerrar'],
    [/^editar\b/, 'editar'],
    [/^(filtrar|filtros?)\b/, 'filtrar'],
    [/^columnas\b/, 'columnas'],
    [/^restablecer\b/, 'restablecer'],
    [/^(descargar|exportar)\b/, 'descargar'],
    [/^importar\b/, 'importar'],
    [/^copiar\b/, 'copiar'],
    [/^(anadir|nuevo|nueva|crear)\b/, 'anadir'],
    [/^retroceder\b.*segundos/, 'retroceder10'],
    [/^avanzar\b.*segundos/, 'avanzar10'],
    [/^(re-?transcribir|transcribir)\b/, 'transcribir'],
    [/^(mas acciones|opciones de)\b/, 'masAcciones'],
];

/** Las entidades: por la primera palabra del título, quitando «Sin», «Aún no hay»… delante. */
export const ENTIDAD_A_CONCEPTO = [
    [/^agentes?\b/, 'agentes'],
    [/^grupos?\b/, 'grupos'],
    [/^usuarios?\b/, 'usuarios'],
];

/** Minúsculas, sin tildes ni signos de apertura, sin `{{ }}` y con un solo espacio. */
export function normalizar(texto) {
    return (texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\{\{[^}]*\}\}/g, ' ')
        .replace(/[¿¡«»"“”]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

const SIN_PREFIJO = /^(aun no hay|no hay|sin|todos los|todas las)\s+/;

/** El concepto que nombra un texto: primero como acción, luego como entidad. */
export function conceptoDe(texto, { soloEntidad = false } = {}) {
    const t = normalizar(texto);
    if (!t) return null;
    if (!soloEntidad) for (const [re, c] of VERBO_A_CONCEPTO) if (re.test(t)) return c;
    const sinPrefijo = t.replace(SIN_PREFIJO, '');
    for (const [re, c] of ENTIDAD_A_CONCEPTO) if (re.test(sinPrefijo)) return c;
    return null;
}

/** ¿Este nombre de control casa con lo que el icono reservado puede significar? */
export function casaConReservado(texto, reservado) {
    const t = normalizar(texto);
    if (!t) return true;
    return reservado.verbos.some((v) => t.startsWith(v) || t.includes(` ${v}`));
}

/* ── plantillas ──────────────────────────────────────────────────────────────── */

const VACIOS = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'col', 'area', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'use', 'ellipse']);
const ETIQUETA = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>/"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?)*)\s*(\/?)>/g;
const ATRIBUTO = /([^\s=>/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;

function atributos(s) {
    const a = {};
    for (const m of s.matchAll(ATRIBUTO)) a[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
    return a;
}

/** `{ clave, valor, ligado }` del primer atributo que exista, en su forma estática, `[x]` o `[attr.x]`. */
function attr(a, ...nombres) {
    for (const n of nombres) for (const k of [n, `[${n}]`, `[attr.${n}]`]) if (k in a) return { clave: k, valor: a[k], ligado: k.startsWith('[') };
    return null;
}

const literales = (expr) => [...(expr ?? '').matchAll(/'([^']*)'/g)].map((m) => m[1]);

function lineaDe(texto, i) {
    let n = 1;
    for (let k = 0; k < i; k++) if (texto.charCodeAt(k) === 10) n++;
    return n;
}

/** Comentarios fuera, cada línea en su sitio. */
function sinComentarios(t) {
    return t.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Los elementos de una plantilla con sus atributos, su línea, el texto que llevan dentro (con las interpolaciones
 * marcadas) y sus antepasados. Suficiente para lo que mira este gate; no es un parser de Angular.
 */
export function elementos(plantilla, desplazamiento = 0, fuenteEntera = plantilla) {
    const fuente = sinComentarios(plantilla);
    const pila = [];
    const todos = [];
    let ultimo = 0;
    ETIQUETA.lastIndex = 0;
    let m;
    const texto = (t) => {
        for (const el of pila) el.texto += t;
    };
    while ((m = ETIQUETA.exec(fuente))) {
        texto(fuente.slice(ultimo, m.index));
        ultimo = ETIQUETA.lastIndex;
        const [, cierra, nombre, attrs, autocierra] = m;
        const tag = nombre.toLowerCase();
        if (cierra) {
            for (let i = pila.length - 1; i >= 0; i--) {
                if (pila[i].tag === tag) {
                    pila.splice(i);
                    break;
                }
            }
            continue;
        }
        const el = {
            tag,
            a: atributos(attrs),
            linea: lineaDe(fuenteEntera, desplazamiento + m.index),
            texto: '',
            antepasados: [...pila],
            hijos: [],
        };
        if (pila.length) pila[pila.length - 1].hijos.push(el);
        for (const p of pila) (p.descendientes ??= []).push(el);
        todos.push(el);
        if (!(autocierra || VACIOS.has(tag))) pila.push(el);
    }
    return todos;
}

/** El texto visible de un elemento: sin bloques de control, con las interpolaciones traducidas si se puede. */
export function textoVisible(el, tr) {
    return (el.texto ?? '')
        .replace(/@(if|for|switch|case|defer|placeholder|loading|empty|else if|else|default)\s*(\([^)]*\))?\s*\{/g, ' ')
        .replace(/\{\{([^}]*)\}\}/g, (_, e) => {
            const l = literales(e);
            return ` ${l.length ? l.map(tr).join(' ') : '{dinámico}'} `;
        })
        .replace(/[{}]/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** El texto de un atributo: el literal, o los literales traducidos de su binding; `null` si es dinámico del todo. */
export function textoDe(at, tr) {
    if (!at) return null;
    if (!at.ligado) return tr(at.valor);
    const l = literales(at.valor);
    return l.length ? tr(l[0]) : null;
}

/** Los nombres de icono de un atributo: el literal, los de su binding, o los que resuelve el `.ts` hermano. */
export function iconosDe(at, resolverIdentificador) {
    if (!at) return [];
    if (!at.ligado) return [at.valor];
    // Lo que se COMPARA no es un icono: `side === 'incoming' ? 'move_to_inbox' : 'outbox'`.
    let expr = at.valor.replace(/[!=]==?\s*'[^']*'/g, ' ').replace(/'[^']*'\s*[!=]==?/g, ' ');
    // En un ternario, el icono está en las ramas: la condición no pinta nada.
    if (expr.includes('?')) expr = expr.slice(expr.indexOf('?') + 1);
    const l = literales(expr);
    if (l.length) return l;
    // Un identificador, o los dos lados de un ternario de identificadores (`cond ? duplicateIcon : arrowIcon`).
    const ramas = expr.split(':');
    const ids = ramas.map((r) => r.trim().match(/^[A-Za-z_$][\w$]*$/)?.[0]).filter(Boolean);
    if (!ids.length || !resolverIdentificador) return [];
    const res = ids.map((id) => resolverIdentificador(id));
    return res.every(Boolean) ? res.flat() : [];
}

const esContraejemplo = (el) => [el, ...el.antepasados].some((x) => 'data-contraejemplo' in x.a);

/* ── las reglas sobre una plantilla ─────────────────────────────────────────── */

/**
 * Todo lo que incumple una plantilla. `ctx` = { tr, valido(nombre), reservados, iconos, escala, resolver(id) }.
 * Devuelve `[{ linea, regla, mensaje }]`.
 */
export function revisarPlantilla(plantilla, ctx, desplazamiento = 0, fuenteEntera = plantilla) {
    const fallos = [];
    const { tr, valido, reservados, iconos, escala, resolver } = ctx;
    const fallo = (el, regla, mensaje) => fallos.push({ linea: el.linea, regla, mensaje });

    for (const el of elementos(plantilla, desplazamiento, fuenteEntera)) {
        if (esContraejemplo(el)) continue;
        const { tag, a } = el;

        // ── 7. aria-label en un span/div sin rol
        if ((tag === 'span' || tag === 'div') && attr(a, 'aria-label') && !a.role && !a['[attr.role]'] && !('aria-hidden' in a)) {
            fallo(el, 'aria-label-sin-rol', `aria-label en un <${tag}> sin rol: el lector no lo anuncia. Ponle role="img" (si es un icono con significado) o pásalo al control.`);
        }

        // ── qué iconos lleva este elemento y cómo se llama
        let nombresIcono = [];
        let esControl = false;
        let nombreControl = null;
        let tituloCabecera = null;

        if (tag === 'sc-icon') {
            nombresIcono = iconosDe(attr(a, 'name'), resolver);
            const talla = attr(a, 'size');
            if (talla?.ligado && /^\d+$/.test(talla.valor.trim()) && !escala.has(Number(talla.valor.trim()))) {
                fallo(el, 'talla', `talla ${talla.valor.trim()} fuera de la escala (${[...escala].join(', ')}). Usa la más cercana o size="inherit" si acompaña a un texto.`);
            }
        } else if (/^(sc-|p-)/.test(tag) && attr(a, 'icon')) {
            nombresIcono = iconosDe(attr(a, 'icon'), resolver);
            if (tag === 'sc-button' || tag === 'p-button' || tag === 'sc-link-button') {
                esControl = true;
                nombreControl = textoDe(attr(a, 'ariaLabel'), tr) ?? textoDe(attr(a, 'label'), tr) ?? textoDe(attr(a, 'iconAriaLabel'), tr) ?? (textoVisible(el, tr) || null);
            } else {
                tituloCabecera = textoDe(attr(a, 'title', 'titleKey', 'heading', 'label', 'labelKey', 'value', 'ariaLabel'), tr);
            }
        } else if (tag === 'button' && Object.keys(a).some((k) => k.toLowerCase() === 'pbutton') && attr(a, 'icon')) {
            nombresIcono = iconosDe(attr(a, 'icon'), resolver);
            esControl = true;
            nombreControl = textoDe(attr(a, 'aria-label', 'ariaLabel'), tr) ?? textoDe(attr(a, 'label'), tr);
        }

        // ── 1. nombre que no existe
        for (const n of nombresIcono) {
            if (n && !valido(n)) fallo(el, 'nombre', `«${n}» no es un icono (ni de Material, ni un alias del DS, ni del menú): se pintaría como palabra.`);
        }

        // ── 3. un icono retirado (sin ningún significado admitido) no vale en ningún sitio
        for (const n of nombresIcono) {
            const r = reservados[n];
            if (r && r.verbos.length === 0) fallo(el, 'reservado', `«${n}» está retirado (${r.significa})${r.enSuLugar ? `: usa «${r.enSuLugar}» o el que diga lo que hace` : ''}.`);
        }

        // ── 3 y 4. significado (solo con un icono resuelto y un nombre legible)
        if (nombresIcono.length === 1 && (nombreControl || tituloCabecera) && reservados[nombresIcono[0]]?.verbos.length !== 0) {
            const icono = nombresIcono[0];
            const texto = nombreControl ?? tituloCabecera;
            revisarSignificado(icono, texto, { esControl, reservados, iconos }, (regla, msg) => fallo(el, regla, msg));
        }

        // ── 5. tooltips de sc-button
        if (tag === 'sc-button') {
            const visible = (textoDe(attr(a, 'label'), tr) && !('iconOnly' in a) && !('[iconOnly]' in a)) || textoVisible(el, tr);
            const tooltip = attr(a, 'pTooltip');
            const titulo = attr(a, 'title');
            if (titulo && !visible) fallo(el, 'tooltip', 'title en un sc-button de solo icono: el botón ya pone su tooltip, y el title sale a la vez y no con teclado. Quítalo.');
            if (tooltip && !visible) {
                const nombre = attr(a, 'ariaLabel') ?? attr(a, 'label');
                const mismo = nombre && nombre.valor.replace(/\s+/g, '') === tooltip.valor.replace(/\s+/g, '');
                if (mismo) fallo(el, 'tooltip', 'pTooltip que repite el nombre: sc-button ya lo enseña (también al enfocar). Quítalo.');
                else if (a.tooltipEvent !== 'both') fallo(el, 'tooltip', 'pTooltip sin tooltipEvent="both": el de PrimeNG solo sale con el ratón, no al enfocar con teclado.');
            }
        }

        // ── 5b. un elemento enfocable con tooltip: si el tooltip no sale al enfocar, el teclado no llega a él. Enfocable
        // de serie (`button`, `a` con destino, `input`, `select`, `textarea`) o a mano (`tabindex="0"`).
        const enfocable =
            a.tabindex === '0' ||
            ['button', 'input', 'select', 'textarea'].includes(tag) ||
            (tag === 'a' && ('href' in a || '[href]' in a || 'routerLink' in a || '[routerLink]' in a));
        if (enfocable && attr(a, 'pTooltip') && a.tooltipEvent !== 'both' && a['[tooltipEvent]'] === undefined) {
            fallo(el, 'tooltip', `<${tag}> enfocable con pTooltip sin tooltipEvent="both": al enfocarlo con teclado no sale nada.`);
        }

        // ── 6. botón nativo de solo icono
        if ((tag === 'button' || (tag === 'a' && ('href' in a || '[href]' in a || 'routerLink' in a || '[routerLink]' in a))) && !Object.keys(a).some((k) => k.toLowerCase() === 'pbutton')) {
            const desc = el.descendientes ?? [];
            const conIcono = desc.some((d) => d.tag === 'sc-icon' || d.tag === 'svg' || d.tag === 'img');
            const conControl = desc.some((d) => /^(sc-button|p-button|button|a)$/.test(d.tag));
            if (conIcono && !conControl && !textoVisible(el, tr)) {
                const nombre = attr(a, 'aria-label', 'ariaLabel', 'aria-labelledby') ?? desc.find((d) => d.tag === 'sc-icon' && attr(d.a, 'ariaLabel'));
                const alt = desc.some((d) => d.tag === 'img' && (d.a.alt || d.a['[alt]'] || d.a['[attr.alt]']));
                if (!nombre && !alt) fallo(el, 'sin-nombre', `<${tag}> de solo icono sin nombre accesible: ponle aria-label (o usa sc-button con ariaLabel).`);
            }
        }
    }
    return fallos;
}

/** Las reglas 3 y 4 para un icono y el texto que lo nombra. */
export function revisarSignificado(icono, texto, { esControl, reservados, iconos }, fallo) {
    const reservado = reservados[icono];
    if (reservado && !casaConReservado(texto, reservado)) {
        const otro = reservado.enSuLugar ? ` (¿${reservado.enSuLugar}?)` : '';
        fallo('reservado', `«${icono}» está reservado a «${reservado.significa}» y este control se llama «${texto}»${otro}.`);
        return;
    }
    const concepto = conceptoDe(texto, { soloEntidad: !esControl });
    if (concepto && iconos[concepto] && iconos[concepto] !== icono) {
        fallo('concepto', `«${texto}» es «${concepto}» y su icono es «${iconos[concepto]}», no «${icono}» (SC_ICONS).`);
    }
}

/** Los objetos de un `.ts` con `icon: '…'` (menús, navegación, secciones): su icono, su nombre y si es una acción. */
export function iconosEnTs(fuente) {
    const res = [];
    for (const m of fuente.matchAll(/\b(icon|iconName)\s*:\s*'([^']+)'/g)) {
        const obj = objetoQueEnvuelve(fuente, m.index);
        const etiqueta = obj.match(/\b(label|labelKey|title|titleKey|nombre)\s*:\s*(?:'([^']+)'|[\w.]+\(\s*'([^']+)')/);
        res.push({
            linea: lineaDe(fuente, m.index),
            icono: m[2].replace(/^sc-icon-font sc-icon-font--/, ''),
            texto: etiqueta ? etiqueta[2] ?? etiqueta[3] : null,
            esAccion: /\bcommand\s*:/.test(obj),
        });
    }
    return res;
}

function objetoQueEnvuelve(fuente, i) {
    let prof = 0;
    let inicio = -1;
    for (let k = i; k >= 0; k--) {
        if (fuente[k] === '}') prof++;
        else if (fuente[k] === '{') {
            if (prof === 0) {
                inicio = k;
                break;
            }
            prof--;
        }
    }
    if (inicio < 0) return '';
    prof = 0;
    for (let k = inicio; k < fuente.length; k++) {
        if (fuente[k] === '{') prof++;
        else if (fuente[k] === '}' && --prof === 0) return fuente.slice(inicio, k + 1);
    }
    return fuente.slice(inicio, inicio + 400);
}

/* ── trinquete ───────────────────────────────────────────────────────────────── */

/**
 * Fichero → nº de fallos el día que nació el gate, SOLO de ficheros que otra rama tenía abiertos (2026-10-13: dos
 * worktrees sin guardar y el PR #380 tocan estas pantallas). Se arreglan cuando aterricen. Solo mengua.
 */
export const PENDIENTES = {
    'projects/supervisor/src/app/features/admin/groups/pages/group-form-page.component.html': 2,
};

/* ── main ──────────────────────────────────────────────────────────────────── */
const AMBITO = /^projects\/(ui-smartcontact|ui-smartcontact-icons|sc-docs|supervisor)\/src\//;

function aplanar(o, p = '', acc = {}) {
    for (const [k, v] of Object.entries(o)) {
        const clave = p ? `${p}.${k}` : k;
        if (v && typeof v === 'object') aplanar(v, clave, acc);
        else acc[clave] = String(v);
    }
    return acc;
}

/** Las traducciones en español: el `es.json` de la app (`json`) y el bloque `es` de cada diccionario del DS. */
function traductor(raiz, json) {
    const dic = {};
    const es = join(raiz, json);
    if (existsSync(es)) Object.assign(dic, aplanar(JSON.parse(readFileSync(es, 'utf8'))));
    const ds = execSync("find projects/ui-smartcontact/src/lib -name '*.translations.ts'", { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean);
    const textosDs = ds.map((f) => readFileSync(join(raiz, f), 'utf8'));
    return (clave) => {
        if (!clave) return clave;
        if (dic[clave]) return dic[clave];
        if (/^sc\.[\w.]+$/.test(clave)) {
            const ultima = clave.split('.').pop();
            for (const t of textosDs) {
                const bloqueEs = t.slice(t.indexOf('es:'), t.indexOf('\n  en:') > 0 ? t.indexOf('\n  en:') : undefined);
                const m = bloqueEs.match(new RegExp(`\\b${ultima}:\\s*'([^']+)'`));
                if (m) return m[1];
            }
        }
        return clave;
    };
}

if (process.argv[1] && process.argv[1].endsWith('audit-icons.mjs')) {
    const raiz = process.cwd();
    const leer = (f) => readFileSync(join(raiz, f), 'utf8');
    const { iconos, reservados } = leerSignificados(leer('projects/ui-smartcontact-icons/src/lib/icons/sc-icon-meanings.ts'));
    if (Object.keys(iconos).length < 10 || Object.keys(reservados).length < 5) {
        log('✗ audit:icons: no pude leer SC_ICONS / SC_ICON_RESERVADOS de sc-icon-meanings.ts (¿cambió su forma?)\n');
        process.exit(1);
    }
    const material = new Set([...leer('projects/ui-smartcontact-icons/src/lib/icons/sc-material-symbols.generated.ts').matchAll(/^\s+"([a-z0-9_]+)":/gm)].map((m) => m[1]));
    const tipos = leer('projects/ui-smartcontact-icons/src/lib/icons/sc-icon.types.ts');
    const alias = new Set([...tipos.matchAll(/^\s+'?([a-z-]+)'?: '[a-z_]+',?$/gm)].map((m) => m[1]));
    const heredados = new Set([...tipos.matchAll(/'(pi pi-[a-z-]+)'/g)].map((m) => m[1]));
    const menu = new Set([...leer('projects/supervisor/src/app/core/icons/nav-icons.ts').matchAll(/^\s+'?([a-z0-9-]+)'?:\s*'[a-z0-9_]+'/gm)].map((m) => m[1]));
    const valido = (n) => material.has(n) || alias.has(n) || heredados.has(n) || menu.has(n);
    const escala = new Set([8, 10, 12, 14, 16, 18, 20, 28, 32, 44, 56, 64]);
    // Cada app con su diccionario: sc-docs y el Supervisor no comparten claves.
    const trDocs = traductor(raiz, 'projects/sc-docs/public/assets/i18n/es.json');
    const trSupervisor = traductor(raiz, 'projects/supervisor/src/assets/i18n/es.json');

    const ficheros = execSync("git ls-files 'projects/*.html' 'projects/*.ts'", { cwd: raiz, encoding: 'utf8' })
        .split('\n')
        .filter((f) => AMBITO.test(f) && !/\.spec\.ts$|\.generated\.ts$|\.translations\.ts$/.test(f))
        .sort();

    const porFichero = {};
    const sueltos = [];
    let revisados = 0;
    for (const f of ficheros) {
        const fuente = leer(f);
        const hermano = f.endsWith('.html') ? f.replace(/\.html$/, '.ts') : f;
        const ts = existsSync(join(raiz, hermano)) ? leer(hermano) : '';
        const resolver = (id) => {
            const d = ts.match(new RegExp(`\\b${id}\\s*(?::[^=;]+)?=\\s*([^;\\n]+)`));
            if (!d) return null;
            const l = literales(d[1]);
            if (l.length) return l;
            const c = d[1].trim().match(/^SC_ICONS\.(\w+)/);
            return c && iconos[c[1]] ? [iconos[c[1]]] : null;
        };
        const tr = f.startsWith('projects/sc-docs/') ? trDocs : trSupervisor;
        const ctx = { tr, valido, reservados, iconos, escala, resolver };
        const fallos = [];
        if (f.endsWith('.html')) fallos.push(...revisarPlantilla(fuente, ctx));
        else {
            for (const t of fuente.matchAll(/template\s*:\s*`([\s\S]*?)`/g)) {
                fallos.push(...revisarPlantilla(t[1], ctx, t.index + t[0].indexOf('`') + 1, fuente));
            }
            for (const o of iconosEnTs(fuente)) {
                if (!valido(o.icono)) fallos.push({ linea: o.linea, regla: 'nombre', mensaje: `«${o.icono}» no es un icono (ni de Material, ni un alias del DS, ni del menú).` });
                else if (reservados[o.icono]?.verbos.length === 0) fallos.push({ linea: o.linea, regla: 'reservado', mensaje: `«${o.icono}» está retirado (${reservados[o.icono].significa}).` });
                else if (o.texto) {
                    const texto = tr(o.texto);
                    revisarSignificado(menu.has(o.icono) && !material.has(o.icono) ? navAMaterial(leer, o.icono) : o.icono, texto, { esControl: o.esAccion, reservados, iconos }, (regla, mensaje) => fallos.push({ linea: o.linea, regla, mensaje }));
                }
            }
        }
        revisados++;
        if (!fallos.length) continue;
        if (f in PENDIENTES) porFichero[f] = fallos;
        else for (const x of fallos) sueltos.push(`${f}:${x.linea} [${x.regla}] ${x.mensaje}`);
    }

    const problemas = [...sueltos];
    for (const [f, base] of Object.entries(PENDIENTES)) {
        const n = porFichero[f]?.length ?? 0;
        if (n > base) problemas.push(`${f}: ${n} fallo(s) (congelado ${base}). Nuevo(s): ${porFichero[f].map((x) => `:${x.linea} ${x.mensaje}`).join(' | ')}`);
        else if (n < base) problemas.push(`${f}: bajó a ${n} (congelado ${base}) → actualiza el trinquete (avanza)${n === 0 ? ' o quita su entrada' : ''}.`);
    }

    log(`audit:icons: ${revisados} fichero(s) del DS, sc-docs y el Supervisor; ${Object.keys(iconos).length} conceptos y ${Object.keys(reservados).length} iconos reservados (sc-icon-meanings.ts); trinquete ${Object.keys(PENDIENTES).length} fichero(s)\n`);
    if (problemas.length) {
        log(`✗ ${problemas.length} problema(s):\n${problemas.map((p) => `  ${p}`).join('\n')}\n`);
        process.exit(1);
    }
    log('✓ cada icono dice una sola cosa y cada concepto tiene su icono\n');
}

/** La clave del menú lateral → su nombre de Material (`users-round` → `groups`). */
function navAMaterial(leer, clave) {
    const m = leer('projects/supervisor/src/app/core/icons/nav-icons.ts').match(new RegExp(`^\\s+'?${clave}'?:\\s*'([a-z0-9_]+)'`, 'm'));
    return m ? m[1] : clave;
}
