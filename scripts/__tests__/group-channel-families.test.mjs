/**
 * El agente atiende por FAMILIA (DD-147): Teléfono, Chat o Email, y Chat es Web Chat y WhatsApp juntos. Así lo tiene
 * el AED en vivo, que por agente solo distingue Tlf / Chat / Email. El grupo sigue ofreciendo sus cuatro canales
 * (WhatsApp tiene su número y su «Salida»), pero el enlace de cada agente guarda familias.
 *
 * Contratos de `group-channels.core.mjs`, puro, dentro del gate (`test:unit`):
 *   - lo guardado con `whatsapp` se lee como `chat`, y lo que ya está al día es el MISMO objeto;
 *   - recortar a lo que ofrece el grupo mira la familia: un grupo solo de WhatsApp conserva el Chat del agente;
 *   - quitar WhatsApp a un grupo que sigue con Web Chat no le quita nada a nadie.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  channelRemovalImpact,
  clampLinksToChannels,
  familiesOf,
  linkWithFamilies,
  newLinkFor,
  removedFamilies,
} from '../../projects/supervisor/src/app/features/admin/services/group-channels.core.mjs';

test('familiesOf: lo que ofrece el grupo, dicho en familias y en su orden', () => {
  assert.deepEqual(familiesOf(['email', 'whatsapp', 'phone']), ['phone', 'chat', 'email']);
  assert.deepEqual(familiesOf(['chat', 'whatsapp']), ['chat']);
  assert.deepEqual(familiesOf([]), []);
});

test('linkWithFamilies: un enlace guardado con WhatsApp se lee con Chat, y uno al día es el mismo objeto', () => {
  const viejo = { agentId: 1, groupId: 12, channels: ['phone', 'whatsapp'], active: true };
  assert.deepEqual(linkWithFamilies(viejo), { ...viejo, channels: ['phone', 'chat'] });
  // Web Chat y WhatsApp a la vez son un solo Chat.
  assert.deepEqual(linkWithFamilies({ ...viejo, channels: ['whatsapp', 'chat', 'email'] }).channels, ['chat', 'email']);
  const alDia = { agentId: 2, groupId: 12, channels: ['phone', 'chat'], active: false, level: 2 };
  assert.equal(linkWithFamilies(alDia), alDia);
});

test('clampLinksToChannels mira la familia: un grupo solo de WhatsApp conserva el Chat del agente', () => {
  const chat = { agentId: 1, channels: ['chat'] };
  assert.equal(clampLinksToChannels([chat], ['phone', 'whatsapp'])[0], chat);
  assert.deepEqual(clampLinksToChannels([{ agentId: 2, channels: ['chat', 'email'] }], ['phone'])[0].channels, []);
});

test('newLinkFor: un agente nuevo atiende las familias del grupo, nunca «whatsapp» suelto', () => {
  const grupo11 = ['phone', 'chat', 'whatsapp', 'email'];
  assert.deepEqual(newLinkFor({ agentId: 7, groupId: 11, groupChannels: grupo11 }).channels, ['phone', 'chat', 'email']);
  assert.deepEqual(newLinkFor({ agentId: 7, groupId: 12, groupChannels: ['whatsapp'] }).channels, ['chat']);
});

test('removedFamilies: quitar WhatsApp con Web Chat puesto no quita Chat; quitar los dos, sí', () => {
  assert.deepEqual(removedFamilies(['phone', 'chat', 'whatsapp'], ['phone', 'chat']), []);
  assert.deepEqual(removedFamilies(['phone', 'chat', 'whatsapp'], ['phone']), ['chat']);
  assert.deepEqual(removedFamilies(['phone', 'email'], ['chat']), ['phone', 'email']);
  // Con las familias quitadas, la cuenta de quién pierde algo es la de siempre.
  const links = [{ channels: ['phone', 'chat'] }, { channels: ['chat'] }];
  assert.deepEqual(channelRemovalImpact(links, removedFamilies(['phone', 'chat', 'whatsapp'], ['phone'])), {
    affected: 2,
    orphaned: 1,
  });
});
