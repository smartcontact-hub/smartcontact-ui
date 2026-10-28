import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import {
  ScAvatarComponent,
  ScButtonComponent,
  ScSearchComponent,
  ScTabsComponent,
  type ScTab,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import type { AgentStateTone } from './agent-states';

type SoftphoneView = 'history' | 'dialer' | 'agents' | 'settings';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

const NAV: readonly { view: SoftphoneView; icon: string; label: string }[] = [
  { view: 'dialer', icon: 'call', label: 'Dialer' },
  { view: 'agents', icon: 'person', label: 'Agents' },
  { view: 'history', icon: 'history', label: 'History' },
];

/** Datos de ejemplo del panel (inventados). */
const AGENTS = ['Sadiyah Hossenbaccas', 'Kenny Anthony', 'Rofida Hany Gaber', 'Jovana Ashraf', 'Alvinio Aleemuth', 'Marek Horvat'];
const GROUPS = ['DV_Content_FR (G1)', 'MENAT - Egypt', 'Afrique - Congo', 'Afrique-French (G2)', 'Facture Bouygues'];

/**
 * El comunicador de CusCare: un panel flotante con forma de móvil, sin modal y arrastrable por su franja superior.
 * CUANDO: pantallas privadas de CusCare, abierto desde el avatar del pie. Maqueta: no marca ni recibe llamadas; las listas son de ejemplo.
 *
 * Sobre `p-dialog` (sin modal, `draggable`): la franja superior es su cabecera, que es lo que PrimeNG usa para arrastrar;
 * el cuerpo cambia de vista y el pie es la barra de iconos. La barra del pie toma el tono del estado del agente.
 */
@Component({
  selector: 'app-softphone',
  imports: [
    DialogModule,
    ScAvatarComponent,
    ScButtonComponent,
    ScIconComponent,
    ScSearchComponent,
    ScTabsComponent,
  ],
  templateUrl: './softphone.component.html',
  styleUrl: './softphone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoftphoneComponent {
  readonly visible = model(false);
  /** El tono del estado del agente: la barra de iconos del pie lo lleva. */
  readonly tone = input<AgentStateTone>('busy');

  /** El diálogo sin marco propio: la silueta de móvil la dibujan la franja, el cuerpo y la barra de iconos. */
  protected readonly dialogTokens = {
    root: {
      background: 'var(--sc-bg-canvas)',
      borderColor: 'transparent',
      color: 'var(--sc-text-primary)',
      borderRadius: 'var(--sc-spacing-1-75)',
      shadow: 'var(--sc-shadow-popover)',
    },
    header: { padding: '0', gap: '0' },
    content: { padding: '0' },
    footer: { padding: '0', gap: '0' },
  };

  /** El hueco hasta el borde y el pie de la app, en la máscara: es lo único que no se pierde al arrastrar. */
  protected readonly maskStyle = {
    'padding-inline-end': 'var(--sc-spacing-1-5)',
    'padding-block-end': 'calc(var(--sc-spacing-2-75) + var(--sc-spacing-0-125))',
  };

  protected readonly nav = NAV;
  protected readonly keys = KEYS;
  protected readonly view = signal<SoftphoneView>('history');
  protected readonly dialed = signal('');
  protected readonly contactsTab = signal<string | number | undefined>('agents');
  protected readonly settingsTab = signal<string | number | undefined>('profile');
  protected readonly contactsSearch = signal('');
  protected readonly groupsSearch = signal('');

  protected readonly contactsTabs: readonly ScTab[] = [
    { value: 'agents', label: 'Agents' },
    { value: 'groups', label: 'Groups' },
  ];
  protected readonly settingsTabs: readonly ScTab[] = [
    { value: 'profile', label: 'Profile' },
    { value: 'preferences', label: 'Preferences' },
  ];

  protected readonly title = computed(
    () => ({ history: 'History', dialer: '', agents: 'Agents', settings: 'Settings' })[this.view()],
  );

  protected readonly contacts = computed(() => {
    const q = this.contactsSearch().trim().toLowerCase();
    return (this.contactsTab() === 'groups' ? GROUPS : AGENTS).filter((n) => n.toLowerCase().includes(q));
  });

  protected readonly myGroups = computed(() => {
    const q = this.groupsSearch().trim().toLowerCase();
    return GROUPS.filter((g) => g.toLowerCase().includes(q));
  });

  protected press(key: string): void {
    this.dialed.update((v) => v + key);
  }

  protected erase(): void {
    this.dialed.update((v) => v.slice(0, -1));
  }

  protected go(view: SoftphoneView): void {
    this.view.set(view);
  }
}
