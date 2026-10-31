import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import {
  provideScDynamicDialog,
  ScAlertModalComponent,
  ScAlertModalSurface,
  ScAlertModalVariant,
  ScButtonComponent,
  ScDynamicDialogService,
} from '@smartcontact-hub/components';
import { ScArgs, StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const VARIANTS: readonly ScAlertModalVariant[] = ['default', 'info', 'warning', 'error'];
const SURFACES: readonly ScAlertModalSurface[] = ['tinted', 'plain'];

/** Los textos de las variantes, los de su página en ui.smart-contact.com traducidos. */
const COPY: Record<ScAlertModalVariant, { title: string; message: string; action: string }> = {
  default: {
    title: 'Cambios sin guardar',
    message: 'Si sales ahora, perderás los cambios que no has guardado.',
    action: 'Seguir editando',
  },
  info: {
    title: 'Reconectando…',
    message: 'Estamos recuperando la voz, espera unos segundos. El agente seguirá solo.',
    action: 'Entendido',
  },
  warning: {
    title: '¿Descartar los cambios?',
    message: 'Has cambiado el nombre y los canales del grupo. Si sales, se pierden.',
    action: 'Descartar',
  },
  error: {
    title: '¿Eliminar el agente «Ana Martín»?',
    message: 'Esta acción no se puede deshacer.',
    action: 'Eliminar',
  },
};

/**
 * Las dos superficies frente a frente: la teñida para un error del sistema (Figma «Gestión de errores», «No se detecta el
 * micrófono») y la blanca para lo que decide el usuario (borrar, descartar). DD-242.
 */
const SURFACE_PAIRS: readonly {
  variant: ScAlertModalVariant;
  surface: ScAlertModalSurface;
  title: string;
  message: string;
  action: string;
  secondary: string | null;
}[] = [
  {
    variant: 'error',
    surface: 'tinted',
    title: 'No se detecta el micrófono',
    message: 'Conecta un micrófono o revisa los permisos del navegador para seguir atendiendo llamadas.',
    action: 'Reintentar',
    secondary: null,
  },
  {
    variant: 'error',
    surface: 'plain',
    title: COPY.error.title,
    message: COPY.error.message,
    action: COPY.error.action,
    secondary: 'Cancelar',
  },
  {
    variant: 'warning',
    surface: 'tinted',
    title: 'Conexión inestable',
    message: 'La llamada puede cortarse. Revisa la red antes de aceptar otra.',
    action: 'Entendido',
    secondary: null,
  },
  {
    variant: 'warning',
    surface: 'plain',
    title: COPY.warning.title,
    message: COPY.warning.message,
    action: COPY.warning.action,
    secondary: 'Seguir editando',
  },
];

const PLAYGROUND_SNIPPET = `// Se abre por servicio, como en ui.smart-contact.com (providers: [provideScDynamicDialog()]).
const ref = this.dynamicDialog.open(ScAlertModalComponent, {
  inputValues: {
    variant: 'error',
    title: '¿Eliminar el agente «Ana Martín»?',
    message: 'Esta acción no se puede deshacer.',
    actionLabel: 'Eliminar',
    secondaryActionLabel: 'Cancelar',
    closeRequested: () => ref.close('closed'),
    actionRequested: () => ref.close('action'),
  },
});
ref.onClose.subscribe((result) => {
  if (result === 'action') { /* eliminar */ }
  // 'closed' con la X o Cancelar; undefined con Escape.
});`;

const VARIANTS_SNIPPET = `<!-- En la página se pintan en línea para compararlas; en una pantalla se abren con
     ScDynamicDialogService.open(ScAlertModalComponent, { inputValues: { variant, … } }). -->
<sc-alert-modal
  variant="error"
  title="¿Eliminar el agente «Ana Martín»?"
  message="Esta acción no se puede deshacer."
  actionLabel="Eliminar"
  secondaryActionLabel="Cancelar"
/>
<!-- default, info y warning, igual con su variante. -->`;

const SURFACES_SNIPPET = `// Extensión nuestra (DD-242). Blanca: lo decide el usuario (borrar, descartar cambios).
this.dynamicDialog.open(ScAlertModalComponent, {
  inputValues: {
    variant: 'error',
    surface: 'plain',
    title: '¿Eliminar el agente «Ana Martín»?',
    message: 'Esta acción no se puede deshacer.',
    actionLabel: 'Eliminar',
    secondaryActionLabel: 'Cancelar',
    // closeRequested y actionRequested, como siempre.
  },
});

// Teñida (la de siempre, sin pasar surface): un error del sistema. Con closeOnEscape: false, Escape no lo cierra.
this.dynamicDialog.open(ScAlertModalComponent, {
  inputValues: {
    variant: 'error',
    title: 'No se detecta el micrófono',
    message: 'Conecta un micrófono o revisa los permisos del navegador para seguir atendiendo llamadas.',
    actionLabel: 'Reintentar',
    closeOnEscape: false,
  },
});`;

const LIMITS_SNIPPET = `// Tercer botón (extensión nuestra): «No guardar» a la izquierda.
const ref = this.dynamicDialog.open(ScAlertModalComponent, {
  inputValues: {
    variant: 'warning',
    title: '¿Guardar los cambios antes de salir?',
    message: 'Si no los guardas, se pierden.',
    actionLabel: 'Guardar',
    secondaryActionLabel: 'Cancelar',
    tertiaryActionLabel: 'No guardar',
    closeRequested: () => ref.close('closed'),
    actionRequested: () => ref.close('action'),
    tertiaryActionRequested: () => ref.close('tertiary'),
  },
});`;

/** Demo de `sc-alert-modal` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-alertmodal-demo',
  imports: [ScAlertModalComponent, ScButtonComponent, StoryHostComponent],
  providers: [provideScDynamicDialog()],
  templateUrl: './alertmodal-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertModalDemoComponent {
  private readonly dynamicDialog = inject(ScDynamicDialogService);
  readonly result = signal<string>('—');
  readonly systemResult = signal<string>('—');
  protected readonly variants = VARIANTS;
  protected readonly surfaces = SURFACE_PAIRS;
  protected readonly copy = COPY;

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variantsTpl');
  protected readonly surfacesTpl = viewChild<TemplateRef<StoryContext>>('surfacesTpl');
  protected readonly limitsTpl = viewChild<TemplateRef<StoryContext>>('limits');

  protected readonly meta: StoryMeta = {
    tag: 'sc-alert-modal',
    title: 'Alert Modal',
    description:
      'Aviso o confirmación en un modal: un `sc-custom-modal` con variante, icono, título, mensaje y hasta tres acciones. Es el `sc-alert-modal` de ui.smart-contact.com, con su misma API, y se abre igual que allí, con `ScDynamicDialogService.open(ScAlertModalComponent, { inputValues })`. La variante dice la intención: `default` confirma algo neutro, `info` informa o enseña progreso, `warning` pide atención (descartar cambios) y `error` destruye o bloquea (borrar, sesión caducada, sin micrófono). Úsalo para una pregunta o un aviso con una acción clara; para contenido propio (un formulario, una tabla, un reproductor), `sc-custom-modal`; para una frase pegada a lo que se pulsó, el globo de `ScConfirmService` con `target`. Mide de 320 a 480 px de ancho y hasta 400 de alto; el título ocupa hasta 2 líneas y el mensaje hasta 4. Frente al suyo: un solo diálogo para el lector, el mensaje es su descripción, Escape avisa con `closed`, y el foco abre en la salida segura con `warning` y `error`. `tertiaryActionLabel`, `surface` y `closeOnEscape` son extensiones nuestras. La superficie dice quién provoca el aviso: teñida (`tinted`, la de siempre) para un error del sistema, como «No se detecta el micrófono»; blanca (`plain`), que calca el confirm centrado de antes (el icono en gris junto al mensaje y sus botones), para lo que decide el usuario, como borrar o descartar cambios (DD-242). Pulsa «Abrir» para verlo como diálogo.',
    argTypes: [
      { name: 'variant', control: { kind: 'select', options: VARIANTS } },
      {
        name: 'surface',
        control: { kind: 'select', options: SURFACES },
        description:
          'Extensión nuestra: `tinted` tiñe la superficie (error del sistema); `plain` es el confirm de antes, blanco (borrar, descartar).',
      },
      { name: 'title', control: { kind: 'text' } },
      { name: 'message', control: { kind: 'text' }, description: 'Admite HTML sencillo, que Angular sanea.' },
      { name: 'actionLabel', control: { kind: 'text' }, description: 'Botón principal; vacío, no se pinta.' },
      { name: 'secondaryActionLabel', control: { kind: 'text' }, description: 'Botón en texto que cierra.' },
      {
        name: 'tertiaryActionLabel',
        control: { kind: 'text' },
        description: 'Extensión nuestra: un tercer botón a la izquierda.',
      },
      {
        name: 'icon',
        control: { kind: 'text' },
        description: 'Cambia el icono de la variante; vacío, el suyo.',
      },
      { name: 'showIcon', control: { kind: 'boolean' } },
      { name: 'showCloseButton', control: { kind: 'boolean' } },
      {
        name: 'closeOnEscape',
        control: { kind: 'boolean' },
        description: 'Extensión nuestra: apagado, Escape no cierra (un error del sistema).',
      },
    ],
    defaultArgs: {
      variant: 'error',
      surface: 'plain',
      title: COPY.error.title,
      message: COPY.error.message,
      actionLabel: COPY.error.action,
      secondaryActionLabel: 'Cancelar',
      tertiaryActionLabel: '',
      icon: '',
      showIcon: true,
      showCloseButton: true,
      closeOnEscape: true,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const vs = this.variantsTpl();
    const sf = this.surfacesTpl();
    const lm = this.limitsTpl();
    if (!pg || !vs || !sf || !lm) return [];
    return [
      { name: 'Playground', playground: true, template: pg, snippet: PLAYGROUND_SNIPPET },
      {
        name: 'Variantes',
        template: vs,
        snippet: VARIANTS_SNIPPET,
        description: 'Las cuatro intenciones, cada una con el tono del Kit («❖ Alert modal»).',
      },
      {
        name: 'Superficies',
        template: sf,
        snippet: SURFACES_SNIPPET,
        description:
          'Teñida, a la izquierda: un error del sistema, que interrumpe sin que nadie lo haya pedido (sin micrófono, conexión inestable); puede no cerrarse con Escape. Blanca, a la derecha: una decisión del usuario (borrar, descartar cambios), como el confirm centrado de antes: el icono en gris junto al mensaje, «Cancelar» relleno al borrar y la salida segura rellena al descartar (DD-242).',
      },
      {
        name: 'Medidas y límites',
        template: lm,
        snippet: LIMITS_SNIPPET,
        description:
          'Un texto largo se queda en 480 de ancho, con el título en 2 líneas y el mensaje en 4; el tercer botón va a la izquierda.',
      },
    ];
  });

  open(args: ScArgs): void {
    const ref = this.dynamicDialog.open<ScAlertModalComponent, unknown, Record<string, unknown>, string>(
      ScAlertModalComponent,
      {
        inputValues: {
          variant: args['variant'],
          title: args['title'] || null,
          message: args['message'] || null,
          actionLabel: args['actionLabel'] || null,
          secondaryActionLabel: args['secondaryActionLabel'] || null,
          tertiaryActionLabel: args['tertiaryActionLabel'] || null,
          icon: args['icon'] || null,
          showIcon: args['showIcon'],
          showCloseButton: args['showCloseButton'],
          surface: args['surface'] ?? 'tinted',
          closeOnEscape: args['closeOnEscape'] ?? true,
          closeRequested: () => ref.close('closed'),
          actionRequested: () => ref.close('action'),
          tertiaryActionRequested: () => ref.close('tertiary'),
        },
      },
    );
    ref.onClose.subscribe((value) => this.result.set(value ?? 'escape'));
  }

  openSystemError(): void {
    const ref = this.dynamicDialog.open<ScAlertModalComponent, unknown, Record<string, unknown>, string>(
      ScAlertModalComponent,
      {
        inputValues: {
          variant: 'error',
          title: SURFACE_PAIRS[0].title,
          message: SURFACE_PAIRS[0].message,
          actionLabel: SURFACE_PAIRS[0].action,
          closeOnEscape: false,
          closeRequested: () => ref.close('closed'),
          actionRequested: () => ref.close('action'),
        },
      },
    );
    ref.onClose.subscribe((value) => this.systemResult.set(value ?? 'escape'));
  }

  openLong(): void {
    this.open({
      variant: 'warning',
      surface: 'plain',
      title: '¿Guardar los cambios del grupo «Atención al cliente de la zona norte y sus colas» antes de salir?',
      message:
        'Has cambiado el nombre, los canales y los agentes asignados. Si sales sin guardar, se pierden los cambios del nombre, de los canales de voz, chat y correo, de los niveles por canal y de los 14 agentes que añadiste a mano, y tendrás que volver a hacerlos desde el principio.',
      actionLabel: 'Guardar',
      secondaryActionLabel: 'Cancelar',
      tertiaryActionLabel: 'No guardar',
      icon: '',
      showIcon: true,
      showCloseButton: true,
    });
  }
}
