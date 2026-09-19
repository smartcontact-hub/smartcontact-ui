# Desvíos del Supervisor respecto al nativo de primeng.dev

<!-- GENERADO por `node scripts/component-audit.mjs --write`. NO editar a mano. -->

Contra **PrimeNG 22.1.0**, la versión INSTALADA — no la documentación de la web,
que puede ir por delante.

**43 componentes** del DS se usan en el Supervisor, y entre todos esconden
**569 props** que PrimeNG sí documenta.

La regla es DD-113: *el nativo tal cual, adaptado con tokens*. Esconder una prop puede ser una
decisión buena —los wrappers EXTENDED lo hacen a propósito— pero hasta ahora esa decisión no se
veía en ningún sitio, así que no se podía revisar. Esto la pone delante.

**Cómo se usa**: al construir una pantalla, si echas en falta algo, míralo aquí ANTES de
envolverlo a mano. Si la prop está en esta lista, existe en PrimeNG y solo hay que dejarla pasar.

## ⚠️ Props nuestras sobre API que PrimeNG marca obsoleta

- **`sc-drawer.showCloseIcon`** → use 'closable' instead.

Cambiarlas rompe API pública nuestra, así que es un major (DD-58): se propone, no se cuela.

## Por componente

### `sc-datatable` · 13 usos · primeng/table

**91 props nativas no expuestas**: `alwaysShowPaginator`, `ariaLabel`, `columnResizeMode`, `columnsInput`, `compareSelectionBy`, `contextMenu`, `contextMenuSelectionInput`, `csvSeparator`, `currency`, `currencyDisplay`, `currentPageReportTemplate`, `customSort`, `defaultSortOrder`, `display`, `editMode`, `editingRowKeysInput`, `expandedRowKeysInput`, `exportFilename`, `exportFunction`, `exportHeader`, `field`, `filterButtonProps`, `filterDelay`, `filterLocale`, `filterOn`, `filtersInput`, `first`, `frozenColumns`, `frozenValue`, `frozenWidth`, `groupRowsBy`, `groupRowsByOrder`, `hideOnClear`, `lazyLoadOnInit`, `loadingIcon`, `locale`, `localeMatcher`, `matchMode`, `matchModeOptions`, `maxConstraints`, `maxFractionDigits`, `metaKeySelection`, `minFractionDigits`, `multiSortMetaInput`, `operator`, `pageLinks`, `paginatorDropdownAppendTo`, `paginatorDropdownScrollHeight`, `paginatorLocale`, `paginatorPosition`, `paginatorStyleClass`, `placeholder`, `prefix`, `reorderableColumns`, `resetPageOnSort`, `resizableColumns`, `rowExpandMode`, `rowGroupMode`, `rowHover`, `rowSelectable`, `rowTrackBy`, `selectAllInput`, `selectionPageOnly`, `showAddButton`, `showApplyButton`, `showButtons`, `showClearButton`, `showCurrentPageReport`, `showFirstLastIcon`, `showInitialSortBadge`, `showJumpToPageDropdown`, `showJumpToPageInput`, `showLoader`, `showMatchModes`, `showMenu`, `showOperator`, `showPageLinks`, `sortFieldInput`, `sortMode`, `sortOrderInput`, `stateKey`, `stateStorage`, `suffix`, `tableStyle`, `tableStyleClass`, `type`, `useGrouping`, `valueInput`, `virtualScrollDelay`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-datepicker` · 1 usos · primeng/datepicker

**55 props nativas no expuestas**: `appendTo`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `autofocus`, `baseZIndex`, `clearButtonStyleClass`, `dataType`, `defaultDate`, `disabledDates`, `disabledDays`, `firstDayOfWeek`, `fluid`, `focusTrap`, `hideOnDateTimeSelect`, `hourFormat`, `icon`, `iconAriaLabel`, `iconDisplay`, `inputSize`, `inputStyle`, `inputStyleClass`, `keepInvalid`, `max`, `maxDateCount`, `maxlength`, `min`, `minlength`, `motionOptions`, `multipleSeparator`, `numberOfMonths`, `panelStyle`, `panelStyleClass`, `pattern`, `rangeSeparator`, `readonlyInput`, `responsiveOptions`, `selectOtherMonths`, `shortYearCutoff`, `showOnFocus`, `showOtherMonths`, `showSeconds`, `showTime`, `showWeek`, `startWeekFromFirstDayOfYear`, `step`, `stepHour`, `stepMinute`, `stepSecond`, `tabindex`, `timeOnly`, `timeSeparator`, `todayButtonStyleClass`, `touchUI`, `variant`

### `sc-multiselect` · 15 usos · primeng/multiselect

**46 props nativas no expuestas**: `ariaFilterLabel`, `ariaLabel`, `autoOptionFocus`, `autocomplete`, `autofocus`, `autofocusFilter`, `chipIcon`, `dataKey`, `displaySelectedLabel`, `dropdownIcon`, `filterFields`, `filterLocale`, `filterMatchMode`, `filterPlaceHolder`, `filterValue`, `fluid`, `focusOnHover`, `group`, `highlightOnSelect`, `id`, `lazy`, `loading`, `loadingIcon`, `motionOptions`, `optionDisabled`, `optionGroupChildren`, `optionGroupLabel`, `overlayOptions`, `overlayVisible`, `panelStyle`, `panelStyleClass`, `readonly`, `resetFilterOnHide`, `scrollHeight`, `selectAll`, `selectOnFocus`, `showHeader`, `tabindex`, `tooltip`, `tooltipPosition`, `tooltipPositionStyle`, `tooltipStyleClass`, `variant`, `virtualScroll`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-select` · 32 usos · primeng/select

