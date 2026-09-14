import { Injectable, signal } from '@angular/core';

/** Resultado de un intento de entrada con email y contraseña. */
export type SignInResult = 'ok' | 'invalid-credentials';

const STORAGE_KEY = 'sc-session';

/**
 * Credenciales de la demo. El Supervisor no tiene backend: la pantalla de acceso
 * existe para enseñar el recorrido (entrar, equivocarse, recuperar, salir), así que
 * la sesión es un marcador en `sessionStorage` y la única cuenta que entra es esta.
 * Dominio `example.com`: reservado para ficción (RFC 2606, `audit:seed-pii`).
 */
export const DEMO_ACCOUNT = { email: 'supervisor@example.com', password: 'demo1234' } as const;

/** Lo que tarda la «red» simulada: lo justo para que el estado de carga se vea. */
const LATENCY_MS = 700;

/**
 * Sesión simulada del Supervisor.
 *
 * NO protege rutas: la app sigue abriéndose sin entrar, a propósito. Los cinco sitios
 * sirven `main` a desarrolladores y a enlaces pegados en Jira, y un guardia mandaría cada
 * enlace profundo al login. El día que haya backend, el guardia y el token viven aquí.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly signedIn = signal(this.read());

  async signInWithPassword(email: string, password: string): Promise<SignInResult> {
    await delay(LATENCY_MS);
    const ok =
      email.trim().toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;
    if (ok) this.write(true);
    return ok ? 'ok' : 'invalid-credentials';
  }

  /** En real, redirige a Microsoft Entra ID y vuelve con la sesión hecha. */
  async signInWithMicrosoft(): Promise<void> {
    await delay(LATENCY_MS);
    this.write(true);
  }

  /** En real, pide al backend el enlace de recuperación. Nunca dice si la cuenta existe. */
  async requestPasswordReset(_email: string): Promise<void> {
    await delay(LATENCY_MS);
  }

  signOut(): void {
    this.write(false);
  }

  private read(): boolean {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private write(value: boolean): void {
    this.signedIn.set(value);
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Almacenamiento bloqueado (ventana privada): la sesión vive solo en memoria. */
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
