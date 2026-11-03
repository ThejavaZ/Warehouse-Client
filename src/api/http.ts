import axios, { AxiosError } from "axios";
import type { ValidationProblemDetails } from "../types/api";

const ACCESS_TOKEN_KEY = "warehouse.accessToken";
const REFRESH_TOKEN_KEY = "warehouse.refreshToken";

/**
 * Error normalizado de la API. Todo fallo HTTP se lanza como `ApiError`, de modo
 * que las vistas solo miran `status`, `code` y `fieldErrors` sin conocer axios.
 */
export class ApiError extends Error {
  readonly status: number;
  /** `code` de ProblemDetails: `not_found`, `validation_error`, `unauthorized`… */
  readonly code?: string;
  /** Campo al que se refiere el error, si la API lo indica (`field`). */
  readonly field?: string;
  /** Mensajes de validación agrupados por campo, si la API los envía. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    code?: string,
    fieldErrors: Record<string, string[]> = {},
    field?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.field = field;
  }
}

/**
 * Instancia única. `baseURL` es `/api` y el proxy de Vite la reenvía a la API
 * en desarrollo; en producción se puede apuntar a otro origen con
 * `VITE_API_BASE_URL`.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

/** Guarda los tokens de la sesión actual. `sessionStorage` se borra al cerrar la pestaña. */
export function saveTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

let unauthorizedHandler: (() => void) | null = null;

/**
 * Registra qué hacer cuando la API responde 401 con un token presente
 * (token caducado o revocado). Lo instala el store de sesión: limpiar tokens y
 * volver a `/login`.
 */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ValidationProblemDetails>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    const url = error.config?.url ?? "";

    // Un 401 en el login es "credenciales incorrectas", no una sesión caducada:
    // ahí no se limpia nada ni se navega, solo se muestra el mensaje.
    if (status === 401 && !url.includes("/Auth/login")) {
      clearTokens();
      unauthorizedHandler?.();
    }

    throw toApiError(status, body, error);
  },
);

function toApiError(
  status: number,
  body: ValidationProblemDetails | undefined,
  error: AxiosError,
): ApiError {
  // Sin respuesta: la API no está arrancada o no hay red.
  if (status === 0) {
    return new ApiError(
      0,
      "No se pudo contactar con la API. Comprueba que esté arrancada en el puerto 5259.",
    );
  }

  const field = body?.field;
  const errors = body?.errors ?? {};

  // La API tiene dos formatos de error por campo:
  //  - `errors`: validación de DataAnnotations, varios campos a la vez
  //  - `field`: un solo campo (SKU o correo duplicado, lanzado como
  //    ArgumentException). Si no se normaliza aquí, la vista solo tendría el
  //    mensaje general y no sabría debajo de qué input pintarlo.
  const fieldErrors =
    !field || Object.keys(errors).length > 0
      ? errors
      : { [field]: [body?.detail ?? body?.title ?? error.message] };

  return new ApiError(
    status,
    body?.detail ?? body?.title ?? error.message,
    body?.code,
    fieldErrors,
    field,
  );
}
