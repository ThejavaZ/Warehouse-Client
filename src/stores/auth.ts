import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { authApi } from "../api/auth";
import { clearTokens, getRefreshToken, saveTokens } from "../api/http";
import type { AuthViewModel, LoginDTO } from "../types/auth";

/** Renueva el access token cuando quedan menos segundos que este margen. */
const REFRESH_MARGIN_SECONDS = 30;

/**
 * ViewModel de la sesión: todo el estado que la UI necesita para saber si hay
 * sesión, más las acciones que la cambian (login, refresh, logout).
 */
export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(null);
  const email = ref<string | null>(null);
  const userId = ref<number | null>(null);
  /** Caducidad del access token en milisegundos desde el epoch. */
  const expiresAt = ref<number | null>(null);
  /** true cuando ya se ha intentado restaurar la sesión al arrancar. */
  const restored = ref(false);
  /** true si se ha vuelto al login porque el token caducó (para avisar en la vista). */
  const sessionExpired = ref(false);

  const isAuthenticated = computed(() => accessToken.value !== null);

  let restorePromise: Promise<void> | null = null;
  let refreshTimer: number | null = null;

  /** Aplica una respuesta de login o de refresh y programa la renovación. */
  function applySession(session: AuthViewModel): void {
    saveTokens(session.accessToken, session.refreshToken);

    accessToken.value = session.accessToken;
    email.value = session.email;
    userId.value = session.userId;
    expiresAt.value = Date.now() + session.expiresIn * 1000;
    sessionExpired.value = false;

    scheduleRefresh(session.expiresIn);
  }

  function scheduleRefresh(expiresInSeconds: number): void {
    clearRefreshTimer();

    // Nunca menos de 5 s: con una ventana corta no se entra en bucle de refresh.
    const delay = Math.max(expiresInSeconds - REFRESH_MARGIN_SECONDS, 5) * 1000;
    refreshTimer = window.setTimeout(() => void refreshSession(), delay);
  }

  function clearRefreshTimer(): void {
    if (refreshTimer !== null) {
      window.clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  }

  function clearSession(): void {
    clearRefreshTimer();
    clearTokens();

    accessToken.value = null;
    email.value = null;
    userId.value = null;
    expiresAt.value = null;
  }

  async function login(dto: LoginDTO): Promise<void> {
    applySession(await authApi.login(dto));
  }

  /** Canjea el refresh token. Si ya no vale, se cierra la sesión en silencio. */
  async function refreshSession(): Promise<void> {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearSession();
      return;
    }

    try {
      applySession(await authApi.refresh(refreshToken));
    } catch {
      clearSession();
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    clearSession();

    if (refreshToken) {
      try {
        // Idempotente: la API responde 204 aunque el token ya no existiera.
        await authApi.revoke(refreshToken);
      } catch {
        // Sin conexión el cierre local ya se ha hecho; no se propaga.
      }
    }
  }

  /**
   * Lo llama el interceptor de la API ante un 401: el token ya no sirve.
   * La navegación la hace `main.ts`, para no acoplar este store al router.
   */
  function handleUnauthorized(): void {
    clearSession();
    sessionExpired.value = true;
  }

  /**
   * Restaura la sesión recargando con el refresh token guardado. Se ejecuta una
   * sola vez y en paralelo: los guards esperan a esta promesa.
   */
  function ensureRestored(): Promise<void> {
    if (restored.value) {
      return Promise.resolve();
    }

    restorePromise ??= (async () => {
      try {
        if (getRefreshToken()) {
          await refreshSession();
        }
      } finally {
        restored.value = true;
      }
    })();

    return restorePromise;
  }

  return {
    // estado
    accessToken,
    email,
    userId,
    expiresAt,
    restored,
    sessionExpired,
    isAuthenticated,
    // acciones
    login,
    logout,
    refreshSession,
    ensureRestored,
    handleUnauthorized,
  };
});
