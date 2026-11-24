#!/usr/bin/env node
/**
 * Revisión de una página (o de una pantalla) del Figma del Supervisor antes de darla por entregada: imprime el
 * JavaScript que se ejecuta en el fichero (`figma_execute` o `use_figma`, con el Supervisor abierto) y que devuelve
 * estas listas. Todas tienen que salir vacías, salvo la última, que es trabajo de diseño en el Kit.
 *
 *   1. `costuras`: notas para desarrollo que cuentan cómo se montó el Figma («componente local», «limitaciones del
 *      Kit», «se ha compuesto», «Por decidir»…) o nombran cosas que solo existen en este repo (`sc-list-page`, una DD,
 *      una variable `--sc-*`). Una limitación del Kit no va en la entrega: se comprueba y se apunta en
 *      `docs/figma-pendiente.md` (ficha 53).
 *   2. `sinEstilo`: textos que pone la maqueta (fuera de una instancia, o dentro del slot de una) sin text style.
 *      Cada texto lleva uno de los 14.
 *   3. `menusApretados`: filas de menú cuyo texto tiene el interlineado automático o al 100 %. Así nació el «Recientes»
 *      de Repositorios con filas de 21 en vez de 34.
 *   4. `camposAMano`: un campo del DS con su etiqueta o su ayuda APAGADA y un texto suelto al lado que hace de etiqueta
 *      o de error. La etiqueta, la ayuda y el error van en las propiedades del componente (`Show Label`, `Label`,
 *      `Show Helper`, `Helper Text`) y el estado en su variante (`Invalid`, `Size`, `Disabled`).
 *   5. `retoques`: propiedades visuales cambiadas a mano sobre una instancia (color, letra, interlineado, relleno,
 *      espacio, radio, opacidad, variable cambiada). Si la variante o la propiedad existe, se usa; si no existe, el
 *      retoque se queda solo con su ficha en `docs/figma-pendiente.md`.
 *   6. `sinVariable`: medidas y colores que pone la maqueta sin variable ni estilo (padding, separación, radio,
 *      relleno, borde).
 *   7. `fueraDelKit`: valores de la maqueta que el Kit no tiene: letra, interlineado, espacio o radio que no salen en
 *      `kit-export-dtcg.json`. Incluye lo que un retoque puso dentro de una instancia.
 *   8. `componentesFueraDelKit`: lo mismo, pero lo trae el propio componente del DS (p. ej. la etiqueta del input a
 *      15/21). No se arregla retocando la instancia: se apunta en `docs/figma-pendiente.md` para que diseño corrija
 *      el componente.
 *
 * Las listas 1 a 3 miran la página entera. Las 4 a 8 miran solo las pantallas: con un nodo, ese nodo; con una página,
 * los marcos que llevan la barra lateral (`sidebar`), así que las portadas, leyendas, mapas y notas no cuentan.
 *
 * Una página por pasada: con todas a la vez, el servidor de Figma corta la respuesta. Para una sola pantalla, su nodo.
 *
 * Uso:  node tools/figma-revision.mjs "<página>"      (p. ej. "Repositorios", "↳ Tipificaciones")
 *       node tools/figma-revision.mjs <nodo>          (p. ej. 3452:14415: solo esa pantalla y sin cambiar de página)
 */
import { readFileSync } from 'node:fs';

import { EXPORT_PATH } from '../scripts/paths.mjs';

/** Frases de costura: cómo se hizo el Figma, no qué hace el dev. Medidas en las notas que se limpiaron el 2026-11-04. */
export const COSTURAS = [
  /limitaci[oó]n(es)? del kit/i,
  /kit de figma/i,
  /componentes? locale?s?/i,
  /se ha compuesto/i,
  /candidato a subir/i,
  /no se ha tocado/i,
  /el ds de figma no/i,
  /\bno admite contenido/i,
  /\ben figma,/i,
  /frente al c[oó]digo/i,
  /no tiene variante/i,
  /^por decidir$/i,
  /\bsc-list-page\b/,
  /\bDD-\d+/,
  /--sc-[a-z]/,
];

