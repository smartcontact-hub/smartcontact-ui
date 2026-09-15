import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { TOAST_LIFE } from '@core/utils/toast-life';

import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  ScChipComponent as ChipComponent,
  ScDividerComponent as DividerComponent,
  ScInputGroupComponent as InputGroupComponent,
  ScInputTextComponent as InputTextComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScRadioButtonComponent as RadioButtonComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScOptionCardsComponent as OptionCardsComponent,
  ScTagComponent as TagComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
/* El grupo con prefijo se compone con las piezas de PrimeNG que el DS expone para eso
 * (`sc-inputgroup` + addon + `pInputText`), que es como lo documenta su propia ficha. */
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { stableStringify } from '../../../shared/utils/form-dirty-state';
import { injectLangChange } from '@core/utils/lang-change';

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

/**
 * Las tres opciones de descuelgue, con su LÍNEA de qué hace cada una.
 *
 * Estaban en un desplegable, o sea tres nombres escondidos tras un clic, y «Automático con
 * preview» no dice en ninguna parte qué es el preview. Son POCAS (tres), EXCLUYENTES y lo
 * que las distingue es el comportamiento: el caso exacto de `sc-option-cards`.
 *
 * ⚠️ Las tres descripciones son la lectura razonable de cada modo, **no un dato medido**:
 * hay que confirmarlas con producto, igual que las de los estados.
 */
const DESCUELGUE_OPTIONS = ['manual', 'auto', 'auto_preview'] as const;

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
  { key: 'postConversando', tone: 'teal' },
  { key: 'conversando', tone: 'green' },
  { key: 'administrativo', tone: 'amber' },
  { key: 'noDisponible', tone: 'red' },
  { key: 'desconectado', tone: 'gray' },
];

const NOTIF_EVENTOS: readonly (keyof NotifEventos)[] = ['inicio', 'fin', 'resultado'];

/** Los dos canales, en tabla: misma pieza, solo cambian las claves. */
const NOTIF_CANALES: readonly {
  key: 'notifEntrante' | 'notifSaliente';
  urlKey: 'notifEntranteUrl' | 'notifSalienteUrl';
  i18n: 'entrante' | 'saliente';
}[] = [
  { key: 'notifEntrante', urlKey: 'notifEntranteUrl', i18n: 'entrante' },
  { key: 'notifSaliente', urlKey: 'notifSalienteUrl', i18n: 'saliente' },
];

/**
 * El esquema NO se escribe: lo pone el sistema.
 *
 * El aviso lleva datos de la conversación, así que tiene que ir cifrado, y pedirle a
 * alguien que «se acuerde de poner https://» es diseñar un error para luego cazarlo. Aquí
 * el `https://` es un trozo FIJO delante del campo: no se puede teclear mal porque no se
 * teclea. Lo que se guarda sigue siendo la URL entera.
 */
const HTTPS = 'https://';

/** Quita cualquier esquema de lo guardado para pintar SOLO el resto en el campo. */
const sinEsquema = (url: string): string => url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');

/**
 * Las dos reglas de "Bloqueo por inactividad", en tabla y no en dos bloques de
 * plantilla copiados: son la MISMA fila (interruptor · nombre · frase · número ·
 * sufijo) y solo cambian las claves. Escritas dos veces, la primera vez que una
 * cambie la otra se queda atrás — que es como esta pantalla acabó con dos
 * `inputnumber` en verticales distintas.
 */
