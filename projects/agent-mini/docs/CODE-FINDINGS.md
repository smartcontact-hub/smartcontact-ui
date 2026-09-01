# Agent Mini — hallazgos del código real (reverse engineering)

Todo sacado de los bundles PÚBLICOS servidos en `comunicatormini.smart-contact.com/aed/`
(no hizo falta login ni tocar la app en vivo). Fuente principal:
`chunk-TBWJI6AL.js` (módulo comunicator/calls) + `main-4QJZUBGH.js`.

## Stack
- **Angular** (esbuild, bundles hasheados, lazy chunks) + **Bootstrap 5** (`assets/js/vendor/bootstrap`).
- `<svg-icon>` = librería **angular-svg-icon** (inyecta el SVG, permite `path{fill}`).
- i18n por ficheros: `assets/i18n/core/es.json` (y `en`). El copy exacto vive ahí.

## Breakpoints (respuesta a "¿hay breakpoint al cambiar el ancho?")
- Los únicos `@media` son los **defaults de Bootstrap 5**: 576 / 768 / 992 / 1200 / 1400 px.
- **El dialpad NO tiene breakpoints propios.** Escala de forma continua con `vw`/`vh`.
  Lo que se ve "redimensionar" al mover el ancho es ese escalado fluido, no saltos.
- En la copia usamos `cqw`/`cqh` (container units) con los MISMOS números → escala
  igual pero contra el marco, no contra la ventana. Estable a cualquier tamaño.

## Inventario de componentes (todo el árbol app-*)
Shell: `app-comunicator` › `app-agentweb`/`app-private` › `app-shortcut-bar`.
- **Llamadas**: `app-calls` › `app-calls-dialpad` › `app-keypad`; `app-calls-transfer`
  (`-agents`/`-agenda`/`-nodes`), `app-typification`, `app-webrtc`, `app-colgar`,
  `app-alerting`, `app-select-next-status`.
- **Chats**: `app-chats` › `app-chats-list`, `app-chats-conversation`, `app-chats-contacts`,
  `app-typification-chat`, `app-transfer-chat`, `app-queue-conversation`.
- **Agentes/Agenda**: `app-agents` (`app-agents-contacts`, `app-nodes-contacts`),
  `app-agenda` (`app-agenda-contacts`, `app-agenda-contact-info`, `app-agenda-create-edit-contact`).
- **Histórico**: `app-historic`.  **Ajustes**: `app-settings` (`-profile`, `-preferences`).
- **Estado/widgets**: `app-agent-status`, `app-agent-info`, `app-status-filters`,
  `app-widget-*` (profile/nodes/connected/status/conversations/standard), `app-switch`.

## Nav inferior (footer-comunicator) — 5 pestañas
`*ngFor` sobre `actions`; cada item `.icon-footer > .icon.{{tab}}` con clase `actived`
en la pestaña activa. Orden: **call · chat · agents · contacts · history**.
Iconos (background-image, base / hover / actived):
- call → `telefono.svg` / `-hover` / `-actived` (+ `telefono-inprogress-other-tab.svg`)
- chat → `chat.svg` / `-hover` / `-actived` (+ `chat-inprogress.svg`)
- agents → `agentes.svg` / `-hover` / `-actived`
- contacts → `agenda.svg` / `-hover` / `-actived`
- history → `historial.svg` / `-hover` / `-actived` (+ badge `.lost-call` rojo)
Badges: `.unread-messages` (chat), `.lost-call` (history), `.call-inprogress` (call).

## Keypad (`app-keypad`) — plantilla real
- `.keys-container > *ngFor .keys#key_{{key}} > .number {{key}}`. **Solo dígitos, SIN letras.**
- `.display`: `.flags-container` (selector de banderas, `*ngIf="false"` → oculto),
  `.input-number > input#inputTelefono` (Roboto, `pattern="^[0-9]*$"`, `numbersOnly`, **sin placeholder**),
  `.deleted (click)="delete()"` con `borrar.svg`. Línea inferior sutil en el display.
- Estado `call-inprogress`: el keypad encoge, aparece `.keypad-back` con `atras.svg`.

## Botón llamar (`.footer-call`)
- `button.btn-call [ngClass]="{'makecall': agentCanMakeCall()}"` `(click)="makeCall()"`
  `[disabled]="!agentCanMakeCall()"`, icono `telefono_pequeño_blanco.svg`.
  - disabled → transparente, borde `#85898D`, icono al 40%.
  - `.makecall` → verde `#69C663` (hover `#2BAE22`).
- Colgar: `button.btn-call.hangup` con `colgar-grande-blanco.svg`, rojo `#F75454`.

## Pastilla de servicio (`.service-group`)
- Bootstrap `dropup`: `button.buttonGroup` con `{{serviceGroupSelected.nombre | u2sp | sCSlice:12}}`
  (por eso "Soporte Tal…", cortado a 12) + `flecha_1.svg`. `[disabled]` si hay <2 grupos.

## Fuentes
- **Roboto**: input del número, listas (`li`). — **Open Sans Semibold**: badges (lost-call).
- Marca del logo login: PNG base64 inline (411×81) en `--logo` (solo vista login).

## Sonidos (para fase funcional real)
`assets/sounds/`: `ringing.mp3`, `notification.mp3`, `chat.mp3`, `queuedConversations.mp3`.

## Pendiente de mapear
- **Header** (widget de estado del agente: avatar, "Disponible", ajustes). Placeholder por ahora.
- Copy exacto de labels: está en `assets/i18n/core/es.json` (descargado en `../src/es.json`).
- Vistas chat/agenda/histórico/settings (inventario arriba; layouts sin extraer aún).
