import { computed, Injectable, signal } from '@angular/core';

import type { Conversation, TranscriptionLine } from '../data/conversation.types';
import { TRANSCRIPTION_POOL } from '../data/conversations-mock';
import { EMPTY_FILTERS, type MemoryConversationFilters } from '../data/conversation-filters.types';
import { DEFAULT_SAMPLE_ID, getSample, MOCK_SAMPLES } from '../data/mock-samples';

/**
 * Selecciona una plantilla de transcripción determinística para una
 * conversación recién marcada como transcrita (mock-only). Usa el hash
 * estable del id para que la misma conversación reciba siempre la misma
 * plantilla entre reloads. Chats reciben la plantilla CHAT; llamadas rotan
 * entre las 5 plantillas call.
 */
function pickTranscriptionMock(c: Conversation): readonly TranscriptionLine[] {
  if (c.channel === 'chat') return TRANSCRIPTION_POOL.chat;
  const pool = TRANSCRIPTION_POOL.call;
  if (pool.length === 0) return [];
  let hash = 0;
  for (let i = 0; i < c.id.length; i++) hash = (hash * 31 + c.id.charCodeAt(i)) | 0;
  return pool[Math.abs(hash) % pool.length];
}

/**
 * Signal store de conversaciones Memory.
 *
 * Iter 1 (S36): expone la lista mock readonly.
 * Iter 3 (S37): + estado de filtros + `filteredConversations` computed.
 * Iter 6a (S38): + selección múltiple (`selectedIds` + helpers). Toggle por
 *                row click ó checkbox. Select-all aplica sobre el subset
 *                filtrado (no sobre la lista completa).
 * S39: + `currentSampleId` + `setSample()` para el MockSampleSwitcher
 *      (demo-only, ver `data/mock-samples.ts` para purga pre-deploy).
 *
 * Sin localStorage por ahora — la selección no persiste entre reloads
 * (paridad con el prototipo React, donde tampoco).
 */
/**
 * Tiempo de simulación de dispatch (mock-only). Cuando exista backend
 * real este valor se reemplaza por el polling del estado real. Lo dejo
 * exportado para que tests + storybook puedan acelerarlo.
 */
export const MOCK_DISPATCH_DELAY_MS = 5000;

/** Output del dispatch — los IDs que efectivamente se procesaron y los que
 *  el mock simuló como fallidos. Útil para el toast de cierre. */
