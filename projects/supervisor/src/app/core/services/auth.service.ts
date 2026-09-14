import { Injectable, signal } from '@angular/core';

/** Resultado de un intento de entrada con email y contraseña. */
export type SignInResult = 'ok' | 'invalid-credentials';

const STORAGE_KEY = 'sc-session';

/** Última entrada con éxito (epoch ms). En `localStorage`: tiene que sobrevivir a cerrar la pestaña. */
const LAST_SIGN_IN_KEY = 'sc-last-sign-in';

/** Cuánto dura el «de vuelta»: pasado este tiempo sin entrar, el saludo vuelve a ser el de siempre. */
export const RETURNING_WINDOW_MS = 48 * 60 * 60 * 1000;

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

  /**
   * ¿Entró alguien en este navegador en las últimas 48 h? Solo se guarda la HORA, ni el
   * email ni el nombre: en un puesto compartido no se delata quién estuvo. Si la marca
   * caducó, se borra, y el siguiente acceso empieza de cero.
   */
  isReturning(now = Date.now()): boolean {
    try {
      const last = Number(localStorage.getItem(LAST_SIGN_IN_KEY));
      if (!last) return false;
      if (now - last < RETURNING_WINDOW_MS && now >= last) return true;
      localStorage.removeItem(LAST_SIGN_IN_KEY);
    } catch {
      /* Almacenamiento bloqueado: se saluda como a alguien nuevo. */
    }
    return false;
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
      if (value) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        localStorage.setItem(LAST_SIGN_IN_KEY, String(Date.now()));
      }
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Almacenamiento bloqueado (ventana privada): la sesión vive solo en memoria. */
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
