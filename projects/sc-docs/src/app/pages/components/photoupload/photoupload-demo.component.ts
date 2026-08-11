import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScPhotoUploadComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const SIZES_SNIPPET = `<sc-photo-upload
  name="Inés García"
  illustrationPool="abstract"
  [photo]="photo()"
  (photoChange)="onPhotoChange($event)"
/>
<sc-photo-upload name="Soporte" illustrationPool="abstract" size="sm" />`;

/** Demo de `sc-photo-upload` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-photoupload-demo',
  imports: [ScPhotoUploadComponent, StoryHostComponent],
  templateUrl: './photoupload-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoUploadDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');

  readonly photo = signal<string | null>(null);
  readonly pgPhoto = signal<string | null>(null);

  onPhotoChange(p: string | null): void {
    this.photo.set(p);
  }

  onPgPhotoChange(p: string | null): void {
    this.pgPhoto.set(p);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-photo-upload',
    title: 'PhotoUpload',
    description:
      'Selector de foto de entidad (bespoke: input file nativo + FileReader). Sin foto cae al fallback de ilustración (§4.2) por hash del nombre. Hover muestra el overlay de cámara; valida tipo y tamaño (≤ 800 KB).',
    argTypes: [
      { name: 'name', control: { kind: 'text' }, description: 'Semilla del hash de ilustración.' },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md'] } },
      {
        name: 'illustrationPool',
        control: { kind: 'select', options: ['illustrated', 'abstract'] },
      },
      { name: 'ariaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      name: 'Inés García',
      size: 'md',
      illustrationPool: 'abstract',
      ariaLabel: '',
    },
    props: [
      { name: 'photo', type: 'string | null', default: 'null', description: 'Data URL / src actual.' },
      { name: 'name', type: 'string | null', default: 'null', description: 'Semilla del fallback.' },
      { name: 'size', type: "'md' | 'sm'", default: "'md'", description: 'md (64) · sm (44)' },
      {
        name: 'illustrationPool',
        type: 'AvatarIllustrationPool',
        default: "'illustrated'",
        description: 'illustrated · abstract',
      },
      { name: 'illustrationBase', type: 'string', default: "'assets/avatars'" },
      { name: 'ariaLabel', type: 'string | null', default: 'null' },
      { name: 'photoChange', type: 'EventEmitter<string | null>', description: 'Foto elegida o quitada.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const sz = this.sizesTpl();
    if (!pg || !sz) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Tamaños (md 64 · sm 44)', template: sz, snippet: SIZES_SNIPPET },
    ];
  });
}
