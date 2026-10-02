// @ts-check
/**
 * LAS REGLAS DE CANALES DE UN GRUPO Y DE SUS AGENTES, en un solo sitio y sin Angular.
 *
 * Hasta el 2026-09-26 estaban copiadas en las tres vistas que las usan —la ficha de grupo, su tabla
 * de agentes (`agent-channel-table`) y la tabla de grupos de la ficha de agente
 * (`group-assignment-table`)— y `docs/ROADMAP.md` pedía extraerlas «la próxima vez que haya que
 * cambiar la regla de cascada». La visión de producto de grupos (2026-09-25) la cambia: Chat pasa a
 * ser el padre de Web Chat y WhatsApp, y un agente asignado no se queda sin canales. Por eso nacen
 * aquí, puras, y las prueba `scripts/__tests__/group-channels.test.mjs` dentro de `verify`.
 *
 * EN EL GRUPO, `chat` es Web Chat y `whatsapp` su hermano: el grupo ofrece los cuatro, y WhatsApp tiene su número y
 * su «Salida». EN EL ENLACE DE UN AGENTE, desde DD-147, `chat` es la FAMILIA Chat (Web Chat y WhatsApp): el agente
 * atiende Teléfono, Chat o Email, como en el AED en vivo. Lo guardado antes con `whatsapp` se lee como `chat`
 * (`linkWithFamilies`, en el almacén de enlaces), sin subir versión.
 */

/** El orden canónico: dos listas con los mismos canales se serializan igual (comparar enlaces). */
export const CHANNEL_ORDER = Object.freeze(['phone', 'chat', 'whatsapp', 'email']);

/** Las familias por las que atiende un agente, en su orden (DD-147). */
export const FAMILY_ORDER = Object.freeze(['phone', 'chat', 'email']);

/** Los subcanales de Chat: `chat` es Web Chat. */
export const CHAT_SUBCHANNELS = Object.freeze(['chat', 'whatsapp']);

/**
 * Sin repetidos y en el orden canónico.
 * @param {readonly string[]} channels
 * @returns {string[]}
 */
export function canonicalizeChannels(channels) {
  const set = new Set(channels);
  return CHANNEL_ORDER.filter((c) => set.has(c));
}

/**
 * La familia de un canal: WhatsApp y Web Chat son Chat.
 * @param {string} channel
 * @returns {'phone' | 'chat' | 'email'}
 */
export function familyOf(channel) {
  if (channel === 'whatsapp' || channel === 'chat') return 'chat';
  return /** @type {'phone' | 'email'} */ (channel);
}

/**
 * ¿Tiene el grupo Chat? Sí, si tiene cualquiera de sus subcanales.
 * @param {Iterable<string>} channels
 */
export function hasChatFamily(channels) {
  for (const c of channels) if (familyOf(c) === 'chat') return true;
  return false;
}

/**
 * Lo que ofrece un grupo, dicho en familias y en su orden: con Web Chat, WhatsApp o los dos, ofrece Chat. Son las
 * columnas de la tabla de agentes y lo que un agente puede atender en él (DD-147).
 * @param {Iterable<string>} channels
 * @returns {('phone' | 'chat' | 'email')[]}
 */
export function familiesOf(channels) {
  const set = new Set();
  for (const c of channels) set.add(familyOf(c));
  return /** @type {('phone' | 'chat' | 'email')[]} */ (FAMILY_ORDER.filter((f) => set.has(f)));
}

/**
 * Un enlace con sus canales en familias: lo guardado antes de DD-147 con `whatsapp` se lee con `chat`, y Web Chat y
 * WhatsApp a la vez son un solo Chat. Devuelve el MISMO objeto si ya estaba al día, para que leer no invente cambios.
 * Es el `normalize` del almacén de enlaces.
 * @template {{ channels: readonly string[] }} L
 * @param {L} link
 * @returns {L}
 */
export function linkWithFamilies(link) {
  const channels = familiesOf(link.channels);
  const same = channels.length === link.channels.length && channels.every((c, i) => c === link.channels[i]);
  return same ? link : { ...link, channels };
}

