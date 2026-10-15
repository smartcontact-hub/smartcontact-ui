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
});

test('WhatsApp: del HTML a sus marcas y de vuelta', () => {
  assert.equal(htmlAWhatsApp('<p>Hola <strong>Ana</strong>, <em>buenas</em> y <s>adiós</s></p>'), 'Hola *Ana*, _buenas_ y ~adiós~');
  assert.equal(htmlAWhatsApp('<p>Una</p><p>Dos<br>Tres</p>'), 'Una\nDos\nTres');
  // Los espacios de dentro salen de la marca: «* Ana*» no es negrita en WhatsApp.
  assert.equal(htmlAWhatsApp('<p>Hola<strong> Ana </strong>x</p>'), 'Hola *Ana* x');
  assert.equal(whatsAppAHtml('Hola *Ana*, _buenas_ y ~adiós~'), '<p>Hola <strong>Ana</strong>, <em>buenas</em> y <s>adiós</s></p>');
  assert.equal(whatsAppAHtml('Una\nDos'), '<p>Una</p><p>Dos</p>');
  // Una marca suelta o con espacios por dentro no es formato.
  assert.equal(whatsAppAHtml('2 * 3 = 6 y a_b_c'), '<p>2 * 3 = 6 y a_b_c</p>');
  assert.equal(whatsAppAHtml('<b>x</b> & y'), '<p>&lt;b&gt;x&lt;/b&gt; &amp; y</p>');
  const ida = 'Hola *Ana*\nAdiós _Luis_';
  assert.equal(htmlAWhatsApp(whatsAppAHtml(ida)), ida);
});

test('el contenido para el editor y para guardar, según el canal', () => {
  assert.equal(contenidoParaEditor('Hola, soy {agente}.', 'chat'), '<p>Hola, soy {agente}.</p>');
  assert.equal(contenidoParaEditor('<p>Hola</p>', 'email'), '<p>Hola</p>');
  assert.equal(contenidoParaEditor('Hola *Ana*', 'whatsapp'), '<p>Hola <strong>Ana</strong></p>');
  assert.equal(contenidoParaGuardar('<p>Hola <b>Ana</b></p>', 'whatsapp'), 'Hola *Ana*');
  assert.equal(contenidoParaGuardar('<p>Hola <b>Ana</b><script>x</script></p>', 'chat'), '<p>Hola <strong>Ana</strong></p>');
});

test('parsearPlantillasCsv: título;canal;contenido, cada error con su línea, y los títulos repetidos se saltan', () => {
  const csv = [
    'Título;Canal;Contenido',
    'Saludo;chat;Hola, soy {agente}.',
    'Aviso;WhatsApp;Hola *Ana*\\nHasta luego',
    ';chat;sin título',
    'Raro;fax;x',
    'Vacía;email;',
    'saludo;email;repetido',
  ].join('\n');
  const vista = parsearPlantillasCsv(csv, [{ title: 'Despedida' }]);
  assert.deepEqual(vista.nuevas, [
    { title: 'Saludo', type: 'chat', body: '<p>Hola, soy {agente}.</p>' },
    { title: 'Aviso', type: 'whatsapp', body: 'Hola *Ana*\nHasta luego' },
  ]);
  assert.deepEqual(vista.errores, [
    { linea: 4, motivo: 'titulo' },
    { linea: 5, motivo: 'canal' },
    { linea: 6, motivo: 'contenido' },
  ]);
  assert.equal(vista.repetidas, 1);
  assert.equal(parsearPlantillasCsv('A;chat;x\nB;chat;y', [], 1).sobran, 1);
  // El título que ya existe en la lista se salta.
  assert.equal(parsearPlantillasCsv('Despedida;chat;x', [{ title: 'despedida' }]).repetidas, 1);
  assert.ok(plantillaDePlantillasCsv(['Título', 'Canal', 'Contenido']).startsWith('﻿Título;Canal;Contenido'));
});
