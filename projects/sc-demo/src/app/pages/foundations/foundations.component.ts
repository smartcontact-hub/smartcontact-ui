import { ChangeDetectionStrategy, Component } from '@angular/core';

interface ScaleStep {
  token: string;
  px: number;
}

interface ColorFamily {
  name: string;
  token: string;
  steps: number[];
}

/**
 * Muestra las fundaciones del DS leyendo los tokens reales (`var(--sc-*)`):
 * la rampa de escala 14-base y las familias primitivas de color. Lo que se ve
 * aquí es lo que el navegador resuelve — sin valores duplicados en la página.
 */
@Component({
  selector: 'app-foundations',
  templateUrl: './foundations.component.html',
  styleUrl: './foundations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsComponent {
  readonly scaleSteps: ScaleStep[] = [
    { token: '--sc-scale-0-25', px: 3.5 },
    { token: '--sc-scale-0-5', px: 7 },
    { token: '--sc-scale-0-75', px: 10.5 },
    { token: '--sc-scale-1', px: 14 },
    { token: '--sc-scale-1-5', px: 21 },
    { token: '--sc-scale-2', px: 28 },
    { token: '--sc-scale-3', px: 42 },
    { token: '--sc-scale-4', px: 56 },
  ];

  readonly colorFamilies: ColorFamily[] = [
    { name: 'Blue (marca)', token: 'blue', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Gray (neutros)', token: 'gray', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Electric blue (info)', token: 'electric-blue', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Green (success)', token: 'green', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Amber (warning)', token: 'amber', steps: [50, 100, 300, 500, 700, 900] },
    { name: 'Red (danger)', token: 'red', steps: [50, 100, 300, 500, 700, 900] },
  ];
}
