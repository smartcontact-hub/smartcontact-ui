import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { I18n, TrPipe } from '../../core/i18n/i18n';
import { RequestOrigin } from '../../data/seed';
import {
  EMPTY_REQUEST_TYPE_FILTER,
  ORIGIN_LABEL,
  ORIGINS,
  originsOf,
  RequestTypeFilter,
  setAllTypes,
  setEditing,
  setTypeOrigins,
  toggleOrigin,
  toggleType,
} from './request-type';

/**
 * Filtro de la columna «Request type» (V3, SCC 2081): primero el ORIGEN (AI / Agent, dos
 * toggle buttons independientes) y después los TIPOS de ese origen. La lógica vive en
 * `request-type.ts`; aquí solo el disparador de la fila de filtros y su panel.
 *
 * Ley de similitud: cada origen lleva el color de su etiqueta en la tabla (AI = tag primary,
 * Agent = tag info) en el toggle, en el selector AI | Agent y en el disparador cerrado. Es
 * CSS de esta réplica sobre los componentes nativos: el Design System no se toca.
 *
 * Sin encapsulación a propósito: el panel del popover se pinta en `<body>`, fuera del host,
 * así que sus estilos van con prefijo propio (`rtf-`).
 */
@Component({
  selector: 'app-request-type-filter',
  standalone: true,
  imports: [
    FormsModule,
    PopoverModule,
    ToggleButtonModule,
    SelectButtonModule,
    TagModule,
    DividerModule,
    CheckboxModule,
    InputTextModule,
    TrPipe,
  ],
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
        (click)="pop.toggle($event, trig)"
      >
        @if (active()) {
          <span class="rtf-trigger__chips">
            @for (o of state().on; track o) {
              <p-tag [class]="'rtf-tag rtf-tag--' + o" [severity]="severity(o)" [value]="chipLabel(o)" />
            }
          </span>
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

    <p-popover #pop styleClass="rtf-pop" (onShow)="open.set(true)" (onHide)="open.set(false)">
      @if (variant() === 'b') {
        <!-- Variante B: una lista; cada fila, su grupo AI | Agent. -->
        <div class="rtf-panel rtf-panel--b">
          <p class="rtf-label">{{ 'Request type' | tr }}</p>
          <input
            pInputText
            class="rtf-search"
            type="text"
            [placeholder]="'Search type' | tr"
            [attr.aria-label]="'Search type' | tr"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
          <ul class="rtf-rows">
            <li class="rtf-row rtf-row--all" [class.is-on]="allOrigins().length > 0">
              <span class="rtf-row__label" id="rtf-all">{{ 'All types' | tr }}</span>
              <p-selectbutton
                class="rtf-pair"
                size="small"
                [multiple]="true"
                [options]="editOptions()"
                optionLabel="label"
                optionValue="value"
                [ngModel]="allOrigins()"
                (ngModelChange)="onAll($event)"
                ariaLabelledBy="rtf-all"
              />
            </li>
            @for (t of visibleTypes(); track t) {
              <li class="rtf-row" [class.is-on]="rowOrigins().get(t)?.length">
                <span class="rtf-row__label" [id]="'rtf-row-' + $index" [title]="t | tr">{{ t | tr }}</span>
                <p-selectbutton
                  class="rtf-pair"
                  size="small"
                  [multiple]="true"
                  [options]="editOptions()"
                  optionLabel="label"
                  optionValue="value"
                  [ngModel]="rowOrigins().get(t)"
                  (ngModelChange)="onRow(t, $event)"
                  [ariaLabelledBy]="'rtf-row-' + $index"
                />
              </li>
            } @empty {
              <li class="rtf-list__none">{{ 'No types match' | tr }}</li>
            }
          </ul>
        </div>
      } @else {
      <div class="rtf-panel">
        <p class="rtf-label">{{ 'Classification source' | tr }}</p>
        <div class="rtf-origins">
          @for (o of origins; track o) {
            <p-togglebutton
              [class]="'rtf-origin rtf-origin--' + o"
              [ngModel]="isOn(o)"
              (ngModelChange)="onToggle(o)"
              [onLabel]="label[o] | tr"
              [offLabel]="label[o] | tr"
              [ariaLabel]="label[o] | tr"
              [fluid]="true"
            >
              <ng-template #icon let-checked>
                <svg class="rtf-origin__icon" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                  <path [attr.d]="checked ? icons.check : o === 'ai' ? icons.robot : icons.person" fill="currentColor" />
                </svg>
              </ng-template>
            </p-togglebutton>
          }
        </div>

        <p-divider />

        <div class="rtf-typeshead">
          <p class="rtf-label">{{ 'Request type' | tr }}</p>
          @if (state().on.length === 2) {
            <p-selectbutton
              [class]="'rtf-edit rtf-edit--' + state().editing"
              size="small"
              [options]="editOptions()"
              optionLabel="label"
              optionValue="value"
              [allowEmpty]="false"
              [ngModel]="state().editing"
              (ngModelChange)="onEdit($event)"
              ariaLabelledBy="rtf-edit-label"
            />
          } @else if (state().editing; as e) {
            <p-tag [class]="'rtf-tag rtf-tag--' + e" [severity]="severity(e)" [value]="label[e] | tr" />
          }
        </div>

        @if (state().editing; as e) {
          <input
            pInputText
            class="rtf-search"
            type="text"
            [placeholder]="'Search type' | tr"
            [attr.aria-label]="'Search type' | tr"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
          <ul class="rtf-list">
            @for (t of visibleTypes(); track t) {
              <li class="rtf-list__item">
                <p-checkbox
                  [binary]="true"
                  [inputId]="'rtf-' + e + '-' + $index"
                  [ngModel]="state().types[e].includes(t)"
                  (ngModelChange)="onType(t)"
                />
                <label [for]="'rtf-' + e + '-' + $index">{{ t | tr }}</label>
              </li>
            } @empty {
              <li class="rtf-list__none">{{ 'No types match' | tr }}</li>
            }
          </ul>
        } @else {
          <p class="rtf-empty">{{ 'Select a source to filter by type' | tr }}</p>
        }
      </div>
      }
    </p-popover>
  `,
  styles: `
    /* ── Disparador: la misma caja que los otros filtros de la fila (24px, borde #d7dbe3,
       radio 4, 11px), y con filtro puesto, el fondo y el borde del estado seleccionado. */
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
    /* Activo o abierto: lo dice el borde (y las etiquetas); sin relleno, que apagaba la
       etiqueta de la IA. */
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
    .rtf-trigger__chips {
      display: flex;
      gap: 3px;
      overflow: hidden;
    }
    /* Las etiquetas, a la talla de los chips de la réplica (10.5px), como en la celda. */
    /* Dentro del campo (24px) va la etiqueta en compacto: mismos colores, 18px de alto. Es lo
       que hace el propio p-multiselect con sus chips. En la tabla va la etiqueta completa. */
    .rtf-trigger__chips .p-tag {
      height: 18px;
      padding: 0 5px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      line-height: 18px;
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
    .rtf-trigger__chevron.is-open,
    .rtf-trigger.is-open .rtf-trigger__chevron {
      transform: rotate(180deg);
    }

    /* ── Panel. El disparador parece un desplegable, así que abre como los desplegables de su
       fila (p-select, p-multiselect): sin el pico del p-popover y a 1px del campo (medido). */
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
      padding: var(--sc-spacing-1);
    }
    /* La raíz de la réplica mide 0.8vw (11.5px a 1440), así que los componentes del DS, que
       van en rem, salen al 72%. El zoom los devuelve a su tamaño de diseño a ese ancho. */
    .rtf-panel {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-75);
      width: 15.5rem;
      zoom: 1.35;
    }
    .rtf-label {
      margin: 0;
      font-size: var(--sc-font-size-100);
      font-weight: 600;
      color: var(--cc-text);
    }
    .rtf-origins {
      display: flex;
      gap: var(--sc-spacing-0-75);
    }
    .rtf-origins p-togglebutton,
    .rtf-origins .p-togglebutton {
      flex: 1;
    }
    .rtf-panel .p-divider {
      margin: var(--sc-spacing-0-25) 0;
    }
    .rtf-typeshead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-0-5);
      min-height: 1.75rem;
    }
    .rtf-search {
      width: 100%;
    }
    .rtf-list {
      display: flex;
      flex-direction: column;
      max-height: 12rem;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    .rtf-list__item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-5);
      padding: var(--sc-spacing-0-5);
      font-size: var(--sc-font-size-100);
      color: var(--cc-text);
    }
    .rtf-list__item label {
      cursor: pointer;
    }
    .rtf-list__none,
    .rtf-empty {
      margin: 0;
      padding: var(--sc-spacing-1) 0;
      font-size: var(--sc-font-size-100);
      color: #6f7784;
      text-align: center;
    }

    /* ── Variante B: filas con su grupo AI | Agent a la derecha. La fila encendida se
       marca con el fondo de lista seleccionada, como un checkbox marcado. */
    .rtf-panel--b {
      width: 21rem;
    }
    .rtf-rows {
      display: flex;
      flex-direction: column;
      max-height: 16rem;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    .rtf-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-0-5);
      padding: var(--sc-spacing-0-25) var(--sc-spacing-0-5);
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-100);
      color: var(--cc-text);
    }
    .rtf-row.is-on .rtf-row__label {
      color: var(--cc-text-strong);
    }
    .rtf-row--all {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--sc-bg-surface, #ffffff);
      margin-bottom: var(--sc-spacing-0-25);
      border-bottom: 1px solid var(--sc-border-default);
      border-radius: 0;
      font-weight: 600;
    }
    .rtf-row__label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rtf-pair {
      flex: none;
    }
    /* Sin carril gris: el botón apagado es texto sobre blanco (con un fondo leve solo al
       pasar el ratón) y el encendido toma el color de su origen. Un solo nivel. */
    .rtf-pair .p-togglebutton,
    .rtf-pair .p-togglebutton.p-togglebutton-checked {
      background: transparent;
      border-color: transparent;
    }
    .rtf-pair .p-togglebutton .p-togglebutton-content {
      background: transparent;
      box-shadow: none;
      color: #6f7784;
      transition-property: background-color, color;
      transition-duration: 0.15s;
    }
    .rtf-pair .p-togglebutton:not(.p-togglebutton-checked):hover .p-togglebutton-content {
      background: var(--sc-bg-hover);
      color: var(--cc-text-strong);
    }
    .rtf-pair .p-togglebutton:nth-child(1).p-togglebutton-checked .p-togglebutton-content {
      background: var(--cc-origin-ai-bg);
      color: var(--cc-origin-ai-fg);
    }
    .rtf-pair .p-togglebutton:nth-child(2).p-togglebutton-checked .p-togglebutton-content {
      background: var(--cc-origin-agent-bg);
      color: var(--cc-origin-agent-fg);
    }
    /* Etiquetas del disparador y de la variante A con el color de su origen. */
    .rtf-tag--ai.p-tag {
      background: var(--cc-origin-ai-bg);
      color: var(--cc-origin-ai-fg);
    }
    .rtf-tag--agent.p-tag {
      background: var(--cc-origin-agent-bg);
      color: var(--cc-origin-agent-fg);
    }

    /* ── Similitud: cada origen con el color de su etiqueta. Encendido = la etiqueta;
       apagado = neutro, con el icono ya en su color. Los colores salen de --cc-origin-*. */
    .rtf-origin--ai .p-togglebutton-icon,
    .rtf-origin--ai .rtf-origin__icon {
      color: var(--cc-origin-ai-fg);
    }
    .rtf-origin--agent .p-togglebutton-icon,
    .rtf-origin--agent .rtf-origin__icon {
      color: var(--cc-origin-agent-fg);
    }
    .rtf-origin--ai .p-togglebutton-checked .p-togglebutton-content,
    .rtf-origin--ai.p-togglebutton-checked .p-togglebutton-content,
    .rtf-edit .p-togglebutton:nth-child(1).p-togglebutton-checked .p-togglebutton-content {
      background: var(--cc-origin-ai-bg);
      color: var(--cc-origin-ai-fg);
    }
    .rtf-origin--agent .p-togglebutton-checked .p-togglebutton-content,
    .rtf-origin--agent.p-togglebutton-checked .p-togglebutton-content,
    .rtf-edit .p-togglebutton:nth-child(2).p-togglebutton-checked .p-togglebutton-content {
      background: var(--cc-origin-agent-bg);
      color: var(--cc-origin-agent-fg);
    }
  `,
})
export class RequestTypeFilterComponent {
  readonly state = input.required<RequestTypeFilter>();
  readonly types = input.required<readonly string[]>();
  readonly stateChange = output<RequestTypeFilter>();
  /** 'a' = origen arriba y lista por origen; 'b' = una lista con AI | Agent por fila. */
  readonly variant = input<'a' | 'b'>('b');

  protected readonly origins = ORIGINS;
  protected readonly label = ORIGIN_LABEL;
  private readonly i18n = inject(I18n);
  /** Opciones del grupo AI | Agent, en el idioma elegido. `computed`: la misma referencia mientras no cambie. */
  protected readonly editOptions = computed(() =>
    ORIGINS.map((o) => ({ label: this.i18n.t(ORIGIN_LABEL[o]), value: o })),
  );
  protected readonly open = signal(false);
  protected readonly query = signal('');

  /** Material Symbols del Kit (Smart-Contact Icons), en línea como el resto de la réplica. */
  protected readonly icons = {
    robot:
      'M1.90909 9.21053C1.37879 9.21053 0.92803 9.02632 0.556818 8.65789C0.185606 8.28947 0 7.84211 0 7.31579C0 6.78947 0.185606 6.34211 0.556818 5.97368C0.92803 5.60526 1.37879 5.42105 1.90909 5.42105V4.15789C1.90909 3.81053 2.03371 3.51316 2.28295 3.26579C2.5322 3.01842 2.83182 2.89474 3.18182 2.89474H5.09091C5.09091 2.36842 5.27651 1.92105 5.64773 1.55263C6.01894 1.18421 6.4697 1 7 1C7.5303 1 7.98106 1.18421 8.35227 1.55263C8.72348 1.92105 8.90909 2.36842 8.90909 2.89474H10.8182C11.1682 2.89474 11.4678 3.01842 11.717 3.26579C11.9663 3.51316 12.0909 3.81053 12.0909 4.15789V5.42105C12.6212 5.42105 13.072 5.60526 13.4432 5.97368C13.8144 6.34211 14 6.78947 14 7.31579C14 7.84211 13.8144 8.28947 13.4432 8.65789C13.072 9.02632 12.6212 9.21053 12.0909 9.21053V11.7368C12.0909 12.0842 11.9663 12.3816 11.717 12.6289C11.4678 12.8763 11.1682 13 10.8182 13H3.18182C2.83182 13 2.5322 12.8763 2.28295 12.6289C2.03371 12.3816 1.90909 12.0842 1.90909 11.7368V9.21053ZM5.76705 7.67105C5.95265 7.48684 6.04545 7.26316 6.04545 7C6.04545 6.73684 5.95265 6.51316 5.76705 6.32895C5.58144 6.14474 5.35606 6.05263 5.09091 6.05263C4.82576 6.05263 4.60038 6.14474 4.41477 6.32895C4.22917 6.51316 4.13636 6.73684 4.13636 7C4.13636 7.26316 4.22917 7.48684 4.41477 7.67105C4.60038 7.85526 4.82576 7.94737 5.09091 7.94737C5.35606 7.94737 5.58144 7.85526 5.76705 7.67105ZM9.58523 7.67105C9.77083 7.48684 9.86364 7.26316 9.86364 7C9.86364 6.73684 9.77083 6.51316 9.58523 6.32895C9.39962 6.14474 9.17424 6.05263 8.90909 6.05263C8.64394 6.05263 8.41856 6.14474 8.23295 6.32895C8.04735 6.51316 7.95455 6.73684 7.95455 7C7.95455 7.26316 8.04735 7.48684 8.23295 7.67105C8.41856 7.85526 8.64394 7.94737 8.90909 7.94737C9.17424 7.94737 9.39962 7.85526 9.58523 7.67105ZM5.09091 10.4737H8.90909C9.08939 10.4737 9.24053 10.4132 9.3625 10.2921C9.48447 10.1711 9.54545 10.0211 9.54545 9.8421C9.54545 9.66316 9.48447 9.51316 9.3625 9.3921C9.24053 9.27105 9.08939 9.21053 8.90909 9.21053H5.09091C4.91061 9.21053 4.75947 9.27105 4.6375 9.3921C4.51553 9.51316 4.45455 9.66316 4.45455 9.8421C4.45455 10.0211 4.51553 10.1711 4.6375 10.2921C4.75947 10.4132 4.91061 10.4737 5.09091 10.4737ZM3.18182 11.7368H10.8182V4.15789H3.18182V11.7368Z',
    person:
      'M4.80278 6.08611C4.19352 5.47685 3.88889 4.74444 3.88889 3.88889C3.88889 3.03333 4.19352 2.30093 4.80278 1.69167C5.41204 1.08241 6.14444 0.777778 7 0.777778C7.85556 0.777778 8.58796 1.08241 9.19722 1.69167C9.80648 2.30093 10.1111 3.03333 10.1111 3.88889C10.1111 4.74444 9.80648 5.47685 9.19722 6.08611C8.58796 6.69537 7.85556 7 7 7C6.14444 7 5.41204 6.69537 4.80278 6.08611ZM0.777778 11.6667V11.0444C0.777778 10.6037 0.891204 10.1986 1.11806 9.82917C1.34491 9.45972 1.6463 9.17778 2.02222 8.98333C2.82593 8.58148 3.64259 8.28009 4.47222 8.07917C5.30185 7.87824 6.14444 7.77778 7 7.77778C7.85556 7.77778 8.69815 7.87824 9.52778 8.07917C10.3574 8.28009 11.1741 8.58148 11.9778 8.98333C12.3537 9.17778 12.6551 9.45972 12.8819 9.82917C13.1088 10.1986 13.2222 10.6037 13.2222 11.0444V11.6667C13.2222 12.0944 13.0699 12.4606 12.7653 12.7653C12.4606 13.0699 12.0944 13.2222 11.6667 13.2222H2.33333C1.90556 13.2222 1.53935 13.0699 1.23472 12.7653C0.930092 12.4606 0.777778 12.0944 0.777778 11.6667ZM2.33333 11.6667H11.6667V11.0444C11.6667 10.9019 11.631 10.7722 11.5597 10.6556C11.4884 10.5389 11.3944 10.4481 11.2778 10.3833C10.5778 10.0333 9.8713 9.77083 9.15833 9.59583C8.44537 9.42083 7.72593 9.33333 7 9.33333C6.27407 9.33333 5.55463 9.42083 4.84167 9.59583C4.1287 9.77083 3.42222 10.0333 2.72222 10.3833C2.60556 10.4481 2.51157 10.5389 2.44028 10.6556C2.36898 10.7722 2.33333 10.9019 2.33333 11.0444V11.6667ZM8.09861 4.9875C8.40324 4.68287 8.55556 4.31667 8.55556 3.88889C8.55556 3.46111 8.40324 3.09491 8.09861 2.79028C7.79398 2.48565 7.42778 2.33333 7 2.33333C6.57222 2.33333 6.20602 2.48565 5.90139 2.79028C5.59676 3.09491 5.44444 3.46111 5.44444 3.88889C5.44444 4.31667 5.59676 4.68287 5.90139 4.9875C6.20602 5.29213 6.57222 5.44444 7 5.44444C7.42778 5.44444 7.79398 5.29213 8.09861 4.9875Z',
    check:
      'M5.09444 9.45L11.6861 2.85833C11.8417 2.70278 12.0231 2.625 12.2306 2.625C12.438 2.625 12.6194 2.70278 12.775 2.85833C12.9306 3.01389 13.0083 3.19861 13.0083 3.4125C13.0083 3.62639 12.9306 3.81111 12.775 3.96667L5.63889 11.1222C5.48333 11.2778 5.30185 11.3556 5.09444 11.3556C4.88704 11.3556 4.70556 11.2778 4.55 11.1222L1.20556 7.77778C1.05 7.62222 0.975463 7.4375 0.981945 7.22361C0.988426 7.00972 1.06944 6.825 1.225 6.66944C1.38056 6.51389 1.56528 6.43611 1.77917 6.43611C1.99306 6.43611 2.17778 6.51389 2.33333 6.66944L5.09444 9.45Z',
    close:
      'M7 8.08889L3.18889 11.9C3.04629 12.0426 2.86481 12.1139 2.64444 12.1139C2.42407 12.1139 2.24259 12.0426 2.1 11.9C1.9574 11.7574 1.88611 11.5759 1.88611 11.3556C1.88611 11.1352 1.9574 10.9537 2.1 10.8111L5.91111 7L2.1 3.18889C1.9574 3.0463 1.88611 2.86481 1.88611 2.64444C1.88611 2.42407 1.9574 2.24259 2.1 2.1C2.24259 1.95741 2.42407 1.88611 2.64444 1.88611C2.86481 1.88611 3.04629 1.95741 3.18889 2.1L7 5.91111L10.8111 2.1C10.9537 1.95741 11.1352 1.88611 11.3556 1.88611C11.5759 1.88611 11.7574 1.95741 11.9 2.1C12.0426 2.24259 12.1139 2.42407 12.1139 2.64444C12.1139 2.86481 12.0426 3.0463 11.9 3.18889L8.08889 7L11.9 10.8111C12.0426 10.9537 12.1139 11.1352 12.1139 11.3556C12.1139 11.5759 12.0426 11.7574 11.9 11.9C11.7574 12.0426 11.5759 12.1139 11.3556 12.1139C11.1352 12.1139 10.9537 12.0426 10.8111 11.9L7 8.08889Z',
  };

  protected readonly active = computed(() => this.state().on.length > 0);

  protected readonly visibleTypes = computed(() => {
    const q = this.query().trim().toLowerCase();
    // Busca en lo que se VE (en castellano, «baja» encuentra Unsubscription) y sin tildes:
    // «informacion» encuentra «Información».
    const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const needle = plain(q);
    return q ? this.types().filter((t) => plain(this.i18n.t(t)).includes(needle)) : this.types();
  });

  /** AI = etiqueta primary (sin severidad); Agent = info. Las mismas que la celda. */
  protected severity(o: RequestOrigin): 'info' | undefined {
    return o === 'agent' ? 'info' : undefined;
  }

  protected chipLabel(o: RequestOrigin): string {
    const n = this.state().types[o].length;
    const label = this.i18n.t(ORIGIN_LABEL[o]);
    return n ? `${label} (${n})` : label;
  }

  protected isOn(o: RequestOrigin): boolean {
    return this.state().on.includes(o);
  }

  protected onToggle(o: RequestOrigin): void {
    this.query.set('');
    this.stateChange.emit(toggleOrigin(this.state(), o));
  }

  protected onEdit(o: RequestOrigin): void {
    this.query.set('');
    this.stateChange.emit(setEditing(this.state(), o));
  }

  protected onType(t: string): void {
    this.stateChange.emit(toggleType(this.state(), t));
  }

  /* ── Variante B */
  /**
   * Orígenes de cada fila, en un `computed`: el grupo recibe el MISMO array mientras el
   * estado no cambie. Con un método que devolvía un array nuevo en cada pasada, `ngModel`
   * lo tomaba por un cambio, reescribía el valor y provocaba otra pasada: la página se
   * quedaba colgada al cargar (medido: la variante A cargaba en 4 s, la B nunca).
   */
  protected readonly rowOrigins = computed(() => {
    const f = this.state();
    return new Map(this.types().map((t) => [t, originsOf(f, t)] as const));
  });

  /** «All types» se enciende por columna cuando TODAS las filas lo están. */
  protected readonly allOrigins = computed(() =>
    ORIGINS.filter((o) => this.types().every((t) => this.state().types[o].includes(t))),
  );

  protected onRow(t: string, origins: RequestOrigin[] | null): void {
    this.stateChange.emit(setTypeOrigins(this.state(), t, origins ?? []));
  }

  protected onAll(origins: RequestOrigin[] | null): void {
    this.stateChange.emit(setAllTypes(this.state(), this.types(), origins ?? []));
  }

  /** La x del disparador: apaga los dos orígenes y vacía sus listas, sin abrir el panel. */
  protected clear(): void {
    this.query.set('');
    this.stateChange.emit(EMPTY_REQUEST_TYPE_FILTER);
  }
}
