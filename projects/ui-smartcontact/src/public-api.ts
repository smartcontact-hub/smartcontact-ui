/*
 * Public API Surface of @smartcontact/components
 *
 * Mitad A (fundaciones): preset + frontera de setup. Los wrappers `sc-*`
 * llegan en el port incremental (Mitad B) — ver docs/component-port-plan.md.
 */
export * from './lib/core/types/button.types';
export * from './lib/core/types/badge.types';
export * from './lib/core/types/theme-component.types';
export * from './lib/components/button/sc-button.component';
export * from './lib/components/badge/sc-badge.component';
export * from './lib/components/card/sc-card.component';
export * from './lib/components/chip/sc-chip.component';
export * from './lib/components/tag/sc-tag.component';
export * from './lib/components/message/sc-message.component';
export * from './lib/components/panel/sc-panel.component';
export * from './lib/components/skeleton/sc-skeleton.component';
export * from './lib/components/textarea/sc-textarea.component';
export * from './lib/components/drawer/sc-drawer.component';
export * from './lib/components/progressbar/sc-progressbar.component';
export * from './lib/components/progressspinner/sc-progressspinner.component';
export * from './lib/components/radiobutton/sc-radiobutton.component';
export * from './lib/components/avatar/sc-avatar.component';
export * from './lib/components/avatar/sc-avatargroup.component';
export * from './lib/components/toast/sc-toast.component';
export * from './lib/components/toast/sc-toast.service';
export * from './lib/components/divider/sc-divider.component';
export * from './lib/components/inputgroup/sc-inputgroup.component';
export * from './lib/components/search/sc-search.component';
export * from './lib/components/datepicker/sc-datepicker.component';
export * from './lib/components/inputnumber/sc-inputnumber.component';
export * from './lib/components/multiselect/sc-multiselect.component';
export * from './lib/components/group-popover/sc-group-popover.component';
export * from './lib/components/column-selector/sc-column-selector.component';
export * from './lib/components/confirmdialog/sc-confirmdialog.component';
export * from './lib/components/confirmdialog/sc-confirm.service';
export * from './lib/components/inputtext/sc-inputtext.component';
export * from './lib/components/select/sc-select.component';
export * from './lib/components/toggleswitch/sc-toggleswitch.component';
export * from './lib/components/dialog/sc-dialog.component';
export * from './lib/components/dynamic-dialog/sc-dynamic-dialog.service';
export * from './lib/components/checkbox/sc-checkbox.component';
export * from './lib/components/empty-state/sc-empty-state.component';
export * from './lib/components/page-header/sc-page-header.component';
export * from './lib/components/form-section-nav/sc-form-section-nav.component';
export * from './lib/components/bulk-edit-menu/sc-bulk-edit-menu.component';
export * from './lib/components/bulk-action-bar/sc-bulk-action-bar.component';
export * from './lib/components/bulk-action-bar/use-bulk-entity-i18n';
export * from './lib/components/form-danger-zone/sc-form-danger-zone.component';
export * from './lib/components/sticky-form-header/sc-sticky-form-header.component';
export * from './lib/config/provide-smartcontact-ui';
export { default as scPreset } from './lib/theme/sc-preset';
