# Warehouse Cliente

Cliente web de la [Warehouse API](../Warehouse-API) construido con **Vue 3 + TypeScript + Vite + Tailwind CSS**, usando **bun** como gestor de paquetes.

Su propósito es probar los endpoints de la API desde una UI real: login con JWT, listado paginado de usuarios con filtros y CRUD completo.

---

## Requisitos

- [bun](https://bun.sh) 1.3 o superior (también vale `npm`/`pnpm`, pero el `bun.lock` está generado con bun)
- La API arrancada en `http://localhost:5259` (ver [Warehouse API](../Warehouse-API#puesta-en-marcha))

---

## Puesta en marcha

```bash
bun install    # instala dependencias
bun run dev    # arranca Vite en http://localhost:5173
```

En otra terminal, la API:

```bash
cd ../Warehouse-API
dotnet run --project src/Api
```

Abrir `http://localhost:5173` e iniciar sesión con un usuario de la API.

### Scripts

| Comando | Qué hace |
|---|---|
| `bun run dev` | Servidor de desarrollo con hot reload |
| `bun run build` | Compila tipos (`vue-tsc`) y genera `dist/` |
| `bun run preview` | Sirve `dist/` en local para revisar el build |

---

## Proxy a la API

En desarrollo **no hace falta configurar CORS en la API**: `vite.config.ts` reenvía `/api` al puerto 5259.

```ts
server: {
  proxy: {
    "/api": { target: "http://localhost:5259", changeOrigin: true },
  },
},
```

Por eso `src/api/http.ts` usa `baseURL: "/api"`. Para apuntar a otro origen (producción, otro entorno) se define `VITE_API_BASE_URL` en un fichero `.env` — ver [.env.example](.env.example).

---

## Arquitectura (MVVM)

Separación en tres capas, sin framework de MVVM: el patrón es una convención de organización.

```
src/
├── api/            # Model — cliente HTTP y un módulo por recurso
│   ├── http.ts     #   instancia axios, interceptores, tokens, ApiError
│   ├── auth.ts     #   /api/Auth
│   └── users.ts    #   /api/User
├── types/          # Contratos espejo de la API (DTOs y ViewModels)
├── stores/         # ViewModel — estado y acciones (Pinia)
│   ├── auth.ts     #   sesión: login, refresh programado, logout
│   └── users.ts    #   listado: filtros, paginación, CRUD
├── views/          # View — una página por ruta
├── components/     # UI reutilizable
├── layouts/        # Esqueleto con <RouterView />
└── router/         # Rutas + guards de sesión
```

| MVVM | Aquí |
|---|---|
| **Model** | `api/` + `types/`: la verdad vive en el servidor, el cliente solo tiene el cliente HTTP y los contratos espejo |
| **View** | el `<template>` de cada `.vue` |
| **ViewModel** | `stores/` (Pinia) y el `<script setup>`: exponen estado reactivo y acciones, sin lógica de negocio en la vista |

Regla práctica: **las vistas no llaman a axios directamente** (usan los módulos de `api/`) y **la API no se conoce en ningún sitio fuera de `api/` y `types/`**.

---

## Flujo de sesión

1. `POST /api/Auth/login` devuelve access token + refresh token.
2. Se guardan en `sessionStorage` (`warehouse.accessToken`, `warehouse.refreshToken`): sobreviven a recargar la pestaña y desaparecen al cerrarla.
3. Un interceptor monta `Authorization: Bearer` en cada petición.
4. El store programa un refresh con **30 segundos de margen** antes de que venza el access token.
5. Al recargar la página, los guards esperan a `ensureRestored()`, que canjea el refresh token antes de decidir si la ruta es accesible.
6. Un **401** (token caducado o revocado) limpia la sesión y manda al `/login`. En el login, un 401 significa *credenciales incorrectas* y no navega a ninguna parte.
7. `POST /api/Auth/revoke` cierra la sesión en el servidor (es idempotente).

### Rutas

| Ruta | Acceso |
|---|---|
| `/` | pública |
| `/login` | solo sin sesión (`guestOnly`) |
| `/users`, `/users/new`, `/users/:id/edit` | requieren sesión (`requiresAuth`) |

---

## Nota sobre `password` en la edición

`PUT /api/User/{id}` **rechaza `password: ""`** con un 400 (`MinLength(8)`). Para no cambiar la contraseña hay que **omitir el campo**, que es lo que hace `UserFormView`:

```ts
await usersApi.update(id, {
  name, email,
  ...(password ? { password } : {}),   // si está vacío, no viaja
});
```

---

## Manejo de errores

Todos los fallos HTTP se convierten en `ApiError` (`src/api/http.ts`) con:

- `status`: código HTTP (`0` = sin conexión con la API)
- `code`: código de negocio de ProblemDetails (`validation_error`, `not_found`, `conflict`…)
- `fieldErrors`: mensajes de validación agrupados por campo, que la vista pinta debajo de cada input
