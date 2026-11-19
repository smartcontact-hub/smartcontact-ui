/** Tipos de las pruebas con usuarios (la lógica vive en `prueba.core.mjs`). */
export interface Version {
  readonly id: string;
  readonly nombre: string;
  readonly url: string;
}
export interface Tarea {
  readonly id: string;
  readonly titulo: string;
  /** Una misión por versión: el mismo trabajo con otros datos. */
  readonly gemelas: readonly string[];
  readonly nota?: string;
}
export interface PlanMinimo {
  readonly id: string;
  readonly versiones: readonly Version[];
  readonly tareas: readonly Tarea[];
  /** Con una sola versión: lo que cada tarea tiene que salir bien y sin ayuda para cumplir (0 a 1; si no, `META`). */
  readonly meta?: number;
}
export interface Paso {
  version: string;
  url: string;
  mision: string;
  titulo: string;
  enunciado: string;
  nota?: string;
}
export interface Comprobacion {
  readonly bien: number;
  readonly total: number;
  readonly titular?: string;
}
export interface PasoResultado {
  version: string;
  mision: string;
  ms: number;
  clics: number;
  primerClic: string | null;
  enVacio: readonly string[];
  pantallas: readonly string[];
  ayudas: readonly { readonly ms: number; readonly pantalla: string }[];
  comprobacion: Comprobacion | null;
  moderador: 'si' | 'medias' | 'no' | null;
  facilidad: number | null;
}
export interface Resultado {
  v: 1;
  prueba: string;
  participante: string;
  orden: readonly string[];
  pasos: readonly PasoResultado[];
  preferencia?: { readonly version: string | null; readonly porque: string };
  /** El nombre que escribió la persona en la puerta, si quiso. */
  nombre?: string;
}
export interface Sesion {
  v: 1;
  prueba: string;
  participante: string;
  orden: string[];
  pasos: Paso[];
  paso: number;
  resultados: PasoResultado[];
  fin: string;
}
export type Criterio = 'exito' | 'facilidad' | 'tiempo' | 'preferencia';
export interface ResumenVersion {
  id: string;
  nombre: string;
  intentos: number;
  limpias: number;
  bien: number;
  ayudas: number;
  facilidad: number | null;
  segundos: number | null;
  preferida: number;
}
/** Con una sola versión: cómo le va a cada tarea frente a la meta. */
export interface CumplimientoTarea {
  id: string;
  titulo: string;
  intentos: number;
  limpias: number;
  cumple: boolean;
}
export interface Veredicto {
  personas: number;
  resumen: ResumenVersion[];
  ganadora: string | null;
  motivo: Criterio | null;
  frase: string;
  /** Solo con una versión: la meta y cada tarea frente a ella. */
  meta?: number;
  tareas?: CumplimientoTarea[];
}

export const CODIGO_RESULTADO: string;
export const UMBRAL: number;
export const FACTOR_TIEMPO: number;
export const META: number;
export function codificar(valor: unknown): string;
export function decodificar(texto: string): unknown;
export function numeroDe(participante: string): number;
export function ordenDeVersiones(plan: PlanMinimo, participante: string): string[];
export function pasosDe(plan: PlanMinimo, participante: string): Paso[];
export function sesionDe(plan: PlanMinimo, participante: string, fin: string): Sesion;
export function enlaceDelPrimerPaso(sesion: Sesion): string;
export const NOMBRE_MAX: number;
export function limpiarNombre(nombre: unknown): string;
export function claveDelNombre(prueba: string, participante: string): string;
export function quienEs(r: Pick<Resultado, 'participante' | 'nombre'>): string;
export function codigoDeResultado(resultado: Resultado): string;
export function leerResultados(texto: string): Resultado[];
export function pSignos(a: number, b: number): number;
export function exito(p: PasoResultado): boolean | null;
export function limpio(p: PasoResultado): boolean | null;
export function veredicto(plan: PlanMinimo, resultados: readonly Resultado[]): Veredicto;

/** El informe tras la prueba (DD-256 §8): métricas con su sigla y accionables. */
export const ENSAYO: string;
export const REFERENCIAS: { readonly tsr: number; readonly seq: number; readonly lostness: number };
export type Gravedad = 'alta' | 'media' | 'baja';
export interface MetricasVersion {
  id: string;
  nombre: string;
  n: number;
  tsr: { exitos: number; pct: number; ic: [number, number] } | null;
  tot: number | null;
  seq: number | null;
  fcs: { bueno: string; aciertos: number; pct: number } | null;
  lostness: number | null;
  ayuda: number | null;
  enVacio: number;
  preferida: number;
}
export interface Hallazgo {
  regla: string;
  gravedad: Gravedad;
  version: string;
  nombre: string;
  tarea: string | null;
  sigla: string;
  titulo: string;
  evidencia: string;
  accion: string;
}
export interface Informe {
  personas: number;
  conEnsayo: boolean;
  tareas: { id: string; titulo: string; versiones: MetricasVersion[] }[];
  hallazgos: Hallazgo[];
  nombre(id: string): string;
}
export function informe(plan: PlanMinimo, resultados: readonly Resultado[]): Informe;
export function csvDeResultados(plan: PlanMinimo, resultados: readonly Resultado[]): string;
export function informeEnTexto(
  plan: PlanMinimo & { readonly titulo?: string; readonly pregunta?: string },
  inf: Informe,
  v: Veredicto,
): string;
