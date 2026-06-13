/**
 * Registro de páginas de componentes de la demo. Cada port añade su entrada;
 * el índice y las rutas se derivan de aquí.
 */
export interface ScDemoComponentPage {
  path: string;
  label: string;
  load: () => Promise<unknown>;
}

export const SC_DEMO_COMPONENT_PAGES = [
  {
    path: 'button',
    label: 'Button',
    load: () => import('./button/button-demo.component').then((m) => m.ButtonDemoComponent),
  },
  {
    path: 'badge',
    label: 'Badge',
    load: () => import('./badge/badge-demo.component').then((m) => m.BadgeDemoComponent),
  },
  {
    path: 'card',
    label: 'Card',
    load: () => import('./card/card-demo.component').then((m) => m.CardDemoComponent),
  },
  {
    path: 'chip',
    label: 'Chip',
    load: () => import('./chip/chip-demo.component').then((m) => m.ChipDemoComponent),
  },
  {
    path: 'tag',
    label: 'Tag',
    load: () => import('./tag/tag-demo.component').then((m) => m.TagDemoComponent),
  },
  {
    path: 'message',
    label: 'Message',
    load: () => import('./message/message-demo.component').then((m) => m.MessageDemoComponent),
  },
  {
    path: 'panel',
    label: 'Panel',
    load: () => import('./panel/panel-demo.component').then((m) => m.PanelDemoComponent),
  },
  {
    path: 'skeleton',
    label: 'Skeleton',
    load: () => import('./skeleton/skeleton-demo.component').then((m) => m.SkeletonDemoComponent),
  },
  {
    path: 'textarea',
    label: 'Textarea',
    load: () => import('./textarea/textarea-demo.component').then((m) => m.TextareaDemoComponent),
  },
  {
    path: 'drawer',
    label: 'Drawer',
    load: () => import('./drawer/drawer-demo.component').then((m) => m.DrawerDemoComponent),
  },
  {
    path: 'progressbar',
    label: 'ProgressBar',
    load: () => import('./progressbar/progressbar-demo.component').then((m) => m.ProgressBarDemoComponent),
  },
  {
    path: 'progressspinner',
    label: 'ProgressSpinner',
    load: () => import('./progressspinner/progressspinner-demo.component').then((m) => m.ProgressSpinnerDemoComponent),
  },
  {
    path: 'radiobutton',
    label: 'RadioButton',
    load: () => import('./radiobutton/radiobutton-demo.component').then((m) => m.RadioButtonDemoComponent),
  },
  {
    path: 'avatar',
    label: 'Avatar',
    load: () => import('./avatar/avatar-demo.component').then((m) => m.AvatarDemoComponent),
  },
  {
    path: 'toast',
    label: 'Toast',
    load: () => import('./toast/toast-demo.component').then((m) => m.ToastDemoComponent),
  },
  {
    path: 'divider',
    label: 'Divider',
    load: () => import('./divider/divider-demo.component').then((m) => m.DividerDemoComponent),
  },
  {
    path: 'inputgroup',
    label: 'InputGroup',
    load: () => import('./inputgroup/inputgroup-demo.component').then((m) => m.InputGroupDemoComponent),
  },
  {
    path: 'search',
    label: 'Search',
    load: () => import('./search/search-demo.component').then((m) => m.SearchDemoComponent),
  },
  {
    path: 'datepicker',
    label: 'Datepicker',
    load: () => import('./datepicker/datepicker-demo.component').then((m) => m.DatepickerDemoComponent),
  },
  {
    path: 'inputnumber',
    label: 'InputNumber',
    load: () => import('./inputnumber/inputnumber-demo.component').then((m) => m.InputNumberDemoComponent),
  },
  {
    path: 'multiselect',
    label: 'MultiSelect',
    load: () => import('./multiselect/multiselect-demo.component').then((m) => m.MultiSelectDemoComponent),
  },
  {
    path: 'grouppopover',
    label: 'GroupPopover',
    load: () => import('./grouppopover/grouppopover-demo.component').then((m) => m.GroupPopoverDemoComponent),
  },
  {
    path: 'columnselector',
    label: 'ColumnSelector',
    load: () => import('./columnselector/columnselector-demo.component').then((m) => m.ColumnSelectorDemoComponent),
  },
  {
    path: 'confirmdialog',
    label: 'ConfirmDialog',
    load: () => import('./confirmdialog/confirmdialog-demo.component').then((m) => m.ConfirmDialogDemoComponent),
  },
  {
    path: 'inputtext',
    label: 'InputText',
    load: () => import('./inputtext/inputtext-demo.component').then((m) => m.InputTextDemoComponent),
  },
] satisfies ScDemoComponentPage[];