/**
 * Migra el nivel antiguo sin reemplazar niveles nuevos. Teléfono nuevo prevalece;
 * el antiguo solo rellena su ausencia. Chat y el resto del enlace se conservan.
 * Sin formato antiguo devuelve el mismo objeto.
 * @template {{ level?: number, levels?: { phone?: number, chat?: number } }} L
 * @param {L} link
 * @returns {Omit<L, 'level'> & { levels?: { phone?: number, chat?: number } }}
 */
export function linkWithLevels(link) {
  if (!Object.hasOwn(link, 'level')) return link;
  const { level, ...rest } = link;
  return level === undefined ? rest : {
    ...rest,
    levels: { ...link.levels, phone: link.levels?.phone ?? level },
  };
}

/**
 * Las familias que un grupo deja de ofrecer al cambiar sus canales: quitar WhatsApp con Web Chat puesto no quita
 * Chat, y a nadie se le quita nada.
 * @param {Iterable<string>} before
 * @param {Iterable<string>} after
 * @returns {('phone' | 'chat' | 'email')[]}
 */
export function removedFamilies(before, after) {
  const remaining = new Set(familiesOf(after));
  return familiesOf(before).filter((f) => !remaining.has(f));
}

/**
 * Pone o quita UN canal del grupo (el conmutador de siempre).
 * @param {Iterable<string>} channels
 * @param {string} channel
 * @returns {Set<string>}
 */
export function toggleGroupChannel(channels, channel) {
  const next = new Set(channels);
  if (next.has(channel)) next.delete(channel);
  else next.add(channel);
  return next;
}

/**
 * Chat, la MADRE (patrón B12 del laboratorio de administración): apagarla apaga de verdad sus
 * subcanales, y encenderla los enciende todos; luego se desmarca el que sobre. Un solo gesto para el
 * caso común, y ningún estado «Chat sin tipo» que haya que validar.
 * @param {Iterable<string>} channels
 * @returns {Set<string>}
 */
export function toggleChatFamily(channels) {
  const next = new Set(channels);
  if (hasChatFamily(next)) {
    for (const s of CHAT_SUBCHANNELS) next.delete(s);
  } else {
    for (const s of CHAT_SUBCHANNELS) next.add(s);
  }
  return next;
}

/**
 * Recorta los canales de cada enlace a las familias que ofrece el grupo: en uno solo de WhatsApp, el agente conserva
 * su Chat. Devuelve el MISMO objeto cuando no cambia nada, para que la detección de cambios no vea diferencias falsas.
 * @template {{ channels: readonly string[] }} L
 * @param {readonly L[]} links
 * @param {Iterable<string>} groupChannels
 * @param {(link: L) => readonly string[] | undefined} [allowedChannelsFor]
 * @returns {L[]}
 */
export function clampLinksToChannels(links, groupChannels, allowedChannelsFor = () => undefined) {
  const offered = familiesOf(groupChannels);
  return links.map((l) => {
    const allowed = new Set(permittedFamilies(offered, allowedChannelsFor(l)));
    const filtered = l.channels.filter((c) => allowed.has(familyOf(c)));
    return filtered.length === l.channels.length ? l : { ...l, channels: filtered };
  });
}

/**
 * ¿Es este el único canal del enlace?
 * @param {{ channels: readonly string[] }} link
 * @param {string} channel
 */
export function isLastChannel(link, channel) {
  return link.channels.length === 1 && link.channels[0] === channel;
}

/**
 * Pone o quita un canal a UN agente dentro de un grupo. Con `minOne`, quitar el último no hace nada:
 * un agente asignado sin canales es un estado que no significa nada (para sacarlo del grupo está
 * «Quitar»).
 * @template {{ channels: readonly string[] }} L
 * @param {L} link
 * @param {string} channel
 * @param {{ minOne?: boolean }} [options]
 * @returns {L}
 */
export function toggleLinkChannel(link, channel, options = {}) {
  const has = link.channels.includes(channel);
  if (has && options.minOne && isLastChannel(link, channel)) return link;
  const channels = has ? link.channels.filter((c) => c !== channel) : [...link.channels, channel];
  return { ...link, channels: canonicalizeChannels(channels) };
}

