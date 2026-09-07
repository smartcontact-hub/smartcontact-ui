import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chequear,
  esDominioDeFiccion,
  extraerCorreos,
  extraerTelefonos,
  normalizarTelefono,
  TELEFONOS_PERMITIDOS,
} from '../audit-seed-pii.mjs';

// Las cuatro funciones son PURAS sobre el texto → fixtures directos, sin tocar el disco.
// Se prueban en los ejes que producen falsos positivos y falsos negativos, que en un guardián
// de datos personales son asimétricos: un falso negativo publica el dato de una persona.

test('teléfonos: coge móvil (6/7) y fijo (8/9) de 9 dígitos', () => {
  const t = "const a = '676000111'; const b = '910222333'; const c = '722334455'; const d = '812345678';";
  assert.deepEqual(extraerTelefonos(t).sort(), ['676000111', '722334455', '812345678', '910222333']);
});

test('teléfonos: `+34 600…` y `600…` son el MISMO valor, no dos', () => {
  assert.equal(normalizarTelefono('+34600112233'), '600112233');
  assert.equal(normalizarTelefono('+34 600112233'), '600112233');
  assert.equal(normalizarTelefono('+34-600112233'), '600112233');
  assert.deepEqual(extraerTelefonos("'+34 600112233' y '600112233'"), ['600112233']);
});

test('teléfonos: los pilla CON SEPARADORES, que es como se escapó uno de verdad', () => {
  // El eje que falló en la primera versión del gate: uno de los teléfonos de la extracción
  // sobrevivió a la limpieza del 2026-09-07 ESCRITO CON ESPACIOS, porque la regla solo miraba 9
  // dígitos seguidos. Las tres formas tienen que ser UN valor. El fixture es un número neutro:
  // el de verdad no se vuelve a escribir aquí, que es justo lo que este gate persigue.
  assert.deepEqual(extraerTelefonos("'666 777 888'"), ['666777888']);
  assert.deepEqual(extraerTelefonos("'666-777-888'"), ['666777888']);
  assert.deepEqual(extraerTelefonos("'+34 666 777 888' y '666777888'"), ['666777888']);
});

test('teléfonos: el PUNTO no separa — los decimales de un SVG no son teléfonos', () => {
  // Medido el 2026-09-07: admitir el punto daba dos falsos positivos en app-icon.component.ts,
  // donde el `d=` lleva decimales pegados. Un `d` de SVG no puede poner el gate en rojo.
  const d = 'M1,0,0,0,2.556.6c.318.026.629.046.952.046a6.973,6.97';
  assert.deepEqual(extraerTelefonos(d), []);
});

test('teléfonos: NO confunde con números de más o menos dígitos', () => {
  // 8 dígitos, 10 dígitos y un id largo: nada de eso es un teléfono español.
  assert.deepEqual(extraerTelefonos("'61122334' '6112233445' '1757251200'"), []);
});

test('teléfonos: los de prefijo 0-5 no son españoles y no se marcan', () => {
  assert.deepEqual(extraerTelefonos("'112345678' '512345678'"), []);
});

test('correos: los de dominio de ficción del RFC no hacen falta declararlos', () => {
  for (const d of ['example.com', 'example.net', 'example.org', 'foo.test', 'bar.invalid']) {
    assert.equal(esDominioDeFiccion(d), true, d);
  }
  assert.deepEqual(extraerCorreos("'ana@example.com' 'e2e.usuario@smartcontact.test'"), []);
});

test('correos: un dominio REAL sí sale, aunque el nombre parezca de mentira', () => {
  // El eje que importa: `company.com` está registrado, así que no es ficción por RFC.
  assert.deepEqual(extraerCorreos("'mperez@company.com'"), ['mperez@company.com']);
  assert.deepEqual(extraerCorreos("'alguien@gmail.com'"), ['alguien@gmail.com']);
});

test('chequear: un valor NO declarado es un problema, con su fichero', () => {
  const encontrados = new Map([['638274915', new Set(['projects/x/src/seed.ts'])]]);
  const problemas = chequear(encontrados, new Map(), 'Teléfono');
  assert.equal(problemas.length, 1);
  assert.match(problemas[0][0], /638274915/);
  assert.match(problemas[0][1], /projects\/x\/src\/seed\.ts/);
});

test('chequear: un valor declarado NO es un problema', () => {
  const encontrados = new Map([['600112233', new Set(['projects/x/src/seed.ts'])]]);
  const permitidos = new Map([['600112233', 'inventado']]);
  assert.deepEqual(chequear(encontrados, permitidos, 'Teléfono'), []);
});

test('chequear: la lista no se pudre — un declarado que ya no aparece también canta', () => {
  const permitidos = new Map([['600112233', 'inventado']]);
  const problemas = chequear(new Map(), permitidos, 'Teléfono');
  assert.equal(problemas.length, 1);
  assert.match(problemas[0][0], /ya no aparece/);
});

test('la lista de permitidos no tiene entradas sin motivo escrito', () => {
  // Un permitido sin motivo es un «lo añadí para que dejara de dar la lata», que es justo el
  // fallo que este gate previene. La columna de motivo es la pregunta, no un adorno.
  for (const [tel, motivo] of TELEFONOS_PERMITIDOS) {
    assert.ok(motivo && motivo.trim().length > 3, `${tel} está permitido sin motivo`);
  }
});
