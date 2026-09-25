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
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';

import { I18n, TrPipe } from '../../core/i18n/i18n';
import { RequestOrigin } from '../../data/seed';
import {
  EMPTY_REQUEST_TYPE_FILTER,
  ORIGIN_LABEL,
  ORIGINS,
  originsOf,
  RequestTypeFilter,
  setAllTypes,
  setTypeOrigins,
} from './request-type';

/**
 * Filtro de la columna «Request type» (V3, SCC 2081): una lista de TIPOS y, en cada fila, un
 * grupo AI | Agent (p-selectbutton múltiple) que dice por qué origen filtra ese tipo. La lógica vive en
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
      SelectButtonModule,
    TagModule,
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
      <!-- Una lista de tipos; en cada fila, su grupo AI | Agent. -->
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
    .rtf-search {
      width: 100%;
    }
    .rtf-list__none {
      margin: 0;
      padding: var(--sc-spacing-1) 0;
      font-size: var(--sc-font-size-100);
      color: #6f7784;
      text-align: center;
    }

    /* ── Filas con su grupo AI | Agent a la derecha. La fila encendida se
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
    /* Fila con algún botón encendido: el nombre, más oscuro y en semibold (como en Figma). */
    .rtf-row.is-on .rtf-row__label {
      color: var(--cc-text-strong);
      font-weight: 600;
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
    /* Etiquetas del disparador con el color de su origen. */
    .rtf-tag--ai.p-tag {
      background: var(--cc-origin-ai-bg);
      color: var(--cc-origin-ai-fg);
    }
    .rtf-tag--agent.p-tag {
      background: var(--cc-origin-agent-bg);
      color: var(--cc-origin-agent-fg);
    }

  `,
})
export class RequestTypeFilterComponent {
  readonly state = input.required<RequestTypeFilter>();
  readonly types = input.required<readonly string[]>();
  readonly stateChange = output<RequestTypeFilter>();

  private readonly i18n = inject(I18n);
  /** Opciones del grupo AI | Agent, en el idioma elegido. `computed`: la misma referencia mientras no cambie. */
  protected readonly editOptions = computed(() =>
    ORIGINS.map((o) => ({ label: this.i18n.t(ORIGIN_LABEL[o]), value: o })),
  );
  protected readonly open = signal(false);
  protected readonly query = signal('');

  /** Material Symbols del Kit (Smart-Contact Icons), en línea como el resto de la réplica. */
  protected readonly icons = {
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

  /* ── Filas */
  /**
   * Orígenes de cada fila, en un `computed`: el grupo recibe el MISMO array mientras el
   * estado no cambie. Con un método que devolvía un array nuevo en cada pasada, `ngModel`
   * lo tomaba por un cambio, reescribía el valor y provocaba otra pasada: la página se
   * quedaba colgada al cargar (medido: la página no llegaba a pintarse).
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
