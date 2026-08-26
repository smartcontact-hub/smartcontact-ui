# FASE 3 — Censo del original (valores DECLARADOS)

Generado por `node tools/phase3-inventory.ts` desde el bundle sin minificar de
`https://comunicatoraeddev.smart-contact.com/sismac/`. **4306 declaraciones** en las propiedades de tipografía y caja.

> ⚠️ **Es el censo de lo DECLARADO, no de lo COMPUTADO.** El original lleva un
> `* { font-size: 0.8vw }` global que alcanza a los hijos de texto y gana sobre la
> herencia, así que un `font-size` declarado en un contenedor puede no llegar a su
> texto. El censo computado exige medir la app en vivo, y eso está tras el login.
> Ver `STATUS.md`.

> Equivalencias en px calculadas a 1456 de ancho (`1vw = 14.56px`, `1rem = 0.8vw`).

## `font-family` — 30 valores distintos, 221 usos

| valor                                                                                                | a 1456 | usos | un selector de ejemplo                                        |
| ---------------------------------------------------------------------------------------------------- | ------ | ---- | ------------------------------------------------------------- |
| `"Open Sans Semibold"`                                                                               | —      | 87   | `?`                                                           |
| `"Open Sans"`                                                                                        | —      | 54   | `?`                                                           |
| `"Open Sans Bold"`                                                                                   | —      | 13   | `?`                                                           |
| `"Open Sans Italic"`                                                                                 | —      | 11   | `?`                                                           |
| `"Roboto"`                                                                                           | —      | 8    | `?`                                                           |
| `inherit`                                                                                            | —      | 6    | `button,input,optgroup,select,textarea`                       |
| `"Poppins-LightItalic"`                                                                              | —      | 6    | `?`                                                           |
| `"Open Sans Light"`                                                                                  | —      | 3    | `?`                                                           |
| `system-ui`                                                                                          | —      | 3    | `.content-main-cuscare .custom-checkbox:checked:after`        |
| `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | —      | 3    | `.layout main section.error .alert .detail .detail-message`   |
| `Roboto`                                                                                             | —      | 3    | `li`                                                          |
| `var(--bs-font-monospace)`                                                                           | —      | 2    | `code,kbd,pre,samp`                                           |
| `var(--bs-font-sans-serif)`                                                                          | —      | 2    | `.tooltip`                                                    |
| `"Open Sans Semibold Italic"`                                                                        | —      | 2    | `?`                                                           |
| `"Open Sans", "SemiBold"`                                                                            | —      | 2    | `.modal .modal-dialog .modal-content .modal-header p`         |
| `"Open Sans", "Regular"`                                                                             | —      | 2    | `.modal .modal-dialog .modal-content .modal-body p`           |
| `var(--bs-body-font-family)`                                                                         | —      | 1    | `body`                                                        |
| `var(--bs-btn-font-family)`                                                                          | —      | 1    | `.btn`                                                        |
| `var(--sc-font-family-primary)`                                                                      | —      | 1    | `:root`                                                       |
| `"Roboto Medium"`                                                                                    | —      | 1    | `?`                                                           |
| `"Roboto Light"`                                                                                     | —      | 1    | `?`                                                           |
| `"Roboto Thin"`                                                                                      | —      | 1    | `?`                                                           |
| `"Roboto Bold"`                                                                                      | —      | 1    | `?`                                                           |
| `"Roboto Italic"`                                                                                    | —      | 1    | `?`                                                           |
| `"Open Sans Light Italic"`                                                                           | —      | 1    | `?`                                                           |
| `"Open Sans Bold Italic"`                                                                            | —      | 1    | `?`                                                           |
| `"Open Sans Extra Bold"`                                                                             | —      | 1    | `?`                                                           |
| `"Open Sans Extra Bold Italic"`                                                                      | —      | 1    | `?`                                                           |
| `Roboto, "Helvetica Neue", sans-serif`                                                               | —      | 1    | `body`                                                        |
| `"Inter", "Open Sans"`                                                                               | —      | 1    | `.container-lost-conversations-management .management-option` |

## `font-size` — 112 valores distintos, 379 usos

| valor                    | a 1456  | usos | un selector de ejemplo                                                                       |
| ------------------------ | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `0.833vw`                | 12.13px | 43   | `.recents-container .card-container .card-recents .body.current span`                        |
| `0.938vw`                | 13.66px | 33   | `.contenedor .header-internal .internal-title .internal-name`                                |
| `0.729vw`                | 10.61px | 28   | `.ng-tooltip`                                                                                |
| `0.677vw`                | 9.86px  | 22   | `.alerting-shortcut .alerting-container .chat-bot-recognition .extra .info ul li h3,.alerti` |
| `0.625vw`                | 9.10px  | 12   | `.content-main-cuscare .custom-checkbox:checked:after`                                       |
| `.875em`                 | —       | 10   | `.small,small`                                                                               |
| `0.9375vw`               | 13.65px | 10   | `#content a.remember`                                                                        |
| `1.042vw`                | 15.17px | 9    | `.login-container .login-body .error-container .error`                                       |
| `1.0416666667vw`         | 15.17px | 9    | `:host`                                                                                      |
| `0.781vw`                | 11.37px | 9    | `.content .tabs-container .tab .title`                                                       |
| `1.25rem`                | 14.56px | 8    | `.h5,h5`                                                                                     |
| `1rem`                   | 11.65px | 8    | `.h6,h6`                                                                                     |
| `.875rem`                | 10.19px | 7    | `.col-form-label-sm`                                                                         |
| `inherit`                | —       | 6    | `pre code`                                                                                   |
| `13px`                   | 13.00px | 6    | `.filter-p-multiselect-panel.p-multiselect-overlay .p-multiselect-option,.filter-p-multisel` |
| `1.25vw`                 | 18.20px | 6    | `#content label`                                                                             |
| `1.5rem`                 | 17.47px | 5    | `.h4,h4`                                                                                     |
| `0.675vw`                | 9.83px  | 5    | `.content-callback main section .card .detail .detail-summary`                               |
| `1em`                    | —       | 4    | `code,kbd,pre,samp`                                                                          |
| `0.8rem`                 | 9.32px  | 4    | `.content-main-cuscare .badget-red`                                                          |
| `0.8vw`                  | 11.65px | 4    | `*`                                                                                          |
| `0.8333333333vw`         | 12.13px | 4    | `#content .alert`                                                                            |
| `0.6vw`                  | 8.74px  | 4    | `.content-callback main section .card .detail .detail-message`                               |
| `calc(1.375rem + 1.5vw)` | —       | 3    | `.h1,h1`                                                                                     |
| `2.5rem`                 | 29.12px | 3    | `.h1,h1`                                                                                     |
| `calc(1.275rem + .3vw)`  | —       | 3    | `.h4,h4`                                                                                     |
| `12px`                   | 12.00px | 3    | `.combo-select-list__empty`                                                                  |
| `1.1458333333vw`         | 16.68px | 3    | `.messages-layer-background .messages-layer-message-content .radio-buttons li label`         |
| `1.6vh`                  | —       | 3    | `.layout main section.error .alert .detail .detail-summary`                                  |
| `0.7vw`                  | 10.19px | 3    | `.recents-container .card-container .card-recents .body .event-info .tag .answered-call spa` |
| `0.573vw`                | 8.34px  | 3    | `.server span`                                                                               |
| `1.2962962963vh`         | —       | 3    | `.iconListAgend::ng-deep ngx-avatar .avatar-container .avatar-content .avatar-initials`      |
| `0.521vw`                | 7.59px  | 3    | `:host .task .task-principal .task-type .messageNumber`                                      |
| `calc(1.325rem + .9vw)`  | —       | 2    | `.h2,h2`                                                                                     |
| `2rem`                   | 23.30px | 2    | `.h2,h2`                                                                                     |
| `calc(1.3rem + .6vw)`    | —       | 2    | `.h3,h3`                                                                                     |
| `1.75rem`                | 20.38px | 2    | `.h3,h3`                                                                                     |
| `11px`                   | 11.00px | 2    | `.combo-option-btn`                                                                          |
| `18px`                   | 18.00px | 2    | `#form .password-reset .checks li label`                                                     |
| `1.6vw`                  | 23.30px | 2    | `.content-callback main section .card h2`                                                    |
| …                        |         |      | **72 valores más, no listados**                                                              |

