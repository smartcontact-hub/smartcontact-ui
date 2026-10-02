import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { Listbox, ListboxModule } from 'primeng/listbox';
import { PopoverModule } from 'primeng/popover';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ScTagComponent } from '@smartcontact-hub/components';

import { I18n, TrPipe } from '../../core/i18n/i18n';
import { RequestOrigin } from '../../data/seed';
import {
  DEFAULT_REQUEST_TYPE_FILTER,
  isRequestTypeActive,
  ORIGIN_LABEL,
  ORIGINS,
  RequestTypeFilter,
} from './request-type';

/** Sin tildes y en minúsculas: «informacion» encuentra «Información». */
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Filtro de la columna «Request type» (V3, SCC 2081), como el panel de Figma 1736:13257:
 * arriba el origen de la clasificación (ninguno de inicio, IA, Agente o los dos: dos p-togglebutton
 * separados) y debajo una lista de tipos con casillas, buscador y marcar-todo (p-listbox
 * nativo). La lógica vive en `request-type.ts`.
 *
 * Ley de similitud: cada origen lleva el color de su etiqueta en la tabla (IA gris, Agente
 * azul) en su botón. Es CSS de esta réplica sobre los componentes
 * nativos: el Design System no se toca.
 *
 * Sin encapsulación a propósito: el panel del popover se pinta en `<body>`, fuera del host,
 * así que sus estilos van con prefijo propio (`rtf-`).
 */
