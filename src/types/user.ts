/**
 * Contratos del módulo Users (espejo de `Api.Users`).
 * `Password` solo existe en los DTOs de entrada: nunca vuelve de la API.
 */

/** Fila del listado (`UserListViewModel`). */
export interface UserListViewModel {
  id: number;
  uuid: string;
  name: string | null;
  email: string | null;
  isActive: boolean;
}

/** Detalle (`UserViewModel`): la fila anterior más timestamps. */
export interface UserViewModel extends UserListViewModel {
  createdAt: string;
  updatedAt: string;
}

/** Alta de usuario (`UserCreateDTO`). */
export interface UserCreateDTO {
  name: string;
  email: string;
  password: string;
}

/**
 * Actualización (`UserUpdateDTO`).
 * `password` es opcional: **hay que omitirlo** si no se quiere cambiar, porque
 * la API rechaza la cadena vacía con un 400 (`MinLength(8)`).
 */
export interface UserUpdateDTO {
  name: string;
  email: string;
  password?: string;
}

/** Parámetros de consulta de `GET /api/User` (`UserQuery`). */
export interface UserQuery {
  id?: number;
  /** Búsqueda case-insensitive por nombre o correo. */
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  orderDesc?: boolean;
}
