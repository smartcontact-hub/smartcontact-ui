import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://localhost:4321/#/components/datatable', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const leer = () => p.evaluate(() => {
  const g = (sel) => {
    const host = document.querySelector(sel);
    const td = host?.querySelector('.p-datatable-tbody > tr > td');
    if (!td) return 'no está';
    const c = getComputedStyle(td);
    return `${c.fontSize}/${c.lineHeight}`;
  };
  return {
    porDefecto: g('sc-datatable:not(.sc-datatable--list)'),
    list: g('sc-datatable.sc-datatable--list'),
    body: getComputedStyle(document.body).fontSize,
  };
});
console.log('ANTES  ', JSON.stringify(await leer()));
// el estímulo: cambio el tamaño del documento, como hace cada app
await p.evaluate(() => { document.body.style.fontSize = '20px'; });
await p.waitForTimeout(300);
console.log('DESPUÉS', JSON.stringify(await leer()));
await b.close();
