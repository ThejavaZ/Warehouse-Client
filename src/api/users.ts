import { http } from "./http";
import type { PagedResult } from "../types/api";
import type {
  UserCreateDTO,
  UserListViewModel,
  UserQuery,
  UserUpdateDTO,
  UserViewModel,
} from "../types/user";

/** Endpoints de `/api/User`, todos con `[Authorize]`. */
export const usersApi = {
  /** Listado paginado; si llega `id` devuelve el detalle en su lugar. */
  list: (query: UserQuery = {}): Promise<PagedResult<UserListViewModel>> =>
    http.get<PagedResult<UserListViewModel>>("/User", { params: query }).then((r) => r.data),

  get: (id: number): Promise<UserViewModel> =>
    http.get<UserViewModel>("/User", { params: { id } }).then((r) => r.data),

  create: (dto: UserCreateDTO): Promise<UserViewModel> =>
    http.post<UserViewModel>("/User", dto).then((r) => r.data),

  /** `password` solo si se cambia: enviarlo vacío produce un 400. */
  update: (id: number, dto: UserUpdateDTO): Promise<UserViewModel> =>
    http.put<UserViewModel>(`/User/${id}`, dto).then((r) => r.data),

  /** Baja lógica (SoftDelete). 404 si ya estaba dado de baja. */
  remove: (id: number): Promise<void> =>
    http.delete<void>(`/User/${id}`).then(() => undefined),
};
