import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import {
  ScAvatarComponent,
  ScButtonComponent,
  ScIconTileComponent,
  ScMessageComponent,
  ScProgressBarComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { COMPONENT_CATALOG } from '../components/component-catalog';

/**
 * Portada de sc-docs (`/`). Toma la composición de la portada de Primer —título centrado sobre gris, tarjetas blancas
 * grandes con una ilustración y un titular a dos tonos, y dos filas de tarjetas pequeñas— y la llena con lo nuestro.
 *
 * Las ilustraciones son propias: formas con degradado sacadas del logo de Smart Contact, trazos de línea con nodos y,
 * flotando encima, componentes `sc-*` DE VERDAD (botones, mensaje, etiquetas, interruptor). Van `inert` y ocultas al
 * lector: son decorado, no se tabulan ni se anuncian. Los colores salen de los tokens, así que el oscuro sale solo.
 */
@Component({
  selector: 'app-inicio',
  imports: [
    RouterLink,
    TranslatePipe,
    ScAvatarComponent,
    ScButtonComponent,
    ScIconComponent,
    ScIconTileComponent,
    ScMessageComponent,
    ScProgressBarComponent,
    ScTagComponent,
    ScToggleSwitchComponent,
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent {
  protected readonly total = COMPONENT_CATALOG.length;

  /** La barra de iconos de la ilustración de Componentes: botones de solo icono, con un separador en medio. */
  protected readonly barra = ['search', 'edit', 'archive', null, 'favorite', 'bookmark', 'alternate_email'] as const;

  /**
   * La ficha del agente de la ilustración está viva: su llamada corre (04:12, 04:13…) y la barra de ocupación se llena al
   * entrar, con la transición del propio `sc-progressbar`. Decorado (`inert`), pero el decorado quieto no dice «producto».
   */
  private readonly segundos = signal(4 * 60 + 12);
  protected readonly reloj = computed(() => {
    const s = this.segundos();
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });
  protected readonly ocupacion = signal(0);

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const llenar = setTimeout(() => this.ocupacion.set(68), 700);
      const tic = setInterval(() => this.segundos.update((s) => s + 1), 1000);
      destroy.onDestroy(() => {
        clearTimeout(llenar);
        clearInterval(tic);
      });
    });
  }

  /** Las tarjetas pequeñas de «Base compartida». */
  protected readonly base = [
    { clave: 'patrones', icono: 'dashboard', ruta: '/fundamentos/patrones' },
    { clave: 'iconos', icono: 'interests', ruta: '/fundamentos/iconos' },
    { clave: 'tipografia', icono: 'text_fields', ruta: '/fundamentos/tipografia' },
  ] as const;
}