## `font-weight` — 18 valores distintos, 93 usos

| valor                            | a 1456 | usos | un selector de ejemplo                                      |
| -------------------------------- | ------ | ---- | ----------------------------------------------------------- |
| `normal`                         | —      | 18   | `?`                                                         |
| `300`                            | —      | 15   | `.lead`                                                     |
| `bold`                           | —      | 12   | `?`                                                         |
| `700`                            | —      | 9    | `dt`                                                        |
| `400`                            | —      | 9    | `.form-control`                                             |
| `600`                            | —      | 8    | `.fw-semibold`                                              |
| `500`                            | —      | 5    | `.h1,.h2,.h3,.h4,.h5,.h6,h1,h2,h3,h4,h5,h6`                 |
| `650`                            | —      | 3    | `.layout main section.error .alert .detail .detail-summary` |
| `inherit`                        | —      | 3    | `.lost-status ::ng-deep .lost-status-button .p-button`      |
| `bolder`                         | —      | 2    | `b,strong`                                                  |
| `800`                            | —      | 2    | `?`                                                         |
| `var(--bs-body-font-weight)`     | —      | 1    | `body`                                                      |
| `var(--bs-btn-font-weight)`      | —      | 1    | `.btn`                                                      |
| `var(--bs-nav-link-font-weight)` | —      | 1    | `.nav-link`                                                 |
| `var(--bs-badge-font-weight)`    | —      | 1    | `.badge`                                                    |
| `lighter`                        | —      | 1    | `.fw-lighter`                                               |
| `100`                            | —      | 1    | `.text-message span`                                        |
| `unset`                          | —      | 1    | `.letter.names`                                             |

## `font-style` — 2 valores distintos, 35 usos

| valor    | a 1456 | usos | un selector de ejemplo |
| -------- | ------ | ---- | ---------------------- |
| `italic` | —      | 23   | `.fst-italic`          |
| `normal` | —      | 12   | `address`              |

## `line-height` — 29 valores distintos, 83 usos

