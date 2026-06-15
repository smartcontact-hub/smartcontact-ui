import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

/**
 * One undoable action sitting on the global stack. The toast that announces
 * the action carries `data.undoEntryId` matching `id`, so the toast template
 * can wire its "Deshacer" button back to the stack.
 */
export interface UndoEntry {
  readonly id: string;
  /** Short message for the post-undo confirmation toast. */
  readonly description: string;
  readonly undo: () => void;
  readonly expiresAt: number;
}

const EXPIRY_MS = 9000; // slightly longer than toast life so Ctrl+Z works until the toast disappears
const TOAST_LIFE_MS = 8000;
const REVERTED_TOAST_LIFE_MS = 2500;
const MAX_STACK = 20;

/**
 * Global undo stack (DD#293). Module-level singleton — any list page can
 * push an undoable action and the global Ctrl+Z listener (in `AppComponent`)
 * pops & executes the most recent entry. Each push also fires a toast with
 * a "Deshacer" button; the toast template invokes `runById` directly when
 * the user clicks it.
 *
 * Mirrors the React prototype's `undoStack.ts`. Destructive operations
 * (delete) are intentionally NOT routed through here — see DD#2173.
 */
@Injectable({ providedIn: 'root' })
export class UndoStackService {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private stack: UndoEntry[] = [];

  /**
   * Record an undoable action and announce it via a toast with a "Deshacer"
   * button. `summary` is what shows in that toast; `description` is what
   * shows in the post-undo confirmation toast.
   */
  push(summary: string, description: string, undo: () => void): void {
    this.prune();
    const id = `undo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.stack.push({ id, description, undo, expiresAt: Date.now() + EXPIRY_MS });
    if (this.stack.length > MAX_STACK) this.stack.shift();

    this.messages.add({
      severity: 'success',
      summary,
      life: TOAST_LIFE_MS,
      data: { undoEntryId: id },
    });
  }

  /** Pop and run the most recent undoable action (Ctrl+Z handler). */
  popLatest(): void {
    this.prune();
    const entry = this.stack.pop();
    if (!entry) return;
    this.run(entry);
  }

  /** Run undo for a specific entry id (called from the toast's "Deshacer" button). */
  runById(id: string): void {
    this.prune();
    const idx = this.stack.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const [entry] = this.stack.splice(idx, 1);
    if (entry) this.run(entry);
  }

  hasUndo(): boolean {
    this.prune();
    return this.stack.length > 0;
  }

  private run(entry: UndoEntry): void {
    entry.undo();
    this.messages.add({
      severity: 'info',
      summary: this.translate.instant('common.change_reverted'),
      detail: entry.description,
      life: REVERTED_TOAST_LIFE_MS,
    });
  }

  private prune(): void {
    const now = Date.now();
    this.stack = this.stack.filter((e) => e.expiresAt > now);
  }
}
