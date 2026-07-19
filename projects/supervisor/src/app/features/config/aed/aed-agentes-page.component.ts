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

import { DirtyAware } from '@core/guards';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';

import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  ScDividerComponent as DividerComponent,
  ScInputTextComponent as InputTextComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';

type ComunicacionKey =
  | 'fijos'
  | 'moviles'
  | 'internacionales'
  | 'numeracionEspecial'
  | 'llamadasInternas';
type PermisoCol = 'transferencias' | 'permisos';

type PermisosMatrix = Record<ComunicacionKey, Record<PermisoCol, boolean>>;

interface FormState {
  permisos: PermisosMatrix;
  /** Configuración. */
  activacionGrupo: boolean;
  gestionDispositivos: boolean;
  dispositivosExternos: boolean;
  /** URL embebida en el puesto de agente. */
  iframeUrl: string;
  iframeTitulo: string;
}

const COMUNICACION_KEYS: readonly ComunicacionKey[] = [
  'fijos',
  'moviles',
  'internacionales',
  'numeracionEspecial',
  'llamadasInternas',
];

const DEFAULT_FORM: FormState = {
  permisos: {
    fijos: { transferencias: true, permisos: true },
    moviles: { transferencias: false, permisos: true },
    internacionales: { transferencias: false, permisos: true },
    numeracionEspecial: { transferencias: false, permisos: true },
    llamadasInternas: { transferencias: false, permisos: true },
  },
  activacionGrupo: true,
  gestionDispositivos: true,
  dispositivosExternos: true,
  iframeUrl: '',
  iframeTitulo: '',
};

/**
 * Agentes defaults page — `/config/aed/agentes`. Figma Supervisor `1:12496`.
 *
 * Card "Comunicaciones" como matriz de permisos (filas = tipo de
 * comunicación × columnas Transferencias / Permisos), seguida de la
 * sección Configuración (3 toggles) y una card "URL embebida en el
 * puesto de agente" (URL + título). Guardado único en la TopBar.
 */
@Component({
  selector: 'sc-aed-agentes-page',
  imports: [
    ButtonComponent,
    CheckboxComponent,
    DividerComponent,
    InputTextComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './aed-agentes-page.component.html',
  styleUrls: ['./aed-defaults-page.component.scss', './aed-agentes-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AedAgentesPageComponent implements OnDestroy, DirtyAware {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly topBarSlot = inject(TopBarSlotService);

  protected readonly comunicacionKeys = COMUNICACION_KEYS;

  private readonly pristine = signal<FormState>(this.cloneDefault());
  protected readonly form = signal<FormState>(this.cloneDefault());
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

  protected setPermiso(row: ComunicacionKey, col: PermisoCol, value: boolean): void {
    this.form.update((f) => ({
      ...f,
      permisos: {
        ...f.permisos,
        [row]: { ...f.permisos[row], [col]: value },
      },
    }));
  }

  protected update<K extends Exclude<keyof FormState, 'permisos'>>(
    key: K,
    value: FormState[K],
  ): void {
    this.form.update((f) => ({ ...f, [key]: value }));
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
        summary: this.translate.instant('config.aed.subpages.agentes.toast.saved'),
        life: TOAST_LIFE.success,
      });
    }, 600);
  }

  private cloneDefault(): FormState {
    return {
      ...DEFAULT_FORM,
      permisos: {
        fijos: { ...DEFAULT_FORM.permisos.fijos },
        moviles: { ...DEFAULT_FORM.permisos.moviles },
        internacionales: { ...DEFAULT_FORM.permisos.internacionales },
        numeracionEspecial: { ...DEFAULT_FORM.permisos.numeracionEspecial },
        llamadasInternas: { ...DEFAULT_FORM.permisos.llamadasInternas },
      },
    };
  }
}