| valor                                   | a 1456  | usos | un selector de ejemplo                                                                       |
| --------------------------------------- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `1`                                     | —       | 12   | `.figure-img`                                                                                |
| `1.2`                                   | —       | 10   | `.h1,.h2,.h3,.h4,.h5,.h6,h1,h2,h3,h4,h5,h6`                                                  |
| `0`                                     | —       | 9    | `sub,sup`                                                                                    |
| `1.5`                                   | —       | 9    | `.col-form-label`                                                                            |
| `inherit`                               | —       | 6    | `address`                                                                                    |
| `1.55`                                  | —       | 5    | `.layout main section.error .alert .detail .detail-message`                                  |
| `1.042vw`                               | 15.17px | 4    | `.ng-tooltip-html ul li`                                                                     |
| `normal`                                | —       | 3    | `.pretty.p-icon .state .icon`                                                                |
| `1.25`                                  | —       | 2    | `.form-floating>.form-control,.form-floating>.form-control-plaintext,.form-floating>.form-s` |
| `2.604vw`                               | 37.91px | 2    | `.tooltip-example [tooltip]`                                                                 |
| `0.833vw`                               | 12.13px | 2    | `.container-call .body-call .current-call .info-container .call-info-container .call-info-s` |
| `0.729vw`                               | 10.61px | 2    | `.container-lost-conversations-management .management-option`                                |
| `var(--bs-body-line-height)`            | —       | 1    | `body`                                                                                       |
| `var(--bs-btn-line-height)`             | —       | 1    | `.btn`                                                                                       |
| `var(--bs-modal-title-line-height)`     | —       | 1    | `.modal-title`                                                                               |
| `var(--bs-offcanvas-title-line-height)` | —       | 1    | `.offcanvas-title`                                                                           |
| `2`                                     | —       | 1    | `.lh-lg`                                                                                     |
| `1.2rem`                                | 13.98px | 1    | `.content-main-cuscare .ticketTag`                                                           |
| `2.0833333333vw`                        | 30.33px | 1    | `#chartjs-tooltip p strong`                                                                  |
| `1.6`                                   | —       | 1    | `.layout main section.error .alert .text`                                                    |
| `1.35`                                  | —       | 1    | `.content-callback main section.agent-type h2`                                               |
| `1.3`                                   | —       | 1    | `.content-callback main section.agent-type .agent-type-options label`                        |
| `0.8333333333vw`                        | 12.13px | 1    | `.container-call .body-call .current-call .info-container .call-info-container .lost-conver` |
| `1.055vw`                               | 15.36px | 1    | `.container-lost-conversations-management .header-lost-conversations-management .title`      |
| `19px`                                  | 19.00px | 1    | `.sendMessage`                                                                               |
| `2vh`                                   | —       | 1    | `.message-info-header-name .text-slice`                                                      |
| `2.5vh`                                 | —       | 1    | `.message-info-preview`                                                                      |
| `1.125vw`                               | 16.38px | 1    | `.widget.widget-conversations .widget-body .info .total`                                     |
| `5.5vw`                                 | 80.08px | 1    | `.widget.widget-profile .widget-body ngx-avatar ::ng-deep .avatar-container .avatar-content` |

## `letter-spacing` — 30 valores distintos, 105 usos

| valor             | a 1456  | usos | un selector de ejemplo                                                                       |
| ----------------- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `0vw`             | 0.00px  | 36   | `.login-container .login-footer`                                                             |
| `0px`             | 0.00px  | 23   | `.messages-layer-background .messages-layer-message-content .messages-layer-message-text`    |
| `normal`          | —       | 4    | `.mat-h1,.mat-headline-5,.mat-typography .mat-h1,.mat-typography .mat-headline-5,.mat-typog` |
| `0.5px`           | 0.50px  | 4    | `.login-container .login-body .error-container .error`                                       |
| `0.208vw`         | 3.03px  | 3    | `.login-container .login-body .login-form #form .inputs-container .input-group .input-code`  |
| `0.1458333333vw`  | 2.12px  | 3    | `#content button`                                                                            |
| `0.0234375vw`     | 0.34px  | 3    | `#content a.remember`                                                                        |
| `2px`             | 2.00px  | 3    | `#content .input-group input`                                                                |
| `0.009375em`      | —       | 2    | `.mdc-list-group__subheader`                                                                 |
| `0.01979vw`       | 0.29px  | 2    | `*`                                                                                          |
| `3px`             | 3.00px  | 2    | `.login-container .login-body .login-form #form .btn-container button`                       |
| `0.33px`          | 0.33px  | 2    | `.recents-container .card-container .card-recents .body .event-info .tag .answered-call spa` |
| `0.0125em`        | —       | 1    | `.mat-h2,.mat-headline-6,.mat-typography .mat-h2,.mat-typography .mat-headline-6,.mat-typog` |
| `0.03125em`       | —       | 1    | `.mat-h4,.mat-body-1,.mat-typography .mat-h4,.mat-typography .mat-body-1,.mat-typography h4` |
| `0.0071428571em`  | —       | 1    | `.mat-body-strong,.mat-subtitle-2,.mat-typography .mat-body-strong,.mat-typography .mat-sub` |
| `0.0178571429em`  | —       | 1    | `.mat-body,.mat-body-2,.mat-typography .mat-body,.mat-typography .mat-body-2,.mat-typograph` |
| `0.0333333333em`  | —       | 1    | `.mat-small,.mat-caption,.mat-typography .mat-small,.mat-typography .mat-caption`            |
| `-0.015625em`     | —       | 1    | `.mat-headline-1,.mat-typography .mat-headline-1`                                            |
| `-0.0083333333em` | —       | 1    | `.mat-headline-2,.mat-typography .mat-headline-2`                                            |
| `0.0073529412em`  | —       | 1    | `.mat-headline-4,.mat-typography .mat-headline-4`                                            |
| `0.10417vw`       | 1.52px  | 1    | `.login-container .login-body .login-form #form .inputs-container .input-group .input-text`  |
| `0.0260416667vw`  | 0.38px  | 1    | `#form .password-recover .input-group input::placeholder`                                    |
| `0.12vw`          | 1.75px  | 1    | `.layout main section.landing .header .tag`                                                  |
| `0.08vw`          | 1.16px  | 1    | `.layout main section.landing .header .title`                                                |
| `-0.02vw`         | -0.29px | 1    | `.layout main section.error .alert .title`                                                   |
| `0`               | —       | 1    | `.content .tabs-container .tab`                                                              |
| `0.2px`           | 0.20px  | 1    | `.previous-history-button`                                                                   |
| `0.1 0.979vw`     | —       | 1    | `td`                                                                                         |
| `0.2 0.813vw`     | —       | 1    | `:host .status .label`                                                                       |
| `0.156vw`         | 2.27px  | 1    | `.alerting-shortcut .alerting-container-email .main .info .subject-content .desc`            |

## `text-transform` — 4 valores distintos, 14 usos

| valor        | a 1456 | usos | un selector de ejemplo |
| ------------ | ------ | ---- | ---------------------- |
| `uppercase`  | —      | 7    | `.initialism`          |
| `none`       | —      | 3    | `button,select`        |
| `capitalize` | —      | 3    | `.text-capitalize`     |
| `lowercase`  | —      | 1    | `.text-lowercase`      |

