/**
 * Contratos genéricos que devuelve la API (espejo de `Api.Common`).
 * Están en camelCase porque ASP.NET Core serializa así por defecto.
 */

/** Respuesta paginada de cualquier listado (`PagedResult<T>`). */
export interface PagedResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  previousPage: number | null;
  nextPage: number | null;
  items: T[];
}

/** Error genérico con ProblemDetails (RFC 7807). El campo `code` lo añade la API. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  /** Código de negocio estable: `not_found`, `validation_error`, `unauthorized`… */
  code?: string;
  /**
   * Campo al que se refiere el error, cuando la API lo sabe de un solo campo
   * (p. ej. un SKU duplicado). Va en `extensions`, no en `errors`.
   */
  field?: string;
  traceId?: string;
}

/**
 * ProblemDetails de validación: `errors` agrupa los mensajes por campo.
 * No siempre viene (p. ej. el correo duplicado es un `ProblemDetails` llano).
 */
export interface ValidationProblemDetails extends ProblemDetails {
  errors?: Record<string, string[]>;
}
