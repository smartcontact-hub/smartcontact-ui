import { DestroyRef, Directive, ElementRef, inject, input, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Emits `scClickOutside` when the user clicks outside the host element or
 * presses Escape. Mirrors the `useClickOutside` hook from the React prototype.
 *
 * Usage:
 *   <div (scClickOutside)="close()" [scClickOutsideEnabled]="open">…</div>
 */
@Directive({
  selector: '[scClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly scClickOutsideEnabled = input(true);

  readonly scClickOutside = output<void>();

  ngOnInit(): void {
    fromEvent<PointerEvent>(document, 'pointerdown')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.scClickOutsideEnabled()),
        filter((event) => {
          const target = event.target as Node | null;
          return !!target && !this.host.nativeElement.contains(target);
        }),
      )
      .subscribe(() => this.scClickOutside.emit());

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.scClickOutsideEnabled()),
        filter((event) => event.key === 'Escape'),
      )
      .subscribe(() => this.scClickOutside.emit());
  }
}
