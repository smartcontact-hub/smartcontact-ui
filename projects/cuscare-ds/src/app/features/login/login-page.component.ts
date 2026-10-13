import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ScButtonComponent,
  ScDividerComponent,
  ScInputTextComponent,
  ScMessageComponent,
  ScPasswordComponent,
} from '@smartcontact-hub/components';

import { DEMO_ACCOUNT } from '../../data/demo-credentials';

type View = 'signin' | 'forgot' | 'sent';

/**
 * Acceso a CusCare. Dos formas de entrar, como en la herramienta actual y en el manual de Smart Contact (apartado 2.1):
 * Microsoft (cuando el administrador lo activa) o usuario y contraseña; y la recuperación de la contraseña por email.
 *
 * Es una maqueta: no hay servidor, así que solo se comprueba la cuenta de prueba (`DEMO_ACCOUNT`). Entrar lleva a Tickets.
 * Misma estructura que el acceso del Supervisor (marca a un lado y panel con el formulario al otro), con la
 * marca de CusCare y sin su ilustración.
 */
@Component({
  selector: 'app-login-page',
  imports: [ScButtonComponent, ScDividerComponent, ScInputTextComponent, ScMessageComponent, ScPasswordComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly router = inject(Router);

  protected readonly view = signal<View>('signin');
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly email = signal('');
  protected readonly submitted = signal(false);
  /** Se ha intentado entrar con una cuenta que no es la de prueba. */
  protected readonly rejected = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly usernameError = computed(() =>
    this.submitted() && this.username().trim() === '' ? 'Enter your email.' : undefined,
  );
  protected readonly passwordError = computed(() =>
    this.submitted() && this.password() === '' ? 'Enter your password.' : undefined,
  );
  protected readonly emailError = computed(() => {
    if (!this.submitted()) return undefined;
    const value = this.email().trim();
    if (value === '') return 'Enter your email.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a valid email.';
  });

  protected go(view: View): void {
    this.submitted.set(false);
    this.rejected.set(false);
    this.view.set(view);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.rejected.set(false);
    if (this.usernameError() || this.passwordError()) return;
    if (this.username().trim().toLowerCase() !== DEMO_ACCOUNT.email || this.password() !== DEMO_ACCOUNT.password) {
      this.rejected.set(true);
      return;
    }
    void this.router.navigateByUrl('/tickets');
  }

  protected onMicrosoft(): void {
    void this.router.navigateByUrl('/tickets');
  }

  protected onReset(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (this.emailError()) return;
    this.submitted.set(false);
    this.view.set('sent');
  }
}
