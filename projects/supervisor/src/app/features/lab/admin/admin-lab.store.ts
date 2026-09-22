import { Injectable, signal } from '@angular/core';

import { GROUP_BY_ID, LAB_GROUPS, LAB_PEOPLE, type LabGroup, type LabPerson } from './admin-lab.model';

/**
 * Estado del laboratorio, en memoria y para toda la sesión.
 *
 * Existe por lo mismo que existe un repositorio en el resto del Supervisor: la lista y el
 * formulario tienen que hablarse. Crear un grupo desde el CTA de la lista y volver a ella
 * sin verlo sería un laboratorio que no deja probar el recorrido, que es lo único que se
 * viene a probar aquí.
 *
 * No persiste: al recargar vuelve a la semilla. Es a propósito — se enseña para decidir,
 * no para guardar trabajo.
 */
@Injectable({ providedIn: 'root' })
export class AdminLabStore {
  readonly groups = signal<readonly LabGroup[]>(LAB_GROUPS);
  readonly people = signal<readonly LabPerson[]>(LAB_PEOPLE);

  /**
   * «Reproducir el fallo de hoy». Vive aquí y no en cada pantalla porque lo enciende el
   * panel de opciones del laboratorio, que es un mueble aparte (mismo patrón que el
   * laboratorio del Sidebar, cuyos controles viven en un popover para no ocupar la página).
   *
   * Encendido, las dos reglas nuevas se apagan: el tipo de usuario vuelve a ser una etiqueta
   * que no toca ninguna casilla (grieta 1) y apagar una madre deja vivo el valor de sus
   * hijas (grieta 2).
   */
  readonly modoHoy = signal(false);

  group(id: string): LabGroup | undefined {
    return this.groups().find((g) => g.id === id) ?? GROUP_BY_ID.get(id);
  }

  person(id: string): LabPerson | undefined {
    return this.people().find((p) => p.id === id);
  }

  addGroup(group: LabGroup): void {
    this.groups.update((list) => [group, ...list]);
  }

  updateGroup(id: string, patch: Partial<LabGroup>): void {
    this.groups.update((list) => list.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  removeGroup(id: string): void {
    this.groups.update((list) => list.filter((g) => g.id !== id));
  }

  addPerson(person: LabPerson): void {
    this.people.update((list) => [person, ...list]);
  }

  updatePerson(id: string, patch: Partial<LabPerson>): void {
    this.people.update((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  removePerson(id: string): void {
    this.people.update((list) => list.filter((p) => p.id !== id));
  }
}
