import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TICKETS_ALL, TicketRow } from '../../data/seed';

/**
 * "Search" del nav → ruta `#/private/cuscare/**customer**` (comprobado
 * navegando; el rótulo y la ruta no coinciden).
 *
 * Estructura MEDIDA en la app real: fila centrada con dos `mat-select` de
 * 238×35 ("Select country" y "Msisdn"), un input `form-control` de 198×27 y un
 * botón de 36×27 — y debajo la ilustración. Ojo: aquí los desplegables son de
 * **Angular Material**, no PrimeNG como los filtros de Tickets. Esta app mezcla
 * las dos librerías según la pantalla.
 *
 * Busca DE VERDAD contra el seed. Los resultados se muestran en una tabla que
 * reutiliza el chrome de Tickets; el estado vacío es explícito, no una pantalla
 * muda (que es justo lo que fallaba antes: se pulsaba y no pasaba nada).
 */
@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent {
  /** Países presentes en los datos (no una lista inventada aparte). */
  protected readonly countries = ['Spain', 'Slovakia'];

  /** Criterios de búsqueda; "Msisdn" es el que trae por defecto la real. */
  protected readonly criteria = ['Msisdn', 'Email', 'Ticket ID'] as const;

  protected readonly country = signal<string>('');
  protected readonly criterion = signal<(typeof this.criteria)[number]>('Msisdn');
  protected readonly term = signal('');

  /** null = aún no se ha buscado (pantalla inicial con la ilustración). */
  protected readonly results = signal<TicketRow[] | null>(null);
  protected readonly searching = signal(false);

  protected readonly hasTerm = computed(() => this.term().trim().length > 0);

  protected search(): void {
    const term = this.term().trim().toLowerCase();
    if (!term) return;

    // Mismo gesto que en Tickets: el original no responde al instante.
    this.searching.set(true);
    setTimeout(() => {
      const country = this.country();
      const crit = this.criterion();
      const found = TICKETS_ALL.filter((t) => {
        if (country && t.country !== country) return false;
        switch (crit) {
          case 'Email':
            return t.email.toLowerCase().includes(term);
          case 'Ticket ID':
            return t.id.includes(term);
          default:
            return t.source.includes(term);
        }
      });
      this.results.set(found);
      this.searching.set(false);
    }, 380);
  }

  protected reset(): void {
    this.term.set('');
    this.results.set(null);
  }
}