/** ¿Este texto de nota es una costura? Devuelve el patrón que lo caza, o `null`. */
export function costura(texto) {
  return COSTURAS.find((rx) => rx.test(texto)) ?? null;
}

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * Los valores que admite el Kit, leídos del export: letra, interlineado, espacio y radio. Sale de los tokens, no de
 * una lista escrita aquí, para que un cambio del Kit cambie la revisión sin tocarla. Los alias `{a.b.c}` se resuelven
 * contra todas las colecciones; la de documentación (`docs-(local)`) no cuenta.
 */
export function valoresDelKit(exportKit = JSON.parse(readFileSync(EXPORT_PATH, 'utf8'))) {
  let ek = exportKit;
  if (typeof ek === 'string') ek = JSON.parse(ek);
  const grupos = ek.groups ?? ek;
  const tokens = [];
  const indice = new Map();
  const recorrer = (nodo, ruta) => {
    if (!nodo || typeof nodo !== 'object') return;
    if ('$value' in nodo) {
      tokens.push([ruta, nodo.$value]);
      if (!indice.has(ruta)) indice.set(ruta, nodo.$value);
      return;
    }
    for (const [k, v] of Object.entries(nodo)) recorrer(v, ruta ? `${ruta}/${k.toLowerCase()}` : k.toLowerCase());
  };
  for (const [coleccion, arbol] of Object.entries(grupos)) {
    if (/docs/i.test(coleccion)) continue;
    recorrer(arbol, '');
  }
  const resolver = (v, prof = 0) => {
    if (typeof v === 'number') return v;
    if (v == null || prof > 15) return null;
    const m = /^\{(.+)\}$/.exec(String(v).trim());
    if (!m) return Number.isFinite(Number(v)) ? Number(v) : null;
    return resolver(indice.get(m[1].toLowerCase().replace(/\./g, '/')), prof + 1);
  };
  const de = (rx, { minimo = -Infinity } = {}) =>
    [...new Set(tokens.filter(([ruta]) => rx.test(ruta)).map(([, v]) => resolver(v)))]
      .filter((v) => typeof v === 'number' && v >= minimo)
      .map(r2)
      .sort((a, b) => a - b);
  return {
    letra: de(/font\/size|fontsize/),
    interlineado: de(/line\/height|lineheight/),
    espacio: [...new Set([0, ...de(/^scale\//, { minimo: 0 }), ...de(/padding|gap|spacing|margin/, { minimo: 0 })])].sort(
      (a, b) => a - b,
    ),
    radio: de(/radius/, { minimo: 0 }),
  };
}

/**
 * La revisión, tal como corre en el fichero. Se manda como texto con `toString()`, así que no puede usar nada de fuera
 * de sus argumentos. Los tests la corren contra un árbol de mentira.
 */
export async function revisar(figma, objetivo, KIT, COSTURAS) {
  const TOPE = 40; // líneas por lista: con más, el servidor corta la respuesta
  const VISUALES = [
    'fills', 'strokes', 'strokeWeight', 'fontSize', 'fontName', 'fontWeight', 'lineHeight', 'letterSpacing',
    'textCase', 'textDecoration', 'textStyleId', 'fillStyleId', 'strokeStyleId', 'effectStyleId', 'effects',
    'opacity', 'cornerRadius', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius',
    'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'itemSpacing', 'counterAxisSpacing',
  ];
  const DE_TEXTO = ['fontSize', 'fontName', 'lineHeight', 'textStyleId'];
  const r2 = (x) => Math.round(x * 100) / 100;
  const LETRA = new Set(KIT.letra), INTERLINEADO = new Set(KIT.interlineado);
  const ESPACIO = new Set(KIT.espacio), RADIO = new Set(KIT.radio);
  const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  const corto = (s, n = 30) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  let page, tops;
  if (/^\d+:\d+$/.test(objetivo)) {
    const nodo = await figma.getNodeByIdAsync(objetivo);
    if (!nodo) throw new Error('No hay nodo ' + objetivo);
    for (page = nodo.parent; page && page.type !== 'PAGE'; page = page.parent);
    tops = [nodo];
  } else {
    page = figma.root.children.find((p) => p.name.trim() === objetivo.trim());
    if (!page) throw new Error('No hay página ' + objetivo);
    await figma.setCurrentPageAsync(page);
    tops = page.children;
  }

  // La instancia que colocó la maqueta y que trae esta capa, o null si la capa la pone la maqueta. Lo que va en el slot
  // de una instancia es de la maqueta: así se montan los campos dentro de una Section.
  const colocada = (n) => {
    let inst = null;
    for (let a = n.parent; a && a.type !== 'PAGE' && a.type !== 'SLOT'; a = a.parent) if (a.type === 'INSTANCE') inst = a;
    return inst;
  };
  const oculta = (n) => {
    for (let a = n; a && a.type !== 'PAGE'; a = a.parent) if (a.visible === false) return true;
    return false;
  };
  const maestros = new Map();
  const maestro = async (inst) => {
    if (!maestros.has(inst.id)) maestros.set(inst.id, await inst.getMainComponentAsync());
    return maestros.get(inst.id);
  };
  const componente = async (inst) => {
    const m = await maestro(inst);
    return m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name) : inst.name;
  };
  // Qué variable ata un campo (o cada pintura de un relleno), para comparar la capa con la del maestro.
  const atado = (capa, f) => {
    if (!capa) return null;
    if ((f === 'fills' || f === 'strokes') && Array.isArray(capa[f])) {
      return JSON.stringify(capa[f].map((p) => (p.boundVariables && p.boundVariables.color ? p.boundVariables.color.id : p.type === 'SOLID' ? hex(p.color) : p.type)));
    }
    const b = capa.boundVariables && capa.boundVariables[f];
    return b ? JSON.stringify([].concat(b).map((x) => x.id)) : null;
  };
  const conVariable = (capa, f) => Array.isArray(capa[f]) && capa[f].every((p) => p.boundVariables && p.boundVariables.color);
  // Los campos visuales en los que la capa de la instancia ya no es la del maestro. Un ancho o un alto desatado al
  // redimensionar no cuenta; un icono (hasta 32) recoloreado con una variable tampoco: el color del icono no es variante.
  const icono = (capa) => capa.type !== 'TEXT' && capa.width <= 32 && capa.height <= 32;
  const camposRetocados = (capa, ref, campos) => campos.filter((f) => {
    if (ref && atado(capa, f) === atado(ref, f) && (atado(capa, f) !== null || f === 'fills' || f === 'strokes')) return false;
    if ((f === 'fills' || f === 'strokes') && icono(capa) && conVariable(capa, f)) return false;
    return true;
  });
  const grupos = { sinEstilo: {}, retoques: {}, sinVariable: {}, fueraDelKit: {}, componentesFueraDelKit: {} };
  const anota = (lista, clave, ej) => {
    const g = (grupos[lista][clave] ??= { n: 0, ej: [] });
    g.n++;
    if (g.ej.length < 3) g.ej.push(ej);
  };
  const costuras = [], menusApretados = [], camposAMano = [];
  // Rellenos y bordes de la maqueta sin variable ni estilo: un color de estado puesto a mano sale aquí.
  const pinturasSinVariable = (n) => {
    for (const [prop, estilo, nombre] of [['fills', 'fillStyleId', 'relleno'], ['strokes', 'strokeStyleId', 'borde']]) {
      if (n[estilo] || !Array.isArray(n[prop])) continue;
      for (const p of n[prop]) {
        if (p.visible === false || p.type !== 'SOLID' || (p.boundVariables && p.boundVariables.color)) continue;
        anota('sinVariable', nombre + ' ' + hex(p.color) + (p.opacity < 1 ? ' ' + Math.round(p.opacity * 100) + ' %' : ''), n.id);
      }
    }
  };

  // Las pantallas: con un nodo, ese nodo; con una página, los marcos que llevan la barra lateral (`sidebar`). Lo que
  // miran las listas nuevas (campos, retoques, variables y Kit) se queda dentro de ellas: los tableros de alrededor
  // (portadas, leyendas, mapas, notas `Doc/`) no son la app.
  const instancias = [];
  for (const top of tops) {
    if (!top.findAll) continue;
    if (top.type === 'INSTANCE') instancias.push(top);
    instancias.push(...top.findAll((n) => n.type === 'INSTANCE' && !colocada(n)));
  }
  const pantallas = new Set(tops.length === 1 && /^\d+:\d+$/.test(objetivo) ? tops : []);
  if (!pantallas.size) {
    for (const i of instancias) if (i.parent && (/^sidebar$/i.test(i.name) || (await componente(i)) === 'sidebar')) pantallas.add(i.parent);
  }
  const enPantalla = (n) => {
    for (let a = n; a && a.type !== 'PAGE'; a = a.parent) if (pantallas.has(a)) return true;
    return false;
  };

  // Primero los retoques: dicen si un valor raro dentro de una instancia lo trae el componente o lo puso la maqueta.
  const retocados = new Map(), vistos = new Set();
  for (const i of instancias) {
    if (oculta(i) || !enPantalla(i)) continue;
    for (const o of i.overrides || []) {
      if (vistos.has(o.id)) continue;
      vistos.add(o.id);
      // `boundVariables` dice que se cambió alguna variable: se mira cuál, campo a campo, contra el maestro.
      const tocados = o.overriddenFields.includes('boundVariables') ? VISUALES : o.overriddenFields.filter((f) => VISUALES.includes(f));
      if (!tocados.length) continue;
      const capa = o.id === i.id ? i : await figma.getNodeByIdAsync(o.id);
      if (!capa || (capa !== i && !colocada(capa))) continue; // contenido de un slot: no es retoque, es maqueta
      const m = await maestro(i);
      const sufijo = o.id.split(';').pop();
      const ref = !m ? null : capa === i ? m : m.findOne((x) => x.id.split(';').pop() === sufijo);
      const campos = camposRetocados(capa, ref, tocados.filter((f) => o.overriddenFields.includes(f) || (ref && atado(capa, f) !== atado(ref, f))));
      if (!campos.length) continue;
      retocados.set(o.id, campos);
      anota('retoques', (await componente(i)) + ' › ' + (capa === i ? '(la instancia)' : capa.name) + ': ' + campos.join(', '), i.id);
    }
  }

  for (const top of tops) {
    if (!top.findAll) continue;
    const nodos = top.findAll(() => true);
    for (const n of nodos) {
      const inst = colocada(n);
      const visible = !oculta(n);

      if (n.type === 'TEXT') {
        const t = n;
        const pantalla = /^(\d\d |Paso )/.test(top.name) || /^\d\d /.test((t.parent && t.parent.name) || '');
        const doc = !inst || /^Doc\//.test((t.parent && t.parent.name) || '');
        if (doc && !pantalla) {
          const rx = COSTURAS.find((r) => r.test(t.characters));
          if (rx) costuras.push(corto(top.name) + ' | ' + t.id + ' | ' + rx + ' | ' + t.characters.slice(0, 120));
        }
        if (!inst && !(typeof t.textStyleId === 'string' && t.textStyleId)) {
          const k = t.fontSize === figma.mixed ? 'mixto' : t.fontSize + '/' + (t.lineHeight.unit === 'PIXELS' ? t.lineHeight.value : 'auto');
          anota('sinEstilo', k, t.id + ' «' + corto(t.characters, 20) + '»');
        }
        if (!visible || !enPantalla(t)) continue;
        if (!inst) pinturasSinVariable(t);
        const tramos = t.fontSize === figma.mixed || t.lineHeight === figma.mixed
          ? t.getStyledTextSegments(['fontSize', 'lineHeight'])
          : [{ fontSize: t.fontSize, lineHeight: t.lineHeight }];
        const malos = new Set();
        for (const s of tramos) {
          if (typeof s.fontSize === 'number' && !LETRA.has(r2(s.fontSize))) malos.add('letra ' + r2(s.fontSize));
          if (s.lineHeight && s.lineHeight.unit === 'PIXELS' && !INTERLINEADO.has(r2(s.lineHeight.value))) malos.add('interlineado ' + r2(s.lineHeight.value));
        }
        if (!malos.size) continue;
        const valor = [...malos].join(' · ');
        const retoque = (retocados.get(t.id) || []).some((f) => DE_TEXTO.includes(f));
        if (!inst) anota('fueraDelKit', valor, t.id + ' «' + corto(t.characters, 20) + '»');
        else if (retoque) anota('fueraDelKit', valor + ' (retoque en ' + (await componente(inst)) + ')', inst.id);
        else anota('componentesFueraDelKit', (await componente(inst)) + ' › ' + t.name + ': ' + valor, inst.id);
        continue;
      }

      if (n.type === 'INSTANCE' && /^menu-item/.test(n.name)) {
        const t = n.findOne((x) => x.type === 'TEXT' && x.name === 'Menu Item');
        if (t && t.lineHeight !== figma.mixed && t.lineHeight.unit !== 'PIXELS') menusApretados.push(n.id + ' ' + Math.round(n.height) + ' de alto');
      }

      if (inst || !visible || !enPantalla(n)) continue;

      if (n.type === 'INSTANCE') {
        const apagadas = Object.entries(n.componentProperties || {})
          .filter(([k, p]) => p.type === 'BOOLEAN' && p.value === false && /label|helper|etiqueta|ayuda/i.test(k))
          .map(([k]) => k.split('#')[0].trim());
        if (apagadas.length && n.parent) {
          // Solo cuenta lo que está encima o debajo del campo, donde irían su etiqueta y su ayuda: un contador al lado
          // del buscador no es una etiqueta.
          const p = n.parent;
          const enColumna = (s) => p.layoutMode === 'VERTICAL' || (p.layoutMode !== 'HORIZONTAL' && s.x < n.x + n.width && n.x < s.x + s.width);
          const sueltos = [];
          for (const s of p.children) {
            if (s === n || s.visible === false || !enColumna(s)) continue;
            if (s.type === 'TEXT') sueltos.push(s);
            else if ((s.type === 'FRAME' || s.type === 'GROUP') && s.findAll) sueltos.push(...s.findAll((x) => x.type === 'TEXT' && !colocada(x)));
          }
          if (sueltos.length) {
            camposAMano.push(n.id + ' «' + n.name + '» | ' + apagadas.join(', ') + ': apagada | al lado: ' +
              sueltos.slice(0, 2).map((s) => '«' + corto(s.characters) + '»').join(' '));
          }
        }
        continue;
      }

      if (n.type === 'SECTION' || n.type === 'SLOT') continue;
      const bv = n.boundVariables || {};
      if (n.layoutMode && n.layoutMode !== 'NONE') {
        const campos = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
        if (n.primaryAxisAlignItems !== 'SPACE_BETWEEN') campos.push('itemSpacing');
        if (n.layoutWrap === 'WRAP') campos.push('counterAxisSpacing');
        for (const f of campos) {
          const v = n[f];
          if (typeof v !== 'number' || v === 0 || bv[f]) continue;
          anota('sinVariable', f + ' ' + r2(v), n.id);
          if (!ESPACIO.has(r2(Math.abs(v)))) anota('fueraDelKit', 'espacio ' + r2(v) + ' (' + f + ')', n.id);
        }
      }
      const radios = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']
        .filter((f) => typeof n[f] === 'number' && n[f] > 0 && !bv[f]).map((f) => r2(n[f]));
      for (const v of new Set(radios)) {
        anota('sinVariable', 'radio ' + v, n.id);
        if (!RADIO.has(v)) anota('fueraDelKit', 'radio ' + v, n.id);
      }
      pinturasSinVariable(n);
    }
  }

  const plano = (g) => Object.fromEntries(
    Object.entries(g).sort((a, b) => b[1].n - a[1].n).slice(0, TOPE).map(([k, v]) => [k + ' ×' + v.n, v.ej]),
  );
  return {
    pagina: page && page.name,
    costuras: costuras.slice(0, TOPE),
    sinEstilo: plano(grupos.sinEstilo),
    menusApretados: menusApretados.slice(0, TOPE),
    camposAMano: camposAMano.slice(0, TOPE),
    retoques: plano(grupos.retoques),
    sinVariable: plano(grupos.sinVariable),
    fueraDelKit: plano(grupos.fueraDelKit),
    componentesFueraDelKit: plano(grupos.componentesFueraDelKit),
  };
}

/** El JavaScript para el fichero. La página (o el nodo) y los valores del Kit van como dato: no lee nada de fuera. */
export function scriptDeRevision(objetivo, kit = valoresDelKit()) {
  const patrones = COSTURAS.map((rx) => rx.toString()).join(', ');
  return `return await (${revisar.toString()})(figma, ${JSON.stringify(objetivo.trim())}, ${JSON.stringify(kit)}, [${patrones}]);`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const objetivo = process.argv[2];
  if (!objetivo) {
    console.error('Uso: node tools/figma-revision.mjs "<página del Supervisor>" | <nodo de una pantalla>');
    process.exit(2);
  }
  console.log(scriptDeRevision(objetivo));
}
