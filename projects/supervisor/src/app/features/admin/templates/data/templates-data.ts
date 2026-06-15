export type TemplateType = 'chat' | 'email';

export interface Template {
  readonly id: number;
  readonly title: string;
  readonly type: TemplateType;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const TEMPLATE_TYPES: readonly TemplateType[] = ['chat', 'email'];

export const TEMPLATES_SEED: readonly Template[] = [
  {
    id: 1,
    title: 'Saludo inicial',
    type: 'chat',
    body: 'Hola, soy {agente}. ¿En qué puedo ayudarle?',
    createdAt: '2025-11-02',
    updatedAt: '2025-11-02',
  },
  {
    id: 2,
    title: 'Solicitud de datos',
    type: 'chat',
    body: 'Para poder ayudarle necesito que me facilite su número de referencia.',
    createdAt: '2025-11-03',
    updatedAt: '2025-12-10',
  },
  {
    id: 3,
    title: 'Despedida chat',
    type: 'chat',
    body: 'Gracias por contactar con nosotros. ¿Puedo ayudarle en algo más?',
    createdAt: '2025-11-03',
    updatedAt: '2025-11-03',
  },
  {
    id: 4,
    title: 'Transferencia informada',
    type: 'chat',
    body: 'Le voy a transferir con un especialista que podrá atenderle mejor.',
    createdAt: '2025-11-05',
    updatedAt: '2025-11-05',
  },
  {
    id: 5,
    title: 'Espera en cola',
    type: 'chat',
    body: 'Le pido disculpas por la espera. En breve le atenderemos.',
    createdAt: '2025-11-10',
    updatedAt: '2026-01-15',
  },
  {
    id: 6,
    title: 'Confirmación de pedido',
    type: 'email',
    body: 'Estimado/a {cliente}, le confirmamos que su pedido #{ref} ha sido procesado correctamente.',
    createdAt: '2025-11-12',
    updatedAt: '2025-11-12',
  },
  {
    id: 7,
    title: 'Respuesta a reclamación',
    type: 'email',
    body: 'Estimado/a {cliente}, hemos recibido su reclamación y la estamos revisando.',
    createdAt: '2025-11-14',
    updatedAt: '2026-02-01',
  },
  {
    id: 8,
    title: 'Seguimiento de incidencia',
    type: 'email',
    body: 'Le informamos de que su incidencia #{ref} ha sido actualizada.',
    createdAt: '2025-11-18',
    updatedAt: '2025-11-18',
  },
  {
    id: 9,
    title: 'Encuesta de satisfacción',
    type: 'email',
    body: 'Nos gustaría conocer su opinión sobre la atención recibida.',
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: 10,
    title: 'Cierre de caso',
    type: 'email',
    body: 'Le comunicamos que su caso #{ref} ha sido resuelto satisfactoriamente.',
    createdAt: '2025-12-05',
    updatedAt: '2025-12-05',
  },
  {
    id: 11,
    title: 'Fuera de horario',
    type: 'chat',
    body: 'Nuestro horario de atención es de L-V 9:00 a 18:00. Le atenderemos lo antes posible.',
    createdAt: '2025-12-10',
    updatedAt: '2025-12-10',
  },
  {
    id: 12,
    title: 'Promoción activa',
    type: 'email',
    body: 'Estimado/a {cliente}, le informamos de nuestra nueva promoción vigente hasta {fecha}.',
    createdAt: '2026-01-08',
    updatedAt: '2026-01-08',
  },
];
