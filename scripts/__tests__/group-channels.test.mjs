/**
 * Tests de las reglas de canales de grupo
 * (`projects/supervisor/src/app/features/admin/services/group-channels.core.mjs`). Puro, node:test,
 * dentro del gate (`test:unit`).
 *
 * Contratos clave: Chat es la madre de Web Chat (`chat`) y WhatsApp; un enlace con `minOne` no se
 * queda sin canales; y lo que no cambia devuelve el MISMO objeto (sin cambios falsos).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalizeChannels,
  channelRemovalImpact,
  clampLinksToChannels,
  familyOf,
  hasChatFamily,
  isLastChannel,
  newLinkFor,
  toggleChatFamily,
  toggleGroupChannel,
  toggleLinkChannel,
} from '../../projects/supervisor/src/app/features/admin/services/group-channels.core.mjs';

test('canonicalizeChannels: sin repetidos y en el orden teléfono → chat → whatsapp → email', () => {
  assert.deepEqual(canonicalizeChannels(['email', 'whatsapp', 'phone', 'email', 'chat']), ['phone', 'chat', 'whatsapp', 'email']);
  assert.deepEqual(canonicalizeChannels([]), []);
});

test('familyOf: Web Chat y WhatsApp son Chat', () => {
  assert.equal(familyOf('chat'), 'chat');
  assert.equal(familyOf('whatsapp'), 'chat');
  assert.equal(familyOf('phone'), 'phone');
  assert.equal(familyOf('email'), 'email');
  assert.equal(hasChatFamily(['phone', 'whatsapp']), true);
  assert.equal(hasChatFamily(['phone', 'email']), false);
});

test('toggleGroupChannel: pone y quita un canal sin tocar el resto', () => {
  assert.deepEqual([...toggleGroupChannel(['phone'], 'email')].sort(), ['email', 'phone']);
  assert.deepEqual([...toggleGroupChannel(['phone', 'email'], 'phone')], ['email']);
});

test('toggleChatFamily: encender Chat enciende sus dos subcanales; apagarlo, los apaga', () => {
  assert.deepEqual(canonicalizeChannels([...toggleChatFamily(['phone'])]), ['phone', 'chat', 'whatsapp']);
  assert.deepEqual([...toggleChatFamily(['phone', 'chat', 'whatsapp'])], ['phone']);
  // Con solo uno de los dos, Chat está encendido: el gesto lo apaga entero.
  assert.deepEqual([...toggleChatFamily(['whatsapp', 'email'])], ['email']);
});

test('clampLinksToChannels: recorta a lo que ofrece el grupo y no clona lo que no cambia', () => {
  const intact = { agentId: 1, channels: ['phone'] };
  const trimmed = { agentId: 2, channels: ['phone', 'email'] };
  const out = clampLinksToChannels([intact, trimmed], ['phone', 'chat']);
  assert.equal(out[0], intact);
  assert.deepEqual(out[1].channels, ['phone']);
  assert.equal(out[1].agentId, 2);
});

test('toggleLinkChannel: añade en orden canónico y quita', () => {
  const link = { agentId: 1, channels: ['email'] };
  assert.deepEqual(toggleLinkChannel(link, 'phone').channels, ['phone', 'email']);
  assert.deepEqual(toggleLinkChannel({ ...link, channels: ['phone', 'email'] }, 'phone').channels, ['email']);
});

test('toggleLinkChannel con minOne: el último canal no se quita (y devuelve el mismo enlace)', () => {
  const last = { agentId: 1, channels: ['whatsapp'] };
  assert.equal(isLastChannel(last, 'whatsapp'), true);
  assert.equal(toggleLinkChannel(last, 'whatsapp', { minOne: true }), last);
  // Sin minOne (lo de hoy) sí se queda vacío.
  assert.deepEqual(toggleLinkChannel(last, 'whatsapp').channels, []);
  // Con dos, minOne deja quitar uno.
  assert.deepEqual(toggleLinkChannel({ agentId: 1, channels: ['phone', 'whatsapp'] }, 'phone', { minOne: true }).channels, ['whatsapp']);
});

test('newLinkFor: todos los canales del grupo, habilitado, y nivel solo si se pide', () => {
  assert.deepEqual(newLinkFor({ agentId: 7, groupId: 3, groupChannels: ['email', 'phone'] }), {
    agentId: 7,
    groupId: 3,
    channels: ['phone', 'email'],
    active: true,
  });
  assert.equal(newLinkFor({ agentId: 7, groupId: 3, groupChannels: ['phone'], level: 1 }).level, 1);
  assert.equal('level' in newLinkFor({ agentId: 7, groupId: 3, groupChannels: ['phone'] }), false);
});

test('channelRemovalImpact: cuenta quién pierde un canal y quién se quedaría sin ninguno', () => {
  const links = [
    { channels: ['phone'] },
    { channels: ['phone', 'chat'] },
    { channels: ['chat'] },
    { channels: ['email'] },
  ];
  assert.deepEqual(channelRemovalImpact(links, ['phone']), { affected: 2, orphaned: 1 });
  assert.deepEqual(channelRemovalImpact(links, ['phone', 'chat']), { affected: 3, orphaned: 3 });
  assert.deepEqual(channelRemovalImpact(links, []), { affected: 0, orphaned: 0 });
});
