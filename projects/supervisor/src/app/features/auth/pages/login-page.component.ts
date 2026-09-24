import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';
import {
  ScButtonComponent,
  ScDividerComponent,
  ScInputTextComponent,
  ScMessageComponent,
  ScPasswordComponent,
} from '@smartcontact-hub/components';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LoginArtComponent } from '../components/login-art.component';
import { emailProblem } from '../email-problem';

/** Estado de navegación con el que `top-bar` llega aquí al cerrar sesión. */
export interface LoginNavigationState {
  signedOut?: boolean;
}

/** Las vistas del panel. Todas viven en `/login`: son pasos del mismo acceso, no pantallas. */
export type LoginView = 'signin' | 'forgot' | 'forgot-sent';

/** «Contáctanos» lleva a la web pública de SmartContact (decisión de producto, 2026-09-14). */
const CONTACT_URL = 'https://www.smart-contact.com/contacto/';

/**
 * Pantalla de acceso del Supervisor (look & feel de SnowUI «Sign In - B», con marca
 * SmartContact y solo el SSO de Microsoft; piezas como el bloque «Login» de PrimeBlocks).
 *
 * Los errores se enseñan al ENVIAR, no mientras se escribe; a partir de ahí se
 * reevalúan en vivo para que el mensaje desaparezca en cuanto el campo queda bien.
 * El fallo de credenciales es UNO para los dos campos: decir cuál falla le diría a
 * cualquiera qué emails tienen cuenta. Por lo mismo, recuperar la contraseña nunca
 * confirma si la cuenta existe.
 */
@Component({
  selector: 'sc-login-page',
  imports: [
    LoginArtComponent,
    ScButtonComponent,
    ScDividerComponent,
    ScIconComponent,
    ScInputTextComponent,
    ScMessageComponent,
    ScPasswordComponent,
    TranslateModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  protected readonly year = new Date().getFullYear();
  protected readonly contactUrl = CONTACT_URL;

  /** La ilustración sigue al tema: la clara en claro y la oscura en oscuro. */
  protected readonly artSrc = computed(() =>
    this.theme.effectiveMode() === 'dark'
      ? '/illustrations/login-bg-dark.webp'
      : '/illustrations/login-bg-light.webp',
  );

  /** Quien entró en las últimas 48 h lee «Hola de nuevo» (`AuthService.isReturning`). */
  protected readonly greetingKey = this.auth.isReturning()
    ? 'auth.login.title_returning'
    : 'auth.login.title';

  protected readonly view = signal<LoginView>('signin');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly email = signal('');
  protected readonly password = signal('');

  /** `true` desde el primer envío de la vista actual: a partir de ahí se ven sus errores. */
  private readonly submitted = signal(false);

  protected readonly pending = signal<'password' | 'microsoft' | 'reset' | null>(null);
  protected readonly credentialsRejected = signal(false);
  protected readonly capsLockOn = signal(false);

  /** Aviso de «has cerrado sesión», solo al llegar desde el menú de usuario. */
  protected readonly signedOut = signal(
    (this.router.currentNavigation()?.extras.state as LoginNavigationState | undefined)
      ?.signedOut === true,
  );

  protected readonly emailError = computed(() =>
    this.submitted() ? emailProblem(this.email()) : null,
  );
  protected readonly passwordError = computed(() =>
    this.submitted() && this.password() === '' ? 'auth.login.errors.password_required' : null,
  );

  protected readonly passwordHelper = computed(() =>
    this.capsLockOn() ? 'auth.login.caps_lock_on' : null,
  );

  protected onEmailChange(value: string): void {
    this.email.set(value);
    this.credentialsRejected.set(false);
  }

  protected onPasswordChange(value: string): void {
    this.password.set(value);
    this.credentialsRejected.set(false);
  }

  /** `getModifierState` es la única fuente fiable de Bloq Mayús; se lee en cada tecla. */
  protected onPasswordKey(event: KeyboardEvent): void {
    if (typeof event.getModifierState === 'function') {
      this.capsLockOn.set(event.getModifierState('CapsLock'));
    }
  }

  /**
   * Cambia de vista y lleva el foco a su título: quien navega con teclado o lector
   * de pantalla se entera de que el panel ha cambiado. El email escrito se conserva.
   */
  protected go(view: LoginView): void {
    this.view.set(view);
    this.submitted.set(false);
    this.credentialsRejected.set(false);
    this.signedOut.set(false);
    setTimeout(() => this.heading()?.nativeElement.focus());
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.pending()) return;
    this.submitted.set(true);
    this.signedOut.set(false);

    if (this.emailError()) return this.focus('login-email');
    if (this.passwordError()) return this.focus('login-password');

    this.pending.set('password');
    const result = await this.auth.signInWithPassword(this.email(), this.password());
    this.pending.set(null);

    if (result === 'ok') {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    /* Se vacía la contraseña y se vuelve a «sin enviar»: si no, el campo vacío
     * gritaría «escribe tu contraseña» encima del aviso que de verdad importa. */
    this.credentialsRejected.set(true);
    this.submitted.set(false);
    this.password.set('');
    this.focus('login-password');
  }

  protected async onResetSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.pending()) return;
    this.submitted.set(true);
    if (this.emailError()) return this.focus('reset-email');

    this.pending.set('reset');
    await this.auth.requestPasswordReset(this.email());
    this.pending.set(null);
    this.go('forgot-sent');
  }

  protected async onMicrosoft(): Promise<void> {
    if (this.pending()) return;
    this.pending.set('microsoft');
    await this.auth.signInWithMicrosoft();
    this.pending.set(null);
    void this.router.navigateByUrl('/dashboard');
  }

  private focus(id: string): void {
    queueMicrotask(() => document.getElementById(id)?.focus());
  }
}
