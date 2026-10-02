import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type {
  ScMatrixColumn,
  ScMatrixColumnToggle,
  ScMatrixRow,
  ScMatrixToggle,
} from '@smartcontact-hub/components';
import { MessageService } from 'primeng/api';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { stableStringify } from '@shared/utils/form-dirty-state';
import {
  AgentDefaults,
  AgentPermissions,
  DESTINO_KEYS,
  DestinoCol,
  DestinoKey,
  PERMISSION_MATRIX_KEYS,
} from '@features/admin/agents/data/agents-data';
import { CHANNEL_FAMILIES, FAMILY_LABEL_KEYS } from '@features/admin/groups/data/groups-data';
import type { Channel } from '@features/admin/services/group-agent-links.types';
import { AgentDefaultsStore } from '@features/admin/agents/state/agent-defaults.store';

import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  ScDividerComponent as DividerComponent,
  ScInputTextComponent as InputTextComponent,
  ScPermissionMatrixComponent as PermissionMatrixComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';

/**
 * Contact Center › Agentes — `/config/aed/agentes`. Con esto nace cada agente nuevo (DD-135).
 *
 * Con las PALABRAS y la matriz de la ficha de agente: a qué numeración llama y transfiere (cuatro destinos por dos
 * columnas), su Configuración (gestión de dispositivos y activación por grupo) y su Integración (URL del iframe y
 * dispositivos externos). Lo guarda `AgentDefaultsStore` y lo lee la ficha al crear.
 *
 * Hasta el 2026-09-29 era la réplica de la maqueta (Figma Supervisor 393:12562), que no guardaba nada y tenía sus
 * propias filas («Llamadas internas»), sus propias columnas («Permisos») y un título de la URL que la ficha no tiene.
 * Guardado único en la TopBar.
 */
@Component({
  selector: 'sc-aed-agentes-page',
  imports: [
    ButtonComponent,
    CheckboxComponent,
    DividerComponent,
    InputTextComponent,
    PermissionMatrixComponent,
    SectionCardComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './aed-agentes-page.component.html',
  styleUrls: ['./aed-defaults-page.component.scss', './aed-agentes-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AedAgentesPageComponent implements DirtyAware {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  /* El idioma como DEPENDENCIA de los computed de la matriz: `translate.instant()` es una llamada, no una señal, y
   * sin esto las cabeceras y los nombres de fila se congelan al cambiar de idioma (§6 de `audit:datatables`). */
  private readonly lang = injectLangChange();
  private readonly store = inject(AgentDefaultsStore);

  protected readonly form = signal<AgentDefaults>(structuredClone(this.store.defaults()));
  protected readonly saving = signal(false);

  /** Dirty real = el form difiere de lo guardado (deshacer cambios → no deja guardar). */
  protected readonly dirty = computed(
    () => stableStringify(this.form()) !== stableStringify(this.store.defaults()),
  );
  protected readonly canSave = computed(() => this.dirty() && !this.saving());
  /** Público para el `formDirtyGuard` (canDeactivate) — confirma al salir con cambios. */
  readonly formDirty = this.dirty;

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  /** Filas y columnas de la matriz, ya traducidas: el DS no traduce contenido. Las mismas que la ficha de agente. */
  protected readonly matrixRows = computed<readonly ScMatrixRow[]>(() => {
    this.lang();
    return DESTINO_KEYS.map((row) => ({
      id: row,
      label: this.translate.instant('agents.form.permissions.row_' + row),
    }));
  });

  protected readonly matrixColumns = computed<readonly ScMatrixColumn[]>(() => {
    this.lang();
    return [
      { id: 'llamada', label: this.translate.instant('agents.form.permissions.col_llamada') },
      { id: 'transferencia', label: this.translate.instant('agents.form.permissions.col_transferencia') },
    ];
  });

  protected readonly matrixChecked = computed(() => {
    const permissions = this.form().permissions;
    return (rowId: string, columnId: string): boolean =>
      permissions[PERMISSION_MATRIX_KEYS[rowId as DestinoKey][columnId as DestinoCol]];
  });

  protected onMatrixToggle(e: ScMatrixToggle): void {
    this.setPermission(PERMISSION_MATRIX_KEYS[e.rowId as DestinoKey][e.columnId as DestinoCol], e.checked);
  }

  /** Marcar o desmarcar una columna entera, como en la ficha. */
  protected onMatrixColumnToggle(e: ScMatrixColumnToggle): void {
    this.form.update((f) => {
      const permissions = { ...f.permissions };
      for (const row of DESTINO_KEYS) permissions[PERMISSION_MATRIX_KEYS[row][e.columnId as DestinoCol]] = e.checked;
      return { ...f, permissions };
    });
  }

  protected readonly allowedFamilies = CHANNEL_FAMILIES;
  protected readonly allowedFamilyLabels = FAMILY_LABEL_KEYS;

  protected setAllowedChannel(channel: Channel, checked: boolean): void {
    this.form.update(form => ({ ...form, allowedChannels: CHANNEL_FAMILIES.filter(family => family === channel ? checked : form.allowedChannels.includes(family)) }));
  }

  protected setPermission(key: keyof AgentPermissions, value: boolean): void {
    this.form.update((f) => ({ ...f, permissions: { ...f.permissions, [key]: value } }));
  }

  protected setIframeUrl(value: string): void {
    this.form.update((f) => ({ ...f, iframeUrl: value }));
  }

  protected cancel(): void {
    this.form.set(structuredClone(this.store.defaults()));
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    setTimeout(() => {
      this.store.save(structuredClone(this.form()));
      this.saving.set(false);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('config.aed.subpages.agentes.toast.saved'),
        life: TOAST_LIFE.success,
      });
    }, 600);
  }
}
