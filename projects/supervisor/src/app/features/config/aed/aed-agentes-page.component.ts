import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type {
  ScMatrixColumn,
  ScMatrixColumnToggle,
  ScMatrixRow,
  ScMatrixToggle,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import {
  AgentDefaults,
  AgentPermissions,
  DESTINO_KEYS,
  DestinoCol,
  DestinoKey,
  matrixCell,
  setMatrixCell,
} from '@features/admin/agents/data/agents-data';
import { CHANNEL_FAMILIES, FAMILY_LABEL_KEYS } from '@features/admin/groups/data/groups-data';
import type { Channel } from '@features/admin/services/group-agent-links.types';
import { AgentDefaultsStore } from '@features/admin/agents/state/agent-defaults.store';

import {
  ScCheckboxComponent as CheckboxComponent,
  ScDividerComponent as DividerComponent,
  ScInputTextComponent as InputTextComponent,
  ScPermissionMatrixComponent as PermissionMatrixComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ContactCenterBorradorService } from './contact-center-borrador.service';

/**
 * Contact Center › Agentes — `/config/aed/agentes`. Con esto nace cada agente nuevo (DD-135).
 *
 * Con las PALABRAS y la matriz de la ficha de agente: a qué numeración llama y transfiere (cuatro destinos por dos
 * columnas), su Configuración (gestión de dispositivos y activación por grupo) y su Integración (URL del iframe y
 * dispositivos externos). Lo guarda `AgentDefaultsStore` y lo lee la ficha al crear.
 *
 * Hasta el 2026-09-29 era la réplica de la maqueta (Figma Supervisor 393:12562), que no guardaba nada y tenía sus
 * propias filas («Llamadas internas»), sus propias columnas («Permisos») y un título de la URL que la ficha no tiene.
 * Se guarda con las otras dos secciones, con el «Guardar» de la barra (DD-211 §7): su formulario es una parte del
 * borrador de Contact Center.
 */
@Component({
  selector: 'sc-aed-agentes-page',
  imports: [
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
export class AedAgentesPageComponent {
  private readonly translate = inject(TranslateService);
  /* El idioma como DEPENDENCIA de los computed de la matriz: `translate.instant()` es una llamada, no una señal, y
   * sin esto las cabeceras y los nombres de fila se congelan al cambiar de idioma (§6 de `audit:datatables`). */
  private readonly lang = injectLangChange();
  private readonly store = inject(AgentDefaultsStore);

  /** Su parte del borrador de Contact Center: la misma al volver a la sección, con lo que se dejó sin guardar. */
  protected readonly form = inject(ContactCenterBorradorService).parte<AgentDefaults>('agentes', {
    inicial: () => this.store.defaults(),
    persistir: (valor) => this.store.save(valor),
  });

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
      matrixCell(permissions, rowId as DestinoKey, columnId as DestinoCol);
  });

  protected onMatrixToggle(e: ScMatrixToggle): void {
    this.form.update((f) => {
      const permissions = { ...f.permissions };
      setMatrixCell(permissions, e.rowId as DestinoKey, e.columnId as DestinoCol, e.checked);
      return { ...f, permissions };
    });
  }

  /** Marcar o desmarcar una columna entera, como en la ficha. */
  protected onMatrixColumnToggle(e: ScMatrixColumnToggle): void {
    this.form.update((f) => {
      const permissions = { ...f.permissions };
      for (const row of DESTINO_KEYS) setMatrixCell(permissions, row, e.columnId as DestinoCol, e.checked);
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
}
