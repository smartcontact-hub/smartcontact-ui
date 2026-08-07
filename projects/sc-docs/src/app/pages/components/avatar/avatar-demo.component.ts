import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import {
  ScAvatarComponent,
  ScAvatarGroupComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const TYPES_SNIPPET = `<sc-avatar label="SC" />
<sc-avatar icon="user" />
<sc-avatar label="SQ" shape="square" />`;

const SIZES_SNIPPET = `<sc-avatar label="N" />
<sc-avatar label="L" size="large" />
<sc-avatar label="XL" size="xlarge" />`;

const BADGE_SNIPPET = `<sc-avatar label="B" [badge]="4" />
<sc-avatar icon="user" [badge]="''" badgeVariant="success" />`;

const GROUP_SNIPPET = `<sc-avatargroup>
  <sc-avatar label="A" />
  <sc-avatar label="B" />
  <sc-avatar label="+3" />
</sc-avatargroup>`;

const ILLUSTRATION_SNIPPET = `<sc-avatar illustrationName="Inés García" illustrationPool="abstract" size="xlarge" />
<sc-avatar illustrationName="Carlos Ruiz" illustrationPool="abstract" size="xlarge" />
<sc-avatar illustrationName="Soporte Ventas" illustrationPool="abstract" size="xlarge" />`;

/** Demo de `sc-avatar` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-avatar-demo',
  imports: [ScAvatarComponent, ScAvatarGroupComponent, StoryHostComponent],
  templateUrl: './avatar-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly typesTpl = viewChild<TemplateRef<StoryContext>>('types');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');
  protected readonly badgeTpl = viewChild<TemplateRef<StoryContext>>('badge');
  protected readonly groupTpl = viewChild<TemplateRef<StoryContext>>('group');
  protected readonly illustrationTpl = viewChild<TemplateRef<StoryContext>>('illustration');

  protected readonly meta: StoryMeta = {
    tag: 'sc-avatar',
    title: 'Avatar',
    description:
      'Avatar 1:1 con la spec del Kit (Label / Icon / Image · tamaños 28/42/56 · círculo o cuadrado). Badge superpuesto opcional y fallback de ilustración por hash del nombre. Wrapper de PrimeNG.',
    argTypes: [
      { name: 'label', control: { kind: 'text' }, description: 'Iniciales (cara Label).' },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (cara Icon).' },
      {
        name: 'size',
        control: { kind: 'select', options: ['normal', 'large', 'xlarge'] },
      },
      { name: 'shape', control: { kind: 'select', options: ['circle', 'square'] } },
      { name: 'badge', control: { kind: 'text' }, description: 'Valor del badge superpuesto.' },
      {
        name: 'badgeVariant',
        control: {
          kind: 'select',
          options: ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'contrast'],
        },
      },
    ],
    defaultArgs: {
      label: 'SC',
      icon: '',
      size: 'normal',
      shape: 'circle',
      badge: '',
      badgeVariant: 'danger',
    },
    props: [
      { name: 'label', type: 'string | null', default: 'null', description: 'Iniciales (cara Label).' },
      { name: 'icon', type: 'string | null', default: 'null', description: 'Icono Material (cara Icon).' },
      { name: 'image', type: 'string | null', default: 'null', description: 'URL de la foto (cara Image).' },
      {
        name: 'size',
        type: 'ScAvatarSize',
        default: "'normal'",
        description: 'normal (28) · large (42) · xlarge (56)',
      },
      { name: 'shape', type: 'ScAvatarShape', default: "'circle'", description: 'circle · square' },
      { name: 'ariaLabel', type: 'string | null', default: 'null' },
      {
        name: 'badge',
        type: 'string | number | null',
        default: 'null',
        description: 'Badge superpuesto. null = sin badge.',
      },
      {
        name: 'badgeVariant',
        type: 'ScSeverity',
        default: "'danger'",
        description: 'Severidad del badge.',
      },
      {
        name: 'illustrationName',
        type: 'string | null',
        default: 'null',
        description: 'Nombre para el fallback de ilustración (§4.2).',
      },
      {
        name: 'illustrationPool',
        type: 'AvatarIllustrationPool',
        default: "'illustrated'",
        description: 'illustrated · abstract',
      },
      {
        name: 'illustrationBase',
        type: 'string',
        default: "'assets/avatars'",
        description: 'Base de los assets de ilustración.',
      },
      { name: 'imageError', type: 'EventEmitter<unknown>', description: 'Output al fallar la imagen.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ty = this.typesTpl();
    const sz = this.sizesTpl();
    const bd = this.badgeTpl();
    const gr = this.groupTpl();
    const il = this.illustrationTpl();
    if (!pg || !ty || !sz || !bd || !gr || !il) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Tipos (Label / Icon)', template: ty, snippet: TYPES_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
      { name: 'Badge', template: bd, snippet: BADGE_SNIPPET },
      { name: 'Grupo', template: gr, snippet: GROUP_SNIPPET },
      { name: 'Fallback de ilustración', template: il, snippet: ILLUSTRATION_SNIPPET },
    ];
  });
}