## `padding` — 164 valores distintos, 426 usos

| valor                                                                 | a 1456  | usos | un selector de ejemplo                                                                       |
| --------------------------------------------------------------------- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `0`                                                                   | —       | 118  | `kbd kbd`                                                                                    |
| `0.36vw 0.36vw 0.36vw 0.36vw`                                         | —       | 12   | `.transferInfoTooltip`                                                                       |
| `0vw 1.559vw 0vw 1.559vw`                                             | —       | 11   | `.contenedor .header-internal`                                                               |
| `0.156vw`                                                             | 2.27px  | 9    | `.content-main-cuscare .ticketTag`                                                           |
| `1rem`                                                                | 11.65px | 8    | `.p-3`                                                                                       |
| `0.26vw`                                                              | 3.79px  | 8    | `:host .task .task-principal .task-type`                                                     |
| `.25rem`                                                              | 2.91px  | 7    | `.img-thumbnail`                                                                             |
| `1.5rem`                                                              | 17.47px | 7    | `.p-4`                                                                                       |
| `.25rem .5rem`                                                        | —       | 6    | `.form-control-sm`                                                                           |
| `.5rem`                                                               | 5.82px  | 6    | `.p-2`                                                                                       |
| `3rem`                                                                | 34.94px | 6    | `.p-5`                                                                                       |
| `0vw 0.21vw`                                                          | —       | 6    | `.list table tbody tr td.duration ul li.waiting span`                                        |
| `0.104vw 0.416vw`                                                     | —       | 6    | `.list table tbody tr td.tags ul li.transfer`                                                |
| `0vw 1.4vw 0vw 1.6vw`                                                 | —       | 5    | `:host .container-list-agents .listContactsContainer .listContacts`                          |
| `.375rem .75rem`                                                      | —       | 4    | `.form-control`                                                                              |
| `.5rem 1rem`                                                          | —       | 4    | `.form-control-lg`                                                                           |
| `1.2vh 1vw`                                                           | —       | 4    | `.layout main section.error .alert .detail`                                                  |
| `0.521vw`                                                             | 7.59px  | 4    | `.container-call .body-call .dialpad .service-group .btn-group .tooltip-group`               |
| `0 2.604vw`                                                           | —       | 3    | `.tooltip-example`                                                                           |
| `0 0 0 1.5625vw`                                                      | —       | 3    | `.alerting-shortcut .alerting-container .chat-bot-recognition .extra .info ul li.entities u` |
| `0.1041666667vw 0.5208333333vw`                                       | —       | 3    | `.alerting-shortcut .alerting-container .chat-bot-recognition .extra .info ul li.entities u` |
| `0.1041666667vw 0.2604166667vw`                                       | —       | 3    | `.dropdown.dropdown-chatBotRecognition .dropdown-menu .extra .info ul li.entities ul li ul ` |
| `1.9791666667vw 0.15625vw`                                            | —       | 3    | `#content .form-recover,#content .form-reset`                                                |
| `1vh 1vw`                                                             | —       | 3    | `.layout main section.error .alert .detail .detail-message`                                  |
| `0.75vw 1.4vw 0vw 1.6vw`                                              | —       | 3    | `:host .container-list-nodes .listContactsContainer .listContacts .userListAgend .body`      |
| `0vw 1.4vw 0vw 2vw`                                                   | —       | 3    | `:host .container-list-nodes .listContactsContainer .listContacts .extra-info-container .li` |
| `3%`                                                                  | —       | 3    | `.contenedorDropDown .menu .texto`                                                           |
| `0 1.042vw`                                                           | —       | 3    | `.historic-tabs`                                                                             |
| `0 0`                                                                 | —       | 3    | `.historic-tabs button`                                                                      |
| `0vw 0.976vw`                                                         | —       | 3    | `.list table thead tr th,.list table thead tr td,.list table tbody tr th,.list table tbody ` |
| `0.2604166667vw 0 0`                                                  | —       | 3    | `.list table thead tr th.chat-bot-recognition,.list table thead tr td.chat-bot-recognition,` |
| `1rem .75rem`                                                         | —       | 2    | `.form-floating>label`                                                                       |
| `var(--bs-dropdown-item-padding-y) var(--bs-dropdown-item-padding-x)` | —       | 2    | `.dropdown-item`                                                                             |
| `var(--bs-card-cap-padding-y) var(--bs-card-cap-padding-x)`           | —       | 2    | `.card-header`                                                                               |
| `var(--bs-offcanvas-padding-y) var(--bs-offcanvas-padding-x)`         | —       | 2    | `.offcanvas-header`                                                                          |
| `0.156vw 0.417vw`                                                     | —       | 2    | `.ng-tooltip`                                                                                |
| `0.1vw 0.26vw`                                                        | —       | 2    | `.ng-tooltip-html ul`                                                                        |
| `0vw 0.78125vw`                                                       | —       | 2    | `#chartjs-tooltip ul li`                                                                     |
| `0.5208333333vw 0.2604166667vw`                                       | —       | 2    | `.dropdown.dropdown-chatBotRecognition .dropdown-menu .extra`                                |
| `0vw 0vw 0.625vw`                                                     | —       | 2    | `.dropdown.dropdown-chatBotRecognition .dropdown-menu .extra .info ul li`                    |
| …                                                                     |         |      | **124 valores más, no listados**                                                             |

## `margin` — 72 valores distintos, 228 usos

