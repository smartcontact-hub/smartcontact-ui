import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, type MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  ScButtonComponent as ButtonComponent,
  type ColumnDef,
  type GroupRef,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDialogComponent as DialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScGroupPopoverComponent as GroupPopoverComponent,
  useBulkEntityI18n,
} from '@smartcontact-hub/components';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { XlsxExportService } from '@core/services';
import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { ListPageComponent } from '@shared/components';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { resolveGroup } from '@features/admin/groups/data/groups-data';

import { decodificarCsv } from '../state/agenda-contacts.core.mjs';
import {
  filasParaDescargar,
  type ImportacionDeTipificaciones,
  nivelesDe,
  opcionesPorNivel,
  parsearTipificacionesCsv,
  plantillaCsv,
  TOPE_DE_IMPORTACION,
} from '../state/tipificaciones.core.mjs';
import { type Tipificacion, TipificacionesStore } from '../state/tipificaciones.store';
import { TipificacionUsoService } from '../state/tipificacion-uso.service';

/* v1 (2026-10-05): las columnas de la revisión de producto. v2 (2026-10-09): sin Dirección ni Comentarios, que pasan
 * al grupo (revisión de tipificaciones). */
const COLUMN_PREF_KEY = 'sc-tipificaciones-columns-v2';

/**
 * El listado de Tipificaciones (DD-173): nombre, descripción, dirección, comentarios,
 * niveles, grupos e ID, todas ordenables. Crear y abrir una fila llevan a su ficha (General, Categorización y Grupos);
 * importar y descargar van detrás de un solo icono, con las columnas de la plantilla, una fila por camino del árbol.
 * El ID es una columna opcional, como el de Agentes y Grupos.
 */
