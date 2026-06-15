import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { DirtyAware } from '@core/guards';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IconComponent } from '@shared/components';
import {
  ScInputTextComponent as InputTextComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';

interface FormState {
  /** Multi-select (varias opciones) — Figma `❖ multiselect`. */
  estrategia: string[];
  prioridad: string[];
  voz: string[];
  tipoColaEspera: string[];
  /** Texto libre. */
  capacidadColaEspera: string;
  tiempoMaxEspera: string;
  tiempoTransferencia: string;
  /** Single-select. */
  aperturaTipo: string;
  desbordar: boolean;
}

const ESTRATEGIA_OPTIONS = [
  'Distribución equitativa',
  'Más tiempo libre',
  'Última asignación',
  'Round robin',
  'Aleatoria',
] as const;
const PRIORIDAD_OPTIONS = ['Baja', 'Media', 'Alta', 'Urgente'] as const;
const VOZ_OPTIONS = ['G.711 (alaw/ulaw)', 'G.722', 'G.729', 'OPUS'] as const;
const TIPO_COLA_OPTIONS = [
  'Orden de llegada (FIFO)',
  'Por prioridad',
  'Último en entrar (LIFO)',
] as const;
const APERTURA_OPTIONS = ['Automática', 'Manual', 'Ninguna'] as const;

const DEFAULT_FORM: FormState = {
  estrategia: [],
  prioridad: [],
  voz: [],
  tipoColaEspera: [],
  capacidadColaEspera: '',
  tiempoMaxEspera: '',
  tiempoTransferencia: '',
  aperturaTipo: '',
  desbordar: true,
};

/**
 * Grupos defaults page — `/config/aed/grupos`. Figma Supervisor `1:12676`.
 *
 * Card "Parámetros" con selects apilados (estrategia, prioridad, voz,
 * tipo/capacidad/tiempo de cola, tiempo de transferencia) + un toggle
 * "Desbordar conversaciones si no hay agentes disponibles", y una card
 * "Apertura de ficha" con un select de tipo. Guardado único en la TopBar.
 */
@Component({
  selector: 'sc-aed-grupos-page',
  imports: [
    ButtonModule,
    IconComponent,
    InputTextComponent,
    MultiSelectComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './aed-grupos-page.component.html',
  styleUrl: './aed-defaults-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AedGruposPageComponent implements OnDestroy, DirtyAware {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly topBarSlot = inject(TopBarSlotService);

  protected readonly pageIcon = 'groups';

  protected readonly estrategiaOptions = ESTRATEGIA_OPTIONS;
  protected readonly prioridadOptions = PRIORIDAD_OPTIONS;
  protected readonly vozOptions = VOZ_OPTIONS;
  protected readonly tipoColaOptions = TIPO_COLA_OPTIONS;
  protected readonly aperturaOptions = APERTURA_OPTIONS;

  private readonly pristine = signal<FormState>({ ...DEFAULT_FORM });
  protected readonly form = signal<FormState>({ ...DEFAULT_FORM });
  protected readonly saving = signal(false);

  /** Dirty real = el form difiere del original guardado (deshacer cambios →
   * no deja guardar). */
  protected readonly dirty = computed(
    () => JSON.stringify(this.form()) !== JSON.stringify(this.pristine()),
  );
  protected readonly canSave = computed(() => this.dirty() && !this.saving());
  /** Público para el `formDirtyGuard` (canDeactivate) — confirma al salir con cambios. */
  readonly formDirty = this.dirty;

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
  }

  ngOnDestroy(): void {
    this.topBarSlot.clearActions();
  }

  protected update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  /** Adapter para `<sc-select>` single (Apertura de ficha). */
  protected onSelect(key: 'aperturaTipo', value: unknown): void {
    if (typeof value === 'string') this.update(key, value);
  }

  /** Adapter para `<sc-multiselect>` (emite `unknown[]`). Coerce a string[]. */
  protected onMulti(
    key: 'estrategia' | 'prioridad' | 'voz' | 'tipoColaEspera',
    value: unknown[],
  ): void {
    this.update(
      key,
      value.filter((v): v is string => typeof v === 'string'),
    );
  }

  protected cancel(): void {
    this.form.set(structuredClone(this.pristine()));
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.pristine.set(structuredClone(this.form()));
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('config.aed.subpages.grupos.toast.saved'),
        life: TOAST_LIFE.success,
      });
    }, 600);
  }
}