| valor                                   | a 1456  | usos | un selector de ejemplo                                                                       |
| --------------------------------------- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `0`                                     | —       | 67   | `body`                                                                                       |
| `0 auto`                                | —       | 13   | `.layout header .wrapper`                                                                    |
| `auto`                                  | —       | 11   | `.m-auto`                                                                                    |
| `0.73vw 0 1.2vw 0`                      | —       | 10   | `.contenedor .header-internal .internal-title`                                               |
| `.25rem`                                | 2.91px  | 6    | `.m-1`                                                                                       |
| `.5rem`                                 | 5.82px  | 6    | `.m-2`                                                                                       |
| `1rem`                                  | 11.65px | 6    | `.m-3`                                                                                       |
| `1.5rem`                                | 17.47px | 6    | `.m-4`                                                                                       |
| `3rem`                                  | 34.94px | 6    | `.m-5`                                                                                       |
| `0vw 1.563vw 0vw 1.51vw`                | —       | 6    | `.boton`                                                                                     |
| `0 0 16px`                              | —       | 4    | `.mat-h1,.mat-headline-5,.mat-typography .mat-h1,.mat-typography .mat-headline-5,.mat-typog` |
| `0 0 12px`                              | —       | 3    | `.mat-h5,.mat-typography .mat-h5,.mat-typography h5`                                         |
| `0 0 64px`                              | —       | 3    | `.mat-headline-2,.mat-typography .mat-headline-2`                                            |
| `0 0.5208333333vw 0 0`                  | —       | 3    | `.alerting-shortcut .alerting-container .chat-bot-recognition .extra .info ul li.entities u` |
| `1.5vh`                                 | —       | 3    | `.layout main section.error .alert .detail`                                                  |
| `1vh 0 0`                               | —       | 3    | `.layout main section.error .alert .detail .detail-message`                                  |
| `0 1.667vw 0 0`                         | —       | 3    | `.historic-tabs button`                                                                      |
| `0.213vh 0vw 0vh`                       | —       | 3    | `.list table tbody cdk-virtual-scroll-viewport`                                              |
| `0 0 1rem`                              | —       | 2    | `blockquote`                                                                                 |
| `-.375rem -.75rem`                      | —       | 2    | `.form-control::-webkit-file-upload-button`                                                  |
| `-.25rem -.5rem`                        | —       | 2    | `.form-control-sm::-webkit-file-upload-button`                                               |
| `-.5rem -1rem`                          | —       | 2    | `.form-control-lg::-webkit-file-upload-button`                                               |
| `2.604vw 1.042vw`                       | —       | 2    | `.tooltip-example [tooltip]`                                                                 |
| `0 0 0.35vw`                            | —       | 2    | `.ng-tooltip-html ul li`                                                                     |
| `0 0 1.2vh`                             | —       | 2    | `.layout main section.error .alert .title`                                                   |
| `0 auto 1vw`                            | —       | 2    | `.content-callback main section .card .icon`                                                 |
| `1.75vw auto 0`                         | —       | 2    | `.content-callback main section .card button`                                                |
| `0 auto 1.5rem auto`                    | —       | 2    | `.content-callback main section .card .spinner`                                              |
| `0.313vw 1.563vw 0.417vw 0.677vw`       | —       | 2    | `.card-header`                                                                               |
| `0vh 0.2vw 0.3vh 0vw`                   | —       | 2    | `.alerting-shortcut .alerting-container .main .info .info-content .waiting-time .waiting-ti` |
| `0 0 56px`                              | —       | 1    | `.mat-headline-1,.mat-typography .mat-headline-1`                                            |
| `1rem 0`                                | —       | 1    | `hr`                                                                                         |
| `var(--bs-dropdown-divider-margin-y) 0` | —       | 1    | `.dropdown-divider`                                                                          |
| `var(--bs-modal-margin)`                | —       | 1    | `.modal-dialog`                                                                              |
| `calc(var(--bs-modal-footer-gap) * .5)` | —       | 1    | `.modal-footer>*`                                                                            |
| `var(--bs-tooltip-margin)`              | —       | 1    | `.tooltip`                                                                                   |
| `-1px`                                  | -1.00px | 1    | `.visually-hidden,.visually-hidden-focusable:not(:focus):not(:focus-within)`                 |
| `-0.1vw 0.326vw 0px 0px`                | —       | 1    | `.statusTooltip #statusTooltipInfo #statusTooltipSVG`                                        |
| `8px 0`                                 | —       | 1    | `.combo-option-divider`                                                                      |
| `0vw 0vw 0.2604166667vw 0vw`            | —       | 1    | `#chartjs-tooltip p`                                                                         |
| …                                       |         |      | **32 valores más, no listados**                                                              |

## `gap` — 29 valores distintos, 87 usos

| valor                         | a 1456  | usos | un selector de ejemplo                                                                       |
| ----------------------------- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `1rem`                        | 11.65px | 14   | `.gap-3`                                                                                     |
| `1.5rem`                      | 17.47px | 8    | `.gap-4`                                                                                     |
| `3rem`                        | 34.94px | 8    | `.gap-5`                                                                                     |
| `0`                           | —       | 6    | `.gap-0`                                                                                     |
| `.25rem`                      | 2.91px  | 6    | `.gap-1`                                                                                     |
| `.5rem`                       | 5.82px  | 6    | `.gap-2`                                                                                     |
| `2rem`                        | 23.30px | 4    | `.customer-info .content-tabs .personal-data-content`                                        |
| `0.6rem`                      | 6.99px  | 4    | `.header-container .first-section-button`                                                    |
| `2px`                         | 2.00px  | 3    | `.combo-option-list`                                                                         |
| `2vw`                         | 29.12px | 3    | `.layout header .wrapper`                                                                    |
| `0.8vw`                       | 11.65px | 3    | `.layout main section.landing .header .title`                                                |
| `0.573vw`                     | 8.34px  | 3    | `.historic-tabs button`                                                                      |
| `6px`                         | 6.00px  | 2    | `.combo-option-btn--check`                                                                   |
| `1vw`                         | 14.56px | 2    | `.layout header .brand`                                                                      |
| `var(--bs-nav-underline-gap)` | —       | 1    | `.nav-underline`                                                                             |
| `.375rem`                     | 4.37px  | 1    | `.icon-link`                                                                                 |
| `2px 8px`                     | —       | 1    | `.combo-option-list--cols-2`                                                                 |
| `10px`                        | 10.00px | 1    | `.filter-p-multiselect-panel.p-multiselect-overlay .p-multiselect-option,.filter-p-multisel` |
| `12px`                        | 12.00px | 1    | `.combo-column-groups`                                                                       |
| `4px`                         | 4.00px  | 1    | `.combo-select-list`                                                                         |
| `3vh`                         | —       | 1    | `.layout main section.landing .wrapper`                                                      |
| `1vh`                         | —       | 1    | `.layout main section.landing .header`                                                       |
| `1.5vw`                       | 21.84px | 1    | `.layout main section.landing .cards-grid`                                                   |
| `4vh`                         | —       | 1    | `.layout main section.error .wrapper`                                                        |
| `0.55rem`                     | 6.41px  | 1    | `.layout main section.error .alert button`                                                   |
| `0.2083333333vw`              | 3.03px  | 1    | `.container-call .body-call .current-call .info-container .call-info-container .lost-conver` |
| `0.208vw`                     | 3.03px  | 1    | `.container-lost-conversations-management .pending-summary`                                  |
| `0.365vw`                     | 5.31px  | 1    | `.container-lost-conversations-management .management-option`                                |
| `0.8rem`                      | 9.32px  | 1    | `.container-fluid .nature-of-demand`                                                         |