@Component({
  selector: 'sc-tipificaciones-list-page',
  imports: [
    ButtonComponent,
    DeleteEntityDialogComponent,
    DialogComponent,
    EmptyStateComponent,
    GroupPopoverComponent,
    IconComponent,
    ListPageComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './tipificaciones-list-page.component.html',
  styleUrl: './tipificaciones-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionesListPageComponent {
  private readonly store = inject(TipificacionesStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly uso = inject(TipificacionUsoService);
  private readonly router = inject(Router);
  private readonly xlsx = inject(XlsxExportService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';
  protected readonly columnPrefKey = COLUMN_PREF_KEY;

  /** Por nombre de entrada; las cabeceras ordenan por las demás. */
  protected readonly rows = computed(() => [...this.store.items()].sort((a, b) => a.name.localeCompare(b.name, 'es')));

  protected readonly selectedIds = signal<ReadonlySet<Tipificacion['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly Tipificacion[] | null>(null);
  protected readonly deleteItems = computed(() => (this.deleteTarget() ?? []).map((t) => ({ id: t.id, name: t.name })));
  /** Qué grupos las usan, en el diálogo de eliminar: dejarán de tipificar. */
  protected readonly avisoDeUso = computed(() => {
    this.lang();
    const target = this.deleteTarget() ?? [];
    return target.length === 0 ? null : this.uso.aviso(new Set(target.map((t) => t.id)), target.length > 1);
  });
  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'repositories.tipificaciones.singular',
    plural: 'repositories.tipificaciones.plural',
    selectedOne: 'common.bulk.selected_one_f',
    selectedOther: 'common.bulk.selected_other_f',
  });

  private readonly groupsById = computed(() => new Map(this.groupsStore.groups().map((g) => [g.id, g])));

  /** Los grupos que clasifican con ella (lo dice cada grupo, en su General), para el MISMO desplegable que «Grupos» en
   *  la lista de agentes. */
  protected groupsOf(t: Tipificacion): readonly GroupRef[] {
    return [...this.groupsById().values()]
      .filter((g) => resolveGroup(g).wrapUp.typificationId === t.id)
      .map((g) => ({ id: g.id, name: g.name, active: true }));
  }

  /** «3 niveles». */
  protected levelsLabel(t: Tipificacion): string {
    this.lang();
    const n = nivelesDe(t);
    return this.translate.instant(`repositories.tipificaciones.levels_count${n === 1 ? '_one' : ''}`, { count: n });
  }

  /** Lo que hay en cada nivel, al pasar o al enfocar: las opciones del primero por su nombre, y cuántas en los demás. */
  protected levelsDetail(t: Tipificacion): string | null {
    this.lang();
    const n = nivelesDe(t);
    if (n === 0) return null;
    const cuenta = opcionesPorNivel(t.options, n);
    const cifra = new Intl.NumberFormat(this.language.locale());
    return cuenta
      .map((total, i) =>
        i === 0
          ? this.translate.instant('repositories.tipificaciones.levels_first', { names: t.options.map((o) => o.label).join(', ') })
          : this.translate.instant(`repositories.tipificaciones.levels_other${total === 1 ? '_one' : ''}`, {
              level: i + 1,
              count: cifra.format(total),
            }),
      )
      .join(', ');
  }

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => {
    this.lang();
    const t = (k: string) => this.translate.instant(`repositories.tipificaciones.columns.${k}`);
    return [
      { key: 'name', label: t('name'), locked: true },
      { key: 'description', label: t('description') },
      { key: 'levels', label: t('levels') },
      { key: 'groups', label: t('groups') },
      { key: 'id', label: t('id'), defaultVisible: false },
    ];
  });

  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Tipificacion>>>('nameTpl');
  private readonly descriptionTpl = viewChild<TemplateRef<ScColumnCellContext<Tipificacion>>>('descriptionTpl');
  private readonly levelsTpl = viewChild<TemplateRef<ScColumnCellContext<Tipificacion>>>('levelsTpl');
  private readonly groupsTpl = viewChild<TemplateRef<ScColumnCellContext<Tipificacion>>>('groupsTpl');
  private readonly idTpl = viewChild<TemplateRef<ScColumnCellContext<Tipificacion>>>('idTpl');

  /** Todas ordenables (revisión de producto). Los anchos, del dato más largo de cada columna corta en los cuatro
   *  idiomas; el nombre y la descripción se reparten el resto. */
  protected readonly columns = computed<readonly ScColumnDef<Tipificacion>[]>(() => {
    this.lang();
    const t = (k: string) => this.translate.instant(`repositories.tipificaciones.columns.${k}`);
    return [
      { field: 'name', header: t('name'), sortable: true, cellTemplate: this.nameTpl() },
      { field: 'description', header: t('description'), sortable: true, cellTemplate: this.descriptionTpl() },
      { field: 'levels', header: t('levels'), sortable: true, cellTemplate: this.levelsTpl(), width: '9.5rem' },
      { field: 'groups', header: t('groups'), sortable: true, cellTemplate: this.groupsTpl(), width: '6.5rem' },
      { field: 'id', header: t('id'), sortable: true, cellTemplate: this.idTpl(), width: '4.5rem' },
    ];
  });

  /** El orden de cada cabecera, ascendente. */
  protected readonly compare = (a: Tipificacion, b: Tipificacion, field: string): number => {
    switch (field) {
      case 'name':
        return a.name.localeCompare(b.name, 'es');
      case 'description':
        return a.description.localeCompare(b.description, 'es');
      case 'levels':
        return nivelesDe(a) - nivelesDe(b);
      case 'groups':
        return this.groupsOf(a).length - this.groupsOf(b).length;
      case 'id':
        return a.id - b.id;
      default:
        return 0;
    }
  };

  /** Lo que se busca: lo que se lee en la fila, el nombre y la descripción. */
  protected readonly matchesSearch = (t: Tipificacion, q: string): boolean =>
    t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);

  protected onCreateClick(): void {
    void this.router.navigateByUrl('/admin/tipificaciones/crear');
  }

  protected onRowOpen(t: Tipificacion): void {
    void this.router.navigateByUrl(`/admin/tipificaciones/editar/${t.id}`);
  }

  protected readonly rowMenu = (t: Tipificacion): MenuItem[] => [
    {
      label: this.translate.instant('common.edit'),
      icon: 'sc-icon-font sc-icon-font--edit',
      command: () => this.onRowOpen(t),
    },
    { separator: true },
    {
      label: this.translate.instant('common.delete_gate'),
      icon: 'sc-icon-font sc-icon-font--delete',
      styleClass: 'sc-menu-item--danger',
      command: () => this.deleteTarget.set([t]),
    },
  ];

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.store.items().filter((t) => ids.has(t.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected confirmDelete(remainingIds: readonly number[] | null): void {
    const target = this.deleteTarget();
    if (!target) return;
    const keep = remainingIds === null ? null : new Set(remainingIds);
    const borradas = keep ? target.filter((t) => keep.has(t.id)) : [...target];
    this.uso.soltar(new Set(borradas.map((t) => t.id)));
    this.store.deleteItems(borradas.map((t) => t.id));
    const entity = this.translate.instant('repositories.tipificaciones.singular');
    this.toast(
      borradas.length === 1
        ? this.translate.instant('repositories.toasts.deleted_single', { entity, name: borradas[0]!.name })
        : this.translate.instant('repositories.toasts.deleted_bulk', {
            count: borradas.length,
            entity: this.translate.instant('repositories.tipificaciones.plural'),
          }),
    );
    this.deleteTarget.set(null);
    this.selectedIds.set(new Set());
  }

  /* ── Descargar e importar ─────────────────────────────────────────────── */

  /** La cabecera de la plantilla y de lo descargado, en el idioma de la app: lo descargado vuelve a entrar. */
  private cabecera(): string[] {
    const t = (k: string) => this.translate.instant(`repositories.tipificaciones.import_columns.${k}`);
    return [t('name'), t('description'), t('level_1'), t('level_2'), t('level_3')];
  }

  /** Descarga lo que se ve, con las columnas de la plantilla: una fila por camino del árbol. */
  protected onExport(visibleRows: readonly Tipificacion[]): void {
    const tr = (k: string) => this.translate.instant(k);
    const filas = filasParaDescargar(visibleRows);
    this.xlsx.export({
      headers: this.cabecera(),
      rows: filas,
      sheetName: tr('repositories.tipificaciones.title'),
      filePrefix: 'tipificaciones',
    });
  }

  private static readonly ERRORES_A_LA_VISTA = 20;
  protected readonly importOpen = signal(false);
  protected readonly importPreview = signal<ImportacionDeTipificaciones | null>(null);

  protected readonly importAyuda = computed(() => {
    this.lang();
    return this.translate.instant('repositories.tipificaciones.import_help', {
      max: new Intl.NumberFormat(this.language.locale()).format(TOPE_DE_IMPORTACION),
    });
  });

  /** La vista previa en frases, como la de las agendas (DD-166): qué se crea, cada error con su línea, las que ya
   *  existían y lo que no cabe. */
  protected readonly importResumen = computed(() => {
    this.lang();
    const vista = this.importPreview();
    if (!vista) return null;
    const cifra = (n: number) => new Intl.NumberFormat(this.language.locale()).format(n);
    const frase = (clave: string, n: number) =>
      this.translate.instant(`repositories.tipificaciones.${clave}${n === 1 ? '_one' : ''}`, {
        count: cifra(n),
        max: cifra(TOPE_DE_IMPORTACION),
      });
    const vistos = vista.errores.slice(0, TipificacionesListPageComponent.ERRORES_A_LA_VISTA);
    const resto = vista.errores.length - vistos.length;
    const opciones = vista.nuevas.reduce((n, t) => n + t.options.length, 0);
    return {
      entran:
        vista.nuevas.length > 0
          ? frase('import_create', vista.nuevas.length)
          : this.translate.instant('repositories.tipificaciones.import_nothing'),
      nombres: vista.nuevas.map((t) => t.name).join(', '),
      opciones,
      errores: vista.errores.length > 0 ? frase('import_errors', vista.errores.length) : null,
      lineas: vistos.map((e) =>
        this.translate.instant('repositories.tipificaciones.import_error_line', {
          line: e.linea,
          reason: this.translate.instant(`repositories.tipificaciones.import_reason.${e.motivo}`),
        }),
      ),
      mas: resto > 0 ? this.translate.instant('repositories.tipificaciones.import_more_errors', { count: cifra(resto) }) : null,
      repetidas: vista.repetidas > 0 ? frase('import_duplicates', vista.repetidas) : null,
      sobran: vista.sobran > 0 ? frase('import_over', vista.sobran) : null,
      confirmar: vista.nuevas.length > 0 ? frase('import_confirm', vista.nuevas.length) : null,
    };
  });

  protected abrirImportar(): void {
    this.importPreview.set(null);
    this.importOpen.set(true);
  }

  protected cerrarImportar(): void {
    this.importOpen.set(false);
    this.importPreview.set(null);
  }

  protected descargarPlantilla(): void {
    const blob = new Blob([plantillaCsv(this.cabecera())], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.translate.instant('repositories.tipificaciones.import_template_file')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    const texto = decodificarCsv(new Uint8Array(await archivo.arrayBuffer()));
    this.importPreview.set(parsearTipificacionesCsv(texto, this.store.items()));
  }

  /** Lo importado se crea: sin grupos, que se asignan después en su ficha. */
  protected confirmarImportar(): void {
    const vista = this.importPreview();
    if (!vista || vista.nuevas.length === 0) return;
    for (const t of vista.nuevas) this.store.addItem(t);
    this.toast(
      this.translate.instant(`repositories.tipificaciones.import_done${vista.nuevas.length === 1 ? '_one' : ''}`, {
        count: vista.nuevas.length,
      }),
    );
    this.cerrarImportar();
  }

  private toast(summary: string): void {
    this.messages.add({ severity: 'success', summary, life: TOAST_LIFE.success });
  }
}
