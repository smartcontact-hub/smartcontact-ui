/**
 * Tests de lo que trae cada tipo de usuario
 * (`projects/supervisor/src/app/features/admin/users/data/user-packages.core.mjs`). Puro, node:test,
 * dentro del gate (`test:unit`).
 *
 * Contratos clave: cuatro tipos y ninguno más; lo guardado con los tipos de antes se lee sin conceder nada
 * que no tuviera; aplicar una plantilla no toca lo que la vista no enseña; y el desvío cuenta solo casillas
 * visibles.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyPackage,
  driftFromPackage,
  HIDDEN_SECTION_KEYS,
  PERMISSION_KEYS,
  resolveUserAccess,
  SECTION_KEYS,
  TYPE_PACKAGES,
  USER_TYPES,
} from '../../projects/supervisor/src/app/features/admin/users/data/user-packages.core.mjs';

const todo = (keys, value) => Object.fromEntries(keys.map((k) => [k, value]));
const marcadas = (record, keys) => keys.filter((k) => record[k]);

test('los cuatro tipos, del que más puede al que menos', () => {
  assert.deepEqual(USER_TYPES, ['superadmin', 'administrator', 'supervisorOnline', 'supervisorOffline']);
  assert.deepEqual(Object.keys(TYPE_PACKAGES).sort(), [...USER_TYPES].sort());
});

test('cada plantilla solo nombra casillas que la vista enseña', () => {
  for (const type of USER_TYPES) {
    for (const k of TYPE_PACKAGES[type].sections) assert.ok(SECTION_KEYS.includes(k), `${type}: ${k}`);
    for (const k of TYPE_PACKAGES[type].permissions) assert.ok(PERMISSION_KEYS.includes(k), `${type}: ${k}`);
  }
  for (const k of HIDDEN_SECTION_KEYS) assert.ok(!SECTION_KEYS.includes(k), `${k} no se enseña`);
});

test('las plantillas del documento de producto: quién ve y gestiona qué', () => {
  const s = (type) => new Set(TYPE_PACKAGES[type].sections);
  const p = (type) => new Set(TYPE_PACKAGES[type].permissions);
  // Supervisión, los cuatro.
  for (const type of USER_TYPES) {
    for (const k of ['dashboard', 'services', 'aiNode', 'typifications', 'campaigns', 'conversations', 'stats']) {
      assert.ok(s(type).has(k), `${type} ve ${k}`);
    }
  }
  // Sistema, solo Superadmin.
  assert.deepEqual(USER_TYPES.filter((t) => s(t).has('system')), ['superadmin']);
  // Contact Center (AED) y su gestión: Superadmin y Administrador.
  assert.deepEqual(USER_TYPES.filter((t) => s(t).has('aed') && p(t).has('aedManagement')), ['superadmin', 'administrator']);
  // Grupos, Agentes y Repositorios, y su gestión: todos menos Offline.
  for (const [sec, perm] of [['groups', 'groupsManagement'], ['agents', 'agentsManagement'], ['repositories', 'repositoriesManagement']]) {
    assert.deepEqual(USER_TYPES.filter((t) => s(t).has(sec) && p(t).has(perm)), ['superadmin', 'administrator', 'supervisorOnline']);
  }
  // VUI Designer y Usuarios, y su gestión: Superadmin y Administrador.
  assert.deepEqual(USER_TYPES.filter((t) => s(t).has('users') && p(t).has('usersManagement')), ['superadmin', 'administrator']);
  assert.deepEqual(USER_TYPES.filter((t) => s(t).has('vuiDesigner') && p(t).has('vuiDesignerManagement')), ['superadmin', 'administrator']);
  // Lo sensible, a mano: solo Superadmin lo trae.
  for (const k of ['recordingManagement', 'transcriptionsManagement', 'spyOnConversations']) {
    assert.deepEqual(USER_TYPES.filter((t) => p(t).has(k)), ['superadmin'], k);
  }
});

test('resolveUserAccess: los tipos de antes se leen como Supervisor Offline, y el administrador sigue siéndolo', () => {
  for (const legacy of ['supervisor', 'viewer', 'agent', 'algo-raro']) {
    assert.equal(resolveUserAccess({ type: legacy, sections: {}, permissions: {} }).type, 'supervisorOffline', legacy);
  }
  assert.equal(resolveUserAccess({ type: 'administrator', sections: {}, permissions: {} }).type, 'administrator');
  assert.equal(resolveUserAccess({ type: 'supervisorOnline', sections: {}, permissions: {} }).type, 'supervisorOnline');
});

test('resolveUserAccess: las casillas nuevas se leen apagadas, sin deducir nada de la vieja', () => {
  const guardado = {
    id: 9,
    type: 'administrator',
    sections: { dashboard: true, groupsAgentsTypifications: true, users: true },
    permissions: { usersManagement: true },
  };
  const u = resolveUserAccess(guardado);
  assert.equal(u.id, 9, 'el resto del usuario pasa tal cual');
  assert.equal(u.sections.dashboard, true);
  assert.equal(u.sections.groupsAgentsTypifications, true, 'la vieja se conserva en el modelo');
  for (const k of ['groups', 'agents', 'typifications', 'repositories', 'aed', 'system']) {
    assert.equal(u.sections[k], false, `${k} no se concede por deducción`);
  }
  assert.equal(u.permissions.usersManagement, true);
  assert.equal(u.permissions.groupsManagement, false);
  assert.deepEqual(Object.keys(u.sections).sort(), [...SECTION_KEYS, ...HIDDEN_SECTION_KEYS].sort());
  assert.deepEqual(Object.keys(u.permissions).sort(), [...PERMISSION_KEYS].sort());
});

test('applyPackage: marca justo la plantilla y deja lo que la vista no enseña', () => {
  const sections = { ...todo(SECTION_KEYS, true), groupsAgentsTypifications: true };
  const permissions = todo(PERMISSION_KEYS, true);
  const r = applyPackage('supervisorOffline', sections, permissions);
  assert.deepEqual(marcadas(r.sections, SECTION_KEYS), TYPE_PACKAGES.supervisorOffline.sections);
  assert.deepEqual(marcadas(r.permissions, PERMISSION_KEYS), []);
  assert.equal(r.sections.groupsAgentsTypifications, true, 'la oculta no se toca');
  assert.equal(sections.system, true, 'no muta la entrada');
});

test('driftFromPackage: cuántas casillas visibles se apartan de la plantilla', () => {
  const { sections, permissions } = applyPackage('supervisorOnline', todo(SECTION_KEYS, false), todo(PERMISSION_KEYS, false));
  assert.equal(driftFromPackage('supervisorOnline', sections, permissions), 0);
  const tocado = { ...permissions, spyOnConversations: true, groupsManagement: false };
  assert.equal(driftFromPackage('supervisorOnline', sections, tocado), 2);
  // La oculta no cuenta: no hay casilla que el usuario pueda mirar.
  assert.equal(driftFromPackage('supervisorOnline', { ...sections, groupsAgentsTypifications: true }, permissions), 0);
  // De Online a Offline cambian las tres secciones y las tres gestiones de administración.
  assert.equal(driftFromPackage('supervisorOffline', sections, permissions), 6);
});