/**
 * Un enlace nuevo: con TODAS las familias que ofrece el grupo, habilitado. Los niveles solo se ponen si se
 * piden; cada familia sin nivel explícito usa 1.
 * @param {{ agentId: number, groupId: number, groupChannels: readonly string[], allowedChannels?: readonly string[], levels?: { phone?: number, chat?: number } }} input
 */
export function newLinkFor({ agentId, groupId, groupChannels, allowedChannels, levels }) {
  const link = { agentId, groupId, channels: permittedFamilies(groupChannels, allowedChannels), active: true };
  return levels === undefined ? link : { ...link, levels };
}

/**
 * Qué pasa con los agentes si el grupo deja de ofrecer unas familias (`removedFamilies`): cuántos pierden
 * alguna y cuántos se quedarían sin ninguna.
 * @param {readonly { channels: readonly string[] }[]} links
 * @param {Iterable<string>} removedChannels
 * @returns {{ affected: number, orphaned: number }}
 */
export function channelRemovalImpact(links, removedChannels) {
  const removed = new Set(removedChannels);
  let affected = 0;
  let orphaned = 0;
  for (const l of links) {
    if (!l.channels.some((c) => removed.has(c))) continue;
    affected++;
    if (l.channels.every((c) => removed.has(c))) orphaned++;
  }
  return { affected, orphaned };
}

/**
 * ¿Dicen lo mismo dos enlaces del mismo agente? Canales (sin mirar el orden), los dos niveles
 * (1 por familia si no lo tiene) y si está habilitado.
 * @param {{ channels: readonly string[], active: boolean, levels?: { phone?: number, chat?: number } }} a
 * @param {{ channels: readonly string[], active: boolean, levels?: { phone?: number, chat?: number } }} b
 */
function sameLink(a, b) {
  const ca = canonicalizeChannels(a.channels);
  const cb = canonicalizeChannels(b.channels);
  return (
    a.active === b.active &&
    (a.levels?.phone ?? 1) === (b.levels?.phone ?? 1) &&
    (a.levels?.chat ?? 1) === (b.levels?.chat ?? 1) &&
    ca.length === cb.length &&
    ca.every((c, i) => c === cb[i])
  );
}

/**
 * Cuántos agentes cambian entre dos juegos de enlaces del mismo grupo: los que entran, los que
 * salen y los que siguen pero cambian de canales o de nivel. Es la N de «Guardar (N)» del panel
 * rápido de agentes: lo que se va a escribir, dicho en agentes y no en casillas.
 * @param {readonly { agentId: number, channels: readonly string[], active: boolean, levels?: { phone?: number, chat?: number } }[]} before
 * @param {readonly { agentId: number, channels: readonly string[], active: boolean, levels?: { phone?: number, chat?: number } }[]} after
 * @returns {{ added: number, removed: number, changed: number, total: number }}
 */
export function diffLinks(before, after) {
  const prev = new Map(before.map((l) => [l.agentId, l]));
  const next = new Map(after.map((l) => [l.agentId, l]));
  let added = 0;
  let removed = 0;
  let changed = 0;
  for (const [agentId, link] of next) {
    const was = prev.get(agentId);
    if (!was) added++;
    else if (!sameLink(was, link)) changed++;
  }
  for (const agentId of prev.keys()) if (!next.has(agentId)) removed++;
  return { added, removed, changed, total: added + removed + changed };
}

/**
 * Familias del grupo que permite la persona. Sin el campo antiguo, las tres;
 * una lista vacía significa ninguna. Web Chat y WhatsApp siguen siendo Chat.
 * @param {Iterable<string>} groupChannels
 * @param {readonly string[]} [allowedChannels]
 * @returns {('phone' | 'chat' | 'email')[]}
 */
export function permittedFamilies(groupChannels, allowedChannels) {
  const allowed = new Set(allowedChannels ?? FAMILY_ORDER);
  return familiesOf(groupChannels).filter(family => allowed.has(family));
}
