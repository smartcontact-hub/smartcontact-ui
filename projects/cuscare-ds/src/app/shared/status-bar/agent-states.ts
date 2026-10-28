/** Cómo se pinta el punto de un estado y qué color toma la píldora del pie. */
export type AgentStateTone = 'ok' | 'busy' | 'admin';

export interface AgentState {
  key: string;
  label: string;
  tone: AgentStateTone;
}

/** Los estados que ofrece CusCare. «Administrativo» pide además un grupo, por eso va aparte de los simples. */
export const SIMPLE_STATES: readonly AgentState[] = [
  { key: 'available', label: 'Available', tone: 'ok' },
  { key: 'unavailable', label: 'Unavailable', tone: 'busy' },
  { key: 'pause-autres', label: 'Pause Autres', tone: 'busy' },
  { key: 'pause-formation', label: 'Pause Formation', tone: 'busy' },
  { key: 'pause-meeting', label: 'Pause Meeting', tone: 'busy' },
  { key: 'pause-lunch', label: 'Pause Out for Lunch', tone: 'busy' },
  { key: 'pause-wc', label: 'Pause WC', tone: 'busy' },
];

export const ADMIN_STATE: AgentState = { key: 'admin', label: 'Administrativo', tone: 'admin' };

/** Grupos de ejemplo del estado «Administrativo» (datos inventados). */
export const ADMIN_GROUPS: readonly string[] = [
  'DV_Content_FR (G1)',
  'MENAT - Egypt',
  'Afrique - Congo',
  'Afrique-French (G2)',
  'Facture Bouygues',
  'LATAM - Mexico',
  'ES - DOD',
];