**45 props nativas no expuestas**: `ariaFilterLabel`, `ariaLabel`, `autoOptionFocus`, `autofocus`, `autofocusFilter`, `checkmark`, `dataKey`, `dropdownIcon`, `editable`, `filterFields`, `filterLocale`, `filterMatchMode`, `filterValue`, `fluid`, `focusOnHover`, `group`, `id`, `inputSize`, `lazy`, `loadingIcon`, `max`, `maxlength`, `min`, `minlength`, `motionOptions`, `multiple`, `optionGroupChildren`, `optionGroupLabel`, `overlayOptions`, `panelStyle`, `panelStyleClass`, `pattern`, `resetFilterOnHide`, `scrollHeight`, `selectOnFocus`, `step`, `tabindex`, `tooltip`, `tooltipPosition`, `tooltipPositionStyle`, `tooltipStyleClass`, `variant`, `virtualScroll`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-confirmdialog` · 1 usos · primeng/confirmdialog

**35 props nativas no expuestas**: `acceptAriaLabel`, `acceptButtonStyleClass`, `acceptIcon`, `acceptLabel`, `acceptVisible`, `appendTo`, `autoZIndex`, `baseZIndex`, `blockScroll`, `breakpoints`, `closable`, `closeAriaLabel`, `closeOnEscape`, `defaultFocus`, `dismissableMask`, `draggable`, `focusTrap`, `header`, `icon`, `key`, `maskMotionOptions`, `maskStyleClass`, `message`, `modal`, `motionOptions`, `position`, `rejectAriaLabel`, `rejectButtonStyleClass`, `rejectIcon`, `rejectLabel`, `rejectVisible`, `rtl`, `style`, `styleClass`, `visible`

### `sc-bulk-edit-menu` · 3 usos · primeng/button

**33 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-delete-entity-dialog` · 9 usos · primeng/button

**33 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-sticky-form-header` · 3 usos · primeng/button

**33 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-impact-preview-dialog` · 3 usos · primeng/button