const BLOQUEO_RULES: readonly {
  /** Clave en `FormState` (`telefonoBloqueo`). */
  key: 'telefonoBloqueo' | 'navegadorBloqueo';
  /** Clave del número que gobierna. */
  numKey: 'cuarentenaSegundos' | 'bloquearTrasConversaciones';
  /** Raíz de i18n (`telefono`), que NO coincide con la del formulario. */
  i18n: 'telefono' | 'navegador';
  /** Sufijo tras el número ("segundos", "conversaciones no atendidas"). */
  suffix: 'seconds' | 'conversaciones_suffix';
}[] = [
  {
    key: 'telefonoBloqueo',
    numKey: 'cuarentenaSegundos',
    i18n: 'telefono',
    suffix: 'seconds',
  },
  {
    key: 'navegadorBloqueo',
    numKey: 'bloquearTrasConversaciones',
    i18n: 'navegador',
    suffix: 'conversaciones_suffix',
  },
];

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
    DividerComponent,
    IconComponent,
    InputGroupComponent,
    InputGroupAddonModule,
    InputTextComponent,
    InputTextModule,
    InputNumberComponent,
    RadioButtonComponent,
    SectionCardComponent,
    OptionCardsComponent,
    TagComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './aed-servicio-page.component.html',
  styleUrls: ['./aed-defaults-page.component.scss', './aed-servicio-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AedServicioPageComponent implements DirtyAware {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  protected readonly addIcon = 'add';

  /** Traducidas aquí y no en la plantilla: `sc-option-cards` recibe DATOS, no plantillas. */
  protected readonly descuelgueOptions = computed(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    return DESCUELGUE_OPTIONS.map((key) => ({
      value: key,
      label: this.translate.instant(
        `config.aed.subpages.servicio.aviso.descuelgue_options.${key}.label`,
      ),
      description: this.translate.instant(
        `config.aed.subpages.servicio.aviso.descuelgue_options.${key}.desc`,
      ),
    }));
  });
  protected readonly visibilidadLabels = VISIBILIDAD_LABELS;
  protected readonly bloqueoRules = BLOQUEO_RULES;
  protected readonly notifEventos = NOTIF_EVENTOS;
  protected readonly notifCanales = NOTIF_CANALES;

  /** Estado original (guardado). `dirty` se deriva comparando con esto, así
   * que deshacer los cambios (volver a los valores originales) desactiva el
   * guardar — no hay cambio que persistir. */
  private readonly pristine = signal<FormState>(this.cloneDefault());
  protected readonly form = signal<FormState>(this.cloneDefault());
  protected readonly saving = signal(false);

  /**
   * Alta EN LÍNEA, no en modal.
   *
   * El caso real de esta lista no es añadir UN motivo, es escribir los que usa el
   * contact center de una sentada (Baño, Comida, Formación…). Con el modal cada uno
   * costaba cuatro interacciones y un cambio de contexto: abrir · escribir · pulsar
   * Añadir · volver a abrir. Aquí el hueco discontinuo se convierte en el campo, Enter
   * lo añade y DEJA EL CAMPO ABIERTO Y VACÍO para el siguiente, así que el segundo y
   * los que vengan cuestan solo escribir y Enter. Escape cierra.
   *
   * ⚠️ El modal 103:2718 de Figma deja de usarse aquí. Es una divergencia con la
   * maqueta, a propósito, y está en la bandeja.
   */
  protected readonly adding = signal(false);
  protected readonly draft = signal('');
  private readonly draftField = viewChild<ElementRef<HTMLElement>>('draftField');

  protected readonly dirty = computed(
    () => stableStringify(this.form()) !== stableStringify(this.pristine()),
  );
  protected readonly canSave = computed(() => this.dirty() && !this.saving());

  /** Público para el `formDirtyGuard` (canDeactivate) — confirma al salir con cambios. */
  readonly formDirty = this.dirty;

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);

    /*
     * El foco al campo de alta, por EFECTO y no por `setTimeout`.
     *
     * Con `setTimeout(…, 0)` el campo salía sin foco: medido en el navegador, el tick
     * corría antes de que el `viewChild` dentro del `@if` resolviera, así que
     * `draftField()` todavía era `undefined` y el `focus()` no se llamaba nunca —había
     * que dar un clic extra, justo lo que este cambio venía a quitar.
     *
     * El efecto LEE `draftField()`, así que vuelve a correr solo cuando la consulta
     * resuelve. Y como también lee `draft()`, refresca el foco tras cada alta: encadenar
     * motivos es escribir · Enter · escribir · Enter, sin tocar el ratón.
     */
    effect(() => {
      if (!this.adding()) return;
      this.draft();
      this.draftField()?.nativeElement.querySelector('input')?.focus();
    });
  }


  /* ---------- Estados de agentes ---------- */

  protected startAdding(): void {
    this.draft.set('');
    this.adding.set(true);
  }

  protected stopAdding(): void {
    this.adding.set(false);
    this.draft.set('');
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

  protected confirmAddReason(): void {
    // La guarda se mantiene: `keyup.enter` puede disparar con el botón
    // deshabilitado, así que el estado inválido no puede colarse por ahí.
    if (!this.canAddReason()) return;
    this.form.update((f) => ({
      ...f,
      estadosNoDisponibles: [...f.estadosNoDisponibles, this.draft().trim()],
    }));
    // El campo se queda abierto y vacío: encadenar es el caso normal.
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

  /** Lo que se PINTA en el campo: la URL guardada sin su `https://`. */
  protected resto(urlKey: 'notifEntranteUrl' | 'notifSalienteUrl'): string {
    return sinEsquema(this.form()[urlKey]);
  }

  /** Hay dirección = hay algo detrás del esquema. */
  protected tieneUrl(urlKey: 'notifEntranteUrl' | 'notifSalienteUrl'): boolean {
    return this.resto(urlKey).trim().length > 0;
  }

  /*
   * El error se dice por CONTENIDO equivocado y en vivo; el campo vacío calla, porque aún
   * no es un error (misma regla que el alta de estados).
   *
   * Y queda UN solo error posible, los espacios. Pegar la dirección entera —`https://…`,
   * que es lo que hace todo el mundo— no es un error: `onUrlChange` le quita el esquema y
   * se queda lo que hace falta. Un caso que el sistema sabe arreglar no se le devuelve a la
   * persona convertido en un mensaje rojo.
   */
  protected urlError(urlKey: 'notifEntranteUrl' | 'notifSalienteUrl'): string | null {
    const resto = this.resto(urlKey);
    if (resto.trim().length === 0) return null;
    return /\s/.test(resto) ? 'config.aed.subpages.servicio.notif.url_error' : null;
  }

  /** Escribe SIEMPRE con esquema, aunque el campo solo muestre el resto. */
  protected onUrlChange(urlKey: 'notifEntranteUrl' | 'notifSalienteUrl', value: string): void {
    const resto = sinEsquema(value).trim();
    this.update(urlKey, resto.length === 0 ? '' : HTTPS + resto);
  }

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

  protected onDescuelgueChange(value: string): void {
    this.update('tipoDescuelgue', value);
  }

  protected onAlertingChange(value: 'nombre' | 'telefono'): void {
    this.update('alertingTipo', value);
  }

  /* ---------- Save / cancel (TopBar) ---------- */

  /*
   * `⌘S` / `Ctrl+S` guarda, y salir con cambios avisa.
   *
   * No es un invento: es literalmente lo que ya hacen `agent-form`, `group-form` y
   * `user-form`. Las tres pantallas de Config no lo tenían, así que el mismo gesto
   * funcionaba en la mitad de la aplicación y en la otra mitad no — que es peor que no
   * tenerlo en ninguna, porque enseña a no fiarse.
   */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.canSave() && !this.saving()) this.save();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty() && !this.saving()) event.preventDefault();
  }

  protected cancel(): void {
    this.form.set(structuredClone(this.pristine()));
    this.stopAdding();
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
