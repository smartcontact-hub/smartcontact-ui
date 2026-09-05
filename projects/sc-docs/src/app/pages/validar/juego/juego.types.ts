import { computed, signal } from '@angular/core';

/** Los cinco casos del juego, en el orden del mapa. */
export type CasoId = 'inspector' | 'ancho' | 'idiomas' | 'puntos' | 'trucos';

/** Lo que un caso devuelve al cerrarse: cuántas misiones se acertaron de cuántas. */
export interface Resultado {
  readonly aciertos: number;
  readonly total: number;
}

/**
 * El motor común de todos los casos: una lista de misiones que se contestan UNA vez, en orden,
 * y un marcador. Vive fuera de los componentes para que los cinco casos se comporten igual sin
 * repetir la contabilidad, y para que el shell pueda leerla de la misma forma en todos.
 *
 * La regla «una sola respuesta por misión» es a propósito: si se pudiera reintentar hasta
 * acertar, la puntuación no mediría nada y la explicación de después perdería su sentido. Lo que
 * sí se puede es REPETIR el caso entero desde cero cuando termina.
 */
export class Motor {
  readonly idx = signal(0);
  private readonly resultados = signal<ReadonlyMap<number, boolean>>(new Map());

  constructor(readonly total: number) {}

  /** `undefined` mientras no se ha contestado; luego, si se acertó. */
  readonly estado = computed(() => this.resultados().get(this.idx()));
  readonly contestada = computed(() => this.estado() !== undefined);
  readonly aciertos = computed(() => [...this.resultados().values()].filter(Boolean).length);
  readonly hechas = computed(() => this.resultados().size);
  readonly terminado = computed(() => this.hechas() === this.total);
  readonly esUltima = computed(() => this.idx() === this.total - 1);

  /** Apunta la respuesta de la misión abierta. Devuelve `false` si ya estaba contestada. */
  responder(ok: boolean): boolean {
    if (this.contestada()) return false;
    this.resultados.update((m) => new Map(m).set(this.idx(), ok));
    return true;
  }

  siguiente(): void {
    if (!this.esUltima()) this.idx.update((i) => i + 1);
  }

  ir(i: number): void {
    if (i >= 0 && i < this.total) this.idx.set(i);
  }

  hecha(i: number): boolean | undefined {
    return this.resultados().get(i);
  }

  reiniciar(): void {
    this.resultados.set(new Map());
    this.idx.set(0);
  }

  resultado(): Resultado {
    return { aciertos: this.aciertos(), total: this.total };
  }
}