## `border-radius` — 107 valores distintos, 436 usos

| valor                         | a 1456  | usos | un selector de ejemplo                                                                       |
| ----------------------------- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| `0.625vw`                     | 9.10px  | 64   | `.content-main-cuscare .btn-rounded`                                                         |
| `0.833vw`                     | 12.13px | 33   | `.content-main-cuscare .modal-rounded`                                                       |
| `50%`                         | —       | 32   | `.form-check-input[type=radio]`                                                              |
| `0`                           | —       | 25   | `button`                                                                                     |
| `0.521vw`                     | 7.59px  | 22   | `.content-main-cuscare .card-rounded`                                                        |
| `0.26vw`                      | 3.79px  | 14   | `.tooltip-example [tooltip]`                                                                 |
| `16px`                        | 16.00px | 13   | `.login-container .login-body .login-form #form .inputs-container .input-group`              |
| `8%`                          | —       | 13   | `.contenedor`                                                                                |
| `var(--bs-border-radius)`     | —       | 12   | `.img-thumbnail`                                                                             |
| `0.156vw`                     | 2.27px  | 10   | `.content-main-cuscare .custom-checkbox`                                                     |
| `0.313vw`                     | 4.56px  | 9    | `#chartjs-tooltip`                                                                           |
| `1.771vw`                     | 25.79px | 9    | `.switch .slider.round`                                                                      |
| `0.208vw`                     | 3.03px  | 8    | `::-webkit-scrollbar-thumb`                                                                  |
| `10px`                        | 10.00px | 8    | `.container-detail-user .aside .user-data button`                                            |
| `1.458vw`                     | 21.23px | 7    | `.comunicator-shortcut.dark`                                                                 |
| `8px`                         | 8.00px  | 6    | `.combo-filter-overlay`                                                                      |
| `0.417vw`                     | 6.07px  | 6    | `.recents-container .card-container .card-recents .extra-info-container .call-time .waiting` |
| `0.36vw`                      | 5.24px  | 6    | `.list table tbody tr td.duration ul li.waiting span`                                        |
| `0.416vw`                     | 6.06px  | 6    | `.list table tbody tr td.tags ul li.transfer`                                                |
| `0.469vw`                     | 6.83px  | 5    | `.content-main-cuscare .btn-rounded-9`                                                       |
| `0.365vw`                     | 5.31px  | 5    | `.msg`                                                                                       |
| `12px`                        | 12.00px | 5    | `.deleteContact .deleteContactModal .accept`                                                 |
| `var(--bs-border-radius-sm)`  | —       | 4    | `.form-control-sm`                                                                           |
| `var(--bs-border-radius-lg)`  | —       | 4    | `.form-control-lg`                                                                           |
| `1rem`                        | 11.65px | 4    | `.form-range::-webkit-slider-thumb`                                                          |
| `0.521vw 0.521vw 0.052vw 0vw` | —       | 4    | `.recents-container .card-container .card-recents .body .extra-info .show-extra-info`        |
| `1.823vw`                     | 26.54px | 4    | `.deleteLayer`                                                                               |
| `100%`                        | —       | 3    | `.pretty.p-switch .state label:before,.pretty.p-switch .state label:after`                   |
| `0.9vh`                       | —       | 3    | `.layout main section.error .alert .detail .detail-message`                                  |
| `0.3vw`                       | 4.37px  | 3    | `.subcontainerIconMessagePrivate`                                                            |
| `4px`                         | 4.00px  | 2    | `.filter-p-multiselect-panel.p-multiselect-overlay .p-checkbox-box,.filter-p-multiselect-pa` |
| `0.2604166667vw`              | 3.79px  | 2    | `.dropdown.dropdown-chatBotRecognition .dropdown-menu .extra .info ul li.entities ul li ul ` |
| `0.5208333333vw`              | 7.58px  | 2    | `.messages-layer-background .messages-layer-message-content .messages-layer-message-buttons` |
| `5px`                         | 5.00px  | 2    | `.login-container .login-body .login-form`                                                   |
| `0.729vw`                     | 10.61px | 2    | `.boton`                                                                                     |
| `1.042vw`                     | 15.17px | 2    | `.container-lost-conversations-management .pending-summary`                                  |
| `1.563vw`                     | 22.76px | 2    | `:host .agent-status`                                                                        |
| `0vw 0vw 1.563vw 1.563vw`     | —       | 2    | `:host .agent-status .statusList .state:last-of-type`                                        |
| `0.2084vw`                    | 3.03px  | 2    | `:host .agent-status .statusList #administrative #administrativeContent.buscador .buscadorI` |
| `0.9375vw`                    | 13.65px | 2    | `:host .agent-status .statusList #administrative #administrativeNodeList #administrativeNod` |
| …                             |         |      | **67 valores más, no listados**                                                              |