**32 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-dialog` · 10 usos · primeng/dialog

**29 props nativas no expuestas**: `appendTo`, `autoZIndex`, `baseZIndex`, `blockScroll`, `breakpoints`, `closeButtonProps`, `closeIcon`, `closeOnEscape`, `closeTabindex`, `contentStyle`, `contentStyleClass`, `focusOnShow`, `focusTrap`, `header`, `keepInViewport`, `maskMotionOptions`, `maskStyle`, `maskStyleClass`, `maximizable`, `maximizeButtonProps`, `maximizeIcon`, `minX`, `minY`, `minimizeIcon`, `motionOptions`, `rtl`, `showHeader`, `style`, `styleClass`

### `sc-password` · 1 usos · primeng/password

**25 props nativas no expuestas**: `appendTo`, `ariaLabelledBy`, `autofocus`, `inputSize`, `inputStyle`, `inputStyleClass`, `max`, `mediumLabel`, `mediumRegex`, `min`, `minlength`, `motionOptions`, `overlayOptions`, `pPasswordPT`, `pPasswordUnstyled`, `pattern`, `promptLabel`, `showClear`, `showPassword`, `step`, `strongLabel`, `strongRegex`, `tabindex`, `variant`, `weakLabel`

### `sc-button` · 123 usos · primeng/button

**24 props nativas no expuestas**: `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `fluid`, `hostName`, `iconOnly`, `iconPos`, `link`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `severity`, `style`, `styleClass`, `tabindex`, `text`

### `sc-column-selector` · 1 usos · primeng/popover

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `baseZIndex`, `dismissable`, `focusOnShow`, `motionOptions`, `style`, `styleClass`

### `sc-drawer` · 1 usos · primeng/drawer

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `autoZIndex`, `baseZIndex`, `blockScroll`, `closable`, `closeButtonProps`, `maskStyle`, `motionOptions`, `style`, `styleClass`

### `sc-group-popover` · 3 usos · primeng/popover

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `baseZIndex`, `dismissable`, `focusOnShow`, `motionOptions`, `style`, `styleClass`

### `sc-radiobutton` · 2 usos · primeng/radiobutton

**7 props nativas no expuestas**: `ariaLabelledBy`, `autofocus`, `binary`, `disabled`, `invalid`, `required`, `tabindex`

### `sc-search` · 8 usos · primeng/iconfield, primeng/inputicon, primeng/inputtext

**7 props nativas no expuestas**: `fluid`, `iconPosition`, `invalid`, `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-selectbutton` · 4 usos · primeng/selectbutton

**7 props nativas no expuestas**: `autofocus`, `dataKey`, `name`, `required`, `styleClass`, `tabindex`, `unselectable`

### `sc-toggleswitch` · 22 usos · primeng/toggleswitch

**7 props nativas no expuestas**: `autofocus`, `falseValue`, `invalid`, `name`, `required`, `tabindex`, `trueValue`

### `sc-inputnumber` · 11 usos · primeng/inputtext

**5 props nativas no expuestas**: `fluid`, `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-badge` · 6 usos · primeng/badge

**4 props nativas no expuestas**: `badgeDisabled`, `badgeSize`, `severity`, `value`

### `sc-inputtext` · 29 usos · primeng/inputtext

**4 props nativas no expuestas**: `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-panel` · 1 usos · primeng/panel

**4 props nativas no expuestas**: `iconPos`, `motionOptions`, `toggleButtonProps`, `toggler`

### `sc-message` · 3 usos · primeng/message

**3 props nativas no expuestas**: `closeIcon`, `life`, `motionOptions`

### `sc-textarea` · 5 usos · primeng/textarea

**3 props nativas no expuestas**: `pSize`, `pTextareaPT`, `pTextareaUnstyled`

### `sc-breadcrumb` · 1 usos · primeng/breadcrumb

**2 props nativas no expuestas**: `style`, `styleClass`

### `sc-chip` · 5 usos · primeng/chip

**2 props nativas no expuestas**: `chipProps`, `removeIcon`

### `sc-bulk-action-bar` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-checkbox` · 28 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-color-dot-picker` · 3 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-command-palette` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-divider` · 25 usos · primeng/divider

Expone todo lo que PrimeNG documenta.

### `sc-empty-state` · 14 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-form-section-nav` · 6 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-gauge` · 1 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-inline-rename-cell` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-inputgroup` · 1 usos · primeng/inputgroup

Expone todo lo que PrimeNG documenta.

### `sc-keyboard-shortcuts` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-option-cards` · 1 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-permission-matrix` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-photo-upload` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-section-card` · 20 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-tag` · 23 usos · primeng/tag

Expone todo lo que PrimeNG documenta.

