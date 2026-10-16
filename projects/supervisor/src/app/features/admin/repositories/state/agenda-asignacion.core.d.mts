export interface Asignacion {
  readonly grupos: readonly number[];
  readonly agentes: readonly number[];
}
export interface GrupoDeArbol {
  readonly id: number;
  readonly miembros: readonly number[];
}
export interface Estructura {
  readonly grupos: readonly GrupoDeArbol[];
  readonly sinGrupo: readonly number[];
}
export interface EstadoDeCasilla {
  readonly checked: boolean;
  readonly partialChecked: boolean;
}
export interface Intencion {
  readonly tipo: 'agente' | 'grupo' | 'sinGrupo';
  readonly id: number;
  readonly marcar: boolean;
}

export function claveGrupo(g: number): string;
export function claveAgente(g: number, a: number): string;
export const CLAVE_SIN_GRUPO: string;
export function claveSinGrupo(a: number): string;
export function gruposConMiembros<G extends { readonly id: number }>(
  grupos: readonly G[],
  vinculos: readonly { readonly groupId: number; readonly agentId: number }[],
): (G & { readonly miembros: readonly number[] })[];
export function estructuraDe(grupos: readonly GrupoDeArbol[], agentes: readonly number[]): Estructura;
export function normalizar(asig: Asignacion, estructura: Estructura): Asignacion;
export function aplicar(asig: Asignacion, estructura: Estructura, intencion: Intencion): Asignacion;
export function claves(asig: Asignacion, estructura: Estructura): Record<string, EstadoDeCasilla>;
export function deLoGuardado(
  gruposConAgenda: readonly number[],
  agentesConAgenda: readonly number[],
  estructura: Estructura,
): Asignacion;
export function paraGuardar(
  asig: Asignacion,
  estructura: Estructura,
): { readonly grupos: readonly number[]; readonly agentesSueltos: readonly number[] };
