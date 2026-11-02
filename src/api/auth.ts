import { http } from "./http";
import type { AuthViewModel, LoginDTO } from "../types/auth";
import type { UserCreateDTO, UserViewModel } from "../types/user";

/** Endpoints de `/api/Auth`. Solo `me` está detrás de `[Authorize]`. */
export const authApi = {
  /** Abre sesión y devuelve los tokens. 401 = credenciales incorrectas. */
  login: (dto: LoginDTO): Promise<AuthViewModel> =>
    http.post<AuthViewModel>("/Auth/login", dto).then((r) => r.data),

  /** Registra un usuario (no emite tokens: hay que llamar a `login` después). */
  register: (dto: UserCreateDTO): Promise<UserViewModel> =>
    http.post<UserViewModel>("/Auth/register", dto).then((r) => r.data),

  /** Canjea el refresh token por uno nuevo. Reutilizar el anterior da 401. */
  refresh: (refreshToken: string): Promise<AuthViewModel> =>
    http.post<AuthViewModel>("/Auth/refresh", { refreshToken }).then((r) => r.data),

  /** Logout. Siempre responde 204, incluso si el token no existe. */
  revoke: (refreshToken: string): Promise<void> =>
    http.post<void>("/Auth/revoke", { refreshToken }).then(() => undefined),

  /** Perfil del usuario del access token actual. */
  me: (): Promise<UserViewModel> => http.get<UserViewModel>("/Auth/me").then((r) => r.data),
};
