/** Tipos de las reglas de canales de grupo (la lógica vive en `group-channels.core.mjs`). */
export const CHANNEL_ORDER: readonly ['phone', 'chat', 'whatsapp', 'email'];
export const CHAT_SUBCHANNELS: readonly ['chat', 'whatsapp'];

export function canonicalizeChannels<C extends string>(channels: readonly C[]): C[];
export function familyOf(channel: string): 'phone' | 'chat' | 'email';
export function hasChatFamily(channels: Iterable<string>): boolean;
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
export function newLinkFor<C extends string>(input: {
  agentId: number;
  groupId: number;
  groupChannels: readonly C[];
  level?: number;
}): { agentId: number; groupId: number; channels: C[]; active: true; level?: number };
export function channelRemovalImpact(
  links: readonly { readonly channels: readonly string[] }[],
  removedChannels: Iterable<string>,
): { affected: number; orphaned: number };
