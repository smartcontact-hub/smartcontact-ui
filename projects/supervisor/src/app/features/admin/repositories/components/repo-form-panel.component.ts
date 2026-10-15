import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  booleanAttribute,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ScTextareaComponent as TextareaComponent,
  ScButtonComponent as ButtonComponent,
  ScInputTextComponent as InputTextComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { RepoEntity, RepoFieldDef } from './repo-types';
import { focoDeVueltaAlCerrar } from '@core/utils/foco-de-vuelta';

export type RepoFormSubmission = Readonly<Record<string, string>>;

/**
 * Generic create / edit panel rendered by `<sc-repo-list-page>` for every
 * repository instance. Field set is data-driven; supports text, textarea,
 * select and switch inputs. Validates required fields and the duplicate-name constraint
 * (case-insensitive, ignoring the current record).
 */
@Component({
  selector: 'sc-repo-form-panel',
  imports: [
    TextareaComponent,
    ButtonComponent,
    FormsModule,
    IconComponent,
    InputTextComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './repo-form-panel.component.html',
  styleUrl: './repo-form-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoFormPanelComponent<T extends RepoEntity> implements OnInit, AfterViewInit {
  constructor() {
    // Al cerrarse, el foco vuelve al botón que lo abrió (candidato 29 del barrido; antes se iba al `body`).
    focoDeVueltaAlCerrar();
  }

  private readonly translate = inject(TranslateService);

  readonly fields = input.required<readonly RepoFieldDef[]>();
  readonly initial = input<T | null>(null);
  readonly existingNames = input.required<readonly string[]>();
  /** Nombre singular de la entidad ya traducido (resuelto en el caller via
   *  `translate.instant(config().entitySingularKey)`). S51 sweep AED i18n. */
  readonly entitySingular = input.required<string>();
  /** El título del alta de este repositorio, con su género («Nueva tipificación»). Sin él, el genérico. */
  readonly createTitleKey = input<string | undefined>(undefined);

  /** Dentro de un diálogo (la ficha de grupo crea así desde Recursos): sin caja, sin título y sin `role="dialog"`,
   *  porque el diálogo ya pone los tres; el formulario ocupa su cuerpo. */
  readonly flush = input(false, { transform: booleanAttribute });
  /** El formulario en dos columnas, con los títulos de sección (`sectionKey`) a todo el ancho: para el de un contacto. */
  readonly twoColumns = input(false, { transform: booleanAttribute });
  /** Dice «(opcional)» en cada campo que no es obligatorio. Con muchos campos opcionales, es ruido: se apaga. */
  readonly showOptional = input(true, { transform: booleanAttribute });

  /** Una regla más, de quien lo usa (el teléfono de un contacto, DD-163): recibe los valores ya recortados y devuelve
   *  la clave del error, o nada. Va después de las de siempre (nombre, repetido, obligatorios). */
  readonly validate = input<((values: RepoFormSubmission) => string | null) | undefined>(undefined);

  readonly save = output<RepoFormSubmission>();
  readonly cancelled = output<void>();

  /** La clave del título: editar, el alta de este repositorio o, si no la tiene, el genérico «Nuevo/a {{entity}}». */
  protected readonly tituloKey = computed(() =>
    this.initial() ? 'repositories.form.edit_title' : (this.createTitleKey() ?? 'repositories.form.create_title'),
  );

  protected readonly alertIcon = 'warning';
  protected readonly values = signal<Record<string, string>>({});
  protected readonly error = signal('');

  @ViewChild('firstInput', { read: ElementRef })
  private readonly firstInput?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    const seed = this.initial();
    const next: Record<string, string> = {};
    for (const field of this.fields()) {
      if (seed) {
        const raw = (seed as unknown as Record<string, unknown>)[field.key];
        next[field.key] = raw == null ? '' : String(raw);
      } else if ((field.type === 'select' || field.type === 'switch') && field.options?.length) {
        next[field.key] = field.options[0]!.value;
      } else {
        next[field.key] = '';
      }
    }
    this.values.set(next);
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.firstInput?.nativeElement.querySelector('input')?.focus());
  }

  protected onChange(key: string, value: string): void {
    this.values.update((current) => ({ ...current, [key]: value }));
    if (this.error()) this.error.set('');
  }

  /** Un interruptor está encendido si vale su primera opción. */
  protected switchOn(field: RepoFieldDef): boolean {
    return this.values()[field.key] === field.options?.[0]?.value;
  }

  protected onSwitchChange(field: RepoFieldDef, on: boolean): void {
    const value = field.options?.[on ? 0 : 1]?.value;
    if (value !== undefined) this.onChange(field.key, value);
  }

  /** El rótulo del estado en que está el interruptor, junto a él. */
  protected switchLabelKey(field: RepoFieldDef): string {
    return field.options?.[this.switchOn(field) ? 0 : 1]?.labelKey ?? '';
  }

  protected onSelectValueChange(key: string, value: unknown): void {
    if (typeof value === 'string') this.onChange(key, value);
  }

  protected onKey(event: KeyboardEvent, allowEnterSave = true): void {
    if (event.key === 'Enter' && !event.shiftKey && allowEnterSave) {
      event.preventDefault();
      this.onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
    }
  }

  protected onSave(): void {
    if (!this.checkValues()) return;
    this.save.emit(this.trimmed());
  }

  private trimmed(): Record<string, string> {
    const trimmed: Record<string, string> = {};
    for (const field of this.fields()) {
      trimmed[field.key] = this.values()[field.key]?.trim() ?? '';
    }
    return trimmed;
  }

  private checkValues(): boolean {
    const values = this.values();
    const name = (values['name'] ?? '').trim();
    if (!name) {
      this.error.set(this.translate.instant('repositories.errors.name_required'));
      return false;
    }
    const initialName = this.initial()?.name ?? '';
    const duplicate = this.existingNames().some(
      (n) =>
        n.toLowerCase() === name.toLowerCase() && n.toLowerCase() !== initialName.toLowerCase(),
    );
    if (duplicate) {
      this.error.set(
        this.translate.instant('repositories.errors.duplicate_name', {
          entity: this.entitySingular(),
        }),
      );
      return false;
    }
    for (const field of this.fields()) {
      if (field.required && !(values[field.key] ?? '').trim()) {
        this.error.set(
          this.translate.instant('repositories.errors.field_required', {
            field: this.translate.instant(field.labelKey),
          }),
        );
        return false;
      }
    }
    const extra = this.validate()?.(this.trimmed());
    if (extra) {
      this.error.set(this.translate.instant(extra));
      return false;
    }
    this.error.set('');
    return true;
  }
}
