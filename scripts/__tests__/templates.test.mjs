// El contenido de una plantilla (chat, correo y WhatsApp): sanearlo, pasarlo de HTML a las marcas de WhatsApp y volver, y
// leer el CSV de importar. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contenidoParaEditor,
  contenidoParaGuardar,
  contenidoVacio,
  htmlAWhatsApp,
  parsearPlantillasCsv,
  plantillaDePlantillasCsv,
  sanearHtml,
  textoPlano,
  whatsAppAHtml,
} from '../../projects/supervisor/src/app/features/admin/templates/state/templates.core.mjs';

test('textoPlano: sin etiquetas, una línea; la imagen en base64 de Voice no ensucia la tabla', () => {
  assert.equal(textoPlano('<p>Hola, <strong>Ana</strong></p><p>¿Qué tal?</p>'), 'Hola, Ana ¿Qué tal?');
  assert.equal(textoPlano('Texto de antes'), 'Texto de antes');
  assert.equal(textoPlano('<p><img src="data:image/png;base64,AAAA"></p>'), '');
  assert.equal(textoPlano('Tom &amp; Jerry &lt;3'), 'Tom & Jerry <3');
});

test('contenidoVacio: el editor vacío (<p><br></p>) cuenta como vacío', () => {
  assert.equal(contenidoVacio('<p><br></p>'), true);
  assert.equal(contenidoVacio(''), true);
  assert.equal(contenidoVacio('<p>a</p>'), false);
});

test('sanearHtml: solo las etiquetas del editor, sin atributos; ni scripts, ni imágenes, ni enlaces javascript:', () => {
  assert.equal(sanearHtml('<p onclick="x()">Hola <b>Ana</b></p>'), '<p>Hola <strong>Ana</strong></p>');
  assert.equal(sanearHtml('<p>a</p><script>alert(1)</script>'), '<p>a</p>');
  assert.equal(sanearHtml('<p>a<img src="data:image/png;base64,AAAA">b</p>'), '<p>ab</p>');
  assert.equal(sanearHtml('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
  assert.equal(
    sanearHtml('<a href="https://example.com" style="x">x</a>'),
    '<a href="https://example.com" rel="noopener noreferrer" target="_blank">x</a>',
  );
  // Lo que el editor no ofrece se queda sin su etiqueta, con su texto.
  assert.equal(sanearHtml('<h1>Título</h1><div>a</div>'), 'Títuloa');
  assert.equal(sanearHtml('Texto de antes'), 'Texto de antes');
  // Los `&nbsp;` del editor vuelven a ser espacios, para que el mensaje parta las líneas por sus palabras.
  assert.equal(sanearHtml('<p>Hola&nbsp;mundo&nbsp;a&nbsp;todos</p>'), '<p>Hola mundo a todos</p>');
  assert.equal(sanearHtml('<svg><script>alert(1)</script></svg>'), '');
  assert.equal(sanearHtml('<img src=x onerror=alert(1)>'), '');
});

test('WhatsApp: del HTML a sus marcas y de vuelta', () => {
  assert.equal(htmlAWhatsApp('<p>Hola <strong>Ana</strong>, <em>buenas</em> y <s>adiós</s></p>'), 'Hola *Ana*, _buenas_ y ~adiós~');
  assert.equal(whatsAppAHtml('Hola *Ana*, _buenas_ y ~adiós~'), '<p>Hola <strong>Ana</strong>, <em>buenas</em> y <s>adiós</s></p>');
});

test('contenidoParaEditor: rehidrata HTML sin devolver payloads peligrosos', () => {
  assert.equal(contenidoParaEditor('<p onclick="alert(1)">Hola</p>', 'chat'), '<p>Hola</p>');
  assert.equal(contenidoParaEditor('<script>alert(1)</script><p>OK</p>', 'chat'), '<p>OK</p>');
});

test('contenidoParaGuardar: el HTML del editor se guarda saneado', () => {
  assert.equal(contenidoParaGuardar('<p><strong>Hi</strong> <a href="javascript:alert(1)">x</a></p>', 'chat'), '<p><strong>Hi</strong> <a>x</a></p>');
});
