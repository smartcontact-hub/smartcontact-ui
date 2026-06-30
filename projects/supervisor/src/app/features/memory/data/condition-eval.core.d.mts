import type { Condition, ConditionTree } from './condition.types';
import type { Conversation } from './conversation.types';

export interface CoreCtx {
  memberAgentIds(groupId: number): readonly number[];
  groupConvName(id: number): string | undefined;
  agentConvName(id: number): string | undefined;
}

export function parseDurationSecs(mmss: string): number;
export function conditionMatches(
  cond: Condition,
  conv: Conversation,
  ctx: CoreCtx,
): boolean | null;
export function conversationMatchesTree(
  conv: Conversation,
  tree: ConditionTree,
  ctx: CoreCtx,
): boolean;
export function hasUnevaluableConditions(tree: ConditionTree): boolean;
