#!/usr/bin/env node
/**
 * Pinta la portada del README (`docs/readme/`), en castellano e inglés, en claro y oscuro.
 *
 * No es una captura de sc-docs: a la anchura del README (unos 880 px) la cabecera de la web se lee pequeña y lleva
 * menú, botones y tarjetas que allí no sirven. Toma sus piezas —la forma en degradado de la portada, el isotipo de la
 * línea al volumen de la tarjeta de Fundamentos, Poppins en su corte de logotipo— y las compone para presentar el
 * repo: qué es y qué paquetes trae, en letra que se lee a esa anchura. Los colores son los primitivos del Kit
 * (`01-primitive.css`), escritos aquí porque la página se pinta suelta, sin la hoja de tokens.
 *
 * Uso: `node tools/readme-portada.mjs` (Playwright con Chromium; `PW_EXE=<ruta>` si el Chromium de la versión
 * instalada no está descargado).
 */
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = (f) => pathToFileURL(join(raiz, 'node_modules/@fontsource', f)).href;

const ANCHO = 1280;
const ALTO = 540;

/** Primitivos del Kit (`01-primitive.css`) y los semánticos de fondo y texto que los usan en cada tema. */
const COLOR = {
  cian100: '#d2f5f9',
  cian300: '#7be1ef',
  cielo500: '#1464fe',
  cielo700: '#0a3ba0',
  esmeralda300: '#6ee7b7',
  claro: { fondo: '#f7f8fa', texto: '#181d26', secundario: '#4f5663', pastilla: '#ffffff', borde: '#dadfe6' },
  oscuro: { fondo: '#09090b', texto: '#ffffff', secundario: '#a1a1aa', pastilla: '#18181b', borde: '#3f3f46' },
};

const TEXTO = {
  es: {
    lema: 'Componentes Angular sobre PrimeNG, con un tema en el que cada valor sale del Kit de Figma.',
    paquetes: 'Tres paquetes',
  },
  en: {
    lema: 'Angular components on top of PrimeNG, with a theme where every value comes from the Figma Kit.',
    paquetes: 'Three packages',
  },
};

/** El isotipo: cuatro círculos y dos puentes, en el trazado del favicon de sc-docs. */
const ISOTIPO = `
  <path d="M37.703 0C50.8156 0 61.4453 10.6256 61.4453 23.7332C61.4453 36.839 50.8156 47.4647 37.703 47.4647C24.5905 47.4647 13.9624 36.839 13.9624 23.7332C13.9624 10.6256 24.5905 0 37.703 0Z"/>
  <path d="M93.1898 8.01218C101.921 8.01218 109 15.0882 109 23.8165C109 32.5466 101.921 39.6225 93.1898 39.6225C84.458 39.6225 77.3793 32.5466 77.3793 23.8165C77.3793 15.0882 84.458 8.01218 93.1898 8.01218Z"/>
  <path d="M71.2952 97.4189C58.1827 97.4189 47.5546 86.7933 47.5546 73.6874C47.5546 60.5798 58.1827 49.9542 71.2952 49.9542C84.4078 49.9542 95.0358 60.5798 95.0358 73.6874C95.0358 86.7933 84.4078 97.4189 71.2952 97.4189Z"/>
  <path d="M15.8104 89.3982C7.07869 89.3982 0 82.3222 0 73.5939C0 64.8638 7.07869 57.7879 15.8104 57.7879C24.5421 57.7879 31.6208 64.8638 31.6208 73.5939C31.6208 82.3222 24.5421 89.3982 15.8104 89.3982Z"/>
  <path fill-opacity=".45" d="M71.6506 15.536C66.4333 15.536 61.6258 13.8336 57.7066 10.9819C60.0628 14.6681 61.4453 19.0358 61.4453 23.7332C61.4453 28.074 60.2594 32.1299 58.2231 35.6312C62.0424 33.0061 66.6649 31.4653 71.6506 31.4653C74.7684 31.4653 77.7395 32.0816 80.4673 33.1743C78.5344 30.5524 77.3793 27.3212 77.3793 23.8165C77.3793 19.8754 78.831 16.2806 81.2172 13.5138C78.2877 14.8064 75.0567 15.536 71.6506 15.536Z"/>
  <path fill-opacity=".45" d="M37.3499 81.8761C42.5672 81.8761 47.3753 83.5791 51.293 86.4308C48.9367 82.7463 47.5546 78.3847 47.5546 73.6874C47.5546 69.3449 48.7411 65.2806 50.7774 61.7809C46.9581 64.4044 42.3356 65.9469 37.3499 65.9469C34.2321 65.9469 31.261 65.3289 28.5332 64.2378C30.4661 66.858 31.6208 70.0892 31.6208 73.5939C31.6208 77.5366 30.1695 81.1299 27.7833 83.8983C30.7128 82.6057 33.9438 81.8761 37.3499 81.8761Z"/>`;

/** La tarjeta de Fundamentos de sc-docs: el logo en trazo, en plano y con volumen. */
const marca = (paso) => {
  const estilo = [
    `fill="none" stroke="var(--secundario)" stroke-width="1.5"`,
    `fill="${COLOR.cielo500}"`,
    `fill="url(#esfera)" filter="url(#sombra)"`,
  ][paso];
  return `<svg class="marca" viewBox="-4 -4 118 108">
    <circle cx="38" cy="24" r="22" ${estilo}/><circle cx="93" cy="24" r="15" ${estilo}/>
    <circle cx="71" cy="74" r="22" ${estilo}/><circle cx="16" cy="74" r="15" ${estilo}/></svg>`;
};

