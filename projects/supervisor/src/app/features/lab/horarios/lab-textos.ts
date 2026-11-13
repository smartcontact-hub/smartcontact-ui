/**
 * Los textos accesibles del laboratorio de Horarios, en un sitio. El laboratorio va solo en español a propósito: si una
 * pieza pasa a la pantalla real, sus textos pasan a los cuatro locales con ella.
 */
export const T = {
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  vista: 'Vista del calendario',
  anio: 'Año',
  calendario: 'Calendario',
  elegirSemana: (n: number): string => `Elegir la semana ${n}`,
  editarDatos: 'Editar nombre, zona y descripción',
  ejemploNombre: 'Ej.: Atención al cliente',
  opcional: 'Opcional',
  horaPrueba: 'Hora a comprobar',
  soltar: 'Quitar la selección (Esc)',
  filtrar: 'Filtrar',
  quitar: (nombre: string): string => `Quitar ${nombre}`,
  datos: 'Datos del horario',
  festivos: 'Añadir festivos',
  destino: 'Dónde guardarlos',
  diasDelTramo: (i: number): string => `Días del tramo ${i + 1}`,
  quitarTramo: (i: number): string => `Quitar tramo ${i + 1}`,
} as const;
