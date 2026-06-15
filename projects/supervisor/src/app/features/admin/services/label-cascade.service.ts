import { inject, Injectable } from '@angular/core';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { LabelsStore } from '@features/admin/labels/state/labels.store';

/**
 * Orchestrates label deletion across the labels and agents stores.
 *
 * Deleting a label is conceptually one operation but spans two feature
 * stores: the label disappears from `LabelsStore`, and any agent that
 * had the label assigned needs it stripped via `AgentsStore`. Wrapping
 * the orchestration in a service keeps the cross-store choreography
 * out of the labels page (which would otherwise need to inject the
 * agents store directly) and gives every future consumer of the
 * "delete a label" operation a single entry point.
 *
 * The service lives at the admin-features level (rather than in
 * `@core`) because it depends on two feature stores — putting it in
 * core would invert the dependency direction (core depends on
 * features). A label-deletion is an admin-domain concept anyway.
 */
@Injectable({ providedIn: 'root' })
export class LabelCascadeService {
  private readonly labelsStore = inject(LabelsStore);
  private readonly agentsStore = inject(AgentsStore);

  /** Delete one or more labels and strip them from every agent that referenced them. */
  deleteLabels(ids: readonly number[]): void {
    if (ids.length === 0) return;
    this.agentsStore.removeLabelsFromAllAgents(ids);
    if (ids.length === 1) {
      this.labelsStore.deleteLabel(ids[0]!);
    } else {
      this.labelsStore.deleteLabels(ids);
    }
  }
}