export interface DispatchResult {
  readonly successIds: readonly string[];
  readonly failedIds: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class ConversationsStore {
  private readonly _currentSampleId = signal<string>(DEFAULT_SAMPLE_ID);
  private readonly _conversations = signal<readonly Conversation[]>(
    getSample(DEFAULT_SAMPLE_ID).build(),
  );
  private readonly _filters = signal<MemoryConversationFilters>(EMPTY_FILTERS);
  private readonly _selectedIds = signal<ReadonlySet<string>>(new Set());
  /** IDs en proceso de transcripción (mock dispatch). */
  private readonly _processingIds = signal<ReadonlySet<string>>(new Set());
  /** IDs en proceso de análisis IA (mock dispatch). */
  private readonly _analyzingIds = signal<ReadonlySet<string>>(new Set());

  readonly conversations = this._conversations.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly selectedIds = this._selectedIds.asReadonly();
  readonly processingIds = this._processingIds.asReadonly();
  readonly analyzingIds = this._analyzingIds.asReadonly();
  readonly currentSampleId = this._currentSampleId.asReadonly();
  readonly samples = MOCK_SAMPLES;

  /** Cuántas conversaciones tienen `hasFailedTranscription: true`. Alimenta
   *  el chip "Solo fallidas" del toolbar y el filtro `f.status.onlyFailed`. */
  readonly failedCount = computed(
    () => this._conversations().filter((c) => c.hasFailedTranscription).length,
  );

  readonly processingCount = computed(() => this._processingIds().size);
  readonly analyzingCount = computed(() => this._analyzingIds().size);

  readonly filteredConversations = computed(() => {
    const all = this._conversations();
    const f = this._filters();
    return all.filter((c) => matchesFilters(c, f));
  });

  /**
   * Categorías IA únicas detectadas en el mock entero (no en el filtrado).
   * Alimenta el `CategoryFilterPanel` para que el supervisor pueda seleccionar
   * cualquier categoría existente aunque haya filtrado previamente fuera de
   * esa categoría — replicar React `useCategories()` context fue innecesario
   * aquí porque las categorías viven dentro de las conversations mismas.
   */
  readonly availableAiCategories = computed(() => {
    const set = new Set<string>();
    for (const c of this._conversations()) {
      for (const cat of c.aiCategories ?? []) set.add(cat);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly selectedCount = computed(() => this._selectedIds().size);

  setFilters(filters: MemoryConversationFilters): void {
    this._filters.set(filters);
  }

  resetFilters(): void {
    this._filters.set(EMPTY_FILTERS);
  }

  /**
   * Cambia el sample mock activo (S39, demo-only). Re-genera la lista,
   * limpia la selección y los filtros — un nuevo escenario no debe
   * heredar checks ni filtros del anterior.
   */
  setSample(sampleId: string): void {
    const sample = getSample(sampleId);
    this._currentSampleId.set(sample.id);
    this._conversations.set(sample.build());
    this._selectedIds.set(new Set());
    this._filters.set(EMPTY_FILTERS);
  }

  /**
   * Reemplaza la selección entera por el conjunto dado.
   *
   * Es la ÚNICA vía de selección desde que la tabla es `sc-datatable`: su
   * casilla, su casilla de cabecera (marcar todo lo filtrado) y su rango con
   * ancla los sirve el componente del DS, que emite la selección COMPLETA —no
   * "toglea este id" ni "marca todo". Por eso `toggleSelection`,
   * `selectAllFiltered` y `allFilteredSelected` se retiraron: los sustituye
   * este método más el propio DS. El atajo de teclado (Espacio) también compone
   * su conjunto y entra por aquí.
   */
  setSelection(ids: Iterable<string>): void {
    this._selectedIds.set(new Set(ids));
  }

  clearSelection(): void {
    this._selectedIds.set(new Set());
  }

  /**
   * Marca como leídas las conversaciones indicadas: limpia el flag
   * `hasFailedTranscription` para que la fila pierda el tint rojo y el
   * badge failed deje de pintarse. El contador `failedCount` y el chip
   * "Solo fallidas" se recalculan en consecuencia.
   *
   * Decisión Memory 15.46 — "Marcar como leídas" reset visual del estado
   * post-procesamiento. Hasta ahora era un stub (toast-only) — bug S49.
   */
  markAsRead(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    this._conversations.update((all) =>
      all.map((c) =>
        idSet.has(c.id) && c.hasFailedTranscription ? { ...c, hasFailedTranscription: false } : c,
      ),
    );
  }

  /**
   * Mock dispatch de transcripción (bulk o unitario).
   *
   * Simula el ciclo backend con `setTimeout`. Fases:
   *  1. Añade los IDs a `processingIds` → tabla pinta filas en estado proceso.
   *  2. Tras `MOCK_DISPATCH_DELAY_MS` (5s): marca `hasTranscription: true` en
   *     las conversaciones (salvo las que el mock simule fallidas).
   *  3. Si `includeAnalysis: true`: traspasa los IDs exitosos a
   *     `analyzingIds`, espera otros `MOCK_DISPATCH_DELAY_MS`, marca
   *     `hasAnalysis: true`.
   *  4. Resuelve la promesa con `{ successIds, failedIds }` para que el
   *     caller actualice su toast.
   *
   * Para simular fallos: una conversación con `id` que empieza por "FAIL-"
   * se marca como fallida. En production esto vendría del backend.
   *
   * No reentrante por ID: si un ID ya está en `processingIds` se ignora
   * silenciosamente (paridad con `referencia-ui.md` decisión 15.45).
   */
  dispatchTranscription(
    ids: readonly string[],
    options: { readonly includeAnalysis: boolean },
  ): Promise<DispatchResult> {
    return new Promise((resolve) => {
      const eligible = ids.filter((id) => !this._processingIds().has(id));
      if (eligible.length === 0) {
        resolve({ successIds: [], failedIds: [] });
        return;
      }

      // Fase 1: entrar en proceso de transcripción.
      this._processingIds.update((curr) => new Set([...curr, ...eligible]));

      setTimeout(() => {
        // Fase 2: separar success vs failure (mock).
        const successIds: string[] = [];
        const failedIds: string[] = [];
        for (const id of eligible) {
          if (this.mockShouldFail(id)) failedIds.push(id);
          else successIds.push(id);
        }

        // Mutar conversaciones: marcar success como transcribed (cargando
        // líneas mock si no las tiene → el player necesita `transcription`
        // populated para mostrar contenido, no solo el flag), failure como
        // hasFailedTranscription.
        this._conversations.update((all) =>
          all.map((c) => {
            if (successIds.includes(c.id)) {
              return {
                ...c,
                hasTranscription: true,
                hasFailedTranscription: false,
                transcription: c.transcription ?? pickTranscriptionMock(c),
              };
            }
            if (failedIds.includes(c.id)) {
              return { ...c, hasFailedTranscription: true };
            }
            return c;
          }),
        );

        // Salir de processingIds.
        this._processingIds.update((curr) => {
          const next = new Set(curr);
          for (const id of eligible) next.delete(id);
          return next;
        });

        // Si no se pide análisis, resolver ya.
        if (!options.includeAnalysis || successIds.length === 0) {
          resolve({ successIds, failedIds });
          return;
        }

        // Fase 3: análisis IA solo sobre successIds.
        this._analyzingIds.update((curr) => new Set([...curr, ...successIds]));

        setTimeout(() => {
          this._conversations.update((all) =>
            all.map((c) => (successIds.includes(c.id) ? { ...c, hasAnalysis: true } : c)),
          );
          this._analyzingIds.update((curr) => {
            const next = new Set(curr);
            for (const id of successIds) next.delete(id);
            return next;
          });
          resolve({ successIds, failedIds });
        }, MOCK_DISPATCH_DELAY_MS);
      }, MOCK_DISPATCH_DELAY_MS);
    });
  }

  /**
   * Mock dispatch de análisis-solo (sin re-transcribir). Para conversaciones
   * que ya tienen `hasTranscription === true` y queremos generar el análisis
   * sin pasar por la fase 1 (procesando transcripción).
   *
   * Réplica de `handleRequestAnalysis` del React parent (ConversationsView).
   * Filtra IDs no eligibles (sin transcripción) silenciosamente.
   */
  dispatchAnalysisOnly(ids: readonly string[]): Promise<DispatchResult> {
    return new Promise((resolve) => {
      const conversations = this._conversations();
      const eligible = ids.filter((id) => {
        if (this._analyzingIds().has(id)) return false;
        const c = conversations.find((x) => x.id === id);
        return c?.hasTranscription === true && !c.hasAnalysis;
      });
      if (eligible.length === 0) {
        resolve({ successIds: [], failedIds: [] });
        return;
      }

      this._analyzingIds.update((curr) => new Set([...curr, ...eligible]));

      setTimeout(() => {
        this._conversations.update((all) =>
          all.map((c) => (eligible.includes(c.id) ? { ...c, hasAnalysis: true } : c)),
        );
        this._analyzingIds.update((curr) => {
          const next = new Set(curr);
          for (const id of eligible) next.delete(id);
          return next;
        });
        resolve({ successIds: [...eligible], failedIds: [] });
      }, MOCK_DISPATCH_DELAY_MS);
    });
  }

  /**
   * Heurística mock para simular fallos. Hoy: si el ID contiene "FAIL"
   * o si la conversación ya estaba marcada como `hasFailedTranscription`
   * (re-intento que vuelve a fallar — caso edge para demostrar el filtro
   * "Solo fallidas"). En backend real lo decidirá el pipeline.
   */
  private mockShouldFail(id: string): boolean {
    if (id.includes('FAIL')) return true;
    const c = this._conversations().find((x) => x.id === id);
    return c?.hasFailedTranscription === true;
  }
}

function matchesFilters(c: Conversation, f: MemoryConversationFilters): boolean {
  // Header top-bar filters (iter 3)
  if (f.services.length > 0 && !f.services.includes(c.service)) return false;
  if (f.groups.length > 0 && !f.groups.includes(c.group)) return false;
  if (f.agents.length > 0 && !f.agents.includes(c.origin)) return false;
  if (f.origin && !c.origin.toLowerCase().includes(f.origin.toLowerCase())) return false;
  if (f.destination && !c.destination.toLowerCase().includes(f.destination.toLowerCase())) {
    return false;
  }
  if (f.date && !sameDateAsMockDateString(f.date, c.date)) return false;

  // Tipo/Estado popover filters (iter 7)
  if (c.type === 'interna' && !f.types.interna) return false;
  if (c.type === 'externa' && !f.types.externa) return false;

  if (c.channel === 'llamada' && !f.channels.llamada) return false;
  if (c.channel === 'chat' && !f.channels.chat) return false;

  if (c.direction === 'entrante' && !f.directions.entrante) return false;
  if (c.direction === 'saliente' && !f.directions.saliente) return false;

  // Rules: cada toggle activo exige que la conversación cumpla esa dimensión
  if (f.rules.recording && !c.hasRecording) return false;
  if (f.rules.transcription && !c.hasTranscription) return false;
  if (f.rules.classification && !c.hasAnalysis) return false;

  // Status onlyFailed: solo conversaciones con transcripción fallida
  if (f.status.onlyFailed && !c.hasFailedTranscription) return false;

  // Multi-rec
  const recCount = c.recordings?.length ?? 0;
  if (f.multirec.onlyMulti && recCount <= 1) return false;
  if (f.multirec.onlyPartial) {
    if (recCount <= 1) return false;
    const transcribed = c.recordings?.filter((r) => r.hasTranscription === true).length ?? 0;
    if (transcribed === 0 || transcribed === recCount) return false;
  }

  // Categorías IA (iter 8): intersección — la conversación debe tener al
  // menos una de las categorías seleccionadas. Sin selección = sin filtro.
  if (f.aiCategories.length > 0) {
    const convCats = c.aiCategories ?? [];
    const hasMatch = convCats.some((cat) => f.aiCategories.includes(cat));
    if (!hasMatch) return false;
  }

  return true;
}

/**
 * Compara una `Date` JS contra el `date` string de la mock conversation
 * (formato `"dd/mm/yyyy"` heredado del prototipo). Comparación por
 * componentes para evitar líos de timezone.
 */
function sameDateAsMockDateString(date: Date, mockDate: string): boolean {
  const [dd, mm, yyyy] = mockDate.split('/').map((n) => Number(n));
  return date.getDate() === dd && date.getMonth() + 1 === mm && date.getFullYear() === yyyy;
}
