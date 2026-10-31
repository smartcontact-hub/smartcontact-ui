import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import {
  ScCommandPaletteComponent,
  ScCommandPaletteService,
  ScPaletteCommand,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { COMPONENT_CATALOG, groupCatalog } from './pages/components/component-catalog';
import { ThemeToggleComponent } from './shared/theme-toggle.component';
import { LanguageToggleComponent } from './shared/language-toggle.component';
import { LanguageService } from './shared/language.service';
import { TocComponent } from './shared/toc.component';

/** Un enlace del lateral. `clave` es i18n; `texto`, un nombre propio que no se traduce (Button, Select…). */
interface EnlaceLateral {
  readonly ruta: string;
  readonly clave?: string;
  readonly texto?: string;
  readonly exacta?: boolean;
}

/** Un grupo del lateral: rótulo pequeño + sus enlaces, como en cualquier doc de sistema de diseño. */
interface GrupoLateral {
  readonly titulo: string;
  readonly enlaces: readonly EnlaceLateral[];
}

/** Las secciones que tienen páginas dentro llevan lateral; las de una sola página, no. */
interface SeccionLateral {
  readonly id: 'fundamentos' | 'componentes';
  readonly titulo: string;
  readonly ruta: string;
  readonly grupos: readonly GrupoLateral[];
}

const FUNDAMENTOS: SeccionLateral = {
  id: 'fundamentos',
  titulo: 'chrome.nav.fundamentos',
  ruta: '/fundamentos',
  grupos: [
    {
      titulo: 'chrome.side.base',
      enlaces: [
        { ruta: '/fundamentos/escala-color', clave: 'fundamentos.tabs.escala-color' },
        { ruta: '/fundamentos/tipografia', clave: 'fundamentos.tabs.tipografia' },
        { ruta: '/fundamentos/iconos', clave: 'fundamentos.tabs.iconos' },
      ],
    },
    {
      titulo: 'chrome.side.pantallas',
      enlaces: [{ ruta: '/fundamentos/patrones', clave: 'fundamentos.tabs.patrones' }],
    },
  ],
};

const COMPONENTES: SeccionLateral = {
  id: 'componentes',
  titulo: 'chrome.nav.componentes',
  ruta: '/components',
  grupos: [
    {
      titulo: 'chrome.side.empezar',
      enlaces: [
        { ruta: '/components', clave: 'chrome.side.todos', exacta: true },
        { ruta: '/components/primeng', clave: 'chrome.nav.primeng' },
      ],
    },
    ...groupCatalog('').map((g) => ({
      titulo: 'categories.' + g.category,
      enlaces: g.items.map((e) => ({ ruta: '/components/' + e.path, texto: e.label })),
    })),
  ],
};

/** Título de pestaña de las páginas sueltas (las que no salen del catálogo ni de Fundamentos). */
const TITULOS: Readonly<Record<string, string>> = {
  '/components': 'chrome.nav.componentes',
  '/components/primeng': 'chrome.nav.primeng',
  '/uso': 'chrome.nav.uso',
  '/reglas': 'chrome.nav.reglas',
  '/novedades': 'chrome.nav.novedades',
  '/lab': 'chrome.nav.lab',
  '/aviso-legal': 'chrome.nav.avisoLegal',
};

const MARCA = 'Smart Contact UI';

/**
 * Shell de sc-docs, con la estructura de las docs de sistema de diseño de referencia (Primer):
 * cabecera fija arriba con las cinco secciones, lateral SOLO en las secciones que tienen páginas
 * dentro (Fundamentos, Componentes) con sus grupos a la vista, la página en el centro y, a la
 * derecha, «En esta página» leído de sus `h2`. La portada (`/`) va sin lateral y a todo el ancho.
 *
 * El buscador ⌘K reusa `sc-command-palette` del propio DS (dogfooding): se monta una vez aquí,
 * escucha el atajo global, y le publicamos como comandos las secciones + los componentes.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ScCommandPaletteComponent,
    ScIconComponent,
    ThemeToggleComponent,
    LanguageToggleComponent,
    TocComponent,
    TranslatePipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  protected readonly palette = inject(ScCommandPaletteService);
  private readonly translate = inject(TranslateService);
  /** Idioma global: lo usan el selector de la cabecera y los comandos del ⌘K. */
  protected readonly lang = inject(LanguageService);

  protected readonly total = COMPONENT_CATALOG.length;
  protected readonly anio = new Date().getFullYear();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** La ruta sin consulta ni fragmento: la que decide sección, lateral y título. */
  protected readonly ruta = computed(() => this.url().split(/[?#]/)[0] || '/');

  /**
   * ¿Es una story suelta (`?solo=1`)? Entonces no hay cabecera ni lateral. Antes de la primera navegación `router.url`
   * aún vale `/`: se lee del hash para no pintar el marco un instante y quitarlo después (el iframe de un ancho fijo lo
   * enseñaría parpadeando).
   */
  private readonly soloAlArrancar = /[?&]solo=1(&|$)/.test(document.location.hash);
  protected readonly solo = computed(() => {
    const url = this.url();
    return /[?&]solo=1(&|$)/.test(url) || (url === '/' && this.soloAlArrancar);
  });

  protected readonly esInicio = computed(() => this.ruta() === '/');

  /** El lateral de la sección en la que estás, o null si la sección es de una sola página. */
  protected readonly seccion = computed<SeccionLateral | null>(() => {
    const r = this.ruta();
    if (r.startsWith('/fundamentos')) return FUNDAMENTOS;
    if (r.startsWith('/components')) return COMPONENTES;
    return null;
  });

  /**
   * «En esta página» va en las páginas de lectura. En la ficha de un componente no: su columna derecha es el panel de
   * controles del Playground, y la ficha lleva su propio índice bajo el título.
   */
  protected readonly conIndice = computed(() => {
    const r = this.ruta();
    return !this.esInicio() && !r.startsWith('/components');
  });

  /**
   * Migas sobre el título: de dónde cuelga la página. Solo en las páginas de dentro de una sección; la última miga es la
   * página en la que estás y no es enlace.
   */
  protected readonly migas = computed<readonly EnlaceLateral[]>(() => {
    const r = this.ruta();
    const comp = /^\/components\/([^/]+)$/.exec(r);
    const fund = /^\/fundamentos\/([^/]+)$/.exec(r);
    if (comp) {
      const raiz: EnlaceLateral = { ruta: '/components', clave: 'chrome.nav.componentes' };
      if (comp[1] === 'primeng') return [raiz, { ruta: r, clave: 'chrome.nav.primeng' }];
      const c = COMPONENT_CATALOG.find((x) => x.path === comp[1]);
      return c ? [raiz, { ruta: '', clave: 'categories.' + c.category }, { ruta: r, texto: c.label }] : [];
    }
    if (fund) return [{ ruta: '/fundamentos', clave: 'chrome.nav.fundamentos' }, { ruta: r, clave: 'fundamentos.tabs.' + fund[1] }];
    return [];
  });

  /** Lateral desplegado en estrecho (en ancho siempre se ve). */
  protected readonly menuAbierto = signal(false);

  /**
   * (Re)construye los comandos del ⌘K con las etiquetas de sección en el idioma activo.
   * Las secciones y el par de idiomas se traducen; los componentes son nombres propios
   * (Button, InputText…) y no se traducen. Se llama al arrancar y en cada cambio de idioma.
   */
  private buildPalette(): void {
    const t = (key: string): string => this.translate.instant(key) as string;
    const sectionCat = t('chrome.cmd.sections');
    const sections: ScPaletteCommand[] = [
      { id: 's-fund', label: t('chrome.nav.fundamentos'), category: sectionCat, icon: 'category', action: () => this.go('/fundamentos') },
      { id: 's-comp', label: t('chrome.nav.componentes'), category: sectionCat, icon: 'widgets', action: () => this.go('/components') },
      { id: 's-primeng', label: t('chrome.nav.primeng'), category: sectionCat, icon: 'view_list', keywords: ['catalogo', 'nativos', 'familias'], action: () => this.go('/components/primeng') },
      { id: 's-uso', label: t('chrome.nav.uso'), category: sectionCat, icon: 'dashboard', action: () => this.go('/uso') },
      { id: 's-reglas', label: t('chrome.nav.reglas'), category: sectionCat, icon: 'rule', action: () => this.go('/reglas') },
      { id: 's-novedades', label: t('chrome.nav.novedades'), category: sectionCat, icon: 'new_releases', action: () => this.go('/novedades') },
    ];
    const langCat = t('chrome.cmd.language');
    const languages: ScPaletteCommand[] = [
      { id: 'lang-es', label: 'Español', category: langCat, icon: 'translate', keywords: ['idioma', 'language', 'spanish', 'espanol'], action: () => this.lang.set('es') },
      { id: 'lang-en', label: 'English', category: langCat, icon: 'translate', keywords: ['idioma', 'language', 'english', 'ingles'], action: () => this.lang.set('en') },
    ];
    const comps: ScPaletteCommand[] = COMPONENT_CATALOG.map((c) => ({
      id: `c-${c.path}`,
      label: c.label,
      category: t(`categories.${c.category}`),
      icon: 'widgets',
      keywords: [c.path],
      action: () => this.go(`/components/${c.path}`),
    }));
    this.palette.setCommands([...sections, ...languages, ...comps]);
  }

  /** «Button | Smart Contact UI»: cada pestaña del navegador dice en qué página está. */
  private ponerTitulo(): void {
    const r = this.ruta();
    const t = (key: string): string => this.translate.instant(key) as string;
    let pagina: string | null = null;
    const comp = /^\/components\/([^/]+)$/.exec(r);
    const fund = /^\/fundamentos\/([^/]+)$/.exec(r);
    if (TITULOS[r]) pagina = t(TITULOS[r]);
    else if (comp) pagina = COMPONENT_CATALOG.find((c) => c.path === comp[1])?.label ?? null;
    else if (fund) pagina = t('fundamentos.tabs.' + fund[1]);
    this.title.setTitle(pagina ? `${pagina} | ${MARCA}` : MARCA);
  }

  constructor() {
    this.buildPalette();
    // Reconstruye los comandos del ⌘K y el título cuando cambia el idioma (y cuando el loader resuelve el idioma
    // inicial, que también emite `onLangChange`): sus etiquetas siguen al idioma.
    this.translate.onLangChange.subscribe(() => {
      this.buildPalette();
      this.ponerTitulo();
    });

    // Cierra el ⌘K y el menú de la sección en CUALQUIER navegación, no solo al navegar desde el propio palette (que ya
    // llama a `close()` en `go()`). Sin `takeUntilDestroyed`: `app.component` es la raíz, no se destruye nunca.
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.palette.close();
        this.menuAbierto.set(false);
        this.ponerTitulo();
      }
    });
  }

  /** Tema global de la doc: refleja el estado para que el toggle pinte sol/luna. */
  protected readonly isDark = signal(false);

  protected toggleDark(): void {
    const apply = (): void => {
      this.isDark.set(document.documentElement.classList.toggle('sc-dark'));
    };
    // Crossfade de TODA la página con la View Transitions API (ver styles.scss). Fallback instantáneo si el navegador
    // no la soporta o el usuario pide menos movimiento.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof doc.startViewTransition === 'function' && !reduce) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }

  private go(url: string): void {
    void this.router.navigateByUrl(url);
    this.palette.close();
  }
}
