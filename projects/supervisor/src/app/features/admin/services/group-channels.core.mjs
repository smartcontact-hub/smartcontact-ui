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
 * LAS CLAVES NO CAMBIAN: `chat` sigue siendo Web Chat y `whatsapp` su hermano en los datos. «Chat»
 * como padre es un concepto de la vista y de la validación, así que no hay datos que migrar.
 */

/** El orden canónico: dos listas con los mismos canales se serializan igual (comparar enlaces). */
export const CHANNEL_ORDER = Object.freeze(['phone', 'chat', 'whatsapp', 'email']);

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
 * Recorta los canales de cada enlace a los que ofrece el grupo. Devuelve el MISMO objeto cuando no
 * cambia nada, para que la detección de cambios no vea diferencias falsas.
 * @template {{ channels: readonly string[] }} L
 * @param {readonly L[]} links
 * @param {Iterable<string>} groupChannels
 * @returns {L[]}
 */
export function clampLinksToChannels(links, groupChannels) {
  const allowed = new Set(groupChannels);
  return links.map((l) => {
    const filtered = l.channels.filter((c) => allowed.has(c));
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
 * Un enlace nuevo: con TODOS los canales que ofrece el grupo, habilitado. El nivel solo se pone si se
 * pide (la tabla del grupo lo pone a 1; la del agente, no).
 * @param {{ agentId: number, groupId: number, groupChannels: readonly string[], level?: number }} input
 */
export function newLinkFor({ agentId, groupId, groupChannels, level }) {
  const link = { agentId, groupId, channels: canonicalizeChannels(groupChannels), active: true };
  return level === undefined ? link : { ...link, level };
}

/**
 * Qué pasa con los agentes si se quitan canales del grupo: cuántos pierden alguno y cuántos se
 * quedarían sin ninguno.
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
 * ¿Dicen lo mismo dos enlaces del mismo agente? Canales (sin mirar el orden), nivel (1 si no lo
 * tiene) y si está habilitado.
 * @param {{ channels: readonly string[], active: boolean, level?: number }} a
 * @param {{ channels: readonly string[], active: boolean, level?: number }} b
 */
function sameLink(a, b) {
  const ca = canonicalizeChannels(a.channels);
  const cb = canonicalizeChannels(b.channels);
  return (
    a.active === b.active &&
    (a.level ?? 1) === (b.level ?? 1) &&
    ca.length === cb.length &&
    ca.every((c, i) => c === cb[i])
  );
}

/**
 * Cuántos agentes cambian entre dos juegos de enlaces del mismo grupo: los que entran, los que
 * salen y los que siguen pero cambian de canales o de nivel. Es la N de «Guardar (N)» del panel
 * rápido de agentes: lo que se va a escribir, dicho en agentes y no en casillas.
 * @param {readonly { agentId: number, channels: readonly string[], active: boolean, level?: number }[]} before
 * @param {readonly { agentId: number, channels: readonly string[], active: boolean, level?: number }[]} after
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
