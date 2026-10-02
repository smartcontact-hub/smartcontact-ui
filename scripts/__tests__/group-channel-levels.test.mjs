import assert from 'node:assert/strict';
import test from 'node:test';
import * as core from '../../projects/supervisor/src/app/features/admin/services/group-channels.core.mjs';

const base = { agentId: 1, groupId: 11, channels: ['phone', 'chat'], active: false };

test('migra level a Teléfono sin perder asignaciones, familias ni propiedades', () => {
  const old = { ...base, channels: ['phone', 'whatsapp'], level: 10, extra: 'conservar' };
  const normalized = core.linkWithLevels(core.linkWithFamilies(old));
  assert.deepEqual(normalized, { ...base, levels: { phone: 10 }, extra: 'conservar' });
  assert.equal(old.level, 10);
  assert.equal(core.linkWithLevels(normalized), normalized);
});

test('los niveles nuevos prevalecen; el antiguo solo completa Teléfono', () => {
  for (const phone of [1, 10]) {
    assert.deepEqual(core.linkWithLevels({ ...base, level: 5, levels: { phone, chat: 10 } }), {
      ...base, levels: { phone, chat: 10 },
    });
  }
  assert.deepEqual(core.linkWithLevels({ ...base, level: 1, levels: { chat: 10 } }), {
    ...base, levels: { phone: 1, chat: 10 },
  });
  for (const link of [base, { ...base, levels: { phone: 10, chat: 1 } }]) {
    assert.equal(core.linkWithLevels(link), link);
  }
});

test('diffLinks detecta independientemente Teléfono y Chat y cuenta agentes', () => {
  const before = { ...base, levels: { phone: 1, chat: 1 } };
  for (const levels of [{ phone: 10, chat: 1 }, { phone: 1, chat: 10 }, { phone: 10, chat: 10 }]) {
    assert.deepEqual(core.diffLinks([before], [{ ...base, levels }]), { added: 0, removed: 0, changed: 1, total: 1 });
  }
  assert.equal(core.diffLinks([base], [before]).total, 0);
});

test('un enlace nuevo conserva niveles independientes y no emite level', () => {
  const link = core.newLinkFor({ agentId: 1, groupId: 11, groupChannels: ['phone', 'whatsapp'], levels: { phone: 1, chat: 10 } });
  assert.deepEqual(link, { ...base, active: true, levels: { phone: 1, chat: 10 } });
  assert.equal('level' in link, false);
});
