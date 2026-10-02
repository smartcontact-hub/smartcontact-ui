/** Tipos de las reglas de canales de grupo (la lógica vive en `group-channels.core.mjs`). */
export const CHANNEL_ORDER: readonly ['phone', 'chat', 'whatsapp', 'email'];
export const FAMILY_ORDER: readonly ['phone', 'chat', 'email'];
export const CHAT_SUBCHANNELS: readonly ['chat', 'whatsapp'];

export function canonicalizeChannels<C extends string>(channels: readonly C[]): C[];
export function familyOf(channel: string): 'phone' | 'chat' | 'email';
export function hasChatFamily(channels: Iterable<string>): boolean;
/** Lo que ofrece un grupo, dicho en familias y en su orden (DD-147). */
export function familiesOf(channels: Iterable<string>): ('phone' | 'chat' | 'email')[];
/** Un enlace con sus canales en familias (`whatsapp` → `chat`); el mismo objeto si ya estaba al día. */
export function linkWithFamilies<L extends { readonly channels: readonly string[] }>(link: L): L;
/** Las familias que un grupo deja de ofrecer al cambiar sus canales. */
export function removedFamilies(before: Iterable<string>, after: Iterable<string>): ('phone' | 'chat' | 'email')[];
export function toggleGroupChannel<C extends string>(channels: Iterable<C>, channel: C): Set<C>;
export function toggleChatFamily<C extends string>(channels: Iterable<C>): Set<C>;
export function clampLinksToChannels<L extends { readonly channels: readonly string[] }>(
  links: readonly L[],
  groupChannels: Iterable<string>,
): L[];
export function isLastChannel(link: { readonly channels: readonly string[] }, channel: string): boolean;
export function toggleLinkChannel<L extends { readonly channels: readonly string[] }>(
  link: L,
  channel: string,
  options?: { minOne?: boolean },
): L;
export function newLinkFor(input: {
  agentId: number;
  groupId: number;
  groupChannels: readonly string[];
  levels?: { readonly phone?: number; readonly chat?: number };
}): { agentId: number; groupId: number; channels: ('phone' | 'chat' | 'email')[]; active: true; levels?: { readonly phone?: number; readonly chat?: number } };
export function channelRemovalImpact(
  links: readonly { readonly channels: readonly string[] }[],
  removedChannels: Iterable<string>,
): { affected: number; orphaned: number };

/** Cuántos agentes cambian entre dos juegos de enlaces del mismo grupo (la N de «Guardar (N)»). */
export function diffLinks(
  before: readonly { readonly agentId: number; readonly channels: readonly string[]; readonly active: boolean; readonly levels?: { readonly phone?: number; readonly chat?: number } }[],
  after: readonly { readonly agentId: number; readonly channels: readonly string[]; readonly active: boolean; readonly levels?: { readonly phone?: number; readonly chat?: number } }[],
): { added: number; removed: number; changed: number; total: number };

export function linkWithLevels<L extends { readonly level?: number; readonly levels?: { readonly phone?: number; readonly chat?: number } }>(link: L): Omit<L, 'level'> & { readonly levels?: { readonly phone?: number; readonly chat?: number } };
