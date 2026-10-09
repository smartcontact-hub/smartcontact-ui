import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { type Popover, PopoverModule } from 'primeng/popover';
import { map, startWith } from 'rxjs';

import {
  type LabelColor,
  ScAvatarComponent as AvatarComponent,
  ScButtonComponent as ButtonComponent,
  ScDrawerComponent as DrawerComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScTagComponent as TagComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

import { LanguageService } from '@core/services/language.service';
import type { ResourceRow } from '@shared/components';
import { createVersionedStorage } from '@core/services/local-store.factory';
import { ResourceRowsService } from '@features/admin/services/resource-rows.service';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import { CategoriesStore } from '@features/memory/state/categories.store';
import { EntitiesStore } from '@features/memory/state/entities.store';
import { RulesStore } from '@features/memory/state/rules.store';

import type { LucideIconData } from '../components/repo-types';
import { AgendasStore } from '../state/agendas.store';
import { EmailTriggersStore, MailboxesStore } from '../state/emails.store';
import { EntidadesStore } from '../state/entidades.store';
import { HorariosStore } from '../state/horarios.store';
import { EquiposStore } from '../state/equipos.store';
import { IntencionesStore } from '../state/intenciones.store';
import { TipificacionesStore } from '../state/tipificaciones.store';
import { VariablesStore } from '../state/variables.store';

/** Una entrada de un repositorio, en el panel: su nombre, un dato suyo y adónde lleva. */
interface HubEntrada {
  readonly id: string | number;
  readonly nombre: string;
  readonly detalle: string;
  readonly link: string;
  readonly queryParams?: Readonly<Record<string, string | number>>;
}

interface HubItem {
  /** Para el `id` de su descripción (`aria-describedby`) y para los recientes: único en la página. */
  readonly id: string;
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly icon: LucideIconData;
  readonly path: string;
  /** Cuántos hay: lo que cuenta el almacén que enseña su página (DD-165). */
  readonly count: () => number;
  /** Sus entradas, para el panel. Se llama dentro de un `computed` que lee el idioma. */
  readonly entradas: () => HubEntrada[];
}

interface HubCategory {
  readonly id: string;
  readonly titleKey: string;
  /** Su tono, de los de etiqueta del DS (DD-179): dice de qué grupo es cada destino, en el título, el icono y el panel. */
  readonly tono: LabelColor;
  readonly items: readonly HubItem[];
}

/** Una tarjeta, ya traducida y con su cifra escrita en el idioma. */
interface HubCard {
  readonly id: string;
  readonly tono: LabelColor;
  readonly nombre: string;
  readonly descripcion: string;
  readonly cifra: string;
  /** El nombre que oye el lector: «Agendas (9)» (DD-165 §2). */
  readonly aria: string;
  readonly icon: LucideIconData;
}

interface HubSection {
  readonly id: string;
  readonly titulo: string;
  readonly tono: LabelColor;
  readonly cards: readonly HubCard[];
}

/** «Todos» en el filtro de categorías: un valor, no una categoría. */
const TODAS = 'todas';

/** Cuántos recientes se recuerdan, como en la maqueta. */
const MAX_RECIENTES = 3;

/**
 * Hub de Repositorios: los destinos agrupados por categoría, en tarjetas, y un panel con lo que hay dentro (DD-179).
 *
 * Fue una fila de navegación hecha a mano y luego el `Menu` de PrimeNG en línea (DD-78). El rediseño de Figma Make
 * («Premium Repository Hub») lo lleva a una rejilla de tarjetas por categoría (icono, cifra, nombre y descripción),
 * y su comportamiento:
 *   · pulsar una tarjeta la marca y abre a la derecha un panel con sus entradas y «Abrir repositorio»; pulsarla otra
 *     vez lo cierra, y otra tarjeta lo cambia. Escape y un clic fuera lo cierran. Lo que hay en el panel es lo de verdad (cada entrada
 *     lleva a su sitio), no la lista de ejemplo de la maqueta;
 *   · encima, el buscador y un filtro por categoría, que al cambiar mueve las categorías (`startViewTransition`);
 *   · el buscador vacío, al entrar en él, ofrece los últimos repositorios abiertos.
 *
 * Todo cabe sin desplazar a 1440 × 800: las categorías de dos van una al lado de la otra. El panel va acoplado bajo la
 * barra de la app; si por el ancho taparía tarjetas, lleva velo, como un modal.
 *
 * Cada categoría lleva un tono de etiqueta del DS (azul, morado, teal y naranja; no los de estado, rojo, verde y ámbar,
 * ni el marrón de «Administrativo», DD-176): en su título, en el icono y la cifra de cada destino, en el borde de la
 * tarjeta al pasar y al marcarla, y en el panel.
 *
 * De la maqueta NO se queda lo que inventaba datos: la variación de la semana y la última edición (no hay ese dato) y
 * la barrita de proporción.
 */
@Component({
  selector: 'sc-repositorios-hub-page',
  imports: [
    AvatarComponent,
    ButtonComponent,
    DrawerComponent,
    EmptyStateComponent,
    IconComponent,
    PopoverModule,
    RouterLink,
    SearchComponent,
    SelectButtonComponent,
    TagComponent,
    TranslateModule,
  ],
  templateUrl: './repositorios-hub-page.component.html',
  styleUrl: './repositorios-hub-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoriosHubPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly filas = inject(ResourceRowsService);
  private readonly agendas = inject(AgendasStore);
  private readonly mailboxes = inject(MailboxesStore);
  private readonly emailTriggers = inject(EmailTriggersStore);
  private readonly horarios = inject(HorariosStore);
  private readonly equipos = inject(EquiposStore);
  private readonly templates = inject(TemplatesStore);
  private readonly tipificaciones = inject(TipificacionesStore);
  private readonly labels = inject(LabelsStore);
  private readonly variables = inject(VariablesStore);
  private readonly entidades = inject(EntidadesStore);
  private readonly intenciones = inject(IntencionesStore);
  // Las tres de IA llevan a Conversaciones: cuentan lo que enseñan esas páginas, no los repositorios de antes.
  private readonly reglas = inject(RulesStore);
  private readonly entidadesIA = inject(EntitiesStore);
  private readonly categorias = inject(CategoriesStore);

  /** La búsqueda: por nombre y por descripción, en minúsculas y por subcadena, como en las listas. */
  protected readonly query = signal('');
  /** La categoría que se enseña, o todas. */
  protected readonly filtro = signal<string>(TODAS);
  /** La tarjeta marcada, cuyo panel está abierto. */
  protected readonly seleccion = signal<string | null>(null);

  /** Los últimos repositorios abiertos en el panel, el más reciente primero. Del navegador de quien lo usa. */
  private readonly recientesGuardados = createVersionedStorage<string>({
    storageKey: 'sc-repositorios-recientes',
    versionKey: 'sc-repositorios-recientes-version',
    currentVersion: 1,
    defaults: [],
  });
  private readonly recientesIds = signal<readonly string[]>(this.recientesGuardados.read());

  private readonly recientesPopover = viewChild<Popover>('recientesPopover');
  /** Quien abrió el panel con el teclado, para devolverle el foco al cerrarlo. */
  private abiertoCon: HTMLElement | null = null;

  /** Las cifras, con el separador de miles del idioma. */
  private readonly cifra = computed(() => new Intl.NumberFormat(this.language.locale()));

  /** Idioma vivo: `translate.instant()` no es reactivo, y sin esta dependencia el hub se quedaría
   *  en el idioma con el que se abrió la página. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  private readonly t = (k: string, params?: object): string => this.translate.instant(k, params);
  private readonly estado = (activa: boolean): string => this.t(`repositories.status.${activa ? 'active' : 'inactive'}`);
  /** Un repositorio de lista (`repo-list-page`) abre filtrado por el nombre (`?buscar=`, DD-164). */
  private readonly buscando = (path: string, nombre: string): Pick<HubEntrada, 'link' | 'queryParams'> => ({
    link: path,
    queryParams: { buscar: nombre },
  });
  /** De las filas del resumen de recursos (DD-164), las mismas palabras y el mismo «Editar». */
  private readonly deFilas = (rows: readonly ResourceRow[], path: string): HubEntrada[] =>
    rows.map((r) => ({ id: r.id, nombre: r.name, detalle: r.detail, link: r.edit?.link ?? path, queryParams: r.edit?.queryParams }));

  private readonly categories: readonly HubCategory[] = [
    {
      id: 'communication',
      titleKey: 'repositories.hub.categories.communication',
      tono: 'blue',
      items: [
        {
          id: 'agendas',
          labelKey: 'repositories.agendas.title',
          descriptionKey: 'repositories.hub.descriptions.agendas',
          icon: 'call',
          path: '/admin/agendas',
          count: () => this.agendas.items().length,
          entradas: () => this.deFilas(this.filas.agendas(this.agendas.items().map((a) => a.id), true), '/admin/agendas'),
        },
        {
          id: 'horarios',
          labelKey: 'repositories.horarios.title',
          descriptionKey: 'repositories.hub.descriptions.horarios',
          icon: 'schedule',
          path: '/admin/horarios',
          count: () => this.horarios.items().length,
          entradas: () =>
            this.horarios.items().map((h) => ({
              id: h.id,
              nombre: h.name,
              detalle: `${h.schedule}, ${this.estado(h.status === 'active').toLocaleLowerCase()}`,
              ...this.buscando('/admin/horarios', h.name),
            })),
        },
        {
          id: 'emails',
          labelKey: 'repositories.emails.title',
          descriptionKey: 'repositories.hub.descriptions.emails',
          icon: 'mail',
          path: '/admin/emails',
          // Cuentas de correo y triggers: lo que se configura en esa página.
          count: () => this.mailboxes.items().length + this.emailTriggers.items().length,
          entradas: () => [
            ...this.mailboxes.items().map((m) => ({
              id: `cuenta-${m.id}`,
              nombre: m.name,
              detalle: this.t('repositories.emails.mailbox_singular'),
              link: `/admin/emails/cuentas/editar/${m.id}`,
            })),
            ...this.emailTriggers.items().map((x) => ({
              id: `trigger-${x.id}`,
              nombre: x.name,
              detalle: this.t('repositories.emails.trigger_singular'),
              link: `/admin/emails/triggers/editar/${x.id}`,
            })),
          ],
        },
        {
          id: 'plantillas',
          labelKey: 'templates.page_title',
          descriptionKey: 'repositories.hub.descriptions.plantillas',
          icon: 'file_copy',
          path: '/admin/plantillas',
          count: () => this.templates.templates().length,
          entradas: () =>
            this.templates.templates().map((p) => ({
              id: p.id,
              nombre: p.title,
              detalle: this.t(`templates.type.${p.type}`),
              link: '/admin/plantillas',
              queryParams: { editar: p.id },
            })),
        },
        {
          id: 'tipificaciones',
          labelKey: 'repositories.tipificaciones.title',
          descriptionKey: 'repositories.hub.descriptions.tipificaciones',
          // Un icono por concepto: el de la tipificación en el resto del producto (`condition.types.ts`).
          icon: 'sell',
          path: '/admin/tipificaciones',
          count: () => this.tipificaciones.items().length,
          entradas: () =>
            this.deFilas(this.filas.tipificaciones(this.tipificaciones.items().map((t) => t.id), true), '/admin/tipificaciones'),
        },
      ],
    },
    {
      id: 'classification',
      titleKey: 'repositories.hub.categories.classification',
      tono: 'purple',
      items: [
        {
          id: 'labels',
          labelKey: 'labels.page_title',
          descriptionKey: 'repositories.hub.descriptions.labels',
          icon: 'label',
          path: '/admin/labels',
          count: () => this.labels.labels().length,
          entradas: () =>
            this.labels.labels().map((l) => ({ id: l.id, nombre: l.name, detalle: l.description ?? '', link: '/admin/labels' })),
        },
        {
          id: 'equipos',
          labelKey: 'repositories.equipos.title',
          descriptionKey: 'repositories.hub.descriptions.equipos',
          icon: 'group_work',
          path: '/admin/equipos',
          count: () => this.equipos.items().length,
          entradas: () =>
            this.equipos.items().map((g) => ({
              id: g.id,
              nombre: g.name,
              detalle: g.description,
              link: `/admin/equipos/editar/${g.id}`,
            })),
        },
        {
          id: 'variables',
          labelKey: 'repositories.variables.title',
          descriptionKey: 'repositories.hub.descriptions.variables',
          icon: 'data_object',
          path: '/admin/variables',
          count: () => this.variables.items().length,
          entradas: () =>
            this.variables.items().map((v) => ({ id: v.id, nombre: v.name, detalle: v.key, ...this.buscando('/admin/variables', v.name) })),
        },
      ],
    },
    {
      id: 'conversational_designer',
      titleKey: 'repositories.hub.categories.conversational_designer',
      tono: 'teal',
      items: [
        {
          id: 'entidades',
          labelKey: 'repositories.entidades.title',
          descriptionKey: 'repositories.hub.descriptions.entidades',
          icon: 'inventory_2',
          path: '/admin/entidades',
          count: () => this.entidades.items().length,
          entradas: () =>
            this.entidades.items().map((e) => ({ id: e.id, nombre: e.name, detalle: e.type, ...this.buscando('/admin/entidades', e.name) })),
        },
        {
          id: 'intenciones',
          labelKey: 'repositories.intenciones.title',
          descriptionKey: 'repositories.hub.descriptions.intenciones',
          icon: 'chat_bubble',
          path: '/admin/intenciones',
          count: () => this.intenciones.items().length,
          entradas: () =>
            this.intenciones
              .items()
              .map((i) => ({ id: i.id, nombre: i.name, detalle: i.category, ...this.buscando('/admin/intenciones', i.name) })),
        },
      ],
    },
    {
      id: 'ai',
      titleKey: 'repositories.hub.categories.ai',
      tono: 'orange',
      items: [
        {
          // S38 decisión B fusión hubs: redirigir a vistas Memory reales.
          id: 'reglas_ia',
          labelKey: 'repositories.reglas_ia.title',
          descriptionKey: 'repositories.hub.descriptions.reglas_ia',
          icon: 'auto_awesome',
          path: '/conversaciones/reglas',
          count: () => this.reglas.rules().length,
          entradas: () =>
            this.reglas
              .rules()
              .map((r) => ({ id: r.id, nombre: r.name, detalle: this.estado(r.active), link: `/conversaciones/reglas/${r.id}` })),
        },
        {
          id: 'entidades_ia',
          labelKey: 'repositories.entidades_ia.title',
          descriptionKey: 'repositories.hub.descriptions.entidades_ia',
          icon: 'inventory_2',
          path: '/conversaciones/entidades',
          count: () => this.entidadesIA.entities().length,
          entradas: () =>
            this.entidadesIA
              .entities()
              .map((e) => ({ id: e.id, nombre: e.name, detalle: e.description, link: '/conversaciones/entidades' })),
        },
        {
          id: 'clasificacion_ia',
          labelKey: 'repositories.clasificacion_ia.title',
          descriptionKey: 'repositories.hub.descriptions.clasificacion_ia',
          icon: 'category',
          path: '/conversaciones/categorias',
          count: () => this.categorias.categories().length,
          entradas: () =>
            this.categorias
              .categories()
              .map((c) => ({ id: c.id, nombre: c.name, detalle: this.estado(c.isActive), link: '/conversaciones/categorias' })),
        },
      ],
    },
  ];

  private readonly items = new Map(this.categories.flatMap((c) => c.items.map((i) => [i.id, { item: i, categoria: c }] as const)));

  /** El filtro: «Todos» y una opción por categoría, con su nombre traducido (es también su nombre accesible) y su tono:
   *  la elegida se escribe en el de su grupo, como en la maqueta. */
  protected readonly opcionesFiltro = computed(() => {
    this.currentLang();
    return [
      { label: this.t('repositories.hub.all'), value: TODAS, tono: null },
      ...this.categories.map((c) => ({ label: this.t(c.titleKey), value: c.id, tono: c.tono })),
    ];
  });

  /** Las categorías con lo que casa con la búsqueda y el filtro; una categoría sin tarjetas no sale.
   *
   *  ⚠️ El nombre que oye el lector lleva la cifra («Agendas (9)», DD-165 §2) y va en `aria-label`; lo pintado se le
   *  oculta, para no decirla dos veces. La descripción se oye aparte (`aria-describedby`). */
  protected readonly sections = computed<HubSection[]>(() => {
    this.currentLang();
    const q = this.query().trim().toLowerCase();
    const filtro = this.filtro();
    return this.categories
      .filter((category) => filtro === TODAS || category.id === filtro)
      .map((category) => ({
        id: category.id,
        titulo: this.t(category.titleKey),
        tono: category.tono,
        cards: category.items
          .map((item) => ({ item, nombre: this.t(item.labelKey), descripcion: this.t(item.descriptionKey) }))
          .filter(({ nombre, descripcion }) => !q || nombre.toLowerCase().includes(q) || descripcion.toLowerCase().includes(q))
          .map(({ item, nombre, descripcion }) => {
            const cifra = this.cifra().format(item.count());
            return {
              id: item.id,
              tono: category.tono,
              nombre,
              descripcion,
              cifra,
              aria: this.t('repositories.hub.item_aria', { name: nombre, count: cifra }),
              icon: item.icon,
            };
          }),
      }))
      .filter((section) => section.cards.length > 0);
  });

  /** Lo que enseña el panel: el repositorio marcado, su categoría y sus entradas. */
  protected readonly panel = computed(() => {
    this.currentLang();
    const id = this.seleccion();
    const found = id ? this.items.get(id) : undefined;
    if (!found) return null;
    const { item, categoria } = found;
    const entradas = item.entradas();
    const n = this.cifra().format(entradas.length);
    return {
      id: item.id,
      nombre: this.t(item.labelKey),
      descripcion: this.t(item.descriptionKey),
      categoria: this.t(categoria.titleKey),
      tono: categoria.tono,
      icon: item.icon,
      path: item.path,
      entradas,
      cuantas: this.t(entradas.length === 1 ? 'repositories.hub.entries_one' : 'repositories.hub.entries', { count: n }),
    };
  });

  /** Los recientes que siguen existiendo, con su nombre y su cifra. */
  protected readonly recientes = computed(() => {
    this.currentLang();
    return this.recientesIds().flatMap((id) => {
      const found = this.items.get(id);
      return found
        ? [
            {
              id,
              nombre: this.t(found.item.labelKey),
              icon: found.item.icon,
              tono: found.categoria.tono,
              cifra: this.cifra().format(found.item.count()),
            },
          ]
        : [];
    });
  });

  /** ¿El panel taparía tarjetas? Entonces va con velo, como modal (la maqueta lo hace en pantallas pequeñas). No sale de
   *  un ancho fijo sino de medir: depende de la ventana y de si el menú lateral está abierto. */
  protected readonly panelTapa = signal(false);

  constructor() {
    const ventana = this.document.defaultView;
    const medir = (): void => this.panelTapa.set(this.tapaTarjetas());
    ventana?.addEventListener('resize', medir);
    this.document.addEventListener('click', this.alClicFuera);
    inject(DestroyRef).onDestroy(() => {
      ventana?.removeEventListener('resize', medir);
      this.document.removeEventListener('click', this.alClicFuera);
    });
  }

  /** Un clic fuera del panel lo cierra. PrimeNG lo hace con `dismissible`, pero solo al pulsar el velo, y acoplado no lo
   *  lleva. Las tarjetas se quedan fuera de la cuenta (cambian de panel o lo cierran ellas), y los recientes también. */
  private readonly alClicFuera = (event: MouseEvent): void => {
    if (this.seleccion() === null || this.panelTapa()) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.isConnected) return;
    if (target.closest('.p-drawer, .repo-card, .p-popover')) return;
    this.cerrar();
  };

  /** El panel mide `--sc-spacing-25` y entra por la derecha: tapa si las tarjetas llegan más allá de su borde. */
  private tapaTarjetas(): boolean {
    const ventana = this.document.defaultView;
    const rejilla = this.document.querySelector('.hub__sections');
    if (!ventana || !rejilla) return false;
    const raiz = ventana.getComputedStyle(this.document.documentElement);
    const ancho = parseFloat(raiz.getPropertyValue('--sc-spacing-25')) * parseFloat(raiz.fontSize);
    return rejilla.getBoundingClientRect().right > ventana.innerWidth - ancho;
  }

  /** Columnas de la rejilla de una categoría, como en la maqueta: dos con dos o menos, tres con tres, cuatro con más. */
  protected columnas(n: number): 2 | 3 | 4 {
    return n <= 2 ? 2 : n === 3 ? 3 : 4;
  }

  /** Pulsar una tarjeta abre su panel; pulsar la marcada, lo cierra (la maqueta). */
  protected alternar(id: string, event: MouseEvent): void {
    if (this.seleccion() === id) {
      this.cerrar();
      return;
    }
    // `detail` 0: la pulsó el teclado (Enter o Espacio). Entonces el foco entra en el panel, y vuelve aquí al cerrar.
    this.abiertoCon = event.detail === 0 ? (event.currentTarget as HTMLElement) : null;
    this.panelTapa.set(this.tapaTarjetas());
    this.seleccion.set(id);
    this.recordar(id);
    // Tras pintarse el panel (o su contenido nuevo, si ya estaba abierto): antes no existe a qué llevar el foco.
    if (this.abiertoCon) {
      afterNextRender(() => this.document.getElementById('repo-panel')?.querySelector<HTMLElement>('a, button')?.focus(), {
        injector: this.injector,
      });
    }
  }

  protected cerrar(): void {
    if (this.seleccion() === null) return;
    this.seleccion.set(null);
    const opener = this.abiertoCon;
    this.abiertoCon = null;
    if (opener?.isConnected) queueMicrotask(() => opener.focus());
  }

  protected abrir(path: string): void {
    void this.router.navigateByUrl(path);
  }

  /** Cambiar de categoría mueve las tarjetas a su sitio nuevo, como la maqueta: lo que sale se funde, lo que queda se
   *  desplaza y lo que entra aparece. Es una transición del navegador; sin ella, o con menos movimiento, cambia sin más.
   *  Pulsar la elegida vuelve a «Todos» (`allowEmpty`, como la maqueta). */
  protected filtrar(valor: string | null): void {
    const siguiente = valor ?? TODAS;
    if (siguiente === this.filtro()) return;
    const doc = this.document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const quieto = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? true;
    if (!doc.startViewTransition || quieto) {
      this.filtro.set(siguiente);
      return;
    }
    // El nombre de cada categoría existe SOLO durante esta transición. Puesto siempre, la transición del router al entrar
    // en Repositorios las pintaba en su propia capa, por encima de todo, menú desplegado incluido, y con la animación de
    // «subir y aparecer» del filtro (medido el 2026-10-09: cuatro `::view-transition-new(repo-cat-…)` al navegar).
    this.filtrando.set(true);
    this.cdr.detectChanges();
    const transicion = doc.startViewTransition(() => {
      this.filtro.set(siguiente);
      this.cdr.detectChanges();
    });
    void transicion.finished.finally(() => this.filtrando.set(false));
  }

  /** Mientras dura la transición del filtro: solo entonces llevan nombre las categorías. */
  protected readonly filtrando = signal(false);

  /** Al entrar en el buscador vacío, los recientes (si hay); al escribir, se van. */
  protected alEnfocarBuscador(event: FocusEvent): void {
    if (this.query() === '' && this.recientes().length > 0) this.recientesPopover()?.show(event, event.currentTarget as HTMLElement);
  }

  protected alEscribir(valor: string): void {
    this.query.set(valor);
    if (valor !== '') this.recientesPopover()?.hide();
  }

  /** Elegir un reciente lo busca, como la maqueta: queda su tarjeta sola. */
  protected elegirReciente(nombre: string): void {
    this.query.set(nombre);
    this.recientesPopover()?.hide();
  }

  private recordar(id: string): void {
    const lista = [id, ...this.recientesIds().filter((r) => r !== id)].slice(0, MAX_RECIENTES);
    this.recientesIds.set(lista);
    this.recientesGuardados.write(lista);
  }
}
