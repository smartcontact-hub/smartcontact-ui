/* CENSO COMPUTADO DEL ORIGINAL — solo lectura, para la paridad del Agent.
 * Pégalo en la consola (F12) de https://agent.smart-contact.com/aed/#/private,
 * en el estado que quieras medir. NO hace clics ni navega: solo lee el DOM
 * actual y descarga `original-census.ndjson`.
 * Produce el MISMO formato que tools/phase2-metrics.ts, así lo cruza compare-ndjson. */
(() => {
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const ordinals = new Map();
  const nodes = [];
  for (const el of document.body.querySelectorAll('*')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? '').join('').trim();
    const r = el.getBoundingClientRect();
    if (!own && r.width === 0 && r.height === 0) continue;
    const cs = getComputedStyle(el);
    const role = el.getAttribute('role') ?? el.tagName.toLowerCase();
    const base = `${role}:${hash(own)}`;
    const n = (ordinals.get(base) ?? 0) + 1; ordinals.set(base, n);
    nodes.push({
      key: `${base}#${n}`, tag: el.tagName.toLowerCase(),
      cls: typeof el.className === 'string' ? el.className : '',
      text: own.slice(0, 60),
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle, fontVariationSettings: cs.fontVariationSettings,
      fontOpticalSizing: cs.fontOpticalSizing, lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing, wordSpacing: cs.wordSpacing,
      textTransform: cs.textTransform, textWrap: cs.getPropertyValue('text-wrap'),
      webkitFontSmoothing: cs.getPropertyValue('-webkit-font-smoothing'),
      textRendering: cs.getPropertyValue('text-rendering'),
      fontFeatureSettings: cs.fontFeatureSettings, fontVariantNumeric: cs.fontVariantNumeric,
      color: cs.color,
      margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
      padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      gap: cs.gap,
      borderWidth: `${cs.borderTopWidth} ${cs.borderRightWidth} ${cs.borderBottomWidth} ${cs.borderLeftWidth}`,
      borderRadius: cs.borderRadius,
      rect: [Math.round(r.x * 100) / 100, Math.round(r.y * 100) / 100, Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100],
    });
  }
  const root = document.documentElement;
  const header = {
    kind: 'manifest', side: 'original', width: window.innerWidth, state: 'as-is',
    rootFontSize: getComputedStyle(root).fontSize, innerWidth: window.innerWidth,
    clientWidth: root.clientWidth, devicePixelRatio: window.devicePixelRatio,
    fonts: [...document.fonts].map((f) => ({ family: f.family, weight: f.weight, style: f.style, status: f.status })),
    manifest: { note: 'browser-console dump', href: location.href },
  };
  const body = [JSON.stringify(header), ...nodes.map((n) => JSON.stringify(n))].join('\n') + '\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'application/x-ndjson' }));
  a.download = 'original-census.ndjson'; a.click();
  console.log(`Censo listo: ${nodes.length} nodos, ancho ${window.innerWidth}px → original-census.ndjson (en Descargas)`);
})();
