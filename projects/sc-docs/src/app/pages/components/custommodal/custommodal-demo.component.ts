import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {
  provideScDynamicDialog,
  SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS,
  ScButtonComponent,
  ScCustomModalBodyDirective,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScDynamicDialogService,
} from '@smartcontact-hub/components';
import { ScArgs, StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const PLAYGROUND_SNIPPET = `// 1. Un componente de contenido que pinta la carcasa.
@Component({
  imports: [ScCustomModalComponent, ScCustomModalBodyDirective, ScCustomModalFooterDirective, ScButtonComponent],
  template: \`
    <sc-custom-modal icon="format_align_left" [title]="title()" [subtitle]="subtitle()" [closeRequested]="close()">
      <div scCustomModalBody>…</div>
      <sc-button scCustomModalFooter label="Cancelar" variant="primary" appearance="text" (clicked)="close()()" />
      <sc-button scCustomModalFooter label="Guardar" (clicked)="save()()" />
    </sc-custom-modal>\`,
})
export class ConversationModal {
  static scDynamicDialogDefaults = SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS;
  readonly title = input('');
  readonly subtitle = input<string | null>(null);
  readonly close = input<() => void>(() => undefined);
  readonly save = input<() => void>(() => undefined);
}

// 2. Se abre por servicio (providers: [provideScDynamicDialog()]).
const ref = this.dynamicDialog.open(ConversationModal, {
  inputValues: { title, subtitle, close: () => ref.close(), save: () => ref.close('saved') },
});`;

const DECLARATIVE_SNIPPET = `<!-- Extensión nuestra: sin servicio, atado al estado de la pantalla con [(visible)]. -->
<sc-button label="Editar categoría" (clicked)="openEditor()" />
<sc-custom-modal
  [(visible)]="editing"
  title="Editar categoría"
  width="36rem"
  [dismissableMask]="true"
  bodyClass="sc-custom-modal__body--flush"
  (closed)="onClosed()"
>
  <div scCustomModalBody>…</div>
  <sc-button scCustomModalFooter label="Cancelar" variant="primary" appearance="text" (clicked)="editing.set(false)" />
  <sc-button scCustomModalFooter label="Guardar" (clicked)="save()" />
</sc-custom-modal>`;

/** El contenido que abre la demo: el patrón de ui.smart-contact.com, un componente que pinta `sc-custom-modal`. */
@Component({
  selector: 'app-custommodal-demo-content',
  imports: [ScCustomModalComponent, ScCustomModalBodyDirective, ScCustomModalFooterDirective, ScButtonComponent],
  template: `
    <sc-custom-modal
      [icon]="icon()"
      [title]="title()"
      [subtitle]="subtitle()"
      [showCloseButton]="showCloseButton()"
      [closeRequested]="close()"
    >
      <div scCustomModalBody>
        <p>Cada vez que el agente cambia de canal, la conversación sigue en el mismo hilo.</p>
      </div>
      <sc-button scCustomModalFooter label="Cancelar" variant="primary" appearance="text" (clicked)="close()()" />
      <sc-button scCustomModalFooter label="Guardar" (clicked)="save()()" />
    </sc-custom-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModalDemoContentComponent {
  static readonly scDynamicDialogDefaults = SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS;
  readonly icon = input<string | null>(null);
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly showCloseButton = input(true);
  readonly close = input<() => void>(() => undefined);
  readonly save = input<() => void>(() => undefined);
}

/** Demo de `sc-custom-modal` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-custommodal-demo',
  imports: [
    ScCustomModalComponent,
    ScCustomModalBodyDirective,
    ScCustomModalFooterDirective,
    ScButtonComponent,
    StoryHostComponent,
  ],
  providers: [provideScDynamicDialog()],
  templateUrl: './custommodal-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModalDemoComponent {
  private readonly dynamicDialog = inject(ScDynamicDialogService);
  readonly result = signal<string>('—');
  readonly editing = signal(false);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly declarativeTpl = viewChild<TemplateRef<StoryContext>>('declarative');

  protected readonly meta: StoryMeta = {
    tag: 'sc-custom-modal',
    title: 'Custom Modal',
    description:
      'La carcasa de modal del DS: cabecera con icono, título, subtítulo y X, y cuerpo y pie proyectados con `scCustomModalBody` y `scCustomModalFooter`. Es el `sc-custom-modal` de ui.smart-contact.com, con su misma API: se pinta desde un componente de contenido con `static scDynamicDialogDefaults = SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS` y se abre con `ScDynamicDialogService.open(...)`. Úsalo para un modal con contenido propio (un formulario, una tabla, un reproductor); para un aviso o una pregunta con una acción, `sc-alert-modal`, que la usa por dentro. Mide 480 de ancho (`--sc-custom-modal-width` lo cambia) y hasta 720 de alto, y el cuerpo hace scroll. `surfaceClass` cambia fondo, borde y color con las variables `--sc-custom-modal-*`. Frente al suyo: un solo diálogo para el lector, nombre y descripción reales, Escape avisa con `closed`, la X cierra aunque no se pase `closeRequested`, el título largo ocupa 2 líneas, y el foco abre en el primer control y no en la X. Sustituye a `sc-dialog`. Pulsa «Abrir» para verlo como diálogo.',
    argTypes: [
      { name: 'title', control: { kind: 'text' } },
      { name: 'subtitle', control: { kind: 'text' } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre del icono; vacío, sin icono.' },
      { name: 'iconSize', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'showCloseButton', control: { kind: 'boolean' } },
      {
        name: 'closeVariant',
        control: { kind: 'select', options: ['secondary', 'info', 'warn', 'danger'] },
        description: 'Tono de la X; `sc-alert-modal` le pasa el de su variante.',
      },
      {
        name: 'role',
        control: { kind: 'select', options: ['dialog', 'alertdialog'] },
        description: 'El rol del diálogo que la envuelve; `alertdialog` para avisos que interrumpen.',
      },
      {
        name: 'surfaceClass',
        control: { kind: 'text' },
        description: 'Clases en la superficie, para cambiar `--sc-custom-modal-*` desde fuera.',
      },
      {
        name: 'bodyClass',
        control: { kind: 'select', options: ['', 'sc-custom-modal__body--flush'] },
        description: '`sc-custom-modal__body--flush` deja el cuerpo a ras.',
      },
      { name: 'footerClass', control: { kind: 'text' }, description: 'Clases en el pie.' },
    ],
    defaultArgs: {
      title: 'Conversación con Ana Martín',
      subtitle: '12 mensajes · Chat',
      icon: 'format_align_left',
      iconSize: 'lg',
      showCloseButton: true,
      closeVariant: 'secondary',
      role: 'dialog',
      surfaceClass: '',
      bodyClass: '',
      footerClass: '',
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const dc = this.declarativeTpl();
    if (!pg || !dc) return [];
    return [
      { name: 'Playground', playground: true, template: pg, snippet: PLAYGROUND_SNIPPET },
      {
        name: 'Declarativo',
        template: dc,
        snippet: DECLARATIVE_SNIPPET,
        description:
          'Extensión nuestra: sin servicio, con `[(visible)]`, para un modal que vive en la plantilla de la pantalla. `width` cambia el ancho y `dismissableMask` cierra con un clic fuera.',
      },
    ];
  });

  open(args: ScArgs): void {
    const ref = this.dynamicDialog.open<CustomModalDemoContentComponent, unknown, Record<string, unknown>, string>(
      CustomModalDemoContentComponent,
      {
        inputValues: {
          icon: args['icon'] || null,
          title: args['title'] || null,
          subtitle: args['subtitle'] || null,
          showCloseButton: args['showCloseButton'],
          close: () => ref.close('closed'),
          save: () => ref.close('saved'),
        },
      },
    );
    ref.onClose.subscribe((value) => this.result.set(value ?? 'escape'));
  }

  openEditor(): void {
    this.result.set('—');
    this.editing.set(true);
  }

  /** `closed` avisa de cualquier cierre; tras «Guardar» el resultado ya dice «saved». */
  onClosed(): void {
    this.result.update((r) => (r === 'saved' ? r : 'closed'));
  }

  save(): void {
    this.editing.set(false);
    this.result.set('saved');
  }
}