## `width` — 268 valores distintos, 1249 usos

| valor                       | a 1456    | usos | un selector de ejemplo                                                                       |
| --------------------------- | --------- | ---- | -------------------------------------------------------------------------------------------- |
| `100%`                      | —         | 329  | `legend`                                                                                     |
| `0.781vw`                   | 11.37px   | 51   | `.login-container .login-body .login-form #form .inputs-container .input-group .input-group` |
| `auto`                      | —         | 44   | `.row-cols-auto>*`                                                                           |
| `50%`                       | —         | 25   | `.row-cols-2>*`                                                                              |
| `6.51vw`                    | 94.79px   | 25   | `.list table thead tr th.number,.list table thead tr td.number,.list table tbody tr th.numb` |
| `1.719vw`                   | 25.03px   | 20   | `:host .container-list-agents .listContactsContainer .listContacts .userListAgend .iconsCon` |
| `100vw`                     | 1456.00px | 16   | `.modal-backdrop`                                                                            |
| `25%`                       | —         | 14   | `.row-cols-4>*`                                                                              |
| `0.521vw`                   | 7.59px    | 14   | `.content-main-cuscare .custom-checkbox:indeterminate:after`                                 |
| `2.604vw`                   | 37.91px   | 14   | `.contenedor .header-internal .internal-toggle .toggleBar .toggleAgents,.contenedor .header` |
| `1.042vw`                   | 15.17px   | 14   | `.recents-container .card-container .card-recents .body .event-type .spy-container svg-icon` |
| `0.833vw`                   | 12.13px   | 13   | `.login-container .login-body .login-form #form .inputs-container .input-group .input-group` |
| `33.33333333%`              | —         | 12   | `.row-cols-3>*`                                                                              |
| `16.66666667%`              | —         | 12   | `.row-cols-6>*`                                                                              |
| `var(--bs-offcanvas-width)` | —         | 12   | `.offcanvas-sm.offcanvas-start`                                                              |
| `10%`                       | —         | 12   | `:host .container-list-agents .listContactsContainer .listContacts .userListAgend .stateAge` |
| `1.575vw`                   | 22.93px   | 12   | `.list table thead tr th.type span,.list table thead tr td.type span,.list table tbody tr t` |
| `0.625vw`                   | 9.10px    | 11   | `:host .container-list-agents .listContactsContainer .listContacts .userListAgend .stateAge` |
| `60%`                       | —         | 10   | `.recents-container .card-container .card-recents .extra-info-container .categorization-con` |
| `1vw`                       | 14.56px   | 10   | `.container-call .header-call .transfer-container .actions-container .btn svg-icon svg`      |
| `75%`                       | —         | 9    | `.col-9`                                                                                     |
| `9.375vw`                   | 136.50px  | 9    | `.tooltip-example [tooltip]`                                                                 |
| `0.729vw`                   | 10.61px   | 9    | `.content-main-cuscare .custom-checkbox`                                                     |
| `6vw`                       | 87.36px   | 9    | `:host .container-list-agents .listContactsContainer .listContacts .userListAgend .iconsCon` |
| `20%`                       | —         | 8    | `.row-cols-5>*`                                                                              |
| `14.115vw`                  | 205.51px  | 8    | `.boton`                                                                                     |
| `1.563vw`                   | 22.76px   | 7    | `.content-main-cuscare .btn-size-30`                                                         |
| `1.302vw`                   | 18.96px   | 7    | `.login-container .login-body .login-form #form .inputs-container .input-group .input-group` |
| `8vw`                       | 116.48px  | 7    | `.iconDirectTransfer:hover .transferTooltip`                                                 |
| `55.469vw`                  | 807.63px  | 7    | `.modal-body .info-tickts-modal`                                                             |
| `8.33333333%`               | —         | 6    | `.col-1`                                                                                     |
| `41.66666667%`              | —         | 6    | `.col-5`                                                                                     |
| `58.33333333%`              | —         | 6    | `.col-7`                                                                                     |
| `66.66666667%`              | —         | 6    | `.col-8`                                                                                     |
| `83.33333333%`              | —         | 6    | `.col-10`                                                                                    |
| `91.66666667%`              | —         | 6    | `.col-11`                                                                                    |
| `15%`                       | —         | 6    | `.carousel-control-next,.carousel-control-prev`                                              |
| `90%`                       | —         | 6    | `#chartjs-tooltip ul`                                                                        |
| `20.834vw`                  | 303.34px  | 6    | `#content .form-recover .input-group,#content .form-reset .input-group`                      |
| `0.365vw`                   | 5.31px    | 6    | `:host .iconCall .iconArrow svg`                                                             |
| …                           |           |      | **228 valores más, no listados**                                                             |

## `height` — 275 valores distintos, 950 usos

