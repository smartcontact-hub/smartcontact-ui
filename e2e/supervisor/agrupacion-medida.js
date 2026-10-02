/**
 * MEDIDA DE AGRUPACIÓN — se inyecta en la página (`addInitScript`) y deja `window.__medirAgrupacion`.
 *
 * Mide la regla de la escalera 7 · 14 · 28 (DD-123, AGENTS §«UX de pantalla» 9) sobre las cajas
 * RENDERIZADAS, no sobre el SCSS: la relación entre una etiqueta, su control y el botón que los
 * envía solo existe en el render (márgenes que se funden, envoltorios en línea, `display: contents`).
 *
 *   R1 · campo apilado: el hueco con el campo de ENCIMA (misma columna) mide al menos el doble que
 *        el de su etiqueta a su control.
 *   R2 · opciones en fila (radio o casilla con su texto): el hueco entre dos opciones mide al menos
 *        el doble que el del control a su propio texto.
 *   R3 · botón que envía: en un formulario o diálogo, el hueco del último campo al botón principal
 *        mide al menos el doble que el hueco más pequeño entre sus campos.
 *   R4 · aire que se suma: de su borde a lo primero y lo último que tiene dentro, una caja (`sc-section-card`,
 *        `sc-panel`) mide su relleno y nada más. Lo que apilan los envoltorios de dentro (márgenes, rellenos)
 *        no llega al peldaño más pequeño, 7 (DD-125). Validado contra el build anterior a DD-125: marcaba los
 *        12,25 de la última fila de «Políticas de contraseñas», y con el arreglo, nada.
 *
 * Devuelve un par por relación medida: `{ regla, ok, etiqueta, vecino, dentro, entre }` (px).
 *
 * Lo usan `agrupacion.spec.ts` (la prueba) y `scripts/revision-pantalla.mjs` (la revisión previa
 * a enseñar una pantalla). Validado el 2026-09-27 contra casos medidos a mano: los tres rojos
 * conocidos entonces (fila de «Mostrar en el aviso», sus dos radios y el botón del acceso) salían
 * rojos, y los dos verdes (las casillas de «Ventana de conversaciones» y los campos del acceso),
 * verdes. Dos trampas que dieron rojos falsos en la primera versión y que el código de abajo
 * esquiva: la etiqueta de los campos del DS vive en un `sc-field-label` con `display: contents`
 * (sin caja propia), y `sc-textarea` es un elemento EN LÍNEA cuya caja no coincide con lo que se ve.
 */
