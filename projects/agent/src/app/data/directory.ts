/**
 * Directorio de ejemplo para el marcador: agentes (con extensión CENTREX) y contactos de
 * agenda (con varios teléfonos). Datos inventados, solo para ver el comportamiento.
 */
export type DirState = 'green' | 'red' | 'blue';

export interface DirEntry {
  readonly id: string;
  readonly name: string;
  readonly kind: 'agent' | 'contact';
  /** Extensión del agente, o teléfonos de la agenda. */
  readonly numbers: readonly string[];
  readonly state?: DirState;
}

export const DIRECTORY: readonly DirEntry[] = [
  { id: 'a1', name: 'Ana García', kind: 'agent', numbers: ['123'], state: 'green' },
  { id: 'a2', name: 'Carlos Martín', kind: 'agent', numbers: ['230'], state: 'red' },
  { id: 'a3', name: 'Marta Ruiz', kind: 'agent', numbers: ['231'], state: 'blue' },
  { id: 'a4', name: 'Daniel López', kind: 'agent', numbers: ['234'], state: 'green' },
  { id: 'a5', name: 'Lucía Fernández', kind: 'agent', numbers: ['315'], state: 'red' },
  { id: 'a6', name: 'Javier Soler', kind: 'agent', numbers: ['410'], state: 'blue' },
  // Extensión de 4 cifras que choca con un número corto del registro (1440).
  { id: 'a7', name: 'Pablo Gil', kind: 'agent', numbers: ['1440'], state: 'green' },
  { id: 'c1', name: 'Ana Beltrán', kind: 'contact', numbers: ['623456789', '915550123'] },
  { id: 'c2', name: 'Recepción Madrid', kind: 'contact', numbers: ['912340000'] },
  { id: 'c3', name: 'Soporte técnico', kind: 'contact', numbers: ['900123234', '9234'] },
  { id: 'c4', name: 'Administración', kind: 'contact', numbers: ['934520520'] },
];

const norm = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Coincidencias por nombre o por cualquier número. */
export function searchDirectory(query: string): DirEntry[] {
  const q = norm(query.trim());
  if (!q) return [];
  return DIRECTORY.filter(
    (e) => norm(e.name).includes(q) || e.numbers.some((n) => n.includes(q))
  );
}

/**
 * Al cursar la llamada: si el marcado es EXACTAMENTE la extensión de un agente, va al
 * agente (interna); si coincide con un teléfono de la agenda, se rotula con su nombre;
 * cualquier otra marcación sale al exterior.
 */
export function resolveDialed(
  dialed: string
): { entry: DirEntry | null; internal: boolean } {
  const d = dialed.replace(/[\s()-]/g, '');
  if (reservedKind(d)) return { entry: null, internal: false };
  const agent = DIRECTORY.find((e) => e.kind === 'agent' && e.numbers.includes(d));
  if (agent) return { entry: agent, internal: true };
  const contact = DIRECTORY.find((e) => e.kind === 'contact' && e.numbers.includes(d));
  return { entry: contact ?? null, internal: false };
}

/** Emergencias y servicios cortos: siempre salen al exterior. */
const EMERGENCY = ['112', '091', '061', '062', '080', '085'];

/** Números cortos de 4 cifras del registro (numeros_cortos_actualizados.xlsx). */
const SHORT_NUMBERS = new Set([
  '1002', '1004', '1015', '1050', '1053', '1055', '1071', '1073', '1400', '1401', '1402', '1403', '1405', '1407', '1408', '1409', '1410', '1411', '1412', '1413', '1414', '1416', '1417', '1420', '1424', '1425', '1433', '1440', '1441', '1442', '1443', '1444', '1445', '1446', '1449', '1450', '1451', '1456', '1470', '1471', '1472', '1473', '1474', '1478', '1485', '1486', '1488', '1489', '1490', '1494', '1495', '1496', '1497', '1498', '1499', '1500', '1502', '1503', '1510', '1511', '1515', '1520', '1525', '1533', '1543', '1550', '1551', '1552', '1554', '1560', '1565', '1566', '1567', '1568', '1570', '1571', '1590', '1591', '1592', '1593', '1594', '1600', '1610', '1616', '1617', '1622', '1636', '1644', '1645', '1650', '1661', '1678', '1699', '1700', '1702', '1703', '1704', '1705', '1706', '1707', '1708', '1709', '1710', '1711', '1713', '1717', '1726', '1727', '1730', '1740', '1744', '1750', '1770', '1771', '1774', '1777', '1780', '1785', '1789', '1790',
]);

export type Reserved = 'emergency' | 'short' | null;

export function reservedKind(dialed: string): Reserved {
  const d = dialed.replace(/[\s()-]/g, '');
  if (EMERGENCY.includes(d)) return 'emergency';
  return SHORT_NUMBERS.has(d) ? 'short' : null;
}

/** Trozos de `text` con las coincidencias de `query` marcadas (sin acentos ni mayúsculas). */
export function highlight(text: string, query: string): { t: string; b: boolean }[] {
  const q = norm(query.trim());
  if (!q) return [{ t: text, b: false }];
  const src = norm(text);
  const out: { t: string; b: boolean }[] = [];
  let from = 0;
  let i: number;
  while ((i = src.indexOf(q, from)) !== -1) {
    if (i > from) out.push({ t: text.slice(from, i), b: false });
    out.push({ t: text.slice(i, i + q.length), b: true });
    from = i + q.length;
  }
  if (from < text.length) out.push({ t: text.slice(from), b: false });
  return out;
}

/** El número que casó con la búsqueda (o el primero), para enseñarlo y marcarlo. */
export function matchedNumber(e: DirEntry, query: string): string {
  const q = query.trim();
  return e.numbers.find((n) => n.includes(q)) ?? e.numbers[0];
}
