export interface FestivoOficial {
  /** `AAAA-MM-DD`; en los que caen siempre el mismo día, el año es un marcador (2000). */
  readonly fecha: string;
  readonly nombre: string;
  /** Cae siempre el mismo día, sea el año que sea: se añade repitiéndose cada año. */
  readonly anual: boolean;
}

export interface CalendarioOficial {
  readonly id: string;
  readonly nombre: string;
  readonly dias: readonly FestivoOficial[];
}

export const CALENDARIOS_OFICIALES: readonly CalendarioOficial[];