@Component({
  selector: 'app-request-type-filter',
  standalone: true,
  imports: [FormsModule, DividerModule, ListboxModule, PopoverModule, ScTagComponent, ToggleButtonModule, TrPipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #trig class="rtf-trigger" [class.is-active]="active()" [class.is-open]="open()">
      <button
        class="rtf-trigger__main"
        type="button"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'Filter by Request type' | tr"
        [attr.aria-description]="filterDescription()"
        (click)="pop.toggle($event, trig)"
      >
        @if (active()) {
          <span class="rtf-trigger__types">{{ typesSummary() }}</span>
        } @else {
          <span class="rtf-trigger__placeholder">—</span>
        }
      </button>
      @if (active()) {
        <button class="rtf-trigger__clear" type="button" [attr.aria-label]="'Clear Request type filter' | tr" (click)="clear()">
          <svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true">
            <path [attr.d]="icons.close" fill="currentColor" />
          </svg>
        </button>
      }
      <svg class="rtf-trigger__chevron" viewBox="0 0 30 30" width="10" height="10" aria-hidden="true">
        <path d="M7.5 11.25L15 18.75L22.5 11.25" fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>

    <p-popover #pop styleClass="rtf-pop" (onShow)="open.set(true)" [ariaLabel]="'Request type' | tr" (onHide)="onClose()">
      <div class="rtf-panel">
        <p class="rtf-label" id="rtf-origin">{{ 'Classified by' | tr }}</p>
        <div class="rtf-origins" role="group" aria-labelledby="rtf-origin">
          @for (o of originOptions(); track o.value; let first = $first) {
            @if (!first) {
              <span class="rtf-origins__and sc-text-caption-regular">{{ 'AND' | tr }}</span>
            }
            <p-togglebutton
              class="rtf-origin"
              [attr.data-origin]="o.value"
              [onLabel]="o.label"
              [offLabel]="o.label"
              [ngModel]="isOn(o.value)"
              (ngModelChange)="toggleOrigin(o.value, $event)"
            >
              <!-- Siempre en el DOM y fuera del flujo: aparece al encender sin mover la etiqueta. -->
              <ng-template #icon let-checked>
                <svg class="rtf-check rtf-origin__check" [class.is-on]="checked" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path [attr.d]="icons.check" />
                </svg>
              </ng-template>
            </p-togglebutton>
          }
        </div>
        <p-divider />
        <p class="rtf-label">{{ 'Request type' | tr }}</p>
        <p-listbox
          class="rtf-list"
          [options]="typeOptions()"
          optionLabel="label"
          optionValue="value"
          filterBy="search"
          [multiple]="true"
          [checkbox]="true"
          [filter]="true"
          [showToggleAll]="true"
          [metaKeySelection]="false"
          [filterPlaceHolder]="'Search type' | tr"
          [ariaFilterLabel]="'Search type' | tr"
          [ariaLabel]="'Request type' | tr"
          [emptyFilterMessage]="'No types match' | tr"
          scrollHeight="14rem"
          [ngModel]="state().types"
          (ngModelChange)="onTypes($event)"
        >
          <ng-template #item let-option>
            <span class="rtf-option">
              <span class="rtf-option__label">{{ option.label }}</span>
              <sc-tag
                class="rtf-option__match"
                [class.is-inactive]="!both() || !state().types.includes(option.value)"
                [attr.aria-hidden]="!both() || !state().types.includes(option.value)"
                value="Match"
                severity="secondary"
              />
            </span>
          </ng-template>
        </p-listbox>
      </div>
    </p-popover>
  `,
  styles: `
    /* ── Disparador: la misma caja que los otros filtros de la fila (24px, borde #d7dbe3,
       radio 4, 11px), y con filtro puesto, el borde del estado seleccionado. */
    .rtf-trigger {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      height: 24px;
      padding: 0 6px 0 4px;
      border: 1px solid #d7dbe3;
      border-radius: 4px;
      background: #ffffff;
      color: #9aa1ac;
    }
    .rtf-trigger.is-active,
    .rtf-trigger.is-open {
      border-color: var(--sc-color-blue-400);
    }
    .rtf-trigger__main {
      display: flex;
      flex: 1;
      min-width: 0;
      align-items: center;
      height: 100%;
      padding: 0 0 0 3px;
      border: 0;
      background: none;
      font-family: var(--cc-font);
      font-size: 11px;
      color: var(--cc-text);
      text-align: left;
      cursor: pointer;
    }
    .rtf-trigger__main:focus-visible,
    .rtf-trigger__clear:focus-visible {
      outline: var(--sc-focus-ring-width) solid var(--sc-border-focus);
      outline-offset: var(--sc-focus-ring-offset);
    }
    @media (prefers-reduced-motion: reduce) {
      .rtf-origin__check, .rtf-trigger__chevron { transition: none; }
    }

    .rtf-trigger__types {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rtf-trigger__clear {
      display: grid;
      place-items: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: none;
      color: #9aa1ac;
      cursor: pointer;
    }
    .rtf-trigger__clear:hover {
      color: var(--cc-text);
    }
    .rtf-trigger__chevron {
      flex: none;
      transition: transform 0.15s ease;
    }
    .rtf-trigger.is-open .rtf-trigger__chevron {
      transform: rotate(180deg);
    }

    /* ── Panel. Abre como los desplegables de su fila (p-select, p-multiselect): sin el pico
       del p-popover y a 1px del campo (medido). */
    .rtf-pop.p-popover {
      margin-top: 1px;
    }
    .rtf-pop.p-popover-flipped {
      margin-top: 0;
      margin-bottom: 1px;
    }
    .rtf-pop.p-popover::before,
    .rtf-pop.p-popover::after {
      display: none;
    }
    .rtf-pop .p-popover-content {
      padding: var(--sc-spacing-0-75);
    }
    /* La raíz de la réplica mide 0.8vw (11.5px a 1440), así que los componentes del DS, que
       van en rem, salen al 72%. El zoom los devuelve a su tamaño de diseño a ese ancho. */
    .rtf-panel {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-5);
      width: 15.5rem;
      zoom: 1.35;
    }
    .rtf-label {
      margin: 0;
      font-size: var(--sc-font-size-100);
      font-weight: 600;
      color: var(--cc-text);
    }
    /* El check de selección conserva su sitio junto al texto del toggle. */
    .rtf-check {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5px;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .rtf-origin__check {
      opacity: 0;
      scale: 0.25;
      filter: blur(4px);
      transition-property: opacity, filter, scale;
      transition-duration: 300ms;
      transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
    }
    .rtf-origin__check.is-on {
      opacity: 1;
      scale: 1;
      filter: blur(0);
    }
    .rtf-panel .p-divider {
      margin: var(--sc-spacing-0-25) 0;
    }

    /* Origen: dos toggle buttons separados, a partes iguales. Encendido, cada uno toma el color
       de su etiqueta en la tabla. */
    .rtf-origins {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-5);
    }
    .rtf-origins__and {
      flex: none;
      color: var(--sc-text-secondary);
    }
    .rtf-origin {
      flex: 1;
    }
    /* Sin la onda (ripple) de la réplica en este filtro, como en el DS. */
    .rtf-origin .p-ink {
      display: none;
    }
    /* El check va pegado a la etiqueta y siempre ocupa su sitio; a la derecha, un hueco
       invisible del mismo ancho. Así la etiqueta queda centrada, encendida o no. */
    .rtf-origin__check {
      flex: none;
    }
    .rtf-origin .p-togglebutton-content::after {
      content: '';
      flex: none;
      width: 12px;
    }
    .rtf-origin[data-origin='ai'].p-togglebutton-checked .p-togglebutton-content {
      background: #d2d9e3;
      color: #1b273d;
    }
    .rtf-origin[data-origin='agent'].p-togglebutton-checked .p-togglebutton-content {
      background: #d5e6ff;
      color: #0a3ba0;
    }

    /* Lista: el listbox nativo sin su marco propio, que ya está el del panel. La clase va en
       el propio p-listbox (su raíz), no en un hijo. */
    .rtf-list.p-listbox {
      border: 0;
      box-shadow: none;
      background: transparent;
    }
    .rtf-list .p-listbox-header {
      gap: var(--sc-spacing-0-5);
      padding: 0 0 var(--sc-spacing-0-25) var(--sc-spacing-0-5);
    }
    .rtf-list .p-listbox-list {
      padding: 0;
    }
    .rtf-list .p-listbox-option {
      font-size: var(--sc-font-size-100);
    }

    .rtf-option {
      display: flex;
      flex: 1;
      min-width: 0;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-0-5);
    }
    .rtf-option__label {
      min-width: 0;
    }
    .rtf-option__match {
      flex: none;
    }
    /* Reservar la etiqueta evita que los tipos cambien de línea al alternar los orígenes. */
    .rtf-option__match.is-inactive {
      visibility: hidden;
    }

  `,
})
export class RequestTypeFilterComponent {
  readonly state = input.required<RequestTypeFilter>();
  readonly types = input.required<readonly string[]>();
  readonly stateChange = output<RequestTypeFilter>();

  private readonly i18n = inject(I18n);
  protected readonly open = signal(false);
  private readonly listbox = viewChild(Listbox);

  /** Material Symbols del Kit (Smart-Contact Icons), en línea como el resto de la réplica. */
  protected readonly icons = {
    /** Check a trazo (viewBox 16): el grosor lo pone el CSS según el texto de al lado. */
    check: 'M3.5 8.5 6.5 11.5 12.5 4.5',
    close:
      'M7 8.08889L3.18889 11.9C3.04629 12.0426 2.86481 12.1139 2.64444 12.1139C2.42407 12.1139 2.24259 12.0426 2.1 11.9C1.9574 11.7574 1.88611 11.5759 1.88611 11.3556C1.88611 11.1352 1.9574 10.9537 2.1 10.8111L5.91111 7L2.1 3.18889C1.9574 3.0463 1.88611 2.86481 1.88611 2.64444C1.88611 2.42407 1.9574 2.24259 2.1 2.1C2.24259 1.95741 2.42407 1.88611 2.64444 1.88611C2.86481 1.88611 3.04629 1.95741 3.18889 2.1L7 5.91111L10.8111 2.1C10.9537 1.95741 11.1352 1.88611 11.3556 1.88611C11.5759 1.88611 11.7574 1.95741 11.9 2.1C12.0426 2.24259 12.1139 2.42407 12.1139 2.64444C12.1139 2.86481 12.0426 3.0463 11.9 3.18889L8.08889 7L11.9 10.8111C12.0426 10.9537 12.1139 11.1352 12.1139 11.3556C12.1139 11.5759 12.0426 11.7574 11.9 11.9C11.7574 12.0426 11.5759 12.1139 11.3556 12.1139C11.1352 12.1139 10.9537 12.0426 10.8111 11.9L7 8.08889Z',
  };

  protected readonly active = computed(() => isRequestTypeActive(this.state()));
  protected readonly both = computed(() => this.state().origins.length === ORIGINS.length);

  /**
   * Opciones en el idioma elegido, en `computed`: los componentes reciben la MISMA referencia
   * mientras no cambie el idioma. Un array nuevo en cada pasada hacía que `ngModel` reescribiera
   * el valor y lanzara otra pasada, y la página se quedaba colgada (medido en la versión anterior).
   */
  protected readonly originOptions = computed(() =>
    ORIGINS.map((o) => ({ label: this.i18n.t(ORIGIN_LABEL[o]), value: o })),
  );

  /** `search` lleva el rótulo tal cual y sin tildes, para que el buscador encuentre las dos formas. */
  protected readonly typeOptions = computed(() =>
    this.types().map((t) => {
      const label = this.i18n.t(t);
      return { label, value: t, search: `${label} ${plain(label)}` };
    }),
  );

  /** Contador compacto: el detalle queda en el panel y en la descripción accesible. */
  protected readonly typesSummary = computed(() => {
    const count = this.state().types.length;
    return `${count} ${this.i18n.t(count === 1 ? 'request-type::type' : 'request-type::types')}`;
  });

  protected readonly filterDescription = computed(() => {
    if (!this.active()) return this.i18n.t('No filter applied');
    const { origins, types } = this.state();
    const originText = origins.length
      ? `${this.i18n.t('Classified by')} ${origins.map((o) => this.i18n.t(ORIGIN_LABEL[o])).join(` ${this.i18n.t('AND')} `)}`
      : this.i18n.t('Any classification origin');
    return `${this.typesSummary()}. ${originText}. ${types.map((t) => this.i18n.t(t)).join(', ')}`;
  });

  /** Un origen sin tipos es preparación del panel, no un filtro persistente. */
  protected onClose(): void {
    this.open.set(false);
    this.listbox()?.resetFilter();
    if (!this.active() && this.state().origins.length) this.clear();
  }

  protected isOn(o: RequestOrigin): boolean {
    return this.state().origins.includes(o);
  }

  /** Enciende o apaga un origen. Ninguno encendido = cualquiera de los dos. */
  protected toggleOrigin(o: RequestOrigin, on: boolean): void {
    const current = this.state().origins;
    // En el orden de ORIGINS, sea cual sea el orden en que se encendieron.
    const origins = ORIGINS.filter((x) => (x === o ? on : current.includes(x)));
    this.stateChange.emit({ ...this.state(), origins });
  }

  protected onTypes(types: string[] | null): void {
    // En el orden del catálogo, no en el de los clics.
    const picked = types ?? [];
    this.stateChange.emit({ ...this.state(), types: this.types().filter((t) => picked.includes(t)) });
  }

  /** La x del disparador: vuelve al inicio (ningún origen, sin tipos), sin abrir el panel. */
  protected clear(): void {
    this.stateChange.emit(DEFAULT_REQUEST_TYPE_FILTER);
  }
}
