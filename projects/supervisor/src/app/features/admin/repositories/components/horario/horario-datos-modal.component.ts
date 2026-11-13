import { ChangeDetectionStrategy, Component, computed, inject, input, type OnInit, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScInputTextComponent, ScSelectComponent } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import { ayudaDeObligatorio, dejoElCampo } from '@shared/utils/alta-secciones';

export interface DatosDeHorario {
  readonly name: string;
  readonly timezone: string;
  readonly description: string;
}

/**
 * Los datos generales del horario (nombre, zona horaria, descripción) en un diálogo, tras el lápiz de la cabecera.
 * Se configuran una vez y no hace falta verlos todo el rato: salen de la pantalla (experimento). «Activo» se queda
 * en la cabecera, porque es lo que se enciende y se apaga con frecuencia.
 */
@Component({
  selector: 'sc-horario-datos-modal',
  imports: [ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScInputTextComponent, ScSelectComponent, TooltipModule, TranslateModule],
  template: `
    <sc-custom-modal [visible]="true" width="34rem" [title]="'repositories.horarios.x.general.title' | translate" (closed)="cerrado.emit()">
      <div class="datos">
        <sc-inputtext
          inputId="horario-name"
          fluid
          required
          [label]="'repositories.columns.name' | translate"
          [placeholder]="'repositories.horarios.name_placeholder' | translate"
          [value]="nombre()"
          [helperText]="tocado() ? undefined : ayuda()"
          [error]="tocado() && !nombre().trim() ? faltaNombre() : undefined"
          (valueChange)="nombre.set($event)"
          (focusout)="dejar($event)"
        />
        <sc-select
          inputId="horario-zona"
          filter
          [label]="'repositories.horarios.timezone' | translate"
          [helperText]="'repositories.horarios.timezone_help' | translate"
          [options]="zonas()"
          optionLabel="label"
          optionValue="value"
          [value]="zona()"
          (valueChange)="zona.set($any($event))"
        />
        <sc-inputtext
          inputId="horario-description"
          fluid
          [label]="'repositories.columns.description' | translate"
          [placeholder]="'repositories.placeholders.description' | translate"
          [value]="descripcion()"
          (valueChange)="descripcion.set($event)"
        />
      </div>
      <div scCustomModalFooter>
        <sc-button size="sm" variant="secondary" appearance="outlined" [label]="'common.cancel' | translate" (clicked)="cerrado.emit()" />
        <sc-button
          size="sm"
          variant="primary"
          [disabled]="!nombre().trim()"
          [pTooltip]="nombre().trim() ? '' : faltaNombre()"
          tooltipPosition="top"
          tooltipEvent="both"
          [label]="'common.save' | translate"
          (clicked)="confirmar()"
        />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .datos {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioDatosModalComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly datos = input.required<DatosDeHorario>();
  readonly guardar = output<DatosDeHorario>();
  readonly cerrado = output<void>();

  protected readonly nombre = signal('');
  protected readonly zona = signal('Europe/Madrid');
  protected readonly descripcion = signal('');
  protected readonly tocado = signal(false);

  ngOnInit(): void {
    const d = this.datos();
    this.nombre.set(d.name);
    this.zona.set(d.timezone);
    this.descripcion.set(d.description);
  }

  protected readonly faltaNombre = computed(() => {
    this.lang();
    return this.translate.instant('repositories.horarios.errors.name_required') as string;
  });
  protected readonly ayuda = computed(() => ayudaDeObligatorio(this.faltaNombre()));

  protected readonly zonas = computed(() => {
    const conocidas = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return [...new Set([this.zona(), 'UTC', ...conocidas])].sort().map((z) => ({ value: z, label: z }));
  });

  protected dejar(event: FocusEvent): void {
    if (!this.nombre().trim() && dejoElCampo(event)) this.tocado.set(true);
  }

  protected confirmar(): void {
    if (!this.nombre().trim()) {
      this.tocado.set(true);
      return;
    }
    this.guardar.emit({ name: this.nombre().trim(), timezone: this.zona(), description: this.descripcion().trim() });
  }
}
