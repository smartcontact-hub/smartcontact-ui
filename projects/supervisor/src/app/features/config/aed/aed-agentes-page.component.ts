import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type {
  ScMatrixColumn,
  ScMatrixRow,
  ScMatrixToggle,
} from '@smartcontact-hub/components';
import { MessageService } from 'primeng/api';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { TOAST_LIFE } from '@core/utils/toast-life';

import {
  ScButtonComponent as ButtonComponent,
  ScDividerComponent as DividerComponent,
  ScInputTextComponent as InputTextComponent,
  ScPermissionMatrixComponent as PermissionMatrixComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { stableStringify } from '../../../shared/utils/form-dirty-state';

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
    DividerComponent,
    InputTextComponent,
    PermissionMatrixComponent,
    SectionCardComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './aed-agentes-page.component.html',
  styleUrls: [
    './aed-defaults-page.component.scss',
    './aed-agentes-page.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AedAgentesPageComponent implements DirtyAware {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  /* El idioma como DEPENDENCIA de los computed de abajo. `translate.instant()`
   * es una llamada, no una señal: sin esto las cabeceras y los nombres de fila
   * se calculan una vez y se congelan al cambiar de idioma. Es la §6 de
   * `audit:datatables`, que solo sabe mirar un computed llamado `columns` — el
   * defecto es el mismo se llame como se llame. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang)
    ),
    { initialValue: this.translate.currentLang }
  );

  protected readonly comunicacionKeys = COMUNICACION_KEYS;

  private readonly pristine = signal<FormState>(this.cloneDefault());
  protected readonly form = signal<FormState>(this.cloneDefault());
  protected readonly saving = signal(false);

  /** Dirty real = el form difiere del original guardado (deshacer cambios →
   * no deja guardar). */
  protected readonly dirty = computed(
    () => stableStringify(this.form()) !== stableStringify(this.pristine())
  );
  protected readonly canSave = computed(() => this.dirty() && !this.saving());
  /** Público para el `formDirtyGuard` (canDeactivate) — confirma al salir con cambios. */
  readonly formDirty = this.dirty;

  private readonly topbarActions =
    viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  /** Filas y columnas de la matriz, ya traducidas: el DS no traduce contenido
   *  (mismo contrato que las `ScColumnDef` de las listas de administración). */
  protected readonly matrixRows = computed<readonly ScMatrixRow[]>(() => {
    this.currentLang();
    return COMUNICACION_KEYS.map((row) => ({
      id: row,
      label: this.translate.instant(
        'config.aed.subpages.agentes.comunicaciones.row_' + row
      ),
    }));
  });

  protected readonly matrixColumns = computed<readonly ScMatrixColumn[]>(() => {
    this.currentLang();
    return [
      {
        id: 'transferencias',
        label: this.translate.instant(
          'config.aed.subpages.agentes.comunicaciones.col_transferencias'
        ),
      },
      {
        id: 'permisos',
        label: this.translate.instant(
          'config.aed.subpages.agentes.comunicaciones.col_permisos'
        ),
      },
    ];
  });

  protected readonly matrixChecked = computed(() => {
    const permisos = this.form().permisos;
    return (rowId: string, columnId: string): boolean =>
      permisos[rowId as ComunicacionKey][columnId as PermisoCol];
  });

  protected onMatrixToggle(e: ScMatrixToggle): void {
    this.setPermiso(
      e.rowId as ComunicacionKey,
      e.columnId as PermisoCol,
      e.checked
    );
  }

  protected setPermiso(
    row: ComunicacionKey,
    col: PermisoCol,
    value: boolean
  ): void {
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
    value: FormState[K]
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
        summary: this.translate.instant(
          'config.aed.subpages.agentes.toast.saved'
        ),
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
