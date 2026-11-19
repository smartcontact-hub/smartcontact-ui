/**
 * PRUEBAS CON USUARIOS · una entrada por prueba (DD-256).
 *
 * Una prueba compara versiones con personas reales: cada versión es un enlace (otra rama, otra pantalla o la misma con
 * otro parámetro) y cada tarea lleva una misión GEMELA por versión, el mismo trabajo con otros datos, para que nadie
 * repita la misma misión en la segunda versión. El Lab genera el enlace de cada persona (`/#/prueba/<id>/P3`), y la
 * versión lo recibe con su modo prueba de serie: el del Supervisor llega con `main` a toda rama nueva.
 *
 * La regla de decisión es la misma para todas y está en `prueba.core.mjs`: gana quien más veces se resuelve bien y sin
 * ayuda; si empatan, la facilidad; luego el tiempo (solo con un 50 % de diferencia); al final, la preferencia. Con 5 a
 * 10 personas, una diferencia solo cuenta si casi todas apuntan al mismo lado.
 *
 * Privacidad (el repo es público): las personas son P1, P2…; sus nombres nunca entran aquí. Los casos reales van
 * anonimizados. En `resultado` solo va el resumen: los códigos que manda cada persona se quedan fuera del repo.
 */
import type { PlanMinimo } from './prueba.core.mjs';

export type EstadoPrueba = 'preparada' | 'en-curso' | 'decidida';

export interface PlanDePrueba extends PlanMinimo {
  /** Lo que se decide, en una pregunta. */
  readonly pregunta: string;
  /** Nombre corto para la tarjeta del Lab. */
  readonly titulo: string;
  /** Cuántas personas: los enlaces que se preparan (P1 a Pn). */
  readonly personas: number;
  /** Lo que dura más o menos, para decírselo al empezar. */
  readonly minutos: number;
  readonly estado: EstadoPrueba;
  /**
   * Qué comprueba la rama sola al pulsar «He terminado», en llano. Sin él, quien modera marca si salió bien. Lo que hay
   * que poner en la rama para que corrija lo cuenta la skill `probar-prototipos`.
   */
  readonly correccion?: string;
  /** Cuando está decidida: el veredicto y la decisión que se tomó. */
  readonly resultado?: { readonly fecha: string; readonly resumen: string };
}

export const ESTADO_PRUEBA: Record<EstadoPrueba, string> = {
  preparada: 'Preparada',
  'en-curso': 'En curso',
  decidida: 'Decidida',
};

const DISCOVERY = 'https://claude-discovery-horarios.sc-supervisor.pages.dev/admin/repositorios';

export const PRUEBAS: readonly PlanDePrueba[] = [
  {
    id: 'horarios',
    titulo: 'Horarios: separado o junto',
    pregunta:
      '¿Con qué versión da de alta posventa un festivo sin ayuda: calendario y horario separados (A) o juntos en una misma pantalla (B)?',
    versiones: [
      { id: 'A', nombre: 'Separado', url: `${DISCOVERY}?variante=A` },
      { id: 'B', nombre: 'Junto', url: `${DISCOVERY}?variante=B` },
    ],
    tareas: [
      {
        id: 'festivo',
        titulo: 'Dar de alta un festivo',
        gemelas: [
          'Cada 28 de enero, Santo Tomás de Aquino, no se atiende en todo el día ni en Oficinas Barcelona ni en Secretaría Barcelona. Dalo de alta para que valga todos los años.',
          'Cada 7 de octubre, fiesta de la empresa, no se atiende en todo el día ni en Atención Madrid ni en Soporte Sevilla. Dalo de alta para que valga todos los años.',
        ],
      },
    ],
    personas: 6,
    minutos: 15,
    estado: 'preparada',
    correccion: 'Comprueba que el festivo está en los dos calendarios que pide la misión, todo el día y cada año.',
  },
];

export const pruebaPorId = (id: string | null | undefined): PlanDePrueba | undefined => PRUEBAS.find((p) => p.id === id);
