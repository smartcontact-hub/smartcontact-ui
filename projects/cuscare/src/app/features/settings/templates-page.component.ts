import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TEMPLATE_FOLDERS } from '../../data/seed';

/**
 * Ajustes · Templates (`#/private/cuscare/settings/templates`).
 *
 * NO es una tabla (las otras tres de ajustes sí): es una lista de CARPETAS, cada
 * una con icono, nombre, chips de grupo y tres acciones a la derecha
 * (editar / duplicar / borrar). La cabecera lleva buscador centrado y dos
 * botones oscuros: "Add category" y "Add template".
 */
@Component({
  selector: 'app-templates-page',
  standalone: true,
  template: `
    <div class="tpl">
      <header class="tpl__head">
        <h1 class="cc-page-title">Templates</h1>
        <div class="tpl__search">
          <span class="tpl__searchbox">Search</span>
          <button class="tpl__searchbtn" type="button" aria-label="Buscar">⌕</button>
        </div>
        <div class="tpl__actions">
          <button class="btn btn--dark" type="button"><span aria-hidden="true">🗀</span> Add category</button>
          <button class="btn btn--dark" type="button"><span aria-hidden="true">🗋</span> Add template</button>
        </div>
      </header>

      <ul class="tpl__list" role="list">
        @for (f of folders; track f.name) {
          <li class="folder">
            <span class="folder__icon" aria-hidden="true">🗀</span>
            <span class="folder__name">{{ f.name }}</span>
            @for (t of f.tags; track t) {
              <span class="chip">{{ t }}</span>
            }
            @if (f.moreTags) {
              <span class="chip chip--more">+{{ f.moreTags }}</span>
            }
            <span class="folder__actions">
              <button class="folder__act" type="button" aria-label="Editar">✎</button>
              <button class="folder__act" type="button" aria-label="Duplicar">⧉</button>
              <button class="folder__act" type="button" aria-label="Borrar">🗑</button>
            </span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .tpl__head {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 4px 8px 18px;
    }
    .tpl__search {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 auto;
    }
    .tpl__searchbox {
      display: inline-flex;
      align-items: center;
      width: 300px;
      height: 28px;
      padding: 0 12px;
      border: 1px solid #d7dbe3;
      border-radius: 6px;
      background: #ffffff;
      font-size: 11.68px;
      color: #9aa1ac;
    }
    .tpl__searchbtn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid #d7dbe3;
      border-radius: 6px;
      background: #ffffff;
      color: var(--cc-text);
      cursor: pointer;
    }
    .tpl__actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 30px;
      padding: 0 14px;
      border: 0;
      border-radius: 6px;
      font-family: var(--cc-font-head);
      font-size: 11.68px;
      cursor: pointer;
    }
    .btn--dark {
      background: #2f333c;
      color: #ffffff;
    }
    .tpl__list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    /* Cada carpeta es su propia tarjeta blanca sobre el lienzo. */
    .folder {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 40px;
      padding: 0 16px;
      background: var(--cc-card);
      border-radius: var(--cc-radius-card);
      font-size: 11.68px;
      color: var(--cc-text-body);
    }
    .folder__name {
      color: var(--cc-text-body);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      height: 19px;
      padding: 0 8px;
      border-radius: 10px;
      background: #eef1f6;
      color: #6b7280;
      font-size: 10.5px;
    }
    .chip--more {
      background: #dfe4ec;
    }
    .folder__actions {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
      color: #9aa1ac;
    }
    .folder__act {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 12px;
      cursor: pointer;
      padding: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesPageComponent {
  protected readonly folders = TEMPLATE_FOLDERS;
}