window.__medirAgrupacion = () => {
  /** Holgura de medio píxel: el redondeo de subpíxel no es una decisión de diseño. */
  const TOL = 0.6;
  /** Por encima de esto, dos campos no son vecinos: hay otra cosa entre ellos. */
  const MAX_VECINOS = 120;

  const cajaPropia = (e) => e.getBoundingClientRect();
  /** Un envoltorio en línea (o `display: contents`) mide por la unión de sus hijos visibles. */
  const caja = (e) => {
    const d = getComputedStyle(e).display;
    if (d !== 'inline' && d !== 'contents') return cajaPropia(e);
    const hijas = [...e.querySelectorAll('*')]
      .filter((c) => {
        const b = cajaPropia(c);
        return b.width > 0 && b.height > 0 && getComputedStyle(c).visibility !== 'hidden';
      })
      .map(cajaPropia);
    if (!hijas.length) return cajaPropia(e);
    const top = Math.min(...hijas.map((b) => b.top));
    const bottom = Math.max(...hijas.map((b) => b.bottom));
    const left = Math.min(...hijas.map((b) => b.left));
    const right = Math.max(...hijas.map((b) => b.right));
    return { top, bottom, left, right, width: right - left, height: bottom - top };
  };
  const visible = (e) => {
    if (!(e instanceof Element)) return false;
    const r = caja(e);
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(e);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  /** Hijos con caja; los `display: contents` cuentan por sus propios hijos. */
  const hijosVisibles = (e) => {
    const out = [];
    for (const c of e.children) {
      if (getComputedStyle(c).display === 'contents') out.push(...hijosVisibles(c));
      else if (visible(c)) out.push(c);
    }
    return out;
  };
  const texto = (e) => (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const redondo = (n) => Math.round(n * 100) / 100;

  const CONTROL = [
    'input:not([type=hidden])', 'textarea', 'select', '[role=combobox]', '[role=radiogroup]',
    '[role=listbox]', '[role=switch]', '[role=spinbutton]', '.p-select', '.p-multiselect',
    '.p-inputtext', '.p-toggleswitch', '.p-inputnumber', '.p-datepicker', '.p-selectbutton',
    '.p-editor', '.p-autocomplete', '.p-password', '.p-textarea',
  ].join(', ');
  const esEtiqueta = (e) =>
    e.matches('label, sc-field-label, legend, .field__label, [class*="field-label"], [class*="__label"]');

  const raiz = document.querySelector('main#main-content') || document.querySelector('main') || document.body;
  const dialogos = [...new Set(document.querySelectorAll('.p-dialog, [role="dialog"]'))].filter(visible);
  const zonas = [raiz, ...dialogos];

  // ── R1 · unidades de campo: una etiqueta ENCIMA de su control ──────────────────────────────────
  const unidades = [];
  for (const zona of zonas) {
    for (const e of zona.querySelectorAll('*')) {
      if (e.closest('table') || unidades.some((u) => u.el === e) || !visible(e)) continue;
      const hijos = hijosVisibles(e);
      if (hijos.length < 2) continue;
      const [etiqueta, envoltorio] = hijos;
      if (!esEtiqueta(etiqueta)) continue;
      const control = envoltorio.matches(CONTROL) ? envoltorio : envoltorio.querySelector(CONTROL);
      if (!control) continue;
      const a = caja(etiqueta);
      const b = caja(visible(control) ? control : envoltorio);
      if (a.bottom > b.top + 1) continue; // etiqueta al lado del control: es otro patrón
      unidades.push({ el: e, etiqueta: texto(etiqueta), dentro: b.top - a.bottom, r: caja(e) });
    }
  }
  const r1 = [];
  const pares = [];
  for (const u of unidades) {
    let mejor = null;
    for (const v of unidades) {
      if (v === u || v.el.contains(u.el) || u.el.contains(v.el)) continue;
      if (Math.abs(v.r.left - u.r.left) > 2) continue;
      const d = u.r.top - v.r.bottom;
      if (d < -0.5) continue;
      if (!mejor || d < mejor.d) mejor = { v, d };
    }
    if (!mejor || mejor.d > MAX_VECINOS) continue;
    pares.push({ u, v: mejor.v, d: mejor.d });
    r1.push({
      regla: 'R1',
      ok: mejor.d + TOL >= 2 * u.dentro,
      etiqueta: u.etiqueta,
      vecino: mejor.v.etiqueta,
      dentro: redondo(u.dentro),
      entre: redondo(mejor.d),
    });
  }

  // ── R2 · opciones en fila: la caja VISIBLE del control y su texto en la misma línea ──────────────
  const opciones = [];
  for (const c of document.querySelectorAll('.p-radiobutton-box, .p-checkbox-box, .tri-checkbox__box')) {
    if (!visible(c) || c.closest('table, .p-datatable, [role="grid"]')) continue;
    let a = c.parentElement;
    for (let pasos = 0; a && pasos < 4 && !(a.innerText || '').trim(); pasos++) a = a.parentElement;
    if (!a || !visible(a) || a.matches('td, tr, th')) continue;
    const t = (a.innerText || '').trim();
    if (!t || t.length > 90) continue;
    const trozos = [];
    const paseo = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    for (let n = paseo.nextNode(); n; n = paseo.nextNode()) {
      if (!n.textContent.trim() || c.contains(n)) continue;
      const rango = document.createRange();
      rango.selectNodeContents(n);
      for (const q of rango.getClientRects()) if (q.width > 0) trozos.push(q);
    }
    const cr = caja(c);
    const centro = (cr.top + cr.bottom) / 2;
    const linea = trozos.filter((q) => Math.abs((q.top + q.bottom) / 2 - centro) < 12);
    if (!linea.length) continue;
    const tl = Math.min(...linea.map((q) => q.left));
    const tr = Math.max(...linea.map((q) => q.right));
    if (tl < cr.right - 1) continue; // texto a la izquierda del control: otro patrón
    opciones.push({ a, cr, tl, tr, texto: t.slice(0, 40) });
  }
  const antecesorComun = (x, y) => {
    const suyos = new Set();
    for (let n = x; n; n = n.parentElement) suyos.add(n);
    for (let n = y; n; n = n.parentElement) if (suyos.has(n)) return n;
    return null;
  };
  const saltos = (desde, hasta) => {
    let d = 0;
    for (let n = desde; n && n !== hasta; n = n.parentElement) d++;
    return d;
  };
  const r2 = [];
  for (const x of opciones) {
    const aLaDerecha = opciones.filter((y) => y !== x && Math.abs(y.cr.top - x.cr.top) <= 4 && y.cr.left >= x.tr - 0.5);
    if (!aLaDerecha.length) continue;
    const y = aLaDerecha.reduce((m, q) => (q.cr.left < m.cr.left ? q : m));
    const comun = antecesorComun(x.a, y.a);
    if (!comun || saltos(x.a, comun) > 3 || saltos(y.a, comun) > 3) continue; // no son del mismo grupo
    const dentro = Math.max(x.tl - x.cr.right, y.tl - y.cr.right);
    const entre = y.cr.left - x.tr;
    r2.push({ regla: 'R2', ok: entre + TOL >= 2 * dentro, etiqueta: x.texto, vecino: y.texto, dentro: redondo(dentro), entre: redondo(entre) });
  }

  // ── R3 · el botón principal tras el último campo ──────────────────────────────────────────────
  const contenedores = [
    ...dialogos.filter((d) => !dialogos.some((o) => o !== d && o.contains(d))),
    ...[...document.querySelectorAll('form')].filter((f) => visible(f) && !dialogos.some((d) => d.contains(f))),
  ];
  const r3 = [];
  for (const f of contenedores) {
    const propias = unidades.filter((u) => f.contains(u.el) && !unidades.some((w) => w !== u && u.el.contains(w.el)));
    if (!propias.length) continue;
    const ultimo = propias.reduce((m, u) => (u.r.bottom > m.r.bottom ? u : m));
    const botones = [...f.querySelectorAll('button, .p-button')].filter(
      (b) =>
        visible(b) &&
        b.matches('[type="submit"], .p-button') &&
        !b.closest('.p-dialog-header, [role="tablist"], .p-inputgroup, .p-password, .p-select, .p-datepicker') &&
        !b.matches('.p-button-text, .p-button-link, .p-button-outlined, .p-button-secondary') &&
        caja(b).top >= ultimo.r.bottom - 0.5,
    );
    if (!botones.length) continue;
    const boton = botones.reduce((m, x) => (caja(x).top < caja(m).top ? x : m));
    const hueco = caja(boton).top - ultimo.r.bottom;
    const entreCampos = pares.filter((p) => f.contains(p.u.el) && f.contains(p.v.el)).map((p) => p.d);
    const referencia = entreCampos.length ? Math.min(...entreCampos) : ultimo.dentro;
    r3.push({ regla: 'R3', ok: hueco + TOL >= 2 * referencia, etiqueta: ultimo.etiqueta, vecino: texto(boton), dentro: redondo(referencia), entre: redondo(hueco) });
  }

  // ── R4 · aire que se suma: de su borde a lo primero y lo último que tiene dentro, una caja mide su relleno ──
  // Se recorre el camino de la parte propia de la caja (cabecera, cuerpo) hasta la primera y la última hoja, y se
  // suma lo que añade cada envoltorio intermedio: su margen (el que de verdad desplaza, no el hueco libre de una
  // rejilla o de un `justify-content`), su borde y su relleno. El relleno de la caja es suyo y no cuenta.
  /* Por debajo del peldaño más pequeño de la escalera no hay separación que competir: los 3,5 de `.checkbox-row`
   * agrandan la zona que se pulsa, no separan nada. De 7 en adelante, sí. */
  const PELDANO_MIN = 7;
  const CAJAS = [
    { sel: 'section.section-card', partes: ['.section-card__head', '.section-card__body'] },
    { sel: '.p-panel', partes: ['.p-panel-header', '.p-panel-content', '.p-panel-footer'] },
  ];
  const px = (v) => parseFloat(v) || 0;
  /** Lo primero o lo último que se VE por ese lado: un control, una imagen, un texto, un fondo, o un borde EN ESE LADO
   *  (una fila con raya arriba no tiene límite abajo: su relleno de abajo es aire, y se sigue bajando). */
  const esHoja = (e, lado) => {
    if (e.matches(`${CONTROL}, button, a, img, svg, canvas, video, sc-icon, table, tr, hr, [role="img"], [role="progressbar"]`)) return true;
    const cs = getComputedStyle(e);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') return true;
    const l = lado === 'arriba' ? 'Top' : 'Bottom';
    if (px(cs[`border${l}Width`]) > 0 && cs[`border${l}Style`] !== 'none') return true;
    return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  };
  const enFlujo = (e) => !['absolute', 'fixed'].includes(getComputedStyle(e).position) && getComputedStyle(e).opacity !== '0';
  const apilado = (parte, lado) => {
    const arriba = lado === 'arriba';
    let suma = 0;
    const cadena = [];
    let e = parte;
    for (let i = 0; i < 25; i++) {
      const hijos = hijosVisibles(e).filter(enFlujo);
      if (!hijos.length) break;
      const c = arriba
        ? hijos.reduce((m, x) => (caja(x).top < caja(m).top ? x : m))
        : hijos.reduce((m, x) => (caja(x).bottom > caja(m).bottom ? x : m));
      const pcs = getComputedStyle(e);
      const ccs = getComputedStyle(c);
      const borde = arriba
        ? cajaPropia(e).top + px(pcs.borderTopWidth) + px(pcs.paddingTop)
        : cajaPropia(e).bottom - px(pcs.borderBottomWidth) - px(pcs.paddingBottom);
      const desplaza = arriba ? caja(c).top - borde : borde - caja(c).bottom;
      const margen = Math.max(0, Math.min(desplaza, px(arriba ? ccs.marginTop : ccs.marginBottom)));
      const hoja = esHoja(c, lado);
      const propio = hoja ? 0 : px(arriba ? ccs.borderTopWidth : ccs.borderBottomWidth) + px(arriba ? ccs.paddingTop : ccs.paddingBottom);
      if (margen + propio > 0.5) cadena.push(`${c.tagName.toLowerCase()}.${String(c.className).split(' ')[0]}+${redondo(margen + propio)}`);
      suma += margen + propio;
      if (hoja) break;
      e = c;
    }
    return { suma: redondo(suma), cadena };
  };
  const r4 = [];
  for (const { sel, partes } of CAJAS) {
    for (const box of raiz.querySelectorAll(sel)) {
      if (!visible(box)) continue;
      const propias = partes.flatMap((p) => [...box.querySelectorAll(p)]).filter((p) => visible(p) && p.closest(sel) === box);
      if (!propias.length) continue;
      const primera = propias.reduce((m, x) => (caja(x).top < caja(m).top ? x : m));
      const ultima = propias.reduce((m, x) => (caja(x).bottom > caja(m).bottom ? x : m));
      const titulo = texto(box.querySelector('.section-card__title, .p-panel-title, h1, h2, h3') || box);
      for (const [lado, parte] of [['arriba', primera], ['abajo', ultima]]) {
        const { suma, cadena } = apilado(parte, lado);
        r4.push({ regla: 'R4', ok: suma < PELDANO_MIN - TOL, etiqueta: `${titulo} (${lado})`, vecino: cadena.join(' ') || '—', dentro: 0, entre: suma });
      }
    }
  }

  const vistos = new Set();
  return [...r1, ...r2, ...r3, ...r4].filter((p) => {
    const k = [p.regla, p.etiqueta, p.vecino, p.dentro, p.entre].join('|');
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
};