const pagina = (idioma, tema) => {
  const c = COLOR[tema];
  const t = TEXTO[idioma];
  return `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8"><style>
@font-face { font-family: 'Poppins'; font-weight: 600; src: url('${fuente('poppins/files/poppins-latin-600-normal.woff2')}'); }
@font-face { font-family: 'Poppins Fina'; font-style: italic; src: url('${fuente('poppins/files/poppins-latin-300-italic.woff2')}'); }
@font-face { font-family: 'Inter'; font-weight: 400; src: url('${fuente('inter/files/inter-latin-400-normal.woff2')}'); }
@font-face { font-family: 'Inter'; font-weight: 500; src: url('${fuente('inter/files/inter-latin-500-normal.woff2')}'); }
@font-face { font-family: 'JetBrains Mono'; src: url('${fuente('jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2')}'); }
:root { --texto: ${c.texto}; --secundario: ${c.secundario}; }
* { box-sizing: border-box; margin: 0; }
body { width: ${ANCHO}px; height: ${ALTO}px; overflow: hidden; position: relative; background: ${c.fondo};
  font-family: 'Inter', sans-serif; color: var(--texto); -webkit-font-smoothing: antialiased; }
.forma { position: absolute; top: 0; right: 0; width: 600px; height: auto; }
.marcas { position: absolute; right: 72px; bottom: 56px; display: flex; gap: 28px; }
.marca { width: 76px; height: auto; overflow: visible; }
.texto { position: absolute; left: 88px; top: 0; bottom: 0; width: 680px; display: flex; flex-direction: column;
  justify-content: center; }
.isotipo { width: 52px; height: auto; fill: var(--texto); margin-bottom: 28px; }
h1 { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 76px; line-height: 1.02; letter-spacing: -0.02em; }
h1 em { display: block; font-family: 'Poppins Fina', sans-serif; font-style: italic; font-weight: normal;
  color: var(--secundario); letter-spacing: -0.01em; }
.lema { margin-top: 24px; font-size: 26px; line-height: 1.4; max-width: 600px; }
.paquetes { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 10px; }
.paquete { font-family: 'JetBrains Mono', monospace; font-size: 17px; padding: 7px 14px; border-radius: 999px;
  background: ${c.pastilla}; border: 1px solid ${c.borde}; color: var(--texto); }
</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs>
  <radialGradient id="esfera" cx="0.32" cy="0.3" r="0.8">
    <stop offset="0" stop-color="${COLOR.cian100}"/><stop offset="0.28" stop-color="${COLOR.cian300}"/>
    <stop offset="0.7" stop-color="${COLOR.cielo500}"/><stop offset="1" stop-color="${COLOR.cielo700}"/>
  </radialGradient>
  <radialGradient id="lima" cx="0.4" cy="0.6" r="0.6">
    <stop offset="0" stop-color="${COLOR.esmeralda300}"/><stop offset="0.6" stop-color="${COLOR.cian300}" stop-opacity="0.9"/>
    <stop offset="1" stop-color="${COLOR.cielo500}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="cristal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${COLOR.cian300}" stop-opacity="0.85"/><stop offset="1" stop-color="${COLOR.cielo500}" stop-opacity="0.75"/>
  </linearGradient>
  <filter id="sombra" x="-30%" y="-30%" width="160%" height="170%">
    <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0a3ba0" flood-opacity="0.22"/>
  </filter>
</defs></svg>
<svg class="forma" viewBox="0 0 420 260" aria-hidden="true">
  <circle cx="300" cy="70" r="150" fill="url(#esfera)"/>
  <rect x="70" y="-60" width="230" height="200" rx="28" transform="rotate(-16 185 40)" fill="url(#cristal)"/>
  <circle cx="230" cy="120" r="70" fill="url(#lima)" opacity="0.85"/>
</svg>
<div class="marcas">${marca(0)}${marca(1)}${marca(2)}</div>
<div class="texto">
  <svg class="isotipo" viewBox="0 0 109 98" aria-hidden="true">${ISOTIPO}</svg>
  <h1>SmartContact <em>Design System</em></h1>
  <p class="lema">${t.lema}</p>
  <div class="paquetes" aria-label="${t.paquetes}">
    <span class="paquete">@smartcontact-hub/components</span>
    <span class="paquete">/styles</span>
    <span class="paquete">/icons</span>
  </div>
</div>
</body></html>`;
};

const SALIDAS = [
  ['es', 'claro', 'portada-claro.png'],
  ['es', 'oscuro', 'portada-oscuro.png'],
  ['en', 'claro', 'cover-light.png'],
  ['en', 'oscuro', 'cover-dark.png'],
];

const destino = join(raiz, 'docs/readme');
const temporal = join(raiz, 'docs/readme/.html');
mkdirSync(temporal, { recursive: true });
const navegador = await chromium.launch(process.env.PW_EXE ? { executablePath: process.env.PW_EXE } : {});
try {
  const p = await navegador.newPage({ viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 2 });
  for (const [idioma, tema, nombre] of SALIDAS) {
    const html = join(temporal, `${nombre}.html`);
    writeFileSync(html, pagina(idioma, tema));
    await p.goto(pathToFileURL(html).href);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(destino, nombre) });
    console.log(`✓ docs/readme/${nombre}`);
  }
} finally {
  await navegador.close();
  rmSync(temporal, { recursive: true, force: true });
}
