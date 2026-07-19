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
  ScChipComponent as ChipComponent,
  ScDialogComponent as DialogComponent,
  ScDividerComponent as DividerComponent,
  ScInputTextComponent as InputTextComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScRadioButtonComponent as RadioButtonComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';

interface VisibilidadEstados {
  postConversando: boolean;
  conversando: boolean;
  administrativo: boolean;
  noDisponible: boolean;
  desconectado: boolean;
}

interface NotifEventos {
  inicio: boolean;
  fin: boolean;
  resultado: boolean;
}

interface FormState {
  /** Motivos editables de "No disponible" (Baño, Comida…). Disponible y No
   * disponible son base y no se listan aquí. */
  estadosNoDisponibles: readonly string[];
  /** Checkbox "Estado administrativo" junto a No disponible. */
  estadoAdministrativo: boolean;

  /** Bloqueo de puesto por inactividad. */
  telefonoBloqueo: boolean;
  cuarentenaSegundos: number;
  navegadorBloqueo: boolean;
  bloquearTrasConversaciones: number;

  /** Ventana de llamada y transferencia. */
  verEstadoOtros: boolean;
  verAgentesAleatorio: boolean;

  /** Estados visibles por el agente. */
  visibilidadEstados: VisibilidadEstados;
  filtrarEstados: boolean;

  /** Aviso de conversación. */
  tipoDescuelgue: string;
  alertingTipo: 'nombre' | 'telefono';

  /** Notificaciones a sistemas externos (eventos gated por URL). */
  notifEntranteUrl: string;
  notifEntrante: NotifEventos;
  notifSalienteUrl: string;
  notifSaliente: NotifEventos;
}

const DESCUELGUE_OPTIONS = ['Manual', 'Automático', 'Automático con preview'] as const;

const DEFAULT_FORM: FormState = {
  estadosNoDisponibles: ['Baño', 'Comida', 'Formación'],
  estadoAdministrativo: true,
  telefonoBloqueo: true,
  cuarentenaSegundos: 9,
  navegadorBloqueo: true,
  bloquearTrasConversaciones: 3,
  verEstadoOtros: true,
  verAgentesAleatorio: true,
  visibilidadEstados: {
    postConversando: true,
    conversando: true,
    administrativo: true,
    noDisponible: true,
    desconectado: true,
  },
  filtrarEstados: true,
  tipoDescuelgue: '',
  alertingTipo: 'telefono',
  notifEntranteUrl: '',
  notifEntrante: { inicio: true, fin: true, resultado: true },
  notifSalienteUrl: '',
  notifSaliente: { inicio: true, fin: true, resultado: true },
};

const VISIBILIDAD_LABELS: readonly { key: keyof VisibilidadEstados; tone: string }[] = [
  { key: 'postConversando', tone: 'cyan' },
  { key: 'conversando', tone: 'green' },
  { key: 'administrativo', tone: 'amber' },
  { key: 'noDisponible', tone: 'red' },
  { key: 'desconectado', tone: 'gray' },
];

const NOTIF_EVENTOS: readonly (keyof NotifEventos)[] = ['inicio', 'fin', 'resultado'];

/**
 * General defaults page — `/config/aed/servicio` (rótulo "General").
 * Figma Supervisor `1:12270`.
 *
 * Página flush de una columna con guardado único en la TopBar (modelo
 * "todo arriba" S59): cabecera con icono + secciones separadas por
 * divisores. Secciones (orden Figma): Estados de agentes · Bloqueo de
 * puesto por inactividad · Configuración de ventana de llamada y
 * transferencia · Estados visibles por el agente · Aviso de
 * conversación · Notificaciones a sistemas externos (eventos
 * deshabilitados hasta que la URL tiene valor).
 */