| valor                        | a 1456   | usos | un selector de ejemplo                                                                       |
| ---------------------------- | -------- | ---- | -------------------------------------------------------------------------------------------- |
| `100%`                       | —        | 128  | `.form-floating>label`                                                                       |
| `0.781vw`                    | 11.37px  | 42   | `.login-container .login-body .login-form #form .inputs-container .input-group .input-group` |
| `auto`                       | —        | 38   | `::-webkit-inner-spin-button`                                                                |
| `1.823vw`                    | 26.54px  | 29   | `.content-callback header .logo svg-icon svg`                                                |
| `3.125vw`                    | 45.50px  | 24   | `.login-container .login-body .error-container`                                              |
| `1.719vw`                    | 25.03px  | 20   | `:host .container-list-agents .listContactsContainer .listContacts .userListAgend .iconsCon` |
| `0.521vw`                    | 7.59px   | 18   | `.content-main-cuscare .custom-checkbox:indeterminate:after`                                 |
| `1.042vw`                    | 15.17px  | 17   | `.content-main-cuscare .ticketTag`                                                           |
| `0.729vw`                    | 10.61px  | 16   | `.content-main-cuscare .custom-checkbox`                                                     |
| `0.625vw`                    | 9.10px   | 16   | `:host .container-list-agents .listContactsContainer .listContacts .userListAgend .stateAge` |
| `0.677vw`                    | 9.86px   | 15   | `.recents-container .card-container .card-recents .body .extra-info`                         |
| `1.875vw`                    | 27.30px  | 14   | `.content-main-cuscare .input-large`                                                         |
| `2.604vw`                    | 37.91px  | 13   | `.tooltip-example [tooltip]`                                                                 |
| `1.563vw`                    | 22.76px  | 13   | `.content-main-cuscare .btn-size-30`                                                         |
| `var(--bs-offcanvas-height)` | —        | 12   | `.offcanvas-sm.offcanvas-top`                                                                |
| `0.833vw`                    | 12.13px  | 12   | `.contenedor .header-internal .buscador .icon-search svg-icon svg`                           |
| `calc(55.125vh - 4vh)`       | —        | 12   | `.list table tbody cdk-virtual-scroll-viewport`                                              |
| `1.25vw`                     | 18.20px  | 9    | `.content-main-cuscare .rotateTagUpdate`                                                     |
| `1.197vw`                    | 17.43px  | 9    | `.list table tbody tr td.duration ul`                                                        |
| `100vh`                      | —        | 8    | `.modal-backdrop`                                                                            |
| `20vw`                       | 291.20px | 8    | `:host .container-list-agents`                                                               |
| `42vh`                       | —        | 7    | `:host .container-list-agents .loading`                                                      |
| `1vw`                        | 14.56px  | 7    | `.container-call .header-call .transfer-container .actions-container .btn svg-icon svg`      |
| `1.302vw`                    | 18.96px  | 6    | `.login-container .login-body .login-form #form .inputs-container .input-group .input-group` |
| `1.771vw`                    | 25.79px  | 6    | `.login-container .login-body .login-form #form .btn-container button .loading img`          |
| `0.938vw`                    | 13.66px  | 6    | `.container-lost-conversations-management .pending-summary sc-icon`                          |
| `64.034vh`                   | —        | 6    | `.historic-container`                                                                        |
| `59.018vh`                   | —        | 6    | `.historic-container.no-custombrand`                                                         |
| `4vh`                        | —        | 6    | `.historic-tabs`                                                                             |
| `0.787vw`                    | 11.46px  | 6    | `.list table thead tr th.type span svg-icon svg,.list table thead tr td.type span svg-icon ` |
| `calc(54.749vh - 4vh)`       | —        | 6    | `.list.no-custombrand table tbody cdk-virtual-scroll-viewport`                               |
| `calc(73.63vh - 4vh)`        | —        | 6    | `.list table tbody cdk-virtual-scroll-viewport`                                              |
| `calc(68.614vh - 4vh)`       | —        | 6    | `.list.no-custombrand table tbody cdk-virtual-scroll-viewport`                               |
| `58.825vh`                   | —        | 6    | `.historic-container`                                                                        |
| `calc(58.825vh - 4vh)`       | —        | 6    | `.list`                                                                                      |
| `1em`                        | —        | 5    | `.form-check-input`                                                                          |
| `calc(1em + 2px)`            | —        | 5    | `.pretty .state label:before,.pretty .state label:after`                                     |
| `0.26vw`                     | 3.79px   | 5    | `::-webkit-scrollbar`                                                                        |
| `93%`                        | —        | 5    | `.recents-container`                                                                         |
| `3.021vw`                    | 43.99px  | 5    | `.container-call .body-call .dialpad .service-group .containerButtonSelect .container-nodes` |
| …                            |          |      | **235 valores más, no listados**                                                             |

## Cruce con la réplica — `font-size`

La réplica declara **22 tamaños distintos** (69 usos).
Un ✅ significa que ese mismo tamaño existe en el original (comparado a 1456, a dos decimales).

| réplica      | a 1456  | usos | ¿está en el original? |
| ------------ | ------- | ---- | --------------------- |
| `0.803572vw` | 11.70px | 18   | ❌ no aparece         |
| `0.800138vw` | 11.65px | 14   | ✅                    |
| `0.938187vw` | 13.66px | 8    | ✅                    |
| `0.780907vw` | 11.37px | 5    | ✅                    |
| `0.625vw`    | 9.10px  | 3    | ✅                    |
| `2.190935vw` | 31.90px | 2    | ❌ no aparece         |
| `0.677198vw` | 9.86px  | 2    | ✅                    |
| `0.728022vw` | 10.60px | 2    | ❌ no aparece         |
| `0.833105vw` | 12.13px | 2    | ✅                    |
| `1.813187vw` | 26.40px | 1    | ❌ no aparece         |
| `1.043957vw` | 15.20px | 1    | ❌ no aparece         |
| `1.462913vw` | 21.30px | 1    | ❌ no aparece         |
| `0.693682vw` | 10.10px | 1    | ❌ no aparece         |
| `0.703297vw` | 10.24px | 1    | ✅                    |
| `0.730083vw` | 10.63px | 1    | ✅                    |
| `0.686814vw` | 10.00px | 1    | ❌ no aparece         |
| `1.407968vw` | 20.50px | 1    | ❌ no aparece         |
| `1.25vw`     | 18.20px | 1    | ✅                    |
| `1.785715vw` | 26.00px | 1    | ❌ no aparece         |
| `0.521979vw` | 7.60px  | 1    | ❌ no aparece         |
| `0.70055vw`  | 10.20px | 1    | ❌ no aparece         |
| `0.755495vw` | 11.00px | 1    | ✅                    |

**12 tamaños de la réplica no aparecen en el original.** Cada uno es un candidato a delta: o se midió mal, o sale de un cálculo que el original no hace, o es invención. Hay que verificarlos midiendo.
