import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

interface StatusOpt {
  readonly label: string;
  readonly ok: boolean;
}

/** Footer: barra rectangular (#2d333a) con estado (funcional) + avatar. */
@Component({
  selector: 'app-agent-footer',
  standalone: true,
  imports: [ScIconComponent],
  template: `
    <footer class="footer">
      @if (open()) {
        <div class="statusmenu" role="menu">
          <div class="statusmenu__head">
            <span class="statusmenu__title">Status</span>
            <button class="statusmenu__x" type="button" (click)="open.set(false)" aria-label="Close">
              <sc-icon name="close" [size]="16" />
            </button>
          </div>
          <ul class="statusmenu__list" role="list">
            @for (o of options; track o.label) {
              <li
                class="statusmenu__opt"
                [class.is-current]="o.label === current().label"
                (click)="select(o)"
              >
                <span class="dot" [class.dot--ok]="o.ok"></span>
                <span class="statusmenu__label">{{ o.label }}</span>
              </li>
            }
          </ul>
        </div>
      }
      <div class="footer__right">
        <button
          class="footer__status"
          type="button"
          [class.footer__status--busy]="!current().ok"
          (click)="open.update((v) => !v)"
        >
          {{ current().label }}
        </button>
        <span class="footer__av" aria-hidden="true"
          >R<span class="footer__badge"><sc-icon name="language" [size]="9" /></span
        ></span>
      </div>
    </footer>
  `,
  styles: `
    /* Barra rectangular full-width con botón + avatar (como <app-shortcut-bar>). */
    .footer {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      height: 38px;
      padding: 0 22px;
      background: #2d333a;
    }
    .footer__right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    /* Botón de estado: 179px, verde (Available) / rojo (ocupado). */
    .footer__status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 179px;
      height: 27px;
      background: var(--ag-green);
      color: var(--ag-status-text);
      font: inherit;
      font-size: 11.7px;
      font-weight: 400;
      padding: 0;
      border: none;
      border-radius: 9.1px;
      cursor: pointer;
    }
    .footer__status--busy {
      background: var(--ag-red);
      color: #fff;
    }
    .footer__av {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 27px;
      height: 27px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      background: var(--ag-red);
    }
    .footer__badge {
      position: absolute;
      right: -3px;
      bottom: -3px;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #2d333a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--ag-muted);
    }

    /* Panel Status (sube desde el botón) */
    .statusmenu {
      position: absolute;
      bottom: calc(100% + 6px);
      right: 60px;
      width: 300px;
      max-height: 420px;
      overflow: auto;
      background: var(--ag-card);
      border-radius: 12px;
      box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.4);
      padding: 6px 0 10px;
    }
    .statusmenu__head {
      position: relative;
      text-align: center;
      padding: 12px 14px 10px;
    }
    .statusmenu__title {
      font-size: 15px;
      font-weight: 600;
      color: var(--ag-text);
    }
    .statusmenu__x {
      position: absolute;
      top: 8px;
      right: 10px;
      border: none;
      background: transparent;
      color: var(--ag-muted);
      cursor: pointer;
      display: inline-flex;
    }
    .statusmenu__list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .statusmenu__opt {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 18px;
      font-size: 14px;
      color: var(--ag-text);
      cursor: pointer;
    }
    .statusmenu__opt:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .statusmenu__opt.is-current .statusmenu__label {
      font-weight: 700;
    }
    .dot {
      flex: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--ag-red);
    }
    .dot--ok {
      background: var(--ag-green);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentFooterComponent {
  protected readonly open = signal(false);
  protected readonly current = signal<StatusOpt>({ label: 'Available', ok: true });
  protected readonly options: readonly StatusOpt[] = [
    { label: 'Available', ok: true },
    { label: 'No available', ok: false },
    { label: 'Baño', ok: false },
    { label: 'Comida', ok: false },
    { label: 'En el baño', ok: false },
    { label: 'Formación', ok: false },
    { label: 'Administrative', ok: false },
  ];

  protected select(o: StatusOpt): void {
    this.current.set(o);
    this.open.set(false);
  }
}