@Component({
  selector: 'sc-aed-servicio-page',
  imports: [
    ButtonComponent,
    CheckboxComponent,
    ChipComponent,
    DialogComponent,
    DividerComponent,
    InputTextComponent,
    InputNumberComponent,
    RadioButtonComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './aed-servicio-page.component.html',
  styleUrls: ['./aed-defaults-page.component.scss', './aed-servicio-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AedServicioPageComponent implements OnDestroy, DirtyAware {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly topBarSlot = inject(TopBarSlotService);
  protected readonly addIcon = 'add';

  protected readonly descuelgueOptions = DESCUELGUE_OPTIONS;
  protected readonly visibilidadLabels = VISIBILIDAD_LABELS;
  protected readonly notifEventos = NOTIF_EVENTOS;

  /** Estado original (guardado). `dirty` se deriva comparando con esto, así
   * que deshacer los cambios (volver a los valores originales) desactiva el
   * guardar — no hay cambio que persistir. */
  private readonly pristine = signal<FormState>(this.cloneDefault());
  protected readonly form = signal<FormState>(this.cloneDefault());
  protected readonly saving = signal(false);

  /** Modal "Añadir estado" (Figma 103:2718): visibilidad + draft del input. */
  protected readonly modalOpen = signal(false);
  protected readonly draft = signal('');

  protected readonly dirty = computed(
    () => JSON.stringify(this.form()) !== JSON.stringify(this.pristine()),
  );
  protected readonly canSave = computed(() => this.dirty() && !this.saving());
  /** Público para el `formDirtyGuard` (canDeactivate) — confirma al salir con cambios. */
  readonly formDirty = this.dirty;

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59). */
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

  /* ---------- Estados de agentes ---------- */

  protected openAddModal(): void {
    this.draft.set('');
    this.modalOpen.set(true);
  }

  /** Confirma el alta desde el modal: añade el estado (si no vacío ni duplicado)
   * y cierra. El chip nuevo entra animado (CSS `chip-appear`, ver SCSS). */
  /*
   * R6 en el alta de estados.
   *
   * Antes, `confirmAddReason` comprobaba el duplicado y, si lo era, NO añadía
   * nada, cerraba el modal y limpiaba el campo. Desde fuera era indistinguible
   * de un fallo de la aplicación: escribías un nombre, pulsabas Añadir y no
   * pasaba nada. El sistema descartaba tu texto en silencio.
   *
   * Misma regla que en los formularios admin: el error se dice por CONTENIDO
   * equivocado y en vivo; el campo vacío calla, porque aún no es un error.
   */
  protected readonly draftError = computed<string | null>(() => {
    const value = this.draft().trim();
    if (value.length === 0) return null;
    return this.form().estadosNoDisponibles.includes(value)
      ? 'config.aed.subpages.servicio.estados.error_duplicate'
      : null;
  });

  protected readonly canAddReason = computed(
    () => this.draft().trim().length > 0 && this.draftError() === null,
  );

  /** Por qué no se puede añadir, en palabras: un botón gris sin motivo obliga
   *  a adivinar. Vacío no se explica en el botón —lo dice el propio campo con
   *  su placeholder— pero el duplicado sí. */
  protected readonly addReasonDisabledReason = computed<string | null>(() =>
    this.canAddReason() ? null : this.draftError(),
  );

  protected confirmAddReason(): void {
    // La guarda se mantiene: `keyup.enter` puede disparar con el botón
    // deshabilitado, así que el estado inválido no puede colarse por ahí.
    if (!this.canAddReason()) return;
    this.form.update((f) => ({
      ...f,
      estadosNoDisponibles: [...f.estadosNoDisponibles, this.draft().trim()],
    }));
    this.modalOpen.set(false);
    this.draft.set('');
  }

  protected removeReason(reason: string): void {
    this.form.update((f) => ({
      ...f,
      estadosNoDisponibles: f.estadosNoDisponibles.filter((t) => t !== reason),
    }));
  }

  /* ---------- Estados visibles ---------- */

  protected toggleVisibilidad(key: keyof VisibilidadEstados, value: boolean): void {
    this.form.update((f) => ({
      ...f,
      visibilidadEstados: { ...f.visibilidadEstados, [key]: value },
    }));
  }

  /* ---------- Notificaciones (eventos gated por URL) ---------- */

  protected hasEntranteUrl = computed(() => this.form().notifEntranteUrl.trim().length > 0);
  protected hasSalienteUrl = computed(() => this.form().notifSalienteUrl.trim().length > 0);

  protected toggleNotif(
    channel: 'notifEntrante' | 'notifSaliente',
    key: keyof NotifEventos,
    value: boolean,
  ): void {
    this.form.update((f) => ({
      ...f,
      [channel]: { ...f[channel], [key]: value },
    }));
  }

  /* ---------- Generic field updates ---------- */

  protected update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected onNumberChange<K extends 'cuarentenaSegundos' | 'bloquearTrasConversaciones'>(
    key: K,
    value: number | null,
  ): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.update(key, value);
  }

  protected onDescuelgueChange(value: unknown): void {
    if (typeof value === 'string') this.update('tipoDescuelgue', value);
  }

  protected onAlertingChange(value: 'nombre' | 'telefono'): void {
    this.update('alertingTipo', value);
  }

  /* ---------- Save / cancel (TopBar) ---------- */

  protected cancel(): void {
    this.form.set(structuredClone(this.pristine()));
    this.modalOpen.set(false);
    this.draft.set('');
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.pristine.set(structuredClone(this.form()));
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('config.aed.subpages.servicio.toast.saved'),
        life: TOAST_LIFE.success,
      });
    }, 600);
  }

  private cloneDefault(): FormState {
    return {
      ...DEFAULT_FORM,
      estadosNoDisponibles: [...DEFAULT_FORM.estadosNoDisponibles],
      visibilidadEstados: { ...DEFAULT_FORM.visibilidadEstados },
      notifEntrante: { ...DEFAULT_FORM.notifEntrante },
      notifSaliente: { ...DEFAULT_FORM.notifSaliente },
    };
  }
}
