import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';
import {
  ScButtonComponent,
  ScDividerComponent,
  ScDrawerComponent,
} from '@smartcontact-hub/components';

import { FICHA_VARIANTS, FichaVariantService, type FichaVariant } from './ficha-variant.service';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`). La guía «Cómo comparar», en un panel a la derecha.
 *
 * Quien abre el enlace no estuvo en la conversación: no sabe qué son A, B y C ni qué tiene que
 * mirar. Por eso la guía no describe, DIRIGE: qué es la forma que tiene delante, tres pasos
 * concretos sobre la ficha que tiene abierta (los de un agente no sirven en un grupo) y en qué
 * fijarse. Abajo, las otras dos formas con un botón para saltar, y la pregunta que hay que
 * contestar al final.
 *
 * No es modal y se pone encima de la ficha sin moverla (Rafa, 2026-09-15: «no quiero que arrastre
 * el resto»); los pasos señalan tarjetas de las dos primeras columnas, que no tapa. La clase
 * `.compare-guide-open` del documento solo la usa la barra de comparar para centrarse en el hueco.
 */
type Entity = 'agent' | 'group' | 'user';

interface GuideContent {
  readonly what: string;
  readonly steps: readonly string[];
  readonly look: string;
}

const STEPS: Record<FichaVariant, Record<Entity, readonly string[]>> = {
  a: {
    agent: ['compare.guide.a.step1', 'compare.guide.a.step2'],
    group: ['compare.guide.a.step1', 'compare.guide.a.step2'],
    user: ['compare.guide.a.step1', 'compare.guide.a.step2'],
  },
  b: {
    agent: ['compare.guide.b.agent.step1', 'compare.guide.b.step2', 'compare.guide.b.step3'],
    group: ['compare.guide.b.group.step1', 'compare.guide.b.step2', 'compare.guide.b.step3'],
    user: ['compare.guide.b.user.step1', 'compare.guide.b.step2', 'compare.guide.b.step3'],
  },
  e: {
    agent: ['compare.guide.e.agent.step1', 'compare.guide.e.agent.step2', 'compare.guide.e.step3'],
    group: ['compare.guide.e.group.step1', 'compare.guide.e.group.step2', 'compare.guide.e.step3'],
    user: ['compare.guide.e.user.step1', 'compare.guide.e.user.step2', 'compare.guide.e.step3'],
  },
};

function entityOf(url: string): Entity {
  if (url.includes('/admin/grupos')) return 'group';
  if (url.includes('/admin/usuarios')) return 'user';
  return 'agent';
}

@Component({
  selector: 'sc-compare-guide',
  imports: [ScButtonComponent, ScDividerComponent, ScDrawerComponent, TranslateModule],
  templateUrl: './compare-guide.component.html',
  styleUrl: './compare-guide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareGuideComponent {
  protected readonly variants = inject(FichaVariantService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  private readonly entity = computed(() => entityOf(this.url()));

  protected readonly current = computed<GuideContent>(() => {
    const v = this.variants.variant();
    return {
      what: `compare.guide.${v}.what`,
      steps: STEPS[v][this.entity()],
      look: `compare.guide.${v}.look`,
    };
  });

  protected readonly others = computed(() => FICHA_VARIANTS.filter((v) => v !== this.variants.variant()));

  constructor() {
    // Apartar la página mientras la guía está abierta, y devolverla al salir de la ficha.
    const root = document.documentElement;
    effect(() => root.classList.toggle('compare-guide-open', this.variants.guideOpen()));
    inject(DestroyRef).onDestroy(() => root.classList.remove('compare-guide-open'));
  }

  protected labelKey(v: FichaVariant): string {
    return `compare.variant.${v}.label`;
  }

  protected onVisibleChange(open: boolean): void {
    this.variants.guideOpen.set(open);
  }
}
