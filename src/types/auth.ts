/** Contratos del módulo Auth (espejo de `Api.Auth`). */

/** Respuesta de `POST /api/Auth/login` y `/refresh` (`AuthViewModel`). */
export interface AuthViewModel {
  accessToken: string;
  /** Segundos que quedan para que venza el access token. */
  expiresIn: number;
  tokenType: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  userId: number;
  email: string;
}

/** Cuerpo de `POST /api/Auth/login` (`LoginDTO`). */
export interface LoginDTO {
  email: string;
  password: string;
}
