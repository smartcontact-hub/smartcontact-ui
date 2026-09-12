import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:4321/#/components/datatable', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const m = await p.evaluate(() => {
  // ¿quién declara el tamaño del texto de la celda? Subo por el árbol buscando
  // la primera regla que lo fije, en vez de fiarme del computado a secas.
  const host = document.querySelector('sc-datatable:not(.sc-datatable--list)');
  const td = host?.querySelector('.p-datatable-tbody > tr > td');
  const th = host?.querySelector('.p-datatable-thead > tr > th');
  if (!td || !th) return { error: 'no encuentro la tabla por defecto' };
  const c = getComputedStyle(td), h = getComputedStyle(th);
  // el tamaño del documento, que es de quien se hereda cuando nadie lo declara
  const raiz = getComputedStyle(document.body).fontSize;
  const html = getComputedStyle(document.documentElement).fontSize;
  return {
    celda: `${c.fontSize}/${c.lineHeight} peso ${c.fontWeight}`,
    cabecera: `${h.fontSize}/${h.lineHeight} peso ${h.fontWeight}`,
    bodyDelDocumento: raiz, htmlDelDocumento: html,
  };
});
console.log(JSON.stringify(m, null, 1));
await b.close();
